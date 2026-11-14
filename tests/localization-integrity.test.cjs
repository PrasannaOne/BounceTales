'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const EventEngine = require('../src/event-engine.js');
const directory = path.join(__dirname, '..', 'assets', 'original');
const files = fs.readdirSync(directory).filter(name => name.startsWith('lang.')).sort();
assert.equal(files.length, 11, 'all original language resources remain present');
for (const file of files) {
  const bytes = new Uint8Array(fs.readFileSync(path.join(directory, file)));
  const strings = EventEngine.parseLanguage(bytes);
  assert.equal(strings.length, 91, `${file} retains all 91 original string slots`);
  strings.forEach((value, index) => {
    assert.equal(typeof value, 'string', `${file}[${index}] is a string`);
    assert.ok(value.trim().length > 0, `${file}[${index}] is not empty`);
    assert.doesNotMatch(value, /[\uFFFD\u0000]/, `${file}[${index}] has no replacement/NUL character`);
  });
}
console.log(`Localization integrity: ${files.length} languages × 91 strings passed with no empty or corrupt entries`);
