// Simulation électrique en temps réel pour REWIRE (100 % électricité, zéro eau).
import { REWIRE_RULES, TOOLS, type ToolId } from "./content";
import { generateRewireMap, idx, type RewireLevel } from "./level";

export type CellKind =
  | "empty"
  | "cable"
  | "fossil"
  | "gravity_tower"
  | "city"
  | "solar"
  | "wind"
  | "battery";

export interface Modifiers {
  /** Option A du Vote Épisode 1 : les centrales brutalistes reconverties deviennent des tours gravitaires 90 MWh. */
  gravityTowers: boolean;
  /** Option B du Vote Épisode 1 : volants d'inertie absorbant 2x mieux les pics et stabilisant la fréquence. */
  flywheels: boolean;
}

export interface RewireState {
  seed: number;
  level: RewireLevel;
  cells: CellKind[];
  /** Niveau de renaturation visuelle par case (0 = béton brutaliste, 1 = vivant). */
  green: number[];
  /** Indique si la case appartient à un réseau alimenté. */
  powered: boolean[];
  credits: number;
  timeSec: number;
  hour: number;
  sunFactor: number;
  windFactor: number;
  demandMw: number;
  fossilMw: number;
  greenMw: number;
  totalProdMw: number;
  storageMwh: number;
  storageCapMwh: number;
  /** Part d'électricité propre dans la production (0..1). */
  greenShare: number;
  /** Fréquence simulée du réseau (50.0 Hz nominal). */
  frequencyHz: number;
  /** Stabilité globale (0..100). Blackout à 0. */
  stability: number;
  /** Score moyen de renaturation de la carte (0..1). */
  renature: number;
  poweredCities: number;
  fossilRemaining: number;
  phase: "play" | "won" | "blackout";
  modifiers: Modifiers;
  message: string;
}

const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function newRewireGame(seed: number, modifiers: Modifiers = { gravityTowers: true, flywheels: false }): RewireState {
  const level = generateRewireMap(seed);
  const total = level.w * level.h;
  const cells: CellKind[] = new Array(total).fill("empty");
  for (const p of level.plants) cells[idx(level.w, p.x, p.y)] = "fossil";
  for (const c of level.cities) cells[idx(level.w, c.x, c.y)] = "city";
  for (const [cx, cy] of level.initialCables) cells[idx(level.w, cx, cy)] = "cable";

  const state: RewireState = {
    seed,
    level,
    cells,
    green: new Array(total).fill(0),
    powered: new Array(total).fill(false),
    credits: REWIRE_RULES.startCredits,
    timeSec: 8 * (REWIRE_RULES.dayDurationSec / 24), // démarre à 08h00
    hour: 8,
    sunFactor: 0.7,
    windFactor: 0.65,
    demandMw: 0,
    fossilMw: 0,
    greenMw: 0,
    totalProdMw: 0,
    storageMwh: 0,
    storageCapMwh: 0,
    greenShare: 0,
    frequencyHz: 50,
    stability: 100,
    renature: 0,
    poweredCities: level.cities.length,
    fossilRemaining: level.plants.length,
    phase: "play",
    modifiers: { ...modifiers },
    message: "Posez du solaire, des éoliennes et du stockage, puis reconvertissez les centrales brutalistes.",
  };
  evaluateGrid(state, 0);
  return state;
}

export function toolCost(tool: ToolId): number {
  return TOOLS.find((t) => t.id === tool)?.cost ?? 0;
}

export function applyTool(s: RewireState, tool: ToolId, x: number, y: number): boolean {
  if (s.phase !== "play") return false;
  if (x < 0 || y < 0 || x >= s.level.w || y >= s.level.h) return false;
  const k = idx(s.level.w, x, y);
  const cur = s.cells[k];
  const ter = s.level.terrain[k];
  const cost = toolCost(tool);

  if (tool === "erase") {
    if (cur === "cable" || cur === "solar" || cur === "wind" || cur === "battery") {
      const refund = Math.floor(toolCost(cur) * 0.5);
      s.cells[k] = "empty";
      s.credits += refund;
      evaluateGrid(s, 0);
      return true;
    }
    return false;
  }

  if (tool === "convert") {
    if (cur !== "fossil") return false;
    if (s.credits < cost) {
      s.message = `Il faut ${cost} crédits pour reconvertir cette centrale brutaliste.`;
      return false;
    }
    s.credits -= cost;
    s.cells[k] = s.modifiers.gravityTowers ? "gravity_tower" : "cable";
    s.message = s.modifiers.gravityTowers
      ? "Centrale brutaliste reconvertie en tour de stockage gravitaire (+90 MWh) !"
      : "Centrale brutaliste débranchée ! Assurez la relève avec le renouvelable.";
    evaluateGrid(s, 0);
    return true;
  }

  if (ter === "rubble") return false;
  if (cur !== "empty") return false;
  if (s.credits < cost) {
    s.message = `Crédits insuffisants (${cost} requis).`;
    return false;
  }

  s.credits -= cost;
  s.cells[k] = tool;
  evaluateGrid(s, 0);
  return true;
}

function isConductive(c: CellKind): boolean {
  return c !== "empty";
}

function evaluateGrid(s: RewireState, dt: number): void {
  const { w, h } = s.level;
  const dayFrac = (s.timeSec % REWIRE_RULES.dayDurationSec) / REWIRE_RULES.dayDurationSec;
  s.hour = dayFrac * 24;

  // Courbes réalistes soleil (0 la nuit, pic à 13h), vent (rafales douces) et demande (pics matin/soir)
  const sunRaw = Math.sin(((s.hour - 6) / 13) * Math.PI);
  s.sunFactor = s.hour >= 6 && s.hour <= 19 ? Math.max(0, sunRaw) : 0;
  s.windFactor = 0.55 + 0.4 * Math.sin(s.timeSec * 0.22 + s.seed) + 0.15 * Math.cos(s.timeSec * 0.51);
  s.windFactor = Math.max(0.2, Math.min(1.15, s.windFactor));

  const eveningPeak = Math.exp(-Math.pow((s.hour - 19.5) / 2.6, 2)) * 0.35;
  const morningPeak = Math.exp(-Math.pow((s.hour - 9) / 2.2, 2)) * 0.15;
  const demandMult = 0.85 + eveningPeak + morningPeak;

  // Composantes connexes électriques (BFS)
  const visited = new Uint8Array(w * h);
  s.powered.fill(false);

  let totalFossil = 0;
  let totalGreen = 0;
  let totalDemand = 0;
  let totalCap = 0;
  let fossilCount = 0;
  let poweredCityCount = 0;

  const cityDemandMap = new Map<number, number>();
  for (const c of s.level.cities) {
    cityDemandMap.set(idx(w, c.x, c.y), c.baseDemand * demandMult);
  }

  // On identifie les composantes qui contiennent au moins 1 producteur ou stockage
  const components: number[][] = [];
  for (let i = 0; i < w * h; i++) {
    if (visited[i] || !isConductive(s.cells[i])) continue;
    const comp: number[] = [];
    const q = [i];
    visited[i] = 1;
    while (q.length > 0) {
      const cur = q.pop()!;
      comp.push(cur);
      const cx = cur % w;
      const cy = Math.floor(cur / w);
      for (const [dx, dy] of N4) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const nk = idx(w, nx, ny);
        if (!visited[nk] && isConductive(s.cells[nk])) {
          visited[nk] = 1;
          q.push(nk);
        }
      }
    }
    components.push(comp);
  }

  // Calcul par composante
  for (const comp of components) {
    let compFossil = 0;
    let compGreen = 0;
    let compCap = 0;
    const compCities: number[] = [];

    for (const k of comp) {
      const c = s.cells[k];
      const ter = s.level.terrain[k];
      if (c === "fossil") {
        compFossil += REWIRE_RULES.fossilOutputMw;
        fossilCount++;
      } else if (c === "solar") {
        const bonus = ter === "solar_zone" ? 1.35 : 1.0;
        compGreen += REWIRE_RULES.solarPeakMw * s.sunFactor * bonus;
      } else if (c === "wind") {
        const bonus = ter === "wind_zone" ? 1.4 : 1.0;
        compGreen += REWIRE_RULES.windBaseMw * s.windFactor * bonus;
      } else if (c === "battery") {
        compCap += REWIRE_RULES.batteryCapMwh;
      } else if (c === "gravity_tower") {
        compCap += REWIRE_RULES.gravityTowerCapMwh;
      } else if (c === "city") {
        compCities.push(k);
      }
    }

    const hasSource = compFossil + compGreen > 0.1 || compCap > 0;
    if (hasSource) {
      for (const k of comp) s.powered[k] = true;
      poweredCityCount += compCities.length;
    }

    totalFossil += compFossil;
    totalGreen += compGreen;
    totalCap += compCap;
    for (const ck of compCities) totalDemand += cityDemandMap.get(ck) ?? 6;
  }

  // Ajoute la demande des quartiers déconnectés pour forcer leur alimentation
  for (const [ck, dem] of cityDemandMap) {
    if (!s.powered[ck]) totalDemand += dem;
  }

  s.fossilMw = totalFossil;
  s.greenMw = totalGreen;
  s.demandMw = totalDemand;
  s.storageCapMwh = totalCap;
  s.storageMwh = Math.min(s.storageMwh, totalCap);
  s.fossilRemaining = fossilCount;
  s.poweredCities = poweredCityCount;

  const rawProd = totalFossil + totalGreen;
  const balance = rawProd - totalDemand;
  const flywheelMult = s.modifiers.flywheels ? 1.8 : 1.0;
  let effectiveProd = rawProd;

  if (dt > 0) {
    if (balance >= 0 && totalCap > 0) {
      const chargeMw = Math.min(balance, REWIRE_RULES.batteryRateMw * flywheelMult);
      s.storageMwh = Math.min(totalCap, s.storageMwh + chargeMw * (dt / 3.6));
    } else if (balance < 0 && s.storageMwh > 0) {
      const neededMw = -balance;
      const maxDeliverMw = Math.min(neededMw, REWIRE_RULES.batteryRateMw * flywheelMult);
      const maxEnergyMwh = maxDeliverMw * (dt / 3.6);
      const drawn = Math.min(s.storageMwh, maxEnergyMwh);
      s.storageMwh -= drawn;
      effectiveProd += drawn / (dt / 3.6);
    }
  }

  s.totalProdMw = effectiveProd;
  const denom = totalFossil + totalGreen;
  s.greenShare = denom > 0.01 ? totalGreen / denom : s.fossilRemaining === 0 && s.storageMwh > 0 ? 1 : 0;

  // Fréquence & Stabilité
  const allCitiesConnected = poweredCityCount === s.level.cities.length;
  const deficitRatio = totalDemand > 0 ? Math.max(0, (totalDemand - effectiveProd) / totalDemand) : 0;

  if (dt > 0) {
    if (!allCitiesConnected || deficitRatio > 0.04) {
      const penalty = (!allCitiesConnected ? 0.55 : deficitRatio) * REWIRE_RULES.stabilityDrainPerSec;
      const damp = s.modifiers.flywheels ? 0.65 : 1.0;
      s.stability = Math.max(0, s.stability - penalty * damp * dt);
      s.frequencyHz = Math.max(47.2, 50 - (100 - s.stability) * 0.025);
    } else {
      const rec = REWIRE_RULES.stabilityRecoverPerSec * (s.modifiers.flywheels ? 1.5 : 1.0);
      s.stability = Math.min(100, s.stability + rec * dt);
      s.frequencyHz = Math.min(50, 50 - (100 - s.stability) * 0.015);
      // Crédits gagnés quand le réseau tient
      const greenBonus = s.greenShare > 0.6 ? REWIRE_RULES.greenBonusIncome * s.greenShare : 0;
      s.credits += (REWIRE_RULES.incomePerSec + greenBonus) * dt;
    }

    // Renaturation case par case quand le mix devient propre et que les centrales fossiles tombent
    const cleanDrive = s.fossilRemaining === 0 && allCitiesConnected && s.stability > 50
      ? 1.0
      : Math.max(0, (s.greenShare - 0.45) * 0.65);

    let greenSum = 0;
    for (let i = 0; i < w * h; i++) {
      if (s.level.terrain[i] === "rubble") continue;
      // Les centrales fossiles actives bloquent la renaturation dans un rayon de 3 cases
      const x = i % w;
      const y = Math.floor(i / w);
      let polluted = false;
      for (let j = 0; j < w * h; j++) {
        if (s.cells[j] === "fossil") {
          const fx = j % w;
          const fy = Math.floor(j / w);
          if (Math.abs(fx - x) + Math.abs(fy - y) <= 3) {
            polluted = true;
            break;
          }
        }
      }
      if (polluted) {
        s.green[i] = Math.max(0, s.green[i] - 0.12 * dt);
      } else if (cleanDrive > 0 && (s.powered[i] || s.fossilRemaining === 0)) {
        s.green[i] = Math.min(1, s.green[i] + cleanDrive * REWIRE_RULES.renatureRatePerSec * dt);
      }
      greenSum += s.green[i];
    }
    const playableCells = s.level.terrain.filter((t) => t !== "rubble").length;
    s.renature = playableCells > 0 ? greenSum / playableCells : 0;

    if (s.stability <= 0) {
      s.phase = "blackout";
      s.message = "Blackout ! Le réseau a décroché. Ajoutez du stockage ou du renouvelable avant de couper les centrales.";
    } else if (s.fossilRemaining === 0 && allCitiesConnected && s.renature >= REWIRE_RULES.victoryRenature) {
      s.phase = "won";
      s.message = "Transition réussie : 100 % électricité verte et béton renaturé !";
    }
  }
}

export function tickRewire(s: RewireState, dt: number): void {
  if (s.phase !== "play") return;
  s.timeSec += dt;
  evaluateGrid(s, dt);
}
