(function registerStrangeFishPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "11.5";
  const CHALLENGE = Object.freeze({ depthM: 3, waterIndex: 4 / 3, outsideIndex: 1, incidenceDegrees: 30 });
  const CHALLENGE_APPARENT_DEPTH_M = Math.sqrt(15) / 2;
  const stages = Object.freeze([
    Object.freeze({ short: "Snell", title: "Measure both angles from the normal", copy: "The selected water ray reaches the flat surface at θw. Snell’s law either determines an outside angle or rules transmission out." }),
    Object.freeze({ short: "Apparent", title: "Back-project the transmitted ray", copy: "Together with the undeviated axial reference ray, the backward extension locates the angle-dependent apparent fish depth." }),
    Object.freeze({ short: "Escape cone", title: "Test the four-star boundary", copy: "When nwater>noutside, only rays inside θc=asin(noutside/nwater) escape. Larger internal angles totally reflect." }),
  ]);
  const hints = Object.freeze([
    "Angles are measured from the vertical surface normal. Apply nwater sinθw=noutside sinθout.",
    "The selected ray travels horizontally d tanθw before reaching the surface. Its back-projection travels the same horizontal distance in apparent depth da tanθout.",
    "Therefore da=d tanθw/tanθout. At normal incidence use the limiting value da=d noutside/nwater.",
    "For θw=30°, sinθout=(4/3)(1/2)=2/3, so tanθout=2/√5 while tanθw=1/√3.",
    "Four-star extension: transmission ceases when sinθw>noutside/nwater. For water to air, θc=asin(3/4)=48.5904°.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p115-reset">Reset</button>';

  const initialState = () => ({ depthM: CHALLENGE.depthM, waterIndex: CHALLENGE.waterIndex, outsideIndex: CHALLENGE.outsideIndex, incidenceDegrees: CHALLENGE.incidenceDegrees, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function rayData(depthM = state.depthM, waterIndex = state.waterIndex, outsideIndex = state.outsideIndex, incidenceDegrees = state.incidenceDegrees) {
    const incidenceRadians = incidenceDegrees * Math.PI / 180;
    const snellRatio = waterIndex * Math.sin(incidenceRadians) / outsideIndex;
    const tolerance = 1e-12;
    const transmitted = snellRatio <= 1 + tolerance;
    const outsideRadians = transmitted ? Math.asin(clamp(snellRatio, -1, 1)) : null;
    const outsideDegrees = outsideRadians === null ? null : outsideRadians * 180 / Math.PI;
    const grazing = transmitted && Math.abs(snellRatio - 1) <= tolerance;
    let apparentDepth = null;
    if (transmitted) {
      apparentDepth = Math.abs(incidenceRadians) < 1e-10 ? depthM * outsideIndex / waterIndex : depthM * Math.tan(incidenceRadians) / Math.tan(outsideRadians);
    }
    const criticalRadians = waterIndex > outsideIndex ? Math.asin(outsideIndex / waterIndex) : null;
    const criticalDegrees = criticalRadians === null ? null : criticalRadians * 180 / Math.PI;
    const escapeFractionOfUpwardHemisphere = criticalRadians === null ? 1 : 1 - Math.cos(criticalRadians);
    const snellResidual = transmitted ? waterIndex * Math.sin(incidenceRadians) - outsideIndex * Math.sin(outsideRadians) : null;
    return { incidenceRadians, snellRatio, transmitted, outsideRadians, outsideDegrees, grazing, apparentDepth, criticalRadians, criticalDegrees, escapeFractionOfUpwardHemisphere, snellResidual, regime: transmitted ? grazing ? "grazing" : "transmitted" : "tir" };
  }

  function regimeLabel(values = rayData()) {
    if (values.regime === "tir") return "Total internal reflection";
    if (values.regime === "grazing") return "Critical grazing transmission";
    return "Ray transmitted to observer";
  }

  function reconstructionNote() {
    return `<p class="p115-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source gives this problem an unusual three-or-four-star rating but preserves no usable wording. This water-surface refraction problem and escape-cone extension are newly written.</p>`;
  }

  function stageControls() {
    return `<div class="p115-stage-controls" role="group" aria-label="Fish refraction stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p115-stage" data-p115-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p115-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p115-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Escape cone tested" : "Next stage"}</button></div>`;
  }

  function refractionSvg() {
    const values = rayData();
    const surfaceY = 158, fishX = 230;
    const tangentInside = Math.tan(values.incidenceRadians);
    const depthPixels = Math.min(190, 310 / Math.max(tangentInside, 0.01));
    const fishY = surfaceY + depthPixels;
    const interfaceX = fishX + depthPixels * tangentInside;
    let eyeX = interfaceX, eyeY = 34;
    if (values.transmitted) {
      const tangentOutside = Math.tan(values.outsideRadians);
      const availableX = Math.max(12, 682 - interfaceX);
      const airHeight = Math.min(118, availableX / Math.max(tangentOutside, 0.001));
      eyeX = interfaceX + airHeight * tangentOutside;
      eyeY = surfaceY - airHeight;
    }
    const imageY = values.apparentDepth === null ? null : surfaceY + depthPixels * values.apparentDepth / state.depthM;
    let reflectedEnd = null;
    if (!values.transmitted) {
      const travel = Math.min(145, (684 - interfaceX) / Math.max(Math.sin(values.incidenceRadians), 0.1));
      reflectedEnd = { x: interfaceX + travel * Math.sin(values.incidenceRadians), y: surfaceY + travel * Math.cos(values.incidenceRadians) };
    }
    const coneDx = values.criticalRadians === null ? 214 : Math.min(214, depthPixels * Math.tan(values.criticalRadians));
    const coneLeft = Math.max(16, fishX - coneDx), coneRight = Math.min(676, fishX + coneDx);
    const criticalCopy = values.criticalDegrees === null ? "no total-internal-reflection boundary" : `θc=${format(values.criticalDegrees, 3)}°`;
    const statusValue = state.stage === 0 ? `nwater sinθw = ${format(state.waterIndex * Math.sin(values.incidenceRadians), 4)}` : state.stage === 1 ? values.transmitted ? `θout=${format(values.outsideDegrees, 4)}° · da=${format(values.apparentDepth, 4)} m` : "no transmitted image from this ray" : `${criticalCopy} · ${regimeLabel(values)}`;
    return `<svg class="p115-svg p115-stage-${state.stage} is-${values.regime}" viewBox="0 0 720 445" role="img" aria-labelledby="p115-svg-title p115-svg-desc">
      <title id="p115-svg-title">Fish apparent depth and water-surface escape cone</title>
      <desc id="p115-svg-desc">A fish ${format(state.depthM, 3)} metres below a flat interface sends a ray at ${format(state.incidenceDegrees, 3)} degrees from the normal. The water-side index is ${format(state.waterIndex, 4)} and outside index ${format(state.outsideIndex, 4)}. ${values.transmitted ? `The ray transmits at ${format(values.outsideDegrees, 4)} degrees and back-projects to apparent depth ${format(values.apparentDepth, 4)} metres.` : "The chosen ray exceeds the critical angle and is totally internally reflected, so it gives no transmitted apparent image."} ${values.criticalDegrees === null ? "There is no total-internal-reflection critical angle for these indices." : `The critical angle is ${format(values.criticalDegrees, 4)} degrees.`}</desc>
      <defs><linearGradient id="p115-water-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ad6df" stop-opacity=".55"/><stop offset="1" stop-color="#317b93" stop-opacity=".78"/></linearGradient><marker id="p115-ray-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p115-air" x="1" y="1" width="718" height="${surfaceY}" rx="20"/><rect class="p115-water" x="1" y="${surfaceY}" width="718" height="286"/><line class="p115-surface" x1="1" y1="${surfaceY}" x2="719" y2="${surfaceY}"/><text class="p115-medium-label" x="22" y="42">outside medium · n=${format(state.outsideIndex, 3)}</text><text class="p115-medium-label" x="22" y="188">water side · n=${format(state.waterIndex, 3)}</text>
      <g class="p115-escape-layer"><path class="p115-cone-fill" d="M${fishX} ${format(fishY, 2)}L${format(coneLeft, 2)} ${surfaceY}L${format(coneRight, 2)} ${surfaceY}Z"/><line class="p115-cone-boundary" x1="${fishX}" y1="${format(fishY, 2)}" x2="${format(coneLeft, 2)}" y2="${surfaceY}"/><line class="p115-cone-boundary" x1="${fishX}" y1="${format(fishY, 2)}" x2="${format(coneRight, 2)}" y2="${surfaceY}"/><text class="p115-cone-label" x="${fishX}" y="${format(fishY - 46, 2)}" text-anchor="middle">${values.criticalDegrees === null ? "all upward directions transmit" : `escape cone · ${criticalCopy}`}</text></g>
      <g class="p115-fish" transform="translate(${fishX} ${format(fishY, 2)})"><ellipse rx="24" ry="12"/><path d="M-22 0L-39-14V14Z"/><circle cx="13" cy="-3" r="2"/><text y="31" text-anchor="middle">true depth d=${format(state.depthM, 2)} m</text></g>
      <line class="p115-normal" x1="${format(interfaceX, 2)}" y1="92" x2="${format(interfaceX, 2)}" y2="230"/><text class="p115-normal-label" x="${format(interfaceX + 7, 2)}" y="104">normal</text>
      <g class="p115-incident-layer"><line class="p115-selected-incident" x1="${fishX}" y1="${format(fishY, 2)}" x2="${format(interfaceX, 2)}" y2="${surfaceY}" marker-end="url(#p115-ray-arrow)"/><text class="p115-angle-label" x="${format(interfaceX - 24, 2)}" y="${surfaceY + 44}">θw=${format(state.incidenceDegrees, 2)}°</text></g>
      <g class="p115-outcome-layer">${values.transmitted ? `<line class="p115-transmitted-ray" x1="${format(interfaceX, 2)}" y1="${surfaceY}" x2="${format(eyeX, 2)}" y2="${format(eyeY, 2)}" marker-end="url(#p115-ray-arrow)"/><text class="p115-angle-label is-outside" x="${format(interfaceX + 16, 2)}" y="${surfaceY - 36}">θout=${format(values.outsideDegrees, 2)}°</text><g class="p115-eye" transform="translate(${format(eyeX, 2)} ${format(eyeY, 2)})"><path d="M-19 0Q0-15 19 0Q0 15-19 0Z"/><circle r="5"/><text y="27" text-anchor="middle">observer</text></g><line class="p115-axial-ray" x1="${fishX}" y1="${format(fishY, 2)}" x2="${fishX}" y2="42"/><g class="p115-image-layer"><line class="p115-back-projection" x1="${fishX}" y1="${format(imageY, 2)}" x2="${format(interfaceX, 2)}" y2="${surfaceY}"/><circle class="p115-apparent-fish" cx="${fishX}" cy="${format(imageY, 2)}" r="11"/><text class="p115-image-label" x="${fishX}" y="${format(imageY + 25, 2)}" text-anchor="middle">apparent fish · da=${format(values.apparentDepth, 3)} m</text></g>` : `<line class="p115-reflected-ray" x1="${format(interfaceX, 2)}" y1="${surfaceY}" x2="${format(reflectedEnd.x, 2)}" y2="${format(reflectedEnd.y, 2)}" marker-end="url(#p115-ray-arrow)"/><text class="p115-tir-label" x="${format(interfaceX + 17, 2)}" y="${surfaceY + 26}">TIR · reflected angle ${format(state.incidenceDegrees, 2)}°</text><line class="p115-axial-ray" x1="${fishX}" y1="${format(fishY, 2)}" x2="${fishX}" y2="42"/>`}</g>
      <g class="p115-status" transform="translate(382 20)"><rect width="318" height="69" rx="13"/><text class="p115-status-kicker" x="15" y="21">${state.stage === 0 ? "SNELL TEST" : state.stage === 1 ? "ANGLE-DEPENDENT IMAGE" : "★★★★ ESCAPE-CONE EXTENSION"}</text><text class="p115-status-value" x="15" y="45">${statusValue}</text><text class="p115-status-note" x="15" y="61">angles measured from surface normal · depths positive downward</text></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = rayData();
    return `<section class="p115-metrics" aria-live="polite"><div><span>Outside ray angle</span><strong>${state.stage >= 1 || state.revealed ? values.transmitted ? `${format(values.outsideDegrees, 4)}°` : "no transmitted ray" : "stage 2"}</strong></div><div><span>Apparent depth</span><strong>${state.stage >= 1 || state.revealed ? values.apparentDepth === null ? "not defined for selected ray" : `${format(values.apparentDepth, 4)} m` : "stage 2"}</strong></div><div><span>Critical angle</span><strong>${state.stage >= 2 || state.revealed ? values.criticalDegrees === null ? "none · nwater≤noutside" : `${format(values.criticalDegrees, 4)}°` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p115-dynamic">${refractionSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p115-controls" aria-label="Fish refraction controls"><div class="p115-control-grid"><label for="p115-depth"><span>True fish depth d<output data-p115-output="depth">${format(state.depthM, 2)} m</output></span><input id="p115-depth" type="range" min="0.5" max="10" step="0.1" value="${state.depthM}"/></label><label for="p115-water-index"><span>Water-side index nwater<output data-p115-output="water-index">${format(state.waterIndex, 3)}</output></span><input id="p115-water-index" type="range" min="1.05" max="1.8" step="0.01" value="${state.waterIndex}"/></label><label for="p115-outside-index"><span>Outside index noutside<output data-p115-output="outside-index">${format(state.outsideIndex, 3)}</output></span><input id="p115-outside-index" type="range" min="1" max="1.5" step="0.01" value="${state.outsideIndex}"/></label><label for="p115-angle"><span>Internal incidence angle θw<output data-p115-output="angle">${format(state.incidenceDegrees, 1)}°</output></span><input id="p115-angle" type="range" min="0" max="80" step="0.5" value="${state.incidenceDegrees}"/></label></div><p>θw=0° is vertical. For nwater&gt;noutside, move θw beyond the critical angle to enter the four-star total-internal-reflection extension.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p115-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p115-solution" aria-labelledby="p115-solution-heading"><h3 id="p115-solution-heading" tabindex="-1">Use one refracted ray and one axial ray</h3><p>Snell’s law for water to air gives</p><div class="p115-equation">(4/3)sin30°=sinθair=2/3<br>tanθair=(2/3)/(√5/3)=2/√5</div><p>The selected ray moves horizontally by x=d tanθwater. Its backward extension reaches the vertical axial ray after apparent depth da, so x=da tanθair:</p><div class="p115-equation">da=d tanθwater/tanθair</div><div class="p115-equation p115-answer-equation">da=3(1/√3)/(2/√5)=√15/2 m<br>da=${CHALLENGE_APPARENT_DEPTH_M.toFixed(6)} m ≈1.94 m</div><p>At normal viewing the limiting value is d noutside/nwater=2.25 m; the apparent position depends on viewing angle because a plane refracting surface is not perfectly stigmatic.</p><h3>★★★★ Escape-cone extension</h3><p>Transmission requires nwater sinθwater≤noutside. Therefore</p><div class="p115-equation">θc=asin(noutside/nwater)=asin(3/4)=48.590378°</div><p>Above this internal angle, the selected ray totally reflects and supplies no transmitted apparent image to that observer. The escape cone occupies fraction 1−cosθc of the upward hemisphere’s solid angle.</p><p class="p115-checks"><strong>Checks and boundary.</strong> If the indices are equal, θair=θwater and da=d. At θwater→0, da→d noutside/nwater. At θwater→θc from below, θair→90° and the single-ray apparent depth tends to zero. Snell’s law is dimensionless and depths remain in metres. The model assumes a flat infinite interface, homogeneous media, geometric rays and a point fish; it omits waves, Fresnel brightness, surface ripples, absorption and finite pupils.</p></section>`;
  }

  function snapshot() {
    const values = rayData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "unusual three-or-four-star rating; no usable source wording", trueDepthMetres: state.depthM, waterSideIndex: state.waterIndex, outsideIndex: state.outsideIndex, internalIncidenceDegreesFromNormal: state.incidenceDegrees, snellRatio: Number(values.snellRatio.toFixed(9)), regime: values.regime, transmitted: values.transmitted, outsideAngleDegreesFromNormal: values.outsideDegrees === null ? null : Number(values.outsideDegrees.toFixed(9)), apparentDepthMetres: values.apparentDepth === null ? null : Number(values.apparentDepth.toFixed(9)), criticalAngleDegrees: values.criticalDegrees === null ? null : Number(values.criticalDegrees.toFixed(9)), escapeFractionOfUpwardHemisphere: Number(values.escapeFractionOfUpwardHemisphere.toFixed(9)), snellResidual: values.snellResidual === null ? null : Number(values.snellResidual.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.depthM = CHALLENGE.depthM; state.waterIndex = CHALLENGE.waterIndex; state.outsideIndex = CHALLENGE.outsideIndex; state.incidenceDegrees = CHALLENGE.incidenceDegrees; }
  function render() {
    return `<main class="book-shell p115-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive optics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p115-spread"><article class="book-page p115-problem-page"><div class="problem-number">Problem 11.5</div><h1 class="book-title p115-title">Strange fish</h1><div class="difficulty p115-difficulty" aria-label="Three star core with four star extension">★★★ <span>/ ★★★★</span></div>${reconstructionNote()}<p class="problem-copy">A fish is 3.00 m below a flat water surface. Take nwater=4/3 and nair=1. An observer receives a ray whose angle in the water is 30.0° from the vertical normal.</p><p class="problem-copy"><strong>At what apparent depth does that ray place the fish?</strong></p><section class="p115-observation-card"><strong>Angle-dependent depth</strong><p>Normal viewing gives d/n, but an oblique ray refracts by a different angle. Its backward extension meets the axial reference ray at a different apparent depth.</p></section><section class="p115-extension-card"><div class="eyebrow">★★★★ extension</div><p>Increase the internal angle until the transmitted ray reaches grazing incidence, then crosses into total internal reflection.</p></section><section class="p115-model-card"><div class="eyebrow">Geometric model</div><p>Flat interface, homogeneous indices, point fish and angles measured from the normal. Surface waves and Fresnel brightness are ignored.</p></section></article><section class="book-page book-stage p115-stage">${stageControls()}<div class="p115-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p115-coach"><div class="coach-kicker">Trace the oblique ray</div><p class="coach-question">For d=3.00 m, nwater=4/3 and θwater=30.0°, enter the apparent depth.</p><form class="p115-answer-form" data-p115-answer-form novalidate><label for="p115-answer">Apparent depth</label><div><input id="p115-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="depth" autocomplete="off"/><span>m</span></div><button class="primary-button" type="submit">Check depth</button></form>${feedbackMarkup()}<div class="button-row p115-help-row"><button class="secondary-button" type="button" data-problem-action="p115-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p115-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p115-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p115-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p115-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = rayData();
    const outputs = { depth: `${format(state.depthM, 2)} m`, "water-index": format(state.waterIndex, 3), "outside-index": format(state.outsideIndex, 3), angle: `${format(state.incidenceDegrees, 1)}°` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p115-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p115-depth")?.setAttribute("aria-valuetext", `True fish depth ${format(state.depthM, 2)} metres; ${values.apparentDepth === null ? "selected ray totally reflected" : `apparent depth ${format(values.apparentDepth, 3)} metres`}`);
    root.querySelector("#p115-water-index")?.setAttribute("aria-valuetext", `Water-side refractive index ${format(state.waterIndex, 3)}; ${regimeLabel(values)}`);
    root.querySelector("#p115-outside-index")?.setAttribute("aria-valuetext", `Outside refractive index ${format(state.outsideIndex, 3)}; ${values.criticalDegrees === null ? "no total internal reflection critical angle" : `critical angle ${format(values.criticalDegrees, 3)} degrees`}`);
    root.querySelector("#p115-angle")?.setAttribute("aria-valuetext", `Internal incidence angle ${format(state.incidenceDegrees, 1)} degrees from normal; ${regimeLabel(values)}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p115-reset") { state = initialState(); renderAndFocus(renderApp, "#p115-angle"); return; }
      if (action === "p115-stage") { state.stage = clamp(Number(control.dataset.p115Stage), 0, 2); renderAndFocus(renderApp, `[data-p115-stage="${state.stage}"]`); return; }
      if (action === "p115-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p115-stage="${state.stage}"]`); return; }
      if (action === "p115-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p115-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p115-reveal") window.requestAnimationFrame(() => document.querySelector("#p115-solution-heading")?.focus());
    }));
    [["#p115-depth", "depthM", 0.5, 10], ["#p115-water-index", "waterIndex", 1.05, 1.8], ["#p115-outside-index", "outsideIndex", 1, 1.5], ["#p115-angle", "incidenceDegrees", 0, 80]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p115-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p115-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one apparent depth in metres.";
      else if (Math.abs(answer - 2.25) <= 0.03) state.feedback = "That is the normal-incidence value d/n. The challenge ray is oblique, so first calculate its outside angle with Snell’s law.";
      else if (Math.abs(answer - CHALLENGE_APPARENT_DEPTH_M) > 0.02) state.feedback = "Use nwater sinθwater=nair sinθair, then da=d tanθwater/tanθair.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: da=√15/2=${CHALLENGE_APPARENT_DEPTH_M.toFixed(6)} m. The four-star critical angle for the same interface is 48.590378°.`; }
      renderAndFocus(renderApp, "#p115-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
