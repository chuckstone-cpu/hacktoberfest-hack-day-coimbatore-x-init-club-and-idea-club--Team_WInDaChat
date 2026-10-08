import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // The API port lives in the repo-root .env, shared with the server.
  const env = loadEnv(mode, path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), '');
  const apiPort = env.PORT || 3001;
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
  };
});
