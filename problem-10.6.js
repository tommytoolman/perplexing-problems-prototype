(function registerNewtonsCannonballPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.6";
  const WORLD_RADIUS = 6.371e6;
  const WORLD_MU = 3.986004418e14;
  const CHALLENGE_ALTITUDE_KM = 400;
  const stages = Object.freeze([
    Object.freeze({ short: "Curvature", title: "Let the world curve away", copy: "Every shot falls toward the world. A faster horizontal shot travels farther while falling, so surface curvature becomes decisive." }),
    Object.freeze({ short: "Thresholds", title: "Separate circle from escape", copy: "At launch radius r₀, vc=√(μ/r₀) makes a circle and vesc=√(2μ/r₀) makes the specific orbital energy zero." }),
    Object.freeze({ short: "Clearance", title: "Compare periapsis with the surface", copy: "A bound conic is an orbit only if its minimum radius clears the spherical world. Otherwise the mathematical ellipse intersects the surface." }),
  ]);
  const hints = Object.freeze([
    "The boundary path is an ellipse with apoapsis rₐ=r₀=R+400 km and periapsis rₚ=R.",
    "For that ellipse, the semi-major axis is a=(rₐ+rₚ)/2=(r₀+R)/2.",
    "Use vis-viva at launch: v²=μ(2/r₀−1/a).",
    "Substituting a=(r₀+R)/2 gives v²=2μR/[r₀(r₀+R)]. Convert the final speed to km/s.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p106-reset">Reset</button>';

  const initialState = () => ({ altitudeKm: CHALLENGE_ALTITUDE_KM, speedKmS: 6.5, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function coordinate(value, digits = 2) { if (!Number.isFinite(value)) return "0"; return Number(value).toFixed(digits); }
  function signed(value, digits = 2) { if (Math.abs(value) < .5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function trajectoryData(altitudeKm = state.altitudeKm, speedKmS = state.speedKmS) {
    const launchRadius = WORLD_RADIUS + altitudeKm * 1000;
    const speed = speedKmS * 1000;
    const circularSpeed = Math.sqrt(WORLD_MU / launchRadius);
    const escapeSpeed = Math.sqrt(2 * WORLD_MU / launchRadius);
    const grazingSpeed = Math.sqrt(2 * WORLD_MU * WORLD_RADIUS / (launchRadius * (launchRadius + WORLD_RADIUS)));
    const speedRatio = speed / circularSpeed;
    const specificEnergy = speed ** 2 / 2 - WORLD_MU / launchRadius;
    const angularMomentum = launchRadius * speed;
    const semilatusRectum = angularMomentum ** 2 / WORLD_MU;
    const eccentricity = Math.abs(speedRatio ** 2 - 1);
    const circular = Math.abs(speed - circularSpeed) < 1e-7;
    const parabolic = Math.abs(speed - escapeSpeed) < 1e-7;
    const unbound = speed >= escapeSpeed - 1e-7;
    let semiMajorAxis = null;
    let periapsisRadius;
    let apoapsisRadius = null;

    if (unbound) {
      periapsisRadius = launchRadius;
      if (!parabolic) semiMajorAxis = -WORLD_MU / (2 * specificEnergy);
    } else {
      semiMajorAxis = -WORLD_MU / (2 * specificEnergy);
      periapsisRadius = semiMajorAxis * (1 - eccentricity);
      apoapsisRadius = semiMajorAxis * (1 + eccentricity);
    }

    const grazing = !unbound && !circular && Math.abs(periapsisRadius - WORLD_RADIUS) < .05;
    let classification;
    if (unbound) classification = "escape";
    else if (circular) classification = "circular";
    else if (grazing) classification = "grazing";
    else if (periapsisRadius < WORLD_RADIUS) classification = "impact";
    else classification = "ellipse";

    return {
      launchRadius,
      speed,
      circularSpeed,
      escapeSpeed,
      grazingSpeed,
      speedRatio,
      specificEnergy,
      angularMomentum,
      semilatusRectum,
      eccentricity,
      semiMajorAxis,
      periapsisRadius,
      apoapsisRadius,
      periapsisAltitude: periapsisRadius - WORLD_RADIUS,
      classification,
      circular,
      parabolic,
      unbound,
      grazing,
      energyIdentityResidual: specificEnergy - (speed ** 2 / 2 - WORLD_MU / launchRadius),
    };
  }

  const challenge = trajectoryData(CHALLENGE_ALTITUDE_KM, 0);

  function classificationLabel(values) {
    if (values.classification === "impact") return "Surface impact";
    if (values.classification === "grazing") return "Surface-grazing boundary";
    if (values.classification === "ellipse") return "Elliptical orbit";
    if (values.classification === "circular") return "Circular orbit";
    return values.parabolic ? "Escape · parabola" : "Escape · hyperbola";
  }

  function classificationNote(values) {
    if (values.classification === "impact") return `The osculating ellipse reaches ${format(Math.abs(values.periapsisAltitude) / 1000, 1)} km beneath the ideal surface, so the shot hits first.`;
    if (values.classification === "grazing") return "The far-side periapsis is exactly at the surface: this is the impact-orbit boundary, not a safe clearance.";
    if (values.classification === "ellipse") return values.speed < values.circularSpeed ? "A sub-circular ellipse clears the surface; launch is its apoapsis." : "A super-circular bound ellipse; launch is its periapsis.";
    if (values.classification === "circular") return "Falling curvature exactly matches world curvature at every point.";
    return values.parabolic ? "Specific orbital energy is zero: the shot approaches zero speed infinitely far away." : "Specific orbital energy is positive: the shot escapes with speed remaining at infinity.";
  }

  function reconstructionNote() {
    return `<p class="p106-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This cannonball-orbit investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p106-stage-controls" role="group" aria-label="Cannonball trajectory stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p106-stage" data-p106-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p106-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p106-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Path classified" : "Next stage"}</button></div>`;
  }

  function conicRadius(theta, values) {
    if (values.speed < 1e-6) return null;
    const denominator = values.speed < values.circularSpeed ? 1 - values.eccentricity * Math.sin(theta) : 1 + values.eccentricity * Math.sin(theta);
    if (denominator <= 1e-8) return Infinity;
    return values.semilatusRectum / denominator;
  }

  function trajectoryPoints(values, centreX, centreY, scale) {
    const launchY = centreY - values.launchRadius * scale;
    if (values.speed < 1e-6) return [{ x: centreX, y: launchY }, { x: centreX, y: centreY - WORLD_RADIUS * scale }];
    const points = [];
    const maximumPlottedRadius = 210 / scale;
    const steps = values.unbound ? 360 : 520;
    let endTheta = Math.PI / 2 - 2 * Math.PI;
    if (values.unbound) endTheta = -Math.asin(Math.min(1, 1 / values.eccentricity)) + .012;
    for (let index = 0; index <= steps; index += 1) {
      const theta = Math.PI / 2 + (endTheta - Math.PI / 2) * index / steps;
      const radius = conicRadius(theta, values);
      if (!Number.isFinite(radius)) break;
      const plottedRadius = Math.min(radius, maximumPlottedRadius);
      const x = centreX + plottedRadius * Math.cos(theta) * scale;
      const y = centreY - plottedRadius * Math.sin(theta) * scale;
      points.push({ x, y });
      if (radius > maximumPlottedRadius) break;
      if (values.classification === "impact" && index > 0 && radius <= WORLD_RADIUS) break;
      if (values.classification === "grazing" && index > steps / 3 && radius <= WORLD_RADIUS + .1) break;
      if (values.unbound && radius > 2.35 * WORLD_RADIUS) break;
    }
    return points;
  }

  function pathMarkup(points) {
    return points.map((point, index) => `${index ? "L" : "M"}${coordinate(point.x)} ${coordinate(point.y)}`).join(" ");
  }

  function orbitSvg() {
    const values = trajectoryData();
    const thresholdsVisible = state.stage >= 1 || state.revealed;
    const clearanceVisible = state.stage >= 2 || state.revealed;
    const centreX = 225, centreY = 236;
    const largestBoundRadius = values.apoapsisRadius || values.launchRadius;
    const scale = values.unbound || values.classification === "impact" || values.classification === "grazing" ? 96 / WORLD_RADIUS : Math.max(25 / WORLD_RADIUS, Math.min(96 / WORLD_RADIUS, 182 / largestBoundRadius));
    const worldPixels = WORLD_RADIUS * scale;
    const launchPixels = values.launchRadius * scale;
    const launchY = centreY - launchPixels;
    const points = trajectoryPoints(values, centreX, centreY, scale);
    const trajectoryPath = pathMarkup(points);
    const periapsisY = values.speed < values.circularSpeed ? centreY + values.periapsisRadius * scale : centreY - values.periapsisRadius * scale;
    const velocityLength = 35 + 80 * Math.min(1, values.speed / values.escapeSpeed);
    const statusValue = state.stage === 0 ? `${format(state.speedKmS, 3)} km/s` : state.stage === 1 ? `vc ${format(values.circularSpeed / 1000, 3)} · vesc ${format(values.escapeSpeed / 1000, 3)}` : classificationLabel(values).toUpperCase();
    const accessibleDetail = `${thresholdsVisible ? ` Circular speed is ${format(values.circularSpeed / 1000, 4)} kilometres per second and escape speed is ${format(values.escapeSpeed / 1000, 4)} kilometres per second.` : ""}${clearanceVisible ? ` The path is classified as ${classificationLabel(values).toLowerCase()}, with periapsis altitude ${format(values.periapsisAltitude / 1000, 3)} kilometres.` : ""}`;
    return `<svg class="p106-svg p106-stage-${state.stage} is-${values.classification}" viewBox="0 0 720 445" role="img" aria-labelledby="p106-svg-title p106-svg-desc"><title id="p106-svg-title">Newton-style horizontal cannonball trajectory around a spherical world</title><desc id="p106-svg-desc">The launch point is ${format(state.altitudeKm, 0)} kilometres above the surface and horizontal speed is ${format(state.speedKmS, 3)} kilometres per second.${accessibleDetail}</desc><defs><radialGradient id="p106-world" cx="37%" cy="33%"><stop offset="0" stop-color="#85c9d4"/><stop offset="1" stop-color="#25637d"/></radialGradient><marker id="p106-speed-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><clipPath id="p106-plot-clip"><rect x="11" y="11" width="414" height="423" rx="17"/></clipPath></defs><rect class="p106-board" x="1" y="1" width="718" height="443" rx="20"/><g clip-path="url(#p106-plot-clip)" aria-hidden="true"><circle class="p106-reference-circle" cx="${centreX}" cy="${centreY}" r="${format(launchPixels, 2)}"/><path class="p106-trajectory" d="${trajectoryPath}"/><circle class="p106-world" cx="${centreX}" cy="${centreY}" r="${format(worldPixels, 2)}"/><path class="p106-land" d="M${format(centreX - .72 * worldPixels, 2)} ${format(centreY - .2 * worldPixels, 2)}q${format(.35 * worldPixels, 2)} ${format(-.45 * worldPixels, 2)} ${format(.72 * worldPixels, 2)} ${format(-.18 * worldPixels, 2)}t${format(.62 * worldPixels, 2)} .08q${format(.18 * worldPixels, 2)} ${format(.34 * worldPixels, 2)} .1 ${format(.7 * worldPixels, 2)}-${format(.48 * worldPixels, 2)} .02-${format(.45 * worldPixels, 2)} .1q-${format(.3 * worldPixels, 2)} ${format(.18 * worldPixels, 2)}-${format(.51 * worldPixels, 2)}-${format(.02 * worldPixels, 2)}Z"/><line class="p106-launch-radius" x1="${centreX}" y1="${centreY}" x2="${centreX}" y2="${format(launchY, 2)}"/><g class="p106-mountain" transform="translate(${centreX} ${format(centreY - worldPixels, 2)})"><path d="M-17 0L0 ${format(-Math.max(7, launchPixels - worldPixels), 2)}L17 0Z"/></g><g class="p106-cannon" transform="translate(${centreX} ${format(launchY, 2)})"><circle r="5"/><path d="M0-5h25v9H0Z"/><line x1="28" y1="-1" x2="${format(28 + velocityLength, 2)}" y2="-1" marker-end="url(#p106-speed-arrow)"/><text x="${format(28 + velocityLength / 2, 2)}" y="-13" text-anchor="middle">${format(state.speedKmS, 3)} km/s</text></g>${clearanceVisible ? `<g class="p106-periapsis"><circle cx="${centreX}" cy="${format(periapsisY, 2)}" r="6"/><text x="${centreX + 12}" y="${format(periapsisY + 4, 2)}">periapsis ${signed(values.periapsisAltitude / 1000, 2)} km</text></g>` : ""}</g><text class="p106-world-label" x="${centreX}" y="${centreY + 4}" text-anchor="middle">WORLD</text><g class="p106-status" aria-hidden="true" transform="translate(450 24)"><rect width="250" height="79" rx="14"/><text class="p106-status-kicker" x="16" y="22">${clearanceVisible ? classificationLabel(values).toUpperCase() : "HORIZONTAL LAUNCH"}</text><text class="p106-status-value" x="16" y="49">${statusValue}</text><text class="p106-status-note" x="16" y="67">r₀=${format(values.launchRadius / 1e6, 4)}×10⁶ m</text></g><g class="p106-thresholds" aria-hidden="true" transform="translate(450 124)"><rect width="250" height="132" rx="14"/><text class="p106-panel-kicker" x="16" y="24">SPEED THRESHOLDS AT r₀</text><text class="p106-panel-label" x="16" y="52">selected v</text><text class="p106-panel-value" x="234" y="52" text-anchor="end">${format(state.speedKmS, 4)} km/s</text><text class="p106-panel-label" x="16" y="78">circular vc</text><text class="p106-panel-value" x="234" y="78" text-anchor="end">${thresholdsVisible ? `${format(values.circularSpeed / 1000, 4)} km/s` : "stage 2"}</text><text class="p106-panel-label" x="16" y="104">escape vesc</text><text class="p106-panel-value" x="234" y="104" text-anchor="end">${thresholdsVisible ? `${format(values.escapeSpeed / 1000, 4)} km/s` : "stage 2"}</text><line class="p106-threshold-line" x1="16" y1="118" x2="234" y2="118"/><circle class="p106-selected-dot" cx="${format(16 + 218 * Math.min(1, values.speed / (1.1 * values.escapeSpeed)), 2)}" cy="118" r="5"/></g><g class="p106-clearance" aria-hidden="true" transform="translate(450 277)"><rect width="250" height="139" rx="14"/><text class="p106-panel-kicker" x="16" y="24">SURFACE CLEARANCE TEST</text><text class="p106-clearance-value" x="125" y="65" text-anchor="middle">${clearanceVisible ? `${signed(values.periapsisAltitude / 1000, 2)} km` : "stage 3"}</text><text class="p106-clearance-note" x="125" y="88" text-anchor="middle">periapsis altitude rp−R</text><text class="p106-clearance-class" x="125" y="116" text-anchor="middle">${clearanceVisible ? classificationLabel(values) : "compare rp with R"}</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = trajectoryData();
    const thresholdsVisible = state.stage >= 1 || state.revealed;
    const clearanceVisible = state.stage >= 2 || state.revealed;
    return `<section class="p106-metrics" aria-live="polite"><div><span>Selected speed</span><strong>${format(state.speedKmS, 4)} km/s</strong></div><div><span>Specific orbital energy</span><strong>${signed(values.specificEnergy / 1e6, 4)} MJ/kg</strong></div><div><span>Circular / escape</span><strong>${thresholdsVisible ? `${format(values.circularSpeed / 1000, 3)} / ${format(values.escapeSpeed / 1000, 3)} km/s` : "stage 2"}</strong></div><div><span>Periapsis altitude</span><strong>${clearanceVisible ? `${signed(values.periapsisAltitude / 1000, 3)} km` : "stage 3"}</strong></div>${clearanceVisible ? `<p><strong>${classificationLabel(values)}.</strong> ${classificationNote(values)} Energy identity residual = ${values.energyIdentityResidual.toExponential(1)} J/kg.</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p106-dynamic">${orbitSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = trajectoryData();
    return `<section class="p106-controls" aria-label="Cannonball launch controls"><div class="p106-control-grid"><label for="p106-altitude"><span>Launch altitude<output data-p106-output="altitude">${format(state.altitudeKm, 0)} km · r₀=${format(values.launchRadius / 1e6, 4)}×10⁶ m</output></span><input id="p106-altitude" type="range" min="0" max="3000" step="50" value="${state.altitudeKm}"/></label><label for="p106-speed"><span>Horizontal launch speed<output data-p106-output="speed">${format(state.speedKmS, 3)} km/s · ${format(values.speedRatio, 3)}vc</output></span><input id="p106-speed" type="range" min="0" max="12" step="0.001" value="${state.speedKmS}"/></label></div><p>Speed is measured in a non-rotating, world-centred frame. The drawn conic is calculated from the same energy and angular momentum shown in the readouts.</p><div class="p106-presets" role="group" aria-label="Trajectory examples"><button class="chip-button" type="button" data-problem-action="p106-preset" data-p106-preset="impact">Impact</button><button class="chip-button" type="button" data-problem-action="p106-preset" data-p106-preset="grazing">Grazing boundary</button><button class="chip-button" type="button" data-problem-action="p106-preset" data-p106-preset="ellipse">Elliptical orbit</button><button class="chip-button" type="button" data-problem-action="p106-preset" data-p106-preset="circle">Circular orbit</button><button class="chip-button" type="button" data-problem-action="p106-preset" data-p106-preset="escape">Escape</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p106-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const r0 = challenge.launchRadius;
    return `<section class="p106-solution" aria-labelledby="p106-solution-heading"><h3 id="p106-solution-heading" tabindex="-1">The first orbit is slower than the circular orbit</h3><p>At the impact boundary the launch point is the ellipse’s apoapsis, rₐ=r₀=R+400 km=6.771×10⁶ m, while the far-side periapsis just touches the world: rₚ=R=6.371×10⁶ m.</p><div class="p106-equation">a=(rₐ+rₚ)/2=(r₀+R)/2</div><p>Apply vis-viva at launch:</p><div class="p106-equation">v²=μ(2/r₀−1/a)<br>=2μR/[r₀(r₀+R)]</div><div class="p106-equation">v=${format(challenge.grazingSpeed, 6)} m/s<br>=${format(challenge.grazingSpeed / 1000, 9)} km/s</div><p>This is below vc=${format(challenge.circularSpeed / 1000, 6)} km/s. Speeds just above the grazing threshold already form surface-clearing ellipses; circular speed is not the minimum speed that misses the world.</p><p class="p106-checks"><strong>Checks and limits.</strong> For a tangential launch below vc, r₀ is apoapsis and rp=v²r₀²/[μ(2−v²r₀/μ)]. Setting rp=R reproduces the threshold above. At v=vc, eccentricity is zero and rp=r₀. At v=vesc=√2vc, specific energy is zero and the conic becomes parabolic; above it, hyperbolic. As launch altitude tends to zero, the grazing and circular thresholds coincide. Units check: μR/[r₀(r₀+R)] has units m²/s². The world is spherical, non-rotating and airless; the cannon is a point at launch, and terrain, atmosphere, recoil, world rotation and other bodies are omitted.</p></section>`;
  }

  function snapshot() {
    const values = trajectoryData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", worldRadiusMetres: WORLD_RADIUS, worldStandardGravitationalParameter: WORLD_MU, launchAltitudeKilometres: state.altitudeKm, launchRadiusMetres: values.launchRadius, horizontalSpeedKilometresPerSecond: state.speedKmS, circularSpeedKilometresPerSecond: Number((values.circularSpeed / 1000).toFixed(9)), escapeSpeedKilometresPerSecond: Number((values.escapeSpeed / 1000).toFixed(9)), grazingBoundarySpeedKilometresPerSecond: Number((values.grazingSpeed / 1000).toFixed(9)), speedAsFractionOfCircular: Number(values.speedRatio.toFixed(9)), specificOrbitalEnergyJoulesPerKilogram: Number(values.specificEnergy.toFixed(6)), angularMomentumSquareMetresPerSecond: Number(values.angularMomentum.toFixed(3)), eccentricity: Number(values.eccentricity.toFixed(10)), semiMajorAxisMetres: values.semiMajorAxis === null ? null : Number(values.semiMajorAxis.toFixed(3)), periapsisAltitudeKilometres: Number((values.periapsisAltitude / 1000).toFixed(6)), classification: values.classification, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallengeStart() { state.altitudeKm = CHALLENGE_ALTITUDE_KM; state.speedKmS = 6.5; }
  function render() {
    return `<main class="book-shell p106-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive orbital mechanics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p106-spread"><article class="book-page p106-problem-page"><div class="problem-number">Problem 10.6</div><h1 class="book-title p106-title">Newton’s cannonball</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">An ideal cannon fires horizontally from 400 km above a spherical, airless Earth. Increase the launch speed until the mathematical ellipse changes from intersecting Earth to just grazing its far-side surface.</p><p class="problem-copy"><strong>Find that boundary speed in kilometres per second.</strong></p><section class="p106-idea-card"><strong>One continuous idea</strong><p>A projectile and an orbiting body obey the same falling law. Orbit begins when the path’s inward fall is matched by enough sideways travel for the surface to curve away.</p></section><section class="p106-model-card"><div class="eyebrow">Ideal model</div><p>Earth radius 6371 km and μ=3.986004418×10¹⁴ m³/s². Launch is exactly tangential in a world-centred inertial frame.</p></section></article><section class="book-page book-stage p106-stage">${stageControls()}<div class="p106-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p106-coach"><div class="coach-kicker">Find the first clear path</div><p class="coach-question">At 400 km altitude, what horizontal speed makes the far-side periapsis exactly equal to Earth’s radius?</p><form class="p106-answer-form" data-p106-answer-form novalidate><label for="p106-answer">Grazing-boundary speed</label><div><input id="p106-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="speed in km/s" autocomplete="off"/><span>km/s</span></div><button class="primary-button" type="submit">Check boundary speed</button></form>${feedbackMarkup()}<div class="button-row p106-help-row"><button class="secondary-button" type="button" data-problem-action="p106-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p106-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p106-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p106-shell"); if (!root) return;
    const dynamic = root.querySelector(".p106-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = trajectoryData();
    const outputs = { altitude: `${format(state.altitudeKm, 0)} km · r₀=${format(values.launchRadius / 1e6, 4)}×10⁶ m`, speed: `${format(state.speedKmS, 3)} km/s · ${format(values.speedRatio, 3)}vc` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p106-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p106-altitude")?.setAttribute("aria-valuetext", `Launch altitude ${format(state.altitudeKm, 0)} kilometres; circular speed ${format(values.circularSpeed / 1000, 3)} kilometres per second`);
    root.querySelector("#p106-speed")?.setAttribute("aria-valuetext", `Horizontal speed ${format(state.speedKmS, 3)} kilometres per second; ${classificationLabel(values)}; periapsis altitude ${signed(values.periapsisAltitude / 1000, 2)} kilometres`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p106-reset") { state = initialState(); renderAndFocus(renderApp, "#p106-altitude"); return; }
      if (action === "p106-stage") { state.stage = clamp(Number(control.dataset.p106Stage), 0, 2); renderAndFocus(renderApp, `[data-p106-stage="${state.stage}"]`); return; }
      if (action === "p106-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p106-stage="${state.stage}"]`); return; }
      if (action === "p106-preset") {
        const preset = control.dataset.p106Preset;
        if (preset === "impact") { state.altitudeKm = 400; state.speedKmS = 6.5; }
        if (preset === "grazing") { state.altitudeKm = 400; state.speedKmS = challenge.grazingSpeed / 1000; }
        if (preset === "ellipse") { state.altitudeKm = 400; state.speedKmS = .5 * (challenge.grazingSpeed + challenge.circularSpeed) / 1000; }
        if (preset === "circle") { state.altitudeKm = 400; state.speedKmS = challenge.circularSpeed / 1000; }
        if (preset === "escape") { state.altitudeKm = 400; state.speedKmS = challenge.escapeSpeed / 1000; }
        renderAndFocus(renderApp, "#p106-speed"); return;
      }
      if (action === "p106-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p106-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p106-reveal") window.requestAnimationFrame(() => document.querySelector("#p106-solution-heading")?.focus());
    }));
    [["#p106-altitude", "altitudeKm", 0, 3000], ["#p106-speed", "speedKmS", 0, 12]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const input = document.querySelector("#p106-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p106-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = challenge.grazingSpeed / 1000; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one horizontal speed in kilometres per second.";
      else if (Math.abs(answer - challenge.circularSpeed / 1000) < .002) state.feedback = "That is the circular speed. The first surface-clearing ellipse is slightly slower; set its far-side periapsis equal to Earth’s radius.";
      else if (Math.abs(answer - challenge.grazingSpeed) < 2) state.feedback = "That numerical value is metres per second. Divide by 1000 for the requested km/s.";
      else if (Math.abs(answer - target) > .001) state.feedback = "Use an ellipse with apoapsis r₀ and periapsis R, then apply vis-viva at launch.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.feedback = `Correct: the impact boundary is ${format(target, 9)} km/s, below the ${format(challenge.circularSpeed / 1000, 6)} km/s circular speed.`; }
      renderAndFocus(renderApp, "#p106-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
