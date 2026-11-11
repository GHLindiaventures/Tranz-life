const fs = require('fs');
const path = require('path');

const pageConfig = {
  'index.html': 'home',
  'about.html': 'about',
  'products.html': 'products',
  'product-details.html': 'pdp',
  'science.html': 'science',
  'ingredients.html': 'ingredients',
  'quality.html': 'quality',
  'certifications.html': 'certifications',
  'sustainability.html': 'sustainability',
  'contact.html': 'contact',
  'privacy.html': 'privacy',
  'terms.html': 'terms'
};

function generateNavPills(pageKey) {
  const isHome = pageKey === 'home';
  const isCompany = ['about', 'contact'].includes(pageKey);
  const isProducts = ['products', 'pdp'].includes(pageKey);
  const isScience = ['science', 'ingredients'].includes(pageKey);
  const isStandards = ['quality', 'certifications', 'sustainability'].includes(pageKey);

  const homeExtra = isHome ? ' class="on" data-sec="home"' : '';

  return `<nav class="nav-pills" aria-label="Main">
      <a href="index.html#home"${homeExtra}>Home</a>

      <!-- Company Dropdown -->
      <div class="nav-drop">
        <button class="nav-drop-btn${isCompany ? ' on' : ''}" type="button" aria-expanded="false">
          Company <svg class="nav-caret" viewBox="0 0 12 12"><path d="M2.5 4.5L6 8L9.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="nav-drop-menu" role="menu">
          <a href="about.html" class="nav-drop-item${pageKey === 'about' ? ' on" aria-current="page' : ''}">
            <strong>About Us</strong>
            <small>Mission &amp; Innovation</small>
          </a>
          <a href="contact.html" class="nav-drop-item${pageKey === 'contact' ? ' on" aria-current="page' : ''}">
            <strong>Contact Us</strong>
            <small>Chennai HQ &amp; Support</small>
          </a>
        </div>
      </div>

      <!-- Products Dropdown -->
      <div class="nav-drop">
        <button class="nav-drop-btn${isProducts ? ' on' : ''}" type="button" aria-expanded="false">
          Products <svg class="nav-caret" viewBox="0 0 12 12"><path d="M2.5 4.5L6 8L9.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="nav-drop-menu" role="menu">
          <a href="products.html" class="nav-drop-item featured${pageKey === 'products' ? ' on" aria-current="page' : ''}">
            <strong>All Formulations (5)</strong>
            <small>Browse Complete Catalog</small>
          </a>
          <div class="nav-drop-divider"></div>
          <a href="product-details.html?id=gummies" class="nav-drop-item">
            <strong>PulmoClear™ Gummies</strong>
            <small>Lung Booster &amp; Craving Control</small>
          </a>
          <a href="product-details.html?id=inhaler" class="nav-drop-item">
            <strong>Craving Control™ Inhaler</strong>
            <small>Tobacco Cessation Aromatherapy</small>
          </a>
          <a href="product-details.html?id=rollon" class="nav-drop-item">
            <strong>CycleRelief™ Roll-On</strong>
            <small>Menstrual Comfort &amp; Cramps</small>
          </a>
          <a href="product-details.html?id=reviva" class="nav-drop-item">
            <strong>Reviva™ Roll-On</strong>
            <small>Diabetes &amp; Vitality Support</small>
          </a>
          <a href="product-details.html?id=liver" class="nav-drop-item">
            <strong>LiverDetox™ Concoction</strong>
            <small>100% Ayurvedic Liver Booster</small>
          </a>
        </div>
      </div>

      <!-- Science Dropdown -->
      <div class="nav-drop">
        <button class="nav-drop-btn${isScience ? ' on' : ''}" type="button" aria-expanded="false">
          Science <svg class="nav-caret" viewBox="0 0 12 12"><path d="M2.5 4.5L6 8L9.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="nav-drop-menu" role="menu">
          <a href="science.html" class="nav-drop-item${pageKey === 'science' ? ' on" aria-current="page' : ''}">
            <strong>Science &amp; Innovation</strong>
            <small>3D Compound Lab &amp; Delivery</small>
          </a>
          <a href="ingredients.html" class="nav-drop-item${pageKey === 'ingredients' ? ' on" aria-current="page' : ''}">
            <strong>Our Ingredients</strong>
            <small>Botanical Pharmacopeia</small>
          </a>
        </div>
      </div>

      <!-- Standards Dropdown -->
      <div class="nav-drop">
        <button class="nav-drop-btn${isStandards ? ' on' : ''}" type="button" aria-expanded="false">
          Standards <svg class="nav-caret" viewBox="0 0 12 12"><path d="M2.5 4.5L6 8L9.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="nav-drop-menu" role="menu">
          <a href="quality.html" class="nav-drop-item${pageKey === 'quality' ? ' on" aria-current="page' : ''}">
            <strong>Quality &amp; Manufacturing</strong>
            <small>ISO 7 Cleanrooms &amp; Batch COA</small>
          </a>
          <a href="certifications.html" class="nav-drop-item${pageKey === 'certifications' ? ' on" aria-current="page' : ''}">
            <strong>Certifications &amp; Compliance</strong>
            <small>AYUSH GMP &amp; NABL Testing</small>
          </a>
          <a href="sustainability.html" class="nav-drop-item${pageKey === 'sustainability' ? ' on" aria-current="page' : ''}">
            <strong>Sustainability</strong>
            <small>Regenerative Ecosystems</small>
          </a>
        </div>
      </div>
    </nav>`;
}

let modifiedCount = 0;
for (const [file, key] of Object.entries(pageConfig)) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const navRegex = /<nav class="nav-pills"[^>]*>([\s\S]*?)<\/nav>/;
  if (!navRegex.test(content)) {
    console.error(`No <nav class="nav-pills"> found in ${file}`);
    continue;
  }
  const replacement = generateNavPills(key);
  content = content.replace(navRegex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file} [key: ${key}]`);
  modifiedCount++;
}

console.log(`Done. Successfully updated ${modifiedCount} files.`);
