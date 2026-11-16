# Flexarion Studio — Site Officiel, Stratégie Digitale & Concours SEO

[![SEO & Build CI](https://github.com/Androtim/Flexarion/actions/workflows/ci-seo.yml/badge.svg)](https://github.com/Androtim/Flexarion/actions/workflows/ci-seo.yml)

> **Studio de développement de jeux vidéo indépendant · Science-Fiction Solarpunk · Aix-en-Provence**  
> Projet réalisé dans le cadre du module *Plan de communication & webmarketing à l'ère de l'IA* (BUT Informatique 2e année — IUT d'Aix-Marseille).

---

## Le Studio & Le Jeu Phare

- **Nom du studio :** Flexarion (Aix-en-Provence, France)
- **Jeu phare :** **VERIDIA 2140** — City-builder & stratégie éco-futuriste (*Solarpunk méditerranéen*) autour de dômes autonomes et réseaux mycéliens en Provence.
- **Compte Instagram principal :** [@flexarion](https://instagram.com/flexarion) *(compte de redirection : `@flexarion_official`)*

---

## Architecture Technique & SEO/GEO

Le site est conçu avec **Astro** en architecture modulaire prête pour la production :
- **Performance maximale (Core Web Vitals)** : génération de HTML/CSS pur sans JavaScript bloquant inutile, compatible tout hébergement (**GitHub Pages**, **Alwaysdata**, **Hostinger**, serveur Apache/Nginx ou PHP).
- **Architecture en silo stricte** :
  - `/` — Accueil & positionnement global **Flexarion**
  - `/studio/` — Silo Studio (histoire, équipe d'Aix-en-Provence, manifeste Solarpunk, transparence IA)
  - `/jeux/veridia-2140/` — Silo Jeu Phare (univers, mécaniques hydriques/mycéliennes, modèle économique, galerie, FAQ)
  - `/devlogs/` — Silo Journal de développement (`#1 Genèse Solarpunk` & `#2 Simulation de flux par graphes`)
  - `/contact/` — Page Contact, Dossier Presse & réseaux officiels
- **GEO (Generative Engine Optimization)** : données structurées **JSON-LD Schema.org** (`Organization`, `VideoGame`, `BlogPosting`, `FAQPage`, `BreadcrumbList`), sections Q/R claires et fichier `/llms.txt`.

---

## Structure du Dépôt

```text
Flexarion/
├── .github/                  # Templates d'Issues/PR & workflow CI SEO automatisé
├── docs/
│   ├── plan-communication.md # SWOT, Personas, SMART, Positionnement, Silo, SMO
│   └── journal-usage-ia.md   # Journal factuel des outils & prompts IA utilisés
├── public/
│   ├── images/               # Logo SVG, Key Art Veridia 2140, concepts Devlogs
│   ├── llms.txt              # Index structuré pour moteurs IA (GEO)
│   └── robots.txt            # Directives d'indexation moteurs de recherche
├── scripts/
│   └── audit-seo.mjs         # Audit SEO technique post-build automatisé
├── social/
│   └── instagram/            # Kit complet prêt à poster (bios, calendrier, assets)
└── src/
    ├── content/devlogs/      # Articles de devlog en Markdown typé
    ├── layouts/              # Layout SEO centralisé (Meta, OpenGraph, JSON-LD)
    ├── components/           # Composants UI réutilisables (Header, Footer, FAQ)
    └── pages/                # Pages du site organisées en silos
```

---

## Démarrage Local

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement local
npm run dev

# 3. Compiler le site de production et lancer l'audit SEO automatisé
npm run build
npm run audit:seo
```

---

## Règle de Publication du Concours

Conformément au règlement du concours SEO inter-groupes (CM2), **le dépôt sert d'environnement de collaboration technique**, tandis que la **mise en ligne publique sur l'hébergement final et la soumission Google Search Console** sont déclenchées à la date officielle définie en CM2 afin de respecter l'équité entre groupes.
