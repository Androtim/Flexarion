// REWIRE : réglages et catalogue du prototype (100 % électricité, brutalisme → renaturation).

export const REWIRE_VERSION = "0.1";

export type ToolId = "cable" | "solar" | "wind" | "battery" | "convert" | "erase";

export interface ToolDef {
  id: ToolId;
  name: string;
  cost: number;
  help: string;
}

export const TOOLS: ToolDef[] = [
  { id: "cable", name: "Câble HT", cost: 1, help: "Relie centrales, stockages et quartiers." },
  { id: "solar", name: "Solaire", cost: 8, help: "11 MW en plein jour (+35 % sur zone solaire), 0 la nuit." },
  { id: "wind", name: "Éolienne", cost: 12, help: "6–12 MW selon le vent (+40 % sur couloir de vent)." },
  { id: "battery", name: "Stockage", cost: 14, help: "Stocke 45 MWh de surplus et évite les blackouts." },
  { id: "convert", name: "Reconvertir", cost: 10, help: "Débranche une centrale brutaliste et la convertit." },
  { id: "erase", name: "Retirer", cost: 0, help: "Supprime un câble ou bâtiment (rembourse 50 %)." },
];

export const REWIRE_RULES = {
  w: 14,
  h: 10,
  startCredits: 75,
  dayDurationSec: 36,
  fossilOutputMw: 13,
  solarPeakMw: 11,
  windBaseMw: 9,
  batteryCapMwh: 45,
  gravityTowerCapMwh: 90,
  batteryRateMw: 16,
  stabilityDrainPerSec: 16,
  stabilityRecoverPerSec: 10,
  incomePerSec: 2.2,
  greenBonusIncome: 1.4,
  renatureRatePerSec: 0.085,
  victoryRenature: 0.92,
};

export const DISTRICT_NAMES = [
  "Secteur Nord",
  "Cité Béton",
  "Gare Haute",
  "Les Ateliers",
  "Quartier Sud",
  "Belvédère",
];
