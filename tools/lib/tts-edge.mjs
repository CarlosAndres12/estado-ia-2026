/* tools/lib/tts-edge.mjs — Edge TTS adapter of the voice-over tools.
 *
 * Dev-only (Node >= 20, built-ins only). User decision (2026-10-17): the narration uses the free
 * Microsoft Edge read-aloud voices (es-MX-JorgeNeural, es-MX-DaliaNeural) instead of Azure AI Speech;
 * Azure stays available as an optional engine (lib/tts-azure.mjs). Only the tools talk to the service,
 * at generation time; the site never does.
 *
 * Each request runs lib/edge-bridge.py once with the Python interpreter that has the `edge-tts`
 * package (https://github.com/rany2/edge-tts), so protocol changes are handled by upgrading that
 * package (`uv tool upgrade edge-tts`). The interpreter is, in order: the `python` option
 * (voice.config.json "edge.python"), the EDGE_TTS_PYTHON environment variable, the interpreter named
 * in the shebang of the `edge-tts` command on PATH, or python3 (python on Windows).
 *
 *   const tts = createEdgeTts({ python, timeoutSeconds, retries });
 *   tts.ssml({ voice, text, rate, pitch })      -> the SSML the endpoint receives (keys the clip cache)
 *   await tts.listVoices()                     -> [{ name, gender, locale }]
 *   await tts.synthesize({ voice, text, rate, pitch }, 'clip.mp3')
 *                                              -> { words: [{ text, start, dur }], bytes, attempts }
 *       words are the WordBoundary events in seconds from the clip start (lib/align.mjs turns them
 *       into subtitle chunk starts). The endpoint takes plain voice + prosody only: no bookmarks,
 *       breaks or say-as, so pauses are generated silence and "IA" is spelled out as "i a" in the text.
 *
 * Failures throw a TtsError { kind, retry, status }; network, throttling (429), 5xx and empty replies
 * are retried with exponential backoff (1 s, 2 s, 4 s… up to `retries` times).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { edgeSsml, signedPercent, signedHz } from './ssml.mjs';

export const BRIDGE = fileURLToPath(new URL('./edge-bridge.py', import.meta.url));
export const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const TICKS_PER_SECOND = 1e7;

export class TtsError extends Error {
  constructor(message, { kind = 'unknown', retry = false, status } = {}) {
    super(message);
    this.name = 'TtsError';
    this.kind = kind;
    this.retry = retry;
    if (status != null) this.status = status;
  }
}

/** The Python interpreter that has edge-tts, and where that choice came from. */
export function findPython({ python, env = process.env, platform = process.platform } = {}) {
  if (python) return { python, source: 'voice.config.json edge.python' };
  if (env.EDGE_TTS_PYTHON) return { python: env.EDGE_TTS_PYTHON, source: 'EDGE_TTS_PYTHON' };
  const dirs = String(env.PATH || env.Path || '').split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    const command = path.join(dir, 'edge-tts');
    let head;
    try {
      head = fs.readFileSync(command, 'utf8').slice(0, 300);
    } catch {
      continue;
    }
    const m = /^#!\s*(\S+)(?:[ \t]+(\S+))?/.exec(head);
    if (m) return { python: /(^|\/)env$/.test(m[1]) && m[2] ? m[2] : m[1], source: command };
  }
  return { python: platform === 'win32' ? 'python' : 'python3', source: 'default' };
}

/** Runs the bridge once: one JSON request on stdin, one JSON reply on stdout. */
export function runBridge(python, request, { bridge = BRIDGE, timeoutMs = 90000 } = {}) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(python, [bridge], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    } catch (err) {
      reject(new TtsError(`cannot start ${python}: ${err.message}`, { kind: 'missing-python' }));
      return;
    }
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(reject, new TtsError(`Edge TTS request timed out after ${Math.round(timeoutMs / 1000)} s`, { kind: 'timeout', retry: true }));
    }, timeoutMs);
    child.stdout.setEncoding('utf8').on('data', (d) => { stdout += d; });
    child.stderr.setEncoding('utf8').on('data', (d) => { stderr += d; });
    child.on('error', (err) => {
      const kind = err.code === 'ENOENT' ? 'missing-python' : 'unknown';
      finish(reject, new TtsError(`cannot run ${python} (${err.code || err.message}); set "edge.python" in ` +
        'tools/voice.config.json or EDGE_TTS_PYTHON to the Python that has edge-tts', { kind }));
    });
    child.on('close', (code) => {
      let reply;
      try {
        reply = JSON.parse(stdout);
      } catch {
        finish(reject, new TtsError(`edge bridge exited with code ${code} without a reply: ${(stderr || stdout).trim().slice(-400)}`,
          { kind: 'unknown', retry: true }));
        return;
      }
      if (reply && reply.ok) finish(resolve, reply);
      else finish(reject, new TtsError(reply && reply.error ? reply.error : 'edge bridge failed',
        { kind: reply && reply.kind, retry: Boolean(reply && reply.retry), status: reply && reply.status }));
    });
    child.stdin.on('error', () => {}); // a bridge that dies early reports through 'close'
    child.stdin.end(JSON.stringify(request));
  });
}

/**
 * @param {{ python?: string, timeoutSeconds?: number, retries?: number, backoffMs?: number }} [config]
 * @param {{ run?: Function, sleep?: Function, env?: object, log?: Function }} [deps]  injection for tests
 */
export function createEdgeTts(config = {}, deps = {}) {
  const found = findPython({ python: config.python, env: deps.env || process.env });
  const timeoutMs = (config.timeoutSeconds || 60) * 1000;
  const retries = Number.isInteger(config.retries) ? config.retries : 4;
  const backoffMs = config.backoffMs || 1000;
  const run = deps.run || ((request) => runBridge(found.python, request, { timeoutMs: timeoutMs + 30000 }));
  const sleep = deps.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const log = deps.log || (() => {});

  async function withRetry(label, request) {
    for (let attempt = 1; ; attempt++) {
      try {
        return { reply: await run(request), attempts: attempt };
      } catch (err) {
        const error = err instanceof TtsError ? err : new TtsError(err.message, { retry: true });
        if (!error.retry || attempt > retries) {
          error.message = `${label}: ${error.message}` + (attempt > 1 ? ` (after ${attempt} attempts)` : '');
          throw error;
        }
        const wait = Math.min(30000, backoffMs * 2 ** (attempt - 1));
        log(`${label}: ${error.message}; retrying in ${wait / 1000} s`);
        await sleep(wait);
      }
    }
  }

  return {
    name: 'edge',
    extension: '.mp3',
    format: OUTPUT_FORMAT,
    python: found.python,
    pythonSource: found.source,

    ssml({ voice, text, rate, pitch }) {
      return edgeSsml({ voice, text, rate, pitch });
    },

    async listVoices() {
      const { reply } = await withRetry('Edge voice list', { op: 'voices' });
      return reply.voices || [];
    },

    async synthesize({ voice, text, rate, pitch }, outFile) {
      const request = {
        op: 'synthesize', text, voice, out: path.resolve(outFile),
        rate: signedPercent(rate), pitch: signedHz(pitch), timeout: Math.round(timeoutMs / 1000)
      };
      const { reply, attempts } = await withRetry(`Edge TTS ${voice}`, request);
      const words = (reply.boundaries || []).map((b) => ({
        text: b.text, start: b.offset / TICKS_PER_SECOND, dur: b.duration / TICKS_PER_SECOND
      }));
      return { words, bytes: reply.bytes, attempts };
    }
  };
}
