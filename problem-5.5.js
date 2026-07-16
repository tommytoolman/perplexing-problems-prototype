(function registerProfessorLazyRidePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "5.5";
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ mass: 100, length: 4, ratingKn: 3 });
  const stages = Object.freeze([
    Object.freeze({ short: "Orbit", title: "Let the chair find its cone", copy: "Below a lower threshold the chair hangs beneath the pivot. Above it, the cable tilts and the chair traces a horizontal circle." }),
    Object.freeze({ short: "Forces", title: "One tension supplies two components", copy: "The vertical component supports the chair and rider; the horizontal component supplies centripetal acceleration." }),
    Object.freeze({ short: "Rating", title: "Compare tension with the cable rating", copy: "Faster rotation increases tension as ω². The last safe setting occurs when T reaches the stated support rating." }),
  ]);
  const hints = Object.freeze([
    "Let θ be the cable angle from vertical and r=L sinθ. Resolve tension vertically and horizontally towards the axis.",
    "Vertical balance gives T cosθ=Mg. Radially, T sinθ=Mω²r.",
    "For a non-zero orbit r=L sinθ. Cancel sinθ in the radial equation to obtain T=Mω²L.",
    "The conical branch begins at ω²L=g. Cable failure is a different, higher threshold: set Mω²L=Tmax.",
    "Solve ωmax=√[Tmax/(ML)] in rad/s, then multiply by 60/(2π) to obtain revolutions per minute.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p55-reset">Reset</button>';

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

  function rpmFromOmega(omega) {
    return omega * 60 / (2 * Math.PI);
  }

  function omegaFromRpm(rpm) {
    return Number(rpm) * 2 * Math.PI / 60;
  }

  function thresholds(length, mass, ratingKn) {
    const liftOmega = Math.sqrt(GRAVITY / length);
    const failureOmega = Math.sqrt(ratingKn * 1000 / (mass * length));
    return {
      liftOmega,
      failureOmega,
      liftRpm: rpmFromOmega(liftOmega),
      failureRpm: rpmFromOmega(failureOmega),
    };
  }

  const CHALLENGE_THRESHOLDS = thresholds(CHALLENGE.length, CHALLENGE.mass, CHALLENGE.ratingKn);

  const initialState = () => ({
    rpm: 20,
    length: CHALLENGE.length,
    mass: CHALLENGE.mass,
    ratingKn: CHALLENGE.ratingKn,
    stage: 0,
    answer: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function rideFor(rpm = state.rpm, length = state.length, mass = state.mass, ratingKn = state.ratingKn) {
    const omega = omegaFromRpm(rpm);
    const limits = thresholds(length, mass, ratingKn);
    const conical = omega > limits.liftOmega + 1e-8;
    const cosine = conical ? clamp(GRAVITY / (omega ** 2 * length), 0, 1) : 1;
    const angle = conical ? Math.acos(cosine) : 0;
    const radius = length * Math.sin(angle);
    const tension = conical ? mass * omega ** 2 * length : mass * GRAVITY;
    const rating = ratingKn * 1000;
    const margin = rating - tension;
    const radialAcceleration = omega ** 2 * radius;
    return { omega, limits, conical, cosine, angle, angleDegrees: angle * 180 / Math.PI, radius, tension, rating, margin, radialAcceleration };
  }

  function regime(values = rideFor()) {
    if (values.tension > values.rating + 0.5) return "failed";
    if (Math.abs(values.tension - values.rating) <= 0.5) return "limit";
    if (!values.conical) return "hanging";
    return "safe";
  }

  function regimeLabel(values = rideFor()) {
    const current = regime(values);
    if (current === "failed") return "Cable rating exceeded · support fails";
    if (current === "limit") return "Exactly at the cable rating";
    if (current === "hanging") return "Below swing-out threshold · chair hangs";
    return "Stable conical orbit · cable within rating";
  }

  function reconstructionNote() {
    return `
      <p class="circ5-reconstruction-note p55-reconstruction-note">
        <strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. The scenario, values, interaction and solution below are newly written; they do not reproduce the book’s wording or solution.
      </p>`;
  }

  function stageControls() {
    return `
      <div class="p55-stage-controls" role="group" aria-label="Rotating ride analysis stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p55-stage" data-p55-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p55-stage-caption">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p55-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Support resolved" : "Next stage"}</button>
      </div>`;
  }

  function arrow(origin, direction, length) {
    return { x1: origin.x, y1: origin.y, x2: origin.x + direction.x * length, y2: origin.y + direction.y * length };
  }

  function forceMarkup(line, className, marker, label, anchor = "middle") {
    return `<g class="p55-force ${className}"><line x1="${format(line.x1)}" y1="${format(line.y1)}" x2="${format(line.x2)}" y2="${format(line.y2)}" marker-end="url(#${marker})"/><text x="${format(line.x2)}" y="${format(line.y2 - 9)}" text-anchor="${anchor}">${label}</text></g>`;
  }

  function rideSvg() {
    const values = rideFor();
    const pivot = { x: 250, y: 73 };
    const scale = 45;
    const cablePixels = state.length * scale;
    const chair = { x: pivot.x + cablePixels * Math.sin(values.angle), y: pivot.y + cablePixels * Math.cos(values.angle) };
    const orbitRadius = values.radius * scale;
    const tensionDirection = values.conical
      ? { x: -Math.sin(values.angle), y: -Math.cos(values.angle) }
      : { x: 0, y: -1 };
    const forceOrigin = { x: chair.x, y: chair.y + 4 };
    const tensionLength = clamp(38 + values.tension / (state.mass * GRAVITY) * 22, 55, 105);
    const tensionLine = arrow(forceOrigin, tensionDirection, tensionLength);
    const weightLine = arrow(forceOrigin, { x: 0, y: 1 }, 62);
    const radialLine = arrow({ x: chair.x, y: chair.y - 27 }, { x: -1, y: 0 }, clamp(30 + values.radialAcceleration * 2.2, 30, 92));
    const gauge = { left: 78, right: 644, y: 435, maximum: 80 };
    const liftX = gauge.left + clamp(values.limits.liftRpm / gauge.maximum, 0, 1) * (gauge.right - gauge.left);
    const failureX = gauge.left + clamp(values.limits.failureRpm / gauge.maximum, 0, 1) * (gauge.right - gauge.left);
    const currentX = gauge.left + clamp(state.rpm / gauge.maximum, 0, 1) * (gauge.right - gauge.left);
    return `
      <svg class="p55-svg p55-stage-${state.stage} is-${regime(values)}" viewBox="0 0 720 475" role="img" aria-labelledby="p55-svg-title p55-svg-desc">
        <title id="p55-svg-title">A chain-swing chair moving as a conical pendulum</title>
        <desc id="p55-svg-desc">The suspended mass is ${format(state.mass, 0)} kilograms on a ${format(state.length, 1)} metre cable rotating at ${format(state.rpm, 1)} revolutions per minute. ${regimeLabel(values)}. Orbit radius ${format(values.radius, 2)} metres, cable angle ${format(values.angleDegrees, 1)} degrees and tension ${format(values.tension / 1000, 3)} kilonewtons. Cable rating ${format(state.ratingKn, 2)} kilonewtons.</desc>
        <defs>
          <marker id="p55-arrow-tension" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p55-arrow-weight" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p55-arrow-radial" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p55-arrow-orbit" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
        </defs>

        <path class="p55-sky" d="M0 0H720V475H0Z"/>
        <path class="p55-mast" d="M215 390 H285 L265 73 H235 Z"/><path class="p55-arm" d="M224 73 H276 L250 45 Z"/>
        <line class="p55-axis" x1="${pivot.x}" y1="53" x2="${pivot.x}" y2="388"/>
        ${orbitRadius > 0.5 ? `<ellipse class="p55-orbit" cx="${pivot.x}" cy="${format(chair.y + 17)}" rx="${format(orbitRadius)}" ry="${format(Math.max(7, orbitRadius * 0.16))}"/><path class="p55-orbit-arrow" d="M${format(pivot.x - orbitRadius * 0.63)} ${format(chair.y + 17 - Math.max(7, orbitRadius * 0.16) * 0.78)} A${format(orbitRadius)} ${format(Math.max(7, orbitRadius * 0.16))} 0 0 1 ${format(pivot.x + orbitRadius * 0.18)} ${format(chair.y + 17 - Math.max(7, orbitRadius * 0.16) * 0.98)}" marker-end="url(#p55-arrow-orbit)"/>` : ""}
        <line class="p55-cable" x1="${pivot.x}" y1="${pivot.y}" x2="${format(chair.x)}" y2="${format(chair.y)}"/>
        <circle class="p55-pivot" cx="${pivot.x}" cy="${pivot.y}" r="7"/>

        <g class="p55-chair ${regime(values) === "failed" ? "is-failed" : ""}" transform="translate(${format(chair.x)} ${format(chair.y)})">
          <path class="p55-seat" d="M-24 7 H24 V18 H-24 Z M-20 7 V-25 H-12 V7"/>
          <circle class="p55-head" cx="2" cy="-43" r="11"/>
          <path class="p55-person" d="M0-31 L-3-7 L17 7 M-2-21 L18-12 M-3-7 L-20 13"/>
          <text x="0" y="40" text-anchor="middle">Professor Lazy</text>
        </g>

        <g class="p55-geometry-layer">
          <path class="p55-angle" d="M${pivot.x} ${pivot.y + 45} A45 45 0 0 0 ${format(pivot.x + 45 * Math.sin(values.angle))} ${format(pivot.y + 45 * Math.cos(values.angle))}"/>
          <text x="${format(pivot.x + 52)}" y="${format(pivot.y + 42)}">θ=${format(values.angleDegrees, 1)}°</text>
          <line class="p55-radius" x1="${pivot.x}" y1="${format(chair.y)}" x2="${format(chair.x)}" y2="${format(chair.y)}"/><text x="${format((pivot.x + chair.x) / 2)}" y="${format(chair.y - 8)}" text-anchor="middle">r=${format(values.radius, 2)} m</text>
        </g>

        <g class="p55-force-layer">
          ${forceMarkup(tensionLine, "is-tension", "p55-arrow-tension", `T ${format(values.tension / 1000, 2)} kN`, "end")}
          ${forceMarkup(weightLine, "is-weight", "p55-arrow-weight", `Mg ${format(state.mass * GRAVITY / 1000, 2)} kN`, "start")}
          ${values.conical ? forceMarkup(radialLine, "is-radial", "p55-arrow-radial", `ω²r ${format(values.radialAcceleration, 1)} m/s²`, "end") : ""}
        </g>

        <g class="p55-status" transform="translate(478 120)"><rect width="206" height="55" rx="13"/><text class="p55-status-kicker" x="103" y="20" text-anchor="middle">SUPPORT STATE</text><text class="p55-status-value" x="103" y="40" text-anchor="middle">${regimeLabel(values)}</text></g>

        <g class="p55-gauge-layer">
          <text class="p55-gauge-title" x="${gauge.left}" y="409">Ride speed · revolutions per minute</text>
          <line class="p55-gauge-base" x1="${gauge.left}" y1="${gauge.y}" x2="${gauge.right}" y2="${gauge.y}"/>
          <line class="p55-gauge-cone" x1="${format(liftX)}" y1="${gauge.y}" x2="${format(failureX)}" y2="${gauge.y}"/>
          <line class="p55-lift-tick" x1="${format(liftX)}" y1="421" x2="${format(liftX)}" y2="449"/>
          <line class="p55-failure-tick" x1="${format(failureX)}" y1="419" x2="${format(failureX)}" y2="451"/>
          <path class="p55-current" d="M${format(currentX - 7)} 414 L${format(currentX + 7)} 414 L${format(currentX)} 428 Z"/>
          <text x="${gauge.left}" y="464">0</text><text x="${format(liftX)}" y="464" text-anchor="middle">swing-out ${format(values.limits.liftRpm, 1)}</text><text x="${format(failureX)}" y="464" text-anchor="middle">rating ${format(values.limits.failureRpm, 1)}</text><text x="${gauge.right}" y="464" text-anchor="end">80</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = rideFor();
    const margin = values.margin >= 0 ? `${format(values.margin / 1000, 3)} kN spare` : `${format(Math.abs(values.margin) / 1000, 3)} kN over`;
    return `
      <section class="p55-metrics is-${regime(values)}" aria-live="polite">
        <div><span>Orbit geometry</span><strong>r=${format(values.radius, 2)} m · θ=${format(values.angleDegrees, 1)}°</strong></div>
        <div><span>Cable tension</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.tension / 1000, 3)} kN` : "stage 2"}</strong></div>
        <div><span>Support margin</span><strong>${state.stage >= 2 || state.revealed ? margin : "stage 3"}</strong><small>${state.stage >= 2 || state.revealed ? `rating threshold ${format(values.limits.failureRpm, 2)} rpm` : "compare T with Tmax"}</small></div>
        <p><strong>${regimeLabel(values)}.</strong> Swing-out begins at ${format(values.limits.liftRpm, 2)} rpm; cable rating is reached at ${format(values.limits.failureRpm, 2)} rpm.</p>
      </section>`;
  }

  function controlsMarkup() {
    return `
      <section class="p55-controls" aria-label="Rotating ride controls">
        <label for="p55-rpm"><span>Angular speed<strong data-p55-output="rpm">${format(state.rpm, 1)} rpm</strong></span><input id="p55-rpm" type="range" min="0" max="80" step="0.1" value="${state.rpm}"/></label>
        <label for="p55-length"><span>Cable length L<strong data-p55-output="length">${format(state.length, 1)} m</strong></span><input id="p55-length" type="range" min="2" max="6" step="0.1" value="${state.length}"/></label>
        <label for="p55-mass"><span>Suspended mass M<strong data-p55-output="mass">${format(state.mass, 0)} kg</strong></span><input id="p55-mass" type="range" min="50" max="150" step="1" value="${state.mass}"/></label>
        <label for="p55-rating"><span>Cable rating Tmax<strong data-p55-output="rating">${format(state.ratingKn, 2)} kN</strong></span><input id="p55-rating" type="range" min="1.5" max="6" step="0.05" value="${state.ratingKn}"/></label>
        <div class="p55-presets" role="group" aria-label="Ride presets">
          <button class="chip-button" type="button" data-problem-action="p55-challenge">Challenge setup</button>
          <button class="chip-button" type="button" data-problem-action="p55-hanging">Hanging</button>
          <button class="chip-button" type="button" data-problem-action="p55-safe">Safe cone</button>
          <button class="chip-button" type="button" data-problem-action="p55-overload">Overload</button>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p55-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const failure = rideFor(CHALLENGE_THRESHOLDS.failureRpm, CHALLENGE.length, CHALLENGE.mass, CHALLENGE.ratingKn);
    return `
      <section class="p55-solution" aria-labelledby="p55-solution-heading">
        <h3 id="p55-solution-heading" tabindex="-1">The cable carries the centripetal load</h3>
        <p>Let θ be measured from vertical and r=L sinθ. For a steady horizontal circle:</p>
        <div class="p55-equation">T cosθ=Mg<br>T sinθ=Mω²r</div>
        <p>For a non-zero radius, substitute r=L sinθ and cancel sinθ:</p>
        <div class="p55-equation">T=Mω²L, &nbsp; cosθ=g/(ω²L)</div>
        <p>The conical branch starts when ω²L=g, at ${format(CHALLENGE_THRESHOLDS.liftRpm, 3)} rpm. Cable failure is the separate condition T=Tmax:</p>
        <div class="p55-equation">ωmax=√[Tmax/(ML)]=${format(CHALLENGE_THRESHOLDS.failureOmega, 6)} rad/s</div>
        <div class="p55-equation p55-answer-equation">nmax=60ωmax/(2π)=${format(CHALLENGE_THRESHOLDS.failureRpm, 4)} rpm</div>
        <p>At that limit θ=${format(failure.angleDegrees, 3)}° and r=${format(failure.radius, 3)} m. The requested last safe setting is therefore <strong>${format(CHALLENGE_THRESHOLDS.failureRpm, 2)} rpm</strong>.</p>
        <p class="p55-insight"><strong>Checks.</strong> At swing-out, θ→0 and T→Mg. If Tmax=Mg, swing-out and cable failure coincide. The failure angular speed scales as L⁻¹ᐟ² and M⁻¹ᐟ². Since Tmax/(ML) has units s⁻², its square root has units rad/s; rpm requires the factor 60/(2π).</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = rideFor();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: "title and difficulty only",
      rpm: state.rpm,
      omegaRadiansPerSecond: Number(values.omega.toFixed(6)),
      cableLengthMetres: state.length,
      suspendedMassKg: state.mass,
      cableRatingKn: state.ratingKn,
      coneAngleDegrees: Number(values.angleDegrees.toFixed(6)),
      orbitRadiusMetres: Number(values.radius.toFixed(6)),
      tensionNewtons: Number(values.tension.toFixed(6)),
      swingOutThresholdRpm: Number(values.limits.liftRpm.toFixed(6)),
      failureThresholdRpm: Number(values.limits.failureRpm.toFixed(6)),
      supportState: regime(values),
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell circ5-shell p55-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circular motion</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread circ5-spread p55-spread">
          <article class="book-page p55-problem-page">
            <div class="problem-number">Problem 5.5</div>
            <h1 class="book-title circ5-title p55-title">The last ride of Professor Lazy</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">Professor Lazy and his chair have combined suspended mass 100 kg. They hang from a 4.0 m cable on a rotating chain-swing ride. The cable is rated to 3.0 kN.</p>
            <p class="problem-copy"><strong>At what rotation rate, in revolutions per minute, does the cable first reach its rating?</strong></p>
            <section class="p55-model-card"><strong>Steady-cone model</strong><p>The pivot rotates steadily, the cable is massless, and the chair settles into a horizontal circular orbit. Aerodynamic drag and start-up transients are ignored.</p></section>
            <section class="p55-threshold-card"><strong>Two different thresholds</strong><p>The chair must first swing out from vertical. Cable failure occurs later, when tension—not angle or radius—reaches the support rating.</p></section>
          </article>
          <section class="book-page book-stage circ5-stage p55-stage">
            ${stageControls()}
            <div class="p55-visual-card"><div data-p55-svg-slot>${rideSvg()}</div>${stageCaption()}</div>
            ${controlsMarkup()}
            <div data-p55-metrics-slot>${metricsMarkup()}</div>
          </section>
          <aside class="book-page book-coach p55-coach">
            <div class="coach-kicker">Find the last safe turn</div>
            <p class="coach-question">For M=100 kg, L=4.0 m and Tmax=3.0 kN, calculate the cable-rating threshold.</p>
            <form class="p55-answer-form" data-p55-answer-form novalidate>
              <label for="p55-answer">Maximum rotation rate</label>
              <div><input id="p55-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 25" autocomplete="off"/><span>rpm</span></div>
              <button class="primary-button" type="submit">Check cable rating</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p55-help-row"><button class="secondary-button" type="button" data-problem-action="p55-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p55-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="circ5-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p55-shell");
    if (!root) return;
    const svgSlot = root.querySelector("[data-p55-svg-slot]");
    const metricsSlot = root.querySelector("[data-p55-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = rideSvg();
    if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = { rpm: `${format(state.rpm, 1)} rpm`, length: `${format(state.length, 1)} m`, mass: `${format(state.mass, 0)} kg`, rating: `${format(state.ratingKn, 2)} kN` };
    Object.entries(outputs).forEach(([key, value]) => { const node = root.querySelector(`[data-p55-output="${key}"]`); if (node) node.textContent = value; });
    const values = rideFor();
    root.querySelector("#p55-rpm")?.setAttribute("aria-valuetext", `${format(state.rpm, 1)} revolutions per minute; ${regimeLabel(values)}`);
    root.querySelector("#p55-length")?.setAttribute("aria-valuetext", `${format(state.length, 1)} metre cable; cable threshold ${format(values.limits.failureRpm, 2)} revolutions per minute`);
    root.querySelector("#p55-mass")?.setAttribute("aria-valuetext", `${format(state.mass, 0)} kilograms suspended; cable threshold ${format(values.limits.failureRpm, 2)} revolutions per minute`);
    root.querySelector("#p55-rating")?.setAttribute("aria-valuetext", `${format(state.ratingKn, 2)} kilonewton rating; cable threshold ${format(values.limits.failureRpm, 2)} revolutions per minute`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function currentLimits() {
    return thresholds(state.length, state.mass, state.ratingKn);
  }

  function restoreChallenge(rpm = 20) {
    state.length = CHALLENGE.length;
    state.mass = CHALLENGE.mass;
    state.ratingKn = CHALLENGE.ratingKn;
    state.rpm = rpm;
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p55-reset") { state = initialState(); renderAndFocus(renderApp, "#p55-rpm"); return; }
        if (action === "p55-stage") { state.stage = clamp(Number(control.dataset.p55Stage), 0, 2); renderAndFocus(renderApp, `[data-p55-stage="${state.stage}"]`); return; }
        if (action === "p55-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p55-stage="${state.stage}"]`); return; }
        if (action === "p55-challenge") { restoreChallenge(); renderAndFocus(renderApp, "#p55-rpm"); return; }
        if (action === "p55-hanging") { state.rpm = clamp(currentLimits().liftRpm * 0.75, 0, 80); renderAndFocus(renderApp, "#p55-rpm"); return; }
        if (action === "p55-safe") { const limits = currentLimits(); state.rpm = clamp((limits.liftRpm + limits.failureRpm) / 2, 0, 80); renderAndFocus(renderApp, "#p55-rpm"); return; }
        if (action === "p55-overload") { state.rpm = clamp(currentLimits().failureRpm + 4, 0, 80); renderAndFocus(renderApp, "#p55-rpm"); return; }
        if (action === "p55-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p55-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(CHALLENGE_THRESHOLDS.failureRpm); }
        renderApp();
        if (action === "p55-reveal") window.requestAnimationFrame(() => document.querySelector("#p55-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p55-rpm", key: "rpm", minimum: 0, maximum: 80 },
      { selector: "#p55-length", key: "length", minimum: 2, maximum: 6 },
      { selector: "#p55-mass", key: "mass", minimum: 50, maximum: 150 },
      { selector: "#p55-rating", key: "ratingKn", minimum: 1.5, maximum: 6 },
    ].forEach(({ selector, key, minimum, maximum }) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));

    const answerInput = document.querySelector("#p55-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p55-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = sanitizeNumber(answerInput?.value).trim();
      const answer = Number(state.answer);
      const target = CHALLENGE_THRESHOLDS.failureRpm;
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one rotation rate in revolutions per minute.";
      else if (Math.abs(answer - target) <= 0.08) { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(target); state.feedback = `Correct: the 3.0 kN cable rating is reached at ${format(target, 4)} rpm.`; }
      else if (Math.abs(answer - CHALLENGE_THRESHOLDS.failureOmega) <= 0.08) state.feedback = "That is the correct angular speed in rad/s. Multiply by 60/(2π) to convert it to rpm.";
      else if (Math.abs(answer - CHALLENGE_THRESHOLDS.liftRpm) <= 0.12) state.feedback = "That is the lower swing-out threshold. The cable remains well below its rating there; use T=Mω²L for the failure threshold.";
      else state.feedback = "Set the conical-orbit tension Mω²L equal to 3000 N, then convert the resulting rad/s to rpm.";
      renderAndFocus(renderApp, "#p55-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
