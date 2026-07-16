(function registerFloatingCylindersPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "13.5";
  const G = 9.81;
  const HEEL_RADIANS = 8 * Math.PI / 180;
  const CHALLENGE = Object.freeze({ heightM: 1.2, radiusM: .3, objectDensity: 600, fluidDensity: 1000, fluidName: "Water" });
  const FLUIDS = Object.freeze({ oil: Object.freeze({ name: "Oil", density: 800 }), water: Object.freeze({ name: "Water", density: 1000 }), seawater: Object.freeze({ name: "Seawater", density: 1025 }), glycerin: Object.freeze({ name: "Glycerin", density: 1260 }) });
  const stages = Object.freeze([
    Object.freeze({ short: "Float", title: "Use displacement to find the draft", copy: "Floating equilibrium requires displaced-fluid mass equal to cylinder mass. For a uniform prism, draft d=Hρobject/ρfluid." }),
    Object.freeze({ short: "Metacentre", title: "Measure the waterplane’s leverage", copy: "For the upright circular waterplane, I=πR⁴/4 and BM=I/Vdisplaced=R²/(4d). Wider cylinders gain BM rapidly." }),
    Object.freeze({ short: "Stability", title: "Compare metacentre and centre of mass", copy: "GM=KB+BM−KG. Positive GM gives an initial restoring moment; negative GM makes the upright position unstable." }),
  ]);
  const hints = Object.freeze([
    "The density ratio is 600/1000=0.600, so the 1.20 m cylinder drafts d=0.720 m.",
    "For uniform displacement and mass, KB=d/2=0.360 m and KG=H/2=0.600 m, measured from the bottom.",
    "BM=I/V=[πR⁴/4]/[πR²d]=R²/(4d). Use R=0.300 m.",
    "Combine the signed heights: GM=0.360+0.03125−0.600 m.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p135-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 3) { if (Math.abs(value) < .5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function stabilityData(heightM = state.heightM, radiusM = state.radiusM, objectDensity = state.objectDensity, fluidDensity = state.fluidDensity) {
    const densityRatio = objectDensity / fluidDensity;
    const solidVolume = Math.PI * radiusM ** 2 * heightM;
    const mass = objectDensity * solidVolume;
    const draft = densityRatio * heightM;
    const displacedVolume = Math.PI * radiusM ** 2 * draft;
    const waterplaneInertia = Math.PI * radiusM ** 4 / 4;
    const centreBuoyancy = draft / 2;
    const metacentricRadius = waterplaneInertia / displacedVolume;
    const centreMass = heightM / 2;
    const metacentricHeight = centreBuoyancy + metacentricRadius - centreMass;
    const displacementWeight = mass * G;
    const rightingArm = metacentricHeight * Math.sin(HEEL_RADIANS);
    const rightingMoment = displacementWeight * rightingArm;
    return {
      densityRatio,
      solidVolume,
      mass,
      draft,
      freeboard: heightM - draft,
      displacedVolume,
      waterplaneInertia,
      centreBuoyancy,
      metacentricRadius,
      centreMass,
      metacentricHeight,
      displacementWeight,
      rightingArm,
      rightingMoment,
      stable: metacentricHeight > 1e-10,
      neutral: Math.abs(metacentricHeight) <= 1e-10,
      displacementResidual: fluidDensity * displacedVolume - mass,
      metacentricResidual: metacentricHeight - (centreBuoyancy + metacentricRadius - centreMass),
    };
  }

  function squatTwinData() { return stabilityData(state.heightM / 4, state.radiusM * 2, state.objectDensity, state.fluidDensity); }
  const challengeValues = stabilityData(CHALLENGE.heightM, CHALLENGE.radiusM, CHALLENGE.objectDensity, CHALLENGE.fluidDensity);

  function stabilityLabel(values) { return values.neutral ? "Neutral" : values.stable ? "Initially stable" : "Initially unstable"; }

  function reconstructionNote() {
    return `<p class="p135-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and three-star difficulty. This metacentric-stability investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p135-stage-controls" role="group" aria-label="Floating cylinder stability stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p135-stage" data-p135-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p135-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p135-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Stability classified" : "Next stage"}</button></div>`;
  }

  function cylinderDrawing(values, centreX, waterY, label, comparison = false) {
    const heightPixels = comparison ? Math.max(44, Math.min(100, 105 * (state.heightM / 4) / 1.2)) : Math.max(72, Math.min(178, 145 * state.heightM / 1.2));
    const radiusForDrawing = comparison ? state.radiusM * 2 : state.radiusM;
    const widthPixels = Math.max(45, Math.min(comparison ? 150 : 105, 92 * radiusForDrawing / .3));
    const draftPixels = heightPixels * values.densityRatio;
    const topY = waterY - (heightPixels - draftPixels);
    const bottomY = waterY + draftPixels;
    const heel = comparison ? 0 : 8;
    const gmPixels = clamp(values.metacentricHeight * 65, -55, 55);
    const gravityX = centreX + (comparison ? 0 : 9);
    const buoyancyX = gravityX - gmPixels * Math.sin(HEEL_RADIANS);
    return `<g class="p135-cylinder ${comparison ? "is-comparison" : "is-current"}" aria-hidden="true"><g transform="rotate(${heel} ${centreX} ${waterY})"><rect x="${format(centreX - widthPixels / 2, 2)}" y="${format(topY, 2)}" width="${format(widthPixels, 2)}" height="${format(heightPixels, 2)}" rx="7"/><line class="p135-axis-line" x1="${centreX}" y1="${format(topY, 2)}" x2="${centreX}" y2="${format(bottomY, 2)}"/><circle class="p135-point kg" cx="${centreX}" cy="${format(bottomY - values.centreMass / (comparison ? state.heightM / 4 : state.heightM) * heightPixels, 2)}" r="5"/><circle class="p135-point kb" cx="${centreX}" cy="${format(bottomY - values.centreBuoyancy / (comparison ? state.heightM / 4 : state.heightM) * heightPixels, 2)}" r="5"/></g>${comparison ? "" : `<line class="p135-weight-vector" x1="${format(gravityX, 2)}" y1="${format(waterY - 40, 2)}" x2="${format(gravityX, 2)}" y2="${format(waterY + 38, 2)}"/><line class="p135-buoyancy-vector" x1="${format(buoyancyX, 2)}" y1="${format(waterY + 42, 2)}" x2="${format(buoyancyX, 2)}" y2="${format(waterY - 37, 2)}"/><line class="p135-gz" x1="${format(buoyancyX, 2)}" y1="${format(waterY - 28, 2)}" x2="${format(gravityX, 2)}" y2="${format(waterY - 28, 2)}"/><text class="p135-force-label" x="${format(gravityX + 8, 2)}" y="${format(waterY + 35, 2)}">W</text><text class="p135-force-label" x="${format(buoyancyX - 8, 2)}" y="${format(waterY - 30, 2)}" text-anchor="end">B</text>`}<text class="p135-cylinder-label" x="${centreX}" y="${format(bottomY + 29, 2)}" text-anchor="middle">${label}</text><text class="p135-cylinder-result" x="${centreX}" y="${format(bottomY + 47, 2)}" text-anchor="middle">GM ${signed(values.metacentricHeight, 4)} m · ${stabilityLabel(values)}</text></g>`;
  }

  function stabilitySvg() {
    const values = stabilityData(), squat = squatTwinData();
    const metaVisible = state.stage >= 1 || state.revealed;
    const resultVisible = state.stage >= 2 || state.revealed;
    const statusValue = state.stage === 0 ? `draft ${format(values.draft, 4)} m` : state.stage === 1 ? `BM ${format(values.metacentricRadius, 5)} m` : `GM ${signed(values.metacentricHeight, 5)} m`;
    return `<svg class="p135-svg p135-stage-${state.stage} ${values.stable ? "is-stable" : values.neutral ? "is-neutral" : "is-unstable"}" viewBox="0 0 720 445" role="img" aria-labelledby="p135-svg-title p135-svg-desc"><title id="p135-svg-title">Tall and same-volume squat cylinders floating upright</title><desc id="p135-svg-desc">The current uniform cylinder is ${format(state.heightM, 3)} metres tall and radius ${format(state.radiusM, 3)} metres in ${state.fluidName.toLowerCase()}. Draft is ${format(values.draft, 5)} metres.${metaVisible ? ` Centre of buoyancy is ${format(values.centreBuoyancy, 5)} metres, metacentric radius is ${format(values.metacentricRadius, 5)} metres and centre of mass is ${format(values.centreMass, 5)} metres above the bottom.` : ""}${resultVisible ? ` Signed metacentric height is ${format(values.metacentricHeight, 5)} metres, classified as ${stabilityLabel(values).toLowerCase()}.` : ""}</desc><defs><linearGradient id="p135-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#edc786"/><stop offset="1" stop-color="#bd603f"/></linearGradient><marker id="p135-down" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p135-up" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs><rect class="p135-board" x="1" y="1" width="718" height="443" rx="20"/><rect class="p135-water" x="1" y="194" width="449" height="151"/><line class="p135-waterline" x1="1" y1="194" x2="449" y2="194"/><text class="p135-water-label" x="15" y="216">${state.fluidName} · ρ=${format(state.fluidDensity, 0)} kg/m³</text>${cylinderDrawing(values, 153, 194, "current · 8° heel")}${cylinderDrawing(squat, 342, 194, "same volume · H/4, 2R", true)}<g class="p135-status" aria-hidden="true" transform="translate(470 24)"><rect width="230" height="79" rx="14"/><text class="p135-status-kicker" x="16" y="22">CURRENT CYLINDER</text><text class="p135-status-value" x="16" y="50">${statusValue}</text><text class="p135-status-note" x="16" y="68">density ratio ${format(values.densityRatio, 4)}</text></g><g class="p135-ledger" aria-hidden="true" transform="translate(470 124)"><rect width="230" height="132" rx="14"/><text class="p135-panel-kicker" x="16" y="24">VERTICAL REFERENCE HEIGHTS</text><text class="p135-panel-label" x="16" y="53">KB=d/2</text><text class="p135-panel-number" x="214" y="53" text-anchor="end">${format(values.centreBuoyancy, 5)} m</text><text class="p135-panel-label" x="16" y="80">BM=I/V</text><text class="p135-panel-number" x="214" y="80" text-anchor="end">${metaVisible ? `${format(values.metacentricRadius, 5)} m` : "stage 2"}</text><text class="p135-panel-label" x="16" y="107">KG=H/2</text><text class="p135-panel-number" x="214" y="107" text-anchor="end">${format(values.centreMass, 5)} m</text></g><g class="p135-result-panel" aria-hidden="true" transform="translate(470 278)"><rect width="230" height="138" rx="14"/><text class="p135-panel-kicker" x="16" y="24">SMALL-ANGLE STABILITY</text><text class="p135-result-value" x="115" y="62" text-anchor="middle">${resultVisible ? stabilityLabel(values) : "stage 3"}</text><text class="p135-result-note" x="115" y="87" text-anchor="middle">GM ${resultVisible ? signed(values.metacentricHeight, 5) : "—"} m</text><text class="p135-result-note" x="115" y="108" text-anchor="middle">8° moment ${resultVisible ? signed(values.rightingMoment, 4) : "—"} N·m</text><text class="p135-twin-note" x="115" y="128" text-anchor="middle">squat twin GM ${signed(squat.metacentricHeight, 4)} m</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = stabilityData(), squat = squatTwinData();
    const metaVisible = state.stage >= 1 || state.revealed;
    const resultVisible = state.stage >= 2 || state.revealed;
    return `<section class="p135-metrics" aria-live="polite"><div><span>Draft d</span><strong>${format(values.draft, 5)} m</strong></div><div><span>Displaced volume</span><strong>${format(values.displacedVolume, 6)} m³</strong></div><div><span>Centre of buoyancy KB</span><strong>${format(values.centreBuoyancy, 5)} m</strong></div><div><span>Waterplane inertia I</span><strong>${metaVisible ? `${format(values.waterplaneInertia, 7)} m⁴` : "stage 2"}</strong></div><div><span>Metacentric radius BM</span><strong>${metaVisible ? `${format(values.metacentricRadius, 5)} m` : "stage 2"}</strong></div><div><span>Centre of mass KG</span><strong>${format(values.centreMass, 5)} m</strong></div><div><span>Signed metacentric height GM</span><strong>${resultVisible ? `${signed(values.metacentricHeight, 5)} m` : "stage 3"}</strong></div><div><span>Same-volume squat twin GM</span><strong>${resultVisible ? `${signed(squat.metacentricHeight, 5)} m` : "stage 3"}</strong></div>${resultVisible ? `<p><strong>${stabilityLabel(values)}.</strong> At 8° heel, GZ≈GM sinφ=${signed(values.rightingArm, 5)} m and displacement×GZ=${signed(values.rightingMoment, 5)} N·m. Displacement residual ${values.displacementResidual.toExponential(1)} kg; GM identity residual ${values.metacentricResidual.toExponential(1)} m.</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p135-dynamic">${stabilitySvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p135-controls" aria-label="Floating cylinder controls"><div class="p135-fluid-picker" role="group" aria-label="Choose ideal fluid">${Object.entries(FLUIDS).map(([key,fluid])=>`<button class="chip-button ${state.fluidName===fluid.name?"active":""}" type="button" data-problem-action="p135-fluid" data-p135-fluid="${key}" aria-pressed="${state.fluidName===fluid.name}">${fluid.name}</button>`).join("")}</div><div class="p135-control-grid"><label for="p135-height"><span>Cylinder height H<output data-p135-output="height">${format(state.heightM, 2)} m</output></span><input id="p135-height" type="range" min="0.2" max="2" step="0.05" value="${state.heightM}"/></label><label for="p135-radius"><span>Cylinder radius R<output data-p135-output="radius">${format(state.radiusM, 2)} m</output></span><input id="p135-radius" type="range" min="0.1" max="1" step="0.05" value="${state.radiusM}"/></label><label for="p135-object-density"><span>Object density<output data-p135-output="object-density">${format(state.objectDensity, 0)} kg/m³</output></span><input id="p135-object-density" type="range" min="200" max="750" step="25" value="${state.objectDensity}"/></label><label for="p135-fluid-density"><span>Fluid density<output data-p135-output="fluid-density">${state.fluidName} · ${format(state.fluidDensity, 0)} kg/m³</output></span><input id="p135-fluid-density" type="range" min="800" max="1300" step="10" value="${state.fluidDensity}"/></label></div><p>The squat twin always has one-quarter the current height and twice its radius, so πR²H, mass and density are unchanged. Only shape and waterplane leverage differ.</p><div class="p135-presets"><button class="chip-button" type="button" data-problem-action="p135-preset" data-p135-preset="challenge">Tall challenge</button><button class="chip-button" type="button" data-problem-action="p135-preset" data-p135-preset="squat">Squat stable</button><button class="chip-button" type="button" data-problem-action="p135-preset" data-p135-preset="wide">Widen current</button><button class="chip-button" type="button" data-problem-action="p135-preset" data-p135-preset="dense">Higher density</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p135-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p135-solution" aria-labelledby="p135-solution-heading"><h3 id="p135-solution-heading" tabindex="-1">The narrow waterplane leaves the metacentre too low</h3><div class="p135-solution-equation">d=Hρobject/ρwater=(1.20)(600/1000)=0.720 m<br>KB=d/2=0.360 m<br>KG=H/2=0.600 m</div><div class="p135-solution-equation">BM=[πR⁴/4]/[πR²d]=R²/(4d)<br>=(0.300)²/[4(0.720)]=0.03125 m</div><div class="p135-solution-equation">GM=KB+BM−KG<br>=0.360+0.03125−0.600<br>=${signed(challengeValues.metacentricHeight, 8)} m</div><p>The negative sign means an initial heeling moment grows rather than restores the upright position. The same-volume H/4, 2R squat twin has GM=+0.440 m.</p><p class="p135-checks"><strong>Checks and assumptions.</strong> Fluid mass displaced equals cylinder mass. Increasing R at fixed H and density leaves draft unchanged but raises BM∝R². Scaling all dimensions by a factor scales GM by that factor while preserving its sign. At GM=0 the upright state is neutral to first order. Units: I/V has m⁴/m³=m, and displacement weight times GM sinφ gives N·m. The cylinder is rigid, closed, homogeneous and axisymmetric, floating upright in a quiescent fluid of infinite lateral extent. The formula uses the unheeled circular waterplane and small-angle metacentric theory; φ=8° is illustrative. Waves, viscosity, surface tension, free-surface effects inside the body, deck-edge immersion, nonlinear righting arms and changes of waterplane at finite heel are omitted.</p></section>`;
  }

  function snapshot() {
    const values = stabilityData(), squat = squatTwinData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", model: "uniform closed upright cylinder; small-angle metacentric stability", heelAngleDegrees: 8, heightMetres: state.heightM, radiusMetres: state.radiusM, objectDensityKilogramsPerCubicMetre: state.objectDensity, fluid: state.fluidName, fluidDensityKilogramsPerCubicMetre: state.fluidDensity, massKilograms: Number(values.mass.toFixed(8)), draftMetres: Number(values.draft.toFixed(8)), freeboardMetres: Number(values.freeboard.toFixed(8)), displacedVolumeCubicMetres: Number(values.displacedVolume.toFixed(10)), waterplaneSecondMomentMetresFourth: Number(values.waterplaneInertia.toFixed(10)), centreBuoyancyAboveBottomMetres: Number(values.centreBuoyancy.toFixed(8)), metacentricRadiusMetres: Number(values.metacentricRadius.toFixed(8)), centreMassAboveBottomMetres: Number(values.centreMass.toFixed(8)), signedMetacentricHeightMetres: Number(values.metacentricHeight.toFixed(8)), rightingArmAtEightDegreesMetres: Number(values.rightingArm.toFixed(8)), signedRightingMomentNewtonMetres: Number(values.rightingMoment.toFixed(8)), classification: stabilityLabel(values), sameVolumeSquatTwin: { heightMetres: state.heightM / 4, radiusMetres: state.radiusM * 2, signedMetacentricHeightMetres: Number(squat.metacentricHeight.toFixed(8)), classification: stabilityLabel(squat) }, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p135-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive hydrostatic stability</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p135-spread"><article class="book-page p135-problem-page"><div class="problem-number">Problem 13.5</div><h1 class="book-title p135-title">Floating cylinders</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${reconstructionNote()}<p class="problem-copy">A closed uniform cylinder floats upright in water. It is 1.20 m high, radius 0.300 m and density 600 kg/m³.</p><p class="problem-copy"><strong>Find its signed metacentric height GM and hence classify the upright position.</strong></p><section class="p135-sign-card"><strong>The sign is the point</strong><p>Positive GM produces an initial restoring arm. Negative GM produces an overturning arm, even though vertical buoyancy still equals weight.</p></section><section class="p135-model-card"><div class="eyebrow">Small-angle model</div><p>KB, BM and KG are measured vertically from the cylinder’s bottom in its upright equilibrium.</p></section></article><section class="book-page book-stage p135-stage">${stageControls()}<div class="p135-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p135-coach"><div class="coach-kicker">Locate G below or above M</div><p class="coach-question">For the fixed tall-cylinder challenge, enter signed GM. Include the negative sign if unstable.</p><form class="p135-answer-form" data-p135-answer-form novalidate><label for="p135-answer">Signed metacentric height GM</label><div><input id="p135-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="signed height" autocomplete="off"/><span>m</span></div><button class="primary-button" type="submit">Check GM</button></form>${feedbackMarkup()}<div class="button-row p135-help-row"><button class="secondary-button" type="button" data-problem-action="p135-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p135-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p135-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p135-shell"); if (!root) return;
    const dynamic = root.querySelector(".p135-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { height: `${format(state.heightM, 2)} m`, radius: `${format(state.radiusM, 2)} m`, "object-density": `${format(state.objectDensity, 0)} kg/m³`, "fluid-density": `${state.fluidName} · ${format(state.fluidDensity, 0)} kg/m³` };
    Object.entries(outputs).forEach(([key,value]) => { const output = root.querySelector(`[data-p135-output="${key}"]`); if (output) output.textContent = value; });
    const values = stabilityData();
    root.querySelector("#p135-height")?.setAttribute("aria-valuetext", `Height ${format(state.heightM, 2)} metres; centre of mass ${format(values.centreMass, 3)} metres; GM ${signed(values.metacentricHeight, 4)} metres`);
    root.querySelector("#p135-radius")?.setAttribute("aria-valuetext", `Radius ${format(state.radiusM, 2)} metres; metacentric radius ${format(values.metacentricRadius, 4)} metres; ${stabilityLabel(values)}`);
    root.querySelector("#p135-object-density")?.setAttribute("aria-valuetext", `Object density ${format(state.objectDensity, 0)} kilograms per cubic metre; draft ${format(values.draft, 4)} metres`);
    root.querySelector("#p135-fluid-density")?.setAttribute("aria-valuetext", `Fluid density ${format(state.fluidDensity, 0)} kilograms per cubic metre; draft ${format(values.draft, 4)} metres; GM ${signed(values.metacentricHeight, 4)} metres`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p135-reset") { state = initialState(); renderAndFocus(renderApp, "#p135-height"); return; }
      if (action === "p135-stage") { state.stage = clamp(Number(control.dataset.p135Stage), 0, 2); renderAndFocus(renderApp, `[data-p135-stage="${state.stage}"]`); return; }
      if (action === "p135-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p135-stage="${state.stage}"]`); return; }
      if (action === "p135-fluid") { const fluid = FLUIDS[control.dataset.p135Fluid]; state.fluidName = fluid.name; state.fluidDensity = fluid.density; renderAndFocus(renderApp, `[data-p135-fluid="${control.dataset.p135Fluid}"]`); return; }
      if (action === "p135-preset") {
        const preset = control.dataset.p135Preset;
        if (preset === "challenge") restoreChallenge();
        if (preset === "squat") { restoreChallenge(); state.heightM = .3; state.radiusM = .6; }
        if (preset === "wide") state.radiusM = .9;
        if (preset === "dense") state.objectDensity = 750;
        renderAndFocus(renderApp, "#p135-height"); return;
      }
      if (action === "p135-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p135-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p135-reveal") window.requestAnimationFrame(() => document.querySelector("#p135-solution-heading")?.focus());
    }));
    [["#p135-height", "heightM", .2, 2], ["#p135-radius", "radiusM", .1, 1], ["#p135-object-density", "objectDensity", 200, 750]].forEach(([selector,key,minimum,maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    document.querySelector("#p135-fluid-density")?.addEventListener("input", (event) => { state.fluidDensity = clamp(Number(event.target.value), 800, 1300); state.fluidName = "Custom fluid"; updateDynamicDom(); });
    const input = document.querySelector("#p135-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p135-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = challengeValues.metacentricHeight; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one signed metacentric height in metres.";
      else if (Math.abs(answer + target) < .003) state.feedback = "That is the magnitude with the sign reversed. Since M lies below G, GM must be negative.";
      else if (Math.abs(answer - target) > .002) state.feedback = "Find d, then KB=d/2, BM=R²/(4d), KG=H/2 and combine GM=KB+BM−KG.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.feedback = `Correct: GM=${signed(target, 6)} m, so the tall upright cylinder is initially unstable.`; }
      renderAndFocus(renderApp, "#p135-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
