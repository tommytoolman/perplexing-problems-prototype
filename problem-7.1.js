(function registerStevinClootcransPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "7.1";
  const HEIGHT = 2;
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ leftAngle: 30, rightAngle: 60, beadDensity: 4, beadMass: 0.1 });
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Make both slopes reach the same height", copy: "The shallow side is longer and therefore carries more of the uniform chain." }),
    Object.freeze({ short: "Forces", title: "Resolve each slope’s chain weight", copy: "Only the component parallel to a smooth slope tries to move the endless chain." }),
    Object.freeze({ short: "Balance", title: "Let height cancel the angles", copy: "Length grows as 1/sinθ while the downslope fraction shrinks as sinθ. Their product is simply the common rise h." }),
  ]);
  const hints = Object.freeze([
    "If a slope of length L rises through height h at angle θ, then L sinθ=h.",
    "For uniform linear density λ, the mass on that slope is m=λL.",
    "The downslope weight component is mg sinθ=λLg sinθ.",
    "Substitute L sinθ=h. Each side pulls with λgh, independent of its angle.",
    "For the numerical question, mR=mL sin30°/sin60°=1.60/√3 kg.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p71-reset">Reset</button>';

  function radians(degrees) { return Number(degrees) * Math.PI / 180; }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18); }

  const initialState = () => ({ leftAngle: CHALLENGE.leftAngle, rightAngle: CHALLENGE.rightAngle, beadDensity: CHALLENGE.beadDensity, beadMass: CHALLENGE.beadMass, stage: 0, answer: "", committed: false, feedback: "", feedbackTone: "neutral", hintsUsed: 0, revealed: false });
  let state = initialState();

  function chainFor(leftAngle = state.leftAngle, rightAngle = state.rightAngle, beadDensity = state.beadDensity, beadMass = state.beadMass) {
    const alpha = radians(leftAngle), beta = radians(rightAngle);
    const leftLength = HEIGHT / Math.sin(alpha), rightLength = HEIGHT / Math.sin(beta);
    const linearDensity = beadDensity * beadMass;
    const leftBeads = beadDensity * leftLength, rightBeads = beadDensity * rightLength;
    const leftMass = linearDensity * leftLength, rightMass = linearDensity * rightLength;
    const leftForce = leftMass * GRAVITY * Math.sin(alpha), rightForce = rightMass * GRAVITY * Math.sin(beta);
    return { alpha, beta, leftLength, rightLength, linearDensity, leftBeads, rightBeads, leftMass, rightMass, leftForce, rightForce };
  }

  const CHALLENGE_RESULT = chainFor(CHALLENGE.leftAngle, CHALLENGE.rightAngle, CHALLENGE.beadDensity, CHALLENGE.beadMass);

  function reconstructionNote() {
    return `<p class="eq7-reconstruction-note p71-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This original activity is inspired by the historical endless-chain idea; it does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() { return `<div class="p71-stage-controls" role="group" aria-label="Endless chain explanation stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p71-stage" data-p71-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaption() { const stage = stages[state.stage]; return `<div class="p71-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p71-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Balance revealed" : "Next stage"}</button></div>`; }

  function slopeBeads(start, end, count, className) {
    const displayed = clamp(Math.round(count), 2, 38);
    return Array.from({ length: displayed }, (_, index) => {
      const fraction = (index + 0.5) / displayed;
      const x = start.x + (end.x - start.x) * fraction, y = start.y + (end.y - start.y) * fraction;
      return `<circle class="p71-bead ${className}" cx="${format(x)}" cy="${format(y)}" r="6"/>`;
    }).join("");
  }

  function loopBeads(left, right) {
    const count = 15, control = { x: (left.x + right.x) / 2, y: 390 };
    return Array.from({ length: count }, (_, index) => {
      const t = index / (count - 1), u = 1 - t;
      const x = u * u * left.x + 2 * u * t * control.x + t * t * right.x;
      const y = u * u * left.y + 2 * u * t * control.y + t * t * right.y;
      return `<circle class="p71-bead is-loop" cx="${format(x)}" cy="${format(y)}" r="6"/>`;
    }).join("");
  }

  function forceArrow(origin, direction, label, className, marker, anchor) {
    const length = 72, end = { x: origin.x + direction.x * length, y: origin.y + direction.y * length };
    return `<g class="p71-force ${className}"><line x1="${format(origin.x)}" y1="${format(origin.y)}" x2="${format(end.x)}" y2="${format(end.y)}" marker-end="url(#${marker})"/><text x="${format(end.x)}" y="${format(end.y - 9)}" text-anchor="${anchor}">${label}</text></g>`;
  }

  function chainSvg() {
    const values = chainFor();
    const peak = { x: 360, y: 102 }, baseY = 260, risePixels = baseY - peak.y;
    const left = { x: peak.x - risePixels / Math.tan(values.alpha), y: baseY };
    const right = { x: peak.x + risePixels / Math.tan(values.beta), y: baseY };
    const leftMid = { x: (left.x + peak.x) / 2, y: (left.y + peak.y) / 2 };
    const rightMid = { x: (right.x + peak.x) / 2, y: (right.y + peak.y) / 2 };
    const loopControlY = 390;
    return `
      <svg class="p71-svg p71-stage-${state.stage}" viewBox="0 0 720 440" role="img" aria-labelledby="p71-svg-title p71-svg-desc">
        <title id="p71-svg-title">Uniform endless bead chain draped over two smooth inclines</title>
        <desc id="p71-svg-desc">The left slope is ${format(state.leftAngle, 0)} degrees and length ${format(values.leftLength, 2)} metres; the right slope is ${format(state.rightAngle, 0)} degrees and length ${format(values.rightLength, 2)} metres. Both rise ${HEIGHT} metres. Their downslope chain-weight components are each ${format(values.leftForce, 3)} newtons.</desc>
        <defs><marker id="p71-arrow-left" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker><marker id="p71-arrow-right" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker></defs>
        <path class="p71-ground" d="M20 260 H700"/><path class="p71-wedge" d="M${format(left.x)} ${baseY} L${peak.x} ${peak.y} L${format(right.x)} ${baseY}Z"/>
        <path class="p71-chain-line" d="M${format(left.x)} ${baseY} L${peak.x} ${peak.y} L${format(right.x)} ${baseY} Q${format((left.x + right.x) / 2)} ${loopControlY} ${format(left.x)} ${baseY}"/>
        ${slopeBeads(left, peak, values.leftBeads, "is-left")}${slopeBeads(peak, right, values.rightBeads, "is-right")}${loopBeads(left, right)}
        <line class="p71-height" x1="360" y1="102" x2="360" y2="260"/><text class="p71-height-label" x="371" y="184">same h=${HEIGHT} m</text>
        <text class="p71-slope-label" x="${format(leftMid.x - 10)}" y="${format(leftMid.y - 24)}" text-anchor="middle">Lα=${format(values.leftLength, 2)} m · ${format(values.leftBeads, 1)} beads</text>
        <text class="p71-slope-label" x="${format(rightMid.x + 10)}" y="${format(rightMid.y - 24)}" text-anchor="middle">Lβ=${format(values.rightLength, 2)} m · ${format(values.rightBeads, 1)} beads</text>
        <text class="p71-angle-label" x="${format(left.x + 42)}" y="250">α=${format(state.leftAngle, 0)}°</text><text class="p71-angle-label" x="${format(right.x - 42)}" y="250" text-anchor="end">β=${format(state.rightAngle, 0)}°</text>
        <g class="p71-force-layer">${forceArrow(leftMid, { x: -Math.cos(values.alpha), y: Math.sin(values.alpha) }, `Fα=${format(values.leftForce, 2)} N`, "is-left", "p71-arrow-left", "end")}${forceArrow(rightMid, { x: Math.cos(values.beta), y: Math.sin(values.beta) }, `Fβ=${format(values.rightForce, 2)} N`, "is-right", "p71-arrow-right", "start")}</g>
        <g class="p71-loop-note" transform="translate(270 326)"><rect width="180" height="43" rx="11"/><text x="90" y="17" text-anchor="middle">equal-height loop ends</text><text x="90" y="33" text-anchor="middle">equal end tension · no preferred direction</text></g>
        <g class="p71-balance-layer"><rect x="150" y="393" width="420" height="33" rx="10"/><text x="360" y="414" text-anchor="middle">Fα = λgh = ${format(values.leftForce, 3)} N &nbsp; = &nbsp; Fβ</text></g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = chainFor();
    return `<section class="p71-metrics" aria-live="polite"><div><span>Left slope chain</span><strong>${format(values.leftMass, 3)} kg</strong><small>Lα=${format(values.leftLength, 3)} m</small></div><div><span>Right slope chain</span><strong>${format(values.rightMass, 3)} kg</strong><small>Lβ=${format(values.rightLength, 3)} m</small></div><div><span>Downslope pulls</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.leftForce, 3)} N each` : "stage 2"}</strong><small>${state.stage >= 2 || state.revealed ? "balanced exactly" : "resolve mg sinθ"}</small></div><p><strong>Uniform density λ=${format(values.linearDensity, 3)} kg/m.</strong> The displayed bead counts sample the continuous-chain calculation.</p></section>`;
  }

  function controlsMarkup() {
    return `<section class="p71-controls" aria-label="Endless chain controls"><label for="p71-left"><span>Left angle α<strong data-p71-output="left">${format(state.leftAngle, 0)}°</strong></span><input id="p71-left" type="range" min="25" max="70" step="1" value="${state.leftAngle}"/></label><label for="p71-right"><span>Right angle β<strong data-p71-output="right">${format(state.rightAngle, 0)}°</strong></span><input id="p71-right" type="range" min="25" max="70" step="1" value="${state.rightAngle}"/></label><label for="p71-density"><span>Bead density ρ<strong data-p71-output="density">${format(state.beadDensity, 1)} beads/m</strong></span><input id="p71-density" type="range" min="1" max="6" step="0.5" value="${state.beadDensity}"/></label><label for="p71-mass"><span>Mass per bead<strong data-p71-output="mass">${format(state.beadMass * 1000, 0)} g</strong></span><input id="p71-mass" type="range" min="0.05" max="0.25" step="0.01" value="${state.beadMass}"/></label><div class="p71-presets" role="group" aria-label="Chain geometry presets"><button class="chip-button" type="button" data-problem-action="p71-challenge">Challenge · 30°/60°</button><button class="chip-button" type="button" data-problem-action="p71-angles" data-p71-left="45" data-p71-right="45">Symmetric</button><button class="chip-button" type="button" data-problem-action="p71-angles" data-p71-left="25" data-p71-right="70">Strong contrast</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p71-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p71-solution" aria-labelledby="p71-solution-heading"><h3 id="p71-solution-heading" tabindex="-1">Longer chain, smaller slope fraction</h3><p>For either slope, geometry gives</p><div class="p71-equation">L sinθ=h</div><p>A uniform chain with linear density λ has slope mass m=λL. Its downslope weight component is</p><div class="p71-equation">F∥=mg sinθ=λLg sinθ=λgh</div><p>Both sides have the same h, λ and g, so their pulls are equal. Equivalently, for two slope masses in balance:</p><div class="p71-equation">mαg sinα=mβg sinβ</div><p>In the challenge, λ=(4 beads/m)(0.100 kg/bead)=0.400 kg/m. Thus mα=0.400(2/sin30°)=1.600 kg and</p><div class="p71-equation p71-answer-equation">mβ=mα sin30°/sin60°=1.600/√3=${format(CHALLENGE_RESULT.rightMass, 6)} kg</div><p>Each side pulls with λgh=(0.400)(9.81)(2)=${format(CHALLENGE_RESULT.leftForce, 3)} N. The freely hanging lower loop has ends at equal height and cannot select a direction, matching this balance.</p><p class="p71-insight"><strong>Checks.</strong> λ has units kg/m, so λgh has units N. Equal angles give equal slope masses. As θ→90°, L→h; as θ→0°, L and mass grow without bound but L sinθ remains h, so the downslope pull stays finite.</p></section>`;
  }

  function stateSnapshot() { const values = chainFor(); return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", commonRiseMetres: HEIGHT, leftAngleDegrees: state.leftAngle, rightAngleDegrees: state.rightAngle, beadDensityPerMetre: state.beadDensity, beadMassKg: state.beadMass, linearDensityKgPerMetre: Number(values.linearDensity.toFixed(6)), leftSlopeLengthMetres: Number(values.leftLength.toFixed(6)), rightSlopeLengthMetres: Number(values.rightLength.toFixed(6)), leftSlopeMassKg: Number(values.leftMass.toFixed(6)), rightSlopeMassKg: Number(values.rightMass.toFixed(6)), leftDownslopeForceNewtons: Number(values.leftForce.toFixed(6)), rightDownslopeForceNewtons: Number(values.rightForce.toFixed(6)), forceResidualNewtons: values.leftForce - values.rightForce, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2); }

  function render() {
    return `<main class="book-shell eq7-shell p71-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive equilibrium</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread eq7-spread p71-spread"><article class="book-page p71-problem-page"><div class="problem-number">Problem 7.1</div><h1 class="book-title eq7-title p71-title">Stevin’s clootcrans</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">A uniform endless bead chain lies on two smooth slopes that rise through the same vertical height of 2.0 m, then returns in a freely hanging loop.</p><p class="problem-copy">For the numerical case, the slopes are 30° and 60°. There are 4 beads per metre and each bead has mass 0.100 kg. The 30° slope carries 1.60 kg of chain. <strong>What mass lies on the 60° slope?</strong></p><section class="p71-history-card"><strong>Historical idea, new exercise</strong><p>The activity uses the celebrated “wreath of spheres” balance insight: an endless uniform chain cannot choose a perpetual direction of motion.</p></section><section class="p71-model-card"><strong>Continuous model</strong><p>λ=ρmb converts bead density and bead mass into uniform linear density. Rounded visible beads illustrate the chain; calculations retain the continuous lengths.</p></section></article><section class="book-page book-stage eq7-stage p71-stage">${stageControls()}<div class="p71-visual-card"><div data-p71-svg-slot>${chainSvg()}</div>${stageCaption()}</div>${controlsMarkup()}<div data-p71-metrics-slot>${metricsMarkup()}</div></section><aside class="book-page book-coach p71-coach"><div class="coach-kicker">Balance the wreath</div><p class="coach-question">For the fixed 30°/60° numerical case, find the chain mass on the steeper slope.</p><form class="p71-answer-form" data-p71-answer-form novalidate><label for="p71-answer">Mass on the 60° slope</label><div><input id="p71-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 0.90" autocomplete="off"/><span>kg</span></div><button class="primary-button" type="submit">Check the balance</button></form>${feedbackMarkup()}<div class="button-row p71-help-row"><button class="secondary-button" type="button" data-problem-action="p71-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p71-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="eq7-debug">${debugPanel("Development state", stateSnapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p71-shell"); if (!root) return;
    const svgSlot = root.querySelector("[data-p71-svg-slot]"), metricsSlot = root.querySelector("[data-p71-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = chainSvg(); if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = { left: `${format(state.leftAngle, 0)}°`, right: `${format(state.rightAngle, 0)}°`, density: `${format(state.beadDensity, 1)} beads/m`, mass: `${format(state.beadMass * 1000, 0)} g` };
    Object.entries(outputs).forEach(([key, value]) => { const node = root.querySelector(`[data-p71-output="${key}"]`); if (node) node.textContent = value; });
    const values = chainFor();
    root.querySelector("#p71-left")?.setAttribute("aria-valuetext", `${format(state.leftAngle, 0)} degrees; ${format(values.leftMass, 3)} kilograms on left slope`);
    root.querySelector("#p71-right")?.setAttribute("aria-valuetext", `${format(state.rightAngle, 0)} degrees; ${format(values.rightMass, 3)} kilograms on right slope`);
    root.querySelector("#p71-density")?.setAttribute("aria-valuetext", `${format(state.beadDensity, 1)} beads per metre; linear density ${format(values.linearDensity, 3)} kilograms per metre`);
    root.querySelector("#p71-mass")?.setAttribute("aria-valuetext", `${format(state.beadMass * 1000, 0)} grams per bead; linear density ${format(values.linearDensity, 3)} kilograms per metre`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function restoreChallenge() { state.leftAngle = CHALLENGE.leftAngle; state.rightAngle = CHALLENGE.rightAngle; state.beadDensity = CHALLENGE.beadDensity; state.beadMass = CHALLENGE.beadMass; }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p71-reset") { state = initialState(); renderAndFocus(renderApp, "#p71-left"); return; }
      if (action === "p71-stage") { state.stage = clamp(Number(control.dataset.p71Stage), 0, 2); renderAndFocus(renderApp, `[data-p71-stage="${state.stage}"]`); return; }
      if (action === "p71-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p71-stage="${state.stage}"]`); return; }
      if (action === "p71-challenge") { restoreChallenge(); renderAndFocus(renderApp, "#p71-left"); return; }
      if (action === "p71-angles") { state.leftAngle = clamp(Number(control.dataset.p71Left), 25, 70); state.rightAngle = clamp(Number(control.dataset.p71Right), 25, 70); renderAndFocus(renderApp, "#p71-left"); return; }
      if (action === "p71-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p71-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p71-reveal") window.requestAnimationFrame(() => document.querySelector("#p71-solution-heading")?.focus());
    }));
    [{ selector: "#p71-left", key: "leftAngle", min: 25, max: 70 }, { selector: "#p71-right", key: "rightAngle", min: 25, max: 70 }, { selector: "#p71-density", key: "beadDensity", min: 1, max: 6 }, { selector: "#p71-mass", key: "beadMass", min: 0.05, max: 0.25 }].forEach(({ selector, key, min, max }) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), min, max); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p71-answer"); answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p71-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one chain mass in kilograms.";
      else if (Math.abs(answer - CHALLENGE_RESULT.rightMass) <= 0.004) { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: mβ=1.60 sin30°/sin60°=${format(CHALLENGE_RESULT.rightMass, 6)} kg. Both slopes pull with ${format(CHALLENGE_RESULT.leftForce, 3)} N.`; }
      else if (Math.abs(answer - CHALLENGE_RESULT.leftMass) <= 0.01) state.feedback = "Equal slope masses would only apply at equal angles. The 60° slope is shorter, so it contains less chain.";
      else state.feedback = "Use mα sinα=mβ sinβ. The steeper side needs less mass because a larger fraction of its weight acts down the slope.";
      renderAndFocus(renderApp, "#p71-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
