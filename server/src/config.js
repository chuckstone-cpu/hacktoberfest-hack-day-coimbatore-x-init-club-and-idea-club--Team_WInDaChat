import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Root level .env

export const config = {
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:e4b',
  numCtx: Number(process.env.NUM_CTX) || 16384,
  dbPath: process.env.DB_PATH || 'nectore.db',
  port: process.env.PORT || 3001,
};
