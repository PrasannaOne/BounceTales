# Original JAR resource audit

## Byte-for-byte preservation

The extracted `assets/original/` directory was compared against every non-directory entry in the supplied JAR. **All 106 archive files match by SHA-256**, including all 19 `.class` files, the manifest, images, MIDI, language data and binary payloads. No missing files and no byte mismatches were found. See `asset-inventory.csv` and `resource-sha256.csv` for the full hashes.

## Resource counts

| Kind | Count |
|---|---:|
| PNG images | 47 |
| MIDI files | 8 |
| Java class files | 19 |
| Language resources | 11 |
| Other/binary resources | 21 |
| **Total** | **106** |

`o` allocates an `Image[46]` for the game's image-resource set; the JAR contains 47 PNGs in total, with `icon.png` serving as the MIDlet icon. This agrees with the code/resource counts.

## RLEF binary payloads

Sixteen resources (`bf` through `bu`) begin with the literal ASCII magic `RLEF`. All have version field `1` and reserved field `0` in the first eight bytes. At offsets 8 and 10, big-endian unsigned-short values form the following header pair; offset 12 is another 16-bit field:

| Resource | Header pair | Offset-12 value | Size (bytes) |
|---|---:|---:|---:|
| `bf` | 101 × 33 | 6 | 4,977 |
| `bg` | 146 × 45 | 20 | 7,494 |
| `bh` | 159 × 58 | 17 | 8,942 |
| `bi` | 108 × 30 | 15 | 5,232 |
| `bj` | 139 × 46 | 21 | 6,596 |
| `bk` | 185 × 79 | 24 | 10,146 |
| `bl` | 176 × 64 | 27 | 7,950 |
| `bm` | 173 × 66 | 32 | 8,643 |
| `bn` | 189 × 62 | 48 | 7,738 |
| `bo` | 256 × 110 | 47 | 12,002 |
| `bp` | 157 × 55 | 26 | 6,266 |
| `bq` | 160 × 60 | 15 | 6,649 |
| `br` | 109 × 52 | 12 | 6,176 |
| `bs` | 56 × 14 | 0 | 2,085 |
| `bt` | 113 × 37 | 6 | 3,792 |
| `bu` | 13 × 12 | 0 | 1,091 |

The dimensions are consistent with grid/map extents, but the remaining payload structure and the exact meaning of the offset-12 field have not yet been fully decoded. These files should be treated as original structured game data, not as generic images or replaced by hand-built platform arrays.

## MIDI metadata

The eight MIDI resources are:

| File | Format | Tracks | Ticks per quarter note | Size |
|---|---:|---:|---:|---:|
| `aw.mid` | 1 | 17 | 96 | 5,257 |
| `ax.mid` | 0 | 1 | 960 | 5,433 |
| `ay.mid` | 0 | 1 | 960 | 2,671 |
| `az.mid` | 0 | 1 | 960 | 3,273 |
| `ba.mid` | 0 | 1 | 960 | 1,514 |
| `bb.mid` | 1 | 17 | 96 | 1,184 |
| `bc.mid` | 1 | 17 | 960 | 992 |
| `bd.mid` | 0 | 1 | 960 | 2,937 |

The runtime has two Java ME `Player` fields and creates/starts players through `Manager.createPlayer`, with prefetch, loop-count, control and cleanup calls. Which track is the title theme, level theme or individual sound remains to be mapped.

## Localization and persistence

- The JAR includes 11 language resources. `q` selects `/lang.` plus the `microedition.locale` property and falls back to `/lang.xx` if that resource is absent.
- The string resource reader indexes an offset table and reads the selected string with `DataInputStream.readUTF`.
- The runtime calls `javax.microedition.rms.RecordStore.openRecordStore`, `getNumRecords`, `getRecord`, `addRecord`, `setRecord` and `closeRecordStore`. A browser port therefore needs a deliberate save/progression migration rather than relying on the old Java ME storage API.

## Unclassified resources

The remaining opaque files `a`, `b`, `be` and `bv` are retained exactly and listed with hashes. Their structures have not yet been conclusively identified.
