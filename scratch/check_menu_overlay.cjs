const fs = require('fs');

const pages = [
  'about.html', 'products.html', 'product-details.html', 'science.html',
  'ingredients.html', 'quality.html', 'certifications.html', 'sustainability.html',
  'news.html', 'contact.html', 'careers.html', 'privacy.html', 'terms.html'
];

pages.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  console.log(`${p}: has #menu? ${content.includes('id="menu"')}`);
});

