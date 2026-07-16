(function registerResistorTetrahedronPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "9.2";
  const SUPPLY_VOLTS = 12;
  const CHALLENGE_RESISTANCE = 12;
  const stages = Object.freeze([
    Object.freeze({ short: "Symmetry", title: "Exchange the hidden vertices", copy: "Swapping C and D changes neither the terminals nor any resistor. Their potentials must therefore match." }),
    Object.freeze({ short: "Zero branch", title: "Silence the equipotential edge", copy: "Equal endpoint potentials give zero voltage across CD, so its resistor carries no current." }),
    Object.freeze({ short: "Reduce", title: "Read three parallel routes", copy: "What remains is R in parallel with two identical 2R series routes from A to B." }),
  ]);
  const hints = Object.freeze([
    "Imagine reflecting the network across the line through terminals A and B. Vertices C and D exchange places, but the circuit is unchanged.",
    "The unique electrical solution must share that symmetry, so VC=VD. Hence ICD=(VC−VD)/R=0.",
    "Remove the zero-current CD branch. From A to B there is now one route of resistance R and two routes of resistance 2R.",
    "Add the three parallel conductances: 1/Req=1/R+1/(2R)+1/(2R).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p92-reset">Reset</button>';

  const initialState = () => ({
    resistance: CHALLENGE_RESISTANCE,
    stage: 0,
    answer: "",
    feedback: "",
    feedbackTone: "neutral",
    committed: false,
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeAnswer(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9./+\-\s]/g, "").slice(0, 18);
  }

  function parseAnswer(value) {
    const cleaned = sanitizeAnswer(value).trim();
    if (/^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return Number(cleaned);
    const match = cleaned.match(/^([+\-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+\-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (!match) return NaN;
    const denominator = Number(match[2]);
    return denominator === 0 ? NaN : Number(match[1]) / denominator;
  }

  function networkValues(resistance = state.resistance) {
    const middlePotential = SUPPLY_VOLTS / 2;
    const directCurrent = SUPPLY_VOLTS / resistance;
    const sideCurrent = SUPPLY_VOLTS / (2 * resistance);
    const totalCurrent = directCurrent + 2 * sideCurrent;
    const equivalentResistance = SUPPLY_VOLTS / totalCurrent;
    const sourcePower = SUPPLY_VOLTS * totalCurrent;
    const resistorPower = SUPPLY_VOLTS ** 2 / resistance + 4 * middlePotential ** 2 / resistance;
    return {
      potentialA: SUPPLY_VOLTS,
      potentialB: 0,
      potentialC: middlePotential,
      potentialD: middlePotential,
      directCurrent,
      sideCurrent,
      crossCurrent: 0,
      totalCurrent,
      equivalentResistance,
      sourcePower,
      resistorPower,
    };
  }

  function reconstructionNote() {
    return `<p class="p92-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This symmetric-network exercise is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p92-stage-controls" role="group" aria-label="Tetrahedral network reduction stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p92-stage" data-p92-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p92-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p92-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Network reduced" : "Next stage"}</button></div>`;
  }

  function pointAlong(start, end, fraction) {
    return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction };
  }

  function resistorEdge(start, end, options = {}) {
    const centre = options.centre ?? 0.5;
    const span = options.span ?? 0.24;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const nx = -dy / length;
    const ny = dx / length;
    const leadIn = pointAlong(start, end, centre - span / 2);
    const leadOut = pointAlong(start, end, centre + span / 2);
    const points = [leadIn];
    const teeth = 8;
    for (let index = 1; index < teeth; index += 1) {
      const fraction = index / teeth;
      const base = pointAlong(leadIn, leadOut, fraction);
      const offset = (index % 2 ? 1 : -1) * 7;
      points.push({ x: base.x + nx * offset, y: base.y + ny * offset });
    }
    points.push(leadOut);
    const path = [`M${format(start.x, 2)} ${format(start.y, 2)}`, `L${format(leadIn.x, 2)} ${format(leadIn.y, 2)}`, ...points.slice(1).map((point) => `L${format(point.x, 2)} ${format(point.y, 2)}`), `L${format(end.x, 2)} ${format(end.y, 2)}`].join(" ");
    const arrowStart = pointAlong(start, end, options.arrowStart ?? 0.12);
    const arrowEnd = pointAlong(start, end, options.arrowEnd ?? 0.21);
    return `<g class="p92-edge ${options.className || ""}"><path class="p92-resistor" d="${path}"/><text class="p92-r-label" x="${options.labelX}" y="${options.labelY}" text-anchor="middle">R</text>${options.currentLabel ? `<g class="p92-current-mark"><line x1="${format(arrowStart.x, 2)}" y1="${format(arrowStart.y, 2)}" x2="${format(arrowEnd.x, 2)}" y2="${format(arrowEnd.y, 2)}" marker-end="url(#p92-current-arrow)"/><text x="${options.currentX}" y="${options.currentY}" text-anchor="middle">${options.currentLabel}</text></g>` : ""}</g>`;
  }

  function nodeMarkup(name, point, potential, className) {
    return `<g class="p92-node ${className}" transform="translate(${point.x} ${point.y})"><circle r="28"/><text class="p92-node-name" y="-3" text-anchor="middle">${name}</text><text class="p92-node-potential" y="13" text-anchor="middle">${format(potential, 1)} V</text></g>`;
  }

  function networkSvg() {
    const values = networkValues();
    const A = { x: 84, y: 250 };
    const B = { x: 636, y: 250 };
    const C = { x: 360, y: 72 };
    const D = { x: 360, y: 428 };
    const sideLabel = `${format(values.sideCurrent, 3)} A`;
    const directLabel = `${format(values.directCurrent, 3)} A`;
    return `<svg class="p92-svg p92-stage-${state.stage}" viewBox="0 0 720 500" role="img" aria-labelledby="p92-svg-title p92-svg-desc">
      <title id="p92-svg-title">Six equal resistors connecting four tetrahedron vertices</title>
      <desc id="p92-svg-desc">Terminals A and B are held at 12 and 0 volts. Vertices C and D are both at 6 volts. The CD resistor carries zero current. With each resistor ${format(state.resistance, 0)} ohms, total current is ${format(values.totalCurrent, 3)} amperes and equivalent resistance is ${format(values.equivalentResistance, 3)} ohms.</desc>
      <defs><marker id="p92-current-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p92-symmetry-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p92-board" x="1" y="1" width="718" height="498" rx="20"/>
      <g class="p92-network">
        ${resistorEdge(A, C, { className: "p92-side-edge", labelX: 207, labelY: 132, currentLabel: sideLabel, currentX: 146, currentY: 177 })}
        ${resistorEdge(C, B, { className: "p92-side-edge", labelX: 513, labelY: 132, currentLabel: sideLabel, currentX: 574, currentY: 177 })}
        ${resistorEdge(A, D, { className: "p92-side-edge", labelX: 207, labelY: 383, currentLabel: sideLabel, currentX: 146, currentY: 337 })}
        ${resistorEdge(D, B, { className: "p92-side-edge", labelX: 513, labelY: 383, currentLabel: sideLabel, currentX: 574, currentY: 337 })}
        ${resistorEdge(A, B, { className: "p92-direct-edge", centre: 0.31, span: 0.18, labelX: 255, labelY: 232, currentLabel: directLabel, currentX: 160, currentY: 236, arrowStart: 0.11, arrowEnd: 0.19 })}
        ${resistorEdge(C, D, { className: "p92-cross-edge", centre: 0.28, span: 0.2, labelX: 382, labelY: 178, currentLabel: "0 A", currentX: 383, currentY: 333, arrowStart: 0.66, arrowEnd: 0.66 })}
        <circle class="p92-crossing-gap" cx="360" cy="250" r="9"/>
        <path class="p92-crossing-wire" d="M360 237V263"/>
        ${nodeMarkup("A", A, values.potentialA, "is-high")}${nodeMarkup("B", B, values.potentialB, "is-low")}${nodeMarkup("C", C, values.potentialC, "is-middle")}${nodeMarkup("D", D, values.potentialD, "is-middle")}
        <text class="p92-terminal-label" x="42" y="304">source +</text><text class="p92-terminal-label" x="678" y="304" text-anchor="end">return −</text>
      </g>
      <g class="p92-symmetry-layer"><line x1="360" y1="116" x2="360" y2="384" marker-start="url(#p92-symmetry-arrow)" marker-end="url(#p92-symmetry-arrow)"/><rect x="250" y="223" width="220" height="53" rx="12"/><text x="360" y="245" text-anchor="middle">swap C ↔ D</text><text class="p92-layer-note" x="360" y="263" text-anchor="middle">same circuit · same potential</text></g>
      <g class="p92-zero-layer"><rect x="256" y="222" width="208" height="56" rx="12"/><text x="360" y="245" text-anchor="middle">VC−VD=0 V</text><text class="p92-layer-note" x="360" y="264" text-anchor="middle">therefore ICD=0 A</text></g>
      <g class="p92-reduction-layer"><rect x="134" y="183" width="452" height="134" rx="18"/><text class="p92-reduction-kicker" x="360" y="213" text-anchor="middle">THREE ROUTES IN PARALLEL</text><text class="p92-reduction-routes" x="360" y="252" text-anchor="middle">R &nbsp; ∥ &nbsp; 2R &nbsp; ∥ &nbsp; 2R</text><text class="p92-reduction-equation" x="360" y="286" text-anchor="middle">1/Req = 1/R + 1/(2R) + 1/(2R) = 2/R</text><text class="p92-reduction-result" x="360" y="307" text-anchor="middle">Req = R/2 = ${format(values.equivalentResistance, 2)} Ω</text></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = networkValues();
    return `<section class="p92-metrics" aria-live="polite"><div><span>Hidden-node potentials</span><strong>VC=VD=${format(values.potentialC, 1)} V</strong></div><div><span>Total source current</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.totalCurrent, 3)} A` : "stage 2"}</strong></div><div><span>Equivalent resistance</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.equivalentResistance, 3)} Ω` : "stage 3"}</strong></div></section>`;
  }

  function controlsMarkup() {
    return `<section class="p92-controls" aria-label="Equal resistor control"><label for="p92-resistance"><span>Common resistance R<output data-p92-output>${format(state.resistance, 0)} Ω</output></span><input id="p92-resistance" type="range" min="1" max="100" step="1" value="${state.resistance}"/></label><p>The ideal source remains fixed at ${SUPPLY_VOLTS} V. Changing R rescales every current while the two middle potentials remain equal.</p></section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    return state.hintsUsed ? `<div class="hint-stack p92-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : "";
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p92-solution" aria-labelledby="p92-solution-heading"><h3 id="p92-solution-heading" tabindex="-1">Make symmetry do the calculation</h3><p>Set VA=V and VB=0. Kirchhoff’s current law at C and D gives</p><div class="p92-equation">3VC−VA−VB−VD=0<br>3VD−VA−VB−VC=0</div><p>Subtracting the equations gives 4(VC−VD)=0, so VC=VD. Their connecting resistor has zero voltage and zero current. Each middle potential is V/2.</p><p>The source current is therefore</p><div class="p92-equation">I=(V−0)/R +(V−V/2)/R +(V−V/2)/R<br>I=2V/R</div><div class="p92-equation p92-answer-equation">Req=V/I=R/2 &nbsp;⇒&nbsp; k=1/2</div><p class="p92-checks"><strong>Checks.</strong> Scaling every resistor by λ scales Req by λ, so k is dimensionless. As R→∞, all currents tend to zero and Req→∞; as R→0 in the ideal model, Req→0. The power supplied, 2V²/R, equals the power in the six resistors: V²/R in AB, another V²/R across the four side resistors, and zero in CD. Finally, V/A has units of ohms.</p></section>`;
  }

  function snapshot() {
    const values = networkValues();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: "title and difficulty only",
      commonResistanceOhms: state.resistance,
      supplyVolts: SUPPLY_VOLTS,
      nodePotentialsVolts: { A: values.potentialA, B: values.potentialB, C: values.potentialC, D: values.potentialD },
      edgeCurrentsAmperes: { AB: Number(values.directCurrent.toFixed(8)), AC: Number(values.sideCurrent.toFixed(8)), AD: Number(values.sideCurrent.toFixed(8)), CB: Number(values.sideCurrent.toFixed(8)), DB: Number(values.sideCurrent.toFixed(8)), CD: 0 },
      totalCurrentAmperes: Number(values.totalCurrent.toFixed(8)),
      equivalentResistanceOhms: Number(values.equivalentResistance.toFixed(8)),
      powerBalanceWatts: { source: Number(values.sourcePower.toFixed(8)), resistors: Number(values.resistorPower.toFixed(8)) },
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p92-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circuits</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p92-spread"><article class="book-page p92-problem-page"><div class="problem-number">Problem 9.2</div><h1 class="book-title p92-title">Resistor tetrahedron</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">Four vertices A, B, C and D are joined in every possible pair by six identical resistors, each of resistance R. A source is connected across A and B.</p><p class="problem-copy"><strong>Find the equivalent resistance between A and B in the form Req=kR.</strong></p><section class="p92-observation-card"><strong>The useful move</strong><p>Do not start by combining arbitrary neighbours. First ask what the circuit’s C↔D symmetry says about their electrical potentials.</p></section><section class="p92-model-card"><div class="eyebrow">Interactive model</div><p>The diagram uses an ideal ${SUPPLY_VOLTS} V test source. This fixes readable currents but does not affect the equivalent-resistance ratio.</p></section></article><section class="book-page book-stage p92-stage">${stageControls()}<div class="p92-visual-card"><div data-p92-svg-slot>${networkSvg()}</div>${stageCaption()}</div>${controlsMarkup()}<div data-p92-metrics-slot>${metricsMarkup()}</div></section><aside class="book-page book-coach p92-coach"><div class="coach-kicker">Reduce by symmetry</div><p class="coach-question">What exact coefficient k makes Req=kR?</p><form class="p92-answer-form" data-p92-answer-form novalidate><label for="p92-answer">Coefficient k</label><div><input id="p92-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal" autocomplete="off"/><span>× R</span></div><button class="primary-button" type="submit">Check coefficient</button></form>${feedbackMarkup()}<div class="button-row p92-help-row"><button class="secondary-button" type="button" data-problem-action="p92-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p92-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p92-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p92-shell");
    if (!root) return;
    const svgSlot = root.querySelector("[data-p92-svg-slot]");
    const metricsSlot = root.querySelector("[data-p92-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = networkSvg();
    if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const output = root.querySelector("[data-p92-output]");
    if (output) output.textContent = `${format(state.resistance, 0)} Ω`;
    const values = networkValues();
    root.querySelector("#p92-resistance")?.setAttribute("aria-valuetext", `${format(state.resistance, 0)} ohms each; total current ${format(values.totalCurrent, 3)} amperes; equivalent resistance ${format(values.equivalentResistance, 3)} ohms`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p92-reset") {
        state = initialState();
        renderAndFocus(renderApp, "#p92-resistance");
        return;
      }
      if (action === "p92-stage") {
        state.stage = clamp(Number(control.dataset.p92Stage), 0, 2);
        renderAndFocus(renderApp, `[data-p92-stage="${state.stage}"]`);
        return;
      }
      if (action === "p92-next-stage") {
        state.stage = Math.min(2, state.stage + 1);
        renderAndFocus(renderApp, `[data-p92-stage="${state.stage}"]`);
        return;
      }
      if (action === "p92-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p92-reveal") {
        state.revealed = true;
        state.stage = 2;
      }
      renderApp();
      if (action === "p92-reveal") window.requestAnimationFrame(() => document.querySelector("#p92-solution-heading")?.focus());
    }));
    document.querySelector("#p92-resistance")?.addEventListener("input", (event) => {
      state.resistance = clamp(Number(event.target.value), 1, 100);
      updateDynamicDom();
    });
    const answerInput = document.querySelector("#p92-answer");
    answerInput?.addEventListener("input", (event) => {
      state.answer = sanitizeAnswer(event.target.value);
    });
    document.querySelector("[data-p92-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = sanitizeAnswer(answerInput?.value).trim();
      const answer = parseAnswer(state.answer);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one coefficient as a fraction or decimal, such as 2/3 or 0.6.";
      else if (Math.abs(answer - 2) <= 1e-10) state.feedback = "That is the total conductance coefficient: 1/Req=2/R. Invert it to obtain the resistance coefficient.";
      else if (Math.abs(answer - 0.5) > 1e-10) state.feedback = "Use C↔D symmetry first. After deleting the zero-current edge, add the conductances of R, 2R and 2R.";
      else {
        state.feedbackTone = "success";
        state.committed = true;
        state.stage = 2;
        state.feedback = `Correct: k=1/2, so Req=R/2. At the displayed R=${format(state.resistance, 0)} Ω, the equivalent resistance is ${format(state.resistance / 2, 2)} Ω.`;
      }
      renderAndFocus(renderApp, "#p92-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
