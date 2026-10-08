import { Ollama } from 'ollama';
import { config } from './config.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const ollama = new Ollama({ host: config.ollamaHost });

export async function checkHealth() {
  try {
    // Actually ollama doesn't have a direct ping, but we can list models or fetch version.
    const res = await fetch(`${config.ollamaHost}/api/version`);
    if (!res.ok) throw new Error('Ollama not ok');
    const data = await res.json();
    return { up: true, version: data.version };
  } catch (error) {
    return { up: false, error: error.message };
  }
}

export const defaultSettings = {
  model: config.ollamaModel,
  keep_alive: "30m",
  options: {
    temperature: 0,
    num_ctx: config.numCtx,
    num_predict: 800,
    seed: 42
  }
};

export async function callJson(zodSchema, messages) {
  const jsonSchema = zodToJsonSchema(zodSchema);
  let attempt = 0;
  
  while (attempt < 2) {
    attempt++;
    const start = Date.now();
    try {
      const response = await ollama.chat({
        ...defaultSettings,
        messages,
        format: jsonSchema,
      });

      const duration = Date.now() - start;
      console.log(`[LLM JSON] Attempt ${attempt} took ${duration}ms`);
      
      const parsedJSON = JSON.parse(response.message.content);
      const validated = zodSchema.parse(parsedJSON);
      return validated;
    } catch (e) {
      console.error(`[LLM JSON] Attempt ${attempt} failed:`, e.message);
      if (attempt === 2) {
        throw new Error(`LLM JSON validation failed after 2 attempts: ${e.message}`);
      }
    }
  }
}
