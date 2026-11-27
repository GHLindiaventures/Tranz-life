import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` makes a normal static site in dist/ for hosting.
// `npm run build:single` makes one self-contained dist-single/index.html you can email or open from disk.
// In dev and preview, /api is passed to the backend (`npm run backend`), so VITE_PAYMENT_API=/api works locally.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = { '/api': `http://localhost:${env.API_PORT || 8787}` };
  return {
    base: './',
    server: {
      host: true,
      proxy,
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.io', 'albertine-nonempathic-heaven.ngrok-free.dev'],
      watch: {
        ignored: ['**/*.mp4', '**/dist/**']
      }
    },
    preview: {
      host: true,
      proxy,
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.io', 'albertine-nonempathic-heaven.ngrok-free.dev']
    },
    plugins: single ? [viteSingleFile()] : [],
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false }
      : {
          outDir: 'dist',
          chunkSizeWarningLimit: 900,
          rollupOptions: {
            input: {
              main: 'index.html',
              products: 'products.html',
              productDetails: 'product-details.html',
              account: 'account.html'
            }
          }
        },
    test: { environment: 'node', include: ['tests/**/*.test.js'] }
  };
});
