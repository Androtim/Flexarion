// Génération procédurale du monde complet 23×23 de REWIRE découpé en 5 anneaux concentriques.
import { DISTRICT_NAMES, WORLD_CENTER, WORLD_SIZE, ZONES } from "./content";

export type Terrain = "concrete" | "solar_zone" | "wind_zone" | "rubble";

export interface PlantInit {
  x: number;
  y: number;
  zone: number;
  mw: number;
  name: string;
}

export interface CityInit {
  x: number;
  y: number;
  zone: number;
  baseDemand: number;
  name: string;
}

export interface RewireWorld {
  seed: number;
  size: number;
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

export function idx(x: number, y: number): number {
  return y * WORLD_SIZE + x;
}

export function cellZone(x: number, y: number): number {
  const dist = Math.max(Math.abs(x - WORLD_CENTER), Math.abs(y - WORLD_CENTER));
  for (const z of ZONES) {
    if (dist <= z.radius) return z.zone;
  }
  return ZONES[ZONES.length - 1].zone;
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/** Génère un monde 23×23 complet avec centrales, quartiers et zones de ressources répartis par anneau. */
export function generateRewireWorld(seed: number): RewireWorld {
  const rand = mulberry32(seed);
  const N = WORLD_SIZE;
  const terrain: Terrain[] = new Array(N * N).fill("concrete");

  // Zones solaires & couloirs de vent répartis sur tout le monde
  for (let i = 0; i < 24; i++) {
    const cx = 1 + Math.floor(rand() * (N - 2));
    const cy = 1 + Math.floor(rand() * (N - 2));
    const kind: Terrain = i % 2 === 0 ? "wind_zone" : "solar_zone";
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && rand() < 0.62) {
          terrain[idx(nx, ny)] = kind;
        }
      }
    }
  }

  // Gravats brutalistes infranchissables (créent de vrais couloirs de routage)
  for (let i = 0; i < 42; i++) {
    const rx = Math.floor(rand() * N);
    const ry = Math.floor(rand() * N);
    if (Math.abs(rx - WORLD_CENTER) <= 1 && Math.abs(ry - WORLD_CENTER) <= 1) continue;
    terrain[idx(rx, ry)] = "rubble";
  }

  const occupied = new Set<number>();
  const plants: PlantInit[] = [];
  const cities: CityInit[] = [];
  let cityNameIdx = 0;
  let plantIdx = 1;

  const pickCellInZone = (zone: number, minDist: number): [number, number] => {
    const zDef = ZONES[zone - 1];
    const prevR = zone === 1 ? -1 : ZONES[zone - 2].radius;
    const candidates: Array<[number, number]> = [];
    for (let y = WORLD_CENTER - zDef.radius; y <= WORLD_CENTER + zDef.radius; y++) {
      for (let x = WORLD_CENTER - zDef.radius; x <= WORLD_CENTER + zDef.radius; x++) {
        const d = Math.max(Math.abs(x - WORLD_CENTER), Math.abs(y - WORLD_CENTER));
        if (d <= prevR || d > zDef.radius) continue;
        if (occupied.has(idx(x, y))) continue;
        const tooClose = [...plants, ...cities].some((p) => manhattan(p.x, p.y, x, y) < minDist);
        if (!tooClose) candidates.push([x, y]);
      }
    }
    if (candidates.length === 0) {
      // Fallback avec distance réduite
      for (let y = WORLD_CENTER - zDef.radius; y <= WORLD_CENTER + zDef.radius; y++) {
        for (let x = WORLD_CENTER - zDef.radius; x <= WORLD_CENTER + zDef.radius; x++) {
          const d = Math.max(Math.abs(x - WORLD_CENTER), Math.abs(y - WORLD_CENTER));
          if (d > prevR && d <= zDef.radius && !occupied.has(idx(x, y))) candidates.push([x, y]);
        }
      }
    }
    const [px, py] = candidates[Math.floor(rand() * candidates.length)];
    occupied.add(idx(px, py));
    terrain[idx(px, py)] = "concrete";
    return [px, py];
  };

  for (const zDef of ZONES) {
    for (let i = 0; i < zDef.newPlants; i++) {
      const [px, py] = pickCellInZone(zDef.zone, 3);
      plants.push({
        x: px,
        y: py,
        zone: zDef.zone,
        mw: zDef.plantMw,
        name: `Centrale Monolithe #${plantIdx++}`,
      });
    }
    for (let i = 0; i < zDef.newCities; i++) {
      const [cx, cy] = pickCellInZone(zDef.zone, 3);
      cities.push({
        x: cx,
        y: cy,
        zone: zDef.zone,
        baseDemand: zDef.cityDemand + (i % 2),
        name: DISTRICT_NAMES[cityNameIdx++ % DISTRICT_NAMES.length],
      });
    }
  }

  // En Zone 1 : on relie SEULEMENT la 1re ville à la centrale de départ (la 2e ville est à câbler soi-même !)
  const initialCables: Array<[number, number]> = [];
  const p0 = plants[0];
  const c0 = cities[0];
  let x = p0.x;
  let y = p0.y;
  while (x !== c0.x) {
    x += x < c0.x ? 1 : -1;
    const k = idx(x, y);
    if (terrain[k] === "rubble") terrain[k] = "concrete";
    if (!occupied.has(k)) initialCables.push([x, y]);
  }
  while (y !== c0.y) {
    y += y < c0.y ? 1 : -1;
    const k = idx(x, y);
    if (terrain[k] === "rubble") terrain[k] = "concrete";
    if (!occupied.has(k)) initialCables.push([x, y]);
  }

  return { seed, size: N, terrain, plants, cities, initialCables };
}
