(function registerMovingTemperaturePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "25.2";
  const DOMAIN = Object.freeze({ minimum: 0, maximum: 8 });
  const CHALLENGE_TIME = 4;
  const TURNING_TIME = 2 * Math.log(9 / 4);
  const PLOT = Object.freeze({ left: 50, right: 535, top: 76, bottom: 290, transientBaseline: 375, temperatureScale: 4.55, transientScale: 2.2 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Move target", title: "Rewrite the forcing as a moving target", copy: "The equation is T′=−½[T−(20+4t)]. The zero-derivative target E(t)=20+4t keeps moving, so there is no fixed equilibrium temperature for the solution to settle at." }),
    Object.freeze({ short: "Split", title: "Add a forced response and a homogeneous transient", copy: "A particular response is P(t)=4t+12. The remaining memory H(t)=18e^(−t/2) solves the homogeneous equation and decays. Their sum is the full temperature T=P+H." }),
    Object.freeze({ short: "Verify", title: "Check the equation, initial value and moving lag", copy: "T′+½T equals 10+2t exactly and T(0)=30. As H decays, T approaches P—not the target E. The ramp response P trails E by 8°C because the target moves at 4°C/min." }),
  ]);
  const hints = Object.freeze([
    "The integrating factor for T′+(1/2)T=10+2t is e^(t/2).",
    "Alternatively try a particular solution P(t)=at+b. Matching coefficients gives a=4 and b=12.",
    "The homogeneous solution is H(t)=Ce^(−t/2).",
    "Use T(0)=30: 12+C=30, so C=18.",
    "At t=4, T(4)=28+18e^(−2)≈30.4360351°C.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p252-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(Number(value)) < 1e-10 ? 0 : Number(value); }
  function format(value, digits = 3) {
    if (!Number.isFinite(Number(value))) return "—";
    return String(cleanZero(Number(Number(value).toFixed(digits))));
  }
  function signed(value, digits = 3) {
    const cleaned = cleanZero(value);
    return cleaned > 0 ? `+${format(cleaned, digits)}` : format(cleaned, digits);
  }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function movingTarget(time) { return 20 + 4 * Number(time); }
  function forcingRhs(time) { return 10 + 2 * Number(time); }
  function forcedResponse(time) { return 4 * Number(time) + 12; }
  function transient(time) { return 18 * Math.exp(-Number(time) / 2); }
  function temperature(time) { return forcedResponse(time) + transient(time); }
  function temperatureDerivative(time) { return 4 - 9 * Math.exp(-Number(time) / 2); }
  function solutionData(time) {
    const t = clamp(time, DOMAIN.minimum, DOMAIN.maximum);
    const target = movingTarget(t);
    const forced = forcedResponse(t);
    const memory = transient(t);
    const total = forced + memory;
    const derivative = temperatureDerivative(t);
    const rhs = forcingRhs(t);
    const odeLeft = derivative + .5 * total;
    return {
      time: t,
      target,
      forcingRhs: rhs,
      forcedResponse: forced,
      transient: memory,
      temperature: total,
      derivative,
      equilibriumError: total - target,
      movingTargetLagOfForcedResponse: target - forced,
      componentSumResidual: cleanZero(total - forced - memory),
      odeResidual: cleanZero(odeLeft - rhs),
      initialValueResidual: cleanZero(temperature(0) - 30),
      direction: Math.abs(derivative) < 1e-8 ? "turning" : derivative > 0 ? "warming" : "cooling",
    };
  }

  const challenge = Object.freeze(solutionData(CHALLENGE_TIME));

  function initialState() {
    return {
      time: CHALLENGE_TIME,
      showForced: false,
      showTransient: false,
      stage: 0,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Challenge time t=4 loaded. Compare the total temperature with the moving target before separating the two solution components.",
    };
  }
  let state = initialState();
  function currentData() { return solutionData(state.time); }
  function setTime(value, message) {
    state.time = clamp(value, DOMAIN.minimum, DOMAIN.maximum);
    const data = currentData();
    state.boardMessage = message || `At t=${format(data.time, 2)}, T=${format(data.temperature, 5)}°C, target E=${format(data.target, 3)}°C, and T′=${signed(data.derivative, 4)}°C/min.`;
  }
  function revealComponents() { state.showForced = true; state.showTransient = true; }
  function restoreChallenge(message) {
    setTime(CHALLENGE_TIME, message || "Restored t=4: T(4)=28+18e^(−2)≈30.4360351°C.");
  }

  function stageControlsMarkup() {
    return `<div class="p252-stage-controls" role="group" aria-label="Linear ODE reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p252-stage" data-p252-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p252-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p252-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Solution verified" : "Next stage"}</button></div>`;
  }

  function xScale(time) { return PLOT.left + Number(time) * (PLOT.right - PLOT.left) / DOMAIN.maximum; }
  function temperatureY(value) { return PLOT.bottom - (Number(value) - 10) * PLOT.temperatureScale; }
  function transientY(value) { return PLOT.transientBaseline - Number(value) * PLOT.transientScale; }
  function functionPath(fn, mapY, points = 161) {
    return Array.from({ length: points }, (_, index) => {
      const t = DOMAIN.maximum * index / (points - 1);
      return `${index ? "L" : "M"}${format(xScale(t), 3)} ${format(mapY(fn(t)), 3)}`;
    }).join(" ");
  }

  function temperatureSvg() {
    const data = currentData();
    const currentX = xScale(data.time);
    const targetY = temperatureY(data.target);
    const forcedY = temperatureY(data.forcedResponse);
    const totalY = temperatureY(data.temperature);
    const memoryY = transientY(data.transient);
    const turning = solutionData(TURNING_TIME);
    const showVerification = state.stage >= 2 || state.revealed;
    const description = `The moving zero-derivative target is E of t equals 20 plus 4t degrees Celsius. The forced particular response is P of t equals 4t plus 12. The homogeneous transient is H of t equals 18 exponential minus t over 2. Their sum T is the full solution. At time ${format(data.time, 5)}, the target is ${format(data.target, 6)}, the forced response is ${format(data.forcedResponse, 6)}, the transient is ${format(data.transient, 6)}, and the full temperature is ${format(data.temperature, 6)} degrees Celsius. The derivative is ${format(data.derivative, 6)} degrees Celsius per minute and the differential-equation residual is ${format(data.odeResidual, 10)}.`;
    return `<svg class="p252-temperature p252-stage-${state.stage}" viewBox="0 0 760 410" role="img" aria-labelledby="p252-svg-title p252-svg-desc">
      <title id="p252-svg-title">Moving temperature target and decomposed linear ODE solution</title>
      <desc id="p252-svg-desc">${description}</desc>
      <defs>
        <linearGradient id="p252-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#31283e"/></linearGradient>
        <clipPath id="p252-main-clip"><rect x="34" y="51" width="516" height="253" rx="10"/></clipPath>
        <clipPath id="p252-transient-clip"><rect x="34" y="320" width="516" height="63" rx="8"/></clipPath>
      </defs>
      <rect class="p252-board" x="1" y="1" width="758" height="408" rx="20"/>
      <text class="p252-board-kicker" x="22" y="27">MOVING TARGET E(t) · FORCED RESPONSE P(t) · DECAYING MEMORY H(t) · TOTAL T=P+H</text>
      <g class="p252-plot-panel">
        <rect x="20" y="43" width="530" height="348" rx="15"/>
        <text class="p252-panel-title" x="38" y="66">TEMPERATURE RESPONSE · 0≤t≤8 MIN</text>
        <g class="p252-grid">${[10,20,30,40,50].map((value) => `<line x1="${PLOT.left}" y1="${temperatureY(value)}" x2="${PLOT.right}" y2="${temperatureY(value)}"/><text x="${PLOT.left - 8}" y="${temperatureY(value) + 3}" text-anchor="end">${value}</text>`).join("")}${[0,2,4,6,8].map((value) => `<line x1="${xScale(value)}" y1="${PLOT.top}" x2="${xScale(value)}" y2="${PLOT.bottom}"/><text x="${xScale(value)}" y="${PLOT.bottom + 16}" text-anchor="middle">${value}</text>`).join("")}</g>
        <g clip-path="url(#p252-main-clip)"><path class="p252-target-line" d="${functionPath(movingTarget, temperatureY)}"/>${state.showForced ? `<path class="p252-forced-line" d="${functionPath(forcedResponse, temperatureY)}"/>` : ""}<path class="p252-total-line" d="${functionPath(temperature, temperatureY)}"/><line class="p252-current-guide" x1="${format(currentX, 3)}" y1="${PLOT.top}" x2="${format(currentX, 3)}" y2="${PLOT.transientBaseline}"/><circle class="p252-target-point" cx="${format(currentX, 3)}" cy="${format(targetY, 3)}" r="5"/>${state.showForced ? `<circle class="p252-forced-point" cx="${format(currentX, 3)}" cy="${format(forcedY, 3)}" r="5"/>` : ""}<circle class="p252-total-point" cx="${format(currentX, 3)}" cy="${format(totalY, 3)}" r="6"/>${state.showForced && state.showTransient ? `<line class="p252-component-gap" x1="${format(currentX + 7, 3)}" y1="${format(forcedY, 3)}" x2="${format(currentX + 7, 3)}" y2="${format(totalY, 3)}"/>` : ""}</g>
        <text class="p252-current-label" x="${format(clamp(currentX + 12, 68, 425), 3)}" y="${format(clamp(totalY - 12, 84, 276), 3)}">T(${format(data.time, 2)})=${format(data.temperature, 5)}°C</text>
        <circle class="p252-turning-point" cx="${format(xScale(TURNING_TIME), 3)}" cy="${format(temperatureY(turning.temperature), 3)}" r="4"/><text class="p252-turning-label" x="${format(xScale(TURNING_TIME) + 8, 3)}" y="${format(temperatureY(turning.temperature) - 9, 3)}">T=E · T′=0</text>
        <text class="p252-line-label is-target" x="528" y="${format(temperatureY(movingTarget(8)) - 7, 3)}" text-anchor="end">moving target E</text>
        <text class="p252-line-label is-total" x="528" y="${format(temperatureY(temperature(8)) - 10, 3)}" text-anchor="end">total T</text>
        ${state.showForced ? `<text class="p252-line-label is-forced" x="528" y="${format(temperatureY(forcedResponse(8)) + 12, 3)}" text-anchor="end">forced P</text>` : ""}
        <text class="p252-axis-label" x="${PLOT.right}" y="${PLOT.bottom + 31}" text-anchor="end">time t (min)</text><text class="p252-axis-label" x="${PLOT.left}" y="${PLOT.top - 5}">temperature (°C)</text>
        <g class="p252-transient-strip ${state.showTransient ? "is-visible" : ""}" clip-path="url(#p252-transient-clip)"><line x1="${PLOT.left}" y1="${PLOT.transientBaseline}" x2="${PLOT.right}" y2="${PLOT.transientBaseline}"/><line class="p252-transient-current" x1="${format(currentX, 3)}" y1="320" x2="${format(currentX, 3)}" y2="${PLOT.transientBaseline}"/><path d="${functionPath(transient, transientY)}"/><circle cx="${format(currentX, 3)}" cy="${format(memoryY, 3)}" r="4"/></g>
        <text class="p252-transient-label ${state.showTransient ? "is-visible" : ""}" x="${currentX < 300 ? 310 : 38}" y="330">H(t)=18e^(−t/2) · current memory ${format(data.transient, 5)}°C</text>
      </g>
      <g class="p252-ledger-panel">
        <rect x="560" y="43" width="180" height="348" rx="15"/>
        <text class="p252-panel-title" x="575" y="66">SOLUTION LEDGER · t=${format(data.time, 2)}</text>
        <text class="p252-ledger-label" x="575" y="98">moving target E(t)</text><text class="p252-ledger-value is-target" x="724" y="98" text-anchor="end">${format(data.target, 5)}°C</text>
        <text class="p252-ledger-label" x="575" y="127">forced response P(t)</text><text class="p252-ledger-value is-forced" x="724" y="127" text-anchor="end">${format(data.forcedResponse, 5)}°C</text>
        <text class="p252-ledger-label" x="575" y="156">transient H(t)</text><text class="p252-ledger-value is-transient" x="724" y="156" text-anchor="end">+${format(data.transient, 5)}°C</text>
        <line class="p252-ledger-rule" x1="575" y1="177" x2="724" y2="177"/>
        <text class="p252-ledger-kicker" x="575" y="202">TOTAL T=P+H</text><text class="p252-ledger-big" x="724" y="231" text-anchor="end">${format(data.temperature, 6)}°C</text>
        <text class="p252-ledger-label" x="575" y="260">rate T′</text><text class="p252-rate-value" x="724" y="260" text-anchor="end">${signed(data.derivative, 5)}°C/min</text>
        <text class="p252-direction-status" x="575" y="280">${data.direction.toUpperCase()} · ${data.equilibriumError >= 0 ? "ABOVE" : "BELOW"} TARGET</text>
        <g class="p252-verification ${showVerification ? "is-visible" : ""}"><line x1="575" y1="299" x2="724" y2="299"/><text class="p252-ledger-kicker" x="575" y="321">ODE RESIDUAL</text><text class="p252-residual-value" x="724" y="321" text-anchor="end">${format(data.odeResidual, 10)}</text><text class="p252-ledger-kicker" x="575" y="347">TARGET−P LAG</text><text class="p252-residual-value" x="724" y="347" text-anchor="end">${format(data.movingTargetLagOfForcedResponse, 5)}°C</text><text class="p252-ledger-note" x="575" y="372">moving forcing prevents fixed equilibrium</text></g>
      </g>
    </svg>`;
  }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p252-controls" aria-label="Temperature time and component controls"><label for="p252-time"><span>Scrub solution time <output>t=${format(state.time, 2)} min</output></span><input id="p252-time" type="range" min="0" max="8" step="0.01" value="${state.time}" aria-valuetext="time ${format(state.time, 3)} minutes; total temperature ${format(data.temperature, 6)} degrees Celsius; target ${format(data.target, 5)} degrees; derivative ${format(data.derivative, 5)} degrees per minute"/></label><div class="p252-presets"><button class="secondary-button" type="button" data-problem-action="p252-time" data-p252-time="0">Initial t=0</button><button class="secondary-button" type="button" data-problem-action="p252-time" data-p252-time="${TURNING_TIME}">Turning point</button><button class="primary-button" type="button" data-problem-action="p252-time" data-p252-time="4">Challenge t=4</button><button class="secondary-button" type="button" data-problem-action="p252-time" data-p252-time="8">Later t=8</button></div><div class="p252-component-toggles" role="group" aria-label="Solution component visibility"><button class="chip-button ${state.showForced ? "active" : ""}" type="button" data-problem-action="p252-toggle-forced" aria-pressed="${state.showForced}">${state.showForced ? "Forced curve shown" : "Show forced curve"}</button><button class="chip-button ${state.showTransient ? "active" : ""}" type="button" data-problem-action="p252-toggle-transient" aria-pressed="${state.showTransient}">${state.showTransient ? "Transient shown" : "Show transient"}</button></div><p data-p252-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const data = currentData();
    return `<section class="p252-metrics" aria-live="polite"><article><span>Total temperature T</span><strong>${format(data.temperature, 6)}°C</strong><small>P(t)+H(t)</small></article><article><span>Forced response P</span><strong>${format(data.forcedResponse, 6)}°C</strong><small>tracks the ramp with an 8°C lag</small></article><article><span>Transient memory H</span><strong>${format(data.transient, 6)}°C</strong><small>decays like e^(−t/2)</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p252-distinction"><strong>The moving target is not the particular solution.</strong><span>E(t)=20+4t is where T′ would be zero at that instant. Because E keeps moving, the long-run ramp response is P(t)=E(t)−8. The transient only records the fading initial mismatch.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p252-dynamic">${temperatureSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p252-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p252-solution" aria-labelledby="p252-solution-heading"><h3 id="p252-solution-heading">A ramp response plus a decaying memory</h3><p>Try a linear particular response P(t)=at+b. Substitution into P′+½P=10+2t gives</p><div class="p252-equation">a+½(at+b)=10+2t,<br>so a=4 and b=12.</div><p>The homogeneous solution is Ce^(−t/2), hence</p><div class="p252-equation">T(t)=4t+12+Ce^(−t/2).<br>T(0)=30 gives C=18.</div><div class="p252-equation is-answer"><strong>T(t)=4t+12+18e^(−t/2),</strong><br><strong>T(4)=28+18e^(−2)≈30.4360351°C.</strong></div><p>Rewriting the ODE as T′=−½[T−(20+4t)] reveals a moving zero-derivative target E(t)=20+4t. A fixed-equilibrium argument fails because E moves. After the transient fades, T follows the parallel ramp P(t)=4t+12, remaining 8°C behind E rather than settling at a constant temperature.</p></section>`;
  }

  function snapshot() {
    const data = currentData();
    const initial = solutionData(0);
    const turn = solutionData(TURNING_TIME);
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      equation: "T'(t)+(1/2)T(t)=10+2t",
      initialCondition: "T(0)=30",
      movingTargetForm: "T'=-(1/2)(T-E(t)), E(t)=20+4t",
      solution: { particularForcedResponse: "P(t)=4t+12", homogeneousTransient: "H(t)=18e^(-t/2)", total: "T(t)=P(t)+H(t)" },
      current: data,
      initialAudit: { temperature: initial.temperature, expected: 30, residual: initial.initialValueResidual, derivative: initial.derivative, target: initial.target },
      turningPoint: { time: TURNING_TIME, temperature: turn.temperature, target: turn.target, derivative: turn.derivative, equalityResidual: cleanZero(turn.temperature - turn.target) },
      challenge: { time: CHALLENGE_TIME, forcedResponse: challenge.forcedResponse, transient: challenge.transient, temperature: challenge.temperature, target: challenge.target, derivative: challenge.derivative, exact: "28+18e^(-2)" },
      longRunInterpretation: { targetMinusForcedResponse: data.movingTargetLagOfForcedResponse, statement: "fixed equilibrium intuition fails because target moves; forced ramp trails target by 8 degrees" },
      visibility: { forcedResponseCurve: state.showForced, transientCurve: state.showTransient },
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p252-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Differential Equations</strong><span class="eyebrow">Chapter 25 · linear first-order ODEs</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p252-spread"><article class="book-page p252-problem-page"><div class="problem-number">Problem 25.2</div><h1 class="book-title p252-title">Chasing a Moving Temperature</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p252-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A temperature T(t) satisfies</p><div class="p252-ode-card" aria-label="T prime plus one half T equals 10 plus 2t; T of 0 equals 30">T′+½T=10+2t,<br><span>T(0)=30.</span></div><p class="problem-copy"><strong>Find T(t), then calculate T(4).</strong></p><section class="p252-question-card"><strong>The forcing moves while the transient fades</strong><p>Separate the solution into the ramp forced by the right-hand side and the homogeneous memory of the initial temperature.</p></section></article><section class="book-page book-stage p252-stage" aria-labelledby="p252-stage-heading">${stageControlsMarkup()}<div class="p252-stage-heading"><div><span class="eyebrow">Linear-ODE laboratory</span><h2 id="p252-stage-heading">Watch a transient chase a moving target</h2></div><p>Scrub time, reveal each component independently and compare the total solution with the zero-derivative target.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p252-coach"><div class="coach-kicker">Evaluate the fixed solution</div><p class="coach-question">Enter T(4) in degrees Celsius. A decimal is expected.</p><form class="p252-answer-form" data-p252-answer-form novalidate><label for="p252-answer">T(4) (°C)</label><input id="p252-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="temperature"/><button class="primary-button" type="submit">Check temperature</button></form>${feedbackMarkup()}<div class="button-row p252-help-row"><button class="secondary-button" type="button" data-problem-action="p252-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p252-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p252-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p252-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p252-dynamic");
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

  function setStage(stage) {
    state.stage = clamp(Math.round(Number(stage)), 0, 2);
    if (state.stage >= 1) revealComponents();
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p252-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p252-reset") { state = initialState(); renderAndFocus(renderApp, "#p252-time"); return; }
      if (action === "p252-stage") { setStage(control.dataset.p252Stage); renderAndFocus(renderApp, `[data-p252-stage="${state.stage}"]`); return; }
      if (action === "p252-next-stage") { setStage(Math.min(2, state.stage + 1)); renderAndFocus(renderApp, `[data-p252-stage="${state.stage}"]`); return; }
      if (action === "p252-time") { setTime(Number(control.dataset.p252Time)); updateDynamicDom(); return; }
      if (action === "p252-toggle-forced") { state.showForced = !state.showForced; updateDynamicDom(); return; }
      if (action === "p252-toggle-transient") { state.showTransient = !state.showTransient; updateDynamicDom(); return; }
      if (action === "p252-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p252-reveal") { state.revealed = true; setStage(2); revealComponents(); restoreChallenge(); }
      renderApp();
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p252-time")) { setTime(Number(event.target.value)); updateDynamicDom(); return; }
      if (event.target.matches("#p252-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root.querySelector("[data-p252-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p252-answer")?.value || "";
      const answer = parseNumber(raw);
      state.answer = raw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a numerical temperature in degrees Celsius.";
      else if (Math.abs(answer - challenge.forcedResponse) <= .001) state.feedback = "28°C is the forced response P(4). Add the remaining transient 18e^(−2).";
      else if (Math.abs(answer - challenge.target) <= .001) state.feedback = "36°C is the moving zero-derivative target E(4), not the actual temperature.";
      else if (Math.abs(answer - challenge.transient) <= .001) state.feedback = "That is only the transient H(4). The full solution is P(4)+H(4).";
      else if (Math.abs(answer - 30) <= .001) state.feedback = "30°C is the initial value T(0). The temperature first cools, turns, and is about 30.436°C at t=4.";
      else if (Math.abs(answer - challenge.temperature) > .001) state.feedback = "Use T(t)=4t+12+18e^(−t/2), then substitute t=4.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: T(4)=28+18e^(−2)≈30.4360351°C."; state.committed = true; state.revealed = true; setStage(2); revealComponents(); restoreChallenge("Correct answer committed; restored t=4 with both solution components visible."); }
      renderAndFocus(renderApp, "#p252-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
