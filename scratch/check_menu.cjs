const fs = require('fs');

const pages = [
  'about.html', 'products.html', 'product-details.html', 'science.html',
  'ingredients.html', 'quality.html', 'certifications.html', 'sustainability.html',
  'news.html', 'contact.html', 'careers.html', 'privacy.html', 'terms.html'
];

pages.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  const m = content.match(/<ul class="menu-list"[^>]*>([\s\S]*?)<\/ul>/);
  console.log(`=== ${p} ===`);
  if (m) {
    const items = [...m[1].matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)].map(x => x[1]);
    console.log(`Found ${items.length} links:`, items.slice(0, 4).join(', ') + '...');
  } else {
    console.log('No .menu-list found');
  }
});
