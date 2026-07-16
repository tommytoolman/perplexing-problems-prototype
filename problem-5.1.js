(function registerSuperbikeFrictionPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "5.1";
  const QUESTION_MASS = 250;
  const QUESTION_RADIUS = 50;
  const QUESTION_MU = 0.8;
  const GRAVITY = 9.8;
  const TRACK_CENTER = Object.freeze({ x: 275, y: 225 });
  const BIKE_ANGLE_DEGREES = -40;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p51-reset">Reset</button>';
  const hints = Object.freeze([
    "On a flat corner, static friction is the horizontal force pointing toward the centre of the circular path.",
    "At the no-slip limit, required centripetal force equals maximum static friction: mv²/r = μmg.",
    "The mass appears on both sides, so it cancels. This leaves v² = μgr.",
    "Substitute μ = 0.80, g = 9.8 m/s² and r = 50 m: v² = 392 m²/s².",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question setup", mass: 250, speed: 18, radius: 50, mu: 0.8 }),
    Object.freeze({ label: "At the limit", mass: 250, speed: 19.8, radius: 50, mu: 0.8 }),
    Object.freeze({ label: "Slides wide", mass: 250, speed: 26, radius: 50, mu: 0.8 }),
    Object.freeze({ label: "Heavier bike", mass: 380, speed: 18, radius: 50, mu: 0.8 }),
  ]);

  const initialState = () => ({
    mass: QUESTION_MASS,
    speed: 18,
    radius: QUESTION_RADIUS,
    mu: QUESTION_MU,
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

  function radians(degrees) {
    return (degrees * Math.PI) / 180;
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

  function requiredForce(mass = state.mass, speed = state.speed, radius = state.radius) {
    return (mass * speed ** 2) / radius;
  }

  function availableFriction(mass = state.mass, mu = state.mu) {
    return mu * mass * GRAVITY;
  }

  function requiredMu(speed = state.speed, radius = state.radius) {
    return speed ** 2 / (GRAVITY * radius);
  }

  function maximumSpeed(mu = state.mu, radius = state.radius) {
    return Math.sqrt(mu * GRAVITY * radius);
  }

  function forceRatio() {
    return requiredForce() / availableFriction();
  }

  function gripState() {
    const ratio = forceRatio();
    if (Math.abs(ratio - 1) <= 0.015) return "limit";
    return ratio < 1 ? "grip" : "slip";
  }

  function gripCopy() {
    const status = gripState();
    if (status === "limit") return "At the grip limit";
    if (status === "grip") return "Tyres hold the line";
    return "Bike slides wide";
  }

  function questionAnswer() {
    return maximumSpeed(QUESTION_MU, QUESTION_RADIUS);
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.mass - state.mass) < 0.001
      && Math.abs(preset.speed - state.speed) < 0.01
      && Math.abs(preset.radius - state.radius) < 0.001
      && Math.abs(preset.mu - state.mu) < 0.001
    ));
  }

  function geometry() {
    const angle = radians(BIKE_ANGLE_DEGREES);
    const trackRadius = clamp(76 + state.radius * 0.82, 88, 174);
    const radial = { x: Math.cos(angle), y: Math.sin(angle) };
    const tangent = { x: -Math.sin(angle), y: Math.cos(angle) };
    const bike = {
      x: TRACK_CENTER.x + trackRadius * radial.x,
      y: TRACK_CENTER.y + trackRadius * radial.y,
    };
    const velocityLength = clamp(34 + state.speed * 2, 34, 105);
    const velocityEnd = {
      x: bike.x + tangent.x * velocityLength,
      y: bike.y + tangent.y * velocityLength,
    };
    const forceLength = Math.min(trackRadius - 18, clamp(34 + requiredForce() / 38, 34, 110));
    const forceEnd = {
      x: bike.x - radial.x * forceLength,
      y: bike.y - radial.y * forceLength,
    };
    const slipLength = gripState() === "slip" ? clamp(28 + (forceRatio() - 1) * 35, 28, 76) : 0;
    const slipEnd = {
      x: bike.x + radial.x * slipLength,
      y: bike.y + radial.y * slipLength,
    };
    return {
      trackRadius,
      radial,
      tangent,
      bike,
      velocityEnd,
      forceEnd,
      slipEnd,
      slipLength,
      bikeRotation: BIKE_ANGLE_DEGREES + 90,
    };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const status = gripState();
    const largerForce = Math.max(requiredForce(), availableFriction(), 1);
    const radiusLabel = {
      x: (TRACK_CENTER.x + shape.bike.x) / 2,
      y: (TRACK_CENTER.y + shape.bike.y) / 2 - 10,
    };
    return `
      <div class="p51-apparatus-wrap">
        <svg class="p51-apparatus" viewBox="0 0 700 440" role="img" aria-labelledby="p51-apparatus-title p51-apparatus-desc">
          <title id="p51-apparatus-title">Superbike taking a flat circular corner</title>
          <desc id="p51-apparatus-desc">A ${format(state.mass, 0)} kilogram bike and rider travel at ${format(state.speed, 1)} metres per second around a flat turn of radius ${format(state.radius, 0)} metres. Required inward force is ${format(requiredForce() / 1000, 2)} kilonewtons and maximum tyre friction is ${format(availableFriction() / 1000, 2)} kilonewtons. ${gripCopy()}.</desc>
          <defs>
            <marker id="p51-arrow-speed" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p51-arrow-force" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p51-arrow-slip" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <circle class="p51-track-edge" data-p51-track-edge cx="${TRACK_CENTER.x}" cy="${TRACK_CENTER.y}" r="${shape.trackRadius.toFixed(2)}" />
          <circle class="p51-track-line" data-p51-track-line cx="${TRACK_CENTER.x}" cy="${TRACK_CENTER.y}" r="${shape.trackRadius.toFixed(2)}" />
          <circle class="p51-infield" cx="${TRACK_CENTER.x}" cy="${TRACK_CENTER.y}" r="34" />
          <g class="p51-centre" transform="translate(${TRACK_CENTER.x} ${TRACK_CENTER.y})"><circle r="8" /><path d="M-18 0h36M0-18v36" /></g>
          <line class="p51-radius-line" data-p51-radius-line x1="${TRACK_CENTER.x}" y1="${TRACK_CENTER.y}" x2="${shape.bike.x.toFixed(2)}" y2="${shape.bike.y.toFixed(2)}" />
          <text class="p51-radius-label" data-p51-radius-label x="${radiusLabel.x.toFixed(2)}" y="${radiusLabel.y.toFixed(2)}">r = ${format(state.radius, 0)} m</text>
          <g class="p51-bike is-${status}" data-p51-bike transform="translate(${shape.bike.x.toFixed(2)} ${shape.bike.y.toFixed(2)}) rotate(${shape.bikeRotation})">
            <circle cx="-19" cy="0" r="8" /><circle cx="19" cy="0" r="8" />
            <path d="M-19 0h38M-7-10 7 10M-5 0l12-14M5-14h16" />
            <ellipse cx="2" cy="0" rx="13" ry="7" />
          </g>
          <line class="p51-speed-arrow" data-p51-speed-arrow x1="${shape.bike.x.toFixed(2)}" y1="${shape.bike.y.toFixed(2)}" x2="${shape.velocityEnd.x.toFixed(2)}" y2="${shape.velocityEnd.y.toFixed(2)}" marker-end="url(#p51-arrow-speed)" />
          <text class="p51-vector-label is-speed" data-p51-speed-label x="${(shape.velocityEnd.x + 8).toFixed(2)}" y="${(shape.velocityEnd.y + 18).toFixed(2)}">v = ${format(state.speed, 1)} m/s</text>
          <line class="p51-force-arrow" data-p51-force-arrow x1="${shape.bike.x.toFixed(2)}" y1="${shape.bike.y.toFixed(2)}" x2="${shape.forceEnd.x.toFixed(2)}" y2="${shape.forceEnd.y.toFixed(2)}" marker-end="url(#p51-arrow-force)" />
          <text class="p51-vector-label is-force" data-p51-force-label x="${(shape.forceEnd.x - 8).toFixed(2)}" y="${(shape.forceEnd.y - 10).toFixed(2)}" text-anchor="end">mv²/r = ${format(requiredForce() / 1000, 2)} kN</text>
          <g class="p51-slip-vector" data-p51-slip-vector opacity="${status === "slip" ? 1 : 0}">
            <line x1="${shape.bike.x.toFixed(2)}" y1="${shape.bike.y.toFixed(2)}" x2="${shape.slipEnd.x.toFixed(2)}" y2="${shape.slipEnd.y.toFixed(2)}" marker-end="url(#p51-arrow-slip)" />
            <text x="${(shape.slipEnd.x + 8).toFixed(2)}" y="${(shape.slipEnd.y - 8).toFixed(2)}">slides outward</text>
          </g>
          <g class="p51-flag" transform="translate(565 300)"><path d="M0 0v95" /><path d="M3 4h72v46H3Z" /><path d="M3 4h18v12H3m36-12v12H21m36-12v12H39M3 28h18v-12m18 0v12H21m36-12v12H39m18 0h18" /></g>
          <text class="p51-state-label is-${status}" x="565" y="420" text-anchor="middle" data-p51-live="state">${gripCopy()}</text>
        </svg>
        <div class="p51-force-strip is-${status}" data-p51-force-strip>
          <div><span>Required inward force</span><strong data-p51-live="required-force">${format(requiredForce() / 1000, 2)} kN</strong><i style="--p51-size:${((requiredForce() / largerForce) * 100).toFixed(2)}%"></i></div>
          <div class="p51-force-state"><span>Tyre state</span><strong data-p51-live="grip-state">${gripCopy()}</strong></div>
          <div><span>Maximum static friction</span><strong data-p51-live="available-force">${format(availableFriction() / 1000, 2)} kN</strong><i style="--p51-size:${((availableFriction() / largerForce) * 100).toFixed(2)}%"></i></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit, digits = 1) {
    return `
      <label class="p51-range-row" for="p51-${kind}-slider">
        <span><strong>${label}</strong><output data-p51-live="${kind}">${format(value, digits)}${unit}</output></span>
        <input id="p51-${kind}-slider" data-p51-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "mu" ? "tyre / track" : kind === "radius" ? "turn radius" : kind === "mass" ? "bike + rider" : "track speed"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p51-controls">
        ${sliderMarkup("speed", "Speed · v", 5, 40, 0.1, state.speed, " m/s")}
        ${sliderMarkup("radius", "Corner radius · r", 15, 120, 1, state.radius, " m", 0)}
        ${sliderMarkup("mu", "Friction coefficient · μ", 0.1, 1.2, 0.05, state.mu, "", 2)}
        ${sliderMarkup("mass", "Total mass · m", 120, 400, 10, state.mass, " kg", 0)}
        <div class="p51-presets" aria-label="Cornering presets">${presets.map((preset, index) => `<button class="chip-button p51-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p51-preset" data-p51-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    return `
      <div class="p51-metrics" aria-live="polite">
        <div><span>Maximum no-slip speed</span><strong data-p51-live="maximum-speed">${format(maximumSpeed(), 2)} m/s · ${format(maximumSpeed() * 3.6, 1)} km/h</strong></div>
        <div><span>Friction required</span><strong data-p51-live="required-mu">μ = ${format(requiredMu(), 3)}</strong></div>
        <div><span>Lateral acceleration</span><strong data-p51-live="lateral-acceleration">${format(state.speed ** 2 / state.radius, 2)} m/s²</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p51-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p51-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p51-solution" aria-labelledby="p51-solution-heading">
        <h3 id="p51-solution-heading" tabindex="-1">Friction supplies the centripetal force</h3>
        <p>At the threshold of slipping, the required inward force has reached the maximum available static friction:</p>
        <div class="p51-equation">mv²/r = μmg</div>
        <p>Cancel the non-zero mass. A heavier bike needs more centripetal force, but it gains the same proportionally larger friction limit:</p>
        <div class="p51-equation">v² = μgr</div>
        <div class="p51-equation">v² = (0.80)(9.8)(50) = 392 m²/s²</div>
        <div class="p51-equation is-answer">v<sub>max</sub> = √392 = 14√2 ≈ 19.80 m/s ≈ 71.3 km/h</div>
        <p>This model assumes a level road, no banking, static tyre grip and no simultaneous braking or acceleration. As μ tends to zero or the radius tends to zero, the maximum speed tends to zero. Increasing radius raises the limit only with the square root of <em>r</em>.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      assumptions: ["flat road", "static friction", "no longitudinal tyre force"],
      massKilograms: state.mass,
      speedMetresPerSecond: state.speed,
      radiusMetres: state.radius,
      staticFrictionCoefficient: state.mu,
      gravityMetresPerSecondSquared: GRAVITY,
      requiredCentripetalForceNewtons: Number(requiredForce().toFixed(4)),
      availableStaticFrictionNewtons: Number(availableFriction().toFixed(4)),
      forceRatioIndependentOfMass: Number(forceRatio().toFixed(4)),
      requiredFrictionCoefficient: Number(requiredMu().toFixed(4)),
      maximumNoSlipSpeedMetresPerSecond: Number(maximumSpeed().toFixed(4)),
      gripState: gripState(),
      questionAnswerMetresPerSecond: Number(questionAnswer().toFixed(6)),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p51-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circular motion</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p51-spread">
          <article class="book-page p51-problem-page">
            <div class="problem-number">Problem 5.1</div>
            <h1 class="book-title p51-title">Friction at the superbike races</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="problem-copy">A superbike and rider of combined mass 250 kg take a flat circular corner of radius 50 m. The coefficient of static friction between the tyres and track is 0.80.</p>
            <p class="problem-copy">Using <em>g = 9.8 m/s²</em>, what is the maximum speed before the tyres begin to slip?</p>
            <p class="p51-assumption">Assume all available tyre grip acts sideways: the rider is neither braking nor accelerating along the track.</p>
            <p class="p51-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written flat-corner model is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">A force ceiling</div><p>Cornering demand grows with the square of speed. Tyre grip has a fixed ceiling for a chosen surface and mass.</p></section>
          </article>

          <section class="book-page book-stage p51-stage" aria-labelledby="p51-stage-title">
            <div class="p51-stage-card">
              <div class="p51-stage-heading"><div><span class="eyebrow">Flat-corner laboratory</span><h2 id="p51-stage-title">Stay inside the grip envelope</h2></div><p>Change the speed, radius, tyres or mass. The arrows and force bars show whether static friction can hold the line.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p51-coach">
            <div class="coach-kicker">Find the speed limit</div>
            <p class="coach-question">For μ = 0.80 and r = 50 m, what is the maximum no-slip speed?</p>
            <form class="p51-answer-form" data-p51-answer-form novalidate>
              <label for="p51-answer">Maximum speed</label>
              <div><input id="p51-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 20" /><span>m/s</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p51-help-row"><button class="secondary-button" type="button" data-problem-action="p51-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p51-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
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
    const largerForce = Math.max(requiredForce(), availableFriction(), 1);
    const values = {
      speed: `${format(state.speed, 1)} m/s`,
      radius: `${format(state.radius, 0)} m`,
      mu: format(state.mu, 2),
      mass: `${format(state.mass, 0)} kg`,
      "required-force": `${format(requiredForce() / 1000, 2)} kN`,
      "available-force": `${format(availableFriction() / 1000, 2)} kN`,
      state: gripCopy(),
      "grip-state": gripCopy(),
      "maximum-speed": `${format(maximumSpeed(), 2)} m/s · ${format(maximumSpeed() * 3.6, 1)} km/h`,
      "required-mu": `μ = ${format(requiredMu(), 3)}`,
      "lateral-acceleration": `${format(state.speed ** 2 / state.radius, 2)} m/s²`,
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p51-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const setCircleRadius = (selector) => {
      const circle = root.querySelector(selector);
      if (circle) circle.setAttribute("r", shape.trackRadius.toFixed(2));
    };
    setCircleRadius("[data-p51-track-edge]");
    setCircleRadius("[data-p51-track-line]");
    const radiusLine = root.querySelector("[data-p51-radius-line]");
    if (radiusLine) {
      radiusLine.setAttribute("x2", shape.bike.x.toFixed(2));
      radiusLine.setAttribute("y2", shape.bike.y.toFixed(2));
    }
    const radiusLabel = root.querySelector("[data-p51-radius-label]");
    if (radiusLabel) {
      radiusLabel.setAttribute("x", ((TRACK_CENTER.x + shape.bike.x) / 2).toFixed(2));
      radiusLabel.setAttribute("y", ((TRACK_CENTER.y + shape.bike.y) / 2 - 10).toFixed(2));
      radiusLabel.textContent = `r = ${format(state.radius, 0)} m`;
    }
    const bike = root.querySelector("[data-p51-bike]");
    if (bike) {
      bike.setAttribute("transform", `translate(${shape.bike.x.toFixed(2)} ${shape.bike.y.toFixed(2)}) rotate(${shape.bikeRotation})`);
      bike.setAttribute("class", `p51-bike is-${status}`);
    }
    const setLine = (selector, coordinates) => {
      const line = root.querySelector(selector);
      if (!line) return;
      Object.entries(coordinates).forEach(([attribute, value]) => line.setAttribute(attribute, Number(value).toFixed(2)));
    };
    setLine("[data-p51-speed-arrow]", { x1: shape.bike.x, y1: shape.bike.y, x2: shape.velocityEnd.x, y2: shape.velocityEnd.y });
    setLine("[data-p51-force-arrow]", { x1: shape.bike.x, y1: shape.bike.y, x2: shape.forceEnd.x, y2: shape.forceEnd.y });
    const setText = (selector, x, y, text) => {
      const node = root.querySelector(selector);
      if (!node) return;
      node.setAttribute("x", Number(x).toFixed(2));
      node.setAttribute("y", Number(y).toFixed(2));
      node.textContent = text;
    };
    setText("[data-p51-speed-label]", shape.velocityEnd.x + 8, shape.velocityEnd.y + 18, `v = ${format(state.speed, 1)} m/s`);
    setText("[data-p51-force-label]", shape.forceEnd.x - 8, shape.forceEnd.y - 10, `mv²/r = ${format(requiredForce() / 1000, 2)} kN`);
    const slipGroup = root.querySelector("[data-p51-slip-vector]");
    if (slipGroup) {
      slipGroup.setAttribute("opacity", status === "slip" ? "1" : "0");
      const slipLine = slipGroup.querySelector("line");
      if (slipLine) Object.entries({ x1: shape.bike.x, y1: shape.bike.y, x2: shape.slipEnd.x, y2: shape.slipEnd.y }).forEach(([attribute, value]) => slipLine.setAttribute(attribute, Number(value).toFixed(2)));
      const slipLabel = slipGroup.querySelector("text");
      if (slipLabel) {
        slipLabel.setAttribute("x", (shape.slipEnd.x + 8).toFixed(2));
        slipLabel.setAttribute("y", (shape.slipEnd.y - 8).toFixed(2));
      }
    }
    const strip = root.querySelector("[data-p51-force-strip]");
    if (strip) {
      strip.setAttribute("class", `p51-force-strip is-${status}`);
      const bars = strip.querySelectorAll("i");
      bars[0]?.style.setProperty("--p51-size", `${((requiredForce() / largerForce) * 100).toFixed(2)}%`);
      bars[1]?.style.setProperty("--p51-size", `${((availableFriction() / largerForce) * 100).toFixed(2)}%`);
    }
    const stateLabel = root.querySelector(".p51-state-label");
    if (stateLabel) stateLabel.setAttribute("class", `p51-state-label is-${status}`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p51-preset"]').forEach((button) => {
      const active = Number(button.dataset.p51Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p51-apparatus-desc");
    if (description) description.textContent = `A ${format(state.mass, 0)} kilogram bike and rider travel at ${format(state.speed, 1)} metres per second around a flat turn of radius ${format(state.radius, 0)} metres. Required inward force is ${format(requiredForce() / 1000, 2)} kilonewtons and maximum tyre friction is ${format(availableFriction() / 1000, 2)} kilonewtons. ${gripCopy()}.`;
    root.querySelector(".p51-feedback")?.remove();
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
    const root = document.querySelector(".p51-shell");
    if (!root) return;

    root.querySelector("#p51-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p51-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p51Slider;
        if (kind === "speed") state.speed = clamp(event.target.value, 5, 40);
        if (kind === "radius") state.radius = clamp(event.target.value, 15, 120);
        if (kind === "mu") state.mu = clamp(event.target.value, 0.1, 1.2);
        if (kind === "mass") state.mass = clamp(event.target.value, 120, 400);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p51-reset") state = initialState();
        if (action === "p51-preset") {
          const preset = presets[Number(control.dataset.p51Preset)];
          if (preset) {
            state.mass = preset.mass;
            state.speed = preset.speed;
            state.radius = preset.radius;
            state.mu = preset.mu;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p51-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p51-reveal") state.revealed = true;
        rerender();
        if (action === "p51-reveal") window.requestAnimationFrame(() => document.querySelector("#p51-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p51-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p51-answer")?.value || "";
      const estimate = parseSpeed(raw);
      const exact = questionAnswer();
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive speed in metres per second, or include km/h with your value.";
        state.feedbackTone = "warn";
      } else if (estimate > 50 && !/(?:km\/h|kph)$/i.test(raw.trim())) {
        state.feedback = "That looks like kilometres per hour. Add km/h, or convert to metres per second.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.12) {
          state.feedback = "Correct. At about 19.80 m/s, the required inward force exactly reaches μmg.";
          state.feedbackTone = "success";
          state.mass = QUESTION_MASS;
          state.speed = Number(exact.toFixed(1));
          state.radius = QUESTION_RADIUS;
          state.mu = QUESTION_MU;
        } else if (estimate > exact) {
          state.feedback = "That speed requires more inward force than the tyres can supply, so the bike slides wide.";
        } else {
          state.feedback = "That speed is safe, but it is below the maximum. Set mv²/r equal to μmg at the threshold.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p51-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
