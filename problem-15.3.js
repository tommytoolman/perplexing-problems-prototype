(function registerLastRedTilePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "15.3";
  const TRIAL_SEED = 150303;
  const SIMULATION_SEED = 153153;
  const CHALLENGE = Object.freeze({ redCount: 4, blueCount: 6 });
  const stages = Object.freeze([
    Object.freeze({ short: "Shuffle", title: "Reveal one seeded ordering", copy: "Every ordering of the selected red and blue tiles is treated as equally likely. Reveal until the final red tile becomes identifiable." }),
    Object.freeze({ short: "Distribution", title: "Compare exact probabilities with repeated shuffles", copy: "For the last red to occupy position k, choose the other red positions from the first k−1 places and force position k to be red." }),
    Object.freeze({ short: "Expectation", title: "Average the last-red position without listing every ordering", copy: "The blue tiles form exchangeable gaps around the reds. On average, one of the R+1 equal gaps lies after the last red." }),
  ]);
  const hints = Object.freeze([
    "If the last red is at position k, then position k is red and all other R−1 red positions must be chosen from positions 1 through k−1.",
    "There are C(N,R) equally likely sets of red positions, so P(M=k)=C(k−1,R−1)/C(N,R).",
    "For the expectation, imagine the B blue tiles split among the R+1 gaps before, between and after the red tiles.",
    "Those gaps are exchangeable, so the expected trailing blue gap is B/(R+1). Hence E[M]=N−B/(R+1)=R(N+1)/(R+1).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p153-reset">Reset</button>';

  const initialState = () => ({ redCount: 4, blueCount: 6, shuffleNumber: 1, revealedCount: 0, stage: 0, simulationSize: 0, simulationCounts: [], simulationMean: null, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeAnswer(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.\/\-\s]/g, "").slice(0, 24); }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function choose(n, k) {
    if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return 0;
    const smaller = Math.min(k, n - k);
    let value = 1;
    for (let index = 1; index <= smaller; index += 1) value = value * (n - smaller + index) / index;
    return Math.round(value);
  }

  function shuffleWithRandom(redCount, blueCount, random) {
    const tiles = [...Array(redCount).fill("red"), ...Array(blueCount).fill("blue")];
    for (let index = tiles.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
    }
    return tiles;
  }

  function trialSeed() { return TRIAL_SEED + state.redCount * 100003 + state.blueCount * 1009 + state.shuffleNumber * 7919; }
  function currentTiles() { return shuffleWithRandom(state.redCount, state.blueCount, mulberry32(trialSeed())); }
  function lastRedPosition(tiles) { return tiles.lastIndexOf("red") + 1; }

  function modelData(redCount = state.redCount, blueCount = state.blueCount) {
    const total = redCount + blueCount;
    const denominator = choose(total, redCount);
    const distribution = Array.from({ length: blueCount + 1 }, (_, offset) => {
      const position = redCount + offset;
      const numerator = choose(position - 1, redCount - 1);
      return { position, numerator, denominator, probability: numerator / denominator };
    });
    const expectation = redCount * (total + 1) / (redCount + 1);
    const expectationFromDistribution = distribution.reduce((sum, entry) => sum + entry.position * entry.probability, 0);
    const probabilitySum = distribution.reduce((sum, entry) => sum + entry.probability, 0);
    const trailingBlueExpected = blueCount / (redCount + 1);
    return { redCount, blueCount, total, denominator, distribution, expectation, expectationFromDistribution, probabilitySum, trailingBlueExpected };
  }

  const challengeValues = modelData(CHALLENGE.redCount, CHALLENGE.blueCount);

  function originalExtensionNote() {
    return `<p class="p153-extension-note"><strong>Original extension.</strong> This chapter and activity were created for this project and do not appear in Professor Povey’s <em>Perplexing Problems</em>.</p>`;
  }

  function stageControls() {
    return `<div class="p153-stage-controls" role="group" aria-label="Last-red order-statistic stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p153-stage" data-p153-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p153-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p153-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Expectation exposed" : "Next stage"}</button></div>`;
  }

  function tileSequenceMarkup() {
    const tiles = currentTiles();
    const lastPosition = lastRedPosition(tiles);
    const lastKnown = state.revealedCount >= lastPosition;
    const redSeen = tiles.slice(0, state.revealedCount).filter((tile) => tile === "red").length;
    return `<section class="p153-trial-card" aria-labelledby="p153-trial-title"><header><div><span class="eyebrow">Seeded trial ${state.shuffleNumber}</span><h3 id="p153-trial-title">Reveal the shuffled row</h3></div><p>Seed ${trialSeed().toLocaleString("en-GB")} · ${state.redCount} red + ${state.blueCount} blue</p></header><div class="p153-tile-row" role="list" aria-label="Shuffled tile positions">${tiles.map((tile, index) => { const revealed = index < state.revealedCount; const isLast = revealed && tile === "red" && index + 1 === lastPosition; const label = revealed ? `Position ${index + 1}: ${tile}${isLast ? ", the last red tile" : ""}` : `Position ${index + 1}: face down`; return `<span class="p153-tile ${revealed ? `is-${tile}` : "is-hidden"} ${isLast ? "is-last" : ""}" role="listitem" aria-label="${label}"><b>${index + 1}</b><i>${revealed ? tile === "red" ? "R" : "B" : "?"}</i></span>`; }).join("")}</div><div class="p153-trial-status" aria-live="polite"><div><span>Revealed</span><strong>${state.revealedCount} / ${tiles.length}</strong></div><div><span>Red found</span><strong>${redSeen} / ${state.redCount}</strong></div><div><span>Last-red position</span><strong>${lastKnown ? lastPosition : "not known yet"}</strong></div></div><p class="p153-trial-message">${lastKnown ? `All ${state.redCount} red tiles have appeared. The last one is at position ${lastPosition}; any unrevealed tiles must be blue.` : state.revealedCount ? "Keep revealing until every red tile has appeared." : "The ordering is fixed by the displayed seed. Reveal it without changing the trial."}</p><div class="p153-trial-actions"><button class="primary-button" type="button" data-problem-action="p153-reveal-next" ${state.revealedCount >= tiles.length ? "disabled" : ""}>Reveal next tile</button><button class="secondary-button" type="button" data-problem-action="p153-reveal-all" ${state.revealedCount >= tiles.length ? "disabled" : ""}>Reveal whole row</button><button class="ghost-button" type="button" data-problem-action="p153-new-shuffle">New seeded shuffle</button></div></section>`;
  }

  function runSimulation(size) {
    const random = mulberry32(SIMULATION_SEED + state.redCount * 65537 + state.blueCount * 4099);
    const total = state.redCount + state.blueCount;
    const counts = Array(total + 1).fill(0);
    let sum = 0;
    for (let trial = 0; trial < size; trial += 1) {
      const position = lastRedPosition(shuffleWithRandom(state.redCount, state.blueCount, random));
      counts[position] += 1;
      sum += position;
    }
    state.simulationSize = size;
    state.simulationCounts = counts;
    state.simulationMean = sum / size;
  }

  function distributionMarkup() {
    const values = modelData();
    const maxProbability = Math.max(...values.distribution.map((entry) => entry.probability));
    const rows = values.distribution.map((entry) => {
      const observed = state.simulationSize ? state.simulationCounts[entry.position] / state.simulationSize : null;
      const exactWidth = 100 * entry.probability / maxProbability;
      const observedWidth = observed === null ? 0 : 100 * observed / maxProbability;
      return `<div class="p153-distribution-row" aria-label="Last red at position ${entry.position}: exact probability ${format(entry.probability * 100, 4)} percent${observed === null ? "" : `; simulation ${format(observed * 100, 4)} percent`}"><strong>${entry.position}</strong><div class="p153-bar-pair"><span class="p153-exact-bar" style="width:${format(exactWidth, 5)}%"></span><span class="p153-sim-bar" style="width:${format(Math.min(100, observedWidth), 5)}%"></span></div><div><b>${format(entry.probability * 100, 2)}%</b><small>${observed === null ? "—" : `${format(observed * 100, 2)}%`}</small></div></div>`;
    }).join("");
    return `<section class="p153-distribution-card" aria-labelledby="p153-distribution-title"><header><div><span class="eyebrow">Exact against experiment</span><h3 id="p153-distribution-title">Where can the last red land?</h3></div><div class="p153-legend"><span><i class="exact"></i>exact</span><span><i class="sim"></i>seeded simulation</span></div></header><div class="p153-formula">P(M=k)=C(k−1, R−1) / C(N, R), &nbsp; k=R,…,N</div><div class="p153-distribution-rows">${rows}</div><div class="p153-simulation-controls"><div role="group" aria-label="Simulation sample size">${[100, 1000, 10000].map((size) => `<button class="chip-button ${state.simulationSize === size ? "active" : ""}" type="button" data-problem-action="p153-simulate" data-p153-size="${size}" aria-pressed="${state.simulationSize === size}">${size.toLocaleString("en-GB")} shuffles</button>`).join("")}</div><p aria-live="polite">${state.simulationSize ? `Observed mean ${format(state.simulationMean, 5)} from ${state.simulationSize.toLocaleString("en-GB")} reproducible shuffles; exact mean ${format(values.expectation, 5)}.` : "Run the reproducible simulation to overlay observed frequencies."}</p></div></section>`;
  }

  function expectationMarkup() {
    const values = modelData();
    return `<section class="p153-expectation-card" aria-labelledby="p153-expectation-title"><div><span class="eyebrow">Exchangeable-gap shortcut</span><h3 id="p153-expectation-title">One average trailing gap</h3><p>The ${state.blueCount} blue tiles occupy ${state.redCount + 1} symmetric gaps: before the first red, between neighbouring reds, and after the last red.</p></div><div class="p153-gap-strip" aria-label="${state.redCount + 1} exchangeable blue-tile gaps">${Array.from({ length: state.redCount + 1 }, (_, index) => `<span><b>gap ${index}</b><i>mean ${format(values.trailingBlueExpected, 3)} blue</i></span>`).join("")}</div><div class="p153-expectation-equation">E[M]=N−E[trailing blue]<br>=${values.total}−${state.blueCount}/(${state.redCount}+1)<br><strong>=${format(values.expectation, 6)}</strong></div><p class="p153-audit">Distribution check: ΣP=${format(values.probabilitySum, 10)} and ΣkP=${format(values.expectationFromDistribution, 10)}.</p></section>`;
  }

  function metricsMarkup() {
    const values = modelData();
    return `<section class="p153-metrics" aria-live="polite"><div><span>Total orderings of red positions</span><strong>C(${values.total},${state.redCount})=${values.denominator.toLocaleString("en-GB")}</strong></div><div><span>Possible last-red positions</span><strong>${state.redCount} through ${values.total}</strong></div><div><span>Exact expected position</span><strong>${state.stage >= 2 || state.revealed ? format(values.expectation, 6) : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p153-dynamic">${tileSequenceMarkup()}${state.stage >= 1 || state.revealed ? distributionMarkup() : ""}${state.stage >= 2 || state.revealed ? expectationMarkup() : ""}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p153-controls" aria-label="Tile population controls"><div class="p153-control-grid"><label for="p153-red-count"><span>Red tiles R<output data-p153-output="red">${state.redCount}</output></span><input id="p153-red-count" type="range" min="1" max="8" step="1" value="${state.redCount}"/></label><label for="p153-blue-count"><span>Blue tiles B<output data-p153-output="blue">${state.blueCount}</output></span><input id="p153-blue-count" type="range" min="1" max="12" step="1" value="${state.blueCount}"/></label></div><p>Changing a count starts a fresh deterministic trial and clears the simulation. The answer box always refers to the fixed challenge with four red and six blue tiles.</p><button class="chip-button" type="button" data-problem-action="p153-challenge">Restore 4 red + 6 blue</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p153-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p153-solution" aria-labelledby="p153-solution-heading"><h3 id="p153-solution-heading" tabindex="-1">Average the blue gap after the final red</h3><p>For R red and B blue tiles, place the red tiles in order and regard the blues as occupying R+1 gaps around them. Symmetry makes the expected population of every gap B/(R+1), including the trailing gap after the last red.</p><div class="p153-solution-equation">E[M]=R+B−B/(R+1)<br>=R(R+B+1)/(R+1)</div><p>For four red and six blue tiles, N=10:</p><div class="p153-solution-equation is-answer">E[M]=4(10+1)/(4+1)<br>=44/5=8.8</div><p>The exact distribution gives the same result:</p><div class="p153-solution-equation">P(M=k)=C(k−1,3)/C(10,4), &nbsp;k=4,…,10<br>ΣkP(M=k)=44/5.</div><p>An expectation need not be a possible observed position: every trial ends at an integer, but their long-run average is 8.8.</p></section>`;
  }

  function parseAnswer(raw) {
    const cleaned = sanitizeAnswer(raw).trim();
    const fraction = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator === 0 ? NaN : Number(fraction[1]) / denominator; }
    return Number(cleaned);
  }

  function snapshot() {
    const values = modelData();
    const tiles = currentTiles();
    return JSON.stringify({ problem: PROBLEM, provenance: "original extension created for this project; not in Professor Povey's Perplexing Problems", model: "uniform random ordering of fixed red and blue tile counts", trialSeed: trialSeed(), shuffleNumber: state.shuffleNumber, redTiles: state.redCount, blueTiles: state.blueCount, totalTiles: values.total, revealedTiles: state.revealedCount, currentTrial: tiles.map((tile) => tile === "red" ? "R" : "B").join(""), currentTrialLastRedPosition: lastRedPosition(tiles), exactDistribution: values.distribution.map((entry) => ({ position: entry.position, numerator: entry.numerator, denominator: entry.denominator, probability: Number(entry.probability.toFixed(12)) })), exactExpectedLastRedPosition: Number(values.expectation.toFixed(12)), distributionProbabilitySum: Number(values.probabilitySum.toFixed(12)), simulationSeed: SIMULATION_SEED, simulationSize: state.simulationSize, simulationMean: state.simulationMean === null ? null : Number(state.simulationMean.toFixed(12)), stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function resetExperiment() { state.shuffleNumber = 1; state.revealedCount = 0; state.simulationSize = 0; state.simulationCounts = []; state.simulationMean = null; }
  function restoreChallenge() { state.redCount = CHALLENGE.redCount; state.blueCount = CHALLENGE.blueCount; resetExperiment(); }

  function render() {
    return `<main class="book-shell p153-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · discrete probability</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p153-spread"><article class="book-page p153-problem-page"><div class="problem-number">Problem 15.3</div><h1 class="book-title p153-title">The Last Red Tile</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${originalExtensionNote()}<p class="problem-copy">Four red and six blue tiles are uniformly shuffled into a row. Let M be the position of the last red tile, counting from 1.</p><p class="problem-copy"><strong>Find the exact expected value E[M].</strong></p><section class="p153-observation-card"><strong>The final position is random, but structured</strong><p>The last red cannot appear before position 4. Every later position has a different combinatorial weight.</p></section><section class="p153-model-card"><div class="eyebrow">Uniform-ordering model</div><p>Only colour matters; every choice of four red positions among the ten positions is equally likely.</p></section></article><section class="book-page book-stage p153-stage">${stageControls()}<div class="p153-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p153-coach"><div class="coach-kicker">Average the final red</div><p class="coach-question">For exactly four red and six blue tiles, enter E[M] as a fraction or decimal.</p><form class="p153-answer-form" data-p153-answer-form novalidate><label for="p153-answer">Expected last-red position</label><div><input id="p153-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal" autocomplete="off"/><span>position</span></div><button class="primary-button" type="submit">Check expectation</button></form>${feedbackMarkup()}<div class="button-row p153-help-row"><button class="secondary-button" type="button" data-problem-action="p153-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p153-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p153-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p153-shell"); if (!root) return;
    const dynamic = root.querySelector(".p153-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const redOutput = root.querySelector('[data-p153-output="red"]'); if (redOutput) redOutput.textContent = state.redCount;
    const blueOutput = root.querySelector('[data-p153-output="blue"]'); if (blueOutput) blueOutput.textContent = state.blueCount;
    const values = modelData();
    root.querySelector("#p153-red-count")?.setAttribute("aria-valuetext", `${state.redCount} red tiles; ${values.total} total; exact expected last-red position ${format(values.expectation, 4)}`);
    root.querySelector("#p153-blue-count")?.setAttribute("aria-valuetext", `${state.blueCount} blue tiles; ${values.total} total; last red can occupy positions ${state.redCount} through ${values.total}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p153-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control || !root.contains(control)) return;
      const action = control.dataset.problemAction;
      if (action === "p153-reset") { state = initialState(); renderAndFocus(renderApp, "#p153-red-count"); return; }
      if (action === "p153-stage") { state.stage = clamp(Number(control.dataset.p153Stage), 0, 2); renderAndFocus(renderApp, `[data-p153-stage="${state.stage}"]`); return; }
      if (action === "p153-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p153-stage="${state.stage}"]`); return; }
      if (action === "p153-reveal-next") state.revealedCount = Math.min(state.redCount + state.blueCount, state.revealedCount + 1);
      if (action === "p153-reveal-all") state.revealedCount = state.redCount + state.blueCount;
      if (action === "p153-new-shuffle") { state.shuffleNumber += 1; state.revealedCount = 0; }
      if (action === "p153-simulate") runSimulation(clamp(Number(control.dataset.p153Size), 100, 10000));
      if (action === "p153-challenge") restoreChallenge();
      if (action === "p153-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p153-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p153-reveal") window.requestAnimationFrame(() => document.querySelector("#p153-solution-heading")?.focus());
    });
    [["#p153-red-count", "redCount", 1, 8], ["#p153-blue-count", "blueCount", 1, 12]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); resetExperiment(); updateDynamicDom(); }));
    const input = document.querySelector("#p153-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeAnswer(event.target.value); });
    document.querySelector("[data-p153-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeAnswer(input?.value).trim(); const answer = parseAnswer(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one exact fraction or decimal expected position.";
      else if (answer === 9) state.feedback = "Nine is a plausible rounded guess, but an expectation need not be an integer. Keep the exact average.";
      else if (Math.abs(answer - challengeValues.expectation) > 1e-10) state.feedback = "Use the R+1 exchangeable blue gaps, or weight positions 4 through 10 by their exact probabilities.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: E[M]=44/5=8.8. Individual trials are integral, but their long-run mean need not be."; }
      renderAndFocus(renderApp, "#p153-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
