# Workflow Vidéos Reels — REWIRE (Flexarion)

Ce dossier contient tout ce qu'il faut pour produire et publier la série de **Reels interactifs** autour de **REWIRE** (*Recâblez le réseau. Libérez le béton.*).

## 1. Générer une vidéo (1 commande)

Les épisodes sont décrits dans `social/rewire/episodes.json`.

- **Aperçu rapide (images fixes JPEG en 2 s) :**
  ```bash
  npm run rewire:reel -- --ep=1 --preview
  ```
- **Vidéo verticale pour TikTok / Instagram Reels (1088×1920, compatible VLC) :**
  ```bash
  npm run rewire:reel -- --ep=1
  ```
- **Vidéo verticale pour YouTube Shorts (1080×1920) :**
  ```bash
  npm run rewire:reel -- --ep=1 --youtube
  ```
- **Avec votre voix off enregistrée sur téléphone (normalisation automatique à −14 LUFS) :**
  ```bash
  npm run rewire:reel -- --ep=1 --audio=/chemin/vers/voix-ep1.m4a
  ```

*(Sans `--audio`, le fichier a une piste silencieuse propre : ajoutez simplement une musique libre de la bibliothèque TikTok, Instagram ou YouTube au moment de publier.)*

---

## 2. Ajouter l'épisode suivant (format « top commentaire liké »)

- **Épisode 1 (pilote) :** vote A / B pour lancer le projet.
- **À partir de l'épisode 2 :** ce sont les spectateurs qui proposent eux-mêmes ! On sélectionne **le commentaire le plus liké** sur nos réseaux (TikTok / Instagram / YouTube Shorts) pour l'intégrer dans REWIRE.

Pour générer l'épisode suivant :
1. Relevez le **commentaire le plus liké** sous le Reel précédent.
2. Ajoutez un objet `"id": 2` dans `social/rewire/episodes.json` en utilisant les scènes `winner_feature` (affiche l'idée gagnante ajoutée au jeu) puis `top_comment_cta` (appelle la communauté à proposer la prochaine idée en commentaire) :
   ```json
   {
     "type": "winner_feature",
     "start": 0,
     "end": 10,
     "lines": ["Vous l'avez demandé,", "on l'a ajouté !"],
     "sub": "REWIRE · Épisode 2",
     "ideaTitle": "Nom de l'idée gagnante",
     "ideaDetail": "Courte explication de la mécanique",
     "credit": "Top commentaire sur TikTok / Instagram"
   },
   {
     "type": "top_comment_cta",
     "start": 20,
     "end": 32,
     "lines": ["À vous de jouer !"],
     "sub": "Proposez votre idée en commentaire",
     "promptLine1": "Quelle mécanique",
     "promptLine2": "on ajoute ensuite ?"
   }
   ```
3. Lancez `npm run rewire:reel -- --ep=2` (ajoutez `--audio=/chemin/voix.m4a` si vous avez enregistré une voix off).
4. Publiez sur Instagram Reels (`@flexarion`), TikTok (`@flexarion_studio`) et YouTube Shorts (`@Flexarion-studio`).

---

## 3. Textes prêts à coller — Épisode 1 (Pilote)

**Légende (TikTok / Instagram / YouTube Shorts) :**
> Épisode 1 : on lance REWIRE, le nouveau jeu de Flexarion (Factorio × Terra Nil, 100 % électricité verte). Votez A ou B en commentaire ! ⚡🌱
> Cherchez « Flexarion » sur Google ou lien en bio : https://flexarion.alwaysdata.net/jeux/rewire/
> #Flexarion #RewireGame #IndieGame #GameDev #Ecologie #Solarpunk

**Commentaire à épingler immédiatement après publication :**
> ⚡ VOTE ÉPISODE 1 (REWIRE) :
> A = Reconvertir les tours brutalistes en stockage gravitaire
> B = Volants d'inertie géants pour absorber les pics de charge
>
> Dites A ou B en commentaire, et proposez vos idées électriques pour l'épisode 2 !
