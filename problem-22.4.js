(function registerResultAtTheEdgePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "22.4";
  const NULL_MEAN = 100;
  const KNOWN_SIGMA = 10;
  const SAMPLE_SIZE = 25;
  const CHALLENGE_OBSERVED_MEAN = 104;
  const NULL_SAMPLE_COUNT = 120;
  const NULL_SAMPLE_SEED = 22042026;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Assume H₀", title: "Build the reference distribution under the null", copy: "Assuming H₀:μ=100, the sample mean has null centre 100 and standard error 10/√25=2. A p-value calculation starts inside this hypothetical null model." }),
    Object.freeze({ short: "Mirror", title: "Measure extremeness in both directions", copy: "The observed mean 104 has z=2. For a two-sided test, a mean equally far below 100—namely 96—is just as extreme, so the cutoff is |Z|≥2." }),
    Object.freeze({ short: "Add tails", title: "Combine both at-least-as-extreme tail areas", copy: "Each tail has area P(Z≥2)≈0.0227501. Their sum is p≈0.0455003. This is P(data at least this extreme | H₀), not P(H₀ | data)." }),
  ]);
  const hints = Object.freeze([
    "First find the null standard error: σ/√n=10/√25.",
    "Standardise the observed mean: z=(104−100)/2.",
    "The test is two-sided, so values at or beyond z=−2 count as well as values at or beyond z=2.",
    "One standard-normal tail beyond 2 has area about 0.0227501.",
    "Double the one-tail area: p=2(0.0227501)≈0.0455003, or about 4.55%.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p224-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function erf(value) {
    if (value === 0) return 0;
    const sign = value < 0 ? -1 : 1;
    const x = Math.abs(value);
    const t = 1 / (1 + .5 * x);
    let polynomial = .17087277;
    [-.82215223, 1.48851587, -1.13520398, .27886807, -.18628806, .09678418, .37409196, 1.00002368].forEach((coefficient) => { polynomial = coefficient + t * polynomial; });
    const complement = t * Math.exp(-x * x - 1.26551223 + t * polynomial);
    return sign * (1 - complement);
  }

  function normalCdf(z) { return .5 * (1 + erf(z / Math.sqrt(2))); }

  function testData(observedMean) {
    const standardError = KNOWN_SIGMA / Math.sqrt(SAMPLE_SIZE);
    const effect = observedMean - NULL_MEAN;
    const z = effect / standardError;
    const absoluteZ = Math.abs(z);
    const lowerExtremeMean = NULL_MEAN - Math.abs(effect);
    const upperExtremeMean = NULL_MEAN + Math.abs(effect);
    const oneTailProbability = 1 - normalCdf(absoluteZ);
    const pValue = Math.min(1, 2 * oneTailProbability);
    return {
      observedMean,
      standardError,
      effect,
      standardizedEffectInPopulationSd: effect / KNOWN_SIGMA,
      z,
      absoluteZ,
      lowerExtremeMean,
      upperExtremeMean,
      oneTailProbability,
      leftTailProbability: oneTailProbability,
      rightTailProbability: oneTailProbability,
      pValue,
      symmetryResidual: cleanZero((lowerExtremeMean + upperExtremeMean) / 2 - NULL_MEAN),
      tailSumResidual: cleanZero(pValue - oneTailProbability - oneTailProbability),
    };
  }

  function nextRandom(seed) {
    const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return { seed: nextSeed, value: nextSeed / 4294967296 };
  }

  function seededNullMeans(seed = NULL_SAMPLE_SEED, count = NULL_SAMPLE_COUNT) {
    let currentSeed = seed >>> 0;
    const means = [];
    while (means.length < count) {
      const first = nextRandom(currentSeed); currentSeed = first.seed;
      const second = nextRandom(currentSeed); currentSeed = second.seed;
      const radius = Math.sqrt(-2 * Math.log(Math.max(first.value, Number.EPSILON)));
      const angle = 2 * Math.PI * second.value;
      means.push(NULL_MEAN + 2 * radius * Math.cos(angle));
      if (means.length < count) means.push(NULL_MEAN + 2 * radius * Math.sin(angle));
    }
    return { means, nextSeed: currentSeed };
  }

  const challenge = Object.freeze(testData(CHALLENGE_OBSERVED_MEAN));
  const nullIllustration = Object.freeze(seededNullMeans());

  function initialState() {
    return {
      observedMean: CHALLENGE_OBSERVED_MEAN,
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
  function currentTestData() { return testData(state.observedMean); }

  function parseProbability(raw) {
    const compact = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".");
    const percent = compact.endsWith("%");
    const numeric = percent ? compact.slice(0, -1) : compact;
    if (!/^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(numeric)) return NaN;
    const value = Number(numeric);
    return percent || value > 1 ? value / 100 : value;
  }

  function stageControlsMarkup() {
    return `<div class="p224-stage-controls" role="group" aria-label="Two-sided p-value reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p224-stage" data-p224-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p224-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p224-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Tails combined" : "Next stage"}</button></div>`;
  }

  function xScale(mean) { return 55 + (mean - 90) * 650 / 20; }
  function curveY(mean) { const z = (mean - NULL_MEAN) / challenge.standardError; return 315 - 176 * Math.exp(-.5 * z ** 2); }

  function curvePath(from = 90, to = 110, points = 161) {
    return Array.from({ length: points }, (_, index) => {
      const mean = from + (to - from) * index / (points - 1);
      return `${index ? "L" : "M"}${format(xScale(mean), 3)} ${format(curveY(mean), 3)}`;
    }).join(" ");
  }

  function tailAreaPath(from, to) {
    if (to <= from) return "";
    const curve = curvePath(from, to, 61);
    return `M${format(xScale(from), 3)} 315 ${curve.replace(/^M/, "L")} L${format(xScale(to), 3)} 315 Z`;
  }

  function seededRugMarkup(data) {
    return nullIllustration.means.map((mean, index) => {
      const extreme = mean <= data.lowerExtremeMean || mean >= data.upperExtremeMean;
      const x = clamp(xScale(mean), 55, 705);
      const y = 345 + (index % 3) * 6;
      return `<circle class="p224-seeded-point ${extreme ? "is-extreme" : ""}" cx="${format(x, 3)}" cy="${y}" r="2"/>`;
    }).join("");
  }

  function nullCurveSvg() {
    const data = currentTestData();
    const showZ = state.stage >= 1 || state.revealed;
    const showP = state.stage >= 2 || state.revealed;
    const showMirror = showZ && data.absoluteZ > .025;
    const observedX = xScale(data.observedMean);
    const mirrorMean = 2 * NULL_MEAN - data.observedMean;
    const mirrorX = xScale(mirrorMean);
    const leftTailEnd = clamp(data.lowerExtremeMean, 90, 110);
    const rightTailStart = clamp(data.upperExtremeMean, 90, 110);
    const leftTail = tailAreaPath(90, leftTailEnd);
    const rightTail = tailAreaPath(rightTailStart, 110);
    const seededExtremeCount = nullIllustration.means.filter((mean) => mean <= data.lowerExtremeMean || mean >= data.upperExtremeMean).length;
    const description = `Under the null hypothesis, sample means are modelled as normal with mean ${NULL_MEAN} and standard error ${data.standardError}. The movable observed mean is ${format(data.observedMean, 4)}, giving signed z score ${format(data.z, 5)}. Means at least as extreme lie at or below ${format(data.lowerExtremeMean, 4)} and at or above ${format(data.upperExtremeMean, 4)}. Each analytic tail has probability ${format(data.oneTailProbability, 8)}, so the two-sided p-value is ${format(data.pValue, 8)}. A fixed seeded rug of ${NULL_SAMPLE_COUNT} null means is shown only as an illustration; ${seededExtremeCount} happen to be at least this extreme.`;
    return `<svg class="p224-null-curve p224-stage-${state.stage}" viewBox="0 0 760 410" role="img" aria-labelledby="p224-curve-title p224-curve-desc"><title id="p224-curve-title">Two-sided p-value on the null sampling distribution</title><desc id="p224-curve-desc">${description}</desc><defs><pattern id="p224-tail-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8"/><line x1="0" y1="0" x2="0" y2="8"/></pattern></defs><rect class="p224-board" x="1" y="1" width="758" height="408" rx="20"/><text class="p224-board-kicker" x="22" y="27">ASSUME H₀ · LOCATE THE OBSERVED RESULT · ADD BOTH EXTREME TAILS</text><g class="p224-null-ledger"><rect x="45" y="47" width="205" height="70" rx="11"/><text class="p224-ledger-title" x="59" y="68">NULL SAMPLING MODEL</text><text class="p224-ledger-label" x="59" y="91">centre μ₀</text><text class="p224-ledger-value" x="235" y="91" text-anchor="end">100</text><text class="p224-ledger-label" x="59" y="108">SE=σ/√n</text><text class="p224-ledger-value" x="235" y="108" text-anchor="end">10/5=2</text></g><g class="p224-result-ledger"><rect x="510" y="47" width="205" height="70" rx="11"/><text class="p224-ledger-title" x="524" y="68">OBSERVED RESULT</text><text class="p224-ledger-label" x="524" y="91">x̄=${format(data.observedMean, 1)}</text><text class="p224-ledger-value" x="700" y="91" text-anchor="end">${showZ ? `z=${format(data.z, 3)}` : "stage 2"}</text><text class="p224-ledger-label" x="524" y="108">two-sided p</text><text class="p224-ledger-value" x="700" y="108" text-anchor="end">${showP ? format(data.pValue, 7) : "stage 3"}</text></g><g class="p224-plot">${leftTail ? `<path class="p224-tail-area" d="${leftTail}"/>` : ""}${rightTail ? `<path class="p224-tail-area" d="${rightTail}"/>` : ""}<line class="p224-axis" x1="55" y1="315" x2="705" y2="315"/><path class="p224-null-line" d="${curvePath()}"/><line class="p224-null-centre" x1="${format(xScale(NULL_MEAN), 3)}" y1="132" x2="${format(xScale(NULL_MEAN), 3)}" y2="315"/><text class="p224-centre-label" x="${format(xScale(NULL_MEAN), 3)}" y="128" text-anchor="middle">H₀ centre 100</text>${showMirror ? `<line class="p224-mirror-marker" x1="${format(mirrorX, 3)}" y1="${format(curveY(mirrorMean) - 13, 3)}" x2="${format(mirrorX, 3)}" y2="315"/>` : ""}<line class="p224-observed-marker" x1="${format(observedX, 3)}" y1="${format(curveY(data.observedMean) - 19, 3)}" x2="${format(observedX, 3)}" y2="315"/><circle class="p224-observed-dot" cx="${format(observedX, 3)}" cy="${format(curveY(data.observedMean), 3)}" r="7"/>${showMirror ? `<text class="p224-marker-label is-mirror" x="${format(mirrorX, 3)}" y="${format(Math.max(118, curveY(mirrorMean) - 19), 3)}" text-anchor="middle">${format(mirrorMean, 1)} · z=${format(-data.z, 2)}</text>` : ""}<text class="p224-marker-label is-observed" x="${format(observedX, 3)}" y="${format(Math.max(118, curveY(data.observedMean) - 28), 3)}" text-anchor="middle">observed ${format(data.observedMean, 1)}</text>${showP ? `<text class="p224-tail-label" x="105" y="292" text-anchor="middle">p/2=${format(data.leftTailProbability, 5)}</text><text class="p224-tail-label" x="655" y="292" text-anchor="middle">p/2=${format(data.rightTailProbability, 5)}</text>` : ""}<text class="p224-axis-label" x="55" y="335" text-anchor="start">90</text><text class="p224-axis-label" x="${format(xScale(NULL_MEAN), 3)}" y="335" text-anchor="middle">100</text><text class="p224-axis-label" x="705" y="335" text-anchor="end">110</text><g class="p224-seeded-rug">${seededRugMarkup(data)}</g><text class="p224-rug-label" x="55" y="377">fixed seeded null means · illustration only</text><line class="p224-z-axis" x1="55" y1="385" x2="705" y2="385"/><text class="p224-z-label" x="55" y="401" text-anchor="start">z=−5</text><text class="p224-z-label" x="380" y="401" text-anchor="middle">z=0</text><text class="p224-z-label" x="705" y="401" text-anchor="end">z=5</text></g></svg>`;
  }

  function interpretationMarkup() {
    const data = currentTestData();
    return `<section class="p224-interpretation" aria-label="P-value and effect-size interpretation" aria-live="polite"><article><span>Null-tail probability</span><strong>${state.stage >= 2 || state.revealed ? `p=${format(data.pValue, 6)}` : "stage 3"}</strong><small>P(|Z|≥${format(data.absoluteZ, 3)} | H₀)</small></article><div aria-hidden="true">≠</div><article><span>Not a posterior</span><strong>P(H₀ | data)</strong><small>requires a prior/model comparison; this p-value is not it</small></article><article><span>Observed effect</span><strong>${data.effect >= 0 ? "+" : ""}${format(data.effect, 2)} units</strong><small>${format(Math.abs(data.standardizedEffectInPopulationSd), 3)} population SD · practical meaning needs context</small></article></section>`;
  }

  function significanceMarkup() {
    const data = currentTestData();
    if (state.stage < 2 && !state.revealed) return "";
    return `<div class="p224-significance" role="note"><strong>${data.pValue < .05 ? "Statistically significant at α=0.05." : "Not statistically significant at α=0.05."}</strong> This threshold statement does not tell us whether a ${format(Math.abs(data.effect), 2)}-unit shift is scientifically, clinically or economically important.</div>`;
  }

  function dynamicMarkup() { return `<div class="p224-dynamic">${nullCurveSvg()}${interpretationMarkup()}${significanceMarkup()}</div>`; }

  function controlsMarkup() {
    const data = currentTestData();
    return `<section class="p224-controls" aria-label="Observed mean control"><label for="p224-observed"><span>Observed sample mean x̄ <output data-p224-output="mean">${format(state.observedMean, 1)}</output></span><input id="p224-observed" data-p224-observed type="range" min="90" max="110" step=".1" value="${state.observedMean}" aria-valuetext="observed mean ${format(state.observedMean, 1)}; z score ${format(data.z, 3)}; two-sided p-value ${format(data.pValue, 6)}"/></label><div><button class="chip-button" type="button" data-problem-action="p224-challenge">Restore x̄=104</button></div><p data-p224-control-note>The null curve remains N(100,2²). Moving x̄ changes |z|, the symmetric cutoffs ${format(data.lowerExtremeMean, 1)} and ${format(data.upperExtremeMean, 1)}, and their combined analytic tail area.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p224-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p224-solution" aria-labelledby="p224-solution-heading"><h3 id="p224-solution-heading">The p-value is the sum of two null tails</h3><p>Under H₀:μ=100, with known σ=10 and n=25,</p><div class="p224-solution-equation">SE(X̄)=σ/√n=10/√25=2,<br>z=(104−100)/2=2.</div><p>A two-sided test counts results at least as far from 100 in either direction, so the other cutoff is x̄=96 or z=−2:</p><div class="p224-solution-equation is-answer">p=P(|Z|≥2)<br>=2P(Z≥2)<br>=2(0.0227501)≈<strong>0.0455003 = 4.55003%.</strong></div><p>Interpretation: if H₀ and the sampling model were true, about 4.55% of repeated studies would produce a sample mean at least this far from 100. This is not the probability that H₀ is true. Since p&lt;0.05, the result crosses a conventional 5% significance threshold, but whether a four-unit difference matters in practice is a separate substantive question.</p></section>`;
  }

  function snapshot() {
    const data = currentTestData();
    const seededExtremeCount = nullIllustration.means.filter((mean) => mean <= data.lowerExtremeMean || mean >= data.upperExtremeMean).length;
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, nullHypothesis: { mean: NULL_MEAN, knownPopulationSigma: KNOWN_SIGMA, sampleSize: SAMPLE_SIZE, sampleMeanStandardError: data.standardError, samplingModel: "normal z model under H0" }, observed: { sampleMean: data.observedMean, rawDifference: data.effect, standardizedEffectInPopulationSd: data.standardizedEffectInPopulationSd, z: data.z, absoluteZ: data.absoluteZ }, twoSidedExtremes: { lowerMean: data.lowerExtremeMean, upperMean: data.upperExtremeMean, leftTailProbability: data.leftTailProbability, rightTailProbability: data.rightTailProbability, pValue: data.pValue, symmetryResidual: data.symmetryResidual, tailSumResidual: data.tailSumResidual }, seededIllustration: { seed: NULL_SAMPLE_SEED, count: NULL_SAMPLE_COUNT, extremeCount: seededExtremeCount, empiricalExtremeFraction: seededExtremeCount / NULL_SAMPLE_COUNT, note: "illustration only; analytic p-value is computed from the null normal curve" }, interpretation: { correct: "probability under H0 of a result at least as extreme as observed", incorrect: "probability H0 is true given the data", statisticalSignificanceAtFivePercent: data.pValue < .05, practicalImportance: "not determined by p-value" }, challenge: { observedMean: CHALLENGE_OBSERVED_MEAN, z: challenge.z, twoSidedPValue: challenge.pValue }, stage: state.stage, answer: state.answer, committed: state.committed, hintsUsed: state.hintsUsed, revealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.observedMean = CHALLENGE_OBSERVED_MEAN; }

  function render() {
    return `<main class="book-shell p224-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · statistics and inference</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p224-spread"><article class="book-page p224-problem-page"><div class="problem-number">Problem 22.4</div><h1 class="book-title p224-title">A Result at the Edge</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p224-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A two-sided z-test uses H₀:μ=100, known population σ=10 and sample size n=25. The observed sample mean is x̄=104.</p><p class="problem-copy"><strong>What is the two-sided p-value?</strong></p><section class="p224-question-card"><strong>Condition in the right direction</strong><p>A p-value asks how often data this extreme would occur assuming H₀. It is not the probability that H₀ is true after seeing the data.</p></section><section class="p224-given-grid" aria-label="Hypothesis-test values"><span>null mean <strong>100</strong></span><span>known σ <strong>10</strong></span><span>sample size <strong>25</strong></span><span>observed mean <strong>104</strong></span></section></article><section class="book-page book-stage p224-stage" aria-labelledby="p224-stage-heading">${stageControlsMarkup()}<div class="p224-stage-heading"><div><span class="eyebrow">Null-tail laboratory</span><h2 id="p224-stage-heading">Move the result and watch both tails respond</h2></div><p>The reference curve stays fixed under H₀. The observed marker sets two symmetric “at least this extreme” regions.</p></div>${dynamicMarkup()}${controlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p224-coach"><div class="coach-kicker">Add both tails</div><p class="coach-question">For x̄=104, enter the two-sided p-value. Decimal or percentage form is accepted.</p><form class="p224-answer-form" data-p224-answer-form novalidate><label for="p224-answer">Two-sided p-value</label><input id="p224-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="0.0455003 or 4.55003%"/><button class="primary-button" type="submit">Check p-value</button></form>${feedbackMarkup()}<div class="button-row p224-help-row"><button class="secondary-button" type="button" data-problem-action="p224-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p224-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p224-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const dynamic = root.querySelector(".p224-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const data = currentTestData();
    const output = root.querySelector('[data-p224-output="mean"]'); if (output) output.textContent = format(state.observedMean, 1);
    const slider = root.querySelector("[data-p224-observed]");
    if (slider) { slider.value = String(state.observedMean); slider.setAttribute("aria-valuetext", `observed mean ${format(state.observedMean, 1)}; z score ${format(data.z, 3)}; two-sided p-value ${format(data.pValue, 6)}`); }
    const note = root.querySelector("[data-p224-control-note]"); if (note) note.textContent = `The null curve remains N(100,2²). Moving x̄ changes |z|, the symmetric cutoffs ${format(data.lowerExtremeMean, 1)} and ${format(data.upperExtremeMean, 1)}, and their combined analytic tail area.`;
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p224-shell");
    if (!root) return;
    root.addEventListener("input", (event) => {
      if (!event.target.matches("[data-p224-observed]")) return;
      state.observedMean = clamp(Number(event.target.value), 90, 110);
      state.feedback = ""; state.committed = false;
      updateLiveDom(root);
    });
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p224-reset") { state = initialState(); renderAndFocus(renderApp, "#p224-observed"); return; }
      if (action === "p224-challenge") { restoreChallenge(); updateLiveDom(root); return; }
      if (action === "p224-stage") { state.stage = clamp(Math.round(control.dataset.p224Stage), 0, 2); renderAndFocus(renderApp, `[data-p224-stage="${state.stage}"]`); return; }
      if (action === "p224-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p224-stage="${state.stage}"]`); return; }
      if (action === "p224-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p224-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
    });
    root.querySelector("#p224-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root.querySelector("[data-p224-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = event.currentTarget.querySelector("#p224-answer")?.value.trim() || "";
      const answer = parseProbability(state.answer);
      const compactAnswer = state.answer.replaceAll(" ", "").replaceAll(",", ".");
      const plainNumber = /^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(compactAnswer) ? Number(compactAnswer) : NaN;
      state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a probability from 0 to 1, or the equivalent percentage from 0% to 100%.";
      else if (Number.isFinite(plainNumber) && Math.abs(plainNumber - challenge.z) <= .01) state.feedback = "2 is the z score, not a probability. Convert that extremeness into tail area.";
      else if (Math.abs(answer - challenge.oneTailProbability) <= .0002) state.feedback = "That is one tail beyond z=2. A two-sided p-value also includes the symmetric tail below z=−2.";
      else if (Math.abs(answer - (1 - challenge.pValue)) <= .0002) state.feedback = "That is the central probability between −2 and 2. The p-value is the complementary area in both tails.";
      else if (Math.abs(answer - challenge.pValue) > .00015) state.feedback = "Find z=(104−100)/(10/√25), then double the standard-normal upper-tail area beyond |z|.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: z=2 and p=2P(Z≥2)≈0.0455003, or 4.55003%."; state.committed = true; state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p224-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
