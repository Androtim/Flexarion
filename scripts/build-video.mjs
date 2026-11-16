// Génère la vidéo « Veridia 2140 : les aqueducs » entièrement en code (SVG → PNG → MP4).
// Aucune image ni séquence générée par IA : tout est dessiné à partir de l'identité Flexarion.
//
// Usage : npm run video:build            (16:9 et 9:16)
//         npm run video:build -- --preview  (quelques images fixes pour contrôle)
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { C, fonts, textPath, emblem, panorama } from "./lib/brand.mjs";

const FPS = 30;
const DURATION = 30;
const outDir = path.join(process.cwd(), "social", "videos");
fs.mkdirSync(outDir, { recursive: true });

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => smooth(clamp((t - a) / (b - a)));
// Opacité : apparition entre a et b, disparition entre c et d.
const fade = (t, a, b, c, d) => Math.min(prog(t, a, b), 1 - prog(t, c, d));

// ---------- Textes ----------
function caption(lines, { W, H, t, a, d, y, size, color = C.limestone, sub }) {
  const o = fade(t, a, a + 0.5, d - 0.5, d);
  if (o <= 0) return "";
  const lift = (1 - prog(t, a, a + 0.6)) * size * 0.25;
  const lh = size * 1.12;
  const blockH = lines.length * lh + (sub ? sub.size * 1.8 : 0);
  const top = y - blockH / 2 + lift;
  let svg = "";
  const widths = lines.map((l) => textPath(fonts.display, l, { size, tracking: -size * 0.02, fill: color }).width);
  const bw = Math.max(...widths, sub ? textPath(fonts.sans, sub.text, { size: sub.size, fill: color }).width : 0);
  svg += `<rect x="${W / 2 - bw / 2 - size * 0.6}" y="${top - size * 0.55}" width="${bw + size * 1.2}" height="${blockH + size * 0.75}" rx="${size * 0.35}" fill="${C.dusk}" opacity="${0.55 * o}"/>`;
  lines.forEach((l, i) => {
    svg += textPath(fonts.display, l, { x: W / 2, y: top + (i + 0.78) * lh, size, tracking: -size * 0.02, fill: color, anchor: "middle", opacity: o }).svg;
  });
  if (sub) {
    svg += textPath(fonts.sans, sub.text, { x: W / 2, y: top + lines.length * lh + sub.size * 1.25, size: sub.size, fill: C.sun, anchor: "middle", opacity: o }).svg;
  }
  return svg;
}

// ---------- Scène panorama avec caméra ----------
function panoramaScene({ W, H, cx, cy, zoom, flow, heat }) {
  const s = (H / 640) * zoom * (W > H ? 1 : 1);
  const tx = W / 2 - cx * s;
  const ty = H / 2 - cy * s;
  return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(4)})">${panorama({ flow, heat })}</g>`;
}

// ---------- Scène schéma de l'eau ----------
function diagramScene({ W, H, t, t0 }) {
  const k = W > H ? Math.min(W / 1600, H / 900) * 0.95 : W / 1480;
  const ox = (W - 1600 * k) / 2;
  const oy = (H - 900 * k) / 2 + (W > H ? 30 : H * 0.05);
  const basins = [
    { x: 230, y: 330, rx: 110, label: "Réservoir · 410 m" },
    { x: 700, y: 500, rx: 95, label: "Arbois · 260 m" },
    { x: 1200, y: 680, rx: 85, label: "Ville · 180 m" },
  ];
  const links = ["M330 345 Q520 380 620 480", "M790 515 Q1000 560 1130 660"];
  let g = `<rect width="${W}" height="${H}" fill="${C.dusk}"/>`;
  g += `<g transform="translate(${ox} ${oy}) scale(${k})">`;
  g += `<path d="M0 300 L460 360 L900 520 L1600 760 L1600 900 L0 900 Z" fill="${C.dusk2}"/>`;
  g += `<path d="M0 300 L460 360 L900 520 L1600 760" fill="none" stroke="#2F5560" stroke-width="4"/>`;
  links.forEach((d, i) => {
    const p = prog(t, t0 + 0.6 + i * 1.6, t0 + 1.6 + i * 1.6);
    if (p <= 0) return;
    g += `<path d="${d}" fill="none" stroke="${C.water}" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="${p * 100} 100"/>`;
    g += `<path d="${d}" fill="none" stroke="${C.waterLight}" stroke-width="5" stroke-linecap="round" stroke-dasharray="20 26" stroke-dashoffset="${-(t * 90)}" opacity="${p}"/>`;
  });
  basins.forEach((b, i) => {
    const fill = i === 0 ? 1 : prog(t, t0 + 1.2 + (i - 1) * 1.6, t0 + 2.4 + (i - 1) * 1.6);
    g += `<ellipse cx="${b.x}" cy="${b.y}" rx="${b.rx}" ry="${b.rx * 0.36}" fill="${C.limestone}"/>`;
    if (fill > 0) g += `<ellipse cx="${b.x}" cy="${b.y - 2}" rx="${b.rx * 0.8 * fill}" ry="${b.rx * 0.27 * fill}" fill="${C.water}"/>`;
    const lo = prog(t, t0 + 0.2 + i * 1.4, t0 + 0.8 + i * 1.4);
    g += textPath(fonts.sans, b.label, { x: b.x, y: b.y - b.rx * 0.78, size: W > H ? 44 : 66, fill: C.sun, anchor: "middle", opacity: lo }).svg;
  });
  g += `</g>`;
  return g;
}

// ---------- Cartons titre et fin ----------
function titleCard({ W, H, t }) {
  const o = fade(t, 0.2, 1.0, 2.9, 3.5);
  const e = Math.min(W, H) * 0.22;
  const size = Math.min(W, H) * 0.075;
  return `<rect width="${W}" height="${H}" fill="${C.dusk}"/>
  <g opacity="${o}">
    <g transform="translate(${W / 2 - e / 2} ${H / 2 - e * 0.85}) scale(${e / 64})">${emblem()}</g>
    ${textPath(fonts.sans, "Flexarion présente", { x: W / 2, y: H / 2 + e * 0.55, size, fill: C.limestone, anchor: "middle" }).svg}
  </g>`;
}

function endCard({ W, H, t }) {
  const o = prog(t, 27.0, 27.7);
  const portrait = H > W;
  const e = Math.min(W, H) * 0.2;
  const big = Math.min(W, H) * (portrait ? 0.13 : 0.11);
  const mid = big * 0.36;
  const y0 = H / 2 - (portrait ? e * 0.6 : e * 0.75);
  return `<rect width="${W}" height="${H}" fill="${C.dusk}" opacity="${o}"/>
  <g opacity="${o}">
    <g transform="translate(${W / 2 - e / 2} ${y0 - e}) scale(${e / 64})">${emblem()}</g>
    ${textPath(fonts.display, "Veridia 2140", { x: W / 2, y: y0 + big * 1.15, size: big, tracking: -big * 0.02, fill: C.limestone, anchor: "middle" }).svg}
    ${textPath(fonts.sans, "Un jeu Flexarion · Aix-en-Provence", { x: W / 2, y: y0 + big * 1.15 + mid * 2, size: mid, fill: C.sun, anchor: "middle" }).svg}
    ${textPath(fonts.sans, "flexarion.alwaysdata.net", { x: W / 2, y: y0 + big * 1.15 + mid * 4, size: mid * 0.9, fill: C.soft, anchor: "middle" }).svg}
  </g>`;
}

// ---------- Composition d'une image ----------
function frame(t, W, H) {
  const portrait = H > W;
  const cap = Math.min(W, H) * (portrait ? 0.085 : 0.07);
  const capY = portrait ? H * 0.2 : H * 0.22;
  const sub = { size: cap * 0.42 };
  const panW = (W / H) * 640; // largeur visible du panorama à zoom 1
  const flow = t * 70;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;

  if (t < 3.5) {
    svg += titleCard({ W, H, t });
  } else if (t < 17) {
    // Panorama : travelling de gauche à droite, puis zoom sur l'aqueduc.
    const pan = prog(t, 3.5, 10);
    const zoomIn = prog(t, 10, 12.5);
    const startX = Math.max(panW / 2, 380);
    const endX = 800;
    const cx = lerp(lerp(startX, endX, pan), 820, zoomIn);
    const cy = lerp(portrait ? 420 : 330, 495, zoomIn);
    const zoom = lerp(portrait ? 1.0 : 1.0, portrait ? 2.6 : 2.2, zoomIn);
    svg += panoramaScene({ W, H, cx, cy, zoom, flow, heat: 0 });
    svg += caption(portrait ? ["Pays d'Aix,", "été 2140."] : ["Pays d'Aix, été 2140."], {
      W, H, t, a: 4.2, d: 9.6, y: capY, size: cap,
      sub: { ...sub, text: "Sept dômes au pied de la Sainte-Victoire" },
    });
    svg += caption(["Pas une seule pompe."], { W, H, t, a: 10.6, d: 13.6, y: capY, size: cap });
    svg += caption(portrait ? ["Toute l'eau descend", "par gravité."] : ["Toute l'eau descend par gravité."], { W, H, t, a: 13.8, d: 17, y: capY, size: cap });
    svg += `<rect width="${W}" height="${H}" fill="${C.dusk}" opacity="${prog(t, 16.6, 17)}"/>`;
  } else if (t < 23.5) {
    svg += diagramScene({ W, H, t, t0: 17.4 });
    svg += caption(portrait ? ["Un mètre de pente", "en trop, et l'eau", "stagne."] : ["Un mètre de pente en trop, et l'eau stagne."], {
      W, H, t, a: 17.6, d: 23.4, y: portrait ? H * 0.16 : H * 0.13, size: cap * 0.8,
    });
    svg += `<rect width="${W}" height="${H}" fill="${C.dusk}" opacity="${Math.max(1 - prog(t, 17, 17.5), prog(t, 23.1, 23.5))}"/>`;
  } else {
    const heat = prog(t, 23.8, 26.5);
    svg += panoramaScene({ W, H, cx: portrait ? 960 : 820, cy: portrait ? 400 : 330, zoom: portrait ? 1.15 : 1.05, flow, heat });
    svg += `<rect width="${W}" height="${H}" fill="${C.dusk}" opacity="${1 - prog(t, 23.5, 24)}"/>`;
    svg += caption(portrait ? ["Votre adversaire :", "l'été."] : ["Votre adversaire : l'été."], { W, H, t, a: 24, d: 27.2, y: capY, size: cap });
    svg += endCard({ W, H, t });
  }
  return svg + "</svg>";
}

// ---------- Rendu ----------
async function render(name, W, H) {
  const file = path.join(outDir, name);
  const ff = spawn(ffmpegPath, [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-shortest",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart", file,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
  const total = FPS * DURATION;
  for (let i = 0; i < total; i++) {
    const png = await sharp(Buffer.from(frame(i / FPS, W, H))).png({ compressionLevel: 1 }).toBuffer();
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) process.stdout.write(`  ${name} ${Math.round((i / total) * 100)} %\n`);
  }
  ff.stdin.end();
  await done;
  console.log(`✓ social/videos/${name}`);
}

if (process.argv.includes("--preview")) {
  for (const [W, H, tag] of [[1920, 1080, "h"], [1080, 1920, "v"]]) {
    for (const t of [1.5, 6, 11.5, 15, 20.5, 25.5, 29]) {
      await sharp(Buffer.from(frame(t, W, H))).jpeg({ quality: 80 }).toFile(path.join(outDir, `preview-${tag}-${t}.jpg`));
    }
  }
  console.log("✓ aperçus dans social/videos/");
} else {
  await render("veridia-aqueducs-16x9.mp4", 1920, 1080);
  await render("veridia-aqueducs-9x16.mp4", 1080, 1920);
}
