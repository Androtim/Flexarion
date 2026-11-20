// Veridia 2140 : réglages du jeu. C'est ici qu'entrent les ajouts du défi « La ville des joueurs ».

/** Version du jeu : +0.1 à chaque ajout du défi. */
export const GAME_VERSION = "0.3";

export const TUNING = {
  /** Durée d'une journée, vannes ouvertes (secondes). */
  dayLength: 40,
  /** Part de la journée qu'il faut couvrir pour remplir le quota d'un quartier. */
  quotaShare: 0.5,
  /** Débit maximal qui passe dans un tuyau (m³/s). */
  pipeCapacity: 7,
  /** Coût en tuyaux d'une case de vallée ou de rivière : il faut un viaduc. */
  viaductCost: 2,
  trustMax: 3,
  credits: { quarter: 10, emergency: 12, sparePipe: 1, perfect: 5 },
};

export type UpgradeId = "speed" | "water" | "pipes";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  help: string;
  unit: string;
  max: number;
  value: (level: number) => number;
  cost: (level: number) => number;
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  speed: {
    id: "speed",
    name: "Vitesse d'acheminement",
    help: "L'eau avance plus vite dans les tuyaux : les urgences lointaines deviennent possibles.",
    unit: "cases/s",
    max: 5,
    value: (l) => 1.5 + 0.75 * l,
    cost: (l) => 20 + 15 * l,
  },
  water: {
    id: "water",
    name: "Eau disponible",
    help: "Les sources donnent plus d'eau chaque seconde : plus de quartiers servis en même temps.",
    unit: "m³/s",
    max: 6,
    value: (l) => 8 + 3 * l,
    cost: (l) => 20 + 15 * l,
  },
  pipes: {
    id: "pipes",
    name: "Tuyaux",
    help: "Plus de tuyaux à poser chaque jour : des réseaux plus longs, ou une réserve pour les urgences.",
    unit: "tuyaux",
    max: 6,
    value: (l) => 12 + 4 * l,
    cost: (l) => 20 + 15 * l,
  },
};

/** Quartiers d'Aix (réels) dans lesquels le jeu pioche chaque jour. */
export const DISTRICTS = [
  "Mazarin",
  "Les Milles",
  "Jas de Bouffan",
  "Encagnane",
  "Pont de l'Arc",
  "Puyricard",
  "Luynes",
  "Les Facultés",
  "Saint-Mitre",
  "La Duranne",
  "Célony",
  "Le Tholonet",
  "Sextius",
  "Les Platanes",
];

export const SOURCES = ["Canal de Provence", "Barrage de Bimont", "Source de la Torse", "Barrage Zola"];

/** Urgences : il faut amener de l'eau à cet endroit avant la fin du compte à rebours. */
export const EMERGENCIES = [
  "Feu de garrigue",
  "Départ de feu, Sainte-Victoire",
  "Hôpital du Pays d'Aix",
  "Serres de Luynes",
  "Fontaine de la Rotonde",
  "Ferme urbaine",
  "Îlot de chaleur",
];
