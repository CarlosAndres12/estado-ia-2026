// Tests for tools/lib/align.mjs: chunk start offsets from word boundaries.
// Run: node --test tools/test/align.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { alignChunks, words } from '../lib/align.mjs';

// Word boundaries as Edge reports them: one per word, in seconds from the clip start.
function boundaries(text, { start = 0.1, step = 0.4 } = {}) {
  return text.split(' ').map((t, i) => ({ text: t, start: start + i * step, dur: step * 0.8 }));
}

test('words() folds case, accents and punctuation', () => {
  assert.deepEqual(words('¿Según «la» ENCUESTA, mackínsi… 88?'), ['segun', 'la', 'encuesta', 'mackinsi', '88']);
  assert.deepEqual(words(''), []);
});

test('each chunk starts at its first word', () => {
  const chunks = ['Según la encuesta de mackínsi,', 'el ochenta y ocho por ciento usa i a.'];
  const heard = boundaries('Según la encuesta de mackínsi el ochenta y ocho por ciento usa i a');
  const out = alignChunks(chunks, heard, { duration: 6 });
  assert.equal(out.valid, true);
  assert.deepEqual(out.missing, []);
  assert.equal(out.offsets[0], 0);
  assert.equal(out.offsets[1], heard[5].start);
  assert.equal(out.matched, out.expected);
});

test('a boundary that holds two words still aligns ("i a")', () => {
  const chunks = ['usa i a', 'todos los días'];
  const heard = [
    { text: 'usa', start: 0.1 }, { text: 'i a', start: 0.5 }, { text: 'todos', start: 1.1 },
    { text: 'los', start: 1.4 }, { text: 'días', start: 1.6 }
  ];
  assert.deepEqual(alignChunks(chunks, heard, { duration: 2.5 }).offsets, [0, 1.1]);
});

test('a say text that differs from the chunks still finds the chunk starts', () => {
  const chunks = ['proteger datos y propiedad intelectual;', 'diseñar y supervisar flujos humano i a;', 'documentar decisiones.'];
  const heard = boundaries('proteger datos y propiedad intelectual diseñar y supervisar flujos entre personas e i a documentar decisiones');
  const out = alignChunks(chunks, heard, { duration: 8 });
  assert.equal(out.valid, true);
  assert.deepEqual(out.missing, []);
  assert.equal(out.offsets[1], heard[5].start);   // "diseñar"
  assert.equal(out.offsets[2], heard[14].start);  // "documentar"
  assert.ok(out.matched < out.expected);
});

test('a chunk the voice skipped is interpolated and reported as missing', () => {
  const chunks = ['uno dos', 'tres cuatro', 'cinco seis'];
  const heard = boundaries('uno dos cinco seis', { start: 0, step: 1 });
  const out = alignChunks(chunks, heard, { duration: 5 });
  assert.deepEqual(out.missing, [1]);
  assert.equal(out.offsets[2], 2);
  assert.equal(out.offsets[1], 1); // halfway between chunk 0 (0 s) and chunk 2 (2 s), by word count
  assert.equal(out.valid, true);
});

test('trailing missing chunks are spread up to the clip end', () => {
  const out = alignChunks(['uno dos', 'tres cuatro'], boundaries('uno dos', { start: 0, step: 1 }), { duration: 4 });
  assert.deepEqual(out.missing, [1]);
  assert.equal(out.offsets[1], 2);
});

test('no boundaries at all: every chunk after the first is missing and offsets stay ordered', () => {
  const out = alignChunks(['uno', 'dos', 'tres'], [], { duration: 3 });
  assert.deepEqual(out.missing, [1, 2]);
  assert.deepEqual(out.offsets, [0, 1, 2]);
  assert.equal(out.valid, true);
  assert.equal(alignChunks(['uno', 'dos'], [], {}).valid, false); // no clip length to spread over
});

test('a single chunk always starts at 0', () => {
  const out = alignChunks(['solo una frase'], boundaries('solo una frase'), { duration: 2 });
  assert.deepEqual(out.offsets, [0]);
  assert.equal(out.valid, true);
});
