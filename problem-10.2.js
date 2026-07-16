(function registerLowestEnergyOrbitPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.2";
  const MAX_ALTITUDE_KM = 30000;
  const QUESTION = Object.freeze({ gravitationalParameter: 400000, radius: 6000, clearance: 500 });
  const bodies = Object.freeze([
    Object.freeze({ label: "Training planet", short: "Training", gravitationalParameter: 400000, radius: 6000, clearance: 500, altitude: 2000 }),
    Object.freeze({ label: "Earth model", short: "Earth", gravitationalParameter: 398600, radius: 6371, clearance: 200, altitude: 1000 }),
    Object.freeze({ label: "Moon model", short: "Moon", gravitationalParameter: 4902.8, radius: 1737.4, clearance: 50, altitude: 500 }),
    Object.freeze({ label: "Mars model", short: "Mars", gravitationalParameter: 42828, radius: 3389.5, clearance: 150, altitude: 1000 }),
  ]);
  const hints = Object.freeze([
    "For a circular orbit, gravity supplies the centripetal acceleration: v²/r=μ/r², so v²=μ/r.",
    "Specific kinetic energy is μ/(2r) and specific gravitational potential energy is −μ/r.",
    "Therefore ε=−μ/(2r). Its derivative μ/(2r²) is positive, so energy increases towards zero as radius increases.",
    "The smallest allowed radius is 6000 km+500 km=6500 km. Substitute this radius, not the body’s surface radius.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p102-reset">Reset</button>';

  const initialState = () => ({
    bodyIndex: 0,
    gravitationalParameter: bodies[0].gravitationalParameter,
    bodyRadius: bodies[0].radius,
    minimumClearance: bodies[0].clearance,
    candidateAltitude: bodies[0].altitude,
    answer: "",
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

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value.toFixed(digits));
    return Object.is(rounded, -0) ? "0" : String(rounded);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function circularOrbit(radiusKm, gravitationalParameter = state.gravitationalParameter) {
    const radius = Math.max(Number(radiusKm), 1e-12);
    const speed = Math.sqrt(gravitationalParameter / radius);
    const kinetic = speed ** 2 / 2;
    const potential = -gravitationalParameter / radius;
    return {
      radius,
      speed,
      kinetic,
      potential,
      energy: kinetic + potential,
      closedFormEnergy: -gravitationalParameter / (2 * radius),
      periodSeconds: 2 * Math.PI * Math.sqrt(radius ** 3 / gravitationalParameter),
    };
  }

  function orbitValues() {
    const minimumRadius = state.bodyRadius + state.minimumClearance;
    const candidateRadius = state.bodyRadius + state.candidateAltitude;
    const minimum = circularOrbit(minimumRadius);
    const candidate = circularOrbit(candidateRadius);
    return {
      minimumRadius,
      candidateRadius,
      minimum,
      candidate,
      allowed: candidateRadius >= minimumRadius - 1e-10,
      energyAboveMinimum: candidate.energy - minimum.energy,
      energyDerivative: state.gravitationalParameter / (2 * candidateRadius ** 2),
    };
  }

  function questionAnswer() {
    return -QUESTION.gravitationalParameter / (2 * (QUESTION.radius + QUESTION.clearance));
  }

  function activeBodyIndex() {
    return bodies.findIndex((body) => (
      Math.abs(body.gravitationalParameter - state.gravitationalParameter) < 1e-9
      && Math.abs(body.radius - state.bodyRadius) < 1e-9
    ));
  }

  function statusCopy(values = orbitValues()) {
    if (!values.allowed) return `Rejected: altitude is ${format(state.minimumClearance - state.candidateAltitude, 0)} km inside the protected clearance`;
    if (Math.abs(state.candidateAltitude - state.minimumClearance) < 1e-9) return "Allowed and optimal: this is the smallest permitted circular radius";
    return `Allowed, but its energy is ${format(values.energyAboveMinimum, 3)} MJ/kg higher than the minimum`;
  }

  function curveGeometry() {
    const xStart = 405;
    const xEnd = 708;
    const yZero = 61;
    const ySurface = 346;
    const width = xEnd - xStart;
    const height = ySurface - yZero;
    const surfaceEnergyMagnitude = state.gravitationalParameter / (2 * state.bodyRadius);
    const points = [];
    for (let index = 0; index <= 240; index += 1) {
      const altitude = MAX_ALTITUDE_KM * index / 240;
      const energy = circularOrbit(state.bodyRadius + altitude).energy;
      const x = xStart + width * altitude / MAX_ALTITUDE_KM;
      const y = yZero + height * Math.abs(energy) / surfaceEnergyMagnitude;
      points.push({ x, y });
    }
    const path = `M${points.map((point) => `${format(point.x, 2)},${format(point.y, 2)}`).join(" L")}`;
    const values = orbitValues();
    const pointFor = (altitude, energy) => ({
      x: xStart + width * clamp(altitude, 0, MAX_ALTITUDE_KM) / MAX_ALTITUDE_KM,
      y: yZero + height * Math.abs(energy) / surfaceEnergyMagnitude,
    });
    return {
      xStart,
      xEnd,
      yZero,
      ySurface,
      path,
      constraintX: xStart + width * state.minimumClearance / MAX_ALTITUDE_KM,
      candidatePoint: pointFor(state.candidateAltitude, values.candidate.energy),
      minimumPoint: pointFor(state.minimumClearance, values.minimum.energy),
      surfaceEnergy: -surfaceEnergyMagnitude,
    };
  }

  function orbitDiagramGeometry() {
    const centre = { x: 184, y: 222 };
    const bodyVisualRadius = 68;
    const radiusForAltitude = (altitude) => {
      const normalized = Math.log1p(Math.max(altitude, 0) / state.bodyRadius) / Math.log1p(MAX_ALTITUDE_KM / state.bodyRadius);
      return bodyVisualRadius + 5 + 98 * normalized;
    };
    const candidateVisualRadius = radiusForAltitude(state.candidateAltitude);
    const minimumVisualRadius = radiusForAltitude(state.minimumClearance);
    const angle = radians(-36);
    return {
      centre,
      bodyVisualRadius,
      candidateVisualRadius,
      minimumVisualRadius,
      satellite: {
        x: centre.x + candidateVisualRadius * Math.cos(angle),
        y: centre.y + candidateVisualRadius * Math.sin(angle),
      },
    };
  }

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function apparatusMarkup() {
    const values = orbitValues();
    const curve = curveGeometry();
    const diagram = orbitDiagramGeometry();
    const candidateClass = values.allowed ? "is-allowed" : "is-forbidden";
    return `
      <div class="p102-apparatus-wrap">
        <svg class="p102-apparatus ${candidateClass}" viewBox="0 0 740 415" role="img" aria-labelledby="p102-apparatus-title p102-apparatus-desc">
          <title id="p102-apparatus-title">Circular-orbit diagram and specific-energy curve</title>
          <desc id="p102-apparatus-desc">The central body has radius ${format(state.bodyRadius, 1)} kilometres and gravitational parameter ${format(state.gravitationalParameter, 1)} cubic kilometres per second squared. The minimum permitted altitude is ${format(state.minimumClearance, 0)} kilometres. The current circular orbit at altitude ${format(state.candidateAltitude, 0)} kilometres is ${values.allowed ? "allowed" : "forbidden"}; its specific energy is ${format(values.candidate.energy, 4)} megajoules per kilogram. The lowest allowed energy is ${format(values.minimum.energy, 4)} megajoules per kilogram at the minimum radius.</desc>
          <defs>
            <radialGradient id="p102-body-gradient" cx="35%" cy="28%" r="75%"><stop offset="0" stop-color="#b7d9dc" /><stop offset="0.55" stop-color="#4e8795" /><stop offset="1" stop-color="#285264" /></radialGradient>
            <marker id="p102-arrow-speed" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" /></marker>
          </defs>
          <line class="p102-divider" x1="370" y1="28" x2="370" y2="383" />
          <g class="p102-orbit-diagram">
            <text class="p102-panel-title" x="25" y="31">CIRCULAR-ORBIT CONSTRAINT</text>
            <circle class="p102-body" cx="${diagram.centre.x}" cy="${diagram.centre.y}" r="${diagram.bodyVisualRadius}" />
            <circle class="p102-minimum-orbit" cx="${diagram.centre.x}" cy="${diagram.centre.y}" r="${format(diagram.minimumVisualRadius, 2)}" />
            <circle class="p102-candidate-orbit" cx="${diagram.centre.x}" cy="${diagram.centre.y}" r="${format(diagram.candidateVisualRadius, 2)}" />
            <circle class="p102-satellite" cx="${format(diagram.satellite.x, 2)}" cy="${format(diagram.satellite.y, 2)}" r="7" />
            <line class="p102-speed-arrow" x1="${format(diagram.satellite.x, 2)}" y1="${format(diagram.satellite.y, 2)}" x2="${format(diagram.satellite.x - 38 * Math.sin(radians(-36)), 2)}" y2="${format(diagram.satellite.y + 38 * Math.cos(radians(-36)), 2)}" marker-end="url(#p102-arrow-speed)" />
            <text class="p102-speed-label" x="${format(diagram.satellite.x + 12, 2)}" y="${format(diagram.satellite.y - 15, 2)}">v₍c₎=${format(values.candidate.speed, 3)} km/s</text>
            <text class="p102-body-label" x="${diagram.centre.x}" y="${diagram.centre.y - 4}" text-anchor="middle">R=${format(state.bodyRadius, 1)} km</text>
            <text class="p102-body-label is-mu" x="${diagram.centre.x}" y="${diagram.centre.y + 14}" text-anchor="middle">μ=${format(state.gravitationalParameter, 1)} km³/s²</text>
            <g class="p102-orbit-key" transform="translate(24 344)"><line class="is-minimum" x1="0" y1="0" x2="28" y2="0" /><text x="36" y="4">lowest allowed · h=${format(state.minimumClearance, 0)} km</text><line class="is-candidate" x1="0" y1="25" x2="28" y2="25" /><text x="36" y="29">candidate · h=${format(state.candidateAltitude, 0)} km</text></g>
          </g>
          <g class="p102-energy-graph">
            <text class="p102-panel-title" x="394" y="31">SPECIFIC CIRCULAR-ORBIT ENERGY</text>
            <rect class="p102-forbidden-zone" x="${curve.xStart}" y="45" width="${format(Math.max(curve.constraintX - curve.xStart, 0), 2)}" height="320" />
            <line class="p102-zero-axis" x1="${curve.xStart}" y1="${curve.yZero}" x2="${curve.xEnd}" y2="${curve.yZero}" />
            <line class="p102-radius-axis" x1="${curve.xStart}" y1="${curve.ySurface}" x2="${curve.xEnd}" y2="${curve.ySurface}" />
            <line class="p102-constraint-line" x1="${format(curve.constraintX, 2)}" y1="45" x2="${format(curve.constraintX, 2)}" y2="365" />
            <path class="p102-energy-curve" d="${curve.path}" />
            <circle class="p102-minimum-point" cx="${format(curve.minimumPoint.x, 2)}" cy="${format(curve.minimumPoint.y, 2)}" r="7" />
            <circle class="p102-candidate-point" cx="${format(curve.candidatePoint.x, 2)}" cy="${format(curve.candidatePoint.y, 2)}" r="7" />
            <text class="p102-axis-label" x="${curve.xStart}" y="49">0 MJ/kg</text>
            <text class="p102-axis-label" x="${curve.xStart}" y="${curve.ySurface - 8}">${format(curve.surfaceEnergy, 2)} MJ/kg at surface</text>
            <text class="p102-axis-label" x="${format(curve.constraintX + 5, 2)}" y="79">minimum radius</text>
            <text class="p102-axis-label is-lower" x="397" y="210" transform="rotate(-90 397 210)" text-anchor="middle">LOWER = MORE NEGATIVE ↓</text>
            <text class="p102-altitude-tick" x="${curve.xStart}" y="383">h=0</text><text class="p102-altitude-tick" x="${curve.xEnd}" y="383" text-anchor="end">h=${format(MAX_ALTITUDE_KM, 0)} km</text>
            <text class="p102-point-label is-minimum" x="${format(curve.minimumPoint.x + 9, 2)}" y="${format(curve.minimumPoint.y - 11, 2)}">minimum ${format(values.minimum.energy, 3)}</text>
            <text class="p102-point-label is-candidate" x="${format(curve.candidatePoint.x + 9, 2)}" y="${format(curve.candidatePoint.y + 18, 2)}">candidate ${format(values.candidate.energy, 3)}</text>
          </g>
        </svg>
        <div class="p102-status-strip ${candidateClass}"><strong>${statusCopy(values)}</strong><span>dε/dr = μ/(2r²) = ${values.energyDerivative.toExponential(2)} km/s² &gt; 0</span></div>
      </div>`;
  }

  function metricsMarkup() {
    const values = orbitValues();
    return `
      <div class="p102-metrics" aria-live="polite">
        <div><span>Candidate radius</span><strong>${format(values.candidateRadius, 1)} km</strong><small>R+h</small></div>
        <div><span>Candidate circular speed</span><strong>${format(values.candidate.speed, 4)} km/s</strong><small>√(μ/r)</small></div>
        <div><span>Candidate specific energy</span><strong>${format(values.candidate.energy, 4)} MJ/kg</strong><small>−μ/(2r)</small></div>
        <div><span>Lowest allowed energy</span><strong>${format(values.minimum.energy, 4)} MJ/kg</strong><small>at r=${format(values.minimumRadius, 1)} km</small></div>
      </div>`;
  }

  function dynamicMarkup() {
    return `<div class="p102-dynamic">${apparatusMarkup()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    const activeBody = activeBodyIndex();
    return `
      <section class="p102-controls" aria-label="Circular orbit controls">
        <div class="p102-body-picker" role="group" aria-label="Choose central body">${bodies.map((body, index) => `<button class="secondary-button ${activeBody === index ? "active" : ""}" type="button" data-problem-action="p102-body" data-p102-body="${index}" aria-pressed="${activeBody === index}">${body.short}</button>`).join("")}</div>
        <div class="p102-control-grid">
          <label for="p102-clearance"><span>Minimum clearance h<sub>min</sub><output data-p102-live="clearance">${format(state.minimumClearance, 0)} km</output></span><input id="p102-clearance" data-p102-slider="clearance" type="range" min="0" max="3000" step="50" value="${state.minimumClearance}" /></label>
          <label for="p102-altitude"><span>Candidate altitude h<output data-p102-live="altitude">${format(state.candidateAltitude, 0)} km</output></span><input id="p102-altitude" data-p102-slider="altitude" type="range" min="0" max="${MAX_ALTITUDE_KM}" step="50" value="${state.candidateAltitude}" /></label>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p102-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p102-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p102-solution" aria-labelledby="p102-solution-heading">
        <h3 id="p102-solution-heading" tabindex="-1">“Lowest” means the most negative allowed energy</h3>
        <p>For a circular orbit, gravity fixes the speed:</p>
        <div class="p102-equation">v<sub>c</sub>²/r = μ/r² &nbsp;⇒&nbsp; v<sub>c</sub>² = μ/r</div>
        <p>Add the specific kinetic and gravitational potential energies:</p>
        <div class="p102-equation">ε = v<sub>c</sub>²/2 − μ/r = μ/(2r) − μ/r = −μ/(2r)</div>
        <p>Since dε/dr=μ/(2r²)&gt;0, ε increases towards zero as r grows. The lowest value is therefore at the smallest allowed circular radius, not at infinity:</p>
        <div class="p102-equation">r<sub>min</sub> = R+h<sub>min</sub> = 6000+500 = 6500 km</div>
        <div class="p102-equation is-answer">ε<sub>min</sub> = −400000/(2×6500) = −400/13 ≈ −30.7692 MJ/kg</div>
        <p>The corresponding circular speed is v<sub>c</sub>=√(400000/6500)=√(800/13)≈7.8446 km/s.</p>
        <p class="p102-limits"><strong>Checks.</strong> μ/r has units km²/s², equal to MJ/kg. As r→∞, v<sub>c</sub>→0 and ε→0 from below: that is the highest bound-orbit energy, not the lowest. As μ→0, both speed and binding energy vanish. With h<sub>min</sub>=0 the mathematical optimum grazes the surface; any atmosphere, terrain or safety margin requires a positive clearance. A smaller-radius curve point may be more negative yet still be rejected because it intersects the protected body/periapsis region.</p>
      </section>`;
  }

  function parseSpecificEnergy(raw) {
    let normalized = String(raw).trim().toLowerCase().replaceAll("−", "-").replaceAll(",", ".");
    if (!normalized) return NaN;
    let factor = 1;
    if (/kj\s*\/\s*kg$/.test(normalized)) factor = 1 / 1000;
    else if (/(^|[^m])j\s*\/\s*kg$/.test(normalized)) factor = 1 / 1000000;
    normalized = normalized
      .replace(/\s*mj\s*\/\s*kg$/, "")
      .replace(/\s*kj\s*\/\s*kg$/, "")
      .replace(/\s*j\s*\/\s*kg$/, "")
      .replace(/\s*km(?:\^?2|²)\s*\/\s*s(?:\^?2|²)$/, "")
      .trim();
    const fraction = normalized.match(/^([+-]?\d*\.?\d+)\s*\/\s*([+-]?\d*\.?\d+)$/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]) * factor;
    return Number(normalized) * factor;
  }

  function snapshot() {
    const values = orbitValues();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      centralBody: bodies[state.bodyIndex]?.label || "customized preset",
      gravitationalParameterCubicKilometresPerSecondSquared: state.gravitationalParameter,
      bodyRadiusKilometres: state.bodyRadius,
      minimumClearanceKilometres: state.minimumClearance,
      minimumAllowedRadiusKilometres: values.minimumRadius,
      candidateAltitudeKilometres: state.candidateAltitude,
      candidateRadiusKilometres: values.candidateRadius,
      candidateAllowed: values.allowed,
      candidateCircularSpeedKilometresPerSecond: Number(values.candidate.speed.toFixed(9)),
      candidateKineticEnergyMegajoulesPerKilogram: Number(values.candidate.kinetic.toFixed(9)),
      candidatePotentialEnergyMegajoulesPerKilogram: Number(values.candidate.potential.toFixed(9)),
      candidateSpecificEnergyMegajoulesPerKilogram: Number(values.candidate.energy.toFixed(9)),
      closedFormSpecificEnergyMegajoulesPerKilogram: Number(values.candidate.closedFormEnergy.toFixed(9)),
      circularEnergyResidualMegajoulesPerKilogram: Number((values.candidate.energy - values.candidate.closedFormEnergy).toFixed(12)),
      lowestAllowedSpecificEnergyMegajoulesPerKilogram: Number(values.minimum.energy.toFixed(9)),
      energyAboveMinimumMegajoulesPerKilogram: Number(values.energyAboveMinimum.toFixed(9)),
      energyDerivativeKilometresPerSecondSquared: Number(values.energyDerivative.toFixed(12)),
      questionAnswerExact: "-400/13 MJ/kg",
      questionAnswerDecimalMegajoulesPerKilogram: Number(questionAnswer().toFixed(9)),
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p102-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive orbital energy</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p102-spread">
          <article class="book-page p102-problem-page">
            <div class="problem-number">Problem 10.2</div>
            <h1 class="book-title p102-title">Lowest-energy circular orbit</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="p102-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written constrained-orbit problem is not the book’s wording or solution.</p>
            <p class="problem-copy">A spherical training planet has gravitational parameter μ=400,000 km³/s² and radius 6,000 km. A circular orbit must remain at least 500 km above its surface.</p>
            <p class="problem-copy">What is the lowest allowed specific orbital energy?</p>
            <section class="p102-meaning-card"><strong>Order negative numbers carefully</strong><p>For bound orbits, “lower energy” means more negative. An apparently lower orbit is not a candidate if it intersects the surface or protected clearance region.</p></section>
            <section class="prediction-box"><div class="eyebrow">Choose the radius first</div><p>Decide whether the extremum lies at the minimum permitted radius or as r tends to infinity. Then calculate.</p></section>
          </article>

          <section class="book-page book-stage p102-stage" aria-labelledby="p102-stage-title">
            <div class="p102-stage-heading"><div><span class="eyebrow">Constrained orbit laboratory</span><h2 id="p102-stage-title">Most bound without collision</h2></div><p>Switch central bodies, set the protected clearance and test a candidate circular radius against the energy curve.</p></div>
            ${dynamicMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p102-coach">
            <div class="coach-kicker">Find the constrained minimum</div>
            <p class="coach-question">For the training planet and 500 km clearance, give the lowest allowed specific circular-orbit energy.</p>
            <form class="p102-answer-form" data-p102-answer-form novalidate>
              <label for="p102-answer">Lowest specific energy</label>
              <div><input id="p102-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="negative value" /><span>MJ/kg</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p102-help-row"><button class="secondary-button" type="button" data-problem-action="p102-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p102-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p102-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p102-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll('[data-p102-live="clearance"]').forEach((node) => { node.textContent = `${format(state.minimumClearance, 0)} km`; });
    root.querySelectorAll('[data-p102-live="altitude"]').forEach((node) => { node.textContent = `${format(state.candidateAltitude, 0)} km`; });
    const values = orbitValues();
    root.querySelector("#p102-clearance")?.setAttribute("aria-valuetext", `Minimum clearance ${format(state.minimumClearance, 0)} kilometres; lowest allowed energy ${format(values.minimum.energy, 3)} megajoules per kilogram`);
    root.querySelector("#p102-altitude")?.setAttribute("aria-valuetext", `Candidate altitude ${format(state.candidateAltitude, 0)} kilometres; ${statusCopy(values)}`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    const activeBody = activeBodyIndex();
    root.querySelectorAll('[data-problem-action="p102-body"]').forEach((button) => {
      const active = Number(button.dataset.p102Body) === activeBody;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderAndFocus(rerender, selector) {
    rerender();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p102-shell");
    if (!root) return;

    root.querySelectorAll("[data-p102-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        if (event.target.dataset.p102Slider === "clearance") state.minimumClearance = clamp(event.target.value, 0, 3000);
        if (event.target.dataset.p102Slider === "altitude") state.candidateAltitude = clamp(event.target.value, 0, MAX_ALTITUDE_KM);
        state.feedback = "";
        state.committed = false;
        updateDynamicDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p102-reset") {
          state = initialState();
          renderAndFocus(rerender, "#p102-clearance");
          return;
        }
        if (action === "p102-body") {
          const index = Number(control.dataset.p102Body);
          const body = bodies[index];
          if (body) {
            state.bodyIndex = index;
            state.gravitationalParameter = body.gravitationalParameter;
            state.bodyRadius = body.radius;
            state.minimumClearance = body.clearance;
            state.candidateAltitude = body.altitude;
            state.feedback = "";
            state.committed = false;
          }
          renderAndFocus(rerender, `[data-p102-body="${index}"]`);
          return;
        }
        if (action === "p102-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p102-reveal") state.revealed = true;
        rerender();
        if (action === "p102-reveal") window.requestAnimationFrame(() => document.querySelector("#p102-solution-heading")?.focus());
      });
    });

    root.querySelector("#p102-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelector("[data-p102-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p102-answer")?.value || "";
      const answer = parseSpecificEnergy(raw);
      const exact = questionAnswer();
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(answer)) {
        state.feedback = "Enter a signed specific energy in MJ/kg; J/kg, kJ/kg and km²/s² are also accepted.";
        state.feedbackTone = "warn";
      } else if (Math.abs(answer - exact) <= 0.03) {
        state.feedback = "Correct. The smallest allowed radius is 6500 km, giving ε=−400/13≈−30.769 MJ/kg.";
        state.feedbackTone = "success";
        state.committed = true;
        state = { ...state, bodyIndex: 0, gravitationalParameter: QUESTION.gravitationalParameter, bodyRadius: QUESTION.radius, minimumClearance: QUESTION.clearance, candidateAltitude: QUESTION.clearance };
      } else if (Math.abs(answer + exact) <= 0.03) {
        state.feedback = "That is the correct magnitude, but bound-orbit total energy is negative. “Lowest” means most negative.";
      } else if (Math.abs(answer + QUESTION.gravitationalParameter / (QUESTION.radius + QUESTION.clearance)) <= 0.05) {
        state.feedback = "That is the gravitational potential energy alone. Circular motion adds positive kinetic energy μ/(2r), leaving half that negative magnitude.";
      } else if (Math.abs(answer + QUESTION.gravitationalParameter / (2 * QUESTION.radius)) <= 0.05) {
        state.feedback = "That uses the surface radius and violates the 500 km clearance. Use r=6500 km.";
      } else {
        state.feedback = "Use ε=−μ/(2r) at the smallest permitted radius R+hmin. Check the sign and kilometre-based units.";
      }
      renderAndFocus(rerender, "#p102-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
