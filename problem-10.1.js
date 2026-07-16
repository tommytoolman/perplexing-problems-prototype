(function registerHollowMoonPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.1";
  const G = 6.6743e-11;
  const LUNAR_MASS_KG = 7.342e22;
  const CAVITY_RATIO = 0.5;
  const ASTRONAUT_MASS_KG = 70;
  const CHALLENGE = Object.freeze({ massMultiplier: 1, radiusKm: 1740, positionRatio: 0.25 });
  const stages = Object.freeze([
    Object.freeze({ short: "Shells", title: "Classify the surrounding shells", copy: "A thin spherical shell acts like a point mass outside it, but contributes exactly zero field at every point inside it." }),
    Object.freeze({ short: "Enclosed", title: "Count only the enclosed material", copy: "At radius r, outer shells cancel. Inside the moon’s material, the enclosed mass begins at the cavity wall rather than at the centre." }),
    Object.freeze({ short: "Field", title: "Apply the active field law", copy: "The field is continuous at both boundaries: zero at the cavity wall and GM/R² at the outer surface." }),
  ]);
  const hints = Object.freeze([
    "Imagine dividing the moon’s material into many thin concentric spherical shells.",
    "The shell theorem says a uniform shell produces zero gravitational field everywhere inside that shell.",
    "The astronaut is at r=R/4, while every material shell has radius s≥R/2. The astronaut is inside every one of them.",
    "Every shell contributes zero, so their sum is also exactly zero.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p101-reset">Reset</button>';

  const initialState = () => ({ massMultiplier: CHALLENGE.massMultiplier, radiusKm: CHALLENGE.radiusKm, positionRatio: CHALLENGE.positionRatio, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 2) { if (Math.abs(value) < 0.5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function fieldData(massMultiplier = state.massMultiplier, radiusKm = state.radiusKm, positionRatio = state.positionRatio) {
    const mass = massMultiplier * LUNAR_MASS_KG;
    const outerRadius = radiusKm * 1000;
    const cavityRadius = CAVITY_RATIO * outerRadius;
    const position = positionRatio * outerRadius;
    const radius = Math.abs(position);
    const materialVolume = 4 * Math.PI * (outerRadius ** 3 - cavityRadius ** 3) / 3;
    const density = mass / materialVolume;
    let region;
    let enclosedMass;
    let fieldMagnitude;
    if (radius >= outerRadius) {
      region = "outside";
      enclosedMass = mass;
      fieldMagnitude = G * mass / radius ** 2;
    } else if (radius >= cavityRadius) {
      region = "material";
      enclosedMass = mass * (radius ** 3 - cavityRadius ** 3) / (outerRadius ** 3 - cavityRadius ** 3);
      fieldMagnitude = G * enclosedMass / radius ** 2;
    } else {
      region = "cavity";
      enclosedMass = 0;
      fieldMagnitude = 0;
    }
    const surfaceField = G * mass / outerRadius ** 2;
    const direction = position > 0 && fieldMagnitude > 0 ? -1 : position < 0 && fieldMagnitude > 0 ? 1 : 0;
    return { mass, outerRadius, cavityRadius, position, radius, materialVolume, density, region, enclosedMass, enclosedFraction: enclosedMass / mass, fieldMagnitude, fieldAlongTunnel: direction * fieldMagnitude, surfaceField, direction, astronautWeight: ASTRONAUT_MASS_KG * fieldMagnitude };
  }

  function regionLabel(region) {
    if (region === "outside") return "Outside the moon";
    if (region === "material") return "Within the shell material";
    return "Inside the empty cavity";
  }

  function activeFormula(region) {
    if (region === "outside") return "g = GM/r²";
    if (region === "material") return "g = GM(r³−a³) / [(R³−a³)r²]";
    return "g = 0";
  }

  function reconstructionNote() {
    return `<p class="p101-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This shell-theorem investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p101-stage-controls" role="group" aria-label="Hollow moon field stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p101-stage" data-p101-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p101-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p101-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Field resolved" : "Next stage"}</button></div>`;
  }

  function shellCircles(values, centreX, centreY, cavityPixels, outerPixels) {
    return Array.from({ length: 7 }, (_, index) => {
      const fraction = CAVITY_RATIO + (1 - CAVITY_RATIO) * (index + 1) / 8;
      const shellRadiusMetres = fraction * values.outerRadius;
      const contributes = values.radius >= shellRadiusMetres;
      const pixelRadius = cavityPixels + (outerPixels - cavityPixels) * (index + 1) / 8;
      return `<circle class="p101-sample-shell ${contributes ? "is-enclosed" : "is-cancelling"}" cx="${centreX}" cy="${centreY}" r="${format(pixelRadius, 2)}"/>`;
    }).join("");
  }

  function moonSvg() {
    const values = fieldData();
    const centreX = 360, centreY = 215, outerPixels = 145, cavityPixels = outerPixels * CAVITY_RATIO;
    const travellerX = centreX + state.positionRatio * outerPixels;
    const arrowLength = values.surfaceField > 0 ? Math.min(105, 90 * values.fieldMagnitude / values.surfaceField) : 0;
    const arrowEndX = travellerX + values.direction * arrowLength;
    const enclosedPercent = 100 * values.enclosedFraction;
    return `<svg class="p101-svg p101-stage-${state.stage} is-${values.region}" viewBox="0 0 720 445" role="img" aria-labelledby="p101-svg-title p101-svg-desc">
      <title id="p101-svg-title">Gravitational field along a tunnel through a hollow spherical moon</title>
      <desc id="p101-svg-desc">The moon has total mass ${state.massMultiplier.toFixed(2)} lunar masses, outer radius ${format(state.radiusKm, 0)} kilometres and cavity radius ${format(CAVITY_RATIO * state.radiusKm, 0)} kilometres. The traveller is at signed position ${signed(values.position / 1000, 1)} kilometres, ${regionLabel(values.region).toLowerCase()}. Enclosed mass is ${format(enclosedPercent, 3)} percent and gravitational field magnitude is ${format(values.fieldMagnitude, 6)} newtons per kilogram.</desc>
      <defs><radialGradient id="p101-material" cx="42%" cy="38%"><stop offset="0" stop-color="#d9ad5e"/><stop offset="1" stop-color="#9e4d34"/></radialGradient><marker id="p101-field-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs>
      <rect class="p101-board" x="1" y="1" width="718" height="443" rx="20"/>
      <line class="p101-tunnel" x1="112" y1="${centreY}" x2="608" y2="${centreY}"/>
      <circle class="p101-material" cx="${centreX}" cy="${centreY}" r="${outerPixels}"/>
      <circle class="p101-cavity" cx="${centreX}" cy="${centreY}" r="${cavityPixels}"/>
      <g class="p101-shell-layer">${shellCircles(values, centreX, centreY, cavityPixels, outerPixels)}</g>
      <line class="p101-radius-mark" x1="${centreX}" y1="${centreY - outerPixels}" x2="${centreX}" y2="${centreY - cavityPixels}"/><text class="p101-radius-label" x="${centreX + 9}" y="${centreY - outerPixels - 9}">outer radius R = ${format(state.radiusKm, 0)} km</text><text class="p101-radius-label" x="${centreX + 9}" y="${centreY - cavityPixels + 18}">cavity radius a = R/2</text>
      <circle class="p101-centre" cx="${centreX}" cy="${centreY}" r="4"/><text class="p101-centre-label" x="${centreX}" y="${centreY + 18}" text-anchor="middle">centre</text>
      <g class="p101-traveller" transform="translate(${format(travellerX, 2)} ${centreY})"><circle r="10"/><path d="M-5-14Q0-22 5-14"/><text y="30" text-anchor="middle">x=${signed(values.position / 1000, 1)} km</text></g>
      ${values.fieldMagnitude > 0 ? `<g class="p101-field-vector"><line x1="${format(travellerX, 2)}" y1="${centreY - 22}" x2="${format(arrowEndX, 2)}" y2="${centreY - 22}" marker-end="url(#p101-field-arrow)"/><text x="${format((travellerX + arrowEndX) / 2, 2)}" y="${centreY - 34}" text-anchor="middle">g inward</text></g>` : `<g class="p101-field-vector p101-zero-vector" transform="translate(${format(travellerX, 2)} ${centreY - 24})"><circle r="9"/><text x="16" y="4">net g = 0</text></g>`}
      <g class="p101-status" transform="translate(20 20)"><rect width="238" height="70" rx="13"/><text class="p101-status-kicker" x="15" y="21">${regionLabel(values.region).toUpperCase()}</text><text class="p101-status-value" x="15" y="44">${state.stage >= 2 || state.revealed ? `${format(values.fieldMagnitude, 6)} N/kg` : state.stage === 1 ? activeFormula(values.region) : `${format(enclosedPercent, 2)}% enclosed mass`}</text><text class="p101-status-note" x="15" y="61">${values.region === "cavity" ? "all material shells cancel" : values.region === "material" ? "outer shells cancel" : "all material is enclosed"}</text></g>
      <g class="p101-law-layer" transform="translate(174 373)"><rect width="372" height="51" rx="12"/><text class="p101-law-kicker" x="186" y="19" text-anchor="middle">ACTIVE PIECE OF THE FIELD LAW</text><text class="p101-law-value" x="186" y="39" text-anchor="middle">${activeFormula(values.region)}</text></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = fieldData();
    return `<section class="p101-metrics" aria-live="polite"><div><span>Current region</span><strong>${regionLabel(values.region)}</strong></div><div><span>Enclosed mass</span><strong>${state.stage >= 1 || state.revealed ? `${format(100 * values.enclosedFraction, 3)}% of M` : "stage 2"}</strong></div><div><span>Field magnitude</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.fieldMagnitude, 6)} N/kg` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p101-dynamic">${moonSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = fieldData();
    return `<section class="p101-controls" aria-label="Hollow moon controls"><div class="p101-control-grid"><label for="p101-mass"><span>Total material mass M<output data-p101-output="mass">${format(state.massMultiplier, 2)} lunar masses</output></span><input id="p101-mass" type="range" min="0.25" max="3" step="0.05" value="${state.massMultiplier}"/></label><label for="p101-radius"><span>Outer radius R<output data-p101-output="radius">${format(state.radiusKm, 0)} km</output></span><input id="p101-radius" type="range" min="500" max="4000" step="10" value="${state.radiusKm}"/></label><label class="p101-position-control" for="p101-position"><span>Signed tunnel position x<output data-p101-output="position">${signed(values.position / 1000, 1)} km · ${signed(state.positionRatio, 2)}R</output></span><input id="p101-position" type="range" min="-1.4" max="1.4" step="0.01" value="${state.positionRatio}"/></label></div><p>The cavity radius remains a=R/2. The mass slider changes the total mass of the material layer, not its empty volume.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p101-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p101-solution" aria-labelledby="p101-solution-heading"><h3 id="p101-solution-heading" tabindex="-1">Every material shell surrounds the traveller</h3><p>Write the thick moon as a stack of thin uniform shells with radii s from a=R/2 to R. The traveller is at r=R/4, so r&lt;s for every material shell. By the shell theorem, each shell’s field at that interior point is zero.</p><div class="p101-equation">g(r=R/4)=∫<sub>R/2</sub><sup>R</sup> 0 · ds = 0 N/kg</div><p>At a general radial distance r, the complete result is</p><div class="p101-equation">g(r)=0, &nbsp; 0≤r&lt;a<br>g(r)=GM(r³−a³)/[(R³−a³)r²], &nbsp; a≤r&lt;R<br>g(r)=GM/r², &nbsp; r≥R</div><p>The direction is toward the centre whenever the magnitude is non-zero.</p><p class="p101-checks"><strong>Checks.</strong> At r=a the material expression gives zero, matching the cavity. At r=R it gives GM/R², matching the outside law. As r→0 the cavity field remains zero; far outside it falls as 1/r². Since GM/r² has units m/s²=N/kg, every branch has the correct field units.</p></section>`;
  }

  function snapshot() {
    const values = fieldData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", gravitationalConstantSI: G, totalMassKilograms: Number(values.mass.toPrecision(10)), outerRadiusKilometres: state.radiusKm, cavityRadiusKilometres: CAVITY_RATIO * state.radiusKm, signedPositionKilometres: Number((values.position / 1000).toFixed(6)), positionRatio: state.positionRatio, region: values.region, densityKilogramsPerCubicMetre: Number(values.density.toFixed(6)), enclosedMassKilograms: Number(values.enclosedMass.toPrecision(10)), enclosedMassFraction: Number(values.enclosedFraction.toFixed(9)), fieldMagnitudeNewtonsPerKilogram: Number(values.fieldMagnitude.toFixed(9)), signedFieldAlongTunnelNewtonsPerKilogram: Number(values.fieldAlongTunnel.toFixed(9)), surfaceFieldNewtonsPerKilogram: Number(values.surfaceField.toFixed(9)), seventyKilogramWeightNewtons: Number(values.astronautWeight.toFixed(9)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.massMultiplier = CHALLENGE.massMultiplier; state.radiusKm = CHALLENGE.radiusKm; state.positionRatio = CHALLENGE.positionRatio; }
  function render() {
    return `<main class="book-shell p101-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive gravitation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p101-spread"><article class="book-page p101-problem-page"><div class="problem-number">Problem 10.1</div><h1 class="book-title p101-title">The hollow moon</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A spherical moon has outer radius R and a concentric empty cavity of radius R/2. Its total mass M is spread uniformly through the material between those radii.</p><p class="problem-copy">A traveller in a radial tunnel pauses at distance R/4 from the centre. <strong>What is the gravitational field magnitude there?</strong></p><section class="p101-observation-card"><strong>Shell theorem</strong><p>A uniform spherical shell attracts an exterior point as though all shell mass were at the centre, while its pulls cancel exactly at any interior point.</p></section><section class="p101-model-card"><div class="eyebrow">Ideal model</div><p>Perfect spherical symmetry, uniform material density and Newtonian gravity. The tunnel and traveller do not disturb the mass distribution.</p></section></article><section class="book-page book-stage p101-stage">${stageControls()}<div class="p101-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p101-coach"><div class="coach-kicker">Listen to every shell</div><p class="coach-question">For the stated point r=R/4, enter the exact field magnitude.</p><form class="p101-answer-form" data-p101-answer-form novalidate><label for="p101-answer">Gravitational field magnitude</label><div><input id="p101-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="exact value" autocomplete="off"/><span>N/kg</span></div><button class="primary-button" type="submit">Check field</button></form>${feedbackMarkup()}<div class="button-row p101-help-row"><button class="secondary-button" type="button" data-problem-action="p101-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p101-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p101-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p101-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p101-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = fieldData();
    const outputs = { mass: `${format(state.massMultiplier, 2)} lunar masses`, radius: `${format(state.radiusKm, 0)} km`, position: `${signed(values.position / 1000, 1)} km · ${signed(state.positionRatio, 2)}R` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p101-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p101-mass")?.setAttribute("aria-valuetext", `${format(state.massMultiplier, 2)} lunar masses; surface field ${format(values.surfaceField, 4)} newtons per kilogram`);
    root.querySelector("#p101-radius")?.setAttribute("aria-valuetext", `Outer radius ${format(state.radiusKm, 0)} kilometres; cavity radius ${format(CAVITY_RATIO * state.radiusKm, 0)} kilometres`);
    root.querySelector("#p101-position")?.setAttribute("aria-valuetext", `Signed tunnel position ${signed(values.position / 1000, 1)} kilometres; ${regionLabel(values.region)}; field ${format(values.fieldMagnitude, 6)} newtons per kilogram`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p101-reset") { state = initialState(); renderAndFocus(renderApp, "#p101-position"); return; }
      if (action === "p101-stage") { state.stage = clamp(Number(control.dataset.p101Stage), 0, 2); renderAndFocus(renderApp, `[data-p101-stage="${state.stage}"]`); return; }
      if (action === "p101-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p101-stage="${state.stage}"]`); return; }
      if (action === "p101-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p101-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p101-reveal") window.requestAnimationFrame(() => document.querySelector("#p101-solution-heading")?.focus());
    }));
    [["#p101-mass", "massMultiplier", 0.25, 3], ["#p101-radius", "radiusKm", 500, 4000], ["#p101-position", "positionRatio", -1.4, 1.4]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p101-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p101-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one field magnitude in newtons per kilogram.";
      else if (Math.abs(answer) > 1e-12) state.feedback = "The traveller is inside every material shell. Apply the interior part of the shell theorem to each shell before adding their fields.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: the field is exactly 0 N/kg. Every concentric material shell surrounds the traveller and contributes zero net field."; }
      renderAndFocus(renderApp, "#p101-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
