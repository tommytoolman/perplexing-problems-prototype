(function registerIceInDesertPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "12.4";
  const ICE_SPECIFIC_HEAT = 2100;
  const FUSION_LATENT_HEAT = 334000;
  const WATER_SPECIFIC_HEAT = 4180;
  const CHALLENGE = Object.freeze({ massKg: 10, initialTemperatureC: -20, solarPowerW: 1000, albedo: .5, insulation: .5, bareLossW: 200, finalWaterTemperatureC: 20 });
  const stages = Object.freeze([
    Object.freeze({ short: "Warm ice", title: "Raise solid ice to its melting point", copy: "Below 0°C, sensible heat changes temperature: Qice=mcice(0−Ti). No melting occurs yet." }),
    Object.freeze({ short: "Melt", title: "Supply latent heat at constant temperature", copy: "At 0°C, Qmelt=mLf changes phase without raising temperature. This is usually the largest energy stage." }),
    Object.freeze({ short: "Warm water", title: "Heat the liquid after the last ice melts", copy: "Only after melting is complete does added sensible heat raise the water temperature: Qwater=mcwaterTf." }),
  ]);
  const hints = Object.freeze([
    "Absorbed sunlight is (1−0.50)(1000 W)=500 W. Insulation leaves (1−0.50)(200 W)=100 W of loss, so Pnet=400 W.",
    "Warm the ice first: Qice=(10)(2100)(20)=420,000 J.",
    "Melt it at 0°C: Qmelt=(10)(334,000)=3,340,000 J. Do not use cΔT during the phase change.",
    "Time to fully melted is (Qice+Qmelt)/Pnet=3,760,000/400 seconds. Convert to hours.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p124-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }
  function duration(seconds) { if (!Number.isFinite(seconds)) return "stalled"; if (seconds < 3600) return `${format(seconds / 60, 2)} min`; return `${format(seconds / 3600, 3)} h`; }

  function heatData(
    massKg = state.massKg,
    initialTemperatureC = state.initialTemperatureC,
    solarPowerW = state.solarPowerW,
    albedo = state.albedo,
    insulation = state.insulation,
    bareLossW = state.bareLossW,
    finalWaterTemperatureC = state.finalWaterTemperatureC,
  ) {
    const absorbedSolarPower = (1 - albedo) * solarPowerW;
    const remainingAmbientLoss = (1 - insulation) * bareLossW;
    const netHeatingPower = absorbedSolarPower - remainingAmbientLoss;
    const warmingIceEnergy = massKg * ICE_SPECIFIC_HEAT * Math.max(0, -initialTemperatureC);
    const meltingEnergy = massKg * FUSION_LATENT_HEAT;
    const warmingWaterEnergy = massKg * WATER_SPECIFIC_HEAT * Math.max(0, finalWaterTemperatureC);
    const energyToFullyMelt = warmingIceEnergy + meltingEnergy;
    const totalEnergy = energyToFullyMelt + warmingWaterEnergy;
    const canHeat = netHeatingPower > 0;
    const warmingIceTime = canHeat ? warmingIceEnergy / netHeatingPower : Infinity;
    const meltingTime = canHeat ? meltingEnergy / netHeatingPower : Infinity;
    const timeToFullyMelt = canHeat ? energyToFullyMelt / netHeatingPower : Infinity;
    const warmingWaterTime = canHeat ? warmingWaterEnergy / netHeatingPower : Infinity;
    const totalTime = canHeat ? totalEnergy / netHeatingPower : Infinity;
    return {
      absorbedSolarPower,
      remainingAmbientLoss,
      netHeatingPower,
      warmingIceEnergy,
      meltingEnergy,
      warmingWaterEnergy,
      energyToFullyMelt,
      totalEnergy,
      canHeat,
      warmingIceTime,
      meltingTime,
      timeToFullyMelt,
      warmingWaterTime,
      totalTime,
      powerBalanceResidual: absorbedSolarPower - remainingAmbientLoss - netHeatingPower,
      meltEnergyResidual: energyToFullyMelt - warmingIceEnergy - meltingEnergy,
    };
  }

  const challengeValues = heatData(CHALLENGE.massKg, CHALLENGE.initialTemperatureC, CHALLENGE.solarPowerW, CHALLENGE.albedo, CHALLENGE.insulation, CHALLENGE.bareLossW, CHALLENGE.finalWaterTemperatureC);

  function reconstructionNote() {
    return `<p class="p124-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and three-star difficulty. This transient phase-change investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p124-stage-controls" role="group" aria-label="Ice heating and phase-change stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p124-stage" data-p124-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p124-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p124-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Water warmed" : "Next stage"}</button></div>`;
  }

  function heatSvg() {
    const values = heatData();
    const q1 = values.warmingIceEnergy, q2 = values.meltingEnergy, q3 = values.warmingWaterEnergy;
    const total = Math.max(1, values.totalEnergy);
    const graphX = 230, graphWidth = 182;
    const x1 = graphX + graphWidth * q1 / total, x2 = x1 + graphWidth * q2 / total, x3 = graphX + graphWidth;
    const startY = 184, meltY = 128, waterY = 78;
    const iceAmount = state.stage === 0 ? 1 : state.stage === 1 ? .5 : 0;
    const waterAmount = state.stage === 0 ? 0 : state.stage === 1 ? .5 : 1;
    const statusValue = !values.canHeat ? "NET POWER ≤ 0 · STALLED" : state.stage === 0 ? `Qice ${format(q1 / 1000, 2)} kJ` : state.stage === 1 ? `Qmelt ${format(q2 / 1000, 2)} kJ` : `Qwater ${format(q3 / 1000, 2)} kJ`;
    return `<svg class="p124-svg p124-stage-${state.stage} ${values.canHeat ? "is-heating" : "is-stalled"}" viewBox="0 0 720 445" role="img" aria-labelledby="p124-svg-title p124-svg-desc"><title id="p124-svg-title">Ice warming, melting and liquid-water warming under net power</title><desc id="p124-svg-desc">${format(state.massKg, 1)} kilograms of ice begins at ${format(state.initialTemperatureC, 0)} degrees Celsius. Absorbed solar power is ${format(values.absorbedSolarPower, 1)} watts, remaining loss is ${format(values.remainingAmbientLoss, 1)} watts and net heating power is ${format(values.netHeatingPower, 1)} watts.${values.canHeat ? ` Ideal time to fully melted is ${format(values.timeToFullyMelt / 3600, 5)} hours.` : " Net power is not positive, so the temperature and phase do not progress in this model."}</desc><defs><linearGradient id="p124-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#71b9d0"/></linearGradient><marker id="p124-in-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p124-out-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs><rect class="p124-board" x="1" y="1" width="718" height="443" rx="20"/><g class="p124-process" aria-hidden="true"><g class="p124-sun" transform="translate(49 47)"><circle r="22"/><path d="M0-34V-45M0 34V45M-34 0H-45M34 0H45M-24-24L-32-32M24-24L32-32M-24 24L-32 32M24 24L32 32"/></g><line class="p124-solar-arrow" x1="76" y1="65" x2="145" y2="104" marker-end="url(#p124-in-arrow)"/><text class="p124-flow-label" x="108" y="70">absorbed ${format(values.absorbedSolarPower, 0)} W</text><g class="p124-container" transform="translate(162 215)"><path d="M-58-65H58L47 39Q0 58-47 39Z"/><path class="p124-water" opacity="${waterAmount}" d="M-49-10H49L44 37Q0 52-44 37Z"/><g class="p124-ice" opacity="${iceAmount}"><rect x="-38" y="-48" width="39" height="35" rx="5"/><rect x="7" y="-43" width="35" height="31" rx="5"/><rect x="-16" y="-8" width="39" height="34" rx="5"/></g><text x="0" y="79" text-anchor="middle">${state.stage === 0 ? `${format(state.initialTemperatureC, 0)}°C ice` : state.stage === 1 ? "0°C ice + water" : `${format(state.finalWaterTemperatureC, 0)}°C water`}</text></g><line class="p124-loss-arrow" x1="231" y1="174" x2="294" y2="136" marker-end="url(#p124-out-arrow)"/><text class="p124-flow-label loss" x="278" y="126">loss ${format(values.remainingAmbientLoss, 0)} W</text><g class="p124-curve"><line class="p124-axis" x1="${graphX}" y1="204" x2="${x3 + 16}" y2="204"/><line class="p124-axis" x1="${graphX}" y1="58" x2="${graphX}" y2="204"/><path class="p124-ice-line" d="M${graphX} ${startY}L${format(x1, 2)} ${meltY}"/><path class="p124-latent-line" d="M${format(x1, 2)} ${meltY}H${format(x2, 2)}"/><path class="p124-water-line" d="M${format(x2, 2)} ${meltY}L${format(x3, 2)} ${waterY}"/><text x="${graphX - 8}" y="${startY + 4}" text-anchor="end">${format(state.initialTemperatureC, 0)}°C</text><text x="${graphX - 8}" y="${meltY + 4}" text-anchor="end">0°C</text><text x="${graphX - 8}" y="${waterY + 4}" text-anchor="end">${format(state.finalWaterTemperatureC, 0)}°C</text><text class="p124-curve-title" x="${(graphX + x3) / 2}" y="42" text-anchor="middle">TEMPERATURE AGAINST CUMULATIVE ENERGY</text><text class="p124-stage-label" x="${(graphX + x1) / 2}" y="224" text-anchor="middle">sensible ice</text><text class="p124-stage-label" x="${(x1 + x2) / 2}" y="224" text-anchor="middle">latent melt</text><text class="p124-stage-label" x="${(x2 + x3) / 2}" y="224" text-anchor="middle">sensible water</text></g><g class="p124-net-card" transform="translate(87 331)"><rect width="331" height="72" rx="13"/><text class="p124-card-kicker" x="16" y="22">CONSTANT NET HEATING POWER</text><text class="p124-card-equation" x="16" y="48">Pnet=(1−A)Psolar−(1−I)Ploss</text><text class="p124-card-value" x="315" y="48" text-anchor="end">${format(values.netHeatingPower, 1)} W</text></g></g><g class="p124-status" aria-hidden="true" transform="translate(458 24)"><rect width="242" height="79" rx="14"/><text class="p124-status-kicker" x="16" y="22">${stages[state.stage].short.toUpperCase()}</text><text class="p124-status-value" x="16" y="50">${statusValue}</text><text class="p124-status-note" x="16" y="68">${values.canHeat ? `stage time ${duration([values.warmingIceTime, values.meltingTime, values.warmingWaterTime][state.stage])}` : "absorbed input does not exceed loss"}</text></g><g class="p124-energy-panel" aria-hidden="true" transform="translate(458 124)"><rect width="242" height="132" rx="14"/><text class="p124-panel-kicker" x="16" y="24">ENERGY LEDGER</text><text class="p124-panel-label" x="16" y="53">warm ice mciceΔT</text><text class="p124-panel-number" x="226" y="53" text-anchor="end">${format(q1 / 1000, 2)} kJ</text><text class="p124-panel-label" x="16" y="80">melt ice mLf</text><text class="p124-panel-number latent" x="226" y="80" text-anchor="end">${format(q2 / 1000, 2)} kJ</text><text class="p124-panel-label" x="16" y="107">warm water mcwaterTf</text><text class="p124-panel-number" x="226" y="107" text-anchor="end">${format(q3 / 1000, 2)} kJ</text></g><g class="p124-time-panel" aria-hidden="true" transform="translate(458 278)"><rect width="242" height="138" rx="14"/><text class="p124-panel-kicker" x="16" y="24">IDEALIZED ELAPSED TIME</text><text class="p124-panel-label" x="16" y="54">fully melted</text><text class="p124-panel-number" x="226" y="54" text-anchor="end">${duration(values.timeToFullyMelt)}</text><text class="p124-panel-label" x="16" y="80">water at ${format(state.finalWaterTemperatureC, 0)}°C</text><text class="p124-panel-number" x="226" y="80" text-anchor="end">${duration(values.totalTime)}</text><text class="p124-time-note" x="121" y="112" text-anchor="middle">${values.canHeat ? "time = cumulative energy / Pnet" : "no finite heating time"}</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = heatData();
    return `<section class="p124-metrics" aria-live="polite"><div><span>Absorbed solar</span><strong>${format(values.absorbedSolarPower, 1)} W</strong></div><div><span>Remaining ambient loss</span><strong>${format(values.remainingAmbientLoss, 1)} W</strong></div><div><span>Net heating power</span><strong>${format(values.netHeatingPower, 1)} W</strong></div><div><span>Sensible heat: ice</span><strong>${format(values.warmingIceEnergy / 1000, 2)} kJ</strong></div><div><span>Latent heat: melting</span><strong>${format(values.meltingEnergy / 1000, 2)} kJ</strong></div><div><span>Sensible heat: water</span><strong>${format(values.warmingWaterEnergy / 1000, 2)} kJ</strong></div><div><span>Time until fully melted</span><strong>${duration(values.timeToFullyMelt)}</strong></div><div><span>Total to final water</span><strong>${duration(values.totalTime)}</strong></div><p>${values.canHeat ? `Latent heat is ${format(values.meltingEnergy / values.energyToFullyMelt * 100, 2)}% of the energy needed to reach fully melted. Power residual ${values.powerBalanceResidual.toExponential(1)} W; melt-energy residual ${values.meltEnergyResidual.toExponential(1)} J.` : "The current absorbed solar input is no larger than the remaining constant loss, so this model cannot progress through its heating stages."}</p></section>`;
  }

  function dynamicMarkup() { return `<div class="p124-dynamic">${heatSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p124-controls" aria-label="Ice heating controls"><div class="p124-control-grid"><label for="p124-mass"><span>Ice mass m<output data-p124-output="mass">${format(state.massKg, 1)} kg</output></span><input id="p124-mass" type="range" min="1" max="50" step="1" value="${state.massKg}"/></label><label for="p124-initial"><span>Initial ice temperature Ti<output data-p124-output="initial">${format(state.initialTemperatureC, 0)}°C</output></span><input id="p124-initial" type="range" min="-40" max="0" step="1" value="${state.initialTemperatureC}"/></label><label for="p124-solar"><span>Incident solar input<output data-p124-output="solar">${format(state.solarPowerW, 0)} W</output></span><input id="p124-solar" type="range" min="200" max="2000" step="50" value="${state.solarPowerW}"/></label><label for="p124-albedo"><span>Albedo A<output data-p124-output="albedo">${format(state.albedo * 100, 0)}% reflected</output></span><input id="p124-albedo" type="range" min="0" max="0.9" step="0.05" value="${state.albedo}"/></label><label for="p124-insulation"><span>Insulation I<output data-p124-output="insulation">${format(state.insulation * 100, 0)}% of bare loss blocked</output></span><input id="p124-insulation" type="range" min="0" max="0.95" step="0.05" value="${state.insulation}"/></label><label for="p124-loss"><span>Bare ambient/radiative loss<output data-p124-output="loss">${format(state.bareLossW, 0)} W</output></span><input id="p124-loss" type="range" min="0" max="1000" step="25" value="${state.bareLossW}"/></label><label class="p124-final-control" for="p124-final"><span>Final liquid-water temperature<output data-p124-output="final">${format(state.finalWaterTemperatureC, 0)}°C</output></span><input id="p124-final" type="range" min="5" max="40" step="5" value="${state.finalWaterTemperatureC}"/></label></div><p>Albedo acts only on sunlight; insulation acts only on the stipulated bare loss. Both power terms are held constant through every temperature and phase stage.</p><div class="p124-presets" role="group" aria-label="Desert ice cases"><button class="chip-button" type="button" data-problem-action="p124-preset" data-p124-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p124-preset" data-p124-preset="reflective">Reflective cover</button><button class="chip-button" type="button" data-problem-action="p124-preset" data-p124-preset="insulated">Well insulated</button><button class="chip-button" type="button" data-problem-action="p124-preset" data-p124-preset="stalled">Stalled balance</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p124-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p124-solution" aria-labelledby="p124-solution-heading"><h3 id="p124-solution-heading" tabindex="-1">Warm first, then pay the latent-heat bill</h3><div class="p124-solution-equation">Pabsorbed=(1−A)Psolar=(1−0.50)(1000)=500 W<br>Ploss=(1−I)Pbare=(1−0.50)(200)=100 W<br>Pnet=400 W</div><div class="p124-solution-equation">Qice=mcice(0−Ti)=(10)(2100)(20)=420,000 J</div><div class="p124-solution-equation">Qmelt=mLf=(10)(334,000)=3,340,000 J</div><div class="p124-solution-equation">tmelted=(Qice+Qmelt)/Pnet<br>=3,760,000/400=9400 s<br>=${format(challengeValues.timeToFullyMelt / 3600, 9)} h</div><p>The later water-warming stage needs a separate Qwater=(10)(4180)(20)=836 kJ and does not belong in the time-to-fully-melt answer.</p><p class="p124-checks"><strong>Checks and assumptions.</strong> Doubling mass doubles every energy and time; doubling positive net power halves every time. At Ti=0°C, Qice vanishes but latent heat remains. During melting, temperature stays 0°C in the model. Units: kg·J/(kg·K)·K and kg·J/kg are joules; J/W is seconds. Ice and water are each spatially uniform (lumped), properties and phase temperature are constant, pressure fixes melting at 0°C, and solar input, albedo, insulation and loss stay constant. Container heat capacity, conduction gradients, changing radiative/convective loss, evaporation, sublimation, melt drainage and solar-angle variation are omitted. The “loss” is an imposed outward heat-flow term; a real hot desert can instead drive inward ambient heat, requiring a signed exchange model.</p></section>`;
  }

  function snapshot() {
    const values = heatData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", iceSpecificHeatJoulesPerKilogramKelvin: ICE_SPECIFIC_HEAT, latentHeatFusionJoulesPerKilogram: FUSION_LATENT_HEAT, waterSpecificHeatJoulesPerKilogramKelvin: WATER_SPECIFIC_HEAT, iceMassKilograms: state.massKg, initialIceTemperatureCelsius: state.initialTemperatureC, incidentSolarPowerWatts: state.solarPowerW, albedo: state.albedo, insulationLossBlockedFraction: state.insulation, bareAmbientLossWatts: state.bareLossW, finalWaterTemperatureCelsius: state.finalWaterTemperatureC, absorbedSolarPowerWatts: Number(values.absorbedSolarPower.toFixed(8)), remainingLossWatts: Number(values.remainingAmbientLoss.toFixed(8)), netHeatingPowerWatts: Number(values.netHeatingPower.toFixed(8)), warmingIceEnergyJoules: Number(values.warmingIceEnergy.toFixed(6)), meltingLatentEnergyJoules: Number(values.meltingEnergy.toFixed(6)), warmingWaterEnergyJoules: Number(values.warmingWaterEnergy.toFixed(6)), timeToFullyMeltSeconds: Number.isFinite(values.timeToFullyMelt) ? Number(values.timeToFullyMelt.toFixed(6)) : null, totalTimeSeconds: Number.isFinite(values.totalTime) ? Number(values.totalTime.toFixed(6)) : null, stalled: !values.canHeat, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p124-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive phase change</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p124-spread"><article class="book-page p124-problem-page"><div class="problem-number">Problem 12.4</div><h1 class="book-title p124-title">Ice in the desert</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${reconstructionNote()}<p class="problem-copy">Ten kilograms of ice begins at −20°C. It receives 1000 W of incident sunlight, reflects 50%, and an insulating cover blocks 50% of a stipulated 200 W bare ambient/radiative loss.</p><p class="problem-copy">Using cice=2100 J/(kg·K) and Lf=334 kJ/kg, <strong>how many hours pass before the ice is fully melted?</strong></p><section class="p124-phase-card"><strong>Do not blend the stages</strong><p>Sensible heat changes temperature within one phase. Latent heat changes phase at 0°C without changing temperature.</p></section><section class="p124-model-card"><div class="eyebrow">Constant net-power model</div><p>Absorbed solar input minus the insulated loss is applied uniformly throughout warming and melting.</p></section></article><section class="book-page book-stage p124-stage">${stageControls()}<div class="p124-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p124-coach"><div class="coach-kicker">Pay sensible, then latent</div><p class="coach-question">For the fixed ten-kilogram challenge, enter the time until the last ice melts.</p><form class="p124-answer-form" data-p124-answer-form novalidate><label for="p124-answer">Time until fully melted</label><div><input id="p124-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="time in hours" autocomplete="off"/><span>h</span></div><button class="primary-button" type="submit">Check melting time</button></form>${feedbackMarkup()}<div class="button-row p124-help-row"><button class="secondary-button" type="button" data-problem-action="p124-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p124-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p124-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p124-shell"); if (!root) return;
    const dynamic = root.querySelector(".p124-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { mass: `${format(state.massKg, 1)} kg`, initial: `${format(state.initialTemperatureC, 0)}°C`, solar: `${format(state.solarPowerW, 0)} W`, albedo: `${format(state.albedo * 100, 0)}% reflected`, insulation: `${format(state.insulation * 100, 0)}% of bare loss blocked`, loss: `${format(state.bareLossW, 0)} W`, final: `${format(state.finalWaterTemperatureC, 0)}°C` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p124-output="${key}"]`); if (output) output.textContent = value; });
    const values = heatData();
    root.querySelector("#p124-mass")?.setAttribute("aria-valuetext", `Ice mass ${format(state.massKg, 1)} kilograms; latent energy ${format(values.meltingEnergy / 1e6, 3)} megajoules`);
    root.querySelector("#p124-initial")?.setAttribute("aria-valuetext", `Initial ice temperature ${format(state.initialTemperatureC, 0)} degrees Celsius; warming energy ${format(values.warmingIceEnergy / 1000, 2)} kilojoules`);
    root.querySelector("#p124-solar")?.setAttribute("aria-valuetext", `Incident solar input ${format(state.solarPowerW, 0)} watts; absorbed ${format(values.absorbedSolarPower, 0)} watts`);
    root.querySelector("#p124-albedo")?.setAttribute("aria-valuetext", `Albedo ${format(state.albedo * 100, 0)} percent; net heating power ${format(values.netHeatingPower, 1)} watts`);
    root.querySelector("#p124-insulation")?.setAttribute("aria-valuetext", `Insulation blocks ${format(state.insulation * 100, 0)} percent of bare loss; remaining loss ${format(values.remainingAmbientLoss, 1)} watts`);
    root.querySelector("#p124-loss")?.setAttribute("aria-valuetext", `Bare loss ${format(state.bareLossW, 0)} watts; remaining loss ${format(values.remainingAmbientLoss, 1)} watts`);
    root.querySelector("#p124-final")?.setAttribute("aria-valuetext", `Final water temperature ${format(state.finalWaterTemperatureC, 0)} degrees Celsius; total ideal time ${duration(values.totalTime)}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p124-reset") { state = initialState(); renderAndFocus(renderApp, "#p124-mass"); return; }
      if (action === "p124-stage") { state.stage = clamp(Number(control.dataset.p124Stage), 0, 2); renderAndFocus(renderApp, `[data-p124-stage="${state.stage}"]`); return; }
      if (action === "p124-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p124-stage="${state.stage}"]`); return; }
      if (action === "p124-preset") {
        const preset = control.dataset.p124Preset;
        if (preset === "challenge") restoreChallenge();
        if (preset === "reflective") { restoreChallenge(); state.albedo = .8; }
        if (preset === "insulated") { restoreChallenge(); state.insulation = .9; }
        if (preset === "stalled") { restoreChallenge(); state.solarPowerW = 400; state.albedo = .75; state.insulation = 0; state.bareLossW = 100; }
        renderAndFocus(renderApp, "#p124-mass"); return;
      }
      if (action === "p124-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p124-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p124-reveal") window.requestAnimationFrame(() => document.querySelector("#p124-solution-heading")?.focus());
    }));
    [["#p124-mass", "massKg", 1, 50], ["#p124-initial", "initialTemperatureC", -40, 0], ["#p124-solar", "solarPowerW", 200, 2000], ["#p124-albedo", "albedo", 0, .9], ["#p124-insulation", "insulation", 0, .95], ["#p124-loss", "bareLossW", 0, 1000], ["#p124-final", "finalWaterTemperatureC", 5, 40]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const input = document.querySelector("#p124-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p124-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = challengeValues.timeToFullyMelt / 3600; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one melting time in hours.";
      else if (Math.abs(answer - challengeValues.timeToFullyMelt) < 2) state.feedback = "That numerical value is seconds. Divide by 3600 for hours.";
      else if (Math.abs(answer - target) > .003) state.feedback = "Find net power, add sensible ice energy to latent melting energy, then divide by net power.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.feedback = `Correct: Qice+Qmelt=3.760 MJ and t=9400 s=${format(target, 7)} h. Water warming begins only after this point.`; }
      renderAndFocus(renderApp, "#p124-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
