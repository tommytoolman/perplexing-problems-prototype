(function registerCurrentLoopPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "19.2";
  const CURRENT_AMPERES = 2;
  const LOOP_AREA_SQUARE_METRES = 0.030;
  const FIELD_TESLA = 0.40;
  const MAGNETIC_MOMENT = CURRENT_AMPERES * LOOP_AREA_SQUARE_METRES;
  const MAXIMUM_TORQUE = MAGNETIC_MOMENT * FIELD_TESLA;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Moment", title: "Attach a magnetic-moment vector to the loop", copy: "For one turn, μ=IA. Its direction is the loop normal given by the right-hand rule, so reversing current reverses μ without moving the loop." }),
    Object.freeze({ short: "Torque", title: "Read the cross product and its direction", copy: "τ=μ×B. Its magnitude is μB|sinθ|; its signed direction rotates μ toward B by the shorter route." }),
    Object.freeze({ short: "Energy", title: "Find the stable alignment on the energy curve", copy: "U=−μ·B=−μBcosθ. Parallel vectors minimise energy and are stable; antiparallel vectors maximise energy and are unstable." }),
  ]);
  const hints = Object.freeze([
    "First find the loop’s magnetic moment. For one turn, μ=IA.",
    "The torque magnitude is |τ|=μB|sinθ|.",
    "The sine factor has maximum magnitude 1 when μ is perpendicular to B.",
    "Use μ=(2 A)(0.030 m²)=0.060 A·m², then μB=(0.060)(0.40).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p192-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function normalize360(degrees) { const normalized = Number(degrees) % 360; return normalized < 0 ? normalized + 360 : normalized; }
  function normalizeSigned(degrees) { const normalized = normalize360(Number(degrees) + 180) - 180; return normalized === -180 ? 180 : normalized; }
  function radians(degrees) { return degrees * Math.PI / 180; }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function configuration(normalAngleDegrees, currentDirection = 1, fieldDirection = 1) {
    const normalAngle = normalize360(normalAngleDegrees), currentSign = currentDirection < 0 ? -1 : 1, fieldSign = fieldDirection < 0 ? -1 : 1;
    const magneticMomentAngleDegrees = normalize360(normalAngle + (currentSign < 0 ? 180 : 0));
    const fieldAngleDegrees = fieldSign < 0 ? 180 : 0;
    const relativeAngleDegrees = normalizeSigned(magneticMomentAngleDegrees - fieldAngleDegrees), relativeAngleRadians = radians(relativeAngleDegrees);
    const magneticMomentVector = { x: MAGNETIC_MOMENT * Math.cos(radians(magneticMomentAngleDegrees)), y: MAGNETIC_MOMENT * Math.sin(radians(magneticMomentAngleDegrees)) };
    const fieldVector = { x: FIELD_TESLA * fieldSign, y: 0 };
    const torqueZNewtonMetres = magneticMomentVector.x * fieldVector.y - magneticMomentVector.y * fieldVector.x;
    const energyJoules = -(magneticMomentVector.x * fieldVector.x + magneticMomentVector.y * fieldVector.y);
    const zeroTorque = Math.abs(torqueZNewtonMetres) < 1e-12;
    const alignment = Math.abs(relativeAngleDegrees) < 1e-9 ? "stable parallel alignment" : Math.abs(Math.abs(relativeAngleDegrees) - 180) < 1e-9 ? "unstable antiparallel alignment" : torqueZNewtonMetres > 0 ? "counter-clockwise toward stable alignment" : "clockwise toward stable alignment";
    return { normalAngleDegrees: normalAngle, currentDirection: currentSign, fieldDirection: fieldSign, magneticMomentAngleDegrees, fieldAngleDegrees, relativeAngleDegrees, magneticMomentVector, fieldVector, torqueZNewtonMetres: zeroTorque ? 0 : torqueZNewtonMetres, torqueMagnitudeNewtonMetres: zeroTorque ? 0 : Math.abs(torqueZNewtonMetres), torqueDirection: zeroTorque ? "zero" : torqueZNewtonMetres > 0 ? "counter-clockwise" : "clockwise", energyJoules: Math.abs(energyJoules) < 1e-12 ? 0 : energyJoules, alignment };
  }

  function parseTorque(raw) { const match = String(raw).trim().replaceAll(",", ".").match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/); return match ? Number(match[0]) : NaN; }
  function initialState() { return { normalAngleDegrees: 90, currentDirection: 1, fieldDirection: 1, boardMessage: "At θ=+90°, μ×B points into the page: the loop turns clockwise with maximum torque magnitude 0.024 N·m.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function currentConfiguration() { return configuration(state.normalAngleDegrees, state.currentDirection, state.fieldDirection); }
  function setNormalAngle(value) { state.normalAngleDegrees = normalize360(value); const data = currentConfiguration(); state.boardMessage = `Physical loop normal ${format(state.normalAngleDegrees, 0)}°. The moment is ${format(data.relativeAngleDegrees, 0)}° from B; torque is ${format(data.torqueMagnitudeNewtonMetres, 4)} N·m ${data.torqueDirection}.`; }
  function setCurrentDirection(direction) { state.currentDirection = direction < 0 ? -1 : 1; const data = currentConfiguration(); state.boardMessage = `Current ${state.currentDirection > 0 ? "forward" : "reversed"}: μ ${state.currentDirection > 0 ? "follows" : "opposes"} the displayed loop normal. Torque is ${data.torqueDirection}.`; }
  function setFieldDirection(direction) { state.fieldDirection = direction < 0 ? -1 : 1; const data = currentConfiguration(); state.boardMessage = `Field reversed to point ${state.fieldDirection > 0 ? "right" : "left"}. The new relative angle is ${format(data.relativeAngleDegrees, 0)}° and torque is ${data.torqueDirection}.`; }
  function setRelativeAngle(relativeAngleDegrees) { const fieldAngle = state.fieldDirection < 0 ? 180 : 0, currentFlip = state.currentDirection < 0 ? 180 : 0; state.normalAngleDegrees = normalize360(fieldAngle + relativeAngleDegrees - currentFlip); const data = currentConfiguration(); state.boardMessage = `${data.alignment}; θ=${format(data.relativeAngleDegrees, 0)}°, |τ|=${format(data.torqueMagnitudeNewtonMetres, 4)} N·m and U=${format(data.energyJoules, 4)} J.`; }
  function restoreChallenge() { state.normalAngleDegrees = 90; state.currentDirection = 1; state.fieldDirection = 1; state.boardMessage = "Challenge restored at θ=90°: the torque magnitude is at its 0.024 N·m maximum."; }

  function stageControls() {
    return `<div class="p192-stage-controls" role="group" aria-label="Current-loop reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p192-stage" data-p192-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p192-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p192-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Energy landscape exposed" : "Next stage"}</button></div>`;
  }

  function pointAt(cx, cy, radius, angleDegrees) { return { x: cx + radius * Math.cos(radians(angleDegrees)), y: cy - radius * Math.sin(radians(angleDegrees)) }; }
  function angleArcPath(cx, cy, radius, startDegrees, signedSweepDegrees) { if (Math.abs(signedSweepDegrees) < .5) return ""; const start = pointAt(cx, cy, radius, startDegrees), end = pointAt(cx, cy, radius, startDegrees + signedSweepDegrees), large = Math.abs(signedSweepDegrees) > 180 ? 1 : 0, sweep = signedSweepDegrees > 0 ? 0 : 1; return `M${format(start.x, 3)} ${format(start.y, 3)}A${radius} ${radius} 0 ${large} ${sweep} ${format(end.x, 3)} ${format(end.y, 3)}`; }
  function energyCurvePath() { return Array.from({ length: 181 }, (_, index) => { const theta = -180 + index * 2, energy = -MAXIMUM_TORQUE * Math.cos(radians(theta)), x = 50 + 660 * index / 180, y = 350 - 42 * energy / MAXIMUM_TORQUE; return `${index ? "L" : "M"}${format(x, 3)} ${format(y, 3)}`; }).join(""); }

  function magnetSvg() {
    const data = currentConfiguration(), cx = 250, cy = 150, normalEnd = pointAt(cx, cy, 78, data.normalAngleDegrees), momentEnd = pointAt(cx, cy, 103, data.magneticMomentAngleDegrees), angleMid = pointAt(cx, cy, 62, data.fieldAngleDegrees + data.relativeAngleDegrees / 2), loopRotation = 90 - data.normalAngleDegrees;
    const fieldStart = state.fieldDirection > 0 ? 66 : 442, fieldEnd = state.fieldDirection > 0 ? 442 : 66, currentArc = state.currentDirection > 0 ? "M-55 0A55 22 0 0 1 0 -22" : "M0 -22A55 22 0 0 0 -55 0";
    const torqueArc = data.torqueZNewtonMetres < 0 ? angleArcPath(cx, cy, 111, 90, -78) : data.torqueZNewtonMetres > 0 ? angleArcPath(cx, cy, 111, 0, 78) : "";
    const selectedX = 50 + 660 * (data.relativeAngleDegrees + 180) / 360, selectedY = 350 - 42 * data.energyJoules / MAXIMUM_TORQUE, selectedLabelY = selectedY < 325 ? selectedY + 20 : selectedY - 13;
    return `<svg class="p192-magnet p192-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p192-svg-title p192-svg-desc"><title id="p192-svg-title">Rotatable current loop in a uniform magnetic field</title><desc id="p192-svg-desc">The physical loop normal is ${format(data.normalAngleDegrees, 2)} degrees. Current is ${state.currentDirection > 0 ? "forward" : "reversed"}, so the magnetic moment points at ${format(data.magneticMomentAngleDegrees, 2)} degrees. The magnetic field points ${state.fieldDirection > 0 ? "right" : "left"}. The signed angle from field to moment is ${format(data.relativeAngleDegrees, 2)} degrees. Torque is ${format(data.torqueMagnitudeNewtonMetres, 6)} newton metres ${data.torqueDirection}; potential energy is ${format(data.energyJoules, 6)} joules. ${data.alignment}.</desc><defs><marker id="p192-field-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker><marker id="p192-moment-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><marker id="p192-current-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><marker id="p192-torque-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs><rect class="p192-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p192-board-kicker" x="24" y="28">DRAG THE LOOP · μ=IA · τ=μ×B · U=−μ·B</text><g class="p192-field">${[72, 112, 188, 228].map((y) => `<line x1="${fieldStart}" y1="${y}" x2="${fieldEnd}" y2="${y}"/>`).join("")}<text x="70" y="52">UNIFORM B=${FIELD_TESLA.toFixed(2)} T · ${state.fieldDirection > 0 ? "RIGHT" : "LEFT"}</text></g><g class="p192-loop" transform="rotate(${format(loopRotation, 3)} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="70" ry="25"/><ellipse class="p192-loop-inner" cx="${cx}" cy="${cy}" rx="58" ry="16"/></g><g class="p192-current" transform="translate(${cx} ${cy}) rotate(${format(loopRotation, 3)})"><path d="${currentArc}" marker-end="url(#p192-current-arrow)"/><text x="-63" y="38">I=${CURRENT_AMPERES} A · ${state.currentDirection > 0 ? "FORWARD" : "REVERSED"}</text></g><line class="p192-normal" x1="${cx}" y1="${cy}" x2="${format(normalEnd.x, 3)}" y2="${format(normalEnd.y, 3)}"/><text class="p192-normal-label" x="${format(normalEnd.x, 3)}" y="${format(normalEnd.y - 8, 3)}" text-anchor="middle">loop normal n</text><line class="p192-moment" x1="${cx}" y1="${cy}" x2="${format(momentEnd.x, 3)}" y2="${format(momentEnd.y, 3)}" marker-end="url(#p192-moment-arrow)"/><text class="p192-moment-label" x="${format(momentEnd.x, 3)}" y="${format(momentEnd.y - 10, 3)}" text-anchor="middle">μ</text><path class="p192-angle" d="${angleArcPath(cx, cy, 55, data.fieldAngleDegrees, data.relativeAngleDegrees)}"/><text class="p192-angle-label" x="${format(angleMid.x, 3)}" y="${format(angleMid.y - 7, 3)}" text-anchor="middle">θ=${format(data.relativeAngleDegrees, 0)}°</text>${torqueArc ? `<path class="p192-torque" d="${torqueArc}" marker-end="url(#p192-torque-arrow)"/>` : ""}<text class="p192-torque-label" x="24" y="258">TORQUE: ${data.torqueDirection.toUpperCase()} · ${data.alignment.toUpperCase()}</text><g class="p192-ledger" transform="translate(490 49)"><rect class="p192-ledger-bg" width="244" height="209" rx="15"/><text class="p192-ledger-title" x="16" y="27">VECTOR AUDIT</text><text class="p192-ledger-label" x="16" y="62">moment μ=IA</text><text class="p192-ledger-value" x="226" y="62" text-anchor="end">${format(MAGNETIC_MOMENT, 3)} A·m²</text><text class="p192-ledger-label" x="16" y="88">signed θ</text><text class="p192-ledger-value" x="226" y="88" text-anchor="end">${format(data.relativeAngleDegrees, 1)}°</text><text class="p192-ledger-label" x="16" y="114">τz=−μBsinθ</text><text class="p192-ledger-value" x="226" y="114" text-anchor="end">${format(data.torqueZNewtonMetres, 4)} N·m</text><text class="p192-ledger-label" x="16" y="140">U=−μBcosθ</text><text class="p192-ledger-value" x="226" y="140" text-anchor="end">${format(data.energyJoules, 4)} J</text><rect class="p192-result-box" x="13" y="158" width="218" height="39" rx="9"/><text class="p192-result-label" x="25" y="176">|TORQUE|</text><text class="p192-result-value" x="220" y="188" text-anchor="end">${format(data.torqueMagnitudeNewtonMetres, 4)} N·m</text></g><g class="p192-energy-group"><text class="p192-energy-title" x="50" y="284">POTENTIAL ENERGY U=−μBcosθ · LOWEST POINT IS STABLE</text><line class="p192-energy-axis" x1="50" y1="350" x2="710" y2="350"/><path class="p192-energy-curve" d="${energyCurvePath()}"/><line class="p192-energy-guide" x1="${format(selectedX, 3)}" y1="${format(selectedY, 3)}" x2="${format(selectedX, 3)}" y2="403"/><circle class="p192-energy-point" cx="${format(selectedX, 3)}" cy="${format(selectedY, 3)}" r="7"/><text class="p192-energy-point-label" x="${format(clamp(selectedX, 92, 668), 3)}" y="${format(selectedLabelY, 3)}" text-anchor="middle">θ=${format(data.relativeAngleDegrees, 0)}° · U=${format(data.energyJoules, 3)} J</text><text class="p192-energy-tick" x="50" y="419" text-anchor="middle">−180° unstable</text><text class="p192-energy-tick is-stable" x="380" y="419" text-anchor="middle">0° stable</text><text class="p192-energy-tick" x="710" y="419" text-anchor="middle">+180° unstable</text></g></svg>`;
  }

  function loopControls() {
    const data = currentConfiguration();
    return `<section class="p192-controls" aria-label="Loop orientation and vector controls"><label for="p192-angle"><span>Physical loop-normal angle <output data-p192-output="angle">${format(state.normalAngleDegrees, 0)}°</output></span><input id="p192-angle" type="range" min="0" max="360" step="1" value="${state.normalAngleDegrees}" aria-valuetext="Loop normal ${format(state.normalAngleDegrees, 0)} degrees; moment is ${format(data.relativeAngleDegrees, 0)} degrees from field; torque ${format(data.torqueMagnitudeNewtonMetres, 4)} newton metres ${data.torqueDirection}"/></label><div class="p192-direction-controls"><div role="group" aria-label="Current direction"><button class="secondary-button ${state.currentDirection > 0 ? "active" : ""}" type="button" data-p192-current="1" aria-pressed="${state.currentDirection > 0}">Current forward</button><button class="secondary-button ${state.currentDirection < 0 ? "active" : ""}" type="button" data-p192-current="-1" aria-pressed="${state.currentDirection < 0}">Reverse current</button></div><div role="group" aria-label="Magnetic-field direction"><button class="secondary-button ${state.fieldDirection > 0 ? "active" : ""}" type="button" data-p192-field="1" aria-pressed="${state.fieldDirection > 0}">Field right</button><button class="secondary-button ${state.fieldDirection < 0 ? "active" : ""}" type="button" data-p192-field="-1" aria-pressed="${state.fieldDirection < 0}">Reverse field</button></div></div><div class="p192-presets" role="group" aria-label="Set moment relative to field"><button class="chip-button" type="button" data-p192-relative="0">Stable μ ∥ B</button><button class="chip-button" type="button" data-p192-relative="90">Max · clockwise</button><button class="chip-button" type="button" data-p192-relative="-90">Max · counter-clockwise</button><button class="chip-button" type="button" data-p192-relative="180">Unstable μ anti∥ B</button></div><p data-p192-control-message role="status">${state.boardMessage}</p></section>`;
  }

  function metricsMarkup() {
    const data = currentConfiguration();
    return `<section class="p192-metrics" aria-live="polite"><div><span>Relative angle θ</span><strong>${format(data.relativeAngleDegrees, 1)}°</strong></div><div><span>Torque |μ×B|</span><strong>${format(data.torqueMagnitudeNewtonMetres, 4)} N·m</strong></div><div><span>Energy −μ·B</span><strong>${format(data.energyJoules, 4)} J</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p192-dynamic"><div class="p192-magnet-wrap">${magnetSvg()}${loopControls()}</div>${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p192-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p192-solution" aria-labelledby="p192-solution-heading"><h3 id="p192-solution-heading" tabindex="-1">Perpendicular moment and field give maximum torque</h3><p>The one-turn loop’s magnetic moment is</p><div class="p192-equation">μ=IA=(2 A)(0.030 m²)=0.060 A·m².</div><p>The torque magnitude is</p><div class="p192-equation">|τ|=μB|sinθ|.</div><p>Its largest possible value occurs at θ=90° or 270°, where |sinθ|=1:</p><div class="p192-equation is-answer">τmax=μB<br>=(0.060 A·m²)(0.40 T)<br>=0.024 N·m.</div><p>The signed direction comes from μ×B. In the diagram’s convention, τz=−μBsinθ: positive θ gives clockwise torque and negative θ gives counter-clockwise torque. Either direction drives the moment toward a nearby parallel alignment.</p><p>The energy U=−μBcosθ confirms the equilibria: μ parallel to B has U=−0.024 J and is stable; μ antiparallel to B has U=+0.024 J and is unstable.</p></section>`;
  }

  function snapshot() {
    const data = currentConfiguration(), crossProduct = data.magneticMomentVector.x * data.fieldVector.y - data.magneticMomentVector.y * data.fieldVector.x, dotProductEnergy = -(data.magneticMomentVector.x * data.fieldVector.x + data.magneticMomentVector.y * data.fieldVector.y);
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "single-turn ideal current loop in a uniform magnetic field; diagram uses +x right, +y up and +z out of page", currentAmperes: CURRENT_AMPERES, loopAreaSquareMetres: LOOP_AREA_SQUARE_METRES, fieldMagnitudeTesla: FIELD_TESLA, magneticMomentMagnitudeAmpereSquareMetres: Number(MAGNETIC_MOMENT.toFixed(12)), maximumTorqueNewtonMetres: Number(MAXIMUM_TORQUE.toFixed(12)), physicalLoopNormalAngleDegrees: data.normalAngleDegrees, currentDirection: state.currentDirection > 0 ? "forward; μ follows loop normal" : "reversed; μ opposes loop normal", fieldDirection: state.fieldDirection > 0 ? "+x; right" : "−x; left", magneticMomentAngleDegrees: data.magneticMomentAngleDegrees, relativeAngleFromFieldToMomentDegrees: data.relativeAngleDegrees, magneticMomentVectorAmpereSquareMetres: { x: Number(data.magneticMomentVector.x.toFixed(12)), y: Number(data.magneticMomentVector.y.toFixed(12)) }, fieldVectorTesla: { x: Number(data.fieldVector.x.toFixed(12)), y: 0 }, signedTorqueZNewtonMetres: Number(data.torqueZNewtonMetres.toFixed(12)), torqueMagnitudeNewtonMetres: Number(data.torqueMagnitudeNewtonMetres.toFixed(12)), torqueDirection: data.torqueDirection, potentialEnergyJoules: Number(data.energyJoules.toFixed(12)), alignment: data.alignment, vectorChecks: { crossProductResidual: Number((data.torqueZNewtonMetres - crossProduct).toExponential(6)), energyDotProductResidual: Number((data.energyJoules - dotProductEnergy).toExponential(6)), magnitudeFormulaResidual: Number((data.torqueMagnitudeNewtonMetres - MAGNETIC_MOMENT * FIELD_TESLA * Math.abs(Math.sin(radians(data.relativeAngleDegrees)))).toExponential(6)) }, challenge: { maximumAtAbsoluteSine: 1, perpendicularAnglesDegrees: [90, 270], exactMaximumTorqueNewtonMetres: 0.024 }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p192-shell"><div class="p192-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Magnetic moments and torque</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p192-spread"><article class="book-page p192-problem-page"><div class="problem-number">Problem 19.2</div><h1 class="book-title p192-title">The Loop That Won’t Sit Still</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="problem-copy">A single-turn loop carries 2 A and encloses 0.030 m². It sits in a uniform 0.40 T magnetic field.</p><p class="problem-copy"><strong>What is the maximum possible magnetic torque on the loop?</strong></p><section class="p192-observation-card"><strong>Orientation matters</strong><p>The field does not pull the loop toward a single position; it exerts a couple that turns the magnetic moment toward stable alignment.</p></section><section class="p192-model-card"><div class="eyebrow">Vector convention</div><p>The diagram uses +x to the right, +y upward and +z out of the page. Clockwise torque therefore has negative z sign.</p></section></article><section class="book-page book-stage p192-stage">${stageControls()}<div class="p192-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p192-coach"><div class="coach-kicker">Find the largest torque</div><p class="coach-question">Enter the positive maximum magnitude in newton metres.</p><form class="p192-answer-form" data-p192-answer-form novalidate><label for="p192-answer">Maximum torque</label><div><input id="p192-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 0.024" autocomplete="off"/><span>N·m</span></div><button class="primary-button" type="submit">Check torque</button></form>${feedbackMarkup()}<div class="button-row p192-help-row"><button class="secondary-button" type="button" data-problem-action="p192-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p192-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p192-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom(root) {
    const magnet = root.querySelector(".p192-magnet"); if (magnet) magnet.outerHTML = magnetSvg();
    const metrics = root.querySelector(".p192-metrics"); if (metrics) metrics.outerHTML = metricsMarkup();
    const output = root.querySelector('[data-p192-output="angle"]'); if (output) output.textContent = `${format(state.normalAngleDegrees, 0)}°`;
    const message = root.querySelector("[data-p192-control-message]"); if (message) message.textContent = state.boardMessage;
    const slider = root.querySelector("#p192-angle"); if (slider) { slider.value = String(state.normalAngleDegrees); const data = currentConfiguration(); slider.setAttribute("aria-valuetext", `Loop normal ${format(state.normalAngleDegrees, 0)} degrees; moment is ${format(data.relativeAngleDegrees, 0)} degrees from field; torque ${format(data.torqueMagnitudeNewtonMetres, 4)} newton metres ${data.torqueDirection}`); }
    root.querySelectorAll("[data-p192-current]").forEach((button) => { const active = Number(button.dataset.p192Current) === state.currentDirection; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    root.querySelectorAll("[data-p192-field]").forEach((button) => { const active = Number(button.dataset.p192Field) === state.fieldDirection; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p192-shell");
    let dragPointerId = null;
    function updateFromPointer(event) { const svg = root?.querySelector(".p192-magnet"), matrix = svg?.getScreenCTM(); if (!svg || !matrix) return; const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; const local = point.matrixTransform(matrix.inverse()), angle = Math.atan2(150 - local.y, local.x - 250) * 180 / Math.PI; setNormalAngle(angle); updateDynamicDom(root); }
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p192-reset") { resetChallenge(); renderAndFocus(renderApp, "#p192-angle"); return; }
        if (action === "p192-stage") { state.stage = clamp(Number(actionControl.dataset.p192Stage), 0, 2); renderAndFocus(renderApp, `[data-p192-stage="${state.stage}"]`); return; }
        if (action === "p192-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p192-stage="${state.stage}"]`); return; }
        if (action === "p192-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p192-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
        renderApp(); if (action === "p192-reveal") window.requestAnimationFrame(() => document.querySelector("#p192-solution-heading")?.focus()); return;
      }
      const current = event.target.closest("[data-p192-current]"); if (current) { setCurrentDirection(Number(current.dataset.p192Current)); updateDynamicDom(root); current.focus(); return; }
      const field = event.target.closest("[data-p192-field]"); if (field) { setFieldDirection(Number(field.dataset.p192Field)); updateDynamicDom(root); field.focus(); return; }
      const relative = event.target.closest("[data-p192-relative]"); if (relative) { setRelativeAngle(Number(relative.dataset.p192Relative)); updateDynamicDom(root); relative.focus(); }
    });
    root?.querySelector("#p192-angle")?.addEventListener("input", (event) => { setNormalAngle(Number(event.target.value)); updateDynamicDom(root); });
    root?.addEventListener("pointerdown", (event) => { if (!event.target.closest(".p192-magnet") || event.button !== 0) return; event.preventDefault(); dragPointerId = event.pointerId; root.setPointerCapture?.(event.pointerId); updateFromPointer(event); });
    root?.addEventListener("pointermove", (event) => { if (dragPointerId !== event.pointerId) return; updateFromPointer(event); });
    root?.addEventListener("pointerup", (event) => { if (dragPointerId !== event.pointerId) return; dragPointerId = null; if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId); });
    root?.addEventListener("pointercancel", (event) => { if (dragPointerId === event.pointerId) dragPointerId = null; });
    root?.querySelector("#p192-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p192-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p192-answer")?.value || "", answer = parseTorque(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a torque magnitude in newton metres.";
      else if (Math.abs(answer - MAGNETIC_MOMENT) <= .00005) state.feedback = "0.060 A·m² is the magnetic moment. Multiply it by B for the maximum torque.";
      else if (Math.abs(answer) <= .00005) state.feedback = "Torque is zero only when μ is parallel or antiparallel to B. Find its perpendicular maximum.";
      else if (Math.abs(answer - MAXIMUM_TORQUE) > .00005) state.feedback = "Use μ=IA, then τmax=μB because |sinθ|max=1.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: μ=0.060 A·m² and τmax=μB=0.024 N·m."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p192-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
