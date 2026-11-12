# Reverse-engineering pass · Build 03

- Exact input normalization and gameplay dispatch recovered from the original JAR.
- Active game controls traced: left, right, primary actor action, actor mode cycle (`*`) and pause-menu event (Nokia key `-7`).
- `#` is not used by the active gameplay branch traced, so it is not treated as a required game button.
- Pause-menu localized strings recovered: Pause menu, Resume, Restart chapter, Chapter selection.
- 16 RLEF binary resources inventoried by signature and leading header values.
- Three-mode actor parameter arrays recovered from `c.class`.
- All 106 JAR files verified byte-for-byte in `assets/original/`.

Full evidence and caveats: [`reverse-engineering/`](reverse-engineering/). The HTML game is still a prototype; original gameplay has not yet been fully rebuilt.
