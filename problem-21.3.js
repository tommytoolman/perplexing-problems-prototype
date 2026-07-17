(function registerThreeRoomShufflePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "21.3";
  const ROOMS = Object.freeze(["A", "B", "C"]);
  const QUARTER_MATRIX = Object.freeze([Object.freeze([2, 2, 0]), Object.freeze([1, 2, 1]), Object.freeze([0, 2, 2])]);
  const STATIONARY_NUMERATORS = Object.freeze([1, 2, 1]);
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Move", title: "Read one row as one room’s next move", copy: "A walker in room A stays in A with probability 1/2 or moves to B with probability 1/2. Every matrix row is a complete next-step distribution from its named room." }),
    Object.freeze({ short: "Distribute", title: "Propagate a distribution, not a promised route", copy: "Multiply the current row vector by P. The bars track exact fractions for the whole probability distribution; the dots are a 32-walker illustration." }),
    Object.freeze({ short: "Converge", title: "Measure the remaining distance from stationarity", copy: "Compare pₙ with π using total variation: half the sum of the three absolute probability differences. It tends to zero even though a realised walker keeps changing rooms." }),
  ]);
  const hints = Object.freeze([
    "Start with p₀=(1,0,0), because the walker is certainly in room A.",
    "Use row vectors: pₙ₊₁=pₙP. After one step, p₁=(1/2,1/2,0).",
    "Continuing gives p₂=(3/8,1/2,1/8), then p₃=(5/16,1/2,3/16).",
    "After four steps, p₄=(9/32,1/2,7/32). Compare this with π=(8/32,16/32,8/32).",
    "Total variation is (1/2)Σᵢ|p₄(i)−π(i)|=(1/2)(1/32+0+1/32).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p213-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function gcd(a, b) { let x = Math.abs(Math.round(a)), y = Math.abs(Math.round(b)); while (y) { const remainder = x % y; x = y; y = remainder; } return x || 1; }
  function reduceFraction(numerator, denominator) { const divisor = gcd(numerator, denominator); return { numerator: numerator / divisor, denominator: denominator / divisor }; }
  function fractionText(numerator, denominator) { const reduced = reduceFraction(numerator, denominator); return reduced.denominator === 1 ? String(reduced.numerator) : `${reduced.numerator}/${reduced.denominator}`; }
  function format(value, digits = 5) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseProbability(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", "."); const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/); if (fraction) { const denominator = Number(fraction[2]); return denominator === 0 ? NaN : Number(fraction[1]) / denominator; } return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN; }

  function distributionData(startRoom = "A", steps = 0) {
    const startIndex = Math.max(0, ROOMS.indexOf(startRoom));
    let counts = ROOMS.map((_, index) => index === startIndex ? 1 : 0), denominator = 1;
    for (let step = 0; step < steps; step += 1) {
      counts = ROOMS.map((_, column) => counts.reduce((sum, count, row) => sum + count * QUARTER_MATRIX[row][column], 0));
      denominator *= 4;
      const divisor = counts.reduce((result, count) => gcd(result, count), denominator);
      counts = counts.map((count) => count / divisor); denominator /= divisor;
    }
    const probabilities = counts.map((count) => count / denominator);
    const totalVariationRawNumerator = counts.reduce((sum, count, index) => sum + Math.abs(4 * count - STATIONARY_NUMERATORS[index] * denominator), 0);
    const totalVariation = reduceFraction(totalVariationRawNumerator, 8 * denominator);
    const totalVariationDecimal = .5 * probabilities.reduce((sum, probability, index) => sum + Math.abs(probability - STATIONARY_NUMERATORS[index] / 4), 0);
    const nextProbabilities = ROOMS.map((_, column) => probabilities.reduce((sum, probability, row) => sum + probability * QUARTER_MATRIX[row][column] / 4, 0));
    return { startRoom: ROOMS[startIndex], steps, counts, denominator, probabilities, nextProbabilities, totalVariation, totalVariationDecimal, totalProbability: probabilities.reduce((sum, probability) => sum + probability, 0) };
  }

  const CHALLENGE_DATA = Object.freeze(distributionData("A", 4));
  function initialState() { return { startRoom: "A", step: 4, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();
  function currentData() { return distributionData(state.startRoom, state.step); }
  function restoreChallenge() { state.startRoom = "A"; state.step = 4; }

  function allocateWalkers(probabilities, total = 32) {
    const raw = probabilities.map((probability) => probability * total), allocation = raw.map(Math.floor);
    let remaining = total - allocation.reduce((sum, count) => sum + count, 0);
    raw.map((value, index) => ({ index, remainder: value - allocation[index] })).sort((a, b) => b.remainder - a.remainder || a.index - b.index).forEach(({ index }) => { if (remaining > 0) { allocation[index] += 1; remaining -= 1; } });
    return allocation;
  }

  function stageControlsMarkup() { return `<div class="p213-stage-controls" role="group" aria-label="Markov-chain reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p213-stage" data-p213-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p213-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p213-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Convergence exposed" : "Next stage"}</button></div>`; }

  function walkerDots(roomIndex, count) {
    const roomX = [50, 295, 540][roomIndex], roomY = 61;
    return Array.from({ length: count }, (_, index) => { const column = index % 8, row = Math.floor(index / 8); return `<circle cx="${roomX + 27 + column * 16}" cy="${roomY + 66 + row * 15}" r="5"/>`; }).join("");
  }

  function shuffleSvg() {
    const data = currentData(), walkers = allocateWalkers(data.probabilities), showDistribution = state.stage >= 1 || state.revealed, showTv = state.stage >= 2 || state.revealed;
    const barX = 169, barWidth = 375, rowY = [296, 344, 392];
    const description = `Starting in room ${data.startRoom}, after ${data.steps} steps the exact distribution is A ${fractionText(data.counts[0], data.denominator)}, B ${fractionText(data.counts[1], data.denominator)}, C ${fractionText(data.counts[2], data.denominator)}. The stationary distribution is one quarter, one half, one quarter. Total variation distance is ${fractionText(data.totalVariation.numerator, data.totalVariation.denominator)}, or ${format(data.totalVariationDecimal, 6)}. The 32 displayed walkers are a rounded illustration with ${walkers[0]}, ${walkers[1]}, and ${walkers[2]} dots in rooms A, B, and C.`;
    return `<svg class="p213-shuffle p213-stage-${state.stage}" viewBox="0 0 760 455" role="img" aria-labelledby="p213-shuffle-title p213-shuffle-desc"><title id="p213-shuffle-title">Three-room Markov chain and exact distribution</title><desc id="p213-shuffle-desc">${description}</desc><defs><linearGradient id="p213-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172d3a"/><stop offset="1" stop-color="#2d293f"/></linearGradient><marker id="p213-arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p213-arrow-gold" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p213-board" x="1" y="1" width="758" height="453" rx="20"/><text class="p213-board-kicker" x="23" y="28">32-WALKER ILLUSTRATION ABOVE · EXACT PROBABILITY DISTRIBUTION BELOW</text><g class="p213-rooms">${ROOMS.map((room, index) => `<g class="p213-room is-${room.toLowerCase()}"><rect x="${[50,295,540][index]}" y="61" width="170" height="140" rx="18"/><text class="p213-room-name" x="${[135,380,625][index]}" y="87" text-anchor="middle">ROOM ${room}</text><text class="p213-room-probability" x="${[135,380,625][index]}" y="108" text-anchor="middle">p=${fractionText(data.counts[index], data.denominator)}</text><g class="p213-walkers">${walkerDots(index, walkers[index])}</g></g>`).join("")}</g><g class="p213-transitions"><path class="p213-self is-a" d="M76 68C69 36 201 36 194 68" marker-end="url(#p213-arrow-blue)"/><path class="p213-self is-b" d="M321 68C314 36 446 36 439 68" marker-end="url(#p213-arrow-gold)"/><path class="p213-self is-c" d="M566 68C559 36 691 36 684 68" marker-end="url(#p213-arrow-blue)"/><text x="135" y="44" text-anchor="middle">stay .50</text><text x="380" y="44" text-anchor="middle">stay .50</text><text x="625" y="44" text-anchor="middle">stay .50</text><line class="p213-link is-forward" x1="221" y1="112" x2="292" y2="112" marker-end="url(#p213-arrow-blue)"/><line class="p213-link is-back" x1="292" y1="151" x2="221" y2="151" marker-end="url(#p213-arrow-gold)"/><text x="256" y="104" text-anchor="middle">A→B .50</text><text x="256" y="169" text-anchor="middle">B→A .25</text><line class="p213-link is-forward" x1="466" y1="112" x2="537" y2="112" marker-end="url(#p213-arrow-gold)"/><line class="p213-link is-back" x1="537" y1="151" x2="466" y2="151" marker-end="url(#p213-arrow-blue)"/><text x="501" y="104" text-anchor="middle">B→C .25</text><text x="501" y="169" text-anchor="middle">C→B .50</text></g><g class="p213-distribution-panel"><rect x="20" y="226" width="720" height="207" rx="15"/><text class="p213-panel-title" x="38" y="251">EXACT DISTRIBUTION AFTER n=${data.steps} STEP${data.steps === 1 ? "" : "S"} · START ${data.startRoom}</text>${ROOMS.map((room, index) => `<g class="p213-bar-row is-${room.toLowerCase()}"><text class="p213-bar-room" x="42" y="${rowY[index]}">${room}</text><rect class="p213-bar-track" x="${barX}" y="${rowY[index] - 18}" width="${barWidth}" height="24" rx="6"/><rect class="p213-bar-fill" x="${barX}" y="${rowY[index] - 18}" width="${format(barWidth * data.probabilities[index], 3)}" height="24" rx="6"/><line class="p213-stationary-marker" x1="${format(barX + barWidth * STATIONARY_NUMERATORS[index] / 4, 3)}" y1="${rowY[index] - 22}" x2="${format(barX + barWidth * STATIONARY_NUMERATORS[index] / 4, 3)}" y2="${rowY[index] + 10}"/><text class="p213-bar-value" x="151" y="${rowY[index]}">${showDistribution ? `${fractionText(data.counts[index], data.denominator)} = ${format(data.probabilities[index], 5)}` : "stage 2"}</text></g>`).join("")}<g class="p213-tv-ledger"><rect x="567" y="268" width="151" height="132" rx="12"/><text class="p213-tv-kicker" x="582" y="289">TOTAL VARIATION</text><text class="p213-tv-formula" x="582" y="312">½ Σ |pₙ−π|</text><text class="p213-tv-value" x="702" y="349" text-anchor="end">${showTv ? fractionText(data.totalVariation.numerator, data.totalVariation.denominator) : "stage 3"}</text><text class="p213-tv-decimal" x="702" y="371" text-anchor="end">${showTv ? format(data.totalVariationDecimal, 7) : "compare with π"}</text><text class="p213-tv-note" x="582" y="390">π=(1/4, 1/2, 1/4)</text></g><text class="p213-marker-note" x="169" y="420">thin markers show stationary probabilities π</text></g></svg>`;
  }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p213-controls" aria-label="Starting room and step controls"><div class="p213-start-row"><span>Starting room</span><div role="group" aria-label="Choose the walker's known starting room">${ROOMS.map((room) => `<button class="chip-button ${state.startRoom === room ? "active" : ""}" type="button" data-problem-action="p213-start" data-p213-start="${room}" aria-pressed="${state.startRoom === room}">${room}</button>`).join("")}</div></div><label for="p213-step"><span>Number of transitions <output>${state.step}</output></span><input id="p213-step" type="range" min="0" max="12" step="1" value="${state.step}" aria-valuetext="${state.step} transitions from room ${state.startRoom}; distribution ${data.probabilities.map((value) => format(value, 4)).join(", ")}; total variation ${format(data.totalVariationDecimal, 6)}"/></label><div class="p213-step-buttons"><button class="secondary-button" type="button" data-problem-action="p213-step" data-p213-delta="-1" ${state.step <= 0 ? "disabled" : ""}>Previous</button><button class="secondary-button" type="button" data-problem-action="p213-preset" data-p213-step="4">Challenge n=4</button><button class="primary-button" type="button" data-problem-action="p213-step" data-p213-delta="1" ${state.step >= 12 ? "disabled" : ""}>Shuffle once</button></div><p><strong>Dots:</strong> a rounded 32-walker illustration. <strong>Bars:</strong> exact probabilities. At the challenge step, the dots are exactly 9, 16 and 7.</p></section>`;
  }

  function metricsMarkup() { const data = currentData(); return `<section class="p213-metrics" aria-live="polite"><article><span>Current pₙ</span><strong>(${data.counts.map((count) => fractionText(count, data.denominator)).join(", ")})</strong><small>exact row distribution</small></article><article><span>Stationary π</span><strong>(1/4, 1/2, 1/4)</strong><small>πP=π</small></article><article><span>TV distance</span><strong>${fractionText(data.totalVariation.numerator, data.totalVariation.denominator)}</strong><small>${format(data.totalVariationDecimal, 7)} from stationarity</small></article></section>`; }
  function distinctionMarkup() { return `<section class="p213-distinction"><strong>A stationary distribution is not a stationary walker.</strong><span>If the current room is sampled from π, the distribution after another shuffle is still π. A realised walker nevertheless occupies one room and may move on the next step.</span></section>`; }
  function dynamicMarkup() { return `<div class="p213-dynamic">${shuffleSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p213-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p213-solution" aria-labelledby="p213-solution-heading"><h3 id="p213-solution-heading" tabindex="-1">Four shuffles leave one thirty-second of total-variation distance</h3><p>Use row-vector propagation (p_{n+1}=p_nP), starting from (p_0=(1,0,0)):</p><div class="p213-equation">p₁=(1/2,1/2,0)<br>p₂=(3/8,1/2,1/8)<br>p₃=(5/16,1/2,3/16)<br>p₄=(9/32,1/2,7/32).</div><p>The stationary distribution satisfies πP=π and is</p><div class="p213-equation">π=(1/4,1/2,1/4)=(8/32,16/32,8/32).</div><p>Therefore</p><div class="p213-equation is-answer">dTV(p₄,π)=½Σᵢ|p₄(i)−π(i)|<br>=½(1/32+0+1/32)<br>=<strong>1/32=0.03125.</strong></div><p>The distance concerns two distributions. It does not mean a walker is “one thirty-second away” from a room, nor does π guarantee the realised location. Under π, a single walker is in exactly one random room—A, B or C—with probabilities 1/4, 1/2 and 1/4.</p></section>`;
  }

  function snapshot() {
    const data = currentData(), stationaryAfterOneStep = STATIONARY_NUMERATORS.map((_, column) => STATIONARY_NUMERATORS.reduce((sum, numerator, row) => sum + numerator / 4 * QUARTER_MATRIX[row][column] / 4, 0));
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, convention: "row distribution p_(n+1)=p_n P", transitionMatrix: [[.5,.5,0],[.25,.5,.25],[0,.5,.5]], roomOrder: ROOMS, startRoom: data.startRoom, steps: data.steps, exactDistribution: data.counts.map((count) => ({ numerator: reduceFraction(count, data.denominator).numerator, denominator: reduceFraction(count, data.denominator).denominator })), decimalDistribution: data.probabilities, stationaryDistribution: [.25,.5,.25], totalVariation: { numerator: data.totalVariation.numerator, denominator: data.totalVariation.denominator, decimal: data.totalVariationDecimal }, walkerIllustration: { totalWalkers: 32, allocation: allocateWalkers(data.probabilities), note: "rounded largest-remainder illustration; exact at challenge n=4" }, invariants: { rowSums: QUARTER_MATRIX.map((row) => row.reduce((sum, value) => sum + value, 0) / 4), probabilitySumResidual: data.totalProbability - 1, propagationResidual: data.nextProbabilities.reduce((sum, value) => sum + value, 0) - 1, stationaryAfterOneStep, stationaryResidual: stationaryAfterOneStep.map((value, index) => value - STATIONARY_NUMERATORS[index] / 4) }, challenge: { startRoom: "A", steps: 4, exactDistribution: ["9/32","1/2","7/32"], totalVariation: "1/32", totalVariationDecimal: CHALLENGE_DATA.totalVariationDecimal }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p213-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Stochastic Processes</strong><span class="eyebrow">Chapter 21 · Markov chains</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p213-spread"><article class="book-page p213-problem-page"><div class="problem-number">Problem 21.3</div><h1 class="book-title p213-title">The Three-Room Shuffle</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p213-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A walker moves among rooms A, B and C with transition matrix</p><div class="p213-matrix" aria-label="Transition matrix P with rows one half one half zero; one quarter one half one quarter; zero one half one half"><span>P=</span><div><span>.50</span><span>.50</span><span>0</span><span>.25</span><span>.50</span><span>.25</span><span>0</span><span>.50</span><span>.50</span></div></div><p class="problem-copy">Starting in A, the four-step distribution is (p_4=(9/32,1/2,7/32)). <strong>What is its total-variation distance from (pi=(1/4,1/2,1/4))?</strong></p><section class="p213-question-card"><strong>One walk, two levels of description</strong><p>A realised walker has one location. A probability vector describes uncertainty—or the proportions across many independent walkers.</p></section></article><section class="book-page book-stage p213-stage" aria-labelledby="p213-stage-heading">${stageControlsMarkup()}<div class="p213-stage-heading"><div><span class="eyebrow">Three-room laboratory</span><h2 id="p213-stage-heading">Watch a distribution settle</h2></div><p>Change the known starting room, move step by step, and compare exact probabilities with the stationary markers.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p213-coach"><div class="coach-kicker">Measure convergence</div><p class="coach-question">For the fixed start A and n=4 challenge, enter the total-variation distance.</p><form class="p213-answer-form" data-p213-answer-form novalidate><label for="p213-answer">Total-variation distance</label><input id="p213-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal"/><small>Fractions such as 1/32 are accepted.</small><button class="primary-button" type="submit">Check distance</button></form>${feedbackMarkup()}<div class="button-row p213-help-row"><button class="secondary-button" type="button" data-problem-action="p213-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p213-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p213-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p213-shell"); if (!root) return;
    const dynamic = root.querySelector(".p213-dynamic"), active = document.activeElement;
    let focusSelector = "";
    if (dynamic?.contains(active)) { if (active.id === "p213-step") focusSelector = "#p213-step"; else if (active.dataset?.problemAction) focusSelector = `[data-problem-action="${active.dataset.problemAction}"]${active.dataset.p213Delta ? `[data-p213-delta="${active.dataset.p213Delta}"]` : ""}${active.dataset.p213Step ? `[data-p213-step="${active.dataset.p213Step}"]` : ""}`; }
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (focusSelector) { const replacement = root.querySelector(focusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p213-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p213-reset") { state = initialState(); renderAndFocus(renderApp, "#p213-step"); return; }
      if (action === "p213-stage") { state.stage = clamp(Number(control.dataset.p213Stage), 0, 2); renderAndFocus(renderApp, `[data-p213-stage="${state.stage}"]`); return; }
      if (action === "p213-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p213-stage="${state.stage}"]`); return; }
      if (action === "p213-start") { state.startRoom = ROOMS.includes(control.dataset.p213Start) ? control.dataset.p213Start : "A"; state.step = 0; renderApp(); return; }
      if (action === "p213-step") { state.step = clamp(state.step + Number(control.dataset.p213Delta), 0, 12); updateDynamicDom(); return; }
      if (action === "p213-preset") { state.step = clamp(Number(control.dataset.p213Step), 0, 12); updateDynamicDom(); return; }
      if (action === "p213-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p213-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p213-reveal") window.requestAnimationFrame(() => document.querySelector("#p213-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p213-step")) { state.step = clamp(Math.round(Number(event.target.value)), 0, 12); updateDynamicDom(); return; }
      if (event.target.matches("#p213-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root?.querySelector("[data-p213-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p213-answer")?.value || "", answer = parseProbability(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a probability between 0 and 1, as a fraction or decimal.";
      else if (Math.abs(answer - 9 / 32) < .001) state.feedback = "9/32 is the probability of room A after four steps, not the distance between the two distributions.";
      else if (Math.abs(answer - 1 / 16) < .001) state.feedback = "You have summed the two absolute differences. Total variation includes a factor of one half.";
      else if (Math.abs(answer - 1 / 32) > .0005) state.feedback = "Compare p₄=(9/32,16/32,7/32) with π=(8/32,16/32,8/32), then halve the sum of absolute differences.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: ½(1/32+0+1/32)=1/32=0.03125."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p213-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
