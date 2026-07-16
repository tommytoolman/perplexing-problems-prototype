(function registerRailBrakesItselfPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "19.3";
  const BAR_LENGTH_METRES = .60;
  const CIRCUIT_RESISTANCE_OHMS = .30;
  const DEFAULT_SPEED_MPS = 4.0;
  const DEFAULT_FIELD_TESLA = .80;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Flux", title: "The moving bar changes the loop area", copy: "As the bar slides right, area A grows at rate Lv. With B into the page, the into-page magnetic flux grows too." }),
    Object.freeze({ short: "Lenz", title: "The induced current opposes the flux change", copy: "Growing into-page flux produces an out-of-page induced field. Viewed from above, that requires counterclockwise current, upward through the moving bar." }),
    Object.freeze({ short: "Brake", title: "The induced current makes its own drag force", copy: "On the bar, F=IL×B points left—opposite the rightward motion. Mechanical work becomes I²R heating in the circuit." }),
  ]);
  const hints = Object.freeze([
    "Start with the motional emf magnitude: ε=BLv.",
    "Ohm’s law gives the induced current I=ε/R=BLv/R.",
    "The magnetic force on the moving bar has magnitude F=BIL.",
    "Combine the equations: F=B²L²v/R. Substitute B=0.80 T, L=0.60 m, v=4.0 m/s and R=0.30 Ω.",
    "The rightward bar increases into-page flux, so Lenz’s law gives counterclockwise current and a leftward force. Check energy with Fv=I²R.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p193-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".");
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
  }

  function railData(speed = DEFAULT_SPEED_MPS, fieldMagnitude = DEFAULT_FIELD_TESLA, motionDirection = "right", fieldDirection = "into", length = BAR_LENGTH_METRES, resistance = CIRCUIT_RESISTANCE_OHMS) {
    const velocityX = (motionDirection === "left" ? -1 : 1) * speed;
    const fieldZ = (fieldDirection === "out" ? 1 : -1) * fieldMagnitude;
    const fluxRateWebersPerSecond = fieldZ * length * velocityX;
    const emfCounterclockwiseVolts = -fluxRateWebersPerSecond;
    const currentCounterclockwiseAmps = resistance > 0 ? emfCounterclockwiseVolts / resistance : NaN;
    const forceXNewtons = currentCounterclockwiseAmps * length * fieldZ;
    const emfMagnitudeVolts = Math.abs(emfCounterclockwiseVolts);
    const currentMagnitudeAmps = Math.abs(currentCounterclockwiseAmps);
    const brakingForceMagnitudeNewtons = Math.abs(forceXNewtons);
    const mechanicalPowerWatts = brakingForceMagnitudeNewtons * Math.abs(velocityX);
    const joulePowerWatts = currentMagnitudeAmps ** 2 * resistance;
    const moving = speed > 0;
    const active = moving && fieldMagnitude > 0;
    return {
      velocityX: cleanZero(velocityX),
      fieldZ: cleanZero(fieldZ),
      fluxRateWebersPerSecond: cleanZero(fluxRateWebersPerSecond),
      emfCounterclockwiseVolts: cleanZero(emfCounterclockwiseVolts),
      currentCounterclockwiseAmps: cleanZero(currentCounterclockwiseAmps),
      forceXNewtons: cleanZero(forceXNewtons),
      emfMagnitudeVolts,
      currentMagnitudeAmps,
      brakingForceMagnitudeNewtons,
      mechanicalPowerWatts,
      joulePowerWatts,
      powerResidualWatts: cleanZero(mechanicalPowerWatts - joulePowerWatts),
      motionDirection: moving ? (velocityX > 0 ? "right" : "left") : "stationary",
      fieldDirection: fieldMagnitude > 0 ? (fieldZ > 0 ? "out of page" : "into page") : "zero field",
      fluxMagnitudeTrend: active ? (velocityX > 0 ? "increasing" : "decreasing") : "unchanged",
      inducedFieldDirection: active ? (fluxRateWebersPerSecond < 0 ? "out of page" : "into page") : "none",
      loopCurrentDirection: active ? (currentCounterclockwiseAmps > 0 ? "counterclockwise" : "clockwise") : "none",
      barCurrentDirection: active ? (currentCounterclockwiseAmps > 0 ? "up" : "down") : "none",
      forceDirection: active ? (forceXNewtons > 0 ? "right" : "left") : "none",
      dragOppositionResidual: active ? cleanZero(forceXNewtons * velocityX + brakingForceMagnitudeNewtons * Math.abs(velocityX)) : 0,
    };
  }

  const challenge = Object.freeze(railData());

  function initialState() {
    return {
      speed: DEFAULT_SPEED_MPS,
      fieldMagnitude: DEFAULT_FIELD_TESLA,
      motionDirection: "right",
      fieldDirection: "into",
      barPositionPercent: 58,
      stage: 0,
      boardMessage: "The bar moves right: loop area and into-page flux increase.",
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();

  function currentRailData() { return railData(state.speed, state.fieldMagnitude, state.motionDirection, state.fieldDirection); }
  function barX() { return 240 + 2.55 * state.barPositionPercent; }

  function stageControlsMarkup() {
    return `<div class="p193-stage-controls" role="group" aria-label="Electromagnetic braking reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p193-stage" data-p193-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p193-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p193-next-stage" ${state.stage >= stages.length - 1 ? "disabled" : ""}>${state.stage >= stages.length - 1 ? "Energy balanced" : "Next stage"}</button></div>`;
  }

  function fieldSymbolsMarkup() {
    if (state.fieldMagnitude <= 0) return "";
    const symbol = state.fieldDirection === "into" ? "×" : "•";
    const xLimit = barX();
    const symbols = [];
    for (let y = 106; y <= 282; y += 44) {
      for (let x = 128; x <= 518; x += 48) {
        symbols.push(`<text class="${x < xLimit - 12 ? "is-loop" : "is-outside-loop"}" x="${x}" y="${y}">${symbol}</text>`);
      }
    }
    return symbols.join("");
  }

  function currentArrowsMarkup() {
    const data = currentRailData(), x = barX();
    if (data.loopCurrentDirection === "none") return "";
    const ccw = data.loopCurrentDirection === "counterclockwise";
    return `<g class="p193-current-arrows"><line x1="${ccw ? x - 20 : 145}" y1="78" x2="${ccw ? 145 : x - 20}" y2="78" marker-end="url(#p193-current-arrow)"/><line x1="${ccw ? 145 : x - 20}" y1="314" x2="${ccw ? x - 20 : 145}" y2="314" marker-end="url(#p193-current-arrow)"/><line x1="105" y1="${ccw ? 110 : 282}" x2="105" y2="${ccw ? 282 : 110}" marker-end="url(#p193-current-arrow)"/><line x1="${format(x, 3)}" y1="${ccw ? 282 : 110}" x2="${format(x, 3)}" y2="${ccw ? 110 : 282}" marker-end="url(#p193-current-arrow)"/></g>`;
  }

  function railSvg() {
    const data = currentRailData(), x = barX(), movingRight = state.motionDirection === "right", forceRight = data.forceDirection === "right";
    const motionStart = movingRight ? x - 48 : x + 48, motionEnd = movingRight ? x + 58 : x - 58;
    const forceStart = forceRight ? x - 48 : x + 48, forceEnd = forceRight ? x + 58 : x - 58;
    const showCurrent = state.stage >= 1 || state.revealed;
    const showForce = state.stage >= 2 || state.revealed;
    const description = `A conducting bar of length 0.60 metres closes a rail circuit of resistance 0.30 ohms. It moves ${data.motionDirection} at ${format(state.speed, 3)} metres per second through a ${format(state.fieldMagnitude, 3)} tesla field ${data.fieldDirection}. Magnetic flux magnitude is ${data.fluxMagnitudeTrend}. Motional emf is ${format(data.emfMagnitudeVolts, 6)} volts. Induced current is ${format(data.currentMagnitudeAmps, 6)} amperes ${data.loopCurrentDirection}, ${data.barCurrentDirection} through the bar. Magnetic force is ${format(data.brakingForceMagnitudeNewtons, 6)} newtons ${data.forceDirection}, opposite motion. Mechanical and thermal powers are both ${format(data.mechanicalPowerWatts, 6)} watts.`;
    return `<svg class="p193-rail p193-stage-${state.stage}" viewBox="0 0 760 400" role="img" aria-labelledby="p193-rail-title p193-rail-desc"><title id="p193-rail-title">Sliding conducting bar, changing magnetic flux and electromagnetic braking</title><desc id="p193-rail-desc">${description}</desc><defs><marker id="p193-motion-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z"/></marker><marker id="p193-force-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z"/></marker><marker id="p193-current-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker></defs><rect class="p193-rail-bg" x="1" y="1" width="758" height="398" rx="20"/><text class="p193-rail-kicker" x="22" y="27">SLIDING BAR · ${state.fieldMagnitude > 0 ? `UNIFORM FIELD ${state.fieldDirection === "into" ? "INTO PAGE ×" : "OUT OF PAGE •"}` : "ZERO MAGNETIC FIELD"} · TOTAL R = ${format(CIRCUIT_RESISTANCE_OHMS, 2)} Ω</text><rect class="p193-flux-area" x="105" y="78" width="${format(Math.max(0, x - 105), 3)}" height="236"/><g class="p193-field-symbols">${fieldSymbolsMarkup()}</g><line class="p193-rail-line" x1="75" y1="78" x2="535" y2="78"/><line class="p193-rail-line" x1="75" y1="314" x2="535" y2="314"/><path class="p193-resistor" d="M105 78v36l-12 11 24 18-24 18 24 18-24 18 24 18-12 11v88"/><text class="p193-resistor-label" x="77" y="202" text-anchor="middle">R</text><line class="p193-bar" x1="${format(x, 3)}" y1="73" x2="${format(x, 3)}" y2="319"/><text class="p193-bar-label" x="${format(x + 10, 3)}" y="198">L = ${format(BAR_LENGTH_METRES, 2)} m</text>${showCurrent ? currentArrowsMarkup() : ""}<g class="p193-motion-vector"><line x1="${format(motionStart, 3)}" y1="45" x2="${format(motionEnd, 3)}" y2="45" marker-end="url(#p193-motion-arrow)"/><text x="${format(x, 3)}" y="35" text-anchor="middle">v ${data.motionDirection.toUpperCase()} · ${format(state.speed, 1)} m/s</text></g>${showForce && data.forceDirection !== "none" ? `<g class="p193-force-vector"><line x1="${format(forceStart, 3)}" y1="350" x2="${format(forceEnd, 3)}" y2="350" marker-end="url(#p193-force-arrow)"/><text x="${format(x, 3)}" y="374" text-anchor="middle">MAGNETIC DRAG ${data.forceDirection.toUpperCase()} · ${format(data.brakingForceMagnitudeNewtons, 3)} N</text></g>` : ""}<g class="p193-flux-label" transform="translate(126 94)"><rect width="154" height="42" rx="9"/><text x="10" y="17">LOOP AREA ${data.fluxMagnitudeTrend.toUpperCase()}</text><text x="10" y="33">${state.fieldMagnitude > 0 ? `${state.fieldDirection.toUpperCase()}-PAGE FLUX` : "ZERO MAGNETIC FLUX"}</text></g><g class="p193-ledger" transform="translate(565 54)"><rect width="171" height="292" rx="14"/><text class="p193-ledger-title" x="14" y="25">INDUCTION AUDIT</text><text class="p193-ledger-label" x="14" y="61">emf |ε|</text><text class="p193-ledger-value" x="157" y="61" text-anchor="end">${format(data.emfMagnitudeVolts, 3)} V</text><text class="p193-ledger-label" x="14" y="88">current |I|</text><text class="p193-ledger-value" x="157" y="88" text-anchor="end">${format(data.currentMagnitudeAmps, 3)} A</text><text class="p193-ledger-label" x="14" y="115">loop direction</text><text class="p193-ledger-value" x="157" y="115" text-anchor="end">${data.loopCurrentDirection.toUpperCase()}</text><line class="p193-ledger-rule" x1="14" y1="137" x2="157" y2="137"/><text class="p193-ledger-label" x="14" y="167">induced B</text><text class="p193-ledger-value" x="157" y="167" text-anchor="end">${data.inducedFieldDirection.toUpperCase()}</text><text class="p193-ledger-label" x="14" y="194">bar current</text><text class="p193-ledger-value" x="157" y="194" text-anchor="end">${data.barCurrentDirection.toUpperCase()}</text><text class="p193-ledger-label" x="14" y="221">drag force</text><text class="p193-ledger-value is-force" x="157" y="221" text-anchor="end">${format(data.brakingForceMagnitudeNewtons, 3)} N</text><rect class="p193-power-box" x="10" y="240" width="151" height="39" rx="8"/><text class="p193-power-label" x="20" y="255">HEAT POWER</text><text class="p193-power-value" x="151" y="270" text-anchor="end">${format(data.joulePowerWatts, 3)} W</text></g></svg>`;
  }

  function readingsMarkup() {
    const data = currentRailData();
    return `<section class="p193-readings" aria-label="Induction values" aria-live="polite"><article><span>Motional emf</span><strong>${format(data.emfMagnitudeVolts, 3)} V</strong><small>BLv</small></article><article><span>Induced current</span><strong>${format(data.currentMagnitudeAmps, 3)} A</strong><small>${data.loopCurrentDirection}</small></article><article class="is-force"><span>Magnetic drag</span><strong>${format(data.brakingForceMagnitudeNewtons, 3)} N</strong><small>${data.forceDirection}; opposite motion</small></article></section>`;
  }

  function energyMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const data = currentRailData();
    return `<section class="p193-energy" aria-labelledby="p193-energy-heading"><div><span class="eyebrow">Energy conversion</span><h3 id="p193-energy-heading">The brake is a resistor heater</h3></div><div class="p193-energy-flow"><article><span>Mechanical input</span><strong>Fv = ${format(data.mechanicalPowerWatts, 3)} W</strong></article><i aria-hidden="true">→</i><article><span>Electrical heating</span><strong>I²R = ${format(data.joulePowerWatts, 3)} W</strong></article></div><p>Ideal power residual: ${format(data.powerResidualWatts, 9)} W. The external pull replaces exactly the energy dissipated as heat.</p></section>`;
  }

  function dynamicMarkup() {
    return `<div class="p193-dynamic"><div class="p193-rail-wrap">${railSvg()}${readingsMarkup()}</div>${energyMarkup()}<div class="p193-board-message" role="status">${state.boardMessage}</div></div>`;
  }

  function controlsMarkup() {
    const data = currentRailData();
    return `<section class="p193-controls" aria-label="Rail braking controls"><div class="p193-toggle-row"><div role="group" aria-label="Bar motion direction"><span>Bar motion</span><button class="secondary-button ${state.motionDirection === "right" ? "active" : ""}" type="button" data-problem-action="p193-motion" data-p193-motion="right" aria-pressed="${state.motionDirection === "right"}">Right →</button><button class="secondary-button ${state.motionDirection === "left" ? "active" : ""}" type="button" data-problem-action="p193-motion" data-p193-motion="left" aria-pressed="${state.motionDirection === "left"}">← Left</button></div><div role="group" aria-label="Magnetic field direction"><span>Uniform B</span><button class="secondary-button ${state.fieldDirection === "into" ? "active" : ""}" type="button" data-problem-action="p193-field" data-p193-field="into" aria-pressed="${state.fieldDirection === "into"}">Into page ×</button><button class="secondary-button ${state.fieldDirection === "out" ? "active" : ""}" type="button" data-problem-action="p193-field" data-p193-field="out" aria-pressed="${state.fieldDirection === "out"}">Out of page •</button></div></div><div class="p193-slider-grid"><label for="p193-speed"><span>Speed |v| <output data-p193-output="speed">${format(state.speed, 1)} m/s</output></span><input id="p193-speed" data-p193-slider="speed" type="range" min="0" max="8" step=".1" value="${state.speed}"/></label><label for="p193-field-strength"><span>Field |B| <output data-p193-output="field">${format(state.fieldMagnitude, 2)} T</output></span><input id="p193-field-strength" data-p193-slider="field" type="range" min="0" max="1.2" step=".05" value="${state.fieldMagnitude}"/></label><label for="p193-position"><span>Bar position <output data-p193-output="position">${format(state.barPositionPercent, 0)}%</output></span><input id="p193-position" data-p193-slider="position" type="range" min="0" max="100" step="1" value="${state.barPositionPercent}"/></label></div><div class="p193-control-summary">Current ${data.loopCurrentDirection}; drag ${data.forceDirection}; F=${format(data.brakingForceMagnitudeNewtons, 3)} N.</div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="p193-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }

  function hintsMarkup() {
    return state.hintsUsed ? `<div class="hint-stack p193-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : "";
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p193-solution" aria-labelledby="p193-solution-heading" aria-live="polite"><h3 id="p193-solution-heading">Flux change builds the current that resists the motion</h3><p>The bar moves right, so the loop area and into-page flux increase. Lenz’s law demands an out-of-page induced field: the current is counterclockwise, and therefore upward in the moving bar. The force IL×B is leftward, opposing the motion.</p><div class="p193-equation">ε=BLv=0.80×0.60×4.0=1.92 V<br>I=ε/R=1.92/0.30=6.40 A</div><div class="p193-equation is-answer">F=BIL=0.80×6.40×0.60=3.072 N<br>equivalently F=B²L²v/R=3.072 N<br><strong>braking-force magnitude = 3.072 N</strong></div><p>The direction is left, but the requested magnitude is positive. As an energy check:</p><div class="p193-equation">mechanical power Fv=3.072×4.0=12.288 W<br>Joule heating I²R=6.40²×0.30=12.288 W.</div></section>`;
  }

  function snapshot() {
    const data = currentRailData();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      model: "ideal conducting bar on zero-resistance rails; total lumped resistance R; uniform perpendicular B; negligible self-inductance and friction",
      barLengthMetres: BAR_LENGTH_METRES,
      circuitResistanceOhms: CIRCUIT_RESISTANCE_OHMS,
      speedMetresPerSecond: state.speed,
      velocityXMetresPerSecond: data.velocityX,
      fieldMagnitudeTesla: state.fieldMagnitude,
      fieldZTesla: data.fieldZ,
      fluxMagnitudeTrend: data.fluxMagnitudeTrend,
      signedFluxRateWebersPerSecondOutPositive: data.fluxRateWebersPerSecond,
      emfMagnitudeVolts: data.emfMagnitudeVolts,
      signedEmfCounterclockwisePositiveVolts: data.emfCounterclockwiseVolts,
      currentMagnitudeAmps: data.currentMagnitudeAmps,
      signedCurrentCounterclockwisePositiveAmps: data.currentCounterclockwiseAmps,
      inducedFieldDirection: data.inducedFieldDirection,
      loopCurrentDirection: data.loopCurrentDirection,
      barCurrentDirection: data.barCurrentDirection,
      magneticForceXNewtons: data.forceXNewtons,
      brakingForceMagnitudeNewtons: data.brakingForceMagnitudeNewtons,
      forceDirection: data.forceDirection,
      mechanicalPowerWatts: data.mechanicalPowerWatts,
      joulePowerWatts: data.joulePowerWatts,
      invariants: { powerResidualWatts: data.powerResidualWatts, dragOppositionResidual: data.dragOppositionResidual },
      barVisualPositionPercent: state.barPositionPercent,
      challenge: { emfVolts: challenge.emfMagnitudeVolts, currentAmps: challenge.currentMagnitudeAmps, brakingForceNewtons: challenge.brakingForceMagnitudeNewtons, powerWatts: challenge.mechanicalPowerWatts },
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function restoreChallenge() {
    state.speed = DEFAULT_SPEED_MPS;
    state.fieldMagnitude = DEFAULT_FIELD_TESLA;
    state.motionDirection = "right";
    state.fieldDirection = "into";
    state.barPositionPercent = 58;
  }

  function render() {
    return `<main class="book-shell p193-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · electromagnetic induction</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p193-spread"><article class="book-page p193-problem-page"><div class="problem-number">Problem 19.3</div><h1 class="book-title p193-title">The Rail That Brakes Itself</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p193-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A conducting bar of length 0.60 m slides right at 4.0 m/s on conducting rails through a uniform 0.80 T magnetic field into the page. The complete circuit has resistance 0.30 Ω.</p><p class="problem-copy"><strong>What is the magnitude of the magnetic braking force on the bar?</strong></p><section class="p193-given-grid" aria-label="Rail braking values"><span>L <strong>0.60 m</strong></span><span>v <strong>4.0 m/s</strong></span><span>B <strong>0.80 T ×</strong></span><span>R <strong>0.30 Ω</strong></span></section><section class="p193-rule-card"><strong>Lenz’s law</strong><p>The induced current acts so its magnetic effect opposes the change that produced it—not the original field in isolation.</p></section></article><section class="book-page book-stage p193-stage" aria-labelledby="p193-stage-title">${stageControlsMarkup()}<div class="p193-stage-heading"><div><span class="eyebrow">Induction laboratory</span><h2 id="p193-stage-title">Follow the energy into the resistor</h2></div><p>Vary speed and field, reverse either direction, and watch Lenz’s law keep the force opposed to motion.</p></div>${dynamicMarkup()}${controlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p193-coach"><div class="coach-kicker">Calculate the drag</div><p class="coach-question">Enter the fixed challenge’s braking-force magnitude to three decimal places.</p><form class="p193-answer-form" data-p193-answer-form novalidate><label for="p193-answer">Braking-force magnitude</label><div><input id="p193-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="force"/><span>N</span></div><button class="primary-button" type="submit">Check force</button></form>${feedbackMarkup()}<div class="button-row p193-help-row"><button class="secondary-button" type="button" data-problem-action="p193-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p193-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p193-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const data = currentRailData();
    const dynamic = root.querySelector(".p193-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { speed: `${format(state.speed, 1)} m/s`, field: `${format(state.fieldMagnitude, 2)} T`, position: `${format(state.barPositionPercent, 0)}%` };
    Object.entries(outputs).forEach(([key, value]) => {
      const output = root.querySelector(`[data-p193-output="${key}"]`);
      if (output) output.textContent = value;
      const slider = root.querySelector(`[data-p193-slider="${key}"]`);
      if (slider) slider.value = String(key === "speed" ? state.speed : key === "field" ? state.fieldMagnitude : state.barPositionPercent);
    });
    const summary = root.querySelector(".p193-control-summary");
    if (summary) summary.textContent = `Current ${data.loopCurrentDirection}; drag ${data.forceDirection}; F=${format(data.brakingForceMagnitudeNewtons, 3)} N.`;
    root.querySelector('[data-p193-slider="speed"]')?.setAttribute("aria-valuetext", `${format(state.speed, 1)} metres per second; braking force ${format(data.brakingForceMagnitudeNewtons, 3)} newtons`);
    root.querySelector('[data-p193-slider="field"]')?.setAttribute("aria-valuetext", `${format(state.fieldMagnitude, 2)} tesla; braking force ${format(data.brakingForceMagnitudeNewtons, 3)} newtons`);
    root.querySelector('[data-p193-slider="position"]')?.setAttribute("aria-valuetext", `${format(state.barPositionPercent, 0)} percent along the visual rails`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p193-shell");
    if (!root) return;

    root.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-p193-slider]");
      if (!slider) return;
      const key = slider.dataset.p193Slider;
      if (key === "speed") state.speed = clamp(Number(slider.value), 0, 8);
      if (key === "field") state.fieldMagnitude = clamp(Number(slider.value), 0, 1.2);
      if (key === "position") state.barPositionPercent = clamp(Math.round(Number(slider.value)), 0, 100);
      const data = currentRailData();
      state.boardMessage = `${format(data.emfMagnitudeVolts, 3)} V drives ${format(data.currentMagnitudeAmps, 3)} A ${data.loopCurrentDirection}; drag is ${format(data.brakingForceMagnitudeNewtons, 3)} N ${data.forceDirection}.`;
      updateLiveDom(root);
    });

    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p193-reset") { state = initialState(); renderAndFocus(renderApp, '[data-p193-motion="right"]'); return; }
      if (action === "p193-motion") {
        state.motionDirection = control.dataset.p193Motion === "left" ? "left" : "right";
        const data = currentRailData();
        state.boardMessage = `Bar now moves ${data.motionDirection}; induced current is ${data.loopCurrentDirection} and drag points ${data.forceDirection}.`;
        renderAndFocus(renderApp, `[data-p193-motion="${state.motionDirection}"]`);
        return;
      }
      if (action === "p193-field") {
        state.fieldDirection = control.dataset.p193Field === "out" ? "out" : "into";
        const data = currentRailData();
        state.boardMessage = `Field now points ${data.fieldDirection}; current changes to ${data.loopCurrentDirection}, while drag remains opposite motion.`;
        renderAndFocus(renderApp, `[data-p193-field="${state.fieldDirection}"]`);
        return;
      }
      if (action === "p193-stage") { state.stage = clamp(Math.round(Number(control.dataset.p193Stage)), 0, stages.length - 1); renderAndFocus(renderApp, `[data-p193-stage="${state.stage}"]`); return; }
      if (action === "p193-next-stage") { state.stage = Math.min(stages.length - 1, state.stage + 1); renderAndFocus(renderApp, `[data-p193-stage="${state.stage}"]`); return; }
      if (action === "p193-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p193-reveal") { state.revealed = true; state.stage = stages.length - 1; restoreChallenge(); }
      renderApp();
    });

    root.querySelector("#p193-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value.slice(0, 24);
      state.feedback = "";
      state.committed = false;
    });

    root.querySelector("[data-p193-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p193-answer")?.value || "";
      const answer = parseNumber(raw);
      state.answer = raw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter one numerical force magnitude in newtons.";
      else if (answer < 0) state.feedback = "A magnitude is non-negative. The force vector points left, but its magnitude is positive.";
      else if (Math.abs(answer - challenge.brakingForceMagnitudeNewtons) <= .005) {
        state.feedbackTone = "success";
        state.feedback = "Correct: the magnetic drag is 3.072 N leftward, so its magnitude is 3.072 N.";
        state.committed = true;
        state.stage = stages.length - 1;
        restoreChallenge();
      } else if (Math.abs(answer - challenge.emfMagnitudeVolts) <= .01) state.feedback = "1.92 is the motional emf in volts. Divide by R, then use F=BIL.";
      else if (Math.abs(answer - challenge.currentMagnitudeAmps) <= .02) state.feedback = "6.40 is the current in amperes. The bar’s force is BIL.";
      else if (Math.abs(answer - challenge.mechanicalPowerWatts) <= .02) state.feedback = "12.288 is the power in watts. Divide by speed to recover the force.";
      else state.feedback = "Use ε=BLv, I=ε/R and then F=BIL; equivalently combine them as F=B²L²v/R.";
      renderAndFocus(renderApp, "#p193-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
