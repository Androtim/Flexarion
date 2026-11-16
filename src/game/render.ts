// Rendu canvas de Veridia 2140, dans la palette du site.
import { COLS, ROWS } from "./map.ts";
import { RULES, type BuildingId } from "./content.ts";
import { idx, inside, type GameState, type Tile } from "./sim.ts";

export type View = "normal" | "relief" | "heat";

export interface RenderOpts {
  size: number; // taille d'une case en px CSS
  time: number; // secondes, pour l'animation de l'eau
  view: View;
  hover: { x: number; y: number } | null;
  tool: BuildingId | "demolish" | "inspect";
  preview: string | null; // message d'erreur si construction impossible
}

const P = {
  dusk: "#13262E",
  limestone: "#EFE6D2",
  stone: "#D9C9A8",
  stoneDark: "#B9A47C",
  water: "#1FB5A8",
  waterDeep: "#0C776F",
  waterLight: "#5FE0D3",
  sun: "#F0A43A",
  roof: "#C4532F",
  ruin: "#7A7268",
  sleep: "#7C8A86",
};

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const LOW = [86, 104, 60]; // olivier en contrebas
const HIGH = [214, 202, 172]; // calcaire en altitude

function groundColor(t: Tile): string {
  if (t.ground === "rock") return "#8E8B84";
  const k = Math.max(0, Math.min(1, (t.elev - 140) / 300));
  return rgb(mix(LOW, HIGH, k));
}

function heatColor(temp: number): string {
  const k = Math.max(0, Math.min(1, (temp - 28) / 16));
  const c = k < 0.5 ? mix([31, 181, 168], [240, 164, 58], k * 2) : mix([240, 164, 58], [196, 60, 40], (k - 0.5) * 2);
  return `rgba(${c[0]},${c[1]},${c[2]},0.55)`;
}

export function draw(ctx: CanvasRenderingContext2D, s: GameState, o: RenderOpts) {
  const T = o.size;
  const at = (x: number, y: number) => s.tiles[idx(x, y)];
  ctx.clearRect(0, 0, COLS * T, ROWS * T);

  // Sol et relief
  for (const t of s.tiles) {
    ctx.fillStyle = groundColor(t);
    ctx.fillRect(t.x * T, t.y * T, T + 0.5, T + 0.5);
    if (t.ground === "rock") {
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(t.x * T + (i * T) / 3, t.y * T + T);
        ctx.lineTo(t.x * T + (i * T) / 3 + T / 3, t.y * T);
        ctx.stroke();
      }
    }
  }
  // Courbes de niveau (tous les 25 m)
  ctx.strokeStyle = "rgba(19,38,46,0.22)";
  ctx.lineWidth = 1;
  for (const t of s.tiles) {
    const lvl = Math.floor(t.elev / 25);
    if (t.x + 1 < COLS && Math.floor(at(t.x + 1, t.y).elev / 25) !== lvl) {
      ctx.beginPath();
      ctx.moveTo((t.x + 1) * T, t.y * T);
      ctx.lineTo((t.x + 1) * T, (t.y + 1) * T);
      ctx.stroke();
    }
    if (t.y + 1 < ROWS && Math.floor(at(t.x, t.y + 1).elev / 25) !== lvl) {
      ctx.beginPath();
      ctx.moveTo(t.x * T, (t.y + 1) * T);
      ctx.lineTo((t.x + 1) * T, (t.y + 1) * T);
      ctx.stroke();
    }
  }

  // Mycélium (sous les autres éléments)
  for (const t of s.tiles) {
    if (t.build !== "mycelium") continue;
    const cx = (t.x + 0.5) * T, cy = (t.y + 0.5) * T;
    const col = t.awake ? P.waterLight : P.sleep;
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1.5, T * 0.07);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (!inside(t.x + dx, t.y + dy) || at(t.x + dx, t.y + dy).build !== "mycelium") continue;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * T, cy + dy * T);
      ctx.stroke();
    }
    if (t.awake) {
      ctx.fillStyle = "rgba(95,224,211,0.18)";
      ctx.beginPath();
      ctx.arc(cx, cy, T * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = col;
    for (const [ox, oy, r] of [[-0.2, -0.15, 0.09], [0.18, -0.05, 0.07], [-0.05, 0.2, 0.08], [0, 0, 0.11]]) {
      ctx.beginPath();
      ctx.arc(cx + ox * T, cy + oy * T, r * T, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Aqueducs : un canal de pierre vers chaque voisin relié, l'eau anime le sens de la pente.
  const carries = (t: Tile) => t.build === "aqueduct" || t.build === "basin" || t.ground === "reservoir";
  for (const t of s.tiles) {
    if (t.build !== "aqueduct") continue;
    const cx = (t.x + 0.5) * T, cy = (t.y + 0.5) * T;
    const links = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => inside(t.x + dx, t.y + dy) && carries(at(t.x + dx, t.y + dy)));
    ctx.lineCap = "round";
    ctx.strokeStyle = P.stoneDark;
    ctx.lineWidth = T * 0.42;
    const seg = (dx: number, dy: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (dx * T) / 2, cy + (dy * T) / 2);
      ctx.stroke();
    };
    if (!links.length) seg(0, 0);
    links.forEach(([dx, dy]) => seg(dx, dy));
    ctx.strokeStyle = P.stone;
    ctx.lineWidth = T * 0.3;
    if (!links.length) seg(0, 0);
    links.forEach(([dx, dy]) => seg(dx, dy));
    if (t.flow > 0.3) {
      ctx.lineWidth = T * 0.14;
      for (const [dx, dy] of links) {
        const n = at(t.x + dx, t.y + dy);
        const down = n.elev < t.elev; // l'eau sort vers ce voisin
        ctx.strokeStyle = P.water;
        ctx.setLineDash([]);
        seg(dx, dy);
        ctx.strokeStyle = P.waterLight;
        ctx.setLineDash([T * 0.12, T * 0.18]);
        ctx.lineDashOffset = (down ? -1 : 1) * o.time * T * 0.9;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (dx * T) / 2, cy + (dy * T) / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (t.stagnant) {
      ctx.fillStyle = P.roof;
      ctx.beginPath();
      ctx.arc(cx + T * 0.28, cy - T * 0.28, T * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Réservoir, bassins, dômes, quartiers
  for (const t of s.tiles) {
    const x = t.x * T, y = t.y * T, cx = x + T / 2, cy = y + T / 2;
    if (t.ground === "reservoir") {
      ctx.fillStyle = P.stone;
      ctx.beginPath();
      ctx.arc(cx, cy, T * 0.48, 0, Math.PI * 2);
      ctx.fill();
      const k = s.reservoir / RULES.reservoir.cap;
      ctx.fillStyle = P.waterDeep;
      ctx.beginPath();
      ctx.arc(cx, cy, T * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = P.water;
      ctx.beginPath();
      ctx.arc(cx, cy, T * 0.38 * Math.max(0.15, k), 0, Math.PI * 2);
      ctx.fill();
    }
    if (t.build === "basin") {
      const r = T * 0.12;
      ctx.fillStyle = P.stone;
      roundRect(ctx, x + T * 0.06, y + T * 0.06, T * 0.88, T * 0.88, r);
      ctx.fill();
      ctx.fillStyle = P.waterDeep;
      roundRect(ctx, x + T * 0.16, y + T * 0.16, T * 0.68, T * 0.68, r * 0.6);
      ctx.fill();
      const k = t.store / RULES.basinCap;
      ctx.fillStyle = P.water;
      const h = T * 0.68 * k;
      ctx.fillRect(x + T * 0.16, y + T * 0.16 + (T * 0.68 - h), T * 0.68, h);
    }
    if (t.build === "dome") {
      ctx.fillStyle = "rgba(31,181,168,0.35)";
      ctx.beginPath();
      ctx.arc(cx, y + T * 0.8, T * 0.4, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = P.limestone;
      ctx.lineWidth = Math.max(1.5, T * 0.07);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, y + T * 0.4);
      ctx.lineTo(cx, y + T * 0.8);
      ctx.moveTo(cx - T * 0.3, y + T * 0.55);
      ctx.lineTo(cx + T * 0.3, y + T * 0.55);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = P.sun;
      ctx.fillRect(cx - T * 0.22, y + T * 0.62, T * 0.12, T * 0.12);
      ctx.fillRect(cx + T * 0.1, y + T * 0.62, T * 0.12, T * 0.12);
      ctx.fillStyle = P.stone;
      ctx.fillRect(x + T * 0.08, y + T * 0.8, T * 0.84, T * 0.1);
    }
    if (t.ground === "quarter") {
      const roof = t.lost ? P.ruin : P.roof;
      const wall = t.lost ? "#9A9186" : P.limestone;
      for (const [ox, oy, w] of [[0.12, 0.42, 0.34], [0.5, 0.3, 0.38], [0.3, 0.6, 0.3]]) {
        ctx.fillStyle = wall;
        ctx.fillRect(x + ox * T, y + oy * T, w * T, w * T * 0.8);
        ctx.fillStyle = roof;
        ctx.beginPath();
        ctx.moveTo(x + ox * T - T * 0.03, y + oy * T);
        ctx.lineTo(x + (ox + w / 2) * T, y + (oy - 0.14) * T);
        ctx.lineTo(x + (ox + w) * T + T * 0.03, y + oy * T);
        ctx.fill();
      }
      // Santé
      ctx.fillStyle = "rgba(19,38,46,0.6)";
      ctx.fillRect(x + T * 0.1, y + T * 0.9, T * 0.8, T * 0.08);
      ctx.fillStyle = t.health > 60 ? "#3E9B74" : t.health > 30 ? P.sun : "#C43C28";
      ctx.fillRect(x + T * 0.1, y + T * 0.9, T * 0.8 * (t.health / 100), T * 0.08);
    }
  }

  // Vues
  if (o.view === "heat") {
    for (const t of s.tiles) {
      ctx.fillStyle = heatColor(t.temp);
      ctx.fillRect(t.x * T, t.y * T, T + 0.5, T + 0.5);
    }
  }
  if (o.view !== "normal" && T >= 26) {
    ctx.font = `600 ${Math.round(T * 0.27)}px "DM Sans Variable", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const t of s.tiles) {
      const label = o.view === "relief" ? String(t.elev) : `${Math.round(t.temp)}°`;
      ctx.fillStyle = "rgba(19,38,46,0.85)";
      ctx.fillText(label, (t.x + 0.5) * T, (t.y + 0.5) * T);
    }
  }

  // Survol
  if (o.hover) {
    const { x, y } = o.hover;
    ctx.lineWidth = 3;
    ctx.strokeStyle = o.tool === "inspect" ? P.limestone : o.preview ? "#C43C28" : P.sun;
    ctx.strokeRect(x * T + 1.5, y * T + 1.5, T - 3, T - 3);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
