const fs = require('fs');
const path = require('path');

function clamp(v, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }

function oklch_to_srgb_hex(L, C, h_deg) {
  const h = (h_deg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  l_ = l_ * l_ * l_;
  m_ = m_ * m_ * m_;
  s_ = s_ * s_ * s_;

  let r = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  let bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  function lin_to_srgb(u) {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    if (u <= 0.0031308) return 12.92 * u;
    return 1.055 * Math.pow(u, 1 / 2.4) - 0.055;
  }

  r = lin_to_srgb(r);
  g = lin_to_srgb(g);
  bl = lin_to_srgb(bl);

  r = clamp(r); g = clamp(g); bl = clamp(bl);

  const R = Math.round(r * 255);
  const G = Math.round(g * 255);
  const B = Math.round(bl * 255);

  const hex = '#' + [R, G, B].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  return hex;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /oklch\(\s*([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s*\)/gi;
  const matches = [...content.matchAll(regex)];
  if (matches.length === 0) {
    console.log('No oklch(...) occurrences found in', filePath);
    return;
  }

  const mappings = [];
  const newContent = content.replace(regex, (full, Ls, Cs, hs) => {
    const L = parseFloat(Ls);
    const C = parseFloat(Cs);
    const h = parseFloat(hs);
    const hex = oklch_to_srgb_hex(L, C, h);
    mappings.push({ from: full, to: hex, L, C, h });
    return hex;
  });

  fs.copyFileSync(filePath, filePath + '.bak');
  fs.writeFileSync(filePath, newContent, 'utf8');

  console.log('Replaced', mappings.length, 'oklch(...) occurrences:');
  mappings.forEach(m => console.log(`${m.from} -> ${m.to}`));
}

const target = path.join(__dirname, '..', 'src', 'styles', 'theme.css');
if (!fs.existsSync(target)) {
  console.error('Target file not found:', target);
  process.exit(1);
}

processFile(target);
console.log('Done. Backup saved as theme.css.bak');
