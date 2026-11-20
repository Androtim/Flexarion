// Contrôle du jeu des viaducs sans navigateur (npm run game:check).
// 1. chaque carte générée est jouable avec les tuyaux disponibles ;
// 2. sans réseau, la partie est perdue ;
// 3. un joueur automatique simple tient plusieurs jours, et la difficulté monte.
import { greedyNetwork, dayShape } from "../src/viaducs/level.ts";
import { dailySeed, newGame, nextDay, openValves, pipesUsed, stat, tick, type GameState } from "../src/viaducs/sim.ts";
import { autoDay, autoShop } from "../src/viaducs/demo.ts";

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures++;
};

// 1. Cartes jouables, sur 40 parties et 12 jours.
{
  let bad = 0, maps = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = newGame(seed);
    for (let d = 1; d <= 12; d++) {
      s.day = d;
      s.upgrades = { speed: 0, water: 0, pipes: Math.min(6, Math.floor(d / 2)) };
      nextDayAt(s, d);
      maps++;
      const net = greedyNetwork(s.level);
      if (!net || net.cost > stat(s, "pipes")) bad++;
    }
  }
  check(bad === 0, `${maps} cartes générées, ${bad} injouable(s)`);
}

function nextDayAt(s: GameState, d: number) {
  s.phase = "report";
  s.day = d - 1;
  nextDay(s);
}

// 1 bis. Carte du jour : la même date donne exactement les mêmes cartes, deux dates différentes non.
{
  const a = newGame(dailySeed("2026-11-20"), "2026-11-20");
  const b = newGame(dailySeed("2026-11-20"), "2026-11-20");
  const c = newGame(dailySeed("2026-11-21"), "2026-11-21");
  const same = JSON.stringify(a.level) === JSON.stringify(b.level);
  const differs = JSON.stringify(a.level) !== JSON.stringify(c.level);
  check(same && differs, `carte du jour : identique pour une même date (${same}), différente le lendemain (${differs})`);
}

// 2. Sans réseau.
{
  const s = newGame(7);
  openValves(s);
  while (s.phase === "run") tick(s, 0.1);
  check(s.report!.quartersOk === 0 && s.trust < 3, `sans tuyau : aucun quartier servi, confiance ${s.trust}/3`);
}

// 3. Joueur automatique : réseau glouton, réaction aux urgences, achats à tour de rôle.
function bot(seed: number, log = false) {
  const s = newGame(seed);
  while (s.phase !== "over" && s.day <= 30) {
    autoDay(s);
    const r = s.report!;
    if (log)
      console.log(
        `  j${r.day} ${s.level.w}×${s.level.h} quartiers ${r.quartersOk}/${r.quartersTotal} urgences ${r.emergenciesOk}/${r.emergenciesTotal} tuyaux ${pipesUsed(s)}/${stat(s, "pipes")} eau ${stat(s, "water")} conf ${s.trust} +${r.credits}cr`,
      );
    if ((s.phase as string) === "over") break;
    autoShop(s);
    nextDay(s);
  }
  return s.day;
}
{
  bot(3, true);
  const days = Array.from({ length: 30 }, (_, k) => bot(100 + k));
  const avg = days.reduce((a, b) => a + b, 0) / days.length;
  console.log(`  joueur automatique sur 30 parties : jours atteints ${Math.min(...days)} à ${Math.max(...days)} (moyenne ${avg.toFixed(1)})`);
  check(Math.min(...days) >= 3, "le joueur automatique passe au moins les 2 premiers jours");
  check(Math.max(...days) <= 30, "la difficulté finit par l'emporter (pas de partie infinie)");
}
console.log(`  forme du jour 1 : ${JSON.stringify(dayShape(1))}, jour 10 : ${JSON.stringify(dayShape(10))}`);

if (failures) {
  console.error(`${failures} échec(s)`);
  process.exit(1);
}
