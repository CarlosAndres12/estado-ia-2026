/* tools/lib/load-data.mjs — evaluates the site's data scripts in a Node vm sandbox.
 *
 * Dev-only (Node >= 20, built-ins only). The site ships its data as classic scripts that add to the
 * global `window.EIA` (no ES modules, no JSON fetch), so the tools read the data exactly as the page
 * does: they run `js/core/namespace.js` and then every `js/data/**` script in the order of the
 * <script> tags of index.html, inside one vm context where `window === globalThis`.
 *
 *   import { loadData } from './lib/load-data.mjs';
 *   const EIA = await loadData({ root: '.' });                      // namespace + all data files
 *   const EIA2 = await loadData({ root: '.', extra: ['js/engine/captions.js', 'js/engine/timeline.js'] });
 *
 * `extra` lists repo-relative scripts evaluated after the data, in the given order (DOM-free engine
 * modules, generated manifests, test fixtures). The loaded scripts must be DOM-free at load time;
 * the sandbox has no `document`, no `localStorage` and no network.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const NAMESPACE_FILE = 'js/core/namespace.js';

/** Script `src` values of index.html, in document order. */
export function scriptOrder(root = '.') {
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  const out = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

/** The data scripts (js/data/**) of index.html, in document order. */
export function dataScripts(root = '.') {
  return scriptOrder(root).filter((src) => src.startsWith('js/data/'));
}

/** A fresh sandbox context with `window === globalThis` and a quiet console. */
export function createContext({ console: logger = console } = {}) {
  const context = vm.createContext({ console: logger });
  vm.runInContext('globalThis.window = globalThis; globalThis.self = globalThis;', context);
  return context;
}

/** Evaluates one repo-relative script in `context`; errors name the file. */
export function runScript(context, root, file) {
  const full = path.join(root, file);
  if (!existsSync(full)) throw new Error('load-data: missing script ' + file);
  const code = readFileSync(full, 'utf8');
  try {
    vm.runInContext(code, context, { filename: file });
  } catch (err) {
    err.message = file + ': ' + err.message;
    throw err;
  }
}

/**
 * Loads the site data and returns the `EIA` namespace object of the sandbox.
 * @param {{ root?: string, extra?: string[], files?: string[], console?: Console }} opts
 *   root   repository root (default '.')
 *   extra  repo-relative scripts to evaluate after the data files
 *   files  replaces the data file list (default: the js/data/** scripts of index.html)
 */
export async function loadData({ root = '.', extra = [], files, console: logger } = {}) {
  const context = createContext({ console: logger || console });
  const list = [NAMESPACE_FILE, ...(files || dataScripts(root)), ...extra];
  for (const file of list) runScript(context, root, file);
  const EIA = context.EIA;
  if (!EIA || !EIA.data) throw new Error('load-data: window.EIA.data was not created');
  // Non-enumerable handles for tools that need to evaluate more code in the same sandbox.
  Object.defineProperty(EIA, '__context', { value: context, enumerable: false });
  Object.defineProperty(EIA, '__files', { value: list, enumerable: false });
  return EIA;
}
