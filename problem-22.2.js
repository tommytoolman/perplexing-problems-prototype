(function registerNinetyFiveNetsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "22.2";
  const SAMPLE_SIZE = 100;
  const OBSERVED_MEAN = 52;
  const KNOWN_SIGMA = 10;
  const Z_CRITICAL = 1.96;
  const TRUE_MEAN = 50;
  const DEFAULT_SEED = 2202;
  const DEFAULT_REPETITIONS = 200;
  const VISIBLE_INTERVALS = 36;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Calculate", title: "Build one interval from its standard error", copy: "Known σ gives SE=σ/√n. Multiply by the 95% critical value 1.96, then subtract and add that margin around the observed sample mean." }),
    Object.freeze({ short: "Repeat", title: "Let the intervals vary while μ stays fixed", copy: "The simulator fixes μ=50 and repeatedly draws a new sample mean. Each random interval is a net; blue nets catch the fixed μ and coral nets miss it." }),
    Object.freeze({ short: "Interpret", title: "Attach 95% to the procedure, not this parameter", copy: "Before sampling, 95% of intervals made by this procedure cover μ in the long run. After observing the data, μ is fixed and this particular interval either covers it or does not." }),
  ]);
  const hints = Object.freeze([
    "The standard error of the sample mean is σ/√n.",
    "Here SE=10/√100=10/10=1.",
    "The 95% margin of error is 1.96×SE=1.96.",
    "Subtract and add 1.96 around the observed mean 52.",
    "The endpoints are 52−1.96=50.04 and 52+1.96=53.96.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p222-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replace(/[^0-9eE+.-]/g, ""); return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN; }

  function analyticData(sampleMean = OBSERVED_MEAN, sigma = KNOWN_SIGMA, sampleSize = SAMPLE_SIZE) {
    const standardError = sigma / Math.sqrt(sampleSize), margin = Z_CRITICAL * standardError;
    return { sampleMean, sigma, sampleSize, standardError, margin, lower: sampleMean - margin, upper: sampleMean + margin };
  }

  function seededGenerator(seed) {
    let value = Math.trunc(seed) >>> 0;
    return function random() { value += 0x6D2B79F5; let mixed = value; mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1); mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61); return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296; };
  }

  function standardNormal(random) {
    const first = Math.max(random(), Number.EPSILON), second = random();
    return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
  }

  function simulationData(seed = DEFAULT_SEED, repetitions = DEFAULT_REPETITIONS) {
    const random = seededGenerator(seed), standardError = KNOWN_SIGMA / Math.sqrt(SAMPLE_SIZE), margin = Z_CRITICAL * standardError, intervals = []; let covered = 0, meanSum = 0;
    for (let index = 0; index < repetitions; index += 1) {
      const sampleMean = TRUE_MEAN + standardError * standardNormal(random), lower = sampleMean - margin, upper = sampleMean + margin, covers = lower <= TRUE_MEAN && TRUE_MEAN <= upper;
      if (covers) covered += 1; meanSum += sampleMean; intervals.push({ index, sampleMean, lower, upper, covers, zScore: (sampleMean - TRUE_MEAN) / standardError });
    }
    return { seed, repetitions, intervals, covered, missed: repetitions - covered, coverageRate: covered / repetitions, averageSampleMean: meanSum / repetitions, standardError, margin };
  }

  const CHALLENGE = Object.freeze(analyticData());
  function initialState() { return { seed: DEFAULT_SEED, repetitions: DEFAULT_REPETITIONS, selectedInterval: 0, stage: 0, lowerAnswer: "", upperAnswer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();
  function currentSimulation() { return simulationData(state.seed, state.repetitions); }
  function restoreSimulation() { state.seed = DEFAULT_SEED; state.repetitions = DEFAULT_REPETITIONS; state.selectedInterval = 0; }

  function stageControlsMarkup() { return `<div class="p222-stage-controls" role="group" aria-label="Confidence-interval reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p222-stage" data-p222-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p222-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p222-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Interpretation secured" : "Next stage"}</button></div>`; }

  function intervalPath(interval, y, mapX, className) { const left = mapX(interval.lower), right = mapX(interval.upper); return `<path class="${className}" d="M${format(left, 3)} ${y - 3}V${y + 3}M${format(left, 3)} ${y}H${format(right, 3)}M${format(right, 3)} ${y - 3}V${y + 3}"/>`; }

  function netsSvg() {
    const simulation = currentSimulation(), selectedIndex = clamp(state.selectedInterval, 0, Math.min(VISIBLE_INTERVALS, simulation.intervals.length) - 1), selected = simulation.intervals[selectedIndex], visible = simulation.intervals.slice(0, VISIBLE_INTERVALS);
    const domainMinimum = 45, domainMaximum = 55, mapX = (value) => 53 + (value - domainMinimum) / (domainMaximum - domainMinimum) * 475, trueX = mapX(TRUE_MEAN), showSimulation = state.stage >= 1 || state.revealed, showInterpretation = state.stage >= 2 || state.revealed;
    const observedCoversSimulatorMean = CHALLENGE.lower <= TRUE_MEAN && TRUE_MEAN <= CHALLENGE.upper;
    const description = `The observed sample mean is 52 with known sigma 10 and sample size 100. Its standard error is 1, margin is 1.96, and 95 percent z interval is 50.04 to 53.96. Separately, ${simulation.repetitions} seeded repetitions use fixed true mean 50. ${simulation.covered} intervals cover it and ${simulation.missed} miss it, for empirical coverage ${format(simulation.coverageRate, 6)}. Selected simulated interval ${selectedIndex + 1} runs from ${format(selected.lower, 5)} to ${format(selected.upper, 5)} and ${selected.covers ? "covers" : "misses"} true mean 50.`;
    return `<svg class="p222-nets p222-stage-${state.stage}" viewBox="0 0 760 455" role="img" aria-labelledby="p222-nets-title p222-nets-desc"><title id="p222-nets-title">Observed z interval and repeated confidence-interval coverage</title><desc id="p222-nets-desc">${description}</desc><defs><linearGradient id="p222-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172d3b"/><stop offset="1" stop-color="#30283d"/></linearGradient><clipPath id="p222-net-clip"><rect x="46" y="191" width="489" height="210" rx="10"/></clipPath></defs><rect class="p222-board" x="1" y="1" width="758" height="453" rx="20"/><text class="p222-board-kicker" x="23" y="28">ONE ANALYTIC INTERVAL ABOVE · REPEATED SEEDED PROCEDURE BELOW</text><g class="p222-calculation-panel"><rect x="20" y="44" width="720" height="121" rx="15"/><text class="p222-panel-title" x="37" y="68">FIXED OBSERVED DATA · n=100 · x̄=52 · KNOWN σ=10</text><g class="p222-calc-card" transform="translate(38 82)"><rect width="145" height="59" rx="10"/><text x="14" y="22">STANDARD ERROR</text><text class="p222-calc-value" x="131" y="47" text-anchor="end">10/√100 = 1</text></g><path class="p222-calc-arrow" d="M190 112h25"/><g class="p222-calc-card" transform="translate(222 82)"><rect width="145" height="59" rx="10"/><text x="14" y="22">95% MARGIN</text><text class="p222-calc-value" x="131" y="47" text-anchor="end">1.96 × 1 = 1.96</text></g><path class="p222-calc-arrow" d="M374 112h25"/><g class="p222-calc-card is-result" transform="translate(406 82)"><rect width="316" height="59" rx="10"/><text x="14" y="22">OBSERVED 95% z INTERVAL</text><text class="p222-calc-value" x="302" y="47" text-anchor="end">52 ± 1.96 = [50.04, 53.96]</text></g></g><g class="p222-net-panel"><rect x="20" y="182" width="535" height="251" rx="15"/><text class="p222-panel-title" x="37" y="205">REPEATED NETS · FIXED SIMULATOR μ=50 · FIRST ${VISIBLE_INTERVALS} SHOWN</text><line class="p222-true-line" x1="${trueX}" y1="216" x2="${trueX}" y2="401"/><text class="p222-true-label" x="${trueX + 5}" y="229">fixed μ=50</text><g clip-path="url(#p222-net-clip)">${visible.map((interval, index) => intervalPath(interval, 220 + index * 5, mapX, `p222-net ${interval.covers ? "is-cover" : "is-miss"} ${index === selectedIndex ? "is-selected" : ""}`)).join("")}</g>${[45,47.5,50,52.5,55].map((value) => `<line class="p222-axis-tick" x1="${mapX(value)}" y1="405" x2="${mapX(value)}" y2="411"/><text class="p222-axis-label" x="${mapX(value)}" y="423" text-anchor="middle">${value}</text>`).join("")}<text class="p222-selected-net" x="535" y="421" text-anchor="end">selected #${selectedIndex + 1}: [${format(selected.lower, 3)}, ${format(selected.upper, 3)}] · ${selected.covers ? "covers" : "misses"}</text></g><g class="p222-coverage-panel"><rect x="570" y="182" width="170" height="251" rx="15"/><text class="p222-panel-title" x="586" y="205">COVERAGE AUDIT</text><text class="p222-coverage-label" x="586" y="242">caught μ</text><text class="p222-coverage-value is-cover" x="724" y="242" text-anchor="end">${showSimulation ? simulation.covered : "stage 2"}</text><text class="p222-coverage-label" x="586" y="268">missed μ</text><text class="p222-coverage-value is-miss" x="724" y="268" text-anchor="end">${showSimulation ? simulation.missed : "stage 2"}</text><line class="p222-coverage-rule" x1="586" y1="286" x2="724" y2="286"/><text class="p222-coverage-label" x="586" y="312">empirical rate</text><text class="p222-coverage-rate" x="724" y="343" text-anchor="end">${showSimulation ? format(simulation.coverageRate * 100, 2) : "—"}%</text><text class="p222-nominal" x="724" y="365" text-anchor="end">nominal 95%</text><text class="p222-observed-note ${observedCoversSimulatorMean ? "is-cover" : "is-miss"}" x="586" y="393">${showInterpretation ? `if μ=50, observed net ${observedCoversSimulatorMean ? "covers" : "misses"}` : "interpret at stage 3"}</text><text class="p222-observed-detail" x="586" y="411">${showInterpretation ? "50 lies below 50.04" : "μ stays fixed"}</text></g></svg>`;
  }

  function controlsMarkup() {
    const simulation = currentSimulation(), selected = simulation.intervals[state.selectedInterval];
    return `<section class="p222-controls" aria-label="Repeated confidence-interval simulation controls"><div class="p222-slider-grid"><label for="p222-repetitions"><span>Repeated intervals <output>${state.repetitions}</output></span><input id="p222-repetitions" type="range" min="50" max="1000" step="50" value="${state.repetitions}" aria-valuetext="${state.repetitions} repeated intervals; ${simulation.covered} cover true mean 50; empirical coverage ${format(simulation.coverageRate * 100, 2)} percent"/></label><label for="p222-selected"><span>Highlighted visible net <output>${state.selectedInterval + 1}</output></span><input id="p222-selected" type="range" min="1" max="${Math.min(VISIBLE_INTERVALS, simulation.intervals.length)}" step="1" value="${state.selectedInterval + 1}" aria-valuetext="interval ${state.selectedInterval + 1}; lower ${format(selected.lower, 4)}; upper ${format(selected.upper, 4)}; ${selected.covers ? "covers" : "misses"} true mean 50"/></label></div><div class="p222-seed-row"><label for="p222-seed"><span>Deterministic seed</span><input id="p222-seed" type="number" min="1" max="999999" step="1" value="${state.seed}" inputmode="numeric"/></label><button class="secondary-button" type="button" data-problem-action="p222-new-seed">Change seed</button><button class="ghost-button" type="button" data-problem-action="p222-restore">Restore simulation</button></div><p>The simulator draws sample means from N(μ, σ²/n) with μ=50, σ=10 and n=100. It estimates coverage only; the observed interval above is calculated analytically from x̄=52.</p></section>`;
  }

  function metricsMarkup() { const simulation = currentSimulation(); return `<section class="p222-metrics" aria-live="polite"><article><span>Observed standard error</span><strong>${format(CHALLENGE.standardError, 2)}</strong><small>σ/√n</small></article><article><span>Observed margin</span><strong>${format(CHALLENGE.margin, 2)}</strong><small>1.96 × SE</small></article><article><span>Simulated coverage</span><strong>${format(simulation.coverageRate * 100, 2)}%</strong><small>${simulation.covered}/${simulation.repetitions}; nominal 95%</small></article></section>`; }
  function interpretationMarkup() { return `<section class="p222-interpretation"><strong>Frequentist coverage is a long-run property of the method.</strong><span>μ is a fixed parameter. Once [50.04, 53.96] has been observed, it either contains μ or it does not. Calling that event “95% probable” would require a posterior model and prior that are not part of this z-interval calculation.</span></section>`; }
  function dynamicMarkup() { return `<div class="p222-dynamic">${netsSvg()}${controlsMarkup()}${metricsMarkup()}${interpretationMarkup()}</div>`; }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p222-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p222-solution" aria-labelledby="p222-solution-heading"><h3 id="p222-solution-heading" tabindex="-1">One standard error makes the arithmetic especially clean</h3><p>Because σ is known, the standard error is</p><div class="p222-equation">SE=σ/√n=10/√100=10/10=1.</div><p>The 95% z margin of error is</p><div class="p222-equation">z*SE=1.96(1)=1.96.</div><p>Place this margin on either side of the observed sample mean:</p><div class="p222-equation is-answer">52−1.96=<strong>50.04</strong><br>52+1.96=<strong>53.96</strong><br>95% z interval: <strong>[50.04, 53.96].</strong></div><p>The 95% statement concerns repeated use of the procedure: approximately 95% of intervals generated this way cover the fixed μ. It is not a 95% posterior probability that μ lies in this already observed interval. In the separate simulator where μ is fixed at 50, this particular challenge interval actually misses by 0.04—an unsurprising event for a method that misses about 5% of the time.</p></section>`;
  }

  function snapshot() {
    const simulation = currentSimulation(), selected = simulation.intervals[state.selectedInterval];
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, analyticChallenge: { sampleSize: SAMPLE_SIZE, observedSampleMean: OBSERVED_MEAN, knownPopulationStandardDeviation: KNOWN_SIGMA, criticalZ: Z_CRITICAL, standardError: CHALLENGE.standardError, marginOfError: CHALLENGE.margin, lowerEndpoint: CHALLENGE.lower, upperEndpoint: CHALLENGE.upper, method: "known-sigma two-sided 95% z confidence interval" }, interpretation: { parameterStatus: "mu is fixed, not random, in the frequentist model", procedureCoverage: "about 95% over repeated samples", forbiddenShortcut: "the observed frequentist interval does not by itself assign 95% posterior probability to mu" }, simulation: { separateFromAnalyticChallenge: true, model: "sample means drawn from N(mu, sigma^2/n)", fixedTrueMean: TRUE_MEAN, seed: simulation.seed, repetitions: simulation.repetitions, covered: simulation.covered, missed: simulation.missed, empiricalCoverage: simulation.coverageRate, averageSampleMean: simulation.averageSampleMean, selectedIntervalIndex: state.selectedInterval, selectedInterval: selected }, checks: { observedChallengeCoversSimulatorMean: CHALLENGE.lower <= TRUE_MEAN && TRUE_MEAN <= CHALLENGE.upper, analyticWidthResidual: CHALLENGE.upper - CHALLENGE.lower - 2 * CHALLENGE.margin, endpointCentreResidual: (CHALLENGE.lower + CHALLENGE.upper) / 2 - OBSERVED_MEAN, simulatedCountResidual: simulation.covered + simulation.missed - simulation.repetitions }, stage: state.stage + 1, lowerAnswer: state.lowerAnswer || null, upperAnswer: state.upperAnswer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p222-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Statistics and Inference</strong><span class="eyebrow">Chapter 22 · confidence intervals</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p222-spread"><article class="book-page p222-problem-page"><div class="problem-number">Problem 22.2</div><h1 class="book-title p222-title">Ninety-Five Nets</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p222-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A sample of n=100 has mean x̄=52. The population standard deviation is known to be σ=10.</p><p class="problem-copy"><strong>Find the two endpoints of the 95% z confidence interval for the population mean.</strong></p><section class="p222-question-card"><strong>The interval is random before sampling</strong><p>Repeated samples produce different endpoints. The unknown parameter μ remains fixed throughout.</p></section><section class="p222-given-grid" aria-label="Confidence interval challenge"><span>sample size <strong>100</strong></span><span>sample mean <strong>52</strong></span><span>known σ <strong>10</strong></span><span>critical z <strong>1.96</strong></span></section></article><section class="book-page book-stage p222-stage" aria-labelledby="p222-stage-heading">${stageControlsMarkup()}<div class="p222-stage-heading"><div><span class="eyebrow">Coverage laboratory</span><h2 id="p222-stage-heading">Cast the same kind of net repeatedly</h2></div><p>Keep μ fixed, change the seed, and watch intervals vary around new sample means.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p222-coach"><div class="coach-kicker">Calculate one interval</div><p class="coach-question">Enter both endpoints for the fixed observed sample.</p><form class="p222-answer-form" data-p222-answer-form novalidate><div><label for="p222-lower">Lower endpoint</label><input id="p222-lower" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.lowerAnswer)}" placeholder="lower"/></div><div><label for="p222-upper">Upper endpoint</label><input id="p222-upper" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.upperAnswer)}" placeholder="upper"/></div><small>Enter values in increasing order; ±0.01 is accepted.</small><button class="primary-button" type="submit">Check interval</button></form>${feedbackMarkup()}<div class="button-row p222-help-row"><button class="secondary-button" type="button" data-problem-action="p222-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p222-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p222-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) { if (!active) return ""; if (active.id) return `#${active.id}`; if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`; return ""; }
  function updateDynamicDom() {
    const root = document.querySelector(".p222-shell"); if (!root) return; const dynamic = root.querySelector(".p222-dynamic"), selector = dynamic?.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup(); root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) { const replacement = root.querySelector(selector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p222-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return; const action = control.dataset.problemAction;
      if (action === "p222-reset") { state = initialState(); renderAndFocus(renderApp, "#p222-repetitions"); return; }
      if (action === "p222-stage") { state.stage = clamp(Number(control.dataset.p222Stage), 0, 2); renderAndFocus(renderApp, `[data-p222-stage="${state.stage}"]`); return; }
      if (action === "p222-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p222-stage="${state.stage}"]`); return; }
      if (action === "p222-new-seed") { state.seed = (state.seed + 7919 - 1) % 999999 + 1; state.selectedInterval = 0; updateDynamicDom(); return; }
      if (action === "p222-restore") { restoreSimulation(); updateDynamicDom(); return; }
      if (action === "p222-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p222-reveal") { state.revealed = true; state.stage = 2; restoreSimulation(); }
      renderApp(); if (action === "p222-reveal") window.requestAnimationFrame(() => document.querySelector("#p222-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p222-repetitions")) { state.repetitions = clamp(Math.round(Number(event.target.value) / 50) * 50, 50, 1000); state.selectedInterval = Math.min(state.selectedInterval, VISIBLE_INTERVALS - 1); updateDynamicDom(); return; }
      if (event.target.matches("#p222-selected")) { state.selectedInterval = clamp(Math.round(Number(event.target.value)) - 1, 0, VISIBLE_INTERVALS - 1); updateDynamicDom(); return; }
      if (event.target.matches("#p222-lower")) { state.lowerAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p222-upper")) { state.upperAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
    });
    root?.addEventListener("change", (event) => { if (!event.target.matches("#p222-seed")) return; state.seed = clamp(Math.round(Number(event.target.value) || DEFAULT_SEED), 1, 999999); state.selectedInterval = 0; updateDynamicDom(); });
    root?.querySelector("[data-p222-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const lowerRaw = event.currentTarget.querySelector("#p222-lower")?.value || "", upperRaw = event.currentTarget.querySelector("#p222-upper")?.value || "", lower = parseNumber(lowerRaw), upper = parseNumber(upperRaw); state.lowerAnswer = lowerRaw.trim(); state.upperAnswer = upperRaw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(lower) || !Number.isFinite(upper)) state.feedback = "Enter two numerical endpoints.";
      else if (Math.abs(lower - CHALLENGE.margin) <= .01 || Math.abs(upper - CHALLENGE.margin) <= .01) state.feedback = "1.96 is the margin of error. Subtract it from and add it to 52.";
      else if (Math.abs(lower - CHALLENGE.upper) <= .01 && Math.abs(upper - CHALLENGE.lower) <= .01) state.feedback = "Those are the right endpoints in reverse order. Put the lower value first.";
      else if (Math.abs(lower - CHALLENGE.lower) > .01 || Math.abs(upper - CHALLENGE.upper) > .01) state.feedback = "Use x̄ ± 1.96σ/√n = 52 ± 1.96(10/10).";
      else { state.feedbackTone = "success"; state.feedback = "Correct: 52±1.96 gives [50.04, 53.96]."; state.committed = true; state.stage = 2; restoreSimulation(); }
      renderAndFocus(renderApp, "#p222-lower");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
