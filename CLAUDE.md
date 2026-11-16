# CLAUDE.md — Instructions pour Claude / Claude Code

Bienvenue sur le dépôt **Flexarion Studio** (`Androtim/Flexarion`).

1. **Lis impérativement `AGENTS.md` et `AI_HANDOFF.md`** avant de toucher au moindre fichier : `AGENTS.md` contient toutes les contraintes du concours et de design, et `AI_HANDOFF.md` résume exactement ce qui a déjà été fait par les agents précédents et ce qui reste à traiter.
2. **Ne casse pas les choix existants** sans accord explicite de l'utilisateur :
   - Le site est en ligne sur https://flexarion.alwaysdata.net (déploiement anticipé validé par l'utilisateur) : vérifie build + audit avant chaque `rsync`.
   - Conserve la mention académique transparente (zéro faux prix / précommande).
   - Préserve l'esthétique éditoriale calcaire (`#F5F0E6` / `Fraunces` / `DM Sans` / `IBM Plex Mono`) et les polices locales WOFF2 (zéro appel externe Google Fonts).
   - Ne rédige jamais la synthèse réflexive finale du TD4 (interdite par le règlement du cours).
3. **À la fin de ta session :**
   - Vérifie `npm run build && npm run audit:seo` (ou `npm.cmd` sous Windows).
   - Ajoute ton compte rendu détaillé en haut de **`AI_HANDOFF.md`** (et mets à jour `docs/journal-usage-ia.md` si pertinent) afin que l'équipe et les prochains agents IA sachent exactement ce que tu as fait, pourquoi, et quoi faire ensuite.
