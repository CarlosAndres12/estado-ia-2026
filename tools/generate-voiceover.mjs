#!/usr/bin/env node
/* tools/generate-voiceover.mjs — the narration of the 9 videos (prompt §8.3).
 *
 *   node tools/generate-voiceover.mjs                synthesize what is missing, mix, write the assets
 *   node tools/generate-voiceover.mjs --dry-run      no network, no ffmpeg: estimate at 2.3 words/s, report
 *   node tools/generate-voiceover.mjs --only v04     one video (or a comma-separated list)
 *   node tools/generate-voiceover.mjs --force        synthesize again, ignoring the clip cache
 *   node tools/generate-voiceover.mjs --out <dir>    write assets/ under <dir> instead of the repository
 *
 * Engine: tools/voice.config.json "engine" — "edge" (default: free Edge read-aloud voices through the
 * edge-tts package, user decision 2026-10-17) or "azure" (optional, needs a key; prompt §8.2).
 *
 * Steps (prompt §8.3)
 *   1  Load js/data/videos.js with the site's own chunking and timing (lib/voice-layout.mjs: the engine
 *      modules when they exist, else a fallback with the same rules).
 *   2  Split each line into its subtitle chunks; normalize each chunk (lib/normalize-es.mjs) unless the
 *      line has an explicit `say`.
 *   3  SSML per line (lib/ssml.mjs): plain voice + prosody for Edge; bookmarks c1, c2… for Azure.
 *   4  Synthesize each line once, collecting word boundaries (Edge) or bookmarks (Azure).
 *   5  Cache each clip in tools/.cache/tts/ under a hash of engine, voice, rate, pitch, SSML and output
 *      format; retry throttling and network errors; verify the configured voices once before the first
 *      request (nothing is requested when every clip is cached). Edge requests run at most
 *      `concurrency` at a time (2).
 *   6  Decode each clip untrimmed (lib/audio.mjs): its length is the line's duration; subtitle chunks
 *      start at their bookmarks or at their first aligned word (lib/align.mjs); build the timeline.
 *   7  Mix one narration track per video (clips over generated silence), two-pass loudnorm
 *      (-16 LUFS, -1.5 dBTP), MP3 mono 128 kbps. One ffmpeg at a time.
 *   8  Write assets/audio/<id>.mp3, assets/audio/manifest.js and assets/captions/<id>.vtt.
 *   9  Report per video: length vs target, longest scenes, chunks faster than 17 characters per second,
 *      missing bookmarks (chunks no heard word was aligned to), normalizer warnings.
 *
 * Nothing here plays or transcribes audio; the listening sheet is tools/check-voiceover.mjs.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { analyze, countWords } from './lib/normalize-es.mjs';
import { alignChunks } from './lib/align.mjs';
import { loadVoiceData, createLayout } from './lib/voice-layout.mjs';
import { createEdgeTts } from './lib/tts-edge.mjs';
import { createAzureTts } from './lib/tts-azure.mjs';
import { checkTools, decodeClip, placeClips, wavBuffer, loudnormMp3, probeDuration } from './lib/audio.mjs';
import { toVtt, manifestSource, readManifest, formatTime } from './lib/voice-assets.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(HERE, '..');
export const CONFIG_FILE = path.join(HERE, 'voice.config.json');
export const CACHE_DIR = path.join(HERE, '.cache');

export const SAMPLE_RATE = 24000; // clips are decoded and mixed at the voices' own rate
export const FAST_CPS = 17;       // subtitle chunks faster than this are listed in the report
export const DRY_RUN_WPS = 2.3;

const HELP = `Usage: node tools/generate-voiceover.mjs [--dry-run] [--only v01,v04] [--force] [--out <dir>]
  --dry-run   estimate durations at ${DRY_RUN_WPS} words/s and report; no network, no ffmpeg, no files
  --only      generate only these videos (the manifest keeps the others)
  --force     ignore the clip cache (tools/.cache/tts/)
  --out       write assets/audio and assets/captions under <dir> (default: the repository)`;

// -------------------------------------------------------------------------------------------------
// Options and configuration

export function parseArgs(argv) {
  const opts = { dryRun: false, force: false, only: null, out: null, root: null, help: false };
  const list = (value) => String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [name, inline] = arg.startsWith('--') && arg.includes('=') ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)] : [arg, null];
    const value = () => (inline != null ? inline : argv[++i]);
    if (name === '--dry-run') opts.dryRun = true;
    else if (name === '--force') opts.force = true;
    else if (name === '--only') opts.only = list(value());
    else if (name === '--out') opts.out = value();
    else if (name === '--root') opts.root = value();
    else if (name === '-h' || name === '--help') opts.help = true;
    else throw new Error(`unknown option ${arg}\n${HELP}`);
  }
  return opts;
}

export function loadConfig(file = CONFIG_FILE) {
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const engine = config.engine || 'edge';
  if (engine !== 'edge' && engine !== 'azure') throw new Error(`voice.config.json: unknown engine "${engine}" (edge or azure)`);
  const voices = (config[engine] && config[engine].voices) || {};
  for (const role of ['narrador', 'lectora']) {
    if (!voices[role] || !voices[role].name) throw new Error(`voice.config.json: ${engine}.voices.${role}.name is missing`);
  }
  return { ...config, engine };
}

export function createEngine(config, log) {
  return config.engine === 'azure' ? createAzureTts(config.azure, { log }) : createEdgeTts(config.edge, { log });
}

// -------------------------------------------------------------------------------------------------
// Planning: chunks and speakable text of every line

function sayWarnings(say) {
  const out = [];
  for (const m of say.matchAll(/\S*\d\S*/gu)) out.push({ code: 'digits', match: m[0], message: `\`say\` keeps the digits "${m[0]}"` });
  for (const m of say.matchAll(/[^\p{L}\p{N}\s.,;:¿?¡!…()'’\-–—]/gu)) out.push({ code: 'symbol', match: m[0], message: `\`say\` has the sign "${m[0]}"` });
  return out;
}

export function planVideo(video, { layout, config }) {
  const engine = config.engine || 'edge';
  const ec = config[engine] || {};
  const lexicon = config.lexicon || {};
  const lines = [];
  for (const scene of video.scenes) {
    (scene.lines || []).forEach((line, index) => {
      const role = line.voice === 'lectora' ? 'lectora' : 'narrador';
      const voice = (ec.voices || {})[role] || {};
      const chunks = layout.chunk(line.text || '');
      const analyses = chunks.map((chunk) => analyze(chunk, { lexicon }));
      const spokenChunks = analyses.map((a) => a.text);
      const say = typeof line.say === 'string' ? line.say.replace(/\s+/g, ' ').trim() : '';
      const spoken = say || spokenChunks.join(' ');
      if (!spoken) throw new Error(`${video.id} ${scene.id}:${index} has no speakable text`);
      lines.push({
        key: scene.id + ':' + index, sceneId: scene.id, index, role, source: line,
        voice: voice.name, pitch: voice.pitch || (engine === 'edge' ? '+0Hz' : '0%'), style: voice.style || '',
        rate: line.rate ?? video.rate ?? (ec.rate && ec.rate.default) ?? '0%',
        text: line.text || '', chunks, spokenChunks, spoken, say: Boolean(say),
        terms: analyses.flatMap((a) => a.terms),
        warnings: [...analyses.flatMap((a) => a.warnings), ...(say ? sayWarnings(say) : [])]
      });
    });
  }
  return { video, lines };
}

function rateFactor(rate) {
  const m = /^\s*([+\-−]?\d+(?:[.,]\d+)?)\s*%\s*$/.exec(String(rate == null ? '' : rate));
  const v = m ? 1 + Number(m[1].replace('−', '-').replace(',', '.')) / 100 : 1;
  return v > 0.2 ? v : 1;
}

/** Dry-run duration of one line: its spoken words at 2.3 words per second (prompt §8.3 step 10). */
export function estimateLine(line, wps = DRY_RUN_WPS) {
  return Math.max(0.8, countWords(line.spoken) / wps / rateFactor(line.rate));
}

/** The engine-specific SSML and the cache key of a line's clip. */
export function clipFor(line, tts, cacheDir) {
  const ssml = tts.name === 'azure'
    ? tts.ssml({ voice: line.voice, chunks: line.say ? [line.spoken] : line.spokenChunks, rate: line.rate, pitch: line.pitch, style: line.style })
    : tts.ssml({ voice: line.voice, text: line.spoken, rate: line.rate, pitch: line.pitch });
  const key = crypto.createHash('sha256')
    .update(JSON.stringify([tts.name, line.voice, String(line.rate), String(line.pitch), line.style || '', ssml, tts.format]))
    .digest('hex').slice(0, 32);
  const dir = path.join(cacheDir, 'tts');
  return { key, ssml, audio: path.join(dir, key + tts.extension), meta: path.join(dir, key + '.json') };
}

/** Chunk start offsets of a synthesized line: bookmarks when the engine gave them, else word alignment. */
export function chunkOffsetsFor(line, meta, duration) {
  if (line.chunks.length <= 1) return { offsets: [0], missing: [], valid: true, matched: 0, expected: 0 };
  if (!line.say && Array.isArray(meta.bookmarks) && meta.bookmarks.length) {
    const at = new Map(meta.bookmarks.map((b) => [b.name, b.start]));
    const offsets = line.chunks.map((_, k) => (k === 0 ? 0 : at.get('c' + k)));
    const ok = offsets.every((o, k) => Number.isFinite(o) && o < duration && (k === 0 || o > offsets[k - 1]));
    if (ok) return { offsets, missing: [], valid: true, matched: 0, expected: 0 };
  }
  return alignChunks(line.spokenChunks, meta.words || [], { duration });
}

// -------------------------------------------------------------------------------------------------
// Report

export function videoReport({ plan, tl, dryRun, clips, mp3Duration, file }) {
  const v = plan.video;
  const out = [];
  out.push(`${v.id} · ${v.slug} · ${v.title}`);
  const len = tl.duration;
  let target = 'no target';
  if (Array.isArray(v.target) && v.target.length === 2) {
    const [min, max] = v.target;
    const verdict = len < min ? `${(min - len).toFixed(1)} s under (review)` : len > max ? `${(len - max).toFixed(1)} s over (review)` : 'ok';
    target = `target ${formatTime(min)}–${formatTime(max)}: ${verdict}`;
  }
  out.push(`  length ${formatTime(len)}${dryRun ? ' (estimate)' : ''} — ${target}`);
  const longest = tl.scenes.slice().sort((a, b) => b.dur - a.dur).slice(0, 3);
  out.push(`  longest scenes: ${longest.map((s) => `${s.id} ${s.dur.toFixed(1)} s`).join(' · ')}`);

  const fast = [];
  for (const L of tl.lines) {
    L.chunks.forEach((c, k) => {
      const cps = c.text.length / Math.max(0.05, c.end - c.start);
      if (cps > FAST_CPS) fast.push(`    ${L.sceneId}:${L.index} chunk ${k + 1}/${L.chunks.length} · ${cps.toFixed(1)} chars/s · «${c.text}»`);
    });
  }
  out.push(`  subtitle chunks faster than ${FAST_CPS} chars/s: ${fast.length || 'none'}`, ...fast);

  if (!dryRun && clips) {
    const missing = [];
    const weak = [];
    for (const [key, info] of clips.offsets) {
      if (info.missing && info.missing.length) missing.push(`    ${key} chunk${info.missing.length > 1 ? 's' : ''} ${info.missing.map((k) => k + 1).join(', ')} (interpolated)`);
      if (!info.valid) missing.push(`    ${key}: chunk times fell back to character count`);
      if (info.expected && info.matched / info.expected < 0.8) weak.push(`    ${key}: ${info.matched}/${info.expected} words heard as written`);
    }
    out.push(`  missing bookmarks: ${missing.length || 'none'}`, ...missing);
    if (weak.length) out.push(`  weak alignment (listen to these lines): ${weak.length}`, ...weak);
  }

  const warnings = [];
  for (const line of plan.lines) {
    for (const w of line.warnings) warnings.push(`    ${line.key} ${w.code}: ${w.message}`);
  }
  out.push(`  normalizer warnings: ${warnings.length || 'none'}`, ...warnings);

  if (!dryRun && clips) {
    const drift = Number.isFinite(mp3Duration) ? mp3Duration - len : NaN;
    out.push(`  clips: ${plan.lines.length} (${clips.synthesized} synthesized, ${plan.lines.length - clips.synthesized} cached) · ` +
      `mp3 ${Number.isFinite(mp3Duration) ? formatTime(mp3Duration) : '?'} by ffprobe` +
      (Math.abs(drift) > 0.25 ? ` (differs from the timeline by ${drift.toFixed(2)} s)` : '') + ` · ${file}`);
  }
  return out.join('\n');
}

// -------------------------------------------------------------------------------------------------
// Generation

async function pool(items, size, fn) {
  let next = 0;
  let failure = null;
  const worker = async () => {
    while (!failure && next < items.length) {
      const i = next++;
      try {
        await fn(items[i], i);
      } catch (err) {
        failure = failure || err;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(size, items.length)) }, worker));
  if (failure) throw failure;
}

function writeAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.part', data);
  fs.renameSync(file + '.part', file);
}

/**
 * Runs the voice-over. Options: { root, out, only, force, dryRun, config, EIA, videos, tts, cacheDir, log }
 * (EIA, videos, tts and cacheDir are injection points for tests).
 * @returns {Promise<{ dryRun: boolean, layoutSource: string, results: object[] }>}
 */
export async function generate(opts = {}) {
  const root = path.resolve(opts.root || DEFAULT_ROOT);
  const outRoot = path.resolve(opts.out || root);
  const cacheDir = opts.cacheDir || CACHE_DIR;
  const config = opts.config || loadConfig();
  const log = opts.log || ((s) => process.stderr.write(s + '\n'));
  const EIA = opts.EIA || await loadVoiceData({ root });
  const layout = createLayout(EIA);
  const all = Array.from(opts.videos || EIA.data.videos);
  let videos = all;
  if (opts.only && opts.only.length) {
    const unknown = opts.only.filter((id) => !all.some((v) => v.id === id));
    if (unknown.length) throw new Error(`unknown video ${unknown.join(', ')} (known: ${all.map((v) => v.id).join(', ')})`);
    videos = all.filter((v) => opts.only.includes(v.id));
  }
  const plans = videos.map((video) => planVideo(video, { layout, config }));
  const chunkOption = (plan) => {
    const byLine = new Map(plan.lines.map((l) => [l.source, l.chunks]));
    return (text, line) => byLine.get(line) || layout.chunk(text);
  };

  const tts = opts.tts || createEngine(config, log);
  const jobs = plans.flatMap((plan) => plan.lines.map((line) => ({ plan, line, clip: clipFor(line, tts, cacheDir) })));
  const cached = (job) => !opts.force && fs.existsSync(job.clip.audio) && fs.existsSync(job.clip.meta);

  if (opts.dryRun) {
    const results = plans.map((plan) => {
      const lineDurations = Object.fromEntries(plan.lines.map((l) => [l.key, estimateLine(l)]));
      const tl = layout.build(plan.video, { lineDurations, chunk: chunkOption(plan), wps: DRY_RUN_WPS });
      return { plan, tl, report: videoReport({ plan, tl, dryRun: true }) };
    });
    const pending = jobs.filter((job) => !cached(job)).length;
    return { dryRun: true, layoutSource: layout.source, results, pending, engine: tts.name };
  }

  await checkTools();
  fs.mkdirSync(path.join(cacheDir, 'tts'), { recursive: true });
  const todo = jobs.filter((job) => !cached(job));
  const synthesizedKeys = new Set();
  if (todo.length) {
    const offered = new Set((await tts.listVoices()).map((v) => v.name));
    const wanted = [...new Set(['narrador', 'lectora'].map((role) => config[config.engine].voices[role].name))];
    const missing = wanted.filter((name) => !offered.has(name));
    if (missing.length) {
      throw new Error(`${tts.name} does not offer the voice${missing.length > 1 ? 's' : ''} ${missing.join(', ')}; ` +
        'pick another in tools/voice.config.json (Edge: `edge-tts --list-voices`)');
    }
    const concurrency = Math.max(1, Math.min(Number(config[config.engine].concurrency) || 2, 8));
    log(`synthesizing ${todo.length} clip${todo.length > 1 ? 's' : ''} with ${tts.name} (${concurrency} at a time)…`);
    await pool(todo, concurrency, async (job, i) => {
      const { line, plan, clip } = job;
      log(`  ${i + 1}/${todo.length} ${plan.video.id} ${line.key} (${line.role}, ${line.voice})`);
      const request = tts.name === 'azure'
        ? { voice: line.voice, chunks: line.say ? [line.spoken] : line.spokenChunks, rate: line.rate, pitch: line.pitch, style: line.style }
        : { voice: line.voice, text: line.spoken, rate: line.rate, pitch: line.pitch };
      const result = await tts.synthesize(request, clip.audio);
      writeAtomic(clip.meta, JSON.stringify({
        engine: tts.name, voice: line.voice, rate: line.rate, pitch: line.pitch, text: line.spoken,
        words: result.words || [], bookmarks: result.bookmarks || [], bytes: result.bytes
      }, null, 1));
      synthesizedKeys.add(clip.key);
    });
  }

  const manifestFile = path.join(outRoot, 'assets', 'audio', 'manifest.js');
  const results = [];
  for (const plan of plans) {
    const id = plan.video.id;
    log(`mixing ${id}…`);
    const samples = new Map();
    const lineDurations = {};
    const chunkOffsets = {};
    const offsetsInfo = new Map();
    let synthesized = 0;
    for (const line of plan.lines) {
      const job = jobs.find((j) => j.line === line);
      if (synthesizedKeys.has(job.clip.key)) synthesized++;
      const pcm = await decodeClip(job.clip.audio, { sampleRate: SAMPLE_RATE });
      if (!pcm.length) throw new Error(`${id} ${line.key}: the clip ${job.clip.audio} decodes to no audio; run again with --force`);
      const duration = pcm.length / SAMPLE_RATE;
      const meta = JSON.parse(fs.readFileSync(job.clip.meta, 'utf8'));
      const info = chunkOffsetsFor(line, meta, duration);
      samples.set(line.key, pcm);
      lineDurations[line.key] = duration;
      if (info.valid) chunkOffsets[line.key] = info.offsets;
      offsetsInfo.set(line.key, info);
    }
    const tl = layout.build(plan.video, { lineDurations, chunkOffsets, chunk: chunkOption(plan) });
    const track = placeClips(tl.duration, SAMPLE_RATE, tl.lines.map((L) => ({ start: L.start, samples: samples.get(L.sceneId + ':' + L.index) })));
    const mixDir = path.join(cacheDir, 'mix');
    fs.mkdirSync(mixDir, { recursive: true });
    const wav = path.join(mixDir, id + '.wav');
    fs.writeFileSync(wav, wavBuffer(track, SAMPLE_RATE));
    const file = `assets/audio/${id}.mp3`;
    const mp3 = path.join(outRoot, file);
    fs.mkdirSync(path.dirname(mp3), { recursive: true });
    const mix = config.mix || {};
    try {
      await loudnormMp3(wav, mp3, {
        lufs: mix.loudnessLUFS ?? -16, truePeak: mix.truePeakDB ?? -1.5, bitrate: mix.mp3Bitrate || '128k',
        sampleRate: mix.sampleRate || 44100
      });
    } finally {
      fs.rmSync(wav, { force: true });
    }
    const mp3Duration = await probeDuration(mp3);
    const entry = layout.toManifest(tl, { file });
    writeAtomic(path.join(outRoot, 'assets', 'captions', id + '.vtt'), toVtt(entry, plan.video));
    const manifest = readManifest(manifestFile);
    manifest[id] = entry;
    const ordered = {};
    for (const v of EIA.data.videos) if (manifest[v.id]) ordered[v.id] = manifest[v.id];
    for (const v of all) if (manifest[v.id] && !ordered[v.id]) ordered[v.id] = manifest[v.id];
    writeAtomic(manifestFile, manifestSource(ordered));
    results.push({
      plan, tl, entry,
      report: videoReport({ plan, tl, dryRun: false, clips: { synthesized, offsets: offsetsInfo }, mp3Duration, file })
    });
  }
  return { dryRun: false, layoutSource: layout.source, results, engine: tts.name };
}

// -------------------------------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }
  const run = await generate(opts);
  const total = run.results.reduce((sum, r) => sum + r.tl.duration, 0);
  console.log(run.dryRun
    ? `DRY RUN — durations estimated at ${DRY_RUN_WPS} words/s; no audio was synthesized or written.\n`
    : `Voice-over written with ${run.engine}.\n`);
  for (const r of run.results) console.log(r.report + '\n');
  console.log(`${run.results.length} video${run.results.length === 1 ? '' : 's'} · total ${formatTime(total)}` +
    (run.dryRun ? ` (estimate) · clips to synthesize with ${run.engine}: ${run.pending}` : '') +
    ` · chunking/timing: ${run.layoutSource === 'engine' ? 'js/engine/captions.js + timeline.js'
      : 'tools fallback (js/engine/captions.js and timeline.js are not implemented yet)'}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error('generate-voiceover: ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  });
}
