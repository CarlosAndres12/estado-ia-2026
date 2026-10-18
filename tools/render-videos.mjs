#!/usr/bin/env node
// OPTIONAL MP4 export of the course videos (prompt §15, step 7). Dev-only; needs a local Chromium
// and ffmpeg/ffprobe on PATH. The site works without it: the player then records in the browser.
//
//   node tools/render-videos.mjs                       every video of js/data/videos.js
//   node tools/render-videos.mjs --only v02            one video (comma list or repeated)
//   node tools/render-videos.mjs --only v02 --by-chapter   one part per chapter, then concatenated
//   node tools/render-videos.mjs --only v02 --from 20 --to 30 --out review/mp4   a test segment
//       --scale 0.5        backing scale of the render canvas (0.5 = 640×360, quick previews)
//       --out <dir>        output folder (default assets/video for whole videos)
//       --fresh            ignore finished outputs and cached parts, render again
//
// How: index.html?render=<id>&scale=s (linear mode, subtitles on), then for every frame at 24 fps
// window.renderFrame(t) and the canvas as PNG through the DevTools Protocol, streamed into
// ffmpeg's stdin (image2pipe): no frame files on disk. Each part is H.264 yuv420p in
// tools/.cache/render/<id>-s<scale>-f<from>-<to>.mp4; the parts are joined (concat, stream copy)
// and muxed with the narration assets/audio/<id>.mp3 when it exists, a silent track otherwise:
// AAC, +faststart -> <out>/<slug>.mp4 (segments: <slug>-<from>-<to>.mp4).
//
// Resumable: a finished output is skipped, finished parts are reused (with --by-chapter a crash
// only loses the chapter being rendered); a part is renamed into place only once ffmpeg closed it.
// assets/video/index.js (window.EIA.videoExports, contracts §2) is updated, merged across runs,
// only for whole videos written to assets/video: never by segment runs or another --out.
//
// Machine safety (binding): one headless Chromium at a time, launched by tools/lib/browser.mjs
// through tools/dev/chromium-safe.sh (CPU and memory caps); ffmpeg under `nice -n 15` with
// `-threads 2`; every browser step, frame and ffmpeg run has a timeout. No audio is played.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FPS = 24;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SITE_DIR = path.join(ROOT, 'assets', 'video');
const INDEX_FILE = path.join(SITE_DIR, 'index.js');
const CACHE_DIR = path.join(HERE, '.cache', 'render');
const SEGMENT_DIR = path.join(CACHE_DIR, 'segments');
const FIXTURES = new Set(['vtest', 'vlong']);
const FRAME_TIMEOUT = 60000;
const FFMPEG_TIMEOUT = 15 * 60 * 1000;

const HELP = `node tools/render-videos.mjs [--only v02[,v03]] [--from S --to S] [--by-chapter]
                              [--scale 1] [--out dir] [--fresh]
  Renders the videos at ${FPS} fps (linear mode, subtitles) into H.264 + AAC MP4 files.
  Whole videos go to assets/video/<slug>.mp4 and assets/video/index.js; a --from/--to segment
  goes to --out (default tools/.cache/render/segments) and never touches the index.
  Prefer --by-chapter for long videos: an interrupted run then resumes at the chapter.`;

// ---------------------------------------------------------------------------------------------
// Pure parts (tested in tools/test/render-videos.test.mjs)

export function parseArgs(argv) {
  const out = { only: null, from: null, to: null, byChapter: false, scale: 1, out: null, fresh: false, help: false };
  const value = (i, name) => {
    const v = argv[i];
    if (v == null || String(v).startsWith('--')) throw new Error(`${name} needs a value`);
    return v;
  };
  const number = (i, name) => {
    const n = Number(value(i, name));
    if (!Number.isFinite(n) || n < 0) throw new Error(`${name} must be a number ≥ 0`);
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') {
      const ids = value(++i, '--only').split(',').map((s) => s.trim()).filter(Boolean);
      out.only = (out.only || []).concat(ids);
    } else if (a === '--from') out.from = number(++i, '--from');
    else if (a === '--to') out.to = number(++i, '--to');
    else if (a === '--by-chapter') out.byChapter = true;
    else if (a === '--scale') {
      out.scale = number(++i, '--scale');
      if (out.scale < 0.25 || out.scale > 3) throw new Error('--scale must be between 0.25 and 3');
    } else if (a === '--out') out.out = value(++i, '--out');
    else if (a === '--fresh') out.fresh = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else throw new Error(`unknown option ${a}`);
  }
  if (out.from != null && out.to != null && out.to <= out.from) throw new Error('--to must be greater than --from');
  return out;
}

/**
 * Frame ranges [f0, f1) to render; frame f is renderFrame(f / FPS). Whole range: one segment.
 * By chapter: one segment per chapter, split at round(chapter.start * FPS) so that consecutive
 * parts never share or skip a frame; the first part starts at 0 and the last ends at the last frame.
 */
export function planSegments({ duration, chapters = [], from = null, to = null, byChapter = false }) {
  const total = Math.round(Number(duration) * FPS);
  if (!(total > 0)) throw new Error(`video has no frames (duration ${duration})`);
  const f0 = from == null ? 0 : Math.round(from * FPS);
  const f1 = to == null ? total : Math.min(total, Math.round(to * FPS));
  if (f0 >= total || f1 <= f0) throw new Error(`range ${from ?? 0}–${to ?? duration} s is outside the video (${duration} s)`);
  if (!byChapter || !chapters.length) return [{ f0, f1, chapter: null }];
  const parts = [];
  chapters.forEach((c, i) => {
    const start = i === 0 ? 0 : Math.round(c.start * FPS);
    const next = chapters[i + 1];
    const end = next ? Math.round(next.start * FPS) : total;
    const a = Math.max(f0, start), b = Math.min(f1, end);
    if (b > a) parts.push({ f0: a, f1: b, chapter: c.index ?? i });
  });
  return parts;
}

export function segmentKey(id, scale, seg) {
  return `${id}-s${scale}-f${seg.f0}-${seg.f1}`;
}

export function readIndex(source) {
  if (!source) return {};
  const m = /window\.EIA\.videoExports\s*=\s*([\s\S]*?);?\s*$/.exec(String(source));
  if (!m) return {};
  try {
    const obj = JSON.parse(m[1]);
    return obj && typeof obj === 'object' ? obj : {};
  } catch (err) {
    throw new Error(`assets/video/index.js: cannot read the index (${err.message})`);
  }
}

/** New index with `entry` for `id`, others kept, ordered by the course order then the rest. */
export function mergeIndex(current, id, entry, order = []) {
  const all = { ...current, [id]: { ...entry } };
  const out = {};
  for (const k of order) if (all[k]) out[k] = all[k];
  for (const k of Object.keys(all)) if (!out[k]) out[k] = all[k];
  return out;
}

export function indexSource(index) {
  return `/* GENERATED by tools/render-videos.mjs — do not edit by hand.
 * { [videoId]: { file: 'assets/video/<slug>.mp4', duration, bytes } }
 * Empty until videos are exported: the player then records a linear pass in the browser. */
window.EIA = window.EIA || {};
window.EIA.videoExports = ${JSON.stringify(index, null, 2)};
`;
}

export function shouldWriteIndex({ segment, outDir, siteDir }) {
  return !segment && path.resolve(outDir) === path.resolve(siteDir);
}

// ---------------------------------------------------------------------------------------------
// Process helpers

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const secs = (f) => +(f / FPS).toFixed(3);
const rel = (p) => {
  const r = path.relative(ROOT, p);
  return r.startsWith('..') ? p : r || '.';
};

function ffmpeg(args, { stdin = false, timeout = FFMPEG_TIMEOUT } = {}) {
  const base = ['-n', '15', 'ffmpeg', '-hide_banner', '-loglevel', 'error'];
  if (!stdin) base.push('-nostdin');
  const child = spawn('nice', [...base, ...args], { stdio: [stdin ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
  const kill = () => { try { child.kill('SIGKILL'); } catch { /* gone */ } };
  process.on('exit', kill);
  let timer;
  const done = new Promise((resolve, reject) => {
    timer = setTimeout(() => { kill(); reject(new Error(`ffmpeg timed out after ${timeout} ms`)); }, timeout);
    child.on('error', reject);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      process.off('exit', kill);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (${code ?? signal}): ${err.trim()}`));
    });
  });
  done.catch(() => {});
  return { child, done, kill };
}

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf8', timeout: 60000 });
  const d = Number(String(r.stdout).trim());
  return Number.isFinite(d) ? +d.toFixed(3) : null;
}

function makeProgress(label, total) {
  const t0 = Date.now();
  let lastPrint = 0, lastPct = -1;
  const tty = process.stdout.isTTY;
  return (done, final = false) => {
    const now = Date.now();
    const pct = Math.floor((done / total) * 100);
    if (!final && (tty ? now - lastPrint < 500 : pct < lastPct + 10)) return;
    lastPrint = now;
    lastPct = pct;
    const fps = done / Math.max(0.001, (now - t0) / 1000);
    const eta = fps > 0 ? (total - done) / fps : 0;
    const line = `  ${label}  frame ${done}/${total} (${pct}%)  ${fps.toFixed(1)} fps  ` +
      (final ? `done in ${clock((now - t0) / 1000)}` : `ETA ${clock(eta)}`);
    if (tty) process.stdout.write(`\r${line}\x1b[K${final ? '\n' : ''}`);
    else console.log(line);
  };
}

// ---------------------------------------------------------------------------------------------
// Rendering

async function mount(b, id, scale) {
  const page = FIXTURES.has(id) ? path.join(ROOT, 'tools', 'dev', 'player.html') : path.join(ROOT, 'index.html');
  await b.open(`${pathToFileURL(page).href}?render=${encodeURIComponent(id)}&scale=${scale}`);
  const ok = await b.evaluate('Promise.resolve(window.renderReady).then((r) => r !== false && !window.renderError)', 120000);
  if (!ok) throw new Error(await b.evaluate('window.renderError || "renderReady failed"'));
  return b.evaluate(`({ duration: window.videoDuration, chapters: window.videoChapters,
    slug: window.videoTimeline.slug || ${JSON.stringify(id)}, title: window.videoTimeline.title,
    source: window.videoTimeline.source, width: window.renderCanvas.width, height: window.renderCanvas.height })`);
}

/** Renders frames [f0, f1) into `file` (video only). Written as .partial, renamed when complete. */
async function renderPart(b, seg, file, label) {
  const partial = file.replace(/\.mp4$/, '.partial.mp4');
  rmSync(partial, { force: true });
  const enc = ffmpeg(['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-filter_threads', '1', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-threads', '2',
    '-r', String(FPS), '-an', '-f', 'mp4', partial], { stdin: true, timeout: Math.max(FFMPEG_TIMEOUT, (seg.f1 - seg.f0) * 5000) });
  let failed = null;
  enc.done.catch((e) => { failed = e; });
  enc.child.stdin.on('error', (e) => { failed = failed || e; });
  const total = seg.f1 - seg.f0;
  const progress = makeProgress(label, total);
  try {
    for (let f = seg.f0; f < seg.f1; f++) {
      if (failed) throw failed;
      const url = await b.evaluate(`(window.renderFrame(${f / FPS}), window.renderCanvas.toDataURL('image/png'))`, FRAME_TIMEOUT);
      const buf = Buffer.from(String(url).slice(String(url).indexOf(',') + 1), 'base64');
      if (!enc.child.stdin.write(buf)) {
        await new Promise((resolve) => {
          const go = () => { enc.child.stdin.off('drain', go); enc.child.off('close', go); resolve(); };
          enc.child.stdin.on('drain', go);
          enc.child.on('close', go);
        });
      }
      progress(f - seg.f0 + 1);
    }
    enc.child.stdin.end();
    await enc.done;
  } catch (err) {
    enc.kill();
    rmSync(partial, { force: true });
    throw err;
  }
  progress(total, true);
  renameSync(partial, file);
}

/** Joins the parts and adds the narration (or silence) for [start, start + dur). */
async function mux(parts, audio, start, dur, out) {
  const list = path.join(CACHE_DIR, `concat-${process.pid}.txt`);
  writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  const audioIn = audio
    ? ['-ss', String(start), '-t', String(dur), '-i', audio]
    : ['-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo'];
  const tmp = out.replace(/\.mp4$/, '.partial.mp4');
  try {
    await ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', list, ...audioIn,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-af', 'apad', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
      '-threads', '2', '-t', String(dur), '-movflags', '+faststart', tmp]).done;
    renameSync(tmp, out);
  } finally {
    rmSync(list, { force: true });
    rmSync(tmp, { force: true });
  }
}

function writeIndexEntry(id, slug, file, order) {
  const entry = { file: `assets/video/${slug}.mp4`, duration: probe(file), bytes: statSync(file).size };
  const current = readIndex(existsSync(INDEX_FILE) ? readFileSync(INDEX_FILE, 'utf8') : '');
  const next = mergeIndex(current, id, entry, order);
  const tmp = INDEX_FILE + '.tmp';
  writeFileSync(tmp, indexSource(next));
  renameSync(tmp, INDEX_FILE);
  console.log(`  index: ${rel(INDEX_FILE)} ← ${id} ${entry.file} ${clock(entry.duration || 0)} ${(entry.bytes / 1e6).toFixed(1)} MB`);
}

async function exportVideo(id, opts, order) {
  const { launchBrowser } = await import('./lib/browser.mjs');
  const segment = opts.from != null || opts.to != null;
  const outDir = path.resolve(ROOT, opts.out || (segment ? SEGMENT_DIR : SITE_DIR));
  const writeIndex = shouldWriteIndex({ segment, outDir, siteDir: SITE_DIR });
  const w = Math.round(1280 * opts.scale), h = Math.round(720 * opts.scale);
  // One browser at a time: a short one reads the plan, then one per part with a time budget sized
  // to its frames (2 s per frame on top of 10 minutes), so a long video never hits the killer.
  const browser = (frames = 0) => launchBrowser({ width: w, height: h, timeout: 10 * 60 * 1000 + frames * 2000 });
  let v;
  const first = await browser();
  try { v = await mount(first, id, opts.scale); } finally { await first.close(); }
  const segs = planSegments({ duration: v.duration, chapters: v.chapters, from: opts.from, to: opts.to, byChapter: opts.byChapter });
  const f0 = segs[0].f0, f1 = segs[segs.length - 1].f1;
  const out = path.join(outDir, segment ? `${v.slug}-${secs(f0)}-${secs(f1)}.mp4` : `${v.slug}.mp4`);
  const mp3 = path.join(ROOT, 'assets', 'audio', `${id}.mp3`);
  const audio = existsSync(mp3) ? mp3 : null;
  console.log(`${id} «${v.title}» ${clock(v.duration)} (${v.source}) · ${v.width}×${v.height} · ` +
    `${f1 - f0} frames ${clock(secs(f0))}–${clock(secs(f1))} in ${segs.length} part(s) · voice: ${audio ? rel(audio) : 'none (silent track)'}`);
  if (existsSync(out) && !opts.fresh) {
    console.log(`  ✓ already exported: ${rel(out)} (use --fresh to render again)`);
    if (writeIndex) writeIndexEntry(id, v.slug, out, order);
    return 0;
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  let errors = 0;
  const parts = [];
  for (const [i, seg] of segs.entries()) {
    const file = path.join(CACHE_DIR, `${segmentKey(id, opts.scale, seg)}.mp4`);
    parts.push(file);
    const label = seg.chapter == null ? id : `${id} cap ${i + 1}/${segs.length}`;
    if (opts.fresh) rmSync(file, { force: true });
    if (existsSync(file)) { console.log(`  ✓ ${label}: cached part ${rel(file)}`); continue; }
    const b = await browser(seg.f1 - seg.f0);
    try {
      await mount(b, id, opts.scale);
      await renderPart(b, seg, file, label);
      errors += b.errors.splice(0).map((e) => console.log(`  ✗ ${label}: ${String(e).split('\n')[0]}`)).length;
    } finally {
      await b.close();
    }
  }
  console.log(`  mux: ${parts.length} part(s) + ${audio ? 'narration' : 'silence'} -> ${rel(out)}`);
  await mux(parts, audio, secs(f0), secs(f1 - f0), out);
  console.log(`  ✓ ${rel(out)} ${clock(probe(out) || 0)} ${(statSync(out).size / 1e6).toFixed(1)} MB`);
  if (writeIndex) writeIndexEntry(id, v.slug, out, order);
  for (const p of parts) rmSync(p, { force: true });
  return errors;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`${err.message}\n\n${HELP}`);
    process.exit(2);
  }
  if (opts.help) { console.log(HELP); return; }
  // Ctrl-C / kill: exit through process.exit so the browser and ffmpeg exit hooks kill them (a
  // signal alone would leave the detached Chromium running). Finished parts stay in the cache.
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => { console.error(`\n${sig}: stopping; finished parts stay in ${rel(CACHE_DIR)}`); process.exit(130); });
  }
  for (const tool of ['ffmpeg', 'ffprobe']) {
    if (spawnSync(tool, ['-version'], { timeout: 10000 }).status !== 0) {
      console.error(`${tool} not found on PATH: the MP4 export needs it.`);
      process.exit(1);
    }
  }
  const { loadData } = await import('./lib/load-data.mjs');
  const EIA = await loadData({ root: ROOT });
  const order = ((EIA.data && EIA.data.videos) || []).map((v) => v.id);
  const ids = opts.only || order;
  const unknown = ids.filter((id) => !order.includes(id) && !FIXTURES.has(id));
  if (unknown.length) { console.error(`unknown video(s): ${unknown.join(', ')} (known: ${order.join(', ')})`); process.exit(2); }
  let failures = 0, errors = 0;
  for (const id of ids) {
    try {
      errors += await exportVideo(id, opts, order);
    } catch (err) {
      failures++;
      console.error(`  ✗ ${id}: ${err.message}`);
    }
  }
  console.log(`render-videos: ${ids.length - failures}/${ids.length} exported · ${errors} console errors`);
  process.exit(failures || errors ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
