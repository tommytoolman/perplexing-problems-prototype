(function registerWeightlessInSpacePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.3";
  const EARTH_RADIUS_METRES = 6.371e6;
  const EARTH_MU = 3.986004418e14;
  const CHALLENGE = Object.freeze({ altitudeKm: 400, massKg: 70, mode: "free", speedRatio: 1 });
  const stages = Object.freeze([
    Object.freeze({ short: "Gravity", title: "Gravity is still acting", copy: "At orbital radius r, the inward gravitational acceleration is g=μ/r². Height weakens gravity; it does not switch gravity off." }),
    Object.freeze({ short: "Motion", title: "Ask what keeps the radius fixed", copy: "A circular path at speed v needs inward acceleration ac=v²/r. A natural circular orbit has ac=g." }),
    Object.freeze({ short: "Scale", title: "Apparent weight is a contact force", copy: "A scale reads the magnitude of the support force N. In free fall, astronaut, scale and spacecraft accelerate together, so N=0." }),
  ]);
  const hints = Object.freeze([
    "At 400 km altitude, r=6.771×10⁶ m and g=μ/r²≈8.694 m/s². Gravity is far from zero.",
    "For the circular-orbit speed v=√(μ/r), the required centripetal acceleration v²/r equals g.",
    "Take inward as positive. The radial force balance is mg+Ninward=mac.",
    "In an unpowered orbit, gravity alone supplies mac, so Ninward=0. A scale reads |N|, not mg.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p103-reset">Reset</button>';

  const initialState = () => ({
    altitudeKm: CHALLENGE.altitudeKm,
    massKg: CHALLENGE.massKg,
    mode: CHALLENGE.mode,
    speedRatio: CHALLENGE.speedRatio,
    stage: 0,
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
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function escapeAttribute(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20);
  }

  function orbitData(
    altitudeKm = state.altitudeKm,
    massKg = state.massKg,
    mode = state.mode,
    speedRatio = state.speedRatio,
  ) {
    const radius = EARTH_RADIUS_METRES + altitudeKm * 1000;
    const gravity = EARTH_MU / radius ** 2;
    const gravitationalForce = massKg * gravity;
    const circularSpeed = Math.sqrt(EARTH_MU / radius);
    const activeSpeedRatio = mode === "held" ? 0 : speedRatio;
    const speed = activeSpeedRatio * circularSpeed;
    const centripetalRequirement = speed ** 2 / radius;
    let actualInwardAcceleration;
    let supportForceInward;
    let radialCoordinateAcceleration;

    if (mode === "free") {
      actualInwardAcceleration = gravity;
      supportForceInward = 0;
      radialCoordinateAcceleration = centripetalRequirement - gravity;
    } else if (mode === "held") {
      actualInwardAcceleration = 0;
      supportForceInward = -gravitationalForce;
      radialCoordinateAcceleration = 0;
    } else {
      actualInwardAcceleration = centripetalRequirement;
      supportForceInward = massKg * (centripetalRequirement - gravity);
      radialCoordinateAcceleration = 0;
    }

    const apparentWeight = Math.abs(supportForceInward);
    const forceResidual = gravitationalForce + supportForceInward - massKg * actualInwardAcceleration;
    const circularPeriod = 2 * Math.PI * Math.sqrt(radius ** 3 / EARTH_MU);
    const escapeSpeed = Math.sqrt(2 * EARTH_MU / radius);
    return {
      radius,
      gravity,
      gravitationalForce,
      circularSpeed,
      activeSpeedRatio,
      speed,
      centripetalRequirement,
      actualInwardAcceleration,
      supportForceInward,
      apparentWeight,
      radialCoordinateAcceleration,
      forceResidual,
      circularPeriod,
      escapeSpeed,
      weightless: apparentWeight < 1e-8,
    };
  }

  const challengeValues = orbitData(CHALLENGE.altitudeKm, CHALLENGE.massKg, CHALLENGE.mode, CHALLENGE.speedRatio);

  function modeLabel(mode = state.mode) {
    if (mode === "free") return "Unpowered free fall";
    if (mode === "held") return "Held stationary";
    return "Constrained circular path";
  }

  function motionNote(values) {
    if (state.mode === "held") return "A support cancels gravity, so the astronaut remains at rest relative to Earth.";
    if (state.mode === "circle") {
      if (Math.abs(values.activeSpeedRatio - 1) < 1e-9) return "This is the natural circular-orbit speed; the constraint is unloaded.";
      return values.supportForceInward > 0 ? "The constraint must act inward to bend the faster path." : "The support must act outward to prevent the slower path falling inward.";
    }
    if (Math.abs(values.activeSpeedRatio - 1) < 1e-9) return "Gravity supplies exactly the acceleration needed for a circular orbit.";
    if (values.radialCoordinateAcceleration < 0) return "Still weightless, but this speed is too low to keep r fixed: the free path initially moves inward.";
    return values.speed >= values.escapeSpeed ? "Still weightless; this free trajectory has reached escape speed." : "Still weightless, but this speed is too high for a circle here: the free path initially moves outward.";
  }

  function supportDirection(values) {
    if (values.weightless) return "none";
    return values.supportForceInward > 0 ? "inward" : "outward";
  }

  function reconstructionNote() {
    return `<p class="p103-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This orbit-and-scale investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p103-stage-controls" role="group" aria-label="Apparent-weight reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p103-stage" data-p103-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p103-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p103-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Scale explained" : "Next stage"}</button></div>`;
  }

  function orbitSvg() {
    const values = orbitData();
    const motionVisible = state.stage >= 1 || state.revealed;
    const scaleVisible = state.stage >= 2 || state.revealed;
    const earthX = 196;
    const earthY = 254;
    const earthRadius = 104;
    const travellerX = earthX;
    const travellerY = 70;
    const gravityLength = 18 + 54 * values.gravity / (EARTH_MU / EARTH_RADIUS_METRES ** 2);
    const motionLength = Math.min(92, values.activeSpeedRatio > 0 ? 36 + 35 * values.activeSpeedRatio : 0);
    const centripetalLength = Math.min(83, values.centripetalRequirement > 0 ? 18 + 52 * values.centripetalRequirement / (EARTH_MU / EARTH_RADIUS_METRES ** 2) : 0);
    const supportLength = values.weightless ? 0 : Math.min(88, 18 + 58 * values.apparentWeight / (state.massKg * EARTH_MU / EARTH_RADIUS_METRES ** 2));
    const supportEndY = travellerY + 20 + (values.supportForceInward > 0 ? supportLength : -supportLength);
    const statusValue = state.stage === 0 ? `g = ${format(values.gravity, 4)} m/s²` : state.stage === 1 ? `v²/r = ${format(values.centripetalRequirement, 4)} m/s²` : values.weightless ? "SCALE: 0 N · WEIGHTLESS" : `SCALE: ${format(values.apparentWeight, 2)} N`;
    return `<svg class="p103-svg p103-stage-${state.stage} is-${state.mode}" viewBox="0 0 720 445" role="img" aria-labelledby="p103-svg-title p103-svg-desc">
      <title id="p103-svg-title">Astronaut, orbit, gravity and apparent weight</title>
      <desc id="p103-svg-desc">A ${format(state.massKg, 0)} kilogram astronaut is ${format(state.altitudeKm, 0)} kilometres above Earth in the state ${modeLabel().toLowerCase()}. Gravity is ${format(values.gravity, 4)} metres per second squared.${motionVisible ? ` The fixed-radius centripetal requirement is ${format(values.centripetalRequirement, 4)} metres per second squared.` : ""}${scaleVisible ? ` The support-force magnitude read by a scale is ${format(values.apparentWeight, 3)} newtons.` : ""}</desc>
      <defs><radialGradient id="p103-earth" cx="38%" cy="32%"><stop offset="0" stop-color="#77c8d5"/><stop offset="1" stop-color="#236783"/></radialGradient><marker id="p103-gravity-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p103-motion-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p103-support-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs>
      <rect class="p103-board" x="1" y="1" width="718" height="443" rx="20"/>
      <circle class="p103-orbit" cx="${earthX}" cy="${earthY}" r="184"/>
      <line class="p103-radius-line" x1="${earthX}" y1="${travellerY}" x2="${earthX}" y2="${earthY}"/>
      <circle class="p103-earth" cx="${earthX}" cy="${earthY}" r="${earthRadius}"/>
      <path class="p103-land" d="M124 210q35-40 75-25t60-8q35 29 36 69-28 8-51-4t-38 4q-29 20-82-2Z"/>
      <text class="p103-earth-label" x="${earthX}" y="${earthY + 8}" text-anchor="middle">EARTH</text>
      <text class="p103-radius-label" x="${earthX + 11}" y="${earthY - 44}">r = ${format(values.radius / 1e6, 3)}×10⁶ m</text>
      <g class="p103-traveller" aria-hidden="true" transform="translate(${travellerX} ${travellerY})"><circle r="13"/><path d="M-7-17Q0-27 7-17M-7 15L-11 27M7 15L11 27M-11-2L-22 8M11-2L22 8"/><text y="42" text-anchor="middle">${modeLabel()}</text></g>
      <g class="p103-gravity-vector" aria-hidden="true"><line x1="${travellerX - 25}" y1="${travellerY + 18}" x2="${travellerX - 25}" y2="${format(travellerY + 18 + gravityLength, 2)}" marker-end="url(#p103-gravity-arrow)"/><text x="${travellerX - 34}" y="${format(travellerY + 30 + gravityLength / 2, 2)}" text-anchor="end">gravity mg</text></g>
      ${motionLength > 0 ? `<g class="p103-velocity-vector" aria-hidden="true"><line x1="${travellerX + 18}" y1="${travellerY - 11}" x2="${format(travellerX + 18 + motionLength, 2)}" y2="${travellerY - 11}" marker-end="url(#p103-motion-arrow)"/><text x="${format(travellerX + 18 + motionLength / 2, 2)}" y="${travellerY - 21}" text-anchor="middle">v = ${format(values.speed / 1000, 3)} km/s</text></g>` : ""}
      ${centripetalLength > 0 ? `<g class="p103-centripetal-vector" aria-hidden="true"><line x1="${travellerX + 42}" y1="${travellerY + 18}" x2="${travellerX + 42}" y2="${format(travellerY + 18 + centripetalLength, 2)}" marker-end="url(#p103-motion-arrow)"/><text x="${travellerX + 51}" y="${format(travellerY + 30 + centripetalLength / 2, 2)}">needed for fixed r</text></g>` : ""}
      ${supportLength > 0 ? `<g class="p103-support-vector" aria-hidden="true"><line x1="${travellerX + 25}" y1="${travellerY + 20}" x2="${travellerX + 25}" y2="${format(supportEndY, 2)}" marker-end="url(#p103-support-arrow)"/><text x="${travellerX + 37}" y="${format((travellerY + 20 + supportEndY) / 2 + 3, 2)}">support ${supportDirection(values)}</text></g>` : `<g class="p103-zero-support" aria-hidden="true"><circle cx="${travellerX + 25}" cy="${travellerY + 18}" r="10"/><text x="${travellerX + 42}" y="${travellerY + 22}">N = 0</text></g>`}
      <g class="p103-status" aria-hidden="true" transform="translate(414 27)"><rect width="278" height="84" rx="14"/><text class="p103-status-kicker" x="17" y="23">${modeLabel().toUpperCase()}</text><text class="p103-status-value" x="17" y="50">${statusValue}</text><text class="p103-status-note" x="17" y="70">gravity force = ${format(values.gravitationalForce, 2)} N</text></g>
      <g class="p103-balance" aria-hidden="true" transform="translate(414 132)"><rect width="278" height="142" rx="14"/><text class="p103-panel-kicker" x="17" y="25">INWARD FORCE BALANCE</text><text class="p103-panel-equation" x="17" y="52">mg + Nᵢₙ = ma</text><text class="p103-panel-row" x="17" y="80">g</text><text class="p103-panel-number" x="261" y="80" text-anchor="end">${format(values.gravity, 4)} m/s²</text><text class="p103-panel-row" x="17" y="102">fixed-radius v²/r</text><text class="p103-panel-number" x="261" y="102" text-anchor="end">${format(values.centripetalRequirement, 4)} m/s²</text><text class="p103-panel-row" x="17" y="124">support Nᵢₙ</text><text class="p103-panel-number" x="261" y="124" text-anchor="end">${values.supportForceInward >= 0 ? "+" : "−"}${format(Math.abs(values.supportForceInward), 3)} N</text></g>
      <g class="p103-scale" aria-hidden="true" transform="translate(414 294)"><rect width="278" height="122" rx="14"/><text class="p103-panel-kicker" x="17" y="25">WHAT THE SCALE REPORTS</text><text class="p103-scale-value" x="139" y="70" text-anchor="middle">${format(values.apparentWeight, 2)} N</text><text class="p103-scale-note" x="139" y="96" text-anchor="middle">|support force| = apparent weight</text></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = orbitData();
    const motionVisible = state.stage >= 1 || state.revealed;
    const scaleVisible = state.stage >= 2 || state.revealed;
    return `<section class="p103-metrics" aria-live="polite"><div><span>Gravity g</span><strong>${format(values.gravity, 4)} m/s²</strong></div><div><span>Gravity force mg</span><strong>${format(values.gravitationalForce, 2)} N</strong></div><div><span>Fixed-radius requirement v²/r</span><strong>${motionVisible ? `${format(values.centripetalRequirement, 4)} m/s²` : "stage 2"}</strong></div><div><span>Scale / apparent weight</span><strong>${scaleVisible ? `${format(values.apparentWeight, 3)} N` : "stage 3"}</strong></div>${motionVisible ? `<p>${scaleVisible ? `<strong>${values.weightless ? "Weightless" : "Supported"}:</strong> ` : ""}${motionNote(values)}${scaleVisible ? ` Force-balance residual = ${values.forceResidual.toExponential(1)} N.` : ""}</p>` : ""}</section>`;
  }

  function dynamicMarkup() {
    return `<div class="p103-dynamic">${orbitSvg()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    const values = orbitData();
    return `<section class="p103-controls" aria-label="Orbit and support controls"><div class="p103-mode-picker" role="group" aria-label="Motion and support state"><button class="chip-button ${state.mode === "free" ? "active" : ""}" type="button" data-problem-action="p103-mode" data-p103-mode="free" aria-pressed="${state.mode === "free"}">Free fall</button><button class="chip-button ${state.mode === "held" ? "active" : ""}" type="button" data-problem-action="p103-mode" data-p103-mode="held" aria-pressed="${state.mode === "held"}">Held stationary</button><button class="chip-button ${state.mode === "circle" ? "active" : ""}" type="button" data-problem-action="p103-mode" data-p103-mode="circle" aria-pressed="${state.mode === "circle"}">Constrained circle</button></div><div class="p103-control-grid"><label for="p103-altitude"><span>Altitude above Earth<output data-p103-output="altitude">${format(state.altitudeKm, 0)} km · r=${format(values.radius / 1e6, 3)}×10⁶ m</output></span><input id="p103-altitude" type="range" min="0" max="40000" step="100" value="${state.altitudeKm}"/></label><label for="p103-mass"><span>Astronaut mass<output data-p103-output="mass">${format(state.massKg, 0)} kg</output></span><input id="p103-mass" type="range" min="40" max="120" step="1" value="${state.massKg}"/></label><label class="p103-speed-control" for="p103-speed"><span>Speed relative to circular speed<output data-p103-output="speed">${format(values.activeSpeedRatio, 2)}vc · ${format(values.speed / 1000, 3)} km/s</output></span><input id="p103-speed" type="range" min="0" max="1.6" step="0.001" value="${state.mode === "held" ? 0 : state.speedRatio}" ${state.mode === "held" ? "disabled" : ""}/></label></div><p>In free fall, changing speed changes the trajectory but not the zero scale reading. In a constrained circle, contact supplies any difference between gravity and v²/r.</p><div class="p103-presets" role="group" aria-label="Orbit examples"><button class="chip-button" type="button" data-problem-action="p103-preset" data-p103-preset="challenge">400 km orbit</button><button class="chip-button" type="button" data-problem-action="p103-preset" data-p103-preset="standing">Standing on Earth</button><button class="chip-button" type="button" data-problem-action="p103-preset" data-p103-preset="slow">Slow constrained path</button><button class="chip-button" type="button" data-problem-action="p103-preset" data-p103-preset="escape">Free escape speed</button></div></section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    return state.hintsUsed ? `<div class="hint-stack p103-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : "";
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p103-solution" aria-labelledby="p103-solution-heading"><h3 id="p103-solution-heading" tabindex="-1">Weightless does not mean gravity-free</h3><p>The astronaut’s distance from Earth’s centre is r=(6371+400) km=6.771×10⁶ m. Therefore</p><div class="p103-equation">g=μ/r²=(3.986004418×10¹⁴)/(6.771×10⁶)²<br>g=${format(challengeValues.gravity, 6)} m/s²</div><p>A ${CHALLENGE.massKg} kg astronaut consequently feels a real gravitational force mg=${format(challengeValues.gravitationalForce, 3)} N. The circular speed is ${format(challengeValues.circularSpeed / 1000, 6)} km/s, for which</p><div class="p103-equation">ac=v²/r=μ/r²=g</div><p>Taking inward as positive, mg+Ninward=mac. Since gravity supplies the entire circular acceleration, Ninward=0 and the scale reads</p><div class="p103-equation">apparent weight = |Ninward| = 0 N</div><p>The astronaut, scale and spacecraft all accelerate inward together; none must push on another.</p><p class="p103-checks"><strong>Checks and limits.</strong> A held stationary astronaut has a=0, so support is outward with magnitude mg and the scale reads mg. In a constrained circular path, Ninward=m(v²/r−g); at v=vc it vanishes. In free fall N remains zero even when v≠vc, although r then changes rather than remaining circular. As r→∞, g→0; at finite r it is non-zero. Both g and v²/r have units m/s², while m times their difference has units newtons. Earth is treated as spherical and non-rotating; atmosphere, tides and spacecraft thrust are omitted.</p></section>`;
  }

  function snapshot() {
    const values = orbitData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", earthRadiusMetres: EARTH_RADIUS_METRES, earthStandardGravitationalParameter: EARTH_MU, altitudeKilometres: state.altitudeKm, orbitalRadiusMetres: values.radius, astronautMassKilograms: state.massKg, motionState: state.mode, speedAsFractionOfCircular: values.activeSpeedRatio, speedMetresPerSecond: Number(values.speed.toFixed(8)), circularSpeedMetresPerSecond: Number(values.circularSpeed.toFixed(8)), gravityMetresPerSecondSquared: Number(values.gravity.toFixed(10)), gravitationalForceNewtons: Number(values.gravitationalForce.toFixed(8)), fixedRadiusCentripetalRequirementMetresPerSecondSquared: Number(values.centripetalRequirement.toFixed(10)), actualInwardAccelerationMetresPerSecondSquared: Number(values.actualInwardAcceleration.toFixed(10)), signedInwardSupportForceNewtons: Number(values.supportForceInward.toFixed(8)), apparentWeightNewtons: Number(values.apparentWeight.toFixed(8)), instantaneousRadialCoordinateAccelerationMetresPerSecondSquared: Number(values.radialCoordinateAcceleration.toFixed(10)), forceBalanceResidualNewtons: values.forceResidual, circularPeriodMinutes: Number((values.circularPeriod / 60).toFixed(8)), weightless: values.weightless, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() {
    state.altitudeKm = CHALLENGE.altitudeKm;
    state.massKg = CHALLENGE.massKg;
    state.mode = CHALLENGE.mode;
    state.speedRatio = CHALLENGE.speedRatio;
  }

  function render() {
    return `<main class="book-shell p103-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive gravitation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p103-spread"><article class="book-page p103-problem-page"><div class="problem-number">Problem 10.3</div><h1 class="book-title p103-title">Weightless in space</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">A 70 kg astronaut and an unpowered spacecraft follow a circular orbit 400 km above a spherical Earth. A scale is placed beneath the astronaut’s boots.</p><p class="problem-copy">Gravity is still acting. <strong>What force does the scale read?</strong></p><section class="p103-definition-card"><strong>Operational definition</strong><p>“Apparent weight” means the magnitude of the contact or support force measured by a scale. It is not automatically equal to the gravitational force mg.</p></section><section class="p103-model-card"><div class="eyebrow">Ideal model</div><p>Newtonian gravity with Earth parameter μ=3.986004418×10¹⁴ m³/s² and radius 6371 km. The astronaut and spacecraft are treated as test bodies.</p></section></article><section class="book-page book-stage p103-stage">${stageControls()}<div class="p103-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p103-coach"><div class="coach-kicker">Read the scale, not gravity</div><p class="coach-question">For the stated 400 km circular free-fall orbit, enter the exact scale reading.</p><form class="p103-answer-form" data-p103-answer-form novalidate><label for="p103-answer">Apparent weight / scale reading</label><div><input id="p103-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="exact force" autocomplete="off"/><span>N</span></div><button class="primary-button" type="submit">Check scale reading</button></form>${feedbackMarkup()}<div class="button-row p103-help-row"><button class="secondary-button" type="button" data-problem-action="p103-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p103-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p103-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p103-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p103-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = orbitData();
    const outputs = { altitude: `${format(state.altitudeKm, 0)} km · r=${format(values.radius / 1e6, 3)}×10⁶ m`, mass: `${format(state.massKg, 0)} kg`, speed: `${format(values.activeSpeedRatio, 2)}vc · ${format(values.speed / 1000, 3)} km/s` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p103-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p103-altitude")?.setAttribute("aria-valuetext", `Altitude ${format(state.altitudeKm, 0)} kilometres; gravity ${format(values.gravity, 4)} metres per second squared`);
    root.querySelector("#p103-mass")?.setAttribute("aria-valuetext", `Astronaut mass ${format(state.massKg, 0)} kilograms; gravitational force ${format(values.gravitationalForce, 2)} newtons`);
    root.querySelector("#p103-speed")?.setAttribute("aria-valuetext", `Speed ${format(values.activeSpeedRatio, 2)} times circular speed; ${format(values.speed / 1000, 3)} kilometres per second; scale reading ${format(values.apparentWeight, 2)} newtons`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p103-reset") {
        state = initialState();
        renderAndFocus(renderApp, "#p103-altitude");
        return;
      }
      if (action === "p103-stage") {
        state.stage = clamp(Number(control.dataset.p103Stage), 0, 2);
        renderAndFocus(renderApp, `[data-p103-stage="${state.stage}"]`);
        return;
      }
      if (action === "p103-next-stage") {
        state.stage = Math.min(2, state.stage + 1);
        renderAndFocus(renderApp, `[data-p103-stage="${state.stage}"]`);
        return;
      }
      if (action === "p103-mode") {
        state.mode = control.dataset.p103Mode;
        renderAndFocus(renderApp, `[data-p103-mode="${state.mode}"]`);
        return;
      }
      if (action === "p103-preset") {
        const preset = control.dataset.p103Preset;
        if (preset === "challenge") restoreChallenge();
        if (preset === "standing") { state.altitudeKm = 0; state.mode = "held"; state.speedRatio = 0; }
        if (preset === "slow") { state.altitudeKm = 400; state.mode = "circle"; state.speedRatio = 0.65; }
        if (preset === "escape") { state.altitudeKm = 400; state.mode = "free"; state.speedRatio = Math.SQRT2; }
        renderAndFocus(renderApp, "#p103-altitude");
        return;
      }
      if (action === "p103-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p103-reveal") { state.revealed = true; state.stage = 2; }
      renderApp();
      if (action === "p103-reveal") window.requestAnimationFrame(() => document.querySelector("#p103-solution-heading")?.focus());
    }));

    [["#p103-altitude", "altitudeKm", 0, 40000], ["#p103-mass", "massKg", 40, 120], ["#p103-speed", "speedRatio", 0, 1.6]].forEach(([selector, key, minimum, maximum]) => {
      document.querySelector(selector)?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), minimum, maximum);
        updateDynamicDom();
      });
    });

    const input = document.querySelector("#p103-answer");
    input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p103-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = sanitizeNumber(input?.value).trim();
      const answer = Number(state.answer);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one force in newtons. Zero is a valid numerical answer.";
      else if (Math.abs(answer - challengeValues.gravitationalForce) < 1) state.feedback = `That is approximately mg, the ${format(challengeValues.gravitationalForce, 1)} N gravitational force. A scale reads the support force instead.`;
      else if (Math.abs(answer) > 0.01) state.feedback = "Use inward force balance: mg+N=mac. For a natural circular orbit, ac=g.";
      else {
        state.feedbackTone = "success";
        state.committed = true;
        state.stage = 2;
        state.feedback = `Correct: the scale reads exactly 0 N even though gravity is ${format(challengeValues.gravity, 4)} m/s² and mg is ${format(challengeValues.gravitationalForce, 2)} N.`;
      }
      renderAndFocus(renderApp, "#p103-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
