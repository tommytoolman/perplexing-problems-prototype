(function registerBoilingTimePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "9.7";
  const WATER_HEAT_CAPACITY = 4180;
  const WATER_LATENT_HEAT = 2.26e6;
  const BOILING_TEMPERATURE = 100;
  const CHALLENGE = Object.freeze({ mass: 1.5, initialTemperature: 20, efficiency: 0.85, voltage: 230, resistance: 26.45 });
  const stages = Object.freeze([
    Object.freeze({ short: "Electrical", title: "Find the heater input power", copy: "For a resistive heater P=V²/R. A rated-power description is equivalent if its implied resistance is V²/P." }),
    Object.freeze({ short: "Heating", title: "Supply sensible heat to the water", copy: "Reaching the boiling temperature requires Q=mcΔT. Only the fraction η of electrical input power reaches the water in this model." }),
    Object.freeze({ short: "Boiling", title: "Stop at the first boil", copy: "Time to reach 100°C uses sensible heat only. Vaporising water after that point requires additional latent heat while temperature stays approximately constant." }),
  ]);
  const hints = Object.freeze([
    "The heater power is P=V²/R=(230 V)²/(26.45 Ω)=2000 W.",
    "The water needs Q=mcΔT with ΔT=100−20=80 K. A temperature interval in kelvin has the same numerical size as in °C.",
    "Useful heating power is ηP=0.85×2000 W. Therefore t=mcΔT/(ηP). Convert seconds to minutes only at the end.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p97-reset">Reset</button>';

  const initialState = () => ({
    mass: CHALLENGE.mass,
    initialTemperature: CHALLENGE.initialTemperature,
    efficiency: CHALLENGE.efficiency,
    voltage: CHALLENGE.voltage,
    resistance: CHALLENGE.resistance,
    ratedPowerKw: 2,
    electricalMode: "resistance",
    stage: 0,
    answer: "",
    feedback: "",
    feedbackTone: "neutral",
    committed: false,
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function clean(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value).toFixed(digits);
    return Object.is(Number(rounded), -0) ? Number(0).toFixed(digits) : rounded;
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9.\s+-]/g, "").slice(0, 16);
  }

  function kettle(
    mass = state.mass,
    initialTemperature = state.initialTemperature,
    efficiency = state.efficiency,
    voltage = state.voltage,
    resistance = state.resistance,
    ratedPowerKw = state.ratedPowerKw,
    electricalMode = state.electricalMode,
  ) {
    const inputPower = electricalMode === "resistance" ? voltage ** 2 / resistance : ratedPowerKw * 1000;
    const effectiveResistance = voltage ** 2 / inputPower;
    const current = inputPower / voltage;
    const temperatureRise = Math.max(0, BOILING_TEMPERATURE - initialTemperature);
    const sensibleEnergy = mass * WATER_HEAT_CAPACITY * temperatureRise;
    const usefulPower = efficiency * inputPower;
    const timeSeconds = usefulPower > 0 ? sensibleEnergy / usefulPower : Infinity;
    const electricalEnergy = efficiency > 0 ? sensibleEnergy / efficiency : Infinity;
    const environmentalLoss = electricalEnergy - sensibleEnergy;
    const latentEnergyAllWater = mass * WATER_LATENT_HEAT;
    const vapourisationTimeAllWater = usefulPower > 0 ? latentEnergyAllWater / usefulPower : Infinity;
    return {
      inputPower,
      effectiveResistance,
      current,
      temperatureRise,
      sensibleEnergy,
      usefulPower,
      timeSeconds,
      timeMinutes: timeSeconds / 60,
      electricalEnergy,
      environmentalLoss,
      latentEnergyAllWater,
      vapourisationTimeAllWater,
      powerResidual: voltage * current - inputPower,
      energyResidual: usefulPower * timeSeconds - sensibleEnergy,
    };
  }

  const challengeValues = kettle(CHALLENGE.mass, CHALLENGE.initialTemperature, CHALLENGE.efficiency, CHALLENGE.voltage, CHALLENGE.resistance, 2, "resistance");

  function reconstructionNote() {
    return `<p class="p97-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p97-stage-controls" role="group" aria-label="Electric kettle analysis stages">${stages.map((stage,index)=>`<button class="secondary-button ${state.stage===index?"active":""}" type="button" data-problem-action="p97-stage" data-p97-stage="${index}" aria-pressed="${state.stage===index}"><span>${index+1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageHeading() {
    const stage=stages[state.stage];
    return `<div class="p97-stage-heading"><div><div class="eyebrow">Stage ${state.stage+1} of 3</div><h2>${stage.title}</h2></div><p>${stage.copy}</p><button class="ghost-button" type="button" data-problem-action="p97-next-stage" ${state.stage>=2?"disabled":""}>${state.stage>=2?"Boil reached":"Next stage"}</button></div>`;
  }

  function kettleSvg() {
    const values=kettle();
    const waterTop=286-clamp(state.mass/3,0,1)*134;
    const initialY=292-clamp(state.initialTemperature/100,0,1)*200;
    const boilX=390+220*.8;
    const sensibleFraction=values.electricalEnergy>0?values.sensibleEnergy/values.electricalEnergy:0;
    const usefulBar=250*sensibleFraction;
    const lossBar=250-usefulBar;
    return `<svg class="p97-svg p97-stage-${state.stage}" viewBox="0 0 720 430" role="img" aria-labelledby="p97-svg-title p97-svg-desc"><title id="p97-svg-title">Electric kettle heating water to its boiling temperature</title><desc id="p97-svg-desc">The kettle contains ${clean(state.mass,2)} kilograms of water initially at ${clean(state.initialTemperature,1)} degrees Celsius. Heater input is ${clean(values.inputPower/1000,3)} kilowatts and efficiency ${clean(state.efficiency*100,1)} percent. Time to reach 100 degrees Celsius is ${clean(values.timeSeconds,2)} seconds or ${clean(values.timeMinutes,3)} minutes.</desc><defs><linearGradient id="p97-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4eef1"/><stop offset="1" stop-color="#f7efdc"/></linearGradient></defs><rect width="720" height="430" fill="url(#p97-bg)"/>
      <g class="p97-kettle" aria-hidden="true"><path class="p97-body" d="M78 118 H258 L245 305 Q168 334 91 305 Z"/><path class="p97-handle" d="M250 143 Q332 150 294 260 Q278 287 244 267"/><path class="p97-spout" d="M84 150 L40 174 L79 194"/><path class="p97-water" d="M91 ${clean(waterTop)} H245 V302 Q168 326 91 302 Z"/><line class="p97-water-line" x1="91" y1="${clean(waterTop)}" x2="245" y2="${clean(waterTop)}"/><path class="p97-heater" d="M113 282 C128 263 143 301 158 282 S188 301 203 282 S228 301 240 282"/><text x="168" y="355" text-anchor="middle">${clean(state.mass,2)} kg water</text><text x="168" y="373" text-anchor="middle">heater ${clean(values.inputPower/1000,3)} kW</text></g>
      <g class="p97-graph" aria-hidden="true"><rect x="354" y="57" width="326" height="261" rx="14"/><text class="p97-graph-title" x="373" y="80">WATER TEMPERATURE</text><line class="p97-axis" x1="390" y1="292" x2="650" y2="292"/><line class="p97-axis" x1="390" y1="92" x2="390" y2="292"/><line class="p97-boil-line" x1="390" y1="92" x2="650" y2="92"/><text x="382" y="96" text-anchor="end">100°C</text><text x="382" y="${clean(initialY+4)}" text-anchor="end">${clean(state.initialTemperature,0)}°C</text><path class="p97-heating-line" d="M390 ${clean(initialY)} L${clean(boilX)} 92"/><path class="p97-latent-line" d="M${clean(boilX)} 92 H650"/><circle class="p97-boil-point" cx="${clean(boilX)}" cy="92" r="7"/><text x="${clean(boilX)}" y="312" text-anchor="middle">${clean(values.timeMinutes,2)} min</text><text class="p97-latent-label" x="636" y="113" text-anchor="end">boiling: latent heat, T≈constant</text></g>
      <g class="p97-electrical-layer" aria-hidden="true"><rect x="360" y="333" width="312" height="72" rx="13"/><text class="p97-panel-kicker" x="378" y="355">ELECTRICAL INPUT</text><text class="p97-panel-value" x="378" y="378">P=${state.electricalMode==="resistance"?"V²/R":"rated"}=${clean(values.inputPower,1)} W</text><text class="p97-panel-note" x="378" y="397">V=${clean(state.voltage,1)} V · R=${clean(values.effectiveResistance,3)} Ω · I=${clean(values.current,3)} A</text></g>
      <g class="p97-heat-layer" aria-hidden="true"><rect x="360" y="333" width="312" height="72" rx="13"/><text class="p97-panel-kicker" x="378" y="355">SENSIBLE HEATING</text><text class="p97-panel-value" x="378" y="378">Q=mcΔT=${clean(values.sensibleEnergy/1000,2)} kJ</text><text class="p97-panel-note" x="378" y="397">ΔT=${clean(values.temperatureRise,1)} K · useful power ηP=${clean(values.usefulPower,1)} W</text></g>
      <g class="p97-time-layer" aria-hidden="true"><rect x="360" y="333" width="312" height="72" rx="13"/><text class="p97-panel-kicker" x="378" y="355">ENERGY DESTINATION</text><rect class="p97-useful-bar" x="378" y="368" width="${clean(usefulBar)}" height="13" rx="6"/><rect class="p97-loss-bar" x="${clean(378+usefulBar)}" y="368" width="${clean(lossBar)}" height="13" rx="6"/><text class="p97-panel-note" x="378" y="398">to water ${clean(values.sensibleEnergy/1000,1)} kJ · lost ${clean(values.environmentalLoss/1000,1)} kJ</text></g>
    </svg>`;
  }

  function metricsMarkup(){const v=kettle();return `<section class="p97-metrics" aria-label="Kettle power and energy values"><div><span>Heater input power</span><strong>${clean(v.inputPower/1000,4)} kW</strong></div><div><span>Heater current</span><strong>${clean(v.current,3)} A</strong></div><div><span>Temperature rise</span><strong>${clean(v.temperatureRise,2)} K</strong></div><div><span>Sensible heat needed</span><strong>${clean(v.sensibleEnergy/1000,3)} kJ</strong></div><div><span>Time to first boil</span><strong>${clean(v.timeMinutes,4)} min</strong></div><div><span>Full-vaporisation energy</span><strong>${clean(v.latentEnergyAllWater/1e6,3)} MJ</strong></div><p>Electrical power residual: ${v.powerResidual.toExponential(1)} W. Heating-energy residual: ${v.energyResidual.toExponential(1)} J. Latent heat is displayed but is not included in the time to reach 100°C.</p></section>`;}
  function dynamicMarkup(){return `<div class="p97-dynamic">${kettleSvg()}${metricsMarkup()}</div>`;}
  function controlsMarkup(){const values=kettle();return `<section class="p97-controls" aria-label="Electric kettle controls"><div class="p97-mode-picker" role="group" aria-label="Electrical specification mode"><button class="chip-button ${state.electricalMode==="resistance"?"active":""}" type="button" data-problem-action="p97-mode" data-p97-mode="resistance" aria-pressed="${state.electricalMode==="resistance"}">Use V and R</button><button class="chip-button ${state.electricalMode==="power"?"active":""}" type="button" data-problem-action="p97-mode" data-p97-mode="power" aria-pressed="${state.electricalMode==="power"}">Use rated power</button></div><div class="p97-control-grid"><label for="p97-mass"><span>Water mass m<output data-p97-live="mass">${clean(state.mass,2)} kg</output></span><input id="p97-mass" type="range" min="0.25" max="3" step="0.05" value="${state.mass}"/></label><label for="p97-temperature"><span>Initial temperature Ti<output data-p97-live="temperature">${clean(state.initialTemperature,0)}°C</output></span><input id="p97-temperature" type="range" min="0" max="99" step="1" value="${state.initialTemperature}"/></label><label for="p97-efficiency"><span>Heating efficiency η<output data-p97-live="efficiency">${clean(state.efficiency*100,0)}%</output></span><input id="p97-efficiency" type="range" min="0.3" max="1" step="0.01" value="${state.efficiency}"/></label><label for="p97-voltage"><span>Supply voltage V<output data-p97-live="voltage">${clean(state.voltage,0)} V</output></span><input id="p97-voltage" type="range" min="100" max="250" step="1" value="${state.voltage}"/></label><label for="p97-resistance"><span>${state.electricalMode==="resistance"?"Heater resistance R":"Derived resistance R"}<output data-p97-live="resistance">${clean(values.effectiveResistance,2)} Ω</output></span><input id="p97-resistance" type="range" min="5" max="80" step="0.05" value="${state.electricalMode==="resistance"?state.resistance:values.effectiveResistance}" ${state.electricalMode==="power"?"disabled":""}/></label><label for="p97-power"><span>${state.electricalMode==="power"?"Rated heater power":"Derived heater power"}<output data-p97-live="power">${clean(values.inputPower/1000,3)} kW</output></span><input id="p97-power" type="range" min="0.2" max="3.5" step="0.05" value="${state.electricalMode==="power"?state.ratedPowerKw:values.inputPower/1000}" ${state.electricalMode==="resistance"?"disabled":""}/></label></div><div class="p97-presets" role="group" aria-label="Kettle cases"><button class="chip-button" type="button" data-problem-action="p97-preset" data-p97-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p97-preset" data-p97-preset="ideal">Ideal η=100%</button><button class="chip-button" type="button" data-problem-action="p97-preset" data-p97-preset="mug">One mug</button><button class="chip-button" type="button" data-problem-action="p97-preset" data-p97-preset="warm">Warm start</button></div></section>`;}

  function feedbackMarkup(){return state.feedback?`<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p97-hints">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function solutionMarkup(){if(!state.revealed)return"";return `<section class="p97-solution" aria-labelledby="p97-solution-heading"><h3 id="p97-solution-heading" tabindex="-1">Electrical power becomes sensible heat</h3><p>The 230 V heater with R=26.45 Ω draws</p><div class="p97-equation">P=V²/R=230²/26.45=2000 W</div><p>The water’s temperature rise is 100−20=80 K, so the required sensible heat is</p><div class="p97-equation">Q=mcΔT=(1.50)(4180)(80)=501,600 J</div><p>Only 85% of the electrical power heats the water:</p><div class="p97-equation">t=Q/(ηP)=501,600/(0.85×2000)<br>t=${clean(challengeValues.timeSeconds,6)} s=${clean(challengeValues.timeMinutes,6)} min</div><p>No latent heat appears because the clock stops when the water first reaches 100°C. Vaporising all 1.50 kg after that would require an additional mLv=3.39 MJ in this model.</p><p class="p97-limits"><strong>Checks.</strong> At Ti=100°C or m→0, the sensible-heating time tends to zero. At η=1 the ideal time is shortest; η must satisfy 0&lt;η≤1, and time diverges as η→0. At fixed resistance, P=V²/R so doubling V quarters the time. At fixed voltage, increasing R lowers power and lengthens time. The ratio V²/R has units watts; mcΔT has units joules; J/W gives seconds. Real boiling temperature varies with pressure, and kettle heat capacity plus changing losses are omitted.</p></section>`;}
  function snapshot(){const v=kettle();return JSON.stringify({problem:PROBLEM,reconstruction:true,waterSpecificHeatJoulesPerKilogramKelvin:WATER_HEAT_CAPACITY,waterLatentHeatJoulesPerKilogram:WATER_LATENT_HEAT,boilingTemperatureCelsius:BOILING_TEMPERATURE,waterMassKilograms:state.mass,initialTemperatureCelsius:state.initialTemperature,efficiency:state.efficiency,electricalMode:state.electricalMode,supplyVoltageVolts:state.voltage,effectiveResistanceOhms:Number(v.effectiveResistance.toFixed(8)),heaterInputPowerWatts:Number(v.inputPower.toFixed(8)),heaterCurrentAmperes:Number(v.current.toFixed(8)),sensibleEnergyJoules:Number(v.sensibleEnergy.toFixed(8)),timeToBoilSeconds:Number(v.timeSeconds.toFixed(8)),timeToBoilMinutes:Number(v.timeMinutes.toFixed(8)),latentEnergyToVaporiseAllJoules:Number(v.latentEnergyAllWater.toFixed(8)),powerResidualWatts:v.powerResidual,energyResidualJoules:v.energyResidual,stage:state.stage+1,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p97-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive electrical heating</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p97-spread"><article class="book-page p97-problem-page"><div class="problem-number">Problem 9.7</div><h1 class="book-title p97-title">Boiling time</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">An electric kettle contains 1.50 kg of water initially at 20°C. Its 230 V heating element has resistance 26.45 Ω, and 85% of its electrical input reaches the water.</p><p class="problem-copy">Using c=4180 J kg⁻¹ K⁻¹, find the time for the water first to reach 100°C.</p><section class="p97-meaning-card"><strong>What “boiling time” means here</strong><p>The calculation stops when liquid water reaches its boiling temperature. Energy used to form steam after that point is latent heat and is a separate process.</p></section><section class="p97-model-card"><div class="eyebrow">Model</div><p>Constant heater resistance and efficiency, uniform water temperature, standard-pressure boiling point, and no kettle heat capacity beyond the stated efficiency.</p></section></article><section class="book-page book-stage p97-stage">${stageControls()}${stageHeading()}${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p97-coach"><div class="coach-kicker">Time the first boil</div><p class="coach-question">How many minutes does the stated kettle take to bring the water to 100°C?</p><form class="p97-answer-form" data-p97-answer-form novalidate><label for="p97-answer">Time to reach boiling temperature</label><div><input id="p97-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="time in minutes" autocomplete="off"/><span>min</span></div><button class="primary-button" type="submit">Check boiling time</button></form>${feedbackMarkup()}<div class="button-row p97-help-row"><button class="secondary-button" type="button" data-problem-action="p97-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p97-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p97-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(){const root=document.querySelector(".p97-shell");if(!root)return;const dynamic=root.querySelector(".p97-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();const v=kettle(),values={mass:`${clean(state.mass,2)} kg`,temperature:`${clean(state.initialTemperature,0)}°C`,efficiency:`${clean(state.efficiency*100,0)}%`,voltage:`${clean(state.voltage,0)} V`,resistance:`${clean(v.effectiveResistance,2)} Ω`,power:`${clean(v.inputPower/1000,3)} kW`};Object.entries(values).forEach(([key,value])=>root.querySelectorAll(`[data-p97-live="${key}"]`).forEach(node=>{node.textContent=value;}));root.querySelector("#p97-mass")?.setAttribute("aria-valuetext",`Water mass ${clean(state.mass,2)} kilograms; boil time ${clean(v.timeMinutes,2)} minutes`);root.querySelector("#p97-temperature")?.setAttribute("aria-valuetext",`Initial temperature ${clean(state.initialTemperature,0)} degrees Celsius; rise ${clean(v.temperatureRise,0)} kelvin`);root.querySelector("#p97-efficiency")?.setAttribute("aria-valuetext",`Efficiency ${clean(state.efficiency*100,0)} percent; useful power ${clean(v.usefulPower,0)} watts`);root.querySelector("#p97-voltage")?.setAttribute("aria-valuetext",`Voltage ${clean(state.voltage,0)} volts; heater power ${clean(v.inputPower,0)} watts`);root.querySelector("#p97-resistance")?.setAttribute("aria-valuetext",`Resistance ${clean(v.effectiveResistance,2)} ohms`);root.querySelector("#p97-power")?.setAttribute("aria-valuetext",`Rated power ${clean(v.inputPower/1000,3)} kilowatts`);}
  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}){document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p97-reset"){state=initialState();renderAndFocus(renderApp,"#p97-mass");return;}if(action==="p97-stage"){state.stage=clamp(Number(control.dataset.p97Stage),0,2);renderAndFocus(renderApp,`[data-p97-stage="${state.stage}"]`);return;}if(action==="p97-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p97-stage="${state.stage}"]`);return;}if(action==="p97-mode"){const current=kettle();state.electricalMode=control.dataset.p97Mode;if(state.electricalMode==="power")state.ratedPowerKw=current.inputPower/1000;else state.resistance=current.effectiveResistance;renderAndFocus(renderApp,state.electricalMode==="power"?"#p97-power":"#p97-resistance");return;}if(action==="p97-preset"){const preset=control.dataset.p97Preset;if(preset==="challenge"){state.mass=1.5;state.initialTemperature=20;state.efficiency=.85;state.voltage=230;state.resistance=26.45;state.electricalMode="resistance";}if(preset==="ideal")state.efficiency=1;if(preset==="mug")state.mass=.3;if(preset==="warm")state.initialTemperature=80;renderAndFocus(renderApp,"#p97-mass");return;}if(action==="p97-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p97-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p97-reveal")window.requestAnimationFrame(()=>document.querySelector("#p97-solution-heading")?.focus());}));[["#p97-mass","mass",.25,3],["#p97-temperature","initialTemperature",0,99],["#p97-efficiency","efficiency",.3,1],["#p97-voltage","voltage",100,250],["#p97-resistance","resistance",5,80],["#p97-power","ratedPowerKw",.2,3.5]].forEach(([selector,key,min,max])=>document.querySelector(selector)?.addEventListener("input",event=>{state[key]=clamp(Number(event.target.value),min,max);updateDynamicDom();}));const input=document.querySelector("#p97-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p97-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer),target=challengeValues.timeMinutes;state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one time in minutes.";else if(Math.abs(answer-challengeValues.timeSeconds)<.1)state.feedback="That numerical value is seconds, but the answer box asks for minutes. Divide by 60.";else if(Math.abs(answer-target)>.005)state.feedback="Find P=V²/R, then use t=mc(100−Ti)/(ηP). Latent heat is not needed to reach the first boil.";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: t=${clean(challengeValues.timeSeconds,3)} s=${clean(target,6)} min. The heater input is exactly 2.000 kW.`;}renderAndFocus(renderApp,"#p97-answer");});}
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
