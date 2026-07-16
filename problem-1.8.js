window.poveyProblemPages = window.poveyProblemPages || {};

(function registerCircleWithinPolygonPage() {
  "use strict";

  const TARGET = 1 / 1000;
  const MIN_SIDES = 3;
  const MAX_SIDES = 80;
  const CENTRE_X = 230;
  const CENTRE_Y = 180;
  const INRADIUS = 105;

  const hints = [
    "Join the centre to every vertex and every tangency point. The polygon becomes 2n congruent right triangles.",
    "In one right triangle the angle at the centre is π/n. If the half-side is x, then tan(π/n) = x/r.",
    "The polygon area is 2n(xr/2) = nr² tan(π/n). Divide by πr² and subtract the circle.",
    "Use tan u ≈ u + u³/3 to locate the boundary, then check the neighbouring integers with the exact tangent expression.",
  ];

  const constructionStages = [
    {
      label: "See the excess",
      title: "Polygon minus circle",
      copy: "The hatched region is the area inside the regular polygon but outside its inscribed circle.",
    },
    {
      label: "Split 2n ways",
      title: "Make congruent right triangles",
      copy: "Lines to every vertex and tangency point divide the polygon into 2n equal right triangles.",
    },
    {
      label: "Read one wedge",
      title: "Turn the wedge into an area formula",
      copy: "One enlarged half-sector exposes r, the half-side x, and the angle π/n without exaggerating the real gap.",
    },
  ];

  const initialState = () => ({
    sides: 6,
    construction: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function excessRatio(sides = state.sides) {
    return (sides / Math.PI) * Math.tan(Math.PI / sides) - 1;
  }

  function passesTarget(sides = state.sides) {
    return excessRatio(sides) <= TARGET;
  }

  function clampSides(value) {
    return Math.max(MIN_SIDES, Math.min(MAX_SIDES, Math.round(Number(value))));
  }

  function setSides(value) {
    state.sides = clampSides(value);
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "";
  }

  function pointAt(radius, angle) {
    return {
      x: CENTRE_X + radius * Math.cos(angle),
      y: CENTRE_Y + radius * Math.sin(angle),
    };
  }

  function number(value, digits = 3) {
    return Number(value).toFixed(digits);
  }

  function percent(value = excessRatio()) {
    if (value >= 0.01) return `${number(value * 100, 3)}%`;
    return `${number(value * 100, 4)}%`;
  }

  function polygonVertices(sides = state.sides) {
    const outerRadius = INRADIUS / Math.cos(Math.PI / sides);
    return Array.from({ length: sides }, (_, index) => {
      const angle = -Math.PI / 2 + Math.PI / sides + (index * 2 * Math.PI) / sides;
      return pointAt(outerRadius, angle);
    });
  }

  function polygonPoints() {
    return polygonVertices().map(({ x, y }) => `${number(x)},${number(y)}`).join(" ");
  }

  function splitLinesMarkup() {
    if (state.construction < 1) return "";
    const vertices = polygonVertices();
    const vertexLines = vertices.map(({ x, y }) => (
      `<line class="p18-vertex-ray" x1="${CENTRE_X}" y1="${CENTRE_Y}" x2="${number(x)}" y2="${number(y)}" />`
    )).join("");
    const midpointLines = Array.from({ length: state.sides }, (_, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / state.sides;
      const midpoint = pointAt(INRADIUS, angle);
      return `<line class="p18-midpoint-ray" x1="${CENTRE_X}" y1="${CENTRE_Y}" x2="${number(midpoint.x)}" y2="${number(midpoint.y)}" />`;
    }).join("");
    return `<g class="p18-split-rays">${vertexLines}${midpointLines}</g>`;
  }

  function actualWedgeMarkup() {
    if (state.construction < 2) return "";
    const midpoint = pointAt(INRADIUS, -Math.PI / 2);
    const vertex = polygonVertices()[0];
    return `
      <path class="p18-actual-wedge" d="M${CENTRE_X} ${CENTRE_Y} L${number(midpoint.x)} ${number(midpoint.y)} L${number(vertex.x)} ${number(vertex.y)} Z" />
      <circle class="p18-wedge-anchor" cx="${number(vertex.x)}" cy="${number(vertex.y)}" r="5" />
      <path class="p18-callout-line" d="M${number(vertex.x + 6)} ${number(vertex.y - 2)} C${number(vertex.x + 42)} ${number(vertex.y - 25)}, 393 99, 417 106" />`;
  }

  function enlargedWedgeMarkup() {
    if (state.construction < 2) return "";
    return `
      <g class="p18-wedge-inset" aria-hidden="true">
        <rect x="408" y="76" width="216" height="252" rx="18" />
        <text class="p18-inset-kicker" x="428" y="103">ONE WEDGE · ENLARGED</text>
        <path class="p18-inset-fill" d="M438 292 L438 132 L586 132 Z" />
        <line x1="438" y1="292" x2="438" y2="132" />
        <line x1="438" y1="132" x2="586" y2="132" />
        <line x1="438" y1="292" x2="586" y2="132" />
        <path class="p18-right-angle" d="M438 148 H454 V132" />
        <path class="p18-theta-arc" d="M438 260 A32 32 0 0 1 459.8 268.6" />
        <text class="p18-wedge-label" x="420" y="216">r</text>
        <text class="p18-wedge-label" x="510" y="121">x</text>
        <text class="p18-wedge-label p18-theta-label" x="463" y="267">θ = π/n</text>
        <text class="p18-not-scale" x="428" y="315">not to scale</text>
      </g>`;
  }

  function constructionMarkup() {
    return `${splitLinesMarkup()}${actualWedgeMarkup()}${enlargedWedgeMarkup()}`;
  }

  function thresholdLabel() {
    return passesTarget() ? "within 0.1% target" : "above 0.1% target";
  }

  function polygonSvg() {
    const stage = constructionStages[state.construction];
    return `
      <svg class="route-svg p18-svg ${passesTarget() ? "p18-meets" : "p18-above"} p18-construction-${state.construction}" data-p18-svg viewBox="0 0 640 410" role="img" aria-labelledby="p18-svg-title p18-svg-desc">
        <title id="p18-svg-title">A circle inscribed in an adjustable regular polygon</title>
        <desc id="p18-svg-desc" data-p18-svg-desc>A regular ${state.sides}-sided polygon surrounds a tangent circle. The shaded excess is ${percent()}, ${thresholdLabel()}. ${stage.copy}</desc>
        <defs>
          <pattern id="p18-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="9" height="9" fill="#f8d9d3" />
            <line x1="0" y1="0" x2="0" y2="9" stroke="#d95145" stroke-width="2" />
          </pattern>
        </defs>
        <polygon class="p18-polygon" data-p18-polygon points="${polygonPoints()}" />
        <circle class="p18-circle" cx="${CENTRE_X}" cy="${CENTRE_Y}" r="${INRADIUS}" />
        <g data-p18-construction>${constructionMarkup()}</g>
        <g class="p18-centre-mark" aria-hidden="true">
          <circle cx="${CENTRE_X}" cy="${CENTRE_Y}" r="4" />
          <text x="${CENTRE_X - 20}" y="${CENTRE_Y + 22}">O</text>
        </g>
        <g class="p18-svg-readout" aria-hidden="true">
          <rect x="424" y="342" width="200" height="48" rx="12" />
          <text class="p18-svg-readout-label" x="440" y="361">SHADED / CIRCLE</text>
          <text class="p18-svg-readout-value" data-p18-live="svgPercent" x="440" y="381">${percent()}</text>
          <text class="p18-svg-readout-n" data-p18-live="svgSides" x="606" y="378" text-anchor="end">n = ${state.sides}</text>
        </g>
      </svg>`;
  }

  function derivationMarkup() {
    if (state.construction === 0) {
      return '<div class="p18-derivation-line">A<sub>shaded</sub> = A<sub>polygon</sub> − A<sub>circle</sub></div>';
    }
    if (state.construction === 1) {
      return `<div class="p18-derivation-line">A<sub>polygon</sub> = 2n(xr/2) = nxr <span>· ${2 * state.sides} right triangles</span></div>`;
    }
    return `
      <div class="p18-derivation-line">tan(π/n) = x/r &nbsp;⇒&nbsp; x = r tan(π/n)</div>
      <div class="p18-derivation-line">A<sub>shaded</sub>/A<sub>circle</sub> = (n/π)tan(π/n) − 1</div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p18-hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p18-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const at57 = excessRatio(57);
    const at58 = excessRatio(58);
    return `
      <section class="solution-card p18-solution" aria-label="Worked solution">
        <strong id="p18-solution-heading" tabindex="-1">Build the polygon from one right triangle</strong>
        <p>For integer n ≥ 3, one half-sector has angle θ = π/n, adjacent side r, and opposite side x. Therefore x = r tan(π/n).</p>
        <div class="equation">A<sub>polygon</sub> = 2n(xr/2) = nr² tan(π/n)</div>
        <div class="equation">A<sub>shaded</sub>/A<sub>circle</sub> = (n/π)tan(π/n) − 1</div>
        <p>Using tan u ≈ u + u³/3 locates the boundary:</p>
        <div class="equation">π²/(3n²) ≤ 1/1000 ⇒ n ≳ π√(1000/3) = 57.357…</div>
        <p>The approximation proposes 58; the exact expression must decide it.</p>
        <div class="equation">n = 57: ${number(at57, 12)} &gt; 0.001</div>
        <div class="equation">n = 58: ${number(at58, 12)} ≤ 0.001</div>
        <p>Because the exact excess decreases as n increases, <strong>58 is the first integer that works.</strong></p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: "1.8",
      sides: state.sides,
      constructionStage: state.construction + 1,
      exactExcessRatio: Number(excessRatio().toFixed(12)),
      exactExcessPercent: Number((excessRatio() * 100).toFixed(9)),
      targetRatio: TARGET,
      meetsTarget: passesTarget(),
      estimate: state.estimate === "" ? null : Number(state.estimate),
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function sliderProgress() {
    return ((state.sides - MIN_SIDES) / (MAX_SIDES - MIN_SIDES)) * 100;
  }

  function render() {
    const stage = constructionStages[state.construction];
    const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p18-reset">Reset</button>';
    return `
      <main class="book-shell p18-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p18-progress"><span></span></div></div>
          ${problemHeaderActions("1.8", resetMarkup)}
        </header>
        <div class="book-spread p18-spread">
          <article class="book-page">
            <div class="problem-number">Problem 1.8</div>
            <h1 class="book-title p18-title">Circle inscribed within polygon</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="problem-copy">For a circle inscribed inside a regular n-sided polygon, what is the minimum integer n so that A<sub>shaded</sub>/A<sub>circle</sub> ≤ 1/1000?</p>
            <div class="p18-definition"><strong>Shaded area</strong><span>polygon area minus circle area</span></div>
            <section class="prediction-box">
              <div class="eyebrow">Before calculating</div>
              <p>How many sides will make the outside slivers total no more than one-thousandth of the circle?</p>
              <div class="scale-choices p18-scale" aria-hidden="true"><span>under 20</span><span>about 50</span><span>over 80</span></div>
            </section>
          </article>
          <section class="book-page book-stage p18-stage">
            <div class="p18-stage-tabs" role="group" aria-label="Construction stage">
              ${constructionStages.map((item, index) => `<button class="chip-button ${state.construction === index ? "active" : ""}" type="button" data-problem-action="p18-construction" data-p18-stage="${index}" aria-pressed="${state.construction === index}">${index + 1}. ${item.label}</button>`).join("")}
            </div>
            ${polygonSvg()}
            <div class="book-stage-caption p18-caption" aria-live="polite">
              <div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
              <div class="p18-threshold ${passesTarget() ? "p18-threshold-meets" : "p18-threshold-above"}">
                <small>Current result</small>
                <strong data-p18-live="status">${thresholdLabel()}</strong>
              </div>
            </div>
            <div class="p18-derivation" data-p18-derivation>${derivationMarkup()}</div>
            <div class="slider-wrap p18-side-control">
              <label id="p18-side-label"><span>Number of sides, n</span><span data-p18-live="sides">${state.sides}</span></label>
              <div class="drag-slider p18-slider" data-p18-side-slider role="slider" tabindex="0" aria-labelledby="p18-side-label" aria-valuemin="${MIN_SIDES}" aria-valuemax="${MAX_SIDES}" aria-valuenow="${state.sides}" aria-valuetext="${state.sides} sides; shaded excess ${percent()}; ${thresholdLabel()}" style="--slider-progress:${sliderProgress()}%">
                <span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span>
              </div>
              <div class="slider-labels"><span>3</span><span>whole numbers only</span><span>80</span></div>
              <div class="p18-presets" aria-label="Side-count presets">
                ${[3, 4, 20, 57, 58].map((sides) => `<button class="chip-button ${state.sides === sides ? "active" : ""}" type="button" data-problem-action="p18-sides" data-p18-preset data-p18-sides="${sides}" aria-pressed="${state.sides === sides}">${sides}</button>`).join("")}
              </div>
            </div>
            <div class="p18-live-result" role="status" aria-live="polite">
              <span>Exact shaded excess</span>
              <strong data-p18-live="percent">${percent()}</strong>
              <small>target ≤ 0.1000%</small>
            </div>
          </section>
          <aside class="book-page book-coach p18-coach">
            <div class="coach-kicker">Integer estimate</div>
            <p class="coach-question">What is the first whole-number n that works?</p>
            <div class="book-metrics p18-metrics">
              <div class="book-metric"><small>Target ratio</small><strong>1/1000</strong></div>
              <div class="book-metric"><small>Minimum n</small><strong>${state.revealed ? "58" : "?"}</strong></div>
            </div>
            <form class="estimate-form" data-p18-estimate-form novalidate>
              <label for="p18-estimate">Your estimate for minimum n</label>
              <div class="estimate-field"><input id="p18-estimate" class="estimate-input" inputmode="numeric" type="number" min="3" max="1000" step="1" value="${state.estimate}" placeholder="e.g. 50" /><span>sides</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row p18-help-row">
              <button class="secondary-button" type="button" data-problem-action="p18-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p18-reveal">Reveal</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("1.8")}
      </main>`;
  }

  function updateLiveSideDom() {
    const root = document.querySelector(".p18-book-shell");
    if (!root) return;
    const ratioPercent = percent();
    const status = thresholdLabel();
    const meets = passesTarget();

    const polygon = root.querySelector("[data-p18-polygon]");
    if (polygon) polygon.setAttribute("points", polygonPoints());
    const construction = root.querySelector("[data-p18-construction]");
    if (construction) construction.innerHTML = constructionMarkup();
    const derivation = root.querySelector("[data-p18-derivation]");
    if (derivation) derivation.innerHTML = derivationMarkup();
    const description = root.querySelector("[data-p18-svg-desc]");
    if (description) description.textContent = `A regular ${state.sides}-sided polygon surrounds a tangent circle. The shaded excess is ${ratioPercent}, ${status}. ${constructionStages[state.construction].copy}`;

    root.querySelectorAll('[data-p18-live="sides"]').forEach((node) => { node.textContent = String(state.sides); });
    root.querySelectorAll('[data-p18-live="svgSides"]').forEach((node) => { node.textContent = `n = ${state.sides}`; });
    root.querySelectorAll('[data-p18-live="percent"], [data-p18-live="svgPercent"]').forEach((node) => { node.textContent = ratioPercent; });
    root.querySelectorAll('[data-p18-live="status"]').forEach((node) => { node.textContent = status; });

    const svg = root.querySelector("[data-p18-svg]");
    if (svg) {
      svg.classList.toggle("p18-meets", meets);
      svg.classList.toggle("p18-above", !meets);
    }
    const threshold = root.querySelector(".p18-threshold");
    if (threshold) {
      threshold.classList.toggle("p18-threshold-meets", meets);
      threshold.classList.toggle("p18-threshold-above", !meets);
    }
    const slider = root.querySelector("[data-p18-side-slider]");
    if (slider) {
      slider.style.setProperty("--slider-progress", `${sliderProgress()}%`);
      slider.setAttribute("aria-valuenow", String(state.sides));
      slider.setAttribute("aria-valuetext", `${state.sides} sides; shaded excess ${ratioPercent}; ${status}`);
    }
    root.querySelectorAll("[data-p18-preset]").forEach((button) => {
      const active = Number(button.dataset.p18Sides) === state.sides;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const feedback = root.querySelector(".p18-feedback");
    if (feedback) feedback.hidden = true;
  }

  function setSidesFromPointer(event, slider) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setSides(MIN_SIDES + progress * (MAX_SIDES - MIN_SIDES));
    updateLiveSideDom();
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p18-reset") state = initialState();
        if (action === "p18-construction") state.construction = Math.max(0, Math.min(2, Number(control.dataset.p18Stage)));
        if (action === "p18-sides") setSides(Number(control.dataset.p18Sides));
        if (action === "p18-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p18-reveal") {
          state.revealed = true;
          state.construction = 2;
          state.sides = 58;
        }
        renderApp();
        if (action === "p18-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p18-solution-heading")?.focus());
        }
      });
    });

    const form = document.querySelector("[data-p18-estimate-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("#p18-estimate");
      const raw = input.value.trim();
      const estimate = Number(raw);
      if (!raw || !Number.isInteger(estimate) || estimate < 3 || estimate > 1000) {
        state.estimate = "";
        state.committed = false;
        state.feedbackTone = "";
        state.feedback = "Enter a whole number of sides from 3 to 1000.";
      } else {
        state.estimate = String(estimate);
        state.committed = true;
        if (estimate <= MAX_SIDES) state.sides = estimate;
        if (estimate === 58) {
          state.feedbackTone = "success";
          state.feedback = "Exactly right. Now derive why 58 is the first integer that passes.";
        } else if (estimate === 57) {
          state.feedbackTone = "";
          state.feedback = "A very close miss: 57 leaves 0.101381% extra, just above the 0.1000% target.";
        } else if (estimate < 58) {
          state.feedbackTone = "";
          state.feedback = "That polygon still leaves too much area outside the circle. Split it into right triangles and grow n.";
        } else {
          state.feedbackTone = "";
          state.feedback = "That many sides passes, but the question asks for the minimum. Work downward and test the boundary pair.";
        }
      }
      renderApp();
    });

    const slider = document.querySelector("[data-p18-side-slider]");
    if (!slider) return;
    slider.addEventListener("pointerdown", (event) => {
      slider.setPointerCapture(event.pointerId);
      setSidesFromPointer(event, slider);
    });
    slider.addEventListener("pointermove", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) setSidesFromPointer(event, slider);
    });
    slider.addEventListener("pointerup", (event) => {
      setSidesFromPointer(event, slider);
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-p18-side-slider]");
    });
    slider.addEventListener("pointercancel", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-p18-side-slider]");
    });
    slider.addEventListener("keydown", (event) => {
      let next = state.sides;
      if (["ArrowLeft", "ArrowDown"].includes(event.key)) next -= 1;
      else if (["ArrowRight", "ArrowUp"].includes(event.key)) next += 1;
      else if (event.key === "PageDown") next -= 5;
      else if (event.key === "PageUp") next += 5;
      else if (event.key === "Home") next = MIN_SIDES;
      else if (event.key === "End") next = MAX_SIDES;
      else return;
      event.preventDefault();
      setSides(next);
      renderAndFocus(renderApp, "[data-p18-side-slider]");
    });
  }

  window.poveyProblemPages["1.8"] = { render, bind };
}());
