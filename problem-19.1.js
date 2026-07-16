(function registerCurrentTurnsNorthPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "19.1";
  const MU_ZERO = 4 * Math.PI * 1e-7;
  const DEFAULT_CURRENT_AMPS = 5;
  const DEFAULT_RADIUS_CM = 5;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Thumb", title: "Point your right thumb with conventional current", copy: "An upward current points toward you in this plan view, so the wire is marked with a dot. Reverse the current and the marker becomes a cross." }),
    Object.freeze({ short: "Curl", title: "Curled fingers trace the circular field", copy: "The magnetic field is tangent to a circle centred on the wire. For upward current it runs anticlockwise when viewed from above." }),
    Object.freeze({ short: "Size", title: "Direction and strength are separate questions", copy: "The right-hand rule sets direction. B=μ₀I/(2πr) sets magnitude: more current strengthens the field, and greater distance weakens it." }),
  ]);
  const hints = Object.freeze([
    "Look down on the vertical wire. Upward current comes toward you, represented by a dot inside the wire.",
    "Point your right thumb toward you. Your fingers curl anticlockwise around the wire.",
    "At a point due east—the right-hand side of the circle—an anticlockwise tangent points upward on the map.",
    "Upward on the map is north, so the compass needle’s north end points north.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p191-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 2) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }

  function positionName(angleDegrees) {
    const names = ["east", "north-east", "north", "north-west", "west", "south-west", "south", "south-east"];
    return names[Math.round((((angleDegrees % 360) + 360) % 360) / 45) % 8];
  }

  function bearingName(bearingDegrees) {
    const names = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
    return names[Math.round((((bearingDegrees % 360) + 360) % 360) / 45) % 8];
  }

  function fieldData(direction = "up", angleDegrees = 0, currentAmps = DEFAULT_CURRENT_AMPS, radiusCm = DEFAULT_RADIUS_CM) {
    const currentSign = direction === "down" ? -1 : 1;
    const angleRadians = angleDegrees * Math.PI / 180;
    const radialEast = Math.cos(angleRadians);
    const radialNorth = Math.sin(angleRadians);
    const fieldEast = cleanZero(-currentSign * radialNorth);
    const fieldNorth = cleanZero(currentSign * radialEast);
    const bearingDegrees = ((Math.atan2(fieldEast, fieldNorth) * 180 / Math.PI) + 360) % 360;
    const radiusMetres = radiusCm / 100;
    const magnitudeTesla = MU_ZERO * currentAmps / (2 * Math.PI * radiusMetres);
    return {
      currentSign,
      angleDegrees,
      angleRadians,
      radialEast: cleanZero(radialEast),
      radialNorth: cleanZero(radialNorth),
      fieldEast,
      fieldNorth,
      bearingDegrees: cleanZero(bearingDegrees),
      position: positionName(angleDegrees),
      direction: bearingName(bearingDegrees),
      radiusMetres,
      magnitudeTesla,
      magnitudeMicrotesla: magnitudeTesla * 1e6,
      tangencyResidual: cleanZero(radialEast * fieldEast + radialNorth * fieldNorth),
      unitVectorResidual: cleanZero(fieldEast ** 2 + fieldNorth ** 2 - 1),
    };
  }

  const challenge = Object.freeze(fieldData("up", 0, DEFAULT_CURRENT_AMPS, DEFAULT_RADIUS_CM));

  function initialState() {
    return {
      currentDirection: "up",
      compassAngleDegrees: 0,
      currentAmps: DEFAULT_CURRENT_AMPS,
      radiusCm: DEFAULT_RADIUS_CM,
      stage: 0,
      boardMessage: "Upward current selected. At due east, the anticlockwise field points north.",
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();

  function currentFieldData() {
    return fieldData(state.currentDirection, state.compassAngleDegrees, state.currentAmps, state.radiusCm);
  }

  function visualOrbitRadius(radiusCm = state.radiusCm) { return 80 + clamp(radiusCm, 2, 12) * 7; }

  function stageControlsMarkup() {
    return `<div class="p191-stage-controls" role="group" aria-label="Right-hand-rule reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p191-stage" data-p191-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p191-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p191-next-stage" ${state.stage >= stages.length - 1 ? "disabled" : ""}>${state.stage >= stages.length - 1 ? "Field resolved" : "Next stage"}</button></div>`;
  }

  function fieldArrowMarkup(radius, angleOffsetDegrees) {
    const centreX = 265, centreY = 205, sign = state.currentDirection === "up" ? 1 : -1;
    return Array.from({ length: 4 }, (_, index) => {
      const angle = (angleOffsetDegrees + index * 90) * Math.PI / 180;
      const x = centreX + radius * Math.cos(angle);
      const y = centreY - radius * Math.sin(angle);
      const fieldEast = -sign * Math.sin(angle);
      const fieldNorth = sign * Math.cos(angle);
      const screenX = fieldEast;
      const screenY = -fieldNorth;
      return `<line x1="${format(x - screenX * 9, 3)}" y1="${format(y - screenY * 9, 3)}" x2="${format(x + screenX * 9, 3)}" y2="${format(y + screenY * 9, 3)}" marker-end="url(#p191-field-arrow)"/>`;
    }).join("");
  }

  function fieldSvg() {
    const data = currentFieldData();
    const centreX = 265, centreY = 205, orbitRadius = visualOrbitRadius();
    const compassX = centreX + orbitRadius * Math.cos(data.angleRadians);
    const compassY = centreY - orbitRadius * Math.sin(data.angleRadians);
    const currentUp = state.currentDirection === "up";
    const showMagnitude = state.stage >= 2 || state.revealed;
    const description = `Plan view of a straight vertical wire. Conventional current is ${state.currentDirection} at ${format(state.currentAmps, 2)} amperes. A compass is ${format(state.radiusCm, 2)} centimetres from the wire at ${data.position}, angle ${format(data.angleDegrees, 0)} degrees anticlockwise from east. The circular magnetic field has unit direction vector east ${format(data.fieldEast, 6)}, north ${format(data.fieldNorth, 6)}, so the compass north end points ${data.direction}, bearing ${format(data.bearingDegrees, 2)} degrees. Field magnitude is ${format(data.magnitudeMicrotesla, 4)} microtesla.`;
    return `<svg class="p191-field p191-stage-${state.stage} is-current-${state.currentDirection}" viewBox="0 0 760 420" role="img" aria-labelledby="p191-field-title p191-field-desc"><title id="p191-field-title">Magnetic field and movable compass around a vertical current-carrying wire</title><desc id="p191-field-desc">${description}</desc><defs><marker id="p191-field-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker><marker id="p191-current-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z"/></marker></defs><rect class="p191-field-bg" x="1" y="1" width="758" height="418" rx="20"/><text class="p191-field-kicker" x="22" y="28">PLAN VIEW · NORTH IS UP · COMPASS NORTH END FOLLOWS B</text><g class="p191-cardinals"><text x="265" y="42" text-anchor="middle">N</text><text x="468" y="210" text-anchor="middle">E</text><text x="265" y="388" text-anchor="middle">S</text><text x="61" y="210" text-anchor="middle">W</text></g><g class="p191-field-rings"><circle cx="265" cy="205" r="65"/><circle cx="265" cy="205" r="115"/><circle cx="265" cy="205" r="165"/></g><g class="p191-field-arrows">${fieldArrowMarkup(65, 18)}${fieldArrowMarkup(115, 41)}${fieldArrowMarkup(165, 63)}</g><line class="p191-radius-line" x1="${centreX}" y1="${centreY}" x2="${format(compassX, 3)}" y2="${format(compassY, 3)}"/><g class="p191-wire" transform="translate(${centreX} ${centreY})"><circle class="p191-wire-outer" r="31"/><circle class="p191-wire-inner" r="18"/>${currentUp ? '<circle class="p191-current-dot" r="5"/>' : '<path class="p191-current-cross" d="M-6-6L6 6M6-6L-6 6"/>'}<text text-anchor="middle" y="49">I ${currentUp ? "UP · ⊙" : "DOWN · ⊗"}</text></g><g class="p191-compass" transform="translate(${format(compassX, 3)} ${format(compassY, 3)})"><circle class="p191-compass-ring" r="31"/><g class="p191-needle" transform="rotate(${format(data.bearingDegrees, 3)})"><path class="p191-needle-north" d="M0-25L8 0H-8Z"/><path class="p191-needle-south" d="M0 25L8 0H-8Z"/><text text-anchor="middle" y="-11">N</text></g><circle class="p191-compass-pin" r="3"/></g><g class="p191-wire-inset" transform="translate(528 50)"><rect width="205" height="147" rx="13"/><text class="p191-inset-kicker" x="14" y="23">SIDE VIEW OF CURRENT</text><line x1="68" y1="${currentUp ? 118 : 42}" x2="68" y2="${currentUp ? 42 : 118}" marker-end="url(#p191-current-arrow)"/><text class="p191-inset-current" x="93" y="78">${currentUp ? "UPWARD" : "DOWNWARD"}</text><text class="p191-inset-note" x="93" y="99">${currentUp ? "dot in plan view" : "cross in plan view"}</text><text class="p191-inset-amp" x="190" y="128" text-anchor="end">${format(state.currentAmps, 1)} A</text></g><g class="p191-direction-ledger" transform="translate(528 216)"><rect width="205" height="151" rx="13"/><text class="p191-ledger-kicker" x="14" y="23">COMPASS AUDIT</text><text class="p191-ledger-label" x="14" y="51">position</text><text class="p191-ledger-value" x="190" y="51" text-anchor="end">${data.position.toUpperCase()}</text><text class="p191-ledger-label" x="14" y="76">field vector (E,N)</text><text class="p191-ledger-value" x="190" y="76" text-anchor="end">(${format(data.fieldEast, 3)}, ${format(data.fieldNorth, 3)})</text><text class="p191-ledger-label" x="14" y="101">north end points</text><text class="p191-ledger-value is-direction" x="190" y="101" text-anchor="end">${data.direction.toUpperCase()}</text><text class="p191-ledger-label" x="14" y="126">${showMagnitude ? "field magnitude" : "magnitude at stage 3"}</text><text class="p191-ledger-value" x="190" y="126" text-anchor="end">${showMagnitude ? `${format(data.magnitudeMicrotesla, 2)} μT` : "—"}</text></g></svg>`;
  }

  function readingsMarkup() {
    const data = currentFieldData();
    return `<section class="p191-readings" aria-label="Current magnetic-field readings" aria-live="polite"><article><span>Current / position</span><strong>${state.currentDirection} · ${data.position}</strong><small>${format(data.angleDegrees, 0)}° anticlockwise from east</small></article><article class="is-direction"><span>Compass north end</span><strong>${data.direction}</strong><small>bearing ${format(data.bearingDegrees, 1)}° from north</small></article><article><span>Field strength</span><strong>${format(data.magnitudeMicrotesla, 2)} μT</strong><small>${format(state.currentAmps, 1)} A at ${format(state.radiusCm, 1)} cm</small></article></section>`;
  }

  function magnitudeMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const data = currentFieldData();
    return `<section class="p191-magnitude" aria-labelledby="p191-magnitude-heading"><div><span class="eyebrow">Optional magnitude check</span><h3 id="p191-magnitude-heading">The same circular field weakens with distance</h3></div><div class="p191-magnitude-equation">B = μ₀I/(2πr) = (4π×10⁻⁷ × ${format(state.currentAmps, 2)})/(2π × ${format(data.radiusMetres, 3)}) = <strong>${format(data.magnitudeMicrotesla, 2)} μT</strong></div><p>Magnitude does not determine the compass direction. The right-hand-rule tangent does.</p></section>`;
  }

  function dynamicMarkup() {
    return `<div class="p191-dynamic"><div class="p191-field-wrap">${fieldSvg()}${readingsMarkup()}</div>${magnitudeMarkup()}<div class="p191-board-message" role="status">${state.boardMessage}</div></div>`;
  }

  function controlsMarkup() {
    const data = currentFieldData();
    const presets = [{ angle: 0, label: "East" }, { angle: 90, label: "North" }, { angle: 180, label: "West" }, { angle: 270, label: "South" }];
    return `<section class="p191-controls" aria-label="Wire current and compass controls"><div class="p191-direction-buttons" role="group" aria-label="Conventional current direction"><span>Conventional current</span><button class="secondary-button ${state.currentDirection === "up" ? "active" : ""}" type="button" data-problem-action="p191-current" data-p191-current="up" aria-pressed="${state.currentDirection === "up"}">Upward · ⊙</button><button class="secondary-button ${state.currentDirection === "down" ? "active" : ""}" type="button" data-problem-action="p191-current" data-p191-current="down" aria-pressed="${state.currentDirection === "down"}">Downward · ⊗</button></div><div class="p191-position-presets" role="group" aria-label="Compass position presets">${presets.map((preset) => `<button class="secondary-button ${state.compassAngleDegrees === preset.angle ? "active" : ""}" type="button" data-problem-action="p191-angle-preset" data-p191-angle="${preset.angle}" aria-pressed="${state.compassAngleDegrees === preset.angle}">${preset.label}</button>`).join("")}</div><label for="p191-angle"><span>Move compass around wire <output data-p191-output="angle">${data.position} · ${format(state.compassAngleDegrees, 0)}°</output></span><input id="p191-angle" data-p191-slider="angle" type="range" min="0" max="359" step="1" value="${state.compassAngleDegrees}" aria-label="Compass position angle anticlockwise from east"/></label><div class="p191-number-controls"><label for="p191-current-amps"><span>Current I <output data-p191-output="current">${format(state.currentAmps, 1)} A</output></span><input id="p191-current-amps" data-p191-slider="current" type="range" min="1" max="10" step=".5" value="${state.currentAmps}"/></label><label for="p191-radius"><span>Distance r <output data-p191-output="radius">${format(state.radiusCm, 1)} cm</output></span><input id="p191-radius" data-p191-slider="radius" type="range" min="2" max="12" step=".5" value="${state.radiusCm}"/></label></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="p191-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }

  function hintsMarkup() {
    return state.hintsUsed ? `<div class="hint-stack p191-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : "";
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p191-solution" aria-labelledby="p191-solution-heading" aria-live="polite"><h3 id="p191-solution-heading">Thumb up; fingers anticlockwise</h3><p>Viewed from above, upward conventional current comes toward you, so represent it by ⊙. Point your right thumb that way. Your curled fingers give an anticlockwise magnetic field around the wire.</p><div class="p191-solution-direction">At due east, the anticlockwise tangent points north.<br><strong>The compass north end points north.</strong></div><p>Vectorially, take east as x, north as y and upward as z. At the east point, r̂=(1,0,0), so B̂=ẑ×r̂=(0,1,0): north. Reversing the current changes the sign and makes the same compass point south.</p><div class="p191-solution-magnitude">B = μ₀I/(2πr) = (4π×10⁻⁷×5)/(2π×0.05) = 2×10⁻⁵ T = 20 μT.</div></section>`;
  }

  function snapshot() {
    const data = currentFieldData();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      model: "ideal infinitely long straight vertical wire in free space; compass aligns with the wire's magnetic field only",
      axes: { east: "+x", north: "+y", upward: "+z" },
      currentDirection: state.currentDirection,
      currentAmps: state.currentAmps,
      compassPosition: data.position,
      compassAngleDegreesAnticlockwiseFromEast: data.angleDegrees,
      radiusCentimetres: state.radiusCm,
      radialUnitVectorEastNorth: [data.radialEast, data.radialNorth],
      fieldUnitVectorEastNorth: [data.fieldEast, data.fieldNorth],
      fieldBearingDegreesFromNorth: data.bearingDegrees,
      compassNorthEndDirection: data.direction,
      fieldMagnitudeTesla: data.magnitudeTesla,
      fieldMagnitudeMicrotesla: data.magnitudeMicrotesla,
      invariants: { tangencyDotProduct: data.tangencyResidual, unitVectorResidual: data.unitVectorResidual },
      challenge: { currentDirection: "up", compassPosition: "east", answer: challenge.direction, defaultMagnitudeMicrotesla: challenge.magnitudeMicrotesla },
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p191-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · electromagnetism</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p191-spread"><article class="book-page p191-problem-page"><div class="problem-number">Problem 19.1</div><h1 class="book-title p191-title">The Current That Turns North</h1><div class="difficulty" aria-label="One star difficulty">★</div><p class="p191-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A long straight vertical wire carries conventional current upward. A small compass is placed due east of the wire in the horizontal plane.</p><p class="problem-copy"><strong>Ignoring Earth’s field, which way does the compass needle’s north end point?</strong></p><section class="p191-given-card"><strong>Right-hand rule</strong><p>Point your right thumb with conventional current. Your curled fingers follow the magnetic field around the wire.</p></section><section class="p191-model-card"><div class="eyebrow">Plan view</div><p>North is the top of the page and east is right. A dot means current toward you; a cross means current away.</p></section></article><section class="book-page book-stage p191-stage" aria-labelledby="p191-stage-title">${stageControlsMarkup()}<div class="p191-stage-heading"><div><span class="eyebrow">Right-hand-rule laboratory</span><h2 id="p191-stage-title">Move the compass around the current</h2></div><p>Reverse the current or change the compass position. The north end remains tangent to a circle around the wire.</p></div>${dynamicMarkup()}${controlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p191-coach"><div class="coach-kicker">Solve the fixed direction</div><p class="coach-question">For upward current and a compass due east, which way does its north end point?</p><form class="p191-answer-form" data-p191-answer-form novalidate><label for="p191-answer">Compass direction</label><select id="p191-answer" data-p191-answer><option value="">Choose a direction</option>${["north", "east", "south", "west"].map((direction) => `<option value="${direction}" ${state.answer === direction ? "selected" : ""}>${direction[0].toUpperCase() + direction.slice(1)}</option>`).join("")}</select><button class="primary-button" type="submit">Check direction</button></form>${feedbackMarkup()}<div class="button-row p191-help-row"><button class="secondary-button" type="button" data-problem-action="p191-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p191-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p191-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const data = currentFieldData();
    const dynamic = root.querySelector(".p191-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = {
      angle: `${data.position} · ${format(state.compassAngleDegrees, 0)}°`,
      current: `${format(state.currentAmps, 1)} A`,
      radius: `${format(state.radiusCm, 1)} cm`,
    };
    Object.entries(outputs).forEach(([key, value]) => {
      const output = root.querySelector(`[data-p191-output="${key}"]`);
      if (output) output.textContent = value;
    });
    root.querySelectorAll("[data-p191-angle]").forEach((button) => {
      const active = Number(button.dataset.p191Angle) === state.compassAngleDegrees;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelectorAll("[data-p191-slider]").forEach((slider) => {
      const key = slider.dataset.p191Slider;
      slider.value = String(key === "angle" ? state.compassAngleDegrees : key === "current" ? state.currentAmps : state.radiusCm);
    });
    root.querySelector('[data-p191-slider="angle"]')?.setAttribute("aria-valuetext", `${data.position}; magnetic field points ${data.direction}`);
    root.querySelector('[data-p191-slider="current"]')?.setAttribute("aria-valuetext", `${format(state.currentAmps, 1)} amperes; field ${format(data.magnitudeMicrotesla, 2)} microtesla`);
    root.querySelector('[data-p191-slider="radius"]')?.setAttribute("aria-valuetext", `${format(state.radiusCm, 1)} centimetres; field ${format(data.magnitudeMicrotesla, 2)} microtesla`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p191-shell");
    if (!root) return;

    root.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-p191-slider]");
      if (!slider) return;
      const key = slider.dataset.p191Slider;
      if (key === "angle") state.compassAngleDegrees = clamp(Math.round(Number(slider.value)), 0, 359);
      if (key === "current") state.currentAmps = clamp(Number(slider.value), 1, 10);
      if (key === "radius") state.radiusCm = clamp(Number(slider.value), 2, 12);
      const data = currentFieldData();
      state.boardMessage = `Compass at ${data.position}: its north end points ${data.direction}; field strength ${format(data.magnitudeMicrotesla, 2)} μT.`;
      updateLiveDom(root);
    });

    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p191-reset") { state = initialState(); renderAndFocus(renderApp, '[data-p191-current="up"]'); return; }
      if (action === "p191-current") {
        state.currentDirection = control.dataset.p191Current === "down" ? "down" : "up";
        const data = currentFieldData();
        state.boardMessage = `Current reversed ${state.currentDirection}. At ${data.position}, the compass now points ${data.direction}.`;
        renderAndFocus(renderApp, `[data-p191-current="${state.currentDirection}"]`);
        return;
      }
      if (action === "p191-angle-preset") {
        state.compassAngleDegrees = Number(control.dataset.p191Angle);
        const data = currentFieldData();
        state.boardMessage = `Compass moved due ${data.position}; its north end points ${data.direction}.`;
        renderAndFocus(renderApp, `[data-p191-angle="${state.compassAngleDegrees}"]`);
        return;
      }
      if (action === "p191-stage") { state.stage = clamp(Math.round(Number(control.dataset.p191Stage)), 0, stages.length - 1); renderAndFocus(renderApp, `[data-p191-stage="${state.stage}"]`); return; }
      if (action === "p191-next-stage") { state.stage = Math.min(stages.length - 1, state.stage + 1); renderAndFocus(renderApp, `[data-p191-stage="${state.stage}"]`); return; }
      if (action === "p191-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p191-reveal") {
        state.revealed = true;
        state.stage = stages.length - 1;
        state.currentDirection = "up";
        state.compassAngleDegrees = 0;
        state.currentAmps = DEFAULT_CURRENT_AMPS;
        state.radiusCm = DEFAULT_RADIUS_CM;
      }
      renderApp();
    });

    root.querySelector("[data-p191-answer]")?.addEventListener("change", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.committed = false;
    });

    root.querySelector("[data-p191-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = event.currentTarget.querySelector("[data-p191-answer]")?.value || "";
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.answer) state.feedback = "Choose one compass direction.";
      else if (state.answer === challenge.direction) {
        state.feedbackTone = "success";
        state.feedback = "Correct: upward current curls the field anticlockwise, so the east-side tangent points north.";
        state.committed = true;
        state.currentDirection = "up";
        state.compassAngleDegrees = 0;
      } else if (state.answer === "south") state.feedback = "South is the result for downward current. The challenge current is upward.";
      else state.feedback = "The field is tangent to a circle around the wire, not radial toward or away from it.";
      renderAndFocus(renderApp, "#p191-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
