(function registerProtonHelixPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "19.5";
  const FIELD_TESLA = 0.20;
  const PROTON_MASS_KILOGRAMS = 1.67262e-27;
  const ELEMENTARY_CHARGE_COULOMBS = 1.60218e-19;
  const CHALLENGE_PARALLEL_SPEED = 2.40e6;
  const CHALLENGE_PERPENDICULAR_SPEED = 1.80e6;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Split v", title: "Resolve velocity parallel and perpendicular to B", copy: "The parallel component is untouched by the magnetic force. The perpendicular component supplies the speed around a circle." }),
    Object.freeze({ short: "Circle", title: "Use the perpendicular component for radius and period", copy: "The magnetic force bends v⊥ into uniform circular motion: r=mv⊥/(|q|B), while T=2πm/(|q|B) is independent of speed." }),
    Object.freeze({ short: "Advance", title: "Advance along the field for one gyroperiod", copy: "During one complete turn the particle moves v∥T along B. That axial displacement is the helix pitch." }),
  ]);
  const hints = Object.freeze([
    "The pitch is the distance advanced parallel to B during one complete circular orbit.",
    "The gyroperiod is T=2πm/(|q|B); it does not depend on either velocity component.",
    "Use p=v∥T. The perpendicular speed determines the radius, not the pitch.",
    "T≈3.280×10⁻⁷ s, so p=(2.40×10⁶ m/s)T.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p195-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function superscriptInteger(value) { const map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }; return String(value).split("").map((character) => map[character]).join(""); }
  function scientific(value, decimals = 3) { if (!Number.isFinite(value) || value === 0) return value === 0 ? "0" : "—"; const exponent = Math.floor(Math.log10(Math.abs(value))), mantissa = value / 10 ** exponent; return `${mantissa.toFixed(decimals)}×10${superscriptInteger(exponent)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function helixData(parallelSpeed, perpendicularSpeed, chargeSign = 1) {
    const vParallel = clamp(parallelSpeed, 0, 10e6), vPerpendicular = clamp(perpendicularSpeed, 0, 10e6), sign = chargeSign < 0 ? -1 : 1;
    const angularFrequencyRadiansPerSecond = ELEMENTARY_CHARGE_COULOMBS * FIELD_TESLA / PROTON_MASS_KILOGRAMS;
    const radiusMetres = PROTON_MASS_KILOGRAMS * vPerpendicular / (ELEMENTARY_CHARGE_COULOMBS * FIELD_TESLA);
    const gyroperiodSeconds = 2 * Math.PI / angularFrequencyRadiansPerSecond;
    const pitchMetres = vParallel * gyroperiodSeconds;
    return { parallelSpeedMetresPerSecond: vParallel, perpendicularSpeedMetresPerSecond: vPerpendicular, chargeSign: sign, signedChargeCoulombs: sign * ELEMENTARY_CHARGE_COULOMBS, radiusMetres, angularFrequencyRadiansPerSecond, signedPhaseAngularVelocityRadiansPerSecond: -sign * angularFrequencyRadiansPerSecond, gyroperiodSeconds, pitchMetres, handedness: sign > 0 ? "positive charge: phase decreases along +B" : "negative comparison: phase increases along +B" };
  }

  function phaseSpacePoint(data, turns) {
    const phaseRadians = -data.chargeSign * 2 * Math.PI * turns, x = data.pitchMetres * turns, y = data.radiusMetres * Math.cos(phaseRadians), z = data.radiusMetres * Math.sin(phaseRadians);
    const velocity = { x: data.parallelSpeedMetresPerSecond, y: data.chargeSign * data.perpendicularSpeedMetresPerSecond * Math.sin(phaseRadians), z: -data.chargeSign * data.perpendicularSpeedMetresPerSecond * Math.cos(phaseRadians) };
    const magneticForce = { x: 0, y: -ELEMENTARY_CHARGE_COULOMBS * FIELD_TESLA * data.perpendicularSpeedMetresPerSecond * Math.cos(phaseRadians), z: -ELEMENTARY_CHARGE_COULOMBS * FIELD_TESLA * data.perpendicularSpeedMetresPerSecond * Math.sin(phaseRadians) };
    return { turns, phaseRadians, positionMetres: { x, y, z }, velocityMetresPerSecond: velocity, magneticForceNewtons: magneticForce };
  }

  const CHALLENGE_DATA = helixData(CHALLENGE_PARALLEL_SPEED, CHALLENGE_PERPENDICULAR_SPEED, 1);
  function parsePitch(raw) { const match = String(raw).trim().replaceAll(",", ".").match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i); return match ? Number(match[0]) : NaN; }
  function initialState() { return { parallelSpeed: CHALLENGE_PARALLEL_SPEED, perpendicularSpeed: CHALLENGE_PERPENDICULAR_SPEED, chargeSign: 1, travelPercent: 31, boardMessage: "A proton advances along +B while its perpendicular velocity curves around the field axis. Move the travel slider to follow two turns.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function currentData() { return helixData(state.parallelSpeed, state.perpendicularSpeed, state.chargeSign); }
  function setParallelSpeedMillions(value) { state.parallelSpeed = clamp(value, .8, 3.2) * 1e6; const data = currentData(); state.boardMessage = `v∥=${format(state.parallelSpeed / 1e6, 2)}×10⁶ m/s: one-turn axial advance is now ${format(data.pitchMetres, 3)} m.`; }
  function setPerpendicularSpeedMillions(value) { state.perpendicularSpeed = clamp(value, .6, 2.6) * 1e6; const data = currentData(); state.boardMessage = `v⊥=${format(state.perpendicularSpeed / 1e6, 2)}×10⁶ m/s: radius is now ${format(data.radiusMetres * 100, 2)} cm, while period is unchanged.`; }
  function setChargeSign(sign) { state.chargeSign = sign < 0 ? -1 : 1; const data = currentData(); state.boardMessage = state.chargeSign > 0 ? "Proton selected: phase decreases as it advances along +B." : "Negative same-mass comparison selected: handedness reverses, but radius, period and pitch magnitudes do not."; return data; }
  function setTravelPercent(value) { state.travelPercent = clamp(Math.round(value), 0, 100); const point = phaseSpacePoint(currentData(), 2 * state.travelPercent / 100); state.boardMessage = `Particle moved to ${format(point.turns, 2)} turns: axial position ${format(point.positionMetres.x, 3)} m along B.`; }
  function restoreChallenge() { state.parallelSpeed = CHALLENGE_PARALLEL_SPEED; state.perpendicularSpeed = CHALLENGE_PERPENDICULAR_SPEED; state.chargeSign = 1; state.travelPercent = 31; state.boardMessage = "Challenge restored: proton with v∥=2.40×10⁶ m/s and v⊥=1.80×10⁶ m/s in B=0.20 T."; }

  function stageControls() {
    return `<div class="p195-stage-controls" role="group" aria-label="Helical-motion reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p195-stage" data-p195-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p195-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p195-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Pitch exposed" : "Next stage"}</button></div>`;
  }

  function projectPoint(point) { return { x: 62 + 190 * point.x + .35 * 450 * point.z, y: 150 - 450 * point.y + .25 * 450 * point.z }; }
  function normalizedArrow(dx, dy, length) { const magnitude = Math.hypot(dx, dy) || 1; return { x: length * dx / magnitude, y: length * dy / magnitude }; }
  function helixSegments(data) {
    const back = [], front = [];
    for (let index = 0; index < 180; index += 1) { const first = phaseSpacePoint(data, 2 * index / 180), second = phaseSpacePoint(data, 2 * (index + 1) / 180), a = projectPoint(first.positionMetres), b = projectPoint(second.positionMetres), path = `<path d="M${format(a.x, 3)} ${format(a.y, 3)}L${format(b.x, 3)} ${format(b.y, 3)}"/>`; ((first.positionMetres.z + second.positionMetres.z) / 2 < 0 ? back : front).push(path); }
    return `<g class="p195-helix-back">${back.join("")}</g><g class="p195-helix-front">${front.join("")}</g>`;
  }

  function helixSvg() {
    const data = currentData(), point = phaseSpacePoint(data, 2 * state.travelPercent / 100), particle = projectPoint(point.positionMetres), axisAtParticle = projectPoint({ x: point.positionMetres.x, y: 0, z: 0 });
    const perpendicularProjection = normalizedArrow(.35 * point.velocityMetresPerSecond.z, -point.velocityMetresPerSecond.y + .25 * point.velocityMetresPerSecond.z, 57), inwardProjection = normalizedArrow(axisAtParticle.x - particle.x, axisAtParticle.y - particle.y, 42), pitchPixels = 190 * data.pitchMetres, radiusPixels = 450 * data.radiusMetres;
    return `<svg class="p195-helix p195-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p195-svg-title p195-svg-desc"><title id="p195-svg-title">Interactive charged-particle helix in a uniform magnetic field</title><desc id="p195-svg-desc">A ${state.chargeSign > 0 ? "positive proton" : "negative same-mass comparison particle"} moves in a 0.20 tesla field pointing right. Parallel speed is ${scientific(data.parallelSpeedMetresPerSecond, 2)} metres per second and perpendicular speed is ${scientific(data.perpendicularSpeedMetresPerSecond, 2)} metres per second. Radius is ${format(data.radiusMetres, 6)} metres, period ${scientific(data.gyroperiodSeconds, 5)} seconds and pitch ${format(data.pitchMetres, 6)} metres. ${data.handedness}. The particle is ${format(point.turns, 2)} turns along the displayed two-turn path.</desc><defs><marker id="p195-field-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><marker id="p195-parallel-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><marker id="p195-perp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><marker id="p195-force-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs><rect class="p195-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p195-board-kicker" x="23" y="28">UNIFORM BLUE FIELD · B=${FIELD_TESLA.toFixed(2)} T · TWO TURNS SHOWN</text><g class="p195-field">${[73, 150, 227].map((y) => `<line x1="42" y1="${y}" x2="500" y2="${y}"/>`).join("")}<text x="443" y="55">B → +x</text></g><line class="p195-axis" x1="40" y1="150" x2="505" y2="150"/>${helixSegments(data)}<g class="p195-radius-group"><line x1="62" y1="150" x2="62" y2="${format(150 - radiusPixels, 3)}"/><line x1="55" y1="150" x2="69" y2="150"/><line x1="55" y1="${format(150 - radiusPixels, 3)}" x2="69" y2="${format(150 - radiusPixels, 3)}"/><text x="74" y="${format(150 - radiusPixels / 2, 3)}">r=${format(data.radiusMetres * 100, 2)} cm</text></g><g class="p195-pitch-group"><line x1="62" y1="255" x2="${format(62 + pitchPixels, 3)}" y2="255"/><line x1="62" y1="247" x2="62" y2="263"/><line x1="${format(62 + pitchPixels, 3)}" y1="247" x2="${format(62 + pitchPixels, 3)}" y2="263"/><text x="${format(62 + pitchPixels / 2, 3)}" y="276" text-anchor="middle">one pitch p=${format(data.pitchMetres, 3)} m</text></g><g class="p195-particle"><circle cx="${format(particle.x, 3)}" cy="${format(particle.y, 3)}" r="10"/><text x="${format(particle.x, 3)}" y="${format(particle.y + 3, 3)}" text-anchor="middle">${state.chargeSign > 0 ? "+" : "−"}</text></g><g class="p195-velocity-vectors"><line class="p195-vparallel" x1="${format(particle.x, 3)}" y1="${format(particle.y, 3)}" x2="${format(particle.x + 67, 3)}" y2="${format(particle.y, 3)}" marker-end="url(#p195-parallel-arrow)"/><text class="p195-vparallel-label" x="${format(particle.x + 34, 3)}" y="${format(particle.y - 8, 3)}" text-anchor="middle">v∥</text><line class="p195-vperp" x1="${format(particle.x, 3)}" y1="${format(particle.y, 3)}" x2="${format(particle.x + perpendicularProjection.x, 3)}" y2="${format(particle.y + perpendicularProjection.y, 3)}" marker-end="url(#p195-perp-arrow)"/><text class="p195-vperp-label" x="${format(particle.x + perpendicularProjection.x, 3)}" y="${format(particle.y + perpendicularProjection.y - 8, 3)}" text-anchor="middle">v⊥</text><line class="p195-force" x1="${format(particle.x, 3)}" y1="${format(particle.y, 3)}" x2="${format(particle.x + inwardProjection.x, 3)}" y2="${format(particle.y + inwardProjection.y, 3)}" marker-end="url(#p195-force-arrow)"/><text class="p195-force-label" x="${format(particle.x + inwardProjection.x, 3)}" y="${format(particle.y + inwardProjection.y + 13, 3)}" text-anchor="middle">qv×B</text></g><g class="p195-ledger" transform="translate(523 46)"><rect class="p195-ledger-bg" width="213" height="219" rx="15"/><text class="p195-ledger-title" x="15" y="27">HELIX AUDIT</text><text class="p195-ledger-label" x="15" y="61">charge</text><text class="p195-ledger-value" x="198" y="61" text-anchor="end">${state.chargeSign > 0 ? "+e proton" : "−e comparison"}</text><text class="p195-ledger-label" x="15" y="87">radius mv⊥/(|q|B)</text><text class="p195-ledger-value" x="198" y="87" text-anchor="end">${state.stage >= 1 || state.revealed ? `${format(data.radiusMetres * 100, 2)} cm` : "stage 2"}</text><text class="p195-ledger-label" x="15" y="113">period 2πm/(|q|B)</text><text class="p195-ledger-value" x="198" y="113" text-anchor="end">${state.stage >= 1 || state.revealed ? `${scientific(data.gyroperiodSeconds, 3)} s` : "stage 2"}</text><text class="p195-ledger-label" x="15" y="139">phase law</text><text class="p195-ledger-value" x="198" y="139" text-anchor="end">φ̇=${state.chargeSign > 0 ? "−" : "+"}|q|B/m</text><rect class="p195-result-box" x="12" y="158" width="189" height="47" rx="9"/><text class="p195-result-label" x="24" y="177">PITCH v∥T</text><text class="p195-result-value" x="190" y="192" text-anchor="end">${state.stage >= 2 || state.revealed ? `${format(data.pitchMetres, 3)} m` : "stage 3"}</text></g><g class="p195-component-key"><circle class="parallel" cx="41" cy="303" r="5"/><text x="52" y="306">axial v∥ survives unchanged</text><circle class="perp" cx="220" cy="303" r="5"/><text x="231" y="306">v⊥ curves around B</text><circle class="force" cx="365" cy="303" r="5"/><text x="376" y="306">force stays inward and does no work</text></g><g class="p195-identity"><rect x="26" y="326" width="708" height="75" rx="13"/><text class="p195-identity-kicker" x="43" y="347">ONE COMPLETE TURN</text><text class="p195-identity-formula" x="43" y="376">p = v∥T = (${format(data.parallelSpeedMetresPerSecond / 1e6, 2)}×10⁶)(${scientific(data.gyroperiodSeconds, 3)})</text><text class="p195-identity-value" x="713" y="379" text-anchor="end">${format(data.pitchMetres, 3)} m</text><text class="p195-handedness" x="43" y="392">${data.handedness}; changing charge sign reverses winding only.</text></g></svg>`;
  }

  function helixControls() {
    const data = currentData();
    return `<section class="p195-controls" aria-label="Helix velocity, charge and travel controls"><div class="p195-slider-grid"><label for="p195-vparallel"><span>Axial speed v∥ <output data-p195-output="parallel">${format(state.parallelSpeed / 1e6, 2)}×10⁶ m/s</output></span><input id="p195-vparallel" type="range" min="0.8" max="3.2" step="0.1" value="${state.parallelSpeed / 1e6}" aria-valuetext="Parallel speed ${scientific(state.parallelSpeed, 2)} metres per second; pitch ${format(data.pitchMetres, 3)} metres"/></label><label for="p195-vperp"><span>Circular speed v⊥ <output data-p195-output="perpendicular">${format(state.perpendicularSpeed / 1e6, 2)}×10⁶ m/s</output></span><input id="p195-vperp" type="range" min="0.6" max="2.6" step="0.1" value="${state.perpendicularSpeed / 1e6}" aria-valuetext="Perpendicular speed ${scientific(state.perpendicularSpeed, 2)} metres per second; radius ${format(data.radiusMetres * 100, 2)} centimetres"/></label></div><label class="p195-travel" for="p195-travel"><span>Position along two turns <output data-p195-output="travel">${state.travelPercent}%</output></span><input id="p195-travel" type="range" min="0" max="100" step="1" value="${state.travelPercent}" aria-valuetext="${format(2 * state.travelPercent / 100, 2)} turns along the helix"/></label><div class="p195-charge-buttons" role="group" aria-label="Particle charge sign"><button class="secondary-button ${state.chargeSign > 0 ? "active" : ""}" type="button" data-p195-charge="1" aria-pressed="${state.chargeSign > 0}">+e · proton challenge</button><button class="secondary-button ${state.chargeSign < 0 ? "active" : ""}" type="button" data-p195-charge="-1" aria-pressed="${state.chargeSign < 0}">−e · same-mass comparison</button></div><p data-p195-control-message role="status">${state.boardMessage}</p></section>`;
  }

  function metricsMarkup() {
    const data = currentData();
    return `<section class="p195-metrics" aria-live="polite"><div><span>Orbit radius</span><strong>${format(data.radiusMetres * 100, 2)} cm</strong></div><div><span>Gyroperiod</span><strong>${scientific(data.gyroperiodSeconds, 3)} s</strong></div><div><span>Helix pitch</span><strong>${format(data.pitchMetres, 3)} m</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p195-dynamic"><div class="p195-helix-wrap">${helixSvg()}${helixControls()}</div>${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p195-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p195-solution" aria-labelledby="p195-solution-heading"><h3 id="p195-solution-heading" tabindex="-1">Advance at v∥ for one gyroperiod</h3><p>The perpendicular velocity sets the circular radius:</p><div class="p195-equation">r=mv⊥/(qB)<br>=(1.67262×10⁻²⁷)(1.80×10⁶)/[(1.60218×10⁻¹⁹)(0.20)]<br>=0.09396 m≈9.40 cm.</div><p>The gyroperiod depends only on m, |q| and B:</p><div class="p195-equation">T=2πm/(qB)<br>=2π(1.67262×10⁻²⁷)/[(1.60218×10⁻¹⁹)(0.20)]<br>=3.2797×10⁻⁷ s≈3.280×10⁻⁷ s.</div><p>During that time, the unaffected parallel component carries the proton along the field by one pitch:</p><div class="p195-equation is-answer">p=v∥T<br>=(2.40×10⁶)(3.2797×10⁻⁷)<br>=0.78713 m≈0.787 m.</div><p>The positive charge fixes the winding direction through qv×B. Replacing +e by −e reverses the helix handedness, but formulas using |q| show that radius, period and pitch magnitudes remain unchanged.</p></section>`;
  }

  function snapshot() {
    const data = currentData(), turns = 2 * state.travelPercent / 100, point = phaseSpacePoint(data, turns), oneTurn = phaseSpacePoint(data, 1), radial = { x: 0, y: point.positionMetres.y, z: point.positionMetres.z };
    const forceDotVelocity = point.magneticForceNewtons.x * point.velocityMetresPerSecond.x + point.magneticForceNewtons.y * point.velocityMetresPerSecond.y + point.magneticForceNewtons.z * point.velocityMetresPerSecond.z;
    const forceDotRadial = point.magneticForceNewtons.y * radial.y + point.magneticForceNewtons.z * radial.z;
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "non-relativistic particle in uniform B along +x; no electric field; negative-charge option keeps proton mass and |q| only for sign comparison", fieldTesla: FIELD_TESLA, massKilograms: PROTON_MASS_KILOGRAMS, chargeCoulombs: data.signedChargeCoulombs, chargeRole: state.chargeSign > 0 ? "proton challenge" : "hypothetical negative same-mass comparison", parallelSpeedMetresPerSecond: data.parallelSpeedMetresPerSecond, perpendicularSpeedMetresPerSecond: data.perpendicularSpeedMetresPerSecond, radiusMetres: Number(data.radiusMetres.toFixed(12)), gyroperiodSeconds: Number(data.gyroperiodSeconds.toPrecision(12)), pitchMetres: Number(data.pitchMetres.toFixed(12)), angularFrequencyMagnitudeRadiansPerSecond: Number(data.angularFrequencyRadiansPerSecond.toFixed(6)), signedPhaseAngularVelocityRadiansPerSecond: Number(data.signedPhaseAngularVelocityRadiansPerSecond.toFixed(6)), handedness: data.handedness, displayedTravelTurns: turns, particlePositionMetres: { x: Number(point.positionMetres.x.toFixed(12)), y: Number(point.positionMetres.y.toFixed(12)), z: Number(point.positionMetres.z.toFixed(12)) }, particleVelocityMetresPerSecond: { x: Number(point.velocityMetresPerSecond.x.toFixed(6)), y: Number(point.velocityMetresPerSecond.y.toFixed(6)), z: Number(point.velocityMetresPerSecond.z.toFixed(6)) }, magneticForceNewtons: { x: 0, y: Number(point.magneticForceNewtons.y.toExponential(8)), z: Number(point.magneticForceNewtons.z.toExponential(8)) }, signChecks: { forceDotVelocityWatts: Number(forceDotVelocity.toExponential(6)), forceDotRadialIsNegative: forceDotRadial < 0, oneTurnTransverseClosureMetres: Math.hypot(oneTurn.positionMetres.y - data.radiusMetres, oneTurn.positionMetres.z), oneTurnAxialDisplacementMetres: Number(oneTurn.positionMetres.x.toFixed(12)), pitchIdentityResidualMetres: Number((data.pitchMetres - data.parallelSpeedMetresPerSecond * data.gyroperiodSeconds).toExponential(6)), radiusIdentityResidualMetres: Number((data.radiusMetres - PROTON_MASS_KILOGRAMS * data.perpendicularSpeedMetresPerSecond / (ELEMENTARY_CHARGE_COULOMBS * FIELD_TESLA)).toExponential(6)), perpendicularVelocityMagnitudeResidual: Number((Math.hypot(point.velocityMetresPerSecond.y, point.velocityMetresPerSecond.z) - data.perpendicularSpeedMetresPerSecond).toExponential(6)) }, challenge: { parallelSpeedMetresPerSecond: CHALLENGE_PARALLEL_SPEED, perpendicularSpeedMetresPerSecond: CHALLENGE_PERPENDICULAR_SPEED, radiusMetres: Number(CHALLENGE_DATA.radiusMetres.toFixed(12)), gyroperiodSeconds: Number(CHALLENGE_DATA.gyroperiodSeconds.toPrecision(12)), exactPitchMetres: Number(CHALLENGE_DATA.pitchMetres.toFixed(12)), roundedPitchMetres: 0.787 }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p195-shell"><div class="p195-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Charged particles in magnetic fields</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p195-spread"><article class="book-page p195-problem-page"><div class="problem-number">Problem 19.5</div><h1 class="book-title p195-title">Corkscrew in a Blue Field</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="problem-copy">A proton enters a uniform 0.20 T magnetic field with velocity components v∥=2.40×10⁶ m/s and v⊥=1.80×10⁶ m/s. Use mp=1.67262×10⁻²⁷ kg and q=e=1.60218×10⁻¹⁹ C.</p><p class="problem-copy"><strong>What is the pitch of its helical path?</strong></p><section class="p195-observation-card"><strong>Two motions superpose</strong><p>Magnetic force bends the perpendicular motion without changing speed, while the parallel component carries the orbit’s centre steadily along B.</p></section><section class="p195-model-card"><div class="eyebrow">Ideal field model</div><p>The field is uniform and points right. The calculation is non-relativistic, with no electric field, radiation loss or collisions.</p></section></article><section class="book-page book-stage p195-stage">${stageControls()}<div class="p195-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p195-coach"><div class="coach-kicker">Find the axial advance</div><p class="coach-question">Enter the fixed proton challenge pitch in metres.</p><form class="p195-answer-form" data-p195-answer-form novalidate><label for="p195-answer">Helix pitch</label><div><input id="p195-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 0.787" autocomplete="off"/><span>m</span></div><button class="primary-button" type="submit">Check pitch</button></form>${feedbackMarkup()}<div class="button-row p195-help-row"><button class="secondary-button" type="button" data-problem-action="p195-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p195-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p195-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom(root) {
    const helix = root.querySelector(".p195-helix"); if (helix) helix.outerHTML = helixSvg();
    const metrics = root.querySelector(".p195-metrics"); if (metrics) metrics.outerHTML = metricsMarkup();
    const data = currentData(), parallel = root.querySelector('[data-p195-output="parallel"]'), perpendicular = root.querySelector('[data-p195-output="perpendicular"]'), travel = root.querySelector('[data-p195-output="travel"]'), message = root.querySelector("[data-p195-control-message]");
    if (parallel) parallel.textContent = `${format(state.parallelSpeed / 1e6, 2)}×10⁶ m/s`; if (perpendicular) perpendicular.textContent = `${format(state.perpendicularSpeed / 1e6, 2)}×10⁶ m/s`; if (travel) travel.textContent = `${state.travelPercent}%`; if (message) message.textContent = state.boardMessage;
    const parallelSlider = root.querySelector("#p195-vparallel"); if (parallelSlider) { parallelSlider.value = String(state.parallelSpeed / 1e6); parallelSlider.setAttribute("aria-valuetext", `Parallel speed ${scientific(state.parallelSpeed, 2)} metres per second; pitch ${format(data.pitchMetres, 3)} metres`); }
    const perpendicularSlider = root.querySelector("#p195-vperp"); if (perpendicularSlider) { perpendicularSlider.value = String(state.perpendicularSpeed / 1e6); perpendicularSlider.setAttribute("aria-valuetext", `Perpendicular speed ${scientific(state.perpendicularSpeed, 2)} metres per second; radius ${format(data.radiusMetres * 100, 2)} centimetres`); }
    const travelSlider = root.querySelector("#p195-travel"); if (travelSlider) { travelSlider.value = String(state.travelPercent); travelSlider.setAttribute("aria-valuetext", `${format(2 * state.travelPercent / 100, 2)} turns along the helix`); }
    root.querySelectorAll("[data-p195-charge]").forEach((button) => { const active = Number(button.dataset.p195Charge) === state.chargeSign; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p195-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p195-reset") { resetChallenge(); renderAndFocus(renderApp, "#p195-vparallel"); return; }
        if (action === "p195-stage") { state.stage = clamp(Number(actionControl.dataset.p195Stage), 0, 2); renderAndFocus(renderApp, `[data-p195-stage="${state.stage}"]`); return; }
        if (action === "p195-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p195-stage="${state.stage}"]`); return; }
        if (action === "p195-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p195-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
        renderApp(); if (action === "p195-reveal") window.requestAnimationFrame(() => document.querySelector("#p195-solution-heading")?.focus()); return;
      }
      const charge = event.target.closest("[data-p195-charge]"); if (charge) { setChargeSign(Number(charge.dataset.p195Charge)); updateDynamicDom(root); charge.focus(); }
    });
    root?.querySelector("#p195-vparallel")?.addEventListener("input", (event) => { setParallelSpeedMillions(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p195-vperp")?.addEventListener("input", (event) => { setPerpendicularSpeedMillions(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p195-travel")?.addEventListener("input", (event) => { setTravelPercent(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p195-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 22); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p195-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p195-answer")?.value || "", answer = parsePitch(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter the pitch in metres.";
      else if (Math.abs(answer - CHALLENGE_DATA.radiusMetres) <= .002) state.feedback = "That is the orbit radius. Pitch is the axial distance travelled during one full period.";
      else if (Math.abs(answer - CHALLENGE_DATA.gyroperiodSeconds) <= 5e-10) state.feedback = "That is the gyroperiod in seconds. Multiply it by v∥.";
      else if (Math.abs(answer - 78.7) <= .2) state.feedback = "78.7 is the pitch in centimetres. Enter the requested value in metres.";
      else if (Math.abs(answer - CHALLENGE_DATA.pitchMetres) > .002) state.feedback = "Use T=2πm/(qB), then p=v∥T.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: T≈3.280×10⁻⁷ s and p=v∥T≈0.787 m."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p195-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
