# Guide de Contribution — Flexarion Studio

Ce dépôt suit un workflow professionnel proche d'un studio produit afin de garder un historique propre, traçable et collaboratif entre les membres du groupe.

## Workflow Git (GitHub Flow / Git Flow léger)

- **`main`** : branche de production stable. Tout ce qui est sur `main` doit compiler (`npm run build`) et passer `npm run audit:seo`.
- **`develop`** : branche d'intégration des fonctionnalités avant merge sur `main`.
- **Branches de travail** : créer une branche par tâche liée à une Issue GitHub :
  - `feat/<sujet>` (nouvelle page, composant, article de devlog)
  - `docs/<sujet>` (plan de communication, journal IA, README)
  - `design/<sujet>` (identité visuelle, CSS, assets)
  - `fix/<sujet>` (correctif SEO, lien cassé, accessibilité)
  - `ci/<sujet>` (workflows GitHub Actions, scripts d'audit)

## Convention de Commits (Conventional Commits)

```text
<type>(<portée>): <description courte à l'impératif>

Exemples :
docs(comms): rédiger le plan de communication et l'architecture en silo (#1)
feat(web): ajouter la page phare Veridia 2140 avec Schema.org VideoGame (#4)
fix(seo): corriger la longueur des meta descriptions sur les devlogs
```

Types autorisés : `feat`, `fix`, `docs`, `design`, `seo`, `ci`, `chore`.

## Pull Requests & Qualité

Avant d'ouvrir une PR vers `develop` ou `main` :
1. Exécuter `npm run build && npm run audit:seo`.
2. Lier l'Issue associée (`Closes #<id>`).
3. Mettre à jour `docs/journal-usage-ia.md` si une IA a été utilisée pour la génération ou l'audit.
4. **Rappel strict du cours** : la *synthèse réflexive finale* sur l'usage de l'IA ne doit jamais être rédigée ou modifiée par une IA.
