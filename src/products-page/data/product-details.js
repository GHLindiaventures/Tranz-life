// Full product write-ups: the Products page showcase and each product page (product-details.html).
// From the client's "Tranzlife Biosciences Products.pdf" (Nov 2026): product introduction, key benefits, ingredients,
// how to use, how it works and pack details. Wellness wording only: the disease claims printed on some packs (blood
// sugar, detox, lung function, cramp relief) are left out, and no product is said to treat, cure or prevent anything.
const BRAND = {
  name: 'TranzLife Biosciences',
  tagline: 'Innovating Life Beyond Limits.',
  line: 'Where Natural Intelligence Meets Scientific Innovation.'
};

const DETAILS = {
  gummies: {
    eyebrow: 'Respiratory Wellness · PulmoClear™ Gummies',
    title: 'TranzLife Lung Booster Gummies',
    tagline: 'Breathe Well. Live Better. Embrace Every Breath.',
    intro: [
      'TranzLife PulmoClear Gummies are a botanical-based wellness supplement that combines traditional Ayurvedic herbs with essential vitamins and minerals, designed to support respiratory wellness and everyday health.',
      'Traditional Ayurvedic botanicals and Vitamin C, Vitamin D3 and Zinc come together to provide nutritional and botanical support for everyday respiratory wellness, in a natural berry-flavoured gummy.'
    ],
    listTitle: 'Botanicals and nutrients in every gummy',
    list: [
      ['Tulsi', 'A traditional Indian botanical valued in herbal wellness practices.'],
      ['Vasaka', 'A botanical traditionally used in Ayurvedic respiratory preparations.'],
      ['Sukku (Dry Ginger)', 'A familiar botanical used in traditional wellness formulations.'],
      ['Thippili (Long Pepper)', 'A traditional spice valued in Ayurvedic herbal preparations.'],
      ['Karumanjal (Black Turmeric)', 'A distinctive botanical included in the formulation.'],
      ['Licorice Root', 'A botanical used in traditional herbal preparations.'],
      ['Jeera, Black Pepper & Small Onion Extract', 'Traditional kitchen botanicals that complete the blend.'],
      ['Vitamin C, Vitamin D3 & Zinc', 'Added essential vitamins and minerals.']
    ],
    highlightsTitle: 'Why choose Lung Booster Gummies?',
    highlights: [
      ['Respiratory wellness', 'Designed to support respiratory wellness and everyday health.'],
      ['Antioxidant support', 'Botanicals and Vitamin C that provide antioxidant support.'],
      ['Natural immune function', 'With Vitamin C, Vitamin D3 and Zinc to support natural immune function.'],
      ['Ayurveda meets nutrition', 'Traditional Ayurvedic botanicals combined with selected nutrients.'],
      ['Easy to take', 'A natural berry-flavoured gummy, 60 per pack, for everyday wellness routines.']
    ],
    note: 'Follow the serving size and frequency on the approved product pack. Do not exceed the recommended daily intake. A wellness supplement, not a substitute for medical care. Consult a healthcare professional if you have a respiratory condition or take regular medication.'
  },

  inhaler: {
    eyebrow: 'Aromatherapy · Smoke-Free Support',
    title: 'TranzLife BreatheFree Aromatherapy Inhaler',
    tagline: 'Pause. Breathe. Relax. Rediscover Your Balance.',
    intro: [
      'TranzLife BreatheFree is an essential oil-based aromatherapy inhaler designed to support you on your journey towards a smoke-free lifestyle, with a convenient aromatic experience that promotes relaxation, freshness and breathing comfort.',
      'Its blend of six essential oils provides an aromatic inhalation experience, intended to promote relaxation, help manage cravings and support breathing comfort, whenever and wherever you need it.'
    ],
    listTitle: 'Six essential oils',
    list: [
      ['Peppermint Oil', 'A cool, fresh aroma.'],
      ['Eucalyptus Oil', 'A clear, refreshing vapour.'],
      ['Lavender Oil', 'A soft floral aroma linked with relaxation.'],
      ['Lemon Oil', 'A bright, citrus freshness.'],
      ['Black Pepper Oil', 'A warm, spicy note.'],
      ['Tulsi Oil', 'Holy basil, a traditional Indian botanical.']
    ],
    highlightsTitle: 'Why choose BreatheFree?',
    highlights: [
      ['Helps manage cravings', 'Reach for a slow, aromatic breath when the urge to smoke comes.'],
      ['Relaxation & balance', 'Promotes relaxation and emotional balance, and helps manage stress and irritability.'],
      ['A refreshing breath', 'Supports a refreshing breathing experience.'],
      ['Smoke-free support', 'Convenient support during your smoking-cessation efforts; marketed as a non-addictive formulation.'],
      ['Pocket-sized & discreet', 'Easy to carry while travelling or working, and simple to use whenever needed.']
    ],
    closingTitle: 'How to use',
    closing: 'Gently remove the protective cap, place the inhaler near each nostril and take slow, deep breaths. Repeat whenever you experience cravings or feel stressed.',
    note: 'For inhalation only. Use according to the product directions. An aromatherapy product, not a medicine or nicotine replacement; individual experiences with aromas may differ. Keep out of reach of children.'
  },

  rollon: {
    eyebrow: 'Women’s Menstrual Comfort · Plant-Based Roll-On',
    title: 'TranzLife CycleRelief Roll-On',
    tagline: 'Embrace Every Cycle. Celebrate Every You.',
    intro: [
      'TranzLife CycleRelief is a plant-based topical roll-on designed for menstrual comfort and personal care, a convenient application for a soothing self-care and relaxation routine during the menstrual cycle.',
      'Applied with a gentle massage, its essential oil blend provides a topical, aromatherapy-inspired self-care experience to complement relaxation and personal comfort routines.'
    ],
    highlightsTitle: 'Designed with women in mind',
    highlights: [
      ['Menstrual comfort routines', 'Designed to support your comfort routine during the menstrual cycle.'],
      ['Soothing application', 'A soothing topical application with a comforting massage.'],
      ['Relaxation & comfort', 'Supports relaxation and personal comfort.'],
      ['Easy and non-greasy', 'An easy-to-apply, non-greasy roll-on in a compact 8 ml pack you can carry anywhere.']
    ],
    listTitle: 'Ingredients (as on the pack)',
    list: [
      ['Wintergreen Oil', 'Essential oil'],
      ['Peppermint Oil', 'Essential oil'],
      ['Ginger Essential Oil', 'Essential oil'],
      ['Lavender Essential Oil', 'Essential oil'],
      ['Eucalyptus Oil', 'Essential oil'],
      ['Sesame Oil', 'Carrier oil']
    ],
    closingTitle: 'How to use',
    closing: 'Do a patch test before first use. Roll onto the lower abdomen, lower back or inner wrists and massage gently until absorbed. Reapply 2–4 times a day, or as needed, during the menstrual cycle.',
    note: 'For external use only. Avoid contact with eyes, mucous membranes and broken or irritated skin. Do not use on children. Stop using it if irritation occurs. Keep out of reach of children. Consult a healthcare professional if your symptoms are severe, unusual or persistent.'
  },

  reviva: {
    eyebrow: 'Botanical Massage Roll-On · Daily Self-Care',
    title: 'TranzLife Reviva Roll-On',
    tagline: 'Balance. Restore. Revitalize.',
    intro: [
      'TranzLife Reviva is a botanical-inspired massage roll-on designed for external application as part of a daily personal-care and wellness routine. It contains Dill and Eucalyptus essential oils in a convenient 50 ml roll-on.',
      'Reviva is applied through gentle massage: its essential oil blend gives a refreshing topical experience as part of a daily personal-care routine.'
    ],
    highlightsTitle: 'Why choose Reviva?',
    highlights: [
      ['Refreshing application', 'Provides a refreshing topical application.'],
      ['Daily self-care', 'Supports a simple daily self-care routine.'],
      ['Easy massage', 'A convenient massage roll-on, with no complicated preparation.'],
      ['Portable 50 ml roll-on', 'Travel-friendly, for easy and direct application.']
    ],
    listTitle: 'Ingredients',
    list: [
      ['Dill Essential Oil', 'Essential oil'],
      ['Eucalyptus Essential Oil', 'Essential oil']
    ],
    closingTitle: 'How to use',
    closing: 'Roll gently around the belly button every morning on an empty stomach, apply to intact skin and massage gently. Use daily as directed on the pack, and wash your hands after use.',
    note: 'For external use only. Do not apply to wounds or irritated skin, and avoid the eyes. A personal-care product: it does not replace any medicine or medical advice. Keep out of reach of children. ISO 9001:2015 and GMP certified.'
  },

  liver: {
    eyebrow: 'Polyherbal Concoction · Liver Wellness',
    title: 'TranzLife Liver Booster',
    tagline: 'Nourish Your Wellness. Support Your Liver. Embrace a Healthier Lifestyle.',
    intro: [
      'TranzLife Liver Booster is a botanical-based wellness product formulated with traditional herbal ingredients, designed to support normal liver function, digestive wellness and overall well-being.',
      'Liver Booster combines eleven traditional botanicals associated with liver and digestive wellness, positioned to provide botanical and antioxidant support for normal liver function and metabolic processes.'
    ],
    highlightsTitle: 'Our approach to liver wellness',
    highlights: [
      ['Normal liver function', 'Designed to support normal liver function.'],
      ['Antioxidant support', 'Botanicals such as Amla, Haritaki and Turmeric provide antioxidant support.'],
      ['Digestion & appetite', 'Supports digestive health, appetite and natural metabolic processes.'],
      ['Traditional botanicals', 'A blend of eleven traditional Ayurvedic botanicals for everyday wellness support.']
    ],
    listTitle: 'Composition per 10 ml',
    list: [
      ['Bhumyamalaki (Phyllanthus niruri)', '500 mg'],
      ['Kalmegh (Andrographis paniculata)', '400 mg'],
      ['Kutki (Picrorhiza kurroa)', '400 mg'],
      ['Punarnava (Boerhaavia diffusa)', '300 mg'],
      ['Bhringraj (Eclipta alba)', '300 mg'],
      ['Daruharidra (Berberis aristata)', '200 mg'],
      ['Guduchi (Tinospora cordifolia)', '200 mg'],
      ['Amla, Haritaki, Turmeric & Black Pepper', '200, 200, 150 & 50 mg']
    ],
    closingTitle: 'Making liver health a priority',
    closing: 'Liver health begins with everyday habits: a balanced diet, regular physical activity, limiting alcohol, maintaining a healthy weight and following medical advice about medicines.',
    note: 'Adults: 10 ml (2 teaspoons) twice daily after meals, with a measuring cup. Shake well before use and refrigerate after opening. Not recommended for pregnant or lactating women. Consult your physician if you are under medication. Not a replacement for medical assessment or prescribed treatment.'
  },

  energy: {
    eyebrow: 'Herbal & Bioactive Wellness Formulation',
    title: 'TranzLife Energy Booster',
    tagline: 'Natural Wellness Formulation. Nature, Science, Wellness.',
    intro: [
      'TranzLife Energy Booster is a herbal and bioactive oral liquid formulation designed to complement an active lifestyle and support everyday energy, stamina and overall wellness.',
      'It combines selected botanical and mineral-origin ingredients in an oral liquid, designed to complement daily energy, activity and general wellness.'
    ],
    highlightsTitle: 'Designed for active days',
    highlights: [
      ['Energy & stamina', 'Supports everyday energy and stamina.'],
      ['Vitality & well-being', 'Promotes overall vitality and well-being.'],
      ['Hormonal & immune wellness', 'Supports hormonal wellness and healthy immune function.'],
      ['An active lifestyle', 'Designed to complement an active lifestyle and daily wellness routines.'],
      ['Easy to measure', 'A 500 ml oral liquid with a measuring device in the pack.']
    ],
    listTitle: 'Key ingredients',
    list: [
      ['Ruta graveolens (Q)', 'Botanical ingredient'],
      ['Hecla lava (3X)', 'Mineral-origin ingredient'],
      ['Symphytum officinale (Q)', 'Botanical ingredient'],
      ['Calcarea phosphorica (8X)', 'Mineral-origin ingredient'],
      ['Echinacea angustifolia (Q)', 'Botanical ingredient']
    ],
    closingTitle: 'How to use',
    closing: 'Suggested dosage: 7.5 ml twice daily, or as recommended by a healthcare professional. Use the measuring device supplied with the pack and follow the approved product label.',
    note: 'Use only as directed and do not exceed the recommended serving. Consult a qualified healthcare professional before use if pregnant, breastfeeding, taking medication or managing a health condition. Keep out of reach of children.'
  }
};

export { DETAILS, BRAND };
