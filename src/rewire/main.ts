// Contrôleur navigateur de REWIRE v0.2 (clicker actif, coûts croissants, tech tree, secteurs & prestige).
import { TECH_UPGRADES, TOOLS, type ToolId, type UpgradeId } from "./content";
import {
  applyTool,
  buyUpgrade,
  clickGenerate,
  clickPower,
  currentToolCost,
  newRewireGame,
  tickRewire,
  upgradeCost,
  type Modifiers,
  type RewireState,
} from "./sim";
import { renderRewire } from "./render";

const BEST_SECTOR_KEY = "rewire-v02-best-sector";

export function bootRewire(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-canvas]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const mods: Modifiers = { gravityTowers: true, flywheels: false };
  let seed = Math.floor(Date.now() % 100000);
  let sector = 1;
  let state: RewireState = newRewireGame(seed, mods, sector);
  let activeTool: ToolId = "solar";
  let paused = false;
  let speed = 1;
  let cellSize = 48;
  let hover: { x: number; y: number } | null = null;
  let dragging = false;
  let bestSector = Number(localStorage.getItem(BEST_SECTOR_KEY) || "1");
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
      updateUi();
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

  // Bouton Cookie Clicker ⚡ Générer du courant
  const btnGenerate = $<HTMLButtonElement>("[data-generate]");
  btnGenerate?.addEventListener("click", () => {
    clickGenerate(state);
    btnGenerate.classList.remove("rw-pop");
    void btnGenerate.offsetWidth;
    btnGenerate.classList.add("rw-pop");
    updateUi();
  });

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

  // Améliorations incrémentales (Tech Tree)
  root.querySelectorAll<HTMLButtonElement>("[data-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.upgrade as UpgradeId;
      buyUpgrade(state, id);
      updateUi();
    });
  });

  // Contrôles temps / nouvelle carte / secteur suivant
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

  const startFresh = (newSeed: number, newSector: number) => {
    seed = newSeed;
    sector = newSector;
    state = newRewireGame(seed, mods, sector);
    paused = false;
    winRecorded = false;
    if (btnPause) btnPause.textContent = "Pause";
    resize();
    updateUi();
  };

  root.querySelectorAll<HTMLButtonElement>("[data-new-map]").forEach((b) =>
    b.addEventListener("click", () => startFresh(Math.floor(Math.random() * 900000) + 1000, 1)),
  );

  $<HTMLButtonElement>("[data-next-sector]")?.addEventListener("click", () => {
    startFresh(seed, sector + 1);
  });

  $<HTMLButtonElement>("[data-retry]")?.addEventListener("click", () => {
    startFresh(seed, sector);
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

    const cp = clickPower(state);
    setText("[data-click-gain]", `+${cp.credits} cr. · +${cp.mwh.toFixed(0)} MWh`);
    setText("[data-prod]", `${state.totalProdMw.toFixed(0)} / ${state.demandMw.toFixed(0)} MW`);
    setText("[data-storage]", `${state.storageMwh.toFixed(0)} / ${state.storageCapMwh} MWh`);
    setText("[data-green]", `${Math.round(state.greenShare * 100)} %`);
    setText("[data-renature]", `${Math.round(state.renature * 100)} %`);
    setText("[data-freq]", `${state.frequencyHz.toFixed(1)} Hz`);
    setText("[data-credits]", `${Math.floor(state.credits)} cr. (+${state.incomeRate.toFixed(1)}/s)`);
    setText("[data-clock]", `${hh}:${mm}`);
    setText("[data-fossil]", `${state.fossilRemaining}`);
    setText("[data-sector]", `Secteur ${state.sector} (×${state.prestigeMult.toFixed(2)})`);
    setText("[data-best-sector]", `${bestSector}`);
    setText("[data-msg]", state.message);

    // Bannière d'événement actif ou d'alerte surcharge
    const evEl = $("[data-event-banner]");
    if (evEl) {
      if (state.overloadRatio > 0.35) {
        evEl.hidden = false;
        evEl.dataset.tone = "danger";
        evEl.textContent = "⚠ Surcharge de lignes ! Ajoutez des câbles parallèles, un Poste HT ou l'amélioration Supraconducteurs.";
      } else if (state.activeEvent) {
        evEl.hidden = false;
        evEl.dataset.tone = "event";
        evEl.textContent = `⚡ ${state.activeEvent.name} (${Math.ceil(state.activeEvent.timeLeft)} s) : ${state.activeEvent.desc}`;
      } else {
        evEl.hidden = true;
      }
    }

    // Coûts dynamiques des outils
    for (const t of TOOLS) {
      const costEl = $(`[data-tool-cost="${t.id}"]`);
      const btn = $<HTMLButtonElement>(`[data-tool="${t.id}"]`);
      const c = currentToolCost(state, t.id);
      if (costEl) costEl.textContent = t.id === "erase" ? "50 %" : `${c} cr.`;
      if (btn && t.id !== "erase") {
        btn.dataset.afford = state.credits >= c ? "true" : "false";
      }
    }

    // Coûts & niveaux des améliorations tech tree
    for (const u of TECH_UPGRADES) {
      const btn = $<HTMLButtonElement>(`[data-upgrade="${u.id}"]`);
      const lvl = state.upgrades[u.id];
      const cost = upgradeCost(state, u.id);
      const lvlEl = $(`[data-upg-lvl="${u.id}"]`);
      const costEl = $(`[data-upg-cost="${u.id}"]`);
      if (lvlEl) lvlEl.textContent = `${lvl}/${u.maxLevel}`;
      if (costEl) costEl.textContent = lvl >= u.maxLevel ? "MAX" : `${cost} cr.`;
      if (btn) btn.disabled = lvl >= u.maxLevel || state.credits < cost;
    }

    // Overlay fin de partie
    const overlay = $("[data-end-overlay]");
    const btnNext = $<HTMLButtonElement>("[data-next-sector]");
    if (overlay) {
      if (state.phase === "play") {
        overlay.hidden = true;
      } else {
        overlay.hidden = false;
        if (state.phase === "won") {
          if (!winRecorded) {
            winRecorded = true;
            if (state.sector + 1 > bestSector) {
              bestSector = state.sector + 1;
              localStorage.setItem(BEST_SECTOR_KEY, String(bestSector));
              setText("[data-best-sector]", `${bestSector}`);
            }
          }
          if (btnNext) btnNext.hidden = false;
        } else if (btnNext) {
          btnNext.hidden = true;
        }
        setText(
          "[data-end-title]",
          state.phase === "won" ? `Secteur ${state.sector} renaturé !` : "Blackout sur le secteur",
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
