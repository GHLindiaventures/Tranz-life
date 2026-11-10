// Self-healing fallback for stale browser sessions caching previous React/PWA projects
console.log('[TranzLife] Stale Service Worker detected. Purging cache and refreshing...');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    const unregs = regs.map(r => r.unregister());
    Promise.all(unregs).then(() => {
      if ('caches' in window) {
        caches.keys().then(keys => {
          Promise.all(keys.map(k => caches.delete(k))).then(() => {
            console.log('[TranzLife] ServiceWorker and Caches purged. Reloading fresh...');
            window.location.reload();
          });
        });
      } else {
        window.location.reload();
      }
    });
  });
} else {
  window.location.reload();
}

export default {};

