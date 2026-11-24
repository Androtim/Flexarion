// Workflow vidéo Reels interactifs pour REWIRE (SVG → PNG → MP4 via sharp + ffmpeg-static).
//
// Usage :
//   npm run rewire:reel                             (rend l'épisode 1 en 9:16 1088x1920 pour TikTok/IG/VLC)
//   npm run rewire:reel -- --ep=2                   (rend l'épisode 2 depuis social/rewire/episodes.json)
//   npm run rewire:reel -- --ep=1 --audio=voix.m4a  (mixe + normalise la voix off à -14 LUFS)
//   npm run rewire:reel -- --ep=1 --youtube         (sort en 1080x1920 exact pour YouTube Shorts)
//   npm run rewire:reel -- --ep=1 --preview         (génère 5 images fixes JPEG de contrôle)
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { C, fonts, textPath, emblem } from "./lib/brand.mjs";

const FPS = 30;
const W = 1080;
const H = 1920;

const args = process.argv.slice(2);
const getArg = (prefix, fallback = null) => {
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const epId = Number(getArg("--ep=", "1"));
const audioPath = getArg("--audio=", null);
const isYoutube = args.includes("--youtube");
const isPreview = args.includes("--preview");

const outDir = path.join(process.cwd(), "social", "rewire");
fs.mkdirSync(outDir, { recursive: true });

const episodes = JSON.parse(fs.readFileSync(path.join(outDir, "episodes.json"), "utf8"));
const episode = episodes.find((e) => e.id === epId);
if (!episode) {
  console.error(`❌ Épisode #${epId} introuvable dans social/rewire/episodes.json`);
  process.exit(1);
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const prog = (t, a, b) => smooth(clamp((t - a) / (b - a)));
const fade = (t, a, b, c, d) => Math.min(prog(t, a, b), 1 - prog(t, c, d));

function captionBlock(lines, { t, start, end, y = 340, size = 76, sub }) {
  const o = fade(t, start, start + 0.35, end - 0.3, end);
  if (o <= 0) return "";
  const lift = (1 - prog(t, start, start + 0.4)) * 24;
  const lh = size * 1.15;
  const subSize = 36;
  const blockH = lines.length * lh + (sub ? subSize * 1.9 : 0);
  const top = y - blockH / 2 + lift;
  const widths = lines.map((l) => textPath(fonts.display, l, { size, tracking: -1.5, fill: C.limestone }).width);
  const subW = sub ? textPath(fonts.sans, sub, { size: subSize, fill: "#2AD4A5" }).width : 0;
  const bw = Math.min(W - 96, Math.max(...widths, subW));
  let svg = `<rect x="${(W - bw) / 2 - 36}" y="${top - 32}" width="${bw + 72}" height="${blockH + 54}" rx="24" fill="#101E24" opacity="${0.88 * o}"/>`;
  lines.forEach((l, i) => {
    svg += textPath(fonts.display, l, {
      x: W / 2,
      y: top + (i + 0.8) * lh,
      size,
      tracking: -1.5,
      fill: C.limestone,
      anchor: "middle",
      opacity: o,
    }).svg;
  });
  if (sub) {
    svg += textPath(fonts.sans, sub, {
      x: W / 2,
      y: top + lines.length * lh + subSize * 1.35,
      size: subSize,
      fill: "#2AD4A5",
      anchor: "middle",
      opacity: o,
    }).svg;
  }
  return svg;
}

function sceneBrutalistOverload(t, scene) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 9);
  const smokeShift = (t * 28) % 140;
  return `
    <rect width="${W}" height="${H}" fill="#1A2026"/>
    <!-- Fumée -->
    <g fill="#4F5861" opacity="0.45">
      <ellipse cx="${320 + smokeShift}" cy="640" rx="220" ry="74"/>
      <ellipse cx="${560 + smokeShift * 0.7}" cy="560" rx="260" ry="86"/>
      <ellipse cx="${220 + smokeShift * 0.5}" cy="740" rx="190" ry="62"/>
    </g>
    <!-- Sol béton -->
    <rect x="0" y="1380" width="${W}" height="540" fill="#2A3036"/>
    <!-- Cheminées -->
    <path d="M210 1380 L250 740 L345 740 L385 1380 Z" fill="#464E54"/>
    <path d="M250 740 L345 740 L355 785 L240 785 Z" fill="#C4532F"/>
    <path d="M440 1380 L475 810 L560 810 L595 1380 Z" fill="#3B4248"/>
    <path d="M475 810 L560 810 L569 850 L466 850 Z" fill="#C4532F"/>
    <!-- Bloc brutaliste -->
    <rect x="130" y="1010" width="820" height="370" fill="#525A61"/>
    <rect x="130" y="1010" width="820" height="32" fill="#6D7780"/>
    <rect x="190" y="1090" width="140" height="210" fill="#1E2328"/>
    <rect x="380" y="1090" width="140" height="210" fill="#1E2328"/>
    <rect x="570" y="1090" width="140" height="210" fill="#1E2328"/>
    <!-- Alerte surcharge -->
    <rect x="760" y="1090" width="140" height="210" fill="#2A1B1A" stroke="#E85D3F" stroke-width="6"/>
    <circle cx="830" cy="1165" r="24" fill="#E85D3F" opacity="${0.4 + 0.6 * pulse}"/>
    <circle cx="830" cy="1235" r="24" fill="#F0A43A" opacity="${0.9 - 0.5 * pulse}"/>
    <!-- Câbles tendus en surcharge -->
    <path d="M0 1510 L320 1510 L420 1440 L760 1440 L860 1530 L1080 1530" fill="none" stroke="#E85D3F" stroke-width="14" stroke-linecap="round"/>
    <path d="M0 1510 L320 1510 L420 1440 L760 1440 L860 1530 L1080 1530" fill="none" stroke="#FFF" stroke-width="4" stroke-dasharray="28 32" stroke-dashoffset="${-t * 220}"/>
    ${captionBlock(scene.lines, { t, start: scene.start, end: scene.end, y: 340, size: 78, sub: scene.sub })}
  `;
}

function sceneSplitConcept(t, scene) {
  const p = prog(t, scene.start + 0.5, scene.end - 0.8);
  const splitX = Math.round(W * (0.52 - 0.14 * p));
  return `
    <!-- Gauche : réseau technique -->
    <rect width="${W}" height="${H}" fill="#13262E"/>
    <g stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="2">
      <path d="M0 700 H1080 M0 900 H1080 M0 1100 H1080 M0 1300 H1080 M0 1500 H1080"/>
      <path d="M180 560 V1700 M360 560 V1700 M540 560 V1700 M720 560 V1700 M900 560 V1700"/>
    </g>
    <!-- Droite : zone verte qui avance -->
    <rect x="${splitX}" y="0" width="${W - splitX}" height="${H}" fill="#123833"/>
    <line x1="${splitX}" y1="0" x2="${splitX}" y2="${H}" stroke="#2AD4A5" stroke-width="6"/>
    <!-- Nœuds et lignes électriques -->
    <path d="M160 1120 H420 V960 H680 V1240 H920" fill="none" stroke="#F0A43A" stroke-width="14" stroke-linejoin="round"/>
    <path d="M160 1120 H420 V960 H680 V1240 H920" fill="none" stroke="#2AD4A5" stroke-width="14" stroke-linejoin="round" pathLength="100" stroke-dasharray="${p * 100} 100"/>
    <circle cx="160" cy="1120" r="32" fill="#464E54" stroke="#E85D3F" stroke-width="6"/>
    <circle cx="420" cy="960" r="32" fill="#1B343E" stroke="#F0A43A" stroke-width="6"/>
    <circle cx="680" cy="1240" r="36" fill="#1E5242" stroke="#2AD4A5" stroke-width="6"/>
    <circle cx="920" cy="1240" r="40" fill="#277D58" stroke="#EFE6D2" stroke-width="6"/>
    <!-- Arbres côté droit -->
    <g opacity="${0.3 + 0.7 * p}">
      <circle cx="780" cy="1470" r="65" fill="#277D58"/>
      <circle cx="885" cy="1495" r="52" fill="#349E6F"/>
      <circle cx="980" cy="1460" r="70" fill="#2E8B63"/>
    </g>
    ${captionBlock(scene.lines, { t, start: scene.start, end: scene.end, y: 340, size: 78, sub: scene.sub })}
  `;
}

function sceneGridStabilize(t, scene) {
  const p = prog(t, scene.start + 0.6, scene.end - 1.0);
  const meterW = Math.round(140 + 540 * p);
  const meterColor = p < 0.35 ? "#E85D3F" : p < 0.7 ? "#F0A43A" : "#2AD4A5";
  const angle = t * 110;
  return `
    <rect width="${W}" height="${H}" fill="#13262E"/>
    <!-- Jauge stabilité réseau -->
    <rect x="160" y="620" width="760" height="110" rx="20" fill="#1B313B" stroke="#2F5560" stroke-width="4"/>
    <rect x="180" y="644" width="${meterW}" height="62" rx="12" fill="${meterColor}"/>
    ${textPath(fonts.sans, `Électricité verte : ${Math.round(15 + 85 * p)} %`, { x: W / 2, y: 590, size: 40, fill: C.limestone, anchor: "middle" }).svg}
    <!-- Tour brutaliste réhabilitée + éolienne -->
    <rect x="0" y="1420" width="${W}" height="500" fill="${p > 0.5 ? "#1E5242" : "#2D363A"}"/>
    <rect x="210" y="960" width="320" height="460" fill="#5A6368"/>
    <rect x="255" y="1025" width="230" height="46" rx="8" fill="#2AD4A5" opacity="${0.3 + 0.7 * p}"/>
    <rect x="255" y="1100" width="230" height="46" rx="8" fill="#1FB5A8" opacity="${0.2 + 0.8 * p}"/>
    <rect x="255" y="1175" width="230" height="46" rx="8" fill="#F0A43A"/>
    <!-- Végétation grimpante -->
    <path d="M210 1420 C240 1320 320 1310 370 1350 C420 1295 495 1315 530 1420 Z" fill="#2E8B63" opacity="${p}"/>
    <!-- Éolienne tournante -->
    <line x1="790" y1="1420" x2="790" y2="960" stroke="#EFE6D2" stroke-width="14" stroke-linecap="round"/>
    <g transform="translate(790 960) rotate(${angle.toFixed(1)})" stroke="#EFE6D2" stroke-width="12" stroke-linecap="round">
      <line x1="0" y1="0" x2="0" y2="-175"/>
      <line x1="0" y1="0" x2="152" y2="88"/>
      <line x1="0" y1="0" x2="-152" y2="88"/>
    </g>
    <circle cx="790" cy="960" r="18" fill="#2AD4A5"/>
    ${captionBlock(scene.lines, { t, start: scene.start, end: scene.end, y: 310, size: 74, sub: scene.sub })}
  `;
}

function sceneVoteAB(t, scene) {
  const oA = prog(t, scene.start + 0.4, scene.start + 1.0);
  const oB = prog(t, scene.start + 1.4, scene.start + 2.0);
  return `
    <rect width="${W}" height="${H}" fill="#13262E"/>
    ${captionBlock(scene.lines, { t, start: scene.start, end: scene.end, y: 320, size: 80, sub: scene.sub })}

    <!-- Carte Option A -->
    <g opacity="${oA}">
      <rect x="90" y="640" width="900" height="420" rx="28" fill="#1C313B" stroke="#F0A43A" stroke-width="6"/>
      ${textPath(fonts.sans, scene.optionA.label, { x: 145, y: 730, size: 38, fill: "#F0A43A" }).svg}
      ${textPath(fonts.display, scene.optionA.title, { x: 145, y: 830, size: 64, fill: C.limestone }).svg}
      ${textPath(fonts.sans, scene.optionA.detail, { x: 145, y: 920, size: 40, fill: C.soft }).svg}
    </g>

    <!-- Carte Option B -->
    <g opacity="${oB}">
      <rect x="90" y="1130" width="900" height="420" rx="28" fill="#1C313B" stroke="#2AD4A5" stroke-width="6"/>
      ${textPath(fonts.sans, scene.optionB.label, { x: 145, y: 1220, size: 38, fill: "#2AD4A5" }).svg}
      ${textPath(fonts.display, scene.optionB.title, { x: 145, y: 1320, size: 64, fill: C.limestone }).svg}
      ${textPath(fonts.sans, scene.optionB.detail, { x: 145, y: 1410, size: 40, fill: C.soft }).svg}
    </g>
  `;
}

function sceneEndCard(t, scene) {
  const o = prog(t, scene.start, scene.start + 0.5);
  return `
    <rect width="${W}" height="${H}" fill="#13262E"/>
    <g opacity="${o}">
      <g transform="translate(${W / 2 - 110} 580) scale(3.4375)">${emblem()}</g>
      ${textPath(fonts.display, scene.title, { x: W / 2, y: 970, size: 150, tracking: -3, fill: C.limestone, anchor: "middle" }).svg}
      ${textPath(fonts.sans, scene.sub, { x: W / 2, y: 1080, size: 46, fill: "#2AD4A5", anchor: "middle" }).svg}
      ${textPath(fonts.sans, "Un jeu Flexarion · Aix-en-Provence", { x: W / 2, y: 1185, size: 40, fill: C.sun, anchor: "middle" }).svg}
      ${textPath(fonts.sans, scene.url, { x: W / 2, y: 1270, size: 36, fill: C.soft, anchor: "middle" }).svg}
    </g>
  `;
}

function renderFrame(t) {
  const scene = episode.scenes.find((s) => t >= s.start && t < s.end) ?? episode.scenes.at(-1);
  let body = "";
  if (scene.type === "brutalist_overload") body = sceneBrutalistOverload(t, scene);
  else if (scene.type === "split_concept") body = sceneSplitConcept(t, scene);
  else if (scene.type === "grid_stabilize") body = sceneGridStabilize(t, scene);
  else if (scene.type === "vote_ab") body = sceneVoteAB(t, scene);
  else body = sceneEndCard(t, scene);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
}

if (isPreview) {
  for (const s of episode.scenes) {
    const t = Number(((s.start + s.end) / 2).toFixed(1));
    const file = path.join(outDir, `preview-ep${String(epId).padStart(2, "0")}-${s.type}.jpg`);
    await sharp(Buffer.from(renderFrame(t))).jpeg({ quality: 82 }).toFile(file);
    console.log(`✓ ${path.relative(process.cwd(), file)}`);
  }
  process.exit(0);
}

const outName = `rewire-${episode.slug}${isYoutube ? "-youtube" : "-9x16"}.mp4`;
const outFile = path.join(outDir, outName);

const vf = isYoutube
  ? "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
  : `pad=${Math.ceil(W / 16) * 16}:${H}:${(Math.ceil(W / 16) * 16 - W) / 2}:0:color=0x13262E,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`;

const ffArgs = [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
];

if (audioPath) {
  ffArgs.push("-i", audioPath, "-af", "highpass=f=80,loudnorm=I=-14:TP=-1.5:LRA=11");
} else {
  ffArgs.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");
}

ffArgs.push(
  "-shortest",
  "-vf", vf,
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-profile:v", isYoutube ? "high" : "main", "-level:v", "4.1", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "128k",
  "-movflags", "+faststart",
  outFile,
);

const ff = spawn(ffmpegPath, ffArgs, { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
const total = FPS * episode.duration;
for (let i = 0; i < total; i++) {
  const png = await sharp(Buffer.from(renderFrame(i / FPS))).png({ compressionLevel: 1 }).toBuffer();
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 180 === 0) process.stdout.write(`  ${outName} ${Math.round((i / total) * 100)} %\n`);
}
ff.stdin.end();
await done;
console.log(`✓ social/rewire/${outName}`);
