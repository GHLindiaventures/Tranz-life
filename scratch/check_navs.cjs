const fs = require('fs');

const files = [
  'about.html', 'products.html', 'product-details.html', 'science.html',
  'ingredients.html', 'quality.html', 'certifications.html', 'sustainability.html',
  'news.html', 'contact.html', 'careers.html', 'privacy.html', 'terms.html'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const m = content.match(/<nav class="nav-pills"[^>]*>([\s\S]*?)<\/nav>/);
  console.log(`=== ${f} ===`);
  if (m) console.log(m[1].trim());
  else console.log('NO MATCH');
});
