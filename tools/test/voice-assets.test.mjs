// Tests for tools/lib/voice-assets.mjs: WebVTT captions and assets/audio/manifest.js.
// Run: node --test tools/test/voice-assets.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { toVtt, manifestSource, readManifest, vttTime, formatTime } from '../lib/voice-assets.mjs';

const video = {
  id: 'v99', title: 'Prueba',
  scenes: [{ id: 'a', lines: [{ voice: 'narrador', text: '…' }, { voice: 'lectora', text: '…' }] }]
};
const entry = {
  file: 'assets/audio/v99.mp3', duration: 9.5,
  chapters: [{ title: 'Uno', from: 'a', start: 0 }],
  scenes: [{ id: 'a', start: 0, dur: 9.5 }],
  lines: [
    { scene: 'a', index: 0, start: 0.6, dur: 3, chunks: [{ text: 'El 88% usa IA & más,', start: 0.6, end: 2 }, { text: 'en 2025.', start: 2, end: 3.6 }] },
    { scene: 'a', index: 1, start: 4.1, dur: 1.5, chunks: [{ text: '¿Qué mide <exactamente>?', start: 4.1, end: 5.6 }] }
  ],
  checkpoints: []
};

test('time formats', () => {
  assert.equal(vttTime(0), '00:00:00.000');
  assert.equal(vttTime(3723.4567), '01:02:03.457');
  assert.equal(formatTime(65.04), '1:05.0');
  assert.equal(formatTime(9.96), '0:10.0');
});

test('toVtt writes one cue per chunk with the speaker and the display text', () => {
  const vtt = toVtt(entry, video);
  assert.match(vtt, /^WEBVTT\n\nNOTE v99 · Prueba/);
  assert.match(vtt, /\n1\n00:00:00\.600 --> 00:00:02\.000\n<v Narrador>El 88% usa IA &amp; más,\n/);
  assert.match(vtt, /\n3\n00:00:04\.100 --> 00:00:05\.600\n<v Lectora>¿Qué mide &lt;exactamente&gt;\?\n$/);
});

test('manifestSource round-trips through a vm sandbox, the way the site loads it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-manifest-'));
  const file = path.join(dir, 'manifest.js');
  fs.writeFileSync(file, manifestSource({ v99: entry }));
  assert.deepEqual(readManifest(file), { v99: entry });
  fs.writeFileSync(file, manifestSource({}));
  assert.deepEqual(readManifest(file), {});
  assert.deepEqual(readManifest(path.join(dir, 'missing.js')), {});
});

test('the shipped empty manifest is readable', () => {
  const shipped = fileURLToPath(new URL('../../assets/audio/manifest.js', import.meta.url));
  assert.equal(typeof readManifest(shipped), 'object');
});
