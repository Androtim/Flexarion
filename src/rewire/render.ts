// Rendu Canvas 2D de REWIRE v0.3 : caméra dynamique qui dézoome à chaque extension (7×7 → 23×23), smog, goulots rouges.
import { WORLD_SIZE, ZONES, type ToolId } from "./content";
import { idx } from "./level";
import { isUnlocked, unlockedBounds, type CellKind, type RewireState } from "./sim";

function mixColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(a[0] + (b[0] - a[0]) * c);
  const g = Math.round(a[1] + (b[1] - a[1]) * c);
  const bl = Math.round(a[2] + (b[2] - a[2]) * c);
  return `rgb(${r},${g},${bl})`;
}

const CONCRETE_RGB: [number, number, number] = [48, 55, 61];
const GREEN_RGB: [number, number, number] = [34, 118, 82];
const SOLAR_RGB: [number, number, number] = [74, 68, 52];
const WIND_RGB: [number, number, number] = [42, 66, 78];

export interface ViewTransform {
  minX: number;
  minY: number;
  span: number;
  cellSize: number;
}

export function computeView(s: RewireState, canvasCssSize: number): ViewTransform {
  const b = unlockedBounds(s.unlockedZone);
  // Affiche 1 case de brouillard autour pour laisser deviner la prochaine extension
  const margin = s.unlockedZone < ZONES.length ? 1 : 0;
  const minX = Math.max(0, b.min - margin);
  const maxX = Math.min(WORLD_SIZE - 1, b.max + margin);
  const span = maxX - minX + 1;
  const cellSize = canvasCssSize / span;
  return { minX, minY: minX, span, cellSize };
}

export function renderRewire(
  ctx: CanvasRenderingContext2D,
  s: RewireState,
  view: ViewTransform,
  hover: { x: number; y: number } | null,
  activeTool: ToolId,
  animT: number,
): void {
  const { minX, minY, span, cellSize } = view;
  const sizePx = span * cellSize;
  ctx.clearRect(0, 0, sizePx, sizePx);

  const cityLookup = new Map<number, string>();
  for (const c of s.world.cities) cityLookup.set(idx(c.x, c.y), c.name);

  // 1. Dalles de terrain (débloquées + bordure verrouillée dans le brouillard)
  for (let vy = 0; vy < span; vy++) {
    for (let vx = 0; vx < span; vx++) {
      const wx = minX + vx;
      const wy = minY + vy;
      const k = idx(wx, wy);
      const px = vx * cellSize;
      const py = vy * cellSize;
      const unlocked = isUnlocked(s, wx, wy);

      if (!unlocked) {
        ctx.fillStyle = "#12181D";
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
        // Silhouette discrète des structures qui attendent dans le brouillard
        if (s.cells[k] === "city" || s.cells[k] === "fossil") {
          ctx.fillStyle = s.cells[k] === "fossil" ? "rgba(196, 83, 47, 0.25)" : "rgba(42, 212, 165, 0.2)";
          ctx.fillRect(px + cellSize * 0.22, py + cellSize * 0.22, cellSize * 0.56, cellSize * 0.56);
        }
        continue;
      }

      const ter = s.world.terrain[k];
      const g = s.green[k];

      if (ter === "rubble") {
        ctx.fillStyle = "#1E2429";
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.fillStyle = "#3A4249";
        ctx.fillRect(px + cellSize * 0.14, py + cellSize * 0.18, cellSize * 0.36, cellSize * 0.34);
        ctx.fillRect(px + cellSize * 0.48, py + cellSize * 0.46, cellSize * 0.38, cellSize * 0.36);
      } else {
        const base = ter === "solar_zone" ? SOLAR_RGB : ter === "wind_zone" ? WIND_RGB : CONCRETE_RGB;
        ctx.fillStyle = mixColor(base, GREEN_RGB, g);
        ctx.fillRect(px, py, cellSize, cellSize);

        if (ter === "solar_zone" && g < 0.75) {
          ctx.strokeStyle = "rgba(240, 164, 58, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
        } else if (ter === "wind_zone") {
          ctx.strokeStyle = "rgba(130, 224, 214, 0.35)";
          ctx.lineWidth = 1.5;
          const shift = ((animT * 18) % cellSize) * 0.35;
          ctx.beginPath();
          ctx.moveTo(px + 5 + shift * 0.3, py + cellSize * 0.35);
          ctx.lineTo(px + cellSize * 0.65 + shift * 0.3, py + cellSize * 0.35);
          ctx.moveTo(px + cellSize * 0.25 + shift * 0.3, py + cellSize * 0.68);
          ctx.lineTo(px + cellSize * 0.82 + shift * 0.3, py + cellSize * 0.68);
          ctx.stroke();
        }

        if (g > 0.35 && s.cells[k] === "empty") {
          const r = (g - 0.3) * cellSize * 0.24;
          ctx.fillStyle = "#349E6F";
          ctx.beginPath();
          ctx.arc(px + cellSize * 0.32, py + cellSize * 0.62, r, 0, Math.PI * 2);
          ctx.arc(px + cellSize * 0.64, py + cellSize * 0.44, r * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Halo de smog autour des centrales brutalistes actives
      if (s.smog[k]) {
        ctx.fillStyle = "rgba(92, 68, 56, 0.28)";
        ctx.fillRect(px, py, cellSize, cellSize);
      }

      ctx.strokeStyle = "rgba(15, 22, 26, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
    }
  }

  // Bordure lumineuse de la zone actuellement débloquée
  if (s.unlockedZone < ZONES.length) {
    const b = unlockedBounds(s.unlockedZone);
    const bx = (b.min - minX) * cellSize;
    const by = (b.min - minY) * cellSize;
    const bw = b.span * cellSize;
    ctx.strokeStyle = "rgba(42, 212, 165, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(bx + 1, by + 1, bw - 2, bw - 2);
    ctx.setLineDash([]);
  }

  // 2. Câbles électriques connectés (avec goulots rouges surchargés)
  const wireColor =
    s.stability < 45 ? "#E85D3F" : s.greenShare >= 0.75 ? "#2AD4A5" : s.greenShare >= 0.35 ? "#F0A43A" : "#C97846";

  for (let vy = 0; vy < span; vy++) {
    for (let vx = 0; vx < span; vx++) {
      const wx = minX + vx;
      const wy = minY + vy;
      if (!isUnlocked(s, wx, wy)) continue;
      const k = idx(wx, wy);
      if (s.cells[k] === "empty") continue;

      const cx = (vx + 0.5) * cellSize;
      const cy = (vy + 0.5) * cellSize;
      const on = s.powered[k];

      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        const nx = wx + dx;
        const ny = wy + dy;
        if (nx >= WORLD_SIZE || ny >= WORLD_SIZE || !isUnlocked(s, nx, ny)) continue;
        const nk = idx(nx, ny);
        if (s.cells[nk] === "empty") continue;

        const hot = s.overloaded[k] || s.overloaded[nk];
        ctx.strokeStyle = !on ? "#56616B" : hot ? "#FF3B30" : wireColor;
        ctx.lineWidth = Math.max(2.5, cellSize * (hot ? 0.16 : 0.11));
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo((vx + dx + 0.5) * cellSize, (vy + dy + 0.5) * cellSize);
        ctx.stroke();

        if (on) {
          ctx.strokeStyle = hot ? "#FFE066" : "rgba(255,255,255,0.65)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 9]);
          ctx.lineDashOffset = -animT * (hot ? 65 : 34);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo((vx + dx + 0.5) * cellSize, (vy + dy + 0.5) * cellSize);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      if (s.cells[k] === "cable") {
        ctx.fillStyle = s.overloaded[k] ? "#FF3B30" : on ? wireColor : "#6B7680";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2.5, cellSize * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Bâtiments
  for (let vy = 0; vy < span; vy++) {
    for (let vx = 0; vx < span; vx++) {
      const wx = minX + vx;
      const wy = minY + vy;
      if (!isUnlocked(s, wx, wy)) continue;
      const k = idx(wx, wy);
      const kind: CellKind = s.cells[k];
      if (kind === "empty" || kind === "cable") continue;

      const px = vx * cellSize;
      const py = vy * cellSize;
      const cx = px + cellSize * 0.5;
      const cy = py + cellSize * 0.5;

      if (kind === "fossil") {
        ctx.fillStyle = "#5B636A";
        ctx.fillRect(px + cellSize * 0.1, py + cellSize * 0.28, cellSize * 0.8, cellSize * 0.62);
        ctx.fillStyle = "#768088";
        ctx.fillRect(px + cellSize * 0.1, py + cellSize * 0.28, cellSize * 0.8, cellSize * 0.1);
        ctx.fillStyle = "#3E454B";
        ctx.fillRect(px + cellSize * 0.2, py + cellSize * 0.08, cellSize * 0.18, cellSize * 0.24);
        ctx.fillStyle = "#C4532F";
        ctx.fillRect(px + cellSize * 0.2, py + cellSize * 0.08, cellSize * 0.18, cellSize * 0.07);
        const puff = (animT * 14 + wx * 7) % 18;
        ctx.fillStyle = `rgba(140, 148, 156, ${Math.max(0.1, 0.55 - puff / 32)})`;
        ctx.beginPath();
        ctx.arc(px + cellSize * 0.3 + puff * 0.35, py + cellSize * 0.04 - puff * 0.35, cellSize * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#E85D3F";
        ctx.beginPath();
        ctx.arc(px + cellSize * 0.72, py + cellSize * 0.56, cellSize * 0.09, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "gravity_tower") {
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
        ctx.fillStyle = s.sunFactor > 0.15 ? "#17566B" : "#1B2C36";
        ctx.strokeStyle = s.smog[k] ? "#9E6B4F" : s.sunFactor > 0.15 ? "#F0A43A" : "#4E626E";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px + cellSize * 0.14, py + cellSize * 0.22, cellSize * 0.72, cellSize * 0.56, 4);
        ctx.fill();
        ctx.stroke();
      } else if (kind === "wind") {
        ctx.strokeStyle = "#EFE6D2";
        ctx.lineWidth = Math.max(2, cellSize * 0.06);
        ctx.beginPath();
        ctx.moveTo(cx, py + cellSize * 0.88);
        ctx.lineTo(cx, cy - cellSize * 0.06);
        ctx.stroke();
        const rot = animT * (1.8 + s.windFactor * 3.2) + k;
        ctx.save();
        ctx.translate(cx, cy - cellSize * 0.06);
        ctx.rotate(rot);
        ctx.strokeStyle = "#EFE6D2";
        ctx.lineWidth = Math.max(1.8, cellSize * 0.05);
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
        ctx.arc(cx, cy - cellSize * 0.06, Math.max(2.5, cellSize * 0.08), 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "battery") {
        const fillRatio = s.storageCapMwh > 0 ? s.storageMwh / s.storageCapMwh : 0;
        ctx.fillStyle = "#182D35";
        ctx.strokeStyle = s.modifiers.flywheels ? "#F0A43A" : "#2AD4A5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px + cellSize * 0.18, py + cellSize * 0.18, cellSize * 0.64, cellSize * 0.64, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#2AD4A5";
        ctx.fillRect(px + cellSize * 0.26, py + cellSize * 0.36, cellSize * 0.48 * fillRatio, cellSize * 0.28);
      } else if (kind === "substation") {
        ctx.fillStyle = "#1E303A";
        ctx.strokeStyle = "#F0A43A";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px + cellSize * 0.12, py + cellSize * 0.14, cellSize * 0.76, cellSize * 0.72, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#F0A43A";
        ctx.beginPath();
        ctx.moveTo(cx + cellSize * 0.04, py + cellSize * 0.24);
        ctx.lineTo(cx - cellSize * 0.14, cy + cellSize * 0.04);
        ctx.lineTo(cx, cy + cellSize * 0.04);
        ctx.lineTo(cx - cellSize * 0.06, py + cellSize * 0.76);
        ctx.lineTo(cx + cellSize * 0.14, cy - cellSize * 0.04);
        ctx.lineTo(cx, cy - cellSize * 0.04);
        ctx.closePath();
        ctx.fill();
      } else if (kind === "city") {
        const ok = s.powered[k] && s.stability > 25;
        ctx.fillStyle = ok ? "#1E4641" : "#4A2320";
        ctx.strokeStyle = ok ? "#2AD4A5" : "#FF4D3D";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(px + cellSize * 0.08, py + cellSize * 0.1, cellSize * 0.84, cellSize * 0.8, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ok ? "#F0A43A" : "#77413C";
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillRect(px + cellSize * (0.2 + c * 0.22), py + cellSize * (0.26 + r * 0.24), cellSize * 0.14, cellSize * 0.14);
          }
        }
        const label = cityLookup.get(k);
        if (label && cellSize >= 32) {
          ctx.font = `600 ${Math.max(9, Math.round(cellSize * 0.19))}px "DM Sans", sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = "#FBF7EE";
          ctx.fillText(label, cx, py + cellSize - 2);
        }
      }
    }
  }

  // 4. Voile nuit
  const nightDarkness = (1 - Math.min(1, s.sunFactor)) * 0.24;
  if (nightDarkness > 0.01) {
    ctx.fillStyle = `rgba(9, 18, 28, ${nightDarkness.toFixed(3)})`;
    ctx.fillRect(0, 0, sizePx, sizePx);
  }

  // 5. Survol
  if (hover && s.phase === "play" && isUnlocked(s, hover.x, hover.y)) {
    const px = (hover.x - minX) * cellSize;
    const py = (hover.y - minY) * cellSize;
    ctx.strokeStyle = activeTool === "erase" ? "#E85D3F" : activeTool === "convert" ? "#F0A43A" : "#2AD4A5";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
  }
}
