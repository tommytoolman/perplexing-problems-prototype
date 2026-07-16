(function registerMoonArchivistRingsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "16.3";
  const CHALLENGE_RINGS = 8;
  const PEG_NAMES = Object.freeze(["Archive", "Relay", "Moon vault"]);
  const stages = Object.freeze([
    Object.freeze({ short: "Legal moves", title: "Move only an exposed ring", copy: "A legal move takes the smallest visible ring from one stack and places it on an empty peg or on a larger ring." }),
    Object.freeze({ short: "Recursion", title: "Move a smaller tower twice", copy: "To transfer n rings, first transfer n−1 to the spare peg, move the largest ring once, then transfer n−1 onto it." }),
    Object.freeze({ short: "Optimal count", title: "Turn the recursion tree into a power of two", copy: "Every expanded level doubles the smaller subproblems and contributes one central move: Mₙ=2Mₙ₋₁+1." }),
  ]);
  const hints = Object.freeze([
    "Before the largest ring can move, every smaller ring must be transferred to the spare peg.",
    "After moving the largest ring once, the same smaller tower must be transferred again onto the destination peg.",
    "If Mₙ is the optimal move count, then M₁=1 and Mₙ=2Mₙ₋₁+1.",
    "The sequence 1,3,7,15,… is one less than a power of two. Prove Mₙ=2ⁿ−1 by substitution or by summing the recursion-tree levels.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p163-reset">Reset</button>';

  const initialState = () => ({ ringCount: CHALLENGE_RINGS, positions: Array(CHALLENGE_RINGS).fill(0), selectedPeg: null, history: [], boardMessage: "Select or drag the exposed ring on the Archive peg.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();
  let dragState = null;
  let pathCache = { key: "", path: [] };

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeInteger(value) { return String(value).replace(/[^0-9\s]/g, "").slice(0, 12); }
  function optimalCount(ringCount = state.ringCount) { return 2 ** ringCount - 1; }
  function stateKey(positions = state.positions) { return `${positions.length}:${positions.join("")}`; }

  function stacksForPositions(positions = state.positions) {
    return [0, 1, 2].map((peg) => positions.map((position, index) => ({ position, ring: index + 1 })).filter((entry) => entry.position === peg).map((entry) => entry.ring).sort((a, b) => b - a));
  }

  function topRing(peg, positions = state.positions) {
    for (let ringIndex = 0; ringIndex < positions.length; ringIndex += 1) if (positions[ringIndex] === peg) return ringIndex + 1;
    return null;
  }

  function legalMoves(positions) {
    const tops = [0, 1, 2].map((peg) => topRing(peg, positions));
    const moves = [];
    for (let from = 0; from < 3; from += 1) {
      const ring = tops[from];
      if (ring === null) continue;
      for (let to = 0; to < 3; to += 1) if (to !== from && (tops[to] === null || tops[to] > ring)) moves.push({ ring, from, to });
    }
    return moves;
  }

  function shortestPathToGoal(positions = state.positions) {
    const cacheKey = stateKey(positions);
    if (pathCache.key === cacheKey) return pathCache.path;
    const goal = Array(positions.length).fill(2);
    const startKey = positions.join("");
    const goalKey = goal.join("");
    if (startKey === goalKey) { pathCache = { key: cacheKey, path: [] }; return []; }
    const queue = [[...positions]];
    const parent = new Map([[startKey, null]]);
    const parentMove = new Map();
    let cursor = 0;
    while (cursor < queue.length && !parent.has(goalKey)) {
      const current = queue[cursor]; cursor += 1;
      const currentKey = current.join("");
      for (const move of legalMoves(current)) {
        const next = [...current]; next[move.ring - 1] = move.to;
        const nextKey = next.join("");
        if (parent.has(nextKey)) continue;
        parent.set(nextKey, currentKey);
        parentMove.set(nextKey, move);
        queue.push(next);
        if (nextKey === goalKey) break;
      }
    }
    const path = [];
    let key = goalKey;
    while (key !== startKey) {
      const move = parentMove.get(key);
      if (!move) break;
      path.push(move);
      key = parent.get(key);
    }
    path.reverse();
    pathCache = { key: cacheKey, path };
    return path;
  }

  function applyMove(from, to, source = "manual") {
    const ring = topRing(from);
    if (ring === null) { state.boardMessage = `${PEG_NAMES[from]} has no ring to move.`; return false; }
    const destinationTop = topRing(to);
    if (destinationTop !== null && destinationTop < ring) { state.boardMessage = `Illegal move: ring ${ring} cannot cover smaller ring ${destinationTop}.`; return false; }
    state.positions[ring - 1] = to;
    state.history.push({ ring, from, to });
    state.selectedPeg = null;
    pathCache.key = "";
    const complete = state.positions.every((position) => position === 2);
    state.boardMessage = complete ? `Archive complete in ${state.history.length} moves.` : `${source === "hint" ? "Shortest-route step" : "Legal move"}: ring ${ring}, ${PEG_NAMES[from]} → ${PEG_NAMES[to]}.`;
    return true;
  }

  function selectPeg(peg) {
    if (state.selectedPeg === null) {
      if (topRing(peg) === null) { state.boardMessage = `${PEG_NAMES[peg]} is empty; choose a stack containing a ring first.`; return; }
      state.selectedPeg = peg;
      state.boardMessage = `${PEG_NAMES[peg]} selected. Choose a destination peg.`;
      return;
    }
    if (state.selectedPeg === peg) { state.selectedPeg = null; state.boardMessage = "Selection cleared."; return; }
    const source = state.selectedPeg;
    state.selectedPeg = null;
    applyMove(source, peg);
  }

  function undoMove() {
    const move = state.history.pop();
    if (!move) { state.boardMessage = "There is no move to undo."; return; }
    state.positions[move.ring - 1] = move.from;
    state.selectedPeg = null;
    pathCache.key = "";
    state.boardMessage = `Undid ring ${move.ring}: ${PEG_NAMES[move.to]} → ${PEG_NAMES[move.from]}.`;
  }

  function resetBoard() { state.positions = Array(state.ringCount).fill(0); state.selectedPeg = null; state.history = []; state.boardMessage = "All rings returned to the Archive peg."; pathCache.key = ""; }

  function originalExtensionNote() {
    return `<p class="p163-extension-note"><strong>Original extension.</strong> This chapter and activity were created for this project and do not appear in Professor Povey’s <em>Perplexing Problems</em>.</p>`;
  }

  function stageControls() {
    return `<div class="p163-stage-controls" role="group" aria-label="Tower of Hanoi reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p163-stage" data-p163-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p163-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p163-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Optimal count proved" : "Next stage"}</button></div>`;
  }

  function boardSvg() {
    const stacks = stacksForPositions();
    const pegX = [140, 360, 580];
    const baseY = 317;
    const ringHeight = 23;
    const maximumWidth = 190;
    const minimumWidth = 72;
    const ringMarkup = stacks.flatMap((rings, peg) => rings.map((ring, level) => {
      const width = state.ringCount === 1 ? maximumWidth : minimumWidth + (maximumWidth - minimumWidth) * (ring - 1) / (state.ringCount - 1);
      const y = baseY - (level + 1) * ringHeight;
      const exposed = ring === topRing(peg);
      return `<g class="p163-ring tone-${ring % 6} ${exposed ? "is-exposed" : ""}" data-p163-ring="${ring}" data-p163-peg="${peg}" tabindex="${exposed ? "0" : "-1"}" role="button" aria-label="Ring ${ring}, ${exposed ? "exposed and movable" : "covered"}, on ${PEG_NAMES[peg]}"><rect x="${format(pegX[peg] - width / 2, 3)}" y="${y}" width="${format(width, 3)}" height="19" rx="9.5"/><text x="${pegX[peg]}" y="${y + 13}" text-anchor="middle">${ring}</text></g>`;
    })).join("");
    const remaining = shortestPathToGoal().length;
    const complete = remaining === 0;
    return `<svg class="p163-board ${complete ? "is-complete" : ""}" data-p163-board viewBox="0 0 720 385" role="group" aria-labelledby="p163-board-title p163-board-desc"><title id="p163-board-title">Interactive three-peg Tower of Hanoi</title><desc id="p163-board-desc">${state.ringCount} rings occupy Archive, Relay and Moon vault. Stack contents from largest to smallest are ${stacks.map((stack, peg) => `${PEG_NAMES[peg]}: ${stack.length ? stack.join(", ") : "empty"}`).join("; ")}. ${state.history.length} moves have been made and the shortest legal route from this state has ${remaining} moves remaining. Select or drag an exposed ring.</desc><defs><linearGradient id="p163-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#172b43"/><stop offset="1" stop-color="#435b6e"/></linearGradient></defs><rect class="p163-sky" x="1" y="1" width="718" height="383" rx="18"/><circle class="p163-moon" cx="615" cy="62" r="34"/><g class="p163-stars" aria-hidden="true">${[[45,48],[91,83],[182,45],[258,72],[334,38],[432,66],[508,34],[680,105],[42,153],[692,185]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2"/>`).join("")}</g><text class="p163-board-kicker" x="22" y="27">LUNAR ARCHIVE TRANSFER · LEGAL RINGS ONLY</text><g class="p163-peg-hits">${pegX.map((x, peg) => `<rect class="p163-peg-hit ${state.selectedPeg === peg ? "is-selected" : ""}" data-p163-peg="${peg}" x="${x - 105}" y="48" width="210" height="285" rx="18" tabindex="0" role="button" aria-label="${PEG_NAMES[peg]} peg; ${stacks[peg].length ? `top ring ${topRing(peg)}` : "empty"}${state.selectedPeg === peg ? "; selected as source" : ""}"/>`).join("")}</g><g class="p163-pegs" aria-hidden="true">${pegX.map((x, peg) => `<line x1="${x}" y1="93" x2="${x}" y2="320"/><rect x="${x - 105}" y="317" width="210" height="14" rx="7"/><text x="${x}" y="355" text-anchor="middle">${PEG_NAMES[peg]}</text>`).join("")}</g>${ringMarkup}<g class="p163-board-status" transform="translate(22 344)"><rect width="676" height="27" rx="8"/><text x="12" y="18">${complete ? "TRANSFER COMPLETE" : state.selectedPeg === null ? "CLICK OR DRAG AN EXPOSED RING" : `${PEG_NAMES[state.selectedPeg].toUpperCase()} SELECTED · CHOOSE DESTINATION`}</text><text x="662" y="18" text-anchor="end">shortest remaining ${remaining}</text></g></svg>`;
  }

  function boardControlsMarkup() {
    const remaining = shortestPathToGoal().length;
    const gap = state.history.length + remaining - optimalCount();
    return `<section class="p163-board-controls"><div class="p163-move-ledger" aria-live="polite"><div><span>Moves made</span><strong>${state.history.length}</strong></div><div><span>From-start optimum</span><strong>${optimalCount()}</strong></div><div><span>Shortest remaining now</span><strong>${remaining}</strong></div><div><span>Route overhead</span><strong>${Math.max(0, gap)}</strong></div></div><p class="p163-board-message" role="status">${state.boardMessage}</p><div class="p163-board-buttons"><button class="primary-button" type="button" data-problem-action="p163-optimal-step" ${remaining === 0 ? "disabled" : ""}>Take shortest next move</button><button class="secondary-button" type="button" data-problem-action="p163-undo" ${state.history.length ? "" : "disabled"}>Undo</button><button class="ghost-button" type="button" data-problem-action="p163-reset-board">Restart tower</button></div></section>`;
  }

  function recursionTreeMarkup() {
    const maximumDepth = Math.min(state.ringCount - 1, 4);
    const width = 720;
    const topY = 35;
    const stepY = maximumDepth ? 47 : 0;
    const edges = [];
    const nodes = [];
    for (let depth = 0; depth <= maximumDepth; depth += 1) {
      const count = 2 ** depth;
      for (let index = 0; index < count; index += 1) {
        const x = (index + .5) * width / count;
        const y = topY + depth * stepY;
        const subproblem = state.ringCount - depth;
        nodes.push(`<g class="p163-tree-node ${subproblem === 1 ? "is-base" : ""}"><circle cx="${format(x, 3)}" cy="${y}" r="15"/><text x="${format(x, 3)}" y="${y + 4}" text-anchor="middle">T${subproblem}</text></g>`);
        if (depth < maximumDepth) {
          const childY = y + stepY;
          const childCount = count * 2;
          for (const child of [index * 2, index * 2 + 1]) { const childX = (child + .5) * width / childCount; edges.push(`<line x1="${format(x, 3)}" y1="${y + 15}" x2="${format(childX, 3)}" y2="${childY - 15}"/>`); }
        }
      }
    }
    const collapsed = state.ringCount - maximumDepth > 1;
    const depthRows = Array.from({ length: state.ringCount }, (_, depth) => `<div><span>depth ${depth}</span><strong>${2 ** depth}</strong><small>central move${2 ** depth === 1 ? "" : "s"}</small></div>`).join("");
    return `<section class="p163-recursion-card" aria-labelledby="p163-recursion-title"><header><div><span class="eyebrow">Recursion tree</span><h3 id="p163-recursion-title">T(n)=2T(n−1)+1</h3></div><p>${collapsed ? `First ${maximumDepth + 1} of ${state.ringCount} levels drawn; the ledger keeps every level.` : "The complete recursion tree is drawn."}</p></header><svg class="p163-tree-svg" viewBox="0 0 720 ${topY + maximumDepth * stepY + 36}" role="img" aria-labelledby="p163-tree-title p163-tree-desc"><title id="p163-tree-title">Binary recursion tree for ${state.ringCount} rings</title><desc id="p163-tree-desc">At depth d there are 2 to the d subproblems. Each depth contributes 2 to the d central largest-ring moves, and summing depths zero through ${state.ringCount - 1} gives ${optimalCount()} moves.</desc><g class="p163-tree-edges">${edges.join("")}</g>${nodes.join("")}${collapsed ? `<text class="p163-tree-ellipsis" x="360" y="${topY + maximumDepth * stepY + 31}" text-anchor="middle">⋮ continue to T1</text>` : ""}</svg><div class="p163-depth-ledger" role="list" aria-label="Recursion-tree move contribution by depth">${depthRows}</div><div class="p163-tree-sum">M<sub>${state.ringCount}</sub>=1+2+4+⋯+2<sup>${state.ringCount - 1}</sup>=<strong>${optimalCount()}</strong></div></section>`;
  }

  function metricsMarkup() {
    const remaining = shortestPathToGoal().length;
    return `<section class="p163-metrics" aria-live="polite"><div><span>Legal configurations at most</span><strong>3<sup>${state.ringCount}</sup>=${3 ** state.ringCount}</strong></div><div><span>Optimal start-to-goal moves</span><strong>${state.stage >= 2 || state.revealed ? `2^${state.ringCount}−1=${optimalCount()}` : "stage 3"}</strong></div><div><span>Current shortest remainder</span><strong>${remaining}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p163-dynamic"><div class="p163-board-wrap">${boardSvg()}${boardControlsMarkup()}</div>${state.stage >= 1 || state.revealed ? recursionTreeMarkup() : ""}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p163-controls" aria-label="Tower size controls"><label for="p163-ring-count"><span>Number of rings n<output data-p163-output="rings">${state.ringCount}</output></span><input id="p163-ring-count" type="range" min="1" max="8" step="1" value="${state.ringCount}"/></label><p>Changing n restarts the board. Click a stack twice to choose source and destination, or drag an exposed ring horizontally to another peg. The shortest-route button solves from any legal state.</p><button class="chip-button" type="button" data-problem-action="p163-challenge">Restore eight-ring challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p163-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p163-solution" aria-labelledby="p163-solution-heading"><h3 id="p163-solution-heading" tabindex="-1">Every optimal solution contains two smaller optimal solutions</h3><p>To free the largest ring, all n−1 smaller rings must first reach the spare peg. Moving them in more than Mₙ₋₁ moves cannot help an optimum. The largest ring then moves once, and the smaller tower requires another Mₙ₋₁ moves to reach the destination.</p><div class="p163-solution-equation">M₁=1<br>Mₙ=2Mₙ₋₁+1</div><p>If Mₙ₋₁=2ⁿ⁻¹−1, substitution gives</p><div class="p163-solution-equation">Mₙ=2(2ⁿ⁻¹−1)+1=2ⁿ−1.</div><p>Therefore the Moon Archivist’s eight-ring transfer needs at least—and can be completed in—</p><div class="p163-solution-equation is-answer">M₈=2⁸−1=256−1=255 moves.</div><p>The lower bound and the recursive construction agree, so 255 is optimal rather than merely a count for one particular strategy.</p></section>`;
  }

  function snapshot() {
    const stacks = stacksForPositions();
    const remaining = shortestPathToGoal().length;
    return JSON.stringify({ problem: PROBLEM, provenance: "original extension created for this project; not in Professor Povey's Perplexing Problems", model: "three pegs; move one exposed ring; never place a larger ring on a smaller ring", ringCount: state.ringCount, ringPositionsByAscendingSize: state.positions, stacksLargestToSmallest: Object.fromEntries(PEG_NAMES.map((name, index) => [name, stacks[index]])), selectedPeg: state.selectedPeg === null ? null : PEG_NAMES[state.selectedPeg], movesMade: state.history.length, moveHistory: state.history, optimalFromStart: optimalCount(), shortestMovesRemainingFromCurrentState: remaining, routeOverhead: Math.max(0, state.history.length + remaining - optimalCount()), complete: remaining === 0, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.ringCount = CHALLENGE_RINGS; resetBoard(); }
  function render() {
    return `<main class="book-shell p163-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · recursive algorithms</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p163-spread"><article class="book-page p163-problem-page"><div class="problem-number">Problem 16.3</div><h1 class="book-title p163-title">The Moon Archivist’s Rings</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${originalExtensionNote()}<p class="problem-copy">Eight differently sized archive rings begin on one peg, largest at the bottom. Move the whole tower to the Moon vault, one exposed ring at a time, never placing a larger ring on a smaller one.</p><p class="problem-copy"><strong>What is the minimum possible number of moves?</strong></p><section class="p163-observation-card"><strong>The largest ring splits the story</strong><p>It can move only after all seven smaller rings leave—and those seven must later be rebuilt above it.</p></section><section class="p163-model-card"><div class="eyebrow">Classic three-peg rules</div><p>Exactly one ring moves at a time. Rings and pegs are ideal, and every legal move has equal cost.</p></section></article><section class="book-page book-stage p163-stage">${stageControls()}<div class="p163-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p163-coach"><div class="coach-kicker">Count the recursive transfer</div><p class="coach-question">For eight rings and three pegs, enter the exact optimal move count.</p><form class="p163-answer-form" data-p163-answer-form novalidate><label for="p163-answer">Minimum moves M₈</label><div><input id="p163-answer" type="text" inputmode="numeric" value="${escapeAttribute(state.answer)}" placeholder="whole number" autocomplete="off"/><span>moves</span></div><button class="primary-button" type="submit">Check optimum</button></form>${feedbackMarkup()}<div class="button-row p163-help-row"><button class="secondary-button" type="button" data-problem-action="p163-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p163-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p163-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p163-shell"); if (!root) return;
    const dynamic = root.querySelector(".p163-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const output = root.querySelector('[data-p163-output="rings"]'); if (output) output.textContent = state.ringCount;
    root.querySelector("#p163-ring-count")?.setAttribute("aria-valuetext", `${state.ringCount} rings; optimal start-to-goal count ${optimalCount()} moves`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p163-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p163-reset") { state = initialState(); renderAndFocus(renderApp, "#p163-ring-count"); return; }
        if (action === "p163-stage") { state.stage = clamp(Number(actionControl.dataset.p163Stage), 0, 2); renderAndFocus(renderApp, `[data-p163-stage="${state.stage}"]`); return; }
        if (action === "p163-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p163-stage="${state.stage}"]`); return; }
        if (action === "p163-optimal-step") { const move = shortestPathToGoal()[0]; if (move) applyMove(move.from, move.to, "hint"); }
        if (action === "p163-undo") undoMove();
        if (action === "p163-reset-board") resetBoard();
        if (action === "p163-challenge") restoreChallenge();
        if (action === "p163-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p163-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
        renderApp(); if (action === "p163-reveal") window.requestAnimationFrame(() => document.querySelector("#p163-solution-heading")?.focus()); return;
      }
      const pegControl = event.target.closest("[data-p163-peg]");
      if (pegControl) { selectPeg(Number(pegControl.dataset.p163Peg)); renderApp(); }
    });
    root?.addEventListener("keydown", (event) => {
      const pegControl = event.target.closest("[data-p163-peg]");
      if (!pegControl || !["Enter", " "].includes(event.key)) return;
      event.preventDefault(); selectPeg(Number(pegControl.dataset.p163Peg)); renderApp();
    });
    root?.addEventListener("pointerdown", (event) => {
      const ring = event.target.closest("[data-p163-ring]");
      if (!ring || Number(ring.dataset.p163Ring) !== topRing(Number(ring.dataset.p163Peg))) return;
      const board = root.querySelector("[data-p163-board]");
      dragState = { pointerId: event.pointerId, source: Number(ring.dataset.p163Peg), startX: event.clientX, startY: event.clientY };
      board?.setPointerCapture?.(event.pointerId);
    });
    root?.addEventListener("pointerup", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const drag = dragState; dragState = null;
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 7) return;
      const board = root.querySelector("[data-p163-board]"); if (!board) return;
      const rectangle = board.getBoundingClientRect();
      const viewX = (event.clientX - rectangle.left) / rectangle.width * 720;
      if (viewX < 0 || viewX > 720) { state.boardMessage = "Drag cancelled outside the three pegs."; renderApp(); return; }
      const destination = clamp(Math.floor(viewX / 240), 0, 2);
      state.selectedPeg = null;
      if (destination !== drag.source) applyMove(drag.source, destination);
      renderApp();
    });
    root?.addEventListener("pointercancel", () => { dragState = null; });
    document.querySelector("#p163-ring-count")?.addEventListener("input", (event) => { state.ringCount = clamp(Number(event.target.value), 1, 8); resetBoard(); updateDynamicDom(); });
    const input = document.querySelector("#p163-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeInteger(event.target.value); });
    document.querySelector("[data-p163-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeInteger(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isInteger(answer)) state.feedback = "Enter one whole-number move count.";
      else if (answer === 256) state.feedback = "That is 2⁸. The recurrence produces one less than the power of two.";
      else if (answer !== optimalCount(CHALLENGE_RINGS)) state.feedback = "Use M₁=1 and Mₙ=2Mₙ₋₁+1, or sum the recursion-tree levels.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: M₈=2⁸−1=255 moves, and the recursive construction attains that lower bound."; }
      renderAndFocus(renderApp, "#p163-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
