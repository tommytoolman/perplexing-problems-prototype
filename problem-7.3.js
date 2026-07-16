(function registerOverbalancedWheelPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "7.3";
  const GRAVITY = 9.81;
  const OUTER_RADIUS = 1;
  const CHALLENGE = Object.freeze({ count: 8, mass: 2, innerRadius: 0.6 });
  const CHALLENGE_WORK = 2 * CHALLENGE.count * CHALLENGE.mass * GRAVITY * (OUTER_RADIUS - CHALLENGE.innerRadius);
  const stages = Object.freeze([
    Object.freeze({ short: "Snapshot", title: "Put longer levers on the descending side", copy: "Weights on the right sit farther from the axle; weights on the left retract inward. A snapshot can indeed show positive clockwise torque." }),
    Object.freeze({ short: "Torque", title: "Sum every signed gravitational moment", copy: "Clockwise torque is positive. Each contribution is τ=mgr sinφ, with φ measured clockwise from the top." }),
    Object.freeze({ short: "Cycle", title: "Audit the hidden radial resets", copy: "Every weight must extend at the top and retract at the bottom. Both operations lift it and consume exactly the apparent gravitational work." }),
  ]);
  const hints = Object.freeze([
    "For a weight at clockwise angle φ from the top, its horizontal lever arm is x=r sinφ. Hence clockwise gravitational torque is τ=mgx=mgr sinφ.",
    "During the right-hand descent use rout; during the left-hand ascent use rin. Integrate one weight’s torque through both half-turns.",
    "Gravity does 2mgrout on the descending half and −2mgrin on the ascending half, apparently leaving 2mg(rout−rin).",
    "At the top, extending from rin to rout raises the weight by rout−rin. At the bottom, retracting it also raises the weight by rout−rin.",
    "The two resets cost 2mg(rout−rin) per weight. Multiply by N; this exactly cancels the cycle’s apparent gravitational gain.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p73-reset">Reset</button>';

  function radians(degrees) { return Number(degrees) * Math.PI / 180; }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 3) { if (Math.abs(value) < 0.5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18); }

  const initialState = () => ({ angle: 12, count: CHALLENGE.count, mass: CHALLENGE.mass, innerRadius: CHALLENGE.innerRadius, stage: 0, answer: "", committed: false, feedback: "", feedbackTone: "neutral", hintsUsed: 0, revealed: false });
  let state = initialState();

  function wheelFor(angle = state.angle, count = state.count, mass = state.mass, innerRadius = state.innerRadius) {
    const offset = radians(angle);
    const weights = Array.from({ length: Math.round(count) }, (_, index) => {
      const phase = offset + 2 * Math.PI * index / Math.round(count);
      const sine = Math.sin(phase), cosine = Math.cos(phase);
      const descending = sine >= 0;
      const radius = descending ? OUTER_RADIUS : innerRadius;
      const torque = mass * GRAVITY * radius * sine;
      const potential = mass * GRAVITY * radius * cosine;
      return { index, phase, sine, cosine, descending, radius, torque, potential };
    });
    const instantaneousTorque = weights.reduce((sum, weight) => sum + weight.torque, 0);
    const potentialEnergy = weights.reduce((sum, weight) => sum + weight.potential, 0);
    const gravityCycleWork = 2 * Math.round(count) * mass * GRAVITY * (OUTER_RADIUS - innerRadius);
    const resetWork = gravityCycleWork;
    const netCycleWork = gravityCycleWork - resetWork;
    return { weights, instantaneousTorque, potentialEnergy, gravityCycleWork, resetWork, netCycleWork, meanApparentTorque: gravityCycleWork / (2 * Math.PI) };
  }

  function reconstructionNote() {
    return `<p class="eq7-reconstruction-note p73-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This is a newly written torque audit of a generic overbalanced-wheel claim; it does not reproduce the book’s wording, mechanism or solution.</p>`;
  }

  function stageControls() { return `<div class="p73-stage-controls" role="group" aria-label="Wheel audit stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p73-stage" data-p73-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaption() { const stage = stages[state.stage]; return `<div class="p73-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p73-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Cycle audited" : "Next stage"}</button></div>`; }

  function weightMarkup(weight, centre, scale) {
    const x = centre.x + weight.radius * scale * weight.sine;
    const y = centre.y - weight.radius * scale * weight.cosine;
    const className = weight.descending ? "is-descending" : "is-ascending";
    return `<g class="p73-weight ${className}"><line class="p73-spoke" x1="${centre.x}" y1="${centre.y}" x2="${format(x)}" y2="${format(y)}"/><circle cx="${format(x)}" cy="${format(y)}" r="9"/><line class="p73-gravity-arrow" x1="${format(x)}" y1="${format(y + 11)}" x2="${format(x)}" y2="${format(y + 34)}"/><text x="${format(x + (weight.descending ? 14 : -14))}" y="${format(y - 13)}" text-anchor="${weight.descending ? "start" : "end"}">${signed(weight.torque, 1)} N·m</text></g>`;
  }

  function wheelSvg() {
    const values = wheelFor();
    const centre = { x: 285, y: 206 }, scale = 132;
    const apparentWidth = clamp(values.gravityCycleWork / 300, 0, 1) * 205;
    const torqueDirection = values.instantaneousTorque > 1e-7 ? "clockwise" : values.instantaneousTorque < -1e-7 ? "anticlockwise" : "zero";
    return `
      <svg class="p73-svg p73-stage-${state.stage}" viewBox="0 0 720 455" role="img" aria-labelledby="p73-svg-title p73-svg-desc">
        <title id="p73-svg-title">Torque and work audit of an overbalanced wheel</title>
        <desc id="p73-svg-desc">${state.count} weights of ${format(state.mass, 2)} kilograms. Descending weights use radius ${OUTER_RADIUS} metre and ascending weights radius ${format(state.innerRadius, 2)} metres. At wheel angle ${format(state.angle, 0)} degrees total clockwise torque is ${signed(values.instantaneousTorque, 3)} newton metres. Apparent gravitational cycle work and required reset work are both ${format(values.gravityCycleWork, 3)} joules, so net cycle work is zero.</desc>
        <defs><marker id="p73-arrow-turn" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker></defs>
        <path class="p73-right-sector" d="M285 74 A132 132 0 0 1 285 338 L285 206Z"/><path class="p73-left-sector" d="M285 338 A132 132 0 0 1 285 74 L285 206Z"/>
        <circle class="p73-wheel-rim" cx="${centre.x}" cy="${centre.y}" r="${scale}"/><circle class="p73-inner-guide" cx="${centre.x}" cy="${centre.y}" r="${format(scale * state.innerRadius)}"/><line class="p73-divider" x1="285" y1="62" x2="285" y2="350"/>
        ${values.weights.map((weight) => weightMarkup(weight, centre, scale)).join("")}
        <circle class="p73-hub" cx="${centre.x}" cy="${centre.y}" r="14"/><path class="p73-turn-arrow" d="M${centre.x + 54} ${centre.y - 92} A108 108 0 0 1 ${centre.x + 108} ${centre.y}" marker-end="url(#p73-arrow-turn)"/>
        <text class="p73-sector-label" x="188" y="57" text-anchor="middle">ascending · rin=${format(state.innerRadius, 2)} m</text><text class="p73-sector-label" x="390" y="57" text-anchor="middle">descending · rout=1.00 m</text>
        <g class="p73-reset-layer"><circle cx="285" cy="74" r="16"/><circle cx="285" cy="338" r="16"/><text x="285" y="48" text-anchor="middle">extend at top · lift by Δr</text><text x="285" y="372" text-anchor="middle">retract at bottom · lift by Δr</text></g>
        <g class="p73-status" transform="translate(493 89)"><rect width="194" height="76" rx="13"/><text class="p73-status-kicker" x="97" y="20" text-anchor="middle">INSTANTANEOUS AUDIT</text><text class="p73-status-value" x="97" y="42" text-anchor="middle">τ=${signed(values.instantaneousTorque, 3)} N·m</text><text class="p73-status-detail" x="97" y="60" text-anchor="middle">${torqueDirection} at this angle</text></g>
        <g class="p73-cycle-layer"><text class="p73-cycle-title" x="474" y="206">One full wheel turn</text><rect class="p73-work-base" x="474" y="228" width="205" height="18" rx="7"/><rect class="p73-work-gravity" x="474" y="228" width="${format(apparentWidth)}" height="18" rx="7"/><text x="474" y="263">gravity: +${format(values.gravityCycleWork, 2)} J</text><rect class="p73-work-base" x="474" y="285" width="205" height="18" rx="7"/><rect class="p73-work-reset" x="474" y="285" width="${format(apparentWidth)}" height="18" rx="7"/><text x="474" y="320">resets: −${format(values.resetWork, 2)} J</text><rect class="p73-net-box" x="474" y="337" width="205" height="42" rx="10"/><text class="p73-net" x="576.5" y="363" text-anchor="middle">net cycle work = ${format(values.netCycleWork, 2)} J</text></g>
        <g class="p73-equation-layer"><rect x="102" y="395" width="516" height="38" rx="11"/><text x="360" y="419" text-anchor="middle">Wg=2Nmg(rout−rin) &nbsp; = &nbsp; Wreset &nbsp; ⇒ &nbsp; ΔEcycle=0</text></g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = wheelFor();
    return `<section class="p73-metrics" aria-live="polite"><div><span>Current total torque</span><strong>${state.stage >= 1 || state.revealed ? `${signed(values.instantaneousTorque, 3)} N·m` : "stage 2"}</strong></div><div><span>Apparent gravity work</span><strong>${state.stage >= 2 || state.revealed ? `+${format(values.gravityCycleWork, 3)} J/turn` : "stage 3"}</strong><small>mean τ=${format(values.meanApparentTorque, 3)} N·m</small></div><div><span>Reset and net work</span><strong>${state.stage >= 2 || state.revealed ? `−${format(values.resetWork, 3)} J · net 0` : "stage 3"}</strong></div><p><strong>Potential energy returns to its starting value only after reset work is included.</strong> Current weight potential relative to the axle: ${signed(values.potentialEnergy, 2)} J.</p></section>`;
  }

  function controlsMarkup() {
    return `<section class="p73-controls" aria-label="Overbalanced wheel controls"><label for="p73-angle"><span>Wheel angle<strong data-p73-output="angle">${format(state.angle, 0)}°</strong></span><input id="p73-angle" type="range" min="0" max="360" step="1" value="${state.angle}"/></label><label for="p73-count"><span>Number of weights N<strong data-p73-output="count">${format(state.count, 0)}</strong></span><input id="p73-count" type="range" min="3" max="16" step="1" value="${state.count}"/></label><label for="p73-mass"><span>Mass of each weight m<strong data-p73-output="mass">${format(state.mass, 2)} kg</strong></span><input id="p73-mass" type="range" min="0.5" max="5" step="0.1" value="${state.mass}"/></label><label for="p73-radius"><span>Retracted radius rin<strong data-p73-output="radius">${format(state.innerRadius, 2)} m</strong></span><input id="p73-radius" type="range" min="0.2" max="1" step="0.05" value="${state.innerRadius}"/></label><div class="p73-presets" role="group" aria-label="Wheel presets"><button class="chip-button" type="button" data-problem-action="p73-challenge">Challenge setup</button><button class="chip-button" type="button" data-problem-action="p73-angle-step" data-p73-angle="0">Reset angle</button><button class="chip-button" type="button" data-problem-action="p73-angle-step" data-p73-angle="22.5">Turn 22.5°</button><button class="chip-button" type="button" data-problem-action="p73-fixed">No extension</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p73-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p73-solution" aria-labelledby="p73-solution-heading"><h3 id="p73-solution-heading" tabindex="-1">The reset mechanism lifts every weight twice</h3><p>Measure φ clockwise from the top. A weight at radius r has horizontal lever arm r sinφ, so</p><div class="p73-equation">τ=mgr sinφ</div><p>On the extended descending half, gravity does</p><div class="p73-equation">∫₀^π mgrout sinφ dφ=2mgrout</div><p>On the retracted ascending half it does −2mgrin. Therefore the apparent gain per weight is 2mg(rout−rin), and for N weights:</p><div class="p73-equation">Wgravity=2Nmg(rout−rin)</div><p>But extension at the top raises a weight by Δr, and retraction at the bottom raises it by Δr again. Ideal reset work is therefore the same:</p><div class="p73-equation p73-answer-equation">Wreset=2NmgΔr=2(8)(2)(9.81)(0.40)=${format(CHALLENGE_WORK, 3)} J</div><p>The exact requested reset input is <strong>${format(CHALLENGE_WORK, 3)} J per wheel revolution</strong>. Even with perfect hinges and no friction, net work is zero.</p><p class="p73-insight"><strong>Checks.</strong> Torque mgr has units N·m and its angular integral has units J. If rin=rout, instantaneous torques of uniformly spaced weights cancel and both cycle-work terms vanish. Reversing the sign convention changes every torque sign but not the zero net-energy result.</p></section>`;
  }

  function stateSnapshot() { const values = wheelFor(); return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", wheelAngleDegrees: state.angle, weightCount: state.count, eachWeightMassKg: state.mass, outerRadiusMetres: OUTER_RADIUS, innerRadiusMetres: state.innerRadius, instantaneousClockwiseTorqueNewtonMetres: Number(values.instantaneousTorque.toFixed(6)), currentPotentialEnergyRelativeToAxleJoules: Number(values.potentialEnergy.toFixed(6)), apparentGravityCycleWorkJoules: Number(values.gravityCycleWork.toFixed(6)), requiredResetWorkJoules: Number(values.resetWork.toFixed(6)), netCycleWorkJoules: values.netCycleWork, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2); }

  function render() {
    return `<main class="book-shell eq7-shell p73-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive equilibrium</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread eq7-spread p73-spread"><article class="book-page p73-problem-page"><div class="problem-number">Problem 7.3</div><h1 class="book-title eq7-title p73-title">The overbalanced wheel</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">Eight identical 2.0 kg weights extend to radius 1.00 m on the descending side of a wheel and retract to 0.60 m on the ascending side. The mechanism claims a permanent clockwise surplus.</p><p class="problem-copy"><strong>What minimum ideal reset work is required per complete wheel revolution?</strong></p><section class="p73-sign-card"><strong>Torque convention</strong><p>Angle φ is measured clockwise from the top. Clockwise gravitational torque is positive: τ=mgr sinφ.</p></section><section class="p73-audit-card"><strong>Audit boundary</strong><p>Axle friction and impacts are ignored. The radial switching mechanism is included because it changes gravitational potential energy.</p></section></article><section class="book-page book-stage eq7-stage p73-stage">${stageControls()}<div class="p73-visual-card"><div data-p73-svg-slot>${wheelSvg()}</div>${stageCaption()}</div>${controlsMarkup()}<div data-p73-metrics-slot>${metricsMarkup()}</div></section><aside class="book-page book-coach p73-coach"><div class="coach-kicker">Close the energy ledger</div><p class="coach-question">For N=8, m=2.0 kg, rout=1.00 m and rin=0.60 m, calculate the ideal radial reset work per turn.</p><form class="p73-answer-form" data-p73-answer-form novalidate><label for="p73-answer">Required reset work</label><div><input id="p73-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 120" autocomplete="off"/><span>J/turn</span></div><button class="primary-button" type="submit">Check the cycle</button></form>${feedbackMarkup()}<div class="button-row p73-help-row"><button class="secondary-button" type="button" data-problem-action="p73-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p73-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="eq7-debug">${debugPanel("Development state", stateSnapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p73-shell"); if (!root) return;
    const svgSlot = root.querySelector("[data-p73-svg-slot]"), metricsSlot = root.querySelector("[data-p73-metrics-slot]"); if (svgSlot) svgSlot.innerHTML = wheelSvg(); if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = { angle: `${format(state.angle, 0)}°`, count: format(state.count, 0), mass: `${format(state.mass, 2)} kg`, radius: `${format(state.innerRadius, 2)} m` };
    Object.entries(outputs).forEach(([key, value]) => { const node = root.querySelector(`[data-p73-output="${key}"]`); if (node) node.textContent = value; });
    const values = wheelFor();
    root.querySelector("#p73-angle")?.setAttribute("aria-valuetext", `${format(state.angle, 0)} degree wheel angle; total clockwise torque ${signed(values.instantaneousTorque, 3)} newton metres`);
    root.querySelector("#p73-count")?.setAttribute("aria-valuetext", `${format(state.count, 0)} weights; reset work ${format(values.resetWork, 2)} joules per turn`);
    root.querySelector("#p73-mass")?.setAttribute("aria-valuetext", `${format(state.mass, 2)} kilograms each; reset work ${format(values.resetWork, 2)} joules per turn`);
    root.querySelector("#p73-radius")?.setAttribute("aria-valuetext", `${format(state.innerRadius, 2)} metre retracted radius; reset work ${format(values.resetWork, 2)} joules per turn`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function restoreChallenge() { state.count = CHALLENGE.count; state.mass = CHALLENGE.mass; state.innerRadius = CHALLENGE.innerRadius; state.angle = 12; }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p73-reset") { state = initialState(); renderAndFocus(renderApp, "#p73-angle"); return; }
      if (action === "p73-stage") { state.stage = clamp(Number(control.dataset.p73Stage), 0, 2); renderAndFocus(renderApp, `[data-p73-stage="${state.stage}"]`); return; }
      if (action === "p73-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p73-stage="${state.stage}"]`); return; }
      if (action === "p73-challenge") { restoreChallenge(); renderAndFocus(renderApp, "#p73-angle"); return; }
      if (action === "p73-angle-step") { state.angle = (state.angle + Number(control.dataset.p73Angle)) % 360; renderAndFocus(renderApp, "#p73-angle"); return; }
      if (action === "p73-fixed") { state.innerRadius = OUTER_RADIUS; renderAndFocus(renderApp, "#p73-radius"); return; }
      if (action === "p73-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p73-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p73-reveal") window.requestAnimationFrame(() => document.querySelector("#p73-solution-heading")?.focus());
    }));
    [{ selector: "#p73-angle", key: "angle", min: 0, max: 360 }, { selector: "#p73-count", key: "count", min: 3, max: 16 }, { selector: "#p73-mass", key: "mass", min: 0.5, max: 5 }, { selector: "#p73-radius", key: "innerRadius", min: 0.2, max: 1 }].forEach(({ selector, key, min, max }) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), min, max); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p73-answer"); answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p73-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one reset-work value in joules per turn.";
      else if (Math.abs(answer - CHALLENGE_WORK) <= 0.12) { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: Wreset=${format(CHALLENGE_WORK, 3)} J/turn, exactly cancelling the apparent gravitational gain.`; }
      else if (Math.abs(answer - CHALLENGE_WORK / 2) <= 0.12) state.feedback = "That accounts for only one radial lift. Each weight is raised once while extending at the top and again while retracting at the bottom.";
      else state.feedback = "Each weight is lifted through Δr twice per revolution. Use Wreset=2Nmg(rout−rin).";
      renderAndFocus(renderApp, "#p73-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
