(function registerBalancedScalesPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "13.3";
  const GRAVITY = 9.81;
  const BASE_MASS_KG = 2;
  const CHALLENGE = Object.freeze({ volumeCm3: 250, objectDensity: 3000, fluidDensity: 1000, supportMode: "external" });
  const CHALLENGE_BUOYANCY_N = CHALLENGE.fluidDensity * GRAVITY * CHALLENGE.volumeCm3 * 1e-6;
  const CHALLENGE_READING_N = BASE_MASS_KG * GRAVITY + CHALLENGE_BUOYANCY_N;
  const stages = Object.freeze([
    Object.freeze({ short: "Boundary", title: "Choose what belongs to the scale", copy: "The scale system always contains the beaker and liquid. With an external stand, the submerged block remains outside it; with the on-scale frame, the block is included." }),
    Object.freeze({ short: "Forces", title: "Follow every force path", copy: "The liquid pushes up on the block with buoyancy Fb. The block pushes down on the liquid by the same amount. A support attached to the scale also transmits tension T." }),
    Object.freeze({ short: "Reading", title: "Add only loads reaching the scale", copy: "External support adds Fb to the beaker reading. An on-scale support adds Fb+T=Wblock, so the scale gains the block’s entire weight." }),
  ]);
  const hints = Object.freeze([
    "Draw the scale boundary around the beaker and water. The externally supported block is not part of that system.",
    "The water pushes upward on the block with Fb=ρfluid gV. By Newton’s third law, the block pushes downward on the water by Fb.",
    "Convert 250 cm³ to 250×10⁻⁶ m³=2.50×10⁻⁴ m³.",
    "Fb=1000×9.81×2.50×10⁻⁴=2.4525 N. Add this to the beaker-and-water reading of 2.000×9.81=19.6200 N.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p133-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function scaleData(volumeCm3 = state.volumeCm3, objectDensity = state.objectDensity, fluidDensity = state.fluidDensity, supportMode = state.supportMode) {
    const volumeM3 = volumeCm3 * 1e-6;
    const objectMass = objectDensity * volumeM3;
    const objectWeight = objectMass * GRAVITY;
    const buoyancy = fluidDensity * GRAVITY * volumeM3;
    const supportTension = objectWeight - buoyancy;
    const baseReading = BASE_MASS_KG * GRAVITY;
    const fluidReactionLoad = buoyancy;
    const supportLoadOnScale = supportMode === "scale" ? supportTension : 0;
    const addedLoad = fluidReactionLoad + supportLoadOnScale;
    const scaleReading = baseReading + addedLoad;
    const massEquivalent = scaleReading / GRAVITY;
    return { volumeM3, objectMass, objectWeight, buoyancy, supportTension, baseReading, fluidReactionLoad, supportLoadOnScale, addedLoad, scaleReading, massEquivalent, objectResidual: buoyancy + supportTension - objectWeight, scaleResidual: scaleReading - baseReading - addedLoad };
  }

  function reconstructionNote() {
    return `<p class="p133-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This system-boundary puzzle, its values, diagram and solution are newly written rather than recovered book content.</p>`;
  }

  function stageControls() {
    return `<div class="p133-stage-controls" role="group" aria-label="Scale force-accounting stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p133-stage" data-p133-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p133-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p133-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Forces accounted" : "Next stage"}</button></div>`;
  }

  function apparatusSvg() {
    const values = scaleData();
    const blockSize = 36 + 28 * (state.volumeCm3 - 50) / 550;
    const blockX = 268 - blockSize / 2, blockY = 222 - blockSize / 2;
    const supportLabel = state.supportMode === "external" ? "EXTERNAL STAND · OUTSIDE SCALE" : "FRAME FEET REST ON SCALE";
    const includedLabel = state.supportMode === "external" ? "beaker + liquid" : "beaker + liquid + block";
    const crossingLabel = state.supportMode === "external" ? `Fb = ${format(values.buoyancy, 4)} N` : `Fb + T = W = ${format(values.objectWeight, 4)} N`;
    const display = state.stage >= 2 || state.revealed ? `${format(values.scaleReading, 4)} N` : "trace forces";
    const stringTop = state.supportMode === "external" ? 63 : 82;
    const supportGeometry = state.supportMode === "external" ? `<g class="p133-support is-external"><path d="M45 309V63H268"/><path d="M45 63h-22v22"/><text x="33" y="48">${supportLabel}</text></g>` : `<g class="p133-support is-scale"><path d="M112 335V82H268"/><path d="M91 335h42"/><text x="94" y="66">${supportLabel}</text></g>`;
    return `<svg class="p133-svg p133-stage-${state.stage} is-${state.supportMode}" viewBox="0 0 740 430" role="img" aria-labelledby="p133-svg-title p133-svg-desc">
      <title id="p133-svg-title">Submerged block and scale force boundary</title>
      <desc id="p133-svg-desc">A block of volume ${format(state.volumeCm3, 0)} cubic centimetres and density ${format(state.objectDensity, 0)} kilograms per cubic metre is fully submerged without touching the beaker in fluid of density ${format(state.fluidDensity, 0)} kilograms per cubic metre. It is supported by ${state.supportMode === "external" ? "an external stand outside the scale system" : "a massless frame whose feet rest on the scale"}. Buoyancy is ${format(values.buoyancy, 5)} newtons, block weight is ${format(values.objectWeight, 5)} newtons and the scale reads ${format(values.scaleReading, 5)} newtons.</desc>
      <defs><linearGradient id="p133-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ed4df" stop-opacity=".72"/><stop offset="1" stop-color="#398da6" stop-opacity=".84"/></linearGradient><marker id="p133-arrow-up" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p133-arrow-down" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p133-arrow-reaction" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p133-arrow-support" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p133-board" x="1" y="1" width="738" height="428" rx="20"/><line class="p133-divider" x1="450" y1="24" x2="450" y2="405"/>
      <text class="p133-panel-title" x="24" y="28">SUBMERGED-BLOCK APPARATUS</text>${supportGeometry}<line class="p133-string" x1="268" y1="${stringTop}" x2="268" y2="${format(blockY, 2)}"/>
      <path class="p133-beaker" d="M135 132V304Q135 318 149 318H389Q403 318 403 304V132"/><rect class="p133-fluid" x="141" y="157" width="256" height="155"/><line class="p133-surface" x1="141" y1="157" x2="397" y2="157"/><text class="p133-fluid-label" x="151" y="181">ρfluid=${format(state.fluidDensity, 0)} kg/m³</text>
      <rect class="p133-block ${state.supportMode === "external" ? "is-outside" : "is-inside"}" x="${format(blockX, 2)}" y="${format(blockY, 2)}" width="${format(blockSize, 2)}" height="${format(blockSize, 2)}" rx="5"/><text class="p133-block-label" x="268" y="${format(blockY + blockSize / 2 + 3, 2)}" text-anchor="middle">${format(state.volumeCm3, 0)} cm³</text>
      <g class="p133-force-layer"><line class="p133-weight-arrow" x1="${format(268 + blockSize / 2 + 10, 2)}" y1="222" x2="${format(268 + blockSize / 2 + 10, 2)}" y2="292" marker-end="url(#p133-arrow-down)"/><text class="p133-force-label is-weight" x="${format(282 + blockSize / 2, 2)}" y="286">W=${format(values.objectWeight, 4)} N</text><line class="p133-buoyancy-arrow" x1="${format(268 - blockSize / 2 - 10, 2)}" y1="222" x2="${format(268 - blockSize / 2 - 10, 2)}" y2="170" marker-end="url(#p133-arrow-up)"/><text class="p133-force-label is-buoyancy" x="${format(195 - blockSize / 2, 2)}" y="173">Fb=${format(values.buoyancy, 4)} N</text><line class="p133-tension-arrow" x1="268" y1="${format(blockY, 2)}" x2="268" y2="116" marker-end="url(#p133-arrow-support)"/><text class="p133-force-label is-tension" x="280" y="126">T=${format(values.supportTension, 4)} N</text><line class="p133-reaction-arrow" x1="184" y1="208" x2="184" y2="269" marker-end="url(#p133-arrow-reaction)"/><text class="p133-force-label is-reaction" x="194" y="264">reaction on liquid = Fb</text></g>
      <rect class="p133-platform" x="92" y="318" width="332" height="18" rx="5"/><rect class="p133-scale-body" x="136" y="336" width="244" height="69" rx="13"/><rect class="p133-display" x="199" y="351" width="118" height="33" rx="6"/><text class="p133-display-value" x="258" y="373" text-anchor="middle">${display}</text><text class="p133-tare-label" x="258" y="398" text-anchor="middle">beaker + liquid alone: ${format(values.baseReading, 4)} N</text>
      <g class="p133-boundary"><path d="M82 111Q82 99 94 99H415Q427 99 427 111V346Q427 358 415 358H94Q82 358 82 346Z"/><text x="94" y="119">SCALE SYSTEM: ${includedLabel.toUpperCase()}</text></g>
      <g transform="translate(470 28)"><text class="p133-panel-title" x="0" y="0">SYSTEM-BOUNDARY AUDIT</text><rect class="p133-ledger-box" x="0" y="18" width="246" height="330" rx="16"/><text class="p133-ledger-kicker" x="18" y="47">SUPPORT PATH</text><text class="p133-ledger-mode" x="18" y="69">${state.supportMode === "external" ? "External stand" : "On-scale frame"}</text><text class="p133-ledger-copy" x="18" y="89">Block is ${state.supportMode === "external" ? "outside" : "inside"} the scale system</text>
        <g class="p133-ledger-layer"><line class="p133-ledger-rule" x1="18" y1="109" x2="228" y2="109"/><text class="p133-ledger-label" x="18" y="136">BASE: BEAKER + LIQUID</text><text class="p133-ledger-number" x="228" y="136" text-anchor="end">${format(values.baseReading, 4)} N</text><text class="p133-ledger-label" x="18" y="174">DOWNWARD LOAD CROSSING</text><text class="p133-ledger-number is-added" x="228" y="174" text-anchor="end">+ ${format(values.addedLoad, 4)} N</text><text class="p133-ledger-note" x="18" y="195">${crossingLabel}</text><text class="p133-ledger-note" x="18" y="216">${state.supportMode === "external" ? "T goes to the external stand" : `T=${format(values.supportTension, 4)} N reaches scale frame`}</text></g>
        <g class="p133-result-layer"><line class="p133-ledger-rule is-total" x1="18" y1="238" x2="228" y2="238"/><text class="p133-ledger-label" x="18" y="267">SCALE READING</text><text class="p133-ledger-total" x="228" y="267" text-anchor="end">${format(values.scaleReading, 4)} N</text><text class="p133-ledger-copy" x="18" y="294">${format(values.massEquivalent, 4)} kg equivalent</text><rect class="p133-result-box" x="18" y="309" width="210" height="25" rx="7"/><text class="p133-result-text" x="123" y="326" text-anchor="middle">added load: ${state.supportMode === "external" ? "displaced fluid weight" : "whole block weight"}</text></g>
      </g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = scaleData();
    return `<section class="p133-metrics" aria-live="polite"><div><span>Base scale reading</span><strong>${format(values.baseReading, 4)} N</strong></div><div><span>Load crossing boundary</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.addedLoad, 4)} N` : "stage 2"}</strong></div><div><span>Final scale reading</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.scaleReading, 4)} N` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p133-dynamic">${apparatusSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p133-controls" aria-label="Submerged-block scale controls"><div class="p133-mode-row" role="group" aria-label="Block support mode"><button class="secondary-button ${state.supportMode === "external" ? "active" : ""}" type="button" data-problem-action="p133-mode" data-p133-mode="external" aria-pressed="${state.supportMode === "external"}">External stand</button><button class="secondary-button ${state.supportMode === "scale" ? "active" : ""}" type="button" data-problem-action="p133-mode" data-p133-mode="scale" aria-pressed="${state.supportMode === "scale"}">Frame on scale</button></div><div class="p133-control-grid"><label for="p133-volume"><span>Block volume V<output data-p133-output="volume">${format(state.volumeCm3, 0)} cm³</output></span><input id="p133-volume" type="range" min="50" max="600" step="10" value="${state.volumeCm3}"/></label><label for="p133-density"><span>Block density ρblock<output data-p133-output="density">${format(state.objectDensity, 0)} kg/m³</output></span><input id="p133-density" type="range" min="1500" max="8000" step="100" value="${state.objectDensity}"/></label><label class="p133-fluid-control" for="p133-fluid"><span>Fluid density ρfluid<output data-p133-output="fluid">${format(state.fluidDensity, 0)} kg/m³</output></span><input id="p133-fluid" type="range" min="500" max="1300" step="25" value="${state.fluidDensity}"/></label></div><p>Full submersion is maintained throughout. The block never contacts the beaker; the support and on-scale frame are ideal and massless.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p133-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p133-solution" aria-labelledby="p133-solution-heading"><h3 id="p133-solution-heading" tabindex="-1">The scale receives the buoyant reaction</h3><p>The object volume in SI units is V=250 cm³=250×10⁻⁶ m³=2.50×10⁻⁴ m³. Its buoyancy in water is therefore</p><div class="p133-equation">Fb=ρwater gV<br>=1000 kg/m³ × 9.81 m/s² × 2.50×10⁻⁴ m³<br>=2.4525 N</div><p>The beaker and water already exert 2.000 kg×9.81 m/s²=19.6200 N. With the block supported externally, its tension goes to the stand; only the block’s equal-and-opposite downward force on the water reaches the scale:</p><div class="p133-equation is-answer">Rscale=19.6200 N+2.4525 N=22.0725 N<br>To 0.01 N: 22.07 N</div><p>The given block density is not needed for that external-support reading. It gives mblock=ρblockV=0.750 kg and Wblock=7.3575 N, so the external stand supplies T=W−Fb=4.9050 N.</p><p>If the ideal frame instead rests on the scale, tension also crosses the scale boundary: Fb+T=Wblock. The reading becomes 19.6200+7.3575=26.9775 N.</p><p class="p133-limits"><strong>Assumptions and units.</strong> The block is static, rigid, completely submerged, carries no bubbles and touches neither beaker nor scale. Fluid density is uniform; the beaker contains no overflow change; surface tension and support/frame mass are ignored. N follows from kg·m/s². In Fb=ρgV, kg/m³×m/s²×m³=N. The external-support increase depends on displaced volume and fluid density, not block density; the on-scale increase is the block’s weight.</p></section>`;
  }

  function snapshot() {
    const values = scaleData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", assumptions: "static rigid fully submerged block; no vessel contact; no bubbles; uniform fluid; ideal massless support", gravityMetresPerSecondSquared: GRAVITY, beakerAndFluidMassKilograms: BASE_MASS_KG, supportMode: state.supportMode, objectVolumeCubicCentimetres: state.volumeCm3, objectDensityKilogramsPerCubicMetre: state.objectDensity, fluidDensityKilogramsPerCubicMetre: state.fluidDensity, objectMassKilograms: Number(values.objectMass.toFixed(9)), objectWeightNewtons: Number(values.objectWeight.toFixed(9)), buoyancyNewtons: Number(values.buoyancy.toFixed(9)), supportTensionNewtons: Number(values.supportTension.toFixed(9)), baseReadingNewtons: Number(values.baseReading.toFixed(9)), fluidReactionLoadNewtons: Number(values.fluidReactionLoad.toFixed(9)), supportLoadOnScaleNewtons: Number(values.supportLoadOnScale.toFixed(9)), addedLoadNewtons: Number(values.addedLoad.toFixed(9)), scaleReadingNewtons: Number(values.scaleReading.toFixed(9)), objectForceResidualNewtons: Number(values.objectResidual.toExponential(6)), scaleLedgerResidualNewtons: Number(values.scaleResidual.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p133-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive hydrostatics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p133-spread"><article class="book-page p133-problem-page"><div class="problem-number">Problem 13.3</div><h1 class="book-title p133-title">Balanced scales</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A beaker and water have total mass 2.000 kg and stand on a scale. A block of volume 250 cm³ and density 3000 kg/m³ is held fully submerged in the water by a separate external stand, without touching the beaker. Take ρwater=1000 kg/m³ and g=9.81 m/s².</p><p class="problem-copy"><strong>What does the scale read, to the nearest 0.01 N?</strong></p><section class="p133-observation-card"><strong>The spatial trap</strong><p>The block sits inside the water but outside the scale’s force system. Ask where its support ends, not merely where the block appears.</p></section><section class="p133-model-card"><div class="eyebrow">Ideal apparatus</div><p>Every case is static and fully submerged, with no block–beaker contact, overflow or support mass.</p></section></article><section class="book-page book-stage p133-stage">${stageControls()}<div class="p133-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p133-coach"><div class="coach-kicker">Audit the boundary</div><p class="coach-question">For the stated external-support setup, enter the total scale reading.</p><form class="p133-answer-form" data-p133-answer-form novalidate><label for="p133-answer">Scale reading</label><div><input id="p133-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="nearest 0.01" autocomplete="off"/><span>N</span></div><button class="primary-button" type="submit">Check scale reading</button></form>${feedbackMarkup()}<div class="button-row p133-help-row"><button class="secondary-button" type="button" data-problem-action="p133-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p133-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p133-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p133-shell"); if (!root) return;
    const dynamic = root.querySelector(".p133-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = scaleData();
    const outputs = { volume: `${format(state.volumeCm3, 0)} cm³`, density: `${format(state.objectDensity, 0)} kg/m³`, fluid: `${format(state.fluidDensity, 0)} kg/m³` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p133-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p133-volume")?.setAttribute("aria-valuetext", `Block volume ${format(state.volumeCm3, 0)} cubic centimetres; buoyancy ${format(values.buoyancy, 4)} newtons`);
    root.querySelector("#p133-density")?.setAttribute("aria-valuetext", `Block density ${format(state.objectDensity, 0)} kilograms per cubic metre; weight ${format(values.objectWeight, 4)} newtons`);
    root.querySelector("#p133-fluid")?.setAttribute("aria-valuetext", `Fluid density ${format(state.fluidDensity, 0)} kilograms per cubic metre; buoyancy ${format(values.buoyancy, 4)} newtons`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p133-reset") { state = initialState(); renderAndFocus(renderApp, "#p133-volume"); return; }
      if (action === "p133-stage") { state.stage = clamp(Number(control.dataset.p133Stage), 0, 2); renderAndFocus(renderApp, `[data-p133-stage="${state.stage}"]`); return; }
      if (action === "p133-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p133-stage="${state.stage}"]`); return; }
      if (action === "p133-mode") { state.supportMode = control.dataset.p133Mode === "scale" ? "scale" : "external"; renderAndFocus(renderApp, `[data-p133-mode="${state.supportMode}"]`); return; }
      if (action === "p133-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p133-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p133-reveal") window.requestAnimationFrame(() => document.querySelector("#p133-solution-heading")?.focus());
    }));
    [["#p133-volume", "volumeCm3", 50, 600], ["#p133-density", "objectDensity", 1500, 8000], ["#p133-fluid", "fluidDensity", 500, 1300]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); state.feedback = ""; state.committed = false; updateDynamicDom(); }));
    const input = document.querySelector("#p133-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p133-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter the total scale reading in newtons, rounded to 0.01 N.";
      else if (Math.abs(answer - CHALLENGE_BUOYANCY_N) < .01) state.feedback = "That is only the added buoyant load. Include the original 19.6200 N beaker-and-water reading.";
      else if (Math.abs(answer - 26.98) < .01) state.feedback = "That is the on-scale-frame reading. Here the external stand carries the support tension.";
      else if (Math.abs(answer - 22.07) > .006) state.feedback = "The external stand carries the block. Add only the block’s downward buoyant reaction, ρwater gV, to the original reading.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: the water receives ${format(CHALLENGE_BUOYANCY_N, 4)} N downward, so the scale reads ${format(CHALLENGE_READING_N, 4)} N, or 22.07 N.`; }
      renderAndFocus(renderApp, "#p133-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
