// Tests for tools/check-voiceover.mjs: the text listening sheet (no audio is played or transcribed).
// Run: node --test tools/test/check-voiceover.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listeningSheet, listenFor, videoSheet } from '../check-voiceover.mjs';
import { createLayout } from '../lib/voice-layout.mjs';
import { planVideo, loadConfig } from '../generate-voiceover.mjs';

const video = {
  id: 'v99', slug: 'prueba', title: 'Prueba', rate: '0%', target: [5, 60],
  chapters: [{ title: 'Uno', from: 'a' }],
  scenes: [{ id: 'a', min: 0, lines: [
    { voice: 'narrador', text: 'Según McKinsey, el 88% de la UNESCO usa IA.' },
    { voice: 'lectora', text: '¿Y hacia dónde va?' },
    { voice: 'narrador', text: 'flujos humano–IA', say: 'flujos entre personas e i a' }
  ] }],
  checkpoints: []
};

test('each line shows its time, voice, display text, spoken text and what to listen for', () => {
  const plan = planVideo(video, { layout: createLayout({}), config: loadConfig() });
  const items = listenFor(plan.lines[0]);
  assert.ok(items.includes('88% → ochenta y ocho por ciento (figure)'), items.join(' | '));
  assert.ok(items.includes('McKinsey → mackínsi (lexicon)'));
  assert.ok(items.includes('IA → i a (abbreviation)'));
  assert.ok(items.includes('UNESCO (acronym, read by the voice as written)'));
  assert.deepEqual(listenFor(plan.lines[1]), []);
  assert.match(listenFor(plan.lines[2])[0], /^explicit say \(spoken instead of the text\): «flujos entre personas e i a»$/);

  const starts = new Map([['a:0', 0.6], ['a:1', 5.25], ['a:2', 7]]);
  const sheet = videoSheet({ plan, starts, source: 'audio: test' });
  assert.match(sheet.text, /^== v99 · prueba · Prueba ==\naudio: test\n/);
  assert.match(sheet.text, /\[ \] 0:00\.6  a:0 · narrador\n    shows: Según McKinsey, el 88% de la UNESCO usa IA\.\n    says:  Según mackínsi, el ochenta y ocho por ciento de la UNESCO usa i a\.\n    listen for:\n/);
  assert.match(sheet.text, /\[ \] 0:05\.3  a:1 · lectora\n    shows: ¿Y hacia dónde va\?\n    says:  ¿Y hacia dónde va\?\n\n/);
  assert.equal(sheet.flaggedLines, 2);
  const flagged = videoSheet({ plan, starts, source: 'audio: test', flagged: true });
  assert.doesNotMatch(flagged.text, /a:1 · lectora/);
  assert.equal(flagged.shown, 2);
});

test('the sheet for the real scripts covers every line of the requested videos', async () => {
  const text = await listeningSheet({ only: ['v01'] });
  assert.match(text, /^== v01 · iceberg · /);
  assert.match(text, /times (from assets\/audio\/manifest\.js|estimated at 2\.3 words\/s)/);
  assert.equal((text.match(/^\[ \] /gm) || []).length, 16);
  assert.match(text, /1 video · 16 lines · \d+ with something to listen for/);
  await assert.rejects(listeningSheet({ only: ['v42'] }), /unknown video v42/);
});
