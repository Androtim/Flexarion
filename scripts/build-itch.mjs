// Prépare l'archive itch.io du prototype (jeu HTML jouable dans le navigateur).
// Prérequis : npm run build. Usage : npm run itch:build → social/itch/veridia-2140-web-v<version>.zip
// La version vient de GAME_VERSION (src/viaducs/content.ts) : nom du zip, VERSION.txt et titre de la page.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildSync } from "esbuild";

const root = process.cwd();
const content = fs.readFileSync(path.join(root, "src", "viaducs", "content.ts"), "utf8");
const version = content.match(/GAME_VERSION = "([^"]+)"/)?.[1];
if (!version) {
  console.error("❌ GAME_VERSION introuvable dans src/viaducs/content.ts.");
  process.exit(1);
}
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
// Scripts modules → un seul script classique intégré à la page : les navigateurs bloquent les
// modules ouverts depuis un fichier local (file://), donc l'archive téléchargée ne marcherait pas.
const inline = [];
html = html.replace(/<script type="module" src="(\.\/_astro\/[^"]+\.js)"><\/script>/g, (_, ref) => {
  const { outputFiles } = buildSync({ entryPoints: [path.join(out, ref)], bundle: true, format: "iife", minify: true, write: false, logLevel: "silent" });
  inline.push(outputFiles[0].text.replaceAll("</script", "<\\/script"));
  return "";
});
if (!inline.length) {
  console.error("❌ Aucun script du jeu trouvé dans la page embarquée.");
  process.exit(1);
}
html = html.replace("</body>", `<script>${inline.join("\n")}</script></body>`);
for (const f of fs.readdirSync(path.join(out, "_astro"))) if (f.endsWith(".js")) fs.rmSync(path.join(out, "_astro", f));
html = html.replace(/<title>([^<]*)<\/title>/, (_, t) => `<title>${t} (v${version})</title>`);
fs.writeFileSync(path.join(out, "index.html"), html);
const built = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(out, "VERSION.txt"),
  `Veridia 2140, un jeu de Flexarion\nVersion ${version} (archive du ${built})\n\nOuvrir index.html dans un navigateur pour jouer.\nDernière version et nouveautés : https://flexarion.alwaysdata.net/jouer/\n`,
);
fs.copyFileSync(path.join(dist, "favicon.svg"), path.join(out, "favicon.svg"));

const name = `veridia-2140-web-v${version}.zip`;
const zip = path.join(root, "social", "itch", name);
// Une seule archive à la fois : l'ancienne version est supprimée.
for (const f of fs.readdirSync(path.join(root, "social", "itch"))) if (/^veridia-2140-web.*\.zip$/.test(f)) fs.rmSync(path.join(root, "social", "itch", f));
execFileSync("zip", ["-qr", zip, "."], { cwd: out });
console.log(`✓ social/itch/${name} (version ${version}, ${seen.size} fichiers + index.html + VERSION.txt, ${Math.round(fs.statSync(zip).size / 1024)} Ko)`);
