// Zero-dependency headless browser driver for the dev tools (snapshots, exports).
//
//   import { launchBrowser } from './lib/browser.mjs';
//   const b = await launchBrowser({ width: 1280, height: 720, timeout: 120000 });
//   await b.open('file:///…/index.html?render=v02');   // navigates and waits for `load`
//   const d = await b.evaluate('window.renderReady.then(() => videoDuration)');
//   const png = await b.screenshot();                    // PNG Buffer of the viewport
//   b.messages                                           // [{ type, text }] console and log output
//   b.errors                                             // [string] exceptions, console.error, log errors
//   await b.cdp('Performance.getMetrics')                // raw DevTools Protocol command
//   await b.close();
//
// Uses Playwright when it is installed (tools/node_modules), otherwise launches Chromium itself and
// speaks the Chrome DevTools Protocol over Node's built-in WebSocket (Node ≥ 22).
//
// Machine safety (binding for every tool): Chromium is launched only through
// tools/dev/chromium-safe.sh (CPU and memory caps) when that wrapper exists; CHROME_PATH overrides
// the executable; without either, the first of chromium, google-chrome, chromium-browser on PATH.
// One browser per call, every step has a timeout, and the whole browser is killed after
// `opts.timeout` ms (default 10 minutes) or when Node exits.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAFE_WRAPPER = path.resolve(HERE, '..', 'dev', 'chromium-safe.sh');
const STEP_TIMEOUT = 60000;

function onPath(name) {
  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    const full = path.join(dir, name);
    try {
      if (statSync(full).isFile()) return full;
    } catch { /* not here */ }
  }
  return null;
}

export function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (existsSync(SAFE_WRAPPER)) return SAFE_WRAPPER;
  for (const name of ['chromium', 'google-chrome', 'chromium-browser', 'google-chrome-stable']) {
    const found = onPath(name);
    if (found) return found;
  }
  throw new Error('No Chromium found: set CHROME_PATH or install chromium.');
}

function withTimeout(promise, ms, what) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timeout after ${ms} ms: ${what}`)), ms); })
  ]).finally(() => clearTimeout(timer));
}

function remoteText(arg) {
  if (!arg) return '';
  if (arg.value !== undefined) return typeof arg.value === 'string' ? arg.value : JSON.stringify(arg.value);
  return arg.description || arg.unserializableValue || arg.type || '';
}

// ---------------------------------------------------------------------------------------------
// Playwright adapter

async function tryPlaywright(opts, exe) {
  let pw;
  try {
    pw = await import('playwright');
  } catch {
    return null;
  }
  const browser = await pw.chromium.launch({ headless: true, executablePath: exe, timeout: STEP_TIMEOUT });
  const context = await browser.newContext({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: opts.dpr });
  const page = await context.newPage();
  const messages = [];
  const errors = [];
  page.on('console', (m) => {
    messages.push({ type: m.type(), text: m.text() });
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e && (e.stack || e.message) || e)));
  let session = null;
  const killer = setTimeout(() => browser.close().catch(() => {}), opts.timeout);
  return {
    engine: 'playwright',
    messages,
    errors,
    async open(url) { await page.goto(url, { waitUntil: 'load', timeout: STEP_TIMEOUT }); },
    async evaluate(expr, ms = STEP_TIMEOUT) { return withTimeout(page.evaluate(expr), ms, 'evaluate'); },
    async screenshot() { return page.screenshot({ type: 'png' }); },
    async cdp(method, params = {}) {
      session = session || await context.newCDPSession(page);
      return session.send(method, params);
    },
    async close() {
      clearTimeout(killer);
      await browser.close().catch(() => {});
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Built-in CDP driver

async function launchCdp(opts, exe) {
  const userDir = mkdtempSync(path.join(tmpdir(), 'eia-chromium-'));
  const args = [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${userDir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync',
    '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
    '--disable-features=Translate,MediaRouter,OptimizationHints', '--mute-audio', '--hide-scrollbars',
    `--window-size=${opts.width},${opts.height}`, 'about:blank'
  ];
  const child = spawn(exe, args, { stdio: ['ignore', 'ignore', 'pipe'], detached: true });
  let exited = false;
  child.on('exit', () => { exited = true; });

  function kill(signal) {
    if (exited) return;
    try { process.kill(-child.pid, signal); } catch { try { child.kill(signal); } catch { /* gone */ } }
  }
  const onExit = () => kill('SIGKILL');
  process.on('exit', onExit);

  const wsUrl = await withTimeout(new Promise((resolve, reject) => {
    let buf = '';
    child.stderr.on('data', (d) => {
      buf += d.toString();
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
      if (m) resolve(m[1]);
    });
    child.on('exit', (code) => reject(new Error(`Chromium exited (${code}) before DevTools was ready:\n${buf.slice(-2000)}`)));
    child.on('error', reject);
  }), 30000, 'Chromium start').catch((err) => { kill('SIGKILL'); throw err; });
  child.stderr.resume();

  const ws = new WebSocket(wsUrl);
  await withTimeout(new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('DevTools WebSocket failed')), { once: true });
  }), 15000, 'DevTools connection');

  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject, method } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners.get(msg.method) || []) fn(msg.params || {}, msg.sessionId);
    }
  });
  function send(method, params = {}, sessionId, ms = STEP_TIMEOUT) {
    const id = nextId++;
    const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }));
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return withTimeout(p, ms, method).catch((err) => { pending.delete(id); throw err; });
  }
  function on(method, fn) {
    if (!listeners.has(method)) listeners.set(method, []);
    listeners.get(method).push(fn);
  }

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const messages = [];
  const errors = [];
  on('Runtime.consoleAPICalled', (p, sid) => {
    if (sid !== sessionId) return;
    const text = (p.args || []).map(remoteText).join(' ');
    messages.push({ type: p.type, text });
    if (p.type === 'error' || p.type === 'assert') errors.push(text);
  });
  on('Runtime.exceptionThrown', (p, sid) => {
    if (sid !== sessionId) return;
    const d = p.exceptionDetails || {};
    errors.push((d.exception && d.exception.description) || d.text || 'exception');
  });
  on('Log.entryAdded', (p, sid) => {
    if (sid !== sessionId) return;
    const e = p.entry || {};
    messages.push({ type: e.level, text: `${e.text}${e.url ? ' ' + e.url : ''}` });
    if (e.level === 'error') errors.push(`${e.text}${e.url ? ' ' + e.url : ''}`);
  });
  let loadWaiters = [];
  on('Page.loadEventFired', (p, sid) => {
    if (sid !== sessionId) return;
    const w = loadWaiters;
    loadWaiters = [];
    w.forEach((fn) => fn());
  });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Log.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: opts.width, height: opts.height, deviceScaleFactor: opts.dpr, mobile: false }, sessionId);

  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;
    clearTimeout(killer);
    try { await send('Browser.close', {}, undefined, 3000); } catch { /* killed below */ }
    try { ws.close(); } catch { /* closed */ }
    await new Promise((r) => setTimeout(r, 300));
    kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 500));
    kill('SIGKILL');
    process.off('exit', onExit);
    try { rmSync(userDir, { recursive: true, force: true }); } catch { /* temp dir stays */ }
  }
  const killer = setTimeout(() => { close(); }, opts.timeout);

  return {
    engine: 'cdp',
    messages,
    errors,
    async open(url) {
      const loaded = new Promise((resolve) => loadWaiters.push(resolve));
      const r = await send('Page.navigate', { url }, sessionId);
      if (r.errorText) throw new Error(`navigation failed: ${r.errorText} (${url})`);
      await withTimeout(loaded, STEP_TIMEOUT, `load ${url}`);
    },
    async evaluate(expression, ms = STEP_TIMEOUT) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId, ms);
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error((d.exception && d.exception.description) || d.text || 'evaluate failed');
      }
      return r.result ? r.result.value : undefined;
    },
    async screenshot() {
      const r = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
      return Buffer.from(r.data, 'base64');
    },
    async cdp(method, params = {}) { return send(method, params, sessionId); },
    close
  };
}

export async function launchBrowser(options = {}) {
  const opts = { width: 1280, height: 720, dpr: 1, timeout: 10 * 60 * 1000, ...options };
  const exe = findBrowser();
  const viaPlaywright = opts.playwright === false ? null : await tryPlaywright(opts, exe).catch(() => null);
  return viaPlaywright || launchCdp(opts, exe);
}
