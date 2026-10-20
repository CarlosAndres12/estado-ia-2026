// Tests for tools/generate-timeline-voiceover.mjs (sesión 0 narration) and its generated manifest.
// The full run uses a fake engine that writes tone WAVs with fake word boundaries (no network), then
// the real ffmpeg decode, loudnorm and ffprobe (no playback).
// Run: node --test tools/test/timeline-voiceover.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseArgs, planClips, timelineManifestSource, readTimelineManifest, generate, MANIFEST_FILE, TIMELINE_LEXICON
} from '../generate-timeline-voiceover.mjs';
import { loadConfig } from '../generate-voiceover.mjs';
import { loadVoiceData, createLayout } from '../lib/voice-layout.mjs';
import { wavBuffer } from '../lib/audio.mjs';
import { scriptOrder } from '../lib/load-data.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const HAS_FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0 && spawnSync('ffprobe', ['-version']).status === 0;
const EIA = await loadVoiceData({ root: ROOT });
const LT = EIA.data.lineaTiempo;
const config = loadConfig();
const plan = planClips(EIA, { layout: createLayout(EIA), config });

test('parseArgs reads the documented flags', () => {
  assert.deepEqual(parseArgs(['--dry-run', '--only', 'intro,alphago', '--force', '--out=/x']),
    { dryRun: true, force: true, only: ['intro', 'alphago'], out: '/x', help: false });
  assert.throws(() => parseArgs(['--fast']), /unknown option --fast/);
});

test('planClips: intro + 24 milestones, the videos narrador voice, speech without digits or warnings', () => {
  assert.deepEqual(plan.map((c) => c.key), ['intro', ...LT.hitos.map((h) => h.id)]);
  for (const c of plan) {
    assert.equal(c.voice, config[config.engine].voices.narrador.name, c.key);
    assert.equal(c.chunks.join(' '), c.text, c.key + ': chunks rebuild the display text');
    assert.doesNotMatch(c.spoken, /\d/, c.key + ': ' + c.spoken);
    assert.deepEqual(c.warnings, [], c.key);
  }
  assert.match(plan.find((c) => c.key === 'alphago').spoken, /vence cuatro a uno/);
  assert.ok(TIMELINE_LEXICON['DeepSeek-R1']);
});

test('manifest source round trip', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-s0-'));
  const file = path.join(dir, 'manifest.js');
  const m = { intro: { file: 'assets/audio/s0/intro.mp3', duration: 1.5, chunks: [{ text: 'Hola.', start: 0, end: 1.5 }] } };
  fs.writeFileSync(file, timelineManifestSource(m));
  assert.deepEqual(readTimelineManifest(file), m);
  assert.deepEqual(readTimelineManifest(path.join(dir, 'none.js')), {});
});

test('the committed manifest covers every clip, its captions are the current narration, files exist', () => {
  assert.ok(scriptOrder(ROOT).includes(MANIFEST_FILE), 'index.html loads ' + MANIFEST_FILE);
  const m = readTimelineManifest(path.join(ROOT, MANIFEST_FILE));
  assert.deepEqual(Object.keys(m), plan.map((c) => c.key));
  for (const c of plan) {
    const e = m[c.key];
    assert.equal(e.chunks.map((k) => k.text).join(' '), c.text, c.key + ': regenerate the narration after editing the data');
    assert.ok(e.duration > 1 && e.chunks.every((k, i) => k.start >= 0 && k.end <= e.duration + 0.001 && (!i || k.start >= e.chunks[i - 1].start)), c.key);
    assert.ok(fs.statSync(path.join(ROOT, e.file)).size > 1000, e.file);
  }
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

test('full run with a fake engine: one mp3 per clip, aligned captions, manifest, cache', { skip: !HAS_FFMPEG && 'ffmpeg/ffprobe not installed' }, async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-s0-out-'));
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-s0-cache-'));
  const calls = [];
  const opts = { EIA, out, cacheDir, only: ['intro', 'alphago'], tts: fakeTts(calls), log: () => {} };
  const run = await generate(opts);
  assert.equal(calls.length, 2);
  assert.deepEqual(run.clips.map((c) => c.key), ['intro', 'alphago']);
  const m = readTimelineManifest(path.join(out, MANIFEST_FILE));
  assert.deepEqual(Object.keys(m), ['intro', 'alphago']);
  const a = m.alphago;
  assert.equal(a.file, 'assets/audio/s0/alphago.mp3');
  assert.ok(fs.existsSync(path.join(out, a.file)));
  assert.equal(a.chunks.map((c) => c.text).join(' '), LT.hitos.find((h) => h.id === 'alphago').narracion);
  assert.ok(a.chunks[1].start > 0.5 && a.chunks[1].start < a.duration);
  const again = await generate({ ...opts, only: ['alphago'], tts: fakeTts(calls) });
  assert.equal(calls.length, 2, 'cached clips are not synthesized again');
  assert.equal(again.clips.length, 1);
  assert.deepEqual(Object.keys(readTimelineManifest(path.join(out, MANIFEST_FILE))), ['intro', 'alphago'], 'the manifest keeps the other clips');
});
