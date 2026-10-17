// Subtitle chunking, chunk timing and the canvas draw functions (prompt §6.4, §6.5, §6.6),
// evaluated in a Node vm sandbox with no window and no document, as the tools do.
//
//   node --test tools/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function load(files) {
  const sandbox = { console };
  vm.createContext(sandbox);
  for (const file of files) {
    vm.runInContext(readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return sandbox.EIA;
}

const BOTH = ['js/core/namespace.js', 'js/engine/timeline.js', 'js/engine/captions.js'];

function near(actual, expected, msg, eps = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= eps, `${msg}: expected ${expected}, got ${actual}`);
}

// Fixed-width measure: every character is 10 px wide, spaces included.
const m10 = (text) => String(text).length * 10;

// Greedy line count of a text at maxWidth with a measure (independent of the module under test).
function lineCount(text, measure, maxWidth) {
  const words = text.split(' ');
  let lines = 1;
  let width = 0;
  for (const w of words) {
    const ww = measure(w);
    if (width === 0) width = ww;
    else if (width + measure(' ') + ww <= maxWidth) width += measure(' ') + ww;
    else { lines += 1; width = ww; }
  }
  return lines;
}

const FUNCTION_WORDS = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'a', 'en', 'y', 'o', 'que', 'con', 'por', 'para'];

const LONG = 'En 2026, la inteligencia artificial pasó de ser una tecnología experimental a una ' +
  'infraestructura de propósito general: está en las organizaciones, en la educación, en la ciencia y en la medicina.';

test('loads DOM-free and exposes the subtitle constants', () => {
  const C = load(BOTH).engine.captions;
  assert.equal(typeof C.chunk, 'function');
  assert.ok(C.K.FONT_PX >= 30, 'subtitles are at least 30 px');
  assert.equal(C.K.MAX_LINES, 2);
  assert.match(C.font(34), /34px/);
  assert.match(C.font(34), /sans-serif/);
});

test('a short line is one chunk, kept verbatim', () => {
  const C = load(BOTH).engine.captions;
  assert.deepEqual([...C.chunk('Un momento: ¿qué mide exactamente esa cifra?', { measure: m10, maxWidth: 1000 })],
    ['Un momento: ¿qué mide exactamente esa cifra?']);
  assert.deepEqual([...C.chunk('   ')], []);
});

test('sentences become their own chunks when both are long enough', () => {
  const C = load(BOTH).engine.captions;
  assert.deepEqual([...C.chunk('Pero ¿cuánto valor produce de verdad? Empecemos por lo que se ve.', { measure: m10, maxWidth: 1000 })],
    ['Pero ¿cuánto valor produce de verdad?', 'Empecemos por lo que se ve.']);
  // a very short sentence stays with its neighbour
  assert.deepEqual([...C.chunk('Uso no es valor. Benchmark no es desempeño real.', { measure: m10, maxWidth: 1000 })],
    ['Uso no es valor. Benchmark no es desempeño real.']);
});

test('long lines split at punctuation and phrase boundaries, within 2 lines', () => {
  const C = load(BOTH).engine.captions;
  const maxWidth = 300; // 30 characters per line, 2 lines per chunk
  const chunks = [...C.chunk(LONG, { measure: m10, maxWidth })];
  assert.ok(chunks.length >= 4, 'needs several chunks: ' + chunks.length);
  assert.equal(chunks.join(' '), LONG, 'nothing is lost or reworded');
  for (const c of chunks) {
    assert.ok(lineCount(c, m10, maxWidth) <= 2, 'fits in 2 lines: ' + c);
    const last = c.split(' ').pop().toLowerCase();
    assert.ok(!FUNCTION_WORDS.includes(last), 'does not end on a function word: ' + c);
  }
  // most chunks end at punctuation when the text offers it
  const atPunctuation = chunks.filter((c) => /[,.:;?!]$/.test(c)).length;
  assert.ok(atPunctuation >= Math.ceil(chunks.length / 2), 'prefers punctuation: ' + JSON.stringify(chunks));
});

test('figures stay whole and next to their unit', () => {
  const C = load(BOTH).engine.captions;
  const text = 'La inversión privada en IA llegó a 344.700 millones de dólares en 2025, con un crecimiento de +127,5% en un año.';
  for (const maxWidth of [220, 260, 300, 340, 380, 420]) {
    const chunks = [...C.chunk(text, { measure: m10, maxWidth })];
    assert.equal(chunks.join(' '), text);
    for (const c of chunks) {
      assert.ok(!/344\.700$/.test(c), `never splits "344.700 | millones" (width ${maxWidth}): ${JSON.stringify(chunks)}`);
    }
    assert.ok(chunks.some((c) => c.includes('+127,5%')), 'the figure is written exactly as the KB writes it');
  }
});

test('chunking is width-aware through the injected measure', () => {
  const C = load(BOTH).engine.captions;
  const wide = C.chunk(LONG, { measure: m10, maxWidth: 1000 });
  const narrow = C.chunk(LONG, { measure: m10, maxWidth: 250 });
  assert.ok(narrow.length > wide.length);
  const wider = C.chunk(LONG, { measure: (t) => t.length * 5, maxWidth: 250 });
  assert.ok(wider.length < narrow.length);
});

test('the default budget is pure characters: ≤ 2 lines of K.CHARS_PER_LINE, no font metrics', () => {
  const C = load(BOTH).engine.captions;
  const perLine = C.K.CHARS_PER_LINE;
  assert.ok(perLine >= 40 && perLine <= 56, 'a readable line at ≥ 30 px on 1280 px: ' + perLine);
  const chunks = [...C.chunk(LONG)];
  assert.ok(chunks.length >= 2 && chunks.length <= 4, 'default chunks: ' + chunks.length);
  assert.equal(chunks.join(' '), LONG);
  for (const c of chunks) assert.ok(lineCount(c, (t) => t.length, perLine) <= 2, 'fits 2 lines: ' + c);
  // the same chunks in a fresh sandbox (what a Node tool computes) as in this one
  const again = load(BOTH).engine.captions;
  assert.deepEqual([...again.chunk(LONG)], chunks);
  // no measuring at all: chunking never asks a canvas for widths
  assert.equal(typeof C.estimateMeasure, 'undefined');
});

test('balanced wrapping for display', () => {
  const C = load(BOTH).engine.captions;
  const text = 'Mide uso declarado: lo que las organizaciones dicen hacer.';
  const lines = [...C.balance(text, m10, 400, 2)];
  assert.equal(lines.length, 2);
  assert.equal(lines.join(' '), text);
  assert.ok(Math.abs(m10(lines[0]) - m10(lines[1])) < 120, 'lines are balanced: ' + JSON.stringify(lines));
  assert.deepEqual([...C.balance('Corto.', m10, 400, 2)], ['Corto.']);
  assert.deepEqual([...C.wrap('aa bb cc', m10, 50)], ['aa bb', 'cc']);
});

test('chunk times by character count, or from bookmarks', () => {
  const C = load(BOTH).engine.captions;
  const est = C.timeChunks(['abc', 'abcdef'], 10, 19);
  near(est[0].start, 10, 'first start');
  near(est[0].end, 13, 'first end by characters');
  near(est[1].start, 13, 'second start');
  near(est[1].end, 19, 'last end = line end');
  assert.equal(est[1].text, 'abcdef');
  const marked = C.timeChunks(['abc', 'abcdef'], 10, 19, [0, 2.5]);
  near(marked[0].end, 12.5, 'bookmark');
  near(marked[1].start, 12.5, 'bookmark start');
  // a missing or broken bookmark list falls back to the estimate
  const broken = C.timeChunks(['abc', 'abcdef'], 10, 19, [0]);
  near(broken[1].start, 13, 'fallback');
  const unordered = C.timeChunks(['abc', 'abcdef'], 10, 19, [0, 99]);
  near(unordered[1].start, 13, 'out-of-range bookmark ignored');
});

function sampleVideo() {
  return {
    id: 'vt', slug: 'prueba', title: 'Prueba',
    chapters: [{ title: 'Uno', from: 'a' }],
    scenes: [
      {
        id: 'a', min: 4, rotulos: {},
        lines: [
          { voice: 'narrador', text: 'Pero ¿cuánto valor produce de verdad? Empecemos por lo que se ve.' },
          { voice: 'lectora', text: 'Un momento: ¿qué mide exactamente esa cifra?' }
        ]
      }
    ],
    checkpoints: []
  };
}

test('cueAt: the active chunk, its fade and the hold after the line', () => {
  const EIA = load(BOTH);
  const C = EIA.engine.captions;
  const tl = EIA.engine.timeline.build(sampleVideo());
  const [l0, l1] = tl.lines;
  assert.equal(C.cueAt(tl, l0.start - 0.01), null);
  const first = C.cueAt(tl, l0.start + 0.5);
  assert.equal(first.voice, 'narrador');
  assert.equal(first.text, l0.chunks[0].text);
  assert.equal(first.chunkIndex, 0);
  near(first.alpha, 1, 'fully visible inside the chunk');
  near(C.cueAt(tl, l0.start).alpha, 0, 'fades in');
  const second = C.cueAt(tl, l0.chunks[1].start + 0.3);
  assert.equal(second.chunkIndex, 1);
  // the last chunk stays a moment after the voice ends, but never into the next line
  const hold = C.cueAt(tl, l0.end + 0.1);
  assert.ok(hold && hold.chunkIndex === l0.chunks.length - 1, 'held after the line');
  assert.equal(C.cueAt(tl, l0.end + 0.49), null, 'gone before the next line');
  const lectora = C.cueAt(tl, l1.start + 0.5);
  assert.equal(lectora.voice, 'lectora');
  const out = {};
  assert.equal(C.cueAt(tl, l1.start + 0.5, out), out, 'reuses the object');
});

// A minimal 2D context that records calls, so draw functions can run without a DOM.
function mockContext() {
  const calls = [];
  const ctx = {
    calls, font: '', fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1, textAlign: 'left',
    textBaseline: 'alphabetic', lineCap: 'butt', lineJoin: 'miter',
    measureText: (text) => ({ width: String(text).length * 16 })
  };
  for (const name of ['save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'quadraticCurveTo',
    'bezierCurveTo', 'rect', 'fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText',
    'translate', 'rotate', 'scale', 'setTransform', 'clip', 'setLineDash', 'drawImage', 'ellipse']) {
    ctx[name] = (...args) => { calls.push([name, ...args]); };
  }
  return ctx;
}

test('draw functions paint the band, the checkpoint card and the chapter title', () => {
  const EIA = load(BOTH);
  const C = EIA.engine.captions;
  const tl = EIA.engine.timeline.build(sampleVideo());
  const copy = { lineal: 'Pausa el video y respondan en grupo', respuesta: 'Respuesta' };

  const ctx = mockContext();
  C.drawSubtitle(ctx, C.cueAt(tl, tl.lines[1].start + 0.5), {});
  const texts = ctx.calls.filter((c) => c[0] === 'fillText').map((c) => c[1]).join(' ');
  assert.match(texts, /qué mide exactamente/);
  assert.ok(ctx.calls.some((c) => c[0] === 'fill'), 'draws the band');

  const cp = { question: '¿Qué tipo de evidencia es?', options: ['Capacidad técnica', 'Uso declarado'], answer: 1, explain: 'Es uso declarado.' };
  const q = mockContext();
  C.drawCheckpoint(q, cp, 2.2, { copy });
  const qText = q.calls.filter((c) => c[0] === 'fillText').map((c) => String(c[1])).join(' | ');
  assert.match(qText, /Pausa el video y respondan en grupo/);
  assert.match(qText, /Qué tipo de evidencia/);
  assert.match(qText, /\b2\b/, 'countdown 3-2-1 shows 2 at 2.2 s');
  const a = mockContext();
  C.drawCheckpoint(a, cp, 5, { copy });
  const aText = a.calls.filter((c) => c[0] === 'fillText').map((c) => String(c[1])).join(' | ');
  assert.match(aText, /Respuesta/);
  assert.match(aText, /Es uso declarado/);

  const ch = mockContext();
  C.drawChapterTitle(ch, 'Leer la fuente', 1.2, {});
  assert.ok(ch.calls.length > 0);
  const none = mockContext();
  C.drawChapterTitle(none, 'Leer la fuente', 2.5, {});
  assert.equal(none.calls.filter((c) => c[0] === 'fillText').length, 0, 'gone after 2 s');
});

test('countdown digits follow the 4 s question phase', () => {
  const C = load(BOTH).engine.captions;
  assert.equal(C.countdownAt(0.5), 0);
  assert.equal(C.countdownAt(1.2), 3);
  assert.equal(C.countdownAt(2.2), 2);
  assert.equal(C.countdownAt(3.9), 1);
  assert.equal(C.countdownAt(4.1), 0);
});
