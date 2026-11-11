const fs = require('fs');
const content = fs.readFileSync('about.html', 'utf8');

const forbidden = [
  'pharmaceutical-grade', 'clinical proof', 'clinical rigor', 'clinical transparency',
  'sterile', 'tribal', 'Western Ghats', 'ISO 7', 'NABL', 'zero-plastic', 'millions',
  'sub-critical', 'supercritical', 'TN/AYU'
];

forbidden.forEach(word => {
  const regex = new RegExp(word, 'gi');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const start = Math.max(0, match.index - 40);
    const end = Math.min(content.length, match.index + match[0].length + 40);
    console.log(`[${word}] at index ${match.index}: ...${content.slice(start, end).replace(/\s+/g, ' ')}...`);
  }
});
