(function registerWallOfDeathCarPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "5.6";
  const QUESTION_MASS = 1000;
  const QUESTION_RADIUS = 14;
  const QUESTION_MU = 0.7;
  const GRAVITY = 9.8;
  const TOP_CENTRE = Object.freeze({ x: 220, y: 222 });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p56-reset">Reset</button>';
  const hints = Object.freeze([
    "The wall’s normal reaction points horizontally toward the cylinder axis and supplies the centripetal force.",
    "So N = mv²/r. The greatest static friction available along the wall is μN.",
    "At the minimum constant speed, upward friction is at its limit and just balances weight: μN = mg.",
    "Substitute N = mv²/r, cancel the mass and solve v = √(gr/μ).",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question setup", mass: 1000, speed: 12, radius: 14, mu: 0.7, tangentialAcceleration: 0 }),
    Object.freeze({ label: "At minimum", mass: 1000, speed: 14, radius: 14, mu: 0.7, tangentialAcceleration: 0 }),
    Object.freeze({ label: "Brake at 14 m/s", mass: 1000, speed: 14, radius: 14, mu: 0.7, tangentialAcceleration: -3 }),
    Object.freeze({ label: "Heavier car", mass: 1500, speed: 12, radius: 14, mu: 0.7, tangentialAcceleration: 0 }),
  ]);

  const initialState = () => ({
    mass: QUESTION_MASS,
    speed: 12,
    radius: QUESTION_RADIUS,
    mu: QUESTION_MU,
    tangentialAcceleration: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toString();
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function normalForce(mass = state.mass, speed = state.speed, radius = state.radius) {
    return (mass * speed ** 2) / radius;
  }

  function verticalFrictionDemand(mass = state.mass) {
    return mass * GRAVITY;
  }

  function tangentialFrictionDemand(mass = state.mass, tangentialAcceleration = state.tangentialAcceleration) {
    return mass * Math.abs(tangentialAcceleration);
  }

  function totalFrictionDemand(mass = state.mass, tangentialAcceleration = state.tangentialAcceleration) {
    return mass * Math.hypot(GRAVITY, tangentialAcceleration);
  }

  function availableFriction(mass = state.mass, speed = state.speed, radius = state.radius, mu = state.mu) {
    return mu * normalForce(mass, speed, radius);
  }

  function minimumSpeed(radius = state.radius, mu = state.mu, tangentialAcceleration = state.tangentialAcceleration) {
    return Math.sqrt((radius * Math.hypot(GRAVITY, tangentialAcceleration)) / mu);
  }

  function gripMargin() {
    return availableFriction() - totalFrictionDemand();
  }

  function demandRatio() {
    return totalFrictionDemand() / availableFriction();
  }

  function gripState() {
    const ratio = demandRatio();
    if (Math.abs(ratio - 1) <= 0.015) return "limit";
    return ratio < 1 ? "grip" : "slip";
  }

  function gripCopy() {
    const status = gripState();
    if (status === "limit") return "At the static-friction limit";
    if (status === "grip") return "Car holds its height";
    return "Insufficient grip · slides down";
  }

  function accelerationCopy() {
    if (Math.abs(state.tangentialAcceleration) < 0.001) return "constant speed";
    return state.tangentialAcceleration > 0 ? "accelerating" : "braking";
  }

  function questionAnswer() {
    return minimumSpeed(QUESTION_RADIUS, QUESTION_MU, 0);
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.mass - state.mass) < 0.001
      && Math.abs(preset.speed - state.speed) < 0.001
      && Math.abs(preset.radius - state.radius) < 0.001
      && Math.abs(preset.mu - state.mu) < 0.001
      && Math.abs(preset.tangentialAcceleration - state.tangentialAcceleration) < 0.001
    ));
  }

  function geometry() {
    const cylinderRadius = clamp(78 + state.radius * 3, 95, 148);
    const car = { x: TOP_CENTRE.x + cylinderRadius - 20, y: TOP_CENTRE.y };
    const normalLength = Math.min(cylinderRadius - 28, clamp(36 + normalForce() / 170, 36, 112));
    const normalEnd = { x: car.x - normalLength, y: car.y };
    const speedLength = clamp(34 + state.speed * 2.2, 34, 98);
    const speedEnd = { x: car.x, y: car.y - speedLength };
    const tangentialVisible = Math.abs(state.tangentialAcceleration) >= 0.05;
    const tangentialDirection = state.tangentialAcceleration >= 0 ? -1 : 1;
    const tangentialLength = clamp(24 + Math.abs(state.tangentialAcceleration) * 12, 24, 70);
    const tangentialEnd = { x: car.x + 28, y: car.y + tangentialDirection * tangentialLength };
    const sideCarY = 220 + (gripState() === "slip" ? 25 : 0);
    const forceLength = clamp(38 + verticalFrictionDemand() / 190, 38, 86);
    return {
      cylinderRadius,
      car,
      normalEnd,
      speedEnd,
      tangentialVisible,
      tangentialDirection,
      tangentialEnd,
      sideCarY,
      forceLength,
    };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const status = gripState();
    const largerFriction = Math.max(totalFrictionDemand(), availableFriction(), 1);
    return `
      <div class="p56-apparatus-wrap">
        <svg class="p56-apparatus" viewBox="0 0 700 440" role="img" aria-labelledby="p56-apparatus-title p56-apparatus-desc">
          <title id="p56-apparatus-title">Car driving around the inside of a vertical cylindrical wall</title>
          <desc id="p56-apparatus-desc">A ${format(state.mass, 0)} kilogram car circles at ${format(state.speed, 1)} metres per second inside a vertical cylinder of radius ${format(state.radius, 1)} metres. The wall normal is ${format(normalForce() / 1000, 2)} kilonewtons and the static-friction limit is ${format(availableFriction() / 1000, 2)} kilonewtons. ${gripCopy()} while ${accelerationCopy()}.</desc>
          <defs>
            <marker id="p56-arrow-speed" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p56-arrow-normal" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p56-arrow-friction" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p56-arrow-weight" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p56-arrow-tangent" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <text class="p56-view-label" x="45" y="43">TOP VIEW · CIRCULAR MOTION</text>
          <circle class="p56-cylinder-top" data-p56-cylinder cx="${TOP_CENTRE.x}" cy="${TOP_CENTRE.y}" r="${shape.cylinderRadius.toFixed(2)}" />
          <circle class="p56-axis" cx="${TOP_CENTRE.x}" cy="${TOP_CENTRE.y}" r="9" />
          <line class="p56-radius-line" data-p56-radius-line x1="${TOP_CENTRE.x}" y1="${TOP_CENTRE.y}" x2="${shape.car.x.toFixed(2)}" y2="${shape.car.y}" />
          <text class="p56-radius-label" data-p56-radius-label x="${((TOP_CENTRE.x + shape.car.x) / 2).toFixed(2)}" y="${shape.car.y - 11}">r = ${format(state.radius, 1)} m</text>
          <g class="p56-top-car is-${status}" data-p56-top-car transform="translate(${shape.car.x.toFixed(2)} ${shape.car.y}) rotate(-90)">
            <rect x="-23" y="-13" width="46" height="26" rx="7" /><path d="M-10-13-2-22h16l10 9M-16-16v32m32-32v32" />
          </g>
          <line class="p56-speed-arrow" data-p56-speed-arrow x1="${shape.car.x.toFixed(2)}" y1="${shape.car.y}" x2="${shape.speedEnd.x.toFixed(2)}" y2="${shape.speedEnd.y.toFixed(2)}" marker-end="url(#p56-arrow-speed)" />
          <text class="p56-vector-label is-speed" data-p56-speed-label x="${(shape.speedEnd.x + 10).toFixed(2)}" y="${(shape.speedEnd.y - 7).toFixed(2)}">v = ${format(state.speed, 1)} m/s</text>
          <line class="p56-normal-arrow" data-p56-normal-arrow x1="${shape.car.x.toFixed(2)}" y1="${shape.car.y}" x2="${shape.normalEnd.x.toFixed(2)}" y2="${shape.normalEnd.y}" marker-end="url(#p56-arrow-normal)" />
          <text class="p56-vector-label is-normal" data-p56-normal-label x="${(shape.normalEnd.x - 8).toFixed(2)}" y="${shape.normalEnd.y - 10}" text-anchor="end">N = mv²/r</text>
          <g class="p56-tangent-demand" data-p56-tangent-demand opacity="${shape.tangentialVisible ? 1 : 0}">
            <line x1="${shape.car.x + 28}" y1="${shape.car.y}" x2="${shape.tangentialEnd.x}" y2="${shape.tangentialEnd.y.toFixed(2)}" marker-end="url(#p56-arrow-tangent)" />
            <text x="${shape.car.x + 39}" y="${(shape.tangentialEnd.y + (shape.tangentialDirection > 0 ? 17 : -7)).toFixed(2)}">maₜ · ${accelerationCopy()}</text>
          </g>

          <text class="p56-view-label" x="455" y="43">SIDE VIEW · VERTICAL BALANCE</text>
          <path class="p56-wall" d="M590 72v302M570 72h40M570 374h40" />
          <g class="p56-side-car is-${status}" data-p56-side-car transform="translate(527 ${shape.sideCarY})">
            <path d="M-45-20h55l21 15v27h-76Z" /><path d="M-20-20-7-36h25L31-5" /><circle cx="-25" cy="24" r="9" /><circle cx="17" cy="24" r="9" />
          </g>
          <line class="p56-friction-arrow" data-p56-friction-arrow x1="565" y1="${shape.sideCarY + 14}" x2="565" y2="${shape.sideCarY + 14 - shape.forceLength}" marker-end="url(#p56-arrow-friction)" />
          <text class="p56-force-label is-friction" data-p56-friction-label x="575" y="${shape.sideCarY + 7 - shape.forceLength}">needed fᵧ = mg</text>
          <line class="p56-weight-arrow" data-p56-weight-arrow x1="470" y1="${shape.sideCarY - 10}" x2="470" y2="${shape.sideCarY - 10 + shape.forceLength}" marker-end="url(#p56-arrow-weight)" />
          <text class="p56-force-label is-weight" data-p56-weight-label x="460" y="${shape.sideCarY + shape.forceLength + 8}" text-anchor="end">mg = ${format(verticalFrictionDemand() / 1000, 2)} kN</text>
          <g class="p56-slip-down" data-p56-slip-down opacity="${status === "slip" ? 1 : 0}"><path d="M630 185v105" marker-end="url(#p56-arrow-weight)" /><text x="640" y="246">slides down</text></g>
          <text class="p56-state-label is-${status}" x="525" y="415" text-anchor="middle" data-p56-live="state">${gripCopy()}</text>
        </svg>
        <div class="p56-friction-strip is-${status}" data-p56-friction-strip>
          <div><span>Tyre-friction demand</span><strong data-p56-live="friction-demand">${format(totalFrictionDemand() / 1000, 2)} kN</strong><i style="--p56-size:${((totalFrictionDemand() / largerFriction) * 100).toFixed(2)}%"></i></div>
          <div class="p56-friction-state"><span>Wall state</span><strong data-p56-live="grip-state">${gripCopy()}</strong></div>
          <div><span>Static-friction limit · μN</span><strong data-p56-live="friction-limit">${format(availableFriction() / 1000, 2)} kN</strong><i style="--p56-size:${((availableFriction() / largerFriction) * 100).toFixed(2)}%"></i></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit, digits = 1) {
    return `
      <label class="p56-range-row" for="p56-${kind}-slider">
        <span><strong>${label}</strong><output data-p56-live="${kind}">${format(value, digits)}${unit}</output></span>
        <input id="p56-${kind}-slider" data-p56-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "mu" ? "tyre / wall" : kind === "radius" ? "cylinder radius" : kind === "mass" ? "vehicle mass" : kind === "tangential-acceleration" ? "brake ← · → accelerate" : "around wall"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p56-controls">
        ${sliderMarkup("speed", "Circular speed · v", 5, 30, 0.5, state.speed, " m/s")}
        ${sliderMarkup("radius", "Cylinder radius · r", 5, 25, 0.5, state.radius, " m")}
        ${sliderMarkup("mu", "Friction coefficient · μ", 0.2, 1.1, 0.05, state.mu, "", 2)}
        ${sliderMarkup("mass", "Car mass · m", 600, 1600, 50, state.mass, " kg", 0)}
        ${sliderMarkup("tangential-acceleration", "Drive / brake · aₜ", -4, 4, 0.25, state.tangentialAcceleration, " m/s²", 2)}
        <div class="p56-caveat"><strong>Grip sharing:</strong> braking or accelerating adds a tangential tyre force. The vertical and tangential demands combine vectorially within the same μN limit.</div>
        <div class="p56-presets" aria-label="Wall-of-death presets">${presets.map((preset, index) => `<button class="chip-button p56-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p56-preset" data-p56-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    const margin = gripMargin();
    return `
      <div class="p56-metrics" aria-live="polite">
        <div><span>Wall normal · N</span><strong data-p56-live="normal-force">${format(normalForce() / 1000, 2)} kN</strong></div>
        <div><span>Minimum speed now</span><strong data-p56-live="minimum-speed">${format(minimumSpeed(), 2)} m/s · ${format(minimumSpeed() * 3.6, 1)} km/h</strong></div>
        <div class="is-${gripState()}" data-p56-margin-card><span>Grip margin · μN − |f|</span><strong data-p56-live="grip-margin">${margin >= 0 ? "+" : ""}${format(margin / 1000, 2)} kN</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p56-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p56-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p56-solution" aria-labelledby="p56-solution-heading">
        <h3 id="p56-solution-heading" tabindex="-1">Normal force creates the friction ceiling</h3>
        <p>Horizontal circular motion fixes the wall’s normal reaction:</p>
        <div class="p56-equation">N = mv²/r</div>
        <p>At the minimum constant speed, maximum upward static friction just balances the car’s weight:</p>
        <div class="p56-equation">μN = mg, so μmv²/r = mg</div>
        <p>Cancel the non-zero mass:</p>
        <div class="p56-equation">v<sub>min</sub> = √(gr/μ)</div>
        <div class="p56-equation is-answer">v<sub>min</sub> = √[(9.8)(14)/(0.70)] = √196 = 14 m/s = 50.4 km/h</div>
        <p>If the car accelerates or brakes tangentially at <em>aₜ</em>, the tyre force must have vertical component <em>mg</em> and tangential component <em>maₜ</em>. Its magnitude is then <em>m√(g² + aₜ²)</em>, raising the minimum speed to <em>√[r√(g² + aₜ²)/μ]</em>. As μ tends to zero the required speed diverges; as r tends to zero the ideal-model threshold tends to zero. Mass cancels in every grip ratio.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      assumptions: ["vertical wall", "static tyre friction", "no aerodynamic downforce"],
      massKilograms: state.mass,
      speedMetresPerSecond: state.speed,
      cylinderRadiusMetres: state.radius,
      staticFrictionCoefficient: state.mu,
      tangentialAccelerationMetresPerSecondSquared: state.tangentialAcceleration,
      normalForceNewtons: Number(normalForce().toFixed(4)),
      verticalFrictionDemandNewtons: Number(verticalFrictionDemand().toFixed(4)),
      tangentialFrictionDemandNewtons: Number(tangentialFrictionDemand().toFixed(4)),
      combinedFrictionDemandNewtons: Number(totalFrictionDemand().toFixed(4)),
      staticFrictionLimitNewtons: Number(availableFriction().toFixed(4)),
      gripMarginNewtons: Number(gripMargin().toFixed(4)),
      demandRatioIndependentOfMass: Number(demandRatio().toFixed(4)),
      minimumSpeedMetresPerSecond: Number(minimumSpeed().toFixed(4)),
      gripState: gripState(),
      questionAnswerMetresPerSecond: questionAnswer(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p56-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circular motion</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p56-spread">
          <article class="book-page p56-problem-page">
            <div class="problem-number">Problem 5.6</div>
            <h1 class="book-title p56-title">Wall of Death: car</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="problem-copy">A 1000 kg car drives at constant speed around the inside of a vertical cylindrical wall of radius 14 m. The coefficient of static friction between tyres and wall is 0.70.</p>
            <p class="problem-copy">Using <em>g = 9.8 m/s²</em>, what is the minimum speed at which the car can maintain its height?</p>
            <p class="p56-assumption">Ignore aerodynamic downforce. For the central question the speed is constant, so tyre friction acts vertically upward.</p>
            <p class="p56-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written vertical-cylinder model is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Two perpendicular jobs</div><p>The wall’s normal force turns the car. Friction along the wall holds it up—and must share grip with any braking or acceleration.</p></section>
          </article>

          <section class="book-page book-stage p56-stage" aria-labelledby="p56-stage-title">
            <div class="p56-stage-card">
              <div class="p56-stage-heading"><div><span class="eyebrow">Vertical-wall laboratory</span><h2 id="p56-stage-title">Build enough normal force</h2></div><p>Change speed, radius, tyres or driving demand. Top and side views separate the circular and vertical force balances.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p56-coach">
            <div class="coach-kicker">Find the minimum speed</div>
            <p class="coach-question">For r = 14 m and μ = 0.70 at constant speed, what is the no-slip minimum?</p>
            <form class="p56-answer-form" data-p56-answer-form novalidate>
              <label for="p56-answer">Minimum speed</label>
              <div><input id="p56-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 15" /><span>m/s</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p56-help-row"><button class="secondary-button" type="button" data-problem-action="p56-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p56-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateLiveDom(root) {
    const shape = geometry();
    const status = gripState();
    const margin = gripMargin();
    const largerFriction = Math.max(totalFrictionDemand(), availableFriction(), 1);
    const values = {
      speed: `${format(state.speed, 1)} m/s`,
      radius: `${format(state.radius, 1)} m`,
      mu: format(state.mu, 2),
      mass: `${format(state.mass, 0)} kg`,
      "tangential-acceleration": `${format(state.tangentialAcceleration, 2)} m/s²`,
      state: gripCopy(),
      "grip-state": gripCopy(),
      "friction-demand": `${format(totalFrictionDemand() / 1000, 2)} kN`,
      "friction-limit": `${format(availableFriction() / 1000, 2)} kN`,
      "normal-force": `${format(normalForce() / 1000, 2)} kN`,
      "minimum-speed": `${format(minimumSpeed(), 2)} m/s · ${format(minimumSpeed() * 3.6, 1)} km/h`,
      "grip-margin": `${margin >= 0 ? "+" : ""}${format(margin / 1000, 2)} kN`,
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p56-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const cylinder = root.querySelector("[data-p56-cylinder]");
    if (cylinder) cylinder.setAttribute("r", shape.cylinderRadius.toFixed(2));
    const radiusLine = root.querySelector("[data-p56-radius-line]");
    if (radiusLine) radiusLine.setAttribute("x2", shape.car.x.toFixed(2));
    const radiusLabel = root.querySelector("[data-p56-radius-label]");
    if (radiusLabel) {
      radiusLabel.setAttribute("x", ((TOP_CENTRE.x + shape.car.x) / 2).toFixed(2));
      radiusLabel.textContent = `r = ${format(state.radius, 1)} m`;
    }
    const topCar = root.querySelector("[data-p56-top-car]");
    if (topCar) {
      topCar.setAttribute("transform", `translate(${shape.car.x.toFixed(2)} ${shape.car.y}) rotate(-90)`);
      topCar.setAttribute("class", `p56-top-car is-${status}`);
    }
    const setLine = (selector, coordinates) => {
      const line = root.querySelector(selector);
      if (!line) return;
      Object.entries(coordinates).forEach(([attribute, value]) => line.setAttribute(attribute, Number(value).toFixed(2)));
    };
    setLine("[data-p56-speed-arrow]", { x1: shape.car.x, y1: shape.car.y, x2: shape.speedEnd.x, y2: shape.speedEnd.y });
    setLine("[data-p56-normal-arrow]", { x1: shape.car.x, y1: shape.car.y, x2: shape.normalEnd.x, y2: shape.normalEnd.y });
    const setText = (selector, x, y, text) => {
      const node = root.querySelector(selector);
      if (!node) return;
      node.setAttribute("x", Number(x).toFixed(2));
      node.setAttribute("y", Number(y).toFixed(2));
      node.textContent = text;
    };
    setText("[data-p56-speed-label]", shape.speedEnd.x + 10, shape.speedEnd.y - 7, `v = ${format(state.speed, 1)} m/s`);
    setText("[data-p56-normal-label]", shape.normalEnd.x - 8, shape.normalEnd.y - 10, "N = mv²/r");
    const tangentDemand = root.querySelector("[data-p56-tangent-demand]");
    if (tangentDemand) {
      tangentDemand.setAttribute("opacity", shape.tangentialVisible ? "1" : "0");
      const line = tangentDemand.querySelector("line");
      if (line) {
        line.setAttribute("x1", (shape.car.x + 28).toFixed(2));
        line.setAttribute("y1", shape.car.y.toFixed(2));
        line.setAttribute("x2", (shape.car.x + 28).toFixed(2));
        line.setAttribute("y2", shape.tangentialEnd.y.toFixed(2));
      }
      const label = tangentDemand.querySelector("text");
      if (label) {
        label.setAttribute("x", (shape.car.x + 39).toFixed(2));
        label.setAttribute("y", (shape.tangentialEnd.y + (shape.tangentialDirection > 0 ? 17 : -7)).toFixed(2));
        label.textContent = `maₜ · ${accelerationCopy()}`;
      }
    }
    const sideCar = root.querySelector("[data-p56-side-car]");
    if (sideCar) {
      sideCar.setAttribute("transform", `translate(527 ${shape.sideCarY})`);
      sideCar.setAttribute("class", `p56-side-car is-${status}`);
    }
    setLine("[data-p56-friction-arrow]", { x1: 565, y1: shape.sideCarY + 14, x2: 565, y2: shape.sideCarY + 14 - shape.forceLength });
    setLine("[data-p56-weight-arrow]", { x1: 470, y1: shape.sideCarY - 10, x2: 470, y2: shape.sideCarY - 10 + shape.forceLength });
    setText("[data-p56-friction-label]", 575, shape.sideCarY + 7 - shape.forceLength, "needed fᵧ = mg");
    setText("[data-p56-weight-label]", 460, shape.sideCarY + shape.forceLength + 8, `mg = ${format(verticalFrictionDemand() / 1000, 2)} kN`);
    const slip = root.querySelector("[data-p56-slip-down]");
    if (slip) slip.setAttribute("opacity", status === "slip" ? "1" : "0");
    const stateLabel = root.querySelector(".p56-state-label");
    if (stateLabel) stateLabel.setAttribute("class", `p56-state-label is-${status}`);
    const strip = root.querySelector("[data-p56-friction-strip]");
    if (strip) {
      strip.setAttribute("class", `p56-friction-strip is-${status}`);
      const bars = strip.querySelectorAll("i");
      bars[0]?.style.setProperty("--p56-size", `${((totalFrictionDemand() / largerFriction) * 100).toFixed(2)}%`);
      bars[1]?.style.setProperty("--p56-size", `${((availableFriction() / largerFriction) * 100).toFixed(2)}%`);
    }
    const marginCard = root.querySelector("[data-p56-margin-card]");
    if (marginCard) marginCard.setAttribute("class", `is-${status}`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p56-preset"]').forEach((button) => {
      const active = Number(button.dataset.p56Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p56-apparatus-desc");
    if (description) description.textContent = `A ${format(state.mass, 0)} kilogram car circles at ${format(state.speed, 1)} metres per second inside a vertical cylinder of radius ${format(state.radius, 1)} metres. The wall normal is ${format(normalForce() / 1000, 2)} kilonewtons and the static-friction limit is ${format(availableFriction() / 1000, 2)} kilonewtons. ${gripCopy()} while ${accelerationCopy()}.`;
    root.querySelector(".p56-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseSpeed(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/(?:km\/h|kph)$/.test(normalized)) return Number(normalized.replace(/\s*(?:km\/h|kph)$/, "")) / 3.6;
    if (/m\/s$/.test(normalized)) return Number(normalized.replace(/\s*m\/s$/, ""));
    return Number(normalized);
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p56-shell");
    if (!root) return;

    root.querySelector("#p56-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p56-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p56Slider;
        if (kind === "speed") state.speed = clamp(event.target.value, 5, 30);
        if (kind === "radius") state.radius = clamp(event.target.value, 5, 25);
        if (kind === "mu") state.mu = clamp(event.target.value, 0.2, 1.1);
        if (kind === "mass") state.mass = clamp(event.target.value, 600, 1600);
        if (kind === "tangential-acceleration") state.tangentialAcceleration = clamp(event.target.value, -4, 4);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p56-reset") state = initialState();
        if (action === "p56-preset") {
          const preset = presets[Number(control.dataset.p56Preset)];
          if (preset) {
            state.mass = preset.mass;
            state.speed = preset.speed;
            state.radius = preset.radius;
            state.mu = preset.mu;
            state.tangentialAcceleration = preset.tangentialAcceleration;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p56-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p56-reveal") state.revealed = true;
        rerender();
        if (action === "p56-reveal") window.requestAnimationFrame(() => document.querySelector("#p56-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p56-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p56-answer")?.value || "";
      const estimate = parseSpeed(raw);
      const exact = questionAnswer();
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive speed in metres per second, or include km/h with your value.";
        state.feedbackTone = "warn";
      } else if (estimate > 40 && !/(?:km\/h|kph)$/i.test(raw.trim())) {
        state.feedback = "That looks like kilometres per hour. Add km/h, or convert to metres per second.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.1) {
          state.feedback = "Correct. At 14 m/s, μN = 9.8 kN exactly balances the car’s weight.";
          state.feedbackTone = "success";
          state.mass = QUESTION_MASS;
          state.speed = exact;
          state.radius = QUESTION_RADIUS;
          state.mu = QUESTION_MU;
          state.tangentialAcceleration = 0;
        } else if (estimate > exact) {
          state.feedback = "That speed is sufficient, but it is above the minimum. Set μmv²/r equal to mg.";
        } else {
          state.feedback = "That speed produces too little normal force, so μN cannot support the car’s weight.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p56-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
