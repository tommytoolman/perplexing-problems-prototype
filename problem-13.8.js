(function registerFloatingBarPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "13.8";
  const G = 9.81;
  const CHALLENGE = Object.freeze({ lengthM: 3, barDensity: 400, fluidDensity: 1000, fluidName: "Water", supportDepthM: 1.2, areaCm2: 100, supportMode: "tether" });
  const FLUIDS = Object.freeze({ oil: Object.freeze({ name: "Oil", density: 800 }), water: Object.freeze({ name: "Water", density: 1000 }), seawater: Object.freeze({ name: "Seawater", density: 1025 }), glycerin: Object.freeze({ name: "Glycerin", density: 1260 }) });
  const stages = Object.freeze([
    Object.freeze({ short: "Forces", title: "Locate weight and buoyancy centroids", copy: "Weight acts at L/2 along the uniform bar. If submerged length is s, buoyancy acts at s/2 along the submerged segment." }),
    Object.freeze({ short: "Moments", title: "Let moments select the submerged length", copy: "About the lower support, vertical-force moment arms share cosθ. Their balance gives s=L√(ρbar/ρfluid)." }),
    Object.freeze({ short: "Geometry", title: "Fit that submerged length to the support depth", copy: "For lower-end depth h, s sinθ=h. A partial equilibrium exists only when ρbar<ρfluid and h≤s<L." }),
  ]);
  const hints = Object.freeze([
    "Take moments about the lower end. The vertical weight and buoyancy lever arms are (L/2)cosθ and (s/2)cosθ.",
    "Cancelling common factors gives ρfluid s²=ρbar L², hence s=L√(ρbar/ρfluid).",
    "For ρbar/ρwater=0.400 and L=3.00 m, s=3√0.4 m.",
    "The lower end is h=1.20 m below the surface, so sinθ=h/s. Convert θ to degrees.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p138-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function barData(
    lengthM = state.lengthM,
    barDensity = state.barDensity,
    fluidDensity = state.fluidDensity,
    supportDepthM = state.supportDepthM,
    areaCm2 = state.areaCm2,
    supportMode = state.supportMode,
  ) {
    const area = areaCm2 * 1e-4;
    const densityRatio = barDensity / fluidDensity;
    const mass = barDensity * area * lengthM;
    const weight = mass * G;
    const momentSelectedSubmergedLength = lengthM * Math.sqrt(densityRatio);
    let regime;
    if (densityRatio >= 1) regime = "sinking";
    else if (supportDepthM >= lengthM) regime = "full";
    else if (supportDepthM > momentSelectedSubmergedLength) regime = "impossible";
    else regime = "partial";
    const submergedLength = regime === "full" || regime === "sinking" ? lengthM : momentSelectedSubmergedLength;
    const buoyancy = fluidDensity * G * area * submergedLength;
    const supportVerticalOnBar = weight - buoyancy;
    const supportForceMagnitude = Math.abs(supportVerticalOnBar);
    const supportDirection = supportVerticalOnBar >= 0 ? "upward" : "downward";
    const tetherFeasible = supportVerticalOnBar <= 1e-10;
    const angleRadians = regime === "partial" ? Math.asin(supportDepthM / momentSelectedSubmergedLength) : regime === "full" ? Math.PI / 2 : null;
    const angleDegrees = angleRadians === null ? null : angleRadians * 180 / Math.PI;
    const weightCentroid = lengthM / 2;
    const buoyancyCentroid = submergedLength / 2;
    const momentResidual = regime === "partial" && angleRadians !== null ? buoyancy * buoyancyCentroid * Math.cos(angleRadians) - weight * weightCentroid * Math.cos(angleRadians) : null;
    return {
      area,
      densityRatio,
      mass,
      weight,
      momentSelectedSubmergedLength,
      submergedLength,
      emergedLength: Math.max(0, lengthM - submergedLength),
      buoyancy,
      supportVerticalOnBar,
      supportForceMagnitude,
      supportDirection,
      tetherFeasible,
      angleRadians,
      angleDegrees,
      weightCentroid,
      buoyancyCentroid,
      regime,
      momentResidual,
      forceResidual: buoyancy + supportVerticalOnBar - weight,
      geometryResidual: angleRadians === null ? null : submergedLength * Math.sin(angleRadians) - supportDepthM,
      supportMode,
    };
  }

  const challengeValues = barData(CHALLENGE.lengthM, CHALLENGE.barDensity, CHALLENGE.fluidDensity, CHALLENGE.supportDepthM, CHALLENGE.areaCm2, CHALLENGE.supportMode);

  function regimeLabel(values) {
    if (values.regime === "partial") return "Partial equilibrium";
    if (values.regime === "full") return "Fully submerged regime";
    if (values.regime === "sinking") return "No floating equilibrium";
    return "Partial geometry impossible";
  }

  function supportLabel(values) {
    if (state.supportMode === "tether") return values.tetherFeasible ? `tension ${format(values.supportForceMagnitude, 3)} N downward` : "tether cannot push upward";
    return `pin reaction ${format(values.supportForceMagnitude, 3)} N ${values.supportDirection}`;
  }

  function reconstructionNote() {
    return `<p class="p138-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and four-star difficulty. This supported-floating-bar investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p138-stage-controls" role="group" aria-label="Floating bar equilibrium stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p138-stage" data-p138-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p138-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p138-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Regime classified" : "Next stage"}</button></div>`;
  }

  function equilibriumSvg() {
    const values = barData();
    const momentsVisible = state.stage >= 1 || state.revealed;
    const geometryVisible = state.stage >= 2 || state.revealed;
    const waterY = 151, supportX = 86;
    const supportDepthPixels = Math.min(185, 45 + 45 * state.supportDepthM);
    const lowerY = waterY + supportDepthPixels;
    const angle = values.angleRadians === null ? Math.PI / 3 : values.angleRadians;
    const barPixels = 300;
    const topX = supportX + barPixels * Math.cos(angle);
    const topY = lowerY - barPixels * Math.sin(angle);
    const submergedFraction = Math.min(1, values.submergedLength / state.lengthM);
    const waterX = supportX + barPixels * submergedFraction * Math.cos(angle);
    const lineWaterY = lowerY - barPixels * submergedFraction * Math.sin(angle);
    const weightX = supportX + barPixels * .5 * Math.cos(angle), weightY = lowerY - barPixels * .5 * Math.sin(angle);
    const buoyX = supportX + barPixels * submergedFraction * .5 * Math.cos(angle), buoyY = lowerY - barPixels * submergedFraction * .5 * Math.sin(angle);
    const statusValue = state.stage === 0 ? `W ${format(values.weight, 3)} N · B ${format(values.buoyancy, 3)} N` : state.stage === 1 ? `s=L√ρb/ρf=${format(values.momentSelectedSubmergedLength, 5)} m` : values.regime === "partial" ? `θ=${format(values.angleDegrees, 5)}°` : regimeLabel(values).toUpperCase();
    const resultDetail = geometryVisible ? ` Regime is ${regimeLabel(values).toLowerCase()}.${values.angleDegrees === null ? "" : ` Equilibrium angle is ${format(values.angleDegrees, 5)} degrees above horizontal.`}` : "";
    return `<svg class="p138-svg p138-stage-${state.stage} is-${values.regime}" viewBox="0 0 720 445" role="img" aria-labelledby="p138-svg-title p138-svg-desc"><title id="p138-svg-title">Slender bar partly submerged and supported at its lower end</title><desc id="p138-svg-desc">A ${format(state.lengthM, 2)} metre uniform bar has density ${format(state.barDensity, 0)} kilograms per cubic metre and lower-end depth ${format(state.supportDepthM, 2)} metres in ${state.fluidName.toLowerCase()}. Weight is ${format(values.weight, 4)} newtons and moment-selected submerged length is ${format(values.momentSelectedSubmergedLength, 5)} metres.${momentsVisible ? ` Buoyancy is ${format(values.buoyancy, 4)} newtons acting halfway along the submerged segment.` : ""}${resultDetail}</desc><defs><linearGradient id="p138-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76c2db" stop-opacity=".48"/><stop offset="1" stop-color="#287d9f" stop-opacity=".72"/></linearGradient><marker id="p138-up" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p138-down" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs><rect class="p138-board" x="1" y="1" width="718" height="443" rx="20"/><rect class="p138-water" x="1" y="${waterY}" width="451" height="293" fill="url(#p138-water)"/><line class="p138-waterline" x1="1" y1="${waterY}" x2="451" y2="${waterY}"/><text class="p138-water-label" x="16" y="${waterY + 21}">${state.fluidName} · ρ=${format(state.fluidDensity, 0)} kg/m³</text><g class="p138-diagram" aria-hidden="true"><line class="p138-bar" x1="${supportX}" y1="${format(lowerY, 2)}" x2="${format(topX, 2)}" y2="${format(topY, 2)}"/><line class="p138-submerged" x1="${supportX}" y1="${format(lowerY, 2)}" x2="${format(waterX, 2)}" y2="${format(lineWaterY, 2)}"/><circle class="p138-support" cx="${supportX}" cy="${format(lowerY, 2)}" r="10"/><line class="p138-depth" x1="54" y1="${waterY}" x2="54" y2="${format(lowerY, 2)}"/><text class="p138-depth-label" x="45" y="${format((waterY + lowerY) / 2, 2)}" text-anchor="end">h=${format(state.supportDepthM, 2)} m</text><circle class="p138-centroid weight" cx="${format(weightX, 2)}" cy="${format(weightY, 2)}" r="6"/><circle class="p138-centroid buoyancy" cx="${format(buoyX, 2)}" cy="${format(buoyY, 2)}" r="6"/><line class="p138-weight-vector" x1="${format(weightX, 2)}" y1="${format(weightY - 25, 2)}" x2="${format(weightX, 2)}" y2="${format(weightY + 45, 2)}" marker-end="url(#p138-down)"/><line class="p138-buoyancy-vector" x1="${format(buoyX, 2)}" y1="${format(buoyY + 35, 2)}" x2="${format(buoyX, 2)}" y2="${format(buoyY - 42, 2)}" marker-end="url(#p138-up)"/><text class="p138-force-label" x="${format(weightX + 10, 2)}" y="${format(weightY + 37, 2)}">W at L/2</text><text class="p138-force-label" x="${format(buoyX - 10, 2)}" y="${format(buoyY - 34, 2)}" text-anchor="end">B at s/2</text><line class="p138-support-vector ${values.supportDirection}" x1="${supportX}" y1="${format(lowerY, 2)}" x2="${supportX}" y2="${format(lowerY + (values.supportDirection === "downward" ? 54 : -54), 2)}" marker-end="url(#${values.supportDirection === "downward" ? "p138-down" : "p138-up"})"/><text class="p138-bar-label" x="${format((supportX + topX) / 2, 2)}" y="${format((lowerY + topY) / 2 - 14, 2)}" text-anchor="middle">L=${format(state.lengthM, 2)} m · A=${format(state.areaCm2, 0)} cm²</text>${geometryVisible && values.regime === "partial" ? `<path class="p138-angle-arc" d="M${supportX + 45} ${format(lowerY, 2)}A45 45 0 0 0 ${format(supportX + 45 * Math.cos(angle), 2)} ${format(lowerY - 45 * Math.sin(angle), 2)}"/><text class="p138-angle-label" x="${supportX + 52}" y="${format(lowerY - 15, 2)}">${format(values.angleDegrees, 3)}°</text>` : ""}</g><g class="p138-status" aria-hidden="true" transform="translate(470 24)"><rect width="230" height="79" rx="14"/><text class="p138-status-kicker" x="16" y="22">${state.supportMode === "tether" ? "BOTTOM TETHER" : "PIN SUPPORT"}</text><text class="p138-status-value" x="16" y="50">${statusValue}</text><text class="p138-status-note" x="16" y="68">density ratio ${format(values.densityRatio, 4)}</text></g><g class="p138-moment-panel" aria-hidden="true" transform="translate(470 124)"><rect width="230" height="132" rx="14"/><text class="p138-panel-kicker" x="16" y="24">MOMENTS ABOUT LOWER END</text><text class="p138-equation" x="115" y="55" text-anchor="middle">B(s/2)cosθ=W(L/2)cosθ</text><text class="p138-panel-label" x="16" y="84">selected submerged s</text><text class="p138-panel-number" x="214" y="84" text-anchor="end">${momentsVisible ? `${format(values.momentSelectedSubmergedLength, 5)} m` : "stage 2"}</text><text class="p138-panel-label" x="16" y="109">emerged L−s</text><text class="p138-panel-number" x="214" y="109" text-anchor="end">${momentsVisible ? `${format(values.emergedLength, 5)} m` : "stage 2"}</text></g><g class="p138-result-panel" aria-hidden="true" transform="translate(470 278)"><rect width="230" height="138" rx="14"/><text class="p138-panel-kicker" x="16" y="24">SUPPORT GEOMETRY + FORCE</text><text class="p138-result-value" x="115" y="58" text-anchor="middle">${geometryVisible ? regimeLabel(values) : "stage 3"}</text><text class="p138-result-note" x="115" y="84" text-anchor="middle">${geometryVisible && values.angleDegrees !== null ? `θ=${format(values.angleDegrees, 5)}° above horizontal` : "require h≤s<L"}</text><text class="p138-result-note" x="115" y="106" text-anchor="middle">${geometryVisible ? supportLabel(values) : "vertical force balance"}</text><text class="p138-regime-note" x="115" y="126" text-anchor="middle">${values.regime === "impossible" ? "support is deeper than selected draft" : values.regime === "sinking" ? "bar density is not below fluid density" : values.regime === "full" ? "support depth forces full immersion" : "partial slender-bar solution"}</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = barData();
    const momentsVisible = state.stage >= 1 || state.revealed;
    const geometryVisible = state.stage >= 2 || state.revealed;
    return `<section class="p138-metrics" aria-live="polite"><div><span>Bar mass</span><strong>${format(values.mass, 4)} kg</strong></div><div><span>Weight W</span><strong>${format(values.weight, 4)} N</strong></div><div><span>Moment-selected submerged s</span><strong>${momentsVisible ? `${format(values.momentSelectedSubmergedLength, 5)} m` : "stage 2"}</strong></div><div><span>Buoyancy B</span><strong>${momentsVisible ? `${format(values.buoyancy, 4)} N` : "stage 2"}</strong></div><div><span>Equilibrium angle</span><strong>${geometryVisible && values.angleDegrees !== null ? `${format(values.angleDegrees, 5)}°` : geometryVisible ? "not partial" : "stage 3"}</strong></div><div><span>${state.supportMode === "tether" ? "Required tension" : "Pin reaction magnitude"}</span><strong>${geometryVisible ? `${format(values.supportForceMagnitude, 4)} N` : "stage 3"}</strong></div>${geometryVisible ? `<p><strong>${regimeLabel(values)}.</strong> ${supportLabel(values)}. Force residual ${values.forceResidual.toExponential(1)} N; ${values.momentResidual === null ? "moment residual not defined outside partial equilibrium" : `moment residual ${values.momentResidual.toExponential(1)} N·m`}; ${values.geometryResidual === null ? "geometry residual not defined" : `geometry residual ${values.geometryResidual.toExponential(1)} m`}.</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p138-dynamic">${equilibriumSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p138-controls" aria-label="Supported floating bar controls"><div class="p138-support-picker" role="group" aria-label="Choose lower-end support"><button class="chip-button ${state.supportMode === "tether" ? "active" : ""}" type="button" data-problem-action="p138-support" data-p138-support="tether" aria-pressed="${state.supportMode === "tether"}">Bottom tether</button><button class="chip-button ${state.supportMode === "hinge" ? "active" : ""}" type="button" data-problem-action="p138-support" data-p138-support="hinge" aria-pressed="${state.supportMode === "hinge"}">Pin support</button></div><div class="p138-fluid-picker" role="group" aria-label="Choose ideal fluid">${Object.entries(FLUIDS).map(([key,fluid])=>`<button class="chip-button ${state.fluidName===fluid.name?"active":""}" type="button" data-problem-action="p138-fluid" data-p138-fluid="${key}" aria-pressed="${state.fluidName===fluid.name}">${fluid.name}</button>`).join("")}</div><div class="p138-control-grid"><label for="p138-length"><span>Bar length L<output data-p138-output="length">${format(state.lengthM, 2)} m</output></span><input id="p138-length" type="range" min="1" max="5" step="0.1" value="${state.lengthM}"/></label><label for="p138-depth"><span>Lower-end depth h<output data-p138-output="depth">${format(state.supportDepthM, 2)} m</output></span><input id="p138-depth" type="range" min="0.1" max="5" step="0.1" value="${state.supportDepthM}"/></label><label for="p138-bar-density"><span>Bar density<output data-p138-output="bar-density">${format(state.barDensity, 0)} kg/m³</output></span><input id="p138-bar-density" type="range" min="200" max="1200" step="25" value="${state.barDensity}"/></label><label for="p138-fluid-density"><span>Fluid density<output data-p138-output="fluid-density">${state.fluidName} · ${format(state.fluidDensity, 0)} kg/m³</output></span><input id="p138-fluid-density" type="range" min="800" max="1300" step="10" value="${state.fluidDensity}"/></label><label class="p138-area-control" for="p138-area"><span>Bar cross-sectional area A<output data-p138-output="area">${format(state.areaCm2, 0)} cm²</output></span><input id="p138-area" type="range" min="20" max="300" step="10" value="${state.areaCm2}"/></label></div><p>Area cancels from submerged length and angle but scales weight, buoyancy and support force. A tether can pull downward only; a pin can supply either vertical reaction.</p><div class="p138-presets"><button class="chip-button" type="button" data-problem-action="p138-preset" data-p138-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p138-preset" data-p138-preset="deep">Too deep</button><button class="chip-button" type="button" data-problem-action="p138-preset" data-p138-preset="full">Fully submerged</button><button class="chip-button" type="button" data-problem-action="p138-preset" data-p138-preset="sink">Dense bar</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p138-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p138-solution" aria-labelledby="p138-solution-heading"><h3 id="p138-solution-heading" tabindex="-1">Moments choose the draft before geometry chooses the angle</h3><p>For cross-sectional area A, weight W=ρbALg acts at L/2 and buoyancy B=ρfAsg acts at s/2. Taking moments about the supported lower end:</p><div class="p138-solution-equation">(ρfAsg)(s/2)cosθ=(ρbALg)(L/2)cosθ<br>s=L√(ρb/ρf)=3√(400/1000)<br>s=${format(challengeValues.momentSelectedSubmergedLength, 9)} m</div><p>The lower end is h=1.20 m below the waterline:</p><div class="p138-solution-equation">s sinθ=h<br>θ=sin⁻¹(1.20/${format(challengeValues.momentSelectedSubmergedLength, 9)})<br>θ=${format(challengeValues.angleDegrees, 9)}°</div><p>Vertical balance requires a downward support force B−W=${format(challengeValues.supportForceMagnitude, 6)} N, which a bottom tether can provide.</p><p class="p138-checks"><strong>Checks and regimes.</strong> Area and g cancel from s and θ but not from tension. A shallower support reduces θ; at h=s the partial bar is vertical. If h>s, the moment-selected submerged segment cannot reach the waterline and no partial solution exists. If h≥L the geometry forces full immersion. If ρb≥ρf, s≥L and the partial floating solution disappears; a simple downward tether cannot keep a denser bar afloat. Units: densities ratio is dimensionless, s and h are metres, and ρgAs is newtons. The bar is rigid, uniform, slender and of constant section; buoyancy per submerged length is uniform. The fluid is quiescent and unbounded, the tether is vertical and massless, the pin is frictionless, and equilibrium is quasistatic. Bar thickness, capillary effects, waves, drag, support moments and deformation are omitted.</p></section>`;
  }

  function snapshot() {
    const values = barData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", model: "uniform slender bar with vertical lower-end tether or ideal pin", gravitationalAccelerationMetresPerSecondSquared: G, supportMode: state.supportMode, supportDepthMetres: state.supportDepthM, lengthMetres: state.lengthM, crossSectionSquareCentimetres: state.areaCm2, barDensityKilogramsPerCubicMetre: state.barDensity, fluid: state.fluidName, fluidDensityKilogramsPerCubicMetre: state.fluidDensity, densityRatio: Number(values.densityRatio.toFixed(9)), massKilograms: Number(values.mass.toFixed(8)), weightNewtons: Number(values.weight.toFixed(8)), momentSelectedSubmergedLengthMetres: Number(values.momentSelectedSubmergedLength.toFixed(8)), actualModelSubmergedLengthMetres: Number(values.submergedLength.toFixed(8)), buoyancyNewtons: Number(values.buoyancy.toFixed(8)), angleDegrees: values.angleDegrees === null ? null : Number(values.angleDegrees.toFixed(8)), verticalSupportForceOnBarNewtons: Number(values.supportVerticalOnBar.toFixed(8)), supportDirection: values.supportDirection, tetherFeasible: values.tetherFeasible, regime: values.regime, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p138-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive hydrostatic equilibrium</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p138-spread"><article class="book-page p138-problem-page"><div class="problem-number">Problem 13.8</div><h1 class="book-title p138-title">The floating bar</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div>${reconstructionNote()}<p class="problem-copy">A uniform 3.00 m slender bar of density 400 kg/m³ and cross-section 100 cm² is held by a vertical bottom tether at its lower end, 1.20 m below a water surface. The other end rises out of the water.</p><p class="problem-copy"><strong>Find the equilibrium angle of the bar above the horizontal.</strong></p><section class="p138-order-card"><strong>Use equilibrium before geometry</strong><p>Moment balance determines how much bar must be submerged. Only then can the fixed support depth determine its angle.</p></section><section class="p138-model-card"><div class="eyebrow">Slender-bar model</div><p>Weight and distributed buoyancy are replaced by vertical resultants at their respective segment centroids.</p></section></article><section class="book-page book-stage p138-stage">${stageControls()}<div class="p138-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p138-coach"><div class="coach-kicker">Moments, then sine</div><p class="coach-question">For the fixed water challenge, enter the equilibrium angle above horizontal.</p><form class="p138-answer-form" data-p138-answer-form novalidate><label for="p138-answer">Equilibrium angle</label><div><input id="p138-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="angle in degrees" autocomplete="off"/><span>°</span></div><button class="primary-button" type="submit">Check angle</button></form>${feedbackMarkup()}<div class="button-row p138-help-row"><button class="secondary-button" type="button" data-problem-action="p138-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p138-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p138-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root=document.querySelector(".p138-shell");if(!root)return;const dynamic=root.querySelector(".p138-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();
    const outputs={length:`${format(state.lengthM,2)} m`,depth:`${format(state.supportDepthM,2)} m`,"bar-density":`${format(state.barDensity,0)} kg/m³`,"fluid-density":`${state.fluidName} · ${format(state.fluidDensity,0)} kg/m³`,area:`${format(state.areaCm2,0)} cm²`};Object.entries(outputs).forEach(([key,value])=>{const output=root.querySelector(`[data-p138-output="${key}"]`);if(output)output.textContent=value;});
    const values=barData();root.querySelector("#p138-length")?.setAttribute("aria-valuetext",`Bar length ${format(state.lengthM,2)} metres; selected submerged length ${format(values.momentSelectedSubmergedLength,4)} metres`);root.querySelector("#p138-depth")?.setAttribute("aria-valuetext",`Lower-end depth ${format(state.supportDepthM,2)} metres; ${regimeLabel(values)}${values.angleDegrees===null?"":`; angle ${format(values.angleDegrees,3)} degrees`}`);root.querySelector("#p138-bar-density")?.setAttribute("aria-valuetext",`Bar density ${format(state.barDensity,0)} kilograms per cubic metre; density ratio ${format(values.densityRatio,3)}`);root.querySelector("#p138-fluid-density")?.setAttribute("aria-valuetext",`Fluid density ${format(state.fluidDensity,0)} kilograms per cubic metre; ${regimeLabel(values)}`);root.querySelector("#p138-area")?.setAttribute("aria-valuetext",`Cross-sectional area ${format(state.areaCm2,0)} square centimetres; support force ${format(values.supportForceMagnitude,3)} newtons`);
  }

  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}) {
    document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p138-reset"){state=initialState();renderAndFocus(renderApp,"#p138-length");return;}if(action==="p138-stage"){state.stage=clamp(Number(control.dataset.p138Stage),0,2);renderAndFocus(renderApp,`[data-p138-stage="${state.stage}"]`);return;}if(action==="p138-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p138-stage="${state.stage}"]`);return;}if(action==="p138-support"){state.supportMode=control.dataset.p138Support;renderAndFocus(renderApp,`[data-p138-support="${state.supportMode}"]`);return;}if(action==="p138-fluid"){const fluid=FLUIDS[control.dataset.p138Fluid];state.fluidName=fluid.name;state.fluidDensity=fluid.density;renderAndFocus(renderApp,`[data-p138-fluid="${control.dataset.p138Fluid}"]`);return;}if(action==="p138-preset"){const preset=control.dataset.p138Preset;if(preset==="challenge")restoreChallenge();if(preset==="deep"){restoreChallenge();state.supportDepthM=2.2;}if(preset==="full"){restoreChallenge();state.supportDepthM=3;}if(preset==="sink"){restoreChallenge();state.barDensity=1100;}renderAndFocus(renderApp,"#p138-length");return;}if(action==="p138-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p138-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p138-reveal")window.requestAnimationFrame(()=>document.querySelector("#p138-solution-heading")?.focus());}));
    [["#p138-length","lengthM",1,5],["#p138-depth","supportDepthM",.1,5],["#p138-bar-density","barDensity",200,1200],["#p138-area","areaCm2",20,300]].forEach(([selector,key,min,max])=>document.querySelector(selector)?.addEventListener("input",event=>{state[key]=clamp(Number(event.target.value),min,max);updateDynamicDom();}));document.querySelector("#p138-fluid-density")?.addEventListener("input",event=>{state.fluidDensity=clamp(Number(event.target.value),800,1300);state.fluidName="Custom fluid";updateDynamicDom();});
    const input=document.querySelector("#p138-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p138-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer),target=challengeValues.angleDegrees;state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one angle in degrees.";else if(Math.abs(answer-challengeValues.angleRadians)<.01)state.feedback="That is the angle in radians. Convert it to degrees.";else if(Math.abs(answer-target)>.05)state.feedback="Use moments to find s=L√(ρbar/ρfluid), then geometry sinθ=h/s.";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: s=${format(challengeValues.momentSelectedSubmergedLength,6)} m and θ=${format(target,7)}°.`;}renderAndFocus(renderApp,"#p138-answer");});
  }
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
