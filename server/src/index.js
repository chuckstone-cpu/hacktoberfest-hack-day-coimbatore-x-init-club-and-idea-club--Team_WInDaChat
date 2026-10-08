import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { config } from './config.js';
import { getOllamaVersion, warmUp } from './llm.js';
import { getGraph, getNote, listNotes } from './db.js';
import { addNote } from './pipeline.js';
import { getThread } from './threads.js';
import { streamStory } from './story.js';
import { diffCues } from './verify/cues.js';
import { runQuiz } from './verify/quiz.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const NoteInput = z.object({
  text: z
    .string({ error: 'Note text is required.' })
    .trim()
    .min(1, 'Write something before saving.')
    .max(2000, 'Notes can be at most 2000 characters.'),
});

const StoryInput = z.object({
  noteIds: z.array(z.number().int().positive()).min(1).max(8),
});

const VerifyInput = z.object({
  noteIds: z.array(z.number().int().positive()).min(1).max(8),
  text: z.string().trim().min(1).max(5000),
});

// Notes for the given ids, oldest first; unknown ids are skipped.
function notesFor(ids) {
  return [...new Set(ids)]
    .map(getNote)
    .filter(Boolean)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id);
}

app.get('/api/health', async (_req, res) => {
  const ollamaVersion = await getOllamaVersion();
  res.json({
    ok: true,
    model: config.model,
    ollama: ollamaVersion ? 'up' : 'down',
    ollamaVersion,
  });
});

app.get('/api/notes', (_req, res) => {
  res.json(listNotes());
});

app.post('/api/notes', async (req, res) => {
  const parsed = NoteInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { note, terms, links, tagError, linkError } = await addNote(parsed.data.text);
  res.status(201).json({ note, terms, links, tagError, linkError });
});

app.get('/api/graph', (_req, res) => {
  res.json(getGraph());
});

app.get('/api/thread/:id', (req, res) => {
  const id = Number(req.params.id);
  const thread = Number.isInteger(id) ? getThread(id) : null;
  if (!thread) return res.status(404).json({ error: 'Note not found.' });
  res.json(thread);
});

app.post('/api/story', async (req, res) => {
  const parsed = StoryInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'noteIds must be a list of 1 to 8 note ids.' });
  }
  const notes = notesFor(parsed.data.noteIds);
  if (notes.length === 0) return res.status(404).json({ error: 'None of those notes exist.' });

  try {
    await streamStory(notes, res);
  } catch (err) {
    console.error(`[story] failed: ${err.message}`);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Gemma could not write the story. Is Ollama running?' });
    }
  }
});

app.post('/api/verify', async (req, res) => {
  const parsed = VerifyInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Send noteIds (1 to 8 ids) and the text to check (up to 5000 characters).' });
  }
  const notes = notesFor(parsed.data.noteIds);
  if (notes.length === 0) return res.status(404).json({ error: 'None of those notes exist.' });

  const sources = notes.map((n) => n.text).join('\n\n');
  const { text } = parsed.data;
  const started = Date.now();
  const cues = diffCues(sources, text);
  try {
    const facts = await runQuiz(sources, text);
    console.log(`[verify] ${facts.length} facts, ${cues.length} cue issues in ${Date.now() - started} ms`);
    res.json({ cues, facts });
  } catch (err) {
    // The cue diff needs no model, so it is still worth returning.
    console.error(`[verify] quiz failed: ${err.message}`);
    res.json({ cues, facts: [], quizError: 'Gemma could not run the fact quiz. Only the cue check is shown.' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (model: ${config.model})`);
  warmUp();
});
