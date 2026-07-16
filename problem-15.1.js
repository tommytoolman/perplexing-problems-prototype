(function registerCrowdedCloakroomPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "15.1";
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const CHALLENGE = Object.freeze({ guests: 23, labels: 365, seed: 137 });
  const SIMULATION_TRIALS = 2000;
  const CURVE_TRIALS = 300;
  const CHALLENGE_COLLISION_PROBABILITY = collisionProbability(CHALLENGE.guests, CHALLENGE.labels);
  const stages = Object.freeze([
    Object.freeze({ short: "Assign", title: "Watch one seeded cloakroom assignment", copy: "Each guest is independently sent to one of m equally likely labelled hooks. Repeated labels in the right-hand panel are collisions." }),
    Object.freeze({ short: "Complement", title: "Count the chance that every label is distinct", copy: "After k distinct assignments, the next guest avoids them with probability (m−k)/m. Multiply those conditional probabilities, then subtract from one." }),
    Object.freeze({ short: "Simulate", title: "Compare exact probability with seeded trials", copy: "The exact curve is fixed mathematics. Seeded simulation dots fluctuate around it and reproduce exactly when the seed and inputs are unchanged." }),
  ]);
  const hints = Object.freeze([
    "It is easier to count the complementary event: every guest receives a different label.",
    "The first guest is unrestricted. The next avoids one used label with probability 364/365, then the next avoids two with probability 363/365, and so on.",
    "For 23 guests, multiply 1×(364/365)×(363/365)×⋯×(343/365).",
    `Subtract that product from one: P(collision)=${CHALLENGE_COLLISION_PROBABILITY.toFixed(9)}=${(100 * CHALLENGE_COLLISION_PROBABILITY).toFixed(4)}%.`,
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p151-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 24); }

  function noCollisionProbability(guests, labels) {
    if (guests > labels) return 0;
    let probability = 1;
    for (let assigned = 0; assigned < guests; assigned += 1) probability *= (labels - assigned) / labels;
    return probability;
  }

  function collisionProbability(guests, labels) { return 1 - noCollisionProbability(guests, labels); }

  function createGenerator(seed) {
    let value = Number(seed) >>> 0;
    return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  }

  function sampleParty(guests = state.guests, labels = state.labels, seed = state.seed) {
    const random = createGenerator(seed);
    const assignments = Array.from({ length: guests }, () => 1 + Math.floor(random() * labels));
    const counts = new Map();
    assignments.forEach((label) => counts.set(label, (counts.get(label) || 0) + 1));
    const duplicateLabels = [...counts.entries()].filter(([, count]) => count > 1).map(([label]) => label).sort((a, b) => a - b);
    return { assignments, counts, duplicateLabels, hasCollision: duplicateLabels.length > 0 };
  }

  function simulatedProbability(guests, labels, trials, seed) {
    if (guests > labels) return 1;
    const random = createGenerator(seed ^ Math.imul(labels, 3266489917) ^ Math.imul(guests, 668265263));
    let collisions = 0;
    for (let trial = 0; trial < trials; trial += 1) {
      const used = new Set();
      let collided = false;
      for (let guest = 0; guest < guests; guest += 1) {
        const label = Math.floor(random() * labels);
        if (used.has(label)) collided = true;
        used.add(label);
      }
      if (collided) collisions += 1;
    }
    return collisions / trials;
  }

  function modelData() {
    const noCollision = noCollisionProbability(state.guests, state.labels);
    const collision = 1 - noCollision;
    const party = sampleParty();
    const simulated = simulatedProbability(state.guests, state.labels, SIMULATION_TRIALS, state.seed);
    const simulationSeries = [];
    for (let guests = 5; guests <= 80; guests += 5) simulationSeries.push({ guests, probability: simulatedProbability(guests, state.labels, CURVE_TRIALS, state.seed + guests * 9973) });
    return { noCollision, collision, party, simulated, simulationSeries, simulationError: simulated - collision };
  }

  function exactCurve(labels = state.labels) {
    return Array.from({ length: 81 }, (_, guests) => ({ guests, probability: collisionProbability(guests, labels) }));
  }

  function stageControls() {
    return `<div class="p151-stage-controls" role="group" aria-label="Cloakroom collision stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p151-stage" data-p151-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p151-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p151-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Comparison complete" : "Next stage"}</button></div>`;
  }

  function probabilitySvg(values) {
    const plot = { left: 52, right: 430, top: 57, bottom: 331 };
    const x = (guests) => plot.left + guests / 80 * (plot.right - plot.left);
    const y = (probability) => plot.bottom - probability * (plot.bottom - plot.top);
    const curvePath = exactCurve().map((point, index) => `${index ? "L" : "M"}${format(x(point.guests), 2)} ${format(y(point.probability), 2)}`).join("");
    const currentX = x(state.guests), exactY = y(values.collision), simulatedY = y(values.simulated);
    const tokenMarkup = values.party.assignments.map((label, index) => { const tokenX = 466 + index % 8 * 30, tokenY = 91 + Math.floor(index / 8) * 22; const repeated = values.party.counts.get(label) > 1; return `<g class="p151-token ${repeated ? "is-collision" : ""}"><rect x="${tokenX}" y="${tokenY}" width="27" height="18" rx="5"/><text x="${tokenX + 13.5}" y="${tokenY + 12}" text-anchor="middle">${label}</text></g>`; }).join("");
    const duplicateSummary = values.party.duplicateLabels.length ? `Repeated: ${values.party.duplicateLabels.slice(0, 7).join(", ")}${values.party.duplicateLabels.length > 7 ? "…" : ""}` : "No repeated label in this party";
    const distinctFormula = state.guests > state.labels ? "n>m, so P(distinct)=0" : state.guests <= 1 ? "P(distinct)=1" : `P(distinct)=1×(${state.labels - 1}/${state.labels})×…×(${state.labels - state.guests + 1}/${state.labels})`;
    return `<svg class="p151-svg p151-stage-${state.stage}" viewBox="0 0 740 430" role="img" aria-labelledby="p151-svg-title p151-svg-desc">
      <title id="p151-svg-title">Exact and seeded simulated cloak-label collision probabilities</title>
      <desc id="p151-svg-desc">For ${state.guests} guests independently assigned among ${state.labels} equally likely labels, the exact probability of at least one collision is ${format(100 * values.collision, 6)} percent. A deterministic ${SIMULATION_TRIALS}-party simulation with seed ${state.seed} gives ${format(100 * values.simulated, 4)} percent. The exact curve shows probabilities for zero through eighty guests, and seeded simulation dots are shown every five guests.</desc>
      <rect class="p151-board" x="1" y="1" width="738" height="428" rx="20"/><text class="p151-board-title" x="22" y="27">COLLISION PROBABILITY · EXACT CURVE AND SEEDED TRIALS</text>
      <g class="p151-grid">${[0, .25, .5, .75, 1].map((tick) => `<line x1="${plot.left}" y1="${format(y(tick), 2)}" x2="${plot.right}" y2="${format(y(tick), 2)}"/><text x="${plot.left - 9}" y="${format(y(tick) + 3, 2)}" text-anchor="end">${format(100 * tick, 0)}%</text>`).join("")}${[0, 20, 40, 60, 80].map((tick) => `<line x1="${format(x(tick), 2)}" y1="${plot.top}" x2="${format(x(tick), 2)}" y2="${plot.bottom}"/><text x="${format(x(tick), 2)}" y="349" text-anchor="middle">${tick}</text>`).join("")}</g><line class="p151-axis" x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}"/><line class="p151-axis" x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}"/><text class="p151-axis-label" x="241" y="365" text-anchor="middle">number of guests n</text><text class="p151-axis-label" transform="translate(15 194) rotate(-90)" text-anchor="middle">P(at least one repeated label)</text><line class="p151-half-line" x1="${plot.left}" y1="${format(y(.5), 2)}" x2="${plot.right}" y2="${format(y(.5), 2)}"/><text class="p151-half-label" x="${plot.right - 4}" y="${format(y(.5) - 6, 2)}" text-anchor="end">50% threshold</text>
      <g class="p151-exact-layer"><path class="p151-exact-area" d="${curvePath}L${plot.right} ${plot.bottom}L${plot.left} ${plot.bottom}Z"/><path class="p151-exact-curve" d="${curvePath}"/><line class="p151-current-guide" x1="${format(currentX, 2)}" y1="${plot.bottom}" x2="${format(currentX, 2)}" y2="${format(exactY, 2)}"/><circle class="p151-exact-point" cx="${format(currentX, 2)}" cy="${format(exactY, 2)}" r="6"/><text class="p151-point-label" x="${format(Math.min(currentX + 10, 350), 2)}" y="${format(Math.max(exactY - 9, 71), 2)}">exact ${format(100 * values.collision, 3)}%</text></g>
      <g class="p151-simulation-layer">${values.simulationSeries.map((point) => `<circle class="p151-simulation-dot" cx="${format(x(point.guests), 2)}" cy="${format(y(point.probability), 2)}" r="3.3"/>`).join("")}<path class="p151-simulation-point" d="M${format(currentX, 2)} ${format(simulatedY - 7, 2)}L${format(currentX + 7, 2)} ${format(simulatedY, 2)}L${format(currentX, 2)} ${format(simulatedY + 7, 2)}L${format(currentX - 7, 2)} ${format(simulatedY, 2)}Z"/><text class="p151-simulation-label" x="${format(Math.min(currentX + 10, 346), 2)}" y="${format(Math.min(simulatedY + 18, 322), 2)}">seeded ${format(100 * values.simulated, 2)}%</text></g>
      <g class="p151-formula-card"><rect x="52" y="377" width="378" height="39" rx="10"/><text class="p151-formula" x="67" y="394">${distinctFormula}</text><text class="p151-formula-result" x="67" y="409">P(collision)=1−P(distinct)=${format(100 * values.collision, 5)}%</text></g>
      <g class="p151-party-panel"><rect x="451" y="48" width="267" height="368" rx="16"/><text class="p151-party-kicker" x="468" y="70">ONE REPRODUCIBLE PARTY · SEED ${state.seed}</text>${tokenMarkup}<text class="p151-party-note" x="468" y="319">${duplicateSummary}</text><line x1="468" y1="331" x2="701" y2="331"/><text class="p151-party-result" x="468" y="353">${values.party.hasCollision ? "collision in this party" : "all labels distinct in this party"}</text><text class="p151-party-stat" x="468" y="376">${SIMULATION_TRIALS} parties: ${format(100 * values.simulated, 2)}%</text><text class="p151-party-stat" x="468" y="394">exact: ${format(100 * values.collision, 4)}%</text><text class="p151-party-error" x="468" y="409">simulation − exact: ${values.simulationError >= 0 ? "+" : ""}${format(100 * values.simulationError, 3)} points</text></g>
    </svg>`;
  }

  function metricsMarkup(values) {
    return `<section class="p151-metrics" aria-live="polite"><div><span>All labels distinct</span><strong>${format(100 * values.noCollision, 4)}%</strong></div><div><span>Exact collision probability</span><strong>${state.stage >= 1 || state.revealed ? `${format(100 * values.collision, 4)}%` : "stage 2"}</strong></div><div><span>Seeded simulation</span><strong>${state.stage >= 2 || state.revealed ? `${format(100 * values.simulated, 2)}%` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup(values = modelData()) { return `<div class="p151-dynamic">${probabilitySvg(values)}${metricsMarkup(values)}</div>`; }

  function controlsMarkup() {
    return `<section class="p151-controls" aria-label="Cloakroom collision controls"><div class="p151-control-grid"><label for="p151-guests"><span>Guests n<output data-p151-output="guests">${format(state.guests, 0)}</output></span><input id="p151-guests" type="range" min="2" max="80" step="1" value="${state.guests}"/></label><label for="p151-labels"><span>Equally likely labels m<output data-p151-output="labels">${format(state.labels, 0)}</output></span><input id="p151-labels" type="range" min="20" max="500" step="5" value="${state.labels}"/></label></div><div class="p151-seed-row"><p><strong>Deterministic seed ${state.seed}.</strong> The current party and every simulation dot can be reproduced exactly.</p><button class="secondary-button" type="button" data-problem-action="p151-reseed">Run another seed</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p151-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p151-solution" aria-labelledby="p151-solution-heading"><h3 id="p151-solution-heading" tabindex="-1">Count distinct assignments, then complement</h3><p>The randomized attendant does not check occupied hooks. For 23 independently assigned guests,</p><div class="p151-equation">P(no collision)=1×364/365×363/365×⋯×343/365<br>=${noCollisionProbability(23, 365).toFixed(12)}</div><div class="p151-equation is-answer">P(at least one collision)=1−P(no collision)<br>=${CHALLENGE_COLLISION_PROBABILITY.toFixed(12)}<br>=${(100 * CHALLENGE_COLLISION_PROBABILITY).toFixed(4)}%</div><p>The answer is just above one half. This is not because any particular pair is likely to match; it is because 23 guests create 23×22/2=253 possible pairs.</p><p class="p151-limits"><strong>Model boundary.</strong> Every guest is assigned independently and uniformly among exactly 365 labels, so repeat assignments are allowed. Real cloakrooms normally prevent occupied-hook collisions; this deliberately faulty randomized attendant is a probability model. Seeded trials illustrate sampling variation but do not replace the exact complement product.</p></section>`;
  }

  function snapshot(values = modelData()) {
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "independent uniform assignments with replacement", guests: state.guests, equallyLikelyLabels: state.labels, deterministicSeed: state.seed, simulationTrials: SIMULATION_TRIALS, exactNoCollisionProbability: Number(values.noCollision.toFixed(12)), exactCollisionProbability: Number(values.collision.toFixed(12)), seededCollisionProbability: Number(values.simulated.toFixed(12)), seededMinusExact: Number(values.simulationError.toFixed(12)), samplePartyAssignments: values.party.assignments, samplePartyDuplicateLabels: values.party.duplicateLabels, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    const values = modelData();
    return `<main class="book-shell p151-shell"><div class="p151-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Probability and randomness</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p151-spread"><article class="book-page p151-problem-page"><div class="problem-number">Problem 15.1</div><h1 class="book-title p151-title">The Crowded Cloakroom</h1><div class="difficulty" aria-label="One star difficulty">★</div><p class="problem-copy">A faulty automatic attendant independently directs each of 23 guests to one of 365 equally likely labelled hooks, without checking whether a hook is already occupied.</p><p class="problem-copy"><strong>What is the probability that at least two guests receive the same label? Give a percentage to four decimal places.</strong></p><section class="p151-observation-card"><strong>Count the easier event</strong><p>“At least one repeat” has many overlapping cases. “Every label is distinct” is one clean product.</p></section><section class="p151-model-card"><div class="eyebrow">Uniform independent model</div><p>Assignments are with replacement. The simulation is deterministically seeded; changing the seed changes the sample, never the exact curve.</p></section></article><section class="book-page book-stage p151-stage">${stageControls()}<div class="p151-visual-card">${dynamicMarkup(values)}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p151-coach"><div class="coach-kicker">Find the first collision</div><p class="coach-question">For 23 guests and 365 labels, enter the exact collision probability as a percentage.</p><form class="p151-answer-form" data-p151-answer-form novalidate><label for="p151-answer">Collision probability</label><div><input id="p151-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="four decimal places" autocomplete="off"/><span>%</span></div><button class="primary-button" type="submit">Check probability</button></form>${feedbackMarkup()}<div class="button-row p151-help-row"><button class="secondary-button" type="button" data-problem-action="p151-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p151-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p151-debug">${debugPanel("Development state", snapshot(values))}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p151-shell"); if (!root) return;
    const dynamic = root.querySelector(".p151-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { guests: format(state.guests, 0), labels: format(state.labels, 0) };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p151-output="${key}"]`); if (output) output.textContent = value; });
    const exact = collisionProbability(state.guests, state.labels);
    root.querySelector("#p151-guests")?.setAttribute("aria-valuetext", `${state.guests} guests; exact collision probability ${format(100 * exact, 4)} percent`);
    root.querySelector("#p151-labels")?.setAttribute("aria-valuetext", `${state.labels} equally likely labels; exact collision probability ${format(100 * exact, 4)} percent`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p151-reset") { state = initialState(); renderAndFocus(renderApp, "#p151-guests"); return; }
      if (action === "p151-stage") { state.stage = clamp(Number(control.dataset.p151Stage), 0, 2); renderAndFocus(renderApp, `[data-p151-stage="${state.stage}"]`); return; }
      if (action === "p151-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p151-stage="${state.stage}"]`); return; }
      if (action === "p151-reseed") { state.seed = (state.seed + 9973) >>> 0; state.feedback = ""; state.committed = false; renderAndFocus(renderApp, `[data-problem-action="p151-reseed"]`); return; }
      if (action === "p151-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p151-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p151-reveal") window.requestAnimationFrame(() => document.querySelector("#p151-solution-heading")?.focus());
    }));
    [["#p151-guests", "guests", 2, 80], ["#p151-labels", "labels", 20, 500]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); state.feedback = ""; state.committed = false; updateDynamicDom(); }));
    const input = document.querySelector("#p151-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p151-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = 100 * CHALLENGE_COLLISION_PROBABILITY; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter the collision probability as a percentage to four decimal places.";
      else if (Math.abs(answer - CHALLENGE_COLLISION_PROBABILITY) < .0002) state.feedback = "That is the probability as a decimal. Multiply by 100 to express it as a percentage.";
      else if (Math.abs(answer - 100 * noCollisionProbability(23, 365)) < .001) state.feedback = "That is the probability that all labels are distinct. Subtract it from 100%.";
      else if (Math.abs(answer - target) > .0006) state.feedback = "Multiply the successive probabilities of avoiding earlier labels, then take the complement.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: P(collision)=${CHALLENGE_COLLISION_PROBABILITY.toFixed(12)}=${target.toFixed(4)}%.`; }
      renderAndFocus(renderApp, "#p151-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
