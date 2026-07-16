(function registerHardishFencingPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const FENCE_LENGTH = 100;
  const LOG_RATIO_MIN = -2;
  const LOG_RATIO_MAX = 2;
  const LOG_RATIO_STEP = 0.05;
  const SQRT_TWO = Math.sqrt(2);
  const OPTIMAL_SIDE = FENCE_LENGTH / (4 + SQRT_TWO);
  const MAX_AREA = OPTIMAL_SIDE ** 2;
  const DRAW_SCALE = 10.5;
  const VIEW = Object.freeze({ width: 640, height: 390, centreX: 320, centreY: 188 });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p117-reset">Reset</button>';

  const hints = [
    "Try reflecting your rectangle across the line x=y. Swapping x and y does not change either the fence used or the area.",
    "Suppose the area A=xy were fixed. Then x+y is at least 2√A, with equality only when x=y.",
    "The diagonal also has a lower bound: √(x²+y²) is at least √(2xy)=√(2A).",
    "Combine those bounds: P≥4√A+√(2A)=(4+√2)√A. Now solve for A and inspect the equality conditions.",
  ];

  const initialState = () => ({
    logRatio: 1,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();
  let activeSliderPointer = null;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function measurements(logRatio = state.logRatio) {
    const normalizedLogRatio = clamp(logRatio, LOG_RATIO_MIN, LOG_RATIO_MAX);
    const ratio = 2 ** normalizedLogRatio;
    const y = FENCE_LENGTH / ((2 * ratio) + 2 + Math.sqrt((ratio ** 2) + 1));
    const x = ratio * y;
    const diagonal = Math.hypot(x, y);
    const fenceUsed = (2 * x) + (2 * y) + diagonal;
    const area = x * y;
    const areaFraction = area / MAX_AREA;
    return {
      logRatio: normalizedLogRatio,
      ratio,
      x,
      y,
      diagonal,
      fenceUsed,
      area,
      areaFraction,
      areaGap: MAX_AREA - area,
    };
  }

  function visualGeometry(values = measurements()) {
    const width = values.x * DRAW_SCALE;
    const height = values.y * DRAW_SCALE;
    return {
      x: VIEW.centreX - (width / 2),
      y: VIEW.centreY - (height / 2),
      width,
      height,
    };
  }

  function ratioLabel(values = measurements()) {
    if (Math.abs(values.logRatio) < 0.001) return "1 : 1";
    if (values.ratio >= 1) return `${format(values.ratio, values.ratio >= 3 ? 1 : 2)} : 1`;
    return `1 : ${format(1 / values.ratio, (1 / values.ratio) >= 3 ? 1 : 2)}`;
  }

  function rectangleDescription(values = measurements()) {
    return `A rectangle ${format(values.x)} metres by ${format(values.y)} metres with a straight diagonal partition of length ${format(values.diagonal)} metres. The outside edges and diagonal use ${format(values.fenceUsed, 3)} metres of fence. Its area is ${format(values.area)} square metres, ${format(values.areaFraction * 100, 1)} percent of the maximum.`;
  }

  function enclosureSvg() {
    const values = measurements();
    const box = visualGeometry(values);
    return `
      <svg class="route-svg p117-enclosure" data-p117-enclosure viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-labelledby="p117-enclosure-title" aria-describedby="p117-enclosure-desc">
        <title id="p117-enclosure-title">Rectangular enclosure with a diagonal fence</title>
        <desc id="p117-enclosure-desc" data-p117-enclosure-desc>${rectangleDescription(values)}</desc>
        <defs>
          <pattern id="p117-grass-pattern" width="18" height="18" patternUnits="userSpaceOnUse">
            <rect width="18" height="18" fill="#e8f1d6" />
            <path d="M3 18 Q5 12 7 18 M12 18 Q13 10 15 18" fill="none" stroke="#b5cf9a" stroke-width="1.4" />
          </pattern>
          <filter id="p117-fence-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#17233f" flood-opacity="0.2" />
          </filter>
        </defs>
        <rect class="p117-field" x="16" y="14" width="608" height="350" rx="22" />
        <g class="p117-enclosure-shape" filter="url(#p117-fence-shadow)">
          <rect class="p117-pasture" data-p117-rectangle x="${format(box.x, 3)}" y="${format(box.y, 3)}" width="${format(box.width, 3)}" height="${format(box.height, 3)}" rx="3" />
          <line class="p117-diagonal" data-p117-diagonal x1="${format(box.x, 3)}" y1="${format(box.y + box.height, 3)}" x2="${format(box.x + box.width, 3)}" y2="${format(box.y, 3)}" />
        </g>
        <text class="p117-area-label" data-p117-area-label x="${format(VIEW.centreX, 3)}" y="${format(VIEW.centreY + 5, 3)}">A = ${format(values.area)} m²</text>
        <text class="p117-dimension-label" data-p117-x-label x="${format(VIEW.centreX, 3)}" y="${format(box.y + box.height + 28, 3)}">x = ${format(values.x)} m</text>
        <text class="p117-dimension-label" data-p117-y-label x="${format(box.x - 25, 3)}" y="${format(VIEW.centreY, 3)}" transform="rotate(-90 ${format(box.x - 25, 3)} ${format(VIEW.centreY, 3)})">y = ${format(values.y)} m</text>
        <g class="p117-fence-badge" aria-hidden="true">
          <rect x="430" y="28" width="164" height="49" rx="12" />
          <text x="512" y="48">fence used</text>
          <text data-p117-fence-badge x="512" y="66">${format(values.fenceUsed, 3)} / ${FENCE_LENGTH} m</text>
        </g>
        <g class="p117-legend" aria-hidden="true">
          <line x1="42" y1="335" x2="82" y2="335" />
          <text x="92" y="340">outside fence + diagonal partition</text>
        </g>
      </svg>`;
  }

  function aspectControl() {
    const values = measurements();
    const progress = ((state.logRatio - LOG_RATIO_MIN) / (LOG_RATIO_MAX - LOG_RATIO_MIN)) * 100;
    const presets = [
      { logRatio: -2, label: "1:4" },
      { logRatio: -1, label: "1:2" },
      { logRatio: 0, label: "1:1" },
      { logRatio: 1, label: "2:1" },
      { logRatio: 2, label: "4:1" },
    ];
    return `
      <section class="p117-aspect-control" aria-labelledby="p117-aspect-heading">
        <div class="p117-control-heading"><span id="p117-aspect-heading">Aspect ratio x : y</span><strong data-p117-live="ratio">${ratioLabel(values)}</strong></div>
        <div
          class="p117-aspect-slider"
          data-p117-aspect-slider
          role="slider"
          tabindex="0"
          aria-labelledby="p117-aspect-heading"
          aria-describedby="p117-aspect-help"
          aria-valuemin="0.25"
          aria-valuemax="4"
          aria-valuenow="${format(values.ratio, 3)}"
          aria-valuetext="x to y ratio ${ratioLabel(values)}; area ${format(values.area)} square metres"
          aria-orientation="horizontal"
          aria-keyshortcuts="ArrowLeft ArrowRight Home End"
          style="--p117-progress: ${progress}%"
        >
          <div class="p117-slider-track" aria-hidden="true"></div>
          <div class="p117-slider-ticks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="p117-slider-thumb" aria-hidden="true"><span data-p117-thumb-label>${ratioLabel(values)}</span></div>
        </div>
        <div class="p117-slider-labels"><span>tall · 1:4</span><strong>square</strong><span>wide · 4:1</span></div>
        <div class="p117-ratio-presets" aria-label="Aspect ratio presets">${presets.map((preset) => `
          <button class="chip-button p117-ratio-preset ${Math.abs(state.logRatio - preset.logRatio) < 0.001 ? "active" : ""}" type="button" data-problem-action="p117-ratio" data-p117-log-ratio="${preset.logRatio}" aria-pressed="${Math.abs(state.logRatio - preset.logRatio) < 0.001}">${preset.label}</button>`).join("")}</div>
        <p class="p117-control-help" id="p117-aspect-help">Drag or tap to change shape. The rectangle rescales automatically to keep P=100 m. With the control focused, use Arrow keys, Page Up/Down, Home, End, or 0 for a square.</p>
      </section>`;
  }

  function comparisonMarkup() {
    const values = measurements();
    const percentage = Math.max(0, Math.min(100, values.areaFraction * 100));
    const nearMaximum = values.areaFraction >= 0.9995;
    return `
      <section class="p117-comparison" aria-label="Current area compared with the global maximum">
        <div class="p117-comparison-heading"><div><span>Area comparison</span><strong data-p117-live="area-status">${nearMaximum ? "At the bound" : `${format(values.areaGap)} m² below the bound`}</strong></div><div class="p117-symmetry-note">swap x,y → same area</div></div>
        <div class="p117-area-row"><span>Current</span><div class="p117-area-track" aria-hidden="true"><i data-p117-area-bar style="width:${percentage}%"></i></div><strong data-p117-live="area">${format(values.area)} m²</strong></div>
        <div class="p117-area-row p117-area-row-bound"><span>Maximum</span><div class="p117-area-track" aria-hidden="true"><i></i></div><strong>${format(MAX_AREA)} m²</strong></div>
        <div class="p117-measurements" aria-live="polite">
          <div><small>side x</small><strong data-p117-live="x">${format(values.x)} m</strong></div>
          <div><small>side y</small><strong data-p117-live="y">${format(values.y)} m</strong></div>
          <div><small>diagonal</small><strong data-p117-live="diagonal">${format(values.diagonal)} m</strong></div>
          <div><small>fence P</small><strong data-p117-live="fence">${format(values.fenceUsed, 3)} m</strong></div>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p117-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p117-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p117-solution" aria-labelledby="p117-solution-heading">
        <h2 id="p117-solution-heading" tabindex="-1">The square is globally best</h2>
        <p>Let A=xy. For every positive pair x,y, the arithmetic-geometric mean inequality gives</p>
        <div class="equation">x+y ≥ 2√(xy) = 2√A.</div>
        <p>Also x²+y²≥2xy, so the diagonal obeys</p>
        <div class="equation">√(x²+y²) ≥ √(2A).</div>
        <p>Therefore every possible enclosure satisfies</p>
        <div class="equation">P = 2(x+y)+√(x²+y²) ≥ (4+√2)√A.</div>
        <p>Rearranging gives the global bound</p>
        <div class="equation p117-answer">A ≤ P²/(4+√2)².</div>
        <p>Both inequalities are equalities exactly when x=y. With P=100 m, the optimal square has side <strong>${format(OPTIMAL_SIDE, 3)} m</strong> and area <strong>${format(MAX_AREA, 3)} m²</strong>.</p>
      </section>
      <section class="p117-chapter-complete" aria-label="Chapter complete">
        <span>Chapter complete</span><strong>17 of 17 geometry problems reached</strong><p>There is no next problem in this chapter.</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = measurements();
    return JSON.stringify({
      problem: "1.17",
      reconstruction: true,
      fenceAvailable: FENCE_LENGTH,
      aspectRatioXOverY: Number(values.ratio.toFixed(9)),
      x: Number(values.x.toFixed(9)),
      y: Number(values.y.toFixed(9)),
      diagonal: Number(values.diagonal.toFixed(9)),
      fenceUsed: Number(values.fenceUsed.toFixed(9)),
      area: Number(values.area.toFixed(9)),
      globalMaximumArea: Number(MAX_AREA.toFixed(9)),
      areaAtReflectedAspect: Number(measurements(-state.logRatio).area.toFixed(9)),
      estimate: state.estimate === "" ? null : Number(state.estimate),
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
      chapterComplete: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p117-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p117-progress"><span></span></div></div>
          ${problemHeaderActions("1.17", resetMarkup)}
        </header>

        <div class="book-spread p117-spread">
          <article class="book-page p117-problem-page">
            <div class="problem-number">Problem 1.17</div>
            <h1 class="book-title p117-book-title">A hardish fencing problem</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <div class="p117-reconstruction-label">Reconstructed activity</div>
            <p class="problem-copy">A rectangular enclosure has side lengths x and y. It needs fence around all four outside edges and along one straight diagonal partition. Exactly 100 metres of fence is available.</p>
            <p class="p117-question"><strong>What dimensions make the enclosed area as large as possible?</strong> Prove that your answer beats every other positive rectangle, not just nearby ones.</p>
            <aside class="p117-source-note" aria-label="Reconstruction note">
              <strong>Source note</strong>
              <p>The available sample ends after Problem 1.10. This independently written optimization uses only the listed 1.17 title and three-star rating; its setup, values, wording, interaction, and proof are not transcribed from the book.</p>
            </aside>
            <section class="prediction-box p117-prediction"><div class="eyebrow">Hold the budget fixed</div><p>Changing the ratio also changes both side lengths. Watch the fence readout: every candidate still uses exactly 100 m.</p></section>
          </article>

          <section class="book-page book-stage p117-stage">
            ${enclosureSvg()}
            ${aspectControl()}
            ${comparisonMarkup()}
          </section>

          <aside class="book-page book-coach p117-coach">
            <div class="coach-kicker">Estimate the best area</div>
            <p class="coach-question">How many square metres can 100 m of fence enclose when the diagonal is compulsory?</p>
            <form class="estimate-form p117-estimate-form" data-p117-estimate-form novalidate>
              <label for="p117-estimate">Your maximum-area estimate</label>
              <div class="estimate-field"><input id="p117-estimate" class="estimate-input" data-p117-estimate-input inputmode="decimal" type="number" min="0" max="500" step="0.1" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 340" /><span>m²</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row p117-help-row">
              <button class="secondary-button" type="button" data-problem-action="p117-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p117-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Problem 1.17 development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.17")}
      </main>`;
  }

  function setLogRatio(value) {
    state.logRatio = clamp(value, LOG_RATIO_MIN, LOG_RATIO_MAX);
  }

  function setText(root, selector, value) {
    root.querySelectorAll(selector).forEach((node) => { node.textContent = String(value); });
  }

  function setAttributes(root, selector, attributes) {
    root.querySelectorAll(selector).forEach((node) => {
      Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
    });
  }

  function updateLiveDom() {
    const root = document.querySelector(".p117-book-shell");
    if (!root) return;
    const values = measurements();
    const box = visualGeometry(values);
    const ratio = ratioLabel(values);
    const percentage = Math.max(0, Math.min(100, values.areaFraction * 100));
    const progress = ((state.logRatio - LOG_RATIO_MIN) / (LOG_RATIO_MAX - LOG_RATIO_MIN)) * 100;
    const nearMaximum = values.areaFraction >= 0.9995;

    setAttributes(root, "[data-p117-rectangle]", { x: format(box.x, 3), y: format(box.y, 3), width: format(box.width, 3), height: format(box.height, 3) });
    setAttributes(root, "[data-p117-diagonal]", { x1: format(box.x, 3), y1: format(box.y + box.height, 3), x2: format(box.x + box.width, 3), y2: format(box.y, 3) });
    setAttributes(root, "[data-p117-area-label]", { x: VIEW.centreX, y: VIEW.centreY + 5 });
    setAttributes(root, "[data-p117-x-label]", { x: VIEW.centreX, y: format(box.y + box.height + 28, 3) });
    setAttributes(root, "[data-p117-y-label]", { x: format(box.x - 25, 3), y: VIEW.centreY, transform: `rotate(-90 ${format(box.x - 25, 3)} ${VIEW.centreY})` });
    setText(root, "[data-p117-area-label]", `A = ${format(values.area)} m²`);
    setText(root, "[data-p117-x-label]", `x = ${format(values.x)} m`);
    setText(root, "[data-p117-y-label]", `y = ${format(values.y)} m`);
    setText(root, "[data-p117-fence-badge]", `${format(values.fenceUsed, 3)} / ${FENCE_LENGTH} m`);
    setText(root, "[data-p117-enclosure-desc]", rectangleDescription(values));
    setText(root, '[data-p117-live="ratio"]', ratio);
    setText(root, '[data-p117-live="x"]', `${format(values.x)} m`);
    setText(root, '[data-p117-live="y"]', `${format(values.y)} m`);
    setText(root, '[data-p117-live="diagonal"]', `${format(values.diagonal)} m`);
    setText(root, '[data-p117-live="fence"]', `${format(values.fenceUsed, 3)} m`);
    setText(root, '[data-p117-live="area"]', `${format(values.area)} m²`);
    setText(root, '[data-p117-live="area-status"]', nearMaximum ? "At the bound" : `${format(values.areaGap)} m² below the bound`);
    setText(root, "[data-p117-thumb-label]", ratio);

    const areaBar = root.querySelector("[data-p117-area-bar]");
    areaBar?.style.setProperty("width", `${percentage}%`);
    const slider = root.querySelector("[data-p117-aspect-slider]");
    slider?.style.setProperty("--p117-progress", `${progress}%`);
    slider?.setAttribute("aria-valuenow", format(values.ratio, 3));
    slider?.setAttribute("aria-valuetext", `x to y ratio ${ratio}; area ${format(values.area)} square metres`);

    root.querySelectorAll("[data-p117-log-ratio]").forEach((button) => {
      const active = Math.abs(Number(button.dataset.p117LogRatio) - state.logRatio) < 0.001;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setRatioFromPointer(event, slider) {
    const bounds = slider.getBoundingClientRect();
    const position = bounds.width ? clamp((event.clientX - bounds.left) / bounds.width, 0, 1) : 0;
    setLogRatio(LOG_RATIO_MIN + (position * (LOG_RATIO_MAX - LOG_RATIO_MIN)));
    updateLiveDom();
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p117-book-shell");
    if (!root) return;

    root.querySelectorAll('[data-problem-action^="p117-"]').forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p117-reset") state = initialState();
        if (action === "p117-ratio") setLogRatio(control.dataset.p117LogRatio);
        if (action === "p117-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p117-reveal") {
          state.revealed = true;
          setLogRatio(0);
        }
        renderApp();
        if (action === "p117-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p117-solution-heading")?.focus());
        }
      });
    });

    const estimateForm = root.querySelector("[data-p117-estimate-form]");
    const estimateInput = root.querySelector("[data-p117-estimate-input]");
    estimateInput?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.committed = false;
      state.feedback = "";
      state.feedbackTone = "";
    });
    estimateForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = estimateInput?.value.trim() ?? "";
      const estimate = Number(raw);
      state.estimate = raw;
      state.feedbackTone = "";
      if (!raw || !Number.isFinite(estimate) || estimate <= 0 || estimate > 500) {
        state.committed = false;
        state.feedback = "Enter a positive area no greater than 500 m² first.";
      } else {
        state.committed = true;
        const error = estimate - MAX_AREA;
        if (Math.abs(error) <= 1) {
          state.feedbackTone = "success";
          state.feedback = `Strong estimate - the exact maximum is ${format(MAX_AREA, 3)} m².`;
        } else if (Math.abs(estimate - measurements().area) <= 1 && measurements().areaFraction < 0.995) {
          state.feedback = "That matches your current rectangle, but it is not yet the maximum. Move toward x=y and watch the area grow.";
        } else if (error < 0) {
          state.feedback = "Your estimate is below the global maximum. Compare reflected ratios, then test the square.";
        } else {
          state.feedback = "That is above the possible bound. Use x+y≥2√(xy) and √(x²+y²)≥√(2xy).";
        }
      }
      renderAndFocus(renderApp, "[data-p117-estimate-input]");
    });

    const slider = root.querySelector("[data-p117-aspect-slider]");
    if (!slider) return;
    slider.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activeSliderPointer = event.pointerId;
      slider.setPointerCapture(event.pointerId);
      setRatioFromPointer(event, slider);
    });
    slider.addEventListener("pointermove", (event) => {
      if (activeSliderPointer === event.pointerId && slider.hasPointerCapture(event.pointerId)) setRatioFromPointer(event, slider);
    });
    slider.addEventListener("pointerup", (event) => {
      if (activeSliderPointer !== event.pointerId) return;
      setRatioFromPointer(event, slider);
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      activeSliderPointer = null;
      renderAndFocus(renderApp, "[data-p117-aspect-slider]");
    });
    slider.addEventListener("pointercancel", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      activeSliderPointer = null;
      renderAndFocus(renderApp, "[data-p117-aspect-slider]");
    });
    slider.addEventListener("keydown", (event) => {
      let next = state.logRatio;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next += LOG_RATIO_STEP;
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next -= LOG_RATIO_STEP;
      else if (event.key === "PageUp") next += 0.25;
      else if (event.key === "PageDown") next -= 0.25;
      else if (event.key === "Home") next = LOG_RATIO_MIN;
      else if (event.key === "End") next = LOG_RATIO_MAX;
      else if (event.key === "0") next = 0;
      else return;
      event.preventDefault();
      setLogRatio(next);
      renderAndFocus(renderApp, "[data-p117-aspect-slider]");
    });
  }

  window.poveyProblemPages["1.17"] = { render, bind };
}());
