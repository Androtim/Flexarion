// Génère l'identité visuelle Flexarion (logo, favicon, icônes, image de partage)
// en SVG vectoriel pur, avec le texte converti en tracés à partir des polices
// du site (Bricolage Grotesque + IBM Plex Mono). Aucune image générée par IA.
//
// Usage : npm run brand:build
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { create } from "fontkitten";

const root = process.cwd();
const pub = (p) => path.join(root, "public", p);
const font = (pkg, file) => create(fs.readFileSync(path.join(root, "node_modules", pkg, "files", file)));

// Bricolage Grotesque : graisse par défaut 800 dans le fichier variable, celle des titres du site.
const serif = font("@fontsource-variable/bricolage-grotesque", "bricolage-grotesque-latin-wght-normal.woff2");
const sans = font("@fontsource-variable/dm-sans", "dm-sans-latin-wght-normal.woff2");
const mono = font("@fontsource/ibm-plex-mono", "ibm-plex-mono-latin-600-normal.woff2");

const C = {
  paper: "#EFE6D2",
  stone: "#EBE3D3",
  ink: "#13262E",
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
const word = textPath(serif, "Flexarion", { x: 78, y: 42, size: 40, tracking: -0.6, fill: C.ink });
const sub = textPath(mono, "STUDIO · AIX-EN-PROVENCE", { x: 79, y: 60, size: 10.5, tracking: 1.6, fill: C.pine });
const logoW = Math.ceil(Math.max(78 + word.width, 79 + sub.width) + 6);
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${logoW} 68" width="${logoW}" height="68" role="img" aria-label="Flexarion Studio, Aix-en-Provence">
  <g transform="translate(2 2)">${emblem()}</g>
  ${word.svg}
  ${sub.svg}
</svg>`;
write("images/flexarion-logo.svg", logoSvg);

// 3. Image de partage par défaut (Open Graph 1200×630) : fond crépuscule, emblème, nom
const ogTitle = textPath(serif, "Flexarion", { x: 90, y: 300, size: 168, tracking: -3, fill: C.paper });
const ogLine1 = textPath(sans, "Studio de jeux vidéo de science-fiction", { x: 96, y: 380, size: 40, fill: C.sun });
const ogLine2 = textPath(sans, "Aix-en-Provence · Veridia 2140", { x: 96, y: 432, size: 40, fill: "#C9D3CF" });
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${C.ink}"/>
  <path d="M0 630 L0 560 L230 540 L420 500 L520 450 L560 420 L590 432 L630 414 L700 450 L860 500 L1050 530 L1200 545 L1200 630 Z" fill="#1C3A44"/>
  <path d="M0 630 L0 590 L1200 590 L1200 630 Z" fill="${C.pineLight}" opacity="0.9"/>
  <g transform="translate(900 120) scale(3.6)">${emblem()}</g>
  ${ogTitle.svg}${ogLine1.svg}${ogLine2.svg}
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

// 6. Bannières réseaux sociaux : YouTube 2560×1440 (zone sûre centrale 1546×423) et X 1500×500
function banner(w, h, safeW, safeH, out, withEmblem = true) {
  const cx = w / 2, cy = h / 2;
  const size = Math.round(safeH * 0.42);
  const title = textPath(serif, "Flexarion", { x: 0, y: 0, size, tracking: -size * 0.02, fill: C.paper });
  const subSize = Math.round(size * 0.24);
  const sub = textPath(sans, "Studio de jeux vidéo de science-fiction · Aix-en-Provence", { x: 0, y: 0, size: subSize, fill: C.sun });
  const emb = withEmblem ? Math.round(safeH * 0.62) : 0;
  const gap = withEmblem ? Math.round(emb * 0.25) : 0;
  const blockW = emb + gap + Math.max(title.width, sub.width);
  const x0 = cx - blockW / 2;
  const tx = x0 + emb + gap;
  const ty = cy + size * 0.12;
  const ridge = (k) => `M0 ${h} L0 ${h - 120 * k} L${w * 0.18} ${h - 140 * k} L${w * 0.33} ${h - 200 * k} L${w * 0.42} ${h - 290 * k} L${w * 0.46} ${h - 340 * k} L${w * 0.49} ${h - 325 * k} L${w * 0.53} ${h - 345 * k} L${w * 0.6} ${h - 280 * k} L${w * 0.78} ${h - 190 * k} L${w} ${h - 150 * k} L${w} ${h} Z`;
  const k = h / 1440;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13262E"/><stop offset="0.7" stop-color="#2B4A52"/><stop offset="1" stop-color="#B9714A"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
    <path d="${ridge(k * 2.2)}" fill="#1C3A44" opacity="0.9"/>
    <rect x="0" y="${h - 60 * k * 2.2}" width="${w}" height="${60 * k * 2.2}" fill="${C.pineLight}"/>
    ${withEmblem ? `<g transform="translate(${x0} ${cy - emb / 2}) scale(${emb / 64})">${emblem()}</g>` : ""}
    <g transform="translate(${tx} ${ty})">${title.svg}</g>
    <g transform="translate(${tx + size * 0.04} ${ty + subSize * 1.9})">${sub.svg}</g>
  </svg>`;
  return sharp(Buffer.from(svg)).resize(w, h).jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(root, "social", out)).then(() => console.log("✓ social/" + out));
}
fs.mkdirSync(path.join(root, "social/youtube"), { recursive: true });
fs.mkdirSync(path.join(root, "social/x"), { recursive: true });
await banner(2560, 1440, 1546, 423, "youtube/banniere-youtube.jpg");
// Sur X, l'avatar recouvre le coin inférieur gauche : pas d'emblème, texte centré.
await banner(1500, 500, 1300, 400, "x/banniere-x.jpg", false);

