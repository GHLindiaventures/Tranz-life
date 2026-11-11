const fs = require('fs');
const path = require('path');

const pages = [
  'index.html', 'about.html', 'products.html', 'product-details.html',
  'science.html', 'ingredients.html', 'quality.html', 'certifications.html',
  'sustainability.html', 'news.html', 'contact.html', 'careers.html',
  'privacy.html', 'terms.html'
];

let totalLinks = 0;
let brokenLinks = 0;

pages.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  // Match href="something"
  const hrefMatches = [...content.matchAll(/href="([^":]+)"/g)];
  hrefMatches.forEach(m => {
    let raw = m[1].trim();
    if (raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('http')) return;
    
    // strip query string and hash
    let clean = raw.split('?')[0].split('#')[0];
    if (!clean) return;

    totalLinks++;

    let fullPath = path.join(__dirname, '..', clean);
    // If it starts with slash, also check public directory
    let publicPath = clean.startsWith('/') ? path.join(__dirname, '..', 'public', clean.slice(1)) : null;

    if (!fs.existsSync(fullPath) && (!publicPath || !fs.existsSync(publicPath))) {
      console.error(`Broken link in ${p}: ${raw} (resolved: ${clean})`);
      brokenLinks++;
    }
  });
});

console.log(`Audited ${pages.length} pages: ${totalLinks} internal links verified.`);
if (brokenLinks === 0) {
  console.log(`All ${totalLinks} internal links are completely valid! 0 broken links.`);
} else {
  console.error(`Found ${brokenLinks} broken links!`);
  process.exit(1);
}
