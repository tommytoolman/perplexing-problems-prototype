(function registerFairGameWildPathPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "21.5";
  const START_CAPITAL = 10;
  const STAKES = Object.freeze([1, 2, 4]);
  const CHALLENGE_HISTORY = "HT";
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Trace", title: "Follow one path without flattening the tree", copy: "Heads wins the current stake and tails loses it. The path HT moves £10→£11→£9, even though the game is fair at each toss." }),
    Object.freeze({ short: "Condition", title: "Average the children of the current history", copy: "Given HT, toss 3 starts from £9 with stake £4. Its two equally likely children are £13 and £5, whose conditional average is the current £9." }),
    Object.freeze({ short: "Martingale", title: "The mean stays level while paths spread out", copy: "A martingale requires E[Xₙ₊₁ | current information]=Xₙ. It does not require flat paths, and independence of increments is not the defining condition." }),
  ]);
  const hints = Object.freeze([
    "After H on toss 1, the capital is £10+£1=£11.",
    "After the following T on toss 2, subtract the £2 stake: the HT node has capital £9.",
    "Toss 3 stakes £4, so from HT the two possible capitals are £9+£4 and £9−£4.",
    "Conditioned on HT, the fair coin gives those two children probability 1/2 each.",
    "Therefore E[X₃|HT]=(13+5)/2=£9. Across all eight leaves, E[X₃]=£10.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p215-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 2) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function capitalForHistory(history) {
    return [...history].reduce((capital, outcome, index) => capital + (outcome === "H" ? STAKES[index] : -STAKES[index]), START_CAPITAL);
  }

  function historiesAtDepth(depth) {
    if (depth === 0) return [""];
    return historiesAtDepth(depth - 1).flatMap((history) => [`${history}H`, `${history}T`]);
  }

  function treeHistories(maxDepth = STAKES.length) {
    return Array.from({ length: maxDepth + 1 }, (_, depth) => historiesAtDepth(depth)).flat();
  }

  function conditionalData(history) {
    const capital = capitalForHistory(history);
    if (history.length >= STAKES.length) return { history, capital, terminal: true, headCapital: null, tailCapital: null, conditionalAverage: null, martingaleResidual: null };
    const stake = STAKES[history.length];
    const headCapital = capital + stake;
    const tailCapital = capital - stake;
    const conditionalAverage = (headCapital + tailCapital) / 2;
    return { history, capital, terminal: false, nextStake: stake, headCapital, tailCapital, conditionalAverage, martingaleResidual: cleanZero(conditionalAverage - capital) };
  }

  function leafAudit() {
    const leaves = historiesAtDepth(STAKES.length).map((history) => ({ history, capital: capitalForHistory(history), probability: 1 / 2 ** STAKES.length }));
    const expectedCapital = leaves.reduce((sum, leaf) => sum + leaf.probability * leaf.capital, 0);
    return { leaves, expectedCapital, residualFromStart: cleanZero(expectedCapital - START_CAPITAL), minimumCapital: Math.min(...leaves.map((leaf) => leaf.capital)), maximumCapital: Math.max(...leaves.map((leaf) => leaf.capital)) };
  }

  const challenge = Object.freeze(conditionalData(CHALLENGE_HISTORY));
  const overall = Object.freeze(leafAudit());

  function initialState() {
    return {
      stage: 0,
      expanded: false,
      selectedHistory: CHALLENGE_HISTORY,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();

  function parseMoney(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", "").replace(/^£/, "").replace(/GBP$/i, "");
    return /^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
  }

  function nodePosition(history) {
    const depth = history.length;
    const index = [...history].reduce((value, outcome) => value * 2 + (outcome === "T" ? 1 : 0), 0);
    const xPositions = [70, 260, 455, 670];
    const y = 42 + (index + .5) * 358 / 2 ** depth;
    return { x: xPositions[depth], y };
  }

  function stageControlsMarkup() {
    return `<div class="p215-stage-controls" role="group" aria-label="Martingale reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p215-stage" data-p215-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p215-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p215-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Martingale resolved" : "Next stage"}</button></div>`;
  }

  function treeEdgesMarkup(visibleDepth) {
    return treeHistories(visibleDepth).filter((history) => history.length > 0).map((history) => {
      const parent = history.slice(0, -1);
      const outcome = history.at(-1);
      const from = nodePosition(parent), to = nodePosition(history);
      const selectedBranch = history === state.selectedHistory || state.selectedHistory.startsWith(history) || history.slice(0, -1) === state.selectedHistory;
      return `<g class="p215-branch is-${outcome === "H" ? "head" : "tail"} ${selectedBranch ? "is-selected" : ""}"><line x1="${from.x + 38}" y1="${format(from.y, 3)}" x2="${to.x - 39}" y2="${format(to.y, 3)}" marker-end="url(#p215-${outcome === "H" ? "head" : "tail"}-arrow)"/><text x="${format((from.x + to.x) / 2, 3)}" y="${format((from.y + to.y) / 2 - 5, 3)}" text-anchor="middle">${outcome} · ${outcome === "H" ? "+" : "−"}£${STAKES[history.length - 1]}</text></g>`;
    }).join("");
  }

  function treeNodesMarkup(visibleDepth) {
    const showConditionalAverage = state.stage >= 1 || state.revealed;
    return treeHistories(visibleDepth).map((history) => {
      const data = conditionalData(history);
      const position = nodePosition(history);
      const selected = history === state.selectedHistory;
      const selectedChild = history === `${state.selectedHistory}H` || history === `${state.selectedHistory}T`;
      const label = history || "START";
      const width = history.length === 3 ? 58 : 76;
      return `<g class="p215-node depth-${history.length} ${selected ? "is-selected" : ""} ${selectedChild ? "is-selected-child" : ""}" transform="translate(${position.x} ${format(position.y, 3)})"><rect x="${-width / 2}" y="-17" width="${width}" height="34" rx="9"/><text class="p215-node-history" y="-4" text-anchor="middle">${label}</text><text class="p215-node-capital" y="11" text-anchor="middle">£${data.capital}</text>${showConditionalAverage && !data.terminal ? `<text class="p215-node-average" y="29" text-anchor="middle">E[next]=£${data.conditionalAverage}</text>` : ""}</g>`;
    }).join("");
  }

  function treeSvg() {
    const visibleDepth = state.expanded ? 3 : 2;
    const selected = conditionalData(state.selectedHistory);
    const description = `A fair three-toss coin game starts at 10 pounds and stakes 1, then 2, then 4 pounds. The tree is shown to toss ${visibleDepth}. The selected history is ${state.selectedHistory || "the start"}, with capital ${selected.capital} pounds${selected.terminal ? "." : `; its next head and tail capitals are ${selected.headCapital} and ${selected.tailCapital} pounds, averaging ${selected.conditionalAverage} pounds.`} Across all eight terminal paths the expected capital is 10 pounds, while individual terminal capitals range from 3 to 17 pounds.`;
    return `<svg class="p215-tree p215-stage-${state.stage} ${state.expanded ? "is-expanded" : ""}" viewBox="0 0 760 430" role="img" aria-labelledby="p215-tree-title p215-tree-desc"><title id="p215-tree-title">Expandable three-toss fair-game capital tree</title><desc id="p215-tree-desc">${description}</desc><defs><marker id="p215-head-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p215-tail-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p215-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p215-board-kicker" x="22" y="27">FAIR AT EVERY NODE · WILD ACROSS INDIVIDUAL PATHS</text><text class="p215-depth-label" x="70" y="415" text-anchor="middle">start</text><text class="p215-depth-label" x="260" y="415" text-anchor="middle">toss 1 · stake £1</text><text class="p215-depth-label" x="455" y="415" text-anchor="middle">toss 2 · stake £2</text>${state.expanded ? '<text class="p215-depth-label" x="670" y="415" text-anchor="middle">toss 3 · stake £4</text>' : ""}${treeEdgesMarkup(visibleDepth)}${treeNodesMarkup(visibleDepth)}</svg>`;
  }

  function selectedLedgerMarkup() {
    const selected = conditionalData(state.selectedHistory);
    const revealMean = state.stage >= 1 || state.revealed;
    return `<section class="p215-ledger" aria-label="Selected history calculation" aria-live="polite"><article><span>Selected history</span><strong>${state.selectedHistory || "Start"}</strong><small>current capital £${selected.capital}</small></article><article><span>Next outcomes</span><strong>${selected.terminal ? "terminal path" : `£${selected.headCapital} / £${selected.tailCapital}`}</strong><small>${selected.terminal ? "no toss remains" : `fair £${selected.nextStake} stake`}</small></article><article><span>Conditional mean</span><strong>${selected.terminal ? "—" : revealMean ? `£${format(selected.conditionalAverage, 2)}` : "stage 2"}</strong><small>${selected.terminal ? "select an earlier history" : revealMean ? `½(£${selected.headCapital}+£${selected.tailCapital})` : "average both children"}</small></article></section>`;
  }

  function treeControlsMarkup() {
    const inspectable = treeHistories(2);
    return `<section class="p215-tree-controls" aria-label="Coin-tree controls"><label for="p215-history"><span>Inspect a current history</span><select id="p215-history" data-p215-history>${inspectable.map((history) => `<option value="${history}" ${state.selectedHistory === history ? "selected" : ""}>${history || "Start"} · £${capitalForHistory(history)}</option>`).join("")}</select></label><button class="primary-button" type="button" data-problem-action="p215-toggle-tree" aria-pressed="${state.expanded}">${state.expanded ? "Hide toss 3 leaves" : "Expand toss 3 leaves"}</button></section>`;
  }

  function martingaleDistinctionMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    return `<section class="p215-distinction" aria-labelledby="p215-distinction-heading"><div><span class="eyebrow">Martingale test</span><h3 id="p215-distinction-heading">Condition on what is known now</h3></div><div class="p215-martingale-equation">E[Xₙ₊₁ | 𝓕ₙ]=Xₙ</div><p>Every parent capital equals the fair average of its two children. The eight final paths range from £${overall.minimumCapital} to £${overall.maximumCapital}, but their overall mean is £${overall.expectedCapital}. Independent increments are not the definition; in general, only zero conditional drift is required.</p></section>`;
  }

  function dynamicMarkup() { return `<div class="p215-dynamic">${treeSvg()}${selectedLedgerMarkup()}${treeControlsMarkup()}${martingaleDistinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p215-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p215-solution" aria-labelledby="p215-solution-heading"><h3 id="p215-solution-heading">Fairness lives in the conditional average</h3><p>The history HT has capital</p><div class="p215-solution-equation">X₂=£10+£1−£2=£9.</div><p>Toss 3 stakes £4. A head produces £13 and a tail produces £5, each with conditional probability 1/2:</p><div class="p215-solution-equation is-answer">E[X₃ | HT]=½(£13)+½(£5)=<strong>£9.</strong></div><p>Individual paths are not flat: the eight toss-3 capitals are £17, £9, £13, £5, £15, £7, £11 and £3. Nevertheless,</p><div class="p215-solution-equation">E[X₃]=(17+9+13+5+15+7+11+3)/8=<strong>£10.</strong></div><p>The game is a martingale because every next increment has conditional mean zero given the current history. Independence of increments happens in this fixed-stake fair-coin example, but it is neither the definition nor generally necessary.</p></section>`;
  }

  function snapshot() {
    const nodes = treeHistories().map((history) => conditionalData(history));
    const selected = conditionalData(state.selectedHistory);
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, startCapitalPounds: START_CAPITAL, stakesPounds: STAKES, fairCoin: { headProbability: .5, tailProbability: .5 }, selectedHistory: selected, nodes, conditionalResiduals: nodes.filter((node) => !node.terminal).map((node) => ({ history: node.history || "start", residual: node.martingaleResidual })), terminalAudit: overall, challenge: { history: CHALLENGE_HISTORY, conditionalExpectedCapitalPounds: challenge.conditionalAverage, overallExpectedCapitalPounds: overall.expectedCapital }, martingaleDefinition: "E[X_(n+1) | current information F_n] = X_n", nonDefinition: "paths need not be flat and independent increments are not required", expanded: state.expanded, stage: state.stage, answer: state.answer, committed: state.committed, hintsUsed: state.hintsUsed, revealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.selectedHistory = CHALLENGE_HISTORY; state.expanded = true; }

  function render() {
    return `<main class="book-shell p215-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · stochastic processes</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p215-spread"><article class="book-page p215-problem-page"><div class="problem-number">Problem 21.5</div><h1 class="book-title p215-title">A Fair Game with a Wild Path</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p215-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A player starts with £10. Three independent fair-coin tosses use stakes £1, then £2, then £4. Heads wins the stake; tails loses it.</p><p class="problem-copy">After the history HT, the capital is £9. Toss 3 therefore ends at £13 after H or £5 after T.</p><p class="problem-copy"><strong>What is E[X₃ | HT], the expected capital after toss 3 given the observed history HT?</strong></p><section class="p215-question-card"><strong>Conditional, not motionless</strong><p>A martingale may wander sharply. Its defining balance compares the next conditional average with the capital at the current history.</p></section></article><section class="book-page book-stage p215-stage" aria-labelledby="p215-stage-heading">${stageControlsMarkup()}<div class="p215-stage-heading"><div><span class="eyebrow">Fair-game laboratory</span><h2 id="p215-stage-heading">Expand the path tree and inspect any node</h2></div><p>Select a current history, then expose the final toss to compare each parent with its two possible futures.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p215-coach"><div class="coach-kicker">Condition on HT</div><p class="coach-question">Enter the conditional expected capital E[X₃ | HT] in pounds.</p><form class="p215-answer-form" data-p215-answer-form novalidate><label for="p215-answer">Conditional expected capital</label><div><span aria-hidden="true">£</span><input id="p215-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="amount"/></div><button class="primary-button" type="submit">Check expectation</button></form>${feedbackMarkup()}<div class="button-row p215-help-row"><button class="secondary-button" type="button" data-problem-action="p215-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p215-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p215-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p215-shell");
    if (!root) return;
    root.addEventListener("change", (event) => {
      if (!event.target.matches("[data-p215-history]")) return;
      state.selectedHistory = event.target.value;
      renderAndFocus(renderApp, "#p215-history");
    });
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p215-reset") { state = initialState(); renderAndFocus(renderApp, "#p215-history"); return; }
      if (action === "p215-toggle-tree") { state.expanded = !state.expanded; renderAndFocus(renderApp, '[data-problem-action="p215-toggle-tree"]'); return; }
      if (action === "p215-stage") { state.stage = clamp(Math.round(control.dataset.p215Stage), 0, 2); renderAndFocus(renderApp, `[data-p215-stage="${state.stage}"]`); return; }
      if (action === "p215-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p215-stage="${state.stage}"]`); return; }
      if (action === "p215-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p215-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
    });
    root.querySelector("#p215-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root.querySelector("[data-p215-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = event.currentTarget.querySelector("#p215-answer")?.value.trim() || "";
      const answer = parseMoney(state.answer);
      state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer) || answer < 0) state.feedback = "Enter one non-negative capital amount in pounds.";
      else if (Math.abs(answer - 13) <= .01 || Math.abs(answer - 5) <= .01) state.feedback = "That is one possible toss-3 outcome. The conditional expectation averages both equally likely children.";
      else if (Math.abs(answer - 10) <= .01) state.feedback = "£10 is the unconditional expected capital before observing a history. Conditioned on HT, the current capital is £9.";
      else if (Math.abs(answer - challenge.conditionalAverage) > .01) state.feedback = "From HT, average the £13 head child and the £5 tail child with equal weights.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: E[X₃ | HT]=(£13+£5)/2=£9, equal to the current HT capital."; state.committed = true; state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p215-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
