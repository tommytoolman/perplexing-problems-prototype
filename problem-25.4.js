(function registerTwoModesPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "25.4";
  const CHALLENGE_TIME = Math.LN2;
  const TIME_MINIMUM = -0.55;
  const TIME_MAXIMUM = 1.25;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Decompose", title: "Change from component coordinates to modal coordinates", copy: "The entries x and y describe position in the usual coordinate directions. The modes are instead the eigenvector directions (1,1) and (1,−1). Solving (3,1)=a(1,1)+b(1,−1) gives a=2 and b=1." }),
    Object.freeze({ short: "Evolve", title: "Let each eigenvector direction evolve independently", copy: "Along (1,1), the amplitude grows as 2eᵗ because λ=1. Along (1,−1), it decays as e⁻³ᵗ because λ=−3. The system has become two independent scalar equations in the eigenvector basis." }),
    Object.freeze({ short: "Recombine", title: "Add the two moving modes to recover the trajectory", copy: "The full state is 2eᵗ(1,1)+e⁻³ᵗ(1,−1). Eigenvector lines are invariant: a state beginning on either one remains on it, although a general state combines both directions." }),
  ]);
  const hints = Object.freeze([
    "The matrix is A=[[-1,2],[2,-1]]. Test the directions (1,1) and (1,−1).",
    "A(1,1)=(1,1), so λ=1. Also A(1,−1)=−3(1,−1), so λ=−3.",
    "Write (3,1)=a(1,1)+b(1,−1). Adding and subtracting the component equations gives a=2 and b=1.",
    "Therefore x(t)=2eᵗ+e⁻³ᵗ and y(t)=2eᵗ−e⁻³ᵗ.",
    "At t=ln 2, eᵗ=2 and e⁻³ᵗ=2⁻³=1/8, so x=4+1/8.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p254-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(Number(value)) < 1e-10 ? 0 : Number(value); }
  function format(value, digits = 5) {
    if (!Number.isFinite(Number(value))) return "—";
    return String(cleanZero(Number(Number(value).toFixed(digits))));
  }
  function signed(value, digits = 5) { const number = cleanZero(value); return number > 0 ? `+${format(number, digits)}` : format(number, digits); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function growingAmplitude(time) { return 2 * Math.exp(Number(time)); }
  function decayingAmplitude(time) { return Math.exp(-3 * Number(time)); }
  function stateAt(time) {
    const t = Number(time), growing = growingAmplitude(t), decaying = decayingAmplitude(t);
    const x = growing + decaying, y = growing - decaying;
    const xDerivative = growing - 3 * decaying, yDerivative = growing + 3 * decaying;
    const odeX = -x + 2 * y, odeY = 2 * x - y;
    return {
      time: t,
      growing,
      decaying,
      x,
      y,
      xDerivative,
      yDerivative,
      odeX,
      odeY,
      odeResidual: { x: cleanZero(xDerivative - odeX), y: cleanZero(yDerivative - odeY) },
      recoveredModalCoordinates: { growing: (x + y) / 2, decaying: (x - y) / 2 },
    };
  }
  function matrixTimes(vector) { return { x: -vector.x + 2 * vector.y, y: 2 * vector.x - vector.y }; }

  const INITIAL = Object.freeze(stateAt(0));
  const CHALLENGE = Object.freeze({ time: "ln(2)", growing: 4, decaying: 1 / 8, exactX: "33/8", valueX: 33 / 8, exactY: "31/8", valueY: 31 / 8 });
  function initialState() {
    return {
      time: CHALLENGE_TIME,
      stage: 0,
      showGrowing: true,
      showDecaying: true,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Challenge time t=ln 2 loaded. The current state is the head-to-tail sum of one growing and one decaying eigenvector mode.",
    };
  }
  let state = initialState();
  function currentData() { return stateAt(state.time); }
  function restoreChallenge(message) {
    state.time = CHALLENGE_TIME;
    state.showGrowing = true;
    state.showDecaying = true;
    state.boardMessage = message || "Restored t=ln 2: modal amplitudes 4 and 1/8 recombine to x=33/8 and y=31/8.";
  }

  function stageControlsMarkup() {
    return `<div class="p254-stage-controls" role="group" aria-label="Eigenmode reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p254-stage" data-p254-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p254-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p254-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Modes recombined" : "Next stage"}</button></div>`;
  }

  function trajectoryPath(mapX, mapY) {
    return Array.from({ length: 271 }, (_, index) => {
      const time = TIME_MINIMUM + index / 270 * (TIME_MAXIMUM - TIME_MINIMUM), point = stateAt(time);
      return `${index ? "L" : "M"}${format(mapX(point.x), 3)} ${format(mapY(point.y), 3)}`;
    }).join(" ");
  }
  function modePath(mode, mapTime, mapAmplitude) {
    return Array.from({ length: 181 }, (_, index) => {
      const time = TIME_MINIMUM + index / 180 * (TIME_MAXIMUM - TIME_MINIMUM), value = mode === "growing" ? growingAmplitude(time) : decayingAmplitude(time);
      return `${index ? "L" : "M"}${format(mapTime(time), 3)} ${format(mapAmplitude(value), 3)}`;
    }).join(" ");
  }
  function fieldMarkup(mapX, mapY) {
    const xValues = [0, 2, 4, 6], yValues = [-4, -2, 0, 2, 4, 6];
    return xValues.flatMap((x) => yValues.map((y) => {
      if (x === 0 && y === 0) return "";
      const velocity = matrixTimes({ x, y }), magnitude = Math.hypot(velocity.x, velocity.y) || 1;
      const dx = velocity.x / magnitude * 8, dy = -velocity.y / magnitude * 8, cx = mapX(x), cy = mapY(y);
      return `<line x1="${format(cx - dx, 3)}" y1="${format(cy - dy, 3)}" x2="${format(cx + dx, 3)}" y2="${format(cy + dy, 3)}"/>`;
    })).join("");
  }

  function modesSvg() {
    const data = currentData();
    const plot = { left: 54, right: 492, top: 80, bottom: 368 }, mapX = (x) => plot.left + (Number(x) + 1) / 9 * (plot.right - plot.left), mapY = (y) => plot.bottom - (Number(y) + 5) / 13 * (plot.bottom - plot.top);
    const modePlot = { left: 538, right: 718, top: 88, bottom: 198 }, mapTime = (time) => modePlot.left + (Number(time) - TIME_MINIMUM) / (TIME_MAXIMUM - TIME_MINIMUM) * (modePlot.right - modePlot.left), mapAmplitude = (value) => modePlot.bottom - Number(value) / 7 * (modePlot.bottom - modePlot.top);
    const origin = { x: mapX(0), y: mapY(0) }, growingTip = { x: mapX(data.growing), y: mapY(data.growing) }, current = { x: mapX(data.x), y: mapY(data.y) }, initial = { x: mapX(INITIAL.x), y: mapY(INITIAL.y) };
    const showField = state.stage >= 2 || state.revealed;
    const description = `Phase-plane trajectory for x prime equals minus x plus 2y and y prime equals 2x minus y. At time ${format(data.time, 5)}, the growing mode has amplitude ${format(data.growing, 6)}, the decaying mode has amplitude ${format(data.decaying, 6)}, and their sum is x ${format(data.x, 6)}, y ${format(data.y, 6)}. ${state.showGrowing ? "The growing eigenvector contribution is shown." : "The growing contribution is hidden."} ${state.showDecaying ? "The decaying eigenvector contribution is shown." : "The decaying contribution is hidden."}`;
    return `<svg class="p254-modes p254-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p254-svg-title p254-svg-desc"><title id="p254-svg-title">Two eigenmodes forming one phase-plane motion</title><desc id="p254-svg-desc">${description}</desc><defs><linearGradient id="p254-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17313d"/><stop offset="1" stop-color="#302a42"/></linearGradient><marker id="p254-growing-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z"/></marker><marker id="p254-decaying-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z"/></marker><clipPath id="p254-phase-clip"><rect x="37" y="69" width="467" height="315" rx="12"/></clipPath><clipPath id="p254-mode-clip"><rect x="529" y="76" width="199" height="132" rx="8"/></clipPath></defs><rect class="p254-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p254-board-kicker" x="23" y="28">ONE STATE · TWO INVARIANT DIRECTIONS · TWO EXPONENTIAL RATES</text><g class="p254-phase-panel"><rect x="20" y="44" width="495" height="357" rx="16"/><text class="p254-panel-title" x="39" y="66">PHASE PLANE · CURRENT STATE IS A VECTOR SUM</text><g clip-path="url(#p254-phase-clip)"><g class="p254-grid">${[-1,0,2,4,6,8].map((x) => `<line x1="${mapX(x)}" y1="${plot.top}" x2="${mapX(x)}" y2="${plot.bottom}"/>`).join("")}${[-4,-2,0,2,4,6,8].map((y) => `<line x1="${plot.left}" y1="${mapY(y)}" x2="${plot.right}" y2="${mapY(y)}"/>`).join("")}</g><g class="p254-field ${showField ? "is-visible" : ""}">${fieldMarkup(mapX, mapY)}</g><line class="p254-eigenline is-growing ${state.showGrowing ? "is-visible" : ""}" x1="${mapX(-1)}" y1="${mapY(-1)}" x2="${mapX(8)}" y2="${mapY(8)}"/><line class="p254-eigenline is-decaying ${state.showDecaying ? "is-visible" : ""}" x1="${mapX(-1)}" y1="${mapY(1)}" x2="${mapX(5)}" y2="${mapY(-5)}"/><path class="p254-trajectory" d="${trajectoryPath(mapX, mapY)}"/><line class="p254-growing-vector ${state.showGrowing ? "is-visible" : ""}" x1="${origin.x}" y1="${origin.y}" x2="${growingTip.x}" y2="${growingTip.y}"/><line class="p254-decaying-vector ${state.showDecaying ? "is-visible" : ""}" x1="${growingTip.x}" y1="${growingTip.y}" x2="${current.x}" y2="${current.y}"/><circle class="p254-origin" cx="${origin.x}" cy="${origin.y}" r="3"/><circle class="p254-initial-point" cx="${initial.x}" cy="${initial.y}" r="5"/><circle class="p254-current-point" cx="${current.x}" cy="${current.y}" r="6"/></g>${[-1,0,2,4,6,8].map((x) => `<text class="p254-tick" x="${mapX(x)}" y="383" text-anchor="middle">${x}</text>`).join("")}${[-4,-2,0,2,4,6,8].map((y) => `<text class="p254-tick" x="48" y="${mapY(y) + 3}" text-anchor="end">${y}</text>`).join("")}<text class="p254-axis-label" x="493" y="395" text-anchor="end">x</text><text class="p254-axis-label" x="44" y="87">y</text><text class="p254-eigen-label is-growing ${state.showGrowing ? "is-visible" : ""}" x="${mapX(6.55)}" y="${mapY(6.55) - 7}" text-anchor="middle">λ=1 · (1,1)</text><text class="p254-eigen-label is-decaying ${state.showDecaying ? "is-visible" : ""}" x="${mapX(3.2)}" y="${mapY(-3.2) + 13}" text-anchor="middle">λ=−3 · (1,−1)</text><text class="p254-initial-label" x="${initial.x + 8}" y="${initial.y + 14}">initial (3,1)</text><text class="p254-current-label" x="${Math.min(470, current.x + 8)}" y="${Math.max(91, current.y - 10)}">(${format(data.x, 4)}, ${format(data.y, 4)})</text></g><g class="p254-mode-panel"><rect x="525" y="44" width="215" height="174" rx="16"/><text class="p254-panel-title" x="542" y="66">MODAL AMPLITUDES AGAINST TIME</text><g clip-path="url(#p254-mode-clip)"><g class="p254-mode-grid">${[0,2,4,6].map((value) => `<line x1="${modePlot.left}" y1="${mapAmplitude(value)}" x2="${modePlot.right}" y2="${mapAmplitude(value)}"/>`).join("")}</g><path class="p254-mode-curve is-growing ${state.showGrowing ? "is-visible" : ""}" d="${modePath("growing", mapTime, mapAmplitude)}"/><path class="p254-mode-curve is-decaying ${state.showDecaying ? "is-visible" : ""}" d="${modePath("decaying", mapTime, mapAmplitude)}"/><line class="p254-time-guide" x1="${mapTime(data.time)}" y1="${modePlot.top}" x2="${mapTime(data.time)}" y2="${modePlot.bottom}"/><circle class="p254-mode-point is-growing ${state.showGrowing ? "is-visible" : ""}" cx="${mapTime(data.time)}" cy="${mapAmplitude(data.growing)}" r="4"/><circle class="p254-mode-point is-decaying ${state.showDecaying ? "is-visible" : ""}" cx="${mapTime(data.time)}" cy="${mapAmplitude(data.decaying)}" r="4"/></g><text class="p254-mode-axis" x="${modePlot.left}" y="210">t=${format(TIME_MINIMUM, 2)}</text><text class="p254-mode-axis" x="${modePlot.right}" y="210" text-anchor="end">t=${format(TIME_MAXIMUM, 2)}</text><text class="p254-mode-label is-growing ${state.showGrowing ? "is-visible" : ""}" x="540" y="93">a(t)=2eᵗ</text><text class="p254-mode-label is-decaying ${state.showDecaying ? "is-visible" : ""}" x="540" y="107">b(t)=e⁻³ᵗ</text></g><g class="p254-ledger-panel"><rect x="525" y="228" width="215" height="173" rx="16"/><text class="p254-panel-title" x="542" y="251">EIGENVECTOR BASIS · THEN RECOMBINE</text><text class="p254-ledger-formula" x="542" y="278">[x;y] = a[1;1] + b[1;−1]</text><text class="p254-ledger-note" x="542" y="297">a=(x+y)/2 · b=(x−y)/2</text><line class="p254-ledger-rule" x1="542" y1="313" x2="722" y2="313"/><text class="p254-ledger-mode is-growing ${state.showGrowing ? "is-visible" : ""}" x="542" y="336">a=${format(data.growing, 6)} · rate λ=1</text><text class="p254-ledger-mode is-decaying ${state.showDecaying ? "is-visible" : ""}" x="542" y="354">b=${format(data.decaying, 6)} · rate λ=−3</text><text class="p254-ledger-result" x="542" y="379">x=a+b=${format(data.x, 6)}</text><text class="p254-ledger-result" x="542" y="393">y=a−b=${format(data.y, 6)}</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p254-controls" aria-label="Time and eigenmode display controls"><label for="p254-time"><span>Time <output>t=${Math.abs(state.time - CHALLENGE_TIME) < 1e-9 ? "ln 2" : format(state.time, 3)}</output></span><input id="p254-time" type="range" min="${TIME_MINIMUM}" max="${TIME_MAXIMUM}" step="0.01" value="${state.time}" aria-valuetext="time ${format(state.time, 5)}; growing mode ${format(data.growing, 6)}; decaying mode ${format(data.decaying, 6)}; state x ${format(data.x, 6)}, y ${format(data.y, 6)}"/></label><div class="p254-control-row"><div class="p254-presets"><button class="secondary-button" type="button" data-problem-action="p254-time" data-p254-time="0">t=0</button><button class="secondary-button" type="button" data-problem-action="p254-challenge">t=ln 2</button><button class="secondary-button" type="button" data-problem-action="p254-time" data-p254-time="1">t=1</button></div><button class="chip-button ${state.showGrowing ? "active" : ""}" type="button" data-problem-action="p254-growing" aria-pressed="${state.showGrowing}">${state.showGrowing ? "Hide λ=1 mode" : "Show λ=1 mode"}</button><button class="chip-button ${state.showDecaying ? "active" : ""}" type="button" data-problem-action="p254-decaying" aria-pressed="${state.showDecaying}">${state.showDecaying ? "Hide λ=−3 mode" : "Show λ=−3 mode"}</button></div><p data-p254-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const data = currentData();
    return `<section class="p254-metrics" aria-live="polite"><article><span>growing mode a(t)</span><strong>${format(data.growing, 7)}</strong><small>direction (1,1), rate λ=1</small></article><article><span>decaying mode b(t)</span><strong>${format(data.decaying, 7)}</strong><small>direction (1,−1), rate λ=−3</small></article><article><span>recombined state</span><strong>(${format(data.x, 6)}, ${format(data.y, 6)})</strong><small>x=a+b, y=a−b</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p254-distinction"><strong>Component coordinates are not modes.</strong><span>The x- and y-axes merely report a vector’s entries. A mode is an eigenvector direction preserved by the matrix. In the modal basis, the coupled system becomes a′=a and b′=−3b.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p254-dynamic">${modesSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p254-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p254-solution" aria-labelledby="p254-solution-heading"><h3 id="p254-solution-heading" tabindex="-1">Diagonalise by following the invariant directions</h3><p>For A=[−1 2; 2 −1], the eigenpairs are</p><div class="p254-equation">λ₁=1 with v₁=(1,1),<br/>λ₂=−3 with v₂=(1,−1).</div><p>Decompose the initial vector:</p><div class="p254-equation">(3,1)=2(1,1)+1(1,−1).</div><p>Each coefficient then follows its own scalar exponential, giving</p><div class="p254-equation">(x(t),y(t))=2eᵗ(1,1)+e⁻³ᵗ(1,−1),<br/>x(t)=2eᵗ+e⁻³ᵗ,<br/>y(t)=2eᵗ−e⁻³ᵗ.</div><p>At t=ln 2, eᵗ=2 and e⁻³ᵗ=2⁻³=1/8. Therefore</p><div class="p254-equation is-answer"><strong>x(ln 2)=4+1/8=33/8=4.125.</strong></div><p>The phase plane shows why the eigenvectors are modes: either eigenvector line is invariant. A general starting vector is not tied to the x- or y-axis; it is a superposition of the two invariant directions.</p></section>`;
  }

  function snapshot() {
    const data = currentData(), growingEigencheck = matrixTimes({ x: 1, y: 1 }), decayingEigencheck = matrixTimes({ x: 1, y: -1 });
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      system: { matrix: [[-1, 2], [2, -1]], equations: ["x'=-x+2y", "y'=2x-y"] },
      eigenpairs: [
        { eigenvalue: 1, eigenvector: [1, 1], matrixTimesEigenvector: [growingEigencheck.x, growingEigencheck.y] },
        { eigenvalue: -3, eigenvector: [1, -1], matrixTimesEigenvector: [decayingEigencheck.x, decayingEigencheck.y] },
      ],
      initialCondition: { time: 0, state: [INITIAL.x, INITIAL.y], decomposition: { growingCoefficient: 2, decayingCoefficient: 1 } },
      solution: { vector: "2e^t(1,1)+e^(-3t)(1,-1)", x: "2e^t+e^(-3t)", y: "2e^t-e^(-3t)" },
      current: data,
      verification: { initialResidual: [INITIAL.x - 3, INITIAL.y - 1], odeResidual: data.odeResidual, recoveredModalCoordinates: data.recoveredModalCoordinates },
      challenge: CHALLENGE,
      invariantDirections: { growingLine: "span(1,1)", decayingLine: "span(1,-1)", explanation: "starting on an eigenvector line keeps the state on that line" },
      stage: state.stage + 1,
      modesVisible: { growing: state.showGrowing, decaying: state.showDecaying },
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p254-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Differential Equations and Dynamical Systems</strong><span class="eyebrow">Chapter 25 · coupled linear systems</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p254-spread"><article class="book-page p254-problem-page"><div class="problem-number">Problem 25.4</div><h1 class="book-title p254-title">Two Modes in One Motion</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p254-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">The coupled system</p><div class="p254-problem-system"><strong>x′=−x+2y</strong><strong>y′=2x−y</strong><span>(x(0),y(0))=(3,1)</span></div><p class="problem-copy">has two eigenvector modes. <strong>Find x(ln 2).</strong></p><section class="p254-question-card"><strong>The right directions uncouple the motion</strong><p>Decompose the initial vector into eigenvectors, evolve each modal coefficient, then recombine the components.</p></section></article><section class="book-page book-stage p254-stage" aria-labelledby="p254-stage-heading">${stageControlsMarkup()}<div class="p254-stage-heading"><div><span class="eyebrow">Eigenmode laboratory</span><h2 id="p254-stage-heading">Watch two scalar exponentials draw one trajectory</h2></div><p>Move time and toggle the modal contributions to separate eigenvector directions from x- and y-coordinates.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p254-coach"><div class="coach-kicker">Evaluate the first component</div><p class="coach-question">Enter x(ln 2). Exact fractions or decimals are accepted.</p><form class="p254-answer-form" data-p254-answer-form novalidate><label for="p254-answer">First component at t=ln 2</label><input id="p254-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal"/><button class="primary-button" type="submit">Check x(ln 2)</button></form>${feedbackMarkup()}<div class="button-row p254-help-row"><button class="secondary-button" type="button" data-problem-action="p254-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p254-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p254-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) { if (!active) return ""; if (active.id) return `#${active.id}`; if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`; return ""; }
  function updateDynamicDom() {
    const root = document.querySelector(".p254-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p254-dynamic"), selector = dynamic?.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) { const replacement = root.querySelector(selector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p254-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p254-reset") { state = initialState(); renderAndFocus(renderApp, "#p254-time"); return; }
      if (action === "p254-stage") { state.stage = clamp(Math.round(Number(control.dataset.p254Stage)), 0, 2); renderAndFocus(renderApp, `[data-p254-stage="${state.stage}"]`); return; }
      if (action === "p254-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p254-stage="${state.stage}"]`); return; }
      if (action === "p254-time") { state.time = clamp(Number(control.dataset.p254Time), TIME_MINIMUM, TIME_MAXIMUM); state.boardMessage = `Time set to t=${format(state.time, 3)}. The two modal amplitudes recombine to (${format(currentData().x, 5)}, ${format(currentData().y, 5)}).`; updateDynamicDom(); return; }
      if (action === "p254-challenge") { restoreChallenge(); updateDynamicDom(); return; }
      if (action === "p254-growing") { state.showGrowing = !state.showGrowing; state.boardMessage = `${state.showGrowing ? "Showing" : "Hiding"} the λ=1 growing mode. The full trajectory and state remain visible.`; updateDynamicDom(); return; }
      if (action === "p254-decaying") { state.showDecaying = !state.showDecaying; state.boardMessage = `${state.showDecaying ? "Showing" : "Hiding"} the λ=−3 decaying mode. The full trajectory and state remain visible.`; updateDynamicDom(); return; }
      if (action === "p254-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p254-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p254-reveal") window.requestAnimationFrame(() => document.querySelector("#p254-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p254-time")) {
        state.time = clamp(Number(event.target.value), TIME_MINIMUM, TIME_MAXIMUM);
        const data = currentData();
        state.boardMessage = `At t=${format(data.time, 3)}, a=${format(data.growing, 5)} and b=${format(data.decaying, 5)}, so (x,y)=(${format(data.x, 5)}, ${format(data.y, 5)}).`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p254-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root?.querySelector("[data-p254-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p254-answer")?.value || "", answer = parseNumber(raw);
      state.answer = raw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a numerical value or a fraction such as 33/8.";
      else if (Math.abs(answer - CHALLENGE.valueY) <= 1e-8) state.feedback = "31/8 is y(ln 2). The first component adds the decaying mode: x=a+b.";
      else if (Math.abs(answer - 4) <= 1e-8) state.feedback = "4 is the growing-mode contribution. Add the remaining decaying contribution 1/8.";
      else if (Math.abs(answer - 33) <= 1e-8) state.feedback = "The modal sum is 4+1/8, not 4+1. Remember e^(−3 ln 2)=1/8.";
      else if (Math.abs(answer - CHALLENGE.valueX) > 1e-8) state.feedback = "Find both eigenvector coefficients, evolve them to t=ln 2, and use x=a+b.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: x(ln 2)=4+1/8=33/8=4.125."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p254-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
