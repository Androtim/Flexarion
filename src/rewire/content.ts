// REWIRE v0.3 : refonte totale — carte qui s'agrandit (7×7 → 23×23), physique de flux/goulots, dynamo à surchauffe.

export const REWIRE_VERSION = "0.3";

export const WORLD_SIZE = 23;
export const WORLD_CENTER = 11;

export interface ZoneDef {
  zone: number;
  radius: number; // taille visible = (radius * 2 + 1)
  unlockCost: number;
  newPlants: number;
  newCities: number;
  plantMw: number;
  cityDemand: number;
}

export const ZONES: ZoneDef[] = [
  { zone: 1, radius: 3, unlockCost: 0, newPlants: 1, newCities: 2, plantMw: 14, cityDemand: 8 },
  { zone: 2, radius: 5, unlockCost: 220, newPlants: 1, newCities: 2, plantMw: 20, cityDemand: 11 },
  { zone: 3, radius: 7, unlockCost: 700, newPlants: 2, newCities: 2, plantMw: 24, cityDemand: 14 },
  { zone: 4, radius: 9, unlockCost: 2000, newPlants: 2, newCities: 3, plantMw: 28, cityDemand: 17 },
  { zone: 5, radius: 11, unlockCost: 5500, newPlants: 2, newCities: 3, plantMw: 32, cityDemand: 21 },
];

export type ToolId = "cable" | "solar" | "wind" | "battery" | "substation" | "convert" | "erase";

export interface ToolDef {
  id: ToolId;
  name: string;
  baseCost: number;
  growth: number;
  help: string;
}

export const TOOLS: ToolDef[] = [
  { id: "cable", name: "Câble HT", baseCost: 3, growth: 1.0, help: "Capacité 18 MW par fil : au-delà, le câble sature et perd l'excédent !" },
  { id: "solar", name: "Solaire", baseCost: 22, growth: 1.26, help: "10 MW de jour (+60 % dalle dorée, −40 % sous smog fossile)." },
  { id: "wind", name: "Éolienne", baseCost: 30, growth: 1.26, help: "9 MW variable (+60 % couloir vent, −35 % par éolienne collée)." },
  { id: "battery", name: "Batterie", baseCost: 35, growth: 1.24, help: "Stocke 45 MWh (14 MW max) pour survivre à la nuit et aux pics." },
  { id: "substation", name: "Poste HT", baseCost: 55, growth: 1.3, help: "+35 % aux sources voisines et double la capacité des câbles adjacents." },
  { id: "convert", name: "Reconvertir", baseCost: 120, growth: 2.0, help: "Coupe une centrale brutaliste (120 / 240 / 480 cr…) et supprime son smog." },
  { id: "erase", name: "Retirer", baseCost: 0, growth: 1.0, help: "Supprime un câble ou bâtiment (rembourse 50 % du coût de base)." },
];

export type UpgradeId = "dynamo" | "cables" | "solar" | "wind" | "smartgrid" | "biomoss";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  maxLevel: number;
  baseCost: number;
  costMult: number;
  help: string;
}

export const TECH_UPGRADES: UpgradeDef[] = [
  { id: "dynamo", name: "Dynamo d'urgence", maxLevel: 4, baseCost: 45, costMult: 2.5, help: "Clic plus puissant (crédits + MW) et refroidissement plus rapide." },
  { id: "cables", name: "Supraconducteurs", maxLevel: 4, baseCost: 65, costMult: 2.5, help: "+50 % de capacité MW par câble (élimine les goulots d'étranglement)." },
  { id: "solar", name: "Cellules tandem", maxLevel: 3, baseCost: 85, costMult: 2.4, help: "+35 % de production sur tous vos panneaux solaires." },
  { id: "wind", name: "Turbines haute altitude", maxLevel: 3, baseCost: 95, costMult: 2.4, help: "+35 % de production sur toutes vos éoliennes." },
  { id: "smartgrid", name: "Smart Grid", maxLevel: 3, baseCost: 110, costMult: 2.5, help: "+35 % de tarif de vente par MW vert livré aux quartiers." },
  { id: "biomoss", name: "Bio-mousse active", maxLevel: 2, baseCost: 130, costMult: 2.6, help: "×1,8 vitesse de renaturation du béton brutaliste." },
];

export const REWIRE_RULES = {
  startCredits: 40,
  dayDurationSec: 42,
  solarPeakMw: 10,
  windBaseMw: 9,
  batteryCapMwh: 45,
  gravityTowerCapMwh: 120,
  batteryRateMw: 15,
  baseCableCapMw: 18,
  fossilTaxPerSec: 0.75,
  buildingUpkeepPerSec: 0.12,
  basePricePerMwGreen: 0.24,
  basePricePerMwFossil: 0.08,
  stabilityDrainPerSec: 16,
  stabilityRecoverPerSec: 8,
  renatureRatePerSec: 0.06,
  expandMinRenature: 0.75,
};

export const DISTRICT_NAMES = [
  "Cœur Béton",
  "Gare Haute",
  "Les Ateliers",
  "Secteur Nord",
  "Docks Est",
  "Belvédère",
  "Quartier Sud",
  "Fonderies",
  "Terrasses",
  "Arches Ouest",
  "Silo Central",
  "Pôle Est",
];
