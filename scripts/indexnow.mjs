// Notifie Bing et les moteurs IndexNow (Yandex, Seznam, Naver…) des URL du sitemap.
// Google n'utilise pas IndexNow : pour Google, passer par Search Console.
// Usage, après déploiement : npm run indexnow
import fs from "node:fs";
import path from "node:path";

const host = "flexarion.alwaysdata.net";
const keyFile = fs.readdirSync(path.join(process.cwd(), "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("Clé IndexNow introuvable dans public/");
const key = keyFile.replace(".txt", "");
const sitemap = await (await fetch(`https://${host}/sitemap-0.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${keyFile}`, urlList }),
});
console.log(`IndexNow : HTTP ${res.status} pour ${urlList.length} URL`);
if (res.status >= 400) process.exit(1);
