# Build and reverse-engineering notes

The supplied JAR identifies `RMIDlet` version 2.0.3 and targets CLDC 1.1 / MIDP 2.0 with Nokia platform extensions. Its obfuscated Java classes are preserved under `assets/original/` and listed in `bytecode/`. The binary resources and language files were extracted unchanged from the user-supplied JAR.

The browser build currently implements a standalone HTML5 training stage. It does not execute the JAR, embed a Java ME emulator, or claim to decode the original stage data. The next engineering milestone is to map the original level/resource formats and translate the original gameplay state machine into JavaScript, then compare each mechanic against a reference run.

A public reverse-engineering project was consulted as research context: https://github.com/Wafer-EX/BounceTalesReversed. Its README states that its source is Apache-2.0 licensed while the game resources remain separately rights-reserved. No source files from that project are bundled in this browser prototype.
