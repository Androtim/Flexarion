// Simulation de Veridia 2140 : eau par gravité, chaleur, mycélium, quartiers.
// Code pur (sans DOM) : testable avec `node scripts/game-check.ts`.
import { BUILDINGS, RULES, type BuildingId } from "./content.ts";
import { COLS, ROWS, generateMap, type MapTile } from "./map.ts";

export interface Tile extends MapTile {
  build: BuildingId | null;
  /** Eau qui traverse la case aujourd'hui. */
  flow: number;
  /** Réserve d'un bassin. */
  store: number;
  temp: number;
  /** Mycélium éveillé (relié à l'eau). */
  awake: boolean;
  /** L'eau arrive ici mais ne peut aller plus loin (pente nulle ou montante). */
  stagnant: boolean;
  health: number;
  lost: boolean;
  supplied: number;
}

export interface GameState {
  version: 1;
  day: number;
  credits: number;
  /** Débit de la vanne du réservoir (unités d'eau par jour). */
  valve: number;
  reservoir: number;
  ambient: number;
  tiles: Tile[];
  status: "playing" | "won" | "lost";
  log: string[];
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export const idx = (x: number, y: number) => y * COLS + x;
export const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

function neighbors4(s: GameState, t: Tile): Tile[] {
  return N4.filter(([dx, dy]) => inside(t.x + dx, t.y + dy)).map(([dx, dy]) => s.tiles[idx(t.x + dx, t.y + dy)]);
}

function around8(s: GameState, t: Tile): Tile[] {
  const out: Tile[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if ((dx || dy) && inside(t.x + dx, t.y + dy)) out.push(s.tiles[idx(t.x + dx, t.y + dy)]);
  return out;
}

const carriesWater = (t: Tile) => t.build === "aqueduct" || t.build === "basin";
const isWet = (t: Tile) => (t.build === "aqueduct" && t.flow > 0.5) || (t.build === "basin" && t.store > 0.5) || t.ground === "reservoir";

export function newGame(): GameState {
  const tiles: Tile[] = generateMap().map((m) => ({
    ...m,
    build: null,
    flow: 0,
    store: 0,
    temp: 30,
    awake: false,
    stagnant: false,
    health: 100,
    lost: false,
    supplied: 0,
  }));
  const s: GameState = {
    version: 1,
    day: 0,
    credits: RULES.startCredits,
    valve: RULES.valveStart,
    reservoir: RULES.reservoir.start,
    ambient: 29,
    tiles,
    status: "playing",
    log: ["Jour 0 : l'été commence. Reliez le réservoir aux cinq quartiers avant les grandes chaleurs."],
  };
  computeWater(s);
  computeHeat(s);
  return s;
}

export function ambientFor(day: number): number {
  const base = 26 + 12 * Math.sin(Math.PI * Math.min(1, day / RULES.days));
  const hw = day >= RULES.heatwave.from && day <= RULES.heatwave.to ? RULES.heatwave.extra : 0;
  return base + hw;
}

export function canBuild(s: GameState, t: Tile, b: BuildingId): string | null {
  if (s.status !== "playing") return "La partie est terminée.";
  if (t.ground !== "garrigue") return "Impossible de construire ici.";
  if (t.build) return "Case déjà occupée.";
  if (s.credits < BUILDINGS[b].cost) return "Pas assez de crédits.";
  return null;
}

export function build(s: GameState, x: number, y: number, b: BuildingId): string | null {
  const t = s.tiles[idx(x, y)];
  const err = canBuild(s, t, b);
  if (err) return err;
  t.build = b;
  s.credits -= BUILDINGS[b].cost;
  computeWater(s);
  computeHeat(s);
  return null;
}

export function demolish(s: GameState, x: number, y: number): string | null {
  const t = s.tiles[idx(x, y)];
  if (!t.build || s.status !== "playing") return "Rien à démolir.";
  s.credits += Math.floor(BUILDINGS[t.build].cost * RULES.refund);
  t.build = null;
  t.store = 0;
  computeWater(s);
  computeHeat(s);
  return null;
}

/** Calcule les écoulements du jour. Sans `consume`, sert seulement à l'aperçu. */
export function computeWater(s: GameState, consume = false) {
  for (const t of s.tiles) {
    t.flow = 0;
    t.stagnant = false;
    t.supplied = 0;
  }
  const res = s.tiles.find((t) => t.ground === "reservoir")!;
  const evap = (temp: number) => 0.01 + Math.max(0, temp - 30) * 0.0015;

  // Traitement du plus haut au plus bas : l'eau ne remonte jamais, le graphe est acyclique.
  const order = s.tiles.filter((t) => carriesWater(t) || t === res).sort((a, b) => b.elev - a.elev);
  const incoming = new Map<Tile, number>();
  const outs = (t: Tile) => neighbors4(s, t).filter((n) => carriesWater(n) && n.elev < t.elev);
  // Besoin en aval de chaque case (quartiers assoiffés + bassins à remplir), calculé du bas vers le haut.
  // À chaque bifurcation, l'eau se répartit selon ces besoins : elle va là où on l'attend.
  const demand = new Map<Tile, number>();
  for (let i = order.length - 1; i >= 0; i--) {
    const t = order[i];
    let d = t.build === "basin" ? RULES.basinCap - t.store : 0;
    for (const q of neighbors4(s, t)) if (q.ground === "quarter" && !q.lost) d += RULES.quarterDemand;
    for (const n of outs(t)) d += demand.get(n) ?? 0;
    demand.set(t, d);
  }
  const share = (from: Tile, w: number) => {
    const next = outs(from);
    const total = next.reduce((a, n) => a + (demand.get(n) ?? 0), 0);
    for (const n of next) {
      const part = total > 0 ? (demand.get(n) ?? 0) / total : 1 / next.length;
      incoming.set(n, (incoming.get(n) ?? 0) + w * part);
    }
    return next.length;
  };
  const released = outs(res).length ? Math.min(s.reservoir, s.valve) : 0;
  if (consume) s.reservoir -= released;
  res.flow = released;
  share(res, released);

  for (const t of order) {
    if (t === res) continue;
    let w = incoming.get(t) ?? 0;
    t.flow = w;
    let stock = 0;
    if (t.build === "aqueduct") {
      w *= 1 - evap(t.temp);
      t.flow = w;
    } else {
      // Bassin : l'eau entrante s'ajoute à la réserve ; seul le surplus continue.
      stock = t.store + w;
      w = 0;
    }
    // Les quartiers voisins se servent (dans l'eau qui passe, ou dans la réserve du bassin).
    for (const q of neighbors4(s, t)) {
      if (q.ground !== "quarter" || q.lost) continue;
      const need = RULES.quarterDemand - q.supplied;
      if (need <= 0) continue;
      const take = Math.min(need, t.build === "basin" ? stock : w);
      if (t.build === "basin") stock -= take;
      else w -= take;
      q.supplied += take;
    }
    if (t.build === "basin") {
      w = Math.max(0, stock - RULES.basinCap);
      if (consume) t.store = Math.min(stock, RULES.basinCap);
    }
    if (share(t, w) === 0 && w > 0.01) t.stagnant = true;
  }

  // Mycélium : un réseau connexe s'éveille s'il touche une case en eau.
  const seen = new Set<Tile>();
  for (const t of s.tiles) {
    if (t.build !== "mycelium" || seen.has(t)) continue;
    const comp: Tile[] = [];
    const stack = [t];
    seen.add(t);
    while (stack.length) {
      const c = stack.pop()!;
      comp.push(c);
      for (const n of neighbors4(s, c)) if (n.build === "mycelium" && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
    const awake = comp.some((c) => neighbors4(s, c).some(isWet));
    for (const c of comp) c.awake = awake;
  }
}

export function computeHeat(s: GameState) {
  for (const t of s.tiles) {
    let temp = s.ambient + (400 - t.elev) / 150;
    if (t.ground === "quarter") temp += 1;
    if (t.ground === "rock") temp += 1;
    for (const n of around8(s, t)) {
      if (n.build === "dome") temp += 1.5;
    }
    const near = [t, ...around8(s, t)];
    if (near.some((n) => n.build === "basin" && n.store > 0.5)) temp -= 3;
    if (neighbors4(s, t).some((n) => n.build === "aqueduct" && n.flow > 0.5)) temp -= 1.5;
    if (near.some((n) => n.build === "mycelium" && n.awake)) temp -= 4;
    t.temp = temp;
  }
}

/** Avance d'un jour. */
export function step(s: GameState) {
  if (s.status !== "playing") return;
  s.day += 1;
  s.ambient = ambientFor(s.day);
  if (s.day === RULES.heatwave.from) s.log.unshift(`Jour ${s.day} : canicule ! +${RULES.heatwave.extra} °C pendant une semaine.`);

  const p = s.day / RULES.days;
  const inflow = RULES.reservoir.inflowStart + (RULES.reservoir.inflowEnd - RULES.reservoir.inflowStart) * p;
  s.reservoir = Math.min(RULES.reservoir.cap, s.reservoir + inflow);

  computeHeat(s);
  computeWater(s, true);
  computeHeat(s);

  const wells = RULES.wellsStart + (RULES.wellsEnd - RULES.wellsStart) * p;
  for (const q of s.tiles) {
    if (q.ground !== "quarter" || q.lost) continue;
    const r = Math.min(1, q.supplied / RULES.quarterDemand + wells);
    const damage = (1 - r) * 3 + Math.max(0, q.temp - RULES.heatLimit) * 0.6;
    const heal = r >= 0.999 && q.temp < RULES.heatLimit - 2 ? 2 : 0;
    q.health = Math.max(0, Math.min(100, q.health - damage + heal));
    if (q.health <= 0) {
      q.lost = true;
      s.log.unshift(`Jour ${s.day} : le quartier ${q.quarterName} est évacué.`);
    }
  }

  const domes = s.tiles.filter((t) => t.build === "dome").length;
  s.credits += RULES.baseIncome + domes * RULES.domeIncome;

  const alive = s.tiles.filter((t) => t.ground === "quarter" && !t.lost).length;
  if (alive === 0) {
    s.status = "lost";
    s.log.unshift(`Jour ${s.day} : tous les quartiers sont évacués.`);
  } else if (s.day >= RULES.days) {
    s.status = alive === 5 ? "won" : "lost";
    s.log.unshift(
      alive === 5
        ? "Fin de l'été : Veridia a tenu, aucun quartier perdu !"
        : `Fin de l'été : ${alive} quartier${alive > 1 ? "s" : ""} sur 5 ont tenu.`,
    );
  }
  if (s.log.length > 8) s.log.length = 8;
}

export function setValve(s: GameState, v: number) {
  s.valve = Math.max(0, Math.min(RULES.reservoir.maxOut, Math.round(v)));
  computeWater(s);
  computeHeat(s);
}

export function quarters(s: GameState): Tile[] {
  return s.tiles.filter((t) => t.ground === "quarter");
}
