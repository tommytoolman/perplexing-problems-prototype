(function registerCoinLikelihoodPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "22.3";
  const HEADS = 7;
  const TAILS = 3;
  const TOSSES = HEADS + TAILS;
  const MLE = HEADS / TOSSES;
  const BINOMIAL_MULTIPLIER = 120;
  const ANSWER_TOLERANCE = .005;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Fix data", title: "Hold the ten observed tosses fixed", copy: "The tally is seven heads and three tails. Once observed, these outcomes are fixed; the adjustable object is the candidate head probability p." }),
    Object.freeze({ short: "Vary p", title: "Read likelihood as a function of p", copy: "Each head contributes a factor p and each tail contributes 1−p, so L(p)=p⁷(1−p)³. Curve height compares how well different parameter values support the same data." }),
    Object.freeze({ short: "Maximise", title: "Find the parameter at the curve’s peak", copy: "Differentiate the log-likelihood. The score 7/p−3/(1−p) is zero at p=7/10, and the negative second derivative confirms a maximum." }),
  ]);
  const hints = Object.freeze([
    "The data contain seven head factors and three tail factors.",
    "Ignoring constants that do not depend on p, L(p)=p⁷(1−p)³.",
    "Take logs: ℓ(p)=7 log p+3 log(1−p).",
    "Differentiate and set the score to zero: 7/p−3/(1−p)=0.",
    "Rearrange 7(1−p)=3p to obtain p=7/10.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p223-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 6) { if (!Number.isFinite(value)) return value === Infinity ? "+∞" : value === -Infinity ? "−∞" : "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function svgNumber(value, digits = 3) { return Number(value.toFixed(digits)); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseParameter(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", "."); if (!normalized) return NaN; const part = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/); if (part) { const denominator = Number(part[2]); return denominator ? Number(part[1]) / denominator : NaN; } if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?%?$/i.test(normalized)) return NaN; const value = Number(normalized.replace("%", "")); return normalized.includes("%") || Math.abs(value) > 1 ? value / 100 : value; }

  function likelihoodAt(pInput) { const p = clamp(pInput, 0, 1); return p ** HEADS * (1 - p) ** TAILS; }
  const MAX_LIKELIHOOD = likelihoodAt(MLE);
  function likelihoodData(pInput) {
    const p = clamp(pInput, 0, 1), likelihood = likelihoodAt(p), relativeLikelihood = likelihood / MAX_LIKELIHOOD;
    const logLikelihood = p === 0 || p === 1 ? -Infinity : HEADS * Math.log(p) + TAILS * Math.log(1 - p);
    const score = p === 0 ? Infinity : p === 1 ? -Infinity : HEADS / p - TAILS / (1 - p);
    const secondDerivative = p === 0 || p === 1 ? -Infinity : -HEADS / p ** 2 - TAILS / (1 - p) ** 2;
    return { p, likelihood, countProbability: BINOMIAL_MULTIPLIER * likelihood, relativeLikelihood, logLikelihood, score, secondDerivative, distanceFromMle: p - MLE };
  }

  const MLE_DATA = Object.freeze(likelihoodData(MLE));
  function initialState() { return { selectedP: .5, pinnedP: .6, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false, boardMessage: "The data stay fixed at seven heads and three tails while p moves. At p=0.50 the relative likelihood is about 0.439 of the peak." }; }
  let state = initialState();
  function selectedData() { return likelihoodData(state.selectedP); }
  function pinnedData() { return state.pinnedP === null ? null : likelihoodData(state.pinnedP); }
  function restoreChallengeResult() { state.selectedP = MLE; state.pinnedP = .5; state.boardMessage = "At p=0.70 the score is zero and the likelihood reaches its unique interior maximum."; }

  function stageControlsMarkup() { return `<div class="p223-stage-controls" role="group" aria-label="Maximum-likelihood reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p223-stage" data-p223-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p223-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p223-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Peak identified" : "Next stage"}</button></div>`; }

  function likelihoodCurvePath() {
    return Array.from({ length: 201 }, (_, index) => { const p = index / 200, relative = likelihoodAt(p) / MAX_LIKELIHOOD, x = 62 + 640 * p, y = 382 - 176 * relative; return `${index ? "L" : "M"}${svgNumber(x)} ${svgNumber(y)}`; }).join("");
  }

  function tallyMarkup() {
    return Array.from({ length: TOSSES }, (_, index) => { const head = index < HEADS, x = 66 + index * 56; return `<g class="p223-toss ${head ? "is-head" : "is-tail"}"><circle cx="${x}" cy="86" r="20"/><text x="${x}" y="91" text-anchor="middle">${head ? "H" : "T"}</text><text class="p223-factor" x="${x}" y="119" text-anchor="middle">${head ? "×p" : "×(1−p)"}</text></g>`; }).join("");
  }

  function likelihoodSvg() {
    const data = selectedData(), pinned = pinnedData(), mapX = (p) => 62 + 640 * p, mapY = (relative) => 382 - 176 * relative, selectedX = mapX(data.p), selectedY = mapY(data.relativeLikelihood), mleX = mapX(MLE), mleY = mapY(1);
    const xTicks = [0,.2,.4,.6,.8,1].map((p) => { const x = mapX(p); return `<g class="p223-tick"><line x1="${x}" y1="382" x2="${x}" y2="389"/><text x="${x}" y="403" text-anchor="middle">${format(p, 1)}</text></g>`; }).join("");
    const yTicks = [0,.25,.5,.75,1].map((relative) => { const y = mapY(relative); return `<g class="p223-grid"><line x1="62" y1="${y}" x2="702" y2="${y}"/><text x="52" y="${y + 3}" text-anchor="end">${format(relative, 2)}</text></g>`; }).join("");
    const pinnedMarkup = pinned ? `<g class="p223-pinned"><line x1="${svgNumber(mapX(pinned.p))}" y1="${svgNumber(mapY(pinned.relativeLikelihood))}" x2="${svgNumber(mapX(pinned.p))}" y2="382"/><circle cx="${svgNumber(mapX(pinned.p))}" cy="${svgNumber(mapY(pinned.relativeLikelihood))}" r="6"/><text x="${svgNumber(clamp(mapX(pinned.p), 110, 645))}" y="${svgNumber(mapY(pinned.relativeLikelihood) + 22)}" text-anchor="middle">pinned p=${format(pinned.p, 2)} · rel ${format(pinned.relativeLikelihood, 3)}</text></g>` : "";
    const showCurve = state.stage >= 1 || state.revealed, showMaximum = state.stage >= 2 || state.revealed;
    const description = `Ten fixed independent coin tosses contain seven heads and three tails. The selected candidate probability is ${format(data.p, 3)}. Its sequence likelihood p to the seventh times one minus p cubed is ${format(data.likelihood, 10)}, or relative likelihood ${format(data.relativeLikelihood, 6)} compared with the maximum. The curve reaches its maximum at p equals 0.7, where likelihood is ${format(MAX_LIKELIHOOD, 10)}. ${pinned ? `A pinned comparison at p ${format(pinned.p, 3)} has relative likelihood ${format(pinned.relativeLikelihood, 6)}.` : "No comparison point is pinned."}`;
    return `<svg class="p223-likelihood p223-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p223-svg-title p223-svg-desc"><title id="p223-svg-title">Likelihood curve for seven heads and three tails</title><desc id="p223-svg-desc">${description}</desc><defs><linearGradient id="p223-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#322a42"/></linearGradient></defs><rect class="p223-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p223-board-kicker" x="24" y="27">FIXED DATA · 7 HEADS · 3 TAILS · VARY THE PARAMETER p</text><g class="p223-tally">${tallyMarkup()}<text class="p223-product" x="694" y="120" text-anchor="end">L(p)=p⁷(1−p)³</text></g><g class="p223-curve-group ${showCurve ? "is-visible" : ""}"><text class="p223-chart-title" x="62" y="163">RELATIVE LIKELIHOOD · L(p) / L(0.70)</text>${yTicks}${xTicks}<path class="p223-curve" d="${likelihoodCurvePath()}"/>${pinnedMarkup}<line class="p223-selected-guide" x1="${svgNumber(selectedX)}" y1="${svgNumber(selectedY)}" x2="${svgNumber(selectedX)}" y2="382"/><circle class="p223-selected-point" cx="${svgNumber(selectedX)}" cy="${svgNumber(selectedY)}" r="8"/><text class="p223-selected-label" x="${svgNumber(clamp(selectedX, 115, 645))}" y="${svgNumber(Math.max(189, selectedY - 14))}" text-anchor="middle">p=${format(data.p, 2)} · relative ${format(data.relativeLikelihood, 4)}</text><text class="p223-axis-label" x="702" y="420" text-anchor="end">candidate head probability p</text></g><g class="p223-maximum ${showMaximum ? "is-visible" : ""}"><line x1="${mleX}" y1="${mleY}" x2="${mleX}" y2="382"/><path d="M${mleX} ${mleY - 13}l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/><text x="${mleX + 16}" y="${mleY - 5}">maximum · p̂=7/10</text><rect x="62" y="165" width="221" height="63" rx="10"/><text class="p223-score-kicker" x="77" y="185">SCORE AT THE PEAK</text><text class="p223-score" x="77" y="209">7/p − 3/(1−p) = 0</text><text class="p223-score-value" x="267" y="219" text-anchor="end">p=0.70</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = selectedData(), pinned = pinnedData(), ratioToPinned = pinned && pinned.likelihood ? data.likelihood / pinned.likelihood : null;
    return `<section class="p223-controls" aria-label="Candidate coin probability and comparison controls"><label for="p223-p"><span>Candidate head probability p <output data-p223-output="p">${format(state.selectedP, 2)}</output></span><input id="p223-p" type="range" min="0" max="1" step="0.01" value="${state.selectedP}" aria-valuetext="Candidate p ${format(data.p, 2)}; likelihood ${format(data.likelihood, 10)}; relative likelihood ${format(data.relativeLikelihood, 5)}"/></label><div class="p223-control-actions"><button class="primary-button" type="button" data-problem-action="p223-pin">Pin p=${format(state.selectedP, 2)} for comparison</button><button class="secondary-button" type="button" data-problem-action="p223-preset" data-p223-preset=".5">Fair coin · .50</button><button class="secondary-button" type="button" data-problem-action="p223-preset" data-p223-preset=".7">Observed share · .70</button><button class="ghost-button" type="button" data-problem-action="p223-clear" ${pinned ? "" : "disabled"}>Clear pin</button></div><p data-p223-control-message role="status">${state.boardMessage}</p>${pinned ? `<p class="p223-compare-note">Selected L(p) is <strong>${format(ratioToPinned, 4)}×</strong> the likelihood at pinned p=${format(pinned.p, 2)}. This ratio compares support; neither value is a probability that p is true.</p>` : ""}</section>`;
  }

  function metricsMarkup() { const data = selectedData(); return `<section class="p223-metrics" aria-live="polite"><article><span>Candidate p</span><strong>${format(data.p, 2)}</strong><small>parameter being varied</small></article><article><span>Sequence likelihood</span><strong>${format(data.likelihood, 10)}</strong><small>p⁷(1−p)³</small></article><article><span>Relative to maximum</span><strong>${format(data.relativeLikelihood, 5)}</strong><small>maximum is 1 at p=.70</small></article></section>`; }
  function distinctionMarkup() { return `<section class="p223-distinction"><strong>Likelihood is not a probability distribution for p.</strong><span>It holds the observed data fixed and compares candidate parameter values. A posterior distribution would additionally require a prior and normalization.</span></section>`; }
  function dynamicMarkup() { return `<div class="p223-dynamic"><div class="p223-visual-wrap">${likelihoodSvg()}${controlsMarkup()}</div>${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p223-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p223-solution" aria-labelledby="p223-solution-heading"><h3 id="p223-solution-heading" tabindex="-1">The peak matches the observed head proportion</h3><p>For one particular ordering of seven heads and three tails, independence gives</p><div class="p223-equation">L(p)=p⁷(1−p)³.</div><p>If only the tally matters, the binomial likelihood is 120p⁷(1−p)³. The factor 120 does not depend on p, so it cannot move the maximum. Work with the log-likelihood:</p><div class="p223-equation">ℓ(p)=7 log p+3 log(1−p),<br>ℓ′(p)=7/p−3/(1−p).</div><p>Set the score to zero:</p><div class="p223-equation is-answer">7/p=3/(1−p)<br>7(1−p)=3p<br>10p=7<br><strong>p̂=7/10=0.70.</strong></div><p>Moreover, ℓ″(p)=−7/p²−3/(1−p)²&lt;0 for 0&lt;p&lt;1, so the stationary point is the unique maximum. The maximum sequence likelihood is about 0.0022235661; that small height is not “the probability that p=0.70.” It is a likelihood value for fixed data.</p></section>`;
  }

  function snapshot() {
    const selected = selectedData(), pinned = pinnedData(); let gridBestP = 0, gridBestLikelihood = -1;
    for (let index = 0; index <= 1000; index += 1) { const p = index / 1000, likelihood = likelihoodAt(p); if (likelihood > gridBestLikelihood) { gridBestLikelihood = likelihood; gridBestP = p; } }
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "ten independent Bernoulli tosses with fixed observed data; likelihood shown up to a p-independent constant", data: { heads: HEADS, tails: TAILS, tosses: TOSSES, observedHeadProportion: MLE, displayedSequence: "HHHHHHHTTT" }, selected: { p: selected.p, sequenceLikelihood: selected.likelihood, binomialCountProbability: selected.countProbability, relativeLikelihood: selected.relativeLikelihood, logLikelihood: selected.logLikelihood, score: selected.score, secondDerivative: selected.secondDerivative }, pinnedComparison: pinned ? { p: pinned.p, sequenceLikelihood: pinned.likelihood, relativeLikelihood: pinned.relativeLikelihood, selectedToPinnedLikelihoodRatio: pinned.likelihood ? selected.likelihood / pinned.likelihood : null } : null, maximum: { pHat: MLE, exact: "7/10", sequenceLikelihood: MLE_DATA.likelihood, binomialCountProbability: MLE_DATA.countProbability, logLikelihood: MLE_DATA.logLikelihood, scoreResidual: MLE_DATA.score, secondDerivative: MLE_DATA.secondDerivative }, calculus: { scoreEquation: "7/p-3/(1-p)=0", secondDerivativeEquation: "-7/p^2-3/(1-p)^2<0" }, checks: { endpointLikelihoods: [likelihoodAt(0), likelihoodAt(1)], relativeLikelihoodAtMaximum: MLE_DATA.relativeLikelihood, gridStep: .001, gridMaximumP: gridBestP, gridMaximumLikelihoodResidual: gridBestLikelihood - MLE_DATA.likelihood, sequenceToCountLikelihoodMultiplier: BINOMIAL_MULTIPLIER, integralOfUnnormalisedLikelihoodOverParameter: 1 / 1320, integralIsOne: false }, interpretation: { likelihood: "function of p with observed data fixed", posterior: "would require a prior and normalization; not calculated here" }, challenge: { fixedHeads: HEADS, fixedTails: TAILS, maximumLikelihoodEstimate: MLE, acceptedAbsoluteTolerance: ANSWER_TOLERANCE }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p223-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Statistics and Inference</strong><span class="eyebrow">Chapter 22 · Likelihood</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p223-spread"><article class="book-page p223-problem-page"><div class="problem-number">Problem 22.3</div><h1 class="book-title p223-title">The Coin’s Best-Fitting Bias</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p223-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A coin has unknown probability p of landing heads. In 10 independent tosses, the observed tally is 7 heads and 3 tails.</p><p class="problem-copy">Using L(p)=p⁷(1−p)³, or any proportional likelihood, <strong>what is the maximum-likelihood estimate of p?</strong></p><section class="p223-question-card"><strong>Turn the usual probability question around</strong><p>The data are now fixed. Compare how strongly different candidate values of p support those same observations.</p></section></article><section class="book-page book-stage p223-stage" aria-labelledby="p223-stage-heading">${stageControlsMarkup()}<div class="p223-stage-heading"><div><span class="eyebrow">Likelihood laboratory</span><h2 id="p223-stage-heading">Move p beneath fixed evidence</h2></div><p>Pin one candidate, move to another, and compare likelihood ratios without treating the curve as a posterior.</p></div><div class="p223-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p223-coach"><div class="coach-kicker">Locate the best-fitting bias</div><p class="coach-question">Enter the value of p that maximizes the fixed-data likelihood. A decimal, fraction or percentage is accepted.</p><form class="p223-answer-form" data-p223-answer-form novalidate><label for="p223-answer">Maximum-likelihood estimate p̂</label><input id="p223-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal"/><small>The answer is a parameter value, not the height of the likelihood curve.</small><button class="primary-button" type="submit">Check estimate</button></form>${feedbackMarkup()}<div class="button-row p223-help-row"><button class="secondary-button" type="button" data-problem-action="p223-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p223-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p223-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p223-shell"); if (!root) return; const dynamic = root.querySelector(".p223-dynamic"), active = document.activeElement; let focusSelector = "";
    if (dynamic?.contains(active)) { if (active.id === "p223-p") focusSelector = "#p223-p"; else if (active.dataset?.problemAction) focusSelector = `[data-problem-action="${active.dataset.problemAction}"]${active.dataset.p223Preset ? `[data-p223-preset="${active.dataset.p223Preset}"]` : ""}`; }
    if (dynamic) dynamic.outerHTML = dynamicMarkup(); root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (focusSelector) { const replacement = root.querySelector(focusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p223-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return; const action = control.dataset.problemAction;
      if (action === "p223-reset") { state = initialState(); renderAndFocus(renderApp, "#p223-p"); return; }
      if (action === "p223-stage") { state.stage = clamp(Math.round(control.dataset.p223Stage), 0, 2); renderAndFocus(renderApp, `[data-p223-stage="${state.stage}"]`); return; }
      if (action === "p223-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p223-stage="${state.stage}"]`); return; }
      if (action === "p223-pin") { state.pinnedP = state.selectedP; state.boardMessage = `Pinned p=${format(state.pinnedP, 2)}. Move the slider to compare another candidate against exactly the same data.`; updateDynamicDom(); return; }
      if (action === "p223-clear") { state.pinnedP = null; state.boardMessage = "Comparison cleared. The selected likelihood is still measured relative to the global maximum at p=0.70."; updateDynamicDom(); return; }
      if (action === "p223-preset") { state.selectedP = clamp(Number(control.dataset.p223Preset), 0, 1); const data = selectedData(); state.boardMessage = `Candidate p=${format(state.selectedP, 2)} has relative likelihood ${format(data.relativeLikelihood, 5)} for the fixed 7-head, 3-tail data.`; updateDynamicDom(); return; }
      if (action === "p223-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p223-reveal") { state.revealed = true; state.stage = 2; restoreChallengeResult(); }
      renderApp(); if (action === "p223-reveal") window.requestAnimationFrame(() => document.querySelector("#p223-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p223-p")) { state.selectedP = clamp(Number(event.target.value), 0, 1); const data = selectedData(); state.boardMessage = `At p=${format(state.selectedP, 2)}, L(p)=${format(data.likelihood, 10)} and relative likelihood is ${format(data.relativeLikelihood, 5)}.`; updateDynamicDom(); return; }
      if (event.target.matches("#p223-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root?.querySelector("[data-p223-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p223-answer")?.value || "", answer = parseParameter(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a candidate probability between 0 and 1, as a decimal, fraction or percentage.";
      else if (Math.abs(answer - .07) <= .001 && /^7(?:\.0*)?$/.test(raw.trim())) state.feedback = "Seven is the number of observed heads. Divide by all ten tosses to obtain the parameter estimate.";
      else if (Math.abs(answer - MAX_LIKELIHOOD) <= .0001) state.feedback = "About 0.0022236 is the maximum likelihood height, not the value of p where that maximum occurs.";
      else if (Math.abs(answer - .5) <= .005) state.feedback = "A fair coin is one candidate, but the fixed data contain more heads than tails. Move p along the curve or maximize the log-likelihood.";
      else if (Math.abs(answer - MLE) > ANSWER_TOLERANCE) state.feedback = "Set 7/p−3/(1−p)=0, or locate the peak of p⁷(1−p)³.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: the likelihood is maximized at p̂=7/10=0.70."; state.committed = true; state.stage = 2; restoreChallengeResult(); }
      renderAndFocus(renderApp, "#p223-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
