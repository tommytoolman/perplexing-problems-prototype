(function registerExplodingStepPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "25.6";
  const CHALLENGE_STEPS = 20;
  const FAST_RATE = -50;
  const SLOW_RATE = -1;
  const STABILITY_BOUNDARY = .04;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Step", title: "Turn each differential equation into a repeated multiplier", copy: "Explicit Euler sends a mode w′=λw to wₙ₊₁=(1+λh)wₙ. The same step h therefore gives the slow mode multiplier 1−h and the fast mode multiplier 1−50h." }),
    Object.freeze({ short: "Stability", title: "Check the multiplier before trusting the local approximation", copy: "A decaying exact mode needs |1+λh|<1 in Euler. For λ=−50 this becomes |1−50h|<1, hence 0&lt;h&lt;0.04. Equality at h=0.04 oscillates without decaying." }),
    Object.freeze({ short: "Explode", title: "See a consistent method amplify the wrong behaviour", copy: "At h=0.05 the fast multiplier is −1.5. Each step flips sign and grows magnitude by 50%, so twenty apparently small steps produce about 3325 while the exact mode has decayed to about 1.93×10⁻²²." }),
  ]);
  const hints = Object.freeze([
    "Explicit Euler applied to v′=−50v gives vₙ₊₁=(1−50h)vₙ.",
    "With h=0.05, the fast-mode amplification factor is 1−50(0.05)=−1.5.",
    "Reaching t=1 takes N=1/0.05=20 steps.",
    "Therefore v₂₀=(−1.5)²⁰. The even exponent makes the final value positive.",
    "Numerically, (−1.5)²⁰≈3325.25673008, even though e⁻⁵⁰≈1.92875×10⁻²².",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p256-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function normalizeSteps(value) { return clamp(Math.round(Number(value)), 10, 100); }
  function cleanZero(value) { return Math.abs(Number(value)) < 1e-14 ? 0 : Number(value); }
  function format(value, digits = 6) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    if (number !== 0 && (Math.abs(number) < 1e-4 || Math.abs(number) >= 1e6)) return number.toExponential(Math.min(5, digits)).replace("e+", "e");
    return String(cleanZero(Number(number.toFixed(digits))));
  }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-").replace(/[×x]\s*10\^?/i, "e");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function exactValue(rate, time) { return Math.exp(Number(rate) * Number(time)); }
  function amplification(rate, stepSize) { return 1 + Number(rate) * Number(stepSize); }
  function eulerTrace(rate, stepsInput) {
    const steps = normalizeSteps(stepsInput), stepSize = 1 / steps, factor = amplification(rate, stepSize), samples = [{ index: 0, time: 0, value: 1 }];
    let value = 1;
    for (let index = 1; index <= steps; index += 1) { value *= factor; samples.push({ index, time: index * stepSize, value }); }
    return { rate, steps, stepSize, factor, stable: Math.abs(factor) < 1, boundary: Math.abs(factor) === 1, terminal: value, samples };
  }
  function experiment(stepsInput) {
    const steps = normalizeSteps(stepsInput), slow = eulerTrace(SLOW_RATE, steps), fast = eulerTrace(FAST_RATE, steps);
    return {
      steps,
      stepSize: 1 / steps,
      slow,
      fast,
      exactAtOne: { slow: exactValue(SLOW_RATE, 1), fast: exactValue(FAST_RATE, 1) },
      fastAbsoluteError: Math.abs(fast.terminal - exactValue(FAST_RATE, 1)),
      withinFastStabilityInterval: 1 / steps > 0 && 1 / steps < STABILITY_BOUNDARY,
    };
  }
  const CHALLENGE = Object.freeze({ steps: CHALLENGE_STEPS, stepSize: .05, slowEuler: .95 ** 20, fastFactor: -1.5, exactExpression: "(-1.5)^20", fastEuler: (-1.5) ** 20, exactFastAtOne: Math.exp(-50) });

  function initialState() {
    return {
      steps: CHALLENGE_STEPS,
      stage: 0,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Challenge loaded: h=0.05 gives 20 steps. The slow multiplier is 0.95, but the fast multiplier is −1.5.",
    };
  }
  let state = initialState();
  function currentExperiment() { return experiment(state.steps); }
  function restoreChallenge(message) { state.steps = CHALLENGE_STEPS; state.boardMessage = message || "Restored h=0.05: twenty fast-mode multiplications by −1.5 end at 3325.25673008."; }

  function stageControlsMarkup() {
    return `<div class="p256-stage-controls" role="group" aria-label="Explicit Euler stability stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p256-stage" data-p256-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p256-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p256-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Instability exposed" : "Next stage"}</button></div>`;
  }

  function sampledExactPath(rate, mapX, mapY) {
    return Array.from({ length: 201 }, (_, index) => { const time = index / 200; return `${index ? "L" : "M"}${format(mapX(time), 3)} ${format(mapY(exactValue(rate, time)), 3)}`; }).join(" ");
  }
  function eulerPath(trace, mapX, mapY) { return trace.samples.map((sample, index) => `${index ? "L" : "M"}${format(mapX(sample.time), 3)} ${format(mapY(sample.value), 3)}`).join(" "); }
  function eulerPoints(trace, mapX, mapY, className) {
    const stride = trace.steps > 50 ? 5 : trace.steps > 30 ? 2 : 1;
    return trace.samples.filter((sample) => sample.index % stride === 0 || sample.index === trace.steps).map((sample) => `<circle class="${className}" cx="${format(mapX(sample.time), 3)}" cy="${format(mapY(sample.value), 3)}" r="2.5"><title>step ${sample.index}, t=${format(sample.time, 5)}, value ${format(sample.value, 8)}</title></circle>`).join("");
  }

  function stabilitySvg() {
    const data = currentExperiment(), slowPlot = { left: 52, right: 493, top: 78, bottom: 190 }, fastPlot = { left: 52, right: 493, top: 253, bottom: 389 };
    const mapTime = (time) => slowPlot.left + Number(time) * (slowPlot.right - slowPlot.left), mapSlow = (value) => slowPlot.bottom - Number(value) / 1.05 * (slowPlot.bottom - slowPlot.top);
    const fastScale = Math.max(1, ...data.fast.samples.map((sample) => Math.abs(sample.value))), mapFast = (value) => (fastPlot.top + fastPlot.bottom) / 2 - Number(value) / fastScale * (fastPlot.bottom - fastPlot.top) * .46;
    const ampPlot = { left: 546, right: 718, top: 88, bottom: 299 }, mapH = (stepSize) => ampPlot.left + Number(stepSize) / .1 * (ampPlot.right - ampPlot.left), mapR = (factor) => ampPlot.top + (1 - Number(factor)) / 5 * (ampPlot.bottom - ampPlot.top);
    const stableX = mapH(STABILITY_BOUNDARY), currentH = mapH(data.stepSize), currentR = mapR(data.fast.factor), fastStatus = data.fast.stable ? "stable decay" : data.fast.boundary ? "boundary oscillation" : "unstable growth";
    const description = `Explicit Euler with ${data.steps} steps and step size ${format(data.stepSize, 6)}. The slow mode factor is ${format(data.slow.factor, 6)} and its terminal value is ${format(data.slow.terminal, 8)}, compared with exact e to the minus one. The fast mode factor is ${format(data.fast.factor, 6)}, classified as ${fastStatus}; its Euler terminal value is ${format(data.fast.terminal, 8)}, while exact e to the minus fifty is ${format(data.exactAtOne.fast, 6)}. The fast stability interval is strictly between step size zero and 0.04.`;
    return `<svg class="p256-stability p256-stage-${state.stage}" viewBox="0 0 760 440" role="img" aria-labelledby="p256-svg-title p256-svg-desc"><title id="p256-svg-title">Exact and explicit Euler traces for slow and stiff fast modes</title><desc id="p256-svg-desc">${description}</desc><defs><linearGradient id="p256-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17313d"/><stop offset="1" stop-color="#302a42"/></linearGradient><clipPath id="p256-slow-clip"><rect x="38" y="69" width="466" height="138" rx="10"/></clipPath><clipPath id="p256-fast-clip"><rect x="38" y="244" width="466" height="160" rx="10"/></clipPath></defs><rect class="p256-board" x="1" y="1" width="758" height="438" rx="20"/><text class="p256-board-kicker" x="23" y="28">SAME METHOD · SAME STEP · RADICALLY DIFFERENT MODAL STABILITY</text><g class="p256-slow-panel"><rect x="20" y="44" width="495" height="174" rx="16"/><text class="p256-panel-title" x="39" y="65">SLOW MODE u′=−u · EXACT AND EULER BOTH DECAY</text><g clip-path="url(#p256-slow-clip)"><g class="p256-grid">${[0,.25,.5,.75,1].map((time) => `<line x1="${mapTime(time)}" y1="${slowPlot.top}" x2="${mapTime(time)}" y2="${slowPlot.bottom}"/>`).join("")}${[0,.5,1].map((value) => `<line x1="${slowPlot.left}" y1="${mapSlow(value)}" x2="${slowPlot.right}" y2="${mapSlow(value)}"/>`).join("")}</g><path class="p256-exact-curve" d="${sampledExactPath(SLOW_RATE, mapTime, mapSlow)}"/><path class="p256-euler-curve" d="${eulerPath(data.slow, mapTime, mapSlow)}"/>${eulerPoints(data.slow, mapTime, mapSlow, "p256-euler-point")}</g>${[0,.25,.5,.75,1].map((time) => `<text class="p256-tick" x="${mapTime(time)}" y="205" text-anchor="middle">${format(time, 2)}</text>`).join("")}<text class="p256-curve-label is-exact" x="365" y="135">exact e⁻ᵗ</text><text class="p256-curve-label is-euler" x="365" y="151">Euler · R=${format(data.slow.factor, 4)}</text><text class="p256-end-label" x="488" y="${Math.max(89, mapSlow(data.slow.terminal) - 8)}" text-anchor="end">uₙ=${format(data.slow.terminal, 7)}</text></g><g class="p256-fast-panel"><rect x="20" y="228" width="495" height="194" rx="16"/><text class="p256-panel-title" x="39" y="249">FAST MODE v′=−50v · VERTICAL SCALE ±${format(fastScale, 5)}</text><g clip-path="url(#p256-fast-clip)"><g class="p256-grid">${[0,.25,.5,.75,1].map((time) => `<line x1="${mapTime(time)}" y1="${fastPlot.top}" x2="${mapTime(time)}" y2="${fastPlot.bottom}"/>`).join("")}<line x1="${fastPlot.left}" y1="${mapFast(0)}" x2="${fastPlot.right}" y2="${mapFast(0)}"/></g><path class="p256-exact-curve is-fast" d="${sampledExactPath(FAST_RATE, mapTime, mapFast)}"/><path class="p256-euler-curve is-fast ${data.fast.stable ? "is-stable" : data.fast.boundary ? "is-boundary" : "is-unstable"}" d="${eulerPath(data.fast, mapTime, mapFast)}"/>${eulerPoints(data.fast, mapTime, mapFast, `p256-euler-point is-fast ${data.fast.stable ? "is-stable" : data.fast.boundary ? "is-boundary" : "is-unstable"}`)}</g>${[0,.25,.5,.75,1].map((time) => `<text class="p256-tick" x="${mapTime(time)}" y="401" text-anchor="middle">${format(time, 2)}</text>`).join("")}<text class="p256-fast-zero" x="487" y="${mapFast(0) - 5}" text-anchor="end">exact v(1)=${format(data.exactAtOne.fast, 5)}</text><text class="p256-fast-end" x="487" y="271" text-anchor="end">Euler vₙ=${format(data.fast.terminal, 7)}</text><text class="p256-fast-status ${data.fast.stable ? "is-stable" : data.fast.boundary ? "is-boundary" : "is-unstable"}" x="39" y="414">${fastStatus.toUpperCase()} · |R|=${format(Math.abs(data.fast.factor), 5)}</text></g><g class="p256-amplification-panel"><rect x="525" y="44" width="215" height="378" rx="16"/><text class="p256-panel-title" x="542" y="65">FAST AMPLIFICATION R=1−50h</text><rect class="p256-stable-band" x="${ampPlot.left}" y="${mapR(1)}" width="${stableX - ampPlot.left}" height="${mapR(-1) - mapR(1)}"/><g class="p256-amp-grid">${[1,0,-1,-2,-3,-4].map((factor) => `<line x1="${ampPlot.left}" y1="${mapR(factor)}" x2="${ampPlot.right}" y2="${mapR(factor)}"/><text x="540" y="${mapR(factor) + 3}" text-anchor="end">${factor}</text>`).join("")}${[0,.02,.04,.06,.08,.1].map((step) => `<line x1="${mapH(step)}" y1="${ampPlot.top}" x2="${mapH(step)}" y2="${ampPlot.bottom}"/><text x="${mapH(step)}" y="312" text-anchor="middle">${format(step, 2)}</text>`).join("")}</g><line class="p256-boundary-line" x1="${stableX}" y1="${ampPlot.top}" x2="${stableX}" y2="${ampPlot.bottom}"/><line class="p256-amplification-line" x1="${mapH(0)}" y1="${mapR(1)}" x2="${mapH(.1)}" y2="${mapR(-4)}"/><circle class="p256-amplification-point ${data.fast.stable ? "is-stable" : data.fast.boundary ? "is-boundary" : "is-unstable"}" cx="${currentH}" cy="${currentR}" r="6"/><text class="p256-band-label" x="${mapH(.019)}" y="119" text-anchor="middle">|R|&lt;1</text><text class="p256-boundary-label" x="${stableX + 4}" y="284">h=.04 boundary</text><line class="p256-ledger-rule" x1="542" y1="326" x2="722" y2="326"/><text class="p256-ledger" x="542" y="347">h=${format(data.stepSize, 6)} · N=${data.steps}</text><text class="p256-ledger" x="542" y="364">slow R=1−h=${format(data.slow.factor, 6)}</text><text class="p256-ledger" x="542" y="381">fast R=1−50h=${format(data.fast.factor, 6)}</text><text class="p256-ledger-result ${data.fast.stable ? "is-stable" : data.fast.boundary ? "is-boundary" : "is-unstable"}" x="542" y="403">${data.fast.stable ? "0&lt;h&lt;.04 · stable" : data.fast.boundary ? "|R|=1 · no decay" : "|R|>1 · explosive"}</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = currentExperiment();
    return `<section class="p256-controls" aria-label="Euler step-size controls"><label for="p256-steps"><span>Step size h <output>h=${format(data.stepSize, 6)} · ${data.steps} steps</output></span><input id="p256-steps" type="range" min="10" max="100" step="1" value="${data.steps}" aria-valuetext="step size ${format(data.stepSize, 6)} with ${data.steps} steps; fast amplification ${format(data.fast.factor, 6)}; ${data.fast.stable ? "stable" : data.fast.boundary ? "on the stability boundary" : "unstable"}"/></label><div class="p256-presets"><button class="secondary-button" type="button" data-problem-action="p256-steps" data-p256-steps="50">h=.02 · stable</button><button class="secondary-button" type="button" data-problem-action="p256-steps" data-p256-steps="25">h=.04 · boundary</button><button class="secondary-button" type="button" data-problem-action="p256-steps" data-p256-steps="20">h=.05 · challenge</button><button class="secondary-button" type="button" data-problem-action="p256-steps" data-p256-steps="10">h=.10 · unstable</button></div><p data-p256-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const data = currentExperiment();
    return `<section class="p256-metrics" aria-live="polite"><article><span>slow mode at t=1</span><strong>${format(data.slow.terminal, 8)}</strong><small>Euler; exact ${format(data.exactAtOne.slow, 8)}</small></article><article><span>fast Euler multiplier</span><strong>${format(data.fast.factor, 6)}</strong><small>|R| ${format(Math.abs(data.fast.factor), 6)} · ${data.fast.stable ? "stable" : data.fast.boundary ? "boundary" : "unstable"}</small></article><article><span>fast mode at t=1</span><strong>${format(data.fast.terminal, 8)}</strong><small>exact ${format(data.exactAtOne.fast, 5)}</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p256-distinction"><strong>Consistency and small local error do not guarantee a useful long computation.</strong><span>Euler is consistent as h→0, but a fixed h must also lie inside the absolute-stability interval for every decaying mode. The stiff rate −50 imposes the restrictive condition h&lt;0.04; the slow rate −1 does not expose the danger here.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p256-dynamic">${stabilitySvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p256-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p256-solution" aria-labelledby="p256-solution-heading"><h3 id="p256-solution-heading" tabindex="-1">The fast multiplier lies outside Euler’s stability interval</h3><p>For a scalar mode w′=λw, explicit Euler gives wₙ₊₁=(1+λh)wₙ. With h=0.05, twenty steps reach t=1.</p><div class="p256-equation">u₂₀=(1−0.05)²⁰=0.95²⁰≈${format(CHALLENGE.slowEuler, 10)},</div><div class="p256-equation">v₂₀=(1−50·0.05)²⁰=(−1.5)²⁰.</div><div class="p256-equation is-answer"><strong>v₂₀≈3325.25673008.</strong></div><p>The exact fast solution is v(1)=e⁻⁵⁰≈${format(CHALLENGE.exactFastAtOne, 6)}. It is essentially zero, not enormous.</p><p>Absolute stability for the fast mode requires</p><div class="p256-equation">|1−50h|&lt;1<br/>⇔ −1&lt;1−50h&lt;1<br/>⇔ <strong>0&lt;h&lt;0.04.</strong></div><p>At h=0.04 the multiplier is −1, so the numerical values merely alternate and do not decay. At h=0.05 its magnitude is 1.5, causing sign flips of increasing size. A consistent method can therefore fail catastrophically on a stiff system when the chosen step lies outside its absolute-stability region.</p></section>`;
  }

  function snapshot() {
    const data = currentExperiment();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      system: { equations: ["u'=-u", "v'=-50v"], initial: { u: 1, v: 1 }, exact: { u: "e^(-t)", v: "e^(-50t)" } },
      explicitEuler: { recurrence: "w_(n+1)=(1+lambda*h)w_n", steps: data.steps, stepSize: data.stepSize, slow: data.slow, fast: data.fast },
      exactAtOne: data.exactAtOne,
      fastAbsoluteErrorAtOne: data.fastAbsoluteError,
      stability: { scalarCondition: "|1+lambda*h|<1", fastCondition: "|1-50h|<1", exactFastInterval: "0<h<0.04", boundaryStepSize: STABILITY_BOUNDARY, boundaryFactor: amplification(FAST_RATE, STABILITY_BOUNDARY), selectedStepInsideFastInterval: data.withinFastStabilityInterval },
      challenge: CHALLENGE,
      teachingPoint: "consistency and local truncation error are insufficient without absolute stability at the selected fixed step",
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p256-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Differential Equations and Dynamical Systems</strong><span class="eyebrow">Chapter 25 · numerical stability</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p256-spread"><article class="book-page p256-problem-page"><div class="problem-number">Problem 25.6</div><h1 class="book-title p256-title">The Step That Explodes</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p256-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Consider the stiff system</p><div class="p256-problem-system"><strong>u′=−u</strong><strong>v′=−50v</strong><span>u(0)=v(0)=1</span></div><p class="problem-copy">Apply explicit Euler with h=0.05 from t=0 to t=1. <strong>What value does the method produce for v(1)?</strong></p><section class="p256-question-card"><strong>Decay in the equation can become growth in the algorithm</strong><p>Track each mode’s amplification factor before comparing the numerical and exact endpoints.</p></section></article><section class="book-page book-stage p256-stage" aria-labelledby="p256-stage-heading">${stageControlsMarkup()}<div class="p256-stage-heading"><div><span class="eyebrow">Stability laboratory</span><h2 id="p256-stage-heading">Test the step against both decay rates</h2></div><p>Adjust h, compare exact and Euler traces, and locate the fast mode on its amplification-factor diagram.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p256-coach"><div class="coach-kicker">Twenty unstable steps</div><p class="coach-question">Enter Euler’s value v₂₀ at t=1 for h=0.05.</p><form class="p256-answer-form" data-p256-answer-form novalidate><label for="p256-answer">Euler fast-mode value</label><input id="p256-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="numerical value"/><button class="primary-button" type="submit">Check v₂₀</button></form>${feedbackMarkup()}<div class="button-row p256-help-row"><button class="secondary-button" type="button" data-problem-action="p256-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p256-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p256-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) { if (!active) return ""; if (active.id) return `#${active.id}`; if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`; return ""; }
  function updateDynamicDom() {
    const root = document.querySelector(".p256-shell"); if (!root) return;
    const dynamic = root.querySelector(".p256-dynamic"), selector = dynamic?.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) { const replacement = root.querySelector(selector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }
  function setSteps(value, message) {
    state.steps = normalizeSteps(value);
    const data = currentExperiment();
    state.boardMessage = message || `h=${format(data.stepSize, 6)} gives fast multiplier R=${format(data.fast.factor, 6)}: ${data.fast.stable ? "stable decay" : data.fast.boundary ? "the non-decaying boundary" : "unstable growth"}.`;
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p256-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return; const action = control.dataset.problemAction;
      if (action === "p256-reset") { state = initialState(); renderAndFocus(renderApp, "#p256-steps"); return; }
      if (action === "p256-stage") { state.stage = clamp(Math.round(Number(control.dataset.p256Stage)), 0, 2); renderAndFocus(renderApp, `[data-p256-stage="${state.stage}"]`); return; }
      if (action === "p256-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p256-stage="${state.stage}"]`); return; }
      if (action === "p256-steps") { setSteps(control.dataset.p256Steps); updateDynamicDom(); return; }
      if (action === "p256-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p256-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p256-reveal") window.requestAnimationFrame(() => document.querySelector("#p256-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p256-steps")) { setSteps(event.target.value); updateDynamicDom(); return; }
      if (event.target.matches("#p256-answer")) { state.answer = event.target.value.slice(0, 28); state.feedback = ""; state.committed = false; }
    });
    root?.querySelector("[data-p256-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p256-answer")?.value || "", answer = parseNumber(raw);
      state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a numerical value for the twentieth Euler iterate.";
      else if (Math.abs(answer - CHALLENGE.exactFastAtOne) < 1e-8) state.feedback = "That is the exact decayed value. Euler uses the multiplier 1−50h at every step.";
      else if (Math.abs(answer + CHALLENGE.fastEuler) < .01) state.feedback = "The multiplier is negative, but twenty is even, so the final Euler value is positive.";
      else if (Math.abs(answer - CHALLENGE.fastEuler) > .01) state.feedback = "Use v₂₀=(1−50·0.05)²⁰=(−1.5)²⁰.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: v₂₀=(−1.5)²⁰≈3325.25673008, while the exact solution is essentially zero."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p256-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
