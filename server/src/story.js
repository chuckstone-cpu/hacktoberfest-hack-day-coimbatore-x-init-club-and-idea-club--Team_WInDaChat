import { CALL_DEFAULTS, ollama } from './llm.js';
import { storyMessages } from './prompts.js';

// Streams Gemma's narrative for the given notes into `res` as plain text.
// Stops generating if the client disconnects.
export async function streamStory(notes, res) {
  const started = Date.now();
  const stream = await ollama.chat({
    ...CALL_DEFAULTS,
    options: { ...CALL_DEFAULTS.options, num_predict: 450 },
    messages: storyMessages(notes),
    stream: true,
  });
  res.on('close', () => stream.abort());

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  try {
    for await (const part of stream) {
      res.write(part.message.content);
    }
    console.log(`[llm] story ok in ${Date.now() - started} ms`);
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  } finally {
    res.end();
  }
}
