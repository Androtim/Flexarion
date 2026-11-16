// Joueur automatique « raisonnable » : sert au contrôle d'équilibrage (scripts/game-check.ts)
// et au mode démo (/jouer/?demo=45) pour les captures et les vidéos.
import { build, demolish, idx, inside, quarters, setValve, step, type GameState, type Tile } from "./sim.ts";

/** Plus court chemin strictement descendant, du réservoir jusqu'à une case voisine du quartier. */
export function downhillPath(s: GameState, q: Tile): Tile[] | null {
  const res = s.tiles.find((t) => t.ground === "reservoir")!;
  const prev = new Map<Tile, Tile | null>([[res, null]]);
  const queue: Tile[] = [res];
  while (queue.length) {
    const c = queue.shift()!;
    if (c !== res && Math.abs(c.x - q.x) + Math.abs(c.y - q.y) === 1) {
      const path: Tile[] = [];
      for (let p: Tile | null = c; p && p !== res; p = prev.get(p)!) path.unshift(p);
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, ny = c.y + dy;
      if (!inside(nx, ny)) continue;
      const n = s.tiles[idx(nx, ny)];
      if (prev.has(n) || n.elev >= c.elev) continue;
      if (n.ground !== "garrigue" && n.build !== "aqueduct") continue;
      prev.set(n, c);
      queue.push(n);
    }
  }
  return null;
}

/** Une journée de décisions : finir les chemins, poser un bassin au bout, du mycélium contre l'eau. */
export function autoplayDay(s: GameState) {
  if (s.day === 0) setValve(s, 32);
  for (const q of quarters(s)) {
    if (q.lost) continue;
    const path = downhillPath(s, q) ?? [];
    for (const t of path) if (!t.build) build(s, t.x, t.y, "aqueduct");
    const end = path[path.length - 1];
    if (end && end.build === "aqueduct" && s.credits >= 14) {
      demolish(s, end.x, end.y);
      build(s, end.x, end.y, "basin");
    }
  }
  if (s.day % 4 === 0) {
    for (const q of quarters(s)) {
      if (q.lost || s.credits < 25) continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const x = q.x + dx, y = q.y + dy;
          if (!inside(x, y)) continue;
          const t = s.tiles[idx(x, y)];
          if (t.build || t.ground !== "garrigue") continue;
          const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ax, ay]) => {
            if (!inside(x + ax, y + ay)) return false;
            const n = s.tiles[idx(x + ax, y + ay)];
            return n.build === "aqueduct" || n.build === "basin";
          });
          if (wet && s.credits >= 25) build(s, x, y, "mycelium");
        }
    }
  }
}

/** Joue automatiquement jusqu'au jour demandé. */
export function autoplayUntil(s: GameState, day: number) {
  while (s.day < day && s.status === "playing") {
    autoplayDay(s);
    step(s);
  }
}
