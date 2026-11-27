// Vérification automatisée de REWIRE v0.3 : monde 23×23 en 5 zones, dynamo à surchauffe, goulots, blackout et extension de carte.
import { WORLD_SIZE, ZONES } from "../src/rewire/content";
import { generateRewireWorld } from "../src/rewire/level";
import {
  applyTool,
  canExpand,
  clickDynamo,
  expandWorld,
  isUnlocked,
  newRewireGame,
  tickRewire,
} from "../src/rewire/sim";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ REWIRE v0.3 check échoué : ${msg}`);
    process.exit(1);
  }
}

// 1. 40 mondes 23×23 générés avec le bon nombre de centrales et quartiers par zone
for (let seed = 1; seed <= 40; seed++) {
  const w = generateRewireWorld(seed);
  const totalPlants = ZONES.reduce((acc, z) => acc + z.newPlants, 0);
  const totalCities = ZONES.reduce((acc, z) => acc + z.newCities, 0);
  assert(w.plants.length === totalPlants, `seed ${seed}: ${totalPlants} centrales attendues`);
  assert(w.cities.length === totalCities, `seed ${seed}: ${totalCities} quartiers attendus`);
  const g = newRewireGame(seed);
  assert(g.unlockedZone === 1, "doit démarrer en Zone 1");
  assert(g.unlockedCities === 2, "2 quartiers en Zone 1");
  assert(g.fossilRemaining === 1, "1 centrale fossile en Zone 1");
}

// 2. Dynamo anti-cheese : spammer les clics provoque une surchauffe et verrouille temporairement
{
  const g = newRewireGame(42);
  for (let i = 0; i < 6; i++) clickDynamo(g);
  assert(g.dynamoLocked, "la dynamo doit surchauffer après un spam de clics");
  assert(!clickDynamo(g), "un clic en surchauffe doit être bloqué");
  for (let i = 0; i < 30; i++) tickRewire(g, 0.25);
  assert(!g.dynamoLocked, "la dynamo doit refroidir ensuite");
}

// 3. Sans rien construire en Zone 1 (2e ville non reliée + pic du soir), le réseau finit en blackout !
{
  const g = newRewireGame(42);
  for (let i = 0; i < 300 && g.phase === "play"; i++) tickRewire(g, 0.25);
  assert(g.phase === "blackout", `ne rien faire en Zone 1 doit provoquer un blackout (phase=${g.phase}, stab=${g.stability})`);
}

// 4. Nettoyer Zone 1 permet bien d'étendre la carte en Zone 2 (11×11)
{
  const g = newRewireGame(42, { gravityTowers: true, flywheels: true });
  g.credits = 2000;
  // Relie toutes les cases vides non-gravats en Zone 1 avec un mix câbles/éoliennes/solaire/batteries
  const p0 = g.world.plants[0];
  const c1 = g.world.cities[1];
  // Trace un câble vers la 2e ville
  let cx = p0.x;
  let cy = p0.y;
  while (cx !== c1.x) {
    cx += cx < c1.x ? 1 : -1;
    applyTool(g, "cable", cx, cy);
  }
  while (cy !== c1.y) {
    cy += cy < c1.y ? 1 : -1;
    applyTool(g, "cable", cx, cy);
  }
  // Pose des sources renouvelables + stockage en Zone 1
  let wCount = 0;
  let sCount = 0;
  let bCount = 0;
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      if (!isUnlocked(g, x, y)) continue;
      if (wCount < 4 && (x + y) % 2 === 0 && applyTool(g, "wind", x, y)) wCount++;
      else if (sCount < 4 && applyTool(g, "solar", x, y)) sCount++;
      else if (bCount < 2 && applyTool(g, "battery", x, y)) bCount++;
    }
  }
  for (let i = 0; i < 40; i++) tickRewire(g, 0.25);
  assert(applyTool(g, "convert", p0.x, p0.y), "doit pouvoir reconvertir la centrale Zone 1");
  for (let i = 0; i < 200; i++) tickRewire(g, 0.25);
  const exp = canExpand(g);
  assert(exp.ok, `doit pouvoir étendre vers Zone 2 (raison: ${exp.reason}, renature=${g.renature.toFixed(2)}, powered=${g.poweredCities}/${g.unlockedCities})`);
  assert(expandWorld(g), "extension vers Zone 2 attendue");
  assert(g.unlockedZone === 2, "Zone 2 (11×11) doit être débloquée");
  assert(g.unlockedCities === 4, "Zone 2 doit révéler 4 quartiers au total");
}

console.log("✓ REWIRE v0.3 check OK (40 mondes 23×23, dynamo surchauffe, blackout si inactif, extension Zone 1→2).");
