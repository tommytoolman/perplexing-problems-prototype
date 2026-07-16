(function registerMonsieurCanardPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "4.4";
  const QUESTION_MASS = 75;
  const QUESTION_SPEED = 12;
  const QUESTION_TIME = 0.6;
  const GRAVITY = 9.8;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p44-reset">Reset</button>';
  const hints = Object.freeze([
    "Take upward as positive. Just before the net acts, the pilot’s velocity is −12 m/s; after stopping it is 0.",
    "His momentum change is Δp = 75[0 − (−12)] = 900 N·s upward.",
    "The average resultant force is Δp/Δt = 900/0.60 = 1500 N upward.",
    "The net’s force is not the resultant force: R − mg = 1500 N. Add the 735 N weight.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question setup", mass: 75, speed: 12, stopTime: 0.6 }),
    Object.freeze({ label: "Soft net", mass: 75, speed: 12, stopTime: 1.5 }),
    Object.freeze({ label: "Abrupt stop", mass: 75, speed: 12, stopTime: 0.15 }),
    Object.freeze({ label: "Same momentum", mass: 50, speed: 18, stopTime: 0.6 }),
  ]);

  const initialState = () => ({
    mass: QUESTION_MASS,
    speed: QUESTION_SPEED,
    stopTime: QUESTION_TIME,
    stopped: false,
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

  function momentumChange(mass = state.mass, speed = state.speed) {
    return mass * speed;
  }

  function resultantForce(mass = state.mass, speed = state.speed, stopTime = state.stopTime) {
    return (mass * speed) / stopTime;
  }

  function supportForce(mass = state.mass, speed = state.speed, stopTime = state.stopTime) {
    return mass * (GRAVITY + speed / stopTime);
  }

  function supportImpulse(mass = state.mass, speed = state.speed, stopTime = state.stopTime) {
    return supportForce(mass, speed, stopTime) * stopTime;
  }

  function gravityImpulse(mass = state.mass, stopTime = state.stopTime) {
    return mass * GRAVITY * stopTime;
  }

  function stoppingDistance(speed = state.speed, stopTime = state.stopTime) {
    return 0.5 * speed * stopTime;
  }

  function loadMultiple(mass = state.mass, speed = state.speed, stopTime = state.stopTime) {
    return supportForce(mass, speed, stopTime) / (mass * GRAVITY);
  }

  function kineticEnergy(mass = state.mass, speed = state.speed) {
    return 0.5 * mass * speed ** 2;
  }

  function questionAnswerKilonewtons() {
    return supportForce(QUESTION_MASS, QUESTION_SPEED, QUESTION_TIME) / 1000;
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.mass - state.mass) < 0.001
      && Math.abs(preset.speed - state.speed) < 0.001
      && Math.abs(preset.stopTime - state.stopTime) < 0.001
    ));
  }

  function forceArrowLength(force) {
    return clamp(36 + force / 31, 36, 124);
  }

  function geometry() {
    const distance = stoppingDistance();
    const sag = state.stopped ? clamp(distance * 12, 8, 64) : 0;
    const pilotY = 245 + sag;
    const netY = 310 + sag;
    const netPath = `M130,310 C210,310 255,${netY.toFixed(2)} 350,${netY.toFixed(2)} C445,${netY.toFixed(2)} 490,310 570,310`;
    const speedLength = clamp(32 + state.speed * 4, 32, 110);
    const supportLength = forceArrowLength(supportForce());
    const weightLength = clamp(32 + (state.mass * GRAVITY) / 25, 32, 92);
    return { distance, sag, pilotY, netY, netPath, speedLength, supportLength, weightLength };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const largestImpulse = Math.max(supportImpulse(), 1);
    return `
      <div class="p44-apparatus-wrap">
        <svg class="p44-apparatus" viewBox="0 0 700 440" role="img" aria-labelledby="p44-apparatus-title p44-apparatus-desc">
          <title id="p44-apparatus-title">Monsieur Canard landing in a safety net</title>
          <desc id="p44-apparatus-desc">A ${format(state.mass, 0)} kilogram pilot reaches a safety net moving downward at ${format(state.speed, 1)} metres per second. The net stops him in ${format(state.stopTime, 2)} seconds, exerting an average upward force of ${format(supportForce() / 1000, 3)} kilonewtons. ${state.stopped ? `The diagram shows the stopped position after moving ${format(shape.distance, 2)} metres.` : "The diagram shows the instant of touchdown."}</desc>
          <defs>
            <marker id="p44-arrow-speed" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p44-arrow-weight" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p44-arrow-support" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <path class="p44-cloud" d="M60 93c8-22 39-23 49-5 17-13 44-2 42 20H57c-10-6-7-12 3-15Zm478 27c9-24 40-24 51-6 18-13 45-2 43 21h-97c-10-6-7-12 3-15Z" />
          <g class="p44-pilot" data-p44-pilot transform="translate(350 ${shape.pilotY.toFixed(2)})">
            <path class="p44-canopy" d="M-87-91Q0-157 87-91Q43-112 0-91Q-43-112-87-91Z" />
            <path class="p44-rigging" d="M-87-91 0 12M87-91 0 12M0-91V12" />
            <path class="p44-scarf" d="M-25-2q-50-15-69 3 30-4 54 22" />
            <ellipse class="p44-body" cx="0" cy="21" rx="37" ry="31" />
            <circle class="p44-head" cx="0" cy="-18" r="27" />
            <path class="p44-beak" d="M20-17h38L27 1Z" />
            <path class="p44-goggles" d="M-24-27h18m12 0h18M-6-27a9 9 0 1 1-18 0 9 9 0 1 1 18 0Zm30 0a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z" />
            <path class="p44-wing" d="M-8 18q35-12 47 5-28 20-53 8" />
            <path class="p44-legs" d="M-13 46v14m26-14v14M-22 60h18M4 60h18" />
          </g>
          <path class="p44-net" data-p44-net d="${shape.netPath}" />
          <path class="p44-net-mesh" data-p44-net-mesh d="M145 310Q350 ${shape.netY.toFixed(2)} 555 310M185 310Q350 ${shape.netY.toFixed(2)} 515 310M230 310Q350 ${shape.netY.toFixed(2)} 470 310" />
          <path class="p44-supports" d="M130 310v78m440-78v78M105 388h50m390 0h50" />
          <line class="p44-speed-arrow" data-p44-speed-arrow x1="560" y1="130" x2="560" y2="${130 + shape.speedLength}" marker-end="url(#p44-arrow-speed)" />
          <text class="p44-force-label is-speed" data-p44-speed-label x="650" y="${145 + shape.speedLength}" text-anchor="end">touchdown v = ${format(state.speed, 1)} m/s down</text>
          <line class="p44-weight-arrow" data-p44-weight-arrow x1="225" y1="${shape.pilotY - 15}" x2="225" y2="${shape.pilotY - 15 + shape.weightLength}" marker-end="url(#p44-arrow-weight)" />
          <text class="p44-force-label is-weight" data-p44-weight-label x="210" y="${shape.pilotY + shape.weightLength + 15}" text-anchor="end">mg = ${format(state.mass * GRAVITY, 0)} N</text>
          <line class="p44-support-arrow" data-p44-support-arrow x1="475" y1="${shape.netY + 8}" x2="475" y2="${shape.netY + 8 - shape.supportLength}" marker-end="url(#p44-arrow-support)" />
          <text class="p44-force-label is-support" data-p44-support-label x="490" y="${shape.netY - shape.supportLength}">R = ${format(supportForce() / 1000, 3)} kN up</text>
          <text class="p44-phase-label" x="350" y="420" text-anchor="middle" data-p44-live="phase">${state.stopped ? `Stopped after ${format(state.stopTime, 2)} s · descended ${format(shape.distance, 2)} m` : "Touchdown · moving downward"}</text>
        </svg>
        <div class="p44-impulse-strip" aria-label="Signed impulse balance">
          <div><span>Impulse from net ↑</span><strong data-p44-live="support-impulse">${format(supportImpulse(), 0)} N·s</strong><i style="--p44-size:${((supportImpulse() / largestImpulse) * 100).toFixed(2)}%"></i></div>
          <b>−</b>
          <div><span>Gravity impulse ↓</span><strong data-p44-live="gravity-impulse">${format(gravityImpulse(), 0)} N·s</strong><i style="--p44-size:${((gravityImpulse() / largestImpulse) * 100).toFixed(2)}%"></i></div>
          <b>=</b>
          <div><span>Momentum change ↑</span><strong data-p44-live="momentum-change">${format(momentumChange(), 0)} N·s</strong><i style="--p44-size:${((momentumChange() / largestImpulse) * 100).toFixed(2)}%"></i></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit, digits = 1) {
    return `
      <label class="p44-range-row" for="p44-${kind}-slider">
        <span><strong>${label}</strong><output data-p44-live="${kind}">${format(value, digits)}${unit}</output></span>
        <input id="p44-${kind}-slider" data-p44-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "stop-time" ? "net yielding time" : kind === "speed" ? "downward at contact" : "pilot + equipment"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p44-controls">
        ${sliderMarkup("mass", "Total mass", 40, 120, 5, state.mass, " kg", 0)}
        ${sliderMarkup("speed", "Touchdown speed", 2, 20, 0.5, state.speed, " m/s")}
        ${sliderMarkup("stop-time", "Stopping time", 0.1, 2, 0.05, state.stopTime, " s", 2)}
        <div class="p44-action-row">
          <button class="secondary-button p44-land-button" type="button" data-problem-action="p44-land">${state.stopped ? "Return to touchdown" : "Run the landing"}</button>
          <span data-p44-live="landing-status" aria-live="polite">${state.stopped ? `${format(stoppingDistance(), 2)} m stopping distance` : "Ready at first contact"}</span>
        </div>
        <div class="p44-presets" aria-label="Landing presets">${presets.map((preset, index) => `<button class="chip-button p44-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p44-preset" data-p44-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    return `
      <div class="p44-metrics" aria-live="polite">
        <div><span>Average force from net · R</span><strong data-p44-live="support-force">${format(supportForce() / 1000, 3)} kN ↑</strong></div>
        <div><span>Stopping distance</span><strong data-p44-live="stopping-distance">${format(stoppingDistance(), 2)} m</strong></div>
        <div><span>Load / body weight</span><strong data-p44-live="load-multiple">${format(loadMultiple(), 2)} ×</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p44-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p44-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p44-solution" aria-labelledby="p44-solution-heading">
        <h3 id="p44-solution-heading" tabindex="-1">Account for both external impulses</h3>
        <p>Take upward as positive. The pilot’s momentum is not conserved because the net and gravity provide external impulses. His velocity changes from −12 m/s to zero:</p>
        <div class="p44-equation">Δp = m(v<sub>f</sub> − v<sub>i</sub>) = 75[0 − (−12)] = 900 N·s ↑</div>
        <p>During the 0.60 s stop, the net force <em>R</em> acts upward while weight acts downward:</p>
        <div class="p44-equation">R(0.60) − (75)(9.8)(0.60) = 900</div>
        <div class="p44-equation">R − 735 = 1500 N</div>
        <div class="p44-equation is-answer">R = 2235 N = 2.235 kN upward</div>
        <p>Equivalently, <em>R = m(g + v/Δt)</em>. The constant-force assumption gives a stopping distance <em>vΔt/2 = 3.6 m</em>. Mechanical energy is not conserved during the landing: the yielding net absorbs the pilot’s kinetic energy plus the gravitational energy released while he moves downward. As Δt tends to zero, the required force diverges; as the touchdown speed tends to zero, <em>R</em> tends to the pilot’s weight <em>mg</em>.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      signConvention: "upward positive",
      massKilograms: state.mass,
      initialVelocityMetresPerSecond: -state.speed,
      finalVelocityMetresPerSecond: 0,
      stopTimeSeconds: state.stopTime,
      gravityMetresPerSecondSquared: GRAVITY,
      momentumChangeNewtonSeconds: Number(momentumChange().toFixed(4)),
      supportImpulseNewtonSeconds: Number(supportImpulse().toFixed(4)),
      gravityImpulseNewtonSeconds: Number(gravityImpulse().toFixed(4)),
      averageResultantForceNewtons: Number(resultantForce().toFixed(4)),
      averageSupportForceNewtons: Number(supportForce().toFixed(4)),
      stoppingDistanceMetresAssumingConstantForce: Number(stoppingDistance().toFixed(4)),
      touchdownKineticEnergyJoules: Number(kineticEnergy().toFixed(4)),
      loadMultipleOfBodyWeight: Number(loadMultiple().toFixed(4)),
      landedSnapshot: state.stopped,
      questionAnswerKilonewtons: questionAnswerKilonewtons(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p44-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive dynamics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p44-spread">
          <article class="book-page p44-problem-page">
            <div class="problem-number">Problem 4.4</div>
            <h1 class="book-title p44-title">The last flight of Monsieur Canard</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">In this reconstruction, Monsieur Canard and his equipment have mass 75 kg. He reaches a safety net moving vertically downward at 12 m/s. The yielding net brings him to rest in 0.60 s.</p>
            <p class="problem-copy">Ignoring air resistance during the stop and taking <em>g = 9.8 m/s²</em>, what average upward force does the net exert?</p>
            <p class="p44-assumption">Assume the net’s force is constant during the stopping interval; there is no rebound.</p>
            <p class="p44-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written impulse-landing model is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Resultant versus contact force</div><p>The momentum change gives the resultant force. The net must produce that resultant while also opposing the pilot’s weight.</p></section>
          </article>

          <section class="book-page book-stage p44-stage" aria-labelledby="p44-stage-title">
            <div class="p44-stage-card">
              <div class="p44-stage-heading"><div><span class="eyebrow">Impulse landing laboratory</span><h2 id="p44-stage-title">Spread the stop over time</h2></div><p>Change the touchdown conditions, then run the landing. The signed impulse balance remains exact.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p44-coach">
            <div class="coach-kicker">Find the net force</div>
            <p class="coach-question">For the 75 kg, 12 m/s, 0.60 s landing, what average force does the net exert?</p>
            <form class="p44-answer-form" data-p44-answer-form novalidate>
              <label for="p44-answer">Average upward force</label>
              <div><input id="p44-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 2.5" /><span>kN</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p44-help-row"><button class="secondary-button" type="button" data-problem-action="p44-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p44-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
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
    const largestImpulse = Math.max(supportImpulse(), 1);
    const values = {
      mass: `${format(state.mass, 0)} kg`,
      speed: `${format(state.speed, 1)} m/s`,
      "stop-time": `${format(state.stopTime, 2)} s`,
      "support-force": `${format(supportForce() / 1000, 3)} kN ↑`,
      "stopping-distance": `${format(stoppingDistance(), 2)} m`,
      "load-multiple": `${format(loadMultiple(), 2)} ×`,
      "support-impulse": `${format(supportImpulse(), 0)} N·s`,
      "gravity-impulse": `${format(gravityImpulse(), 0)} N·s`,
      "momentum-change": `${format(momentumChange(), 0)} N·s`,
      phase: state.stopped ? `Stopped after ${format(state.stopTime, 2)} s · descended ${format(shape.distance, 2)} m` : "Touchdown · moving downward",
      "landing-status": state.stopped ? `${format(stoppingDistance(), 2)} m stopping distance` : "Ready at first contact",
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p44-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const pilot = root.querySelector("[data-p44-pilot]");
    if (pilot) pilot.setAttribute("transform", `translate(350 ${shape.pilotY.toFixed(2)})`);
    const net = root.querySelector("[data-p44-net]");
    if (net) net.setAttribute("d", shape.netPath);
    const mesh = root.querySelector("[data-p44-net-mesh]");
    if (mesh) mesh.setAttribute("d", `M145 310Q350 ${shape.netY.toFixed(2)} 555 310M185 310Q350 ${shape.netY.toFixed(2)} 515 310M230 310Q350 ${shape.netY.toFixed(2)} 470 310`);
    const setLine = (selector, valuesToSet) => {
      const line = root.querySelector(selector);
      if (!line) return;
      Object.entries(valuesToSet).forEach(([attribute, value]) => line.setAttribute(attribute, Number(value).toFixed(2)));
    };
    setLine("[data-p44-speed-arrow]", { x1: 560, y1: 130, x2: 560, y2: 130 + shape.speedLength });
    setLine("[data-p44-weight-arrow]", { x1: 225, y1: shape.pilotY - 15, x2: 225, y2: shape.pilotY - 15 + shape.weightLength });
    setLine("[data-p44-support-arrow]", { x1: 475, y1: shape.netY + 8, x2: 475, y2: shape.netY + 8 - shape.supportLength });
    const setText = (selector, x, y, text) => {
      const node = root.querySelector(selector);
      if (!node) return;
      node.setAttribute("x", Number(x).toFixed(2));
      node.setAttribute("y", Number(y).toFixed(2));
      node.textContent = text;
    };
    setText("[data-p44-speed-label]", 650, 145 + shape.speedLength, `touchdown v = ${format(state.speed, 1)} m/s down`);
    setText("[data-p44-weight-label]", 210, shape.pilotY + shape.weightLength + 15, `mg = ${format(state.mass * GRAVITY, 0)} N`);
    setText("[data-p44-support-label]", 490, shape.netY - shape.supportLength, `R = ${format(supportForce() / 1000, 3)} kN up`);

    const bars = root.querySelectorAll(".p44-impulse-strip i");
    bars[0]?.style.setProperty("--p44-size", `${((supportImpulse() / largestImpulse) * 100).toFixed(2)}%`);
    bars[1]?.style.setProperty("--p44-size", `${((gravityImpulse() / largestImpulse) * 100).toFixed(2)}%`);
    bars[2]?.style.setProperty("--p44-size", `${((momentumChange() / largestImpulse) * 100).toFixed(2)}%`);
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p44-preset"]').forEach((button) => {
      const active = Number(button.dataset.p44Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const description = root.querySelector("#p44-apparatus-desc");
    if (description) description.textContent = `A ${format(state.mass, 0)} kilogram pilot reaches a safety net moving downward at ${format(state.speed, 1)} metres per second. The net stops him in ${format(state.stopTime, 2)} seconds, exerting an average upward force of ${format(supportForce() / 1000, 3)} kilonewtons. ${state.stopped ? `The diagram shows the stopped position after moving ${format(shape.distance, 2)} metres.` : "The diagram shows the instant of touchdown."}`;
    root.querySelector(".p44-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseForceKilonewtons(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/kn$/.test(normalized)) return Number(normalized.replace(/\s*kn$/, ""));
    if (/n$/.test(normalized)) return Number(normalized.replace(/\s*n$/, "")) / 1000;
    const value = Number(normalized);
    return value > 50 ? value / 1000 : value;
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p44-shell");
    if (!root) return;

    root.querySelector("#p44-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p44-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p44Slider;
        if (kind === "mass") state.mass = clamp(event.target.value, 40, 120);
        if (kind === "speed") state.speed = clamp(event.target.value, 2, 20);
        if (kind === "stop-time") state.stopTime = clamp(event.target.value, 0.1, 2);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p44-reset") state = initialState();
        if (action === "p44-land") state.stopped = !state.stopped;
        if (action === "p44-preset") {
          const preset = presets[Number(control.dataset.p44Preset)];
          if (preset) {
            state.mass = preset.mass;
            state.speed = preset.speed;
            state.stopTime = preset.stopTime;
            state.stopped = false;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p44-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p44-reveal") state.revealed = true;
        rerender();
        if (action === "p44-reveal") window.requestAnimationFrame(() => document.querySelector("#p44-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p44-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p44-answer")?.value || "";
      const estimate = parseForceKilonewtons(raw);
      const exact = questionAnswerKilonewtons();
      const resultantKilonewtons = resultantForce(QUESTION_MASS, QUESTION_SPEED, QUESTION_TIME) / 1000;
      const weightKilonewtons = (QUESTION_MASS * GRAVITY) / 1000;
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive average force in kilonewtons.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.02) {
          state.feedback = "Correct. The net supplies the 1.500 kN resultant force and also balances 0.735 kN of weight.";
          state.feedbackTone = "success";
          state.mass = QUESTION_MASS;
          state.speed = QUESTION_SPEED;
          state.stopTime = QUESTION_TIME;
          state.stopped = true;
        } else if (Math.abs(estimate - resultantKilonewtons) <= 0.03) {
          state.feedback = "That is the resultant upward force. Add the 0.735 kN weight to find the force exerted by the net.";
        } else if (Math.abs(estimate - weightKilonewtons) <= 0.03) {
          state.feedback = "That is only the pilot’s weight. The net must also change his downward momentum.";
        } else if (estimate > exact) {
          state.feedback = "That is too large for a 0.60 s stop. Check the momentum change and keep newtons separate from kilonewtons.";
        } else {
          state.feedback = "That is too small. Remember that the net must both decelerate the pilot and oppose gravity.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p44-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
