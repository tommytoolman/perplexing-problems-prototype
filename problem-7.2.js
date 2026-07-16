(function registerPowerHumpPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "7.2";
  const EFFECTIVE_FORCE = 8000;
  const ENGINE_EFFICIENCY = 0.25;
  const QUESTION_FLOW = 600;
  const QUESTION_DEFLECTION = 0.05;
  const QUESTION_EFFICIENCY = 60;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p72-reset">Reset</button>';
  const hints = Object.freeze([
    "First find the mechanical work extracted from one vehicle: W = Fd.",
    "For F = 8000 N and d = 0.050 m, the hump takes 400 J of mechanical energy per vehicle.",
    "At 60% generator efficiency, each vehicle yields 0.60 × 400 = 240 J of electrical energy.",
    "Convert 600 vehicles per hour to 1/6 vehicle per second, then multiply by 240 J per vehicle.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question setup", flow: 600, deflection: 0.05, efficiency: 60 }),
    Object.freeze({ label: "No traffic", flow: 0, deflection: 0.05, efficiency: 60 }),
    Object.freeze({ label: "Locked hump", flow: 600, deflection: 0, efficiency: 60 }),
    Object.freeze({ label: "Ideal generator", flow: 600, deflection: 0.05, efficiency: 100 }),
  ]);

  const initialState = () => ({
    flow: QUESTION_FLOW,
    deflection: QUESTION_DEFLECTION,
    efficiency: QUESTION_EFFICIENCY,
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

  function efficiencyFraction(efficiency = state.efficiency) {
    return efficiency / 100;
  }

  function mechanicalEnergyPerVehicle(deflection = state.deflection) {
    return EFFECTIVE_FORCE * deflection;
  }

  function electricalEnergyPerVehicle(deflection = state.deflection, efficiency = state.efficiency) {
    return efficiencyFraction(efficiency) * mechanicalEnergyPerVehicle(deflection);
  }

  function generatorLossPerVehicle(deflection = state.deflection, efficiency = state.efficiency) {
    return mechanicalEnergyPerVehicle(deflection) - electricalEnergyPerVehicle(deflection, efficiency);
  }

  function fuelEnergyPerVehicle(deflection = state.deflection) {
    return mechanicalEnergyPerVehicle(deflection) / ENGINE_EFFICIENCY;
  }

  function engineLossPerVehicle(deflection = state.deflection) {
    return fuelEnergyPerVehicle(deflection) - mechanicalEnergyPerVehicle(deflection);
  }

  function eventsPerSecond(flow = state.flow) {
    return flow / 3600;
  }

  function mechanicalPower(flow = state.flow, deflection = state.deflection) {
    return eventsPerSecond(flow) * mechanicalEnergyPerVehicle(deflection);
  }

  function electricalPower(flow = state.flow, deflection = state.deflection, efficiency = state.efficiency) {
    return eventsPerSecond(flow) * electricalEnergyPerVehicle(deflection, efficiency);
  }

  function generatorLossPower(flow = state.flow, deflection = state.deflection, efficiency = state.efficiency) {
    return mechanicalPower(flow, deflection) - electricalPower(flow, deflection, efficiency);
  }

  function fuelPower(flow = state.flow, deflection = state.deflection) {
    return eventsPerSecond(flow) * fuelEnergyPerVehicle(deflection);
  }

  function questionAnswer() {
    return electricalPower(QUESTION_FLOW, QUESTION_DEFLECTION, QUESTION_EFFICIENCY);
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.flow - state.flow) < 0.001
      && Math.abs(preset.deflection - state.deflection) < 0.0001
      && Math.abs(preset.efficiency - state.efficiency) < 0.001
    ));
  }

  function geometry() {
    const unloadedY = 182;
    const roadY = 225;
    const deflectionPixels = state.deflection * 390;
    const plateY = unloadedY + deflectionPixels;
    const humpPath = `M235,${roadY} Q350,${plateY.toFixed(2)} 465,${roadY}`;
    const carY = plateY - 43;
    const pistonTop = plateY + 3;
    const electricityWidth = 240 * efficiencyFraction();
    const lossWidth = 240 - electricityWidth;
    return { unloadedY, roadY, deflectionPixels, plateY, humpPath, carY, pistonTop, electricityWidth, lossWidth };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const inputPower = mechanicalPower();
    const outputPower = electricalPower();
    const lossPower = generatorLossPower();
    const largestPower = Math.max(inputPower, 1e-9);
    return `
      <div class="p72-apparatus-wrap">
        <svg class="p72-apparatus" viewBox="0 0 700 400" role="img" aria-labelledby="p72-apparatus-title p72-apparatus-desc">
          <title id="p72-apparatus-title">Vehicle compressing a generator speed hump with an energy audit</title>
          <desc id="p72-apparatus-desc">The hump extracts ${format(mechanicalEnergyPerVehicle(), 1)} joules of mechanical work from each vehicle and converts ${format(electricalEnergyPerVehicle(), 1)} joules to electricity at ${format(state.efficiency, 0)} percent efficiency. At ${format(state.flow, 0)} vehicles per hour the electrical power is ${format(electricalPower(), 2)} watts. The rest of the extracted energy becomes generator loss, so this is energy conversion rather than free power.</desc>
          <defs><marker id="p72-arrow-energy" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker></defs>
          <text class="p72-view-label" x="38" y="42">MECHANICAL INPUT</text>
          <line class="p72-road" x1="25" y1="${shape.roadY}" x2="238" y2="${shape.roadY}" /><line class="p72-road" x1="462" y1="${shape.roadY}" x2="675" y2="${shape.roadY}" />
          <path class="p72-hump" data-p72-hump d="${shape.humpPath}" />
          <path class="p72-hump-guide" d="M235 ${shape.roadY}Q350 ${shape.unloadedY} 465 ${shape.roadY}" />
          <g class="p72-car" data-p72-car transform="translate(350 ${shape.carY.toFixed(2)})">
            <path d="M-72-22h92l34 23v31h-126Z" /><path d="M-37-22-17-48h47L54 1" /><circle cx="-43" cy="35" r="13" /><circle cx="28" cy="35" r="13" />
          </g>
          <line class="p72-deflection" data-p72-deflection x1="205" y1="${shape.unloadedY}" x2="205" y2="${shape.plateY.toFixed(2)}" />
          <text class="p72-deflection-label" data-p72-deflection-label x="194" y="${((shape.unloadedY + shape.plateY) / 2).toFixed(2)}" text-anchor="end">d = ${format(state.deflection * 1000, 0)} mm</text>
          <g class="p72-generator">
            <rect x="301" y="300" width="98" height="65" rx="11" />
            <circle cx="350" cy="333" r="21" /><path d="M350 312v42M329 333h42M335 318l30 30M365 318l-30 30" />
          </g>
          <line class="p72-piston" data-p72-piston x1="350" y1="${shape.pistonTop.toFixed(2)}" x2="350" y2="300" />
          <path class="p72-cable" d="M399 333h34" marker-end="url(#p72-arrow-energy)" />
          <text class="p72-flow-label" x="350" y="389" text-anchor="middle" data-p72-live="flow-label">${format(state.flow, 0)} vehicles/hour · F = ${(EFFECTIVE_FORCE / 1000).toFixed(1)} kN effective load</text>

          <g class="p72-ledger">
            <rect class="p72-input-box" x="440" y="62" width="220" height="72" rx="12" />
            <text x="550" y="84" text-anchor="middle">MECHANICAL WORK FROM VEHICLE</text>
            <text class="p72-ledger-value" x="550" y="113" text-anchor="middle" data-p72-live="mechanical-energy">${format(mechanicalEnergyPerVehicle(), 1)} J / vehicle</text>
            <path class="p72-ledger-arrow" d="M550 135v39" marker-end="url(#p72-arrow-energy)" />
            <rect class="p72-generator-box" x="470" y="176" width="160" height="58" rx="12" />
            <text x="550" y="198" text-anchor="middle">GENERATOR</text>
            <text class="p72-ledger-value" x="550" y="220" text-anchor="middle" data-p72-live="efficiency-label">η = ${format(state.efficiency, 0)}%</text>
            <text x="440" y="264">PER-VEHICLE ENERGY SPLIT</text>
            <rect class="p72-energy-track" x="440" y="278" width="240" height="34" rx="8" />
            <rect class="p72-electric-segment" data-p72-electric-segment x="440" y="278" width="${shape.electricityWidth.toFixed(2)}" height="34" rx="8" />
            <rect class="p72-loss-segment" data-p72-loss-segment x="${(440 + shape.electricityWidth).toFixed(2)}" y="278" width="${shape.lossWidth.toFixed(2)}" height="34" rx="8" />
            <text class="p72-electric-label" x="440" y="332" data-p72-live="electrical-energy">electricity ${format(electricalEnergyPerVehicle(), 1)} J</text>
            <text class="p72-loss-label" x="680" y="332" text-anchor="end" data-p72-live="generator-loss-energy">loss ${format(generatorLossPerVehicle(), 1)} J</text>
            <text class="p72-fuel-label" x="560" y="363" text-anchor="middle" data-p72-live="fuel-energy">If restored by a 25% engine: ${format(fuelEnergyPerVehicle(), 0)} J fuel / vehicle</text>
          </g>
        </svg>
        <div class="p72-power-strip">
          <div><span>Traffic mechanical input</span><strong data-p72-live="mechanical-power">${format(inputPower, 2)} W</strong><i style="--p72-size:${((inputPower / largestPower) * 100).toFixed(2)}%"></i></div>
          <b>=</b>
          <div><span>Electrical output</span><strong data-p72-live="electrical-power">${format(outputPower, 2)} W</strong><i style="--p72-size:${((outputPower / largestPower) * 100).toFixed(2)}%"></i></div>
          <b>+</b>
          <div><span>Generator loss</span><strong data-p72-live="generator-loss-power">${format(lossPower, 2)} W</strong><i style="--p72-size:${((lossPower / largestPower) * 100).toFixed(2)}%"></i></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit, digits = 1) {
    return `
      <label class="p72-range-row" for="p72-${kind}-slider">
        <span><strong>${label}</strong><output data-p72-live="${kind}">${format(value, digits)}${unit}</output></span>
        <input id="p72-${kind}-slider" data-p72-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "flow" ? "vehicles each hour" : kind === "deflection" ? "generator stroke" : "electric / mechanical"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p72-controls">
        ${sliderMarkup("flow", "Vehicle flow · q", 0, 1800, 50, state.flow, " veh/h", 0)}
        ${sliderMarkup("deflection", "Hump deflection · d", 0, 0.12, 0.005, state.deflection, " m", 3)}
        ${sliderMarkup("efficiency", "Generator efficiency · η", 0, 100, 5, state.efficiency, "%", 0)}
        <div class="p72-presets" aria-label="Energy-audit presets">${presets.map((preset, index) => `<button class="chip-button p72-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p72-preset" data-p72-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    return `
      <div class="p72-metrics" aria-live="polite">
        <div><span>Electricity per vehicle</span><strong data-p72-live="electricity-per-vehicle">${format(electricalEnergyPerVehicle(), 1)} J · ${format(electricalEnergyPerVehicle() / 3600, 4)} Wh</strong></div>
        <div><span>Average electrical power</span><strong data-p72-live="output-power-card">${format(electricalPower(), 2)} W</strong></div>
        <div><span>Fuel-energy equivalent</span><strong data-p72-live="fuel-power">${format(fuelPower(), 2)} W chemical</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p72-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p72-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p72-solution" aria-labelledby="p72-solution-heading">
        <h3 id="p72-solution-heading" tabindex="-1">Audit energy first, then divide by time</h3>
        <div class="p72-equation">W<sub>mechanical</sub> = Fd = (8000)(0.050) = 400 J per vehicle</div>
        <div class="p72-equation">E<sub>electric</sub> = ηW = (0.60)(400) = 240 J per vehicle</div>
        <div class="p72-equation">q = 600 vehicles/hour = 1/6 vehicle/second</div>
        <div class="p72-equation is-answer">P<sub>electric</sub> = (240 J)(1/6 s⁻¹) = 40 W</div>
        <p>The traffic supplies 66.67 W of mechanical power; 40 W becomes electricity and 26.67 W becomes generator loss. If engines restore the extracted work at 25% efficiency, the equivalent chemical-fuel input is 266.67 W. The precise fuel consequence depends on vehicle operation, but the electrical output can never exceed the mechanical energy removed from traffic.</p>
        <p>In general, <em>P = (q/3600)ηFd</em>. Output vanishes when flow, deflection or efficiency is zero. At η = 1 the generator loss vanishes, but the vehicle still supplies <em>Fd</em>; the device never creates energy.</p>
      </section>`;
  }

  function snapshot() {
    const fuelInput = fuelEnergyPerVehicle();
    const engineLoss = engineLossPerVehicle();
    const generatorLoss = generatorLossPerVehicle();
    const electricity = electricalEnergyPerVehicle();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      modelAssumption: "the generator adds an effective resisting force; vehicles restore the extracted mechanical work",
      effectiveForceNewtons: EFFECTIVE_FORCE,
      vehicleFlowPerHour: state.flow,
      humpDeflectionMetres: state.deflection,
      generatorEfficiency: efficiencyFraction(),
      assumedEngineEfficiencyForFuelComparison: ENGINE_EFFICIENCY,
      mechanicalEnergyPerVehicleJoules: Number(mechanicalEnergyPerVehicle().toFixed(6)),
      electricalEnergyPerVehicleJoules: Number(electricity.toFixed(6)),
      generatorLossPerVehicleJoules: Number(generatorLoss.toFixed(6)),
      fuelEnergyPerVehicleJoules: Number(fuelInput.toFixed(6)),
      engineLossPerVehicleJoules: Number(engineLoss.toFixed(6)),
      perVehicleFuelLedgerResidualJoules: Number((fuelInput - engineLoss - generatorLoss - electricity).toFixed(9)),
      mechanicalPowerWatts: Number(mechanicalPower().toFixed(6)),
      electricalPowerWatts: Number(electricalPower().toFixed(6)),
      generatorLossPowerWatts: Number(generatorLossPower().toFixed(6)),
      questionAnswerWatts: questionAnswer(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p72-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive energy audit</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p72-spread">
          <article class="book-page p72-problem-page">
            <div class="problem-number">Problem 7.2</div>
            <h1 class="book-title p72-title">Power-producing speed humps</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">A generator hump exerts an effective extra resisting force of 8.0 kN while each vehicle depresses it by 0.050 m. The generator converts 60% of the extracted mechanical work to electricity.</p>
            <p class="problem-copy">If 600 vehicles cross each hour, what is the average electrical power output?</p>
            <p class="p72-assumption">Model the extracted work as an additional vehicle energy cost. A 25% engine efficiency is used only for the illustrative fuel-energy comparison.</p>
            <p class="p72-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written generator-hump audit is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">No free-energy shortcut</div><p>The hump converts energy removed from passing vehicles. Generator efficiency decides how much becomes electricity, not whether an input is required.</p></section>
          </article>

          <section class="book-page book-stage p72-stage" aria-labelledby="p72-stage-title">
            <div class="p72-stage-card">
              <div class="p72-stage-heading"><div><span class="eyebrow">Roadside energy laboratory</span><h2 id="p72-stage-title">Follow every joule</h2></div><p>Change traffic, stroke or efficiency. Per-vehicle energy and average power remain separate in the audit.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p72-coach">
            <div class="coach-kicker">Find average power</div>
            <p class="coach-question">For the 8.0 kN, 0.050 m, 60%, 600-per-hour setup, what electrical power is delivered?</p>
            <form class="p72-answer-form" data-p72-answer-form novalidate>
              <label for="p72-answer">Electrical power</label>
              <div><input id="p72-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 50" /><span>W</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p72-help-row"><button class="secondary-button" type="button" data-problem-action="p72-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p72-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
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
    const inputPower = mechanicalPower();
    const outputPower = electricalPower();
    const lossPower = generatorLossPower();
    const largestPower = Math.max(inputPower, 1e-9);
    const values = {
      flow: `${format(state.flow, 0)} veh/h`,
      deflection: `${format(state.deflection, 3)} m`,
      efficiency: `${format(state.efficiency, 0)}%`,
      "flow-label": `${format(state.flow, 0)} vehicles/hour · F = ${(EFFECTIVE_FORCE / 1000).toFixed(1)} kN effective load`,
      "mechanical-energy": `${format(mechanicalEnergyPerVehicle(), 1)} J / vehicle`,
      "efficiency-label": `η = ${format(state.efficiency, 0)}%`,
      "electrical-energy": `electricity ${format(electricalEnergyPerVehicle(), 1)} J`,
      "generator-loss-energy": `loss ${format(generatorLossPerVehicle(), 1)} J`,
      "fuel-energy": `If restored by a 25% engine: ${format(fuelEnergyPerVehicle(), 0)} J fuel / vehicle`,
      "mechanical-power": `${format(inputPower, 2)} W`,
      "electrical-power": `${format(outputPower, 2)} W`,
      "generator-loss-power": `${format(lossPower, 2)} W`,
      "electricity-per-vehicle": `${format(electricalEnergyPerVehicle(), 1)} J · ${format(electricalEnergyPerVehicle() / 3600, 4)} Wh`,
      "output-power-card": `${format(outputPower, 2)} W`,
      "fuel-power": `${format(fuelPower(), 2)} W chemical`,
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p72-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const hump = root.querySelector("[data-p72-hump]");
    if (hump) hump.setAttribute("d", shape.humpPath);
    const car = root.querySelector("[data-p72-car]");
    if (car) car.setAttribute("transform", `translate(350 ${shape.carY.toFixed(2)})`);
    const piston = root.querySelector("[data-p72-piston]");
    if (piston) piston.setAttribute("y1", shape.pistonTop.toFixed(2));
    const deflection = root.querySelector("[data-p72-deflection]");
    if (deflection) deflection.setAttribute("y2", shape.plateY.toFixed(2));
    const deflectionLabel = root.querySelector("[data-p72-deflection-label]");
    if (deflectionLabel) {
      deflectionLabel.setAttribute("y", ((shape.unloadedY + shape.plateY) / 2).toFixed(2));
      deflectionLabel.textContent = `d = ${format(state.deflection * 1000, 0)} mm`;
    }
    const electricitySegment = root.querySelector("[data-p72-electric-segment]");
    if (electricitySegment) electricitySegment.setAttribute("width", shape.electricityWidth.toFixed(2));
    const lossSegment = root.querySelector("[data-p72-loss-segment]");
    if (lossSegment) {
      lossSegment.setAttribute("x", (440 + shape.electricityWidth).toFixed(2));
      lossSegment.setAttribute("width", shape.lossWidth.toFixed(2));
    }
    const bars = root.querySelectorAll(".p72-power-strip i");
    bars[0]?.style.setProperty("--p72-size", `${((inputPower / largestPower) * 100).toFixed(2)}%`);
    bars[1]?.style.setProperty("--p72-size", `${((outputPower / largestPower) * 100).toFixed(2)}%`);
    bars[2]?.style.setProperty("--p72-size", `${((lossPower / largestPower) * 100).toFixed(2)}%`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p72-preset"]').forEach((button) => {
      const active = Number(button.dataset.p72Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p72-apparatus-desc");
    if (description) description.textContent = `The hump extracts ${format(mechanicalEnergyPerVehicle(), 1)} joules of mechanical work from each vehicle and converts ${format(electricalEnergyPerVehicle(), 1)} joules to electricity at ${format(state.efficiency, 0)} percent efficiency. At ${format(state.flow, 0)} vehicles per hour the electrical power is ${format(electricalPower(), 2)} watts. The rest of the extracted energy becomes generator loss, so this is energy conversion rather than free power.`;
    root.querySelector(".p72-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parsePowerWatts(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/kw$/.test(normalized)) return Number(normalized.replace(/\s*kw$/, "")) * 1000;
    if (/w$/.test(normalized)) return Number(normalized.replace(/\s*w$/, ""));
    return Number(normalized);
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p72-shell");
    if (!root) return;

    root.querySelector("#p72-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p72-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p72Slider;
        if (kind === "flow") state.flow = clamp(event.target.value, 0, 1800);
        if (kind === "deflection") state.deflection = clamp(event.target.value, 0, 0.12);
        if (kind === "efficiency") state.efficiency = clamp(event.target.value, 0, 100);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p72-reset") state = initialState();
        if (action === "p72-preset") {
          const preset = presets[Number(control.dataset.p72Preset)];
          if (preset) {
            state.flow = preset.flow;
            state.deflection = preset.deflection;
            state.efficiency = preset.efficiency;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p72-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p72-reveal") state.revealed = true;
        rerender();
        if (action === "p72-reveal") window.requestAnimationFrame(() => document.querySelector("#p72-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p72-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p72-answer")?.value || "";
      const estimate = parsePowerWatts(raw);
      const exact = questionAnswer();
      const mechanicalPerVehicle = mechanicalEnergyPerVehicle(QUESTION_DEFLECTION);
      const electricalPerVehicle = electricalEnergyPerVehicle(QUESTION_DEFLECTION, QUESTION_EFFICIENCY);
      const mechanicalAveragePower = mechanicalPower(QUESTION_FLOW, QUESTION_DEFLECTION);
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate < 0) {
        state.feedback = "Enter a non-negative electrical power in watts, or include kW with your value.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.5) {
          state.feedback = "Correct. Each vehicle supplies 240 J of electricity, and 600 per hour is 1/6 per second, giving 40 W.";
          state.feedbackTone = "success";
          state.flow = QUESTION_FLOW;
          state.deflection = QUESTION_DEFLECTION;
          state.efficiency = QUESTION_EFFICIENCY;
        } else if (Math.abs(estimate - electricalPerVehicle) <= 2) {
          state.feedback = "That is electrical energy per vehicle in joules, not average power. Multiply by vehicles per second.";
        } else if (Math.abs(estimate - mechanicalPerVehicle) <= 2) {
          state.feedback = "That is mechanical work per vehicle before generator losses. Apply efficiency and traffic rate.";
        } else if (Math.abs(estimate - mechanicalAveragePower) <= 1) {
          state.feedback = "That is the mechanical power extracted from traffic. Multiply by the 60% generator efficiency.";
        } else if (estimate > exact) {
          state.feedback = "That is too large. Keep joules per vehicle separate from vehicles per hour, and include efficiency.";
        } else {
          state.feedback = "That is too small. Convert the traffic rate to vehicles per second before multiplying by energy per vehicle.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p72-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
