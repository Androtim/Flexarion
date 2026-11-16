// Carte du district : relief déterministe (même carte pour tous les joueurs).
// En haut la Sainte-Victoire et le réservoir, en bas la ville.

export type Ground = "garrigue" | "rock" | "quarter" | "reservoir";

export interface MapTile {
  x: number;
  y: number;
  elev: number;
  ground: Ground;
  quarterName?: string;
}

export const COLS = 18;
export const ROWS = 12;

// Bruit de valeur déterministe (aucune dépendance au hasard du navigateur).
function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise(x: number, y: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1);
  return a + (b - a) * s(fx) + (c - a) * s(fy) + (a - b - c + d) * s(fx) * s(fy);
}

const QUARTERS: Array<[number, number, string]> = [
  [2, 10, "Les Milles"],
  [6, 11, "Mazarin"],
  [10, 10, "Les Fontaines"],
  [14, 11, "Encagnane"],
  [16, 9, "Pont de l'Arc"],
];

const ROCKS: Array<[number, number]> = [
  [11, 0], [12, 0], [13, 0], [14, 0], [12, 1], [13, 1], [15, 0], [8, 5], [8, 6], [9, 6],
];

export function generateMap(): MapTile[] {
  const tiles: MapTile[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // Pente générale nord → sud, une crête au centre et du relief local.
      // Le terrain descend vers le sud et s'écarte du réservoir (colonne 4) vers l'est et l'ouest.
      const slope = 410 - y * 21 - Math.abs(x - 4) * 2.5;
      const ridge = 26 * Math.exp(-((x - 9) ** 2) / 6) * (y > 2 && y < 8 ? 1 : 0.3);
      const bumps = (noise(x / 2.6, y / 2.6) - 0.5) * 34;
      tiles.push({ x, y, elev: Math.round(slope + ridge + bumps), ground: "garrigue" });
    }
  }
  const at = (x: number, y: number) => tiles[y * COLS + x];
  for (const [x, y] of ROCKS) at(x, y).ground = "rock";
  const res = at(4, 0);
  res.ground = "reservoir";
  res.elev = 440;
  for (const [x, y, name] of QUARTERS) {
    const t = at(x, y);
    t.ground = "quarter";
    t.quarterName = name;
  }
  return tiles;
}
