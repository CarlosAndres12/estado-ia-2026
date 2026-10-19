// Tests for tools/build-teacher-guide.mjs — the printable teacher guide built from the site data.
// Run from the repository root:  node --test tools/test/teacher-guide.test.mjs
//
// Only the pure part is tested (buildGuide: data in, HTML out); printing the PDF needs Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../lib/load-data.mjs';
import { buildGuide, revisor, COPY, SITE_URL } from '../build-teacher-guide.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const EIA = await loadData({ root: ROOT, extra: ['js/core/markup.js'] });
const html = buildGuide(EIA);
const M = EIA.markup;
const text = html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const has = (s) => text.includes(M.plain(s).replace(/\s+/g, ' ').trim());

test('is one self-contained HTML document', () => {
  assert.match(html, /^<!doctype html>/);
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /<link\b[^>]*stylesheet/i);
  assert.match(html, /@page/);
});

test('cover names the authors, the reviewer and the site', () => {
  const f = EIA.data.course.footer;
  for (const a of f.autores) {
    assert.ok(has(a.nombre), a.nombre);
    assert.ok(has(a.afiliacion), a.afiliacion);
    assert.ok(html.includes('mailto:' + a.correo), a.correo);
  }
  const rev = revisor(EIA.data.course);
  assert.ok(rev.length > 0, 'reviewer parsed from the footer');
  assert.ok(has(COPY.revisado + ': ' + rev));
  assert.ok(html.includes(SITE_URL));
  assert.ok(has(EIA.data.course.kb.versionTexto));
});

test('has a chapter for each of the 7 sessions, with agenda and láminas', () => {
  for (let n = 1; n <= 7; n++) {
    const s = EIA.data.sesiones[n];
    assert.match(html, new RegExp(`<section class="chapter" id="s${n}">`), 'chapter s' + n);
    assert.ok(has(s.titulo), s.titulo);
    for (const b of s.agenda) assert.ok(has(b.bloque), `s${n} agenda: ${b.bloque}`);
    for (const id of s.laminas) {
      const d = EIA.data.deck.find((x) => x.id === id);
      assert.ok(has(d.titulo), `s${n} lámina ${id}`);
    }
  }
});

test('every quiz answer and every video checkpoint answer is in the guide', () => {
  for (let n = 1; n <= 7; n++) {
    for (const q of EIA.data.sesiones[n].quiz || []) {
      const letra = q.letra || String.fromCharCode(97 + q.respuesta);
      assert.ok(has(q.pregunta), q.pregunta);
      assert.ok(text.includes(`${letra}) ${M.plain(q.opciones[q.respuesta])}`), `answer of: ${q.pregunta}`);
      if (q.explicacion) assert.ok(has(q.explicacion), q.explicacion);
    }
  }
  for (const v of EIA.data.videos) {
    for (const cp of v.checkpoints || []) {
      assert.ok(has(cp.question), cp.question);
      assert.ok(text.includes(`${String.fromCharCode(97 + cp.answer)}) ${M.plain(cp.options[cp.answer])}`), `checkpoint answer of: ${cp.question}`);
    }
  }
});

test('evaluation, rubric and annexes are complete', () => {
  for (const cr of EIA.data.rubrica.criterios) assert.ok(has(cr.criterio), cr.criterio);
  for (const c of EIA.data.cifras) assert.match(html, new RegExp(`id="cifra-${c.id}"`), c.id);
  for (const g of EIA.data.glosario) assert.ok(has(g.termino), g.termino);
  for (const f of Object.values(EIA.data.fuentes)) assert.ok(html.includes(f.url.replace(/&/g, '&amp;')), f.url);
});

test('leaves no raw KB markup behind', () => {
  assert.doesNotMatch(text, /\{\{[a-z0-9-]+\|/);
  assert.doesNotMatch(text, /\]\[[a-z0-9-]+\]/);
});

test('the connective copy carries no numbers (figures come only from the data)', () => {
  const words = Object.values(COPY).flat(2).join(' ');
  assert.doesNotMatch(words, /\d/);
});
