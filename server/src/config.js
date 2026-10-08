import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });

export const config = {
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'gemma4:e4b',
  numCtx: Number(process.env.NUM_CTX) || 16384,
  dbPath: path.resolve(rootDir, process.env.DB_PATH || 'nectore.db'),
  port: Number(process.env.PORT) || 3001,
};
