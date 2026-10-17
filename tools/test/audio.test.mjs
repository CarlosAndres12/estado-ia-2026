// Tests for tools/lib/audio.mjs. The pure parts always run; the ffmpeg part generates a 1 s tone,
// decodes, normalizes and measures it (no playback), and is skipped when ffmpeg is not installed.
// Run: node --test tools/test/audio.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { placeClips, wavBuffer, parseLoudnorm, toInt16, decodeClip, loudnormMp3, probeDuration, checkTools } from '../lib/audio.mjs';

const HAS_FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0 && spawnSync('ffprobe', ['-version']).status === 0;

test('placeClips lays each clip at its start time over silence', () => {
  const track = placeClips(1, 10, [{ start: 0.2, samples: Int16Array.from([1, 2, 3]) }, { start: 0.8, samples: Int16Array.from([4, 5, 6]) }]);
  assert.deepEqual(Array.from(track), [0, 0, 1, 2, 3, 0, 0, 0, 4, 5]);
  const loud = placeClips(0.2, 10, [{ start: 0, samples: Int16Array.from([30000, -30000]) }, { start: 0, samples: Int16Array.from([30000, -30000]) }]);
  assert.deepEqual(Array.from(loud), [32767, -32768]);
});

test('wavBuffer writes a 16-bit mono RIFF header', () => {
  const wav = wavBuffer(Int16Array.from([0, 1000, -1000]), 24000);
  assert.equal(wav.toString('latin1', 0, 4), 'RIFF');
  assert.equal(wav.toString('latin1', 8, 12), 'WAVE');
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(40), 6);
  assert.equal(wav.length, 50);
  assert.deepEqual(Array.from(toInt16(wav.subarray(44))), [0, 1000, -1000]);
});

test('parseLoudnorm reads the last JSON block of the measuring pass', () => {
  const stderr = 'Input #0, wav…\n[Parsed_loudnorm_0 @ 0x1] \n{\n\t"input_i" : "-23.54",\n\t"input_tp" : "-7.89",\n' +
    '\t"input_lra" : "5.20",\n\t"input_thresh" : "-34.09",\n\t"target_offset" : "0.12"\n}\n';
  assert.deepEqual(parseLoudnorm(stderr), { input_i: '-23.54', input_tp: '-7.89', input_lra: '5.20', input_thresh: '-34.09', target_offset: '0.12' });
  assert.throws(() => parseLoudnorm('no json here'), /no measurement/);
});

test('ffmpeg round trip: decode, two-pass loudnorm to MP3, ffprobe', { skip: !HAS_FFMPEG && 'ffmpeg/ffprobe not installed' }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-audio-'));
  const rate = 24000;
  const tone = new Int16Array(rate);
  for (let i = 0; i < tone.length; i++) tone[i] = Math.round(8000 * Math.sin((2 * Math.PI * 220 * i) / rate));
  const wav = path.join(dir, 'tone.wav');
  fs.writeFileSync(wav, wavBuffer(tone, rate));
  const tools = await checkTools();
  assert.match(tools.ffmpeg, /ffmpeg/);
  const decoded = await decodeClip(wav, { sampleRate: rate });
  assert.equal(decoded.length, rate);
  const mp3 = path.join(dir, 'tone.mp3');
  const { measured } = await loudnormMp3(wav, mp3, { lufs: -16, truePeak: -1.5 });
  assert.ok(Number.isFinite(Number(measured.input_i)));
  assert.ok(!fs.existsSync(mp3 + '.part'));
  const seconds = await probeDuration(mp3);
  assert.ok(Math.abs(seconds - 1) < 0.1, String(seconds));
});
