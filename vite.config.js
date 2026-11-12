import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

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

// `npm run build` makes a normal static site in dist/ for hosting.
// `npm run build:single` makes one self-contained dist-single/index.html you can email or open from disk.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: single ? [viteSingleFile()] : [staleServiceWorkerPlugin()],
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false }
      : {
          outDir: 'dist',
          chunkSizeWarningLimit: 900,
          rollupOptions: {
            input: {
              main: 'index.html',
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
