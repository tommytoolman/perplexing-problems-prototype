(function registerTwelveLampsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "17.1";
  const CHALLENGE = Object.freeze({ lampCount: 12, targetDegree: 3 });
  const stages = Object.freeze([
    Object.freeze({ short: "Wire", title: "Build an undirected simple network", copy: "Select two different lamps to toggle their wire, or activate an existing wire to remove it. Loops and duplicate wires are not allowed." }),
    Object.freeze({ short: "Degrees", title: "Count the wire-ends at every lamp", copy: "The degree of a lamp is the number of incident wires. Adding one wire increases two vertex degrees by one." }),
    Object.freeze({ short: "Handshake", title: "Reconcile the two ledgers", copy: "Summing degrees counts every wire once at each endpoint, so Σdeg=2E. An odd requested degree sum can never equal twice an integer." }),
  ]);
  const hints = Object.freeze([
    "Twelve lamps each of degree three require 12×3 degree-stubs in total.",
    "Each undirected wire contributes one degree at each of its two endpoints.",
    "Therefore the handshaking identity is Σdeg=2E.",
    "Solve 12×3=2E. The resulting integer is both necessary and achievable by a 3-regular network on 12 lamps.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p171-reset">Reset</button>';

  function edgeKey(left, right) { return left < right ? `${left}-${right}` : `${right}-${left}`; }
  function parseEdge(key) { return key.split("-").map(Number); }

  function cycleEdges(lampCount) {
    const edges = new Set();
    if (lampCount === 2) edges.add(edgeKey(0, 1));
    else for (let lamp = 0; lamp < lampCount; lamp += 1) edges.add(edgeKey(lamp, (lamp + 1) % lampCount));
    return [...edges].sort();
  }

  function regularEdges(lampCount, degree) {
    if (degree < 0 || degree >= lampCount || (lampCount * degree) % 2) return null;
    const edges = new Set();
    for (let offset = 1; offset <= Math.floor(degree / 2); offset += 1) for (let lamp = 0; lamp < lampCount; lamp += 1) edges.add(edgeKey(lamp, (lamp + offset) % lampCount));
    if (degree % 2) for (let lamp = 0; lamp < lampCount / 2; lamp += 1) edges.add(edgeKey(lamp, lamp + lampCount / 2));
    return [...edges].sort();
  }

  const initialState = () => ({ lampCount: CHALLENGE.lampCount, targetDegree: CHALLENGE.targetDegree, edges: cycleEdges(CHALLENGE.lampCount), selectedLamp: null, editCount: 0, boardMessage: "Select two lamps to toggle a wire, or choose a wire to remove it.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeInteger(value) { return String(value).replace(/[^0-9\s]/g, "").slice(0, 12); }

  function graphData(lampCount = state.lampCount, targetDegree = state.targetDegree, edges = state.edges) {
    const degrees = Array(lampCount).fill(0);
    for (const key of edges) {
      const [left, right] = parseEdge(key);
      if (left >= 0 && right < lampCount && left !== right) { degrees[left] += 1; degrees[right] += 1; }
    }
    const edgeCount = edges.length;
    const degreeSum = degrees.reduce((sum, degree) => sum + degree, 0);
    const targetDegreeSum = lampCount * targetDegree;
    const targetParityPossible = targetDegreeSum % 2 === 0;
    const simpleDegreePossible = targetDegree >= 0 && targetDegree < lampCount;
    const targetPossible = targetParityPossible && simpleDegreePossible;
    const targetEdgeCount = targetPossible ? targetDegreeSum / 2 : null;
    const exactVertices = degrees.filter((degree) => degree === targetDegree).length;
    const deficit = degrees.reduce((sum, degree) => sum + Math.max(0, targetDegree - degree), 0);
    const surplus = degrees.reduce((sum, degree) => sum + Math.max(0, degree - targetDegree), 0);
    const meetsTarget = targetPossible && exactVertices === lampCount;
    return { degrees, edgeCount, degreeSum, doubledEdges: 2 * edgeCount, handshakeResidual: degreeSum - 2 * edgeCount, targetDegreeSum, targetParityPossible, simpleDegreePossible, targetPossible, targetEdgeCount, exactVertices, deficit, surplus, meetsTarget };
  }

  function lampPoint(index, count = state.lampCount) {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
    return { x: 245 + 184 * Math.cos(angle), y: 235 + 184 * Math.sin(angle) };
  }

  function toggleEdge(left, right) {
    if (left === right) { state.boardMessage = "A loop from a lamp to itself is not allowed in this simple graph."; return false; }
    const key = edgeKey(left, right);
    const existing = state.edges.indexOf(key);
    if (existing >= 0) { state.edges.splice(existing, 1); state.boardMessage = `Removed wire ${left + 1}—${right + 1}.`; }
    else { state.edges.push(key); state.edges.sort(); state.boardMessage = `Added wire ${left + 1}—${right + 1}.`; }
    state.editCount += 1;
    return true;
  }

  function selectLamp(lamp) {
    if (state.selectedLamp === null) { state.selectedLamp = lamp; state.boardMessage = `Lamp ${lamp + 1} selected. Choose a different lamp.`; return; }
    if (state.selectedLamp === lamp) { state.selectedLamp = null; state.boardMessage = "Lamp selection cleared."; return; }
    const first = state.selectedLamp;
    state.selectedLamp = null;
    toggleEdge(first, lamp);
  }

  function removeEdge(key) {
    const index = state.edges.indexOf(key);
    if (index < 0) return;
    const [left, right] = parseEdge(key);
    state.edges.splice(index, 1);
    state.selectedLamp = null;
    state.editCount += 1;
    state.boardMessage = `Removed wire ${left + 1}—${right + 1}.`;
  }

  function resetGraph(mode = "cycle") {
    state.selectedLamp = null;
    state.editCount = 0;
    if (mode === "clear") { state.edges = []; state.boardMessage = "All wires removed."; return; }
    if (mode === "target") {
      const target = regularEdges(state.lampCount, state.targetDegree);
      if (target === null) { state.boardMessage = `Impossible target: ${state.lampCount}×${state.targetDegree} is odd, so the requested degree sum cannot equal 2E.`; return; }
      state.edges = target;
      state.boardMessage = `Built a ${state.targetDegree}-regular example with ${target.length} wires.`;
      return;
    }
    state.edges = cycleEdges(state.lampCount);
    state.boardMessage = `Loaded the ${state.lampCount}-lamp cycle.`;
  }

  function originalExtensionNote() {
    return `<p class="p171-extension-note"><strong>Original extension.</strong> This chapter and activity were created for this project and do not appear in Professor Povey’s <em>Perplexing Problems</em>.</p>`;
  }

  function stageControls() {
    return `<div class="p171-stage-controls" role="group" aria-label="Network handshaking stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p171-stage" data-p171-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p171-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p171-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Ledger reconciled" : "Next stage"}</button></div>`;
  }

  function networkSvg() {
    const values = graphData();
    const wireMarkup = state.edges.map((key) => {
      const [left, right] = parseEdge(key);
      const start = lampPoint(left), end = lampPoint(right);
      return `<g class="p171-wire" data-p171-edge="${key}" tabindex="0" role="button" aria-label="Wire between lamp ${left + 1} and lamp ${right + 1}; activate to remove"><line class="p171-wire-hit" x1="${format(start.x, 3)}" y1="${format(start.y, 3)}" x2="${format(end.x, 3)}" y2="${format(end.y, 3)}"/><line class="p171-wire-visible" x1="${format(start.x, 3)}" y1="${format(start.y, 3)}" x2="${format(end.x, 3)}" y2="${format(end.y, 3)}"/></g>`;
    }).join("");
    const lampMarkup = Array.from({ length: state.lampCount }, (_, lamp) => {
      const point = lampPoint(lamp);
      const degree = values.degrees[lamp];
      const relation = degree === state.targetDegree ? "exact" : degree < state.targetDegree ? "under" : "over";
      return `<g class="p171-lamp is-${relation} ${state.selectedLamp === lamp ? "is-selected" : ""}" data-p171-lamp="${lamp}" tabindex="0" role="button" aria-label="Lamp ${lamp + 1}, degree ${degree}, target ${state.targetDegree}${state.selectedLamp === lamp ? ", selected" : ""}"><circle class="p171-lamp-halo" cx="${format(point.x, 3)}" cy="${format(point.y, 3)}" r="24"/><circle class="p171-lamp-core" cx="${format(point.x, 3)}" cy="${format(point.y, 3)}" r="16"/><text class="p171-lamp-number" x="${format(point.x, 3)}" y="${format(point.y + 4, 3)}" text-anchor="middle">${lamp + 1}</text><text class="p171-degree-label" x="${format(point.x, 3)}" y="${format(point.y + 37, 3)}" text-anchor="middle">deg ${degree}</text></g>`;
    }).join("");
    const targetStatus = values.targetPossible ? values.meetsTarget ? "TARGET NETWORK COMPLETE" : `${values.exactVertices}/${state.lampCount} LAMPS AT DEGREE ${state.targetDegree}` : "ODD TARGET DEGREE SUM · IMPOSSIBLE";
    return `<svg class="p171-network p171-stage-${state.stage} ${values.targetPossible ? "is-possible" : "is-impossible"} ${values.meetsTarget ? "is-complete" : ""}" viewBox="0 0 720 470" role="group" aria-labelledby="p171-network-title p171-network-desc"><title id="p171-network-title">Interactive undirected lamp network</title><desc id="p171-network-desc">${state.lampCount} labelled lamps and ${values.edgeCount} undirected wires. Degrees are ${values.degrees.join(", ")}, which sum to ${values.degreeSum}; twice the edge count is ${values.doubledEdges}. The requested degree is ${state.targetDegree} at every lamp, for target degree sum ${values.targetDegreeSum}. ${values.targetPossible ? values.meetsTarget ? "The current graph meets the target." : "The target is possible but the current graph does not meet it." : "The target is impossible because its degree sum is odd."} Select two lamps to toggle a wire or activate a wire to remove it.</desc><defs><radialGradient id="p171-lamp-glow"><stop offset="0" stop-color="#fff7bc" stop-opacity=".95"/><stop offset=".5" stop-color="#f1bf4e" stop-opacity=".5"/><stop offset="1" stop-color="#f1bf4e" stop-opacity="0"/></radialGradient></defs><rect class="p171-board" x="1" y="1" width="718" height="468" rx="18"/><g class="p171-grid" aria-hidden="true">${Array.from({ length: 11 }, (_, index) => `<line x1="${20 + index * 45}" y1="20" x2="${20 + index * 45}" y2="450"/>`).join("")}${Array.from({ length: 10 }, (_, index) => `<line x1="20" y1="${30 + index * 45}" x2="480" y2="${30 + index * 45}"/>`).join("")}</g><text class="p171-board-kicker" x="20" y="27">UNDIRECTED SIMPLE NETWORK · CLICK LAMPS OR WIRES</text><g class="p171-wires">${wireMarkup}</g><g class="p171-lamps">${lampMarkup}</g><g class="p171-ledger" transform="translate(500 26)"><rect class="p171-ledger-bg" width="198" height="418" rx="14"/><text class="p171-ledger-title" x="16" y="24">HANDSHAKING LEDGER</text><text class="p171-ledger-kicker" x="16" y="55">CURRENT GRAPH</text><text class="p171-ledger-label" x="16" y="79">wires E</text><text class="p171-ledger-value" x="181" y="79" text-anchor="end">${values.edgeCount}</text><text class="p171-ledger-label" x="16" y="103">Σ degrees</text><text class="p171-ledger-value" x="181" y="103" text-anchor="end">${state.stage >= 1 || state.revealed ? values.degreeSum : "stage 2"}</text><text class="p171-ledger-label" x="16" y="127">2E</text><text class="p171-ledger-value" x="181" y="127" text-anchor="end">${state.stage >= 2 || state.revealed ? values.doubledEdges : "stage 3"}</text><line class="p171-ledger-rule" x1="16" y1="143" x2="181" y2="143"/><text class="p171-identity" x="99" y="169" text-anchor="middle">Σdeg = 2E</text><text class="p171-ledger-note" x="99" y="188" text-anchor="middle">residual ${values.handshakeResidual}</text><text class="p171-ledger-kicker" x="16" y="225">REQUESTED REGULAR GRAPH</text><text class="p171-ledger-label" x="16" y="250">n × target degree</text><text class="p171-ledger-value" x="181" y="250" text-anchor="end">${state.lampCount}×${state.targetDegree}=${values.targetDegreeSum}</text><text class="p171-ledger-label" x="16" y="274">required wires</text><text class="p171-ledger-value" x="181" y="274" text-anchor="end">${values.targetPossible ? values.targetEdgeCount : `${values.targetDegreeSum}/2`}</text><rect class="p171-status-box" x="12" y="302" width="174" height="83" rx="11"/><text class="p171-status-title" x="99" y="328" text-anchor="middle">${targetStatus}</text><text class="p171-status-note" x="99" y="351" text-anchor="middle">${values.targetPossible ? `deficit ${values.deficit} · surplus ${values.surplus}` : "2E is always even"}</text><text class="p171-status-note" x="99" y="370" text-anchor="middle">${values.targetPossible ? `target E=${values.targetEdgeCount}` : "no integer wire count"}</text></g></svg>`;
  }

  function graphControlsMarkup() {
    const values = graphData();
    return `<section class="p171-graph-controls"><p class="p171-board-message" role="status">${state.boardMessage}</p><div><button class="primary-button" type="button" data-problem-action="p171-build-target" ${values.targetPossible ? "" : "disabled"}>Build target example</button><button class="secondary-button" type="button" data-problem-action="p171-cycle">Load cycle</button><button class="secondary-button" type="button" data-problem-action="p171-clear">Clear wires</button><button class="ghost-button" type="button" data-problem-action="p171-clear-selection" ${state.selectedLamp === null ? "disabled" : ""}>Clear selection</button></div></section>`;
  }

  function metricsMarkup() {
    const values = graphData();
    return `<section class="p171-metrics" aria-live="polite"><div><span>Current wires E</span><strong>${values.edgeCount}</strong></div><div><span>Current Σdeg</span><strong>${values.degreeSum}</strong></div><div><span>Required target wires</span><strong>${state.stage >= 2 || state.revealed ? values.targetPossible ? values.targetEdgeCount : "impossible" : "stage 3"}</strong></div><div><span>Vertices at target degree</span><strong>${values.exactVertices}/${state.lampCount}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p171-dynamic"><div class="p171-network-wrap">${networkSvg()}${graphControlsMarkup()}</div>${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = graphData();
    return `<section class="p171-controls" aria-label="Network size and target controls"><div class="p171-control-grid"><label for="p171-lamp-count"><span>Lamp count n<output data-p171-output="lamps">${state.lampCount}</output></span><input id="p171-lamp-count" type="range" min="2" max="16" step="1" value="${state.lampCount}"/></label><label for="p171-target-degree"><span>Target degree d<output data-p171-output="degree">${state.targetDegree}</output></span><input id="p171-target-degree" type="range" min="0" max="${state.lampCount - 1}" step="1" value="${state.targetDegree}"/></label></div><p data-p171-control-note>${values.targetPossible ? `A simple ${state.targetDegree}-regular graph on ${state.lampCount} vertices is possible and needs ${values.targetEdgeCount} wires.` : `Impossible target: n×d=${values.targetDegreeSum} is odd, but every undirected graph has even degree sum 2E.`} Changing n loads its cycle; changing d leaves the current wires in place.</p><button class="chip-button" type="button" data-problem-action="p171-challenge">Restore 12 lamps, target degree 3</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p171-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p171-solution" aria-labelledby="p171-solution-heading"><h3 id="p171-solution-heading" tabindex="-1">Count every wire-end, then divide by two</h3><p>Each of the twelve lamps has degree three, so the requested degree sum is</p><div class="p171-solution-equation">Σdeg=12×3=36.</div><p>An undirected wire contributes one to the degree at each endpoint. Therefore every wire contributes two to the sum:</p><div class="p171-solution-equation is-answer">2E=36<br>E=36/2=18 wires.</div><p>This count is achievable: the target builder displays one simple 3-regular graph on twelve lamps. The handshaking identity also exposes impossible targets. If n×d were odd, no integer E could satisfy n×d=2E because the right-hand side is always even.</p></section>`;
  }

  function snapshot() {
    const values = graphData();
    return JSON.stringify({ problem: PROBLEM, provenance: "original extension created for this project; not in Professor Povey's Perplexing Problems", model: "undirected simple graph; no loops or parallel edges", lampCount: state.lampCount, targetDegree: state.targetDegree, edgesZeroIndexed: state.edges.map(parseEdge), edgeCount: values.edgeCount, degrees: values.degrees, degreeSum: values.degreeSum, doubledEdgeCount: values.doubledEdges, handshakeResidual: values.handshakeResidual, targetDegreeSum: values.targetDegreeSum, targetParityPossible: values.targetParityPossible, targetSimpleGraphPossible: values.targetPossible, targetEdgeCount: values.targetEdgeCount, verticesAtTargetDegree: values.exactVertices, meetsTarget: values.meetsTarget, selectedLamp: state.selectedLamp === null ? null : state.selectedLamp + 1, editCount: state.editCount, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.lampCount = CHALLENGE.lampCount; state.targetDegree = CHALLENGE.targetDegree; resetGraph("cycle"); }
  function render() {
    return `<main class="book-shell p171-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · graph theory</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p171-spread"><article class="book-page p171-problem-page"><div class="problem-number">Problem 17.1</div><h1 class="book-title p171-title">Twelve Lamps, Eighteen Wires</h1><div class="difficulty" aria-label="One star difficulty">★</div>${originalExtensionNote()}<p class="problem-copy">Twelve lamps are joined by undirected wires so that exactly three wires meet at every lamp. There are no loops and no duplicate wires.</p><p class="problem-copy"><strong>How many wires are required?</strong></p><section class="p171-observation-card"><strong>Count wire-ends, not drawings</strong><p>A tangled picture can hide its edge count. Vertex degrees retain exactly the information the handshaking identity needs.</p></section><section class="p171-model-card"><div class="eyebrow">Undirected simple graph</div><p>Lamps are vertices and wires are edges. Every wire has two distinct endpoints.</p></section></article><section class="book-page book-stage p171-stage">${stageControls()}<div class="p171-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p171-coach"><div class="coach-kicker">Reconcile the degree ledger</div><p class="coach-question">For twelve degree-three lamps, enter the exact number of undirected wires.</p><form class="p171-answer-form" data-p171-answer-form novalidate><label for="p171-answer">Required wire count</label><div><input id="p171-answer" type="text" inputmode="numeric" value="${escapeAttribute(state.answer)}" placeholder="whole number" autocomplete="off"/><span>wires</span></div><button class="primary-button" type="submit">Check wire count</button></form>${feedbackMarkup()}<div class="button-row p171-help-row"><button class="secondary-button" type="button" data-problem-action="p171-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p171-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p171-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p171-shell"); if (!root) return;
    const dynamic = root.querySelector(".p171-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const lampOutput = root.querySelector('[data-p171-output="lamps"]'); if (lampOutput) lampOutput.textContent = state.lampCount;
    const degreeOutput = root.querySelector('[data-p171-output="degree"]'); if (degreeOutput) degreeOutput.textContent = state.targetDegree;
    const targetSlider = root.querySelector("#p171-target-degree"); if (targetSlider) { targetSlider.max = state.lampCount - 1; targetSlider.value = state.targetDegree; }
    const values = graphData();
    const controlNote = root.querySelector("[data-p171-control-note]"); if (controlNote) controlNote.textContent = `${values.targetPossible ? `A simple ${state.targetDegree}-regular graph on ${state.lampCount} vertices is possible and needs ${values.targetEdgeCount} wires.` : `Impossible target: n×d=${values.targetDegreeSum} is odd, but every undirected graph has even degree sum 2E.`} Changing n loads its cycle; changing d leaves the current wires in place.`;
    root.querySelector("#p171-lamp-count")?.setAttribute("aria-valuetext", `${state.lampCount} lamps; target degree ${state.targetDegree}; ${values.targetPossible ? `${values.targetEdgeCount} target wires` : "odd degree sum impossible"}`);
    targetSlider?.setAttribute("aria-valuetext", `Target degree ${state.targetDegree}; target degree sum ${values.targetDegreeSum}; ${values.targetPossible ? `requires ${values.targetEdgeCount} wires` : "impossible odd sum"}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p171-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p171-reset") { state = initialState(); renderAndFocus(renderApp, "#p171-lamp-count"); return; }
        if (action === "p171-stage") { state.stage = clamp(Number(actionControl.dataset.p171Stage), 0, 2); renderAndFocus(renderApp, `[data-p171-stage="${state.stage}"]`); return; }
        if (action === "p171-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p171-stage="${state.stage}"]`); return; }
        if (action === "p171-build-target") resetGraph("target");
        if (action === "p171-cycle") resetGraph("cycle");
        if (action === "p171-clear") resetGraph("clear");
        if (action === "p171-clear-selection") { state.selectedLamp = null; state.boardMessage = "Lamp selection cleared."; }
        if (action === "p171-challenge") restoreChallenge();
        if (action === "p171-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p171-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
        renderApp(); if (action === "p171-reveal") window.requestAnimationFrame(() => document.querySelector("#p171-solution-heading")?.focus()); return;
      }
      const wire = event.target.closest("[data-p171-edge]");
      if (wire) { removeEdge(wire.dataset.p171Edge); renderApp(); return; }
      const lamp = event.target.closest("[data-p171-lamp]");
      if (lamp) { selectLamp(Number(lamp.dataset.p171Lamp)); renderApp(); }
    });
    root?.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      const wire = event.target.closest("[data-p171-edge]");
      const lamp = event.target.closest("[data-p171-lamp]");
      if (!wire && !lamp) return;
      event.preventDefault();
      if (wire) removeEdge(wire.dataset.p171Edge); else selectLamp(Number(lamp.dataset.p171Lamp));
      renderApp();
    });
    document.querySelector("#p171-lamp-count")?.addEventListener("input", (event) => { state.lampCount = clamp(Number(event.target.value), 2, 16); state.targetDegree = Math.min(state.targetDegree, state.lampCount - 1); resetGraph("cycle"); updateDynamicDom(); });
    document.querySelector("#p171-target-degree")?.addEventListener("input", (event) => { state.targetDegree = clamp(Number(event.target.value), 0, state.lampCount - 1); state.selectedLamp = null; state.boardMessage = `Target changed to degree ${state.targetDegree}; current wires retained.`; updateDynamicDom(); });
    const input = document.querySelector("#p171-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeInteger(event.target.value); });
    document.querySelector("[data-p171-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeInteger(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isInteger(answer)) state.feedback = "Enter one whole-number wire count.";
      else if (answer === 36) state.feedback = "Thirty-six is the sum of the degrees—the number of wire-ends. Every wire has two ends.";
      else if (answer !== 18) state.feedback = "Use Σdeg=12×3 and the handshaking identity Σdeg=2E.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: 12×3=36 degree-stubs, so E=36/2=18 wires."; }
      renderAndFocus(renderApp, "#p171-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
