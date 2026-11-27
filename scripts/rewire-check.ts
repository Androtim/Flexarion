// Vérification automatisée du prototype REWIRE : génération procédurale, blackout et transition 100 % verte.
import { generateRewireMap } from "../src/rewire/level";
import { applyTool, newRewireGame, tickRewire } from "../src/rewire/sim";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ REWIRE check échoué : ${msg}`);
    process.exit(1);
  }
}

// 1. 100 cartes procédurales générées avec 2 centrales, 3 quartiers et réseau initial alimenté
for (let seed = 1; seed <= 100; seed++) {
  const lvl = generateRewireMap(seed);
  assert(lvl.plants.length === 2, `seed ${seed}: 2 centrales attendues`);
  assert(lvl.cities.length === 3, `seed ${seed}: 3 quartiers attendus`);
  const g = newRewireGame(seed);
  assert(g.poweredCities === 3, `seed ${seed}: tous les quartiers doivent être reliés au départ`);
}

// 2. Couper les 2 centrales sans renouvelable provoque bien un blackout
{
  const g = newRewireGame(42);
  g.credits = 500;
  for (const p of g.level.plants) {
    assert(applyTool(g, "convert", p.x, p.y), "conversion centrale attendue");
  }
  for (let i = 0; i < 400; i++) tickRewire(g, 0.25);
  assert(g.phase === "blackout", `blackout attendu sans renouvelable (phase=${g.phase}, stab=${g.stability})`);
}

// 3. Installer du renouvelable + stockage puis reconvertir les 2 centrales mène à la victoire + renaturation
{
  const g = newRewireGame(42, { gravityTowers: true, flywheels: true });
  g.credits = 600;
  // Pose des éoliennes, panneaux solaires et batteries à côté des câbles initiaux
  let placedWind = 0;
  let placedSolar = 0;
  let placedBat = 0;
  for (let y = 0; y < g.level.h; y++) {
    for (let x = 0; x < g.level.w; x++) {
      const hasNeighbor = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < g.level.w && ny < g.level.h && g.cells[ny * g.level.w + nx] !== "empty";
      });
      if (!hasNeighbor) continue;
      if (placedWind < 5 && applyTool(g, "wind", x, y)) placedWind++;
      else if (placedSolar < 4 && applyTool(g, "solar", x, y)) placedSolar++;
      else if (placedBat < 3 && applyTool(g, "battery", x, y)) placedBat++;
    }
  }
  // Laisse charger un peu le stockage avant de couper les centrales
  for (let i = 0; i < 40; i++) tickRewire(g, 0.25);
  for (const p of g.level.plants) applyTool(g, "convert", p.x, p.y);
  for (let i = 0; i < 320 && g.phase === "play"; i++) tickRewire(g, 0.25);
  assert(g.phase === "won", `victoire 100 % verte attendue (phase=${g.phase}, renature=${g.renature.toFixed(2)}, stab=${g.stability.toFixed(1)})`);
}

console.log("✓ REWIRE check OK (100 cartes procédurales, test blackout, test transition 100 % verte).");
