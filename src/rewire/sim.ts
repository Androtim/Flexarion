// Simulation REWIRE v0.3 : monde qui s'agrandit (5 zones), flux réel par câble avec goulots MW, smog, dynamo à surchauffe.
import { REWIRE_RULES, TECH_UPGRADES, TOOLS, WORLD_CENTER, WORLD_SIZE, ZONES, type ToolId, type UpgradeId } from "./content";
import { cellZone, generateRewireWorld, idx, type RewireWorld } from "./level";

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
  world: RewireWorld;
  unlockedZone: number; // 1..5
  cells: CellKind[];
  plantMwMap: number[];
  green: number[];
  smog: boolean[];
  powered: boolean[];
  /** Flux réel transitant sur chaque case câble (en MW). */
  cableFlow: number[];
  /** Capacité maximale (en MW) de chaque case câble. */
  cableCap: number[];
  overloaded: boolean[];
  upgrades: Record<UpgradeId, number>;
  convertedCount: number;
  credits: number;
  incomeRate: number;
  /** Dynamo manuelle (anti-cheese : jauge de chauffe 0..100). */
  dynamoHeat: number;
  dynamoLocked: boolean;
  dynamoBoostMw: number;
  dynamoBoostTimer: number;
  timeSec: number;
  hour: number;
  sunFactor: number;
  windFactor: number;
  demandMw: number;
  deliveredMw: number;
  fossilMw: number;
  greenMw: number;
  wastedMw: number;
  storageMwh: number;
  storageCapMwh: number;
  greenShare: number;
  frequencyHz: number;
  stability: number;
  renature: number;
  overloadedCables: number;
  unlockedCities: number;
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
  { name: "Pic de canicule", desc: "Demande urbaine +32 % pendant 14 s !", sunMult: 1.15, windMult: 0.75, demandMult: 1.32 },
  { name: "Front nuageux", desc: "Solaire −60 % pendant 14 s : préparez les batteries.", sunMult: 0.4, windMult: 1.15, demandMult: 1.05 },
  { name: "Mistral fort", desc: "Éoliennes +55 % pendant 14 s !", sunMult: 1, windMult: 1.55, demandMult: 1 },
];

export function isUnlocked(s: RewireState, x: number, y: number): boolean {
  return cellZone(x, y) <= s.unlockedZone;
}

export function unlockedBounds(zone: number): { min: number; max: number; span: number } {
  const r = ZONES[zone - 1].radius;
  return { min: WORLD_CENTER - r, max: WORLD_CENTER + r, span: r * 2 + 1 };
}

export function newRewireGame(seed: number, modifiers: Modifiers = { gravityTowers: true, flywheels: false }): RewireState {
  const world = generateRewireWorld(seed);
  const total = WORLD_SIZE * WORLD_SIZE;
  const cells: CellKind[] = new Array(total).fill("empty");
  const plantMwMap = new Array(total).fill(0);

  for (const p of world.plants) {
    const k = idx(p.x, p.y);
    cells[k] = "fossil";
    plantMwMap[k] = p.mw;
  }
  for (const c of world.cities) {
    cells[idx(c.x, c.y)] = "city";
  }
  for (const [cx, cy] of world.initialCables) {
    cells[idx(cx, cy)] = "cable";
  }

  const state: RewireState = {
    seed,
    world,
    unlockedZone: 1,
    cells,
    plantMwMap,
    green: new Array(total).fill(0),
    smog: new Array(total).fill(false),
    powered: new Array(total).fill(false),
    cableFlow: new Array(total).fill(0),
    cableCap: new Array(total).fill(REWIRE_RULES.baseCableCapMw),
    overloaded: new Array(total).fill(false),
    upgrades: { dynamo: 0, cables: 0, solar: 0, wind: 0, smartgrid: 0, biomoss: 0 },
    convertedCount: 0,
    credits: REWIRE_RULES.startCredits,
    incomeRate: 0,
    dynamoHeat: 0,
    dynamoLocked: false,
    dynamoBoostMw: 0,
    dynamoBoostTimer: 0,
    timeSec: 7 * (REWIRE_RULES.dayDurationSec / 24),
    hour: 7,
    sunFactor: 0.5,
    windFactor: 0.65,
    demandMw: 0,
    deliveredMw: 0,
    fossilMw: 0,
    greenMw: 0,
    wastedMw: 0,
    storageMwh: 0,
    storageCapMwh: 0,
    greenShare: 0,
    frequencyHz: 50,
    stability: 100,
    renature: 0,
    overloadedCables: 0,
    unlockedCities: 2,
    poweredCities: 1,
    fossilRemaining: 1,
    activeEvent: null,
    nextEventIn: 28,
    phase: "play",
    modifiers: { ...modifiers },
    message: "Zone 1 (7×7) : reliez le 2e quartier, préparez le pic du soir (19 h) et reconvertissez la centrale pour étendre la carte !",
  };
  evaluateGrid(state, 0);
  return state;
}

export function countKindUnlocked(s: RewireState, kind: CellKind): number {
  let n = 0;
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      if (isUnlocked(s, x, y) && s.cells[idx(x, y)] === kind) n++;
    }
  }
  return n;
}

export function currentToolCost(s: RewireState, tool: ToolId): number {
  const def = TOOLS.find((t) => t.id === tool);
  if (!def || def.baseCost === 0) return 0;
  if (tool === "convert") return Math.round(def.baseCost * Math.pow(def.growth, s.convertedCount));
  if (tool === "cable") return def.baseCost;
  const count = countKindUnlocked(s, tool as CellKind);
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
  if (!def || s.upgrades[id] >= def.maxLevel) return false;
  const cost = upgradeCost(s, id);
  if (s.credits < cost) {
    s.message = `Il faut ${cost} cr. pour ${def.name}.`;
    return false;
  }
  s.credits -= cost;
  s.upgrades[id]++;
  s.message = `Tech débloquée : ${def.name} (niv. ${s.upgrades[id]}).`;
  evaluateGrid(s, 0);
  return true;
}

export function canExpand(s: RewireState): { ok: boolean; cost: number; reason: string } {
  if (s.unlockedZone >= ZONES.length) return { ok: false, cost: 0, reason: "Monde complet débloqué" };
  const next = ZONES[s.unlockedZone];
  if (s.fossilRemaining > 0) return { ok: false, cost: next.unlockCost, reason: `Reconvertissez encore ${s.fossilRemaining} centrale(s)` };
  if (s.poweredCities < s.unlockedCities) return { ok: false, cost: next.unlockCost, reason: "Reliez tous les quartiers" };
  if (s.renature < REWIRE_RULES.expandMinRenature) {
    return { ok: false, cost: next.unlockCost, reason: `Renaturation ${Math.round(s.renature * 100)} % / ${Math.round(REWIRE_RULES.expandMinRenature * 100)} %` };
  }
  if (s.credits < next.unlockCost) return { ok: false, cost: next.unlockCost, reason: `Il faut ${next.unlockCost} cr.` };
  return { ok: true, cost: next.unlockCost, reason: `Débloquer Zone ${next.zone} (${next.radius * 2 + 1}×${next.radius * 2 + 1})` };
}

export function expandWorld(s: RewireState): boolean {
  if (s.phase !== "play") return false;
  const check = canExpand(s);
  if (!check.ok) {
    s.message = check.reason;
    return false;
  }
  s.credits -= check.cost;
  s.unlockedZone++;
  const z = ZONES[s.unlockedZone - 1];
  s.message = `🗺️ Zone ${z.zone} (${z.radius * 2 + 1}×${z.radius * 2 + 1}) débloquée ! +${z.newCities} quartiers et +${z.newPlants} centrale(s) brutaliste(s) à gérer.`;
  evaluateGrid(s, 0);
  return true;
}

export function dynamoStats(s: RewireState): { credits: number; mw: number; heatPerClick: number } {
  const lvl = s.upgrades.dynamo;
  return {
    credits: [2, 4, 9, 18, 34][lvl] ?? 34,
    mw: [6, 10, 16, 24, 36][lvl] ?? 36,
    heatPerClick: Math.max(11, 20 - lvl * 2),
  };
}

/** Dynamo manuelle avec jauge de surchauffe (utile en urgence et au démarrage, impossible à spammer à l'infini). */
export function clickDynamo(s: RewireState): boolean {
  if (s.phase !== "play" || s.dynamoLocked) return false;
  const st = dynamoStats(s);
  s.dynamoHeat = Math.min(100, s.dynamoHeat + st.heatPerClick);
  if (s.dynamoHeat >= 100) {
    s.dynamoLocked = true;
    s.message = "🔥 Dynamo en surchauffe ! Attendez le refroidissement.";
  }
  s.credits += st.credits;
  s.dynamoBoostMw = st.mw;
  s.dynamoBoostTimer = 2.2;
  if (s.storageCapMwh > 0) {
    s.storageMwh = Math.min(s.storageCapMwh, s.storageMwh + st.mw * 0.25);
  }
  return true;
}

export function applyTool(s: RewireState, tool: ToolId, x: number, y: number): boolean {
  if (s.phase !== "play") return false;
  if (x < 0 || y < 0 || x >= WORLD_SIZE || y >= WORLD_SIZE) return false;
  if (!isUnlocked(s, x, y)) {
    s.message = "Zone encore verrouillée : nettoyez la zone actuelle puis étendez la carte.";
    return false;
  }
  const k = idx(x, y);
  const cur = s.cells[k];
  const ter = s.world.terrain[k];
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
      ? `Centrale brutaliste convertie en tour gravitaire (+${REWIRE_RULES.gravityTowerCapMwh} MWh) !`
      : "Centrale brutaliste débranchée ! Le smog se dissipe.";
    evaluateGrid(s, 0);
    return true;
  }

  if (ter === "rubble" || cur !== "empty") return false;
  if (s.credits < cost) {
    s.message = `Crédits insuffisants (${cost} cr. requis).`;
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

function neighborsUnlocked(s: RewireState, x: number, y: number): number[] {
  const out: number[] = [];
  for (const [dx, dy] of N4) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < WORLD_SIZE && ny < WORLD_SIZE && isUnlocked(s, nx, ny)) {
      out.push(idx(nx, ny));
    }
  }
  return out;
}

function evaluateGrid(s: RewireState, dt: number): void {
  const N = WORLD_SIZE;
  const dayFrac = (s.timeSec % REWIRE_RULES.dayDurationSec) / REWIRE_RULES.dayDurationSec;
  s.hour = dayFrac * 24;

  // Refroidissement dynamo
  if (dt > 0) {
    const coolRate = 20 + s.upgrades.dynamo * 5;
    s.dynamoHeat = Math.max(0, s.dynamoHeat - coolRate * dt);
    if (s.dynamoLocked && s.dynamoHeat <= 35) s.dynamoLocked = false;
    if (s.dynamoBoostTimer > 0) {
      s.dynamoBoostTimer = Math.max(0, s.dynamoBoostTimer - dt);
      if (s.dynamoBoostTimer === 0) s.dynamoBoostMw = 0;
    }

    if (s.activeEvent) {
      s.activeEvent.timeLeft -= dt;
      if (s.activeEvent.timeLeft <= 0) {
        s.activeEvent = null;
        s.nextEventIn = 28;
      }
    } else {
      s.nextEventIn -= dt;
      if (s.nextEventIn <= 0) {
        const ev = EVENTS[Math.floor(Math.abs(Math.sin(s.timeSec * 1.3 + s.seed)) * EVENTS.length) % EVENTS.length];
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
  s.windFactor = (0.48 + 0.36 * Math.sin(s.timeSec * 0.25 + s.seed) + 0.14 * Math.cos(s.timeSec * 0.59)) * evWind;
  s.windFactor = Math.max(0.15, Math.min(1.6, s.windFactor));

  const eveningPeak = Math.exp(-Math.pow((s.hour - 19.5) / 2.6, 2)) * 0.45;
  const morningPeak = Math.exp(-Math.pow((s.hour - 8.5) / 2.0, 2)) * 0.15;
  const demandMult = (0.85 + eveningPeak + morningPeak) * evDem;

  const solarTech = 1 + s.upgrades.solar * 0.35;
  const windTech = 1 + s.upgrades.wind * 0.35;
  const baseCap = REWIRE_RULES.baseCableCapMw * (1 + s.upgrades.cables * 0.5);

  // 1. Calcul du smog (rayon 3 autour de chaque centrale fossile active dans les zones débloquées)
  s.smog.fill(false);
  const activeFossils: Array<[number, number]> = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!isUnlocked(s, x, y)) continue;
      if (s.cells[idx(x, y)] === "fossil") activeFossils.push([x, y]);
    }
  }
  for (const [fx, fy] of activeFossils) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 3) continue;
        const nx = fx + dx;
        const ny = fy + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N) s.smog[idx(nx, ny)] = true;
      }
    }
  }

  // 2. Calcul capacité de chaque case câble (doublée si adjacente à un Poste HT)
  s.powered.fill(false);
  s.cableFlow.fill(0);
  s.overloaded.fill(false);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const k = idx(x, y);
      if (!isUnlocked(s, x, y)) continue;
      const hasSub = neighborsUnlocked(s, x, y).some((nk) => s.cells[nk] === "substation");
      s.cableCap[k] = baseCap * (hasSub ? 2.0 : 1.0);
    }
  }

  // 3. Production individuelle + Demande des villes débloquées
  const cityDemand = new Map<number, number>();
  let unlockedCityTotal = 0;
  for (const c of s.world.cities) {
    if (c.zone <= s.unlockedZone) {
      cityDemand.set(idx(c.x, c.y), c.baseDemand * demandMult);
      unlockedCityTotal++;
    }
  }

  const visited = new Uint8Array(N * N);
  let totalFossil = 0;
  let totalGreen = 0;
  let totalDemand = 0;
  let totalDelivered = 0;
  let totalWasted = 0;
  let totalCapMwh = 0;
  let poweredCityCount = 0;
  let overloadedCables = 0;
  let upkeepBuildings = 0;

  // 4. Parcours par composante connexe avec calcul réel de flux par câble (arbre BFS depuis les sources vers les villes)
  for (let y0 = 0; y0 < N; y0++) {
    for (let x0 = 0; x0 < N; x0++) {
      const startK = idx(x0, y0);
      if (!isUnlocked(s, x0, y0) || visited[startK] || !isConductive(s.cells[startK])) continue;

      const comp: number[] = [];
      const q = [startK];
      visited[startK] = 1;
      while (q.length > 0) {
        const cur = q.pop()!;
        comp.push(cur);
        for (const nk of neighborsUnlocked(s, cur % N, Math.floor(cur / N))) {
          if (!visited[nk] && isConductive(s.cells[nk])) {
            visited[nk] = 1;
            q.push(nk);
          }
        }
      }

      const sources: number[] = [];
      const citiesInComp: number[] = [];
      let compFossil = 0;
      let compGreen = 0;
      let compCapMwh = 0;

      for (const k of comp) {
        const c = s.cells[k];
        const x = k % N;
        const y = Math.floor(k / N);
        const ter = s.world.terrain[k];
        const nbs = neighborsUnlocked(s, x, y).map((nk) => s.cells[nk]);
        const hasSub = nbs.includes("substation");

        if (c === "fossil") {
          compFossil += s.plantMwMap[k] || 14;
          sources.push(k);
        } else if (c === "solar") {
          const zB = ter === "solar_zone" ? 1.6 : 1.0;
          const smogPen = s.smog[k] ? 0.6 : 1.0;
          const subB = hasSub ? 1.35 : 1.0;
          const out = REWIRE_RULES.solarPeakMw * s.sunFactor * zB * smogPen * subB * solarTech;
          compGreen += out;
          if (out > 0.1) sources.push(k);
          upkeepBuildings++;
        } else if (c === "wind") {
          const zB = ter === "wind_zone" ? 1.6 : 1.0;
          const adjWinds = nbs.filter((n) => n === "wind").length;
          const turb = Math.max(0.35, 1 - adjWinds * 0.35);
          const subB = hasSub ? 1.35 : 1.0;
          const out = REWIRE_RULES.windBaseMw * s.windFactor * zB * turb * subB * windTech;
          compGreen += out;
          if (out > 0.1) sources.push(k);
          upkeepBuildings++;
        } else if (c === "battery") {
          compCapMwh += REWIRE_RULES.batteryCapMwh;
          sources.push(k);
          upkeepBuildings++;
        } else if (c === "gravity_tower") {
          compCapMwh += REWIRE_RULES.gravityTowerCapMwh;
          sources.push(k);
        } else if (c === "substation") {
          upkeepBuildings++;
        } else if (c === "city") {
          citiesInComp.push(k);
        }
      }

      const compRawProd = compFossil + compGreen + (citiesInComp.length > 0 ? s.dynamoBoostMw : 0);
      const hasPower = compRawProd > 0.1 || compCapMwh > 0;

      if (hasPower) {
        for (const k of comp) s.powered[k] = true;
        poweredCityCount += citiesInComp.length;
      }

      // Arbre BFS multi-source pour calculer le goulot de flux sur chaque câble menant aux villes
      const parent = new Int32Array(N * N).fill(-1);
      const seen = new Uint8Array(N * N);
      const bfs: number[] = [];
      for (const sk of sources) {
        seen[sk] = 1;
        bfs.push(sk);
      }
      for (let bi = 0; bi < bfs.length; bi++) {
        const cur = bfs[bi];
        for (const nk of neighborsUnlocked(s, cur % N, Math.floor(cur / N))) {
          if (!seen[nk] && isConductive(s.cells[nk])) {
            seen[nk] = 1;
            parent[nk] = cur;
            bfs.push(nk);
          }
        }
      }

      // On remonte la demande de chaque ville le long des câbles jusqu'aux sources
      let compDemand = 0;
      const rawLoad = new Map<number, number>();
      for (const ck of citiesInComp) {
        const dem = cityDemand.get(ck) ?? 8;
        compDemand += dem;
        let cur = parent[ck];
        while (cur !== -1) {
          if (s.cells[cur] === "cable") {
            rawLoad.set(cur, (rawLoad.get(cur) ?? 0) + dem);
          }
          cur = parent[cur];
        }
      }

      // Si un câble dépasse sa capacité MW (goulot !), il sature et limite le courant livré en aval
      let bottleneckFactor = 1.0;
      for (const [ck, load] of rawLoad) {
        s.cableFlow[ck] = load;
        const cap = s.cableCap[ck];
        if (load > cap) {
          s.overloaded[ck] = true;
          overloadedCables++;
          bottleneckFactor = Math.min(bottleneckFactor, cap / load);
        }
      }

      const maxDeliverableByGrid = compDemand * bottleneckFactor;
      const deliveredHere = hasPower ? Math.min(maxDeliverableByGrid, compRawProd) : 0;
      if (compDemand > maxDeliverableByGrid) {
        totalWasted += compDemand - maxDeliverableByGrid;
      }

      totalFossil += compFossil;
      totalGreen += compGreen;
      totalDemand += compDemand;
      totalDelivered += deliveredHere;
      totalCapMwh += compCapMwh;
    }
  }

  // Ajoute la demande des villes non encore reliées
  for (const [ck, dem] of cityDemand) {
    if (!s.powered[ck]) totalDemand += dem;
  }

  s.fossilMw = totalFossil;
  s.greenMw = totalGreen;
  s.demandMw = totalDemand;
  s.storageCapMwh = totalCapMwh;
  s.storageMwh = Math.min(s.storageMwh, totalCapMwh);
  s.unlockedCities = unlockedCityTotal;
  s.poweredCities = poweredCityCount;
  s.fossilRemaining = activeFossils.length;
  s.overloadedCables = overloadedCables;
  s.wastedMw = totalWasted;

  // Charge / Décharge du stockage
  const rawTotal = totalFossil + totalGreen + s.dynamoBoostMw;
  const flywheelMult = s.modifiers.flywheels ? 1.85 : 1.0;
  let effectiveDelivered = totalDelivered;

  if (dt > 0) {
    const surplus = rawTotal - totalDemand;
    if (surplus > 0 && totalCapMwh > 0) {
      const chargeMw = Math.min(surplus, REWIRE_RULES.batteryRateMw * flywheelMult);
      s.storageMwh = Math.min(totalCapMwh, s.storageMwh + chargeMw * (dt / 3.6));
    } else if (effectiveDelivered < totalDemand && s.storageMwh > 0 && overloadedCables === 0) {
      const gap = totalDemand - effectiveDelivered;
      const maxRate = Math.min(gap, REWIRE_RULES.batteryRateMw * flywheelMult);
      const drawn = Math.min(s.storageMwh, maxRate * (dt / 3.6));
      s.storageMwh -= drawn;
      effectiveDelivered += drawn / (dt / 3.6);
    }
  }

  s.deliveredMw = effectiveDelivered;
  const prodDenom = totalFossil + totalGreen;
  s.greenShare = prodDenom > 0.01 ? totalGreen / prodDenom : s.fossilRemaining === 0 && s.storageMwh > 0 ? 1 : 0;

  // Revenus nets (uniquement sur l'électricité RÉELLEMENT livrée aux villes !)
  const smartMult = 1 + s.upgrades.smartgrid * 0.35;
  const greenDelivered = effectiveDelivered * s.greenShare;
  const fossilDelivered = effectiveDelivered * (1 - s.greenShare);
  const grossRev =
    greenDelivered * REWIRE_RULES.basePricePerMwGreen * smartMult +
    fossilDelivered * REWIRE_RULES.basePricePerMwFossil;
  const costs = s.fossilRemaining * REWIRE_RULES.fossilTaxPerSec + upkeepBuildings * REWIRE_RULES.buildingUpkeepPerSec;
  const netRate = grossRev - costs;
  s.incomeRate = netRate;

  // Stabilité & Fréquence (blackout réel si déficit ou goulot sévère ou villes déconnectées)
  const deficitRatio = totalDemand > 0 ? Math.max(0, (totalDemand - effectiveDelivered) / totalDemand) : 0;

  if (dt > 0) {
    s.credits = Math.max(0, s.credits + netRate * dt);
    const overloadPenalty = overloadedCables > 0 ? 4.5 : 0;

    if (deficitRatio > 0.08 || overloadedCables > 0) {
      const drain = deficitRatio * REWIRE_RULES.stabilityDrainPerSec + overloadPenalty;
      const damp = s.modifiers.flywheels ? 0.65 : 1.0;
      s.stability = Math.max(0, s.stability - drain * damp * dt);
      s.frequencyHz = Math.max(47.0, 50 - (100 - s.stability) * 0.028);
    } else {
      const rec = REWIRE_RULES.stabilityRecoverPerSec * (s.modifiers.flywheels ? 1.45 : 1.0);
      s.stability = Math.min(100, s.stability + rec * dt);
      s.frequencyHz = Math.min(50, 50 - (100 - s.stability) * 0.015);
    }

    // Renaturation uniquement sur les cases débloquées hors smog
    const mossMult = 1 + s.upgrades.biomoss * 0.8;
    const cleanDrive =
      s.fossilRemaining === 0 && s.poweredCities === s.unlockedCities && s.stability > 40
        ? 1.0 * mossMult
        : Math.max(0, (s.greenShare - 0.55) * 0.45 * mossMult);

    let greenSum = 0;
    let countPlayable = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!isUnlocked(s, x, y)) continue;
        const k = idx(x, y);
        if (s.world.terrain[k] === "rubble") continue;
        countPlayable++;
        if (s.smog[k]) {
          s.green[k] = Math.max(0, s.green[k] - 0.14 * dt);
        } else if (cleanDrive > 0) {
          s.green[k] = Math.min(1, s.green[k] + cleanDrive * REWIRE_RULES.renatureRatePerSec * dt);
        }
        greenSum += s.green[k];
      }
    }
    s.renature = countPlayable > 0 ? greenSum / countPlayable : 0;

    if (s.stability <= 0) {
      s.phase = "blackout";
      s.message = "Blackout ! Un goulot de câbles ou un manque de stockage nocturne a fait décrocher le réseau.";
    } else if (
      s.unlockedZone === ZONES.length &&
      s.fossilRemaining === 0 &&
      s.poweredCities === s.unlockedCities &&
      s.renature >= 0.9
    ) {
      s.phase = "won";
      s.message = "Victoire totale ! Les 5 zones (23×23) sont 100 % renouvelables et renaturées.";
    }
  }
}

export function tickRewire(s: RewireState, dt: number): void {
  if (s.phase !== "play") return;
  s.timeSec += dt;
  evaluateGrid(s, dt);
}
