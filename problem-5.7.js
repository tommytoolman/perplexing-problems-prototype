(function registerWallOfDeathMotorcyclePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "5.7";
  const MASS = 220;
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ speedKmh: 45, wallRadius: 8, friction: 0.60, comDistance: 0.75 });
  const stages = Object.freeze([
    Object.freeze({ short: "★★ Grip", title: "Keep the motorcycle from sliding", copy: "The wall normal supplies horizontal centripetal force. Static friction must act upward to balance the motorcycle’s weight." }),
    Object.freeze({ short: "★★★★ Roll", title: "Make the force line pass through the COM", copy: "Gravity already acts through the centre of mass. For zero roll moment, the resultant wall force must pass through it too." }),
    Object.freeze({ short: "★★★★ Geometry", title: "Correct the circular-path radius", copy: "The COM lies inward of the wall contact. Its radius is r=R−L sinβ, so the lean equation is implicit rather than merely a tangent ratio using R." }),
  ]);
  const baseHints = Object.freeze([
    "The wall normal is horizontal and inward: N=mv²/R in the point-mass base model.",
    "There is no vertical acceleration, so the required static friction is upward with magnitude f=mg.",
    "Grip requires mg≤μsN. Therefore vmin=√(gR/μs); multiply m/s by 3.6 for km/h.",
  ]);
  const extensionHints = Object.freeze([
    "Let β be the lean inward from vertical and L the contact-to-COM distance. The offsets are x=L sinβ inward and z=L cosβ upward.",
    "Taking moments about the COM gives (L sinβ)mg=(L cosβ)N, hence tanβ=N/(mg)=v²/(gr).",
    "Use r=R−L sinβ. At limiting grip μs=cotβ, so sinβ=1/√(1+μs²) and vmin²=g[R−L/√(1+μs²)]/μs.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p57-reset">Reset</button>';

  const initialState = () => ({
    speedKmh: CHALLENGE.speedKmh,
    wallRadius: CHALLENGE.wallRadius,
    friction: CHALLENGE.friction,
    comDistance: CHALLENGE.comDistance,
    stage: 0,
    baseAnswer: "",
    leanAnswer: "",
    exactSpeedAnswer: "",
    baseFeedback: "",
    baseFeedbackTone: "neutral",
    extensionFeedback: "",
    extensionFeedbackTone: "neutral",
    baseCommitted: false,
    extensionCommitted: false,
    baseHintsUsed: 0,
    extensionHintsUsed: 0,
    baseRevealed: false,
    extensionRevealed: false,
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
    if (!Number.isFinite(value)) return "∞";
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

  function solveLean(speed, wallRadius, comDistance) {
    if (speed <= 1e-12) return 0;
    let lower = 0;
    let upper = Math.PI / 2 - 1e-10;
    for (let iteration = 0; iteration < 90; iteration += 1) {
      const beta = (lower + upper) / 2;
      const comRadius = wallRadius - comDistance * Math.sin(beta);
      const residual = Math.tan(beta) - speed ** 2 / (GRAVITY * comRadius);
      if (residual > 0) upper = beta;
      else lower = beta;
    }
    return (lower + upper) / 2;
  }

  function exactMinimumSpeed(wallRadius, friction, comDistance) {
    if (friction <= 0) return Infinity;
    const limitingLean = Math.atan(1 / friction);
    const limitingRadius = wallRadius - comDistance * Math.sin(limitingLean);
    return Math.sqrt(GRAVITY * limitingRadius / friction);
  }

  function dynamics(
    speedKmh = state.speedKmh,
    wallRadius = state.wallRadius,
    friction = state.friction,
    comDistance = state.comDistance,
  ) {
    const speed = speedKmh / 3.6;
    const lean = solveLean(speed, wallRadius, comDistance);
    const inwardOffset = comDistance * Math.sin(lean);
    const verticalOffset = comDistance * Math.cos(lean);
    const comRadius = wallRadius - inwardOffset;
    const normal = speed <= 1e-12 ? 0 : MASS * speed ** 2 / comRadius;
    const requiredFriction = MASS * GRAVITY;
    const availableFriction = friction * normal;
    const requiredMu = normal <= 1e-12 ? Infinity : requiredFriction / normal;
    const utilization = availableFriction <= 1e-12 ? Infinity : requiredFriction / availableFriction;
    const baseMinimum = friction <= 0 ? Infinity : Math.sqrt(GRAVITY * wallRadius / friction);
    const exactMinimum = exactMinimumSpeed(wallRadius, friction, comDistance);
    const frictionMoment = inwardOffset * requiredFriction;
    const normalMoment = verticalOffset * normal;
    const momentResidual = frictionMoment - normalMoment;
    const tolerance = 0.001;
    const gripState = Math.abs(requiredMu - friction) <= tolerance ? "limiting" : requiredMu < friction ? "safe" : "slide";
    return {
      speed,
      lean,
      inwardOffset,
      verticalOffset,
      comRadius,
      normal,
      requiredFriction,
      availableFriction,
      requiredMu,
      utilization,
      baseMinimum,
      exactMinimum,
      frictionMoment,
      normalMoment,
      momentResidual,
      gripState,
    };
  }

  const challengeValues = dynamics(CHALLENGE.speedKmh, CHALLENGE.wallRadius, CHALLENGE.friction, CHALLENGE.comDistance);

  function gripLabel(values = dynamics()) {
    if (values.gripState === "safe") return "Grip sufficient · steady height";
    if (values.gripState === "limiting") return "At the static-friction limit";
    return "Insufficient grip · slides downward";
  }

  function reconstructionNote() {
    return `
      <p class="p57-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function stageControls() {
    return `
      <div class="p57-stage-controls" role="group" aria-label="Motorcycle wall-riding analysis stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p57-stage" data-p57-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageHeading() {
    const stage = stages[state.stage];
    return `
      <div class="p57-stage-heading">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><h2>${stage.title}</h2></div>
        <p>${stage.copy}</p>
        <button class="ghost-button" type="button" data-problem-action="p57-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Geometry resolved" : "Next stage"}</button>
      </div>`;
  }

  function wallSvg() {
    const values = dynamics();
    const contact = { x: 430, y: 294 };
    const displayLength = 142;
    const com = {
      x: contact.x - displayLength * Math.sin(values.lean),
      y: contact.y - displayLength * Math.cos(values.lean),
    };
    const normalLength = Math.min(125, 43 + values.normal / (MASS * GRAVITY) * 20);
    const frictionLength = 72;
    const resultantLength = Math.min(150, Math.hypot(normalLength, frictionLength));
    const forceMagnitude = Math.hypot(values.normal, values.requiredFriction);
    const resultantDirection = forceMagnitude > 0
      ? { x: -values.normal / forceMagnitude, y: -values.requiredFriction / forceMagnitude }
      : { x: 0, y: -1 };
    const resultEnd = { x: contact.x + resultantDirection.x * resultantLength, y: contact.y + resultantDirection.y * resultantLength };
    const bikeAngle = degrees(values.lean);
    const exactSpeedX = 490 + clamp(values.exactMinimum * 3.6 / 90, 0, 1) * 186;
    const currentSpeedX = 490 + clamp(state.speedKmh / 90, 0, 1) * 186;
    return `
      <svg class="p57-svg p57-stage-${state.stage} is-${values.gripState}" viewBox="0 0 720 440" role="img" aria-labelledby="p57-svg-title p57-svg-desc">
        <title id="p57-svg-title">Motorcycle leaning inward while riding around a vertical cylindrical wall</title>
        <desc id="p57-svg-desc">At ${clean(state.speedKmh, 1)} kilometres per hour on a wall of radius ${clean(state.wallRadius, 1)} metres, the exact lean is ${clean(degrees(values.lean), 2)} degrees inward from vertical. The centre of mass travels on radius ${clean(values.comRadius, 3)} metres and requires friction coefficient ${clean(values.requiredMu, 3)}. ${gripLabel(values)}.</desc>
        <defs>
          <marker id="p57-red-arrow" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p57-blue-arrow" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <marker id="p57-gold-arrow" markerWidth="9" markerHeight="9" refX="7.6" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker>
          <linearGradient id="p57-arena" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfecef"/><stop offset="1" stop-color="#f3ecd8"/></linearGradient>
        </defs>
        <rect width="720" height="440" fill="url(#p57-arena)" />
        <g class="p57-arena" aria-hidden="true">
          <line class="p57-wall" x1="466" y1="35" x2="466" y2="373" />
          <path class="p57-wall-shade" d="M466 35 H720 V373 H466 Z" />
          <line class="p57-ground" x1="32" y1="373" x2="688" y2="373" />
          <text x="481" y="57">vertical cylindrical wall</text>
          <text x="53" y="354">inward · towards cylinder axis</text>
        </g>

        <g class="p57-motorcycle" aria-hidden="true">
          <line class="p57-bike-axis" x1="${contact.x}" y1="${contact.y}" x2="${clean(com.x)}" y2="${clean(com.y)}" />
          <g transform="translate(${clean((contact.x + com.x) / 2)} ${clean((contact.y + com.y) / 2)}) rotate(${-bikeAngle})">
            <circle cx="0" cy="62" r="17" /><circle cx="0" cy="-48" r="17" />
            <path d="M0 45 L-22 10 L0 -20 L18 12 Z M0 -20 L-18 -42 M-26 -40 H3" />
            <path class="p57-rider" d="M-3 -10 L-38 -18 L-48 11 M-38 -18 L-25 -42" />
            <circle class="p57-head" cx="-28" cy="-53" r="10" />
          </g>
          <circle class="p57-com" cx="${clean(com.x)}" cy="${clean(com.y)}" r="7" />
          <text class="p57-com-label" x="${clean(com.x - 12)}" y="${clean(com.y - 13)}">combined COM</text>
          <circle class="p57-contact" cx="${contact.x}" cy="${contact.y}" r="6" />
          <text class="p57-contact-label" x="${contact.x + 12}" y="${contact.y + 20}">contact C</text>
          <line class="p57-vertical-guide" x1="${contact.x}" y1="${contact.y}" x2="${contact.x}" y2="${contact.y - 137}" />
          <path class="p57-lean-arc" d="M${contact.x} ${contact.y - 49} A49 49 0 0 0 ${clean(contact.x - 49 * Math.sin(values.lean))} ${clean(contact.y - 49 * Math.cos(values.lean))}" />
          <text class="p57-lean-label" x="${clean(contact.x - 33 * Math.sin(values.lean / 2) - 20)}" y="${clean(contact.y - 33 * Math.cos(values.lean / 2))}">β=${clean(bikeAngle, 1)}°</text>
        </g>

        <g class="p57-base-force-layer" aria-hidden="true">
          <line class="p57-normal" x1="${contact.x}" y1="${contact.y}" x2="${clean(contact.x - normalLength)}" y2="${contact.y}" marker-end="url(#p57-blue-arrow)" />
          <text x="${clean(contact.x - normalLength / 2)}" y="${contact.y - 11}">N inward</text>
          <line class="p57-friction" x1="${contact.x}" y1="${contact.y}" x2="${contact.x}" y2="${contact.y - frictionLength}" marker-end="url(#p57-gold-arrow)" />
          <text x="${contact.x + 18}" y="${contact.y - frictionLength / 2}">f=mg up</text>
          <line class="p57-weight" x1="${clean(com.x)}" y1="${clean(com.y)}" x2="${clean(com.x)}" y2="${clean(com.y + 72)}" marker-end="url(#p57-red-arrow)" />
          <text x="${clean(com.x + 18)}" y="${clean(com.y + 55)}">mg down</text>
        </g>

        <g class="p57-roll-layer" aria-hidden="true">
          <line class="p57-resultant" x1="${contact.x}" y1="${contact.y}" x2="${clean(resultEnd.x)}" y2="${clean(resultEnd.y)}" marker-end="url(#p57-red-arrow)" />
          <text x="${clean(resultEnd.x - 8)}" y="${clean(resultEnd.y - 10)}">wall resultant</text>
          <text class="p57-moment-note" x="71" y="82">zero roll moment</text>
          <text class="p57-moment-equation" x="71" y="104">(L sinβ)mg = (L cosβ)N</text>
        </g>

        <g class="p57-geometry-layer" aria-hidden="true">
          <line class="p57-axis-line" x1="65" y1="338" x2="430" y2="338" />
          <circle class="p57-axis-point" cx="65" cy="338" r="6" />
          <line class="p57-wall-radius" x1="65" y1="318" x2="430" y2="318" />
          <line class="p57-com-radius" x1="65" y1="344" x2="${clean(430 - 365 * values.inwardOffset / state.wallRadius)}" y2="344" />
          <text x="247" y="310">wall R=${clean(state.wallRadius, 2)} m</text>
          <text x="247" y="362">COM r=${clean(values.comRadius, 3)} m</text>
          <text x="65" y="383">cylinder axis</text>
        </g>

        <g class="p57-speed-strip" aria-hidden="true">
          <rect x="474" y="390" width="218" height="36" rx="11" />
          <line x1="490" y1="409" x2="676" y2="409" />
          <line class="p57-limit-mark" x1="${clean(exactSpeedX)}" y1="397" x2="${clean(exactSpeedX)}" y2="420" />
          <path class="p57-speed-pointer" d="M${clean(currentSpeedX - 6)} 389 L${clean(currentSpeedX + 6)} 389 L${clean(currentSpeedX)} 399 Z" />
          <text x="583" y="421">exact grip limit ${clean(values.exactMinimum * 3.6, 1)} km/h</text>
        </g>

        <g class="p57-status" transform="translate(492 53)">
          <rect width="196" height="61" rx="14" />
          <text class="p57-status-kicker" x="14" y="22">CURRENT RIDE</text>
          <text class="p57-status-value" x="14" y="45">${gripLabel(values)}</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = dynamics();
    return `
      <section class="p57-metrics is-${values.gripState}" aria-label="Motorcycle wall-riding values">
        <div><span>Wall normal N</span><strong>${clean(values.normal / 1000, 3)} kN</strong></div>
        <div><span>Required upward friction</span><strong>${clean(values.requiredFriction / 1000, 3)} kN</strong></div>
        <div><span>Exact lean from vertical</span><strong>${clean(degrees(values.lean), 3)}°</strong></div>
        <div><span>Required μ</span><strong>${clean(values.requiredMu, 3)}</strong></div>
        <div><span>COM path radius r</span><strong>${clean(values.comRadius, 3)} m</strong></div>
        <div><span>Roll-moment residual</span><strong>${values.momentResidual.toExponential(1)} N·m</strong></div>
        <p><strong>${gripLabel(values)}.</strong> Base point-mass limit: ${clean(values.baseMinimum * 3.6, 2)} km/h. Finite-geometry limit: ${clean(values.exactMinimum * 3.6, 2)} km/h.</p>
      </section>`;
  }

  function dynamicMarkup() {
    return `<div class="p57-dynamic">${wallSvg()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    return `
      <section class="p57-controls" aria-label="Wall of Death motorcycle controls">
        <div class="p57-control-grid">
          <label for="p57-speed"><span>COM speed v<output data-p57-live="speed">${clean(state.speedKmh, 1)} km/h</output></span><input id="p57-speed" type="range" min="10" max="80" step="0.1" value="${state.speedKmh}" /></label>
          <label for="p57-radius"><span>Wall radius R<output data-p57-live="radius">${clean(state.wallRadius, 1)} m</output></span><input id="p57-radius" type="range" min="4" max="12" step="0.1" value="${state.wallRadius}" /></label>
          <label for="p57-friction"><span>Static coefficient μs<output data-p57-live="friction">${clean(state.friction, 2)}</output></span><input id="p57-friction" type="range" min="0.1" max="1.2" step="0.01" value="${state.friction}" /></label>
          <label for="p57-com-distance"><span>Contact-to-COM distance L<output data-p57-live="distance">${clean(state.comDistance, 2)} m</output></span><input id="p57-com-distance" type="range" min="0.3" max="1.2" step="0.01" value="${state.comDistance}" /></label>
        </div>
        <p>L is measured along the motorcycle axis from the tyre-wall contact to the combined rider-and-bike COM. The model keeps R&gt;L.</p>
        <div class="p57-presets" role="group" aria-label="Wall-riding configurations">
          <button class="chip-button" type="button" data-problem-action="p57-preset" data-p57-preset="challenge">Challenge</button>
          <button class="chip-button" type="button" data-problem-action="p57-preset" data-p57-preset="limit">Exact grip limit</button>
          <button class="chip-button" type="button" data-problem-action="p57-preset" data-p57-preset="fast">Fast · low μ needed</button>
          <button class="chip-button" type="button" data-problem-action="p57-preset" data-p57-preset="tall">Long COM geometry</button>
        </div>
      </section>`;
  }

  function feedbackMarkup(text, tone) {
    return text ? `<div class="math2-feedback is-${tone}" role="status">${text}</div>` : "";
  }

  function hintStack(hints, count, className) {
    if (!count) return "";
    return `<div class="hint-stack ${className}">${hints.slice(0, count).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function baseSolutionMarkup() {
    if (!state.baseRevealed) return "";
    return `
      <section class="p57-solution p57-base-solution" aria-labelledby="p57-base-solution-heading">
        <h3 id="p57-base-solution-heading" tabindex="-1">★★ Base: grip on the wall</h3>
        <p>In the point-mass model the wall normal is entirely inward and friction entirely upward:</p>
        <div class="p57-equation">N=mv²/R, &nbsp; f=mg</div>
        <p>Static grip requires f≤μsN, hence</p>
        <div class="p57-equation">vmin=√(gR/μs)</div>
        <p>For R=8.00 m and μs=0.60, <strong>vmin=${clean(challengeValues.baseMinimum * 3.6, 3)} km/h</strong>. Mass cancels.</p>
      </section>`;
  }

  function extensionSolutionMarkup() {
    if (!state.extensionRevealed) return "";
    return `
      <section class="p57-solution p57-extension-solution" aria-labelledby="p57-extension-solution-heading">
        <h3 id="p57-extension-solution-heading" tabindex="-1">★★★★ Extension: roll and finite geometry</h3>
        <p>The contact-to-COM vector has inward component L sinβ and upward component L cosβ. Zero moment about the COM requires</p>
        <div class="p57-equation">(L sinβ)mg=(L cosβ)N<br>tanβ=N/(mg)=v²/(gr)</div>
        <p>But the COM travels inside the wall-contact circle:</p>
        <div class="p57-equation">r=R−L sinβ<br>tanβ=v²/{g[R−L sinβ]}</div>
        <p>For v=45.0 km/h, R=8.00 m and L=0.750 m, the unique root is <strong>β=${clean(degrees(challengeValues.lean), 3)}° inward from vertical</strong>. It gives r=${clean(challengeValues.comRadius, 3)} m and μrequired=${clean(challengeValues.requiredMu, 3)}.</p>
        <p>At limiting grip μs=cotβ, so sinβ=1/√(1+μs²). Therefore</p>
        <div class="p57-equation">vmin,exact=√{g[R−L/√(1+μs²)]/μs}<br>=${clean(challengeValues.exactMinimum * 3.6, 3)} km/h</div>
        <p class="p57-limits"><strong>Checks.</strong> As L→0, r→R and the extension reduces to the base result. At high speed β→90° and the required friction coefficient tends towards zero. As μs→0, no finite wall-riding speed can support the weight. The normal is inward, friction upward and gravity downward. Both moment terms have units N·m.</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = dynamics();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: true,
      massKg: MASS,
      speedKilometresPerHour: state.speedKmh,
      wallRadiusMetres: state.wallRadius,
      staticFrictionCoefficient: state.friction,
      contactToComDistanceMetres: state.comDistance,
      leanInwardFromVerticalDegrees: Number(degrees(values.lean).toFixed(6)),
      comPathRadiusMetres: Number(values.comRadius.toFixed(6)),
      normalForceNewtons: Number(values.normal.toFixed(6)),
      upwardFrictionRequiredNewtons: values.requiredFriction,
      requiredFrictionCoefficient: Number(values.requiredMu.toFixed(6)),
      rollMomentResidualNewtonMetres: Number(values.momentResidual.toFixed(9)),
      baseMinimumSpeedKmh: Number((values.baseMinimum * 3.6).toFixed(6)),
      exactMinimumSpeedKmh: Number((values.exactMinimum * 3.6).toFixed(6)),
      gripState: values.gripState,
      stage: state.stage + 1,
      baseCommitted: state.baseCommitted,
      extensionCommitted: state.extensionCommitted,
      baseHintsUsed: state.baseHintsUsed,
      extensionHintsUsed: state.extensionHintsUsed,
      baseSolutionRevealed: state.baseRevealed,
      extensionSolutionRevealed: state.extensionRevealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p57-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circular motion</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p57-spread">
          <article class="book-page p57-problem-page">
            <div class="problem-number">Problem 5.7</div>
            <h1 class="book-title p57-title">Wall of Death: motorcycle</h1>
            <div class="difficulty p57-difficulty" aria-label="Two star base problem with four star extension"><span>★★ base</span><span>★★★★ extension</span></div>
            ${reconstructionNote()}
            <section class="p57-tier p57-base-tier"><strong>★★ Base</strong><p>A 220 kg motorcycle circles inside a vertical cylindrical wall. For wall radius R=8.00 m and μs=0.60, find the minimum speed that prevents downward sliding. Treat its mass as concentrated on the wall circle.</p></section>
            <section class="p57-tier p57-extension-tier"><strong>★★★★ Roll extension</strong><p>Now let the combined COM lie L=0.750 m from the tyre-wall contact along the motorcycle. At 45.0 km/h, find the inward lean β giving zero roll moment. Then correct the minimum speed because the COM radius is smaller than R.</p></section>
            <section class="p57-sign-card"><strong>Force directions</strong><p>Wall normal: radially inward. Static friction: upward. Weight: downward through the COM. Lean β is measured inward from the upward vertical at the contact patch.</p></section>
          </article>

          <section class="book-page book-stage p57-stage">
            ${stageControls()}
            ${stageHeading()}
            ${dynamicMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p57-coach">
            <section class="p57-coach-tier p57-base-coach">
              <div class="coach-kicker">★★ Base check</div>
              <p class="coach-question">What is the point-mass minimum speed for R=8.00 m and μs=0.60?</p>
              <form class="p57-base-form" data-p57-base-form novalidate>
                <label for="p57-base-answer">Minimum speed</label><div><input id="p57-base-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.baseAnswer)}" placeholder="speed in km/h" autocomplete="off" /><span>km/h</span></div>
                <button class="primary-button" type="submit">Check ★★ base</button>
              </form>
              ${feedbackMarkup(state.baseFeedback, state.baseFeedbackTone)}
              <div class="button-row p57-help-row"><button class="secondary-button" type="button" data-problem-action="p57-base-hint" ${state.baseHintsUsed >= baseHints.length ? "disabled" : ""}>${state.baseHintsUsed ? "Another base hint" : "Base hint"}</button><button class="ghost-button" type="button" data-problem-action="p57-base-reveal" ${state.baseRevealed ? "disabled" : ""}>${state.baseRevealed ? "Base revealed" : "Reveal base"}</button></div>
              ${hintStack(baseHints, state.baseHintsUsed, "p57-base-hints")}
              ${baseSolutionMarkup()}
            </section>

            <section class="p57-coach-tier p57-extension-coach">
              <div class="p57-extension-kicker">★★★★ Extension check</div>
              <p class="coach-question">For the same wall with L=0.750 m, find the exact 45 km/h lean and finite-geometry minimum speed.</p>
              <form class="p57-extension-form" data-p57-extension-form novalidate>
                <label for="p57-lean-answer">Lean inward from vertical</label><div><input id="p57-lean-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.leanAnswer)}" placeholder="angle" autocomplete="off" /><span>degrees</span></div>
                <label for="p57-exact-speed-answer">Corrected minimum speed</label><div><input id="p57-exact-speed-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.exactSpeedAnswer)}" placeholder="speed" autocomplete="off" /><span>km/h</span></div>
                <button class="primary-button" type="submit">Check ★★★★ extension</button>
              </form>
              ${feedbackMarkup(state.extensionFeedback, state.extensionFeedbackTone)}
              <div class="button-row p57-help-row"><button class="secondary-button" type="button" data-problem-action="p57-extension-hint" ${state.extensionHintsUsed >= extensionHints.length ? "disabled" : ""}>${state.extensionHintsUsed ? "Another extension hint" : "Extension hint"}</button><button class="ghost-button" type="button" data-problem-action="p57-extension-reveal" ${state.extensionRevealed ? "disabled" : ""}>${state.extensionRevealed ? "Extension revealed" : "Reveal extension"}</button></div>
              ${hintStack(extensionHints, state.extensionHintsUsed, "p57-extension-hints")}
              ${extensionSolutionMarkup()}
            </section>
            <div class="p57-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p57-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p57-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = { speed: `${clean(state.speedKmh, 1)} km/h`, radius: `${clean(state.wallRadius, 1)} m`, friction: clean(state.friction, 2), distance: `${clean(state.comDistance, 2)} m` };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p57-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const result = dynamics();
    root.querySelector("#p57-speed")?.setAttribute("aria-valuetext", `Speed ${clean(state.speedKmh, 1)} kilometres per hour; ${gripLabel(result)}`);
    root.querySelector("#p57-radius")?.setAttribute("aria-valuetext", `Wall radius ${clean(state.wallRadius, 1)} metres; COM radius ${clean(result.comRadius, 2)} metres`);
    root.querySelector("#p57-friction")?.setAttribute("aria-valuetext", `Static friction coefficient ${clean(state.friction, 2)}; required ${clean(result.requiredMu, 3)}`);
    root.querySelector("#p57-com-distance")?.setAttribute("aria-valuetext", `Contact-to-centre-of-mass distance ${clean(state.comDistance, 2)} metres; lean ${clean(degrees(result.lean), 2)} degrees`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p57-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p57-speed");
          return;
        }
        if (action === "p57-stage") {
          state.stage = clamp(Number(control.dataset.p57Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p57-stage="${state.stage}"]`);
          return;
        }
        if (action === "p57-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p57-stage="${state.stage}"]`);
          return;
        }
        if (action === "p57-preset") {
          const preset = control.dataset.p57Preset;
          if (preset === "challenge") {
            state.speedKmh = CHALLENGE.speedKmh; state.wallRadius = CHALLENGE.wallRadius; state.friction = CHALLENGE.friction; state.comDistance = CHALLENGE.comDistance;
          }
          if (preset === "limit") state.speedKmh = Number((dynamics().exactMinimum * 3.6).toFixed(2));
          if (preset === "fast") state.speedKmh = 65;
          if (preset === "tall") { state.speedKmh = 45; state.wallRadius = 6; state.friction = 0.6; state.comDistance = 1.15; }
          renderAndFocus(renderApp, "#p57-speed");
          return;
        }
        if (action === "p57-base-hint") state.baseHintsUsed = Math.min(baseHints.length, state.baseHintsUsed + 1);
        if (action === "p57-extension-hint") { state.extensionHintsUsed = Math.min(extensionHints.length, state.extensionHintsUsed + 1); state.stage = Math.max(1, state.stage); }
        if (action === "p57-base-reveal") state.baseRevealed = true;
        if (action === "p57-extension-reveal") { state.extensionRevealed = true; state.stage = 2; }
        renderApp();
        if (action === "p57-base-reveal") window.requestAnimationFrame(() => document.querySelector("#p57-base-solution-heading")?.focus());
        if (action === "p57-extension-reveal") window.requestAnimationFrame(() => document.querySelector("#p57-extension-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p57-speed", key: "speedKmh", min: 10, max: 80 },
      { selector: "#p57-radius", key: "wallRadius", min: 4, max: 12 },
      { selector: "#p57-friction", key: "friction", min: 0.1, max: 1.2 },
      { selector: "#p57-com-distance", key: "comDistance", min: 0.3, max: 1.2 },
    ].forEach(({ selector, key, min, max }) => document.querySelector(selector)?.addEventListener("input", (event) => {
      state[key] = clamp(Number(event.target.value), min, max);
      updateDynamicDom();
    }));

    const baseInput = document.querySelector("#p57-base-answer");
    baseInput?.addEventListener("input", (event) => { state.baseAnswer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p57-base-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.baseAnswer = sanitizeNumber(baseInput?.value).trim();
      const answer = Number(state.baseAnswer);
      const target = challengeValues.baseMinimum * 3.6;
      state.baseFeedbackTone = "warn";
      state.baseCommitted = false;
      if (!state.baseAnswer || !Number.isFinite(answer)) state.baseFeedback = "Enter one speed in kilometres per hour.";
      else if (Math.abs(answer - target) > 0.05) state.baseFeedback = "Use upward friction f=mg and inward normal N=mv²/R, then impose f=μsN at the threshold.";
      else { state.baseFeedbackTone = "success"; state.baseCommitted = true; state.baseFeedback = `Correct: the ★★ point-mass limit is ${clean(target, 3)} km/h.`; }
      renderAndFocus(renderApp, "#p57-base-answer");
    });

    const leanInput = document.querySelector("#p57-lean-answer");
    const exactInput = document.querySelector("#p57-exact-speed-answer");
    leanInput?.addEventListener("input", (event) => { state.leanAnswer = sanitizeNumber(event.target.value); });
    exactInput?.addEventListener("input", (event) => { state.exactSpeedAnswer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p57-extension-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.leanAnswer = sanitizeNumber(leanInput?.value).trim();
      state.exactSpeedAnswer = sanitizeNumber(exactInput?.value).trim();
      const lean = Number(state.leanAnswer);
      const speed = Number(state.exactSpeedAnswer);
      const targetLean = degrees(challengeValues.lean);
      const targetSpeed = challengeValues.exactMinimum * 3.6;
      state.extensionFeedbackTone = "warn";
      state.extensionCommitted = false;
      if (!state.leanAnswer || !state.exactSpeedAnswer || !Number.isFinite(lean) || !Number.isFinite(speed)) state.extensionFeedback = "Enter the lean in degrees and corrected speed in km/h.";
      else if (Math.abs(lean - targetLean) > 0.04) state.extensionFeedback = "Use the COM radius r=R−L sinβ inside tanβ=v²/(gr). The lean is measured from vertical, not from horizontal.";
      else if (Math.abs(speed - targetSpeed) > 0.05) state.extensionFeedback = "At limiting grip μs=cotβ. Substitute sinβ=1/√(1+μs²) into r=R−L sinβ before finding the speed.";
      else { state.extensionFeedbackTone = "success"; state.extensionCommitted = true; state.extensionFeedback = `Correct: β=${clean(targetLean, 3)}° and vmin,exact=${clean(targetSpeed, 3)} km/h. The finite COM offset reduces the circular radius.`; }
      renderAndFocus(renderApp, "#p57-lean-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
