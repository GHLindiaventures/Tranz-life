// Draws a QR code as an inline SVG (a single path, crisp at any size).
import qrcode from 'qrcode-generator';

function qrSvg(text, label){
  const qr = qrcode(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), q = 4, size = n + q * 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}

export { qrSvg };
