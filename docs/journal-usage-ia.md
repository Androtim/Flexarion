# Journal d'Usage de l'IA — Studio Flexarion

> **Conformité Règle Spéciale (Brief §6) :**  
> Ce document est un **journal factuel** recensant les outils, modèles, prompts clés et apports/corrections humaines tout au long du projet.  
> ⚠️ **Rappel impératif :** La *synthèse réflexive finale (1 à 2 pages)* à rendre pour le TD4 doit être **intégralement rédigée à la main par les étudiants sans aucune IA générative**.

---

## 1. Tableau de Suivi Chronologique

| Date | Phase / Tâche | Modèle / Outil IA utilisé | Prompt / Intention résumée | Vérification & Apport humain (Esprit critique) |
| :--- | :--- | :--- | :--- | :--- |
| 2026-11-16 | Analyse du brief & stratégie multi-modèles | **Gemini 4 Hydrogen** (Antigravity) + Recherche Web | Analyser les 3 CM, le brief étudiant et la discussion Discord technique (Nuxt vs statique, domaine Hostinger vs GitHub Pages). | Décision humaine de refuser l'achat d'un nom de domaine neuf (pénalité d'indexation §3.2) et d'éviter le déploiement avant le CM2 (règle d'équité). Arbitrage pour Astro SSG plutôt qu'une SPA pure. |
| 2026-11-16 | Choix du concept de jeu & anti-collision SEO | **Gemini 4 Hydrogen** + Vérification SERP | Générer 3 propositions de jeux SF hors exemple du prof et vérifier l'absence de titres concurrents sur Steam/itch.io. | Sélection du concept **VERIDIA 2140** (Solarpunk méditerranéen à Aix-en-Provence) pour maximiser l'originalité E-E-A-T et l'ancrage local. |
| 2026-11-16 | Gouvernance Git & CI SEO automatisée | **Gemini 4 Hydrogen** | Mettre en place un repo pro (`main`/`develop`/PRs, Conventional Commits, Issues, script `audit-seo.mjs` en CI). | Validation du périmètre : exclusion des PDF de cours et captures privées hors du dépôt public. |
| 2026-11-16 | Identité visuelle & Concept Arts | Sous-agent `image-generator` + SVG | Générer 4 visuels Solarpunk sans texte parasite (key art Sainte-Victoire 2140, schéma hydrique isométrique, terrasse studio Aix, avatar Instagram). | Contrôle visuel humain de chaque image (vérification de la cohérence palette `#08141E` / `#2ED39A` / `#F5B841`, absence d'artefacts texte, cadrage rond pour l'avatar). |
| 2026-11-16 | Architecture Site Astro, SEO/GEO & Devlogs #1–#2 | **Gemini 4 Hydrogen** (structure) *(+ polissage prévu sur Claude Opus 5.5 / relecture groupe)* | Construire les 5 pages en silo, JSON-LD `Schema.org`, `llms.txt`, `sitemap` et les 2 premiers devlogs techniques. | À compléter lors de la relecture du groupe : personnalisation des prénoms réels, anecdotes étudiantes aixoises et réécriture manuelle des accroches. |
| 2026-11-16 | Kit Instagram (`@flexarion` & `@flexarion_official`) | **Gemini 4 Hydrogen** | Rédiger les bios (≤150 car.), stratégie anti-cannibalisation et calendrier des 8 premiers posts. | Publication et adaptation humaine des légendes en temps réel lors du lancement CM2/TD2. |
| 2026-11-16 | Correctif éthique & transparence académique | **Gemini 4 Hydrogen** (sur alerte critique de l'étudiant) | Supprimer le faux prix/précommande JSON-LD et ajouter un disclaimer académique IUT d'Aix-Marseille explicite sans casser le storytelling. | Excellent exemple d'esprit critique humain face à l'IA : l'étudiant a détecté le risque de tromperie commerciale sur un site public indexé. |
| 2026-11-16 | Refonte éditoriale anti-AI-slop | **Gemini 4 Hydrogen** + Recherche Web design 2026 | Identifier les marqueurs visuels typiques des sites générés par IA (dark mode néon, pill badges, grilles de cartes identiques, surusage de `—`) et refondre en monographie calcaire (`Fraunces` / `DM Sans` / `IBM Plex Mono`). | Passage d'une UI générique sombre à une direction artistique provençale sur-mesure vérifiée visuellement sur navigateur local. |
| 2026-11-16 | Optimisation LCP & RGPD suite à Lighthouse | **Gemini 4 Hydrogen** (d'après audit Lighthouse 13.5 fourni par l'étudiant : LCP 1,6s / score 0,75) | Compression WebP responsive (`sharp` : 1,15 Mo -> 61 Ko WebP 640w), `fetchpriority="high"` + preload, et auto-hébergement local des polices WOFF2 (`@fontsource`). | Suppression du CSS bloquant Google Fonts (bonus RGPD) et gain majeur sur le poids de la page d'accueil. |
| 2026-11-16 | Hébergement anticipé, signaux de marque SEO, identité visuelle vectorielle | **Claude Opus 5.5** (Claude Code) | Réserver `flexarion.alwaysdata.net` avant les autres groupes, déployer en avance, renforcer les données structurées (`WebSite`, `Organization`), créer la page Univers et redessiner le logo en SVG à partir des vraies polices du site. | Choix humain de mettre le site en ligne avant le CM2 pour gagner des jours d'indexation. L'IA a détecté une installation npm incomplète (polices absentes du site déployé) et des erreurs dans le logo généré par IA (style néon incohérent avec la charte). |
| 2026-11-16 | Refonte visuelle v2 « carte d'abord » | **Claude Opus 5.5** (Claude Code) + recherche web | Rechercher les marqueurs visuels des sites générés par IA, puis refondre le site autour d'un panorama SVG interactif et de schémas propres au jeu. | L'IA a constaté que la v1 « anti-AI-slop » (crème + serif + étiquettes monospace) était elle-même devenue un style IA reconnaissable : esprit critique sur les tendances. Validation visuelle humaine avant mise en ligne. |

---

## 2. Observations Critiques relevées en cours de route *(notes brutes pour la future synthèse manuelle)*

- **Limites observées sur l'IA :**
  - Tendance initiale des LLM à proposer des thèmes SF génériques proches de l'exemple du sujet (stations spatiales dystopiques) si on ne contraint pas fortement l'ancrage géographique et le ton.
  - Risque d'ajouter du jargon marketing creux dans les textes si l'on n'impose pas des détails d'ingénierie concrets (ex. modélisation par graphes orientés et bilans hydriques dans le Devlog #2).
  - Impossibilité de déléguer aveuglément le SEO hors-site ou Instagram à un bot (risque de blocage de compte neuf et perte de voix de marque).
- **Gains réels constatés :**
  - Automatisation immédiate des garde-fous techniques (`audit-seo.mjs`, `Schema.org`, contrôle de hiérarchie `Hn` et `alt`) qui élimine les erreurs bêtes dès le premier commit.
  - Prototypage rapide d'une direction artistique cohérente entre le site et Instagram.

---

## 3. Espace Notes Personnelles du Groupe *(à remplir à la main après les TD)*

- *Ce que Claude Opus 5.5 / DeepSeek / Gemini ont fait différemment lors de nos tests comparatifs :* `[À noter par le groupe]`
- *Résultats réels Google Search Console & Lighthouse après mise en ligne au CM2 :* `[À noter par le groupe]`
