const fs = require('fs');

// Read current about.html
let html = fs.readFileSync('about.html', 'utf8');

// --- A1. HERO ---
// Subtitle
const oldSub = `<p class="about-hero-sub">
          Born in Chennai with an uncompromising vision: to liberate the sacred healing intelligence of classical Ayurveda through pharmaceutical-grade biotechnology, certified cleanroom manufacturing, and clinical proof.
        </p>`;
const newSub = `<p class="about-hero-sub">
          Born in Chennai, TranzLife Biosciences brings together the wisdom of Ayurveda and modern science to create natural, safe and effective solutions that support health and well-being.
        </p>`;
html = html.replace(oldSub, newSub);

// Badges
const oldBadges = `<div class="about-hero-badges">
          <span class="about-tag-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            NRDC Govt. Partner
          </span>
          <span class="about-tag-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              <path d="M11 3c2 2 4.5 4 8 4"/>
              <path d="M11 3c-1.5 3-1 6 1 8"/>
            </svg>
            Western Ghats Heritage
          </span>
          <span class="about-tag-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 3a9 9 0 0 1 9 9"/>
            </svg>
            AYUSH GMP TN/AYU/24/1234
          </span>
        </div>`;

const newBadges = `<div class="about-hero-badges">
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
html = html.replace(oldBadges, newBadges);

// --- A2. CHAPTER 01 ---
const oldChap1Badge = `<div class="story-floating-badge">
              <span class="logo-em" aria-hidden="true" style="width:24px;height:24px;background-size:contain;flex-shrink:0;"></span>
              <div>
                <strong>Pristine Botanical Wildcraft</strong>
                <small>Therapeutic Vasaka, Kalmegh, Kutki, Tulsi &amp; Dill</small>
              </div>
            </div>`;
const newChap1Badge = `<div class="story-floating-badge">
              <span class="logo-em" aria-hidden="true" style="width:24px;height:24px;background-size:contain;flex-shrink:0;"></span>
              <div>
                <strong>Our Botanical Heritage</strong>
                <small>Vasaka, Kalmegh, Kutki, Tulsi &amp; Dill</small>
              </div>
            </div>`;
html = html.replace(oldChap1Badge, newChap1Badge);

const oldChap1P1 = `<p class="about-lead-text">
              For millennia, India’s classical healing texts—the Charaka Samhita and Sushruta Samhita—documented plants that rejuvenate human physiology at the deepest cellular level.
            </p>`;
const newChap1P1 = `<p class="about-lead-text">
              For thousands of years, classical Ayurvedic texts such as the Charaka Samhita and Sushruta Samhita have documented plants that support health and vitality.
            </p>`;
html = html.replace(oldChap1P1, newChap1P1);

const oldChap1P2 = `<p class="about-body-text">
              Yet in the modern world, raw herbal decoctions faced an insurmountable barrier: unstable active concentrations, harsh palatability, and poor intestinal bioavailability. Too often, the true potency of sacred plants was lost in crude powders.
            </p>`;
const newChap1P2 = `<p class="about-body-text">
              Yet in the modern world, raw herbal decoctions faced real challenges: unstable active concentrations, harsh palatability, and poor intestinal bioavailability. Too often, the true potency of sacred plants was lost in crude powders.
            </p>`;
html = html.replace(oldChap1P2, newChap1P2);

const oldChap1P3 = `<p class="about-body-text">
              TranzLife Biosciences was born to resolve this paradox. We source therapeutic-grade botanicals directly from regenerative, pesticide-free cultivators across the Western Ghats biodiversity belt and Tamil Nadu, safeguarding raw botanical purity before a single leaf enters our labs.
            </p>`;
const newChap1P3 = `<p class="about-body-text">
              TranzLife Biosciences was founded to bridge this gap. We carefully select quality botanicals and check their purity before they enter our formulation process.
            </p>`;
html = html.replace(oldChap1P3, newChap1P3);

const oldChap1Tags = `<div class="vis-mis-tags" style="margin-top:16px;">
              <span>Western Ghats Wildcraft</span>
              <span>Zero Toxic Solvents</span>
              <span>100% Plant-Derived</span>
              <span>Fair-Harvest Tribal Trade</span>
            </div>`;
const newChap1Tags = `<div class="vis-mis-tags" style="margin-top:16px;">
              <span>Natural Ingredients</span>
              <span>Ayurvedic Wisdom</span>
              <span>100% Plant-Derived</span>
              <span>Science Backed</span>
            </div>`;
html = html.replace(oldChap1Tags, newChap1Tags);

// --- A3. CHAPTER 02 ---
const oldChap2Tag = `Chapter 02 // Precision Biotechnology`;
const newChap2Tag = `Chapter 02 // Precision Science`;
html = html.replace(oldChap2Tag, newChap2Tag);

const oldChap2Badge = `<div class="story-floating-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:var(--forest);flex-shrink:0;">
                <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>
              </svg>
              <div>
                <strong>ISO 7 Analytical Cleanrooms</strong>
                <small>Sub-Critical 31°C Extraction &amp; HPLC Fingerprinting</small>
              </div>
            </div>`;
const newChap2Badge = `<div class="story-floating-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:var(--forest);flex-shrink:0;">
                <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>
              </svg>
              <div>
                <strong>Modern Formulation Science</strong>
                <small>Quality-tested at every step</small>
              </div>
            </div>`;
html = html.replace(oldChap2Badge, newChap2Badge);

const oldChap2Body = `<p class="about-body-text">
              Using supercritical CO₂ fluid extraction at gentle sub-critical temperatures (31°C), we capture volatile aromatic terpenes and heat-sensitive flavonoids without a single drop of toxic hexane or synthetic petrochemical solvents.
            </p>
            <p class="about-body-text">
              Every compound is fingerprinted on High-Performance Liquid Chromatography (HPLC) to guarantee exact milligram active dosing. We then engineer novel delivery vectors—from pocket aromatherapy inhalers that bypass digestion to transdermal lipophilic roll-ons and pectin-based gummies.
            </p>
            <div class="about-metrics-stack" style="margin-top:20px;">
              <div class="about-metric-card">
                <span class="num">31°C</span>
                <span class="label">Gentle cold supercritical extraction preserving delicate terpenes</span>
              </div>
              <div class="about-metric-card">
                <span class="num">0.00%</span>
                <span class="label">Zero residual petrochemical solvents, gelatin, or artificial additives</span>
              </div>
              <div class="about-metric-card">
                <span class="num">NABL</span>
                <span class="label">Every batch tested for heavy metals (&lt;0.01 ppm) and purity</span>
              </div>
            </div>`;

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
html = html.replace(oldChap2Body, newChap2Body);

// Add "What We Do" block right before closing </section> of chapter-2
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
        </div>
      </div>
    </section>`;

// Replace end of section #chapter-2
const chap2EndPattern = `</div>
        </div>
      </div>
    </section>`;
// Be careful to replace only the first occurrence after id="chapter-2"
const chap2Idx = html.indexOf('id="chapter-2"');
const chap2EndIdx = html.indexOf('</section>', chap2Idx);
// Let's replace the inner closing of chapter 2
const chap2Sub = html.slice(chap2Idx, chap2EndIdx + 10);
const updatedChap2Sub = chap2Sub.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/, whatWeDoBlock);
html = html.slice(0, chap2Idx) + updatedChap2Sub + html.slice(chap2EndIdx + 10);

// --- A4. CHAPTER 03 ---
// Sub intro
const oldChap3Sub = `<p class="sub">
            True biotechnology is not measured in marketing claims, but in government technology transfer, institutional peer-review, and international bilateral partnerships.
          </p>`;
const newChap3Sub = `<p class="sub">
            Our work is shaped through collaboration with government institutions and engagement with international partners.
          </p>`;
html = html.replace(oldChap3Sub, newChap3Sub);

// Photo caption
const oldPrestigeCap = `<p class="prestige-caption">
                TranzLife leadership formalizing technology partnerships with National Research Development Corporation (NRDC), Ministry of Science &amp; Technology, Govt. of India, alongside international diplomatic trade delegations.
              </p>`;
const newPrestigeCap = `<p class="prestige-caption">
                TranzLife leadership with the National Research Development Corporation (NRDC), Ministry of Science &amp; Technology, Govt. of India, and international delegations.
              </p>`;
html = html.replace(oldPrestigeCap, newPrestigeCap);

// Card eyebrow & title
const oldCardEyebrow = `<p class="eyebrow" style="color:var(--gold);">National Technology Milestone</p>
              <h3 style="font-size:clamp(1.6rem,3vw,2.2rem);color:#fcfaf4;line-height:1.2;margin:10px 0 16px;">
                Technology Transfer Under the Ministry of Science &amp; Technology
              </h3>`;
const newCardEyebrow = `<p class="eyebrow" style="color:var(--gold);">NATIONAL TECHNOLOGY COLLABORATION</p>
              <h3 style="font-size:clamp(1.6rem,3vw,2.2rem);color:#fcfaf4;line-height:1.2;margin:10px 0 16px;">
                Technology Collaboration with NRDC
              </h3>`;
html = html.replace(oldCardEyebrow, newCardEyebrow);

// Card paragraphs
const oldCardP = `<p style="font-size:14.5px;color:rgba(244,238,226,0.85);line-height:1.6;margin-bottom:14px;">
                TranzLife Biosciences has achieved a historic milestone through formal technology collaboration with the <strong>National Research Development Corporation (NRDC)</strong>, an enterprise of the Department of Scientific &amp; Industrial Research (DSIR), <strong>Ministry of Science and Technology, Government of India</strong>.
              </p>
              <p style="font-size:14.5px;color:rgba(244,238,226,0.85);line-height:1.6;margin-bottom:20px;">
                This landmark initiative bridges government-validated bio-innovations into scalable, clinically standardized formulations serving domestic healthcare and international export markets.
              </p>`;
const newCardP = `<!-- CONFIRM: nature of the NRDC agreement -->
              <p style="font-size:14.5px;color:rgba(244,238,226,0.85);line-height:1.6;margin-bottom:14px;">
                TranzLife Biosciences has entered into a technology collaboration with the National Research Development Corporation (NRDC), an enterprise of the Department of Scientific &amp; Industrial Research (DSIR), Ministry of Science and Technology, Government of India.
              </p>
              <p style="font-size:14.5px;color:rgba(244,238,226,0.85);line-height:1.6;margin-bottom:20px;">
                This collaboration supports our aim of turning validated bio-innovations into standardized formulations for domestic and international markets.
              </p>`;
html = html.replace(oldCardP, newCardP);

// Remove stray TN/AYU chip
const oldPrestigeChip = `<div class="prestige-chip" style="height: 38px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  TN/AYU/24/1234
                </div>`;
html = html.replace(oldPrestigeChip, '');

// Add milestones timeline block inside prestige-showcase before closing </div></div> of Chapter 3
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
          </div>
        </div>
      </div>
    </section>`;

const chap3Idx = html.indexOf('id="chapter-3"');
const chap3EndIdx = html.indexOf('</section>', chap3Idx);
const chap3Sub = html.slice(chap3Idx, chap3EndIdx + 10);
const updatedChap3Sub = chap3Sub.replace(/<\/div>\s*<\/div>\s*<\/section>/, milestonesBlock);
html = html.slice(0, chap3Idx) + updatedChap3Sub + html.slice(chap3EndIdx + 10);

// --- A5. CHAPTER 04 ---
const oldChap4Lead = `<p class="about-body-text" style="color:rgba(244,238,226,0.85);">
              Beyond our commercial formulations, our life-sciences team is actively pioneering research in high-need health challenges where modern synthetic molecules have reached therapeutic limits:
            </p>`;
const newChap4Lead = `<p class="about-body-text" style="color:rgba(244,238,226,0.85);">
              Beyond our commercial formulations, our team is exploring research areas where natural compounds may offer new possibilities:
            </p>`;
html = html.replace(oldChap4Lead, newChap4Lead);

// Card 1
const oldCard1 = `<div class="future-card" style="background:rgba(255,255,255,0.06);border-color:rgba(231,198,128,0.25);">
                <div class="future-card-head">
                  <span class="dot" style="background:var(--gold);"></span>
                  <h4 style="color:#ffffff;">Autism Spectrum Disorder (ASD) Program</h4>
                </div>
                <p style="color:rgba(244,238,226,0.8);">
                  Investigating neuro-phytoactives from <em>Bacopa monnieri</em> and <em>Curcuma caesia</em> (Black Turmeric) to modulate synaptic plasticity, reduce neuro-inflammation, and support cognitive calm.
                </p>
              </div>`;
const newCard1 = `<div class="future-card" style="background:rgba(255,255,255,0.06);border-color:rgba(231,198,128,0.25);">
                <div class="future-card-head">
                  <span class="dot" style="background:var(--gold);"></span>
                  <h4 style="color:#ffffff;">Autism Spectrum Disorder (ASD) Research</h4>
                </div>
                <p style="color:rgba(244,238,226,0.8);">
                  Early-stage research into Bacopa monnieri, Juglans regia and Curcuma caesia as potential bioactive components.
                </p>
              </div>`;
html = html.replace(oldCard1, newCard1);

// Card 2
const oldCard2 = `<div class="future-card" style="background:rgba(255,255,255,0.06);border-color:rgba(231,198,128,0.25);">
                <div class="future-card-head">
                  <span class="dot" style="background:var(--gold);"></span>
                  <h4 style="color:#ffffff;">Preventive Oncology &amp; Cellular Defense</h4>
                </div>
                <p style="color:rgba(244,238,226,0.8);">
                  Isolating cytotoxic Annonaceous acetogenins (ACGs) from <em>Annona muricata</em> (Graviola / Soursop) exploring selective mitochondrial ATP inhibition in abnormal cell proliferation.
                </p>
              </div>`;
const newCard2 = `<div class="future-card" style="background:rgba(255,255,255,0.06);border-color:rgba(231,198,128,0.25);">
                <div class="future-card-head">
                  <span class="dot" style="background:var(--gold);"></span>
                  <h4 style="color:#ffffff;">Oncology Research</h4>
                </div>
                <p style="color:rgba(244,238,226,0.8);">
                  Early-stage research into Annona muricata as a potential bioactive component.
                </p>
              </div>`;
html = html.replace(oldCard2, newCard2);

// Card 3
const oldCard3 = `<div class="future-card" style="background:rgba(255,255,255,0.06);border-color:rgba(231,198,128,0.25);">
                <div class="future-card-head">
                  <span class="dot" style="background:var(--gold);"></span>
                  <h4 style="color:#ffffff;">AI-Powered Phytochemical Synergy Mapping</h4>
                </div>
                <p style="color:rgba(244,238,226,0.8);">
                  Computational bio-modeling of multi-herb interactions to eliminate metabolic contraindications and optimize human cellular absorption curves.
                </p>
              </div>`;
const newCard3 = `<div class="future-card" style="background:rgba(255,255,255,0.06);border-color:rgba(231,198,128,0.25);">
                <div class="future-card-head">
                  <span class="dot" style="background:var(--gold);"></span>
                  <h4 style="color:#ffffff;">AI-Powered Phytochemical Research</h4>
                </div>
                <p style="color:rgba(244,238,226,0.8);">
                  Using computational modelling to study how herbal ingredients interact, to help design safer and more effective formulations.
                </p>
              </div>`;
html = html.replace(oldCard3, newCard3);

// Disclaimer under cards
const disclaimerBlock = `</div>
            <p class="about-disclaimer" style="margin-top:20px;font-size:12.5px;color:rgba(244,238,226,0.75);font-style:italic;line-height:1.5;">
              These are research programmes. No TranzLife product is intended to diagnose, treat, cure or prevent any disease.
            </p>`;
html = html.replace(newCard3 + '\n            </div>', newCard3 + '\n            ' + disclaimerBlock);

// --- A6. CHAPTER 05 ---
// Intro
const oldChap5Intro = `<p class="sub">
            The enduring ethical commitments that govern our research pipelines, tribal partnerships, clinical rigor, and customer trust.
          </p>`;
const newChap5Intro = `<p class="sub">
            The commitments that guide our research, our products and the trust our customers place in us.
          </p>`;
html = html.replace(oldChap5Intro, newChap5Intro);

// Vision
const oldVision = `<h3>To Become a Globally Trusted Leader</h3>
            <p>
              To become a globally recognized leader in life sciences by transforming natural botanical resources into sustainable, evidence-backed technologies that enhance human vitality across generations.
            </p>`;
const newVision = `<h3>To Be a Globally Trusted Leader</h3>
            <p>
              To be a globally trusted leader in life sciences, transforming natural resources and innovative science into safe, effective and sustainable solutions that enhance health and enrich lives.
            </p>`;
html = html.replace(oldVision, newVision);

// Mission
const oldMission = `<h3>Purity, Science &amp; Measurable Efficacy</h3>
            <p>
              To formulate and manufacture scientifically validated wellness products that elevate daily quality of life while upholding the absolute highest standards of purity, clinical ethics, and environmental stewardship.
            </p>`;
const newMission = `<h3>Science, Quality &amp; Responsibility</h3>
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
html = html.replace(oldMission, newMission);

// Values: 01 Innovation, 02 Integrity, 03 Quality, 04 Sustainability, 05 Well-being
const oldValuesGrid = `<div class="values-grid">
          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 01</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg></div>
            </div>
            <h4>Innovation</h4>
            <p>Advancing botanical extraction technologies to solve critical human healthcare challenges.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 02</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div>
            </div>
            <h4>Quality</h4>
            <p>Pharmaceutical-grade precision in every formulation, from seed selection to sterile packaging.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 03</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
            </div>
            <h4>Integrity</h4>
            <p>Operating with full clinical transparency, open batch certificates of analysis, and ethical sourcing.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 04</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>
            </div>
            <h4>Sustainability</h4>
            <p>Regenerative organic harvesting and zero-plastic biodegradable packaging that honors the Earth.</p>
          </div>

          <div class="value-card">
            <div class="value-card-top">
              <span class="value-num">VALUE // 05</span>
              <div class="value-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>
            </div>
            <h4>Well-being</h4>
            <p>Empowering millions to live with vibrant daily energy, uncompromised longevity, and deep peace of mind.</p>
          </div>
        </div>`;

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

html = html.replace(oldValuesGrid, newValuesGrid);

// --- A7. NEW CHAPTER 06 ---
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
    </section>

`;

// Insert Chapter 6 between #chapter-5 and #cta
const ctaComment = '<!-- ======================================================================\n         SECTION 6: CALL TO ACTION';
if (html.includes(ctaComment)) {
  html = html.replace(ctaComment, newChapter6 + '    ' + ctaComment);
} else {
  // Try finding <section class="about-cta-sec
  html = html.replace('<section class="about-cta-sec', newChapter6 + '    <section class="about-cta-sec');
}

// Clean any leftover dropdown or menu subtitles containing forbidden words in about.html only
html = html.replace('<small>ISO 7 Cleanrooms &amp; Batch COA</small>', '<small>Cleanroom &amp; Batch Quality</small>');
html = html.replace('<small>AYUSH GMP &amp; NABL Testing</small>', '<small>Certifications &amp; Accreditations</small>');
html = html.replace('<span class="mi-sub">Regeneration & zero-plastic</span>', '<span class="mi-sub">Regenerative Ecosystems</span>');

fs.writeFileSync('about.html', html);
console.log('Successfully updated about.html with Part A copy overhaul!');

