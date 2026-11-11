const fs = require('fs');

// 1. Update certifications.html
let certHtml = fs.readFileSync('certifications.html', 'utf8');

const oldStripRegex = /<div class="cert-gov-strip"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;

const newStrip = `<div class="cert-gov-strip" style="margin-top: 48px; padding: 32px 36px; background: rgba(255,255,255,0.75); backdrop-filter: blur(20px); border: 1px solid rgba(231,198,128,0.4); border-radius: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 28px; align-items: center; justify-items: center; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/fssai.png" alt="FSSAI - Food Safety and Standards Authority of India" style="height: 44px; max-width: 130px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">Nutraceutical Safety</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/make-in-india.png" alt="Make in India" style="height: 44px; max-width: 130px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">100% Indigenous</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/dpiit-startup-india.png" alt="DPIIT #startupindia" style="height: 44px; max-width: 130px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">DPIIT Recognized</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/msme.png" alt="MSME Government of India" style="height: 44px; max-width: 130px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">Registered Biotech</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/gem-gov.png" alt="GeM Government e Marketplace" style="height: 44px; max-width: 130px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">GeM Govt. Verified</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
              <span class="logo-em" aria-hidden="true" style="width: 30px; height: 30px; background-size: contain;"></span>
              <strong style="font-size: 14px; color: var(--forest); margin-left: 6px;">TN/AYU/24/1234</strong>
            </div>
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">AYUSH Mfg. License</span>
          </div>
        </div>
      </div>
    </section>`;

if (oldStripRegex.test(certHtml)) {
  certHtml = certHtml.replace(oldStripRegex, newStrip);
  fs.writeFileSync('certifications.html', certHtml, 'utf8');
  console.log('Successfully updated certifications.html with official accreditation logos!');
} else {
  console.error('Could not find cert-gov-strip in certifications.html');
}

// 2. Update about.html prestige badge row with the official badges
let aboutHtml = fs.readFileSync('about.html', 'utf8');
const oldBadgesRegex = /<div class="prestige-badge-row">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;

const newBadges = `<div class="prestige-badge-row" style="display: flex; flex-wrap: wrap; gap: 14px; margin-top: 24px; align-items: center;">
                <div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/fssai.png" alt="FSSAI" style="height: 24px; object-fit: contain;">
                </div>
                <div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/make-in-india.png" alt="Make in India" style="height: 24px; object-fit: contain;">
                </div>
                <div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/dpiit-startup-india.png" alt="DPIIT #startupindia" style="height: 24px; object-fit: contain;">
                </div>
                <div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/msme.png" alt="MSME" style="height: 24px; object-fit: contain;">
                </div>
                <div style="background: rgba(255,255,255,0.92); padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(231,198,128,0.4); display: flex; align-items: center; height: 38px;">
                  <img src="/assets/badges/gem-gov.png" alt="GeM" style="height: 24px; object-fit: contain;">
                </div>
                <div class="prestige-chip" style="height: 38px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  TN/AYU/24/1234
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`;

if (oldBadgesRegex.test(aboutHtml)) {
  aboutHtml = aboutHtml.replace(oldBadgesRegex, newBadges);
  fs.writeFileSync('about.html', aboutHtml, 'utf8');
  console.log('Successfully updated about.html with official accreditation logos!');
} else {
  console.error('Could not find prestige-badge-row in about.html');
}
