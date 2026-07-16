(function registerDiminishingRingsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "11.2";
  const DISPLAY_ORDER = 30;
  const MAX_CENTRAL_VISIBILITY = 0.95;
  const CHALLENGE = Object.freeze({ wavelengthNm: 500, curvatureM: 1, order: 8, coherenceMicrometres: 6 });
  const CHALLENGE_RADIUS_MM = 2;
  const stages = Object.freeze([
    Object.freeze({ short: "Film", title: "Read the spherical air-film thickness", copy: "Near contact, the spherical surface has sag t≈r²/(2R). Equal-thickness circles become concentric fringes." }),
    Object.freeze({ short: "Phase", title: "Include the reflected phase reversal", copy: "One reflected ray gains a π phase shift. Reflected dark rings therefore occur when the geometric path difference 2t equals mλ." }),
    Object.freeze({ short: "Radius", title: "Join phase to geometry", copy: "Combining 2t=mλ with t≈r²/(2R) gives rₘ²=mλR. Successive radii grow as √m, so their spacing shrinks." }),
  ]);
  const hints = Object.freeze([
    "For a sphere of curvature radius R touching a plate, R²=(R−t)²+r². Neglect t² to obtain t≈r²/(2R).",
    "In reflection, the air-to-glass reflection at the plate adds a π phase reversal. A dark ring then has geometric path difference 2t=mλ.",
    "Combine r²/(R)=mλ, giving rₘ=√(mλR). The central dark spot is order m=0.",
    "Convert 500 nm to 5.00×10⁻⁷ m, then use m=8 and R=1.00 m.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p112-reset">Reset</button>';

  const initialState = () => ({ wavelengthNm: CHALLENGE.wavelengthNm, curvatureM: CHALLENGE.curvatureM, order: CHALLENGE.order, coherenceMicrometres: CHALLENGE.coherenceMicrometres, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function visibilityForPathDifference(pathDifferenceMetres, coherenceMicrometres = state.coherenceMicrometres) {
    const coherenceLength = coherenceMicrometres * 1e-6;
    return MAX_CENTRAL_VISIBILITY * Math.exp(-((pathDifferenceMetres / coherenceLength) ** 2));
  }

  function ringData(wavelengthNm = state.wavelengthNm, curvatureM = state.curvatureM, order = state.order, coherenceMicrometres = state.coherenceMicrometres) {
    const wavelength = wavelengthNm * 1e-9;
    const radius = Math.sqrt(order * wavelength * curvatureM);
    const filmThickness = order * wavelength / 2;
    const pathDifference = 2 * filmThickness;
    const visibility = visibilityForPathDifference(pathDifference, coherenceMicrometres);
    const normalizedDarkIntensity = 0.5 * (1 - visibility);
    const nextRadius = Math.sqrt((order + 1) * wavelength * curvatureM);
    const previousRadius = order > 0 ? Math.sqrt((order - 1) * wavelength * curvatureM) : 0;
    const outwardSpacing = nextRadius - radius;
    const inwardSpacing = radius - previousRadius;
    const exactSag = curvatureM - Math.sqrt(Math.max(0, curvatureM ** 2 - radius ** 2));
    const sagRelativeError = filmThickness === 0 ? 0 : (exactSag - filmThickness) / exactSag;
    return { wavelength, radius, filmThickness, pathDifference, visibility, normalizedDarkIntensity, nextRadius, previousRadius, outwardSpacing, inwardSpacing, exactSag, sagRelativeError };
  }

  function reconstructionNote() {
    return `<p class="p112-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and three-star difficulty. This Newton’s-rings investigation is newly written and does not reproduce the book’s wording, numbers, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p112-stage-controls" role="group" aria-label="Newton rings derivation stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p112-stage" data-p112-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p112-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p112-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Radius law derived" : "Next stage"}</button></div>`;
  }

  function ringsMarkup() {
    const wavelength = state.wavelengthNm * 1e-9;
    const coherence = state.coherenceMicrometres;
    const bright = [];
    const dark = [];
    for (let order = 1; order <= DISPLAY_ORDER; order += 1) {
      const brightOrder = order - 0.5;
      const brightRadius = 150 * Math.sqrt(brightOrder / DISPLAY_ORDER);
      const brightVisibility = visibilityForPathDifference(brightOrder * wavelength, coherence);
      bright.push(`<circle class="p112-bright-ring" cx="185" cy="235" r="${format(brightRadius, 2)}" style="opacity:${brightVisibility.toFixed(4)}"/>`);
      const darkRadius = 150 * Math.sqrt(order / DISPLAY_ORDER);
      const darkVisibility = visibilityForPathDifference(order * wavelength, coherence);
      dark.push(`<circle class="p112-dark-ring" cx="185" cy="235" r="${format(darkRadius, 2)}" style="opacity:${darkVisibility.toFixed(4)}"/>`);
    }
    return `${bright.join("")}${dark.join("")}<circle class="p112-central-dark" cx="185" cy="235" r="5" style="opacity:${MAX_CENTRAL_VISIBILITY}"/>`;
  }

  function ringsSvg() {
    const values = ringData();
    const selectedScreenRadius = 150 * Math.sqrt(state.order / DISPLAY_ORDER);
    const contactX = 410, plateY = 330;
    const selectedX = contactX + 280 * Math.sqrt(state.order / DISPLAY_ORDER);
    const exaggeratedGap = 90 * state.order / DISPLAY_ORDER;
    const lensY = plateY - exaggeratedGap;
    const statusValue = state.stage === 0 ? `t≈r²/(2R)` : state.stage === 1 ? `2t=mλ=${format(values.pathDifference * 1e6, 3)} μm` : `r${state.order}=√(mλR)=${format(values.radius * 1000, 3)} mm`;
    return `<svg class="p112-svg p112-stage-${state.stage}" viewBox="0 0 720 450" role="img" aria-labelledby="p112-svg-title p112-svg-desc">
      <title id="p112-svg-title">Newton’s rings and the thin-film path difference</title>
      <desc id="p112-svg-desc">A spherical surface of curvature radius ${format(state.curvatureM, 3)} metres touches a glass plate, creating a thin air film illuminated at ${format(state.wavelengthNm, 0)} nanometres. Reflected dark ring order ${state.order} has radius ${format(values.radius * 1000, 5)} millimetres, film thickness ${format(values.filmThickness * 1e6, 5)} micrometres and path difference ${format(values.pathDifference * 1e6, 5)} micrometres. A Gaussian coherence envelope of ${format(state.coherenceMicrometres, 2)} micrometres gives fringe visibility ${format(100 * values.visibility, 2)} percent.</desc>
      <defs><radialGradient id="p112-field-gradient" cx="45%" cy="40%"><stop offset="0" stop-color="#d6d5c8"/><stop offset="1" stop-color="#6f7780"/></radialGradient><linearGradient id="p112-lens-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f6f3" stop-opacity=".9"/><stop offset="1" stop-color="#76b6c4" stop-opacity=".45"/></linearGradient><marker id="p112-ray-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p112-board" x="1" y="1" width="718" height="448" rx="20"/>
      <g class="p112-ring-field"><circle class="p112-field" cx="185" cy="235" r="158"/>${ringsMarkup()}<circle class="p112-selected-ring" cx="185" cy="235" r="${format(selectedScreenRadius, 2)}"/><line class="p112-selected-leader" x1="${format(185 + selectedScreenRadius * .707, 2)}" y1="${format(235 - selectedScreenRadius * .707, 2)}" x2="322" y2="102"/><text class="p112-selected-label" x="326" y="98">dark order m=${state.order}</text><text class="p112-field-scale" x="185" y="418" text-anchor="middle">outer circle: m=${DISPLAY_ORDER} · ${format(Math.sqrt(DISPLAY_ORDER * values.wavelength * state.curvatureM) * 1000, 2)} mm</text><g class="p112-ring-key" transform="translate(46 52)"><line class="is-bright" x1="0" y1="0" x2="24" y2="0"/><text x="31" y="4">bright</text><line class="is-dark" x1="76" y1="0" x2="100" y2="0"/><text x="107" y="4">dark</text></g></g>
      <g class="p112-status" transform="translate(377 20)"><rect width="323" height="68" rx="13"/><text class="p112-status-kicker" x="15" y="21">${state.stage === 0 ? "THIN SPHERICAL AIR FILM" : state.stage === 1 ? "REFLECTED-RAY PHASE" : "SELECTED DARK RING"}</text><text class="p112-status-value" x="15" y="45">${statusValue}</text><text class="p112-status-note" x="15" y="60">visibility ${format(100 * values.visibility, 1)}% · dark intensity ${format(100 * values.normalizedDarkIntensity, 1)}%</text></g>
      <g class="p112-film-panel"><text class="p112-panel-title" x="404" y="119">EXAGGERATED CROSS-SECTION AT SELECTED RADIUS</text><rect class="p112-plate" x="390" y="${plateY}" width="310" height="28" rx="4"/><path class="p112-lens" d="M390 149H700V240Q550 330 410 330Q397 330 390 329Z"/><path class="p112-lens-surface" d="M410 330Q550 330 690 240"/><line class="p112-contact-mark" x1="410" y1="316" x2="410" y2="344"/><text class="p112-contact-label" x="410" y="372" text-anchor="middle">contact · m=0</text><line class="p112-radius-position" x1="410" y1="389" x2="${format(selectedX, 2)}" y2="389"/><text class="p112-radius-position-label" x="${format((410 + selectedX) / 2, 2)}" y="407" text-anchor="middle">rₘ=${format(values.radius * 1000, 3)} mm</text><line class="p112-gap" x1="${format(selectedX, 2)}" y1="${format(lensY, 2)}" x2="${format(selectedX, 2)}" y2="${plateY}"/><text class="p112-gap-label" x="${format(selectedX + 9, 2)}" y="${format((lensY + plateY) / 2, 2)}">t=${format(values.filmThickness * 1e6, 3)} μm</text></g>
      <g class="p112-ray-layer"><path class="p112-ray-one" d="M${format(selectedX - 16, 2)} 101L${format(selectedX, 2)} ${format(lensY, 2)}L${format(selectedX + 19, 2)} 113" marker-end="url(#p112-ray-arrow)"/><path class="p112-ray-two" d="M${format(selectedX + 4, 2)} 101L${format(selectedX + 4, 2)} ${format(lensY, 2)}L${format(selectedX + 4, 2)} ${plateY}L${format(selectedX + 26, 2)} 111" marker-end="url(#p112-ray-arrow)"/><circle class="p112-phase-flip" cx="${format(selectedX + 4, 2)}" cy="${plateY}" r="7"/><text class="p112-phase-label" x="${format(selectedX + 16, 2)}" y="${plateY - 7}">π phase flip</text><text class="p112-path-label" x="${format(selectedX - 2, 2)}" y="${format(lensY - 12, 2)}" text-anchor="middle">extra geometric path 2t</text></g>
      <g class="p112-law-layer" transform="translate(390 414)"><rect width="310" height="27" rx="8"/><text x="155" y="18" text-anchor="middle">2t=mλ + t≈r²/(2R) ⇒ rₘ²=mλR</text></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = ringData();
    return `<section class="p112-metrics" aria-live="polite"><div><span>Selected fringe visibility</span><strong>${format(100 * values.visibility, 2)}%</strong></div><div><span>Film thickness</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.filmThickness * 1e6, 4)} μm` : "stage 2"}</strong></div><div><span>Dark-ring radius</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.radius * 1000, 4)} mm` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p112-dynamic">${ringsSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p112-controls" aria-label="Newton rings controls"><div class="p112-control-grid"><label for="p112-wavelength"><span>Vacuum wavelength λ<output data-p112-output="wavelength">${format(state.wavelengthNm, 0)} nm</output></span><input id="p112-wavelength" type="range" min="400" max="700" step="5" value="${state.wavelengthNm}"/></label><label for="p112-curvature"><span>Lens curvature radius R<output data-p112-output="curvature">${format(state.curvatureM, 2)} m</output></span><input id="p112-curvature" type="range" min="0.25" max="2" step="0.05" value="${state.curvatureM}"/></label><label for="p112-order"><span>Reflected dark-ring order m<output data-p112-output="order">${format(state.order, 0)}</output></span><input id="p112-order" type="range" min="0" max="20" step="1" value="${state.order}"/></label><label for="p112-coherence"><span>Gaussian coherence length Lc<output data-p112-output="coherence">${format(state.coherenceMicrometres, 1)} μm</output></span><input id="p112-coherence" type="range" min="2" max="30" step="0.5" value="${state.coherenceMicrometres}"/></label></div><p>The radius law is ideal. Ring fading uses V=0.95 exp[−(2t/Lc)²], representing finite coherence and slightly unequal reflected amplitudes.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p112-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p112-solution" aria-labelledby="p112-solution-heading"><h3 id="p112-solution-heading" tabindex="-1">Combine film sag with reflected phase</h3><p>At radius r, the air gap under a gently curved spherical surface obeys</p><div class="p112-equation">R²=(R−t)²+r² &nbsp;⇒&nbsp; t≈r²/(2R)</div><p>Of the two reflected rays, the reflection at the air-to-glass plate gains a π phase reversal. Reflected darkness therefore occurs at 2t=mλ, including the central m=0 spot. Hence</p><div class="p112-equation">rₘ²=mλR</div><p>For m=8, λ=500 nm=5.00×10⁻⁷ m and R=1.00 m,</p><div class="p112-equation p112-answer-equation">r₈=√(8×5.00×10⁻⁷×1.00) m<br>r₈=2.00×10⁻³ m=2.00 mm</div><p>The selected film thickness is mλ/2=2.00 μm and the geometric path difference is 4.00 μm. The coherence envelope changes contrast, not the phase-minimum radius.</p><p class="p112-checks"><strong>Checks and boundary.</strong> r₀=0 at contact. Doubling λ or R multiplies every radius by √2. Since rₘ∝√m, rₘ₊₁−rₘ decreases outward. The product λR has units m², so its square root is a radius. This model assumes normal incidence, a thin air film, scalar monochromatic paraxial optics and nearly equal reflected amplitudes. The Gaussian visibility envelope is an explicit illustrative coherence model; real fading also depends on illumination, aperture, surface quality and detector response.</p></section>`;
  }

  function snapshot() {
    const values = ringData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", wavelengthNanometres: state.wavelengthNm, curvatureRadiusMetres: state.curvatureM, reflectedDarkRingOrder: state.order, coherenceLengthMicrometres: state.coherenceMicrometres, darkRingRadiusMillimetres: Number((values.radius * 1000).toFixed(9)), filmThicknessMicrometres: Number((values.filmThickness * 1e6).toFixed(9)), geometricPathDifferenceMicrometres: Number((values.pathDifference * 1e6).toFixed(9)), fringeVisibility: Number(values.visibility.toFixed(9)), normalizedDarkIntensity: Number(values.normalizedDarkIntensity.toFixed(9)), inwardSpacingMillimetres: Number((values.inwardSpacing * 1000).toFixed(9)), outwardSpacingMillimetres: Number((values.outwardSpacing * 1000).toFixed(9)), exactSagMicrometres: Number((values.exactSag * 1e6).toFixed(9)), thinFilmSagRelativeError: Number(values.sagRelativeError.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.wavelengthNm = CHALLENGE.wavelengthNm; state.curvatureM = CHALLENGE.curvatureM; state.order = CHALLENGE.order; state.coherenceMicrometres = CHALLENGE.coherenceMicrometres; }
  function render() {
    return `<main class="book-shell p112-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive optics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p112-spread"><article class="book-page p112-problem-page"><div class="problem-number">Problem 11.2</div><h1 class="book-title p112-title">Diminishing rings of light</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${reconstructionNote()}<p class="problem-copy">A gently curved glass surface of radius 1.00 m rests on a flat glass plate, leaving a thin air film. Monochromatic light of wavelength 500 nm falls normally and the reflected pattern is observed.</p><p class="problem-copy">Taking the dark centre as order m=0, <strong>find the radius of the reflected dark ring with m=8.</strong></p><section class="p112-observation-card"><strong>Why the rings crowd together</strong><p>Film thickness grows as r², so equal increments of optical path require progressively smaller increments of radius.</p></section><section class="p112-model-card"><div class="eyebrow">Ideal pattern and fading</div><p>The phase law gives ring positions. A separate finite-coherence envelope reduces contrast outward without moving those ideal radii.</p></section></article><section class="book-page book-stage p112-stage">${stageControls()}<div class="p112-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p112-coach"><div class="coach-kicker">Count from the dark centre</div><p class="coach-question">For m=8, λ=500 nm and R=1.00 m, enter the dark-ring radius.</p><form class="p112-answer-form" data-p112-answer-form novalidate><label for="p112-answer">Dark-ring radius</label><div><input id="p112-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="radius" autocomplete="off"/><span>mm</span></div><button class="primary-button" type="submit">Check radius</button></form>${feedbackMarkup()}<div class="button-row p112-help-row"><button class="secondary-button" type="button" data-problem-action="p112-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p112-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p112-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p112-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p112-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = ringData();
    const outputs = { wavelength: `${format(state.wavelengthNm, 0)} nm`, curvature: `${format(state.curvatureM, 2)} m`, order: format(state.order, 0), coherence: `${format(state.coherenceMicrometres, 1)} μm` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p112-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p112-wavelength")?.setAttribute("aria-valuetext", `Wavelength ${format(state.wavelengthNm, 0)} nanometres; selected radius ${format(values.radius * 1000, 4)} millimetres`);
    root.querySelector("#p112-curvature")?.setAttribute("aria-valuetext", `Curvature radius ${format(state.curvatureM, 2)} metres; selected ring radius ${format(values.radius * 1000, 4)} millimetres`);
    root.querySelector("#p112-order")?.setAttribute("aria-valuetext", `Reflected dark ring order ${format(state.order, 0)}, central dark spot order zero; radius ${format(values.radius * 1000, 4)} millimetres`);
    root.querySelector("#p112-coherence")?.setAttribute("aria-valuetext", `Gaussian coherence length ${format(state.coherenceMicrometres, 1)} micrometres; selected fringe visibility ${format(100 * values.visibility, 2)} percent`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p112-reset") { state = initialState(); renderAndFocus(renderApp, "#p112-order"); return; }
      if (action === "p112-stage") { state.stage = clamp(Number(control.dataset.p112Stage), 0, 2); renderAndFocus(renderApp, `[data-p112-stage="${state.stage}"]`); return; }
      if (action === "p112-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p112-stage="${state.stage}"]`); return; }
      if (action === "p112-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p112-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p112-reveal") window.requestAnimationFrame(() => document.querySelector("#p112-solution-heading")?.focus());
    }));
    [["#p112-wavelength", "wavelengthNm", 400, 700], ["#p112-curvature", "curvatureM", 0.25, 2], ["#p112-order", "order", 0, 20], ["#p112-coherence", "coherenceMicrometres", 2, 30]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p112-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p112-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one dark-ring radius in millimetres.";
      else if (Math.abs(answer - 4) <= 0.03) state.feedback = "That is the diameter of the m=8 dark ring. The question asks for its radius.";
      else if (Math.abs(answer - CHALLENGE_RADIUS_MM) > 0.02) state.feedback = "Use rₘ²=mλR, convert nanometres to metres, then convert the final radius to millimetres.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: r₈=2.00 mm. The selected air gap is 2.00 μm thick and the reflected geometric path difference is 4.00 μm."; }
      renderAndFocus(renderApp, "#p112-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
