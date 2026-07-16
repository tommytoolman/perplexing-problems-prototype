(function registerMidnightRadioWheelPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "17.4";
  const CHALLENGE_RIM = 5;
  const CHANNELS = Object.freeze([
    Object.freeze({ name: "Amber", short: "A" }),
    Object.freeze({ name: "Cyan", short: "C" }),
    Object.freeze({ name: "Violet", short: "V" }),
    Object.freeze({ name: "Green", short: "G" }),
  ]);
  const stages = Object.freeze([
    Object.freeze({ short: "Rim", title: "Colour neighbouring guards differently", copy: "The guards form a cycle. Alternating two channels closes cleanly only when the number of rim guards is even." }),
    Object.freeze({ short: "Centre", title: "The dispatcher hears every guard", copy: "The central dispatcher is adjacent to every rim vertex, so its channel must differ from every channel used around the rim." }),
    Object.freeze({ short: "Parity", title: "Turn the construction into a chromatic-number proof", copy: "An even cycle needs two colours and an odd cycle needs three; the universal centre then forces one additional colour." }),
  ]);
  const hints = Object.freeze([
    "Ignore the dispatcher first. Five guards form an odd cycle, so two alternating channels fail at the closing edge.",
    "An odd cycle needs at least three channels, and a three-channel rim colouring can be constructed.",
    "The dispatcher is connected to every guard, so it cannot reuse any channel appearing on the rim.",
    "Thus a five-guard rim uses three channels and the centre needs a fourth. Four channels are also sufficient, so the answer is exact.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p174-reset">Reset</button>';

  function wheelEdges(rimSize) {
    const edges = [];
    for (let guard = 0; guard < rimSize; guard += 1) edges.push({ left: guard, right: (guard + 1) % rimSize, kind: "rim" });
    for (let guard = 0; guard < rimSize; guard += 1) edges.push({ left: guard, right: rimSize, kind: "spoke" });
    return edges;
  }

  function chromaticNumber(rimSize) { return rimSize % 2 === 0 ? 3 : 4; }

  function optimalColoring(rimSize) {
    const colors = Array(rimSize + 1).fill(null);
    if (rimSize % 2 === 0) {
      for (let guard = 0; guard < rimSize; guard += 1) colors[guard] = guard % 2;
      colors[rimSize] = 2;
    } else {
      for (let guard = 0; guard < rimSize - 1; guard += 1) colors[guard] = guard % 2;
      colors[rimSize - 1] = 2;
      colors[rimSize] = 3;
    }
    return colors;
  }

  const initialState = () => ({ rimSize: CHALLENGE_RIM, colors: Array(CHALLENGE_RIM + 1).fill(null), activeChannel: 0, stage: 0, editCount: 0, boardMessage: "Amber selected. Assign a channel to any guard or to the dispatcher.", answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeInteger(value) { return String(value).replace(/[^0-9\s]/g, "").slice(0, 12); }

  function coloringData(rimSize = state.rimSize, colors = state.colors) {
    const edges = wheelEdges(rimSize);
    const conflicts = edges.filter((edge) => colors[edge.left] !== null && colors[edge.left] === colors[edge.right]);
    const assignedCount = colors.filter((color) => color !== null).length;
    const usedColors = [...new Set(colors.filter((color) => color !== null))].sort();
    const complete = assignedCount === rimSize + 1;
    const proper = complete && conflicts.length === 0;
    const chromatic = chromaticNumber(rimSize);
    const optimal = proper && usedColors.length === chromatic;
    const rimColors = [...new Set(colors.slice(0, rimSize).filter((color) => color !== null))];
    return { edges, conflicts, assignedCount, usedColors, complete, proper, chromatic, optimal, rimColors, edgeCount: edges.length };
  }

  function vertexPoint(vertex, rimSize = state.rimSize) {
    if (vertex === rimSize) return { x: 242, y: 231 };
    const angle = -Math.PI / 2 + vertex * Math.PI * 2 / rimSize;
    return { x: 242 + 176 * Math.cos(angle), y: 231 + 176 * Math.sin(angle) };
  }

  function assignColor(vertex) {
    const color = state.activeChannel;
    state.colors[vertex] = color;
    state.editCount += 1;
    const label = vertex === state.rimSize ? "dispatcher" : `guard ${vertex + 1}`;
    state.boardMessage = color === null ? `Cleared ${label}.` : `Assigned ${CHANNELS[color].name} to ${label}.`;
  }

  function clearColoring() { state.colors = Array(state.rimSize + 1).fill(null); state.editCount = 0; state.boardMessage = "All channel assignments cleared."; }
  function buildOptimalColoring() { state.colors = optimalColoring(state.rimSize); state.editCount = 0; state.boardMessage = `Built an optimal ${chromaticNumber(state.rimSize)}-channel colouring for a ${state.rimSize}-guard rim.`; }

  function originalExtensionNote() {
    return `<p class="p174-extension-note"><strong>Original extension.</strong> This chapter and activity were created for this project and do not appear in Professor Povey’s <em>Perplexing Problems</em>.</p>`;
  }

  function stageControls() {
    return `<div class="p174-stage-controls" role="group" aria-label="Wheel graph colouring stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p174-stage" data-p174-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p174-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p174-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Parity resolved" : "Next stage"}</button></div>`;
  }

  function wheelSvg() {
    const values = coloringData();
    const conflictKeys = new Set(values.conflicts.map((edge) => `${edge.kind}:${Math.min(edge.left, edge.right)}-${Math.max(edge.left, edge.right)}`));
    const edgeMarkup = values.edges.map((edge) => {
      const start = vertexPoint(edge.left), end = vertexPoint(edge.right);
      const key = `${edge.kind}:${Math.min(edge.left, edge.right)}-${Math.max(edge.left, edge.right)}`;
      return `<line class="p174-edge is-${edge.kind} ${conflictKeys.has(key) ? "is-conflict" : ""}" x1="${format(start.x, 3)}" y1="${format(start.y, 3)}" x2="${format(end.x, 3)}" y2="${format(end.y, 3)}"/>`;
    }).join("");
    const vertexMarkup = Array.from({ length: state.rimSize + 1 }, (_, vertex) => {
      const point = vertexPoint(vertex);
      const isHub = vertex === state.rimSize;
      const color = state.colors[vertex];
      const conflictCount = values.conflicts.filter((edge) => edge.left === vertex || edge.right === vertex).length;
      const label = isHub ? "Dispatcher" : `Guard ${vertex + 1}`;
      const channelLabel = color === null ? "unassigned" : CHANNELS[color].name;
      return `<g class="p174-vertex ${isHub ? "is-hub" : "is-rim"} ${color === null ? "is-unassigned" : `channel-${color}`} ${conflictCount ? "has-conflict" : ""}" data-p174-vertex="${vertex}" tabindex="0" role="button" aria-label="${label}; ${channelLabel}${conflictCount ? `; ${conflictCount} channel conflict${conflictCount === 1 ? "" : "s"}` : ""}"><circle class="p174-vertex-halo" cx="${format(point.x, 3)}" cy="${format(point.y, 3)}" r="${isHub ? 36 : 30}"/><circle class="p174-vertex-core" cx="${format(point.x, 3)}" cy="${format(point.y, 3)}" r="${isHub ? 25 : 21}"/><text class="p174-vertex-label" x="${format(point.x, 3)}" y="${format(point.y + 4, 3)}" text-anchor="middle">${isHub ? "D" : vertex + 1}</text><text class="p174-channel-label" x="${format(point.x, 3)}" y="${format(point.y + (isHub ? 49 : 43), 3)}" text-anchor="middle">${color === null ? "—" : CHANNELS[color].short}</text></g>`;
    }).join("");
    const status = values.conflicts.length ? `${values.conflicts.length} CHANNEL CONFLICT${values.conflicts.length === 1 ? "" : "S"}` : values.optimal ? `OPTIMAL ${values.chromatic}-CHANNEL PLAN` : values.proper ? `VALID · ${values.usedColors.length} CHANNELS` : `${values.assignedCount}/${state.rimSize + 1} VERTICES ASSIGNED`;
    return `<svg class="p174-wheel p174-stage-${state.stage} ${values.conflicts.length ? "has-conflicts" : ""} ${values.optimal ? "is-optimal" : ""}" viewBox="0 0 720 470" role="group" aria-labelledby="p174-wheel-title p174-wheel-desc"><title id="p174-wheel-title">Interactive wheel-graph radio-channel colouring</title><desc id="p174-wheel-desc">A cycle of ${state.rimSize} guards surrounds one dispatcher joined to every guard. The wheel has ${values.edgeCount} adjacency edges. Assignments are ${state.colors.map((color, vertex) => `${vertex === state.rimSize ? "dispatcher" : `guard ${vertex + 1}`}: ${color === null ? "unassigned" : CHANNELS[color].name}`).join("; ")}. There are ${values.conflicts.length} conflicts. The chromatic number is ${values.chromatic} because the rim is ${state.rimSize % 2 ? "odd" : "even"}.</desc><rect class="p174-board" x="1" y="1" width="718" height="468" rx="18"/><circle class="p174-night-disc" cx="242" cy="231" r="214"/><g class="p174-stars" aria-hidden="true">${[[36,44],[90,101],[176,42],[303,57],[395,92],[48,317],[119,402],[347,388],[429,310],[216,438]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2"/>`).join("")}</g><text class="p174-board-kicker" x="20" y="27">MIDNIGHT RADIO WHEEL · ADJACENT VERTICES DIFFER</text><g class="p174-edges" aria-hidden="true">${edgeMarkup}</g><g class="p174-vertices">${vertexMarkup}</g><g class="p174-ledger" transform="translate(488 25)"><rect class="p174-ledger-bg" width="210" height="420" rx="14"/><text class="p174-ledger-title" x="16" y="25">CHANNEL AUDIT</text><text class="p174-ledger-kicker" x="16" y="59">CURRENT ASSIGNMENT</text><text class="p174-ledger-label" x="16" y="84">vertices assigned</text><text class="p174-ledger-value" x="193" y="84" text-anchor="end">${values.assignedCount}/${state.rimSize + 1}</text><text class="p174-ledger-label" x="16" y="108">channels used</text><text class="p174-ledger-value" x="193" y="108" text-anchor="end">${values.usedColors.length}</text><text class="p174-ledger-label" x="16" y="132">conflicting edges</text><text class="p174-ledger-value" x="193" y="132" text-anchor="end">${values.conflicts.length}</text><line class="p174-ledger-rule" x1="16" y1="151" x2="193" y2="151"/><text class="p174-ledger-kicker" x="16" y="183">PARITY LOWER BOUND</text><text class="p174-ledger-label" x="16" y="209">rim length</text><text class="p174-ledger-value" x="193" y="209" text-anchor="end">${state.rimSize} · ${state.rimSize % 2 ? "odd" : "even"}</text><text class="p174-ledger-label" x="16" y="233">rim colours needed</text><text class="p174-ledger-value" x="193" y="233" text-anchor="end">${state.stage >= 1 || state.revealed ? state.rimSize % 2 ? 3 : 2 : "stage 2"}</text><text class="p174-ledger-label" x="16" y="257">centre adds</text><text class="p174-ledger-value" x="193" y="257" text-anchor="end">${state.stage >= 1 || state.revealed ? "+1" : "stage 2"}</text><text class="p174-ledger-label" x="16" y="281">chromatic number χ</text><text class="p174-ledger-value is-chi" x="193" y="281" text-anchor="end">${state.stage >= 2 || state.revealed ? values.chromatic : "stage 3"}</text><rect class="p174-status-box" x="12" y="311" width="186" height="77" rx="11"/><text class="p174-status-title" x="105" y="340" text-anchor="middle">${status}</text><text class="p174-status-note" x="105" y="363" text-anchor="middle">χ(W)=${values.chromatic}</text></g></svg>`;
  }

  function paletteMarkup() {
    return `<section class="p174-palette" aria-label="Choose a radio channel"><div role="group" aria-label="Channel palette">${CHANNELS.map((channel, index) => `<button class="p174-channel channel-${index} ${state.activeChannel === index ? "active" : ""}" type="button" data-problem-action="p174-channel" data-p174-channel="${index}" aria-pressed="${state.activeChannel === index}"><i></i><span>${channel.name}</span></button>`).join("")}<button class="p174-channel is-eraser ${state.activeChannel === null ? "active" : ""}" type="button" data-problem-action="p174-erase" aria-pressed="${state.activeChannel === null}"><i>×</i><span>Erase</span></button></div><p role="status">${state.boardMessage}</p><div class="p174-palette-actions"><button class="primary-button" type="button" data-problem-action="p174-build-optimal">Build minimum colouring</button><button class="secondary-button" type="button" data-problem-action="p174-clear">Clear assignments</button></div></section>`;
  }

  function parityProofMarkup() {
    const values = coloringData();
    return `<section class="p174-proof-card" aria-labelledby="p174-proof-title"><div><span class="eyebrow">Parity proof</span><h3 id="p174-proof-title">Closing the rim changes everything</h3></div><div class="p174-proof-cases"><article><strong>Even rim · 2k guards</strong><div class="p174-mini-cycle is-even"><span>A</span><span>C</span><span>A</span><span>C</span><span>A</span><span>C</span></div><p>Two channels alternate and the final guard differs from the first. The dispatcher touches both, so it needs a third.</p><b>χ=3</b></article><article><strong>Odd rim · 2k+1 guards</strong><div class="p174-mini-cycle is-odd"><span>A</span><span>C</span><span>A</span><span>C</span><span class="third">V</span></div><p>Two-channel alternation returns the wrong colour at closure. The rim needs three; the dispatcher touches all three and needs a fourth.</p><b>χ=4</b></article></div><div class="p174-current-proof">Current ${state.rimSize}-guard rim is <strong>${state.rimSize % 2 ? "odd" : "even"}</strong>, so χ=${values.chromatic}.</div></section>`;
  }

  function metricsMarkup() {
    const values = coloringData();
    return `<section class="p174-metrics" aria-live="polite"><div><span>Wheel vertices</span><strong>${state.rimSize + 1}</strong></div><div><span>Adjacency edges</span><strong>${values.edgeCount}</strong></div><div><span>Conflicts</span><strong>${values.conflicts.length}</strong></div><div><span>Chromatic number</span><strong>${state.stage >= 2 || state.revealed ? values.chromatic : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p174-dynamic"><div class="p174-wheel-wrap">${wheelSvg()}${paletteMarkup()}</div>${state.stage >= 2 || state.revealed ? parityProofMarkup() : ""}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const chromatic = chromaticNumber(state.rimSize);
    return `<section class="p174-controls" aria-label="Radio wheel controls"><label for="p174-rim-size"><span>Number of rim guards m<output data-p174-output="rim">${state.rimSize}</output></span><input id="p174-rim-size" type="range" min="3" max="12" step="1" value="${state.rimSize}"/></label><p data-p174-control-note>A ${state.rimSize}-guard ${state.rimSize % 2 ? "odd" : "even"} rim has wheel chromatic number ${chromatic}. Changing m clears the assignment; the four-channel palette remains available.</p><button class="chip-button" type="button" data-problem-action="p174-challenge">Restore five-guard challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p174-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p174-solution" aria-labelledby="p174-solution-heading"><h3 id="p174-solution-heading" tabindex="-1">An odd rim spends three channels before the centre speaks</h3><p>The five guards form the cycle C₅. An odd cycle is not bipartite, so two alternating channels cannot close without a conflict. Three channels are necessary and sufficient on the rim.</p><div class="p174-solution-equation">χ(C₅)=3.</div><p>The dispatcher is adjacent to all five guards. In any proper three-channel colouring of C₅, all three rim channels appear, so the dispatcher can use none of them. It needs one further channel:</p><div class="p174-solution-equation is-answer">χ(W₆)=χ(C₅)+1=3+1=4 channels.</div><p>The minimum-colouring button supplies a four-channel construction, while the odd-cycle argument proves that three cannot suffice. For an even rim, the same reasoning gives 2+1=3.</p></section>`;
  }

  function snapshot() {
    const values = coloringData();
    return JSON.stringify({ problem: PROBLEM, provenance: "original extension created for this project; not in Professor Povey's Perplexing Problems", model: "wheel graph: one cycle rim plus a universal central vertex", rimGuardCount: state.rimSize, vertexCount: state.rimSize + 1, edgeCount: values.edgeCount, rimParity: state.rimSize % 2 ? "odd" : "even", assignments: Object.fromEntries(state.colors.map((color, vertex) => [vertex === state.rimSize ? "dispatcher" : `guard${vertex + 1}`, color === null ? null : CHANNELS[color].name])), activeChannel: state.activeChannel === null ? "erase" : CHANNELS[state.activeChannel].name, assignedVertices: values.assignedCount, colorsUsed: values.usedColors.map((color) => CHANNELS[color].name), conflicts: values.conflicts, complete: values.complete, proper: values.proper, chromaticNumber: values.chromatic, minimumColoringAchieved: values.optimal, editCount: state.editCount, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.rimSize = CHALLENGE_RIM; state.colors = Array(CHALLENGE_RIM + 1).fill(null); state.activeChannel = 0; state.editCount = 0; state.boardMessage = "Five-guard challenge restored. Amber selected."; }
  function render() {
    return `<main class="book-shell p174-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · graph colouring</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p174-spread"><article class="book-page p174-problem-page"><div class="problem-number">Problem 17.4</div><h1 class="book-title p174-title">The Midnight Radio Wheel</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${originalExtensionNote()}<p class="problem-copy">Five guards stand in a ring. Neighbouring guards need different radio channels, and a central dispatcher—who speaks to every guard—must differ from them all.</p><p class="problem-copy"><strong>What is the minimum number of channels?</strong></p><section class="p174-observation-card"><strong>The rim’s parity controls the answer</strong><p>An alternating pair closes on an even cycle. On an odd cycle it returns to the starting edge with equal colours.</p></section><section class="p174-model-card"><div class="eyebrow">Wheel graph</div><p>Edges represent pairs that must use different channels. Channel names carry no ordering or numerical meaning.</p></section></article><section class="book-page book-stage p174-stage">${stageControls()}<div class="p174-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p174-coach"><div class="coach-kicker">Colour the odd wheel</div><p class="coach-question">For five rim guards plus the dispatcher, enter the exact minimum channel count.</p><form class="p174-answer-form" data-p174-answer-form novalidate><label for="p174-answer">Minimum channels</label><div><input id="p174-answer" type="text" inputmode="numeric" value="${escapeAttribute(state.answer)}" placeholder="whole number" autocomplete="off"/><span>channels</span></div><button class="primary-button" type="submit">Check chromatic number</button></form>${feedbackMarkup()}<div class="button-row p174-help-row"><button class="secondary-button" type="button" data-problem-action="p174-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p174-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p174-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p174-shell"); if (!root) return;
    const dynamic = root.querySelector(".p174-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const output = root.querySelector('[data-p174-output="rim"]'); if (output) output.textContent = state.rimSize;
    const chromatic = chromaticNumber(state.rimSize);
    const note = root.querySelector("[data-p174-control-note]"); if (note) note.textContent = `A ${state.rimSize}-guard ${state.rimSize % 2 ? "odd" : "even"} rim has wheel chromatic number ${chromatic}. Changing m clears the assignment; the four-channel palette remains available.`;
    root.querySelector("#p174-rim-size")?.setAttribute("aria-valuetext", `${state.rimSize} rim guards, ${state.rimSize % 2 ? "odd" : "even"} cycle, chromatic number ${chromatic}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p174-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p174-reset") { state = initialState(); renderAndFocus(renderApp, "#p174-rim-size"); return; }
        if (action === "p174-stage") { state.stage = clamp(Number(actionControl.dataset.p174Stage), 0, 2); renderAndFocus(renderApp, `[data-p174-stage="${state.stage}"]`); return; }
        if (action === "p174-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p174-stage="${state.stage}"]`); return; }
        if (action === "p174-channel") { state.activeChannel = Number(actionControl.dataset.p174Channel); state.boardMessage = `${CHANNELS[state.activeChannel].name} selected.`; }
        if (action === "p174-erase") { state.activeChannel = null; state.boardMessage = "Erase selected. Choose a vertex to clear it."; }
        if (action === "p174-build-optimal") buildOptimalColoring();
        if (action === "p174-clear") clearColoring();
        if (action === "p174-challenge") restoreChallenge();
        if (action === "p174-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p174-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
        renderApp(); if (action === "p174-reveal") window.requestAnimationFrame(() => document.querySelector("#p174-solution-heading")?.focus()); return;
      }
      const vertex = event.target.closest("[data-p174-vertex]");
      if (vertex) { assignColor(Number(vertex.dataset.p174Vertex)); renderApp(); }
    });
    root?.addEventListener("keydown", (event) => {
      const vertex = event.target.closest("[data-p174-vertex]");
      if (!vertex || !["Enter", " "].includes(event.key)) return;
      event.preventDefault(); assignColor(Number(vertex.dataset.p174Vertex)); renderApp();
    });
    document.querySelector("#p174-rim-size")?.addEventListener("input", (event) => { state.rimSize = clamp(Number(event.target.value), 3, 12); state.colors = Array(state.rimSize + 1).fill(null); state.editCount = 0; state.boardMessage = `${state.rimSize}-guard rim loaded; assignments cleared.`; updateDynamicDom(); });
    const input = document.querySelector("#p174-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeInteger(event.target.value); });
    document.querySelector("[data-p174-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeInteger(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isInteger(answer)) state.feedback = "Enter one whole-number channel count.";
      else if (answer === 3) state.feedback = "Three colours suffice for the odd rim, but the universal centre touches all three and needs another.";
      else if (answer !== 4) state.feedback = "First colour the five-cycle, then account for the dispatcher adjacent to every rim guard.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: the odd rim needs three channels and the dispatcher forces a fourth, so χ=4."; }
      renderAndFocus(renderApp, "#p174-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
