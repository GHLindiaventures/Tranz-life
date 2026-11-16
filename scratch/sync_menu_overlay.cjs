const fs = require('fs');
const path = require('path');

const SITE_PAGES = [
  { no: '01', name: 'Home', sub: 'Nature meets science', href: 'index.html#home', key: 'home' },
  { no: '02', name: 'About Us', sub: 'Our mission & innovation', href: 'about.html', key: 'about' },
  { no: '03', name: 'Our Products', sub: 'All five formulations', href: 'products.html', key: 'products' },
  { no: '04', name: 'Science & Innovation', sub: 'Molecular delivery & 3D lab', href: 'science.html', key: 'science' },
  { no: '05', name: 'Our Ingredients', sub: 'Botanical pharmacopeia', href: 'ingredients.html', key: 'ingredients' },
  { no: '06', name: 'Quality & Manufacturing', sub: 'Cleanrooms & batch audit', href: 'quality.html', key: 'quality' },
  { no: '07', name: 'Sustainability', sub: 'Regeneration & zero-plastic', href: 'sustainability.html', key: 'sustainability' },
  { no: '08', name: 'Certifications & Compliance', sub: 'Regulatory accreditations', href: 'certifications.html', key: 'certifications' },
  { no: '09', name: 'Contact', sub: 'Say hello', href: 'contact.html', key: 'contact' }
];

const subpages = [
  'index.html', 'about.html', 'products.html', 'product-details.html', 'science.html',
  'ingredients.html', 'quality.html', 'certifications.html', 'sustainability.html',
  'contact.html', 'privacy.html', 'terms.html'
];

function generateMenuList(activeKey) {
  const items = SITE_PAGES.map((p, i) => {
    const activeClass = (p.key === activeKey) ? ' class="active"' : '';
    return `        <li style="--i:${i}"><a href="${p.href}"${activeClass}><span class="mi-no">${p.no}</span><span class="mi-name">${p.name}</span><span class="mi-sub">${p.sub}</span></a></li>`;
  }).join('\n');
  return `<ol class="menu-list" id="menuList">\n${items}\n      </ol>`;
}

let updated = 0;
subpages.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // determine activeKey from filename
  const key = file.replace('.html', '').replace('product-details', 'products');
  const menuListRegex = /<ol class="menu-list"[^>]*>[\s\S]*?<\/ol>/;

  if (menuListRegex.test(content)) {
    const newMenuList = generateMenuList(key);
    content = content.replace(menuListRegex, newMenuList);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated overlay menu in ${file} [key: ${key}]`);
    updated++;
  } else {
    console.warn(`No <ol class="menu-list"> found in ${file}`);
  }
});

console.log(`Finished updating overlay menu across ${updated} pages.`);
