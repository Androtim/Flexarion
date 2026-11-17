// Contenu du jeu : bâtiments et réglages. C'est ici qu'entrent les ajouts du défi
// « La ville des joueurs » (un nouveau bâtiment = une entrée dans BUILDINGS).

/** Version du prototype : +0.1 à chaque ajout du défi « La ville des joueurs ». */
export const GAME_VERSION = "0.1";

export type BuildingId = "aqueduct" | "basin" | "mycelium" | "dome";

export interface BuildingDef {
  id: BuildingId;
  name: string;
  cost: number;
  key: string;
  help: string;
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  aqueduct: {
    id: "aqueduct",
    name: "Aqueduc",
    cost: 2,
    key: "1",
    help: "Transporte l'eau. Elle ne passe que vers une case plus basse : suivez la pente.",
  },
  basin: {
    id: "basin",
    name: "Bassin",
    cost: 12,
    key: "2",
    help: "Stocke l'eau et rafraîchit les cases autour (−3 °C).",
  },
  mycelium: {
    id: "mycelium",
    name: "Mycélium",
    cost: 5,
    key: "3",
    help: "Réseau vivant : s'il touche de l'eau, il rafraîchit tout autour (−4 °C). Sinon, il s'endort.",
  },
  dome: {
    id: "dome",
    name: "Dôme solaire",
    cost: 20,
    key: "4",
    help: "Produit de l'énergie (+4 crédits par jour) mais réchauffe les cases voisines (+1,5 °C).",
  },
};

export const RULES = {
  days: 90,
  startCredits: 150,
  baseIncome: 3,
  domeIncome: 4,
  refund: 0.5,
  reservoir: { start: 300, cap: 400, inflowStart: 40, inflowEnd: 22, maxOut: 50 },
  /** Débit de la vanne du réservoir au départ (réglable par le joueur, 0 à maxOut). */
  valveStart: 25,
  basinCap: 60,
  quarterDemand: 6,
  /** Puits anciens : part de la demande couverte sans aqueduc, qui baisse pendant l'été. */
  wellsStart: 0.6,
  wellsEnd: 0.15,
  heatwave: { from: 55, to: 62, extra: 3 },
  /** Au-delà de ce seuil, un quartier souffre de la chaleur. */
  heatLimit: 38,
};
