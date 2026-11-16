// Prépare l'archive itch.io du prototype (jeu HTML jouable dans le navigateur).
// Prérequis : npm run build. Usage : npm run itch:build → social/itch/veridia-2140-web.zip
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dist = path.join(root, "dist");
const src = path.join(dist, "jouer", "embed", "index.html");
if (!fs.existsSync(src)) {
  console.error("❌ dist/jouer/embed/index.html introuvable : lancez d'abord npm run build.");
  process.exit(1);
}
const out = path.join(root, "social", "itch", "build");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "_astro"), { recursive: true });

let html = fs.readFileSync(src, "utf8");
// Tous les fichiers /_astro/ référencés par la page (scripts, polices), puis leurs propres imports.
const queue = [...html.matchAll(/\/_astro\/[^"')\s]+/g)].map((m) => m[0]);
const seen = new Set();
while (queue.length) {
  const ref = queue.shift();
  if (seen.has(ref)) continue;
  seen.add(ref);
  const file = path.join(dist, ref);
  fs.copyFileSync(file, path.join(out, ref));
  if (ref.endsWith(".js") || ref.endsWith(".css")) {
    const body = fs.readFileSync(file, "utf8");
    for (const m of body.matchAll(/\/_astro\/[^"')\s]+|\.\/[A-Za-z0-9_.-]+\.js/g)) {
      queue.push(m[0].startsWith("./") ? "/_astro/" + m[0].slice(2) : m[0]);
    }
  }
}
// Chemins relatifs : itch.io sert le jeu dans un sous-dossier.
html = html.replaceAll("/_astro/", "./_astro/").replace('href="/favicon.svg"', 'href="./favicon.svg"');
fs.writeFileSync(path.join(out, "index.html"), html);
fs.copyFileSync(path.join(dist, "favicon.svg"), path.join(out, "favicon.svg"));

const zip = path.join(root, "social", "itch", "veridia-2140-web.zip");
fs.rmSync(zip, { force: true });
execFileSync("zip", ["-qr", zip, "."], { cwd: out });
console.log(`✓ social/itch/veridia-2140-web.zip (${seen.size} fichiers + index.html, ${Math.round(fs.statSync(zip).size / 1024)} Ko)`);
