import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build runs from any folder or GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // The optional Gemini proxy (npm run serve) listens on 8787.
    proxy: { '/api': 'http://localhost:8787' },
  },
});
