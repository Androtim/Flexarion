# Journal de Passation Inter-Agents (`AI_HANDOFF.md`)

Ce fichier est la **mémoire technique et stratégique partagée** du dépôt `Androtim/Flexarion`.  
Chaque agent IA intervenant sur ce projet (depuis n'importe quel PC ou outil) doit :
1. **Lire ce fichier en entier** au début de sa session.
2. **Ajouter une nouvelle entrée tout en haut de la section « Historique des interventions IA »** (ordre chronologique inversé : la plus récente en premier) avant de pousser sa branche ou PR.

---

## État Actuel du Projet (Instantané à la dernière mise à jour)

- **Version courante sur `main` & `develop` :** `v1.2.0` + documentation de passation multi-agents.
- **Avancement du cours :** CM1 effectué ; 0 TD effectué. **Site en ligne depuis le 2026-11-16 sur https://flexarion.alwaysdata.net** (déploiement anticipé validé par l'utilisateur).
- **Ce qui est déjà prêt et validé :**
  - Gouvernance Git pro (`main`, `develop`, PRs, Milestones M1–M4, Conventional Commits, GitHub Actions CI `.github/workflows/ci-seo.yml`).
  - Plan de communication complet (`docs/plan-communication.md`) et charte éditoriale (`docs/brand-guidelines.md`).
  - Site Astro `6.4.8` en architecture en silo (`/`, `/studio/`, `/jeux/veridia-2140/`, `/devlogs/`, `/contact/`) avec 2 devlogs, `JSON-LD` (`Organization`, `VideoGame`, `BlogPosting`, `FAQPage`, `BreadcrumbList`), `sitemap-index.xml`, `robots.txt` et `llms.txt` (GEO).
  - Direction artistique éditoriale provençale « anti-AI-slop » (papier calcaire `#F5F0E6`, `Fraunces` + `DM Sans` + `IBM Plex Mono` auto-hébergés en WOFF2, zéro requête Google Fonts).
  - Images optimisées en WebP responsifs (`640w`/`1280w` + JPEG fallback) avec `<link rel="preload">` + `fetchpriority="high"`.
  - Script `scripts/audit-seo.mjs` passant avec `0 erreur, 0 avertissement` sur les 7 pages générées.
  - Kit de lancement Instagram prêt dans `social/instagram/` (`@flexarion` principal + `@flexarion_official` redirection).
- **Ce qu'il reste à faire / Backlog actif :**
  1. **Issue `#5` (OPEN) :** Configurer et lancer les 2 comptes Instagram (`@flexarion` & `@flexarion_official`) au moment du TD1/TD2 avec les assets de `social/instagram/assets/`, puis ouvrir 1–2 relais indexables (YouTube, itch.io, LinkedIn/X).
  2. **Personnalisation humaine & équipe :** Compléter les vrais prénoms/pseudos et rôles des membres du groupe dans `src/pages/studio.astro` et `docs/plan-communication.md` (actuellement seuls `Timothée B. (Androtim)` et des emplacements `Membre 2/3/4` figurent).
  3. **Polissage éditorial français (tâche idéale pour Claude Opus 5.5) :** Relire les pages et les 2 devlogs pour y ajouter des anecdotes concrètes du groupe, affiner le style humain, et éventuellement préparer le Devlog #3 ou enrichir la partie gameplay/lore de *Veridia 2140*.
  4. **Au lancement officiel (CM2) :** Définir l'URL finale (`SITE_URL` dans `astro.config.mjs` et `public/robots.txt`), déployer sur l'hébergement retenu (Alwaysdata ou GitHub Pages), soumettre `sitemap-index.xml` dans Google Search Console, puis vérifier Lighthouse en conditions réelles.
  5. **En fin de module (TD4) :** Préparer les slides de soutenance (10–12 min) et **rédiger 100 % à la main sans IA** la synthèse réflexive finale (1–2 pages).

---

## Modèle d'Entrée Obligatoire (À copier en haut de l'historique ci-dessous)

```markdown
### [AAAA-MM-JJ HH:MM] · <Nom du Modèle / Outil> (ex: Claude Opus 5.5 via Claude Code)
- **Branche / Issue / PR :** `feat/...` · Issue `#...` · PR `#...`
- **Objectif de la session :** ...
- **Ce qui a été fait (fichiers modifiés/créés) :**
  - `chemin/du/fichier` : description concise du changement
- **Pourquoi ces choix (décisions, alternatives écartées) :**
  - ...
- **Vérifications exécutées :**
  - `npm run build` : ...
  - `npm run audit:seo` : ...
  - Autre test (navigateur, Lighthouse, CI) : ...
- **À faire / Attention pour le prochain agent :**
  - ...
```

---

## Historique des Interventions IA

### [2026-11-17 13:15] · Claude Opus 5.5 via Claude Code (refonte visuelle du jeu)
- **Branche :** `feat/game-visual-overhaul`
- **Objectif :** le prototype était jugé « AI slop » par l'équipe. Refonte guidée par le skill `frontend-design` (et la lecture des règles du skill tiers « taste », **non installé** car il ajoute des hooks qui exécutent du code).
- **Direction :** la carte devient un **relevé topographique** du Pays d'Aix (relief ombré calculé, courbes de niveau tous les 20 m, cotes tous les 100 m, affleurements calcaires, garrigue et cyprès). L'eau ne s'allume que dans les tronçons qui descendent : la règle du jeu se lit sur la carte.
- **Fichiers :** `src/game/render.ts` (réécrit, terrain mis en cache par taille de case), `src/game/main.ts` (dates réelles du 21 juin au 19 septembre, consigne en contexte avec repère pulsant sur le réservoir, animation de pose), `src/components/GameApp.astro` (panneau = légende de la carte avec symboles identiques à la carte, bandeau date/air/réservoir/vanne/crédits).
- **Vérifications :** build, audit SEO, `game:check` (5/5), captures desktop/mobile/vue chaleur.
- **Attention :** ne pas remplacer en masse « espace + : » dans le code TypeScript (ça touche les ternaires) ; les espaces insécables françaises vont uniquement dans les chaînes affichées.

---

### [2026-11-16 18:10] · Claude Opus 5.5 via Claude Code (prototype jouable)
- **Branche / Issue / PR :** `feat/game-prototype`
- **Objectif :** Créer un premier prototype jouable de *Veridia 2140* (prérequis du défi « La ville des joueurs » : tous les 2 jours, le commentaire le plus aimé entre dans le jeu).
- **Choix :** jeu **web** (TypeScript + canvas, sans moteur) plutôt qu'un exécutable : jouable en un clic sur mobile (public TikTok), mises à jour instantanées pour le défi, contenu sur le site (SEO) et page itch.io jouable.
- **Ce qui a été fait :**
  - `src/game/` : `map.ts` (carte 18×12 déterministe, relief), `sim.ts` (eau gravitaire répartie selon les besoins en aval, vanne, évaporation, chaleur, mycélium connexe éveillé par l'eau, santé des quartiers), `content.ts` (bâtiments et réglages, **c'est ici qu'entrent les ajouts du défi**), `render.ts` (canvas, vues Carte/Relief/Chaleur), `main.ts` (UI, souris + tactile, sauvegarde `localStorage`), `demo.ts` (joueur automatique).
  - `src/components/GameApp.astro` (UI partagée), `src/pages/jouer.astro` (page indexée + règles du défi), `src/pages/jouer/embed.astro` (version itch.io, `noindex`, hors sitemap).
  - `src/data/defi.ts` : liste des ajouts du défi (vide pour l'instant).
  - `scripts/game-check.ts` (`npm run game:check`, ajouté à la CI) : atteignabilité des 5 quartiers, défaite sans construction, victoire d'une stratégie raisonnable.
  - `scripts/build-itch.mjs` (`npm run itch:build`) : archive `social/itch/veridia-2140-web.zip` avec chemins relatifs.
  - Mode démo pour captures/vidéos : `/jouer/?demo=45` (et `&vue=heat` ou `&vue=relief`).
- **Équilibrage vérifié :** sans rien faire, partie perdue au jour 49 ; stratégie simple : 5/5 quartiers, avec des quartiers à ~50 % pendant la canicule.
- **Vérifications :** build (11 pages), audit SEO 0 erreur, `game:check` OK, test d'interaction réel via Chrome DevTools (clics, eau, sauvegarde, vitesse) sur le site et sur l'archive itch.io servie en sous-dossier.
- **Attention :** `pkill -f "astro preview"` tue aussi le shell qui contient ce texte : utiliser `pkill -f "astro previe[w]"` dans une commande séparée.
- **Pour ajouter une idée du défi :** modifier `src/game/content.ts` (et `sim.ts`/`render.ts` si nouvelle mécanique), incrémenter `GAME_VERSION`, ajouter l'entrée dans `src/data/defi.ts`, puis `npm run game:check && npm run build && npm run audit:seo && npm run itch:build`, déployer et ré-uploader le zip sur itch.io.

---

### [2026-11-16 16:40] · Claude Opus 5.5 via Claude Code (refonte v2)
- **Branche / Issue / PR :** `design/map-first-revamp` (basée sur `feat/seo-brand-signals-and-lore`, PR #23)
- **Objectif de la session :** Refondre tout le site pour qu'il ne ressemble plus à un site généré par IA (demande de l'utilisateur).
- **Constat de départ :** recherche web (Capital & Compute, 21st.dev, etc.) : la v1 « papier calcaire + serif + étiquettes monospace + filets + `→` » correspond au style « warm editorial », désormais identifié comme un marqueur de site généré par IA.
- **Ce qui a été fait :**
  - `src/components/Panorama.astro` : **panorama SVG interactif** de Veridia (Sainte-Victoire, planète à anneau, dômes, aqueduc avec eau animée, restanques, bassin du Réaltor) avec 4 districts cliquables ; défilement horizontal sur mobile.
  - `src/components/MechanicDiagram.astro` : 3 schémas dessinés (eau gravitaire, mycélium, course du soleil sur un dôme).
  - `src/styles/global.css` : réécriture complète (palette tirée des illustrations, Bricolage Grotesque + DM Sans, coins arrondis variés, boutons pleins, plus de sur-titres/filets/flèches, `prefers-reduced-motion`).
  - Toutes les pages réécrites (accueil, studio, jeu, univers, devlogs, article, contact, 404) avec des textes plus concrets ; en-tête/pied de page refaits (crête de la Sainte-Victoire en pied de page).
  - Logo, image Open Graph et avatar Instagram regénérés en Bricolage Grotesque sur fond crépuscule (`npm run brand:build`) ; Fraunces désinstallée.
  - Pseudo Instagram secondaire corrigé : `@flexarion.official`.
  - `CLAUDE.md`, `AGENTS.md`, `docs/brand-guidelines.md` : nouvelle direction artistique documentée.
- **Vérifications :** `npm run build` (9 pages), `npm run audit:seo` (0 erreur, 0 avertissement), captures headless 1280 px et 390 px de chaque gabarit.
- **À faire / Attention :**
  - Déployer après validation visuelle de l'utilisateur (`rsync`, voir l'entrée précédente). Ne jamais supprimer `public/google5a4bf04ecd7e8477.html` (vérification Search Console).
  - Ajouter les URL YouTube/Instagram dans `STUDIO` (`sameAs`) dès que l'utilisateur les donne.
  - Vidéos YouTube/Reels générées en code : à lancer (première vidéo test « les aqueducs »).
  - Équipe : remplacer « Présentation à venir » dans `src/pages/studio.astro` quand le groupe est constitué.

---

### [2026-11-16 16:10] · Claude Opus 5.5 via Claude Code
- **Branche / Issue / PR :** `feat/seo-brand-signals-and-lore` (depuis `develop`)
- **Objectif de la session :** Mettre le site en ligne au plus tôt sur alwaysdata, maximiser le classement sur la requête « Flexarion » et remplacer le logo généré par IA par une identité vectorielle cohérente.
- **Ce qui a été fait (fichiers modifiés/créés) :**
  - **Déploiement :** le site est **en ligne sur https://flexarion.alwaysdata.net** (feu vert explicite de l'utilisateur pour déployer avant le CM2). Déploiement par `rsync` SSH (clé `~/.ssh/alwaysdata_flexarion`, compte `flexarion`, dossier `~/www/`) : `rsync -az --delete -e "ssh -i ~/.ssh/alwaysdata_flexarion" dist/ flexarion@ssh-flexarion.alwaysdata.net:www/`.
  - `public/.htaccess` : redirection HTTP→HTTPS (301), `ErrorDocument 404`, cache long sur `_astro/`, compression.
  - `src/data/site.ts` : `Organization` enrichie (`@id`, `legalName`, `alternateName`, logo PNG, `foundingLocation`, `knowsAbout`) + nouveau `buildWebSiteSchema` (nom de site « Flexarion » dans Google). Lien « Univers » ajouté à la navigation.
  - `src/layouts/BaseLayout.astro` : `WebSite` JSON-LD sur l'accueil, favicons PNG + `apple-touch-icon` + `site.webmanifest`, `og:image:width/height/alt`, prop `noindex`, image de partage par défaut `og-flexarion.jpg`, correction du lien de navigation actif (correspondance la plus longue).
  - `src/pages/jeux/veridia-2140/univers.astro` : **nouvelle page** (chronologie 2038–2140, 4 districts, 3 factions, lexique, FAQ).
  - `src/pages/404.astro` : page 404 `noindex`. `scripts/audit-seo.mjs` : pas d'exigence de canonical sur les pages `noindex`.
  - Titres/H1 : « Flexarion » en tête du `<title>` et du `<h1>` de l'accueil, du studio et des devlogs.
  - `scripts/build-brand-assets.mjs` (`npm run brand:build`) : génère logo, favicon, icônes, image Open Graph et avatar Instagram en **SVG vectoriel**, texte converti en tracés depuis Fraunces + IBM Plex Mono. Emblème : Sainte-Victoire, planète à anneau (SF), arches de l'aqueduc de Roquefavour, palette de la charte.
- **Pourquoi ces choix :**
  - `flexarion.fr` et `flexarion-studio.github.io` sont déjà occupés par d'autres groupes : le sous-domaine `flexarion.alwaysdata.net` (mot-clé exact) a été réservé immédiatement.
  - L'ancien logo/avatar (néon, dégradés) contredisait la charte calcaire ; un logo vectoriel reste net à toute taille et Google exige un logo raster pour `Organization.logo`.
  - Devlog #3 volontairement **non publié** maintenant : le garder pour le TD3 donne un signal de fraîcheur et respecte le calendrier du brief.
- **Vérifications exécutées :**
  - `npm run build` : 9 pages. `npm run audit:seo` : 0 erreur, 0 avertissement.
  - Captures Chrome headless 1280 px et 390 px (accueil, Univers) ; vérification en ligne : 200 sur toutes les pages, 404 réel, HTTP→HTTPS en 301.
  - ⚠️ `npm install` sur réseau lent avait laissé `@fontsource-variable/*` incomplets (Fraunces/DM Sans absents du build) : réinstallés. En cas de doute, vérifier `ls dist/_astro | grep fraunces`.
- **À faire / Attention pour le prochain agent :**
  - L'utilisateur doit ajouter le site dans **Google Search Console** et **Bing Webmaster Tools** (vérification par fichier HTML ou balise méta), soumettre `sitemap-index.xml` et demander l'indexation de chaque URL.
  - Créer les profils externes (Instagram avec le nouvel avatar, itch.io, YouTube…) et renseigner leurs URL dans `STUDIO` (`sameAs`) de `src/data/site.ts`.
  - Équipe : composition du groupe pas encore fixée (6 amis à répartir), ne pas inventer de noms.

---

### [2026-11-16 15:16] · Gemini 4 Hydrogen (Antigravity)
- **Branche / Issue / PR :** `docs/ai-handoff-and-agent-instructions` -> `develop` -> `main` · Issue `#19`
- **Objectif de la session :** Mettre en place une documentation de passation standardisée pour permettre à Claude (sur un autre PC) et à tout autre agent IA de reprendre le projet sans perte de contexte.
- **Ce qui a été fait :**
  - `AGENTS.md` : règles du concours, architecture en silo, charte anti-AI-slop, workflow Git/CI et protocole de mise à jour de `AI_HANDOFF.md`.
  - `CLAUDE.md` : point d'entrée natif pour Claude Code renvoyant vers `AGENTS.md` et `AI_HANDOFF.md` avec les garde-fous critiques.
  - `AI_HANDOFF.md` : création de ce journal de bord inter-agents avec instantané `v1.2.0` et historique complet des sessions précédentes.
  - `README.md` & `.github/PULL_REQUEST_TEMPLATE.md` : intégration des références vers `AGENTS.md`, `CLAUDE.md` et `AI_HANDOFF.md`.
- **Pourquoi ces choix :**
  - Séparer `docs/journal-usage-ia.md` (livrable scolaire synthétique noté sur les 9 pts de barème) de `AI_HANDOFF.md` (journal technique opérationnel destiné aux agents IA d'un PC à l'autre) évite de noyer les consignes de reprise dans un tableau académique.
  - Placer `AGENTS.md`, `CLAUDE.md` et `AI_HANDOFF.md` à la racine du repo garantit leur détection automatique par Claude Code et les autres IDE agentiques.
- **Vérifications exécutées :**
  - `npm.cmd run build && npm.cmd run audit:seo` et CI GitHub Actions après push.
- **À faire / Attention pour le prochain agent :**
  - Si tu es sur Windows avec une stratégie d'exécution PowerShell restrictive, utilise `npm.cmd` et `npx.cmd` à la place de `npm` / `npx`.
  - Vérifie l'Issue `#5` (Instagram) et n'active aucun déploiement public avant le feu vert CM2 de l'utilisateur.

---

### [2026-11-16 03:05] · Gemini 4 Hydrogen (Antigravity) — `v1.2.0`
- **Branche / Issue / PR :** `perf/lcp-webp-selfhosted-fonts` -> `develop` (`PR #17`) -> `main` (`PR #18`) · Issue `#16` (`CLOSED`)
- **Objectif de la session :** Corriger le LCP à `1.6 s` (score `0.75`) relevé lors d'un premier test Lighthouse `13.5.0` sur `http://localhost:4321/`.
- **Ce qui a été fait :**
  - `scripts/optimize-images.mjs` : compression `mozjpeg` des JPG (`veridia-hero.jpg` : `1123.6 KB -> 226.8 KB` ; `devlog-hydrology.jpg` : `1045.7 KB -> 203.7 KB`) et génération de WebP `1280w` (`~223 KB` / `~206 KB`) et `640w` (`61.0 KB` / `62.6 KB`).
  - `src/components/ResponsivePicture.astro` : composant partagé `<picture>` servant les sources WebP responsives avec `fetchpriority="high"` et `decoding="sync"` pour les images critiques.
  - `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `astro.config.mjs`, `package.json` : remplacement de Google Fonts par les polices locales WOFF2 (`@fontsource-variable/fraunces`, `@fontsource-variable/dm-sans`, `@fontsource/ibm-plex-mono` latin), `inlineStylesheets: "always"`, et `<link rel="preload" as="image">` sur le hero.
  - Mise à jour de `src/pages/index.astro`, `studio.astro`, `jeux/veridia-2140.astro`, `devlogs/index.astro`, `devlogs/[id].astro` et `docs/journal-usage-ia.md`.
- **Pourquoi ces choix :**
  - Auto-héberger les WOFF2 élimine la feuille CSS externe bloquante de Google Fonts tout en renforçant la conformité **RGPD** (argument direct pour l'oral TD4).
  - Conserver les `.jpg` compressés en fallback garantit la compatibilité OpenGraph / Twitter Cards / Kit Presse.
- **Vérifications exécutées :**
  - `npm.cmd run build` (`7 page(s) built in 1.86s`) & `npm.cmd run audit:seo` (`0 erreur, 0 avertissement`).
  - Contrôle navigateur sur `astro preview` (`http://127.0.0.1:4321/`) : chargement effectif des 5 WOFF2 locaux, 0 requête Google Fonts, images servies en `.webp`, 0 erreur console/réseau.
  - CI GitHub Actions (`43789977971` sur `main`) : `success` en `11s`.

---

### [2026-11-16 02:49] · Gemini 4 Hydrogen (Antigravity) — `v1.1.0`
- **Branche / Issue / PR :** `design/editorial-anti-slop-overhaul` -> `develop` (`PR #14`) -> `main` (`PR #15`) · Issue `#13` (`CLOSED`)
- **Objectif de la session :** Éliminer tous les marqueurs visuels « fait par IA » (*AI slop web design*) et corriger l'esthétique vers un rendu éditorial naturel et distinctif.
- **Ce qui a été fait :**
  - `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/FaqSection.astro`, `public/images/flexarion-logo.svg`, toutes les pages `src/pages/**/*.astro`, `src/content/devlogs/*.md`, `docs/brand-guidelines.md`.
  - Remplacement du thème sombre à halos néons par une monographie éditoriale provençale (`#F5F0E6` calcaire, `#121917` encre, `#155E44` pin, `#A95A22` terre cuite).
  - Suppression des rangées de 3 cartes arrondies identiques et des *pill badges* au profit d'index archivistiques numérotés (`01`, `02`, `03`) à filets de `1px`, planches encadrées et lettrines sur les devlogs.
  - Suppression des tirets cadratins excessifs (`—`).
  - Correction d'un débordement horizontal mobile (`390px`) sur `<pre>` dans `.prose` via `min-width: 0` Flexbox et `max-width: 100%; overflow-x: auto`.
- **Pourquoi ces choix :**
  - Se démarquer radicalement des 20+ autres sites étudiants qui utiliseront des templates sombres Tailwind/IA génériques, tout en collant au thème Solarpunk méditerranéen d'Aix-en-Provence.
- **Vérifications exécutées :**
  - `npm.cmd run build` & `npm.cmd run audit:seo` (`0 erreur, 0 avertissement`).
  - Inspection navigateur desktop `1280x800` + revalidation mobile `390x844` sur `/devlogs/simulation-flux-hydriques-graphes/` (`body` `375px`, `<pre>` `335px`, zéro scroll horizontal).
  - CI GitHub Actions (`43788455533` sur `main`) : `success`.

---

### [2026-11-16 02:34] · Gemini 4 Hydrogen (Antigravity) — `v1.0.1`
- **Branche / Issue / PR :** `fix/academic-transparency-and-honest-claims` -> `develop` (`PR #11`) -> `main` (`PR #12`) · Issue `#10` (`CLOSED`)
- **Objectif de la session :** Répondre à une inquiétude éthique de l'utilisateur en évitant toute allégation commerciale trompeuse sur un futur site public indexé.
- **Ce qui a été fait :**
  - Retrait du faux prix (`19,99 €`), du statut `PreOrder` dans le JSON-LD `VideoGame` (`src/pages/jeux/veridia-2140.astro`) et du faux email `.example` (`src/data/site.ts`, `src/pages/contact.astro`).
  - Ajout de mentions académiques transparentes (concept fictif créé en BUT Informatique à l'IUT d'Aix-Marseille, aucune vente ni précommande ouverte) dans `BaseLayout.astro`, `index.astro`, `studio.astro`, `veridia-2140.astro`, `contact.astro`, `public/llms.txt`, `docs/plan-communication.md` et `social/instagram/README.md`.
  - Reformulation du Devlog #2 (`simulation-flux-hydriques-graphes.md`) en modélisation théorique / architecture cible plutôt qu'un binaire déjà livré.
- **Vérifications exécutées :**
  - `npm.cmd run build` & `npm.cmd run audit:seo` (`0 erreur, 0 avertissement`), CI GitHub Actions `43786997403` (`success`).

---

### [2026-11-16 02:19 – 02:31] · Gemini 4 Hydrogen & `image-generator` (Antigravity) — `v1.0.0`
- **Branches / Issues / PRs :** `main` + `docs/comms-plan-and-ai-log` (`PR #6`) + `design/visual-assets-and-instagram-kit` (`PR #7`) + `feat/astro-site-seo-geo` (`PR #8`) -> `develop` -> `main` (`PR #9`) · Issues `#1`, `#2`, `#3`, `#4` (`CLOSED`), Issue `#5` (`OPEN`)
- **Objectif de la session :** Poser l'ensemble des fondations techniques, stratégiques, visuelles et sociales du concours Flexarion.
- **Ce qui a été fait :**
  - Création du dépôt structuré (`README.md`, `CONTRIBUTING.md`, templates `.github/`, workflow CI `.github/workflows/ci-seo.yml`, script `scripts/audit-seo.mjs` avec correctif regex pour les apostrophes françaises).
  - Rédaction de `docs/plan-communication.md` et démarrage de `docs/journal-usage-ia.md`.
  - Choix du concept de jeu sans collision SEO sur Steam/itch.io : **Veridia 2140** (Solarpunk méditerranéen à Aix-en-Provence).
  - Génération de 4 visuels via `image-generator` (`public/images/veridia-hero.jpg`, `public/images/devlog-hydrology.jpg`, `social/instagram/assets/post-01-studio-aix.jpg`, `social/instagram/assets/flexarion-avatar.jpg`) + logo/favicon SVG (`public/favicon.svg`, `public/images/flexarion-logo.svg`).
  - Développement du site Astro (`src/pages/`, `src/layouts/BaseLayout.astro`, `src/content/devlogs/` avec 2 articles complets, `public/robots.txt`, `public/llms.txt`).
  - Rédaction du kit Instagram clé en main (`social/instagram/README.md`) avec stratégie anti-cannibalisation (`@flexarion` principal, `@flexarion_official` redirection/réservation).
- **Pourquoi ces choix :**
  - Astro choisi pour obtenir du HTML/CSS pré-rendu 100 % lisible par Googlebot sans dépendance VPS tout en restant extensible en SSR/PHP si besoin.
  - Dépôt local placé dans un sous-dossier `Flexarion/` dédié pour éviter d'envoyer les PDF du cours ou les captures d'écran personnelles sur GitHub.
