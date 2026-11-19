import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createChatApi } from './server/chat-api.js';

function staleServiceWorkerPlugin() {
  return {
    name: 'stale-service-worker-kill-switch',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.includes('@react-refresh')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.end('export function injectIntoGlobalHook() {}; export default {};');
          return;
        }
        if (url.includes('pwa-entry-point-loaded') || url.includes('registerSW') || url.includes('sw.js')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.end('export default {};');
          return;
        }
        next();
      });
    }
  };
}

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

// `npm run build` makes a normal static site in dist/ for hosting.
// `npm run build:single` makes one self-contained dist-single/index.html you can email or open from disk.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      // big films are copied in while the server runs: watching them half-written crashed it (EBUSY)
      watch: { ignored: ['**/public/videos/**', '**/scripts/source/**'] }
    },
    preview: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts: true
    },
    plugins: single ? [viteSingleFile()] : [staleServiceWorkerPlugin(), tulsiChat(env)],
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false }
      : {
          outDir: 'dist',
          chunkSizeWarningLimit: 900,
          rollupOptions: {
            input: {
              main: 'index.html',
              banyan: 'banyan.html',
              about: 'about.html',
              products: 'products.html',
              productDetails: 'product-details.html',
              science: 'science.html',
              ingredients: 'ingredients.html',
              quality: 'quality.html',
              sustainability: 'sustainability.html',
              contact: 'contact.html',
              certifications: 'certifications.html',
              privacy: 'privacy.html',
              terms: 'terms.html'
            }
          }
        },
    test: { environment: 'node', include: ['tests/**/*.test.js'] }
  };
});
