# Game Jolt : tout ce qu'il faut remplir

Images prêtes dans `social/gamejolt/images/` (numérotées dans l'ordre où on te les demande).
Zip du jeu : `social/itch/veridia-2140-web-v0.3.1.zip` (le plus récent dans `social/itch/`).

---

## 1. Profil (Edit profile)

| Champ | À mettre |
|---|---|
| **Username** | `flexarion` |
| **Display name** | `Flexarion` |
| **Avatar** | `images/1-avatar.jpg` |
| **Header** (bannière du profil) | `images/3-banniere.jpg` |
| **Website** | `https://flexarion.alwaysdata.net` |

**Tell people about yourself** (bio, en anglais puis en français, car Game Jolt est surtout anglophone) :

> Flexarion is a small sci-fi game studio from Aix-en-Provence, France. We make Veridia 2140, a free browser puzzle where you route water through pipes and stone viaducts to keep a future Provence alive. No enemies, just thirst.
>
> Flexarion est un studio de jeux vidéo de science-fiction à Aix-en-Provence. Notre jeu, Veridia 2140, est gratuit et se joue dans le navigateur.
>
> Student project (BUT Informatique, IUT d'Aix-Marseille): free, no ads, no data collected.
> Official site: https://flexarion.alwaysdata.net
> Play: https://flexarion.alwaysdata.net/jouer/

**Liens / réseaux** (si Game Jolt propose les champs, sinon ignorer) :
- YouTube : `https://www.youtube.com/@Flexarion-studio`
- X / Twitter : `https://x.com/FlexarionStudio`
- TikTok : `https://www.tiktok.com/@flexarion_studio`
- Instagram : `https://www.instagram.com/flexarion/`
- itch.io : `https://flexarion-studio.itch.io/`

---

## 2. Page du jeu (Dashboard → Add your game)

### Infos de base
| Champ | À mettre |
|---|---|
| **Title** | `Veridia 2140` |
| **Short description** / tagline (si demandé) | `Route water through pipes and viaducts across a procedurally generated Provence in 2140. Free, in your browser.` |
| **Category / Type** | Game |
| **Genre** | Puzzle (secondaire : Strategy) |
| **Engine / Creation tool** | Other / HTML5 (« Custom » si proposé) |
| **Development status** | In development / Early access (« Devlog » si demandé) |
| **Maturity** | All ages / Everyone (aucune violence, aucun contenu sensible) |
| **Language** | French |
| **Website** (si champ) | `https://flexarion.alwaysdata.net/jouer/` |

### Tags (8 max en général)
`puzzle` · `strategy` · `html5` · `browser` · `scifi` · `solarpunk` · `procedural` · `relaxing` (ou `french`)

### Images
| Emplacement | Fichier |
|---|---|
| **Thumbnail** (miniature 16:9) | `images/2-miniature-jeu.jpg` |
| **Header** (bannière de la page) | `images/3-banniere.jpg` |
| **Media / Screenshots** | `images/4-capture-reseau.jpg`, `5-capture-eau.jpg`, `6-capture-ameliorations.jpg`, `7-capture-fin-de-partie.jpg` |
| **Video** (champ YouTube, facultatif) | `https://www.youtube.com/watch?v=3cmC7k321xE` |

### Description (coller tel quel)

**Veridia 2140** is a short, free puzzle-strategy game by **Flexarion**, set in Aix-en-Provence (France) in 2140.

Every day brings a new procedurally generated map of the Aix area. Draw pipes from the water source to every district, open the valves, and deliver everyone's water within 40 seconds. Then upgrade your network, because tomorrow will be harder.

**How to play**
- **Drag** from the source to lay pipes; start a drag on a pipe to remove it.
- Rivers and ravines need a **viaduct**, which costs 2 pipes.
- Water splits **equally** at every junction, and a pipe carries at most 7 m³/s: with many districts, one trunk is not enough.
- From day 2, **emergencies** pop up (wildfire, a hospital running dry): you have a few seconds to bring water there.
- Between days, spend credits on **flow speed**, **water supply** or **more pipes**. Unused pipes earn a **sobriety bonus**: the best network is the shortest one.

**Daily map:** everyone gets the same maps on the same day, so you can compare scores. A free mode with random maps is also available.

**Your ideas in the game:** every two days, the most-liked idea in the comments of our TikTok and Instagram videos is added to the game.

The interface is in **French**, but the game is mostly drag-and-watch.

---

**Veridia 2140** est un jeu de puzzle et de stratégie gratuit de **Flexarion**, à Aix-en-Provence en 2140 : tracez tuyaux et viaducs, livrez l'eau aux quartiers en 40 secondes, répondez aux urgences et améliorez votre réseau. Carte du jour identique pour tous, partie libre, et vos idées entrent dans le jeu tous les deux jours.

Flexarion is a fictional studio created for a student project (BUT Informatique, IUT d'Aix-Marseille). Free, no ads, no data collected.

- Official site: https://flexarion.alwaysdata.net
- Play on our site: https://flexarion.alwaysdata.net/jouer/
- Devlogs: https://flexarion.alwaysdata.net/devlogs/
- Also on itch.io: https://flexarion-studio.itch.io/veridia-2140

---

## 3. Le jeu lui-même (Packages)
1. **Packages → Add package** : nom `Veridia 2140 (web)`.
2. **New release** : version `0.3.1` (même numéro que le zip).
3. **Upload build** : le zip `veridia-2140-web-v0.3.1.zip`, type **Browser / HTML**.
4. **Dimensions** : `960 × 760`. Cocher **« Allow fullscreen »** si proposé.
5. Publier la release, puis **publier le jeu** (bouton « Publish » ou « Make public »).

## 4. Après la publication
- Copie l'adresse de la page du jeu et envoie-la-moi : je l'ajoute dans les profils `sameAs` du site (signal de marque pour Google), comme itch.io.
- Pour chaque nouvelle version : nouvelle release avec le nouveau zip et le numéro de version.

---

## 5. Post Game Jolt v0.4 (21/11)
Release : nouvelle version `0.4` dans le package, zip `veridia-2140-web-v0.4.zip`. Image : `public/images/devlog-saison.jpg`.

**Titre :** Veridia 2140 v0.4: Season mode, a network that grows with the city

> New way to play: **Season mode**. One big map for the whole run, and your pipes stay from one day to the next. Every morning a construction site becomes a new district you have to connect (you can see the future sites from day 1, so plan your trunk lines). +3 pipes per day, a free upgrade every 7 days, and a **thirst gauge** instead of trust: it rises when districts go dry, and the season ends at 100%.
>
> The trap: one pipe carries 7 m³/s. By day 8, the neat network you built on day 3 becomes the city's bottleneck.
>
> How we keep every day of a season solvable (French, with details): https://flexarion.alwaysdata.net/devlogs/mode-saison-reseau-persistant/
> Play: https://flexarion.alwaysdata.net/jouer/
>
> How many days do you last?
