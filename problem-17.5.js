(function registerLifeboatReliabilityPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "17.5";
  const CHALLENGE_RELIABILITY = 0.8;
  const LINK_NAMES = Object.freeze(["Upper departure", "Upper arrival", "Lower departure", "Lower arrival"]);
  const INITIAL_LINK_STATES = Object.freeze([true, false, true, true]);
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "States", title: "Inspect the sixteen possible link states", copy: "Each four-bit state records Upper departure, Upper arrival, Lower departure and Lower arrival. A lifeboat route works only when both of its series links are up." }),
    Object.freeze({ short: "Routes", title: "Multiply along each series path", copy: "The links are independent, so either two-link route works with probability r×r=r². The upper and lower route events are independent because they use disjoint links." }),
    Object.freeze({ short: "Complement", title: "Fail both routes, then subtract", copy: "One route fails with probability 1−r². The whole network fails only when both routes fail, giving system reliability 1−(1−r²)²." }),
  ]);
  const hints = Object.freeze([
    "A two-link series route works only if both links work. Independence gives P(route works)=r².",
    "It is easier to count system failure: a single route fails with probability 1−r².",
    "The two route-failure events are independent because the diamond paths share no links. Multiply their probabilities.",
    "At r=0.8: 1−(1−0.8²)²=1−0.36²=1−0.1296=0.8704.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p175-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 5) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function routeReliability(reliability) { return reliability ** 2; }
  function systemReliability(reliability) { return 1 - (1 - routeReliability(reliability)) ** 2; }
  function systemFailureProbability(reliability) { return 1 - systemReliability(reliability); }
  function stateCode(states) { return states.map((working) => working ? "1" : "0").join(""); }
  function statesFromIndex(index) { return Array.from({ length: 4 }, (_, link) => Boolean(index & (1 << (3 - link)))); }
  function stateIndex(states) { return states.reduce((index, working) => index * 2 + Number(working), 0); }
  function networkStatus(states) { const upperWorks = states[0] && states[1], lowerWorks = states[2] && states[3]; return { upperWorks, lowerWorks, works: upperWorks || lowerWorks }; }
  function outcomeProbability(states, reliability) { const workingCount = states.filter(Boolean).length; return reliability ** workingCount * (1 - reliability) ** (states.length - workingCount); }
  function enumerateOutcomes(reliability) { return Array.from({ length: 16 }, (_, index) => { const states = statesFromIndex(index), status = networkStatus(states); return { index, code: stateCode(states), states, workingCount: states.filter(Boolean).length, probability: outcomeProbability(states, reliability), ...status }; }); }
  function enumerationSummary(reliability) { const outcomes = enumerateOutcomes(reliability), successful = outcomes.filter((outcome) => outcome.works), failed = outcomes.filter((outcome) => !outcome.works); return { outcomes, successful, failed, successfulCount: successful.length, failedCount: failed.length, successProbability: successful.reduce((sum, outcome) => sum + outcome.probability, 0), failureProbability: failed.reduce((sum, outcome) => sum + outcome.probability, 0) }; }

  function parseProbability(raw) {
    const normalized = String(raw).trim().replaceAll("−", "-").replaceAll(",", ".");
    if (!normalized) return NaN;
    if (normalized.endsWith("%")) return Number(normalized.slice(0, -1)) / 100;
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return Number(normalized);
  }

  function initialState() { return { reliability: CHALLENGE_RELIABILITY, linkStates: [...INITIAL_LINK_STATES], boardMessage: "State 1011: the upper route is broken, but the lower route still reaches the lifeboat.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function restoreChallenge() { state.reliability = CHALLENGE_RELIABILITY; state.linkStates = [...INITIAL_LINK_STATES]; state.boardMessage = "Challenge restored: r=0.8 and state 1011 works through the lower route."; }
  function setOutcome(index) { state.linkStates = statesFromIndex(clamp(Math.round(index), 0, 15)); const status = networkStatus(state.linkStates); state.boardMessage = `Loaded state ${stateCode(state.linkStates)}. ${status.works ? `Network works through ${status.upperWorks && status.lowerWorks ? "both routes" : status.upperWorks ? "the upper route" : "the lower route"}.` : "Both routes are broken; the network fails."}`; }
  function toggleLink(index) { const link = clamp(Math.round(index), 0, 3); state.linkStates[link] = !state.linkStates[link]; const status = networkStatus(state.linkStates); state.boardMessage = `${LINK_NAMES[link]} switched ${state.linkStates[link] ? "up" : "down"}. State ${stateCode(state.linkStates)} ${status.works ? "still reaches the lifeboat" : "has no complete route"}.`; }

  function stageControls() {
    return `<div class="p175-stage-controls" role="group" aria-label="Network reliability stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p175-stage" data-p175-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p175-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p175-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Reliability exposed" : "Next stage"}</button></div>`;
  }

  function linkMarkup(index, x1, y1, x2, y2, labelX, labelY) {
    const working = state.linkStates[index];
    return `<g class="p175-link ${working ? "is-up" : "is-down"}" data-p175-link="${index}" tabindex="0" role="button" aria-label="${LINK_NAMES[index]} link, ${working ? "working" : "failed"}; activate to toggle"><line class="p175-link-hit" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="p175-link-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle class="p175-link-switch" cx="${(x1 + x2) / 2}" cy="${(y1 + y2) / 2}" r="12"/><text class="p175-link-state" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 3}" text-anchor="middle">${working ? "1" : "0"}</text><text class="p175-link-label" x="${labelX}" y="${labelY}" text-anchor="middle">${LINK_NAMES[index].replace(" departure", "-1").replace(" arrival", "-2")}</text></g>`;
  }

  function networkSvg() {
    const status = networkStatus(state.linkStates), routeValue = routeReliability(state.reliability), failure = systemFailureProbability(state.reliability), system = systemReliability(state.reliability);
    const selectedProbability = outcomeProbability(state.linkStates, state.reliability);
    return `<svg class="p175-network p175-stage-${state.stage}" viewBox="0 0 760 420" role="group" aria-labelledby="p175-svg-title p175-svg-desc"><title id="p175-svg-title">Interactive two-route lifeboat reliability network</title><desc id="p175-svg-desc">A diamond network joins the departure point to a lifeboat through two independent paths, each containing two series links. Current state ${stateCode(state.linkStates)} has upper route ${status.upperWorks ? "working" : "failed"}, lower route ${status.lowerWorks ? "working" : "failed"}, so the system ${status.works ? "works" : "fails"}. Each link works independently with probability ${format(state.reliability, 3)}. The selected state has probability ${format(selectedProbability, 6)}.</desc><rect class="p175-sea" x="1" y="1" width="758" height="418" rx="20"/><g class="p175-waves" aria-hidden="true"><path d="M0 348q42-24 84 0t84 0t84 0t84 0t84 0t84 0t84 0t84 0t84 0"/><path d="M0 382q42-24 84 0t84 0t84 0t84 0t84 0t84 0t84 0t84 0t84 0"/></g><text class="p175-board-kicker" x="22" y="28">DIAMOND RESCUE NETWORK · FOUR INDEPENDENT LINKS</text><g class="p175-route-glow ${status.upperWorks ? "is-working" : ""}"><path d="M71 218L236 86L405 218"/></g><g class="p175-route-glow ${status.lowerWorks ? "is-working" : ""}"><path d="M71 218L236 350L405 218"/></g>${linkMarkup(0, 71, 218, 236, 86, 145, 133)}${linkMarkup(1, 236, 86, 405, 218, 329, 133)}${linkMarkup(2, 71, 218, 236, 350, 145, 315)}${linkMarkup(3, 236, 350, 405, 218, 329, 315)}<g class="p175-node"><circle cx="71" cy="218" r="28"/><text x="71" y="214" text-anchor="middle">START</text><text x="71" y="229" text-anchor="middle">S</text></g><g class="p175-node is-relay"><circle cx="236" cy="86" r="25"/><text x="236" y="90" text-anchor="middle">N</text></g><g class="p175-node is-relay"><circle cx="236" cy="350" r="25"/><text x="236" y="354" text-anchor="middle">S</text></g><g class="p175-node is-lifeboat"><circle cx="405" cy="218" r="31"/><text x="405" y="214" text-anchor="middle">BOAT</text><text x="405" y="230" text-anchor="middle">T</text></g><g class="p175-current-status"><rect x="118" y="181" width="238" height="74" rx="13"/><text class="p175-status-kicker" x="237" y="202" text-anchor="middle">CURRENT STATE ${stateCode(state.linkStates)}</text><text class="p175-status-value ${status.works ? "is-working" : "is-failed"}" x="237" y="226" text-anchor="middle">${status.works ? "RESCUE ROUTE OPEN" : "NETWORK FAILED"}</text><text class="p175-status-detail" x="237" y="244" text-anchor="middle">outcome weight ${format(selectedProbability, 6)}</text></g><g class="p175-ledger" transform="translate(456 45)"><rect class="p175-ledger-bg" width="280" height="330" rx="16"/><text class="p175-ledger-title" x="18" y="29">RELIABILITY AUDIT · r=${format(state.reliability, 3)}</text><text class="p175-ledger-label" x="18" y="72">upper series route</text><text class="p175-ledger-live" x="260" y="72" text-anchor="end">${status.upperWorks ? "OPEN" : "BROKEN"}</text><text class="p175-ledger-formula" x="18" y="96">P(U)=r²</text><text class="p175-ledger-value" x="260" y="96" text-anchor="end">${state.stage >= 1 || state.revealed ? format(routeValue, 5) : "stage 2"}</text><line class="p175-ledger-rule" x1="18" y1="116" x2="260" y2="116"/><text class="p175-ledger-label" x="18" y="148">lower series route</text><text class="p175-ledger-live" x="260" y="148" text-anchor="end">${status.lowerWorks ? "OPEN" : "BROKEN"}</text><text class="p175-ledger-formula" x="18" y="172">P(L)=r²</text><text class="p175-ledger-value" x="260" y="172" text-anchor="end">${state.stage >= 1 || state.revealed ? format(routeValue, 5) : "stage 2"}</text><line class="p175-ledger-rule" x1="18" y1="194" x2="260" y2="194"/><text class="p175-ledger-label" x="18" y="225">both routes fail</text><text class="p175-ledger-value is-failure" x="260" y="225" text-anchor="end">${state.stage >= 2 || state.revealed ? format(failure, 5) : "stage 3"}</text><text class="p175-ledger-formula" x="18" y="249">(1−r²)²</text><rect class="p175-result-box" x="14" y="269" width="252" height="45" rx="10"/><text class="p175-result-label" x="27" y="287">SYSTEM RELIABILITY</text><text class="p175-result-value" x="253" y="300" text-anchor="end">${state.stage >= 2 || state.revealed ? format(system, 5) : "stage 3"}</text></g></svg>`;
  }

  function linkControls() {
    return `<section class="p175-controls" aria-label="Reliability and link-state controls"><label for="p175-reliability"><span>Independent link reliability r<output data-p175-output="reliability">${format(state.reliability, 2)}</output></span><input id="p175-reliability" type="range" min="0" max="1" step="0.01" value="${state.reliability}"/></label><div class="p175-link-buttons" role="group" aria-label="Toggle individual link states">${LINK_NAMES.map((name, index) => `<button class="secondary-button ${state.linkStates[index] ? "is-up" : "is-down"}" type="button" data-p175-link="${index}" aria-pressed="${state.linkStates[index]}"><span>${name}</span><strong>${state.linkStates[index] ? "1 · UP" : "0 · DOWN"}</strong></button>`).join("")}</div><div class="p175-control-message"><p data-p175-control-message role="status">${state.boardMessage}</p><button class="chip-button" type="button" data-problem-action="p175-challenge">Restore r=0.8 challenge</button></div></section>`;
  }

  function enumerationMarkup() {
    const summary = enumerationSummary(state.reliability), selectedIndex = stateIndex(state.linkStates), selected = summary.outcomes[selectedIndex];
    return `<section class="p175-enumeration" aria-labelledby="p175-enumeration-heading"><header><div><span class="eyebrow">Complete state enumeration</span><h3 id="p175-enumeration-heading">Seven working states, nine failed states</h3></div><div><span class="is-success">works ${format(summary.successProbability, 5)}</span><span class="is-failure">fails ${format(summary.failureProbability, 5)}</span></div></header><div class="p175-selected-outcome" aria-live="polite"><strong>${selected.code}</strong><span>${selected.works ? "WORKS" : "FAILS"}</span><p>${selected.workingCount} links up · upper ${selected.upperWorks ? "open" : "broken"} · lower ${selected.lowerWorks ? "open" : "broken"} · probability ${format(selected.probability, 6)}</p></div><div class="p175-outcome-grid" role="group" aria-label="Select one of sixteen link-state outcomes">${summary.outcomes.map((outcome) => `<button class="p175-outcome ${outcome.works ? "is-success" : "is-failure"} ${outcome.index === selectedIndex ? "active" : ""}" type="button" data-p175-outcome="${outcome.index}" aria-pressed="${outcome.index === selectedIndex}" aria-label="State ${outcome.code}; ${outcome.works ? "network works" : "network fails"}; probability ${format(outcome.probability, 7)}"><strong>${outcome.code}</strong><small>${format(outcome.probability, 5)}</small></button>`).join("")}</div><p class="p175-enumeration-note">Bit order: upper-1, upper-2, lower-1, lower-2. A 1 means working. Outcome probabilities are unequal unless r=0.5.</p></section>`;
  }

  function metricsMarkup() {
    const route = routeReliability(state.reliability), failure = systemFailureProbability(state.reliability), system = systemReliability(state.reliability);
    return `<section class="p175-metrics" aria-live="polite"><div><span>One complete route</span><strong>${state.stage >= 1 || state.revealed ? `r² = ${format(route, 5)}` : "stage 2"}</strong></div><div><span>Both routes fail</span><strong>${state.stage >= 2 || state.revealed ? `(1−r²)² = ${format(failure, 5)}` : "stage 3"}</strong></div><div><span>Network works</span><strong>${state.stage >= 2 || state.revealed ? format(system, 5) : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p175-dynamic"><div class="p175-network-wrap">${networkSvg()}${linkControls()}</div>${enumerationMarkup()}${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p175-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p175-solution" aria-labelledby="p175-solution-heading"><h3 id="p175-solution-heading" tabindex="-1">Use the complement of two failed routes</h3><p>Each route contains two independent links in series, so both must work:</p><div class="p175-equation">P(route works)=r²=0.8²=0.64</div><p>A route therefore fails with probability 1−0.64=0.36. The upper and lower routes use disjoint independent links, so their failures are independent.</p><div class="p175-equation">P(system fails)=0.36²=0.1296</div><p>The required reliability is the complementary probability:</p><div class="p175-equation is-answer">P(system works)=1−0.1296<br>=0.8704=87.04%=544/625</div><p>The enumeration gives the same total when the probabilities of its seven successful states are added. Counting them as 7/16 would be valid only at r=0.5, when all sixteen states have equal probability.</p></section>`;
  }

  function snapshot() {
    const status = networkStatus(state.linkStates), summary = enumerationSummary(state.reliability);
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "diamond network with two disjoint independent two-link series routes in parallel", linkReliability: state.reliability, linkOrder: LINK_NAMES, currentLinkStates: state.linkStates, currentStateCode: stateCode(state.linkStates), currentStateProbability: Number(outcomeProbability(state.linkStates, state.reliability).toFixed(12)), upperRouteWorksInCurrentState: status.upperWorks, lowerRouteWorksInCurrentState: status.lowerWorks, networkWorksInCurrentState: status.works, routeReliability: Number(routeReliability(state.reliability).toFixed(12)), bothRoutesFailProbability: Number(systemFailureProbability(state.reliability).toFixed(12)), systemReliability: Number(systemReliability(state.reliability).toFixed(12)), enumeration: summary.outcomes.map((outcome) => ({ state: outcome.code, works: outcome.works, probability: Number(outcome.probability.toFixed(12)) })), enumeratedSuccessProbability: Number(summary.successProbability.toFixed(12)), enumeratedFailureProbability: Number(summary.failureProbability.toFixed(12)), successfulStateCount: summary.successfulCount, failedStateCount: summary.failedCount, challenge: { linkReliability: CHALLENGE_RELIABILITY, exactSystemReliability: 0.8704 }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p175-shell"><div class="p175-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Network reliability</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p175-spread"><article class="book-page p175-problem-page"><div class="problem-number">Problem 17.5</div><h1 class="book-title p175-title">The Two-Route Lifeboat Network</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="problem-copy">A lifeboat can be reached along either of two separate routes. Each route contains two links in series. Every link works independently with reliability r=0.8.</p><p class="problem-copy"><strong>What is the exact probability that at least one complete route works?</strong></p><section class="p175-observation-card"><strong>Parallel outside, series inside</strong><p>One broken link kills its own route, but the system survives whenever the other complete route remains open.</p></section><section class="p175-model-card"><div class="eyebrow">Independence model</div><p>All four links have the same reliability and fail independently. The two routes share only their endpoints, not links.</p></section></article><section class="book-page book-stage p175-stage">${stageControls()}<div class="p175-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p175-coach"><div class="coach-kicker">Compute the rescue reliability</div><p class="coach-question">For the fixed challenge r=0.8, enter an exact decimal, percentage or fraction.</p><form class="p175-answer-form" data-p175-answer-form novalidate><label for="p175-answer">System reliability</label><input id="p175-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 0.8704" autocomplete="off"/><button class="primary-button" type="submit">Check reliability</button></form>${feedbackMarkup()}<div class="button-row p175-help-row"><button class="secondary-button" type="button" data-problem-action="p175-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p175-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p175-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom(root) {
    const network = root.querySelector(".p175-network"); if (network) network.outerHTML = networkSvg();
    const enumeration = root.querySelector(".p175-enumeration"); if (enumeration) enumeration.outerHTML = enumerationMarkup();
    const metrics = root.querySelector(".p175-metrics"); if (metrics) metrics.outerHTML = metricsMarkup();
    const output = root.querySelector('[data-p175-output="reliability"]'); if (output) output.textContent = format(state.reliability, 2);
    const message = root.querySelector("[data-p175-control-message]"); if (message) message.textContent = state.boardMessage;
    const slider = root.querySelector("#p175-reliability"); if (slider) { slider.value = String(state.reliability); slider.setAttribute("aria-valuetext", `Link reliability ${format(state.reliability, 3)}; exact network reliability ${format(systemReliability(state.reliability), 6)}`); }
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p175-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p175-reset") { resetChallenge(); renderAndFocus(renderApp, "#p175-reliability"); return; }
        if (action === "p175-stage") { state.stage = clamp(Number(actionControl.dataset.p175Stage), 0, 2); renderAndFocus(renderApp, `[data-p175-stage="${state.stage}"]`); return; }
        if (action === "p175-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p175-stage="${state.stage}"]`); return; }
        if (action === "p175-challenge") { restoreChallenge(); renderAndFocus(renderApp, "#p175-reliability"); return; }
        if (action === "p175-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p175-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
        renderApp(); if (action === "p175-reveal") window.requestAnimationFrame(() => document.querySelector("#p175-solution-heading")?.focus()); return;
      }
      const link = event.target.closest("[data-p175-link]");
      if (link) { const index = Number(link.dataset.p175Link); toggleLink(index); renderAndFocus(renderApp, `.p175-link-buttons [data-p175-link="${index}"]`); return; }
      const outcome = event.target.closest("[data-p175-outcome]");
      if (outcome) { const index = Number(outcome.dataset.p175Outcome); setOutcome(index); renderAndFocus(renderApp, `[data-p175-outcome="${index}"]`); }
    });
    root?.addEventListener("keydown", (event) => {
      const link = event.target.closest("svg [data-p175-link]");
      if (!link || !["Enter", " "].includes(event.key)) return;
      event.preventDefault(); const index = Number(link.dataset.p175Link); toggleLink(index); renderAndFocus(renderApp, `svg [data-p175-link="${index}"]`);
    });
    root?.querySelector("#p175-reliability")?.addEventListener("input", (event) => { state.reliability = clamp(Number(event.target.value), 0, 1); state.boardMessage = `Link reliability changed to r=${format(state.reliability, 2)}. The selected physical state is unchanged; its probability weight has updated.`; updateDynamicDom(root); });
    root?.querySelector("#p175-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p175-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p175-answer")?.value || "", answer = parseProbability(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a probability as a decimal, percentage or fraction.";
      else if (Math.abs(answer - 0.64) <= 1e-6) state.feedback = "That is the reliability of one two-link route. Include the second independent route.";
      else if (Math.abs(answer - 0.1296) <= 1e-6) state.feedback = "That is the probability both routes fail. Take its complement.";
      else if (Math.abs(answer - 7 / 16) <= 1e-6) state.feedback = "Seven of sixteen states work, but at r=0.8 those states are not equally probable.";
      else if (Math.abs(answer - 0.8704) > 1e-6) state.feedback = "Find the chance both routes fail, then subtract it from one.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: 1−(1−0.8²)²=0.8704=87.04%."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p175-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
