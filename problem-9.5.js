(function registerPowerTransmissionPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "9.5";
  const CHALLENGE = Object.freeze({ loadPowerMw: 1, loadVoltageKv: 10, lineResistance: 2 });
  const stages = Object.freeze([
    Object.freeze({ short: "Current", title: "Hold delivered power fixed", copy: "At the receiving end, the load needs Pload at voltage Vload. In this ideal DC/unity-power-factor model, the line current is I=Pload/Vload." }),
    Object.freeze({ short: "Line loss", title: "Pay the I²R heating cost", copy: "The total outward-and-return conductor resistance dissipates I²R and causes a voltage drop IR. Doubling voltage quarters this loss at fixed power." }),
    Object.freeze({ short: "Source", title: "Supply both load and line", copy: "The sending end must provide Vsource=Vload+IR and Psource=Pload+I²R. Efficiency compares delivered load power with this larger source power." }),
  ]);
  const hints = Object.freeze([
    "Convert 1.00 MW to 1,000,000 W and 10.0 kV to 10,000 V. The stated voltage is at the load.",
    "Use I=Pload/Vload. This is the current through both the load and the series line resistance.",
    "The total line heating is Ploss=I²Rline. Rline=2.00 Ω already includes the complete current path.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p95-reset">Reset</button>';

  const initialState = () => ({
    loadPowerMw: CHALLENGE.loadPowerMw,
    loadVoltageKv: CHALLENGE.loadVoltageKv,
    lineResistance: CHALLENGE.lineResistance,
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

  function transmission(
    loadPowerMw = state.loadPowerMw,
    loadVoltageKv = state.loadVoltageKv,
    lineResistance = state.lineResistance,
  ) {
    const loadPower = loadPowerMw * 1e6;
    const loadVoltage = loadVoltageKv * 1000;
    const current = loadPower / loadVoltage;
    const lineLoss = current ** 2 * lineResistance;
    const voltageDrop = current * lineResistance;
    const sourceVoltage = loadVoltage + voltageDrop;
    const sourcePower = loadPower + lineLoss;
    const efficiency = loadPower / sourcePower;
    return {
      loadPower,
      loadVoltage,
      current,
      lineLoss,
      voltageDrop,
      sourceVoltage,
      sourcePower,
      efficiency,
      lossFractionOfLoad: lineLoss / loadPower,
      powerResidual: sourceVoltage * current - sourcePower,
    };
  }

  const challengeValues = transmission(CHALLENGE.loadPowerMw, CHALLENGE.loadVoltageKv, CHALLENGE.lineResistance);

  function reconstructionNote() {
    return `<p class="p95-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p95-stage-controls" role="group" aria-label="Power transmission analysis stages">${stages.map((stage,index)=>`<button class="secondary-button ${state.stage===index?"active":""}" type="button" data-problem-action="p95-stage" data-p95-stage="${index}" aria-pressed="${state.stage===index}"><span>${index+1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageHeading() {
    const stage=stages[state.stage];
    return `<div class="p95-stage-heading"><div><div class="eyebrow">Stage ${state.stage+1} of 3</div><h2>${stage.title}</h2></div><p>${stage.copy}</p><button class="ghost-button" type="button" data-problem-action="p95-next-stage" ${state.stage>=2?"disabled":""}>${state.stage>=2?"Power audited":"Next stage"}</button></div>`;
  }

  function lossCurvePath() {
    const points=[];
    for(let index=0;index<=100;index+=1){const voltage=1+99*index/100,relative=1/voltage**2;points.push({x:78+(voltage-1)/99*563,y:367-relative*96});}
    return points.map((point,index)=>`${index?"L":"M"}${clean(point.x,2)} ${clean(point.y,2)}`).join(" ");
  }

  function transmissionSvg() {
    const values=transmission();
    const selectedX=78+(state.loadVoltageKv-1)/99*563;
    const selectedY=367-(1/state.loadVoltageKv**2)*96;
    const totalBar=294;
    const loadBar=totalBar*values.loadPower/values.sourcePower;
    const lossBar=totalBar-loadBar;
    return `<svg class="p95-svg p95-stage-${state.stage}" viewBox="0 0 720 430" role="img" aria-labelledby="p95-svg-title p95-svg-desc"><title id="p95-svg-title">Electrical power transmitted through a resistive line to a fixed-power load</title><desc id="p95-svg-desc">The load receives ${clean(state.loadPowerMw,2)} megawatts at ${clean(state.loadVoltageKv,1)} kilovolts. Total line resistance is ${clean(state.lineResistance,2)} ohms. Current is ${clean(values.current,2)} amperes, line loss ${clean(values.lineLoss/1000,3)} kilowatts and efficiency ${clean(values.efficiency*100,3)} percent.</desc><defs><marker id="p95-current-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z"/></marker><linearGradient id="p95-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4edf0"/><stop offset="1" stop-color="#f7efdc"/></linearGradient></defs><rect width="720" height="430" fill="url(#p95-bg)"/>
      <g class="p95-flow" aria-hidden="true"><g class="p95-source" transform="translate(77 116)"><circle r="45"/><path d="M-22 0 Q-11 -22 0 0 T22 0"/><text y="68">sending source</text></g><g class="p95-line"><line x1="125" y1="91" x2="555" y2="91"/><line x1="125" y1="168" x2="555" y2="168"/><path class="p95-resistor" d="M255 91 l10 -11 15 22 15 -22 15 22 15 -22 15 22 10 -11"/><path class="p95-resistor" d="M255 168 l10 -11 15 22 15 -22 15 22 15 -22 15 22 10 -11"/><text x="297" y="72" text-anchor="middle">total loop R=${clean(state.lineResistance,2)} Ω</text><line class="p95-current" x1="382" y1="91" x2="478" y2="91" marker-end="url(#p95-current-arrow)"/><text x="430" y="77" text-anchor="middle">I=${clean(values.current,2)} A</text></g><g class="p95-load" transform="translate(607 129)"><rect x="-43" y="-55" width="86" height="110" rx="12"/><path d="M-18 -23 H18 M-18 0 H18 M-18 23 H18"/><text y="78">receiving load</text></g><text class="p95-voltage-label" x="607" y="42" text-anchor="middle">Vload=${clean(state.loadVoltageKv,2)} kV</text><text class="p95-power-label" x="607" y="219" text-anchor="middle">Pload=${clean(state.loadPowerMw,3)} MW</text></g>
      <g class="p95-loss-layer" aria-hidden="true"><rect x="48" y="244" width="624" height="151" rx="14"/><text class="p95-panel-kicker" x="67" y="266">FIXED-POWER LINE LOSS · PLOSS ∝ 1/VLOAD²</text><line class="p95-curve-axis" x1="78" y1="367" x2="641" y2="367"/><path class="p95-loss-curve" d="${lossCurvePath()}"/><circle class="p95-loss-point" cx="${clean(selectedX)}" cy="${clean(selectedY)}" r="7"/><text x="78" y="385">1 kV</text><text x="641" y="385" text-anchor="end">100 kV</text><text class="p95-loss-value" x="656" y="297" text-anchor="end">I²R=${clean(values.lineLoss/1000,3)} kW</text><text class="p95-loss-value" x="656" y="319" text-anchor="end">ΔV=${clean(values.voltageDrop,2)} V</text></g>
      <g class="p95-source-layer" aria-hidden="true"><rect x="380" y="238" width="292" height="82" rx="14"/><text class="p95-panel-kicker" x="397" y="260">SOURCE MUST COVER BOTH</text><rect class="p95-load-bar" x="397" y="275" width="${clean(loadBar)}" height="13" rx="6"/><rect class="p95-loss-bar" x="${clean(397+loadBar)}" y="275" width="${clean(lossBar)}" height="13" rx="6"/><text class="p95-source-value" x="397" y="309">Vsource=${clean(values.sourceVoltage/1000,4)} kV · Psource=${clean(values.sourcePower/1e6,5)} MW</text></g>
      <g class="p95-status" transform="translate(392 121)"><rect width="164" height="64" rx="14"/><text class="p95-status-kicker" x="14" y="23">EFFICIENCY</text><text class="p95-status-value" x="14" y="49">${clean(values.efficiency*100,3)}%</text></g>
    </svg>`;
  }

  function metricsMarkup(){const v=transmission();return `<section class="p95-metrics" aria-label="Power transmission calculations"><div><span>Line current</span><strong>${clean(v.current,3)} A</strong></div><div><span>Line heating loss</span><strong>${clean(v.lineLoss/1000,3)} kW</strong></div><div><span>Line voltage drop</span><strong>${clean(v.voltageDrop,3)} V</strong></div><div><span>Required source voltage</span><strong>${clean(v.sourceVoltage/1000,5)} kV</strong></div><div><span>Required source power</span><strong>${clean(v.sourcePower/1e6,6)} MW</strong></div><div><span>Transmission efficiency</span><strong>${clean(v.efficiency*100,4)}%</strong></div><p>Power-balance residual VsourceI−(Pload+I²R) = ${v.powerResidual.toExponential(1)} W. The voltage control is explicitly the receiving-end voltage.</p></section>`;}
  function dynamicMarkup(){return `<div class="p95-dynamic">${transmissionSvg()}${metricsMarkup()}</div>`;}
  function controlsMarkup(){return `<section class="p95-controls" aria-label="Power transmission controls"><div class="p95-control-grid"><label for="p95-power"><span>Delivered load power Pload<output data-p95-live="power">${clean(state.loadPowerMw,2)} MW</output></span><input id="p95-power" type="range" min="0.1" max="5" step="0.1" value="${state.loadPowerMw}"/></label><label for="p95-voltage"><span>Receiving-end voltage Vload<output data-p95-live="voltage">${clean(state.loadVoltageKv,1)} kV</output></span><input id="p95-voltage" type="range" min="1" max="100" step="1" value="${state.loadVoltageKv}"/></label><label class="p95-resistance-control" for="p95-resistance"><span>Total line resistance Rline<output data-p95-live="resistance">${clean(state.lineResistance,2)} Ω</output></span><input id="p95-resistance" type="range" min="0" max="10" step="0.1" value="${state.lineResistance}"/></label></div><div class="p95-presets" role="group" aria-label="Transmission cases"><button class="chip-button" type="button" data-problem-action="p95-preset" data-p95-preset="challenge">Challenge · 10 kV</button><button class="chip-button" type="button" data-problem-action="p95-preset" data-p95-preset="low">Low · 1 kV</button><button class="chip-button" type="button" data-problem-action="p95-preset" data-p95-preset="high">High · 100 kV</button><button class="chip-button" type="button" data-problem-action="p95-preset" data-p95-preset="long">Long resistive line</button><button class="chip-button" type="button" data-problem-action="p95-preset" data-p95-preset="ideal">Ideal R=0</button></div></section>`;}

  function feedbackMarkup(){return state.feedback?`<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p95-hints">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function solutionMarkup(){if(!state.revealed)return"";return `<section class="p95-solution" aria-labelledby="p95-solution-heading"><h3 id="p95-solution-heading" tabindex="-1">High voltage means low current for the same delivered power</h3><p>The load receives 1.00 MW at 10.0 kV:</p><div class="p95-equation">I=Pload/Vload=1,000,000/10,000=100 A</div><p>The stated 2.00 Ω is the total resistance of the full line-current path, so</p><div class="p95-equation">Ploss=I²R=(100)²(2.00)=20,000 W=20.0 kW</div><p>The line also drops</p><div class="p95-equation">ΔV=IR=200 V<br>Vsource=10,000+200=10,200 V</div><p>Thus Psource=1.020 MW and efficiency is</p><div class="p95-equation">η=Pload/Psource=1/1.02=${clean(challengeValues.efficiency*100,6)}%</div><p class="p95-limits"><strong>Checks and caveat.</strong> At fixed delivered power, I∝1/V and I²R∝1/V². As R→0, loss and drop vanish, source and load values coincide, and η→100%. As V→0 the ideal current and loss diverge. Doubling delivered power at fixed voltage doubles current but quadruples line loss. Real grids use AC transformers to step voltage up for transmission and back down before consumers; loads are not simply connected to extreme voltage. Three-phase power factor, reactive current, transformer loss, insulation, corona and safety are beyond this introductory model.</p></section>`;}
  function snapshot(){const v=transmission();return JSON.stringify({problem:PROBLEM,reconstruction:true,model:"DC or unity-power-factor equivalent",deliveredLoadPowerMegawatts:state.loadPowerMw,receivingEndVoltageKilovolts:state.loadVoltageKv,totalLineResistanceOhms:state.lineResistance,lineCurrentAmperes:Number(v.current.toFixed(8)),lineLossKilowatts:Number((v.lineLoss/1000).toFixed(8)),lineVoltageDropVolts:Number(v.voltageDrop.toFixed(8)),sendingEndVoltageKilovolts:Number((v.sourceVoltage/1000).toFixed(8)),sendingEndPowerMegawatts:Number((v.sourcePower/1e6).toFixed(8)),efficiencyPercent:Number((v.efficiency*100).toFixed(8)),powerBalanceResidualWatts:v.powerResidual,stage:state.stage+1,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p95-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive electricity</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p95-spread"><article class="book-page p95-problem-page"><div class="problem-number">Problem 9.5</div><h1 class="book-title p95-title">Power transmission</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A distant load must receive 1.00 MW at 10.0 kV. The outward and return conductors have total resistance 2.00 Ω.</p><p class="problem-copy">Find the electrical power lost as heat in the line. Then compare with transmitting the same delivered power at other receiving-end voltages.</p><section class="p95-definition-card"><strong>Source versus load</strong><p>The stated 10.0 kV is the voltage across the receiving load. The sending source must be higher by the line drop IR and supply both delivered and lost power.</p></section><section class="p95-model-card"><div class="eyebrow">Model</div><p>A DC or unity-power-factor equivalent with one total series resistance. The load power and receiving-end voltage are held fixed while the source adjusts.</p></section></article><section class="book-page book-stage p95-stage">${stageControls()}${stageHeading()}${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p95-coach"><div class="coach-kicker">Price the line loss</div><p class="coach-question">How much power is dissipated in the stated 2.00 Ω transmission line?</p><form class="p95-answer-form" data-p95-answer-form novalidate><label for="p95-answer">Line heating loss</label><div><input id="p95-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="power loss" autocomplete="off"/><span>kW</span></div><button class="primary-button" type="submit">Check line loss</button></form>${feedbackMarkup()}<div class="button-row p95-help-row"><button class="secondary-button" type="button" data-problem-action="p95-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p95-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p95-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(){const root=document.querySelector(".p95-shell");if(!root)return;const dynamic=root.querySelector(".p95-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();const values={power:`${clean(state.loadPowerMw,2)} MW`,voltage:`${clean(state.loadVoltageKv,1)} kV`,resistance:`${clean(state.lineResistance,2)} Ω`};Object.entries(values).forEach(([key,value])=>root.querySelectorAll(`[data-p95-live="${key}"]`).forEach(node=>{node.textContent=value;}));const result=transmission();root.querySelector("#p95-power")?.setAttribute("aria-valuetext",`Delivered power ${clean(state.loadPowerMw,2)} megawatts; current ${clean(result.current,2)} amperes`);root.querySelector("#p95-voltage")?.setAttribute("aria-valuetext",`Receiving voltage ${clean(state.loadVoltageKv,1)} kilovolts; line loss ${clean(result.lineLoss/1000,2)} kilowatts`);root.querySelector("#p95-resistance")?.setAttribute("aria-valuetext",`Total line resistance ${clean(state.lineResistance,2)} ohms; efficiency ${clean(result.efficiency*100,3)} percent`);}
  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}){document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p95-reset"){state=initialState();renderAndFocus(renderApp,"#p95-power");return;}if(action==="p95-stage"){state.stage=clamp(Number(control.dataset.p95Stage),0,2);renderAndFocus(renderApp,`[data-p95-stage="${state.stage}"]`);return;}if(action==="p95-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p95-stage="${state.stage}"]`);return;}if(action==="p95-preset"){const preset=control.dataset.p95Preset;if(preset==="challenge"){state.loadPowerMw=1;state.loadVoltageKv=10;state.lineResistance=2;}if(preset==="low")state.loadVoltageKv=1;if(preset==="high")state.loadVoltageKv=100;if(preset==="long")state.lineResistance=8;if(preset==="ideal")state.lineResistance=0;renderAndFocus(renderApp,"#p95-voltage");return;}if(action==="p95-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p95-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p95-reveal")window.requestAnimationFrame(()=>document.querySelector("#p95-solution-heading")?.focus());}));[["#p95-power","loadPowerMw",.1,5],["#p95-voltage","loadVoltageKv",1,100],["#p95-resistance","lineResistance",0,10]].forEach(([selector,key,min,max])=>document.querySelector(selector)?.addEventListener("input",event=>{state[key]=clamp(Number(event.target.value),min,max);updateDynamicDom();}));const input=document.querySelector("#p95-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p95-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer),target=challengeValues.lineLoss/1000;state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one power loss in kilowatts.";else if(Math.abs(answer-20000)<1)state.feedback="That is the loss in watts written as though it were kilowatts. Convert 20,000 W to 20.0 kW.";else if(Math.abs(answer-target)>.02)state.feedback="First find I=Pload/Vload, using watts and volts, then evaluate I²R for the total line resistance.";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: I=100 A and Ploss=I²R=${clean(target,3)} kW. The source supplies 1.020 MW at 10.2 kV.`;}renderAndFocus(renderApp,"#p95-answer");});}
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
