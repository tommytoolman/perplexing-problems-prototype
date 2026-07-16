(function registerProfessorStopclockPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "6.2";
  const MASS = 1;
  const INITIAL_STIFFNESS = 4;
  const INITIAL_OMEGA = Math.sqrt(INITIAL_STIFFNESS / MASS);
  const INITIAL_PERIOD = 2 * Math.PI / INITIAL_OMEGA;
  const CHALLENGE = Object.freeze({ phaseDegrees: 120, stiffnessRatio: 2.25, amplitude: 1 });
  const stages = Object.freeze([
    Object.freeze({ short: "Continuity", title: "Freeze the instantaneous state", copy: "The stiffness changes without an impulse. Position and velocity therefore pass continuously through the switch, although acceleration need not." }),
    Object.freeze({ short: "New phase", title: "Rebuild the oscillator", copy: "The preserved pair (xs,vs) determines a new amplitude and phase for the new angular frequency ω₂." }),
    Object.freeze({ short: "Timing", title: "Run the new clock to its next peak", copy: "Advance the reconstructed phase to the next positive maximum. Audit the external work done while changing the spring." }),
  ]);
  const hints = Object.freeze([
    "Before the switch, x=A cos(ω₁t) with ω₁=√(k₁/m)=2 rad/s. At phase φ, ts=φ/ω₁, xs=A cosφ and vs=−Aω₁ sinφ.",
    "After the switch write x=xs cos(ω₂τ)+(vs/ω₂)sin(ω₂τ), where τ=t−ts and ω₂=√(k₂/m). This automatically preserves x and v at τ=0.",
    "Write the new motion as B cos(ω₂τ+α): B=√[xs²+(vs/ω₂)²] and α=atan2(−vs/ω₂,xs), placed in 0≤α&lt;2π.",
    "A positive maximum occurs when ω₂τ+α is the next multiple of 2π. Thus τpeak=(2π−α mod 2π)/ω₂; if already at a positive maximum, use one full new period.",
    "Changing k does external work. Since x and v are continuous, ΔE=½(k₂−k₁)xs². A switch at x=0 changes no energy.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p62-reset">Reset</button>';

  const initialState = () => ({
    phaseDegrees: CHALLENGE.phaseDegrees,
    stiffnessRatio: CHALLENGE.stiffnessRatio,
    amplitude: CHALLENGE.amplitude,
    stage: 0,
    peakAnswer: "",
    amplitudeAnswer: "",
    energyAnswer: "",
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

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function clean(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value).toFixed(digits);
    return Object.is(Number(rounded), -0) ? Number(0).toFixed(digits) : rounded;
  }

  function signed(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.5 * 10 ** -digits) return Number(0).toFixed(digits);
    return `${value > 0 ? "+" : "−"}${clean(Math.abs(value), digits)}`;
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9.\s+-]/g, "").slice(0, 16);
  }

  function normalizeAngle(value) {
    const turn = 2 * Math.PI;
    return ((value % turn) + turn) % turn;
  }

  function manipulation(
    phaseDegrees = state.phaseDegrees,
    stiffnessRatio = state.stiffnessRatio,
    amplitude = state.amplitude,
  ) {
    const phase = radians(phaseDegrees);
    const switchTime = phase / INITIAL_OMEGA;
    const switchPosition = amplitude * Math.cos(phase);
    const switchVelocity = -amplitude * INITIAL_OMEGA * Math.sin(phase);
    const finalStiffness = INITIAL_STIFFNESS * stiffnessRatio;
    const finalOmega = Math.sqrt(finalStiffness / MASS);
    const finalPeriod = 2 * Math.PI / finalOmega;
    const finalAmplitude = Math.hypot(switchPosition, switchVelocity / finalOmega);
    const finalPhase = normalizeAngle(Math.atan2(-switchVelocity / finalOmega, switchPosition));
    let phaseToPeak = normalizeAngle(2 * Math.PI - finalPhase);
    if (phaseToPeak < 1e-10) phaseToPeak = 2 * Math.PI;
    const delayToPeak = phaseToPeak / finalOmega;
    const peakTime = switchTime + delayToPeak;
    const energyBefore = 0.5 * INITIAL_STIFFNESS * amplitude ** 2;
    const energyAfter = 0.5 * MASS * switchVelocity ** 2 + 0.5 * finalStiffness * switchPosition ** 2;
    const energyChange = energyAfter - energyBefore;
    const energyChangeFormula = 0.5 * (finalStiffness - INITIAL_STIFFNESS) * switchPosition ** 2;
    const accelerationBefore = -(INITIAL_OMEGA ** 2) * switchPosition;
    const accelerationAfter = -(finalOmega ** 2) * switchPosition;
    return {
      phase,
      switchTime,
      switchPosition,
      switchVelocity,
      finalStiffness,
      finalOmega,
      finalPeriod,
      finalAmplitude,
      finalPhase,
      phaseToPeak,
      delayToPeak,
      peakTime,
      energyBefore,
      energyAfter,
      energyChange,
      energyChangeFormula,
      accelerationBefore,
      accelerationAfter,
      positionResidual: switchPosition - amplitude * Math.cos(phase),
      velocityResidual: switchVelocity + amplitude * INITIAL_OMEGA * Math.sin(phase),
      energyResidual: energyChange - energyChangeFormula,
    };
  }

  const challengeValues = manipulation(CHALLENGE.phaseDegrees, CHALLENGE.stiffnessRatio, CHALLENGE.amplitude);

  function positionAfter(time, values = manipulation()) {
    const tau = time - values.switchTime;
    return values.switchPosition * Math.cos(values.finalOmega * tau)
      + values.switchVelocity / values.finalOmega * Math.sin(values.finalOmega * tau);
  }

  function reconstructionNote() {
    return `
      <p class="p62-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function stageControls() {
    return `
      <div class="p62-stage-controls" role="group" aria-label="Time manipulation analysis stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p62-stage" data-p62-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageHeading() {
    const stage = stages[state.stage];
    return `
      <div class="p62-stage-heading">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><h2>${stage.title}</h2></div>
        <p>${stage.copy}</p>
        <button class="ghost-button" type="button" data-problem-action="p62-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Clock reconstructed" : "Next stage"}</button>
      </div>`;
  }

  function plotPath(start, end, samples, fn, xMap, yMap) {
    const points = [];
    for (let index = 0; index <= samples; index += 1) {
      const time = start + (end - start) * index / samples;
      points.push({ x: xMap(time), y: yMap(fn(time)) });
    }
    return points.map((point, index) => `${index ? "L" : "M"}${clean(point.x, 2)} ${clean(point.y, 2)}`).join(" ");
  }

  function oscillatorSvg() {
    const values = manipulation();
    const timeMaximum = Math.max(INITIAL_PERIOD * 1.08, values.peakTime + 0.18 * values.finalPeriod);
    const verticalScale = Math.max(state.amplitude, values.finalAmplitude) * 1.18;
    const xMap = (time) => 56 + time / timeMaximum * 620;
    const yMap = (position) => 177 - position / verticalScale * 106;
    const switchX = xMap(values.switchTime);
    const switchY = yMap(values.switchPosition);
    const peakX = xMap(values.peakTime);
    const peakY = yMap(values.finalAmplitude);
    const beforePath = plotPath(0, values.switchTime, 70, (time) => state.amplitude * Math.cos(INITIAL_OMEGA * time), xMap, yMap);
    const afterPath = plotPath(values.switchTime, timeMaximum, 150, (time) => positionAfter(time, values), xMap, yMap);
    const unalteredPath = plotPath(values.switchTime, timeMaximum, 150, (time) => state.amplitude * Math.cos(INITIAL_OMEGA * time), xMap, yMap);
    const energyScale = Math.max(values.energyBefore, values.energyAfter, 0.01);
    return `
      <svg class="p62-svg p62-stage-${state.stage}" viewBox="0 0 720 430" role="img" aria-labelledby="p62-svg-title p62-svg-desc">
        <title id="p62-svg-title">Oscillator position before and after an instantaneous stiffness switch</title>
        <desc id="p62-svg-desc">The spring switches at ${clean(values.switchTime)} seconds, preserving position ${signed(values.switchPosition)} metres and velocity ${signed(values.switchVelocity)} metres per second. The new amplitude is ${clean(values.finalAmplitude)} metres. The next positive maximum occurs at ${clean(values.peakTime)} seconds, ${clean(values.delayToPeak)} seconds after the intervention.</desc>
        <defs>
          <linearGradient id="p62-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2ecf0"/><stop offset="1" stop-color="#f7f0de"/></linearGradient>
        </defs>
        <rect width="720" height="430" fill="url(#p62-bg)" />
        <g class="p62-axes" aria-hidden="true">
          <line x1="56" y1="177" x2="682" y2="177" /><line x1="56" y1="54" x2="56" y2="292" />
          <text x="57" y="42">position x (m)</text><text x="682" y="197" text-anchor="end">time t (s)</text>
          <text x="48" y="${clean(yMap(verticalScale))}" text-anchor="end">+${clean(verticalScale, 1)}</text><text x="48" y="${clean(yMap(-verticalScale))}" text-anchor="end">−${clean(verticalScale, 1)}</text>
        </g>
        <path class="p62-unaltered" d="${unalteredPath}" />
        <path class="p62-before" d="${beforePath}" />
        <path class="p62-after" d="${afterPath}" />
        <line class="p62-switch-line" x1="${clean(switchX)}" y1="54" x2="${clean(switchX)}" y2="292" />
        <circle class="p62-switch-point" cx="${clean(switchX)}" cy="${clean(switchY)}" r="6" />
        <text class="p62-switch-label" x="${clean(switchX + 8)}" y="68">switch ts=${clean(values.switchTime, 3)} s</text>
        <g class="p62-peak-layer">
          <line x1="${clean(peakX)}" y1="54" x2="${clean(peakX)}" y2="292" />
          <circle cx="${clean(peakX)}" cy="${clean(peakY)}" r="7" />
          <text x="${clean(peakX - 8)}" y="${clean(peakY - 13)}" text-anchor="end">next +peak ${clean(values.peakTime, 3)} s</text>
        </g>

        <g class="p62-continuity-layer" aria-hidden="true">
          <rect x="52" y="318" width="616" height="77" rx="14" />
          <text class="p62-panel-kicker" x="70" y="341">NO IMPULSE AT THE SWITCH</text>
          <text class="p62-panel-value" x="70" y="365">x−=x+=${signed(values.switchPosition, 3)} m &nbsp; · &nbsp; v−=v+=${signed(values.switchVelocity, 3)} m/s</text>
          <text class="p62-panel-note" x="70" y="385">acceleration jumps ${signed(values.accelerationBefore, 2)} → ${signed(values.accelerationAfter, 2)} m/s²</text>
        </g>
        <g class="p62-phase-layer" aria-hidden="true">
          <rect x="52" y="318" width="616" height="77" rx="14" />
          <text class="p62-panel-kicker" x="70" y="341">NEW AMPLITUDE AND PHASE</text>
          <text class="p62-panel-value" x="70" y="365">B=${clean(values.finalAmplitude, 3)} m &nbsp; · &nbsp; α=${clean(values.finalPhase * 180 / Math.PI, 2)}° &nbsp; · &nbsp; T₂=${clean(values.finalPeriod, 3)} s</text>
          <text class="p62-panel-note" x="70" y="385">x=B cos[ω₂(t−ts)+α], with ω₂=${clean(values.finalOmega, 3)} rad/s</text>
        </g>
        <g class="p62-timing-layer" aria-hidden="true">
          <rect x="52" y="318" width="397" height="77" rx="14" />
          <text class="p62-panel-kicker" x="70" y="341">NEXT POSITIVE MAXIMUM</text>
          <text class="p62-panel-value" x="70" y="365">delay ${clean(values.delayToPeak, 3)} s · clock time ${clean(values.peakTime, 3)} s</text>
          <text class="p62-panel-note" x="70" y="385">advance phase by ${clean(values.phaseToPeak * 180 / Math.PI, 2)}°</text>
          <rect class="p62-energy-box" x="464" y="318" width="204" height="77" rx="14" />
          <text class="p62-panel-kicker" x="481" y="341">ENERGY</text>
          <rect class="p62-energy-before" x="481" y="353" width="${clean(70 * values.energyBefore / energyScale)}" height="10" rx="5" />
          <rect class="p62-energy-after" x="481" y="371" width="${clean(70 * values.energyAfter / energyScale)}" height="10" rx="5" />
          <text class="p62-panel-note" x="560" y="361">before ${clean(values.energyBefore, 2)} J</text><text class="p62-panel-note" x="560" y="379">after ${clean(values.energyAfter, 2)} J</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = manipulation();
    return `
      <section class="p62-metrics" aria-label="Oscillator timing and energy values">
        <div><span>Switch time ts</span><strong>${clean(values.switchTime, 3)} s</strong></div>
        <div><span>New stiffness k₂</span><strong>${clean(values.finalStiffness, 3)} N/m</strong></div>
        <div><span>New amplitude B</span><strong>${clean(values.finalAmplitude, 3)} m</strong></div>
        <div><span>New period T₂</span><strong>${clean(values.finalPeriod, 3)} s</strong></div>
        <div><span>Next +peak clock time</span><strong>${clean(values.peakTime, 3)} s</strong></div>
        <div><span>External energy change</span><strong>${signed(values.energyChange, 3)} J</strong></div>
        <p>Continuity residuals: Δx=${values.positionResidual.toExponential(1)} m, Δv=${values.velocityResidual.toExponential(1)} m/s. Energy-work residual: ${values.energyResidual.toExponential(1)} J.</p>
      </section>`;
  }

  function dynamicMarkup() {
    return `<div class="p62-dynamic">${oscillatorSvg()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    return `
      <section class="p62-controls" aria-label="Time manipulator controls">
        <label for="p62-phase"><span>Switch phase φ in first cycle<output data-p62-live="phase">${clean(state.phaseDegrees, 0)}°</output></span><input id="p62-phase" type="range" min="0" max="350" step="1" value="${state.phaseDegrees}" /></label>
        <label for="p62-ratio"><span>Stiffness ratio k₂/k₁<output data-p62-live="ratio">${clean(state.stiffnessRatio, 2)}</output></span><input id="p62-ratio" type="range" min="0.25" max="4" step="0.01" value="${state.stiffnessRatio}" /></label>
        <label for="p62-amplitude"><span>Initial amplitude A<output data-p62-live="amplitude">${clean(state.amplitude, 2)} m</output></span><input id="p62-amplitude" type="range" min="0.5" max="1.5" step="0.01" value="${state.amplitude}" /></label>
        <div class="p62-presets" role="group" aria-label="Notable stiffness switches">
          <button class="chip-button" type="button" data-problem-action="p62-preset" data-p62-phase="120" data-p62-ratio="2.25">Challenge</button>
          <button class="chip-button" type="button" data-problem-action="p62-preset" data-p62-phase="90" data-p62-ratio="2.25">Switch at x=0</button>
          <button class="chip-button" type="button" data-problem-action="p62-preset" data-p62-phase="0" data-p62-ratio="2.25">Switch at +A</button>
          <button class="chip-button" type="button" data-problem-action="p62-preset" data-p62-phase="120" data-p62-ratio="1">No intervention</button>
          <button class="chip-button" type="button" data-problem-action="p62-preset" data-p62-phase="180" data-p62-ratio="0.5">Soften at −A</button>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p62-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p62-solution" aria-labelledby="p62-solution-heading">
        <h3 id="p62-solution-heading" tabindex="-1">Preserve state, then restart the phase clock</h3>
        <p>Initially ω₁=√(4/1)=2 rad/s and x=A cos(ω₁t). At φ=120°:</p>
        <div class="p62-equation">ts=φ/ω₁=${clean(challengeValues.switchTime, 6)} s<br>xs=A cosφ=${signed(challengeValues.switchPosition, 6)} m<br>vs=−Aω₁ sinφ=${signed(challengeValues.switchVelocity, 6)} m/s</div>
        <p>The new stiffness is k₂=9 N/m, so ω₂=3 rad/s. With τ=t−ts, continuity gives</p>
        <div class="p62-equation">x=xs cos(ω₂τ)+(vs/ω₂)sin(ω₂τ)<br>=B cos(ω₂τ+α)</div>
        <p>Thus</p>
        <div class="p62-equation">B=√[xs²+(vs/ω₂)²]=${clean(challengeValues.finalAmplitude, 6)} m<br>α=atan2(−vs/ω₂,xs)=${clean(challengeValues.finalPhase * 180 / Math.PI, 6)}°</div>
        <p>The phase must advance ${clean(challengeValues.phaseToPeak * 180 / Math.PI, 6)}° to reach its next positive maximum:</p>
        <div class="p62-equation">τpeak=${clean(challengeValues.delayToPeak, 6)} s<br>tpeak=ts+τpeak=${clean(challengeValues.peakTime, 6)} s</div>
        <p>The intervention supplies external work because k changes while x is nonzero:</p>
        <div class="p62-equation">ΔE=½(k₂−k₁)xs²=${signed(challengeValues.energyChange, 6)} J</div>
        <p class="p62-limits"><strong>Checks.</strong> At x=0, ΔE=0 even though the period and amplitude change. If k₂=k₁, B=A and the next positive peak remains at the original period T₁=π s. At a turning point v=0, switching k leaves the instantaneous amplitude |x| unchanged but changes energy by ½Δk x². Position and velocity are continuous; acceleration changes unless x=0 or k₂=k₁. Since k/m has units s⁻², ω has units s⁻¹ and every reported time has units seconds.</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = manipulation();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      massKg: MASS,
      initialStiffnessNewtonsPerMetre: INITIAL_STIFFNESS,
      initialAngularFrequencyRadiansPerSecond: INITIAL_OMEGA,
      switchPhaseDegrees: state.phaseDegrees,
      switchTimeSeconds: Number(values.switchTime.toFixed(6)),
      switchPositionMetres: Number(values.switchPosition.toFixed(6)),
      switchVelocityMetresPerSecond: Number(values.switchVelocity.toFixed(6)),
      stiffnessRatio: state.stiffnessRatio,
      finalAngularFrequencyRadiansPerSecond: Number(values.finalOmega.toFixed(6)),
      finalAmplitudeMetres: Number(values.finalAmplitude.toFixed(6)),
      finalPhaseDegrees: Number((values.finalPhase * 180 / Math.PI).toFixed(6)),
      nextPositivePeakDelaySeconds: Number(values.delayToPeak.toFixed(6)),
      nextPositivePeakClockTimeSeconds: Number(values.peakTime.toFixed(6)),
      interventionEnergyChangeJoules: Number(values.energyChange.toFixed(6)),
      continuityResiduals: { positionMetres: values.positionResidual, velocityMetresPerSecond: values.velocityResidual },
      energyWorkResidualJoules: values.energyResidual,
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p62-shell">
        ${warning()}
        <header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive simple harmonic motion</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header>
        <div class="book-spread p62-spread">
          <article class="book-page p62-problem-page">
            <div class="problem-number">Problem 6.2</div><h1 class="book-title p62-title">Professor Stopclock’s time-manipulator</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">A 1.00 kg block oscillates horizontally with amplitude 1.00 m on a spring of stiffness k₁=4.00 N/m. It starts at x=+A from rest.</p>
            <p class="problem-copy">When the initial phase reaches 120°, Professor Stopclock instantaneously changes the stiffness to k₂=9.00 N/m without applying an impulse. Find the clock time of the next positive maximum, the new amplitude and the change in oscillator energy.</p>
            <section class="p62-rule-card"><strong>The manipulator’s rule</strong><p>The block cannot teleport and receives no instantaneous impulse: x and v are continuous. Changing the spring itself can perform work, so mechanical energy need not be continuous.</p></section>
            <section class="p62-data-card"><div class="eyebrow">Initial clock</div><p>ω₁=2.00 rad/s · T₁=π s · E₁=2.00 J. Phase φ=ω₁t is measured from the initial positive maximum.</p></section>
          </article>
          <section class="book-page book-stage p62-stage">${stageControls()}${stageHeading()}${dynamicMarkup()}${controlsMarkup()}</section>
          <aside class="book-page book-coach p62-coach">
            <div class="coach-kicker">Reset the oscillator clock</div><p class="coach-question">For the stated 120° switch to k₂=9.00 N/m, predict the next positive-peak clock time, new amplitude and intervention energy.</p>
            <form class="p62-answer-form" data-p62-answer-form novalidate>
              <label for="p62-peak-answer">Next positive maximum at t</label><div><input id="p62-peak-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.peakAnswer)}" placeholder="absolute clock time" autocomplete="off" /><span>s</span></div>
              <label for="p62-amplitude-answer">New amplitude B</label><div><input id="p62-amplitude-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.amplitudeAnswer)}" placeholder="amplitude" autocomplete="off" /><span>m</span></div>
              <label for="p62-energy-answer">Energy change ΔE</label><div><input id="p62-energy-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.energyAnswer)}" placeholder="signed change" autocomplete="off" /><span>J</span></div>
              <button class="primary-button" type="submit">Check manipulated time</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p62-help-row"><button class="secondary-button" type="button" data-problem-action="p62-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p62-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}${solutionMarkup()}<div class="p62-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p62-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p62-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = { phase: `${clean(state.phaseDegrees, 0)}°`, ratio: clean(state.stiffnessRatio, 2), amplitude: `${clean(state.amplitude, 2)} m` };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p62-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const result = manipulation();
    root.querySelector("#p62-phase")?.setAttribute("aria-valuetext", `Switch phase ${clean(state.phaseDegrees, 0)} degrees, time ${clean(result.switchTime, 3)} seconds`);
    root.querySelector("#p62-ratio")?.setAttribute("aria-valuetext", `Stiffness ratio ${clean(state.stiffnessRatio, 2)}, new period ${clean(result.finalPeriod, 3)} seconds`);
    root.querySelector("#p62-amplitude")?.setAttribute("aria-valuetext", `Initial amplitude ${clean(state.amplitude, 2)} metres, new amplitude ${clean(result.finalAmplitude, 3)} metres`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p62-reset") { state = initialState(); renderAndFocus(renderApp, "#p62-phase"); return; }
      if (action === "p62-stage") { state.stage = clamp(Number(control.dataset.p62Stage), 0, 2); renderAndFocus(renderApp, `[data-p62-stage="${state.stage}"]`); return; }
      if (action === "p62-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p62-stage="${state.stage}"]`); return; }
      if (action === "p62-preset") {
        state.phaseDegrees = clamp(Number(control.dataset.p62Phase), 0, 350); state.stiffnessRatio = clamp(Number(control.dataset.p62Ratio), .25, 4); renderAndFocus(renderApp, "#p62-phase"); return;
      }
      if (action === "p62-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p62-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p62-reveal") window.requestAnimationFrame(() => document.querySelector("#p62-solution-heading")?.focus());
    }));
    [["#p62-phase","phaseDegrees",0,350],["#p62-ratio","stiffnessRatio",.25,4],["#p62-amplitude","amplitude",.5,1.5]].forEach(([selector,key,min,max]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), min, max); updateDynamicDom(); }));
    const peakInput=document.querySelector("#p62-peak-answer"), amplitudeInput=document.querySelector("#p62-amplitude-answer"), energyInput=document.querySelector("#p62-energy-answer");
    peakInput?.addEventListener("input",event=>{state.peakAnswer=sanitizeNumber(event.target.value);}); amplitudeInput?.addEventListener("input",event=>{state.amplitudeAnswer=sanitizeNumber(event.target.value);}); energyInput?.addEventListener("input",event=>{state.energyAnswer=sanitizeNumber(event.target.value);});
    document.querySelector("[data-p62-answer-form]")?.addEventListener("submit", event => {
      event.preventDefault(); state.peakAnswer=sanitizeNumber(peakInput?.value).trim(); state.amplitudeAnswer=sanitizeNumber(amplitudeInput?.value).trim(); state.energyAnswer=sanitizeNumber(energyInput?.value).trim();
      const peak=Number(state.peakAnswer), amplitude=Number(state.amplitudeAnswer), energy=Number(state.energyAnswer); state.feedbackTone="warn"; state.committed=false;
      if(!state.peakAnswer||!state.amplitudeAnswer||!state.energyAnswer||!Number.isFinite(peak)||!Number.isFinite(amplitude)||!Number.isFinite(energy)) state.feedback="Enter all three quantities, including the sign of ΔE.";
      else if(Math.abs(peak-challengeValues.peakTime)>.003) state.feedback="That timing is not yet right. Reconstruct the new phase α from the continuous pair (xs,vs), then advance to the next 2π multiple.";
      else if(Math.abs(amplitude-challengeValues.finalAmplitude)>.003) state.feedback="Use both preserved state variables: B²=xs²+(vs/ω₂)². The new amplitude is not generally |xs|.";
      else if(Math.abs(energy-challengeValues.energyChange)>.003) state.feedback="Velocity is continuous, so the kinetic energy does not jump. The signed change is ½(k₂−k₁)xs².";
      else {state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: next +peak at t=${clean(challengeValues.peakTime,6)} s, B=${clean(challengeValues.finalAmplitude,6)} m and ΔE=${signed(challengeValues.energyChange,6)} J.`;}
      renderAndFocus(renderApp,"#p62-peak-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
