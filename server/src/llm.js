import { Ollama } from 'ollama';
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
