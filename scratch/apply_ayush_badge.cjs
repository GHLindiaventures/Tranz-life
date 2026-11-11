const fs = require('fs');

// 1. certifications.html
let cert = fs.readFileSync('certifications.html', 'utf8');
const oldCertBlock = `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
              <span class="logo-em" aria-hidden="true" style="width: 30px; height: 30px; background-size: contain;"></span>
              <strong style="font-size: 14px; color: var(--forest); margin-left: 6px;">TN/AYU/24/1234</strong>
            </div>
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">AYUSH Mfg. License</span>
          </div>`;

const newCertBlock = `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/ayush.png" alt="Ministry of AYUSH - Government of India" style="height: 44px; max-width: 140px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">AYUSH: TN/AYU/24/1234</span>
          </div>`;

if (cert.includes(oldCertBlock)) {
  cert = cert.replace(oldCertBlock, newCertBlock);
  fs.writeFileSync('certifications.html', cert);
  console.log('Updated certifications.html');
} else {
  console.log('oldCertBlock not found directly, trying regex');
  const reg = /<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">\s*<div style="height: 44px; display: flex; align-items: center; justify-content: center;">\s*<span class="logo-em"[^>]*><\/span>\s*<strong[^>]*>TN\/AYU\/24\/1234<\/strong>\s*<\/div>\s*<span[^>]*>AYUSH Mfg\. License<\/span>\s*<\/div>/;
  if (reg.test(cert)) {
    cert = cert.replace(reg, newCertBlock);
    fs.writeFileSync('certifications.html', cert);
    console.log('Updated certifications.html via regex');
  } else {
    console.log('Failed to match in certifications.html');
  }
}

// 2. index.html
let index = fs.readFileSync('index.html', 'utf8');
const oldIndexBlock = `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
              <span class="logo-em" aria-hidden="true" style="width: 28px; height: 28px; background-size: contain;"></span>
              <strong style="font-size: 13.5px; color: var(--forest); margin-left: 6px;">TN/AYU/24/1234</strong>
            </div>
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">Official AYUSH License</span>
          </div>`;

const newIndexBlock = `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/ayush.png" alt="Ministry of AYUSH - Government of India" style="height: 44px; max-width: 140px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">AYUSH: TN/AYU/24/1234</span>
          </div>`;

if (index.includes(oldIndexBlock)) {
  index = index.replace(oldIndexBlock, newIndexBlock);
  fs.writeFileSync('index.html', index);
  console.log('Updated index.html');
} else {
  const regIdx = /<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">\s*<div style="height: 44px; display: flex; align-items: center; justify-content: center;">\s*<span class="logo-em"[^>]*><\/span>\s*<strong[^>]*>TN\/AYU\/24\/1234<\/strong>\s*<\/div>\s*<span[^>]*>Official AYUSH License<\/span>\s*<\/div>/;
  if (regIdx.test(index)) {
    index = index.replace(regIdx, newIndexBlock);
    fs.writeFileSync('index.html', index);
    console.log('Updated index.html via regex');
  } else {
    console.log('Failed to match in index.html');
  }
}

// 3. about.html
let about = fs.readFileSync('about.html', 'utf8');
const oldAboutTarget = `<div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/gem-gov.png" alt="GeM" style="height: 24px; object-fit: contain;">
                </div>`;
const newAboutTarget = `<div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/gem-gov.png" alt="GeM" style="height: 24px; object-fit: contain;">
                </div>
                <div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/ayush.png" alt="Ministry of AYUSH" style="height: 24px; object-fit: contain;">
                </div>`;

if (about.includes(oldAboutTarget)) {
  about = about.replace(oldAboutTarget, newAboutTarget);
  fs.writeFileSync('about.html', about);
  console.log('Updated about.html');
} else {
  const regAbt = /<div style="background: rgba\(255,255,255,0\.92\);[^>]*>\s*<img src="\/assets\/badges\/gem-gov\.png"[^>]*>\s*<\/div>/;
  if (regAbt.test(about)) {
    about = about.replace(regAbt, newAboutTarget);
    fs.writeFileSync('about.html', about);
    console.log('Updated about.html via regex');
  } else {
    console.log('Failed to match in about.html');
  }
}
