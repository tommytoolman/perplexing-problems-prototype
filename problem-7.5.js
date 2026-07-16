(function registerBoyleVasePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "7.5";
  const DENSITY = 1000;
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ sourceHead: 0.8, targetHead: 1.3, tubeRadiusMm: 10, vaseRadius: 0.3 });
  const CHALLENGE_SHORTFALL = DENSITY * GRAVITY * (CHALLENGE.targetHead - CHALLENGE.sourceHead);
  const stages = Object.freeze([
    Object.freeze({ short: "Levels", title: "Connect a wide vase to a narrow tube", copy: "At rest, connected water exposed to the same atmospheric pressure seeks the same free-surface height, regardless of width." }),
    Object.freeze({ short: "Pressure", title: "Count vertical head, not water weight", copy: "At a common bottom connection, gauge pressure is ρgh. Cross-sectional area changes force and water mass together, leaving pressure unchanged." }),
    Object.freeze({ short: "Energy", title: "Close the self-refilling loop", copy: "Returning water above its source needs extra pressure and gravitational work. A narrower tube adds resistance; it cannot create head." }),
  ]);
  const hints = Object.freeze([
    "Measure both heights from the same bottom connection. The source supplies gauge pressure ps=ρghs.",
    "A return column reaching the proposed lip would require pt=ρght at its bottom.",
    "The missing pressure is Δp=pt−ps=ρg(ht−hs). Tube radius does not appear.",
    "For the challenge, the missing head is 1.30−0.80=0.50 m of water.",
    "Thus Δp=(1000 kg/m³)(9.81 m/s²)(0.50 m)=4905 Pa=4.905 kPa.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p75-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 3) { if (Math.abs(value) < 0.5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18); }

  const initialState = () => ({ sourceHead: CHALLENGE.sourceHead, targetHead: CHALLENGE.targetHead, tubeRadiusMm: CHALLENGE.tubeRadiusMm, vaseRadius: CHALLENGE.vaseRadius, stage: 0, answer: "", committed: false, feedback: "", feedbackTone: "neutral", hintsUsed: 0, revealed: false });
  let state = initialState();

  function hydroFor(sourceHead = state.sourceHead, targetHead = state.targetHead, tubeRadiusMm = state.tubeRadiusMm, vaseRadius = state.vaseRadius) {
    const sourcePressure = DENSITY * GRAVITY * sourceHead;
    const targetPressure = DENSITY * GRAVITY * targetHead;
    const pressureMargin = sourcePressure - targetPressure;
    const shortfall = Math.max(0, -pressureMargin);
    const downhillHead = Math.max(0, sourceHead - targetHead);
    const pumpWorkPerLitre = shortfall * 0.001;
    const tubeRadius = tubeRadiusMm / 1000;
    const tubeArea = Math.PI * tubeRadius ** 2;
    const sourceColumnWeight = DENSITY * tubeArea * sourceHead * GRAVITY;
    const pressureForceAtBottom = sourcePressure * tubeArea;
    const vaseArea = Math.PI * vaseRadius ** 2;
    return { sourcePressure, targetPressure, pressureMargin, shortfall, downhillHead, pumpWorkPerLitre, tubeRadius, tubeArea, sourceColumnWeight, pressureForceAtBottom, vaseArea };
  }

  function regime(values = hydroFor()) {
    if (values.pressureMargin > 1) return "downhill";
    if (values.pressureMargin < -1) return "blocked";
    return "level";
  }

  function regimeLabel(values = hydroFor()) {
    const current = regime(values);
    if (current === "downhill") return "Downhill head available · not perpetual";
    if (current === "blocked") return "Return stalls at the source free-surface level";
    return "Equal heads · hydrostatic equilibrium, no flow";
  }

  function reconstructionNote() {
    return `<p class="eq7-reconstruction-note p75-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This original hydrostatic audit does not reproduce the book’s wording, apparatus or solution.</p>`;
  }

  function stageControls() { return `<div class="p75-stage-controls" role="group" aria-label="Hydrostatic audit stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p75-stage" data-p75-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaption() { const stage = stages[state.stage]; return `<div class="p75-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p75-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Loop audited" : "Next stage"}</button></div>`; }

  function vaseSvg() {
    const values = hydroFor();
    const bottomY = 325, pixelsPerMetre = 185;
    const sourceY = bottomY - state.sourceHead * pixelsPerMetre;
    const targetY = bottomY - state.targetHead * pixelsPerMetre;
    const waterTopY = Math.max(sourceY, targetY);
    const vaseHalfWidth = 68 + state.vaseRadius * 120;
    const vaseCentreX = 200, left = vaseCentreX - vaseHalfWidth, right = vaseCentreX + vaseHalfWidth;
    const tubeX = 520, tubeWidth = clamp(8 + state.tubeRadiusMm * 0.45, 10, 34);
    const shortfallPixels = Math.max(0, sourceY - targetY);
    const pressureScale = 210 / Math.max(20000, values.sourcePressure, values.targetPressure);
    return `
      <svg class="p75-svg p75-stage-${state.stage} is-${regime(values)}" viewBox="0 0 720 450" role="img" aria-labelledby="p75-svg-title p75-svg-desc">
        <title id="p75-svg-title">Wide vase connected to a narrow proposed return tube</title>
        <desc id="p75-svg-desc">Source free surface is ${format(state.sourceHead, 2)} metres above the bottom connection. Proposed return lip is ${format(state.targetHead, 2)} metres high. The connected tube water reaches the source level. ${regimeLabel(values)}. Pressure shortfall is ${format(values.shortfall / 1000, 3)} kilopascals.</desc>
        <defs><marker id="p75-arrow-pressure" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker></defs>
        <path class="p75-sky" d="M0 0H720V450H0Z"/>
        <path class="p75-vase-water" d="M${format(left + 8)} ${format(sourceY)} H${format(right - 8)} V${bottomY - 8} H${format(left + 8)}Z"/>
        <path class="p75-vase" d="M${format(left)} 64 V${bottomY - 28} Q${format(left)} ${bottomY} ${format(left + 30)} ${bottomY} H${format(right - 4)}"/>
        <line class="p75-source-surface" x1="${format(left + 7)}" y1="${format(sourceY)}" x2="${format(right - 7)}" y2="${format(sourceY)}"/>
        <path class="p75-tube-outer" style="stroke-width:${format(tubeWidth + 8)}px" d="M${format(right - 4)} ${bottomY} H${tubeX} V${format(targetY)} h34"/>
        <path class="p75-tube-water" style="stroke-width:${format(tubeWidth)}px" d="M${format(right - 4)} ${bottomY} H${tubeX} V${format(waterTopY)}"/>
        <line class="p75-target-lip" x1="${tubeX - 8}" y1="${format(targetY)}" x2="${tubeX + 42}" y2="${format(targetY)}"/>
        <line class="p75-equal-level" x1="${format(left - 15)}" y1="${format(sourceY)}" x2="${tubeX + 22}" y2="${format(sourceY)}"/>
        <text class="p75-source-label" x="${vaseCentreX}" y="${format(sourceY - 12)}" text-anchor="middle">source surface hs=${format(state.sourceHead, 2)} m</text>
        <text class="p75-target-label" x="${tubeX + 45}" y="${format(targetY + 4)}">claimed lip ht=${format(state.targetHead, 2)} m</text>
        <text class="p75-level-label" x="${tubeX - 8}" y="${format(sourceY - 8)}" text-anchor="end">connected water reaches this same level</text>
        ${shortfallPixels > 2 ? `<g class="p75-shortfall"><line x1="${tubeX + 22}" y1="${format(sourceY)}" x2="${tubeX + 22}" y2="${format(targetY)}"/><text x="${tubeX + 30}" y="${format((sourceY + targetY) / 2)}">missing Δh=${format(state.targetHead - state.sourceHead, 2)} m</text></g>` : ""}
        <g class="p75-pressure-layer"><line class="p75-pressure-source" x1="105" y1="358" x2="${format(105 + values.sourcePressure * pressureScale)}" y2="358" marker-end="url(#p75-arrow-pressure)"/><text x="105" y="347">available ρghs=${format(values.sourcePressure / 1000, 2)} kPa</text><line class="p75-pressure-target" x1="390" y1="390" x2="${format(390 + values.targetPressure * pressureScale)}" y2="390" marker-end="url(#p75-arrow-pressure)"/><text x="390" y="379">needed ρght=${format(values.targetPressure / 1000, 2)} kPa</text></g>
        <g class="p75-status" transform="translate(392 51)"><rect width="278" height="61" rx="13"/><text class="p75-status-kicker" x="139" y="20" text-anchor="middle">HYDROSTATIC VERDICT</text><text class="p75-status-value" x="139" y="42" text-anchor="middle">${regimeLabel(values)}</text></g>
        <g class="p75-energy-layer"><rect x="128" y="407" width="464" height="29" rx="10"/><text x="360" y="426" text-anchor="middle">minimum external work = ${format(values.pumpWorkPerLitre, 3)} J per litre returned</text></g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = hydroFor();
    const margin = values.pressureMargin >= 0 ? `+${format(values.pressureMargin / 1000, 3)} kPa available` : `${format(Math.abs(values.pressureMargin) / 1000, 3)} kPa short`;
    return `<section class="p75-metrics is-${regime(values)}" aria-live="polite"><div><span>Source gauge pressure</span><strong>${format(values.sourcePressure / 1000, 3)} kPa</strong></div><div><span>Pressure at proposed lip head</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.targetPressure / 1000, 3)} kPa` : "stage 2"}</strong></div><div><span>Head verdict</span><strong>${state.stage >= 2 || state.revealed ? margin : "stage 3"}</strong><small>${state.stage >= 2 || state.revealed ? `${format(values.pumpWorkPerLitre, 3)} J/L pump minimum` : "close the energy loop"}</small></div><p><strong>${regimeLabel(values)}.</strong> Tube area ${format(values.tubeArea * 1e6, 2)} mm²: column weight and bottom pressure force are both ${format(values.sourceColumnWeight, 4)} N.</p></section>`;
  }

  function controlsMarkup() {
    return `<section class="p75-controls" aria-label="Hydrostatic vase controls"><label for="p75-source"><span>Source surface hs<strong data-p75-output="source">${format(state.sourceHead, 2)} m</strong></span><input id="p75-source" type="range" min="0.2" max="1.5" step="0.05" value="${state.sourceHead}"/></label><label for="p75-target"><span>Return lip ht<strong data-p75-output="target">${format(state.targetHead, 2)} m</strong></span><input id="p75-target" type="range" min="0.2" max="1.7" step="0.05" value="${state.targetHead}"/></label><label for="p75-tube"><span>Return tube radius<strong data-p75-output="tube">${format(state.tubeRadiusMm, 0)} mm</strong></span><input id="p75-tube" type="range" min="5" max="50" step="1" value="${state.tubeRadiusMm}"/></label><label for="p75-vase"><span>Vase radius<strong data-p75-output="vase">${format(state.vaseRadius, 2)} m</strong></span><input id="p75-vase" type="range" min="0.1" max="0.5" step="0.02" value="${state.vaseRadius}"/></label><div class="p75-presets" role="group" aria-label="Hydrostatic presets"><button class="chip-button" type="button" data-problem-action="p75-challenge">Challenge setup</button><button class="chip-button" type="button" data-problem-action="p75-level">Equal levels</button><button class="chip-button" type="button" data-problem-action="p75-downhill">Downhill outlet</button><button class="chip-button" type="button" data-problem-action="p75-narrow">Very narrow tube</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p75-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p75-solution" aria-labelledby="p75-solution-heading"><h3 id="p75-solution-heading" tabindex="-1">Pressure head ignores the tube width</h3><p>At the common bottom connection, the source free surface supplies gauge pressure</p><div class="p75-equation">ps=ρghs</div><p>Supporting water to the claimed return lip would require pt=ρght. Therefore the missing pressure is</p><div class="p75-equation">Δp=ρg(ht−hs)</div><p>For hs=0.80 m and ht=1.30 m:</p><div class="p75-equation p75-answer-equation">Δp=(1000)(9.81)(0.50)=4905 Pa=${format(CHALLENGE_SHORTFALL / 1000, 3)} kPa</div><p>The exact requested pressure is <strong>4.905 kPa</strong>. For each litre returned, even an ideal pump must supply ΔpV=(4905 Pa)(0.001 m³)=4.905 J.</p><p>A narrower return tube contains less water, but pressure force also acts on proportionally less area: (ρgh)A equals the column weight ρAhg. Width cancels.</p><p class="p75-insight"><strong>Checks.</strong> If ht=hs, Δp=0 but there is no driving head and therefore no sustained flow. If ht&lt;hs, flow is downhill and merely redistributes water until the head disappears. Since ρgh has units kg·m⁻¹·s⁻²=Pa, the calculation is dimensionally consistent. Viscous resistance in a real narrow tube only increases the required pressure.</p></section>`;
  }

  function stateSnapshot() { const values = hydroFor(); return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", sourceHeadMetres: state.sourceHead, targetHeadMetres: state.targetHead, returnTubeRadiusMm: state.tubeRadiusMm, vaseRadiusMetres: state.vaseRadius, sourceGaugePressurePascals: Number(values.sourcePressure.toFixed(6)), targetHeadPressurePascals: Number(values.targetPressure.toFixed(6)), pressureMarginPascals: Number(values.pressureMargin.toFixed(6)), pressureShortfallPascals: Number(values.shortfall.toFixed(6)), minimumPumpWorkJoulesPerLitre: Number(values.pumpWorkPerLitre.toFixed(6)), hydrostaticRegime: regime(values), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2); }

  function render() {
    return `<main class="book-shell eq7-shell p75-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive hydrostatics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread eq7-spread p75-spread"><article class="book-page p75-problem-page"><div class="problem-number">Problem 7.5</div><h1 class="book-title eq7-title p75-title">Boyle’s perpetual vase</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A proposed self-refilling vase connects a broad reservoir to a narrow return tube at their common bottom. The source free surface is 0.80 m above the connection, while the return lip is 1.30 m above it.</p><p class="problem-copy"><strong>What additional gauge pressure is required to push water to the return lip?</strong></p><section class="p75-principle-card"><strong>Same liquid, same atmosphere</strong><p>Both exposed surfaces are at atmospheric pressure. Static pressure differences therefore depend only on vertical water head.</p></section><section class="p75-boundary-card"><strong>Model boundary</strong><p>Water has density 1000 kg/m³. The ideal calculation ignores viscosity; real tube resistance can only make the proposal less favourable.</p></section></article><section class="book-page book-stage eq7-stage p75-stage">${stageControls()}<div class="p75-visual-card"><div data-p75-svg-slot>${vaseSvg()}</div>${stageCaption()}</div>${controlsMarkup()}<div data-p75-metrics-slot>${metricsMarkup()}</div></section><aside class="book-page book-coach p75-coach"><div class="coach-kicker">Count the missing head</div><p class="coach-question">For hs=0.80 m and ht=1.30 m, give the extra gauge pressure in kilopascals.</p><form class="p75-answer-form" data-p75-answer-form novalidate><label for="p75-answer">Additional pressure required</label><div><input id="p75-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 5.0" autocomplete="off"/><span>kPa</span></div><button class="primary-button" type="submit">Check the pressure head</button></form>${feedbackMarkup()}<div class="button-row p75-help-row"><button class="secondary-button" type="button" data-problem-action="p75-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p75-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="eq7-debug">${debugPanel("Development state", stateSnapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p75-shell"); if (!root) return;
    const svgSlot = root.querySelector("[data-p75-svg-slot]"), metricsSlot = root.querySelector("[data-p75-metrics-slot]"); if (svgSlot) svgSlot.innerHTML = vaseSvg(); if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = { source: `${format(state.sourceHead, 2)} m`, target: `${format(state.targetHead, 2)} m`, tube: `${format(state.tubeRadiusMm, 0)} mm`, vase: `${format(state.vaseRadius, 2)} m` };
    Object.entries(outputs).forEach(([key, value]) => { const node = root.querySelector(`[data-p75-output="${key}"]`); if (node) node.textContent = value; });
    const values = hydroFor();
    root.querySelector("#p75-source")?.setAttribute("aria-valuetext", `${format(state.sourceHead, 2)} metre source head; ${regimeLabel(values)}`);
    root.querySelector("#p75-target")?.setAttribute("aria-valuetext", `${format(state.targetHead, 2)} metre target head; ${format(values.shortfall / 1000, 3)} kilopascal shortfall`);
    root.querySelector("#p75-tube")?.setAttribute("aria-valuetext", `${format(state.tubeRadiusMm, 0)} millimetre tube radius; equilibrium height unchanged`);
    root.querySelector("#p75-vase")?.setAttribute("aria-valuetext", `${format(state.vaseRadius, 2)} metre vase radius; equilibrium height unchanged`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function restoreChallenge() { state.sourceHead = CHALLENGE.sourceHead; state.targetHead = CHALLENGE.targetHead; state.tubeRadiusMm = CHALLENGE.tubeRadiusMm; state.vaseRadius = CHALLENGE.vaseRadius; }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p75-reset") { state = initialState(); renderAndFocus(renderApp, "#p75-source"); return; }
      if (action === "p75-stage") { state.stage = clamp(Number(control.dataset.p75Stage), 0, 2); renderAndFocus(renderApp, `[data-p75-stage="${state.stage}"]`); return; }
      if (action === "p75-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p75-stage="${state.stage}"]`); return; }
      if (action === "p75-challenge") { restoreChallenge(); renderAndFocus(renderApp, "#p75-source"); return; }
      if (action === "p75-level") { state.targetHead = state.sourceHead; renderAndFocus(renderApp, "#p75-target"); return; }
      if (action === "p75-downhill") { state.targetHead = clamp(state.sourceHead - 0.3, 0.2, 1.7); renderAndFocus(renderApp, "#p75-target"); return; }
      if (action === "p75-narrow") { state.tubeRadiusMm = 5; renderAndFocus(renderApp, "#p75-tube"); return; }
      if (action === "p75-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p75-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p75-reveal") window.requestAnimationFrame(() => document.querySelector("#p75-solution-heading")?.focus());
    }));
    [{ selector: "#p75-source", key: "sourceHead", min: 0.2, max: 1.5 }, { selector: "#p75-target", key: "targetHead", min: 0.2, max: 1.7 }, { selector: "#p75-tube", key: "tubeRadiusMm", min: 5, max: 50 }, { selector: "#p75-vase", key: "vaseRadius", min: 0.1, max: 0.5 }].forEach(({ selector, key, min, max }) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), min, max); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p75-answer"); answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p75-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one additional pressure in kilopascals.";
      else if (Math.abs(answer - CHALLENGE_SHORTFALL / 1000) <= 0.012) { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: Δp=ρg(1.30−0.80)=${format(CHALLENGE_SHORTFALL / 1000, 3)} kPa. The same number is the minimum joules per litre.`; }
      else if (Math.abs(answer - CHALLENGE_SHORTFALL) <= 12) state.feedback = "That is the correct value in pascals. Divide by 1000 because the answer box asks for kilopascals.";
      else state.feedback = "Use only the missing vertical head: Δp=ρg(ht−hs). Tube and vase radii cancel from hydrostatic pressure.";
      renderAndFocus(renderApp, "#p75-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
