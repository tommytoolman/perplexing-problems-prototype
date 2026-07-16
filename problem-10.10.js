(function registerSolarEscapePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.10";
  const SOLAR_MU_KM3_S2 = 1.32712440018e11;
  const AU_KM = 149597870.7;
  const CENTRAL_CIRCULAR_SPEED = Math.sqrt(SOLAR_MU_KM3_S2 / AU_KM);
  const CENTRAL_ESCAPE_SPEED = Math.sqrt(2) * CENTRAL_CIRCULAR_SPEED;
  const CENTRAL_EXTRA_SPEED = CENTRAL_ESCAPE_SPEED - CENTRAL_CIRCULAR_SPEED;
  const CHALLENGE = Object.freeze({ distanceAU: 1, planetSpeedKmS: CENTRAL_CIRCULAR_SPEED, excessSpeedKmS: 10, departureAngleDegrees: 0 });
  const stages = Object.freeze([
    Object.freeze({ short: "Frames", title: "Add velocities in one frame", copy: "After leaving Earth’s gravity, add the Earth-relative excess vector u to the planet’s heliocentric orbital velocity vP." }),
    Object.freeze({ short: "Threshold", title: "Compare the resultant with solar escape", copy: "At solar distance r, zero heliocentric energy requires |vH|=√(2μ☉/r). The dashed circle is that speed boundary." }),
    Object.freeze({ short: "Direction", title: "Align the vectors to spend least", copy: "For a fixed excess magnitude, the heliocentric resultant is largest when u points prograde. Therefore prograde needs the smallest u." }),
  ]);
  const hints = Object.freeze([
    "For a circular orbit at radius r, Earth’s heliocentric speed satisfies vP²=μ☉/r.",
    "Solar escape at the same point requires zero specific energy: vesc²/2−μ☉/r=0.",
    "Thus vesc=√2 vP. A prograde excess vector adds directly, so vP+u=vesc.",
    "Therefore u=(√2−1)vP. At 1 AU, vP=29.784692 km/s.",
    `The required prograde excess is ${CENTRAL_EXTRA_SPEED.toFixed(6)} km/s. This is not the speed needed to escape from Earth’s surface.`,
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p1010-reset">Reset</button>';

  const initialState = () => ({ distanceAU: CHALLENGE.distanceAU, planetSpeedKmS: CHALLENGE.planetSpeedKmS, excessSpeedKmS: CHALLENGE.excessSpeedKmS, departureAngleDegrees: CHALLENGE.departureAngleDegrees, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function heliocentricData(distanceAU = state.distanceAU, planetSpeedKmS = state.planetSpeedKmS, excessSpeedKmS = state.excessSpeedKmS, departureAngleDegrees = state.departureAngleDegrees) {
    const radiusKm = distanceAU * AU_KM;
    const circularSpeed = Math.sqrt(SOLAR_MU_KM3_S2 / radiusKm);
    const escapeSpeed = Math.sqrt(2 * SOLAR_MU_KM3_S2 / radiusKm);
    const angle = departureAngleDegrees * Math.PI / 180;
    const excessRadial = excessSpeedKmS * Math.sin(angle);
    const excessPrograde = excessSpeedKmS * Math.cos(angle);
    const heliocentricRadial = excessRadial;
    const heliocentricPrograde = planetSpeedKmS + excessPrograde;
    const heliocentricSpeed = Math.hypot(heliocentricRadial, heliocentricPrograde);
    const specificEnergy = heliocentricSpeed ** 2 / 2 - SOLAR_MU_KM3_S2 / radiusKm;
    const speedTolerance = 1e-9 * Math.max(escapeSpeed, 1);
    const regime = heliocentricSpeed < escapeSpeed - speedTolerance ? "bound" : Math.abs(heliocentricSpeed - escapeSpeed) <= speedTolerance ? "marginal" : "escape";
    const solarInfinitySpeed = regime === "escape" ? Math.sqrt(2 * specificEnergy) : regime === "marginal" ? 0 : null;
    let requiredExcess;
    if (planetSpeedKmS >= escapeSpeed) requiredExcess = 0;
    else {
      const discriminant = Math.max(0, escapeSpeed ** 2 - planetSpeedKmS ** 2 * Math.sin(angle) ** 2);
      requiredExcess = -planetSpeedKmS * Math.cos(angle) + Math.sqrt(discriminant);
    }
    const progradeRequired = Math.max(0, escapeSpeed - planetSpeedKmS);
    const retrogradeRequired = planetSpeedKmS >= escapeSpeed ? 0 : escapeSpeed + planetSpeedKmS;
    return { radiusKm, circularSpeed, escapeSpeed, angle, excessRadial, excessPrograde, heliocentricRadial, heliocentricPrograde, heliocentricSpeed, specificEnergy, regime, solarInfinitySpeed, requiredExcess, progradeRequired, retrogradeRequired };
  }

  function regimeLabel(values = heliocentricData()) {
    if (values.regime === "bound") return "Solar-bound trajectory";
    if (values.regime === "marginal") return "Just reaches solar escape";
    return "Escapes the Solar System";
  }

  function reconstructionNote() {
    return `<p class="p1010-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and three-star difficulty. This heliocentric vector-and-energy problem is newly written and does not reproduce the book’s wording, numbers, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p1010-stage-controls" role="group" aria-label="Heliocentric escape stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p1010-stage" data-p1010-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p1010-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p1010-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Direction compared" : "Next stage"}</button></div>`;
  }

  function vectorGeometry(values) {
    const origin = { x: 540, y: 266 };
    const maximumMagnitude = Math.max(55, values.escapeSpeed, state.planetSpeedKmS + state.excessSpeedKmS, values.heliocentricSpeed);
    const scale = 137 / maximumMagnitude;
    const planetEnd = { x: origin.x, y: origin.y - state.planetSpeedKmS * scale };
    const endpoint = { x: origin.x + values.heliocentricRadial * scale, y: origin.y - values.heliocentricPrograde * scale };
    return { origin, scale, planetEnd, endpoint, escapeRadius: values.escapeSpeed * scale };
  }

  function escapeSvg() {
    const values = heliocentricData();
    const vector = vectorGeometry(values);
    const costScale = 278 / Math.max(values.retrogradeRequired, 1e-9);
    const currentCostWidth = Math.min(278, values.requiredExcess * costScale);
    const progradeCostWidth = Math.min(278, values.progradeRequired * costScale);
    const statusValue = state.stage === 0 ? `|vH|=${format(values.heliocentricSpeed, 4)} km/s` : state.stage === 1 ? `${format(values.heliocentricSpeed, 3)} ${values.regime === "bound" ? "<" : values.regime === "escape" ? ">" : "="} ${format(values.escapeSpeed, 3)} km/s` : `ureq(${format(state.departureAngleDegrees, 0)}°)=${format(values.requiredExcess, 3)} km/s`;
    return `<svg class="p1010-svg p1010-stage-${state.stage} is-${values.regime}" viewBox="0 0 720 445" role="img" aria-labelledby="p1010-svg-title p1010-svg-desc">
      <title id="p1010-svg-title">Heliocentric orbital velocity plus Earth-relative departure velocity</title>
      <desc id="p1010-svg-desc">At ${format(state.distanceAU, 3)} astronomical units, local solar escape speed is ${format(values.escapeSpeed, 5)} kilometres per second. The planet moves at ${format(state.planetSpeedKmS, 5)} kilometres per second. A spacecraft excess speed of ${format(state.excessSpeedKmS, 5)} kilometres per second is directed ${format(state.departureAngleDegrees, 1)} degrees from prograde toward the outward radial direction, producing heliocentric speed ${format(values.heliocentricSpeed, 5)} kilometres per second. ${regimeLabel(values)}. The required excess at this direction is ${format(values.requiredExcess, 5)} kilometres per second; the prograde minimum is ${format(values.progradeRequired, 5)} kilometres per second.</desc>
      <defs><radialGradient id="p1010-sun-gradient" cx="35%" cy="30%"><stop offset="0" stop-color="#fff1a8"/><stop offset=".58" stop-color="#e9a62f"/><stop offset="1" stop-color="#b85f20"/></radialGradient><marker id="p1010-arrow-planet" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p1010-arrow-excess" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p1010-arrow-result" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p1010-board" x="1" y="1" width="718" height="443" rx="20"/>
      <g class="p1010-status" transform="translate(20 20)"><rect width="321" height="68" rx="13"/><text class="p1010-status-kicker" x="15" y="21">${regimeLabel(values).toUpperCase()}</text><text class="p1010-status-value" x="15" y="45">${statusValue}</text><text class="p1010-status-note" x="15" y="60">ε☉=${format(values.specificEnergy, 4)} MJ/kg${values.solarInfinitySpeed === null ? "" : ` · v∞☉=${format(values.solarInfinitySpeed, 3)} km/s`}</text></g>
      <g class="p1010-orbit-panel"><circle class="p1010-orbit" cx="158" cy="246" r="91"/><circle class="p1010-sun" cx="158" cy="246" r="31"/><text class="p1010-sun-label" x="158" y="251" text-anchor="middle">Sun</text><line class="p1010-radius-line" x1="158" y1="246" x2="249" y2="246"/><circle class="p1010-planet" cx="249" cy="246" r="9"/><line class="p1010-orbit-arrow" x1="249" y1="236" x2="249" y2="185" marker-end="url(#p1010-arrow-planet)"/><text class="p1010-orbit-label" x="260" y="205">vP=${format(state.planetSpeedKmS, 3)} km/s</text><text class="p1010-radius-label" x="199" y="264" text-anchor="middle">r=${format(state.distanceAU, 3)} AU</text><text class="p1010-frame-note" x="29" y="330">Vectors at departure are translated to the velocity plane →</text></g>
      <g class="p1010-vector-panel"><text class="p1010-panel-title" x="398" y="73">HELIOCENTRIC VELOCITY PLANE</text><line class="p1010-axis" x1="383" y1="${vector.origin.y}" x2="697" y2="${vector.origin.y}"/><line class="p1010-axis" x1="${vector.origin.x}" y1="93" x2="${vector.origin.x}" y2="414"/><text class="p1010-axis-label" x="693" y="${vector.origin.y - 8}" text-anchor="end">radially outward</text><text class="p1010-axis-label" x="${vector.origin.x + 8}" y="101">prograde</text><g class="p1010-threshold-layer"><circle class="p1010-escape-circle" cx="${vector.origin.x}" cy="${vector.origin.y}" r="${format(vector.escapeRadius, 2)}"/><text class="p1010-escape-label" x="${vector.origin.x + vector.escapeRadius * .7}" y="${vector.origin.y + vector.escapeRadius * .7}">|v|=vesc ${format(values.escapeSpeed, 2)}</text></g><line class="p1010-planet-vector" x1="${vector.origin.x}" y1="${vector.origin.y}" x2="${format(vector.planetEnd.x, 2)}" y2="${format(vector.planetEnd.y, 2)}" marker-end="url(#p1010-arrow-planet)"/><line class="p1010-excess-vector" x1="${format(vector.planetEnd.x, 2)}" y1="${format(vector.planetEnd.y, 2)}" x2="${format(vector.endpoint.x, 2)}" y2="${format(vector.endpoint.y, 2)}" marker-end="url(#p1010-arrow-excess)"/><line class="p1010-result-vector" x1="${vector.origin.x}" y1="${vector.origin.y}" x2="${format(vector.endpoint.x, 2)}" y2="${format(vector.endpoint.y, 2)}" marker-end="url(#p1010-arrow-result)"/><circle class="p1010-endpoint" cx="${format(vector.endpoint.x, 2)}" cy="${format(vector.endpoint.y, 2)}" r="6"/><text class="p1010-vector-label is-planet" x="${vector.origin.x - 12}" y="${format((vector.origin.y + vector.planetEnd.y) / 2, 2)}" text-anchor="end">vP</text><text class="p1010-vector-label is-excess" x="${format((vector.planetEnd.x + vector.endpoint.x) / 2 + 9, 2)}" y="${format((vector.planetEnd.y + vector.endpoint.y) / 2 - 7, 2)}">u · θ=${format(state.departureAngleDegrees, 0)}°</text><text class="p1010-vector-label is-result" x="${format((vector.origin.x + vector.endpoint.x) / 2 + 8, 2)}" y="${format((vector.origin.y + vector.endpoint.y) / 2 + 13, 2)}">vH</text></g>
      <g class="p1010-cost-layer" transform="translate(28 354)"><text class="p1010-cost-title" x="0" y="0">EXCESS SPEED REQUIRED FOR SOLAR ESCAPE</text><text class="p1010-cost-label" x="0" y="22">prograde 0°</text><rect class="p1010-cost-track" x="78" y="12" width="278" height="11" rx="5"/><rect class="p1010-cost-bar is-prograde" x="78" y="12" width="${format(progradeCostWidth, 2)}" height="11" rx="5"/><text class="p1010-cost-value" x="365" y="22">${format(values.progradeRequired, 3)}</text><text class="p1010-cost-label" x="0" y="47">current ${format(state.departureAngleDegrees, 0)}°</text><rect class="p1010-cost-track" x="78" y="37" width="278" height="11" rx="5"/><rect class="p1010-cost-bar is-current" x="78" y="37" width="${format(currentCostWidth, 2)}" height="11" rx="5"/><text class="p1010-cost-value" x="365" y="47">${format(values.requiredExcess, 3)} km/s</text></g>
      <text class="p1010-model-note" x="692" y="427" text-anchor="end">u is Earth-relative excess after Earth escape · not surface Δv</text>
    </svg>`;
  }

  function metricsMarkup() {
    const values = heliocentricData();
    return `<section class="p1010-metrics" aria-live="polite"><div><span>Heliocentric resultant</span><strong>${format(values.heliocentricSpeed, 4)} km/s</strong></div><div><span>Local solar escape</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.escapeSpeed, 4)} km/s` : "stage 2"}</strong></div><div><span>Required excess at θ</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.requiredExcess, 4)} km/s` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p1010-dynamic">${escapeSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = heliocentricData();
    return `<section class="p1010-controls" aria-label="Heliocentric departure controls"><div class="p1010-control-grid"><label for="p1010-distance"><span>Solar distance r<output data-p1010-output="distance">${format(state.distanceAU, 3)} AU</output></span><input id="p1010-distance" type="range" min="0.3" max="5" step="0.01" value="${state.distanceAU}"/></label><label for="p1010-planet-speed"><span>Planet heliocentric speed vP<output data-p1010-output="planet-speed">${format(state.planetSpeedKmS, 3)} km/s</output></span><input id="p1010-planet-speed" type="range" min="5" max="60" step="0.01" value="${state.planetSpeedKmS}"/></label><label for="p1010-excess"><span>Earth-relative excess speed u<output data-p1010-output="excess">${format(state.excessSpeedKmS, 3)} km/s</output></span><input id="p1010-excess" type="range" min="0" max="150" step="0.1" value="${state.excessSpeedKmS}"/></label><label for="p1010-angle"><span>Departure angle θ from prograde<output data-p1010-output="angle">${format(state.departureAngleDegrees, 0)}°</output></span><input id="p1010-angle" type="range" min="0" max="180" step="1" value="${state.departureAngleDegrees}"/></label></div><div class="p1010-actions"><button class="chip-button" type="button" data-problem-action="p1010-circular">Use local circular vP (${format(values.circularSpeed, 3)} km/s)</button><button class="chip-button" type="button" data-problem-action="p1010-threshold">Set u to escape threshold (${format(values.requiredExcess, 3)} km/s)</button><span>θ=0° prograde; θ=90° radially outward; θ=180° retrograde.</span></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p1010-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p1010-solution" aria-labelledby="p1010-solution-heading"><h3 id="p1010-solution-heading" tabindex="-1">Add prograde after changing frames</h3><p>At 1 AU, a circular orbit satisfies</p><div class="p1010-equation">vP=√(μ☉/r)=${CENTRAL_CIRCULAR_SPEED.toFixed(9)} km/s</div><p>Just escaping the Sun requires zero heliocentric specific energy:</p><div class="p1010-equation">0=vesc²/2−μ☉/r<br>vesc=√(2μ☉/r)=√2 vP=${CENTRAL_ESCAPE_SPEED.toFixed(9)} km/s</div><p>A prograde excess vector adds directly to Earth’s orbital velocity, so</p><div class="p1010-equation p1010-answer-equation">u=vesc−vP=(√2−1)vP<br>u=${CENTRAL_EXTRA_SPEED.toFixed(9)} km/s ≈ ${CENTRAL_EXTRA_SPEED.toFixed(2)} km/s</div><p>For a general departure angle θ, |vH|²=vP²+u²+2vPu cosθ. Prograde maximises the cross term and therefore reaches the escape circle with the least u.</p><p class="p1010-checks"><strong>Checks and boundary.</strong> With u=0 on a circular orbit, ε=−μ☉/(2r), so the craft remains bound. At the threshold ε=0; above it the remaining solar-infinity speed is √(2ε). Circular and escape speeds both scale as r<sup>−1/2</sup>. Speeds are in km/s and μ☉/r is km²/s²=MJ/kg. The computed u is an ideal Earth-relative hyperbolic-excess speed after escaping Earth; it excludes Earth’s gravity well, launch-site rotation, atmosphere, other planets and manoeuvre losses.</p></section>`;
  }

  function snapshot() {
    const values = heliocentricData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", solarGravitationalParameterKm3PerS2: SOLAR_MU_KM3_S2, astronomicalUnitKilometres: AU_KM, solarDistanceAU: state.distanceAU, planetHeliocentricSpeedKmS: state.planetSpeedKmS, localCircularSpeedKmS: Number(values.circularSpeed.toFixed(9)), earthRelativeExcessSpeedKmS: state.excessSpeedKmS, departureAngleDegreesFromPrograde: state.departureAngleDegrees, excessComponentsKmS: { radialOutward: Number(values.excessRadial.toFixed(9)), prograde: Number(values.excessPrograde.toFixed(9)) }, heliocentricComponentsKmS: { radialOutward: Number(values.heliocentricRadial.toFixed(9)), prograde: Number(values.heliocentricPrograde.toFixed(9)) }, heliocentricSpeedKmS: Number(values.heliocentricSpeed.toFixed(9)), localSolarEscapeSpeedKmS: Number(values.escapeSpeed.toFixed(9)), specificSolarEnergyMJPerKg: Number(values.specificEnergy.toFixed(9)), solarInfinitySpeedKmS: values.solarInfinitySpeed === null ? null : Number(values.solarInfinitySpeed.toFixed(9)), requiredExcessAtAngleKmS: Number(values.requiredExcess.toFixed(9)), minimumProgradeExcessKmS: Number(values.progradeRequired.toFixed(9)), regime: values.regime, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge(excessSpeed = CHALLENGE.excessSpeedKmS) { state.distanceAU = CHALLENGE.distanceAU; state.planetSpeedKmS = CHALLENGE.planetSpeedKmS; state.excessSpeedKmS = excessSpeed; state.departureAngleDegrees = CHALLENGE.departureAngleDegrees; }
  function render() {
    return `<main class="book-shell p1010-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive gravitation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p1010-spread"><article class="book-page p1010-problem-page"><div class="problem-number">Problem 10.10</div><h1 class="book-title p1010-title">Escape velocity from the Solar System</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${reconstructionNote()}<p class="problem-copy">Model Earth on a circular heliocentric orbit at 1 AU. Far enough from Earth that its gravity can now be ignored, a spacecraft has an Earth-relative excess velocity directed exactly prograde.</p><p class="problem-copy"><strong>What minimum excess speed makes the spacecraft’s heliocentric specific energy zero?</strong></p><section class="p1010-observation-card"><strong>Two different escapes</strong><p>This asks for the additional heliocentric velocity after Earth escape. It is not Earth’s 11.2 km/s surface escape speed and not a complete launch delta-v.</p></section><section class="p1010-model-card"><div class="eyebrow">Patched-conic boundary</div><p>Sun-only energy after leaving Earth, instantaneous vector addition, circular Earth orbit, no atmosphere, other planets, rotation or manoeuvre losses.</p></section></article><section class="book-page book-stage p1010-stage">${stageControls()}<div class="p1010-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p1010-coach"><div class="coach-kicker">Leave prograde</div><p class="coach-question">At 1 AU from a circular Earth orbit, enter the minimum ideal Earth-relative excess speed.</p><form class="p1010-answer-form" data-p1010-answer-form novalidate><label for="p1010-answer">Prograde excess speed</label><div><input id="p1010-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="speed" autocomplete="off"/><span>km/s</span></div><button class="primary-button" type="submit">Check speed</button></form>${feedbackMarkup()}<div class="button-row p1010-help-row"><button class="secondary-button" type="button" data-problem-action="p1010-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p1010-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p1010-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p1010-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p1010-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = heliocentricData();
    const outputs = { distance: `${format(state.distanceAU, 3)} AU`, "planet-speed": `${format(state.planetSpeedKmS, 3)} km/s`, excess: `${format(state.excessSpeedKmS, 3)} km/s`, angle: `${format(state.departureAngleDegrees, 0)}°` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p1010-output="${key}"]`); if (output) output.textContent = value; });
    const circularButton = root.querySelector('[data-problem-action="p1010-circular"]');
    if (circularButton) circularButton.textContent = `Use local circular vP (${format(values.circularSpeed, 3)} km/s)`;
    const thresholdButton = root.querySelector('[data-problem-action="p1010-threshold"]');
    if (thresholdButton) thresholdButton.textContent = `Set u to escape threshold (${format(values.requiredExcess, 3)} km/s)`;
    root.querySelector("#p1010-distance")?.setAttribute("aria-valuetext", `Solar distance ${format(state.distanceAU, 3)} astronomical units; local escape speed ${format(values.escapeSpeed, 4)} kilometres per second`);
    root.querySelector("#p1010-planet-speed")?.setAttribute("aria-valuetext", `Planet heliocentric speed ${format(state.planetSpeedKmS, 3)} kilometres per second; local circular speed ${format(values.circularSpeed, 3)}`);
    root.querySelector("#p1010-excess")?.setAttribute("aria-valuetext", `Earth-relative excess speed ${format(state.excessSpeedKmS, 3)} kilometres per second; ${regimeLabel(values)}`);
    root.querySelector("#p1010-angle")?.setAttribute("aria-valuetext", `${format(state.departureAngleDegrees, 0)} degrees from prograde toward outward radial; required excess ${format(values.requiredExcess, 3)} kilometres per second`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p1010-reset") { state = initialState(); renderAndFocus(renderApp, "#p1010-excess"); return; }
      if (action === "p1010-stage") { state.stage = clamp(Number(control.dataset.p1010Stage), 0, 2); renderAndFocus(renderApp, `[data-p1010-stage="${state.stage}"]`); return; }
      if (action === "p1010-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p1010-stage="${state.stage}"]`); return; }
      if (action === "p1010-circular") { state.planetSpeedKmS = heliocentricData().circularSpeed; renderAndFocus(renderApp, "#p1010-planet-speed"); return; }
      if (action === "p1010-threshold") { state.excessSpeedKmS = heliocentricData().requiredExcess; state.stage = Math.max(state.stage, 1); renderAndFocus(renderApp, "#p1010-excess"); return; }
      if (action === "p1010-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p1010-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(CENTRAL_EXTRA_SPEED); }
      renderApp();
      if (action === "p1010-reveal") window.requestAnimationFrame(() => document.querySelector("#p1010-solution-heading")?.focus());
    }));
    [["#p1010-distance", "distanceAU", 0.3, 5], ["#p1010-planet-speed", "planetSpeedKmS", 5, 60], ["#p1010-excess", "excessSpeedKmS", 0, 150], ["#p1010-angle", "departureAngleDegrees", 0, 180]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p1010-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p1010-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one ideal excess speed in kilometres per second.";
      else if (Math.abs(answer - CENTRAL_ESCAPE_SPEED) <= 0.02) state.feedback = "That is the total heliocentric escape speed at 1 AU. Subtract Earth’s existing circular heliocentric speed.";
      else if (Math.abs(answer - 11.2) <= 0.1) state.feedback = "That is approximately Earth’s surface escape speed, which belongs to a different gravity well and frame. This question starts after Earth escape.";
      else if (Math.abs(answer - CENTRAL_EXTRA_SPEED) > 0.02) state.feedback = "Use vesc=√2 vP for a circular orbit, then align the Earth-relative excess vector prograde so the speeds add directly.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(CENTRAL_EXTRA_SPEED); state.feedback = `Correct: the ideal prograde Earth-relative excess is ${CENTRAL_EXTRA_SPEED.toFixed(6)} km/s. Added to Earth’s circular speed, it reaches the ${CENTRAL_ESCAPE_SPEED.toFixed(6)} km/s solar-escape threshold.`; }
      renderAndFocus(renderApp, "#p1010-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
