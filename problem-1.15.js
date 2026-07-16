(function registerKochIslandPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const SQRT_THREE = Math.sqrt(3);
  const INITIAL_AREA = SQRT_THREE / 4;
  const MAX_ITERATION = 5;
  const VIEW = Object.freeze({ width: 640, height: 420, centreX: 320, centreY: 210, scale: 300 });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p115-reset">Reset</button>';

  const stages = [
    {
      label: "Build",
      title: "Replace every third with a bump",
      copy: "Each straight segment becomes four segments, each one third as long. Use the iteration control to watch that rule act recursively.",
      equation: "1 segment → 4 segments of length 1/3",
    },
    {
      label: "Measure",
      title: "Count the coast and the land separately",
      copy: "The boundary gains a factor 4/3 each round. The newly added triangles shrink quickly enough for the area increases to form a convergent series.",
      equation: "Pₙ = 3(4/3)ⁿ  ·  Aₙ/A₀ = 8/5 − (3/5)(4/9)ⁿ",
    },
    {
      label: "Limits",
      title: "Two measurements, opposite destinies",
      copy: "The perimeter has no finite ceiling, while the area approaches only 8/5 of the original triangle's area.",
      equation: "Pₙ → ∞  but  Aₙ → 2√3/5",
    },
  ];

  const hints = [
    "After one replacement, how many pieces stand where one piece stood? What fraction of the old length does each new piece have?",
    "There are Nₙ = 3·4ⁿ boundary segments and each has length 3⁻ⁿ. Multiply those two quantities.",
    "At step k, 3·4ᵏ⁻¹ new triangles are added. Each has area A₀/9ᵏ, so consecutive area additions have ratio 4/9.",
    "Sum A₀[1 + 1/3 + (1/3)(4/9) + …]. Because 4/9 is below 1, the bracket tends to 1 + (1/3)/(1 − 4/9) = 8/5.",
  ];

  const initialState = () => ({
    iteration: 1,
    stage: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();
  let activeSliderPointer = null;

  function clampInteger(value, minimum = 0, maximum = MAX_ITERATION) {
    return Math.max(minimum, Math.min(maximum, Math.round(Number(value))));
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function format(value, digits = 3) {
    return Number(value).toFixed(digits);
  }

  function trianglePoints() {
    return [
      { x: -0.5, y: -SQRT_THREE / 6 },
      { x: 0.5, y: -SQRT_THREE / 6 },
      { x: 0, y: SQRT_THREE / 3 },
    ];
  }

  function refineBoundary(points) {
    const refined = [];
    const cosine = 0.5;
    const sine = -SQRT_THREE / 2;

    points.forEach((start, index) => {
      const end = points[(index + 1) % points.length];
      const thirdX = (end.x - start.x) / 3;
      const thirdY = (end.y - start.y) / 3;
      const first = { x: start.x + thirdX, y: start.y + thirdY };
      const peak = {
        x: first.x + thirdX * cosine - thirdY * sine,
        y: first.y + thirdX * sine + thirdY * cosine,
      };
      refined.push(
        start,
        first,
        peak,
        { x: start.x + 2 * thirdX, y: start.y + 2 * thirdY },
      );
    });

    return refined;
  }

  function boundaryPoints(iteration = state.iteration) {
    let points = trianglePoints();
    for (let step = 0; step < iteration; step += 1) points = refineBoundary(points);
    return points;
  }

  function toSvg(point) {
    return {
      x: VIEW.centreX + point.x * VIEW.scale,
      y: VIEW.centreY - point.y * VIEW.scale,
    };
  }

  function boundaryPath(iteration = state.iteration) {
    return boundaryPoints(iteration)
      .map((point, index) => {
        const mapped = toSvg(point);
        return `${index ? "L" : "M"}${format(mapped.x, 3)} ${format(mapped.y, 3)}`;
      })
      .join(" ") + " Z";
  }

  function measurements(iteration = state.iteration) {
    const segments = 3 * (4 ** iteration);
    const denominator = 3 ** iteration;
    const segmentLength = 1 / denominator;
    const perimeter = 3 * ((4 / 3) ** iteration);
    const areaRatio = (8 / 5) - (3 / 5) * ((4 / 9) ** iteration);
    const area = INITIAL_AREA * areaRatio;
    return { segments, denominator, segmentLength, perimeter, areaRatio, area };
  }

  function segmentLengthLabel(iteration = state.iteration) {
    return iteration === 0 ? "1" : `1/${3 ** iteration}`;
  }

  function islandDescription(iteration = state.iteration) {
    const values = measurements(iteration);
    return `Koch snowflake iteration ${iteration}. The closed boundary has ${values.segments} equal segments, each length ${segmentLengthLabel(iteration)}, perimeter ${format(values.perimeter, 3)}, and area ${format(values.area, 3)} square units.`;
  }

  function islandSvg() {
    const values = measurements();
    return `
      <svg class="route-svg p115-island" data-p115-island viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-labelledby="p115-island-title" aria-describedby="p115-island-desc">
        <title id="p115-island-title" data-p115-island-title>Koch Island after iteration ${state.iteration}</title>
        <desc id="p115-island-desc" data-p115-island-desc>${islandDescription()}</desc>
        <defs>
          <linearGradient id="p115-sea-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#dff5f3" />
            <stop offset="1" stop-color="#aedbdc" />
          </linearGradient>
          <pattern id="p115-island-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
            <rect width="14" height="14" fill="#f6dda5" />
            <line x1="0" y1="0" x2="0" y2="14" stroke="#edca79" stroke-width="3" opacity="0.55" />
          </pattern>
        </defs>
        <rect class="p115-sea" x="8" y="8" width="624" height="404" rx="22" />
        <g class="p115-wave-lines" aria-hidden="true">
          <path d="M35 76 Q80 55 125 76 T215 76 T305 76" />
          <path d="M378 340 Q423 319 468 340 T558 340 T628 340" />
          <path d="M24 350 Q62 333 100 350 T176 350" />
          <path d="M470 73 Q507 56 544 73 T618 73" />
        </g>
        <path class="p115-island-fill" data-p115-boundary d="${boundaryPath()}" data-p115-segment-count="${values.segments}" />
        <g class="p115-scale-note" aria-hidden="true">
          <line x1="48" y1="388" x2="148" y2="388" />
          <line x1="48" y1="381" x2="48" y2="395" />
          <line x1="148" y1="381" x2="148" y2="395" />
          <text x="98" y="374">starting side = 1</text>
        </g>
        <g class="p115-iteration-badge" aria-hidden="true">
          <rect x="492" y="24" width="116" height="45" rx="12" />
          <text data-p115-live="iteration-badge" x="550" y="52">iteration ${state.iteration}</text>
        </g>
      </svg>`;
  }

  function presetButtons() {
    return `<div class="p115-presets" aria-label="Iteration presets">${Array.from({ length: MAX_ITERATION + 1 }, (_, iteration) => `
      <button class="chip-button p115-preset ${state.iteration === iteration ? "active" : ""}" type="button" data-problem-action="p115-iteration" data-p115-iteration="${iteration}" aria-pressed="${state.iteration === iteration}">${iteration}</button>`).join("")}</div>`;
  }

  function iterationControl() {
    const progress = (state.iteration / MAX_ITERATION) * 100;
    return `
      <div class="p115-iteration-control">
        <div class="p115-control-heading"><label id="p115-slider-label">Recursive iteration</label><strong data-p115-live="iteration">n = ${state.iteration}</strong></div>
        <div
          class="p115-slider"
          data-p115-slider
          role="slider"
          tabindex="0"
          aria-labelledby="p115-slider-label"
          aria-valuemin="0"
          aria-valuemax="${MAX_ITERATION}"
          aria-valuenow="${state.iteration}"
          aria-valuetext="Koch iteration ${state.iteration}"
          aria-orientation="horizontal"
          aria-describedby="p115-control-help"
          style="--p115-progress: ${progress}%"
        >
          <div class="p115-slider-track" aria-hidden="true"></div>
          <div class="p115-slider-fill" aria-hidden="true"></div>
          <div class="p115-slider-ticks" aria-hidden="true">${Array.from({ length: MAX_ITERATION + 1 }, (_, iteration) => `<i style="left: ${(iteration / MAX_ITERATION) * 100}%"></i>`).join("")}</div>
          <div class="p115-slider-thumb" aria-hidden="true"><span>${state.iteration}</span></div>
        </div>
        <div class="p115-slider-labels"><span>triangle</span><span>3,072 segments</span></div>
        ${presetButtons()}
        <p class="p115-control-help" id="p115-control-help">Drag or tap the scale. With it focused, use Arrow keys, Page Up/Down, Home, or End.</p>
      </div>`;
  }

  function stageControls() {
    return `<div class="p115-stage-controls" aria-label="Reasoning stages">${stages.map((stage, index) => `
      <button class="chip-button p115-stage-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p115-stage" data-p115-stage="${index}" ${state.stage === index ? 'aria-current="step"' : ""}><span>${index + 1}</span>${stage.label}</button>`).join("")}</div>`;
  }

  function comparisonMarkup() {
    const values = measurements();
    const perimeterScale = 3 * ((4 / 3) ** MAX_ITERATION);
    const perimeterWidth = (values.perimeter / perimeterScale) * 100;
    const areaWidth = (values.areaRatio / (8 / 5)) * 100;
    return `
      <section class="p115-comparison" aria-label="Perimeter and area comparison">
        <div class="p115-comparison-row">
          <div><span>Boundary</span><strong data-p115-live="perimeter">${format(values.perimeter, 3)}</strong></div>
          <div class="p115-growth-track" aria-hidden="true"><i class="p115-perimeter-bar" data-p115-bar="perimeter" style="width: ${perimeterWidth}%"></i></div>
          <small>keeps multiplying by 4/3</small>
        </div>
        <div class="p115-comparison-row">
          <div><span>Area</span><strong data-p115-live="area">${format(values.area, 3)}</strong></div>
          <div class="p115-growth-track" aria-hidden="true"><i class="p115-area-bar" data-p115-bar="area" style="width: ${areaWidth}%"></i></div>
          <small>approaches ${format(2 * SQRT_THREE / 5, 3)}</small>
        </div>
      </section>`;
  }

  function liveReadout() {
    const values = measurements();
    return `
      <div class="p115-readout" aria-live="polite">
        <div><small>Segments Nₙ</small><strong data-p115-live="segments">${values.segments.toLocaleString("en-GB")}</strong></div>
        <div><small>Each length</small><strong data-p115-live="segment-length">${segmentLengthLabel()}</strong></div>
        <div><small>Perimeter Pₙ</small><strong data-p115-live="perimeter-card">${format(values.perimeter, 3)}</strong></div>
        <div><small>Area Aₙ</small><strong data-p115-live="area-card">${format(values.area, 3)}</strong></div>
      </div>
      ${comparisonMarkup()}`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p115-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p115-solution" aria-labelledby="p115-solution-heading">
        <h2 id="p115-solution-heading" tabindex="-1">Finite land, endless boundary</h2>
        <p>After n rounds there are <strong>Nₙ = 3·4ⁿ</strong> segments, each of length <strong>3⁻ⁿ</strong>. Therefore</p>
        <div class="equation">Pₙ = (3·4ⁿ)(3⁻ⁿ) = 3(4/3)ⁿ → ∞.</div>
        <p>At step k, the new triangles add <strong>(A₀/3)(4/9)ᵏ⁻¹</strong>. Their total is a geometric series:</p>
        <div class="equation">Aₙ = A₀[8/5 − (3/5)(4/9)ⁿ].</div>
        <p>Since A₀ = √3/4, the limiting area is <strong>(8/5)A₀ = 2√3/5</strong>, about ${format(2 * SQRT_THREE / 5, 3)} square units.</p>
        <div class="p115-insight"><strong>The geometric surprise</strong><span>The coastline becomes infinitely long while the island still fits inside a finite area.</span></div>
      </section>`;
  }

  function stateSnapshot() {
    const values = measurements();
    return JSON.stringify({
      problem: "1.15",
      reconstruction: true,
      iteration: state.iteration,
      reasoningStage: state.stage + 1,
      segmentCount: values.segments,
      segmentLength: Number(values.segmentLength.toFixed(9)),
      perimeter: Number(values.perimeter.toFixed(9)),
      area: Number(values.area.toFixed(9)),
      areaOverA0: Number(values.areaRatio.toFixed(9)),
      estimateAreaMultiplier: state.estimate === "" ? null : Number(state.estimate),
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const stage = stages[state.stage];
    return `
      <main class="book-shell p115-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p115-progress"><span></span></div></div>
          ${problemHeaderActions("1.15", resetMarkup)}
        </header>

        <div class="book-spread p115-spread">
          <article class="book-page p115-problem-page">
            <div class="problem-number">Problem 1.15</div>
            <h1 class="book-title p115-book-title">The geometry of Koch Island</h1>
            <div class="difficulty" aria-label="Four star difficulty">★★★★</div>
            <div class="p115-reconstruction-label">Reconstructed activity</div>
            <p class="problem-copy">Begin with an equilateral triangle of side 1. On every straight piece, replace the middle third by the other two sides of an outward equilateral triangle. Repeat that rule on every new segment.</p>
            <p class="p115-question"><strong>What happens to the island's perimeter and area after n iterations?</strong> Decide whether each measurement grows without limit or approaches a finite value.</p>
            <aside class="p115-source-note" aria-label="Reconstruction note">
              <strong>Source note</strong>
              <p>The supplied and public sample stops after Problem 1.10. This normalized Koch-snowflake investigation is independently written from standard mathematics, guided only by the listed title and four-star rating; it is not transcribed from the book.</p>
            </aside>
            <section class="prediction-box p115-prediction">
              <div class="eyebrow">Make the paradox visible</div>
              <p>Move from n = 0 to n = 5. Watch the boundary and area readouts separately: more edge does not necessarily mean unbounded land.</p>
            </section>
          </article>

          <section class="book-page book-stage p115-stage">
            ${stageControls()}
            ${islandSvg()}
            ${iterationControl()}
            <div class="book-stage-caption p115-stage-caption" aria-live="polite">
              <div><div class="eyebrow">Reasoning stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
              <div class="p115-stage-equation">${stage.equation}</div>
            </div>
            ${liveReadout()}
          </section>

          <aside class="book-page book-coach p115-coach">
            <div class="coach-kicker">Estimate the ceiling</div>
            <p class="coach-question">As n grows, what multiple of the starting area A₀ does the island approach?</p>
            <form class="estimate-form p115-estimate-form" data-p115-estimate-form novalidate>
              <label for="p115-estimate">Your estimate for A∞ / A₀</label>
              <div class="estimate-field"><input id="p115-estimate" class="estimate-input" data-p115-estimate-input inputmode="decimal" type="number" min="1" max="2" step="0.01" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 1.5" /><span>× A₀</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row p115-help-row">
              <button class="secondary-button" type="button" data-problem-action="p115-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p115-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : state.stage < stages.length - 1 ? "Reveal next stage" : "Reveal solution"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Problem 1.15 development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.15")}
      </main>`;
  }

  function setIteration(value) {
    state.iteration = clampInteger(value);
  }

  function setText(root, selector, value) {
    root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  }

  function updateIterationDom() {
    const root = document.querySelector(".p115-book-shell");
    if (!root) return;
    const values = measurements();
    const boundary = root.querySelector("[data-p115-boundary]");
    boundary?.setAttribute("d", boundaryPath());
    boundary?.setAttribute("data-p115-segment-count", String(values.segments));
    setText(root, "[data-p115-island-title]", `Koch Island after iteration ${state.iteration}`);
    setText(root, "[data-p115-island-desc]", islandDescription());
    setText(root, '[data-p115-live="iteration"]', `n = ${state.iteration}`);
    setText(root, '[data-p115-live="iteration-badge"]', `iteration ${state.iteration}`);
    setText(root, '[data-p115-live="segments"]', values.segments.toLocaleString("en-GB"));
    setText(root, '[data-p115-live="segment-length"]', segmentLengthLabel());
    setText(root, '[data-p115-live="perimeter"]', format(values.perimeter, 3));
    setText(root, '[data-p115-live="perimeter-card"]', format(values.perimeter, 3));
    setText(root, '[data-p115-live="area"]', format(values.area, 3));
    setText(root, '[data-p115-live="area-card"]', format(values.area, 3));

    const slider = root.querySelector("[data-p115-slider]");
    slider?.style.setProperty("--p115-progress", `${(state.iteration / MAX_ITERATION) * 100}%`);
    slider?.setAttribute("aria-valuenow", String(state.iteration));
    slider?.setAttribute("aria-valuetext", `Koch iteration ${state.iteration}`);
    setText(root, ".p115-slider-thumb span", state.iteration);

    root.querySelectorAll("[data-p115-iteration]").forEach((button) => {
      const active = Number(button.dataset.p115Iteration) === state.iteration;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const perimeterBar = root.querySelector('[data-p115-bar="perimeter"]');
    const areaBar = root.querySelector('[data-p115-bar="area"]');
    perimeterBar?.style.setProperty("width", `${(values.perimeter / (3 * ((4 / 3) ** MAX_ITERATION))) * 100}%`);
    areaBar?.style.setProperty("width", `${(values.areaRatio / (8 / 5)) * 100}%`);
  }

  function setIterationFromPointer(event, slider) {
    const bounds = slider.getBoundingClientRect();
    const ratio = bounds.width ? (event.clientX - bounds.left) / bounds.width : 0;
    setIteration(ratio * MAX_ITERATION);
    updateIterationDom();
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p115-book-shell");
    if (!root) return;

    root.querySelectorAll('[data-problem-action^="p115-"]').forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p115-reset") state = initialState();
        if (action === "p115-iteration") setIteration(control.dataset.p115Iteration);
        if (action === "p115-stage") state.stage = clampInteger(control.dataset.p115Stage, 0, stages.length - 1);
        if (action === "p115-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p115-reveal") {
          if (state.stage < stages.length - 1) {
            state.stage += 1;
          } else {
            state.revealed = true;
            state.iteration = MAX_ITERATION;
          }
        }
        renderApp();
        if (action === "p115-reveal" && state.revealed) {
          window.requestAnimationFrame(() => document.querySelector("#p115-solution-heading")?.focus());
        }
      });
    });

    const estimateForm = root.querySelector("[data-p115-estimate-form]");
    const estimateInput = root.querySelector("[data-p115-estimate-input]");
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
      if (!raw || !Number.isFinite(estimate) || estimate < 1 || estimate > 2) {
        state.committed = false;
        state.feedback = "Enter a multiplier from 1 to 2 first.";
      } else {
        state.committed = true;
        if (Math.abs(estimate - 8 / 5) <= 0.03) {
          state.feedbackTone = "success";
          state.feedback = "Excellent estimate - the exact limiting multiplier is 8/5 = 1.6.";
        } else if (estimate < 8 / 5) {
          state.feedback = "That is below the limit. Include the original triangle and every later generation of smaller bumps.";
        } else {
          state.feedback = "That is above the limit. The added-area generations shrink by a factor of 4/9, so they settle quickly.";
        }
      }
      renderApp();
    });

    const slider = root.querySelector("[data-p115-slider]");
    if (!slider) return;
    slider.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activeSliderPointer = event.pointerId;
      slider.setPointerCapture(event.pointerId);
      setIterationFromPointer(event, slider);
    });
    slider.addEventListener("pointermove", (event) => {
      if (activeSliderPointer === event.pointerId && slider.hasPointerCapture(event.pointerId)) {
        setIterationFromPointer(event, slider);
      }
    });
    slider.addEventListener("pointerup", (event) => {
      if (activeSliderPointer !== event.pointerId) return;
      setIterationFromPointer(event, slider);
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      activeSliderPointer = null;
      renderApp();
      window.requestAnimationFrame(() => document.querySelector("[data-p115-slider]")?.focus());
    });
    slider.addEventListener("pointercancel", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      activeSliderPointer = null;
      renderApp();
      window.requestAnimationFrame(() => document.querySelector("[data-p115-slider]")?.focus());
    });
    slider.addEventListener("keydown", (event) => {
      let next = state.iteration;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next += 1;
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next -= 1;
      else if (event.key === "PageUp") next += 2;
      else if (event.key === "PageDown") next -= 2;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = MAX_ITERATION;
      else return;
      event.preventDefault();
      setIteration(next);
      renderApp();
      window.requestAnimationFrame(() => document.querySelector("[data-p115-slider]")?.focus());
    });
  }

  window.poveyProblemPages["1.15"] = { render, bind };
}());
