// Joueur automatique : sert aux tests (scripts/viaducs-check.ts) et au mode démo (/jouer/?demo=4).
import type { UpgradeId } from "./content.ts";
import { N4, greedyNetwork, pipeCost } from "./level.ts";
import { buy, nextDay, openValves, pipesUsed, place, stat, tick, upgradeCost, type GameState } from "./sim.ts";

/** Pose un réseau glouton qui relie les sources à tous les quartiers. */
export function autoNetwork(s: GameState) {
  const net = greedyNetwork(s.level);
  if (net) for (const i of net.tiles) place(s, i);
}

/** Tire un tuyau vers chaque urgence active, si les tuyaux restants le permettent. */
export function autoEmergencies(s: GameState) {
  const { w, h } = s.level;
  for (const e of s.emergencies) {
    if (e.status !== "active") continue;
    const near = N4.some(([dx, dy]) => {
      const nx = e.x + dx, ny = e.y + dy;
      return nx >= 0 && ny >= 0 && nx < w && ny < h && s.pipes[ny * w + nx];
    });
    if (near) continue;
    const start = s.pipes.flatMap((p, i) => (p ? [i] : []));
    const path = greedyNetwork({ ...s.level, quarters: [{ x: e.x, y: e.y, name: "" }] }, start);
    if (path && pipesUsed(s) + path.tiles.reduce((a, i) => a + pipeCost(s.level.ground[i]), 0) <= stat(s, "pipes"))
      for (const i of path.tiles) place(s, i);
  }
}

const PLAN: UpgradeId[] = ["water", "pipes", "speed"];

/** Achète des améliorations à tour de rôle. */
export function autoShop(s: GameState) {
  for (let k = 0, turn = s.day; k < 6; k++) {
    const id = PLAN[turn % 3];
    const c = upgradeCost(s, id);
    if (c !== null && s.credits >= c) {
      buy(s, id);
      turn++;
    } else if (c === null) turn++;
    else break;
  }
}

/** Joue une journée entière. */
export function autoDay(s: GameState) {
  autoNetwork(s);
  openValves(s);
  while (s.phase === "run") {
    autoEmergencies(s);
    tick(s, 0.1);
  }
}

/** Joue jusqu'au jour `day` (ou la défaite), puis laisse la journée en préparation avec son réseau. */
export function autoplayTo(s: GameState, day: number) {
  while (s.day < day && s.phase !== "over") {
    autoDay(s);
    if ((s.phase as string) === "over") return;
    autoShop(s);
    nextDay(s);
  }
  if (s.phase === "plan") autoNetwork(s);
}
