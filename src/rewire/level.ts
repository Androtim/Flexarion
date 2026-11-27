// Génération procédurale des secteurs brutalistes de REWIRE (difficulté croissante par secteur).
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
  sector: number;
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

/** Génère un secteur industriel brutaliste. Les secteurs supérieurs ont plus de centrales et de demande. */
export function generateRewireMap(seed: number, sector = 1): RewireLevel {
  const rand = mulberry32(seed + sector * 7919);
  const { w, h } = REWIRE_RULES;
  const terrain: Terrain[] = new Array(w * h).fill("concrete");

  // Zones de vent et dalles solaires
  for (let i = 0; i < 4; i++) {
    const cx = 1 + Math.floor(rand() * (w - 2));
    const cy = 1 + Math.floor(rand() * (h - 2));
    const kind: Terrain = i % 2 === 0 ? "wind_zone" : "solar_zone";
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && rand() < 0.65) {
          terrain[idx(w, nx, ny)] = kind;
        }
      }
    }
  }

  // Gravats brutalistes infranchissables
  const rubbleCount = 8 + Math.min(8, sector * 2) + Math.floor(rand() * 4);
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

  // 2 centrales au secteur 1, 3 centrales à partir du secteur 2
  const plantCount = sector >= 2 ? 3 : 2;
  const plantNames = ["Centrale Monolithe A", "Centrale Thermique B", "Fonderie Charbon C"];
  const plants: PlantInit[] = [];
  for (let i = 0; i < plantCount; i++) {
    const px = 1 + Math.floor(rand() * 3);
    const py =
      plantCount === 2
        ? i === 0
          ? 1 + Math.floor(rand() * 3)
          : h - 4 + Math.floor(rand() * 3)
        : 1 + i * 3 + Math.floor(rand() * 2);
    const clampedY = Math.min(h - 2, Math.max(1, py));
    reserve(px, clampedY);
    plants.push({ x: px, y: clampedY, name: plantNames[i] });
  }

  // 3 quartiers au secteur 1, 4 à partir du secteur 2
  const cityCount = sector >= 2 ? 4 : 3;
  const cities: CityInit[] = [];
  const shuffledNames = [...DISTRICT_NAMES].sort(() => rand() - 0.5);
  const demandScale = 1 + (sector - 1) * 0.25;

  for (let i = 0; i < cityCount; i++) {
    const bandY0 = Math.floor((i * (h - 2)) / cityCount) + 1;
    const bandY1 = Math.min(h - 2, Math.floor(((i + 1) * (h - 2)) / cityCount));
    let cx = w - 3;
    let cy = bandY0;
    for (let tries = 0; tries < 30; tries++) {
      const tx = 6 + Math.floor(rand() * (w - 7));
      const ty = bandY0 + Math.floor(rand() * Math.max(1, bandY1 - bandY0 + 1));
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
      baseDemand: Math.round((8 + (i % 2) * 2) * demandScale),
    });
  }

  // Réseau initial minimal (1 tronc commun → crée un vrai besoin d'optimisation et de lignes parallèles)
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

  for (let i = 1; i < plants.length; i++) {
    carveLine(plants[i - 1].x, plants[i - 1].y, plants[i].x, plants[i].y);
  }
  for (const c of cities) {
    let nearest = plants[0];
    for (const p of plants) {
      if (manhattan(c.x, c.y, p.x, p.y) < manhattan(c.x, c.y, nearest.x, nearest.y)) nearest = p;
    }
    carveLine(nearest.x, nearest.y, c.x, c.y);
  }

  const initialCables: Array<[number, number]> = [...cableSet].map((k) => [k % w, Math.floor(k / w)]);
  return { seed, sector, w, h, terrain, plants, cities, initialCables };
}
