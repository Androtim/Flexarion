# Reddit : où et quoi poster (compte u/flexarion_official)

Vidéo à joindre à chaque post : `social/reddit/veridia-2140-gameplay.mp4` (16 s, sans son, 1440×960).

## Règles d'or (sinon le compte est filtré ou banni)
1. **Un sub par jour maximum**, jamais le même texte copié partout le même jour.
2. **Lire les règles du sub avant** (colonne de droite / « About ») : certains n'acceptent l'autopromo qu'un jour précis ou dans un fil hebdomadaire.
3. **Dire clairement que c'est notre jeu, et un projet étudiant.** Ne jamais demander de votes positifs.
4. **Répondre à chaque commentaire** dans les heures qui suivent : c'est ce qui fait remonter un post.
5. **Compte neuf :** beaucoup de subs retirent automatiquement les posts des comptes sans « karma ». Avant le premier post, laisse 5 à 10 commentaires sincères dans des fils de r/aixenprovence, r/WebGames ou r/indiegames (avis sur un jeu, réponse à une question).
6. Le jeu est **en français** : on le dit dans les subs anglophones (les mécaniques se comprennent sans texte).

## Calendrier conseillé
| Jour | Sub | Pourquoi |
|---|---|---|
| Ven. 20/11 | r/aixenprovence | Local, francophone, le jeu se passe à Aix : le meilleur public |
| Sam. 21/11 | r/playmygame | Fait exactement pour présenter son jeu |
| Dim. 22/11 | r/proceduralgeneration | Angle technique (carte du jour, cartes vérifiées) |
| Lun. 23/11 | r/WebGames | Jeux jouables dans le navigateur |
| Mer. 25/11 | r/solarpunk | Le thème (eau, sobriété, Provence 2140) |
| Ven. 27/11 | r/IndieGaming ou r/indiegames | Large public indé (vérifier le jour d'autopromo) |

À éviter : r/gamedev (pas d'autopromo hors fils dédiés), r/france (règles strictes), poster dans plusieurs subs le même jour.

---

## 1. r/aixenprovence (français)
**Type :** vidéo (upload du mp4) + lien en premier commentaire.
**Titre :** `On a fait un petit jeu gratuit où il faut amener l'eau aux quartiers d'Aix en 2140 (Mazarin, Les Milles, Jas de Bouffan…)`
**Texte / premier commentaire :**
> Salut ! On est étudiants en BUT Informatique à l'IUT d'Aix, et pour un projet on a créé un studio de jeux fictif, Flexarion, avec un vrai jeu jouable : Veridia 2140.
>
> Le principe : chaque jour, une carte du Pays d'Aix. Tu traces des tuyaux depuis le Canal de Provence ou le barrage de Bimont jusqu'aux quartiers, tu franchis l'Arc en viaduc (clin d'œil à Roquefavour), et tu as 40 secondes pour que tout le monde ait de l'eau. Il y a des urgences (feu de garrigue, fontaine de la Rotonde à sec…) et une « carte du jour » identique pour tout le monde, pour comparer les scores.
>
> C'est gratuit, sans pub, ça marche sur téléphone : https://flexarion.alwaysdata.net/jouer/
>
> Et si vous avez une idée de lieu aixois à ajouter (un quartier, une urgence…), dites-la : on ajoute les meilleures idées au jeu tous les deux jours. Vos retours nous aident beaucoup !

## 2. r/playmygame (anglais)
**Type :** vidéo + texte. Mettre le flair demandé par le sub (souvent « PC/Browser »).
**Titre :** `Veridia 2140 – a free browser puzzle where you route water through pipes and viaducts to keep a 2140 Aix-en-Provence alive`
**Texte :**
> Hi! We're a small student team (IUT d'Aix-Marseille, France) and this is our browser game, Veridia 2140.
>
> Each day you get a procedurally generated map of the Aix-en-Provence area. Drag pipes from the water source to every district, bridge rivers with viaducts (they cost 2 pipes), open the valves and deliver everyone's water in 40 seconds. From day 2, emergencies pop up (wildfires, a hospital running dry) and you have a few seconds to reroute water. Between days you upgrade flow speed, water supply or pipe count.
>
> There's a **daily map** that's the same for every player, so you can compare scores.
>
> Play (free, no ads, works on mobile): https://flexarion.alwaysdata.net/jouer/ — also on itch: https://flexarion-studio.itch.io/veridia-2140
>
> Note: the UI is in French for now, but it's mostly drag-and-watch. Would love feedback on difficulty: how far did you get?

## 3. r/proceduralgeneration (anglais)
**Type :** vidéo + texte technique.
**Titre :** `Generating a daily map that's identical for every player and always solvable (browser puzzle, no server)`
**Texte :**
> For our student project (Veridia 2140, a water-routing puzzle set in a future Aix-en-Provence), every day starts on a new map: a river, dry ravines, rocks, protected pine forests, 1–2 sources and 2–7 districts.
>
> Two things we found interesting:
>
> **1. Always solvable.** After generating, the map checks itself: it builds a greedy Steiner-like network (repeated multi-source Dijkstra from the current tree to the nearest unconnected district, viaduct tiles cost double). If that network doesn't fit the player's pipe budget minus a small reserve for emergencies, the map is thrown away and re-rolled; after 60 failures the day gets one district fewer. A test script checks 480 maps on every commit, plus a bot that plays 30 games.
>
> **2. Daily map without a server.** The seed is just an FNV-1a hash of `veridia-2140:YYYY-MM-DD`, fed into mulberry32. Same date → same seed → same maps in every browser; the next day one character changes and the hash is completely different. Only terrain is shared: emergencies spawn near *your* network, so runs still diverge.
>
> Write-up (French, with code): https://flexarion.alwaysdata.net/devlogs/carte-du-jour-generation-deterministe/
> Play: https://flexarion.alwaysdata.net/jouer/
>
> Happy to hear how others handle solvability checks for generated puzzle maps.

## 4. r/WebGames (anglais)
**Type :** **lien direct** vers le jeu (le sub l'exige) : `https://flexarion.alwaysdata.net/jouer/`
**Titre :** `Veridia 2140 – route water to every district before the day ends, with viaducts, emergencies and a daily map [French UI, mobile-friendly]`
**Premier commentaire :**
> Dev here (student project). Drag from the source to lay pipes, start a drag on a pipe to remove it, then hit the orange button to open the valves. Rivers and ravines need viaducts (2 pipes). Tell me your best day on today's daily map!

## 5. r/solarpunk (anglais)
**Type :** vidéo + texte, angle thème.
**Titre :** `We made a small solarpunk puzzle game about sharing water in a 2140 Provence: the best network is the shortest one`
**Texte :**
> Veridia 2140 is set in Aix-en-Provence in 2140, after the great droughts. No enemies: your opponent is thirst. You route water from canals and dams to every district through pipes and stone viaducts, respond to wildfires and dry hospitals, and the game rewards sobriety. Every pipe you *don't* use gives a bonus, so the best network is the leanest one.
>
> It's a student project (free, no ads, browser/mobile, French UI): https://flexarion.alwaysdata.net/jouer/
> The world behind it: https://flexarion.alwaysdata.net/jeux/veridia-2140/univers/
>
> Curious what solarpunk mechanics you'd want in a game like this. Players' ideas get added every two days.

## 6. r/IndieGaming / r/indiegames (anglais)
Réutiliser le texte de r/playmygame, avec un titre différent :
`Veridia 2140: a 40-second water-routing puzzle where every day is a new procedurally generated map of a future Provence`

---

## Après chaque post
- Note le lien du post et le nombre de visites dans un tableau (utile pour l'oral).
- Si un post marche bien, envoie-le-moi : je regarde ce qui a plu pour le suivant.
