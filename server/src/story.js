import { defaultSettings, ollama } from './llm.js';
import { storyPrompt } from './prompts.js';
import { getThread } from './threads.js';

export async function streamStory(noteIds, res) {
  if (!noteIds || noteIds.length === 0) {
    res.end();
    return;
  }
  
  // Actually we just get the thread for the first note, or use the provided ones.
  // The guide says "thread of linked notes" so we assume noteIds is ordered or we just fetch them.
  const placeholders = noteIds.map(() => '?').join(',');
  const { db } = await import('./db.js');
  const notes = db.prepare(`SELECT * FROM notes WHERE id IN (${placeholders}) ORDER BY created_at ASC`).all(...noteIds);
  
  if (notes.length === 0) {
    res.end();
    return;
  }

  const notesText = notes.map(n => `[${n.created_at}] ${n.summary}\n${n.text}`).join('\n\n');
  const userMessage = `${storyPrompt}\n\nNotes:\n${notesText}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await ollama.chat({
      ...defaultSettings,
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
      think: false
    });

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        res.write(`data: ${JSON.stringify({ text: chunk.message.content })}\n\n`);
      }
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
}
