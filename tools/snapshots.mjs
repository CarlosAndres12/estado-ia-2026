#!/usr/bin/env node
// Review frames for videos and láminas (prompt §15, step 2). Dev-only; needs a local Chromium.
//
//   node tools/snapshots.mjs                    every video of js/data/videos.js
//   node tools/snapshots.mjs --only v02         one video (fixtures: --only vtest, --only vlong)
//   node tools/snapshots.mjs --laminas          index.html?lamina=dNN stills -> review/laminas/
//   node tools/snapshots.mjs --determinism      renders the same t twice and compares the pixels
//   node tools/snapshots.mjs --perf             plays a 60 s sample of the 15-minute test timeline
//                                               (vlong) in real time: frame times and JS heap
//       --seconds 60  --from 0                  sample length and start; --full plays all of it
//   --out review    --scale 1                   output folder; backing scale of the render canvas
//
// Video frames: one at the midpoint of every voice line and two per checkpoint card (question and
// answer) -> review/<id>/NN-<scene>-lK.png, NN-checkpoint-K-pregunta|respuesta.png, plus
// review/<id>/hoja-de-contactos.png composed in the page. Console errors and exceptions are
// reported; the exit code is 1 when there is any.
//
// One headless Chromium for the whole run, launched by tools/lib/browser.mjs through
// tools/dev/chromium-safe.sh, with a timeout on every step.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = new Set(['vtest', 'vlong']);
const SITE = pathToFileURL(path.join(ROOT, 'index.html')).href;
const DEV = pathToFileURL(path.join(ROOT, 'tools', 'dev', 'player.html')).href;

function parseArgs(argv) {
  const out = { only: null, laminas: false, determinism: false, perf: false, full: false, seconds: 60, from: 0, out: 'review', scale: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only') out.only = argv[++i];
    else if (a === '--laminas') out.laminas = true;
    else if (a === '--determinism') out.determinism = true;
    else if (a === '--perf') out.perf = true;
    else if (a === '--full') out.full = true;
    else if (a === '--seconds') out.seconds = Number(argv[++i]);
    else if (a === '--from') out.from = Number(argv[++i]);
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--scale') out.scale = Number(argv[++i]);
    else if (a === '--help' || a === '-h') { console.log(readHelp()); process.exit(0); }
    else throw new Error(`unknown option ${a}`);
  }
  return out;
}

function readHelp() {
  return 'node tools/snapshots.mjs [--only <id>] [--laminas] [--determinism] [--perf [--seconds N] [--from T] [--full]] [--out dir] [--scale s]';
}

const pageFor = (id) => (FIXTURES.has(id) ? DEV : SITE);
const clock = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function writeDataUrl(file, dataUrl) {
  writeFileSync(file, Buffer.from(String(dataUrl).replace(/^data:image\/png;base64,/, ''), 'base64'));
}

function freshDir(dir) {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith('.png')) rmSync(path.join(dir, f));
}

let errorCount = 0;
function takeErrors(b, where) {
  const errs = b.errors.splice(0);
  b.messages.splice(0);
  errs.forEach((e) => console.log(`  ✗ ${where}: ${String(e).split('\n')[0]}`));
  errorCount += errs.length;
  return errs.length;
}

async function mountVideo(b, id, opts) {
  await b.open(`${pageFor(id)}?render=${encodeURIComponent(id)}&scale=${opts.scale}`);
  const ok = await b.evaluate('Promise.resolve(window.renderReady).then((r) => r !== false && !window.renderError)', 60000);
  if (!ok) {
    const why = await b.evaluate('window.renderError || "renderReady failed"');
    console.log(`  ✗ ${id}: ${why}`);
    errorCount++;
    return false;
  }
  return true;
}

// Midpoint of every line, question (start + 2 s) and answer (start + 5 s) of every checkpoint.
const FRAME_LIST = `(() => {
  const tl = window.videoTimeline, out = [];
  tl.lines.forEach((l) => out.push({ t: (l.start + l.end) / 2, name: l.sceneId + '-l' + l.index }));
  tl.checkpoints.forEach((c) => {
    out.push({ t: c.start + 2, name: 'checkpoint-' + (c.checkpoint + 1) + '-pregunta' });
    out.push({ t: c.start + 5, name: 'checkpoint-' + (c.checkpoint + 1) + '-respuesta' });
  });
  out.sort((a, b) => a.t - b.t);
  out.forEach((f, i) => { f.name = String(i + 1).padStart(2, '0') + '-' + f.name; });
  return { frames: out, duration: tl.duration, source: tl.source, title: tl.title };
})()`;

function contactSheetExpr(frames) {
  return `(() => {
    const frames = ${JSON.stringify(frames)};
    const cols = 4, tw = 320, th = 180, lh = 24;
    const sheet = document.createElement('canvas');
    sheet.width = cols * tw;
    sheet.height = Math.ceil(frames.length / cols) * (th + lh);
    const g = sheet.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, sheet.width, sheet.height);
    frames.forEach((f, i) => {
      const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + lh);
      window.renderFrame(f.t);
      g.drawImage(window.renderCanvas, x, y, tw, th);
      g.fillStyle = '#15120F';
      g.font = '13px sans-serif';
      g.fillText(f.name + ' · ' + f.t.toFixed(2) + ' s', x + 6, y + th + 16);
    });
    return sheet.toDataURL('image/png');
  })()`;
}

async function snapshotVideo(b, id, opts) {
  if (!(await mountVideo(b, id, opts))) return;
  const { frames, duration, source, title } = await b.evaluate(FRAME_LIST);
  const dir = path.join(ROOT, opts.out, id);
  freshDir(dir);
  for (const f of frames) {
    const url = await b.evaluate(`(window.renderFrame(${f.t}), window.renderCanvas.toDataURL('image/png'))`);
    writeDataUrl(path.join(dir, f.name + '.png'), url);
  }
  writeDataUrl(path.join(dir, 'hoja-de-contactos.png'), await b.evaluate(contactSheetExpr(frames), 120000));
  const errs = takeErrors(b, id);
  console.log(`  ${id} «${title}» ${clock(duration)} (${source}): ${frames.length} frames + contact sheet -> ${path.relative(ROOT, dir)}/ · ${errs} console errors`);
}

// Same t twice, with other frames rendered in between (caches and layer LRU in another state).
async function determinism(b, id, opts) {
  if (!(await mountVideo(b, id, opts))) return true;
  const result = await b.evaluate(`(() => {
    const tl = window.videoTimeline, c = window.renderCanvas, g = c.getContext('2d');
    const times = [];
    const step = Math.max(1, Math.floor(tl.lines.length / 8));
    tl.lines.forEach((l, i) => { if (i % step === 0) times.push((l.start + l.end) / 2); });
    tl.checkpoints.forEach((cp) => times.push(cp.start + 2, cp.start + 5));
    tl.scenes.slice(1, 7).forEach((s) => times.push(s.start));          // crossfade midpoints
    times.push(0, tl.duration);
    const snap = (t) => { window.renderFrame(t); return g.getImageData(0, 0, c.width, c.height).data; };
    const first = times.map((t) => snap(t).slice());
    const diffs = [];
    for (let i = times.length - 1; i >= 0; i--) {
      const again = snap(times[i]);
      let n = 0;
      for (let k = 0; k < again.length; k++) if (again[k] !== first[i][k]) n++;
      if (n) diffs.push({ t: times[i], bytes: n });
    }
    return { frames: times.length, diffs };
  })()`, 180000);
  takeErrors(b, id);
  const same = result.diffs.length === 0;
  console.log(`  ${id}: ${result.frames} times rendered twice -> ${same ? 'identical pixels' : 'DIFFERENT: ' + JSON.stringify(result.diffs)}`);
  return same;
}

async function laminas(b, opts) {
  await b.open(SITE);
  const ids = await b.evaluate('(window.EIA.data.deck || []).map((d) => d.id)');
  takeErrors(b, 'index.html');
  const dir = path.join(ROOT, opts.out, 'laminas');
  freshDir(dir);
  for (const id of ids) {
    await b.open(`${SITE}?lamina=${id}&still=1`);
    const ok = await b.evaluate('typeof window.renderFrame === "function" && Promise.resolve(window.renderReady).then(() => true)', 60000).catch(() => false);
    if (!ok) { console.log(`  ✗ ${id}: renderFrame not available`); errorCount++; continue; }
    const url = await b.evaluate('(window.renderFrame(0), document.querySelector("canvas").toDataURL("image/png"))');
    writeDataUrl(path.join(dir, id + '.png'), url);
    const errs = takeErrors(b, id);
    console.log(`  ${id} -> ${path.relative(ROOT, dir)}/${id}.png · ${errs} console errors`);
  }
}

async function heapMB(b) {
  await b.cdp('HeapProfiler.collectGarbage').catch(() => {});
  const r = await b.cdp('Runtime.getHeapUsage');
  return r.usedSize / 1048576;
}

async function perf(b, opts) {
  await b.open(`${DEV}?perf=vlong`);
  const started = await b.evaluate(`window.perfStart(${opts.from})`, 60000);
  if (!started) throw new Error('the perf player did not start');
  const duration = await b.evaluate('window.perfPlayer.duration');
  const seconds = opts.full ? duration - opts.from : Math.min(opts.seconds, duration - opts.from);
  await new Promise((r) => setTimeout(r, 3000));                       // warm-up: first layers, fonts
  const heapStart = await heapMB(b);
  const t0 = await b.evaluate('window.perfReset()');                    // measure the sample only
  console.log(`  vlong ${clock(duration)}: playing ${clock(seconds)} in real time from ${clock(opts.from)} (heap ${heapStart.toFixed(1)} MB)…`);
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, Math.min(10000, until - Date.now())));
    const s = await b.evaluate('window.perfStats()');
    process.stdout.write(`    t = ${clock(s.t)} · ${s.frames} frames · avg ${s.avg.toFixed(2)} ms\n`);
    if (!s.playing) break;
  }
  const s = await b.evaluate('window.perfStats()');
  const heapEnd = await heapMB(b);
  takeErrors(b, 'vlong');
  const played = s.t - t0;
  console.log(`  frames rendered: ${s.frames} over ${played.toFixed(1)} s of video (${(s.frames / Math.max(1, played)).toFixed(1)} fps, target 24)`);
  console.log(`  frame time: avg ${s.avg.toFixed(2)} ms · p95 ${s.p95.toFixed(2)} ms · max ${s.max.toFixed(2)} ms · budget 41,7 ms · late frames ${s.dropped}`);
  console.log(`  JS heap: start ${heapStart.toFixed(1)} MB · end ${heapEnd.toFixed(1)} MB (${(heapEnd - heapStart >= 0 ? '+' : '') + (heapEnd - heapStart).toFixed(1)} MB)`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const b = await launchBrowser({ width: 1280, height: opts.perf ? 1100 : 720, timeout: opts.full ? 30 * 60 * 1000 : 15 * 60 * 1000 });
  console.log(`browser: ${b.engine}`);
  let ok = true;
  try {
    if (opts.perf) {
      await perf(b, opts);
    } else if (opts.laminas) {
      await laminas(b, opts);
    } else {
      let ids = opts.only ? [opts.only] : null;
      if (!ids) {
        await b.open(SITE);
        ids = await b.evaluate('(window.EIA.data.videos || []).map((v) => v.id)');
        const errs = takeErrors(b, 'index.html');
        console.log(`  index.html: ${ids.length} videos · ${errs} console errors`);
      }
      for (const id of ids) {
        if (opts.determinism) ok = (await determinism(b, id, opts)) && ok;
        else await snapshotVideo(b, id, opts);
      }
    }
  } finally {
    await b.close();
  }
  console.log(errorCount ? `${errorCount} console errors` : 'no console errors');
  process.exit(errorCount || !ok ? 1 : 0);
}

main().catch((err) => {
  console.error(err && err.stack || err);
  process.exit(2);
});
