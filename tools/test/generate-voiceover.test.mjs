// Tests for tools/generate-voiceover.mjs. The dry run uses the real scripts; the full run uses a fake
// engine that writes tone WAVs with fake word boundaries (no network), then the real ffmpeg decode,
// mix, two-pass loudnorm and ffprobe (no playback). Run: node --test tools/test/generate-voiceover.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs, loadConfig, planVideo, estimateLine, generate, trimTail, TAIL_SECONDS } from '../generate-voiceover.mjs';
import { loadVoiceData, createLayout } from '../lib/voice-layout.mjs';
import { wavBuffer } from '../lib/audio.mjs';
import { readManifest } from '../lib/voice-assets.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const HAS_FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0 && spawnSync('ffprobe', ['-version']).status === 0;
const quiet = () => {};
const tmp = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `eia-voice-${name}-`));

test('parseArgs reads the documented flags', () => {
  assert.deepEqual(parseArgs(['--dry-run', '--only', 'v01,v04', '--force', '--out=/x']),
    { dryRun: true, force: true, only: ['v01', 'v04'], out: '/x', root: null, help: false });
  assert.deepEqual(parseArgs(['--only=v02']).only, ['v02']);
  assert.throws(() => parseArgs(['--fast']), /unknown option --fast/);
});

test('planVideo: chunked display text, normalized speech, say overrides, voices per role', async () => {
  const EIA = await loadVoiceData({ root: ROOT });
  const layout = createLayout(EIA);
  const config = loadConfig();
  const plans = Object.fromEntries(EIA.data.videos.map((v) => [v.id, planVideo(v, { layout, config })]));
  const evaluar = plans.v06.lines.find((l) => l.key === 'evaluar:1');
  assert.doesNotMatch(evaluar.spoken, /[«»]/);
  assert.match(evaluar.spoken, /¿usó i a\?/);
  assert.equal(evaluar.chunks.join(' '), evaluar.text);
  const siete = plans.v05.lines.find((l) => l.key === 'siete:1');
  assert.equal(siete.say, true);
  assert.match(siete.spoken, /entre personas e i a/);
  const lectora = plans.v01.lines.find((l) => l.role === 'lectora');
  assert.equal(lectora.voice, config.edge.voices.lectora.name);
  assert.equal(plans.v01.lines[0].voice, config.edge.voices.narrador.name);
  const total = Object.values(plans).reduce((n, p) => n + p.lines.length, 0);
  assert.equal(total, EIA.data.videos.reduce((n, v) => n + v.scenes.reduce((m, s) => m + s.lines.length, 0), 0));
});

test('estimateLine: spoken words at 2.3 words per second, line rate applied', () => {
  const words = Array.from({ length: 23 }, () => 'palabra').join(' ');
  assert.ok(Math.abs(estimateLine({ spoken: words, rate: '0%' }) - 10) < 1e-9);
  assert.ok(Math.abs(estimateLine({ spoken: words, rate: '-50%' }) - 20) < 1e-9);
  assert.equal(estimateLine({ spoken: 'sí', rate: '0%' }), 0.8);
});

test('dry run: every video, no network, no files, cache status reported', async () => {
  const cacheDir = tmp('cache');
  const run = await generate({ dryRun: true, cacheDir, log: quiet });
  assert.equal(run.dryRun, true);
  assert.equal(run.results.length, 9);
  for (const r of run.results) {
    assert.ok(r.tl.duration > 0);
    assert.match(r.report, /length \d+:\d\d\.\d \(estimate\) — target/);
    assert.match(r.report, /longest scenes: /);
  }
  assert.equal(run.pending, run.results.reduce((n, r) => n + r.plan.lines.length, 0));
  assert.deepEqual(fs.readdirSync(cacheDir), []);
  const one = await generate({ dryRun: true, only: ['v04'], cacheDir, log: quiet });
  assert.deepEqual(one.results.map((r) => r.plan.video.id), ['v04']);
  await assert.rejects(generate({ dryRun: true, only: ['v10'], cacheDir, log: quiet }), /unknown video v10/);
});

// A fake engine: a tone of 0.1 s + 0.3 s per word + 0.2 s, one boundary per word.
function fakeTts(calls) {
  return {
    name: 'edge', extension: '.wav', format: 'fake-wav',
    ssml: ({ voice, text, rate, pitch }) => `${voice}|${rate}|${pitch}|${text}`,
    listVoices: async () => [{ name: 'es-MX-JorgeNeural' }, { name: 'es-MX-DaliaNeural' }],
    synthesize: async ({ text }, out) => {
      calls.push(text);
      const words = text.split(/\s+/).filter(Boolean);
      const rate = 24000;
      const samples = new Int16Array(Math.round((0.1 + words.length * 0.3 + 0.2) * rate));
      for (let i = 0; i < samples.length; i++) samples[i] = Math.round(4000 * Math.sin((2 * Math.PI * 200 * i) / rate));
      fs.writeFileSync(out, wavBuffer(samples, rate));
      return { words: words.map((w, i) => ({ text: w, start: 0.1 + i * 0.3, dur: 0.24 })), bytes: samples.length * 2 };
    }
  };
}

const mini = {
  id: 'v99', slug: 'prueba', title: 'Video de prueba', sesion: 1, laminas: [], rate: '0%', target: [5, 60],
  poster: { scene: 'a', p: 0.5 },
  chapters: [{ title: 'Uno', from: 'a' }, { title: 'Dos', from: 'b' }],
  scenes: [
    { id: 'a', min: 4, seVe: '', rotulos: {}, lines: [
      { voice: 'narrador', text: 'Según la encuesta de McKinsey de 2025, el 88% de las organizaciones usa IA de forma regular en al menos una función.' },
      { voice: 'lectora', text: 'Un momento: ¿qué mide exactamente esa cifra?', pause: 1 }
    ] },
    { id: 'b', min: 3, seVe: '', rotulos: {}, lines: [
      { voice: 'narrador', text: 'Hay que diseñar y supervisar flujos humano–IA.', say: 'Hay que diseñar y supervisar flujos entre personas e i a.' }
    ] }
  ],
  checkpoints: [{ after: 'a', question: '¿Qué mide?', options: ['Uso', 'Valor'], answer: 0, explain: '', hint: '' }]
};

// The rules js/engine/timeline.js applies before it trusts a manifest entry.
function assertUsable(entry, video) {
  assert.equal(entry.scenes.length, video.scenes.length);
  entry.scenes.forEach((s, i) => assert.equal(s.id, video.scenes[i].id));
  const keys = entry.lines.map((l) => l.scene + ':' + l.index);
  assert.deepEqual(keys, video.scenes.flatMap((s) => s.lines.map((_, i) => s.id + ':' + i)));
  assert.deepEqual(entry.checkpoints.map((c) => c.after), video.checkpoints.map((c) => c.after));
  for (const l of entry.lines) {
    assert.ok(Number.isFinite(l.start) && l.dur > 0);
    l.chunks.forEach((c, k) => {
      assert.ok(c.end > c.start, JSON.stringify(c));
      if (k > 0) assert.equal(c.start, l.chunks[k - 1].end);
    });
    assert.equal(l.chunks[0].start, l.start);
  }
}

test('full run with a fake engine: clips, cache, timeline, mix, manifest, captions', { skip: !HAS_FFMPEG && 'ffmpeg/ffprobe not installed' }, async () => {
  const cacheDir = tmp('cache');
  const out = tmp('out');
  const calls = [];
  const opts = { videos: [mini], tts: fakeTts(calls), cacheDir, out, log: quiet };
  const run = await generate(opts);
  assert.equal(calls.length, 3);
  assert.equal(calls[2], 'Hay que diseñar y supervisar flujos entre personas e i a.');
  const [result] = run.results;
  assert.match(result.report, /missing bookmarks: none/);
  assert.match(result.report, /clips: 3 \(3 synthesized, 0 cached\)/);

  const manifest = readManifest(path.join(out, 'assets/audio/manifest.js'));
  const entry = manifest.v99;
  assertUsable(entry, mini);
  assert.equal(entry.file, 'assets/audio/v99.mp3');
  // Each line lasts until its last word ends (0.1 + 0.3 per earlier word + 0.24 s) plus the 0.15 s tail:
  // the fake clip's 0.2 s of trailing silence is trimmed, its start is not.
  const spokenWords = result.plan.lines.map((l) => l.spoken.split(/\s+/).length);
  entry.lines.forEach((l, i) => assert.ok(Math.abs(l.dur - (0.1 + (spokenWords[i] - 1) * 0.3 + 0.24 + TAIL_SECONDS)) < 0.002, `${l.dur}`));
  // The second chunk of the first line starts at its first word.
  const first = result.plan.lines[0];
  assert.ok(first.chunks.length > 1);
  const wordsBefore = first.spokenChunks[0].split(/\s+/).length;
  assert.ok(Math.abs(entry.lines[0].chunks[1].start - (entry.lines[0].start + 0.1 + wordsBefore * 0.3)) < 0.002);
  // The checkpoint is a silent 6 s segment right after scene a.
  assert.deepEqual(entry.checkpoints, [{ after: 'a', start: entry.scenes[0].start + entry.scenes[0].dur, dur: 6 }]);

  const vtt = fs.readFileSync(path.join(out, 'assets/captions/v99.vtt'), 'utf8');
  assert.match(vtt, /<v Lectora>Un momento: ¿qué mide exactamente esa cifra\?/);
  assert.match(vtt, /<v Narrador>Hay que diseñar y supervisar flujos humano–IA\./);
  assert.ok(fs.statSync(path.join(out, 'assets/audio/v99.mp3')).size > 1000);
  assert.deepEqual(fs.readdirSync(path.join(cacheDir, 'mix')), []);

  const again = await generate({ ...opts, tts: fakeTts(calls) });
  assert.equal(calls.length, 3);
  assert.match(again.results[0].report, /clips: 3 \(0 synthesized, 3 cached\)/);
  assert.deepEqual(readManifest(path.join(out, 'assets/audio/manifest.js')).v99, entry);
});

test('trimTail keeps the start and a short tail after the last word', () => {
  const rate = 1000;
  const pcm = new Int16Array(2000); // 2 s clip, last word ends at 1.2 s
  const words = [{ text: 'a', start: 0.1, dur: 0.4 }, { text: 'b', start: 0.7, dur: 0.5 }];
  assert.equal(trimTail(pcm, words, rate, 0.15).length, 1350);
  assert.equal(trimTail(pcm, [], rate, 0.15).length, 2000);          // no word timings: untouched
  assert.equal(trimTail(pcm, [{ start: 1.95, dur: 0.1 }], rate).length, 2000); // tail beyond the end: untouched
});
