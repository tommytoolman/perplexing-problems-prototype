(function registerShapeHiddenInAveragesPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "22.1";
  const POPULATION_MEAN = 50;
  const POPULATION_SD = 12;
  const CHALLENGE_SAMPLE_SIZE = 64;
  const LOWER_MEAN = 47;
  const UPPER_MEAN = 53;
  const SEEDED_SAMPLE_COUNT = 400;
  const INITIAL_SEED = 22012026;
  const POPULATION = Object.freeze([
    Object.freeze({ value: 44, probability: .8 }),
    Object.freeze({ value: 74, probability: .2 }),
  ]);
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Separate", title: "Population values and sample means have different shapes", copy: "The displayed population is deliberately skewed: 80% of observations are 44 and 20% are 74. A sample mean combines n observations, so its distribution is a different object." }),
    Object.freeze({ short: "Scale", title: "Standard deviation becomes standard error", copy: "Individual observations retain population SD σ=12. The sample mean varies less: SE(X̄)=σ/√n. Increasing n contracts the sampling distribution, not the population itself." }),
    Object.freeze({ short: "Standardise", title: "Turn the target interval into a normal area", copy: "At n=64, SE=1.5 and the bounds 47 and 53 become Z=−2 and Z=2. The analytic normal/CLT area is approximately 0.95450." }),
  ]);
  const hints = Object.freeze([
    "The standard deviation 12 describes individual population observations, not sample means.",
    "For independent observations, SE(X̄)=σ/√n=12/√64.",
    "Since √64=8, the standard error is 1.5.",
    "Standardise the endpoints: (47−50)/1.5=−2 and (53−50)/1.5=2.",
    "Therefore P(47≤X̄≤53)=P(−2≤Z≤2)=Φ(2)−Φ(−2)≈0.95450, or 95.45%.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p221-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function erf(value) {
    const sign = value < 0 ? -1 : 1;
    const x = Math.abs(value);
    const t = 1 / (1 + .3275911 * x);
    const approximation = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x);
    return sign * approximation;
  }

  function normalCdf(z) { return .5 * (1 + erf(z / Math.sqrt(2))); }

  function analyticData(sampleSize) {
    const standardError = POPULATION_SD / Math.sqrt(sampleSize);
    const lowerZ = (LOWER_MEAN - POPULATION_MEAN) / standardError;
    const upperZ = (UPPER_MEAN - POPULATION_MEAN) / standardError;
    const intervalProbability = normalCdf(upperZ) - normalCdf(lowerZ);
    return { sampleSize, standardError, lowerZ, upperZ, intervalProbability, conservationResidual: cleanZero(intervalProbability + normalCdf(lowerZ) + (1 - normalCdf(upperZ)) - 1) };
  }

  function populationMoments() {
    const mean = POPULATION.reduce((sum, point) => sum + point.value * point.probability, 0);
    const variance = POPULATION.reduce((sum, point) => sum + point.probability * (point.value - mean) ** 2, 0);
    return { mean, variance, standardDeviation: Math.sqrt(variance), probabilityResidual: cleanZero(POPULATION.reduce((sum, point) => sum + point.probability, 0) - 1), meanResidual: cleanZero(mean - POPULATION_MEAN), varianceResidual: cleanZero(variance - POPULATION_SD ** 2) };
  }

  function nextRandom(seed) {
    const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return { seed: nextSeed, value: nextSeed / 4294967296 };
  }

  function simulateMeans(sampleSize, seed, count = SEEDED_SAMPLE_COUNT) {
    let currentSeed = seed >>> 0;
    const means = [];
    for (let sample = 0; sample < count; sample += 1) {
      let total = 0;
      for (let observation = 0; observation < sampleSize; observation += 1) {
        const random = nextRandom(currentSeed);
        currentSeed = random.seed;
        total += random.value < POPULATION[0].probability ? POPULATION[0].value : POPULATION[1].value;
      }
      means.push(total / sampleSize);
    }
    const empiricalMean = means.reduce((sum, value) => sum + value, 0) / means.length;
    const empiricalVariance = means.reduce((sum, value) => sum + (value - empiricalMean) ** 2, 0) / means.length;
    const insideCount = means.filter((value) => value >= LOWER_MEAN && value <= UPPER_MEAN).length;
    return { means, nextSeed: currentSeed, empiricalMean, empiricalStandardDeviation: Math.sqrt(empiricalVariance), insideCount, empiricalProbability: insideCount / means.length };
  }

  function histogramData(means, analytic) {
    const greatestDeviation = Math.max(...means.map((value) => Math.abs(value - POPULATION_MEAN)), 0);
    const halfRange = Math.max(6, 4.2 * analytic.standardError, greatestDeviation * 1.08);
    const minimum = POPULATION_MEAN - halfRange;
    const maximum = POPULATION_MEAN + halfRange;
    const binCount = 28;
    const width = (maximum - minimum) / binCount;
    const bins = Array.from({ length: binCount }, (_, index) => ({ lower: minimum + index * width, upper: minimum + (index + 1) * width, count: 0 }));
    means.forEach((value) => {
      const index = clamp(Math.floor((value - minimum) / width), 0, binCount - 1);
      bins[index].count += 1;
    });
    return { minimum, maximum, width, bins, maximumCount: Math.max(...bins.map((bin) => bin.count), 1) };
  }

  const challenge = Object.freeze(analyticData(CHALLENGE_SAMPLE_SIZE));
  const moments = Object.freeze(populationMoments());

  function initialState() {
    return {
      sampleSize: CHALLENGE_SAMPLE_SIZE,
      sampleSeed: INITIAL_SEED,
      seededBatches: 0,
      stage: 0,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();
  function currentAnalytic() { return analyticData(state.sampleSize); }
  function currentSimulation() { return simulateMeans(state.sampleSize, state.sampleSeed); }

  function parseProbability(raw) {
    const compact = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".");
    const percent = compact.endsWith("%");
    const numeric = percent ? compact.slice(0, -1) : compact;
    if (!/^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(numeric)) return NaN;
    const value = Number(numeric);
    return percent || value > 1 ? value / 100 : value;
  }

  function stageControlsMarkup() {
    return `<div class="p221-stage-controls" role="group" aria-label="Sampling-distribution reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p221-stage" data-p221-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p221-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p221-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Interval resolved" : "Next stage"}</button></div>`;
  }

  function xScale(value, minimum, maximum, left, right) { return left + (value - minimum) * (right - left) / (maximum - minimum); }

  function populationPanelMarkup() {
    const axisMinimum = 35, axisMaximum = 80, left = 42, right = 244, baseline = 350;
    const barMarkup = POPULATION.map((point, index) => {
      const x = xScale(point.value, axisMinimum, axisMaximum, left, right);
      const height = 175 * point.probability / .8;
      return `<rect class="p221-population-bar is-${index ? "high" : "low"}" x="${format(x - 18, 3)}" y="${format(baseline - height, 3)}" width="36" height="${format(height, 3)}" rx="5"/><text class="p221-population-value" x="${format(x, 3)}" y="${format(baseline - height - 10, 3)}" text-anchor="middle">${format(point.probability * 100, 0)}%</text><text class="p221-axis-label" x="${format(x, 3)}" y="370" text-anchor="middle">${point.value}</text>`;
    }).join("");
    const meanX = xScale(POPULATION_MEAN, axisMinimum, axisMaximum, left, right);
    return `<g class="p221-population-panel"><rect x="20" y="45" width="244" height="343" rx="14"/><text class="p221-panel-title" x="36" y="70">POPULATION X · DELIBERATELY SKEWED</text><text class="p221-panel-copy" x="36" y="91">one observation</text><line class="p221-axis" x1="${left}" y1="${baseline}" x2="${right}" y2="${baseline}"/>${barMarkup}<line class="p221-population-mean" x1="${format(meanX, 3)}" y1="126" x2="${format(meanX, 3)}" y2="${baseline}"/><text class="p221-mean-label" x="${format(meanX + 5, 3)}" y="139">μ=50</text><g class="p221-population-ledger"><rect x="42" y="102" width="176" height="58" rx="9"/><text x="54" y="123">population SD</text><text class="p221-ledger-value" x="206" y="123" text-anchor="end">σ=12</text><text x="54" y="146">shape</text><text class="p221-ledger-value" x="206" y="146" text-anchor="end">not normal</text></g></g>`;
  }

  function samplingPanelMarkup(analytic, simulation) {
    const histogram = histogramData(simulation.means, analytic);
    const left = 300, right = 728, baseline = 350, top = 105;
    const scale = (value) => xScale(value, histogram.minimum, histogram.maximum, left, right);
    const binWidthPixels = (right - left) / histogram.bins.length;
    const histogramMarkup = histogram.bins.map((bin, index) => {
      const height = 122 * bin.count / histogram.maximumCount;
      return `<rect class="p221-histogram-bar" x="${format(left + index * binWidthPixels + .8, 3)}" y="${format(baseline - height, 3)}" width="${format(Math.max(.8, binWidthPixels - 1.6), 3)}" height="${format(height, 3)}"/>`;
    }).join("");
    const curvePath = Array.from({ length: 121 }, (_, index) => {
      const value = histogram.minimum + (histogram.maximum - histogram.minimum) * index / 120;
      const z = (value - POPULATION_MEAN) / analytic.standardError;
      const y = baseline - 132 * Math.exp(-.5 * z ** 2);
      return `${index ? "L" : "M"}${format(scale(value), 3)} ${format(y, 3)}`;
    }).join(" ");
    const targetLeft = clamp(scale(LOWER_MEAN), left, right);
    const targetRight = clamp(scale(UPPER_MEAN), left, right);
    const meanX = scale(POPULATION_MEAN);
    const showProbability = state.stage >= 2 || state.revealed;
    const showStandardError = state.stage >= 1 || state.revealed;
    return `<g class="p221-sampling-panel"><rect x="278" y="45" width="462" height="343" rx="14"/><text class="p221-panel-title" x="296" y="70">SAMPLING DISTRIBUTION OF X̄ · n=${state.sampleSize}</text><text class="p221-panel-copy" x="296" y="91">400 seeded sample means + separate normal/CLT curve</text><rect class="p221-target-band" x="${format(targetLeft, 3)}" y="${top}" width="${format(Math.max(0, targetRight - targetLeft), 3)}" height="${baseline - top}"/><line class="p221-axis" x1="${left}" y1="${baseline}" x2="${right}" y2="${baseline}"/>${histogramMarkup}<path class="p221-analytic-curve" d="${curvePath}"/><line class="p221-sample-mean-line" x1="${format(meanX, 3)}" y1="${top}" x2="${format(meanX, 3)}" y2="${baseline}"/><text class="p221-axis-label" x="${format(scale(histogram.minimum), 3)}" y="370" text-anchor="start">${format(histogram.minimum, 1)}</text><text class="p221-axis-label" x="${format(meanX, 3)}" y="370" text-anchor="middle">50</text><text class="p221-axis-label" x="${format(scale(histogram.maximum), 3)}" y="370" text-anchor="end">${format(histogram.maximum, 1)}</text><text class="p221-target-label" x="${format((targetLeft + targetRight) / 2, 3)}" y="202" text-anchor="middle">47≤X̄≤53</text><g class="p221-sampling-ledger"><rect x="296" y="105" width="182" height="81" rx="9"/><text x="309" y="126">analytic SE</text><text class="p221-ledger-value" x="466" y="126" text-anchor="end">${showStandardError ? format(analytic.standardError, 4) : "stage 2"}</text><text x="309" y="149">normal/CLT area</text><text class="p221-ledger-value" x="466" y="149" text-anchor="end">${showProbability ? format(analytic.intervalProbability, 5) : "stage 3"}</text><text x="309" y="172">seeded inside</text><text class="p221-ledger-value" x="466" y="172" text-anchor="end">${showProbability ? `${simulation.insideCount}/${SEEDED_SAMPLE_COUNT}` : "simulation"}</text></g><g class="p221-legend"><line x1="526" y1="121" x2="554" y2="121"/><text x="561" y="124">analytic normal/CLT</text><rect x="526" y="139" width="28" height="9"/><text x="561" y="147">seeded histogram</text></g></g>`;
  }

  function machineSvg() {
    const analytic = currentAnalytic();
    const simulation = currentSimulation();
    const description = `The population is a non-normal two-point distribution with probability 0.8 at 44 and probability 0.2 at 74, giving mean 50 and standard deviation 12. For sample size ${state.sampleSize}, the analytic standard error is ${format(analytic.standardError, 6)}. A deterministic seeded simulation of ${SEEDED_SAMPLE_COUNT} sample means has empirical mean ${format(simulation.empiricalMean, 6)}, empirical standard deviation ${format(simulation.empiricalStandardDeviation, 6)}, and ${simulation.insideCount} means between 47 and 53. The separate normal or central-limit curve assigns that interval probability ${format(analytic.intervalProbability, 8)}. This curve is an approximation for the displayed non-normal population.`;
    return `<svg class="p221-machine p221-stage-${state.stage}" viewBox="0 0 760 410" role="img" aria-labelledby="p221-machine-title p221-machine-desc"><title id="p221-machine-title">Population and sampling distribution shown separately</title><desc id="p221-machine-desc">${description}</desc><rect class="p221-board" x="1" y="1" width="758" height="408" rx="20"/><text class="p221-board-kicker" x="22" y="27">ONE POPULATION · REPEATED SAMPLES · A DISTRIBUTION OF MEANS</text>${populationPanelMarkup()}${samplingPanelMarkup(analytic, simulation)}</svg>`;
  }

  function metricsMarkup() {
    const analytic = currentAnalytic();
    return `<section class="p221-metrics" aria-label="Population and sampling-distribution scales" aria-live="polite"><article><span>Population spread</span><strong>SD=12</strong><small>individual observations · unchanged by n</small></article><div aria-hidden="true">→</div><article><span>Mean’s spread</span><strong>SE=${format(analytic.standardError, 4)}</strong><small>12/√${state.sampleSize} · shrinks with n</small></article><article><span>Analytic interval area</span><strong>${state.stage >= 2 || state.revealed ? format(analytic.intervalProbability, 5) : "stage 3"}</strong><small>normal/CLT model, not sample counting</small></article></section>`;
  }

  function assumptionMarkup() {
    return `<div class="p221-assumption" role="note"><strong>Model boundary.</strong> The bell curve is exact if the population itself is normal. For the displayed skewed population it is a central-limit approximation, expected to improve as n grows. The seeded histogram is an empirical demonstration and is never used to calculate the analytic answer.</div>`;
  }

  function dynamicMarkup() { return `<div class="p221-dynamic">${machineSvg()}${metricsMarkup()}${assumptionMarkup()}</div>`; }

  function controlsMarkup() {
    const analytic = currentAnalytic();
    return `<section class="p221-controls" aria-label="Sampling-machine controls"><label for="p221-sample-size"><span>Sample size n <output data-p221-output="n">${state.sampleSize}</output></span><input id="p221-sample-size" data-p221-sample-size type="range" min="1" max="144" step="1" value="${state.sampleSize}" aria-valuetext="sample size ${state.sampleSize}; standard error ${format(analytic.standardError, 4)}"/></label><div><button class="secondary-button" type="button" data-problem-action="p221-new-batch">New seeded batch</button><button class="chip-button" type="button" data-problem-action="p221-challenge">Restore n=64</button></div><p data-p221-control-note>Changing n leaves population SD at 12 and changes SE to ${format(analytic.standardError, 4)}. A new seed changes only the empirical histogram, not the analytic curve.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p221-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p221-solution" aria-labelledby="p221-solution-heading"><h3 id="p221-solution-heading">Standardise the sampling distribution, not the population</h3><p>For independent observations with population mean 50 and population SD 12, the sample mean has</p><div class="p221-solution-equation">E[X̄]=50,<br>SE(X̄)=σ/√n=12/√64=12/8=1.5.</div><p>The requested bounds are each three units from the mean, or two standard errors:</p><div class="p221-solution-equation">zₗ=(47−50)/1.5=−2,<br>zᵤ=(53−50)/1.5=2.</div><div class="p221-solution-equation is-answer">P(47≤X̄≤53)=P(−2≤Z≤2)<br>=Φ(2)−Φ(−2)≈<strong>0.95450 = 95.45%.</strong></div><p>This probability is exact under a normal-population model. For the displayed non-normal population it is the CLT approximation requested by the model; the seeded sample means merely illustrate its shape and will fluctuate from batch to batch.</p></section>`;
  }

  function snapshot() {
    const analytic = currentAnalytic();
    const simulation = currentSimulation();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, population: { points: POPULATION, moments, modelShape: "skewed two-point distribution", mean: POPULATION_MEAN, standardDeviation: POPULATION_SD }, sampleSize: state.sampleSize, samplingDistributionModel: { mean: POPULATION_MEAN, standardError: analytic.standardError, lowerMean: LOWER_MEAN, upperMean: UPPER_MEAN, lowerZ: analytic.lowerZ, upperZ: analytic.upperZ, normalOrCltProbability: analytic.intervalProbability, probabilityConservationResidual: analytic.conservationResidual, exactWhen: "population observations are normal", approximateWhen: "population is non-normal and the CLT is invoked" }, seededSimulation: { seed: state.sampleSeed, batchNumber: state.seededBatches, sampleCount: SEEDED_SAMPLE_COUNT, empiricalMean: simulation.empiricalMean, empiricalStandardDeviation: simulation.empiricalStandardDeviation, insideCount: simulation.insideCount, empiricalProbability: simulation.empiricalProbability, note: "seeded samples do not determine the analytic curve or answer" }, distinction: "population SD describes X; standard error describes the distribution of X-bar", challenge: { sampleSize: CHALLENGE_SAMPLE_SIZE, standardError: challenge.standardError, probability: challenge.intervalProbability }, stage: state.stage, answer: state.answer, committed: state.committed, hintsUsed: state.hintsUsed, revealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.sampleSize = CHALLENGE_SAMPLE_SIZE; }

  function render() {
    return `<main class="book-shell p221-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · statistics and inference</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p221-spread"><article class="book-page p221-problem-page"><div class="problem-number">Problem 22.1</div><h1 class="book-title p221-title">The Shape Hidden in the Averages</h1><div class="difficulty" aria-label="One star difficulty">★</div><p class="p221-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A population has mean μ=50 and standard deviation σ=12. Independent random samples of size n=64 are taken and their means X̄ recorded.</p><p class="problem-copy">Using the normal sampling model—or the central limit theorem approximation—<strong>find P(47≤X̄≤53).</strong></p><section class="p221-question-card"><strong>State the model</strong><p>The calculation is exact if the population is normal. For a non-normal population, it is a CLT approximation whose quality depends on sample size and population shape.</p></section><section class="p221-given-grid" aria-label="Sampling challenge values"><span>population mean <strong>50</strong></span><span>population SD <strong>12</strong></span><span>sample size <strong>64</strong></span><span>target interval <strong>47 to 53</strong></span></section></article><section class="book-page book-stage p221-stage" aria-labelledby="p221-stage-heading">${stageControlsMarkup()}<div class="p221-stage-heading"><div><span class="eyebrow">Sampling-machine laboratory</span><h2 id="p221-stage-heading">Separate the population from its averages</h2></div><p>Change n and reseed the empirical sample means while the analytic curve remains a distinct model calculation.</p></div>${dynamicMarkup()}${controlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p221-coach"><div class="coach-kicker">Find the model area</div><p class="coach-question">For n=64, enter P(47≤X̄≤53). Decimal or percentage form is accepted.</p><form class="p221-answer-form" data-p221-answer-form novalidate><label for="p221-answer">Interval probability</label><input id="p221-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="0.95450 or 95.45%"/><button class="primary-button" type="submit">Check probability</button></form>${feedbackMarkup()}<div class="button-row p221-help-row"><button class="secondary-button" type="button" data-problem-action="p221-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p221-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p221-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const dynamic = root.querySelector(".p221-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const analytic = currentAnalytic();
    const output = root.querySelector('[data-p221-output="n"]'); if (output) output.textContent = String(state.sampleSize);
    const slider = root.querySelector("[data-p221-sample-size]");
    if (slider) { slider.value = String(state.sampleSize); slider.setAttribute("aria-valuetext", `sample size ${state.sampleSize}; standard error ${format(analytic.standardError, 4)}`); }
    const note = root.querySelector("[data-p221-control-note]"); if (note) note.textContent = `Changing n leaves population SD at 12 and changes SE to ${format(analytic.standardError, 4)}. A new seed changes only the empirical histogram, not the analytic curve.`;
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p221-shell");
    if (!root) return;
    root.addEventListener("input", (event) => {
      if (!event.target.matches("[data-p221-sample-size]")) return;
      state.sampleSize = clamp(Math.round(event.target.value), 1, 144);
      state.feedback = ""; state.committed = false;
      updateLiveDom(root);
    });
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p221-reset") { state = initialState(); renderAndFocus(renderApp, "#p221-sample-size"); return; }
      if (action === "p221-new-batch") { state.sampleSeed = nextRandom(state.sampleSeed).seed; state.seededBatches += 1; updateLiveDom(root); return; }
      if (action === "p221-challenge") { restoreChallenge(); updateLiveDom(root); return; }
      if (action === "p221-stage") { state.stage = clamp(Math.round(control.dataset.p221Stage), 0, 2); renderAndFocus(renderApp, `[data-p221-stage="${state.stage}"]`); return; }
      if (action === "p221-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p221-stage="${state.stage}"]`); return; }
      if (action === "p221-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p221-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
    });
    root.querySelector("#p221-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root.querySelector("[data-p221-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = event.currentTarget.querySelector("#p221-answer")?.value.trim() || "";
      const answer = parseProbability(state.answer);
      const compactAnswer = state.answer.replaceAll(" ", "").replaceAll(",", ".");
      const plainNumber = /^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(compactAnswer) ? Number(compactAnswer) : NaN;
      state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a probability from 0 to 1, or the equivalent percentage from 0% to 100%.";
      else if (Number.isFinite(plainNumber) && Math.abs(plainNumber - challenge.standardError) <= .01) state.feedback = "1.5 is the standard error, measured in the original units. The question asks for the probability inside the interval.";
      else if (Math.abs(answer - .5) <= .01) state.feedback = "The interval is symmetric, but symmetry does not make its central probability one half. Use both Z bounds.";
      else if (Math.abs(answer - challenge.intervalProbability) > .00025) state.feedback = "Compute SE=12/√64, standardise 47 and 53, then find the normal area between the resulting Z scores.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: SE=1.5, the bounds are Z=−2 and Z=2, and the normal/CLT area is approximately 0.95450."; state.committed = true; state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p221-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
