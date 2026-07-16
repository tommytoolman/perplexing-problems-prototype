(function registerSpyTablePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "17.3";
  const SPIES = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Arrange", title: "Move spies and inspect the circular boundary", copy: "Drag one badge onto another seat, or select two seat buttons to swap them. The first and last displayed seats are neighbours around the circle." }),
    Object.freeze({ short: "Rotate", title: "Remove duplicate rotations", copy: "Turning every spy one seat produces the same circular arrangement. Anchor A conceptually, leaving 7! distinct clockwise orders for the other spies." }),
    Object.freeze({ short: "Subtract", title: "Count the joined A–B block and subtract", copy: "When A and B sit together, join them into AB or BA. The block plus six other spies are seven circular objects, giving 2×6! forbidden arrangements." }),
  ]);
  const hints = Object.freeze([
    "Rotating everybody together does not create a new circular seating. Fix A in one reference seat, then arrange the other seven spies.",
    "With A fixed, B has two forbidden neighbouring seats. For either choice, the remaining six spies can be arranged in 6! ways.",
    "Equivalently, join A and B into one block. The block has two internal orders, and seven circular objects have 6! arrangements.",
    "Subtract the adjacent cases: 7!−2×6!=5040−1440=3600.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p173-reset">Reset</button>';

  function factorial(number) { let product = 1; for (let value = 2; value <= number; value += 1) product *= value; return product; }
  function countCircularArrangements(number) { const total = factorial(number - 1), adjacent = 2 * factorial(number - 2); return { total, adjacent, valid: total - adjacent }; }
  const CHALLENGE_COUNTS = Object.freeze(countCircularArrangements(SPIES.length));

  function rotateArrangement(arrangement, steps = 1) {
    const length = arrangement.length, shift = ((Math.round(steps) % length) + length) % length;
    return arrangement.map((_, index) => arrangement[(index - shift + length) % length]);
  }

  function canonicalArrangement(arrangement) {
    const anchor = arrangement.indexOf("A");
    if (anchor < 0) return [...arrangement];
    return arrangement.map((_, index) => arrangement[(anchor + index) % arrangement.length]);
  }

  function canonicalKey(arrangement) { return canonicalArrangement(arrangement).join(""); }
  function rotationallyEquivalent(first, second) { return first.length === second.length && canonicalKey(first) === canonicalKey(second); }
  function areAdjacent(arrangement, first = "A", second = "B") { const a = arrangement.indexOf(first), b = arrangement.indexOf(second), difference = Math.abs(a - b); return difference === 1 || difference === arrangement.length - 1; }
  function swapArrangement(arrangement, firstSeat, secondSeat) { const next = [...arrangement]; [next[firstSeat], next[secondSeat]] = [next[secondSeat], next[firstSeat]]; return next; }
  function formatInteger(value) { return Number(value).toLocaleString("en-GB"); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function initialState() {
    return { arrangement: [...SPIES], selectedSeat: null, swaps: 0, rotations: 0, actions: [], boardMessage: "A and B begin adjacent. Drag a spy or select two seats to separate them.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false };
  }
  let state = initialState();
  let dragState = null;

  function seatPoint(seat, radius = 158) { const angle = -Math.PI / 2 + seat * 2 * Math.PI / SPIES.length; return { x: 360 + radius * Math.cos(angle), y: 210 + radius * Math.sin(angle), angle }; }
  function seatFromViewPoint(x, y) {
    const distance = Math.hypot(x - 360, y - 210);
    if (distance < 105 || distance > 220) return null;
    const angle = Math.atan2(y - 210, x - 360), rawSeat = Math.round((angle + Math.PI / 2) / (2 * Math.PI / SPIES.length));
    return ((rawSeat % SPIES.length) + SPIES.length) % SPIES.length;
  }

  function swapSeats(firstSeat, secondSeat, source = "selection") {
    if (!Number.isInteger(firstSeat) || !Number.isInteger(secondSeat) || firstSeat < 0 || secondSeat < 0 || firstSeat >= SPIES.length || secondSeat >= SPIES.length || firstSeat === secondSeat) return false;
    const firstSpy = state.arrangement[firstSeat], secondSpy = state.arrangement[secondSeat];
    state.arrangement = swapArrangement(state.arrangement, firstSeat, secondSeat);
    state.selectedSeat = null;
    state.swaps += 1;
    state.actions.push({ type: "swap", source, firstSeat, secondSeat, spies: [firstSpy, secondSpy], arrangement: [...state.arrangement], canonicalKey: canonicalKey(state.arrangement), adjacent: areAdjacent(state.arrangement) });
    state.boardMessage = `${source === "drag" ? "Dragged" : "Swapped"} ${firstSpy} and ${secondSpy}. A and B are ${areAdjacent(state.arrangement) ? "adjacent" : "not adjacent"}.`;
    return true;
  }

  function selectSeat(seat) {
    if (!Number.isInteger(seat) || seat < 0 || seat >= SPIES.length) return;
    if (state.selectedSeat === null) { state.selectedSeat = seat; state.boardMessage = `${state.arrangement[seat]} selected at seat ${seat + 1}. Choose another seat to swap.`; return; }
    if (state.selectedSeat === seat) { state.selectedSeat = null; state.boardMessage = "Seat selection cleared."; return; }
    swapSeats(state.selectedSeat, seat);
  }

  function rotateTable() {
    const before = [...state.arrangement], beforeKey = canonicalKey(before);
    state.arrangement = rotateArrangement(state.arrangement, 1);
    state.selectedSeat = null;
    state.rotations += 1;
    state.actions.push({ type: "rotation", steps: 1, arrangement: [...state.arrangement], canonicalKey: canonicalKey(state.arrangement) });
    state.boardMessage = `Turned everyone one seat clockwise. ${beforeKey} → ${canonicalKey(state.arrangement)}: the canonical circular order is unchanged.`;
  }

  function stageControls() {
    return `<div class="p173-stage-controls" role="group" aria-label="Circular-arrangement reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p173-stage" data-p173-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p173-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p173-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Count exposed" : "Next stage"}</button></div>`;
  }

  function tableSvg() {
    const adjacent = areAdjacent(state.arrangement), aSeat = state.arrangement.indexOf("A"), bSeat = state.arrangement.indexOf("B");
    const aPoint = seatPoint(aSeat), bPoint = seatPoint(bSeat);
    const neighbourSeats = [(aSeat - 1 + SPIES.length) % SPIES.length, (aSeat + 1) % SPIES.length];
    const neighbourHalos = neighbourSeats.map((seat) => { const point = seatPoint(seat); return `<circle class="p173-neighbour-halo ${seat === bSeat ? "contains-b" : ""}" cx="${point.x}" cy="${point.y}" r="35"/>`; }).join("");
    const seatTicks = SPIES.map((_, seat) => { const point = seatPoint(seat, 117); return `<circle cx="${point.x}" cy="${point.y}" r="3"/>`; }).join("");
    const spies = state.arrangement.map((spy, seat) => { const point = seatPoint(seat), selected = state.selectedSeat === seat, special = spy === "A" ? "is-a" : spy === "B" ? "is-b" : "is-other"; return `<g class="p173-spy ${special} ${selected ? "is-selected" : ""}" data-p173-drag-seat="${seat}" data-p173-seat-control="${seat}" tabindex="0" role="button" aria-label="Spy ${spy}, seat ${seat + 1}${selected ? ", selected to swap" : ""}"><circle class="p173-seat-ring" r="34"/><circle class="p173-spy-disc" r="27"/><path class="p173-spy-hat" d="M-15-8H15L9-19H-9Z"/><path class="p173-spy-glasses" d="M-14-2h10m8 0h10m-18 0h8"/><circle class="p173-spy-eye" cx="-8" cy="-2" r="5"/><circle class="p173-spy-eye" cx="8" cy="-2" r="5"/><text x="0" y="17" text-anchor="middle">${spy}</text><text class="p173-seat-number" x="26" y="-25" text-anchor="middle">${seat + 1}</text></g>`; }).join("");
    const desc = `Eight spies sit clockwise as ${state.arrangement.join(", ")}. Spy A is at seat ${aSeat + 1}; Spy B is at seat ${bSeat + 1}; they are ${adjacent ? "adjacent" : "not adjacent"}. The rotation-normalized order is ${canonicalArrangement(state.arrangement).join(", ")}. Drag a spy badge to another seat or use the seat buttons below.`;
    return `<svg class="p173-table" data-p173-table viewBox="0 0 720 430" role="group" aria-labelledby="p173-svg-title p173-svg-desc"><title id="p173-svg-title">Interactive circular seating for eight spies</title><desc id="p173-svg-desc">${desc}</desc><defs><radialGradient id="p173-table-felt"><stop offset="0" stop-color="#33515a"/><stop offset="1" stop-color="#1e343e"/></radialGradient></defs><rect class="p173-room" x="1" y="1" width="718" height="428" rx="20"/><path class="p173-rotation-arrow" d="M225 94A177 177 0 0 1 493 76"/><path class="p173-rotation-head" d="M486 64l18 9-13 15"/><text class="p173-rotation-label" x="22" y="25">ROTATIONS REPRESENT THE SAME ARRANGEMENT</text><circle class="p173-table-shadow" cx="360" cy="217" r="119"/><circle class="p173-table-top" cx="360" cy="210" r="113"/><g class="p173-seat-ticks">${seatTicks}</g>${neighbourHalos}<line class="p173-ab-link ${adjacent ? "is-adjacent" : "is-separated"}" x1="${aPoint.x}" y1="${aPoint.y}" x2="${bPoint.x}" y2="${bPoint.y}"/><g class="p173-spies">${spies}</g><g class="p173-table-status"><rect x="279" y="173" width="162" height="74" rx="15"/><text class="p173-status-kicker" x="360" y="194" text-anchor="middle">CURRENT A/B STATUS</text><text class="p173-status-value ${adjacent ? "is-adjacent" : "is-separated"}" x="360" y="219" text-anchor="middle">${adjacent ? "ADJACENT" : "NOT ADJACENT"}</text><text class="p173-status-detail" x="360" y="237" text-anchor="middle">A neighbours seats ${neighbourSeats.map((seat) => seat + 1).join(" and ")}</text></g></svg>`;
  }

  function seatControls() {
    const key = canonicalKey(state.arrangement);
    return `<section class="p173-controls" aria-label="Circular seating controls"><div class="p173-seat-buttons" role="group" aria-label="Select two seats to swap">${state.arrangement.map((spy, seat) => `<button class="secondary-button ${spy === "A" ? "is-a" : spy === "B" ? "is-b" : ""} ${state.selectedSeat === seat ? "active" : ""}" type="button" data-p173-seat-button="${seat}" data-p173-seat-control="${seat}" aria-pressed="${state.selectedSeat === seat}"><small>seat ${seat + 1}</small><strong>${spy}</strong></button>`).join("")}</div><div class="p173-control-row"><div><strong>${state.selectedSeat === null ? "No seat selected" : `${state.arrangement[state.selectedSeat]} at seat ${state.selectedSeat + 1} selected`}</strong><p>${state.boardMessage}</p></div><div><button class="primary-button" type="button" data-problem-action="p173-rotate">Rotate everyone clockwise</button><button class="ghost-button" type="button" data-problem-action="p173-clear" ${state.selectedSeat === null ? "disabled" : ""}>Clear selection</button></div></div><div class="p173-canonical" aria-live="polite"><span>Rotation-normalized order</span><strong>${key.split("").join(" · ")}</strong><small>A is used only as the reference point; reflections remain different.</small></div></section>`;
  }

  function countLedger() {
    const showTotal = state.stage >= 1 || state.revealed, showResult = state.stage >= 2 || state.revealed;
    return `<section class="p173-count-ledger" aria-labelledby="p173-count-heading"><header><div><span class="eyebrow">Total minus joined-block cases</span><h3 id="p173-count-heading">Count circular seatings once</h3></div><strong>${showResult ? formatInteger(CHALLENGE_COUNTS.valid) : "advance to count"}</strong></header><div><article><span>All circular arrangements</span><strong>${showTotal ? `7! = ${formatInteger(CHALLENGE_COUNTS.total)}` : "stage 2"}</strong><small>${showTotal ? "anchor A to remove rotations" : "turn the table first"}</small></article><i aria-hidden="true">−</i><article class="is-forbidden"><span>A/B joined block</span><strong>${showResult ? `2 × 6! = ${formatInteger(CHALLENGE_COUNTS.adjacent)}` : "stage 3"}</strong><small>${showResult ? "AB or BA among 7 circular objects" : "join the neighbours"}</small></article><i aria-hidden="true">=</i><article class="is-answer"><span>A/B non-adjacent</span><strong>${showResult ? formatInteger(CHALLENGE_COUNTS.valid) : "stage 3"}</strong><small>${showResult ? "valid circular arrangements" : "subtract forbidden cases"}</small></article></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p173-dynamic"><div class="p173-board-wrap">${tableSvg()}${seatControls()}</div>${countLedger()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p173-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p173-solution" aria-labelledby="p173-solution-heading"><h3 id="p173-solution-heading" tabindex="-1">Anchor, join, subtract</h3><p>Rotating an entire seating does not make a new circular arrangement. Fix A as a reference, then arrange the other seven spies clockwise.</p><div class="p173-equation">total=(8−1)!=7!=5040</div><p>For the forbidden cases, treat adjacent A and B as one joined object. The block and spies C–H make seven circular objects, with 6! arrangements. The block can read AB or BA.</p><div class="p173-equation">adjacent=2×(7−1)!=2×6!=1440</div><p>Subtract these from the total:</p><div class="p173-equation is-answer">non-adjacent=5040−1440<br>=3600</div><p>Reflections are not identified: reversing the clockwise order usually produces a different seating. Only rotations are equivalent.</p></section>`;
  }

  function snapshot() {
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "eight distinct labelled spies at a round table; rotations equivalent; reflections distinct", clockwiseArrangementByNumberedDisplaySeat: state.arrangement, canonicalClockwiseArrangementAnchoredAtA: canonicalArrangement(state.arrangement), canonicalKey: canonicalKey(state.arrangement), spiesAAndBAdjacent: areAdjacent(state.arrangement), selectedSeat: state.selectedSeat === null ? null : state.selectedSeat + 1, swaps: state.swaps, physicalTableRotations: state.rotations, actions: state.actions, totalCircularArrangements: CHALLENGE_COUNTS.total, adjacentABArrangements: CHALLENGE_COUNTS.adjacent, nonAdjacentABArrangements: CHALLENGE_COUNTS.valid, formula: "7! - 2*6! = 3600", stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p173-shell"><div class="p173-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Circular permutations</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p173-spread"><article class="book-page p173-problem-page"><div class="problem-number">Problem 17.3</div><h1 class="book-title p173-title">The Spy Who Wouldn’t Sit Next Door</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="problem-copy">Eight distinct spies A–H sit around a round table. Rotations count as the same arrangement, but reflections do not.</p><p class="problem-copy"><strong>How many circular arrangements keep A and B non-adjacent?</strong></p><section class="p173-observation-card"><strong>The table has no first chair</strong><p>Numbered display seats help us interact, but turning everybody together must not multiply the count.</p></section><section class="p173-model-card"><div class="eyebrow">Counting convention</div><p>All spies are distinct. Adjacency wraps across the final and first displayed seats, and clockwise reversal remains a new arrangement.</p></section></article><section class="book-page book-stage p173-stage">${stageControls()}<div class="p173-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p173-coach"><div class="coach-kicker">Count the safe briefings</div><p class="coach-question">Enter the exact number of rotationally distinct seatings with A and B apart.</p><form class="p173-answer-form" data-p173-answer-form novalidate><label for="p173-answer">Non-adjacent arrangements</label><input id="p173-answer" type="text" inputmode="numeric" value="${escapeAttribute(state.answer)}" placeholder="whole number" autocomplete="off"/><button class="primary-button" type="submit">Check count</button></form>${feedbackMarkup()}<div class="button-row p173-help-row"><button class="secondary-button" type="button" data-problem-action="p173-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p173-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p173-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); dragState = null; }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p173-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p173-reset") { resetChallenge(); renderAndFocus(renderApp, '[data-p173-seat-button="0"]'); return; }
        if (action === "p173-stage") { state.stage = Math.max(0, Math.min(2, Number(actionControl.dataset.p173Stage))); renderAndFocus(renderApp, `[data-p173-stage="${state.stage}"]`); return; }
        if (action === "p173-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p173-stage="${state.stage}"]`); return; }
        if (action === "p173-rotate") { rotateTable(); renderAndFocus(renderApp, '[data-problem-action="p173-rotate"]'); return; }
        if (action === "p173-clear") { state.selectedSeat = null; state.boardMessage = "Seat selection cleared."; renderAndFocus(renderApp, '[data-p173-seat-button="0"]'); return; }
        if (action === "p173-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p173-reveal") { state.revealed = true; state.stage = 2; }
        renderApp(); if (action === "p173-reveal") window.requestAnimationFrame(() => document.querySelector("#p173-solution-heading")?.focus()); return;
      }
      const seatControl = event.target.closest("[data-p173-seat-control]");
      if (seatControl) { const seat = Number(seatControl.dataset.p173SeatControl); selectSeat(seat); renderAndFocus(renderApp, `[data-p173-seat-button="${seat}"]`); }
    });
    root?.addEventListener("keydown", (event) => {
      const seatControl = event.target.closest("[data-p173-drag-seat]");
      if (!seatControl || !["Enter", " "].includes(event.key)) return;
      event.preventDefault(); const seat = Number(seatControl.dataset.p173DragSeat); selectSeat(seat); renderAndFocus(renderApp, `[data-p173-drag-seat="${seat}"]`);
    });
    root?.addEventListener("pointerdown", (event) => {
      const spy = event.target.closest("[data-p173-drag-seat]");
      if (!spy) return;
      event.preventDefault(); const table = root.querySelector("[data-p173-table]");
      dragState = { pointerId: event.pointerId, sourceSeat: Number(spy.dataset.p173DragSeat), startX: event.clientX, startY: event.clientY };
      spy.classList.add("is-dragging"); table?.setPointerCapture?.(event.pointerId);
    });
    root?.addEventListener("pointerup", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const drag = dragState; dragState = null;
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 7) return;
      event.preventDefault(); const table = root.querySelector("[data-p173-table]"); if (!table) return;
      const rectangle = table.getBoundingClientRect(), scale = Math.min(rectangle.width / 720, rectangle.height / 430), offsetX = (rectangle.width - 720 * scale) / 2, offsetY = (rectangle.height - 430 * scale) / 2;
      const x = (event.clientX - rectangle.left - offsetX) / scale, y = (event.clientY - rectangle.top - offsetY) / scale;
      const destination = seatFromViewPoint(x, y);
      if (destination === null) { state.boardMessage = "Drag cancelled: release the spy over another outer seat."; renderApp(); return; }
      if (destination === drag.sourceSeat) { state.boardMessage = `${state.arrangement[drag.sourceSeat]} returned to the same seat.`; renderApp(); return; }
      swapSeats(drag.sourceSeat, destination, "drag"); renderAndFocus(renderApp, `[data-p173-drag-seat="${destination}"]`);
    });
    root?.addEventListener("pointercancel", () => { dragState = null; root.querySelectorAll(".p173-spy.is-dragging").forEach((spy) => spy.classList.remove("is-dragging")); });
    root?.querySelector("#p173-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.replace(/[^0-9\s,]/g, "").slice(0, 18); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p173-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p173-answer")?.value || "", answer = Number(raw.replace(/[\s,]/g, "")); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isInteger(answer)) state.feedback = "Enter one exact whole-number count.";
      else if (answer === CHALLENGE_COUNTS.total) state.feedback = "That is every circular arrangement. Subtract the cases where A and B form a joined block.";
      else if (answer === CHALLENGE_COUNTS.adjacent) state.feedback = "That counts the forbidden adjacent A/B arrangements. The question asks for their complement.";
      else if (answer !== CHALLENGE_COUNTS.valid) state.feedback = "Fix A to remove rotations, then subtract the two neighbouring choices for B.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: 7!−2×6!=5,040−1,440=3,600."; state.committed = true; state.stage = 2; }
      renderAndFocus(renderApp, "#p173-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
