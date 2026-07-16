(function registerSpaceGraveyardPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.5";
  const STANDARD_GRAVITY = 9.80665;
  const QUESTION = Object.freeze({
    gravitationalParameter: 398600,
    bodyRadius: 6371,
    initialRadius: 42164,
    targetRadius: 42464,
    spacecraftMass: 2000,
    specificImpulse: 220,
  });
  const bodies = Object.freeze([
    Object.freeze({ label: "Earth model", short: "Earth", gravitationalParameter: 398600, radius: 6371, initialRadius: 42164, targetRadius: 42464 }),
    Object.freeze({ label: "Moon model", short: "Moon", gravitationalParameter: 4902.8, radius: 1737.4, initialRadius: 5000, targetRadius: 5500 }),
    Object.freeze({ label: "Mars model", short: "Mars", gravitationalParameter: 42828, radius: 3389.5, initialRadius: 20000, targetRadius: 20500 }),
    Object.freeze({ label: "Training planet", short: "Training", gravitationalParameter: 100000, radius: 5000, initialRadius: 20000, targetRadius: 25000 }),
  ]);
  const hints = Object.freeze([
    "The transfer ellipse touches both circles, so its semi-major axis is aₜ=(r₁+r₂)/2.",
    "Use vis-viva, v²=μ(2/r−1/a), at each end of the transfer ellipse. Circular speed is √(μ/r).",
    "At r₁, Δv₁=vtransfer,1−vcircular,1. At r₂, Δv₂=vcircular,2−vtransfer,2.",
    "For this outward transfer both impulses are prograde, so add their positive magnitudes. Convert km/s to m/s only at the end.",
    "The first burn is about 5.4449 m/s and the second about 5.4353 m/s.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p105-reset">Reset</button>';

  const initialState = () => ({
    bodyIndex: 0,
    gravitationalParameter: QUESTION.gravitationalParameter,
    bodyRadius: QUESTION.bodyRadius,
    initialRadius: QUESTION.initialRadius,
    targetRadius: QUESTION.targetRadius,
    spacecraftMass: QUESTION.spacecraftMass,
    specificImpulse: QUESTION.specificImpulse,
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

  function transferAnalysis(
    gravitationalParameter = state.gravitationalParameter,
    initialRadius = state.initialRadius,
    targetRadius = state.targetRadius,
    spacecraftMass = state.spacecraftMass,
    specificImpulse = state.specificImpulse,
  ) {
    const mu = Math.max(Number(gravitationalParameter), 1e-12);
    const radius1 = Math.max(Number(initialRadius), 1e-12);
    const radius2 = Math.max(Number(targetRadius), 1e-12);
    const direction = radius2 > radius1 ? "raising" : radius2 < radius1 ? "lowering" : "stationary";
    const transferSemiMajorAxis = (radius1 + radius2) / 2;
    const circularSpeed1 = Math.sqrt(mu / radius1);
    const circularSpeed2 = Math.sqrt(mu / radius2);
    const transferSpeed1 = Math.sqrt(mu * (2 / radius1 - 1 / transferSemiMajorAxis));
    const transferSpeed2 = Math.sqrt(mu * (2 / radius2 - 1 / transferSemiMajorAxis));
    const burn1 = transferSpeed1 - circularSpeed1;
    const burn2 = circularSpeed2 - transferSpeed2;
    const totalDeltaV = Math.abs(burn1) + Math.abs(burn2);
    const initialSpecificEnergy = -mu / (2 * radius1);
    const transferSpecificEnergy = -mu / (2 * transferSemiMajorAxis);
    const targetSpecificEnergy = -mu / (2 * radius2);
    const transferTimeSeconds = direction === "stationary" ? 0 : Math.PI * Math.sqrt(transferSemiMajorAxis ** 3 / mu);
    const deltaVMetresPerSecond = totalDeltaV * 1000;
    const wetMass = Math.max(Number(spacecraftMass), 0);
    const impulseSeconds = Math.max(Number(specificImpulse), 1e-12);
    const finalMass = wetMass * Math.exp(-deltaVMetresPerSecond / (impulseSeconds * STANDARD_GRAVITY));
    return {
      direction,
      transferSemiMajorAxis,
      circularSpeed1,
      circularSpeed2,
      transferSpeed1,
      transferSpeed2,
      burn1,
      burn2,
      totalDeltaV,
      deltaVMetresPerSecond,
      initialSpecificEnergy,
      transferSpecificEnergy,
      targetSpecificEnergy,
      specificEnergyChange: targetSpecificEnergy - initialSpecificEnergy,
      nominalConstantMassEnergyChangeMegajoules: wetMass * (targetSpecificEnergy - initialSpecificEnergy),
      burn1EnergyResidual: (transferSpeed1 ** 2 - circularSpeed1 ** 2) / 2 - (transferSpecificEnergy - initialSpecificEnergy),
      burn2EnergyResidual: (circularSpeed2 ** 2 - transferSpeed2 ** 2) / 2 - (targetSpecificEnergy - transferSpecificEnergy),
      transferTimeSeconds,
      finalMass,
      propellantMass: wetMass - finalMass,
      propellantFraction: wetMass > 0 ? 1 - finalMass / wetMass : 0,
    };
  }

  function questionAnalysis() {
    return transferAnalysis(
      QUESTION.gravitationalParameter,
      QUESTION.initialRadius,
      QUESTION.targetRadius,
      QUESTION.spacecraftMass,
      QUESTION.specificImpulse,
    );
  }

  const challenge = questionAnalysis();

  function orbitMaximum() {
    return Math.max(60000, Math.ceil(state.bodyRadius * 10 / 1000) * 1000);
  }

  function activeBodyIndex() {
    return bodies.findIndex((body) => (
      Math.abs(body.gravitationalParameter - state.gravitationalParameter) < 1e-9
      && Math.abs(body.radius - state.bodyRadius) < 1e-9
    ));
  }

  function directionCopy(analysis = transferAnalysis()) {
    if (analysis.direction === "raising") return "Outward retirement transfer · both burns prograde";
    if (analysis.direction === "lowering") return "Inward transfer · both burns retrograde; this is not a graveyard raise";
    return "The two circular radii coincide · no transfer or propellant required";
  }

  function diagramGeometry() {
    const centre = { x: 235, y: 218 };
    const bodyVisualRadius = 54;
    if (Math.abs(state.initialRadius - state.targetRadius) < 1e-9) {
      return { centre, bodyVisualRadius, initialVisualRadius: 145, targetVisualRadius: 145, transferA: 145, transferB: 145, transferCentreX: centre.x };
    }
    const initialIsInner = state.initialRadius < state.targetRadius;
    const initialVisualRadius = initialIsInner ? 130 : 172;
    const targetVisualRadius = initialIsInner ? 172 : 130;
    const transferA = (initialVisualRadius + targetVisualRadius) / 2;
    const transferB = Math.sqrt(initialVisualRadius * targetVisualRadius);
    const transferCentreX = centre.x + (initialVisualRadius - targetVisualRadius) / 2;
    return { centre, bodyVisualRadius, initialVisualRadius, targetVisualRadius, transferA, transferB, transferCentreX };
  }

  function burnArrowMarkup(x, y, signedDeltaV, velocityDirection) {
    if (Math.abs(signedDeltaV) < 1e-12) return "";
    const direction = signedDeltaV > 0 ? velocityDirection : -velocityDirection;
    return `<line class="p105-burn-arrow" x1="${x}" y1="${y}" x2="${x}" y2="${format(y - 35 * direction, 2)}" marker-end="url(#p105-arrow-burn)" />`;
  }

  function apparatusMarkup() {
    const analysis = transferAnalysis();
    const diagram = diagramGeometry();
    const startX = diagram.centre.x + diagram.initialVisualRadius;
    const finishX = diagram.centre.x - diagram.targetVisualRadius;
    const energyValues = [analysis.initialSpecificEnergy, analysis.transferSpecificEnergy, analysis.targetSpecificEnergy];
    const energyMinimum = Math.min(...energyValues);
    const energyMaximum = Math.max(...energyValues);
    const energyY = (value) => Math.abs(energyMaximum - energyMinimum) < 1e-12 ? 214 : 302 - 174 * (value - energyMinimum) / (energyMaximum - energyMinimum);
    return `
      <div class="p105-apparatus-wrap">
        <svg class="p105-apparatus is-${analysis.direction}" viewBox="0 0 740 420" role="img" aria-labelledby="p105-apparatus-title p105-apparatus-desc">
          <title id="p105-apparatus-title">Two-burn circular-orbit disposal transfer and energy audit</title>
          <desc id="p105-apparatus-desc">A spacecraft transfers from circular radius ${format(state.initialRadius, 1)} kilometres to ${format(state.targetRadius, 1)} kilometres around a body with gravitational parameter ${format(state.gravitationalParameter, 1)} cubic kilometres per second squared. Burn one is ${format(analysis.burn1 * 1000, 4)} metres per second, burn two is ${format(analysis.burn2 * 1000, 4)} metres per second, and the total delta v is ${format(analysis.deltaVMetresPerSecond, 4)} metres per second.</desc>
          <defs>
            <radialGradient id="p105-body-gradient" cx="35%" cy="28%" r="75%"><stop offset="0" stop-color="#b8dce0" /><stop offset="0.55" stop-color="#508b9a" /><stop offset="1" stop-color="#294f61" /></radialGradient>
            <marker id="p105-arrow-burn" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" /></marker>
          </defs>
          <line class="p105-divider" x1="474" y1="28" x2="474" y2="390" />
          <text class="p105-panel-title" x="25" y="31">HOHMANN-STYLE HALF-ELLIPSE</text>
          <circle class="p105-body" cx="${diagram.centre.x}" cy="${diagram.centre.y}" r="${diagram.bodyVisualRadius}" />
          <circle class="p105-initial-orbit" cx="${diagram.centre.x}" cy="${diagram.centre.y}" r="${diagram.initialVisualRadius}" />
          <circle class="p105-target-orbit" cx="${diagram.centre.x}" cy="${diagram.centre.y}" r="${diagram.targetVisualRadius}" />
          <path class="p105-transfer-orbit" d="M${format(startX, 2)},${diagram.centre.y} A${format(diagram.transferA, 2)},${format(diagram.transferB, 2)} 0 0 0 ${format(finishX, 2)},${diagram.centre.y}" />
          <circle class="p105-burn-point is-first" cx="${format(startX, 2)}" cy="${diagram.centre.y}" r="7" />
          <circle class="p105-burn-point is-second" cx="${format(finishX, 2)}" cy="${diagram.centre.y}" r="7" />
          ${burnArrowMarkup(startX, diagram.centre.y, analysis.burn1, 1)}
          ${burnArrowMarkup(finishX, diagram.centre.y, analysis.burn2, -1)}
          <text class="p105-burn-label is-first" x="${format(startX - 5, 2)}" y="${format(diagram.centre.y + 54, 2)}" text-anchor="end">burn 1 · ${analysis.burn1 >= 0 ? "+" : ""}${format(analysis.burn1 * 1000, 3)} m/s</text>
          <text class="p105-burn-label is-second" x="${format(finishX + 5, 2)}" y="${format(diagram.centre.y + 54, 2)}">burn 2 · ${analysis.burn2 >= 0 ? "+" : ""}${format(analysis.burn2 * 1000, 3)} m/s</text>
          <text class="p105-body-label" x="${diagram.centre.x}" y="${diagram.centre.y - 3}" text-anchor="middle">μ=${format(state.gravitationalParameter, 1)}</text><text class="p105-body-label is-unit" x="${diagram.centre.x}" y="${diagram.centre.y + 14}" text-anchor="middle">km³/s²</text>
          <g class="p105-orbit-key" transform="translate(27 354)"><line class="is-initial" x1="0" y1="0" x2="28" y2="0" /><text x="36" y="4">initial circle r₁=${format(state.initialRadius, 1)} km</text><line class="is-target" x1="0" y1="25" x2="28" y2="25" /><text x="36" y="29">target circle r₂=${format(state.targetRadius, 1)} km</text><text class="is-note" x="260" y="17">orbit spacing schematic · numeric radii govern the physics</text></g>

          <g class="p105-energy-ladder">
            <text class="p105-panel-title" x="497" y="31">SPECIFIC ENERGY LADDER</text>
            <line class="p105-energy-axis" x1="512" y1="102" x2="512" y2="326" />
            ${analysis.direction === "stationary" ? `<line class="p105-energy-level is-target" x1="512" y1="214" x2="700" y2="214" /><text class="p105-energy-label is-target" x="520" y="207">ε₁=εₜ=ε₂=${format(analysis.targetSpecificEnergy, 5)} MJ/kg</text>` : `<line class="p105-energy-level is-initial" x1="512" y1="${format(energyY(analysis.initialSpecificEnergy), 2)}" x2="700" y2="${format(energyY(analysis.initialSpecificEnergy), 2)}" /><line class="p105-energy-level is-transfer" x1="512" y1="${format(energyY(analysis.transferSpecificEnergy), 2)}" x2="700" y2="${format(energyY(analysis.transferSpecificEnergy), 2)}" /><line class="p105-energy-level is-target" x1="512" y1="${format(energyY(analysis.targetSpecificEnergy), 2)}" x2="700" y2="${format(energyY(analysis.targetSpecificEnergy), 2)}" /><text class="p105-energy-label is-initial" x="520" y="${format(energyY(analysis.initialSpecificEnergy) - 7, 2)}">ε₁ ${format(analysis.initialSpecificEnergy, 5)} MJ/kg</text><text class="p105-energy-label is-transfer" x="520" y="${format(energyY(analysis.transferSpecificEnergy) - 7, 2)}">εₜ ${format(analysis.transferSpecificEnergy, 5)} MJ/kg</text><text class="p105-energy-label is-target" x="520" y="${format(energyY(analysis.targetSpecificEnergy) - 7, 2)}">ε₂ ${format(analysis.targetSpecificEnergy, 5)} MJ/kg</text>`}
            <text class="p105-energy-note" x="606" y="365" text-anchor="middle">Δε = ${analysis.specificEnergyChange >= 0 ? "+" : ""}${format(analysis.specificEnergyChange, 6)} MJ/kg</text>
          </g>
        </svg>
        <div class="p105-status-strip is-${analysis.direction}"><strong>${directionCopy(analysis)}</strong><span>Transfer time ${format(analysis.transferTimeSeconds / 3600, 3)} h</span></div>
      </div>`;
  }

  function burnLedgerMarkup() {
    const analysis = transferAnalysis();
    return `
      <div class="p105-burn-ledger" aria-label="Transfer impulse calculation">
        <div><span>Burn 1 at r₁</span><strong>${analysis.burn1 >= 0 ? "+" : ""}${format(analysis.burn1 * 1000, 5)} m/s</strong><small>${format(analysis.circularSpeed1, 5)} → ${format(analysis.transferSpeed1, 5)} km/s</small></div>
        <div><span>Burn 2 at r₂</span><strong>${analysis.burn2 >= 0 ? "+" : ""}${format(analysis.burn2 * 1000, 5)} m/s</strong><small>${format(analysis.transferSpeed2, 5)} → ${format(analysis.circularSpeed2, 5)} km/s</small></div>
        <div><span>Total ideal Δv</span><strong>${format(analysis.deltaVMetresPerSecond, 5)} m/s</strong><small>|Δv₁|+|Δv₂|</small></div>
      </div>`;
  }

  function consequenceMarkup() {
    const analysis = transferAnalysis();
    return `
      <div class="p105-consequences" aria-live="polite">
        <div><span>Spacecraft wet mass</span><strong>${format(state.spacecraftMass, 1)} kg</strong><small>does not change orbital Δv</small></div>
        <div><span>Specific-energy change</span><strong>${analysis.specificEnergyChange >= 0 ? "+" : ""}${format(analysis.specificEnergyChange, 6)} MJ/kg</strong><small>independent of spacecraft mass</small></div>
        <div><span>Ideal propellant used</span><strong>${format(analysis.propellantMass, 4)} kg</strong><small>Isp=${format(state.specificImpulse, 0)} s · ${format(analysis.propellantFraction * 100, 4)}% wet mass</small></div>
      </div>`;
  }

  function dynamicMarkup() {
    return `<div class="p105-dynamic">${apparatusMarkup()}${burnLedgerMarkup()}${consequenceMarkup()}</div>`;
  }

  function controlsMarkup() {
    const activeBody = activeBodyIndex();
    const radiusMinimum = Math.ceil((state.bodyRadius + 100) / 10) * 10;
    const radiusMaximum = orbitMaximum();
    return `
      <section class="p105-controls" aria-label="Graveyard transfer controls">
        <div class="p105-body-picker" role="group" aria-label="Choose central body">${bodies.map((body, index) => `<button class="secondary-button ${activeBody === index ? "active" : ""}" type="button" data-problem-action="p105-body" data-p105-body="${index}" aria-pressed="${activeBody === index}">${body.short}</button>`).join("")}</div>
        <div class="p105-control-grid">
          <label for="p105-initial-radius"><span>Initial circular radius r<sub>1</sub><output data-p105-live="initial-radius">${format(state.initialRadius, 0)} km</output></span><input id="p105-initial-radius" data-p105-slider="initial-radius" type="range" min="${radiusMinimum}" max="${radiusMaximum}" step="10" value="${state.initialRadius}" /></label>
          <label for="p105-target-radius"><span>Graveyard target radius r<sub>2</sub><output data-p105-live="target-radius">${format(state.targetRadius, 0)} km</output></span><input id="p105-target-radius" data-p105-slider="target-radius" type="range" min="${radiusMinimum}" max="${radiusMaximum}" step="10" value="${state.targetRadius}" /></label>
          <label for="p105-mass"><span>Spacecraft wet mass m<sub>0</sub><output data-p105-live="mass">${format(state.spacecraftMass, 0)} kg</output></span><input id="p105-mass" data-p105-slider="mass" type="range" min="100" max="10000" step="100" value="${state.spacecraftMass}" /></label>
          <label for="p105-isp"><span>Thruster specific impulse I<sub>sp</sub><output data-p105-live="isp">${format(state.specificImpulse, 0)} s</output></span><input id="p105-isp" data-p105-slider="isp" type="range" min="100" max="500" step="10" value="${state.specificImpulse}" /></label>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p105-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p105-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p105-solution" aria-labelledby="p105-solution-heading">
        <h3 id="p105-solution-heading" tabindex="-1">Two small prograde burns lift the orbit</h3>
        <p>The transfer ellipse has</p>
        <div class="p105-equation">a<sub>t</sub>=(r₁+r₂)/2=(42164+42464)/2=42314 km</div>
        <p>Use circular speed v<sub>c</sub>=√(μ/r) and vis-viva v²=μ(2/r−1/a<sub>t</sub>) at each burn:</p>
        <div class="p105-equation">Δv₁ = √[μ(2/r₁−1/a<sub>t</sub>)] − √(μ/r₁)<br>= ${format(challenge.burn1, 9)} km/s = ${format(challenge.burn1 * 1000, 6)} m/s</div>
        <div class="p105-equation">Δv₂ = √(μ/r₂) − √[μ(2/r₂−1/a<sub>t</sub>)]<br>= ${format(challenge.burn2, 9)} km/s = ${format(challenge.burn2 * 1000, 6)} m/s</div>
        <div class="p105-equation is-answer">Δv<sub>total</sub> = |Δv₁|+|Δv₂| = ${format(challenge.deltaVMetresPerSecond, 6)} m/s ≈ 10.88 m/s</div>
        <p>The transfer takes ${format(challenge.transferTimeSeconds / 3600, 4)} h. Specific orbital energy rises from ${format(challenge.initialSpecificEnergy, 6)} to ${format(challenge.targetSpecificEnergy, 6)} MJ/kg; “rises” here means it becomes less negative.</p>
        <p>Mass cancels from every orbital speed, specific energy and Δv. Wet mass matters to the propellant budget. With m₀=2000 kg and I<sub>sp</sub>=220 s, the ideal rocket equation gives</p>
        <div class="p105-equation">m<sub>f</sub>=m₀exp[−Δv/(g₀I<sub>sp</sub>)] &nbsp;⇒&nbsp; m<sub>prop</sub>=${format(challenge.propellantMass, 6)} kg</div>
        <p class="p105-limits"><strong>Checks and idealisation.</strong> The burns are instantaneous, tangent and coplanar; the central body is spherical; no third-body gravity, oblateness, atmosphere, station-keeping reserve or finite-burn loss is included. If r₂=r₁, both burns and propellant tend to zero. Reversing the radii reverses both signed impulses but not the sum of their magnitudes. Scaling spacecraft mass scales total energy and propellant mass, never Δv. Increasing I<sub>sp</sub> reduces propellant. Radii and μ in kilometres give speeds in km/s; the rocket equation uses Δv in m/s with g₀=${STANDARD_GRAVITY} m/s².</p>
      </section>`;
  }

  function parseDeltaV(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/km\s*\/\s*s$/.test(normalized)) return Number(normalized.replace(/\s*km\s*\/\s*s$/, "")) * 1000;
    if (/m\s*\/\s*s$/.test(normalized)) return Number(normalized.replace(/\s*m\s*\/\s*s$/, ""));
    if (/mps$/.test(normalized)) return Number(normalized.replace(/\s*mps$/, ""));
    return Number(normalized);
  }

  function snapshot() {
    const analysis = transferAnalysis();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      idealisation: "two instantaneous tangent coplanar burns in spherical two-body gravity; constant-Isp rocket equation",
      centralBody: bodies[state.bodyIndex]?.label || "customized body preset",
      gravitationalParameterCubicKilometresPerSecondSquared: state.gravitationalParameter,
      bodyRadiusKilometres: state.bodyRadius,
      initialCircularRadiusKilometres: state.initialRadius,
      targetCircularRadiusKilometres: state.targetRadius,
      transferDirection: analysis.direction,
      transferSemiMajorAxisKilometres: Number(analysis.transferSemiMajorAxis.toFixed(9)),
      burn1MetresPerSecond: Number((analysis.burn1 * 1000).toFixed(9)),
      burn2MetresPerSecond: Number((analysis.burn2 * 1000).toFixed(9)),
      totalDeltaVMetresPerSecond: Number(analysis.deltaVMetresPerSecond.toFixed(9)),
      transferTimeHours: Number((analysis.transferTimeSeconds / 3600).toFixed(9)),
      initialSpecificEnergyMegajoulesPerKilogram: Number(analysis.initialSpecificEnergy.toFixed(9)),
      transferSpecificEnergyMegajoulesPerKilogram: Number(analysis.transferSpecificEnergy.toFixed(9)),
      targetSpecificEnergyMegajoulesPerKilogram: Number(analysis.targetSpecificEnergy.toFixed(9)),
      specificEnergyChangeMegajoulesPerKilogram: Number(analysis.specificEnergyChange.toFixed(9)),
      burn1EnergyResidualMegajoulesPerKilogram: Number(analysis.burn1EnergyResidual.toFixed(12)),
      burn2EnergyResidualMegajoulesPerKilogram: Number(analysis.burn2EnergyResidual.toFixed(12)),
      nominalConstantMassEnergyChangeMegajoules: Number(analysis.nominalConstantMassEnergyChangeMegajoules.toFixed(9)),
      spacecraftWetMassKilograms: state.spacecraftMass,
      specificImpulseSeconds: state.specificImpulse,
      idealPropellantMassKilograms: Number(analysis.propellantMass.toFixed(9)),
      questionAnswerMetresPerSecond: Number(challenge.deltaVMetresPerSecond.toFixed(9)),
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p105-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive orbital disposal</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p105-spread">
          <article class="book-page p105-problem-page">
            <div class="problem-number">Problem 10.5</div>
            <h1 class="book-title p105-title">Space graveyard</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="p105-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written disposal-transfer problem is not the book’s wording or solution.</p>
            <p class="problem-copy">A 2,000 kg satellite circles an Earth model at radius 42,164 km. It must retire to a circular graveyard orbit at radius 42,464 km using an ideal two-burn tangent transfer.</p>
            <p class="problem-copy">What total ideal Δv is required?</p>
            <section class="p105-model-card"><strong>Ideal transfer</strong><p>Use μ=398,600 km³/s². Burns are instantaneous, coplanar and tangent; both stated radii are measured from the body’s centre. Propellant calculations use I<sub>sp</sub>=220 s and g₀=${STANDARD_GRAVITY} m/s².</p></section>
            <section class="prediction-box"><div class="eyebrow">Mass is a decoy—at first</div><p>Orbital speeds, specific energy and Δv do not depend on spacecraft mass. Wet mass returns when the rocket equation converts Δv into propellant.</p></section>
          </article>

          <section class="book-page book-stage p105-stage" aria-labelledby="p105-stage-title">
            <div class="p105-stage-heading"><div><span class="eyebrow">Retirement manoeuvre laboratory</span><h2 id="p105-stage-title">Raise, coast, circularize</h2></div><p>Change the central body, either circular radius, wet mass or thruster performance. Signed impulses and propellant update together.</p></div>
            ${dynamicMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p105-coach">
            <div class="coach-kicker">Budget the retirement burns</div>
            <p class="coach-question">For the stated Earth transfer from 42,164 km to 42,464 km, what is |Δv₁|+|Δv₂|?</p>
            <form class="p105-answer-form" data-p105-answer-form novalidate>
              <label for="p105-answer">Total ideal delta-v</label>
              <div><input id="p105-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="e.g. 11" /><span>m/s</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p105-help-row"><button class="secondary-button" type="button" data-problem-action="p105-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p105-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p105-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p105-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = {
      "initial-radius": `${format(state.initialRadius, 0)} km`,
      "target-radius": `${format(state.targetRadius, 0)} km`,
      mass: `${format(state.spacecraftMass, 0)} kg`,
      isp: `${format(state.specificImpulse, 0)} s`,
    };
    Object.entries(outputs).forEach(([key, value]) => root.querySelectorAll(`[data-p105-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const analysis = transferAnalysis();
    root.querySelector("#p105-initial-radius")?.setAttribute("aria-valuetext", `Initial circular radius ${format(state.initialRadius, 0)} kilometres; ${directionCopy(analysis)}`);
    root.querySelector("#p105-target-radius")?.setAttribute("aria-valuetext", `Target circular radius ${format(state.targetRadius, 0)} kilometres; total delta v ${format(analysis.deltaVMetresPerSecond, 3)} metres per second`);
    root.querySelector("#p105-mass")?.setAttribute("aria-valuetext", `Wet mass ${format(state.spacecraftMass, 0)} kilograms; ideal propellant ${format(analysis.propellantMass, 3)} kilograms`);
    root.querySelector("#p105-isp")?.setAttribute("aria-valuetext", `Specific impulse ${format(state.specificImpulse, 0)} seconds; ideal propellant ${format(analysis.propellantMass, 3)} kilograms`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(rerender, selector) {
    rerender();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p105-shell");
    if (!root) return;
    const radiusMinimum = Math.ceil((state.bodyRadius + 100) / 10) * 10;
    const radiusMaximum = orbitMaximum();

    root.querySelectorAll("[data-p105-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p105Slider;
        if (kind === "initial-radius") state.initialRadius = clamp(event.target.value, radiusMinimum, radiusMaximum);
        if (kind === "target-radius") state.targetRadius = clamp(event.target.value, radiusMinimum, radiusMaximum);
        if (kind === "mass") state.spacecraftMass = clamp(event.target.value, 100, 10000);
        if (kind === "isp") state.specificImpulse = clamp(event.target.value, 100, 500);
        state.feedback = "";
        state.committed = false;
        updateDynamicDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p105-reset") {
          state = initialState();
          renderAndFocus(rerender, "#p105-initial-radius");
          return;
        }
        if (action === "p105-body") {
          const index = Number(control.dataset.p105Body);
          const body = bodies[index];
          if (body) {
            state.bodyIndex = index;
            state.gravitationalParameter = body.gravitationalParameter;
            state.bodyRadius = body.radius;
            state.initialRadius = body.initialRadius;
            state.targetRadius = body.targetRadius;
            state.feedback = "";
            state.committed = false;
          }
          renderAndFocus(rerender, `[data-p105-body="${index}"]`);
          return;
        }
        if (action === "p105-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p105-reveal") state.revealed = true;
        rerender();
        if (action === "p105-reveal") window.requestAnimationFrame(() => document.querySelector("#p105-solution-heading")?.focus());
      });
    });

    root.querySelector("#p105-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelector("[data-p105-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p105-answer")?.value || "";
      const answer = parseDeltaV(raw);
      const exact = challenge.deltaVMetresPerSecond;
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(answer) || answer < 0) {
        state.feedback = "Enter a non-negative total delta-v in m/s; km/s is also accepted.";
        state.feedbackTone = "warn";
      } else if (Math.abs(answer - exact) <= 0.02) {
        state.feedback = `Correct. The ${format(challenge.burn1 * 1000, 4)} m/s and ${format(challenge.burn2 * 1000, 4)} m/s burns total ${format(exact, 4)} m/s.`;
        state.feedbackTone = "success";
        state.committed = true;
        state = { ...state, bodyIndex: 0, gravitationalParameter: QUESTION.gravitationalParameter, bodyRadius: QUESTION.bodyRadius, initialRadius: QUESTION.initialRadius, targetRadius: QUESTION.targetRadius, spacecraftMass: QUESTION.spacecraftMass, specificImpulse: QUESTION.specificImpulse };
      } else if (Math.abs(answer - challenge.burn1 * 1000) <= 0.02 || Math.abs(answer - challenge.burn2 * 1000) <= 0.02) {
        state.feedback = "That is one burn only. The transfer requires injection into the ellipse and circularization at the target.";
      } else if (Math.abs(answer - challenge.totalDeltaV) <= 0.00003) {
        state.feedback = "That numerical value is in km/s. Include km/s, or multiply by 1000 before entering m/s.";
      } else {
        state.feedback = "Use vis-viva at both ends of the transfer ellipse, take each circular-to-transfer speed difference, then add the magnitudes.";
      }
      renderAndFocus(rerender, "#p105-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
