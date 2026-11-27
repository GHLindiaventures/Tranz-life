// The client's product imagery: a square product shot, a cut-out and the full design board for each product.
import gummies from '../../assets/products/gummies.webp';
import gummiesDesign from '../../assets/products/TranzLife Lung Booster Gummies Label.png';
import inhaler from '../../assets/products/inhaler.webp';
import inhalerDesign from '../../assets/products/TranzLife BreatheFree Packaging Design.png';
import rollon from '../../assets/products/rollon.webp';
import rollonDesign from '../../assets/products/TranzLife Calm Roll-On Packaging.png';
import reviva from '../../assets/products/reviva.webp';
import revivaDesign from '../../assets/products/reviva.png';
import liver from '../../assets/products/liver.webp';
import liverDesign from '../../assets/products/TranzLife Liver Booster Packaging Set.png';
import energy from '../../assets/products/energy.webp';
import energyDesign from '../../assets/products/energy-pack.webp';

import gummiesCut from '../../assets/products/gummies-cut.webp';
import inhalerCut from '../../assets/products/inhaler-cut.webp';
import rollonCut from '../../assets/products/rollon-cut.png';
import revivaCut from '../../assets/products/reviva-cut.png';
import liverCut from '../../assets/products/liver-cut.webp';
import energyCut from '../../assets/products/energy-cut.webp';   // scripts/make-energy-assets.py

const SHOTS = { gummies, inhaler, rollon, reviva, liver, energy };
// the same products cut out of their designs (transparent), for the hero and the product story
const CUTS = { gummies:gummiesCut, inhaler:inhalerCut, rollon:rollonCut, reviva:revivaCut, liver:liverCut, energy:energyCut };
const DESIGNS = { gummies:gummiesDesign, inhaler:inhalerDesign, rollon:rollonDesign, reviva:revivaDesign, liver:liverDesign, energy:energyDesign };

export { SHOTS, CUTS, DESIGNS };
