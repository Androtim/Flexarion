// Génère le visuel principal de REWIRE (brutalisme → électricité verte) en SVG → JPG/WebP.
// Usage : node scripts/build-rewire-assets.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { C, fonts, textPath } from "./lib/brand.mjs";

const outDir = path.join(process.cwd(), "public", "images");
fs.mkdirSync(outDir, { recursive: true });

function buildRewireHeroSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E252B"/>
      <stop offset="52%" stop-color="#13262E"/>
      <stop offset="100%" stop-color="#113837"/>
    </linearGradient>
    <linearGradient id="smog" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5B6166" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#2C3237" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glowGreen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E85D3F"/>
      <stop offset="45%" stop-color="#F0A43A"/>
      <stop offset="100%" stop-color="#2AD4A5"/>
    </linearGradient>
    <linearGradient id="groundGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#31373C"/>
      <stop offset="48%" stop-color="#3C4648"/>
      <stop offset="100%" stop-color="#1E5242"/>
    </linearGradient>
  </defs>

  <!-- Ciel -->
  <rect width="1280" height="720" fill="url(#sky)"/>

  <!-- Grille technique discrète -->
  <g stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="1">
    <path d="M0 120 H1280 M0 240 H1280 M0 360 H1280 M0 480 H1280 M0 600 H1280"/>
    <path d="M160 0 V720 M320 0 V720 M480 0 V720 M640 0 V720 M800 0 V720 M960 0 V720 M1120 0 V720"/>
  </g>

  <!-- Panache de fumée côté brutaliste (gauche) -->
  <g fill="url(#smog)">
    <ellipse cx="195" cy="145" rx="140" ry="52"/>
    <ellipse cx="290" cy="110" rx="170" ry="58"/>
    <ellipse cx="140" cy="185" rx="110" ry="42"/>
  </g>

  <!-- Halo solaire / vert côté droit -->
  <circle cx="1040" cy="175" r="150" fill="#2AD4A5" opacity="0.11"/>
  <circle cx="1040" cy="175" r="76" fill="#F0A43A" opacity="0.18"/>

  <!-- Sol en transition (béton gris → prairie verte) -->
  <path d="M0 535 L420 530 L780 515 L1280 500 L1280 720 L0 720 Z" fill="url(#groundGrad)"/>
  <path d="M560 524 Q760 505 980 502 L1280 498 L1280 560 Q980 555 720 560 Z" fill="#236B52" opacity="0.65"/>

  <!-- Bâtiments brutalistes (gauche) -->
  <g>
    <!-- Cheminées -->
    <path d="M120 535 L138 220 L184 220 L202 535 Z" fill="#464E54"/>
    <path d="M138 220 L184 220 L189 242 L133 242 Z" fill="#C4532F"/>
    <path d="M230 535 L245 255 L286 255 L302 535 Z" fill="#3A4147"/>
    <path d="M245 255 L286 255 L290 274 L241 274 Z" fill="#C4532F"/>

    <!-- Bloc centrale brutaliste massif -->
    <rect x="65" y="360" width="290" height="175" fill="#4E565C"/>
    <rect x="65" y="360" width="290" height="18" fill="#636C73"/>
    <rect x="88" y="396" width="52" height="96" fill="#23292E"/>
    <rect x="156" y="396" width="52" height="96" fill="#23292E"/>
    <rect x="224" y="396" width="52" height="96" fill="#23292E"/>
    <!-- Jointures béton -->
    <line x1="65" y1="430" x2="355" y2="430" stroke="#31373C" stroke-width="2"/>
    <line x1="65" y1="490" x2="355" y2="490" stroke="#31373C" stroke-width="2"/>
    <!-- Voyants surcharge rouge -->
    <circle cx="315" cy="405" r="7" fill="#E85D3F"/>
    <circle cx="315" cy="428" r="7" fill="#F0A43A"/>
  </g>

  <!-- Tour brutaliste en cours de réhabilitation (centre) -->
  <g>
    <rect x="520" y="295" width="165" height="235" fill="#5A6368"/>
    <rect x="520" y="295" width="165" height="14" fill="#778288"/>
    <!-- Baies techniques -->
    <rect x="542" y="330" width="120" height="32" fill="#182C33"/>
    <rect x="542" y="378" width="120" height="32" fill="#182C33"/>
    <rect x="542" y="426" width="120" height="32" fill="#182C33"/>
    <!-- Jauge stockage gravitaire / batterie illuminée -->
    <rect x="550" y="338" width="96" height="16" rx="3" fill="#2AD4A5"/>
    <rect x="550" y="386" width="82" height="16" rx="3" fill="#1FB5A8"/>
    <rect x="550" y="434" width="60" height="16" rx="3" fill="#F0A43A"/>
    <!-- Mousse / végétation qui grimpe sur le béton -->
    <path d="M520 530 C520 490 545 480 562 496 C578 470 612 475 622 498 C642 476 675 486 685 530 Z" fill="#2E8B63"/>
    <path d="M652 295 C666 320 676 346 668 386 C680 398 686 426 676 462 L685 462 L685 295 Z" fill="#3AA874" opacity="0.85"/>
  </g>

  <!-- Zone verte & renouvelable (droite) -->
  <g>
    <!-- Éoliennes -->
    <g stroke="#EFE6D2" stroke-width="5" stroke-linecap="round">
      <line x1="895" y1="505" x2="895" y2="275"/>
      <line x1="895" y1="275" x2="895" y2="195"/>
      <line x1="895" y1="275" x2="962" y2="314"/>
      <line x1="895" y1="275" x2="828" y2="314"/>
    </g>
    <circle cx="895" cy="275" r="8" fill="#2AD4A5"/>

    <g stroke="#EFE6D2" stroke-width="4" stroke-linecap="round" opacity="0.9">
      <line x1="1065" y1="502" x2="1065" y2="305"/>
      <line x1="1065" y1="305" x2="1032" y2="236"/>
      <line x1="1065" y1="305" x2="1132" y2="312"/>
      <line x1="1065" y1="305" x2="1030" y2="368"/>
    </g>
    <circle cx="1065" cy="305" r="7" fill="#2AD4A5"/>

    <!-- Panneaux solaires -->
    <g transform="translate(945, 456)">
      <polygon points="0,38 22,0 92,0 70,38" fill="#174D5C" stroke="#2AD4A5" stroke-width="2"/>
      <line x1="45" y1="0" x2="23" y2="38" stroke="#2AD4A5" stroke-width="1.5" opacity="0.6"/>
      <line x1="68" y1="0" x2="46" y2="38" stroke="#2AD4A5" stroke-width="1.5" opacity="0.6"/>
    </g>
    <g transform="translate(1095, 452)">
      <polygon points="0,38 22,0 92,0 70,38" fill="#174D5C" stroke="#2AD4A5" stroke-width="2"/>
      <line x1="45" y1="0" x2="23" y2="38" stroke="#2AD4A5" stroke-width="1.5" opacity="0.6"/>
      <line x1="68" y1="0" x2="46" y2="38" stroke="#2AD4A5" stroke-width="1.5" opacity="0.6"/>
    </g>

    <!-- Arbres / renaturation -->
    <circle cx="790" cy="492" r="28" fill="#277D58"/>
    <circle cx="826" cy="500" r="22" fill="#349E6F"/>
    <circle cx="1210" cy="480" r="34" fill="#277D58"/>
    <circle cx="1174" cy="495" r="24" fill="#349E6F"/>
  </g>

  <!-- Réseau électrique lumineux (surcharge → vert) -->
  <path d="M295 455 L435 455 L435 385 L520 385 M685 385 L775 385 L775 445 L895 445 L1065 445 L1140 470" fill="none" stroke="url(#glowGreen)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M295 455 L435 455 L435 385 L520 385 M685 385 L775 385 L775 445 L895 445 L1065 445 L1140 470" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="14 22" opacity="0.75"/>

  <!-- Nœuds du réseau -->
  <circle cx="435" cy="455" r="9" fill="#F0A43A" stroke="#13262E" stroke-width="3"/>
  <circle cx="435" cy="385" r="9" fill="#F0A43A" stroke="#13262E" stroke-width="3"/>
  <circle cx="775" cy="385" r="10" fill="#2AD4A5" stroke="#13262E" stroke-width="3"/>
  <circle cx="895" cy="445" r="10" fill="#2AD4A5" stroke="#13262E" stroke-width="3"/>

  <!-- Cartouche titre -->
  <rect x="64" y="576" width="520" height="94" rx="14" fill="#13262E" opacity="0.88"/>
  ${textPath(fonts.display, "REWIRE", { x: 92, y: 632, size: 52, tracking: -1, fill: C.limestone }).svg}
  ${textPath(fonts.sans, "Recâblez le réseau. Libérez le béton. · Flexarion", { x: 92, y: 656, size: 19, fill: "#2AD4A5" }).svg}
</svg>`;
}

const svg = Buffer.from(buildRewireHeroSvg());
await sharp(svg).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(outDir, "rewire-hero.jpg"));
await sharp(svg).webp({ quality: 84 }).toFile(path.join(outDir, "rewire-hero.webp"));
await sharp(svg).resize(640).webp({ quality: 82 }).toFile(path.join(outDir, "rewire-hero-640.webp"));
console.log("✓ public/images/rewire-hero.{jpg,webp,-640.webp}");
