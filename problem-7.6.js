(function registerCuriousWheelPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "7.6";
  const GRAVITY = 9.8;
  const QUESTION_RADIUS = 1;
  const QUESTION_SHELL_MASS = 80;
  const QUESTION_SLIDER_MASS = 20;
  const QUESTION_OFFSET = 0.4;
  const POWER_END_PERCENT = 60;
  const WHEEL_X = 205;
  const GROUND_Y = 360;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p76-reset">Reset</button>';
  const hints = Object.freeze([
    "Only the internal slider changes gravitational height during the reset; the symmetric wheel shell keeps the same centre height.",
    "The slider starts 0.40 m below the wheel centre and must finish 0.40 m above it, so its height increase is 0.80 m.",
    "The least possible reset work is the increase in gravitational potential energy: W = mgΔh.",
    "Use m = 20 kg, g = 9.8 m/s² and Δh = 0.80 m.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question wheel", radius: 1, shellMass: 80, sliderMass: 20, offset: 0.4 }),
    Object.freeze({ label: "Centred slider", radius: 1, shellMass: 80, sliderMass: 20, offset: 0 }),
    Object.freeze({ label: "No slider mass", radius: 1, shellMass: 80, sliderMass: 0, offset: 0.4 }),
    Object.freeze({ label: "Heavy shell", radius: 1, shellMass: 160, sliderMass: 20, offset: 0.4 }),
  ]);

  const initialState = () => ({
    radius: QUESTION_RADIUS,
    shellMass: QUESTION_SHELL_MASS,
    sliderMass: QUESTION_SLIDER_MASS,
    offset: QUESTION_OFFSET,
    phase: 0,
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

  function cycleEnergy(sliderMass = state.sliderMass, offset = state.offset) {
    return 2 * sliderMass * GRAVITY * offset;
  }

  function cycleAt(percent = state.phase) {
    const phase = clamp(percent, 0, 100);
    const totalMass = state.shellMass + state.sliderMass;
    if (phase <= POWER_END_PERCENT) {
      const progress = phase / POWER_END_PERCENT;
      const angle = Math.PI * progress;
      const relativeX = state.offset * Math.sin(angle);
      const relativeY = state.offset * Math.cos(angle);
      const gravityWorkReleased = state.sliderMass * GRAVITY * state.offset * (1 - Math.cos(angle));
      const resetWork = 0;
      return {
        phase,
        stage: phase === 0 ? "start" : phase === POWER_END_PERCENT ? "bottom" : "power",
        angle,
        relativeX,
        relativeY,
        gravityTorque: state.sliderMass * GRAVITY * state.offset * Math.sin(angle),
        gravityWorkReleased,
        resetWork,
        cycleBalance: gravityWorkReleased,
        centreOfMassHeight: state.radius + (state.sliderMass / Math.max(totalMass, 1e-9)) * relativeY,
        wheelAdvance: state.radius * angle,
      };
    }
    const resetProgress = (phase - POWER_END_PERCENT) / (100 - POWER_END_PERCENT);
    const relativeY = -state.offset + 2 * state.offset * resetProgress;
    const gravityWorkReleased = cycleEnergy();
    const resetWork = cycleEnergy() * resetProgress;
    return {
      phase,
      stage: phase >= 100 ? "complete" : "reset",
      angle: Math.PI,
      relativeX: 0,
      relativeY,
      gravityTorque: 0,
      gravityWorkReleased,
      resetWork,
      cycleBalance: gravityWorkReleased - resetWork,
      centreOfMassHeight: state.radius + (state.sliderMass / Math.max(totalMass, 1e-9)) * relativeY,
      wheelAdvance: Math.PI * state.radius,
    };
  }

  function stageCopy(stage = cycleAt().stage) {
    if (stage === "start") return "Slider at top · cycle ready";
    if (stage === "power") return "Power stroke · clockwise torque";
    if (stage === "bottom") return "Slider at bottom · reset required";
    if (stage === "reset") return "Wheel latched · actuator resets slider";
    return "Cycle complete · no net ideal work";
  }

  function questionAnswer() {
    return cycleEnergy(QUESTION_SLIDER_MASS, QUESTION_OFFSET);
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.radius - state.radius) < 0.001
      && Math.abs(preset.shellMass - state.shellMass) < 0.001
      && Math.abs(preset.sliderMass - state.sliderMass) < 0.001
      && Math.abs(preset.offset - state.offset) < 0.001
    ));
  }

  function chartGeometry() {
    const startX = 430;
    const width = 225;
    const cmPixelsPerMetre = 80;
    const torquePixelsPerNewtonMetre = 32 / (50 * GRAVITY * 0.6);
    const resetPixelsPerJoule = 34 / (2 * 50 * GRAVITY * 0.6);
    const cmPoints = [];
    const torquePoints = [];
    const resetPoints = [];
    for (let index = 0; index <= 100; index += 2) {
      const sample = cycleAt(index);
      const x = startX + (width * index) / 100;
      cmPoints.push({ x, y: 99 - (sample.centreOfMassHeight - state.radius) * cmPixelsPerMetre });
      torquePoints.push({ x, y: 204 - sample.gravityTorque * torquePixelsPerNewtonMetre });
      resetPoints.push({ x, y: 308 - sample.resetWork * resetPixelsPerJoule });
    }
    const path = (points) => `M${points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" L")}`;
    const currentX = startX + width * state.phase / 100;
    return { cmPath: path(cmPoints), torquePath: path(torquePoints), resetPath: path(resetPoints), currentX };
  }

  function geometry() {
    const cycle = cycleAt();
    const visualRadius = state.radius * 100;
    const centre = { x: WHEEL_X, y: GROUND_Y - visualRadius };
    const slider = {
      x: centre.x + cycle.relativeX * 100,
      y: centre.y - cycle.relativeY * 100,
    };
    const sliderRadius = Math.min(15, Math.max(6, (state.radius - state.offset) * 100 - 3));
    const gravityStartY = slider.y + sliderRadius + 2;
    const gravityEndY = Math.min(slider.y + 75, 398);
    const totalMass = state.shellMass + state.sliderMass;
    const massFraction = state.sliderMass / Math.max(totalMass, 1e-9);
    const systemCentreOfMass = {
      x: centre.x + massFraction * cycle.relativeX * 100,
      y: centre.y - massFraction * cycle.relativeY * 100,
    };
    const trackUnit = { x: Math.sin(cycle.angle), y: -Math.cos(cycle.angle) };
    const trackHalf = Math.min(visualRadius * 0.9, Math.max(visualRadius * 0.72, state.offset * 100 + 3));
    const track = {
      x1: centre.x - trackUnit.x * trackHalf,
      y1: centre.y - trackUnit.y * trackHalf,
      x2: centre.x + trackUnit.x * trackHalf,
      y2: centre.y + trackUnit.y * trackHalf,
    };
    return { cycle, visualRadius, centre, slider, sliderRadius, gravityStartY, gravityEndY, systemCentreOfMass, track, chart: chartGeometry() };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const fullCycleEnergy = cycleEnergy();
    const workScale = Math.max(fullCycleEnergy, 1e-9);
    return `
      <div class="p76-apparatus-wrap">
        <svg class="p76-apparatus" viewBox="0 0 700 410" role="img" aria-labelledby="p76-apparatus-title p76-apparatus-desc">
          <title id="p76-apparatus-title">Rolling wheel with an eccentric internal slider and a full-cycle energy audit</title>
          <desc id="p76-apparatus-desc">A symmetric ${format(state.shellMass, 0)} kilogram wheel of radius ${format(state.radius, 2)} metres contains a ${format(state.sliderMass, 1)} kilogram slider at offset ${format(state.offset, 2)} metres. ${stageCopy()}. System centre-of-mass height is ${format(shape.cycle.centreOfMassHeight, 3)} metres, clockwise gravitational torque is ${format(shape.cycle.gravityTorque, 2)} newton metres, and reset work supplied so far is ${format(shape.cycle.resetWork, 2)} joules.</desc>
          <defs>
            <marker id="p76-arrow-gravity" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p76-arrow-torque" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <line class="p76-ground" x1="28" y1="${GROUND_Y}" x2="382" y2="${GROUND_Y}" />
          <circle class="p76-wheel" data-p76-wheel cx="${shape.centre.x}" cy="${shape.centre.y.toFixed(2)}" r="${shape.visualRadius.toFixed(2)}" />
          <g class="p76-spokes" data-p76-spokes transform="translate(${shape.centre.x} ${shape.centre.y.toFixed(2)}) rotate(${(shape.cycle.angle * 180 / Math.PI).toFixed(2)}) scale(${(shape.visualRadius / 100).toFixed(3)})"><path d="M0 0v-100M0 0v100M0 0h-100M0 0h100M0 0l70-70M0 0l-70 70M0 0l70 70M0 0l-70-70" /></g>
          <line class="p76-slider-track" data-p76-slider-track x1="${shape.track.x1.toFixed(2)}" y1="${shape.track.y1.toFixed(2)}" x2="${shape.track.x2.toFixed(2)}" y2="${shape.track.y2.toFixed(2)}" />
          <circle class="p76-hub" data-p76-hub cx="${shape.centre.x}" cy="${shape.centre.y.toFixed(2)}" r="10" />
          <circle class="p76-slider" data-p76-slider cx="${shape.slider.x.toFixed(2)}" cy="${shape.slider.y.toFixed(2)}" r="${shape.sliderRadius.toFixed(2)}" />
          <text class="p76-slider-label" data-p76-slider-label x="${shape.slider.x.toFixed(2)}" y="${shape.slider.y + 4}" text-anchor="middle">m</text>
          <circle class="p76-system-com" data-p76-system-com cx="${shape.systemCentreOfMass.x.toFixed(2)}" cy="${shape.systemCentreOfMass.y.toFixed(2)}" r="7" />
          <text class="p76-com-label" data-p76-com-label x="${shape.systemCentreOfMass.x + 10}" y="${shape.systemCentreOfMass.y - 10}">system COM</text>
          <line class="p76-gravity-arrow" data-p76-gravity-arrow x1="${shape.slider.x.toFixed(2)}" y1="${shape.gravityStartY.toFixed(2)}" x2="${shape.slider.x.toFixed(2)}" y2="${shape.gravityEndY.toFixed(2)}" marker-end="url(#p76-arrow-gravity)" opacity="${state.sliderMass > 0 ? 1 : 0}" />
          <g class="p76-torque" data-p76-torque opacity="${shape.cycle.gravityTorque > 0.01 ? 1 : 0}"><path data-p76-torque-path d="M${shape.centre.x + 47},${shape.centre.y} A47,47 0 0 1 ${shape.centre.x},${shape.centre.y + 47}" marker-end="url(#p76-arrow-torque)" /><text data-p76-torque-label x="${shape.centre.x + 54}" y="${shape.centre.y + 48}">τcw = ${format(shape.cycle.gravityTorque, 1)} N·m</text></g>
          <circle class="p76-contact" data-p76-contact cx="${shape.centre.x}" cy="${GROUND_Y}" r="6" />
          <text class="p76-wheel-label" x="28" y="390" data-p76-live="wheel-label">advance s = ${format(shape.cycle.wheelAdvance, 2)} m · wheel angle ${format(shape.cycle.angle * 180 / Math.PI, 0)}°</text>

          <g class="p76-cycle-chart">
            <text class="p76-chart-title" x="420" y="38">FULL-CYCLE AUDIT</text>
            <line class="p76-lane" x1="420" y1="99" x2="666" y2="99" /><line class="p76-lane" x1="420" y1="204" x2="666" y2="204" /><line class="p76-lane" x1="420" y1="308" x2="666" y2="308" />
            <path class="p76-com-trace" data-p76-chart="com" d="${shape.chart.cmPath}" />
            <path class="p76-torque-trace" data-p76-chart="torque" d="${shape.chart.torquePath}" />
            <path class="p76-reset-trace" data-p76-chart="reset" d="${shape.chart.resetPath}" />
            <line class="p76-chart-cursor" data-p76-chart-cursor x1="${shape.chart.currentX.toFixed(2)}" y1="56" x2="${shape.chart.currentX.toFixed(2)}" y2="332" />
            <text class="p76-lane-label" x="420" y="65">SYSTEM COM HEIGHT</text><text class="p76-lane-value is-com" x="666" y="65" text-anchor="end" data-p76-live="chart-com">${format(shape.cycle.centreOfMassHeight, 3)} m</text>
            <text class="p76-lane-label" x="420" y="170">CLOCKWISE TORQUE</text><text class="p76-lane-value is-torque" x="666" y="170" text-anchor="end" data-p76-live="chart-torque">${format(shape.cycle.gravityTorque, 2)} N·m</text>
            <text class="p76-lane-label" x="420" y="274">RESET WORK PAID</text><text class="p76-lane-value is-reset" x="666" y="274" text-anchor="end" data-p76-live="chart-reset">${format(shape.cycle.resetWork, 2)} J</text>
            <text class="p76-phase-tick" x="430" y="350">top · 0%</text><text class="p76-phase-tick" x="565" y="350" text-anchor="middle">bottom · 60%</text><text class="p76-phase-tick" x="655" y="350" text-anchor="end">reset · 100%</text>
            <text class="p76-stage-label is-${shape.cycle.stage}" x="543" y="387" text-anchor="middle" data-p76-live="stage">${stageCopy()}</text>
          </g>
        </svg>
        <div class="p76-work-strip">
          <div><span>Gravity work released</span><strong data-p76-live="gravity-work">${format(shape.cycle.gravityWorkReleased, 2)} J</strong><i style="--p76-size:${((shape.cycle.gravityWorkReleased / workScale) * 100).toFixed(2)}%"></i></div>
          <div><span>Reset work supplied</span><strong data-p76-live="reset-work">${format(shape.cycle.resetWork, 2)} J</strong><i style="--p76-size:${((shape.cycle.resetWork / workScale) * 100).toFixed(2)}%"></i></div>
          <div class="p76-work-balance"><span>Unpaid cycle balance</span><strong data-p76-live="cycle-balance">${format(shape.cycle.cycleBalance, 2)} J</strong><small>returns to zero at reset</small></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit, digits = 1) {
    return `
      <label class="p76-range-row" for="p76-${kind}-slider">
        <span><strong>${label}</strong><output data-p76-live="${kind}">${format(value, digits)}${unit}</output></span>
        <input id="p76-${kind}-slider" data-p76-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "radius" ? "wheel geometry" : kind === "offset" ? "from wheel centre" : kind === "shell-mass" ? "symmetric shell" : "internal slider"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    const steps = [
      { value: 0, label: "Slider at top" },
      { value: POWER_END_PERCENT, label: "End power stroke" },
      { value: 100, label: "Complete reset" },
    ];
    return `
      <div class="p76-controls">
        ${sliderMarkup("radius", "Wheel radius · R", 0.7, 1.5, 0.05, state.radius, " m", 2)}
        ${sliderMarkup("offset", "Slider offset · a", 0, 0.6, 0.025, state.offset, " m", 3)}
        ${sliderMarkup("slider-mass", "Slider mass · m", 0, 50, 1, state.sliderMass, " kg", 0)}
        ${sliderMarkup("shell-mass", "Shell mass · M", 40, 160, 5, state.shellMass, " kg", 0)}
        <label class="p76-range-row p76-phase-row" for="p76-phase-slider"><span><strong>Cycle position</strong><output data-p76-live="phase">${format(state.phase, 0)}%</output></span><input id="p76-phase-slider" data-p76-slider="phase" type="range" min="0" max="100" step="1" value="${state.phase}" /><small><span>top</span><span data-p76-live="phase-stage">${stageCopy()}</span><span>reset</span></small></label>
        <div class="p76-step-picker" aria-label="Cycle landmarks">${steps.map((step) => `<button class="chip-button p76-step-button ${state.phase === step.value ? "active" : ""}" type="button" data-problem-action="p76-phase" data-p76-phase="${step.value}" aria-pressed="${state.phase === step.value}">${step.label}</button>`).join("")}</div>
        <div class="p76-presets" aria-label="Wheel presets">${presets.map((preset, index) => `<button class="chip-button p76-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p76-preset" data-p76-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    const cycle = cycleAt();
    return `
      <div class="p76-metrics" aria-live="polite">
        <div><span>System COM height</span><strong data-p76-live="com-height">${format(cycle.centreOfMassHeight, 3)} m</strong></div>
        <div><span>Clockwise gravity torque</span><strong data-p76-live="gravity-torque">${format(cycle.gravityTorque, 2)} N·m</strong></div>
        <div><span>Ideal full reset cost</span><strong data-p76-live="full-reset-cost">${format(cycleEnergy(), 2)} J</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p76-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p76-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p76-solution" aria-labelledby="p76-solution-heading">
        <h3 id="p76-solution-heading" tabindex="-1">The reset closes the energy ledger</h3>
        <p>The symmetric shell’s centre remains at height <em>R</em>. Resetting moves only the slider, from <em>R − a</em> to <em>R + a</em>:</p>
        <div class="p76-equation">Δh = (R + a) − (R − a) = 2a = 0.80 m</div>
        <div class="p76-equation is-answer">W<sub>reset,min</sub> = mgΔh = (20)(9.8)(0.80) = 156.8 J</div>
        <p>During the clockwise power stroke, with angle θ measured from the top, gravity supplies torque <em>τ = mga sin θ</em>. Its work is</p>
        <div class="p76-equation">W<sub>gravity</sub> = ∫₀<sup>π</sup> mga sin θ dθ = 2mga = 156.8 J</div>
        <p>The ideal reset therefore consumes exactly the gravitational work released. The system COM falls by <em>2ma/(M + m) = 0.16 m</em> during the power stroke and returns to its original height after reset. With no slider mass or no offset, torque and work both vanish. Wheel radius changes the half-turn advance <em>πR</em>, but not the level-ground energy balance; real reset and rolling losses make the net result worse than zero.</p>
      </section>`;
  }

  function snapshot() {
    const cycle = cycleAt();
    const initialPotentialReference = state.sliderMass * GRAVITY * state.offset;
    const currentRelativePotential = state.sliderMass * GRAVITY * cycle.relativeY;
    const potentialChange = currentRelativePotential - initialPotentialReference;
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      model: "symmetric wheel rolls half a turn under an eccentric slider, then wheel is latched while slider is reset",
      signConvention: "clockwise torque positive; work released by gravity positive",
      wheelRadiusMetres: state.radius,
      shellMassKilograms: state.shellMass,
      sliderMassKilograms: state.sliderMass,
      sliderOffsetMetres: state.offset,
      cyclePhasePercent: state.phase,
      stage: cycle.stage,
      sliderRelativeXMetres: Number(cycle.relativeX.toFixed(6)),
      sliderRelativeYMetres: Number(cycle.relativeY.toFixed(6)),
      systemCentreOfMassHeightMetres: Number(cycle.centreOfMassHeight.toFixed(6)),
      clockwiseGravityTorqueNewtonMetres: Number(cycle.gravityTorque.toFixed(6)),
      gravityWorkReleasedJoules: Number(cycle.gravityWorkReleased.toFixed(6)),
      idealResetWorkSuppliedJoules: Number(cycle.resetWork.toFixed(6)),
      cycleBalanceJoules: Number(cycle.cycleBalance.toFixed(6)),
      gravitationalPotentialChangeFromCycleStartJoules: Number(potentialChange.toFixed(6)),
      conservationResidualJoules: Number((cycle.cycleBalance + potentialChange).toFixed(9)),
      wheelAdvanceMetres: Number(cycle.wheelAdvance.toFixed(6)),
      questionAnswerJoules: questionAnswer(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p76-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive energy paradox</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p76-spread">
          <article class="book-page p76-problem-page">
            <div class="problem-number">Problem 7.6</div>
            <h1 class="book-title p76-title">The curious wheel</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="problem-copy">A symmetric 80 kg wheel of radius 1.0 m contains a 20 kg slider. During a power stroke the slider stays 0.40 m from the centre and descends from the top to the bottom as the wheel rolls half a turn.</p>
            <p class="problem-copy">The wheel is then latched while an ideal actuator returns the slider from bottom to top. What minimum reset work is required?</p>
            <p class="p76-assumption">Assume level ground, quasi-static ideal reset and no rolling or actuator losses.</p>
            <p class="p76-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written eccentric-slider cycle is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Audit the reset</div><p>An off-centre mass can provide torque for part of a turn. A repeatable machine must restore both its position and its gravitational potential.</p></section>
          </article>

          <section class="book-page book-stage p76-stage" aria-labelledby="p76-stage-title">
            <div class="p76-stage-card">
              <div class="p76-stage-heading"><div><span class="eyebrow">Full-cycle laboratory</span><h2 id="p76-stage-title">Close the wheel’s ledger</h2></div><p>Change the geometry and scrub from power stroke through internal reset. Three aligned traces expose the hidden cost.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p76-coach">
            <div class="coach-kicker">Find the reset cost</div>
            <p class="coach-question">For the 20 kg slider at 0.40 m offset, what ideal work returns it from bottom to top?</p>
            <form class="p76-answer-form" data-p76-answer-form novalidate>
              <label for="p76-answer">Minimum reset work</label>
              <div><input id="p76-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 150" /><span>J</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p76-help-row"><button class="secondary-button" type="button" data-problem-action="p76-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p76-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
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
    const fullCycleEnergy = cycleEnergy();
    const workScale = Math.max(fullCycleEnergy, 1e-9);
    const values = {
      radius: `${format(state.radius, 2)} m`,
      offset: `${format(state.offset, 3)} m`,
      "slider-mass": `${format(state.sliderMass, 0)} kg`,
      "shell-mass": `${format(state.shellMass, 0)} kg`,
      phase: `${format(state.phase, 0)}%`,
      "phase-stage": stageCopy(),
      "wheel-label": `advance s = ${format(shape.cycle.wheelAdvance, 2)} m · wheel angle ${format(shape.cycle.angle * 180 / Math.PI, 0)}°`,
      "chart-com": `${format(shape.cycle.centreOfMassHeight, 3)} m`,
      "chart-torque": `${format(shape.cycle.gravityTorque, 2)} N·m`,
      "chart-reset": `${format(shape.cycle.resetWork, 2)} J`,
      stage: stageCopy(),
      "gravity-work": `${format(shape.cycle.gravityWorkReleased, 2)} J`,
      "reset-work": `${format(shape.cycle.resetWork, 2)} J`,
      "cycle-balance": `${format(shape.cycle.cycleBalance, 2)} J`,
      "com-height": `${format(shape.cycle.centreOfMassHeight, 3)} m`,
      "gravity-torque": `${format(shape.cycle.gravityTorque, 2)} N·m`,
      "full-reset-cost": `${format(fullCycleEnergy, 2)} J`,
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p76-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const wheel = root.querySelector("[data-p76-wheel]");
    if (wheel) {
      wheel.setAttribute("cy", shape.centre.y.toFixed(2));
      wheel.setAttribute("r", shape.visualRadius.toFixed(2));
    }
    const spokes = root.querySelector("[data-p76-spokes]");
    if (spokes) spokes.setAttribute("transform", `translate(${shape.centre.x} ${shape.centre.y.toFixed(2)}) rotate(${(shape.cycle.angle * 180 / Math.PI).toFixed(2)}) scale(${(shape.visualRadius / 100).toFixed(3)})`);
    const track = root.querySelector("[data-p76-slider-track]");
    if (track) Object.entries(shape.track).forEach(([attribute, value]) => track.setAttribute(attribute, Number(value).toFixed(2)));
    const hub = root.querySelector("[data-p76-hub]");
    if (hub) hub.setAttribute("cy", shape.centre.y.toFixed(2));
    const slider = root.querySelector("[data-p76-slider]");
    if (slider) {
      slider.setAttribute("cx", shape.slider.x.toFixed(2));
      slider.setAttribute("cy", shape.slider.y.toFixed(2));
      slider.setAttribute("r", shape.sliderRadius.toFixed(2));
    }
    const sliderLabel = root.querySelector("[data-p76-slider-label]");
    if (sliderLabel) {
      sliderLabel.setAttribute("x", shape.slider.x.toFixed(2));
      sliderLabel.setAttribute("y", (shape.slider.y + 4).toFixed(2));
    }
    const systemCom = root.querySelector("[data-p76-system-com]");
    if (systemCom) {
      systemCom.setAttribute("cx", shape.systemCentreOfMass.x.toFixed(2));
      systemCom.setAttribute("cy", shape.systemCentreOfMass.y.toFixed(2));
    }
    const comLabel = root.querySelector("[data-p76-com-label]");
    if (comLabel) {
      comLabel.setAttribute("x", (shape.systemCentreOfMass.x + 10).toFixed(2));
      comLabel.setAttribute("y", (shape.systemCentreOfMass.y - 10).toFixed(2));
    }
    const gravity = root.querySelector("[data-p76-gravity-arrow]");
    if (gravity) {
      gravity.setAttribute("x1", shape.slider.x.toFixed(2));
      gravity.setAttribute("y1", shape.gravityStartY.toFixed(2));
      gravity.setAttribute("x2", shape.slider.x.toFixed(2));
      gravity.setAttribute("y2", shape.gravityEndY.toFixed(2));
      gravity.setAttribute("opacity", state.sliderMass > 0 ? "1" : "0");
    }
    const torque = root.querySelector("[data-p76-torque]");
    if (torque) {
      torque.setAttribute("opacity", shape.cycle.gravityTorque > 0.01 ? "1" : "0");
      const path = torque.querySelector("[data-p76-torque-path]");
      if (path) path.setAttribute("d", `M${shape.centre.x + 47},${shape.centre.y.toFixed(2)} A47,47 0 0 1 ${shape.centre.x},${(shape.centre.y + 47).toFixed(2)}`);
      const label = torque.querySelector("[data-p76-torque-label]");
      if (label) {
        label.setAttribute("x", (shape.centre.x + 54).toFixed(2));
        label.setAttribute("y", (shape.centre.y + 48).toFixed(2));
        label.textContent = `τcw = ${format(shape.cycle.gravityTorque, 1)} N·m`;
      }
    }
    const contact = root.querySelector("[data-p76-contact]");
    if (contact) contact.setAttribute("cx", shape.centre.x.toFixed(2));
    const chartPaths = { com: shape.chart.cmPath, torque: shape.chart.torquePath, reset: shape.chart.resetPath };
    Object.entries(chartPaths).forEach(([key, path]) => {
      const node = root.querySelector(`[data-p76-chart="${key}"]`);
      if (node) node.setAttribute("d", path);
    });
    const cursor = root.querySelector("[data-p76-chart-cursor]");
    if (cursor) {
      cursor.setAttribute("x1", shape.chart.currentX.toFixed(2));
      cursor.setAttribute("x2", shape.chart.currentX.toFixed(2));
    }
    const bars = root.querySelectorAll(".p76-work-strip i");
    bars[0]?.style.setProperty("--p76-size", `${((shape.cycle.gravityWorkReleased / workScale) * 100).toFixed(2)}%`);
    bars[1]?.style.setProperty("--p76-size", `${((shape.cycle.resetWork / workScale) * 100).toFixed(2)}%`);
    const stageLabel = root.querySelector(".p76-stage-label");
    if (stageLabel) stageLabel.setAttribute("class", `p76-stage-label is-${shape.cycle.stage}`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p76-preset"]').forEach((button) => {
      const active = Number(button.dataset.p76Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelectorAll('[data-problem-action="p76-phase"]').forEach((button) => {
      const active = Number(button.dataset.p76Phase) === state.phase;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p76-apparatus-desc");
    if (description) description.textContent = `A symmetric ${format(state.shellMass, 0)} kilogram wheel of radius ${format(state.radius, 2)} metres contains a ${format(state.sliderMass, 1)} kilogram slider at offset ${format(state.offset, 2)} metres. ${stageCopy()}. System centre-of-mass height is ${format(shape.cycle.centreOfMassHeight, 3)} metres, clockwise gravitational torque is ${format(shape.cycle.gravityTorque, 2)} newton metres, and reset work supplied so far is ${format(shape.cycle.resetWork, 2)} joules.`;
    root.querySelector(".p76-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseEnergyJoules(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/kj$/.test(normalized)) return Number(normalized.replace(/\s*kj$/, "")) * 1000;
    if (/j$/.test(normalized)) return Number(normalized.replace(/\s*j$/, ""));
    return Number(normalized);
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p76-shell");
    if (!root) return;

    root.querySelector("#p76-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p76-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p76Slider;
        if (kind === "radius") state.radius = clamp(event.target.value, 0.7, 1.5);
        if (kind === "offset") state.offset = clamp(event.target.value, 0, 0.6);
        if (kind === "slider-mass") state.sliderMass = clamp(event.target.value, 0, 50);
        if (kind === "shell-mass") state.shellMass = clamp(event.target.value, 40, 160);
        if (kind === "phase") state.phase = clamp(event.target.value, 0, 100);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p76-reset") state = initialState();
        if (action === "p76-phase") state.phase = clamp(control.dataset.p76Phase, 0, 100);
        if (action === "p76-preset") {
          const preset = presets[Number(control.dataset.p76Preset)];
          if (preset) {
            state.radius = preset.radius;
            state.shellMass = preset.shellMass;
            state.sliderMass = preset.sliderMass;
            state.offset = preset.offset;
            state.phase = 0;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p76-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p76-reveal") state.revealed = true;
        rerender();
        if (action === "p76-reveal") window.requestAnimationFrame(() => document.querySelector("#p76-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p76-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p76-answer")?.value || "";
      const estimate = parseEnergyJoules(raw);
      const exact = questionAnswer();
      const halfHeightWork = QUESTION_SLIDER_MASS * GRAVITY * QUESTION_OFFSET;
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate < 0) {
        state.feedback = "Enter a non-negative reset work in joules, or include kJ with your value.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.6) {
          state.feedback = "Correct. Raising the slider through 0.80 m costs 156.8 J, exactly the ideal power-stroke gain.";
          state.feedbackTone = "success";
          state.radius = QUESTION_RADIUS;
          state.shellMass = QUESTION_SHELL_MASS;
          state.sliderMass = QUESTION_SLIDER_MASS;
          state.offset = QUESTION_OFFSET;
          state.phase = 100;
        } else if (Math.abs(estimate - halfHeightWork) <= 0.6) {
          state.feedback = "That uses a height change of only a. The slider moves from −a to +a, so Δh = 2a.";
        } else if (estimate > exact) {
          state.feedback = "That exceeds the ideal minimum. With a lossless quasi-static reset, use only the slider’s potential-energy increase.";
        } else {
          state.feedback = "That is too small. The reset must restore all gravitational potential released during the half-turn.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p76-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
