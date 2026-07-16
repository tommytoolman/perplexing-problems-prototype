(function registerSewageWorkersConundrumPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const LENGTH = 4;
  const SUPPORT_A = 0;
  const SUPPORT_B = 3;
  const POSITION_STEP = 0.05;
  const DRAWING_LEFT = 70;
  const DRAWING_SCALE = 140;
  const PLANK_Y = 170;
  const hints = Object.freeze([
    "While both supports touch the plank, their upward reactions Rₐ and Rᵦ balance the two downward weights.",
    "At the first instant of tipping, the plank is about to pivot around B and the reaction at A has fallen to zero.",
    "Take moments about B. The plank's weight acts at its centre, one metre to the left of B; the worker acts x−3 metres to its right.",
    "At tipping, W(x−B)=P(B−L/2). Rearrange this equation for x.",
  ]);
  const stages = Object.freeze([
    { label: "1. Loads", title: "Place the worker", copy: "The uniform plank's own weight acts at its midpoint. The worker's weight acts wherever he stands." },
    { label: "2. Reactions", title: "Let the supports respond", copy: "A and B share the total load. Walking right increases Rᵦ and unloads A." },
    { label: "3. Tipping", title: "Find the lost contact", copy: "The threshold arrives when A would need to pull down. A simple support cannot, so the plank pivots about B." },
  ]);
  const loadPresets = Object.freeze({
    standard: { label: "Standard", workerWeight: 800, plankWeight: 200 },
    light: { label: "Light worker", workerWeight: 500, plankWeight: 200 },
    heavy: { label: "Heavy worker", workerWeight: 1200, plankWeight: 200 },
  });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p31-reset">Reset</button>';

  const initialState = () => ({
    workerWeight: 800,
    plankWeight: 200,
    workerPosition: 2.8,
    stage: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "is-neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function totalWeight() {
    return state.workerWeight + state.plankWeight;
  }

  function reactionB(x = state.workerPosition) {
    return (state.workerWeight * x + state.plankWeight * LENGTH / 2) / SUPPORT_B;
  }

  function reactionA(x = state.workerPosition) {
    return totalWeight() - reactionB(x);
  }

  function tippingPosition() {
    return SUPPORT_B + state.plankWeight * (SUPPORT_B - LENGTH / 2) / state.workerWeight;
  }

  function stability(x = state.workerPosition) {
    const difference = x - tippingPosition();
    if (Math.abs(difference) <= 0.015) return "threshold";
    return difference < 0 ? "stable" : "tipping";
  }

  function stabilityCopy(kind = stability()) {
    if (kind === "stable") return "Stable · both supports are loaded";
    if (kind === "threshold") return "Threshold · Rₐ = 0";
    return "Tips about B · A cannot pull downward";
  }

  function activeLoadPreset() {
    return Object.entries(loadPresets).find(([, preset]) => preset.workerWeight === state.workerWeight && preset.plankWeight === state.plankWeight)?.[0] || "";
  }

  function drawingX(position) {
    return DRAWING_LEFT + position * DRAWING_SCALE;
  }

  function reactionLength(value) {
    return 30 + clamp(Math.abs(value) / Math.max(totalWeight(), 1), 0, 1.35) * 68;
  }

  function loadArrowsMarkup() {
    if (state.stage < 1) return "";
    const workerX = drawingX(state.workerPosition);
    const centreX = drawingX(LENGTH / 2);
    const a = reactionA();
    const b = reactionB();
    const aEndY = a >= 0 ? PLANK_Y - reactionLength(a) : PLANK_Y + reactionLength(a);
    const bEndY = PLANK_Y - reactionLength(b);
    return `
      <g class="p31-force-arrows" aria-hidden="true">
        <line class="p31-load-arrow" data-p31-worker-load x1="${workerX}" y1="62" x2="${workerX}" y2="150" marker-end="url(#p31-arrow-down)" />
        <text class="p31-force-label" data-p31-worker-label x="${workerX + 8}" y="78">W = ${format(state.workerWeight, 0)} N</text>
        <line class="p31-load-arrow is-plank" x1="${centreX}" y1="92" x2="${centreX}" y2="153" marker-end="url(#p31-arrow-down)" />
        <text class="p31-force-label" x="${centreX + 8}" y="105">P = ${format(state.plankWeight, 0)} N</text>
        <line class="p31-reaction-arrow ${a < 0 ? "is-impossible" : ""}" data-p31-reaction-a x1="${drawingX(SUPPORT_A)}" y1="${PLANK_Y}" x2="${drawingX(SUPPORT_A)}" y2="${aEndY.toFixed(2)}" marker-end="url(#${a < 0 ? "p31-arrow-down-red" : "p31-arrow-up"})" />
        <text class="p31-reaction-label ${a < 0 ? "is-impossible" : ""}" data-p31-reaction-a-label x="${drawingX(SUPPORT_A) + 9}" y="${Math.max(54, aEndY - 6).toFixed(2)}">Rₐ = ${format(a, 1)} N</text>
        <line class="p31-reaction-arrow" data-p31-reaction-b x1="${drawingX(SUPPORT_B)}" y1="${PLANK_Y}" x2="${drawingX(SUPPORT_B)}" y2="${bEndY.toFixed(2)}" marker-end="url(#p31-arrow-up)" />
        <text class="p31-reaction-label" data-p31-reaction-b-label x="${drawingX(SUPPORT_B) + 9}" y="${Math.max(54, bEndY - 6).toFixed(2)}">Rᵦ = ${format(b, 1)} N</text>
      </g>`;
  }

  function momentsMarkup() {
    if (state.stage < 2) return "";
    return `
      <g class="p31-moment-layer" aria-hidden="true">
        <path d="M${drawingX(SUPPORT_B) - 52} 239 A58 58 0 0 1 ${drawingX(SUPPORT_B) + 49} 229" marker-end="url(#p31-arrow-moment)" />
        <text x="${drawingX(SUPPORT_B) - 4}" y="260" text-anchor="middle">moments about B</text>
        <line x1="${drawingX(LENGTH / 2)}" y1="218" x2="${drawingX(SUPPORT_B)}" y2="218" />
        <text x="${drawingX(2.5)}" y="211" text-anchor="middle">B − L/2</text>
        <line data-p31-worker-arm x1="${drawingX(SUPPORT_B)}" y1="280" x2="${drawingX(state.workerPosition)}" y2="280" />
        <text data-p31-worker-arm-label x="${drawingX((SUPPORT_B + state.workerPosition) / 2)}" y="274" text-anchor="middle">x − B</text>
      </g>`;
  }

  function plankSvg() {
    const workerX = drawingX(state.workerPosition);
    const kind = stability();
    return `
      <svg class="p31-plank-svg is-${kind}" viewBox="0 0 700 340" role="img" aria-labelledby="p31-svg-title p31-svg-desc">
        <title id="p31-svg-title">A worker standing on an overhanging maintenance plank</title>
        <desc id="p31-svg-desc" data-p31-svg-desc>The worker stands ${format(state.workerPosition)} metres from A. Reaction A is ${format(reactionA(), 1)} newtons and reaction B is ${format(reactionB(), 1)} newtons. ${stabilityCopy(kind)}.</desc>
        <defs>
          <marker id="p31-arrow-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          <marker id="p31-arrow-up" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          <marker id="p31-arrow-down-red" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          <marker id="p31-arrow-moment" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          <pattern id="p31-plank-grain" width="18" height="8" patternUnits="userSpaceOnUse"><path d="M0 4c5-4 12 4 18 0" /></pattern>
        </defs>
        <path class="p31-sewer" d="M28 205H70v78h560v-78h42v106H28Z" />
        <path class="p31-water" d="M72 285c35-11 70 11 105 0s70 11 105 0 70 11 105 0 70 11 105 0 70 11 105 0h31v27H72Z" />
        <rect class="p31-plank" x="${drawingX(0)}" y="${PLANK_Y - 9}" width="${LENGTH * DRAWING_SCALE}" height="18" rx="3" />
        <g class="p31-support is-a" transform="translate(${drawingX(SUPPORT_A)} ${PLANK_Y + 9})"><path d="m0 0-20 35h40Z" /><text y="53" text-anchor="middle">A · 0 m</text></g>
        <g class="p31-support is-b" transform="translate(${drawingX(SUPPORT_B)} ${PLANK_Y + 9})"><path d="m0 0-20 35h40Z" /><text y="53" text-anchor="middle">B · 3 m</text></g>
        <line class="p31-overhang-bracket" x1="${drawingX(SUPPORT_B)}" y1="324" x2="${drawingX(LENGTH)}" y2="324" /><text class="p31-overhang-label" x="${drawingX(3.5)}" y="318" text-anchor="middle">1 m overhang</text>
        <g class="p31-worker" data-p31-worker transform="translate(${workerX} 0)" aria-hidden="true"><circle cx="0" cy="91" r="13" /><path d="M0 104v37m-19-23L0 111l21 15M0 141l-18 24m18-24 18 24" /><text x="0" y="57" text-anchor="middle">worker</text></g>
        ${loadArrowsMarkup()}
        ${momentsMarkup()}
        <g class="p31-dimensions" aria-hidden="true"><line x1="${drawingX(0)}" y1="29" x2="${drawingX(LENGTH)}" y2="29" /><text x="${drawingX(2)}" y="22" text-anchor="middle">uniform plank · L = 4 m</text><line data-p31-position-line x1="${drawingX(0)}" y1="315" x2="${workerX}" y2="315" /><text data-p31-position-label x="${drawingX(state.workerPosition / 2)}" y="307" text-anchor="middle">x = ${format(state.workerPosition)} m</text></g>
      </svg>`;
  }

  function sliderProgress() {
    return (state.workerPosition / LENGTH) * 100;
  }

  function positionSlider() {
    return `
      <div class="p31-position-control">
        <div class="p31-control-label" id="p31-position-label"><span>Worker position from A</span><output data-p31-live="position">${format(state.workerPosition)} m</output></div>
        <div class="drag-slider p31-drag-slider" data-p31-slider role="slider" tabindex="0" aria-labelledby="p31-position-label" aria-valuemin="0" aria-valuemax="${LENGTH}" aria-valuenow="${format(state.workerPosition)}" aria-valuetext="Worker ${format(state.workerPosition)} metres from A; ${stabilityCopy()}" style="--slider-progress:${sliderProgress().toFixed(3)}%"><span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span></div>
        <div class="slider-labels"><span>A · 0 m</span><span>B · 3 m</span><span>end · 4 m</span></div>
        <div class="p31-position-presets" aria-label="Worker position presets"><button class="chip-button math2-chip" type="button" data-problem-action="p31-position" data-p31-position="2">Plank centre</button><button class="chip-button math2-chip" type="button" data-problem-action="p31-position" data-p31-position="3">At support B</button>${state.revealed ? `<button class="chip-button math2-chip" type="button" data-problem-action="p31-position" data-p31-position="${tippingPosition()}">Tipping point</button>` : ""}<button class="chip-button math2-chip" type="button" data-problem-action="p31-position" data-p31-position="4">Far end</button></div>
      </div>`;
  }

  function weightStepper(key, label, minimum, maximum, step) {
    const value = state[key];
    return `<div class="p31-stepper"><span>${label}</span><div><button type="button" data-problem-action="p31-weight" data-p31-key="${key}" data-p31-delta="-${step}" aria-label="Decrease ${label}" ${value <= minimum ? "disabled" : ""}>−</button><strong>${format(value, 0)} N</strong><button type="button" data-problem-action="p31-weight" data-p31-key="${key}" data-p31-delta="${step}" aria-label="Increase ${label}" ${value >= maximum ? "disabled" : ""}>+</button></div></div>`;
  }

  function stageControls() {
    return `<div class="p31-stage-tabs" role="group" aria-label="Statics stages">${stages.map((stage, index) => `<button class="chip-button math2-chip ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p31-stage" data-p31-stage="${index}" aria-pressed="${state.stage === index}">${stage.label}</button>`).join("")}</div>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p31-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p31-solution" aria-labelledby="p31-solution-title">
        <h3 id="p31-solution-title" tabindex="-1">Tipping begins when support A unloads</h3>
        <p>Before tipping, vertical equilibrium and moments about A give</p>
        <div class="math2-equation">Rₐ + Rᵦ = W + P, &nbsp; RᵦB = Wx + P(L/2).</div>
        <p>At the threshold (Rₐ=0). Equivalently, balance the worker's clockwise moment against the plank's anticlockwise moment about B:</p>
        <div class="math2-equation">W(x−B) = P(B−L/2).</div>
        <div class="math2-equation p31-final-equation">x<sub>tip</sub> = B + P(B−L/2)/W = 3 + <span data-p31-live="plank-weight">${format(state.plankWeight, 0)}</span>·1/<span data-p31-live="worker-weight">${format(state.workerWeight, 0)}</span> = <span data-p31-live="tip-position">${format(tippingPosition(), 3)}</span> m.</div>
        <p>Beyond that point the two-support equations demand (Rₐ&lt;0). A simple support cannot pull the plank downward, so contact at A is lost and the plank rotates about B.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: "3.1",
      provenance: "independently reconstructed from title and introductory difficulty only",
      geometry: { plankLengthMetres: LENGTH, supportA: SUPPORT_A, supportB: SUPPORT_B, overhangMetres: LENGTH - SUPPORT_B },
      loadsNewtons: { worker: state.workerWeight, plank: state.plankWeight },
      workerPositionMetres: state.workerPosition,
      reactionsNewtons: { A: reactionA(), B: reactionB() },
      stability: stability(),
      tippingPositionMetres: tippingPosition(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const stage = stages[state.stage];
    const activePreset = activeLoadPreset();
    const kind = stability();
    return `
      <main class="book-shell math2-shell p31-shell">
        ${warning()}
        <header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div><div class="book-progress">${problemProgress("3.1")}</div>${problemHeaderActions("3.1", resetMarkup)}</header>
        <div class="book-spread math2-spread p31-spread">
          <article class="book-page p31-problem-page">
            <div class="problem-number">Problem 3.1</div>
            <h1 class="book-title math2-title p31-title">Sewage worker's conundrum</h1>
            <div class="difficulty" aria-label="Introductory difficulty">★</div>
            <p class="problem-copy">A uniform 4 m maintenance plank weighing 200 N rests on supports A and B, 3 m apart, leaving a 1 m overhang beyond B. An 800 N sewage worker walks onto the overhang. How far from A can he go before the plank begins to tip?</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — the recovered index gives only this title and an introductory difficulty marker. This scenario, wording and solution are original, not Povey’s text.</p>
            <section class="prediction-box"><div class="eyebrow">Before calculating</div><p>What physically changes at the instant the plank stops resting on both supports?</p></section>
            <div class="p31-load-presets" aria-label="Load presets">${Object.entries(loadPresets).map(([key, preset]) => `<button class="chip-button math2-chip ${activePreset === key ? "active" : ""}" type="button" data-problem-action="p31-load-preset" data-p31-preset="${key}" aria-pressed="${activePreset === key}">${preset.label}</button>`).join("")}</div>
          </article>

          <section class="book-page book-stage math2-stage p31-stage" aria-labelledby="p31-stage-title">
            <div class="math2-stage-card p31-stage-card">
              ${stageControls()}
              <div class="math2-stage-heading"><div><span class="eyebrow">${stage.label}</span><h2 id="p31-stage-title">${stage.title}</h2></div><p>${stage.copy}</p></div>
              <div class="p31-svg-wrap">${plankSvg()}</div>
              ${positionSlider()}
              <div class="p31-reaction-readout" aria-live="polite"><div><span>Reaction A</span><strong data-p31-live="reaction-a">${state.stage ? `${format(reactionA(), 1)} N` : "hidden"}</strong></div><div><span>Reaction B</span><strong data-p31-live="reaction-b">${state.stage ? `${format(reactionB(), 1)} N` : "hidden"}</strong></div><div class="is-${kind}" data-p31-status-card><span>Contact state</span><strong data-p31-live="status">${stabilityCopy(kind)}</strong></div></div>
              <div class="p31-weight-controls">${weightStepper("workerWeight", "Worker weight", 400, 1200, 100)}${weightStepper("plankWeight", "Plank weight", 100, 400, 50)}</div>
            </div>
          </section>

          <aside class="book-page book-coach p31-coach">
            <div class="coach-kicker">Locate the threshold</div>
            <p class="coach-question">At what distance x from A does the plank just begin to tip?</p>
            <form class="estimate-form p31-answer-form" data-p31-answer-form novalidate><label for="p31-answer">Tipping position</label><div class="estimate-field"><input class="estimate-input" id="p31-answer" inputmode="decimal" type="text" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 3.25" /><span>m from A</span></div><button class="primary-button" type="submit">Check position</button></form>
            ${feedbackMarkup()}
            <div class="button-row p31-help-row"><button class="secondary-button" type="button" data-problem-action="p31-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p31-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("3.1")}
      </main>`;
  }

  function setPosition(value, root) {
    state.workerPosition = Math.round(clamp(value, 0, LENGTH) / POSITION_STEP) * POSITION_STEP;
    updatePositionDom(root);
  }

  function updatePositionDom(root) {
    const workerX = drawingX(state.workerPosition);
    const kind = stability();
    const values = {
      position: `${format(state.workerPosition)} m`,
      "reaction-a": state.stage ? `${format(reactionA(), 1)} N` : "hidden",
      "reaction-b": state.stage ? `${format(reactionB(), 1)} N` : "hidden",
      status: stabilityCopy(kind),
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p31-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const slider = root.querySelector("[data-p31-slider]");
    if (slider) {
      slider.style.setProperty("--slider-progress", `${sliderProgress().toFixed(3)}%`);
      slider.setAttribute("aria-valuenow", format(state.workerPosition));
      slider.setAttribute("aria-valuetext", `Worker ${format(state.workerPosition)} metres from A; ${stabilityCopy(kind)}`);
    }
    const svg = root.querySelector(".p31-plank-svg");
    if (svg) svg.setAttribute("class", `p31-plank-svg is-${kind}`);
    const worker = root.querySelector("[data-p31-worker]");
    if (worker) worker.setAttribute("transform", `translate(${workerX} 0)`);
    const workerLoad = root.querySelector("[data-p31-worker-load]");
    if (workerLoad) {
      workerLoad.setAttribute("x1", workerX);
      workerLoad.setAttribute("x2", workerX);
    }
    const workerLabel = root.querySelector("[data-p31-worker-label]");
    if (workerLabel) workerLabel.setAttribute("x", workerX + 8);
    const positionLine = root.querySelector("[data-p31-position-line]");
    if (positionLine) positionLine.setAttribute("x2", workerX);
    const positionLabel = root.querySelector("[data-p31-position-label]");
    if (positionLabel) {
      positionLabel.setAttribute("x", drawingX(state.workerPosition / 2));
      positionLabel.textContent = `x = ${format(state.workerPosition)} m`;
    }
    const a = reactionA();
    const b = reactionB();
    const aEndY = a >= 0 ? PLANK_Y - reactionLength(a) : PLANK_Y + reactionLength(a);
    const bEndY = PLANK_Y - reactionLength(b);
    const reactionALine = root.querySelector("[data-p31-reaction-a]");
    if (reactionALine) {
      reactionALine.setAttribute("y2", aEndY.toFixed(2));
      reactionALine.setAttribute("class", `p31-reaction-arrow ${a < 0 ? "is-impossible" : ""}`);
      reactionALine.setAttribute("marker-end", `url(#${a < 0 ? "p31-arrow-down-red" : "p31-arrow-up"})`);
    }
    const reactionBLine = root.querySelector("[data-p31-reaction-b]");
    if (reactionBLine) reactionBLine.setAttribute("y2", bEndY.toFixed(2));
    const aLabel = root.querySelector("[data-p31-reaction-a-label]");
    if (aLabel) {
      aLabel.textContent = `Rₐ = ${format(a, 1)} N`;
      aLabel.setAttribute("y", (a >= 0 ? Math.max(54, aEndY - 6) : Math.min(292, aEndY + 16)).toFixed(2));
      aLabel.setAttribute("class", `p31-reaction-label ${a < 0 ? "is-impossible" : ""}`);
    }
    const bLabel = root.querySelector("[data-p31-reaction-b-label]");
    if (bLabel) {
      bLabel.textContent = `Rᵦ = ${format(b, 1)} N`;
      bLabel.setAttribute("y", Math.max(54, bEndY - 6).toFixed(2));
    }
    const arm = root.querySelector("[data-p31-worker-arm]");
    if (arm) arm.setAttribute("x2", workerX);
    const armLabel = root.querySelector("[data-p31-worker-arm-label]");
    if (armLabel) armLabel.setAttribute("x", drawingX((SUPPORT_B + state.workerPosition) / 2));
    const statusCard = root.querySelector("[data-p31-status-card]");
    if (statusCard) statusCard.className = `is-${kind}`;
    const description = root.querySelector("[data-p31-svg-desc]");
    if (description) description.textContent = `The worker stands ${format(state.workerPosition)} metres from A. Reaction A is ${format(a, 1)} newtons and reaction B is ${format(b, 1)} newtons. ${stabilityCopy(kind)}.`;
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function setPositionFromPointer(event, slider, root) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const progress = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setPosition(progress * LENGTH, root);
  }

  function parseEstimate(raw) {
    const normalized = String(raw).trim().replaceAll(",", "");
    return normalized === "" ? NaN : Number(normalized);
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p31-shell");
    if (!root) return;
    root.querySelector("#p31-answer")?.addEventListener("input", (event) => { state.estimate = event.target.value; });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p31-reset") state = initialState();
        if (action === "p31-stage") {
          state.stage = Math.round(clamp(control.dataset.p31Stage, 0, 2));
          focusSelector = `[data-problem-action="p31-stage"][data-p31-stage="${state.stage}"]`;
        }
        if (action === "p31-position") {
          state.workerPosition = Math.round(clamp(control.dataset.p31Position, 0, LENGTH) / POSITION_STEP) * POSITION_STEP;
          focusSelector = `[data-problem-action="p31-position"][data-p31-position="${control.dataset.p31Position}"]`;
        }
        if (action === "p31-load-preset") {
          const preset = loadPresets[control.dataset.p31Preset];
          if (preset) {
            state.workerWeight = preset.workerWeight;
            state.plankWeight = preset.plankWeight;
            state.estimate = "";
            state.feedback = "";
            state.committed = false;
          }
          focusSelector = `[data-problem-action="p31-load-preset"][data-p31-preset="${control.dataset.p31Preset}"]`;
        }
        if (action === "p31-weight") {
          const key = control.dataset.p31Key;
          const limits = key === "workerWeight" ? [400, 1200] : [100, 400];
          state[key] = clamp(state[key] + Number(control.dataset.p31Delta), limits[0], limits[1]);
          state.estimate = "";
          state.feedback = "";
          state.committed = false;
          focusSelector = `[data-problem-action="p31-weight"][data-p31-key="${key}"][data-p31-delta="${control.dataset.p31Delta}"]`;
        }
        if (action === "p31-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          state.stage = Math.max(state.stage, Math.min(2, state.hintsUsed));
          focusSelector = '[data-problem-action="p31-hint"]';
        }
        if (action === "p31-reveal") {
          state.revealed = true;
          state.stage = 2;
          state.workerPosition = tippingPosition();
        }
        rerender();
        if (action === "p31-reveal") focusAfterRender("#p31-solution-title");
        else if (focusSelector) focusAfterRender(focusSelector);
      });
    });

    const slider = root.querySelector("[data-p31-slider]");
    if (slider) {
      slider.addEventListener("pointerdown", (event) => { event.preventDefault(); slider.focus(); slider.setPointerCapture(event.pointerId); setPositionFromPointer(event, slider, root); });
      slider.addEventListener("pointermove", (event) => { if (slider.hasPointerCapture(event.pointerId)) setPositionFromPointer(event, slider, root); });
      slider.addEventListener("pointerup", (event) => { setPositionFromPointer(event, slider, root); if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId); });
      slider.addEventListener("pointercancel", (event) => { if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId); });
      slider.addEventListener("keydown", (event) => {
        const step = event.shiftKey ? 0.25 : POSITION_STEP;
        let next = state.workerPosition;
        if (["ArrowLeft", "ArrowDown"].includes(event.key)) next -= step;
        else if (["ArrowRight", "ArrowUp"].includes(event.key)) next += step;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = LENGTH;
        else return;
        event.preventDefault();
        setPosition(next, root);
      });
    }

    root.querySelector("[data-p31-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p31-answer")?.value || "";
      const estimate = parseEstimate(raw);
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "is-neutral";
      if (!Number.isFinite(estimate) || estimate < 0 || estimate > LENGTH) {
        state.feedback = `Enter a position from 0 to ${LENGTH} metres.`;
        state.feedbackTone = "is-warn";
      } else {
        state.committed = true;
        const difference = estimate - tippingPosition();
        if (Math.abs(difference) <= 0.03) {
          state.feedback = `Exactly. At x = ${format(tippingPosition(), 3)} m, reaction A reaches zero and B becomes the pivot.`;
          state.feedbackTone = "is-success";
          state.stage = Math.max(state.stage, 1);
          state.workerPosition = tippingPosition();
        } else if (Math.abs(estimate - SUPPORT_B) <= 0.03) {
          state.feedback = "Reaching B is not yet enough to tip: the plank's own weight acts to the left of B and provides a restoring moment.";
        } else {
          state.feedback = `That is ${difference < 0 ? "before" : "beyond"} the threshold. Balance moments about support B.`;
        }
      }
      rerender();
      focusAfterRender("#p31-answer");
    });
  }

  window.poveyProblemPages["3.1"] = { render, bind };
}());
