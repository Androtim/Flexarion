---
title: "Devlog #2 : Simuler l'eau et les réseaux mycéliens par graphes orientés"
seoTitle: "Devlog #2 : Graphes de flux hydriques dans Veridia 2140 | Flexarion"
description: "Plongée technique dans le moteur de Veridia 2140 : modélisation des aqueducs par graphes orientés, évaporation et échanges mycéliens."
pubDate: 2026-11-16
author: "Équipe Technique Flexarion"
authorRole: "Ingénierie Simulation & Systèmes — Aix-en-Provence"
tag: "Ingénierie & Simulation"
readingTime: "6 min de lecture"
image: "/images/devlog-hydrology.jpg"
imageAlt: "Schéma isométrique d'un dôme Solarpunk montrant les canaux d'eau turquoise et les nœuds mycéliens luminescents"
summaryPoints:
  - "Modéliser le réseau d'aqueducs sous forme de graphe orienté pondéré par l'altitude et l'évaporation."
  - "Coupler un automate cellulaire de température de surface avec la diffusion racinaire du mycélium."
  - "Garantir une simulation déterministe à 60 images par seconde même avec plusieurs milliers de nœuds."
---

Dans un jeu de gestion comme **Veridia 2140**, le pire ennemi de l'immersion est la « ressource abstraite » : ce moment où l'eau et l'électricité sont de simples compteurs globaux en haut de l'écran, déconnectés de la géographie de votre cité.

Chez **Flexarion**, comme nous venons d'un cursus d'ingénierie logicielle à Aix-en-Provence, nous avons formalisé dès la phase de conception une architecture déterministe où **chaque canal, chaque citerne et chaque racine compte physiquement**.

## 1. L'aqueduc comme graphe orienté pondéré

Une cité-dôme provençale est organisée en restanques (terrasses successives). Nous représentons l'ensemble du réseau hydraulique par un graphe orienté `G = (V, E)` où :

- Chaque **sommet `v ∈ V`** est un bassin tampon, une station de phyto-épuration ou une parcelle agricole possédant une altitude `z_v` et un volume stocké.
- Chaque **arête `e = (u → v) ∈ E`** représente un canal ou une conduite souterraine dotée d'une section maximale `C_e` et d'un coefficient d'exposition solaire.

À chaque *tick* de simulation (10 fois par seconde en jeu), le débit transféré dépend directement de la différence de charge hydraulique et de l'évaporation sur le tronçon :

```ts
interface CanalEdge {
  from: string;
  to: string;
  capacityMax: number;
  isCovered: boolean; // Réduit l'évaporation de 85 % sous pergola solaire
}

function computeTransfer(uAltitude: number, vAltitude: number, edge: CanalEdge, heatIndex: number): number {
  const gravityBonus = Math.max(0.2, 1 + (uAltitude - vAltitude) * 0.15);
  const evapFactor = edge.isCovered ? 0.97 : Math.max(0.55, 1 - heatIndex * 0.08);
  return Math.min(edge.capacityMax, edge.capacityMax * gravityBonus * evapFactor);
}
```

Ce modèle simple en apparence produit immédiatement des dilemmes de joueur passionnants : faut-il creuser un canal à ciel ouvert (peu coûteux mais vulnérable aux canicules) ou investir dans des pergolas photovoltaïques qui produisent de l'électricité tout en ombrageant l'eau ?

## 2. Le réseau mycélien et la thermorégulation

La seconde couche du jeu repose sur un **réseau mycélien symbiotique** enterré sous les terrasses végétales. Techniquement, il fonctionne en couplage avec une grille thermique 2D (automate cellulaire) :

1. Les zones exposées au soleil sans couvert végétal accumulent de la chaleur rayonnante.
2. Les nœuds mycéliens redistribuent l'humidité excédentaire des bassins vers les îlots de chaleur voisins selon un algorithme de diffusion pondérée à faible coût (`O(k · |V|)` par frame).
3. En retour, si la température dépasse un seuil critique sans apport hydrique, les filaments entrent en dormance et le joueur voit la bioluminescence s'estomper sur la carte — un retour visuel immédiat sans aucune fenêtre d'alerte intrusive.

## 3. Concevoir un moteur fluide (cible 60 FPS)

Pour éviter de recalculer tout le graphe à chaque image affichée dans notre architecture cible :
- La topologie n'est ré-indexée (tri topologique + détection de boucles de pompage) que lorsqu'un joueur construit ou détruit un tronçon.
- La résolution des flux tourne sur un pas de temps fixe découplé du rendu graphique.
- Toute la simulation est **déterministe** : deux parties lancées avec la même graine (*seed*) et les mêmes actions produisent exactement le même bilan hydrique, ce qui facilite grandement nos tests automatisés.

Envie de réagir à ces choix d'architecture ou de suivre nos avancées ? Retrouvez nos prochains aperçus visuels sur notre compte Instagram officiel [@flexarion](https://instagram.com/flexarion) ou découvrez l'ensemble de la fiche du jeu sur la page dédiée à [Veridia 2140](/jeux/veridia-2140/).
