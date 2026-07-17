(function registerCosineTaylorPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "24.5";
  const CHALLENGE_X = .5;
  const CHALLENGE_DEGREE = 4;
  const GRAPH_DOMAIN = Object.freeze({ minimum: -1.2, maximum: 1.2 });
  const DEGREES = Object.freeze([0, 2, 4, 6, 8]);
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Build", title: "Accumulate even Taylor terms at the origin", copy: "Cosine contributes only even powers: 1, −x²/2!, +x⁴/4!, and so on. Raising the degree makes more derivatives agree at x=0." }),
    Object.freeze({ short: "Compare", title: "Compare the local polynomial with cosine", copy: "The polynomial and cosine curves nearly coincide close to 0, but they are not identical functions. The error panel magnifies their absolute difference." }),
    Object.freeze({ short: "Certify", title: "Place the true error inside a remainder bound", copy: "On |x|≤1.2 the alternating term magnitudes decrease. Therefore the first omitted term bounds the absolute error everywhere on the displayed domain." }),
  ]);
  const hints = Object.freeze([
    "Use P₄(x)=1−x²/2!+x⁴/4!.",
    "At x=0.5, x²=0.25 and x⁴=0.0625.",
    "So P₄(0.5)=1−0.25/2+0.0625/24.",
    "For the actual absolute error, compare that value with cos(0.5).",
    "The first omitted term is 0.5⁶/6!=0.5⁶/720, which certifies an upper bound.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p245-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function clean(value, digits = 10) { const rounded = Number(Number(value).toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-").replaceAll("×10^", "e");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }
  function factorial(value) { let result = 1; for (let factor = 2; factor <= value; factor += 1) result *= factor; return result; }
  function normalizeDegree(value) { const numeric = clamp(Math.round(Number(value) / 2) * 2, DEGREES[0], DEGREES.at(-1)); return DEGREES.includes(numeric) ? numeric : CHALLENGE_DEGREE; }
  function taylorCosine(x, degree) {
    let total = 0;
    for (let power = 0; power <= degree; power += 2) total += (power % 4 === 0 ? 1 : -1) * x ** power / factorial(power);
    return total;
  }
  function nextTermBound(x, degree) { const nextPower = degree + 2; return Math.abs(x) ** nextPower / factorial(nextPower); }
  function approximationData(xInput = state.evaluationX, degreeInput = state.degree) {
    const x = Number(xInput), degree = normalizeDegree(degreeInput), approximation = taylorCosine(x, degree), actual = Math.cos(x);
    const signedError = approximation - actual, absoluteError = Math.abs(signedError), bound = nextTermBound(x, degree);
    return { x, degree, approximation, actual, signedError, absoluteError, bound, boundSlack: bound - absoluteError, withinBound: absoluteError <= bound + 1e-15, errorToBoundRatio: bound ? absoluteError / bound : 0 };
  }
  function superscriptInteger(value) {
    const glyphs = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(value).split("").map((character) => glyphs[character] || character).join("");
  }
  function scientific(value, digits = 5) {
    const number = Math.abs(Number(value));
    if (number === 0) return "0";
    const exponent = Math.floor(Math.log10(number)), mantissa = number / 10 ** exponent;
    return `${clean(mantissa, digits)}×10${superscriptInteger(exponent)}`;
  }
  function polynomialFormula(degree) {
    const terms = [];
    for (let power = 0; power <= degree; power += 2) {
      if (power === 0) terms.push("1");
      else terms.push(`${power % 4 === 0 ? "+" : "−"} x${superscriptInteger(power)}/${power}!`);
    }
    return `P${superscriptInteger(degree)}(x)=${terms.join(" ")}`;
  }

  const CHALLENGE = Object.freeze(approximationData(CHALLENGE_X, CHALLENGE_DEGREE));
  function initialState() {
    return {
      degree: 2,
      evaluationX: CHALLENGE_X,
      stage: 0,
      approximationAnswer: "",
      errorAnswer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Start with P₂. Raise the degree to 4 to add the x⁴/4! term required by the challenge.",
    };
  }
  let state = initialState();

  function restoreChallenge(message = "Challenge restored: degree 4 at x=0.5, with the actual error sitting just below the first-omitted-term bound.") {
    state.degree = CHALLENGE_DEGREE;
    state.evaluationX = CHALLENGE_X;
    state.boardMessage = message;
  }
  function stageControlsMarkup() {
    return `<div class="p245-stage-controls" role="group" aria-label="Taylor approximation stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p245-stage" data-p245-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p245-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p245-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Remainder certified" : "Next stage"}</button></div>`;
  }

  function curvePath(fn, mapX, mapY, samples = 241) {
    return Array.from({ length: samples }, (_, index) => {
      const x = GRAPH_DOMAIN.minimum + index / (samples - 1) * (GRAPH_DOMAIN.maximum - GRAPH_DOMAIN.minimum);
      return `${index ? "L" : "M"}${clean(mapX(x), 3)} ${clean(mapY(fn(x)), 3)}`;
    }).join("");
  }

  function taylorSvg() {
    const values = approximationData();
    const mapMainX = (x) => 53 + (x - GRAPH_DOMAIN.minimum) / (GRAPH_DOMAIN.maximum - GRAPH_DOMAIN.minimum) * 397;
    const mapMainY = (y) => 320 - (y - .2) / .85 * 220;
    const mapErrorX = (x) => 508 + (x - GRAPH_DOMAIN.minimum) / (GRAPH_DOMAIN.maximum - GRAPH_DOMAIN.minimum) * 212;
    const domainBound = nextTermBound(GRAPH_DOMAIN.maximum, values.degree), errorScaleMaximum = Math.max(domainBound * 1.12, Number.EPSILON);
    const mapErrorY = (error) => 320 - error / errorScaleMaximum * 220;
    const polynomialPath = curvePath((x) => taylorCosine(x, values.degree), mapMainX, mapMainY);
    const cosinePath = curvePath((x) => Math.cos(x), mapMainX, mapMainY);
    const errorPath = curvePath((x) => Math.abs(taylorCosine(x, values.degree) - Math.cos(x)), mapErrorX, mapErrorY);
    const boundPath = curvePath((x) => nextTermBound(x, values.degree), mapErrorX, mapErrorY);
    const showComparison = state.stage >= 1 || state.revealed, showBound = state.stage >= 2 || state.revealed;
    const selectedMainX = mapMainX(values.x), selectedPolynomialY = mapMainY(values.approximation), selectedCosineY = mapMainY(values.actual);
    const selectedErrorX = mapErrorX(values.x), selectedErrorY = mapErrorY(values.absoluteError), selectedBoundY = mapErrorY(values.bound);
    const description = `The displayed Taylor polynomial has degree ${values.degree}. At x ${clean(values.x, 2)}, it equals ${clean(values.approximation, 12)}, cosine equals ${clean(values.actual, 12)}, absolute error is ${values.absoluteError.toExponential(8)}, and the first omitted term bound is ${values.bound.toExponential(8)}. The main panel compares both functions on minus 1.2 to 1.2. The error panel magnifies absolute error and its certified bound. For the challenge degree 4 at x 0.5, the approximation is 0.8776041667, actual error is about 2.16048 times 10 to the minus 5, and the bound is about 2.17014 times 10 to the minus 5.`;
    return `<svg class="p245-taylor p245-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p245-svg-title p245-svg-desc"><title id="p245-svg-title">Cosine Taylor polynomial, absolute error and certified remainder bound</title><desc id="p245-svg-desc">${description}</desc><defs><linearGradient id="p245-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#30283e"/></linearGradient><linearGradient id="p245-bound-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#70c8bc" stop-opacity=".28"/><stop offset="1" stop-color="#70c8bc" stop-opacity=".03"/></linearGradient></defs><rect class="p245-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p245-board-kicker" x="22" y="27">LOCAL POLYNOMIAL AT 0 · MAGNIFIED ERROR · FIRST OMITTED TERM CERTIFICATE</text><g class="p245-function-panel"><rect x="20" y="43" width="450" height="358" rx="15"/><text class="p245-panel-title" x="38" y="67">FUNCTION VIEW · −1.2≤x≤1.2</text><g class="p245-grid">${[-1.2,-.6,0,.6,1.2].map((x) => `<line x1="${mapMainX(x)}" y1="91" x2="${mapMainX(x)}" y2="320"/><text x="${mapMainX(x)}" y="337" text-anchor="middle">${clean(x, 1)}</text>`).join("")}${[.2,.4,.6,.8,1].map((y) => `<line x1="53" y1="${mapMainY(y)}" x2="450" y2="${mapMainY(y)}"/><text x="46" y="${mapMainY(y) + 3}" text-anchor="end">${clean(y, 1)}</text>`).join("")}</g><path class="p245-polynomial-curve" d="${polynomialPath}"/><g class="p245-cosine-group ${showComparison ? "is-visible" : ""}"><path class="p245-cosine-curve" d="${cosinePath}"/><line class="p245-selected-gap" x1="${selectedMainX}" y1="${selectedPolynomialY}" x2="${selectedMainX}" y2="${selectedCosineY}"/><circle class="p245-cosine-point" cx="${selectedMainX}" cy="${selectedCosineY}" r="5"/></g><circle class="p245-polynomial-point" cx="${selectedMainX}" cy="${selectedPolynomialY}" r="6"/><line class="p245-selected-guide" x1="${selectedMainX}" y1="${Math.min(selectedPolynomialY, selectedCosineY)}" x2="${selectedMainX}" y2="320"/><text class="p245-curve-label is-polynomial" x="60" y="112">P${superscriptInteger(values.degree)}(x)</text><text class="p245-curve-label is-cosine ${showComparison ? "is-visible" : ""}" x="60" y="129">cos x</text><text class="p245-selected-label" x="${clamp(selectedMainX, 110, 400)}" y="${clamp(Math.min(selectedPolynomialY, selectedCosineY) - 13, 92, 301)}" text-anchor="middle">x=${clean(values.x, 2)} · P=${clean(values.approximation, 9)}</text><line class="p245-formula-rule" x1="38" y1="352" x2="452" y2="352"/><text class="p245-formula" x="38" y="378">${polynomialFormula(values.degree)}</text></g><g class="p245-error-panel ${showComparison ? "is-visible" : ""}"><rect x="485" y="43" width="255" height="358" rx="15"/><text class="p245-panel-title" x="503" y="67">MAGNIFIED ABSOLUTE ERROR</text><text class="p245-error-scale" x="503" y="84">vertical top = ${scientific(errorScaleMaximum, 3)}</text><g class="p245-error-grid">${[-1.2,-.6,0,.6,1.2].map((x) => `<line x1="${mapErrorX(x)}" y1="100" x2="${mapErrorX(x)}" y2="320"/><text x="${mapErrorX(x)}" y="337" text-anchor="middle">${clean(x, 1)}</text>`).join("")}<line x1="508" y1="320" x2="720" y2="320"/></g><g class="p245-bound-group ${showBound ? "is-visible" : ""}"><path class="p245-bound-area" d="${boundPath}L720 320L508 320Z"/><path class="p245-bound-curve" d="${boundPath}"/><circle class="p245-bound-point" cx="${selectedErrorX}" cy="${selectedBoundY}" r="5"/></g><path class="p245-error-curve" d="${errorPath}"/><circle class="p245-error-point" cx="${selectedErrorX}" cy="${selectedErrorY}" r="6"/><line class="p245-error-guide" x1="${selectedErrorX}" y1="${Math.min(selectedErrorY, selectedBoundY)}" x2="${selectedErrorX}" y2="320"/><text class="p245-error-label" x="513" y="111">|P−cos|</text><text class="p245-bound-label ${showBound ? "is-visible" : ""}" x="513" y="128">next-term bound</text><g class="p245-bound-card ${showBound ? "is-visible" : ""}" transform="translate(503 350)"><rect width="219" height="39" rx="9"/><text x="10" y="16">at x=${clean(values.x, 2)}</text><text class="p245-bound-result" x="209" y="29" text-anchor="end">${scientific(values.absoluteError, 5)} ≤ ${scientific(values.bound, 5)}</text></g></g></svg>`;
  }

  function controlsMarkup() {
    const values = approximationData();
    return `<section class="p245-controls" aria-label="Taylor polynomial degree and evaluation point"><div class="p245-slider-grid"><label for="p245-degree"><span>Highest even degree <output>${values.degree}</output></span><input id="p245-degree" type="range" min="0" max="8" step="2" value="${values.degree}" aria-valuetext="Taylor polynomial degree ${values.degree}; ${polynomialFormula(values.degree)}"/></label><label for="p245-x"><span>Evaluation point x <output>${clean(values.x, 2)}</output></span><input id="p245-x" type="range" min="0" max="1.2" step="0.05" value="${values.x}" aria-valuetext="x ${clean(values.x, 2)}; approximation ${clean(values.approximation, 12)}; absolute error ${values.absoluteError.toExponential(7)}; bound ${values.bound.toExponential(7)}"/></label></div><p data-p245-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const values = approximationData();
    return `<section class="p245-metrics" aria-live="polite"><article><span>Polynomial value</span><strong>${clean(values.approximation, 10)}</strong><small>P${values.degree}(${clean(values.x, 2)})</small></article><article><span>Actual |P−cos|</span><strong>${scientific(values.absoluteError, 5)}</strong><small>measured against cos x</small></article><article><span>Certified upper bound</span><strong>${scientific(values.bound, 5)}</strong><small>first omitted term</small></article></section>`;
  }
  function localityMarkup() {
    return `<section class="p245-locality"><strong>A Taylor polynomial is locally accurate; it is not an identity.</strong><span>Matching finitely many derivatives at 0 does not make P(x)=cos x for every x. The remainder estimate supplies the missing quantitative statement: on this displayed domain, the true error is no larger than the first omitted term.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p245-dynamic">${taylorSvg()}${controlsMarkup()}${metricsMarkup()}${localityMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p245-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p245-solution" aria-labelledby="p245-solution-heading"><h3 id="p245-solution-heading" tabindex="-1">The quartic term buys roughly five correct decimal places</h3><p>At x=0.5,</p><div class="p245-equation">x²=0.25, &nbsp; x⁴=0.0625.</div><p>Therefore</p><div class="p245-equation is-answer">P₄(0.5)=1−0.25/2+0.0625/24<br>=<strong>0.8776041667</strong> (rounded).</div><p>The calculator value is cos(0.5)≈0.8775825619, so the actual absolute error is</p><div class="p245-equation">|P₄(0.5)−cos(0.5)|<br>≈<strong>2.16048×10⁻⁵</strong>.</div><p>The cosine series alternates and its term magnitudes decrease on |x|≤1.2. Hence the first omitted term certifies</p><div class="p245-equation">|R₄(0.5)|≤0.5⁶/6!<br>=0.5⁶/720<br>≈<strong>2.17014×10⁻⁵</strong>.</div><p>The measured error lies just below the bound. This bound—not visual similarity alone—is the rigorous accuracy guarantee.</p></section>`;
  }

  function snapshot() {
    const values = approximationData();
    let maximumBoundViolation = -Infinity, worstX = GRAPH_DOMAIN.minimum;
    for (let index = 0; index <= 2400; index += 1) {
      const x = GRAPH_DOMAIN.minimum + index / 2400 * (GRAPH_DOMAIN.maximum - GRAPH_DOMAIN.minimum);
      const sample = approximationData(x, values.degree), violation = sample.absoluteError - sample.bound;
      if (violation > maximumBoundViolation) { maximumBoundViolation = violation; worstX = x; }
    }
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      expansionCentre: 0,
      displayedDomain: [GRAPH_DOMAIN.minimum, GRAPH_DOMAIN.maximum],
      activePolynomial: { degree: values.degree, formula: polynomialFormula(values.degree), evaluationX: values.x, approximation: values.approximation, cosine: values.actual, signedError: values.signedError, absoluteError: values.absoluteError },
      certificate: {
        type: "alternating-series first-omitted-term bound",
        nextPower: values.degree + 2,
        bound: values.bound,
        withinBound: values.withinBound,
        slack: values.boundSlack,
        errorToBoundRatio: values.errorToBoundRatio,
        domainJustification: "on |x|<=1.2, successive cosine-series term magnitudes decrease; maximum initial magnitude ratio is 1.2^2/2=0.72<1",
        sampledDomainAudit: { samples: 2401, maximumActualMinusBound: maximumBoundViolation, worstX },
      },
      challenge: {
        x: CHALLENGE_X,
        degree: CHALLENGE_DEGREE,
        formula: "1-x^2/2+x^4/24",
        approximation: CHALLENGE.approximation,
        actualCosine: CHALLENGE.actual,
        signedError: CHALLENGE.signedError,
        absoluteError: CHALLENGE.absoluteError,
        nextTermBound: CHALLENGE.bound,
      },
      interpretation: "finite Taylor polynomial is a local approximation, not an identity; the remainder bound certifies accuracy",
      stage: state.stage + 1,
      answers: { approximation: state.approximationAnswer || null, actualAbsoluteError: state.errorAnswer || null },
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p245-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Calculus and Optimisation</strong><span class="eyebrow">Chapter 24 · Taylor approximation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p245-spread"><article class="book-page p245-problem-page"><div class="problem-number">Problem 24.5</div><h1 class="book-title p245-title">The Pocket Calculator’s Cosine</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p245-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Use the quartic Taylor polynomial</p><div class="p245-given-formula">cos x ≈ 1−x²/2+x⁴/24</div><p class="problem-copy">to approximate cos(0.5). <strong>Give the approximation and its actual absolute error.</strong></p><section class="p245-question-card"><strong>Approximation needs a certificate</strong><p>The first omitted Taylor term will give a rigorous upper bound to compare with the error measured against cos(0.5).</p></section></article><section class="book-page book-stage p245-stage" aria-labelledby="p245-stage-heading">${stageControlsMarkup()}<div class="p245-stage-heading"><div><span class="eyebrow">Taylor laboratory</span><h2 id="p245-stage-heading">Add terms, then magnify what remains</h2></div><p>Change the even degree and evaluation point; the function comparison, error curve and remainder bound update together.</p></div><div class="p245-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p245-coach"><div class="coach-kicker">Approximate cos(0.5)</div><p class="coach-question">For the fixed degree-4 challenge, enter P₄(0.5) and the actual absolute error |P₄(0.5)−cos(0.5)|.</p><form class="p245-answer-form" data-p245-answer-form novalidate><label for="p245-answer-approximation">Quartic approximation<input id="p245-answer-approximation" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.approximationAnswer)}" placeholder="P₄(0.5)"/></label><label for="p245-answer-error">Actual absolute error<input id="p245-answer-error" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.errorAnswer)}" placeholder="e.g. 2.16e-5"/></label><small>The error field asks for the measured error, not the slightly larger certified bound.</small><button class="primary-button" type="submit">Check values</button></form>${feedbackMarkup()}<div class="button-row p245-help-row"><button class="secondary-button" type="button" data-problem-action="p245-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p245-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p245-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p245-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p245-dynamic");
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
    const root = document.querySelector(".p245-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p245-reset") { state = initialState(); renderAndFocus(renderApp, "#p245-degree"); return; }
      if (action === "p245-stage") { state.stage = clamp(Math.round(Number(control.dataset.p245Stage)), 0, 2); renderAndFocus(renderApp, `[data-p245-stage="${state.stage}"]`); return; }
      if (action === "p245-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p245-stage="${state.stage}"]`); return; }
      if (action === "p245-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p245-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p245-reveal") window.requestAnimationFrame(() => document.querySelector("#p245-solution-heading")?.focus());
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p245-degree")) {
        state.degree = normalizeDegree(event.target.value);
        const values = approximationData();
        state.boardMessage = `Degree ${state.degree}: ${polynomialFormula(state.degree)}. At x=${clean(state.evaluationX, 2)}, actual error ${scientific(values.absoluteError, 5)} is bounded by ${scientific(values.bound, 5)}.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p245-x")) {
        state.evaluationX = clamp(Math.round(Number(event.target.value) * 20) / 20, 0, 1.2);
        const values = approximationData();
        state.boardMessage = `At x=${clean(state.evaluationX, 2)}, P${state.degree}=${clean(values.approximation, 10)}; |error|=${scientific(values.absoluteError, 5)}≤${scientific(values.bound, 5)}.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p245-answer-approximation")) { state.approximationAnswer = event.target.value.slice(0, 30); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p245-answer-error")) { state.errorAnswer = event.target.value.slice(0, 30); state.feedback = ""; state.committed = false; }
    });
    root.querySelector("[data-p245-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const approximationRaw = event.currentTarget.querySelector("#p245-answer-approximation")?.value || "";
      const errorRaw = event.currentTarget.querySelector("#p245-answer-error")?.value || "";
      const approximation = parseNumber(approximationRaw), error = parseNumber(errorRaw);
      state.approximationAnswer = approximationRaw.trim();
      state.errorAnswer = errorRaw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(approximation) || !Number.isFinite(error)) state.feedback = "Enter both the quartic approximation and its actual absolute error.";
      else if (Math.abs(approximation - CHALLENGE.actual) <= 5e-8) state.feedback = "That first value is the calculator’s cos(0.5), not the quartic polynomial value.";
      else if (Math.abs(approximation - CHALLENGE.approximation) > 5e-8) state.feedback = "Evaluate 1−0.5²/2+0.5⁴/24 before comparing with cosine.";
      else if (error < 0) state.feedback = "The question asks for absolute error, so enter a non-negative magnitude.";
      else if (Math.abs(error - CHALLENGE.bound) <= 5e-9) state.feedback = "That is the certified first-omitted-term bound. The requested actual error is |P₄(0.5)−cos(0.5)|, which is slightly smaller.";
      else if (Math.abs(error - CHALLENGE.absoluteError) > 5e-8) state.feedback = "Subtract cos(0.5)≈0.8775825619 from the quartic approximation and take the absolute value.";
      else {
        state.feedbackTone = "success";
        state.feedback = "Correct: P₄(0.5)≈0.8776041667, actual error ≈2.16048×10⁻⁵, below the bound ≈2.17014×10⁻⁵.";
        state.committed = true;
        state.stage = 2;
        restoreChallenge();
      }
      renderAndFocus(renderApp, "#p245-answer-approximation");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
