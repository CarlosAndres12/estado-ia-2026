#!/usr/bin/env node
/* tools/generate-timeline-voiceover.mjs — the narration of sesión 0, the AI timeline (#s0).
 *
 *   node tools/generate-timeline-voiceover.mjs               synthesize what is missing, write the assets
 *   node tools/generate-timeline-voiceover.mjs --dry-run     no network, no ffmpeg: estimate and report
 *   node tools/generate-timeline-voiceover.mjs --only alphago,intro   some clips (the manifest keeps the others)
 *   node tools/generate-timeline-voiceover.mjs --force       synthesize again, ignoring the clip cache
 *   node tools/generate-timeline-voiceover.mjs --out <dir>   write assets/ under <dir> instead of the repository
 *
 * One clip per milestone of js/data/linea-tiempo.js (its `narracion`) plus 'intro', with the same engine,
 * voice (the videos' narrador), normalizer, clip cache, word alignment, tail trim and loudness as
 * tools/generate-voiceover.mjs, whose helpers it reuses. Each clip is a file of its own, so a click
 * plays it at once:
 *
 *   assets/audio/s0/<key>.mp3       MP3 mono, two-pass loudnorm (tools/voice.config.json "mix")
 *   assets/audio/s0/manifest.js     window.EIA.timelineAudio = { [key]: { file, duration, chunks:
 *                                   [{ text, start, end }] } }, a classic script so file:// works
 *
 * The timeline has its own manifest because tools/generate-voiceover.mjs rewrites
 * assets/audio/manifest.js with the video ids only. Nothing here plays or transcribes audio.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { analyze, countWords } from './lib/normalize-es.mjs';
import { loadVoiceData, createLayout, timeChunks as fallbackTimeChunks } from './lib/voice-layout.mjs';
import { checkTools, decodeClip, wavBuffer, loudnormMp3, probeDuration } from './lib/audio.mjs';
import { readManifest, formatTime } from './lib/voice-assets.mjs';
import {
  DEFAULT_ROOT, CACHE_DIR, SAMPLE_RATE, TAIL_SECONDS, DRY_RUN_WPS,
  loadConfig, createEngine, clipFor, chunkOffsetsFor, trimTail
} from './generate-voiceover.mjs';

export const AUDIO_DIR = 'assets/audio/s0';
export const MANIFEST_FILE = AUDIO_DIR + '/manifest.js';
export const ROLE = 'narrador';

/* Names and signs of the timeline that the course lexicon does not cover (keys with capitals match
 * their exact case). Display text stays as the CSV writes it; only the speech changes. */
export const TIMELINE_LEXICON = Object.freeze({
  'DeepSeek-R1': 'dipsík erre uno',
  'DALL·E': 'dal i',
  ELIZA: 'elisa',
  SHAKEY: 'sheiki',
  STANLEY: 'stanli',
  DARPA: 'darpa',
  BERT: 'bert',
  '4–1': 'cuatro a uno'
});

const HELP = `Usage: node tools/generate-timeline-voiceover.mjs [--dry-run] [--only intro,alphago] [--force] [--out <dir>]
  --dry-run   estimate durations and report; no network, no ffmpeg, no files
  --only      generate only these clips ('intro' or milestone ids; the manifest keeps the others)
  --force     ignore the clip cache (tools/.cache/tts/)
  --out       write ${AUDIO_DIR} under <dir> (default: the repository)`;

export function parseArgs(argv) {
  const opts = { dryRun: false, force: false, only: null, out: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s);
    const value = () => (inline !== undefined ? inline : argv[++i]);
    if (flag === '--dry-run') opts.dryRun = true;
    else if (flag === '--force') opts.force = true;
    else if (flag === '--only') opts.only = String(value() || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (flag === '--out') opts.out = value();
    else if (flag === '--help' || flag === '-h') opts.help = true;
    else throw new Error(`unknown option ${flag} (try --help)`);
  }
  return opts;
}

/** The clips to speak: 'intro' and every milestone, with display chunks and normalized speech. */
export function planClips(EIA, { layout, config }) {
  const lt = EIA.data.lineaTiempo;
  if (!lt) throw new Error('js/data/linea-tiempo.js is not loaded (EIA.data.lineaTiempo is missing)');
  const engine = config.engine || 'edge';
  const ec = config[engine] || {};
  const voice = (ec.voices || {})[ROLE] || {};
  const lexicon = { ...(config.lexicon || {}), ...TIMELINE_LEXICON };
  const items = [{ key: 'intro', text: lt.intro.narracion }, ...lt.hitos.map((h) => ({ key: h.id, text: h.narracion }))];
  return items.map(({ key, text }) => {
    const chunks = layout.chunk(text || '');
    const analyses = chunks.map((chunk) => analyze(chunk, { lexicon }));
    const spokenChunks = analyses.map((a) => a.text);
    const spoken = spokenChunks.join(' ');
    if (!spoken) throw new Error(`${key} has no speakable text`);
    return {
      key, role: ROLE, voice: voice.name, pitch: voice.pitch || (engine === 'edge' ? '+0Hz' : '0%'), style: voice.style || '',
      rate: (ec.rate && ec.rate.default) || '0%', text, chunks, spokenChunks, spoken, say: false,
      warnings: analyses.flatMap((a) => a.warnings)
    };
  });
}

/** assets/audio/s0/manifest.js: one line per clip so diffs stay readable. */
export function timelineManifestSource(manifest) {
  const json = (value) => JSON.stringify(value);
  const rows = Object.entries(manifest).map(([key, e]) =>
    `  ${json(key)}: { "file": ${json(e.file)}, "duration": ${json(e.duration)}, "chunks": ${json(e.chunks)} }`);
  return '/* GENERATED by tools/generate-timeline-voiceover.mjs — do not edit by hand.\n' +
    ' * { [intro | milestone id]: { file, duration, chunks: [{ text, start, end }] } } — sesión 0, js/ui/linea-tiempo.js.\n' +
    ' * Times are seconds from the start of each clip. A missing entry plays as captions only. */\n' +
    'window.EIA = window.EIA || {};\n' +
    `window.EIA.timelineAudio = {${rows.length ? '\n' + rows.join(',\n') + '\n' : ''}};\n`;
}

/** The timeline manifest an earlier run wrote ({} when there is none). */
export function readTimelineManifest(file) {
  if (!fs.existsSync(file)) return {};
  const sandbox = {};
  sandbox.window = sandbox;
  try {
    const code = fs.readFileSync(file, 'utf8');
    new Function('window', code)(sandbox);
  } catch {
    return {};
  }
  return JSON.parse(JSON.stringify((sandbox.EIA && sandbox.EIA.timelineAudio) || {}));
}

const round3 = (x) => Math.round(x * 1000) / 1000;

function writeAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.part', data);
  fs.renameSync(file + '.part', file);
}

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

/**
 * Runs the timeline voice-over. Options: { root, out, only, force, dryRun, config, EIA, tts, cacheDir, log }
 * (EIA, tts and cacheDir are injection points for tests).
 * @returns {Promise<{ dryRun, engine, clips: [{ key, duration, file, warnings, valid }], pending?, total }>}
 */
export async function generate(opts = {}) {
  const root = path.resolve(opts.root || DEFAULT_ROOT);
  const outRoot = path.resolve(opts.out || root);
  const cacheDir = opts.cacheDir || CACHE_DIR;
  const config = opts.config || loadConfig();
  const log = opts.log || ((s) => process.stderr.write(s + '\n'));
  const EIA = opts.EIA || await loadVoiceData({ root });
  const layout = createLayout(EIA);
  const timeChunks = (EIA.engine && EIA.engine.captions && EIA.engine.captions.timeChunks) || fallbackTimeChunks;
  const all = planClips(EIA, { layout, config });
  let plan = all;
  if (opts.only && opts.only.length) {
    const unknown = opts.only.filter((k) => !all.some((c) => c.key === k));
    if (unknown.length) throw new Error(`unknown clip ${unknown.join(', ')} (known: ${all.map((c) => c.key).join(', ')})`);
    plan = all.filter((c) => opts.only.includes(c.key));
  }

  const tts = opts.tts || createEngine(config, log);
  const jobs = plan.map((line) => ({ line, clip: clipFor(line, tts, cacheDir) }));
  const cached = (job) => !opts.force && fs.existsSync(job.clip.audio) && fs.existsSync(job.clip.meta);

  if (opts.dryRun) {
    const wps = Number(config[config.engine] && config[config.engine].dryRunWps) || DRY_RUN_WPS;
    const clips = plan.map((l) => ({ key: l.key, duration: Math.max(0.8, countWords(l.spoken) / wps), file: null, warnings: l.warnings, valid: true }));
    return { dryRun: true, engine: tts.name, clips, pending: jobs.filter((j) => !cached(j)).length, total: clips.reduce((s, c) => s + c.duration, 0) };
  }

  await checkTools();
  fs.mkdirSync(path.join(cacheDir, 'tts'), { recursive: true });
  const todo = jobs.filter((job) => !cached(job));
  if (todo.length) {
    const offered = new Set((await tts.listVoices()).map((v) => v.name));
    const wanted = config[config.engine].voices[ROLE].name;
    if (!offered.has(wanted)) throw new Error(`${tts.name} does not offer the voice ${wanted}; pick another in tools/voice.config.json`);
    const concurrency = Math.max(1, Math.min(Number(config[config.engine].concurrency) || 2, 8));
    log(`synthesizing ${todo.length} clip${todo.length > 1 ? 's' : ''} with ${tts.name} (${concurrency} at a time)…`);
    await pool(todo, concurrency, async ({ line, clip }, i) => {
      log(`  ${i + 1}/${todo.length} ${line.key} (${line.voice})`);
      const result = await tts.synthesize({ voice: line.voice, text: line.spoken, rate: line.rate, pitch: line.pitch }, clip.audio);
      writeAtomic(clip.meta, JSON.stringify({
        engine: tts.name, voice: line.voice, rate: line.rate, pitch: line.pitch, text: line.spoken,
        words: result.words || [], bookmarks: result.bookmarks || [], bytes: result.bytes
      }, null, 1));
    });
  }

  const manifestFile = path.join(outRoot, MANIFEST_FILE);
  const manifest = readTimelineManifest(manifestFile);
  const mix = config.mix || {};
  const tail = Number.isFinite(Number(mix.tailSeconds)) ? Number(mix.tailSeconds) : TAIL_SECONDS;
  const mixDir = path.join(cacheDir, 'mix');
  fs.mkdirSync(mixDir, { recursive: true });
  const clips = [];
  for (const { line, clip } of jobs) {
    const meta = JSON.parse(fs.readFileSync(clip.meta, 'utf8'));
    const decoded = await decodeClip(clip.audio, { sampleRate: SAMPLE_RATE });
    if (!decoded.length) throw new Error(`${line.key}: the clip ${clip.audio} decodes to no audio; run again with --force`);
    const pcm = trimTail(decoded, meta.words, SAMPLE_RATE, tail);
    const info = chunkOffsetsFor(line, meta, pcm.length / SAMPLE_RATE);
    const wav = path.join(mixDir, 's0-' + line.key + '.wav');
    fs.writeFileSync(wav, wavBuffer(pcm, SAMPLE_RATE));
    const file = `${AUDIO_DIR}/${line.key}.mp3`;
    const mp3 = path.join(outRoot, file);
    fs.mkdirSync(path.dirname(mp3), { recursive: true });
    try {
      await loudnormMp3(wav, mp3, {
        lufs: mix.loudnessLUFS ?? -16, truePeak: mix.truePeakDB ?? -1.5, bitrate: mix.mp3Bitrate || '128k', sampleRate: mix.sampleRate || 44100
      });
    } finally {
      fs.rmSync(wav, { force: true });
    }
    const duration = round3(await probeDuration(mp3));
    const timed = timeChunks(line.chunks, 0, duration, info.valid ? info.offsets : undefined);
    manifest[line.key] = { file, duration, chunks: timed.map((c) => ({ text: c.text, start: round3(c.start), end: round3(c.end) })) };
    clips.push({ key: line.key, duration, file, warnings: line.warnings, valid: info.valid });
  }
  const ordered = {};
  for (const c of all) if (manifest[c.key]) ordered[c.key] = manifest[c.key];
  writeAtomic(manifestFile, timelineManifestSource(ordered));
  return { dryRun: false, engine: tts.name, clips, total: clips.reduce((s, c) => s + c.duration, 0) };
}

// -------------------------------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }
  const run = await generate(opts);
  console.log(run.dryRun ? 'DRY RUN — durations estimated; no audio was synthesized or written.\n' : `Timeline narration written with ${run.engine}.\n`);
  for (const c of run.clips) {
    const notes = [...c.warnings.map((w) => w.code + ': ' + w.message), ...(c.valid ? [] : ['caption times by character count'])];
    console.log(`  ${c.key.padEnd(24)} ${formatTime(c.duration)}${run.dryRun ? ' (estimate)' : ''}${notes.length ? ' · ' + notes.join(' · ') : ''}`);
  }
  console.log(`\n${run.clips.length} clip${run.clips.length === 1 ? '' : 's'} · total ${formatTime(run.total)}` +
    (run.dryRun ? ` · to synthesize with ${run.engine}: ${run.pending}` : ` · ${MANIFEST_FILE}`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error('generate-timeline-voiceover: ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  });
}
