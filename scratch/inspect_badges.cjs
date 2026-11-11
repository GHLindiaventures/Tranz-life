const fs = require('fs');

const badges = ['fssai.png', 'make-in-india.png', 'dpiit-startup-india.png', 'msme.png', 'gem-gov.png'];
badges.forEach(b => {
  const p = 'public/assets/badges/' + b;
  const s = fs.statSync(p);
  console.log(b, (s.size / 1024).toFixed(1) + ' KB');
});

