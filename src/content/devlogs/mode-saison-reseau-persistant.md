---
title: "Devlog #6 : Le mode saison, un réseau qui grandit avec la ville"
seoTitle: "Devlog #6 : le mode saison de Veridia 2140 | Flexarion"
description: "Veridia 2140 passe en version 0.4 : le mode saison. Une seule carte, un réseau qui reste d'un jour à l'autre, un nouveau quartier chaque jour et une jauge de soif."
pubDate: 2026-11-21
author: "Équipe Flexarion"
authorRole: "Game design & développement, Aix-en-Provence"
tag: "Mise à jour"
readingTime: "4 min de lecture"
image: "/images/devlog-saison.jpg"
imageAlt: "Mode saison de Veridia 2140 au jour 6 : un réseau de tuyaux relie sept quartiers, des chantiers en pointillés attendent plus bas"
summaryPoints:
  - "Nouveau dans la version 0.4 : le mode saison, avec un réseau qui reste d'un jour à l'autre."
  - "Un chantier devient un quartier chaque jour, et une jauge de soif remplace la confiance."
  - "Comment le jeu choisit l'ordre des quartiers pour que chaque journée reste jouable."
---

Dans la partie normale, chaque jour efface tout : nouvelle carte, réseau vide. C'est ce qui rend les journées courtes et nerveuses, mais on perd quelque chose. Le réseau qu'on a mis 40 secondes à optimiser disparaît, et les choix d'hier ne comptent plus.

La version 0.4 ajoute un deuxième rythme : le **mode saison**.

## Ce qui change

- **Une seule carte pour toute la saison.** Plus grande que les cartes normales (16 × 11 cases), avec deux sources, la rivière de l'Arc et ses vallons.
- **Votre réseau reste.** Les tuyaux posés hier sont encore là ce matin, et ceux qui étaient en eau le sont toujours : l'eau n'a pas à refaire tout le trajet.
- **Un nouveau quartier chaque jour.** Les futurs quartiers sont visibles dès le début, en chantier (des carrés en pointillés). Chaque matin, l'un d'eux devient habité, et il faut le relier. Vous recevez 3 tuyaux de plus par jour.
- **La soif remplace la confiance.** Chaque quartier privé d'eau fait monter la jauge de soif de la ville, une urgence manquée aussi. Une journée parfaite la fait redescendre. À 100 %, la saison s'arrête.
- **Un choix par semaine.** Tous les 7 jours, une amélioration est offerte : vitesse, eau ou tuyaux, à vous de choisir. La boutique reste ouverte comme d'habitude.

Le record de saison est gardé à part : il ne se compare pas avec la partie libre.

## La vraie difficulté : penser à demain

En partie normale, le meilleur réseau est le plus court. En saison, ce n'est plus vrai. Le chemin le plus court vers les deux premiers quartiers passe peut-être pile entre deux chantiers, et dans trois jours il faudra tout refaire. Les chantiers sont là pour ça : on voit où la ville va pousser, et on peut poser un tronc principal qui servira plus tard.

Il y a aussi un piège. Un tuyau ne porte pas plus de 7 m³/s. Au jour 8, avec neuf quartiers qui boivent chacun 3 m³/s, un seul tronc ne suffit plus. Le réseau qui marchait très bien au jour 3 devient le goulot d'étranglement de la ville, et il faut ouvrir une deuxième branche depuis l'autre source.

## Comment le jeu garde chaque journée jouable

Dans la partie normale, chaque carte est vérifiée à sa création (voir le [devlog #3](/devlogs/pivot-viaducs-generation-procedurale/)) : le jeu cherche un réseau qui relie tous les quartiers et vérifie qu'il tient dans vos tuyaux. En saison, c'est plus délicat : la carte doit être jouable au jour 1, au jour 2, et ainsi de suite jusqu'au dernier chantier.

Le jeu génère donc la carte et ses 12 quartiers d'un coup, puis il construit un réseau « glouton » : à chaque étape, il relie le quartier le moins cher à atteindre depuis le réseau déjà construit. **L'ordre dans lequel ce réseau relie les quartiers devient l'ordre dans lequel ils deviennent habités.** La ville pousse donc naturellement de proche en proche, depuis les sources.

Ensuite, il fait les comptes. Au jour *d*, il faut relier les quartiers habités avec les tuyaux de base (12, plus 3 par jour), en gardant une petite réserve pour les urgences. Si une seule journée ne passe pas, la carte est jetée et le jeu en tire une autre. Notre script de test vérifie ainsi 440 journées de saison sur 40 cartes à chaque modification, et un joueur automatique (très naïf : il prolonge le réseau au plus court, sans penser aux chantiers) tient entre 6 et 9 jours.

## Et ensuite

Le mode saison est fait pour durer plus longtemps qu'une partie normale, mais il finit toujours : les quartiers boivent un peu plus chaque jour. Dites-nous jusqu'où vous allez, et ce qui manque. L'idée la plus aimée en commentaire sur nos réseaux entre dans le jeu.

[Jouer au mode saison](/jouer/)
