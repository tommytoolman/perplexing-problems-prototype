(function registerProfessorSinclairSyphonPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "7.4";
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ crestHeight: 6, outletDrop: 2, density: 1000, atmosphericKpa: 101.3, vapourKpa: 2.3 });
  const stages = Object.freeze([
    Object.freeze({ short: "Head", title: "Let the outlet drop set the speed", copy: "The large reservoir surface and the outlet are both at atmospheric pressure. Their height difference converts gravitational potential into kinetic energy." }),
    Object.freeze({ short: "Crest pressure", title: "Spend pressure to climb and move", copy: "At the crest the liquid is both higher than the reservoir surface and still moving. Its absolute pressure must fall to balance both terms." }),
    Object.freeze({ short: "Column limit", title: "Compare with vapour pressure", copy: "A continuous liquid column requires the crest pressure to remain above the liquid’s vapour pressure. Otherwise bubbles grow and the ideal syphon breaks." }),
  ]);
  const hints = Object.freeze([
    "Apply Bernoulli from the nearly stationary reservoir surface to the atmospheric outlet. The pressure terms cancel, giving v²/2=gd.",
    "Apply Bernoulli from the surface to the crest: patm/ρ=pc/ρ+v²/2+gh.",
    "Substitute v²=2gd. Then pc=patm−ρg(h+d). Keep every pressure absolute when comparing with vapour pressure.",
    "The intact-column condition pc≥pvap becomes h+d≤(patm−pvap)/(ρg). Gauge pressure alone cannot be compared directly with pvap.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p74-reset">Reset</button>';

  const initialState = () => ({
    crestHeight: CHALLENGE.crestHeight,
    outletDrop: CHALLENGE.outletDrop,
    density: CHALLENGE.density,
    atmosphericKpa: CHALLENGE.atmosphericKpa,
    vapourKpa: CHALLENGE.vapourKpa,
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

  function clean(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value).toFixed(digits);
    return Object.is(Number(rounded), -0) ? Number(0).toFixed(digits) : rounded;
  }

  function signed(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.5 * 10 ** -digits) return Number(0).toFixed(digits);
    return `${value > 0 ? "+" : "−"}${clean(Math.abs(value), digits)}`;
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

  function syphon(
    crestHeight = state.crestHeight,
    outletDrop = state.outletDrop,
    density = state.density,
    atmosphericKpa = state.atmosphericKpa,
    vapourKpa = state.vapourKpa,
  ) {
    const atmosphericPressure = atmosphericKpa * 1000;
    const vapourPressure = vapourKpa * 1000;
    const speed = Math.sqrt(Math.max(0, 2 * GRAVITY * outletDrop));
    const dynamicPressure = 0.5 * density * speed ** 2;
    const crestPressure = atmosphericPressure - density * GRAVITY * crestHeight - dynamicPressure;
    const crestGaugePressure = crestPressure - atmosphericPressure;
    const vapourMargin = crestPressure - vapourPressure;
    const maximumTotalHead = (atmosphericPressure - vapourPressure) / (density * GRAVITY);
    const maximumCrestHeight = maximumTotalHead - outletDrop;
    const tolerance = 25;
    let regime = "flow";
    if (outletDrop <= 1e-10) regime = "no-head";
    else if (vapourMargin < -tolerance) regime = "broken";
    else if (Math.abs(vapourMargin) <= tolerance) regime = "limit";
    return {
      atmosphericPressure,
      vapourPressure,
      speed,
      dynamicPressure,
      crestPressure,
      crestGaugePressure,
      vapourMargin,
      maximumTotalHead,
      maximumCrestHeight,
      regime,
    };
  }

  const challengeValues = syphon(CHALLENGE.crestHeight, CHALLENGE.outletDrop, CHALLENGE.density, CHALLENGE.atmosphericKpa, CHALLENGE.vapourKpa);

  function regimeLabel(values = syphon()) {
    if (values.regime === "no-head") return "No outlet head · no sustained flow";
    if (values.regime === "broken") return "Crest below vapour pressure · column breaks";
    if (values.regime === "limit") return "At the vapour-pressure limit";
    return "Continuous ideal syphon flow";
  }

  function reconstructionNote() {
    return `<p class="p74-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p74-stage-controls" role="group" aria-label="Syphon analysis stages">${stages.map((stage,index)=>`<button class="secondary-button ${state.stage===index?"active":""}" type="button" data-problem-action="p74-stage" data-p74-stage="${index}" aria-pressed="${state.stage===index}"><span>${index+1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageHeading() {
    const stage=stages[state.stage];
    return `<div class="p74-stage-heading"><div><div class="eyebrow">Stage ${state.stage+1} of 3</div><h2>${stage.title}</h2></div><p>${stage.copy}</p><button class="ghost-button" type="button" data-problem-action="p74-next-stage" ${state.stage>=2?"disabled":""}>${state.stage>=2?"Pressure audited":"Next stage"}</button></div>`;
  }

  function syphonSvg() {
    const values=syphon();
    const surfaceY=198;
    const crestY=surfaceY-state.crestHeight/12*128;
    const outletY=surfaceY+state.outletDrop/8*152;
    const pressureTop=69,pressureBottom=337;
    const pressureMaximum=Math.max(110,state.atmosphericKpa+5);
    const pressureY=(kpa)=>pressureBottom-clamp(kpa,0,pressureMaximum)/pressureMaximum*(pressureBottom-pressureTop);
    const crestPressureKpa=values.crestPressure/1000;
    const crestPressureY=pressureY(crestPressureKpa);
    const vapourY=pressureY(state.vapourKpa);
    const atmosphericY=pressureY(state.atmosphericKpa);
    const crestX=365,outletX=540;
    return `<svg class="p74-svg p74-stage-${state.stage} is-${values.regime}" viewBox="0 0 720 430" role="img" aria-labelledby="p74-svg-title p74-svg-desc"><title id="p74-svg-title">Open-reservoir syphon with a raised crest and lower outlet</title><desc id="p74-svg-desc">The crest is ${clean(state.crestHeight,1)} metres above the reservoir surface and outlet ${clean(state.outletDrop,1)} metres below it. Ideal speed is ${clean(values.speed,3)} metres per second. Bernoulli demands crest absolute pressure ${clean(crestPressureKpa,3)} kilopascals, compared with vapour pressure ${clean(state.vapourKpa,3)} kilopascals. ${regimeLabel(values)}.</desc><defs><marker id="p74-flow-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z"/></marker><linearGradient id="p74-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eef0"/><stop offset="1" stop-color="#f6efdc"/></linearGradient></defs><rect width="720" height="430" fill="url(#p74-sky)"/>
      <g class="p74-reservoir" aria-hidden="true"><path d="M35 146V371H279V146 M35 371H279"/><path class="p74-water" d="M41 ${surfaceY}H273V365H41Z"/><line class="p74-surface" x1="41" y1="${surfaceY}" x2="273" y2="${surfaceY}"/><text x="48" y="${surfaceY-12}">large open surface · patm</text><text x="50" y="390">datum z=0 at surface</text></g>
      <g class="p74-pipe" aria-hidden="true"><path class="p74-pipe-outer" d="M215 252 C217 ${clean(crestY)} 290 ${clean(crestY)} ${crestX} ${clean(crestY)} C470 ${clean(crestY)} ${outletX} ${clean(crestY+25)} ${outletX} ${clean(outletY)}"/><path class="p74-pipe-fluid" d="M215 252 C217 ${clean(crestY)} 290 ${clean(crestY)} ${crestX} ${clean(crestY)} C470 ${clean(crestY)} ${outletX} ${clean(crestY+25)} ${outletX} ${clean(outletY)}"/><circle class="p74-crest-point" cx="${crestX}" cy="${clean(crestY)}" r="7"/><circle class="p74-outlet-point" cx="${outletX}" cy="${clean(outletY)}" r="7"/><text x="${crestX}" y="${clean(crestY-18)}" text-anchor="middle">crest · +${clean(state.crestHeight,1)} m</text><text x="${outletX+13}" y="${clean(outletY+4)}">outlet · −${clean(state.outletDrop,1)} m</text><line class="p74-flow-arrow" x1="420" y1="${clean(crestY+2)}" x2="480" y2="${clean(crestY+9)}" marker-end="url(#p74-flow-arrow)"/></g>
      <g class="p74-head-layer" aria-hidden="true"><line class="p74-dimension" x1="298" y1="${clean(crestY)}" x2="298" y2="${surfaceY}"/><text x="289" y="${clean((crestY+surfaceY)/2)}" text-anchor="end">h</text><line class="p74-dimension" x1="572" y1="${surfaceY}" x2="572" y2="${clean(outletY)}"/><text x="582" y="${clean((surfaceY+outletY)/2)}">d</text><rect x="69" y="58" width="205" height="69" rx="13"/><text class="p74-panel-kicker" x="84" y="80">ENERGY FROM SURFACE TO OUTLET</text><text class="p74-panel-value" x="84" y="103">v=√(2gd)=${clean(values.speed,3)} m/s</text><text class="p74-panel-note" x="84" y="120">crest height h does not set v</text></g>
      <g class="p74-pressure-layer" aria-hidden="true"><rect x="593" y="48" width="100" height="314" rx="15"/><text class="p74-gauge-title" x="643" y="68" text-anchor="middle">ABSOLUTE kPa</text><line class="p74-gauge-axis" x1="620" y1="${pressureTop}" x2="620" y2="${pressureBottom}"/><line class="p74-atmospheric-mark" x1="610" y1="${clean(atmosphericY)}" x2="680" y2="${clean(atmosphericY)}"/><text x="628" y="${clean(atmosphericY-5)}">patm ${clean(state.atmosphericKpa,1)}</text><line class="p74-vapour-mark" x1="610" y1="${clean(vapourY)}" x2="680" y2="${clean(vapourY)}"/><text x="628" y="${clean(vapourY-5)}">pvap ${clean(state.vapourKpa,1)}</text><circle class="p74-pressure-point" cx="620" cy="${clean(crestPressureY)}" r="7"/><text class="p74-pressure-label" x="628" y="${clean(crestPressureY+17)}">pc ${clean(crestPressureKpa,2)}</text></g>
      <g class="p74-limit-layer" aria-hidden="true"><rect x="64" y="300" width="391" height="81" rx="14"/><text class="p74-panel-kicker" x="82" y="323">COLUMN INTEGRITY</text><text class="p74-panel-value" x="82" y="347">h+d=${clean(state.crestHeight+state.outletDrop,2)} m · allowed ${clean(values.maximumTotalHead,2)} m</text><text class="p74-panel-note" x="82" y="368">maximum crest for this outlet: ${clean(values.maximumCrestHeight,2)} m</text></g>
      <g class="p74-status" transform="translate(371 208)"><rect width="207" height="61" rx="14"/><text class="p74-status-kicker" x="14" y="22">CURRENT COLUMN</text><text class="p74-status-value" x="14" y="45">${regimeLabel(values)}</text></g>
    </svg>`;
  }

  function metricsMarkup(){const v=syphon();return `<section class="p74-metrics is-${v.regime}" aria-label="Syphon energy and pressure values"><div><span>Ideal outlet speed</span><strong>${clean(v.speed,3)} m/s</strong></div><div><span>Dynamic pressure ½ρv²</span><strong>${clean(v.dynamicPressure/1000,3)} kPa</strong></div><div><span>Crest absolute pressure</span><strong>${clean(v.crestPressure/1000,3)} kPa abs</strong></div><div><span>Crest gauge pressure</span><strong>${signed(v.crestGaugePressure/1000,3)} kPa gauge</strong></div><div><span>Margin above vapour</span><strong>${signed(v.vapourMargin/1000,3)} kPa</strong></div><div><span>Maximum crest h</span><strong>${clean(v.maximumCrestHeight,3)} m</strong></div><p><strong>${regimeLabel(v)}.</strong> The outlet is at 0 kPa gauge and ${clean(state.atmosphericKpa,1)} kPa absolute. Vapour comparison always uses absolute pressure.</p></section>`;}
  function dynamicMarkup(){return `<div class="p74-dynamic">${syphonSvg()}${metricsMarkup()}</div>`;}
  function controlsMarkup(){return `<section class="p74-controls" aria-label="Syphon controls"><div class="p74-control-grid"><label for="p74-crest"><span>Crest height h<output data-p74-live="crest">${clean(state.crestHeight,1)} m</output></span><input id="p74-crest" type="range" min="0" max="12" step="0.1" value="${state.crestHeight}"/></label><label for="p74-drop"><span>Outlet drop d<output data-p74-live="drop">${clean(state.outletDrop,1)} m</output></span><input id="p74-drop" type="range" min="0" max="8" step="0.1" value="${state.outletDrop}"/></label><label for="p74-density"><span>Fluid density ρ<output data-p74-live="density">${clean(state.density,0)} kg/m³</output></span><input id="p74-density" type="range" min="700" max="1100" step="1" value="${state.density}"/></label><label for="p74-atmosphere"><span>Atmospheric pressure<output data-p74-live="atmosphere">${clean(state.atmosphericKpa,1)} kPa abs</output></span><input id="p74-atmosphere" type="range" min="70" max="105" step="0.1" value="${state.atmosphericKpa}"/></label><label class="p74-vapour-control" for="p74-vapour"><span>Fluid vapour pressure<output data-p74-live="vapour">${clean(state.vapourKpa,1)} kPa abs</output></span><input id="p74-vapour" type="range" min="1" max="25" step="0.1" value="${state.vapourKpa}"/></label></div><div class="p74-presets" role="group" aria-label="Fluid and atmosphere presets"><button class="chip-button" type="button" data-problem-action="p74-preset" data-p74-preset="challenge">Challenge water</button><button class="chip-button" type="button" data-problem-action="p74-preset" data-p74-preset="warm">Warm water</button><button class="chip-button" type="button" data-problem-action="p74-preset" data-p74-preset="altitude">High altitude</button><button class="chip-button" type="button" data-problem-action="p74-preset" data-p74-preset="ethanol">Ethanol-like</button><button class="chip-button" type="button" data-problem-action="p74-preset" data-p74-preset="limit">Set crest to limit</button></div></section>`;}

  function feedbackMarkup(){return state.feedback?`<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p74-hints">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function solutionMarkup(){if(!state.revealed)return"";return `<section class="p74-solution" aria-labelledby="p74-solution-heading"><h3 id="p74-solution-heading" tabindex="-1">The outlet head powers the syphon</h3><p>From the open reservoir surface to the atmospheric outlet, pressure cancels and the surface speed is negligible:</p><div class="p74-equation">patm/ρ = patm/ρ + v²/2 − gd<br>v=√(2gd)=${clean(challengeValues.speed,6)} m/s</div><p>From the surface to the crest:</p><div class="p74-equation">patm/ρ = pc/ρ + v²/2 + gh<br>pc=patm−ρg(h+d)</div><p>For h=6.00 m, d=2.00 m, ρ=1000 kg/m³ and patm=101.3 kPa absolute:</p><div class="p74-equation">pc=101.3−(1000×9.81×8)/1000<br>pc=${clean(challengeValues.crestPressure/1000,3)} kPa absolute</div><p>This is ${signed(challengeValues.crestGaugePressure/1000,3)} kPa gauge. It exceeds pvap=2.3 kPa absolute, so the ideal column remains intact.</p><p>The limiting total height is</p><div class="p74-equation">h+d≤(patm−pvap)/(ρg)=${clean(challengeValues.maximumTotalHead,3)} m<br>hmax=${clean(challengeValues.maximumCrestHeight,3)} m for d=2.00 m</div><p class="p74-limits"><strong>Checks.</strong> If d=0 then v=0: a high crest alone does not create sustained flow. Increasing d raises speed but lowers crest pressure by the same additional head. At h=d=0, pc=patm. Gauge pressure is measured relative to atmosphere; vapour pressure is absolute, so the two must not be compared without conversion. The ideal model assumes a primed, constant-bore tube, a large reservoir and negligible viscosity; real losses reduce speed and local restrictions can cavitate earlier.</p></section>`;}
  function snapshot(){const v=syphon();return JSON.stringify({problem:PROBLEM,reconstruction:true,gravityMetresPerSecondSquared:GRAVITY,crestHeightMetres:state.crestHeight,outletDropMetres:state.outletDrop,densityKilogramsPerCubicMetre:state.density,atmosphericPressureKilopascalsAbsolute:state.atmosphericKpa,vapourPressureKilopascalsAbsolute:state.vapourKpa,idealSpeedMetresPerSecond:Number(v.speed.toFixed(6)),crestPressureKilopascalsAbsolute:Number((v.crestPressure/1000).toFixed(6)),crestPressureKilopascalsGauge:Number((v.crestGaugePressure/1000).toFixed(6)),vapourMarginKilopascals:Number((v.vapourMargin/1000).toFixed(6)),maximumTotalHeadMetres:Number(v.maximumTotalHead.toFixed(6)),maximumCrestHeightMetres:Number(v.maximumCrestHeight.toFixed(6)),regime:v.regime,stage:state.stage+1,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p74-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive fluid mechanics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p74-spread"><article class="book-page p74-problem-page"><div class="problem-number">Problem 7.4</div><h1 class="book-title p74-title">Professor Sinclair’s syphon</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">A primed constant-bore tube carries water from a large open reservoir. Its crest is 6.00 m above the reservoir surface and its atmospheric outlet is 2.00 m below it. Take ρ=1000 kg/m³, patm=101.3 kPa absolute and pvap=2.3 kPa absolute.</p><p class="problem-copy">Ignoring losses, calculate the absolute pressure at the crest and decide whether the liquid column can remain intact.</p><section class="p74-pressure-card"><strong>Pressure language</strong><p>Outlet gauge pressure is zero because it is open to the same atmosphere as the reservoir. Absolute pressure equals gauge pressure plus patm. Cavitation is tested with absolute pressure.</p></section><section class="p74-model-card"><div class="eyebrow">Model boundary</div><p>Steady incompressible flow, large reservoir, constant tube area and negligible losses. The tube must already be filled: Bernoulli does not prime it.</p></section></article><section class="book-page book-stage p74-stage">${stageControls()}${stageHeading()}${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p74-coach"><div class="coach-kicker">Audit the crest</div><p class="coach-question">For the stated water syphon, what absolute pressure does Bernoulli predict at the crest?</p><form class="p74-answer-form" data-p74-answer-form novalidate><label for="p74-answer">Crest absolute pressure</label><div><input id="p74-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="absolute, not gauge" autocomplete="off"/><span>kPa abs</span></div><button class="primary-button" type="submit">Check crest pressure</button></form>${feedbackMarkup()}<div class="button-row p74-help-row"><button class="secondary-button" type="button" data-problem-action="p74-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p74-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p74-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(){const root=document.querySelector(".p74-shell");if(!root)return;const dynamic=root.querySelector(".p74-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();const values={crest:`${clean(state.crestHeight,1)} m`,drop:`${clean(state.outletDrop,1)} m`,density:`${clean(state.density,0)} kg/m³`,atmosphere:`${clean(state.atmosphericKpa,1)} kPa abs`,vapour:`${clean(state.vapourKpa,1)} kPa abs`};Object.entries(values).forEach(([key,value])=>root.querySelectorAll(`[data-p74-live="${key}"]`).forEach(node=>{node.textContent=value;}));const result=syphon();root.querySelector("#p74-crest")?.setAttribute("aria-valuetext",`Crest ${clean(state.crestHeight,1)} metres; ${regimeLabel(result)}`);root.querySelector("#p74-drop")?.setAttribute("aria-valuetext",`Outlet drop ${clean(state.outletDrop,1)} metres; ideal speed ${clean(result.speed,2)} metres per second`);root.querySelector("#p74-density")?.setAttribute("aria-valuetext",`Density ${clean(state.density,0)} kilograms per cubic metre`);root.querySelector("#p74-atmosphere")?.setAttribute("aria-valuetext",`Atmospheric absolute pressure ${clean(state.atmosphericKpa,1)} kilopascals`);root.querySelector("#p74-vapour")?.setAttribute("aria-valuetext",`Vapour absolute pressure ${clean(state.vapourKpa,1)} kilopascals; margin ${signed(result.vapourMargin/1000,2)} kilopascals`);}
  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}){document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p74-reset"){state=initialState();renderAndFocus(renderApp,"#p74-crest");return;}if(action==="p74-stage"){state.stage=clamp(Number(control.dataset.p74Stage),0,2);renderAndFocus(renderApp,`[data-p74-stage="${state.stage}"]`);return;}if(action==="p74-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p74-stage="${state.stage}"]`);return;}if(action==="p74-preset"){const preset=control.dataset.p74Preset;if(preset==="challenge"){state.crestHeight=6;state.outletDrop=2;state.density=1000;state.atmosphericKpa=101.3;state.vapourKpa=2.3;}if(preset==="warm"){state.density=983;state.vapourKpa=19.9;state.atmosphericKpa=101.3;}if(preset==="altitude"){state.density=1000;state.vapourKpa=2.3;state.atmosphericKpa=75;}if(preset==="ethanol"){state.density=789;state.vapourKpa=5.9;state.atmosphericKpa=101.3;}if(preset==="limit")state.crestHeight=clamp(Number(syphon().maximumCrestHeight.toFixed(2)),0,12);renderAndFocus(renderApp,"#p74-crest");return;}if(action==="p74-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p74-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p74-reveal")window.requestAnimationFrame(()=>document.querySelector("#p74-solution-heading")?.focus());}));[["#p74-crest","crestHeight",0,12],["#p74-drop","outletDrop",0,8],["#p74-density","density",700,1100],["#p74-atmosphere","atmosphericKpa",70,105],["#p74-vapour","vapourKpa",1,25]].forEach(([selector,key,min,max])=>document.querySelector(selector)?.addEventListener("input",event=>{state[key]=clamp(Number(event.target.value),min,max);updateDynamicDom();}));const input=document.querySelector("#p74-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p74-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer),target=challengeValues.crestPressure/1000;state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one absolute pressure in kilopascals.";else if(Math.abs(answer-challengeValues.crestGaugePressure/1000)<.05)state.feedback="That is the negative gauge pressure. Add atmospheric pressure before comparing the crest with vapour pressure.";else if(Math.abs(answer-target)>.03)state.feedback="Use pc=patm−ρg(h+d). The outlet drop contributes through the kinetic-energy term as well as the crest height.";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: pc=${clean(target,3)} kPa absolute (${signed(challengeValues.crestGaugePressure/1000,3)} kPa gauge), safely above 2.3 kPa vapour pressure.`;}renderAndFocus(renderApp,"#p74-answer");});}
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
