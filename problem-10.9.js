(function registerJetAircraftDietPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.9";
  const EARTH_RADIUS = 6.371e6;
  const EARTH_MU = 3.986004418e14;
  const EARTH_OMEGA = 7.292115e-5;
  const STANDARD_GRAVITY = 9.80665;
  const CHALLENGE = Object.freeze({ altitudeKm: 10, latitudeDeg: 0, speedMS: 250, massKg: 75, direction: "east" });
  const stages = Object.freeze([
    Object.freeze({ short: "Gravity", title: "Start with gravity at altitude", copy: "The spherical model gives g=μ/r² with r=R+h. The passenger’s gravitational force is mg, but that is not yet the scale reading. The diagram’s tiny altitude gap is exaggerated." }),
    Object.freeze({ short: "Motion", title: "Find the required inward acceleration", copy: "The inertial angular rate combines Earth’s rotation with east- or westbound ground speed. Its radial acceleration changes sign-sensitive cross terms." }),
    Object.freeze({ short: "Scale", title: "Balance gravity against the floor", copy: "With inward positive, mg−N=mar. The floor-normal force N is apparent weight; the passenger’s mass remains unchanged." }),
  ]);
  const hints = Object.freeze([
    "At 10 km, r=6.381×10⁶ m and g=μ/r².",
    "At the equator, an eastbound ground speed u gives inertial angular rate ω=Ω+u/r.",
    "The required inward acceleration is ar=ω²r=Ω²r+2Ωu+u²/r.",
    "Use mg−N=mar, so the scale reads N=m(g−ar). Keep acceleration in m/s² and mass in kg.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p109-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 3) { if (Math.abs(value) < .5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function flightData(
    altitudeKm = state.altitudeKm,
    latitudeDeg = state.latitudeDeg,
    speedMS = state.speedMS,
    massKg = state.massKg,
    direction = state.direction,
  ) {
    const latitude = latitudeDeg * Math.PI / 180;
    const cosLatitude = Math.cos(latitude);
    const sinLatitude = Math.sin(latitude);
    const directionSign = direction === "east" ? 1 : -1;
    const radius = EARTH_RADIUS + altitudeKm * 1000;
    const parallelRadius = radius * cosLatitude;
    const gravity = EARTH_MU / radius ** 2;
    const relativeAngularRate = directionSign * speedMS / parallelRadius;
    const inertialAngularRate = EARTH_OMEGA + relativeAngularRate;
    const rotationTerm = EARTH_OMEGA ** 2 * radius * cosLatitude ** 2;
    const crossTerm = 2 * directionSign * EARTH_OMEGA * speedMS * cosLatitude;
    const aircraftCurvatureTerm = speedMS ** 2 / radius;
    const radialInwardAcceleration = rotationTerm + crossTerm + aircraftCurvatureTerm;
    const directRadialAcceleration = inertialAngularRate ** 2 * radius * cosLatitude ** 2;
    const accelerationTowardAxis = inertialAngularRate ** 2 * parallelRadius;
    const polewardAcceleration = inertialAngularRate ** 2 * radius * sinLatitude * cosLatitude;
    const gravitationalForce = massKg * gravity;
    const normalForce = massKg * (gravity - radialInwardAcceleration);
    const apparentMass = normalForce / STANDARD_GRAVITY;
    const stationaryRadialAcceleration = rotationTerm;
    const stationaryNormalForce = massKg * (gravity - stationaryRadialAcceleration);
    const aircraftChangeFromStationary = normalForce - stationaryNormalForce;
    const oppositeCrossTerm = -crossTerm;
    const oppositeRadialAcceleration = rotationTerm + oppositeCrossTerm + aircraftCurvatureTerm;
    const oppositeNormalForce = massKg * (gravity - oppositeRadialAcceleration);
    const westMinusEast = 4 * massKg * EARTH_OMEGA * speedMS * cosLatitude;
    return {
      latitude,
      cosLatitude,
      sinLatitude,
      directionSign,
      radius,
      parallelRadius,
      gravity,
      relativeAngularRate,
      inertialAngularRate,
      rotationTerm,
      crossTerm,
      aircraftCurvatureTerm,
      radialInwardAcceleration,
      directRadialAcceleration,
      accelerationTowardAxis,
      polewardAcceleration,
      gravitationalForce,
      normalForce,
      apparentMass,
      stationaryRadialAcceleration,
      stationaryNormalForce,
      aircraftChangeFromStationary,
      oppositeNormalForce,
      westMinusEast,
      expansionResidual: radialInwardAcceleration - directRadialAcceleration,
      forceResidual: gravitationalForce - normalForce - massKg * radialInwardAcceleration,
    };
  }

  const challengeValues = flightData(CHALLENGE.altitudeKm, CHALLENGE.latitudeDeg, CHALLENGE.speedMS, CHALLENGE.massKg, CHALLENGE.direction);

  function directionLabel(direction = state.direction) { return direction === "east" ? "Eastbound" : "Westbound"; }

  function resultNote(values) {
    const comparison = values.aircraftChangeFromStationary;
    if (Math.abs(comparison) < 1e-10) return `With zero ground-relative speed, this is the stationary rotating-Earth reading. True mass remains ${format(state.massKg, 0)} kg.`;
    const changeWords = comparison < 0 ? `${format(Math.abs(comparison), 3)} N lighter` : `${format(comparison, 3)} N heavier`;
    return `${directionLabel()} flight makes this floor scale ${changeWords} than a stationary scale at the same altitude and latitude. True mass remains ${format(state.massKg, 0)} kg.`;
  }

  function reconstructionNote() {
    return `<p class="p109-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This rotating-Earth scale investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p109-stage-controls" role="group" aria-label="Aircraft apparent-weight stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p109-stage" data-p109-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p109-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p109-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Scale balanced" : "Next stage"}</button></div>`;
  }

  function aircraftSvg() {
    const values = flightData();
    const motionVisible = state.stage >= 1 || state.revealed;
    const scaleVisible = state.stage >= 2 || state.revealed;
    const centreX = 174, centreY = 251, earthPixels = 101;
    const displayAltitude = 10 + 20 * state.altitudeKm / 20;
    const aircraftRadius = earthPixels + displayAltitude;
    const aircraftX = centreX + aircraftRadius * values.cosLatitude;
    const aircraftY = centreY - aircraftRadius * values.sinLatitude;
    const surfaceX = centreX + earthPixels * values.cosLatitude;
    const surfaceY = centreY - earthPixels * values.sinLatitude;
    const gravityLength = 53;
    const normalLength = 50 * Math.min(1.06, values.normalForce / values.gravitationalForce);
    const gravityX = aircraftX - gravityLength * values.cosLatitude;
    const gravityY = aircraftY + gravityLength * values.sinLatitude;
    const normalX = aircraftX + normalLength * values.cosLatitude;
    const normalY = aircraftY - normalLength * values.sinLatitude;
    const axisLength = Math.max(15, 58 * values.cosLatitude);
    const statusValue = state.stage === 0 ? `g = ${format(values.gravity, 5)} m/s²` : state.stage === 1 ? `ar = ${format(values.radialInwardAcceleration, 6)} m/s²` : `N = ${format(values.normalForce, 3)} N`;
    const descriptionDetail = `${motionVisible ? ` Required radial inward acceleration is ${format(values.radialInwardAcceleration, 6)} metres per second squared.` : ""}${scaleVisible ? ` The floor-normal scale force is ${format(values.normalForce, 3)} newtons and true passenger mass remains ${format(state.massKg, 0)} kilograms.` : ""}`;
    return `<svg class="p109-svg p109-stage-${state.stage} is-${state.direction}" viewBox="0 0 720 445" role="img" aria-labelledby="p109-svg-title p109-svg-desc"><title id="p109-svg-title">Aircraft apparent weight over a rotating spherical Earth</title><desc id="p109-svg-desc">A ${format(state.massKg, 0)} kilogram passenger flies ${state.direction} at ${format(state.speedMS, 0)} metres per second, altitude ${format(state.altitudeKm, 1)} kilometres and latitude ${format(state.latitudeDeg, 0)} degrees. Gravity is ${format(values.gravity, 5)} metres per second squared.${descriptionDetail}</desc><defs><radialGradient id="p109-earth" cx="37%" cy="32%"><stop offset="0" stop-color="#82cbd5"/><stop offset="1" stop-color="#27667f"/></radialGradient><marker id="p109-gravity-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p109-motion-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p109-normal-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs><rect class="p109-board" x="1" y="1" width="718" height="443" rx="20"/><g class="p109-world-diagram" aria-hidden="true"><line class="p109-axis" x1="${centreX}" y1="92" x2="${centreX}" y2="410"/><text class="p109-axis-label" x="${centreX + 8}" y="105">rotation axis</text><circle class="p109-earth" cx="${centreX}" cy="${centreY}" r="${earthPixels}"/><path class="p109-land" d="M103 224q34-43 73-22t61-8q34 29 34 66-28 9-50-3t-38 5q-31 19-81-4Z"/><line class="p109-equator" x1="59" y1="${centreY}" x2="289" y2="${centreY}"/><line class="p109-radius" x1="${centreX}" y1="${centreY}" x2="${format(aircraftX, 2)}" y2="${format(aircraftY, 2)}"/><line class="p109-altitude" x1="${format(surfaceX, 2)}" y1="${format(surfaceY, 2)}" x2="${format(aircraftX, 2)}" y2="${format(aircraftY, 2)}"/><text class="p109-latitude-label" x="${format(centreX + 38 * values.cosLatitude, 2)}" y="${format(centreY - 38 * values.sinLatitude - 8, 2)}">λ=${format(state.latitudeDeg, 0)}°</text><g class="p109-aircraft" transform="translate(${format(aircraftX, 2)} ${format(aircraftY, 2)})"><circle r="14"/><path d="M-8 0H8M0-8V8" class="${state.direction === "east" ? "is-dot" : "is-cross"}"/><text x="0" y="31" text-anchor="middle">${directionLabel()} ${format(state.speedMS, 0)} m/s</text><text x="0" y="44" text-anchor="middle">${format(state.altitudeKm, 1)} km</text></g><g class="p109-gravity-vector"><line x1="${format(aircraftX, 2)}" y1="${format(aircraftY, 2)}" x2="${format(gravityX, 2)}" y2="${format(gravityY, 2)}" marker-end="url(#p109-gravity-arrow)"/><text x="${format((aircraftX + gravityX) / 2 - 8, 2)}" y="${format((aircraftY + gravityY) / 2 - 7, 2)}">gravity mg</text></g><g class="p109-axis-vector"><line x1="${format(aircraftX, 2)}" y1="${format(aircraftY + 20, 2)}" x2="${format(aircraftX - axisLength, 2)}" y2="${format(aircraftY + 20, 2)}" marker-end="url(#p109-motion-arrow)"/><text x="${format(aircraftX - axisLength / 2, 2)}" y="${format(aircraftY + 36, 2)}" text-anchor="middle">toward axis</text></g><g class="p109-normal-vector"><line x1="${format(aircraftX, 2)}" y1="${format(aircraftY, 2)}" x2="${format(normalX, 2)}" y2="${format(normalY, 2)}" marker-end="url(#p109-normal-arrow)"/><text x="${format((aircraftX + normalX) / 2 + 8, 2)}" y="${format((aircraftY + normalY) / 2 - 7, 2)}">floor N</text></g></g><g class="p109-status" aria-hidden="true" transform="translate(414 24)"><rect width="286" height="79" rx="14"/><text class="p109-status-kicker" x="17" y="22">${directionLabel().toUpperCase()} · ${format(state.latitudeDeg, 0)}° LATITUDE</text><text class="p109-status-value" x="17" y="49">${statusValue}</text><text class="p109-status-note" x="17" y="67">true mass = ${format(state.massKg, 0)} kg throughout</text></g><g class="p109-motion-panel" aria-hidden="true" transform="translate(414 124)"><rect width="286" height="151" rx="14"/><text class="p109-panel-kicker" x="17" y="24">RADIAL INWARD ACCELERATION</text><text class="p109-panel-label" x="17" y="52">Earth rotation Ω²r cos²λ</text><text class="p109-panel-number" x="269" y="52" text-anchor="end">${format(values.rotationTerm, 6)}</text><text class="p109-panel-label" x="17" y="77">east/west cross term</text><text class="p109-panel-number" x="269" y="77" text-anchor="end">${signed(values.crossTerm, 6)}</text><text class="p109-panel-label" x="17" y="102">aircraft curvature u²/r</text><text class="p109-panel-number" x="269" y="102" text-anchor="end">${format(values.aircraftCurvatureTerm, 6)}</text><line class="p109-panel-line" x1="17" y1="116" x2="269" y2="116"/><text class="p109-panel-total" x="17" y="138">ar</text><text class="p109-panel-total" x="269" y="138" text-anchor="end">${motionVisible ? `${format(values.radialInwardAcceleration, 6)} m/s²` : "stage 2"}</text></g><g class="p109-scale-panel" aria-hidden="true" transform="translate(414 296)"><rect width="286" height="120" rx="14"/><text class="p109-panel-kicker" x="17" y="24">FLOOR-NORMAL SCALE</text><text class="p109-scale-value" x="143" y="65" text-anchor="middle">${scaleVisible ? `${format(values.normalForce, 3)} N` : "stage 3"}</text><text class="p109-scale-note" x="143" y="88" text-anchor="middle">${scaleVisible ? `${format(values.apparentMass, 3)} kg on a standard-g scale` : "N=m(g−ar)"}</text><text class="p109-mass-note" x="143" y="106" text-anchor="middle">mass itself: ${format(state.massKg, 0)} kg · unchanged</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = flightData();
    const motionVisible = state.stage >= 1 || state.revealed;
    const scaleVisible = state.stage >= 2 || state.revealed;
    return `<section class="p109-metrics" aria-live="polite"><div><span>Gravity at altitude</span><strong>${format(values.gravity, 5)} m/s²</strong></div><div><span>Radial motion acceleration</span><strong>${motionVisible ? `${format(values.radialInwardAcceleration, 6)} m/s²` : "stage 2"}</strong></div><div><span>Floor normal / apparent weight</span><strong>${scaleVisible ? `${format(values.normalForce, 3)} N` : "stage 3"}</strong></div><div><span>True mass</span><strong>${format(state.massKg, 0)} kg · unchanged</strong></div>${scaleVisible ? `<p><strong>${directionLabel()}.</strong> ${resultNote(values)} The opposite direction reads ${format(values.oppositeNormalForce, 3)} N; west minus east is ${format(values.westMinusEast, 3)} N. Force residual ${values.forceResidual.toExponential(1)} N; acceleration-expansion residual ${values.expansionResidual.toExponential(1)} m/s².</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p109-dynamic">${aircraftSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = flightData();
    return `<section class="p109-controls" aria-label="Aircraft and passenger controls"><div class="p109-direction-picker" role="group" aria-label="Aircraft direction"><button class="chip-button ${state.direction === "east" ? "active" : ""}" type="button" data-problem-action="p109-direction" data-p109-direction="east" aria-pressed="${state.direction === "east"}">Eastbound</button><button class="chip-button ${state.direction === "west" ? "active" : ""}" type="button" data-problem-action="p109-direction" data-p109-direction="west" aria-pressed="${state.direction === "west"}">Westbound</button></div><div class="p109-control-grid"><label for="p109-altitude"><span>Altitude h<output data-p109-output="altitude">${format(state.altitudeKm, 1)} km · g=${format(values.gravity, 4)} m/s²</output></span><input id="p109-altitude" type="range" min="0" max="20" step="0.5" value="${state.altitudeKm}"/></label><label for="p109-latitude"><span>Latitude λ<output data-p109-output="latitude">${format(state.latitudeDeg, 0)}° · parallel radius ${format(values.parallelRadius / 1000, 0)} km</output></span><input id="p109-latitude" type="range" min="0" max="75" step="1" value="${state.latitudeDeg}"/></label><label for="p109-speed"><span>Ground-relative speed u<output data-p109-output="speed">${format(state.speedMS, 0)} m/s · ${directionLabel().toLowerCase()}</output></span><input id="p109-speed" type="range" min="0" max="350" step="5" value="${state.speedMS}"/></label><label for="p109-mass"><span>Passenger mass m<output data-p109-output="mass">${format(state.massKg, 0)} kg</output></span><input id="p109-mass" type="range" min="40" max="120" step="1" value="${state.massKg}"/></label></div><p>The mass control chooses a passenger; flight never changes that passenger’s mass. The scale measures only the force normal to a floor held tangent to the spherical surface.</p><div class="p109-presets" role="group" aria-label="Aircraft cases"><button class="chip-button" type="button" data-problem-action="p109-preset" data-p109-preset="challenge">Challenge east</button><button class="chip-button" type="button" data-problem-action="p109-preset" data-p109-preset="west">Same flight west</button><button class="chip-button" type="button" data-problem-action="p109-preset" data-p109-preset="stationary">Stationary at altitude</button><button class="chip-button" type="button" data-problem-action="p109-preset" data-p109-preset="midlat">50° cruise</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p109-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p109-solution" aria-labelledby="p109-solution-heading"><h3 id="p109-solution-heading" tabindex="-1">The scale changes; mass does not</h3><p>At h=10.0 km, r=6.381×10⁶ m. The spherical gravity model gives</p><div class="p109-equation">g=μ/r²=${format(challengeValues.gravity, 9)} m/s²</div><p>At the equator, eastbound u=250 m/s adds to Earth’s angular motion. The required radial inward acceleration is</p><div class="p109-equation">ar=(Ω+u/r)²r<br>=Ω²r+2Ωu+u²/r<br>=${format(challengeValues.rotationTerm, 9)}+${format(challengeValues.crossTerm, 9)}+${format(challengeValues.aircraftCurvatureTerm, 9)}<br>=${format(challengeValues.radialInwardAcceleration, 9)} m/s²</div><p>Taking inward as positive, gravity minus the outward floor force supplies that acceleration:</p><div class="p109-equation">mg−N=mar<br>N=m(g−ar)<br>=75(${format(challengeValues.gravity, 9)}−${format(challengeValues.radialInwardAcceleration, 9)})<br>=${format(challengeValues.normalForce, 9)} N</div><p>A standard-g calibrated scale would display ${format(challengeValues.apparentMass, 6)} kg, but the passenger’s invariant Newtonian mass remains exactly 75 kg.</p><p class="p109-checks"><strong>Checks and assumptions.</strong> Reversing direction changes only the cross term: west minus east is 4mΩu cosλ=${format(challengeValues.westMinusEast, 9)} N at the equator. At u=0 the formula becomes the stationary rotating-Earth reading. As h increases, μ/r² falls; as λ approaches 90°, east/west effects vanish with cosλ, though our controls stop at 75° because a latitude circle shrinks at the pole. Acceleration terms have units m/s² and multiplying by kg gives newtons. Earth is spherical with fixed μ and Ω; speed is ground-relative with no wind. The aircraft follows a constant-altitude parallel. A separate lateral force supplies the poleward acceleration needed away from the equator; a one-axis floor scale reports only the radial normal force. Oblateness, latitude-dependent geodetic gravity, vertical manoeuvres and cabin vibration are omitted.</p></section>`;
  }

  function snapshot() {
    const values = flightData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", earthRadiusMetres: EARTH_RADIUS, earthStandardGravitationalParameter: EARTH_MU, earthAngularRateRadiansPerSecond: EARTH_OMEGA, standardGravityMetresPerSecondSquared: STANDARD_GRAVITY, altitudeKilometres: state.altitudeKm, latitudeDegrees: state.latitudeDeg, groundRelativeSpeedMetresPerSecond: state.speedMS, direction: state.direction, passengerMassKilograms: state.massKg, gravityMetresPerSecondSquared: Number(values.gravity.toFixed(10)), inertialAngularRateRadiansPerSecond: Number(values.inertialAngularRate.toFixed(12)), rotationAccelerationTerm: Number(values.rotationTerm.toFixed(10)), eastWestCrossAccelerationTerm: Number(values.crossTerm.toFixed(10)), aircraftCurvatureAccelerationTerm: Number(values.aircraftCurvatureTerm.toFixed(10)), radialInwardAcceleration: Number(values.radialInwardAcceleration.toFixed(10)), polewardAcceleration: Number(values.polewardAcceleration.toFixed(10)), gravitationalForceNewtons: Number(values.gravitationalForce.toFixed(8)), floorNormalForceNewtons: Number(values.normalForce.toFixed(8)), calibratedApparentMassKilograms: Number(values.apparentMass.toFixed(8)), stationaryNormalForceNewtons: Number(values.stationaryNormalForce.toFixed(8)), oppositeDirectionNormalForceNewtons: Number(values.oppositeNormalForce.toFixed(8)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.altitudeKm = CHALLENGE.altitudeKm; state.latitudeDeg = CHALLENGE.latitudeDeg; state.speedMS = CHALLENGE.speedMS; state.massKg = CHALLENGE.massKg; state.direction = CHALLENGE.direction; }
  function render() {
    return `<main class="book-shell p109-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive rotating-frame mechanics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p109-spread"><article class="book-page p109-problem-page"><div class="problem-number">Problem 10.9</div><h1 class="book-title p109-title">Jet aircraft diet</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">A 75 kg passenger stands on a floor scale aboard a level eastbound aircraft at the equator. The aircraft is 10.0 km above a spherical Earth and travels at 250 m/s relative to the ground.</p><p class="problem-copy"><strong>What floor-normal force does the scale measure?</strong></p><section class="p109-meaning-card"><strong>No actual diet</strong><p>The passenger’s mass stays 75 kg. Only apparent weight—the contact force exerted by the scale—changes with gravity and the acceleration required by the flight path.</p></section><section class="p109-model-card"><div class="eyebrow">Frame and scale</div><p>Calculations use a non-rotating Earth-centred frame. The displayed scale is a one-axis force sensor normal to a locally tangent floor.</p></section></article><section class="book-page book-stage p109-stage">${stageControls()}<div class="p109-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p109-coach"><div class="coach-kicker">Weigh the support force</div><p class="coach-question">For the stated equatorial eastbound flight, enter the floor-normal scale reading.</p><form class="p109-answer-form" data-p109-answer-form novalidate><label for="p109-answer">Scale normal force</label><div><input id="p109-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="force in newtons" autocomplete="off"/><span>N</span></div><button class="primary-button" type="submit">Check scale reading</button></form>${feedbackMarkup()}<div class="button-row p109-help-row"><button class="secondary-button" type="button" data-problem-action="p109-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p109-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p109-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p109-shell"); if (!root) return;
    const dynamic = root.querySelector(".p109-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = flightData();
    const outputs = { altitude: `${format(state.altitudeKm, 1)} km · g=${format(values.gravity, 4)} m/s²`, latitude: `${format(state.latitudeDeg, 0)}° · parallel radius ${format(values.parallelRadius / 1000, 0)} km`, speed: `${format(state.speedMS, 0)} m/s · ${directionLabel().toLowerCase()}`, mass: `${format(state.massKg, 0)} kg` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p109-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p109-altitude")?.setAttribute("aria-valuetext", `Altitude ${format(state.altitudeKm, 1)} kilometres; gravity ${format(values.gravity, 5)} metres per second squared`);
    root.querySelector("#p109-latitude")?.setAttribute("aria-valuetext", `Latitude ${format(state.latitudeDeg, 0)} degrees; parallel radius ${format(values.parallelRadius / 1000, 0)} kilometres`);
    root.querySelector("#p109-speed")?.setAttribute("aria-valuetext", `${directionLabel()} ground speed ${format(state.speedMS, 0)} metres per second; scale force ${format(values.normalForce, 3)} newtons`);
    root.querySelector("#p109-mass")?.setAttribute("aria-valuetext", `Passenger mass ${format(state.massKg, 0)} kilograms; mass remains unchanged by flight`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p109-reset") { state = initialState(); renderAndFocus(renderApp, "#p109-altitude"); return; }
      if (action === "p109-stage") { state.stage = clamp(Number(control.dataset.p109Stage), 0, 2); renderAndFocus(renderApp, `[data-p109-stage="${state.stage}"]`); return; }
      if (action === "p109-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p109-stage="${state.stage}"]`); return; }
      if (action === "p109-direction") { state.direction = control.dataset.p109Direction; renderAndFocus(renderApp, `[data-p109-direction="${state.direction}"]`); return; }
      if (action === "p109-preset") {
        const preset = control.dataset.p109Preset;
        if (preset === "challenge") restoreChallenge();
        if (preset === "west") { restoreChallenge(); state.direction = "west"; }
        if (preset === "stationary") { restoreChallenge(); state.speedMS = 0; }
        if (preset === "midlat") { state.altitudeKm = 11; state.latitudeDeg = 50; state.speedMS = 250; state.massKg = 75; state.direction = "east"; }
        renderAndFocus(renderApp, "#p109-altitude"); return;
      }
      if (action === "p109-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p109-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p109-reveal") window.requestAnimationFrame(() => document.querySelector("#p109-solution-heading")?.focus());
    }));
    [["#p109-altitude", "altitudeKm", 0, 20], ["#p109-latitude", "latitudeDeg", 0, 75], ["#p109-speed", "speedMS", 0, 350], ["#p109-mass", "massKg", 40, 120]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const input = document.querySelector("#p109-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p109-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = challengeValues.normalForce; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one floor-normal force in newtons.";
      else if (Math.abs(answer - challengeValues.gravitationalForce) < .2) state.feedback = "That is approximately mg. The scale reads the smaller support force after gravity supplies the required inward acceleration.";
      else if (Math.abs(answer - challengeValues.apparentMass) < .1) state.feedback = "That is the standard-g scale display in kilograms. The answer box asks for force in newtons.";
      else if (Math.abs(answer - target) > .08) state.feedback = "Find g=μ/r² and ar=(Ω+u/r)²r at the equator, then use N=m(g−ar).";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.feedback = `Correct: the eastbound floor-normal force is ${format(target, 6)} N. The passenger’s mass is still exactly ${CHALLENGE.massKg} kg.`; }
      renderAndFocus(renderApp, "#p109-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
