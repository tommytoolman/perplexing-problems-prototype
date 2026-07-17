(function registerLeastSquaresPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "22.6";
  const POINTS = Object.freeze([
    Object.freeze({ x: 1, y: 2 }),
    Object.freeze({ x: 2, y: 3 }),
    Object.freeze({ x: 3, y: 5 }),
    Object.freeze({ x: 4, y: 4 }),
  ]);
  const OPTIMUM = Object.freeze({ intercept: 1.5, slope: .8, sse: 1.8 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Miss", title: "Measure every miss vertically", copy: "For the line y=a+bx, residual rᵢ=yᵢ−(a+bxᵢ) is a signed vertical difference. Ordinary least squares does not use the shortest perpendicular distance to the line." }),
    Object.freeze({ short: "Square", title: "Make every miss pay its square", copy: "Squaring removes cancellation and penalizes large misses strongly. The four changing tiles show rᵢ²; their sum is the objective SSE(a,b)." }),
    Object.freeze({ short: "Settle", title: "Reach the unique bottom of the bowl", copy: "At the minimum, Σrᵢ=0 and Σxᵢrᵢ=0. These normal equations identify a=1.5 and b=0.8; they do not make the fitted association causal." }),
  ]);
  const hints = Object.freeze([
    "For a trial line y=a+bx, calculate each vertical residual rᵢ=yᵢ−a−bxᵢ.",
    "Minimize SSE=Σrᵢ², not the signed sum Σrᵢ.",
    "The normal equations are Σrᵢ=0 and Σxᵢrᵢ=0.",
    "Use x̄=2.5, ȳ=3.5, Sxx=5 and Sxy=4, so b=Sxy/Sxx.",
    "Thus b=4/5=0.8 and a=ȳ−bx̄=1.5. Substitution gives SSE=1.8.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p226-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function clean(value, digits = 4) { const rounded = Number(Number(value).toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 2) { const number = Number(value); return `${number >= 0 ? "+" : "−"}${clean(Math.abs(number), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", "."); const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/); if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; } return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN; }

  function fitData(interceptInput = state.intercept, slopeInput = state.slope) {
    const intercept = Number(interceptInput), slope = Number(slopeInput);
    const rows = POINTS.map((point) => {
      const fitted = intercept + slope * point.x, residual = point.y - fitted, squaredResidual = residual ** 2;
      return { ...point, fitted, residual, squaredResidual };
    });
    const residualSum = rows.reduce((sum, row) => sum + row.residual, 0);
    const weightedResidualSum = rows.reduce((sum, row) => sum + row.x * row.residual, 0);
    return {
      intercept,
      slope,
      rows,
      sse: rows.reduce((sum, row) => sum + row.squaredResidual, 0),
      residualSum,
      weightedResidualSum,
      distanceFromOptimum: Math.hypot(intercept - OPTIMUM.intercept, slope - OPTIMUM.slope),
    };
  }

  const OPTIMUM_DATA = Object.freeze(fitData(OPTIMUM.intercept, OPTIMUM.slope));
  function initialState() {
    const start = fitData(3.5, 0);
    return {
      intercept: 3.5,
      slope: 0,
      stage: 0,
      trace: [{ intercept: 3.5, slope: 0, sse: start.sse }],
      answerIntercept: "",
      answerSlope: "",
      answerSse: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Begin with the horizontal line through the mean response. Its signed residuals cancel, but its SSE is 5.",
    };
  }
  let state = initialState();

  function pushTrace() {
    const data = fitData(), last = state.trace.at(-1);
    if (!last || Math.hypot(last.intercept - data.intercept, last.slope - data.slope) >= .035) {
      state.trace = [...state.trace, { intercept: data.intercept, slope: data.slope, sse: data.sse }].slice(-28);
    }
  }
  function settleAtOptimum(message = "Settled at y=1.5+0.8x. Both normal-equation residuals are zero and SSE=1.8.") {
    state.intercept = OPTIMUM.intercept;
    state.slope = OPTIMUM.slope;
    pushTrace();
    state.boardMessage = message;
  }

  function stageControlsMarkup() {
    return `<div class="p226-stage-controls" role="group" aria-label="Least-squares reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p226-stage" data-p226-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p226-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p226-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Minimum identified" : "Next stage"}</button></div>`;
  }

  function surfaceCells(mapSlope, mapIntercept) {
    const slopeSteps = 15, interceptSteps = 15, width = 196 / slopeSteps, height = 216 / interceptSteps;
    let markup = "";
    for (let row = 0; row < interceptSteps; row += 1) {
      for (let column = 0; column < slopeSteps; column += 1) {
        const slope = -.5 + (column + .5) / slopeSteps * 2.5;
        const intercept = (interceptSteps - row - .5) / interceptSteps * 4.5;
        const sse = fitData(intercept, slope).sse;
        const intensity = clamp(1 - Math.log1p(Math.max(0, sse - OPTIMUM.sse)) / Math.log(45), .08, 1);
        markup += `<rect class="p226-surface-cell" x="${clean(mapSlope(slope) - width / 2, 3)}" y="${clean(mapIntercept(intercept) - height / 2, 3)}" width="${clean(width + .35, 3)}" height="${clean(height + .35, 3)}" opacity="${clean(.12 + .74 * intensity, 3)}"/>`;
      }
    }
    return markup;
  }

  function regressionSvg() {
    const data = fitData();
    const mapX = (x) => 58 + (x - .5) / 4 * 385;
    const mapY = (y) => 307 - (y - .5) / 5.5 * 234;
    const mapSlope = (slope) => 521 + (slope + .5) / 2.5 * 196;
    const mapIntercept = (intercept) => 334 - intercept / 4.5 * 216;
    const lineStartY = data.intercept + data.slope * .5, lineEndY = data.intercept + data.slope * 4.5;
    const showSquares = state.stage >= 1 || state.revealed;
    const showSurface = state.stage >= 2 || state.revealed;
    const residuals = data.rows.map((row, index) => {
      const x = mapX(row.x), observedY = mapY(row.y), fittedY = mapY(row.fitted);
      const labelY = clamp((observedY + fittedY) / 2 - 4, 82, 296);
      return `<g class="p226-residual r${index + 1}"><line x1="${clean(x, 3)}" y1="${clean(observedY, 3)}" x2="${clean(x, 3)}" y2="${clean(fittedY, 3)}"/><path d="M${clean(x - 5, 3)} ${clean(fittedY, 3)}h10"/><text x="${clean(x + 8, 3)}" y="${clean(labelY, 3)}">r${index + 1}=${signed(row.residual)}</text></g>`;
    }).join("");
    const points = data.rows.map((row, index) => `<g class="p226-point"><circle cx="${mapX(row.x)}" cy="${mapY(row.y)}" r="6"/><text x="${mapX(row.x) + 9}" y="${mapY(row.y) - 8}">(${row.x},${row.y})</text><title>Point ${index + 1}: x ${row.x}, y ${row.y}; fitted y ${clean(row.fitted, 3)}; vertical residual ${clean(row.residual, 3)}; squared residual ${clean(row.squaredResidual, 4)}</title></g>`).join("");
    const squares = data.rows.map((row, index) => {
      const side = 9 + 12 * Math.min(Math.abs(row.residual), 2), x = 75 + index * 93, y = 385 - side;
      return `<g class="p226-square"><rect x="${clean(x, 3)}" y="${clean(y, 3)}" width="${clean(side, 3)}" height="${clean(side, 3)}" rx="2"/><text x="${clean(x + side + 5, 3)}" y="381">r${index + 1}²=${clean(row.squaredResidual, 2)}</text></g>`;
    }).join("");
    const trace = state.trace.map((point, index) => `<circle class="p226-trace-dot" cx="${clean(mapSlope(point.slope), 3)}" cy="${clean(mapIntercept(point.intercept), 3)}" r="${index === state.trace.length - 1 ? 3.2 : 1.9}"><title>Visited a=${clean(point.intercept, 2)}, b=${clean(point.slope, 2)}, SSE=${clean(point.sse, 3)}</title></circle>`).join("");
    const description = `Four fixed points are fitted by y equals ${clean(data.intercept, 2)} plus ${clean(data.slope, 2)} x. Vertical residuals are ${data.rows.map((row) => clean(row.residual, 3)).join(", ")} and their squared sum is ${clean(data.sse, 4)}. The ordinary least-squares optimum is y equals 1.5 plus 0.8 x with residuals minus 0.3, minus 0.1, plus 1.1 and minus 0.7, and SSE 1.8. The parameter surface marks the current intercept and slope and the optimum.`;
    return `<svg class="p226-regression p226-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p226-svg-title p226-svg-desc"><title id="p226-svg-title">Vertical least-squares line and SSE parameter surface</title><desc id="p226-svg-desc">${description}</desc><defs><linearGradient id="p226-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#30283e"/></linearGradient><clipPath id="p226-plot-clip"><rect x="48" y="60" width="410" height="254" rx="8"/></clipPath><clipPath id="p226-surface-clip"><rect x="510" y="112" width="218" height="232" rx="8"/></clipPath></defs><rect class="p226-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p226-board-kicker" x="22" y="27">ORDINARY LEAST SQUARES · VERTICAL MISSES · FOUR FIXED POINTS</text><g class="p226-data-panel"><rect x="20" y="43" width="460" height="358" rx="15"/><text class="p226-panel-title" x="38" y="66">DATA SPACE · y=a+bx</text><g class="p226-grid">${[1,2,3,4,5,6].map((y) => `<line x1="58" y1="${mapY(y)}" x2="443" y2="${mapY(y)}"/><text x="50" y="${mapY(y) + 3}" text-anchor="end">${y}</text>`).join("")}${[1,2,3,4].map((x) => `<line x1="${mapX(x)}" y1="73" x2="${mapX(x)}" y2="307"/><text x="${mapX(x)}" y="322" text-anchor="middle">${x}</text>`).join("")}</g><g clip-path="url(#p226-plot-clip)"><path class="p226-fit-line" d="M${mapX(.5)} ${mapY(lineStartY)}L${mapX(4.5)} ${mapY(lineEndY)}"/>${residuals}${points}</g><text class="p226-line-label" x="437" y="89" text-anchor="end">y=${clean(data.intercept, 2)} ${data.slope >= 0 ? "+" : "−"} ${clean(Math.abs(data.slope), 2)}x</text><g class="p226-square-ledger ${showSquares ? "is-visible" : ""}"><line x1="40" y1="338" x2="458" y2="338"/><text class="p226-ledger-kicker" x="40" y="355">SQUARED MISSES · AREA ∝ |r|²</text>${squares}<text class="p226-sse-total" x="458" y="392" text-anchor="end">SSE=${clean(data.sse, 3)}</text></g></g><g class="p226-surface-panel ${showSurface ? "is-visible" : ""}"><rect x="495" y="43" width="245" height="358" rx="15"/><text class="p226-panel-title" x="512" y="66">PARAMETER BOWL · SSE(a,b)</text><text class="p226-surface-note" x="512" y="86">brighter = lower SSE · trace = your path</text><g clip-path="url(#p226-surface-clip)">${surfaceCells(mapSlope, mapIntercept)}${trace}<path class="p226-optimum-mark" d="M${mapSlope(OPTIMUM.slope) - 6} ${mapIntercept(OPTIMUM.intercept)}h12M${mapSlope(OPTIMUM.slope)} ${mapIntercept(OPTIMUM.intercept) - 6}v12"/><circle class="p226-current-mark" cx="${mapSlope(data.slope)}" cy="${mapIntercept(data.intercept)}" r="6"/></g><line class="p226-surface-axis" x1="521" y1="334" x2="717" y2="334"/><line class="p226-surface-axis" x1="521" y1="118" x2="521" y2="334"/><text class="p226-axis-label" x="717" y="350" text-anchor="end">slope b</text><text class="p226-axis-label" x="511" y="122" text-anchor="end">a</text><text class="p226-surface-tick" x="521" y="350" text-anchor="middle">−.5</text><text class="p226-surface-tick" x="${mapSlope(.8)}" y="350" text-anchor="middle">.8</text><text class="p226-surface-tick" x="717" y="350" text-anchor="middle">2</text><text class="p226-surface-tick" x="512" y="337" text-anchor="end">0</text><text class="p226-surface-tick" x="512" y="${mapIntercept(1.5) + 3}" text-anchor="end">1.5</text><text class="p226-surface-tick" x="512" y="121" text-anchor="end">4.5</text><text class="p226-optimum-label" x="512" y="374">optimum × · a=1.5 · b=.8</text><text class="p226-normal-audit" x="512" y="391">Σr=${signed(data.residualSum, 3)} · Σxr=${signed(data.weightedResidualSum, 3)}</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = fitData();
    return `<section class="p226-controls" aria-label="Least-squares line controls"><div class="p226-slider-grid"><label for="p226-intercept"><span>Intercept a <output>${clean(state.intercept, 2)}</output></span><input id="p226-intercept" type="range" min="0" max="4.5" step="0.05" value="${state.intercept}" aria-valuetext="Intercept ${clean(state.intercept, 2)}; slope ${clean(state.slope, 2)}; SSE ${clean(data.sse, 4)}"/></label><label for="p226-slope"><span>Slope b <output>${clean(state.slope, 2)}</output></span><input id="p226-slope" type="range" min="-0.5" max="2" step="0.05" value="${state.slope}" aria-valuetext="Slope ${clean(state.slope, 2)}; intercept ${clean(state.intercept, 2)}; SSE ${clean(data.sse, 4)}"/></label></div><div class="p226-control-actions"><button class="primary-button" type="button" data-problem-action="p226-settle">Settle at the least-squares minimum</button><button class="ghost-button" type="button" data-problem-action="p226-mean-line">Return to horizontal mean line</button></div><p data-p226-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const data = fitData();
    return `<section class="p226-metrics" aria-live="polite"><article><span>Trial line</span><strong>y=${clean(data.intercept, 2)} ${data.slope >= 0 ? "+" : "−"} ${clean(Math.abs(data.slope), 2)}x</strong><small>vertical prediction</small></article><article><span>Sum of squared errors</span><strong>${clean(data.sse, 4)}</strong><small>Σ[yᵢ−(a+bxᵢ)]²</small></article><article><span>Normal-equation audit</span><strong>${clean(data.residualSum, 3)} · ${clean(data.weightedResidualSum, 3)}</strong><small>Σr · Σxr; both zero at optimum</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p226-distinction"><strong>OLS makes two precise choices—and no causal claim.</strong><span>It minimizes vertical y-residuals, assuming x is the predictor. Orthogonal regression minimizes perpendicular distances and generally gives a different line. A fitted association alone does not show that changing x causes y to change.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p226-dynamic">${regressionSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p226-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p226-solution" aria-labelledby="p226-solution-heading"><h3 id="p226-solution-heading" tabindex="-1">The normal equations put the line at the bowl's bottom</h3><p>For y=a+bx, ordinary least squares minimizes the sum of squared <em>vertical</em> residuals:</p><div class="p226-equation">SSE(a,b)=Σ[yᵢ−(a+bxᵢ)]².</div><p>Differentiating with respect to a and b gives the normal equations Σrᵢ=0 and Σxᵢrᵢ=0. Equivalently, the fitted line passes through (x̄,ȳ)=(2.5,3.5), and</p><div class="p226-equation">b=Sxy/Sxx=4/5=<strong>0.8</strong>,<br>a=ȳ−bx̄=3.5−0.8(2.5)=<strong>1.5</strong>.</div><p>The fitted values are 2.3, 3.1, 3.9 and 4.7, so the residuals are −0.3, −0.1, +1.1 and −0.7. Therefore</p><div class="p226-equation is-answer">SSE=(−0.3)²+(−0.1)²+(1.1)²+(−0.7)²<br>=0.09+0.01+1.21+0.49<br>=<strong>1.8</strong>.</div><p>Both audits vanish: Σrᵢ=0 and Σxᵢrᵢ=0. This is the vertical OLS fit y=1.5+0.8x. It is not an orthogonal-distance fit, and it describes association rather than establishing causation.</p></section>`;
  }

  function snapshot() {
    const data = fitData();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      model: "ordinary least squares with vertical y residuals and x treated as predictor",
      data: POINTS,
      currentFit: {
        equation: `y=${data.intercept}+${data.slope}x`,
        intercept: data.intercept,
        slope: data.slope,
        fitted: data.rows.map((row) => row.fitted),
        residuals: data.rows.map((row) => row.residual),
        squaredResiduals: data.rows.map((row) => row.squaredResidual),
        sse: data.sse,
        normalEquationResiduals: { sumResiduals: data.residualSum, sumXResiduals: data.weightedResidualSum },
      },
      optimum: {
        equation: "y=1.5+0.8x",
        intercept: OPTIMUM.intercept,
        slope: OPTIMUM.slope,
        fitted: OPTIMUM_DATA.rows.map((row) => row.fitted),
        residuals: OPTIMUM_DATA.rows.map((row) => row.residual),
        squaredResiduals: OPTIMUM_DATA.rows.map((row) => row.squaredResidual),
        sse: OPTIMUM_DATA.sse,
        normalEquationResiduals: { sumResiduals: OPTIMUM_DATA.residualSum, sumXResiduals: OPTIMUM_DATA.weightedResidualSum },
        means: { x: 2.5, y: 3.5 },
        centredSums: { Sxx: 5, Sxy: 4 },
      },
      distinction: {
        minimizedDistance: "vertical residuals y_i-(a+b*x_i)",
        orthogonalDistance: "not minimized by this activity",
        causalClaim: false,
      },
      trace: state.trace,
      stage: state.stage + 1,
      answers: { intercept: state.answerIntercept || null, slope: state.answerSlope || null, sse: state.answerSse || null },
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p226-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Statistics and Inference</strong><span class="eyebrow">Chapter 22 · least squares</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p226-spread"><article class="book-page p226-problem-page"><div class="problem-number">Problem 22.6</div><h1 class="book-title p226-title">The Line That Pays for Its Misses</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p226-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Fit a line y=a+bx to the four points (1,2), (2,3), (3,5), (4,4) by minimizing the sum of squared <strong>vertical</strong> residuals.</p><p class="problem-copy"><strong>Find a, b and the minimum SSE.</strong></p><section class="p226-question-card"><strong>Every miss pays quadratically</strong><p>A residual twice as large contributes four times as much to the objective. The direction of measurement matters: here misses are vertical.</p></section></article><section class="book-page book-stage p226-stage" aria-labelledby="p226-stage-heading">${stageControlsMarkup()}<div class="p226-stage-heading"><div><span class="eyebrow">Least-squares laboratory</span><h2 id="p226-stage-heading">Move the line through its error bowl</h2></div><p>Adjust intercept and slope; watch vertical residuals, their squares, and the path across parameter space update together.</p></div><div class="p226-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p226-coach"><div class="coach-kicker">Name the minimizing line</div><p class="coach-question">Enter the intercept a, slope b and minimum sum of squared errors.</p><form class="p226-answer-form" data-p226-answer-form novalidate><label for="p226-answer-intercept">Intercept a<input id="p226-answer-intercept" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answerIntercept)}" placeholder="a"/></label><label for="p226-answer-slope">Slope b<input id="p226-answer-slope" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answerSlope)}" placeholder="b"/></label><label for="p226-answer-sse">Minimum SSE<input id="p226-answer-sse" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answerSse)}" placeholder="Σr²"/></label><small>Decimals or fractions are accepted; ±0.02 is allowed for each value.</small><button class="primary-button" type="submit">Check fit</button></form>${feedbackMarkup()}<div class="button-row p226-help-row"><button class="secondary-button" type="button" data-problem-action="p226-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p226-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p226-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p226-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p226-dynamic");
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
    const root = document.querySelector(".p226-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p226-reset") { state = initialState(); renderAndFocus(renderApp, "#p226-intercept"); return; }
      if (action === "p226-stage") { state.stage = clamp(Math.round(Number(control.dataset.p226Stage)), 0, 2); renderAndFocus(renderApp, `[data-p226-stage="${state.stage}"]`); return; }
      if (action === "p226-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p226-stage="${state.stage}"]`); return; }
      if (action === "p226-settle") { state.stage = 2; settleAtOptimum(); updateDynamicDom(); return; }
      if (action === "p226-mean-line") { state.intercept = 3.5; state.slope = 0; pushTrace(); state.boardMessage = "Returned to y=3.5. Here Σr=0, but Σxr=4 and SSE=5, so a horizontal line is not the two-parameter minimum."; updateDynamicDom(); return; }
      if (action === "p226-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p226-reveal") { state.revealed = true; state.stage = 2; settleAtOptimum(); }
      renderApp();
      if (action === "p226-reveal") window.requestAnimationFrame(() => document.querySelector("#p226-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p226-intercept")) {
        state.intercept = clamp(Number(event.target.value), 0, 4.5);
        pushTrace();
        const data = fitData();
        state.boardMessage = `a=${clean(state.intercept, 2)}, b=${clean(state.slope, 2)} gives SSE=${clean(data.sse, 4)}. Follow the brighter surface toward the ×.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p226-slope")) {
        state.slope = clamp(Number(event.target.value), -.5, 2);
        pushTrace();
        const data = fitData();
        state.boardMessage = `a=${clean(state.intercept, 2)}, b=${clean(state.slope, 2)} gives SSE=${clean(data.sse, 4)}. Vertical residuals—not perpendicular distances—feed the total.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p226-answer-intercept")) { state.answerIntercept = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p226-answer-slope")) { state.answerSlope = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p226-answer-sse")) { state.answerSse = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
    });
    root?.querySelector("[data-p226-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const aRaw = event.currentTarget.querySelector("#p226-answer-intercept")?.value || "";
      const bRaw = event.currentTarget.querySelector("#p226-answer-slope")?.value || "";
      const sseRaw = event.currentTarget.querySelector("#p226-answer-sse")?.value || "";
      const a = parseNumber(aRaw), b = parseNumber(bRaw), sse = parseNumber(sseRaw);
      state.answerIntercept = aRaw.trim();
      state.answerSlope = bRaw.trim();
      state.answerSse = sseRaw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (![a, b, sse].every(Number.isFinite)) state.feedback = "Enter all three numerical values: intercept a, slope b and minimum SSE.";
      else if (Math.abs(a - OPTIMUM.slope) <= .02 && Math.abs(b - OPTIMUM.intercept) <= .02) state.feedback = "The coefficient values are reversed: a is the intercept and b is the slope.";
      else if (Math.abs(a - OPTIMUM.intercept) > .02 || Math.abs(b - OPTIMUM.slope) > .02) state.feedback = "Minimize Σ[yᵢ−(a+bxᵢ)]². The normal equations require both Σr and Σxr to vanish.";
      else if (Math.abs(sse - OPTIMUM.sse) > .02) state.feedback = "Your line is correct. Now square its residuals −0.3, −0.1, +1.1 and −0.7 and add them.";
      else {
        state.feedbackTone = "success";
        state.feedback = "Correct: y=1.5+0.8x has residuals −0.3, −0.1, +1.1, −0.7 and minimum SSE=1.8.";
        state.committed = true;
        state.stage = 2;
        settleAtOptimum();
      }
      renderAndFocus(renderApp, "#p226-answer-intercept");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
