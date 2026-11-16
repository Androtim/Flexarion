import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, posix } from "node:path";

const DIST_DIR = join(process.cwd(), "dist");

if (!existsSync(DIST_DIR)) {
  console.error("❌ Dossier dist/ introuvable. Lancez d'abord `npm run build`.");
  process.exit(1);
}

function collectFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      collectFiles(fullPath, acc);
    } else {
      acc.push(fullPath);
    }
  }
  return acc;
}

const allFiles = collectFiles(DIST_DIR);
const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));

let errors = 0;
let warnings = 0;
const seenTitles = new Map();
const seenDescriptions = new Map();

function fail(page, message) {
  console.error(`❌ [${page}] ${message}`);
  errors++;
}

function warn(page, message) {
  console.warn(`⚠️  [${page}] ${message}`);
  warnings++;
}

// 1. Vérifier la présence des fichiers SEO & GEO fondamentaux
for (const requiredFile of ["robots.txt", "sitemap-index.xml", "llms.txt"]) {
  const altSitemap = requiredFile === "sitemap-index.xml" && existsSync(join(DIST_DIR, "sitemap.xml"));
  if (!existsSync(join(DIST_DIR, requiredFile)) && !altSitemap) {
    fail("GLOBAL", `Fichier SEO manquant dans dist/: ${requiredFile}`);
  }
}

if (htmlFiles.length === 0) {
  fail("GLOBAL", "Aucune page HTML générée dans dist/.");
}

// 2. Auditer chaque page HTML générée
for (const file of htmlFiles) {
  const rel = "/" + relative(DIST_DIR, file).replaceAll("\\", "/");
  const html = readFileSync(file, "utf8");

  // Title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch) {
    fail(rel, "Balise <title> manquante.");
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 25 || title.length > 70) {
      warn(rel, `Longueur <title> atypique (${title.length} car.) : "${title}"`);
    }
    if (seenTitles.has(title)) {
      fail(rel, `<title> dupliqué avec ${seenTitles.get(title)} : "${title}"`);
    }
    seenTitles.set(title, rel);
  }

  // Meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch) {
    fail(rel, "Balise <meta name=\"description\"> manquante.");
  } else {
    const desc = descMatch[1].trim();
    if (desc.length < 90 || desc.length > 170) {
      warn(rel, `Longueur meta description à ajuster (${desc.length} car.).`);
    }
    if (seenDescriptions.has(desc)) {
      fail(rel, `Meta description dupliquée avec ${seenDescriptions.get(desc)}.`);
    }
    seenDescriptions.set(desc, rel);
  }

  // Canonical
  if (!/<link\s+rel=["']canonical["']\s+href=["']https?:\/\/[^"']+["']/i.test(html)) {
    fail(rel, "Balise <link rel=\"canonical\"> manquante ou relative.");
  }

  // Single H1
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length === 0) {
    fail(rel, "Aucune balise <h1> trouvée.");
  } else if (h1Matches.length > 1) {
    fail(rel, `Plusieurs balises <h1> détectées (${h1Matches.length}).`);
  }

  // JSON-LD Schema.org
  const ldMatches = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (ldMatches.length === 0) {
    fail(rel, "Aucune donnée structurée JSON-LD (Schema.org) détectée.");
  } else {
    for (const m of ldMatches) {
      try {
        JSON.parse(m[1]);
      } catch {
        fail(rel, "JSON-LD invalide (échec de parsing JSON).");
      }
    }
  }

  // Images avec alt non vide
  const imgMatches = [...html.matchAll(/<img\b([^>]*)>/gi)];
  for (const img of imgMatches) {
    const attrs = img[1];
    const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
    if (!altMatch || altMatch[1].trim().length === 0) {
      fail(rel, `Image sans attribut alt descriptif : <img ${attrs.slice(0, 80)}...>`);
    }
  }

  // Vérification des liens internes locaux
  const hrefMatches = [...html.matchAll(/\bhref=["'](\/[^"'#?]*)/gi)];
  for (const h of hrefMatches) {
    const target = h[1];
    if (target.startsWith("//")) continue;
    const cleanTarget = target.endsWith("/") ? `${target}index.html` : target;
    const candidateDirect = join(DIST_DIR, cleanTarget.replace(/^\//, ""));
    const candidateIndex = join(DIST_DIR, target.replace(/^\//, ""), "index.html");
    if (!existsSync(candidateDirect) && !existsSync(candidateIndex)) {
      fail(rel, `Lien interne cassé vers "${target}"`);
    }
  }
}

console.log(`\n📊 Audit SEO terminé : ${htmlFiles.length} page(s) analysée(s), ${errors} erreur(s), ${warnings} avertissement(s).`);

if (errors > 0) {
  process.exit(1);
}
console.log("✅ Toutes les vérifications SEO critiques sont passées !");
