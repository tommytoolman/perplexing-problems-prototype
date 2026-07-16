(function registerChangingPipePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "18.3";
  const PIPE_LENGTH_METRES = 0.85;
  const SOUND_SPEED_METRES_PER_SECOND = 340;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Ends", title: "Translate the end conditions into pressure markers", copy: "An open end is a pressure node. A closed rigid end is a pressure antinode. Air-displacement nodes and antinodes are the opposite way round." }),
    Object.freeze({ short: "Modes", title: "Fit only standing waves that obey both ends", copy: "With one end closed, the length holds an odd number of quarter-wavelengths. With both ends open, it holds a whole number of half-wavelengths." }),
    Object.freeze({ short: "Switch", title: "Compare the two fundamental wavelengths", copy: "The closed far end gives λ=4L and 100 Hz. Opening it changes the condition to λ=2L and raises the fundamental to 200 Hz." }),
  ]);
  const hints = Object.freeze([
    "For pressure waves, the permanently open near end is a node. The far end is an antinode while capped and another node after opening.",
    "Open–closed fundamental: L=λ/4. Therefore f=c/λ=c/(4L).",
    "Open–open fundamental: L=λ/2. Therefore f=c/λ=c/(2L).",
    "Use L=0.85 m and c=340 m/s: closed gives 340/(4×0.85), while open gives 340/(2×0.85).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p183-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function ordinal(number) { const mod100 = number % 100; if (mod100 >= 11 && mod100 <= 13) return `${number}th`; return `${number}${number % 10 === 1 ? "st" : number % 10 === 2 ? "nd" : number % 10 === 3 ? "rd" : "th"}`; }

  function pressureProfile(boundary, mode, normalizedPosition) {
    return boundary === "closed" ? Math.sin((2 * mode - 1) * Math.PI * normalizedPosition / 2) : Math.sin(mode * Math.PI * normalizedPosition);
  }

  function modeData(boundary, mode, length = PIPE_LENGTH_METRES, speed = SOUND_SPEED_METRES_PER_SECOND) {
    const ordinalMode = clamp(Math.round(mode), 1, 5);
    const harmonic = boundary === "closed" ? 2 * ordinalMode - 1 : ordinalMode;
    const wavelengthMetres = boundary === "closed" ? 4 * length / harmonic : 2 * length / harmonic;
    const frequencyHertz = boundary === "closed" ? speed * harmonic / (4 * length) : speed * harmonic / (2 * length);
    const nodesMetres = boundary === "closed"
      ? Array.from({ length: ordinalMode }, (_, index) => 2 * index * length / harmonic)
      : Array.from({ length: ordinalMode + 1 }, (_, index) => index * length / ordinalMode);
    const antinodesMetres = boundary === "closed"
      ? Array.from({ length: ordinalMode }, (_, index) => (2 * index + 1) * length / harmonic)
      : Array.from({ length: ordinalMode }, (_, index) => (index + .5) * length / ordinalMode);
    return { boundary, mode: ordinalMode, harmonic, wavelengthMetres, frequencyHertz, nodesMetres, antinodesMetres, waveSpeedResidual: speed - frequencyHertz * wavelengthMetres, nearEndPressure: "node", farEndPressure: boundary === "closed" ? "antinode" : "node", lengthIdentity: boundary === "closed" ? `${harmonic}λ/4` : `${harmonic}λ/2` };
  }

  const CLOSED_FUNDAMENTAL = modeData("closed", 1);
  const OPEN_FUNDAMENTAL = modeData("open", 1);

  function parseFrequency(raw) { const match = String(raw).trim().replaceAll(",", ".").match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/); return match ? Number(match[0]) : NaN; }
  function initialState() { return { boundary: "closed", mode: 1, boardMessage: "The far cap is closed: pressure is a node at the near opening and an antinode at the cap.", stage: 0, answers: { closed: "", open: "" }, feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function restoreChallenge() { state.boundary = "closed"; state.mode = 1; state.boardMessage = "Challenge restored to the capped fundamental: 100 Hz before the far end opens."; }
  function setBoundary(boundary) { state.boundary = boundary === "open" ? "open" : "closed"; state.mode = 1; const data = modeData(state.boundary, state.mode); state.boardMessage = state.boundary === "closed" ? `Far end closed: the pressure antinode makes a quarter-wave fundamental at ${format(data.frequencyHertz, 2)} Hz.` : `Far end open: the pressure node makes a half-wave fundamental at ${format(data.frequencyHertz, 2)} Hz.`; }
  function setMode(mode) { state.mode = clamp(Math.round(mode), 1, 5); const data = modeData(state.boundary, state.mode); state.boardMessage = `${ordinal(data.harmonic)} harmonic selected: λ=${format(data.wavelengthMetres, 4)} m and f=${format(data.frequencyHertz, 2)} Hz.`; }

  function stageControls() {
    return `<div class="p183-stage-controls" role="group" aria-label="Standing-wave reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p183-stage" data-p183-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p183-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p183-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Frequency switch exposed" : "Next stage"}</button></div>`;
  }

  function wavePath(boundary, mode) {
    const points = Array.from({ length: 121 }, (_, index) => { const normalized = index / 120, x = 72 + 400 * normalized, y = 212 - 68 * pressureProfile(boundary, mode, normalized); return `${index ? "L" : "M"}${format(x, 3)} ${format(y, 3)}`; });
    return points.join("");
  }

  function pipeSvg() {
    const data = modeData(state.boundary, state.mode), pipeStart = 72, pipeWidth = 400, centreY = 212;
    const nodes = data.nodesMetres.map((position) => { const x = pipeStart + pipeWidth * position / PIPE_LENGTH_METRES; return `<g class="p183-node-marker"><circle cx="${format(x, 3)}" cy="${centreY}" r="7"/><text x="${format(x, 3)}" y="${centreY + 24}" text-anchor="middle">N</text></g>`; }).join("");
    const antinodes = data.antinodesMetres.map((position) => { const normalized = position / PIPE_LENGTH_METRES, x = pipeStart + pipeWidth * normalized, y = centreY - 68 * pressureProfile(state.boundary, state.mode, normalized); return `<g class="p183-antinode-marker"><line x1="${format(x, 3)}" y1="${centreY}" x2="${format(x, 3)}" y2="${format(y, 3)}"/><circle cx="${format(x, 3)}" cy="${format(y, 3)}" r="7"/><text x="${format(x, 3)}" y="${y < centreY ? format(y - 13, 3) : format(y + 19, 3)}" text-anchor="middle">A</text></g>`; }).join("");
    const nodePositions = data.nodesMetres.map((position) => format(position, 4)).join(", "), antinodePositions = data.antinodesMetres.map((position) => format(position, 4)).join(", ");
    return `<svg class="p183-pipe p183-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p183-svg-title p183-svg-desc"><title id="p183-svg-title">Pressure standing wave in a pipe with selectable far-end boundary</title><desc id="p183-svg-desc">The pipe is ${PIPE_LENGTH_METRES} metres long and sound speed is ${SOUND_SPEED_METRES_PER_SECOND} metres per second. Its near end is open and its far end is ${state.boundary}. Selected mode ${state.mode} is harmonic ${data.harmonic}, frequency ${format(data.frequencyHertz, 4)} hertz and wavelength ${format(data.wavelengthMetres, 6)} metres. Pressure-node positions from the near end are ${nodePositions} metres. Pressure-antinode positions are ${antinodePositions} metres.</desc><defs><linearGradient id="p183-tube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e8790"/><stop offset=".5" stop-color="#dbe3df"/><stop offset="1" stop-color="#607982"/></linearGradient></defs><rect class="p183-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p183-board-kicker" x="22" y="27">PRESSURE STANDING WAVE · OPEN END = NODE · CLOSED END = ANTINODE</text><rect class="p183-pipe-body" x="62" y="100" width="420" height="224" rx="12"/><rect class="p183-pipe-air" x="72" y="112" width="400" height="200"/><path class="p183-open-rim" d="M72 104q-18 18 0 36M72 284q-18 18 0 36"/>${state.boundary === "closed" ? `<rect class="p183-closed-cap" x="469" y="94" width="25" height="236" rx="5"/><text class="p183-boundary-label" x="481" y="351" text-anchor="middle">CLOSED · PRESSURE ANTINODE</text>` : `<path class="p183-open-rim" d="M472 104q18 18 0 36M472 284q18 18 0 36"/><text class="p183-boundary-label" x="472" y="351" text-anchor="middle">OPEN · PRESSURE NODE</text>`}<text class="p183-boundary-label" x="72" y="351" text-anchor="middle">OPEN · PRESSURE NODE</text><line class="p183-axis" x1="72" y1="${centreY}" x2="472" y2="${centreY}"/><path class="p183-wave" d="${wavePath(state.boundary, state.mode)}"/><g class="p183-markers">${antinodes}${nodes}</g><g class="p183-length-bracket"><line x1="72" y1="382" x2="472" y2="382"/><line x1="72" y1="374" x2="72" y2="390"/><line x1="472" y1="374" x2="472" y2="390"/><text x="272" y="403" text-anchor="middle">L=${PIPE_LENGTH_METRES} m = ${data.lengthIdentity}</text></g><g class="p183-ledger" transform="translate(522 56)"><rect class="p183-ledger-bg" width="214" height="314" rx="15"/><text class="p183-ledger-title" x="16" y="27">MODE AUDIT</text><text class="p183-ledger-label" x="16" y="66">far boundary</text><text class="p183-ledger-value" x="198" y="66" text-anchor="end">${state.boundary.toUpperCase()}</text><text class="p183-ledger-label" x="16" y="91">mode ordinal</text><text class="p183-ledger-value" x="198" y="91" text-anchor="end">${state.mode}</text><text class="p183-ledger-label" x="16" y="116">allowed harmonic</text><text class="p183-ledger-value" x="198" y="116" text-anchor="end">${data.harmonic}</text><line class="p183-ledger-rule" x1="16" y1="136" x2="198" y2="136"/><text class="p183-ledger-kicker" x="16" y="168">BOUNDARY FIT</text><text class="p183-ledger-label" x="16" y="194">pressure nodes</text><text class="p183-ledger-value" x="198" y="194" text-anchor="end">${data.nodesMetres.length}</text><text class="p183-ledger-label" x="16" y="219">pressure antinodes</text><text class="p183-ledger-value" x="198" y="219" text-anchor="end">${data.antinodesMetres.length}</text><text class="p183-ledger-label" x="16" y="244">wavelength λ</text><text class="p183-ledger-value" x="198" y="244" text-anchor="end">${format(data.wavelengthMetres, 4)} m</text><rect class="p183-result-box" x="12" y="261" width="190" height="40" rx="9"/><text class="p183-result-label" x="24" y="278">FREQUENCY</text><text class="p183-result-value" x="190" y="290" text-anchor="end">${format(data.frequencyHertz, 2)} Hz</text></g><g class="p183-marker-key" transform="translate(82 70)"><circle class="node" cx="0" cy="0" r="6"/><text x="11" y="3">N pressure node</text><circle class="antinode" cx="100" cy="0" r="6"/><text x="111" y="3">A pressure antinode</text></g></svg>`;
  }

  function modeControls() {
    return `<section class="p183-controls" aria-label="Pipe boundary and harmonic controls"><div class="p183-boundary-buttons" role="group" aria-label="Far-end boundary condition"><button class="secondary-button ${state.boundary === "closed" ? "active" : ""}" type="button" data-problem-action="p183-boundary" data-p183-boundary="closed" aria-pressed="${state.boundary === "closed"}">Far end closed</button><button class="secondary-button ${state.boundary === "open" ? "active" : ""}" type="button" data-problem-action="p183-boundary" data-p183-boundary="open" aria-pressed="${state.boundary === "open"}">Far end open</button></div><div class="p183-mode-buttons" role="group" aria-label="Select a resonant mode">${Array.from({ length: 5 }, (_, index) => { const mode = index + 1, data = modeData(state.boundary, mode); return `<button class="secondary-button ${state.mode === mode ? "active" : ""}" type="button" data-problem-action="p183-mode" data-p183-mode="${mode}" aria-pressed="${state.mode === mode}"><small>mode ${mode}</small><strong>${ordinal(data.harmonic)} harmonic</strong><span>${format(data.frequencyHertz, 0)} Hz</span></button>`; }).join("")}</div><p role="status">${state.boardMessage}</p></section>`;
  }

  function comparisonMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    return `<section class="p183-comparison" aria-labelledby="p183-comparison-heading"><div><span class="eyebrow">Fundamental before and after</span><h3 id="p183-comparison-heading">Opening the cap halves λ and doubles f</h3></div><article><span>far end closed</span><strong>λ=4L=3.4 m</strong><b>f₁=100 Hz</b><small>odd harmonics 100, 300, 500, …</small></article><i aria-hidden="true">→</i><article class="is-open"><span>far end opened</span><strong>λ=2L=1.7 m</strong><b>f₁=200 Hz</b><small>harmonics 200, 400, 600, …</small></article></section>`;
  }

  function metricsMarkup() {
    const data = modeData(state.boundary, state.mode);
    return `<section class="p183-metrics" aria-live="polite"><div><span>Boundary pair</span><strong>open–${state.boundary}</strong></div><div><span>Allowed harmonic</span><strong>${data.harmonic}</strong></div><div><span>Selected resonance</span><strong>${format(data.frequencyHertz, 2)} Hz</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p183-dynamic"><div class="p183-pipe-wrap">${pipeSvg()}${modeControls()}</div>${comparisonMarkup()}${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p183-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p183-solution" aria-labelledby="p183-solution-heading"><h3 id="p183-solution-heading" tabindex="-1">The far-end boundary changes a quarter-wave into a half-wave</h3><p>Initially the near end is open and the far end is closed. Pressure must be a node at the opening and an antinode at the cap, so the fundamental fits one quarter-wavelength into the pipe.</p><div class="p183-equation">L=λ/4 ⇒ λ=4L=3.4 m<br>f=c/λ=340/3.4=100 Hz</div><p>The higher open–closed resonances contain 3, 5, 7, … quarter-wavelengths, hence only odd harmonics: 100, 300, 500, … Hz.</p><p>After the cap opens, pressure is a node at both ends. The fundamental now fits half a wavelength.</p><div class="p183-equation is-answer">L=λ/2 ⇒ λ=2L=1.7 m<br>f=c/λ=340/1.7=200 Hz<br>before → after: 100 Hz → 200 Hz</div><p>These are pressure patterns. The corresponding air-displacement nodes and antinodes are interchanged.</p></section>`;
  }

  function snapshot() {
    const data = modeData(state.boundary, state.mode);
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "ideal one-dimensional pressure standing waves; open end is pressure node; rigid closed end is pressure antinode", pipeLengthMetres: PIPE_LENGTH_METRES, soundSpeedMetresPerSecond: SOUND_SPEED_METRES_PER_SECOND, farEndBoundary: state.boundary, nearEndBoundary: "open", selectedModeOrdinal: state.mode, selectedAllowedHarmonic: data.harmonic, wavelengthMetres: Number(data.wavelengthMetres.toFixed(12)), frequencyHertz: Number(data.frequencyHertz.toFixed(12)), pressureNodePositionsMetres: data.nodesMetres.map((position) => Number(position.toFixed(12))), pressureAntinodePositionsMetres: data.antinodesMetres.map((position) => Number(position.toFixed(12))), nearEndPressure: data.nearEndPressure, farEndPressure: data.farEndPressure, waveSpeedIdentityResidual: Number(data.waveSpeedResidual.toExponential(6)), closedPipeFirstFiveHertz: Array.from({ length: 5 }, (_, index) => modeData("closed", index + 1).frequencyHertz), openPipeFirstFiveHertz: Array.from({ length: 5 }, (_, index) => modeData("open", index + 1).frequencyHertz), challengeAnswer: { beforeClosedFundamentalHertz: CLOSED_FUNDAMENTAL.frequencyHertz, afterOpenFundamentalHertz: OPEN_FUNDAMENTAL.frequencyHertz }, stage: state.stage + 1, answers: state.answers, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p183-shell"><div class="p183-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Sound and standing waves</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p183-spread"><article class="book-page p183-problem-page"><div class="problem-number">Problem 18.3</div><h1 class="book-title p183-title">The Pipe That Changed Its Mind</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="problem-copy">A 0.85 m pipe is open at the near end and initially capped at the far end. Take the sound speed as 340 m/s. Its resonances begin 100, 300, 500, … Hz.</p><p class="problem-copy"><strong>What is the fundamental before the cap opens, and what does it become immediately after the far end is opened?</strong></p><section class="p183-observation-card"><strong>The wave must obey both ends</strong><p>Changing the far end from a pressure antinode to a pressure node replaces the quarter-wave fundamental with a half-wave.</p></section><section class="p183-model-card"><div class="eyebrow">Ideal acoustic pipe</div><p>End corrections, damping and temperature gradients are ignored. The diagram shows pressure amplitude; air displacement has the opposite nodes and antinodes.</p></section></article><section class="book-page book-stage p183-stage">${stageControls()}<div class="p183-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p183-coach"><div class="coach-kicker">Name both fundamentals</div><p class="coach-question">Enter the closed-far-end fundamental and the opened-far-end fundamental.</p><form class="p183-answer-form" data-p183-answer-form novalidate><label for="p183-answer-closed">Before · far end closed</label><div><input id="p183-answer-closed" data-p183-answer="closed" type="text" inputmode="decimal" value="${escapeAttribute(state.answers.closed)}" placeholder="frequency" autocomplete="off"/><span>Hz</span></div><label for="p183-answer-open">After · far end opened</label><div><input id="p183-answer-open" data-p183-answer="open" type="text" inputmode="decimal" value="${escapeAttribute(state.answers.open)}" placeholder="frequency" autocomplete="off"/><span>Hz</span></div><button class="primary-button" type="submit">Check both frequencies</button></form>${feedbackMarkup()}<div class="button-row p183-help-row"><button class="secondary-button" type="button" data-problem-action="p183-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p183-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p183-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p183-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p183-reset") { resetChallenge(); renderAndFocus(renderApp, '[data-p183-boundary="closed"]'); return; }
      if (action === "p183-stage") { state.stage = clamp(Number(control.dataset.p183Stage), 0, 2); renderAndFocus(renderApp, `[data-p183-stage="${state.stage}"]`); return; }
      if (action === "p183-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p183-stage="${state.stage}"]`); return; }
      if (action === "p183-boundary") { setBoundary(control.dataset.p183Boundary); renderAndFocus(renderApp, `[data-p183-boundary="${state.boundary}"]`); return; }
      if (action === "p183-mode") { setMode(Number(control.dataset.p183Mode)); renderAndFocus(renderApp, `[data-p183-mode="${state.mode}"]`); return; }
      if (action === "p183-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p183-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p183-reveal") window.requestAnimationFrame(() => document.querySelector("#p183-solution-heading")?.focus());
    });
    root?.querySelectorAll("[data-p183-answer]").forEach((input) => input.addEventListener("input", (event) => { state.answers[event.target.dataset.p183Answer] = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }));
    root?.querySelector("[data-p183-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const closedRaw = event.currentTarget.querySelector('[data-p183-answer="closed"]')?.value || "", openRaw = event.currentTarget.querySelector('[data-p183-answer="open"]')?.value || "", closed = parseFrequency(closedRaw), open = parseFrequency(openRaw); state.answers = { closed: closedRaw.trim(), open: openRaw.trim() }; state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(closed) || !Number.isFinite(open)) state.feedback = "Enter both frequencies in hertz.";
      else if (Math.abs(closed - 200) <= .1 && Math.abs(open - 100) <= .1) state.feedback = "Those are reversed. Opening the far end shortens the fundamental wavelength and raises the frequency.";
      else {
        const closedCorrect = Math.abs(closed - 100) <= .1, openCorrect = Math.abs(open - 200) <= .1;
        if (closedCorrect && openCorrect) { state.feedbackTone = "success"; state.feedback = "Correct: the fundamental changes from 100 Hz to 200 Hz."; state.committed = true; state.stage = 2; }
        else state.feedback = `${Number(closedCorrect) + Number(openCorrect)} of 2 correct. Use λ=4L before opening and λ=2L afterwards.`;
      }
      renderAndFocus(renderApp, "#p183-answer-closed");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
