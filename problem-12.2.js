(function registerHeatedCubePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "12.2";
  const CHALLENGE = Object.freeze({ sideM: .2, density: 2700, specificHeat: 900, powerW: 500, deltaT: 50 });
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Cube the side length", copy: "A cube has volume V=L³ and external area A=6L². Only volume determines how much uniformly heated material exists in this no-loss model." }),
    Object.freeze({ short: "Thermal mass", title: "Turn volume into required energy", copy: "Mass is m=ρV and the sensible heating energy is Q=mcΔT. Constant density and specific heat are assumed." }),
    Object.freeze({ short: "Time", title: "Let the heater supply that energy", copy: "If every joule from a constant-power heater enters the cube, Pt=Q and t=ρcΔT L³/P." }),
  ]);
  const hints = Object.freeze([
    "The side is 0.200 m, so V=L³=(0.200)³=0.00800 m³.",
    "Mass is m=ρV=(2700)(0.00800)=21.6 kg.",
    "The cube needs Q=mcΔT=(21.6)(900)(50)=972,000 J.",
    "At 500 J/s, t=Q/P=1944 s. Divide by 60 to express the answer in minutes.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p122-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function cubeData(
    sideM = state.sideM,
    density = state.density,
    specificHeat = state.specificHeat,
    powerW = state.powerW,
    deltaT = state.deltaT,
  ) {
    const volume = sideM ** 3;
    const surfaceArea = 6 * sideM ** 2;
    const surfaceToVolume = surfaceArea / volume;
    const mass = density * volume;
    const energy = mass * specificHeat * deltaT;
    const timeSeconds = energy / powerW;
    const timeMinutes = timeSeconds / 60;
    const referenceSideRatio = sideM / CHALLENGE.sideM;
    const doubledSideAreaFactor = 4;
    const doubledSideVolumeFactor = 8;
    return {
      volume,
      surfaceArea,
      surfaceToVolume,
      mass,
      energy,
      timeSeconds,
      timeMinutes,
      referenceSideRatio,
      referenceAreaFactor: referenceSideRatio ** 2,
      referenceVolumeFactor: referenceSideRatio ** 3,
      doubledSideAreaFactor,
      doubledSideVolumeFactor,
      energyResidual: powerW * timeSeconds - energy,
      massResidual: mass - density * sideM ** 3,
    };
  }

  const challengeValues = cubeData(CHALLENGE.sideM, CHALLENGE.density, CHALLENGE.specificHeat, CHALLENGE.powerW, CHALLENGE.deltaT);

  function reconstructionNote() {
    return `<p class="p122-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This thermal-scaling investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p122-stage-controls" role="group" aria-label="Heated cube reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p122-stage" data-p122-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p122-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p122-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Heating timed" : "Next stage"}</button></div>`;
  }

  function cubeSvg() {
    const values = cubeData();
    const thermalVisible = state.stage >= 1 || state.revealed;
    const timeVisible = state.stage >= 2 || state.revealed;
    const size = 60 + 116 * (state.sideM - .05) / .45;
    const x = 182 - size / 2, y = 232 - size / 2;
    const depthX = .37 * size, depthY = -.25 * size;
    const heatFraction = clamp(state.deltaT / 100, 0, 1);
    const statusValue = state.stage === 0 ? `V=${format(values.volume, 6)} m³` : state.stage === 1 ? `Q=${format(values.energy / 1000, 3)} kJ` : `t=${format(values.timeMinutes, 4)} min`;
    return `<svg class="p122-svg p122-stage-${state.stage}" viewBox="0 0 720 445" role="img" aria-labelledby="p122-svg-title p122-svg-desc"><title id="p122-svg-title">Uniformly heated solid cube and energy calculation</title><desc id="p122-svg-desc">A solid cube has side ${format(state.sideM, 3)} metres, volume ${format(values.volume, 6)} cubic metres and mass ${format(values.mass, 4)} kilograms.${thermalVisible ? ` Raising its uniform temperature by ${format(state.deltaT, 1)} kelvin needs ${format(values.energy / 1000, 3)} kilojoules.` : ""}${timeVisible ? ` At ${format(state.powerW, 0)} watts the ideal heating time is ${format(values.timeMinutes, 4)} minutes.` : ""}</desc><defs><linearGradient id="p122-front" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efc78c"/><stop offset="1" stop-color="#c65d3e"/></linearGradient><marker id="p122-power-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs><rect class="p122-board" x="1" y="1" width="718" height="443" rx="20"/><g class="p122-cube" aria-hidden="true"><polygon class="p122-cube-top" points="${format(x, 2)},${format(y, 2)} ${format(x + size, 2)},${format(y, 2)} ${format(x + size + depthX, 2)},${format(y + depthY, 2)} ${format(x + depthX, 2)},${format(y + depthY, 2)}"/><polygon class="p122-cube-side" points="${format(x + size, 2)},${format(y, 2)} ${format(x + size, 2)},${format(y + size, 2)} ${format(x + size + depthX, 2)},${format(y + size + depthY, 2)} ${format(x + size + depthX, 2)},${format(y + depthY, 2)}"/><rect class="p122-cube-front" x="${format(x, 2)}" y="${format(y, 2)}" width="${format(size, 2)}" height="${format(size, 2)}" opacity="${format(.64 + .32 * heatFraction, 2)}"/><line class="p122-dimension" x1="${format(x, 2)}" y1="${format(y + size + 21, 2)}" x2="${format(x + size, 2)}" y2="${format(y + size + 21, 2)}"/><text class="p122-dimension-label" x="${format(x + size / 2, 2)}" y="${format(y + size + 38, 2)}" text-anchor="middle">L=${format(state.sideM, 3)} m</text><g class="p122-heater" transform="translate(35 327)"><rect width="82" height="49" rx="10"/><path d="M15 26c8-17 16 17 24 0s16 17 24 0"/><text x="41" y="69" text-anchor="middle">${format(state.powerW, 0)} W heater</text></g><line class="p122-power-vector" x1="119" y1="349" x2="${format(x - 10, 2)}" y2="${format(y + size * .76, 2)}" marker-end="url(#p122-power-arrow)"/><text class="p122-power-label" x="${format((119 + x - 10) / 2, 2)}" y="328" text-anchor="middle">energy Pt</text><g class="p122-scaling-card" transform="translate(267 316)"><rect width="158" height="84" rx="13"/><text class="p122-card-kicker" x="15" y="22">IF SIDE L DOUBLES</text><text class="p122-card-row" x="15" y="47">surface area</text><text class="p122-card-value area" x="143" y="47" text-anchor="end">×4</text><text class="p122-card-row" x="15" y="69">volume · mass · Q · t</text><text class="p122-card-value volume" x="143" y="69" text-anchor="end">×8</text></g></g><g class="p122-status" aria-hidden="true" transform="translate(458 24)"><rect width="242" height="79" rx="14"/><text class="p122-status-kicker" x="16" y="22">UNIFORM SOLID CUBE</text><text class="p122-status-value" x="16" y="50">${statusValue}</text><text class="p122-status-note" x="16" y="68">side relative to challenge ${format(values.referenceSideRatio, 3)}×</text></g><g class="p122-thermal-panel" aria-hidden="true" transform="translate(458 124)"><rect width="242" height="132" rx="14"/><text class="p122-panel-kicker" x="16" y="24">THERMAL MASS</text><text class="p122-panel-label" x="16" y="53">m=ρL³</text><text class="p122-panel-number" x="226" y="53" text-anchor="end">${thermalVisible ? `${format(values.mass, 4)} kg` : "stage 2"}</text><text class="p122-panel-label" x="16" y="80">Q=mcΔT</text><text class="p122-panel-number" x="226" y="80" text-anchor="end">${thermalVisible ? `${format(values.energy / 1000, 3)} kJ` : "stage 2"}</text><text class="p122-panel-label" x="16" y="107">surface area 6L²</text><text class="p122-panel-number aside" x="226" y="107" text-anchor="end">${format(values.surfaceArea, 5)} m² · aside</text></g><g class="p122-time-panel" aria-hidden="true" transform="translate(458 278)"><rect width="242" height="138" rx="14"/><text class="p122-panel-kicker" x="16" y="24">NO-LOSS HEATING TIME</text><text class="p122-equation" x="121" y="55" text-anchor="middle">t=ρcΔT L³/P</text><text class="p122-time-value" x="121" y="91" text-anchor="middle">${timeVisible ? `${format(values.timeMinutes, 4)} min` : "stage 3"}</text><text class="p122-time-note" x="121" y="116" text-anchor="middle">${timeVisible ? `${format(values.timeSeconds, 2)} s · volume factor ${format(values.referenceVolumeFactor, 3)}` : "surface area is not in this equation"}</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = cubeData();
    const thermalVisible = state.stage >= 1 || state.revealed;
    const timeVisible = state.stage >= 2 || state.revealed;
    return `<section class="p122-metrics" aria-live="polite"><div><span>Volume L³</span><strong>${format(values.volume, 6)} m³</strong></div><div><span>Surface area 6L²</span><strong>${format(values.surfaceArea, 5)} m²</strong></div><div><span>Mass ρL³</span><strong>${thermalVisible ? `${format(values.mass, 4)} kg` : "stage 2"}</strong></div><div><span>Heating energy</span><strong>${thermalVisible ? `${format(values.energy / 1000, 3)} kJ` : "stage 2"}</strong></div><div><span>Ideal heating time</span><strong>${timeVisible ? `${format(values.timeMinutes, 4)} min` : "stage 3"}</strong></div><div><span>Surface / volume</span><strong>${format(values.surfaceToVolume, 3)} m⁻¹</strong></div>${timeVisible ? `<p>At fixed material, ΔT and power, t∝L³: current side factor ${format(values.referenceSideRatio, 3)} gives a volume/time factor ${format(values.referenceVolumeFactor, 4)}. Energy residual ${values.energyResidual.toExponential(1)} J; mass residual ${values.massResidual.toExponential(1)} kg.</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p122-dynamic">${cubeSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p122-controls" aria-label="Heated cube controls"><div class="p122-control-grid"><label for="p122-side"><span>Cube side L<output data-p122-output="side">${format(state.sideM, 3)} m</output></span><input id="p122-side" type="range" min="0.05" max="0.5" step="0.01" value="${state.sideM}"/></label><label for="p122-density"><span>Density ρ<output data-p122-output="density">${format(state.density, 0)} kg/m³</output></span><input id="p122-density" type="range" min="500" max="8000" step="50" value="${state.density}"/></label><label for="p122-heat"><span>Specific heat c<output data-p122-output="heat">${format(state.specificHeat, 0)} J/(kg·K)</output></span><input id="p122-heat" type="range" min="200" max="2000" step="25" value="${state.specificHeat}"/></label><label for="p122-power"><span>Heater power P<output data-p122-output="power">${format(state.powerW, 0)} W</output></span><input id="p122-power" type="range" min="100" max="2000" step="50" value="${state.powerW}"/></label><label class="p122-temperature-control" for="p122-temperature"><span>Temperature rise ΔT<output data-p122-output="temperature">${format(state.deltaT, 0)} K</output></span><input id="p122-temperature" type="range" min="10" max="100" step="5" value="${state.deltaT}"/></label></div><p>Surface area is displayed to contrast L² with L³. It would matter in a heat-loss model, but it does not determine required sensible heat or time under the stipulated no-loss assumptions.</p><div class="p122-presets" role="group" aria-label="Cube examples"><button class="chip-button" type="button" data-problem-action="p122-preset" data-p122-preset="challenge">Aluminium challenge</button><button class="chip-button" type="button" data-problem-action="p122-preset" data-p122-preset="double">Double side</button><button class="chip-button" type="button" data-problem-action="p122-preset" data-p122-preset="half">Half side</button><button class="chip-button" type="button" data-problem-action="p122-preset" data-p122-preset="steel">Steel-like cube</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p122-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p122-solution" aria-labelledby="p122-solution-heading"><h3 id="p122-solution-heading" tabindex="-1">Heating time follows the cube’s volume</h3><div class="p122-solution-equation">V=L³=(0.200 m)³=0.00800 m³</div><div class="p122-solution-equation">m=ρV=(2700)(0.00800)=21.6 kg</div><div class="p122-solution-equation">Q=mcΔT=(21.6)(900)(50)=972,000 J</div><div class="p122-solution-equation">t=Q/P=972,000/500=1944 s<br>t=${format(challengeValues.timeMinutes, 6)} min</div><p>Combining the steps gives t=ρcΔT L³/P. Thus doubling only L multiplies the ideal time by 2³=8.</p><p class="p122-checks"><strong>Checks and assumptions.</strong> Halving L divides volume, mass, required energy and time by 8, while surface area falls only by 4. Doubling power halves time; doubling density, c or ΔT doubles time. Units: (kg/m³)(m³)(J/kg/K)(K)/W=J/(J/s)=s. The cube is homogeneous and remains at one uniform temperature (a lumped model); density and c are constant, heater power is constant and entirely deposited in the cube, and thermal expansion, phase changes, heater/cube contact resistance and all environmental heat losses are omitted. In reality, loss and heating uniformity introduce area and conduction effects.</p></section>`;
  }

  function snapshot() {
    const values = cubeData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", model: "uniform lumped cube with no heat loss", sideMetres: state.sideM, densityKilogramsPerCubicMetre: state.density, specificHeatJoulesPerKilogramKelvin: state.specificHeat, heaterPowerWatts: state.powerW, temperatureRiseKelvin: state.deltaT, volumeCubicMetres: Number(values.volume.toFixed(9)), surfaceAreaSquareMetres: Number(values.surfaceArea.toFixed(9)), surfaceToVolumeInverseMetres: Number(values.surfaceToVolume.toFixed(9)), massKilograms: Number(values.mass.toFixed(9)), requiredEnergyJoules: Number(values.energy.toFixed(6)), idealHeatingTimeSeconds: Number(values.timeSeconds.toFixed(6)), idealHeatingTimeMinutes: Number(values.timeMinutes.toFixed(6)), sideFactorRelativeToChallenge: Number(values.referenceSideRatio.toFixed(6)), volumeAndTimeFactorAtFixedOtherInputs: Number(values.referenceVolumeFactor.toFixed(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.sideM = CHALLENGE.sideM; state.density = CHALLENGE.density; state.specificHeat = CHALLENGE.specificHeat; state.powerW = CHALLENGE.powerW; state.deltaT = CHALLENGE.deltaT; }
  function render() {
    return `<main class="book-shell p122-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive thermal scaling</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p122-spread"><article class="book-page p122-problem-page"><div class="problem-number">Problem 12.2</div><h1 class="book-title p122-title">The heated cube</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A solid aluminium-like cube has side 0.200 m, density 2700 kg/m³ and specific heat capacity 900 J/(kg·K). A 500 W heater raises its uniform temperature by 50 K.</p><p class="problem-copy"><strong>Ignoring all heat losses, how long does the heating take in minutes?</strong></p><section class="p122-scaling-card"><strong>Watch the exponent</strong><p>The cube’s material amount follows L³. Surface area follows L², but is only a comparison in this no-loss activity.</p></section><section class="p122-model-card"><div class="eyebrow">Lumped no-loss model</div><p>The entire cube shares one temperature at every instant and receives all heater power. Material properties remain constant.</p></section></article><section class="book-page book-stage p122-stage">${stageControls()}<div class="p122-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p122-coach"><div class="coach-kicker">Heat the whole volume</div><p class="coach-question">For the fixed 0.200 m aluminium-like cube, enter the ideal heating time.</p><form class="p122-answer-form" data-p122-answer-form novalidate><label for="p122-answer">Heating time</label><div><input id="p122-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="time in minutes" autocomplete="off"/><span>min</span></div><button class="primary-button" type="submit">Check heating time</button></form>${feedbackMarkup()}<div class="button-row p122-help-row"><button class="secondary-button" type="button" data-problem-action="p122-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p122-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p122-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p122-shell"); if (!root) return;
    const dynamic = root.querySelector(".p122-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = { side: `${format(state.sideM, 3)} m`, density: `${format(state.density, 0)} kg/m³`, heat: `${format(state.specificHeat, 0)} J/(kg·K)`, power: `${format(state.powerW, 0)} W`, temperature: `${format(state.deltaT, 0)} K` };
    Object.entries(values).forEach(([key, value]) => { const output = root.querySelector(`[data-p122-output="${key}"]`); if (output) output.textContent = value; });
    const data = cubeData();
    root.querySelector("#p122-side")?.setAttribute("aria-valuetext", `Cube side ${format(state.sideM, 3)} metres; volume ${format(data.volume, 6)} cubic metres; ideal time ${format(data.timeMinutes, 3)} minutes`);
    root.querySelector("#p122-density")?.setAttribute("aria-valuetext", `Density ${format(state.density, 0)} kilograms per cubic metre; mass ${format(data.mass, 3)} kilograms`);
    root.querySelector("#p122-heat")?.setAttribute("aria-valuetext", `Specific heat ${format(state.specificHeat, 0)} joules per kilogram kelvin`);
    root.querySelector("#p122-power")?.setAttribute("aria-valuetext", `Heater power ${format(state.powerW, 0)} watts; ideal time ${format(data.timeMinutes, 3)} minutes`);
    root.querySelector("#p122-temperature")?.setAttribute("aria-valuetext", `Temperature rise ${format(state.deltaT, 0)} kelvin; energy ${format(data.energy / 1000, 3)} kilojoules`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p122-reset") { state = initialState(); renderAndFocus(renderApp, "#p122-side"); return; }
      if (action === "p122-stage") { state.stage = clamp(Number(control.dataset.p122Stage), 0, 2); renderAndFocus(renderApp, `[data-p122-stage="${state.stage}"]`); return; }
      if (action === "p122-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p122-stage="${state.stage}"]`); return; }
      if (action === "p122-preset") {
        const preset = control.dataset.p122Preset;
        if (preset === "challenge") restoreChallenge();
        if (preset === "double") { restoreChallenge(); state.sideM = .4; }
        if (preset === "half") { restoreChallenge(); state.sideM = .1; }
        if (preset === "steel") { state.sideM = .2; state.density = 7850; state.specificHeat = 475; state.powerW = 500; state.deltaT = 50; }
        renderAndFocus(renderApp, "#p122-side"); return;
      }
      if (action === "p122-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p122-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p122-reveal") window.requestAnimationFrame(() => document.querySelector("#p122-solution-heading")?.focus());
    }));
    [["#p122-side", "sideM", .05, .5], ["#p122-density", "density", 500, 8000], ["#p122-heat", "specificHeat", 200, 2000], ["#p122-power", "powerW", 100, 2000], ["#p122-temperature", "deltaT", 10, 100]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const input = document.querySelector("#p122-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p122-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = challengeValues.timeMinutes; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one heating time in minutes.";
      else if (Math.abs(answer - challengeValues.timeSeconds) < 1) state.feedback = "That numerical value is seconds. Divide by 60 for the requested minutes.";
      else if (Math.abs(answer - target) > .03) state.feedback = "Find L³, then m=ρL³, Q=mcΔT and finally t=Q/P.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.feedback = `Correct: Q=972 kJ and t=1944 s=${format(target, 4)} min. At fixed other inputs, heating time follows L³.`; }
      renderAndFocus(renderApp, "#p122-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
