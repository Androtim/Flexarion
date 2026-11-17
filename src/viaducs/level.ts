// Génération procédurale d'une journée : carte, sources, quartiers. Chaque carte générée
// est vérifiée : un réseau existe et tient dans le nombre de tuyaux du joueur.
import { DISTRICTS, SOURCES, TUNING } from "./content.ts";

export type Ground = "land" | "rock" | "pines" | "ravine" | "river" | "source" | "quarter";

export interface Place {
  x: number;
  y: number;
  name: string;
}

export interface Level {
  day: number;
  w: number;
  h: number;
  ground: Ground[];
  sources: Place[];
  quarters: Place[];
  /** Tuyaux qu'il faut au minimum (estimation gloutonne) pour relier tous les quartiers. */
  needed: number;
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Coût en tuyaux pour poser sur ce sol (Infinity : impossible). */
export function pipeCost(g: Ground): number {
  if (g === "land") return 1;
  if (g === "ravine" || g === "river") return TUNING.viaductCost;
  return Infinity;
}

export function dayShape(day: number) {
  return {
    w: Math.min(15, 8 + day),
    h: Math.min(10, 6 + Math.ceil(day / 2)),
    quarters: Math.min(7, 2 + Math.floor(day / 2)),
    sources: day >= 5 ? 2 : 1,
    /** Consommation d'un quartier (m³/s) : elle augmente avec les jours. */
    rate: 2 + 0.25 * day,
  };
}

/** Coût minimal (glouton) d'un réseau reliant les sources à tous les quartiers. */
export function greedyNetwork(l: Pick<Level, "w" | "h" | "ground" | "sources" | "quarters">, start: number[] = []): { cost: number; tiles: number[] } | null {
  const { w, h, ground } = l;
  const inTree = new Set<number>([...l.sources.map((s) => s.y * w + s.x), ...start]);
  const remaining = new Set(l.quarters.map((q) => q.y * w + q.x));
  let cost = 0;
  const tiles: number[] = [];
  const adjQuarter = (i: number) => {
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of N4) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && remaining.has(ny * w + nx)) return ny * w + nx;
    }
    return -1;
  };
  while (remaining.size) {
    // Dijkstra multi-source depuis tout l'arbre (petite grille : file triée suffit).
    const dist = new Map<number, number>();
    const prev = new Map<number, number>();
    const open: number[] = [];
    for (const i of inTree) {
      dist.set(i, 0);
      open.push(i);
    }
    let found = -1, target = -1;
    while (open.length) {
      open.sort((a, b) => dist.get(b)! - dist.get(a)!);
      const c = open.pop()!;
      const q = adjQuarter(c);
      if (q >= 0) {
        found = c;
        target = q;
        break;
      }
      const cx = c % w, cy = (c / w) | 0;
      for (const [dx, dy] of N4) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        const step = inTree.has(n) ? 0 : pipeCost(ground[n]);
        if (!isFinite(step)) continue;
        const d = dist.get(c)! + step;
        if (d < (dist.get(n) ?? Infinity)) {
          if (!dist.has(n)) open.push(n);
          dist.set(n, d);
          prev.set(n, c);
        }
      }
    }
    if (found < 0) return null;
    cost += dist.get(found)!;
    for (let c: number | undefined = found; c !== undefined && !inTree.has(c); c = prev.get(c)) {
      inTree.add(c);
      tiles.push(c);
    }
    remaining.delete(target);
  }
  return { cost, tiles };
}

function attempt(day: number, seed: number, quarterCount: number): Level {
  const r = rng(seed);
  const shape = dayShape(day);
  const { w, h } = shape;
  const ground: Ground[] = new Array(w * h).fill("land");
  const at = (x: number, y: number) => y * w + x;
  const ri = (n: number) => Math.floor(r() * n);

  // L'Arc : une rivière qui serpente d'ouest en est (à partir du jour 3).
  if (day >= 3) {
    let y = Math.floor(h * 0.45 + r() * h * 0.3);
    for (let x = 0; x < w; x++) {
      ground[at(x, y)] = "river";
      if (r() < 0.35) {
        const ny = Math.max(2, Math.min(h - 2, y + (r() < 0.5 ? -1 : 1)));
        if (ny !== y) ground[at(x, ny)] = "river";
        y = ny;
      }
    }
  }
  // Vallons secs : il faut un viaduc pour les franchir.
  const ravines = Math.min(4, Math.floor(day / 2));
  for (let k = 0; k < ravines; k++) {
    let x = ri(w), y = ri(h);
    const len = 2 + ri(3);
    const vertical = r() < 0.5;
    for (let i = 0; i < len; i++) {
      if (x >= 0 && y >= 0 && x < w && y < h && ground[at(x, y)] === "land") ground[at(x, y)] = "ravine";
      if (vertical) y++;
      else x++;
    }
  }
  // Rochers et pinèdes protégées, en amas.
  const blob = (kind: Ground, count: number) => {
    for (let k = 0; k < count; k++) {
      let x = ri(w), y = ri(h);
      const size = 1 + ri(4);
      for (let i = 0; i < size; i++) {
        if (x >= 0 && y >= 0 && x < w && y < h && ground[at(x, y)] === "land") ground[at(x, y)] = kind;
        const [dx, dy] = N4[ri(4)];
        x += dx;
        y += dy;
      }
    }
  };
  const area = w * h;
  blob("rock", Math.round(area * Math.min(0.05, 0.015 + 0.004 * day)));
  blob("pines", Math.round(area * Math.min(0.045, 0.012 + 0.004 * day)));

  // Sources : bord nord, puis bord ouest.
  const sources: Place[] = [];
  const srcNames = [...SOURCES].sort(() => r() - 0.5);
  sources.push({ x: 1 + ri(w - 2), y: 0, name: srcNames[0] });
  if (shape.sources > 1) sources.push({ x: 0, y: 1 + ri(h - 2), name: srcNames[1] });
  for (const s of sources) ground[at(s.x, s.y)] = "source";

  // Quartiers : loin des sources et les uns des autres.
  const names = [...DISTRICTS].sort(() => r() - 0.5);
  const quarters: Place[] = [];
  for (let tries = 0; quarters.length < quarterCount && tries < 400; tries++) {
    const x = ri(w), y = 1 + ri(h - 1);
    if (ground[at(x, y)] !== "land") continue;
    const far = (p: Place, d: number) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) >= d;
    if (!sources.every((s) => far(s, 3)) || !quarters.every((q) => far(q, 2))) continue;
    quarters.push({ x, y, name: names[quarters.length] });
    ground[at(x, y)] = "quarter";
  }
  // Un passage autour de chaque source.
  for (const s of sources)
    for (const [dx, dy] of N4) {
      const nx = s.x + dx, ny = s.y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && (ground[at(nx, ny)] === "rock" || ground[at(nx, ny)] === "pines")) ground[at(nx, ny)] = "land";
    }
  const level: Level = { day, w, h, ground, sources, quarters, needed: Infinity };
  const net = quarters.length === quarterCount ? greedyNetwork(level) : null;
  level.needed = net ? net.cost : Infinity;
  return level;
}

/**
 * Carte du jour `day` pour une partie `seed`. Garantie : un réseau existe et tient dans
 * `budget` tuyaux en gardant une petite réserve pour les urgences.
 */
export function generateLevel(day: number, seed: number, budget: number): Level {
  const reserve = day >= 2 ? 3 : 1;
  let quarters = dayShape(day).quarters;
  for (;;) {
    for (let k = 0; k < 60; k++) {
      const l = attempt(day, (seed * 7919 + day * 104729 + k * 31337 + quarters) >>> 0, quarters);
      if (l.needed <= budget - reserve) return l;
    }
    if (quarters <= 1) break;
    quarters--;
  }
  // Filet de sécurité (jamais atteint en pratique) : une carte vide avec un quartier proche.
  const w = 8, h = 6;
  const ground: Ground[] = new Array(w * h).fill("land");
  ground[3] = "source";
  ground[3 * w + 3] = "quarter";
  return { day, w, h, ground, sources: [{ x: 3, y: 0, name: SOURCES[0] }], quarters: [{ x: 3, y: 3, name: DISTRICTS[0] }], needed: 2 };
}
