// Interface du jeu des viaducs : boucle temps réel, saisie souris/tactile, boutique, sauvegarde locale.
import { SEASON, TUNING, UPGRADES, type UpgradeId } from "./content.ts";
import { N4, pipeCost } from "./level.ts";
import { buy, chooseWeekly, dailySeed, newGame, newSeason, nextDay, openValves, pipeBudget, pipesUsed, place, quota, rate, remove, resetWater, stat, tick, upgradeCost, type GameState } from "./sim.ts";
import { draw, invalidateTerrain } from "./render.ts";
import { autoplayTo } from "./demo.ts";

const SAVE_KEY = "veridia-2140-viaducs";
const BEST_KEY = "veridia-2140-viaducs-record";
const DAILY_KEY = "veridia-2140-carte-du-jour";
const SEASON_KEY = "veridia-2140-saison-record";
const SITE = "https://flexarion.alwaysdata.net/jouer/";

/** Date locale du joueur (AAAA-MM-JJ) : la carte du jour change à minuit. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const dateFr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export function boot(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const canvas = $<HTMLCanvasElement>("[data-canvas]");
  const ctx = canvas.getContext("2d")!;

  // Mode démo (/jouer/?demo=4) : partie jouée automatiquement jusqu'au jour indiqué, sans sauvegarde.
  const demoDay = Number(new URLSearchParams(location.search).get("demo"));
  const demo = Number.isFinite(demoDay) && demoDay > 0;
  const demoSeason = new URLSearchParams(location.search).get("mode") === "saison";
  let s: GameState = demo ? (demoSeason ? newSeason(2140) : newGame(2140)) : (load() ?? newGame());
  if (demo) autoplayTo(s, Math.min(demoDay, 20));
  let size = 48;
  let hover: number | null = null;
  let mode: "place" | "remove" | null = null;
  let paused = false;
  let fast = false;
  let message = "";
  let messageAt = 0;
  let last = performance.now();
  let uiAt = 0;
  let shownPhase = "";

  function save() {
    if (demo) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      if (s.season) {
        if (s.day > seasonBest()) localStorage.setItem(SEASON_KEY, String(s.day));
      } else if (s.day > best()) localStorage.setItem(BEST_KEY, String(s.day));
      if (s.daily === today() && s.day > dailyBest()) localStorage.setItem(DAILY_KEY, JSON.stringify({ date: s.daily, best: s.day }));
    } catch {
      /* stockage indisponible : la partie continue sans sauvegarde */
    }
  }
  function load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const g = JSON.parse(raw) as GameState;
      if (g.version !== 2 || !g.level || !Array.isArray(g.pipes)) return null;
      // Une journée interrompue reprend en préparation, réseau conservé.
      if (g.phase === "run") resetWater(g);
      return g;
    } catch {
      return null;
    }
  }
  /** Meilleur jour atteint sur la carte du jour d'aujourd'hui. */
  function dailyBest(): number {
    try {
      const d = JSON.parse(localStorage.getItem(DAILY_KEY) ?? "null") as { date: string; best: number } | null;
      return d && d.date === today() ? d.best : 0;
    } catch {
      return 0;
    }
  }
  function seasonBest(): number {
    try {
      return Number(localStorage.getItem(SEASON_KEY) ?? 0);
    } catch {
      return 0;
    }
  }
  function best(): number {
    try {
      return Number(localStorage.getItem(BEST_KEY) ?? 0);
    } catch {
      return 0;
    }
  }

  function resize() {
    const l = s.level;
    const w = canvas.parentElement!.clientWidth;
    let fit = w / l.w;
    if (root.dataset.compact) {
      // Cadre de petite taille (itch.io) : la carte doit aussi tenir en hauteur, sous le bandeau et l'aide.
      const top = canvas.parentElement!.getBoundingClientRect().top + window.scrollY;
      fit = Math.min(fit, (window.innerHeight - top - 52) / l.h);
    }
    size = Math.max(16, Math.floor(Math.min(64, fit)));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${size * l.w}px`;
    canvas.style.height = `${size * l.h}px`;
    canvas.width = size * l.w * dpr;
    canvas.height = size * l.h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    invalidateTerrain();
  }

  function tileAt(e: PointerEvent): number | null {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / size);
    const y = Math.floor((e.clientY - r.top) / size);
    return x >= 0 && y >= 0 && x < s.level.w && y < s.level.h ? y * s.level.w + x : null;
  }

  function say(text: string) {
    message = text;
    messageAt = performance.now();
  }

  function act(i: number) {
    if (s.phase !== "plan" && s.phase !== "run") return;
    if (!mode) mode = s.pipes[i] ? "remove" : "place";
    const err = mode === "remove" ? (s.pipes[i] ? remove(s, i) : null) : s.pipes[i] ? null : place(s, i);
    if (err) say(err);
    else if (s.phase === "plan") save();
    ui();
  }

  // Cliquer ou glisser : pose des tuyaux. Commencer sur un tuyau : les retire. Clic droit : retirer.
  canvas.addEventListener("pointerdown", (e) => {
    const i = tileAt(e);
    if (i === null) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    hover = i;
    mode = e.button === 2 ? "remove" : null;
    act(i);
  });
  canvas.addEventListener("pointermove", (e) => {
    const i = tileAt(e);
    if (i === hover) return;
    hover = i;
    if (mode && i !== null) act(i);
  });
  const stop = () => {
    mode = null;
  };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  canvas.addEventListener("pointerleave", () => {
    hover = null;
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // Commandes.
  const goBtn = $<HTMLButtonElement>("[data-go]");
  const introOpen = () => !$("[data-intro]").hidden;
  goBtn.addEventListener("click", () => {
    if (introOpen()) return; // la partie commence par l'écran d'accueil
    if (s.phase === "plan") {
      openValves(s);
      paused = false;
    } else if (s.phase === "run") paused = !paused;
    ui();
  });
  const fastBtn = $<HTMLButtonElement>("[data-fast]");
  fastBtn.addEventListener("click", () => {
    fast = !fast;
    ui();
  });
  $("[data-clear]").addEventListener("click", () => {
    if (s.phase !== "plan") return;
    if (s.season && !confirm("Effacer tout le réseau de la saison ?")) return;
    s.pipes.fill(0);
    save();
    ui();
  });
  for (const b of root.querySelectorAll<HTMLButtonElement>("[data-restart]"))
    b.addEventListener("click", () => {
      // « Rejouer » en fin de partie relance le même mode ; ailleurs, c'est une partie libre.
      const season = b.dataset.restart === "same" && s.season;
      if (s.phase !== "over" && !confirm("Abandonner cette partie pour une partie libre au jour 1 ?")) return;
      s = season ? newSeason() : newGame();
      fresh();
    });
  $("[data-start]").addEventListener("click", () => {
    $("[data-intro]").hidden = true;
  });
  const startDaily = () => {
    s = newGame(dailySeed(today()), today());
    $("[data-intro]").hidden = true;
    fresh();
  };
  $("[data-start-daily]").addEventListener("click", startDaily);
  const startSeason = () => {
    s = newSeason();
    $("[data-intro]").hidden = true;
    fresh();
  };
  $("[data-start-season]").addEventListener("click", startSeason);
  $("[data-season]").addEventListener("click", () => {
    if (s.phase !== "over" && (s.day > 1 || s.pipes.some(Boolean)) && !confirm("Abandonner cette partie pour une nouvelle saison ?")) return;
    startSeason();
  });
  $("[data-daily]").addEventListener("click", () => {
    if (s.phase !== "over" && (s.day > 1 || s.pipes.some(Boolean)) && !confirm("Abandonner cette partie pour la carte du jour ?")) return;
    startDaily();
  });
  $("[data-share]").addEventListener("click", async () => {
    const what = s.season ? "mode saison" : s.daily ? `carte du jour du ${dateFr(s.daily)}` : "partie libre";
    const text = `Veridia 2140 (${what}) : je suis allé jusqu'au jour ${s.day} et j'ai livré ${Math.round(s.total)} m³ d'eau 💧 Et toi ?`;
    try {
      if (navigator.share) await navigator.share({ title: "Veridia 2140", text, url: SITE });
      else {
        await navigator.clipboard.writeText(`${text}\n${SITE}`);
        $("[data-share]").textContent = "Copié !";
      }
    } catch {
      /* partage annulé */
    }
  });
  $("[data-next]").addEventListener("click", () => {
    nextDay(s);
    fresh();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement || !root.isConnected) return;
    if (e.key === " " && root.contains(document.activeElement ?? null)) {
      e.preventDefault();
      goBtn.click();
    }
  });

  function fresh() {
    paused = false;
    resize();
    save();
    ui(true);
  }

  /** Quartiers reliés aux sources par des tuyaux (même encore secs). */
  function linked(): Set<number> {
    const { w, h, ground } = s.level;
    const out = new Set<number>();
    const seen = new Set<number>();
    const queue = s.level.sources.map((p) => p.y * w + p.x);
    queue.forEach((i) => seen.add(i));
    while (queue.length) {
      const c = queue.shift()!;
      const x = c % w, y = (c / w) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (ground[n] === "quarter") out.add(n); // les chantiers (« site ») ne comptent pas
        if (s.pipes[n] && !seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    return out;
  }

  function hint(): string {
    if (performance.now() - messageAt < 3500 && message) return message;
    const active = s.emergencies.find((e) => e.status === "active");
    if (s.phase === "run" && active)
      return `Urgence : ${active.name} ! Tirez un tuyau jusqu'à côté, vite. Il vous manque des tuyaux ? Retirez ceux d'un quartier déjà servi.`;
    if (s.phase === "plan") {
      const used = s.pipes.some(Boolean);
      const missing = s.level.quarters.length - linked().size;
      if (s.season && used && missing > 0)
        return `${missing > 1 ? `${missing} quartiers attendent` : "Un nouveau quartier attend"} : prolongez votre réseau. Les chantiers en pointillés seront habités les jours suivants.`;
      if (!used)
        return s.season
          ? "Mode saison : la carte et votre réseau restent d'un jour à l'autre. Reliez les deux premiers quartiers, en pensant aux chantiers."
          : s.day === 1
          ? "Glissez depuis la source (en haut) pour poser des tuyaux jusqu'à côté de chaque quartier."
          : "Nouvelle carte. Tracez votre réseau, puis ouvrez les vannes.";
      if (missing > 0) return `Encore ${missing} quartier${missing > 1 ? "s" : ""} à relier. L'eau doit pouvoir aller de la source jusqu'à une case voisine du quartier.`;
      return s.day >= 2
        ? "Tout est relié. Gardez quelques tuyaux pour les urgences, puis ouvrez les vannes."
        : "Tout est relié. Ouvrez les vannes !";
    }
    if (s.phase === "run") {
      const q = quota(s);
      if (s.delivered.some((d) => d >= q)) return "Un quartier servi n'a plus besoin d'eau : ses tuyaux peuvent servir ailleurs.";
      return "L'eau avance. À chaque embranchement, elle se partage à parts égales entre les quartiers qui ont soif.";
    }
    return "";
  }

  const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");

  function ui(force = false) {
    const l = s.level;
    const q = quota(s);
    const budget = pipeBudget(s);
    const used = pipesUsed(s);
    $("[data-day]").textContent = `Jour ${s.day}`;
    const left = Math.max(0, TUNING.dayLength - s.t);
    $("[data-time]").textContent = s.phase === "plan" ? "préparation" : s.phase === "run" ? `${Math.ceil(left)} s` : "terminé";
    $("[data-timer]").style.width = `${(s.t / TUNING.dayLength) * 100}%`;
    $("[data-pipes]").textContent = `${budget - used} / ${budget}`;
    $("[data-water]").textContent = `${fmt(stat(s, "water"))} m³/s`;
    $("[data-speed]").textContent = `${fmt(stat(s, "speed"))} cases/s`;
    $("[data-credits]").textContent = String(s.credits);
    if (s.season) {
      const t = s.season.thirst;
      $("[data-trust-label]").textContent = "Soif";
      $("[data-trust]").innerHTML = `<span class="thirst${t >= 60 ? " high" : ""}"><span style="width:${t}%"></span></span><b>${t} %</b>`;
      $("[data-trust]").setAttribute("aria-label", `Soif de la ville : ${t} sur 100`);
    } else {
      $("[data-trust-label]").textContent = "Confiance";
      $("[data-trust]").innerHTML = Array.from({ length: TUNING.trustMax }, (_, k) => `<i class="${k < s.trust ? "on" : ""}"></i>`).join("");
      $("[data-trust]").setAttribute("aria-label", `Confiance : ${s.trust} sur ${TUNING.trustMax}`);
    }
    goBtn.textContent = s.phase === "plan" ? "Ouvrir les vannes" : s.phase !== "run" ? "Journée terminée" : paused ? "Reprendre" : "Pause";
    goBtn.disabled = (s.phase !== "plan" && s.phase !== "run") || introOpen();
    goBtn.classList.toggle("btn-sun", s.phase === "plan" || paused);
    fastBtn.setAttribute("aria-pressed", String(fast));
    $<HTMLButtonElement>("[data-clear]").disabled = s.phase !== "plan" || !s.pipes.some(Boolean);
    $("[data-hint]").textContent = hint();
    const rec = s.season ? seasonBest() : best();
    $("[data-best]").textContent = [s.season ? "Mode saison" : s.daily ? `Carte du jour (${dateFr(s.daily)})` : "Partie libre", rec > 1 ? `record : jour ${rec}` : ""].filter(Boolean).join(" · ");
    $("[data-side-title]").textContent = s.season ? "Quartiers habités" : "Quartiers du jour";

    $("[data-quarters]").innerHTML = l.quarters
      .map((p, k) => {
        const pct = Math.min(100, (s.delivered[k] / q) * 100);
        const done = pct >= 99.99;
        return `<li class="${done ? "done" : ""}"><span class="qn">${p.name}</span><span class="bar"><span style="width:${pct}%"></span></span><span class="num">${done ? "servi" : `${fmt(s.delivered[k])}/${q} m³`}</span></li>`;
      })
      .join("");
    const sites = s.season ? s.season.pool.length - l.quarters.length : 0;
    $("[data-quota]").textContent =
      `Chaque quartier boit ${fmt(rate(s))} m³/s et doit recevoir ${q} m³ avant la fin de la journée.` +
      (sites ? ` Encore ${sites} chantier${sites > 1 ? "s" : ""} : un nouveau quartier chaque jour.` : "");
    $("[data-log]").innerHTML = s.log.map((t) => `<li>${t}</li>`).join("");

    // Bilan et boutique.
    if (force || shownPhase !== s.phase) {
      shownPhase = s.phase;
      const report = $("[data-report]");
      const over = $("[data-over]");
      report.hidden = s.phase !== "report";
      over.hidden = s.phase !== "over";
      const r = s.report;
      if (r && s.phase === "report") {
        $("[data-report-title]").textContent = `Fin du jour ${r.day}`;
        $("[data-report-list]").innerHTML = [
          `<li><span>Quartiers servis</span><b>${r.quartersOk}/${r.quartersTotal}</b></li>`,
          r.emergenciesTotal ? `<li><span>Urgences maîtrisées</span><b>${r.emergenciesOk}/${r.emergenciesTotal}</b></li>` : "",
          `<li><span>Tuyaux non utilisés (sobriété)</span><b>${r.sparePipes}</b></li>`,
          s.season
            ? `<li><span>Soif de la ville</span><b>${r.thirstDelta ? `${r.thirstDelta > 0 ? "+" : ""}${r.thirstDelta}` : "="} (${s.season.thirst} %)</b></li>`
            : `<li><span>Confiance</span><b>${r.trustDelta > 0 ? "+1" : r.trustDelta < 0 ? r.trustDelta : "="}</b></li>`,
          `<li class="sum"><span>Crédits gagnés</span><b>+${r.credits}</b></li>`,
        ].join("");
        shop();
        weekly();
      }
      if (s.phase === "over") {
        const rec = s.season ? seasonBest() : s.daily ? dailyBest() : best();
        const where = s.season ? `en mode saison, avec ${l.quarters.length} quartiers,` : s.daily ? `sur la carte du ${dateFr(s.daily)}` : "";
        $("[data-over-text]").textContent = `Vous avez tenu jusqu'au jour ${s.day} ${where} et livré ${Math.round(s.total)} m³ d'eau. ${rec > s.day ? `Votre record : jour ${rec}.` : "C'est votre record !"}`.replace("  ", " ");
        $("[data-share]").textContent = "Partager mon score";
      }
    }
    void force;
  }

  /** Mode saison : tous les 7 jours, une amélioration gratuite au choix. */
  function weekly() {
    const box = $("[data-weekly]");
    const open = !!s.season?.weekly && s.phase === "report";
    box.hidden = !open;
    if (!open) return;
    const list = $("[data-weekly-list]");
    list.innerHTML = "";
    for (const id of Object.keys(UPGRADES) as UpgradeId[]) {
      const u = UPGRADES[id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.disabled = upgradeCost(s, id) === null;
      b.textContent = `${u.name} : ${fmt(u.value(s.upgrades[id] + 1))} ${u.unit}`;
      b.addEventListener("click", () => {
        if (!chooseWeekly(s, id)) {
          save();
          weekly();
          shop();
          ui();
        }
      });
      list.append(b);
    }
  }

  function shop() {
    const box = $("[data-shop]");
    box.innerHTML = "";
    $("[data-shop-credits]").textContent = String(s.credits);
    for (const id of Object.keys(UPGRADES) as UpgradeId[]) {
      const u = UPGRADES[id];
      const cost = upgradeCost(s, id);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "upgrade";
      b.disabled = cost === null || s.credits < cost;
      const lvl = s.upgrades[id];
      const now = u.value(lvl);
      const next = cost === null ? null : u.value(lvl + 1);
      b.innerHTML = `<span class="u-name">${u.name}</span><span class="u-val">${fmt(now)}${next !== null ? ` → <b>${fmt(next)}</b>` : ""} ${u.unit}</span><span class="u-help">${u.help}</span><span class="u-cost">${cost === null ? "max" : `${cost} cr`}</span>`;
      b.addEventListener("click", () => {
        const err = buy(s, id);
        if (!err) {
          save();
          shop();
          ui();
        }
      });
      box.append(b);
    }
  }

  function frame(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (s.phase === "run" && !paused) {
      let left = dt * (fast ? 2 : 1);
      while (left > 1e-6 && s.phase === "run") {
        const step = Math.min(0.05, left);
        tick(s, step);
        left -= step;
      }
      if (s.phase !== "run") {
        save();
        ui(true);
      }
    }
    draw(ctx, { s, size, time: now / 1000, hover });
    if (now - uiAt > 120) {
      uiAt = now;
      ui();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  if (demo || s.day > 1 || s.pipes.some(Boolean)) $("[data-intro]").hidden = true;
  resize();
  ui(true);
  requestAnimationFrame(frame);
  void pipeCost;
  void SEASON;
}
