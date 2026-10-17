// Tests for tools/lib/tts-edge.mjs (Edge TTS adapter) with a fake bridge: no network, no audio.
// Run: node --test tools/test/tts-edge.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createEdgeTts, findPython, runBridge, TtsError, BRIDGE } from '../lib/tts-edge.mjs';

const FAKE_BRIDGE = fileURLToPath(new URL('./fixtures/fake-edge-bridge.mjs', import.meta.url));

function tempBin(script) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-edge-'));
  fs.writeFileSync(path.join(dir, 'edge-tts'), script);
  return dir;
}

test('findPython: config, then EDGE_TTS_PYTHON, then the edge-tts shebang, then python3', () => {
  const venv = tempBin('#!/opt/venvs/edge-tts/bin/python\nimport sys\n');
  const envShebang = tempBin('#!/usr/bin/env python3.12\n');
  assert.equal(findPython({ python: '/x/python', env: { EDGE_TTS_PYTHON: '/y/python' } }).python, '/x/python');
  assert.equal(findPython({ env: { EDGE_TTS_PYTHON: '/y/python', PATH: venv } }).python, '/y/python');
  assert.equal(findPython({ env: { PATH: ['/nonexistent', venv].join(path.delimiter) } }).python, '/opt/venvs/edge-tts/bin/python');
  assert.equal(findPython({ env: { PATH: envShebang } }).python, 'python3.12');
  assert.deepEqual(findPython({ env: { PATH: '/nonexistent' }, platform: 'linux' }), { python: 'python3', source: 'default' });
  assert.equal(findPython({ env: {}, platform: 'win32' }).python, 'python');
});

test('synthesize sends signed prosody and an absolute path, and returns word times in seconds', async () => {
  const requests = [];
  const tts = createEdgeTts({}, {
    env: {},
    run: async (req) => {
      requests.push(req);
      return { ok: true, bytes: 4800, boundaries: [{ text: 'Hola', offset: 1250000, duration: 3000000 }] };
    }
  });
  const out = await tts.synthesize({ voice: 'es-MX-JorgeNeural', text: 'Hola', rate: '0%' }, 'clip.mp3');
  assert.deepEqual(out, { words: [{ text: 'Hola', start: 0.125, dur: 0.3 }], bytes: 4800, attempts: 1 });
  assert.equal(requests[0].op, 'synthesize');
  assert.equal(requests[0].rate, '+0%');
  assert.equal(requests[0].pitch, '+0Hz');
  assert.ok(path.isAbsolute(requests[0].out));
  assert.match(tts.ssml({ voice: 'es-MX-JorgeNeural', text: 'Hola' }), /<voice name='es-MX-JorgeNeural'>/);
});

test('throttling and network failures are retried with exponential backoff', async () => {
  const waits = [];
  let calls = 0;
  const tts = createEdgeTts({ retries: 4 }, {
    env: {},
    sleep: async (ms) => { waits.push(ms); },
    run: async () => {
      calls++;
      if (calls < 3) throw new TtsError('throttled', { kind: 'service', retry: true, status: 429 });
      return { ok: true, bytes: 1, boundaries: [] };
    }
  });
  const out = await tts.synthesize({ voice: 'v', text: 't' }, 'x.mp3');
  assert.equal(out.attempts, 3);
  assert.deepEqual(waits, [1000, 2000]);
});

test('a non-retryable failure stops at once; retries run out with a clear message', async () => {
  const invalid = createEdgeTts({}, { env: {}, sleep: async () => {}, run: async () => { throw new TtsError('bad rate', { kind: 'invalid' }); } });
  await assert.rejects(invalid.synthesize({ voice: 'v', text: 't' }, 'x.mp3'), (err) => err.kind === 'invalid' && /Edge TTS v: bad rate$/.test(err.message));
  let calls = 0;
  const flaky = createEdgeTts({ retries: 2 }, {
    env: {}, sleep: async () => {},
    run: async () => { calls++; throw new TtsError('offline', { kind: 'network', retry: true }); }
  });
  await assert.rejects(flaky.synthesize({ voice: 'v', text: 't' }, 'x.mp3'), /offline \(after 3 attempts\)/);
  assert.equal(calls, 3);
});

test('listVoices returns the bridge voice list', async () => {
  const tts = createEdgeTts({}, { env: {}, run: async (req) => ({ ok: true, voices: req.op === 'voices' ? [{ name: 'es-MX-DaliaNeural' }] : [] }) });
  assert.deepEqual(await tts.listVoices(), [{ name: 'es-MX-DaliaNeural' }]);
});

test('runBridge: one JSON request in, one JSON reply out; failures become TtsError', async () => {
  const node = process.execPath;
  const ok = await runBridge(node, { mode: 'ok', text: 'ñandú «IA»' }, { bridge: FAKE_BRIDGE, timeoutMs: 10000 });
  assert.equal(ok.echo.text, 'ñandú «IA»');
  await assert.rejects(runBridge(node, { mode: 'fail' }, { bridge: FAKE_BRIDGE, timeoutMs: 10000 }),
    (err) => err instanceof TtsError && err.kind === 'service' && err.retry === true && err.status === 429);
  await assert.rejects(runBridge(node, { mode: 'garbage' }, { bridge: FAKE_BRIDGE, timeoutMs: 10000 }),
    (err) => err.retry === true && /without a reply/.test(err.message));
  await assert.rejects(runBridge(node, { mode: 'hang' }, { bridge: FAKE_BRIDGE, timeoutMs: 300 }),
    (err) => err.kind === 'timeout' && err.retry === true);
  await assert.rejects(runBridge('/nonexistent/python-for-eia', { mode: 'ok' }, { bridge: FAKE_BRIDGE }),
    (err) => err.kind === 'missing-python' && err.retry === false);
});

test('the real bridge answers an invalid request with JSON (no network)', async () => {
  const { python } = findPython();
  await assert.rejects(runBridge(python, { op: 'nope' }, { bridge: BRIDGE, timeoutMs: 30000 }),
    (err) => ['invalid', 'missing-package', 'missing-python'].includes(err.kind) && err.retry === false);
});
