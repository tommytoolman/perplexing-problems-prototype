(function registerLanternParityPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "16.2";
  const LANTERN_COUNT = 10;
  const INITIAL_MASK = 1;
  const TARGET_MASK = (1 << LANTERN_COUNT) - 1;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Try", title: "Toggle exactly two lanterns", copy: "Select any two distinct lanterns, then apply one legal move. Watch how the lit count changes while its odd parity survives." }),
    Object.freeze({ short: "Reach", title: "Inspect every reachable state", copy: "The state graph contains 1,024 binary arrangements. Breadth-first search from the one-lit start reaches exactly the 512 arrangements with odd lit count." }),
    Object.freeze({ short: "Invariant", title: "Explain why the target is sealed off", copy: "A move changes the lit count by −2, 0 or +2. Its parity therefore cannot change, so an odd start can never reach the even all-lit target." }),
  ]);
  const hints = Object.freeze([
    "Classify a move by the two selected lanterns: both lit, one lit and one dark, or both dark.",
    "Those three cases change the number lit by −2, 0 and +2 respectively. Each change is even.",
    "The start has one lit lantern, an odd count. The target has ten lit lanterns, an even count.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p162-reset">Reset</button>';

  function initialState() {
    return { mask: INITIAL_MASK, selected: [], moves: 0, movePairs: [], history: [INITIAL_MASK], stage: 0, moveNotice: "Select two lanterns to prepare the first legal move.", answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false };
  }
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function bitCount(mask) { let value = Number(mask) >>> 0, count = 0; while (value) { value &= value - 1; count += 1; } return count; }
  function isLit(mask, index) { return Boolean(mask & (1 << index)); }
  function parity(mask) { return bitCount(mask) % 2 ? "odd" : "even"; }
  function maskString(mask) { return (Number(mask) >>> 0).toString(2).padStart(LANTERN_COUNT, "0"); }

  function togglePair(mask, first, second) {
    const valid = Number.isInteger(first) && Number.isInteger(second) && first >= 0 && second >= 0 && first < LANTERN_COUNT && second < LANTERN_COUNT && first !== second;
    if (!valid) throw new RangeError("A legal move requires two distinct lantern indices from 0 to 9.");
    return mask ^ (1 << first) ^ (1 << second);
  }

  function isLegalTransition(before, after) { return bitCount((before ^ after) & TARGET_MASK) === 2; }

  function computeReachability(startMask = INITIAL_MASK) {
    const visited = new Uint8Array(1 << LANTERN_COUNT);
    const masks = [startMask];
    visited[startMask] = 1;
    for (let head = 0; head < masks.length; head += 1) {
      const mask = masks[head];
      for (let first = 0; first < LANTERN_COUNT; first += 1) {
        for (let second = first + 1; second < LANTERN_COUNT; second += 1) {
          const next = togglePair(mask, first, second);
          if (!visited[next]) { visited[next] = 1; masks.push(next); }
        }
      }
    }
    const distribution = Array(LANTERN_COUNT + 1).fill(0);
    masks.forEach((mask) => { distribution[bitCount(mask)] += 1; });
    const startParity = parity(startMask);
    return { masks, visited, distribution, total: masks.length, startParity, allPreserveParity: masks.every((mask) => parity(mask) === startParity) };
  }

  const REACHABILITY = computeReachability();

  function stageControls() {
    return `<div class="p162-stage-controls" role="group" aria-label="Parity invariant stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p162-stage" data-p162-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p162-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p162-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Invariant exposed" : "Next stage"}</button></div>`;
  }

  function lanternMarkup() {
    const litCount = bitCount(state.mask);
    return `<section class="p162-lab" aria-labelledby="p162-lab-heading"><header><div><span class="eyebrow">Current arrangement</span><h3 id="p162-lab-heading">Ten lanterns · one legal move flips two</h3></div><div class="p162-live-parity is-${parity(state.mask)}" role="status" aria-live="polite"><strong>${litCount} lit</strong><span>${parity(state.mask).toUpperCase()} parity</span></div></header><div class="p162-lantern-row" role="group" aria-label="Select exactly two lanterns to toggle">${Array.from({ length: LANTERN_COUNT }, (_, index) => { const lit = isLit(state.mask, index), selectedIndex = state.selected.indexOf(index); return `<button class="p162-lantern ${lit ? "is-lit" : "is-dark"} ${selectedIndex >= 0 ? "is-selected" : ""}" type="button" data-problem-action="p162-lantern" data-p162-lantern="${index}" aria-pressed="${selectedIndex >= 0}" aria-label="Lantern ${index + 1}, ${lit ? "lit" : "dark"}${selectedIndex >= 0 ? `, selected ${selectedIndex + 1} of 2` : ""}"><span class="p162-lantern-number">${index + 1}</span><i class="p162-flame" aria-hidden="true"></i><small>${lit ? "LIT" : "DARK"}</small></button>`; }).join("")}</div><div class="p162-move-panel"><div><strong>${state.selected.length} of 2 selected</strong><p>${state.moveNotice}</p></div><div><button class="primary-button" type="button" data-problem-action="p162-apply" ${state.selected.length === 2 ? "" : "disabled"}>Apply legal move</button><button class="secondary-button" type="button" data-problem-action="p162-clear" ${state.selected.length ? "" : "disabled"}>Clear selection</button></div></div><div class="p162-invariant-rail" aria-label="Parity record"><span>Start <strong>1 · ODD</strong></span><i aria-hidden="true">→</i><span>After ${state.moves} move${state.moves === 1 ? "" : "s"} <strong>${litCount} · ${parity(state.mask).toUpperCase()}</strong></span><i aria-hidden="true">≠</i><span class="is-target">Target <strong>10 · EVEN</strong></span></div><div class="p162-history" aria-label="Recent lit counts"><span>Recorded lit counts</span><p>${state.history.slice(-9).map((mask, index, recent) => `<b class="is-${parity(mask)}">${bitCount(mask)}</b>${index < recent.length - 1 ? "<i>→</i>" : ""}`).join("")}</p></div></section>`;
  }

  function evidenceSvg() {
    const chartBottom = 161, maximum = Math.max(...REACHABILITY.distribution), left = 45, step = 65;
    const bars = REACHABILITY.distribution.map((count, litCount) => { const height = count / maximum * 98, x = left + litCount * step, y = chartBottom - height; return `<g class="p162-evidence-mark ${count ? "is-reachable" : "is-unreachable"}"><rect x="${x - 17}" y="${y}" width="34" height="${Math.max(height, 2)}" rx="4"/><text class="p162-bar-value" x="${x}" y="${Math.max(31, y - 7)}" text-anchor="middle">${count}</text><text class="p162-axis-label" x="${x}" y="181" text-anchor="middle">${litCount}</text>${count ? "" : `<path d="M${x - 8} 151l16 10m0-10l-16 10"/>`}</g>`; }).join("");
    const currentX = left + bitCount(state.mask) * step;
    const description = state.stage === 0 && !state.revealed ? `The reachability chart is concealed during exploration. The current state has ${bitCount(state.mask)} lit lanterns and ${parity(state.mask)} parity.` : `Breadth-first search reaches 512 of 1,024 arrangements: 10 with one lit, 120 with three lit, 252 with five lit, 120 with seven lit, and 10 with nine lit. No even-count arrangement is reachable.`;
    return `<section class="p162-evidence-card" aria-labelledby="p162-evidence-heading"><header><div><span class="eyebrow">Complete state-graph search</span><h3 id="p162-evidence-heading">Reachable arrangements by number lit</h3></div><strong>${state.stage >= 1 || state.revealed ? `${REACHABILITY.total} / ${1 << LANTERN_COUNT}` : "unlock at stage 2"}</strong></header><svg class="p162-evidence-svg p162-stage-${state.stage}" viewBox="0 0 740 205" role="img" aria-labelledby="p162-svg-title p162-svg-desc"><title id="p162-svg-title">Reachable lantern configurations grouped by lit count</title><desc id="p162-svg-desc">${description}</desc><rect class="p162-chart-field" x="1" y="1" width="738" height="203" rx="15"/><line class="p162-chart-axis" x1="28" y1="161" x2="722" y2="161"/><g class="p162-evidence-data">${bars}</g><line class="p162-current-marker" x1="${currentX}" y1="24" x2="${currentX}" y2="188"/><path class="p162-current-pointer" d="M${currentX - 6} 18h12l-6 8z"/><text class="p162-current-label" x="${currentX}" y="14" text-anchor="middle">CURRENT</text><text class="p162-axis-title" x="370" y="199" text-anchor="middle">NUMBER OF LIT LANTERNS</text><g class="p162-evidence-lock"><rect x="172" y="65" width="396" height="66" rx="13"/><text x="370" y="91" text-anchor="middle">EXPLORE FIRST</text><text x="370" y="112" text-anchor="middle">Open Reach to inspect all 1,024 states</text></g></svg><p class="p162-evidence-summary">${state.stage >= 1 || state.revealed ? "Odd columns contain every reachable arrangement. Even columns contain none; the largest reachable lit count is 9." : "Make a few legal moves, record the parity, then open the exhaustive evidence."}</p></section>`;
  }

  function invariantCasesMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    return `<section class="p162-cases" aria-labelledby="p162-cases-heading"><div><span class="eyebrow">All possible move types</span><h3 id="p162-cases-heading">The change is always even</h3></div><div role="list"><span role="listitem"><i>lit + lit</i><strong>−2</strong></span><span role="listitem"><i>lit + dark</i><strong>0</strong></span><span role="listitem"><i>dark + dark</i><strong>+2</strong></span></div><p>N′=N−2, N or N+2, so <strong>N′≡N (mod 2)</strong>.</p></section>`;
  }

  function dynamicMarkup() { return `<div class="p162-dynamic">${lanternMarkup()}${evidenceSvg()}${invariantCasesMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p162-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p162-solution" aria-labelledby="p162-solution-heading"><h3 id="p162-solution-heading" tabindex="-1">Odd parity is invariant</h3><p>A legal move toggles two lanterns. If both were lit, the lit count falls by two; if exactly one was lit, it does not change; if both were dark, it rises by two.</p><div class="p162-equation">ΔN∈{−2,0,+2}<br>N′≡N (mod 2)</div><p>The initial count is N=1, which is odd. Every state reached by legal moves therefore has an odd number lit. The desired all-lit state has N=10, which is even.</p><div class="p162-equation is-answer">1 (odd) ↛ 10 (even)<br>It is impossible to light all ten.</div><p>The exhaustive state search agrees: exactly 512 of the 1,024 arrangements are reachable, comprising every odd-parity arrangement and no even-parity arrangement.</p></section>`;
  }

  function snapshot() {
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "ten binary lanterns; a legal move toggles exactly two distinct lanterns", initialMask: maskString(INITIAL_MASK), targetMask: maskString(TARGET_MASK), currentMask: maskString(state.mask), litLanterns: Array.from({ length: LANTERN_COUNT }, (_, index) => index + 1).filter((number) => isLit(state.mask, number - 1)), litCount: bitCount(state.mask), parity: parity(state.mask), selectedLanterns: state.selected.map((index) => index + 1), movesApplied: state.moves, legalMovePairs: state.movePairs.map((pair) => pair.map((index) => index + 1)), history: state.history.map((mask) => ({ mask: maskString(mask), litCount: bitCount(mask), parity: parity(mask) })), reachableStateCount: REACHABILITY.total, totalStateCount: 1 << LANTERN_COUNT, reachableDistributionByLitCount: REACHABILITY.distribution, invariantVerifiedAcrossReachableStates: REACHABILITY.allPreserveParity, targetReachable: Boolean(REACHABILITY.visited[TARGET_MASK]), answer: state.answer || null, committed: state.committed, stage: state.stage + 1, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p162-shell"><div class="p162-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Invariants and impossibility</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p162-spread"><article class="book-page p162-problem-page"><div class="problem-number">Problem 16.2</div><h1 class="book-title p162-title">The Lantern Keeper’s Even Night</h1><div class="difficulty" aria-label="One star difficulty">★</div><p class="problem-copy">Ten lanterns stand in a row. At first exactly one is lit. A legal move must toggle exactly two distinct lanterns: lit becomes dark and dark becomes lit.</p><p class="problem-copy"><strong>Can the keeper make all ten lanterns lit?</strong></p><section class="p162-observation-card"><strong>Look for what cannot change</strong><p>The precise arrangement may vary wildly, while a much smaller property survives every legal move.</p></section><section class="p162-model-card"><div class="eyebrow">Rules of the night</div><p>Any pair may be chosen, each toggle is simultaneous, and no one-lantern or repeated-lantern move is allowed.</p></section></article><section class="book-page book-stage p162-stage">${stageControls()}<div class="p162-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p162-coach"><div class="coach-kicker">Name the invariant</div><form class="p162-answer-form" data-p162-answer-form novalidate><fieldset><legend id="p162-answer-heading">Can a sequence of legal moves light all ten?</legend><label><input type="radio" name="p162-possible" value="yes" ${state.answer === "yes" ? "checked" : ""}/> Yes, it is possible</label><label><input type="radio" name="p162-possible" value="no" ${state.answer === "no" ? "checked" : ""}/> No, it is impossible</label></fieldset><button class="primary-button" type="submit">Check conclusion</button></form>${feedbackMarkup()}<div class="button-row p162-help-row"><button class="secondary-button" type="button" data-problem-action="p162-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p162-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p162-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p162-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control || !root.contains(control)) return;
      const action = control.dataset.problemAction;
      if (action === "p162-reset") { resetChallenge(); renderAndFocus(renderApp, '[data-p162-lantern="0"]'); return; }
      if (action === "p162-stage") { state.stage = clamp(Number(control.dataset.p162Stage), 0, 2); renderAndFocus(renderApp, `[data-p162-stage="${state.stage}"]`); return; }
      if (action === "p162-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p162-stage="${state.stage}"]`); return; }
      if (action === "p162-lantern") {
        const index = clamp(Number(control.dataset.p162Lantern), 0, LANTERN_COUNT - 1), existing = state.selected.indexOf(index);
        if (existing >= 0) state.selected.splice(existing, 1);
        else if (state.selected.length < 2) state.selected.push(index);
        else { state.moveNotice = "Two lanterns are already selected. Deselect one before choosing another."; renderApp(); return; }
        state.moveNotice = state.selected.length === 2 ? `Lanterns ${state.selected[0] + 1} and ${state.selected[1] + 1} form a legal pair.` : state.selected.length === 1 ? `Lantern ${state.selected[0] + 1} selected; choose one more.` : "Select two lanterns to prepare a legal move.";
        renderApp(); return;
      }
      if (action === "p162-clear") { state.selected = []; state.moveNotice = "Selection cleared. Choose any two distinct lanterns."; renderApp(); return; }
      if (action === "p162-apply" && state.selected.length === 2) {
        const pair = [...state.selected], before = state.mask, beforeCount = bitCount(before), after = togglePair(before, pair[0], pair[1]), afterCount = bitCount(after);
        state.mask = after; state.moves += 1; state.movePairs.push(pair); state.history.push(after); state.selected = []; state.moveNotice = `Move ${state.moves}: lanterns ${pair[0] + 1} and ${pair[1] + 1} toggled. Lit count ${beforeCount} → ${afterCount}; odd parity preserved.`;
        renderApp(); return;
      }
      if (action === "p162-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p162-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p162-reveal") window.requestAnimationFrame(() => document.querySelector("#p162-solution-heading")?.focus());
    });
    root?.querySelectorAll('input[name="p162-possible"]').forEach((input) => input.addEventListener("change", (event) => { state.answer = event.target.value; state.feedback = ""; state.committed = false; }));
    root?.querySelector("[data-p162-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const checked = event.currentTarget.querySelector('input[name="p162-possible"]:checked'); state.answer = checked?.value || ""; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer) state.feedback = "Choose yes or no before checking.";
      else if (state.answer === "no") { state.feedbackTone = "success"; state.feedback = "Correct. Odd parity is invariant, while ten lit lanterns would have even parity."; state.committed = true; state.stage = 2; }
      else state.feedback = "Try classifying a legal move by whether its selected lanterns are lit or dark. Can that change odd into even?";
      renderAndFocus(renderApp, "#p162-answer-heading");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
