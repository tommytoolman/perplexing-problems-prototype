(function registerOddDoorwaysPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "16.5";
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const BUILDINGS = Object.freeze([
    Object.freeze({ name: "Inn", x: 105, y: 88 }),
    Object.freeze({ name: "Mill", x: 365, y: 61 }),
    Object.freeze({ name: "School", x: 630, y: 91 }),
    Object.freeze({ name: "Bakery", x: 660, y: 306 }),
    Object.freeze({ name: "Hall", x: 395, y: 340 }),
    Object.freeze({ name: "Forge", x: 112, y: 311 }),
    Object.freeze({ name: "Farm", x: 365, y: 202 }),
  ]);
  const EDGE_PAIRS = Object.freeze(BUILDINGS.flatMap((_, first) => BUILDINGS.slice(first + 1).map((__, offset) => Object.freeze([first, first + offset + 1]))));
  const ALL_EDGE_MASK = (1 << EDGE_PAIRS.length) - 1;
  const INITIAL_EDGES = Object.freeze([[0, 1], [1, 6], [6, 0], [2, 3], [3, 4], [4, 5]]);
  const hints = Object.freeze([
    "Adding or removing one edge changes the degrees of exactly its two endpoints, each by one.",
    "Changing a degree by one flips its parity. So every edge move flips two vertex parities, never just one.",
    "The degree sum is twice the number of edges: Σ deg(v)=2|E|, which is even.",
    "Even-degree terms contribute nothing odd to that sum. An even sum therefore requires an even number of odd-degree terms.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p165-reset">Reset</button>';

  function edgeIndex(first, second) {
    const low = Math.min(first, second), high = Math.max(first, second);
    return EDGE_PAIRS.findIndex((pair) => pair[0] === low && pair[1] === high);
  }

  function edgeMaskFromPairs(pairs) { return pairs.reduce((mask, pair) => mask | (1 << edgeIndex(pair[0], pair[1])), 0); }
  const INITIAL_EDGE_MASK = edgeMaskFromPairs(INITIAL_EDGES);

  function initialState() {
    return { edgeMask: INITIAL_EDGE_MASK, selected: [], lastMove: null, moves: 0, moveNotice: "Select two buildings. The button will add a missing road or remove an existing one.", answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false };
  }
  let state = initialState();

  function bitCount(value) { let mask = Number(value) >>> 0, count = 0; while (mask) { mask &= mask - 1; count += 1; } return count; }
  function parityLabel(degree) { return degree % 2 ? "odd" : "even"; }
  function validVertex(index) { return Number.isInteger(index) && index >= 0 && index < BUILDINGS.length; }
  function hasEdge(edgeMask, first, second) { const index = edgeIndex(first, second); return index >= 0 && Boolean(edgeMask & (1 << index)); }

  function toggleEdgeMask(edgeMask, first, second) {
    if (!validVertex(first) || !validVertex(second) || first === second) throw new RangeError("An edge requires two distinct village buildings.");
    return edgeMask ^ (1 << edgeIndex(first, second));
  }

  function edgesFromMask(edgeMask) { return EDGE_PAIRS.filter((_, index) => Boolean(edgeMask & (1 << index))); }

  function graphAnalysis(edgeMask = state.edgeMask) {
    const degrees = Array(BUILDINGS.length).fill(0);
    const edges = edgesFromMask(edgeMask);
    edges.forEach(([first, second]) => { degrees[first] += 1; degrees[second] += 1; });
    const oddVertices = degrees.flatMap((degree, index) => degree % 2 ? [index] : []);
    const degreeSum = degrees.reduce((sum, degree) => sum + degree, 0);
    return { edges, edgeCount: edges.length, degrees, degreeSum, oddVertices, oddCount: oddVertices.length, handshakeHolds: degreeSum === 2 * edges.length, oddCountIsEven: oddVertices.length % 2 === 0 };
  }

  function samePair(pair, first, second) {
    if (!pair) return false;
    const pairFirst = pair.first ?? pair[0], pairSecond = pair.second ?? pair[1];
    return (pairFirst === first && pairSecond === second) || (pairFirst === second && pairSecond === first);
  }

  function applySelectedEdgeMove() {
    if (state.selected.length !== 2) return false;
    const [first, second] = state.selected;
    const before = graphAnalysis(), removing = hasEdge(state.edgeMask, first, second);
    state.edgeMask = toggleEdgeMask(state.edgeMask, first, second);
    const after = graphAnalysis();
    state.moves += 1;
    state.lastMove = { first, second, action: removing ? "removed" : "added", beforeDegrees: [before.degrees[first], before.degrees[second]], afterDegrees: [after.degrees[first], after.degrees[second]], oddBefore: before.oddCount, oddAfter: after.oddCount };
    state.selected = [];
    state.moveNotice = `${removing ? "Removed" : "Added"} ${BUILDINGS[first].name}–${BUILDINGS[second].name}. Both endpoint parities flipped; the odd total ${before.oddCount} → ${after.oddCount} remains even.`;
    return true;
  }

  function graphSvg() {
    const analysis = graphAnalysis();
    const selectedPair = state.selected.length === 2 ? state.selected : null;
    const activeEdges = analysis.edges.map(([first, second]) => { const a = BUILDINGS[first], b = BUILDINGS[second], isLast = state.lastMove?.action === "added" && samePair(state.lastMove, first, second); return `<line class="p165-edge ${isLast ? "is-last" : ""}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`; }).join("");
    const removedEdge = state.lastMove?.action === "removed" ? `<line class="p165-edge is-removed" x1="${BUILDINGS[state.lastMove.first].x}" y1="${BUILDINGS[state.lastMove.first].y}" x2="${BUILDINGS[state.lastMove.second].x}" y2="${BUILDINGS[state.lastMove.second].y}"/>` : "";
    const pendingEdge = selectedPair ? `<line class="p165-pending-edge ${hasEdge(state.edgeMask, selectedPair[0], selectedPair[1]) ? "will-remove" : "will-add"}" x1="${BUILDINGS[selectedPair[0]].x}" y1="${BUILDINGS[selectedPair[0]].y}" x2="${BUILDINGS[selectedPair[1]].x}" y2="${BUILDINGS[selectedPair[1]].y}"/>` : "";
    const nodes = BUILDINGS.map((building, index) => { const degree = analysis.degrees[index], vertexParity = parityLabel(degree), selected = state.selected.includes(index), flipped = state.lastMove && (state.lastMove.first === index || state.lastMove.second === index); return `<g class="p165-node is-${vertexParity} ${selected ? "is-selected" : ""} ${flipped ? "is-flipped" : ""}" transform="translate(${building.x} ${building.y})"><circle class="p165-node-halo" r="49"/><path class="p165-building-roof" d="M-42-18L0-49 42-18Z"/><rect class="p165-building-body" x="-38" y="-18" width="76" height="58" rx="8"/><rect class="p165-building-door" x="-9" y="11" width="18" height="29" rx="3"/><circle class="p165-degree-badge" cx="32" cy="-31" r="15"/><text class="p165-degree-value" x="32" y="-27" text-anchor="middle">${degree}</text><text class="p165-node-name" x="0" y="2" text-anchor="middle">${building.name}</text><text class="p165-node-parity" x="0" y="27" text-anchor="middle">${vertexParity.toUpperCase()}</text></g>`; }).join("");
    const oddNames = analysis.oddVertices.map((index) => BUILDINGS[index].name);
    const selectionDescription = state.selected.length ? ` Selected ${state.selected.map((index) => BUILDINGS[index].name).join(" and ")}.` : "";
    const moveDescription = state.lastMove ? ` Last move ${state.lastMove.action} the edge from ${BUILDINGS[state.lastMove.first].name} to ${BUILDINGS[state.lastMove.second].name}, flipping both endpoint parities.` : "";
    return `<svg class="p165-graph" viewBox="0 0 760 420" role="img" aria-labelledby="p165-svg-title p165-svg-desc"><title id="p165-svg-title">Editable village graph with building degrees</title><desc id="p165-svg-desc">The graph has ${analysis.edgeCount} edges and degree sum ${analysis.degreeSum}. ${analysis.oddCount} buildings have odd degree${oddNames.length ? `: ${oddNames.join(", ")}` : ""}. The odd-degree count is even.${selectionDescription}${moveDescription}</desc><rect class="p165-field" x="1" y="1" width="758" height="418" rx="20"/><path class="p165-river" d="M-20 215C120 154 204 285 340 224S555 138 780 216"/><g class="p165-edge-layer">${activeEdges}${removedEdge}${pendingEdge}</g><g class="p165-node-layer">${nodes}</g><text class="p165-field-label" x="24" y="28">VILLAGE ROAD GRAPH · DEGREE = NUMBER OF INCIDENT ROADS</text><g class="p165-legend" transform="translate(541 382)"><circle class="is-even" cx="0" cy="0" r="6"/><text x="11" y="3">EVEN degree</text><circle class="is-odd" cx="94" cy="0" r="6"/><text x="105" y="3">ODD degree</text></g></svg>`;
  }

  function buildingControls() {
    const analysis = graphAnalysis();
    const selectedPair = state.selected.length === 2 ? state.selected : null;
    const action = selectedPair ? hasEdge(state.edgeMask, selectedPair[0], selectedPair[1]) ? "Remove selected road" : "Add selected road" : "Select two buildings";
    return `<section class="p165-controls" aria-label="Village graph edge controls"><div class="p165-building-buttons" role="group" aria-label="Choose two endpoint buildings">${BUILDINGS.map((building, index) => `<button class="secondary-button is-${parityLabel(analysis.degrees[index])} ${state.selected.includes(index) ? "active" : ""}" type="button" data-problem-action="p165-building" data-p165-building="${index}" aria-pressed="${state.selected.includes(index)}"><span>${building.name}</span><strong>d=${analysis.degrees[index]} · ${parityLabel(analysis.degrees[index]).toUpperCase()}</strong></button>`).join("")}</div><div class="p165-edge-actions"><div><strong>${state.selected.length} of 2 endpoints selected</strong><p>${state.moveNotice}</p></div><div><button class="primary-button" type="button" data-problem-action="p165-toggle-edge" ${selectedPair ? "" : "disabled"}>${action}</button><button class="ghost-button" type="button" data-problem-action="p165-clear" ${state.selected.length ? "" : "disabled"}>Clear selection</button></div></div></section>`;
  }

  function lastMoveMarkup() {
    if (!state.lastMove) return `<section class="p165-flip-strip"><div><span class="eyebrow">Endpoint parity flip</span><strong>Every road move touches two buildings</strong></div><p>Add or remove one road to record the before-and-after degrees at both endpoints.</p></section>`;
    const move = state.lastMove;
    return `<section class="p165-flip-strip" aria-label="Last edge move parity changes"><div><span class="eyebrow">Move ${state.moves} · road ${move.action}</span><strong>${BUILDINGS[move.first].name} ↔ ${BUILDINGS[move.second].name}</strong></div>${[0, 1].map((offset) => { const vertex = offset ? move.second : move.first, before = move.beforeDegrees[offset], after = move.afterDegrees[offset]; return `<p><b>${BUILDINGS[vertex].name}</b><span>d=${before} ${parityLabel(before).toUpperCase()}</span><i>→</i><span>d=${after} ${parityLabel(after).toUpperCase()}</span></p>`; }).join("")}<p class="p165-odd-total"><b>Odd total</b><span>${move.oddBefore}</span><i>→</i><span>${move.oddAfter} · EVEN</span></p></section>`;
  }

  function handshakeMarkup() {
    const analysis = graphAnalysis();
    return `<section class="p165-handshake" aria-labelledby="p165-handshake-heading"><header><div><span class="eyebrow">Handshaking ledger</span><h3 id="p165-handshake-heading">Count every road at both ends</h3></div><strong>${analysis.oddCount} odd buildings · EVEN total</strong></header><div class="p165-degree-ledger" role="list" aria-label="Building degrees">${BUILDINGS.map((building, index) => `<span class="is-${parityLabel(analysis.degrees[index])}" role="listitem"><b>${building.name}</b><i>${analysis.degrees[index]}</i><small>${parityLabel(analysis.degrees[index])}</small></span>`).join("")}</div><div class="p165-handshake-equation"><span>Σ deg(v)</span><strong>${analysis.degrees.join(" + ")} = ${analysis.degreeSum}</strong><i>= 2 × ${analysis.edgeCount} roads</i></div><p>An even degree sum contains an even number of odd addends. The odd-degree count can be 0, 2, 4 or 6 here—but never 3.</p></section>`;
  }

  function dynamicMarkup() { return `<div class="p165-dynamic"><div class="p165-graph-wrap">${graphSvg()}<div class="p165-graph-status" aria-live="polite"><span>Roads <strong>${graphAnalysis().edgeCount}</strong></span><span>Degree sum <strong>${graphAnalysis().degreeSum}=2|E|</strong></span><span>Odd buildings <strong>${graphAnalysis().oddCount} · EVEN</strong></span><span>Challenge <strong>exactly 3</strong></span></div></div>${buildingControls()}${lastMoveMarkup()}${handshakeMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p165-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p165-solution" aria-labelledby="p165-solution-heading"><h3 id="p165-solution-heading" tabindex="-1">Odd-degree vertices come in pairs</h3><p>Every road contributes one to the degree of each of its two endpoint buildings. Therefore the sum of all degrees counts every edge twice.</p><div class="p165-equation">Σ<sub>v</sub> deg(v)=2|E|<br>so the degree sum is even.</div><p>Even-degree vertices contribute even terms. The parity of the degree sum is consequently the parity of the number of odd-degree vertices. Since the sum is even, that number must also be even.</p><div class="p165-equation is-answer"># odd-degree buildings ≡ 0 (mod 2)<br>Exactly 3 is impossible.</div><p>Editing a single edge gives the same local view: its two endpoint degrees each change by one, so two vertex parities flip together.</p></section>`;
  }

  function snapshot() {
    const analysis = graphAnalysis();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "finite simple undirected graph; buildings are vertices and roads are edges", buildingCount: BUILDINGS.length, edgeCapacity: EDGE_PAIRS.length, edgeMask: state.edgeMask.toString(2).padStart(EDGE_PAIRS.length, "0"), edges: analysis.edges.map(([first, second]) => `${BUILDINGS[first].name}—${BUILDINGS[second].name}`), edgeCount: analysis.edgeCount, degrees: Object.fromEntries(BUILDINGS.map((building, index) => [building.name, { degree: analysis.degrees[index], parity: parityLabel(analysis.degrees[index]) }])), degreeSum: analysis.degreeSum, twiceEdgeCount: 2 * analysis.edgeCount, handshakeHolds: analysis.handshakeHolds, oddDegreeBuildings: analysis.oddVertices.map((index) => BUILDINGS[index].name), oddDegreeCount: analysis.oddCount, oddDegreeCountIsEven: analysis.oddCountIsEven, targetOddDegreeCount: 3, targetPossible: false, selectedBuildings: state.selected.map((index) => BUILDINGS[index].name), lastMove: state.lastMove, movesApplied: state.moves, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p165-shell"><div class="p165-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Graph invariants</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p165-spread"><article class="book-page p165-problem-page"><div class="problem-number">Problem 16.5</div><h1 class="book-title p165-title">The Village of Odd Doorways</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="problem-copy">Buildings are joined by roads. A building’s degree is the number of roads meeting it.</p><p class="problem-copy"><strong>Can a finite village have exactly three buildings of odd degree?</strong></p><section class="p165-observation-card"><strong>Every road has two ends</strong><p>Edit the graph. Each road move changes two degrees, while the full degree ledger always counts every road twice.</p></section><section class="p165-model-card"><div class="eyebrow">Finite simple graph</div><p>Roads are undirected, no road joins a building to itself, and at most one road connects each pair.</p></section></article><section class="book-page book-stage p165-stage" aria-labelledby="p165-stage-title"><div class="p165-stage-heading"><div><span class="eyebrow">Editable village laboratory</span><h2 id="p165-stage-title">Add a road; flip two parities</h2></div><p>Choose two buildings beneath the map. Add or remove their road and follow both the local parity flip and the global degree sum.</p></div>${dynamicMarkup()}</section><aside class="book-page book-coach p165-coach"><div class="coach-kicker">Judge the proposed village</div><form class="p165-answer-form" data-p165-answer-form novalidate><fieldset><legend>Can exactly three buildings have odd degree?</legend><label><input type="radio" name="p165-possible" value="yes" ${state.answer === "yes" ? "checked" : ""}/> Yes, it is possible</label><label><input type="radio" name="p165-possible" value="no" ${state.answer === "no" ? "checked" : ""}/> No, it is impossible</label></fieldset><button class="primary-button" type="submit">Check conclusion</button></form>${feedbackMarkup()}<div class="button-row p165-help-row"><button class="secondary-button" type="button" data-problem-action="p165-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p165-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p165-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p165-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control || !root.contains(control)) return;
      const action = control.dataset.problemAction;
      if (action === "p165-reset") { resetChallenge(); renderAndFocus(renderApp, '[data-p165-building="0"]'); return; }
      if (action === "p165-building") {
        const index = Number(control.dataset.p165Building), existing = state.selected.indexOf(index);
        if (!validVertex(index)) return;
        if (existing >= 0) state.selected.splice(existing, 1);
        else if (state.selected.length < 2) state.selected.push(index);
        else { state.moveNotice = "Two endpoints are already selected. Deselect one before choosing another."; renderAndFocus(renderApp, `[data-p165-building="${index}"]`); return; }
        if (state.selected.length === 2) state.moveNotice = `${BUILDINGS[state.selected[0]].name} and ${BUILDINGS[state.selected[1]].name} selected. This will ${hasEdge(state.edgeMask, state.selected[0], state.selected[1]) ? "remove their road" : "add a road"}.`;
        else if (state.selected.length === 1) state.moveNotice = `${BUILDINGS[state.selected[0]].name} selected; choose the other endpoint.`;
        else state.moveNotice = "Selection cleared. Choose two buildings.";
        renderAndFocus(renderApp, `[data-p165-building="${index}"]`); return;
      }
      if (action === "p165-clear") { state.selected = []; state.moveNotice = "Selection cleared. Choose two buildings."; renderAndFocus(renderApp, '[data-p165-building="0"]'); return; }
      if (action === "p165-toggle-edge" && state.selected.length === 2) { const focusIndex = state.selected[0]; applySelectedEdgeMove(); renderAndFocus(renderApp, `[data-p165-building="${focusIndex}"]`); return; }
      if (action === "p165-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p165-reveal") state.revealed = true;
      renderApp(); if (action === "p165-reveal") window.requestAnimationFrame(() => document.querySelector("#p165-solution-heading")?.focus());
    });
    root?.querySelectorAll('input[name="p165-possible"]').forEach((input) => input.addEventListener("change", (event) => { state.answer = event.target.value; state.feedback = ""; state.committed = false; }));
    root?.querySelector("[data-p165-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const checked = event.currentTarget.querySelector('input[name="p165-possible"]:checked'); state.answer = checked?.value || ""; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer) state.feedback = "Choose yes or no before checking.";
      else if (state.answer === "no") { state.feedbackTone = "success"; state.feedback = "Correct. The handshaking lemma forces the number of odd-degree buildings to be even."; state.committed = true; }
      else state.feedback = "A road contributes one degree at each of two endpoints. Add all building degrees and examine the parity of that total.";
      renderAndFocus(renderApp, 'input[name="p165-possible"]:checked');
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
