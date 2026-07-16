(function registerEquivalentCollisionStatementsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "4.7";
  const stages = Object.freeze([
    Object.freeze({ short: "Momentum", title: "One conserved total", copy: "Signed momentum fixes the centre-of-mass velocity C. It supplies one equation for the two outgoing velocities." }),
    Object.freeze({ short: "Restitution", title: "One relative-speed rule", copy: "The separation speed v₂−v₁ is e times the approach speed u₁−u₂. Together with momentum, this closes the system." }),
    Object.freeze({ short: "Impulse", title: "One internal impulse pair", copy: "Body 1 loses impulse J and body 2 gains the same J. Restitution determines exactly how large that transfer must be." }),
    Object.freeze({ short: "COM frame", title: "Reverse and scale about C", copy: "Relative to the centre of mass, each outgoing velocity is its incoming value reversed and multiplied by e." }),
  ]);
  const hints = Object.freeze([
    "First compute total momentum P=m₁u₁+m₂u₂ and C=P/(m₁+m₂). Momentum conservation says the same C applies after impact.",
    "Restitution gives v₂−v₁=e(u₁−u₂). Solve this simultaneously with m₁v₁+m₂v₂=P.",
    "Equivalently define J positive on body 2: v₁=u₁−J/m₁ and v₂=u₂+J/m₂. Then J=(1+e)(u₁−u₂)/(1/m₁+1/m₂).",
    "In the COM frame, v₁−C=−e(u₁−C) and v₂−C=−e(u₂−C). Add C back to recover the laboratory velocities.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ id: "baseline", label: "Baseline", m1: 2, m2: 3, u1: 5, u2: -1, e: 0.6 }),
    Object.freeze({ id: "equal", label: "Equal + elastic", m1: 2, m2: 2, u1: 4, u2: -2, e: 1 }),
    Object.freeze({ id: "sticky", label: "e = 0", m1: 2, m2: 3, u1: 5, u2: -1, e: 0 }),
    Object.freeze({ id: "target", label: "Stationary target", m1: 1, m2: 3, u1: 6, u2: 0, e: 0.5 }),
    Object.freeze({ id: "degenerate", label: "No approach", m1: 2, m2: 2, u1: 0, u2: 0, e: 0.8 }),
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p47-reset">Reset</button>';

  const initialState = () => ({
    m1: 2,
    m2: 3,
    u1: 5,
    u2: -1,
    restitution: 0.6,
    activePreset: "baseline",
    stage: 0,
    v1Answer: "",
    v2Answer: "",
    impulseAnswer: "",
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

  function collision() {
    const totalMass = state.m1 + state.m2;
    const totalMomentum = state.m1 * state.u1 + state.m2 * state.u2;
    const centreVelocity = totalMomentum / totalMass;
    const approachSpeed = state.u1 - state.u2;
    const separationSpeed = state.restitution * approachSpeed;
    const impulse = approachSpeed <= 1e-12
      ? 0
      : (1 + state.restitution) * approachSpeed / (1 / state.m1 + 1 / state.m2);
    const v1 = state.u1 - impulse / state.m1;
    const v2 = state.u2 + impulse / state.m2;
    const momentumAfter = state.m1 * v1 + state.m2 * v2;
    const energyBefore = 0.5 * state.m1 * state.u1 ** 2 + 0.5 * state.m2 * state.u2 ** 2;
    const energyAfter = 0.5 * state.m1 * v1 ** 2 + 0.5 * state.m2 * v2 ** 2;
    const reducedMass = state.m1 * state.m2 / totalMass;
    const expectedEnergyLoss = 0.5 * reducedMass * (1 - state.restitution ** 2) * approachSpeed ** 2;
    return {
      totalMass,
      totalMomentum,
      centreVelocity,
      approachSpeed,
      separationSpeed,
      impulse,
      v1,
      v2,
      momentumAfter,
      energyBefore,
      energyAfter,
      energyLoss: energyBefore - energyAfter,
      expectedEnergyLoss,
      u1Com: state.u1 - centreVelocity,
      u2Com: state.u2 - centreVelocity,
      v1Com: v1 - centreVelocity,
      v2Com: v2 - centreVelocity,
      degenerate: approachSpeed <= 1e-12,
    };
  }

  function reconstructionNote() {
    return `
      <p class="p47-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function stageTabs() {
    return `
      <div class="p47-stage-tabs" role="group" aria-label="Equivalent collision statements">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p47-stage" data-p47-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageHeading() {
    const stage = stages[state.stage];
    return `
      <div class="p47-stage-heading">
        <div><div class="eyebrow">Statement ${state.stage + 1} of 4</div><h2>${stage.title}</h2></div>
        <p>${stage.copy}</p>
        <button class="ghost-button" type="button" data-problem-action="p47-next-stage" ${state.stage >= 3 ? "disabled" : ""}>${state.stage >= 3 ? "All four agree" : "Next statement"}</button>
      </div>`;
  }

  function velocityArrow(x, y, velocity, body, label) {
    const direction = velocity < 0 ? -1 : 1;
    const length = Math.abs(velocity) < 0.005 ? 0 : Math.min(118, 22 + Math.abs(velocity) * 13);
    const end = x + direction * length;
    return `
      <g class="p47-velocity is-${body}">
        ${length ? `<line x1="${x}" y1="${y}" x2="${clean(end)}" y2="${y}" marker-end="url(#p47-${body}-arrow)" />` : `<circle cx="${x}" cy="${y}" r="5" />`}
        <text x="${clean((x + end) / 2)}" y="${y - 10}">${label}=${signed(velocity, 2)} m/s</text>
      </g>`;
  }

  function bodyMarkup(x, y, body, mass) {
    const radius = 21 + Math.min(12, (mass - 0.5) * 3);
    return `
      <g class="p47-body is-${body}" aria-hidden="true">
        <circle cx="${x}" cy="${y}" r="${clean(radius)}" />
        <text x="${x}" y="${y + 4}">${body === "one" ? "1" : "2"}</text>
        <text class="p47-mass-label" x="${x}" y="${y + radius + 17}">m${body === "one" ? "₁" : "₂"}=${clean(mass, 1)} kg</text>
      </g>`;
  }

  function lensOverlay(result) {
    if (state.stage === 0) {
      return `
        <g class="p47-lens-overlay p47-momentum-overlay" aria-hidden="true">
          <rect x="94" y="340" width="532" height="67" rx="13" />
          <text class="p47-overlay-kicker" x="112" y="362">MOMENTUM CONSERVATION</text>
          <text class="p47-overlay-equation" x="112" y="386">Pbefore=${signed(result.totalMomentum, 3)} = Pafter=${signed(result.momentumAfter, 3)} kg·m/s</text>
          <text class="p47-overlay-note" x="608" y="386" text-anchor="end">C=${signed(result.centreVelocity, 3)} m/s</text>
        </g>`;
    }
    if (state.stage === 1) {
      return `
        <g class="p47-lens-overlay p47-relative-overlay" aria-hidden="true">
          <rect x="94" y="340" width="532" height="67" rx="13" />
          <text class="p47-overlay-kicker" x="112" y="362">RELATIVE-SPEED RESTITUTION</text>
          <text class="p47-overlay-equation" x="112" y="386">v₂−v₁=${clean(result.separationSpeed, 3)} = e(u₁−u₂)=${clean(state.restitution, 2)}×${clean(result.approachSpeed, 3)} m/s</text>
        </g>`;
    }
    if (state.stage === 2) {
      return `
        <g class="p47-lens-overlay p47-impulse-overlay" aria-hidden="true">
          <rect x="94" y="340" width="532" height="67" rx="13" />
          <text class="p47-overlay-kicker" x="112" y="362">EQUAL AND OPPOSITE IMPULSES</text>
          <text class="p47-overlay-equation" x="112" y="386">m₁(v₁−u₁)=${signed(-result.impulse, 3)}, &nbsp; m₂(v₂−u₂)=${signed(result.impulse, 3)} kg·m/s</text>
        </g>`;
    }
    return `
      <g class="p47-lens-overlay p47-com-overlay" aria-hidden="true">
        <rect x="70" y="334" width="580" height="79" rx="13" />
        <text class="p47-overlay-kicker" x="90" y="356">CENTRE-OF-MASS FRAME · C=${signed(result.centreVelocity, 3)} m/s</text>
        <text class="p47-overlay-equation" x="90" y="380">v₁−C=${signed(result.v1Com, 3)} = −e(u₁−C), &nbsp; v₂−C=${signed(result.v2Com, 3)} = −e(u₂−C)</text>
        <text class="p47-overlay-note" x="90" y="400">Each COM-frame velocity reverses and shrinks by the same factor e.</text>
      </g>`;
  }

  function collisionSvg() {
    const result = collision();
    return `
      <svg class="p47-svg p47-stage-${state.stage} ${result.degenerate ? "is-degenerate" : ""}" viewBox="0 0 720 430" role="img" aria-labelledby="p47-svg-title p47-svg-desc">
        <title id="p47-svg-title">Two-body linear collision viewed through equivalent statements</title>
        <desc id="p47-svg-desc">Body 1 of mass ${clean(state.m1, 1)} kilograms approaches at ${signed(state.u1)} metres per second and body 2 of mass ${clean(state.m2, 1)} kilograms approaches at ${signed(state.u2)} metres per second. Restitution is ${clean(state.restitution, 2)}. Outgoing velocities are ${signed(result.v1)} and ${signed(result.v2)} metres per second. ${result.degenerate ? "There is no relative approach and therefore no collision impulse." : "All four collision statements have zero numerical residual."}</desc>
        <defs>
          <marker id="p47-one-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p47-two-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p47-axis-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <linearGradient id="p47-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4edf0"/><stop offset="1" stop-color="#f7f0df"/></linearGradient>
        </defs>
        <rect width="720" height="430" fill="url(#p47-bg)" />
        <g class="p47-axis" aria-hidden="true"><line x1="43" y1="30" x2="677" y2="30" marker-end="url(#p47-axis-arrow)"/><text x="43" y="19">−x</text><text x="677" y="19">+x</text></g>

        <g class="p47-before">
          <text class="p47-lane-title" x="43" y="64">BEFORE · APPROACH SPEED ${clean(result.approachSpeed, 2)} m/s</text>
          <line class="p47-track" x1="43" y1="160" x2="677" y2="160" />
          ${bodyMarkup(245, 133, "one", state.m1)}
          ${bodyMarkup(475, 133, "two", state.m2)}
          ${velocityArrow(245, 83, state.u1, "one", "u₁")}
          ${velocityArrow(475, 83, state.u2, "two", "u₂")}
        </g>

        <g class="p47-impact" aria-hidden="true">
          <line x1="360" y1="172" x2="360" y2="201" />
          <circle cx="360" cy="186" r="5" />
          <text x="374" y="190">impact · e=${clean(state.restitution, 2)}</text>
        </g>

        <g class="p47-after">
          <text class="p47-lane-title" x="43" y="224">AFTER · SEPARATION SPEED ${clean(result.separationSpeed, 2)} m/s</text>
          <line class="p47-track" x1="43" y1="320" x2="677" y2="320" />
          ${bodyMarkup(245, 293, "one", state.m1)}
          ${bodyMarkup(475, 293, "two", state.m2)}
          ${velocityArrow(245, 243, result.v1, "one", "v₁")}
          ${velocityArrow(475, 243, result.v2, "two", "v₂")}
        </g>
        ${lensOverlay(result)}
      </svg>`;
  }

  function lensCard() {
    const result = collision();
    const cards = [
      `<strong>m₁u₁+m₂u₂=m₁v₁+m₂v₂</strong><span>Both sides equal ${signed(result.totalMomentum, 3)} kg·m/s.</span>`,
      `<strong>v₂−v₁=e(u₁−u₂)</strong><span>Both sides equal ${clean(result.separationSpeed, 3)} m/s.</span>`,
      `<strong>v₁=u₁−J/m₁; v₂=u₂+J/m₂</strong><span>J=${clean(result.impulse, 3)} kg·m/s, positive on body 2.</span>`,
      `<strong>vᵢ−C=−e(uᵢ−C)</strong><span>C=${signed(result.centreVelocity, 3)} m/s remains unchanged.</span>`,
    ];
    return `<section class="p47-lens-card"><div class="eyebrow">Active statement</div>${cards[state.stage]}${result.degenerate ? '<p>No relative approach: J=0 and vᵢ=uᵢ. Restitution is mathematically unidentifiable from this event because both relative speeds are zero.</p>' : ""}</section>`;
  }

  function metricsMarkup() {
    const result = collision();
    const momentumResidual = result.momentumAfter - result.totalMomentum;
    const restitutionResidual = (result.v2 - result.v1) - state.restitution * (state.u1 - state.u2);
    const impulseResidual = state.m1 * (result.v1 - state.u1) + state.m2 * (result.v2 - state.u2);
    const comResidual = Math.max(
      Math.abs(result.v1Com + state.restitution * result.u1Com),
      Math.abs(result.v2Com + state.restitution * result.u2Com),
    );
    return `
      <section class="p47-metrics" aria-label="Equivalence residuals">
        <div><span>Momentum residual</span><strong>${momentumResidual.toExponential(1)}</strong></div>
        <div><span>Restitution residual</span><strong>${restitutionResidual.toExponential(1)}</strong></div>
        <div><span>Net internal impulse</span><strong>${impulseResidual.toExponential(1)}</strong></div>
        <div><span>COM reversal residual</span><strong>${comResidual.toExponential(1)}</strong></div>
        <p>Energy before ${clean(result.energyBefore, 3)} J · after ${clean(result.energyAfter, 3)} J · loss ${clean(result.energyLoss, 3)} J. Formula audit: ${clean(result.expectedEnergyLoss, 3)} J.</p>
      </section>`;
  }

  function dynamicLabMarkup() {
    return `<div class="p47-dynamic">${collisionSvg()}${lensCard()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    return `
      <section class="p47-controls" aria-label="Collision inputs">
        <div class="p47-control-grid">
          <label for="p47-m1"><span>Mass m₁<output data-p47-live="m1">${clean(state.m1, 1)} kg</output></span><input id="p47-m1" type="range" min="0.5" max="5" step="0.1" value="${state.m1}" /></label>
          <label for="p47-m2"><span>Mass m₂<output data-p47-live="m2">${clean(state.m2, 1)} kg</output></span><input id="p47-m2" type="range" min="0.5" max="5" step="0.1" value="${state.m2}" /></label>
          <label for="p47-u1"><span>Initial velocity u₁<output data-p47-live="u1">${signed(state.u1, 1)} m/s</output></span><input id="p47-u1" type="range" min="0" max="8" step="0.1" value="${state.u1}" /></label>
          <label for="p47-u2"><span>Initial velocity u₂<output data-p47-live="u2">${signed(state.u2, 1)} m/s</output></span><input id="p47-u2" type="range" min="-5" max="0" step="0.1" value="${state.u2}" /></label>
          <label class="p47-e-control" for="p47-e"><span>Restitution e<output data-p47-live="e">${clean(state.restitution, 2)}</output></span><input id="p47-e" type="range" min="0" max="1" step="0.01" value="${state.restitution}" /></label>
        </div>
        <p>Body 1 begins left of body 2. The velocity ranges guarantee u₁≥u₂, so they approach or share zero relative speed. Coefficients are restricted to 0≤e≤1.</p>
        <div class="p47-presets" role="group" aria-label="Collision edge cases">
          ${presets.map((preset) => `<button class="chip-button ${state.activePreset === preset.id ? "active" : ""}" type="button" data-problem-action="p47-preset" data-p47-preset="${preset.id}">${preset.label}</button>`).join("")}
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p47-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const result = collision();
    return `
      <section class="p47-solution" data-p47-solution aria-labelledby="p47-solution-heading">
        <h3 id="p47-solution-heading" tabindex="-1">Four statements, one collision map</h3>
        <p>Let q=u₁−u₂≥0. Momentum and restitution are</p>
        <div class="p47-equation">m₁u₁+m₂u₂=m₁v₁+m₂v₂<br>v₂−v₁=eq</div>
        <p>Solving them directly gives</p>
        <div class="p47-equation">v₁=[(m₁−em₂)u₁+(1+e)m₂u₂]/(m₁+m₂)<br>v₂=[(1+e)m₁u₁+(m₂−em₁)u₂]/(m₁+m₂)</div>
        <p>For the current inputs, <strong>v₁=${signed(result.v1, 3)} m/s</strong> and <strong>v₂=${signed(result.v2, 3)} m/s</strong>.</p>
        <p>The impulse form is identical after defining J positive on body 2:</p>
        <div class="p47-equation">J=(1+e)(u₁−u₂)/(1/m₁+1/m₂)=${clean(result.impulse, 3)} kg·m/s<br>v₁=u₁−J/m₁, &nbsp; v₂=u₂+J/m₂</div>
        <p>Finally C=(m₁u₁+m₂u₂)/(m₁+m₂)=${signed(result.centreVelocity, 3)} m/s. Subtracting C turns the same map into</p>
        <div class="p47-equation">v₁−C=−e(u₁−C), &nbsp; v₂−C=−e(u₂−C)</div>
        <p>Thus the impulse and COM statements are not extra assumptions: each is an algebraic rewriting of momentum plus restitution.</p>
        <p class="p47-limits"><strong>Checks.</strong> Equal masses with e=1 exchange velocities. At e=0 both leave at C. At e=1 kinetic energy is conserved. If q=0, then J=0 and vᵢ=uᵢ for every chosen e; because the collision has no relative motion, e cannot be inferred experimentally. Positive masses avoid the singular denominator 1/m₁+1/m₂.</p>
      </section>`;
  }

  function stateSnapshot() {
    const result = collision();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      massesKg: [state.m1, state.m2],
      initialVelocitiesMetresPerSecond: [state.u1, state.u2],
      restitution: state.restitution,
      finalVelocitiesMetresPerSecond: [Number(result.v1.toFixed(6)), Number(result.v2.toFixed(6))],
      centreOfMassVelocityMetresPerSecond: Number(result.centreVelocity.toFixed(6)),
      impulseOnBody2KgMetresPerSecond: Number(result.impulse.toFixed(6)),
      momentumBeforeAndAfterKgMetresPerSecond: [Number(result.totalMomentum.toFixed(6)), Number(result.momentumAfter.toFixed(6))],
      approachAndSeparationSpeedsMetresPerSecond: [Number(result.approachSpeed.toFixed(6)), Number(result.separationSpeed.toFixed(6))],
      kineticEnergyLossJoules: Number(result.energyLoss.toFixed(6)),
      degenerateZeroRelativeSpeed: result.degenerate,
      activeStatement: stages[state.stage].short,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const result = collision();
    return `
      <main class="book-shell p47-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive collision identities</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p47-spread">
          <article class="book-page p47-problem-page">
            <div class="problem-number">Problem 4.7</div>
            <h1 class="book-title p47-title">Equivalent statements for linear collisions</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">Two positive point masses collide head-on in one dimension. Body 1 begins to the left, so an impact is possible when u₁≥u₂. The coefficient of restitution satisfies 0≤e≤1.</p>
            <p class="problem-copy">Predict v₁ and v₂, then show that momentum conservation, relative-speed restitution, impulse transfer and COM-frame reversal all describe exactly the same outcome.</p>
            <section class="p47-sign-card"><strong>Signed, not merely fast</strong><p>Rightward velocities are positive. A negative outgoing value means rebound to the left. J is defined positive as the impulse received by body 2; body 1 receives −J.</p></section>
            <section class="p47-baseline-card"><div class="eyebrow">Current collision</div><p data-p47-summary>Approach ${clean(result.approachSpeed, 2)} m/s · C=${signed(result.centreVelocity, 2)} m/s · energy loss ${clean(result.energyLoss, 2)} J.</p></section>
          </article>

          <section class="book-page book-stage p47-stage">
            ${stageTabs()}
            ${stageHeading()}
            ${dynamicLabMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p47-coach">
            <div class="coach-kicker">Predict, then audit</div>
            <p class="coach-question">For the current sliders, predict both signed outgoing velocities and the impulse J on body 2.</p>
            <form class="p47-answer-form" data-p47-answer-form novalidate>
              <label for="p47-v1-answer">Outgoing velocity v₁</label>
              <div><input id="p47-v1-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.v1Answer)}" placeholder="include its sign" autocomplete="off" /><span>m/s</span></div>
              <label for="p47-v2-answer">Outgoing velocity v₂</label>
              <div><input id="p47-v2-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.v2Answer)}" placeholder="include its sign" autocomplete="off" /><span>m/s</span></div>
              <label for="p47-impulse-answer">Impulse J on body 2</label>
              <div><input id="p47-impulse-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.impulseAnswer)}" placeholder="positive magnitude" autocomplete="off" /><span>kg·m/s</span></div>
              <button class="primary-button" type="submit">Verify all statements</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p47-help-row">
              <button class="secondary-button" type="button" data-problem-action="p47-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p47-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p47-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function clearPrediction(root) {
    state.v1Answer = "";
    state.v2Answer = "";
    state.impulseAnswer = "";
    state.feedback = "";
    state.committed = false;
    ["#p47-v1-answer", "#p47-v2-answer", "#p47-impulse-answer"].forEach((selector) => {
      const input = root?.querySelector(selector);
      if (input) input.value = "";
    });
    root?.querySelector(".math2-feedback")?.remove();
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p47-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p47-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicLabMarkup();
    const values = {
      m1: `${clean(state.m1, 1)} kg`,
      m2: `${clean(state.m2, 1)} kg`,
      u1: `${signed(state.u1, 1)} m/s`,
      u2: `${signed(state.u2, 1)} m/s`,
      e: clean(state.restitution, 2),
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p47-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    root.querySelectorAll(".p47-presets button").forEach((button) => button.classList.toggle("active", button.dataset.p47Preset === state.activePreset));
    const result = collision();
    const summary = root.querySelector("[data-p47-summary]");
    if (summary) summary.textContent = `Approach ${clean(result.approachSpeed, 2)} m/s · C=${signed(result.centreVelocity, 2)} m/s · energy loss ${clean(result.energyLoss, 2)} J.`;
    const solution = root.querySelector("[data-p47-solution]");
    if (solution) solution.outerHTML = solutionMarkup();
    [
      ["#p47-m1", `Mass one ${clean(state.m1, 1)} kilograms; predicted velocity ${signed(result.v1, 2)} metres per second`],
      ["#p47-m2", `Mass two ${clean(state.m2, 1)} kilograms; predicted velocity ${signed(result.v2, 2)} metres per second`],
      ["#p47-u1", `Initial velocity one ${signed(state.u1, 1)} metres per second`],
      ["#p47-u2", `Initial velocity two ${signed(state.u2, 1)} metres per second`],
      ["#p47-e", `Coefficient of restitution ${clean(state.restitution, 2)}; energy loss ${clean(result.energyLoss, 2)} joules`],
    ].forEach(([selector, text]) => root.querySelector(selector)?.setAttribute("aria-valuetext", text));
    clearPrediction(root);
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p47-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p47-m1");
          return;
        }
        if (action === "p47-stage") {
          state.stage = clamp(Number(control.dataset.p47Stage), 0, 3);
          renderAndFocus(renderApp, `[data-p47-stage="${state.stage}"]`);
          return;
        }
        if (action === "p47-next-stage") {
          state.stage = Math.min(3, state.stage + 1);
          renderAndFocus(renderApp, `[data-p47-stage="${state.stage}"]`);
          return;
        }
        if (action === "p47-preset") {
          const preset = presets.find((candidate) => candidate.id === control.dataset.p47Preset);
          if (!preset) return;
          state.m1 = preset.m1;
          state.m2 = preset.m2;
          state.u1 = preset.u1;
          state.u2 = preset.u2;
          state.restitution = preset.e;
          state.activePreset = preset.id;
          state.v1Answer = "";
          state.v2Answer = "";
          state.impulseAnswer = "";
          state.feedback = "";
          state.committed = false;
          renderAndFocus(renderApp, `[data-p47-preset="${preset.id}"]`);
          return;
        }
        if (action === "p47-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p47-reveal") {
          state.revealed = true;
          state.stage = 3;
        }
        renderApp();
        if (action === "p47-reveal") window.requestAnimationFrame(() => document.querySelector("#p47-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p47-m1", key: "m1", min: 0.5, max: 5 },
      { selector: "#p47-m2", key: "m2", min: 0.5, max: 5 },
      { selector: "#p47-u1", key: "u1", min: 0, max: 8 },
      { selector: "#p47-u2", key: "u2", min: -5, max: 0 },
      { selector: "#p47-e", key: "restitution", min: 0, max: 1 },
    ].forEach(({ selector, key, min, max }) => {
      document.querySelector(selector)?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), min, max);
        state.activePreset = "";
        updateDynamicDom();
      });
    });

    const v1Input = document.querySelector("#p47-v1-answer");
    const v2Input = document.querySelector("#p47-v2-answer");
    const impulseInput = document.querySelector("#p47-impulse-answer");
    v1Input?.addEventListener("input", (event) => { state.v1Answer = sanitizeNumber(event.target.value); });
    v2Input?.addEventListener("input", (event) => { state.v2Answer = sanitizeNumber(event.target.value); });
    impulseInput?.addEventListener("input", (event) => { state.impulseAnswer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p47-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.v1Answer = sanitizeNumber(v1Input?.value).trim();
      state.v2Answer = sanitizeNumber(v2Input?.value).trim();
      state.impulseAnswer = sanitizeNumber(impulseInput?.value).trim();
      const v1 = Number(state.v1Answer);
      const v2 = Number(state.v2Answer);
      const impulse = Number(state.impulseAnswer);
      const result = collision();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.v1Answer || !state.v2Answer || !state.impulseAnswer || !Number.isFinite(v1) || !Number.isFinite(v2) || !Number.isFinite(impulse)) {
        state.feedback = "Enter both signed outgoing velocities and the non-negative impulse J.";
      } else if (Math.abs(v1 - result.v1) > 0.03) {
        state.feedback = "Check body 1’s sign. It receives impulse −J, so v₁=u₁−J/m₁.";
      } else if (Math.abs(v2 - result.v2) > 0.03) {
        state.feedback = "Body 2 receives +J, so v₂=u₂+J/m₂. Keep u₂’s original sign.";
      } else if (Math.abs(impulse - result.impulse) > 0.03) {
        state.feedback = "The velocities agree, but J is the impulse on body 2: m₂(v₂−u₂), in kg·m/s.";
      } else {
        state.feedbackTone = "success";
        state.committed = true;
        state.feedback = `Correct: v₁=${signed(result.v1, 3)} m/s, v₂=${signed(result.v2, 3)} m/s and J=${clean(result.impulse, 3)} kg·m/s. Every displayed residual is numerical zero.`;
      }
      renderAndFocus(renderApp, "#p47-v1-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
