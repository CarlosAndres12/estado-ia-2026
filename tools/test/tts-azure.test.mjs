// Tests for tools/lib/tts-azure.mjs (optional Azure engine) with a fake Speech SDK: no network, no key.
// Run: node --test tools/test/tts-azure.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createAzureTts, azureCredentials, parseEnv } from '../lib/tts-azure.mjs';
import { withRetry, TtsError } from '../lib/tts-common.mjs';

const ENV = { AZURE_SPEECH_KEY: 'k', AZURE_SPEECH_REGION: 'eastus' };
const NO_FILE = path.join(os.tmpdir(), 'eia-no-such-env-file');

// The parts of microsoft-cognitiveservices-speech-sdk the adapter uses.
function fakeSdk(results) {
  const seen = { ssml: [] };
  const sdk = {
    seen,
    SpeechConfig: { fromSubscription: (key, region) => ({ key, region }) },
    SpeechSynthesisOutputFormat: { Riff24Khz16BitMonoPcm: 7 },
    ResultReason: { SynthesizingAudioCompleted: 10, Canceled: 1 },
    SpeechSynthesizer: class {
      constructor(config, audio) { seen.config = config; seen.audio = audio; }
      speakSsmlAsync(ssml, ok) {
        seen.ssml.push(ssml);
        const next = results.shift();
        if (next.reason === 10) {
          this.wordBoundary(this, { text: 'Uno', audioOffset: 1000000, duration: 3000000 });
          this.bookmarkReached(this, { text: 'c1', audioOffset: 15000000 });
        }
        ok(next);
      }
      close() {}
    }
  };
  return sdk;
}

test('parseEnv reads KEY=VALUE lines', () => {
  assert.deepEqual(parseEnv('# comment\nAZURE_SPEECH_KEY="abc"\nexport AZURE_SPEECH_REGION=eastus\n\nBAD LINE\n'),
    { AZURE_SPEECH_KEY: 'abc', AZURE_SPEECH_REGION: 'eastus' });
});

test('credentials come from the environment or tools/.env, with a clear error when missing', () => {
  assert.deepEqual(azureCredentials({}, { env: ENV, envFile: NO_FILE }), { key: 'k', region: 'eastus' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-azure-'));
  fs.writeFileSync(path.join(dir, '.env'), 'AZURE_SPEECH_KEY=fromfile\nAZURE_SPEECH_REGION=westeurope\n');
  assert.deepEqual(azureCredentials({}, { env: {}, envFile: path.join(dir, '.env') }), { key: 'fromfile', region: 'westeurope' });
  assert.throws(() => azureCredentials({}, { env: {}, envFile: NO_FILE }),
    (err) => err.kind === 'credentials' && /AZURE_SPEECH_KEY and AZURE_SPEECH_REGION/.test(err.message));
});

test('synthesize writes the WAV and returns bookmarks and words in seconds', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-azure-'));
  const sdk = fakeSdk([{ reason: 10, audioData: new Uint8Array([82, 73, 70, 70]).buffer }]);
  const tts = createAzureTts({}, { sdk, env: ENV, envFile: NO_FILE });
  const out = await tts.synthesize({ voice: 'es-MX-JorgeNeural', chunks: ['Uno, dos', 'tres'], rate: '0%' }, path.join(dir, 'c.wav'));
  assert.deepEqual(out.bookmarks, [{ name: 'c1', start: 1.5 }]);
  assert.deepEqual(out.words, [{ text: 'Uno', start: 0.1, dur: 0.3 }]);
  assert.equal(out.bytes, 4);
  assert.equal(fs.readFileSync(path.join(dir, 'c.wav'), 'latin1'), 'RIFF');
  assert.match(sdk.seen.ssml[0], /<bookmark mark="c1"\/>tres/);
  assert.equal(sdk.seen.audio, null);
  assert.equal(sdk.seen.config.speechSynthesisOutputFormat, 7);
});

test('a throttled request is retried; a credential problem is not', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eia-azure-'));
  const sdk = fakeSdk([
    { reason: 1, errorDetails: 'Status(429): too many requests' },
    { reason: 10, audioData: new Uint8Array([1]).buffer }
  ]);
  const waits = [];
  const tts = createAzureTts({}, { sdk, env: ENV, envFile: NO_FILE, sleep: async (ms) => { waits.push(ms); } });
  const out = await tts.synthesize({ voice: 'v', chunks: ['x'] }, path.join(dir, 'c.wav'));
  assert.equal(out.attempts, 2);
  assert.deepEqual(waits, [1000]);
  const noKey = createAzureTts({}, { sdk, env: {}, envFile: NO_FILE });
  await assert.rejects(noKey.synthesize({ voice: 'v', chunks: ['x'] }, path.join(dir, 'd.wav')), (err) => err.kind === 'credentials');
});

test('listVoices reads the regional voices-list endpoint with the key header', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push([url, init.headers]);
    return { ok: true, json: async () => [{ ShortName: 'es-MX-JorgeNeural', Gender: 'Male', Locale: 'es-MX', StyleList: ['calm'] }] };
  };
  const tts = createAzureTts({}, { fetch, env: ENV, envFile: NO_FILE });
  assert.deepEqual(await tts.listVoices(), [{ name: 'es-MX-JorgeNeural', gender: 'Male', locale: 'es-MX', styles: ['calm'] }]);
  assert.equal(calls[0][0], 'https://eastus.tts.speech.microsoft.com/cognitiveservices/voices/list');
  assert.deepEqual(calls[0][1], { 'Ocp-Apim-Subscription-Key': 'k' });
});

test('withRetry wraps plain errors as retryable and names the label', async () => {
  let n = 0;
  const { value, attempts } = await withRetry('job', async () => { if (++n < 2) throw new Error('flaky'); return 'done'; }, { sleep: async () => {} });
  assert.deepEqual([value, attempts], ['done', 2]);
  await assert.rejects(withRetry('job', async () => { throw new TtsError('nope', { kind: 'invalid' }); }),
    (err) => err.kind === 'invalid' && err.message === 'job: nope');
});
