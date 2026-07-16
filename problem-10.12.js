(function registerAsteroidGamesPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.12";
  const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
  const ASTRONOMICAL_UNIT = 1.495978707e11;
  const EARTH_RADIUS = 6.371e6;
  const SAFETY_MARGIN = 1e6;
  const SAFETY_RADIUS = EARTH_RADIUS + SAFETY_MARGIN;
  const CHALLENGE = Object.freeze({ warningYears: 20, speedKmS: 20, massBillionKg: 50 });
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Turn a tiny angle into a large miss", copy: "A transverse velocity change accumulates sideways separation. In the linear model, d≈Δv·t, equivalently d≈(Δv/v)(vt)." }),
    Object.freeze({ short: "Action", title: "Distinguish Δv, impulse and energy", copy: "The same Δv gives the same geometric miss for every mass, but impulse J=mΔv and the transverse kinetic-energy increment ΔK=½mΔv² scale with mass." }),
    Object.freeze({ short: "Risk", title: "Compare miss distance with two radii", copy: "Below Earth’s radius the centreline impacts. Between Earth and the teaching safety radius it is a close approach; outside both it is clear in this model." }),
  ]);
  const hints = Object.freeze([
    "The teaching safety threshold is R⊕+1000 km=7.371×10⁶ m.",
    "Twenty Julian years is 20×365.25×86400=631,152,000 s. Use Δv=d/t.",
    "Impulse is J=mΔv. Here m=50 billion kg=5.0×10¹⁰ kg.",
    "Convert the final impulse from N·s to GN·s by dividing by 10⁹.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p1012-reset">Reset</button>';

  const initialState = () => ({ warningYears: CHALLENGE.warningYears, speedKmS: CHALLENGE.speedKmS, massBillionKg: CHALLENGE.massBillionKg, actionMode: "deltav", deltaVMs: .01, impulseNs: .5e9, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function scientific(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return value.toExponential(digits); }
  function signed(value, digits = 2) { if (Math.abs(value) < .5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function deflectionData(
    warningYears = state.warningYears,
    speedKmS = state.speedKmS,
    massBillionKg = state.massBillionKg,
    actionMode = state.actionMode,
    independentDeltaV = state.deltaVMs,
    independentImpulse = state.impulseNs,
  ) {
    const warningSeconds = warningYears * SECONDS_PER_YEAR;
    const speed = speedKmS * 1000;
    const mass = massBillionKg * 1e9;
    const deltaV = actionMode === "deltav" ? independentDeltaV : independentImpulse / mass;
    const impulse = actionMode === "deltav" ? mass * deltaV : independentImpulse;
    const smallAngle = deltaV / speed;
    const exactAngle = Math.atan2(deltaV, speed);
    const travelDistance = speed * warningSeconds;
    const missDistance = deltaV * warningSeconds;
    const angleDistanceMiss = smallAngle * travelDistance;
    const asteroidKineticEnergy = .5 * mass * speed ** 2;
    const transverseKineticEnergyIncrement = .5 * mass * deltaV ** 2;
    const requiredDeltaV = SAFETY_RADIUS / warningSeconds;
    const requiredImpulse = mass * requiredDeltaV;
    const requiredTransverseEnergy = .5 * mass * requiredDeltaV ** 2;
    let risk;
    if (missDistance <= EARTH_RADIUS + .001) risk = "impact";
    else if (missDistance < SAFETY_RADIUS - .001) risk = "close";
    else risk = "clear";
    return {
      warningSeconds,
      speed,
      mass,
      deltaV,
      impulse,
      smallAngle,
      exactAngle,
      travelDistance,
      missDistance,
      angleDistanceMiss,
      asteroidKineticEnergy,
      transverseKineticEnergyIncrement,
      requiredDeltaV,
      requiredImpulse,
      requiredTransverseEnergy,
      risk,
      safetyMarginDistance: missDistance - SAFETY_RADIUS,
      geometryResidual: missDistance - angleDistanceMiss,
      impulseResidual: impulse - mass * deltaV,
    };
  }

  const challengeValues = deflectionData(CHALLENGE.warningYears, CHALLENGE.speedKmS, CHALLENGE.massBillionKg, "deltav", .01, .5e9);

  function riskLabel(risk) {
    if (risk === "impact") return "Projected impact";
    if (risk === "close") return "Close approach";
    return "Outside safety radius";
  }

  function riskNote(values) {
    if (values.risk === "impact") return `The deflected centreline still passes ${format((EARTH_RADIUS - values.missDistance) / 1000, 1)} km inside Earth’s ideal radius.`;
    if (values.risk === "close") return `The centreline misses Earth but remains ${format((SAFETY_RADIUS - values.missDistance) / 1000, 1)} km inside the additional teaching safety margin.`;
    return `The centreline clears the teaching safety radius by ${format(values.safetyMarginDistance / 1000, 1)} km.`;
  }

  function reconstructionNote() {
    return `<p class="p1012-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and four-star difficulty. This deflection-planning investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p1012-stage-controls" role="group" aria-label="Asteroid deflection stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p1012-stage" data-p1012-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p1012-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p1012-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Risk classified" : "Next stage"}</button></div>`;
  }

  function encounterSvg() {
    const values = deflectionData();
    const actionVisible = state.stage >= 1 || state.revealed;
    const riskVisible = state.stage >= 2 || state.revealed;
    const earthX = 355, earthY = 235, safetyPixels = 72;
    const earthPixels = safetyPixels * EARTH_RADIUS / SAFETY_RADIUS;
    const missPixels = Math.min(148, safetyPixels * values.missDistance / SAFETY_RADIUS);
    const deflectedY = earthY - missPixels;
    const startX = 37, endX = 438;
    const slope = (deflectedY - earthY) / (earthX - startX);
    const extendedY = deflectedY + slope * (endX - earthX);
    const impulseArrow = 18 + 34 * Math.min(1, values.deltaV / Math.max(values.requiredDeltaV, 1e-12));
    const statusValue = state.stage === 0 ? `miss ≈ ${format(values.missDistance / 1000, 1)} km` : state.stage === 1 ? `J = ${format(values.impulse / 1e9, 4)} GN·s` : riskLabel(values.risk).toUpperCase();
    const detail = `${actionVisible ? ` Transverse delta v is ${format(values.deltaV * 100, 4)} centimetres per second and impulse is ${format(values.impulse / 1e9, 5)} gig newton seconds.` : ""}${riskVisible ? ` Approximate miss distance is ${format(values.missDistance / 1000, 2)} kilometres, classified as ${riskLabel(values.risk).toLowerCase()}.` : ""}`;
    return `<svg class="p1012-svg p1012-stage-${state.stage} is-${values.risk}" viewBox="0 0 720 445" role="img" aria-labelledby="p1012-svg-title p1012-svg-desc"><title id="p1012-svg-title">Original and transversely deflected asteroid encounter paths</title><desc id="p1012-svg-desc">An asteroid travelling ${format(state.speedKmS, 1)} kilometres per second receives a transverse change ${format(state.warningYears, 1)} years before encounter.${detail}</desc><defs><radialGradient id="p1012-earth" cx="37%" cy="32%"><stop offset="0" stop-color="#83cad5"/><stop offset="1" stop-color="#28657e"/></radialGradient><marker id="p1012-impulse-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs><rect class="p1012-board" x="1" y="1" width="718" height="443" rx="20"/><g class="p1012-encounter" aria-hidden="true"><line class="p1012-original-path" x1="${startX}" y1="${earthY}" x2="${endX}" y2="${earthY}"/><path class="p1012-deflected-path" d="M${startX} ${earthY}L${earthX} ${format(deflectedY, 2)}L${endX} ${format(extendedY, 2)}"/><circle class="p1012-safety-ring" cx="${earthX}" cy="${earthY}" r="${safetyPixels}"/><circle class="p1012-earth" cx="${earthX}" cy="${earthY}" r="${format(earthPixels, 2)}"/><path class="p1012-land" d="M312 222q27-35 53-15t37-5q24 22 22 48-18 7-35-2t-27 5q-22 12-53-4Z"/><text class="p1012-earth-label" x="${earthX}" y="${earthY + 5}" text-anchor="middle">EARTH</text><text class="p1012-safety-label" x="${earthX}" y="${earthY - safetyPixels - 10}" text-anchor="middle">safety radius R⊕+1000 km</text><circle class="p1012-asteroid" cx="${startX + 17}" cy="${earthY}" r="10"/><path class="p1012-asteroid-craters" d="M48 231l5-3 4 4m3 7 4-3"/><line class="p1012-impulse-vector" x1="${startX + 17}" y1="${earthY - 13}" x2="${startX + 17}" y2="${format(earthY - 13 - impulseArrow, 2)}" marker-end="url(#p1012-impulse-arrow)"/><text class="p1012-burn-label" x="${startX + 33}" y="${format(earthY - 18 - impulseArrow, 2)}">transverse impulse</text><text class="p1012-path-label original" x="117" y="${earthY + 18}">original impact line</text><text class="p1012-path-label deflected" x="164" y="${format(earthY + slope * (164 - startX) - 12, 2)}">deflected centreline</text>${riskVisible ? `<line class="p1012-miss-bracket" x1="${earthX - 17}" y1="${earthY}" x2="${earthX - 17}" y2="${format(deflectedY, 2)}"/><text class="p1012-miss-label" x="${earthX - 24}" y="${format((earthY + deflectedY) / 2, 2)}" text-anchor="end">${format(values.missDistance / 1000, 1)} km</text>` : ""}</g><g class="p1012-status" aria-hidden="true" transform="translate(465 24)"><rect width="235" height="79" rx="14"/><text class="p1012-status-kicker" x="16" y="22">${format(state.warningYears, 1)} YEARS OF LEVERAGE</text><text class="p1012-status-value" x="16" y="49">${statusValue}</text><text class="p1012-status-note" x="16" y="67">travel ≈ ${format(values.travelDistance / ASTRONOMICAL_UNIT, 2)} AU</text></g><g class="p1012-action-panel" aria-hidden="true" transform="translate(465 124)"><rect width="235" height="151" rx="14"/><text class="p1012-panel-kicker" x="16" y="24">DEFLECTION ACTION</text><text class="p1012-panel-label" x="16" y="51">transverse Δv</text><text class="p1012-panel-number" x="219" y="51" text-anchor="end">${actionVisible ? `${format(values.deltaV * 100, 4)} cm/s` : "stage 2"}</text><text class="p1012-panel-label" x="16" y="76">impulse J=mΔv</text><text class="p1012-panel-number" x="219" y="76" text-anchor="end">${actionVisible ? `${format(values.impulse / 1e9, 5)} GN·s` : "stage 2"}</text><text class="p1012-panel-label" x="16" y="101">deflection angle Δv/v</text><text class="p1012-panel-number" x="219" y="101" text-anchor="end">${actionVisible ? `${format(values.smallAngle * 1e6, 4)} μrad` : "stage 2"}</text><text class="p1012-panel-label" x="16" y="126">asteroid ΔK⊥</text><text class="p1012-panel-number" x="219" y="126" text-anchor="end">${actionVisible ? `${format(values.transverseKineticEnergyIncrement / 1e6, 4)} MJ` : "stage 2"}</text></g><g class="p1012-risk-panel" aria-hidden="true" transform="translate(465 296)"><rect width="235" height="120" rx="14"/><text class="p1012-panel-kicker" x="16" y="24">LINEARIZED ENCOUNTER RISK</text><text class="p1012-risk-value" x="117.5" y="62" text-anchor="middle">${riskVisible ? riskLabel(values.risk) : "stage 3"}</text><text class="p1012-risk-note" x="117.5" y="86" text-anchor="middle">${riskVisible ? `${signed(values.safetyMarginDistance / 1000, 1)} km vs safety radius` : "compare d with R⊕ and safety ring"}</text><text class="p1012-risk-threshold" x="117.5" y="104" text-anchor="middle">threshold Δv ${format(values.requiredDeltaV * 100, 4)} cm/s</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = deflectionData();
    const actionVisible = state.stage >= 1 || state.revealed;
    const riskVisible = state.stage >= 2 || state.revealed;
    return `<section class="p1012-metrics" aria-live="polite"><div><span>Approximate miss distance</span><strong>${format(values.missDistance / 1000, 2)} km</strong></div><div><span>Transverse Δv</span><strong>${actionVisible ? `${format(values.deltaV * 100, 4)} cm/s` : "stage 2"}</strong></div><div><span>Applied impulse</span><strong>${actionVisible ? `${format(values.impulse / 1e9, 5)} GN·s` : "stage 2"}</strong></div><div><span>Transverse asteroid ΔK</span><strong>${actionVisible ? `${format(values.transverseKineticEnergyIncrement / 1e6, 4)} MJ` : "stage 2"}</strong></div><div><span>Baseline asteroid KE</span><strong>${actionVisible ? `${scientific(values.asteroidKineticEnergy, 3)} J` : "stage 2"}</strong></div><div><span>Risk classification</span><strong>${riskVisible ? riskLabel(values.risk) : "stage 3"}</strong></div>${riskVisible ? `<p><strong>${riskLabel(values.risk)}.</strong> ${riskNote(values)} Geometry residual ${values.geometryResidual.toExponential(1)} m; impulse residual ${values.impulseResidual.toExponential(1)} N·s.</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p1012-dynamic">${encounterSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = deflectionData();
    const deltaVMaximum = Math.max(.1, values.deltaV);
    const impulseMaximum = Math.max(50e9, values.impulse);
    return `<section class="p1012-controls" aria-label="Asteroid deflection controls"><div class="p1012-mode-picker" role="group" aria-label="Independent deflection input"><button class="chip-button ${state.actionMode === "deltav" ? "active" : ""}" type="button" data-problem-action="p1012-mode" data-p1012-mode="deltav" aria-pressed="${state.actionMode === "deltav"}">Set Δv</button><button class="chip-button ${state.actionMode === "impulse" ? "active" : ""}" type="button" data-problem-action="p1012-mode" data-p1012-mode="impulse" aria-pressed="${state.actionMode === "impulse"}">Set impulse</button></div><div class="p1012-control-grid"><label for="p1012-warning"><span>Warning time<output data-p1012-output="warning">${format(state.warningYears, 1)} years · ${format(values.warningSeconds / 1e6, 2)} Ms</output></span><input id="p1012-warning" type="range" min="0.5" max="50" step="0.1" value="${state.warningYears}"/></label><label for="p1012-speed"><span>Asteroid speed<output data-p1012-output="speed">${format(state.speedKmS, 1)} km/s · ${format(values.travelDistance / ASTRONOMICAL_UNIT, 2)} AU before encounter</output></span><input id="p1012-speed" type="range" min="5" max="40" step="0.5" value="${state.speedKmS}"/></label><label for="p1012-mass"><span>Asteroid mass<output data-p1012-output="mass">${format(state.massBillionKg, 0)} billion kg · ${format(state.massBillionKg, 0)} million tonnes</output></span><input id="p1012-mass" type="range" min="1" max="500" step="1" value="${state.massBillionKg}"/></label><label for="p1012-deltav"><span>${state.actionMode === "deltav" ? "Applied transverse Δv" : "Derived transverse Δv"}<output data-p1012-output="deltav">${format(values.deltaV * 100, 4)} cm/s</output></span><input id="p1012-deltav" type="range" min="0" max="${deltaVMaximum}" step="0.00001" value="${values.deltaV}" ${state.actionMode === "impulse" ? "disabled" : ""}/></label><label class="p1012-impulse-control" for="p1012-impulse"><span>${state.actionMode === "impulse" ? "Applied transverse impulse" : "Derived transverse impulse"}<output data-p1012-output="impulse">${format(values.impulse / 1e9, 5)} GN·s</output></span><input id="p1012-impulse" type="range" min="0" max="${impulseMaximum}" step="1000000" value="${values.impulse}" ${state.actionMode === "deltav" ? "disabled" : ""}/></label></div><p>Impulse is momentum change, not energy. The displayed ΔK is only the asteroid’s kinetic-energy increase for one instantaneous impulse perpendicular to its original velocity; it is not a deflection mission’s required energy.</p><div class="p1012-presets" role="group" aria-label="Deflection cases"><button class="chip-button" type="button" data-problem-action="p1012-preset" data-p1012-preset="challenge">Near-impact start</button><button class="chip-button" type="button" data-problem-action="p1012-preset" data-p1012-preset="threshold">Safety threshold</button><button class="chip-button" type="button" data-problem-action="p1012-preset" data-p1012-preset="early">Early small nudge</button><button class="chip-button" type="button" data-problem-action="p1012-preset" data-p1012-preset="late">Late large nudge</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p1012-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p1012-solution" aria-labelledby="p1012-solution-heading"><h3 id="p1012-solution-heading" tabindex="-1">Early geometry sets Δv; mass sets impulse</h3><p>The teaching clearance threshold is d=R⊕+1000 km=7.371×10⁶ m. Twenty Julian years is</p><div class="p1012-equation">t=20(365.25)(86400)=631,152,000 s</div><p>The linear transverse separation is d≈Δv·t, so</p><div class="p1012-equation">Δv=d/t=${format(challengeValues.requiredDeltaV, 12)} m/s<br>=${format(challengeValues.requiredDeltaV * 100, 9)} cm/s</div><p>For m=50 billion kg=5.0×10¹⁰ kg, the minimum impulse is</p><div class="p1012-equation">J=mΔv=(5.0×10¹⁰)(${format(challengeValues.requiredDeltaV, 12)})<br>=${format(challengeValues.requiredImpulse, 3)} N·s<br>=${format(challengeValues.requiredImpulse / 1e9, 12)} GN·s</div><p>The corresponding asteroid kinetic-energy increase for an instantaneous perpendicular impulse is ΔK=J²/(2m)=${format(challengeValues.requiredTransverseEnergy / 1e6, 6)} MJ. This is not the propulsion or kinetic-impactor energy budget.</p><p class="p1012-checks"><strong>Checks and idealisations.</strong> Doubling warning time halves required Δv and impulse, and quarters this transverse ΔK. At fixed Δv, mass does not affect miss distance but scales J and ΔK linearly. Asteroid speed cancels from d≈(Δv/v)(vt), although it sets the deflection angle and the enormous baseline kinetic energy. Units: (m/s)s=m, kg·m/s=N·s, and kg(m/s)²=J. The model applies one instantaneous transverse impulse, then assumes constant straight-line velocities. It ignores solar/Earth gravity and gravitational focusing, orbital curvature, target motion, uncertainty growth, fragmentation, finite burn duration and direction errors. The extra 1000 km is a teaching threshold, not an operational planetary-defence standard.</p></section>`;
  }

  function snapshot() {
    const values = deflectionData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", linearizedConstantVelocityModel: true, earthRadiusMetres: EARTH_RADIUS, teachingSafetyMarginMetres: SAFETY_MARGIN, warningTimeYears: state.warningYears, warningTimeSeconds: values.warningSeconds, asteroidSpeedKilometresPerSecond: state.speedKmS, asteroidMassKilograms: values.mass, independentInput: state.actionMode, transverseDeltaVMetresPerSecond: Number(values.deltaV.toFixed(10)), transverseImpulseNewtonSeconds: Number(values.impulse.toFixed(3)), smallDeflectionAngleRadians: Number(values.smallAngle.toPrecision(10)), exactImpulseTurnAngleRadians: Number(values.exactAngle.toPrecision(10)), travelDistanceAstronomicalUnits: Number((values.travelDistance / ASTRONOMICAL_UNIT).toFixed(8)), approximateMissDistanceKilometres: Number((values.missDistance / 1000).toFixed(6)), asteroidBaselineKineticEnergyJoules: Number(values.asteroidKineticEnergy.toPrecision(10)), transverseKineticEnergyIncrementJoules: Number(values.transverseKineticEnergyIncrement.toFixed(3)), teachingSafetyDeltaVMetresPerSecond: Number(values.requiredDeltaV.toFixed(10)), teachingSafetyImpulseNewtonSeconds: Number(values.requiredImpulse.toFixed(3)), riskClassification: values.risk, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.warningYears = CHALLENGE.warningYears; state.speedKmS = CHALLENGE.speedKmS; state.massBillionKg = CHALLENGE.massBillionKg; state.actionMode = "deltav"; state.deltaVMs = .01; state.impulseNs = .5e9; }
  function render() {
    return `<main class="book-shell p1012-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive planetary defence</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p1012-spread"><article class="book-page p1012-problem-page"><div class="problem-number">Problem 10.12</div><h1 class="book-title p1012-title">Asteroid games</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div>${reconstructionNote()}<p class="problem-copy">A 50-billion-kilogram asteroid is predicted to strike Earth in 20 Julian years. An ideal intervention gives it one instantaneous velocity change perpendicular to its 20 km/s approach.</p><p class="problem-copy">Using a teaching safety threshold 1000 km beyond Earth’s radius, <strong>find the minimum transverse impulse in GN·s.</strong></p><section class="p1012-idea-card"><strong>Exploit warning time</strong><p>A centimetre-per-second-scale velocity change looks tiny, but accumulated over years it can move an encounter centreline by thousands of kilometres.</p></section><section class="p1012-model-card"><div class="eyebrow">Linearized encounter</div><p>Original centreline passes through Earth’s centre. After the impulse, both bodies are represented by constant straight-line motion until the nominal encounter.</p></section></article><section class="book-page book-stage p1012-stage">${stageControls()}<div class="p1012-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p1012-coach"><div class="coach-kicker">Buy miss distance early</div><p class="coach-question">What minimum transverse impulse moves the centreline to R⊕+1000 km after 20 years?</p><form class="p1012-answer-form" data-p1012-answer-form novalidate><label for="p1012-answer">Minimum impulse</label><div><input id="p1012-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="impulse in GN·s" autocomplete="off"/><span>GN·s</span></div><button class="primary-button" type="submit">Check impulse</button></form>${feedbackMarkup()}<div class="button-row p1012-help-row"><button class="secondary-button" type="button" data-problem-action="p1012-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p1012-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p1012-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p1012-shell"); if (!root) return;
    const dynamic = root.querySelector(".p1012-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = deflectionData();
    const outputs = { warning: `${format(state.warningYears, 1)} years · ${format(values.warningSeconds / 1e6, 2)} Ms`, speed: `${format(state.speedKmS, 1)} km/s · ${format(values.travelDistance / ASTRONOMICAL_UNIT, 2)} AU before encounter`, mass: `${format(state.massBillionKg, 0)} billion kg · ${format(state.massBillionKg, 0)} million tonnes`, deltav: `${format(values.deltaV * 100, 4)} cm/s`, impulse: `${format(values.impulse / 1e9, 5)} GN·s` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p1012-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p1012-warning")?.setAttribute("aria-valuetext", `Warning time ${format(state.warningYears, 1)} years; miss distance ${format(values.missDistance / 1000, 1)} kilometres`);
    root.querySelector("#p1012-speed")?.setAttribute("aria-valuetext", `Asteroid speed ${format(state.speedKmS, 1)} kilometres per second; deflection angle ${format(values.smallAngle * 1e6, 4)} microradians`);
    root.querySelector("#p1012-mass")?.setAttribute("aria-valuetext", `Asteroid mass ${format(state.massBillionKg, 0)} billion kilograms; impulse ${format(values.impulse / 1e9, 5)} gig newton seconds`);
    root.querySelector("#p1012-deltav")?.setAttribute("aria-valuetext", `Transverse delta v ${format(values.deltaV * 100, 4)} centimetres per second; ${riskLabel(values.risk)}`);
    root.querySelector("#p1012-impulse")?.setAttribute("aria-valuetext", `Transverse impulse ${format(values.impulse / 1e9, 5)} gig newton seconds; delta v ${format(values.deltaV * 100, 4)} centimetres per second`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p1012-reset") { state = initialState(); renderAndFocus(renderApp, "#p1012-warning"); return; }
      if (action === "p1012-stage") { state.stage = clamp(Number(control.dataset.p1012Stage), 0, 2); renderAndFocus(renderApp, `[data-p1012-stage="${state.stage}"]`); return; }
      if (action === "p1012-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p1012-stage="${state.stage}"]`); return; }
      if (action === "p1012-mode") { const current = deflectionData(); state.deltaVMs = current.deltaV; state.impulseNs = current.impulse; state.actionMode = control.dataset.p1012Mode; renderAndFocus(renderApp, state.actionMode === "deltav" ? "#p1012-deltav" : "#p1012-impulse"); return; }
      if (action === "p1012-preset") {
        const preset = control.dataset.p1012Preset;
        if (preset === "challenge") restoreChallenge();
        if (preset === "threshold") { restoreChallenge(); state.deltaVMs = challengeValues.requiredDeltaV; }
        if (preset === "early") { restoreChallenge(); state.warningYears = 40; state.deltaVMs = .006; }
        if (preset === "late") { restoreChallenge(); state.warningYears = 1; state.deltaVMs = .1; }
        renderAndFocus(renderApp, "#p1012-warning"); return;
      }
      if (action === "p1012-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p1012-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p1012-reveal") window.requestAnimationFrame(() => document.querySelector("#p1012-solution-heading")?.focus());
    }));
    [["#p1012-warning", "warningYears", .5, 50], ["#p1012-speed", "speedKmS", 5, 40], ["#p1012-mass", "massBillionKg", 1, 500]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    document.querySelector("#p1012-deltav")?.addEventListener("input", (event) => { state.deltaVMs = clamp(Number(event.target.value), 0, Number(event.target.max)); updateDynamicDom(); });
    document.querySelector("#p1012-impulse")?.addEventListener("input", (event) => { state.impulseNs = clamp(Number(event.target.value), 0, Number(event.target.max)); updateDynamicDom(); });
    const input = document.querySelector("#p1012-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p1012-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = challengeValues.requiredImpulse / 1e9; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one transverse impulse in gig newton seconds.";
      else if (Math.abs(answer - challengeValues.requiredDeltaV * 100) < .01) state.feedback = "That is the numerical Δv in cm/s, but the answer asks for impulse. Multiply Δv in m/s by asteroid mass.";
      else if (Math.abs(answer - challengeValues.requiredImpulse) < 2e6) state.feedback = "That numerical value is in N·s. Divide by 10⁹ to express it in GN·s.";
      else if (Math.abs(answer - target) > .001) state.feedback = "First find Δv=(R⊕+1000 km)/t, then use J=mΔv and convert N·s to GN·s.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.feedback = `Correct: Δv=${format(challengeValues.requiredDeltaV * 100, 6)} cm/s and J=${format(target, 9)} GN·s. Impulse is momentum change, not energy.`; }
      renderAndFocus(renderApp, "#p1012-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
