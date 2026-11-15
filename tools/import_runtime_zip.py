#!/usr/bin/env python3
"""Safely import the playable runtime from Bounce.zip without touching project records."""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import shutil
import stat
import tempfile
import zipfile

ROOT_FILES = {
    "index.html", "style.css", "game.js", "sw.js", "manifest.webmanifest",
    "favicon.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png",
    "bounce-tales-web-preview.png",
}
RUNTIME_DIRS = {"assets", "src"}
REQUIRED_FILES = ROOT_FILES
REQUIRED_MODULES = {"src/control-layout.js", "src/original-hud.js", "src/module-registry.js", "src/port-engine.js"}
MIN_RUNTIME_VERSION = 49
MAX_ENTRIES = 20_000
MAX_UNCOMPRESSED = 500 * 1024 * 1024
MAX_FILE_SIZE = 100 * 1024 * 1024
MAX_RATIO = 250


def normalized_name(info: zipfile.ZipInfo) -> tuple[str, bool]:
    raw = info.filename
    if "\\" in raw or "\x00" in raw:
        raise ValueError(f"Invalid ZIP path: {raw!r}")
    is_dir = info.is_dir() or raw.endswith("/")
    name = raw[:-1] if is_dir else raw
    if not name or name.startswith("/") or re.match(r"^[A-Za-z]:", name):
        raise ValueError(f"Absolute or empty ZIP path: {raw!r}")
    parts = name.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise ValueError(f"Unsafe ZIP path segment: {raw!r}")
    mode = info.external_attr >> 16
    kind = stat.S_IFMT(mode)
    if kind not in (0, stat.S_IFREG, stat.S_IFDIR):
        raise ValueError(f"Special files and symlinks are not allowed: {raw!r}")
    if is_dir and kind not in (0, stat.S_IFDIR):
        raise ValueError(f"Directory entry has an invalid file type: {raw!r}")
    if not is_dir and kind == stat.S_IFDIR:
        raise ValueError(f"File entry has directory mode: {raw!r}")
    return name, is_dir


def inspect_archive(archive: zipfile.ZipFile) -> dict[str, tuple[zipfile.ZipInfo, bool]]:
    entries: dict[str, tuple[zipfile.ZipInfo, bool]] = {}
    folded: set[str] = set()
    total = 0
    infos = archive.infolist()
    if len(infos) > MAX_ENTRIES:
        raise ValueError(f"ZIP contains too many entries ({len(infos)} > {MAX_ENTRIES})")
    for info in infos:
        name, is_dir = normalized_name(info)
        key = name.casefold()
        if key in folded:
            raise ValueError(f"Duplicate or case-colliding ZIP path: {name}")
        folded.add(key)
        if info.flag_bits & 0x1:
            raise ValueError(f"Encrypted ZIP entries are not supported: {name}")
        if info.file_size > MAX_FILE_SIZE:
            raise ValueError(f"ZIP entry is too large: {name}")
        total += info.file_size
        if total > MAX_UNCOMPRESSED:
            raise ValueError("ZIP expands beyond the 500 MiB safety limit")
        if info.file_size and info.compress_size == 0:
            raise ValueError(f"Invalid compressed size: {name}")
        if info.compress_size and info.file_size / info.compress_size > MAX_RATIO:
            raise ValueError(f"Suspicious compression ratio: {name}")
        entries[name] = (info, is_dir)
    return entries


def locate_root(entries: dict[str, tuple[zipfile.ZipInfo, bool]]) -> str:
    if "index.html" in entries:
        return ""
    top = {name.split("/", 1)[0] for name in entries}
    if len(top) == 1:
        wrapper = next(iter(top))
        if f"{wrapper}/index.html" in entries:
            return wrapper + "/"
    raise ValueError("ZIP must contain index.html at its root, optionally inside one enclosing folder")


def validate_runtime(archive: zipfile.ZipFile, entries: dict[str, tuple[zipfile.ZipInfo, bool]], prefix: str) -> None:
    missing = sorted(prefix + name for name in REQUIRED_FILES if prefix + name not in entries or entries[prefix + name][1])
    for directory in RUNTIME_DIRS:
        if not any(name.startswith(prefix + directory + "/") and not is_dir for name, (_, is_dir) in entries.items()):
            missing.append(prefix + directory + "/")
    if missing:
        raise ValueError("Runtime ZIP is incomplete; missing: " + ", ".join(missing))

    def read_text(name: str) -> str:
        try:
            return archive.read(entries[prefix + name][0]).decode("utf-8")
        except (KeyError, UnicodeDecodeError) as exc:
            raise ValueError(f"Cannot read required UTF-8 file: {name}") from exc

    try:
        manifest = json.loads(read_text("manifest.webmanifest"))
    except json.JSONDecodeError as exc:
        raise ValueError("manifest.webmanifest is not valid JSON") from exc
    for icon in manifest.get("icons", []):
        src = icon.get("src", "")
        path = pathlib.PurePosixPath(src)
        if not src or path.is_absolute() or ".." in path.parts or prefix + src not in entries:
            raise ValueError(f"Manifest icon missing or unsafe in ZIP: {src}")

    html = read_text("index.html")
    worker = read_text("sw.js")
    html_versions = re.findall(r"(?:style\.css|game\.js|sw\.js)\?v=(\d+)", html)
    cache_match = re.search(r"CACHE_NAME\s*=\s*['\"]bounce-tales-v(\d+)['\"]", worker)
    if not html_versions or not cache_match:
        raise ValueError("Runtime ZIP has no recognizable versioned HTML/service-worker cache identity")
    runtime_version = int(cache_match.group(1))
    if runtime_version < MIN_RUNTIME_VERSION or any(int(version) != runtime_version for version in html_versions):
        raise ValueError(f"Stale or inconsistent runtime version: HTML={html_versions}, service worker={runtime_version}; minimum supported is V{MIN_RUNTIME_VERSION}")
    for module in REQUIRED_MODULES:
        if prefix + module not in entries or entries[prefix + module][1]:
            raise ValueError(f"Runtime ZIP is missing required V{MIN_RUNTIME_VERSION}+ module: {module}")

    match = re.search(r"const APP_SHELL = (\[[\s\S]*?\]);", worker)
    if not match:
        raise ValueError("sw.js does not declare an APP_SHELL list")
    try:
        app_shell = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise ValueError("sw.js APP_SHELL is not valid JSON") from exc
    for item in app_shell:
        if item == "./":
            continue
        clean = item.split("?", 1)[0]
        path = pathlib.PurePosixPath(clean)
        if path.is_absolute() or ".." in path.parts or not clean:
            raise ValueError(f"Unsafe service-worker path: {item}")
        entry = prefix + clean
        if entry not in entries or entries[entry][1]:
            raise ValueError(f"Service-worker asset missing from ZIP: {item}")


def extract_selected(archive: zipfile.ZipFile, entries: dict[str, tuple[zipfile.ZipInfo, bool]], prefix: str, staging: pathlib.Path) -> None:
    for name, (info, is_dir) in entries.items():
        if not name.startswith(prefix):
            continue
        relative = name[len(prefix):]
        if not relative:
            continue
        top = relative.split("/", 1)[0]
        if top not in ROOT_FILES and top not in RUNTIME_DIRS:
            continue
        target = staging / relative
        if is_dir:
            target.mkdir(parents=True, exist_ok=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        with archive.open(info, "r") as source, target.open("xb") as destination:
            shutil.copyfileobj(source, destination)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=pathlib.Path)
    parser.add_argument("destination", type=pathlib.Path)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    archive_path = args.archive.resolve()
    destination = args.destination.resolve()
    if not archive_path.is_file():
        raise SystemExit(f"Archive not found: {archive_path}")
    with zipfile.ZipFile(archive_path) as archive:
        entries = inspect_archive(archive)
        prefix = locate_root(entries)
        validate_runtime(archive, entries, prefix)
        if args.validate_only:
            print(f"ZIP validation passed: {len(entries)} entries; runtime root={prefix or '/'}")
            return 0
        destination.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="bounce-runtime-") as temp:
            staging = pathlib.Path(temp)
            extract_selected(archive, entries, prefix, staging)
            # Apply only the explicit runtime allowlist. Project docs, tests, research,
            # license, GitHub workflows and repository metadata are never in scope.
            for name in ROOT_FILES:
                source = staging / name
                if source.is_file():
                    shutil.copy2(source, destination / name)
            for name in RUNTIME_DIRS:
                source = staging / name
                if source.is_dir():
                    target = destination / name
                    if target.exists():
                        shutil.rmtree(target)
                    shutil.copytree(source, target)

            # Keep repository metadata aligned with the imported runtime release.
            worker = (destination / "sw.js").read_text(encoding="utf-8")
            version_match = re.search(r"CACHE_NAME\s*=\s*['\"]bounce-tales-v(\d+)['\"]", worker)
            package_path = destination / "package.json"
            if version_match and package_path.is_file():
                package = json.loads(package_path.read_text(encoding="utf-8"))
                package["version"] = f"{version_match.group(1)}.0.0"
                package_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
    archive_path.unlink()
    print("Runtime imported successfully; Bounce.zip removed after validation and copy.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, zipfile.BadZipFile, ValueError) as error:
        raise SystemExit(f"Runtime ZIP import rejected: {error}")
