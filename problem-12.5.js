(function registerColdEndEarthPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "12.5";
  const STEFAN_BOLTZMANN = 5.670374419e-8;
  const CHALLENGE = Object.freeze({ solarFlux: 800, incidenceFactor: 0.25, albedo: 0.6, emissivity: 1, otherInput: 20, polarNight: false });
  const CHALLENGE_TEMPERATURE_K = (100 / STEFAN_BOLTZMANN) ** 0.25;
  const stages = Object.freeze([
    Object.freeze({ short: "Incoming", title: "Build the local incoming flux", copy: "Project the beam-normal sunlight by μ=cos z, remove the reflected albedo fraction, then add prescribed transport and geothermal input." }),
    Object.freeze({ short: "Emission", title: "Write the graybody loss", copy: "A surface of emissivity ε at temperature T emits εσT⁴ watts per square metre. The fourth power makes temperature respond weakly to flux." }),
    Object.freeze({ short: "Balance", title: "Close the zero-dimensional ledger", copy: "At equilibrium, absorbed solar plus non-radiative input equals thermal emission. Solve the single algebraic balance for T." }),
  ]);
  const hints = Object.freeze([
    "The projected solar flux is Sμ. The surface absorbs fraction 1−α, so Fsolar=Sμ(1−α).",
    "For the challenge, Fsolar=800×0.25×0.40=80 W/m². Add 20 W/m² of prescribed transport/geothermal input.",
    "Equilibrium requires εσT⁴=100 W/m². Here ε=1.",
    `Take the fourth root: T=(100/σ)^(1/4)=${CHALLENGE_TEMPERATURE_K.toFixed(6)} K, or ${Math.round(CHALLENGE_TEMPERATURE_K)} K to the nearest kelvin.`,
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p125-reset">Reset</button>';

  const initialState = () => ({ solarFlux: CHALLENGE.solarFlux, incidenceFactor: CHALLENGE.incidenceFactor, albedo: CHALLENGE.albedo, emissivity: CHALLENGE.emissivity, otherInput: CHALLENGE.otherInput, polarNight: CHALLENGE.polarNight, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function equilibriumData(solarFlux = state.solarFlux, incidenceFactor = state.incidenceFactor, albedo = state.albedo, emissivity = state.emissivity, otherInput = state.otherInput, polarNight = state.polarNight) {
    const projectedSolar = polarNight ? 0 : solarFlux * incidenceFactor;
    const absorbedSolar = projectedSolar * (1 - albedo);
    const reflectedSolar = projectedSolar * albedo;
    const totalInput = absorbedSolar + otherInput;
    const equilibriumTemperature = totalInput <= 0 ? 0 : (totalInput / (emissivity * STEFAN_BOLTZMANN)) ** 0.25;
    const emittedFlux = emissivity * STEFAN_BOLTZMANN * equilibriumTemperature ** 4;
    return { projectedSolar, absorbedSolar, reflectedSolar, totalInput, equilibriumTemperature, temperatureCelsius: equilibriumTemperature - 273.15, emittedFlux, residual: emittedFlux - totalInput };
  }

  function reconstructionNote() {
    return `<p class="p125-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This local radiative-equilibrium problem is newly written and does not reproduce the book’s wording, numbers, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p125-stage-controls" role="group" aria-label="Polar energy balance stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p125-stage" data-p125-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p125-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p125-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Ledger balanced" : "Next stage"}</button></div>`;
  }

  function balanceSvg() {
    const values = equilibriumData();
    const baseline = 372, maximumHeight = 184, maximumFlux = Math.max(values.totalInput, 300);
    const solarHeight = maximumHeight * values.absorbedSolar / maximumFlux;
    const otherHeight = maximumHeight * state.otherInput / maximumFlux;
    const outputHeight = maximumHeight * values.emittedFlux / maximumFlux;
    const statusValue = state.stage === 0 ? `Fin=${format(values.absorbedSolar, 2)}+${format(state.otherInput, 2)}=${format(values.totalInput, 2)} W/m²` : state.stage === 1 ? `Fout=εσT⁴` : `Teq=${format(values.equilibriumTemperature, 3)} K`;
    return `<svg class="p125-svg p125-stage-${state.stage} ${state.polarNight ? "is-night" : "is-day"}" viewBox="0 0 720 440" role="img" aria-labelledby="p125-svg-title p125-svg-desc">
      <title id="p125-svg-title">Local polar surface energy balance</title>
      <desc id="p125-svg-desc">The local surface receives beam-normal solar flux ${format(state.solarFlux, 2)} watts per square metre with incidence factor ${format(state.incidenceFactor, 3)}, albedo ${format(state.albedo, 3)}, emissivity ${format(state.emissivity, 3)} and prescribed transport plus geothermal input ${format(state.otherInput, 2)} watts per square metre. ${state.polarNight ? "Polar night sets projected sunlight to zero." : `Absorbed sunlight is ${format(values.absorbedSolar, 3)} watts per square metre.`} Total input and equilibrium emission are both ${format(values.totalInput, 3)} watts per square metre, giving temperature ${format(values.equilibriumTemperature, 4)} kelvin.</desc>
      <defs><linearGradient id="p125-sky-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17384a"/><stop offset="1" stop-color="#8eb9c2"/></linearGradient><linearGradient id="p125-ice-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eff8f4"/><stop offset="1" stop-color="#9ec4cb"/></linearGradient><marker id="p125-solar-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p125-heat-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs>
      <rect class="p125-sky" x="1" y="1" width="718" height="278" rx="20"/><rect class="p125-ice" x="1" y="278" width="718" height="161"/><path class="p125-horizon" d="M1 292Q82 260 165 286T331 282T497 288T719 278V440H1Z"/>
      <g class="p125-day-symbol"><circle class="p125-sun" cx="83" cy="74" r="27"/><g class="p125-sun-rays"><line x1="83" y1="34" x2="83" y2="22"/><line x1="43" y1="74" x2="31" y2="74"/><line x1="123" y1="74" x2="135" y2="74"/><line x1="55" y1="46" x2="46" y2="37"/><line x1="111" y1="46" x2="120" y2="37"/></g></g><g class="p125-night-symbol"><path class="p125-moon" d="M105 45A30 30 0 1 0 112 102A24 24 0 1 1 105 45Z"/><circle cx="42" cy="52" r="2"/><circle cx="153" cy="37" r="2"/><circle cx="171" cy="83" r="1.5"/></g>
      <g class="p125-incoming-layer">${state.polarNight ? `<line class="p125-night-cross" x1="44" y1="112" x2="130" y2="198"/><line class="p125-night-cross" x1="130" y1="112" x2="44" y2="198"/><text class="p125-flux-label" x="87" y="218" text-anchor="middle">polar night · solar term = 0</text>` : `<line class="p125-solar-in" x1="109" y1="101" x2="238" y2="274" marker-end="url(#p125-solar-arrow)"/><text class="p125-flux-label" x="145" y="166">Sμ=${format(values.projectedSolar, 1)}</text><line class="p125-reflected" x1="238" y1="274" x2="319" y2="153" marker-end="url(#p125-solar-arrow)"/><text class="p125-flux-label" x="289" y="196">reflected ${format(values.reflectedSolar, 1)}</text><text class="p125-flux-label is-absorbed" x="185" y="309">absorbed ${format(values.absorbedSolar, 1)} W/m²</text>`}<line class="p125-other-input" x1="346" y1="407" x2="346" y2="292" marker-end="url(#p125-heat-arrow)"/><text class="p125-flux-label is-other" x="358" y="367">transport + geothermal ${format(state.otherInput, 1)}</text></g>
      <g class="p125-emission-layer"><line class="p125-thermal" x1="263" y1="277" x2="263" y2="157" marker-end="url(#p125-heat-arrow)"/><line class="p125-thermal" x1="304" y1="277" x2="304" y2="132" marker-end="url(#p125-heat-arrow)"/><line class="p125-thermal" x1="345" y1="277" x2="345" y2="157" marker-end="url(#p125-heat-arrow)"/><text class="p125-flux-label is-emission" x="303" y="118" text-anchor="middle">εσT⁴=${format(values.emittedFlux, 1)} W/m²</text></g>
      <g class="p125-temperature-layer"><rect x="208" y="322" width="180" height="62" rx="14"/><text class="p125-temp-kicker" x="298" y="344" text-anchor="middle">LOCAL EQUILIBRIUM</text><text class="p125-temp-value" x="298" y="369" text-anchor="middle">${format(values.equilibriumTemperature, 2)} K · ${format(values.temperatureCelsius, 2)} °C</text></g>
      <g class="p125-status" transform="translate(399 20)"><rect width="301" height="68" rx="13"/><text class="p125-status-kicker" x="15" y="21">${state.stage === 0 ? "INCOMING FLUX LEDGER" : state.stage === 1 ? "GRAYBODY EMISSION" : "ZERO-DIMENSIONAL BALANCE"}</text><text class="p125-status-value" x="15" y="45">${statusValue}</text><text class="p125-status-note" x="15" y="61">${state.polarNight ? "solar projection disabled" : `μ=${format(state.incidenceFactor, 2)} · absorbed fraction ${format(1 - state.albedo, 2)}`}</text></g>
      <g class="p125-bars"><text class="p125-bars-title" x="544" y="130" text-anchor="middle">FLUX BUDGET · W/m²</text><line class="p125-bar-baseline" x1="453" y1="${baseline}" x2="687" y2="${baseline}"/><rect class="p125-bar-solar" x="474" y="${format(baseline - solarHeight, 2)}" width="58" height="${format(solarHeight, 2)}"/><rect class="p125-bar-other" x="474" y="${format(baseline - solarHeight - otherHeight, 2)}" width="58" height="${format(otherHeight, 2)}"/><text class="p125-bar-label" x="503" y="397" text-anchor="middle">incoming ${format(values.totalInput, 1)}</text><g class="p125-output-bar"><rect x="591" y="${format(baseline - outputHeight, 2)}" width="58" height="${format(outputHeight, 2)}"/><text class="p125-bar-label" x="620" y="397" text-anchor="middle">emitted ${format(values.emittedFlux, 1)}</text></g></g>
    </svg>`;
  }

  function metricsMarkup() {
    const values = equilibriumData();
    return `<section class="p125-metrics" aria-live="polite"><div><span>Absorbed solar</span><strong>${format(values.absorbedSolar, 3)} W/m²</strong></div><div><span>Total local input</span><strong>${format(values.totalInput, 3)} W/m²</strong></div><div><span>Equilibrium temperature</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.equilibriumTemperature, 3)} K` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p125-dynamic">${balanceSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p125-controls" aria-label="Local polar energy controls"><label class="p125-night-control" for="p125-night"><input id="p125-night" type="checkbox" ${state.polarNight ? "checked" : ""}/><span><strong>Polar night</strong><small>Set projected solar flux to zero while retaining prescribed transport and geothermal input.</small></span></label><div class="p125-control-grid"><label for="p125-solar"><span>Beam-normal solar flux S<output data-p125-output="solar">${format(state.solarFlux, 0)} W/m²</output></span><input id="p125-solar" type="range" min="0" max="1400" step="10" value="${state.solarFlux}"/></label><label for="p125-incidence"><span>Incidence factor μ=cos z<output data-p125-output="incidence">${format(state.incidenceFactor, 2)}</output></span><input id="p125-incidence" type="range" min="0" max="1" step="0.01" value="${state.incidenceFactor}"/></label><label for="p125-albedo"><span>Surface albedo α<output data-p125-output="albedo">${format(state.albedo, 2)}</output></span><input id="p125-albedo" type="range" min="0" max="0.95" step="0.01" value="${state.albedo}"/></label><label for="p125-emissivity"><span>Thermal emissivity ε<output data-p125-output="emissivity">${format(state.emissivity, 2)}</output></span><input id="p125-emissivity" type="range" min="0.4" max="1" step="0.01" value="${state.emissivity}"/></label><label class="p125-other-control" for="p125-other"><span>Transport + geothermal input Q<output data-p125-output="other">${format(state.otherInput, 0)} W/m²</output></span><input id="p125-other" type="range" min="0" max="300" step="5" value="${state.otherInput}"/></label></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p125-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p125-solution" aria-labelledby="p125-solution-heading"><h3 id="p125-solution-heading" tabindex="-1">Close the local flux ledger</h3><p>The absorbed solar flux is</p><div class="p125-equation">Fsolar=Sμ(1−α)=800×0.25×0.40=80 W/m²</div><p>Adding the prescribed 20 W/m² transport/geothermal term gives Fin=100 W/m². At equilibrium,</p><div class="p125-equation">εσT⁴=Fin<br>T=[Fin/(εσ)]¹⁄⁴</div><div class="p125-equation p125-answer-equation">T=[100/(1×5.670374419×10⁻⁸)]¹⁄⁴<br>T=${CHALLENGE_TEMPERATURE_K.toFixed(6)} K ≈${Math.round(CHALLENGE_TEMPERATURE_K)} K</div><p>This is ${ (CHALLENGE_TEMPERATURE_K - 273.15).toFixed(3)} °C. During polar night the solar term is exactly zero in this model, but the prescribed Q term can still maintain a nonzero equilibrium.</p><p class="p125-checks"><strong>Checks and boundary.</strong> If all input vanishes, this algebraic model gives T=0 K—an explicit sign that omitted atmospheric and subsurface reservoirs matter. Doubling total input multiplies T by 2¹⁄⁴, while halving emissivity multiplies T by 2¹⁄⁴. Fluxes are W/m²; σT⁴ has the same units and temperature is kelvin. This is a local, steady, zero-dimensional surface ledger, not a climate prediction: it omits heat capacity, seasons, clouds, atmospheric back-radiation, spatial transport dynamics and feedbacks.</p></section>`;
  }

  function snapshot() {
    const values = equilibriumData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", modelBoundary: "local steady zero-dimensional surface balance; not a climate prediction", stefanBoltzmannWm2K4: STEFAN_BOLTZMANN, polarNight: state.polarNight, beamNormalSolarFluxWm2: state.solarFlux, incidenceFactorCosZenith: state.incidenceFactor, albedo: state.albedo, emissivity: state.emissivity, prescribedTransportAndGeothermalWm2: state.otherInput, projectedSolarWm2: Number(values.projectedSolar.toFixed(9)), absorbedSolarWm2: Number(values.absorbedSolar.toFixed(9)), reflectedSolarWm2: Number(values.reflectedSolar.toFixed(9)), totalInputWm2: Number(values.totalInput.toFixed(9)), emittedFluxWm2: Number(values.emittedFlux.toFixed(9)), equilibriumTemperatureK: Number(values.equilibriumTemperature.toFixed(9)), equilibriumTemperatureCelsius: Number(values.temperatureCelsius.toFixed(9)), balanceResidualWm2: Number(values.residual.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.solarFlux = CHALLENGE.solarFlux; state.incidenceFactor = CHALLENGE.incidenceFactor; state.albedo = CHALLENGE.albedo; state.emissivity = CHALLENGE.emissivity; state.otherInput = CHALLENGE.otherInput; state.polarNight = CHALLENGE.polarNight; }
  function render() {
    return `<main class="book-shell p125-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive thermal physics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p125-spread"><article class="book-page p125-problem-page"><div class="problem-number">Problem 12.5</div><h1 class="book-title p125-title">The cold end of the Earth</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">A local polar surface receives beam-normal solar flux 800 W/m² at incidence factor μ=0.25. Its albedo is 0.60 and emissivity is 1.00. Prescribed horizontal transport plus geothermal heating supplies another 20 W/m².</p><p class="problem-copy"><strong>In a steady zero-dimensional balance, what is the equilibrium surface temperature to the nearest kelvin?</strong></p><section class="p125-observation-card"><strong>Projected, reflected, emitted</strong><p>Only Sμ reaches a horizontal square metre; the surface absorbs fraction 1−α. Thermal emission then rises as the fourth power of absolute temperature.</p></section><section class="p125-model-card"><div class="eyebrow">Strict model boundary</div><p>This is a local algebraic surface ledger—not a polar climate prediction. Transport input is prescribed rather than calculated.</p></section></article><section class="book-page book-stage p125-stage">${stageControls()}<div class="p125-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p125-coach"><div class="coach-kicker">Close the flux budget</div><p class="coach-question">For the stated daytime parameters, enter the equilibrium temperature to the nearest kelvin.</p><form class="p125-answer-form" data-p125-answer-form novalidate><label for="p125-answer">Equilibrium temperature</label><div><input id="p125-answer" type="text" inputmode="numeric" value="${escapeAttribute(state.answer)}" placeholder="nearest kelvin" autocomplete="off"/><span>K</span></div><button class="primary-button" type="submit">Check temperature</button></form>${feedbackMarkup()}<div class="button-row p125-help-row"><button class="secondary-button" type="button" data-problem-action="p125-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p125-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p125-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p125-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p125-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = equilibriumData();
    const outputs = { solar: `${format(state.solarFlux, 0)} W/m²`, incidence: format(state.incidenceFactor, 2), albedo: format(state.albedo, 2), emissivity: format(state.emissivity, 2), other: `${format(state.otherInput, 0)} W/m²` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p125-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p125-solar")?.setAttribute("aria-valuetext", `${format(state.solarFlux, 0)} watts per square metre beam-normal; ${state.polarNight ? "ignored during polar night" : `${format(values.absorbedSolar, 2)} absorbed`}`);
    root.querySelector("#p125-incidence")?.setAttribute("aria-valuetext", `Cosine incidence factor ${format(state.incidenceFactor, 2)}; ${state.polarNight ? "solar term disabled" : `${format(values.projectedSolar, 2)} projected watts per square metre`}`);
    root.querySelector("#p125-albedo")?.setAttribute("aria-valuetext", `Albedo ${format(state.albedo, 2)}; absorbed solar ${format(values.absorbedSolar, 2)} watts per square metre`);
    root.querySelector("#p125-emissivity")?.setAttribute("aria-valuetext", `Thermal emissivity ${format(state.emissivity, 2)}; equilibrium temperature ${format(values.equilibriumTemperature, 2)} kelvin`);
    root.querySelector("#p125-other")?.setAttribute("aria-valuetext", `Prescribed transport and geothermal input ${format(state.otherInput, 0)} watts per square metre; total input ${format(values.totalInput, 2)}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p125-reset") { state = initialState(); renderAndFocus(renderApp, "#p125-solar"); return; }
      if (action === "p125-stage") { state.stage = clamp(Number(control.dataset.p125Stage), 0, 2); renderAndFocus(renderApp, `[data-p125-stage="${state.stage}"]`); return; }
      if (action === "p125-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p125-stage="${state.stage}"]`); return; }
      if (action === "p125-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p125-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p125-reveal") window.requestAnimationFrame(() => document.querySelector("#p125-solution-heading")?.focus());
    }));
    document.querySelector("#p125-night")?.addEventListener("change", (event) => { state.polarNight = Boolean(event.target.checked); updateDynamicDom(); });
    [["#p125-solar", "solarFlux", 0, 1400], ["#p125-incidence", "incidenceFactor", 0, 1], ["#p125-albedo", "albedo", 0, 0.95], ["#p125-emissivity", "emissivity", 0.4, 1], ["#p125-other", "otherInput", 0, 300]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p125-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p125-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one temperature in kelvin, rounded to the nearest kelvin.";
      else if (Math.abs(answer - (CHALLENGE_TEMPERATURE_K - 273.15)) <= 1) state.feedback = "That looks like the Celsius value. The answer box asks for absolute temperature in kelvin.";
      else if (Math.abs(answer - Math.round(CHALLENGE_TEMPERATURE_K)) > 0.6) state.feedback = "First find 800×0.25×(1−0.60)+20=100 W/m², then solve T=[Fin/(εσ)]¹⁄⁴.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: T=${CHALLENGE_TEMPERATURE_K.toFixed(6)} K, which rounds to ${Math.round(CHALLENGE_TEMPERATURE_K)} K.`; }
      renderAndFocus(renderApp, "#p125-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
