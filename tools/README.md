# Tooling
- `build_reference.py`: standard-library JAR inventory and searchable metadata.
- `inspect_bounce_jar.py`: retained V15 asset-copy verifier.
- `regenerate_bytecode.sh`: retained helper; review before running.
Use CFR privately for class decompilation. Never commit the CFR binary, original JAR or decompiled copyrighted source to this public repository.

- `import_runtime_zip.py`: validates an uploaded `Bounce.zip`, imports the allowlisted runtime files and replaces the versioned `assets/` and `src/` runtime trees. It merges root-level `tests/*.cjs` by filename without deleting repository-only tests; README, architecture, licence, docs and workflow files are not imported.
