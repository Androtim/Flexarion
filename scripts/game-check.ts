// Contrôle de la simulation sans navigateur : node scripts/game-check.ts
// 1. chaque quartier est atteignable par une pente descendante depuis le réservoir ;
// 2. sans rien construire, la partie est perdue ;
// 3. une stratégie raisonnable (aqueducs + bassins + mycélium) permet de gagner.
import { COLS, ROWS } from "../src/game/map.ts";
import { newGame, step, quarters } from "../src/game/sim.ts";
import { autoplayDay, downhillPath } from "../src/game/demo.ts";

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures++;
};

// 1. Atteignabilité
{
  const s = newGame();
  for (const q of quarters(s)) {
    const p = downhillPath(s, q);
    check(!!p, `${q.quarterName} atteignable (${p ? p.length + " aqueducs" : "aucun chemin"})`);
  }
}

// 2. Sans rien faire
{
  const s = newGame();
  while (s.status === "playing") step(s);
  const alive = quarters(s).filter((q) => !q.lost).length;
  check(s.status === "lost", `sans construction : partie perdue (jour ${s.day}, ${alive}/5 quartiers)`);
}

// 3. Stratégie : réseau d'aqueducs partagé, un bassin et du mycélium près de chaque quartier.
{
  const s = newGame();
  for (let d = 0; d < 90 && s.status === "playing"; d++) {
    autoplayDay(s);
    step(s);
    if (process.env.DEBUG && s.day % 10 === 0) console.log(`  j${s.day} rés ${Math.round(s.reservoir)} amb ${s.ambient.toFixed(1)} | ` + quarters(s).map((q) => `${q.quarterName.slice(0, 6)} eau ${q.supplied.toFixed(1)} t ${q.temp.toFixed(0)} pv ${Math.round(q.health)}`).join(" | "));
  }
  const alive = quarters(s).filter((q) => !q.lost);
  console.log(`  fin : jour ${s.day}, réservoir ${Math.round(s.reservoir)}, crédits ${s.credits}`);
  for (const q of quarters(s)) console.log(`  ${q.quarterName.padEnd(14)} santé ${Math.round(q.health)} ${q.lost ? "(évacué)" : ""} temp ${q.temp.toFixed(1)}`);
  check(alive.length >= 4, `stratégie simple : ${alive.length}/5 quartiers tiennent`);
}

console.log(`\nCarte ${COLS}×${ROWS}`);
if (failures) {
  console.error(`${failures} échec(s)`);
  process.exit(1);
}
