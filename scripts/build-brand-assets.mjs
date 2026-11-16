// Génère l'identité visuelle Flexarion (logo, favicon, icônes, image de partage)
// en SVG vectoriel pur, avec le texte converti en tracés à partir des polices
// du site (Fraunces + IBM Plex Mono). Aucune image générée par IA.
//
// Usage : npm run brand:build
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { create } from "fontkitten";

const root = process.cwd();
const pub = (p) => path.join(root, "public", p);
const font = (pkg, file) => create(fs.readFileSync(path.join(root, "node_modules", pkg, "files", file)));

const serif = font("@fontsource-variable/fraunces", "fraunces-latin-wght-normal.woff2");
const mono = font("@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-600-normal.woff2");

const C = {
  paper: "#F5F0E6",
  stone: "#EBE3D3",
  ink: "#121917",
  pine: "#155E44",
  pineLight: "#3E9B74",
  ochre: "#A95A22",
  sun: "#D08A3C",
};

// Convertit une chaîne en un <path> SVG (sans crénage, avec interlettrage).
function textPath(f, text, { x, y, size, tracking = 0, fill }) {
  const scale = size / f.unitsPerEm;
  let cursor = 0;
  const parts = [];
  for (const ch of text) {
    const g = f.glyphForCodePoint(ch.codePointAt(0));
    const d = g.path.toSVG();
    if (d) parts.push(`<path transform="translate(${(x + cursor).toFixed(2)} ${y}) scale(${scale} ${-scale})" d="${d}"/>`);
    cursor += g.advanceWidth * scale + tracking;
  }
  return { svg: `<g fill="${fill}">${parts.join("")}</g>`, width: cursor - tracking };
}

// Emblème 64×64 : soleil provençal, orbite, crête de la Sainte-Victoire
// et arches de l'aqueduc de Roquefavour.
function emblem({ bg = C.ink, mountain = C.paper, framed = true } = {}) {
  // Arches de l'aqueduc : ouvertures en plein cintre découpées dans le tablier.
  const arches = [9, 18.5, 28, 37.5, 47]
    .map((x) => `M${x} 58 V53.5 A3.5 3.5 0 0 1 ${x + 7} 53.5 V58 Z`)
    .join(" ");
  return `
  ${framed ? `<rect width="64" height="64" rx="6" fill="${bg}"/>` : ""}
  <g transform="translate(45 19) rotate(-18)">
    <ellipse rx="16" ry="4.6" fill="none" stroke="${C.sun}" stroke-width="1.4"/>
  </g>
  <circle cx="45" cy="19" r="8.5" fill="${C.sun}"/>
  <g transform="translate(45 19) rotate(-18)">
    <path d="M-16 0 A16 4.6 0 0 0 16 0" fill="none" stroke="${C.sun}" stroke-width="1.4"/>
  </g>
  <path d="M5 46 L12 40 L18 38.5 L25 27 L28.5 22 L30.5 24.5 L33 23.5 L40 30 L48 34.5 L59 40 V46 Z" fill="${mountain}"/>
  <path fill-rule="evenodd" d="M5 46 H59 V58 H5 Z ${arches}" fill="${C.pineLight}"/>`;
}

function write(file, content) {
  fs.writeFileSync(pub(file), content.trim() + "\n");
  console.log("✓", file);
}

// 1. Favicon
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Flexarion">${emblem()}</svg>`;
write("favicon.svg", faviconSvg);

// 2. Logo horizontal (fond transparent, pour fond clair)
const word = textPath(serif, "FLEXARION", { x: 78, y: 41, size: 34, tracking: 2.2, fill: C.ink });
const sub = textPath(mono, "STUDIO · AIX-EN-PROVENCE", { x: 79, y: 60, size: 10.5, tracking: 1.6, fill: C.pine });
const logoW = Math.ceil(Math.max(78 + word.width, 79 + sub.width) + 6);
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${logoW} 68" width="${logoW}" height="68" role="img" aria-label="Flexarion Studio, Aix-en-Provence">
  <g transform="translate(2 2)">${emblem()}</g>
  ${word.svg}
  ${sub.svg}
</svg>`;
write("images/flexarion-logo.svg", logoSvg);

// 3. Image de partage par défaut (Open Graph 1200×630)
const ogTitle = textPath(serif, "FLEXARION", { x: 96, y: 330, size: 112, tracking: 7, fill: C.ink });
const ogLine1 = textPath(mono, "STUDIO DE JEUX VIDÉO DE SCIENCE-FICTION", { x: 100, y: 400, size: 24, tracking: 2, fill: C.pine });
const ogLine2 = textPath(mono, "AIX-EN-PROVENCE · VERIDIA 2140", { x: 100, y: 440, size: 24, tracking: 2, fill: C.ochre });
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${C.paper}"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${C.ink}" stroke-opacity="0.34" stroke-width="2"/>
  <line x1="100" y1="370" x2="${100 + ogTitle.width}" y2="370" stroke="${C.ink}" stroke-opacity="0.16" stroke-width="2"/>
  <g transform="translate(980 78) scale(2.5)">${emblem()}</g>
  ${ogTitle.svg}${ogLine1.svg}${ogLine2.svg}
  ${textPath(mono, "43.5297° N · 5.4474° E", { x: 100, y: 548, size: 18, tracking: 1.5, fill: C.ink }).svg}
</svg>`;
write("images/og-flexarion.svg", ogSvg);

// 4. Rastérisation (moteurs de recherche, réseaux sociaux, appareils)
const r = (svg, size, out, bg) => {
  let img = sharp(Buffer.from(svg), { density: 600 }).resize(size.w ?? size, size.h ?? size);
  if (bg) img = img.flatten({ background: bg });
  return img.png({ compressionLevel: 9 }).toFile(pub(out)).then(() => console.log("✓", out));
};
await r(faviconSvg, 48, "icon-48.png");
await r(faviconSvg, 192, "icon-192.png");
await r(faviconSvg, 512, "icon-512.png");
await r(faviconSvg, 180, "apple-touch-icon.png");
await r(logoSvg, { w: logoW * 4, h: 68 * 4 }, "images/flexarion-logo.png", C.paper);
await sharp(Buffer.from(ogSvg), { density: 144 }).resize(1200, 630).jpeg({ quality: 88, mozjpeg: true }).toFile(pub("images/og-flexarion.jpg"));
console.log("✓ images/og-flexarion.jpg");
fs.unlinkSync(pub("images/og-flexarion.svg"));

// 5. Avatar Instagram 1080×1080 (recadré en cercle par Instagram : emblème centré, sans cadre)
const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1080" height="1080">
  <rect width="64" height="64" fill="${C.ink}"/>
  <g transform="translate(9.6 8.4) scale(0.7)">${emblem({ framed: false })}</g>
</svg>`;
await sharp(Buffer.from(avatarSvg), { density: 72 }).resize(1080, 1080).jpeg({ quality: 92, mozjpeg: true })
  .toFile(path.join(root, "social/instagram/assets/flexarion-avatar.jpg"));
console.log("✓ social/instagram/assets/flexarion-avatar.jpg");
console.log(`Logo : ${logoW}×68 (PNG ${logoW * 4}×272)`);
