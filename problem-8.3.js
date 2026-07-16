(function registerTargetShootingPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "8.3";
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ range: 30, targetSpeed: 3, launchSpeed: 25 });
  const stages = Object.freeze([
    Object.freeze({ short: "Components", title: "Ask what velocity each time would require", copy: "At a proposed intercept time t, horizontal closure fixes vx and returning to launch height fixes vy. Their vector magnitude must equal the available launch speed." }),
    Object.freeze({ short: "Roots", title: "Find every positive time", copy: "Above the minimum feasible speed the component equation has two roots: a quick low arc and a slower high arc. At the threshold they merge." }),
    Object.freeze({ short: "Verify", title: "Convert time into an angle", copy: "For each root, θ=atan2(vy,vx). Substitution then places projectile and target at the same point at the same time." }),
  ]);
  const hints = Object.freeze([
    "Because the projectile returns to y=0 at intercept, 0=vy t−½gt². For t&gt;0 this gives vy=gt/2.",
    "Horizontally, vx t=X₀+ut, so vx=X₀/t+u.",
    "Use the fixed speed: (X₀/t+u)²+(gt/2)²=s². Positive roots are possible intercept times.",
    "For the lower arc choose the smaller positive time, then calculate θ=atan2(gt/2, X₀/t+u).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p83-reset">Reset</button>';

  const initialState = () => ({
    range: CHALLENGE.range,
    targetSpeed: CHALLENGE.targetSpeed,
    launchSpeed: CHALLENGE.launchSpeed,
    activeSolution: 0,
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

  function requiredSpeedSquared(time, range = state.range, targetSpeed = state.targetSpeed) {
    return (range / time + targetSpeed) ** 2 + (GRAVITY * time / 2) ** 2;
  }

  function minimumSpeedData(range = state.range, targetSpeed = state.targetSpeed) {
    const derivative = (time) => -2 * range ** 2 / time ** 3 - 2 * range * targetSpeed / time ** 2 + 0.5 * GRAVITY ** 2 * time;
    let lower = 1e-8;
    let upper = 1;
    while (derivative(upper) < 0 && upper < 100) upper *= 2;
    for (let iteration = 0; iteration < 100; iteration += 1) {
      const middle = (lower + upper) / 2;
      if (derivative(middle) > 0) upper = middle;
      else lower = middle;
    }
    const time = (lower + upper) / 2;
    return { time, speed: Math.sqrt(requiredSpeedSquared(time, range, targetSpeed)) };
  }

  function bisectRoot(left, right, launchSpeed, range, targetSpeed) {
    const residual = (time) => requiredSpeedSquared(time, range, targetSpeed) - launchSpeed ** 2;
    let lower = left;
    let upper = right;
    for (let iteration = 0; iteration < 100; iteration += 1) {
      const middle = (lower + upper) / 2;
      if (residual(lower) * residual(middle) <= 0) upper = middle;
      else lower = middle;
    }
    return (lower + upper) / 2;
  }

  function solveIntercept(
    range = state.range,
    targetSpeed = state.targetSpeed,
    launchSpeed = state.launchSpeed,
  ) {
    const minimum = minimumSpeedData(range, targetSpeed);
    const difference = launchSpeed - minimum.speed;
    let times = [];
    if (Math.abs(difference) <= 1e-7) times = [minimum.time];
    if (difference > 1e-7) {
      const flightUpper = 2 * launchSpeed / GRAVITY;
      times = [
        bisectRoot(1e-8, minimum.time, launchSpeed, range, targetSpeed),
        bisectRoot(minimum.time, flightUpper, launchSpeed, range, targetSpeed),
      ];
    }
    const solutions = times.map((time) => {
      const horizontalVelocity = range / time + targetSpeed;
      const verticalVelocity = GRAVITY * time / 2;
      const angle = Math.atan2(verticalVelocity, horizontalVelocity);
      const interceptPosition = range + targetSpeed * time;
      const projectileX = launchSpeed * Math.cos(angle) * time;
      const projectileY = launchSpeed * Math.sin(angle) * time - 0.5 * GRAVITY * time ** 2;
      return { time, horizontalVelocity, verticalVelocity, angle, angleDegrees: angle * 180 / Math.PI, interceptPosition, projectileX, projectileY };
    });
    return {
      minimum,
      solutions,
      regime: solutions.length === 0 ? "none" : solutions.length === 1 ? "tangent" : "two",
      quarticCoefficients: [GRAVITY ** 2 / 4, 0, targetSpeed ** 2 - launchSpeed ** 2, 2 * range * targetSpeed, range ** 2],
    };
  }

  const challengeValues = solveIntercept(CHALLENGE.range, CHALLENGE.targetSpeed, CHALLENGE.launchSpeed);

  function regimeLabel(values = solveIntercept()) {
    if (values.regime === "none") return `No launch angle · needs at least ${clean(values.minimum.speed,2)} m/s`;
    if (values.regime === "tangent") return "One limiting trajectory · the roots coincide";
    return "Two intercept trajectories · low and high arcs";
  }

  function reconstructionNote() {
    return `<p class="p83-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p83-stage-controls" role="group" aria-label="Projectile intercept stages">${stages.map((stage,index)=>`<button class="secondary-button ${state.stage===index?"active":""}" type="button" data-problem-action="p83-stage" data-p83-stage="${index}" aria-pressed="${state.stage===index}"><span>${index+1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageHeading() {
    const stage=stages[state.stage];
    return `<div class="p83-stage-heading"><div><div class="eyebrow">Stage ${state.stage+1} of 3</div><h2>${stage.title}</h2></div><p>${stage.copy}</p><button class="ghost-button" type="button" data-problem-action="p83-next-stage" ${state.stage>=2?"disabled":""}>${state.stage>=2?"Intercept verified":"Next stage"}</button></div>`;
  }

  function trajectoryPath(solution, xMap, yMap) {
    const points=[];
    for(let index=0;index<=80;index+=1){const time=solution.time*index/80;const x=state.launchSpeed*Math.cos(solution.angle)*time;const y=state.launchSpeed*Math.sin(solution.angle)*time-.5*GRAVITY*time**2;points.push({x:xMap(x),y:yMap(y)});}
    return points.map((point,index)=>`${index?"L":"M"}${clean(point.x,2)} ${clean(point.y,2)}`).join(" ");
  }

  function projectileSvg() {
    const values=solveIntercept();
    const solutions=values.solutions;
    const maxX=Math.max(state.range+20,...solutions.map(solution=>solution.interceptPosition))*1.08;
    const maxHeight=Math.max(5,...solutions.map(solution=>solution.verticalVelocity**2/(2*GRAVITY)))*1.15;
    const xMap=(x)=>54+x/maxX*620;
    const yMap=(y)=>331-y/maxHeight*235;
    const active=solutions[Math.min(state.activeSolution,Math.max(0,solutions.length-1))]||null;
    return `<svg class="p83-svg p83-stage-${state.stage} is-${values.regime}" viewBox="0 0 720 420" role="img" aria-labelledby="p83-svg-title p83-svg-desc"><title id="p83-svg-title">Projectile trajectories intercepting a horizontally moving target</title><desc id="p83-svg-desc">The target begins ${clean(state.range,1)} metres away and moves away at ${clean(state.targetSpeed,1)} metres per second. Projectile speed is ${clean(state.launchSpeed,1)} metres per second. ${regimeLabel(values)}. ${active?`The active angle is ${clean(active.angleDegrees,3)} degrees with intercept time ${clean(active.time,3)} seconds.`:""}</desc><defs><linearGradient id="p83-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3edf2"/><stop offset="1" stop-color="#f7efdc"/></linearGradient><marker id="p83-target-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z"/></marker></defs><rect width="720" height="420" fill="url(#p83-bg)"/><g class="p83-ground" aria-hidden="true"><line x1="42" y1="331" x2="687" y2="331"/><line x1="54" y1="65" x2="54" y2="331"/><text x="55" y="50">height y (m)</text><text x="682" y="352" text-anchor="end">horizontal position x (m)</text><circle cx="54" cy="331" r="6"/><text x="64" y="320">launcher</text><line class="p83-target-motion" x1="${clean(xMap(state.range))}" y1="365" x2="${clean(Math.min(674,xMap(state.range)+92))}" y2="365" marker-end="url(#p83-target-arrow)"/><text x="${clean(xMap(state.range))}" y="385">target starts ${clean(state.range,1)} m away · u=${clean(state.targetSpeed,1)} m/s</text></g>
      ${solutions.map((solution,index)=>`<path class="p83-trajectory is-${index===0?"low":"high"} ${index===state.activeSolution?"active":""}" d="${trajectoryPath(solution,xMap,yMap)}"/><g class="p83-intercept is-${index===state.activeSolution?"active":""}" aria-hidden="true"><circle cx="${clean(xMap(solution.interceptPosition))}" cy="331" r="7"/><text x="${clean(xMap(solution.interceptPosition))}" y="${index===0?313:300}" text-anchor="middle">${index===0?"low":"high"}: ${clean(solution.angleDegrees,2)}° · ${clean(solution.time,2)} s</text></g>`).join("")}
      <g class="p83-component-layer" aria-hidden="true"><rect x="72" y="72" width="294" height="75" rx="13"/><text class="p83-panel-kicker" x="89" y="94">COMPONENTS AT INTERCEPT TIME t</text><text class="p83-panel-value" x="89" y="118">vx=X₀/t+u &nbsp; · &nbsp; vy=gt/2</text><text class="p83-panel-note" x="89" y="137">require vx²+vy²=s²</text></g>
      <g class="p83-root-layer" aria-hidden="true"><rect x="72" y="72" width="405" height="75" rx="13"/><text class="p83-panel-kicker" x="89" y="94">POSITIVE-TIME ROOTS</text><text class="p83-panel-value" x="89" y="118">${solutions.length?solutions.map(solution=>`${clean(solution.time,4)} s`).join(" · "):"none"}</text><text class="p83-panel-note" x="89" y="137">minimum feasible speed ${clean(values.minimum.speed,3)} m/s at t=${clean(values.minimum.time,3)} s</text></g>
      <g class="p83-verify-layer" aria-hidden="true"><rect x="72" y="72" width="405" height="75" rx="13"/><text class="p83-panel-kicker" x="89" y="94">ACTIVE SOLUTION CHECK</text><text class="p83-panel-value" x="89" y="118">${active?`θ=${clean(active.angleDegrees,4)}° · xP−xT=${(active.projectileX-active.interceptPosition).toExponential(1)} m`:"no physical root"}</text><text class="p83-panel-note" x="89" y="137">${active?`vertical residual yP=${active.projectileY.toExponential(1)} m`:"increase launch speed or reduce range/target speed"}</text></g>
      <g class="p83-status" transform="translate(489 75)"><rect width="194" height="61" rx="14"/><text class="p83-status-kicker" x="14" y="22">CURRENT AIM</text><text class="p83-status-value" x="14" y="45">${regimeLabel(values)}</text></g>
    </svg>`;
  }

  function metricsMarkup(){const values=solveIntercept(),active=values.solutions[Math.min(state.activeSolution,Math.max(0,values.solutions.length-1))]||null;return `<section class="p83-metrics is-${values.regime}" aria-label="Projectile intercept calculations"><div><span>Minimum feasible speed</span><strong>${clean(values.minimum.speed,3)} m/s</strong></div><div><span>Number of trajectories</span><strong>${values.solutions.length}</strong></div><div><span>Active flight time</span><strong>${active?`${clean(active.time,4)} s`:"—"}</strong></div><div><span>Active launch angle</span><strong>${active?`${clean(active.angleDegrees,4)}°`:"—"}</strong></div><div><span>Horizontal launch component</span><strong>${active?`${clean(active.horizontalVelocity,3)} m/s`:"—"}</strong></div><div><span>Vertical launch component</span><strong>${active?`${clean(active.verticalVelocity,3)} m/s`:"—"}</strong></div><p><strong>${regimeLabel(values)}.</strong> ${active?`Target position at intercept: ${clean(active.interceptPosition,3)} m.`:"No real positive-time component pair has magnitude equal to the chosen launch speed."}</p></section>`;}
  function dynamicMarkup(){return `<div class="p83-dynamic">${projectileSvg()}${metricsMarkup()}</div>`;}
  function controlsMarkup(){const values=solveIntercept();return `<section class="p83-controls" aria-label="Projectile and target controls"><div class="p83-control-grid"><label for="p83-range"><span>Initial target range X₀<output data-p83-live="range">${clean(state.range,1)} m</output></span><input id="p83-range" type="range" min="5" max="60" step="0.5" value="${state.range}"/></label><label for="p83-target-speed"><span>Target speed u<output data-p83-live="target-speed">${clean(state.targetSpeed,1)} m/s</output></span><input id="p83-target-speed" type="range" min="0" max="10" step="0.1" value="${state.targetSpeed}"/></label><label class="p83-launch-control" for="p83-launch-speed"><span>Projectile launch speed s<output data-p83-live="launch-speed">${clean(state.launchSpeed,1)} m/s</output></span><input id="p83-launch-speed" type="range" min="8" max="40" step="0.1" value="${state.launchSpeed}"/></label></div><div class="p83-solution-picker" role="group" aria-label="Choose intercept arc"><button class="chip-button ${state.activeSolution===0?"active":""}" type="button" data-problem-action="p83-solution" data-p83-solution="0" ${values.solutions.length<1?"disabled":""}>Lower arc</button><button class="chip-button ${state.activeSolution===1?"active":""}" type="button" data-problem-action="p83-solution" data-p83-solution="1" ${values.solutions.length<2?"disabled":""}>Higher arc</button></div><div class="p83-presets" role="group" aria-label="Projectile cases"><button class="chip-button" type="button" data-problem-action="p83-preset" data-p83-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p83-preset" data-p83-preset="stationary">Stationary target</button><button class="chip-button" type="button" data-problem-action="p83-preset" data-p83-preset="limit">Just possible</button><button class="chip-button" type="button" data-problem-action="p83-preset" data-p83-preset="none">No solution</button></div></section>`;}

  function feedbackMarkup(){return state.feedback?`<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p83-hints">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function solutionMarkup(){if(!state.revealed)return"";const low=challengeValues.solutions[0],high=challengeValues.solutions[1],c=challengeValues.quarticCoefficients;return `<section class="p83-solution" aria-labelledby="p83-solution-heading"><h3 id="p83-solution-heading" tabindex="-1">Solve for time before angle</h3><p>At the same-level intercept, vertical motion gives vy=gt/2. Horizontal closure gives vx=X₀/t+u. Since the launch speed is 25 m/s,</p><div class="p83-equation">(30/t+3)²+(9.81t/2)²=25²</div><p>Multiplying by t² produces</p><div class="p83-equation">${clean(c[0],6)}t⁴ ${c[2]<0?"−":"+"} ${clean(Math.abs(c[2]),3)}t² + ${clean(c[3],3)}t + ${clean(c[4],3)}=0</div><p>The two positive roots are</p><div class="p83-equation">tlow=${clean(low.time,9)} s<br>thigh=${clean(high.time,9)} s</div><p>The requested lower angle uses the shorter time:</p><div class="p83-equation">θlow=atan2(gtlow/2,30/tlow+3)<br>θlow=${clean(low.angleDegrees,9)}°</div><p>The second valid solution is θhigh=${clean(high.angleDegrees,9)}° with flight time ${clean(high.time,9)} s. Both land on the moving target: at ${clean(low.interceptPosition,3)} m for the low arc and ${clean(high.interceptPosition,3)} m for the high arc.</p><p class="p83-limits"><strong>Checks.</strong> If u=0, the equation reduces to the stationary-target range law X₀=s²sin(2θ)/g, and the two angles are complementary. At the minimum feasible speed the two time roots merge into one tangent solution. Below it there is no real launch angle. A positive initial gap cannot be closed if the target speed approaches or exceeds every usable horizontal component. Velocity components are m/s, g is m/s², time is seconds and atan2 returns a dimensionless angle.</p></section>`;}
  function snapshot(){const values=solveIntercept(),active=values.solutions[Math.min(state.activeSolution,Math.max(0,values.solutions.length-1))]||null;return JSON.stringify({problem:PROBLEM,reconstruction:true,gravityMetresPerSecondSquared:GRAVITY,initialTargetRangeMetres:state.range,targetSpeedMetresPerSecond:state.targetSpeed,launchSpeedMetresPerSecond:state.launchSpeed,minimumFeasibleSpeedMetresPerSecond:Number(values.minimum.speed.toFixed(6)),solutionCount:values.solutions.length,solutions:values.solutions.map(solution=>({timeSeconds:Number(solution.time.toFixed(8)),angleDegrees:Number(solution.angleDegrees.toFixed(8)),interceptPositionMetres:Number(solution.interceptPosition.toFixed(8)),horizontalResidualMetres:Number((solution.projectileX-solution.interceptPosition).toFixed(10)),verticalResidualMetres:Number(solution.projectileY.toFixed(10))})),activeSolution:active?state.activeSolution:null,regime:values.regime,stage:state.stage+1,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p83-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive projectile motion</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p83-spread"><article class="book-page p83-problem-page"><div class="problem-number">Problem 8.3</div><h1 class="book-title p83-title">Target shooting</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A ground-level target begins 30.0 m from a launcher and moves directly away at a constant 3.00 m/s. A projectile is launched from ground level at fixed speed 25.0 m/s; ignore air resistance.</p><p class="problem-copy">There are two same-level intercept trajectories. Find the lower launch angle.</p><section class="p83-time-card"><strong>Why solve for time?</strong><p>At any proposed intercept time, the target’s horizontal position and the projectile’s return to y=0 determine both required launch-velocity components immediately.</p></section><section class="p83-model-card"><div class="eyebrow">Model</div><p>Point projectile and target, level ground, uniform g=9.81 m/s², constant target velocity and no drag. Angles lie between horizontal and vertical.</p></section></article><section class="book-page book-stage p83-stage">${stageControls()}${stageHeading()}${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p83-coach"><div class="coach-kicker">Choose the low arc</div><p class="coach-question">What is the smaller launch angle that intercepts the stated moving target?</p><form class="p83-answer-form" data-p83-answer-form novalidate><label for="p83-answer">Lower launch angle</label><div><input id="p83-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="angle above horizontal" autocomplete="off"/><span>degrees</span></div><button class="primary-button" type="submit">Check angle</button></form>${feedbackMarkup()}<div class="button-row p83-help-row"><button class="secondary-button" type="button" data-problem-action="p83-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p83-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p83-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(){const root=document.querySelector(".p83-shell");if(!root)return;const solved=solveIntercept();if(state.activeSolution>=solved.solutions.length)state.activeSolution=0;const dynamic=root.querySelector(".p83-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();const values={range:`${clean(state.range,1)} m`,"target-speed":`${clean(state.targetSpeed,1)} m/s`,"launch-speed":`${clean(state.launchSpeed,1)} m/s`};Object.entries(values).forEach(([key,value])=>root.querySelectorAll(`[data-p83-live="${key}"]`).forEach(node=>{node.textContent=value;}));root.querySelector("#p83-range")?.setAttribute("aria-valuetext",`Initial range ${clean(state.range,1)} metres; ${regimeLabel(solved)}`);root.querySelector("#p83-target-speed")?.setAttribute("aria-valuetext",`Target speed ${clean(state.targetSpeed,1)} metres per second; minimum launch speed ${clean(solved.minimum.speed,2)}`);root.querySelector("#p83-launch-speed")?.setAttribute("aria-valuetext",`Launch speed ${clean(state.launchSpeed,1)} metres per second; ${solved.solutions.length} trajectories`);}
  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}){document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p83-reset"){state=initialState();renderAndFocus(renderApp,"#p83-range");return;}if(action==="p83-stage"){state.stage=clamp(Number(control.dataset.p83Stage),0,2);renderAndFocus(renderApp,`[data-p83-stage="${state.stage}"]`);return;}if(action==="p83-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p83-stage="${state.stage}"]`);return;}if(action==="p83-solution"){state.activeSolution=clamp(Number(control.dataset.p83Solution),0,1);renderAndFocus(renderApp,`[data-p83-solution="${state.activeSolution}"]`);return;}if(action==="p83-preset"){const preset=control.dataset.p83Preset;if(preset==="challenge"){state.range=30;state.targetSpeed=3;state.launchSpeed=25;}if(preset==="stationary"){state.range=30;state.targetSpeed=0;state.launchSpeed=25;}if(preset==="limit")state.launchSpeed=minimumSpeedData().speed;if(preset==="none"){state.range=50;state.targetSpeed=8;state.launchSpeed=12;}state.activeSolution=0;renderAndFocus(renderApp,"#p83-launch-speed");return;}if(action==="p83-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p83-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p83-reveal")window.requestAnimationFrame(()=>document.querySelector("#p83-solution-heading")?.focus());}));[["#p83-range","range",5,60],["#p83-target-speed","targetSpeed",0,10],["#p83-launch-speed","launchSpeed",8,40]].forEach(([selector,key,min,max])=>document.querySelector(selector)?.addEventListener("input",event=>{state[key]=clamp(Number(event.target.value),min,max);updateDynamicDom();}));const input=document.querySelector("#p83-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p83-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer),low=challengeValues.solutions[0],high=challengeValues.solutions[1];state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one angle in degrees.";else if(Math.abs(answer-high.angleDegrees)<.03)state.feedback="That is the valid higher arc. The question asks for the smaller launch angle, which uses the shorter time root.";else if(Math.abs(answer-low.angleDegrees)>.02)state.feedback="Solve the fixed-speed component equation for positive times, choose the smaller root, then use atan2(vy,vx).";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: θlow=${clean(low.angleDegrees,6)}° with flight time ${clean(low.time,6)} s. The projectile meets the target at ${clean(low.interceptPosition,3)} m.`;}renderAndFocus(renderApp,"#p83-answer");});}
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
