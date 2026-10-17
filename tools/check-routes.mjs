#!/usr/bin/env node
// Route check of the site (prompt §16.1: "every route and deep link opens", "no console errors").
// Dev-only; needs a local Chromium.
//
//   node tools/check-routes.mjs                  every route and deep link: a fresh load of each
//                                                (index.html?check=N#route), scrolled top to bottom so
//                                                lazy players and lámina thumbnails run, then one
//                                                in-app pass that changes only the hash
//   node tools/check-routes.mjs --shots          also one screenshot per route -> review/routes/<name>.png
//       --full                                   full-page screenshots (height capped by --max-height, 9000)
//       --pages 4                                N viewport screenshots down the page (<name>-p1…pN.png)
//   --width 1280  --height 800                   viewport (e.g. --width 360 for a phone); file names get
//                                                a "-w<width>" suffix when the width is not 1280
//   --only s3,cifras/adop-1                      a subset (hashes without "#")
//   --reduced-motion                             emulates prefers-reduced-motion: reduce
//   --no-scroll                                  skips the top-to-bottom scroll of each fresh load
//
// Each route reports its console errors and exceptions; a route also fails when its view does not
// render (no visible .view[data-route] with an h1) or a deep link has no target. Exit code 1 on any
// failure. One headless Chromium for the whole run, launched by tools/lib/browser.mjs through
// tools/dev/chromium-safe.sh (CPU and memory caps), with a timeout on every step.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = pathToFileURL(path.join(ROOT, 'index.html')).href;

export const ROUTES = ['inicio', 'mapa', 'evidencia', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'proyecto',
  'cifras', 'glosario', 'preguntas', 'referencias', 'asistente', 'clase'];
export const DEEP_LINKS = ['s1/actividad', 's3/actividad', 's3/contenido-4', 's5/facilitador', 's7/contenido-9',
  'cifras/adop-1', 'cifras/correccion-pwc', 'glosario/agente', 'preguntas/p3', 'referencias/mck25',
  'proyecto/hoja-s1-ficha', 'clase/3', 'clase/taller'];

function parseArgs(argv) {
  const out = { shots: false, full: false, pages: 0, width: 1280, height: 800, maxHeight: 9000, only: null, reduced: false, scroll: true, out: 'review/routes' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--shots') out.shots = true;
    else if (a === '--full') out.full = true;
    else if (a === '--pages') out.pages = Math.max(1, Math.min(40, Number(argv[++i]) || 1));
    else if (a === '--width') out.width = Number(argv[++i]);
    else if (a === '--height') out.height = Number(argv[++i]);
    else if (a === '--max-height') out.maxHeight = Number(argv[++i]);
    else if (a === '--only') out.only = String(argv[++i]).split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean);
    else if (a === '--reduced-motion') out.reduced = true;
    else if (a === '--no-scroll') out.scroll = false;
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('node tools/check-routes.mjs [--shots [--full] [--max-height N]] [--width W] [--height H] [--only a,b/c] [--reduced-motion] [--no-scroll] [--out dir]');
      process.exit(0);
    } else throw new Error(`unknown option ${a}`);
  }
  if (!(out.width >= 320 && out.width <= 3840)) throw new Error('--width must be between 320 and 3840');
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// What the page says about the current route: the visible view, its h1 and the deep-link target.
function inspectExpr(hash) {
  const [route, block] = hash.split('/');
  return `(() => {
    const v = document.querySelector('.view:not([hidden])');
    const target = ${JSON.stringify(block || '')} ? document.getElementById(${JSON.stringify(route + '--' + (block || ''))}) : null;
    return {
      route: v ? v.getAttribute('data-route') : null,
      h1: v && v.querySelector('h1') ? v.querySelector('h1').textContent.trim().slice(0, 80) : '',
      target: !!target,
      height: document.documentElement.scrollHeight,
      title: document.title
    };
  })()`;
}

function expectedRoute(hash) {
  const [route, block] = hash.split('/');
  if (route === 'clase' && block) return 'clase';
  return route;
}

async function waitReady(b) {
  await b.evaluate('(window.EIA && EIA.ui && EIA.ui.ready ? EIA.ui.ready : Promise.resolve()).then(() => true)', 30000);
}

async function scrollThrough(b, height, viewport) {
  const step = Math.round(viewport * 1.5);
  for (let y = 0; y < height; y += step) {
    await b.evaluate(`window.scrollTo(0, ${y}); true`);
    await sleep(140);
  }
  await sleep(400);
}

async function shoot(b, opts, name, restoreScrollExpr) {
  const suffix = opts.width !== 1280 ? '-w' + opts.width : '';
  const file = path.join(ROOT, opts.out, name + suffix + '.png');
  if (opts.pages > 1) {
    const files = [];
    const total = await b.evaluate('document.documentElement.scrollHeight');
    for (let i = 0; i < opts.pages; i++) {
      const y = i * (opts.height - 100);
      if (y >= total) break;
      await b.evaluate(`window.scrollTo(0, ${y}); true`);
      await sleep(900);
      const f = path.join(ROOT, opts.out, `${name}${suffix}-p${i + 1}.png`);
      writeFileSync(f, await b.screenshot());
      files.push(path.relative(ROOT, f));
    }
    return files.join(', ');
  }
  if (opts.full) {
    const h = await b.evaluate('document.documentElement.scrollHeight');
    const height = Math.min(opts.maxHeight, Math.max(opts.height, h));
    await b.cdp('Emulation.setDeviceMetricsOverride', { width: opts.width, height, deviceScaleFactor: 1, mobile: false });
    await b.evaluate('window.scrollTo(0, 0); true');
    await sleep(900);
    writeFileSync(file, await b.screenshot());
    await b.cdp('Emulation.setDeviceMetricsOverride', { width: opts.width, height: opts.height, deviceScaleFactor: 1, mobile: false });
  } else {
    if (restoreScrollExpr) await b.evaluate(restoreScrollExpr);
    await sleep(700);
    writeFileSync(file, await b.screenshot());
  }
  return path.relative(ROOT, file);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const list = opts.only || [...ROUTES, ...DEEP_LINKS];
  if (opts.shots) mkdirSync(path.join(ROOT, opts.out), { recursive: true });
  const b = await launchBrowser({ width: opts.width, height: opts.height, timeout: 15 * 60 * 1000 });
  const failures = [];
  try {
    if (opts.reduced) await b.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    console.log(`Fresh loads (${list.length}) at ${opts.width}×${opts.height}${opts.reduced ? ', reduced motion' : ''}:`);
    let n = 0;
    for (const hash of list) {
      n++;
      const from = b.errors.length;
      await b.open(`${SITE}?check=${n}#${hash}`);
      await waitReady(b);
      await sleep(500);
      const deep = hash.includes('/');
      let info = await b.evaluate(inspectExpr(hash));
      const scrollTop = await b.evaluate('window.scrollY');
      if (opts.scroll && !deep) await scrollThrough(b, info.height, opts.height);
      info = await b.evaluate(inspectExpr(hash));
      const problems = b.errors.slice(from);
      if (info.route !== expectedRoute(hash)) problems.push(`visible view is ${info.route}, expected ${expectedRoute(hash)}`);
      if (!info.h1) problems.push('the view has no h1');
      if (deep && !hash.startsWith('clase/') && !info.target) problems.push('deep-link target not found');
      let shot = '';
      if (opts.shots) shot = await shoot(b, opts, hash.replace(/\//g, '_'), `window.scrollTo(0, ${scrollTop}); true`);
      const status = problems.length ? 'FAIL' : 'ok';
      console.log(`  ${status.padEnd(4)} #${hash.padEnd(24)} ${String(info.height).padStart(6)} px  «${info.h1}»${shot ? '  ' + shot : ''}`);
      for (const p of problems) console.log(`         ${String(p).split('\n')[0].slice(0, 240)}`);
      if (problems.length) failures.push({ hash, problems });
    }

    console.log('In-app navigation (hash changes in one page):');
    const from = b.errors.length;
    await b.open(`${SITE}?check=nav#inicio`);
    await waitReady(b);
    for (const hash of list) {
      const before = b.errors.length;
      await b.evaluate(`new Promise((resolve) => {
        const done = () => { window.removeEventListener('eia:route', done); setTimeout(() => resolve(true), 350); };
        window.addEventListener('eia:route', done);
        if (location.hash === '#${hash}') { window.removeEventListener('eia:route', done); resolve(true); }
        else location.hash = '#${hash}';
        setTimeout(() => resolve(false), 5000);
      })`, 10000);
      const info = await b.evaluate(inspectExpr(hash));
      const problems = b.errors.slice(before);
      if (info.route !== expectedRoute(hash)) problems.push(`visible view is ${info.route}, expected ${expectedRoute(hash)}`);
      if (problems.length) {
        console.log(`  FAIL #${hash}`);
        for (const p of problems) console.log(`         ${String(p).split('\n')[0].slice(0, 240)}`);
        failures.push({ hash: 'nav:' + hash, problems });
      }
    }
    const navErrors = b.errors.length - from;
    console.log(`  ${navErrors ? 'FAIL' : 'ok'}   ${list.length} hash changes, ${navErrors} console error(s)`);
  } finally {
    await b.close();
  }
  console.log(`\nResult: ${list.length} routes and deep links, ${failures.length} with problems.`);
  process.exit(failures.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
}
