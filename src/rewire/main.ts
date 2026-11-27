// Contrôleur navigateur REWIRE v0.3 : monde qui s'agrandit (7×7 → 23×23), dynamo à surchauffe, goulots et tech tree.
import { TECH_UPGRADES, TOOLS, ZONES, type ToolId, type UpgradeId } from "./content";
import {
  applyTool,
  buyUpgrade,
  canExpand,
  clickDynamo,
  currentToolCost,
  dynamoStats,
  expandWorld,
  newRewireGame,
  tickRewire,
  upgradeCost,
  type Modifiers,
  type RewireState,
} from "./sim";
import { computeView, renderRewire, type ViewTransform } from "./render";

const BEST_ZONE_KEY = "rewire-v03-best-zone";

export function bootRewire(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-canvas]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const mods: Modifiers = { gravityTowers: true, flywheels: false };
  let seed = Math.floor(Date.now() % 100000);
  let state: RewireState = newRewireGame(seed, mods);
  let activeTool: ToolId = "cable";
  let paused = false;
  let speed = 1;
  let canvasCssSize = 540;
  let view: ViewTransform = computeView(state, canvasCssSize);
  let hover: { x: number; y: number } | null = null;
  let dragging = false;
  let bestZone = Number(localStorage.getItem(BEST_ZONE_KEY) || "1");

  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);

  function resize() {
    const wrap = canvas!.parentElement!;
    canvasCssSize = Math.max(300, Math.min(620, wrap.clientWidth - 8));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas!.width = Math.round(canvasCssSize * dpr);
    canvas!.height = Math.round(canvasCssSize * dpr);
    canvas!.style.width = `${canvasCssSize}px`;
    canvas!.style.height = `${canvasCssSize}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    view = computeView(state, canvasCssSize);
  }

  function cellAt(ev: PointerEvent): { x: number; y: number } | null {
    const r = canvas!.getBoundingClientRect();
    const vx = Math.floor((ev.clientX - r.left) / view.cellSize);
    const vy = Math.floor((ev.clientY - r.top) / view.cellSize);
    if (vx < 0 || vy < 0 || vx >= view.span || vy >= view.span) return null;
    return { x: view.minX + vx, y: view.minY + vy };
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
    if (dragging && pos) applyTool(state, activeTool, pos.x, pos.y);
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });
  canvas.addEventListener("pointerleave", () => {
    hover = null;
  });
  canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

  // Dynamo d'urgence (clicker avec jauge de surchauffe)
  const btnDynamo = $<HTMLButtonElement>("[data-generate]");
  btnDynamo?.addEventListener("click", () => {
    if (clickDynamo(state)) {
      btnDynamo.classList.remove("rw-pop");
      void btnDynamo.offsetWidth;
      btnDynamo.classList.add("rw-pop");
    }
    updateUi();
  });

  // Bouton Étendre la carte (agrandit le monde 7×7 → 11×11 → 15×15 → 19×19 → 23×23)
  const btnExpand = $<HTMLButtonElement>("[data-expand]");
  btnExpand?.addEventListener("click", () => {
    if (expandWorld(state)) {
      view = computeView(state, canvasCssSize);
      if (state.unlockedZone > bestZone) {
        bestZone = state.unlockedZone;
        localStorage.setItem(BEST_ZONE_KEY, String(bestZone));
      }
    }
    updateUi();
  });

  // Outils
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

  // Améliorations Tech Tree
  root.querySelectorAll<HTMLButtonElement>("[data-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      buyUpgrade(state, btn.dataset.upgrade as UpgradeId);
      updateUi();
    });
  });

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
    if (btnPause) btnPause.textContent = "Pause";
    resize();
    updateUi();
  };

  root.querySelectorAll<HTMLButtonElement>("[data-new-map]").forEach((b) =>
    b.addEventListener("click", () => startFresh(Math.floor(Math.random() * 900000) + 1000)),
  );
  $<HTMLButtonElement>("[data-retry]")?.addEventListener("click", () => startFresh(seed));

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

    const ds = dynamoStats(state);
    setText(
      "[data-click-gain]",
      state.dynamoLocked ? "🔥 Surchauffe…" : `+${ds.credits} cr. · +${ds.mw} MW`,
    );
    const heatBar = $("[data-heat-fill]");
    if (heatBar) heatBar.style.width = `${Math.round(state.dynamoHeat)}%`;
    if (btnDynamo) btnDynamo.disabled = state.dynamoLocked || state.phase !== "play";

    const curZ = ZONES[state.unlockedZone - 1];
    const spanLabel = `${curZ.radius * 2 + 1}×${curZ.radius * 2 + 1}`;
    setText("[data-prod]", `${state.deliveredMw.toFixed(0)} / ${state.demandMw.toFixed(0)} MW`);
    setText("[data-storage]", `${state.storageMwh.toFixed(0)} / ${state.storageCapMwh} MWh`);
    setText("[data-green]", `${Math.round(state.greenShare * 100)} %`);
    setText("[data-renature]", `${Math.round(state.renature * 100)} %`);
    setText("[data-freq]", `${state.frequencyHz.toFixed(1)} Hz`);
    const rateSign = state.incomeRate >= 0 ? "+" : "";
    setText("[data-credits]", `${Math.floor(state.credits)} cr. (${rateSign}${state.incomeRate.toFixed(1)}/s)`);
    setText("[data-clock]", `${hh}:${mm}`);
    setText("[data-zone]", `Zone ${state.unlockedZone}/5 (${spanLabel})`);
    setText("[data-cities]", `${state.poweredCities}/${state.unlockedCities} · ${state.fossilRemaining} foss.`);
    setText("[data-best-zone]", `${bestZone}/5`);
    setText("[data-msg]", state.message);

    // Bouton d'extension de la carte
    const exp = canExpand(state);
    if (btnExpand) {
      btnExpand.disabled = !exp.ok;
      btnExpand.textContent = exp.ok ? `🗺️ ${exp.reason} (${exp.cost} cr.)` : `🔒 Extension : ${exp.reason}`;
    }

    // Bannière d'alerte goulot ou événement
    const evEl = $("[data-event-banner]");
    if (evEl) {
      if (state.overloadedCables > 0) {
        evEl.hidden = false;
        evEl.dataset.tone = "danger";
        evEl.textContent = `⚠ ${state.overloadedCables} câble(s) saturé(s) (${state.wastedMw.toFixed(0)} MW perdus) ! Ajoutez un chemin parallèle, un Poste HT ou Supraconducteurs.`;
      } else if (state.activeEvent) {
        evEl.hidden = false;
        evEl.dataset.tone = "event";
        evEl.textContent = `⚡ ${state.activeEvent.name} (${Math.ceil(state.activeEvent.timeLeft)} s) : ${state.activeEvent.desc}`;
      } else {
        evEl.hidden = true;
      }
    }

    for (const t of TOOLS) {
      const costEl = $(`[data-tool-cost="${t.id}"]`);
      const btn = $<HTMLButtonElement>(`[data-tool="${t.id}"]`);
      const c = currentToolCost(state, t.id);
      if (costEl) costEl.textContent = t.id === "erase" ? "50 %" : `${c} cr.`;
      if (btn && t.id !== "erase") btn.dataset.afford = state.credits >= c ? "true" : "false";
    }

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

    const overlay = $("[data-end-overlay]");
    if (overlay) {
      if (state.phase === "play") {
        overlay.hidden = true;
      } else {
        overlay.hidden = false;
        setText("[data-end-title]", state.phase === "won" ? "Monde 23×23 renaturé !" : "Blackout généralisé");
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
    renderRewire(ctx!, state, view, hover, activeTool, animT);
    uiAccum += rawDt;
    if (uiAccum >= 0.12) {
      uiAccum = 0;
      updateUi();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
