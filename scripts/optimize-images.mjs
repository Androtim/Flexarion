import sharp from "sharp";
import { statSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";

const IMG_DIR = join(process.cwd(), "public", "images");
const TARGETS = ["veridia-hero", "devlog-hydrology"];

async function optimizeImage(name) {
  const jpgPath = join(IMG_DIR, `${name}.jpg`);
  if (!existsSync(jpgPath)) {
    console.warn(`⚠️ Introuvable : ${jpgPath}`);
    return;
  }

  const rawBuffer = await sharp(jpgPath).toBuffer();
  const originalKb = (statSync(jpgPath).size / 1024).toFixed(1);

  // 1. WebP pleine taille (1280px max)
  const webpFull = join(IMG_DIR, `${name}.webp`);
  await sharp(rawBuffer)
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(webpFull);

  // 2. WebP responsive mobile/carte (640px)
  const webp640 = join(IMG_DIR, `${name}-640.webp`);
  await sharp(rawBuffer)
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(webp640);

  // 3. Recompression JPEG optimisée (OpenGraph + fallback)
  const tmpJpg = join(IMG_DIR, `${name}.tmp.jpg`);
  await sharp(rawBuffer)
    .resize({ width: 1280, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(tmpJpg);
  renameSync(tmpJpg, jpgPath);

  const newJpgKb = (statSync(jpgPath).size / 1024).toFixed(1);
  const webpFullKb = (statSync(webpFull).size / 1024).toFixed(1);
  const webp640Kb = (statSync(webp640).size / 1024).toFixed(1);

  console.log(
    `✅ ${name}: JPG ${originalKb} KB → ${newJpgKb} KB | WebP 1280w: ${webpFullKb} KB | WebP 640w: ${webp640Kb} KB`
  );
}

for (const target of TARGETS) {
  await optimizeImage(target);
}
