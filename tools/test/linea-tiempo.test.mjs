// Tests for sesión 0, the AI timeline: the CSV reader (tools/lib/csv.mjs), the data in
// js/data/linea-tiempo.js and check-content step 7 (tools/check-content.mjs checkLineaTiempo).
// Run from the repository root:  node --test tools/test/linea-tiempo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCsv, readCsvObjects } from '../lib/csv.mjs';
import { loadData } from '../lib/load-data.mjs';
import { checkLineaTiempo, createReport } from '../check-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CSV_FILE = 'base_linea_del_tiempo/linea_tiempo_evolucion_IA_1950_2026.csv';
const csvText = fs.readFileSync(path.join(ROOT, CSV_FILE), 'utf8');
const EIA = await loadData({ root: ROOT });
const LT = EIA.data.lineaTiempo;

/** Runs step 7 over a copy of the timeline data changed by `edit`. */
function check(edit, text = csvText) {
  const data = JSON.parse(JSON.stringify(LT));
  if (edit) edit(data);
  const report = createReport();
  checkLineaTiempo({ data: { lineaTiempo: data } }, text, report);
  return report.errors.map((e) => e.where + ': ' + e.msg);
}

test('parseCsv drops the BOM and keeps quoted commas, doubled quotes and newlines', () => {
  const rows = parseCsv('﻿a,b,c\r\n1,"x, y","say ""hi"""\n2,"two\nlines",\n');
  assert.deepEqual(rows, [['a', 'b', 'c'], ['1', 'x, y', 'say "hi"'], ['2', 'two\nlines', '']]);
  assert.deepEqual(readCsvObjects('k,v\n1,2'), [{ k: '1', v: '2' }]);
});

test('the course CSV has 24 milestones with 8 fields each', () => {
  const [header, ...rows] = parseCsv(csvText);
  assert.equal(header[0], 'Fecha');
  assert.equal(rows.length, 24);
  for (const r of rows) assert.equal(r.length, 8, r[1]);
});

test('the timeline data is the CSV, verbatim, and passes step 7', () => {
  assert.equal(LT.csv, CSV_FILE);
  assert.equal(LT.hitos.length, 24);
  assert.deepEqual(check(), []);
});

test('milestones keep chronological order and contiguous eras', () => {
  const firstYear = (fecha) => Number(/\d{4}/.exec(fecha)[0]);
  LT.hitos.forEach((h, i) => {
    if (i) assert.ok(firstYear(h.fecha) >= firstYear(LT.hitos[i - 1].fecha), h.id);
  });
  const eraOrder = LT.hitos.map((h) => h.era).filter((e, i, a) => i === 0 || a[i - 1] !== e);
  assert.deepEqual(eraOrder, LT.eras.map((e) => e.id));
});

test('step 7 catches an edited field, a bad id, an unknown era and an invented number', () => {
  assert.ok(check((d) => { d.hitos[5].avance += ' (editado)'; }).some((e) => e.startsWith('lineaTiempo.hitos[5].avance')));
  assert.ok(check((d) => { d.hitos[1].id = 'Dartmouth 1956'; }).some((e) => e.includes('not a deep-link id')));
  assert.ok(check((d) => { d.hitos[2].id = d.hitos[1].id; }).some((e) => e.includes('duplicate id')));
  assert.ok(check((d) => { d.hitos[3].era = 'otra'; }).some((e) => e.includes('unknown era')));
  assert.ok(check((d) => { d.hitos[0].narracion += ' Ganó 3 premios.'; }).some((e) => e.includes('«3»')));
  assert.ok(check((d) => { d.hitos.pop(); }).some((e) => e.includes('23 milestones')));
});

test('step 7 reports a missing CSV and missing data', () => {
  assert.ok(check(null, null).some((e) => e.includes('cannot read the CSV')));
  const report = createReport();
  checkLineaTiempo({ data: {} }, csvText, report);
  assert.equal(report.errors.length, 1);
});

test('every narration is short and Spanish UI copy is complete', () => {
  for (const h of LT.hitos) assert.ok(h.narracion.split(/\s+/).length <= 60, h.id + ' narration is long');
  for (const key of ['actores', 'lugar', 'avance', 'importancia', 'fuente', 'nota']) assert.ok(LT.ui.campos[key], key);
  assert.ok(LT.intro.narracion);
});

// js/ui/linea-tiempo.js is a classic script that must not touch the DOM at load time; its pure helpers
// run in the same vm sandbox as the data, with the captions engine for the captions-only clips.
const UI = await loadData({ root: ROOT, extra: ['js/engine/captions.js', 'js/ui/linea-tiempo.js'] });
const LTUI = UI.ui.lineaTiempo;
const plain = (v) => JSON.parse(JSON.stringify(v));

test('the timeline UI loads without a DOM and exposes mount and its pure helpers', () => {
  for (const name of ['mount', 'sources', 'clipFor', 'cueAt']) assert.equal(typeof LTUI[name], 'function', name);
});

test('sources() splits a multi-URL cell', () => {
  const hito = LT.hitos.find((x) => x.id === 'era-agentica');
  assert.deepEqual(plain(LTUI.sources(hito.fuente)), [
    'https://openai.com/index/introducing-operator/',
    'https://www.anthropic.com/news/claude-3-7-sonnet',
    'https://openai.com/index/introducing-chatgpt-agent/'
  ]);
  assert.deepEqual(plain(LTUI.sources('https://www.nist.gov/')), ['https://www.nist.gov/']);
});

test('clipFor() without generated audio times the narration captions at ~2.4 words/s', () => {
  const saved = UI.timelineAudio;
  UI.timelineAudio = {};
  try {
    const clip = LTUI.clipFor('alphago');
    assert.equal(clip.file, null);
    assert.ok(clip.chunks.length >= 2);
    assert.equal(clip.chunks.map((c) => c.text).join(' '), LT.hitos.find((x) => x.id === 'alphago').narracion);
    assert.ok(Math.abs(clip.duration - clip.text.split(/\s+/).length / 2.4) < 0.01);
    assert.ok(LTUI.clipFor('intro').chunks.length >= 1);
  } finally {
    UI.timelineAudio = saved;
  }
});

test('cueAt() finds the chunk showing at a time', () => {
  const chunks = [{ text: 'a', start: 0.2, end: 1 }, { text: 'b', start: 1, end: 2 }];
  assert.equal(LTUI.cueAt(chunks, 0), -1);
  assert.equal(LTUI.cueAt(chunks, 0.5), 0);
  assert.equal(LTUI.cueAt(chunks, 1.5), 1);
  assert.equal(LTUI.cueAt(chunks, 9), 1);
  assert.equal(LTUI.cueAt([], 1), -1);
});

test('check-routes covers #s0 and a milestone deep link', async () => {
  const { ROUTES, DEEP_LINKS } = await import('../check-routes.mjs');
  assert.ok(ROUTES.includes('s0'));
  const deep = DEEP_LINKS.filter((d) => d.startsWith('s0/'));
  assert.ok(deep.length && deep.every((d) => LT.hitos.some((x) => 's0/' + x.id === d)), deep.join(', '));
});
