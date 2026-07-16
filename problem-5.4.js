(function registerDerailedRollerCoasterPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "5.4";
  const QUESTION_SPEED = 14;
  const QUESTION_ANGLE = 30;
  const QUESTION_HEIGHT = 20;
  const GRAVITY = 9.8;
  const GROUND_Y = 365;
  const DEPARTURE_X = 100;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p54-reset">Reset</button>';
  const hints = Object.freeze([
    "Once the normal reaction reaches zero, the car no longer follows the track. Its initial projectile velocity is tangent to the track.",
    "Resolve the 14 m/s tangent velocity: vₓ = 14 cos 30° = 7√3 m/s and vᵧ = 14 sin 30° = 7 m/s.",
    "Taking upward as positive and ground level as y = 0, solve 0 = 20 + 7t − 4.9t² for the positive time.",
    "The positive root is t = 20/7 s. Multiply this by the constant horizontal velocity 7√3 m/s.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question setup", speed: 14, angle: 30, height: 20 }),
    Object.freeze({ label: "Horizontal exit", speed: 14, angle: 0, height: 20 }),
    Object.freeze({ label: "Steep tangent", speed: 14, angle: 50, height: 20 }),
    Object.freeze({ label: "Descending exit", speed: 14, angle: -15, height: 20 }),
  ]);

  const initialState = () => ({
    speed: QUESTION_SPEED,
    angle: QUESTION_ANGLE,
    height: QUESTION_HEIGHT,
    progress: 0,
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

  function degrees(angle) {
    return (angle * 180) / Math.PI;
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

  function horizontalVelocity(speed = state.speed, angle = state.angle) {
    return speed * Math.cos(radians(angle));
  }

  function verticalVelocity(speed = state.speed, angle = state.angle) {
    return speed * Math.sin(radians(angle));
  }

  function flightTime(speed = state.speed, angle = state.angle, height = state.height) {
    const initialVerticalVelocity = verticalVelocity(speed, angle);
    return (initialVerticalVelocity + Math.sqrt(initialVerticalVelocity ** 2 + 2 * GRAVITY * height)) / GRAVITY;
  }

  function landingDistance(speed = state.speed, angle = state.angle, height = state.height) {
    return horizontalVelocity(speed, angle) * flightTime(speed, angle, height);
  }

  function maximumHeight(speed = state.speed, angle = state.angle, height = state.height) {
    const initialVerticalVelocity = verticalVelocity(speed, angle);
    return height + Math.max(initialVerticalVelocity, 0) ** 2 / (2 * GRAVITY);
  }

  function impactVerticalVelocity(speed = state.speed, angle = state.angle, height = state.height) {
    return verticalVelocity(speed, angle) - GRAVITY * flightTime(speed, angle, height);
  }

  function impactSpeed(speed = state.speed, height = state.height) {
    return Math.sqrt(speed ** 2 + 2 * GRAVITY * height);
  }

  function questionAnswer() {
    return landingDistance(QUESTION_SPEED, QUESTION_ANGLE, QUESTION_HEIGHT);
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.speed - state.speed) < 0.001
      && Math.abs(preset.angle - state.angle) < 0.001
      && Math.abs(preset.height - state.height) < 0.001
    ));
  }

  function phaseKey() {
    if (state.progress <= 0) return "departure";
    if (state.progress >= 100) return "landed";
    return "airborne";
  }

  function phaseCopy() {
    const phase = phaseKey();
    if (phase === "departure") return "Contact lost · N = 0";
    if (phase === "landed") return "Ground reached · y = 0";
    return "Projectile flight · gravity only";
  }

  function physicalPosition(time) {
    const x = horizontalVelocity() * time;
    const y = state.height + verticalVelocity() * time - 0.5 * GRAVITY * time ** 2;
    return { x, y: Math.max(0, y) };
  }

  function geometry() {
    const totalTime = flightTime();
    const range = landingDistance();
    const peak = maximumHeight();
    const scale = Math.min(
      22,
      500 / Math.max(range, 10),
      270 / Math.max(peak, 10),
    );
    const departure = { x: DEPARTURE_X, y: GROUND_Y - state.height * scale };
    const tangent = { x: Math.cos(radians(state.angle)), y: -Math.sin(radians(state.angle)) };
    const trackControl = { x: departure.x - tangent.x * 82, y: departure.y - tangent.y * 82 };
    const trackPath = `M20,353 Q${trackControl.x.toFixed(2)},${trackControl.y.toFixed(2)} ${departure.x.toFixed(2)},${departure.y.toFixed(2)}`;
    const samples = Array.from({ length: 49 }, (_, index) => {
      const time = (totalTime * index) / 48;
      const point = physicalPosition(time);
      return { x: departure.x + point.x * scale, y: GROUND_Y - point.y * scale };
    });
    const trajectoryPath = `M${samples.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" L")}`;
    const elapsed = totalTime * state.progress / 100;
    const currentPhysical = physicalPosition(elapsed);
    const current = {
      x: departure.x + currentPhysical.x * scale,
      y: GROUND_Y - currentPhysical.y * scale,
    };
    const currentVerticalVelocity = verticalVelocity() - GRAVITY * elapsed;
    const currentRotation = degrees(Math.atan2(-currentVerticalVelocity, horizontalVelocity()));
    const tangentLength = 78;
    const tangentEnd = {
      x: departure.x + tangent.x * tangentLength,
      y: departure.y + tangent.y * tangentLength,
    };
    const impact = { x: departure.x + range * scale, y: GROUND_Y };
    return {
      totalTime,
      range,
      peak,
      scale,
      departure,
      tangent,
      tangentEnd,
      trackPath,
      trajectoryPath,
      elapsed,
      currentPhysical,
      current,
      currentVerticalVelocity,
      currentRotation,
      impact,
    };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const phase = phaseKey();
    return `
      <div class="p54-apparatus-wrap">
        <svg class="p54-apparatus" viewBox="0 0 700 440" role="img" aria-labelledby="p54-apparatus-title p54-apparatus-desc">
          <title id="p54-apparatus-title">Roller-coaster car leaving a curved crest and following a projectile path</title>
          <desc id="p54-apparatus-desc">The car loses contact ${format(state.height, 0)} metres above ground at ${format(state.speed, 1)} metres per second along a tangent ${format(state.angle, 0)} degrees above horizontal. It lands ${format(shape.range, 2)} metres horizontally from departure after ${format(shape.totalTime, 2)} seconds. ${phaseCopy()}.</desc>
          <defs>
            <marker id="p54-arrow-velocity" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p54-arrow-gravity" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <path class="p54-track" data-p54-track d="${shape.trackPath}" />
          <path class="p54-track-ties" data-p54-track-ties d="${shape.trackPath}" />
          <line class="p54-ground" x1="20" y1="${GROUND_Y}" x2="670" y2="${GROUND_Y}" />
          <path class="p54-ground-fill" d="M20 ${GROUND_Y}H670V430H20Z" />
          <path class="p54-trajectory" data-p54-trajectory d="${shape.trajectoryPath}" />
          <circle class="p54-departure-point" data-p54-departure-point cx="${shape.departure.x}" cy="${shape.departure.y.toFixed(2)}" r="8" />
          <text class="p54-departure-label" data-p54-departure-label x="32" y="${shape.departure.y - 18}">N = 0 · contact ends</text>
          <line class="p54-tangent-arrow" data-p54-tangent-arrow x1="${shape.departure.x}" y1="${shape.departure.y.toFixed(2)}" x2="${shape.tangentEnd.x.toFixed(2)}" y2="${shape.tangentEnd.y.toFixed(2)}" marker-end="url(#p54-arrow-velocity)" />
          <text class="p54-vector-label is-tangent" data-p54-tangent-label x="${(shape.tangentEnd.x + 9).toFixed(2)}" y="${(shape.tangentEnd.y - 8).toFixed(2)}">v₀ = ${format(state.speed, 1)} m/s · ${format(state.angle, 0)}°</text>
          <line class="p54-impact-guide" data-p54-impact-guide x1="${shape.impact.x.toFixed(2)}" y1="${GROUND_Y - 42}" x2="${shape.impact.x.toFixed(2)}" y2="${GROUND_Y}" />
          <circle class="p54-impact-point" data-p54-impact-point cx="${shape.impact.x.toFixed(2)}" cy="${GROUND_Y}" r="7" />
          <text class="p54-impact-label" data-p54-impact-label x="${shape.impact.x.toFixed(2)}" y="${GROUND_Y + 30}" text-anchor="middle">x = ${format(shape.range, 2)} m</text>
          <g class="p54-car is-${phase}" data-p54-car transform="translate(${shape.current.x.toFixed(2)} ${shape.current.y.toFixed(2)}) rotate(${shape.currentRotation.toFixed(2)})">
            <path d="M-25-13h35l16 12v13h-55Z" />
            <path d="M-9-13 1-25h13l11 24" />
            <circle cx="-14" cy="14" r="7" /><circle cx="16" cy="14" r="7" />
          </g>
          <line class="p54-gravity-arrow" data-p54-gravity-arrow x1="${shape.current.x.toFixed(2)}" y1="${(shape.current.y + 8).toFixed(2)}" x2="${shape.current.x.toFixed(2)}" y2="${(shape.current.y + 61).toFixed(2)}" marker-end="url(#p54-arrow-gravity)" />
          <text class="p54-vector-label is-gravity" data-p54-gravity-label x="${(shape.current.x + 10).toFixed(2)}" y="${(shape.current.y + 58).toFixed(2)}">g</text>
          <text class="p54-time-label" x="640" y="52" text-anchor="end" data-p54-live="elapsed">t = ${format(shape.elapsed, 2)} s</text>
          <text class="p54-phase-label is-${phase}" x="640" y="77" text-anchor="end" data-p54-live="phase">${phaseCopy()}</text>
        </svg>
        <div class="p54-model-strip is-${phase}" data-p54-model-strip>
          <div><span>Departure</span><strong>N = 0; velocity tangent</strong></div>
          <div><span>Free flight</span><strong>aₓ = 0; aᵧ = −g</strong></div>
          <div><span>Landing</span><strong data-p54-live="landing-summary">t = ${format(shape.totalTime, 2)} s · x = ${format(shape.range, 2)} m</strong></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit, digits = 1) {
    return `
      <label class="p54-range-row" for="p54-${kind}-slider">
        <span><strong>${label}</strong><output data-p54-live="${kind}">${format(value, digits)}${unit}</output></span>
        <input id="p54-${kind}-slider" data-p54-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "height" ? "above ground" : kind === "angle" ? "track tangent" : "at contact loss"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p54-controls">
        ${sliderMarkup("speed", "Departure speed · v₀", 6, 24, 0.5, state.speed, " m/s")}
        ${sliderMarkup("angle", "Tangent angle · α", -20, 55, 1, state.angle, "°", 0)}
        ${sliderMarkup("height", "Departure height · h", 5, 35, 1, state.height, " m", 0)}
        <label class="p54-range-row p54-flight-row" for="p54-progress-slider">
          <span><strong>Flight position</strong><output data-p54-live="progress">${format(state.progress, 0)}%</output></span>
          <input id="p54-progress-slider" data-p54-slider="progress" type="range" min="0" max="100" step="2" value="${state.progress}" />
          <small><span>departure</span><span data-p54-live="progress-time">t = ${format(geometry().elapsed, 2)} s</span><span>landing</span></small>
        </label>
        <div class="p54-action-row"><button class="secondary-button p54-flight-button" type="button" data-problem-action="p54-flight" data-p54-live="flight-action">${state.progress >= 100 ? "Return to departure" : "Jump to landing"}</button><span data-p54-live="flight-status" aria-live="polite">${phaseCopy()}</span></div>
        <div class="p54-presets" aria-label="Departure presets">${presets.map((preset, index) => `<button class="chip-button p54-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p54-preset" data-p54-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    return `
      <div class="p54-metrics" aria-live="polite">
        <div><span>Time to ground</span><strong data-p54-live="flight-time">${format(flightTime(), 3)} s</strong></div>
        <div><span>Horizontal distance</span><strong data-p54-live="landing-distance">${format(landingDistance(), 2)} m</strong></div>
        <div><span>Impact speed</span><strong data-p54-live="impact-speed">${format(impactSpeed(), 2)} m/s</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p54-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p54-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p54-solution" aria-labelledby="p54-solution-heading">
        <h3 id="p54-solution-heading" tabindex="-1">Switch models at contact loss</h3>
        <p>At <em>N = 0</em>, the constraint from the track ends. The car keeps its instantaneous tangent velocity, then gravity alone changes its vertical component:</p>
        <div class="p54-equation">vₓ = 14 cos 30° = 7√3 m/s; &nbsp; vᵧ = 14 sin 30° = 7 m/s</div>
        <div class="p54-equation">x = (7√3)t; &nbsp; y = 20 + 7t − 4.9t²</div>
        <p>The car reaches the ground when <em>y = 0</em>. Choose the positive root:</p>
        <div class="p54-equation">0 = 20 + 7t − 4.9t², so t = 20/7 s</div>
        <div class="p54-equation is-answer">x = (7√3)(20/7) = 20√3 ≈ 34.64 m</div>
        <p>The other quadratic root is negative and describes an extrapolated pre-departure time, so it is rejected. This model assumes level ground, no air resistance and no further track force after contact loss. Horizontal velocity remains constant; the vertical sign convention is upward positive.</p>
      </section>`;
  }

  function snapshot() {
    const shape = geometry();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      transition: "normal reaction reaches zero; constrained motion ends",
      signConvention: "x forward positive; y upward positive; ground y=0",
      departureSpeedMetresPerSecond: state.speed,
      tangentAngleDegrees: state.angle,
      departureHeightMetres: state.height,
      horizontalVelocityMetresPerSecond: Number(horizontalVelocity().toFixed(4)),
      verticalVelocityMetresPerSecond: Number(verticalVelocity().toFixed(4)),
      flightTimeSeconds: Number(shape.totalTime.toFixed(4)),
      horizontalLandingDistanceMetres: Number(shape.range.toFixed(4)),
      impactVerticalVelocityMetresPerSecond: Number(impactVerticalVelocity().toFixed(4)),
      impactSpeedMetresPerSecond: Number(impactSpeed().toFixed(4)),
      flightProgressPercent: state.progress,
      elapsedSeconds: Number(shape.elapsed.toFixed(4)),
      phase: phaseKey(),
      questionAnswerMetres: Number(questionAnswer().toFixed(6)),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p54-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circular motion</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p54-spread">
          <article class="book-page p54-problem-page">
            <div class="problem-number">Problem 5.4</div>
            <h1 class="book-title p54-title">Derailed roller coaster</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">A roller-coaster car loses contact with a convex crest when the normal reaction falls to zero. At that instant it is 20 m above level ground, moving at 14 m/s along a track tangent 30° above horizontal.</p>
            <p class="problem-copy">Ignoring air resistance, how far horizontally from the departure point does the car strike the ground?</p>
            <p class="p54-assumption">After contact loss the track exerts no force: the car is a projectile under gravity, with <em>g = 9.8 m/s²</em>.</p>
            <p class="p54-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written crest-to-projectile model is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">The instant the model changes</div><p>Before departure the track bends the path. At N = 0, velocity remains tangent but acceleration becomes vertically downward.</p></section>
          </article>

          <section class="book-page book-stage p54-stage" aria-labelledby="p54-stage-title">
            <div class="p54-stage-card">
              <div class="p54-stage-heading"><div><span class="eyebrow">Departure laboratory</span><h2 id="p54-stage-title">Leave the constraint behind</h2></div><p>Change the departure condition and scrub through the flight. The dotted path is recalculated from the tangent velocity.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p54-coach">
            <div class="coach-kicker">Find the landing point</div>
            <p class="coach-question">For the 14 m/s, 30°, 20 m departure, how far away does the car land?</p>
            <form class="p54-answer-form" data-p54-answer-form novalidate>
              <label for="p54-answer">Horizontal distance</label>
              <div><input id="p54-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 35" /><span>m</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p54-help-row"><button class="secondary-button" type="button" data-problem-action="p54-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p54-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
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
    const phase = phaseKey();
    const values = {
      speed: `${format(state.speed, 1)} m/s`,
      angle: `${format(state.angle, 0)}°`,
      height: `${format(state.height, 0)} m`,
      progress: `${format(state.progress, 0)}%`,
      "progress-time": `t = ${format(shape.elapsed, 2)} s`,
      "flight-action": state.progress >= 100 ? "Return to departure" : "Jump to landing",
      "flight-status": phaseCopy(),
      elapsed: `t = ${format(shape.elapsed, 2)} s`,
      phase: phaseCopy(),
      "flight-time": `${format(shape.totalTime, 3)} s`,
      "landing-distance": `${format(shape.range, 2)} m`,
      "impact-speed": `${format(impactSpeed(), 2)} m/s`,
      "landing-summary": `t = ${format(shape.totalTime, 2)} s · x = ${format(shape.range, 2)} m`,
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p54-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const track = root.querySelector("[data-p54-track]");
    if (track) track.setAttribute("d", shape.trackPath);
    const trackTies = root.querySelector("[data-p54-track-ties]");
    if (trackTies) trackTies.setAttribute("d", shape.trackPath);
    const trajectory = root.querySelector("[data-p54-trajectory]");
    if (trajectory) trajectory.setAttribute("d", shape.trajectoryPath);
    const departurePoint = root.querySelector("[data-p54-departure-point]");
    if (departurePoint) departurePoint.setAttribute("cy", shape.departure.y.toFixed(2));
    const departureLabel = root.querySelector("[data-p54-departure-label]");
    if (departureLabel) departureLabel.setAttribute("y", (shape.departure.y - 18).toFixed(2));
    const setLine = (selector, coordinates) => {
      const line = root.querySelector(selector);
      if (!line) return;
      Object.entries(coordinates).forEach(([attribute, value]) => line.setAttribute(attribute, Number(value).toFixed(2)));
    };
    setLine("[data-p54-tangent-arrow]", { x1: shape.departure.x, y1: shape.departure.y, x2: shape.tangentEnd.x, y2: shape.tangentEnd.y });
    setLine("[data-p54-impact-guide]", { x1: shape.impact.x, y1: GROUND_Y - 42, x2: shape.impact.x, y2: GROUND_Y });
    setLine("[data-p54-gravity-arrow]", { x1: shape.current.x, y1: shape.current.y + 8, x2: shape.current.x, y2: shape.current.y + 61 });
    const setText = (selector, x, y, text) => {
      const node = root.querySelector(selector);
      if (!node) return;
      node.setAttribute("x", Number(x).toFixed(2));
      node.setAttribute("y", Number(y).toFixed(2));
      node.textContent = text;
    };
    setText("[data-p54-tangent-label]", shape.tangentEnd.x + 9, shape.tangentEnd.y - 8, `v₀ = ${format(state.speed, 1)} m/s · ${format(state.angle, 0)}°`);
    const impactPoint = root.querySelector("[data-p54-impact-point]");
    if (impactPoint) impactPoint.setAttribute("cx", shape.impact.x.toFixed(2));
    setText("[data-p54-impact-label]", shape.impact.x, GROUND_Y + 30, `x = ${format(shape.range, 2)} m`);
    const car = root.querySelector("[data-p54-car]");
    if (car) {
      car.setAttribute("transform", `translate(${shape.current.x.toFixed(2)} ${shape.current.y.toFixed(2)}) rotate(${shape.currentRotation.toFixed(2)})`);
      car.setAttribute("class", `p54-car is-${phase}`);
    }
    setText("[data-p54-gravity-label]", shape.current.x + 10, shape.current.y + 58, "g");
    const phaseLabel = root.querySelector(".p54-phase-label");
    if (phaseLabel) phaseLabel.setAttribute("class", `p54-phase-label is-${phase}`);
    const strip = root.querySelector("[data-p54-model-strip]");
    if (strip) strip.setAttribute("class", `p54-model-strip is-${phase}`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p54-preset"]').forEach((button) => {
      const active = Number(button.dataset.p54Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p54-apparatus-desc");
    if (description) description.textContent = `The car loses contact ${format(state.height, 0)} metres above ground at ${format(state.speed, 1)} metres per second along a tangent ${format(state.angle, 0)} degrees above horizontal. It lands ${format(shape.range, 2)} metres horizontally from departure after ${format(shape.totalTime, 2)} seconds. ${phaseCopy()}.`;
    root.querySelector(".p54-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseDistance(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/km$/.test(normalized)) return Number(normalized.replace(/\s*km$/, "")) * 1000;
    if (/m$/.test(normalized)) return Number(normalized.replace(/\s*m$/, ""));
    return Number(normalized);
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p54-shell");
    if (!root) return;

    root.querySelector("#p54-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p54-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p54Slider;
        if (kind === "speed") state.speed = clamp(event.target.value, 6, 24);
        if (kind === "angle") state.angle = clamp(event.target.value, -20, 55);
        if (kind === "height") state.height = clamp(event.target.value, 5, 35);
        if (kind === "progress") state.progress = clamp(event.target.value, 0, 100);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p54-reset") state = initialState();
        if (action === "p54-flight") state.progress = state.progress >= 100 ? 0 : 100;
        if (action === "p54-preset") {
          const preset = presets[Number(control.dataset.p54Preset)];
          if (preset) {
            state.speed = preset.speed;
            state.angle = preset.angle;
            state.height = preset.height;
            state.progress = 0;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p54-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p54-reveal") state.revealed = true;
        rerender();
        if (action === "p54-reveal") window.requestAnimationFrame(() => document.querySelector("#p54-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p54-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p54-answer")?.value || "";
      const estimate = parseDistance(raw);
      const exact = questionAnswer();
      const exactTime = flightTime(QUESTION_SPEED, QUESTION_ANGLE, QUESTION_HEIGHT);
      const exactHorizontalVelocity = horizontalVelocity(QUESTION_SPEED, QUESTION_ANGLE);
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive horizontal distance in metres.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.15) {
          state.feedback = "Correct. The car is airborne for 20/7 s and travels 20√3 ≈ 34.64 m horizontally.";
          state.feedbackTone = "success";
          state.speed = QUESTION_SPEED;
          state.angle = QUESTION_ANGLE;
          state.height = QUESTION_HEIGHT;
          state.progress = 100;
        } else if (Math.abs(estimate - exactTime) <= 0.08) {
          state.feedback = "That is the flight time in seconds. Multiply it by the constant horizontal velocity.";
        } else if (Math.abs(estimate - exactHorizontalVelocity) <= 0.12) {
          state.feedback = "That is the horizontal velocity in m/s. Multiply it by the time to reach the ground.";
        } else if (estimate > exact) {
          state.feedback = "That is too far. Use the positive root of the vertical equation, then apply x = vₓt.";
        } else {
          state.feedback = "That is too short. The car initially travels upward, so its time aloft exceeds a horizontal launch from the same height.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p54-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
