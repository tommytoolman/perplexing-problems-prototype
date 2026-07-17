(function registerPredatorPreyCarouselPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "25.5";
  const LOCAL_PERIOD = Math.SQRT2 * Math.PI;
  const EQUILIBRIUM = Object.freeze({ x: 1, y: 2 });
  const DOMAIN = Object.freeze({ xMin: 0, xMax: 3.5, yMin: 0, yMax: 4.4 });
  const INITIAL_LIMITS = Object.freeze({ xMin: .45, xMax: 2.2, yMin: .8, yMax: 3.4 });
  const PLOT = Object.freeze({ left: 52, right: 535, top: 74, bottom: 374 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Nullclines", title: "Read zero derivatives without inventing trajectories", copy: "Inside the positive quadrant, x′=0 on y=2 and y′=0 on x=1. Each condition freezes only one coordinate at that instant; the flow usually crosses the nullcline." }),
    Object.freeze({ short: "Linearise", title: "Measure the small carousel near (1,2)", copy: "At the positive equilibrium the Jacobian is [[0,−1],[2,0]]. Its eigenvalues ±i√2 give angular frequency √2 and local period √2π≈4.44288." }),
    Object.freeze({ short: "Follow orbit", title: "Follow the nonlinear closed level curve", copy: "Positive solutions conserve H=x−ln x+y−2 ln y. The orbit neither spirals inward nor outward: the equilibrium is a nonlinear centre, while √2π is only its small-amplitude period." }),
  ]);
  const hints = Object.freeze([
    "At a positive equilibrium, divide x′=x(2−y) by x and y′=y(x−1) by y. This gives y=2 and x=1.",
    "The Jacobian is [[2−y, −x], [y, x−1]]. Evaluate it at (1,2).",
    "For J=[[0,−1],[2,0]], det(J−λI)=λ²+2.",
    "Thus λ=±i√2. Angular frequency is √2, so period is 2π/√2=√2π.",
    "The first integral H=x−ln x+y−2ln y stays constant on every positive nonlinear orbit, preventing attraction to the centre.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p255-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(Number(value)) < 1e-11 ? 0 : Number(value); }
  function format(value, digits = 3) {
    if (!Number.isFinite(Number(value))) return "—";
    return String(cleanZero(Number(Number(value).toFixed(digits))));
  }
  function signed(value, digits = 3) {
    const number = cleanZero(value);
    return number > 0 ? `+${format(number, digits)}` : format(number, digits);
  }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-").replaceAll("π", String(Math.PI));
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function rhs(x, y) { return { dx: Number(x) * (2 - Number(y)), dy: Number(y) * (Number(x) - 1) }; }
  function jacobian(x, y) { return [[2 - Number(y), -Number(x)], [Number(y), Number(x) - 1]]; }
  function firstIntegral(x, y) {
    if (!(Number(x) > 0) || !(Number(y) > 0)) return NaN;
    return Number(x) - Math.log(Number(x)) + Number(y) - 2 * Math.log(Number(y));
  }
  function rk4Step(point, step) {
    const k1 = rhs(point.x, point.y);
    const k2 = rhs(point.x + step * k1.dx / 2, point.y + step * k1.dy / 2);
    const k3 = rhs(point.x + step * k2.dx / 2, point.y + step * k2.dy / 2);
    const k4 = rhs(point.x + step * k3.dx, point.y + step * k3.dy);
    return {
      t: point.t + step,
      x: point.x + step * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx) / 6,
      y: point.y + step * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy) / 6,
    };
  }
  function integrate(x0, y0, duration, step = .01) {
    const points = [{ t: 0, x: Number(x0), y: Number(y0) }];
    const count = Math.ceil(Number(duration) / step);
    for (let index = 0; index < count; index += 1) points.push(rk4Step(points[points.length - 1], Math.min(step, duration - points[points.length - 1].t)));
    return points;
  }
  function interpolatePoint(points, time) {
    const t = clamp(time, 0, points[points.length - 1].t);
    const step = points.length > 1 ? points[1].t - points[0].t : 1;
    const lowerIndex = clamp(Math.floor(t / step), 0, points.length - 2);
    const lower = points[lowerIndex];
    const upper = points[lowerIndex + 1] || lower;
    const fraction = upper.t === lower.t ? 0 : clamp((t - lower.t) / (upper.t - lower.t), 0, 1);
    return { t, x: lower.x + fraction * (upper.x - lower.x), y: lower.y + fraction * (upper.y - lower.y) };
  }
  function crossingTimes(points) {
    const crossings = [];
    for (let index = 1; index < points.length; index += 1) {
      const before = points[index - 1];
      const after = points[index];
      if (before.y <= EQUILIBRIUM.y && after.y > EQUILIBRIUM.y) {
        const fraction = (EQUILIBRIUM.y - before.y) / (after.y - before.y);
        const x = before.x + fraction * (after.x - before.x);
        if (x > EQUILIBRIUM.x + 1e-5) crossings.push(before.t + fraction * (after.t - before.t));
      }
    }
    return crossings;
  }

  let orbitCacheKey = "";
  let orbitCacheValue = null;
  function buildOrbit(x0, y0) {
    const key = `${Number(x0).toFixed(5)}:${Number(y0).toFixed(5)}`;
    if (key === orbitCacheKey && orbitCacheValue) return orbitCacheValue;
    const auditPoints = integrate(x0, y0, 24, .01);
    const crossings = crossingTimes(auditPoints);
    const measuredPeriod = crossings.length >= 2 ? crossings[1] - crossings[0] : LOCAL_PERIOD;
    const periodSource = crossings.length >= 2 ? "successive upward crossings of y=2 with x>1" : "local linear approximation (orbit too small for crossing estimate)";
    const display = auditPoints.filter((point) => point.t < measuredPeriod);
    display.push(interpolatePoint(auditPoints, measuredPeriod));
    const startH = firstIntegral(x0, y0);
    const invariantDrift = auditPoints.reduce((maximum, point) => Math.max(maximum, Math.abs(firstIntegral(point.x, point.y) - startH)), 0);
    const end = display[display.length - 1];
    const closureResidual = Math.hypot(end.x - Number(x0), end.y - Number(y0));
    const minimumPopulation = auditPoints.reduce((minimum, point) => Math.min(minimum, point.x, point.y), Infinity);
    orbitCacheKey = key;
    orbitCacheValue = { points: display, auditPoints, period: measuredPeriod, periodSource, invariant: startH, invariantDrift, closureResidual, minimumPopulation, crossings };
    return orbitCacheValue;
  }

  function initialState() {
    return {
      initialX: 1.2,
      initialY: 2,
      time: 0,
      stage: 0,
      equilibriumXAnswer: "",
      equilibriumYAnswer: "",
      periodAnswer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      dragging: false,
      pointerId: null,
      boardMessage: "Near-centre orbit loaded. Drag the open starting marker or use the population sliders.",
    };
  }
  let state = initialState();
  function currentOrbit() { return buildOrbit(state.initialX, state.initialY); }
  function setInitial(x, y, message) {
    state.initialX = clamp(x, INITIAL_LIMITS.xMin, INITIAL_LIMITS.xMax);
    state.initialY = clamp(y, INITIAL_LIMITS.yMin, INITIAL_LIMITS.yMax);
    state.time = 0;
    state.boardMessage = message || `New positive initial populations: x(0)=${format(state.initialX, 2)}, y(0)=${format(state.initialY, 2)}. The orbit changes, but the centre stays at (1,2).`;
  }
  function setTime(time, message) {
    const orbit = currentOrbit();
    state.time = clamp(time, 0, orbit.period);
    const point = interpolatePoint(orbit.points, state.time);
    state.boardMessage = message || `At t=${format(state.time, 2)}, x=${format(point.x, 3)} and y=${format(point.y, 3)}. Stepping moves along the same conserved closed orbit.`;
  }
  function restoreChallenge(message) {
    setInitial(1.2, 2, message || "Restored the near-centre orbit used for the small-oscillation comparison.");
    state.stage = 2;
  }

  function xScale(x) { return PLOT.left + Number(x) * (PLOT.right - PLOT.left) / DOMAIN.xMax; }
  function yScale(y) { return PLOT.bottom - Number(y) * (PLOT.bottom - PLOT.top) / DOMAIN.yMax; }
  function xFromSvg(svgX) { return (Number(svgX) - PLOT.left) * DOMAIN.xMax / (PLOT.right - PLOT.left); }
  function yFromSvg(svgY) { return (PLOT.bottom - Number(svgY)) * DOMAIN.yMax / (PLOT.bottom - PLOT.top); }
  function orbitPath(points) { return points.map((point, index) => `${index ? "L" : "M"}${format(xScale(point.x), 3)} ${format(yScale(point.y), 3)}`).join(" "); }
  function localEllipsePath() {
    const amplitude = .34;
    return Array.from({ length: 81 }, (_, index) => {
      const angle = 2 * Math.PI * index / 80;
      const x = EQUILIBRIUM.x + amplitude * Math.cos(angle);
      const y = EQUILIBRIUM.y + Math.SQRT2 * amplitude * Math.sin(angle);
      return `${index ? "L" : "M"}${format(xScale(x), 3)} ${format(yScale(y), 3)}`;
    }).join(" ");
  }
  function vectorFieldMarkup() {
    const xs = [.35, .8, 1.25, 1.7, 2.15, 2.6, 3.05];
    const ys = [.45, 1, 1.55, 2, 2.55, 3.1, 3.65, 4.15];
    return ys.flatMap((y) => xs.map((x) => {
      const vector = rhs(x, y);
      const scaledDx = vector.dx * (PLOT.right - PLOT.left) / DOMAIN.xMax;
      const scaledDy = -vector.dy * (PLOT.bottom - PLOT.top) / DOMAIN.yMax;
      const norm = Math.hypot(scaledDx, scaledDy);
      if (norm < 1e-8) return "";
      const halfLength = 6.2;
      const ux = scaledDx / norm;
      const uy = scaledDy / norm;
      return `<line x1="${format(xScale(x) - halfLength * ux, 2)}" y1="${format(yScale(y) - halfLength * uy, 2)}" x2="${format(xScale(x) + halfLength * ux, 2)}" y2="${format(yScale(y) + halfLength * uy, 2)}"/>`;
    })).join("");
  }

  function stageControlsMarkup() {
    return `<div class="p255-stage-controls" role="group" aria-label="Predator prey reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p255-stage" data-p255-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p255-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p255-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Orbit explained" : "Next stage"}</button></div>`;
  }

  function phaseSvg() {
    const orbit = currentOrbit();
    const current = interpolatePoint(orbit.points, state.time);
    const velocity = rhs(current.x, current.y);
    const pixelDx = velocity.dx * (PLOT.right - PLOT.left) / DOMAIN.xMax;
    const pixelDy = -velocity.dy * (PLOT.bottom - PLOT.top) / DOMAIN.yMax;
    const vectorNorm = Math.hypot(pixelDx, pixelDy);
    const arrowLength = 24;
    const arrowX = vectorNorm ? xScale(current.x) + arrowLength * pixelDx / vectorNorm : xScale(current.x);
    const arrowY = vectorNorm ? yScale(current.y) + arrowLength * pixelDy / vectorNorm : yScale(current.y);
    const showLinear = state.stage >= 1 || state.revealed;
    const showInvariant = state.stage >= 2 || state.revealed;
    const currentH = firstIntegral(current.x, current.y);
    const description = `Phase plane for x prime equals x times 2 minus y and y prime equals y times x minus 1. Interior nullclines are x equals 1 and y equals 2, meeting at the positive equilibrium 1 comma 2. The selected orbit starts at x ${format(state.initialX, 4)}, y ${format(state.initialY, 4)} and has estimated nonlinear period ${format(orbit.period, 6)}. At time ${format(state.time, 4)}, x is ${format(current.x, 5)}, y is ${format(current.y, 5)}, x prime is ${format(velocity.dx, 5)}, and y prime is ${format(velocity.dy, 5)}. The first integral drift over the numerical audit is ${format(orbit.invariantDrift, 10)}.`;
    return `<svg class="p255-phase p255-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p255-svg-title p255-svg-desc">
      <title id="p255-svg-title">Predator prey phase portrait with draggable initial populations</title>
      <desc id="p255-svg-desc">${description}</desc>
      <defs><linearGradient id="p255-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#122d35"/><stop offset="1" stop-color="#302b48"/></linearGradient><clipPath id="p255-plot-clip"><rect x="32" y="52" width="518" height="338" rx="10"/></clipPath><marker id="p255-field-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z"/></marker></defs>
      <rect class="p255-board" x="1" y="1" width="758" height="418" rx="20"/>
      <text class="p255-board-kicker" x="22" y="27">POSITIVE QUADRANT · NULLCLINES CROSS AT (1,2) · CLOSED LEVEL CURVES, NOT SPIRALS</text>
      <g class="p255-plot-panel"><rect x="20" y="43" width="530" height="357" rx="15"/><text class="p255-panel-title" x="38" y="66">PHASE PLANE · x HORIZONTAL · y VERTICAL</text>
        <g class="p255-grid">${[0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map((value) => `<line x1="${xScale(value)}" y1="${PLOT.top}" x2="${xScale(value)}" y2="${PLOT.bottom}"/><text x="${xScale(value)}" y="392" text-anchor="middle">${format(value, 1)}</text>`).join("")}${[0,1,2,3,4].map((value) => `<line x1="${PLOT.left}" y1="${yScale(value)}" x2="${PLOT.right}" y2="${yScale(value)}"/><text x="44" y="${yScale(value) + 3}" text-anchor="end">${value}</text>`).join("")}</g>
        <g clip-path="url(#p255-plot-clip)"><g class="p255-vector-field">${vectorFieldMarkup()}</g><line class="p255-nullcline is-x" x1="${xScale(1)}" y1="${PLOT.top}" x2="${xScale(1)}" y2="${PLOT.bottom}"/><line class="p255-nullcline is-y" x1="${PLOT.left}" y1="${yScale(2)}" x2="${PLOT.right}" y2="${yScale(2)}"/><path class="p255-orbit" d="${orbitPath(orbit.points)}"/>${showLinear ? `<path class="p255-linear-orbit" d="${localEllipsePath()}"/>` : ""}<line class="p255-current-vector" x1="${format(xScale(current.x), 3)}" y1="${format(yScale(current.y), 3)}" x2="${format(arrowX, 3)}" y2="${format(arrowY, 3)}"/><circle class="p255-current-point" cx="${format(xScale(current.x), 3)}" cy="${format(yScale(current.y), 3)}" r="5.8"/><circle class="p255-initial-ring" cx="${format(xScale(state.initialX), 3)}" cy="${format(yScale(state.initialY), 3)}" r="8"/><circle class="p255-drag-hit" data-p255-drag cx="${format(xScale(state.initialX), 3)}" cy="${format(yScale(state.initialY), 3)}" r="17"/></g>
        <g class="p255-equilibrium"><path d="M${xScale(1)} ${yScale(2) - 8}L${xScale(1) + 8} ${yScale(2)}L${xScale(1)} ${yScale(2) + 8}L${xScale(1) - 8} ${yScale(2)}Z"/><text x="${xScale(1) + 12}" y="${yScale(2) - 11}">(1,2) centre</text></g>
        <text class="p255-nullcline-label is-x" x="${xScale(1) + 7}" y="91">x=1 · y′=0 now</text><text class="p255-nullcline-label is-y" x="523" y="${yScale(2) - 8}" text-anchor="end">y=2 · x′=0 now</text><text class="p255-axis-label" x="${PLOT.right}" y="408" text-anchor="end">prey population x</text><text class="p255-axis-label" x="${PLOT.left}" y="69">predator population y</text>
      </g>
      <g class="p255-ledger-panel"><rect x="560" y="43" width="180" height="357" rx="15"/><text class="p255-panel-title" x="575" y="66">ORBIT LEDGER · t=${format(state.time, 2)}</text><text class="p255-ledger-label" x="575" y="99">current populations</text><text class="p255-ledger-value" x="724" y="99" text-anchor="end">(${format(current.x, 3)}, ${format(current.y, 3)})</text><text class="p255-ledger-label" x="575" y="128">instantaneous x′</text><text class="p255-ledger-value is-rate" x="724" y="128" text-anchor="end">${signed(velocity.dx, 3)}</text><text class="p255-ledger-label" x="575" y="157">instantaneous y′</text><text class="p255-ledger-value is-rate" x="724" y="157" text-anchor="end">${signed(velocity.dy, 3)}</text><line class="p255-ledger-rule" x1="575" y1="178" x2="724" y2="178"/><text class="p255-ledger-kicker" x="575" y="202">NUMERICAL ORBIT PERIOD</text><text class="p255-ledger-big" x="724" y="231" text-anchor="end">${format(orbit.period, 5)}</text><text class="p255-ledger-note" x="575" y="250">local limit √2π = ${format(LOCAL_PERIOD, 5)}</text><g class="p255-invariant-ledger ${showInvariant ? "is-visible" : ""}"><line x1="575" y1="271" x2="724" y2="271"/><text class="p255-ledger-kicker" x="575" y="295">CONSERVED H</text><text class="p255-invariant-value" x="724" y="319" text-anchor="end">${format(currentH, 6)}</text><text class="p255-ledger-label" x="575" y="344">max numerical drift</text><text class="p255-ledger-value" x="724" y="344" text-anchor="end">${orbit.invariantDrift.toExponential(1)}</text><text class="p255-ledger-note" x="575" y="372">constant H rules out attraction</text></g></g>
    </svg>`;
  }

  function controlsMarkup() {
    const orbit = currentOrbit();
    const current = interpolatePoint(orbit.points, state.time);
    return `<section class="p255-controls" aria-label="Initial population and orbit time controls"><div class="p255-population-controls"><label for="p255-initial-x"><span>Initial prey x(0) <output>${format(state.initialX, 2)}</output></span><input id="p255-initial-x" type="range" min="${INITIAL_LIMITS.xMin}" max="${INITIAL_LIMITS.xMax}" step=".01" value="${state.initialX}" aria-valuetext="initial prey population ${format(state.initialX, 2)}"/></label><label for="p255-initial-y"><span>Initial predator y(0) <output>${format(state.initialY, 2)}</output></span><input id="p255-initial-y" type="range" min="${INITIAL_LIMITS.yMin}" max="${INITIAL_LIMITS.yMax}" step=".01" value="${state.initialY}" aria-valuetext="initial predator population ${format(state.initialY, 2)}"/></label></div><div class="p255-presets"><button class="primary-button" type="button" data-problem-action="p255-preset" data-p255-x="1.2" data-p255-y="2">Near centre</button><button class="secondary-button" type="button" data-problem-action="p255-preset" data-p255-x="1.8" data-p255-y="2">Start on y=2</button><button class="secondary-button" type="button" data-problem-action="p255-preset" data-p255-x="1" data-p255-y="3.2">Start on x=1</button></div><label class="p255-time-control" for="p255-time"><span>Step around this orbit <output>t=${format(state.time, 2)} / ${format(orbit.period, 2)}</output></span><input id="p255-time" type="range" min="0" max="${format(orbit.period, 6)}" step=".01" value="${state.time}" aria-valuetext="time ${format(state.time, 3)}; prey ${format(current.x, 4)}; predator ${format(current.y, 4)}"/></label><div class="p255-step-row"><button class="secondary-button" type="button" data-problem-action="p255-step-back">−0.25 time</button><button class="secondary-button" type="button" data-problem-action="p255-step-forward">+0.25 time</button><span>One measured circuit ≈ ${format(orbit.period, 5)}</span></div><p data-p255-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const orbit = currentOrbit();
    const amplitudeDifference = orbit.period - LOCAL_PERIOD;
    return `<section class="p255-metrics" aria-live="polite"><article><span>Positive equilibrium</span><strong>(1, 2)</strong><small>intersection of the interior nullclines</small></article><article><span>Linearised period</span><strong>√2π ≈ ${format(LOCAL_PERIOD, 5)}</strong><small>small oscillations only</small></article><article><span>Selected nonlinear period</span><strong>${format(orbit.period, 5)}</strong><small>${Math.abs(amplitudeDifference) < .002 ? "close to the local limit" : `${signed(amplitudeDifference, 4)} from the local limit`}</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p255-distinction"><strong>A nullcline is not generally a trajectory.</strong><span>On x=1 only y′ is zero; x can still move. On y=2 only x′ is zero; y can still move. The conserved quantity closes the positive orbit, so the centre is not an attracting spiral.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p255-dynamic">${phaseSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p255-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p255-solution" aria-labelledby="p255-solution-heading"><h3 id="p255-solution-heading">A nonlinear centre with a local period</h3><p>For positive populations, x′=0 requires y=2 and y′=0 requires x=1. Hence the positive equilibrium is (1,2). The Jacobian is</p><div class="p255-equation">J(x,y)=[[2−y, −x], [y, x−1]],<br>J(1,2)=[[0,−1],[2,0]].</div><p>Its characteristic equation is λ²+2=0, so λ=±i√2. The linearised angular frequency is √2.</p><div class="p255-equation is-answer"><strong>T<sub>local</sub>=2π/√2=√2π≈${format(LOCAL_PERIOD, 7)}.</strong></div><p>This value describes small oscillations near (1,2). The nonlinear system conserves H=x−ln x+y−2ln y throughout the positive quadrant. Its level sets are closed around the centre, so trajectories do not spiral toward it; wider orbits may have a slightly different period.</p></section>`;
  }

  function snapshot() {
    const orbit = currentOrbit();
    const current = interpolatePoint(orbit.points, state.time);
    const velocity = rhs(current.x, current.y);
    const J = jacobian(EQUILIBRIUM.x, EQUILIBRIUM.y);
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      system: { xPrime: "x(2-y)", yPrime: "y(x-1)" },
      positiveEquilibrium: EQUILIBRIUM,
      nullclines: { interiorXPrimeZero: "y=2", interiorYPrimeZero: "x=1", warning: "nullclines are instantaneous zero-derivative sets, not generally trajectories" },
      linearisation: { jacobianAtEquilibrium: J, trace: J[0][0] + J[1][1], determinant: J[0][0] * J[1][1] - J[0][1] * J[1][0], eigenvalues: [{ real: 0, imaginary: Math.SQRT2 }, { real: 0, imaginary: -Math.SQRT2 }], angularFrequency: Math.SQRT2, localPeriodExact: "sqrt(2)*pi", localPeriod: LOCAL_PERIOD },
      nonlinearInvariant: { expression: "H=x-ln(x)+y-2ln(y)", selectedLevel: orbit.invariant, maximumNumericalDrift: orbit.invariantDrift },
      selectedInitialCondition: { x: state.initialX, y: state.initialY },
      current: { time: state.time, x: current.x, y: current.y, xPrime: velocity.dx, yPrime: velocity.dy, H: firstIntegral(current.x, current.y) },
      numericalOrbit: { measuredPeriod: orbit.period, periodSource: orbit.periodSource, closureResidual: orbit.closureResidual, minimumPopulationOver24TimeUnits: orbit.minimumPopulation, upwardSectionCrossings: orbit.crossings.slice(0, 6) },
      interpretation: "nonlinear centre with closed positive orbits; not an attracting spiral; local period is an approximation away from equilibrium",
      stage: state.stage + 1,
      answers: { equilibriumX: state.equilibriumXAnswer || null, equilibriumY: state.equilibriumYAnswer || null, localPeriod: state.periodAnswer || null },
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p255-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Differential Equations</strong><span class="eyebrow">Chapter 25 · nonlinear systems</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p255-spread"><article class="book-page p255-problem-page"><div class="problem-number">Problem 25.5</div><h1 class="book-title p255-title">The Predator–Prey Carousel</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p255-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Positive prey and predator populations obey</p><div class="p255-system-card" aria-label="x prime equals x times open bracket 2 minus y close bracket; y prime equals y times open bracket x minus 1 close bracket">x′=x(2−y),<br>y′=y(x−1).</div><p class="problem-copy"><strong>Find the positive equilibrium and the small-oscillation period nearby.</strong></p><section class="p255-question-card"><strong>Then test what the linear answer does—and does not—say</strong><p>Use the phase portrait to distinguish nullclines from trajectories and a nonlinear centre from an attracting spiral.</p></section></article><section class="book-page book-stage p255-stage" aria-labelledby="p255-stage-heading">${stageControlsMarkup()}<div class="p255-stage-heading"><div><span class="eyebrow">Phase-plane laboratory</span><h2 id="p255-stage-heading">Set the populations and trace one carousel</h2></div><p>Drag the open start marker, use the sliders for precision, then step the solid point around its conserved orbit.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p255-coach"><div class="coach-kicker">Linearise at the positive equilibrium</div><p class="coach-question">Enter the equilibrium coordinates and the local period.</p><form class="p255-answer-form" data-p255-answer-form novalidate><label for="p255-answer-x">Equilibrium x<input id="p255-answer-x" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.equilibriumXAnswer)}" placeholder="x coordinate"/></label><label for="p255-answer-y">Equilibrium y<input id="p255-answer-y" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.equilibriumYAnswer)}" placeholder="y coordinate"/></label><label for="p255-answer-period">Local period<input id="p255-answer-period" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.periodAnswer)}" placeholder="decimal time units"/></label><button class="primary-button" type="submit">Check equilibrium and period</button></form>${feedbackMarkup()}<div class="button-row p255-help-row"><button class="secondary-button" type="button" data-problem-action="p255-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p255-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p255-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function refreshDynamicDom() {
    const root = document.querySelector(".p255-shell");
    if (!root) return;
    const phase = root.querySelector(".p255-phase");
    if (phase) phase.outerHTML = phaseSvg();
    const metrics = root.querySelector(".p255-metrics");
    if (metrics) metrics.outerHTML = metricsMarkup();
    const orbit = currentOrbit();
    const current = interpolatePoint(orbit.points, state.time);
    const xInput = root.querySelector("#p255-initial-x");
    const yInput = root.querySelector("#p255-initial-y");
    const timeInput = root.querySelector("#p255-time");
    if (xInput) { xInput.value = state.initialX; xInput.setAttribute("aria-valuetext", `initial prey population ${format(state.initialX, 2)}`); xInput.closest("label")?.querySelector("output")?.replaceChildren(format(state.initialX, 2)); }
    if (yInput) { yInput.value = state.initialY; yInput.setAttribute("aria-valuetext", `initial predator population ${format(state.initialY, 2)}`); yInput.closest("label")?.querySelector("output")?.replaceChildren(format(state.initialY, 2)); }
    if (timeInput) { timeInput.max = format(orbit.period, 6); timeInput.value = state.time; timeInput.setAttribute("aria-valuetext", `time ${format(state.time, 3)}; prey ${format(current.x, 4)}; predator ${format(current.y, 4)}`); timeInput.closest("label")?.querySelector("output")?.replaceChildren(`t=${format(state.time, 2)} / ${format(orbit.period, 2)}`); }
    const circuit = root.querySelector(".p255-step-row span");
    if (circuit) circuit.textContent = `One measured circuit ≈ ${format(orbit.period, 5)}`;
    const message = root.querySelector("[data-p255-message]");
    if (message) message.textContent = state.boardMessage;
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }
  function pointerToInitial(event, root) {
    const svg = root.querySelector(".p255-phase");
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const svgX = (event.clientX - rect.left) * 760 / rect.width;
    const svgY = (event.clientY - rect.top) * 420 / rect.height;
    return { x: clamp(xFromSvg(svgX), INITIAL_LIMITS.xMin, INITIAL_LIMITS.xMax), y: clamp(yFromSvg(svgY), INITIAL_LIMITS.yMin, INITIAL_LIMITS.yMax) };
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p255-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p255-reset") { state = initialState(); orbitCacheKey = ""; orbitCacheValue = null; renderAndFocus(renderApp, "#p255-initial-x"); return; }
      if (action === "p255-stage") { state.stage = clamp(Math.round(Number(control.dataset.p255Stage)), 0, 2); renderAndFocus(renderApp, `[data-p255-stage="${state.stage}"]`); return; }
      if (action === "p255-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p255-stage="${state.stage}"]`); return; }
      if (action === "p255-preset") { setInitial(Number(control.dataset.p255X), Number(control.dataset.p255Y), `Preset loaded at (${control.dataset.p255X}, ${control.dataset.p255Y}). Notice which derivative is zero at the start and which coordinate immediately moves.`); refreshDynamicDom(); return; }
      if (action === "p255-step-back") { const period = currentOrbit().period; setTime((state.time - .25 + period) % period); refreshDynamicDom(); return; }
      if (action === "p255-step-forward") { const period = currentOrbit().period; setTime((state.time + .25) % period); refreshDynamicDom(); return; }
      if (action === "p255-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p255-reveal") { state.revealed = true; restoreChallenge(); }
      renderApp();
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p255-initial-x")) { setInitial(Number(event.target.value), state.initialY); refreshDynamicDom(); return; }
      if (event.target.matches("#p255-initial-y")) { setInitial(state.initialX, Number(event.target.value)); refreshDynamicDom(); return; }
      if (event.target.matches("#p255-time")) { setTime(Number(event.target.value)); refreshDynamicDom(); return; }
      if (event.target.matches("#p255-answer-x")) { state.equilibriumXAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p255-answer-y")) { state.equilibriumYAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p255-answer-period")) { state.periodAnswer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("[data-p255-drag]")) return;
      state.dragging = true;
      state.pointerId = event.pointerId;
      try { root.setPointerCapture(event.pointerId); } catch (_error) { /* Pointer capture is an enhancement. */ }
      event.preventDefault();
    });
    root.addEventListener("pointermove", (event) => {
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      const point = pointerToInitial(event, root);
      if (!point) return;
      setInitial(Math.round(point.x * 100) / 100, Math.round(point.y * 100) / 100, `Dragging start to x(0)=${format(point.x, 2)}, y(0)=${format(point.y, 2)}. The open marker selects a new conserved level curve.`);
      refreshDynamicDom();
      event.preventDefault();
    });
    const finishDrag = (event) => {
      if (!state.dragging || event.pointerId !== state.pointerId) return;
      state.dragging = false;
      try { root.releasePointerCapture(event.pointerId); } catch (_error) { /* It may already be released. */ }
      state.pointerId = null;
      state.boardMessage = `Start fixed at x(0)=${format(state.initialX, 2)}, y(0)=${format(state.initialY, 2)}. Step the solid marker around the resulting closed orbit.`;
      refreshDynamicDom();
    };
    root.addEventListener("pointerup", finishDrag);
    root.addEventListener("pointercancel", finishDrag);
    root.querySelector("[data-p255-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const xRaw = event.currentTarget.querySelector("#p255-answer-x")?.value || "";
      const yRaw = event.currentTarget.querySelector("#p255-answer-y")?.value || "";
      const periodRaw = event.currentTarget.querySelector("#p255-answer-period")?.value || "";
      const x = parseNumber(xRaw);
      const y = parseNumber(yRaw);
      const period = parseNumber(periodRaw);
      state.equilibriumXAnswer = xRaw.trim();
      state.equilibriumYAnswer = yRaw.trim();
      state.periodAnswer = periodRaw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (![x, y, period].every(Number.isFinite)) state.feedback = "Enter three numerical values: equilibrium x, equilibrium y, and the local period.";
      else if (Math.abs(x - 1) > .001 || Math.abs(y - 2) > .001) state.feedback = "For a positive equilibrium, set both bracketed growth factors to zero: 2−y=0 and x−1=0.";
      else if (Math.abs(period - Math.SQRT2) <= .002) state.feedback = "√2 is the angular frequency, not the period. Divide 2π by √2.";
      else if (Math.abs(period - Math.PI / Math.SQRT2) <= .002) state.feedback = "That is half a circuit. The full period is 2π/√2.";
      else if (Math.abs(period - 2 * Math.PI * Math.SQRT2) <= .002) state.feedback = "The frequency belongs in the denominator: T=2π/√2, not 2π√2.";
      else if (Math.abs(period - LOCAL_PERIOD) > .002) state.feedback = "Use λ=±i√2, so the local angular frequency is √2 and T=2π/√2.";
      else { state.feedbackTone = "success"; state.feedback = `Correct: the positive equilibrium is (1,2) and the local period is √2π≈${format(LOCAL_PERIOD, 7)}.`; state.committed = true; state.revealed = true; restoreChallenge("Correct answer committed; restored a small orbit to compare with the linearised period."); }
      renderAndFocus(renderApp, "#p255-answer-x");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
