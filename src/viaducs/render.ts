// Rendu Canvas 2D : une carte d'arpenteur vue du ciel, dans la palette du site
// (calcaire, garrigue, eau turquoise, toits de tuile).
import { N4, pipeCost, type Level } from "./level.ts";
import { canPlace, quota, type GameState } from "./sim.ts";

const C = {
  land: "#e6dbbf",
  landDot: "#d6c79f",
  shrub: "#9aa36a",
  rock: "#b9ad94",
  rockDark: "#8f846c",
  rockLight: "#d3c8ae",
  pine: "#5e6e2f",
  pineDark: "#46531f",
  ravine: "#a8916a",
  ravineDark: "#7d6a4b",
  river: "#5e9fa6",
  riverLight: "#8cc5c4",
  stone: "#cdbf9e",
  stoneDark: "#8f7f5e",
  water: "#1fb5a8",
  waterLight: "#7ff0e4",
  roof: "#c4532f",
  roofDark: "#93391f",
  wall: "#f3ead6",
  dusk: "#13262e",
  sun: "#f0a43a",
  alert: "#d2462f",
  ok: "#2f9e6e",
};

const FONT = '"DM Sans Variable", "DM Sans", system-ui, sans-serif';

export interface RenderInput {
  s: GameState;
  size: number;
  time: number;
  hover: number | null;
}

let terrain: { key: string; canvas: HTMLCanvasElement } | null = null;

function hash(i: number, k: number) {
  let x = (i * 374761393 + k * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function drawTerrain(l: Level, S: number, dpr: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = l.w * S * dpr;
  cv.height = l.h * S * dpr;
  const g = cv.getContext("2d")!;
  g.scale(dpr, dpr);
  g.fillStyle = C.land;
  g.fillRect(0, 0, l.w * S, l.h * S);
  const is = (x: number, y: number, kind: string) => x >= 0 && y >= 0 && x < l.w && y < l.h && l.ground[y * l.w + x] === kind;

  for (let i = 0; i < l.ground.length; i++) {
    const x = (i % l.w) * S, y = ((i / l.w) | 0) * S;
    // Garrigue : petits points et touffes.
    for (let k = 0; k < 5; k++) {
      g.fillStyle = k < 3 ? C.landDot : C.shrub;
      g.beginPath();
      g.arc(x + hash(i, k) * S, y + hash(i, k + 9) * S, k < 3 ? S * 0.025 : S * 0.05, 0, 7);
      g.fill();
    }
  }
  // Vallons et rivière : bandes continues entre cases voisines.
  const band = (kind: "ravine" | "river", r: number, color: string) => {
    g.fillStyle = color;
    for (let i = 0; i < l.ground.length; i++) {
      if (l.ground[i] !== kind) continue;
      const tx = i % l.w, ty = (i / l.w) | 0;
      const cx = tx * S + S / 2, cy = ty * S + S / 2;
      g.beginPath();
      g.arc(cx, cy, r, 0, 7);
      g.fill();
      for (const [dx, dy] of N4) {
        const out = kind === "river" && (tx + dx < 0 || tx + dx >= l.w);
        if (!is(tx + dx, ty + dy, kind) && !out) continue;
        g.fillRect(dx === 0 ? cx - r : dx > 0 ? cx : cx - S / 2, dy === 0 ? cy - r : dy > 0 ? cy : cy - S / 2, dx === 0 ? 2 * r : S / 2, dy === 0 ? 2 * r : S / 2);
      }
    }
  };
  band("ravine", S * 0.4, C.landDot);
  band("ravine", S * 0.3, C.ravine);
  band("ravine", S * 0.12, C.ravineDark);
  band("river", S * 0.38, C.river);
  for (let i = 0; i < l.ground.length; i++) {
    if (l.ground[i] !== "river") continue;
    const cx = (i % l.w) * S + S / 2, cy = ((i / l.w) | 0) * S + S / 2;
    g.strokeStyle = C.riverLight;
    g.lineWidth = Math.max(1, S * 0.04);
    g.beginPath();
    g.moveTo(cx - S * 0.2, cy - S * 0.05);
    g.quadraticCurveTo(cx, cy - S * 0.13, cx + S * 0.2, cy - S * 0.05);
    g.stroke();
  }
  for (let i = 0; i < l.ground.length; i++) {
    const tx = i % l.w, ty = (i / l.w) | 0;
    const x = tx * S, y = ty * S;
    if (l.ground[i] === "rock") {
      // Affleurement calcaire : polygone ombré.
      g.fillStyle = C.rockDark;
      poly(g, x, y, S, i, 0.06, 0.04);
      g.fillStyle = C.rock;
      poly(g, x, y, S, i, 0, 0);
      g.strokeStyle = C.rockLight;
      g.lineWidth = Math.max(1, S * 0.03);
      g.beginPath();
      g.moveTo(x + S * 0.3, y + S * 0.35);
      g.lineTo(x + S * 0.55, y + S * 0.28);
      g.stroke();
    } else if (l.ground[i] === "site") {
      // Chantier d'un futur quartier (mode saison) : piquets et cordeau en pointillés.
      g.strokeStyle = "rgba(196,83,47,0.6)";
      g.lineWidth = Math.max(1, S * 0.04);
      g.setLineDash([S * 0.09, S * 0.07]);
      g.strokeRect(x + S * 0.18, y + S * 0.18, S * 0.64, S * 0.64);
      g.setLineDash([]);
      g.fillStyle = "rgba(147,57,31,0.7)";
      for (const [px, py] of [[0.18, 0.18], [0.82, 0.18], [0.18, 0.82], [0.82, 0.82]]) {
        g.beginPath();
        g.arc(x + S * px, y + S * py, S * 0.05, 0, 7);
        g.fill();
      }
    } else if (l.ground[i] === "pines") {
      // Pins parasols, vus du dessus.
      for (let k = 0; k < 3; k++) {
        const px = x + S * (0.25 + hash(i, k + 20) * 0.5), py = y + S * (0.25 + hash(i, k + 30) * 0.5);
        const r = S * (0.2 + hash(i, k + 40) * 0.08);
        g.fillStyle = "rgba(19,38,46,0.18)";
        g.beginPath();
        g.arc(px + S * 0.05, py + S * 0.06, r, 0, 7);
        g.fill();
        g.fillStyle = C.pineDark;
        g.beginPath();
        g.arc(px, py, r, 0, 7);
        g.fill();
        g.fillStyle = C.pine;
        g.beginPath();
        g.arc(px - r * 0.2, py - r * 0.2, r * 0.7, 0, 7);
        g.fill();
      }
    }
  }
  // Quadrillage discret d'arpenteur.
  g.strokeStyle = "rgba(19,38,46,0.07)";
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 1; x < l.w; x++) {
    g.moveTo(x * S + 0.5, 0);
    g.lineTo(x * S + 0.5, l.h * S);
  }
  for (let y = 1; y < l.h; y++) {
    g.moveTo(0, y * S + 0.5);
    g.lineTo(l.w * S, y * S + 0.5);
  }
  g.stroke();
  return cv;
}

function poly(g: CanvasRenderingContext2D, x: number, y: number, S: number, i: number, ox: number, oy: number) {
  g.beginPath();
  const n = 7;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = S * (0.3 + hash(i, k + 50) * 0.13);
    const px = x + S / 2 + Math.cos(a) * r + ox * S, py = y + S / 2 + Math.sin(a) * r + oy * S;
    if (k) g.lineTo(px, py);
    else g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
}

export function invalidateTerrain() {
  terrain = null;
}

/** Directions (indices N4) vers lesquelles un tuyau se raccorde. */
function links(s: GameState, i: number): number[] {
  const { w, h, ground } = s.level;
  const x = i % w, y = (i / w) | 0;
  const out: number[] = [];
  N4.forEach(([dx, dy], d) => {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
    const n = ny * w + nx;
    const em = s.emergencies.some((e) => e.status === "active" && e.x === nx && e.y === ny);
    if (s.pipes[n] || ground[n] === "source" || ground[n] === "quarter" || em) out.push(d);
  });
  return out;
}

export function draw(ctx: CanvasRenderingContext2D, { s, size: S, time, hover }: RenderInput) {
  const l = s.level;
  const dpr = window.devicePixelRatio || 1;
  const key = `${l.day}:${s.seed}:${S}:${dpr}:${l.w}x${l.h}`;
  if (!terrain || terrain.key !== key) terrain = { key, canvas: drawTerrain(l, S, dpr) };
  ctx.clearRect(0, 0, l.w * S, l.h * S);
  ctx.drawImage(terrain.canvas, 0, 0, l.w * S, l.h * S);

  const center = (i: number) => [(i % l.w) * S + S / 2, ((i / l.w) | 0) * S + S / 2] as const;
  const edge = (i: number, d: number) => {
    const [cx, cy] = center(i);
    return [cx + (N4[d][0] * S) / 2, cy + (N4[d][1] * S) / 2] as const;
  };

  // Tuyaux : canal de pierre, viaduc sur les vallons et la rivière.
  for (let i = 0; i < s.pipes.length; i++) {
    if (!s.pipes[i]) continue;
    const ds = links(s, i);
    const [cx, cy] = center(i);
    const viaduct = pipeCost(l.ground[i]) > 1;
    if (viaduct) {
      // Piles et arches sous le canal.
      ctx.fillStyle = "rgba(19,38,46,0.25)";
      ctx.fillRect(cx - S * 0.36 + S * 0.06, cy - S * 0.36 + S * 0.08, S * 0.72, S * 0.72);
      ctx.fillStyle = C.wall;
      ctx.strokeStyle = C.stoneDark;
      ctx.lineWidth = Math.max(1, S * 0.03);
      ctx.beginPath();
      ctx.rect(cx - S * 0.36, cy - S * 0.36, S * 0.72, S * 0.72);
      ctx.fill();
      ctx.stroke();
      const horizontal = ds.every((d) => d < 2) || (!ds.length);
      ctx.fillStyle = l.ground[i] === "river" ? C.river : C.ravineDark;
      for (let k = -1; k <= 1; k += 2) {
        ctx.beginPath();
        if (horizontal) {
          ctx.moveTo(cx + k * S * 0.18 - S * 0.12, cy + S * 0.36);
          ctx.arc(cx + k * S * 0.18, cy + S * 0.2, S * 0.12, Math.PI, 0);
          ctx.lineTo(cx + k * S * 0.18 + S * 0.12, cy + S * 0.36);
        } else {
          ctx.moveTo(cx - S * 0.36, cy + k * S * 0.18 - S * 0.12);
          ctx.arc(cx - S * 0.2, cy + k * S * 0.18, S * 0.12, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(cx - S * 0.36, cy + k * S * 0.18 + S * 0.12);
        }
        ctx.fill();
      }
    }
    ctx.lineCap = "round";
    const stroke = (color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      if (!ds.length) {
        ctx.moveTo(cx - S * 0.12, cy);
        ctx.lineTo(cx + S * 0.12, cy);
      }
      for (const d of ds) {
        ctx.moveTo(cx, cy);
        ctx.lineTo(...edge(i, d));
      }
      ctx.stroke();
    };
    stroke(C.stone, S * 0.42);
    stroke(C.stoneDark, S * 0.24);

    // Eau.
    const wet = s.wet[i];
    if (wet >= 1) {
      const f = s.flow[i];
      stroke(f > 0.05 ? C.water : "#178f86", S * 0.16);
      if (f > 0.05 && s.parent[i] >= 0) {
        // Courant : tirets qui avancent dans le sens de l'écoulement.
        const p = s.parent[i];
        const pd = N4.findIndex(([dx, dy]) => (p % l.w) - (i % l.w) === dx && ((p / l.w) | 0) - ((i / l.w) | 0) === dy);
        ctx.strokeStyle = C.waterLight;
        ctx.lineWidth = Math.max(1, S * 0.05);
        ctx.setLineDash([S * 0.12, S * 0.18]);
        ctx.lineDashOffset = -((time * S * (0.6 + f * 0.15)) % (S * 0.3));
        for (const d of ds) {
          if (d === pd) continue;
          ctx.beginPath();
          ctx.moveTo(...edge(i, pd));
          ctx.lineTo(cx, cy);
          ctx.lineTo(...edge(i, d));
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    } else if (wet > 0 && s.wetFrom[i] >= 0) {
      // Front de l'eau en train d'avancer.
      const from = s.wetFrom[i];
      const [ex, ey] = edge(i, from);
      ctx.strokeStyle = C.water;
      ctx.lineWidth = S * 0.16;
      ctx.beginPath();
      const a = Math.min(1, wet * 2);
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + (cx - ex) * a, ey + (cy - ey) * a);
      if (wet > 0.5)
        for (const d of ds) {
          if (d === from) continue;
          const [tx, ty] = edge(i, d);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + (tx - cx) * (wet - 0.5) * 2, cy + (ty - cy) * (wet - 0.5) * 2);
        }
      ctx.stroke();
    }
  }

  // Sources.
  for (const p of l.sources) {
    const i = p.y * l.w + p.x;
    const [cx, cy] = center(i);
    ctx.fillStyle = C.stone;
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.44, 0, 7);
    ctx.fill();
    ctx.fillStyle = C.water;
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.33, 0, 7);
    ctx.fill();
    const ph = (time * 0.6) % 1;
    ctx.strokeStyle = `rgba(127,240,228,${1 - ph})`;
    ctx.lineWidth = Math.max(1, S * 0.04);
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.1 + ph * S * 0.2, 0, 7);
    ctx.stroke();
    label(ctx, p.name, cx, cy + S * 0.62, S, C.dusk, "rgba(251,247,238,0.92)");
  }

  // Quartiers : toits de tuile et jauge du quota.
  const q = quota(s);
  l.quarters.forEach((p, k) => {
    const i = p.y * l.w + p.x;
    const [cx, cy] = center(i);
    const done = s.delivered[k] >= q - 1e-6;
    const prog = Math.min(1, s.delivered[k] / q);
    ctx.fillStyle = "rgba(19,38,46,0.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.46, 0, 7);
    ctx.fill();
    const houses = [
      [-0.17, -0.15, 0.24],
      [0.16, -0.12, 0.2],
      [-0.1, 0.16, 0.2],
      [0.17, 0.17, 0.17],
    ];
    for (const [hx, hy, hs] of houses) {
      const x = cx + hx * S - (hs * S) / 2, y = cy + hy * S - (hs * S) / 2;
      ctx.fillStyle = "rgba(19,38,46,0.25)";
      ctx.fillRect(x + S * 0.03, y + S * 0.04, hs * S, hs * S);
      ctx.fillStyle = C.roof;
      ctx.fillRect(x, y, hs * S, hs * S);
      ctx.fillStyle = C.roofDark;
      ctx.fillRect(x, y + (hs * S) / 2, hs * S, (hs * S) / 2);
    }
    // Jauge.
    ctx.lineWidth = Math.max(2, S * 0.08);
    ctx.strokeStyle = "rgba(19,38,46,0.25)";
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.46, 0, 7);
    ctx.stroke();
    if (prog > 0) {
      ctx.strokeStyle = done ? C.ok : C.water;
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.46, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
      ctx.stroke();
    }
    if (s.receiving[k] > 0.05 && !done) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 6);
      ctx.strokeStyle = `rgba(127,240,228,${0.3 + pulse * 0.4})`;
      ctx.lineWidth = Math.max(1, S * 0.03);
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.54, 0, 7);
      ctx.stroke();
    }
    if (done) {
      ctx.fillStyle = C.ok;
      ctx.beginPath();
      ctx.arc(cx + S * 0.33, cy - S * 0.33, S * 0.14, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(1.5, S * 0.04);
      ctx.beginPath();
      ctx.moveTo(cx + S * 0.27, cy - S * 0.33);
      ctx.lineTo(cx + S * 0.32, cy - S * 0.28);
      ctx.lineTo(cx + S * 0.4, cy - S * 0.38);
      ctx.stroke();
    }
    label(ctx, p.name, cx, cy + S * 0.66, S, "#fff", "rgba(19,38,46,0.82)");
  });

  // Urgences.
  for (const e of s.emergencies) {
    if (e.status !== "active") continue;
    const i = e.y * l.w + e.x;
    const [cx, cy] = center(i);
    const left = Math.max(0, e.at + e.limit - s.t);
    const pulse = 0.5 + 0.5 * Math.sin(time * 8);
    ctx.fillStyle = `rgba(210,70,47,${0.18 + pulse * 0.18})`;
    ctx.beginPath();
    ctx.arc(cx, cy, S * (0.5 + pulse * 0.08), 0, 7);
    ctx.fill();
    ctx.fillStyle = C.alert;
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.3, 0, 7);
    ctx.fill();
    // Flamme.
    ctx.fillStyle = C.sun;
    ctx.beginPath();
    ctx.moveTo(cx, cy - S * 0.2);
    ctx.quadraticCurveTo(cx + S * 0.16, cy, cx + S * 0.08, cy + S * 0.14);
    ctx.quadraticCurveTo(cx, cy + S * 0.2, cx - S * 0.08, cy + S * 0.14);
    ctx.quadraticCurveTo(cx - S * 0.16, cy, cx, cy - S * 0.2);
    ctx.fill();
    // Compte à rebours et remplissage.
    ctx.lineWidth = Math.max(2, S * 0.07);
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.4, -Math.PI / 2, -Math.PI / 2 + (left / e.limit) * Math.PI * 2);
    ctx.stroke();
    if (e.got > 0) {
      ctx.strokeStyle = C.water;
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.3, -Math.PI / 2, -Math.PI / 2 + Math.min(1, e.got / e.need) * Math.PI * 2);
      ctx.stroke();
    }
    label(ctx, `${e.name} · ${Math.ceil(left)} s`, cx, cy - S * 0.68, S, "#fff", C.alert);
  }

  // Survol : aperçu de la pose ou du retrait.
  if (hover !== null && (s.phase === "plan" || s.phase === "run")) {
    const [cx, cy] = center(hover);
    if (s.pipes[hover]) {
      ctx.strokeStyle = C.alert;
      ctx.lineWidth = Math.max(2, S * 0.07);
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.18, cy - S * 0.18);
      ctx.lineTo(cx + S * 0.18, cy + S * 0.18);
      ctx.moveTo(cx + S * 0.18, cy - S * 0.18);
      ctx.lineTo(cx - S * 0.18, cy + S * 0.18);
      ctx.stroke();
    } else {
      const ok = canPlace(s, hover) === null;
      ctx.strokeStyle = ok ? "rgba(31,181,168,0.9)" : "rgba(210,70,47,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(hover % l.w * S + 2, ((hover / l.w) | 0) * S + 2, S - 4, S - 4);
      ctx.setLineDash([]);
      const cost = pipeCost(l.ground[hover]);
      if (ok && cost > 1) label(ctx, "viaduc : 2 tuyaux", cx, cy - S * 0.62, S, C.dusk, "rgba(240,164,58,0.95)");
    }
  }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, S: number, color: string, bg: string) {
  const fs = Math.max(10, Math.min(13, S * 0.27));
  ctx.font = `600 ${fs}px ${FONT}`;
  const w = ctx.measureText(text).width + fs * 0.9;
  const h = fs * 1.5;
  const W = ctx.canvas.width / (window.devicePixelRatio || 1);
  const H = ctx.canvas.height / (window.devicePixelRatio || 1);
  const lx = Math.max(2, Math.min(W - w - 2, x - w / 2));
  const ly = Math.max(2, Math.min(H - h - 2, y - h / 2));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(lx, ly, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, lx + w / 2, ly + h / 2 + 0.5);
}
