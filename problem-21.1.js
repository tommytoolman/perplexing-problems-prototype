(function registerSilentSwitchboardPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "21.1";
  const CHALLENGE_RATE_PER_HOUR = 3;
  const CHALLENGE_SILENT_MINUTES = 20;
  const CHALLENGE_ADDITIONAL_MINUTES = 10;
  const ANSWER_TOLERANCE = .002;
  const TIMELINE_HORIZON_MINUTES = 90;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Count", title: "Translate the rate into an expected count", copy: "A rate of 3 calls per hour gives an expected 0.5 calls in ten minutes. That number is the Poisson mean for the interval—not the probability that no call arrives." }),
    Object.freeze({ short: "Survive", title: "Use the exponential no-arrival curve", copy: "For a Poisson process, the waiting-time survival function is S(u)=P(T>u)=e⁻ˡᵃᵐᵇᵈᵃᵘ. The chance of zero calls during an interval is the same exponential quantity." }),
    Object.freeze({ short: "Forget", title: "Restart the clock at the present moment", copy: "Independent increments make the remaining wait memoryless: S(t+u)/S(t)=S(u). Twenty silent minutes do not make the switchboard overdue for a call." }),
  ]);
  const hints = Object.freeze([
    "Focus on the additional ten-minute interval. The previous twenty minutes are already known to contain no calls.",
    "Convert ten minutes to one sixth of an hour, so the Poisson mean for the future interval is λu=3×(1/6)=0.5.",
    "For a Poisson random variable with mean m, P(N=0)=e⁻ᵐ.",
    "Therefore the required conditional probability is e⁻⁰·⁵. The earlier silence does not change it.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p211-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function svgNumber(value, digits = 3) { return Number(value.toFixed(digits)); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function poissonData(ratePerHour, silentMinutes, additionalMinutes) {
    const rate = clamp(ratePerHour, 0, 1000), silent = clamp(silentMinutes, 0, 10000), additional = clamp(additionalMinutes, 0, 10000);
    const expectedPastCalls = rate * silent / 60, expectedAdditionalCalls = rate * additional / 60, expectedTotalCalls = expectedPastCalls + expectedAdditionalCalls;
    const survivalPast = Math.exp(-expectedPastCalls), survivalTotal = Math.exp(-expectedTotalCalls), conditionalNoCallProbability = survivalPast ? survivalTotal / survivalPast : Math.exp(-expectedAdditionalCalls);
    const directNoCallProbability = Math.exp(-expectedAdditionalCalls), probabilityAtLeastOneCall = 1 - directNoCallProbability;
    return { ratePerHour: rate, ratePerMinute: rate / 60, silentMinutes: silent, additionalMinutes: additional, totalMinutes: silent + additional, expectedPastCalls, expectedAdditionalCalls, expectedTotalCalls, survivalPast, survivalTotal, conditionalNoCallProbability, directNoCallProbability, probabilityAtLeastOneCall, meanWaitMinutes: rate ? 60 / rate : Infinity, memorylessResidual: conditionalNoCallProbability - directNoCallProbability };
  }

  const challenge = Object.freeze(poissonData(CHALLENGE_RATE_PER_HOUR, CHALLENGE_SILENT_MINUTES, CHALLENGE_ADDITIONAL_MINUTES));
  function initialState() { return { ratePerHour: CHALLENGE_RATE_PER_HOUR, silentMinutes: CHALLENGE_SILENT_MINUTES, additionalMinutes: CHALLENGE_ADDITIONAL_MINUTES, sampleSeed: 37, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false, boardMessage: "Twenty silent minutes are evidence about the past. Independent increments leave the next ten-minute wait with probability e⁻⁰·⁵." }; }
  let state = initialState();
  function currentData() { return poissonData(state.ratePerHour, state.silentMinutes, state.additionalMinutes); }
  function restoreChallenge() { state.ratePerHour = CHALLENGE_RATE_PER_HOUR; state.silentMinutes = CHALLENGE_SILENT_MINUTES; state.additionalMinutes = CHALLENGE_ADDITIONAL_MINUTES; state.boardMessage = "Challenge restored: 3 calls/hour and 10 future minutes give mean 0.5 and no-call probability e⁻⁰·⁵."; }

  function parseProbability(raw) {
    const normalized = String(raw).trim().replaceAll("−", "-").replaceAll(",", "."); if (!normalized) return NaN;
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    const match = normalized.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i); if (!match) return NaN;
    const value = Number(match[0]); return normalized.includes("%") || Math.abs(value) > 1 ? value / 100 : value;
  }

  function stageControlsMarkup() { return `<div class="p211-stage-controls" role="group" aria-label="Poisson waiting-time reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p211-stage" data-p211-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p211-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p211-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Memorylessness exposed" : "Next stage"}</button></div>`; }

  function survivalCurvePath(data, normalizedFromNow = false) {
    return Array.from({ length: 121 }, (_, index) => { const minute = TIMELINE_HORIZON_MINUTES * index / 120, probability = normalizedFromNow ? Math.exp(-data.ratePerMinute * Math.max(0, minute - data.silentMinutes)) : Math.exp(-data.ratePerMinute * minute), x = 57 + 650 * minute / TIMELINE_HORIZON_MINUTES, y = 374 - 170 * probability; return `${index ? "L" : "M"}${svgNumber(x)} ${svgNumber(y)}`; }).join("");
  }

  function sampleFutureArrivals(data) {
    let seed = state.sampleSeed >>> 0, minute = data.silentMinutes; const arrivals = [];
    function random() { seed = (1664525 * seed + 1013904223) >>> 0; return (seed + .5) / 4294967296; }
    if (!data.ratePerMinute) return arrivals;
    while (arrivals.length < 18) { minute += -Math.log(random()) / data.ratePerMinute; if (minute > TIMELINE_HORIZON_MINUTES) break; arrivals.push(minute); }
    return arrivals;
  }

  function switchboardSvg() {
    const data = currentData(), mapX = (minute) => 57 + 650 * clamp(minute, 0, TIMELINE_HORIZON_MINUTES) / TIMELINE_HORIZON_MINUTES;
    const nowX = mapX(data.silentMinutes), laterX = mapX(data.totalMinutes), pastWidth = Math.max(0, nowX - 57), futureWidth = Math.max(2, laterX - nowX), basePastY = 374 - 170 * data.survivalPast, baseTotalY = 374 - 170 * data.survivalTotal, conditionalY = 374 - 170 * data.directNoCallProbability;
    const arrivals = sampleFutureArrivals(data).map((minute, index) => { const x = mapX(minute), inside = minute <= data.totalMinutes; return `<g class="p211-call ${inside ? "is-window" : ""}"><circle cx="${svgNumber(x)}" cy="93" r="9"/><path d="M${svgNumber(x - 4)} 89q4 8 8 0"/><text x="${svgNumber(x)}" y="119" text-anchor="middle">${index === 0 ? "first sampled call" : ""}</text></g>`; }).join("");
    const xTicks = [0,15,30,45,60,75,90].map((minute) => { const x = mapX(minute); return `<g class="p211-tick"><line x1="${x}" y1="374" x2="${x}" y2="380"/><text x="${x}" y="394" text-anchor="middle">${minute}</text></g>`; }).join("");
    const yTicks = [0,.25,.5,.75,1].map((probability) => { const y = 374 - 170 * probability; return `<g class="p211-grid"><line x1="57" y1="${y}" x2="707" y2="${y}"/><text x="47" y="${y + 3}" text-anchor="end">${format(probability, 2)}</text></g>`; }).join("");
    const description = `Calls form a Poisson process at ${format(data.ratePerHour, 2)} per hour. The observed silent interval is ${format(data.silentMinutes, 1)} minutes and the additional interval is ${format(data.additionalMinutes, 1)} minutes. The expected count in the additional interval is ${format(data.expectedAdditionalCalls, 5)} while its no-call probability is ${format(data.directNoCallProbability, 6)}. Unconditional survival to the current time is ${format(data.survivalPast, 6)} and to the end of the interval is ${format(data.survivalTotal, 6)}. Their ratio is ${format(data.conditionalNoCallProbability, 6)}, equal to a fresh ${format(data.additionalMinutes, 1)} minute wait.`;
    return `<svg class="p211-switchboard p211-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p211-svg-title p211-svg-desc"><title id="p211-svg-title">Poisson switchboard timeline and exponential waiting-time survival</title><desc id="p211-svg-desc">${description}</desc><defs><linearGradient id="p211-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f1e6"/><stop offset="1" stop-color="#e8f0ec"/></linearGradient><marker id="p211-time-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p211-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p211-board-kicker" x="24" y="28">POISSON SWITCHBOARD · SILENCE SO FAR DOES NOT MAKE A CALL DUE</text><g class="p211-timeline"><text class="p211-panel-title" x="31" y="54">ONE CONDITIONAL SAMPLE PATH</text><rect class="p211-past-window" x="57" y="75" width="${svgNumber(pastWidth)}" height="36" rx="8"/><rect class="p211-future-window" x="${svgNumber(nowX)}" y="75" width="${svgNumber(futureWidth)}" height="36" rx="8"/><line class="p211-time-axis" x1="57" y1="93" x2="710" y2="93" marker-end="url(#p211-time-arrow)"/><line class="p211-now-line" x1="${svgNumber(nowX)}" y1="61" x2="${svgNumber(nowX)}" y2="133"/><text class="p211-time-label" x="57" y="68">observation begins · no calls</text><text class="p211-now-label" x="${svgNumber(nowX)}" y="57" text-anchor="middle">NOW · ${format(data.silentMinutes, 0)} min</text><text class="p211-window-label" x="${svgNumber((nowX + laterX) / 2)}" y="145" text-anchor="middle">next ${format(data.additionalMinutes, 0)} min</text>${arrivals}<text class="p211-sample-note" x="708" y="145" text-anchor="end">sample outcome ≠ probability</text></g><g class="p211-survival-group"><text class="p211-panel-title" x="31" y="179">WAITING-TIME SURVIVAL S(t)=P(T&gt;t)</text>${yTicks}${xTicks}<path class="p211-survival-curve" d="${survivalCurvePath(data)}"/><line class="p211-guide is-past" x1="${svgNumber(nowX)}" y1="${svgNumber(basePastY)}" x2="${svgNumber(nowX)}" y2="374"/><line class="p211-guide is-total" x1="${svgNumber(laterX)}" y1="${svgNumber(baseTotalY)}" x2="${svgNumber(laterX)}" y2="374"/><circle class="p211-point is-past" cx="${svgNumber(nowX)}" cy="${svgNumber(basePastY)}" r="6"/><circle class="p211-point is-total" cx="${svgNumber(laterX)}" cy="${svgNumber(baseTotalY)}" r="6"/><text class="p211-point-label" x="${svgNumber(clamp(nowX - 8, 98, 610))}" y="${svgNumber(basePastY - 11)}" text-anchor="end">S(${format(data.silentMinutes, 0)})=${format(data.survivalPast, 4)}</text><text class="p211-point-label" x="${svgNumber(clamp(laterX + 8, 150, 675))}" y="${svgNumber(baseTotalY + 18)}">S(${format(data.totalMinutes, 0)})=${format(data.survivalTotal, 4)}</text><text class="p211-axis-label" x="707" y="409" text-anchor="end">minutes since observation began</text></g><g class="p211-conditional"><path class="p211-restart-curve" d="${survivalCurvePath(data, true)}"/><circle class="p211-restart-point" cx="${svgNumber(laterX)}" cy="${svgNumber(conditionalY)}" r="6"/><rect class="p211-ratio-box" x="436" y="188" width="285" height="72" rx="11"/><text class="p211-ratio-kicker" x="452" y="208">RESTART AT NOW</text><text class="p211-ratio-equation" x="452" y="232">S(t+u) / S(t) = S(u)</text><text class="p211-ratio-value" x="704" y="248" text-anchor="end">${format(data.conditionalNoCallProbability, 6)}</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p211-controls" aria-label="Poisson rate and waiting-time controls"><div class="p211-slider-grid"><label for="p211-rate"><span>Call rate λ <output data-p211-output="rate">${format(state.ratePerHour, 2)}/hour</output></span><input id="p211-rate" type="range" min="0.5" max="8" step="0.25" value="${state.ratePerHour}" aria-valuetext="${format(state.ratePerHour, 2)} calls per hour; mean wait ${format(data.meanWaitMinutes, 2)} minutes"/></label><label for="p211-now"><span>Current silent time t <output data-p211-output="now">${format(state.silentMinutes, 0)} min</output></span><input id="p211-now" type="range" min="0" max="60" step="1" value="${state.silentMinutes}" aria-valuetext="Already silent for ${format(state.silentMinutes, 0)} minutes"/></label><label for="p211-extra"><span>Additional wait u <output data-p211-output="extra">${format(state.additionalMinutes, 0)} min</output></span><input id="p211-extra" type="range" min="0" max="30" step="1" value="${state.additionalMinutes}" aria-valuetext="Additional wait ${format(state.additionalMinutes, 0)} minutes; no-call probability ${format(data.directNoCallProbability, 6)}"/></label></div><div class="p211-control-actions"><button class="secondary-button" type="button" data-problem-action="p211-sample">Draw another future</button><button class="chip-button" type="button" data-problem-action="p211-challenge">Restore fixed challenge</button></div><p data-p211-control-message role="status">${state.boardMessage}</p></section>`;
  }

  function metricsMarkup() { const data = currentData(); return `<section class="p211-metrics" aria-live="polite"><div><span>Expected calls in u</span><strong>${format(data.expectedAdditionalCalls, 4)}</strong><small>λu · a mean count</small></div><div><span>No-call probability</span><strong>${format(data.directNoCallProbability, 6)}</strong><small>e⁻ˡᵃᵐᵇᵈᵃᵘ · not λu</small></div><div><span>Mean future wait</span><strong>${format(data.meanWaitMinutes, 2)} min</strong><small>1/λ · unchanged by past silence</small></div></section>`; }
  function dynamicMarkup() { return `<div class="p211-dynamic"><div class="p211-visual-wrap">${switchboardSvg()}${controlsMarkup()}</div>${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p211-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p211-solution" aria-labelledby="p211-solution-heading"><h3 id="p211-solution-heading" tabindex="-1">Use the independent ten-minute increment</h3><p>Let N(t) count calls by time t. The number arriving in the next ten minutes is independent of what happened in the preceding twenty minutes. Its Poisson mean is</p><div class="p211-equation">m=λu=(3 hour⁻¹)(10/60 hour)=1/2.</div><p>A Poisson random variable with mean m has probability e⁻ᵐ of being zero, so</p><div class="p211-equation is-answer">P(no call in the next 10 min | no call in the first 20 min)<br>=e⁻¹ᐟ²=<strong>0.6065306597≈0.606531.</strong></div><p>The survival-function calculation exposes memorylessness directly:</p><div class="p211-equation">P(T&gt;30 | T&gt;20)=S(30)/S(20)<br>=e⁻¹·⁵/e⁻¹=e⁻⁰·⁵.</div><p>The expected number of calls in those ten minutes is 0.5, but that is not a probability. There may be zero, one, or several calls; zero occurs with probability about 60.65%.</p></section>`;
  }

  function snapshot() {
    const data = currentData(), arrivals = sampleFutureArrivals(data);
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "homogeneous Poisson process with independent stationary increments; waiting time is exponential", controls: { ratePerHour: data.ratePerHour, observedSilentMinutes: data.silentMinutes, additionalWaitMinutes: data.additionalMinutes }, intervalAudit: { expectedPastCalls: data.expectedPastCalls, expectedAdditionalCalls: data.expectedAdditionalCalls, expectedTotalCalls: data.expectedTotalCalls, survivalPast: data.survivalPast, survivalTotal: data.survivalTotal, conditionalNoCallProbability: data.conditionalNoCallProbability, directNoCallProbability: data.directNoCallProbability, probabilityAtLeastOneCall: data.probabilityAtLeastOneCall, meanFutureWaitMinutes: data.meanWaitMinutes }, identities: { conditionalRatioResidual: data.memorylessResidual, zeroAdditionalLimit: poissonData(data.ratePerHour, data.silentMinutes, 0).conditionalNoCallProbability, zeroRateLimit: poissonData(0, data.silentMinutes, data.additionalMinutes).conditionalNoCallProbability, oneMeanWaitSurvival: data.ratePerHour ? poissonData(data.ratePerHour, 0, data.meanWaitMinutes).directNoCallProbability : 1, longWaitSurvivalAtOneHundredMeans: data.ratePerHour ? poissonData(data.ratePerHour, 0, 100 * data.meanWaitMinutes).directNoCallProbability : 1 }, illustrativeConditionalSample: { seed: state.sampleSeed, futureArrivalMinutesFromObservationStart: arrivals.map((arrival) => Number(arrival.toFixed(6))), note: "one path is not a probability estimate" }, challenge: { ratePerHour: CHALLENGE_RATE_PER_HOUR, alreadySilentMinutes: CHALLENGE_SILENT_MINUTES, additionalMinutes: CHALLENGE_ADDITIONAL_MINUTES, expectedAdditionalCalls: challenge.expectedAdditionalCalls, exactExpression: "exp(-1/2)", probability: challenge.directNoCallProbability, acceptedAbsoluteTolerance: ANSWER_TOLERANCE }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p211-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Stochastic processes</strong><span class="eyebrow">Chapter 21 · Original extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p211-spread"><article class="book-page p211-problem-page"><div class="problem-number">Problem 21.1</div><h1 class="book-title p211-title">The Silent Switchboard</h1><div class="difficulty" aria-label="One star difficulty">★</div><p class="p211-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Calls reach a switchboard according to a Poisson process at a constant rate of 3 calls per hour. No call has arrived during the last 20 minutes.</p><p class="problem-copy"><strong>What is the probability that the switchboard remains silent for at least 10 more minutes?</strong></p><section class="p211-observation-card"><strong>The future interval starts now</strong><p>The first twenty minutes are observed information. The random quantity in the question is the number of calls in the next ten-minute increment.</p></section><section class="p211-model-card"><div class="eyebrow">Ideal stochastic model</div><p>The rate is constant, arrivals do not occur simultaneously, and disjoint time intervals have independent counts.</p></section></article><section class="book-page book-stage p211-stage" aria-labelledby="p211-stage-heading">${stageControlsMarkup()}<div class="p211-stage-heading"><div><span class="eyebrow">Waiting-time laboratory</span><h2 id="p211-stage-heading">Move “now” without ageing the process</h2></div><p>The sample path changes, but the exact curve—not one sample—determines the probability.</p></div><div class="p211-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p211-coach"><div class="coach-kicker">Measure the remaining silence</div><p class="coach-question">Enter a probability. Decimal answers such as 0.6065 and percentages such as 60.65% are both accepted.</p><form class="p211-answer-form" data-p211-answer-form novalidate><label for="p211-answer">Probability of at least 10 more silent minutes</label><div><input id="p211-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="e.g. 0.6065"/><span>probability</span></div><small>Acceptance tolerance: ±${format(ANSWER_TOLERANCE, 3)}.</small><button class="primary-button" type="submit">Check probability</button></form>${feedbackMarkup()}<div class="button-row p211-help-row"><button class="secondary-button" type="button" data-problem-action="p211-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p211-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p211-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p211-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p211-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return; const action = control.dataset.problemAction;
      if (action === "p211-reset") { state = initialState(); renderAndFocus(renderApp, "#p211-rate"); return; }
      if (action === "p211-stage") { state.stage = clamp(Math.round(control.dataset.p211Stage), 0, 2); renderAndFocus(renderApp, `[data-p211-stage="${state.stage}"]`); return; }
      if (action === "p211-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p211-stage="${state.stage}"]`); return; }
      if (action === "p211-sample") { state.sampleSeed = (state.sampleSeed + 137) >>> 0; state.boardMessage = "A new conditional sample path was drawn. Its calls are outcomes; the exponential curve still supplies the probability."; updateDynamicDom(root); return; }
      if (action === "p211-challenge") { restoreChallenge(); updateDynamicDom(root); return; }
      if (action === "p211-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p211-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p211-reveal") window.requestAnimationFrame(() => document.querySelector("#p211-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p211-rate")) { state.ratePerHour = clamp(event.target.value, .5, 8); state.boardMessage = `At ${format(state.ratePerHour, 2)} calls/hour, the mean future wait is ${format(60 / state.ratePerHour, 2)} minutes.`; }
      else if (event.target.matches("#p211-now")) { state.silentMinutes = clamp(event.target.value, 0, 60); state.boardMessage = `Moving now to ${format(state.silentMinutes, 0)} silent minutes changes S(t), but not the conditional probability for a fixed future interval.`; }
      else if (event.target.matches("#p211-extra")) { state.additionalMinutes = clamp(event.target.value, 0, 30); state.boardMessage = `The future interval is ${format(state.additionalMinutes, 0)} minutes: expected calls and the no-call probability both change, but they are not the same number.`; }
      else return;
      updateDynamicDom(root);
    });
    root?.querySelector("#p211-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 28); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p211-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p211-answer")?.value || "", answer = parseProbability(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter one probability between 0 and 1, or the equivalent percentage.";
      else if (Math.abs(answer - challenge.expectedAdditionalCalls) <= .003) state.feedback = "0.5 is the expected number of calls in ten minutes, not the probability of zero calls. Use the Poisson zero-count formula.";
      else if (Math.abs(answer - challenge.survivalPast) <= .003) state.feedback = "About 0.3679 is the probability of twenty silent minutes from a fresh start. The question asks about ten additional minutes.";
      else if (Math.abs(answer - challenge.survivalTotal) <= .003) state.feedback = "About 0.2231 is the unconditional probability of thirty silent minutes. Condition on the twenty minutes already observed, or use the independent future increment.";
      else if (Math.abs(answer - challenge.directNoCallProbability) > ANSWER_TOLERANCE) state.feedback = "Use P(N=0)=e⁻ᵐ with m=(3/hour)(10/60 hour)=0.5.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: independent increments give e⁻⁰·⁵≈0.606531, regardless of the preceding twenty silent minutes."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p211-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
