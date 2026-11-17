// Simulation de Veridia 2140 (jeu des viaducs). Code pur, sans DOM : testé par scripts/game-check.ts.
//
// Une journée : le joueur pose des tuyaux (préparation), ouvre les vannes, et l'eau avance
// dans le réseau à la vitesse d'acheminement. Chaque quartier doit recevoir son quota avant
// la fin de la journée. Des urgences surgissent : il faut y amener de l'eau à temps.
import { EMERGENCIES, TUNING, UPGRADES, type UpgradeId } from "./content.ts";
import { N4, dayShape, generateLevel, pipeCost, rng, type Level } from "./level.ts";

export type Phase = "plan" | "run" | "report" | "over";

export interface Emergency {
  x: number;
  y: number;
  name: string;
  /** Instant d'apparition (secondes depuis l'ouverture des vannes). */
  at: number;
  /** Temps accordé. */
  limit: number;
  need: number;
  got: number;
  status: "waiting" | "active" | "ok" | "fail";
}

export interface DayReport {
  day: number;
  quartersOk: number;
  quartersTotal: number;
  emergenciesOk: number;
  emergenciesTotal: number;
  sparePipes: number;
  credits: number;
  trustDelta: number;
}

export interface GameState {
  version: 2;
  seed: number;
  day: number;
  credits: number;
  trust: number;
  upgrades: Record<UpgradeId, number>;
  level: Level;
  phase: Phase;
  /** Secondes écoulées depuis l'ouverture des vannes. */
  t: number;
  pipes: number[];
  /** Remplissage de chaque tuyau (0 sec, 1 en eau). */
  wet: number[];
  /** Direction d'où arrive l'eau dans un tuyau en cours de remplissage (indice dans N4, -1 sinon). */
  wetFrom: number[];
  /** Débit qui traverse chaque case (m³/s), pour l'affichage. */
  flow: number[];
  /** Case amont de chaque tuyau en eau (-1 sinon). */
  parent: number[];
  delivered: number[];
  /** Débit reçu en ce moment par chaque quartier. */
  receiving: number[];
  emergencies: Emergency[];
  report: DayReport | null;
  log: string[];
  /** Eau livrée depuis le début de la partie (m³). */
  total: number;
}

export const EMERGENCY_RATE = 4;

export const stat = (s: GameState, id: UpgradeId) => UPGRADES[id].value(s.upgrades[id]);
export const quota = (s: GameState) => +(dayShape(s.day).rate * TUNING.dayLength * TUNING.quotaShare).toFixed(0);
export const rate = (s: GameState) => dayShape(s.day).rate;

export function pipesUsed(s: GameState): number {
  let n = 0;
  for (let i = 0; i < s.pipes.length; i++) if (s.pipes[i]) n += pipeCost(s.level.ground[i]);
  return n;
}

export function newGame(seed = (Math.random() * 2 ** 31) >>> 0): GameState {
  const s = {
    version: 2,
    seed,
    day: 1,
    credits: 0,
    trust: TUNING.trustMax,
    upgrades: { speed: 0, water: 0, pipes: 0 },
    log: [],
    total: 0,
  } as unknown as GameState;
  startDay(s);
  return s;
}

/** Prépare la journée `s.day` : nouvelle carte, réseau vide. */
export function startDay(s: GameState) {
  s.level = generateLevel(s.day, s.seed, stat(s, "pipes"));
  const n = s.level.w * s.level.h;
  s.pipes = new Array(n).fill(0);
  resetWater(s);
  s.log.unshift(`Jour ${s.day} : ${s.level.quarters.length} quartier${s.level.quarters.length > 1 ? "s" : ""} à servir.`);
  if (s.log.length > 8) s.log.length = 8;
}

/** Remet l'eau à zéro en gardant les tuyaux (début de journée ou reprise d'une sauvegarde). */
export function resetWater(s: GameState) {
  const n = s.level.w * s.level.h;
  s.phase = "plan";
  s.t = 0;
  s.wet = new Array(n).fill(0);
  s.wetFrom = new Array(n).fill(-1);
  s.flow = new Array(n).fill(0);
  s.parent = new Array(n).fill(-1);
  s.delivered = s.level.quarters.map(() => 0);
  s.receiving = s.level.quarters.map(() => 0);
  s.report = null;
  s.emergencies = planEmergencies(s);
}

function planEmergencies(s: GameState): Emergency[] {
  const count = s.day < 2 ? 0 : s.day < 4 ? 1 : s.day < 7 ? 2 : 3;
  const r = rng(s.seed ^ (s.day * 2654435761));
  const out: Emergency[] = [];
  const span = TUNING.dayLength - 22;
  for (let k = 0; k < count; k++) {
    out.push({
      x: -1,
      y: -1,
      name: EMERGENCIES[Math.floor(r() * EMERGENCIES.length)],
      at: 6 + (span * (k + 0.2 + r() * 0.6)) / count,
      limit: Math.max(10, 16 - s.day * 0.5),
      need: 10,
      got: 0,
      status: "waiting",
    });
  }
  return out;
}

const emergencyAt = (s: GameState, i: number) =>
  s.emergencies.find((e) => (e.status === "active" || e.status === "waiting") && e.y * s.level.w + e.x === i);

export function canPlace(s: GameState, i: number): string | null {
  if (s.phase !== "plan" && s.phase !== "run") return "La journée est terminée.";
  if (s.pipes[i]) return "Il y a déjà un tuyau ici.";
  const g = s.level.ground[i];
  if (g === "rock") return "Rocher : impossible de creuser ici.";
  if (g === "pines") return "Pinède protégée : on contourne.";
  if (g === "source" || g === "quarter") return "Case occupée.";
  if (emergencyAt(s, i)) return "Il faut amener l'eau à côté de l'urgence.";
  if (pipesUsed(s) + pipeCost(g) > stat(s, "pipes")) return g === "land" ? "Plus de tuyaux. Retirez-en un ailleurs." : "Un viaduc coûte 2 tuyaux : il n'en reste pas assez.";
  return null;
}

export function place(s: GameState, i: number): string | null {
  const err = canPlace(s, i);
  if (err) return err;
  s.pipes[i] = 1;
  return null;
}

export function remove(s: GameState, i: number): string | null {
  if (!s.pipes[i]) return "Pas de tuyau ici.";
  if (s.phase !== "plan" && s.phase !== "run") return "La journée est terminée.";
  s.pipes[i] = 0;
  s.wet[i] = 0;
  s.wetFrom[i] = -1;
  return null;
}

export function openValves(s: GameState) {
  if (s.phase === "plan") s.phase = "run";
}

const neighbors = (s: GameState, i: number) => {
  const { w, h } = s.level;
  const x = i % w, y = (i / w) | 0;
  const out: number[] = [];
  for (const [dx, dy] of N4) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(ny * w + nx);
  }
  return out;
};

/** Répartit `amount` entre des demandes plafonnées, à parts égales (remplissage par niveaux). */
export function waterFill(amount: number, limits: number[]): number[] {
  const out = limits.map(() => 0);
  const open = limits.map((_, k) => k).filter((k) => limits[k] > 1e-9);
  let left = amount;
  while (left > 1e-9 && open.length) {
    const share = left / open.length;
    const full = open.filter((k) => limits[k] - out[k] <= share);
    if (!full.length) {
      for (const k of open) out[k] += share;
      break;
    }
    for (const k of full) {
      left -= limits[k] - out[k];
      out[k] = limits[k];
      open.splice(open.indexOf(k), 1);
    }
  }
  return out;
}

/** Avance l'eau et la distribue pendant `dt` secondes. */
export function tick(s: GameState, dt: number) {
  if (s.phase !== "run") return;
  const { level } = s;
  const { w } = level;
  s.t += dt;

  // Urgences : apparition, compte à rebours.
  for (const e of s.emergencies) {
    if (e.status === "waiting" && s.t >= e.at) spawnEmergency(s, e);
    else if (e.status === "active" && s.t >= e.at + e.limit) {
      e.status = "fail";
      s.log.unshift(`Jour ${s.day} : urgence manquée (${e.name}).`);
    }
  }

  // 1. Front de l'eau : le réseau relié aux sources se remplit à la vitesse d'acheminement.
  const srcIdx = level.sources.map((p) => p.y * w + p.x);
  const reached = new Set<number>(srcIdx);
  const queue = [...srcIdx];
  while (queue.length) {
    const c = queue.shift()!;
    for (const n of neighbors(s, c)) if (s.pipes[n] && s.wet[n] >= 1 && !reached.has(n)) { reached.add(n); queue.push(n); }
  }
  const speed = stat(s, "speed");
  const grow: number[] = [];
  for (let i = 0; i < s.pipes.length; i++) {
    if (!s.pipes[i]) continue;
    if (s.wet[i] >= 1) {
      if (!reached.has(i)) s.wet[i] = 0.99; // coupé du réseau : se vide
      continue;
    }
    const feeder = neighbors(s, i).find((n) => reached.has(n));
    if (feeder !== undefined) grow.push(i, feeder);
    else s.wet[i] = Math.max(0, s.wet[i] - 3 * dt);
  }
  for (let k = 0; k < grow.length; k += 2) {
    const i = grow[k], f = grow[k + 1];
    // Un viaduc est plus long à remplir : la vitesse est divisée par son coût.
    s.wet[i] = Math.min(1, s.wet[i] + (speed * dt) / pipeCost(level.ground[i]));
    const dx = (f % w) - (i % w), dy = ((f / w) | 0) - ((i / w) | 0);
    s.wetFrom[i] = N4.findIndex(([a, b]) => a === dx && b === dy);
  }

  // 2. Arbre d'écoulement depuis les sources, sur les tuyaux en eau.
  s.flow.fill(0);
  s.parent.fill(-1);
  const order: number[] = [];
  const seen = new Set<number>(srcIdx);
  const bfs = [...srcIdx];
  while (bfs.length) {
    const c = bfs.shift()!;
    order.push(c);
    for (const n of neighbors(s, c)) if (s.pipes[n] && s.wet[n] >= 1 && !seen.has(n)) { seen.add(n); s.parent[n] = c; bfs.push(n); }
  }
  const children = new Map<number, number[]>();
  for (const c of order) if (s.parent[c] >= 0) children.set(s.parent[c], [...(children.get(s.parent[c]) ?? []), c]);

  // Consommateurs : quartiers (jusqu'au quota) et urgences actives, rattachés à la case la plus proche de la source.
  const q = quota(s);
  const consumers: { kind: "q" | "e"; k: number; demand: number }[] = [];
  const owned = new Map<number, number[]>();
  const qAt = new Map(level.quarters.map((p, k) => [p.y * w + p.x, k]));
  const taken = new Set<string>();
  for (const c of order) {
    for (const n of neighbors(s, c)) {
      let entry: (typeof consumers)[number] | null = null;
      const qk = qAt.get(n);
      if (qk !== undefined && !taken.has("q" + qk)) {
        taken.add("q" + qk);
        entry = { kind: "q", k: qk, demand: s.delivered[qk] < q ? rate(s) : 0 };
      }
      const ek = s.emergencies.findIndex((e) => e.status === "active" && e.y * w + e.x === n);
      if (ek >= 0 && !taken.has("e" + ek)) {
        taken.add("e" + ek);
        entry = { kind: "e", k: ek, demand: EMERGENCY_RATE };
      }
      if (entry && entry.demand > 0) {
        consumers.push(entry);
        owned.set(c, [...(owned.get(c) ?? []), consumers.length - 1]);
      }
    }
  }

  // Demande en aval, plafonnée par la capacité des tuyaux (du bas vers le haut).
  const perSource = stat(s, "water") / srcIdx.length;
  const cap = (c: number) => (srcIdx.includes(c) ? perSource : TUNING.pipeCapacity);
  const demand = new Map<number, number>();
  for (let k = order.length - 1; k >= 0; k--) {
    const c = order[k];
    let d = (owned.get(c) ?? []).reduce((a, j) => a + consumers[j].demand, 0);
    for (const ch of children.get(c) ?? []) d += demand.get(ch)!;
    demand.set(c, Math.min(cap(c), d));
  }
  // Distribution (du haut vers le bas) : chaque embranchement partage à parts égales.
  const given = consumers.map(() => 0);
  const inflow = new Map<number, number>(srcIdx.map((c) => [c, demand.get(c)!]));
  for (const c of order) {
    const f = inflow.get(c) ?? 0;
    s.flow[c] = f;
    const mine = owned.get(c) ?? [];
    const kids = children.get(c) ?? [];
    const alloc = waterFill(f, [...mine.map((j) => consumers[j].demand), ...kids.map((ch) => demand.get(ch)!)]);
    mine.forEach((j, m) => (given[j] = alloc[m]));
    kids.forEach((ch, m) => inflow.set(ch, alloc[mine.length + m]));
  }

  // 3. Livraison.
  s.receiving.fill(0);
  consumers.forEach((c, j) => {
    const v = given[j] * dt;
    s.total += v;
    if (c.kind === "q") {
      s.delivered[c.k] += v;
      s.receiving[c.k] = given[j];
    } else {
      const e = s.emergencies[c.k];
      e.got += v;
      if (e.got >= e.need) {
        e.status = "ok";
        s.log.unshift(`Jour ${s.day} : urgence maîtrisée (${e.name}) !`);
      }
    }
  });

  if (s.t >= TUNING.dayLength) endDay(s);
  if (s.log.length > 8) s.log.length = 8;
}

/** Place une urgence sur une case libre, à quelques tuyaux du réseau actuel. */
function spawnEmergency(s: GameState, e: Emergency) {
  const { w, h, ground } = s.level;
  const r = rng(s.seed ^ (s.day * 7 + Math.round(e.at * 1000)));
  const dist = new Map<number, number>();
  const open: number[] = [];
  for (let i = 0; i < s.pipes.length; i++)
    if (s.pipes[i] || ground[i] === "source") {
      dist.set(i, 0);
      open.push(i);
    }
  while (open.length) {
    open.sort((a, b) => dist.get(b)! - dist.get(a)!);
    const c = open.pop()!;
    for (const n of neighbors(s, c)) {
      const step = s.pipes[n] ? 0 : pipeCost(ground[n]);
      if (!isFinite(step)) continue;
      const d = dist.get(c)! + step;
      if (d < (dist.get(n) ?? Infinity)) {
        if (!dist.has(n)) open.push(n);
        dist.set(n, d);
      }
    }
  }
  const busy = (i: number) => s.emergencies.some((o) => o !== e && o.status === "active" && o.y * w + o.x === i);
  const free = (i: number) => ground[i] === "land" && !s.pipes[i] && !busy(i);
  // Idéalement à 3-5 tuyaux du réseau : atteignable, mais il faut réagir vite.
  let pool = [...dist.keys()].filter((i) => free(i) && dist.get(i)! >= 3 && dist.get(i)! <= 5);
  if (!pool.length) pool = [...dist.keys()].filter((i) => free(i) && dist.get(i)! >= 2);
  if (!pool.length) {
    e.status = "ok"; // aucune place sur la carte : l'urgence se règle seule
    return;
  }
  const i = pool[Math.floor(r() * pool.length)];
  e.x = i % w;
  e.y = (i / w) | 0;
  e.at = s.t;
  e.status = "active";
  s.log.unshift(`Jour ${s.day} : urgence, ${e.name} ! ${Math.round(e.limit)} s pour y amener ${e.need} m³.`);
  void h;
}

export function endDay(s: GameState) {
  const q = quota(s);
  for (const e of s.emergencies) if (e.status === "active" || e.status === "waiting") e.status = e.status === "active" ? "fail" : "ok";
  const quartersOk = s.delivered.filter((d) => d >= q - 1e-6).length;
  const emergenciesOk = s.emergencies.filter((e) => e.status === "ok" && e.x >= 0).length;
  const emergenciesTotal = s.emergencies.filter((e) => e.x >= 0).length;
  const failedEm = emergenciesTotal - emergenciesOk;
  const spare = Math.max(0, stat(s, "pipes") - pipesUsed(s));
  const allOk = quartersOk === s.level.quarters.length;
  const perfect = allOk && failedEm === 0;
  let trustDelta = (allOk ? 0 : -1) - failedEm;
  if (perfect && s.trust < TUNING.trustMax) trustDelta = 1;
  const c = TUNING.credits;
  const credits = quartersOk * c.quarter + emergenciesOk * c.emergency + spare * c.sparePipe + (perfect ? c.perfect : 0);
  s.credits += credits;
  s.trust = Math.max(0, Math.min(TUNING.trustMax, s.trust + trustDelta));
  s.report = {
    day: s.day,
    quartersOk,
    quartersTotal: s.level.quarters.length,
    emergenciesOk,
    emergenciesTotal,
    sparePipes: spare,
    credits,
    trustDelta,
  };
  s.receiving.fill(0);
  s.phase = s.trust <= 0 ? "over" : "report";
  s.log.unshift(
    s.phase === "over"
      ? `Jour ${s.day} : la ville ne vous fait plus confiance.`
      : `Fin du jour ${s.day} : ${quartersOk}/${s.level.quarters.length} quartiers servis.`,
  );
}

export function upgradeCost(s: GameState, id: UpgradeId): number | null {
  const l = s.upgrades[id];
  return l >= UPGRADES[id].max ? null : UPGRADES[id].cost(l);
}

export function buy(s: GameState, id: UpgradeId): string | null {
  if (s.phase !== "report") return "Les améliorations s'achètent entre deux journées.";
  const cost = upgradeCost(s, id);
  if (cost === null) return "Déjà au maximum.";
  if (s.credits < cost) return "Pas assez de crédits.";
  s.credits -= cost;
  s.upgrades[id]++;
  return null;
}

export function nextDay(s: GameState) {
  if (s.phase !== "report") return;
  s.day += 1;
  startDay(s);
}
