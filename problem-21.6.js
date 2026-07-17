(function registerStopWhileAheadPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "21.6";
  const LOWER_BOUNDARY = -1;
  const UPPER_BOUNDARY = 2;
  const EXACT_UPPER_HIT_PROBABILITY = 1 / 3;
  const EXACT_EXPECTED_STOPPING_TIME = 2;
  const EXACT_EXPECTED_TERMINAL_POSITION = 0;
  const DEFAULT_SEED = 21603;
  const DEFAULT_TRIALS = 512;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Paths", title: "Stop each path at its first boundary hit", copy: "Every path begins at 0, takes independent ±1 steps with equal probability, and ends the instant it first reaches −1 or +2. Do not continue a stopped path." }),
    Object.freeze({ short: "Chances", title: "Solve the boundary-value recurrence", copy: "The upper-hit chance h(x) is harmonic inside the interval: h(x)=[h(x−1)+h(x+1)]/2, with h(−1)=0 and h(2)=1. This makes h linear." }),
    Object.freeze({ short: "Stopping", title: "Audit expectations—and the hypotheses", copy: "Here the stopped position is bounded between −1 and 2, so E[X_T]=E[X_0]=0 is safe. Optional stopping is not a licence to use arbitrary unbounded betting rules." }),
  ]);
  const hints = Object.freeze([
    "Let q be the probability of hitting +2 before −1 when starting from 0.",
    "At stopping, X_T can only equal +2 or −1.",
    "The bounded stopped walk preserves its initial expectation: E[X_T]=E[X_0]=0.",
    "Therefore 2q+(−1)(1−q)=0.",
    "Solve 3q−1=0. The same answer follows from the harmonic recurrence with boundary values h(−1)=0 and h(2)=1.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p216-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 5) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseProbability(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", "."); const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/); if (fraction) { const denominator = Number(fraction[2]); return denominator === 0 ? NaN : Number(fraction[1]) / denominator; } return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN; }

  function seededGenerator(seed) {
    let value = Math.trunc(seed) >>> 0;
    return function random() { value += 0x6D2B79F5; let mixed = value; mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1); mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61); return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296; };
  }

  function simulateStoppedWalk(random) {
    let position = 0, time = 0; const positions = [0];
    while (position !== LOWER_BOUNDARY && position !== UPPER_BOUNDARY && time < 10000) { position += random() < .5 ? -1 : 1; time += 1; positions.push(position); }
    return { positions, time, terminalPosition: position, hitUpper: position === UPPER_BOUNDARY };
  }

  function simulationData(seed = DEFAULT_SEED, trials = DEFAULT_TRIALS) {
    const random = seededGenerator(seed), paths = [], stoppingCounts = Array(9).fill(0); let upperHits = 0, totalTime = 0, terminalSum = 0, maximumStoppingTime = 0;
    for (let trial = 0; trial < trials; trial += 1) {
      const path = simulateStoppedWalk(random); if (trial < 12) paths.push(path);
      if (path.hitUpper) upperHits += 1; totalTime += path.time; terminalSum += path.terminalPosition; maximumStoppingTime = Math.max(maximumStoppingTime, path.time);
      stoppingCounts[path.time <= 8 ? path.time - 1 : 8] += 1;
    }
    return { seed, trials, paths, upperHits, lowerHits: trials - upperHits, upperHitFrequency: upperHits / trials, lowerHitFrequency: (trials - upperHits) / trials, meanStoppingTime: totalTime / trials, meanTerminalPosition: terminalSum / trials, stoppingCounts, stoppingFrequencies: stoppingCounts.map((count) => count / trials), maximumStoppingTime };
  }

  function doublingData(horizon) {
    const lossProbability = 2 ** (-horizon), winProbability = 1 - lossProbability, lossMagnitude = 2 ** horizon - 1;
    return { horizon, winProbability, lossProbability, profitOnWin: 1, lossOnAllLosses: -lossMagnitude, expectedTruncatedProfit: winProbability - lossProbability * lossMagnitude, requiredCapital: lossMagnitude };
  }

  function initialState() { return { seed: DEFAULT_SEED, trials: DEFAULT_TRIALS, selectedPath: 0, comparisonOpen: false, doublingHorizon: 8, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();
  function currentSimulation() { return simulationData(state.seed, state.trials); }
  function restoreChallenge() { state.seed = DEFAULT_SEED; state.trials = DEFAULT_TRIALS; state.selectedPath = 0; }

  function stageControlsMarkup() { return `<div class="p216-stage-controls" role="group" aria-label="Stopped-random-walk reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p216-stage" data-p216-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p216-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p216-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Conditions audited" : "Next stage"}</button></div>`; }

  function pathMarkup(path, className, xStart, xScale, mapY) { return `<polyline class="${className}" points="${path.positions.map((position, index) => `${format(xStart + index * xScale, 3)},${mapY(position)}`).join(" ")}"/>`; }

  function simulatorSvg() {
    const data = currentSimulation(), selectedIndex = clamp(state.selectedPath, 0, data.paths.length - 1), selected = data.paths[selectedIndex];
    const maxPathTime = Math.max(4, ...data.paths.map((path) => path.time)), xStart = 64, xScale = 382 / maxPathTime, mapY = (position) => 205 - (position + 1) * 47;
    const showChances = state.stage >= 1 || state.revealed, showStopping = state.stage >= 2 || state.revealed;
    const histogramX = 51, histogramWidth = 660, binWidth = histogramWidth / 9, baseline = 420, histogramScale = 178;
    const exactStoppingFrequencies = Array.from({ length: 8 }, (_, index) => 2 ** (-(index + 1))).concat(2 ** -8);
    const description = `${data.trials} seeded symmetric random walks start at zero and stop on first reaching minus one or plus two. ${data.upperHits} hit plus two and ${data.lowerHits} hit minus one. The simulated upper-hit frequency is ${format(data.upperHitFrequency, 6)}, compared with exact one third. Mean stopping time is ${format(data.meanStoppingTime, 6)}, compared with exact 2. Mean terminal position is ${format(data.meanTerminalPosition, 6)}, compared with exact zero. Selected sample path ${selectedIndex + 1} stops after ${selected.time} steps at ${selected.terminalPosition}.`;
    return `<svg class="p216-simulator p216-stage-${state.stage}" viewBox="0 0 760 455" role="img" aria-labelledby="p216-sim-title p216-sim-desc"><title id="p216-sim-title">Seeded stopped-random-walk simulation</title><desc id="p216-sim-desc">${description}</desc><defs><linearGradient id="p216-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3b"/><stop offset="1" stop-color="#32283f"/></linearGradient></defs><rect class="p216-board" x="1" y="1" width="758" height="453" rx="20"/><text class="p216-board-kicker" x="23" y="28">SEEDED SAMPLE PATHS · FIRST BOUNDARY HIT STOPS EACH WALK</text><g class="p216-path-panel"><rect x="20" y="44" width="462" height="213" rx="15"/><text class="p216-panel-title" x="37" y="67">SAMPLE PATHS · SELECTED PATH ${selectedIndex + 1} OF ${data.paths.length}</text>${[-1,0,1,2].map((position) => `<line class="p216-level ${position === -1 || position === 2 ? "is-boundary" : ""}" x1="53" y1="${mapY(position)}" x2="454" y2="${mapY(position)}"/><text class="p216-level-label" x="42" y="${mapY(position) + 3}" text-anchor="end">${position > 0 ? "+" : ""}${position}</text>`).join("")}<text class="p216-boundary-label is-upper" x="449" y="${mapY(2) - 7}" text-anchor="end">STOP +2</text><text class="p216-boundary-label is-lower" x="449" y="${mapY(-1) - 7}" text-anchor="end">STOP −1</text><g class="p216-ghost-paths">${data.paths.map((path, index) => index === selectedIndex ? "" : pathMarkup(path, "p216-ghost-path", xStart, xScale, mapY)).join("")}</g>${pathMarkup(selected, `p216-selected-path ${selected.hitUpper ? "is-upper" : "is-lower"}`, xStart, xScale, mapY)}${selected.positions.map((position, index) => `<circle class="p216-path-point ${index === selected.time ? "is-terminal" : ""}" cx="${format(xStart + index * xScale, 3)}" cy="${mapY(position)}" r="${index === selected.time ? 5 : 3}"/>`).join("")}<text class="p216-selected-summary" x="254" y="242" text-anchor="middle">T=${selected.time} · X_T=${selected.terminalPosition > 0 ? "+" : ""}${selected.terminalPosition}</text></g><g class="p216-outcome-panel"><rect x="497" y="44" width="243" height="213" rx="15"/><text class="p216-panel-title" x="514" y="67">STOPPING OUTCOMES</text><text class="p216-outcome-label" x="514" y="102">hit +2 first</text><rect class="p216-outcome-track" x="514" y="112" width="204" height="23" rx="6"/><rect class="p216-outcome-fill is-upper" x="514" y="112" width="${format(204 * data.upperHitFrequency, 3)}" height="23" rx="6"/><line class="p216-exact-marker" x1="${514 + 204 / 3}" y1="107" x2="${514 + 204 / 3}" y2="140"/><text class="p216-outcome-value is-upper" x="718" y="102" text-anchor="end">${data.upperHits}/${data.trials} = ${format(data.upperHitFrequency, 4)}</text><text class="p216-outcome-label" x="514" y="165">hit −1 first</text><rect class="p216-outcome-track" x="514" y="175" width="204" height="23" rx="6"/><rect class="p216-outcome-fill is-lower" x="514" y="175" width="${format(204 * data.lowerHitFrequency, 3)}" height="23" rx="6"/><line class="p216-exact-marker" x1="${514 + 204 * 2 / 3}" y1="170" x2="${514 + 204 * 2 / 3}" y2="203"/><text class="p216-outcome-value is-lower" x="718" y="165" text-anchor="end">${data.lowerHits}/${data.trials} = ${format(data.lowerHitFrequency, 4)}</text><text class="p216-exact-note" x="514" y="225">${showChances ? "thin markers: exact 1/3 and 2/3" : "exact chances revealed at stage 2"}</text><text class="p216-terminal-mean" x="718" y="244" text-anchor="end">${showStopping ? `sample E[X_T]≈${format(data.meanTerminalPosition, 4)}` : "expectation at stage 3"}</text></g><g class="p216-histogram"><rect x="20" y="274" width="720" height="161" rx="15"/><text class="p216-panel-title" x="37" y="297">STOPPING-TIME HISTOGRAM · THIN EXACT LAW · LAST BIN IS T≥9</text>${data.stoppingFrequencies.map((frequency, index) => { const x = histogramX + index * binWidth + 8, empiricalHeight = histogramScale * frequency, exactHeight = histogramScale * exactStoppingFrequencies[index]; return `<g class="p216-hist-bin"><rect x="${format(x, 3)}" y="${format(baseline - empiricalHeight, 3)}" width="${format(binWidth - 17, 3)}" height="${format(empiricalHeight, 3)}" rx="3"/><line x1="${format(x - 3, 3)}" y1="${format(baseline - exactHeight, 3)}" x2="${format(x + binWidth - 12, 3)}" y2="${format(baseline - exactHeight, 3)}"/><text x="${format(x + (binWidth - 17) / 2, 3)}" y="431" text-anchor="middle">${index < 8 ? index + 1 : "9+"}</text></g>`; }).join("")}<text class="p216-hist-mean" x="716" y="313" text-anchor="end">${showStopping ? `mean T: ${format(data.meanStoppingTime, 4)} · exact 2` : "mean revealed at stage 3"}</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = currentSimulation();
    return `<section class="p216-controls" aria-label="Seeded simulation controls"><div class="p216-slider-grid"><label for="p216-trials"><span>Independent trials <output>${state.trials}</output></span><input id="p216-trials" type="range" min="64" max="2048" step="64" value="${state.trials}" aria-valuetext="${state.trials} seeded trials; ${data.upperHits} hit plus two; upper-hit frequency ${format(data.upperHitFrequency, 5)}"/></label><label for="p216-path"><span>Highlighted sample path <output>${state.selectedPath + 1}</output></span><input id="p216-path" type="range" min="1" max="${data.paths.length}" step="1" value="${state.selectedPath + 1}" aria-valuetext="sample path ${state.selectedPath + 1}; stops after ${data.paths[state.selectedPath].time} steps at ${data.paths[state.selectedPath].terminalPosition}"/></label></div><div class="p216-seed-row"><label for="p216-seed"><span>Deterministic seed</span><input id="p216-seed" type="number" min="1" max="999999" step="1" value="${state.seed}" inputmode="numeric"/></label><button class="secondary-button" type="button" data-problem-action="p216-new-seed">Change seed</button><button class="ghost-button" type="button" data-problem-action="p216-challenge">Restore challenge simulation</button></div><p>The seed makes every result reproducible. Simulation illustrates sampling variation; the exact values do not depend on the seed or trial count.</p></section>`;
  }

  function metricsMarkup() { const data = currentSimulation(); return `<section class="p216-metrics" aria-live="polite"><article><span>Hit +2 first</span><strong>${format(data.upperHitFrequency, 5)}</strong><small>exact 1/3</small></article><article><span>Mean stopping time</span><strong>${format(data.meanStoppingTime, 5)}</strong><small>exact E[T]=2</small></article><article><span>Mean terminal position</span><strong>${format(data.meanTerminalPosition, 5)}</strong><small>exact E[X_T]=0</small></article></section>`; }

  function comparisonMarkup() {
    const comparison = doublingData(state.doublingHorizon);
    return `<section class="p216-comparison"><button class="p216-comparison-toggle ghost-button" type="button" data-problem-action="p216-comparison" aria-expanded="${state.comparisonOpen}"><span><strong>Optional caveat: “double until win”</strong><small>Why an unbounded stopping strategy is different</small></span><span aria-hidden="true">${state.comparisonOpen ? "−" : "+"}</span></button>${state.comparisonOpen ? `<div class="p216-comparison-body"><p>Bet 1 on a fair coin; after each loss, double the next stake; stop at the first win. Every eventually completed path reports profit +1—but unbounded stakes break the hypotheses used for the bounded walk above.</p><label for="p216-horizon"><span>Audit at finite horizon N <output>${comparison.horizon}</output></span><input id="p216-horizon" type="range" min="1" max="16" step="1" value="${comparison.horizon}" aria-valuetext="finite horizon ${comparison.horizon}; all-loss probability ${format(comparison.lossProbability, 8)}; all-loss deficit ${comparison.requiredCapital}; expected truncated profit zero"/></label><div class="p216-betting-ledger"><article><span>win by N</span><strong>${format(comparison.winProbability, 8)}</strong><small>profit +1</small></article><article><span>N losses</span><strong>${format(comparison.lossProbability, 8)}</strong><small>profit −${comparison.requiredCapital}</small></article><article><span>finite-horizon expectation</span><strong>${format(comparison.expectedTruncatedProfit, 10)}</strong><small>rare large loss exactly balances wins</small></article></div><p class="p216-caveat"><strong>No contradiction:</strong> as N grows, the losing event becomes rarer while its loss grows without bound. The stopped betting process is not uniformly integrable, and the stake increments are unbounded. Optional-stopping conclusions require conditions; they do not hold for every stopping rule.</p></div>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p216-dynamic">${simulatorSvg()}${controlsMarkup()}${metricsMarkup()}${comparisonMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p216-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p216-solution" aria-labelledby="p216-solution-heading"><h3 id="p216-solution-heading" tabindex="-1">The nearer boundary wins with probability two thirds</h3><p>Let h(x) be the probability of reaching +2 before −1 from x. For x=0,1,</p><div class="p216-equation">h(x)=½h(x−1)+½h(x+1),<br>h(−1)=0, &nbsp; h(2)=1.</div><p>The harmonic solution is linear across the three-unit interval:</p><div class="p216-equation is-answer">h(x)=(x+1)/3,<br>so <strong>P₀(hit +2 first)=h(0)=1/3.</strong></div><p>For the mean stopping time, m(x)=1+½m(x−1)+½m(x+1), with zero boundary values. Solving the two interior equations gives</p><div class="p216-equation">m(0)=m(1)=2, so <strong>E[T]=2.</strong></div><p>The stopped position is bounded and takes only −1 or +2. Consequently</p><div class="p216-equation">E[X<sub>T</sub>]=(−1)(2/3)+2(1/3)=0=E[X<sub>0</sub>].</div><p>This is a valid bounded optional-stopping setting. It does not imply that every stopping strategy preserves expectations. “Double until win” uses unbounded stakes: at any finite horizon its rare all-loss outcome exactly restores expectation zero, and the limiting interchange needed to claim otherwise is invalid.</p></section>`;
  }

  function snapshot() {
    const data = currentSimulation(), comparison = doublingData(state.doublingHorizon);
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, walk: { start: 0, increments: [-1,1], incrementProbabilities: [.5,.5], stoppingRule: "first hit of -1 or +2", lowerBoundary: LOWER_BOUNDARY, upperBoundary: UPPER_BOUNDARY }, exact: { upperHitProbability: EXACT_UPPER_HIT_PROBABILITY, lowerHitProbability: 1 - EXACT_UPPER_HIT_PROBABILITY, expectedStoppingTime: EXACT_EXPECTED_STOPPING_TIME, expectedTerminalPosition: EXACT_EXPECTED_TERMINAL_POSITION, terminalExpectationCheck: -1 * (2/3) + 2 * (1/3), stoppingTimeDistribution: "P(T=n)=2^-n for n>=1" }, simulation: { seed: data.seed, trials: data.trials, upperHits: data.upperHits, lowerHits: data.lowerHits, upperHitFrequency: data.upperHitFrequency, meanStoppingTime: data.meanStoppingTime, meanTerminalPosition: data.meanTerminalPosition, maximumStoppingTime: data.maximumStoppingTime, stoppingCounts: data.stoppingCounts, selectedPathIndex: state.selectedPath, selectedPath: data.paths[state.selectedPath] }, optionalStoppingConditions: { boundedStoppedPosition: true, stoppedPositionBounds: [-1,2], conclusion: "E[X_T]=E[X_0] is justified here", warning: "optional-stopping conclusions require hypotheses and do not apply to all stopping rules" }, doublingComparison: { open: state.comparisonOpen, horizon: comparison.horizon, winByHorizonProbability: comparison.winProbability, allLossProbability: comparison.lossProbability, allLossDeficit: comparison.lossOnAllLosses, requiredCapital: comparison.requiredCapital, expectedTruncatedProfit: comparison.expectedTruncatedProfit, caveat: "unbounded stakes; stopped process not uniformly integrable" }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p216-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Stochastic Processes</strong><span class="eyebrow">Chapter 21 · stopping times</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p216-spread"><article class="book-page p216-problem-page"><div class="problem-number">Problem 21.6</div><h1 class="book-title p216-title">Stop While You’re Ahead?</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p216-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A symmetric random walk starts at X<sub>0</sub>=0. Each step is +1 or −1 with equal probability. Stop it the first time it reaches −1 or +2.</p><p class="problem-copy"><strong>What is the probability that it hits +2 before −1?</strong></p><section class="p216-question-card"><strong>Stopping changes which paths remain visible</strong><p>The walk ends at its first boundary hit. A simulation estimates the outcome split; the recurrence gives the exact probability.</p></section><section class="p216-given-grid" aria-label="Stopped walk challenge"><span>start <strong>0</strong></span><span>lower stop <strong>−1</strong></span><span>upper stop <strong>+2</strong></span><span>step chances <strong>1/2, 1/2</strong></span></section></article><section class="book-page book-stage p216-stage" aria-labelledby="p216-stage-heading">${stageControlsMarkup()}<div class="p216-stage-heading"><div><span class="eyebrow">Seeded stopping laboratory</span><h2 id="p216-stage-heading">Separate sample evidence from exact structure</h2></div><p>Change the seed and trial count, inspect paths, then audit when an optional-stopping argument is justified.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p216-coach"><div class="coach-kicker">Hit the upper boundary</div><p class="coach-question">Enter the exact probability that +2 is reached before −1.</p><form class="p216-answer-form" data-p216-answer-form novalidate><label for="p216-answer">Upper-hit probability</label><input id="p216-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal"/><small>Fractions such as 1/3 are accepted.</small><button class="primary-button" type="submit">Check probability</button></form>${feedbackMarkup()}<div class="button-row p216-help-row"><button class="secondary-button" type="button" data-problem-action="p216-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p216-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p216-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelectorFor(active) {
    if (!active) return ""; if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p216-shell"); if (!root) return; const dynamic = root.querySelector(".p216-dynamic"), selector = dynamic?.contains(document.activeElement) ? focusSelectorFor(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup(); root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) { const replacement = root.querySelector(selector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p216-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return; const action = control.dataset.problemAction;
      if (action === "p216-reset") { state = initialState(); renderAndFocus(renderApp, "#p216-trials"); return; }
      if (action === "p216-stage") { state.stage = clamp(Number(control.dataset.p216Stage), 0, 2); renderAndFocus(renderApp, `[data-p216-stage="${state.stage}"]`); return; }
      if (action === "p216-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p216-stage="${state.stage}"]`); return; }
      if (action === "p216-new-seed") { state.seed = (state.seed + 7919 - 1) % 999999 + 1; updateDynamicDom(); return; }
      if (action === "p216-challenge") { restoreChallenge(); updateDynamicDom(); return; }
      if (action === "p216-comparison") { state.comparisonOpen = !state.comparisonOpen; updateDynamicDom(); return; }
      if (action === "p216-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p216-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p216-reveal") window.requestAnimationFrame(() => document.querySelector("#p216-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p216-trials")) { state.trials = clamp(Math.round(Number(event.target.value) / 64) * 64, 64, 2048); state.selectedPath = Math.min(state.selectedPath, 11); updateDynamicDom(); return; }
      if (event.target.matches("#p216-path")) { state.selectedPath = clamp(Math.round(Number(event.target.value)) - 1, 0, 11); updateDynamicDom(); return; }
      if (event.target.matches("#p216-horizon")) { state.doublingHorizon = clamp(Math.round(Number(event.target.value)), 1, 16); updateDynamicDom(); return; }
      if (event.target.matches("#p216-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root?.addEventListener("change", (event) => {
      if (!event.target.matches("#p216-seed")) return;
      state.seed = clamp(Math.round(Number(event.target.value) || DEFAULT_SEED), 1, 999999); state.selectedPath = 0; updateDynamicDom();
    });
    root?.querySelector("[data-p216-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p216-answer")?.value || "", answer = parseProbability(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a probability between 0 and 1, as a fraction or decimal.";
      else if (Math.abs(answer - 2 / 3) < .002) state.feedback = "Two thirds is the chance of hitting the nearer lower boundary −1. The question asks for +2.";
      else if (Math.abs(answer - .5) < .002) state.feedback = "The first step is fair, but +2 is farther from the start than −1. Include paths that return to 0 and try again.";
      else if (Math.abs(answer - EXACT_UPPER_HIT_PROBABILITY) > .0005) state.feedback = "Let q=P(hit +2 first). At stopping, 0=E[X_T]=2q−(1−q).";
      else { state.feedbackTone = "success"; state.feedback = "Correct: 2q−(1−q)=0 gives q=1/3."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p216-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
