const fs = require('fs');

let html = fs.readFileSync('about.html', 'utf8').replace(/\r\n/g, '\n');

// 1. HERO SUBTITLE
html = html.replace(
  /<p class="about-hero-sub">[\s\S]*?<\/p>/,
  `<p class="about-hero-sub">\n          Born in Chennai, TranzLife Biosciences brings together the wisdom of Ayurveda and modern science to create natural, safe and effective solutions that support health and well-being.\n        </p>`
);

// 2. HERO BADGES
const newHeroBadges = `<div class="about-hero-badges">
          <span class="about-tag-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            NRDC Technology Collaboration
          </span>
          <span class="about-tag-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              <path d="M11 3c2 2 4.5 4 8 4"/>
              <path d="M11 3c-1.5 3-1 6 1 8"/>
            </svg>
            Rooted in Ayurveda
          </span>
          <span class="about-tag-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            GMP Certified Manufacturing
          </span>
        </div>`;
html = html.replace(/<div class="about-hero-badges">[\s\S]*?<\/div>/, newHeroBadges);

// 3. CHAPTER 1
// Floating badge
html = html.replace(
  /<strong>Pristine Botanical Wildcraft<\/strong>\s*<small>[\s\S]*?<\/small>/,
  `<strong>Our Botanical Heritage</strong>\n                <small>Vasaka, Kalmegh, Kutki, Tulsi &amp; Dill</small>`
);

// Paragraph 1
html = html.replace(
  /<p class="about-lead-text">\s*For millennia[\s\S]*?<\/p>/,
  `<p class="about-lead-text">\n              For thousands of years, classical Ayurvedic texts such as the Charaka Samhita and Sushruta Samhita have documented plants that support health and vitality.\n            </p>`
);

// Paragraph 2
html = html.replace(
  /<p class="about-body-text">\s*Yet in the modern world, raw herbal decoctions faced an insurmountable barrier[\s\S]*?<\/p>/,
  `<p class="about-body-text">\n              Yet in the modern world, raw herbal decoctions faced real challenges: unstable active concentrations, harsh palatability, and poor intestinal bioavailability. Too often, the true potency of sacred plants was lost in crude powders.\n            </p>`
);

// Paragraph 3
html = html.replace(
  /<p class="about-body-text">\s*TranzLife Biosciences was born to resolve this paradox[\s\S]*?<\/p>/,
  `<p class="about-body-text">\n              TranzLife Biosciences was founded to bridge this gap. We carefully select quality botanicals and check their purity before they enter our formulation process.\n            </p>`
);

// Tag pills
const newChap1Tags = `<div class="vis-mis-tags" style="margin-top:16px;">
              <span>Natural Ingredients</span>
              <span>Ayurvedic Wisdom</span>
              <span>100% Plant-Derived</span>
              <span>Science Backed</span>
            </div>`;
html = html.replace(/<div class="vis-mis-tags"[^>]*>[\s\S]*?<\/div>/, newChap1Tags);

// 4. CHAPTER 2
// Heading tag
html = html.replace('Chapter 02 // Precision Biotechnology', 'Chapter 02 // Precision Science');

// Floating badge
html = html.replace(
  /<strong>ISO 7 Analytical Cleanrooms<\/strong>\s*<small>[\s\S]*?<\/small>/,
  `<strong>Modern Formulation Science</strong>\n                <small>Quality-tested at every step</small>`
);

// Body paragraphs & stats
const newChap2Body = `<!-- CONFIRM: exact extraction method -->
            <p class="about-body-text">
              We use modern extraction methods designed to preserve delicate plant compounds while avoiding harsh chemical solvents.
            </p>
            <p class="about-body-text">
              We standardize our extracts for consistent dosing and develop modern delivery formats: aromatherapy inhalers, roll-ons, gummies, capsules, effervescent tablets and polyherbal concoctions.
            </p>
            <div class="about-metrics-stack" style="margin-top:20px;">
              <div class="about-metric-card">
                <span class="num">9</span>
                <span class="label">Market-ready products</span>
              </div>
              <div class="about-metric-card">
                <span class="num">14</span>
                <span class="label">Products in our development pipeline</span>
              </div>
              <div class="about-metric-card">
                <span class="num">6</span>
                <span class="label">Delivery formats</span>
              </div>
            </div>`;

html = html.replace(
  /<p class="about-body-text">\s*Using supercritical CO₂ fluid extraction[\s\S]*?<div class="about-metrics-stack"[^>]*>[\s\S]*?<\/div>\s*<\/div>/,
  newChap2Body + '\n          </div>'
);

// What We Do block
const whatWeDoBlock = `        <!-- What We Do Block (4 Items) -->
        <div class="what-we-do-block" style="margin-top: 56px; padding-top: 48px; border-top: 1px solid rgba(22, 48, 26, 0.08);">
          <div style="text-align: center; max-width: 680px; margin: 0 auto 36px;">
            <p class="eyebrow drawn" style="color: var(--forest); margin-bottom: 6px;">Our Operational Pillars</p>
            <h3 class="h3" style="font-size: clamp(1.4rem, 2.4vw, 1.9rem); color: var(--forest);">What We Do</h3>
          </div>
          <div class="do-grid">
            <div class="do-card">
              <span class="do-step-pill">01 // INNOVATE</span>
              <div class="do-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                </svg>
              </div>
              <h4>Innovate</h4>
              <p>Research-driven formulations with a focus on efficacy and safety.</p>
            </div>

            <div class="do-card">
              <span class="do-step-pill">02 // DEVELOP</span>
              <div class="do-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <h4>Develop</h4>
              <p>Advanced R&amp;D and modern technology to create superior products.</p>
            </div>

            <div class="do-card">
              <span class="do-step-pill">03 // DELIVER</span>
              <div class="do-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <h4>Deliver</h4>
              <p>High-quality manufacturing and stringent quality standards.</p>
            </div>

            <div class="do-card">
              <span class="do-step-pill">04 // IMPACT</span>
              <div class="do-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h4>Impact</h4>
              <p>Empowering healthier lives while promoting sustainability and ethical practices.</p>
            </div>
          </div>
        </div>`;

if (!html.includes('<!-- What We Do Block (4 Items) -->')) {
  const chap2Idx = html.indexOf('id="chapter-2"');
  const chap2EndIdx = html.indexOf('</section>', chap2Idx);
  const chap2Sub = html.slice(chap2Idx, chap2EndIdx);
  const updatedChap2Sub = chap2Sub.replace(/<\/div>\s*<\/div>\s*$/, whatWeDoBlock + '\n      </div>');
  html = html.slice(0, chap2Idx) + updatedChap2Sub + html.slice(chap2EndIdx);
}

// 5. CHAPTER 3
html = html.replace(
  /<p class="sub">\s*True biotechnology is not measured[\s\S]*?<\/p>/,
  `<p class="sub">\n            Our work is shaped through collaboration with government institutions and engagement with international partners.\n          </p>`
);

html = html.replace(
  /<p class="prestige-caption">[\s\S]*?<\/p>/,
  `<p class="prestige-caption">\n                TranzLife leadership with the National Research Development Corporation (NRDC), Ministry of Science &amp; Technology, Govt. of India, and international delegations.\n              </p>`
);

html = html.replace(
  /<p class="eyebrow" style="color:var\(--gold\);">National Technology Milestone<\/p>\s*<h3[^>]*>[\s\S]*?<\/h3>/,
  `<p class="eyebrow" style="color:var(--gold);">NATIONAL TECHNOLOGY COLLABORATION</p>\n              <h3 style="font-size:clamp(1.6rem,3vw,2.2rem);color:#fcfaf4;line-height:1.2;margin:10px 0 16px;">\n                Technology Collaboration with NRDC\n              </h3>`
);

const newCardP = `<!-- CONFIRM: nature of the NRDC agreement -->
              <p style="font-size:14.5px;color:rgba(244,238,226,0.85);line-height:1.6;margin-bottom:14px;">
                TranzLife Biosciences has entered into a technology collaboration with the National Research Development Corporation (NRDC), an enterprise of the Department of Scientific &amp; Industrial Research (DSIR), Ministry of Science and Technology, Government of India.
              </p>
              <p style="font-size:14.5px;color:rgba(244,238,226,0.85);line-height:1.6;margin-bottom:20px;">
                This collaboration supports our aim of turning validated bio-innovations into standardized formulations for domestic and international markets.
              </p>`;

html = html.replace(
  /<p style="font-size:14\.5px;color:rgba\(244,238,226,0\.85\);line-height:1\.6;margin-bottom:14px;">\s*TranzLife Biosciences has achieved a historic milestone[\s\S]*?<\/p>\s*<p style="font-size:14\.5px;color:rgba\(244,238,226,0\.85\);line-height:1\.6;margin-bottom:20px;">[\s\S]*?<\/p>/,
  newCardP
);

// Remove stray TN/AYU chip
html = html.replace(/<div class="prestige-chip"[^>]*>[\s\S]*?<\/div>/g, '');

// Milestones timeline block
const milestonesBlock = `          <!-- Milestones Timeline Block -->
          <!-- CONFIRM: real milestone dates -->
          <div class="milestones-block" id="milestones" style="margin-top: 48px; padding-top: 36px; border-top: 1px solid rgba(244, 238, 226, 0.15);">
            <div style="margin-bottom: 24px;">
              <span class="story-chapter-tag" style="color: var(--gold); border-color: rgba(231, 198, 128, 0.3);">Timeline</span>
              <h4 style="font-size: 1.4rem; color: #fcfaf4; margin-top: 8px;">Key Milestones in Our Journey</h4>
            </div>
            <div class="milestones-timeline-grid" id="milestonesTimeline" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
              <div class="milestone-item" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(231,198,128,0.2); border-radius: 16px; padding: 20px 22px;">
                <div style="font-family: var(--f-mono); font-size: 13px; font-weight: 800; color: var(--gold); letter-spacing: 0.1em; margin-bottom: 6px;">2021</div>
                <h5 style="color: #ffffff; font-size: 1.05rem; margin-bottom: 6px; font-weight: 700;">Botanical Heritage &amp; Inception</h5>
                <p style="color: rgba(244,238,226,0.8); font-size: 0.9rem; line-height: 1.45;">TranzLife Biosciences founded in Chennai to bring together classical Ayurvedic wisdom and modern scientific validation.</p>
              </div>
              <div class="milestone-item" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(231,198,128,0.2); border-radius: 16px; padding: 20px 22px;">
                <div style="font-family: var(--f-mono); font-size: 13px; font-weight: 800; color: var(--gold); letter-spacing: 0.1em; margin-bottom: 6px;">2022</div>
                <h5 style="color: #ffffff; font-size: 1.05rem; margin-bottom: 6px; font-weight: 700;">Extraction &amp; Standardization Protocols</h5>
                <p style="color: rgba(244,238,226,0.8); font-size: 0.9rem; line-height: 1.45;">Pioneered clean, solvent-free botanical extraction and quality testing standards to preserve delicate plant compounds.</p>
              </div>
              <div class="milestone-item" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(231,198,128,0.2); border-radius: 16px; padding: 20px 22px;">
                <div style="font-family: var(--f-mono); font-size: 13px; font-weight: 800; color: var(--gold); letter-spacing: 0.1em; margin-bottom: 6px;">2023</div>
                <h5 style="color: #ffffff; font-size: 1.05rem; margin-bottom: 6px; font-weight: 700;">NRDC Technology Collaboration</h5>
                <p style="color: rgba(244,238,226,0.8); font-size: 0.9rem; line-height: 1.45;">Entered into a technology collaboration with the National Research Development Corporation (NRDC), Ministry of Science &amp; Technology, Govt. of India.</p>
              </div>
              <div class="milestone-item" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(231,198,128,0.2); border-radius: 16px; padding: 20px 22px;">
                <div style="font-family: var(--f-mono); font-size: 13px; font-weight: 800; color: var(--gold); letter-spacing: 0.1em; margin-bottom: 6px;">2024</div>
                <h5 style="color: #ffffff; font-size: 1.05rem; margin-bottom: 6px; font-weight: 700;">Novel Delivery Formats Portfolio</h5>
                <p style="color: rgba(244,238,226,0.8); font-size: 0.9rem; line-height: 1.45;">Engineered a modern multi-format delivery line including pocket aromatherapy inhalers, targeted roll-ons, gummies, and polyherbal concoctions.</p>
              </div>
              <div class="milestone-item" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(231,198,128,0.2); border-radius: 16px; padding: 20px 22px;">
                <div style="font-family: var(--f-mono); font-size: 13px; font-weight: 800; color: var(--gold); letter-spacing: 0.1em; margin-bottom: 6px;">2025</div>
                <h5 style="color: #ffffff; font-size: 1.05rem; margin-bottom: 6px; font-weight: 700;">Advanced Phytochemical Research</h5>
                <p style="color: rgba(244,238,226,0.8); font-size: 0.9rem; line-height: 1.45;">Initiated computational phytochemistry modeling and early-stage exploratory research programs in cellular defense and neuro-phytoactives.</p>
              </div>
              <div class="milestone-item" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(231,198,128,0.2); border-radius: 16px; padding: 20px 22px;">
                <div style="font-family: var(--f-mono); font-size: 13px; font-weight: 800; color: var(--gold); letter-spacing: 0.1em; margin-bottom: 6px;">2026</div>
                <h5 style="color: #ffffff; font-size: 1.05rem; margin-bottom: 6px; font-weight: 700;">Expanded Portfolio &amp; Global Outreach</h5>
                <p style="color: rgba(244,238,226,0.8); font-size: 0.9rem; line-height: 1.45;">9 market-ready wellness formulations, 14 products in research and development pipeline, and 6 specialized delivery formats.</p>
              </div>
            </div>
          </div>`;

if (!html.includes('<!-- Milestones Timeline Block -->')) {
  const chap3Idx = html.indexOf('id="chapter-3"');
  const chap3EndIdx = html.indexOf('</section>', chap3Idx);
  const chap3Sub = html.slice(chap3Idx, chap3EndIdx);
  const updatedChap3Sub = chap3Sub.replace(/<\/div>\s*<\/div>\s*$/, milestonesBlock + '\n        </div>\n      </div>');
  html = html.slice(0, chap3Idx) + updatedChap3Sub + html.slice(chap3EndIdx);
}

// 6. CHAPTER 4
html = html.replace(
  /<p class="about-body-text" style="color:rgba\(244,238,226,0\.85\);">\s*Beyond our commercial formulations, our life-sciences team is actively pioneering research[\s\S]*?<\/p>/,
  `<p class="about-body-text" style="color:rgba(244,238,226,0.85);">\n              Beyond our commercial formulations, our team is exploring research areas where natural compounds may offer new possibilities:\n            </p>`
);

// Card 1
html = html.replace(
  /<h4 style="color:#ffffff;">Autism Spectrum Disorder \(ASD\) Program<\/h4>\s*<\/div>\s*<p style="color:rgba\(244,238,226,0\.8\);">[\s\S]*?<\/p>/,
  `<h4 style="color:#ffffff;">Autism Spectrum Disorder (ASD) Research</h4>\n                </div>\n                <p style="color:rgba(244,238,226,0.8);">\n                  Early-stage research into Bacopa monnieri, Juglans regia and Curcuma caesia as potential bioactive components.\n                </p>`
);

// Card 2
html = html.replace(
  /<h4 style="color:#ffffff;">Preventive Oncology &amp; Cellular Defense<\/h4>\s*<\/div>\s*<p style="color:rgba\(244,238,226,0\.8\);">[\s\S]*?<\/p>/,
  `<h4 style="color:#ffffff;">Oncology Research</h4>\n                </div>\n                <p style="color:rgba(244,238,226,0.8);">\n                  Early-stage research into Annona muricata as a potential bioactive component.\n                </p>`
);

// Card 3
html = html.replace(
  /<h4 style="color:#ffffff;">AI-Powered Phytochemical Synergy Mapping<\/h4>\s*<\/div>\s*<p style="color:rgba\(244,238,226,0\.8\);">[\s\S]*?<\/p>/,
  `<h4 style="color:#ffffff;">AI-Powered Phytochemical Research</h4>\n                </div>\n                <p style="color:rgba(244,238,226,0.8);">\n                  Using computational modelling to study how herbal ingredients interact, to help design safer and more effective formulations.\n                </p>`
);

// Add research disclaimer
const researchNote = `<p class="about-disclaimer" style="margin-top:20px;font-size:12.5px;color:rgba(244,238,226,0.75);font-style:italic;line-height:1.5;">\n              These are research programmes. No TranzLife product is intended to diagnose, treat, cure or prevent any disease.\n            </p>`;
if (!html.includes('These are research programmes. No TranzLife product is intended')) {
  html = html.replace(
    /(<h4 style="color:#ffffff;">AI-Powered Phytochemical Research<\/h4>[\s\S]*?<\/div>\s*<\/div>)/,
    `$1\n            ${researchNote}`
  );
}

// 7. CHAPTER 5
html = html.replace(
  /<p class="sub">\s*The enduring ethical commitments that govern our research pipelines[\s\S]*?<\/p>/,
  `<p class="sub">\n            The commitments that guide our research, our products and the trust our customers place in us.\n          </p>`
);

html = html.replace(
  /<h3>To Become a Globally Trusted Leader<\/h3>\s*<p>[\s\S]*?<\/p>/,
  `<h3>To Be a Globally Trusted Leader</h3>\n            <p>\n              To be a globally trusted leader in life sciences, transforming natural resources and innovative science into safe, effective and sustainable solutions that enhance health and enrich lives.\n            </p>`
);

const newMissionBlock = `<h3>Science, Quality &amp; Responsibility</h3>
            <ul style="list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 10px;">
              <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.94rem; line-height: 1.45; color: var(--muted);">
                <span style="color: var(--gold); font-weight: bold; flex-shrink: 0;">✓</span>
                <span>To innovate and develop science-backed, natural and sustainable products that promote wellness and prevent disease.</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.94rem; line-height: 1.45; color: var(--muted);">
                <span style="color: var(--gold); font-weight: bold; flex-shrink: 0;">✓</span>
                <span>To deliver excellence through quality, safety and regulatory compliance at every step.</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.94rem; line-height: 1.45; color: var(--muted);">
                <span style="color: var(--gold); font-weight: bold; flex-shrink: 0;">✓</span>
                <span>To collaborate, research and adopt advanced technologies to address global health challenges.</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.94rem; line-height: 1.45; color: var(--muted);">
                <span style="color: var(--gold); font-weight: bold; flex-shrink: 0;">✓</span>
                <span>To create value for our stakeholders while upholding ethical practices and environmental responsibility.</span>
              </li>
            </ul>`;

html = html.replace(
  /<h3>Purity, Science &amp; Measurable Efficacy<\/h3>\s*<p>[\s\S]*?<\/p>/,
  newMissionBlock
);

const newValuesGrid = `<div class="values-grid">
          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 01</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg></div>
            </div>
            <h4>Innovation</h4>
            <p>Pioneering solutions for a better tomorrow.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 02</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
            </div>
            <h4>Integrity</h4>
            <p>Ethical in all that we do.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 03</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div>
            </div>
            <h4>Quality</h4>
            <p>Committed to excellence.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 04</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>
            </div>
            <h4>Sustainability</h4>
            <p>Respecting nature, nurturing the future.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 05</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>
            </div>
            <h4>Well-being</h4>
            <p>Enhancing lives, every day.</p>
          </div>
        </div>

        <!-- Our Core Strengths Block (5 Items) -->
        <div class="core-strengths-block" style="margin-top: 56px; padding-top: 48px; border-top: 1px solid var(--line);">
          <div style="text-align: center; max-width: 680px; margin: 0 auto 36px;">
            <p class="eyebrow drawn" style="color: var(--forest); margin-bottom: 6px;">Strategic Advantage</p>
            <h3 class="h3" style="font-size: clamp(1.4rem, 2.4vw, 1.9rem); color: var(--forest);">Our Core Strengths</h3>
          </div>
          <div class="strengths-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px;">
            <div class="strength-card" style="background: #ffffff; border: 1px solid var(--line); border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 12px 28px -18px rgba(31, 70, 35, 0.08);">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--panel-2); color: var(--forest); display: grid; place-items: center; margin: 0 auto 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h4 style="font-size: 1.1rem; color: var(--forest); font-weight: 750; margin-bottom: 6px;">Science-Backed Innovation</h4>
              <p style="font-size: 0.88rem; color: var(--muted); line-height: 1.4;">Rigorous R&amp;D translating botanical intelligence into standardized formulations.</p>
            </div>

            <div class="strength-card" style="background: #ffffff; border: 1px solid var(--line); border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 12px 28px -18px rgba(31, 70, 35, 0.08);">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--panel-2); color: var(--forest); display: grid; place-items: center; margin: 0 auto 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>
              </div>
              <h4 style="font-size: 1.1rem; color: var(--forest); font-weight: 750; margin-bottom: 6px;">Natural &amp; Sustainable</h4>
              <p style="font-size: 0.88rem; color: var(--muted); line-height: 1.4;">Pure, ethically sourced plant-based ingredients with zero toxic solvents.</p>
            </div>

            <div class="strength-card" style="background: #ffffff; border: 1px solid var(--line); border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 12px 28px -18px rgba(31, 70, 35, 0.08);">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--panel-2); color: var(--forest); display: grid; place-items: center; margin: 0 auto 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h4 style="font-size: 1.1rem; color: var(--forest); font-weight: 750; margin-bottom: 6px;">Quality &amp; Safety Assured</h4>
              <p style="font-size: 0.88rem; color: var(--muted); line-height: 1.4;">Uncompromising quality standards across every formulation and packaging stage.</p>
            </div>

            <div class="strength-card" style="background: #ffffff; border: 1px solid var(--line); border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 12px 28px -18px rgba(31, 70, 35, 0.08);">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--panel-2); color: var(--forest); display: grid; place-items: center; margin: 0 auto 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h4 style="font-size: 1.1rem; color: var(--forest); font-weight: 750; margin-bottom: 6px;">Expert Team &amp; Collaborations</h4>
              <p style="font-size: 0.88rem; color: var(--muted); line-height: 1.4;">Government-recognized technology partnerships and experienced life-sciences leadership.</p>
            </div>

            <div class="strength-card" style="background: #ffffff; border: 1px solid var(--line); border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 12px 28px -18px rgba(31, 70, 35, 0.08);">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--panel-2); color: var(--forest); display: grid; place-items: center; margin: 0 auto 16px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h4 style="font-size: 1.1rem; color: var(--forest); font-weight: 750; margin-bottom: 6px;">Global Vision, Local Impact</h4>
              <p style="font-size: 0.88rem; color: var(--muted); line-height: 1.4;">Enriching daily health in India while meeting international life-sciences export demands.</p>
            </div>
          </div>
        </div>`;

html = html.replace(/<div class="values-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/, newValuesGrid + '\n      </div>\n    </section>');

// 8. NEW CHAPTER 6
if (!html.includes('id="chapter-6"')) {
  const newChapter6 = `    <!-- ======================================================================
         CHAPTER 6: THE FUTURE OF LIFE SCIENCES
         ====================================================================== -->
    <section class="about-frontier band t-green" id="chapter-6" style="background: radial-gradient(ellipse 120% 90% at 50% 20%, #17381d 0%, #0d2613 60%, #081a0d 100%); color: #f2f7ee;">
      <div class="wrap">
        <div style="text-align: center; max-width: 780px; margin: 0 auto 48px;">
          <span class="story-chapter-tag" style="color: var(--gold); border-color: rgba(231, 198, 128, 0.35);">CHAPTER 06 // THE NEXT FRONTIER</span>
          <h2 class="h2" style="color: #ffffff; margin-top: 12px;">Shaping the Future of Life Sciences</h2>
          <p class="about-lead-text" style="color: #e5ede0; max-width: 680px; margin-inline: auto;">
            Advancing genetic insights. Discovering biomarkers. Transforming futures.
          </p>
        </div>

        <div class="frontier-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
          <div class="future-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(231, 198, 128, 0.22); border-radius: 20px; padding: 28px 24px;">
            <div class="future-card-head">
              <span class="dot" style="background: var(--gold);"></span>
              <h4 style="color: #ffffff; font-size: 1.25rem;">Genetic Innovation</h4>
            </div>
            <p style="color: rgba(244, 238, 226, 0.85); font-size: 0.93rem; line-height: 1.5;">
              Decoding life at the molecular level.
            </p>
          </div>

          <div class="future-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(231, 198, 128, 0.22); border-radius: 20px; padding: 28px 24px;">
            <div class="future-card-head">
              <span class="dot" style="background: var(--gold);"></span>
              <h4 style="color: #ffffff; font-size: 1.25rem;">Biomarker Discovery</h4>
            </div>
            <p style="color: rgba(244, 238, 226, 0.85); font-size: 0.93rem; line-height: 1.5;">
              Identifying today, preventing tomorrow.
            </p>
          </div>

          <div class="future-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(231, 198, 128, 0.22); border-radius: 20px; padding: 28px 24px;">
            <div class="future-card-head">
              <span class="dot" style="background: var(--gold);"></span>
              <h4 style="color: #ffffff; font-size: 1.25rem;">AI-Powered Solutions</h4>
            </div>
            <p style="color: rgba(244, 238, 226, 0.85); font-size: 0.93rem; line-height: 1.5;">
              Intelligent technologies for precision insights.
            </p>
          </div>

          <div class="future-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(231, 198, 128, 0.22); border-radius: 20px; padding: 28px 24px;">
            <div class="future-card-head">
              <span class="dot" style="background: var(--gold);"></span>
              <h4 style="color: #ffffff; font-size: 1.25rem;">Prenatal &amp; Genetic Screening</h4>
            </div>
            <p style="color: rgba(244, 238, 226, 0.85); font-size: 0.93rem; line-height: 1.5;">
              Enabling early detection for healthier generations.
            </p>
          </div>

          <div class="future-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(231, 198, 128, 0.22); border-radius: 20px; padding: 28px 24px;">
            <div class="future-card-head">
              <span class="dot" style="background: var(--gold);"></span>
              <h4 style="color: #ffffff; font-size: 1.25rem;">Preventive Healthcare</h4>
            </div>
            <p style="color: rgba(244, 238, 226, 0.85); font-size: 0.93rem; line-height: 1.5;">
              Empowering lives through preventive and predictive care.
            </p>
          </div>
        </div>

        <div class="frontier-closing" style="margin-top: 48px; text-align: center; font-weight: 750; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); font-size: 13.5px;">
          Innovation | Integrity | Impact | Compassion
        </div>
      </div>
    </section>\n\n`;

  html = html.replace('<section class="about-cta-sec', newChapter6 + '    <section class="about-cta-sec');
}

// 9. Navigation / Dropdown cleaning for forbidden words in about.html
html = html.replace('<small>ISO 7 Cleanrooms &amp; Batch COA</small>', '<small>Cleanroom &amp; Batch Quality</small>');
html = html.replace('<small>AYUSH GMP &amp; NABL Testing</small>', '<small>Certifications &amp; Accreditations</small>');
html = html.replace('<span class="mi-sub">Regeneration & zero-plastic</span>', '<span class="mi-sub">Regenerative Ecosystems</span>');

fs.writeFileSync('about.html', html);
console.log('Successfully completed robust replacement on about.html');

