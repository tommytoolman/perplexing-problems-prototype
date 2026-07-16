window.poveyProblemPages = window.poveyProblemPages || {};

(function registerPolygonWithinCirclePage() {
  "use strict";

  const MIN_SIDES = 3;
  const MAX_SIDES = 30;
  const PAGE_STEP = 3;
  const WHOLE_CX = 320;
  const WHOLE_CY = 202;
  const WHOLE_RADIUS = 166;
  const SLICE_OX = 320;
  const SLICE_OY = 360;
  const SLICE_RADIUS = 240;
  const hints = [
    "Join the centre to every vertex. The polygon becomes n congruent isosceles triangles. What is the angle at the centre of each one?",
    "Bisect one central triangle. Its half-angle is θ = π/n, its hypotenuse is r, and its perpendicular sides are the half-base x and apothem y.",
    "There are 2n right triangles, each with area xy/2. Use x = r sin θ and y = r cos θ.",
    "Use 2 sin θ cos θ = sin(2θ). For many sides, let u = 2π/n and use sin u / u → 1.",
  ];

  const initialState = () => ({
    view: "whole",
    sides: 5,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clampSides(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return state.sides;
    return Math.max(MIN_SIDES, Math.min(MAX_SIDES, Math.round(numeric)));
  }

  function theta(sides = state.sides) {
    return Math.PI / sides;
  }

  function centralAngle(sides = state.sides) {
    return 2 * theta(sides);
  }

  function centralDegrees(sides = state.sides) {
    return 360 / sides;
  }

  function unitRadiusArea(sides = state.sides) {
    return (sides / 2) * Math.sin((2 * Math.PI) / sides);
  }

  function coveragePercent(sides = state.sides) {
    return (unitRadiusArea(sides) / Math.PI) * 100;
  }

  function formatDegrees(value = centralDegrees()) {
    return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  }

  function sliderProgress() {
    return ((state.sides - MIN_SIDES) / (MAX_SIDES - MIN_SIDES)) * 100;
  }

  function polarPoint(cx, cy, radius, angle) {
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  }

  function polygonVertices(sides = state.sides) {
    return Array.from({ length: sides }, (_, index) => (
      polarPoint(
        WHOLE_CX,
        WHOLE_CY,
        WHOLE_RADIUS,
        -Math.PI / 2 + (index * 2 * Math.PI) / sides,
      )
    ));
  }

  function pointsAttribute(points) {
    return points.map(({ x, y }) => `${x.toFixed(3)},${y.toFixed(3)}`).join(" ");
  }

  function centralArcPath(radius = 54) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + centralAngle();
    const start = polarPoint(WHOLE_CX, WHOLE_CY, radius, startAngle);
    const end = polarPoint(WHOLE_CX, WHOLE_CY, radius, endAngle);
    return `M${start.x.toFixed(3)} ${start.y.toFixed(3)} A${radius} ${radius} 0 0 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
  }

  function wholeGeometryMarkup() {
    const vertices = polygonVertices();
    const first = vertices[0];
    const second = vertices[1];
    const angleLabel = polarPoint(
      WHOLE_CX,
      WHOLE_CY,
      84,
      -Math.PI / 2 + centralAngle() / 2,
    );
    const radiusLabel = {
      x: WHOLE_CX + (first.x - WHOLE_CX) * 0.55 - 18,
      y: WHOLE_CY + (first.y - WHOLE_CY) * 0.55,
    };
    return `
      <polygon class="poly17-polygon" data-poly17-polygon points="${pointsAttribute(vertices)}" />
      <path class="poly17-highlight-sector" data-poly17-highlight-sector d="M${WHOLE_CX} ${WHOLE_CY} L${first.x.toFixed(3)} ${first.y.toFixed(3)} L${second.x.toFixed(3)} ${second.y.toFixed(3)} Z" />
      <g class="poly17-sector-rays" data-poly17-sector-rays>
        ${vertices.map(({ x, y }) => `<line x1="${WHOLE_CX}" y1="${WHOLE_CY}" x2="${x.toFixed(3)}" y2="${y.toFixed(3)}" />`).join("")}
      </g>
      <path class="poly17-central-angle" data-poly17-central-angle d="${centralArcPath()}" />
      <text class="poly17-angle-label" data-poly17-angle-label x="${angleLabel.x.toFixed(3)}" y="${angleLabel.y.toFixed(3)}" text-anchor="middle">2π/${state.sides}</text>
      <text class="poly17-radius-label" x="${radiusLabel.x.toFixed(3)}" y="${radiusLabel.y.toFixed(3)}">r</text>
      <circle class="poly17-centre" cx="${WHOLE_CX}" cy="${WHOLE_CY}" r="5" />
      <text class="poly17-centre-label" x="${WHOLE_CX - 22}" y="${WHOLE_CY + 21}">O</text>
      <g class="poly17-sector-key" transform="translate(414 365)">
        <rect x="0" y="0" width="177" height="34" rx="17" />
        <path d="M16 24 L27 9 L38 24 Z" />
        <text data-poly17-sector-count x="49" y="22">one of ${state.sides} equal triangles</text>
      </g>`;
  }

  function sliceGeometry() {
    const halfAngle = theta();
    const dx = SLICE_RADIUS * Math.sin(halfAngle);
    const topY = SLICE_OY - SLICE_RADIUS * Math.cos(halfAngle);
    const leftX = SLICE_OX - dx;
    const rightX = SLICE_OX + dx;
    const arcRadius = 55;
    const arcStart = polarPoint(SLICE_OX, SLICE_OY, arcRadius, -Math.PI / 2);
    const arcEnd = polarPoint(SLICE_OX, SLICE_OY, arcRadius, -Math.PI / 2 + halfAngle);
    const angleText = polarPoint(SLICE_OX, SLICE_OY, 86, -Math.PI / 2 + halfAngle / 2);
    const hypotenuseTextX = SLICE_OX + dx * 0.58 + 14;
    const hypotenuseTextY = SLICE_OY - (SLICE_OY - topY) * 0.58;
    return {
      dx,
      topY,
      leftX,
      rightX,
      arcPath: `M${arcStart.x.toFixed(3)} ${arcStart.y.toFixed(3)} A${arcRadius} ${arcRadius} 0 0 1 ${arcEnd.x.toFixed(3)} ${arcEnd.y.toFixed(3)}`,
      angleText,
      hypotenuseTextX,
      hypotenuseTextY,
    };
  }

  function sliceGeometryMarkup() {
    const geometry = sliceGeometry();
    const { leftX, rightX, topY, angleText, hypotenuseTextX, hypotenuseTextY } = geometry;
    const xLabelX = Math.max(SLICE_OX + 18, SLICE_OX + geometry.dx / 2);
    return `
      <path class="poly17-slice-triangle" d="M${SLICE_OX} ${SLICE_OY} L${leftX.toFixed(3)} ${topY.toFixed(3)} L${rightX.toFixed(3)} ${topY.toFixed(3)} Z" />
      <path class="poly17-half-triangle" d="M${SLICE_OX} ${SLICE_OY} L${SLICE_OX} ${topY.toFixed(3)} L${rightX.toFixed(3)} ${topY.toFixed(3)} Z" />
      <line class="poly17-slice-edge" x1="${SLICE_OX}" y1="${SLICE_OY}" x2="${leftX.toFixed(3)}" y2="${topY.toFixed(3)}" />
      <line class="poly17-slice-edge" x1="${SLICE_OX}" y1="${SLICE_OY}" x2="${rightX.toFixed(3)}" y2="${topY.toFixed(3)}" />
      <line class="poly17-slice-base" x1="${leftX.toFixed(3)}" y1="${topY.toFixed(3)}" x2="${rightX.toFixed(3)}" y2="${topY.toFixed(3)}" />
      <line class="poly17-apothem" x1="${SLICE_OX}" y1="${SLICE_OY}" x2="${SLICE_OX}" y2="${topY.toFixed(3)}" />
      <path class="poly17-right-angle" d="M${SLICE_OX} ${(topY + 15).toFixed(3)} h15 v-15" />
      <path class="poly17-half-angle" d="${geometry.arcPath}" />
      <circle class="poly17-slice-point" cx="${SLICE_OX}" cy="${SLICE_OY}" r="5" />
      <circle class="poly17-slice-midpoint" cx="${SLICE_OX}" cy="${topY.toFixed(3)}" r="4" />
      <text class="poly17-slice-label" x="${SLICE_OX - 23}" y="${SLICE_OY + 23}">O</text>
      <text class="poly17-slice-label" x="${SLICE_OX - 24}" y="${(topY - 10).toFixed(3)}">M</text>
      <text class="poly17-length-label" x="${hypotenuseTextX.toFixed(3)}" y="${hypotenuseTextY.toFixed(3)}">r</text>
      <text class="poly17-length-label" x="${SLICE_OX - 25}" y="${((SLICE_OY + topY) / 2).toFixed(3)}">y</text>
      <text class="poly17-length-label" x="${xLabelX.toFixed(3)}" y="${(topY - 11).toFixed(3)}" text-anchor="middle">x</text>
      <text class="poly17-angle-label" x="${angleText.x.toFixed(3)}" y="${angleText.y.toFixed(3)}" text-anchor="middle">θ</text>
      <text class="poly17-base-note" x="${SLICE_OX}" y="${Math.max(95, topY - 36).toFixed(3)}" text-anchor="middle">polygon side = 2x</text>`;
  }

  function wholeSvg() {
    return `
      <svg class="route-svg poly17-svg poly17-whole-svg" data-poly17-whole-svg viewBox="0 0 640 420" role="img" aria-labelledby="poly17-whole-title poly17-whole-desc">
        <title id="poly17-whole-title" data-poly17-whole-title>Regular ${state.sides}-sided polygon inside its circumcircle</title>
        <desc id="poly17-whole-desc" data-poly17-whole-desc>A regular ${state.sides}-sided polygon is inscribed in a circle. Radii divide it into ${state.sides} congruent central triangles. One is highlighted and has central angle ${formatDegrees()} degrees, equal to 2 pi over ${state.sides} radians.</desc>
        <circle class="poly17-circle-disc" cx="${WHOLE_CX}" cy="${WHOLE_CY}" r="${WHOLE_RADIUS}" />
        <g data-poly17-whole-geometry>${wholeGeometryMarkup()}</g>
      </svg>`;
  }

  function sliceSvg() {
    return `
      <svg class="route-svg poly17-svg poly17-slice-svg" data-poly17-slice-svg viewBox="0 0 640 420" role="img" aria-labelledby="poly17-slice-title poly17-slice-desc">
        <title id="poly17-slice-title">One central triangle bisected into two right triangles</title>
        <desc id="poly17-slice-desc" data-poly17-slice-desc>For the ${state.sides}-sided polygon, one central triangle has angle ${formatDegrees()} degrees. A perpendicular from centre O to side midpoint M bisects it. Each right triangle has hypotenuse r, half-base x, apothem y, and half-angle pi over ${state.sides}.</desc>
        <g class="poly17-angle-convention">
          <rect x="25" y="24" width="232" height="66" rx="10" />
          <text x="42" y="50">central angle: 2θ = 2π/<tspan data-poly17-live="sides">${state.sides}</tspan></text>
          <text x="42" y="75">half-angle: θ = π/<tspan data-poly17-live="sides">${state.sides}</tspan></text>
        </g>
        <g data-poly17-slice-geometry>${sliceGeometryMarkup()}</g>
      </svg>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack poly17-hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint poly17-hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback poly17-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card poly17-solution" aria-label="Worked solution">
        <strong id="poly17-solution-heading" tabindex="-1">Split, bisect, and recombine</strong>
        <p>Radii split the polygon into n congruent central triangles. Bisecting each one gives <strong>2n</strong> right triangles, with half-angle θ = π/n.</p>
        <div class="equation">x = r sin(π/n) &nbsp; · &nbsp; y = r cos(π/n)</div>
        <div class="equation">A<sub>n</sub> = 2n(xy/2) = nxy</div>
        <div class="equation">A<sub>n</sub> = nr² sin(π/n) cos(π/n)</div>
        <div class="equation poly17-answer-equation">A<sub>n</sub> = (nr²/2) sin(2π/n)</div>
        <p>Equivalently, each unbisected central triangle has area <span class="poly17-inline-equation">(r²/2) sin(2π/n)</span>.</p>
        <div class="equation poly17-limit-equation">A<sub>n</sub> = πr² · sin(2π/n)/(2π/n) → πr²</div>
        <p>As n → ∞, the ratio sin u/u tends to 1. For every finite n, straight chords leave a curved gap, so A<sub>n</sub> &lt; πr² and approaches the circle area from below.</p>
        <div class="poly17-current-check"><span>Current n = ${state.sides}, r = 1</span><strong>A<sub>${state.sides}</sub> = ${unitRadiusArea().toFixed(6)}; coverage = ${coveragePercent().toFixed(2)}%</strong></div>
      </section>`;
  }

  function stateSnapshot() {
    return JSON.stringify(
      {
        problem: "1.7",
        view: state.view,
        sides: state.sides,
        centralAngleRadians: Number(centralAngle().toFixed(9)),
        centralAngleDegrees: Number(centralDegrees().toFixed(6)),
        estimatePercent: state.estimate === "" ? null : Number(state.estimate),
        committed: state.committed,
        hintsUsed: state.hintsUsed,
        solutionRevealed: state.revealed,
        unitRadiusArea: state.revealed ? Number(unitRadiusArea().toFixed(9)) : null,
        circleCoveragePercent: state.revealed ? Number(coveragePercent().toFixed(6)) : null,
      },
      null,
      2,
    );
  }

  function render() {
    const showCoverage = state.committed || state.revealed;
    const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="poly17-reset">Reset</button>';
    return `
      <main class="book-shell poly17-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar poly17-progress"><span></span></div></div>
          ${problemHeaderActions("1.7", resetMarkup)}
        </header>
        <div class="book-spread poly17-spread">
          <article class="book-page poly17-problem-page">
            <div class="problem-number">Problem 1.7</div>
            <h1 class="book-title poly17-title">Polygon inscribed within circle</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="problem-copy">What is the area of an n-sided regular polygon inscribed within a circle of radius r?</p>
            <div class="poly17-domain-note"><strong>n is an integer, n ≥ 3.</strong><span>Every vertex lies on the circle; r &gt; 0 is its radius.</span></div>
            <section class="prediction-box poly17-prediction">
              <div class="eyebrow">First instinct</div>
              <p>As more sides are added, does the polygon's area approach the circle from below or from above?</p>
              <div class="poly17-approach-cue" aria-hidden="true"><span>triangle</span><i></i><span>many sides</span></div>
            </section>
          </article>

          <section class="book-page book-stage poly17-stage">
            <div class="poly17-view-tabs" role="group" aria-label="Geometry view">
              <button class="chip-button ${state.view === "whole" ? "active" : ""}" type="button" data-problem-action="poly17-view-whole" aria-pressed="${state.view === "whole"}">Whole polygon</button>
              <button class="chip-button ${state.view === "slice" ? "active" : ""}" type="button" data-problem-action="poly17-view-slice" aria-pressed="${state.view === "slice"}">Half-slice proof</button>
            </div>
            ${state.view === "whole" ? wholeSvg() : sliceSvg()}
            <div class="book-stage-caption poly17-caption" aria-live="polite">
              <p data-poly17-stage-caption>${state.view === "whole"
                ? `The ${state.sides}-gon is exactly ${state.sides} equal central triangles. Its straight sides leave curved gaps inside the circle.`
                : `One central triangle is bisected at M. The marked θ is half the full central angle: θ = π/${state.sides}.`}</p>
              <div class="poly17-angle-readout"><small>central angle</small><strong><span data-poly17-live="degrees">${formatDegrees()}</span>°</strong><span>2π / <span data-poly17-live="sides">${state.sides}</span> rad</span></div>
            </div>

            <div class="slider-wrap poly17-sides-control">
              <label id="poly17-sides-label"><span>Number of sides, n</span><strong data-poly17-live="sides">${state.sides}</strong></label>
              <div class="drag-slider poly17-slider" data-poly17-sides-slider role="slider" tabindex="0" aria-labelledby="poly17-sides-label" aria-valuemin="${MIN_SIDES}" aria-valuemax="${MAX_SIDES}" aria-valuenow="${state.sides}" aria-valuetext="${state.sides} sides; central angle ${formatDegrees()} degrees" style="--slider-progress:${sliderProgress()}%">
                <span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span>
              </div>
              <div class="slider-labels"><span>3</span><span>regular polygons</span><span>30</span></div>
              <div class="poly17-presets" aria-label="Side count presets">
                ${[3, 4, 5, 6, 12, 30].map((value) => `<button class="chip-button ${state.sides === value ? "active" : ""}" type="button" data-problem-action="poly17-sides" data-poly17-sides="${value}">${value}</button>`).join("")}
              </div>
            </div>

            <div class="poly17-stage-metrics" aria-live="polite">
              <div><small>sides</small><strong>n = <span data-poly17-live="sides">${state.sides}</span></strong></div>
              <div><small>circle covered</small><strong data-poly17-live="coverage">${showCoverage ? `${coveragePercent().toFixed(1)}%` : "estimate it"}</strong></div>
            </div>
          </section>

          <aside class="book-page book-coach poly17-coach">
            <div class="coach-kicker">Area estimate</div>
            <p class="coach-question">For r = 1, how much of the circle does the current polygon cover?</p>
            <div class="book-metrics poly17-metrics">
              <div class="book-metric"><small>Current polygon</small><strong><span data-poly17-live="sides">${state.sides}</span>-gon</strong></div>
              <div class="book-metric"><small>Circle area</small><strong>π</strong></div>
            </div>
            <form class="estimate-form poly17-estimate-form" data-poly17-estimate-form novalidate>
              <label for="poly17-estimate">Your coverage estimate</label>
              <div class="estimate-field"><input id="poly17-estimate" class="estimate-input poly17-estimate-input" data-poly17-estimate-input inputmode="decimal" type="number" min="0" max="100" step="0.1" value="${state.estimate}" placeholder="e.g. 75" /><span>%</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row poly17-help-row">
              <button class="secondary-button" type="button" data-problem-action="poly17-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="poly17-reveal">Reveal</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Problem 1.7 development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.7")}
      </main>`;
  }

  function setSides(value) {
    const next = clampSides(value);
    if (next === state.sides) return false;
    state.sides = next;
    state.estimate = "";
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "";
    return true;
  }

  function updateLiveGeometry() {
    const root = document.querySelector(".poly17-book-shell");
    if (!root) return;
    const degrees = formatDegrees();
    root.querySelectorAll('[data-poly17-live="sides"]').forEach((node) => { node.textContent = String(state.sides); });
    root.querySelectorAll('[data-poly17-live="degrees"]').forEach((node) => { node.textContent = degrees; });
    root.querySelectorAll('[data-poly17-live="coverage"]').forEach((node) => {
      node.textContent = state.revealed ? `${coveragePercent().toFixed(1)}%` : "estimate it";
    });

    const slider = root.querySelector("[data-poly17-sides-slider]");
    if (slider) {
      slider.style.setProperty("--slider-progress", `${sliderProgress()}%`);
      slider.setAttribute("aria-valuenow", String(state.sides));
      slider.setAttribute("aria-valuetext", `${state.sides} sides; central angle ${degrees} degrees`);
    }

    const input = root.querySelector("[data-poly17-estimate-input]");
    if (input) input.value = state.estimate;
    const feedback = root.querySelector(".poly17-feedback");
    if (feedback) feedback.hidden = true;

    const wholeGeometry = root.querySelector("[data-poly17-whole-geometry]");
    if (wholeGeometry) wholeGeometry.innerHTML = wholeGeometryMarkup();
    const wholeDescription = root.querySelector("[data-poly17-whole-desc]");
    if (wholeDescription) wholeDescription.textContent = `A regular ${state.sides}-sided polygon is inscribed in a circle. Radii divide it into ${state.sides} congruent central triangles. One is highlighted and has central angle ${degrees} degrees, equal to 2 pi over ${state.sides} radians.`;
    const wholeTitle = root.querySelector("[data-poly17-whole-title]");
    if (wholeTitle) wholeTitle.textContent = `Regular ${state.sides}-sided polygon inside its circumcircle`;

    const sliceGeometryGroup = root.querySelector("[data-poly17-slice-geometry]");
    if (sliceGeometryGroup) sliceGeometryGroup.innerHTML = sliceGeometryMarkup();
    const sliceDescription = root.querySelector("[data-poly17-slice-desc]");
    if (sliceDescription) sliceDescription.textContent = `For the ${state.sides}-sided polygon, one central triangle has angle ${degrees} degrees. A perpendicular from centre O to side midpoint M bisects it. Each right triangle has hypotenuse r, half-base x, apothem y, and half-angle pi over ${state.sides}.`;

    const caption = root.querySelector("[data-poly17-stage-caption]");
    if (caption) {
      caption.textContent = state.view === "whole"
        ? `The ${state.sides}-gon is exactly ${state.sides} equal central triangles. Its straight sides leave curved gaps inside the circle.`
        : `One central triangle is bisected at M. The marked θ is half the full central angle: θ = π/${state.sides}.`;
    }
  }

  function setSidesFromPointer(event, slider) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setSides(MIN_SIDES + progress * (MAX_SIDES - MIN_SIDES));
    updateLiveGeometry();
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "poly17-reset") state = initialState();
        if (action === "poly17-view-whole") state.view = "whole";
        if (action === "poly17-view-slice") state.view = "slice";
        if (action === "poly17-sides") setSides(Number(control.dataset.poly17Sides));
        if (action === "poly17-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          if (state.hintsUsed >= 2) state.view = "slice";
        }
        if (action === "poly17-reveal") {
          state.revealed = true;
          state.view = "slice";
        }
        renderApp();
        if (action === "poly17-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#poly17-solution-heading")?.focus());
        }
      });
    });

    const form = document.querySelector("[data-poly17-estimate-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("[data-poly17-estimate-input]");
      const raw = input?.value.trim() ?? "";
      const estimate = Number(raw);
      state.estimate = raw;
      state.feedbackTone = "";
      if (!raw || !Number.isFinite(estimate)) {
        state.committed = false;
        state.feedback = "Enter a percentage estimate first.";
      } else if (estimate < 0 || estimate > 100) {
        state.committed = false;
        state.feedback = "Coverage must be between 0% and 100%.";
      } else {
        const target = coveragePercent();
        state.committed = true;
        if (Math.abs(estimate - target) <= 2) {
          state.feedbackTone = "success";
          state.feedback = `Strong estimate. The ${state.sides}-gon covers ${target.toFixed(1)}% of its circle.`;
        } else if (estimate < target) {
          state.feedback = `The polygon fills more than that: its vertices already reach the circle. The verified coverage is ${target.toFixed(1)}%.`;
        } else {
          state.feedback = `An inscribed polygon cannot cover the curved gaps outside its chords. The verified coverage is ${target.toFixed(1)}%.`;
        }
      }
      renderApp();
    });

    const slider = document.querySelector("[data-poly17-sides-slider]");
    if (!slider) return;

    slider.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      slider.setPointerCapture(event.pointerId);
      setSidesFromPointer(event, slider);
    });
    slider.addEventListener("pointermove", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) setSidesFromPointer(event, slider);
    });
    slider.addEventListener("pointerup", (event) => {
      setSidesFromPointer(event, slider);
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-poly17-sides-slider]");
    });
    slider.addEventListener("pointercancel", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-poly17-sides-slider]");
    });
    slider.addEventListener("keydown", (event) => {
      let next = state.sides;
      if (["ArrowLeft", "ArrowDown"].includes(event.key)) next -= 1;
      else if (["ArrowRight", "ArrowUp"].includes(event.key)) next += 1;
      else if (event.key === "PageDown") next -= PAGE_STEP;
      else if (event.key === "PageUp") next += PAGE_STEP;
      else if (event.key === "Home") next = MIN_SIDES;
      else if (event.key === "End") next = MAX_SIDES;
      else return;
      event.preventDefault();
      setSides(next);
      renderAndFocus(renderApp, "[data-poly17-sides-slider]");
    });
  }

  window.poveyProblemPages["1.7"] = { render, bind };
}());
