// Timeline rules (prompt §6.2, §6.5, §6.6, §5.6) evaluated the way the tools load the engine:
// classic scripts inside a Node vm sandbox with no window and no document.
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

// Six plain words each, so the estimate is exact: 6 / 2.4 = 2.5 s.
const SIX_A = 'uno dos tres cuatro cinco seis';
const SIX_B = 'siete ocho nueve diez once doce';
const TWELVE = SIX_A + ' ' + SIX_B;

function sampleVideo() {
  return {
    id: 'vt', slug: 'prueba', title: 'Prueba', sesion: 1, rate: '0%', target: [10, 60],
    poster: { scene: 'b', p: 0.5 },
    chapters: [{ title: 'Uno', from: 'a' }, { title: 'Dos', from: 'c' }],
    scenes: [
      {
        id: 'a', min: 5, seVe: 'Escena a', rotulos: { titulo: { text: 'Hola' } },
        lines: [
          { voice: 'narrador', text: SIX_A, pause: 1, cifras: ['adop-1'] },
          { voice: 'lectora', text: SIX_B, advertencia: 2 }
        ]
      },
      {
        id: 'b', min: 12, seVe: 'Escena b', rotulos: {},
        lines: [{ voice: 'narrador', text: SIX_A, ilustrativo: true, advertencia: [1, 2] }]
      },
      {
        id: 'c', min: 4, seVe: 'Escena c', rotulos: {},
        lines: [{ voice: 'narrador', text: 'uno dos tres', say: TWELVE, rate: '-20%' }]
      }
    ],
    checkpoints: [{ after: 'b', question: '¿Pregunta?', options: ['x', 'y'], answer: 1, explain: 'e', hint: 'h' }]
  };
}

test('loads DOM-free and exposes the timing constants of prompt §6', () => {
  const EIA = load(BOTH);
  const T = EIA.engine.timeline;
  assert.equal(typeof T.build, 'function');
  assert.equal(T.C.LEAD, 0.6);
  assert.equal(T.C.GAP, 0.5);
  assert.equal(T.C.TAIL, 1.2);
  assert.equal(T.C.CHECKPOINT, 6);
  assert.equal(T.C.CHECKPOINT_QUESTION, 4);
  assert.equal(T.C.CHECKPOINT_ANSWER, 2);
  assert.equal(T.C.CROSSFADE, 0.8);
  assert.equal(T.C.CHAPTER_TITLE, 2);
  assert.equal(T.C.WARNING, 3);
  assert.equal(T.C.FPS, 24);
  assert.equal(T.C.WPS_RUNTIME, 2.4);
  assert.equal(T.C.WPS_DRY_RUN, 2.3);
});

test('scene duration = max(min, lead + lines + gaps + pauses + tail)', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  assert.equal(tl.source, 'estimate');
  const [a, b, c] = tl.scenes;
  // a: 0.6 + 2.5 + 1 (pause) + 0.5 + 2.5 + 1.2 = 8.3 (> min 5)
  near(a.start, 0, 'a.start');
  near(a.dur, 8.3, 'a.dur');
  // b: 0.6 + 2.5 + 1.2 = 4.3 < min 12
  near(b.start, 8.3, 'b.start');
  near(b.dur, 12, 'b.dur');
  // checkpoint: fixed 6 s right after b
  const cp = tl.checkpoints[0];
  near(cp.start, 20.3, 'checkpoint.start');
  near(cp.dur, 6, 'checkpoint.dur');
  near(cp.questionEnd, 24.3, 'checkpoint.questionEnd');
  assert.equal(cp.after, 'b');
  // c: say has 12 words, rate -20%: 12 / 2.4 / 0.8 = 6.25; 0.6 + 6.25 + 1.2 = 8.05 (> min 4)
  near(c.start, 26.3, 'c.start');
  near(c.dur, 8.05, 'c.dur');
  near(tl.duration, 34.35, 'duration');
  assert.deepEqual([...tl.segments.map((s) => s.kind)], ['scene', 'scene', 'checkpoint', 'scene']);
});

test('lines start after the lead, the previous line, its pause and the gap', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  const a = tl.scenes[0];
  near(a.local[0].start, 0.6, 'a.l0.start');
  near(a.local[0].end, 3.1, 'a.l0.end');
  near(a.local[1].start, 4.6, 'a.l1.start');
  near(a.local[1].end, 7.1, 'a.l1.end');
  // the flat list carries absolute times, voices and normalized marks
  const [l0, l1, l2, l3] = tl.lines;
  near(l2.start, 8.3 + 0.6, 'b.l0 absolute start');
  assert.equal(l1.voice, 'lectora');
  assert.deepEqual([...l0.cifras], ['adop-1']);
  assert.deepEqual([...l1.advertencia], [2]);
  assert.deepEqual([...l2.advertencia], [1, 2]);
  assert.deepEqual([...l0.advertencia], []);
  assert.equal(l2.ilustrativo, true);
  assert.equal(l3.say, TWELVE);
  assert.equal(l3.sceneId, 'c');
  assert.equal(l3.index, 0);
});

test('words per second is a parameter: 2.4 at runtime, 2.3 for the dry run', () => {
  const T = load(BOTH).engine.timeline;
  const runtime = T.build(sampleVideo());
  const dry = T.build(sampleVideo(), { wps: T.C.WPS_DRY_RUN });
  near(runtime.lines[0].dur, 6 / 2.4, 'runtime line');
  near(dry.lines[0].dur, 6 / 2.3, 'dry-run line');
  assert.ok(dry.duration > runtime.duration);
});

test('rates and speakable text', () => {
  const T = load(BOTH).engine.timeline;
  near(T.parseRate('0%'), 1, '0%');
  near(T.parseRate('-5%'), 0.95, '-5%');
  near(T.parseRate('+10%'), 1.1, '+10%');
  near(T.parseRate(undefined), 1, 'undefined');
  near(T.parseRate('rápido'), 1, 'invalid');
  assert.equal(T.speakable({ text: 'a', say: 'b' }), 'b');
  assert.equal(T.speakable({ text: 'a' }), 'a');
  // the video's default rate applies when a line has none
  const v = sampleVideo();
  v.rate = '-5%';
  const tl = T.build(v);
  near(tl.lines[0].dur, 6 / 2.4 / 0.95, 'video rate');
});

test('words are counted as spoken: numbers read as several words', () => {
  const T = load(BOTH).engine.timeline;
  assert.equal(T.countWords('uno dos tres'), 3);
  assert.equal(T.countWords('  uno   dos — tres  '), 3);
  assert.equal(T.countWords('—'), 0);
  assert.equal(T.countWords('2025'), 3); // "dos mil veinticinco"
  assert.ok(T.countWords('66,3%') >= 5, '"sesenta y seis coma tres por ciento"');
  assert.ok(T.countWords('344.700 millones') >= 6);
  assert.ok(T.countWords('el 88% de las organizaciones') > 5);
});

test('chapters cover the segments of their scenes, checkpoints included', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  assert.equal(tl.chapters.length, 2);
  const [uno, dos] = tl.chapters;
  assert.equal(uno.title, 'Uno');
  assert.equal(uno.from, 'a');
  near(uno.start, 0, 'uno.start');
  near(uno.end, 26.3, 'uno.end');
  near(dos.start, 26.3, 'dos.start');
  near(dos.end, 34.35, 'dos.end');
  assert.equal(tl.checkpoints[0].chapter, 0);
  assert.equal(tl.scenes[2].chapter, 1);
  assert.equal(tl.chapterAt(0), 0);
  assert.equal(tl.chapterAt(26.29), 0);
  assert.equal(tl.chapterAt(26.3), 1);
  assert.equal(tl.chapterAt(1000), 1);
});

test('a video without chapters gets one chapter named after it', () => {
  const T = load(BOTH).engine.timeline;
  const v = sampleVideo();
  delete v.chapters;
  const tl = T.build(v);
  assert.equal(tl.chapters.length, 1);
  assert.equal(tl.chapters[0].title, 'Prueba');
  near(tl.chapters[0].end, tl.duration, 'single chapter end');
});

test('segmentAt / sceneAt / lineAt', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  assert.equal(tl.segmentAt(-1).id, 'a');
  assert.equal(tl.segmentAt(0).id, 'a');
  assert.equal(tl.segmentAt(8.29).id, 'a');
  assert.equal(tl.segmentAt(8.3).id, 'b');
  assert.equal(tl.segmentAt(21).kind, 'checkpoint');
  // during a checkpoint the scene on screen is the one it follows
  assert.equal(tl.sceneAt(21).id, 'b');
  assert.equal(tl.sceneAt(26.3).id, 'c');
  assert.equal(tl.segmentAt(999).id, 'c');
  assert.equal(tl.lineAt(0.5), null);
  assert.equal(tl.lineAt(1).text, SIX_A);
  assert.equal(tl.lineAt(3.5), null); // in the pause
  assert.equal(tl.lineAt(5).voice, 'lectora');
  assert.equal(tl.lineIndexAt(0.5), -1);
  assert.equal(tl.lineIndexAt(3.5), 0);
  assert.equal(tl.lineIndexAt(30), 3);
});

test('0.8 s crossfades are centered on scene boundaries', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  assert.equal(tl.crossfadeAt(0.1), null); // first scene: no fade in from anything
  assert.equal(tl.crossfadeAt(4), null);
  const before = tl.crossfadeAt(8.0);
  assert.equal(before.from, 0);
  assert.equal(before.to, 1);
  near(before.x, (8.0 - 7.9) / 0.8, 'x before the boundary');
  near(tl.crossfadeAt(8.3).x, 0.5, 'x at the boundary');
  near(tl.crossfadeAt(8.6).x, 0.875, 'x after the boundary');
  assert.equal(tl.crossfadeAt(8.75), null);
  // scene after a checkpoint fades from the checkpoint segment
  const cf = tl.crossfadeAt(26.3);
  assert.equal(tl.segments[cf.from].kind, 'checkpoint');
  assert.equal(tl.segments[cf.to].id, 'c');
  // nothing fades into a checkpoint
  assert.equal(tl.crossfadeAt(20.3), null);
});

test('the per-scene s object follows prompt §5.6', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  const a = tl.scenes[0];
  const s0 = tl.state(0, 0);
  assert.deepEqual(Object.keys(s0).sort(),
    ['at', 'dur', 'intro', 'layers', 'line', 'lineP', 'lines', 'outro', 'p', 'rotulos', 't'].sort());
  assert.equal(s0.t, 0);
  assert.equal(s0.p, 0);
  assert.equal(s0.intro, 0);
  assert.equal(s0.outro, 0);
  assert.equal(s0.line, -1);
  assert.equal(s0.lineP, 0);
  assert.equal(s0.at(0), 0);
  assert.equal(s0.rotulos.titulo.text, 'Hola');
  near(s0.dur, 8.3, 'dur');
  assert.equal(s0.lines.length, 2);
  near(s0.lines[1].start, 4.6, 'local line start');

  const s = tl.state(0, 1.85); // halfway through line 0 (0.6 → 3.1)
  near(s.t, 1.85, 't');
  near(s.p, 1.85 / 8.3, 'p');
  near(s.intro, 1, 'intro after 1 s');
  assert.equal(s.line, 0);
  near(s.lineP, 0.5, 'lineP');
  near(s.at(0), 0.5, 'at(0)');
  assert.equal(s.at(1), 0);
  assert.equal(s.at(7), 0, 'missing line index');

  const gap = tl.state(0, 4); // after line 0, before line 1
  assert.equal(gap.line, 0);
  assert.equal(gap.lineP, 1);
  assert.equal(gap.at(0), 1);
  assert.equal(gap.at(1), 0);

  const end = tl.state(0, 7.8); // last second: outro 0.5
  near(end.outro, 0.5, 'outro');
  assert.equal(end.line, 1);
  assert.equal(end.at(1), 1);

  // clamped to the scene and reusable without allocations
  const out = tl.state(0, 99);
  near(out.t, a.dur, 'clamped t');
  assert.equal(out.p, 1);
  const again = tl.state(0, 1.85, out);
  assert.equal(again, out, 'reuses the object');
  near(out.at(0), 0.5, 'at() follows the reused object');
});

test('measured durations (voice-over tool) override the estimate', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo(), {
    durationOf: (line, sceneIndex, lineIndex) => (sceneIndex === 0 && lineIndex === 0 ? 4 : undefined)
  });
  assert.equal(tl.source, 'measured');
  near(tl.lines[0].dur, 4, 'measured');
  near(tl.lines[1].dur, 2.5, 'estimated when not measured');
  near(tl.scenes[0].dur, 0.6 + 4 + 1 + 0.5 + 2.5 + 1.2, 'scene with measured line');
});

test('lineDurations: an array in video line order or an object keyed sceneId:lineIndex', () => {
  const T = load(BOTH).engine.timeline;
  const flat = T.build(sampleVideo(), { lineDurations: [4, 3, null, 2], wps: T.C.WPS_DRY_RUN });
  assert.equal(flat.source, 'measured');
  near(flat.lines[0].dur, 4, 'flat 0');
  near(flat.lines[1].dur, 3, 'flat 1');
  near(flat.lines[2].dur, 6 / 2.3, 'missing entry estimated at the given wps');
  near(flat.lines[3].dur, 2, 'flat 3');
  near(flat.scenes[0].dur, 0.6 + 4 + 1 + 0.5 + 3 + 1.2, 'scene a from measured lines');
  const keyed = T.build(sampleVideo(), { lineDurations: { 'a:1': 3.5, 'c:0': 7 } });
  near(keyed.lines[1].dur, 3.5, 'keyed a:1');
  near(keyed.lines[3].dur, 7, 'keyed c:0');
  near(keyed.lines[0].dur, 2.5, 'not listed: estimated');
});

test('chunk offsets (word boundaries or bookmarks) set chunk starts; otherwise by character count', () => {
  const T = load(BOTH).engine.timeline;
  const v = sampleVideo();
  v.scenes[0].lines[0].text = 'Primera parte de la frase, bastante larga. Segunda parte de la misma frase.';
  const est = T.build(v);
  const chunks = est.lines[0].chunks;
  assert.equal(chunks.length, 2);
  near(chunks[0].start, est.lines[0].start, 'first chunk starts with the line');
  near(chunks[chunks.length - 1].end, est.lines[0].end, 'last chunk ends with the line');
  const fn = T.build(v, {
    chunk: () => ['Primera parte de la frase, bastante larga.', 'Segunda parte de la misma frase.'],
    chunkOffsetsOf: (line, si, li) => (si === 0 && li === 0 ? [0, 1.25] : null)
  });
  const [c0, c1] = fn.lines[0].chunks;
  near(c1.start, fn.lines[0].start + 1.25, 'offset start');
  near(c0.end, c1.start, 'contiguous chunks');
  assert.equal(c0.text, 'Primera parte de la frase, bastante larga.');
  const data = T.build(v, { chunkOffsets: [[0, 1.5]] });
  near(data.lines[0].chunks[1].start, data.lines[0].start + 1.5, 'offsets as data, video line order');
  const keyed = T.build(v, { chunkOffsets: { 'a:0': [0, 1.75] } });
  near(keyed.lines[0].chunks[1].start, keyed.lines[0].start + 1.75, 'offsets keyed sceneId:lineIndex');
});

test('the audio manifest is the clock when it matches the video', () => {
  const T = load(BOTH).engine.timeline;
  const est = T.build(sampleVideo());
  const manifest = T.toManifest(est, { file: 'assets/audio/vt.mp3' });
  assert.equal(manifest.file, 'assets/audio/vt.mp3');
  assert.equal(manifest.scenes.length, 3);
  assert.equal(manifest.lines.length, 4);
  assert.equal(manifest.lines[0].scene, 'a');
  assert.equal(manifest.checkpoints[0].after, 'b');
  // shift every time by a measured amount, as the voice-over tool would
  manifest.lines[0].dur = 3;
  manifest.lines[0].chunks = [{ text: 'uno dos tres', start: 0.6, end: 2.1 }, { text: 'cuatro cinco seis', start: 2.1, end: 3.6 }];
  manifest.duration = 40;
  const tl = T.build(sampleVideo(), { manifest });
  assert.equal(tl.source, 'manifest');
  near(tl.lines[0].dur, 3, 'manifest line duration');
  near(tl.lines[0].end, 3.6, 'manifest line end');
  assert.equal(tl.lines[0].chunks[1].text, 'cuatro cinco seis');
  near(tl.lines[0].chunks[1].start, 2.1, 'manifest chunk start');
  near(tl.duration, 40, 'manifest duration');
  near(tl.checkpoints[0].start, manifest.checkpoints[0].start, 'manifest checkpoint');
  // round trip without changes keeps every time
  const back = T.build(sampleVideo(), { manifest: T.toManifest(est, { file: 'x.mp3' }) });
  est.lines.forEach((l, i) => near(back.lines[i].start, l.start, 'round trip line ' + i, 1e-3));
});

test('manifest chunks are used as they are, and scenes may be referenced by index', () => {
  const T = load(BOTH).engine.timeline;
  const manifest = T.toManifest(T.build(sampleVideo()), { file: 'x.mp3' });
  manifest.lines.forEach((l) => { l.scene = ['a', 'b', 'c'].indexOf(l.scene); });
  manifest.checkpoints[0].after = 1;
  // a chunk text the player would never cut itself: it must not be re-chunked
  manifest.lines[3].chunks = [{ text: 'uno', start: manifest.lines[3].start, end: manifest.lines[3].start + 1 },
    { text: 'dos tres', start: manifest.lines[3].start + 1, end: manifest.lines[3].start + manifest.lines[3].dur }];
  const tl = T.build(sampleVideo(), { manifest });
  assert.equal(tl.source, 'manifest', tl.manifestMismatch);
  assert.deepEqual([...tl.lines[3].chunks.map((c) => c.text)], ['uno', 'dos tres']);
  near(tl.lines[3].chunks[1].start, manifest.lines[3].start + 1, 'manifest chunk time');
});

test('a stale manifest is ignored, and the reason is reported', () => {
  const T = load(BOTH).engine.timeline;
  const manifest = T.toManifest(T.build(sampleVideo()), { file: 'x.mp3' });
  const v = sampleVideo();
  v.scenes[1].lines.push({ voice: 'narrador', text: 'una línea nueva' });
  const tl = T.build(v, { manifest });
  assert.equal(tl.source, 'estimate');
  assert.match(tl.manifestMismatch, /b:1/);
});

test('glossary notes: first use of each term, one note per line', () => {
  const T = load(BOTH).engine.timeline;
  const glosario = [
    { id: 'benchmark', termino: 'Benchmark', definicion: 'Prueba estandarizada…', variantes: ['benchmarks'] },
    { id: 'uso-declarado', termino: 'Uso declarado', definicion: 'Lo que personas…', variantes: [] },
    { id: 'gpai', termino: 'Modelo de propósito general (GPAI)', definicion: 'Modelo capaz…', variantes: [] }
  ];
  const v = sampleVideo();
  v.scenes[0].lines[0].text = 'Primero, el uso declarado y luego los benchmarks.';
  v.scenes[0].lines[1].text = 'Otra vez los benchmarks y el uso declarado.';
  v.scenes[1].lines[0].text = 'Un modelo de propósito general, o GPAI, y un benchmark.';
  const tl = T.build(v, { glosario });
  assert.equal(tl.lines[0].glossary.id, 'uso-declarado', 'first term in the line wins');
  assert.equal(tl.lines[1].glossary.id, 'benchmark', 'a term not shown before still gets its note');
  assert.equal(tl.lines[2].glossary.id, 'gpai');
  assert.equal(tl.lines[3].glossary, null);
  assert.equal(tl.overlays.glossary.length, 3);
  near(tl.overlays.glossary[0].start, tl.lines[0].start, 'note starts with its line');
  assert.ok(tl.overlays.glossary[0].end >= tl.lines[0].end, 'note lasts the whole line');
  // no glossary at all
  assert.equal(T.build(sampleVideo(), { glosario: false }).overlays.glossary.length, 0);
});

test('overlays: warnings 3 s each, ilustrativo for the whole beat, chapter titles 2 s', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  const w = tl.overlays.warnings;
  assert.deepEqual([...w.map((x) => x.n)], [2, 1, 2]);
  near(w[0].start, tl.lines[1].start, 'single warning starts with its line');
  near(w[0].end - w[0].start, 3, 'warning lasts 3 s');
  // two stamps in one line press one after the other and take different slots
  near(w[1].start, tl.lines[2].start, 'first of two');
  near(w[2].start, tl.lines[2].start + tl.lines[2].dur / 2, 'second of two');
  assert.notEqual(w[1].slot, w[2].slot);
  const il = tl.overlays.illustrative;
  assert.equal(il.length, 1);
  near(il[0].start, tl.lines[2].start, 'ilustrativo start');
  near(il[0].end, tl.scenes[1].end, 'ilustrativo lasts until the beat ends');
  const ch = tl.overlays.chapterTitles;
  assert.deepEqual([...ch.map((c) => c.title)], ['Uno', 'Dos']);
  near(ch[1].start, 26.3, 'chapter title start');
  near(ch[1].end, 28.3, 'chapter title end');
});

test('poster time and frame quantization', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  near(tl.posterTime(), 8.3 + 0.5 * 12, 'poster at scene b, p 0.5');
  near(T.frameTime(1.01), 1, 'frame floor at 24 fps');
  near(T.frameTime(1.05), 25 / 24, 'next frame');
});

test('rejects unknown scene ids in chapters and checkpoints', () => {
  const T = load(BOTH).engine.timeline;
  const v = sampleVideo();
  v.checkpoints[0].after = 'zz';
  assert.throws(() => T.build(v), /zz/);
  const w = sampleVideo();
  w.chapters[1].from = 'nope';
  assert.throws(() => T.build(w), /nope/);
});

test('the timeline is plain data (tools serialize it with JSON)', () => {
  const T = load(BOTH).engine.timeline;
  const tl = T.build(sampleVideo());
  const copy = JSON.parse(JSON.stringify(tl));
  assert.equal(copy.scenes.length, 3);
  assert.equal(copy.lines[3].sceneId, 'c');
  near(copy.duration, tl.duration, 'duration survives JSON');
});
