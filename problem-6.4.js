(function registerInfernalOscillatorPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "6.4";
  const QUESTION_MASS = 2;
  const QUESTION_OUTER_K = 18;
  const QUESTION_COUPLING_K = 7;
  const AMPLITUDE = 0.55;
  const PIXELS_PER_METRE = 65;
  const BASE_1 = 240;
  const BASE_2 = 460;
  const MASS_HALF_WIDTH = 32;
  const SPRING_Y = 215;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p64-reset">Reset</button>';
  const hints = Object.freeze([
    "Write the equations as m x₁″ = −(k + κ)x₁ + κx₂ and m x₂″ = κx₁ − (k + κ)x₂.",
    "In the out-of-phase mode the displacements are opposite: x₂ = −x₁.",
    "Substitute x₂ = −x₁ into the first equation. It becomes m x₁″ = −(k + 2κ)x₁.",
    "Therefore ω² = (k + 2κ)/m. Use k = 18 N/m, κ = 7 N/m and m = 2 kg.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question values", mass: 2, outerK: 18, couplingK: 7 }),
    Object.freeze({ label: "Uncoupled", mass: 2, outerK: 18, couplingK: 0 }),
    Object.freeze({ label: "No outer springs", mass: 2, outerK: 0, couplingK: 7 }),
    Object.freeze({ label: "Strong coupling", mass: 2, outerK: 18, couplingK: 20 }),
  ]);
  const modes = Object.freeze([
    Object.freeze({ key: "in", label: "In phase" }),
    Object.freeze({ key: "out", label: "Out of phase" }),
    Object.freeze({ key: "mixed", label: "Mixed excitation" }),
  ]);

  const initialState = () => ({
    mass: QUESTION_MASS,
    outerK: QUESTION_OUTER_K,
    couplingK: QUESTION_COUPLING_K,
    mode: "out",
    time: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toString();
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function inPhaseOmega(mass = state.mass, outerK = state.outerK) {
    return Math.sqrt(outerK / mass);
  }

  function outOfPhaseOmega(mass = state.mass, outerK = state.outerK, couplingK = state.couplingK) {
    return Math.sqrt((outerK + 2 * couplingK) / mass);
  }

  function questionAnswer() {
    return outOfPhaseOmega(QUESTION_MASS, QUESTION_OUTER_K, QUESTION_COUPLING_K);
  }

  function modeCopy() {
    if (state.mode === "in") return "In phase · x₁ = x₂";
    if (state.mode === "out") return "Out of phase · x₁ = −x₂";
    return "Mixed · both normal modes excited";
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.mass - state.mass) < 0.001
      && Math.abs(preset.outerK - state.outerK) < 0.001
      && Math.abs(preset.couplingK - state.couplingK) < 0.001
    ));
  }

  function motionAt(time = state.time) {
    const omegaIn = inPhaseOmega();
    const omegaOut = outOfPhaseOmega();
    if (state.mode === "in") {
      const displacement = AMPLITUDE * Math.cos(omegaIn * time);
      const velocity = -AMPLITUDE * omegaIn * Math.sin(omegaIn * time);
      return { x1: displacement, x2: displacement, v1: velocity, v2: velocity };
    }
    if (state.mode === "out") {
      const displacement = AMPLITUDE * Math.cos(omegaOut * time);
      const velocity = -AMPLITUDE * omegaOut * Math.sin(omegaOut * time);
      return { x1: displacement, x2: -displacement, v1: velocity, v2: -velocity };
    }
    const inCoordinate = Math.cos(omegaIn * time);
    const outCoordinate = Math.cos(omegaOut * time);
    const inVelocity = omegaIn * Math.sin(omegaIn * time);
    const outVelocity = omegaOut * Math.sin(omegaOut * time);
    return {
      x1: (AMPLITUDE / 2) * (inCoordinate + outCoordinate),
      x2: (AMPLITUDE / 2) * (inCoordinate - outCoordinate),
      v1: -(AMPLITUDE / 2) * (inVelocity + outVelocity),
      v2: -(AMPLITUDE / 2) * (inVelocity - outVelocity),
    };
  }

  function energyAt(time = state.time) {
    const motion = motionAt(time);
    const kinetic = 0.5 * state.mass * (motion.v1 ** 2 + motion.v2 ** 2);
    const outerPotential = 0.5 * state.outerK * (motion.x1 ** 2 + motion.x2 ** 2);
    const couplingPotential = 0.5 * state.couplingK * (motion.x2 - motion.x1) ** 2;
    return {
      kinetic,
      outerPotential,
      couplingPotential,
      potential: outerPotential + couplingPotential,
      total: kinetic + outerPotential + couplingPotential,
    };
  }

  function springPath(startX, endX, y, turns = 7, amplitude = 10) {
    const lead = Math.min(13, Math.max(4, (endX - startX) * 0.14));
    const innerStart = startX + lead;
    const innerEnd = endX - lead;
    const points = [`M${startX.toFixed(2)},${y}`, `L${innerStart.toFixed(2)},${y}`];
    const segments = turns * 2;
    for (let index = 1; index < segments; index += 1) {
      const fraction = index / segments;
      const x = innerStart + (innerEnd - innerStart) * fraction;
      const offset = index % 2 ? -amplitude : amplitude;
      points.push(`L${x.toFixed(2)},${(y + offset).toFixed(2)}`);
    }
    points.push(`L${innerEnd.toFixed(2)},${y}`, `L${endX.toFixed(2)},${y}`);
    return points.join(" ");
  }

  function velocityGeometry(position, velocity) {
    const visible = Math.abs(velocity) > 0.015;
    const length = visible ? clamp(14 + Math.abs(velocity) * 14, 14, 66) : 0;
    return { visible, endX: position + Math.sign(velocity || 1) * length };
  }

  function geometry() {
    const motion = motionAt();
    const mass1X = BASE_1 + motion.x1 * PIXELS_PER_METRE;
    const mass2X = BASE_2 + motion.x2 * PIXELS_PER_METRE;
    const leftSpring = springPath(48, mass1X - MASS_HALF_WIDTH, SPRING_Y, 8);
    const couplingSpring = springPath(mass1X + MASS_HALF_WIDTH, mass2X - MASS_HALF_WIDTH, SPRING_Y, 7, 9);
    const rightSpring = springPath(mass2X + MASS_HALF_WIDTH, 652, SPRING_Y, 8);
    const velocity1 = velocityGeometry(mass1X, motion.v1);
    const velocity2 = velocityGeometry(mass2X, motion.v2);
    const couplingExtension = motion.x2 - motion.x1;
    const couplingState = Math.abs(couplingExtension) < 0.015 ? "neutral" : couplingExtension > 0 ? "stretched" : "compressed";
    return { motion, mass1X, mass2X, leftSpring, couplingSpring, rightSpring, velocity1, velocity2, couplingExtension, couplingState };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const energy = energyAt();
    const referenceEnergy = energyAt(0).total;
    const energyScale = Math.max(referenceEnergy, 1e-9);
    return `
      <div class="p64-apparatus-wrap">
        <svg class="p64-apparatus" viewBox="0 0 700 400" role="img" aria-labelledby="p64-apparatus-title p64-apparatus-desc">
          <title id="p64-apparatus-title">Two equal masses coupled by three springs</title>
          <desc id="p64-apparatus-desc">Two ${format(state.mass, 1)} kilogram masses are each attached to a wall by a ${format(state.outerK, 1)} newton per metre spring and coupled by a ${format(state.couplingK, 1)} newton per metre spring. ${modeCopy()}. At time ${format(state.time, 2)} seconds their displacements are ${format(shape.motion.x1, 2)} and ${format(shape.motion.x2, 2)} metres. Total mechanical energy is ${format(energy.total, 3)} joules.</desc>
          <defs>
            <marker id="p64-arrow-velocity" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <path class="p64-wall" d="M42 105v220M658 105v220M24 105h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m616-198h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18m-18 22h18" />
          <line class="p64-rail" x1="42" y1="263" x2="658" y2="263" />
          <line class="p64-equilibrium" x1="${BASE_1}" y1="142" x2="${BASE_1}" y2="290" /><line class="p64-equilibrium" x1="${BASE_2}" y1="142" x2="${BASE_2}" y2="290" />
          <path class="p64-spring is-outer" data-p64-spring="left" d="${shape.leftSpring}" />
          <path class="p64-spring is-coupling is-${shape.couplingState}" data-p64-spring="coupling" d="${shape.couplingSpring}" />
          <path class="p64-spring is-outer" data-p64-spring="right" d="${shape.rightSpring}" />
          <g class="p64-mass p64-mass-one" data-p64-mass="1" transform="translate(${shape.mass1X.toFixed(2)} ${SPRING_Y})"><rect x="-${MASS_HALF_WIDTH}" y="-35" width="${MASS_HALF_WIDTH * 2}" height="70" rx="9" /><text y="5" text-anchor="middle">m₁</text></g>
          <g class="p64-mass p64-mass-two" data-p64-mass="2" transform="translate(${shape.mass2X.toFixed(2)} ${SPRING_Y})"><rect x="-${MASS_HALF_WIDTH}" y="-35" width="${MASS_HALF_WIDTH * 2}" height="70" rx="9" /><text y="5" text-anchor="middle">m₂</text></g>
          <line class="p64-displacement" data-p64-displacement="1" x1="${BASE_1}" y1="303" x2="${shape.mass1X.toFixed(2)}" y2="303" />
          <line class="p64-displacement" data-p64-displacement="2" x1="${BASE_2}" y1="336" x2="${shape.mass2X.toFixed(2)}" y2="336" />
          <text class="p64-displacement-label is-one" data-p64-displacement-label="1" x="${shape.mass1X.toFixed(2)}" y="299" text-anchor="middle">x₁ = ${format(shape.motion.x1, 2)} m</text>
          <text class="p64-displacement-label is-two" data-p64-displacement-label="2" x="${shape.mass2X.toFixed(2)}" y="355" text-anchor="middle">x₂ = ${format(shape.motion.x2, 2)} m</text>
          <g class="p64-velocity" data-p64-velocity="1" opacity="${shape.velocity1.visible ? 1 : 0}"><line x1="${shape.mass1X.toFixed(2)}" y1="151" x2="${shape.velocity1.endX.toFixed(2)}" y2="151" marker-end="url(#p64-arrow-velocity)" /><text x="${shape.velocity1.endX.toFixed(2)}" y="139" text-anchor="middle">v₁</text></g>
          <g class="p64-velocity" data-p64-velocity="2" opacity="${shape.velocity2.visible ? 1 : 0}"><line x1="${shape.mass2X.toFixed(2)}" y1="151" x2="${shape.velocity2.endX.toFixed(2)}" y2="151" marker-end="url(#p64-arrow-velocity)" /><text x="${shape.velocity2.endX.toFixed(2)}" y="139" text-anchor="middle">v₂</text></g>
          <text class="p64-spring-label" data-p64-outer-label x="112" y="194">k = ${format(state.outerK, 1)} N/m</text>
          <text class="p64-spring-label is-coupling" x="350" y="194" text-anchor="middle" data-p64-live="coupling-label">κ = ${format(state.couplingK, 1)} N/m · ${shape.couplingState}</text>
          <text class="p64-spring-label" data-p64-outer-label x="588" y="194" text-anchor="end">k = ${format(state.outerK, 1)} N/m</text>
          <text class="p64-time-label" x="350" y="383" text-anchor="middle" data-p64-live="time-label">t = ${format(state.time, 2)} s · ${modeCopy()}</text>
        </svg>
        <div class="p64-energy-strip">
          <div><span>Kinetic energy</span><strong data-p64-live="kinetic-energy">${format(energy.kinetic, 3)} J</strong><i style="--p64-size:${((energy.kinetic / energyScale) * 100).toFixed(2)}%"></i></div>
          <div class="p64-energy-total"><span>Undamped total</span><strong data-p64-live="total-energy">${format(energy.total, 3)} J</strong><small data-p64-live="energy-drift">drift ${format(energy.total - referenceEnergy, 6)} J</small></div>
          <div><span>Spring potential</span><strong data-p64-live="potential-energy">${format(energy.potential, 3)} J</strong><i style="--p64-size:${((energy.potential / energyScale) * 100).toFixed(2)}%"></i></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit, digits = 1) {
    return `
      <label class="p64-range-row" for="p64-${kind}-slider">
        <span><strong>${label}</strong><output data-p64-live="${kind}">${format(value, digits)}${unit}</output></span>
        <input id="p64-${kind}-slider" data-p64-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "mass" ? "each mass" : kind === "coupling-k" ? "middle spring" : "both outer springs"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p64-controls">
        ${sliderMarkup("outer-k", "Outer stiffness · k", 0, 40, 1, state.outerK, " N/m", 0)}
        ${sliderMarkup("coupling-k", "Coupling stiffness · κ", 0, 25, 1, state.couplingK, " N/m", 0)}
        ${sliderMarkup("mass", "Mass · m", 0.5, 5, 0.25, state.mass, " kg", 2)}
        <div class="p64-mode-picker" aria-label="Excitation mode">${modes.map((mode) => `<button class="chip-button p64-mode-button ${state.mode === mode.key ? "active" : ""}" type="button" data-problem-action="p64-mode" data-p64-mode="${mode.key}" aria-pressed="${state.mode === mode.key}">${mode.label}</button>`).join("")}</div>
        <label class="p64-range-row p64-time-row" for="p64-time-slider"><span><strong>Motion time</strong><output data-p64-live="time">${format(state.time, 2)} s</output></span><input id="p64-time-slider" data-p64-slider="time" type="range" min="0" max="8" step="0.02" value="${state.time}" /><small><span>0 s</span><span>scrub undamped motion</span><span>8 s</span></small></label>
        <div class="p64-presets" aria-label="Oscillator presets">${presets.map((preset, index) => `<button class="chip-button p64-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p64-preset" data-p64-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    const omegaIn = inPhaseOmega();
    const omegaOut = outOfPhaseOmega();
    return `
      <div class="p64-metrics" aria-live="polite">
        <div><span>In-phase mode</span><strong data-p64-live="omega-in">ω₁ = ${format(omegaIn, 3)} rad/s</strong><small data-p64-live="frequency-in">f₁ = ${format(omegaIn / (2 * Math.PI), 3)} Hz</small></div>
        <div><span>Out-of-phase mode</span><strong data-p64-live="omega-out">ω₂ = ${format(omegaOut, 3)} rad/s</strong><small data-p64-live="frequency-out">f₂ = ${format(omegaOut / (2 * Math.PI), 3)} Hz</small></div>
        <div><span>Current excitation</span><strong data-p64-live="mode">${modeCopy()}</strong><small data-p64-live="coupling-effect">${state.mode === "in" ? "coupling unstrained" : state.mode === "out" ? "coupling alternately stretches and compresses" : "normal modes superposed"}</small></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p64-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p64-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p64-solution" aria-labelledby="p64-solution-heading">
        <h3 id="p64-solution-heading" tabindex="-1">Use the out-of-phase eigenvector</h3>
        <p>The coupled equations are</p>
        <div class="p64-equation">m x₁″ = −(k + κ)x₁ + κx₂; &nbsp; m x₂″ = κx₁ − (k + κ)x₂</div>
        <p>For the out-of-phase eigenvector, <em>x₂ = −x₁</em>, so</p>
        <div class="p64-equation">m x₁″ = −(k + 2κ)x₁; &nbsp; ω₂² = (k + 2κ)/m</div>
        <div class="p64-equation is-answer">ω₂ = √[(18 + 2×7)/2] = √16 = 4 rad/s</div>
        <p>The in-phase eigenvector has <em>x₁ = x₂</em>, so the coupling spring never changes length and <em>ω₁ = √(k/m) = 3 rad/s</em>. The ratios <em>k/m</em> and <em>κ/m</em> have dimensions s⁻². When κ → 0 the frequencies become equal and the oscillators decouple; when k → 0 the in-phase frequency tends to zero, representing free translation. With massless springs and no damping, kinetic plus spring potential energy is constant.</p>
      </section>`;
  }

  function snapshot() {
    const motion = motionAt();
    const energy = energyAt();
    const referenceEnergy = energyAt(0).total;
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      assumptions: ["equal point masses", "massless linear springs", "frictionless rail", "no damping"],
      massKilogramsEach: state.mass,
      outerSpringConstantNewtonsPerMetreEach: state.outerK,
      couplingSpringConstantNewtonsPerMetre: state.couplingK,
      inPhaseAngularFrequencyRadiansPerSecond: Number(inPhaseOmega().toFixed(6)),
      outOfPhaseAngularFrequencyRadiansPerSecond: Number(outOfPhaseOmega().toFixed(6)),
      selectedExcitation: state.mode,
      timeSeconds: state.time,
      displacement1Metres: Number(motion.x1.toFixed(6)),
      displacement2Metres: Number(motion.x2.toFixed(6)),
      kineticEnergyJoules: Number(energy.kinetic.toFixed(6)),
      potentialEnergyJoules: Number(energy.potential.toFixed(6)),
      totalEnergyJoules: Number(energy.total.toFixed(6)),
      energyDriftFromTimeZeroJoules: Number((energy.total - referenceEnergy).toFixed(9)),
      questionAnswerRadiansPerSecond: questionAnswer(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p64-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive oscillations</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p64-spread">
          <article class="book-page p64-problem-page">
            <div class="problem-number">Problem 6.4</div>
            <h1 class="book-title p64-title">Dr Springlove’s Infernal Oscillator</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">Two identical 2 kg masses slide without friction. Each mass is attached to a fixed wall by an 18 N/m spring, and a 7 N/m spring couples the masses.</p>
            <p class="problem-copy">What is the angular frequency of the out-of-phase normal mode?</p>
            <p class="p64-assumption">Assume small displacements, massless Hooke-law springs and no damping.</p>
            <p class="p64-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written coupled-oscillator model is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Look for symmetry</div><p>In one mode the middle spring does nothing. In the other it stretches twice as much as either mass moves.</p></section>
          </article>

          <section class="book-page book-stage p64-stage" aria-labelledby="p64-stage-title">
            <div class="p64-stage-card">
              <div class="p64-stage-heading"><div><span class="eyebrow">Normal-mode laboratory</span><h2 id="p64-stage-title">Excite an eigenvector</h2></div><p>Change either stiffness, choose an excitation and scrub time. The energy split changes while the undamped total remains fixed.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p64-coach">
            <div class="coach-kicker">Find the higher mode</div>
            <p class="coach-question">For m = 2 kg, k = 18 N/m and κ = 7 N/m, what is the out-of-phase angular frequency?</p>
            <form class="p64-answer-form" data-p64-answer-form novalidate>
              <label for="p64-answer">Angular frequency</label>
              <div><input id="p64-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 5" /><span>rad/s</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p64-help-row"><button class="secondary-button" type="button" data-problem-action="p64-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p64-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateLiveDom(root) {
    const shape = geometry();
    const energy = energyAt();
    const referenceEnergy = energyAt(0).total;
    const energyScale = Math.max(referenceEnergy, 1e-9);
    const omegaIn = inPhaseOmega();
    const omegaOut = outOfPhaseOmega();
    const values = {
      "outer-k": `${format(state.outerK, 0)} N/m`,
      "coupling-k": `${format(state.couplingK, 0)} N/m`,
      mass: `${format(state.mass, 2)} kg`,
      time: `${format(state.time, 2)} s`,
      "time-label": `t = ${format(state.time, 2)} s · ${modeCopy()}`,
      "coupling-label": `κ = ${format(state.couplingK, 1)} N/m · ${shape.couplingState}`,
      "kinetic-energy": `${format(energy.kinetic, 3)} J`,
      "potential-energy": `${format(energy.potential, 3)} J`,
      "total-energy": `${format(energy.total, 3)} J`,
      "energy-drift": `drift ${format(energy.total - referenceEnergy, 6)} J`,
      "omega-in": `ω₁ = ${format(omegaIn, 3)} rad/s`,
      "frequency-in": `f₁ = ${format(omegaIn / (2 * Math.PI), 3)} Hz`,
      "omega-out": `ω₂ = ${format(omegaOut, 3)} rad/s`,
      "frequency-out": `f₂ = ${format(omegaOut / (2 * Math.PI), 3)} Hz`,
      mode: modeCopy(),
      "coupling-effect": state.mode === "in" ? "coupling unstrained" : state.mode === "out" ? "coupling alternately stretches and compresses" : "normal modes superposed",
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p64-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    root.querySelectorAll("[data-p64-outer-label]").forEach((label) => { label.textContent = `k = ${format(state.outerK, 1)} N/m`; });

    const springPaths = { left: shape.leftSpring, coupling: shape.couplingSpring, right: shape.rightSpring };
    Object.entries(springPaths).forEach(([key, path]) => {
      const spring = root.querySelector(`[data-p64-spring="${key}"]`);
      if (!spring) return;
      spring.setAttribute("d", path);
      if (key === "coupling") spring.setAttribute("class", `p64-spring is-coupling is-${shape.couplingState}`);
    });
    const positions = { 1: shape.mass1X, 2: shape.mass2X };
    Object.entries(positions).forEach(([index, x]) => {
      const mass = root.querySelector(`[data-p64-mass="${index}"]`);
      if (mass) mass.setAttribute("transform", `translate(${x.toFixed(2)} ${SPRING_Y})`);
      const displacement = root.querySelector(`[data-p64-displacement="${index}"]`);
      if (displacement) displacement.setAttribute("x2", x.toFixed(2));
    });
    const setText = (selector, x, y, text) => {
      const node = root.querySelector(selector);
      if (!node) return;
      node.setAttribute("x", Number(x).toFixed(2));
      if (y !== null) node.setAttribute("y", Number(y).toFixed(2));
      node.textContent = text;
    };
    setText('[data-p64-displacement-label="1"]', shape.mass1X, 299, `x₁ = ${format(shape.motion.x1, 2)} m`);
    setText('[data-p64-displacement-label="2"]', shape.mass2X, 355, `x₂ = ${format(shape.motion.x2, 2)} m`);
    const velocities = { 1: shape.velocity1, 2: shape.velocity2 };
    Object.entries(velocities).forEach(([index, velocity]) => {
      const group = root.querySelector(`[data-p64-velocity="${index}"]`);
      if (!group) return;
      group.setAttribute("opacity", velocity.visible ? "1" : "0");
      const line = group.querySelector("line");
      if (line) {
        line.setAttribute("x1", positions[index].toFixed(2));
        line.setAttribute("x2", velocity.endX.toFixed(2));
      }
      const label = group.querySelector("text");
      if (label) label.setAttribute("x", velocity.endX.toFixed(2));
    });
    const bars = root.querySelectorAll(".p64-energy-strip i");
    bars[0]?.style.setProperty("--p64-size", `${((energy.kinetic / energyScale) * 100).toFixed(2)}%`);
    bars[1]?.style.setProperty("--p64-size", `${((energy.potential / energyScale) * 100).toFixed(2)}%`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p64-preset"]').forEach((button) => {
      const active = Number(button.dataset.p64Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelectorAll('[data-problem-action="p64-mode"]').forEach((button) => {
      const active = button.dataset.p64Mode === state.mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p64-apparatus-desc");
    if (description) description.textContent = `Two ${format(state.mass, 1)} kilogram masses are each attached to a wall by a ${format(state.outerK, 1)} newton per metre spring and coupled by a ${format(state.couplingK, 1)} newton per metre spring. ${modeCopy()}. At time ${format(state.time, 2)} seconds their displacements are ${format(shape.motion.x1, 2)} and ${format(shape.motion.x2, 2)} metres. Total mechanical energy is ${format(energy.total, 3)} joules.`;
    root.querySelector(".p64-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseAngularFrequency(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/hz$/.test(normalized)) return Number(normalized.replace(/\s*hz$/, "")) * 2 * Math.PI;
    if (/(?:rad\/s|rads)$/.test(normalized)) return Number(normalized.replace(/\s*(?:rad\/s|rads)$/, ""));
    return Number(normalized);
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p64-shell");
    if (!root) return;

    root.querySelector("#p64-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p64-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p64Slider;
        if (kind === "outer-k") state.outerK = clamp(event.target.value, 0, 40);
        if (kind === "coupling-k") state.couplingK = clamp(event.target.value, 0, 25);
        if (kind === "mass") state.mass = clamp(event.target.value, 0.5, 5);
        if (kind === "time") state.time = clamp(event.target.value, 0, 8);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p64-reset") state = initialState();
        if (action === "p64-mode") {
          const mode = control.dataset.p64Mode;
          if (modes.some((candidate) => candidate.key === mode)) {
            state.mode = mode;
            state.time = 0;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p64-preset") {
          const preset = presets[Number(control.dataset.p64Preset)];
          if (preset) {
            state.mass = preset.mass;
            state.outerK = preset.outerK;
            state.couplingK = preset.couplingK;
            state.time = 0;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p64-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p64-reveal") state.revealed = true;
        rerender();
        if (action === "p64-reveal") window.requestAnimationFrame(() => document.querySelector("#p64-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p64-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p64-answer")?.value || "";
      const estimate = parseAngularFrequency(raw);
      const exact = questionAnswer();
      const cyclicFrequency = exact / (2 * Math.PI);
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate < 0) {
        state.feedback = "Enter a non-negative angular frequency in radians per second, or include Hz with your value.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.03) {
          state.feedback = "Correct. The out-of-phase eigenvalue is (k + 2κ)/m = 16 s⁻², so ω₂ = 4 rad/s.";
          state.feedbackTone = "success";
          state.mass = QUESTION_MASS;
          state.outerK = QUESTION_OUTER_K;
          state.couplingK = QUESTION_COUPLING_K;
          state.mode = "out";
          state.time = Math.PI / (2 * exact);
        } else if (Math.abs(estimate - cyclicFrequency) <= 0.03) {
          state.feedback = "That is the cyclic frequency in hertz. The question asks for angular frequency, ω = 2πf.";
        } else if (estimate > exact) {
          state.feedback = "That is too large. In the out-of-phase mode the effective stiffness is k + 2κ, not 2k + 2κ.";
        } else {
          state.feedback = "That is too small. The coupling spring changes length twice as fast as either mass displacement.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p64-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
