(function registerBellaFioreCollisionPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "4.6";
  const SERVICE_MASS = 2;
  const DISPLAY_MASS = 3;
  const DISPLAY_IN = 0;
  const SERVICE_OUT = -0.5;
  const DISPLAY_OUT = 3;
  const REDUCED_MASS = SERVICE_MASS * DISPLAY_MASS / (SERVICE_MASS + DISPLAY_MASS);
  const EVIDENCE_MOMENTUM = SERVICE_MASS * SERVICE_OUT + DISPLAY_MASS * DISPLAY_OUT;
  const EVIDENCE_ENERGY = 0.5 * SERVICE_MASS * SERVICE_OUT ** 2 + 0.5 * DISPLAY_MASS * DISPLAY_OUT ** 2;
  const SOLVED_SPEED = (EVIDENCE_MOMENTUM - DISPLAY_MASS * DISPLAY_IN) / SERVICE_MASS;
  const SOLVED_RESTITUTION = (DISPLAY_OUT - SERVICE_OUT) / (SOLVED_SPEED - DISPLAY_IN);
  const stories = Object.freeze([
    Object.freeze({ id: "vale", name: "Tomas Vale", speed: 3.2, restitution: 0.90, note: "porter’s log" }),
    Object.freeze({ id: "bell", name: "Amara Bell", speed: 4.0, restitution: 0.875, note: "courier’s statement" }),
    Object.freeze({ id: "reed", name: "Carlo Reed", speed: 4.0, restitution: 0.40, note: "mechanic’s report" }),
    Object.freeze({ id: "neri", name: "Sofia Neri", speed: 5.0, restitution: 0.70, note: "security estimate" }),
  ]);
  const stages = Object.freeze([
    Object.freeze({ short: "Evidence", title: "Fix the signs at the scene", copy: "Right is +x. The service trolley’s measured −0.50 m/s means it rebounded left; it is not a negative speed." }),
    Object.freeze({ short: "Momentum", title: "Audit the approach story", copy: "During the brief impact, external horizontal impulse is negligible. Total signed momentum must match the laser-gate evidence." }),
    Object.freeze({ short: "Restitution", title: "Audit separation and energy", copy: "The coefficient e compares relative separation with relative approach. Its energy-loss prediction provides a final forensic cross-check." }),
  ]);
  const hints = Object.freeze([
    "Take rightward as positive. Momentum after impact is 2(−0.50)+3(3.00)=8.00 kg·m/s.",
    "Before impact, the display trolley was stationary. Thus 2u=8.00, so the service trolley’s pre-impact velocity is fixed before restitution is considered.",
    "Use separation speed divided by approach speed: e=(V−v)/(u−U). Here V−v=3.00−(−0.50)=3.50 m/s and U=0.",
    "As an audit, ΔK=½μr(1−e²)(u−U)² with reduced mass μr=mM/(m+M)=1.20 kg.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p46-reset">Reset</button>';

  const initialState = () => ({
    claimedSpeed: stories[0].speed,
    claimedRestitution: stories[0].restitution,
    activeStory: stories[0].id,
    stage: 0,
    speedAnswer: "",
    restitutionAnswer: "",
    storyAnswer: "",
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

  function audit(speed = state.claimedSpeed, restitution = state.claimedRestitution) {
    const approachSpeed = speed - DISPLAY_IN;
    const momentumBefore = SERVICE_MASS * speed + DISPLAY_MASS * DISPLAY_IN;
    const momentumResidual = momentumBefore - EVIDENCE_MOMENTUM;
    const observedSeparation = DISPLAY_OUT - SERVICE_OUT;
    const claimedSeparation = restitution * approachSpeed;
    const separationResidual = claimedSeparation - observedSeparation;
    const predictedServiceOut = (momentumBefore - DISPLAY_MASS * restitution * approachSpeed) / (SERVICE_MASS + DISPLAY_MASS);
    const predictedDisplayOut = (momentumBefore + SERVICE_MASS * restitution * approachSpeed) / (SERVICE_MASS + DISPLAY_MASS);
    const energyBefore = 0.5 * SERVICE_MASS * speed ** 2 + 0.5 * DISPLAY_MASS * DISPLAY_IN ** 2;
    const evidenceEnergyLoss = energyBefore - EVIDENCE_ENERGY;
    const restitutionEnergyLoss = 0.5 * REDUCED_MASS * (1 - restitution ** 2) * approachSpeed ** 2;
    const energyResidual = restitutionEnergyLoss - evidenceEnergyLoss;
    const momentumPass = Math.abs(momentumResidual) <= 0.01;
    const restitutionPass = Math.abs(separationResidual) <= 0.01;
    const energyPass = Math.abs(energyResidual) <= 0.02;
    return {
      approachSpeed,
      momentumBefore,
      momentumResidual,
      observedSeparation,
      claimedSeparation,
      separationResidual,
      predictedServiceOut,
      predictedDisplayOut,
      energyBefore,
      evidenceEnergyLoss,
      restitutionEnergyLoss,
      energyResidual,
      momentumPass,
      restitutionPass,
      energyPass,
      consistent: momentumPass && restitutionPass && energyPass,
    };
  }

  function verdictLabel(result = audit()) {
    if (result.consistent) return "All evidence agrees";
    if (result.momentumPass && !result.restitutionPass) return "Momentum only · bumper claim fails";
    if (!result.momentumPass && result.restitutionPass) return "Restitution only · speed claim fails";
    return "Story contradicted";
  }

  function storyForId(id) {
    return stories.find((story) => story.id === id) || null;
  }

  function reconstructionNote() {
    return `
      <p class="p46-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function stageTabs() {
    return `
      <div class="p46-stage-tabs" role="group" aria-label="Collision forensics stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p46-stage" data-p46-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageHeading() {
    const stage = stages[state.stage];
    return `
      <div class="p46-stage-heading">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><h2>${stage.title}</h2></div>
        <p>${stage.copy}</p>
        <button class="ghost-button" type="button" data-problem-action="p46-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Case audited" : "Next evidence"}</button>
      </div>`;
  }

  function velocityArrow(x, y, velocity, kind, label) {
    const direction = velocity < 0 ? -1 : 1;
    const length = Math.abs(velocity) < 0.005 ? 0 : Math.min(124, 24 + Math.abs(velocity) * 20);
    const end = x + direction * length;
    return `
      <g class="p46-velocity is-${kind}">
        ${length ? `<line x1="${x}" y1="${y}" x2="${clean(end)}" y2="${y}" marker-end="url(#p46-${kind}-arrow)" />` : `<circle cx="${x}" cy="${y}" r="5" />`}
        <text x="${clean((x + end) / 2)}" y="${y - 11}">${label} ${signed(velocity, 2)} m/s</text>
      </g>`;
  }

  function trolley(x, y, kind, label, mass) {
    return `
      <g class="p46-trolley is-${kind}" transform="translate(${x} ${y})" aria-hidden="true">
        <rect x="-48" y="-28" width="96" height="40" rx="7" />
        <path d="M-36 -28 V-43 H36 V-28 M-25 -35 H25" />
        ${kind === "display" ? '<path class="p46-gem" d="M0 -61 L17 -47 L10 -26 H-10 L-17 -47 Z" />' : '<path class="p46-crate" d="M-18 -24 H18 V4 H-18 Z M-18 -24 L0 -10 L18 -24" />'}
        <circle cx="-29" cy="18" r="10" /><circle cx="29" cy="18" r="10" />
        <text x="0" y="43">${label} · ${clean(mass, 0)} kg</text>
      </g>`;
  }

  function collisionSvg() {
    const result = audit();
    const momentumClass = result.momentumPass ? "pass" : "fail";
    const restitutionClass = result.restitutionPass ? "pass" : "fail";
    const energyClass = result.energyPass ? "pass" : "fail";
    return `
      <svg class="p46-svg p46-stage-${state.stage} is-${result.consistent ? "consistent" : "contradicted"}" viewBox="0 0 720 440" role="img" aria-labelledby="p46-svg-title p46-svg-desc">
        <title id="p46-svg-title">Forensic reconstruction of two colliding museum trolleys</title>
        <desc id="p46-svg-desc">The tested story claims a service-trolley approach velocity of ${signed(state.claimedSpeed)} metres per second and restitution ${clean(state.claimedRestitution, 3)}. Laser gates measured outgoing velocities of ${signed(SERVICE_OUT)} and ${signed(DISPLAY_OUT)} metres per second. ${verdictLabel(result)}.</desc>
        <defs>
          <marker id="p46-story-arrow" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p46-evidence-arrow" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <linearGradient id="p46-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e1e8e4"/><stop offset="1" stop-color="#f4edda"/></linearGradient>
        </defs>
        <rect class="p46-wall" width="720" height="440" fill="url(#p46-wall)" />
        <g class="p46-axis" aria-hidden="true"><line x1="44" y1="29" x2="676" y2="29" marker-end="url(#p46-evidence-arrow)"/><text x="44" y="19">−x · left</text><text x="676" y="19">+x · right</text></g>

        <g class="p46-before-lane">
          <text class="p46-lane-title" x="38" y="64">STORY · IMMEDIATELY BEFORE IMPACT</text>
          <line class="p46-track" x1="38" y1="167" x2="682" y2="167" />
          ${trolley(220, 135, "service", "service trolley", SERVICE_MASS)}
          ${trolley(500, 135, "display", "emerald display", DISPLAY_MASS)}
          ${velocityArrow(220, 82, state.claimedSpeed, "story", "u")}
          ${velocityArrow(500, 82, DISPLAY_IN, "story", "U")}
          <text class="p46-evidence-tag" x="500" y="72">brake log: stationary</text>
        </g>

        <g class="p46-after-lane">
          <text class="p46-lane-title" x="38" y="209">LASER GATES · IMMEDIATELY AFTER IMPACT</text>
          <line class="p46-track" x1="38" y1="311" x2="682" y2="311" />
          ${trolley(254, 279, "service", "service trolley", SERVICE_MASS)}
          ${trolley(486, 279, "display", "emerald display", DISPLAY_MASS)}
          ${velocityArrow(254, 226, SERVICE_OUT, "evidence", "v")}
          ${velocityArrow(486, 226, DISPLAY_OUT, "evidence", "V")}
          <g class="p46-gate" transform="translate(105 226)"><path d="M0 75 V0 H28 V75"/><circle cx="14" cy="14" r="5"/><text x="14" y="91">gate A</text></g>
          <g class="p46-gate" transform="translate(594 226)"><path d="M0 75 V0 H28 V75"/><circle cx="14" cy="14" r="5"/><text x="14" y="91">gate B</text></g>
        </g>

        <g class="p46-audit-layer" aria-hidden="true">
          <g class="p46-audit-card p46-momentum-card is-${momentumClass}" transform="translate(35 340)">
            <rect width="205" height="77" rx="12"/><text class="p46-audit-kicker" x="13" y="21">MOMENTUM</text>
            <text class="p46-audit-value" x="13" y="43">residual ${signed(result.momentumResidual, 2)} kg·m/s</text>
            <text class="p46-audit-note" x="13" y="62">${result.momentumPass ? "PASS · before = after" : "FAIL · signed totals differ"}</text>
          </g>
          <g class="p46-audit-card p46-restitution-card is-${restitutionClass}" transform="translate(257 340)">
            <rect width="205" height="77" rx="12"/><text class="p46-audit-kicker" x="13" y="21">RELATIVE SPEED</text>
            <text class="p46-audit-value" x="13" y="43">${clean(result.claimedSeparation, 2)} vs ${clean(result.observedSeparation, 2)} m/s</text>
            <text class="p46-audit-note" x="13" y="62">${result.restitutionPass ? "PASS · e × approach" : "FAIL · separation differs"}</text>
          </g>
          <g class="p46-audit-card p46-energy-card is-${energyClass}" transform="translate(479 340)">
            <rect width="205" height="77" rx="12"/><text class="p46-audit-kicker" x="13" y="21">ENERGY-LOSS AUDIT</text>
            <text class="p46-audit-value" x="13" y="43">residual ${signed(result.energyResidual, 2)} J</text>
            <text class="p46-audit-note" x="13" y="62">${result.energyPass ? "PASS · restitution agrees" : "FAIL · loss differs"}</text>
          </g>
        </g>

        <g class="p46-verdict" transform="translate(488 43)">
          <rect width="196" height="61" rx="14" />
          <text class="p46-verdict-kicker" x="14" y="22">STORY VERDICT</text>
          <text class="p46-verdict-value" x="14" y="44">${verdictLabel(result)}</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const result = audit();
    return `
      <section class="p46-metrics" aria-label="Collision evidence audit">
        <div class="is-${result.momentumPass ? "pass" : "fail"}"><span>Story momentum before</span><strong>${clean(result.momentumBefore, 2)} kg·m/s</strong><small>evidence after ${clean(EVIDENCE_MOMENTUM, 2)}</small></div>
        <div class="is-${result.restitutionPass ? "pass" : "fail"}"><span>Claimed separation e(u−U)</span><strong>${clean(result.claimedSeparation, 3)} m/s</strong><small>observed ${clean(result.observedSeparation, 3)}</small></div>
        <div><span>Equations predict service v</span><strong>${signed(result.predictedServiceOut, 3)} m/s</strong><small>gate measured ${signed(SERVICE_OUT, 3)}</small></div>
        <div><span>Equations predict display V</span><strong>${signed(result.predictedDisplayOut, 3)} m/s</strong><small>gate measured ${signed(DISPLAY_OUT, 3)}</small></div>
        <p><strong>${verdictLabel(result)}.</strong> The tested story implies a ${clean(result.restitutionEnergyLoss, 3)} J restitution loss; comparing its claimed pre-impact energy with the measured post-impact energy gives ${clean(result.evidenceEnergyLoss, 3)} J.</p>
      </section>`;
  }

  function dynamicLabMarkup() {
    return `<div class="p46-dynamic">${collisionSvg()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    return `
      <section class="p46-controls" aria-label="Test a collision story">
        <label for="p46-speed"><span>Claimed incoming velocity u<output data-p46-live="speed">${signed(state.claimedSpeed, 2)} m/s</output></span><input id="p46-speed" type="range" min="0.5" max="7" step="0.1" value="${state.claimedSpeed}" /></label>
        <label for="p46-restitution"><span>Claimed coefficient e<output data-p46-live="restitution">${clean(state.claimedRestitution, 3)}</output></span><input id="p46-restitution" type="range" min="0" max="1" step="0.005" value="${state.claimedRestitution}" /></label>
        <div class="p46-scale-labels"><span>perfectly inelastic e=0</span><span>elastic e=1</span></div>
        <div class="p46-presets" role="group" aria-label="Suspect stories">
          ${stories.map((story) => `<button class="chip-button ${state.activeStory === story.id ? "active" : ""}" type="button" data-problem-action="p46-story" data-p46-story="${story.id}">${story.name.split(" ")[1]}</button>`).join("")}
        </div>
      </section>`;
  }

  function storyDocket() {
    return `
      <section class="p46-docket" aria-labelledby="p46-docket-heading">
        <div class="eyebrow" id="p46-docket-heading">Four recorded stories</div>
        ${stories.map((story) => `<div><strong>${story.name}</strong><span>${story.note}</span><p>u=${clean(story.speed, 2)} m/s · e=${clean(story.restitution, 3)}</p></div>`).join("")}
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p46-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const solved = audit(SOLVED_SPEED, SOLVED_RESTITUTION);
    return `
      <section class="p46-solution" aria-labelledby="p46-solution-heading">
        <h3 id="p46-solution-heading" tabindex="-1">One intersection, one viable story</h3>
        <p>Take rightward as positive. During impact, horizontal momentum is conserved:</p>
        <div class="p46-equation">mu+MU = mv+MV<br>2u+3(0) = 2(−0.50)+3(3.00)</div>
        <p>Therefore <strong>u=${clean(SOLVED_SPEED, 3)} m/s</strong>. The negative v records a rebound; it must not be replaced by its magnitude.</p>
        <p>Newton’s restitution law uses relative speeds:</p>
        <div class="p46-equation">e = speed of separation / speed of approach<br>e = (V−v)/(u−U) = [3.00−(−0.50)]/(4.00−0)<br>e = ${clean(SOLVED_RESTITUTION, 3)}</div>
        <p>These values predict v=${signed(solved.predictedServiceOut, 3)} m/s and V=${signed(solved.predictedDisplayOut, 3)} m/s, exactly matching both laser gates. Only <strong>Amara Bell’s</strong> story contains both values.</p>
        <p>The kinetic-energy audit is independent arithmetic on the same collision:</p>
        <div class="p46-equation">Kbefore = ½(2)(4²) = 16.00 J<br>Kafter = ½(2)(−0.50)²+½(3)(3.00)² = 13.75 J<br>loss = 2.25 J</div>
        <p>Using μr=2×3/(2+3)=1.20 kg, restitution predicts ½μr(1−e²)(u−U)²=${clean(solved.restitutionEnergyLoss, 3)} J: the same loss.</p>
        <p class="p46-limits"><strong>Checks and edges.</strong> At e=0 the bodies have no relative separation; at e=1 this ideal model loses no kinetic energy. Restitution alone permits the curve e=3.5/u, so Sofia Neri’s (5.0,0.70) pair passes that test but fails momentum. Momentum alone fixes u=4.0 but cannot choose between Bell and Reed. Their unique intersection identifies Bell. A computed e outside 0≤e≤1 would contradict a passive ordinary impact model.</p>
      </section>`;
  }

  function stateSnapshot() {
    const result = audit();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      positiveDirection: "right",
      serviceMassKg: SERVICE_MASS,
      displayMassKg: DISPLAY_MASS,
      displayVelocityBeforeMetresPerSecond: DISPLAY_IN,
      measuredServiceVelocityAfterMetresPerSecond: SERVICE_OUT,
      measuredDisplayVelocityAfterMetresPerSecond: DISPLAY_OUT,
      claimedServiceVelocityBeforeMetresPerSecond: state.claimedSpeed,
      claimedRestitution: state.claimedRestitution,
      momentumResidualKgMetresPerSecond: Number(result.momentumResidual.toFixed(6)),
      separationResidualMetresPerSecond: Number(result.separationResidual.toFixed(6)),
      energyLossResidualJoules: Number(result.energyResidual.toFixed(6)),
      predictedOutgoingVelocities: {
        serviceMetresPerSecond: Number(result.predictedServiceOut.toFixed(6)),
        displayMetresPerSecond: Number(result.predictedDisplayOut.toFixed(6)),
      },
      evidenceConsistent: result.consistent,
      uniqueSolution: { speedMetresPerSecond: SOLVED_SPEED, restitution: SOLVED_RESTITUTION, story: "bell" },
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p46-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive collision forensics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p46-spread">
          <article class="book-page p46-problem-page">
            <div class="problem-number">Problem 4.6</div>
            <h1 class="book-title p46-title">Sherlock Holmes and the Bella Fiore emerald</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">The 3 kg emerald display trolley was stationary when a 2 kg service trolley struck it from the left. Immediately afterwards, calibrated laser gates recorded the service trolley at −0.50 m/s and the display trolley at +3.00 m/s. Right is positive.</p>
            <p class="problem-copy">Four accounts give the service trolley’s pre-impact velocity u and the bumper pair’s coefficient of restitution e. Which account is compatible with momentum, restitution and the kinetic-energy loss?</p>
            ${storyDocket()}
            <section class="p46-rule-card"><strong>Scene rule</strong><p>The impact is brief, head-on and one-dimensional. External horizontal impulse during it is negligible. Both trolleys translate without rotating.</p></section>
          </article>

          <section class="book-page book-stage p46-stage">
            ${stageTabs()}
            ${stageHeading()}
            ${dynamicLabMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p46-coach">
            <div class="coach-kicker">Close the case</div>
            <p class="coach-question">Recover u and e from the evidence, then identify the only consistent story.</p>
            <form class="p46-answer-form" data-p46-answer-form novalidate>
              <label for="p46-speed-answer">Pre-impact service velocity u</label>
              <div><input id="p46-speed-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.speedAnswer)}" placeholder="e.g. +3.50" autocomplete="off" /><span>m/s</span></div>
              <label for="p46-restitution-answer">Coefficient of restitution e</label>
              <input id="p46-restitution-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.restitutionAnswer)}" placeholder="between 0 and 1" autocomplete="off" />
              <label for="p46-story-answer">Consistent story</label>
              <select id="p46-story-answer">
                <option value="" ${state.storyAnswer === "" ? "selected" : ""}>Choose a person…</option>
                ${stories.map((story) => `<option value="${story.id}" ${state.storyAnswer === story.id ? "selected" : ""}>${story.name}</option>`).join("")}
              </select>
              <button class="primary-button" type="submit">Test conclusion</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p46-help-row">
              <button class="secondary-button" type="button" data-problem-action="p46-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p46-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p46-debug">${debugPanel("Development state", stateSnapshot())}</div>
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
    const root = document.querySelector(".p46-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p46-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicLabMarkup();
    root.querySelectorAll('[data-p46-live="speed"]').forEach((node) => { node.textContent = `${signed(state.claimedSpeed, 2)} m/s`; });
    root.querySelectorAll('[data-p46-live="restitution"]').forEach((node) => { node.textContent = clean(state.claimedRestitution, 3); });
    const speedSlider = root.querySelector("#p46-speed");
    const restitutionSlider = root.querySelector("#p46-restitution");
    speedSlider?.setAttribute("aria-valuetext", `Claimed incoming velocity ${signed(state.claimedSpeed, 2)} metres per second; ${verdictLabel()}`);
    restitutionSlider?.setAttribute("aria-valuetext", `Claimed coefficient of restitution ${clean(state.claimedRestitution, 3)}; ${verdictLabel()}`);
    root.querySelectorAll(".p46-presets button").forEach((button) => button.classList.toggle("active", button.dataset.p46Story === state.activeStory));
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p46-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p46-speed");
          return;
        }
        if (action === "p46-stage") {
          state.stage = clamp(Number(control.dataset.p46Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p46-stage="${state.stage}"]`);
          return;
        }
        if (action === "p46-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p46-stage="${state.stage}"]`);
          return;
        }
        if (action === "p46-story") {
          const story = storyForId(control.dataset.p46Story);
          if (!story) return;
          state.claimedSpeed = story.speed;
          state.claimedRestitution = story.restitution;
          state.activeStory = story.id;
          renderAndFocus(renderApp, `[data-p46-story="${story.id}"]`);
          return;
        }
        if (action === "p46-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p46-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p46-reveal") window.requestAnimationFrame(() => document.querySelector("#p46-solution-heading")?.focus());
      });
    });

    const speedSlider = document.querySelector("#p46-speed");
    const restitutionSlider = document.querySelector("#p46-restitution");
    speedSlider?.addEventListener("input", (event) => {
      state.claimedSpeed = clamp(Number(event.target.value), 0.5, 7);
      state.activeStory = "";
      updateDynamicDom();
    });
    restitutionSlider?.addEventListener("input", (event) => {
      state.claimedRestitution = clamp(Number(event.target.value), 0, 1);
      state.activeStory = "";
      updateDynamicDom();
    });

    const speedInput = document.querySelector("#p46-speed-answer");
    const restitutionInput = document.querySelector("#p46-restitution-answer");
    const storyInput = document.querySelector("#p46-story-answer");
    speedInput?.addEventListener("input", (event) => { state.speedAnswer = sanitizeNumber(event.target.value); });
    restitutionInput?.addEventListener("input", (event) => { state.restitutionAnswer = sanitizeNumber(event.target.value); });
    storyInput?.addEventListener("change", (event) => { state.storyAnswer = event.target.value; });
    document.querySelector("[data-p46-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.speedAnswer = sanitizeNumber(speedInput?.value).trim();
      state.restitutionAnswer = sanitizeNumber(restitutionInput?.value).trim();
      state.storyAnswer = storyInput?.value || "";
      const speed = Number(state.speedAnswer);
      const restitution = Number(state.restitutionAnswer);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.speedAnswer || !state.restitutionAnswer || !Number.isFinite(speed) || !Number.isFinite(restitution) || !state.storyAnswer) {
        state.feedback = "Enter u and e, then choose one recorded story.";
      } else if (Math.abs(speed - SOLVED_SPEED) > 0.03) {
        state.feedback = "Start with signed momentum. The service trolley’s negative outgoing velocity subtracts from the display trolley’s positive momentum.";
      } else if (Math.abs(restitution - SOLVED_RESTITUTION) > 0.003) {
        state.feedback = "Your momentum result is sound. Now divide relative separation V−v by relative approach u−U; keep v negative.";
      } else if (state.storyAnswer !== "bell") {
        state.feedback = "Those numerical values identify a different record. Compare both u and e with every story in the docket.";
      } else {
        state.feedbackTone = "success";
        state.committed = true;
        state.stage = 2;
        state.feedback = `Case closed: u=${clean(SOLVED_SPEED, 3)} m/s and e=${clean(SOLVED_RESTITUTION, 3)}. Only Amara Bell’s story satisfies momentum, separation and the ${clean(audit(SOLVED_SPEED, SOLVED_RESTITUTION).evidenceEnergyLoss, 2)} J energy loss.`;
      }
      renderAndFocus(renderApp, "#p46-speed-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
