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
//   node tools/check-routes.mjs --interact       instead of the routes, drives the interactive tools in
//                                                one page (prompt §10): every tool of the 7 sessions
//                                                mounts, one quiz question answered, each game touched,
//                                                the notebook and the rubric, the láminas viewer and
//                                                Modo clase of sesión 3 walked through, and both print
//                                                sheets printed to PDF (page count, canvases not blank)
//                                                -> review/interact/*.pdf (--out to change the folder)
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

export const ROUTES = ['inicio', 'mapa', 'evidencia', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'proyecto',
  'cifras', 'glosario', 'preguntas', 'referencias', 'asistente', 'clase'];
export const DEEP_LINKS = ['s0/alphago', 's1/actividad', 's3/actividad', 's3/contenido-4', 's5/facilitador', 's7/contenido-9',
  'cifras/adop-1', 'cifras/correccion-pwc', 'glosario/agente', 'preguntas/p3', 'referencias/mck25',
  'proyecto/hoja-s1-ficha', 'clase/3', 'clase/taller'];

function parseArgs(argv) {
  const out = { shots: false, full: false, pages: 0, width: 1280, height: 800, maxHeight: 9000, only: null, reduced: false, scroll: true, out: null, interact: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--shots') out.shots = true;
    else if (a === '--interact') out.interact = true;
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
      console.log('node tools/check-routes.mjs [--shots [--full] [--max-height N]] [--width W] [--height H] [--only a,b/c] [--reduced-motion] [--no-scroll] [--out dir]\n' +
        'node tools/check-routes.mjs --interact [--width W] [--height H] [--out dir]');
      process.exit(0);
    } else throw new Error(`unknown option ${a}`);
  }
  if (!(out.width >= 320 && out.width <= 3840)) throw new Error('--width must be between 320 and 3840');
  out.out = out.out || (out.interact ? 'review/interact' : 'review/routes');
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// What the page says about the current route: the visible view, its h1 and the deep-link target.
// Modo clase (js/ui/presenter.js) covers the page with its own dialog and leaves the view underneath
// as it was, so an open Modo clase counts as the #clase route.
function inspectExpr(hash) {
  const [route, block] = hash.split('/');
  return `(() => {
    const v = document.querySelector('.view:not([hidden])');
    const modo = document.querySelector('.clase[role="dialog"]');
    const target = ${JSON.stringify(block || '')} ? document.getElementById(${JSON.stringify(route + '--' + (block || ''))}) : null;
    return {
      route: modo ? 'clase' : (v ? v.getAttribute('data-route') : null),
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

// -------------------------------------------------------------------------------------------------
// --interact: the interactive tools of prompt §10, driven in one page. Each step is an expression
// evaluated in the page that resolves to { ok, detail }; page-side helpers live in window.__chk.

const HELPERS = `(() => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__chk = {
    wait,
    $: (sel, el) => (el || document).querySelector(sel),
    $$: (sel, el) => Array.prototype.slice.call((el || document).querySelectorAll(sel)),
    key: (k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })),
    input: (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); },
    go: (hash) => new Promise((resolve) => {
      if (location.hash === '#' + hash) { resolve(); return; }
      const done = () => { window.removeEventListener('eia:route', done); setTimeout(resolve, 500); };
      window.addEventListener('eia:route', done);
      location.hash = '#' + hash;
      setTimeout(resolve, 6000);
    }),
    // Distinct colors on an 8×8 grid of samples: a blank canvas has one or two.
    colors: (c) => {
      const ctx = c.getContext('2d'), seen = new Set();
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        seen.add(ctx.getImageData(Math.floor((x + 0.5) * c.width / 8), Math.floor((y + 0.5) * c.height / 8), 1, 1).data.join(','));
      }
      return seen.size;
    }
  };
  return true;
})()`;

const INTERACT_STEPS = [
  {
    name: 'every tool of the 7 sessions mounts (and the quiz of sesiones 1–6)',
    expr: `(async () => {
      const missing = [];
      for (let n = 1; n <= 7; n++) {
        await __chk.go('s' + n);
        const view = __chk.$('.view[data-route="s' + n + '"]');
        const mounts = __chk.$$('.tool-mount', view);
        mounts.forEach((m) => { if (!m.children.length || __chk.$('.placeholder', m)) missing.push('s' + n + ':' + m.getAttribute('data-tool')); });
        if (n <= 6 && !__chk.$('#s' + n + '--quiz .quiz', view)) missing.push('s' + n + ':quiz');
      }
      return { ok: !missing.length, detail: missing.length ? 'not mounted: ' + missing.join(', ') : 'all mounted' };
    })()`
  },
  {
    name: 'quiz of sesión 1: a wrong try, then the right answer',
    expr: `(async () => {
      await __chk.go('s1/quiz');
      const q = EIA.data.sesiones[1].quiz[0];
      const box = __chk.$('#s1--quiz .quiz');
      const wrong = q.respuesta === 0 ? 1 : 0;
      __chk.$('.quiz__option[data-i="' + wrong + '"]', box).click();
      const casi = __chk.$('.feedback', box).className.includes('feedback--casi');
      __chk.$('.quiz__option[data-i="' + q.respuesta + '"]', box).click();
      const bien = __chk.$('.feedback', box).className.includes('feedback--bien');
      return { ok: casi && bien, detail: 'casi=' + casi + ' bien=' + bien };
    })()`
  },
  {
    name: 'games: S1 card, S2 preset, S3 panel and popover, S5 claim, S6 layer, S7 indicators and timer',
    expr: `(async () => {
      const out = [];
      await __chk.go('s1/actividad');
      let g = __chk.$('#s1--s1-que-mide .game');
      __chk.$('[data-card="mckinsey-88"]', g).click(); __chk.$('[data-bin="uso"]', g).click();
      out.push('s1=' + __chk.$$('.game-bin__item', g).length);
      await __chk.go('s2/actividad');
      const calc = __chk.$('#s2--s2-pasos');
      __chk.$$('.calc__presets .btn', calc)[1].click();
      out.push('s2=' + (__chk.$('.calc__result', calc).textContent === EIA.data.actividades['s2-pasos'].presets[1].resultado));
      await __chk.go('s3/actividad');
      const fun = __chk.$('#s3--s3-embudo');
      __chk.$('.funnel__toggle', fun).click();
      __chk.$('.funnel__bar', fun).click();
      out.push('s3=' + (!__chk.$('.funnel__panel', fun).hidden && !!__chk.$('#eia-pop:not([hidden])')));
      if (EIA.ui.popover) EIA.ui.popover.close();
      await __chk.go('s5/actividad');
      g = __chk.$('#s5--s5-escalera .game');
      __chk.$('[data-claim="notas-clinicas"]', g).click(); __chk.$('[data-rung="3"]', g).click();
      out.push('s5=' + __chk.$$('.ladder__tag', g).length);
      await __chk.go('s6/actividad');
      const cal = __chk.$('#s6--s6-calendario');
      __chk.$('.cal__layer--omnibus', cal).click();
      out.push('s6=' + __chk.$$('.cal__pin', cal).length + '/' + __chk.$$('.cal__card', cal).length);
      await __chk.go('s7/actividad');
      const ind = __chk.$('#s7--s7-indicadores');
      __chk.$('.ind__all', ind).click();
      out.push('s7ind=' + __chk.$$('.ind__pregunta:not([hidden])', ind).length);
      const tm = __chk.$('#s7--s7-presentacion');
      __chk.input(__chk.$('.timer__input', tm), 'Equipo de prueba');
      __chk.$('.timer__add-row .btn', tm).click();
      __chk.$('.timer__buttons .btn--primary', tm).click();
      await __chk.wait(1300);
      __chk.$('.timer__buttons .btn--primary', tm).click();
      out.push('s7timer=' + __chk.$('.timer__digits', tm).textContent);
      // S6: one pin per layer and date, one card per KB milestone, both layers on.
      const hitos = EIA.data.actividades['s6-calendario'].hitos;
      const s6 = new Set(hitos.map((x) => x.capa + x.iso)).size + '/' + hitos.length;
      const ok = out.join(' ') === 's1=1 s2=true s3=true s5=1 s6=' + s6 + ' s7ind=9 s7timer=6:59';
      return { ok, detail: out.join(' ') };
    })()`
  },
  {
    name: 'team notebook: a sheet field, a noted question, the rubric score',
    expr: `(async () => {
      await __chk.go('s1/discusion');
      __chk.$('#s1--discusion .btn--note').click();
      await __chk.go('proyecto/cuaderno');
      const sheet = __chk.$('#proyecto--hoja-s1-ficha');
      __chk.input(__chk.$('textarea', sheet), 'La IA propone; una persona decide.');
      const notes = __chk.$$('#proyecto--hoja-notas .sheet-note').length;
      const stored = EIA.ui.cuaderno.model.get(['hojas', 's1-ficha', 'ficha', 'tarea']);
      const rb = __chk.$('.rubric');
      __chk.$$('.rubric__row')[0].querySelector('.rubric__radio').click();
      await __chk.wait(200);
      const score = __chk.$('.rubric__score', rb).textContent;
      const ok = !!sheet && notes === 1 && stored === 'La IA propone; una persona decide.' && score === 'Puntaje de la rúbrica: 20/100';
      return { ok, detail: 'sheet=' + !!sheet + ' notes=' + notes + ' stored=' + JSON.stringify(stored) + ' «' + score + '»' };
    })()`
  },
  {
    // Captions only: the audio manifest is emptied first, so nothing is played (no audio checks here).
    name: 'sesión 0 timeline: two poster panels drawn, 24 milestones, click selects + captions + opens its ficha, arrows move focus, deep link',
    expr: `(async () => {
      await __chk.go('s0');
      EIA.timelineAudio = {};
      await __chk.wait(300);
      const panels = __chk.$$('#s0--hitos .poster__panel').length;
      const inked = (c) => { try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return true; } catch (e) {} return false; };
      const lines = __chk.$$('#s0--hitos .poster__line').filter(inked).length;
      const arts = __chk.$$('#s0--hitos .poster__art').filter(inked).length;
      const pageScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      const btns = __chk.$$('#s0--hitos .timeline__hito');
      // Every ficha fits its page with the real fonts.
      await EIA.engine.lamina.fontsReady();
      const F = EIA.ui.lineaTiempoFichas;
      const over = EIA.data.lineaTiempo.hitos.filter((h) => F.layout(null, h).overflow).map((h) => h.id);
      btns[2].click();
      await __chk.wait(600);
      const title = __chk.$('#s0--detalle-titulo').textContent;
      const pressed = btns[2].getAttribute('aria-pressed');
      const caption = __chk.$('.timeline__caption').textContent;
      // The tap opened the ficha in the viewer; → moves to the next one, Esc syncs the selection without playing.
      const ficha = __chk.$('.visor') ? __chk.$('.visor__count').textContent + ' «' + __chk.$('.visor__title').textContent + '»' : 'none';
      __chk.key('ArrowRight');
      const fichaBlank = __chk.$('.visor') ? __chk.colors(__chk.$('.visor__canvas')) < 5 : true;
      const next = __chk.$('.visor') ? __chk.$('.visor__count').textContent : '';
      __chk.key('Escape');
      await __chk.wait(300);
      const synced = !__chk.$('.visor') && __chk.$('#s0--detalle-titulo').textContent === 'ELIZA' && btns[3].getAttribute('aria-pressed') === 'true' &&
        document.activeElement === btns[3] && __chk.$('.timeline__narration .btn').getAttribute('aria-pressed') !== 'true';
      const hash = location.hash;
      btns[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      const moved = document.activeElement === btns[4] && !__chk.$('.visor');
      __chk.$('.timeline__controls .btn--primary').click();
      await __chk.wait(300);
      const all = __chk.$('.timeline__controls .btn--primary').getAttribute('aria-pressed');
      const allNoFicha = !__chk.$('.visor');
      __chk.$('.timeline__controls .btn--primary').click();
      const verFicha = __chk.$('.timeline__ficha');
      verFicha.click();
      await __chk.wait(300);
      const fromCard = __chk.$('.visor') ? __chk.$('.visor__count').textContent : 'none';
      __chk.key('Escape');
      await __chk.wait(200);
      const back = !__chk.$('.visor') && document.activeElement === __chk.$('.timeline__ficha');
      await __chk.go('s0/chatgpt');
      await __chk.wait(300);
      const deep = __chk.$('#s0--detalle-titulo').textContent;
      const ok = panels === 2 && lines === 2 && arts === 19 && !pageScroll && btns.length === 24 && !over.length && title === 'Lisp y programación simbólica' &&
        pressed === 'true' && caption.length > 0 && ficha === '3 de 24 «1958 · Lisp y programación simbólica»' && !fichaBlank && next === '4 de 24' && synced &&
        hash === '#s0/eliza' && moved && all === 'true' && allNoFicha && fromCard === '4 de 24' && back && deep === 'ChatGPT';
      return { ok, detail: 'panels=' + panels + ' lines=' + lines + ' arts=' + arts + ' pageScroll=' + pageScroll + ' n=' + btns.length + ' overflow=[' + over.join(',') + '] «' + title + '» pressed=' + pressed +
        ' caption=' + caption.length + ' ficha=' + ficha + ' blank=' + fichaBlank + ' next=' + next + ' synced=' + synced + ' ' + hash + ' moved=' + moved + ' all=' + all +
        ' allNoFicha=' + allNoFicha + ' fromCard=' + fromCard + ' back=' + back + ' deep=«' + deep + '»' };
    })()`
  },
  {
    name: 'láminas viewer of sesión 3: open, next, notes, close',
    expr: `(async () => {
      await __chk.go('s3/laminas');
      __chk.$('#s3--laminas .lamina-thumb').click();
      await __chk.wait(500);
      const opened = !!__chk.$('.visor');
      __chk.key('ArrowRight');
      const count = __chk.$('.visor__count').textContent;
      __chk.key('n');
      const notes = !__chk.$('.visor__notes').hidden;
      const blank = __chk.colors(__chk.$('.visor__canvas')) < 5;
      __chk.key('Escape');
      await __chk.wait(200);
      const closed = !__chk.$('.visor');
      return { ok: opened && count === '2 de 3' && notes && !blank && closed, detail: 'opened=' + opened + ' «' + count + '» notes=' + notes + ' canvasBlank=' + blank + ' closed=' + closed };
    })()`
  },
  {
    name: 'Modo clase of sesión 3: every slide, notes drawer, clock, exit',
    expr: `(async () => {
      await __chk.go('clase/3');
      await __chk.wait(600);
      const opened = !!__chk.$('.clase');
      const total = Number((__chk.$('.clase__count').textContent.split('/')[1] || '').trim());
      for (let i = 1; i < total; i++) { __chk.key('ArrowRight'); await __chk.wait(120); }
      const last = __chk.$('.clase__count').textContent;
      __chk.key('n');
      const drawer = !__chk.$('.clase__drawer').hidden;
      const start = __chk.$('.clase__clock .btn--primary');
      start.click(); await __chk.wait(1300); start.click();
      const time = __chk.$('.clase__time').textContent;
      __chk.key('Escape'); __chk.key('Escape');
      await __chk.wait(700);
      const closed = !__chk.$('.clase') && !location.hash.startsWith('#clase');
      const ok = opened && total > 10 && last === total + ' / ' + total && drawer && !/^0:00 /.test(time) && closed;
      return { ok, detail: 'slides=' + total + ' last=«' + last + '» drawer=' + drawer + ' clock=«' + time + '» closed=' + closed };
    })()`
  }
];

// Page count of a PDF (its /Type /Page objects).
function pdfPages(buf) {
  return (buf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;
}

async function printSheet(b, opts, name, prepareExpr, canvasSelector) {
  const from = b.errors.length;
  const info = await b.evaluate(`(async () => {
    window.__cleanup = ${prepareExpr};
    await __chk.wait(300);
    const canvases = __chk.$$(${JSON.stringify(canvasSelector || 'canvas.none')});
    return { canvases: canvases.length, blank: canvases.filter((c) => __chk.colors(c) < 5).length };
  })()`, 30000);
  const r = await b.cdp('Page.printToPDF', { preferCSSPageSize: true, printBackground: true });
  await b.evaluate('window.__cleanup && window.__cleanup(); true');
  const buf = Buffer.from(r.data, 'base64');
  const file = path.join(ROOT, opts.out, name + '.pdf');
  writeFileSync(file, buf);
  return { pages: pdfPages(buf), canvases: info.canvases, blank: info.blank, file: path.relative(ROOT, file), errors: b.errors.slice(from) };
}

async function runInteract(b, opts) {
  mkdirSync(path.join(ROOT, opts.out), { recursive: true });
  const failures = [];
  await b.open(`${SITE}?check=interact#inicio`);
  await waitReady(b);
  await b.evaluate(HELPERS);
  console.log(`Interactive tools (${INTERACT_STEPS.length} steps + 2 print sheets) at ${opts.width}×${opts.height}:`);
  for (const step of INTERACT_STEPS) {
    const from = b.errors.length;
    let res;
    try { res = await b.evaluate(step.expr, 90000); } catch (err) { res = { ok: false, detail: String(err.message || err).split('\n')[0] }; }
    const problems = b.errors.slice(from);
    const ok = res && res.ok && !problems.length;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${step.name}\n         ${res ? res.detail : ''}`);
    for (const p of problems) console.log(`         ${String(p).split('\n')[0].slice(0, 240)}`);
    if (!ok) failures.push(step.name);
  }
  const sheets = [
    { name: 'laminas-s3', label: '«Imprimir láminas» (sesión 3, two per page)', expr: "EIA.ui.laminasViewer.preparePrint(['d06', 'd07', 'd08'])", canvases: '#print-laminas canvas', pages: 2 },
    { name: 'cuaderno', label: '«Imprimir cuaderno» (notebook, decision log, rubric)', expr: 'EIA.ui.cuaderno.preparePrint()', canvases: null, pages: 0 }
  ];
  for (const s of sheets) {
    let r;
    try { r = await printSheet(b, opts, s.name, s.expr, s.canvases); } catch (err) { r = { pages: 0, canvases: 0, blank: 0, file: '', errors: [String(err.message || err)] }; }
    const ok = r.pages > 0 && (!s.pages || r.pages === s.pages) && !r.blank && !r.errors.length;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${s.label}\n         ${r.pages} page(s), ${r.canvases} canvas(es), ${r.blank} blank  ${r.file}`);
    for (const p of r.errors) console.log(`         ${String(p).split('\n')[0].slice(0, 240)}`);
    if (!ok) failures.push(s.label);
  }
  console.log(`\nResult: ${INTERACT_STEPS.length + sheets.length} interaction checks, ${failures.length} with problems.`);
  return failures.length;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.interact) {
    const b = await launchBrowser({ width: opts.width, height: opts.height, timeout: 10 * 60 * 1000 });
    let failed = 1;
    try { failed = await runInteract(b, opts); } finally { await b.close(); }
    process.exit(failed ? 1 : 0);
  }
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
