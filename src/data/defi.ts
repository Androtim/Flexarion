// Idées de joueurs ajoutées à Veridia 2140 (affichées sur /jouer/). Une entrée par ajout, la plus récente en premier.
// Le défi « La ville des joueurs » à vote tous les deux jours a été abandonné le 23/11 ; DEFI_VOTE n'est plus affiché.

export interface DefiEntry {
  /** Numéro de l'ajout (1, 2, 3…). */
  numero: number;
  /** Date de publication (AAAA-MM-JJ). */
  date: string;
  /** Le commentaire gagnant, tel que publié. */
  idee: string;
  /** Pseudo de l'auteur, uniquement avec son accord. Sinon : undefined. */
  auteur?: string;
  /** Ce qui a été ajouté au jeu, en une ou deux phrases. */
  ajout: string;
  /** Version du jeu qui contient l'ajout. */
  version: string;
}

export const DEFI_ENTRIES: DefiEntry[] = [];

/**
 * Vote en cours. À mettre à jour à chaque nouvelle vidéo de vote :
 * `url` = lien de la vidéo (TikTok, Instagram ou Short), `closes` = date de clôture (AAAA-MM-JJ).
 * `url: null` : pas de vote ouvert, les liens mènent au profil TikTok.
 */
export const DEFI_VOTE: { round: number; url: string | null; platform: string; closes: string | null } = {
  round: 1,
  url: null,
  platform: "TikTok",
  closes: null,
};
