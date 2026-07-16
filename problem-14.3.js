(function registerMidasStoreroomPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "14.3";
  const GRAVITY = 9.81;
  const BAR_MASS_KG = 12.5;
  const TRUCK_PAYLOAD_KG = 25000;
  const CHALLENGE = Object.freeze({ lengthM: 10, widthM: 6, heightM: 3, fillFraction: 0.8, goldDensityKgM3: 19300 });
  const CHALLENGE_ROOM_VOLUME_M3 = CHALLENGE.lengthM * CHALLENGE.widthM * CHALLENGE.heightM;
  const CHALLENGE_GOLD_VOLUME_M3 = CHALLENGE_ROOM_VOLUME_M3 * CHALLENGE.fillFraction;
  const CHALLENGE_MASS_KG = CHALLENGE_GOLD_VOLUME_M3 * CHALLENGE.goldDensityKgM3;
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Estimate the occupied gold volume", copy: "Multiply length, width and height for room volume, then multiply by the chosen packing fraction. Here packing fraction means solid-gold volume divided by total room volume." }),
    Object.freeze({ short: "Mass", title: "Turn packed volume into mass and weight", copy: "Density converts solid volume to mass: m=ρfLWH. Multiply by g only when a force in newtons is needed." }),
    Object.freeze({ short: "Checks", title: "Translate the result into physical comparisons", copy: "Equivalent 12.5 kg bars, 25 tonne truck payloads and uniformly distributed floor pressure make a million-kilogram answer easier to audit." }),
  ]);
  const hints = Object.freeze([
    "The rectangular room volume is Vroom=LWH=10.0×6.0×3.0=180 m³.",
    "At packing fraction f=0.80, solid-gold volume is Vgold=fVroom=0.80×180=144 m³.",
    "Mass is density times solid volume: m=19,300 kg/m³×144 m³=2,779,200 kg.",
    "Divide by 1000 kg per tonne: 2,779.2 t, which is 2779 t to the nearest tonne.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p143-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 24); }

  function storeroomData(lengthM = state.lengthM, widthM = state.widthM, heightM = state.heightM, fillFraction = state.fillFraction, goldDensityKgM3 = state.goldDensityKgM3) {
    const floorAreaM2 = lengthM * widthM;
    const roomVolumeM3 = floorAreaM2 * heightM;
    const goldVolumeM3 = roomVolumeM3 * fillFraction;
    const massKg = goldDensityKgM3 * goldVolumeM3;
    const massTonnes = massKg / 1000;
    const weightN = massKg * GRAVITY;
    const weightMN = weightN / 1e6;
    const barEquivalents = massKg / BAR_MASS_KG;
    const wholeBars = Math.ceil(barEquivalents - 1e-12);
    const truckloadEquivalents = massKg / TRUCK_PAYLOAD_KG;
    const wholeTruckloads = Math.ceil(truckloadEquivalents - 1e-12);
    const floorPressurePa = weightN / floorAreaM2;
    const floorPressureMPa = floorPressurePa / 1e6;
    const massExponent = Math.floor(Math.log10(massKg));
    const massCoefficient = massKg / 10 ** massExponent;
    return { floorAreaM2, roomVolumeM3, goldVolumeM3, massKg, massTonnes, weightN, weightMN, barEquivalents, wholeBars, truckloadEquivalents, wholeTruckloads, floorPressurePa, floorPressureMPa, massExponent, massCoefficient, massIdentityResidualKg: massKg - goldDensityKgM3 * fillFraction * lengthM * widthM * heightM, pressureIdentityResidualPa: floorPressurePa - goldDensityKgM3 * fillFraction * heightM * GRAVITY };
  }

  function reconstructionNote() {
    return `<p class="p143-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This storeroom estimate, its dimensions, comparison units, diagram and solution are newly written rather than recovered book content.</p>`;
  }

  function stageControls() {
    return `<div class="p143-stage-controls" role="group" aria-label="Midas storeroom estimate stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p143-stage" data-p143-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p143-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p143-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Estimate audited" : "Next stage"}</button></div>`;
  }

  function storeroomSvg() {
    const values = storeroomData();
    const frontWidth = 170 + 100 * (state.lengthM - 2) / 28;
    const depthX = 35 + 45 * (state.widthM - 2) / 18;
    const depthY = depthX * 0.62;
    const roomHeight = 100 + 120 * (state.heightM - 2) / 6;
    const fillHeight = roomHeight * state.fillFraction;
    const frontLeftX = 65, frontRightX = frontLeftX + frontWidth, frontBottomY = 350;
    const backLeftX = frontLeftX + depthX, backRightX = frontRightX + depthX, backBottomY = frontBottomY - depthY;
    const frontTopY = frontBottomY - roomHeight, backTopY = backBottomY - roomHeight;
    const frontFillY = frontBottomY - fillHeight, backFillY = backBottomY - fillHeight;
    const pressureArrowStartY = Math.min(frontFillY + 12, frontBottomY - 10);
    return `<svg class="p143-svg p143-stage-${state.stage}" viewBox="0 0 740 430" role="img" aria-labelledby="p143-svg-title p143-svg-desc">
      <title id="p143-svg-title">Rectangular storeroom gold-mass estimate</title>
      <desc id="p143-svg-desc">A ${format(state.lengthM, 2)} by ${format(state.widthM, 2)} by ${format(state.heightM, 2)} metre storeroom has volume ${format(values.roomVolumeM3, 3)} cubic metres. At packing fraction ${format(state.fillFraction, 3)} and gold density ${format(state.goldDensityKgM3, 0)} kilograms per cubic metre, it contains ${format(values.goldVolumeM3, 3)} cubic metres of solid gold with mass ${format(values.massTonnes, 3)} tonnes and weight ${format(values.weightMN, 4)} meganewtons. That is ${format(values.barEquivalents, 2)} defined 12.5 kilogram bar equivalents, ${format(values.truckloadEquivalents, 3)} defined 25 tonne truck payloads and uniform floor pressure ${format(values.floorPressureMPa, 6)} megapascals.</desc>
      <defs><linearGradient id="p143-gold-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2cd69"/><stop offset="1" stop-color="#b97918"/></linearGradient><linearGradient id="p143-gold-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b97918"/><stop offset="1" stop-color="#8a5610"/></linearGradient><pattern id="p143-bar-grid" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 0H24M0 12H24M0 0V12M12 0V12"/></pattern><marker id="p143-floor-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p143-board" x="1" y="1" width="738" height="428" rx="20"/><text class="p143-board-title" x="22" y="27">VOLUME-EQUIVALENT GOLD FILL · SCHEMATIC</text>
      <g class="p143-room"><path class="p143-back-wall" d="M${format(backLeftX, 2)} ${format(backTopY, 2)}L${format(backRightX, 2)} ${format(backTopY, 2)}L${format(backRightX, 2)} ${format(backBottomY, 2)}L${format(backLeftX, 2)} ${format(backBottomY, 2)}Z"/><path class="p143-side-wall" d="M${format(frontRightX, 2)} ${format(frontTopY, 2)}L${format(backRightX, 2)} ${format(backTopY, 2)}L${format(backRightX, 2)} ${format(backBottomY, 2)}L${format(frontRightX, 2)} ${frontBottomY}Z"/><path class="p143-gold-front" d="M${frontLeftX} ${frontBottomY}H${format(frontRightX, 2)}V${format(frontFillY, 2)}H${frontLeftX}Z"/><path class="p143-gold-side" d="M${format(frontRightX, 2)} ${frontBottomY}L${format(backRightX, 2)} ${format(backBottomY, 2)}V${format(backFillY, 2)}L${format(frontRightX, 2)} ${format(frontFillY, 2)}Z"/><path class="p143-gold-top" d="M${frontLeftX} ${format(frontFillY, 2)}L${format(frontRightX, 2)} ${format(frontFillY, 2)}L${format(backRightX, 2)} ${format(backFillY, 2)}L${format(backLeftX, 2)} ${format(backFillY, 2)}Z"/><path class="p143-gold-grid" d="M${frontLeftX} ${frontBottomY}H${format(frontRightX, 2)}V${format(frontFillY, 2)}H${frontLeftX}Z"/><path class="p143-room-outline" d="M${frontLeftX} ${frontBottomY}V${format(frontTopY, 2)}L${format(backLeftX, 2)} ${format(backTopY, 2)}L${format(backRightX, 2)} ${format(backTopY, 2)}V${format(backBottomY, 2)}L${format(frontRightX, 2)} ${frontBottomY}ZM${frontLeftX} ${format(frontTopY, 2)}H${format(frontRightX, 2)}L${format(backRightX, 2)} ${format(backTopY, 2)}M${format(frontRightX, 2)} ${format(frontTopY, 2)}V${frontBottomY}"/></g>
      <g class="p143-dimensions"><line x1="${frontLeftX}" y1="378" x2="${format(frontRightX, 2)}" y2="378"/><line x1="${frontLeftX}" y1="372" x2="${frontLeftX}" y2="384"/><line x1="${format(frontRightX, 2)}" y1="372" x2="${format(frontRightX, 2)}" y2="384"/><text x="${format((frontLeftX + frontRightX) / 2, 2)}" y="397" text-anchor="middle">L=${format(state.lengthM, 1)} m</text><line x1="${format(frontRightX + 8, 2)}" y1="${frontBottomY + 2}" x2="${format(backRightX + 8, 2)}" y2="${format(backBottomY + 2, 2)}"/><text x="${format(backRightX + 18, 2)}" y="${format(backBottomY + 13, 2)}">W=${format(state.widthM, 1)} m</text><line x1="48" y1="${format(frontTopY, 2)}" x2="48" y2="${frontBottomY}"/><line x1="42" y1="${format(frontTopY, 2)}" x2="54" y2="${format(frontTopY, 2)}"/><line x1="42" y1="${frontBottomY}" x2="54" y2="${frontBottomY}"/><text x="39" y="${format((frontTopY + frontBottomY) / 2, 2)}" text-anchor="end">H=${format(state.heightM, 1)} m</text></g>
      <g class="p143-geometry-label"><rect x="77" y="41" width="287" height="54" rx="11"/><text class="p143-card-kicker" x="92" y="61">PACKING FRACTION f=${format(state.fillFraction, 2)}</text><text class="p143-card-value" x="92" y="82">Vgold=fLWH=${format(values.goldVolumeM3, 3)} m³</text></g>
      <g class="p143-pressure-layer"><line class="p143-floor-arrow" x1="${format((frontLeftX + frontRightX) / 2, 2)}" y1="${format(pressureArrowStartY, 2)}" x2="${format((frontLeftX + frontRightX) / 2, 2)}" y2="${frontBottomY - 2}" marker-end="url(#p143-floor-arrow)"/><text class="p143-floor-label" x="${format((frontLeftX + frontRightX) / 2 + 10, 2)}" y="${frontBottomY - 17}">distributed weight</text></g>
      <g transform="translate(454 22)"><rect class="p143-audit-panel" width="263" height="382" rx="16"/><text class="p143-audit-title" x="18" y="27">FERMI AUDIT · NO PRICE DATA</text><g class="p143-geometry-layer"><text class="p143-audit-kicker" x="18" y="57">1 · GEOMETRY</text><text class="p143-audit-label" x="18" y="82">Room volume</text><text class="p143-audit-value" x="245" y="82" text-anchor="end">${format(values.roomVolumeM3, 3)} m³</text><text class="p143-audit-label" x="18" y="108">Solid-gold volume</text><text class="p143-audit-value is-gold" x="245" y="108" text-anchor="end">${format(values.goldVolumeM3, 3)} m³</text></g><g class="p143-mass-layer"><line class="p143-audit-rule" x1="18" y1="127" x2="245" y2="127"/><text class="p143-audit-kicker" x="18" y="151">2 · MASS AND WEIGHT</text><text class="p143-audit-label" x="18" y="177">m=ρVgold</text><text class="p143-audit-value" x="245" y="177" text-anchor="end">${format(values.massTonnes, 3)} t</text><text class="p143-audit-label" x="18" y="203">W=mg</text><text class="p143-audit-value" x="245" y="203" text-anchor="end">${format(values.weightMN, 4)} MN</text><text class="p143-order-label" x="18" y="225">order check: ${format(values.massCoefficient, 2)}×10^${values.massExponent} kg</text></g><g class="p143-check-layer"><line class="p143-audit-rule" x1="18" y1="242" x2="245" y2="242"/><text class="p143-audit-kicker" x="18" y="266">3 · PHYSICAL CHECKS</text><text class="p143-audit-label" x="18" y="292">Whole 12.5 kg bars</text><text class="p143-audit-value is-gold" x="245" y="292" text-anchor="end">${format(values.wholeBars, 0)}</text><text class="p143-audit-label" x="18" y="318">25 t payload equivalents</text><text class="p143-audit-value" x="245" y="318" text-anchor="end">${format(values.truckloadEquivalents, 3)}</text><text class="p143-audit-label" x="18" y="344">Whole trucks required</text><text class="p143-audit-value" x="245" y="344" text-anchor="end">${format(values.wholeTruckloads, 0)}</text><text class="p143-audit-label" x="18" y="370">Uniform floor pressure</text><text class="p143-audit-value" x="245" y="370" text-anchor="end">${format(values.floorPressureMPa, 4)} MPa</text></g></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = storeroomData();
    return `<section class="p143-metrics" aria-live="polite"><div><span>Solid-gold volume</span><strong>${format(values.goldVolumeM3, 3)} m³</strong></div><div><span>Estimated gold mass</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.massTonnes, 3)} t` : "stage 2"}</strong></div><div><span>Uniform floor pressure</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.floorPressureMPa, 4)} MPa` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p143-dynamic">${storeroomSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p143-controls" aria-label="Storeroom estimate controls"><div class="p143-control-grid"><label for="p143-length"><span>Room length L<output data-p143-output="length">${format(state.lengthM, 1)} m</output></span><input id="p143-length" type="range" min="2" max="30" step="0.5" value="${state.lengthM}"/></label><label for="p143-width"><span>Room width W<output data-p143-output="width">${format(state.widthM, 1)} m</output></span><input id="p143-width" type="range" min="2" max="20" step="0.5" value="${state.widthM}"/></label><label for="p143-height"><span>Room height H<output data-p143-output="height">${format(state.heightM, 1)} m</output></span><input id="p143-height" type="range" min="2" max="8" step="0.25" value="${state.heightM}"/></label><label for="p143-fill"><span>Packing fraction f<output data-p143-output="fill">${format(state.fillFraction * 100, 0)}%</output></span><input id="p143-fill" type="range" min="0.1" max="1" step="0.05" value="${state.fillFraction}"/></label><label class="p143-density-control" for="p143-density"><span>Gold density ρ<output data-p143-output="density">${format(state.goldDensityKgM3, 0)} kg/m³</output></span><input id="p143-density" type="range" min="10000" max="22000" step="100" value="${state.goldDensityKgM3}"/></label></div><p>Comparison units are defined, not market claims: one illustrative bar is exactly 12.5 kg and one truck payload exactly 25,000 kg. Floor pressure assumes load is uniformly distributed over L×W.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p143-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p143-solution" aria-labelledby="p143-solution-heading"><h3 id="p143-solution-heading" tabindex="-1">Volume first, then density</h3><div class="p143-equation">Vroom=LWH=10.0×6.0×3.0=180 m³<br>Vgold=fVroom=0.80×180=144 m³</div><div class="p143-equation is-answer">m=ρVgold=19,300 kg/m³×144 m³<br>=2,779,200 kg=2779.2 t≈2779 t</div><p>The order of magnitude is 10⁶ kg. Three independent translations make that scale tangible:</p><div class="p143-equation">bars=2,779,200/12.5=222,336 equivalents<br>trucks=2,779,200/25,000=111.168 payloads → 112 whole trucks<br>W=mg=27,263,952 N</div><p>With uniform loading across the 60 m² floor,</p><div class="p143-equation">p=W/(LW)=27,263,952/60<br>=454,399.2 Pa=0.4543992 MPa</div><p>The floor pressure also simplifies to p=ρfgH, so changing room length or width changes total mass but not pressure when fill fraction and filled height stay fixed.</p><p class="p143-limits"><strong>Assumptions and scope.</strong> The room is a rectangular prism; density is uniform; packing fraction is the solid-gold volume divided by total room volume; voids or unused volume account for the rest. The drawing shows an equivalent fill height rather than literal bar stacking. Weight uses g=9.81 m/s². Bar and truck values are exact comparison definitions for this activity, not specifications for every real bar or vehicle. The floor load is treated as uniform and ignores room structure, containers, local contact stresses and load paths. No commodity price, exchange rate or valuation is used.</p></section>`;
  }

  function snapshot() {
    const values = storeroomData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", modelBoundary: "rectangular room; uniform density; packing fraction as solid volume fraction; uniformly distributed floor load; no price data", gravityMetresPerSecondSquared: GRAVITY, comparisonBarMassKilograms: BAR_MASS_KG, comparisonTruckPayloadKilograms: TRUCK_PAYLOAD_KG, roomLengthMetres: state.lengthM, roomWidthMetres: state.widthM, roomHeightMetres: state.heightM, packingFraction: state.fillFraction, goldDensityKilogramsPerCubicMetre: state.goldDensityKgM3, floorAreaSquareMetres: Number(values.floorAreaM2.toFixed(9)), roomVolumeCubicMetres: Number(values.roomVolumeM3.toFixed(9)), solidGoldVolumeCubicMetres: Number(values.goldVolumeM3.toFixed(9)), goldMassKilograms: Number(values.massKg.toFixed(6)), goldMassTonnes: Number(values.massTonnes.toFixed(9)), weightNewtons: Number(values.weightN.toFixed(6)), barEquivalents: Number(values.barEquivalents.toFixed(9)), wholeComparisonBars: values.wholeBars, truckPayloadEquivalents: Number(values.truckloadEquivalents.toFixed(9)), wholeTruckloadsRequired: values.wholeTruckloads, uniformFloorPressurePascals: Number(values.floorPressurePa.toFixed(6)), massIdentityResidualKilograms: Number(values.massIdentityResidualKg.toExponential(6)), pressureIdentityResidualPascals: Number(values.pressureIdentityResidualPa.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p143-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive Fermi estimation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p143-spread"><article class="book-page p143-problem-page"><div class="problem-number">Problem 14.3</div><h1 class="book-title p143-title">Midas’ storeroom</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A rectangular storeroom measures 10.0 m×6.0 m×3.0 m. Gold occupies 80% of its volume after allowing for gaps and unused space. Use gold density 19,300 kg/m³.</p><p class="problem-copy"><strong>Estimate the mass of gold to the nearest tonne.</strong></p><section class="p143-observation-card"><strong>Separate volume from packing</strong><p>Room volume is not solid-gold volume. Apply the 0.80 packing fraction before multiplying by density.</p></section><section class="p143-model-card"><div class="eyebrow">Physical estimate, not a valuation</div><p>Bar and truck comparisons are defined mass units. No commodity price or live market data enters the activity.</p></section></article><section class="book-page book-stage p143-stage">${stageControls()}<div class="p143-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p143-coach"><div class="coach-kicker">Estimate Midas’ hoard</div><p class="coach-question">Enter the packed gold mass for the stated room, rounded to the nearest tonne.</p><form class="p143-answer-form" data-p143-answer-form novalidate><label for="p143-answer">Estimated gold mass</label><div><input id="p143-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="nearest tonne" autocomplete="off"/><span>t</span></div><button class="primary-button" type="submit">Check mass estimate</button></form>${feedbackMarkup()}<div class="button-row p143-help-row"><button class="secondary-button" type="button" data-problem-action="p143-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p143-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p143-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p143-shell"); if (!root) return;
    const dynamic = root.querySelector(".p143-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = storeroomData();
    const outputs = { length: `${format(state.lengthM, 1)} m`, width: `${format(state.widthM, 1)} m`, height: `${format(state.heightM, 1)} m`, fill: `${format(state.fillFraction * 100, 0)}%`, density: `${format(state.goldDensityKgM3, 0)} kg/m³` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p143-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p143-length")?.setAttribute("aria-valuetext", `Room length ${format(state.lengthM, 1)} metres; room volume ${format(values.roomVolumeM3, 2)} cubic metres`);
    root.querySelector("#p143-width")?.setAttribute("aria-valuetext", `Room width ${format(state.widthM, 1)} metres; floor area ${format(values.floorAreaM2, 2)} square metres`);
    root.querySelector("#p143-height")?.setAttribute("aria-valuetext", `Room height ${format(state.heightM, 1)} metres; uniform floor pressure ${format(values.floorPressureMPa, 4)} megapascals`);
    root.querySelector("#p143-fill")?.setAttribute("aria-valuetext", `Packing fraction ${format(state.fillFraction * 100, 0)} percent; solid gold volume ${format(values.goldVolumeM3, 2)} cubic metres`);
    root.querySelector("#p143-density")?.setAttribute("aria-valuetext", `Gold density ${format(state.goldDensityKgM3, 0)} kilograms per cubic metre; mass ${format(values.massTonnes, 2)} tonnes`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p143-reset") { state = initialState(); renderAndFocus(renderApp, "#p143-length"); return; }
      if (action === "p143-stage") { state.stage = clamp(Number(control.dataset.p143Stage), 0, 2); renderAndFocus(renderApp, `[data-p143-stage="${state.stage}"]`); return; }
      if (action === "p143-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p143-stage="${state.stage}"]`); return; }
      if (action === "p143-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p143-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p143-reveal") window.requestAnimationFrame(() => document.querySelector("#p143-solution-heading")?.focus());
    }));
    [["#p143-length", "lengthM", 2, 30], ["#p143-width", "widthM", 2, 20], ["#p143-height", "heightM", 2, 8], ["#p143-fill", "fillFraction", 0.1, 1], ["#p143-density", "goldDensityKgM3", 10000, 22000]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); state.feedback = ""; state.committed = false; updateDynamicDom(); }));
    const input = document.querySelector("#p143-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p143-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter the estimated gold mass in tonnes, rounded to the nearest tonne.";
      else if (Math.abs(answer - CHALLENGE_MASS_KG) < 2) state.feedback = "That is the mass in kilograms. Divide by 1000 to convert kilograms to tonnes.";
      else if (Math.abs(answer - CHALLENGE_GOLD_VOLUME_M3) < .1) state.feedback = "That is the packed gold volume in cubic metres. Multiply it by gold density, then convert kilograms to tonnes.";
      else if (Math.abs(answer - 2779) > .51) state.feedback = "Find LWH, apply the 0.80 packing fraction, multiply by 19,300 kg/m³, then divide by 1000 kg/t.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: the estimate is ${format(CHALLENGE_MASS_KG, 0)} kg=${format(CHALLENGE_MASS_KG / 1000, 1)} t, or 2779 t to the nearest tonne.`; }
      renderAndFocus(renderApp, "#p143-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
