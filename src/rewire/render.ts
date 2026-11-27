// Rendu Canvas 2D de REWIRE : dalles brutalistes qui verdissent, câbles électriques animés, éoliennes et fumées.
import { idx } from "./level";
import type { CellKind, RewireState } from "./sim";
import type { ToolId } from "./content";

function mixColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(a[0] + (b[0] - a[0]) * c);
  const g = Math.round(a[1] + (b[1] - a[1]) * c);
  const bl = Math.round(a[2] + (b[2] - a[2]) * c);
  return `rgb(${r},${g},${bl})`;
}

const CONCRETE_RGB: [number, number, number] = [48, 55, 61];
const GREEN_RGB: [number, number, number] = [34, 114, 80];
const SOLAR_RGB: [number, number, number] = [66, 63, 52];
const WIND_RGB: [number, number, number] = [44, 62, 72];

export function renderRewire(
  ctx: CanvasRenderingContext2D,
  s: RewireState,
  cellSize: number,
  hover: { x: number; y: number } | null,
  activeTool: ToolId,
  animT: number,
): void {
  const { w, h, terrain } = s.level;
  const W = w * cellSize;
  const H = h * cellSize;

  ctx.clearRect(0, 0, W, H);

  // 1. Dalles de terrain (béton brutaliste → renaturation verte)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = idx(w, x, y);
      const ter = terrain[k];
      const g = s.green[k];
      const px = x * cellSize;
      const py = y * cellSize;

      if (ter === "rubble") {
        ctx.fillStyle = "#20252A";
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.fillStyle = "#3A4248";
        ctx.fillRect(px + cellSize * 0.14, py + cellSize * 0.18, cellSize * 0.38, cellSize * 0.34);
        ctx.fillRect(px + cellSize * 0.46, py + cellSize * 0.46, cellSize * 0.4, cellSize * 0.36);
      } else {
        const base = ter === "solar_zone" ? SOLAR_RGB : ter === "wind_zone" ? WIND_RGB : CONCRETE_RGB;
        ctx.fillStyle = mixColor(base, GREEN_RGB, g);
        ctx.fillRect(px, py, cellSize, cellSize);

        // Motifs zones spéciales (subtils)
        if (ter === "solar_zone" && g < 0.7) {
          ctx.strokeStyle = "rgba(240, 164, 58, 0.25)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 5, py + 5, cellSize - 10, cellSize - 10);
        } else if (ter === "wind_zone") {
          ctx.strokeStyle = "rgba(130, 224, 214, 0.28)";
          ctx.lineWidth = 1.5;
          const shift = ((animT * 18) % cellSize) * 0.4;
          ctx.beginPath();
          ctx.moveTo(px + 6 + shift * 0.3, py + cellSize * 0.35);
          ctx.lineTo(px + cellSize * 0.65 + shift * 0.3, py + cellSize * 0.35);
          ctx.moveTo(px + cellSize * 0.25 + shift * 0.3, py + cellSize * 0.68);
          ctx.lineTo(px + cellSize * 0.85 + shift * 0.3, py + cellSize * 0.68);
          ctx.stroke();
        }

        // Touffes d'herbe / petits arbres quand la renaturation progresse
        if (g > 0.35 && s.cells[k] === "empty") {
          const r = (g - 0.3) * cellSize * 0.26;
          ctx.fillStyle = "#349E6F";
          ctx.beginPath();
          ctx.arc(px + cellSize * 0.32, py + cellSize * 0.62, r, 0, Math.PI * 2);
          ctx.arc(px + cellSize * 0.64, py + cellSize * 0.44, r * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Jointure béton subtile
      ctx.strokeStyle = "rgba(15, 22, 26, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
    }
  }

  // 2. Câbles électriques connectés
  const wireColor =
    s.stability < 45 ? "#E85D3F" : s.greenShare >= 0.75 ? "#2AD4A5" : s.greenShare >= 0.35 ? "#F0A43A" : "#C97846";

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = idx(w, x, y);
      if (s.cells[k] === "empty") continue;
      const cx = (x + 0.5) * cellSize;
      const cy = (y + 0.5) * cellSize;
      const on = s.powered[k];

      const dirs: Array<[number, number]> = [
        [1, 0],
        [0, 1],
      ];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= w || ny >= h) continue;
        const nk = idx(w, nx, ny);
        if (s.cells[nk] === "empty") continue;

        ctx.strokeStyle = on ? wireColor : "#56616B";
        ctx.lineWidth = Math.max(3, cellSize * 0.11);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo((nx + 0.5) * cellSize, (ny + 0.5) * cellSize);
        ctx.stroke();

        if (on) {
          ctx.strokeStyle = "rgba(255,255,255,0.65)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 10]);
          ctx.lineDashOffset = -animT * 36;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo((nx + 0.5) * cellSize, (ny + 0.5) * cellSize);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      if (s.cells[k] === "cable") {
        ctx.fillStyle = on ? wireColor : "#6B7680";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(3, cellSize * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Bâtiments (centrales brutalistes, tours gravitaires, solaire, éoliennes, stockages, quartiers)
  const cityLookup = new Map<number, string>();
  for (const c of s.level.cities) cityLookup.set(idx(w, c.x, c.y), c.name);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = idx(w, x, y);
      const kind: CellKind = s.cells[k];
      if (kind === "empty" || kind === "cable") continue;
      const px = x * cellSize;
      const py = y * cellSize;
      const cx = px + cellSize * 0.5;
      const cy = py + cellSize * 0.5;

      if (kind === "fossil") {
        // Bloc brutaliste massif + cheminée fumante
        ctx.fillStyle = "#5B636A";
        ctx.fillRect(px + cellSize * 0.1, py + cellSize * 0.28, cellSize * 0.8, cellSize * 0.62);
        ctx.fillStyle = "#768088";
        ctx.fillRect(px + cellSize * 0.1, py + cellSize * 0.28, cellSize * 0.8, cellSize * 0.1);
        ctx.fillStyle = "#3E454B";
        ctx.fillRect(px + cellSize * 0.2, py + cellSize * 0.08, cellSize * 0.18, cellSize * 0.24);
        ctx.fillStyle = "#C4532F";
        ctx.fillRect(px + cellSize * 0.2, py + cellSize * 0.08, cellSize * 0.18, cellSize * 0.07);
        // Fumée animée
        const puff = (animT * 14 + x * 7) % 18;
        ctx.fillStyle = `rgba(140, 148, 156, ${Math.max(0.1, 0.55 - puff / 32)})`;
        ctx.beginPath();
        ctx.arc(px + cellSize * 0.3 + puff * 0.35, py + cellSize * 0.04 - puff * 0.35, cellSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        // Voyant rouge
        ctx.fillStyle = "#E85D3F";
        ctx.beginPath();
        ctx.arc(px + cellSize * 0.72, py + cellSize * 0.56, cellSize * 0.09, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "gravity_tower") {
        // Tour brutaliste reconvertie en stockage gravitaire + mousse verte
        ctx.fillStyle = "#626E73";
        ctx.fillRect(px + cellSize * 0.16, py + cellSize * 0.12, cellSize * 0.68, cellSize * 0.78);
        const fillRatio = s.storageCapMwh > 0 ? s.storageMwh / s.storageCapMwh : 0;
        ctx.fillStyle = "#14262E";
        ctx.fillRect(px + cellSize * 0.28, py + cellSize * 0.22, cellSize * 0.44, cellSize * 0.52);
        ctx.fillStyle = "#2AD4A5";
        const barH = cellSize * 0.48 * fillRatio;
        ctx.fillRect(px + cellSize * 0.31, py + cellSize * 0.72 - barH, cellSize * 0.38, barH);
        ctx.fillStyle = "#2E8B63";
        ctx.beginPath();
        ctx.arc(px + cellSize * 0.22, py + cellSize * 0.85, cellSize * 0.14, 0, Math.PI * 2);
        ctx.arc(px + cellSize * 0.78, py + cellSize * 0.84, cellSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "solar") {
        // Panneau solaire incliné
        ctx.fillStyle = s.sunFactor > 0.15 ? "#17566B" : "#1B2C36";
        ctx.strokeStyle = s.sunFactor > 0.15 ? "#F0A43A" : "#4E626E";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px + cellSize * 0.14, py + cellSize * 0.22, cellSize * 0.72, cellSize * 0.56, 5);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "rgba(42, 212, 165, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, py + cellSize * 0.22);
        ctx.lineTo(cx, py + cellSize * 0.78);
        ctx.moveTo(px + cellSize * 0.14, cy);
        ctx.lineTo(px + cellSize * 0.86, cy);
        ctx.stroke();
      } else if (kind === "wind") {
        // Éolienne à pales tournantes
        ctx.strokeStyle = "#EFE6D2";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, py + cellSize * 0.88);
        ctx.lineTo(cx, cy - cellSize * 0.06);
        ctx.stroke();
        const rot = animT * (1.8 + s.windFactor * 3.2) + k;
        ctx.save();
        ctx.translate(cx, cy - cellSize * 0.06);
        ctx.rotate(rot);
        ctx.strokeStyle = "#EFE6D2";
        ctx.lineWidth = 2.5;
        for (let b = 0; b < 3; b++) {
          ctx.rotate((Math.PI * 2) / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -cellSize * 0.34);
          ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = "#2AD4A5";
        ctx.beginPath();
        ctx.arc(cx, cy - cellSize * 0.06, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "battery") {
        // Module de stockage électrique
        const fillRatio = s.storageCapMwh > 0 ? s.storageMwh / s.storageCapMwh : 0;
        ctx.fillStyle = "#182D35";
        ctx.strokeStyle = s.modifiers.flywheels ? "#F0A43A" : "#2AD4A5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px + cellSize * 0.18, py + cellSize * 0.18, cellSize * 0.64, cellSize * 0.64, 6);
        ctx.fill();
        ctx.stroke();
        const barW = cellSize * 0.48 * fillRatio;
        ctx.fillStyle = "#2AD4A5";
        ctx.fillRect(px + cellSize * 0.26, py + cellSize * 0.36, barW, cellSize * 0.28);
      } else if (kind === "city") {
        // Quartier / sous-station urbaine
        const ok = s.powered[k] && s.stability > 25;
        ctx.fillStyle = ok ? "#1E4641" : "#4A2320";
        ctx.strokeStyle = ok ? "#2AD4A5" : "#E85D3F";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(px + cellSize * 0.08, py + cellSize * 0.1, cellSize * 0.84, cellSize * 0.8, 8);
        ctx.fill();
        ctx.stroke();
        // Fenêtres allumées
        ctx.fillStyle = ok ? "#F0A43A" : "#77413C";
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillRect(px + cellSize * (0.2 + c * 0.22), py + cellSize * (0.26 + r * 0.24), cellSize * 0.14, cellSize * 0.14);
          }
        }
        const label = cityLookup.get(k);
        if (label && cellSize >= 36) {
          ctx.font = `600 ${Math.max(10, Math.round(cellSize * 0.21))}px "DM Sans", sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = "#FBF7EE";
          ctx.fillText(label, cx, py + cellSize + 12);
        }
      }
    }
  }

  // 4. Voile nuit subtil
  const nightDarkness = (1 - s.sunFactor) * 0.22;
  if (nightDarkness > 0.01) {
    ctx.fillStyle = `rgba(9, 18, 28, ${nightDarkness.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // 5. Aperçu au survol
  if (hover && s.phase === "play") {
    const px = hover.x * cellSize;
    const py = hover.y * cellSize;
    ctx.strokeStyle = activeTool === "erase" ? "#E85D3F" : activeTool === "convert" ? "#F0A43A" : "#2AD4A5";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
  }
}
