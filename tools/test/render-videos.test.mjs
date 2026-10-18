// Tests for the pure parts of tools/render-videos.mjs: argument parsing, frame-exact segment
// planning (whole range or by chapter), cache keys and the assets/video/index.js merge.
// No browser and no ffmpeg run here. Run: node --test tools/test/render-videos.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FPS, parseArgs, planSegments, segmentKey, readIndex, mergeIndex, indexSource, shouldWriteIndex
} from '../render-videos.mjs';

test('parseArgs: defaults', () => {
  const o = parseArgs([]);
  assert.deepEqual(o.only, null);
  assert.equal(o.from, null);
  assert.equal(o.to, null);
  assert.equal(o.byChapter, false);
  assert.equal(o.scale, 1);
  assert.equal(o.out, null);
  assert.equal(o.fresh, false);
  assert.equal(o.help, false);
});

test('parseArgs: every option, --only as a comma list and repeated', () => {
  const o = parseArgs(['--only', 'v02,v03', '--only', 'v05', '--from', '20', '--to', '30.5',
    '--by-chapter', '--scale', '0.5', '--out', 'x/y', '--fresh']);
  assert.deepEqual(o.only, ['v02', 'v03', 'v05']);
  assert.equal(o.from, 20);
  assert.equal(o.to, 30.5);
  assert.equal(o.byChapter, true);
  assert.equal(o.scale, 0.5);
  assert.equal(o.out, 'x/y');
  assert.equal(o.fresh, true);
  assert.equal(parseArgs(['-h']).help, true);
});

test('parseArgs: rejects unknown options, bad numbers and an empty range', () => {
  assert.throws(() => parseArgs(['--nope']), /unknown option/);
  assert.throws(() => parseArgs(['--from', 'abc']), /--from/);
  assert.throws(() => parseArgs(['--scale', '0']), /--scale/);
  assert.throws(() => parseArgs(['--scale', '5']), /--scale/);
  assert.throws(() => parseArgs(['--from', '30', '--to', '20']), /--to/);
  assert.throws(() => parseArgs(['--out']), /--out/);
});

const CHAPTERS = [
  { index: 0, title: 'A', start: 0, end: 10.01 },
  { index: 1, title: 'B', start: 10.01, end: 25.5 },
  { index: 2, title: 'C', start: 25.5, end: 40 }
];

function assertContiguous(segs, f0, f1) {
  assert.equal(segs[0].f0, f0);
  assert.equal(segs[segs.length - 1].f1, f1);
  for (let i = 1; i < segs.length; i++) assert.equal(segs[i].f0, segs[i - 1].f1, 'no gap, no overlap');
  for (const s of segs) assert.ok(s.f1 > s.f0, 'no empty segment');
}

test('planSegments: whole video is one segment of round(duration * fps) frames', () => {
  const segs = planSegments({ duration: 40, chapters: CHAPTERS });
  assert.equal(segs.length, 1);
  assert.equal(segs[0].f0, 0);
  assert.equal(segs[0].f1, 40 * FPS);
  assert.equal(segs[0].chapter, null);
});

test('planSegments: --from/--to clip the range to whole frames inside the video', () => {
  const segs = planSegments({ duration: 40, chapters: CHAPTERS, from: 20, to: 30 });
  assert.deepEqual(segs.map((s) => [s.f0, s.f1]), [[480, 720]]);
  const clipped = planSegments({ duration: 40, chapters: CHAPTERS, from: 35, to: 99 });
  assert.deepEqual(clipped.map((s) => [s.f0, s.f1]), [[840, 960]]);
  assert.throws(() => planSegments({ duration: 40, chapters: CHAPTERS, from: 50 }), /outside/);
});

test('planSegments: by chapter covers every frame exactly once', () => {
  const segs = planSegments({ duration: 40, chapters: CHAPTERS, byChapter: true });
  assert.equal(segs.length, 3);
  assert.deepEqual(segs.map((s) => s.chapter), [0, 1, 2]);
  assertContiguous(segs, 0, 960);
  assert.equal(segs[1].f0, Math.round(10.01 * FPS));
});

test('planSegments: by chapter with a range keeps only the chapters it touches', () => {
  const segs = planSegments({ duration: 40, chapters: CHAPTERS, byChapter: true, from: 20, to: 30 });
  assert.deepEqual(segs.map((s) => s.chapter), [1, 2]);
  assertContiguous(segs, 480, 720);
});

test('planSegments: by chapter tolerates chapters that miss the start or end of the video', () => {
  const segs = planSegments({ duration: 40, chapters: [{ index: 0, start: 2, end: 20 }, { index: 1, start: 20, end: 38 }], byChapter: true });
  assertContiguous(segs, 0, 960);
  const none = planSegments({ duration: 12, chapters: [], byChapter: true });
  assert.deepEqual(none.map((s) => [s.f0, s.f1]), [[0, 288]]);
});

test('segmentKey: names id, scale and frame range so a changed request never reuses a part', () => {
  const a = segmentKey('v02', 1, { f0: 0, f1: 240 });
  assert.match(a, /^v02-s1-f0-240$/);
  assert.notEqual(segmentKey('v02', 0.5, { f0: 0, f1: 240 }), a);
  assert.notEqual(segmentKey('v02', 1, { f0: 0, f1: 241 }), a);
});

test('readIndex: reads the generated file, an empty one and a missing one', () => {
  const src = indexSource({ v02: { file: 'assets/video/a.mp4', duration: 12.5, bytes: 100 } });
  assert.match(src, /window\.EIA\.videoExports = /);
  assert.deepEqual(readIndex(src), { v02: { file: 'assets/video/a.mp4', duration: 12.5, bytes: 100 } });
  assert.deepEqual(readIndex('window.EIA = window.EIA || {};\nwindow.EIA.videoExports = {};\n'), {});
  assert.deepEqual(readIndex(''), {});
  assert.deepEqual(readIndex(null), {});
  assert.throws(() => readIndex('window.EIA.videoExports = {broken'), /index/);
});

test('mergeIndex: keeps other videos, replaces this one, orders by the course order', () => {
  const before = { v05: { file: 'assets/video/e.mp4', duration: 5, bytes: 5 }, v02: { file: 'old', duration: 1, bytes: 1 } };
  const after = mergeIndex(before, 'v02', { file: 'assets/video/b.mp4', duration: 2, bytes: 2 }, ['v01', 'v02', 'v03', 'v05']);
  assert.deepEqual(Object.keys(after), ['v02', 'v05']);
  assert.deepEqual(after.v02, { file: 'assets/video/b.mp4', duration: 2, bytes: 2 });
  assert.deepEqual(after.v05, before.v05);
  assert.equal(before.v02.file, 'old', 'input not mutated');
  const unknown = mergeIndex({}, 'vx', { file: 'f', duration: 1, bytes: 1 }, ['v01']);
  assert.deepEqual(Object.keys(unknown), ['vx']);
});

test('shouldWriteIndex: only for whole videos written to assets/video', () => {
  const site = '/repo/assets/video';
  assert.equal(shouldWriteIndex({ segment: false, outDir: site, siteDir: site }), true);
  assert.equal(shouldWriteIndex({ segment: true, outDir: site, siteDir: site }), false);
  assert.equal(shouldWriteIndex({ segment: false, outDir: '/tmp/x', siteDir: site }), false);
});
