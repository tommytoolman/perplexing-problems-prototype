(function registerCalibrationLeastSquaresPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "23.6";
  const POINTS = Object.freeze([
    Object.freeze({ x: 0, y: 1 }),
    Object.freeze({ x: 1, y: 2 }),
    Object.freeze({ x: 2, y: 2 }),
    Object.freeze({ x: 3, y: 5 }),
  ]);
  const DESIGN_MATRIX = Object.freeze(POINTS.map((point) => Object.freeze([1, point.x])));
  const DATA_VECTOR = Object.freeze(POINTS.map((point) => point.y));
  const OPTIMUM = Object.freeze({ intercept: .7, slope: 1.2, sse: 1.8 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Approximate", title: "One line cannot satisfy all four equations", copy: "Each observation asks for a+bxᵢ=yᵢ. These four requests are inconsistent, so least squares chooses a compromise rather than forcing every residual to zero." }),
    Object.freeze({ short: "Square", title: "Minimize the total squared discrepancy", copy: "The vertical residuals rᵢ=yᵢ−(a+bxᵢ) generate four changing squares. Their sum is the objective ||r||²=SSE." }),
    Object.freeze({ short: "Project", title: "See the fitted values as a column-space projection", copy: "The vector ŷ=a·1+b·x lies in Col(X). At the closest point, r=y−ŷ is orthogonal to both columns: 1·r=0 and x·r=0." }),
  ]);
  const hints = Object.freeze([
    "Write the fitted-value vector as ŷ=a(1,1,1,1)+b(0,1,2,3).",
    "At the least-squares projection, the residual vector is orthogonal to both design columns.",
    "The normal equations are 4a+6b=10 and 6a+14b=21.",
    "Solving those two equations gives b=6/5 and a=7/10.",
    "Thus y=0.7+1.2x; its residuals are 0.3, 0.1, −1.1, 0.7 and SSE=1.8.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p236-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function clean(value, digits = 4) { const rounded = Number(Number(value).toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 2) { const number = Number(value); return `${number >= 0 ? "+" : "−"}${clean(Math.abs(number), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function fitData(interceptInput = state.intercept, slopeInput = state.slope) {
    const intercept = Number(interceptInput), slope = Number(slopeInput);
    const rows = POINTS.map((point) => {
      const fitted = intercept + slope * point.x, residual = point.y - fitted, squaredResidual = residual ** 2;
      return { ...point, fitted, residual, squaredResidual };
    });
    const residualSum = rows.reduce((sum, row) => sum + row.residual, 0);
    const xResidualSum = rows.reduce((sum, row) => sum + row.x * row.residual, 0);
    return {
      intercept,
      slope,
      rows,
      fittedVector: rows.map((row) => row.fitted),
      residualVector: rows.map((row) => row.residual),
      sse: rows.reduce((sum, row) => sum + row.squaredResidual, 0),
      residualSum,
      xResidualSum,
      normalEquationNorm: Math.hypot(residualSum, xResidualSum),
    };
  }

  const OPTIMUM_DATA = Object.freeze(fitData(OPTIMUM.intercept, OPTIMUM.slope));
  function initialState() {
    return {
      intercept: 2.5,
      slope: 0,
      stage: 0,
      answerIntercept: "",
      answerSlope: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Begin with the horizontal line through ȳ=2.5. Its residuals sum to zero, but x·r is not zero, so it is not the projection.",
    };
  }
  let state = initialState();

  function settleAtOptimum(message = "Projection reached: ŷ=0.7·1+1.2·x, with 1·r=0, x·r=0 and SSE=1.8.") {
    state.intercept = OPTIMUM.intercept;
    state.slope = OPTIMUM.slope;
    state.boardMessage = message;
  }
  function stageControlsMarkup() {
    return `<div class="p236-stage-controls" role="group" aria-label="Least-squares projection stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p236-stage" data-p236-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p236-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p236-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Projection identified" : "Next stage"}</button></div>`;
  }

  function projectionVectorMarkup(values) {
    const positions = [126, 152, 178, 204];
    const dataEntries = DATA_VECTOR.map((value, index) => `<text x="509" y="${positions[index]}" text-anchor="middle">${clean(value, 2)}</text>`).join("");
    const fittedEntries = values.fittedVector.map((value, index) => `<text x="610" y="${positions[index]}" text-anchor="middle">${clean(value, 2)}</text>`).join("");
    const residualEntries = values.residualVector.map((value, index) => `<text x="700" y="${positions[index]}" text-anchor="middle">${signed(value, 2)}</text>`).join("");
    return `<g class="p236-vector-columns"><text class="p236-vector-heading" x="509" y="98" text-anchor="middle">y</text><text class="p236-vector-heading" x="610" y="98" text-anchor="middle">ŷ=Xβ</text><text class="p236-vector-heading" x="700" y="98" text-anchor="middle">r</text><text class="p236-vector-symbol" x="550" y="167" text-anchor="middle">=</text><text class="p236-vector-symbol" x="656" y="167" text-anchor="middle">+</text><path class="p236-vector-bracket" d="M490 108h-7v107h7M527 108h7v107h-7M586 108h-7v107h7M634 108h7v107h-7M681 108h-7v107h7M719 108h7v107h-7"/>${dataEntries}${fittedEntries}${residualEntries}<text class="p236-colspace-label" x="610" y="232" text-anchor="middle">${values.normalEquationNorm < 1e-8 ? "orthogonal projection in Col(X)" : "candidate vector in Col(X)"}</text></g>`;
  }

  function regressionSvg() {
    const values = fitData();
    const mapX = (x) => 72 + x * 106;
    const mapY = (y) => 302 - y * 37;
    const showSquares = state.stage >= 1 || state.revealed;
    const showProjection = state.stage >= 2 || state.revealed;
    const lineYStart = values.intercept + values.slope * (-.3), lineYEnd = values.intercept + values.slope * 3.35;
    const residuals = values.rows.map((row, index) => {
      const x = mapX(row.x), pointY = mapY(row.y), fittedY = mapY(row.fitted);
      return `<g class="p236-residual"><line x1="${x}" y1="${pointY}" x2="${x}" y2="${fittedY}"/><path d="M${x - 5} ${fittedY}h10"/><text x="${x + 8}" y="${clamp((pointY + fittedY) / 2 - 4, 78, 292)}">r${index + 1}=${signed(row.residual)}</text></g>`;
    }).join("");
    const points = values.rows.map((row, index) => `<g class="p236-point"><circle cx="${mapX(row.x)}" cy="${mapY(row.y)}" r="6"/><text x="${mapX(row.x) + 9}" y="${mapY(row.y) - 8}">(${row.x},${row.y})</text><title>Observation ${index + 1}: fitted value ${clean(row.fitted, 4)}, residual ${clean(row.residual, 4)}, squared residual ${clean(row.squaredResidual, 5)}</title></g>`).join("");
    const squares = values.rows.map((row, index) => {
      const side = 9 + 12 * Math.min(Math.abs(row.residual), 2), x = 62 + index * 91, y = 388 - side;
      return `<g class="p236-square"><rect x="${clean(x, 3)}" y="${clean(y, 3)}" width="${clean(side, 3)}" height="${clean(side, 3)}" rx="2"/><text x="${clean(x + side + 4, 3)}" y="384">${clean(row.squaredResidual, 2)}</text></g>`;
    }).join("");
    const description = `The candidate line is y equals ${clean(values.intercept, 2)} plus ${clean(values.slope, 2)} x. Its fitted-value vector is ${values.fittedVector.map((value) => clean(value, 3)).join(", ")}, residual vector is ${values.residualVector.map((value) => clean(value, 3)).join(", ")}, and SSE is ${clean(values.sse, 4)}. The residual dot products with the design columns are ${clean(values.residualSum, 5)} and ${clean(values.xResidualSum, 5)}. At the least-squares projection a equals 0.7 and b equals 1.2, with residual vector 0.3, 0.1, minus 1.1, 0.7 and SSE 1.8.`;
    return `<svg class="p236-regression p236-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p236-svg-title p236-svg-desc"><title id="p236-svg-title">Calibration line and data-vector column-space projection</title><desc id="p236-svg-desc">${description}</desc><defs><linearGradient id="p236-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#30283e"/></linearGradient><clipPath id="p236-plot-clip"><rect x="48" y="63" width="400" height="250" rx="8"/></clipPath></defs><rect class="p236-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p236-board-kicker" x="22" y="27">SAME LEAST-SQUARES PROBLEM · LINE VIEW AT LEFT · PROJECTION VIEW AT RIGHT</text><g class="p236-line-panel"><rect x="20" y="43" width="445" height="358" rx="15"/><text class="p236-panel-title" x="38" y="67">DATA SPACE · VERTICAL RESIDUALS</text><g class="p236-grid">${[0,1,2,3,4,5,6].map((y) => `<line x1="51" y1="${mapY(y)}" x2="431" y2="${mapY(y)}"/><text x="44" y="${mapY(y) + 3}" text-anchor="end">${y}</text>`).join("")}${[0,1,2,3].map((x) => `<line x1="${mapX(x)}" y1="80" x2="${mapX(x)}" y2="302"/><text x="${mapX(x)}" y="318" text-anchor="middle">${x}</text>`).join("")}</g><g clip-path="url(#p236-plot-clip)"><path class="p236-fit-line" d="M${mapX(-.3)} ${mapY(lineYStart)}L${mapX(3.35)} ${mapY(lineYEnd)}"/>${residuals}${points}</g><text class="p236-line-label" x="431" y="91" text-anchor="end">y=${clean(values.intercept, 2)} ${values.slope >= 0 ? "+" : "−"} ${clean(Math.abs(values.slope), 2)}x</text><g class="p236-square-ledger ${showSquares ? "is-visible" : ""}"><line x1="39" y1="338" x2="446" y2="338"/><text class="p236-ledger-kicker" x="39" y="355">r₁²   +   r₂²   +   r₃²   +   r₄²</text>${squares}<text class="p236-sse-total" x="446" y="392" text-anchor="end">SSE=${clean(values.sse, 3)}</text></g></g><g class="p236-projection-panel ${showProjection ? "is-visible" : ""}"><rect x="480" y="43" width="260" height="358" rx="15"/><text class="p236-panel-title" x="498" y="67">DATA-VECTOR PROJECTION</text><text class="p236-projection-note" x="498" y="82">y = Xβ + r · four coordinates at once</text>${projectionVectorMarkup(values)}<line class="p236-ledger-rule" x1="498" y1="250" x2="722" y2="250"/><text class="p236-column-label" x="498" y="271">design columns</text><text class="p236-column-vector" x="498" y="290">1=(1,1,1,1)</text><text class="p236-column-vector" x="610" y="290">x=(0,1,2,3)</text><g class="p236-normal-card ${Math.abs(values.residualSum) < 1e-8 ? "is-zero" : ""}" transform="translate(498 305)"><rect width="107" height="57" rx="9"/><text x="10" y="19">1·r = Σr</text><text class="p236-normal-value" x="97" y="43" text-anchor="end">${signed(values.residualSum, 3)}</text></g><g class="p236-normal-card ${Math.abs(values.xResidualSum) < 1e-8 ? "is-zero" : ""}" transform="translate(615 305)"><rect width="107" height="57" rx="9"/><text x="10" y="19">x·r = Σxr</text><text class="p236-normal-value" x="97" y="43" text-anchor="end">${signed(values.xResidualSum, 3)}</text></g><text class="p236-projection-status ${values.normalEquationNorm < 1e-8 ? "is-zero" : ""}" x="498" y="383">${values.normalEquationNorm < 1e-8 ? "r ⟂ Col(X) · closest fitted vector" : "not orthogonal yet · keep adjusting β"}</text></g></svg>`;
  }

  function controlsMarkup() {
    const values = fitData();
    return `<section class="p236-controls" aria-label="Candidate line coefficients"><div class="p236-slider-grid"><label for="p236-intercept"><span>Intercept a <output>${clean(state.intercept, 2)}</output></span><input id="p236-intercept" type="range" min="-1" max="3" step="0.05" value="${state.intercept}" aria-valuetext="Intercept ${clean(state.intercept, 2)}; slope ${clean(state.slope, 2)}; SSE ${clean(values.sse, 4)}; residual dot products ${clean(values.residualSum, 4)} and ${clean(values.xResidualSum, 4)}"/></label><label for="p236-slope"><span>Slope b <output>${clean(state.slope, 2)}</output></span><input id="p236-slope" type="range" min="-0.5" max="2.5" step="0.05" value="${state.slope}" aria-valuetext="Slope ${clean(state.slope, 2)}; intercept ${clean(state.intercept, 2)}; SSE ${clean(values.sse, 4)}; residual dot products ${clean(values.residualSum, 4)} and ${clean(values.xResidualSum, 4)}"/></label></div><div class="p236-control-actions"><button class="primary-button" type="button" data-problem-action="p236-project">Project y into Col(X)</button><button class="ghost-button" type="button" data-problem-action="p236-mean-line">Return to horizontal mean line</button></div><p data-p236-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const values = fitData();
    return `<section class="p236-metrics" aria-live="polite"><article><span>Squared distance ||r||²</span><strong>${clean(values.sse, 4)}</strong><small>SSE in data-vector space</small></article><article><span>Orthogonality to 1</span><strong>${signed(values.residualSum, 3)}</strong><small>1·r = Σr</small></article><article><span>Orthogonality to x</span><strong>${signed(values.xResidualSum, 3)}</strong><small>x·r = Σxr</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p236-distinction"><strong>The algebraic picture is more than “wiggle a line until it looks good.”</strong><span>It regards y=(1,2,2,5) as one vector in R⁴ and selects its closest vector ŷ from Col(X)=span{1,x}. The residual is orthogonal to those two design columns—not perpendicular to the plotted regression line—and its entries need not individually vanish.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p236-dynamic">${regressionSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p236-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p236-solution" aria-labelledby="p236-solution-heading"><h3 id="p236-solution-heading" tabindex="-1">Project the data vector onto the design column space</h3><p>The fitted-value vector has the form</p><div class="p236-equation">ŷ=Xβ=a(1,1,1,1)+b(0,1,2,3).</div><p>At the closest vector in Col(X), r=y−Xβ is orthogonal to both columns. Thus Xᵀr=0, giving</p><div class="p236-equation">4a+6b=10,<br>6a+14b=21.</div><p>Solving yields</p><div class="p236-equation is-answer">a=<strong>7/10=0.7</strong>,<br>b=<strong>6/5=1.2</strong>,<br>so ŷ=0.7+1.2x.</div><p>The fitted vector is (0.7,1.9,3.1,4.3), and</p><div class="p236-equation">r=y−ŷ=(0.3,0.1,−1.1,0.7),<br>1·r=0, &nbsp; x·r=0,<br>SSE=r·r=0.09+0.01+1.21+0.49=<strong>1.8</strong>.</div><p>None of the four residuals is forced to vanish. Least squares instead makes the entire residual vector orthogonal to the model space spanned by the columns of X.</p></section>`;
  }

  function snapshot() {
    const values = fitData();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      model: "ordinary vertical least squares expressed as projection of y onto the column space of X",
      data: POINTS,
      designMatrix: DESIGN_MATRIX,
      dataVector: DATA_VECTOR,
      current: {
        beta: { intercept: values.intercept, slope: values.slope },
        fittedVector: values.fittedVector,
        residualVector: values.residualVector,
        squaredResiduals: values.rows.map((row) => row.squaredResidual),
        sse: values.sse,
        normalEquationResidual: { oneDotResidual: values.residualSum, xDotResidual: values.xResidualSum },
      },
      normalEquations: {
        XTransposeX: [[4, 6], [6, 14]],
        XTransposeY: [10, 21],
        determinant: 20,
        equations: ["4a+6b=10", "6a+14b=21"],
      },
      optimum: {
        beta: { intercept: OPTIMUM.intercept, slope: OPTIMUM.slope },
        exactBeta: { intercept: "7/10", slope: "6/5" },
        fittedVector: OPTIMUM_DATA.fittedVector,
        residualVector: OPTIMUM_DATA.residualVector,
        sse: OPTIMUM_DATA.sse,
        normalEquationResidual: { oneDotResidual: OPTIMUM_DATA.residualSum, xDotResidual: OPTIMUM_DATA.xResidualSum },
      },
      interpretation: {
        projectionTarget: "closest vector in Col(X)=span{1,x} to data vector y in R^4",
        residualOrthogonalTo: ["1=(1,1,1,1)", "x=(0,1,2,3)"],
        notRequired: "individual residuals need not be zero; inconsistent observation equations are approximated",
        plottedLineWarning: "r is orthogonal to design columns in data-vector space, not geometrically perpendicular to the plotted line",
      },
      stage: state.stage + 1,
      answers: { intercept: state.answerIntercept || null, slope: state.answerSlope || null },
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p236-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Linear Algebra and Transformations</strong><span class="eyebrow">Chapter 23 · least-squares projection</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p236-spread"><article class="book-page p236-problem-page"><div class="problem-number">Problem 23.6</div><h1 class="book-title p236-title">The Crooked Calibration Line</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p236-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Fit y=a+bx by ordinary least squares to the four calibration points (0,1), (1,2), (2,2), (3,5).</p><p class="problem-copy"><strong>Find the coefficients a and b.</strong></p><section class="p236-question-card"><strong>An inconsistent system still has a best projection</strong><p>The four equations cannot all hold exactly. Choose the fitted-value vector in the two-dimensional model space that is closest to the observed data vector.</p></section></article><section class="book-page book-stage p236-stage" aria-labelledby="p236-stage-heading">${stageControlsMarkup()}<div class="p236-stage-heading"><div><span class="eyebrow">Projection laboratory</span><h2 id="p236-stage-heading">Connect the fitted line to Xᵀr=0</h2></div><p>Move the candidate coefficients, then compare the plotted misses with the four-coordinate residual vector.</p></div><div class="p236-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p236-coach"><div class="coach-kicker">Calibrate the line</div><p class="coach-question">Enter both least-squares coefficients for the fixed four-point data set.</p><form class="p236-answer-form" data-p236-answer-form novalidate><label for="p236-answer-intercept">Intercept a<input id="p236-answer-intercept" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answerIntercept)}" placeholder="a"/></label><label for="p236-answer-slope">Slope b<input id="p236-answer-slope" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answerSlope)}" placeholder="b"/></label><small>Decimals or fractions are accepted; ±0.02 is allowed.</small><button class="primary-button" type="submit">Check coefficients</button></form>${feedbackMarkup()}<div class="button-row p236-help-row"><button class="secondary-button" type="button" data-problem-action="p236-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p236-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p236-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p236-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p236-dynamic");
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

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p236-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p236-reset") { state = initialState(); renderAndFocus(renderApp, "#p236-intercept"); return; }
      if (action === "p236-stage") { state.stage = clamp(Math.round(Number(control.dataset.p236Stage)), 0, 2); renderAndFocus(renderApp, `[data-p236-stage="${state.stage}"]`); return; }
      if (action === "p236-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p236-stage="${state.stage}"]`); return; }
      if (action === "p236-project") { state.stage = 2; settleAtOptimum(); updateDynamicDom(); return; }
      if (action === "p236-mean-line") { state.intercept = 2.5; state.slope = 0; state.boardMessage = "Returned to ŷ=2.5·1. Although 1·r=0 here, x·r=6, so r is not orthogonal to all of Col(X)."; updateDynamicDom(); return; }
      if (action === "p236-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p236-reveal") { state.revealed = true; state.stage = 2; settleAtOptimum(); }
      renderApp();
      if (action === "p236-reveal") window.requestAnimationFrame(() => document.querySelector("#p236-solution-heading")?.focus());
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p236-intercept")) {
        state.intercept = clamp(Number(event.target.value), -1, 3);
        const values = fitData();
        state.boardMessage = `a=${clean(state.intercept, 2)}, b=${clean(state.slope, 2)}: SSE=${clean(values.sse, 4)}, 1·r=${signed(values.residualSum, 3)}, x·r=${signed(values.xResidualSum, 3)}.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p236-slope")) {
        state.slope = clamp(Number(event.target.value), -.5, 2.5);
        const values = fitData();
        state.boardMessage = `a=${clean(state.intercept, 2)}, b=${clean(state.slope, 2)}: SSE=${clean(values.sse, 4)}, 1·r=${signed(values.residualSum, 3)}, x·r=${signed(values.xResidualSum, 3)}.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p236-answer-intercept")) { state.answerIntercept = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p236-answer-slope")) { state.answerSlope = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
    });
    root.querySelector("[data-p236-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const interceptRaw = event.currentTarget.querySelector("#p236-answer-intercept")?.value || "";
      const slopeRaw = event.currentTarget.querySelector("#p236-answer-slope")?.value || "";
      const intercept = parseNumber(interceptRaw), slope = parseNumber(slopeRaw);
      state.answerIntercept = interceptRaw.trim();
      state.answerSlope = slopeRaw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(intercept) || !Number.isFinite(slope)) state.feedback = "Enter both numerical coefficients: intercept a and slope b.";
      else if (Math.abs(intercept - OPTIMUM.slope) <= .02 && Math.abs(slope - OPTIMUM.intercept) <= .02) state.feedback = "Those are the right coefficients in reverse roles: a is the intercept and b is the slope.";
      else if (Math.abs(intercept - 1) <= .02 && Math.abs(slope - 1) <= .02) state.feedback = "That line fits two observations exactly, but least squares minimizes the total across all four. Check Xᵀr.";
      else if (Math.abs(intercept - OPTIMUM.intercept) > .02 || Math.abs(slope - OPTIMUM.slope) > .02) state.feedback = "Use Xᵀr=0: solve 4a+6b=10 and 6a+14b=21.";
      else {
        state.feedbackTone = "success";
        state.feedback = "Correct: a=0.7 and b=1.2. The residual vector is (0.3,0.1,−1.1,0.7), orthogonal to both design columns.";
        state.committed = true;
        state.stage = 2;
        settleAtOptimum();
      }
      renderAndFocus(renderApp, "#p236-answer-intercept");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
