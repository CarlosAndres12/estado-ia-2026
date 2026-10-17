// Tests for tools/lib/voice-layout.mjs: engine detection and the fallback chunking and timing rules
// (prompt §6.2, §6.4–§6.6). Run: node --test tools/test/voice-layout.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { loadVoiceData, createLayout, fallbackChunk, timeChunks, C } from '../lib/voice-layout.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const video = {
  id: 'v99', title: 'Prueba', rate: '0%',
  chapters: [{ title: 'Uno', from: 'a' }, { title: 'Dos', from: 'b' }],
  scenes: [
    { id: 'a', min: 5, lines: [
      { voice: 'narrador', text: 'Primera línea, con una coma.' },
      { voice: 'lectora', text: '¿Segunda?', pause: 3 }
    ] },
    { id: 'b', min: 20, lines: [{ voice: 'narrador', text: 'Tercera línea.' }] }
  ],
  checkpoints: [{ after: 'a', question: '¿?', options: ['x', 'y'], answer: 0 }]
};

test('the fallback stands in while the engine modules are stubs', async () => {
  const EIA = await loadVoiceData({ root: ROOT });
  assert.equal(EIA.data.videos.length, 9);
  const layout = createLayout(EIA);
  assert.ok(['engine', 'fallback'].includes(layout.source));
  assert.equal(createLayout({ engine: {} }).source, 'fallback');
});

test('the engine is used as soon as timeline.build, toManifest and captions.chunk exist', () => {
  const calls = [];
  const EIA = { engine: {
    captions: { chunk: (text) => ['<' + text + '>'] },
    timeline: {
      C: { WPS_DRY_RUN: 2.3 },
      build: (v, opts) => { calls.push(opts); return { id: v.id }; },
      toManifest: (tl, opts) => ({ file: opts.file, id: tl.id })
    }
  } };
  const layout = createLayout(EIA);
  assert.equal(layout.source, 'engine');
  assert.deepEqual(layout.chunk('hola'), ['<hola>']);
  const tl = layout.build(video, { lineDurations: { 'a:0': 2 } });
  assert.equal(calls[0].glosario, false);
  assert.deepEqual(calls[0].lineDurations, { 'a:0': 2 });
  assert.deepEqual(layout.toManifest(tl, { file: 'f.mp3' }), { file: 'f.mp3', id: 'v99' });
});

test('fallback chunks: at most 2 × 50 characters, sentence by sentence, never after a function word', () => {
  const line = 'Vamos a recorrer el estado de la IA en seis paradas: capacidad técnica; economía y adopción; ' +
    'trabajo y educación; ciencia y salud; riesgo y gobernanza; y, al final, la agenda 2026–2028.';
  const chunks = fallbackChunk(line);
  assert.ok(chunks.length >= 2);
  assert.equal(chunks.join(' '), line);
  for (const c of chunks) {
    assert.ok(c.length <= C.CHARS_PER_LINE * C.MAX_LINES, c);
    assert.doesNotMatch(c, /\s(de|la|el|y|en)$/, c);
  }
  assert.deepEqual(fallbackChunk('Mide uso declarado: lo que las organizaciones dicen hacer. Es la punta del iceberg.'),
    ['Mide uso declarado: lo que las organizaciones dicen hacer.', 'Es la punta del iceberg.']);
  const money = fallbackChunk('En 2025, la inversión privada en IA llegó a 344.700 millones de dólares, 127,5% más que el año anterior, según el informe.');
  assert.ok(money.every((c) => !/344\.700$/.test(c)), money.join(' | '));
  assert.deepEqual(fallbackChunk(''), []);
});

test('fallback timeline: lead, lines, gaps, pauses and tail; min; 6 s checkpoints; chapters', () => {
  const layout = createLayout({});
  const tl = layout.build(video, { lineDurations: { 'a:0': 2, 'a:1': 1.5, 'b:0': 1 } });
  // scene a: 0.6 + 2 + 0.5 + 1.5 + 3 (pause) + 1.2 = 8.8 > min 5
  assert.equal(tl.scenes[0].start, 0);
  assert.ok(Math.abs(tl.scenes[0].dur - 8.8) < 1e-9);
  assert.ok(Math.abs(tl.lines[0].start - 0.6) < 1e-9);
  assert.ok(Math.abs(tl.lines[1].start - 3.1) < 1e-9);
  assert.equal(tl.lines[1].voice, 'lectora');
  // checkpoint after scene a: a silent 6 s segment
  assert.ok(Math.abs(tl.checkpoints[0].start - 8.8) < 1e-9);
  assert.equal(tl.checkpoints[0].dur, C.CHECKPOINT);
  // scene b: min 20 wins over 0.6 + 1 + 1.2
  assert.ok(Math.abs(tl.scenes[1].start - 14.8) < 1e-9);
  assert.equal(tl.scenes[1].dur, 20);
  assert.ok(Math.abs(tl.duration - 34.8) < 1e-9);
  assert.deepEqual(tl.chapters.map((c) => [c.title, c.start]), [['Uno', 0], ['Dos', tl.scenes[1].start]]);
});

test('chunk times use the aligned offsets when they are valid, else character count', () => {
  assert.deepEqual(timeChunks(['ab', 'cd'], 10, 14, [0, 1.5]),
    [{ text: 'ab', start: 10, end: 11.5 }, { text: 'cd', start: 11.5, end: 14 }]);
  assert.deepEqual(timeChunks(['aaa', 'b'], 0, 4, [0, 9]),
    [{ text: 'aaa', start: 0, end: 3 }, { text: 'b', start: 3, end: 4 }]);
  const layout = createLayout({});
  const tl = layout.build(video, {
    lineDurations: { 'a:0': 2, 'a:1': 1.5, 'b:0': 1 },
    chunk: (text) => (text.startsWith('Primera') ? ['Primera línea,', 'con una coma.'] : [text]),
    chunkOffsets: { 'a:0': [0, 1.25] }
  });
  assert.deepEqual(tl.lines[0].chunks.map((c) => c.text), ['Primera línea,', 'con una coma.']);
  assert.ok(Math.abs(tl.lines[0].chunks[1].start - (0.6 + 1.25)) < 1e-9);
});

test('the manifest entry has the contract shape (odd/spec/contracts.md §2)', () => {
  const layout = createLayout({});
  const tl = layout.build(video, { lineDurations: [2, 1.5, 1] });
  const entry = layout.toManifest(tl, { file: 'assets/audio/v99.mp3' });
  assert.deepEqual(Object.keys(entry), ['file', 'duration', 'chapters', 'scenes', 'lines', 'checkpoints']);
  assert.equal(entry.file, 'assets/audio/v99.mp3');
  assert.equal(entry.duration, 34.8);
  assert.deepEqual(entry.scenes[0], { id: 'a', start: 0, dur: 8.8 });
  assert.deepEqual(Object.keys(entry.lines[0]), ['scene', 'index', 'start', 'dur', 'chunks']);
  assert.deepEqual(entry.lines[2], { scene: 'b', index: 0, start: 15.4, dur: 1, chunks: [{ text: 'Tercera línea.', start: 15.4, end: 16.4 }] });
  assert.deepEqual(entry.checkpoints, [{ after: 'a', start: 8.8, dur: 6 }]);
});
