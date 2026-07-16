(function registerElastotennisPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "4.2";
  const BALL_MASS = 0.058;
  const stages = Object.freeze([
    Object.freeze({ short: "Before", title: "Choose the approach", copy: "The +x direction points from Dr Lightspeed towards the opponent. The incoming ball therefore has a negative velocity." }),
    Object.freeze({ short: "COM frame", title: "Ride with the centre of mass", copy: "In this frame the total momentum is zero. A one-dimensional elastic collision simply reverses both velocities." }),
    Object.freeze({ short: "After", title: "Return to the court", copy: "Add the centre-of-mass speed back to obtain both outgoing velocities, then audit momentum and kinetic energy." }),
  ]);
  const hints = Object.freeze([
    "Choose signs before substituting: the incoming ball moves towards Dr Lightspeed, so uᵦ is negative; a racket swinging towards the opponent has positive U.",
    "Momentum alone is not enough for two unknown outgoing velocities. Elasticity also gives relative speed of separation = relative speed of approach: vᵦ−Vᵣ = −(uᵦ−U).",
    "The centre-of-mass speed is C=(muᵦ+MU)/(m+M). In the COM frame an elastic head-on collision reverses each velocity.",
    "Thus vᵦ−C=−(uᵦ−C), or vᵦ=2C−uᵦ. Substitute C and simplify.",
    "The direct result is vᵦ=[(m−M)uᵦ+2MU]/(m+M). Keep its sign: positive means the ball returns towards the opponent.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p42-reset">Reset</button>';

  const initialState = () => ({
    incomingSpeed: 30,
    racketMass: 0.35,
    racketSpeed: 15,
    stage: 0,
    answer: "",
    committed: false,
    feedback: "",
    feedbackTone: "is-neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function formatSigned(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < 0.5 * 10 ** -digits) return format(0, digits);
    return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`;
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18);
  }

  function collisionFor(incomingSpeed = state.incomingSpeed, racketMass = state.racketMass, racketSpeed = state.racketSpeed) {
    const ballIn = -Math.abs(incomingSpeed);
    const racketIn = racketSpeed;
    const totalMass = BALL_MASS + racketMass;
    const centreVelocity = (BALL_MASS * ballIn + racketMass * racketIn) / totalMass;
    const ballOut = 2 * centreVelocity - ballIn;
    const racketOut = 2 * centreVelocity - racketIn;
    const momentumIn = BALL_MASS * ballIn + racketMass * racketIn;
    const momentumOut = BALL_MASS * ballOut + racketMass * racketOut;
    const energyIn = 0.5 * BALL_MASS * ballIn ** 2 + 0.5 * racketMass * racketIn ** 2;
    const energyOut = 0.5 * BALL_MASS * ballOut ** 2 + 0.5 * racketMass * racketOut ** 2;
    return {
      ballIn,
      racketIn,
      ballOut,
      racketOut,
      centreVelocity,
      ballComIn: ballIn - centreVelocity,
      racketComIn: racketIn - centreVelocity,
      ballComOut: ballOut - centreVelocity,
      racketComOut: racketOut - centreVelocity,
      momentumIn,
      momentumOut,
      energyIn,
      energyOut,
    };
  }

  function directionLabel(velocity) {
    if (velocity > 0.05) return "towards the opponent (+x)";
    if (velocity < -0.05) return "still towards Dr Lightspeed (−x)";
    return "momentarily at rest";
  }

  function stageTabs() {
    return `
      <div class="p42-stage-tabs" role="group" aria-label="Collision analysis stages">
        ${stages.map((stage, index) => `<button class="chip-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p42-stage" data-p42-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function arrowMarkup(x, y, velocity, kind, label) {
    const direction = velocity < 0 ? -1 : 1;
    const length = Math.abs(velocity) < 0.05 ? 0 : Math.min(126, 22 + Math.abs(velocity) * 1.45);
    const end = x + direction * length;
    return `
      <g class="p42-velocity is-${kind}">
        ${length ? `<line x1="${x}" y1="${y}" x2="${end}" y2="${y}" marker-end="url(#p42-${kind}-arrow)"/>` : `<circle cx="${x}" cy="${y}" r="4"/>`}
        <text x="${(x + end) / 2}" y="${y - 10}" text-anchor="middle">${label} ${formatSigned(velocity, 1)} m/s</text>
      </g>`;
  }

  function racketMarkup(x, y, suffix) {
    return `
      <g class="p42-racket" aria-hidden="true">
        <ellipse cx="${x}" cy="${y}" rx="18" ry="27" transform="rotate(-20 ${x} ${y})"/>
        <path d="M${x - 7} ${y + 23} L${x - 31} ${y + 61}"/>
        <line x1="${x - 12}" y1="${y - 20}" x2="${x + 13}" y2="${y + 20}"/>
        <line x1="${x - 18}" y1="${y - 2}" x2="${x + 17}" y2="${y - 2}"/>
        <text x="${x - 35}" y="${y + 4}" text-anchor="end">racket ${suffix}</text>
      </g>`;
  }

  function collisionSvg() {
    const result = collisionFor();
    const showCom = state.stage >= 1 || state.revealed;
    const showAfter = state.stage >= 2 || state.revealed;
    return `
      <svg class="p42-collision-svg is-stage-${state.stage}" viewBox="0 0 720 430" role="img" aria-labelledby="p42-svg-title p42-svg-desc">
        <title id="p42-svg-title">One-dimensional elastic collision between a tennis ball and a moving racket</title>
        <desc id="p42-svg-desc">Before impact the 58 gram ball has velocity ${formatSigned(result.ballIn)} metres per second and the racket has velocity ${formatSigned(result.racketIn)} metres per second. ${showAfter ? `After impact the ball has velocity ${formatSigned(result.ballOut)} metres per second, ${directionLabel(result.ballOut)}.` : "The outgoing velocity is waiting to be predicted."}</desc>
        <defs>
          <marker id="p42-ball-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z"/></marker>
          <marker id="p42-racket-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z"/></marker>
          <marker id="p42-com-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z"/></marker>
          <radialGradient id="p42-ball-shade" cx="35%" cy="30%"><stop offset="0" stop-color="#fff8a8"/><stop offset="1" stop-color="#d5d12a"/></radialGradient>
        </defs>

        <g class="p42-axis" aria-hidden="true">
          <line x1="42" y1="31" x2="676" y2="31" marker-end="url(#p42-com-arrow)"/>
          <text x="42" y="20">−x · towards player</text><text x="676" y="20" text-anchor="end">+x · towards opponent</text>
        </g>

        <g class="p42-before-lane">
          <text class="p42-lane-title" x="42" y="67">BEFORE IMPACT · COURT FRAME</text>
          <line class="p42-court" x1="42" y1="145" x2="676" y2="145"/>
          ${racketMarkup(270, 109, `M = ${format(state.racketMass, 3)} kg`)}
          <g class="p42-ball"><circle cx="438" cy="112" r="16"/><path d="M425 104 Q438 112 451 104 M425 120 Q438 112 451 120"/><text x="438" y="151" text-anchor="middle">ball · m = 0.058 kg</text></g>
          ${arrowMarkup(438, 85, result.ballIn, "ball", "uᵦ")}
          ${arrowMarkup(270, 75, result.racketIn, "racket", "U")}
        </g>

        <g class="p42-com-lane ${showCom ? "" : "is-locked"}">
          <rect x="42" y="177" width="634" height="92" rx="13"/>
          <text class="p42-lane-title" x="58" y="199">CENTRE-OF-MASS FRAME · C = ${formatSigned(result.centreVelocity, 2)} m/s</text>
          <text x="58" y="222">Before</text>
          ${arrowMarkup(188, 240, result.ballComIn, "ball", "uᵦ−C")}
          ${arrowMarkup(310, 240, result.racketComIn, "racket", "U−C")}
          <line class="p42-com-divider" x1="360" y1="208" x2="360" y2="256"/>
          <text x="382" y="222">After · both reverse</text>
          ${arrowMarkup(498, 240, result.ballComOut, "ball", "vᵦ−C")}
          ${arrowMarkup(620, 240, result.racketComOut, "racket", "Vᵣ−C")}
          ${showCom ? "" : '<text class="p42-lock-label" x="360" y="239" text-anchor="middle">Open stage 2 to ride with C</text>'}
        </g>

        <g class="p42-after-lane ${showAfter ? "" : "is-locked"}">
          <text class="p42-lane-title" x="42" y="302">AFTER IMPACT · COURT FRAME</text>
          <line class="p42-court" x1="42" y1="388" x2="676" y2="388"/>
          ${racketMarkup(270, 352, `Vᵣ = ${showAfter ? `${formatSigned(result.racketOut, 1)} m/s` : "?"}`)}
          <g class="p42-ball"><circle cx="438" cy="355" r="16"/><path d="M425 347 Q438 355 451 347 M425 363 Q438 355 451 363"/><text x="438" y="394" text-anchor="middle">${showAfter ? directionLabel(result.ballOut) : "predict the return"}</text></g>
          ${showAfter ? arrowMarkup(438, 328, result.ballOut, "ball", "vᵦ") : ""}
          ${showAfter ? arrowMarkup(270, 318, result.racketOut, "racket", "Vᵣ") : ""}
          ${showAfter ? "" : '<text class="p42-lock-label" x="550" y="349" text-anchor="middle">Open stage 3 to see the result</text>'}
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const result = collisionFor();
    const showCom = state.stage >= 1 || state.revealed;
    const showAfter = state.stage >= 2 || state.revealed;
    const momentumResidual = result.momentumOut - result.momentumIn;
    const energyResidual = result.energyOut - result.energyIn;
    return `
      <section class="p42-metrics" aria-live="polite">
        <div><span>Centre-of-mass speed</span><strong>${showCom ? `${formatSigned(result.centreVelocity, 2)} m/s` : "stage 2"}</strong></div>
        <div><span>Outgoing ball</span><strong>${showAfter ? `${formatSigned(result.ballOut, 2)} m/s` : "predict it"}</strong></div>
        <div><span>Total momentum</span><strong>${showAfter ? `${format(result.momentumIn, 3)} kg·m/s` : "hidden"}</strong><small>${showAfter ? `residual ${momentumResidual.toExponential(1)}` : "before = after"}</small></div>
        <div><span>Total kinetic energy</span><strong>${showAfter ? `${format(result.energyIn, 2)} J` : "hidden"}</strong><small>${showAfter ? `residual ${energyResidual.toExponential(1)} J` : "before = after"}</small></div>
      </section>`;
  }

  function dynamicLabMarkup() {
    return `<div class="p42-lab-dynamic">${collisionSvg()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    return `
      <section class="p42-controls" aria-label="Collision inputs">
        <label for="p42-incoming"><span>Incoming ball speed |uᵦ|<output data-p42-live="incoming">${format(state.incomingSpeed, 0)} m/s</output></span><input id="p42-incoming" type="range" min="5" max="60" step="1" value="${state.incomingSpeed}" aria-describedby="p42-sign-note"/></label>
        <label for="p42-racket-speed"><span>Racket velocity U<output data-p42-live="racket-speed">${formatSigned(state.racketSpeed, 0)} m/s</output></span><input id="p42-racket-speed" type="range" min="-4" max="30" step="1" value="${state.racketSpeed}"/></label>
        <label for="p42-racket-mass"><span>Effective mass M<output data-p42-live="racket-mass">${format(state.racketMass, 3)} kg</output></span><input id="p42-racket-mass" type="range" min="0.058" max="2" step="0.002" value="${state.racketMass}"/></label>
        <p id="p42-sign-note">The input called “incoming speed” is a magnitude; the model assigns the ball velocity uᵦ=−|uᵦ|. A negative U means the racket is withdrawing.</p>
        <div class="p42-presets" role="group" aria-label="Collision presets">
          <button class="chip-button" type="button" data-problem-action="p42-preset" data-p42-incoming="30" data-p42-racket-speed="15" data-p42-mass="0.35">Drive</button>
          <button class="chip-button" type="button" data-problem-action="p42-preset" data-p42-incoming="30" data-p42-racket-speed="0" data-p42-mass="0.35">Fixed racket</button>
          <button class="chip-button" type="button" data-problem-action="p42-preset" data-p42-incoming="30" data-p42-racket-speed="12" data-p42-mass="0.058">Equal masses</button>
          <button class="chip-button" type="button" data-problem-action="p42-preset" data-p42-incoming="30" data-p42-racket-speed="-4" data-p42-mass="0.058">Soft withdraw</button>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p42-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const result = collisionFor();
    return `
      <section class="p42-solution" data-p42-solution aria-labelledby="p42-solution-heading">
        <h3 id="p42-solution-heading" tabindex="-1">Reverse in the COM frame</h3>
        <p>Perfect elasticity requires both conservation laws:</p>
        <div class="p42-equation">muᵦ+MU = mvᵦ+MVᵣ<br>½muᵦ²+½MU² = ½mvᵦ²+½MVᵣ²</div>
        <p>The centre-of-mass velocity is constant:</p>
        <div class="p42-equation">C = (muᵦ+MU)/(m+M) = ${formatSigned(result.centreVelocity, 3)} m/s</div>
        <p>In the COM frame, an elastic head-on collision reverses each velocity. Therefore</p>
        <div class="p42-equation">vᵦ−C = −(uᵦ−C) &nbsp;⇒&nbsp; vᵦ = 2C−uᵦ</div>
        <p>Eliminating C gives the laboratory-frame formula</p>
        <div class="p42-equation">vᵦ = [(m−M)uᵦ+2MU]/(m+M)</div>
        <p>For the current settings, m=${format(BALL_MASS, 3)} kg, M=${format(state.racketMass, 3)} kg, uᵦ=${formatSigned(result.ballIn, 1)} m/s and U=${formatSigned(result.racketIn, 1)} m/s, so</p>
        <div class="p42-equation p42-answer-equation">vᵦ = ${formatSigned(result.ballOut, 3)} m/s · ${directionLabel(result.ballOut)}</div>
        <p>The racket leaves at Vᵣ=${formatSigned(result.racketOut, 3)} m/s. Momentum is ${format(result.momentumIn, 4)} kg·m/s before and after; kinetic energy is ${format(result.energyIn, 4)} J before and after.</p>
        <p class="p42-limits"><strong>Checks.</strong> If M=m, the bodies exchange velocities. If M≫m and U=0, then vᵦ→−uᵦ: a massive stationary racket reverses the ball at almost unchanged speed. If M≫m while U is finite, vᵦ→−uᵦ+2U. Velocity is in m/s, momentum in kg·m/s, and kinetic energy in kg·m²/s² = J.</p>
      </section>`;
  }

  function reconstructionNote() {
    return `
      <p class="p42-reconstruction-note">
        <strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. The scenario, values, interaction and solution below are newly written; they do not reproduce the book’s wording or solution.
      </p>`;
  }

  function stateSnapshot() {
    const result = collisionFor();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: "title and difficulty only",
      ballMassKg: BALL_MASS,
      incomingBallVelocityMetresPerSecond: result.ballIn,
      racketEffectiveMassKg: state.racketMass,
      incomingRacketVelocityMetresPerSecond: result.racketIn,
      centreOfMassVelocityMetresPerSecond: Number(result.centreVelocity.toFixed(6)),
      outgoingBallVelocityMetresPerSecond: Number(result.ballOut.toFixed(6)),
      outgoingRacketVelocityMetresPerSecond: Number(result.racketOut.toFixed(6)),
      momentumResidual: result.momentumOut - result.momentumIn,
      energyResidualJoules: result.energyOut - result.energyIn,
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const stage = stages[state.stage];
    return `
      <main class="book-shell p42-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive dynamics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p42-spread">
          <article class="book-page p42-problem-page">
            <div class="problem-number">Problem 4.2</div>
            <h1 class="book-title p42-title">Dr Lightspeed’s elastotennis match</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">A 58 g tennis ball approaches Dr Lightspeed head-on. Model the racket and coupled part of the player as one effective mass M. During the brief impact, treat the collision as perfectly elastic and one-dimensional.</p>
            <p class="problem-copy">Take +x towards the opponent. For the chosen incoming ball speed, racket velocity U and effective mass M, predict the ball’s signed outgoing velocity vᵦ.</p>
            <section class="p42-sign-card">
              <strong>Sign convention</strong>
              <div><span>towards Dr Lightspeed</span><b>−x ⟵</b><i></i><b>⟶ +x</b><span>towards opponent</span></div>
              <p>A positive answer is a successful return. A negative answer means the ball continues towards the player.</p>
            </section>
          </article>

          <section class="book-page book-stage p42-stage">
            ${stageTabs()}
            <div class="p42-stage-heading">
              <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><h2>${stage.title}</h2></div>
              <p>${stage.copy}</p>
            </div>
            ${dynamicLabMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p42-coach">
            <div class="coach-kicker">Make the call</div>
            <p class="coach-question">What is the ball’s signed velocity immediately after impact?</p>
            <form class="p42-answer-form" data-p42-answer-form novalidate>
              <label for="p42-answer">Your prediction</label>
              <div><input id="p42-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. +42.0 or −8.0" autocomplete="off"/><span>m/s</span></div>
              <p>Use + for a return towards the opponent and − if the ball keeps moving towards the player.</p>
              <button class="primary-button" type="submit">Check velocity</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p42-help-row">
              <button class="secondary-button" type="button" data-problem-action="p42-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p42-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p42-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p42-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p42-lab-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicLabMarkup();
    root.querySelectorAll('[data-p42-live="incoming"]').forEach((node) => { node.textContent = `${format(state.incomingSpeed, 0)} m/s`; });
    root.querySelectorAll('[data-p42-live="racket-speed"]').forEach((node) => { node.textContent = `${formatSigned(state.racketSpeed, 0)} m/s`; });
    root.querySelectorAll('[data-p42-live="racket-mass"]').forEach((node) => { node.textContent = `${format(state.racketMass, 3)} kg`; });
    const feedback = root.querySelector(".math2-feedback");
    feedback?.remove();
    const answer = root.querySelector("#p42-answer");
    if (answer) answer.value = "";
    const solution = root.querySelector("[data-p42-solution]");
    if (solution) solution.outerHTML = solutionMarkup();
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p42-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p42-incoming");
          return;
        }
        if (action === "p42-stage") {
          state.stage = clamp(Number(control.dataset.p42Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p42-stage="${state.stage}"]`);
          return;
        }
        if (action === "p42-preset") {
          state.incomingSpeed = clamp(Number(control.dataset.p42Incoming), 5, 60);
          state.racketSpeed = clamp(Number(control.dataset.p42RacketSpeed), -4, 30);
          state.racketMass = clamp(Number(control.dataset.p42Mass), 0.058, 2);
          state.answer = "";
          state.committed = false;
          state.feedback = "";
          renderAndFocus(renderApp, "#p42-incoming");
          return;
        }
        if (action === "p42-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p42-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p42-reveal") window.requestAnimationFrame(() => document.querySelector("#p42-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p42-incoming", key: "incomingSpeed", minimum: 5, maximum: 60 },
      { selector: "#p42-racket-speed", key: "racketSpeed", minimum: -4, maximum: 30 },
      { selector: "#p42-racket-mass", key: "racketMass", minimum: 0.058, maximum: 2 },
    ].forEach(({ selector, key, minimum, maximum }) => {
      const slider = document.querySelector(selector);
      slider?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), minimum, maximum);
        state.answer = "";
        state.committed = false;
        state.feedback = "";
        updateDynamicDom();
      });
    });

    const answerInput = document.querySelector("#p42-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    const answerForm = document.querySelector("[data-p42-answer-form]");
    answerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = sanitizeNumber(answerInput?.value).trim();
      const guess = Number(state.answer.replace("−", "-"));
      const result = collisionFor();
      const target = result.ballOut;
      state.feedbackTone = "is-warn";
      state.committed = false;
      if (!state.answer || !Number.isFinite(guess)) {
        state.feedback = "Enter one signed velocity in metres per second.";
      } else if (Math.abs(guess - target) <= 0.5) {
        state.feedbackTone = "is-success";
        state.committed = true;
        state.stage = 2;
        state.feedback = `Correct: vᵦ=${formatSigned(target, 2)} m/s, so the ball travels ${directionLabel(target)}.`;
      } else if (Math.sign(guess) !== Math.sign(target) && Math.abs(Math.abs(guess) - Math.abs(target)) <= 1) {
        state.feedback = `Your speed is close, but its direction is reversed. With +x towards the opponent, the required sign is ${target >= 0 ? "+" : "−"}.`;
      } else if (Math.abs(guess - result.racketOut) <= 0.5) {
        state.feedback = "That is the racket’s outgoing velocity. The ball uses vᵦ=2C−uᵦ; the racket uses Vᵣ=2C−U.";
      } else {
        state.feedback = "Not yet. Find C from the signed incoming momenta, reverse the ball’s velocity relative to C, then add C back.";
      }
      renderAndFocus(renderApp, "#p42-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
