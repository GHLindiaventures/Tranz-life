const fs = require('fs');

let c = fs.readFileSync('index.html', 'utf8');

const target = '</main>';
const strip = `    <!-- ======================================================================
         GOVERNMENT & REGULATORY ACCREDITATIONS TRUST STRIP
         ====================================================================== -->
    <section class="band" style="padding: 40px 0 60px; background: rgba(22, 48, 26, 0.03);">
      <div class="wrap">
        <div style="text-align: center; margin-bottom: 24px;">
          <p class="eyebrow drawn" style="color: var(--forest); margin-bottom: 6px;">Government Recognized &amp; Certified</p>
          <h3 style="font-size: clamp(1.4rem, 2.8vw, 1.9rem); color: var(--forest); font-weight: 750;">
            Institutional Accreditations &amp; Manufacturing Rigor
          </h3>
        </div>
        <div style="padding: 28px 32px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(231, 198, 128, 0.4); border-radius: 24px; box-shadow: 0 12px 32px rgba(20, 52, 26, 0.06); display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 24px; align-items: center; justify-items: center; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/fssai.png" alt="FSSAI" style="height: 44px; max-width: 120px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">Nutraceutical Safety</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/make-in-india.png" alt="Make in India" style="height: 44px; max-width: 120px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">100% Indigenous</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/dpiit-startup-india.png" alt="DPIIT #startupindia" style="height: 44px; max-width: 120px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">DPIIT Recognized</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/msme.png" alt="MSME Government of India" style="height: 44px; max-width: 120px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">Registered Biotech</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <img src="/assets/badges/gem-gov.png" alt="GeM Government e Marketplace" style="height: 44px; max-width: 120px; object-fit: contain;">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">GeM Govt. Verified</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="height: 44px; display: flex; align-items: center; justify-content: center;">
              <span class="logo-em" aria-hidden="true" style="width: 28px; height: 28px; background-size: contain;"></span>
              <strong style="font-size: 13.5px; color: var(--forest); margin-left: 6px;">TN/AYU/24/1234</strong>
            </div>
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">Official AYUSH License</span>
          </div>
        </div>
      </div>
    </section>
  </main>`;

if (c.includes(target)) {
  c = c.replace(target, strip);
  fs.writeFileSync('index.html', c, 'utf8');
  console.log('Successfully inserted trust strip into index.html');
} else {
  console.error('Could not find </main> in index.html');
}

