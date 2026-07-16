(function registerAztecStoneMoversPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "3.4";
  const STONE_WEIGHT_KN = 24;
  const WORKER_FORCE_KN = 1.2;
  const ORIGINAL_SHORT_ARM = 0.3;
  const ORIGINAL_WORKERS = 4;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p34-reset">Reset</button>';
  const hints = Object.freeze([
    "Take moments about the fulcrum. The fulcrum reaction then has no turning effect in the equation.",
    "The stone produces 24 × 0.30 = 7.2 kN·m. Four movers can apply at most 4 × 1.2 = 4.8 kN downward.",
    "At the limiting position, 4.8b = 7.2. Solve for the effort-arm length b.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Original setup", shortArm: 0.3, effortArm: 1.2, workers: 4 }),
    Object.freeze({ label: "Just lifts", shortArm: 0.3, effortArm: 1.5, workers: 4 }),
    Object.freeze({ label: "Long handle", shortArm: 0.3, effortArm: 2.2, workers: 4 }),
    Object.freeze({ label: "Move fulcrum", shortArm: 0.2, effortArm: 1.2, workers: 4 }),
  ]);

  const initialState = () => ({
    shortArm: ORIGINAL_SHORT_ARM,
    effortArm: 1.2,
    workers: ORIGINAL_WORKERS,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toString();
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function totalEffort() {
    return state.workers * WORKER_FORCE_KN;
  }

  function loadMoment() {
    return STONE_WEIGHT_KN * state.shortArm;
  }

  function effortMoment() {
    return totalEffort() * state.effortArm;
  }

  function requiredPerWorker() {
    return loadMoment() / (state.workers * state.effortArm);
  }

  function mechanicalAdvantage() {
    return state.effortArm / state.shortArm;
  }

  function canLift() {
    return effortMoment() >= loadMoment() - 1e-9;
  }

  function originalMinimumArm() {
    return (STONE_WEIGHT_KN * ORIGINAL_SHORT_ARM) / (ORIGINAL_WORKERS * WORKER_FORCE_KN);
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.shortArm - state.shortArm) < 0.001
      && Math.abs(preset.effortArm - state.effortArm) < 0.001
      && preset.workers === state.workers
    ));
  }

  function geometry() {
    const fulcrumX = 285;
    const leverY = 225;
    const loadScale = 230;
    const effortScale = 145;
    const loadX = fulcrumX - state.shortArm * loadScale;
    const effortX = fulcrumX + state.effortArm * effortScale;
    return { fulcrumX, leverY, loadX, effortX };
  }

  function workerFigures(x) {
    const count = Math.min(6, state.workers);
    const spacing = 24;
    const start = x - ((count - 1) * spacing) / 2;
    return Array.from({ length: count }, (_, index) => `
      <g class="p34-worker" transform="translate(${(start + index * spacing).toFixed(2)} 140)">
        <circle cy="-14" r="6" /><path d="M0-7v23m0-14-8 10m8-10 8 10M0 16l-7 13m7-13 7 13" />
      </g>`).join("");
  }

  function apparatusMarkup() {
    const shape = geometry();
    const lift = canLift();
    const progress = loadMoment() ? Math.min(100, (effortMoment() / loadMoment()) * 100) : 100;
    return `
      <div class="p34-apparatus-wrap">
        <svg class="p34-apparatus" viewBox="0 0 700 370" role="img" aria-labelledby="p34-apparatus-title p34-apparatus-desc">
          <title id="p34-apparatus-title">Movers using a lever to lift a stone onto a roller</title>
          <desc id="p34-apparatus-desc">The fulcrum is ${format(state.shortArm, 2)} metres from the stone and the movers push ${format(state.effortArm, 2)} metres from the fulcrum. ${state.workers} movers produce ${format(effortMoment(), 2)} kilonewton metres against the stone’s ${format(loadMoment(), 2)} kilonewton metres. The stone ${lift ? "can lift" : "does not lift"}.</desc>
          <defs>
            <marker id="p34-arrow-stone" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p34-arrow-effort" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <line class="p34-ground" x1="35" y1="315" x2="665" y2="315" />
          <g class="p34-stone ${lift ? "is-lifting" : ""}" data-p34-stone transform="translate(${shape.loadX.toFixed(2)} 0)">
            <path d="M-75 85h150l15 124-20 15H-74l-18-17Z" />
            <path class="p34-stone-mark" d="m-45 112 28 21 24-18 35 31m-76 22 19 17 38-11 28 22" />
          </g>
          <line class="p34-weight-arrow" data-p34-weight-arrow x1="${shape.loadX.toFixed(2)}" y1="102" x2="${shape.loadX.toFixed(2)}" y2="198" marker-end="url(#p34-arrow-stone)" />
          <text class="p34-force-label is-load" data-p34-load-label x="${(shape.loadX + 14).toFixed(2)}" y="126">24 kN</text>
          <line class="p34-lever" data-p34-lever x1="${(shape.loadX - 20).toFixed(2)}" y1="${shape.leverY}" x2="${(shape.effortX + 22).toFixed(2)}" y2="${shape.leverY}" />
          <g class="p34-fulcrum" transform="translate(${shape.fulcrumX} ${shape.leverY})"><path d="m0 3-29 55h58Z" /><circle cy="2" r="9" /></g>
          <g data-p34-workers>${workerFigures(shape.effortX)}</g>
          <line class="p34-effort-arrow" data-p34-effort-arrow x1="${shape.effortX.toFixed(2)}" y1="113" x2="${shape.effortX.toFixed(2)}" y2="205" marker-end="url(#p34-arrow-effort)" />
          <text class="p34-force-label is-effort" data-p34-effort-label x="${(shape.effortX + 13).toFixed(2)}" y="120">${format(totalEffort(), 1)} kN</text>
          <line class="p34-dimension is-short" data-p34-short-dimension x1="${shape.loadX.toFixed(2)}" y1="273" x2="${shape.fulcrumX}" y2="273" />
          <text class="p34-dimension-label" data-p34-short-label x="${((shape.loadX + shape.fulcrumX) / 2).toFixed(2)}" y="293" text-anchor="middle">a = ${format(state.shortArm, 2)} m</text>
          <line class="p34-dimension is-long" data-p34-long-dimension x1="${shape.fulcrumX}" y1="273" x2="${shape.effortX.toFixed(2)}" y2="273" />
          <text class="p34-dimension-label" data-p34-long-label x="${((shape.fulcrumX + shape.effortX) / 2).toFixed(2)}" y="293" text-anchor="middle">b = ${format(state.effortArm, 2)} m</text>
          <g class="p34-roller ${lift ? "is-ready" : ""}" data-p34-roller transform="translate(${(shape.loadX + 48).toFixed(2)} 296)"><circle r="18" /><path d="M-10 0h20" /><text x="0" y="35" text-anchor="middle">roller</text></g>
          <text class="p34-fulcrum-label" x="${shape.fulcrumX}" y="306" text-anchor="middle">fulcrum</text>
        </svg>
        <div class="p34-moment-balance ${lift ? "is-lifting" : ""}" data-p34-moment-balance>
          <div><span>Stone moment</span><strong data-p34-live="load-moment">${format(loadMoment(), 2)} kN·m</strong></div>
          <div class="p34-balance-track" role="img" data-p34-balance-track aria-label="Mover moment ${format(effortMoment(), 2)} out of the required ${format(loadMoment(), 2)} kilonewton metres"><i style="--p34-progress:${progress.toFixed(2)}%"></i><b></b></div>
          <div><span>Mover moment</span><strong data-p34-live="effort-moment">${format(effortMoment(), 2)} kN·m</strong></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit) {
    return `
      <label class="p34-range-row" for="p34-${kind}-slider">
        <span><strong>${label}</strong><output data-p34-live="${kind}">${format(value, 2)} ${unit}</output></span>
        <input id="p34-${kind}-slider" data-p34-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum} ${unit}</span><span>from fulcrum</span><span>${maximum} ${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p34-controls">
        ${sliderMarkup("short-arm", "Stone arm · a", 0.15, 0.6, 0.01, state.shortArm, "m")}
        ${sliderMarkup("effort-arm", "Effort arm · b", 0.6, 2.4, 0.05, state.effortArm, "m")}
        <div class="p34-worker-stepper">
          <span><strong>Movers pushing</strong><output data-p34-live="workers">${state.workers}</output></span>
          <div><button type="button" data-problem-action="p34-worker" data-p34-delta="-1" aria-label="Use one fewer mover" ${state.workers <= 1 ? "disabled" : ""}>−</button><b data-p34-live="worker-force">${format(totalEffort(), 1)} kN maximum</b><button type="button" data-problem-action="p34-worker" data-p34-delta="1" aria-label="Use one more mover" ${state.workers >= 6 ? "disabled" : ""}>+</button></div>
        </div>
        <div class="p34-presets" aria-label="Lever presets">${presets.map((preset, index) => `<button class="chip-button p34-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p34-preset" data-p34-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricMarkup() {
    const lift = canLift();
    return `
      <div class="p34-metrics" aria-live="polite">
        <div><span>Mechanical advantage</span><strong data-p34-live="advantage">${format(mechanicalAdvantage(), 2)} : 1</strong></div>
        <div><span>Required per mover</span><strong data-p34-live="required-worker">${format(requiredPerWorker(), 2)} kN</strong></div>
        <div class="${lift ? "is-success" : "is-blocked"}" data-p34-status-card><span>At maximum push</span><strong data-p34-live="status">${lift ? "Stone lifts" : "Not enough moment"}</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p34-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p34-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p34-solution" aria-labelledby="p34-solution-heading">
        <h3 id="p34-solution-heading" tabindex="-1">Equal moments mark the first lift</h3>
        <p>Take moments about the fulcrum. The light lever’s own weight is neglected, and the fulcrum reaction produces no moment about itself.</p>
        <div class="p34-equation">stone moment = 24 × 0.30 = 7.2 kN·m</div>
        <div class="p34-equation">maximum mover force = 4 × 1.2 = 4.8 kN</div>
        <p>If <em>b</em> is the distance from the fulcrum to their push, limiting equilibrium requires</p>
        <div class="p34-equation">4.8b = 7.2</div>
        <div class="p34-equation is-answer">b = 7.2 / 4.8 = 1.50 m</div>
        <p>At 1.50 m the moments exactly balance. A slightly longer effort arm raises the stone enough to slide the roller underneath.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      stoneWeightKilonewtons: STONE_WEIGHT_KN,
      maximumForcePerMoverKilonewtons: WORKER_FORCE_KN,
      movers: state.workers,
      shortArmMetres: Number(state.shortArm.toFixed(3)),
      effortArmMetres: Number(state.effortArm.toFixed(3)),
      loadMomentKilonewtonMetres: Number(loadMoment().toFixed(3)),
      effortMomentKilonewtonMetres: Number(effortMoment().toFixed(3)),
      requiredPerMoverKilonewtons: Number(requiredPerWorker().toFixed(3)),
      mechanicalAdvantage: Number(mechanicalAdvantage().toFixed(3)),
      stoneCanLift: canLift(),
      originalMinimumEffortArmMetres: originalMinimumArm(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p34-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p34-spread">
          <article class="book-page p34-problem-page">
            <div class="problem-number">Problem 3.4</div>
            <h1 class="book-title p34-title">Aztec stone movers</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">Movers must raise a 24 kN stone just far enough to slide a roller underneath. A light, rigid lever supports the stone at its short end, 0.30 m from the fulcrum.</p>
            <p class="problem-copy">Four movers push down together. Each can exert at most 1.2 kN. How far from the fulcrum must they apply their force, at minimum, to begin lifting the stone?</p>
            <p class="p34-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written lever scenario is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Assumptions</div><p>The lever is rigid and light, the fulcrum does not move, and the lever tip supports the stone’s full weight at the instant it leaves the ground.</p></section>
          </article>

          <section class="book-page book-stage p34-stage" aria-labelledby="p34-stage-title">
            <div class="p34-stage-card">
              <div class="p34-stage-heading"><div><span class="eyebrow">Lever laboratory</span><h2 id="p34-stage-title">Trade force for distance</h2></div><p>Move the fulcrum or the push point. A longer effort arm multiplies the movers’ turning effect.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p34-coach">
            <div class="coach-kicker">Find the shortest handle</div>
            <p class="coach-question">With four movers and a 0.30 m stone arm, what minimum effort arm is required?</p>
            <form class="p34-answer-form" data-p34-answer-form novalidate>
              <label for="p34-answer">Distance from fulcrum</label>
              <div><input id="p34-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 1.4" /><span>m</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p34-help-row"><button class="secondary-button" type="button" data-problem-action="p34-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p34-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateLiveDom(root) {
    const shape = geometry();
    const lift = canLift();
    const values = {
      "short-arm": `${format(state.shortArm, 2)} m`,
      "effort-arm": `${format(state.effortArm, 2)} m`,
      workers: state.workers,
      "worker-force": `${format(totalEffort(), 1)} kN maximum`,
      "load-moment": `${format(loadMoment(), 2)} kN·m`,
      "effort-moment": `${format(effortMoment(), 2)} kN·m`,
      advantage: `${format(mechanicalAdvantage(), 2)} : 1`,
      "required-worker": `${format(requiredPerWorker(), 2)} kN`,
      status: lift ? "Stone lifts" : "Not enough moment",
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p34-live="${key}"]`).forEach((node) => { node.textContent = String(value); }));

    const setLine = (selector, attributes) => {
      const line = root.querySelector(selector);
      if (!line) return;
      Object.entries(attributes).forEach(([name, value]) => line.setAttribute(name, Number(value).toFixed(2)));
    };
    setLine("[data-p34-lever]", { x1: shape.loadX - 20, x2: shape.effortX + 22 });
    setLine("[data-p34-weight-arrow]", { x1: shape.loadX, x2: shape.loadX });
    setLine("[data-p34-effort-arrow]", { x1: shape.effortX, x2: shape.effortX });
    setLine("[data-p34-short-dimension]", { x1: shape.loadX });
    setLine("[data-p34-long-dimension]", { x2: shape.effortX });

    const stone = root.querySelector("[data-p34-stone]");
    if (stone) {
      stone.setAttribute("transform", `translate(${shape.loadX.toFixed(2)} 0)`);
      stone.setAttribute("class", `p34-stone ${lift ? "is-lifting" : ""}`);
    }
    const loadLabel = root.querySelector("[data-p34-load-label]");
    if (loadLabel) loadLabel.setAttribute("x", (shape.loadX + 14).toFixed(2));
    const effortLabel = root.querySelector("[data-p34-effort-label]");
    if (effortLabel) {
      effortLabel.setAttribute("x", (shape.effortX + 13).toFixed(2));
      effortLabel.textContent = `${format(totalEffort(), 1)} kN`;
    }
    const shortLabel = root.querySelector("[data-p34-short-label]");
    if (shortLabel) {
      shortLabel.setAttribute("x", ((shape.loadX + shape.fulcrumX) / 2).toFixed(2));
      shortLabel.textContent = `a = ${format(state.shortArm, 2)} m`;
    }
    const longLabel = root.querySelector("[data-p34-long-label]");
    if (longLabel) {
      longLabel.setAttribute("x", ((shape.fulcrumX + shape.effortX) / 2).toFixed(2));
      longLabel.textContent = `b = ${format(state.effortArm, 2)} m`;
    }
    const workers = root.querySelector("[data-p34-workers]");
    if (workers) workers.innerHTML = workerFigures(shape.effortX);
    const roller = root.querySelector("[data-p34-roller]");
    if (roller) {
      roller.setAttribute("transform", `translate(${(shape.loadX + 48).toFixed(2)} 296)`);
      roller.setAttribute("class", `p34-roller ${lift ? "is-ready" : ""}`);
    }
    const balance = root.querySelector("[data-p34-moment-balance]");
    if (balance) balance.classList.toggle("is-lifting", lift);
    const balanceTrack = root.querySelector("[data-p34-balance-track]");
    if (balanceTrack) {
      balanceTrack.setAttribute("aria-label", `Mover moment ${format(effortMoment(), 2)} out of the required ${format(loadMoment(), 2)} kilonewton metres`);
      balanceTrack.querySelector("i")?.style.setProperty("--p34-progress", `${Math.min(100, (effortMoment() / loadMoment()) * 100).toFixed(2)}%`);
    }
    const statusCard = root.querySelector("[data-p34-status-card]");
    if (statusCard) statusCard.className = lift ? "is-success" : "is-blocked";
    const description = root.querySelector("#p34-apparatus-desc");
    if (description) description.textContent = `The fulcrum is ${format(state.shortArm, 2)} metres from the stone and the movers push ${format(state.effortArm, 2)} metres from the fulcrum. ${state.workers} movers produce ${format(effortMoment(), 2)} kilonewton metres against the stone’s ${format(loadMoment(), 2)} kilonewton metres. The stone ${lift ? "can lift" : "does not lift"}.`;
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p34-preset"]').forEach((button) => {
      const active = Number(button.dataset.p34Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelector(".p34-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseDistance(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".").replace(/\s*m$/, "");
    return normalized ? Number(normalized) : NaN;
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p34-shell");
    if (!root) return;

    root.querySelector("#p34-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p34-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        if (event.target.dataset.p34Slider === "short-arm") state.shortArm = clamp(event.target.value, 0.15, 0.6);
        if (event.target.dataset.p34Slider === "effort-arm") state.effortArm = clamp(event.target.value, 0.6, 2.4);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p34-reset") state = initialState();
        if (action === "p34-worker") {
          state.workers = Math.round(clamp(state.workers + Number(control.dataset.p34Delta), 1, 6));
          state.feedback = "";
          state.committed = false;
        }
        if (action === "p34-preset") {
          const preset = presets[Number(control.dataset.p34Preset)];
          if (preset) {
            state.shortArm = preset.shortArm;
            state.effortArm = preset.effortArm;
            state.workers = preset.workers;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p34-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p34-reveal") state.revealed = true;
        rerender();
        if (action === "p34-reveal") window.requestAnimationFrame(() => document.querySelector("#p34-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p34-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p34-answer")?.value || "";
      const estimate = parseDistance(raw);
      const exact = originalMinimumArm();
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive distance in metres.";
        state.feedbackTone = "warn";
      } else if (estimate > 2.4) {
        state.feedback = "That lies beyond the 2.4 m effort-arm range in this model.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.02) {
          state.feedback = "Exactly. At 1.50 m the clockwise and anticlockwise moments are both 7.2 kN·m.";
          state.feedbackTone = "success";
          state.shortArm = ORIGINAL_SHORT_ARM;
          state.effortArm = exact;
          state.workers = ORIGINAL_WORKERS;
        } else if (estimate > exact) {
          state.feedback = "That handle length would lift the stone, but it is longer than the minimum required.";
        } else {
          state.feedback = "That is too short: 4.8b is still less than the stone’s 7.2 kN·m moment.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p34-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
