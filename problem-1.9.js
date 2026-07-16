(function registerSemicircleTrianglePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const MIN_ANGLE = 5;
  const MAX_ANGLE = 175;
  const KEY_STEP = 1;
  const PAGE_STEP = 10;
  const SVG = Object.freeze({ centreX: 320, centreY: 224, radius: 174 });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p19-reset">Reset</button>';

  const hints = [
    "Put O at the origin. If B has position vector a, what is the position vector of the diametrically opposite point A?",
    "Write each directed side as end minus start: AP = p - (-a), and BP = p - a.",
    "Take (p + a) · (p - a). Expand it, then use the commutative property to cancel the two cross terms.",
    "P and B lie on the same circle centred at O, so |p| = |a|. What does a zero dot product say about two nonzero vectors?",
  ];

  const stages = [
    {
      short: "Triangle",
      title: "Start with the angle at P",
      copy: "Drag P around the bold semicircular arc. The triangle changes shape, but the claim says its included angle does not.",
      equation: "Prove: θ = ∠APB = π/2",
    },
    {
      short: "Positions",
      title: "Name the three position vectors",
      copy: "Put O at the origin. The diameter endpoints are opposites: B is a and A is -a. The moving radius is p.",
      equation: "OA = -a   ·   OB = a   ·   OP = p",
    },
    {
      short: "Sides",
      title: "Subtract start from end",
      copy: "Both directed side vectors point towards P. Reversing both later will not change the angle between them.",
      equation: "AP = p + a   ·   BP = p - a",
    },
    {
      short: "Dot product",
      title: "Equal radii force a zero dot product",
      copy: "The mixed terms cancel, and the two remaining squared lengths are equal because both are radii.",
      equation: "(p + a) · (p - a) = |p|² - |a|² = 0",
    },
  ];

  const initialState = () => ({
    angleDeg: 58,
    step: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function cleanNumber(value, digits = 3) {
    const rounded = Math.abs(value) < 0.5 * (10 ** -digits) ? 0 : value;
    return Number(rounded).toFixed(digits);
  }

  function formatAngle(value = state.angleDeg) {
    return Math.abs(value - Math.round(value)) < 0.00001
      ? String(Math.round(value))
      : Number(value).toFixed(1);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function setAngle(value) {
    state.angleDeg = Math.round(clamp(value, MIN_ANGLE, MAX_ANGLE) * 10) / 10;
  }

  function unitVector(x, y) {
    const length = Math.hypot(x, y);
    return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
  }

  function labelBesideLine(start, end, offset) {
    const direction = unitVector(end.x - start.x, end.y - start.y);
    return {
      x: (start.x + end.x) / 2 - direction.y * offset,
      y: (start.y + end.y) / 2 + direction.x * offset,
    };
  }

  function geometry(angleDeg = state.angleDeg) {
    const phi = (angleDeg * Math.PI) / 180;
    const pointUnit = { x: Math.cos(phi), y: Math.sin(phi) };
    const centre = { x: SVG.centreX, y: SVG.centreY };
    const a = { x: SVG.centreX - SVG.radius, y: SVG.centreY };
    const b = { x: SVG.centreX + SVG.radius, y: SVG.centreY };
    const p = {
      x: SVG.centreX + SVG.radius * pointUnit.x,
      y: SVG.centreY - SVG.radius * pointUnit.y,
    };
    const towardA = unitVector(a.x - p.x, a.y - p.y);
    const towardB = unitVector(b.x - p.x, b.y - p.y);
    const bisector = unitVector(towardA.x + towardB.x, towardA.y + towardB.y);
    const angleRadius = 27;
    const angleStart = {
      x: p.x + towardA.x * angleRadius,
      y: p.y + towardA.y * angleRadius,
    };
    const angleEnd = {
      x: p.x + towardB.x * angleRadius,
      y: p.y + towardB.y * angleRadius,
    };
    const angleControl = {
      x: p.x + bisector.x * angleRadius * Math.SQRT2,
      y: p.y + bisector.y * angleRadius * Math.SQRT2,
    };
    const angleLabel = {
      x: p.x + bisector.x * 47,
      y: p.y + bisector.y * 47,
    };
    const rightSize = 17;
    const rightStart = {
      x: p.x + towardA.x * rightSize,
      y: p.y + towardA.y * rightSize,
    };
    const rightCorner = {
      x: p.x + (towardA.x + towardB.x) * rightSize,
      y: p.y + (towardA.y + towardB.y) * rightSize,
    };
    const rightEnd = {
      x: p.x + towardB.x * rightSize,
      y: p.y + towardB.y * rightSize,
    };
    const outward = unitVector(p.x - centre.x, p.y - centre.y);
    const pLabel = { x: p.x + outward.x * 22, y: p.y + outward.y * 22 };
    const positionPLabel = labelBesideLine(centre, p, 15);
    const sideALabel = labelBesideLine(a, p, -16);
    const sideBLabel = labelBesideLine(b, p, 16);
    const sideAUnit = { x: pointUnit.x + 1, y: pointUnit.y };
    const sideBUnit = { x: pointUnit.x - 1, y: pointUnit.y };
    const dotProduct = sideAUnit.x * sideBUnit.x + sideAUnit.y * sideBUnit.y;
    const sideALength = Math.hypot(sideAUnit.x, sideAUnit.y);
    const sideBLength = Math.hypot(sideBUnit.x, sideBUnit.y);
    const includedAngle = Math.acos(clamp(dotProduct / (sideALength * sideBLength), -1, 1)) * 180 / Math.PI;

    return {
      phi,
      pointUnit,
      centre,
      a,
      b,
      p,
      pLabel,
      positionPLabel,
      sideALabel,
      sideBLabel,
      sideAUnit,
      sideBUnit,
      sideALength,
      sideBLength,
      dotProduct,
      includedAngle,
      angleLabel,
      anglePath: `M${cleanNumber(angleStart.x)} ${cleanNumber(angleStart.y)} Q${cleanNumber(angleControl.x)} ${cleanNumber(angleControl.y)} ${cleanNumber(angleEnd.x)} ${cleanNumber(angleEnd.y)}`,
      rightAnglePath: `M${cleanNumber(rightStart.x)} ${cleanNumber(rightStart.y)} L${cleanNumber(rightCorner.x)} ${cleanNumber(rightCorner.y)} L${cleanNumber(rightEnd.x)} ${cleanNumber(rightEnd.y)}`,
    };
  }

  function pointList(points) {
    return points.map((point) => `${cleanNumber(point.x)},${cleanNumber(point.y)}`).join(" ");
  }

  function vectorText(vector) {
    return `(${cleanNumber(vector.x)}, ${cleanNumber(vector.y)})`;
  }

  function svgDescription(shape = geometry()) {
    return `Point P is ${formatAngle()} degrees counterclockwise from B on the open upper semicircular arc. Construction stage ${state.step + 1} of 4 is ${stages[state.step].short}. The endpoints A and B are excluded so the triangle remains non-degenerate.`;
  }

  function positionVectorsMarkup(shape) {
    if (state.step < 1) return "";
    return `
      <g class="p19-position-vectors" aria-hidden="true">
        <line x1="${shape.centre.x}" y1="${shape.centre.y}" x2="${shape.a.x}" y2="${shape.a.y}" marker-end="url(#p19-position-arrow)" />
        <line x1="${shape.centre.x}" y1="${shape.centre.y}" x2="${shape.b.x}" y2="${shape.b.y}" marker-end="url(#p19-position-arrow)" />
        <line data-p19-position-p x1="${shape.centre.x}" y1="${shape.centre.y}" x2="${cleanNumber(shape.p.x)}" y2="${cleanNumber(shape.p.y)}" marker-end="url(#p19-position-arrow)" />
        <text class="p19-vector-label" x="218" y="247">-a</text>
        <text class="p19-vector-label" x="417" y="247">a</text>
        <text class="p19-vector-label" data-p19-position-p-label x="${cleanNumber(shape.positionPLabel.x)}" y="${cleanNumber(shape.positionPLabel.y)}">p</text>
      </g>`;
  }

  function sideVectorsMarkup(shape) {
    if (state.step < 2) return "";
    return `
      <g class="p19-side-vectors" aria-hidden="true">
        <line data-p19-side-a x1="${shape.a.x}" y1="${shape.a.y}" x2="${cleanNumber(shape.p.x)}" y2="${cleanNumber(shape.p.y)}" marker-end="url(#p19-side-arrow)" />
        <line data-p19-side-b x1="${shape.b.x}" y1="${shape.b.y}" x2="${cleanNumber(shape.p.x)}" y2="${cleanNumber(shape.p.y)}" marker-end="url(#p19-side-arrow)" />
        <text class="p19-side-label" data-p19-side-a-label x="${cleanNumber(shape.sideALabel.x)}" y="${cleanNumber(shape.sideALabel.y)}">p + a</text>
        <text class="p19-side-label" data-p19-side-b-label x="${cleanNumber(shape.sideBLabel.x)}" y="${cleanNumber(shape.sideBLabel.y)}">p - a</text>
      </g>`;
  }

  function angleMarkup(shape) {
    if (state.step >= 3) {
      return `
        <g class="p19-right-angle" aria-hidden="true">
          <path data-p19-right-angle d="${shape.rightAnglePath}" />
          <text data-p19-angle-label x="${cleanNumber(shape.angleLabel.x)}" y="${cleanNumber(shape.angleLabel.y)}">90°</text>
        </g>`;
    }
    return `
      <g class="p19-unknown-angle" aria-hidden="true">
        <path data-p19-angle-arc d="${shape.anglePath}" />
        <text data-p19-angle-label x="${cleanNumber(shape.angleLabel.x)}" y="${cleanNumber(shape.angleLabel.y)}">θ</text>
      </g>`;
  }

  function constructionSvg() {
    const shape = geometry();
    return `
      <svg class="route-svg p19-svg p19-stage-${state.step}" data-p19-svg viewBox="0 0 640 420" role="img" aria-labelledby="p19-svg-title p19-svg-desc">
        <title id="p19-svg-title">Triangle on a semicircular arc</title>
        <desc id="p19-svg-desc" data-p19-svg-desc>${svgDescription(shape)}</desc>
        <defs>
          <marker id="p19-position-arrow" markerWidth="9" markerHeight="9" refX="7.2" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0 0 L9 4.5 L0 9 Z" />
          </marker>
          <marker id="p19-side-arrow" markerWidth="9" markerHeight="9" refX="7.2" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0 0 L9 4.5 L0 9 Z" />
          </marker>
        </defs>

        <g class="p19-reference-geometry" aria-hidden="true">
          <circle class="p19-circle-reference" cx="${SVG.centreX}" cy="${SVG.centreY}" r="${SVG.radius}" />
          <path class="p19-active-arc" d="M${SVG.centreX - SVG.radius} ${SVG.centreY} A${SVG.radius} ${SVG.radius} 0 0 1 ${SVG.centreX + SVG.radius} ${SVG.centreY}" />
          <polygon class="p19-triangle" data-p19-triangle points="${pointList([shape.a, shape.p, shape.b])}" />
          <line class="p19-diameter" x1="${shape.a.x}" y1="${shape.a.y}" x2="${shape.b.x}" y2="${shape.b.y}" />
          <line class="p19-chord" data-p19-chord-a x1="${shape.a.x}" y1="${shape.a.y}" x2="${cleanNumber(shape.p.x)}" y2="${cleanNumber(shape.p.y)}" />
          <line class="p19-chord" data-p19-chord-b x1="${shape.b.x}" y1="${shape.b.y}" x2="${cleanNumber(shape.p.x)}" y2="${cleanNumber(shape.p.y)}" />
        </g>

        ${positionVectorsMarkup(shape)}
        ${sideVectorsMarkup(shape)}
        ${angleMarkup(shape)}

        <g class="p19-points" aria-hidden="true">
          <circle cx="${shape.a.x}" cy="${shape.a.y}" r="5" />
          <circle cx="${shape.b.x}" cy="${shape.b.y}" r="5" />
          <circle cx="${shape.centre.x}" cy="${shape.centre.y}" r="4" />
          <circle data-p19-point cx="${cleanNumber(shape.p.x)}" cy="${cleanNumber(shape.p.y)}" r="7" />
          <text x="127" y="247">A</text>
          <text x="502" y="247">B</text>
          <text x="311" y="247">O</text>
          <text data-p19-point-label x="${cleanNumber(shape.pLabel.x)}" y="${cleanNumber(shape.pLabel.y)}">P</text>
        </g>

        <circle
          class="p19-drag-zone"
          data-p19-drag-zone
          cx="${cleanNumber(shape.p.x)}"
          cy="${cleanNumber(shape.p.y)}"
          r="29"
          role="slider"
          tabindex="0"
          focusable="true"
          aria-label="Point P position on the semicircular arc"
          aria-describedby="p19-drag-help"
          aria-valuemin="${MIN_ANGLE}"
          aria-valuemax="${MAX_ANGLE}"
          aria-valuenow="${formatAngle()}"
          aria-valuetext="P is ${formatAngle()} degrees counterclockwise from B; endpoints are excluded"
        />
      </svg>`;
  }

  function stageControls() {
    return `
      <div class="p19-stage-controls" aria-label="Vector proof construction stages">
        ${stages.map((stage, index) => {
          const locked = index === 3 && !state.revealed;
          return `
            <button
              class="chip-button p19-stage-button ${state.step === index ? "active" : ""}"
              type="button"
              data-problem-action="p19-stage"
              data-p19-step="${index}"
              ${state.step === index ? 'aria-current="step"' : ""}
              ${locked ? 'disabled aria-label="Dot product stage, unlocks on reveal"' : ""}
            ><span>${index + 1}</span>${stage.short}${locked ? '<span class="p19-lock" aria-hidden="true">●</span>' : ""}</button>`;
        }).join("")}
      </div>`;
  }

  function positionPresets() {
    const presets = [
      { angle: 25, label: "Near B" },
      { angle: 90, label: "High point" },
      { angle: 155, label: "Near A" },
    ];
    return `
      <div class="p19-presets" aria-label="Point P position presets">
        ${presets.map(({ angle, label }) => `
          <button class="chip-button ${Math.abs(state.angleDeg - angle) < 0.05 ? "active" : ""}" type="button" data-problem-action="p19-position" data-p19-angle="${angle}">${label}</button>`).join("")}
      </div>`;
  }

  function coordinateReadout() {
    const shape = geometry();
    const rows = [
      `<div><small>Arc position φ</small><strong data-p19-live="angle">${formatAngle()}°</strong></div>`,
    ];
    if (state.step >= 1) {
      rows.push(`<div><small>p, with R = 1</small><strong data-p19-live="point-vector">${vectorText(shape.pointUnit)}</strong></div>`);
    }
    if (state.step >= 2) {
      rows.push(`<div><small>p + a</small><strong data-p19-live="side-a">${vectorText(shape.sideAUnit)}</strong></div>`);
      rows.push(`<div><small>p - a</small><strong data-p19-live="side-b">${vectorText(shape.sideBUnit)}</strong></div>`);
    }
    if (state.step >= 3) {
      rows.push(`<div class="p19-dot-readout"><small>Dot product</small><strong data-p19-live="dot">${cleanNumber(shape.dotProduct, 6)}</strong></div>`);
    }
    return `<div class="p19-coordinate-readout p19-readout-step-${state.step}" data-p19-coordinate-readout aria-live="polite">${rows.join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p19-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p19-hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p19-solution" aria-labelledby="p19-solution-heading">
        <h2 id="p19-solution-heading" tabindex="-1">Equal radii make the cross terms disappear</h2>
        <p>Put O at the origin. Represent B by <strong>a</strong>, so A is <strong>-a</strong>, and represent P by <strong>p</strong>. The directed sides towards P are</p>
        <div class="equation">AP = p - (-a) = p + a</div>
        <div class="equation">BP = p - a</div>
        <div class="equation p19-long-equation">(p + a) · (p - a)<br>= p · p - p · a + a · p - a · a</div>
        <p>The mixed terms cancel because the dot product is commutative. Also, OP and OB are radii of the same circle, so <strong>|p| = |a| = R</strong>.</p>
        <div class="equation">= |p|² - |a|² = R² - R² = 0</div>
        <div class="equation">0 = |AP||BP| cos θ &nbsp;⇒&nbsp; θ = π/2</div>
        <p class="p19-direction-note">The calculated vectors both point towards P. Reversing both to form the rays from P leaves their mutual angle unchanged.</p>
        <p class="p19-boundary-note"><strong>Boundary:</strong> P = A and P = B are excluded. At either endpoint the triangle collapses and one side vector is zero.</p>
      </section>`;
  }

  function stateSnapshot() {
    const shape = geometry();
    return JSON.stringify(
      {
        problem: "1.9",
        constructionStage: state.step + 1,
        pointAngleFromBDegrees: state.angleDeg,
        normalizedPointVector: [
          Number(shape.pointUnit.x.toFixed(6)),
          Number(shape.pointUnit.y.toFixed(6)),
        ],
        normalizedDotProduct: Number(shape.dotProduct.toFixed(12)),
        includedAngleDegrees: Number(shape.includedAngle.toFixed(9)),
        estimateDegrees: state.estimate === "" ? null : Number(state.estimate),
        committed: state.committed,
        hintsUsed: state.hintsUsed,
        solutionRevealed: state.revealed,
        endpointsExcluded: true,
      },
      null,
      2,
    );
  }

  function render() {
    const stage = stages[state.step];
    return `
      <main class="book-shell p19-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p19-progress"><span></span></div></div>
          ${problemHeaderActions("1.9", resetMarkup)}
        </header>

        <div class="book-spread p19-spread">
          <article class="book-page p19-problem-page">
            <div class="problem-number">Problem 1.9</div>
            <h1 class="book-title p19-book-title">Triangle inscribed within semicircle</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="p19-source-intro">This little problem is an exercise in using vectors.</p>
            <p class="problem-copy">Give a vector proof that for a triangle inscribed within a semicircle, the included angle <span class="p19-nowrap">∠APB</span> is always <span class="p19-nowrap">π/2</span>.</p>
            <div class="p19-clarification">
              <strong>The construction</strong>
              <span>AB is a diameter, O is the centre, and P may move anywhere on the open semicircular arc.</span>
            </div>
            <section class="prediction-box p19-prediction">
              <div class="eyebrow">Before the algebra</div>
              <p>The claim says 90°. Does this deliberately asymmetric drawing look exact, or merely close? Make a visual estimate, then move P.</p>
            </section>
          </article>

          <section class="book-page book-stage p19-stage">
            ${stageControls()}
            ${constructionSvg()}
            <div class="book-stage-caption p19-stage-caption" aria-live="polite">
              <div><div class="eyebrow">Stage ${state.step + 1} of 4</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
              <div class="p19-stage-equation">${stage.equation}</div>
            </div>
            <div class="p19-position-row">
              <p id="p19-drag-help"><strong>Move P:</strong> drag the point on the arc, or focus it and use Arrow, Page Up/Down, Home, and End. Endpoints stay excluded.</p>
              ${positionPresets()}
            </div>
            ${coordinateReadout()}
          </section>

          <aside class="book-page book-coach p19-coach">
            <div class="coach-kicker">Visual check</div>
            <p class="coach-question">What angle does ∠APB look like in the current drawing?</p>
            <form class="estimate-form p19-estimate-form" data-p19-estimate-form novalidate>
              <label for="p19-estimate">Your angle estimate</label>
              <div class="estimate-field"><input id="p19-estimate" class="estimate-input p19-estimate-input" inputmode="decimal" type="number" min="0" max="180" step="1" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 88" /><span>degrees</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row p19-help-row">
              <button class="secondary-button" type="button" data-problem-action="p19-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p19-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Proof revealed" : "Reveal"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.9")}
      </main>`;
  }

  function updateLiveGeometry() {
    const root = document.querySelector(".p19-book-shell");
    if (!root) return;
    const shape = geometry();
    const setAttributes = (selector, attributes) => {
      root.querySelectorAll(selector).forEach((node) => {
        Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
      });
    };
    const setText = (selector, value) => {
      root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
    };

    setAttributes("[data-p19-triangle]", { points: pointList([shape.a, shape.p, shape.b]) });
    setAttributes("[data-p19-chord-a]", { x2: cleanNumber(shape.p.x), y2: cleanNumber(shape.p.y) });
    setAttributes("[data-p19-chord-b]", { x2: cleanNumber(shape.p.x), y2: cleanNumber(shape.p.y) });
    setAttributes("[data-p19-position-p]", { x2: cleanNumber(shape.p.x), y2: cleanNumber(shape.p.y) });
    setAttributes("[data-p19-side-a]", { x2: cleanNumber(shape.p.x), y2: cleanNumber(shape.p.y) });
    setAttributes("[data-p19-side-b]", { x2: cleanNumber(shape.p.x), y2: cleanNumber(shape.p.y) });
    setAttributes("[data-p19-point]", { cx: cleanNumber(shape.p.x), cy: cleanNumber(shape.p.y) });
    setAttributes("[data-p19-point-label]", { x: cleanNumber(shape.pLabel.x), y: cleanNumber(shape.pLabel.y) });
    setAttributes("[data-p19-position-p-label]", { x: cleanNumber(shape.positionPLabel.x), y: cleanNumber(shape.positionPLabel.y) });
    setAttributes("[data-p19-side-a-label]", { x: cleanNumber(shape.sideALabel.x), y: cleanNumber(shape.sideALabel.y) });
    setAttributes("[data-p19-side-b-label]", { x: cleanNumber(shape.sideBLabel.x), y: cleanNumber(shape.sideBLabel.y) });
    setAttributes("[data-p19-angle-arc]", { d: shape.anglePath });
    setAttributes("[data-p19-right-angle]", { d: shape.rightAnglePath });
    setAttributes("[data-p19-angle-label]", { x: cleanNumber(shape.angleLabel.x), y: cleanNumber(shape.angleLabel.y) });
    setAttributes("[data-p19-drag-zone]", {
      cx: cleanNumber(shape.p.x),
      cy: cleanNumber(shape.p.y),
      "aria-valuenow": formatAngle(),
      "aria-valuetext": `P is ${formatAngle()} degrees counterclockwise from B; endpoints are excluded`,
    });

    setText("[data-p19-svg-desc]", svgDescription(shape));
    setText('[data-p19-live="angle"]', `${formatAngle()}°`);
    setText('[data-p19-live="point-vector"]', vectorText(shape.pointUnit));
    setText('[data-p19-live="side-a"]', vectorText(shape.sideAUnit));
    setText('[data-p19-live="side-b"]', vectorText(shape.sideBUnit));
    setText('[data-p19-live="dot"]', cleanNumber(shape.dotProduct, 6));
  }

  function pointerInSvg(event, svg) {
    if (typeof svg.createSVGPoint === "function" && svg.getScreenCTM()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse());
    }
    const bounds = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 640,
      y: ((event.clientY - bounds.top) / bounds.height) * 420,
    };
  }

  function setAngleFromPointer(event, svg) {
    const point = pointerInSvg(event, svg);
    let radians = Math.atan2(SVG.centreY - point.y, point.x - SVG.centreX);
    if (radians < 0) radians = point.x < SVG.centreX ? Math.PI : 0;
    setAngle((radians * 180) / Math.PI);
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
        if (action === "p19-reset") state = initialState();
        if (action === "p19-stage") {
          const nextStep = clamp(Number(control.dataset.p19Step), 0, 3);
          if (nextStep < 3 || state.revealed) state.step = nextStep;
        }
        if (action === "p19-position") setAngle(Number(control.dataset.p19Angle));
        if (action === "p19-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p19-reveal") {
          state.revealed = true;
          state.step = 3;
        }
        renderApp();
        if (action === "p19-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p19-solution-heading")?.focus());
        }
      });
    });

    const estimateForm = document.querySelector("[data-p19-estimate-form]");
    const estimateInput = document.querySelector("#p19-estimate");
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
      if (!raw || !Number.isFinite(estimate) || estimate < 0 || estimate > 180) {
        state.committed = false;
        state.feedback = "Enter an angle from 0° to 180° first.";
      } else {
        state.committed = true;
        if (Math.abs(estimate - 90) <= 2) {
          state.feedbackTone = "success";
          state.feedback = "Excellent visual estimate - you are within 2° of the invariant angle.";
        } else if (estimate < 90) {
          state.feedback = "Your estimate is acute. Drag P near either end: the triangle looks very different, but watch what happens to the angle at P.";
        } else {
          state.feedback = "Your estimate is obtuse. Try comparing the two side directions, then build their dot product.";
        }
      }
      renderApp();
    });

    const dragTarget = document.querySelector("[data-p19-drag-zone]");
    const svg = document.querySelector("[data-p19-svg]");
    if (!dragTarget || !svg) return;

    dragTarget.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      dragTarget.setPointerCapture(event.pointerId);
      setAngleFromPointer(event, svg);
    });
    dragTarget.addEventListener("pointermove", (event) => {
      if (dragTarget.hasPointerCapture(event.pointerId)) setAngleFromPointer(event, svg);
    });
    dragTarget.addEventListener("pointerup", (event) => {
      setAngleFromPointer(event, svg);
      if (dragTarget.hasPointerCapture(event.pointerId)) dragTarget.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-p19-drag-zone]");
    });
    dragTarget.addEventListener("pointercancel", (event) => {
      if (dragTarget.hasPointerCapture(event.pointerId)) dragTarget.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-p19-drag-zone]");
    });
    dragTarget.addEventListener("keydown", (event) => {
      let next = state.angleDeg;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next += KEY_STEP;
      else if (event.key === "ArrowRight" || event.key === "ArrowDown") next -= KEY_STEP;
      else if (event.key === "PageUp") next += PAGE_STEP;
      else if (event.key === "PageDown") next -= PAGE_STEP;
      else if (event.key === "Home") next = MIN_ANGLE;
      else if (event.key === "End") next = MAX_ANGLE;
      else return;
      event.preventDefault();
      setAngle(next);
      renderAndFocus(renderApp, "[data-p19-drag-zone]");
    });
  }

  window.poveyProblemPages["1.9"] = { render, bind };
}());
