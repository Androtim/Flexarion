---
title: "Devlog #3 : On abandonne l'Été 1, place aux viaducs"
seoTitle: "Devlog #3 : Veridia 2140 devient un jeu de viaducs | Flexarion"
description: "Flexarion abandonne son premier prototype et repart sur un jeu de puzzle en temps réel : viaducs, cartes procédurales d'Aix-en-Provence et urgences chronométrées."
pubDate: 2026-11-17
author: "Équipe Flexarion"
authorRole: "Game design & développement, Aix-en-Provence"
tag: "Game design"
readingTime: "5 min de lecture"
image: "/images/devlog-viaducs.jpg"
imageAlt: "Capture du jeu des viaducs : un réseau de tuyaux turquoise relie le Canal de Provence aux quartiers d'Aix, franchit l'Arc en viaduc, pendant qu'une urgence clignote à la Fontaine de la Rotonde"
summaryPoints:
  - "Pourquoi l'Été 1, un city-builder de 90 jours, ne fonctionnait pas sur téléphone."
  - "Le nouveau jeu : une journée de 40 secondes, des tuyaux, des viaducs et des urgences."
  - "Comment le jeu génère une carte d'Aix différente chaque jour, en garantissant qu'elle reste jouable."
---

Il y a quelques jours, nous mettions en ligne **l'Été 1**, notre premier prototype de Veridia 2140 : un city-builder où l'on tient 90 jours d'été en guidant l'eau par gravité. Aujourd'hui, nous l'arrêtons. Il reste [jouable dans nos archives](/jouer/ete-2140/), mais le jeu de [la page Jouer](/jouer/) est désormais tout autre chose.

## Ce qui n'allait pas

Nous avons regardé des amis jouer. Trois choses revenaient à chaque fois :

- **C'était trop long.** Une partie demandait 90 jours de jeu. Sur un téléphone, entre deux cours, personne n'arrivait au bout.
- **On ne comprenait pas pourquoi on perdait.** Eau, chaleur, mycélium, dômes solaires : quand un quartier souffrait, impossible de savoir lequel de ces systèmes était en cause.
- **Il ne se passait rien.** On construisait, puis on regardait le calendrier défiler.

L'idée du nouveau jeu est venue de l'équipe : garder le cœur, l'eau et Aix-en-Provence, et tout le reste devient un **puzzle de stratégie en temps réel**.

## Le jeu des viaducs

Une partie se joue journée par journée, et chaque journée dure **40 secondes** :

1. **Préparer.** Une nouvelle carte du Pays d'Aix apparaît : une source (le Canal de Provence, le barrage de Bimont…), des quartiers (Mazarin, Les Milles, Jas de Bouffan…). On trace des tuyaux du doigt. Les vallons et la rivière de l'Arc se franchissent en **viaduc**, qui coûte deux tuyaux, comme l'aqueduc de Roquefavour enjambe l'Arc depuis 1847.
2. **Ouvrir les vannes.** L'eau avance dans le réseau à la *vitesse d'acheminement*. Chaque quartier doit recevoir son quota avant la fin de la journée.
3. **Répondre aux urgences.** Dès le jour 2, un feu de garrigue ou un hôpital à sec surgit quelque part. Quelques secondes pour y amener l'eau. Il manque des tuyaux ? On reprend ceux d'un quartier déjà servi.
4. **Améliorer.** Entre deux journées, les crédits gagnés achètent de la vitesse, de l'eau disponible ou des tuyaux. Les tuyaux qu'on n'a pas utilisés rapportent un **bonus de sobriété** : le jeu récompense le réseau le plus court, pas le plus gros.

Chaque jour, la carte grandit, les quartiers sont plus nombreux et boivent davantage. Le jeu reste simple à prendre en main, mais la *distribution* devient le vrai casse-tête.

## Partager l'eau : un problème de remplissage

À chaque embranchement, l'eau se partage **à parts égales** entre les branches qui en ont encore besoin. Si une branche demande moins que sa part, le surplus repart vers les autres. C'est un algorithme de *remplissage par niveaux* (on remplit les petits besoins d'abord, puis on répartit ce qui reste) :

```ts
function waterFill(amount: number, limits: number[]): number[] {
  const out = limits.map(() => 0);
  const open = limits.map((_, k) => k).filter((k) => limits[k] > 0);
  let left = amount;
  while (left > 1e-9 && open.length) {
    const share = left / open.length;
    const full = open.filter((k) => limits[k] - out[k] <= share);
    if (!full.length) {
      for (const k of open) out[k] += share;
      break;
    }
    for (const k of full) {
      left -= limits[k] - out[k];
      out[k] = limits[k];
      open.splice(open.indexOf(k), 1);
    }
  }
  return out;
}
```

Une contrainte rend le puzzle intéressant : **un tuyau ne porte pas plus de 7 m³/s**. Avec quatre quartiers qui boivent chacun 3 m³/s, un seul tronc ne suffit plus, il faut deux branches depuis la source. Personne n'a besoin de lire cette règle : on la découvre en voyant une jauge qui monte trop lentement.

## Une carte différente chaque jour, toujours jouable

Le piège de la génération procédurale, c'est la carte impossible : un quartier enfermé derrière des rochers, ou un réseau qui demande plus de tuyaux que le joueur n'en possède. Notre générateur place la rivière, les vallons, les rochers et les pinèdes protégées, puis **vérifie sa propre carte** :

- il cherche un réseau qui relie la source à tous les quartiers. On part de la source et on ajoute à chaque fois le chemin le moins cher vers le quartier le plus proche (algorithme de Dijkstra), les viaducs coûtant double ;
- si ce réseau dépasse les tuyaux du joueur, moins une petite réserve pour les urgences, la carte est jetée et on en tire une autre ;
- au bout de 60 essais ratés, le jour comptera un quartier de moins.

Un script de test vérifie 480 cartes à chaque modification du code, et fait jouer un joueur automatique (plutôt maladroit) sur 30 parties. Il tient en moyenne 5 jours : de quoi laisser de la marge à un humain qui garde des tuyaux pour les urgences.

## Et la suite

Le défi **La ville des joueurs** continue, sur ce nouveau jeu : tous les deux jours, l'idée la plus aimée en commentaire sur nos réseaux entre dans le jeu. Un nouveau type d'urgence, un quartier, une amélioration… À vous de proposer.

[Jouer à Veridia 2140](/jouer/), c'est gratuit et ça se joue dans le navigateur, sur ordinateur comme sur téléphone.
