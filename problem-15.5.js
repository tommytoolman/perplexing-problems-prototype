(function registerMissingConstellationPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "15.5";
  const TRIAL_SEED = 150505;
  const SIMULATION_SEED = 155155;
  const CHALLENGE_TYPES = 8;
  const CONSTELLATIONS = Object.freeze(["Lyra", "Orion", "Cygnus", "Draco", "Aquila", "Pegasus", "Carina", "Phoenix", "Crux", "Hydra", "Lupus", "Vela", "Ara", "Pavo", "Volans", "Delphinus", "Corvus", "Dorado", "Musca", "Norma"]);
  const stages = Object.freeze([
    Object.freeze({ short: "Collect", title: "Open one reproducible packet stream", copy: "Packets are independent and every constellation type is equally likely. Duplicates consume packets without filling a missing album slot." }),
    Object.freeze({ short: "Repeat", title: "Watch completion time form a distribution", copy: "Run many seeded albums. A few unlucky duplicate streaks create the long right tail, so individual completion times vary widely." }),
    Object.freeze({ short: "Expectation", title: "Break the wait into geometric stages", copy: "After k types have appeared, the next packet is new with probability (n−k)/n. Add the expected waits for all n stages." }),
  ]);
  const hints = Object.freeze([
    "Do not treat the eight types as eight packets: duplicates make the total waiting time random.",
    "After k distinct types are collected, n−k types are still useful, so the probability that the next packet is new is (n−k)/n.",
    "A geometric waiting time with success probability p has expectation 1/p. The next new type therefore takes n/(n−k) packets on average.",
    "Sum for k=0 through n−1: E[T]=n/n+n/(n−1)+⋯+n/1=nHₙ.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p155-reset">Reset</button>';

  const initialState = () => ({ typeCount: CHALLENGE_TYPES, trialNumber: 1, packetCount: 0, stage: 0, simulationSize: 0, simulationTimes: [], answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
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

  function modelData(typeCount = state.typeCount) {
    const harmonicTerms = Array.from({ length: typeCount }, (_, index) => 1 / (index + 1));
    const harmonicNumber = harmonicTerms.reduce((sum, term) => sum + term, 0);
    const expectedPackets = typeCount * harmonicNumber;
    return { typeCount, harmonicTerms, harmonicNumber, expectedPackets };
  }

  const challengeValues = modelData(CHALLENGE_TYPES);
  function trialSeed() { return TRIAL_SEED + state.typeCount * 100003 + state.trialNumber * 7919; }

  function completionTime(typeCount, random) {
    const seen = Array(typeCount).fill(false);
    let distinct = 0;
    let packets = 0;
    while (distinct < typeCount && packets < 100000) {
      const type = Math.floor(random() * typeCount);
      packets += 1;
      if (!seen[type]) { seen[type] = true; distinct += 1; }
    }
    return packets;
  }

  function currentTrialData(packetCount = state.packetCount) {
    const random = mulberry32(trialSeed());
    const counts = Array(state.typeCount).fill(0);
    const sequence = [];
    let distinct = 0;
    let completedAt = null;
    for (let packet = 1; packet <= packetCount; packet += 1) {
      const type = Math.floor(random() * state.typeCount);
      sequence.push(type);
      if (counts[type] === 0) distinct += 1;
      counts[type] += 1;
      if (distinct === state.typeCount && completedAt === null) completedAt = packet;
    }
    return { counts, sequence, distinct, missing: state.typeCount - distinct, completedAt, complete: distinct === state.typeCount };
  }

  function openPackets(amount) {
    const target = state.packetCount + amount;
    const data = currentTrialData(target);
    state.packetCount = data.completedAt === null ? target : data.completedAt;
  }

  function finishCurrentTrial() { state.packetCount = completionTime(state.typeCount, mulberry32(trialSeed())); }

  function runSimulation(size) {
    const random = mulberry32(SIMULATION_SEED + state.typeCount * 65537);
    state.simulationTimes = Array.from({ length: size }, () => completionTime(state.typeCount, random));
    state.simulationSize = size;
  }

  function simulationSummary() {
    if (!state.simulationSize) return null;
    const sorted = [...state.simulationTimes].sort((a, b) => a - b);
    const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
    const quantile = (fraction) => sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
    return { mean, minimum: sorted[0], median: quantile(.5), percentile90: quantile(.9), maximum: sorted.at(-1) };
  }

  function exactCompletionProbabilities(typeCount, maximumTime) {
    let states = Array(typeCount + 1).fill(0);
    states[0] = 1;
    const completion = Array(maximumTime + 1).fill(0);
    for (let time = 1; time <= maximumTime; time += 1) {
      const next = Array(typeCount + 1).fill(0);
      for (let collected = 0; collected <= typeCount; collected += 1) {
        if (!states[collected]) continue;
        next[collected] += states[collected] * collected / typeCount;
        if (collected < typeCount) next[collected + 1] += states[collected] * (typeCount - collected) / typeCount;
      }
      completion[time] = Math.max(0, next[typeCount] - states[typeCount]);
      states = next;
    }
    return completion;
  }

  function originalExtensionNote() {
    return `<p class="p155-extension-note"><strong>Original extension.</strong> This chapter and activity were created for this project and do not appear in Professor Povey’s <em>Perplexing Problems</em>.</p>`;
  }

  function stageControls() {
    return `<div class="p155-stage-controls" role="group" aria-label="Coupon-collector stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p155-stage" data-p155-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p155-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p155-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Expectation exposed" : "Next stage"}</button></div>`;
  }

  function albumMarkup() {
    const data = currentTrialData();
    const recent = data.sequence.slice(-12);
    return `<section class="p155-album-card" aria-labelledby="p155-album-title"><header><div><span class="eyebrow">Seeded album ${state.trialNumber}</span><h3 id="p155-album-title">Open packets until none are missing</h3></div><p>Seed ${trialSeed().toLocaleString("en-GB")} · ${state.typeCount} uniform types</p></header><div class="p155-album-grid" role="list" aria-label="Constellation album slots">${CONSTELLATIONS.slice(0, state.typeCount).map((name, index) => `<div class="p155-album-slot ${data.counts[index] ? "is-found" : "is-missing"}" role="listitem" aria-label="${name}: ${data.counts[index] ? `found ${data.counts[index]} times` : "missing"}"><span aria-hidden="true">✦</span><strong>${name}</strong><small>${data.counts[index] ? `×${data.counts[index]}` : "missing"}</small></div>`).join("")}</div><div class="p155-recent"><span>Most recent packets</span><div role="list">${recent.length ? recent.map((type, index) => `<i role="listitem" aria-label="Packet ${state.packetCount - recent.length + index + 1}: ${CONSTELLATIONS[type]}">${CONSTELLATIONS[type].slice(0, 3)}</i>`).join("") : "<em>No packets opened</em>"}</div></div><div class="p155-trial-status" aria-live="polite"><div><span>Packets opened</span><strong>${state.packetCount}</strong></div><div><span>Distinct found</span><strong>${data.distinct} / ${state.typeCount}</strong></div><div><span>Still missing</span><strong>${data.missing}</strong></div><div><span>Trial result T</span><strong>${data.complete ? `${data.completedAt} packets` : "unfinished"}</strong></div></div><p class="p155-trial-message">${data.complete ? `Album complete after ${data.completedAt} packets. ${state.packetCount - state.typeCount} packet${state.packetCount - state.typeCount === 1 ? " was" : "s were"} necessarily duplicates beyond the first copy of each type.` : data.missing === 1 ? "Only one type remains—but each new packet still hits it with probability 1/n." : `${data.missing} constellation types remain missing.`}</p><div class="p155-trial-actions"><button class="primary-button" type="button" data-problem-action="p155-open-one" ${data.complete ? "disabled" : ""}>Open one packet</button><button class="secondary-button" type="button" data-problem-action="p155-open-five" ${data.complete ? "disabled" : ""}>Open up to five</button><button class="secondary-button" type="button" data-problem-action="p155-finish" ${data.complete ? "disabled" : ""}>Finish this album</button><button class="ghost-button" type="button" data-problem-action="p155-new-trial">New seeded album</button></div></section>`;
  }

  function histogramMarkup() {
    const values = modelData();
    const summary = simulationSummary();
    const observedMaximum = summary?.maximum || 0;
    const cutoff = Math.max(state.typeCount + 9, Math.ceil(values.expectedPackets * 2.5), observedMaximum);
    const binWidth = Math.max(1, Math.ceil((cutoff - state.typeCount + 1) / 10));
    const bins = Array.from({ length: 10 }, (_, index) => ({ start: state.typeCount + index * binWidth, end: index === 9 ? Infinity : state.typeCount + (index + 1) * binWidth - 1 }));
    const lastFiniteTime = bins[9].start - 1;
    const exactTimes = exactCompletionProbabilities(state.typeCount, lastFiniteTime);
    let exactBeforeTail = 0;
    const plotted = bins.map((bin, index) => {
      const exact = index === 9 ? Math.max(0, 1 - exactBeforeTail) : exactTimes.slice(bin.start, bin.end + 1).reduce((sum, value) => sum + value, 0);
      if (index !== 9) exactBeforeTail += exact;
      const observedCount = state.simulationSize ? state.simulationTimes.filter((time) => time >= bin.start && time <= bin.end).length : 0;
      const observed = state.simulationSize ? observedCount / state.simulationSize : null;
      return { ...bin, exact, observed, observedCount };
    });
    const maximumProbability = Math.max(...plotted.flatMap((bin) => [bin.exact, bin.observed || 0]), .01);
    const rows = plotted.map((bin) => { const label = bin.end === Infinity ? `${bin.start}+` : bin.start === bin.end ? `${bin.start}` : `${bin.start}–${bin.end}`; return `<div class="p155-histogram-row" aria-label="Completion in ${label} packets: exact probability ${format(bin.exact * 100, 3)} percent${bin.observed === null ? "" : `; observed ${format(bin.observed * 100, 3)} percent`}"><strong>${label}</strong><div class="p155-bar-pair"><span class="p155-exact-bar" style="width:${format(100 * bin.exact / maximumProbability, 5)}%"></span><span class="p155-sim-bar" style="width:${format(100 * (bin.observed || 0) / maximumProbability, 5)}%"></span></div><div><b>${format(bin.exact * 100, 2)}%</b><small>${bin.observed === null ? "—" : `${format(bin.observed * 100, 2)}%`}</small></div></div>`; }).join("");
    return `<section class="p155-histogram-card" aria-labelledby="p155-histogram-title"><header><div><span class="eyebrow">Completion-time distribution</span><h3 id="p155-histogram-title">Most albums cluster; some wait much longer</h3></div><div class="p155-legend"><span><i class="exact"></i>exact Markov distribution</span><span><i class="sim"></i>seeded simulation</span></div></header><div class="p155-histogram-rows">${rows}</div><div class="p155-simulation-controls"><div role="group" aria-label="Number of simulated albums">${[100, 1000, 10000].map((size) => `<button class="chip-button ${state.simulationSize === size ? "active" : ""}" type="button" data-problem-action="p155-simulate" data-p155-size="${size}" aria-pressed="${state.simulationSize === size}">${size.toLocaleString("en-GB")} albums</button>`).join("")}</div><p aria-live="polite">${summary ? `Mean ${format(summary.mean, 5)} · median ${summary.median} · 90th percentile ${summary.percentile90} · range ${summary.minimum}–${summary.maximum}. Exact mean ${format(values.expectedPackets, 5)}.` : "Run a reproducible simulation to overlay completion frequencies and compare means."}</p></div></section>`;
  }

  function expectationMarkup() {
    const values = modelData();
    const displayedStages = Array.from({ length: state.typeCount }, (_, collected) => ({ collected, missing: state.typeCount - collected, probability: (state.typeCount - collected) / state.typeCount, wait: state.typeCount / (state.typeCount - collected) }));
    return `<section class="p155-expectation-card" aria-labelledby="p155-expectation-title"><div><span class="eyebrow">Geometric waiting stages</span><h3 id="p155-expectation-title">The final missing type is the slowest stage</h3><p>Each row begins just after a new type has appeared. Its expected wait ends when another previously missing type arrives.</p></div><div class="p155-wait-grid" role="list" aria-label="Expected waiting stages">${displayedStages.map((entry) => `<div role="listitem" aria-label="${entry.collected} collected, ${entry.missing} missing, probability next packet is new ${format(entry.probability, 5)}, expected wait ${format(entry.wait, 5)} packets"><b>${entry.collected} found</b><span>p(new)=${entry.missing}/${state.typeCount}</span><strong>E(wait)=${format(entry.wait, 3)}</strong></div>`).join("")}</div><div class="p155-expectation-equation">E[T]=Σ<sub>k=0</sub><sup>n−1</sup> n/(n−k)<br>=n(1+½+⋯+1/n)<br>=nH<sub>n</sub><br><strong>${state.typeCount}H<sub>${state.typeCount}</sub>=${format(values.expectedPackets, 8)}</strong></div><p class="p155-limit-note">Checks: n=1 gives E[T]=1 packet. Increasing n adds a new slow final stage of mean n packets and also lengthens every earlier stage.</p></section>`;
  }

  function metricsMarkup() {
    const values = modelData();
    const data = currentTrialData();
    const summary = simulationSummary();
    return `<section class="p155-metrics" aria-live="polite"><div><span>Current missing types</span><strong>${data.missing}</strong></div><div><span>Exact harmonic number Hₙ</span><strong>${state.stage >= 2 || state.revealed ? format(values.harmonicNumber, 8) : "stage 3"}</strong></div><div><span>Exact expected packets nHₙ</span><strong>${state.stage >= 2 || state.revealed ? format(values.expectedPackets, 8) : "stage 3"}</strong></div><div><span>Simulated mean</span><strong>${summary ? format(summary.mean, 6) : "run albums"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p155-dynamic">${albumMarkup()}${state.stage >= 1 || state.revealed ? histogramMarkup() : ""}${state.stage >= 2 || state.revealed ? expectationMarkup() : ""}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p155-controls" aria-label="Coupon collector controls"><label for="p155-type-count"><span>Equally likely constellation types n<output data-p155-output="types">${state.typeCount}</output></span><input id="p155-type-count" type="range" min="1" max="20" step="1" value="${state.typeCount}"/></label><p>Every packet independently contains one of n types with probability 1/n. Changing n starts a fresh deterministic album and clears the repeated-trial simulation.</p><button class="chip-button" type="button" data-problem-action="p155-challenge">Restore eight-type challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p155-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p155-solution" aria-labelledby="p155-solution-heading"><h3 id="p155-solution-heading" tabindex="-1">Add the waits for successive new types</h3><p>Suppose k distinct types have already appeared. Exactly n−k of the n equally likely packet types remain useful, so the probability that the next packet is new is (n−k)/n.</p><div class="p155-solution-equation">E[next new type | k found]=1/((n−k)/n)=n/(n−k)</div><p>Summing these geometric waiting-time means as k runs from 0 to n−1 gives</p><div class="p155-solution-equation">E[T]=n/n+n/(n−1)+⋯+n/1=nHₙ.</div><p>For eight constellation types, H₈=761/280:</p><div class="p155-solution-equation is-answer">E[T]=8×761/280<br>=761/35<br>=21.742857142857… packets</div><p>The expectation is not a guarantee and need not be an integer. The distribution has a right tail because repeatedly missing the final type is possible, though increasingly unlikely.</p></section>`;
  }

  function parseAnswer(raw) {
    const cleaned = sanitizeAnswer(raw).trim();
    const fraction = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator === 0 ? NaN : Number(fraction[1]) / denominator; }
    return Number(cleaned);
  }

  function snapshot() {
    const values = modelData();
    const data = currentTrialData();
    const summary = simulationSummary();
    return JSON.stringify({ problem: PROBLEM, provenance: "original extension created for this project; not in Professor Povey's Perplexing Problems", model: "independent uniform draws with replacement from n labelled constellation types", typeCount: state.typeCount, exactHarmonicNumber: Number(values.harmonicNumber.toFixed(12)), exactExpectedCompletionPackets: Number(values.expectedPackets.toFixed(12)), trialSeed: trialSeed(), trialNumber: state.trialNumber, packetsOpened: state.packetCount, collectedCounts: Object.fromEntries(CONSTELLATIONS.slice(0, state.typeCount).map((name, index) => [name, data.counts[index]])), distinctTypesFound: data.distinct, missingTypes: data.missing, currentTrialCompletionTime: data.completedAt, simulationSeed: SIMULATION_SEED, simulationSize: state.simulationSize, simulationSummary: summary ? { mean: Number(summary.mean.toFixed(12)), minimum: summary.minimum, median: summary.median, percentile90: summary.percentile90, maximum: summary.maximum } : null, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function resetExperiment() { state.trialNumber = 1; state.packetCount = 0; state.simulationSize = 0; state.simulationTimes = []; }
  function restoreChallenge() { state.typeCount = CHALLENGE_TYPES; resetExperiment(); }

  function render() {
    return `<main class="book-shell p155-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · random collections</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p155-spread"><article class="book-page p155-problem-page"><div class="problem-number">Problem 15.5</div><h1 class="book-title p155-title">The Missing Constellation</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${originalExtensionNote()}<p class="problem-copy">Each packet contains one of eight constellation tiles, independently and uniformly at random. Packets are opened until all eight types have appeared.</p><p class="problem-copy"><strong>Find the exact expected number of packets required.</strong></p><section class="p155-observation-card"><strong>The last gap dominates the wait</strong><p>Once seven types are collected, every packet has only a one-in-eight chance of completing the album.</p></section><section class="p155-model-card"><div class="eyebrow">Uniform coupon collector</div><p>Packets are independent draws with replacement. Types are labelled, equally likely and always correctly identified.</p></section></article><section class="book-page book-stage p155-stage">${stageControls()}<div class="p155-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p155-coach"><div class="coach-kicker">Price every missing type</div><p class="coach-question">For eight equally likely types, enter E[T] as 761/35 or a decimal to six places.</p><form class="p155-answer-form" data-p155-answer-form novalidate><label for="p155-answer">Expected packet count</label><div><input id="p155-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal" autocomplete="off"/><span>packets</span></div><button class="primary-button" type="submit">Check expectation</button></form>${feedbackMarkup()}<div class="button-row p155-help-row"><button class="secondary-button" type="button" data-problem-action="p155-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p155-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p155-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p155-shell"); if (!root) return;
    const dynamic = root.querySelector(".p155-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const output = root.querySelector('[data-p155-output="types"]'); if (output) output.textContent = state.typeCount;
    const values = modelData();
    root.querySelector("#p155-type-count")?.setAttribute("aria-valuetext", `${state.typeCount} equally likely types; exact expected completion ${format(values.expectedPackets, 5)} packets`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p155-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control || !root.contains(control)) return;
      const action = control.dataset.problemAction;
      if (action === "p155-reset") { state = initialState(); renderAndFocus(renderApp, "#p155-type-count"); return; }
      if (action === "p155-stage") { state.stage = clamp(Number(control.dataset.p155Stage), 0, 2); renderAndFocus(renderApp, `[data-p155-stage="${state.stage}"]`); return; }
      if (action === "p155-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p155-stage="${state.stage}"]`); return; }
      if (action === "p155-open-one") openPackets(1);
      if (action === "p155-open-five") openPackets(5);
      if (action === "p155-finish") finishCurrentTrial();
      if (action === "p155-new-trial") { state.trialNumber += 1; state.packetCount = 0; }
      if (action === "p155-simulate") runSimulation(clamp(Number(control.dataset.p155Size), 100, 10000));
      if (action === "p155-challenge") restoreChallenge();
      if (action === "p155-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p155-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p155-reveal") window.requestAnimationFrame(() => document.querySelector("#p155-solution-heading")?.focus());
    });
    document.querySelector("#p155-type-count")?.addEventListener("input", (event) => { state.typeCount = clamp(Number(event.target.value), 1, 20); resetExperiment(); updateDynamicDom(); });
    const input = document.querySelector("#p155-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeAnswer(event.target.value); });
    document.querySelector("[data-p155-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeAnswer(input?.value).trim(); const answer = parseAnswer(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter 761/35 or the expected packet count as a decimal.";
      else if (Math.abs(answer - 22) < 1e-12) state.feedback = "Twenty-two is the nearest integer, but an expectation need not be integral. Keep the fractional mean.";
      else if (Math.abs(answer - challengeValues.harmonicNumber) < 5e-7) state.feedback = "That is H₈. Multiply the harmonic number by n=8.";
      else if (Math.abs(answer - challengeValues.expectedPackets) > 5e-7) state.feedback = "Add the geometric waiting means 8/8+8/7+⋯+8/1.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: E[T]=8H₈=761/35=21.742857… packets."; }
      renderAndFocus(renderApp, "#p155-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
