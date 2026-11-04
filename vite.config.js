import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` makes a normal static site in dist/ for hosting.
// `npm run build:single` makes one self-contained dist-single/index.html you can email or open from disk.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: single ? [viteSingleFile()] : [],
    // the Tulsi chat calls /api/chat; in dev that goes to `npm run chat` (server/chat-server.js)
    server: { proxy: { '/api': `http://localhost:${process.env.CHAT_PORT || 8787}` } },
    preview: { proxy: { '/api': `http://localhost:${process.env.CHAT_PORT || 8787}` } },
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false }
      : { outDir: 'dist', chunkSizeWarningLimit: 900 },
    test: { environment: 'node', include: ['tests/**/*.test.js'] }
  };
});
