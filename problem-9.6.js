(function registerRmsPowerPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "9.6";
  const QUESTION = Object.freeze({ peakVoltage: 170, peakCurrent: 10, phaseDegrees: 60 });
  const SQRT_TWO = Math.sqrt(2);
  const presets = Object.freeze([
    Object.freeze({ label: "Question · 60° lag", peakVoltage: 170, peakCurrent: 10, phaseDegrees: 60 }),
    Object.freeze({ label: "Resistor · in phase", peakVoltage: 170, peakCurrent: 10, phaseDegrees: 0 }),
    Object.freeze({ label: "Inductor · +90°", peakVoltage: 170, peakCurrent: 10, phaseDegrees: 90 }),
    Object.freeze({ label: "Capacitor · −90°", peakVoltage: 170, peakCurrent: 10, phaseDegrees: -90 }),
    Object.freeze({ label: "Power returned · 180°", peakVoltage: 170, peakCurrent: 10, phaseDegrees: 180 }),
  ]);
  const hints = Object.freeze([
    "The quoted 170 V and 10 A are peak amplitudes, not RMS values. Divide each by √2.",
    "For v=Vₚcosθ and i=Iₚcos(θ−φ), average real power is VᵣₘₛIᵣₘₛcosφ.",
    "Here VᵣₘₛIᵣₘₛ=(170/√2)(10/√2)=850 VA.",
    "cos60°=1/2, so only half of the apparent-power product is average real power.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p96-reset">Reset</button>';

  const initialState = () => ({
    peakVoltage: QUESTION.peakVoltage,
    peakCurrent: QUESTION.peakCurrent,
    phaseDegrees: QUESTION.phaseDegrees,
    cycleDegrees: 0,
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

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function format(value, digits = 2) {
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

  function powerValues(
    peakVoltage = state.peakVoltage,
    peakCurrent = state.peakCurrent,
    phaseDegrees = state.phaseDegrees,
    cycleDegrees = state.cycleDegrees,
  ) {
    const phase = radians(phaseDegrees);
    const theta = radians(cycleDegrees);
    const voltageRms = peakVoltage / SQRT_TWO;
    const currentRms = peakCurrent / SQRT_TWO;
    const apparentPower = voltageRms * currentRms;
    const realPower = apparentPower * Math.cos(phase);
    const reactivePower = apparentPower * Math.sin(phase);
    const voltageNow = peakVoltage * Math.cos(theta);
    const currentNow = peakCurrent * Math.cos(theta - phase);
    return {
      phase,
      theta,
      voltageRms,
      currentRms,
      apparentPower,
      realPower,
      reactivePower,
      powerFactor: Math.cos(phase),
      voltageNow,
      currentNow,
      instantaneousPower: voltageNow * currentNow,
    };
  }

  function numericalChecks(peakVoltage = state.peakVoltage, peakCurrent = state.peakCurrent, phaseDegrees = state.phaseDegrees) {
    const sampleCount = 1440;
    const phase = radians(phaseDegrees);
    let voltageSquareSum = 0;
    let currentSquareSum = 0;
    let powerSum = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const theta = 2 * Math.PI * index / sampleCount;
      const voltage = peakVoltage * Math.cos(theta);
      const current = peakCurrent * Math.cos(theta - phase);
      voltageSquareSum += voltage ** 2;
      currentSquareSum += current ** 2;
      powerSum += voltage * current;
    }
    return {
      voltageRms: Math.sqrt(voltageSquareSum / sampleCount),
      currentRms: Math.sqrt(currentSquareSum / sampleCount),
      averagePower: powerSum / sampleCount,
    };
  }

  function phaseDescription() {
    if (state.peakVoltage === 0 || state.peakCurrent === 0) return "No power flow: one waveform has zero amplitude";
    const magnitude = Math.abs(state.phaseDegrees);
    if (magnitude < 0.01) return "In phase · purely resistive · maximum absorption";
    if (Math.abs(magnitude - 90) < 0.01) return state.phaseDegrees > 0 ? "Current lags 90° · purely inductive" : "Current leads 90° · purely capacitive";
    if (Math.abs(magnitude - 180) < 0.01) return "Anti-phase · negative average power · net delivery";
    return `Current ${state.phaseDegrees > 0 ? "lags" : "leads"} voltage by ${format(magnitude, 1)}°`;
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      preset.peakVoltage === state.peakVoltage
      && preset.peakCurrent === state.peakCurrent
      && preset.phaseDegrees === state.phaseDegrees
    ));
  }

  function waveformGeometry() {
    const xStart = 66;
    const xEnd = 688;
    const width = xEnd - xStart;
    const voltageCentre = 91;
    const currentCentre = 211;
    const powerCentre = 335;
    const voltageAmplitude = 48;
    const currentAmplitude = 48;
    const powerAmplitude = 53;
    const powerScale = Math.max(state.peakVoltage * state.peakCurrent, 1e-12);
    const voltagePoints = [];
    const currentPoints = [];
    const powerPoints = [];
    const powerBars = [];
    for (let index = 0; index <= 240; index += 1) {
      const fraction = index / 240;
      const theta = 2 * Math.PI * fraction;
      const voltageRatio = state.peakVoltage > 0 ? Math.cos(theta) : 0;
      const currentRatio = state.peakCurrent > 0 ? Math.cos(theta - radians(state.phaseDegrees)) : 0;
      const powerRatio = (state.peakVoltage * state.peakCurrent * Math.cos(theta) * Math.cos(theta - radians(state.phaseDegrees))) / powerScale;
      const x = xStart + width * fraction;
      const voltageY = voltageCentre - voltageAmplitude * voltageRatio;
      const currentY = currentCentre - currentAmplitude * currentRatio;
      const powerY = powerCentre - powerAmplitude * powerRatio;
      voltagePoints.push({ x, y: voltageY });
      currentPoints.push({ x, y: currentY });
      powerPoints.push({ x, y: powerY });
      powerBars.push(`<line class="p96-power-bar ${powerRatio >= 0 ? "is-positive" : "is-negative"}" x1="${format(x, 2)}" y1="${powerCentre}" x2="${format(x, 2)}" y2="${format(powerY, 2)}" />`);
    }
    const toPath = (points) => `M${points.map((point) => `${format(point.x, 2)},${format(point.y, 2)}`).join(" L")}`;
    const current = powerValues();
    const cursorX = xStart + width * state.cycleDegrees / 360;
    const averagePowerY = powerCentre - powerAmplitude * current.realPower / powerScale;
    const rmsOffset = 48 / SQRT_TWO;
    return {
      xStart,
      xEnd,
      voltageCentre,
      currentCentre,
      powerCentre,
      rmsOffset,
      cursorX,
      averagePowerY,
      voltagePath: toPath(voltagePoints),
      currentPath: toPath(currentPoints),
      powerPath: toPath(powerPoints),
      powerBars: powerBars.join(""),
    };
  }

  function waveformMarkup() {
    const values = powerValues();
    const graph = waveformGeometry();
    return `
      <div class="p96-wave-wrap">
        <svg class="p96-wave" viewBox="0 0 730 430" role="img" aria-labelledby="p96-wave-title p96-wave-desc">
          <title id="p96-wave-title">Voltage, current and instantaneous power over one AC cycle</title>
          <desc id="p96-wave-desc">Peak voltage is ${format(state.peakVoltage, 1)} volts, peak current is ${format(state.peakCurrent, 1)} amperes and current ${state.phaseDegrees >= 0 ? "lags" : "leads"} by ${format(Math.abs(state.phaseDegrees), 1)} degrees. RMS voltage is ${format(values.voltageRms, 3)} volts, RMS current is ${format(values.currentRms, 3)} amperes and average real power is ${format(values.realPower, 3)} watts. Positive and negative instantaneous-power regions are distinguished.</desc>
          <line class="p96-lane" x1="${graph.xStart}" y1="${graph.voltageCentre}" x2="${graph.xEnd}" y2="${graph.voltageCentre}" />
          <line class="p96-lane" x1="${graph.xStart}" y1="${graph.currentCentre}" x2="${graph.xEnd}" y2="${graph.currentCentre}" />
          <line class="p96-lane" x1="${graph.xStart}" y1="${graph.powerCentre}" x2="${graph.xEnd}" y2="${graph.powerCentre}" />
          <g class="p96-rms-rails">
            <line x1="${graph.xStart}" y1="${format(graph.voltageCentre - graph.rmsOffset, 2)}" x2="${graph.xEnd}" y2="${format(graph.voltageCentre - graph.rmsOffset, 2)}" /><line x1="${graph.xStart}" y1="${format(graph.voltageCentre + graph.rmsOffset, 2)}" x2="${graph.xEnd}" y2="${format(graph.voltageCentre + graph.rmsOffset, 2)}" />
            <line x1="${graph.xStart}" y1="${format(graph.currentCentre - graph.rmsOffset, 2)}" x2="${graph.xEnd}" y2="${format(graph.currentCentre - graph.rmsOffset, 2)}" /><line x1="${graph.xStart}" y1="${format(graph.currentCentre + graph.rmsOffset, 2)}" x2="${graph.xEnd}" y2="${format(graph.currentCentre + graph.rmsOffset, 2)}" />
          </g>
          <path class="p96-voltage-wave" d="${graph.voltagePath}" />
          <path class="p96-current-wave" d="${graph.currentPath}" />
          <g class="p96-power-area">${graph.powerBars}</g>
          <path class="p96-power-wave" d="${graph.powerPath}" />
          <line class="p96-average-line" x1="${graph.xStart}" y1="${format(graph.averagePowerY, 2)}" x2="${graph.xEnd}" y2="${format(graph.averagePowerY, 2)}" />
          <line class="p96-cursor" x1="${format(graph.cursorX, 2)}" y1="30" x2="${format(graph.cursorX, 2)}" y2="393" />
          <circle class="p96-voltage-dot" cx="${format(graph.cursorX, 2)}" cy="${format(graph.voltageCentre - 48 * (state.peakVoltage > 0 ? Math.cos(values.theta) : 0), 2)}" r="5" />
          <circle class="p96-current-dot" cx="${format(graph.cursorX, 2)}" cy="${format(graph.currentCentre - 48 * (state.peakCurrent > 0 ? Math.cos(values.theta - values.phase) : 0), 2)}" r="5" />
          <circle class="p96-power-dot" cx="${format(graph.cursorX, 2)}" cy="${format(graph.powerCentre - 53 * values.instantaneousPower / Math.max(state.peakVoltage * state.peakCurrent, 1e-12), 2)}" r="5" />
          <text class="p96-lane-title is-voltage" x="18" y="50">VOLTAGE</text><text class="p96-lane-value is-voltage" x="688" y="50" text-anchor="end">v = ${format(values.voltageNow, 2)} V</text>
          <text class="p96-lane-title is-current" x="18" y="170">CURRENT</text><text class="p96-lane-value is-current" x="688" y="170" text-anchor="end">i = ${format(values.currentNow, 3)} A</text>
          <text class="p96-lane-title is-power" x="18" y="292">POWER</text><text class="p96-lane-value is-power" x="688" y="292" text-anchor="end">p = ${format(values.instantaneousPower, 2)} W</text>
          <text class="p96-rms-label" x="72" y="${format(graph.voltageCentre - graph.rmsOffset - 4, 2)}">+Vᵣₘₛ</text><text class="p96-rms-label" x="72" y="${format(graph.currentCentre - graph.rmsOffset - 4, 2)}">+Iᵣₘₛ</text>
          <text class="p96-average-label" x="684" y="${format(graph.averagePowerY - 5, 2)}" text-anchor="end">average P = ${format(values.realPower, 2)} W</text>
          <g class="p96-phase-axis"><text x="66" y="415">0</text><text x="221.5" y="415" text-anchor="middle">π/2</text><text x="377" y="415" text-anchor="middle">π</text><text x="532.5" y="415" text-anchor="middle">3π/2</text><text x="688" y="415" text-anchor="end">2π</text></g>
        </svg>
        <div class="p96-sign-strip"><span class="is-positive">Above zero: circuit absorbs energy</span><strong>${phaseDescription()}</strong><span class="is-negative">Below zero: energy returns</span></div>
      </div>`;
  }

  function ledgerMarkup() {
    const values = powerValues();
    return `
      <div class="p96-ledger" aria-label="AC power quantities">
        <div><span>RMS voltage</span><strong>${format(values.voltageRms, 3)} V</strong><small>Vₚ / √2</small></div>
        <div><span>RMS current</span><strong>${format(values.currentRms, 3)} A</strong><small>Iₚ / √2</small></div>
        <div><span>Apparent power S</span><strong>${format(values.apparentPower, 3)} VA</strong><small>VᵣₘₛIᵣₘₛ</small></div>
        <div><span>Real power P</span><strong>${format(values.realPower, 3)} W</strong><small>S cosφ</small></div>
        <div><span>Reactive power Q</span><strong>${format(values.reactivePower, 3)} var</strong><small>S sinφ</small></div>
        <div><span>Signed power factor</span><strong>${format(values.powerFactor, 4)}</strong><small>cosφ</small></div>
      </div>`;
  }

  function instantaneousMarkup() {
    const values = powerValues();
    return `
      <div class="p96-instant" aria-live="polite">
        <div><span>Cycle position</span><strong>θ = ${format(state.cycleDegrees, 0)}°</strong></div>
        <div><span>Instantaneous voltage</span><strong>${format(values.voltageNow, 2)} V</strong></div>
        <div><span>Instantaneous current</span><strong>${format(values.currentNow, 3)} A</strong></div>
        <div class="${values.instantaneousPower >= 0 ? "is-positive" : "is-negative"}"><span>Instantaneous power</span><strong>${format(values.instantaneousPower, 2)} W</strong></div>
      </div>`;
  }

  function dynamicMarkup() {
    return `<div class="p96-dynamic">${waveformMarkup()}${ledgerMarkup()}${instantaneousMarkup()}</div>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <section class="p96-controls" aria-label="AC waveform controls">
        <div class="p96-control-grid">
          <label for="p96-voltage"><span>Peak voltage V<sub>p</sub><output data-p96-live="voltage">${format(state.peakVoltage, 0)} V</output></span><input id="p96-voltage" data-p96-slider="voltage" type="range" min="0" max="340" step="5" value="${state.peakVoltage}" /></label>
          <label for="p96-current"><span>Peak current I<sub>p</sub><output data-p96-live="current">${format(state.peakCurrent, 1)} A</output></span><input id="p96-current" data-p96-slider="current" type="range" min="0" max="20" step="0.5" value="${state.peakCurrent}" /></label>
          <label for="p96-phase"><span>Current lag φ<output data-p96-live="phase">${format(state.phaseDegrees, 0)}°</output></span><input id="p96-phase" data-p96-slider="phase" type="range" min="-180" max="180" step="5" value="${state.phaseDegrees}" /></label>
          <label for="p96-cycle"><span>Inspect cycle θ<output data-p96-live="cycle">${format(state.cycleDegrees, 0)}°</output></span><input id="p96-cycle" data-p96-slider="cycle" type="range" min="0" max="360" step="2" value="${state.cycleDegrees}" /></label>
        </div>
        <div class="p96-presets" role="group" aria-label="AC load presets">${presets.map((preset, index) => `<button class="chip-button ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p96-preset" data-p96-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p96-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p96-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p96-solution" aria-labelledby="p96-solution-heading">
        <h3 id="p96-solution-heading" tabindex="-1">Peaks set the apparent power; phase sets the real fraction</h3>
        <p>For sinusoidal voltage and current,</p>
        <div class="p96-equation">V<sub>rms</sub> = V<sub>p</sub>/√2 = 170/√2 V<br>I<sub>rms</sub> = I<sub>p</sub>/√2 = 10/√2 A</div>
        <p>The average of the instantaneous product is</p>
        <div class="p96-equation">P = V<sub>rms</sub>I<sub>rms</sub>cosφ = (V<sub>p</sub>I<sub>p</sub>/2)cosφ</div>
        <div class="p96-equation is-answer">P = (170 × 10 / 2)cos60° = 850 × ½ = 425 W</div>
        <p>The waveform identity shows why:</p>
        <div class="p96-equation">p(t) = (V<sub>p</sub>I<sub>p</sub>/2)[cosφ + cos(2ωt − φ)]</div>
        <p>The second term completes two oscillations per AC cycle and averages to zero. Only the constant term remains.</p>
        <p class="p96-limits"><strong>Checks.</strong> At φ=0°, P=S=V<sub>rms</sub>I<sub>rms</sub>: a resistor absorbs maximum average power. At φ=±90°, P=0 while positive and negative instantaneous power cancel; Q is respectively +S for a lagging inductive load and −S for a leading capacitive load. At φ=180°, P=−S, meaning net delivery under the stated voltage/current reference directions. If either peak amplitude is zero, S, P and Q all vanish. V and A multiply to W for real power; VA and var distinguish apparent and reactive quantities.</p>
      </section>`;
  }

  function parseWatts(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/kw$/.test(normalized)) return Number(normalized.replace(/\s*kw$/, "")) * 1000;
    if (/watts?$/.test(normalized)) return Number(normalized.replace(/\s*watts?$/, ""));
    if (/w$/.test(normalized)) return Number(normalized.replace(/\s*w$/, ""));
    return Number(normalized);
  }

  function snapshot() {
    const values = powerValues();
    const numerical = numericalChecks();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      convention: "v=Vp cos(theta); i=Ip cos(theta-phi); positive phi means current lags voltage",
      peakVoltageVolts: state.peakVoltage,
      peakCurrentAmperes: state.peakCurrent,
      currentLagDegrees: state.phaseDegrees,
      cyclePositionDegrees: state.cycleDegrees,
      rmsVoltageVolts: Number(values.voltageRms.toFixed(9)),
      numericalRmsVoltageVolts: Number(numerical.voltageRms.toFixed(9)),
      rmsCurrentAmperes: Number(values.currentRms.toFixed(9)),
      numericalRmsCurrentAmperes: Number(numerical.currentRms.toFixed(9)),
      instantaneousVoltageVolts: Number(values.voltageNow.toFixed(9)),
      instantaneousCurrentAmperes: Number(values.currentNow.toFixed(9)),
      instantaneousPowerWatts: Number(values.instantaneousPower.toFixed(9)),
      apparentPowerVoltAmperes: Number(values.apparentPower.toFixed(9)),
      averageRealPowerWatts: Number(values.realPower.toFixed(9)),
      numericalAveragePowerWatts: Number(numerical.averagePower.toFixed(9)),
      reactivePowerVars: Number(values.reactivePower.toFixed(9)),
      signedPowerFactor: Number(values.powerFactor.toFixed(9)),
      rmsVoltageResidualVolts: Number((values.voltageRms - numerical.voltageRms).toFixed(12)),
      rmsCurrentResidualAmperes: Number((values.currentRms - numerical.currentRms).toFixed(12)),
      averagePowerResidualWatts: Number((values.realPower - numerical.averagePower).toFixed(12)),
      questionAnswerWatts: 425,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p96-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive AC power</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p96-spread">
          <article class="book-page p96-problem-page">
            <div class="problem-number">Problem 9.6</div>
            <h1 class="book-title p96-title">RMS power</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="p96-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written AC-power exercise is not the book’s wording or solution.</p>
            <p class="problem-copy">A sinusoidal supply has peak voltage 170 V. It drives a sinusoidal current of peak amplitude 10 A that lags the voltage by 60°.</p>
            <p class="problem-copy">What average real power is transferred to the load?</p>
            <section class="p96-convention-card"><strong>Phase convention</strong><p>v=V<sub>p</sub>cosωt and i=I<sub>p</sub>cos(ωt−φ). Positive φ means current lags voltage; positive instantaneous power means the load is absorbing energy.</p></section>
            <section class="prediction-box"><div class="eyebrow">Do not multiply the peaks</div><p>RMS introduces one factor of √2 for each waveform. Phase then determines what fraction of their RMS product becomes average real power.</p></section>
          </article>

          <section class="book-page book-stage p96-stage" aria-labelledby="p96-stage-title">
            <div class="p96-stage-heading"><div><span class="eyebrow">One-cycle power audit</span><h2 id="p96-stage-title">Separate size from phase</h2></div><p>The dashed rails mark RMS magnitudes. Scrub the cursor to inspect p(t), then compare its positive and negative regions with the average-power line.</p></div>
            ${dynamicMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p96-coach">
            <div class="coach-kicker">Find average real power</div>
            <p class="coach-question">For 170 V peak, 10 A peak and a 60° current lag, what is the average power transferred to the load?</p>
            <form class="p96-answer-form" data-p96-answer-form novalidate>
              <label for="p96-answer">Average real power</label>
              <div><input id="p96-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="e.g. 400" /><span>W</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p96-help-row"><button class="secondary-button" type="button" data-problem-action="p96-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p96-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p96-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p96-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = {
      voltage: `${format(state.peakVoltage, 0)} V`,
      current: `${format(state.peakCurrent, 1)} A`,
      phase: `${format(state.phaseDegrees, 0)}°`,
      cycle: `${format(state.cycleDegrees, 0)}°`,
    };
    Object.entries(outputs).forEach(([key, value]) => root.querySelectorAll(`[data-p96-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const values = powerValues();
    root.querySelector("#p96-voltage")?.setAttribute("aria-valuetext", `Peak voltage ${format(state.peakVoltage, 0)} volts; RMS ${format(values.voltageRms, 2)} volts`);
    root.querySelector("#p96-current")?.setAttribute("aria-valuetext", `Peak current ${format(state.peakCurrent, 1)} amperes; RMS ${format(values.currentRms, 2)} amperes`);
    root.querySelector("#p96-phase")?.setAttribute("aria-valuetext", `${phaseDescription()}; average power ${format(values.realPower, 2)} watts`);
    root.querySelector("#p96-cycle")?.setAttribute("aria-valuetext", `Cycle position ${format(state.cycleDegrees, 0)} degrees; instantaneous power ${format(values.instantaneousPower, 2)} watts`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p96-preset"]').forEach((button) => {
      const active = Number(button.dataset.p96Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderAndFocus(rerender, selector) {
    rerender();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p96-shell");
    if (!root) return;

    root.querySelectorAll("[data-p96-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p96Slider;
        if (kind === "voltage") state.peakVoltage = clamp(event.target.value, 0, 340);
        if (kind === "current") state.peakCurrent = clamp(event.target.value, 0, 20);
        if (kind === "phase") state.phaseDegrees = clamp(event.target.value, -180, 180);
        if (kind === "cycle") state.cycleDegrees = clamp(event.target.value, 0, 360);
        state.feedback = "";
        state.committed = false;
        updateDynamicDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p96-reset") {
          state = initialState();
          renderAndFocus(rerender, "#p96-voltage");
          return;
        }
        if (action === "p96-preset") {
          const preset = presets[Number(control.dataset.p96Preset)];
          if (preset) {
            state.peakVoltage = preset.peakVoltage;
            state.peakCurrent = preset.peakCurrent;
            state.phaseDegrees = preset.phaseDegrees;
            state.cycleDegrees = 0;
            state.feedback = "";
            state.committed = false;
          }
          renderAndFocus(rerender, "#p96-phase");
          return;
        }
        if (action === "p96-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p96-reveal") state.revealed = true;
        rerender();
        if (action === "p96-reveal") window.requestAnimationFrame(() => document.querySelector("#p96-solution-heading")?.focus());
      });
    });

    root.querySelector("#p96-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelector("[data-p96-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p96-answer")?.value || "";
      const answer = parseWatts(raw);
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(answer)) {
        state.feedback = "Enter the signed average power in W; kW is also accepted.";
        state.feedbackTone = "warn";
      } else if (Math.abs(answer - 425) <= 0.5) {
        state.feedback = "Correct. RMS contributes a factor 1/2 and cos60° contributes another 1/2, leaving 425 W.";
        state.feedbackTone = "success";
        state.committed = true;
        state.peakVoltage = QUESTION.peakVoltage;
        state.peakCurrent = QUESTION.peakCurrent;
        state.phaseDegrees = QUESTION.phaseDegrees;
      } else if (Math.abs(answer - 850) <= 0.8) {
        state.feedback = "850 VA is the RMS voltage–current product. Multiply by cos60° to obtain average real power.";
      } else if (Math.abs(answer - 1700) <= 1) {
        state.feedback = "That multiplies the two peaks. Convert both peak amplitudes to RMS, then apply the phase factor.";
      } else if (answer < 0) {
        state.feedback = "A 60° lag still has positive cosφ, so this load absorbs positive average power.";
      } else {
        state.feedback = "Use P=(VₚIₚ/2)cosφ, keeping peak, RMS and phase factors separate.";
      }
      renderAndFocus(rerender, "#p96-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
