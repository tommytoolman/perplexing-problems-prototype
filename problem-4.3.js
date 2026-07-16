(function registerAcceleratingMatchboxPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "4.3";
  const MASS = 0.060;
  const GRAVITY = 9.81;
  const BASELINE = Object.freeze({ acceleration: 1, angle: 25, friction: 0.80 });
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Choose a signed acceleration", copy: "The tray rises to the right. Positive a means that its cart accelerates right; negative a means left." }),
    Object.freeze({ short: "Forces", title: "Resolve along the moving tray", copy: "Use ma in the ground frame, or add the leftward pseudo-force −ma in the cart frame. Both routes give the same two component equations." }),
    Object.freeze({ short: "Thresholds", title: "Compare demand with grip", copy: "Contact requires N≥0. While contact remains, the box can share the cart’s motion only when |frequired|≤μsN." }),
  ]);
  const hints = Object.freeze([
    "In the ground frame, suppose the box stays fixed on the tray and therefore accelerates (a,0). Resolve F=ma up the slope and normal to it.",
    "With up-slope positive, frequired=m(g sinθ+a cosθ). The normal reaction is N=m(g cosθ−a sinθ).",
    "At the rightward grip limit set frequired=μsN. This gives a=g(μs cosθ−sinθ)/(cosθ+μs sinθ). Loss of contact occurs when N=0, so a=g cotθ.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p43-reset">Reset</button>';

  const initialState = () => ({
    acceleration: BASELINE.acceleration,
    angle: BASELINE.angle,
    friction: BASELINE.friction,
    stage: 0,
    gripAnswer: "",
    contactAnswer: "",
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

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function clean(value, digits = 2) {
    if (!Number.isFinite(value)) return "∞";
    const rounded = Number(value).toFixed(digits);
    return Object.is(Number(rounded), -0) ? Number(0).toFixed(digits) : rounded;
  }

  function signed(value, digits = 2) {
    if (!Number.isFinite(value)) return "∞";
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
    return String(value).replace(/[^0-9.\s-]/g, "").slice(0, 16);
  }

  function mechanics(acceleration = state.acceleration, angle = state.angle, friction = state.friction) {
    const theta = radians(angle);
    const sine = Math.sin(theta);
    const cosine = Math.cos(theta);
    const tangentialDemand = GRAVITY * sine + acceleration * cosine;
    const normalPerMass = GRAVITY * cosine - acceleration * sine;
    const requiredFriction = MASS * tangentialDemand;
    const normalForce = Math.max(0, MASS * normalPerMass);
    const staticLimit = friction * normalForce;
    return { theta, sine, cosine, tangentialDemand, normalPerMass, requiredFriction, normalForce, staticLimit };
  }

  function thresholds(angle = state.angle, friction = state.friction) {
    const theta = radians(angle);
    const sine = Math.sin(theta);
    const cosine = Math.cos(theta);
    const lowerDenominator = cosine - friction * sine;
    const lower = -GRAVITY * (sine + friction * cosine) / lowerDenominator;
    const grip = GRAVITY * (friction * cosine - sine) / (cosine + friction * sine);
    const contact = sine <= 1e-10 ? Infinity : GRAVITY * cosine / sine;
    return { lower, grip, contact };
  }

  function regime(acceleration = state.acceleration, angle = state.angle, friction = state.friction) {
    const values = mechanics(acceleration, angle, friction);
    const tolerance = 1e-7;
    if (values.normalPerMass < -tolerance) return "no-contact";
    if (Math.abs(values.normalPerMass) <= tolerance) return "contact-limit";
    const positiveLimit = friction * values.normalPerMass;
    if (values.tangentialDemand > positiveLimit + tolerance) return "slip-down";
    if (values.tangentialDemand < -positiveLimit - tolerance) return "slip-up";
    if (Math.abs(values.tangentialDemand - positiveLimit) <= tolerance) return "limit-down";
    if (Math.abs(values.tangentialDemand + positiveLimit) <= tolerance) return "limit-up";
    return "rest";
  }

  function regimeLabel(value = regime()) {
    if (value === "no-contact") return "Contact lost · airborne";
    if (value === "contact-limit") return "Just losing contact";
    if (value === "slip-down") return "Slips down the tray";
    if (value === "slip-up") return "Slips up the tray";
    if (value === "limit-down") return "Limiting grip · down-slope impending";
    if (value === "limit-up") return "Limiting grip · up-slope impending";
    return "Rests relative to tray";
  }

  function reconstructionNote() {
    return `
      <p class="dyn4-reconstruction-note p43-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function stageControls() {
    return `
      <div class="p43-stage-controls" role="group" aria-label="Dynamics explanation stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p43-stage" data-p43-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p43-stage-caption">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p43-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Thresholds resolved" : "Next stage"}</button>
      </div>`;
  }

  function arrowEndpoint(originX, originY, directionX, directionY, length) {
    return { x: originX + directionX * length, y: originY + directionY * length };
  }

  function visualGeometry() {
    const values = mechanics();
    const currentRegime = regime();
    const localBoxY = currentRegime === "no-contact" ? -64 : -42;
    const centreLocalY = localBoxY + 21;
    const originX = 210;
    const originY = 270;
    const localX = 160;
    const centreX = originX + localX * values.cosine + centreLocalY * values.sine;
    const centreY = originY - localX * values.sine + centreLocalY * values.cosine;
    const tangentX = values.cosine;
    const tangentY = -values.sine;
    const normalX = -values.sine;
    const normalY = -values.cosine;
    const gravityEnd = arrowEndpoint(centreX, centreY, 0, 1, 82);
    const normalLength = values.normalPerMass > 0 ? Math.min(96, 24 + values.normalPerMass * 5.2) : 0;
    const normalEnd = arrowEndpoint(centreX, centreY, normalX, normalY, normalLength);
    const frictionDirection = Math.abs(values.tangentialDemand) < 1e-10 ? 0 : Math.sign(values.tangentialDemand);
    const frictionLength = Math.min(90, 20 + Math.abs(values.tangentialDemand) * 5);
    const frictionEnd = arrowEndpoint(centreX, centreY, tangentX * frictionDirection, tangentY * frictionDirection, frictionDirection ? frictionLength : 0);
    const pseudoDirection = state.acceleration === 0 ? 0 : -Math.sign(state.acceleration);
    const pseudoLength = Math.min(100, 20 + Math.abs(state.acceleration) * 3);
    const pseudoEnd = arrowEndpoint(centreX, centreY, pseudoDirection, 0, pseudoDirection ? pseudoLength : 0);
    return { ...values, currentRegime, localBoxY, centreX, centreY, gravityEnd, normalEnd, frictionEnd, pseudoEnd };
  }

  function scaleAcceleration(value) {
    return 98 + (clamp(value, -25, 25) + 25) / 50 * 524;
  }

  function thresholdLine() {
    const limits = thresholds();
    const restLeft = scaleAcceleration(limits.lower);
    const restRight = scaleAcceleration(limits.grip);
    const contactX = Number.isFinite(limits.contact) ? scaleAcceleration(limits.contact) : null;
    const currentX = scaleAcceleration(state.acceleration);
    return `
      <g class="p43-threshold-layer" aria-hidden="true">
        <text class="p43-number-title" x="360" y="346">signed cart acceleration a (m/s²)</text>
        <line class="p43-number-axis" x1="98" y1="372" x2="622" y2="372" />
        <line class="p43-rest-band" x1="${clean(restLeft)}" y1="372" x2="${clean(restRight)}" y2="372" />
        <text class="p43-small-label" x="${clean((restLeft + restRight) / 2)}" y="362">relative rest</text>
        <line class="p43-boundary" x1="${clean(restLeft)}" y1="355" x2="${clean(restLeft)}" y2="386" />
        <line class="p43-boundary" x1="${clean(restRight)}" y1="355" x2="${clean(restRight)}" y2="386" />
        <text class="p43-small-label" x="${clean(restLeft)}" y="404">${clean(limits.lower, 1)}</text>
        <text class="p43-small-label" x="${clean(restRight)}" y="404">${clean(limits.grip, 1)}</text>
        ${contactX === null ? '<text class="p43-contact-label" x="615" y="346">contact limit ∞</text>' : `<line class="p43-contact-boundary" x1="${clean(contactX)}" y1="348" x2="${clean(contactX)}" y2="391" /><text class="p43-contact-label" x="${clean(contactX)}" y="420">contact ${clean(limits.contact, 1)}</text>`}
        <path class="p43-current-pointer" d="M${clean(currentX - 7)} 330 L${clean(currentX + 7)} 330 L${clean(currentX)} 342 Z" />
        <text class="p43-current-label" x="${clean(currentX)}" y="321">a=${signed(state.acceleration, 1)}</text>
      </g>`;
  }

  function svgDescription() {
    const values = mechanics();
    return `A ${clean(state.angle, 0)} degree rough tray accelerates at ${signed(state.acceleration, 1)} metres per second squared. Static friction coefficient is ${clean(state.friction, 2)}. Required signed friction is ${signed(values.requiredFriction, 3)} newtons and the normal reaction is ${clean(values.normalForce, 3)} newtons. ${regimeLabel()}.`;
  }

  function traySvg() {
    const shape = visualGeometry();
    const accelerationRight = state.acceleration >= 0;
    const cartArrowStart = accelerationRight ? 256 : 472;
    const cartArrowEnd = accelerationRight ? 472 : 256;
    const frictionVisible = Math.abs(shape.tangentialDemand) > 1e-10 && shape.currentRegime !== "no-contact";
    return `
      <svg class="p43-svg p43-stage-${state.stage} is-${shape.currentRegime}" viewBox="0 0 720 440" role="img" aria-labelledby="p43-svg-title p43-svg-desc">
        <title id="p43-svg-title">Matchbox on an accelerating inclined tray</title>
        <desc id="p43-svg-desc">${svgDescription()}</desc>
        <defs>
          <linearGradient id="p43-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcebf1"/><stop offset="1" stop-color="#f7f0dd"/></linearGradient>
          <marker id="p43-arrow-red" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p43-arrow-blue" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p43-arrow-gold" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <pattern id="p43-rough" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 7 L4 2 L8 7" fill="none" stroke="#70452e" stroke-width="1.4"/></pattern>
        </defs>
        <rect class="p43-sky" width="720" height="440" fill="url(#p43-sky)" />
        <line class="p43-ground" x1="42" y1="356" x2="678" y2="356" />

        <g class="p43-cart" aria-hidden="true">
          <path d="M105 286 H570 L548 333 H127 Z" />
          <circle cx="178" cy="345" r="29"/><circle cx="500" cy="345" r="29"/>
          <circle class="p43-hub" cx="178" cy="345" r="9"/><circle class="p43-hub" cx="500" cy="345" r="9"/>
          <line class="p43-brace" x1="210" y1="270" x2="210" y2="286" />
          <line class="p43-brace" x1="${clean(210 + 320 * shape.cosine)}" y1="${clean(270 - 320 * shape.sine)}" x2="500" y2="286" />
        </g>

        <g class="p43-tray" transform="translate(210 270) rotate(${-state.angle})" aria-hidden="true">
          <rect x="-12" y="-4" width="350" height="13" rx="5" />
          <rect class="p43-rough-edge" x="-4" y="-8" width="334" height="8" fill="url(#p43-rough)" />
          <g class="p43-box ${shape.currentRegime === "no-contact" ? "is-airborne" : ""}" transform="translate(0 ${shape.localBoxY + 42})">
            <rect x="135" y="-42" width="50" height="42" rx="4" />
            <path d="M145 -33 H175 M145 -24 H175 M145 -15 H168" />
          </g>
          <path class="p43-angle-arc" d="M38 0 A38 38 0 0 0 ${clean(38 * shape.cosine)} ${clean(-38 * shape.sine)}" />
          <text class="p43-angle-label" x="47" y="-13">θ=${clean(state.angle, 0)}°</text>
        </g>

        <g class="p43-cart-acceleration" aria-hidden="true">
          <line x1="${cartArrowStart}" y1="304" x2="${state.acceleration === 0 ? cartArrowStart : cartArrowEnd}" y2="304" marker-end="${state.acceleration === 0 ? "" : "url(#p43-arrow-red)"}" />
          <text x="364" y="295">cart a = ${signed(state.acceleration, 1)} m/s²</text>
        </g>

        <g class="p43-force-layer" aria-hidden="true">
          <line class="p43-gravity" x1="${clean(shape.centreX)}" y1="${clean(shape.centreY)}" x2="${clean(shape.gravityEnd.x)}" y2="${clean(shape.gravityEnd.y)}" marker-end="url(#p43-arrow-red)" />
          <text class="p43-force-label" x="${clean(shape.gravityEnd.x + 17)}" y="${clean(shape.gravityEnd.y - 8)}">mg</text>
          ${shape.normalPerMass > 0 ? `<line class="p43-normal" x1="${clean(shape.centreX)}" y1="${clean(shape.centreY)}" x2="${clean(shape.normalEnd.x)}" y2="${clean(shape.normalEnd.y)}" marker-end="url(#p43-arrow-blue)" /><text class="p43-force-label" x="${clean(shape.normalEnd.x - 13)}" y="${clean(shape.normalEnd.y - 7)}">N</text>` : ""}
          ${frictionVisible ? `<line class="p43-friction" x1="${clean(shape.centreX)}" y1="${clean(shape.centreY)}" x2="${clean(shape.frictionEnd.x)}" y2="${clean(shape.frictionEnd.y)}" marker-end="url(#p43-arrow-gold)" /><text class="p43-force-label" x="${clean(shape.frictionEnd.x)}" y="${clean(shape.frictionEnd.y - 10)}">f required</text>` : ""}
          ${state.acceleration !== 0 ? `<line class="p43-pseudo" x1="${clean(shape.centreX)}" y1="${clean(shape.centreY + 8)}" x2="${clean(shape.pseudoEnd.x)}" y2="${clean(shape.pseudoEnd.y + 8)}" marker-end="url(#p43-arrow-blue)" /><text class="p43-force-label" x="${clean((shape.centreX + shape.pseudoEnd.x) / 2)}" y="${clean(shape.centreY + 28)}">pseudo −ma</text>` : ""}
        </g>

        <g class="p43-status" transform="translate(472 38)">
          <rect width="208" height="64" rx="15" />
          <text class="p43-status-kicker" x="15" y="23">CURRENT REGIME</text>
          <text class="p43-status-value" x="15" y="47">${regimeLabel(shape.currentRegime)}</text>
        </g>
        ${thresholdLine()}
      </svg>`;
  }

  function controlsMarkup() {
    return `
      <section class="p43-controls" aria-label="Accelerating tray controls">
        <label for="p43-acceleration"><span>Signed horizontal acceleration a<strong>${signed(state.acceleration, 1)} m/s²</strong></span><input id="p43-acceleration" type="range" min="-25" max="25" step="0.1" value="${state.acceleration}" /></label>
        <label for="p43-angle"><span>Tray angle θ<strong>${clean(state.angle, 0)}°</strong></span><input id="p43-angle" type="range" min="0" max="40" step="1" value="${state.angle}" /></label>
        <label for="p43-friction"><span>Static coefficient μs<strong>${clean(state.friction, 2)}</strong></span><input id="p43-friction" type="range" min="0" max="1" step="0.01" value="${state.friction}" /></label>
        <div class="p43-scale-labels"><span>left / negative</span><span>right / positive</span></div>
        <div class="p43-presets" role="group" aria-label="Notable acceleration regimes">
          <button class="chip-button" type="button" data-problem-action="p43-preset" data-p43-acceleration="-22">Slip up</button>
          <button class="chip-button" type="button" data-problem-action="p43-preset" data-p43-acceleration="0">Rest</button>
          <button class="chip-button" type="button" data-problem-action="p43-preset" data-p43-acceleration="5">Slip down</button>
          <button class="chip-button" type="button" data-problem-action="p43-preset" data-p43-acceleration="22">Airborne</button>
        </div>
      </section>`;
  }

  function metricsMarkup() {
    const values = mechanics();
    const limits = thresholds();
    return `
      <section class="p43-metrics is-${regime()}" aria-label="Calculated dynamics values">
        <div><span>Friction required to follow tray</span><strong>${signed(values.requiredFriction, 3)} N</strong></div>
        <div><span>Normal reaction N</span><strong>${clean(values.normalForce, 3)} N</strong></div>
        <div><span>Static ceiling μsN</span><strong>${clean(values.staticLimit, 3)} N</strong></div>
        <div><span>Rest interval for a</span><strong>${clean(limits.lower, 2)} to ${clean(limits.grip, 2)} m/s²</strong></div>
        <p><strong>${regimeLabel()}.</strong> ${values.normalPerMass <= 0 ? "There is no contact force, so friction is also zero." : `The demanded friction magnitude is ${clean(Math.abs(values.requiredFriction), 3)} N against an available ${clean(values.staticLimit, 3)} N.`} Contact loss: ${Number.isFinite(limits.contact) ? `${clean(limits.contact, 2)} m/s²` : "never at a finite horizontal acceleration when θ=0°"}.</p>
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p43-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const baselineLimits = thresholds(BASELINE.angle, BASELINE.friction);
    return `
      <section class="p43-solution" aria-labelledby="p43-solution-heading">
        <h3 id="p43-solution-heading" tabindex="-1">The two frames agree</h3>
        <p>Take positive tangential direction up the tray. If the box remains fixed to it, its ground-frame acceleration is horizontal: <strong>(a,0)</strong>. Resolving F=ma gives</p>
        <div class="p43-equation">f − mg sinθ = ma cosθ<br>N − mg cosθ = −ma sinθ</div>
        <p>Hence the signed friction required and the normal reaction are</p>
        <div class="p43-equation">frequired = m(g sinθ+a cosθ)<br>N = m(g cosθ−a sinθ)</div>
        <p>In the accelerating cart frame, adding a horizontal pseudo-force −ma produces exactly the same components. Static rest needs contact and enough grip:</p>
        <div class="p43-equation">N ≥ 0, &nbsp; |g sinθ+a cosθ| ≤ μs(g cosθ−a sinθ)</div>
        <p>At the rightward slip boundary the required up-slope friction reaches +μsN:</p>
        <div class="p43-equation">amax = g(μs cosθ−sinθ)/(cosθ+μs sinθ)<br>= ${clean(baselineLimits.grip, 3)} m/s²</div>
        <p>Contact is lost when N=0, giving <strong>a=g cotθ=${clean(baselineLimits.contact, 3)} m/s²</strong>. At a=5.0 m/s² contact remains, but the friction demand exceeds μsN, so the box slips <strong>down</strong> the tray.</p>
        <p class="p43-insight">Mass cancels from every threshold. Once slipping begins, μs alone cannot predict the subsequent relative acceleration; that would require a kinetic-friction model μk.</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = mechanics();
    const limits = thresholds();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      massKg: MASS,
      gravityMetresPerSecondSquared: GRAVITY,
      accelerationMetresPerSecondSquared: state.acceleration,
      trayAngleDegrees: state.angle,
      staticFrictionCoefficient: state.friction,
      tangentialDemandMetresPerSecondSquared: Number(values.tangentialDemand.toFixed(5)),
      normalPerMassMetresPerSecondSquared: Number(values.normalPerMass.toFixed(5)),
      requiredFrictionNewtons: Number(values.requiredFriction.toFixed(5)),
      normalReactionNewtons: Number(values.normalForce.toFixed(5)),
      staticFrictionCeilingNewtons: Number(values.staticLimit.toFixed(5)),
      regime: regime(),
      restIntervalMetresPerSecondSquared: [Number(limits.lower.toFixed(5)), Number(limits.grip.toFixed(5))],
      contactLossAcceleration: Number.isFinite(limits.contact) ? Number(limits.contact.toFixed(5)) : null,
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell dyn4-shell p43-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive dynamics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread dyn4-spread p43-spread">
          <article class="book-page p43-problem-page">
            <div class="problem-number">Problem 4.3</div>
            <h1 class="book-title dyn4-title p43-title">Accelerating matchbox</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">A 60 g matchbox rests on a rough tray inclined at 25° above the horizontal. The coefficient of static friction is μs=0.80. The tray is fixed to a cart with constant horizontal acceleration a; take rightward acceleration as positive.</p>
            <p class="problem-copy">Find the greatest positive a for which the matchbox can remain fixed to the tray. At what a does it lose contact? Finally, predict its regime at a=5.0 m/s².</p>
            <section class="p43-sign-card">
              <div class="eyebrow">Sign convention</div>
              <p>Positive friction points up the slope. A positive a reduces N, while a negative a increases N. The words “up” and “down” always describe motion relative to the tray.</p>
            </section>
            <section class="p43-assumption-card">
              <strong>Model boundary</strong>
              <p>The tray is rigid; acceleration is horizontal and constant; aerodynamic drag is ignored. Static friction predicts onset only. Post-slip motion needs μk, which is deliberately not supplied.</p>
            </section>
          </article>

          <section class="book-page book-stage dyn4-stage p43-stage">
            ${stageControls()}
            <div class="p43-visual-card"><div data-p43-svg-slot>${traySvg()}</div>${stageCaption()}</div>
            ${controlsMarkup()}
            <div data-p43-metrics-slot>${metricsMarkup()}</div>
          </section>

          <aside class="book-page book-coach p43-coach">
            <div class="coach-kicker">Resolve the accelerating tray</div>
            <p class="coach-question">For θ=25° and μs=0.80, give the two rightward thresholds and classify a=5.0 m/s².</p>
            <form class="p43-answer-form" data-p43-answer-form novalidate>
              <label for="p43-grip-answer">Greatest a that preserves relative rest</label>
              <div><input id="p43-grip-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.gripAnswer)}" placeholder="e.g. 3.25" autocomplete="off" /><span>m/s²</span></div>
              <label for="p43-contact-answer">Acceleration at contact loss</label>
              <div><input id="p43-contact-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.contactAnswer)}" placeholder="e.g. 18.0" autocomplete="off" /><span>m/s²</span></div>
              <label for="p43-regime-answer">Regime at a=5.0 m/s²</label>
              <select id="p43-regime-answer">
                <option value="" ${state.regimeAnswer === "" ? "selected" : ""}>Choose a regime…</option>
                <option value="rest" ${state.regimeAnswer === "rest" ? "selected" : ""}>Rests relative to tray</option>
                <option value="slip-down" ${state.regimeAnswer === "slip-down" ? "selected" : ""}>Slips down the tray</option>
                <option value="slip-up" ${state.regimeAnswer === "slip-up" ? "selected" : ""}>Slips up the tray</option>
                <option value="no-contact" ${state.regimeAnswer === "no-contact" ? "selected" : ""}>Loses contact</option>
              </select>
              <button class="primary-button" type="submit">Check the dynamics</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p43-help-row">
              <button class="secondary-button" type="button" data-problem-action="p43-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p43-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="dyn4-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p43-shell");
    if (!root) return;
    const svgSlot = root.querySelector("[data-p43-svg-slot]");
    const metricsSlot = root.querySelector("[data-p43-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = traySvg();
    if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const accelerationSlider = root.querySelector("#p43-acceleration");
    const angleSlider = root.querySelector("#p43-angle");
    const frictionSlider = root.querySelector("#p43-friction");
    const labels = root.querySelectorAll(".p43-controls label strong");
    if (labels[0]) labels[0].textContent = `${signed(state.acceleration, 1)} m/s²`;
    if (labels[1]) labels[1].textContent = `${clean(state.angle, 0)}°`;
    if (labels[2]) labels[2].textContent = clean(state.friction, 2);
    accelerationSlider?.setAttribute("aria-valuetext", `${signed(state.acceleration, 1)} metres per second squared; ${regimeLabel()}`);
    angleSlider?.setAttribute("aria-valuetext", `${clean(state.angle, 0)} degrees; ${regimeLabel()}`);
    frictionSlider?.setAttribute("aria-valuetext", `Static friction coefficient ${clean(state.friction, 2)}; ${regimeLabel()}`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p43-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p43-acceleration");
          return;
        }
        if (action === "p43-stage") {
          state.stage = clamp(Number(control.dataset.p43Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p43-stage="${state.stage}"]`);
          return;
        }
        if (action === "p43-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p43-stage="${state.stage}"]`);
          return;
        }
        if (action === "p43-preset") {
          state.acceleration = clamp(Number(control.dataset.p43Acceleration), -25, 25);
          state.angle = BASELINE.angle;
          state.friction = BASELINE.friction;
          renderAndFocus(renderApp, "#p43-acceleration");
          return;
        }
        if (action === "p43-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p43-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p43-reveal") window.requestAnimationFrame(() => document.querySelector("#p43-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p43-acceleration", key: "acceleration", min: -25, max: 25 },
      { selector: "#p43-angle", key: "angle", min: 0, max: 40 },
      { selector: "#p43-friction", key: "friction", min: 0, max: 1 },
    ].forEach(({ selector, key, min, max }) => {
      const slider = document.querySelector(selector);
      slider?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), min, max);
        updateDynamicDom();
      });
    });

    const gripInput = document.querySelector("#p43-grip-answer");
    const contactInput = document.querySelector("#p43-contact-answer");
    const regimeInput = document.querySelector("#p43-regime-answer");
    gripInput?.addEventListener("input", (event) => { state.gripAnswer = sanitizeNumber(event.target.value); });
    contactInput?.addEventListener("input", (event) => { state.contactAnswer = sanitizeNumber(event.target.value); });
    regimeInput?.addEventListener("change", (event) => { state.regimeAnswer = event.target.value; });
    document.querySelector("[data-p43-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.gripAnswer = sanitizeNumber(gripInput?.value).trim();
      state.contactAnswer = sanitizeNumber(contactInput?.value).trim();
      state.regimeAnswer = regimeInput?.value || "";
      const grip = Number(state.gripAnswer);
      const contact = Number(state.contactAnswer);
      const answers = thresholds(BASELINE.angle, BASELINE.friction);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.gripAnswer || !state.contactAnswer || !Number.isFinite(grip) || !Number.isFinite(contact) || !state.regimeAnswer) {
        state.feedback = "Enter both numerical thresholds and choose the a=5.0 regime.";
      } else if (Math.abs(grip - answers.grip) > 0.03) {
        state.feedback = "Check the friction direction: at the greatest rightward acceleration, the impending motion is down the tray and f=+μsN.";
      } else if (Math.abs(contact - answers.contact) > 0.03) {
        state.feedback = "Contact loss is a separate, later boundary. Set N=m(g cosθ−a sinθ)=0.";
      } else if (state.regimeAnswer !== "slip-down") {
        state.feedback = "At a=5.0 m/s² the normal force is still positive, but compare the required up-slope friction with μsN.";
      } else {
        state.feedbackTone = "success";
        state.committed = true;
        state.feedback = `Correct: relative rest ends at ${clean(answers.grip, 3)} m/s², contact ends at ${clean(answers.contact, 3)} m/s², and at 5.0 m/s² the matchbox slips down the tray.`;
      }
      renderAndFocus(renderApp, "#p43-grip-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
