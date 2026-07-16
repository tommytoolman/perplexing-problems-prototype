(function registerProfessorLazyPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "8.1";
  const INITIAL_GAP = 6;
  const LIFT_TIME = 12;
  const CHALLENGE = Object.freeze({ delay: 2, acceleration: 1, maximumSpeed: 4, cartSpeed: 1.5 });
  const stages = Object.freeze([
    Object.freeze({ short: "Pieces", title: "Wait, accelerate, then cruise", copy: "Professor Lazy’s position is continuous across two joins: departure at t=τ and reaching maximum speed at t=τ+V/a." }),
    Object.freeze({ short: "Intercept", title: "Test the quadratic root first", copy: "A candidate catch during acceleration is valid only if it occurs before maximum speed. Otherwise solve the later linear branch." }),
    Object.freeze({ short: "Latest start", title: "Use the lift deadline backwards", copy: "To minimise walking time, choose the latest delay whose position at the 12 s lift deadline equals the cart’s position." }),
  ]);
  const hints = Object.freeze([
    "Measure s=t−τ from the moment Professor Lazy starts. During acceleration xP=½as², while the cart is at xC=L+u(τ+s).",
    "The positive acceleration-branch candidate is s=[u+√(u²+2a(L+uτ))]/a. It is valid only when s≤V/a.",
    "After reaching V, continuity gives xP=Vs−V²/(2a). Set this equal to L+u(τ+s).",
    "Thus the cruise-branch root is s=[L+uτ+V²/(2a)]/(V−u), requiring V&gt;u. The clock time is t=τ+s.",
    "For the latest start by deadline T, first find the travel duration needed to cover xC(T)=L+uT under the accelerate-then-cruise profile, then use τlatest=T−sduration.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p81-reset">Reset</button>';

  const initialState = () => ({
    delay: CHALLENGE.delay,
    acceleration: CHALLENGE.acceleration,
    maximumSpeed: CHALLENGE.maximumSpeed,
    cartSpeed: CHALLENGE.cartSpeed,
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

  function professorPosition(time, delay = state.delay, acceleration = state.acceleration, maximumSpeed = state.maximumSpeed) {
    if (time <= delay) return 0;
    const elapsed = time - delay;
    const rampTime = maximumSpeed / acceleration;
    if (elapsed <= rampTime) return 0.5 * acceleration * elapsed ** 2;
    return maximumSpeed * elapsed - maximumSpeed ** 2 / (2 * acceleration);
  }

  function professorVelocity(time, delay = state.delay, acceleration = state.acceleration, maximumSpeed = state.maximumSpeed) {
    if (time <= delay) return 0;
    return Math.min(maximumSpeed, acceleration * (time - delay));
  }

  function cartPosition(time, cartSpeed = state.cartSpeed) {
    return INITIAL_GAP + cartSpeed * time;
  }

  function intercept(
    delay = state.delay,
    acceleration = state.acceleration,
    maximumSpeed = state.maximumSpeed,
    cartSpeed = state.cartSpeed,
  ) {
    const rampTime = maximumSpeed / acceleration;
    const rampEndTime = delay + rampTime;
    const rampDistance = 0.5 * acceleration * rampTime ** 2;
    const discriminant = cartSpeed ** 2 + 2 * acceleration * (INITIAL_GAP + cartSpeed * delay);
    const accelerationElapsed = (cartSpeed + Math.sqrt(discriminant)) / acceleration;
    let catchType = "never";
    let elapsedToCatch = Infinity;
    if (accelerationElapsed <= rampTime + 1e-10) {
      catchType = "acceleration";
      elapsedToCatch = accelerationElapsed;
    } else if (maximumSpeed > cartSpeed + 1e-10) {
      catchType = "cruise";
      elapsedToCatch = (INITIAL_GAP + cartSpeed * delay + maximumSpeed ** 2 / (2 * acceleration)) / (maximumSpeed - cartSpeed);
    }
    const catchTime = Number.isFinite(elapsedToCatch) ? delay + elapsedToCatch : Infinity;
    const catchPosition = Number.isFinite(catchTime) ? cartPosition(catchTime, cartSpeed) : Infinity;
    const cartAtLift = cartPosition(LIFT_TIME, cartSpeed);
    const requiredTravelTime = cartAtLift <= rampDistance
      ? Math.sqrt(2 * cartAtLift / acceleration)
      : rampTime + (cartAtLift - rampDistance) / maximumSpeed;
    const latestDelay = LIFT_TIME - requiredTravelTime;
    const deadlineState = !Number.isFinite(catchTime) ? "never" : Math.abs(catchTime - LIFT_TIME) <= 0.01 ? "deadline" : catchTime < LIFT_TIME ? "early" : "late";
    return {
      rampTime,
      rampEndTime,
      rampDistance,
      discriminant,
      accelerationElapsed,
      catchType,
      elapsedToCatch,
      catchTime,
      catchPosition,
      cartAtLift,
      requiredTravelTime,
      latestDelay,
      deadlineState,
    };
  }

  const challengeValues = intercept(CHALLENGE.delay, CHALLENGE.acceleration, CHALLENGE.maximumSpeed, CHALLENGE.cartSpeed);

  function catchLabel(values = intercept()) {
    if (values.catchType === "never") return "Never catches: maximum speed is too low";
    if (values.deadlineState === "deadline") return `Catches exactly at the lift · t=${clean(values.catchTime,2)} s`;
    if (values.deadlineState === "early") return `Catches before the lift · t=${clean(values.catchTime,2)} s`;
    return `Catches after the lift · t=${clean(values.catchTime,2)} s`;
  }

  function reconstructionNote() {
    return `<p class="p81-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p81-stage-controls" role="group" aria-label="Catch-up analysis stages">${stages.map((stage,index)=>`<button class="secondary-button ${state.stage===index?"active":""}" type="button" data-problem-action="p81-stage" data-p81-stage="${index}" aria-pressed="${state.stage===index}"><span>${index+1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageHeading() {
    const stage=stages[state.stage];
    return `<div class="p81-stage-heading"><div><div class="eyebrow">Stage ${state.stage+1} of 3</div><h2>${stage.title}</h2></div><p>${stage.copy}</p><button class="ghost-button" type="button" data-problem-action="p81-next-stage" ${state.stage>=2?"disabled":""}>${state.stage>=2?"Latest start found":"Next stage"}</button></div>`;
  }

  function graphPath(fn, timeMaximum, positionMaximum, className) {
    const points=[];
    for(let index=0;index<=180;index+=1){const time=timeMaximum*index/180;points.push({x:58+time/timeMaximum*614,y:332-fn(time)/positionMaximum*245});}
    return `<path class="p81-line ${className}" d="${points.map((point,index)=>`${index?"L":"M"}${clean(point.x,2)} ${clean(point.y,2)}`).join(" ")}"/>`;
  }

  function positionGraph() {
    const values=intercept();
    const plottedCatch=Number.isFinite(values.catchTime)&&values.catchTime<=30;
    const timeMaximum=Math.max(LIFT_TIME+1.2,plottedCatch?values.catchTime+1.2:14);
    const positionMaximum=Math.max(cartPosition(timeMaximum),professorPosition(timeMaximum),1)*1.08;
    const xMap=(time)=>58+time/timeMaximum*614;
    const yMap=(position)=>332-position/positionMaximum*245;
    const delayX=xMap(state.delay),rampX=xMap(Math.min(values.rampEndTime,timeMaximum)),deadlineX=xMap(LIFT_TIME);
    const catchX=plottedCatch?xMap(values.catchTime):null,catchY=plottedCatch?yMap(values.catchPosition):null;
    return `<svg class="p81-svg p81-stage-${state.stage} is-${values.deadlineState}" viewBox="0 0 720 420" role="img" aria-labelledby="p81-svg-title p81-svg-desc"><title id="p81-svg-title">Piecewise position-time graph for Professor Lazy catching a moving cart</title><desc id="p81-svg-desc">The cart begins ${INITIAL_GAP} metres ahead and moves at ${clean(state.cartSpeed,1)} metres per second. Professor Lazy waits ${clean(state.delay,1)} seconds, accelerates at ${clean(state.acceleration,1)} metres per second squared and is capped at ${clean(state.maximumSpeed,1)} metres per second. ${catchLabel(values)}.</desc><defs><linearGradient id="p81-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5edf0"/><stop offset="1" stop-color="#f7f0de"/></linearGradient></defs><rect width="720" height="420" fill="url(#p81-bg)"/><g class="p81-axes" aria-hidden="true"><line x1="58" y1="332" x2="682" y2="332"/><line x1="58" y1="72" x2="58" y2="332"/><text x="58" y="55">position x (m)</text><text x="680" y="352" text-anchor="end">time t (s)</text></g>${graphPath((time)=>cartPosition(time),timeMaximum,positionMaximum,"is-cart")}${graphPath((time)=>professorPosition(time),timeMaximum,positionMaximum,"is-professor")}
      <g class="p81-markers" aria-hidden="true"><line class="p81-delay-marker" x1="${clean(delayX)}" y1="72" x2="${clean(delayX)}" y2="332"/><text x="${clean(delayX+5)}" y="88">starts τ=${clean(state.delay,1)} s</text><line class="p81-ramp-marker" x1="${clean(rampX)}" y1="72" x2="${clean(rampX)}" y2="332"/><text x="${clean(rampX+5)}" y="106">reaches V</text><line class="p81-deadline-marker" x1="${clean(deadlineX)}" y1="72" x2="${clean(deadlineX)}" y2="332"/><text x="${clean(deadlineX-5)}" y="88" text-anchor="end">lift T=12 s</text>${plottedCatch?`<circle class="p81-catch-point" cx="${clean(catchX)}" cy="${clean(catchY)}" r="7"/><text class="p81-catch-label" x="${clean(catchX-8)}" y="${clean(catchY-13)}" text-anchor="end">catch ${clean(values.catchTime,2)} s</text>`:""}</g>
      <g class="p81-piece-layer" aria-hidden="true"><rect x="66" y="358" width="588" height="47" rx="12"/><text x="82" y="379">xP=0 for t≤τ</text><text x="252" y="379">xP=½a(t−τ)²</text><text x="460" y="379">xP=V(t−τ)−V²/(2a)</text><text class="p81-piece-note" x="360" y="397" text-anchor="middle">joins: x and velocity are continuous</text></g>
      <g class="p81-root-layer" aria-hidden="true"><rect x="66" y="358" width="588" height="47" rx="12"/><text x="82" y="379">acceleration candidate s=${clean(values.accelerationElapsed,3)} s</text><text x="410" y="379">valid branch: ${values.catchType}</text><text class="p81-piece-note" x="360" y="397" text-anchor="middle">ramp ends after V/a=${clean(values.rampTime,3)} s of walking</text></g>
      <g class="p81-latest-layer" aria-hidden="true"><rect x="66" y="358" width="588" height="47" rx="12"/><text x="82" y="379">cart at lift: ${clean(values.cartAtLift,2)} m</text><text x="300" y="379">travel needed: ${clean(values.requiredTravelTime,3)} s</text><text x="535" y="379">τlatest=${clean(values.latestDelay,3)} s</text><text class="p81-piece-note" x="360" y="397" text-anchor="middle">latest start maximises waiting time while still intercepting by T</text></g>
      <g class="p81-status" transform="translate(473 106)"><rect width="202" height="61" rx="14"/><text class="p81-status-kicker" x="14" y="22">CURRENT PLAN</text><text class="p81-status-value" x="14" y="45">${catchLabel(values)}</text></g>
    </svg>`;
  }

  function metricsMarkup(){const v=intercept();const speedAtCatch=Number.isFinite(v.catchTime)?professorVelocity(v.catchTime):null;return `<section class="p81-metrics is-${v.deadlineState}" aria-label="Catch-up calculations"><div><span>Ramp duration V/a</span><strong>${clean(v.rampTime,3)} s</strong></div><div><span>Ramp distance</span><strong>${clean(v.rampDistance,3)} m</strong></div><div><span>Catch branch</span><strong>${v.catchType}</strong></div><div><span>Catch time</span><strong>${Number.isFinite(v.catchTime)?`${clean(v.catchTime,3)} s`:"never"}</strong></div><div><span>Professor speed at catch</span><strong>${speedAtCatch===null?"—":`${clean(speedAtCatch,3)} m/s`}</strong></div><div><span>Latest start for lift</span><strong>${v.latestDelay>=0?`${clean(v.latestDelay,3)} s`:"impossible after t=0"}</strong></div><p><strong>${catchLabel(v)}.</strong> Position residual at a finite catch: ${Number.isFinite(v.catchTime)?(professorPosition(v.catchTime)-cartPosition(v.catchTime)).toExponential(1):"not applicable"} m.</p></section>`;}
  function dynamicMarkup(){return `<div class="p81-dynamic">${positionGraph()}${metricsMarkup()}</div>`;}
  function controlsMarkup(){return `<section class="p81-controls" aria-label="Professor Lazy controls"><div class="p81-control-grid"><label for="p81-delay"><span>Waiting delay τ<output data-p81-live="delay">${clean(state.delay,1)} s</output></span><input id="p81-delay" type="range" min="0" max="8" step="0.1" value="${state.delay}"/></label><label for="p81-acceleration"><span>Walking acceleration a<output data-p81-live="acceleration">${clean(state.acceleration,1)} m/s²</output></span><input id="p81-acceleration" type="range" min="0.5" max="2" step="0.1" value="${state.acceleration}"/></label><label for="p81-max-speed"><span>Maximum walking speed V<output data-p81-live="max-speed">${clean(state.maximumSpeed,1)} m/s</output></span><input id="p81-max-speed" type="range" min="2" max="6" step="0.1" value="${state.maximumSpeed}"/></label><label for="p81-cart-speed"><span>Cart speed u<output data-p81-live="cart-speed">${clean(state.cartSpeed,1)} m/s</output></span><input id="p81-cart-speed" type="range" min="0.5" max="3.5" step="0.1" value="${state.cartSpeed}"/></label></div><div class="p81-presets" role="group" aria-label="Catch-up cases"><button class="chip-button" type="button" data-problem-action="p81-preset" data-p81-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p81-preset" data-p81-preset="acceleration">Catch while accelerating</button><button class="chip-button" type="button" data-problem-action="p81-preset" data-p81-preset="latest">Latest safe start</button><button class="chip-button" type="button" data-problem-action="p81-preset" data-p81-preset="slow">Too slow</button></div></section>`;}

  function feedbackMarkup(){return state.feedback?`<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p81-hints">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function solutionMarkup(){if(!state.revealed)return"";return `<section class="p81-solution" aria-labelledby="p81-solution-heading"><h3 id="p81-solution-heading" tabindex="-1">The valid intercept lies on the cruise branch</h3><p>Write s=t−τ after Professor Lazy starts. With τ=2 s, a=1 m/s² and V=4 m/s, acceleration lasts sr=V/a=4 s and covers ½asr²=8 m.</p><p>During acceleration,</p><div class="p81-equation">½as²=L+u(τ+s)<br>s=[u+√(u²+2a(L+uτ))]/a=${clean(challengeValues.accelerationElapsed,6)} s</div><p>This exceeds 4 s, so that quadratic root is outside its branch and must be rejected.</p><p>During cruise, continuity at s=V/a gives</p><div class="p81-equation">xP=Vs−V²/(2a)</div><p>Set it equal to xC=L+u(τ+s):</p><div class="p81-equation">s=[L+uτ+V²/(2a)]/(V−u)<br>s=${clean(challengeValues.elapsedToCatch,6)} s<br>tcatch=τ+s=${clean(challengeValues.catchTime,6)} s</div><p>The catch position is ${clean(challengeValues.catchPosition,3)} m, before the cart reaches its 12 s lift deadline.</p><p>At the deadline the cart is at L+uT=24 m. Professor Lazy needs 8 s of motion to cover that distance, so the latest permissible start is τlatest=12−8=4 s.</p><p class="p81-limits"><strong>Checks.</strong> Position and velocity are continuous at both piecewise joins. If V≤u, a professor starting behind cannot catch the cart after the acceleration cap. As a→∞, the ramp time and ramp-distance penalty tend to zero, recovering constant-speed pursuit. A negative latest delay means even starting at t=0 misses the lift. Distances are metres, velocities m/s, acceleration m/s² and every root reported as a clock time is in seconds.</p></section>`;}
  function snapshot(){const v=intercept();return JSON.stringify({problem:PROBLEM,reconstruction:true,initialCartLeadMetres:INITIAL_GAP,liftDeadlineSeconds:LIFT_TIME,delaySeconds:state.delay,walkingAccelerationMetresPerSecondSquared:state.acceleration,maximumWalkingSpeedMetresPerSecond:state.maximumSpeed,cartSpeedMetresPerSecond:state.cartSpeed,rampEndClockTimeSeconds:Number(v.rampEndTime.toFixed(6)),accelerationBranchCandidateElapsedSeconds:Number(v.accelerationElapsed.toFixed(6)),catchBranch:v.catchType,catchTimeSeconds:Number.isFinite(v.catchTime)?Number(v.catchTime.toFixed(6)):null,catchPositionMetres:Number.isFinite(v.catchPosition)?Number(v.catchPosition.toFixed(6)):null,latestDelayForLiftSeconds:Number(v.latestDelay.toFixed(6)),deadlineState:v.deadlineState,positionResidualMetres:Number.isFinite(v.catchTime)?professorPosition(v.catchTime)-cartPosition(v.catchTime):null,stage:state.stage+1,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p81-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive kinematics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p81-spread"><article class="book-page p81-problem-page"><div class="problem-number">Problem 8.1</div><h1 class="book-title p81-title">Professor Lazy</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">At t=0 a book cart is already 6.00 m ahead of Professor Lazy and moves steadily at 1.50 m/s towards a lift that closes at t=12.0 s.</p><p class="problem-copy">He waits 2.00 s, then accelerates from rest at 1.00 m/s² until reaching 4.00 m/s, after which he maintains that speed. At what clock time does he catch the cart?</p><section class="p81-plan-card"><strong>The lazy optimisation</strong><p>For any chosen acceleration and speed cap, the least walking time comes from starting as late as possible while still intercepting no later than the lift deadline.</p></section><section class="p81-model-card"><div class="eyebrow">Model</div><p>One-dimensional point motion, instantaneous changes in acceleration, no reaction delay after the chosen start, and a constant-speed cart.</p></section></article><section class="book-page book-stage p81-stage">${stageControls()}${stageHeading()}${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p81-coach"><div class="coach-kicker">Catch the cart</div><p class="coach-question">For the stated 2.00 s delay, what is the first clock time at which their positions coincide?</p><form class="p81-answer-form" data-p81-answer-form novalidate><label for="p81-answer">First intercept time</label><div><input id="p81-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="clock time" autocomplete="off"/><span>s</span></div><button class="primary-button" type="submit">Check intercept</button></form>${feedbackMarkup()}<div class="button-row p81-help-row"><button class="secondary-button" type="button" data-problem-action="p81-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p81-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p81-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(){const root=document.querySelector(".p81-shell");if(!root)return;const dynamic=root.querySelector(".p81-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();const values={delay:`${clean(state.delay,1)} s`,acceleration:`${clean(state.acceleration,1)} m/s²`,"max-speed":`${clean(state.maximumSpeed,1)} m/s`,"cart-speed":`${clean(state.cartSpeed,1)} m/s`};Object.entries(values).forEach(([key,value])=>root.querySelectorAll(`[data-p81-live="${key}"]`).forEach(node=>{node.textContent=value;}));const result=intercept();root.querySelector("#p81-delay")?.setAttribute("aria-valuetext",`Delay ${clean(state.delay,1)} seconds; ${catchLabel(result)}`);root.querySelector("#p81-acceleration")?.setAttribute("aria-valuetext",`Acceleration ${clean(state.acceleration,1)} metres per second squared; ramp ${clean(result.rampTime,2)} seconds`);root.querySelector("#p81-max-speed")?.setAttribute("aria-valuetext",`Maximum walking speed ${clean(state.maximumSpeed,1)} metres per second; catch branch ${result.catchType}`);root.querySelector("#p81-cart-speed")?.setAttribute("aria-valuetext",`Cart speed ${clean(state.cartSpeed,1)} metres per second; latest delay ${clean(result.latestDelay,2)} seconds`);}
  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}){document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p81-reset"){state=initialState();renderAndFocus(renderApp,"#p81-delay");return;}if(action==="p81-stage"){state.stage=clamp(Number(control.dataset.p81Stage),0,2);renderAndFocus(renderApp,`[data-p81-stage="${state.stage}"]`);return;}if(action==="p81-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p81-stage="${state.stage}"]`);return;}if(action==="p81-preset"){const preset=control.dataset.p81Preset;if(preset==="challenge"){state.delay=2;state.acceleration=1;state.maximumSpeed=4;state.cartSpeed=1.5;}if(preset==="acceleration"){state.delay=0;state.acceleration=2;state.maximumSpeed=6;state.cartSpeed=.5;}if(preset==="latest")state.delay=clamp(intercept().latestDelay,0,8);if(preset==="slow"){state.delay=1;state.acceleration=1;state.maximumSpeed=2;state.cartSpeed=2.5;}renderAndFocus(renderApp,"#p81-delay");return;}if(action==="p81-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p81-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p81-reveal")window.requestAnimationFrame(()=>document.querySelector("#p81-solution-heading")?.focus());}));[["#p81-delay","delay",0,8],["#p81-acceleration","acceleration",.5,2],["#p81-max-speed","maximumSpeed",2,6],["#p81-cart-speed","cartSpeed",.5,3.5]].forEach(([selector,key,min,max])=>document.querySelector(selector)?.addEventListener("input",event=>{state[key]=clamp(Number(event.target.value),min,max);updateDynamicDom();}));const input=document.querySelector("#p81-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p81-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer),target=challengeValues.catchTime;state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one clock time in seconds.";else if(Math.abs(answer-(challengeValues.accelerationElapsed+CHALLENGE.delay))<.05)state.feedback="That uses the acceleration-branch quadratic beyond the time when maximum speed is reached. Reject that root and use the cruise branch.";else if(Math.abs(answer-target)>.02)state.feedback="Find the acceleration-branch candidate, compare it with V/a, then solve the continuous cruise expression if necessary.";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: the first intercept is t=${clean(target,3)} s at x=${clean(challengeValues.catchPosition,3)} m, before the 12 s lift deadline.`;}renderAndFocus(renderApp,"#p81-answer");});}
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
