// The TranzLife online store is a separate website, built later. This corporate site only links to it.
// When the store launches, set VITE_STORE_URL in .env (e.g. https://shop.tranzlife.in) and rebuild: every "Buy online"
// link on the site then points there (product links go to <store>/products/<id>). Until then the site says
// "Online store coming soon" and offers an enquiry instead.
const STORE_URL = String(import.meta.env.VITE_STORE_URL || '').trim().replace(/\/+$/, '');

const storeLive = STORE_URL !== '';

// the store page for one product, or the store's home
const storeUrl = id => (id ? `${STORE_URL}/products/${encodeURIComponent(id)}` : STORE_URL);

// "Buy online ↗" when the store is live; otherwise a quiet "coming soon" note (or nothing, with { quiet: true })
function storeCta(id, { quiet = false, cls = '' } = {}){
  if (storeLive) return `<a class="store-link ${cls}" href="${storeUrl(id)}" target="_blank" rel="noopener">Buy online <i aria-hidden="true">↗</i></a>`;
  return quiet ? '' : `<span class="store-soon ${cls}"><i aria-hidden="true"></i>Online store coming soon</span>`;
}

export { STORE_URL, storeLive, storeUrl, storeCta };
