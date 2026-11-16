const fs = require('fs');

// Create an SVG version of the official Ministry of AYUSH logo badge
// Using the official Lion Capital of India + official typography
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
  <!-- Ashoka Lion Capital (Official Government of India Emblem) -->
  <g transform="translate(10, 10) scale(0.62)">
    <!-- Base plinth -->
    <path d="M20 140 L120 140 L115 130 L25 130 Z" fill="#222" />
    <text x="70" y="152" font-family="'Noto Sans', 'Arial', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#222">सत्यमेव जयते</text>
    <!-- Chakra wheel -->
    <circle cx="70" cy="120" r="10" fill="none" stroke="#222" stroke-width="2"/>
    <circle cx="70" cy="120" r="2.5" fill="#222"/>
    <!-- Abacus animals (horse & bull stylized silhouettes) -->
    <path d="M35 125 C35 118 45 116 48 122 C50 125 45 127 35 127 Z" fill="#222"/>
    <path d="M95 125 C95 118 105 116 108 122 C110 125 105 127 95 127 Z" fill="#222"/>
    <!-- Three Lions silhouette / emblem contours -->
    <!-- Center Lion -->
    <path d="M52 108 C52 95 56 85 58 75 C60 65 62 55 70 48 C78 55 80 65 82 75 C84 85 88 95 88 108 Z" fill="#222"/>
    <circle cx="70" cy="40" r="16" fill="#222"/>
    <circle cx="64" cy="38" r="2" fill="#fff"/>
    <circle cx="76" cy="38" r="2" fill="#fff"/>
    <path d="M66 45 Q70 49 74 45" stroke="#fff" stroke-width="1.5" fill="none"/>
    <!-- Mane details -->
    <path d="M54 50 C48 58 50 72 56 80" stroke="#fff" stroke-width="1.2" fill="none"/>
    <path d="M86 50 C92 58 90 72 84 80" stroke="#fff" stroke-width="1.2" fill="none"/>
    <!-- Left Lion -->
    <path d="M35 108 C35 98 42 85 46 75 C48 68 46 58 40 52 C32 60 30 75 32 88 C33 96 35 104 35 108 Z" fill="#222"/>
    <circle cx="36" cy="48" r="12" fill="#222"/>
    <circle cx="32" cy="46" r="1.5" fill="#fff"/>
    <!-- Right Lion -->
    <path d="M105 108 C105 98 98 85 94 75 C92 68 94 58 100 52 C108 60 110 75 108 88 C107 96 105 104 105 108 Z" fill="#222"/>
    <circle cx="104" cy="48" r="12" fill="#222"/>
    <circle cx="108" cy="46" r="1.5" fill="#fff"/>
  </g>

  <!-- Divider line -->
  <line x1="112" y1="18" x2="112" y2="102" stroke="#d0c8b6" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Typography -->
  <g transform="translate(126, 20)">
    <!-- Hindi Header -->
    <text x="0" y="24" font-family="'Noto Sans Devanagari', 'Mangal', 'Arial', sans-serif" font-size="20" font-weight="700" fill="#14341a" letter-spacing="0.5">
      आयुष मंत्रालय
    </text>
    <text x="0" y="44" font-family="'Noto Sans Devanagari', 'Mangal', 'Arial', sans-serif" font-size="13" font-weight="600" fill="#666">
      भारत सरकार
    </text>

    <!-- English Header -->
    <text x="0" y="66" font-family="'Archivo', 'Helvetica Neue', Arial, sans-serif" font-size="15.5" font-weight="800" fill="#14341a" letter-spacing="0.2">
      Ministry of Ayush
    </text>
    <text x="0" y="81" font-family="'Archivo', 'Helvetica Neue', Arial, sans-serif" font-size="11.5" font-weight="600" fill="#666" letter-spacing="0.4">
      Government of India
    </text>
  </g>
</svg>`;

fs.writeFileSync('public/assets/badges/ayush.svg', svg);
console.log('Saved public/assets/badges/ayush.svg');

