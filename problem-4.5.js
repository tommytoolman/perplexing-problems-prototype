(function registerWaterFunicularPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "4.5";
  const CAR_MASS = 1000;
  const GRAVITY = 9.81;
  const SLOPE_DEGREES = 20;
  const RESISTANCE_COEFFICIENT = 0.020;
  const CHALLENGE_WATER = 300;
  const MAX_WATER = 600;
  const stages = Object.freeze([
    Object.freeze({ short: "Cars", title: "Add water to the upper car", copy: "Both empty cars have the same mass. Water makes car A’s downslope weight component larger while the rope makes car B climb." }),
    Object.freeze({ short: "Threshold", title: "Cancel the common car weights", copy: "Add the two along-slope equations. Tension cancels, leaving the water’s extra pull to overcome both rolling resistances." }),
    Object.freeze({ short: "Motion", title: "Accelerate the coupled pair", copy: "Any water above the limiting amount gives a positive A-down acceleration. Use either car equation to recover the common rope tension." }),
  ]);
  const hints = Object.freeze([
    "Take car A down its slope and car B up its slope as the shared positive direction. The inextensible rope gives both cars the same acceleration magnitude a.",
    "For A: (M+q)g sinθ−T−μ(M+q)g cosθ=(M+q)a. For B: T−Mg sinθ−μMg cosθ=Ma.",
    "Add the equations. T cancels and the equal empty-car gravity components cancel, giving g[q sinθ−μ(2M+q)cosθ]=(2M+q)a.",
    "At the limiting water amount set a=0, then solve q(sinθ−μ cosθ)=2μM cosθ.",
    "For q=300 kg, calculate a from the combined equation, then use T=M[a+g(sinθ+μ cosθ)] on the rising car.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p45-reset">Reset</button>';

  function radians(degrees) {
    return degrees * Math.PI / 180;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18);
  }

  const THETA = radians(SLOPE_DEGREES);
  const SINE = Math.sin(THETA);
  const COSINE = Math.cos(THETA);
  const MINIMUM_WATER = 2 * RESISTANCE_COEFFICIENT * CAR_MASS * COSINE
    / (SINE - RESISTANCE_COEFFICIENT * COSINE);

  function mechanics(waterLitres) {
    const waterMass = Number(waterLitres);
    const carAMass = CAR_MASS + waterMass;
    const carBMass = CAR_MASS;
    const totalMass = carAMass + carBMass;
    const waterDrive = waterMass * GRAVITY * SINE;
    const resistanceA = RESISTANCE_COEFFICIENT * carAMass * GRAVITY * COSINE;
    const resistanceB = RESISTANCE_COEFFICIENT * carBMass * GRAVITY * COSINE;
    const netDrive = waterDrive - resistanceA - resistanceB;
    const rawAcceleration = netDrive / totalMass;
    const moving = netDrive > 0.5;
    const limiting = Math.abs(netDrive) <= 0.5;
    const acceleration = moving ? rawAcceleration : 0;
    const tension = moving
      ? CAR_MASS * (acceleration + GRAVITY * (SINE + RESISTANCE_COEFFICIENT * COSINE))
      : null;
    const tensionFromA = moving
      ? carAMass * (GRAVITY * (SINE - RESISTANCE_COEFFICIENT * COSINE) - acceleration)
      : null;
    return {
      waterMass,
      carAMass,
      carBMass,
      totalMass,
      waterDrive,
      resistanceA,
      resistanceB,
      netDrive,
      rawAcceleration,
      acceleration,
      tension,
      tensionFromA,
      moving,
      limiting,
    };
  }

  const CHALLENGE = mechanics(CHALLENGE_WATER);

  const initialState = () => ({
    water: 100,
    stage: 0,
    waterAnswer: "",
    accelerationAnswer: "",
    tensionAnswer: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function regime(values = mechanics(state.water)) {
    if (values.moving) return "moving";
    if (values.limiting) return "limiting";
    return "held";
  }

  function regimeLabel(values = mechanics(state.water)) {
    const current = regime(values);
    if (current === "moving") return "Car A descends · car B rises";
    if (current === "limiting") return "Exactly at the resistance threshold";
    return "Held by the modelled resistance";
  }

  function reconstructionNote() {
    return `
      <p class="dyn4-reconstruction-note p45-reconstruction-note">
        <strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. The scenario, numerical data, interaction and solution below are newly written; they do not reproduce the book’s wording or solution.
      </p>`;
  }

  function stageControls() {
    return `
      <div class="p45-stage-controls" role="group" aria-label="Funicular dynamics stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p45-stage" data-p45-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p45-stage-caption">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p45-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Dynamics resolved" : "Next stage"}</button>
      </div>`;
  }

  function pointBetween(first, second, fraction) {
    return { x: first.x + (second.x - first.x) * fraction, y: first.y + (second.y - first.y) * fraction };
  }

  function arrowLine(origin, direction, length) {
    return { x1: origin.x, y1: origin.y, x2: origin.x + direction.x * length, y2: origin.y + direction.y * length };
  }

  function forceArrow(line, className, label, marker, labelAnchor = "middle") {
    return `
      <g class="p45-force ${className}">
        <line x1="${format(line.x1)}" y1="${format(line.y1)}" x2="${format(line.x2)}" y2="${format(line.y2)}" marker-end="url(#${marker})"/>
        <text x="${format(line.x2)}" y="${format(line.y2 - 9)}" text-anchor="${labelAnchor}">${label}</text>
      </g>`;
  }

  function visualGeometry() {
    const topY = 330 - 280 * Math.tan(THETA);
    const leftBase = { x: 40, y: 330 };
    const leftTop = { x: 320, y: topY };
    const rightTop = { x: 400, y: topY };
    const rightBase = { x: 680, y: 330 };
    const pulley = { x: 360, y: topY - 25 };
    const carA = pointBetween(leftBase, leftTop, 0.72);
    const carB = pointBetween(rightBase, rightTop, 0.38);
    const aDown = { x: -COSINE, y: SINE };
    const aUp = { x: COSINE, y: -SINE };
    const bDown = { x: COSINE, y: SINE };
    const bUp = { x: -COSINE, y: -SINE };
    return { topY, leftBase, leftTop, rightTop, rightBase, pulley, carA, carB, aDown, aUp, bDown, bUp };
  }

  function forceLength(force) {
    return clamp(22 + force / 70, 24, 82);
  }

  function carMarkup(position, rotation, name, massLabel, water = false) {
    const fillHeight = water ? 27 * clamp(state.water / MAX_WATER, 0, 1) : 0;
    return `
      <g class="p45-car ${water ? "is-water-car" : ""}" transform="translate(${format(position.x)} ${format(position.y)}) rotate(${rotation})">
        <rect class="p45-car-body" x="-48" y="-28" width="96" height="50" rx="8"/>
        <circle cx="-27" cy="27" r="9"/><circle cx="27" cy="27" r="9"/>
        ${water ? `<rect class="p45-tank" x="-34" y="-20" width="68" height="29" rx="3"/><rect class="p45-water" x="-33" y="${format(8 - fillHeight)}" width="66" height="${format(fillHeight)}" rx="2"/>` : '<path class="p45-seat" d="M-18 9V-10H8V9M-23 9H23"/>'}
        <text x="0" y="-39" text-anchor="middle">${name} · ${massLabel}</text>
      </g>`;
  }

  function funicularSvg() {
    const values = mechanics(state.water);
    const shape = visualGeometry();
    const waterRatio = clamp(state.water / MAX_WATER, 0, 1);
    const thresholdX = 76 + MINIMUM_WATER / MAX_WATER * 568;
    const currentX = 76 + waterRatio * 568;
    const motionLength = clamp(24 + Math.max(0, values.acceleration) * 125, 24, 72);
    const gravityA = arrowLine({ x: shape.carA.x - 3, y: shape.carA.y + 46 }, shape.aDown, forceLength(values.carAMass * GRAVITY * SINE));
    const gravityB = arrowLine({ x: shape.carB.x + 5, y: shape.carB.y + 43 }, shape.bDown, forceLength(values.carBMass * GRAVITY * SINE));
    const resistanceA = arrowLine({ x: shape.carA.x + 4, y: shape.carA.y - 42 }, shape.aUp, forceLength(values.resistanceA));
    const resistanceB = arrowLine({ x: shape.carB.x - 3, y: shape.carB.y - 40 }, shape.bDown, forceLength(values.resistanceB));
    const tensionA = values.tension ? arrowLine({ x: shape.carA.x + 16, y: shape.carA.y - 63 }, shape.aUp, forceLength(values.tension)) : null;
    const tensionB = values.tension ? arrowLine({ x: shape.carB.x - 10, y: shape.carB.y - 62 }, shape.bUp, forceLength(values.tension)) : null;
    const motionA = arrowLine({ x: shape.carA.x - 50, y: shape.carA.y + 6 }, shape.aDown, motionLength);
    const motionB = arrowLine({ x: shape.carB.x + 50, y: shape.carB.y + 5 }, shape.bUp, motionLength);
    const stateClass = regime(values);
    return `
      <svg class="p45-svg p45-stage-${state.stage} is-${stateClass}" viewBox="0 0 720 465" role="img" aria-labelledby="p45-svg-title p45-svg-desc">
        <title id="p45-svg-title">Two funicular cars connected over a pulley on equal slopes</title>
        <desc id="p45-svg-desc">Car A contains ${format(state.water, 1)} litres of water. ${regimeLabel(values)}. The resistance threshold is ${format(MINIMUM_WATER, 1)} litres.${values.moving ? ` Acceleration is ${format(values.acceleration, 3)} metres per second squared and rope tension is ${format(values.tension / 1000, 3)} kilonewtons.` : ""}</desc>
        <defs>
          <marker id="p45-arrow-gravity" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p45-arrow-resistance" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p45-arrow-tension" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p45-arrow-motion" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <linearGradient id="p45-hills" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8c58c"/><stop offset="1" stop-color="#718259"/></linearGradient>
        </defs>

        <path class="p45-land" d="M0 330 L${shape.leftTop.x} ${format(shape.leftTop.y)} L360 ${format(shape.pulley.y + 12)} L${shape.rightTop.x} ${format(shape.rightTop.y)} L720 330 V370 H0Z"/>
        <line class="p45-track" x1="${shape.leftBase.x}" y1="${shape.leftBase.y}" x2="${shape.leftTop.x}" y2="${format(shape.leftTop.y)}"/>
        <line class="p45-track" x1="${shape.rightTop.x}" y1="${format(shape.rightTop.y)}" x2="${shape.rightBase.x}" y2="${shape.rightBase.y}"/>
        <path class="p45-rope" d="M${format(shape.carA.x)} ${format(shape.carA.y - 16)} L${format(shape.pulley.x - 24)} ${format(shape.pulley.y)} A24 24 0 0 1 ${format(shape.pulley.x + 24)} ${format(shape.pulley.y)} L${format(shape.carB.x)} ${format(shape.carB.y - 16)}"/>
        <circle class="p45-pulley" cx="${shape.pulley.x}" cy="${format(shape.pulley.y)}" r="24"/><circle class="p45-hub" cx="${shape.pulley.x}" cy="${format(shape.pulley.y)}" r="6"/>
        ${carMarkup(shape.carA, -SLOPE_DEGREES, "A", `${format(values.carAMass, 0)} kg`, true)}
        ${carMarkup(shape.carB, SLOPE_DEGREES, "B", `${format(CAR_MASS, 0)} kg`)}

        <g class="p45-angle" aria-hidden="true"><path d="M54 330 H108 A54 54 0 0 0 ${format(54 + 54 * COSINE)} ${format(330 - 54 * SINE)}"/><text x="113" y="318">θ = ${SLOPE_DEGREES}°</text></g>

        <g class="p45-force-layer">
          ${forceArrow(gravityA, "is-gravity", "mAg sinθ", "p45-arrow-gravity", "end")}
          ${forceArrow(gravityB, "is-gravity", "Mg sinθ", "p45-arrow-gravity", "start")}
          ${forceArrow(resistanceA, "is-resistance", "rA", "p45-arrow-resistance", "start")}
          ${forceArrow(resistanceB, "is-resistance", "rB", "p45-arrow-resistance", "start")}
        </g>

        <g class="p45-motion-layer">
          ${values.tension ? forceArrow(tensionA, "is-tension", `T ${format(values.tension / 1000, 2)} kN`, "p45-arrow-tension", "start") : ""}
          ${values.tension ? forceArrow(tensionB, "is-tension", "T", "p45-arrow-tension", "end") : ""}
          ${values.moving ? forceArrow(motionA, "is-motion", `a ${format(values.acceleration, 3)}`, "p45-arrow-motion", "end") : ""}
          ${values.moving ? forceArrow(motionB, "is-motion", "same a", "p45-arrow-motion", "start") : ""}
        </g>

        <g class="p45-status" transform="translate(244 344)">
          <rect width="232" height="47" rx="12"/><text class="p45-status-kicker" x="116" y="17" text-anchor="middle">CURRENT STATE</text><text class="p45-status-value" x="116" y="35" text-anchor="middle">${regimeLabel(values)}</text>
        </g>

        <g class="p45-water-scale">
          <text x="76" y="410">Water in car A</text>
          <line class="p45-scale-base" x1="76" y1="433" x2="644" y2="433"/>
          <line class="p45-scale-go" x1="${format(thresholdX)}" y1="433" x2="644" y2="433"/>
          <line class="p45-threshold" x1="${format(thresholdX)}" y1="419" x2="${format(thresholdX)}" y2="445"/>
          <path class="p45-current" d="M${format(currentX - 7)} 414 L${format(currentX + 7)} 414 L${format(currentX)} 427 Z"/>
          <text x="76" y="453">0 L</text><text x="${format(thresholdX)}" y="453" text-anchor="middle">threshold ${format(MINIMUM_WATER, 1)} L</text><text x="644" y="453" text-anchor="end">${MAX_WATER} L</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = mechanics(state.water);
    const marginCopy = values.moving
      ? `${format(values.netDrive, 1)} N surplus drive after resistance.`
      : values.limiting
        ? "Water drive exactly matches the modelled resistance."
        : `${format(Math.abs(values.netDrive), 1)} N short of the A-down resistance limit.`;
    return `
      <section class="p45-metrics is-${regime(values)}" aria-live="polite">
        <div><span>Limiting water</span><strong>${state.stage >= 1 || state.revealed ? `${format(MINIMUM_WATER, 1)} L` : "stage 2"}</strong></div>
        <div><span>Current acceleration</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.acceleration, 3)} m/s²` : "stage 3"}</strong></div>
        <div><span>Current rope tension</span><strong>${state.stage >= 2 || state.revealed ? (values.tension ? `${format(values.tension / 1000, 3)} kN` : "— at rest") : "stage 3"}</strong></div>
        <p><strong>${regimeLabel(values)}.</strong> ${marginCopy}</p>
      </section>`;
  }

  function controlsMarkup() {
    return `
      <section class="p45-controls" aria-label="Water loading control">
        <label for="p45-water"><span>Water in car A<strong data-p45-water-output>${format(state.water, 1)} L</strong></span><input id="p45-water" type="range" min="0" max="${MAX_WATER}" step="0.1" value="${state.water}"/></label>
        <div class="p45-scale-labels"><span>empty</span><span>more downhill pull</span><span>${MAX_WATER} L</span></div>
        <div class="p45-presets" role="group" aria-label="Water loading presets">
          <button class="chip-button" type="button" data-problem-action="p45-water-preset" data-p45-water="0">Empty</button>
          <button class="chip-button" type="button" data-problem-action="p45-water-preset" data-p45-water="100">Below threshold</button>
          <button class="chip-button" type="button" data-problem-action="p45-water-preset" data-p45-water="${format(MINIMUM_WATER, 1)}">Just enough</button>
          <button class="chip-button" type="button" data-problem-action="p45-water-preset" data-p45-water="${CHALLENGE_WATER}">Challenge · 300 L</button>
          <button class="chip-button" type="button" data-problem-action="p45-water-preset" data-p45-water="500">500 L</button>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p45-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p45-solution" aria-labelledby="p45-solution-heading">
        <h3 id="p45-solution-heading" tabindex="-1">Let the rope cancel itself</h3>
        <p>Let q be the water mass in kilograms. Because water has density 1 kg/L here, q has the same numerical value as the water volume in litres. Taking A down and B up as positive:</p>
        <div class="p45-equation">A: (M+q)g sinθ−T−μ(M+q)g cosθ=(M+q)a<br>B: T−Mg sinθ−μMg cosθ=Ma</div>
        <p>Adding eliminates T and the equal empty-car slope components:</p>
        <div class="p45-equation">g[q sinθ−μ(2M+q)cosθ]=(2M+q)a</div>
        <p>At the limiting amount a=0, so</p>
        <div class="p45-equation">qmin = 2μM cosθ/(sinθ−μ cosθ) = ${format(MINIMUM_WATER, 3)} kg ≈ ${format(MINIMUM_WATER, 1)} L</div>
        <p>Exactly at this value the acceleration is zero; any excess gives A-down motion in this idealised resistance model.</p>
        <p>For q=${CHALLENGE_WATER} kg:</p>
        <div class="p45-equation">a = ${format(CHALLENGE.netDrive, 3)} N / ${format(CHALLENGE.totalMass, 0)} kg = ${format(CHALLENGE.acceleration, 4)} m/s²</div>
        <p>Using the rising car B:</p>
        <div class="p45-equation">T=M[a+g(sinθ+μ cosθ)] = ${format(CHALLENGE.tension, 2)} N = ${format(CHALLENGE.tension / 1000, 4)} kN</div>
        <p class="p45-insight"><strong>Checks.</strong> The A and B equations give the same tension to rounding. With μ=0 the threshold falls to zero, and increasing θ reduces the required water. Units are N for force, kg for mass, m/s² for acceleration and N = kg·m/s².</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = mechanics(state.water);
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: "title and difficulty only",
      emptyCarMassKg: CAR_MASS,
      slopeDegrees: SLOPE_DEGREES,
      resistanceCoefficient: RESISTANCE_COEFFICIENT,
      waterLitresAndKg: state.water,
      limitingWaterLitres: Number(MINIMUM_WATER.toFixed(6)),
      downhillDriveMarginNewtons: Number(values.netDrive.toFixed(6)),
      accelerationMetresPerSecondSquared: values.moving ? Number(values.acceleration.toFixed(6)) : 0,
      tensionNewtons: values.tension ? Number(values.tension.toFixed(6)) : null,
      motionState: regime(values),
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell dyn4-shell p45-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive dynamics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread dyn4-spread p45-spread">
          <article class="book-page p45-problem-page">
            <div class="problem-number">Problem 4.5</div>
            <h1 class="book-title dyn4-title p45-title">Water-powered funicular</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            ${reconstructionNote()}
            <p class="problem-copy">Two identical 1000 kg cars run on parallel 20° slopes and are joined by a light rope over an ideal pulley. Water is added to upper car A; 1 litre has mass 1 kg.</p>
            <p class="problem-copy">Each moving car experiences resistance μN opposite its motion, with μ=0.020. Find the limiting water needed for A to pull B uphill. Then, with 300 L aboard, find the acceleration and rope tension.</p>
            <section class="p45-data-card">
              <strong>Model direction</strong>
              <p>Assume impending or actual motion has A descending and B rising. “Limiting water” means the A-down gravitational drive just matches the stated resistance model; at equality a=0.</p>
            </section>
            <section class="p45-assumption-card">
              <strong>Idealisation</strong>
              <p>The rope and pulley are massless and frictionless, the slopes have the same angle, water stays in the tank, and μN is used as a simple common running-resistance law.</p>
            </section>
          </article>

          <section class="book-page book-stage dyn4-stage p45-stage">
            ${stageControls()}
            <div class="p45-visual-card"><div data-p45-svg-slot>${funicularSvg()}</div>${stageCaption()}</div>
            ${controlsMarkup()}
            <div data-p45-metrics-slot>${metricsMarkup()}</div>
          </section>

          <aside class="book-page book-coach p45-coach">
            <div class="coach-kicker">Fill, balance, release</div>
            <p class="coach-question">Give the limiting water, then the acceleration and tension when car A contains 300 L.</p>
            <form class="p45-answer-form" data-p45-answer-form novalidate>
              <label for="p45-water-answer">Limiting water volume</label>
              <div><input id="p45-water-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.waterAnswer)}" placeholder="e.g. 120" autocomplete="off"/><span>L</span></div>
              <label for="p45-acceleration-answer">Acceleration with 300 L</label>
              <div><input id="p45-acceleration-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.accelerationAnswer)}" placeholder="e.g. 0.25" autocomplete="off"/><span>m/s²</span></div>
              <label for="p45-tension-answer">Rope tension with 300 L</label>
              <div><input id="p45-tension-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.tensionAnswer)}" placeholder="e.g. 3.8" autocomplete="off"/><span>kN</span></div>
              <button class="primary-button" type="submit">Check the funicular</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p45-help-row">
              <button class="secondary-button" type="button" data-problem-action="p45-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p45-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
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
    const root = document.querySelector(".p45-shell");
    if (!root) return;
    const svgSlot = root.querySelector("[data-p45-svg-slot]");
    const metricsSlot = root.querySelector("[data-p45-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = funicularSvg();
    if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const output = root.querySelector("[data-p45-water-output]");
    if (output) output.textContent = `${format(state.water, 1)} L`;
    const slider = root.querySelector("#p45-water");
    slider?.setAttribute("aria-valuetext", `${format(state.water, 1)} litres; ${regimeLabel()}`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p45-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p45-water");
          return;
        }
        if (action === "p45-stage") {
          state.stage = clamp(Number(control.dataset.p45Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p45-stage="${state.stage}"]`);
          return;
        }
        if (action === "p45-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p45-stage="${state.stage}"]`);
          return;
        }
        if (action === "p45-water-preset") {
          state.water = clamp(Number(control.dataset.p45Water), 0, MAX_WATER);
          renderAndFocus(renderApp, "#p45-water");
          return;
        }
        if (action === "p45-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p45-reveal") {
          state.revealed = true;
          state.stage = 2;
          state.water = CHALLENGE_WATER;
        }
        renderApp();
        if (action === "p45-reveal") window.requestAnimationFrame(() => document.querySelector("#p45-solution-heading")?.focus());
      });
    });

    document.querySelector("#p45-water")?.addEventListener("input", (event) => {
      state.water = clamp(Number(event.target.value), 0, MAX_WATER);
      updateDynamicDom();
    });

    const waterInput = document.querySelector("#p45-water-answer");
    const accelerationInput = document.querySelector("#p45-acceleration-answer");
    const tensionInput = document.querySelector("#p45-tension-answer");
    waterInput?.addEventListener("input", (event) => { state.waterAnswer = sanitizeNumber(event.target.value); });
    accelerationInput?.addEventListener("input", (event) => { state.accelerationAnswer = sanitizeNumber(event.target.value); });
    tensionInput?.addEventListener("input", (event) => { state.tensionAnswer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p45-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.waterAnswer = sanitizeNumber(waterInput?.value).trim();
      state.accelerationAnswer = sanitizeNumber(accelerationInput?.value).trim();
      state.tensionAnswer = sanitizeNumber(tensionInput?.value).trim();
      const water = Number(state.waterAnswer);
      const acceleration = Number(state.accelerationAnswer);
      const tension = Number(state.tensionAnswer);
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.waterAnswer || !state.accelerationAnswer || !state.tensionAnswer || !Number.isFinite(water) || !Number.isFinite(acceleration) || !Number.isFinite(tension)) {
        state.feedback = "Enter all three values, using litres, metres per second squared and kilonewtons as labelled.";
      } else if (Math.abs(water - MINIMUM_WATER) > 0.4) {
        state.feedback = "At the water threshold set a=0 after adding the two car equations. Remember that the water also increases car A’s rolling resistance.";
      } else if (Math.abs(acceleration - CHALLENGE.acceleration) > 0.004) {
        state.feedback = "Use the total moving mass 2M+q in Fnet=(2M+q)a. With 300 L, the total mass is 2300 kg.";
      } else if (Math.abs(tension - CHALLENGE.tension / 1000) > 0.012) {
        state.feedback = "Use the rising car B for tension: T−Mg sinθ−μMg cosθ=Ma, and report T in kilonewtons.";
      } else {
        state.feedbackTone = "success";
        state.committed = true;
        state.water = CHALLENGE_WATER;
        state.stage = 2;
        state.feedback = `Correct: ${format(MINIMUM_WATER, 1)} L is limiting; with 300 L, a=${format(CHALLENGE.acceleration, 4)} m/s² and T=${format(CHALLENGE.tension / 1000, 4)} kN.`;
      }
      renderAndFocus(renderApp, "#p45-water-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
