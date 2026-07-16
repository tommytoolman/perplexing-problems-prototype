(function registerMileHighTowerPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "14.1";
  const GRAVITY = 9.81;
  const METRES_PER_MILE = 1609.344;
  const CROSS_SECTION_AREA_M2 = 100;
  const CHALLENGE = Object.freeze({ heightMiles: 1, densityKgM3: 2500, allowableStressMPa: 50, safetyFactor: 2 });
  const CHALLENGE_HEIGHT_M = METRES_PER_MILE;
  const CHALLENGE_BASE_STRESS_MPA = CHALLENGE.densityKgM3 * GRAVITY * CHALLENGE_HEIGHT_M / 1e6;
  const stages = Object.freeze([
    Object.freeze({ short: "Weight", title: "Stack the material’s own weight", copy: "For constant cross-sectional area A, tower volume is AH, mass is ρAH and weight is ρAHg. Taller or denser towers carry more material above the base." }),
    Object.freeze({ short: "Stress", title: "Divide the weight by base area", copy: "Base compressive stress is W/A=ρgh. Area cancels: making this ideal untapered tower uniformly wider raises weight and load-bearing area in the same proportion." }),
    Object.freeze({ short: "Limit", title: "Compare with the factored stress limit", copy: "This activity uses σdesign=σallow/SF. Solving ρgHmax=σdesign gives an ideal maximum self-supporting height, before real failure modes are considered." }),
  ]);
  const hints = Object.freeze([
    "For a constant section A, the tower volume is V=AH and its mass is m=ρAH.",
    "Its weight is W=mg=ρAHg. Base stress is force divided by area.",
    "Cancel A: σbase=W/A=ρgH. One international mile is exactly 1609.344 m.",
    `σbase=2500×9.81×1609.344=${(CHALLENGE_BASE_STRESS_MPA * 1e6).toFixed(1)} Pa=${CHALLENGE_BASE_STRESS_MPA.toFixed(7)} MPa, which rounds to ${CHALLENGE_BASE_STRESS_MPA.toFixed(1)} MPa.`,
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p141-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 24); }

  function towerData(heightMiles = state.heightMiles, densityKgM3 = state.densityKgM3, allowableStressMPa = state.allowableStressMPa, safetyFactor = state.safetyFactor) {
    const heightM = heightMiles * METRES_PER_MILE;
    const volumeM3 = CROSS_SECTION_AREA_M2 * heightM;
    const massKg = densityKgM3 * volumeM3;
    const weightN = massKg * GRAVITY;
    const baseStressPa = weightN / CROSS_SECTION_AREA_M2;
    const baseStressMPa = baseStressPa / 1e6;
    const designStressMPa = allowableStressMPa / safetyFactor;
    const maximumHeightM = designStressMPa * 1e6 / (densityKgM3 * GRAVITY);
    const maximumHeightMiles = maximumHeightM / METRES_PER_MILE;
    const utilization = baseStressMPa / designStressMPa;
    const idealPasses = utilization <= 1;
    return { heightM, volumeM3, massKg, massTonnes: massKg / 1000, weightN, baseStressPa, baseStressMPa, designStressMPa, maximumHeightM, maximumHeightMiles, utilization, idealPasses, stressIdentityResidualPa: baseStressPa - densityKgM3 * GRAVITY * heightM };
  }

  function reconstructionNote() {
    return `<p class="p141-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This self-weight estimate, its numerical values, diagram and solution are newly written rather than recovered book content.</p>`;
  }

  function stageControls() {
    return `<div class="p141-stage-controls" role="group" aria-label="Tower self-weight estimate stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p141-stage" data-p141-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p141-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p141-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Estimate complete" : "Next stage"}</button></div>`;
  }

  function towerSvg() {
    const values = towerData();
    const towerBottom = 359;
    const towerHeight = 75 + 195 * state.heightMiles / 2;
    const towerTop = towerBottom - towerHeight;
    const towerLeft = 210, towerRight = 292, towerCentre = 251;
    const stressMaximum = Math.max(values.baseStressMPa, values.designStressMPa, 5) * 1.15;
    const stressTrackWidth = 244;
    const stressLength = stressTrackWidth * values.baseStressMPa / stressMaximum;
    const designX = 448 + stressTrackWidth * values.designStressMPa / stressMaximum;
    const heightMaximum = Math.max(values.heightM, values.maximumHeightM, 100) * 1.12;
    const currentHeightLength = stressTrackWidth * values.heightM / heightMaximum;
    const maximumHeightLength = stressTrackWidth * values.maximumHeightM / heightMaximum;
    const statusText = values.idealPasses ? "WITHIN THIS AXIAL MODEL" : "OVER FACTORED AXIAL LIMIT";
    return `<svg class="p141-svg p141-stage-${state.stage} ${values.idealPasses ? "is-within" : "is-over"}" viewBox="0 0 740 430" role="img" aria-labelledby="p141-svg-title p141-svg-desc">
      <title id="p141-svg-title">Ideal constant-section tower self-weight estimate</title>
      <desc id="p141-svg-desc">An untapered tower of height ${format(values.heightM, 3)} metres, constant cross-sectional area ${format(CROSS_SECTION_AREA_M2, 0)} square metres and density ${format(state.densityKgM3, 0)} kilograms per cubic metre has mass ${format(values.massTonnes, 3)} tonnes and base compressive stress ${format(values.baseStressMPa, 6)} megapascals. With allowable compressive stress ${format(state.allowableStressMPa, 2)} megapascals and safety factor ${format(state.safetyFactor, 2)}, this activity’s factored design limit is ${format(values.designStressMPa, 4)} megapascals and ideal maximum height is ${format(values.maximumHeightM, 3)} metres. This ignores buckling, wind, foundations and other real structural effects.</desc>
      <defs><linearGradient id="p141-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9e1e2"/><stop offset="1" stop-color="#edf1e8"/></linearGradient><linearGradient id="p141-stress-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7eb3be"/><stop offset=".7" stop-color="#c68b62"/><stop offset="1" stop-color="#a34b35"/></linearGradient><marker id="p141-arrow-weight" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p141-arrow-compression" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p141-sky" x="1" y="1" width="399" height="418" rx="20"/><rect class="p141-audit-bg" x="400" y="1" width="339" height="418" rx="20"/><path class="p141-ground" d="M1 359H400V419H1Z"/><g class="p141-clouds"><path d="M35 96q19-28 43-4q29-8 38 20H27q-3-10 8-16Z"/><path d="M300 120q15-22 35-3q24-6 32 17h-75q-2-8 8-14Z"/></g>
      <text class="p141-model-kicker" x="22" y="28">IDEAL PRISM · CONSTANT A · NO TAPER</text><g class="p141-height-bracket"><line x1="162" y1="${format(towerTop, 2)}" x2="162" y2="${towerBottom}"/><line x1="154" y1="${format(towerTop, 2)}" x2="170" y2="${format(towerTop, 2)}"/><line x1="154" y1="${towerBottom}" x2="170" y2="${towerBottom}"/><text x="151" y="${format((towerTop + towerBottom) / 2, 2)}" text-anchor="end">H=${format(values.heightM, 1)} m</text></g>
      <rect class="p141-tower" x="${towerLeft}" y="${format(towerTop, 2)}" width="${towerRight - towerLeft}" height="${format(towerHeight, 2)}"/><g class="p141-floor-lines">${Array.from({ length: 8 }, (_, index) => `<line x1="${towerLeft + 5}" y1="${format(towerTop + towerHeight * (index + 1) / 9, 2)}" x2="${towerRight - 5}" y2="${format(towerTop + towerHeight * (index + 1) / 9, 2)}"/>`).join("")}</g><rect class="p141-foundation" x="183" y="359" width="136" height="22" rx="3"/><text class="p141-area-label" x="251" y="397" text-anchor="middle">fixed base area A=${format(CROSS_SECTION_AREA_M2, 0)} m²</text>
      <g class="p141-weight-layer"><line class="p141-weight-arrow" x1="251" y1="${format(towerTop + 25, 2)}" x2="251" y2="${format(towerBottom - 28, 2)}" marker-end="url(#p141-arrow-weight)"/><text class="p141-weight-label" x="262" y="${format(towerTop + towerHeight * .46, 2)}">W=ρAHg</text><rect class="p141-mass-box" x="23" y="318" width="132" height="62" rx="11"/><text class="p141-box-kicker" x="36" y="339">TOWER MASS</text><text class="p141-box-value" x="36" y="361">${format(values.massTonnes, 1)} t</text><text class="p141-box-note" x="36" y="374">m=ρAH</text></g>
      <g class="p141-stress-layer"><line class="p141-compression-arrow is-left" x1="181" y1="347" x2="214" y2="347" marker-end="url(#p141-arrow-compression)"/><line class="p141-compression-arrow is-right" x1="321" y1="347" x2="288" y2="347" marker-end="url(#p141-arrow-compression)"/><text class="p141-base-stress-label" x="251" y="337" text-anchor="middle">σbase=${format(values.baseStressMPa, 3)} MPa</text></g>
      <text class="p141-audit-title" x="424" y="30">SELF-WEIGHT AXIAL AUDIT</text><text class="p141-audit-note" x="424" y="49">screening estimate · not structural design</text>
      <g class="p141-stress-layer"><text class="p141-bar-kicker" x="424" y="83">BASE STRESS VERSUS FACTORED LIMIT · MPa</text><rect class="p141-track" x="448" y="101" width="244" height="18" rx="9"/><rect class="p141-stress-bar" x="448" y="101" width="${format(stressLength, 2)}" height="18" rx="9"/><line class="p141-limit-line" x1="${format(designX, 2)}" y1="94" x2="${format(designX, 2)}" y2="128"/><text class="p141-limit-label" x="${format(Math.min(designX + 4, 650), 2)}" y="139">σallow/SF=${format(values.designStressMPa, 2)}</text><text class="p141-bar-value" x="448" y="158">ρgH=${format(values.baseStressMPa, 4)} MPa</text><text class="p141-formula" x="448" y="180">σbase=W/A=ρAHg/A=ρgH</text></g>
      <g class="p141-limit-layer"><text class="p141-bar-kicker" x="424" y="222">HEIGHT VERSUS IDEAL SELF-SUPPORT LIMIT · m</text><text class="p141-height-bar-label" x="424" y="251">current</text><rect class="p141-track" x="448" y="239" width="244" height="14" rx="7"/><rect class="p141-current-height-bar" x="448" y="239" width="${format(currentHeightLength, 2)}" height="14" rx="7"/><text class="p141-height-bar-value" x="${format(Math.min(454 + currentHeightLength, 676), 2)}" y="250">${format(values.heightM, 0)}</text><text class="p141-height-bar-label" x="424" y="287">Hmax</text><rect class="p141-track" x="448" y="275" width="244" height="14" rx="7"/><rect class="p141-maximum-height-bar" x="448" y="275" width="${format(maximumHeightLength, 2)}" height="14" rx="7"/><text class="p141-height-bar-value" x="${format(Math.min(454 + maximumHeightLength, 676), 2)}" y="286">${format(values.maximumHeightM, 0)}</text><text class="p141-formula" x="448" y="313">Hmax=σallow/(SF·ρg)=${format(values.maximumHeightMiles, 3)} mi</text><rect class="p141-status-box" x="424" y="334" width="286" height="59" rx="12"/><text class="p141-status-kicker" x="440" y="355">${statusText}</text><text class="p141-status-value" x="440" y="377">utilization=${format(values.utilization, 3)} × limit</text></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = towerData();
    return `<section class="p141-metrics" aria-live="polite"><div><span>Tower mass at A=100 m²</span><strong>${format(values.massTonnes, 2)} t</strong></div><div><span>Base self-weight stress</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.baseStressMPa, 4)} MPa` : "stage 2"}</strong></div><div><span>Ideal maximum height</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.maximumHeightM, 1)} m` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p141-dynamic">${towerSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p141-controls" aria-label="Ideal tower estimate controls"><div class="p141-control-grid"><label for="p141-height"><span>Tower height H<output data-p141-output="height">${format(state.heightMiles, 2)} mi · ${format(state.heightMiles * METRES_PER_MILE, 1)} m</output></span><input id="p141-height" type="range" min="0.1" max="2" step="0.01" value="${state.heightMiles}"/></label><label for="p141-density"><span>Material density ρ<output data-p141-output="density">${format(state.densityKgM3, 0)} kg/m³</output></span><input id="p141-density" type="range" min="500" max="8000" step="100" value="${state.densityKgM3}"/></label><label for="p141-allowable"><span>Allowable compression σallow<output data-p141-output="allowable">${format(state.allowableStressMPa, 0)} MPa</output></span><input id="p141-allowable" type="range" min="10" max="500" step="5" value="${state.allowableStressMPa}"/></label><label for="p141-safety"><span>Activity safety factor SF<output data-p141-output="safety">${format(state.safetyFactor, 1)}</output></span><input id="p141-safety" type="range" min="1" max="5" step="0.1" value="${state.safetyFactor}"/></label></div><p>The model applies σdesign=σallow/SF. Cross-section is fixed at 100 m² only to display mass; it cancels from self-weight stress and ideal maximum height.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p141-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p141-solution" aria-labelledby="p141-solution-heading"><h3 id="p141-solution-heading" tabindex="-1">The cross-sectional area cancels</h3><p>One international mile is exactly 1609.344 m. For the fixed 100 m² section,</p><div class="p141-equation">m=ρAH=2500×100×1609.344<br>=402,336,000 kg=402,336 t</div><p>The base carries that entire self-weight. Dividing by the same area gives</p><div class="p141-equation is-answer">σbase=mg/A=ρgH<br>=2500×9.81×1609.344 Pa<br>=39,469,161.6 Pa=39.4691616 MPa≈39.5 MPa</div><p>Doubling the constant area doubles mass and weight, but it also doubles the loaded base area, leaving σbase unchanged.</p><p>In this activity, the factored axial limit is 50/2=25 MPa. The ideal maximum height is</p><div class="p141-equation">Hmax=25×10⁶/(2500×9.81)<br>=1019.367992 m=0.633 mi</div><p>Thus the one-mile prism exceeds even this simplified factored axial limit: utilization is ${(CHALLENGE_BASE_STRESS_MPA / 25).toFixed(6)}.</p><p class="p141-limits"><strong>Estimate boundary.</strong> This is a homogeneous, vertical, perfectly straight, constant-section, taper-free column under its own uniform axial weight, with constant density and g. It ignores buckling and slenderness, wind, earthquakes, dynamic loading, openings, material variability, creep, cracking, connections, foundations, construction sequence and any nonuniform or composite structure. “Within limit” means only within this algebraic screening model; it is never a real design verdict. Pa=N/m² and MPa=10⁶ Pa.</p></section>`;
  }

  function snapshot() {
    const values = towerData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", modelBoundary: "homogeneous vertical constant-section taper-free axial self-weight estimate; not structural design", gravityMetresPerSecondSquared: GRAVITY, metresPerInternationalMile: METRES_PER_MILE, fixedCrossSectionAreaSquareMetres: CROSS_SECTION_AREA_M2, heightMiles: state.heightMiles, heightMetres: Number(values.heightM.toFixed(9)), materialDensityKilogramsPerCubicMetre: state.densityKgM3, allowableCompressiveStressMegapascals: state.allowableStressMPa, activitySafetyFactor: state.safetyFactor, factoredDesignStressMegapascals: Number(values.designStressMPa.toFixed(9)), volumeCubicMetres: Number(values.volumeM3.toFixed(9)), massKilograms: Number(values.massKg.toFixed(6)), weightNewtons: Number(values.weightN.toFixed(3)), baseSelfWeightStressMegapascals: Number(values.baseStressMPa.toFixed(9)), idealMaximumHeightMetres: Number(values.maximumHeightM.toFixed(9)), idealMaximumHeightMiles: Number(values.maximumHeightMiles.toFixed(9)), utilization: Number(values.utilization.toFixed(9)), passesIdealAxialScreen: values.idealPasses, stressIdentityResidualPascals: Number(values.stressIdentityResidualPa.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p141-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive structural estimate</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p141-spread"><article class="book-page p141-problem-page"><div class="problem-number">Problem 14.1</div><h1 class="book-title p141-title">Mile-high tower</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">Imagine a perfectly vertical, untapered tower exactly one international mile high, with constant cross-sectional area 100 m² and uniform material density 2500 kg/m³. Take g=9.81 m/s².</p><p class="problem-copy"><strong>Estimate its base compressive stress from self-weight alone, to the nearest 0.1 MPa.</strong></p><section class="p141-observation-card"><strong>Width does not rescue a uniform prism</strong><p>A wider constant section contains proportionally more material. Its extra weight and extra base area cancel in the stress ratio.</p></section><section class="p141-model-card"><div class="eyebrow">Screening model only</div><p>The optional 50 MPa allowable value and safety factor 2 compare axial stress only. They do not make this a structural design.</p></section></article><section class="book-page book-stage p141-stage">${stageControls()}<div class="p141-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p141-coach"><div class="coach-kicker">Estimate the base stress</div><p class="coach-question">Enter the ideal self-weight stress for the stated one-mile tower.</p><form class="p141-answer-form" data-p141-answer-form novalidate><label for="p141-answer">Base compressive stress</label><div><input id="p141-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="nearest 0.1" autocomplete="off"/><span>MPa</span></div><button class="primary-button" type="submit">Check stress</button></form>${feedbackMarkup()}<div class="button-row p141-help-row"><button class="secondary-button" type="button" data-problem-action="p141-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p141-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p141-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p141-shell"); if (!root) return;
    const dynamic = root.querySelector(".p141-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = towerData();
    const outputs = { height: `${format(state.heightMiles, 2)} mi · ${format(values.heightM, 1)} m`, density: `${format(state.densityKgM3, 0)} kg/m³`, allowable: `${format(state.allowableStressMPa, 0)} MPa`, safety: format(state.safetyFactor, 1) };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p141-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p141-height")?.setAttribute("aria-valuetext", `Tower height ${format(state.heightMiles, 2)} miles, ${format(values.heightM, 1)} metres; base stress ${format(values.baseStressMPa, 3)} megapascals`);
    root.querySelector("#p141-density")?.setAttribute("aria-valuetext", `Material density ${format(state.densityKgM3, 0)} kilograms per cubic metre; tower mass ${format(values.massTonnes, 1)} tonnes`);
    root.querySelector("#p141-allowable")?.setAttribute("aria-valuetext", `Allowable compressive stress ${format(state.allowableStressMPa, 0)} megapascals; after safety factor ${format(values.designStressMPa, 2)} megapascals`);
    root.querySelector("#p141-safety")?.setAttribute("aria-valuetext", `Activity safety factor ${format(state.safetyFactor, 1)}; ideal maximum height ${format(values.maximumHeightM, 1)} metres`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p141-reset") { state = initialState(); renderAndFocus(renderApp, "#p141-height"); return; }
      if (action === "p141-stage") { state.stage = clamp(Number(control.dataset.p141Stage), 0, 2); renderAndFocus(renderApp, `[data-p141-stage="${state.stage}"]`); return; }
      if (action === "p141-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p141-stage="${state.stage}"]`); return; }
      if (action === "p141-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p141-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p141-reveal") window.requestAnimationFrame(() => document.querySelector("#p141-solution-heading")?.focus());
    }));
    [["#p141-height", "heightMiles", 0.1, 2], ["#p141-density", "densityKgM3", 500, 8000], ["#p141-allowable", "allowableStressMPa", 10, 500], ["#p141-safety", "safetyFactor", 1, 5]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); state.feedback = ""; state.committed = false; updateDynamicDom(); }));
    const input = document.querySelector("#p141-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p141-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter the base compressive stress in megapascals, rounded to 0.1 MPa.";
      else if (Math.abs(answer - CHALLENGE_BASE_STRESS_MPA * 1e6) < 2000) state.feedback = "That is the stress in pascals. Divide by one million to convert Pa to MPa.";
      else if (Math.abs(answer - 402336) < 2) state.feedback = "That is the tower mass in tonnes. Stress is self-weight divided by base area.";
      else if (Math.abs(answer - 39.5) > .055) state.feedback = "Use σbase=ρgH. Convert the exact mile to 1609.344 m; the cross-sectional area cancels.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: σbase=${CHALLENGE_BASE_STRESS_MPA.toFixed(7)} MPa, which rounds to 39.5 MPa.`; }
      renderAndFocus(renderApp, "#p141-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
