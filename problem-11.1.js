(function registerMoteInSpherePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "11.1";
  const CHALLENGE = Object.freeze({ refractiveIndex: 1.5, radiusCm: 10, depthRatio: 0.5, observerDistanceRatio: 2 });
  const CHALLENGE_APPARENT_DEPTH_CM = 4;
  const stages = Object.freeze([
    Object.freeze({ short: "Incident", title: "Aim a narrow ray bundle at the eye", copy: "Two symmetric paraxial rays leave the on-axis mote and meet the observer-facing surface close to its vertex." }),
    Object.freeze({ short: "Refract", title: "Bend away from each surface normal", copy: "The rays pass from index n into air. Their small-angle slopes obey the spherical-interface refraction law." }),
    Object.freeze({ short: "Apparent", title: "Back-project the emerging rays", copy: "The eye traces the diverging rays backward to a virtual, upright image inside the sphere." }),
  ]);
  const hints = Object.freeze([
    "Treat only the near spherical surface. Take light from the mote towards the observer, with the surface vertex as origin.",
    "Using Cartesian signs, u=−d, surface radius Rs=−R and image distance v=−a in n₂/v−n₁/u=(n₂−n₁)/Rs.",
    "With air n₂=1, the positive apparent depth satisfies 1/a=n/d−(n−1)/R.",
    "Insert n=1.5, d=5 cm and R=10 cm: 1/a=1.5/5−0.5/10=0.25 cm⁻¹.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p111-reset">Reset</button>';

  const initialState = () => ({ refractiveIndex: CHALLENGE.refractiveIndex, radiusCm: CHALLENGE.radiusCm, depthRatio: CHALLENGE.depthRatio, observerDistanceRatio: CHALLENGE.observerDistanceRatio, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function opticalData(refractiveIndex = state.refractiveIndex, radiusCm = state.radiusCm, depthRatio = state.depthRatio, observerDistanceRatio = state.observerDistanceRatio) {
    const trueDepth = depthRatio * radiusCm;
    const observerDistance = observerDistanceRatio * radiusCm;
    const vergence = refractiveIndex / trueDepth - (refractiveIndex - 1) / radiusCm;
    const apparentDepth = 1 / vergence;
    const transverseMagnification = refractiveIndex * apparentDepth / trueDepth;
    const pupilHalfHeight = 0.04 * radiusCm;
    const surfaceRayHeight = pupilHalfHeight / (1 + vergence * observerDistance);
    const incidentSlope = surfaceRayHeight / trueDepth;
    const normalSlope = surfaceRayHeight / radiusCm;
    const emergentSlope = vergence * surfaceRayHeight;
    const paraxialSnellResidual = refractiveIndex * (incidentSlope - normalSlope) - (emergentSlope - normalSlope);
    const signedObjectDistance = -trueDepth;
    const signedImageDistance = -apparentDepth;
    const signedSurfaceRadius = -radiusCm;
    const surfaceFormulaResidual = 1 / signedImageDistance - refractiveIndex / signedObjectDistance - (1 - refractiveIndex) / signedSurfaceRadius;
    return { trueDepth, observerDistance, vergence, apparentDepth, transverseMagnification, pupilHalfHeight, surfaceRayHeight, incidentSlope, normalSlope, emergentSlope, paraxialSnellResidual, signedObjectDistance, signedImageDistance, signedSurfaceRadius, surfaceFormulaResidual };
  }

  function reconstructionNote() {
    return `<p class="p111-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This paraxial refraction problem is newly written and does not reproduce the book’s wording, numbers, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p111-stage-controls" role="group" aria-label="Spherical refraction stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p111-stage" data-p111-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p111-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p111-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Image located" : "Next stage"}</button></div>`;
  }

  function opticsSvg() {
    const values = opticalData();
    const centre = { x: 160, y: 220 }, spherePixels = 120, scale = spherePixels / state.radiusCm;
    const vertexX = centre.x + spherePixels;
    const moteX = centre.x + scale * (state.radiusCm - values.trueDepth);
    const imageX = centre.x + scale * (state.radiusCm - values.apparentDepth);
    const eyeX = centre.x + scale * (state.radiusCm + values.observerDistance);
    const surfaceOffset = scale * values.surfaceRayHeight;
    const pupilOffset = scale * values.pupilHalfHeight;
    const upperSurfaceY = centre.y - surfaceOffset, lowerSurfaceY = centre.y + surfaceOffset;
    const upperPupilY = centre.y - pupilOffset, lowerPupilY = centre.y + pupilOffset;
    const statusValue = state.stage === 0 ? `θ₁≈${format(values.incidentSlope * 180 / Math.PI, 4)}°` : state.stage === 1 ? `θ₂≈${format(values.emergentSlope * 180 / Math.PI, 4)}°` : `a=${format(values.apparentDepth, 3)} cm`;
    return `<svg class="p111-svg p111-stage-${state.stage}" viewBox="0 0 720 445" role="img" aria-labelledby="p111-svg-title p111-svg-desc">
      <title id="p111-svg-title">Paraxial rays from a mote inside a transparent sphere</title>
      <desc id="p111-svg-desc">A mote is ${format(values.trueDepth, 3)} centimetres behind the observer-facing surface of a transparent sphere of radius ${format(state.radiusCm, 3)} centimetres and refractive index ${format(state.refractiveIndex, 3)}. Two symmetric paraxial rays refract into air and enter an eye ${format(values.observerDistance, 3)} centimetres beyond the surface. Their back projections locate a virtual image ${format(values.apparentDepth, 3)} centimetres behind the surface with transverse magnification ${format(values.transverseMagnification, 4)}.</desc>
      <defs><radialGradient id="p111-glass-gradient" cx="38%" cy="34%"><stop offset="0" stop-color="#eaf7f4" stop-opacity=".78"/><stop offset=".7" stop-color="#8bc8d0" stop-opacity=".42"/><stop offset="1" stop-color="#397d91" stop-opacity=".28"/></radialGradient><marker id="p111-ray-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p111-board" x="1" y="1" width="718" height="443" rx="20"/>
      <line class="p111-axis" x1="22" y1="${centre.y}" x2="688" y2="${centre.y}"/>
      <circle class="p111-sphere" cx="${centre.x}" cy="${centre.y}" r="${spherePixels}"/>
      <line class="p111-surface-vertex" x1="${vertexX}" y1="91" x2="${vertexX}" y2="349"/><text class="p111-vertex-label" x="${vertexX}" y="77" text-anchor="middle">near surface</text>
      <g class="p111-object-layer"><circle class="p111-mote" cx="${format(moteX, 2)}" cy="${centre.y}" r="6"/><path class="p111-mote-spark" d="M${format(moteX - 11, 2)} ${centre.y}H${format(moteX + 11, 2)}M${format(moteX, 2)} ${centre.y - 11}V${centre.y + 11}"/><text class="p111-mote-label" x="${format(moteX, 2)}" y="${centre.y - 18}" text-anchor="middle">mote · d=${format(values.trueDepth, 2)} cm</text><g class="p111-eye" transform="translate(${format(eyeX, 2)} ${centre.y})"><path d="M-23 0Q0-20 23 0Q0 20-23 0Z"/><circle r="7"/><line x1="-4" y1="${format(-pupilOffset, 2)}" x2="-4" y2="${format(pupilOffset, 2)}"/><text y="34" text-anchor="middle">observer · L=${format(values.observerDistance, 1)} cm</text></g></g>
      <g class="p111-incident-layer"><line x1="${format(moteX, 2)}" y1="${centre.y}" x2="${vertexX}" y2="${format(upperSurfaceY, 2)}" marker-end="url(#p111-ray-arrow)"/><line x1="${format(moteX, 2)}" y1="${centre.y}" x2="${vertexX}" y2="${format(lowerSurfaceY, 2)}" marker-end="url(#p111-ray-arrow)"/><circle cx="${vertexX}" cy="${format(upperSurfaceY, 2)}" r="3"/><circle cx="${vertexX}" cy="${format(lowerSurfaceY, 2)}" r="3"/></g>
      <g class="p111-normal-layer"><line x1="${centre.x}" y1="${centre.y}" x2="${vertexX}" y2="${format(upperSurfaceY, 2)}"/><line x1="${centre.x}" y1="${centre.y}" x2="${vertexX}" y2="${format(lowerSurfaceY, 2)}"/><text x="${centre.x + 68}" y="${centre.y - 15}">surface normals</text></g>
      <g class="p111-outgoing-layer"><line x1="${vertexX}" y1="${format(upperSurfaceY, 2)}" x2="${format(eyeX, 2)}" y2="${format(upperPupilY, 2)}" marker-end="url(#p111-ray-arrow)"/><line x1="${vertexX}" y1="${format(lowerSurfaceY, 2)}" x2="${format(eyeX, 2)}" y2="${format(lowerPupilY, 2)}" marker-end="url(#p111-ray-arrow)"/><text x="${format((vertexX + eyeX) / 2, 2)}" y="${format(centre.y - pupilOffset - 13, 2)}" text-anchor="middle">emerging rays in air</text></g>
      <g class="p111-image-layer"><line x1="${format(imageX, 2)}" y1="${centre.y}" x2="${vertexX}" y2="${format(upperSurfaceY, 2)}"/><line x1="${format(imageX, 2)}" y1="${centre.y}" x2="${vertexX}" y2="${format(lowerSurfaceY, 2)}"/><circle class="p111-image-point" cx="${format(imageX, 2)}" cy="${centre.y}" r="9"/><text class="p111-image-label" x="${format(imageX, 2)}" y="${centre.y + 26}" text-anchor="middle">virtual image</text><line class="p111-apparent-bracket" x1="${format(imageX, 2)}" y1="371" x2="${vertexX}" y2="371"/><text class="p111-bracket-label" x="${format((imageX + vertexX) / 2, 2)}" y="364" text-anchor="middle">apparent depth a=${format(values.apparentDepth, 2)} cm</text></g>
      <line class="p111-true-bracket" x1="${format(moteX, 2)}" y1="399" x2="${vertexX}" y2="399"/><text class="p111-bracket-label" x="${format((moteX + vertexX) / 2, 2)}" y="420" text-anchor="middle">true depth d=${format(values.trueDepth, 2)} cm</text>
      <g class="p111-status" transform="translate(365 22)"><rect width="326" height="67" rx="13"/><text class="p111-status-kicker" x="15" y="21">${state.stage === 0 ? "INCIDENT PARAXIAL BUNDLE" : state.stage === 1 ? "REFRACTION INTO AIR" : "BACK-PROJECTED IMAGE"}</text><text class="p111-status-value" x="15" y="45">${statusValue}</text><text class="p111-status-note" x="15" y="60">${state.stage < 2 ? `n=${format(state.refractiveIndex, 3)} · narrow rays near vertex` : `virtual · upright · m=${format(values.transverseMagnification, 4)}`}</text></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = opticalData();
    return `<section class="p111-metrics" aria-live="polite"><div><span>True surface depth</span><strong>${format(values.trueDepth, 3)} cm</strong></div><div><span>Apparent depth</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.apparentDepth, 3)} cm` : "stage 3"}</strong></div><div><span>Transverse magnification</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.transverseMagnification, 4)}× upright` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p111-dynamic">${opticsSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = opticalData();
    return `<section class="p111-controls" aria-label="Transparent sphere controls"><div class="p111-control-grid"><label for="p111-index"><span>Sphere refractive index n<output data-p111-output="index">${format(state.refractiveIndex, 3)}</output></span><input id="p111-index" type="range" min="1.05" max="1.75" step="0.01" value="${state.refractiveIndex}"/></label><label for="p111-radius"><span>Sphere radius R<output data-p111-output="radius">${format(state.radiusCm, 1)} cm</output></span><input id="p111-radius" type="range" min="5" max="30" step="0.5" value="${state.radiusCm}"/></label><label for="p111-depth"><span>Mote depth behind near surface d<output data-p111-output="depth">${format(values.trueDepth, 2)} cm · ${format(state.depthRatio, 2)}R</output></span><input id="p111-depth" type="range" min="0.1" max="1.4" step="0.01" value="${state.depthRatio}"/></label><label for="p111-observer"><span>Observer distance beyond surface L<output data-p111-output="observer">${format(values.observerDistance, 1)} cm · ${format(state.observerDistanceRatio, 2)}R</output></span><input id="p111-observer" type="range" min="0.5" max="3" step="0.05" value="${state.observerDistanceRatio}"/></label></div><p>Observer distance changes which narrow rays enter the pupil, but not the paraxial image position. Air is fixed at index 1.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p111-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p111-solution" aria-labelledby="p111-solution-heading"><h3 id="p111-solution-heading" tabindex="-1">Use the near surface’s signed curvature</h3><p>Light travels from the sphere into air. With the surface vertex as origin, u=−d, v=−a and the right surface has signed radius Rs=−R. The paraxial refraction equation is</p><div class="p111-equation">n₂/v−n₁/u=(n₂−n₁)/Rs</div><p>For n₂=1 this becomes</p><div class="p111-equation">1/a=n/d−(n−1)/R</div><p>For n=1.5, d=5 cm and R=10 cm,</p><div class="p111-equation p111-answer-equation">1/a=1.5/5−0.5/10=0.25 cm⁻¹<br>a=4.00 cm behind the near surface</div><p>The signed image distance is v=−4 cm, so the image is virtual. Its paraxial transverse magnification is m=n₁v/(n₂u)=1.2, positive and therefore upright.</p><p class="p111-checks"><strong>Checks and boundary.</strong> If n→1, a→d and m→1. Very near the surface, curvature becomes negligible and a→d/n, the plane-interface result. A mote at the sphere’s centre has d=R and a=R because its axial rays meet the surface normally. Distances are centimetres and every term in 1/a has units cm⁻¹. The model uses only narrow on-axis rays, one spherical interface and homogeneous glass; it omits spherical aberration, finite mote size, diffraction, reflections and wide-angle total internal reflection.</p></section>`;
  }

  function snapshot() {
    const values = opticalData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", outsideRefractiveIndex: 1, sphereRefractiveIndex: state.refractiveIndex, sphereRadiusCentimetres: state.radiusCm, moteDepthCentimetres: Number(values.trueDepth.toFixed(9)), moteDepthRatio: state.depthRatio, observerDistanceCentimetres: Number(values.observerDistance.toFixed(9)), observerDistanceRatio: state.observerDistanceRatio, apparentDepthCentimetres: Number(values.apparentDepth.toFixed(9)), signedImageDistanceCentimetres: Number(values.signedImageDistance.toFixed(9)), transverseMagnification: Number(values.transverseMagnification.toFixed(9)), incidentParaxialSlopeRadians: Number(values.incidentSlope.toFixed(12)), emergentParaxialSlopeRadians: Number(values.emergentSlope.toFixed(12)), paraxialSnellResidual: Number(values.paraxialSnellResidual.toExponential(6)), sphericalSurfaceFormulaResidualPerCentimetre: Number(values.surfaceFormulaResidual.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.refractiveIndex = CHALLENGE.refractiveIndex; state.radiusCm = CHALLENGE.radiusCm; state.depthRatio = CHALLENGE.depthRatio; state.observerDistanceRatio = CHALLENGE.observerDistanceRatio; }
  function render() {
    return `<main class="book-shell p111-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive optics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p111-spread"><article class="book-page p111-problem-page"><div class="problem-number">Problem 11.1</div><h1 class="book-title p111-title">Mote in a sphere</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A transparent sphere has radius 10 cm and refractive index 1.50. A tiny mote lies on the observer-facing diameter, 5.00 cm behind the nearest surface. The observer looks along that diameter from air.</p><p class="problem-copy"><strong>In the paraxial approximation, how far behind the near surface does the mote appear?</strong></p><section class="p111-observation-card"><strong>One curved interface</strong><p>The eye receives a narrow bundle through the observer-facing surface. Back-projecting those emerging rays locates a virtual image inside the sphere.</p></section><section class="p111-model-card"><div class="eyebrow">Paraxial boundary</div><p>On-axis point mote, homogeneous sphere, air outside and small ray angles near the surface vertex. Wide-angle visibility and total internal reflection are outside this model.</p></section></article><section class="book-page book-stage p111-stage">${stageControls()}<div class="p111-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p111-coach"><div class="coach-kicker">Back-project the rays</div><p class="coach-question">For n=1.50, R=10 cm and true depth d=5.00 cm, enter the apparent depth.</p><form class="p111-answer-form" data-p111-answer-form novalidate><label for="p111-answer">Apparent depth behind surface</label><div><input id="p111-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="depth" autocomplete="off"/><span>cm</span></div><button class="primary-button" type="submit">Check depth</button></form>${feedbackMarkup()}<div class="button-row p111-help-row"><button class="secondary-button" type="button" data-problem-action="p111-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p111-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p111-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p111-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p111-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = opticalData();
    const outputs = { index: format(state.refractiveIndex, 3), radius: `${format(state.radiusCm, 1)} cm`, depth: `${format(values.trueDepth, 2)} cm · ${format(state.depthRatio, 2)}R`, observer: `${format(values.observerDistance, 1)} cm · ${format(state.observerDistanceRatio, 2)}R` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p111-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p111-index")?.setAttribute("aria-valuetext", `Sphere refractive index ${format(state.refractiveIndex, 3)}; apparent depth ${format(values.apparentDepth, 3)} centimetres`);
    root.querySelector("#p111-radius")?.setAttribute("aria-valuetext", `Sphere radius ${format(state.radiusCm, 1)} centimetres; apparent depth ${format(values.apparentDepth, 3)} centimetres`);
    root.querySelector("#p111-depth")?.setAttribute("aria-valuetext", `Mote depth ${format(values.trueDepth, 2)} centimetres, ${format(state.depthRatio, 2)} sphere radii; apparent depth ${format(values.apparentDepth, 3)} centimetres`);
    root.querySelector("#p111-observer")?.setAttribute("aria-valuetext", `Observer ${format(values.observerDistance, 1)} centimetres beyond near surface; paraxial image position unchanged`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p111-reset") { state = initialState(); renderAndFocus(renderApp, "#p111-depth"); return; }
      if (action === "p111-stage") { state.stage = clamp(Number(control.dataset.p111Stage), 0, 2); renderAndFocus(renderApp, `[data-p111-stage="${state.stage}"]`); return; }
      if (action === "p111-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p111-stage="${state.stage}"]`); return; }
      if (action === "p111-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p111-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p111-reveal") window.requestAnimationFrame(() => document.querySelector("#p111-solution-heading")?.focus());
    }));
    [["#p111-index", "refractiveIndex", 1.05, 1.75], ["#p111-radius", "radiusCm", 5, 30], ["#p111-depth", "depthRatio", 0.1, 1.4], ["#p111-observer", "observerDistanceRatio", 0.5, 3]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p111-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p111-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one apparent depth in centimetres.";
      else if (Math.abs(answer - 10 / 3) <= 0.03) state.feedback = "That is the plane-interface result d/n. The sphere’s curved near surface adds optical power, so include its radius term.";
      else if (Math.abs(answer - CHALLENGE_APPARENT_DEPTH_CM) > 0.02) state.feedback = "Use 1/a=n/d−(n−1)/R with all three distances measured in centimetres.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: the two emerging paraxial rays back-project to a virtual image 4.00 cm behind the near surface."; }
      renderAndFocus(renderApp, "#p111-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
