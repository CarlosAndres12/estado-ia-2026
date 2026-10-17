/* tools/lib/voice-layout.mjs — the single swap point between the voice tools and the site's subtitle
 * chunking (js/engine/captions.js) and timing rules (js/engine/timeline.js).
 *
 * Dev-only (Node >= 20, built-ins only). Prompt §8.3 step 1: the tools load the site's own chunking
 * and timing in the same vm sandbox as the data, so tools and player compute identical chunks and
 * times. While those engine modules are still stubs, a local fallback with the same rules (prompt
 * §6.2 pacing, §6.4 chunking, §6.5 checkpoints, §6.6 chapters) stands in, and `layout.source` says
 * which one is in use. Once the engine lands nothing here has to change: it is picked up as soon as
 * EIA.engine.timeline.build / toManifest and EIA.engine.captions.chunk exist.
 *
 *   const EIA = await loadVoiceData({ root, manifest: true });   // data + engine (+ assets/audio/manifest.js)
 *   const layout = createLayout(EIA);
 *   layout.source                     'engine' | 'fallback'
 *   layout.chunk(text)                -> [chunk text]      subtitle chunks of one voice line
 *   layout.build(video, opts)         -> timeline          opts: { lineDurations, chunkOffsets, chunk, wps }
 *       lineDurations / chunkOffsets: objects keyed 'sceneId:lineIndex' (or arrays in line order) of
 *       measured seconds and of chunk start offsets (seconds from the line start), as in timeline.js
 *   layout.toManifest(tl, { file })   -> EIA.audioManifest entry (odd/spec/contracts.md §2)
 *
 * The timeline exposes what the tools read: duration, scenes [{ id, start, dur }], lines [{ sceneId,
 * index, voice, start, dur, end, chunks: [{ text, start, end }] }] in video order, checkpoints
 * [{ after, start, dur }] and chapters [{ title, from, start }].
 */

import { loadData } from './load-data.mjs';

export const ENGINE_SCRIPTS = ['js/engine/timeline.js', 'js/engine/captions.js'];
export const MANIFEST_SCRIPT = 'assets/audio/manifest.js';

/** The site data plus the engine's timing and chunking (and, optionally, the audio manifest). */
export async function loadVoiceData({ root = '.', manifest = false, console: logger } = {}) {
  const extra = [...ENGINE_SCRIPTS, ...(manifest ? [MANIFEST_SCRIPT] : [])];
  return loadData({ root, extra, console: logger });
}

// -------------------------------------------------------------------------------------------------
// Fallback rules (prompt §6.2, §6.4–§6.6), the same constants as js/engine/timeline.js / captions.js

export const C = {
  LEAD: 0.6,          // silence before the first line of a scene
  GAP: 0.5,           // silence between two lines
  TAIL: 1.2,          // silence after the last line
  CHECKPOINT: 6,      // fixed silent checkpoint segment
  CHARS_PER_LINE: 50, // subtitle chunking budget: 2 lines of 50 characters
  MAX_LINES: 2,
  MIN_CHARS: 20,      // shortest chunk worth its own subtitle
  WPS_RUNTIME: 2.4,
  WPS_DRY_RUN: 2.3
};

const FUNCTION_WORDS = new Set(('el la los las lo un una unos unas al del de a en y e o u ni que con por para ' +
  'sin sobre entre hacia hasta desde segun su sus se le les no es son ha han hay muy mas menos tan cada como ' +
  'cuando donde si pero porque aunque sino ya fue era').split(' '));
const ABBREVIATIONS = new Set('ee uu cap caps feb ene mar abr jun jul ago sep sept oct nov dic num pag sr sra dr dra vs aprox ej etc'.split(' '));

function fold(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Quality of a break after word `prev` (before `next`): 3 sentence end or ":" ";", 2 comma, 0 plain,
// -1 never (after a function word or an abbreviation, between a number and its unit).
function breakScore(prev, next) {
  if (/\.$/.test(prev) && ABBREVIATIONS.has(fold(prev))) return -1;
  if (/[.!?…:;]["»”’')\]]*$/.test(prev)) return 3;
  if (/[,)\]»”—–]$/.test(prev)) return 2;
  if (/\d/.test(prev) && /^\p{L}/u.test(next)) return -1;
  if (FUNCTION_WORDS.has(fold(prev))) return -1;
  return 0;
}

const isSentenceEnd = (word) => /[.!?…]["»”’')\]]*$/.test(word);

/** Fallback chunking: at most 2 × 50 characters, sentence by sentence, at punctuation and phrases. */
export function fallbackChunk(text) {
  const words = String(text == null ? '' : text).trim().split(/\s+/).filter(Boolean);
  const budget = C.CHARS_PER_LINE * C.MAX_LINES;
  const chars = (i, j) => words.slice(i, j).join(' ').length;
  const out = [];
  let start = 0;
  while (start < words.length) {
    let end = start + 1;
    while (end < words.length && chars(start, end + 1) <= budget) end++;
    let cut = 0;
    // Follow the voice sentence by sentence when both sides are long enough.
    for (let k = start + 1; k <= end && k < words.length; k++) {
      if (isSentenceEnd(words[k - 1]) && breakScore(words[k - 1], words[k]) === 3 &&
          chars(start, k) >= C.MIN_CHARS && chars(k, words.length) >= C.MIN_CHARS) { cut = k; break; }
    }
    if (!cut && end === words.length) cut = end;
    if (!cut) {
      let bestScore = -2;
      for (let k = end; k > start; k--) {
        if (chars(start, k) < C.MIN_CHARS && k !== start + 1) continue;
        const score = breakScore(words[k - 1], words[k]);
        if (score > bestScore) { bestScore = score; cut = k; }
      }
    }
    out.push(words.slice(start, cut).join(' '));
    start = cut;
  }
  return out;
}

/** Chunk times from start offsets (seconds from the line start) when valid, else by character count. */
export function timeChunks(texts, start, end, offsets) {
  const span = Math.max(0, end - start);
  const valid = Array.isArray(offsets) && offsets.length === texts.length &&
    offsets.every((o, i) => Number.isFinite(o) && o >= 0 && o < span && (i === 0 || o > offsets[i - 1]));
  if (valid) {
    return texts.map((text, i) => ({
      text,
      start: i === 0 ? start : start + offsets[i],
      end: i === texts.length - 1 ? end : start + offsets[i + 1]
    }));
  }
  const total = texts.reduce((sum, t) => sum + (t.length || 1), 0);
  let acc = 0;
  return texts.map((text, i) => {
    const a = start + span * (acc / total);
    acc += text.length || 1;
    return { text, start: a, end: i === texts.length - 1 ? end : start + span * (acc / total) };
  });
}

function perLine(data, sceneId, index, flat) {
  if (!data) return undefined;
  return Array.isArray(data) ? data[flat] : data[sceneId + ':' + index];
}

function rateFactor(rate) {
  const m = /^\s*([+\-−]?\d+(?:[.,]\d+)?)\s*%\s*$/.exec(String(rate == null ? '' : rate));
  const v = m ? 1 + Number(m[1].replace('−', '-').replace(',', '.')) / 100 : 1;
  return v > 0.2 ? v : 1;
}

/** Fallback timeline: scene = max(min, lead + lines + gaps + pauses + tail); checkpoints 6 s. */
export function fallbackBuild(video, opts = {}) {
  const wps = opts.wps || C.WPS_RUNTIME;
  const chunkOf = opts.chunk || ((text) => fallbackChunk(text));
  const tl = { id: video.id, duration: 0, scenes: [], lines: [], checkpoints: [], chapters: [] };
  const sceneStart = {};
  let t = 0;
  for (const scene of video.scenes) {
    const seg = { id: scene.id, start: t, dur: 0, end: 0 };
    sceneStart[scene.id] = t;
    let cursor = C.LEAD;
    const lines = scene.lines || [];
    lines.forEach((line, index) => {
      const measured = perLine(opts.lineDurations, scene.id, index, tl.lines.length);
      const spoken = line.say || line.text || '';
      const estimate = Math.max(0.8, spoken.split(/\s+/).filter(Boolean).length / wps / rateFactor(line.rate ?? video.rate));
      const dur = Number.isFinite(measured) && measured > 0 ? measured : estimate;
      const start = t + cursor;
      cursor += dur + (Number.isFinite(line.pause) ? line.pause : 0);
      if (index < lines.length - 1) cursor += C.GAP;
      const texts = Array.from(chunkOf(line.text || '', line) || []);
      const offsets = perLine(opts.chunkOffsets, scene.id, index, tl.lines.length);
      tl.lines.push({
        sceneId: scene.id, index, voice: line.voice === 'lectora' ? 'lectora' : 'narrador',
        text: line.text || '', start, dur, end: start + dur,
        chunks: timeChunks(texts.length ? texts : [line.text || ''], start, start + dur, offsets)
      });
    });
    seg.dur = Math.max(scene.min || 0, cursor + C.TAIL);
    seg.end = seg.start + seg.dur;
    tl.scenes.push(seg);
    t = seg.end;
    (video.checkpoints || []).forEach((cp, k) => {
      if (cp.after !== scene.id) return;
      tl.checkpoints.push({ checkpoint: k, after: scene.id, start: t, dur: C.CHECKPOINT, end: t + C.CHECKPOINT });
      t += C.CHECKPOINT;
    });
  }
  tl.duration = t;
  const chapters = video.chapters && video.chapters.length ? video.chapters : [{ title: video.title || '', from: video.scenes[0].id }];
  tl.chapters = chapters.map((ch) => ({ title: ch.title || '', from: ch.from, start: sceneStart[ch.from] ?? 0 }));
  return tl;
}

const r3 = (x) => Math.round(x * 1000) / 1000;

/** Fallback manifest entry (contracts §2), times rounded to milliseconds. */
export function fallbackToManifest(tl, { file = '' } = {}) {
  return {
    file,
    duration: r3(tl.duration),
    chapters: tl.chapters.map((c) => ({ title: c.title, from: c.from, start: r3(c.start) })),
    scenes: tl.scenes.map((s) => ({ id: s.id, start: r3(s.start), dur: r3(s.dur) })),
    lines: tl.lines.map((l) => ({
      scene: l.sceneId, index: l.index, start: r3(l.start), dur: r3(l.dur),
      chunks: l.chunks.map((c) => ({ text: c.text, start: r3(c.start), end: r3(c.end) }))
    })),
    checkpoints: tl.checkpoints.slice().sort((a, b) => a.checkpoint - b.checkpoint)
      .map((c) => ({ after: c.after, start: r3(c.start), dur: r3(c.dur) }))
  };
}

// -------------------------------------------------------------------------------------------------

// Objects made inside the vm sandbox come from another realm: copy them into plain local data.
const plain = (value) => JSON.parse(JSON.stringify(value));

/** Engine chunking and timing when loaded, else the fallback (see the header). */
export function createLayout(EIA) {
  const engine = EIA && EIA.engine;
  const timeline = engine && engine.timeline;
  const captions = engine && engine.captions;
  const ready = timeline && typeof timeline.build === 'function' && typeof timeline.toManifest === 'function' &&
    captions && typeof captions.chunk === 'function';
  if (!ready) {
    return { source: 'fallback', C, chunk: fallbackChunk, build: fallbackBuild, toManifest: fallbackToManifest };
  }
  return {
    source: 'engine',
    C: { ...C, ...(timeline.C ? plain(timeline.C) : {}) },
    chunk: (text) => Array.from(captions.chunk(String(text == null ? '' : text)), String),
    // glosario: false: margin notes do not affect timing and the tools do not need them.
    build: (video, opts = {}) => timeline.build(video, { ...opts, glosario: false }),
    toManifest: (tl, opts = {}) => plain(timeline.toManifest(tl, opts))
  };
}
