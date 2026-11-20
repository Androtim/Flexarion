---
title: "Devlog #5 : La carte du jour, la même partie pour tout le monde"
seoTitle: "Devlog #5 : la carte du jour de Veridia 2140 | Flexarion"
description: "Veridia 2140 passe en version 0.3 : une carte du jour identique pour tous les joueurs, et le partage du score. Comment une date devient une carte."
pubDate: 2026-11-20
author: "Équipe Flexarion"
authorRole: "Game design & développement, Aix-en-Provence"
tag: "Mise à jour"
readingTime: "4 min de lecture"
image: "/images/devlog-carte-du-jour.jpg"
imageAlt: "Fin de partie dans Veridia 2140 : « La ville a soif », avec le bouton Partager mon score"
summaryPoints:
  - "Nouveau dans la version 0.3 : la carte du jour et le partage du score."
  - "Comment une date devient une graine, et une graine devient la même carte pour tout le monde."
  - "Pourquoi la partie libre reste au hasard."
---

« J'ai tenu jusqu'au jour 7. » D'accord, mais sur quelle carte ? Tant que chaque partie tire ses cartes au hasard, deux scores ne se comparent pas vraiment : l'un a peut-être eu la rivière au mauvais endroit, l'autre trois quartiers collés à la source.

La version 0.3 de Veridia 2140 règle ça avec la **carte du jour**.

## Ce qui change

- **Deux façons de jouer.** Au lancement, vous choisissez entre la **carte du jour** et la **partie libre**.
- **La carte du jour est la même pour tout le monde.** Tous les joueurs reçoivent exactement la même suite de cartes, du jour 1 jusqu'à la fin. Elle change à minuit.
- **Un record par jour.** Le jeu garde votre meilleur résultat sur la carte du jour, à côté de votre record général.
- **Partager son score.** À la fin de la partie, le bouton « Partager mon score » prépare un message du genre « Veridia 2140 (carte du jour du 20 novembre) : je suis allé jusqu'au jour 7 et j'ai livré 1 240 m³ d'eau 💧 Et toi ? », avec le lien du jeu. Sur téléphone, il ouvre directement le menu de partage ; sur ordinateur, il copie le message.

## Comment une date devient une carte

Toute la génération du jeu, des rochers aux noms des quartiers, passe par un générateur de nombres pseudo-aléatoires : à partir d'un nombre de départ, la *graine*, il produit toujours la même suite de nombres. Même graine, même carte. C'est ce qui nous permettait déjà de tester 480 cartes de façon reproductible.

Pour la carte du jour, il suffit donc de transformer la date en graine. Nous passons le texte `veridia-2140:2026-11-20` dans une petite fonction de hachage (FNV-1a), qui le change en un nombre de 32 bits :

```ts
export function dailySeed(date: string): number {
  let h = 2166136261;
  for (const ch of `veridia-2140:${date}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
```

Le même jour, tout le monde obtient le même nombre, donc les mêmes cartes. Le lendemain, un seul caractère change, et le hachage donne un nombre complètement différent. Aucun serveur n'est nécessaire : chaque navigateur recalcule la carte de son côté. Un test automatique vérifie à chaque modification que deux parties lancées à la même date ont des cartes identiques, et que le lendemain elles diffèrent.

Une subtilité : seules les **cartes** sont communes. Les urgences, elles, apparaissent près de *votre* réseau, qui n'est jamais le même d'un joueur à l'autre. Deux joueurs partent donc du même terrain, mais chaque partie garde sa part d'imprévu.

## Et la partie libre ?

Elle reste au hasard. C'est le mode pour s'entraîner, rejouer une partie ratée sans attendre minuit, ou découvrir des cartes différentes.

## À vous

La carte du jour est en ligne : [jouer à Veridia 2140](/jouer/). Partagez votre score en commentaire sous nos vidéos (TikTok [@flexarion_studio](https://www.tiktok.com/@flexarion_studio), Instagram [@flexarion](https://www.instagram.com/flexarion/)) : on regarde qui tient le plus longtemps. Et si vous avez une idée pour le jeu, c'est au même endroit, avec le défi [La ville des joueurs](/devlogs/defi-ville-des-joueurs/).
