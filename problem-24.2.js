(function registerRiverPenPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "24.2";
  const FENCE_METRES = 120;
  const DOMAIN = Object.freeze({ minimum: 0, maximum: 60 });
  const OPTIMUM = Object.freeze({ width: 30, length: 60, area: 1800 });
  const PEN_SCALE = 2.5;
  const PEN_CENTRE_X = 192;
  const RIVER_Y = 103;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Constrain", title: "Spend the 120 metres on only three sides", copy: "The river replaces one long side. Two equal widths x and the opposite length y use all the fence, so 2x+y=120 and y=120−2x." }),
    Object.freeze({ short: "Differentiate", title: "Find the stationary candidate on the area curve", copy: "Substitution gives A(x)=x(120−2x). Its derivative 120−4x vanishes at x=30, identifying an interior candidate." }),
    Object.freeze({ short: "Certify", title: "Check the domain, endpoints and concavity", copy: "Physical dimensions require 0≤x≤60. Both endpoints give area 0, while A″(x)=−4<0 everywhere, so the stationary candidate is the global maximum." }),
  ]);
  const hints = Object.freeze([
    "Only three sides need fence: two widths x and one length y.",
    "Use y=120−2x to write A solely in terms of x.",
    "A(x)=120x−2x², so A′(x)=120−4x.",
    "Set A′(x)=0 to obtain x=30, then recover y from the fence constraint.",
    "At x=30, y=60 and A=1800. Check A(0)=A(60)=0 and A″=−4.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p242-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function clean(value, digits = 3) { const rounded = Number(Number(value).toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 2) { const number = Number(value); return `${number >= 0 ? "+" : "−"}${clean(Math.abs(number), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }
  function penData(widthInput = state.width) {
    const width = clamp(widthInput, DOMAIN.minimum, DOMAIN.maximum);
    const length = FENCE_METRES - 2 * width;
    const area = width * length;
    return {
      width,
      length,
      area,
      derivative: FENCE_METRES - 4 * width,
      secondDerivative: -4,
      fenceUsed: 2 * width + length,
      fenceResidual: 2 * width + length - FENCE_METRES,
      domainValid: width >= DOMAIN.minimum && width <= DOMAIN.maximum && length >= 0,
      endpoint: width === DOMAIN.minimum || width === DOMAIN.maximum,
      stationary: Math.abs(width - OPTIMUM.width) < 1e-9,
    };
  }

  function initialState() {
    return {
      width: 20,
      stage: 0,
      widthAnswer: "",
      lengthAnswer: "",
      areaAnswer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Start at x=20 m: the constraint forces y=80 m, using exactly 120 m of fence.",
    };
  }
  let state = initialState();
  let activePointerId = null;

  function setWidth(widthInput, message) {
    state.width = clamp(Math.round(Number(widthInput)), DOMAIN.minimum, DOMAIN.maximum);
    const values = penData();
    state.boardMessage = message || `x=${clean(values.width, 0)} m forces y=${clean(values.length, 0)} m; area ${clean(values.area, 0)} m² and A′(x)=${signed(values.derivative, 0)}.`;
  }
  function restoreOptimum(message = "Stationary enclosure restored: x=30 m, y=60 m, area 1800 m².") { setWidth(OPTIMUM.width, message); }

  function stageControlsMarkup() {
    return `<div class="p242-stage-controls" role="group" aria-label="Constrained optimization stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p242-stage" data-p242-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p242-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p242-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Global maximum certified" : "Next stage"}</button></div>`;
  }

  function areaCurvePath() {
    return Array.from({ length: 121 }, (_, index) => {
      const width = index / 2, area = width * (FENCE_METRES - 2 * width);
      const x = 410 + width * 5, y = 350 - area * (240 / OPTIMUM.area);
      return `${index ? "L" : "M"}${clean(x, 3)} ${clean(y, 3)}`;
    }).join("");
  }

  function optimizationSvg() {
    const values = penData();
    const lengthPixels = values.length * PEN_SCALE, widthPixels = values.width * PEN_SCALE;
    const left = PEN_CENTRE_X - lengthPixels / 2, right = PEN_CENTRE_X + lengthPixels / 2, bottom = RIVER_Y + widthPixels;
    const mapCurveX = (width) => 410 + width * 5, mapCurveY = (area) => 350 - area * (240 / OPTIMUM.area);
    const currentX = mapCurveX(values.width), currentY = mapCurveY(values.area);
    const showCurve = state.stage >= 1 || state.revealed, showCertificate = state.stage >= 2 || state.revealed;
    const status = values.endpoint ? "Degenerate endpoint: one dimension is zero, so area is zero." : values.stationary ? "Stationary point: derivative zero; endpoint and concavity checks certify the global maximum." : values.derivative > 0 ? "Area is increasing here because A′(x)>0." : "Area is decreasing here because A′(x)<0.";
    const description = `A riverside rectangular pen uses two widths x and one opposite length y, with 2x plus y equal to 120. Current x is ${clean(values.width, 2)} metres, y is ${clean(values.length, 2)} metres, area is ${clean(values.area, 2)} square metres, and derivative is ${clean(values.derivative, 2)}. The area curve A equals x times 120 minus 2x has endpoints zero at x 0 and x 60, and a stationary maximum at x 30 with y 60 and area 1800. Second derivative is minus 4.`;
    return `<svg class="p242-optimization p242-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p242-svg-title p242-svg-desc"><title id="p242-svg-title">Constrained riverside enclosure linked to its area curve</title><desc id="p242-svg-desc">${description}</desc><defs><linearGradient id="p242-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#30283e"/></linearGradient><pattern id="p242-water-lines" width="18" height="10" patternUnits="userSpaceOnUse"><path d="M0 5Q4 1 9 5T18 5"/></pattern></defs><rect class="p242-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p242-board-kicker" x="22" y="27">ONE CONSTRAINT · ONE VARIABLE · GEOMETRY AND AREA CURVE MOVE TOGETHER</text><g class="p242-pen-panel"><rect x="20" y="43" width="345" height="358" rx="15"/><text class="p242-panel-title" x="38" y="67">RIVERSIDE ENCLOSURE</text><rect class="p242-river" x="36" y="78" width="312" height="48" rx="8"/><rect class="p242-river-pattern" x="36" y="78" width="312" height="48" rx="8"/><text class="p242-river-label" x="192" y="96" text-anchor="middle">RIVER · NO FENCE NEEDED</text><rect class="p242-area-fill" x="${left}" y="${RIVER_Y}" width="${Math.max(0, lengthPixels)}" height="${Math.max(0, widthPixels)}"/><path class="p242-fence" d="M${left} ${RIVER_Y}V${bottom}H${right}V${RIVER_Y}"/><line class="p242-width-bracket" x1="${left - 13}" y1="${RIVER_Y}" x2="${left - 13}" y2="${bottom}"/><path class="p242-width-bracket" d="M${left - 18} ${RIVER_Y}h10M${left - 18} ${bottom}h10"/><text class="p242-dimension-label" x="${left - 20}" y="${clamp((RIVER_Y + bottom) / 2 + 3, 133, 250)}" text-anchor="end">x=${clean(values.width, 0)} m</text><line class="p242-length-bracket" x1="${left}" y1="${bottom + 15}" x2="${right}" y2="${bottom + 15}"/><path class="p242-length-bracket" d="M${left} ${bottom + 10}v10M${right} ${bottom + 10}v10"/><text class="p242-dimension-label" x="${PEN_CENTRE_X}" y="${clamp(bottom + 34, 155, 289)}" text-anchor="middle">y=${clean(values.length, 0)} m</text><circle class="p242-drag-handle" cx="${right}" cy="${bottom}" r="7"/><circle class="p242-drag-hit" cx="${right}" cy="${bottom}" r="19" data-p242-drag/><text class="p242-drag-label" x="${clamp(right + 10, 70, 317)}" y="${clamp(bottom - 10, 132, 270)}">drag</text><g class="p242-constraint-ledger"><line x1="38" y1="306" x2="347" y2="306"/><text class="p242-ledger-kicker" x="38" y="326">FENCE BUDGET</text><text class="p242-constraint" x="38" y="350">2x+y = 2(${clean(values.width, 0)})+${clean(values.length, 0)} = <tspan>120 m</tspan></text><text class="p242-constraint" x="38" y="375">A=xy = ${clean(values.width, 0)}×${clean(values.length, 0)} = <tspan>${clean(values.area, 0)} m²</tspan></text></g></g><g class="p242-curve-panel"><rect x="380" y="43" width="360" height="358" rx="15"/><text class="p242-panel-title" x="398" y="67">AREA ON THE PHYSICAL DOMAIN 0≤x≤60</text><g class="p242-curve-group ${showCurve ? "is-visible" : ""}"><g class="p242-grid">${[0,600,1200,1800].map((area) => `<line x1="410" y1="${mapCurveY(area)}" x2="710" y2="${mapCurveY(area)}"/><text x="402" y="${mapCurveY(area) + 3}" text-anchor="end">${area}</text>`).join("")}${[0,15,30,45,60].map((width) => `<line x1="${mapCurveX(width)}" y1="110" x2="${mapCurveX(width)}" y2="350"/><text x="${mapCurveX(width)}" y="367" text-anchor="middle">${width}</text>`).join("")}</g><path class="p242-area-curve" d="${areaCurvePath()}"/><line class="p242-current-guide" x1="${currentX}" y1="${currentY}" x2="${currentX}" y2="350"/><circle class="p242-current-point" cx="${currentX}" cy="${currentY}" r="7"/><text class="p242-current-label" x="${clamp(currentX, 454, 665)}" y="${clamp(currentY - 14, 94, 330)}" text-anchor="middle">(${clean(values.width, 0)}, ${clean(values.area, 0)})</text><text class="p242-axis-label" x="710" y="386" text-anchor="end">width x (m)</text><text class="p242-axis-label" x="398" y="92">area A (m²)</text></g><g class="p242-certificate ${showCertificate ? "is-visible" : ""}"><circle class="p242-endpoint" cx="${mapCurveX(0)}" cy="${mapCurveY(0)}" r="5"/><circle class="p242-endpoint" cx="${mapCurveX(60)}" cy="${mapCurveY(0)}" r="5"/><text class="p242-endpoint-label" x="410" y="343">A(0)=0</text><text class="p242-endpoint-label" x="710" y="343" text-anchor="end">A(60)=0</text><path class="p242-stationary-mark" d="M${mapCurveX(30) - 7} ${mapCurveY(1800)}h14M${mapCurveX(30)} ${mapCurveY(1800) - 7}v14"/><text class="p242-stationary-label" x="${mapCurveX(30) + 12}" y="${mapCurveY(1800) - 8}">A′=0 · candidate</text><g class="p242-derivative-card" transform="translate(486 205)"><rect width="204" height="75" rx="11"/><text class="p242-card-kicker" x="13" y="19">GLOBAL-MAXIMUM AUDIT</text><text x="13" y="41">A′(x)=120−4x</text><text x="13" y="61">A″(x)=−4&lt;0 · concave</text></g></g><text class="p242-curve-status" x="398" y="395">${status}</text></g></svg>`;
  }

  function controlsMarkup() {
    const values = penData();
    return `<section class="p242-controls" aria-label="Constrained enclosure width"><label for="p242-width"><span>Perpendicular width x <output>${clean(values.width, 0)} m</output></span><input id="p242-width" type="range" min="0" max="60" step="1" value="${values.width}" aria-valuetext="Width ${clean(values.width, 0)} metres; opposite length ${clean(values.length, 0)} metres; area ${clean(values.area, 0)} square metres; derivative ${clean(values.derivative, 0)}"/></label><div class="p242-control-actions"><button class="secondary-button" type="button" data-problem-action="p242-preset" data-p242-width="0">Endpoint x=0</button><button class="primary-button" type="button" data-problem-action="p242-preset" data-p242-width="30">Stationary x=30</button><button class="secondary-button" type="button" data-problem-action="p242-preset" data-p242-width="60">Endpoint x=60</button></div><p data-p242-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const values = penData();
    return `<section class="p242-metrics" aria-live="polite"><article><span>Two widths</span><strong>2×${clean(values.width, 0)} m</strong><small>perpendicular fences</small></article><article><span>Opposite length</span><strong>${clean(values.length, 0)} m</strong><small>120−2x</small></article><article><span>Area · derivative</span><strong>${clean(values.area, 0)} m²</strong><small>A′=${signed(values.derivative, 0)} m</small></article></section>`;
  }
  function globalCheckMarkup() {
    return `<section class="p242-global-check"><strong>Derivative zero is only the candidate step.</strong><span>A global claim also needs the physical domain 0≤x≤60 and comparison with its boundaries—or an equivalent argument using strict concavity. Here both endpoints collapse the pen and A″=−4.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p242-dynamic">${optimizationSvg()}${controlsMarkup()}${metricsMarkup()}${globalCheckMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p242-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p242-solution" aria-labelledby="p242-solution-heading"><h3 id="p242-solution-heading" tabindex="-1">The missing riverside fence leaves a concave quadratic</h3><p>The fence constraint is</p><div class="p242-equation">2x+y=120, so y=120−2x.</div><p>Physical dimensions require x≥0 and y≥0, hence 0≤x≤60. Substitute the constraint into the area:</p><div class="p242-equation">A(x)=xy=x(120−2x)=120x−2x².</div><p>The stationary point satisfies</p><div class="p242-equation">A′(x)=120−4x=0,<br>so <strong>x=30 m</strong>.</div><p>Then</p><div class="p242-equation is-answer">y=120−2(30)=<strong>60 m</strong>,<br>A=30×60=<strong>1800 m²</strong>.</div><p>This is globally maximal, not merely stationary: A(0)=0, A(60)=0, and A″(x)=−4&lt;0 throughout [0,60]. Thus the curve is strictly concave and its unique interior stationary point lies above both endpoints.</p></section>`;
  }

  function snapshot() {
    const values = penData();
    let gridMaximum = { width: DOMAIN.minimum, area: -Infinity };
    for (let width = DOMAIN.minimum; width <= DOMAIN.maximum; width += 1) {
      const area = penData(width).area;
      if (area > gridMaximum.area) gridMaximum = { width, area };
    }
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      model: "rectangular enclosure beside a straight river; river supplies one long side; 120 m fences the other three sides",
      current: {
        widthXMetres: values.width,
        oppositeLengthYMetres: values.length,
        areaSquareMetres: values.area,
        fenceUsedMetres: values.fenceUsed,
        fenceResidualMetres: values.fenceResidual,
        derivativeSquareMetresPerMetre: values.derivative,
        secondDerivative: values.secondDerivative,
        domainValid: values.domainValid,
      },
      reduction: {
        constraint: "2x+y=120",
        eliminatedLength: "y=120-2x",
        area: "A(x)=x(120-2x)=120x-2x^2",
        derivative: "A'(x)=120-4x",
        secondDerivative: "A''(x)=-4",
        physicalDomain: [DOMAIN.minimum, DOMAIN.maximum],
      },
      optimum: {
        stationaryWidthMetres: OPTIMUM.width,
        oppositeLengthMetres: OPTIMUM.length,
        maximumAreaSquareMetres: OPTIMUM.area,
        derivativeResidual: penData(OPTIMUM.width).derivative,
      },
      globalAudit: {
        leftEndpointArea: penData(DOMAIN.minimum).area,
        rightEndpointArea: penData(DOMAIN.maximum).area,
        strictConcavity: penData().secondDerivative < 0,
        integerGridMaximum: gridMaximum,
        conclusion: "unique global maximum on closed physical domain",
      },
      stage: state.stage + 1,
      answers: { width: state.widthAnswer || null, length: state.lengthAnswer || null, area: state.areaAnswer || null },
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p242-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Calculus and Optimisation</strong><span class="eyebrow">Chapter 24 · constrained maxima</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p242-spread"><article class="book-page p242-problem-page"><div class="problem-number">Problem 24.2</div><h1 class="book-title p242-title">The River Pen with One Missing Side</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p242-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A rectangular animal pen is built beside a straight river, so the riverside length needs no fence. The remaining three sides use exactly 120 m of fencing.</p><p class="problem-copy"><strong>Find the dimensions and maximum enclosed area.</strong></p><section class="p242-question-card"><strong>One missing side changes the constraint</strong><p>If x is each perpendicular width and y is the opposite river-parallel length, only 2x+y enters the fencing budget.</p></section></article><section class="book-page book-stage p242-stage" aria-labelledby="p242-stage-heading">${stageControlsMarkup()}<div class="p242-stage-heading"><div><span class="eyebrow">Constrained-area laboratory</span><h2 id="p242-stage-heading">Resize the pen along one parabola</h2></div><p>Drag the fence corner or use the slider; the constraint, geometry and area-curve point stay synchronized.</p></div><div class="p242-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p242-coach"><div class="coach-kicker">Build the largest pen</div><p class="coach-question">Enter the two optimal dimensions and the maximum area.</p><form class="p242-answer-form" data-p242-answer-form novalidate><label for="p242-answer-width">Width x (m)<input id="p242-answer-width" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.widthAnswer)}" placeholder="x"/></label><label for="p242-answer-length">Length y (m)<input id="p242-answer-length" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.lengthAnswer)}" placeholder="y"/></label><label for="p242-answer-area">Maximum area (m²)<input id="p242-answer-area" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.areaAnswer)}" placeholder="area"/></label><small>Decimals or fractions are accepted; dimensions ±0.1 m and area ±1 m² are allowed.</small><button class="primary-button" type="submit">Check enclosure</button></form>${feedbackMarkup()}<div class="button-row p242-help-row"><button class="secondary-button" type="button" data-problem-action="p242-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p242-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p242-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) {
      const preset = active.dataset.p242Width !== undefined ? `[data-p242-width="${active.dataset.p242Width}"]` : "";
      return `[data-problem-action="${active.dataset.problemAction}"]${preset}`;
    }
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p242-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p242-dynamic");
    const selector = dynamic?.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) {
      const replacement = root.querySelector(selector);
      if (replacement) {
        try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); }
      }
    }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function pointerInSvg(event, svg) {
    if (typeof svg.createSVGPoint === "function" && svg.getScreenCTM()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse());
    }
    const bounds = svg.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / bounds.width * 760, y: (event.clientY - bounds.top) / bounds.height * 420 };
  }
  function setFromPointer(event, root) {
    const svg = root.querySelector(".p242-optimization");
    if (!svg) return;
    const point = pointerInSvg(event, svg);
    setWidth((point.y - RIVER_Y) / PEN_SCALE);
    updateDynamicDom();
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p242-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p242-reset") { state = initialState(); renderAndFocus(renderApp, "#p242-width"); return; }
      if (action === "p242-stage") { state.stage = clamp(Math.round(Number(control.dataset.p242Stage)), 0, 2); renderAndFocus(renderApp, `[data-p242-stage="${state.stage}"]`); return; }
      if (action === "p242-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p242-stage="${state.stage}"]`); return; }
      if (action === "p242-preset") { setWidth(Number(control.dataset.p242Width)); updateDynamicDom(); return; }
      if (action === "p242-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p242-reveal") { state.revealed = true; state.stage = 2; restoreOptimum(); }
      renderApp();
      if (action === "p242-reveal") window.requestAnimationFrame(() => document.querySelector("#p242-solution-heading")?.focus());
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p242-width")) { setWidth(Number(event.target.value)); updateDynamicDom(); return; }
      if (event.target.matches("#p242-answer-width")) { state.widthAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p242-answer-length")) { state.lengthAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p242-answer-area")) { state.areaAnswer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("[data-p242-drag]")) return;
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activePointerId = event.pointerId;
      root.setPointerCapture?.(event.pointerId);
      setFromPointer(event, root);
    });
    root.addEventListener("pointermove", (event) => { if (activePointerId === event.pointerId) setFromPointer(event, root); });
    const finishPointer = (event) => {
      if (activePointerId !== event.pointerId) return;
      setFromPointer(event, root);
      if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId);
      activePointerId = null;
      root.querySelector("#p242-width")?.focus();
    };
    root.addEventListener("pointerup", finishPointer);
    root.addEventListener("pointercancel", (event) => {
      if (activePointerId !== event.pointerId) return;
      if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId);
      activePointerId = null;
      root.querySelector("#p242-width")?.focus();
    });
    root.querySelector("[data-p242-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const widthRaw = event.currentTarget.querySelector("#p242-answer-width")?.value || "";
      const lengthRaw = event.currentTarget.querySelector("#p242-answer-length")?.value || "";
      const areaRaw = event.currentTarget.querySelector("#p242-answer-area")?.value || "";
      const width = parseNumber(widthRaw), length = parseNumber(lengthRaw), area = parseNumber(areaRaw);
      state.widthAnswer = widthRaw.trim();
      state.lengthAnswer = lengthRaw.trim();
      state.areaAnswer = areaRaw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (![width, length, area].every(Number.isFinite)) state.feedback = "Enter both dimensions and the maximum area.";
      else if (Math.abs(width - OPTIMUM.length) <= .1 && Math.abs(length - OPTIMUM.width) <= .1) state.feedback = "The two dimensions are reversed. x is each perpendicular width; y is the single opposite length.";
      else if (Math.abs(2 * width + length - FENCE_METRES) > .2) state.feedback = "Those dimensions do not use the stated three-side fence budget 2x+y=120.";
      else if (Math.abs(width - OPTIMUM.width) > .1 || Math.abs(length - OPTIMUM.length) > .1) state.feedback = "Differentiate A(x)=x(120−2x), then set A′(x)=0 and check the physical endpoints.";
      else if (Math.abs(area - OPTIMUM.area) > 1) state.feedback = "The dimensions are correct. Multiply 30 m by 60 m for the enclosed area.";
      else {
        state.feedbackTone = "success";
        state.feedback = "Correct: x=30 m and y=60 m give 1800 m²; the endpoints give zero and A″=−4 confirms the global maximum.";
        state.committed = true;
        state.stage = 2;
        restoreOptimum();
      }
      renderAndFocus(renderApp, "#p242-answer-width");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
