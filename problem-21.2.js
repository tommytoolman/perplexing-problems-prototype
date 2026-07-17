(function registerTomorrowWeatherPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "21.2";
  const TRANSITION_MATRIX = Object.freeze([
    Object.freeze([.8, .2]),
    Object.freeze([.3, .7]),
  ]);
  const INITIAL_DISTRIBUTION = Object.freeze([1, 0]);
  const MAX_DISTRIBUTION_DAY = 3;
  const TOKEN_MASS = .05;
  const INITIAL_RANDOM_SEED = 2122026;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Read a row", title: "Each row is a one-step probability recipe", copy: "From sunny, tomorrow is sunny with probability 0.80 and rainy with probability 0.20. From rainy, the corresponding probabilities are 0.30 and 0.70. Every row sums to one." }),
    Object.freeze({ short: "Move mass", title: "Propagate the whole distribution", copy: "Split today’s sunny and rainy probability mass along every outgoing arrow, then recombine the pieces arriving at each state. This is the row-vector update pₙ₊₁=pₙP." }),
    Object.freeze({ short: "Path ≠ law", title: "One realised path is not the distribution", copy: "A sampled path records one weather outcome per day. The distribution describes probabilities over all possible paths. The Markov property says the next-step law depends on the current state, not the earlier route to it." }),
  ]);
  const hints = Object.freeze([
    "Start with p₀=(1,0): all probability mass is in Sunny.",
    "After one day, read the Sunny row directly: p₁=(0.8,0.2).",
    "For the second day, rain receives 0.8×0.2 from sunny histories and 0.2×0.7 from rainy histories, giving 0.30.",
    "Continue once more: P(R₃)=P(S₂)P(R|S)+P(R₂)P(R|R).",
    "Since p₂=(0.70,0.30), P(R₃)=0.70×0.20+0.30×0.70=0.14+0.21=0.35.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p212-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function advanceDistribution(distribution, matrix = TRANSITION_MATRIX) {
    const sunny = distribution[0] * matrix[0][0] + distribution[1] * matrix[1][0];
    const rain = distribution[0] * matrix[0][1] + distribution[1] * matrix[1][1];
    return [cleanZero(sunny), cleanZero(rain)];
  }

  function distributionAfter(days, initial = INITIAL_DISTRIBUTION) {
    let distribution = [...initial];
    for (let day = 0; day < days; day += 1) distribution = advanceDistribution(distribution);
    return distribution;
  }

  function distributionHistory(maxDay = MAX_DISTRIBUTION_DAY) {
    return Array.from({ length: maxDay + 1 }, (_, day) => distributionAfter(day));
  }

  function flowFrom(distribution) {
    const sunnyToSunny = distribution[0] * TRANSITION_MATRIX[0][0];
    const sunnyToRain = distribution[0] * TRANSITION_MATRIX[0][1];
    const rainToSunny = distribution[1] * TRANSITION_MATRIX[1][0];
    const rainToRain = distribution[1] * TRANSITION_MATRIX[1][1];
    return {
      sunnyToSunny,
      sunnyToRain,
      rainToSunny,
      rainToRain,
      nextSunny: sunnyToSunny + rainToSunny,
      nextRain: sunnyToRain + rainToRain,
      conservationResidual: cleanZero(distribution[0] + distribution[1] - sunnyToSunny - sunnyToRain - rainToSunny - rainToRain),
    };
  }

  const challenge = Object.freeze(distributionAfter(3));

  function initialState() {
    return {
      distributionDay: 0,
      stage: 0,
      realisedPath: ["sunny"],
      sampledSteps: 0,
      randomSeed: INITIAL_RANDOM_SEED,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();
  function currentDistribution() { return distributionAfter(state.distributionDay); }

  function parseProbability(raw) {
    const compact = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".");
    const isPercent = compact.endsWith("%");
    const numeric = isPercent ? compact.slice(0, -1) : compact;
    if (!/^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(numeric)) return NaN;
    const value = Number(numeric);
    return isPercent || value > 1 ? value / 100 : value;
  }

  function nextRandom(seed) {
    const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return { seed: nextSeed, value: nextSeed / 4294967296 };
  }

  function sampleNextWeather() {
    const current = state.realisedPath[state.realisedPath.length - 1];
    const rainProbability = current === "sunny" ? TRANSITION_MATRIX[0][1] : TRANSITION_MATRIX[1][1];
    const random = nextRandom(state.randomSeed);
    const next = random.value < rainProbability ? "rain" : "sunny";
    state.randomSeed = random.seed;
    state.realisedPath = [...state.realisedPath, next].slice(-8);
    state.sampledSteps += 1;
  }

  function stageControlsMarkup() {
    return `<div class="p212-stage-controls" role="group" aria-label="Markov-chain reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p212-stage" data-p212-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p212-stage-caption"><div><div class="eyebrow">Task ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p212-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Markov idea resolved" : "Next task"}</button></div>`;
  }

  function probabilityTokensMarkup(count, stateName, startX) {
    return Array.from({ length: count }, (_, index) => {
      const column = index % 10;
      const row = Math.floor(index / 10);
      const x = startX + column * 21;
      const y = 342 + row * 24;
      return stateName === "sunny"
        ? `<circle class="p212-token is-sunny" cx="${x}" cy="${y}" r="7"/>`
        : `<rect class="p212-token is-rain" x="${x - 7}" y="${y - 7}" width="14" height="14" rx="2"/>`;
    }).join("");
  }

  function chainSvg() {
    const distribution = currentDistribution();
    const sunnyTokens = Math.round(distribution[0] / TOKEN_MASS);
    const rainTokens = Math.round(distribution[1] / TOKEN_MASS);
    const description = `A two-state Markov chain has transition probabilities sunny to sunny 0.8, sunny to rain 0.2, rain to sunny 0.3 and rain to rain 0.7. Starting sunny, on day ${state.distributionDay} the distribution is sunny ${format(distribution[0], 6)} and rain ${format(distribution[1], 6)}. The token display represents this as ${sunnyTokens} sunny probability tokens and ${rainTokens} rain probability tokens, each worth 0.05.`;
    return `<svg class="p212-chain p212-stage-${state.stage}" viewBox="0 0 760 410" role="img" aria-labelledby="p212-chain-title p212-chain-desc"><title id="p212-chain-title">Weather transition graph and evolving probability distribution</title><desc id="p212-chain-desc">${description}</desc><defs><marker id="p212-sunny-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p212-rain-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p212-board" x="1" y="1" width="758" height="408" rx="20"/><text class="p212-board-kicker" x="22" y="28">TWO WEATHER STATES · FOUR ONE-STEP TRANSITIONS · TOTAL PROBABILITY 1</text><g class="p212-graph"><text class="p212-panel-title" x="31" y="56">TRANSITION GRAPH</text><path class="p212-edge is-sunny" d="M264 105C340 48 420 48 496 105" marker-end="url(#p212-sunny-arrow)"/><text class="p212-edge-label" x="380" y="64" text-anchor="middle">0.20 · S→R</text><path class="p212-edge is-rain" d="M496 143C420 202 340 202 264 143" marker-end="url(#p212-rain-arrow)"/><text class="p212-edge-label" x="380" y="196" text-anchor="middle">0.30 · R→S</text><path class="p212-edge is-sunny" d="M193 88C137 21 110 115 180 118" marker-end="url(#p212-sunny-arrow)"/><text class="p212-edge-label" x="127" y="65" text-anchor="middle">0.80</text><path class="p212-edge is-rain" d="M567 88C623 21 650 115 580 118" marker-end="url(#p212-rain-arrow)"/><text class="p212-edge-label" x="633" y="65" text-anchor="middle">0.70</text><g class="p212-node is-sunny" transform="translate(220 125)"><circle r="45"/><text y="-2" text-anchor="middle">SUNNY</text><text class="p212-node-symbol" y="18" text-anchor="middle">S</text></g><g class="p212-node is-rain" transform="translate(540 125)"><circle r="45"/><text y="-2" text-anchor="middle">RAIN</text><text class="p212-node-symbol" y="18" text-anchor="middle">R</text></g></g><line class="p212-divider" x1="31" y1="222" x2="729" y2="222"/><g class="p212-distribution"><text class="p212-panel-title" x="31" y="247">DAY ${state.distributionDay} DISTRIBUTION · EACH TOKEN = 0.05</text><rect class="p212-bin is-sunny" x="50" y="266" width="310" height="121" rx="13"/><rect class="p212-bin is-rain" x="400" y="266" width="310" height="121" rx="13"/><text class="p212-bin-title" x="70" y="291">SUNNY</text><text class="p212-bin-probability" x="340" y="291" text-anchor="end">${format(distribution[0], 2)} · ${sunnyTokens} tokens</text><text class="p212-bin-title" x="420" y="291">RAIN</text><text class="p212-bin-probability" x="690" y="291" text-anchor="end">${format(distribution[1], 2)} · ${rainTokens} tokens</text>${probabilityTokensMarkup(sunnyTokens, "sunny", 85)}${probabilityTokensMarkup(rainTokens, "rain", 435)}</g></svg>`;
  }

  function distributionEquationMarkup() {
    const history = distributionHistory();
    const distribution = history[state.distributionDay];
    if (state.stage === 0 && !state.revealed) return `<div class="p212-live-rule" role="status"><strong>Read one row.</strong> From Sunny: 0.80 stays Sunny and 0.20 moves to Rain.</div>`;
    if (state.distributionDay === 0) return `<div class="p212-live-rule" role="status"><strong>Initial law:</strong> p₀=(1,0). Advance a day to split this mass across both states.</div>`;
    const previous = history[state.distributionDay - 1];
    const flow = flowFrom(previous);
    return `<div class="p212-live-rule" role="status"><strong>Day ${state.distributionDay} update:</strong> rain = ${format(previous[0], 2)}×0.20 + ${format(previous[1], 2)}×0.70 = ${format(flow.sunnyToRain, 3)} + ${format(flow.rainToRain, 3)} = ${format(distribution[1], 3)}.</div>`;
  }

  function distributionControlsMarkup() {
    const distribution = currentDistribution();
    return `<section class="p212-distribution-controls" aria-label="Distribution day controls"><div><span>Distribution clock</span><strong>Day ${state.distributionDay}</strong><small>Sunny ${format(distribution[0] * 100, 1)}% · Rain ${format(distribution[1] * 100, 1)}%</small></div><div><button class="secondary-button" type="button" data-problem-action="p212-previous-day" ${state.distributionDay <= 0 ? "disabled" : ""}>Previous day</button><button class="primary-button" type="button" data-problem-action="p212-next-day" ${state.distributionDay >= MAX_DISTRIBUTION_DAY ? "disabled" : ""}>Advance distribution</button></div></section>`;
  }

  function realisedPathMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const current = state.realisedPath[state.realisedPath.length - 1];
    const nextRainProbability = current === "sunny" ? .2 : .7;
    return `<section class="p212-path-card" aria-labelledby="p212-path-heading"><div><span class="eyebrow">One realised path</span><h3 id="p212-path-heading">A sample is one story, not the probability law</h3><p>Current state ${current === "sunny" ? "Sunny" : "Rain"}: the next-day rain probability is ${format(nextRainProbability, 2)}, whatever states appeared earlier.</p></div><div class="p212-path-strip" aria-label="Sampled weather path">${state.realisedPath.map((weather, index) => `${index ? '<span class="p212-path-arrow" aria-hidden="true">→</span>' : ""}<span class="p212-path-state is-${weather}">${weather === "sunny" ? "Sunny" : "Rain"}</span>`).join("")}</div><div class="p212-path-actions"><button class="secondary-button" type="button" data-problem-action="p212-reset-path">New path</button><button class="primary-button" type="button" data-problem-action="p212-sample">Sample next weather</button></div><div class="p212-markov-rule">Markov property: P(Xₙ₊₁ | Xₙ,…,X₀)=P(Xₙ₊₁ | Xₙ).</div></section>`;
  }

  function dynamicMarkup() { return `<div class="p212-dynamic">${chainSvg()}${distributionEquationMarkup()}${distributionControlsMarkup()}${realisedPathMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p212-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p212-solution" aria-labelledby="p212-solution-heading"><h3 id="p212-solution-heading">Propagate the law three times</h3><p>Use row distributions, with columns ordered Sunny then Rain:</p><div class="p212-solution-equation">p₀=(1,0)<br>p₁=p₀P=(0.80,0.20)<br>p₂=p₁P=(0.70,0.30).</div><p>For day 3, gather all probability mass arriving at Rain:</p><div class="p212-solution-equation is-answer">P(R₃)=P(S₂)P(R|S)+P(R₂)P(R|R)<br>=(0.70)(0.20)+(0.30)(0.70)<br>=0.14+0.21=<strong>0.35 = 35%.</strong></div><p>A single sampled path might contain rain or sunshine on day 3; it does not change the 0.35 distributional probability. The Markov assumption only removes dependence on states before the current one—it does not make successive days independent.</p></section>`;
  }

  function snapshot() {
    const history = distributionHistory();
    const distribution = currentDistribution();
    const flow = state.distributionDay < MAX_DISTRIBUTION_DAY ? flowFrom(distribution) : null;
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, convention: "row distributions; P rows are current Sunny/Rain and columns are next Sunny/Rain", transitionMatrix: TRANSITION_MATRIX, rowSumResiduals: TRANSITION_MATRIX.map((row) => cleanZero(row[0] + row[1] - 1)), initialDistribution: INITIAL_DISTRIBUTION, distributionHistory: history.map(([sunny, rain], day) => ({ day, sunny, rain, sumResidual: cleanZero(sunny + rain - 1) })), displayedDay: state.distributionDay, displayedDistribution: { sunny: distribution[0], rain: distribution[1], sunnyTokens: Math.round(distribution[0] / TOKEN_MASS), rainTokens: Math.round(distribution[1] / TOKEN_MASS), tokenMass: TOKEN_MASS }, nextFlow: flow, challengeRainProbabilityAfter3Days: challenge[1], realisedPath: state.realisedPath, sampledSteps: state.sampledSteps, randomSeed: state.randomSeed, distinction: "a realised path is one sample; the distribution is probability mass over all possible paths", markovProperty: "the next-state distribution is conditional on the current state, not the complete earlier path", stage: state.stage, answer: state.answer, committed: state.committed, hintsUsed: state.hintsUsed, revealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.distributionDay = 3; }

  function render() {
    return `<main class="book-shell p212-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · stochastic processes</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p212-spread"><article class="book-page p212-problem-page"><div class="problem-number">Problem 21.2</div><h1 class="book-title p212-title">Tomorrow’s Weather, One Step at a Time</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p212-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A two-state weather model uses the transition matrix</p><div class="p212-matrix"><span aria-hidden="true">P=</span><table><caption class="sr-only">Weather transition matrix. Rows are current Sunny and Rain; columns are next Sunny and Rain.</caption><thead class="sr-only"><tr><th>Current state</th><th>Next Sunny</th><th>Next Rain</th></tr></thead><tbody><tr><th class="sr-only" scope="row">Current Sunny</th><td>0.8</td><td>0.2</td></tr><tr><th class="sr-only" scope="row">Current Rain</th><td>0.3</td><td>0.7</td></tr></tbody></table></div><p class="problem-copy">Rows give today’s state Sunny or Rain; columns give tomorrow’s state Sunny or Rain. Today is certainly sunny.</p><p class="problem-copy"><strong>What is the probability of rain three days from now?</strong></p><section class="p212-question-card"><strong>One model, two kinds of object</strong><p>The distribution carries probability mass across every possible history. A realised path samples only one of those histories.</p></section></article><section class="book-page book-stage p212-stage" aria-labelledby="p212-stage-heading">${stageControlsMarkup()}<div class="p212-stage-heading"><div><span class="eyebrow">Weather-chain laboratory</span><h2 id="p212-stage-heading">Follow probability, then sample a path</h2></div><p>Advance the distribution separately from the random weather path so the two ideas cannot be confused.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p212-coach"><div class="coach-kicker">Forecast day 3</div><p class="coach-question">Enter the probability of rain after three transitions. Decimal or percentage form is accepted.</p><form class="p212-answer-form" data-p212-answer-form novalidate><label for="p212-answer">Day-3 rain probability</label><input id="p212-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="0.35 or 35%"/><button class="primary-button" type="submit">Check probability</button></form>${feedbackMarkup()}<div class="button-row p212-help-row"><button class="secondary-button" type="button" data-problem-action="p212-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p212-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p212-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p212-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p212-reset") { state = initialState(); renderAndFocus(renderApp, '[data-problem-action="p212-next-day"]'); return; }
      if (action === "p212-stage") { state.stage = clamp(Math.round(control.dataset.p212Stage), 0, 2); renderAndFocus(renderApp, `[data-p212-stage="${state.stage}"]`); return; }
      if (action === "p212-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p212-stage="${state.stage}"]`); return; }
      if (action === "p212-next-day") { state.distributionDay = Math.min(MAX_DISTRIBUTION_DAY, state.distributionDay + 1); renderAndFocus(renderApp, '[data-problem-action="p212-next-day"]'); return; }
      if (action === "p212-previous-day") { state.distributionDay = Math.max(0, state.distributionDay - 1); renderAndFocus(renderApp, '[data-problem-action="p212-previous-day"]'); return; }
      if (action === "p212-sample") { sampleNextWeather(); renderAndFocus(renderApp, '[data-problem-action="p212-sample"]'); return; }
      if (action === "p212-reset-path") { state.realisedPath = ["sunny"]; state.sampledSteps = 0; state.randomSeed = INITIAL_RANDOM_SEED; renderAndFocus(renderApp, '[data-problem-action="p212-reset-path"]'); return; }
      if (action === "p212-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p212-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
    });
    root.querySelector("#p212-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root.querySelector("[data-p212-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = event.currentTarget.querySelector("#p212-answer")?.value.trim() || "";
      const answer = parseProbability(state.answer);
      state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a probability between 0 and 1, or an equivalent percentage between 0% and 100%.";
      else if (Math.abs(answer - .20) <= .002) state.feedback = "0.20 is the one-day rain probability when today is sunny. Propagate the whole distribution for two more days.";
      else if (Math.abs(answer - .30) <= .002) state.feedback = "0.30 is the rain probability after two days. Apply the transition rule once more.";
      else if (Math.abs(answer - .65) <= .002) state.feedback = "0.65 is the day-3 probability of sunshine. The requested rain probability is its complement.";
      else if (Math.abs(answer - challenge[1]) > .002) state.feedback = "At each step, combine probability arriving at Rain from both Sunny and Rain—not just one realised path.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: P(R₃)=0.70×0.20+0.30×0.70=0.35, or 35%."; state.committed = true; state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p212-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
