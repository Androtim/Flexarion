// REWIRE v0.2 : jeu incrémental d'optimisation électrique (Cookie Clicker × Factorio × Terra Nil).

export const REWIRE_VERSION = "0.2";

export type ToolId = "cable" | "solar" | "wind" | "battery" | "substation" | "convert" | "erase";

export interface ToolDef {
  id: ToolId;
  name: string;
  baseCost: number;
  growth: number;
  help: string;
}

export const TOOLS: ToolDef[] = [
  { id: "cable", name: "Câble HT", baseCost: 2, growth: 1.0, help: "Relie le réseau. Trop de MW sur un seul fil = surcharge !" },
  { id: "solar", name: "Solaire", baseCost: 14, growth: 1.24, help: "9 MW de jour (+50 % dalle dorée, +20 % près stockage). Prix croissant." },
  { id: "wind", name: "Éolienne", baseCost: 20, growth: 1.24, help: "8 MW variable (+50 % couloir vent, −25 % si collée à une autre)." },
  { id: "battery", name: "Stockage", baseCost: 24, growth: 1.22, help: "+50 MWh de réserve pour tenir la nuit et les pics du soir." },
  { id: "substation", name: "Poste HT", baseCost: 36, growth: 1.28, help: "+25 % aux sources voisines et soulage la surcharge des lignes." },
  { id: "convert", name: "Reconvertir", baseCost: 85, growth: 2.1, help: "Coupe une centrale brutaliste (85 / 178 / 375 cr.) pour lancer la renaturation." },
  { id: "erase", name: "Retirer", baseCost: 0, growth: 1.0, help: "Supprime un câble ou bâtiment (rembourse 50 %)." },
];

export type UpgradeId = "click" | "wind" | "solar" | "cables" | "smartgrid" | "biomoss";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  maxLevel: number;
  baseCost: number;
  costMult: number;
  help: string;
}

export const TECH_UPGRADES: UpgradeDef[] = [
  { id: "click", name: "Alternateur manuel", maxLevel: 4, baseCost: 18, costMult: 2.4, help: "Augmente les crédits et MWh générés à chaque clic." },
  { id: "solar", name: "Cellules pérovskites", maxLevel: 3, baseCost: 40, costMult: 2.3, help: "+35 % de production sur tous vos panneaux solaires." },
  { id: "wind", name: "Pales aérodynamiques", maxLevel: 3, baseCost: 45, costMult: 2.3, help: "+30 % de production sur toutes vos éoliennes." },
  { id: "cables", name: "Câbles supraconducteurs", maxLevel: 3, baseCost: 50, costMult: 2.4, help: "+55 % de capacité par ligne (supprime les surcharges)." },
  { id: "smartgrid", name: "Smart Grid", maxLevel: 3, baseCost: 55, costMult: 2.4, help: "+40 % de revenus par MW d'électricité verte produite." },
  { id: "biomoss", name: "Bio-mousse active", maxLevel: 2, baseCost: 70, costMult: 2.5, help: "×1,8 vitesse de renaturation du béton brutaliste." },
];

export const REWIRE_RULES = {
  w: 14,
  h: 10,
  startCredits: 18,
  dayDurationSec: 40,
  fossilOutputMw: 16,
  fossilTaxPerSec: 0.55,
  solarPeakMw: 9,
  windBaseMw: 8,
  batteryCapMwh: 50,
  gravityTowerCapMwh: 110,
  batteryRateMw: 18,
  baseLineCapMw: 22,
  stabilityDrainPerSec: 15,
  stabilityRecoverPerSec: 9,
  baseRevenuePerMw: 0.14,
  renatureRatePerSec: 0.055,
  victoryRenature: 0.94,
};

export const DISTRICT_NAMES = [
  "Secteur Nord",
  "Cité Béton",
  "Gare Haute",
  "Les Ateliers",
  "Quartier Sud",
  "Belvédère",
  "Docks Est",
];
