(function registerAstrolabePlumbPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.8";
  const GRAVITATIONAL_CONSTANT = 6.6743e-11;
  const QUESTION = Object.freeze({ mass: 1e9, distance: 10, verticalGravity: 9.8 });
  const presets = Object.freeze([
    Object.freeze({ label: "Question survey", mode: "forward", mass: 1e9, distance: 10, verticalGravity: 9.8, measuredArcseconds: 14.05 }),
    Object.freeze({ label: "No nearby mass", mode: "forward", mass: 0, distance: 10, verticalGravity: 9.8, measuredArcseconds: 0 }),
    Object.freeze({ label: "Half the distance", mode: "forward", mass: 1e9, distance: 5, verticalGravity: 9.8, measuredArcseconds: 56.19 }),
    Object.freeze({ label: "Low local gravity", mode: "forward", mass: 1e9, distance: 10, verticalGravity: 1.6, measuredArcseconds: 86.04 }),
    Object.freeze({ label: "Infer hidden mass", mode: "inverse", mass: 1e9, distance: 10, verticalGravity: 9.8, measuredArcseconds: 25 }),
  ]);
  const hints = Object.freeze([
    "Treat the nearby object as a point mass level with the bob. Its horizontal field is gₕ=GM/d².",
    "The local terrestrial field is vertical: gᵥ=9.80 m/s². The plumb line follows the vector sum of gᵥ and gₕ.",
    "Resolve the resultant relative to vertical: tanθ=gₕ/gᵥ.",
    "Convert the angle from radians to arcseconds using 1 rad=180/π degrees and 1 degree=3600 arcseconds.",
    "Here gₕ=6.6743×10⁻⁴ m/s² and tanθ=6.81051×10⁻⁵.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p108-reset">Reset</button>';

  const initialState = () => ({
    mode: "forward",
    mass: QUESTION.mass,
    distance: QUESTION.distance,
    verticalGravity: QUESTION.verticalGravity,
    measuredArcseconds: 14.05,
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

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function degrees(radiansValue) {
    return Number(radiansValue) * 180 / Math.PI;
  }

  function format(value, digits = 3) {
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

  function forwardAnalysis(
    mass = state.mass,
    distance = state.distance,
    verticalGravity = state.verticalGravity,
  ) {
    const safeDistance = Math.max(Number(distance), 1e-12);
    const vertical = Math.max(Number(verticalGravity), 1e-12);
    const horizontalGravity = GRAVITATIONAL_CONSTANT * Math.max(Number(mass), 0) / safeDistance ** 2;
    const angleRadians = Math.atan2(horizontalGravity, vertical);
    return {
      mass: Math.max(Number(mass), 0),
      distance: safeDistance,
      verticalGravity: vertical,
      horizontalGravity,
      resultantGravity: Math.hypot(vertical, horizontalGravity),
      tangent: horizontalGravity / vertical,
      angleRadians,
      angleDegrees: degrees(angleRadians),
      angleArcseconds: degrees(angleRadians) * 3600,
    };
  }

  function inverseAnalysis(
    angleArcseconds = state.measuredArcseconds,
    distance = state.distance,
    verticalGravity = state.verticalGravity,
  ) {
    const angleDegrees = Math.max(Number(angleArcseconds), 0) / 3600;
    const angleRadians = radians(angleDegrees);
    const safeDistance = Math.max(Number(distance), 1e-12);
    const vertical = Math.max(Number(verticalGravity), 1e-12);
    const horizontalGravity = vertical * Math.tan(angleRadians);
    const mass = horizontalGravity * safeDistance ** 2 / GRAVITATIONAL_CONSTANT;
    return {
      mass,
      distance: safeDistance,
      verticalGravity: vertical,
      horizontalGravity,
      resultantGravity: Math.hypot(vertical, horizontalGravity),
      tangent: Math.tan(angleRadians),
      angleRadians,
      angleDegrees,
      angleArcseconds: Math.max(Number(angleArcseconds), 0),
    };
  }

  function currentAnalysis() {
    return state.mode === "inverse" ? inverseAnalysis() : forwardAnalysis();
  }

  function questionAnalysis() {
    return forwardAnalysis(QUESTION.mass, QUESTION.distance, QUESTION.verticalGravity);
  }

  const challenge = questionAnalysis();

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      preset.mode === state.mode
      && Math.abs(preset.mass - state.mass) < 1e-6
      && Math.abs(preset.distance - state.distance) < 1e-9
      && Math.abs(preset.verticalGravity - state.verticalGravity) < 1e-9
      && (state.mode !== "inverse" || Math.abs(preset.measuredArcseconds - state.measuredArcseconds) < 1e-9)
    ));
  }

  function visualGeometry() {
    const analysis = currentAnalysis();
    const actualDegrees = analysis.angleDegrees;
    const visualDegrees = actualDegrees <= 0 ? 0 : Math.min(36, Math.max(2, actualDegrees * 2500));
    const visualRadians = radians(visualDegrees);
    const magnification = actualDegrees > 0 ? visualDegrees / actualDegrees : 0;
    const pivot = { x: 208, y: 67 };
    const stringLength = 244;
    const bob = {
      x: pivot.x + stringLength * Math.sin(visualRadians),
      y: pivot.y + stringLength * Math.cos(visualRadians),
    };
    const massRadius = analysis.mass <= 0 ? 12 : Math.min(38, 16 + 16 * Math.log10(1 + analysis.mass / 1e8) / Math.log10(51));
    const nearbyMass = { x: 410, y: bob.y };
    const vectorOrigin = { x: 514, y: 108 };
    const verticalLength = 176;
    const horizontalLength = verticalLength * Math.tan(visualRadians);
    const arcRadius = 49;
    const arcEnd = {
      x: pivot.x + arcRadius * Math.sin(visualRadians),
      y: pivot.y + arcRadius * Math.cos(visualRadians),
    };
    return {
      analysis,
      actualDegrees,
      visualDegrees,
      visualRadians,
      magnification,
      pivot,
      bob,
      nearbyMass,
      massRadius,
      vectorOrigin,
      verticalLength,
      horizontalLength,
      arcRadius,
      arcEnd,
    };
  }

  function modeCopy() {
    return state.mode === "inverse" ? "Inverse gravimetry · angle reveals hidden mass" : "Forward gravimetry · mass predicts angle";
  }

  function apparatusMarkup() {
    const shape = visualGeometry();
    const analysis = shape.analysis;
    return `
      <div class="p108-apparatus-wrap">
        <svg class="p108-apparatus is-${state.mode}" viewBox="0 0 740 420" role="img" aria-labelledby="p108-apparatus-title p108-apparatus-desc">
          <title id="p108-apparatus-title">Plumb-line deflection under vertical and horizontal gravitational fields</title>
          <desc id="p108-apparatus-desc">Local vertical gravity is ${format(analysis.verticalGravity, 4)} metres per second squared. A point mass of ${format(analysis.mass, 1)} kilograms at horizontal distance ${format(analysis.distance, 2)} metres supplies ${analysis.horizontalGravity.toExponential(5)} metres per second squared horizontally. The plumb deflection is ${format(analysis.angleArcseconds, 5)} arcseconds. The drawn angle is magnified for visibility.</desc>
          <defs>
            <marker id="p108-arrow-earth" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p108-arrow-horizontal" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p108-arrow-resultant" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <radialGradient id="p108-mass-gradient" cx="35%" cy="28%" r="75%"><stop offset="0" stop-color="#e0c18b" /><stop offset="0.62" stop-color="#9d7541" /><stop offset="1" stop-color="#624322" /></radialGradient>
          </defs>
          <line class="p108-divider" x1="455" y1="28" x2="455" y2="390" />
          <text class="p108-panel-title" x="24" y="31">ASTROLABE-PLUMB</text>
          <line class="p108-support" x1="116" y1="53" x2="300" y2="53" /><circle class="p108-pivot" cx="${shape.pivot.x}" cy="${shape.pivot.y}" r="8" />
          <line class="p108-true-vertical" x1="${shape.pivot.x}" y1="${shape.pivot.y}" x2="${shape.pivot.x}" y2="${shape.pivot.y + 270}" />
          <line class="p108-string" x1="${shape.pivot.x}" y1="${shape.pivot.y}" x2="${format(shape.bob.x, 2)}" y2="${format(shape.bob.y, 2)}" />
          <path class="p108-angle-arc" d="M${shape.pivot.x},${shape.pivot.y + shape.arcRadius} A${shape.arcRadius},${shape.arcRadius} 0 0 0 ${format(shape.arcEnd.x, 2)},${format(shape.arcEnd.y, 2)}" />
          <text class="p108-angle-label" x="${format(shape.pivot.x + 59, 2)}" y="${format(shape.pivot.y + 57, 2)}">θ=${format(analysis.angleArcseconds, 3)}″</text>
          <circle class="p108-bob" cx="${format(shape.bob.x, 2)}" cy="${format(shape.bob.y, 2)}" r="15" />
          <line class="p108-distance-line" x1="${format(shape.bob.x + 18, 2)}" y1="${format(shape.bob.y + 37, 2)}" x2="${format(shape.nearbyMass.x - shape.massRadius - 4, 2)}" y2="${format(shape.bob.y + 37, 2)}" />
          <text class="p108-distance-label" x="${format((shape.bob.x + shape.nearbyMass.x) / 2, 2)}" y="${format(shape.bob.y + 32, 2)}" text-anchor="middle">d=${format(analysis.distance, 2)} m</text>
          <circle class="p108-nearby-mass" cx="${shape.nearbyMass.x}" cy="${format(shape.nearbyMass.y, 2)}" r="${format(shape.massRadius, 2)}" opacity="${analysis.mass > 0 ? 1 : 0.24}" />
          <text class="p108-mass-label" x="${shape.nearbyMass.x}" y="${format(shape.nearbyMass.y - shape.massRadius - 10, 2)}" text-anchor="middle">M=${analysis.mass.toExponential(3)} kg</text>
          <text class="p108-schematic-note" x="24" y="391">SCHEMATIC ANGLE MAGNIFIED ${shape.magnification > 0 ? `×${format(shape.magnification, 0)}` : "· zero deflection"}</text>

          <g class="p108-vector-panel">
            <text class="p108-panel-title" x="484" y="31">LOCAL FIELD VECTORS</text>
            <line class="p108-vector-vertical" x1="${shape.vectorOrigin.x}" y1="${shape.vectorOrigin.y}" x2="${shape.vectorOrigin.x}" y2="${shape.vectorOrigin.y + shape.verticalLength}" marker-end="url(#p108-arrow-earth)" />
            <line class="p108-vector-horizontal" x1="${shape.vectorOrigin.x}" y1="${shape.vectorOrigin.y + shape.verticalLength}" x2="${format(shape.vectorOrigin.x + shape.horizontalLength, 2)}" y2="${shape.vectorOrigin.y + shape.verticalLength}" marker-end="url(#p108-arrow-horizontal)" />
            <line class="p108-vector-resultant" x1="${shape.vectorOrigin.x}" y1="${shape.vectorOrigin.y}" x2="${format(shape.vectorOrigin.x + shape.horizontalLength, 2)}" y2="${shape.vectorOrigin.y + shape.verticalLength}" marker-end="url(#p108-arrow-resultant)" />
            <text class="p108-vector-label is-vertical" x="${shape.vectorOrigin.x + 10}" y="${shape.vectorOrigin.y + 85}">gᵥ=${format(analysis.verticalGravity, 4)} m/s²</text>
            <text class="p108-vector-label is-horizontal" x="${format(shape.vectorOrigin.x + shape.horizontalLength / 2, 2)}" y="${shape.vectorOrigin.y + shape.verticalLength + 24}" text-anchor="middle">gₕ=${analysis.horizontalGravity.toExponential(4)} m/s²</text>
            <text class="p108-vector-label is-resultant" x="${format(shape.vectorOrigin.x + shape.horizontalLength + 10, 2)}" y="${shape.vectorOrigin.y + 92}">resultant</text>
            <rect class="p108-equation-box" x="484" y="326" width="224" height="62" rx="12" /><text class="p108-equation-kicker" x="500" y="347">PLUMB CONDITION</text><text class="p108-equation-value" x="500" y="370">tan θ = gₕ/gᵥ = ${analysis.tangent.toExponential(5)}</text>
          </g>
        </svg>
        <div class="p108-status-strip"><strong>${modeCopy()}</strong><span>Resultant |g|=${format(analysis.resultantGravity, 7)} m/s²</span></div>
      </div>`;
  }

  function readingsMarkup() {
    const analysis = currentAnalysis();
    return `
      <div class="p108-readings" aria-live="polite">
        <div><span>Vertical component</span><strong>${format(analysis.verticalGravity, 5)} m/s²</strong><small>local Earth field</small></div>
        <div><span>Horizontal component</span><strong>${analysis.horizontalGravity.toExponential(5)} m/s²</strong><small>GM/d²</small></div>
        <div><span>Deflection angle</span><strong>${format(analysis.angleArcseconds, 5)} arcsec</strong><small>${format(analysis.angleDegrees, 8)}°</small></div>
        <div><span>${state.mode === "inverse" ? "Inferred hidden mass" : "Specified nearby mass"}</span><strong>${analysis.mass.toExponential(6)} kg</strong><small>${state.mode === "inverse" ? "gᵥd²tanθ/G" : "point-mass source"}</small></div>
      </div>`;
  }

  function dynamicMarkup() {
    return `<div class="p108-dynamic">${apparatusMarkup()}${readingsMarkup()}</div>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    const primaryControl = state.mode === "inverse"
      ? `<label for="p108-angle"><span>Measured deflection θ<output data-p108-live="angle">${format(state.measuredArcseconds, 2)} arcsec</output></span><input id="p108-angle" data-p108-slider="angle" type="range" min="0" max="200" step="0.1" value="${state.measuredArcseconds}" /></label>`
      : `<label for="p108-mass"><span>Nearby point mass M<output data-p108-live="mass">${format(state.mass / 1e9, 3)}×10⁹ kg</output></span><input id="p108-mass" data-p108-slider="mass" type="range" min="0" max="5000000000" step="50000000" value="${state.mass}" /></label>`;
    return `
      <section class="p108-controls" aria-label="Astrolabe-plumb controls">
        <div class="p108-mode-picker" role="group" aria-label="Choose gravimetry direction"><button class="secondary-button ${state.mode === "forward" ? "active" : ""}" type="button" data-problem-action="p108-mode" data-p108-mode="forward" aria-pressed="${state.mode === "forward"}">Mass → angle</button><button class="secondary-button ${state.mode === "inverse" ? "active" : ""}" type="button" data-problem-action="p108-mode" data-p108-mode="inverse" aria-pressed="${state.mode === "inverse"}">Angle → hidden mass</button></div>
        <div class="p108-control-grid">
          ${primaryControl}
          <label for="p108-distance"><span>Horizontal distance d<output data-p108-live="distance">${format(state.distance, 1)} m</output></span><input id="p108-distance" data-p108-slider="distance" type="range" min="2" max="50" step="0.5" value="${state.distance}" /></label>
          <label for="p108-gravity"><span>Local vertical gravity gᵥ<output data-p108-live="gravity">${format(state.verticalGravity, 2)} m/s²</output></span><input id="p108-gravity" data-p108-slider="gravity" type="range" min="1" max="15" step="0.1" value="${state.verticalGravity}" /></label>
        </div>
        <div class="p108-presets" role="group" aria-label="Gravimetry presets">${presets.map((preset, index) => `<button class="chip-button ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p108-preset" data-p108-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p108-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p108-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p108-solution" aria-labelledby="p108-solution-heading">
        <h3 id="p108-solution-heading" tabindex="-1">The plumb aligns with the resultant field</h3>
        <p>The nearby point mass supplies a horizontal acceleration:</p>
        <div class="p108-equation">g<sub>h</sub> = GM/d² = (6.6743×10⁻¹¹)(1.00×10⁹)/(10.0)²<br>= 6.6743×10⁻⁴ m/s²</div>
        <p>At static equilibrium the string lies along the vector sum of horizontal and vertical gravity, so</p>
        <div class="p108-equation">tanθ = g<sub>h</sub>/g<sub>v</sub> = (6.6743×10⁻⁴)/9.80 = 6.8105102×10⁻⁵</div>
        <div class="p108-equation is-answer">θ = arctan(6.8105102×10⁻⁵)<br>= ${format(challenge.angleDegrees, 9)}° = ${format(challenge.angleArcseconds, 6)} arcsec ≈ 14.05 arcsec</div>
        <p>In inverse mode, the same relation reveals the hidden mass:</p>
        <div class="p108-equation">M = g<sub>v</sub>d²tanθ/G</div>
        <p class="p108-limits"><strong>Checks and idealisation.</strong> The nearby source is a stationary point mass level with the bob; local terrestrial gravity is uniform and exactly vertical; the bob and support do not perturb either source; air motion, vibration, tides, terrain and field gradients across the instrument are ignored. Bob mass cancels. As M→0 or d→∞, θ→0. Halving d multiplies g<sub>h</sub> by four and, for small angles, nearly quadruples θ. Increasing g<sub>v</sub> suppresses the deflection. G uses SI units, so kg and m give acceleration in m/s². One degree is 3600 arcseconds.</p>
      </section>`;
  }

  function parseArcseconds(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".").replaceAll("″", "arcsec").replaceAll('"', "arcsec");
    if (!normalized) return NaN;
    if (/rad(?:ians?)?$/.test(normalized)) return Number(normalized.replace(/\s*rad(?:ians?)?$/, "")) * 180 / Math.PI * 3600;
    if (/deg(?:rees?)?$/.test(normalized) || /°$/.test(normalized)) return Number(normalized.replace(/\s*(?:deg(?:rees?)?|°)$/, "")) * 3600;
    if (/arcmin(?:utes?)?$/.test(normalized) || /'$/.test(normalized)) return Number(normalized.replace(/\s*(?:arcmin(?:utes?)?|')$/, "")) * 60;
    if (/arcsec(?:onds?)?$/.test(normalized)) return Number(normalized.replace(/\s*arcsec(?:onds?)?$/, ""));
    return Number(normalized);
  }

  function snapshot() {
    const analysis = currentAnalysis();
    const forwardMassCheck = analysis.horizontalGravity * analysis.distance ** 2 / GRAVITATIONAL_CONSTANT;
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      idealisation: "stationary point mass level with bob plus uniform vertical local field",
      mode: state.mode,
      gravitationalConstantCubicMetresPerKilogramSecondSquared: GRAVITATIONAL_CONSTANT,
      nearbyOrInferredMassKilograms: Number(analysis.mass.toFixed(6)),
      horizontalDistanceMetres: analysis.distance,
      verticalGravityMetresPerSecondSquared: analysis.verticalGravity,
      horizontalGravityMetresPerSecondSquared: Number(analysis.horizontalGravity.toFixed(12)),
      resultantGravityMetresPerSecondSquared: Number(analysis.resultantGravity.toFixed(12)),
      tangentOfDeflection: Number(analysis.tangent.toFixed(12)),
      deflectionRadians: Number(analysis.angleRadians.toFixed(12)),
      deflectionDegrees: Number(analysis.angleDegrees.toFixed(12)),
      deflectionArcseconds: Number(analysis.angleArcseconds.toFixed(9)),
      massRoundTripResidualKilograms: Number((analysis.mass - forwardMassCheck).toFixed(6)),
      questionAnswerArcseconds: Number(challenge.angleArcseconds.toFixed(9)),
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p108-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive local gravimetry</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p108-spread">
          <article class="book-page p108-problem-page">
            <div class="problem-number">Problem 10.8</div>
            <h1 class="book-title p108-title">Professor Plumb’s Astrolabe-Plumb</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="p108-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written plumb-line gravimetry problem is not the book’s wording or solution.</p>
            <p class="problem-copy">A 1.00×10⁹ kg point mass is horizontally level with a plumb bob and 10.0 m away. The local vertical gravitational field is 9.80 m/s².</p>
            <p class="problem-copy">Through what angle does the plumb line turn towards the mass? Give the result in arcseconds.</p>
            <section class="p108-model-card"><strong>Local-field model</strong><p>Take G=6.6743×10⁻¹¹ m³kg⁻¹s⁻². The nearby source is a stationary point mass; Earth’s field is uniform and vertical over the instrument; the plumb line settles exactly along the resultant.</p></section>
            <section class="prediction-box"><div class="eyebrow">Tiny angle, real vector</div><p>The drawing must magnify the deflection. The displayed component values—not the schematic geometry—determine the numerical result.</p></section>
          </article>

          <section class="book-page book-stage p108-stage" aria-labelledby="p108-stage-title">
            <div class="p108-stage-heading"><div><span class="eyebrow">Plumb gravimetry laboratory</span><h2 id="p108-stage-title">Resolve the sideways pull</h2></div><p>Predict an angle from a known mass or reverse the instrument to infer a hidden mass from a measured deflection.</p></div>
            ${dynamicMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p108-coach">
            <div class="coach-kicker">Read Professor Plumb’s scale</div>
            <p class="coach-question">For the stated 10⁹ kg mass at 10.0 m under 9.80 m/s² vertical gravity, what is the deflection in arcseconds?</p>
            <form class="p108-answer-form" data-p108-answer-form novalidate>
              <label for="p108-answer">Plumb deflection</label>
              <div><input id="p108-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="e.g. 14" /><span>arcsec</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p108-help-row"><button class="secondary-button" type="button" data-problem-action="p108-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p108-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p108-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p108-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = {
      mass: `${format(state.mass / 1e9, 3)}×10⁹ kg`,
      angle: `${format(state.measuredArcseconds, 2)} arcsec`,
      distance: `${format(state.distance, 1)} m`,
      gravity: `${format(state.verticalGravity, 2)} m/s²`,
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p108-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const analysis = currentAnalysis();
    root.querySelector("#p108-mass")?.setAttribute("aria-valuetext", `Nearby point mass ${analysis.mass.toExponential(3)} kilograms; deflection ${format(analysis.angleArcseconds, 3)} arcseconds`);
    root.querySelector("#p108-angle")?.setAttribute("aria-valuetext", `Measured deflection ${format(state.measuredArcseconds, 2)} arcseconds; inferred mass ${analysis.mass.toExponential(3)} kilograms`);
    root.querySelector("#p108-distance")?.setAttribute("aria-valuetext", `Horizontal distance ${format(state.distance, 1)} metres; horizontal gravity ${analysis.horizontalGravity.toExponential(3)} metres per second squared`);
    root.querySelector("#p108-gravity")?.setAttribute("aria-valuetext", `Local vertical gravity ${format(state.verticalGravity, 2)} metres per second squared; deflection ${format(analysis.angleArcseconds, 3)} arcseconds`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p108-preset"]').forEach((button) => {
      const active = Number(button.dataset.p108Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderAndFocus(rerender, selector) {
    rerender();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p108-shell");
    if (!root) return;

    root.querySelectorAll("[data-p108-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p108Slider;
        if (kind === "mass") state.mass = clamp(event.target.value, 0, 5e9);
        if (kind === "angle") state.measuredArcseconds = clamp(event.target.value, 0, 200);
        if (kind === "distance") state.distance = clamp(event.target.value, 2, 50);
        if (kind === "gravity") state.verticalGravity = clamp(event.target.value, 1, 15);
        state.feedback = "";
        state.committed = false;
        updateDynamicDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p108-reset") {
          state = initialState();
          renderAndFocus(rerender, "#p108-mass");
          return;
        }
        if (action === "p108-mode") {
          const previous = currentAnalysis();
          state.mode = control.dataset.p108Mode === "inverse" ? "inverse" : "forward";
          if (state.mode === "inverse") state.measuredArcseconds = clamp(previous.angleArcseconds, 0, 200);
          if (state.mode === "forward") state.mass = clamp(previous.mass, 0, 5e9);
          state.feedback = "";
          state.committed = false;
          renderAndFocus(rerender, state.mode === "inverse" ? "#p108-angle" : "#p108-mass");
          return;
        }
        if (action === "p108-preset") {
          const preset = presets[Number(control.dataset.p108Preset)];
          if (preset) {
            state.mode = preset.mode;
            state.mass = preset.mass;
            state.distance = preset.distance;
            state.verticalGravity = preset.verticalGravity;
            state.measuredArcseconds = preset.measuredArcseconds;
            state.feedback = "";
            state.committed = false;
          }
          renderAndFocus(rerender, state.mode === "inverse" ? "#p108-angle" : "#p108-mass");
          return;
        }
        if (action === "p108-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p108-reveal") state.revealed = true;
        rerender();
        if (action === "p108-reveal") window.requestAnimationFrame(() => document.querySelector("#p108-solution-heading")?.focus());
      });
    });

    root.querySelector("#p108-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelector("[data-p108-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p108-answer")?.value || "";
      const answer = parseArcseconds(raw);
      const exact = challenge.angleArcseconds;
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(answer) || answer < 0) {
        state.feedback = "Enter a non-negative angle; arcseconds, degrees and radians are accepted.";
        state.feedbackTone = "warn";
      } else if (Math.abs(answer - exact) <= 0.03) {
        state.feedback = `Correct. The horizontal-to-vertical field ratio gives θ=${format(exact, 5)} arcseconds.`;
        state.feedbackTone = "success";
        state.committed = true;
        state = { ...state, mode: "forward", mass: QUESTION.mass, distance: QUESTION.distance, verticalGravity: QUESTION.verticalGravity };
      } else if (Math.abs(answer - challenge.angleDegrees) <= 0.00002) {
        state.feedback = "That numerical value is in degrees. Include ° or multiply by 3600 to report arcseconds.";
      } else if (Math.abs(answer - challenge.angleRadians) <= 0.000002) {
        state.feedback = "That is the small angle in radians. Convert radians to degrees, then multiply by 3600 arcseconds per degree.";
      } else {
        state.feedback = "Compute gₕ=GM/d², then θ=arctan(gₕ/gᵥ) and convert the small angle to arcseconds.";
      }
      renderAndFocus(rerender, "#p108-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
