(function registerChordFactoryPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "15.6";
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const LONG_CHORD_THRESHOLD = Math.sqrt(3);
  const SIMULATION_TRIALS = 4000;
  const DISPLAY_CHORDS = 50;
  const CHALLENGE = Object.freeze({ activeProtocol: "endpoints", seed: 15601 });
  const protocols = Object.freeze([
    Object.freeze({ key: "endpoints", label: "Two random endpoints", short: "Endpoints", exact: 1 / 3, definition: "Choose two independent uniform angles on the circumference." }),
    Object.freeze({ key: "radial", label: "Uniform radial distance", short: "Radial d", exact: 1 / 2, definition: "Choose chord-normal direction uniformly and d uniformly on [0,R]." }),
    Object.freeze({ key: "midpoint", label: "Uniform midpoint in disk", short: "Disk midpoint", exact: 1 / 4, definition: "Choose the chord midpoint uniformly by area in the disk." }),
  ]);
  const stages = Object.freeze([
    Object.freeze({ short: "Threshold", title: "Translate chord length into midpoint distance", copy: "For radius R and midpoint distance d, chord length is 2√(R²−d²). It exceeds the inscribed equilateral side √3R exactly when d<R/2." }),
    Object.freeze({ short: "Measures", title: "Define three different meanings of random", copy: "Each factory samples a different primitive variable uniformly. The central half-radius disk is the same success region, but the induced midpoint distributions differ." }),
    Object.freeze({ short: "Compare", title: "Put exact measures beside seeded frequencies", copy: "Exact probabilities 1/3, 1/2 and 1/4 follow from angular length, radial length and disk area. Seeded simulations fluctuate nearby." }),
  ]);
  const hints = Object.freeze([
    "A chord whose midpoint is distance d from the centre has length L=2√(R²−d²). Long means L>√3R, so d<R/2.",
    "With two uniform endpoints, the smaller angular separation is uniform on [0,π]. Long chords require separation greater than 2π/3.",
    "With d uniform on [0,R], the successful interval is [0,R/2), exactly half of the radial interval.",
    "With midpoint uniform by disk area, success is the central disk of radius R/2, whose area is (1/2)²=1/4 of the whole disk.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p156-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, answers: { endpoints: "", radial: "", midpoint: "" }, stage: 0, feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function createGenerator(seed) {
    let value = Number(seed) >>> 0;
    return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  }

  function chordFromMidpoint(distance, angle) {
    const midpointX = distance * Math.cos(angle), midpointY = distance * Math.sin(angle);
    const halfLength = Math.sqrt(Math.max(0, 1 - distance ** 2));
    const tangentX = -Math.sin(angle), tangentY = Math.cos(angle);
    const x1 = midpointX + halfLength * tangentX, y1 = midpointY + halfLength * tangentY;
    const x2 = midpointX - halfLength * tangentX, y2 = midpointY - halfLength * tangentY;
    const length = 2 * halfLength;
    return { x1, y1, x2, y2, midpointX, midpointY, distance, length, long: length > LONG_CHORD_THRESHOLD };
  }

  function generateChord(protocol, random) {
    if (protocol === "endpoints") {
      const angle1 = 2 * Math.PI * random(), angle2 = 2 * Math.PI * random();
      const x1 = Math.cos(angle1), y1 = Math.sin(angle1), x2 = Math.cos(angle2), y2 = Math.sin(angle2);
      const midpointX = (x1 + x2) / 2, midpointY = (y1 + y2) / 2;
      const distance = Math.hypot(midpointX, midpointY), length = Math.hypot(x2 - x1, y2 - y1);
      return { x1, y1, x2, y2, midpointX, midpointY, distance, length, long: length > LONG_CHORD_THRESHOLD };
    }
    const first = random(), angle = 2 * Math.PI * random();
    return chordFromMidpoint(protocol === "radial" ? first : Math.sqrt(first), angle);
  }

  function protocolSeed(protocol, seed = state.seed) {
    const salt = protocol === "endpoints" ? 0x9e3779b9 : protocol === "radial" ? 0x85ebca6b : 0xc2b2ae35;
    return (Number(seed) ^ salt) >>> 0;
  }

  function simulateProtocol(protocol, trials = SIMULATION_TRIALS, seed = state.seed) {
    const random = createGenerator(protocolSeed(protocol, seed));
    let longCount = 0;
    const displayed = [];
    for (let index = 0; index < trials; index += 1) {
      const chord = generateChord(protocol, random);
      if (chord.long) longCount += 1;
      if (index < DISPLAY_CHORDS) displayed.push(chord);
    }
    return { longCount, trials, probability: longCount / trials, displayed, current: displayed[displayed.length - 1] };
  }

  function modelData() {
    const results = Object.fromEntries(protocols.map((protocol) => [protocol.key, simulateProtocol(protocol.key)]));
    return { results, active: results[state.activeProtocol], activeDefinition: protocols.find((protocol) => protocol.key === state.activeProtocol) };
  }

  function parseProbability(raw) {
    const normalized = String(raw).trim().replaceAll("−", "-").replaceAll(",", ".");
    if (!normalized) return NaN;
    if (normalized.endsWith("%")) return Number(normalized.slice(0, -1)) / 100;
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return Number(normalized);
  }

  function stageControls() {
    return `<div class="p156-stage-controls" role="group" aria-label="Random chord analysis stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p156-stage" data-p156-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p156-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p156-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Measures compared" : "Next stage"}</button></div>`;
  }

  function pointToSvg(x, y) { return { x: 205 + 142 * x, y: 210 - 142 * y }; }

  function chordLine(chord, className = "") {
    const first = pointToSvg(chord.x1, chord.y1), second = pointToSvg(chord.x2, chord.y2);
    return `<line class="p156-chord ${chord.long ? "is-long" : "is-short"} ${className}" x1="${format(first.x, 2)}" y1="${format(first.y, 2)}" x2="${format(second.x, 2)}" y2="${format(second.y, 2)}"/>`;
  }

  function chordSvg(values) {
    const current = values.active.current;
    const midpoint = pointToSvg(current.midpointX, current.midpointY);
    const exactScale = 190 / .6;
    const triangle = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6].map((angle) => pointToSvg(Math.cos(angle), Math.sin(angle))).map((point) => `${format(point.x, 2)},${format(point.y, 2)}`).join(" ");
    return `<svg class="p156-svg p156-stage-${state.stage}" viewBox="0 0 740 430" role="img" aria-labelledby="p156-svg-title p156-svg-desc">
      <title id="p156-svg-title">Three random chord sampling measures</title>
      <desc id="p156-svg-desc">A chord is long when it exceeds the side of an equilateral triangle inscribed in the same circle, equivalently when its midpoint is less than half a radius from the centre. The selected ${values.activeDefinition.label} protocol generated ${values.active.longCount} long chords in ${values.active.trials} seeded trials. Exact probabilities for random endpoints, uniform radial distance and uniform disk midpoint are one third, one half and one quarter respectively.</desc>
      <rect class="p156-board" x="1" y="1" width="738" height="428" rx="20"/><text class="p156-board-title" x="22" y="27">THE SAME CHORD TEST · THREE DIFFERENT PROBABILITY MEASURES</text>
      <circle class="p156-circle" cx="205" cy="210" r="142"/><circle class="p156-success-region" cx="205" cy="210" r="71"/><polygon class="p156-threshold-triangle" points="${triangle}"/><text class="p156-region-label" x="205" y="215" text-anchor="middle">d&lt;R/2</text><text class="p156-threshold-label" x="205" y="45" text-anchor="middle">long when L&gt;√3R</text>
      <g class="p156-batch-layer">${values.active.displayed.slice(0, -1).map((chord) => chordLine(chord)).join("")}</g><g class="p156-current-layer">${chordLine(current, "is-current")}<line class="p156-distance-line" x1="205" y1="210" x2="${format(midpoint.x, 2)}" y2="${format(midpoint.y, 2)}"/><circle class="p156-midpoint ${current.long ? "is-long" : "is-short"}" cx="${format(midpoint.x, 2)}" cy="${format(midpoint.y, 2)}" r="5"/><rect class="p156-current-card" x="55" y="360" width="300" height="48" rx="11"/><text class="p156-current-kicker" x="70" y="379">CURRENT ${values.activeDefinition.short.toUpperCase()} CHORD · SEED ${state.seed}</text><text class="p156-current-value" x="70" y="397">d=${format(current.distance, 3)}R · L=${format(current.length, 3)}R · ${current.long ? "LONG" : "SHORT"}</text></g>
      <g class="p156-probability-layer">${protocols.map((protocol, index) => { const rowY = 54 + index * 108, result = values.results[protocol.key], exactWidth = protocol.exact * exactScale, simulatedX = 497 + result.probability * exactScale; return `<g class="p156-protocol-row ${state.activeProtocol === protocol.key ? "is-active" : ""}"><rect x="397" y="${rowY}" width="321" height="96" rx="13"/><text class="p156-row-title" x="413" y="${rowY + 21}">${index + 1} · ${protocol.label}</text><text class="p156-row-definition" x="413" y="${rowY + 39}">${protocol.definition}</text><rect class="p156-bar-track" x="497" y="${rowY + 55}" width="190" height="13" rx="6.5"/><rect class="p156-exact-bar" x="497" y="${rowY + 55}" width="${format(exactWidth, 2)}" height="13" rx="6.5"/><text class="p156-exact-value" x="413" y="${rowY + 66}">${protocol.exact === 1 / 3 ? "1/3" : protocol.exact === 1 / 2 ? "1/2" : "1/4"}</text><g class="p156-sim-layer"><line class="p156-sim-marker" x1="${format(simulatedX, 2)}" y1="${rowY + 50}" x2="${format(simulatedX, 2)}" y2="${rowY + 73}"/><text class="p156-sim-value" x="413" y="${rowY + 85}">seeded ${format(100 * result.probability, 2)}% · exact ${format(100 * protocol.exact, 2)}%</text></g></g>`; }).join("")}<text class="p156-scale-label" x="497" y="386">0</text><text class="p156-scale-label" x="655" y="386">50%</text><text class="p156-legend" x="397" y="407">filled bar = exact measure · marker = seeded frequency</text></g>
    </svg>`;
  }

  function metricsMarkup(values) {
    return `<section class="p156-metrics" aria-live="polite">${protocols.map((protocol) => `<div class="${state.activeProtocol === protocol.key ? "is-active" : ""}"><span>${protocol.short}</span><strong>${protocol.exact === 1 / 3 ? "1/3" : protocol.exact === 1 / 2 ? "1/2" : "1/4"}</strong><small>${state.stage >= 2 || state.revealed ? `seeded ${format(100 * values.results[protocol.key].probability, 2)}%` : "exact probability"}</small></div>`).join("")}</section>`;
  }

  function dynamicMarkup(values = modelData()) { return `<div class="p156-dynamic">${chordSvg(values)}${metricsMarkup(values)}</div>`; }

  function controlsMarkup() {
    return `<section class="p156-controls" aria-label="Random chord factory controls"><div class="p156-protocol-buttons" role="group" aria-label="Chord sampling protocol">${protocols.map((protocol) => `<button class="secondary-button ${state.activeProtocol === protocol.key ? "active" : ""}" type="button" data-problem-action="p156-protocol" data-p156-protocol="${protocol.key}" aria-pressed="${state.activeProtocol === protocol.key}">${protocol.short}</button>`).join("")}</div><div class="p156-seed-row"><p><strong>Batch seed ${state.seed} · ${SIMULATION_TRIALS.toLocaleString("en-GB")} chords per protocol.</strong> The same seed always recreates the same three batches.</p><button class="secondary-button" type="button" data-problem-action="p156-reseed">Generate new batches</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p156-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p156-solution" aria-labelledby="p156-solution-heading"><h3 id="p156-solution-heading" tabindex="-1">“Random” needs a measure</h3><div class="p156-equation">L=2√(R²−d²)&gt;√3R ⇔ d&lt;R/2</div><p><strong>1 · Two random endpoints.</strong> The smaller endpoint separation Δ is uniform from 0 to π. Long chords have Δ&gt;2π/3, occupying one third of that interval.</p><div class="p156-equation">Pendpoint=(π−2π/3)/π=1/3</div><p><strong>2 · Uniform radial distance.</strong> The successful midpoint-distance interval has length R/2 inside an interval of length R.</p><div class="p156-equation">Pradial=(R/2)/R=1/2</div><p><strong>3 · Uniform midpoint in the disk.</strong> Successful midpoints occupy the central disk of radius R/2.</p><div class="p156-equation is-answer">Pdisk=π(R/2)²/(πR²)=1/4<br>Ordered result: 1/3, 1/2, 1/4</div><p class="p156-limits"><strong>Interpretation.</strong> Nothing contradictory happened: the protocols assign equal probability to different primitive objects—endpoint angles, radial distance, or disk area. A claim that a chord is “chosen at random” is incomplete until its probability measure or physical generation rule is specified. Boundary chords with d=R/2 have probability zero in these continuous models, so using &gt; rather than ≥ does not change the probabilities.</p></section>`;
  }

  function snapshot(values = modelData()) {
    const current = values.active.current;
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, lesson: "random needs a probability measure", radius: 1, longChordThresholdInRadiusUnits: Number(LONG_CHORD_THRESHOLD.toFixed(12)), equivalentMidpointThresholdInRadiusUnits: 0.5, deterministicSeed: state.seed, simulationTrialsPerProtocol: SIMULATION_TRIALS, activeProtocol: state.activeProtocol, activeCurrentChord: { midpointDistanceInRadiusUnits: Number(current.distance.toFixed(12)), lengthInRadiusUnits: Number(current.length.toFixed(12)), long: current.long }, protocols: Object.fromEntries(protocols.map((protocol) => [protocol.key, { definition: protocol.definition, exactProbability: protocol.exact, seededLongCount: values.results[protocol.key].longCount, seededProbability: Number(values.results[protocol.key].probability.toFixed(12)) }])), answers: state.answers, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.activeProtocol = CHALLENGE.activeProtocol; state.seed = CHALLENGE.seed; }
  function render() {
    const values = modelData();
    return `<main class="book-shell p156-shell"><div class="p156-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Probability and randomness</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p156-spread"><article class="book-page p156-problem-page"><div class="problem-number">Problem 15.6</div><h1 class="book-title p156-title">The Chord Factory</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="problem-copy">Call a chord of a circle <em>long</em> when it is longer than the side of an equilateral triangle inscribed in that circle.</p><p class="problem-copy">A factory offers three “random chord” protocols: two uniform endpoints; uniform perpendicular distance from the centre; or a midpoint uniform by area in the disk. <strong>Find the long-chord probability for all three, in that order.</strong></p><section class="p156-observation-card"><strong>“Random” needs a measure</strong><p>The phrase does not identify which outcomes receive equal probability. Different physical sampling rules can produce different correct answers.</p></section><section class="p156-model-card"><div class="eyebrow">Unit-circle laboratory</div><p>Radius is set to one without loss of generality. Every batch is deterministic for its displayed seed; exact probabilities do not depend on simulation.</p></section></article><section class="book-page book-stage p156-stage">${stageControls()}<div class="p156-visual-card">${dynamicMarkup(values)}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p156-coach"><div class="coach-kicker">Specify the factory</div><p class="coach-question">Enter the three exact probabilities in protocol order.</p><form class="p156-answer-form" data-p156-answer-form novalidate>${protocols.map((protocol) => `<label for="p156-answer-${protocol.key}">${protocol.label}</label><input id="p156-answer-${protocol.key}" data-p156-answer="${protocol.key}" type="text" inputmode="text" value="${escapeAttribute(state.answers[protocol.key])}" placeholder="fraction or decimal" autocomplete="off"/>`).join("")}<button class="primary-button" type="submit">Check all three</button></form>${feedbackMarkup()}<div class="button-row p156-help-row"><button class="secondary-button" type="button" data-problem-action="p156-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p156-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p156-debug">${debugPanel("Development state", snapshot(values))}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p156-reset") { state = initialState(); renderAndFocus(renderApp, "#p156-answer-endpoints"); return; }
      if (action === "p156-stage") { state.stage = clamp(Number(control.dataset.p156Stage), 0, 2); renderAndFocus(renderApp, `[data-p156-stage="${state.stage}"]`); return; }
      if (action === "p156-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p156-stage="${state.stage}"]`); return; }
      if (action === "p156-protocol") { state.activeProtocol = protocols.some((protocol) => protocol.key === control.dataset.p156Protocol) ? control.dataset.p156Protocol : "endpoints"; renderAndFocus(renderApp, `[data-p156-protocol="${state.activeProtocol}"]`); return; }
      if (action === "p156-reseed") { state.seed = (state.seed + 9973) >>> 0; state.feedback = ""; state.committed = false; renderAndFocus(renderApp, `[data-problem-action="p156-reseed"]`); return; }
      if (action === "p156-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p156-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p156-reveal") window.requestAnimationFrame(() => document.querySelector("#p156-solution-heading")?.focus());
    }));
    document.querySelectorAll("[data-p156-answer]").forEach((input) => input.addEventListener("input", (event) => { state.answers[event.target.dataset.p156Answer] = event.target.value; state.feedback = ""; state.committed = false; }));
    document.querySelector("[data-p156-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const parsed = protocols.map((protocol) => parseProbability(event.currentTarget.querySelector(`[data-p156-answer="${protocol.key}"]`)?.value)); protocols.forEach((protocol, index) => { state.answers[protocol.key] = event.currentTarget.querySelector(`[data-p156-answer="${protocol.key}"]`)?.value.trim() || ""; }); state.feedbackTone = "warn"; state.committed = false;
      if (parsed.some((value) => !Number.isFinite(value))) state.feedback = "Enter three probabilities as fractions, decimals or percentages.";
      else {
        const correct = parsed.map((value, index) => Math.abs(value - protocols[index].exact) <= .001);
        if (correct.every(Boolean)) { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: endpoints 1/3, uniform radial distance 1/2, uniform disk midpoint 1/4."; }
        else if (Math.abs(parsed[0] - .25) <= .001 && Math.abs(parsed[2] - 1 / 3) <= .001 && correct[1]) state.feedback = "The radial answer is right, but endpoints and disk midpoint are reversed. Angular measure is not disk-area measure.";
        else state.feedback = `${correct.filter(Boolean).length} of 3 correct. Use angular interval, radial interval and disk area respectively.`;
      }
      renderAndFocus(renderApp, "#p156-answer-endpoints");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
