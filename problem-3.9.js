(function registerRavineBridgePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "3.9";
  const BRIDGE_LENGTH = 12;
  const RAVINE_WIDTH = 6;
  const BRIDGE_WEIGHT = 1.2;
  const TRAVELLER_WEIGHT = 0.8;
  const SVG = Object.freeze({ supportAX: 250, supportBX: 460, beamY: 154, scale: 35 });
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Slide the bridge, not the ravine", copy: "Near overlap s fixes support positions A = s and B = s + 6 when measured from the bridge’s left end." }),
    Object.freeze({ short: "Reactions", title: "Resolve both ledge reactions", copy: "Vertical force balance and one moment equation determine RA and RB. A negative result means that ledge would need to pull." }),
    Object.freeze({ short: "Limits", title: "Protect the entire crossing", copy: "The traveller must be safe at both ends, so both endpoint reaction tests constrain the overlap." }),
  ]);
  const hints = Object.freeze([
    "Let A=s and B=s+6 be support positions along the 12 m bridge. Use RA+RB=W+P and take moments about A.",
    "RB=[W(6−s)+P(x−s)]/6 and RA=W+P−RB. Contact is possible only while both reactions are non-negative.",
    "Test the whole journey at its two extremes: RA≥0 at x=12 gives s≥2.4 m, while RB≥0 at x=0 gives s≤3.6 m.",
  ]);
  const MIN_FULL_CROSSING_OVERLAP = (BRIDGE_LENGTH - RAVINE_WIDTH) * TRAVELLER_WEIGHT / (BRIDGE_WEIGHT + TRAVELLER_WEIGHT);
  const MAX_FULL_CROSSING_OVERLAP = BRIDGE_WEIGHT * BRIDGE_LENGTH / (2 * (BRIDGE_WEIGHT + TRAVELLER_WEIGHT));
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p39-reset">Reset</button>';

  const initialState = () => ({
    overlap: 2,
    traveller: 0,
    stage: 0,
    minimumAnswer: "",
    maximumAnswer: "",
    feedback: "",
    feedbackTone: "neutral",
    committed: false,
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function clean(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replace(/[^0-9.\s-]/g, "").slice(0, 16);
  }

  function supportPositions(overlap = state.overlap) {
    return { a: overlap, b: overlap + RAVINE_WIDTH };
  }

  function reactions(overlap = state.overlap, traveller = state.traveller) {
    const { a, b } = supportPositions(overlap);
    const reactionB = (
      BRIDGE_WEIGHT * (BRIDGE_LENGTH / 2 - a)
      + TRAVELLER_WEIGHT * (traveller - a)
    ) / (b - a);
    const reactionA = BRIDGE_WEIGHT + TRAVELLER_WEIGHT - reactionB;
    return { reactionA, reactionB };
  }

  function resultantPosition(traveller = state.traveller) {
    return (
      BRIDGE_WEIGHT * BRIDGE_LENGTH / 2
      + TRAVELLER_WEIGHT * traveller
    ) / (BRIDGE_WEIGHT + TRAVELLER_WEIGHT);
  }

  function safeTravellerRange(overlap = state.overlap) {
    const { a, b } = supportPositions(overlap);
    const lower = a - BRIDGE_WEIGHT * (BRIDGE_LENGTH / 2 - a) / TRAVELLER_WEIGHT;
    const upper = b + BRIDGE_WEIGHT * (b - BRIDGE_LENGTH / 2) / TRAVELLER_WEIGHT;
    return {
      mathematicalLower: lower,
      mathematicalUpper: upper,
      lower: clamp(lower, 0, BRIDGE_LENGTH),
      upper: clamp(upper, 0, BRIDGE_LENGTH),
    };
  }

  function bridgeState() {
    const { reactionA, reactionB } = reactions();
    const tolerance = 1e-8;
    if (reactionA < -tolerance) return "tip-right";
    if (reactionB < -tolerance) return "tip-left";
    if (Math.abs(reactionA) <= tolerance) return "limit-right";
    if (Math.abs(reactionB) <= tolerance) return "limit-left";
    return "stable";
  }

  function stateLabel(regime = bridgeState()) {
    if (regime === "tip-right") return "Left contact lost · tips about B";
    if (regime === "tip-left") return "Right contact lost · tips about A";
    if (regime === "limit-right") return "Limiting contact at A";
    if (regime === "limit-left") return "Limiting contact at B";
    return "Both ledges in contact";
  }

  function fullCrossingState(overlap = state.overlap) {
    const tolerance = 1e-8;
    if (overlap < MIN_FULL_CROSSING_OVERLAP - tolerance) return "too-little";
    if (overlap > MAX_FULL_CROSSING_OVERLAP + tolerance) return "too-much";
    if (Math.abs(overlap - MIN_FULL_CROSSING_OVERLAP) <= tolerance || Math.abs(overlap - MAX_FULL_CROSSING_OVERLAP) <= tolerance) return "limiting";
    return "safe";
  }

  function reconstructionNote() {
    return `
      <p class="stat3-reconstruction-note p39-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function geometry() {
    const beamLeft = SVG.supportAX - state.overlap * SVG.scale;
    const beamRight = beamLeft + BRIDGE_LENGTH * SVG.scale;
    const travellerX = beamLeft + state.traveller * SVG.scale;
    const centreX = beamLeft + BRIDGE_LENGTH * SVG.scale / 2;
    const resultantX = beamLeft + resultantPosition() * SVG.scale;
    const range = safeTravellerRange();
    const safeLeft = beamLeft + range.lower * SVG.scale;
    const safeRight = beamLeft + range.upper * SVG.scale;
    const { reactionA, reactionB } = reactions();
    const arrowEnd = (reaction) => {
      if (Math.abs(reaction) <= 1e-8) return 208;
      const length = Math.min(86, 18 + Math.abs(reaction) * 31);
      return 208 - (reaction > 0 ? length : -length);
    };
    return {
      beamLeft,
      beamRight,
      travellerX,
      centreX,
      resultantX,
      safeLeft,
      safeRight,
      reactionAY: arrowEnd(reactionA),
      reactionBY: arrowEnd(reactionB),
      reactionA,
      reactionB,
      range,
    };
  }

  function svgDescription() {
    const shape = geometry();
    return `A 12 metre bridge spans a 6 metre ravine with ${clean(state.overlap, 1)} metres overlapping the near ledge. The traveller is ${clean(state.traveller, 1)} metres from the bridge’s left end. Reactions are ${clean(shape.reactionA, 2)} and ${clean(shape.reactionB, 2)} kilonewtons. ${stateLabel()}.`;
  }

  function bridgeSvg() {
    const shape = geometry();
    const regime = bridgeState();
    const fullState = fullCrossingState();
    return `
      <svg class="p39-svg p39-stage-${state.stage} is-${regime} full-${fullState}" data-p39-svg viewBox="0 0 720 430" role="img" aria-labelledby="p39-svg-title p39-svg-desc">
        <title id="p39-svg-title">Loaded bridge resting on two ravine ledges</title>
        <desc id="p39-svg-desc" data-p39-svg-desc>${svgDescription()}</desc>
        <defs>
          <marker id="p39-up-arrow" markerWidth="9" markerHeight="9" refX="7.4" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p39-loss-arrow" markerWidth="9" markerHeight="9" refX="7.4" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p39-down-arrow" markerWidth="9" markerHeight="9" refX="7.4" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
        </defs>

        <g class="p39-ravine" aria-hidden="true">
          <path class="p39-sky" d="M0 0 H720 V430 H0 Z" />
          <path class="p39-left-rock" d="M0 205 H250 L240 248 L212 270 L223 301 L181 327 L164 375 L119 391 L92 430 H0 Z" />
          <path class="p39-right-rock" d="M460 205 H720 V430 H633 L607 389 L566 376 L548 337 L514 313 L521 278 L482 254 Z" />
          <path class="p39-depth" d="M211 430 C260 347 298 388 336 320 C374 388 420 348 475 430 Z" />
          <line class="p39-ledge" x1="42" y1="205" x2="250" y2="205" />
          <line class="p39-ledge" x1="460" y1="205" x2="678" y2="205" />
          <text x="205" y="228">A</text><text x="474" y="228">B</text>
        </g>

        <g class="p39-geometry-layer" aria-hidden="true">
          <line class="p39-bridge" data-p39-beam x1="${clean(shape.beamLeft)}" y1="${SVG.beamY}" x2="${clean(shape.beamRight)}" y2="${SVG.beamY}" />
          <path class="p39-support" d="M235 202 L250 177 L265 202 Z" />
          <path class="p39-support" d="M445 202 L460 177 L475 202 Z" />
          <line class="p39-overlap-dimension" data-p39-near-dimension x1="${clean(shape.beamLeft)}" y1="126" x2="${SVG.supportAX}" y2="126" />
          <line class="p39-overlap-dimension" data-p39-far-dimension x1="${SVG.supportBX}" y1="126" x2="${clean(shape.beamRight)}" y2="126" />
          <text data-p39-near-label x="${clean((shape.beamLeft + SVG.supportAX) / 2)}" y="116">near s = ${clean(state.overlap, 1)} m</text>
          <text data-p39-far-label x="${clean((SVG.supportBX + shape.beamRight) / 2)}" y="116">far = ${clean(BRIDGE_LENGTH - RAVINE_WIDTH - state.overlap, 1)} m</text>
          <text class="p39-support-coordinate" data-p39-a-label x="250" y="246">A = ${clean(state.overlap, 1)} m</text>
          <text class="p39-support-coordinate" data-p39-b-label x="460" y="246">B = ${clean(state.overlap + RAVINE_WIDTH, 1)} m</text>
        </g>

        <g class="p39-traveller" data-p39-traveller transform="translate(${clean(shape.travellerX)} 0)" aria-hidden="true">
          <circle cx="0" cy="82" r="11" />
          <path d="M0 94 V125 M0 104 L-17 116 M0 104 L16 111 M0 125 L-14 149 M0 125 L14 149" />
          <text x="0" y="64">traveller</text>
        </g>

        <g class="p39-load-layer" aria-hidden="true">
          <line class="p39-traveller-load" data-p39-traveller-load x1="${clean(shape.travellerX)}" y1="89" x2="${clean(shape.travellerX)}" y2="145" marker-end="url(#p39-down-arrow)" />
          <text data-p39-traveller-weight-label x="${clean(shape.travellerX + 24)}" y="101">P = 0.8 kN</text>
          <line class="p39-bridge-load" data-p39-bridge-load x1="${clean(shape.centreX)}" y1="88" x2="${clean(shape.centreX)}" y2="145" marker-end="url(#p39-down-arrow)" />
          <text data-p39-bridge-weight-label x="${clean(shape.centreX + 26)}" y="101">W = 1.2 kN</text>
          <line class="p39-reaction ${shape.reactionA < -1e-8 ? "is-negative" : ""}" data-p39-ra x1="250" y1="208" x2="250" y2="${clean(shape.reactionAY)}" marker-end="url(#${shape.reactionA < -1e-8 ? "p39-loss-arrow" : "p39-up-arrow"})" />
          <line class="p39-reaction ${shape.reactionB < -1e-8 ? "is-negative" : ""}" data-p39-rb x1="460" y1="208" x2="460" y2="${clean(shape.reactionBY)}" marker-end="url(#${shape.reactionB < -1e-8 ? "p39-loss-arrow" : "p39-up-arrow"})" />
          <text data-p39-ra-label x="215" y="${clean(Math.min(196, shape.reactionAY - 7))}">RA ${clean(shape.reactionA, 2)}</text>
          <text data-p39-rb-label x="495" y="${clean(Math.min(196, shape.reactionBY - 7))}">RB ${clean(shape.reactionB, 2)}</text>
        </g>

        <g class="p39-limit-layer" aria-hidden="true">
          <line class="p39-safe-range" data-p39-safe-range x1="${clean(shape.safeLeft)}" y1="137" x2="${clean(shape.safeRight)}" y2="137" />
          <circle data-p39-safe-left cx="${clean(shape.safeLeft)}" cy="137" r="5" />
          <circle data-p39-safe-right cx="${clean(shape.safeRight)}" cy="137" r="5" />
          <text data-p39-safe-label x="${clean((shape.safeLeft + shape.safeRight) / 2)}" y="128">safe traveller range</text>
          <line class="p39-resultant" data-p39-resultant x1="${clean(shape.resultantX)}" y1="64" x2="${clean(shape.resultantX)}" y2="151" />
          <text data-p39-resultant-label x="${clean(shape.resultantX)}" y="52">combined load</text>
        </g>

        <g class="p39-status" transform="translate(500 332)">
          <rect width="180" height="63" rx="14" />
          <text class="p39-status-kicker" x="14" y="22">CURRENT STATE</text>
          <text class="p39-status-value" data-p39-state-text x="14" y="46">${stateLabel(regime)}</text>
        </g>
      </svg>`;
  }

  function stageControls() {
    return `
      <div class="p39-stage-controls" role="group" aria-label="Bridge statics stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p39-stage" data-p39-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p39-stage-caption" aria-live="polite">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p39-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Bridge resolved" : "Next stage"}</button>
      </div>`;
  }

  function controlsMarkup() {
    return `
      <section class="p39-controls" aria-label="Bridge and traveller controls">
        <label for="p39-traveller"><span>Traveller position x<strong data-p39-live="traveller">${clean(state.traveller, 1)} m</strong></span><input id="p39-traveller" type="range" min="0" max="12" step="0.1" value="${state.traveller}" /></label>
        <label for="p39-overlap"><span>Near-side overlap s<strong data-p39-live="overlap">${clean(state.overlap, 1)} m</strong></span><input id="p39-overlap" type="range" min="0" max="6" step="0.1" value="${state.overlap}" /></label>
        <div class="p39-control-labels"><span>left end</span><span>right end</span></div>
        <div class="p39-presets" role="group" aria-label="Notable bridge configurations">
          <button class="chip-button" type="button" data-problem-action="p39-preset" data-p39-overlap="2" data-p39-traveller="0">Baseline</button>
          <button class="chip-button" type="button" data-problem-action="p39-preset" data-p39-overlap="2" data-p39-traveller="11">Right limit</button>
          <button class="chip-button" type="button" data-problem-action="p39-preset" data-p39-overlap="3" data-p39-traveller="12">Full crossing</button>
          <button class="chip-button" type="button" data-problem-action="p39-preset" data-p39-overlap="4.5" data-p39-traveller="0">Too far across</button>
        </div>
      </section>`;
  }

  function metricsMarkup() {
    const shape = geometry();
    const fullState = fullCrossingState();
    const crossingLabel = fullState === "safe" ? "Entire walk safe" : fullState === "limiting" ? "Endpoint is limiting" : fullState === "too-little" ? "Far end tips" : "Near end tips";
    return `
      <section class="p39-metrics is-${bridgeState()} full-${fullState}" data-p39-metrics aria-live="polite">
        <div><span>Near reaction RA</span><strong data-p39-live="ra">${clean(shape.reactionA, 3)} kN</strong></div>
        <div><span>Far reaction RB</span><strong data-p39-live="rb">${clean(shape.reactionB, 3)} kN</strong></div>
        <div><span>Combined load line</span><strong data-p39-live="resultant">x̄ = ${clean(resultantPosition(), 2)} m</strong></div>
        <div><span>Current safe x range</span><strong data-p39-live="range">${clean(shape.range.lower, 1)}–${clean(shape.range.upper, 1)} m</strong></div>
        <p data-p39-regime-note>${stateLabel()}. For this overlap: <strong>${crossingLabel}</strong>.</p>
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p39-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p39-solution" aria-labelledby="p39-solution-heading">
        <h3 id="p39-solution-heading" tabindex="-1">Both ends constrain the bridge</h3>
        <p>Supports lie at A=s and B=s+6 along the bridge. Force and moment equilibrium give</p>
        <div class="p39-equation">RB = [W(6−s)+P(x−s)]/6, &nbsp; RA = W+P−RB</div>
        <p>A ledge can push upward but cannot pull downward. Thus both reactions must remain non-negative.</p>
        <p>At the far endpoint x=12, requiring RA≥0 gives</p>
        <div class="p39-equation">s ≥ (12−6)P/(W+P) = 2.4 m</div>
        <p>At the near endpoint x=0, requiring RB≥0 gives</p>
        <div class="p39-equation">s ≤ WL/[2(W+P)] = 3.6 m</div>
        <p>Therefore the entire walk is statically possible exactly when <strong>2.4 m ≤ s ≤ 3.6 m</strong>. At either endpoint of this interval one reaction is zero, so a practical design should lie strictly inside it; s=3.0 m gives positive margin at both journey endpoints.</p>
        <p class="p39-insight">For the original s=2.0 m placement, RA reaches zero at x=11.0 m. The title is optimistic by exactly one metre.</p>
      </section>`;
  }

  function stateSnapshot() {
    const shape = geometry();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      bridgeLengthMetres: BRIDGE_LENGTH,
      ravineWidthMetres: RAVINE_WIDTH,
      bridgeWeightKn: BRIDGE_WEIGHT,
      travellerWeightKn: TRAVELLER_WEIGHT,
      nearOverlapMetres: state.overlap,
      farOverlapMetres: Number((BRIDGE_LENGTH - RAVINE_WIDTH - state.overlap).toFixed(2)),
      travellerPositionMetres: state.traveller,
      reactionAKn: Number(shape.reactionA.toFixed(4)),
      reactionBKn: Number(shape.reactionB.toFixed(4)),
      contactState: bridgeState(),
      safeTravellerRange: [Number(shape.range.lower.toFixed(3)), Number(shape.range.upper.toFixed(3))],
      fullCrossingOverlapInterval: [MIN_FULL_CROSSING_OVERLAP, MAX_FULL_CROSSING_OVERLAP],
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell stat3-shell p39-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread stat3-spread p39-spread">
          <article class="book-page p39-problem-page">
            <div class="problem-number">Problem 3.9</div>
            <h1 class="book-title stat3-title p39-title">The Ravine of (Not Quite) Certain Death</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">A uniform 12 m bridge weighing 1.2 kN spans a 6 m ravine. It rests without fastenings on the two ledge edges. Its near-side overlap is s metres, so its far-side overlap is 6−s metres.</p>
            <p class="problem-copy">A traveller weighing 0.8 kN walks the full bridge from x=0 to x=12. Find every value of s for which neither ledge ever loses contact.</p>
            <section class="p39-data-card">
              <div class="eyebrow">Contact rule</div>
              <p>Each ledge can push upward, but cannot pull the bridge downward. A calculated negative reaction therefore signals loss of contact and tipping about the other ledge.</p>
            </section>
            <section class="p39-baseline-card">
              <strong>Original placement · s = 2.0 m</strong>
              <p>It looks generous: 2 m on the near side and 4 m on the far side. Is the whole crossing actually possible?</p>
            </section>
          </article>

          <section class="book-page book-stage stat3-stage p39-stage">
            ${stageControls()}
            <div class="p39-visual-card">${bridgeSvg()}${stageCaption()}</div>
            ${controlsMarkup()}
            ${metricsMarkup()}
          </section>

          <aside class="book-page book-coach p39-coach">
            <div class="coach-kicker">Design the overlap</div>
            <p class="coach-question">What complete interval of near-side overlaps permits the traveller’s entire journey?</p>
            <form class="p39-answer-form" data-p39-answer-form novalidate>
              <label for="p39-min-answer">Minimum near overlap</label>
              <div><input id="p39-min-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.minimumAnswer)}" placeholder="e.g. 2.0" autocomplete="off" /><span>m</span></div>
              <label for="p39-max-answer">Maximum near overlap</label>
              <div><input id="p39-max-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.maximumAnswer)}" placeholder="e.g. 4.0" autocomplete="off" /><span>m</span></div>
              <button class="primary-button" type="submit">Check both ledges</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p39-help-row">
              <button class="secondary-button" type="button" data-problem-action="p39-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p39-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
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
    root.querySelectorAll(selector).forEach((node) => Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value))));
  }

  function setText(root, selector, value) {
    root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p39-shell");
    if (!root) return;
    const shape = geometry();
    const regime = bridgeState();
    const fullState = fullCrossingState();
    setAttributes(root, "[data-p39-beam]", { x1: clean(shape.beamLeft), x2: clean(shape.beamRight) });
    setAttributes(root, "[data-p39-near-dimension]", { x1: clean(shape.beamLeft) });
    setAttributes(root, "[data-p39-far-dimension]", { x2: clean(shape.beamRight) });
    setAttributes(root, "[data-p39-near-label]", { x: clean((shape.beamLeft + SVG.supportAX) / 2) });
    setAttributes(root, "[data-p39-far-label]", { x: clean((SVG.supportBX + shape.beamRight) / 2) });
    setAttributes(root, "[data-p39-traveller]", { transform: `translate(${clean(shape.travellerX)} 0)` });
    setAttributes(root, "[data-p39-traveller-load]", { x1: clean(shape.travellerX), x2: clean(shape.travellerX) });
    setAttributes(root, "[data-p39-traveller-weight-label]", { x: clean(shape.travellerX + 24) });
    setAttributes(root, "[data-p39-bridge-load]", { x1: clean(shape.centreX), x2: clean(shape.centreX) });
    setAttributes(root, "[data-p39-bridge-weight-label]", { x: clean(shape.centreX + 26) });
    setAttributes(root, "[data-p39-ra]", { y2: clean(shape.reactionAY) });
    setAttributes(root, "[data-p39-rb]", { y2: clean(shape.reactionBY) });
    setAttributes(root, "[data-p39-ra]", { "marker-end": `url(#${shape.reactionA < -1e-8 ? "p39-loss-arrow" : "p39-up-arrow"})` });
    setAttributes(root, "[data-p39-rb]", { "marker-end": `url(#${shape.reactionB < -1e-8 ? "p39-loss-arrow" : "p39-up-arrow"})` });
    setAttributes(root, "[data-p39-ra-label]", { y: clean(Math.min(196, shape.reactionAY - 7)) });
    setAttributes(root, "[data-p39-rb-label]", { y: clean(Math.min(196, shape.reactionBY - 7)) });
    setAttributes(root, "[data-p39-safe-range]", { x1: clean(shape.safeLeft), x2: clean(shape.safeRight) });
    setAttributes(root, "[data-p39-safe-left]", { cx: clean(shape.safeLeft) });
    setAttributes(root, "[data-p39-safe-right]", { cx: clean(shape.safeRight) });
    setAttributes(root, "[data-p39-safe-label]", { x: clean((shape.safeLeft + shape.safeRight) / 2) });
    setAttributes(root, "[data-p39-resultant]", { x1: clean(shape.resultantX), x2: clean(shape.resultantX) });
    setAttributes(root, "[data-p39-resultant-label]", { x: clean(shape.resultantX) });
    setText(root, "[data-p39-near-label]", `near s = ${clean(state.overlap, 1)} m`);
    setText(root, "[data-p39-far-label]", `far = ${clean(BRIDGE_LENGTH - RAVINE_WIDTH - state.overlap, 1)} m`);
    setText(root, "[data-p39-a-label]", `A = ${clean(state.overlap, 1)} m`);
    setText(root, "[data-p39-b-label]", `B = ${clean(state.overlap + RAVINE_WIDTH, 1)} m`);
    setText(root, "[data-p39-ra-label]", `RA ${clean(shape.reactionA, 2)}`);
    setText(root, "[data-p39-rb-label]", `RB ${clean(shape.reactionB, 2)}`);
    setText(root, "[data-p39-state-text]", stateLabel(regime));
    setText(root, "[data-p39-svg-desc]", svgDescription());
    setText(root, '[data-p39-live="traveller"]', `${clean(state.traveller, 1)} m`);
    setText(root, '[data-p39-live="overlap"]', `${clean(state.overlap, 1)} m`);
    setText(root, '[data-p39-live="ra"]', `${clean(shape.reactionA, 3)} kN`);
    setText(root, '[data-p39-live="rb"]', `${clean(shape.reactionB, 3)} kN`);
    setText(root, '[data-p39-live="resultant"]', `x̄ = ${clean(resultantPosition(), 2)} m`);
    setText(root, '[data-p39-live="range"]', `${clean(shape.range.lower, 1)}–${clean(shape.range.upper, 1)} m`);
    const crossingLabel = fullState === "safe" ? "Entire walk safe" : fullState === "limiting" ? "Endpoint is limiting" : fullState === "too-little" ? "Far end tips" : "Near end tips";
    setText(root, "[data-p39-regime-note]", `${stateLabel(regime)}. For this overlap: ${crossingLabel}.`);
    const ra = root.querySelector("[data-p39-ra]");
    const rb = root.querySelector("[data-p39-rb]");
    ra?.classList.toggle("is-negative", shape.reactionA < -1e-8);
    rb?.classList.toggle("is-negative", shape.reactionB < -1e-8);
    const svg = root.querySelector("[data-p39-svg]");
    const metrics = root.querySelector("[data-p39-metrics]");
    [svg, metrics].forEach((node) => {
      if (!node) return;
      ["stable", "tip-right", "tip-left", "limit-right", "limit-left"].forEach((name) => node.classList.toggle(`is-${name}`, name === regime));
      ["safe", "limiting", "too-little", "too-much"].forEach((name) => node.classList.toggle(`full-${name}`, name === fullState));
    });
    const travellerSlider = root.querySelector("#p39-traveller");
    const overlapSlider = root.querySelector("#p39-overlap");
    travellerSlider?.setAttribute("aria-valuetext", `Traveller ${clean(state.traveller, 1)} metres from the left end; ${stateLabel(regime)}`);
    overlapSlider?.setAttribute("aria-valuetext", `Near overlap ${clean(state.overlap, 1)} metres; full crossing ${crossingLabel.toLowerCase()}`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p39-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p39-traveller");
          return;
        }
        if (action === "p39-stage") {
          state.stage = clamp(Number(control.dataset.p39Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p39-stage="${state.stage}"]`);
          return;
        }
        if (action === "p39-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p39-stage="${state.stage}"]`);
          return;
        }
        if (action === "p39-preset") {
          state.overlap = clamp(Number(control.dataset.p39Overlap), 0, 6);
          state.traveller = clamp(Number(control.dataset.p39Traveller), 0, 12);
          renderAndFocus(renderApp, "#p39-traveller");
          return;
        }
        if (action === "p39-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p39-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p39-reveal") window.requestAnimationFrame(() => document.querySelector("#p39-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p39-traveller", key: "traveller", min: 0, max: 12 },
      { selector: "#p39-overlap", key: "overlap", min: 0, max: 6 },
    ].forEach(({ selector, key, min, max }) => {
      const slider = document.querySelector(selector);
      slider?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), min, max);
        updateDynamicDom();
      });
    });

    const minimumInput = document.querySelector("#p39-min-answer");
    const maximumInput = document.querySelector("#p39-max-answer");
    minimumInput?.addEventListener("input", (event) => { state.minimumAnswer = sanitizeNumber(event.target.value); });
    maximumInput?.addEventListener("input", (event) => { state.maximumAnswer = sanitizeNumber(event.target.value); });
    const answerForm = document.querySelector("[data-p39-answer-form]");
    answerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.minimumAnswer = sanitizeNumber(minimumInput?.value).trim();
      state.maximumAnswer = sanitizeNumber(maximumInput?.value).trim();
      const minimum = Number(state.minimumAnswer);
      const maximum = Number(state.maximumAnswer);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.minimumAnswer || !state.maximumAnswer || !Number.isFinite(minimum) || !Number.isFinite(maximum)) {
        state.feedback = "Enter both ends of the overlap interval.";
      } else if (minimum > maximum) {
        state.feedback = "Put the smaller overlap first; the answer is an interval.";
      } else if (Math.abs(minimum - MIN_FULL_CROSSING_OVERLAP) > 0.05) {
        state.feedback = "The lower bound comes from the traveller at x=12, where RA is the reaction that can vanish.";
      } else if (Math.abs(maximum - MAX_FULL_CROSSING_OVERLAP) > 0.05) {
        state.feedback = "The upper bound comes from the traveller at x=0, where RB is the reaction that can vanish.";
      } else {
        state.feedbackTone = "success";
        state.committed = true;
        state.feedback = "Correct: 2.4 m ≤ s ≤ 3.6 m prevents a negative reaction throughout the crossing. Choose strictly inside for real safety margin.";
      }
      renderAndFocus(renderApp, "#p39-min-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
