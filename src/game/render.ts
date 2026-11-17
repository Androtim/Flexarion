// Rendu de Veridia 2140 : une carte de relevé topographique du Pays d'Aix au soleil couchant.
// Le relief (ombrage + courbes de niveau) se lit d'un coup d'œil, et l'eau ne s'allume que
// dans les canaux qui descendent : la règle du jeu est visible sur la carte.
import { COLS, ROWS } from "./map.ts";
import { RULES, type BuildingId } from "./content.ts";
import { idx, inside, type GameState, type Tile } from "./sim.ts";

export type View = "normal" | "relief" | "heat";

export interface RenderOpts {
  size: number;
  time: number;
  view: View;
  hover: { x: number; y: number } | null;
  tool: BuildingId | "demolish" | "inspect";
  preview: string | null;
  highlight: { x: number; y: number } | null;
  /** Instant (secondes) de la dernière construction, pour l'animation de pose. */
  placed: { x: number; y: number; at: number } | null;
}

const C = {
  dusk: "#13262E",
  limestone: "#EFE6D2",
  bed: "#CDBF9E",
  bedDark: "#8F7F5E",
  water: "#1FB5A8",
  waterDeep: "#0C776F",
  waterLight: "#7FF0E4",
  sun: "#F0A43A",
  roof: ["#C4532F", "#B5482A", "#D06A3E", "#BE5A35"],
  ruin: "#8C8378",
  ink: "rgba(58,44,22,",
};

// ---------- Relief ----------

const STOPS: Array<[number, number[]]> = [
  [140, [128, 146, 88]],
  [210, [160, 170, 108]],
  [280, [200, 188, 138]],
  [350, [224, 212, 176]],
  [420, [242, 235, 216]],
];

function hypso(e: number): number[] {
  if (e <= STOPS[0][0]) return STOPS[0][1];
  for (let i = 1; i < STOPS.length; i++) {
    if (e <= STOPS[i][0]) {
      const [e0, c0] = STOPS[i - 1];
      const [e1, c1] = STOPS[i];
      const t = (e - e0) / (e1 - e0);
      return c0.map((v, k) => v + (c1[k] - v) * t);
    }
  }
  return STOPS[STOPS.length - 1][1];
}

function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Altitude interpolée en coordonnées « case » continues (le centre d'une case vaut x + 0,5). */
function elevField(s: GameState) {
  const E = s.tiles.map((t) => t.elev);
  return (fx: number, fy: number) => {
    const u = Math.max(0, Math.min(COLS - 1, fx - 0.5));
    const v = Math.max(0, Math.min(ROWS - 1, fy - 0.5));
    const x0 = Math.min(COLS - 2, Math.floor(u)), y0 = Math.min(ROWS - 2, Math.floor(v));
    const a = u - x0, b = v - y0;
    const e00 = E[y0 * COLS + x0], e10 = E[y0 * COLS + x0 + 1];
    const e01 = E[(y0 + 1) * COLS + x0], e11 = E[(y0 + 1) * COLS + x0 + 1];
    return e00 * (1 - a) * (1 - b) + e10 * a * (1 - b) + e01 * (1 - a) * b + e11 * a * b;
  };
}

let terrain: { size: number; canvas: HTMLCanvasElement } | null = null;

function buildTerrain(s: GameState, T: number): HTMLCanvasElement {
  const W = COLS * T, H = ROWS * T;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(W, H);
  const E = elevField(s);
  const L = [-0.55, -0.65, 0.52];
  const ln = Math.hypot(...L);
  const d = 0.35;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const fx = (px + 0.5) / T, fy = (py + 0.5) / T;
      const e = E(fx, fy);
      const dx = (E(fx + d, fy) - E(fx - d, fy)) / (2 * d);
      const dy = (E(fx, fy + d) - E(fx, fy - d)) / (2 * d);
      const nx = -dx / 22, ny = -dy / 22, nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      const lambert = (nx * L[0] + ny * L[1] + nz * L[2]) / (nl * ln);
      const shade = 0.8 + lambert * 0.32;
      const grain = 0.985 + hash(px >> 1, py >> 1) * 0.03;
      const c = hypso(e);
      const o = (py * W + px) * 4;
      img.data[o] = Math.min(255, c[0] * shade * grain);
      img.data[o + 1] = Math.min(255, c[1] * shade * grain);
      img.data[o + 2] = Math.min(255, c[2] * shade * grain);
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // Affleurements calcaires (Sainte-Victoire) : des blocs irréguliers, face éclairée et face à l'ombre.
  for (const t of s.tiles) {
    if (t.ground !== "rock") continue;
    const blocks = 5;
    for (let i = 0; i < blocks; i++) {
      const bx = (t.x + 0.15 + hash(t.x * 9 + i, t.y * 4) * 0.7) * T;
      const by = (t.y + 0.15 + hash(t.y * 9 + i, t.x * 4) * 0.7) * T;
      const r = T * (0.2 + hash(t.x + i * 3, t.y + i) * 0.16);
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2 + hash(t.x + k, t.y + i) * 0.5;
        const rr = r * (0.75 + hash(k + i, t.x * t.y + 1) * 0.35);
        return [bx + Math.cos(a) * rr, by + Math.sin(a) * rr * 0.8];
      });
      const path = () => {
        g.beginPath();
        pts.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py)));
        g.closePath();
      };
      g.save();
      g.shadowColor = "rgba(40,30,15,0.35)";
      g.shadowOffsetX = T * 0.05;
      g.shadowOffsetY = T * 0.07;
      g.shadowBlur = T * 0.08;
      g.fillStyle = "#A39C8E";
      path();
      g.fill();
      g.restore();
      const grd = g.createLinearGradient(bx - r, by - r, bx + r, by + r);
      grd.addColorStop(0, "#EDE7DA");
      grd.addColorStop(0.55, "#C9C1B1");
      grd.addColorStop(1, "#9D9586");
      g.fillStyle = grd;
      path();
      g.fill();
    }
  }

  // Végétation : garrigue clairsemée en hauteur, oliviers et cyprès en contrebas.
  for (const t of s.tiles) {
    if (t.ground !== "garrigue") continue;
    const n = 2 + Math.floor(hash(t.x * 7, t.y * 3) * 3);
    for (let i = 0; i < n; i++) {
      const hx = hash(t.x * 13 + i, t.y * 17), hy = hash(t.y * 11 + i, t.x * 5 + i);
      const cx = (t.x + 0.12 + hx * 0.76) * T, cy = (t.y + 0.12 + hy * 0.76) * T;
      const low = t.elev < 230;
      g.fillStyle = low ? "rgba(70,96,52,0.7)" : "rgba(120,124,80,0.45)";
      g.beginPath();
      g.arc(cx, cy, T * (low ? 0.07 : 0.05) * (0.8 + hx * 0.5), 0, Math.PI * 2);
      g.fill();
    }
    if (t.elev < 250 && hash(t.x * 3, t.y * 29) < 0.18) {
      const cx = (t.x + 0.7) * T, cy = (t.y + 0.35) * T;
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.beginPath();
      g.ellipse(cx + T * 0.08, cy + T * 0.05, T * 0.05, T * 0.16, 0.6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#24361F";
      g.beginPath();
      g.ellipse(cx, cy, T * 0.05, T * 0.16, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Courbes de niveau (marching squares sur le champ interpolé), maîtresses tous les 100 m.
  const step = 0.25;
  const nx = Math.round(COLS / step) + 1, ny = Math.round(ROWS / step) + 1;
  const grid: number[] = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) grid.push(E(i * step, j * step));
  const labels: Array<{ x: number; y: number; a: number; lvl: number }> = [];
  for (let lvl = 160; lvl <= 440; lvl += 20) {
    const major = lvl % 100 === 0;
    g.strokeStyle = C.ink + (major ? "0.55)" : "0.3)");
    g.lineWidth = major ? 1.5 : 1;
    g.beginPath();
    let labelled = false;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const v = [grid[j * nx + i], grid[j * nx + i + 1], grid[(j + 1) * nx + i + 1], grid[(j + 1) * nx + i]];
        const P = [
          [i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1],
        ];
        const pts: number[][] = [];
        for (let k = 0; k < 4; k++) {
          const a = v[k], b = v[(k + 1) % 4];
          if ((a < lvl) !== (b < lvl)) {
            const t = (lvl - a) / (b - a);
            const p0 = P[k], p1 = P[(k + 1) % 4];
            pts.push([(p0[0] + (p1[0] - p0[0]) * t) * step * T, (p0[1] + (p1[1] - p0[1]) * t) * step * T]);
          }
        }
        for (let k = 0; k + 1 < pts.length; k += 2) {
          g.moveTo(pts[k][0], pts[k][1]);
          g.lineTo(pts[k + 1][0], pts[k + 1][1]);
          if (major && !labelled && i > nx * 0.55 && i < nx * 0.9) {
            labels.push({ x: (pts[k][0] + pts[k + 1][0]) / 2, y: (pts[k][1] + pts[k + 1][1]) / 2, a: Math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0]), lvl });
            labelled = true;
          }
        }
      }
    }
    g.stroke();
  }
  g.font = `600 ${Math.max(9, Math.round(T * 0.22))}px "DM Sans Variable", system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const l of labels) {
    g.save();
    g.translate(l.x, l.y);
    let a = l.a;
    if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;
    g.rotate(a);
    const txt = `${l.lvl} m`;
    const w = g.measureText(txt).width + 6;
    const c = hypso(l.lvl);
    g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    g.fillRect(-w / 2, -T * 0.13, w, T * 0.26);
    g.fillStyle = C.ink + "0.75)";
    g.fillText(txt, 0, 0);
    g.restore();
  }
  return cv;
}

// ---------- Éléments ----------

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const carries = (t: Tile) => t.build === "aqueduct" || t.build === "basin" || t.ground === "reservoir";

function drawWater(g: CanvasRenderingContext2D, s: GameState, T: number, time: number) {
  const at = (x: number, y: number) => s.tiles[idx(x, y)];
  const links: Array<[Tile, Tile]> = [];
  for (const t of s.tiles) {
    if (!carries(t)) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (!inside(t.x + dx, t.y + dy)) continue;
      const n = at(t.x + dx, t.y + dy);
      if (carries(n)) links.push([t, n]);
    }
  }
  const c = (t: Tile) => [(t.x + 0.5) * T, (t.y + 0.5) * T];
  const line = (a: Tile, b: Tile) => {
    const [ax, ay] = c(a), [bx, by] = c(b);
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.stroke();
  };
  g.lineCap = "round";
  g.lineJoin = "round";

  // Lit de pierre (avec ombre portée), puis rigole.
  g.save();
  g.shadowColor = "rgba(30,20,10,0.35)";
  g.shadowOffsetY = T * 0.06;
  g.shadowBlur = T * 0.08;
  g.strokeStyle = C.bed;
  g.lineWidth = T * 0.46;
  for (const [a, b] of links) line(a, b);
  // Un aqueduc isolé (sans voisin) : simple regard de pierre.
  const lonely = (t: Tile) => !links.some(([a, b]) => a === t || b === t);
  for (const t of s.tiles) {
    if (t.build !== "aqueduct" || !lonely(t)) continue;
    const [x, y] = c(t);
    g.fillStyle = C.bed;
    g.beginPath();
    g.arc(x, y, T * 0.23, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  g.strokeStyle = C.bedDark;
  g.lineWidth = T * 0.24;
  for (const [a, b] of links) if (a.build === "aqueduct" || b.build === "aqueduct") line(a, b);
  for (const t of s.tiles) {
    if (t.build !== "aqueduct" || !lonely(t)) continue;
    const [x, y] = c(t);
    g.fillStyle = C.bedDark;
    g.beginPath();
    g.arc(x, y, T * 0.12, 0, Math.PI * 2);
    g.fill();
  }

  // Eau : seulement dans les tronçons qui descendent depuis une case alimentée.
  const wet = (hi: Tile, lo: Tile) => hi.elev > lo.elev && (hi.ground === "reservoir" ? hi.flow > 0.3 : hi.flow > 0.3 || (hi.build === "basin" && hi.store > RULES.basinCap - 1));
  g.save();
  g.shadowColor = C.waterLight;
  g.shadowBlur = T * 0.25;
  g.strokeStyle = C.water;
  g.lineWidth = T * 0.16;
  const flowing: Array<[Tile, Tile]> = [];
  for (const [a, b] of links) {
    const [hi, lo] = a.elev >= b.elev ? [a, b] : [b, a];
    if (wet(hi, lo)) {
      flowing.push([hi, lo]);
      line(hi, lo);
    }
  }
  g.restore();
  // Reflets qui coulent vers le bas.
  g.fillStyle = C.waterLight;
  for (const [hi, lo] of flowing) {
    const [ax, ay] = c(hi), [bx, by] = c(lo);
    for (let k = 0; k < 3; k++) {
      const p = (time * 0.9 + k / 3 + hash(hi.x, lo.y) * 0.3) % 1;
      g.beginPath();
      g.arc(ax + (bx - ax) * p, ay + (by - ay) * p, T * 0.045, 0, Math.PI * 2);
      g.fill();
    }
  }
  // Eau qui stagne au bout d'un canal.
  for (const t of s.tiles) {
    if (!t.stagnant) continue;
    const [x, y] = c(t);
    g.strokeStyle = "rgba(196,83,47,0.9)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, T * 0.3 + Math.sin(time * 4) * T * 0.03, 0, Math.PI * 2);
    g.stroke();
  }
}

function drawReservoir(g: CanvasRenderingContext2D, s: GameState, t: Tile, T: number, time: number) {
  const cx = (t.x + 0.5) * T, cy = (t.y + 0.5) * T;
  const k = s.reservoir / RULES.reservoir.cap;
  g.save();
  g.shadowColor = "rgba(30,20,10,0.3)";
  g.shadowBlur = T * 0.15;
  g.fillStyle = C.waterDeep;
  g.beginPath();
  g.ellipse(cx, cy, T * 0.8, T * 0.5, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const grd = g.createRadialGradient(cx - T * 0.2, cy - T * 0.15, T * 0.1, cx, cy, T * 0.9);
  grd.addColorStop(0, "#3FD3C4");
  grd.addColorStop(1, C.waterDeep);
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(cx, cy, T * 0.72 * (0.45 + 0.55 * k), T * 0.42 * (0.45 + 0.55 * k), 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    const r = ((time * 0.25 + i * 0.5) % 1) * T * 0.6;
    g.globalAlpha = 1 - r / (T * 0.6);
    g.beginPath();
    g.ellipse(cx - T * 0.1, cy - T * 0.05, r, r * 0.6, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.globalAlpha = 1;
  // Barrage-voûte (clin d'œil à Bimont), côté aval
  g.strokeStyle = C.limestone;
  g.lineWidth = T * 0.12;
  g.lineCap = "round";
  g.beginPath();
  g.arc(cx, cy - T * 0.55, T * 1.05, Math.PI * 0.3, Math.PI * 0.7);
  g.stroke();
}

function drawBasin(g: CanvasRenderingContext2D, t: Tile, T: number, time: number) {
  const x = t.x * T, y = t.y * T;
  g.save();
  g.shadowColor = "rgba(30,20,10,0.35)";
  g.shadowOffsetY = T * 0.06;
  g.shadowBlur = T * 0.1;
  g.fillStyle = C.bed;
  roundRect(g, x + T * 0.08, y + T * 0.08, T * 0.84, T * 0.84, T * 0.22);
  g.fill();
  g.restore();
  g.fillStyle = "#4E6F68";
  roundRect(g, x + T * 0.18, y + T * 0.18, T * 0.64, T * 0.64, T * 0.14);
  g.fill();
  const k = Math.min(1, t.store / RULES.basinCap);
  if (k > 0.02 || t.flow > 0.3) {
    const m = T * 0.32 * (1 - Math.max(k, 0.35)) * 0.6;
    const grd = g.createLinearGradient(x, y, x + T, y + T);
    grd.addColorStop(0, "#43D6C7");
    grd.addColorStop(1, C.waterDeep);
    g.fillStyle = grd;
    roundRect(g, x + T * 0.18 + m, y + T * 0.18 + m, T * 0.64 - 2 * m, T * 0.64 - 2 * m, T * 0.12);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = 1.2;
    const sx = x + T * 0.3 + Math.sin(time * 1.5 + t.x) * T * 0.06;
    g.beginPath();
    g.moveTo(sx, y + T * 0.36);
    g.lineTo(sx + T * 0.16, y + T * 0.36);
    g.stroke();
  }
}

function drawDome(g: CanvasRenderingContext2D, t: Tile, T: number) {
  const cx = (t.x + 0.5) * T, cy = (t.y + 0.5) * T, r = T * 0.4;
  g.save();
  g.shadowColor = "rgba(30,20,10,0.4)";
  g.shadowOffsetX = T * 0.06;
  g.shadowOffsetY = T * 0.08;
  g.shadowBlur = T * 0.12;
  const grd = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  grd.addColorStop(0, "#C8F4EE");
  grd.addColorStop(0.55, "#4FB9AE");
  grd.addColorStop(1, "#1C6E68");
  g.fillStyle = grd;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.strokeStyle = "rgba(239,230,210,0.85)";
  g.lineWidth = 1;
  const hex = Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * Math.PI) / 3) * r * 0.55, cy + Math.sin((i * Math.PI) / 3) * r * 0.55]);
  g.beginPath();
  hex.forEach(([hx, hy], i) => (i ? g.lineTo(hx, hy) : g.moveTo(hx, hy)));
  g.closePath();
  for (const [hx, hy] of hex) {
    g.moveTo(cx, cy);
    g.lineTo(hx, hy);
  }
  g.stroke();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.lineWidth = T * 0.05;
  g.strokeStyle = C.limestone;
  g.stroke();
  g.fillStyle = "rgba(240,164,58,0.9)";
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(hex[0][0], hex[0][1]);
  g.lineTo(hex[1][0], hex[1][1]);
  g.closePath();
  g.fill();
}

function drawQuarter(g: CanvasRenderingContext2D, t: Tile, T: number, time: number) {
  const x = t.x * T, y = t.y * T;
  const cx = x + T / 2, cy = y + T / 2;
  // Anneau de santé
  g.lineWidth = Math.max(2, T * 0.07);
  g.strokeStyle = "rgba(19,38,46,0.35)";
  g.beginPath();
  g.arc(cx, cy, T * 0.47, 0, Math.PI * 2);
  g.stroke();
  if (!t.lost) {
    const col = t.health > 60 ? "#3E9B74" : t.health > 30 ? C.sun : "#D2462F";
    g.strokeStyle = col;
    if (t.health <= 30) g.globalAlpha = 0.6 + 0.4 * Math.sin(time * 6);
    g.beginPath();
    g.arc(cx, cy, T * 0.47, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * t.health) / 100);
    g.stroke();
    g.globalAlpha = 1;
  }
  // Toits vus du ciel
  const roofs: Array<[number, number, number, number, number]> = [
    [0.16, 0.2, 0.32, 0.24, -0.1],
    [0.52, 0.16, 0.3, 0.3, 0.08],
    [0.2, 0.52, 0.28, 0.28, 0.12],
    [0.54, 0.54, 0.3, 0.24, -0.06],
  ];
  roofs.forEach(([ox, oy, w, h, rot], i) => {
    g.save();
    g.translate(x + (ox + w / 2) * T, y + (oy + h / 2) * T);
    g.rotate(rot + (hash(t.x, i) - 0.5) * 0.1);
    g.fillStyle = "rgba(30,20,10,0.35)";
    g.fillRect((-w / 2) * T + T * 0.04, (-h / 2) * T + T * 0.05, w * T, h * T);
    g.fillStyle = t.lost ? C.ruin : C.roof[(i + t.x) % C.roof.length];
    g.fillRect((-w / 2) * T, (-h / 2) * T, w * T, h * T);
    // Pan éclairé (nord-ouest) et pan à l'ombre, séparés par le faîtage
    g.fillStyle = "rgba(255,230,200,0.22)";
    g.fillRect((-w / 2) * T, (-h / 2) * T, w * T, (h / 2) * T);
    g.fillStyle = "rgba(60,20,10,0.18)";
    g.fillRect((-w / 2) * T, 0, w * T, (h / 2) * T);
    g.strokeStyle = "rgba(255,235,210,0.55)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo((-w / 2) * T + 1, 0);
    g.lineTo((w / 2) * T - 1, 0);
    g.stroke();
    g.restore();
  });
  if (!t.lost) {
    g.fillStyle = C.water;
    g.beginPath();
    g.arc(cx, cy, T * 0.06, 0, Math.PI * 2);
    g.fill();
  }
}

function drawMycelium(g: CanvasRenderingContext2D, s: GameState, T: number, time: number) {
  const at = (x: number, y: number) => s.tiles[idx(x, y)];
  for (const t of s.tiles) {
    if (t.build !== "mycelium") continue;
    const cx = (t.x + 0.5) * T, cy = (t.y + 0.5) * T;
    const col = t.awake ? C.waterLight : "rgba(120,110,90,0.55)";
    g.save();
    if (t.awake) {
      g.shadowColor = C.waterLight;
      g.shadowBlur = T * (0.2 + 0.08 * Math.sin(time * 2 + t.x + t.y));
    }
    g.strokeStyle = col;
    g.lineWidth = Math.max(1, T * 0.035);
    g.lineCap = "round";
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!inside(t.x + dx, t.y + dy) || at(t.x + dx, t.y + dy).build !== "mycelium") continue;
      const mx = cx + (dx * T) / 2, my = cy + (dy * T) / 2;
      const wob = (hash(t.x + dx, t.y + dy) - 0.5) * T * 0.3;
      g.beginPath();
      g.moveTo(cx, cy);
      g.quadraticCurveTo((cx + mx) / 2 + dy * wob, (cy + my) / 2 + dx * wob, mx, my);
      g.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + hash(t.x * 3 + i, t.y * 7) * 0.8;
      const len = T * (0.2 + hash(t.y + i, t.x) * 0.22);
      g.beginPath();
      g.moveTo(cx, cy);
      g.quadraticCurveTo(cx + Math.cos(a + 0.6) * len * 0.6, cy + Math.sin(a + 0.6) * len * 0.6, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      g.stroke();
    }
    g.fillStyle = col;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(cx + (hash(t.x + i, t.y * 5) - 0.5) * T * 0.5, cy + (hash(t.y + i, t.x * 5) - 0.5) * T * 0.5, T * 0.035, 0, Math.PI * 2);
      g.fill();
    }
    g.beginPath();
    g.arc(cx, cy, T * 0.06, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

// ---------- Vue chaleur (dégradé lissé) ----------

let heatCanvas: HTMLCanvasElement | null = null;
function drawHeat(g: CanvasRenderingContext2D, s: GameState, T: number) {
  heatCanvas ??= Object.assign(document.createElement("canvas"), { width: COLS, height: ROWS });
  const h = heatCanvas.getContext("2d")!;
  const img = h.createImageData(COLS, ROWS);
  for (const t of s.tiles) {
    const k = Math.max(0, Math.min(1, (t.temp - 28) / 16));
    const c = k < 0.5 ? [31 + (240 - 31) * k * 2, 181 + (164 - 181) * k * 2, 168 + (58 - 168) * k * 2] : [240 + (200 - 240) * (k - 0.5) * 2, 164 + (50 - 164) * (k - 0.5) * 2, 58 + (35 - 58) * (k - 0.5) * 2];
    const o = (t.y * COLS + t.x) * 4;
    img.data.set([c[0], c[1], c[2], 150], o);
  }
  h.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(heatCanvas, -T / 2, -T / 2, (COLS + 1) * T, (ROWS + 1) * T);
  g.restore();
}

// ---------- Rendu principal ----------

export function invalidateTerrain() {
  terrain = null;
}

export function draw(g: CanvasRenderingContext2D, s: GameState, o: RenderOpts) {
  const T = o.size;
  if (!terrain || terrain.size !== T) terrain = { size: T, canvas: buildTerrain(s, T) };
  g.drawImage(terrain.canvas, 0, 0, COLS * T, ROWS * T);

  // La lumière se réchauffe avec l'été.
  const warm = Math.max(0, Math.min(1, (s.ambient - 29) / 12));
  if (warm > 0) {
    g.fillStyle = `rgba(240,140,50,${warm * 0.07})`;
    g.fillRect(0, 0, COLS * T, ROWS * T);
  }

  if (o.view === "heat") drawHeat(g, s, T);
  if (o.tool !== "inspect") {
    g.strokeStyle = "rgba(19,38,46,0.07)";
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 1; x < COLS; x++) {
      g.moveTo(x * T, 0);
      g.lineTo(x * T, ROWS * T);
    }
    for (let y = 1; y < ROWS; y++) {
      g.moveTo(0, y * T);
      g.lineTo(COLS * T, y * T);
    }
    g.stroke();
  }

  drawMycelium(g, s, T, o.time);
  drawWater(g, s, T, o.time);

  const pop = (t: Tile) => {
    if (!o.placed || o.placed.x !== t.x || o.placed.y !== t.y) return 1;
    const k = Math.min(1, (o.time - o.placed.at) / 0.25);
    return 0.6 + 0.4 * (1 - (1 - k) ** 3) + Math.sin(k * Math.PI) * 0.08;
  };
  for (const t of s.tiles) {
    const scale = pop(t);
    if (scale !== 1) {
      g.save();
      g.translate((t.x + 0.5) * T, (t.y + 0.5) * T);
      g.scale(scale, scale);
      g.translate(-(t.x + 0.5) * T, -(t.y + 0.5) * T);
    }
    if (t.ground === "reservoir") drawReservoir(g, s, t, T, o.time);
    if (t.build === "basin") drawBasin(g, t, T, o.time);
    if (t.build === "dome") drawDome(g, t, T);
    if (t.ground === "quarter") drawQuarter(g, t, T, o.time);
    if (scale !== 1) g.restore();
  }

  if (o.view !== "normal" && T >= 24) {
    g.font = `700 ${Math.round(T * 0.24)}px "DM Sans Variable", system-ui, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const t of s.tiles) {
      const label = o.view === "relief" ? String(t.elev) : `${Math.round(t.temp)}°`;
      const w = g.measureText(label).width + 6;
      g.fillStyle = "rgba(251,247,238,0.82)";
      roundRect(g, (t.x + 0.5) * T - w / 2, (t.y + 0.5) * T - T * 0.15, w, T * 0.3, T * 0.08);
      g.fill();
      g.fillStyle = C.dusk;
      g.fillText(label, (t.x + 0.5) * T, (t.y + 0.5) * T + 0.5);
    }
  }

  // Repère pulsant (guidage)
  if (o.highlight) {
    const { x, y } = o.highlight;
    const k = (o.time % 1.4) / 1.4;
    g.strokeStyle = `rgba(240,164,58,${1 - k})`;
    g.lineWidth = 3;
    g.beginPath();
    g.arc((x + 0.5) * T, (y + 0.5) * T, T * (0.6 + k * 0.7), 0, Math.PI * 2);
    g.stroke();
  }

  // Survol : aperçu de la construction et de l'arrivée d'eau
  if (o.hover) {
    const { x, y } = o.hover;
    const t = s.tiles[idx(x, y)];
    if (o.tool === "inspect" || o.tool === "demolish") {
      g.strokeStyle = o.tool === "demolish" ? "#D2462F" : C.limestone;
      g.lineWidth = 2;
      roundRect(g, x * T + 2, y * T + 2, T - 4, T - 4, T * 0.15);
      g.stroke();
    } else {
      g.save();
      g.globalAlpha = o.preview ? 0.35 : 0.85;
      g.strokeStyle = o.preview ? "#D2462F" : C.sun;
      g.lineWidth = 2.5;
      g.setLineDash([T * 0.12, T * 0.08]);
      roundRect(g, x * T + 2, y * T + 2, T - 4, T - 4, T * 0.15);
      g.stroke();
      g.restore();
      if (!o.preview && (o.tool === "aqueduct" || o.tool === "basin")) {
        // L'eau arriverait-elle ici ? On cherche un voisin en eau plus haut.
        const sources = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .filter(([dx, dy]) => inside(x + dx, y + dy))
          .map(([dx, dy]) => s.tiles[idx(x + dx, y + dy)])
          .filter((n) => carries(n) && (n.flow > 0.3 || n.ground === "reservoir"));
        if (sources.length) {
          const up = sources.find((n) => n.elev > t.elev);
          const [cx, cy] = [(x + 0.5) * T, (y + 0.5) * T];
          g.fillStyle = up ? C.water : "#D2462F";
          g.beginPath();
          g.arc(cx, cy, T * 0.16, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#fff";
          g.font = `700 ${Math.round(T * 0.24)}px system-ui, sans-serif`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(up ? "↓" : "×", cx, cy + 1);
        }
      }
    }
  }
}
