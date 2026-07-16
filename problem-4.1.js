(function registerPulleysPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "4.1";
  const QUESTION_MASS_1 = 3;
  const QUESTION_MASS_2 = 5;
  const EARTH_GRAVITY = 9.8;
  const RELEASE_TIME = 1;
  const MOTION_SCALE = 28;
  const PULLEY = Object.freeze({ x: 350, y: 105, radius: 55 });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p41-reset">Reset</button>';
  const hints = Object.freeze([
    "Choose the downward direction of the 5 kg mass as positive. Both masses have the same acceleration magnitude because the rope is inextensible.",
    "For the 5 kg mass, 5g − T = 5a. For the 3 kg mass, T − 3g = 3a.",
    "Add the two equations. The tension cancels, leaving (5 − 3)g = (5 + 3)a.",
    "So a = 2g/8. With g = 9.8 m/s², the acceleration is 2.45 m/s².",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question setup", mass1: 3, mass2: 5, gravity: 9.8 }),
    Object.freeze({ label: "Equal masses", mass1: 4, mass2: 4, gravity: 9.8 }),
    Object.freeze({ label: "Same ratio ×2", mass1: 6, mass2: 10, gravity: 9.8 }),
    Object.freeze({ label: "On the Moon", mass1: 3, mass2: 5, gravity: 1.6 }),
  ]);

  const initialState = () => ({
    mass1: QUESTION_MASS_1,
    mass2: QUESTION_MASS_2,
    gravity: EARTH_GRAVITY,
    released: false,
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

  function signedAcceleration(mass1 = state.mass1, mass2 = state.mass2, gravity = state.gravity) {
    return ((mass2 - mass1) * gravity) / (mass1 + mass2);
  }

  function tension(mass1 = state.mass1, mass2 = state.mass2, gravity = state.gravity) {
    return (2 * mass1 * mass2 * gravity) / (mass1 + mass2);
  }

  function driveForce(mass1 = state.mass1, mass2 = state.mass2, gravity = state.gravity) {
    return (mass2 - mass1) * gravity;
  }

  function weight(mass, gravity = state.gravity) {
    return mass * gravity;
  }

  function questionAnswer() {
    return Math.abs(signedAcceleration(QUESTION_MASS_1, QUESTION_MASS_2, EARTH_GRAVITY));
  }

  function directionKey() {
    const acceleration = signedAcceleration();
    if (Math.abs(acceleration) < 0.001) return "balanced";
    return acceleration > 0 ? "mass2-down" : "mass1-down";
  }

  function directionCopy() {
    const direction = directionKey();
    if (direction === "balanced") return "Balanced · no acceleration";
    if (direction === "mass2-down") return "m₂ descends · m₁ rises";
    return "m₁ descends · m₂ rises";
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.mass1 - state.mass1) < 0.001
      && Math.abs(preset.mass2 - state.mass2) < 0.001
      && Math.abs(preset.gravity - state.gravity) < 0.001
    ));
  }

  function massSize(mass) {
    return 50 + 2.6 * mass;
  }

  function forceArrowLength(force) {
    return clamp(22 + 0.32 * force, 22, 70);
  }

  function geometry() {
    const acceleration = signedAcceleration();
    const displacement = state.released
      ? clamp(0.5 * acceleration * RELEASE_TIME ** 2 * MOTION_SCALE, -48, 48)
      : 0;
    const mass1Size = massSize(state.mass1);
    const mass2Size = massSize(state.mass2);
    const mass1 = { x: PULLEY.x - PULLEY.radius, y: 250 - displacement, size: mass1Size };
    const mass2 = { x: PULLEY.x + PULLEY.radius, y: 250 + displacement, size: mass2Size };
    const rope = `M${mass1.x},${(mass1.y - mass1.size / 2).toFixed(2)} L${mass1.x},${PULLEY.y} A${PULLEY.radius},${PULLEY.radius} 0 0 1 ${mass2.x},${PULLEY.y} L${mass2.x},${(mass2.y - mass2.size / 2).toFixed(2)}`;
    const mass1WeightLength = forceArrowLength(weight(state.mass1));
    const mass2WeightLength = forceArrowLength(weight(state.mass2));
    const tensionLength = forceArrowLength(tension());
    const accelerationLength = clamp(22 + Math.abs(acceleration) * 12, 22, 68);
    const accelerationVisible = Math.abs(acceleration) >= 0.001;
    const mass1Direction = acceleration > 0 ? -1 : 1;
    const mass2Direction = acceleration > 0 ? 1 : -1;
    return {
      acceleration,
      displacementMetres: state.released ? Math.abs(0.5 * acceleration * RELEASE_TIME ** 2) : 0,
      mass1,
      mass2,
      rope,
      mass1WeightLength,
      mass2WeightLength,
      tensionLength,
      accelerationLength,
      accelerationVisible,
      mass1Direction,
      mass2Direction,
    };
  }

  function forceLine(x, y, length, direction) {
    return { x1: x, y1: y, x2: x, y2: y + length * direction };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const m1Weight = forceLine(shape.mass1.x - shape.mass1.size / 2 - 22, shape.mass1.y - 8, shape.mass1WeightLength, 1);
    const m2Weight = forceLine(shape.mass2.x + shape.mass2.size / 2 + 22, shape.mass2.y - 8, shape.mass2WeightLength, 1);
    const m1Tension = forceLine(shape.mass1.x + shape.mass1.size / 2 + 18, shape.mass1.y + 10, shape.tensionLength, -1);
    const m2Tension = forceLine(shape.mass2.x - shape.mass2.size / 2 - 18, shape.mass2.y + 10, shape.tensionLength, -1);
    const m1Acceleration = forceLine(165, shape.mass1.y, shape.accelerationLength, shape.mass1Direction);
    const m2Acceleration = forceLine(535, shape.mass2.y, shape.accelerationLength, shape.mass2Direction);
    return `
      <div class="p41-apparatus-wrap">
        <svg class="p41-apparatus" viewBox="0 0 700 430" role="img" aria-labelledby="p41-apparatus-title p41-apparatus-desc">
          <title id="p41-apparatus-title">Two masses connected over an ideal pulley</title>
          <desc id="p41-apparatus-desc">Mass one is ${format(state.mass1, 1)} kilograms and mass two is ${format(state.mass2, 1)} kilograms in gravitational field ${format(state.gravity, 1)} metres per second squared. ${directionCopy()}. Acceleration magnitude ${format(Math.abs(shape.acceleration), 2)} metres per second squared and rope tension ${format(tension(), 2)} newtons.</desc>
          <defs>
            <marker id="p41-arrow-weight" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p41-arrow-tension" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p41-arrow-acceleration" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <path class="p41-support" d="M350 22v28M310 61h80L350 31Z" />
          <circle class="p41-pulley" cx="${PULLEY.x}" cy="${PULLEY.y}" r="${PULLEY.radius}" />
          <circle class="p41-hub" cx="${PULLEY.x}" cy="${PULLEY.y}" r="11" />
          <path class="p41-spokes" d="M350 60v90M305 105h90M318 73l64 64M382 73l-64 64" />
          <path class="p41-rope" data-p41-rope d="${shape.rope}" />
          <g class="p41-mass p41-mass-one" data-p41-mass="1">
            <rect data-p41-block="1" x="${(shape.mass1.x - shape.mass1.size / 2).toFixed(2)}" y="${(shape.mass1.y - shape.mass1.size / 2).toFixed(2)}" width="${shape.mass1.size.toFixed(2)}" height="${shape.mass1.size.toFixed(2)}" rx="7" />
            <text data-p41-mass-label="1" x="${shape.mass1.x}" y="${shape.mass1.y + 5}" text-anchor="middle">m₁ · ${format(state.mass1, 1)} kg</text>
          </g>
          <g class="p41-mass p41-mass-two" data-p41-mass="2">
            <rect data-p41-block="2" x="${(shape.mass2.x - shape.mass2.size / 2).toFixed(2)}" y="${(shape.mass2.y - shape.mass2.size / 2).toFixed(2)}" width="${shape.mass2.size.toFixed(2)}" height="${shape.mass2.size.toFixed(2)}" rx="7" />
            <text data-p41-mass-label="2" x="${shape.mass2.x}" y="${shape.mass2.y + 5}" text-anchor="middle">m₂ · ${format(state.mass2, 1)} kg</text>
          </g>
          <line class="p41-force is-weight" data-p41-force="m1-weight" x1="${m1Weight.x1}" y1="${m1Weight.y1}" x2="${m1Weight.x2}" y2="${m1Weight.y2}" marker-end="url(#p41-arrow-weight)" />
          <text class="p41-force-label is-weight" data-p41-force-label="m1-weight" x="${m1Weight.x2 - 8}" y="${m1Weight.y2 + 15}" text-anchor="end">m₁g · ${format(weight(state.mass1), 1)} N</text>
          <line class="p41-force is-weight" data-p41-force="m2-weight" x1="${m2Weight.x1}" y1="${m2Weight.y1}" x2="${m2Weight.x2}" y2="${m2Weight.y2}" marker-end="url(#p41-arrow-weight)" />
          <text class="p41-force-label is-weight" data-p41-force-label="m2-weight" x="${m2Weight.x2 + 8}" y="${m2Weight.y2 + 15}">m₂g · ${format(weight(state.mass2), 1)} N</text>
          <line class="p41-force is-tension" data-p41-force="m1-tension" x1="${m1Tension.x1}" y1="${m1Tension.y1}" x2="${m1Tension.x2}" y2="${m1Tension.y2}" marker-end="url(#p41-arrow-tension)" />
          <text class="p41-force-label is-tension" data-p41-force-label="m1-tension" x="${m1Tension.x2 + 8}" y="${m1Tension.y2 - 6}">T</text>
          <line class="p41-force is-tension" data-p41-force="m2-tension" x1="${m2Tension.x1}" y1="${m2Tension.y1}" x2="${m2Tension.x2}" y2="${m2Tension.y2}" marker-end="url(#p41-arrow-tension)" />
          <text class="p41-force-label is-tension" data-p41-force-label="m2-tension" x="${m2Tension.x2 - 8}" y="${m2Tension.y2 - 6}" text-anchor="end">T</text>
          <g class="p41-acceleration" data-p41-acceleration="1" opacity="${shape.accelerationVisible ? 1 : 0}">
            <line x1="${m1Acceleration.x1}" y1="${m1Acceleration.y1}" x2="${m1Acceleration.x2}" y2="${m1Acceleration.y2}" marker-end="url(#p41-arrow-acceleration)" />
            <text x="${m1Acceleration.x2 - 8}" y="${m1Acceleration.y2 + (shape.mass1Direction > 0 ? 19 : -9)}" text-anchor="end">a</text>
          </g>
          <g class="p41-acceleration" data-p41-acceleration="2" opacity="${shape.accelerationVisible ? 1 : 0}">
            <line x1="${m2Acceleration.x1}" y1="${m2Acceleration.y1}" x2="${m2Acceleration.x2}" y2="${m2Acceleration.y2}" marker-end="url(#p41-arrow-acceleration)" />
            <text x="${m2Acceleration.x2 + 8}" y="${m2Acceleration.y2 + (shape.mass2Direction > 0 ? 19 : -9)}">a</text>
          </g>
          <line class="p41-floor" x1="85" y1="390" x2="615" y2="390" />
          <text class="p41-snapshot-label" x="350" y="414" text-anchor="middle" data-p41-live="snapshot">${state.released ? `Position after ${RELEASE_TIME.toFixed(1)} s · each mass moved ${format(shape.displacementMetres, 2)} m` : "Held at rest · release to see a 1.0 s motion snapshot"}</text>
        </svg>
        <div class="p41-dynamics-strip is-${directionKey()}" data-p41-dynamics-strip>
          <div><span>Driving force</span><strong data-p41-live="drive-force">${format(Math.abs(driveForce()), 1)} N</strong></div>
          <div class="p41-dynamics-state"><span>Direction</span><strong data-p41-live="direction">${directionCopy()}</strong></div>
          <div><span>Total inertia</span><strong data-p41-live="total-mass">${format(state.mass1 + state.mass2, 1)} kg</strong></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit) {
    return `
      <label class="p41-range-row" for="p41-${kind}-slider">
        <span><strong>${label}</strong><output data-p41-live="${kind}">${format(value, 1)}${unit}</output></span>
        <input id="p41-${kind}-slider" data-p41-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "gravity" ? "field strength" : "hanging mass"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p41-controls">
        ${sliderMarkup("mass1", "Left mass · m₁", 0.5, 10, 0.5, state.mass1, " kg")}
        ${sliderMarkup("mass2", "Right mass · m₂", 0.5, 10, 0.5, state.mass2, " kg")}
        ${sliderMarkup("gravity", "Gravity · g", 1, 15, 0.1, state.gravity, " m/s²")}
        <div class="p41-action-row">
          <button class="secondary-button p41-release-button" type="button" data-problem-action="p41-release">${state.released ? "Return to start" : "Release for 1.0 s"}</button>
          <span data-p41-live="release-status" aria-live="polite">${state.released ? `Moved ${format(geometry().displacementMetres, 2)} m each` : "Starts from rest"}</span>
        </div>
        <div class="p41-presets" aria-label="Pulley presets">${presets.map((preset, index) => `<button class="chip-button p41-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p41-preset" data-p41-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    return `
      <div class="p41-metrics" aria-live="polite">
        <div><span>Acceleration magnitude</span><strong data-p41-live="acceleration">${format(Math.abs(signedAcceleration()), 2)} m/s²</strong></div>
        <div><span>Rope tension</span><strong data-p41-live="tension">${format(tension(), 2)} N</strong></div>
        <div><span>Weight difference</span><strong data-p41-live="weight-difference">${format(Math.abs(driveForce()), 1)} N</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p41-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p41-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p41-solution" aria-labelledby="p41-solution-heading">
        <h3 id="p41-solution-heading" tabindex="-1">The unequal weights accelerate both masses</h3>
        <p>Take the 5 kg mass moving down and the 3 kg mass moving up. Apply Newton’s second law to each mass:</p>
        <div class="p41-equation">5g − T = 5a</div>
        <div class="p41-equation">T − 3g = 3a</div>
        <p>Adding eliminates the internal rope tension:</p>
        <div class="p41-equation">(5 − 3)g = (5 + 3)a</div>
        <div class="p41-equation is-answer">a = 2(9.8) / 8 = 2.45 m/s²</div>
        <p>Substitution gives <em>T = 36.75 N</em>. In general, <em>a = (m₂ − m₁)g / (m₁ + m₂)</em> and <em>T = 2m₁m₂g / (m₁ + m₂)</em>. Equal masses give zero acceleration; if either mass tends to zero, the acceleration magnitude tends to <em>g</em> and the tension tends to zero.</p>
      </section>`;
  }

  function snapshot() {
    const shape = geometry();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      mass1Kilograms: state.mass1,
      mass2Kilograms: state.mass2,
      gravityMetresPerSecondSquared: state.gravity,
      accelerationMetresPerSecondSquaredSignedForMass2Down: Number(signedAcceleration().toFixed(4)),
      tensionNewtons: Number(tension().toFixed(4)),
      drivingForceNewtonsSignedForMass2Down: Number(driveForce().toFixed(4)),
      direction: directionKey(),
      releasedForSeconds: state.released ? RELEASE_TIME : 0,
      displacementMetres: Number(shape.displacementMetres.toFixed(4)),
      questionAnswerMetresPerSecondSquared: questionAnswer(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p41-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive dynamics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p41-spread">
          <article class="book-page p41-problem-page">
            <div class="problem-number">Problem 4.1</div>
            <h1 class="book-title p41-title">Pulleys</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="problem-copy">Two masses, 3 kg and 5 kg, hang from a light inextensible rope over a smooth, massless pulley. They are released from rest in Earth gravity, with <em>g = 9.8 m/s²</em>.</p>
            <p class="problem-copy">What is the magnitude of their acceleration?</p>
            <p class="p41-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written Atwood-machine model is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Dynamics, not leverage</div><p>The difference between the two weights supplies the net driving force, but both masses must accelerate. Try doubling both masses without changing their ratio.</p></section>
          </article>

          <section class="book-page book-stage p41-stage" aria-labelledby="p41-stage-title">
            <div class="p41-stage-card">
              <div class="p41-stage-heading"><div><span class="eyebrow">Atwood-machine laboratory</span><h2 id="p41-stage-title">Change the force and inertia</h2></div><p>Adjust either mass or gravity. Force arrows, acceleration, tension and the one-second motion snapshot update together.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p41-coach">
            <div class="coach-kicker">Find the acceleration</div>
            <p class="coach-question">For the 3 kg and 5 kg masses on Earth, what is their acceleration magnitude?</p>
            <form class="p41-answer-form" data-p41-answer-form novalidate>
              <label for="p41-answer">Acceleration</label>
              <div><input id="p41-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 3" /><span>m/s²</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p41-help-row"><button class="secondary-button" type="button" data-problem-action="p41-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p41-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
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
    const values = {
      mass1: `${format(state.mass1, 1)} kg`,
      mass2: `${format(state.mass2, 1)} kg`,
      gravity: `${format(state.gravity, 1)} m/s²`,
      acceleration: `${format(Math.abs(shape.acceleration), 2)} m/s²`,
      tension: `${format(tension(), 2)} N`,
      "weight-difference": `${format(Math.abs(driveForce()), 1)} N`,
      "drive-force": `${format(Math.abs(driveForce()), 1)} N`,
      "total-mass": `${format(state.mass1 + state.mass2, 1)} kg`,
      direction: directionCopy(),
      snapshot: state.released ? `Position after ${RELEASE_TIME.toFixed(1)} s · each mass moved ${format(shape.displacementMetres, 2)} m` : "Held at rest · release to see a 1.0 s motion snapshot",
      "release-status": state.released ? `Moved ${format(shape.displacementMetres, 2)} m each` : "Starts from rest",
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p41-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const rope = root.querySelector("[data-p41-rope]");
    if (rope) rope.setAttribute("d", shape.rope);
    const setRect = (index, mass) => {
      const rectangle = root.querySelector(`[data-p41-block="${index}"]`);
      if (!rectangle) return;
      rectangle.setAttribute("x", (mass.x - mass.size / 2).toFixed(2));
      rectangle.setAttribute("y", (mass.y - mass.size / 2).toFixed(2));
      rectangle.setAttribute("width", mass.size.toFixed(2));
      rectangle.setAttribute("height", mass.size.toFixed(2));
    };
    setRect("1", shape.mass1);
    setRect("2", shape.mass2);
    const setText = (selector, x, y, text) => {
      const node = root.querySelector(selector);
      if (!node) return;
      node.setAttribute("x", Number(x).toFixed(2));
      node.setAttribute("y", Number(y).toFixed(2));
      if (text !== undefined) node.textContent = text;
    };
    setText('[data-p41-mass-label="1"]', shape.mass1.x, shape.mass1.y + 5, `m₁ · ${format(state.mass1, 1)} kg`);
    setText('[data-p41-mass-label="2"]', shape.mass2.x, shape.mass2.y + 5, `m₂ · ${format(state.mass2, 1)} kg`);

    const lines = {
      "m1-weight": forceLine(shape.mass1.x - shape.mass1.size / 2 - 22, shape.mass1.y - 8, shape.mass1WeightLength, 1),
      "m2-weight": forceLine(shape.mass2.x + shape.mass2.size / 2 + 22, shape.mass2.y - 8, shape.mass2WeightLength, 1),
      "m1-tension": forceLine(shape.mass1.x + shape.mass1.size / 2 + 18, shape.mass1.y + 10, shape.tensionLength, -1),
      "m2-tension": forceLine(shape.mass2.x - shape.mass2.size / 2 - 18, shape.mass2.y + 10, shape.tensionLength, -1),
    };
    Object.entries(lines).forEach(([key, line]) => {
      const node = root.querySelector(`[data-p41-force="${key}"]`);
      if (!node) return;
      Object.entries(line).forEach(([attribute, value]) => node.setAttribute(attribute, Number(value).toFixed(2)));
    });
    setText('[data-p41-force-label="m1-weight"]', lines["m1-weight"].x2 - 8, lines["m1-weight"].y2 + 15, `m₁g · ${format(weight(state.mass1), 1)} N`);
    setText('[data-p41-force-label="m2-weight"]', lines["m2-weight"].x2 + 8, lines["m2-weight"].y2 + 15, `m₂g · ${format(weight(state.mass2), 1)} N`);
    setText('[data-p41-force-label="m1-tension"]', lines["m1-tension"].x2 + 8, lines["m1-tension"].y2 - 6, "T");
    setText('[data-p41-force-label="m2-tension"]', lines["m2-tension"].x2 - 8, lines["m2-tension"].y2 - 6, "T");

    const accelerationLines = [
      { index: "1", ...forceLine(165, shape.mass1.y, shape.accelerationLength, shape.mass1Direction), direction: shape.mass1Direction },
      { index: "2", ...forceLine(535, shape.mass2.y, shape.accelerationLength, shape.mass2Direction), direction: shape.mass2Direction },
    ];
    accelerationLines.forEach((line) => {
      const group = root.querySelector(`[data-p41-acceleration="${line.index}"]`);
      if (!group) return;
      group.setAttribute("opacity", shape.accelerationVisible ? "1" : "0");
      const arrow = group.querySelector("line");
      if (arrow) Object.entries({ x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 }).forEach(([attribute, value]) => arrow.setAttribute(attribute, Number(value).toFixed(2)));
      const label = group.querySelector("text");
      if (label) {
        label.setAttribute("x", (line.x2 + (line.index === "1" ? -8 : 8)).toFixed(2));
        label.setAttribute("y", (line.y2 + (line.direction > 0 ? 19 : -9)).toFixed(2));
      }
    });

    const strip = root.querySelector("[data-p41-dynamics-strip]");
    if (strip) strip.setAttribute("class", `p41-dynamics-strip is-${directionKey()}`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p41-preset"]').forEach((button) => {
      const active = Number(button.dataset.p41Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p41-apparatus-desc");
    if (description) description.textContent = `Mass one is ${format(state.mass1, 1)} kilograms and mass two is ${format(state.mass2, 1)} kilograms in gravitational field ${format(state.gravity, 1)} metres per second squared. ${directionCopy()}. Acceleration magnitude ${format(Math.abs(shape.acceleration), 2)} metres per second squared and rope tension ${format(tension(), 2)} newtons.`;
    root.querySelector(".p41-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseAcceleration(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".").replace(/\s*m\/?s(?:\^?2|²)$/, "");
    return normalized ? Number(normalized) : NaN;
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p41-shell");
    if (!root) return;

    root.querySelector("#p41-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p41-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p41Slider;
        if (kind === "mass1") state.mass1 = clamp(event.target.value, 0.5, 10);
        if (kind === "mass2") state.mass2 = clamp(event.target.value, 0.5, 10);
        if (kind === "gravity") state.gravity = clamp(event.target.value, 1, 15);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p41-reset") state = initialState();
        if (action === "p41-release") state.released = !state.released;
        if (action === "p41-preset") {
          const preset = presets[Number(control.dataset.p41Preset)];
          if (preset) {
            state.mass1 = preset.mass1;
            state.mass2 = preset.mass2;
            state.gravity = preset.gravity;
            state.released = false;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p41-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p41-reveal") state.revealed = true;
        rerender();
        if (action === "p41-reveal") window.requestAnimationFrame(() => document.querySelector("#p41-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p41-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p41-answer")?.value || "";
      const estimate = parseAcceleration(raw);
      const exact = questionAnswer();
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive acceleration magnitude in metres per second squared.";
        state.feedbackTone = "warn";
      } else if (estimate > EARTH_GRAVITY) {
        state.feedback = "For this ideal two-mass system, the acceleration must be less than g = 9.8 m/s².";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.05) {
          state.feedback = "Correct. The 19.6 N weight difference accelerates all 8 kg at 2.45 m/s².";
          state.feedbackTone = "success";
          state.mass1 = QUESTION_MASS_1;
          state.mass2 = QUESTION_MASS_2;
          state.gravity = EARTH_GRAVITY;
          state.released = true;
        } else if (estimate > exact) {
          state.feedback = "Too large. The weight difference drives the motion, but both masses contribute inertia.";
        } else {
          state.feedback = "Too small. Subtract the weights, then divide that net force by the combined mass.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p41-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
