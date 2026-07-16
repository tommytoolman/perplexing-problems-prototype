(function registerWheelWarsTwoPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "3.6";
  const DRIVER_RADIUS = 1.00;
  const DRIVEN_RADIUS = 2.00;
  const BASELINE_NORMAL = 200;
  const BASELINE_MU = 0.40;
  const BASELINE_TORQUE = 120;
  const BASELINE_DRIVER_LIMIT = BASELINE_MU * BASELINE_NORMAL * DRIVER_RADIUS;
  const BASELINE_DRIVEN_LIMIT = BASELINE_MU * BASELINE_NORMAL * DRIVEN_RADIUS;
  const stages = Object.freeze([
    Object.freeze({ short: "Demand", title: "Convert torque into contact force", copy: "The driver’s shaft torque demands a tangential contact force F = |τA|/rA." }),
    Object.freeze({ short: "Grip", title: "Compare demand with static grip", copy: "The contact can supply at most μsN without relative slipping." }),
    Object.freeze({ short: "Transfer", title: "Send torque to the other wheel", copy: "During grip, equal-and-opposite contact forces give the driven wheel and its shaft load torque F rB in the opposite rotational sense." }),
  ]);
  const hints = Object.freeze([
    "Balance moments on the driver wheel. A tangential force F at radius rA produces moment FrA, so the demanded force is |τA|/rA.",
    "Static friction is whatever is needed up to its ceiling: |F| ≤ μsN. The greatest no-slip driver torque is therefore μsNrA.",
    "Newton’s third law reverses the contact force on wheel B. External wheels consequently turn in opposite senses, and |τB| = |F|rB while they grip.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p36-reset">Reset</button>';

  const initialState = () => ({
    torque: BASELINE_TORQUE,
    normal: BASELINE_NORMAL,
    mu: BASELINE_MU,
    direction: "ccw",
    stage: 0,
    maxDriverAnswer: "",
    maxDrivenAnswer: "",
    regimeAnswer: "",
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

  function clean(value, digits = 1) {
    if (!Number.isFinite(value)) return "∞";
    return Number(value).toFixed(digits);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replace(/[^0-9.\s-]/g, "").slice(0, 16);
  }

  function demandForce() {
    return Math.abs(state.torque) / DRIVER_RADIUS;
  }

  function gripLimit() {
    return Math.max(0, state.mu) * Math.max(0, state.normal);
  }

  function contactState() {
    const demand = demandForce();
    const limit = gripLimit();
    const scale = Math.max(1, demand, limit);
    const tolerance = scale * 1e-7;
    if (demand <= tolerance) return "no-load";
    if (Math.abs(demand - limit) <= tolerance) return "limiting";
    return demand < limit ? "grip" : "slip";
  }

  function currentStatics() {
    const demand = demandForce();
    const limit = gripLimit();
    const regime = contactState();
    const canGrip = regime === "grip" || regime === "limiting" || regime === "no-load";
    const supportedForce = canGrip ? demand : limit;
    const utilisation = limit > 0 ? demand / limit : demand === 0 ? 0 : Infinity;
    return {
      demand,
      limit,
      regime,
      canGrip,
      supportedForce,
      utilisation,
      driverTorqueLimit: limit * DRIVER_RADIUS,
      drivenTorqueDemand: demand * DRIVEN_RADIUS,
      drivenTorqueSupported: supportedForce * DRIVEN_RADIUS,
      drivenDirection: state.direction === "cw" ? "counterclockwise" : "clockwise",
      driverDirection: state.direction === "cw" ? "clockwise" : "counterclockwise",
    };
  }

  function regimeLabel(regime = contactState()) {
    if (regime === "no-load") return "No tangential load";
    if (regime === "limiting") return "Limiting grip";
    if (regime === "grip") return "Grip · no slip";
    return "Slip · static equilibrium fails";
  }

  function reconstructionNote() {
    return `
      <p class="stat3-reconstruction-note p36-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function wheelSpokes(cx, cy, radius, count = 10) {
    return Array.from({ length: count }, (_, index) => {
      const angle = index * 2 * Math.PI / count;
      return `<line x1="${cx}" y1="${cy}" x2="${clean(cx + radius * Math.cos(angle), 2)}" y2="${clean(cy + radius * Math.sin(angle), 2)}" />`;
    }).join("");
  }

  function wheelSvg() {
    const values = currentStatics();
    const clockwise = state.direction === "cw";
    const frictionOnA = clockwise
      ? { x1: 314, y1: 230, x2: 314, y2: 169 }
      : { x1: 314, y1: 210, x2: 314, y2: 271 };
    const frictionOnB = clockwise
      ? { x1: 326, y1: 210, x2: 326, y2: 271 }
      : { x1: 326, y1: 230, x2: 326, y2: 169 };
    const driverArc = clockwise
      ? "M208 162 A70 70 0 0 1 312 189"
      : "M312 189 A70 70 0 0 0 208 162";
    const drivenArc = clockwise
      ? "M535 127 A125 125 0 0 0 337 167"
      : "M337 167 A125 125 0 0 1 535 127";
    return `
      <svg class="p36-svg p36-stage-${state.stage} is-${values.regime}" data-p36-svg viewBox="0 0 700 420" role="img" aria-labelledby="p36-svg-title p36-svg-desc">
        <title id="p36-svg-title">Two externally contacting wheels with a static-friction limit</title>
        <desc id="p36-svg-desc" data-p36-svg-desc>${state.direction === "cw" ? "Clockwise" : "Counterclockwise"} torque is applied to wheel A. Tangential demand is ${clean(values.demand)} newtons and static grip limit is ${clean(values.limit)} newtons. The contact is in ${regimeLabel(values.regime).toLowerCase()}.</desc>
        <defs>
          <marker id="p36-torque-arrow" markerWidth="9" markerHeight="9" refX="7.3" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p36-force-arrow" markerWidth="9" markerHeight="9" refX="7.3" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p36-normal-arrow" markerWidth="9" markerHeight="9" refX="7.3" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
        </defs>

        <g class="p36-wheel p36-driver" aria-hidden="true">
          <circle cx="250" cy="220" r="70" />
          <g class="p36-spokes">${wheelSpokes(250, 220, 56)}</g>
          <circle class="p36-hub" cx="250" cy="220" r="17" />
          <text x="250" y="226">A</text>
          <text class="p36-radius-label" x="217" y="274">rA = 1.00 m</text>
        </g>
        <g class="p36-wheel p36-driven" aria-hidden="true">
          <circle cx="445" cy="220" r="125" />
          <g class="p36-spokes">${wheelSpokes(445, 220, 101, 12)}</g>
          <circle class="p36-hub" cx="445" cy="220" r="22" />
          <text x="445" y="226">B</text>
          <text class="p36-radius-label" x="410" y="315">rB = 2.00 m</text>
        </g>

        <g class="p36-demand-layer" aria-hidden="true">
          <path class="p36-driver-torque" d="${driverArc}" marker-end="url(#p36-torque-arrow)" />
          <text class="p36-torque-label" data-p36-torque-label x="158" y="135">τA = ${clean(state.torque, 0)} N·m</text>
          <line class="p36-friction-a" x1="${frictionOnA.x1}" y1="${frictionOnA.y1}" x2="${frictionOnA.x2}" y2="${frictionOnA.y2}" marker-end="url(#p36-force-arrow)" />
          <text class="p36-force-label" x="276" y="${clockwise ? 161 : 294}">F on A</text>
        </g>

        <g class="p36-limit-layer" aria-hidden="true">
          <line class="p36-normal-a" x1="313" y1="205" x2="270" y2="205" marker-end="url(#p36-normal-arrow)" />
          <line class="p36-normal-b" x1="327" y1="235" x2="370" y2="235" marker-end="url(#p36-normal-arrow)" />
          <text class="p36-normal-label" x="285" y="194">N</text>
          <text class="p36-mu-label" x="319" y="365">|F| ≤ μsN</text>
        </g>

        <g class="p36-transfer-layer" aria-hidden="true">
          <line class="p36-friction-b" x1="${frictionOnB.x1}" y1="${frictionOnB.y1}" x2="${frictionOnB.x2}" y2="${frictionOnB.y2}" marker-end="url(#p36-force-arrow)" />
          <text class="p36-force-label" x="365" y="${clockwise ? 294 : 161}">F on B</text>
          <path class="p36-driven-torque" d="${drivenArc}" marker-end="url(#p36-torque-arrow)" />
          <text class="p36-torque-label" x="548" y="102">τB</text>
        </g>

        <g class="p36-contact" aria-hidden="true">
          <line x1="320" y1="183" x2="320" y2="257" />
          <circle cx="320" cy="220" r="7" />
          <path class="p36-slip-marks" d="M306 184 l-12 -13 M335 199 l13 -10 M305 248 l-13 12 M335 242 l14 13" />
        </g>

        <g class="p36-status" data-p36-svg-status transform="translate(495 326)">
          <rect width="174" height="65" rx="14" />
          <text class="p36-status-kicker" x="15" y="23">CONTACT STATE</text>
          <text class="p36-status-value" data-p36-status-text x="15" y="47">${regimeLabel(values.regime)}</text>
        </g>
      </svg>`;
  }

  function stageControls() {
    return `
      <div class="p36-stage-controls" role="group" aria-label="Wheel contact analysis stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p36-stage" data-p36-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p36-stage-caption" aria-live="polite">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p36-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Contact resolved" : "Next stage"}</button>
      </div>`;
  }

  function rangeControl({ id, label, value, min, max, step, unit, liveKey }) {
    return `
      <label class="p36-control" for="${id}">
        <span>${label}<strong data-p36-live="${liveKey}">${clean(value, liveKey === "mu" ? 2 : 0)}${unit}</strong></span>
        <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
      </label>`;
  }

  function controlsMarkup() {
    return `
      <section class="p36-controls" aria-labelledby="p36-controls-title">
        <div class="eyebrow" id="p36-controls-title">Contact controls</div>
        ${rangeControl({ id: "p36-torque", label: "Applied |τA|", value: state.torque, min: 0, max: 180, step: 1, unit: " N·m", liveKey: "torque" })}
        ${rangeControl({ id: "p36-mu", label: "Static coefficient μs", value: state.mu, min: 0, max: 0.8, step: 0.01, unit: "", liveKey: "mu" })}
        ${rangeControl({ id: "p36-normal", label: "Clamping normal N", value: state.normal, min: 0, max: 500, step: 5, unit: " N", liveKey: "normal" })}
        <div class="p36-direction" role="group" aria-label="Direction of applied driver torque">
          <span>Driver direction</span>
          <button type="button" data-problem-action="p36-direction" data-p36-direction="cw" aria-pressed="${state.direction === "cw"}">Clockwise</button>
          <button type="button" data-problem-action="p36-direction" data-p36-direction="ccw" aria-pressed="${state.direction === "ccw"}">Counterclockwise</button>
        </div>
        <div class="p36-presets" role="group" aria-label="Contact regime presets">
          <button class="chip-button" type="button" data-problem-action="p36-preset" data-p36-torque="50">Grip</button>
          <button class="chip-button" type="button" data-problem-action="p36-preset" data-p36-torque="80">Limit</button>
          <button class="chip-button" type="button" data-problem-action="p36-preset" data-p36-torque="120">Slip</button>
        </div>
      </section>`;
  }

  function comparisonMarkup() {
    const values = currentStatics();
    const chartMax = Math.max(1, values.demand, values.limit) * 1.12;
    const demandWidth = Math.min(100, values.demand / chartMax * 100);
    const limitWidth = Math.min(100, values.limit / chartMax * 100);
    const drivenLabel = values.canGrip ? "Transmitted τB" : "Static τB ceiling";
    return `
      <section class="p36-comparison is-${values.regime}" data-p36-comparison aria-labelledby="p36-comparison-title">
        <div class="p36-comparison-heading"><div><div class="eyebrow">Force comparison</div><h2 id="p36-comparison-title" data-p36-regime>${regimeLabel(values.regime)}</h2></div><span data-p36-utilisation>${clean(values.utilisation * 100, 0)}% grip used</span></div>
        <div class="p36-force-bars">
          <div><span>Demand · |τA|/rA</span><i><b data-p36-demand-bar style="width:${demandWidth}%"></b></i><strong data-p36-live="demand">${clean(values.demand)} N</strong></div>
          <div><span>Limit · μsN</span><i><b data-p36-limit-bar style="width:${limitWidth}%"></b></i><strong data-p36-live="limit">${clean(values.limit)} N</strong></div>
        </div>
        <div class="p36-metrics">
          <div><span>Driver no-slip limit</span><strong data-p36-live="driver-limit">${clean(values.driverTorqueLimit)} N·m</strong></div>
          <div><span data-p36-driven-label>${drivenLabel}</span><strong data-p36-live="driven-torque">${clean(values.drivenTorqueSupported)} N·m</strong></div>
          <div><span>Driven tendency</span><strong data-p36-direction-text>${values.drivenDirection}</strong></div>
        </div>
        <p class="p36-regime-note" data-p36-regime-note>${values.canGrip
          ? `Static friction supplies ${clean(values.demand)} N—only the amount demanded—and wheel B receives ${clean(values.drivenTorqueSupported)} N·m.`
          : `The requested ${clean(values.demand)} N exceeds μsN. No-slip statics can transfer at most ${clean(values.drivenTorqueSupported)} N·m to B; actual sliding torque requires μk.`}</p>
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p36-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p36-solution" aria-labelledby="p36-solution-heading">
        <h3 id="p36-solution-heading" tabindex="-1">Grip has a hard ceiling</h3>
        <p>For wheel A, moment balance demands</p>
        <div class="p36-equation">F<sub>required</sub> = |τA|/rA</div>
        <p>No relative slip is possible only while F<sub>required</sub> ≤ μsN. For the baseline contact, μsN = 0.40 × 200 = 80 N.</p>
        <div class="p36-equation">|τA|<sub>max</sub> = μsNrA = 80 × 1.00 = 80.0 N·m</div>
        <p>The equal-and-opposite 80 N force acts at radius 2.00 m on B:</p>
        <div class="p36-equation">|τB|<sub>max</sub> = μsNrB = 80 × 2.00 = 160.0 N·m</div>
        <p>At the requested 120 N·m, wheel A demands 120/1.00 = 120 N, which exceeds 80 N: the contact slips. A counterclockwise A tends to drive B clockwise.</p>
        <p class="p36-caveat"><strong>After slip:</strong> μs no longer gives the actual force. A kinetic coefficient or another contact law is needed; 160.0 N·m is the maximum torque at the static threshold.</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = currentStatics();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      driverRadiusMetres: DRIVER_RADIUS,
      drivenRadiusMetres: DRIVEN_RADIUS,
      appliedTorqueNm: state.torque,
      normalForceN: state.normal,
      staticCoefficient: state.mu,
      demandedTangentialForceN: Number(values.demand.toFixed(3)),
      staticGripLimitN: Number(values.limit.toFixed(3)),
      contactRegime: values.regime,
      driverNoSlipLimitNm: Number(values.driverTorqueLimit.toFixed(3)),
      drivenStaticTorqueNm: Number(values.drivenTorqueSupported.toFixed(3)),
      direction: state.direction,
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell stat3-shell p36-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread stat3-spread p36-spread">
          <article class="book-page p36-problem-page">
            <div class="problem-number">Problem 3.6</div>
            <h1 class="book-title stat3-title p36-title">The Wheel Wars II</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">After Wheel Wars I, the right motor is disconnected. Wheel A, radius 1.00 m, now drives wheel B, radius 2.00 m, and B’s shaft load, by dry contact. Their shafts hold the centres fixed and clamp them together with normal force N.</p>
            <p class="problem-copy">Static friction has coefficient μs. Decide when the wheels grip, find the torque transmitted to B, and identify both wheels’ rotational senses.</p>
            <section class="p36-baseline" aria-labelledby="p36-baseline-title">
              <div class="eyebrow" id="p36-baseline-title">Baseline challenge</div>
              <dl><div><dt>|τA|</dt><dd>120 N·m</dd></div><div><dt>N</dt><dd>200 N</dd></div><div><dt>μs</dt><dd>0.40</dd></div></dl>
              <p>Find the largest driver torque that can be transmitted without slip and the corresponding torque on B. Does the 120 N·m demand grip or slip?</p>
            </section>
            <section class="p36-assumptions">
              <strong>Static contact model</strong>
              <p>Bearings are ideal, motion is quasi-static, B’s load balances the transmitted contact torque, and N is prescribed. Once sliding starts, μs alone cannot determine the actual sliding force.</p>
            </section>
          </article>

          <section class="book-page book-stage stat3-stage p36-stage">
            ${stageControls()}
            <div class="p36-visual-card">${wheelSvg()}${stageCaption()}</div>
            ${controlsMarkup()}
            ${comparisonMarkup()}
          </section>

          <aside class="book-page book-coach p36-coach">
            <div class="coach-kicker">Resolve the contact</div>
            <p class="coach-question">How much torque reaches wheel B before the static grip is exhausted?</p>
            <form class="p36-answer-form" data-p36-answer-form novalidate>
              <label for="p36-driver-answer">Maximum no-slip driver torque</label>
              <div><input id="p36-driver-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.maxDriverAnswer)}" placeholder="e.g. 80" autocomplete="off" /><span>N·m</span></div>
              <label for="p36-driven-answer">Driven torque at that limit</label>
              <div><input id="p36-driven-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.maxDrivenAnswer)}" placeholder="e.g. 160" autocomplete="off" /><span>N·m</span></div>
              <label for="p36-regime-answer">120 N·m baseline</label>
              <select id="p36-regime-answer"><option value="">Choose…</option><option value="grip" ${state.regimeAnswer === "grip" ? "selected" : ""}>Grip</option><option value="limiting" ${state.regimeAnswer === "limiting" ? "selected" : ""}>Limiting grip</option><option value="slip" ${state.regimeAnswer === "slip" ? "selected" : ""}>Slip</option></select>
              <button class="primary-button" type="submit">Check contact</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p36-help-row">
              <button class="secondary-button" type="button" data-problem-action="p36-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p36-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="stat3-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function setText(root, selector, value) {
    root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p36-shell");
    if (!root) return;
    const values = currentStatics();
    const chartMax = Math.max(1, values.demand, values.limit) * 1.12;
    setText(root, '[data-p36-live="torque"]', `${clean(state.torque, 0)} N·m`);
    setText(root, '[data-p36-live="mu"]', clean(state.mu, 2));
    setText(root, '[data-p36-live="normal"]', `${clean(state.normal, 0)} N`);
    setText(root, "[data-p36-torque-label]", `τA = ${clean(state.torque, 0)} N·m`);
    setText(root, '[data-p36-live="demand"]', `${clean(values.demand)} N`);
    setText(root, '[data-p36-live="limit"]', `${clean(values.limit)} N`);
    setText(root, '[data-p36-live="driver-limit"]', `${clean(values.driverTorqueLimit)} N·m`);
    setText(root, '[data-p36-live="driven-torque"]', `${clean(values.drivenTorqueSupported)} N·m`);
    setText(root, "[data-p36-regime]", regimeLabel(values.regime));
    setText(root, "[data-p36-status-text]", regimeLabel(values.regime));
    setText(root, "[data-p36-utilisation]", `${clean(values.utilisation * 100, 0)}% grip used`);
    setText(root, "[data-p36-direction-text]", values.drivenDirection);
    setText(root, "[data-p36-driven-label]", values.canGrip ? "Transmitted τB" : "Static τB ceiling");
    setText(root, "[data-p36-regime-note]", values.canGrip
      ? `Static friction supplies ${clean(values.demand)} N—only the amount demanded—and wheel B receives ${clean(values.drivenTorqueSupported)} N·m.`
      : `The requested ${clean(values.demand)} N exceeds μsN. No-slip statics can transfer at most ${clean(values.drivenTorqueSupported)} N·m to B; actual sliding torque requires μk.`);
    setText(root, "[data-p36-svg-desc]", `${values.driverDirection} torque is applied to wheel A. Tangential demand is ${clean(values.demand)} newtons and static grip limit is ${clean(values.limit)} newtons. The contact is in ${regimeLabel(values.regime).toLowerCase()}.`);
    const demandBar = root.querySelector("[data-p36-demand-bar]");
    const limitBar = root.querySelector("[data-p36-limit-bar]");
    if (demandBar) demandBar.style.width = `${Math.min(100, values.demand / chartMax * 100)}%`;
    if (limitBar) limitBar.style.width = `${Math.min(100, values.limit / chartMax * 100)}%`;
    const comparison = root.querySelector("[data-p36-comparison]");
    const svg = root.querySelector("[data-p36-svg]");
    [comparison, svg].forEach((node) => {
      if (!node) return;
      ["no-load", "grip", "limiting", "slip"].forEach((regime) => node.classList.toggle(`is-${regime}`, regime === values.regime));
    });
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p36-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p36-torque");
          return;
        }
        if (action === "p36-stage") {
          state.stage = clamp(Number(control.dataset.p36Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p36-stage="${state.stage}"]`);
          return;
        }
        if (action === "p36-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p36-stage="${state.stage}"]`);
          return;
        }
        if (action === "p36-direction") {
          state.direction = control.dataset.p36Direction === "ccw" ? "ccw" : "cw";
          renderAndFocus(renderApp, `[data-p36-direction="${state.direction}"]`);
          return;
        }
        if (action === "p36-preset") {
          state.torque = clamp(Number(control.dataset.p36Torque), 0, 180);
          state.mu = BASELINE_MU;
          state.normal = BASELINE_NORMAL;
          renderAndFocus(renderApp, "#p36-torque");
          return;
        }
        if (action === "p36-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p36-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p36-reveal") window.requestAnimationFrame(() => document.querySelector("#p36-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p36-torque", key: "torque", min: 0, max: 180 },
      { selector: "#p36-mu", key: "mu", min: 0, max: 0.8 },
      { selector: "#p36-normal", key: "normal", min: 0, max: 500 },
    ].forEach(({ selector, key, min, max }) => {
      const slider = document.querySelector(selector);
      slider?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), min, max);
        updateDynamicDom();
      });
    });

    const driverInput = document.querySelector("#p36-driver-answer");
    const drivenInput = document.querySelector("#p36-driven-answer");
    const regimeSelect = document.querySelector("#p36-regime-answer");
    driverInput?.addEventListener("input", (event) => { state.maxDriverAnswer = sanitizeNumber(event.target.value); });
    drivenInput?.addEventListener("input", (event) => { state.maxDrivenAnswer = sanitizeNumber(event.target.value); });
    regimeSelect?.addEventListener("change", (event) => { state.regimeAnswer = event.target.value; });

    const answerForm = document.querySelector("[data-p36-answer-form]");
    answerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.maxDriverAnswer = sanitizeNumber(driverInput?.value).trim();
      state.maxDrivenAnswer = sanitizeNumber(drivenInput?.value).trim();
      state.regimeAnswer = regimeSelect?.value || "";
      const driverAnswer = Number(state.maxDriverAnswer);
      const drivenAnswer = Number(state.maxDrivenAnswer);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(driverAnswer) || !Number.isFinite(drivenAnswer) || !state.regimeAnswer) {
        state.feedback = "Enter both torque limits and choose the baseline contact state.";
      } else if (Math.abs(driverAnswer - BASELINE_DRIVER_LIMIT) > 0.2) {
        state.feedback = "Recheck the driver limit: multiply μsN by wheel A’s radius, with units N·m.";
      } else if (Math.abs(drivenAnswer - BASELINE_DRIVEN_LIMIT) > 0.2) {
        state.feedback = "The same limiting tangential force acts on B, but its moment arm is rB = 2.00 m.";
      } else if (state.regimeAnswer !== "slip") {
        state.feedback = "At 120 N·m the driver demands 120 N, which is above the 80 N static limit.";
      } else {
        state.feedbackTone = "success";
        state.committed = true;
        state.feedback = "Correct: A can transmit 80.0 N·m before slip, B then receives 160.0 N·m, and the 120 N·m baseline slips.";
      }
      renderAndFocus(renderApp, "#p36-driver-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
