// Interface du prototype : boucle de jeu, saisie souris/tactile, sauvegarde locale.
import { BUILDINGS, RULES, type BuildingId } from "./content.ts";
import { COLS, ROWS } from "./map.ts";
import { build, canBuild, demolish, idx, newGame, quarters, setValve, step, type GameState } from "./sim.ts";
import { draw, invalidateTerrain, type View } from "./render.ts";
import { autoplayUntil } from "./demo.ts";

type Tool = BuildingId | "demolish" | "inspect";
const SAVE_KEY = "veridia-2140-ete-1";
const DAY_MS = 1200;

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
/** Le jour 0 est le 21 juin : l'été du jeu suit le vrai calendrier. */
export function dateLabel(day: number): string {
  const d = new Date(2140, 5, 21 + day);
  return `${d.getDate() === 1 ? "1er" : d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function boot(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const canvas = $<HTMLCanvasElement>("[data-canvas]");
  const ctx = canvas.getContext("2d")!;

  // Mode démo (/jouer/?demo=45) : partie jouée automatiquement jusqu'au jour indiqué, sans sauvegarde.
  const demoDay = Number(new URLSearchParams(location.search).get("demo"));
  const demo = Number.isFinite(demoDay) && demoDay > 0;
  let s: GameState = demo ? newGame() : (load() ?? newGame());
  if (demo) autoplayUntil(s, Math.min(demoDay, 89));
  let tool: Tool = "aqueduct";
  let view: View = "normal";
  let speed = 0; // 0 = pause
  let hover: { x: number; y: number } | null = null;
  let size = 40;
  let acc = 0;
  let last = performance.now();
  let painting = false;
  let message = "";
  let placed: { x: number; y: number; at: number } | null = null;
  let highlight: { x: number; y: number } | null = null;

  function save() {
    if (demo) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch {
      /* stockage indisponible : la partie continue sans sauvegarde */
    }
  }
  function load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const g = JSON.parse(raw) as GameState;
      return g.version === 1 && Array.isArray(g.tiles) && g.tiles.length === COLS * ROWS ? g : null;
    } catch {
      return null;
    }
  }

  function resize() {
    const w = canvas.parentElement!.clientWidth;
    // Sur petit écran, des cases d'au moins 30 px (la carte défile) pour viser au doigt.
    size = Math.floor(Math.min(56, Math.max(w < 640 ? 30 : 0, w / COLS)));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${size * COLS}px`;
    canvas.style.height = `${size * ROWS}px`;
    canvas.width = size * COLS * dpr;
    canvas.height = size * ROWS * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tileAt(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / size);
    const y = Math.floor((e.clientY - r.top) / size);
    return x >= 0 && y >= 0 && x < COLS && y < ROWS ? { x, y } : null;
  }

  function act(p: { x: number; y: number }) {
    if (tool === "inspect") return;
    const err = tool === "demolish" ? demolish(s, p.x, p.y) : build(s, p.x, p.y, tool);
    if (err && !painting) message = err;
    else if (!err) {
      message = "";
      if (tool !== "demolish") placed = { x: p.x, y: p.y, at: performance.now() / 1000 };
      save();
    }
    ui();
  }

  // Souris : clic ou glisser pour tracer. Tactile : un simple tap (glisser fait défiler la carte).
  let touchStart: { x: number; y: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    const p = tileAt(e);
    if (!p) return;
    hover = p;
    if (e.pointerType === "touch") {
      touchStart = { x: e.clientX, y: e.clientY };
      ui();
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    act(p);
    painting = true;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "touch" || !touchStart) return;
    const moved = Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y);
    touchStart = null;
    const p = tileAt(e);
    if (p && moved < 10) act(p);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const p = tileAt(e);
    if (p && (!hover || p.x !== hover.x || p.y !== hover.y)) {
      hover = p;
      if (painting && (tool === "aqueduct" || tool === "mycelium" || tool === "demolish")) act(p);
      ui();
    }
  });
  const stop = () => (painting = false);
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  canvas.addEventListener("pointerleave", () => {
    if (!painting) hover = null;
    ui();
  });

  // Outils
  root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((b) =>
    b.addEventListener("click", () => {
      tool = b.dataset.tool as Tool;
      message = "";
      ui();
    }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) =>
    b.addEventListener("click", () => {
      view = b.dataset.view as View;
      ui();
    }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((b) =>
    b.addEventListener("click", () => {
      speed = Number(b.dataset.speed);
      ui();
    }),
  );
  const valve = $<HTMLInputElement>("[data-valve]");
  valve.max = String(RULES.reservoir.maxOut);
  valve.addEventListener("input", () => {
    setValve(s, Number(valve.value));
    save();
    ui();
  });
  root.querySelectorAll("[data-restart]").forEach((b) =>
    b.addEventListener("click", () => {
      if (s.day > 0 && s.status === "playing" && !confirm("Recommencer l'été depuis le début ?")) return;
      s = newGame();
      invalidateTerrain();
      speed = 1;
      save();
      ui();
    }),
  );
  const intro = $("[data-intro]");
  $("[data-start]").addEventListener("click", () => {
    intro.hidden = true;
    speed = 1;
    ui();
  });
  if (s.day > 0) intro.hidden = true;
  const viewParam = new URLSearchParams(location.search).get("vue");
  if (viewParam === "relief" || viewParam === "heat") view = viewParam;

  document.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const b = Object.values(BUILDINGS).find((d) => d.key === e.key);
    if (b) tool = b.id;
    else if (e.key === "5") tool = "demolish";
    else if (e.key === " ") {
      speed = speed ? 0 : 1;
      e.preventDefault();
    } else return;
    ui();
  });

  // Guidage en contexte : une seule consigne à la fois, selon l'avancée de la partie.
  function hint(): string {
    highlight = null;
    if (s.status !== "playing") return "";
    const res = s.tiles.find((t) => t.ground === "reservoir")!;
    const near = (t: { x: number; y: number }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => s.tiles.find((n) => n.x === t.x + dx && n.y === t.y + dy)).filter(Boolean);
    if (!near(res).some((n) => n!.build === "aqueduct" || n!.build === "basin")) {
      highlight = { x: res.x, y: res.y };
      return "Commencez au réservoir : tracez un aqueduc juste en dessous, puis descendez case par case.";
    }
    const dry = quarters(s).filter((q) => !q.lost && q.supplied < 0.5);
    if (dry.length) {
      return `${dry.length === 1 ? `${dry[0].quarterName} attend` : `${dry.length} quartiers attendent`} l'eau. Suivez les courbes de niveau vers le bas : l'eau ne remonte jamais.`;
    }
    const hot = quarters(s).find((q) => !q.lost && q.temp > RULES.heatLimit);
    if (hot) return `${hot.quarterName} a trop chaud (${Math.round(hot.temp)} °C). Du mycélium posé contre l'eau, à côté du quartier, le rafraîchit.`;
    if (s.day < RULES.heatwave.from && !s.tiles.some((t) => t.build === "basin"))
      return `La canicule arrive le ${dateLabel(RULES.heatwave.from)}. Un bassin près d'un quartier garde l'eau en réserve.`;
    if (s.reservoir < 80) return "Le réservoir baisse. Refermez un peu la vanne pour tenir jusqu'en septembre.";
    return "Tout tient. Gardez un œil sur la vanne et sur la chaleur.";
  }

  // Affichage
  function ui() {
    $("[data-date]").textContent = dateLabel(s.day);
    $("[data-daynum]").textContent = `jour ${s.day} sur ${RULES.days}`;
    $<HTMLElement>("[data-summer-bar]").style.width = `${(s.day / RULES.days) * 100}%`;
    $("[data-ambient]").textContent = `${Math.round(s.ambient)} °C`;
    $("[data-credits]").textContent = String(s.credits);
    $("[data-reservoir]").textContent = String(Math.round(s.reservoir));
    $<HTMLElement>("[data-reservoir-bar]").style.height = `${(s.reservoir / RULES.reservoir.cap) * 100}%`;
    valve.value = String(s.valve);
    $("[data-valve-label]").textContent = `${s.valve} par jour`;
    $("[data-hint]").textContent = hint();

    root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
    root.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    root.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.speed) === speed)));

    $("[data-quarters]").innerHTML = quarters(s)
      .map((q) => {
        const col = q.health > 60 ? "#3E9B74" : q.health > 30 ? "#F0A43A" : "#D2462F";
        const dash = (q.health / 100) * 50.27;
        return `<li class="${q.lost ? "lost" : ""}">
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="#24485a" stroke-width="3"/>
          <circle cx="10" cy="10" r="8" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="${dash} 60" transform="rotate(-90 10 10)"/></svg>
          <span>${q.quarterName}</span>
          <span class="num">${q.lost ? "évacué" : Math.round(q.health) + " %"}</span></li>`;
      })
      .join("");

    let info = message;
    if (hover) {
      const t = s.tiles[idx(hover.x, hover.y)];
      const what =
        t.ground === "quarter" ? `Quartier ${t.quarterName}` : t.ground === "reservoir" ? "Réservoir" : t.ground === "rock" ? "Rocher" : t.build ? BUILDINGS[t.build].name : "Garrigue";
      const extra =
        t.build === "basin" ? ` · réserve ${Math.round(t.store)}` : t.build === "aqueduct" ? ` · débit ${t.flow.toFixed(1)}${t.stagnant ? " · l'eau stagne ici" : ""}` : t.build === "mycelium" ? (t.awake ? " · éveillé" : " · endormi (pas d'eau)") : "";
      info = `${what}, ${t.elev} m, ${t.temp.toFixed(1)} °C${extra.replaceAll(" · ", ", ")}${message ? `. ${message}` : ""}`;
    }
    $("[data-info]").textContent = info;
    $("[data-log]").innerHTML = s.log.map((l) => `<li>${l}</li>`).join("");

    const end = $("[data-end]");
    end.hidden = s.status === "playing";
    if (s.status !== "playing") {
      const alive = quarters(s).filter((q) => !q.lost).length;
      $("[data-end-title]").textContent = s.status === "won" ? "Veridia a tenu tout l'été !" : "L'été a été plus fort.";
      $("[data-end-text]").textContent = `${alive} quartier${alive > 1 ? "s" : ""} sur 5 sauvé${alive > 1 ? "s" : ""}, ${Math.round(s.reservoir)} unités d'eau en réserve, ${s.credits} crédits.`;
    }
  }

  function frame(now: number) {
    const dt = now - last;
    last = now;
    if (speed && s.status === "playing") {
      acc += dt * speed;
      while (acc >= DAY_MS) {
        acc -= DAY_MS;
        step(s);
        save();
        ui();
      }
    }
    const preview = hover && tool !== "inspect" && tool !== "demolish" ? canBuild(s, s.tiles[idx(hover.x, hover.y)], tool) : null;
    draw(ctx, s, { size, time: now / 1000, view, hover, tool, preview, highlight, placed });
    requestAnimationFrame(frame);
  }

  new ResizeObserver(() => resize()).observe(canvas.parentElement!);
  resize();
  ui();
  requestAnimationFrame(frame);
}
