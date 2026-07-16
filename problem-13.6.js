(function registerHydrostaticParadoxPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "13.6";
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ flare: 0.5, baseAreaM2: 0.02, depthM: 0.5, fluidDensity: 1000 });
  const CHALLENGE_PRESSURE_PA = CHALLENGE.fluidDensity * GRAVITY * CHALLENGE.depthM;
  const CHALLENGE_BASE_FORCE_N = CHALLENGE_PRESSURE_PA * CHALLENGE.baseAreaM2;
  const vesselDefinitions = Object.freeze([
    Object.freeze({ key: "narrow", label: "Narrowing", sign: -1 }),
    Object.freeze({ key: "straight", label: "Straight", sign: 0 }),
    Object.freeze({ key: "flare", label: "Flared", sign: 1 }),
  ]);
  const stages = Object.freeze([
    Object.freeze({ short: "Depth", title: "Equal depth fixes equal bottom pressure", copy: "Every open vessel has the same free-surface height h, so its bottom gauge pressure is ρgh. Vessel shape does not enter that local pressure law." }),
    Object.freeze({ short: "Weight", title: "Shape changes liquid volume and weight", copy: "The horizontal area varies linearly from Abase to Atop. Different average areas give different volumes and therefore different liquid weights." }),
    Object.freeze({ short: "Walls", title: "Vertical wall forces close each balance", copy: "For the liquid, upward base force plus signed vertical force from the walls equals weight. Flared walls push upward; narrowing walls push downward." }),
  ]);
  const hints = Object.freeze([
    "Hydrostatic gauge pressure at depth h is p=ρgh. It depends on depth and fluid density, not the vessel’s flare.",
    "All three vessels have the same horizontal base area Abase, so their bottom-force magnitude is Fbase=pAbase.",
    "For the challenge, p=1000×9.81×0.500=4905 Pa.",
    "Multiply by 0.0200 m²: Fbase=4905×0.0200=98.10 N in every vessel.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p136-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function hydrostaticData(flare = state.flare, baseAreaM2 = state.baseAreaM2, depthM = state.depthM, fluidDensity = state.fluidDensity) {
    const pressure = fluidDensity * GRAVITY * depthM;
    const baseForce = pressure * baseAreaM2;
    const vessels = vesselDefinitions.map((definition) => {
      const topAreaRatio = 1 + definition.sign * flare;
      const meanAreaFactor = (1 + topAreaRatio) / 2;
      const volume = baseAreaM2 * depthM * meanAreaFactor;
      const liquidWeight = fluidDensity * GRAVITY * volume;
      const wallForceOnLiquid = liquidWeight - baseForce;
      return { ...definition, topAreaRatio, meanAreaFactor, volume, liquidWeight, wallForceOnLiquid, balanceResidual: baseForce + wallForceOnLiquid - liquidWeight };
    });
    return { pressure, baseForce, vessels, weightMinimum: Math.min(...vessels.map((vessel) => vessel.liquidWeight)), weightMaximum: Math.max(...vessels.map((vessel) => vessel.liquidWeight)) };
  }

  function reconstructionNote() {
    return `<p class="p136-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This three-vessel model, its values, diagram and solution are newly written rather than recovered book content.</p>`;
  }

  function stageControls() {
    return `<div class="p136-stage-controls" role="group" aria-label="Hydrostatic paradox stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p136-stage" data-p136-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p136-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p136-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Balance closed" : "Next stage"}</button></div>`;
  }

  function wallForceText(force) {
    if (Math.abs(force) < 1e-10) return "0 N";
    return `${format(Math.abs(force), 3)} N ${force > 0 ? "up" : "down"}`;
  }

  function vesselMarkup(vessel, index, values) {
    const centreX = 145 + index * 220;
    const bottomY = 309;
    const vesselHeight = 132 + 63 * (state.depthM - 0.1) / 1.1;
    const topY = bottomY - vesselHeight;
    const baseWidth = 72 + 42 * (state.baseAreaM2 - 0.005) / 0.075;
    const topWidth = baseWidth * vessel.topAreaRatio;
    const baseLeft = centreX - baseWidth / 2, baseRight = centreX + baseWidth / 2;
    const topLeft = centreX - topWidth / 2, topRight = centreX + topWidth / 2;
    const weightArrowEnd = topY + vesselHeight * (0.55 + 0.08 * vessel.meanAreaFactor);
    const wallForceLength = 35 + 25 * state.flare;
    const wallArrowX = vessel.sign < 0 ? topRight + 14 : baseRight + 18;
    const wallStartY = topY + vesselHeight * 0.58;
    const wallEndY = vessel.sign < 0 ? wallStartY + wallForceLength : wallStartY - wallForceLength;
    const wallMarker = vessel.sign < 0 ? "p136-arrow-wall-down" : "p136-arrow-wall-up";
    const wallArrow = Math.abs(vessel.wallForceOnLiquid) < 1e-10 ? `<text class="p136-wall-zero" x="${centreX + baseWidth / 2 + 12}" y="${format(wallStartY, 2)}">Fwall,y=0</text>` : `<line class="p136-wall-arrow" x1="${format(wallArrowX, 2)}" y1="${format(wallStartY, 2)}" x2="${format(wallArrowX, 2)}" y2="${format(wallEndY, 2)}" marker-end="url(#${wallMarker})"/><text class="p136-wall-label" x="${format(wallArrowX + (vessel.sign < 0 ? 7 : -7), 2)}" y="${format(vessel.sign < 0 ? wallEndY + 14 : wallEndY - 7, 2)}" text-anchor="${vessel.sign < 0 ? "start" : "end"}">${wallForceText(vessel.wallForceOnLiquid)}</text>`;
    return `<g class="p136-vessel p136-${vessel.key}"><text class="p136-vessel-title" x="${centreX}" y="82" text-anchor="middle">${vessel.label}</text><text class="p136-ratio-label" x="${centreX}" y="99" text-anchor="middle">Atop/Abase=${format(vessel.topAreaRatio, 2)}</text><path class="p136-liquid" d="M${format(baseLeft, 2)} ${bottomY}L${format(topLeft, 2)} ${format(topY, 2)}L${format(topRight, 2)} ${format(topY, 2)}L${format(baseRight, 2)} ${bottomY}Z"/><path class="p136-vessel-outline" d="M${format(topLeft, 2)} ${format(topY - 7, 2)}L${format(baseLeft, 2)} ${bottomY}L${format(baseRight, 2)} ${bottomY}L${format(topRight, 2)} ${format(topY - 7, 2)}"/><line class="p136-surface" x1="${format(topLeft, 2)}" y1="${format(topY, 2)}" x2="${format(topRight, 2)}" y2="${format(topY, 2)}"/><g class="p136-pressure-layer"><line class="p136-base-arrow" x1="${centreX}" y1="${bottomY + 45}" x2="${centreX}" y2="${bottomY + 5}" marker-end="url(#p136-arrow-base)"/><text class="p136-base-label" x="${centreX}" y="${bottomY + 61}" text-anchor="middle">Fbase=${format(values.baseForce, 3)} N</text></g><g class="p136-weight-layer"><line class="p136-weight-arrow" x1="${centreX}" y1="${format(topY + 28, 2)}" x2="${centreX}" y2="${format(weightArrowEnd, 2)}" marker-end="url(#p136-arrow-weight)"/><text class="p136-weight-label" x="${centreX + 9}" y="${format(weightArrowEnd - 4, 2)}">W=${format(vessel.liquidWeight, 3)} N</text></g><g class="p136-wall-layer">${wallArrow}</g><g class="p136-balance-layer"><text class="p136-balance-label" x="${centreX}" y="397" text-anchor="middle">Fbase + Fwall,y − W = 0</text></g></g>`;
  }

  function paradoxSvg() {
    const values = hydrostaticData();
    const depthTop = 309 - (132 + 63 * (state.depthM - 0.1) / 1.1);
    return `<svg class="p136-svg p136-stage-${state.stage}" viewBox="0 0 740 420" role="img" aria-labelledby="p136-svg-title p136-svg-desc">
      <title id="p136-svg-title">Three vessels demonstrating the hydrostatic paradox</title>
      <desc id="p136-svg-desc">Three open vessels have common base area ${format(state.baseAreaM2, 4)} square metres, liquid depth ${format(state.depthM, 3)} metres and fluid density ${format(state.fluidDensity, 0)} kilograms per cubic metre. Their top-to-base area ratios are ${values.vessels.map((vessel) => format(vessel.topAreaRatio, 2)).join(", ")}. Each has bottom gauge pressure ${format(values.pressure, 3)} pascals and bottom-force magnitude ${format(values.baseForce, 3)} newtons, while their liquid weights are ${values.vessels.map((vessel) => `${format(vessel.liquidWeight, 3)} newtons`).join(", ")}. Signed vertical wall forces on the liquid close each balance.</desc>
      <defs><linearGradient id="p136-fluid-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8dce2" stop-opacity=".7"/><stop offset="1" stop-color="#3f91a8" stop-opacity=".9"/></linearGradient><marker id="p136-arrow-base" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p136-arrow-weight" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p136-arrow-wall-up" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p136-arrow-wall-down" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p136-board" x="1" y="1" width="738" height="418" rx="20"/><text class="p136-board-title" x="22" y="24">OPEN VESSELS · COMMON Abase, h AND ρ</text><g class="p136-pressure-card" transform="translate(511 10)"><rect width="207" height="55" rx="11"/><text class="p136-card-kicker" x="14" y="19">COMMON BOTTOM GAUGE PRESSURE</text><text class="p136-card-value" x="14" y="41">p=ρgh=${format(values.pressure, 2)} Pa</text></g><g class="p136-depth-bracket"><line x1="28" y1="${format(depthTop, 2)}" x2="28" y2="309"/><line x1="21" y1="${format(depthTop, 2)}" x2="35" y2="${format(depthTop, 2)}"/><line x1="21" y1="309" x2="35" y2="309"/><text x="18" y="${format((depthTop + 309) / 2, 2)}" text-anchor="end">h=${format(state.depthM, 2)} m</text></g>${values.vessels.map((vessel, index) => vesselMarkup(vessel, index, values)).join("")}
    </svg>`;
  }

  function metricsMarkup() {
    const values = hydrostaticData();
    return `<section class="p136-metrics" aria-live="polite"><div><span>Common bottom pressure</span><strong>${format(values.pressure, 2)} Pa</strong></div><div><span>Common bottom force</span><strong>${format(values.baseForce, 3)} N</strong></div><div><span>Liquid-weight range</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.weightMinimum, 3)}–${format(values.weightMaximum, 3)} N` : "stage 2"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p136-dynamic">${paradoxSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p136-controls" aria-label="Hydrostatic vessel controls"><div class="p136-control-grid"><label for="p136-flare"><span>Shape spread δ<output data-p136-output="flare">Atop/Abase=${format(1 - state.flare, 2)}, 1, ${format(1 + state.flare, 2)}</output></span><input id="p136-flare" type="range" min="0" max="0.8" step="0.05" value="${state.flare}"/></label><label for="p136-area"><span>Common base area Abase<output data-p136-output="area">${format(state.baseAreaM2, 3)} m²</output></span><input id="p136-area" type="range" min="0.005" max="0.08" step="0.005" value="${state.baseAreaM2}"/></label><label for="p136-depth"><span>Common liquid depth h<output data-p136-output="depth">${format(state.depthM, 2)} m</output></span><input id="p136-depth" type="range" min="0.1" max="1.2" step="0.05" value="${state.depthM}"/></label><label for="p136-density"><span>Fluid density ρ<output data-p136-output="density">${format(state.fluidDensity, 0)} kg/m³</output></span><input id="p136-density" type="range" min="600" max="1300" step="25" value="${state.fluidDensity}"/></label></div><p>For all three vessels, horizontal cross-sectional area varies linearly from Abase at the bottom to Atop at the open free surface.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p136-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p136-solution" aria-labelledby="p136-solution-heading"><h3 id="p136-solution-heading" tabindex="-1">Depth, not contained weight, sets bottom pressure</h3><p>Because each free surface is open to the same atmosphere, use gauge pressure. At the common depth,</p><div class="p136-equation">pbase=ρgh<br>=1000 kg/m³ × 9.81 m/s² × 0.500 m<br>=4905 Pa</div><p>Each horizontal base has area 0.0200 m², so the force magnitude exerted by the liquid on every base is</p><div class="p136-equation is-answer">Fbase=pbaseAbase=4905 Pa×0.0200 m²<br>=98.10 N</div><p>The unequal weights are real. With linearly varying area, V=h(Abase+Atop)/2. For Atop/Abase=0.50, 1.00 and 1.50, the liquid weights are respectively 73.575 N, 98.100 N and 122.625 N.</p><div class="p136-equation">For the liquid free body: Fbase+Fwall,y−W=0<br>Fwall,y=W−Fbase=−24.525, 0, +24.525 N</div><p>A negative sign means narrowing walls push downward on the liquid; a positive sign means flared walls push upward. The liquid exerts the opposite vertical force on each vessel wall. Thus vessel plus liquid remains in ordinary force balance even though bottom force alone is not equal to liquid weight.</p><p class="p136-limits"><strong>Assumptions and units.</strong> The fluid is static, incompressible and of uniform density; gravity is uniform; each free surface is horizontal and open to the same atmospheric pressure; bases are horizontal; capillarity, wall thickness and deformation are ignored. Values are gauge quantities, so common atmospheric effects cancel. Pa=N/m², hence ρghA has units kg/m³×m/s²×m×m²=N. The linear-area rule is part of this reconstructed model.</p></section>`;
  }

  function snapshot() {
    const values = hydrostaticData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", model: "static incompressible open-surface fluid; horizontal area varies linearly with height", gravityMetresPerSecondSquared: GRAVITY, shapeSpread: state.flare, commonBaseAreaSquareMetres: state.baseAreaM2, commonDepthMetres: state.depthM, fluidDensityKilogramsPerCubicMetre: state.fluidDensity, commonBottomGaugePressurePascals: Number(values.pressure.toFixed(9)), commonBottomForceNewtons: Number(values.baseForce.toFixed(9)), vessels: values.vessels.map((vessel) => ({ shape: vessel.label, topToBaseAreaRatio: Number(vessel.topAreaRatio.toFixed(9)), liquidVolumeCubicMetres: Number(vessel.volume.toFixed(12)), liquidWeightNewtons: Number(vessel.liquidWeight.toFixed(9)), signedVerticalWallForceOnLiquidNewtons: Number(vessel.wallForceOnLiquid.toFixed(9)), forceBalanceResidualNewtons: Number(vessel.balanceResidual.toExponential(6)) })), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p136-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive hydrostatics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p136-spread"><article class="book-page p136-problem-page"><div class="problem-number">Problem 13.6</div><h1 class="book-title p136-title">The hydrostatic paradox</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">Three open vessels contain water to depth 0.500 m and share horizontal base area 0.0200 m². Their horizontal cross-sectional areas vary linearly with height, with Atop/Abase=0.50, 1.00 and 1.50. Take ρ=1000 kg/m³ and g=9.81 m/s².</p><p class="problem-copy"><strong>What gauge-force magnitude does the liquid exert on the base of each vessel, to the nearest 0.01 N?</strong></p><section class="p136-observation-card"><strong>Same depth, unequal weight</strong><p>The tempting shortcut “bottom force equals liquid weight” fails whenever sloping walls have a vertical force component.</p></section><section class="p136-model-card"><div class="eyebrow">Open static vessels</div><p>Atmospheric pressure is common and cancels, so all displayed pressures and base forces are gauge quantities.</p></section></article><section class="book-page book-stage p136-stage">${stageControls()}<div class="p136-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p136-coach"><div class="coach-kicker">Separate pressure from weight</div><p class="coach-question">Enter the common force magnitude exerted by the water on one base.</p><form class="p136-answer-form" data-p136-answer-form novalidate><label for="p136-answer">Bottom gauge-force magnitude</label><div><input id="p136-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="nearest 0.01" autocomplete="off"/><span>N</span></div><button class="primary-button" type="submit">Check bottom force</button></form>${feedbackMarkup()}<div class="button-row p136-help-row"><button class="secondary-button" type="button" data-problem-action="p136-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p136-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p136-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p136-shell"); if (!root) return;
    const dynamic = root.querySelector(".p136-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = hydrostaticData();
    const outputs = { flare: `Atop/Abase=${format(1 - state.flare, 2)}, 1, ${format(1 + state.flare, 2)}`, area: `${format(state.baseAreaM2, 3)} m²`, depth: `${format(state.depthM, 2)} m`, density: `${format(state.fluidDensity, 0)} kg/m³` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p136-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p136-flare")?.setAttribute("aria-valuetext", `Shape spread ${format(state.flare, 2)}; top-to-base area ratios ${format(1 - state.flare, 2)}, 1 and ${format(1 + state.flare, 2)}`);
    root.querySelector("#p136-area")?.setAttribute("aria-valuetext", `Common base area ${format(state.baseAreaM2, 3)} square metres; common base force ${format(values.baseForce, 3)} newtons`);
    root.querySelector("#p136-depth")?.setAttribute("aria-valuetext", `Common liquid depth ${format(state.depthM, 2)} metres; common bottom pressure ${format(values.pressure, 2)} pascals`);
    root.querySelector("#p136-density")?.setAttribute("aria-valuetext", `Fluid density ${format(state.fluidDensity, 0)} kilograms per cubic metre; common bottom force ${format(values.baseForce, 3)} newtons`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p136-reset") { state = initialState(); renderAndFocus(renderApp, "#p136-flare"); return; }
      if (action === "p136-stage") { state.stage = clamp(Number(control.dataset.p136Stage), 0, 2); renderAndFocus(renderApp, `[data-p136-stage="${state.stage}"]`); return; }
      if (action === "p136-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p136-stage="${state.stage}"]`); return; }
      if (action === "p136-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p136-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p136-reveal") window.requestAnimationFrame(() => document.querySelector("#p136-solution-heading")?.focus());
    }));
    [["#p136-flare", "flare", 0, 0.8], ["#p136-area", "baseAreaM2", 0.005, 0.08], ["#p136-depth", "depthM", 0.1, 1.2], ["#p136-density", "fluidDensity", 600, 1300]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); state.feedback = ""; state.committed = false; updateDynamicDom(); }));
    const input = document.querySelector("#p136-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p136-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter the bottom gauge-force magnitude in newtons, rounded to 0.01 N.";
      else if (Math.abs(answer - CHALLENGE_PRESSURE_PA) < 1) state.feedback = "That is the gauge pressure in pascals. Multiply it by the 0.0200 m² base area.";
      else if ([73.575, 122.625].some((weight) => Math.abs(answer - weight) < .02)) state.feedback = "That is one vessel’s liquid weight. Sloping-wall forces mean liquid weight need not equal bottom force.";
      else if (Math.abs(answer - 98.10) > .006) state.feedback = "Use p=ρgh at the common depth, then multiply by the common base area. Shape does not enter either step.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: p=${format(CHALLENGE_PRESSURE_PA, 0)} Pa and F=pA=${format(CHALLENGE_BASE_FORCE_N, 2)} N for all three bases.`; }
      renderAndFocus(renderApp, "#p136-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
