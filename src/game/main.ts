// Interface du prototype : boucle de jeu, saisie souris/tactile, sauvegarde locale.
import { BUILDINGS, RULES, type BuildingId } from "./content.ts";
import { COLS, ROWS } from "./map.ts";
import { build, canBuild, demolish, idx, newGame, quarters, setValve, step, type GameState } from "./sim.ts";
import { draw, type View } from "./render.ts";
import { autoplayUntil } from "./demo.ts";

type Tool = BuildingId | "demolish" | "inspect";
const SAVE_KEY = "veridia-2140-ete-1";
const DAY_MS = 1200;

export function boot(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const canvas = $<HTMLCanvasElement>("[data-canvas]");
  const ctx = canvas.getContext("2d")!;

  // Mode démo (/jouer/?demo=45) : partie jouée automatiquement jusqu'au jour indiqué, sans sauvegarde.
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
      save();
    }
    ui();
  }

  // Souris : clic ou glisser pour tracer. Tactile : un simple tap (glisser fait défiler la carte).
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
      if (s.day > 0 && s.status === "playing" && !confirm("Recommencer l'été depuis le début ?")) return;
      s = newGame();
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

  // Affichage
  function ui() {
    $("[data-day]").textContent = `${s.day} / ${RULES.days}`;
    $("[data-ambient]").textContent = `${s.ambient.toFixed(1)} °C`;
    $("[data-credits]").textContent = String(s.credits);
    $("[data-reservoir]").textContent = `${Math.round(s.reservoir)} / ${RULES.reservoir.cap}`;
    $<HTMLElement>("[data-reservoir-bar]").style.width = `${(s.reservoir / RULES.reservoir.cap) * 100}%`;
    valve.value = String(s.valve);
    $("[data-valve-label]").textContent = `${s.valve} / jour`;

    root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
    root.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    root.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.speed) === speed)));

    $("[data-quarters]").innerHTML = quarters(s)
      .map(
        (q) => `<li class="${q.lost ? "lost" : ""}"><span>${q.quarterName}</span>
          <span class="bar"><span style="width:${q.health}%;background:${q.health > 60 ? "#3E9B74" : q.health > 30 ? "#F0A43A" : "#C43C28"}"></span></span>
          <span class="num">${q.lost ? "évacué" : Math.round(q.health) + " %"}</span></li>`,
      )
      .join("");

    const help = tool === "inspect" ? "" : tool === "demolish" ? "Démolir rend la moitié du prix." : BUILDINGS[tool].help;
    let info = message || help;
    if (hover) {
      const t = s.tiles[idx(hover.x, hover.y)];
      const what =
        t.ground === "quarter" ? `Quartier ${t.quarterName}` : t.ground === "reservoir" ? "Réservoir" : t.ground === "rock" ? "Rocher" : t.build ? BUILDINGS[t.build].name : "Garrigue";
      const extra =
        t.build === "basin" ? ` · réserve ${Math.round(t.store)}` : t.build === "aqueduct" ? ` · débit ${t.flow.toFixed(1)}${t.stagnant ? " · l'eau stagne ici" : ""}` : t.build === "mycelium" ? (t.awake ? " · éveillé" : " · endormi (pas d'eau)") : "";
      info = `${what} · altitude ${t.elev} m · ${t.temp.toFixed(1)} °C${extra}${message ? ` · ${message}` : ""}`;
    }
    $("[data-info]").textContent = info;
    $("[data-log]").innerHTML = s.log.map((l) => `<li>${l}</li>`).join("");

    const end = $("[data-end]");
    end.hidden = s.status === "playing";
    if (s.status !== "playing") {
      const alive = quarters(s).filter((q) => !q.lost).length;
      $("[data-end-title]").textContent = s.status === "won" ? "Veridia a tenu tout l'été !" : "L'été a été plus fort.";
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
    draw(ctx, s, { size, time: now / 1000, view, hover, tool, preview });
    requestAnimationFrame(frame);
  }

  new ResizeObserver(() => resize()).observe(canvas.parentElement!);
  resize();
  ui();
  requestAnimationFrame(frame);
}
