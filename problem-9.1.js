(function registerResistorPyramidPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "9.1";
  const TEST_VOLTAGE = 1;
  const QUESTION_RESISTANCE = 12;
  const nodeNames = Object.freeze(["A", "B", "C", "D", "E"]);
  const nodePoints = Object.freeze({
    A: Object.freeze({ x: 108, y: 356 }),
    B: Object.freeze({ x: 334, y: 404 }),
    C: Object.freeze({ x: 624, y: 344 }),
    D: Object.freeze({ x: 360, y: 270 }),
    E: Object.freeze({ x: 354, y: 68 }),
  });
  const edges = Object.freeze([
    Object.freeze({ id: "AB", a: "A", b: "B", family: "base" }),
    Object.freeze({ id: "BC", a: "B", b: "C", family: "base" }),
    Object.freeze({ id: "CD", a: "C", b: "D", family: "base" }),
    Object.freeze({ id: "DA", a: "D", b: "A", family: "base" }),
    Object.freeze({ id: "AE", a: "A", b: "E", family: "side" }),
    Object.freeze({ id: "BE", a: "B", b: "E", family: "side" }),
    Object.freeze({ id: "CE", a: "C", b: "E", family: "side" }),
    Object.freeze({ id: "DE", a: "D", b: "E", family: "side" }),
  ]);
  const terminalCases = Object.freeze({
    opposite: Object.freeze({
      label: "Opposite base A–C",
      short: "Opposite A–C",
      source: "A",
      sink: "C",
      formula: "2RᵦRₛ / (Rᵦ + 2Rₛ)",
      reduction: "B, D and E are equipotential at 0.500 V. Merge them conceptually: the active routes are A–B–C, A–D–C and A–E–C.",
    }),
    adjacent: Object.freeze({
      label: "Adjacent base A–B",
      short: "Adjacent A–B",
      source: "A",
      sink: "B",
      formula: "2RᵦRₛ(Rᵦ + 3Rₛ) / [(Rᵦ + 2Rₛ)(Rᵦ + 4Rₛ)]",
      reduction: "The inversion symmetry fixes E at 0.500 V and makes V(C) + V(D) = 1.000 V. C and D are complementary, not equipotential.",
    }),
    apex: Object.freeze({
      label: "Apex-to-base E–A",
      short: "Apex E–A",
      source: "E",
      sink: "A",
      formula: "Rₛ(Rᵦ² + 4RᵦRₛ + 2Rₛ²) / [(Rᵦ + 2Rₛ)(Rᵦ + 4Rₛ)]",
      reduction: "B and D are equipotential by mirror symmetry. They may be merged in the reduced conductance network without adding a current-carrying wire.",
    }),
  });
  const presets = Object.freeze([
    Object.freeze({ label: "Question · all 12 Ω", base: 12, side: 12, terminal: "opposite" }),
    Object.freeze({ label: "Adjacent pair", base: 12, side: 12, terminal: "adjacent" }),
    Object.freeze({ label: "Apex to base", base: 12, side: 12, terminal: "apex" }),
    Object.freeze({ label: "Strong apex paths", base: 24, side: 2, terminal: "opposite" }),
  ]);
  const hints = Object.freeze([
    "Apply a 1.00 V test source between A and C. Equivalent resistance is then 1.00 V divided by the total current leaving A.",
    "Reflection and voltage-inversion symmetry force B, D and E to the same potential: 0.500 V.",
    "No current flows between equipotential nodes. The three active routes are A–B–C, A–D–C and A–E–C; each contains two 12 Ω resistors in series.",
    "Each route is 24 Ω and the three routes are in parallel, so Rₑq = 24 Ω / 3.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p91-reset">Reset</button>';

  const initialState = () => ({
    baseResistance: QUESTION_RESISTANCE,
    sideResistance: QUESTION_RESISTANCE,
    terminal: "opposite",
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

  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value.toFixed(digits));
    return Object.is(rounded, -0) ? "0" : String(rounded);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function terminalInfo(key = state.terminal) {
    return terminalCases[key] || terminalCases.opposite;
  }

  function resistanceFor(edge, baseResistance = state.baseResistance, sideResistance = state.sideResistance) {
    return edge.family === "base" ? baseResistance : sideResistance;
  }

  function solveLinearSystem(matrix, vector) {
    const size = vector.length;
    const augmented = matrix.map((row, index) => [...row, vector[index]]);
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) {
        if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
      }
      if (Math.abs(augmented[pivot][column]) < 1e-13) throw new Error("Singular conductance matrix");
      [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
      const divisor = augmented[column][column];
      for (let entry = column; entry <= size; entry += 1) augmented[column][entry] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === column) continue;
        const factor = augmented[row][column];
        for (let entry = column; entry <= size; entry += 1) augmented[row][entry] -= factor * augmented[column][entry];
      }
    }
    return augmented.map((row) => row[size]);
  }

  function nodalAnalysis(
    baseResistance = state.baseResistance,
    sideResistance = state.sideResistance,
    terminalKey = state.terminal,
  ) {
    const terminals = terminalInfo(terminalKey);
    const fixed = { [terminals.source]: TEST_VOLTAGE, [terminals.sink]: 0 };
    const unknown = nodeNames.filter((name) => !(name in fixed));
    const matrix = unknown.map(() => unknown.map(() => 0));
    const vector = unknown.map(() => 0);
    unknown.forEach((name, row) => {
      edges.filter((edge) => edge.a === name || edge.b === name).forEach((edge) => {
        const other = edge.a === name ? edge.b : edge.a;
        const conductance = 1 / resistanceFor(edge, baseResistance, sideResistance);
        matrix[row][row] += conductance;
        const otherColumn = unknown.indexOf(other);
        if (otherColumn >= 0) matrix[row][otherColumn] -= conductance;
        else vector[row] += conductance * fixed[other];
      });
    });
    const solved = solveLinearSystem(matrix, vector);
    const potentials = { ...fixed };
    unknown.forEach((name, index) => { potentials[name] = solved[index]; });
    const edgeCurrents = {};
    edges.forEach((edge) => {
      edgeCurrents[edge.id] = (potentials[edge.a] - potentials[edge.b]) / resistanceFor(edge, baseResistance, sideResistance);
    });
    const sourceCurrent = edges
      .filter((edge) => edge.a === terminals.source || edge.b === terminals.source)
      .reduce((total, edge) => {
        const other = edge.a === terminals.source ? edge.b : edge.a;
        return total + (potentials[terminals.source] - potentials[other]) / resistanceFor(edge, baseResistance, sideResistance);
      }, 0);
    const residuals = {};
    unknown.forEach((name) => {
      residuals[name] = edges
        .filter((edge) => edge.a === name || edge.b === name)
        .reduce((total, edge) => {
          const other = edge.a === name ? edge.b : edge.a;
          return total + (potentials[name] - potentials[other]) / resistanceFor(edge, baseResistance, sideResistance);
        }, 0);
    });
    return {
      terminals,
      potentials,
      edgeCurrents,
      sourceCurrent,
      equivalentResistance: TEST_VOLTAGE / sourceCurrent,
      maximumResidual: Math.max(...Object.values(residuals).map(Math.abs)),
      residuals,
    };
  }

  function analyticEquivalent(
    baseResistance = state.baseResistance,
    sideResistance = state.sideResistance,
    terminalKey = state.terminal,
  ) {
    const base = baseResistance;
    const side = sideResistance;
    if (terminalKey === "opposite") return 2 * base * side / (base + 2 * side);
    if (terminalKey === "adjacent") {
      return 2 * base * side * (base + 3 * side) / ((base + 2 * side) * (base + 4 * side));
    }
    return side * (base ** 2 + 4 * base * side + 2 * side ** 2) / ((base + 2 * side) * (base + 4 * side));
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.base - state.baseResistance) < 1e-9
      && Math.abs(preset.side - state.sideResistance) < 1e-9
      && preset.terminal === state.terminal
    ));
  }

  function readableAngle(a, b) {
    let angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    return angle;
  }

  function edgeMarkup(edge, analysis) {
    const first = nodePoints[edge.a];
    const second = nodePoints[edge.b];
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const resistance = resistanceFor(edge);
    const current = analysis.edgeCurrents[edge.id];
    const maximumCurrent = Math.max(...Object.values(analysis.edgeCurrents).map(Math.abs), 1e-12);
    const flow = Math.abs(current) / maximumCurrent;
    const from = current >= 0 ? first : second;
    const to = current >= 0 ? second : first;
    const arrowStart = { x: from.x + (to.x - from.x) * 0.57, y: from.y + (to.y - from.y) * 0.57 };
    const arrowEnd = { x: from.x + (to.x - from.x) * 0.72, y: from.y + (to.y - from.y) * 0.72 };
    const zero = Math.abs(current) < 1e-9;
    return `
      <g class="p91-edge is-${edge.family} ${zero ? "is-zero" : ""}" data-p91-edge="${edge.id}">
        <line class="p91-wire" x1="${first.x}" y1="${first.y}" x2="${second.x}" y2="${second.y}" />
        <line class="p91-current-path" x1="${first.x}" y1="${first.y}" x2="${second.x}" y2="${second.y}" stroke-width="${format(2.2 + 4.2 * flow, 2)}" opacity="${format(0.25 + 0.75 * flow, 2)}" />
        ${zero ? "" : `<line class="p91-current-arrow" x1="${format(arrowStart.x, 2)}" y1="${format(arrowStart.y, 2)}" x2="${format(arrowEnd.x, 2)}" y2="${format(arrowEnd.y, 2)}" marker-end="url(#p91-arrow-current)" />`}
        <g class="p91-resistor" transform="translate(${format(midpoint.x, 2)} ${format(midpoint.y, 2)}) rotate(${format(readableAngle(first, second), 2)})">
          <rect x="-24" y="-9" width="48" height="18" rx="4" />
          <path d="M-19 0h6l4-5 7 10 7-10 4 5h10" />
          <text x="0" y="-14" text-anchor="middle">${edge.id} · ${format(resistance, 1)} Ω</text>
          <text class="p91-current-value" x="0" y="22" text-anchor="middle">${zero ? "0 A · equal V" : `${format(Math.abs(current), 4)} A`}</text>
        </g>
      </g>`;
  }

  function equipotentialMarkup() {
    const names = state.terminal === "opposite" ? ["B", "D", "E"] : state.terminal === "apex" ? ["B", "D"] : ["E"];
    return names.map((name) => {
      const point = nodePoints[name];
      return `<circle class="p91-equipotential-halo" cx="${point.x}" cy="${point.y}" r="30" />`;
    }).join("");
  }

  function nodeMarkup(name, analysis) {
    const point = nodePoints[name];
    const potential = analysis.potentials[name];
    const role = name === analysis.terminals.source ? "source" : name === analysis.terminals.sink ? "sink" : "internal";
    return `
      <g class="p91-node is-${role}" transform="translate(${point.x} ${point.y})">
        <circle class="p91-node-cold" r="24" />
        <circle class="p91-node-hot" r="24" opacity="${format(potential, 3)}" />
        <circle class="p91-node-ring" r="24" />
        <text class="p91-node-name" y="4" text-anchor="middle">${name}</text>
        <text class="p91-node-potential" y="39" text-anchor="middle">${format(potential, 3)} V</text>
        ${role === "source" ? '<text class="p91-terminal-label" y="-35" text-anchor="middle">SOURCE +</text>' : role === "sink" ? '<text class="p91-terminal-label" y="-35" text-anchor="middle">RETURN −</text>' : ""}
      </g>`;
  }

  function networkMarkup() {
    const analysis = nodalAnalysis();
    const analytic = analyticEquivalent();
    const formulaResidual = analysis.equivalentResistance - analytic;
    const terminals = terminalInfo();
    return `
      <div class="p91-network-wrap">
        <svg class="p91-network" viewBox="0 0 730 455" role="img" aria-labelledby="p91-network-title p91-network-desc">
          <title id="p91-network-title">Square-pyramid resistor network under a one volt test</title>
          <desc id="p91-network-desc">${terminals.label} is selected. Base edges are ${format(state.baseResistance, 1)} ohms and apex edges are ${format(state.sideResistance, 1)} ohms. The total test current is ${format(analysis.sourceCurrent, 5)} amperes and the equivalent resistance is ${format(analysis.equivalentResistance, 5)} ohms. Node potentials and current magnitudes are labelled on the network.</desc>
          <defs>
            <marker id="p91-arrow-current" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" /></marker>
            <linearGradient id="p91-potential-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4b8ca9" /><stop offset="1" stop-color="#e58055" /></linearGradient>
          </defs>
          <path class="p91-base-plane" d="M${nodePoints.A.x} ${nodePoints.A.y} L${nodePoints.B.x} ${nodePoints.B.y} L${nodePoints.C.x} ${nodePoints.C.y} L${nodePoints.D.x} ${nodePoints.D.y}Z" />
          ${edges.map((edge) => edgeMarkup(edge, analysis)).join("")}
          ${equipotentialMarkup()}
          ${nodeNames.map((name) => nodeMarkup(name, analysis)).join("")}
          <g class="p91-voltage-key" transform="translate(548 78)">
            <text x="0" y="0">NODE POTENTIAL</text>
            <rect x="0" y="12" width="112" height="9" rx="4.5" />
            <text x="0" y="36">0 V</text><text x="112" y="36" text-anchor="end">1 V</text>
          </g>
          <text class="p91-diagram-caption" x="28" y="31">1.000 V TEST · ARROWS SHOW CONVENTIONAL CURRENT</text>
        </svg>
        <div class="p91-ledger">
          <div><span>Total source current</span><strong>${format(analysis.sourceCurrent, 5)} A</strong><small>from a 1.000 V test</small></div>
          <div><span>Equivalent resistance</span><strong>${format(analysis.equivalentResistance, 5)} Ω</strong><small>Vtest / Itotal</small></div>
          <div><span>Symmetry formula</span><strong>${format(analytic, 5)} Ω</strong><small>${terminals.formula}</small></div>
        </div>
        <div class="p91-reduction">
          <div><span class="eyebrow">Symmetry reduction</span><p>${terminals.reduction}</p></div>
          <div class="p91-formula"><span>${terminals.short}</span><strong>R<sub>eq</sub> = ${terminals.formula}</strong></div>
          <div class="p91-verification"><span>Nodal verification</span><strong>${Math.abs(formulaResidual) < 1e-9 ? "formula agrees" : "check model"}</strong><small>|ΔR| = ${Math.abs(formulaResidual).toExponential(1)} Ω · max KCL residual ${analysis.maximumResidual.toExponential(1)} A</small></div>
        </div>
      </div>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <section class="p91-controls" aria-label="Resistor pyramid controls">
        <div class="p91-control-grid">
          <label for="p91-base-resistance"><span>Base-edge resistance R<sub>b</sub><output data-p91-live="base">${format(state.baseResistance, 1)} Ω</output></span><input id="p91-base-resistance" data-p91-slider="base" type="range" min="1" max="30" step="0.5" value="${state.baseResistance}" /></label>
          <label for="p91-side-resistance"><span>Apex-edge resistance R<sub>s</sub><output data-p91-live="side">${format(state.sideResistance, 1)} Ω</output></span><input id="p91-side-resistance" data-p91-slider="side" type="range" min="1" max="30" step="0.5" value="${state.sideResistance}" /></label>
        </div>
        <div class="p91-terminal-picker" role="group" aria-label="Choose test terminals">${Object.entries(terminalCases).map(([key, item]) => `<button class="secondary-button ${state.terminal === key ? "active" : ""}" type="button" data-problem-action="p91-terminal" data-p91-terminal="${key}" aria-pressed="${state.terminal === key}">${item.short}</button>`).join("")}</div>
        <div class="p91-presets" role="group" aria-label="Network presets">${presets.map((preset, index) => `<button class="chip-button ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p91-preset" data-p91-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p91-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p91-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p91-solution" aria-labelledby="p91-solution-heading">
        <h3 id="p91-solution-heading" tabindex="-1">Three equal routes survive the symmetry reduction</h3>
        <p>Put A at 1.000 V and C at 0 V. The network is unchanged if A and C are exchanged while every potential V is replaced by 1−V. Nodes B and D exchange, while E maps to itself. The mirror symmetry also gives V(B)=V(D), hence</p>
        <div class="p91-equation">V(B) = V(D) = V(E) = 0.500 V</div>
        <p>The B–E and D–E resistors therefore carry zero current. What remains is three A-to-C routes:</p>
        <div class="p91-equation">A–B–C = 24 Ω &nbsp;·&nbsp; A–D–C = 24 Ω &nbsp;·&nbsp; A–E–C = 24 Ω</div>
        <div class="p91-equation is-answer">1 / R<sub>eq</sub> = 3 / 24 Ω &nbsp;⇒&nbsp; R<sub>eq</sub> = 8 Ω</div>
        <p>Equivalently, each route carries 1/24 A under the 1 V test, so the source supplies 1/8 A and R<sub>eq</sub>=1/(1/8)=8 Ω.</p>
        <p>For general base resistance R<sub>b</sub> and apex-edge resistance R<sub>s</sub>, the same reduction gives</p>
        <div class="p91-equation">R<sub>AC</sub> = 2R<sub>b</sub>R<sub>s</sub> / (R<sub>b</sub> + 2R<sub>s</sub>)</div>
        <p class="p91-limits"><strong>Checks.</strong> If R<sub>s</sub>→∞, the apex paths open and R<sub>AC</sub>→R<sub>b</sub>, the two 2R<sub>b</sub> base routes in parallel. If R<sub>b</sub>→∞, only A–E–C remains and R<sub>AC</sub>→2R<sub>s</sub>. If either family tends to a short circuit, R<sub>AC</sub> tends to zero. Scaling every edge resistance by a factor k scales every equivalent resistance by k, while all node-potential fractions remain unchanged.</p>
      </section>`;
  }

  function parseOhms(raw) {
    const normalized = String(raw).trim().toLowerCase().replace(/[Ωω]/g, "ohm").replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/k\s*ohms?$/.test(normalized)) return Number(normalized.replace(/\s*k\s*ohms?$/, "")) * 1000;
    if (/ohms?$/.test(normalized)) return Number(normalized.replace(/\s*ohms?$/, ""));
    return Number(normalized);
  }

  function snapshot() {
    const analysis = nodalAnalysis();
    const analytic = analyticEquivalent();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      model: "square base plus four apex edges; a one volt test source determines equivalent resistance",
      baseEdgeResistanceOhms: state.baseResistance,
      apexEdgeResistanceOhms: state.sideResistance,
      terminalPair: terminalInfo().label,
      sourceNode: analysis.terminals.source,
      returnNode: analysis.terminals.sink,
      nodePotentialsVolts: Object.fromEntries(nodeNames.map((name) => [name, Number(analysis.potentials[name].toFixed(9))])),
      edgeCurrentsAmperes: Object.fromEntries(edges.map((edge) => [edge.id, Number(analysis.edgeCurrents[edge.id].toFixed(9))])),
      sourceCurrentAmperes: Number(analysis.sourceCurrent.toFixed(9)),
      nodalEquivalentResistanceOhms: Number(analysis.equivalentResistance.toFixed(9)),
      analyticEquivalentResistanceOhms: Number(analytic.toFixed(9)),
      formulaResidualOhms: Number((analysis.equivalentResistance - analytic).toFixed(12)),
      maximumKclResidualAmperes: Number(analysis.maximumResidual.toFixed(12)),
      questionAnswerOhms: 8,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p91-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circuit symmetry</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p91-spread">
          <article class="book-page p91-problem-page">
            <div class="problem-number">Problem 9.1</div>
            <h1 class="book-title p91-title">Resistor pyramid</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="p91-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written square-pyramid circuit is not the book’s wording or solution.</p>
            <p class="problem-copy">A square pyramid has a 12 Ω resistor on each of its eight edges: four around the square base and four from the base corners to the apex.</p>
            <p class="problem-copy">What is the equivalent resistance measured between opposite base corners A and C?</p>
            <section class="p91-model-card"><div class="eyebrow">Ideal model</div><p>Identical junctions, ideal wires at each node, linear resistors and no connection between geometrically crossing lines unless a labelled node is present.</p></section>
            <section class="prediction-box"><div class="eyebrow">Before calculating</div><p>Which nodes must share a potential? Every resistor between such nodes carries exactly zero current and can disappear from the reduced network.</p></section>
          </article>

          <section class="book-page book-stage p91-stage" aria-labelledby="p91-stage-title">
            <div class="p91-stage-heading"><div><span class="eyebrow">One-volt nodal laboratory</span><h2 id="p91-stage-title">Find the invisible equalities</h2></div><p>Choose terminals or change either edge family. Current arrows, node voltages and the analytic reduction update together.</p></div>
            <div class="p91-dynamic">${networkMarkup()}</div>
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p91-coach">
            <div class="coach-kicker">Reduce the question network</div>
            <p class="coach-question">With all eight edges equal to 12 Ω, what resistance is measured between opposite base corners A and C?</p>
            <form class="p91-answer-form" data-p91-answer-form novalidate>
              <label for="p91-answer">Equivalent resistance</label>
              <div><input id="p91-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="e.g. 8" /><span>Ω</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p91-help-row"><button class="secondary-button" type="button" data-problem-action="p91-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p91-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p91-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p91-dynamic");
    if (dynamic) dynamic.innerHTML = networkMarkup();
    root.querySelectorAll('[data-p91-live="base"]').forEach((node) => { node.textContent = `${format(state.baseResistance, 1)} Ω`; });
    root.querySelectorAll('[data-p91-live="side"]').forEach((node) => { node.textContent = `${format(state.sideResistance, 1)} Ω`; });
    const analysis = nodalAnalysis();
    root.querySelector("#p91-base-resistance")?.setAttribute("aria-valuetext", `${format(state.baseResistance, 1)} ohms on each base edge; equivalent resistance ${format(analysis.equivalentResistance, 3)} ohms`);
    root.querySelector("#p91-side-resistance")?.setAttribute("aria-valuetext", `${format(state.sideResistance, 1)} ohms on each apex edge; equivalent resistance ${format(analysis.equivalentResistance, 3)} ohms`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p91-preset"]').forEach((button) => {
      const active = Number(button.dataset.p91Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderAndFocus(rerender, selector) {
    rerender();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p91-shell");
    if (!root) return;

    root.querySelectorAll("[data-p91-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        if (event.target.dataset.p91Slider === "base") state.baseResistance = clamp(event.target.value, 1, 30);
        if (event.target.dataset.p91Slider === "side") state.sideResistance = clamp(event.target.value, 1, 30);
        state.feedback = "";
        state.committed = false;
        updateDynamicDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p91-reset") {
          state = initialState();
          renderAndFocus(rerender, "#p91-base-resistance");
          return;
        }
        if (action === "p91-terminal") {
          state.terminal = terminalCases[control.dataset.p91Terminal] ? control.dataset.p91Terminal : "opposite";
          state.feedback = "";
          state.committed = false;
          renderAndFocus(rerender, `[data-p91-terminal="${state.terminal}"]`);
          return;
        }
        if (action === "p91-preset") {
          const preset = presets[Number(control.dataset.p91Preset)];
          if (preset) {
            state.baseResistance = preset.base;
            state.sideResistance = preset.side;
            state.terminal = preset.terminal;
            state.feedback = "";
            state.committed = false;
          }
          renderAndFocus(rerender, "#p91-base-resistance");
          return;
        }
        if (action === "p91-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p91-reveal") state.revealed = true;
        rerender();
        if (action === "p91-reveal") window.requestAnimationFrame(() => document.querySelector("#p91-solution-heading")?.focus());
      });
    });

    root.querySelector("#p91-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelector("[data-p91-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p91-answer")?.value || "";
      const answer = parseOhms(raw);
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(answer) || answer < 0) {
        state.feedback = "Enter a non-negative resistance in Ω; kΩ is also accepted.";
        state.feedbackTone = "warn";
      } else if (Math.abs(answer - 8) <= 0.02) {
        state.feedback = "Correct. Symmetry leaves three equal 24 Ω routes in parallel, giving exactly 8 Ω.";
        state.feedbackTone = "success";
        state.committed = true;
        state.baseResistance = QUESTION_RESISTANCE;
        state.sideResistance = QUESTION_RESISTANCE;
        state.terminal = "opposite";
      } else if (Math.abs(answer - 24) <= 0.05) {
        state.feedback = "That is one two-resistor route. There are three identical routes between A and C, and they operate in parallel.";
      } else if (Math.abs(answer - 12) <= 0.05) {
        state.feedback = "A direct 12 Ω edge does not join opposite corners. First identify the three two-edge routes selected by symmetry.";
      } else {
        state.feedback = "Use a 1 V test, mark B, D and E as equipotential, then reduce the three surviving routes.";
      }
      renderAndFocus(rerender, "#p91-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
