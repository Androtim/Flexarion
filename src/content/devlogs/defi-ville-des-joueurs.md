---
title: "Devlog #4 : La ville des joueurs, vos idées dans Veridia 2140"
seoTitle: "Devlog #4 : vos idées entrent dans Veridia 2140 | Flexarion"
description: "Comment Flexarion fait entrer dans Veridia 2140, tous les deux jours, l'idée la plus aimée en commentaire sur TikTok, Instagram et YouTube."
pubDate: 2026-11-19
author: "Équipe Flexarion"
authorRole: "Communauté & game design, Aix-en-Provence"
tag: "Communauté"
readingTime: "4 min de lecture"
image: "/images/devlog-defi.jpg"
imageAlt: "Bilan de fin de journée dans Veridia 2140 : quartiers servis, urgences, améliorations à acheter et lien pour proposer une idée"
summaryPoints:
  - "Le principe : tous les deux jours, le commentaire le plus aimé entre dans le jeu."
  - "Quelles idées peuvent entrer, et lesquelles on refuse."
  - "Ce qui se passe côté code, du commentaire à la nouvelle version."
---

Veridia 2140 est jouable depuis quelques jours. Maintenant, on veut que ce soient les joueurs qui décident de la suite. D'où le défi **La ville des joueurs**.

## Le principe

1. **On publie une vidéo de vote** sur TikTok ([@flexarion_studio](https://www.tiktok.com/@flexarion_studio)), Instagram ([@flexarion](https://www.instagram.com/flexarion/)) et YouTube Shorts.
2. **Vous proposez une idée en commentaire.**
3. **Deux jours plus tard, le commentaire le plus aimé gagne.** Nous l'ajoutons au jeu, le numéro de version augmente, et l'ajout apparaît sur [la page Jouer](/jouer/), avec votre pseudo si vous êtes d'accord.

Pas de lot, pas de tirage au sort : ce n'est pas un concours. Votre idée dans le jeu, c'est la récompense.

## Quelles idées peuvent entrer ?

Le jeu tient en une règle : amener l'eau aux quartiers d'Aix avant la fin de la journée. Les idées qui s'y branchent le plus facilement :

- **Une urgence :** un nouvel événement à sauver en quelques secondes. Feu dans la pinède de la Sainte-Victoire, fontaine des Quatre-Dauphins à sec…
- **Un lieu :** un quartier, une source ou un obstacle du Pays d'Aix.
- **Une amélioration :** quelque chose à acheter entre deux journées.
- **Une règle :** la nuit, la pluie, un quartier qui boit double un jour de marché…

Une idée trop grande pour deux jours (« ajouter le multijoueur ») sera découpée : on en fait la plus petite version jouable, et on l'explique dans la vidéo suivante. Nous gardons un droit de veto sur ce qui est offensant ou hors sujet ; dans ce cas, c'est l'idée suivante qui passe.

## Ce qui se passe côté code

Tout le contenu du jeu vit dans un seul fichier, `src/viaducs/content.ts` : les noms des quartiers, des sources, des urgences, et les réglages des améliorations. Ajouter une urgence, par exemple, c'est souvent une ligne :

```ts
export const EMERGENCIES = [
  "Feu de garrigue",
  "Hôpital du Pays d'Aix",
  // …
  "Fontaine des Quatre-Dauphins", // idée du vote n°1
];
```

Les ajouts plus profonds (une nouvelle règle, une amélioration) touchent la simulation. Avant chaque mise en ligne, nos tests automatiques revérifient 480 cartes et font jouer un joueur automatique : une idée ne doit jamais rendre le jeu impossible.

Ensuite, la nouvelle version part en même temps sur le site et sur [itch.io](https://flexarion-studio.itch.io/), et une courte vidéo montre l'ajout dans le jeu.

## Participer

Le jeu est gratuit et se joue dans le navigateur : [jouer à Veridia 2140](/jouer/). Les règles complètes du défi et la liste des ajouts sont sur la même page. À vous de jouer, et de proposer.
