#!/usr/bin/env python3
"""Safely merge a complete Bounce Tales project ZIP into the checked-out repository.

Archive files replace project files at the same relative path; repository-only files
are preserved. The repository's importer and GitHub Actions workflow are protected
from archive replacement. Nothing is recursively deleted. Bounce.zip is removed
only after every archive file has been copied successfully.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import shutil
import stat
import tempfile
import zipfile

MAX_ENTRIES = 30_000
MAX_UNCOMPRESSED = 600 * 1024 * 1024
MAX_FILE_SIZE = 100 * 1024 * 1024
MAX_RATIO = 250
EXCLUDED_TOP_LEVEL = {".git"}
PROTECTED_FILES = {
    "tools/import_runtime_zip.py",
    ".github/workflows/import-bounce-zip.yml",
}
REQUIRED_FILES = {
    "index.html", "style.css", "game.js", "sw.js", "manifest.webmanifest",
    "package.json", "README.md", "ARCHITECTURE.md", "LICENSE",
}
REQUIRED_DIRS = {"assets", "src", "tests", "docs", "tools", ".github"}


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
    if parts[0] in EXCLUDED_TOP_LEVEL:
        raise ValueError(f"Archive must not contain repository metadata: {raw!r}")
    mode = info.external_attr >> 16
    kind = stat.S_IFMT(mode)
    if kind not in (0, stat.S_IFREG, stat.S_IFDIR):
        raise ValueError(f"Special files and symlinks are not allowed: {raw!r}")
    if is_dir and kind not in (0, stat.S_IFDIR):
        raise ValueError(f"Directory entry has invalid file type: {raw!r}")
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
            raise ValueError("ZIP expands beyond the 600 MiB safety limit")
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
    raise ValueError("Project ZIP must contain index.html at its root, optionally inside one enclosing folder")


def validate_project(archive: zipfile.ZipFile, entries: dict[str, tuple[zipfile.ZipInfo, bool]], prefix: str) -> None:
    missing = sorted(name for name in REQUIRED_FILES if prefix + name not in entries or entries[prefix + name][1])
    for directory in REQUIRED_DIRS:
        if not any(name.startswith(prefix + directory + "/") and not is_dir for name, (_, is_dir) in entries.items()):
            missing.append(directory + "/")
    if missing:
        raise ValueError("Full project ZIP is incomplete; missing: " + ", ".join(missing))

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

    worker = read_text("sw.js")
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


def should_skip(relative: str) -> bool:
    parts = pathlib.PurePosixPath(relative).parts
    if relative in PROTECTED_FILES:
        return True
    if "__pycache__" in parts or relative.endswith((".pyc", ".pyo")):
        return True
    return False


def merge_project(archive: zipfile.ZipFile, entries: dict[str, tuple[zipfile.ZipInfo, bool]], prefix: str, destination: pathlib.Path) -> int:
    copied = 0
    with tempfile.TemporaryDirectory(prefix="bounce-project-stage-") as temp:
        staging = pathlib.Path(temp)
        for name, (info, is_dir) in entries.items():
            if not name.startswith(prefix):
                continue
            relative = name[len(prefix):]
            if not relative or relative == "Bounce.zip" or should_skip(relative):
                continue
            if relative.split("/", 1)[0] in EXCLUDED_TOP_LEVEL:
                continue
            target = staging / relative
            if is_dir:
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info, "r") as source, target.open("xb") as output:
                shutil.copyfileobj(source, output)

        # Overlay files individually. This deliberately preserves repository-only files.
        for source in sorted(staging.rglob("*")):
            relative = source.relative_to(staging)
            target = destination / relative
            if source.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            copied += 1
    return copied


def main() -> int:
    parser = argparse.ArgumentParser(description="Safely merge a complete Bounce Tales project ZIP")
    parser.add_argument("archive", type=pathlib.Path)
    parser.add_argument("destination", type=pathlib.Path)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    archive_path, destination = args.archive.resolve(), args.destination.resolve()
    if not archive_path.is_file():
        raise SystemExit(f"Archive not found: {archive_path}")
    with zipfile.ZipFile(archive_path) as archive:
        entries = inspect_archive(archive)
        prefix = locate_root(entries)
        validate_project(archive, entries, prefix)
        if args.validate_only:
            print(f"Full-project ZIP validation passed: {len(entries)} entries; project root={prefix or '/'}")
            return 0
        destination.mkdir(parents=True, exist_ok=True)
        copied = merge_project(archive, entries, prefix, destination)
    # Remove the upload only after validation and the complete overlay have succeeded.
    archive_path.unlink()
    print(f"Full project merged: {copied} files copied; protected workflow/importer preserved; repository-only files preserved; no recursive deletions; Bounce.zip removed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, zipfile.BadZipFile, ValueError) as error:
        raise SystemExit(f"Full-project ZIP import rejected: {error}")
