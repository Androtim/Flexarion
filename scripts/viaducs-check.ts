// Contrôle du jeu des viaducs sans navigateur (npm run game:check).
// 1. chaque carte générée est jouable avec les tuyaux disponibles ;
// 2. sans réseau, la partie est perdue ;
// 3. un joueur automatique simple tient plusieurs jours, et la difficulté monte.
import { greedyNetwork, dayShape } from "../src/viaducs/level.ts";
import { chooseWeekly, dailySeed, newGame, newSeason, nextDay, openValves, pipeBudget, pipesUsed, stat, tick, type GameState } from "../src/viaducs/sim.ts";
import { SEASON } from "../src/viaducs/content.ts";
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
// 4. Mode saison : chaque jour, les quartiers habités sont reliables depuis le réseau existant
// avec les tuyaux de base ; le réseau reste d'un jour à l'autre ; la soif finit par l'emporter.
{
  let bad = 0, days = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = newSeason(seed);
    for (let d = 1; d <= SEASON.quarters - SEASON.startQuarters + 1; d++) {
      days++;
      const net = greedyNetwork(s.level);
      if (!net || net.cost > pipeBudget(s)) bad++;
      s.phase = "report";
      nextDay(s);
    }
  }
  check(bad === 0, `saison : ${days} journées sur 40 cartes, ${bad} injouable(s) sans amélioration`);

  const s = newSeason(5);
  autoDay(s);
  const before = [...s.pipes];
  const quarters = s.level.quarters.length;
  autoShop(s);
  nextDay(s);
  const kept = before.every((p, i) => !p || s.pipes[i] || s.level.ground[i] === "quarter");
  check(kept && s.pipes.some(Boolean), "saison : le réseau est conservé au jour suivant");
  check(s.level.quarters.length === quarters + 1 && s.level.w === SEASON.w, `saison : un quartier de plus (${quarters} → ${s.level.quarters.length}), même carte`);

  const w = newSeason(9);
  w.day = SEASON.weekly;
  w.phase = "run";
  w.t = 39.99;
  tick(w, 0.05);
  const lvl = w.upgrades.speed;
  check(w.season!.weekly && !chooseWeekly(w, "speed") && w.upgrades.speed === lvl + 1, "saison : amélioration gratuite au jour 7");

  const seasonBot = (seed: number, log = false) => {
    const g = newSeason(seed);
    while (g.phase !== "over" && g.day <= 60) {
      autoDay(g);
      if (log) console.log(`  saison j${g.day} quartiers ${g.report!.quartersOk}/${g.report!.quartersTotal} tuyaux ${pipesUsed(g)}/${pipeBudget(g)} eau ${stat(g, "water")} soif ${g.season!.thirst}`);
      if ((g.phase as string) === "over") break;
      autoShop(g);
      nextDay(g);
    }
    return g.day;
  };
  seasonBot(3, true);
  const sd = Array.from({ length: 20 }, (_, k) => seasonBot(200 + k));
  console.log(`  saison, joueur automatique sur 20 parties : jours ${Math.min(...sd)} à ${Math.max(...sd)} (moyenne ${(sd.reduce((a, b) => a + b, 0) / sd.length).toFixed(1)})`);
  check(Math.min(...sd) >= 5 && Math.max(...sd) <= 60, "saison : le joueur automatique tient au moins 5 jours, et la saison finit");
}
console.log(`  forme du jour 1 : ${JSON.stringify(dayShape(1))}, jour 10 : ${JSON.stringify(dayShape(10))}`);

if (failures) {
  console.error(`${failures} échec(s)`);
  process.exit(1);
}
