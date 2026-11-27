// Simulation électrique incrémentale de REWIRE v0.2 (coûts croissants, surcharges, synergies, tech tree, événements).
import { REWIRE_RULES, TECH_UPGRADES, TOOLS, type ToolId, type UpgradeId } from "./content";
import { generateRewireMap, idx, type RewireLevel } from "./level";

export type CellKind =
  | "empty"
  | "cable"
  | "fossil"
  | "gravity_tower"
  | "city"
  | "solar"
  | "wind"
  | "battery"
  | "substation";

export interface Modifiers {
  gravityTowers: boolean;
  flywheels: boolean;
}

export interface ActiveEvent {
  name: string;
  desc: string;
  timeLeft: number;
  sunMult: number;
  windMult: number;
  demandMult: number;
}

export interface RewireState {
  seed: number;
  sector: number;
  prestigeMult: number;
  level: RewireLevel;
  cells: CellKind[];
  green: number[];
  powered: boolean[];
  overloaded: boolean[];
  upgrades: Record<UpgradeId, number>;
  convertedCount: number;
  credits: number;
  incomeRate: number;
  totalClicks: number;
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
  greenShare: number;
  frequencyHz: number;
  stability: number;
  renature: number;
  overloadRatio: number;
  poweredCities: number;
  fossilRemaining: number;
  activeEvent: ActiveEvent | null;
  nextEventIn: number;
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

const EVENTS: Array<Omit<ActiveEvent, "timeLeft">> = [
  { name: "Rafale de Mistral", desc: "Éoliennes +60 % pendant 14 s !", sunMult: 1, windMult: 1.6, demandMult: 1 },
  { name: "Couverture nuageuse", desc: "Solaire −55 % pendant 14 s : comptez sur le stockage.", sunMult: 0.45, windMult: 1.1, demandMult: 1 },
  { name: "Pic de chaleur", desc: "Demande urbaine +28 % pendant 14 s !", sunMult: 1.15, windMult: 0.85, demandMult: 1.28 },
];

export function newRewireGame(
  seed: number,
  modifiers: Modifiers = { gravityTowers: true, flywheels: false },
  sector = 1,
): RewireState {
  const level = generateRewireMap(seed, sector);
  const total = level.w * level.h;
  const cells: CellKind[] = new Array(total).fill("empty");
  for (const p of level.plants) cells[idx(level.w, p.x, p.y)] = "fossil";
  for (const c of level.cities) cells[idx(level.w, c.x, c.y)] = "city";
  for (const [cx, cy] of level.initialCables) cells[idx(level.w, cx, cy)] = "cable";

  const state: RewireState = {
    seed,
    sector,
    prestigeMult: 1 + (sector - 1) * 0.25,
    level,
    cells,
    green: new Array(total).fill(0),
    powered: new Array(total).fill(false),
    overloaded: new Array(total).fill(false),
    upgrades: { click: 0, solar: 0, wind: 0, cables: 0, smartgrid: 0, biomoss: 0 },
    convertedCount: 0,
    credits: REWIRE_RULES.startCredits,
    incomeRate: 0,
    totalClicks: 0,
    timeSec: 8 * (REWIRE_RULES.dayDurationSec / 24),
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
    overloadRatio: 0,
    poweredCities: level.cities.length,
    fossilRemaining: level.plants.length,
    activeEvent: null,
    nextEventIn: 24,
    phase: "play",
    modifiers: { ...modifiers },
    message: `Secteur ${sector} : cliquez sur ⚡ Générer, optimisez vos emplacements et reconvertissez les centrales.`,
  };
  evaluateGrid(state, 0);
  return state;
}

export function countKind(s: RewireState, kind: CellKind): number {
  let n = 0;
  for (const c of s.cells) if (c === kind) n++;
  return n;
}

export function currentToolCost(s: RewireState, tool: ToolId): number {
  const def = TOOLS.find((t) => t.id === tool);
  if (!def || def.baseCost === 0) return 0;
  if (tool === "convert") {
    return Math.round(def.baseCost * Math.pow(def.growth, s.convertedCount));
  }
  if (tool === "cable") return def.baseCost;
  const count = countKind(s, tool as CellKind);
  return Math.round(def.baseCost * Math.pow(def.growth, count));
}

export function upgradeCost(s: RewireState, id: UpgradeId): number {
  const def = TECH_UPGRADES.find((u) => u.id === id)!;
  const lvl = s.upgrades[id];
  if (lvl >= def.maxLevel) return Infinity;
  return Math.round(def.baseCost * Math.pow(def.costMult, lvl));
}

export function buyUpgrade(s: RewireState, id: UpgradeId): boolean {
  if (s.phase !== "play") return false;
  const def = TECH_UPGRADES.find((u) => u.id === id);
  if (!def) return false;
  if (s.upgrades[id] >= def.maxLevel) return false;
  const cost = upgradeCost(s, id);
  if (s.credits < cost) {
    s.message = `Il faut ${cost} cr. pour ${def.name}.`;
    return false;
  }
  s.credits -= cost;
  s.upgrades[id]++;
  s.message = `Amélioration débloquée : ${def.name} (niv. ${s.upgrades[id]}).`;
  evaluateGrid(s, 0);
  return true;
}

export function clickPower(s: RewireState): { credits: number; mwh: number } {
  const lvl = s.upgrades.click;
  const baseCr = [2, 5, 11, 22, 42][lvl] ?? 42;
  return {
    credits: Math.round(baseCr * s.prestigeMult),
    mwh: 2 + lvl * 2.5,
  };
}

/** Action Cookie Clicker : génère des crédits immédiats + injecte du courant dans le stockage / stabilise le réseau. */
export function clickGenerate(s: RewireState): void {
  if (s.phase !== "play") return;
  const p = clickPower(s);
  s.credits += p.credits;
  s.totalClicks++;
  if (s.storageCapMwh > 0) {
    s.storageMwh = Math.min(s.storageCapMwh, s.storageMwh + p.mwh);
  }
  if (s.stability < 100) {
    s.stability = Math.min(100, s.stability + 1.8);
  }
}

export function applyTool(s: RewireState, tool: ToolId, x: number, y: number): boolean {
  if (s.phase !== "play") return false;
  if (x < 0 || y < 0 || x >= s.level.w || y >= s.level.h) return false;
  const k = idx(s.level.w, x, y);
  const cur = s.cells[k];
  const ter = s.level.terrain[k];
  const cost = currentToolCost(s, tool);

  if (tool === "erase") {
    if (cur === "cable" || cur === "solar" || cur === "wind" || cur === "battery" || cur === "substation") {
      const def = TOOLS.find((t) => t.id === cur)!;
      s.cells[k] = "empty";
      s.credits += Math.floor(def.baseCost * 0.5);
      evaluateGrid(s, 0);
      return true;
    }
    return false;
  }

  if (tool === "convert") {
    if (cur !== "fossil") return false;
    if (s.credits < cost) {
      s.message = `Il faut ${cost} cr. pour reconvertir cette centrale brutaliste.`;
      return false;
    }
    s.credits -= cost;
    s.convertedCount++;
    s.cells[k] = s.modifiers.gravityTowers ? "gravity_tower" : "cable";
    s.message = s.modifiers.gravityTowers
      ? `Centrale reconvertie en tour gravitaire (+${REWIRE_RULES.gravityTowerCapMwh} MWh) !`
      : "Centrale brutaliste débranchée ! Tenez le réseau avec le renouvelable.";
    evaluateGrid(s, 0);
    return true;
  }

  if (ter === "rubble") return false;
  if (cur !== "empty") return false;
  if (s.credits < cost) {
    s.message = `Crédits insuffisants (${cost} cr. requis pour ${TOOLS.find((t) => t.id === tool)?.name}).`;
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

function neighborsOf(s: RewireState, k: number): CellKind[] {
  const { w, h } = s.level;
  const x = k % w;
  const y = Math.floor(k / w);
  const out: CellKind[] = [];
  for (const [dx, dy] of N4) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(s.cells[idx(w, nx, ny)]);
  }
  return out;
}

function evaluateGrid(s: RewireState, dt: number): void {
  const { w, h } = s.level;
  const dayFrac = (s.timeSec % REWIRE_RULES.dayDurationSec) / REWIRE_RULES.dayDurationSec;
  s.hour = dayFrac * 24;

  // Événements réseau dynamiques
  if (dt > 0) {
    if (s.activeEvent) {
      s.activeEvent.timeLeft -= dt;
      if (s.activeEvent.timeLeft <= 0) {
        s.activeEvent = null;
        s.nextEventIn = 26;
      }
    } else {
      s.nextEventIn -= dt;
      if (s.nextEventIn <= 0) {
        const ev = EVENTS[Math.floor(Math.abs(Math.sin(s.timeSec + s.seed)) * EVENTS.length) % EVENTS.length];
        s.activeEvent = { ...ev, timeLeft: 14 };
        s.message = `⚡ Événement : ${ev.name} — ${ev.desc}`;
      }
    }
  }

  const evSun = s.activeEvent?.sunMult ?? 1;
  const evWind = s.activeEvent?.windMult ?? 1;
  const evDem = s.activeEvent?.demandMult ?? 1;

  const sunRaw = Math.sin(((s.hour - 6) / 13) * Math.PI);
  s.sunFactor = s.hour >= 6 && s.hour <= 19 ? Math.max(0, sunRaw) * evSun : 0;
  s.windFactor = (0.52 + 0.36 * Math.sin(s.timeSec * 0.24 + s.seed) + 0.14 * Math.cos(s.timeSec * 0.57)) * evWind;
  s.windFactor = Math.max(0.18, Math.min(1.6, s.windFactor));

  // La demande grimpe doucement avec le temps + pics matin/soir
  const timeCreep = 1 + Math.min(0.45, s.timeSec / 260);
  const eveningPeak = Math.exp(-Math.pow((s.hour - 19.5) / 2.5, 2)) * 0.38;
  const morningPeak = Math.exp(-Math.pow((s.hour - 9) / 2.0, 2)) * 0.14;
  const demandMult = (0.85 + eveningPeak + morningPeak) * evDem * timeCreep;

  const solarTech = 1 + s.upgrades.solar * 0.35;
  const windTech = 1 + s.upgrades.wind * 0.3;
  const lineCap = REWIRE_RULES.baseLineCapMw * (1 + s.upgrades.cables * 0.55);

  const visited = new Uint8Array(w * h);
  s.powered.fill(false);
  s.overloaded.fill(false);

  let totalFossil = 0;
  let totalGreen = 0;
  let totalDemand = 0;
  let totalCap = 0;
  let fossilCount = 0;
  let poweredCityCount = 0;
  let overloadedCables = 0;
  let totalCables = 0;

  const cityDemandMap = new Map<number, number>();
  for (const c of s.level.cities) {
    cityDemandMap.set(idx(w, c.x, c.y), c.baseDemand * demandMult);
  }

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

  for (const comp of components) {
    let compFossil = 0;
    let compGreen = 0;
    let compCap = 0;
    let compSubstations = 0;
    const compCables: number[] = [];
    const compCities: number[] = [];

    for (const k of comp) {
      const c = s.cells[k];
      const ter = s.level.terrain[k];
      const nb = neighborsOf(s, k);
      const hasSubstation = nb.includes("substation");

      if (c === "fossil") {
        compFossil += REWIRE_RULES.fossilOutputMw;
        fossilCount++;
      } else if (c === "solar") {
        const zoneBonus = ter === "solar_zone" ? 1.5 : 1.0;
        const batBonus = nb.includes("battery") || nb.includes("gravity_tower") ? 1.2 : 1.0;
        const subBonus = hasSubstation ? 1.25 : 1.0;
        compGreen += REWIRE_RULES.solarPeakMw * s.sunFactor * zoneBonus * batBonus * subBonus * solarTech;
      } else if (c === "wind") {
        const zoneBonus = ter === "wind_zone" ? 1.5 : 1.0;
        const adjWinds = nb.filter((n) => n === "wind").length;
        const turbulence = adjWinds > 0 ? Math.max(0.5, 1 - adjWinds * 0.25) : 1.0;
        const subBonus = hasSubstation ? 1.25 : 1.0;
        compGreen += REWIRE_RULES.windBaseMw * s.windFactor * zoneBonus * turbulence * subBonus * windTech;
      } else if (c === "battery") {
        compCap += REWIRE_RULES.batteryCapMwh;
      } else if (c === "gravity_tower") {
        compCap += REWIRE_RULES.gravityTowerCapMwh;
      } else if (c === "substation") {
        compSubstations++;
      } else if (c === "cable") {
        compCables.push(k);
      } else if (c === "city") {
        compCities.push(k);
      }
    }

    const compProd = compFossil + compGreen;
    // Vérification surcharge de ligne : si un réseau pousse beaucoup de MW sur trop peu de câbles/postes
    const effectiveLineCap = lineCap * (1 + compSubstations * 0.45);
    const loadPerPath = compCables.length > 0 ? compProd / Math.max(1, compCables.length * 0.22) : 0;
    const isOverloaded = compProd > effectiveLineCap && loadPerPath > effectiveLineCap * 1.15;

    if (isOverloaded) {
      for (const ck of compCables) {
        s.overloaded[ck] = true;
        overloadedCables++;
      }
      // Perte par effet Joule sur réseau surchargé
      compGreen *= 0.78;
      compFossil *= 0.85;
    }
    totalCables += compCables.length;

    const hasSource = compFossil + compGreen > 0.1 || compCap > 0;
    if (hasSource) {
      for (const k of comp) s.powered[k] = true;
      poweredCityCount += compCities.length;
    }

    totalFossil += compFossil;
    totalGreen += compGreen;
    totalCap += compCap;
    for (const ck of compCities) totalDemand += cityDemandMap.get(ck) ?? 8;
  }

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
  s.overloadRatio = totalCables > 0 ? overloadedCables / totalCables : 0;

  const rawProd = totalFossil + totalGreen;
  const balance = rawProd - totalDemand;
  const flywheelMult = s.modifiers.flywheels ? 1.85 : 1.0;
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

  const allCitiesConnected = poweredCityCount === s.level.cities.length;
  const deficitRatio = totalDemand > 0 ? Math.max(0, (totalDemand - effectiveProd) / totalDemand) : 0;

  // Revenus incrémentaux (MW verts rapportent beaucoup plus, centrales fossiles paient une taxe carbone)
  const smartMult = 1 + s.upgrades.smartgrid * 0.4;
  const greenIncome = Math.min(totalDemand, totalGreen) * REWIRE_RULES.baseRevenuePerMw * 1.45 * smartMult;
  const fossilIncome = Math.min(totalDemand, totalFossil) * REWIRE_RULES.baseRevenuePerMw * 0.5;
  const carbonTax = fossilCount * REWIRE_RULES.fossilTaxPerSec;
  const netRate = allCitiesConnected && deficitRatio <= 0.05 ? Math.max(0.3, (greenIncome + fossilIncome - carbonTax) * s.prestigeMult) : 0;
  s.incomeRate = netRate;

  if (dt > 0) {
    const overloadDrain = s.overloadRatio > 0.35 ? 3.5 : 0;
    if (!allCitiesConnected || deficitRatio > 0.05) {
      const penalty = (!allCitiesConnected ? 0.55 : deficitRatio) * REWIRE_RULES.stabilityDrainPerSec + overloadDrain;
      const damp = s.modifiers.flywheels ? 0.65 : 1.0;
      s.stability = Math.max(0, s.stability - penalty * damp * dt);
      s.frequencyHz = Math.max(47.2, 50 - (100 - s.stability) * 0.025);
    } else {
      const rec = REWIRE_RULES.stabilityRecoverPerSec * (s.modifiers.flywheels ? 1.5 : 1.0) - overloadDrain;
      s.stability = Math.max(0, Math.min(100, s.stability + rec * dt));
      s.frequencyHz = Math.min(50, 50 - (100 - s.stability) * 0.015);
      s.credits += netRate * dt;
    }

    const mossMult = 1 + s.upgrades.biomoss * 0.8;
    const cleanDrive =
      s.fossilRemaining === 0 && allCitiesConnected && s.stability > 50
        ? 1.0 * mossMult
        : Math.max(0, (s.greenShare - 0.5) * 0.55 * mossMult);

    let greenSum = 0;
    for (let i = 0; i < w * h; i++) {
      if (s.level.terrain[i] === "rubble") continue;
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
      s.message = "Blackout ! Développez votre stockage, vos postes HT et vos améliorations avant de couper les centrales.";
    } else if (s.fossilRemaining === 0 && allCitiesConnected && s.renature >= REWIRE_RULES.victoryRenature) {
      s.phase = "won";
      s.message = `Secteur ${s.sector} renaturé à 100 % ! Passez au Secteur ${s.sector + 1} (+25 % prestige).`;
    }
  }
}

export function tickRewire(s: RewireState, dt: number): void {
  if (s.phase !== "play") return;
  s.timeSec += dt;
  evaluateGrid(s, dt);
}
