import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { db } from './db.js';
import { checkHealth } from './llm.js';
import { processNote } from './pipeline.js';
import { getThread } from './threads.js';
import { streamStory } from './story.js';
import { verifyStory } from './verify/quiz.js';
import { extractTextFromFile } from './ocr.js';
import { notionRouter } from './routes/notion.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', notionRouter);

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/health', async (req, res) => {
  const health = await checkHealth();
  res.json({ ok: true, model: config.ollamaModel, up: health.up, ollamaVersion: health.version });
});

app.get('/api/notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM notes').all();
  // Fetch terms for each
  const getTerms = db.prepare(`
    SELECT t.name, t.kind FROM terms t
    JOIN note_terms nt ON t.id = nt.term_id
    WHERE nt.note_id = ?
  `);
  const result = notes.map(n => ({ ...n, terms: getTerms.all(n.id) }));
  res.json(result);
});

app.post('/api/notes', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') return res.status(400).json({ error: "Text required" });
  if (text.length > 2000) return res.status(400).json({ error: "Text too long" });
  
  const result = await processNote(text);
  res.json(result);
});

app.get('/api/graph', (req, res) => {
  const notes = db.prepare('SELECT id, summary FROM notes').all();
  const links = db.prepare('SELECT src as source, dst as target, type, strength, reason FROM links').all();
  res.json({ nodes: notes.map(n => ({ id: n.id, label: n.summary, summary: n.summary })), links });
});

app.get('/api/thread/:id', (req, res) => {
  const thread = getThread(Number(req.params.id));
  res.json(thread);
});

app.post('/api/story', async (req, res) => {
  const { noteIds } = req.body;
  await streamStory(noteIds, res);
});

app.post('/api/verify', async (req, res) => {
  const { noteIds, text } = req.body;
  if (!text) return res.status(400).json({error: "text required"});
  const placeholders = noteIds.map(() => '?').join(',');
  const notes = db.prepare(`SELECT text FROM notes WHERE id IN (${placeholders})`).all(...noteIds);
  const sourceText = notes.map(n => n.text).join('\n\n');
  
  const report = await verifyStory(sourceText, text);
  res.json(report);
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const text = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lab/results', (req, res) => {
  const p = path.resolve(process.cwd(), 'lab/results/results.json');
  if (fs.existsSync(p)) {
    res.json(JSON.parse(fs.readFileSync(p, 'utf-8')));
  } else {
    res.json([]);
  }
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
