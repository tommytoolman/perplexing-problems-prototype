(function registerProfessorFuddlethumbsStampPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const MIN_ANGLE = 3;
  const MAX_ANGLE = 87;
  const CX = 300;
  const CY = 190;
  const RADIUS = 150;
  const ANGLE_ARC_RADIUS = 45;
  const hints = [
    "A rectangle's corner is a right angle. What does the converse of Thales' theorem say about either diagonal of a rectangle whose corners lie on a circle?",
    "Let θ be the angle the diameter-diagonal makes with the width. Resolve that fixed length D into components: w = D cos θ and h = D sin θ.",
    "Multiply the components, then use 2 sin θ cos θ = sin(2θ). This gives A/D² = (1/2)sin(2θ).",
    "On 0 &lt; θ &lt; π/2, when does sin(2θ) reach 1? Check the two limiting, almost-flat rectangles as well.",
  ];

  const initialState = () => ({
    angleDeg: 30,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function clampAngle(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return state.angleDeg;
    return clamp(numeric, MIN_ANGLE, MAX_ANGLE);
  }

  function radians(angleDeg = state.angleDeg) {
    return angleDeg * Math.PI / 180;
  }

  function widthRatio(angleDeg = state.angleDeg) {
    return Math.cos(radians(angleDeg));
  }

  function heightRatio(angleDeg = state.angleDeg) {
    return Math.sin(radians(angleDeg));
  }

  function areaCoefficient(angleDeg = state.angleDeg) {
    return widthRatio(angleDeg) * heightRatio(angleDeg);
  }

  function areaOfDiameter(diameter, angleDeg = state.angleDeg) {
    return diameter * diameter * areaCoefficient(angleDeg);
  }

  function formatAngle(angleDeg = state.angleDeg) {
    return Number.isInteger(angleDeg) ? angleDeg.toFixed(0) : angleDeg.toFixed(1);
  }

  function formatRatio(value) {
    return value.toFixed(3);
  }

  function aspectText(angleDeg = state.angleDeg) {
    const ratio = widthRatio(angleDeg) / heightRatio(angleDeg);
    return ratio >= 1 ? `${ratio.toFixed(2)} : 1` : `1 : ${(1 / ratio).toFixed(2)}`;
  }

  function normalizedAreaPercent(angleDeg = state.angleDeg) {
    return (areaCoefficient(angleDeg) / 0.5) * 100;
  }

  function geometry(angleDeg = state.angleDeg) {
    const theta = radians(angleDeg);
    const halfWidth = RADIUS * Math.cos(theta);
    const halfHeight = RADIUS * Math.sin(theta);
    const left = CX - halfWidth;
    const right = CX + halfWidth;
    const top = CY - halfHeight;
    const bottom = CY + halfHeight;
    const angleEnd = {
      x: CX + ANGLE_ARC_RADIUS * Math.cos(theta),
      y: CY - ANGLE_ARC_RADIUS * Math.sin(theta),
    };
    const angleLabel = {
      x: CX + 68 * Math.cos(theta / 2),
      y: CY - 68 * Math.sin(theta / 2),
    };
    const widthDimensionY = bottom + 20;
    const heightDimensionX = right + 20;

    return {
      halfWidth,
      halfHeight,
      left,
      right,
      top,
      bottom,
      widthDimensionY,
      heightDimensionX,
      angleLabel,
      angleArc: `M${CX + ANGLE_ARC_RADIUS} ${CY} A${ANGLE_ARC_RADIUS} ${ANGLE_ARC_RADIUS} 0 0 0 ${angleEnd.x.toFixed(3)} ${angleEnd.y.toFixed(3)}`,
    };
  }

  function rectangleSvg() {
    const shape = geometry();
    const width = shape.right - shape.left;
    const height = shape.bottom - shape.top;
    const angle = formatAngle();
    const widthValue = formatRatio(widthRatio());
    const heightValue = formatRatio(heightRatio());
    const areaValue = areaCoefficient().toFixed(4);

    return `
      <svg class="route-svg p111-svg" data-p111-svg viewBox="0 0 640 410" role="img" aria-labelledby="p111-svg-title p111-svg-desc">
        <title id="p111-svg-title">Adjustable rectangular stamp inside a circular ink pad</title>
        <desc id="p111-svg-desc" data-p111-svg-desc>A rectangle has all four corners on a circular ink pad. Its diagonal makes an angle of ${angle} degrees with its width. Its width is ${widthValue} times D, its height is ${heightValue} times D, and its area is ${areaValue} times D squared. Drag the gold top-right corner or use its keyboard controls.</desc>
        <defs>
          <radialGradient id="p111-ink-fill" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stop-color="#36527a" />
            <stop offset="72%" stop-color="#17233f" />
            <stop offset="100%" stop-color="#0e172d" />
          </radialGradient>
          <pattern id="p111-stamp-fill" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="12" height="12" fill="#f0b85a" fill-opacity="0.82" />
            <line x1="0" y1="0" x2="0" y2="12" stroke="#fffdf5" stroke-opacity="0.34" stroke-width="3" />
          </pattern>
        </defs>

        <g class="p111-pad" aria-hidden="true">
          <circle cx="${CX}" cy="${CY}" r="${RADIUS}" />
          <text x="${CX}" y="28" text-anchor="middle">CIRCULAR INK PAD</text>
        </g>
        <line class="p111-horizontal-guide" x1="${CX}" y1="${CY}" x2="${CX + RADIUS}" y2="${CY}" aria-hidden="true" />

        <rect class="p111-stamp" data-p111-rect x="${shape.left.toFixed(3)}" y="${shape.top.toFixed(3)}" width="${width.toFixed(3)}" height="${height.toFixed(3)}" />
        <line class="p111-diagonal" data-p111-diagonal x1="${shape.left.toFixed(3)}" y1="${shape.bottom.toFixed(3)}" x2="${shape.right.toFixed(3)}" y2="${shape.top.toFixed(3)}" />
        <text class="p111-diagonal-label" data-p111-diagonal-label x="${(CX - 22).toFixed(3)}" y="${(CY - 12).toFixed(3)}">D</text>

        <g class="p111-corners" aria-hidden="true">
          <circle data-p111-corner="tl" cx="${shape.left.toFixed(3)}" cy="${shape.top.toFixed(3)}" r="5" />
          <circle data-p111-corner="bl" cx="${shape.left.toFixed(3)}" cy="${shape.bottom.toFixed(3)}" r="5" />
          <circle data-p111-corner="br" cx="${shape.right.toFixed(3)}" cy="${shape.bottom.toFixed(3)}" r="5" />
        </g>

        <g class="p111-angle-mark" aria-hidden="true">
          <path data-p111-angle-arc d="${shape.angleArc}" />
          <text data-p111-angle-label x="${shape.angleLabel.x.toFixed(3)}" y="${shape.angleLabel.y.toFixed(3)}">θ = ${angle}°</text>
        </g>

        <g class="p111-dimensions" aria-hidden="true">
          <line data-p111-width-dimension x1="${shape.left.toFixed(3)}" y1="${shape.widthDimensionY.toFixed(3)}" x2="${shape.right.toFixed(3)}" y2="${shape.widthDimensionY.toFixed(3)}" />
          <line data-p111-width-tick="left" x1="${shape.left.toFixed(3)}" y1="${(shape.widthDimensionY - 7).toFixed(3)}" x2="${shape.left.toFixed(3)}" y2="${(shape.widthDimensionY + 7).toFixed(3)}" />
          <line data-p111-width-tick="right" x1="${shape.right.toFixed(3)}" y1="${(shape.widthDimensionY - 7).toFixed(3)}" x2="${shape.right.toFixed(3)}" y2="${(shape.widthDimensionY + 7).toFixed(3)}" />
          <text data-p111-width-label x="${CX}" y="${(shape.widthDimensionY + 17).toFixed(3)}" text-anchor="middle">w = ${widthValue}D</text>

          <line data-p111-height-dimension x1="${shape.heightDimensionX.toFixed(3)}" y1="${shape.top.toFixed(3)}" x2="${shape.heightDimensionX.toFixed(3)}" y2="${shape.bottom.toFixed(3)}" />
          <line data-p111-height-tick="top" x1="${(shape.heightDimensionX - 7).toFixed(3)}" y1="${shape.top.toFixed(3)}" x2="${(shape.heightDimensionX + 7).toFixed(3)}" y2="${shape.top.toFixed(3)}" />
          <line data-p111-height-tick="bottom" x1="${(shape.heightDimensionX - 7).toFixed(3)}" y1="${shape.bottom.toFixed(3)}" x2="${(shape.heightDimensionX + 7).toFixed(3)}" y2="${shape.bottom.toFixed(3)}" />
          <text data-p111-height-label x="${(shape.heightDimensionX + 15).toFixed(3)}" y="${CY}" text-anchor="middle" transform="rotate(-90 ${(shape.heightDimensionX + 15).toFixed(3)} ${CY})">h = ${heightValue}D</text>
        </g>

        <circle
          class="p111-corner-handle"
          data-p111-handle
          cx="${shape.right.toFixed(3)}"
          cy="${shape.top.toFixed(3)}"
          r="18"
          role="slider"
          tabindex="0"
          focusable="true"
          aria-label="Stamp proportions"
          aria-describedby="p111-drag-help"
          aria-valuemin="${MIN_ANGLE}"
          aria-valuemax="${MAX_ANGLE}"
          aria-valuenow="${angle}"
          aria-valuetext="Diagonal angle ${angle} degrees; width ${widthValue} D; height ${heightValue} D; area ${areaValue} D squared"
        />
      </svg>`;
  }

  function presetMarkup() {
    return `
      <div class="p111-presets" aria-label="Stamp proportion presets">
        ${[15, 30, 45, 60, 75].map((angle) => `
          <button class="chip-button ${Math.abs(state.angleDeg - angle) < 0.05 ? "active" : ""}" type="button" data-problem-action="p111-angle" data-p111-angle="${angle}" aria-pressed="${Math.abs(state.angleDeg - angle) < 0.05}">${angle === 45 ? "Square · 45°" : `${angle}°`}</button>`).join("")}
      </div>`;
  }

  function stageMetricsMarkup() {
    return `
      <div class="p111-stage-metrics" aria-live="polite">
        <div><small>angle</small><strong data-p111-live="angle">${formatAngle()}°</strong></div>
        <div><small>width / D</small><strong data-p111-live="width">${formatRatio(widthRatio())}</strong></div>
        <div><small>height / D</small><strong data-p111-live="height">${formatRatio(heightRatio())}</strong></div>
        <div><small>area / D²</small><strong data-p111-live="area">${areaCoefficient().toFixed(4)}</strong></div>
      </div>`;
  }

  function areaMeterMarkup() {
    return `
      <div class="p111-area-meter" aria-label="Current area compared with the greatest area encountered by the model">
        <div class="p111-area-meter-label"><span>Current stamped area</span><strong data-p111-live="aspect">w : h = ${aspectText()}</strong></div>
        <div class="p111-area-track"><span data-p111-area-fill style="--p111-area:${normalizedAreaPercent().toFixed(2)}%"></span><i aria-hidden="true"></i></div>
        <div class="p111-area-scale"><span>flat limit · 0</span><span>best · 0.5D²</span></div>
      </div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p111-hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint p111-hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p111-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p111-solution" aria-label="Worked solution">
        <strong id="p111-solution-heading" tabindex="-1">The fixed diagonal forces a square</strong>
        <p>An inscribed rectangle's diagonal is a diameter, so its length is D. With 0 &lt; θ &lt; π/2:</p>
        <div class="equation">w = D cos θ &nbsp; · &nbsp; h = D sin θ</div>
        <div class="equation">A = wh = (D²/2) sin(2θ)</div>
        <p>Differentiating gives A'(θ) = D² cos(2θ). Its only zero in the domain is θ = π/4, and A''(π/4) = -2D² &lt; 0. At both open boundaries A tends to 0, so this is the global maximum.</p>
        <div class="equation p111-answer-equation">θ = 45° &nbsp;⇒&nbsp; A<sub>max</sub> = D²/2</div>
        <p><strong>Independent check.</strong> The diagonal also gives w² + h² = D². Since (w - h)² ≥ 0, we have 2wh ≤ D². Equality requires w = h, confirming that the optimal stamp is a square.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: "1.11",
      contentStatus: "independently reconstructed activity; not source wording",
      angleDegrees: Number(state.angleDeg.toFixed(3)),
      angleRadians: Number(radians().toFixed(9)),
      widthOverD: Number(widthRatio().toFixed(9)),
      heightOverD: Number(heightRatio().toFixed(9)),
      areaOverDSquared: Number(areaCoefficient().toFixed(9)),
      checkAreaForD10: Number(areaOfDiameter(10).toFixed(9)),
      estimate: state.estimate === "" ? null : Number(state.estimate),
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p111-reset">Reset</button>';
    return `
      <main class="book-shell p111-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p111-progress"><span></span></div></div>
          ${problemHeaderActions("1.11", resetMarkup)}
        </header>

        <div class="book-spread p111-spread">
          <article class="book-page p111-problem-page">
            <div class="problem-number">Problem 1.11</div>
            <h1 class="book-title p111-title">Professor Fuddlethumbs' stamp</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">A rectangular stamp has all four corners on the rim of a circular ink pad of diameter D. Which proportions give the greatest stamped area?</p>
            <p class="p111-reconstruction-note"><strong>Reconstructed activity.</strong> The supplied sample stops after 1.10. This independently written prompt follows only the listed title and difficulty; it is not source wording.</p>
            <section class="prediction-box p111-prediction">
              <div class="eyebrow">Make a prediction</div>
              <p>Will the best stamp be wide, tall, or perfectly balanced? The diagonal cannot change.</p>
              <div class="p111-shape-cue" aria-hidden="true"><span>wide</span><i></i><span>square</span><i></i><span>tall</span></div>
            </section>
          </article>

          <section class="book-page book-stage p111-stage">
            ${rectangleSvg()}
            <div class="book-stage-caption p111-caption">
              <p><strong>Drag the gold corner.</strong> It stays on the pad while the rectangle changes shape. Watch where the area stops growing.</p>
              <div class="p111-angle-readout"><small>diagonal angle</small><strong data-p111-live="angle">${formatAngle()}°</strong><span>0 &lt; θ &lt; 90°</span></div>
            </div>
            ${presetMarkup()}
            <p class="p111-drag-help" id="p111-drag-help">Keyboard: Up/Left makes the stamp taller; Down/Right makes it wider. Page keys move 5°. Home and End jump near the limiting shapes.</p>
            ${stageMetricsMarkup()}
            ${areaMeterMarkup()}
          </section>

          <aside class="book-page book-coach p111-coach">
            <div class="coach-kicker">Maximum estimate</div>
            <p class="coach-question">What is the greatest possible value of A/D²?</p>
            <div class="book-metrics p111-metrics">
              <div class="book-metric"><small>Current θ</small><strong data-p111-live="angle">${formatAngle()}°</strong></div>
              <div class="book-metric"><small>Current A/D²</small><strong data-p111-live="area">${areaCoefficient().toFixed(4)}</strong></div>
            </div>
            <form class="estimate-form p111-estimate-form" data-p111-estimate-form novalidate>
              <label for="p111-estimate">Your decimal coefficient</label>
              <div class="estimate-field"><input id="p111-estimate" class="estimate-input p111-estimate-input" data-p111-estimate-input inputmode="decimal" type="number" min="0" max="1" step="0.01" value="${state.estimate}" placeholder="e.g. 0.40" /><span>× D²</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row p111-help-row">
              <button class="secondary-button" type="button" data-problem-action="p111-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p111-reveal">${state.revealed ? "Solution shown" : "Reveal"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Problem 1.11 development state", snapshot())}
          </aside>
        </div>
        ${problemNav("1.11")}
      </main>`;
  }

  function setAngle(value) {
    const next = Math.round(clampAngle(value) * 2) / 2;
    if (Math.abs(next - state.angleDeg) < 0.001) return false;
    state.angleDeg = next;
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "";
    return true;
  }

  function setAttribute(root, selector, name, value) {
    root.querySelector(selector)?.setAttribute(name, String(value));
  }

  function setLine(root, selector, x1, y1, x2, y2) {
    const line = root.querySelector(selector);
    if (!line) return;
    line.setAttribute("x1", x1.toFixed(3));
    line.setAttribute("y1", y1.toFixed(3));
    line.setAttribute("x2", x2.toFixed(3));
    line.setAttribute("y2", y2.toFixed(3));
  }

  function updateAngleDom() {
    const root = document.querySelector(".p111-book-shell");
    if (!root) return;
    const shape = geometry();
    const width = shape.right - shape.left;
    const height = shape.bottom - shape.top;
    const angle = formatAngle();
    const widthValue = formatRatio(widthRatio());
    const heightValue = formatRatio(heightRatio());
    const areaValue = areaCoefficient().toFixed(4);

    const rectangle = root.querySelector("[data-p111-rect]");
    if (rectangle) {
      rectangle.setAttribute("x", shape.left.toFixed(3));
      rectangle.setAttribute("y", shape.top.toFixed(3));
      rectangle.setAttribute("width", width.toFixed(3));
      rectangle.setAttribute("height", height.toFixed(3));
    }

    setLine(root, "[data-p111-diagonal]", shape.left, shape.bottom, shape.right, shape.top);
    [["tl", shape.left, shape.top], ["bl", shape.left, shape.bottom], ["br", shape.right, shape.bottom]].forEach(([corner, x, y]) => {
      setAttribute(root, `[data-p111-corner="${corner}"]`, "cx", x.toFixed(3));
      setAttribute(root, `[data-p111-corner="${corner}"]`, "cy", y.toFixed(3));
    });

    const handle = root.querySelector("[data-p111-handle]");
    if (handle) {
      handle.setAttribute("cx", shape.right.toFixed(3));
      handle.setAttribute("cy", shape.top.toFixed(3));
      handle.setAttribute("aria-valuenow", angle);
      handle.setAttribute("aria-valuetext", `Diagonal angle ${angle} degrees; width ${widthValue} D; height ${heightValue} D; area ${areaValue} D squared`);
    }

    setAttribute(root, "[data-p111-angle-arc]", "d", shape.angleArc);
    setAttribute(root, "[data-p111-angle-label]", "x", shape.angleLabel.x.toFixed(3));
    setAttribute(root, "[data-p111-angle-label]", "y", shape.angleLabel.y.toFixed(3));
    const angleLabel = root.querySelector("[data-p111-angle-label]");
    if (angleLabel) angleLabel.textContent = `θ = ${angle}°`;

    setLine(root, "[data-p111-width-dimension]", shape.left, shape.widthDimensionY, shape.right, shape.widthDimensionY);
    setLine(root, '[data-p111-width-tick="left"]', shape.left, shape.widthDimensionY - 7, shape.left, shape.widthDimensionY + 7);
    setLine(root, '[data-p111-width-tick="right"]', shape.right, shape.widthDimensionY - 7, shape.right, shape.widthDimensionY + 7);
    const widthLabel = root.querySelector("[data-p111-width-label]");
    if (widthLabel) {
      widthLabel.setAttribute("y", (shape.widthDimensionY + 17).toFixed(3));
      widthLabel.textContent = `w = ${widthValue}D`;
    }

    setLine(root, "[data-p111-height-dimension]", shape.heightDimensionX, shape.top, shape.heightDimensionX, shape.bottom);
    setLine(root, '[data-p111-height-tick="top"]', shape.heightDimensionX - 7, shape.top, shape.heightDimensionX + 7, shape.top);
    setLine(root, '[data-p111-height-tick="bottom"]', shape.heightDimensionX - 7, shape.bottom, shape.heightDimensionX + 7, shape.bottom);
    const heightLabel = root.querySelector("[data-p111-height-label]");
    if (heightLabel) {
      const labelX = shape.heightDimensionX + 15;
      heightLabel.setAttribute("x", labelX.toFixed(3));
      heightLabel.setAttribute("transform", `rotate(-90 ${labelX.toFixed(3)} ${CY})`);
      heightLabel.textContent = `h = ${heightValue}D`;
    }

    root.querySelectorAll('[data-p111-live="angle"]').forEach((node) => { node.textContent = `${angle}°`; });
    root.querySelectorAll('[data-p111-live="width"]').forEach((node) => { node.textContent = widthValue; });
    root.querySelectorAll('[data-p111-live="height"]').forEach((node) => { node.textContent = heightValue; });
    root.querySelectorAll('[data-p111-live="area"]').forEach((node) => { node.textContent = areaValue; });
    root.querySelectorAll('[data-p111-live="aspect"]').forEach((node) => { node.textContent = `w : h = ${aspectText()}`; });

    const areaFill = root.querySelector("[data-p111-area-fill]");
    if (areaFill) areaFill.style.setProperty("--p111-area", `${normalizedAreaPercent().toFixed(2)}%`);
    const description = root.querySelector("[data-p111-svg-desc]");
    if (description) description.textContent = `A rectangle has all four corners on a circular ink pad. Its diagonal makes an angle of ${angle} degrees with its width. Its width is ${widthValue} times D, its height is ${heightValue} times D, and its area is ${areaValue} times D squared. Drag the gold top-right corner or use its keyboard controls.`;

    root.querySelectorAll('[data-problem-action="p111-angle"]').forEach((button) => {
      const active = Math.abs(Number(button.dataset.p111Angle) - state.angleDeg) < 0.05;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const feedback = root.querySelector(".p111-feedback");
    if (feedback) feedback.hidden = true;
  }

  function clientPointToSvg(event, svg) {
    if (typeof svg.createSVGPoint === "function" && svg.getScreenCTM()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse());
    }
    const box = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * 640,
      y: ((event.clientY - box.top) / box.height) * 410,
    };
  }

  function setAngleFromPointer(event, svg) {
    const point = clientPointToSvg(event, svg);
    const angle = Math.atan2(CY - point.y, point.x - CX) * 180 / Math.PI;
    if (setAngle(angle)) updateAngleDom();
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p111-book-shell");
    if (!root) return;

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p111-angle") {
          if (setAngle(Number(control.dataset.p111Angle))) updateAngleDom();
          return;
        }
        if (action === "p111-reset") state = initialState();
        if (action === "p111-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p111-reveal") {
          state.revealed = true;
          state.angleDeg = 45;
          state.feedback = "";
          state.feedbackTone = "";
        }
        renderApp();
        if (action === "p111-reset") focusAfterRender('[data-problem-action="p111-reset"]');
        if (action === "p111-reveal") focusAfterRender("#p111-solution-heading");
      });
    });

    const form = root.querySelector("[data-p111-estimate-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("[data-p111-estimate-input]");
      const raw = input.value.trim();
      const estimate = Number(raw);
      if (!raw || !Number.isFinite(estimate) || estimate < 0 || estimate > 1) {
        state.estimate = "";
        state.committed = false;
        state.feedbackTone = "";
        state.feedback = "Enter a decimal from 0 to 1 for the coefficient of D².";
      } else {
        state.estimate = String(estimate);
        state.committed = true;
        if (Math.abs(estimate - 0.5) <= 0.015) {
          state.feedbackTone = "success";
          state.feedback = "Exactly the right scale: the maximum is 0.5D². Now justify why the balanced shape wins.";
        } else if (estimate > 0.5) {
          state.feedbackTone = "";
          state.feedback = "That is larger than this fixed diagonal can support. Compare 2wh with w² + h².";
        } else if (estimate >= 0.45) {
          state.feedbackTone = "";
          state.feedback = "Very close. Set the corner exactly halfway through its quarter-circle sweep and read the area again.";
        } else {
          state.feedbackTone = "";
          state.feedback = "There is room for more area. Drag from a flat rectangle towards the balanced shape and watch the area bar.";
        }
      }
      renderApp();
    });

    const svg = root.querySelector("[data-p111-svg]");
    const handle = root.querySelector("[data-p111-handle]");
    if (!svg || !handle) return;

    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      setAngleFromPointer(event, svg);
    });
    handle.addEventListener("pointermove", (event) => {
      if (handle.hasPointerCapture(event.pointerId)) setAngleFromPointer(event, svg);
    });
    handle.addEventListener("pointerup", (event) => {
      setAngleFromPointer(event, svg);
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    });
    handle.addEventListener("pointercancel", (event) => {
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    });
    handle.addEventListener("keydown", (event) => {
      let next = state.angleDeg;
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) next += 1;
      else if (["ArrowDown", "ArrowRight"].includes(event.key)) next -= 1;
      else if (event.key === "PageUp") next += 5;
      else if (event.key === "PageDown") next -= 5;
      else if (event.key === "Home") next = MIN_ANGLE;
      else if (event.key === "End") next = MAX_ANGLE;
      else return;
      event.preventDefault();
      if (setAngle(next)) updateAngleDom();
    });
  }

  window.poveyProblemPages["1.11"] = { render, bind };
}());
