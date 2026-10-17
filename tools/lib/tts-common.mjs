/* tools/lib/tts-common.mjs — what the speech-engine adapters share (lib/tts-edge.mjs, lib/tts-azure.mjs).
 *
 *   new TtsError(message, { kind, retry, status })   kind: network | timeout | service | no-audio |
 *       invalid | credentials | missing-package | missing-python | unknown; retry: worth trying again
 *   await withRetry(label, attemptFn, { retries, backoffMs, sleep, log })
 *       -> { value, attempts }; retries a TtsError with retry: true after 1 s, 2 s, 4 s… (max 30 s),
 *       up to `retries` more times; the final error names the label and the attempts.
 */

export class TtsError extends Error {
  constructor(message, { kind = 'unknown', retry = false, status } = {}) {
    super(message);
    this.name = 'TtsError';
    this.kind = kind;
    this.retry = retry;
    if (status != null) this.status = status;
  }
}

export async function withRetry(label, attemptFn, { retries = 4, backoffMs = 1000, sleep, log } = {}) {
  const wait = sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  for (let attempt = 1; ; attempt++) {
    try {
      return { value: await attemptFn(attempt), attempts: attempt };
    } catch (err) {
      const error = err instanceof TtsError ? err : new TtsError(err && err.message ? err.message : String(err), { retry: true });
      if (!error.retry || attempt > retries) {
        error.message = `${label}: ${error.message}` + (attempt > 1 ? ` (after ${attempt} attempts)` : '');
        throw error;
      }
      const ms = Math.min(30000, backoffMs * 2 ** (attempt - 1));
      if (log) log(`${label}: ${error.message}; retrying in ${ms / 1000} s`);
      await wait(ms);
    }
  }
}
