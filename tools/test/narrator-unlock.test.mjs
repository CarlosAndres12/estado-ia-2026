// Tests for the narration unlock of the iOS Safari fixes (odd/tasks/ios-safari-fixes.md, I01):
// iOS WebKit loads and starts media, and lets speechSynthesis speak, only inside a user gesture, so
// the player unlocks the narrator synchronously in the Play tap.
// Run from the repository root:  node --test tools/test/narrator-unlock.test.mjs
//
// The narrator runs in a Node vm sandbox with a fake <audio>, a fake speechSynthesis and manual
// timers, so no sound is ever played.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadData, runScript } from '../lib/load-data.mjs';

const root = new URL('../../', import.meta.url).pathname;
const read = (file) => readFileSync(root + file, 'utf8');
const flush = () => new Promise((resolve) => setImmediate(resolve));

class FakeAudio {
  constructor() {
    this.listeners = {};
    this.readyState = 0;
    this.networkState = 0;
    this.paused = true;
    this.muted = false;
    this.currentTime = 0;
    this.duration = NaN;
    this.calls = [];
    this.pending = [];
  }
  addEventListener(name, fn) { (this.listeners[name] = this.listeners[name] || []).push(fn); }
  emit(name) { (this.listeners[name] || []).forEach((fn) => fn()); }
  load() { this.calls.push('load'); }
  play() {
    this.calls.push(this.muted ? 'play:muted' : 'play:sound');
    this.paused = false;
    return new Promise((resolve, reject) => { this.pending.push({ resolve, reject }); });
  }
  pause() { this.calls.push('pause'); this.paused = true; }
  removeAttribute() {}
}

// A fresh sandbox per test: the narrator keeps module-level state (voices, speech prime).
async function setup() {
  const EIA = await loadData({ root, files: [] });
  const ctx = EIA.__context;
  const timers = [];
  let clock = 0;
  const spoken = [];
  const audios = [];
  ctx.setTimeout = (fn, ms) => { timers.push({ at: clock + (ms || 0), fn }); return timers.length; };
  ctx.clearTimeout = () => {};
  ctx.Audio = function () { const a = new FakeAudio(); audios.push(a); return a; };
  ctx.SpeechSynthesisUtterance = function (text) { this.text = text; this.volume = 1; };
  ctx.speechSynthesis = {
    speaking: false,
    pending: false,
    getVoices: () => [{ name: 'Jorge', lang: 'es-MX' }],
    speak: (u) => { spoken.push(u); },
    cancel: () => {},
    addEventListener: () => {}
  };
  runScript(ctx, root, 'js/engine/narrator.js');
  EIA.audioManifest = { vtest: { file: 'audio/vtest.mp3' } };
  const tl = { id: 'vtest', source: 'manifest', lines: [], duration: 30 };
  async function advance(ms) {
    clock += ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      if (!timers.length || timers[0].at > clock) break;
      timers.shift().fn();
      await flush();
    }
    await flush();
  }
  function create() {
    const nar = EIA.engine.narrator.create(tl, { videoId: 'vtest', voice: true });
    const out = { nar, audio: audios[audios.length - 1], mode: null };
    nar.ready.then((m) => { out.mode = m; });
    return out;
  }
  return { EIA, spoken, advance, create };
}

test('without a gesture, missing metadata no longer drops the narrator to the browser voice', async () => {
  const s = await setup();
  const { nar } = s.create();
  await s.advance(8000);
  await s.advance(5000);
  assert.equal(nar.mode, 'silent');
  assert.equal(s.spoken.length, 0, 'no fallback speech before any tap');
});

test('unlock primes the track muted inside the tap and the ready wait resolves on its load', async () => {
  const s = await setup();
  const box = s.create();
  const { nar, audio } = box;
  await s.advance(8000);
  nar.unlock();
  assert.deepEqual(audio.calls, ['load', 'play:muted']);
  assert.equal(s.spoken.length, 1, 'speechSynthesis primed in the tap');
  assert.equal(s.spoken[0].volume, 0);
  audio.readyState = 1;
  audio.emit('loadedmetadata');
  await flush();
  assert.equal(box.mode, 'audio');
  assert.equal(audio.muted, true, 'still muted while the prime is in flight');
  audio.pending[0].resolve();
  await flush();
  assert.equal(audio.paused, true, 'the prime pauses again when nothing is playing');
  assert.equal(audio.muted, false, 'voice on: muted state restored');
});

test('after a gesture, a track that never loads falls back within the unlock timeout', async () => {
  const s = await setup();
  const box = s.create();
  box.nar.unlock();
  await s.advance(3000);
  assert.equal(box.mode, null);
  await s.advance(1500);
  assert.equal(box.mode, 'browser');
});

test('desktop: metadata before any tap still chooses the track with no extra calls', async () => {
  const s = await setup();
  const box = s.create();
  box.audio.readyState = 1;
  box.audio.emit('loadedmetadata');
  await flush();
  assert.equal(box.mode, 'audio');
  assert.deepEqual(box.audio.calls, []);
});

test('an unlock that races with play keeps the track playing and audible', async () => {
  const s = await setup();
  const box = s.create();
  const { nar, audio } = box;
  audio.readyState = 1;
  audio.emit('loadedmetadata');
  await flush();
  nar.unlock();
  assert.deepEqual(audio.calls, ['play:muted'], 'loaded metadata: no load() restart');
  nar.play();
  audio.pending.forEach((p) => p.resolve());
  await flush();
  assert.equal(audio.paused, false);
  assert.equal(audio.muted, false);
  nar.unlock();
  assert.equal(audio.calls.filter((c) => c.startsWith('play')).length, 2, 'primed once only');
});

test('the module-level unlock primes speechSynthesis once', async () => {
  const s = await setup();
  s.EIA.engine.narrator.unlock();
  s.EIA.engine.narrator.unlock();
  assert.equal(s.spoken.length, 1);
  assert.equal(s.spoken[0].text, '');
});

test('the player unlocks narration synchronously at the top of play(), before any await', () => {
  const src = read('js/engine/player.js');
  const body = src.slice(src.indexOf('function play() {'), src.indexOf('function pause() {'));
  const unlockAt = body.indexOf('unlock()');
  assert.ok(unlockAt > 0, 'play() calls unlock()');
  assert.ok(unlockAt < body.indexOf('init()'), 'unlock() runs before init().then');
});
