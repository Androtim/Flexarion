// Génération procédurale des cartes industrielles brutalistes de REWIRE.
import { DISTRICT_NAMES, REWIRE_RULES } from "./content";

export type Terrain = "concrete" | "solar_zone" | "wind_zone" | "rubble";

export interface PlantInit {
  x: number;
  y: number;
  name: string;
}

export interface CityInit {
  x: number;
  y: number;
  name: string;
  baseDemand: number;
}

export interface RewireLevel {
  seed: number;
  w: number;
  h: number;
  terrain: Terrain[];
  plants: PlantInit[];
  cities: CityInit[];
  initialCables: Array<[number, number]>;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function idx(w: number, x: number, y: number): number {
  return y * w + x;
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/** Génère une carte industrielle brutaliste garantie jouable (réseau initial déjà relié). */
export function generateRewireMap(seed: number): RewireLevel {
  const rand = mulberry32(seed);
  const { w, h } = REWIRE_RULES;
  const terrain: Terrain[] = new Array(w * h).fill("concrete");

  // Zones de vent (couloirs sur le haut / les bords) et zones solaires (dalles exposées)
  for (let i = 0; i < 3; i++) {
    const cx = 1 + Math.floor(rand() * (w - 2));
    const cy = 1 + Math.floor(rand() * (h - 2));
    const kind: Terrain = i % 2 === 0 ? "wind_zone" : "solar_zone";
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && rand() < 0.72) {
          terrain[idx(w, nx, ny)] = kind;
        }
      }
    }
  }

  // Quelques gravats brutalistes infranchissables
  const rubbleCount = 6 + Math.floor(rand() * 5);
  for (let i = 0; i < rubbleCount; i++) {
    const rx = 1 + Math.floor(rand() * (w - 2));
    const ry = 1 + Math.floor(rand() * (h - 2));
    terrain[idx(w, rx, ry)] = "rubble";
  }

  const occupied = new Set<number>();
  const reserve = (x: number, y: number) => {
    occupied.add(idx(w, x, y));
    terrain[idx(w, x, y)] = "concrete";
  };

  // 2 centrales brutalistes (côté gauche)
  const plants: PlantInit[] = [];
  const plantNames = ["Centrale Monolithe A", "Centrale Thermique B"];
  for (let i = 0; i < 2; i++) {
    const px = 1 + Math.floor(rand() * 3);
    const py = i === 0 ? 1 + Math.floor(rand() * 3) : h - 4 + Math.floor(rand() * 3);
    reserve(px, py);
    plants.push({ x: px, y: py, name: plantNames[i] });
  }

  // 3 quartiers demandeurs (centre / droite)
  const cities: CityInit[] = [];
  const shuffledNames = [...DISTRICT_NAMES].sort(() => rand() - 0.5);
  const bands = [
    { x0: 6, x1: 9, y0: 1, y1: 3 },
    { x0: 9, x1: w - 2, y0: 4, y1: 6 },
    { x0: 6, x1: w - 2, y0: 7, y1: h - 2 },
  ];

  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    let cx = b.x0;
    let cy = b.y0;
    for (let tries = 0; tries < 25; tries++) {
      const tx = b.x0 + Math.floor(rand() * (b.x1 - b.x0 + 1));
      const ty = b.y0 + Math.floor(rand() * (b.y1 - b.y0 + 1));
      const tooClose = [...plants, ...cities].some((p) => manhattan(p.x, p.y, tx, ty) < 3);
      if (!tooClose && !occupied.has(idx(w, tx, ty))) {
        cx = tx;
        cy = ty;
        break;
      }
    }
    reserve(cx, cy);
    cities.push({
      x: cx,
      y: cy,
      name: shuffledNames[i],
      baseDemand: 6 + (i === 1 ? 2 : 0),
    });
  }

  // Réseau brutaliste initial : relie chaque centrale et chaque quartier par un tracé en L propre
  const cableSet = new Set<number>();
  const carveLine = (ax: number, ay: number, bx: number, by: number) => {
    let x = ax;
    let y = ay;
    while (x !== bx) {
      x += x < bx ? 1 : -1;
      const k = idx(w, x, y);
      if (terrain[k] === "rubble") terrain[k] = "concrete";
      if (!occupied.has(k)) cableSet.add(k);
    }
    while (y !== by) {
      y += y < by ? 1 : -1;
      const k = idx(w, x, y);
      if (terrain[k] === "rubble") terrain[k] = "concrete";
      if (!occupied.has(k)) cableSet.add(k);
    }
  };

  // Relie les 2 centrales ensemble, puis chaque quartier à la centrale la plus proche
  carveLine(plants[0].x, plants[0].y, plants[1].x, plants[1].y);
  for (const c of cities) {
    const nearest =
      manhattan(c.x, c.y, plants[0].x, plants[0].y) <= manhattan(c.x, c.y, plants[1].x, plants[1].y)
        ? plants[0]
        : plants[1];
    carveLine(nearest.x, nearest.y, c.x, c.y);
  }

  const initialCables: Array<[number, number]> = [...cableSet].map((k) => [k % w, Math.floor(k / w)]);
  return { seed, w, h, terrain, plants, cities, initialCables };
}
