# Instructions pour les Agents IA — Flexarion Studio

> **Protocole obligatoire :** Tout agent IA (Claude, Gemini, Antigravity, Cursor, Codex, etc.) travaillant sur ce dépôt doit **lire `AI_HANDOFF.md` avant toute modification**, puis **ajouter une entrée structurée en haut du journal dans `AI_HANDOFF.md`** (et compléter `docs/journal-usage-ia.md` si applicable) avant de livrer ses changements.

---

## 1. Contexte du Projet & Règles du Concours (Non Négociables)

- **Cadre :** Module universitaire *Plan de communication & webmarketing à l'ère de l'IA* (BUT Informatique 2e année, IUT d'Aix-Marseille).
- **Concept imposé :** Studio indépendant de jeux vidéo **Flexarion**, spécialisé en **science-fiction**, basé à **Aix-en-Provence**.
- **Jeu phare retenu :** **Veridia 2140** (*Solarpunk méditerranéen — City-builder & simulation hydrique/mycélienne en Provence*).
- **Règle d'équité (Publication) :** La mise en ligne publique et l'indexation Google (GitHub Pages / Alwaysdata + Google Search Console) sont **synchronisées avec le CM2**. Tant que le feu vert du CM2 n'est pas donné par l'utilisateur, **ne pas déployer de site public ni activer de déploiement automatique**.
- **Règle éthique & transparence :**
  - Interdiction stricte du *Black Hat SEO* (bourrage de mots-clés, fermes de liens, cloaking, contenu dupliqué).
  - Ne jamais ajouter de faux prix, de bouton d'achat, de `Offer`/`PreOrder` JSON-LD ni de fausses promesses commerciales : Flexarion Studio et *Veridia 2140* doivent rester clairement identifiés comme un **concept académique fictif (IUT d'Aix-Marseille)**.
- **Règle spéciale sur l'IA :** Le journal d'usage (`docs/journal-usage-ia.md`) et `AI_HANDOFF.md` peuvent être tenus avec l'IA, mais **ne jamais rédiger ni réviser la synthèse réflexive finale (1–2 pages) du TD4** — elle doit être 100 % humaine.

---

## 2. Architecture Technique & Choix à Préserver

- **Stack :** Astro `6.4.8` (`static` SSG par défaut, compatible hébergement statique ou serveur PHP/Node) + `@astrojs/sitemap`.
- **Architecture en silo SEO :**
  - `/` (Accueil & positionnement global)
  - `/studio/` (Silo 1 — Identité aixoise, équipe, manifeste, transparence IA)
  - `/jeux/veridia-2140/` (Silo 2 — Dossier jeu phare, mécaniques, FAQ)
  - `/devlogs/` + `/devlogs/<id>/` (Silo 3 — Carnets de développement Markdown typés dans `src/content.config.ts`)
  - `/contact/` (Contact & Kit Presse)
  - Éviter le maillage transversal anarchique entre silos profonds (respecter la structure du [CM2](docs/plan-communication.md)).
- **Direction Artistique « Anti-AI-Slop » (`docs/brand-guidelines.md`) :**
  - Palette éditoriale claire : papier calcaire (`#F5F0E6`), pierre sablée (`#EBE3D3`), encre (`#121917`), pin (`#155E44`), terre cuite (`#A95A22`). **Ne pas revenir à un dark-mode SaaS à halos néon ni aux badges pilules/grilles de cartes uniformes.**
  - Typographies auto-hébergées en WOFF2 (`@fontsource-variable/fraunces`, `@fontsource-variable/dm-sans`, `@fontsource/ibm-plex-mono`) : **aucune requête externe Google Fonts** (LCP + RGPD).
  - Éviter les surcharges de tirets cadratins (`—`) et le jargon marketing générique dans les textes français.
- **Images :** Utiliser `src/components/ResponsivePicture.astro` (WebP `640w`/`1280w` + fallback JPG optimisé via `npm run optimize:images`).

---

## 3. Workflow Git d'Entreprise & Vérifications

1. Partir de `develop` à jour (`git checkout develop && git pull`) et créer une branche dédiée (`feat/...`, `fix/...`, `docs/...`, `design/...`, `perf/...`).
2. Lier les commits (Conventional Commits) et la Pull Request à une Issue GitHub.
3. **Avant tout commit/PR**, exécuter impérativement :
   ```bash
   npm run build
   npm run audit:seo
   ```
   *(Sous Windows avec Restriction PowerShell, utiliser `npm.cmd` et `npx.cmd`.)*
4. Vérifier que le build génère `sitemap-index.xml`, `robots.txt`, `llms.txt`, un seul `<h1>` par page, des `<title>` / `<meta description>` uniques, du JSON-LD valide et aucun lien interne cassé.
5. **Mettre à jour `AI_HANDOFF.md`** (en haut de la section historique) avant de finaliser la PR.
