# V18 decoded reference fixtures

These files were generated from the private Phase 2 decoded reference archive supplied for this project and retained unchanged from V17.

- `../src/sprite-atlas.json` is the verified 326-entry static sprite descriptor table. The browser loads it and draws static sprite IDs 0–325 from its PNG crop rectangles and draw offsets.
- `animations.json` contains the 316 type-6 animation records and all 1,143 sequence byte streams extracted from the original 16 RLEF level resources.
- `decoded-levels/` contains the decoded record headers and polygon payloads for the 16 original RLEF resources (`bf`–`bu`). These are regression fixtures, not a second runtime level source.
- `original-resource-sha256.json` records hashes for all 105 extracted original resources and is used to verify that the deploy package's `assets/original/` files are byte-identical.
- `../assets/original/` remains the browser runtime's source for the original binary RLEF resources. The event engine executes the original command streams parsed from those resources.

`tests/reference-parity.test.cjs` compares the browser parser with these fixtures. It verifies all 2,240 object headers, 490 polygons, 5,776 polygon vertices, 4,306 triangles, and 316 type-6 objects / 1,143 exact sequence streams.

The reference package's extraction metadata is retained in the private archive. This public deploy package does not include decompiled Java source or the original JAR.
