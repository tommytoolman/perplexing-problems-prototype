(function registerSpringloveOscillatorPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "6.3";
  const CHALLENGE = Object.freeze({ mass: 2, stiffness: 8, amplitude: 0.3, phase: 60 });
  const CHALLENGE_OMEGA = Math.sqrt(CHALLENGE.stiffness / CHALLENGE.mass);
  const CHALLENGE_PERIOD = 2 * Math.PI / CHALLENGE_OMEGA;
  const CHALLENGE_CROSSING = (Math.PI / 2 - Math.PI / 3) / CHALLENGE_OMEGA;
  const stages = Object.freeze([
    Object.freeze({ short: "Motion", title: "Set the oscillator’s clock", copy: "The cosine phase fixes the initial state. Time advances the phase by ωt while amplitude sets the turning points." }),
    Object.freeze({ short: "State", title: "Differentiate with the signs intact", copy: "Velocity is one quarter-cycle behind position; acceleration always points back towards equilibrium." }),
    Object.freeze({ short: "Energy", title: "Exchange spring and kinetic energy", copy: "Spring energy is greatest at the turning points and kinetic energy is greatest at equilibrium. Their sum remains constant." }),
  ]);
  const hints = Object.freeze([
    "Use x=A cos(ωt+φ). The equation m x¨=−kx gives ω=√(k/m).",
    "Differentiate the chosen cosine convention: v=−Aω sin(ωt+φ) and a=−Aω² cos(ωt+φ)=−ω²x.",
    "Crossing equilibrium means cos(ωt+φ)=0. Moving left means v<0, so sin(ωt+φ)>0.",
    "The first suitable phase after φ=π/3 is π/2. Thus 2t+π/3=π/2.",
    "Therefore t=(π/6)/2=π/12 seconds, approximately 0.2618 s.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p63-reset">Reset</button>';

  function radians(degrees) { return Number(degrees) * Math.PI / 180; }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 3) { if (Math.abs(value) < 0.5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18); }

  const initialState = () => ({ mass: CHALLENGE.mass, stiffness: CHALLENGE.stiffness, amplitude: CHALLENGE.amplitude, phase: CHALLENGE.phase, time: 0, stage: 0, answer: "", committed: false, feedback: "", feedbackTone: "neutral", hintsUsed: 0, revealed: false });
  let state = initialState();

  function oscillatorFor(mass = state.mass, stiffness = state.stiffness, amplitude = state.amplitude, phaseDegrees = state.phase, time = state.time) {
    const omega = Math.sqrt(stiffness / mass);
    const period = 2 * Math.PI / omega;
    const phase = omega * time + radians(phaseDegrees);
    const phaseWrapped = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const position = amplitude * Math.cos(phase);
    const velocity = -amplitude * omega * Math.sin(phase);
    const acceleration = -(omega ** 2) * position;
    const totalEnergy = 0.5 * stiffness * amplitude ** 2;
    const potentialEnergy = 0.5 * stiffness * position ** 2;
    const kineticEnergy = 0.5 * mass * velocity ** 2;
    return { omega, period, phase, phaseWrapped, phaseDegrees: phaseWrapped * 180 / Math.PI, position, velocity, acceleration, totalEnergy, potentialEnergy, kineticEnergy };
  }

  function directionLabel(values = oscillatorFor()) {
    if (Math.abs(values.velocity) < 0.002) return "at a turning point";
    return values.velocity > 0 ? "moving right" : "moving left";
  }

  function reconstructionNote() {
    return `<p class="osc6-reconstruction-note p63-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and introductory ^ marker. The scenario, values, interaction and solution below are newly written; they do not reproduce the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p63-stage-controls" role="group" aria-label="Mass-spring analysis stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p63-stage" data-p63-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p63-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p63-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Energy resolved" : "Next stage"}</button></div>`;
  }

  function springPath(startX, endX, y) {
    const lead = 18;
    const coils = 11;
    const usable = Math.max(30, endX - startX - 2 * lead);
    const points = [`${startX},${y}`, `${startX + lead},${y}`];
    for (let index = 1; index < coils; index += 1) {
      const x = startX + lead + usable * index / coils;
      const offset = index % 2 ? -15 : 15;
      points.push(`${format(x)},${y + offset}`);
    }
    points.push(`${endX - lead},${y}`, `${endX},${y}`);
    return points.join(" ");
  }

  function horizontalArrow(originX, y, value, scale, className, marker, label) {
    const sign = Math.sign(value);
    if (!sign) return `<g class="p63-vector ${className}"><circle cx="${originX}" cy="${y}" r="4"/><text x="${originX}" y="${y - 10}" text-anchor="middle">${label}=0</text></g>`;
    const endX = originX + sign * (26 + Math.min(72, Math.abs(value) / scale * 72));
    return `<g class="p63-vector ${className}"><line x1="${originX}" y1="${y}" x2="${format(endX)}" y2="${y}" marker-end="url(#${marker})"/><text x="${format((originX + endX) / 2)}" y="${y - 10}" text-anchor="middle">${label} ${signed(value, 2)}</text></g>`;
  }

  function oscillatorSvg() {
    const values = oscillatorFor();
    const equilibriumX = 350;
    const displacementScale = 300;
    const blockX = equilibriumX + values.position * displacementScale;
    const turnOffset = state.amplitude * displacementScale;
    const velocityScale = Math.max(0.01, state.amplitude * values.omega);
    const accelerationScale = Math.max(0.01, state.amplitude * values.omega ** 2);
    const potentialFraction = values.totalEnergy ? values.potentialEnergy / values.totalEnergy : 0;
    const kineticFraction = values.totalEnergy ? values.kineticEnergy / values.totalEnergy : 0;
    const phasePoint = { x: 598 + 57 * Math.cos(values.phaseWrapped), y: 212 - 57 * Math.sin(values.phaseWrapped) };
    return `
      <svg class="p63-svg p63-stage-${state.stage}" viewBox="0 0 720 455" role="img" aria-labelledby="p63-svg-title p63-svg-desc">
        <title id="p63-svg-title">Horizontal mass-spring oscillator with phase and energy views</title>
        <desc id="p63-svg-desc">Mass ${format(state.mass, 2)} kilograms, stiffness ${format(state.stiffness, 1)} newtons per metre, amplitude ${format(state.amplitude, 2)} metres and initial phase ${format(state.phase, 0)} degrees. At ${format(state.time, 2)} seconds, position ${signed(values.position)} metres, velocity ${signed(values.velocity)} metres per second and acceleration ${signed(values.acceleration)} metres per second squared.</desc>
        <defs><marker id="p63-arrow-v" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker><marker id="p63-arrow-a" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker></defs>
        <path class="p63-wall" d="M62 90 V294 M62 104 l-22 18 M62 136 l-22 18 M62 168 l-22 18 M62 200 l-22 18 M62 232 l-22 18 M62 264 l-22 18"/>
        <line class="p63-track" x1="62" y1="269" x2="548" y2="269"/>
        <line class="p63-equilibrium" x1="${equilibriumX}" y1="116" x2="${equilibriumX}" y2="292"/><text class="p63-axis-label" x="${equilibriumX}" y="307" text-anchor="middle">x=0</text>
        <line class="p63-turn" x1="${format(equilibriumX - turnOffset)}" y1="242" x2="${format(equilibriumX - turnOffset)}" y2="282"/><line class="p63-turn" x1="${format(equilibriumX + turnOffset)}" y1="242" x2="${format(equilibriumX + turnOffset)}" y2="282"/><text class="p63-axis-label" x="${format(equilibriumX - turnOffset)}" y="307" text-anchor="middle">−A</text><text class="p63-axis-label" x="${format(equilibriumX + turnOffset)}" y="307" text-anchor="middle">+A</text>
        <polyline class="p63-spring" points="${springPath(62, blockX - 38, 215)}"/>
        <g class="p63-block" transform="translate(${format(blockX)} 215)"><rect x="-38" y="-38" width="76" height="76" rx="8"/><text x="0" y="5" text-anchor="middle">m=${format(state.mass, 2)} kg</text></g>
        <text class="p63-position-label" x="${format(blockX)}" y="150" text-anchor="middle">x=${signed(values.position, 3)} m · ${directionLabel(values)}</text>
        <g class="p63-state-layer">${horizontalArrow(blockX, 129, values.velocity, velocityScale, "is-velocity", "p63-arrow-v", "v")}${horizontalArrow(blockX, 175, values.acceleration, accelerationScale, "is-acceleration", "p63-arrow-a", "a")}</g>

        <g class="p63-phase-layer"><circle class="p63-phase-clock" cx="598" cy="212" r="57"/><line x1="598" y1="212" x2="${format(phasePoint.x)}" y2="${format(phasePoint.y)}"/><circle class="p63-phase-point" cx="${format(phasePoint.x)}" cy="${format(phasePoint.y)}" r="6"/><text class="p63-phase-title" x="598" y="136" text-anchor="middle">phase ψ=${format(values.phaseDegrees, 1)}°</text><text x="668" y="216">x/A</text><text x="598" y="286" text-anchor="middle">advances with ωt</text></g>
        <g class="p63-status" transform="translate(506 42)"><rect width="180" height="67" rx="13"/><text class="p63-status-kicker" x="90" y="20" text-anchor="middle">OSCILLATOR CLOCK</text><text class="p63-status-value" x="90" y="41" text-anchor="middle">ω=${format(values.omega, 3)} rad/s</text><text class="p63-status-detail" x="90" y="57" text-anchor="middle">T=${format(values.period, 3)} s</text></g>

        <g class="p63-energy-layer"><text class="p63-energy-title" x="82" y="353">Energy exchange · total E=${format(values.totalEnergy, 3)} J</text><rect class="p63-energy-base" x="82" y="375" width="550" height="24" rx="8"/><rect class="p63-energy-u" x="82" y="375" width="${format(550 * potentialFraction)}" height="24" rx="8"/><rect class="p63-energy-k" x="${format(82 + 550 * potentialFraction)}" y="375" width="${format(550 * kineticFraction)}" height="24" rx="8"/><text x="82" y="423">spring U=${format(values.potentialEnergy, 3)} J</text><text x="632" y="423" text-anchor="end">kinetic K=${format(values.kineticEnergy, 3)} J</text></g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = oscillatorFor();
    return `<section class="p63-metrics" aria-live="polite"><div><span>Position</span><strong>x=${signed(values.position, 3)} m</strong></div><div><span>Velocity</span><strong>v=${state.stage >= 1 || state.revealed ? `${signed(values.velocity, 3)} m/s` : "stage 2"}</strong></div><div><span>Acceleration</span><strong>a=${state.stage >= 1 || state.revealed ? `${signed(values.acceleration, 3)} m/s²` : "stage 2"}</strong></div><p><strong>${directionLabel(values)}.</strong> Energy check: K+U=${format(values.kineticEnergy + values.potentialEnergy, 5)} J = ½kA².</p></section>`;
  }

  function controlsMarkup() {
    return `<section class="p63-controls" aria-label="Mass-spring oscillator controls"><label class="p63-time-control" for="p63-time"><span>Time t<strong data-p63-output="time">${format(state.time, 2)} s</strong></span><input id="p63-time" type="range" min="0" max="10" step="0.01" value="${state.time}"/></label><label for="p63-mass"><span>Mass m<strong data-p63-output="mass">${format(state.mass, 2)} kg</strong></span><input id="p63-mass" type="range" min="0.5" max="5" step="0.1" value="${state.mass}"/></label><label for="p63-stiffness"><span>Spring stiffness k<strong data-p63-output="stiffness">${format(state.stiffness, 1)} N/m</strong></span><input id="p63-stiffness" type="range" min="2" max="40" step="1" value="${state.stiffness}"/></label><label for="p63-amplitude"><span>Amplitude A<strong data-p63-output="amplitude">${format(state.amplitude, 2)} m</strong></span><input id="p63-amplitude" type="range" min="0.05" max="0.5" step="0.01" value="${state.amplitude}"/></label><label for="p63-phase"><span>Initial phase φ<strong data-p63-output="phase">${format(state.phase, 0)}°</strong></span><input id="p63-phase" type="range" min="0" max="360" step="1" value="${state.phase}"/></label><div class="p63-presets" role="group" aria-label="Oscillator presets"><button class="chip-button" type="button" data-problem-action="p63-challenge">Challenge setup</button><button class="chip-button" type="button" data-problem-action="p63-time-step" data-p63-step="0">Initial state</button><button class="chip-button" type="button" data-problem-action="p63-time-step" data-p63-step="0.125">Advance T/8</button><button class="chip-button" type="button" data-problem-action="p63-time-step" data-p63-step="0.25">Advance T/4</button></div><p>Convention: x=A cos(ωt+φ). Positive x and v point right.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p63-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p63-solution" aria-labelledby="p63-solution-heading"><h3 id="p63-solution-heading" tabindex="-1">Use the phase to choose the crossing</h3><p>Newton’s second law gives</p><div class="p63-equation">m x¨=−kx &nbsp;⇒&nbsp; x¨+(k/m)x=0</div><p>Therefore</p><div class="p63-equation">ω=√(k/m), &nbsp; T=2π√(m/k)</div><p>For m=2 kg and k=8 N/m, ω=2 rad/s and T=π s. With the stated cosine convention:</p><div class="p63-equation">x=0.3 cos(2t+π/3)<br>v=−0.6 sin(2t+π/3)<br>a=−4x</div><p>A leftward equilibrium crossing requires x=0 and v&lt;0, so the first phase is π/2:</p><div class="p63-equation p63-answer-equation">2t+π/3=π/2 &nbsp;⇒&nbsp; t=π/12=${format(CHALLENGE_CROSSING, 6)} s</div><p>At that instant x=0, v=−0.600 m/s, a=0 and all ${format(0.5 * CHALLENGE.stiffness * CHALLENGE.amplitude ** 2, 3)} J is kinetic.</p><p class="p63-insight"><strong>Checks.</strong> k/m has units (N/m)/kg=s⁻², so ω has units rad/s. Increasing mass lengthens the period; increasing k shortens it. Amplitude and phase change the state but not the ideal SHM period. The minus signs ensure both acceleration and the spring force point towards equilibrium.</p></section>`;
  }

  function stateSnapshot() { const values = oscillatorFor(); return JSON.stringify({ problem: PROBLEM, reconstruction: "title and introductory marker only", massKg: state.mass, stiffnessNewtonsPerMetre: state.stiffness, amplitudeMetres: state.amplitude, initialPhaseDegrees: state.phase, timeSeconds: state.time, phaseDegrees: Number(values.phaseDegrees.toFixed(6)), omegaRadiansPerSecond: Number(values.omega.toFixed(6)), periodSeconds: Number(values.period.toFixed(6)), positionMetres: Number(values.position.toFixed(6)), velocityMetresPerSecond: Number(values.velocity.toFixed(6)), accelerationMetresPerSecondSquared: Number(values.acceleration.toFixed(6)), kineticEnergyJoules: Number(values.kineticEnergy.toFixed(6)), springEnergyJoules: Number(values.potentialEnergy.toFixed(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2); }

  function render() {
    return `<main class="book-shell osc6-shell p63-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive oscillations</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread osc6-spread p63-spread"><article class="book-page p63-problem-page"><div class="problem-number">Problem 6.3</div><h1 class="book-title osc6-title p63-title">Dr Springlove’s Oscillator</h1><div class="difficulty p63-difficulty" aria-label="Introductory problem marker">^</div>${reconstructionNote()}<p class="problem-copy">A 2.0 kg block is attached to a horizontal spring of stiffness 8.0 N/m on a frictionless track. Its motion is x=A cos(ωt+φ), with A=0.30 m and φ=60°.</p><p class="problem-copy"><strong>At what first time after t=0 does the block cross equilibrium while moving left?</strong></p><section class="p63-convention-card"><strong>Exact phase convention</strong><p>Positive x points right. Phase φ is the angle inside the cosine at t=0; degrees shown by the control are converted to radians before calculation.</p></section><section class="p63-challenge-card"><strong>Challenge data stay fixed</strong><p>The answer uses m=2 kg, k=8 N/m, A=0.30 m and φ=60°. The controls then let you generalise the oscillator.</p></section></article><section class="book-page book-stage osc6-stage p63-stage">${stageControls()}<div class="p63-visual-card"><div data-p63-svg-slot>${oscillatorSvg()}</div>${stageCaption()}</div>${controlsMarkup()}<div data-p63-metrics-slot>${metricsMarkup()}</div></section><aside class="book-page book-coach p63-coach"><div class="coach-kicker">Catch the leftward crossing</div><p class="coach-question">Give the first t&gt;0 for which x=0 and v&lt;0 in the stated challenge.</p><form class="p63-answer-form" data-p63-answer-form novalidate><label for="p63-answer">First leftward equilibrium crossing</label><div><input id="p63-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 0.25" autocomplete="off"/><span>s</span></div><button class="primary-button" type="submit">Check crossing time</button></form>${feedbackMarkup()}<div class="button-row p63-help-row"><button class="secondary-button" type="button" data-problem-action="p63-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p63-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="osc6-debug">${debugPanel("Development state", stateSnapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p63-shell"); if (!root) return;
    const svgSlot = root.querySelector("[data-p63-svg-slot]"), metricsSlot = root.querySelector("[data-p63-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = oscillatorSvg(); if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = { time: `${format(state.time, 2)} s`, mass: `${format(state.mass, 2)} kg`, stiffness: `${format(state.stiffness, 1)} N/m`, amplitude: `${format(state.amplitude, 2)} m`, phase: `${format(state.phase, 0)}°` };
    Object.entries(outputs).forEach(([key, value]) => { const node = root.querySelector(`[data-p63-output="${key}"]`); if (node) node.textContent = value; });
    const values = oscillatorFor();
    root.querySelector("#p63-time")?.setAttribute("aria-valuetext", `${format(state.time, 2)} seconds; x ${signed(values.position, 3)} metres; ${directionLabel(values)}`);
    root.querySelector("#p63-mass")?.setAttribute("aria-valuetext", `${format(state.mass, 2)} kilograms; period ${format(values.period, 3)} seconds`);
    root.querySelector("#p63-stiffness")?.setAttribute("aria-valuetext", `${format(state.stiffness, 1)} newtons per metre; period ${format(values.period, 3)} seconds`);
    root.querySelector("#p63-amplitude")?.setAttribute("aria-valuetext", `${format(state.amplitude, 2)} metre amplitude; period unchanged at ${format(values.period, 3)} seconds`);
    root.querySelector("#p63-phase")?.setAttribute("aria-valuetext", `${format(state.phase, 0)} degree initial cosine phase`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function restoreChallenge(time = 0) { state.mass = CHALLENGE.mass; state.stiffness = CHALLENGE.stiffness; state.amplitude = CHALLENGE.amplitude; state.phase = CHALLENGE.phase; state.time = time; }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p63-reset") { state = initialState(); renderAndFocus(renderApp, "#p63-time"); return; }
      if (action === "p63-stage") { state.stage = clamp(Number(control.dataset.p63Stage), 0, 2); renderAndFocus(renderApp, `[data-p63-stage="${state.stage}"]`); return; }
      if (action === "p63-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p63-stage="${state.stage}"]`); return; }
      if (action === "p63-challenge") { restoreChallenge(); renderAndFocus(renderApp, "#p63-time"); return; }
      if (action === "p63-time-step") { const fraction = Number(control.dataset.p63Step); state.time = fraction === 0 ? 0 : clamp(state.time + fraction * oscillatorFor().period, 0, 10); renderAndFocus(renderApp, "#p63-time"); return; }
      if (action === "p63-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p63-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(CHALLENGE_CROSSING); }
      renderApp(); if (action === "p63-reveal") window.requestAnimationFrame(() => document.querySelector("#p63-solution-heading")?.focus());
    }));
    [{ selector: "#p63-time", key: "time", min: 0, max: 10 }, { selector: "#p63-mass", key: "mass", min: 0.5, max: 5 }, { selector: "#p63-stiffness", key: "stiffness", min: 2, max: 40 }, { selector: "#p63-amplitude", key: "amplitude", min: 0.05, max: 0.5 }, { selector: "#p63-phase", key: "phase", min: 0, max: 360 }].forEach(({ selector, key, min, max }) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), min, max); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p63-answer"); answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p63-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one first-crossing time in seconds.";
      else if (Math.abs(answer - CHALLENGE_CROSSING) <= 0.003) { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(CHALLENGE_CROSSING); state.feedback = `Correct: t=π/12=${format(CHALLENGE_CROSSING, 6)} s. There x=0, v=−0.600 m/s and a=0.`; }
      else if (Math.abs(answer - CHALLENGE_PERIOD / 4) <= 0.01) state.feedback = "T/4 would apply from a turning point. This oscillator starts at phase 60°, so it is already partway towards the leftward crossing at 90°.";
      else state.feedback = "Require phase ψ=π/2, not merely x=0: that choice also makes v=−Aω negative. Solve 2t+π/3=π/2.";
      renderAndFocus(renderApp, "#p63-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
