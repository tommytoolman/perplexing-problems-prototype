(function registerBeliefAfterTenTossesPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "22.5";
  const PRIOR_ALPHA = 2;
  const PRIOR_BETA = 2;
  const CHALLENGE_HEADS = 8;
  const CHALLENGE_TAILS = 2;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Prior", title: "State the assumption before seeing the tosses", copy: "Beta(2,2) is a symmetric prior density over the unknown coin parameter p. It is a modelling choice—not information supplied by the ten observations." }),
    Object.freeze({ short: "Update", title: "Add head and tail counts to the Beta parameters", copy: "The binomial likelihood contributes pʰ(1−p)ᵗ. Conjugacy gives p|data ~ Beta(2+h,2+t), a normalized distribution over possible parameter values." }),
    Object.freeze({ short: "Predict", title: "Average the next event over posterior uncertainty", copy: "The probability of a head on the next toss is the posterior mean E[p|data]=α/(α+β). This predictive event probability is not the posterior mode." }),
  ]);
  const hints = Object.freeze([
    "A Beta prior updates by adding heads to α and tails to β.",
    "Beta(2,2) with 8 heads and 2 tails becomes Beta(10,4).",
    "The posterior-predictive probability of a head is the posterior mean α/(α+β).",
    "Substitute the updated parameters: 10/(10+4)=10/14.",
    "Simplify 10/14 to 5/7. The posterior mode is instead (10−1)/(10+4−2)=3/4.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p225-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 5) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseProbability(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", "."); const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/); if (fraction) { const denominator = Number(fraction[2]); return denominator === 0 ? NaN : Number(fraction[1]) / denominator; } return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN; }

  function logGamma(value) {
    const coefficients = [676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
    if (value < .5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
    let shifted = value - 1, series = .9999999999998099; coefficients.forEach((coefficient, index) => { series += coefficient / (shifted + index + 1); }); const base = shifted + coefficients.length - .5;
    return .5 * Math.log(2 * Math.PI) + (shifted + .5) * Math.log(base) - base + Math.log(series);
  }
  function logBeta(alpha, beta) { return logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta); }
  function betaDensity(p, alpha, beta) { if (p <= 0 || p >= 1) return 0; return Math.exp((alpha - 1) * Math.log(p) + (beta - 1) * Math.log1p(-p) - logBeta(alpha, beta)); }
  function betaMode(alpha, beta) { return alpha > 1 && beta > 1 ? (alpha - 1) / (alpha + beta - 2) : NaN; }
  function likelihoodMode(heads, tails) { if (heads + tails === 0) return .5; if (heads === 0) return 0; if (tails === 0) return 1; return heads / (heads + tails); }
  function relativeLikelihood(p, heads, tails) {
    if (heads + tails === 0) return 1; const mode = likelihoodMode(heads, tails);
    const logAt = (value) => (heads ? heads * Math.log(value) : 0) + (tails ? tails * Math.log1p(-value) : 0);
    if ((p === 0 && heads) || (p === 1 && tails)) return 0;
    const safeP = clamp(p, Number.EPSILON, 1 - Number.EPSILON), safeMode = clamp(mode, Number.EPSILON, 1 - Number.EPSILON);
    return Math.exp(logAt(safeP) - logAt(safeMode));
  }
  function midpointIntegral(alpha, beta, slices = 2000) { let total = 0; for (let index = 0; index < slices; index += 1) total += betaDensity((index + .5) / slices, alpha, beta) / slices; return total; }

  function beliefData(heads = CHALLENGE_HEADS, tails = CHALLENGE_TAILS) {
    const posteriorAlpha = PRIOR_ALPHA + heads, posteriorBeta = PRIOR_BETA + tails, predictiveHead = posteriorAlpha / (posteriorAlpha + posteriorBeta), predictiveTail = 1 - predictiveHead;
    return { heads, tails, tosses: heads + tails, priorAlpha: PRIOR_ALPHA, priorBeta: PRIOR_BETA, posteriorAlpha, posteriorBeta, posteriorMean: predictiveHead, posteriorMode: betaMode(posteriorAlpha, posteriorBeta), predictiveHead, predictiveTail, likelihoodMode: likelihoodMode(heads, tails), priorMode: betaMode(PRIOR_ALPHA, PRIOR_BETA), sampleHeadRate: heads + tails ? heads / (heads + tails) : NaN, priorIntegral: midpointIntegral(PRIOR_ALPHA, PRIOR_BETA, 1000), posteriorIntegral: midpointIntegral(posteriorAlpha, posteriorBeta, 1000) };
  }

  const CHALLENGE = Object.freeze(beliefData());
  function initialState() { return { heads: CHALLENGE_HEADS, tails: CHALLENGE_TAILS, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();
  function currentData() { return beliefData(state.heads, state.tails); }
  function restoreChallenge() { state.heads = CHALLENGE_HEADS; state.tails = CHALLENGE_TAILS; }

  function stageControlsMarkup() { return `<div class="p225-stage-controls" role="group" aria-label="Bayesian updating stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p225-stage" data-p225-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p225-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p225-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Prediction separated" : "Next stage"}</button></div>`; }

  function densityPath(fn, mapX, mapY, close = false) { const points = Array.from({ length: 161 }, (_, index) => { const p = index / 160; return `${index ? "L" : "M"}${format(mapX(p), 3)} ${format(mapY(fn(p)), 3)}`; }).join(""); return close ? `${points}L${format(mapX(1), 3)} ${format(mapY(0), 3)}L${format(mapX(0), 3)} ${format(mapY(0), 3)}Z` : points; }

  function beliefSvg() {
    const data = currentData(), priorPeak = betaDensity(data.priorMode, data.priorAlpha, data.priorBeta), posteriorPeak = betaDensity(data.posteriorMode, data.posteriorAlpha, data.posteriorBeta), yMaximum = Math.max(priorPeak, posteriorPeak) * 1.14;
    const mapX = (p) => 56 + 450 * p, mapY = (density) => 365 - density / yMaximum * 276, likelihoodHeight = yMaximum * .72;
    const showPosterior = state.stage >= 1 || state.revealed, showPredictive = state.stage >= 2 || state.revealed;
    const priorPath = densityPath((p) => betaDensity(p, data.priorAlpha, data.priorBeta), mapX, mapY), posteriorArea = densityPath((p) => betaDensity(p, data.posteriorAlpha, data.posteriorBeta), mapX, mapY, true), posteriorPath = densityPath((p) => betaDensity(p, data.posteriorAlpha, data.posteriorBeta), mapX, mapY), likelihoodPath = densityPath((p) => relativeLikelihood(p, data.heads, data.tails) * likelihoodHeight, mapX, mapY);
    const description = `The labelled prior assumption is Beta 2, 2. Data contain ${data.heads} heads and ${data.tails} tails. The likelihood shape peaks at ${format(data.likelihoodMode, 5)} and is shown with arbitrary vertical scale. The normalized posterior is Beta ${data.posteriorAlpha}, ${data.posteriorBeta}, with mean ${format(data.posteriorMean, 7)} and mode ${format(data.posteriorMode, 7)}. The posterior-predictive probability of a head next is ${format(data.predictiveHead, 7)} and of a tail is ${format(data.predictiveTail, 7)}.`;
    return `<svg class="p225-belief p225-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p225-belief-title p225-belief-desc"><title id="p225-belief-title">Beta prior, likelihood, posterior and next-toss prediction</title><desc id="p225-belief-desc">${description}</desc><defs><linearGradient id="p225-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172d3b"/><stop offset="1" stop-color="#30283e"/></linearGradient><linearGradient id="p225-posterior-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d9fa1" stop-opacity=".42"/><stop offset="1" stop-color="#4d9fa1" stop-opacity=".04"/></linearGradient><clipPath id="p225-density-clip"><rect x="45" y="73" width="472" height="301" rx="10"/></clipPath></defs><rect class="p225-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p225-board-kicker" x="23" y="28">PARAMETER DENSITIES AT LEFT · NEXT OBSERVATION PREDICTION AT RIGHT</text><g class="p225-density-panel"><rect x="20" y="44" width="516" height="355" rx="15"/><text class="p225-panel-title" x="37" y="68">BELIEF ABOUT THE UNKNOWN COIN PARAMETER p</text><g class="p225-density-grid">${[0,.25,.5,.75,1].map((p) => `<line x1="${mapX(p)}" y1="81" x2="${mapX(p)}" y2="365"/>`).join("")}</g><line class="p225-axis" x1="56" y1="365" x2="506" y2="365"/>${[0,.25,.5,.75,1].map((p) => `<line class="p225-axis-tick" x1="${mapX(p)}" y1="365" x2="${mapX(p)}" y2="371"/><text class="p225-axis-label" x="${mapX(p)}" y="383" text-anchor="middle">${format(p, 2)}</text>`).join("")}<text class="p225-axis-title" x="506" y="391" text-anchor="end">possible value of p</text><g clip-path="url(#p225-density-clip)"><path class="p225-posterior-area" d="${posteriorArea}"/><path class="p225-prior-curve" d="${priorPath}"/><path class="p225-likelihood-curve" d="${likelihoodPath}"/><path class="p225-posterior-curve" d="${posteriorPath}"/><line class="p225-mean-line" x1="${mapX(data.posteriorMean)}" y1="83" x2="${mapX(data.posteriorMean)}" y2="365"/><line class="p225-mode-line" x1="${mapX(data.posteriorMode)}" y1="83" x2="${mapX(data.posteriorMode)}" y2="365"/></g><g class="p225-legend"><line class="p225-prior-curve" x1="68" y1="94" x2="96" y2="94"/><text x="103" y="97">prior Beta(2,2) · assumption</text><line class="p225-likelihood-curve" x1="68" y1="111" x2="96" y2="111"/><text x="103" y="114">likelihood p${data.heads}(1−p)${data.tails} · scaled shape</text><line class="p225-posterior-curve" x1="68" y1="128" x2="96" y2="128"/><text x="103" y="131">posterior Beta(${data.posteriorAlpha},${data.posteriorBeta}) · normalized</text></g><text class="p225-location-label is-mean" x="${mapX(data.posteriorMean) - 5}" y="153" text-anchor="end">mean ${format(data.posteriorMean, 4)}</text><text class="p225-location-label is-mode" x="${mapX(data.posteriorMode) + 5}" y="170">MAP ${format(data.posteriorMode, 4)}</text><text class="p225-scale-note" x="506" y="79" text-anchor="end">density vertical scale adapts · likelihood scale is arbitrary</text></g><g class="p225-predictive-panel"><rect x="551" y="44" width="189" height="355" rx="15"/><text class="p225-panel-title" x="568" y="68">NEXT TOSS</text><circle class="p225-coin" cx="646" cy="115" r="31"/><text class="p225-coin-letter" x="646" y="122" text-anchor="middle">?</text><text class="p225-predictive-kicker" x="568" y="167">POSTERIOR PREDICTIVE</text><text class="p225-predictive-label" x="568" y="198">HEAD</text><text class="p225-predictive-value is-head" x="723" y="198" text-anchor="end">${showPredictive ? format(data.predictiveHead, 6) : "stage 3"}</text><rect class="p225-predictive-track" x="568" y="209" width="155" height="24" rx="6"/><rect class="p225-predictive-fill is-head" x="568" y="209" width="${format(155 * data.predictiveHead, 3)}" height="24" rx="6"/><text class="p225-predictive-label" x="568" y="261">TAIL</text><text class="p225-predictive-value is-tail" x="723" y="261" text-anchor="end">${showPredictive ? format(data.predictiveTail, 6) : "stage 3"}</text><rect class="p225-predictive-track" x="568" y="272" width="155" height="24" rx="6"/><rect class="p225-predictive-fill is-tail" x="568" y="272" width="${format(155 * data.predictiveTail, 3)}" height="24" rx="6"/><line class="p225-predictive-rule" x1="568" y1="320" x2="723" y2="320"/><text class="p225-predictive-formula" x="568" y="342">${showPredictive ? `P(H next)=E[p|data]` : "predict at stage 3"}</text><text class="p225-predictive-formula is-result" x="723" y="365" text-anchor="end">${showPredictive ? `${data.posteriorAlpha}/${data.posteriorAlpha + data.posteriorBeta} = ${format(data.predictiveHead, 6)}` : "—"}</text><text class="p225-predictive-note" x="568" y="386">${showPosterior ? `MAP=${format(data.posteriorMode, 4)} is a parameter estimate` : "posterior at stage 2"}</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p225-controls" aria-label="Observed head and tail count controls"><div class="p225-slider-grid"><label for="p225-heads"><span>Observed heads <output>${state.heads}</output></span><input id="p225-heads" type="range" min="0" max="20" step="1" value="${state.heads}" aria-valuetext="${state.heads} heads; posterior alpha ${data.posteriorAlpha}; predictive head probability ${format(data.predictiveHead, 6)}"/></label><label for="p225-tails"><span>Observed tails <output>${state.tails}</output></span><input id="p225-tails" type="range" min="0" max="20" step="1" value="${state.tails}" aria-valuetext="${state.tails} tails; posterior beta ${data.posteriorBeta}; predictive head probability ${format(data.predictiveHead, 6)}"/></label></div><div class="p225-count-buttons"><button class="secondary-button" type="button" data-problem-action="p225-preset" data-p225-preset="prior">No data</button><button class="secondary-button" type="button" data-problem-action="p225-preset" data-p225-preset="balanced">5 H · 5 T</button><button class="primary-button" type="button" data-problem-action="p225-preset" data-p225-preset="challenge">8 H · 2 T challenge</button></div><p><strong>Prior assumption stays Beta(2,2).</strong> Moving the sliders changes the observed likelihood and therefore the normalized posterior and next-toss prediction.</p></section>`;
  }

  function metricsMarkup() { const data = currentData(); return `<section class="p225-metrics" aria-live="polite"><article><span>Posterior</span><strong>Beta(${data.posteriorAlpha}, ${data.posteriorBeta})</strong><small>add observed counts</small></article><article><span>Predictive P(next H)</span><strong>${format(data.predictiveHead, 6)}</strong><small>posterior mean</small></article><article><span>Posterior MAP</span><strong>${format(data.posteriorMode, 6)}</strong><small>density's most likely p</small></article></section>`; }
  function distinctionMarkup() { return `<section class="p225-distinction"><strong>A parameter distribution and a future event probability answer different questions.</strong><span>The posterior density describes uncertainty about p. The predictive probability averages the Bernoulli chance p over that density. The MAP selects one p-value; it does not by itself perform that averaging.</span></section>`; }
  function dynamicMarkup() { return `<div class="p225-dynamic">${beliefSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p225-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p225-solution" aria-labelledby="p225-solution-heading"><h3 id="p225-solution-heading" tabindex="-1">Conjugacy turns counts into updated Beta parameters</h3><p>The prior assumption is p ~ Beta(2,2), with density proportional to p(1−p). Eight heads and two tails supply likelihood</p><div class="p225-equation">L(p) ∝ p⁸(1−p)².</div><p>Multiply prior and likelihood powers:</p><div class="p225-equation">posterior ∝ p¹⁺⁸(1−p)¹⁺²<br>=p⁹(1−p)³,<br>so p|data ~ <strong>Beta(10,4).</strong></div><p>The posterior-predictive chance of a head is the posterior mean:</p><div class="p225-equation is-answer">P(next toss is H | data)<br>=E[p|data]=10/(10+4)<br>=<strong>5/7≈0.714286.</strong></div><p>The posterior mode is a different summary:</p><div class="p225-equation">MAP=(10−1)/(10+4−2)=9/12=<strong>3/4.</strong></div><p>Thus 3/4 is the single p-value at the posterior density peak, while 5/7 averages the next-head probability across all posterior values of p. Both results also depend on the explicitly chosen Beta(2,2) prior.</p></section>`;
  }

  function snapshot() {
    const data = currentData();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "Bernoulli tosses conditionally independent given fixed p", priorAssumption: { family: "Beta", alpha: PRIOR_ALPHA, beta: PRIOR_BETA, density: "6p(1-p)", normalizationIntegralApproximation: data.priorIntegral }, observedData: { heads: data.heads, tails: data.tails, tosses: data.tosses, sampleHeadRate: Number.isFinite(data.sampleHeadRate) ? data.sampleHeadRate : null }, likelihood: { kernel: `p^${data.heads}(1-p)^${data.tails}`, mode: data.likelihoodMode, visualScale: "arbitrary; maximum rescaled to 72% of density plot height" }, posterior: { family: "Beta", alpha: data.posteriorAlpha, beta: data.posteriorBeta, mean: data.posteriorMean, modeMAP: data.posteriorMode, normalizationIntegralApproximation: data.posteriorIntegral }, posteriorPredictive: { nextHead: data.predictiveHead, nextTail: data.predictiveTail, sumResidual: data.predictiveHead + data.predictiveTail - 1, interpretation: "event probability obtained by averaging p over posterior" }, distinction: "posterior density is over parameter p; posterior-predictive probability is for the next observable event; MAP is one parameter estimate", challenge: { prior: "Beta(2,2)", heads: CHALLENGE_HEADS, tails: CHALLENGE_TAILS, posterior: "Beta(10,4)", nextHeadExact: "5/7", nextHeadDecimal: CHALLENGE.predictiveHead, mapExact: "3/4", mapDecimal: CHALLENGE.posteriorMode }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p225-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Statistics and Inference</strong><span class="eyebrow">Chapter 22 · Bayesian updating</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p225-spread"><article class="book-page p225-problem-page"><div class="problem-number">Problem 22.5</div><h1 class="book-title p225-title">Belief After Ten Tosses</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p225-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Assume the unknown head probability has prior p ~ Beta(2,2). Then observe 8 heads and 2 tails.</p><p class="problem-copy"><strong>What is the posterior-predictive probability that the next toss is a head?</strong></p><section class="p225-prior-card"><strong>Prior assumption</strong><p>Beta(2,2) is supplied as part of the model. A different prior would generally produce a different posterior and prediction.</p></section><section class="p225-given-grid" aria-label="Bayesian coin challenge"><span>prior <strong>Beta(2,2)</strong></span><span>heads <strong>8</strong></span><span>tails <strong>2</strong></span><span>predict <strong>next H</strong></span></section></article><section class="book-page book-stage p225-stage" aria-labelledby="p225-stage-heading">${stageControlsMarkup()}<div class="p225-stage-heading"><div><span class="eyebrow">Bayesian belief laboratory</span><h2 id="p225-stage-heading">Update a parameter, then predict an event</h2></div><p>Move the count sliders to inspect conjugate updating while the prior assumption remains visible.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p225-coach"><div class="coach-kicker">Predict one more toss</div><p class="coach-question">For the fixed 8-head, 2-tail challenge, enter P(next toss is a head).</p><form class="p225-answer-form" data-p225-answer-form novalidate><label for="p225-answer">Posterior-predictive probability</label><input id="p225-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal"/><small>Fractions such as 5/7 are accepted.</small><button class="primary-button" type="submit">Check prediction</button></form>${feedbackMarkup()}<div class="button-row p225-help-row"><button class="secondary-button" type="button" data-problem-action="p225-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p225-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p225-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) { if (!active) return ""; if (active.id) return `#${active.id}`; if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`; return ""; }
  function updateDynamicDom() {
    const root = document.querySelector(".p225-shell"); if (!root) return; const dynamic = root.querySelector(".p225-dynamic"), selector = dynamic?.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup(); root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) { const replacement = root.querySelector(selector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p225-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return; const action = control.dataset.problemAction;
      if (action === "p225-reset") { state = initialState(); renderAndFocus(renderApp, "#p225-heads"); return; }
      if (action === "p225-stage") { state.stage = clamp(Number(control.dataset.p225Stage), 0, 2); renderAndFocus(renderApp, `[data-p225-stage="${state.stage}"]`); return; }
      if (action === "p225-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p225-stage="${state.stage}"]`); return; }
      if (action === "p225-preset") { if (control.dataset.p225Preset === "prior") { state.heads = 0; state.tails = 0; } else if (control.dataset.p225Preset === "balanced") { state.heads = 5; state.tails = 5; } else restoreChallenge(); updateDynamicDom(); return; }
      if (action === "p225-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p225-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p225-reveal") window.requestAnimationFrame(() => document.querySelector("#p225-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p225-heads")) { state.heads = clamp(Math.round(Number(event.target.value)), 0, 20); updateDynamicDom(); return; }
      if (event.target.matches("#p225-tails")) { state.tails = clamp(Math.round(Number(event.target.value)), 0, 20); updateDynamicDom(); return; }
      if (event.target.matches("#p225-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root?.querySelector("[data-p225-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p225-answer")?.value || "", answer = parseProbability(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a probability between 0 and 1, as a fraction or decimal.";
      else if (Math.abs(answer - CHALLENGE.posteriorMode) < .001) state.feedback = "3/4 is the posterior mode (MAP), the peak parameter value. The predictive probability uses the posterior mean.";
      else if (Math.abs(answer - CHALLENGE.sampleHeadRate) < .001) state.feedback = "4/5 is the raw sample proportion. Include the Beta(2,2) prior through the updated parameters.";
      else if (Math.abs(answer - CHALLENGE.predictiveHead) > .0005) state.feedback = "Update to Beta(10,4), then use its mean 10/(10+4).";
      else { state.feedbackTone = "success"; state.feedback = "Correct: P(next H|data)=10/14=5/7≈0.714286."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p225-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
