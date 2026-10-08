import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { getOllamaVersion } from './llm.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (_req, res) => {
  const ollamaVersion = await getOllamaVersion();
  res.json({
    ok: true,
    model: config.model,
    ollama: ollamaVersion ? 'up' : 'down',
    ollamaVersion,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (model: ${config.model})`);
});
