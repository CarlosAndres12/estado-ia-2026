/* tools/lib/tts-azure.mjs — Azure AI Speech adapter (optional engine; prompt §8.2–§8.3).
 *
 * Dev-only. The default engine is Edge TTS (lib/tts-edge.mjs, user decision 2026-10-17); set
 * "engine": "azure" in tools/voice.config.json and run `npm install` in tools/ to use this one. It
 * needs microsoft-cognitiveservices-speech-sdk (an optional dependency) and a key: AZURE_SPEECH_KEY and
 * AZURE_SPEECH_REGION come only from the environment or the gitignored tools/.env (see
 * tools/.env.example). The key is never written to the site, the manifest, the captions or the logs.
 *
 *   const tts = createAzureTts(config.azure);
 *   tts.ssml({ voice, chunks, rate, pitch, style })   -> SSML with bookmarks c1, c2… (lib/ssml.mjs)
 *   await tts.listVoices()                            -> [{ name, gender, locale, styles }]
 *   await tts.synthesize({ voice, chunks, rate, pitch, style }, 'clip.wav')
 *       -> { words: [{ text, start, dur }], bookmarks: [{ name, start }], bytes, attempts }
 *       bookmark "cN" marks the start of subtitle chunk N, in seconds from the clip start
 *       (audioOffset is in 100-ns ticks); WAV 24 kHz 16-bit mono by default.
 *
 * Throttling (429), 5xx and network errors are retried with exponential backoff (lib/tts-common.mjs).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { azureSsml } from './ssml.mjs';
import { TtsError, withRetry } from './tts-common.mjs';

export const ENV_FILE = fileURLToPath(new URL('../.env', import.meta.url));
const TICKS_PER_SECOND = 1e7;

/** KEY=VALUE lines of a .env file (comments and blank lines skipped, optional quotes removed). */
export function parseEnv(text) {
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(raw);
    if (!m || raw.trim().startsWith('#')) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

/** { key, region } from the environment, then tools/.env; a clear error when either is missing. */
export function azureCredentials(config = {}, { env = process.env, envFile = ENV_FILE } = {}) {
  const keyEnv = config.keyEnv || 'AZURE_SPEECH_KEY';
  const regionEnv = config.regionEnv || 'AZURE_SPEECH_REGION';
  let file = {};
  try {
    file = parseEnv(fs.readFileSync(envFile, 'utf8'));
  } catch {
    // no tools/.env: the environment alone must have them
  }
  const key = env[keyEnv] || file[keyEnv];
  const region = env[regionEnv] || file[regionEnv];
  if (!key || !region) {
    throw new TtsError(`the Azure engine needs ${keyEnv} and ${regionEnv} in the environment or in tools/.env ` +
      '(see tools/.env.example)', { kind: 'credentials' });
  }
  return { key, region };
}

async function importSdk() {
  try {
    const mod = await import('microsoft-cognitiveservices-speech-sdk');
    return mod.default || mod;
  } catch {
    throw new TtsError('the Azure engine needs microsoft-cognitiveservices-speech-sdk: run `npm install` in tools/',
      { kind: 'missing-package' });
  }
}

function failureFrom(details) {
  const text = String(details || 'synthesis canceled');
  const status = /\b(429|5\d\d)\b/.exec(text);
  return new TtsError(text, {
    kind: 'service',
    retry: Boolean(status) || /timeout|throttl|connection/i.test(text),
    status: status ? Number(status[1]) : undefined
  });
}

function speakOnce(sdk, { key, region }, ssml, format) {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat[format];
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null); // null: audio in result.audioData
    const words = [];
    const bookmarks = [];
    synthesizer.wordBoundary = (_, e) => {
      words.push({ text: e.text, start: e.audioOffset / TICKS_PER_SECOND, dur: (Number(e.duration) || 0) / TICKS_PER_SECOND });
    };
    synthesizer.bookmarkReached = (_, e) => {
      bookmarks.push({ name: e.text, start: e.audioOffset / TICKS_PER_SECOND });
    };
    synthesizer.speakSsmlAsync(ssml, (result) => {
      synthesizer.close();
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        resolve({ audio: Buffer.from(result.audioData), words, bookmarks });
      } else {
        reject(failureFrom(result.errorDetails));
      }
    }, (error) => {
      synthesizer.close();
      reject(new TtsError(String(error), { kind: 'network', retry: true }));
    });
  });
}

/**
 * @param {{ keyEnv?: string, regionEnv?: string, outputFormat?: string, retries?: number, backoffMs?: number }} [config]
 * @param {{ sdk?: object, fetch?: Function, env?: object, envFile?: string, sleep?: Function, log?: Function }} [deps]
 */
export function createAzureTts(config = {}, deps = {}) {
  const format = config.outputFormat || 'Riff24Khz16BitMonoPcm';
  const retry = { retries: Number.isInteger(config.retries) ? config.retries : 4, backoffMs: config.backoffMs || 1000, sleep: deps.sleep, log: deps.log };
  let credentials = null;
  const creds = () => (credentials ||= azureCredentials(config, { env: deps.env || process.env, envFile: deps.envFile || ENV_FILE }));
  const sdk = () => (deps.sdk ? Promise.resolve(deps.sdk) : importSdk());
  const fetchImpl = deps.fetch || globalThis.fetch;

  return {
    name: 'azure',
    extension: '.wav',
    format,

    ssml({ voice, chunks, rate, pitch, style }) {
      return azureSsml({ voice, chunks, rate, pitch, style });
    },

    async listVoices() {
      const { key, region } = creds();
      const { value } = await withRetry('Azure voice list', async () => {
        let res;
        try {
          res = await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
            { headers: { 'Ocp-Apim-Subscription-Key': key } });
        } catch (err) {
          throw new TtsError(err.message, { kind: 'network', retry: true });
        }
        if (!res.ok) throw failureFrom(`HTTP ${res.status}`);
        return res.json();
      }, retry);
      return value.map((v) => ({ name: v.ShortName, gender: v.Gender, locale: v.Locale, styles: v.StyleList || [] }));
    },

    async synthesize({ voice, chunks, rate, pitch, style }, outFile) {
      const engine = await sdk();
      const key = creds();
      const ssml = azureSsml({ voice, chunks, rate, pitch, style });
      const { value, attempts } = await withRetry(`Azure TTS ${voice}`, () => speakOnce(engine, key, ssml, format), retry);
      const part = path.resolve(outFile) + '.part';
      fs.writeFileSync(part, value.audio);
      fs.renameSync(part, path.resolve(outFile));
      return { words: value.words, bookmarks: value.bookmarks, bytes: value.audio.length, attempts };
    }
  };
}
