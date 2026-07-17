(function registerTrafficBothDirectionsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "21.4";
  const NODES = Object.freeze(["A", "B", "C"]);
  const EDGE_KEYS = Object.freeze(["AB", "BC", "CA"]);
  const CHALLENGE_WEIGHTS = Object.freeze({ AB: 2, BC: 1, CA: 3 });
  const ANSWER_TOLERANCE = .0006;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Choose", title: "Turn edge weights into transition probabilities", copy: "At a node, divide each adjacent edge weight by the node’s total incident weight. The outgoing probabilities sum to one, but opposite directions along one edge need not have equal transition probabilities." }),
    Object.freeze({ short: "Mass", title: "Place stationary mass in proportion to node strength", copy: "For this undirected weighted walk, πᵢ is the total weight touching node i divided by twice the total edge weight. Heavier-connected nodes carry more long-run probability mass." }),
    Object.freeze({ short: "Balance", title: "Compare probability flux pair by pair", copy: "Detailed balance weights a transition by the mass available to make it. On every edge, πᵢPᵢⱼ=πⱼPⱼᵢ even when Pᵢⱼ and Pⱼᵢ differ." }),
  ]);
  const hints = Object.freeze([
    "Node A has weighted degree dA=wAB+wCA=2+3=5. Node B has dB=2+1=3.",
    "The total of all node strengths is 5+3+4=12, so πA=5/12 and πB=3/12=1/4.",
    "From A, the chance of taking AB is PAB=wAB/dA=2/5.",
    "Multiply the stationary mass at A by that transition probability: πAPAB=(5/12)(2/5).",
    "The reverse check is πBPBA=(1/4)(2/3). Both simplify to 1/6.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p214-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function gcd(a, b) { let x = Math.abs(Math.round(a)), y = Math.abs(Math.round(b)); while (y) { const remainder = x % y; x = y; y = remainder; } return x || 1; }
  function fraction(numerator, denominator) { const divisor = gcd(numerator, denominator); return { numerator: numerator / divisor, denominator: denominator / divisor }; }
  function fractionText(numerator, denominator) { const value = fraction(numerator, denominator); return value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`; }
  function format(value, digits = 5) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseProbability(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", "."); if (!normalized) return NaN; const part = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/); if (part) { const denominator = Number(part[2]); return denominator ? Number(part[1]) / denominator : NaN; } const match = normalized.match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?%?$/i); if (!match) return NaN; const value = Number(normalized.replace("%", "")); return normalized.includes("%") || Math.abs(value) > 1 ? value / 100 : value; }

  function networkData(weightsInput = CHALLENGE_WEIGHTS) {
    const weights = { AB: clamp(Math.round(weightsInput.AB), 1, 100), BC: clamp(Math.round(weightsInput.BC), 1, 100), CA: clamp(Math.round(weightsInput.CA), 1, 100) };
    const strengths = [weights.AB + weights.CA, weights.AB + weights.BC, weights.BC + weights.CA], totalStrength = strengths.reduce((sum, value) => sum + value, 0);
    const transitionMatrix = [[0, weights.AB / strengths[0], weights.CA / strengths[0]],[weights.AB / strengths[1], 0, weights.BC / strengths[1]],[weights.CA / strengths[2], weights.BC / strengths[2], 0]];
    const stationary = strengths.map((strength) => strength / totalStrength), fluxMatrix = transitionMatrix.map((row, i) => row.map((probability) => stationary[i] * probability));
    const stationaryAfterStep = NODES.map((_, j) => stationary.reduce((sum, probability, i) => sum + probability * transitionMatrix[i][j], 0));
    const detailedBalanceResiduals = { AB: fluxMatrix[0][1] - fluxMatrix[1][0], BC: fluxMatrix[1][2] - fluxMatrix[2][1], CA: fluxMatrix[2][0] - fluxMatrix[0][2] };
    return { weights, strengths, totalStrength, stationary, transitionMatrix, fluxMatrix, stationaryAfterStep, rowSums: transitionMatrix.map((row) => row.reduce((sum, value) => sum + value, 0)), stationaryResiduals: stationaryAfterStep.map((value, index) => value - stationary[index]), detailedBalanceResiduals };
  }

  const CHALLENGE_DATA = Object.freeze(networkData(CHALLENGE_WEIGHTS));
  function initialState() { return { weights: { ...CHALLENGE_WEIGHTS }, selectedEdge: "AB", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false, boardMessage: "Edge AB has unequal transition probabilities, 2/5 and 2/3, but equal stationary probability flux 1/6 in both directions." }; }
  let state = initialState();
  function currentData() { return networkData(state.weights); }
  function restoreChallenge() { state.weights = { ...CHALLENGE_WEIGHTS }; state.selectedEdge = "AB"; state.boardMessage = "Challenge restored: weights 2, 1 and 3 give π=(5/12, 1/4, 1/3) and AB flux 1/6 each way."; }

  function edgeDefinition(key) { const map = { AB: { i: 0, j: 1, forward: "A→B", reverse: "B→A" }, BC: { i: 1, j: 2, forward: "B→C", reverse: "C→B" }, CA: { i: 2, j: 0, forward: "C→A", reverse: "A→C" } }; return map[key]; }
  function selectedEdgeData(data = currentData(), key = state.selectedEdge) { const edge = edgeDefinition(key), weight = data.weights[key], forwardProbability = data.transitionMatrix[edge.i][edge.j], reverseProbability = data.transitionMatrix[edge.j][edge.i], forwardFlux = data.fluxMatrix[edge.i][edge.j], reverseFlux = data.fluxMatrix[edge.j][edge.i]; return { ...edge, key, weight, forwardProbability, reverseProbability, forwardFlux, reverseFlux, fluxFraction: fraction(weight, data.totalStrength) }; }
  function stageControlsMarkup() { return `<div class="p214-stage-controls" role="group" aria-label="Detailed-balance reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p214-stage" data-p214-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p214-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p214-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Pairwise balance exposed" : "Next stage"}</button></div>`; }

  const geometry = Object.freeze({
    AB: Object.freeze({ base: [380,92,164,290], forwardPath: "M357 111Q237 164 182 273", reversePath: "M181 283Q282 240 359 116", weightX: 249, weightY: 214, forwardX: 235, forwardY: 155, reverseX: 294, reverseY: 239 }),
    BC: Object.freeze({ base: [164,290,596,290], forwardPath: "M190 277Q380 246 570 277", reversePath: "M570 303Q380 334 190 303", weightX: 380, weightY: 299, forwardX: 380, forwardY: 250, reverseX: 380, reverseY: 337 }),
    CA: Object.freeze({ base: [596,290,380,92], forwardPath: "M579 283Q478 240 401 116", reversePath: "M403 111Q523 164 578 273", weightX: 511, weightY: 214, forwardX: 466, forwardY: 239, reverseX: 525, reverseY: 155 }),
  });

  function edgeMarkup(data) {
    return EDGE_KEYS.map((key) => { const g = geometry[key], selected = key === state.selectedEdge, width = 3 + data.weights[key] * 2.2; return `<g class="p214-edge ${selected ? "is-selected" : ""}"><line x1="${g.base[0]}" y1="${g.base[1]}" x2="${g.base[2]}" y2="${g.base[3]}" style="stroke-width:${format(width, 2)}"/><g class="p214-weight-badge"><rect x="${g.weightX - 25}" y="${g.weightY - 13}" width="50" height="22" rx="8"/><text x="${g.weightX}" y="${g.weightY + 2}" text-anchor="middle">w=${data.weights[key]}</text></g></g>`; }).join("");
  }

  function selectedFlowMarkup(data) {
    const edge = selectedEdgeData(data), g = geometry[edge.key];
    return `<g class="p214-selected-flows"><path class="p214-flow is-forward" d="${g.forwardPath}" marker-end="url(#p214-arrow-forward)"/><path class="p214-flow is-reverse" d="${g.reversePath}" marker-end="url(#p214-arrow-reverse)"/><text class="p214-flow-label is-forward" x="${g.forwardX}" y="${g.forwardY}" text-anchor="middle">${edge.forward} · P=${format(edge.forwardProbability, 4)}</text><text class="p214-flow-label is-reverse" x="${g.reverseX}" y="${g.reverseY}" text-anchor="middle">${edge.reverse} · P=${format(edge.reverseProbability, 4)}</text></g>`;
  }

  function nodeMarkup(data) {
    const positions = [[380,92],[164,290],[596,290]];
    return NODES.map((node, index) => { const [x,y] = positions[index], radius = 42 + 28 * data.stationary[index]; return `<g class="p214-node is-${node.toLowerCase()}"><circle class="p214-node-mass" cx="${x}" cy="${y}" r="${format(radius, 3)}"/><circle class="p214-node-core" cx="${x}" cy="${y}" r="35"/><text class="p214-node-name" x="${x}" y="${y - 4}" text-anchor="middle">${node}</text><text class="p214-node-strength" x="${x}" y="${y + 14}" text-anchor="middle">d=${data.strengths[index]}</text><text class="p214-node-pi" x="${x}" y="${y + 29}" text-anchor="middle">π=${fractionText(data.strengths[index], data.totalStrength)}</text></g>`; }).join("");
  }

  function networkSvg() {
    const data = currentData(), edge = selectedEdgeData(data), showMass = state.stage >= 1 || state.revealed, showFlux = state.stage >= 2 || state.revealed;
    const firstMass = data.strengths[edge.i], secondMass = data.strengths[edge.j], firstTransitionNumerator = edge.weight, firstTransitionDenominator = data.strengths[edge.i], secondTransitionNumerator = edge.weight, secondTransitionDenominator = data.strengths[edge.j];
    const description = `An undirected weighted triangle has weights AB ${data.weights.AB}, BC ${data.weights.BC}, and CA ${data.weights.CA}. Node strengths are A ${data.strengths[0]}, B ${data.strengths[1]}, C ${data.strengths[2]}, giving stationary distribution ${data.stationary.map((value) => format(value, 6)).join(", ")}. Selected edge ${edge.key} has transition probabilities ${edge.forward} ${format(edge.forwardProbability, 6)} and ${edge.reverse} ${format(edge.reverseProbability, 6)}. Their stationary fluxes are ${format(edge.forwardFlux, 6)} and ${format(edge.reverseFlux, 6)}, exactly equal to ${fractionText(edge.weight, data.totalStrength)}.`;
    return `<svg class="p214-network p214-stage-${state.stage}" viewBox="0 0 760 475" role="img" aria-labelledby="p214-svg-title p214-svg-desc"><title id="p214-svg-title">Weighted reversible random walk and paired stationary flows</title><desc id="p214-svg-desc">${description}</desc><defs><linearGradient id="p214-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172e38"/><stop offset="1" stop-color="#322b42"/></linearGradient><marker id="p214-arrow-forward" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p214-arrow-reverse" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p214-board" x="1" y="1" width="758" height="473" rx="20"/><text class="p214-board-kicker" x="24" y="27">UNDIRECTED EDGE WEIGHTS · DIRECTED TRANSITIONS · PAIRED EQUILIBRIUM FLUX</text><g class="p214-network-field">${edgeMarkup(data)}${selectedFlowMarkup(data)}<g class="p214-mass-layer ${showMass ? "is-visible" : ""}">${nodeMarkup(data)}</g></g><g class="p214-audit ${showFlux ? "is-visible" : ""}"><rect x="20" y="354" width="720" height="101" rx="14"/><text class="p214-audit-kicker" x="38" y="377">PAIRWISE FLUX AUDIT · EDGE ${edge.key}</text><g class="p214-audit-side is-forward"><text x="38" y="399">${edge.forward}</text><text x="38" y="420">P=${fractionText(firstTransitionNumerator, firstTransitionDenominator)}</text><text class="p214-audit-equation" x="38" y="443">π${NODES[edge.i]}P${edge.key} = ${fractionText(firstMass, data.totalStrength)} × ${fractionText(firstTransitionNumerator, firstTransitionDenominator)} = ${fractionText(edge.weight, data.totalStrength)}</text></g><text class="p214-audit-equals" x="380" y="431" text-anchor="middle">=</text><g class="p214-audit-side is-reverse"><text x="722" y="399" text-anchor="end">${edge.reverse}</text><text x="722" y="420" text-anchor="end">P=${fractionText(secondTransitionNumerator, secondTransitionDenominator)}</text><text class="p214-audit-equation" x="722" y="443" text-anchor="end">π${NODES[edge.j]}P${edge.key.split("").reverse().join("")} = ${fractionText(secondMass, data.totalStrength)} × ${fractionText(secondTransitionNumerator, secondTransitionDenominator)} = ${fractionText(edge.weight, data.totalStrength)}</text></g></g></svg>`;
  }

  function controlsMarkup() {
    const data = currentData(), edge = selectedEdgeData(data);
    return `<section class="p214-controls" aria-label="Edge weight and inspected-flow controls"><div class="p214-edge-picker"><span>Inspect paired flow</span><div role="group" aria-label="Choose an edge to inspect">${EDGE_KEYS.map((key) => `<button class="chip-button ${state.selectedEdge === key ? "active" : ""}" type="button" data-problem-action="p214-edge" data-p214-edge="${key}" aria-pressed="${state.selectedEdge === key}">${key}</button>`).join("")}</div></div><div class="p214-slider-grid">${EDGE_KEYS.map((key) => `<label for="p214-weight-${key.toLowerCase()}"><span>Weight w${key} <output>${state.weights[key]}</output></span><input id="p214-weight-${key.toLowerCase()}" data-p214-weight="${key}" type="range" min="1" max="6" step="1" value="${state.weights[key]}" aria-valuetext="Edge ${key} weight ${state.weights[key]}; stationary one-way flux ${fractionText(data.weights[key], data.totalStrength)}"/></label>`).join("")}</div><div class="p214-control-actions"><button class="secondary-button" type="button" data-problem-action="p214-challenge">Restore weights 2 · 1 · 3</button><p data-p214-control-message role="status">${state.boardMessage}</p></div><p class="p214-control-note">Selected ${edge.key}: transition probabilities ${format(edge.forwardProbability, 4)} and ${format(edge.reverseProbability, 4)}; paired stationary flux ${format(edge.forwardFlux, 6)} each way.</p></section>`;
  }

  function metricsMarkup() { const data = currentData(), edge = selectedEdgeData(data); return `<section class="p214-metrics" aria-live="polite"><article><span>Stationary mass π</span><strong>(${data.strengths.map((value) => fractionText(value, data.totalStrength)).join(", ")})</strong><small>node strength / ${data.totalStrength}</small></article><article><span>${edge.key} transition pair</span><strong>${format(edge.forwardProbability, 4)} ↔ ${format(edge.reverseProbability, 4)}</strong><small>need not match</small></article><article><span>${edge.key} flux pair</span><strong>${fractionText(edge.weight, data.totalStrength)} = ${fractionText(edge.weight, data.totalStrength)}</strong><small>must match for reversibility</small></article></section>`; }
  function distinctionMarkup() { return `<section class="p214-distinction"><strong>Detailed balance is stronger than stationarity.</strong><span>Stationarity asks total inflow to equal total outflow at each node. Detailed balance cancels flow separately on every pair. This undirected walk is reversible; a stationary chain can instead sustain circulating current.</span></section>`; }
  function dynamicMarkup() { return `<div class="p214-dynamic">${networkSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p214-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p214-solution" aria-labelledby="p214-solution-heading"><h3 id="p214-solution-heading" tabindex="-1">Stationary mass exactly compensates for unequal transitions</h3><p>The weighted degrees are</p><div class="p214-equation">dA=2+3=5, &nbsp; dB=2+1=3, &nbsp; dC=1+3=4.<br>Σᵢdᵢ=12.</div><p>For an undirected weighted random walk, stationary mass is proportional to weighted degree:</p><div class="p214-equation">π=(5/12,3/12,4/12)=(5/12,1/4,1/3).</div><p>Across AB, the transition probabilities are PAB=2/5 and PBA=2/3. Therefore</p><div class="p214-equation is-answer">πAPAB=(5/12)(2/5)=<strong>1/6,</strong><br>πBPBA=(1/4)(2/3)=<strong>1/6.</strong></div><p>The general cancellation is πᵢPᵢⱼ=(dᵢ/Σd)(wᵢⱼ/dᵢ)=wᵢⱼ/Σd, which is unchanged when i and j are reversed. These pairwise equalities imply πP=π. The converse is not automatic: global stationarity can hold while nonzero probability current circulates around a directed cycle.</p></section>`;
  }

  function snapshot() {
    const data = currentData(), edge = selectedEdgeData(data), equalWeight = networkData({ AB: 1, BC: 1, CA: 1 }), scaledChallenge = networkData({ AB: 4, BC: 2, CA: 6 });
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "random walk on a connected undirected weighted triangle; transition probability is adjacent edge weight divided by current-node strength", nodeOrder: NODES, weights: data.weights, nodeStrengths: data.strengths, totalNodeStrength: data.totalStrength, transitionMatrix: data.transitionMatrix, rowSums: data.rowSums, stationaryDistribution: data.stationary, stationaryAfterOneStep: data.stationaryAfterStep, stationaryResiduals: data.stationaryResiduals, fluxMatrix: data.fluxMatrix, detailedBalanceResiduals: data.detailedBalanceResiduals, selectedEdge: { key: edge.key, forward: edge.forward, reverse: edge.reverse, forwardTransitionProbability: edge.forwardProbability, reverseTransitionProbability: edge.reverseProbability, forwardStationaryFlux: edge.forwardFlux, reverseStationaryFlux: edge.reverseFlux, exactOneWayFlux: fractionText(edge.weight, data.totalStrength) }, distinction: "detailed balance is pairwise zero current and implies stationarity; stationarity alone permits circulation", checks: { equalWeightsStationaryDistribution: equalWeight.stationary, commonWeightScalingStationaryResiduals: scaledChallenge.stationary.map((value, index) => value - CHALLENGE_DATA.stationary[index]), commonWeightScalingABFluxResidual: scaledChallenge.fluxMatrix[0][1] - CHALLENGE_DATA.fluxMatrix[0][1] }, challenge: { weights: CHALLENGE_WEIGHTS, nodeStrengths: CHALLENGE_DATA.strengths, stationaryDistributionExact: ["5/12","1/4","1/3"], PAB: CHALLENGE_DATA.transitionMatrix[0][1], PBA: CHALLENGE_DATA.transitionMatrix[1][0], forwardFlux: CHALLENGE_DATA.fluxMatrix[0][1], reverseFlux: CHALLENGE_DATA.fluxMatrix[1][0], exactFlux: "1/6", acceptedAbsoluteTolerance: ANSWER_TOLERANCE }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p214-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Stochastic Processes</strong><span class="eyebrow">Chapter 21 · Reversibility</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p214-spread"><article class="book-page p214-problem-page"><div class="problem-number">Problem 21.4</div><h1 class="book-title p214-title">Traffic in Both Directions</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p214-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A random walker moves around an undirected weighted triangle. The edge weights are wAB=2, wBC=1 and wCA=3. From each node, it chooses an adjacent edge with probability proportional to that edge’s weight.</p><p class="problem-copy">The stationary distribution is π=(5/12,1/4,1/3). <strong>What stationary probability flux travels from A to B in one step?</strong></p><section class="p214-question-card"><strong>Transitions are not yet traffic</strong><p>PAB describes the fraction leaving A that takes AB. Probability flux πAPAB also accounts for how much stationary mass is available at A.</p></section></article><section class="book-page book-stage p214-stage" aria-labelledby="p214-stage-heading">${stageControlsMarkup()}<div class="p214-stage-heading"><div><span class="eyebrow">Reversible-flow laboratory</span><h2 id="p214-stage-heading">Inspect one edge in both directions</h2></div><p>Adjust the weights, select an edge, and watch unequal transition probabilities produce equal equilibrium flux.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p214-coach"><div class="coach-kicker">Balance edge AB</div><p class="coach-question">For the fixed weights 2, 1 and 3, enter πAPAB. A fraction, decimal or percentage is accepted.</p><form class="p214-answer-form" data-p214-answer-form novalidate><label for="p214-answer">Stationary A→B probability flux</label><input id="p214-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal"/><small>Give the one-way flux, not the sum of both directions.</small><button class="primary-button" type="submit">Check flux</button></form>${feedbackMarkup()}<div class="button-row p214-help-row"><button class="secondary-button" type="button" data-problem-action="p214-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p214-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p214-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p214-shell"); if (!root) return; const dynamic = root.querySelector(".p214-dynamic"), active = document.activeElement; let focusSelector = "";
    if (dynamic?.contains(active)) { if (active.dataset?.p214Weight) focusSelector = `[data-p214-weight="${active.dataset.p214Weight}"]`; else if (active.dataset?.p214Edge) focusSelector = `[data-p214-edge="${active.dataset.p214Edge}"]`; }
    if (dynamic) dynamic.outerHTML = dynamicMarkup(); root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (focusSelector) { const replacement = root.querySelector(focusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p214-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return; const action = control.dataset.problemAction;
      if (action === "p214-reset") { state = initialState(); renderAndFocus(renderApp, "#p214-weight-ab"); return; }
      if (action === "p214-stage") { state.stage = clamp(Math.round(control.dataset.p214Stage), 0, 2); renderAndFocus(renderApp, `[data-p214-stage="${state.stage}"]`); return; }
      if (action === "p214-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p214-stage="${state.stage}"]`); return; }
      if (action === "p214-edge") { state.selectedEdge = EDGE_KEYS.includes(control.dataset.p214Edge) ? control.dataset.p214Edge : "AB"; state.boardMessage = `Inspecting edge ${state.selectedEdge}: paired stationary flux is edge weight divided by total node strength.`; updateDynamicDom(); return; }
      if (action === "p214-challenge") { restoreChallenge(); updateDynamicDom(); return; }
      if (action === "p214-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p214-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p214-reveal") window.requestAnimationFrame(() => document.querySelector("#p214-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("[data-p214-weight]")) { const key = event.target.dataset.p214Weight; state.weights[key] = clamp(Math.round(event.target.value), 1, 6); const data = currentData(); state.boardMessage = `Weight ${key} is now ${state.weights[key]}. Stationary mass follows node strength; ${key} one-way equilibrium flux is ${fractionText(data.weights[key], data.totalStrength)}.`; updateDynamicDom(); return; }
      if (event.target.matches("#p214-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root?.querySelector("[data-p214-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p214-answer")?.value || "", answer = parseProbability(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false; const target = CHALLENGE_DATA.fluxMatrix[0][1];
      if (!Number.isFinite(answer) || answer < 0 || answer > 1) state.feedback = "Enter a probability between 0 and 1, as a fraction, decimal or percentage.";
      else if (Math.abs(answer - CHALLENGE_DATA.transitionMatrix[0][1]) <= .001) state.feedback = "2/5 is PAB, the fraction of departures from A that use AB. Multiply it by stationary mass πA.";
      else if (Math.abs(answer - CHALLENGE_DATA.stationary[0]) <= .001) state.feedback = "5/12 is the stationary mass at A, not the part that crosses AB. Multiply by PAB=2/5.";
      else if (Math.abs(answer - 2 * target) <= .001) state.feedback = "1/3 adds the equal A→B and B→A fluxes. The question asks for the one-way A→B flux.";
      else if (Math.abs(answer - target) > ANSWER_TOLERANCE) state.feedback = "Use πAPAB=(5/12)(2/5), then simplify.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: πAPAB=(5/12)(2/5)=1/6, exactly matching πBPBA."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p214-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
