(function registerResistorCubePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "9.4";
  const SUPPLY_VOLTS = 1;
  const CHALLENGE_RESISTANCE = 12;
  const VERTICES = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);
  const EDGES = Object.freeze([
    Object.freeze({ u: 0, v: 1, name: "AB", kind: "front", labelDx: 0, labelDy: 23 }),
    Object.freeze({ u: 1, v: 2, name: "BC", kind: "front", labelDx: 25, labelDy: 0 }),
    Object.freeze({ u: 2, v: 3, name: "CD", kind: "front", labelDx: 0, labelDy: -17 }),
    Object.freeze({ u: 3, v: 0, name: "DA", kind: "front", labelDx: -25, labelDy: 0 }),
    Object.freeze({ u: 4, v: 5, name: "EF", kind: "back", labelDx: 0, labelDy: 23 }),
    Object.freeze({ u: 5, v: 6, name: "FG", kind: "back", labelDx: 25, labelDy: 0 }),
    Object.freeze({ u: 6, v: 7, name: "GH", kind: "back", labelDx: 0, labelDy: -17 }),
    Object.freeze({ u: 7, v: 4, name: "HE", kind: "back", labelDx: -25, labelDy: 0 }),
    Object.freeze({ u: 0, v: 4, name: "AE", kind: "depth", labelDx: -4, labelDy: 21 }),
    Object.freeze({ u: 1, v: 5, name: "BF", kind: "depth", labelDx: 4, labelDy: 21 }),
    Object.freeze({ u: 2, v: 6, name: "CG", kind: "depth", labelDx: 4, labelDy: -16 }),
    Object.freeze({ u: 3, v: 7, name: "DH", kind: "depth", labelDx: -4, labelDy: -16 }),
  ]);
  const PAIRS = Object.freeze({
    adjacent: Object.freeze({ source: 0, sink: 1, short: "Adjacent", label: "Adjacent vertices A–B", fraction: "7/12", coefficient: 7 / 12 }),
    face: Object.freeze({ source: 0, sink: 2, short: "Face diagonal", label: "Face diagonal A–C", fraction: "3/4", coefficient: 3 / 4 }),
    body: Object.freeze({ source: 0, sink: 6, short: "Body diagonal", label: "Body diagonal A–G", fraction: "5/6", coefficient: 5 / 6 }),
  });
  const stages = Object.freeze([
    Object.freeze({ short: "Terminals", title: "Choose the surviving geometry", copy: "Adjacent, face-diagonal and body-diagonal terminal pairs preserve different cube symmetries." }),
    Object.freeze({ short: "Classes", title: "Collapse equal-potential vertices", copy: "Vertices in the same symmetry orbit share a potential. The live nodal solution colours and groups those classes." }),
    Object.freeze({ short: "Equivalent", title: "Sum the source-edge currents", copy: "With a 1 V test source, the reciprocal of total current is the equivalent resistance in ohms." }),
  ]);
  const hints = Object.freeze([
    "For the body diagonal A–G, rotations about that diagonal exchange B, D and E, and separately exchange C, F and H.",
    "Call the potential of B,D,E equal to xV and that of C,F,H equal to yV. Set VA=V and VG=0.",
    "KCL at one near vertex and one far vertex gives 3x−2y=1 and 3y−2x=0.",
    "Solve x=3/5 and y=2/5. Each of the three source edges then carries 2V/(5R).",
    "The total current is 6V/(5R), so Req=V/I=5R/6.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p94-reset">Reset</button>';

  const initialState = () => ({ pair: "body", resistance: CHALLENGE_RESISTANCE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function fixed(value, digits = 3) { return Number.isFinite(value) ? value.toFixed(digits) : "—"; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeAnswer(value) { return String(value).replaceAll("−", "-").replace(/[^0-9./+\-\s]/g, "").slice(0, 18); }
  function parseAnswer(value) {
    const cleaned = sanitizeAnswer(value).trim();
    if (/^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return Number(cleaned);
    const match = cleaned.match(/^([+\-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+\-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (!match) return NaN;
    const denominator = Number(match[2]);
    return denominator === 0 ? NaN : Number(match[1]) / denominator;
  }

  function solveAugmented(matrix) {
    const size = matrix.length;
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
      if (Math.abs(matrix[pivot][column]) < 1e-12) throw new Error("Singular cube nodal system");
      [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
      const divisor = matrix[column][column];
      for (let entry = column; entry <= size; entry += 1) matrix[column][entry] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === column) continue;
        const factor = matrix[row][column];
        for (let entry = column; entry <= size; entry += 1) matrix[row][entry] -= factor * matrix[column][entry];
      }
    }
    return matrix.map((row) => row[size]);
  }

  function solveNetwork(pairKey = state.pair, resistance = state.resistance) {
    const pair = PAIRS[pairKey];
    const unknown = VERTICES.map((_, index) => index).filter((index) => index !== pair.source && index !== pair.sink);
    const conductance = 1 / resistance;
    const matrix = unknown.map(() => Array(unknown.length + 1).fill(0));
    unknown.forEach((vertex, row) => {
      EDGES.filter((edge) => edge.u === vertex || edge.v === vertex).forEach((edge) => {
        const neighbour = edge.u === vertex ? edge.v : edge.u;
        matrix[row][row] += conductance;
        if (neighbour === pair.source) matrix[row][unknown.length] += conductance * SUPPLY_VOLTS;
        else if (neighbour !== pair.sink) matrix[row][unknown.indexOf(neighbour)] -= conductance;
      });
    });
    const solvedUnknowns = solveAugmented(matrix);
    const potentials = Array(VERTICES.length).fill(0);
    potentials[pair.source] = SUPPLY_VOLTS;
    potentials[pair.sink] = 0;
    unknown.forEach((vertex, index) => { potentials[vertex] = solvedUnknowns[index]; });
    const edgeCurrents = EDGES.map((edge) => (potentials[edge.u] - potentials[edge.v]) / resistance);
    const totalCurrent = EDGES.reduce((sum, edge, index) => {
      if (edge.u === pair.source) return sum + edgeCurrents[index];
      if (edge.v === pair.source) return sum - edgeCurrents[index];
      return sum;
    }, 0);
    const equivalentResistance = SUPPLY_VOLTS / totalCurrent;
    const resistorPower = EDGES.reduce((sum, edge) => sum + (potentials[edge.u] - potentials[edge.v]) ** 2 / resistance, 0);
    return { pair, potentials, edgeCurrents, totalCurrent, equivalentResistance, coefficient: equivalentResistance / resistance, sourcePower: SUPPLY_VOLTS * totalCurrent, resistorPower };
  }

  function potentialClasses(values = solveNetwork()) {
    const levels = [];
    values.potentials.forEach((potential, vertex) => {
      let level = levels.find((candidate) => Math.abs(candidate.potential - potential) < 1e-9);
      if (!level) { level = { potential, vertices: [] }; levels.push(level); }
      level.vertices.push(vertex);
    });
    levels.sort((left, right) => right.potential - left.potential);
    return levels;
  }

  function classIndexFor(vertex, values, classes) {
    return classes.findIndex((level) => Math.abs(level.potential - values.potentials[vertex]) < 1e-9);
  }

  function reconstructionNote() {
    return `<p class="p94-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and three-star difficulty. This cube-network investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p94-stage-controls" role="group" aria-label="Cube network solution stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p94-stage" data-p94-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p94-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p94-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Resistance resolved" : "Next stage"}</button></div>`;
  }

  function pointAlong(start, end, fraction) { return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction }; }

  function resistorPath(start, end) {
    const leadIn = pointAlong(start, end, 0.37);
    const leadOut = pointAlong(start, end, 0.63);
    const dx = end.x - start.x, dy = end.y - start.y, length = Math.hypot(dx, dy), nx = -dy / length, ny = dx / length;
    const points = [leadIn];
    for (let index = 1; index < 8; index += 1) {
      const base = pointAlong(leadIn, leadOut, index / 8), offset = (index % 2 ? 1 : -1) * 6;
      points.push({ x: base.x + nx * offset, y: base.y + ny * offset });
    }
    points.push(leadOut);
    return [`M${format(start.x, 2)} ${format(start.y, 2)}`, `L${format(leadIn.x, 2)} ${format(leadIn.y, 2)}`, ...points.slice(1).map((point) => `L${format(point.x, 2)} ${format(point.y, 2)}`), `L${format(end.x, 2)} ${format(end.y, 2)}`].join(" ");
  }

  function formatCurrent(current) {
    const magnitude = Math.abs(current);
    if (magnitude < 1e-10) return "0 A";
    if (magnitude < 0.1) return `${format(magnitude * 1000, 1)} mA`;
    return `${format(magnitude, 3)} A`;
  }

  function edgeMarkup(edge, current, points) {
    const u = points[edge.u], v = points[edge.v], midpoint = pointAlong(u, v, 0.5);
    const from = current >= 0 ? u : v, to = current >= 0 ? v : u;
    const arrowStart = pointAlong(from, to, 0.13), arrowEnd = pointAlong(from, to, 0.25);
    const zero = Math.abs(current) < 1e-10;
    return `<g class="p94-edge is-${edge.kind} ${zero ? "is-zero" : ""}"><path class="p94-resistor" d="${resistorPath(u, v)}"/><g class="p94-current-mark">${zero ? `<line class="p94-zero-tick" x1="${format(midpoint.x - 5, 2)}" y1="${format(midpoint.y - 5, 2)}" x2="${format(midpoint.x + 5, 2)}" y2="${format(midpoint.y + 5, 2)}"/>` : `<line x1="${format(arrowStart.x, 2)}" y1="${format(arrowStart.y, 2)}" x2="${format(arrowEnd.x, 2)}" y2="${format(arrowEnd.y, 2)}" marker-end="url(#p94-current-arrow)"/>`}<text x="${format(midpoint.x + edge.labelDx, 2)}" y="${format(midpoint.y + edge.labelDy, 2)}" text-anchor="middle">${edge.name} ${formatCurrent(current)}</text></g></g>`;
  }

  function nodeMarkup(vertex, point, values, classes) {
    const pair = values.pair;
    const potential = values.potentials[vertex];
    const terminalClass = vertex === pair.source ? "is-source" : vertex === pair.sink ? "is-sink" : "";
    const classIndex = classIndexFor(vertex, values, classes);
    return `<g class="p94-node is-class-${classIndex} ${terminalClass}" transform="translate(${point.x} ${point.y})"><circle r="25"/><text class="p94-node-name" y="-3" text-anchor="middle">${VERTICES[vertex]}</text><text class="p94-node-potential" y="12" text-anchor="middle">${fixed(potential, 3)} V</text></g>`;
  }

  function classSummary(values, classes) {
    return classes.map((level) => `${level.vertices.map((vertex) => VERTICES[vertex]).join(",")}: ${fixed(level.potential, 3)} V`).join(" · ");
  }

  function networkSvg() {
    const values = solveNetwork();
    const classes = potentialClasses(values);
    const points = [
      { x: 145, y: 330 }, { x: 430, y: 330 }, { x: 430, y: 105 }, { x: 145, y: 105 },
      { x: 280, y: 395 }, { x: 565, y: 395 }, { x: 565, y: 170 }, { x: 280, y: 170 },
    ];
    const orderedEdges = [...EDGES.filter((edge) => edge.kind === "back"), ...EDGES.filter((edge) => edge.kind === "depth"), ...EDGES.filter((edge) => edge.kind === "front")];
    const statusValue = state.stage === 0 ? values.pair.label : state.stage === 1 ? `${classes.length} potential classes` : `Req=${values.pair.fraction}R=${format(values.equivalentResistance, 3)} Ω`;
    return `<svg class="p94-svg p94-stage-${state.stage}" viewBox="0 0 720 500" role="img" aria-labelledby="p94-svg-title p94-svg-desc">
      <title id="p94-svg-title">Cube made from twelve equal edge resistors</title>
      <desc id="p94-svg-desc">A 1 volt test source is connected between ${values.pair.label.toLowerCase()}. Each edge has resistance ${format(state.resistance, 0)} ohms. Nodal analysis gives ${classes.length} potential classes, total current ${format(values.totalCurrent, 6)} amperes and equivalent resistance ${format(values.equivalentResistance, 6)} ohms, equal to ${values.pair.fraction} R.</desc>
      <defs><marker id="p94-current-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p94-board" x="1" y="1" width="718" height="498" rx="20"/>
      <g class="p94-status" transform="translate(20 19)"><rect width="286" height="57" rx="12"/><text class="p94-status-kicker" x="15" y="21">${state.stage === 0 ? "SELECTED TERMINALS" : state.stage === 1 ? "NODAL SYMMETRY" : "SOLVED NETWORK"}</text><text class="p94-status-value" x="15" y="43">${statusValue}</text></g>
      <g class="p94-network">${orderedEdges.map((edge) => edgeMarkup(edge, values.edgeCurrents[EDGES.indexOf(edge)], points)).join("")}${VERTICES.map((_, vertex) => nodeMarkup(vertex, points[vertex], values, classes)).join("")}</g>
      <g class="p94-terminal-tags"><text x="${points[values.pair.source].x}" y="${points[values.pair.source].y + 42}" text-anchor="middle">SOURCE +1 V</text><text x="${points[values.pair.sink].x}" y="${points[values.pair.sink].y + 42}" text-anchor="middle">SINK 0 V</text></g>
      <text class="p94-legend" x="694" y="476" text-anchor="end">each zigzag = R ${state.stage >= 2 ? "· arrows show conventional current" : ""}</text>
    </svg>`;
  }

  function classStripMarkup() {
    const values = solveNetwork(), classes = potentialClasses(values);
    return `<section class="p94-class-strip" aria-live="polite"><strong>Potential classes</strong><span>${state.stage >= 1 || state.revealed ? classSummary(values, classes) : "Advance to stage 2 to reveal the equal-potential groups."}</span></section>`;
  }

  function metricsMarkup() {
    const values = solveNetwork(), classes = potentialClasses(values);
    return `<section class="p94-metrics" aria-live="polite"><div><span>Symmetry classes</span><strong>${state.stage >= 1 || state.revealed ? classes.length : "stage 2"}</strong></div><div><span>Total test current</span><strong>${state.stage >= 2 || state.revealed ? formatCurrent(values.totalCurrent) : "stage 3"}</strong></div><div><span>Equivalent resistance</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.equivalentResistance, 3)} Ω · ${values.pair.fraction}R` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p94-dynamic">${networkSvg()}${classStripMarkup()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p94-controls" aria-label="Cube resistor controls"><div class="p94-pair-picker" role="group" aria-label="Select terminal separation">${Object.entries(PAIRS).map(([key, pair]) => `<button class="chip-button ${state.pair === key ? "active" : ""}" type="button" data-problem-action="p94-pair" data-p94-pair="${key}" aria-pressed="${state.pair === key}">${pair.short}</button>`).join("")}</div><label for="p94-resistance"><span>Common edge resistance R<output data-p94-output>${format(state.resistance, 0)} Ω</output></span><input id="p94-resistance" type="range" min="1" max="100" step="1" value="${state.resistance}"/></label><p>The 1 V test source stays fixed. Terminal geometry changes the coefficient; changing R rescales resistance and every current.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p94-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p94-solution" aria-labelledby="p94-solution-heading"><h3 id="p94-solution-heading" tabindex="-1">Rotate the cube around its diagonal</h3><p>For the body diagonal A–G, the three vertices B,D,E form one symmetry class at potential xV. Vertices C,F,H form another at yV. Set VA=V and VG=0.</p><p>KCL at one representative of each class gives</p><div class="p94-equation">(x−1)+2(x−y)=0 &nbsp;⇒&nbsp; 3x−2y=1<br>y+2(y−x)=0 &nbsp;⇒&nbsp; 3y−2x=0</div><div class="p94-equation">x=3/5, &nbsp; y=2/5</div><p>Each of the three edges leaving A carries (1−3/5)V/R=2V/(5R), so</p><div class="p94-equation">I=3×2V/(5R)=6V/(5R)</div><div class="p94-equation p94-answer-equation">Req=V/I=5R/6 &nbsp;⇒&nbsp; k=5/6</div><p>The general nodal solver independently gives 7R/12 for adjacent terminals, 3R/4 across a face diagonal, and 5R/6 across a body diagonal.</p><p class="p94-checks"><strong>Checks.</strong> Multiplying every edge resistance by λ multiplies Req by λ, so each displayed coefficient is dimensionless. As R→∞ the edges open, current tends to zero and Req→∞. As R→0 the ideal edges short, Req→0 and test current diverges. For every selection, source power VI equals Σ(ΔV)²/R over all twelve edges, and V/A has units of ohms.</p></section>`;
  }

  function snapshot() {
    const values = solveNetwork(), classes = potentialClasses(values);
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", terminalPair: state.pair, sourceVertex: VERTICES[values.pair.source], sinkVertex: VERTICES[values.pair.sink], commonEdgeResistanceOhms: state.resistance, supplyVolts: SUPPLY_VOLTS, potentialsVolts: Object.fromEntries(VERTICES.map((name, vertex) => [name, Number(values.potentials[vertex].toFixed(9))])), potentialClasses: classes.map((level) => ({ vertices: level.vertices.map((vertex) => VERTICES[vertex]), potentialVolts: Number(level.potential.toFixed(9)) })), edgeCurrentsAmperes: Object.fromEntries(EDGES.map((edge, index) => [edge.name, Number(values.edgeCurrents[index].toFixed(9))])), totalCurrentAmperes: Number(values.totalCurrent.toFixed(9)), equivalentResistanceOhms: Number(values.equivalentResistance.toFixed(9)), coefficient: Number(values.coefficient.toFixed(9)), expectedCoefficient: values.pair.fraction, powerBalanceWatts: { source: Number(values.sourcePower.toFixed(9)), resistors: Number(values.resistorPower.toFixed(9)) }, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p94-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circuits</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p94-spread"><article class="book-page p94-problem-page"><div class="problem-number">Problem 9.4</div><h1 class="book-title p94-title">Resistor cube</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${reconstructionNote()}<p class="problem-copy">Every edge of a cube contains the same resistance R. A source is connected between two opposite vertices at the ends of a body diagonal.</p><p class="problem-copy"><strong>Find the equivalent resistance in the form Req=kR.</strong></p><section class="p94-observation-card"><strong>The three geometries</strong><p>The laboratory also lets you move the terminals to adjacent vertices or opposite corners of one face. Watch which vertices remain electrically interchangeable.</p></section><section class="p94-model-card"><div class="eyebrow">Nodal model</div><p>An ideal 1 V test source fixes terminal potentials. Kirchhoff’s current law determines all six remaining node potentials without assuming the answer.</p></section></article><section class="book-page book-stage p94-stage">${stageControls()}<div class="p94-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p94-coach"><div class="coach-kicker">Exploit the diagonal</div><p class="coach-question">For opposite vertices A and G, what exact coefficient k makes Req=kR?</p><form class="p94-answer-form" data-p94-answer-form novalidate><label for="p94-answer">Body-diagonal coefficient k</label><div><input id="p94-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="fraction or decimal" autocomplete="off"/><span>× R</span></div><button class="primary-button" type="submit">Check coefficient</button></form>${feedbackMarkup()}<div class="button-row p94-help-row"><button class="secondary-button" type="button" data-problem-action="p94-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p94-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p94-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p94-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p94-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const output = root.querySelector("[data-p94-output]");
    if (output) output.textContent = `${format(state.resistance, 0)} Ω`;
    const values = solveNetwork();
    root.querySelector("#p94-resistance")?.setAttribute("aria-valuetext", `${format(state.resistance, 0)} ohms per edge; ${values.pair.label}; equivalent resistance ${format(values.equivalentResistance, 3)} ohms`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p94-reset") { state = initialState(); renderAndFocus(renderApp, "#p94-resistance"); return; }
      if (action === "p94-stage") { state.stage = clamp(Number(control.dataset.p94Stage), 0, 2); renderAndFocus(renderApp, `[data-p94-stage="${state.stage}"]`); return; }
      if (action === "p94-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p94-stage="${state.stage}"]`); return; }
      if (action === "p94-pair") { state.pair = PAIRS[control.dataset.p94Pair] ? control.dataset.p94Pair : "body"; renderAndFocus(renderApp, `[data-p94-pair="${state.pair}"]`); return; }
      if (action === "p94-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p94-reveal") { state.revealed = true; state.stage = 2; state.pair = "body"; }
      renderApp();
      if (action === "p94-reveal") window.requestAnimationFrame(() => document.querySelector("#p94-solution-heading")?.focus());
    }));
    document.querySelector("#p94-resistance")?.addEventListener("input", (event) => { state.resistance = clamp(Number(event.target.value), 1, 100); updateDynamicDom(); });
    const answerInput = document.querySelector("#p94-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeAnswer(event.target.value); });
    document.querySelector("[data-p94-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeAnswer(answerInput?.value).trim(); const answer = parseAnswer(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one body-diagonal coefficient as a fraction or decimal.";
      else if (Math.abs(answer - 6 / 5) <= 1e-10) state.feedback = "That is the total-current coefficient in I=6V/(5R). Invert it to obtain the resistance coefficient.";
      else if (Math.abs(answer - 5 / 6) > 1e-10) state.feedback = "Group the six internal vertices into the two three-vertex symmetry classes, solve their two KCL equations, then sum the three currents leaving A.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.pair = "body"; state.feedback = `Correct: k=5/6. With R=${format(state.resistance, 0)} Ω per edge, the body-diagonal equivalent resistance is ${format(5 * state.resistance / 6, 3)} Ω.`; }
      renderAndFocus(renderApp, "#p94-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
