// Éléments d'identité partagés (couleurs, polices converties en tracés, emblème, panorama)
// utilisés par les scripts de génération d'images et de vidéos.
import fs from "node:fs";
import path from "node:path";
import { create } from "fontkitten";

const root = process.cwd();
const loadFont = (pkg, file) => create(fs.readFileSync(path.join(root, "node_modules", pkg, "files", file)));

export const fonts = {
  display: loadFont("@fontsource-variable/bricolage-grotesque", "bricolage-grotesque-latin-wght-normal.woff2"),
  sans: loadFont("@fontsource-variable/dm-sans", "dm-sans-latin-wght-normal.woff2"),
};

export const C = {
  dusk: "#13262E",
  dusk2: "#1C3A44",
  limestone: "#EFE6D2",
  chalk: "#FBF7EE",
  water: "#1FB5A8",
  waterDeep: "#0C776F",
  waterLight: "#5FE0D3",
  sun: "#F0A43A",
  sunLight: "#F6C27A",
  roof: "#C4532F",
  olive: "#5E6E2F",
  lavender: "#8D7FB3",
  pineLight: "#3E9B74",
  soft: "#C9D3CF",
};

// Convertit un texte en tracés SVG. Renvoie le SVG et la largeur.
export function textPath(font, text, { x = 0, y = 0, size, tracking = 0, fill, anchor = "start", opacity = 1 }) {
  const scale = size / font.unitsPerEm;
  const glyphs = [...text].map((ch) => font.glyphForCodePoint(ch.codePointAt(0)));
  const width = glyphs.reduce((w, g) => w + g.advanceWidth * scale + tracking, 0) - tracking;
  let cursor = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const parts = [];
  for (const g of glyphs) {
    const d = g.path.toSVG();
    if (d) parts.push(`<path transform="translate(${cursor.toFixed(2)} ${y}) scale(${scale} ${-scale})" d="${d}"/>`);
    cursor += g.advanceWidth * scale + tracking;
  }
  return { svg: `<g fill="${fill}" opacity="${opacity}">${parts.join("")}</g>`, width };
}

// Emblème 64×64 : Sainte-Victoire, planète à anneau, aqueduc de Roquefavour.
export function emblem({ framed = true } = {}) {
  const arches = [9, 18.5, 28, 37.5, 47].map((x) => `M${x} 58 V53.5 A3.5 3.5 0 0 1 ${x + 7} 53.5 V58 Z`).join(" ");
  return `
  ${framed ? `<rect width="64" height="64" rx="6" fill="${C.dusk}"/>` : ""}
  <g transform="translate(45 19) rotate(-18)"><ellipse rx="16" ry="4.6" fill="none" stroke="#D08A3C" stroke-width="1.4"/></g>
  <circle cx="45" cy="19" r="8.5" fill="#D08A3C"/>
  <g transform="translate(45 19) rotate(-18)"><path d="M-16 0 A16 4.6 0 0 0 16 0" fill="none" stroke="#D08A3C" stroke-width="1.4"/></g>
  <path d="M5 46 L12 40 L18 38.5 L25 27 L28.5 22 L30.5 24.5 L33 23.5 L40 30 L48 34.5 L59 40 V46 Z" fill="${C.limestone}"/>
  <path fill-rule="evenodd" d="M5 46 H59 V58 H5 Z ${arches}" fill="${C.pineLight}"/>`;
}

// Panorama de Veridia (même dessin que src/components/Panorama.astro), espace 1600×640.
// flow : décalage de l'eau animée ; heat : 0 → crépuscule, 1 → canicule.
export function panorama({ flow = 0, heat = 0 } = {}) {
  const mix = (a, b, t) => {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
    const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  const sky = [
    mix("13262E", "3A2A22", heat),
    mix("2B4A52", "8A4A2A", heat),
    mix("B9714A", "E0782E", heat),
    mix("F0A43A", "F6C26A", heat),
  ];
  const arches = Array.from({ length: 15 }, (_, i) => 392 + i * 58)
    .map((x) => `<path d="M${x} 546 V510 A17 17 0 0 1 ${x + 34} 510 V546 Z"/>`)
    .join("");
  const cypress = [[70, 520, 1], [110, 540, 1.3], [470, 560, 1.1], [520, 548, 0.9], [980, 556, 1.2], [1030, 540, 0.9], [1530, 530, 1.1]]
    .map(([x, y, k]) => `<path d="M${x} ${y} C${x - 9 * k} ${y - 30 * k} ${x - 4 * k} ${y - 70 * k} ${x} ${y - 90 * k} C${x + 4 * k} ${y - 70 * k} ${x + 9 * k} ${y - 30 * k} ${x} ${y} Z"/>`)
    .join("");
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky[0]}"/><stop offset="0.45" stop-color="${sky[1]}"/>
      <stop offset="0.72" stop-color="${sky[2]}"/><stop offset="0.86" stop-color="${sky[3]}"/>
    </linearGradient>
    <linearGradient id="cliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9A7A0"/><stop offset="1" stop-color="#6F7D80"/></linearGradient>
  </defs>
  <rect x="-2000" y="-2000" width="5600" height="2640" fill="${sky[0]}"/>
  <rect width="1600" height="640" fill="url(#sky)"/>
  <g fill="${C.limestone}" opacity="${0.7 * (1 - heat)}">
    <circle cx="140" cy="60" r="1.6"/><circle cx="330" cy="120" r="1.2"/><circle cx="560" cy="40" r="1.5"/>
    <circle cx="880" cy="90" r="1.1"/><circle cx="1010" cy="30" r="1.6"/><circle cx="1420" cy="70" r="1.3"/>
  </g>
  <g transform="translate(1180 250)">
    <ellipse rx="150" ry="30" transform="rotate(-14)" fill="none" stroke="${C.sunLight}" stroke-width="4" opacity="0.7"/>
    <circle r="${70 + heat * 14}" fill="${C.sun}"/>
    <path d="M-150 0 A150 30 0 0 0 150 0" transform="rotate(-14)" fill="none" stroke="${C.sunLight}" stroke-width="4"/>
  </g>
  <path d="M0 420 L200 404 L380 372 L520 302 L598 250 L655 204 L690 216 L742 198 L800 232 L960 282 L1150 332 L1350 372 L1600 392 V640 H0 Z" fill="#5F6F74"/>
  <path d="M598 250 L655 204 L690 216 L742 198 L760 260 L700 300 L640 296 Z" fill="url(#cliff)" opacity="0.75"/>
  <path d="M0 472 C200 446 380 452 560 436 C760 418 900 444 1100 432 C1300 420 1450 444 1600 432 V640 H0 Z" fill="#2D4A3E"/>
  <path d="M760 436 A62 50 0 0 1 884 436 Z" fill="${C.water}" opacity="0.28"/>
  <path d="M760 436 A62 50 0 0 1 884 436" fill="none" stroke="${C.limestone}" stroke-width="3"/>
  <path d="M782 418 L822 392 L862 418 M822 386 V436" fill="none" stroke="${C.limestone}" stroke-width="1.5" opacity="0.6"/>
  <path d="M1190 432 A66 54 0 0 1 1322 432 Z" fill="${C.water}" opacity="0.28"/>
  <path d="M1190 432 A66 54 0 0 1 1322 432" fill="none" stroke="${C.limestone}" stroke-width="3"/>
  <path d="M1214 412 L1256 384 L1298 412 M1256 378 V432" fill="none" stroke="${C.limestone}" stroke-width="1.5" opacity="0.6"/>
  <path d="M262 458 A40 34 0 0 1 342 458 Z" fill="${C.water}" opacity="0.28"/>
  <path d="M262 458 A40 34 0 0 1 342 458" fill="none" stroke="${C.limestone}" stroke-width="2.5"/>
  <g fill="${C.sunLight}">
    <rect x="796" y="424" width="6" height="8"/><rect x="814" y="420" width="6" height="12"/><rect x="842" y="424" width="6" height="8"/>
    <rect x="1226" y="418" width="6" height="10"/><rect x="1246" y="414" width="8" height="14"/><rect x="1276" y="420" width="6" height="8"/>
    <rect x="1300" y="424" width="5" height="6"/><rect x="290" y="448" width="5" height="7"/>
  </g>
  <g fill="${C.roof}">
    <rect x="1110" y="420" width="40" height="16"/><rect x="1336" y="424" width="34" height="14"/>
    <rect x="1380" y="430" width="26" height="12"/><rect x="700" y="428" width="30" height="12"/>
  </g>
  <rect x="380" y="474" width="878" height="72" fill="#D9C9A8"/>
  <rect x="380" y="474" width="878" height="8" fill="#C7B48F"/>
  <g fill="#2D4A3E">${arches}</g>
  <path d="M384 471 H1254" stroke="${C.waterDeep}" stroke-width="8"/>
  <path d="M384 471 H1254" stroke="${C.waterLight}" stroke-width="4" fill="none" stroke-dasharray="14 18" stroke-dashoffset="${-flow}"/>
  <path d="M0 520 C160 500 300 530 420 548 C600 572 820 552 1000 566 C1200 580 1400 548 1600 540 V640 H0 Z" fill="#1F3A30"/>
  <g fill="none" stroke-linecap="round" stroke-width="5">
    <path d="M30 566 C120 556 220 566 330 586" stroke="${C.lavender}"/>
    <path d="M20 590 C130 580 240 592 360 612" stroke="${C.lavender}" opacity="0.85"/>
    <path d="M10 616 C140 606 260 618 380 636" stroke="${C.lavender}" opacity="0.7"/>
    <path d="M560 600 C680 592 800 598 900 610" stroke="${C.olive}"/>
    <path d="M540 624 C670 616 800 622 920 634" stroke="${C.olive}"/>
  </g>
  <g fill="#13261F">${cypress}</g>
  <ellipse cx="1400" cy="596" rx="170" ry="30" fill="${C.waterDeep}"/>
  <ellipse cx="1400" cy="592" rx="150" ry="22" fill="${C.water}"/>
  <rect x="-2000" y="640" width="5600" height="2000" fill="#1F3A30"/>`;
}
