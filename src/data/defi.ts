// Défi « La ville des joueurs » : tous les 2 jours, l'idée la plus aimée en commentaire
// (TikTok, Instagram) entre dans Veridia 2140. Une entrée par ajout, la plus récente en premier.

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
