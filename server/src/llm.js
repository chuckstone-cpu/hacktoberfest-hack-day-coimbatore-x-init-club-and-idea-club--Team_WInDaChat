import { Ollama } from 'ollama';
import { z } from 'zod';
import { config } from './config.js';

export const ollama = new Ollama({ host: config.ollamaHost });

// Settings shared by every Gemma call (see docs/BUILD_GUIDE.md section 5).
// num_ctx is always passed: Ollama's default context can silently truncate prompts.
export const CALL_DEFAULTS = {
  model: config.model,
  think: false,
  keep_alive: '30m',
  options: { temperature: 0, num_ctx: config.numCtx, num_predict: 800, seed: 42 },
};

export class LlmError extends Error {}

// Returns the Ollama version string, or null if the server is unreachable.
export async function getOllamaVersion() {
  try {
    const res = await fetch(`${config.ollamaHost}/api/version`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const { version } = await res.json();
    return version ?? null;
  } catch {
    return null;
  }
}

// Loads the model into memory ahead of the first note, using the same
// num_ctx as real calls so Ollama doesn't reload it. Failures are ignored.
export async function warmUp() {
  const started = Date.now();
  try {
    await ollama.chat({ ...CALL_DEFAULTS, messages: [{ role: 'user', content: 'ok' }], options: { ...CALL_DEFAULTS.options, num_predict: 1 } });
    console.log(`[llm] model warm in ${Date.now() - started} ms`);
  } catch (err) {
    console.warn(`[llm] warm-up skipped: ${err.message}`);
  }
}

// Calls Gemma with a JSON schema derived from `schema`, then parses and
// validates the reply. Retries once; throws LlmError if both attempts fail.
export async function callJson(schema, messages, { label = 'json' } = {}) {
  const format = z.toJSONSchema(schema);
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    try {
      const res = await ollama.chat({ ...CALL_DEFAULTS, messages, format, stream: false });
      const data = schema.parse(JSON.parse(res.message.content));
      console.log(`[llm] ${label} ok in ${Date.now() - started} ms (attempt ${attempt})`);
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`[llm] ${label} failed in ${Date.now() - started} ms (attempt ${attempt}): ${err.message}`);
    }
  }
  throw new LlmError(`Gemma ${label} call failed: ${lastError?.message ?? 'unknown error'}`);
}
