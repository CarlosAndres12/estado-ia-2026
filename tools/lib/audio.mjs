/* tools/lib/audio.mjs — measuring and mixing the narration (prompt §8.3 steps 6–7).
 *
 * Dev-only (Node >= 20; needs ffmpeg and ffprobe on PATH). Every ffmpeg / ffprobe process goes through
 * one module-wide queue, so only one runs at a time, at a lowered CPU priority.
 *
 *   await checkTools()                         -> { ffmpeg, ffprobe } version lines, or a clear error
 *   await decodeClip(file, { sampleRate })     -> Int16Array: the whole clip as mono 16-bit PCM,
 *                                                 untrimmed (word offsets stay valid); its length is
 *                                                 the clip's exact duration
 *   placeClips(duration, sampleRate, clips)    -> Int16Array: silence with each { start, samples } clip
 *                                                 at its start time (one narration track per video)
 *   wavBuffer(samples, sampleRate)             -> Buffer: RIFF/WAVE, 16-bit mono
 *   await loudnormMp3(inWav, outMp3, opts)     -> { measured }: two-pass loudnorm (I, TP, LRA) and MP3
 *                                                 encoding; opts { lufs, truePeak, lra, bitrate, sampleRate }
 *   await probeDuration(file)                  -> seconds, measured by ffprobe
 *   parseLoudnorm(stderr)                      -> the JSON block of loudnorm's measuring pass
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

let queue = Promise.resolve();

/** Runs fn after every queued ffmpeg/ffprobe job has finished. */
function serial(fn) {
  const job = queue.then(fn, fn);
  queue = job.catch(() => {});
  return job;
}

function run(cmd, args) {
  return serial(() => new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    try {
      os.setPriority(child.pid, 15);
    } catch {
      // best effort: some platforms refuse
    }
    const out = [];
    let err = '';
    child.stdout.on('data', (d) => out.push(d));
    child.stderr.setEncoding('utf8').on('data', (d) => { err = (err + d).slice(-65536); });
    child.on('error', (e) => {
      reject(e.code === 'ENOENT'
        ? new Error(`${cmd} is not on PATH: install ffmpeg (https://ffmpeg.org); the voice-over needs ffmpeg and ffprobe`)
        : e);
    });
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout: Buffer.concat(out), stderr: err });
      else reject(new Error(`${cmd} ${args.filter((a) => !a.startsWith('/')).slice(0, 6).join(' ')}… exited with ${code}: ${err.trim().slice(-600)}`));
    });
  }));
}

export async function checkTools() {
  const first = (s) => s.split('\n')[0].trim();
  const ffmpeg = first(String((await run('ffmpeg', ['-hide_banner', '-version'])).stdout));
  const ffprobe = first(String((await run('ffprobe', ['-hide_banner', '-version'])).stdout));
  return { ffmpeg, ffprobe };
}

/** PCM s16le bytes -> Int16Array (copied, so the result is aligned). */
export function toInt16(buf) {
  const out = new Int16Array(buf.length >> 1);
  Buffer.from(out.buffer).set(buf.subarray(0, out.length * 2));
  return out;
}

export async function decodeClip(file, { sampleRate = 24000 } = {}) {
  const { stdout } = await run('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', file,
    '-f', 's16le', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', String(sampleRate), 'pipe:1']);
  return toInt16(stdout);
}

/**
 * One track: `duration` seconds of silence with each clip copied in at round(start × sampleRate).
 * Overlaps (never produced by the timeline) are mixed by addition with clipping.
 */
export function placeClips(duration, sampleRate, clips) {
  const out = new Int16Array(Math.max(0, Math.ceil(duration * sampleRate - 1e-6)));
  for (const { start, samples } of clips) {
    const at = Math.round(start * sampleRate);
    for (let i = 0; i < samples.length; i++) {
      const k = at + i;
      if (k < 0 || k >= out.length) continue;
      const v = out[k] + samples[i];
      out[k] = v > 32767 ? 32767 : v < -32768 ? -32768 : v;
    }
  }
  return out;
}

export function wavBuffer(samples, sampleRate) {
  const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'latin1');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'latin1');
  header.write('fmt ', 12, 'latin1');
  header.writeUInt32LE(16, 16);            // PCM fmt chunk size
  header.writeUInt16LE(1, 20);             // PCM
  header.writeUInt16LE(1, 22);             // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32);             // block align
  header.writeUInt16LE(16, 34);            // bits per sample
  header.write('data', 36, 'latin1');
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** The measurement JSON loudnorm prints at the end of its first pass. */
export function parseLoudnorm(stderr) {
  const end = stderr.lastIndexOf('}');
  const start = stderr.lastIndexOf('{', end);
  if (start < 0 || end < 0) throw new Error('loudnorm printed no measurement');
  return JSON.parse(stderr.slice(start, end + 1));
}

/** Two-pass EBU R128 normalization (prompt §8.3 step 7) and MP3 encoding, written atomically. */
export async function loudnormMp3(inWav, outMp3, { lufs = -16, truePeak = -1.5, lra = 11, bitrate = '128k', sampleRate = 44100 } = {}) {
  const target = `I=${lufs}:TP=${truePeak}:LRA=${lra}`;
  const first = await run('ffmpeg', ['-nostdin', '-hide_banner', '-nostats', '-i', inWav,
    '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-']);
  const m = parseLoudnorm(first.stderr);
  const finite = ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset'].every((k) => Number.isFinite(Number(m[k])));
  const filter = finite
    ? `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:` +
      `measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=summary`
    : 'anull'; // a silent track has nothing to measure
  const part = outMp3 + '.part';
  try {
    await run('ffmpeg', ['-nostdin', '-hide_banner', '-nostats', '-y', '-i', inWav, '-af', filter,
      '-ar', String(sampleRate), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', bitrate, '-f', 'mp3', part]);
    fs.renameSync(part, outMp3);
  } finally {
    fs.rmSync(part, { force: true });
  }
  return { measured: m };
}

export async function probeDuration(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file]);
  const seconds = Number(String(stdout).trim());
  if (!Number.isFinite(seconds)) throw new Error(`ffprobe could not measure ${file}`);
  return seconds;
}
