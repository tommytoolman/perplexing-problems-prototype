(function registerHeatedPlatePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "12.1";
  const INITIAL_TEMPERATURE = 20;
  const QUESTION = Object.freeze({ mass: 2, heatCapacity: 900, power: 300, temperatureRise: 50 });
  const materials = Object.freeze([
    Object.freeze({ label: "Aluminium", heatCapacity: 900 }),
    Object.freeze({ label: "Steel", heatCapacity: 500 }),
    Object.freeze({ label: "Copper", heatCapacity: 385 }),
    Object.freeze({ label: "Glass", heatCapacity: 840 }),
  ]);
  const hints = Object.freeze([
    "The plate needs thermal energy Q=mcΔT.",
    "Use the temperature change 70−20=50 K. A kelvin interval and a Celsius-degree interval have the same numerical size.",
    "The heater transfers energy at P joules per second, so t=Q/P.",
    "Here Q=(2.00)(900)(50)=90,000 J.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p121-reset">Reset</button>';

  const initialState = () => ({
    mass: QUESTION.mass,
    heatCapacity: QUESTION.heatCapacity,
    power: QUESTION.power,
    temperatureRise: QUESTION.temperatureRise,
    progressPercent: 0,
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

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "∞";
    const rounded = Number(value.toFixed(digits));
    return Object.is(rounded, -0) ? "0" : String(rounded);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function thermalValues(
    mass = state.mass,
    heatCapacity = state.heatCapacity,
    power = state.power,
    temperatureRise = state.temperatureRise,
    progressPercent = state.progressPercent,
  ) {
    const requiredEnergy = mass * heatCapacity * temperatureRise;
    const heatingTime = requiredEnergy / power;
    const progress = clamp(progressPercent, 0, 100) / 100;
    const suppliedEnergy = requiredEnergy * progress;
    return {
      requiredEnergy,
      heatingTime,
      heatingRate: power / (mass * heatCapacity),
      progress,
      currentTime: heatingTime * progress,
      suppliedEnergy,
      remainingEnergy: requiredEnergy - suppliedEnergy,
      currentTemperature: INITIAL_TEMPERATURE + temperatureRise * progress,
      targetTemperature: INITIAL_TEMPERATURE + temperatureRise,
      energyResidual: suppliedEnergy + (requiredEnergy - suppliedEnergy) - requiredEnergy,
    };
  }

  function activeMaterialIndex() {
    return materials.findIndex((material) => Math.abs(material.heatCapacity - state.heatCapacity) < 1e-9);
  }

  function graphGeometry() {
    const values = thermalValues();
    const xStart = 397;
    const xEnd = 697;
    const yTop = 62;
    const yBottom = 329;
    const targetX = xStart + (xEnd - xStart) / 1.15;
    const targetY = yTop + 28;
    const currentX = xStart + (targetX - xStart) * values.progress;
    const currentY = yBottom - (yBottom - targetY) * values.progress;
    return {
      values,
      xStart,
      xEnd,
      yTop,
      yBottom,
      targetX,
      targetY,
      currentX,
      currentY,
      path: `M${xStart},${yBottom} L${format(targetX, 2)},${targetY} L${xEnd},${targetY}`,
    };
  }

  function energyDots(progress) {
    const dots = [];
    for (let index = 0; index < 24; index += 1) {
      const column = index % 6;
      const row = Math.floor(index / 6);
      dots.push(`<circle class="p121-energy-dot ${index / 24 < progress ? "is-delivered" : ""}" cx="${123 + column * 28}" cy="${153 + row * 28}" r="6" />`);
    }
    return dots.join("");
  }

  function apparatusMarkup() {
    const graph = graphGeometry();
    const values = graph.values;
    return `
      <div class="p121-apparatus-wrap">
        <svg class="p121-apparatus" viewBox="0 0 730 405" role="img" aria-labelledby="p121-apparatus-title p121-apparatus-desc">
          <title id="p121-apparatus-title">Uniformly heated plate and its no-loss temperature-time graph</title>
          <desc id="p121-apparatus-desc">A ${format(state.mass, 2)} kilogram plate with specific heat capacity ${format(state.heatCapacity, 0)} joules per kilogram kelvin is heated at ${format(state.power, 0)} watts through a target rise of ${format(state.temperatureRise, 0)} kelvin. It requires ${format(values.requiredEnergy, 1)} joules and ${format(values.heatingTime, 2)} seconds. At ${format(state.progressPercent, 0)} percent progress its uniform temperature is ${format(values.currentTemperature, 2)} degrees Celsius.</desc>
          <defs>
            <linearGradient id="p121-plate-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7da8bb" /><stop offset="1" stop-color="#dc795f" /></linearGradient>
            <marker id="p121-arrow-heat" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <line class="p121-divider" x1="365" y1="28" x2="365" y2="374" />
          <text class="p121-panel-title" x="24" y="31">LUMPED PLATE · NO HEAT LOSS</text>
          <rect class="p121-plate" x="88" y="116" width="202" height="154" rx="17" style="--p121-progress:${format(values.progress, 3)}" />
          ${energyDots(values.progress)}
          <rect class="p121-heater" x="112" y="289" width="154" height="27" rx="8" />
          <path class="p121-heater-coil" d="M125 302h14l7-8 14 16 14-16 14 16 14-16 14 16 7-8h14" />
          <line class="p121-heat-arrow" x1="189" y1="286" x2="189" y2="252" marker-end="url(#p121-arrow-heat)" />
          <text class="p121-heater-label" x="189" y="338" text-anchor="middle">P=${format(state.power, 0)} W = ${format(state.power, 0)} J/s</text>
          <g class="p121-thermometer" transform="translate(319 123)"><rect x="0" y="0" width="15" height="124" rx="7" /><rect class="p121-thermometer-fill" x="4" y="${format(116 - 102 * values.progress, 2)}" width="7" height="${format(7 + 102 * values.progress, 2)}" rx="3" /><circle cx="7.5" cy="122" r="13" /><text x="-9" y="151" text-anchor="middle">${format(values.currentTemperature, 1)}°C</text></g>
          <text class="p121-plate-label" x="189" y="94" text-anchor="middle">uniform T · ${format(state.mass, 2)} kg · c=${format(state.heatCapacity, 0)} J/(kg·K)</text>

          <g class="p121-graph">
            <text class="p121-panel-title" x="390" y="31">TEMPERATURE–TIME GRAPH</text>
            <line class="p121-axis" x1="${graph.xStart}" y1="${graph.yBottom}" x2="${graph.xEnd}" y2="${graph.yBottom}" /><line class="p121-axis" x1="${graph.xStart}" y1="${graph.yTop}" x2="${graph.xStart}" y2="${graph.yBottom}" />
            <path class="p121-temperature-line" d="${graph.path}" />
            <line class="p121-target-line" x1="${format(graph.targetX, 2)}" y1="${graph.targetY}" x2="${format(graph.targetX, 2)}" y2="${graph.yBottom}" />
            <line class="p121-cursor" x1="${format(graph.currentX, 2)}" y1="${graph.currentY}" x2="${format(graph.currentX, 2)}" y2="${graph.yBottom}" />
            <circle class="p121-current-point" cx="${format(graph.currentX, 2)}" cy="${format(graph.currentY, 2)}" r="7" />
            <text class="p121-axis-label" x="${graph.xStart}" y="${graph.yBottom + 22}">0 s</text><text class="p121-axis-label" x="${format(graph.targetX, 2)}" y="${graph.yBottom + 22}" text-anchor="middle">${format(values.heatingTime, 2)} s</text>
            <text class="p121-axis-label" x="${graph.xStart - 8}" y="${graph.yBottom + 3}" text-anchor="end">${INITIAL_TEMPERATURE}°C</text><text class="p121-axis-label" x="${graph.xStart - 8}" y="${graph.targetY + 3}" text-anchor="end">${format(values.targetTemperature, 1)}°C</text>
            <text class="p121-rate-label" x="535" y="172" transform="rotate(-39 535 172)" text-anchor="middle">slope P/(mc)=${format(values.heatingRate, 5)} K/s</text>
            <text class="p121-current-label" x="${format(graph.currentX + 10, 2)}" y="${format(graph.currentY - 12, 2)}">t=${format(values.currentTime, 2)} s · T=${format(values.currentTemperature, 2)}°C</text>
            <text class="p121-switch-label" x="${format(graph.targetX + 6, 2)}" y="${graph.targetY - 10}">target reached · heater off</text>
          </g>
        </svg>
        <div class="p121-status-strip"><strong>Q=mcΔT=${format(values.requiredEnergy, 1)} J</strong><span>Delivered ${format(values.suppliedEnergy, 1)} J · remaining ${format(values.remainingEnergy, 1)} J</span></div>
      </div>`;
  }

  function metricsMarkup() {
    const values = thermalValues();
    return `
      <div class="p121-metrics" aria-live="polite">
        <div><span>Required energy</span><strong>${format(values.requiredEnergy, 1)} J</strong><small>mcΔT</small></div>
        <div><span>Heating rate</span><strong>${format(values.heatingRate, 6)} K/s</strong><small>P/(mc)</small></div>
        <div><span>Target time</span><strong>${format(values.heatingTime, 3)} s</strong><small>Q/P</small></div>
        <div><span>Current state</span><strong>${format(values.currentTemperature, 2)}°C</strong><small>${format(values.currentTime, 2)} s</small></div>
      </div>`;
  }

  function dynamicMarkup() {
    return `<div class="p121-dynamic">${apparatusMarkup()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    const activeMaterial = activeMaterialIndex();
    return `
      <section class="p121-controls" aria-label="Heated plate controls">
        <div class="p121-material-picker" role="group" aria-label="Choose plate material">${materials.map((material,index)=>`<button class="secondary-button ${activeMaterial===index?"active":""}" type="button" data-problem-action="p121-material" data-p121-material="${index}" aria-pressed="${activeMaterial===index}">${material.label}<small>${material.heatCapacity} J/(kg·K)</small></button>`).join("")}</div>
        <div class="p121-control-grid">
          <label for="p121-mass"><span>Plate mass m<output data-p121-live="mass">${format(state.mass, 2)} kg</output></span><input id="p121-mass" data-p121-slider="mass" type="range" min="0.25" max="5" step="0.25" value="${state.mass}" /></label>
          <label for="p121-capacity"><span>Specific heat capacity c<output data-p121-live="capacity">${format(state.heatCapacity, 0)} J/(kg·K)</output></span><input id="p121-capacity" data-p121-slider="capacity" type="range" min="200" max="1200" step="5" value="${state.heatCapacity}" /></label>
          <label for="p121-power"><span>Heater power P<output data-p121-live="power">${format(state.power, 0)} W</output></span><input id="p121-power" data-p121-slider="power" type="range" min="25" max="1000" step="25" value="${state.power}" /></label>
          <label for="p121-rise"><span>Temperature rise ΔT<output data-p121-live="rise">${format(state.temperatureRise, 0)} K</output></span><input id="p121-rise" data-p121-slider="rise" type="range" min="5" max="150" step="5" value="${state.temperatureRise}" /></label>
          <label class="p121-progress-control" for="p121-progress"><span>Heating progress<output data-p121-live="progress">${format(state.progressPercent, 0)}%</output></span><input id="p121-progress" data-p121-slider="progress" type="range" min="0" max="100" step="1" value="${state.progressPercent}" /></label>
        </div>
      </section>`;
  }

  function feedbackMarkup(){return state.feedback?`<div class="p121-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p121-hints" aria-live="polite">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function solutionMarkup(){if(!state.revealed)return"";return `<section class="p121-solution" aria-labelledby="p121-solution-heading"><h3 id="p121-solution-heading" tabindex="-1">Power tells us how quickly the energy arrives</h3><p>The plate’s required temperature change is ΔT=70−20=50 K. With constant specific heat capacity,</p><div class="p121-equation">Q=mcΔT=(2.00 kg)(900 J kg⁻¹ K⁻¹)(50 K)=90,000 J</div><p>A 300 W heater supplies 300 J every second:</p><div class="p121-equation is-answer">t=Q/P=90,000 J/(300 J/s)=300 s=5.00 min</div><p class="p121-limits"><strong>Checks and idealisation.</strong> The plate has one uniform temperature at every instant; c and heater power are constant; all heater energy enters the plate; the heater’s own heat capacity, convection, radiation, conduction to supports and phase changes are omitted. Thus mc(dT/dt)=P and the graph is linear. Doubling m, c or ΔT doubles Q and t. Doubling P halves t. As P→0, heating time diverges. If ΔT→0, Q and t tend to zero. One watt is one joule per second, and a temperature interval of 1 K equals an interval of 1°C.</p></section>`;}

  function parseSeconds(raw){const normalized=String(raw).trim().toLowerCase().replaceAll(",", ".");if(!normalized)return NaN;if(/ms$/.test(normalized))return Number(normalized.replace(/\s*ms$/, ""))/1000;if(/min(?:utes?)?$/.test(normalized))return Number(normalized.replace(/\s*min(?:utes?)?$/, ""))*60;if(/s(?:ec(?:onds?)?)?$/.test(normalized))return Number(normalized.replace(/\s*s(?:ec(?:onds?)?)?$/, ""));return Number(normalized);}
  function snapshot(){const values=thermalValues();return JSON.stringify({problem:PROBLEM,provenance:"independently reconstructed from title and difficulty only",model:"uniform lumped plate; constant c and P; no losses",initialTemperatureCelsius:INITIAL_TEMPERATURE,massKilograms:state.mass,specificHeatCapacityJoulesPerKilogramKelvin:state.heatCapacity,heaterPowerWatts:state.power,targetTemperatureRiseKelvin:state.temperatureRise,requiredEnergyJoules:Number(values.requiredEnergy.toFixed(9)),heatingRateKelvinPerSecond:Number(values.heatingRate.toFixed(12)),targetHeatingTimeSeconds:Number(values.heatingTime.toFixed(9)),progressPercent:state.progressPercent,currentTimeSeconds:Number(values.currentTime.toFixed(9)),currentTemperatureCelsius:Number(values.currentTemperature.toFixed(9)),suppliedEnergyJoules:Number(values.suppliedEnergy.toFixed(9)),remainingEnergyJoules:Number(values.remainingEnergy.toFixed(9)),energyLedgerResidualJoules:Number(values.energyResidual.toFixed(12)),questionAnswerSeconds:300,answer:state.answer||null,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p121-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive thermal energy</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p121-spread"><article class="book-page p121-problem-page"><div class="problem-number">Problem 12.1</div><h1 class="book-title p121-title">The heated plate</h1><div class="difficulty" aria-label="One star difficulty">★</div><p class="p121-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written lumped-heating problem is not the book’s wording or solution.</p><p class="problem-copy">A 2.00 kg aluminium plate has specific heat capacity 900 J/(kg·K). A 300 W heater raises its uniform temperature from 20°C to 70°C with no heat loss.</p><p class="problem-copy">How long does the heating take?</p><section class="p121-model-card"><strong>No-loss lumped model</strong><p>The entire plate shares one temperature; c and P are constant; every joule from the heater enters the plate.</p></section><section class="prediction-box"><div class="eyebrow">Energy first, time second</div><p>Find how many joules the plate needs, then use watts as joules per second.</p></section></article><section class="book-page book-stage p121-stage" aria-labelledby="p121-stage-title"><div class="p121-stage-heading"><div><span class="eyebrow">Thermal-energy laboratory</span><h2 id="p121-stage-title">Fill the plate’s energy ledger</h2></div><p>Choose a material or set c directly, then vary mass, heater power and temperature rise. Scrub the ideal heating path.</p></div>${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p121-coach"><div class="coach-kicker">Time the heater</div><p class="coach-question">For the stated aluminium plate, what time is required to rise by 50 K?</p><form class="p121-answer-form" data-p121-answer-form novalidate><label for="p121-answer">Heating time</label><div><input id="p121-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="time"/><span>s</span><button class="primary-button" type="submit">Check</button></div></form>${feedbackMarkup()}<div class="button-row p121-help-row"><button class="secondary-button" type="button" data-problem-action="p121-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p121-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p121-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(root){const dynamic=root.querySelector(".p121-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();const outputs={mass:`${format(state.mass,2)} kg`,capacity:`${format(state.heatCapacity,0)} J/(kg·K)`,power:`${format(state.power,0)} W`,rise:`${format(state.temperatureRise,0)} K`,progress:`${format(state.progressPercent,0)}%`};Object.entries(outputs).forEach(([key,value])=>root.querySelectorAll(`[data-p121-live="${key}"]`).forEach((node)=>{node.textContent=value;}));const values=thermalValues();root.querySelector("#p121-mass")?.setAttribute("aria-valuetext",`Plate mass ${format(state.mass,2)} kilograms; target time ${format(values.heatingTime,2)} seconds`);root.querySelector("#p121-capacity")?.setAttribute("aria-valuetext",`Specific heat capacity ${format(state.heatCapacity,0)} joules per kilogram kelvin; target time ${format(values.heatingTime,2)} seconds`);root.querySelector("#p121-power")?.setAttribute("aria-valuetext",`Heater power ${format(state.power,0)} watts; heating rate ${format(values.heatingRate,4)} kelvin per second`);root.querySelector("#p121-rise")?.setAttribute("aria-valuetext",`Temperature rise ${format(state.temperatureRise,0)} kelvin; required energy ${format(values.requiredEnergy,0)} joules`);root.querySelector("#p121-progress")?.setAttribute("aria-valuetext",`Heating progress ${format(state.progressPercent,0)} percent; temperature ${format(values.currentTemperature,1)} degrees Celsius`);root.querySelectorAll(".state-surface").forEach((surface)=>{surface.textContent=snapshot();});const active=activeMaterialIndex();root.querySelectorAll('[data-problem-action="p121-material"]').forEach((button)=>{const selected=Number(button.dataset.p121Material)===active;button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected));});}
  function renderAndFocus(rerender,selector){rerender();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:rerender}){const root=document.querySelector(".p121-shell");if(!root)return;root.querySelectorAll("[data-p121-slider]").forEach((slider)=>slider.addEventListener("input",(event)=>{const kind=event.target.dataset.p121Slider;if(kind==="mass")state.mass=clamp(event.target.value,.25,5);if(kind==="capacity")state.heatCapacity=clamp(event.target.value,200,1200);if(kind==="power")state.power=clamp(event.target.value,25,1000);if(kind==="rise")state.temperatureRise=clamp(event.target.value,5,150);if(kind==="progress")state.progressPercent=clamp(event.target.value,0,100);state.feedback="";state.committed=false;updateDynamicDom(root);}));root.querySelectorAll("[data-problem-action]").forEach((control)=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p121-reset"){state=initialState();renderAndFocus(rerender,"#p121-mass");return;}if(action==="p121-material"){const material=materials[Number(control.dataset.p121Material)];if(material){state.heatCapacity=material.heatCapacity;state.feedback="";state.committed=false;}renderAndFocus(rerender,"#p121-capacity");return;}if(action==="p121-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p121-reveal")state.revealed=true;rerender();if(action==="p121-reveal")window.requestAnimationFrame(()=>document.querySelector("#p121-solution-heading")?.focus());}));root.querySelector("#p121-answer")?.addEventListener("input",(event)=>{state.answer=event.target.value;state.feedback="";state.feedbackTone="neutral";});root.querySelector("[data-p121-answer-form]")?.addEventListener("submit",(event)=>{event.preventDefault();const raw=event.currentTarget.querySelector("#p121-answer")?.value||"";const answer=parseSeconds(raw);state.answer=raw.trim();state.committed=false;state.feedbackTone="neutral";if(!Number.isFinite(answer)||answer<0){state.feedback="Enter a non-negative time in seconds or minutes.";state.feedbackTone="warn";}else if(Math.abs(answer-300)<=.5){state.feedback="Correct. The plate needs 90,000 J and the 300 W heater supplies it in 300 s, or 5.00 min.";state.feedbackTone="success";state.committed=true;state={...state,mass:QUESTION.mass,heatCapacity:QUESTION.heatCapacity,power:QUESTION.power,temperatureRise:QUESTION.temperatureRise,progressPercent:100};}else if(Math.abs(answer-5)<=.05){state.feedback="That value is minutes. Include min, or convert 5.00 min to 300 s.";}else if(Math.abs(answer-90000)<=5){state.feedback="That is the required energy in joules, not the time. Divide by 300 J/s.";}else{state.feedback="Calculate Q=mcΔT, then divide that energy by heater power P.";}renderAndFocus(rerender,"#p121-answer");});}

  window.poveyProblemPages[PROBLEM]={render,bind};
})();
