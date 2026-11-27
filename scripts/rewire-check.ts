// Vérification automatisée de REWIRE v0.2 : multi-secteurs, coûts exponentiels, clicker, tech tree, blackout et victoire.
import { generateRewireMap } from "../src/rewire/level";
import { applyTool, buyUpgrade, clickGenerate, currentToolCost, newRewireGame, tickRewire } from "../src/rewire/sim";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ REWIRE check échoué : ${msg}`);
    process.exit(1);
  }
}

// 1. 90 cartes procédurales (secteurs 1 à 3) : toutes reliées au départ
for (let sector = 1; sector <= 3; sector++) {
  for (let seed = 1; seed <= 30; seed++) {
    const lvl = generateRewireMap(seed, sector);
    const expectedPlants = sector >= 2 ? 3 : 2;
    const expectedCities = sector >= 2 ? 4 : 3;
    assert(lvl.plants.length === expectedPlants, `s${sector}/${seed}: ${expectedPlants} centrales attendues`);
    assert(lvl.cities.length === expectedCities, `s${sector}/${seed}: ${expectedCities} quartiers attendus`);
    const g = newRewireGame(seed, { gravityTowers: true, flywheels: false }, sector);
    assert(g.poweredCities === expectedCities, `s${sector}/${seed}: tous les quartiers doivent être reliés au départ`);
  }
}

// 2. Clicker actif + coûts croissants + tech tree
{
  const g = newRewireGame(42);
  const startCr = g.credits;
  clickGenerate(g);
  assert(g.credits > startCr, "le clic manuel doit rapporter des crédits");
  g.credits = 500;
  const c0 = currentToolCost(g, "solar");
  // Place un panneau solaire sur la première case vide disponible
  let placed = false;
  for (let y = 0; y < g.level.h && !placed; y++) {
    for (let x = 0; x < g.level.w && !placed; x++) {
      if (applyTool(g, "solar", x, y)) placed = true;
    }
  }
  assert(placed, "doit pouvoir poser un panneau solaire");
  assert(currentToolCost(g, "solar") > c0, "le prix du solaire doit croître après chaque pose");
  assert(buyUpgrade(g, "click"), "achat amélioration alternateur manuel attendu");
  assert(g.upgrades.click === 1, "niveau alternateur = 1 attendu");
}

// 3. Couper les 2 centrales sans renouvelable provoque bien un blackout
{
  const g = newRewireGame(42);
  g.credits = 2000;
  for (const p of g.level.plants) {
    assert(applyTool(g, "convert", p.x, p.y), "conversion centrale attendue");
  }
  for (let i = 0; i < 400; i++) tickRewire(g, 0.25);
  assert(g.phase === "blackout", `blackout attendu sans renouvelable (phase=${g.phase}, stab=${g.stability})`);
}

// 4. Réseau optimisé (renouvelable + stockage + postes HT + améliorations) mène à la victoire 100 % verte
{
  const g = newRewireGame(42, { gravityTowers: true, flywheels: true });
  g.credits = 5000;
  buyUpgrade(g, "cables");
  buyUpgrade(g, "cables");
  buyUpgrade(g, "wind");
  buyUpgrade(g, "solar");
  buyUpgrade(g, "biomoss");

  let placedWind = 0;
  let placedSolar = 0;
  let placedBat = 0;
  let placedSub = 0;
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
      if (placedSub < 2 && applyTool(g, "substation", x, y)) placedSub++;
      else if (placedWind < 5 && (x + y) % 2 === 0 && applyTool(g, "wind", x, y)) placedWind++;
      else if (placedSolar < 5 && applyTool(g, "solar", x, y)) placedSolar++;
      else if (placedBat < 3 && applyTool(g, "battery", x, y)) placedBat++;
    }
  }
  for (let i = 0; i < 40; i++) tickRewire(g, 0.25);
  for (const p of g.level.plants) applyTool(g, "convert", p.x, p.y);
  for (let i = 0; i < 400 && g.phase === "play"; i++) tickRewire(g, 0.25);
  assert(g.phase === "won", `victoire 100 % verte attendue (phase=${g.phase}, renature=${g.renature.toFixed(2)}, stab=${g.stability.toFixed(1)})`);
}

console.log("✓ REWIRE v0.2 check OK (90 cartes multi-secteurs, clicker, coûts croissants, tech tree, blackout, victoire 100 % verte).");
