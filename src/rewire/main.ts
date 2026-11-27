// Contrôleur navigateur du prototype REWIRE v0.1 (souris, tactile, HUD, modificateurs Vote Ép. 1).
import type { ToolId } from "./content";
import { applyTool, newRewireGame, tickRewire, type Modifiers, type RewireState } from "./sim";
import { renderRewire } from "./render";

const BEST_KEY = "rewire-v01-wins";

export function bootRewire(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-canvas]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const mods: Modifiers = { gravityTowers: true, flywheels: false };
  let seed = Math.floor(Date.now() % 100000);
  let state: RewireState = newRewireGame(seed, mods);
  let activeTool: ToolId = "solar";
  let paused = false;
  let speed = 1;
  let cellSize = 48;
  let hover: { x: number; y: number } | null = null;
  let dragging = false;
  let wins = Number(localStorage.getItem(BEST_KEY) || "0");
  let winRecorded = false;

  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);

  function resize() {
    const wrap = canvas!.parentElement!;
    const avail = Math.max(300, wrap.clientWidth - 4);
    cellSize = Math.max(24, Math.min(54, Math.floor(avail / state.level.w)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = state.level.w * cellSize;
    const H = state.level.h * cellSize + 18;
    canvas!.width = Math.round(W * dpr);
    canvas!.height = Math.round(H * dpr);
    canvas!.style.width = `${W}px`;
    canvas!.style.height = `${H}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function cellAt(ev: PointerEvent): { x: number; y: number } | null {
    const r = canvas!.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / cellSize);
    const y = Math.floor((ev.clientY - r.top) / cellSize);
    if (x < 0 || y < 0 || x >= state.level.w || y >= state.level.h) return null;
    return { x, y };
  }

  canvas.addEventListener("pointerdown", (ev) => {
    const pos = cellAt(ev);
    if (!pos) return;
    if (ev.button === 2) {
      applyTool(state, "erase", pos.x, pos.y);
      return;
    }
    dragging = activeTool === "cable" || activeTool === "erase";
    applyTool(state, activeTool, pos.x, pos.y);
    updateUi();
  });

  canvas.addEventListener("pointermove", (ev) => {
    const pos = cellAt(ev);
    hover = pos;
    if (dragging && pos) {
      applyTool(state, activeTool, pos.x, pos.y);
    }
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  canvas.addEventListener("pointerleave", () => {
    hover = null;
  });

  canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

  // Sélection d'outil
  const toolButtons = root.querySelectorAll<HTMLButtonElement>("[data-tool]");
  const syncToolButtons = () => {
    toolButtons.forEach((b) => {
      b.dataset.active = b.dataset.tool === activeTool ? "true" : "false";
    });
  };
  toolButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTool = btn.dataset.tool as ToolId;
      syncToolButtons();
    });
  });
  syncToolButtons();

  // Contrôles temps / nouvelle carte
  const btnPause = $<HTMLButtonElement>("[data-pause]");
  btnPause?.addEventListener("click", () => {
    paused = !paused;
    btnPause.textContent = paused ? "Reprendre" : "Pause";
  });

  const btnSpeed = $<HTMLButtonElement>("[data-speed]");
  btnSpeed?.addEventListener("click", () => {
    speed = speed === 1 ? 2 : 1;
    btnSpeed.textContent = speed === 2 ? "×2 actif" : "×2";
  });

  const startFresh = (newSeed: number) => {
    seed = newSeed;
    state = newRewireGame(seed, mods);
    paused = false;
    winRecorded = false;
    if (btnPause) btnPause.textContent = "Pause";
    resize();
    updateUi();
  };

  $<HTMLButtonElement>("[data-new-map]")?.addEventListener("click", () => {
    startFresh(Math.floor(Math.random() * 900000) + 1000);
  });

  $<HTMLButtonElement>("[data-retry]")?.addEventListener("click", () => {
    startFresh(seed);
  });

  // Modificateurs Vote Épisode 1
  const chkA = $<HTMLInputElement>("[data-mod-gravity]");
  const chkB = $<HTMLInputElement>("[data-mod-flywheels]");
  chkA?.addEventListener("change", () => {
    mods.gravityTowers = chkA.checked;
    state.modifiers.gravityTowers = chkA.checked;
  });
  chkB?.addEventListener("change", () => {
    mods.flywheels = chkB.checked;
    state.modifiers.flywheels = chkB.checked;
  });

  function updateUi() {
    const hh = String(Math.floor(state.hour)).padStart(2, "0");
    const mm = String(Math.floor((state.hour % 1) * 60)).padStart(2, "0");
    const setText = (sel: string, val: string) => {
      const el = $(sel);
      if (el) el.textContent = val;
    };
    setText("[data-prod]", `${state.totalProdMw.toFixed(0)} / ${state.demandMw.toFixed(0)} MW`);
    setText("[data-storage]", `${state.storageMwh.toFixed(0)} / ${state.storageCapMwh} MWh`);
    setText("[data-green]", `${Math.round(state.greenShare * 100)} %`);
    setText("[data-renature]", `${Math.round(state.renature * 100)} %`);
    setText("[data-freq]", `${state.frequencyHz.toFixed(1)} Hz`);
    setText("[data-credits]", `${Math.floor(state.credits)} cr.`);
    setText("[data-clock]", `${hh}:${mm}`);
    setText("[data-fossil]", `${state.fossilRemaining}`);
    setText("[data-seed]", `#${state.seed}`);
    setText("[data-wins]", `${wins}`);
    setText("[data-msg]", state.message);

    const overlay = $("[data-end-overlay]");
    if (overlay) {
      if (state.phase === "play") {
        overlay.hidden = true;
      } else {
        overlay.hidden = false;
        if (state.phase === "won" && !winRecorded) {
          winRecorded = true;
          wins++;
          localStorage.setItem(BEST_KEY, String(wins));
          setText("[data-wins]", `${wins}`);
        }
        setText(
          "[data-end-title]",
          state.phase === "won" ? "Réseau 100 % vert !" : "Blackout sur la zone",
        );
        setText("[data-end-desc]", state.message);
      }
    }
  }

  resize();
  window.addEventListener("resize", resize);
  updateUi();

  let last = performance.now();
  let uiAccum = 0;
  let animT = 0;

  function frame(now: number) {
    const rawDt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) {
      const dt = rawDt * speed;
      animT += dt;
      tickRewire(state, dt);
    }
    renderRewire(ctx!, state, cellSize, hover, activeTool, animT);
    uiAccum += rawDt;
    if (uiAccum >= 0.14) {
      uiAccum = 0;
      updateUi();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
