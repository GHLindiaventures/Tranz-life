import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createChatApi } from './server/chat-api.js';

// Runs the Tulsi chat API inside the Vite server, so `npm run dev` and `npm run preview` include the chat.
function tulsiChat(env){
  let api;
  const mount = server => {
    api ??= createChatApi(env);
    server.middlewares.use((req, res, next) => api.handle(req, res, next));
    server.httpServer?.once('listening', () => api.warmUp(server.config.logger));
  };
  return { name: 'tulsi-chat', configureServer: mount, configurePreviewServer: mount };
}

// `npm run build` makes the site in dist/; `npm start` serves it with the chat (server/index.js).
// `npm run build:single` makes one self-contained dist-single/index.html you can email or open from disk (no chat).
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const env = loadEnv(mode, process.cwd(), '');      // all .env values, for the chat API only (never sent to the browser)
  return {
    base: './',
    server: {
      allowedHosts: true
    },
    preview: {
      allowedHosts: true
    },
    plugins: single ? [viteSingleFile()] : [tulsiChat(env)],
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false }
      : { outDir: 'dist', chunkSizeWarningLimit: 900 },
    test: { environment: 'node', include: ['tests/**/*.test.js'] }
  };
});
