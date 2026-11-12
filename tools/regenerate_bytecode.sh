#!/usr/bin/env bash
# Rebuild javap disassemblies directly from the original JAR (JDK required).
set -euo pipefail
JAR="${1:?Usage: regenerate_bytecode.sh ORIGINAL.jar [OUTPUT_DIR]}"
OUT="${2:-reverse-engineering/bytecode}"
mkdir -p "$OUT"
for class in RMIDlet a b c d e f g h i j k l m n o p q r; do
  javap -classpath "$JAR" -c -p -s "$class" > "$OUT/$class.txt"
done
printf 'Wrote 19 class disassemblies to %s\n' "$OUT"
