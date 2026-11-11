const https = require('https');
https.get('https://seeklogo.com/vector-logo/439775/ayush-logo', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const m = html.match(/<meta property="og:image" content="([^"]+)"/i);
    console.log(m ? m[1] : 'no og:image');
  });
}).on('error', err => console.log(err));

