// Tests for the pure part of js/core/router.js — hash parsing, formatting and course order
// (prompt §9.1). Run from the repository root:  node --test tools/test/router.test.mjs
//
// router.js is a classic script that must not touch the DOM at load time; it is evaluated in a Node vm
// sandbox (window === globalThis, no location, no document) after js/core/namespace.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, root), 'utf8');

function load() {
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const rel of ['js/core/namespace.js', 'js/core/router.js']) {
    vm.runInContext(read(rel), sandbox, { filename: rel });
  }
  return sandbox.EIA;
}

const EIA = load();
const R = EIA.router;
// Values created inside the vm carry another realm's prototypes; compare them as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));

test('loads without a DOM and exposes the router API', () => {
  for (const name of ['parse', 'format', 'neighbors', 'sessionNumber', 'start', 'go', 'current', 'previous']) {
    assert.equal(typeof R[name], 'function', name);
  }
});

test('knows every route of the site, in course order first', () => {
  assert.deepEqual(plain(R.ROUTES), ['inicio', 'mapa', 'evidencia', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'proyecto',
    'cifras', 'glosario', 'preguntas', 'referencias', 'asistente', 'clase']);
  assert.deepEqual(plain(R.ORDER), ['inicio', 'mapa', 'evidencia', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'proyecto']);
});

test('an empty hash is #inicio', () => {
  assert.deepEqual(plain(R.parse('')), { route: 'inicio', block: '', known: true });
  assert.deepEqual(plain(R.parse('#')), { route: 'inicio', block: '', known: true });
  assert.deepEqual(plain(R.parse(undefined)), { route: 'inicio', block: '', known: true });
});

test('a route without a block', () => {
  assert.deepEqual(plain(R.parse('#s3')), { route: 's3', block: '', known: true });
  assert.deepEqual(plain(R.parse('#cifras')), { route: 'cifras', block: '', known: true });
});

test('deep links to blocks', () => {
  assert.deepEqual(plain(R.parse('#s3/actividad')), { route: 's3', block: 'actividad', known: true });
  assert.deepEqual(plain(R.parse('#cifras/adop-1')), { route: 'cifras', block: 'adop-1', known: true });
  assert.deepEqual(plain(R.parse('#glosario/costo-total')), { route: 'glosario', block: 'costo-total', known: true });
  assert.deepEqual(plain(R.parse('#preguntas/p3')), { route: 'preguntas', block: 'p3', known: true });
});

test('tolerates a leading slash, case, spaces and URL encoding', () => {
  assert.deepEqual(plain(R.parse('#/S3/Actividad')), { route: 's3', block: 'actividad', known: true });
  assert.deepEqual(plain(R.parse(' #s2 ')), { route: 's2', block: '', known: true });
  assert.deepEqual(plain(R.parse('#glosario%2Fagente')), { route: 'glosario', block: 'agente', known: true });
});

test('a block keeps only safe id characters and stops at the next slash', () => {
  assert.deepEqual(plain(R.parse('#s3/actividad/extra')), { route: 's3', block: 'actividad', known: true });
  assert.deepEqual(plain(R.parse('#s3/<img onerror=x>')), { route: 's3', block: '', known: true });
});

test('a query string inside the hash is ignored', () => {
  assert.deepEqual(plain(R.parse('#s3/actividad?utm=x')), { route: 's3', block: 'actividad', known: true });
  assert.deepEqual(plain(R.parse('#cifras?x')), { route: 'cifras', block: '', known: true });
});

test('a malformed escape does not throw', () => {
  assert.deepEqual(plain(R.parse('#s3/%E0%A4%A')), { route: 's3', block: '', known: true });
});

test('an unknown route falls back to #inicio and says so', () => {
  assert.deepEqual(plain(R.parse('#main')), { route: 'inicio', block: '', known: false });
  assert.deepEqual(plain(R.parse('#s8')), { route: 'inicio', block: '', known: false });
});

test('Modo clase takes a session number 1–7 or "taller" as its block', () => {
  assert.deepEqual(plain(R.parse('#clase')), { route: 'clase', block: '', known: true });
  assert.deepEqual(plain(R.parse('#clase/3')), { route: 'clase', block: '3', known: true });
  assert.deepEqual(plain(R.parse('#clase/taller')), { route: 'clase', block: 'taller', known: true });
  assert.deepEqual(plain(R.parse('#clase/9')), { route: 'clase', block: '', known: true });
});

test('format() builds the hash back', () => {
  assert.equal(R.format('s3', 'actividad'), '#s3/actividad');
  assert.equal(R.format('inicio'), '#inicio');
  assert.equal(R.format('cifras', ''), '#cifras');
  for (const h of ['#s3/actividad', '#cifras/adop-1', '#clase/taller', '#mapa']) {
    const p = R.parse(h);
    assert.equal(R.format(p.route, p.block), h);
  }
});

test('neighbors() follows inicio → mapa → evidencia → s1 … s7 → proyecto', () => {
  assert.deepEqual(plain(R.neighbors('inicio')), { prev: null, next: 'mapa' });
  assert.deepEqual(plain(R.neighbors('evidencia')), { prev: 'mapa', next: 's1' });
  assert.deepEqual(plain(R.neighbors('s1')), { prev: 'evidencia', next: 's2' });
  assert.deepEqual(plain(R.neighbors('s7')), { prev: 's6', next: 'proyecto' });
  assert.deepEqual(plain(R.neighbors('proyecto')), { prev: 's7', next: null });
});

test('views outside the course order have no neighbors', () => {
  for (const r of ['cifras', 'glosario', 'preguntas', 'referencias', 'asistente', 'clase']) {
    assert.deepEqual(plain(R.neighbors(r)), { prev: null, next: null }, r);
  }
});

test('sessionNumber() reads s1…s7', () => {
  assert.equal(R.sessionNumber('s1'), 1);
  assert.equal(R.sessionNumber('s7'), 7);
  assert.equal(R.sessionNumber('cifras'), 0);
});

test('current() is #inicio before the router starts', () => {
  assert.deepEqual(plain(R.current()), { route: 'inicio', block: '', known: true });
  assert.equal(R.previous(), null);
});
