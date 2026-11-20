// The Tulsi chat on every page (features/chat/chat-widget.js). Its code and styles are fetched once the page has
// loaded and the browser is idle, so they never compete with the page itself.
const start = () => import('../features/chat/chat-widget.js').then(m => m.initChat()).catch(err => console.warn('chat unavailable', err));
const whenIdle = () => ('requestIdleCallback' in window) ? requestIdleCallback(start, { timeout: 3000 }) : setTimeout(start, 1200);
if (document.readyState === 'complete') whenIdle(); else window.addEventListener('load', whenIdle, { once: true });
