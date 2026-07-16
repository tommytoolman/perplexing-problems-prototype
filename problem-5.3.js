(function registerRollerCoasterPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "5.3";
  const MASS = 400;
  const GRAVITY = 9.81;
  const CHALLENGE_RADIUS = 8;
  const CHALLENGE_HEIGHT = 2.5 * CHALLENGE_RADIUS;
  const stages = Object.freeze([
    Object.freeze({ short: "Energy", title: "Trade height for speed", copy: "Taking the loop bottom as zero potential, conservation of energy determines the speed at every reachable angle." }),
    Object.freeze({ short: "Radial force", title: "Ask what contact must supply", copy: "Resolve inward towards the loop centre. The normal reaction can push inward, but the track cannot pull the car outward." }),
    Object.freeze({ short: "Whole loop", title: "Protect the weakest point", copy: "The required normal force falls continuously on the climb and is smallest at the top. That single point fixes the release-height threshold." }),
  ]);
  const hints = Object.freeze([
    "At angle θ from the bottom, the car is R(1−cosθ) above the bottom. Energy gives v²=2g[h−R(1−cosθ)].",
    "Take inward as positive. Gravity contributes −mg cosθ inward, so N−mg cosθ=mv²/R and N=m(v²/R+g cosθ).",
    "Substitute the energy result: N/(mg)=2h/R−2+3cosθ. This decreases from bottom to top because cosθ decreases.",
    "At the top, contact just persists when N=0, so vtop²=gR. Energy from release to the top gives vtop²=2g(h−2R).",
    "Equating the two top-speed expressions gives hmin=5R/2. At that threshold vbottom²=5gR and Nbottom=6mg.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p53-reset">Reset</button>';

  const initialState = () => ({
    releaseHeight: 18,
    radius: CHALLENGE_RADIUS,
    angle: 120,
    stage: 0,
    heightAnswer: "",
    topSpeedAnswer: "",
    bottomNormalAnswer: "",
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

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function degrees(value) {
    return value * 180 / Math.PI;
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

  function trajectory() {
    const ratio = state.releaseHeight / state.radius;
    const theta = radians(state.angle);
    const heightAtAngle = state.radius * (1 - Math.cos(theta));
    const speedSquared = 2 * GRAVITY * (state.releaseHeight - heightAtAngle);
    const accessibleByEnergy = speedSquared >= -1e-9;
    const speed = accessibleByEnergy ? Math.sqrt(Math.max(0, speedSquared)) : null;
    const normalRatio = 2 * ratio - 2 + 3 * Math.cos(theta);
    const demandedNormal = MASS * GRAVITY * normalRatio;
    let eventType = "complete";
    let eventAngle = 180;
    if (ratio < 1 - 1e-9) {
      eventType = "turn";
      eventAngle = degrees(Math.acos(clamp(1 - ratio, -1, 1)));
    } else if (ratio <= 1 + 1e-9) {
      eventType = "degenerate-side";
      eventAngle = 90;
    } else if (ratio < 2.5 - 1e-9) {
      eventType = "contact-loss";
      eventAngle = degrees(Math.acos(clamp((2 - 2 * ratio) / 3, -1, 1)));
    } else if (Math.abs(ratio - 2.5) <= 1e-9) {
      eventType = "top-limit";
      eventAngle = 180;
    }
    const beforeEvent = state.angle < eventAngle - 1e-7;
    const atEvent = Math.abs(state.angle - eventAngle) <= 1e-7;
    let localState = "contact";
    if (eventType === "turn" && atEvent) localState = "turning";
    if (eventType === "turn" && !beforeEvent && !atEvent) localState = "unreachable";
    if (eventType === "degenerate-side" && atEvent) localState = "zero-speed-contact-limit";
    if (eventType === "degenerate-side" && !beforeEvent && !atEvent) localState = "unreachable";
    if (eventType === "contact-loss" && atEvent) localState = "contact-limit";
    if (eventType === "contact-loss" && !beforeEvent && !atEvent) localState = "detached";
    if (eventType === "top-limit" && atEvent) localState = "contact-limit";
    const physicalNormal = localState === "contact" || localState === "turning"
      ? Math.max(0, demandedNormal)
      : 0;
    return {
      ratio,
      theta,
      heightAtAngle,
      speedSquared,
      speed,
      accessibleByEnergy,
      normalRatio,
      demandedNormal,
      physicalNormal,
      eventType,
      eventAngle,
      localState,
      minimumHeight: 2.5 * state.radius,
      topSpeedAtThreshold: Math.sqrt(GRAVITY * state.radius),
    };
  }

  function localStateLabel(values = trajectory()) {
    if (values.localState === "turning") return "Turns back with zero speed";
    if (values.localState === "unreachable") return "Not reached on this trajectory";
    if (values.localState === "contact-limit") return "Normal force is zero · limiting contact";
    if (values.localState === "zero-speed-contact-limit") return "Zero speed and zero contact at the side";
    if (values.localState === "detached") return "Track would need to pull · already detached";
    return "Track contact maintained";
  }

  function wholeLoopLabel(values = trajectory()) {
    if (values.eventType === "complete") return "Complete loop with positive contact margin";
    if (values.eventType === "top-limit") return "Complete loop at the limiting top contact";
    if (values.eventType === "contact-loss") return `Leaves the track at θ=${clean(values.eventAngle, 1)}°`;
    if (values.eventType === "degenerate-side") return "Reaches θ=90° with v=N=0";
    return `Runs out of energy at θ=${clean(values.eventAngle, 1)}°`;
  }

  function reconstructionNote() {
    return `
      <p class="p53-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function stageControls() {
    return `
      <div class="p53-stage-controls" role="group" aria-label="Vertical loop analysis stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p53-stage" data-p53-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p53-stage-caption">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p53-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Whole loop tested" : "Next stage"}</button>
      </div>`;
  }

  function graphPoint(angle, ratio) {
    const normalRatio = 2 * ratio - 2 + 3 * Math.cos(radians(angle));
    return {
      x: 478 + angle / 180 * 206,
      y: 324 - (normalRatio + 5) / 19 * 234,
      normalRatio,
    };
  }

  function graphPath(ratio, endAngle = 180) {
    const points = [];
    for (let angle = 0; angle <= 180; angle += 3) points.push({ angle, ...graphPoint(angle, ratio) });
    if (endAngle >= 180) return points.map((point, index) => `${index ? "L" : "M"}${clean(point.x)} ${clean(point.y)}`).join(" ");
    const valid = points.filter((point) => point.angle < endAngle);
    valid.push({ angle: endAngle, ...graphPoint(endAngle, ratio) });
    return valid.map((point, index) => `${index ? "L" : "M"}${clean(point.x)} ${clean(point.y)}`).join(" ");
  }

  function loopSvg() {
    const values = trajectory();
    const centre = { x: 245, y: 224 };
    const displayRadius = 148;
    const carX = centre.x + displayRadius * Math.sin(values.theta);
    const carY = centre.y + displayRadius * Math.cos(values.theta);
    const inward = { x: -Math.sin(values.theta), y: -Math.cos(values.theta) };
    const normalLength = values.physicalNormal > 0 ? Math.min(94, 25 + values.physicalNormal / (MASS * GRAVITY) * 13) : 0;
    const normalEnd = { x: carX + inward.x * normalLength, y: carY + inward.y * normalLength };
    const weightEnd = { x: carX, y: carY + 62 };
    const currentGraph = graphPoint(state.angle, values.ratio);
    const zeroY = graphPoint(0, -0.5).y;
    const validEnd = values.eventType === "complete" || values.eventType === "top-limit" ? 180 : values.eventAngle;
    const releaseY = clamp(372 - state.releaseHeight / state.radius * displayRadius, 39, 335);
    const ghostClass = ["detached", "unreachable"].includes(values.localState) ? "is-ghost" : "";
    return `
      <svg class="p53-svg p53-stage-${state.stage} is-${values.localState}" viewBox="0 0 720 430" role="img" aria-labelledby="p53-svg-title p53-svg-desc">
        <title id="p53-svg-title">Roller-coaster car in a vertical circular loop</title>
        <desc id="p53-svg-desc">The loop radius is ${clean(state.radius, 1)} metres and release height ${clean(state.releaseHeight, 1)} metres above the bottom. The selected angle is ${clean(state.angle, 0)} degrees from the bottom. ${localStateLabel(values)}. ${wholeLoopLabel(values)}.</desc>
        <defs>
          <marker id="p53-force-red" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p53-force-blue" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <linearGradient id="p53-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcecf2"/><stop offset="1" stop-color="#f5eedb"/></linearGradient>
        </defs>
        <rect width="720" height="430" fill="url(#p53-sky)" />

        <g class="p53-track" aria-hidden="true">
          <line x1="27" y1="372" x2="441" y2="372" />
          <circle cx="${centre.x}" cy="${centre.y}" r="${displayRadius}" />
          <path d="M31 ${clean(releaseY)} C92 ${clean(releaseY)}, 123 372, 245 372" />
          <line class="p53-height-guide" x1="31" y1="${clean(releaseY)}" x2="31" y2="372" />
          <text x="42" y="${clean(Math.max(52, releaseY - 11))}">release h=${clean(state.releaseHeight, 1)} m</text>
          <text x="245" y="393">bottom · θ=0°</text>
          <text x="245" y="61">top · θ=180°</text>
          <line class="p53-radius" x1="245" y1="224" x2="245" y2="372" />
          <text x="257" y="304">R=${clean(state.radius, 1)} m</text>
        </g>

        <g class="p53-car ${ghostClass}" transform="translate(${clean(carX)} ${clean(carY)}) rotate(${-state.angle})" aria-hidden="true">
          <rect x="-27" y="-16" width="54" height="25" rx="7" />
          <circle cx="-17" cy="11" r="7" /><circle cx="17" cy="11" r="7" />
          <path d="M-18 -16 L-8 -27 H15 L24 -16" />
        </g>
        <text class="p53-angle-label" x="${clean(carX + 15)}" y="${clean(carY - 22)}">θ=${clean(state.angle, 0)}°</text>

        <g class="p53-force-layer" aria-hidden="true">
          <line class="p53-weight" x1="${clean(carX)}" y1="${clean(carY)}" x2="${clean(weightEnd.x)}" y2="${clean(weightEnd.y)}" marker-end="url(#p53-force-red)" />
          <text x="${clean(weightEnd.x + 17)}" y="${clean(weightEnd.y - 7)}">mg</text>
          ${normalLength ? `<line class="p53-normal" x1="${clean(carX)}" y1="${clean(carY)}" x2="${clean(normalEnd.x)}" y2="${clean(normalEnd.y)}" marker-end="url(#p53-force-blue)" /><text x="${clean(normalEnd.x + 13)}" y="${clean(normalEnd.y - 8)}">N</text>` : ""}
          <line class="p53-inward-guide" x1="${clean(carX)}" y1="${clean(carY)}" x2="${centre.x}" y2="${centre.y}" />
        </g>

        <g class="p53-status" transform="translate(48 49)">
          <rect width="190" height="60" rx="14" />
          <text class="p53-status-kicker" x="14" y="22">CURRENT POSITION</text>
          <text class="p53-status-value" x="14" y="44">${localStateLabel(values)}</text>
        </g>

        <g class="p53-graph-layer" aria-hidden="true">
          <rect x="456" y="53" width="248" height="306" rx="15" />
          <text class="p53-graph-title" x="474" y="76">NORMAL FORCE AROUND THE CLIMB</text>
          <text class="p53-graph-axis-label" x="474" y="91">N/(mg)</text>
          <line class="p53-graph-axis" x1="478" y1="90" x2="478" y2="324" />
          <line class="p53-graph-axis" x1="478" y1="324" x2="684" y2="324" />
          <line class="p53-zero-line" x1="478" y1="${clean(zeroY)}" x2="684" y2="${clean(zeroY)}" />
          <text class="p53-graph-tick" x="470" y="${clean(zeroY + 3)}" text-anchor="end">0</text>
          <text class="p53-graph-tick" x="478" y="340">0°</text><text class="p53-graph-tick" x="684" y="340" text-anchor="end">180°</text>
          <path class="p53-demand-path" d="${graphPath(values.ratio)}" />
          <path class="p53-valid-path" d="${graphPath(values.ratio, validEnd)}" />
          <line class="p53-event-line" x1="${clean(graphPoint(validEnd, values.ratio).x)}" y1="90" x2="${clean(graphPoint(validEnd, values.ratio).x)}" y2="324" />
          <circle class="p53-current-point ${ghostClass}" cx="${clean(currentGraph.x)}" cy="${clean(currentGraph.y)}" r="6" />
          <text class="p53-graph-current" x="581" y="353">current N/(mg)=${clean(values.normalRatio, 2)}</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = trajectory();
    const speedText = values.accessibleByEnergy ? `${clean(values.speed, 3)} m/s` : "not energy-accessible";
    const normalText = values.localState === "contact" || values.localState === "turning"
      ? `${clean(values.physicalNormal / 1000, 3)} kN`
      : values.localState.includes("limit") ? "0 kN" : "no contact force";
    return `
      <section class="p53-metrics is-${values.localState}" aria-label="Loop dynamics values">
        <div><span>Height above bottom</span><strong>${clean(values.heightAtAngle, 2)} m</strong></div>
        <div><span>Energy speed</span><strong>${speedText}</strong></div>
        <div><span>Physical normal force</span><strong>${normalText}</strong></div>
        <div><span>Minimum release for this R</span><strong>${clean(values.minimumHeight, 2)} m</strong></div>
        <p><strong>${wholeLoopLabel(values)}.</strong> At the selected point: ${localStateLabel(values)}. The energy-plus-radial calculation demands N/(mg)=${clean(values.normalRatio, 3)}.</p>
      </section>`;
  }

  function controlsMarkup() {
    return `
      <section class="p53-controls" aria-label="Vertical loop controls">
        <label for="p53-height"><span>Release height h above bottom<output data-p53-live="height">${clean(state.releaseHeight, 1)} m</output></span><input id="p53-height" type="range" min="3" max="30" step="0.1" value="${state.releaseHeight}" /></label>
        <label for="p53-radius"><span>Loop radius R<output data-p53-live="radius">${clean(state.radius, 1)} m</output></span><input id="p53-radius" type="range" min="5" max="10" step="0.1" value="${state.radius}" /></label>
        <label for="p53-angle"><span>Position angle θ from bottom<output data-p53-live="angle">${clean(state.angle, 0)}°</output></span><input id="p53-angle" type="range" min="0" max="180" step="1" value="${state.angle}" /></label>
        <div class="p53-angle-labels"><span>bottom 0°</span><span>side 90°</span><span>top 180°</span></div>
        <div class="p53-presets" role="group" aria-label="Notable loop trajectories">
          <button class="chip-button" type="button" data-problem-action="p53-preset" data-p53-ratio="0.75">Turns back</button>
          <button class="chip-button" type="button" data-problem-action="p53-preset" data-p53-ratio="2">Loses contact</button>
          <button class="chip-button" type="button" data-problem-action="p53-preset" data-p53-ratio="2.5">Just maintains</button>
          <button class="chip-button" type="button" data-problem-action="p53-preset" data-p53-ratio="3">Contact margin</button>
        </div>
      </section>`;
  }

  function dynamicLabMarkup() {
    return `<div class="p53-dynamic"><div class="p53-visual-card"><div data-p53-svg-slot>${loopSvg()}</div>${stageCaption()}</div><div data-p53-metrics-slot>${metricsMarkup()}</div></div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p53-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const thresholdTopSpeed = Math.sqrt(GRAVITY * CHALLENGE_RADIUS);
    const thresholdBottomNormal = 6 * MASS * GRAVITY / 1000;
    return `
      <section class="p53-solution" data-p53-solution aria-labelledby="p53-solution-heading">
        <h3 id="p53-solution-heading" tabindex="-1">The top sets the contact threshold</h3>
        <p>At angle θ from the bottom, the car is R(1−cosθ) above the bottom. Energy conservation from rest at height h gives</p>
        <div class="p53-equation">v²=2g[h−R(1−cosθ)]</div>
        <p>Resolving forces inward gives</p>
        <div class="p53-equation">N−mg cosθ=mv²/R<br>N/(mg)=2h/R−2+3cosθ</div>
        <p>Since cosθ decreases from +1 to −1 during the climb, N is smallest at the top. Limiting contact there means Ntop=0:</p>
        <div class="p53-equation">vtop²/R−g=0 &nbsp;⇒&nbsp; vtop²=gR</div>
        <p>Energy at the top also gives vtop²=2g(h−2R). Combining the equations yields</p>
        <div class="p53-equation">hmin=5R/2</div>
        <p>For R=8.00 m, <strong>hmin=${clean(CHALLENGE_HEIGHT, 3)} m</strong> and <strong>vtop=${clean(thresholdTopSpeed, 3)} m/s</strong>. At the bottom v²=2gh=5gR, so</p>
        <div class="p53-equation">Nbottom=m(v²/R+g)=6mg=${clean(thresholdBottomNormal, 3)} kN</div>
        <p class="p53-limits"><strong>Checks and failure modes.</strong> If h&lt;R, the car runs out of kinetic energy and reverses before contact is lost. If R&lt;h&lt;2.5R, N reaches zero first and the car leaves the circular track. At h=2.5R the top speed is √(gR), not zero. For h&gt;2.5R, N remains positive throughout. The car is treated as a point mass on a frictionless rigid track; rolling energy and drag are omitted.</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = trajectory();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      massKg: MASS,
      gravityMetresPerSecondSquared: GRAVITY,
      releaseHeightMetres: state.releaseHeight,
      loopRadiusMetres: state.radius,
      angleFromBottomDegrees: state.angle,
      heightAtAngleMetres: Number(values.heightAtAngle.toFixed(6)),
      energySpeedMetresPerSecond: values.speed === null ? null : Number(values.speed.toFixed(6)),
      demandedNormalForceNewtons: Number(values.demandedNormal.toFixed(6)),
      physicalNormalForceNewtons: Number(values.physicalNormal.toFixed(6)),
      firstTrajectoryEvent: values.eventType,
      firstEventAngleDegrees: Number(values.eventAngle.toFixed(6)),
      localState: values.localState,
      minimumReleaseHeightMetres: values.minimumHeight,
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p53-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circular motion</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p53-spread">
          <article class="book-page p53-problem-page">
            <div class="problem-number">Problem 5.3</div>
            <h1 class="book-title p53-title">Roller coaster</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">A 400 kg coaster car is released from rest at height h above the bottom of a frictionless vertical loop of radius R. Treat the car as a point mass constrained to the inside of the circular track.</p>
            <p class="problem-copy">For R=8.00 m, find the minimum release height that maintains contact throughout. At this limiting height, find the speed at the top and the normal force at the bottom.</p>
            <section class="p53-contact-card"><strong>Unilateral contact</strong><p>The track can push the car inward with N≥0, but cannot pull it inward. A calculated N&lt;0 means the circular-path assumption has already failed.</p></section>
            <section class="p53-angle-card"><div class="eyebrow">Angle convention</div><p>θ=0° at the bottom, 90° at the right-hand side and 180° at the top. Inward always points towards the loop centre.</p></section>
          </article>

          <section class="book-page book-stage p53-stage">
            ${stageControls()}
            ${dynamicLabMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p53-coach">
            <div class="coach-kicker">Keep the wheels on</div>
            <p class="coach-question">For the 8.00 m challenge loop, give the limiting release height, top speed and bottom normal force.</p>
            <form class="p53-answer-form" data-p53-answer-form novalidate>
              <label for="p53-height-answer">Minimum release height</label>
              <div><input id="p53-height-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.heightAnswer)}" placeholder="height above bottom" autocomplete="off" /><span>m</span></div>
              <label for="p53-top-speed-answer">Speed at the top</label>
              <div><input id="p53-top-speed-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.topSpeedAnswer)}" placeholder="not zero" autocomplete="off" /><span>m/s</span></div>
              <label for="p53-bottom-normal-answer">Normal force at the bottom</label>
              <div><input id="p53-bottom-normal-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.bottomNormalAnswer)}" placeholder="in kilonewtons" autocomplete="off" /><span>kN</span></div>
              <button class="primary-button" type="submit">Check contact threshold</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p53-help-row">
              <button class="secondary-button" type="button" data-problem-action="p53-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p53-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p53-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function clearAnswers(root) {
    state.heightAnswer = "";
    state.topSpeedAnswer = "";
    state.bottomNormalAnswer = "";
    state.feedback = "";
    state.committed = false;
    ["#p53-height-answer", "#p53-top-speed-answer", "#p53-bottom-normal-answer"].forEach((selector) => {
      const input = root?.querySelector(selector);
      if (input) input.value = "";
    });
    root?.querySelector(".math2-feedback")?.remove();
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p53-shell");
    if (!root) return;
    const svgSlot = root.querySelector("[data-p53-svg-slot]");
    const metricsSlot = root.querySelector("[data-p53-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = loopSvg();
    if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const values = { height: `${clean(state.releaseHeight, 1)} m`, radius: `${clean(state.radius, 1)} m`, angle: `${clean(state.angle, 0)}°` };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p53-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const path = trajectory();
    root.querySelector("#p53-height")?.setAttribute("aria-valuetext", `Release height ${clean(state.releaseHeight, 1)} metres; ${wholeLoopLabel(path)}`);
    root.querySelector("#p53-radius")?.setAttribute("aria-valuetext", `Loop radius ${clean(state.radius, 1)} metres; minimum release ${clean(path.minimumHeight, 1)} metres`);
    root.querySelector("#p53-angle")?.setAttribute("aria-valuetext", `Position ${clean(state.angle, 0)} degrees from bottom; ${localStateLabel(path)}`);
    const solution = root.querySelector("[data-p53-solution]");
    if (solution) solution.outerHTML = solutionMarkup();
    clearAnswers(root);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p53-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p53-height");
          return;
        }
        if (action === "p53-stage") {
          state.stage = clamp(Number(control.dataset.p53Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p53-stage="${state.stage}"]`);
          return;
        }
        if (action === "p53-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p53-stage="${state.stage}"]`);
          return;
        }
        if (action === "p53-preset") {
          state.releaseHeight = Number((state.radius * clamp(Number(control.dataset.p53Ratio), 0.25, 6)).toFixed(2));
          state.angle = 180;
          state.heightAnswer = "";
          state.topSpeedAnswer = "";
          state.bottomNormalAnswer = "";
          state.feedback = "";
          state.committed = false;
          renderAndFocus(renderApp, "#p53-angle");
          return;
        }
        if (action === "p53-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p53-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p53-reveal") window.requestAnimationFrame(() => document.querySelector("#p53-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p53-height", key: "releaseHeight", min: 3, max: 30 },
      { selector: "#p53-radius", key: "radius", min: 5, max: 10 },
      { selector: "#p53-angle", key: "angle", min: 0, max: 180 },
    ].forEach(({ selector, key, min, max }) => {
      document.querySelector(selector)?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), min, max);
        updateDynamicDom();
      });
    });

    const heightInput = document.querySelector("#p53-height-answer");
    const speedInput = document.querySelector("#p53-top-speed-answer");
    const normalInput = document.querySelector("#p53-bottom-normal-answer");
    heightInput?.addEventListener("input", (event) => { state.heightAnswer = sanitizeNumber(event.target.value); });
    speedInput?.addEventListener("input", (event) => { state.topSpeedAnswer = sanitizeNumber(event.target.value); });
    normalInput?.addEventListener("input", (event) => { state.bottomNormalAnswer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p53-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.heightAnswer = sanitizeNumber(heightInput?.value).trim();
      state.topSpeedAnswer = sanitizeNumber(speedInput?.value).trim();
      state.bottomNormalAnswer = sanitizeNumber(normalInput?.value).trim();
      const height = Number(state.heightAnswer);
      const speed = Number(state.topSpeedAnswer);
      const normal = Number(state.bottomNormalAnswer);
      const targetSpeed = Math.sqrt(GRAVITY * CHALLENGE_RADIUS);
      const targetNormal = 6 * MASS * GRAVITY / 1000;
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.heightAnswer || !state.topSpeedAnswer || !state.bottomNormalAnswer || !Number.isFinite(height) || !Number.isFinite(speed) || !Number.isFinite(normal)) {
        state.feedback = "Enter the height in metres, top speed in m/s and bottom normal force in kN.";
      } else if (Math.abs(height - CHALLENGE_HEIGHT) > 0.03) {
        state.feedback = "At the limiting release, the top condition is N=0 but the top speed is not zero. Combine vtop²=gR with energy.";
      } else if (Math.abs(speed - targetSpeed) > 0.03) {
        state.feedback = "Use the radial equation at the top: gravity alone supplies the limiting centripetal acceleration, so vtop²=gR.";
      } else if (Math.abs(normal - targetNormal) > 0.03) {
        state.feedback = "At h=2.5R, energy gives vbottom²=5gR. Then add the car’s weight to mv²/R at the bottom.";
      } else {
        state.feedbackTone = "success";
        state.committed = true;
        state.feedback = `Correct: hmin=${clean(CHALLENGE_HEIGHT, 2)} m, vtop=${clean(targetSpeed, 3)} m/s and Nbottom=${clean(targetNormal, 3)} kN. The top has zero normal force; the bottom carries 6mg.`;
      }
      renderAndFocus(renderApp, "#p53-height-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
