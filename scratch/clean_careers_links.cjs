const fs = require('fs');

['privacy.html', 'terms.html'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\r?\n\s*<a href="careers\.html">Careers<\/a>/g, '');
  fs.writeFileSync(f, c, 'utf8');
  console.log(`Cleaned ${f}`);
});
