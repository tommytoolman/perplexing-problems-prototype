(function registerSewageWorkerResolutionPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "3.3";
  const COVER_LENGTH = 1.2;
  const COVER_WEIGHT = 600;
  const EYE_HEIGHT = 1.8;
  const HINGE_MOMENT = 60;
  const CABLE_RATING = 500;
  const TARGET_ANGLE = 88;
  const SVG = Object.freeze({ hingeX: 180, hingeY: 340, coverPixels: 180, eyeX: 180, eyeY: 70 });
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Follow the changing cable", copy: "The cover rim moves on a circle, while the cable always points towards the fixed lifting eye." }),
    Object.freeze({ short: "Moments", title: "Measure leverage about the hinge", copy: "The hinge forces vanish from the moment equation. Cable tension, cover weight and the rusty hinge moment remain." }),
    Object.freeze({ short: "Safety", title: "Find the high-angle overload", copy: "The weight moment fades near vertical, but the hinge still resists while the cable lever arm collapses." }),
  ]);
  const hints = Object.freeze([
    "Take moments about the hinge. This removes both unknown hinge-reaction components from the equilibrium equation.",
    "If D is cable length, the cable’s perpendicular lever arm is p = LH cosθ / D. The cover weight contributes clockwise moment WL cosθ / 2.",
    "Moment balance gives T = D[WL cosθ/2 + M]/(LH cosθ). Set T = 500 N on the rising high-angle branch and solve numerically.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p33-reset">Reset</button>';

  function radians(angleDeg) {
    return angleDeg * Math.PI / 180;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function cableLength(angleDeg) {
    const angle = radians(angleDeg);
    return Math.sqrt(
      COVER_LENGTH ** 2
      + EYE_HEIGHT ** 2
      - 2 * COVER_LENGTH * EYE_HEIGHT * Math.sin(angle),
    );
  }

  function cableLeverArm(angleDeg) {
    const angle = radians(angleDeg);
    return COVER_LENGTH * EYE_HEIGHT * Math.cos(angle) / cableLength(angleDeg);
  }

  function weightMoment(angleDeg) {
    return COVER_WEIGHT * COVER_LENGTH * Math.cos(radians(angleDeg)) / 2;
  }

  function requiredTension(angleDeg) {
    const leverArm = cableLeverArm(angleDeg);
    return (weightMoment(angleDeg) + HINGE_MOMENT) / leverArm;
  }

  function solveSafeAngle() {
    let low = 0;
    let high = TARGET_ANGLE;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      const midpoint = (low + high) / 2;
      if (requiredTension(midpoint) <= CABLE_RATING) low = midpoint;
      else high = midpoint;
    }
    return (low + high) / 2;
  }

  function solveMinimumTensionAngle() {
    let low = 0;
    let high = TARGET_ANGLE;
    const ratio = (Math.sqrt(5) - 1) / 2;
    let left = high - ratio * (high - low);
    let right = low + ratio * (high - low);
    for (let iteration = 0; iteration < 90; iteration += 1) {
      if (requiredTension(left) < requiredTension(right)) {
        high = right;
        right = left;
        left = high - ratio * (high - low);
      } else {
        low = left;
        left = right;
        right = low + ratio * (high - low);
      }
    }
    return (low + high) / 2;
  }

  const SAFE_ANGLE = solveSafeAngle();
  const MINIMUM_TENSION_ANGLE = solveMinimumTensionAngle();

  const initialState = () => ({
    angleDeg: 0,
    stage: 0,
    estimate: "",
    feedback: "",
    feedbackTone: "neutral",
    committed: false,
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeEstimate(value) {
    return String(value).replace(/[^0-9.\s-]/g, "").slice(0, 16);
  }

  function clean(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function visualGeometry(angleDeg = state.angleDeg) {
    const angle = radians(angleDeg);
    const scale = SVG.coverPixels / COVER_LENGTH;
    const end = {
      x: SVG.hingeX + SVG.coverPixels * Math.cos(angle),
      y: SVG.hingeY - SVG.coverPixels * Math.sin(angle),
    };
    const midpoint = {
      x: (SVG.hingeX + end.x) / 2,
      y: (SVG.hingeY + end.y) / 2,
    };
    const eye = { x: SVG.eyeX, y: SVG.eyeY };
    const cable = { x: eye.x - end.x, y: eye.y - end.y };
    const cablePixels = Math.hypot(cable.x, cable.y);
    const cableUnit = { x: cable.x / cablePixels, y: cable.y / cablePixels };
    const tensionEnd = { x: end.x + 72 * cableUnit.x, y: end.y + 72 * cableUnit.y };
    const fromEndToHinge = { x: SVG.hingeX - end.x, y: SVG.hingeY - end.y };
    const projection = (fromEndToHinge.x * cable.x + fromEndToHinge.y * cable.y) / (cablePixels ** 2);
    const leverFoot = { x: end.x + projection * cable.x, y: end.y + projection * cable.y };
    const arcRadius = 43;
    const arcEnd = {
      x: SVG.hingeX + arcRadius * Math.cos(angle),
      y: SVG.hingeY - arcRadius * Math.sin(angle),
    };
    const safeAngle = radians(SAFE_ANGLE);
    const safeEnd = {
      x: SVG.hingeX + SVG.coverPixels * Math.cos(safeAngle),
      y: SVG.hingeY - SVG.coverPixels * Math.sin(safeAngle),
    };
    return {
      scale,
      end,
      midpoint,
      eye,
      tensionEnd,
      leverFoot,
      safeEnd,
      anglePath: `M ${SVG.hingeX + arcRadius} ${SVG.hingeY} A ${arcRadius} ${arcRadius} 0 0 0 ${clean(arcEnd.x)} ${clean(arcEnd.y)}`,
      angleLabel: {
        x: SVG.hingeX + 67 * Math.cos(angle / 2),
        y: SVG.hingeY - 67 * Math.sin(angle / 2),
      },
    };
  }

  function svgDescription() {
    const tension = requiredTension(state.angleDeg);
    return `The manhole cover is ${clean(state.angleDeg, 1)} degrees above horizontal. The winch cable runs from its outer rim to an eye above the hinge. Required cable tension is ${clean(tension, 1)} newtons, ${tension <= CABLE_RATING ? "within" : "above"} the 500 newton rating.`;
  }

  function stageControls() {
    return `
      <div class="p33-stage-controls" role="group" aria-label="Free-body analysis stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p33-stage" data-p33-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function staticsSvg() {
    const shape = visualGeometry();
    const tension = requiredTension(state.angleDeg);
    const overloaded = tension > CABLE_RATING;
    return `
      <svg class="p33-svg p33-stage-${state.stage} ${overloaded ? "is-overloaded" : "is-safe"}" data-p33-svg viewBox="0 0 680 410" role="img" aria-labelledby="p33-svg-title p33-svg-desc">
        <title id="p33-svg-title">Hinged manhole cover lifted by a winch cable</title>
        <desc id="p33-svg-desc" data-p33-svg-desc>${svgDescription()}</desc>
        <defs>
          <marker id="p33-force-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p33-tension-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p33-moment-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L8 4 L0 8 Z" /></marker>
        </defs>

        <g class="p33-setting" aria-hidden="true">
          <path class="p33-ground" d="M54 340 H626" />
          <path class="p33-sewer" d="M70 340 V382 H590 V340" />
          <line class="p33-eye-post" x1="${shape.eye.x}" y1="${shape.eye.y}" x2="${shape.eye.x}" y2="340" />
          <circle class="p33-eye" cx="${shape.eye.x}" cy="${shape.eye.y}" r="9" />
          <text x="${shape.eye.x - 30}" y="${shape.eye.y - 17}">lifting eye</text>
        </g>

        <g class="p33-threshold-geometry" aria-hidden="true">
          <line data-p33-safe-cover x1="${SVG.hingeX}" y1="${SVG.hingeY}" x2="${clean(shape.safeEnd.x)}" y2="${clean(shape.safeEnd.y)}" />
          <text x="${clean(shape.safeEnd.x + 10)}" y="${clean(shape.safeEnd.y - 4)}">500 N limit · ${clean(SAFE_ANGLE, 1)}°</text>
        </g>

        <g class="p33-moving-geometry" aria-hidden="true">
          <line class="p33-cable" data-p33-cable x1="${clean(shape.end.x)}" y1="${clean(shape.end.y)}" x2="${shape.eye.x}" y2="${shape.eye.y}" />
          <line class="p33-cover" data-p33-cover x1="${SVG.hingeX}" y1="${SVG.hingeY}" x2="${clean(shape.end.x)}" y2="${clean(shape.end.y)}" />
          <circle class="p33-hinge" cx="${SVG.hingeX}" cy="${SVG.hingeY}" r="11" />
          <circle class="p33-rim" data-p33-rim cx="${clean(shape.end.x)}" cy="${clean(shape.end.y)}" r="7" />
          <path class="p33-angle-arc" data-p33-angle-arc d="${shape.anglePath}" />
          <text class="p33-angle-label" data-p33-angle-label x="${clean(shape.angleLabel.x)}" y="${clean(shape.angleLabel.y)}">${clean(state.angleDeg, 1)}°</text>
        </g>

        <g class="p33-force-geometry" aria-hidden="true">
          <line class="p33-weight-force" data-p33-weight x1="${clean(shape.midpoint.x)}" y1="${clean(shape.midpoint.y)}" x2="${clean(shape.midpoint.x)}" y2="${clean(shape.midpoint.y + 74)}" marker-end="url(#p33-force-arrow)" />
          <text data-p33-weight-label x="${clean(shape.midpoint.x + 12)}" y="${clean(shape.midpoint.y + 52)}">W = 600 N</text>
          <line class="p33-tension-force" data-p33-tension x1="${clean(shape.end.x)}" y1="${clean(shape.end.y)}" x2="${clean(shape.tensionEnd.x)}" y2="${clean(shape.tensionEnd.y)}" marker-end="url(#p33-tension-arrow)" />
          <text data-p33-tension-label x="${clean((shape.end.x + shape.tensionEnd.x) / 2 + 10)}" y="${clean((shape.end.y + shape.tensionEnd.y) / 2 - 8)}">T</text>
          <line class="p33-lever" data-p33-lever x1="${SVG.hingeX}" y1="${SVG.hingeY}" x2="${clean(shape.leverFoot.x)}" y2="${clean(shape.leverFoot.y)}" />
          <text data-p33-lever-label x="${clean((SVG.hingeX + shape.leverFoot.x) / 2 - 16)}" y="${clean((SVG.hingeY + shape.leverFoot.y) / 2 - 8)}">p</text>
          <path class="p33-hinge-moment" d="M138 321 A47 47 0 0 1 143 372" marker-end="url(#p33-moment-arrow)" />
          <text x="83" y="392">rust: M = 60 N·m</text>
        </g>

        <g class="p33-status-badge" data-p33-svg-status transform="translate(466 46)">
          <rect width="166" height="58" rx="13" />
          <text class="p33-status-kicker" x="15" y="21">CABLE LOAD</text>
          <text class="p33-status-value" data-p33-svg-tension x="15" y="43">${clean(tension, 1)} N</text>
        </g>
      </svg>`;
  }

  function sliderMarkup() {
    return `
      <div class="p33-slider-wrap">
        <label for="p33-angle-slider"><span>Opening angle</span><strong data-p33-live="angle">${clean(state.angleDeg, 1)}°</strong></label>
        <input id="p33-angle-slider" class="p33-angle-slider" type="range" min="0" max="${TARGET_ANGLE}" step="0.1" value="${state.angleDeg}" aria-valuetext="Cover angle ${clean(state.angleDeg, 1)} degrees; tension ${clean(requiredTension(state.angleDeg), 1)} newtons" />
        <div class="p33-slider-labels"><span>closed · 0°</span><span>target · 88°</span></div>
      </div>`;
  }

  function presetButtons() {
    return `
      <div class="p33-presets" role="group" aria-label="Notable cover angles">
        <button class="chip-button p33-preset" type="button" data-problem-action="p33-angle" data-p33-angle="0">Start</button>
        <button class="chip-button p33-preset" type="button" data-problem-action="p33-angle" data-p33-angle="${clean(MINIMUM_TENSION_ANGLE, 1)}">Lightest pull</button>
        <button class="chip-button p33-preset" type="button" data-problem-action="p33-angle" data-p33-angle="${clean(SAFE_ANGLE, 1)}">Rating limit</button>
        <button class="chip-button p33-preset" type="button" data-problem-action="p33-angle" data-p33-angle="88">Target</button>
      </div>`;
  }

  function metricMarkup() {
    const tension = requiredTension(state.angleDeg);
    const margin = CABLE_RATING - tension;
    return `
      <div class="p33-metrics">
        <div><span>Cable length D</span><strong data-p33-live="length">${clean(cableLength(state.angleDeg), 3)} m</strong></div>
        <div><span>Lever arm p</span><strong data-p33-live="lever">${clean(cableLeverArm(state.angleDeg), 3)} m</strong></div>
        <div><span>Required tension</span><strong data-p33-live="tension">${clean(tension, 1)} N</strong></div>
        <div class="${margin >= 0 ? "is-safe" : "is-over"}" data-p33-margin-card><span>500 N margin</span><strong data-p33-live="margin">${margin >= 0 ? "+" : ""}${clean(margin, 1)} N</strong></div>
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p33-stage-caption" aria-live="polite">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p33-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Model complete" : "Next stage"}</button>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p33-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p33-solution" aria-labelledby="p33-solution-heading">
        <h3 id="p33-solution-heading" tabindex="-1">The cable fails just before the target</h3>
        <p>The cable length follows from the triangle between hinge, rim and lifting eye:</p>
        <div class="p33-equation">D² = L² + H² − 2LH sinθ</div>
        <p>The perpendicular cable lever arm about the hinge is <strong>p = LH cosθ / D</strong>. Balancing anticlockwise and clockwise moments gives</p>
        <div class="p33-equation">T(θ) = D[WL cosθ/2 + M] / [LH cosθ]</div>
        <ol>
          <li>At 0°, T = ${clean(requiredTension(0), 1)} N.</li>
          <li>The tension falls to ${clean(requiredTension(MINIMUM_TENSION_ANGLE), 1)} N at ${clean(MINIMUM_TENSION_ANGLE, 2)}°.</li>
          <li>At 88°, T = ${clean(requiredTension(88), 1)} N, so the 500 N cable is overloaded by ${clean(requiredTension(88) - CABLE_RATING, 1)} N.</li>
        </ol>
        <p>Solving T(θ) = 500 N on the rising branch gives <strong>θ = ${clean(SAFE_ANGLE, 3)}°</strong>. The requested 88° opening is therefore unsafe.</p>
        <p class="p33-insight">Near vertical, the weight moment tends to zero—but the 60 N·m rusty-hinge moment remains while the cable lever arm tends to zero. That is why T eventually diverges.</p>
      </section>`;
  }

  function stateSnapshot() {
    const tension = requiredTension(state.angleDeg);
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      angleDegrees: Number(state.angleDeg.toFixed(1)),
      cableLengthMetres: Number(cableLength(state.angleDeg).toFixed(4)),
      cableLeverArmMetres: Number(cableLeverArm(state.angleDeg).toFixed(4)),
      requiredTensionNewtons: Number(tension.toFixed(2)),
      cableRatingNewtons: CABLE_RATING,
      withinRating: tension <= CABLE_RATING,
      solvedSafeAngleDegrees: Number(SAFE_ANGLE.toFixed(4)),
      analysisStage: state.stage + 1,
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell stat3-shell p33-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread stat3-spread p33-spread">
          <article class="book-page p33-problem-page">
            <div class="problem-number">Problem 3.3</div>
            <h1 class="book-title stat3-title p33-title">Sewage worker’s resolution</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="stat3-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>
            <p class="problem-copy">The 1.2 m uniform manhole cover weighs 600 N. A winch cable joins its outer rim to a lifting eye 1.8 m directly above the hinge.</p>
            <p class="problem-copy">The rusty hinge exerts a constant 60 N·m moment opposing opening. The cable is rated to 500 N. Can the cover reach 88° safely? Find its greatest safe angle.</p>
            <section class="p33-data-card" aria-labelledby="p33-data-title">
              <div class="eyebrow" id="p33-data-title">Known data</div>
              <dl><div><dt>L</dt><dd>1.2 m</dd></div><div><dt>W</dt><dd>600 N</dd></div><div><dt>H</dt><dd>1.8 m</dd></div><div><dt>M</dt><dd>60 N·m</dd></div><div><dt>T<sub>max</sub></dt><dd>500 N</dd></div></dl>
            </section>
            <section class="p33-assumption-card">
              <strong>Quasi-static lift</strong>
              <p>At every angle the cover is momentarily at rest. Cable mass, cover thickness and hinge translation are neglected; the hinge’s resisting moment stays constant.</p>
            </section>
          </article>

          <section class="book-page book-stage stat3-stage p33-stage">
            ${stageControls()}
            <div class="p33-visual-card">
              ${staticsSvg()}
              ${stageCaption()}
            </div>
            ${sliderMarkup()}
            ${presetButtons()}
            ${metricMarkup()}
          </section>

          <aside class="book-page book-coach p33-coach">
            <div class="coach-kicker">Resolve the whole lift</div>
            <p class="coach-question">At what opening angle does the required tension first climb back to 500 N?</p>
            <p class="p33-coach-copy">Do not assume the horizontal start is the hardest point. Follow both the load moment and the cable’s changing leverage.</p>
            <form class="p33-answer-form" data-p33-answer-form novalidate>
              <label for="p33-estimate">Greatest safe opening angle</label>
              <div><input id="p33-estimate" type="text" inputmode="decimal" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 86.5" autocomplete="off" /><span>degrees</span></div>
              <button class="primary-button" type="submit">Check resolution</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p33-help-row">
              <button class="secondary-button" type="button" data-problem-action="p33-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p33-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="stat3-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function setAttributes(root, selector, attributes) {
    root.querySelectorAll(selector).forEach((node) => {
      Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
    });
  }

  function setText(root, selector, value) {
    root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  }

  function updateAngleDom() {
    const root = document.querySelector(".p33-shell");
    if (!root) return;
    const shape = visualGeometry();
    const tension = requiredTension(state.angleDeg);
    const margin = CABLE_RATING - tension;
    setAttributes(root, "[data-p33-cable]", { x1: clean(shape.end.x), y1: clean(shape.end.y) });
    setAttributes(root, "[data-p33-cover]", { x2: clean(shape.end.x), y2: clean(shape.end.y) });
    setAttributes(root, "[data-p33-rim]", { cx: clean(shape.end.x), cy: clean(shape.end.y) });
    setAttributes(root, "[data-p33-angle-arc]", { d: shape.anglePath });
    setAttributes(root, "[data-p33-angle-label]", { x: clean(shape.angleLabel.x), y: clean(shape.angleLabel.y) });
    setAttributes(root, "[data-p33-weight]", { x1: clean(shape.midpoint.x), y1: clean(shape.midpoint.y), x2: clean(shape.midpoint.x), y2: clean(shape.midpoint.y + 74) });
    setAttributes(root, "[data-p33-weight-label]", { x: clean(shape.midpoint.x + 12), y: clean(shape.midpoint.y + 52) });
    setAttributes(root, "[data-p33-tension]", { x1: clean(shape.end.x), y1: clean(shape.end.y), x2: clean(shape.tensionEnd.x), y2: clean(shape.tensionEnd.y) });
    setAttributes(root, "[data-p33-tension-label]", { x: clean((shape.end.x + shape.tensionEnd.x) / 2 + 10), y: clean((shape.end.y + shape.tensionEnd.y) / 2 - 8) });
    setAttributes(root, "[data-p33-lever]", { x2: clean(shape.leverFoot.x), y2: clean(shape.leverFoot.y) });
    setAttributes(root, "[data-p33-lever-label]", { x: clean((SVG.hingeX + shape.leverFoot.x) / 2 - 16), y: clean((SVG.hingeY + shape.leverFoot.y) / 2 - 8) });
    setText(root, "[data-p33-angle-label]", `${clean(state.angleDeg, 1)}°`);
    setText(root, '[data-p33-live="angle"]', `${clean(state.angleDeg, 1)}°`);
    setText(root, '[data-p33-live="length"]', `${clean(cableLength(state.angleDeg), 3)} m`);
    setText(root, '[data-p33-live="lever"]', `${clean(cableLeverArm(state.angleDeg), 3)} m`);
    setText(root, '[data-p33-live="tension"]', `${clean(tension, 1)} N`);
    setText(root, '[data-p33-live="margin"]', `${margin >= 0 ? "+" : ""}${clean(margin, 1)} N`);
    setText(root, "[data-p33-svg-tension]", `${clean(tension, 1)} N`);
    setText(root, "[data-p33-svg-desc]", svgDescription());
    const slider = root.querySelector("#p33-angle-slider");
    slider?.setAttribute("aria-valuetext", `Cover angle ${clean(state.angleDeg, 1)} degrees; tension ${clean(tension, 1)} newtons`);
    const svg = root.querySelector("[data-p33-svg]");
    svg?.classList.toggle("is-overloaded", margin < 0);
    svg?.classList.toggle("is-safe", margin >= 0);
    const marginCard = root.querySelector("[data-p33-margin-card]");
    marginCard?.classList.toggle("is-over", margin < 0);
    marginCard?.classList.toggle("is-safe", margin >= 0);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p33-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p33-angle-slider");
          return;
        }
        if (action === "p33-stage") {
          state.stage = clamp(Number(control.dataset.p33Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p33-stage="${state.stage}"]`);
          return;
        }
        if (action === "p33-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p33-stage="${state.stage}"]`);
          return;
        }
        if (action === "p33-angle") {
          state.angleDeg = clamp(Number(control.dataset.p33Angle), 0, TARGET_ANGLE);
          renderAndFocus(renderApp, `#p33-angle-slider`);
          return;
        }
        if (action === "p33-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p33-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p33-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p33-solution-heading")?.focus());
        }
      });
    });

    const angleSlider = document.querySelector("#p33-angle-slider");
    angleSlider?.addEventListener("input", (event) => {
      state.angleDeg = clamp(Number(event.target.value), 0, TARGET_ANGLE);
      updateAngleDom();
    });

    const estimateInput = document.querySelector("#p33-estimate");
    estimateInput?.addEventListener("input", (event) => {
      state.estimate = sanitizeEstimate(event.target.value);
      state.feedback = "";
      state.feedbackTone = "neutral";
      state.committed = false;
    });

    const answerForm = document.querySelector("[data-p33-answer-form]");
    answerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.estimate = sanitizeEstimate(estimateInput?.value).trim();
      const estimate = Number(state.estimate);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.estimate || !Number.isFinite(estimate) || estimate < 0 || estimate > TARGET_ANGLE) {
        state.feedback = "Enter an angle from 0° to 88°.";
      } else if (Math.abs(estimate - SAFE_ANGLE) <= 0.15) {
        state.committed = true;
        state.feedbackTone = "success";
        state.feedback = `Correct: the 500 N threshold is ${clean(SAFE_ANGLE, 3)}°. The 88° target would overload the cable.`;
      } else if (estimate >= TARGET_ANGLE - 0.05) {
        state.committed = true;
        state.feedback = `At 88°, the required tension is ${clean(requiredTension(88), 1)} N—${clean(requiredTension(88) - CABLE_RATING, 1)} N above the rating.`;
      } else if (estimate < SAFE_ANGLE) {
        state.committed = true;
        state.feedback = "That angle is safe, but not the greatest safe angle. Follow the rising branch closer to vertical.";
      } else {
        state.committed = true;
        state.feedback = "That angle already exceeds 500 N. Move slightly farther from the 88° target.";
      }
      renderAndFocus(renderApp, "#p33-estimate");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
