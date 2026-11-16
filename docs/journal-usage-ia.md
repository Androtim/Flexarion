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
