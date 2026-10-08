import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { config } from './config.js';
import { getOllamaVersion } from './llm.js';
import { createNote, getGraph, listNotes } from './db.js';

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

app.post('/api/notes', (req, res) => {
  const parsed = NoteInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const note = createNote(parsed.data.text);
  res.status(201).json({ note, terms: [], links: [] });
});

app.get('/api/graph', (_req, res) => {
  res.json(getGraph());
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (model: ${config.model})`);
});
