(function registerOscillatingSpherePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "6.1";
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ bowlRadius: 1.2, sphereRadius: 0.2, amplitude: 80 });
  const stages = Object.freeze([
    Object.freeze({ short: "Geometry", title: "Follow the sphere’s centre", copy: "The sphere touches the bowl, but its centre travels on a smaller circular arc of radius ℓ=R−a." }),
    Object.freeze({ short: "SHM", title: "Linearise the restoring force", copy: "The exact tangential acceleration is −g sinθ. For small angles in radians, sinθ≈θ, giving simple harmonic motion." }),
    Object.freeze({ short: "Exact", title: "Measure the amplitude correction", copy: "The exact nonlinear period contains a complete elliptic integral and grows with release amplitude; the SHM period does not." }),
  ]);
  const hints = Object.freeze([
    "Track the centre of the sphere. If the bowl radius is R and sphere radius is a, its path radius is ℓ=R−a.",
    "Resolve gravity tangent to the circular path: ℓθ¨=−g sinθ.",
    "For small θ measured in radians, sinθ≈θ. Then θ¨+(g/ℓ)θ=0, so ω₀=√(g/ℓ).",
    "The SHM period is T₀=2π√(ℓ/g). It is independent of amplitude only because sinθ has been replaced by θ.",
    "For finite release amplitude A, T=4√(ℓ/g)K(sin(A/2)), where K is the complete elliptic integral of the first kind.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p61-reset">Reset</button>';

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 3) {
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

  function ellipticK(modulus) {
    const k = clamp(modulus, 0, 0.999999999999);
    let arithmetic = 1;
    let geometric = Math.sqrt(1 - k ** 2);
    for (let iteration = 0; iteration < 50; iteration += 1) {
      const nextArithmetic = (arithmetic + geometric) / 2;
      const nextGeometric = Math.sqrt(arithmetic * geometric);
      arithmetic = nextArithmetic;
      geometric = nextGeometric;
      if (Math.abs(arithmetic - geometric) < 1e-14) break;
    }
    return Math.PI / (2 * arithmetic);
  }

  function oscillationFor(bowlRadius = state.bowlRadius, sphereRadius = state.sphereRadius, amplitude = state.amplitude) {
    const pathRadius = bowlRadius - sphereRadius;
    const amplitudeRadians = radians(amplitude);
    const angularFrequency = Math.sqrt(GRAVITY / pathRadius);
    const shmPeriod = 2 * Math.PI / angularFrequency;
    const modulus = Math.sin(amplitudeRadians / 2);
    const exactPeriod = 4 * Math.sqrt(pathRadius / GRAVITY) * ellipticK(modulus);
    const correction = exactPeriod / shmPeriod - 1;
    const restoringRatio = amplitudeRadians > 1e-10 ? Math.sin(amplitudeRadians) / amplitudeRadians : 1;
    return { pathRadius, amplitudeRadians, angularFrequency, shmPeriod, modulus, exactPeriod, correction, restoringRatio };
  }

  const CHALLENGE_RESULT = oscillationFor(CHALLENGE.bowlRadius, CHALLENGE.sphereRadius, CHALLENGE.amplitude);

  const initialState = () => ({
    bowlRadius: CHALLENGE.bowlRadius,
    sphereRadius: CHALLENGE.sphereRadius,
    amplitude: 10,
    stage: 0,
    shmAnswer: "",
    exactAnswer: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function approximationLabel(values = oscillationFor()) {
    if (values.correction < 0.005) return "SHM is excellent at this amplitude";
    if (values.correction < 0.03) return "Small but visible nonlinear correction";
    if (values.correction < 0.1) return "SHM now underestimates the period";
    return "Strongly nonlinear · exact period required";
  }

  function reconstructionNote() {
    return `<p class="osc6-reconstruction-note p61-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. The scenario, values, interaction and solution below are newly written; they do not reproduce the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p61-stage-controls" role="group" aria-label="Oscillation analysis stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p61-stage" data-p61-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p61-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p61-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Periods compared" : "Next stage"}</button></div>`;
  }

  function forceArrow(origin, direction, length, className, marker, label, anchor = "middle") {
    const end = { x: origin.x + direction.x * length, y: origin.y + direction.y * length };
    return `<g class="p61-force ${className}"><line x1="${format(origin.x)}" y1="${format(origin.y)}" x2="${format(end.x)}" y2="${format(end.y)}" marker-end="url(#${marker})"/><text x="${format(end.x)}" y="${format(end.y - 9)}" text-anchor="${anchor}">${label}</text></g>`;
  }

  function bowlSvg() {
    const values = oscillationFor();
    const centre = { x: 292, y: 77 };
    const bowlPixels = 205;
    const spherePixels = clamp(bowlPixels * state.sphereRadius / state.bowlRadius, 10, 46);
    const pathPixels = bowlPixels - spherePixels;
    const theta = values.amplitudeRadians;
    const sphere = { x: centre.x + pathPixels * Math.sin(theta), y: centre.y + pathPixels * Math.cos(theta) };
    const bottom = { x: centre.x, y: centre.y + pathPixels };
    const gravityOrigin = { x: sphere.x, y: sphere.y };
    const tangentTowardBottom = { x: -Math.cos(theta), y: Math.sin(theta) };
    const normalTowardCentre = { x: -Math.sin(theta), y: -Math.cos(theta) };
    const tangentLength = 28 + 58 * Math.sin(theta);
    const correctionScale = { left: 78, right: 642, y: 434, maximum: 85 };
    const currentX = correctionScale.left + state.amplitude / correctionScale.maximum * (correctionScale.right - correctionScale.left);
    const correctionWidth = clamp(values.correction / 0.18, 0, 1) * 180;
    const rimLeft = { x: centre.x - bowlPixels, y: centre.y };
    const rimRight = { x: centre.x + bowlPixels, y: centre.y };
    return `
      <svg class="p61-svg p61-stage-${state.stage}" viewBox="0 0 720 475" role="img" aria-labelledby="p61-svg-title p61-svg-desc">
        <title id="p61-svg-title">Sphere released from rest inside a smooth spherical bowl</title>
        <desc id="p61-svg-desc">Bowl radius ${format(state.bowlRadius, 2)} metres, sphere radius ${format(state.sphereRadius, 2)} metres and centre-path radius ${format(values.pathRadius, 2)} metres. Release amplitude ${format(state.amplitude, 0)} degrees. SHM period ${format(values.shmPeriod, 4)} seconds; exact nonlinear period ${format(values.exactPeriod, 4)} seconds, ${format(values.correction * 100, 2)} percent longer.</desc>
        <defs>
          <marker id="p61-arrow-gravity" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p61-arrow-tangent" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p61-arrow-normal" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <radialGradient id="p61-sphere-shade" cx="35%" cy="30%"><stop offset="0" stop-color="#f7c997"/><stop offset="1" stop-color="#b35d32"/></radialGradient>
        </defs>
        <path class="p61-sky" d="M0 0H720V475H0Z"/>
        <path class="p61-bowl-fill" d="M${rimLeft.x} ${rimLeft.y} A${bowlPixels} ${bowlPixels} 0 0 0 ${rimRight.x} ${rimRight.y} L${rimRight.x + 42} ${rimRight.y + 38} Q${centre.x} ${centre.y + bowlPixels + 72} ${rimLeft.x - 42} ${rimLeft.y + 38}Z"/>
        <path class="p61-bowl" d="M${rimLeft.x} ${rimLeft.y} A${bowlPixels} ${bowlPixels} 0 0 0 ${rimRight.x} ${rimRight.y}"/>
        <circle class="p61-centre" cx="${centre.x}" cy="${centre.y}" r="5"/><text class="p61-centre-label" x="${centre.x + 10}" y="${centre.y - 8}">bowl centre</text>
        <path class="p61-centre-path" d="M${format(centre.x - pathPixels)} ${centre.y} A${format(pathPixels)} ${format(pathPixels)} 0 0 0 ${format(centre.x + pathPixels)} ${centre.y}"/>
        <line class="p61-path-radius" x1="${centre.x}" y1="${centre.y}" x2="${format(sphere.x)}" y2="${format(sphere.y)}"/><text class="p61-radius-label" x="${format((centre.x + sphere.x) / 2 + 8)}" y="${format((centre.y + sphere.y) / 2)}">ℓ=R−a=${format(values.pathRadius, 2)} m</text>
        <path class="p61-angle" d="M${centre.x} ${centre.y + 54} A54 54 0 0 0 ${format(centre.x + 54 * Math.sin(theta))} ${format(centre.y + 54 * Math.cos(theta))}"/><text class="p61-angle-label" x="${format(centre.x + 63)}" y="${format(centre.y + 52)}">A=${format(state.amplitude, 0)}°</text>
        <line class="p61-amplitude-arc" x1="${bottom.x}" y1="${bottom.y}" x2="${format(sphere.x)}" y2="${format(sphere.y)}"/>
        <g class="p61-sphere"><circle cx="${format(sphere.x)}" cy="${format(sphere.y)}" r="${format(spherePixels)}"/><path d="M${format(sphere.x - spherePixels * 0.72)} ${format(sphere.y)} Q${format(sphere.x)} ${format(sphere.y - spherePixels * 0.45)} ${format(sphere.x + spherePixels * 0.72)} ${format(sphere.y)}"/></g>

        <g class="p61-force-layer">
          ${forceArrow(gravityOrigin, { x: 0, y: 1 }, 67, "is-gravity", "p61-arrow-gravity", "g", "start")}
          ${forceArrow(gravityOrigin, tangentTowardBottom, tangentLength, "is-tangent", "p61-arrow-tangent", `g sinA=${format(GRAVITY * Math.sin(theta), 2)}`, "end")}
          ${forceArrow(gravityOrigin, normalTowardCentre, 48, "is-normal", "p61-arrow-normal", "normal", "start")}
        </g>

        <g class="p61-status" transform="translate(516 42)"><rect width="174" height="72" rx="13"/><text class="p61-status-kicker" x="87" y="20" text-anchor="middle">APPROXIMATION</text><text class="p61-status-value" x="87" y="40" text-anchor="middle">${approximationLabel(values)}</text><text class="p61-status-detail" x="87" y="59" text-anchor="middle">exact is ${format(values.correction * 100, 2)}% longer</text></g>

        <g class="p61-period-layer">
          <text class="p61-period-title" x="${correctionScale.left}" y="399">Amplitude correction to the SHM period</text>
          <line class="p61-period-base" x1="${correctionScale.left}" y1="${correctionScale.y}" x2="${correctionScale.right}" y2="${correctionScale.y}"/>
          <line class="p61-period-growth" x1="${correctionScale.left}" y1="${correctionScale.y}" x2="${format(currentX)}" y2="${correctionScale.y}"/>
          <path class="p61-current" d="M${format(currentX - 7)} 414 L${format(currentX + 7)} 414 L${format(currentX)} 428 Z"/>
          <rect class="p61-correction-bar" x="450" y="382" width="${format(correctionWidth)}" height="11" rx="5"/>
          <text x="${correctionScale.left}" y="461">0° · SHM limit</text><text x="${format(currentX)}" y="461" text-anchor="middle">${format(state.amplitude, 0)}°</text><text x="${correctionScale.right}" y="461" text-anchor="end">85°</text><text class="p61-correction-label" x="446" y="390" text-anchor="end">+${format(values.correction * 100, 2)}%</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = oscillationFor();
    return `<section class="p61-metrics" aria-live="polite"><div><span>Centre-path radius</span><strong>ℓ=${format(values.pathRadius, 3)} m</strong></div><div><span>SHM prediction</span><strong>ω₀=${format(values.angularFrequency, 3)} rad/s</strong><small>T₀=${format(values.shmPeriod, 4)} s</small></div><div><span>Exact nonlinear period</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.exactPeriod, 4)} s` : "stage 3"}</strong><small>${state.stage >= 2 || state.revealed ? `+${format(values.correction * 100, 2)}% vs SHM` : "finite-amplitude correction"}</small></div><p><strong>${approximationLabel(values)}.</strong> At the turning point, sinA/A=${format(values.restoringRatio, 3)} when A is measured in radians.</p></section>`;
  }

  function controlsMarkup() {
    return `<section class="p61-controls" aria-label="Oscillating sphere controls"><label for="p61-amplitude"><span>Release amplitude A<strong data-p61-output="amplitude">${format(state.amplitude, 0)}°</strong></span><input id="p61-amplitude" type="range" min="1" max="85" step="1" value="${state.amplitude}"/></label><label for="p61-bowl"><span>Bowl radius R<strong data-p61-output="bowl">${format(state.bowlRadius, 2)} m</strong></span><input id="p61-bowl" type="range" min="0.5" max="3" step="0.05" value="${state.bowlRadius}"/></label><label for="p61-sphere"><span>Sphere radius a<strong data-p61-output="sphere">${format(state.sphereRadius, 2)} m</strong></span><input id="p61-sphere" type="range" min="0.05" max="0.45" step="0.01" value="${state.sphereRadius}"/></label><div class="p61-presets" role="group" aria-label="Amplitude presets"><button class="chip-button" type="button" data-problem-action="p61-challenge">Challenge · 80°</button><button class="chip-button" type="button" data-problem-action="p61-amplitude" data-p61-amplitude="5">Small · 5°</button><button class="chip-button" type="button" data-problem-action="p61-amplitude" data-p61-amplitude="45">Moderate · 45°</button><button class="chip-button" type="button" data-problem-action="p61-amplitude" data-p61-amplitude="80">Nonlinear · 80°</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p61-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p61-solution" aria-labelledby="p61-solution-heading"><h3 id="p61-solution-heading" tabindex="-1">The centre moves like a pendulum</h3><p>The centre of the sphere follows a circle of radius ℓ=R−a=1.00 m. Resolving gravity tangent to that path gives the exact equation</p><div class="p61-equation">ℓθ¨=−g sinθ</div><p>For |θ|≪1 rad, sinθ≈θ:</p><div class="p61-equation">θ¨+(g/ℓ)θ=0, &nbsp; ω₀=√(g/ℓ), &nbsp; T₀=2π√(ℓ/g)</div><div class="p61-equation p61-answer-equation">ω₀=${format(CHALLENGE_RESULT.angularFrequency, 6)} rad/s, &nbsp; T₀=${format(CHALLENGE_RESULT.shmPeriod, 6)} s</div><p>At finite release amplitude A the exact period is</p><div class="p61-equation">T(A)=4√(ℓ/g)K(sin(A/2))</div><p>For A=80°:</p><div class="p61-equation p61-answer-equation">T(80°)=${format(CHALLENGE_RESULT.exactPeriod, 6)} s · ${format(CHALLENGE_RESULT.correction * 100, 3)}% longer than T₀</div><p class="p61-insight"><strong>Checks.</strong> As A→0, K(0)=π/2 and the exact result tends to T₀. The quantity g/ℓ has units s⁻², so ω₀ has units rad/s and T has units seconds. This is a smooth, sliding contact: if the sphere rolled without slipping, rotational kinetic energy would change the period.</p></section>`;
  }

  function stateSnapshot() {
    const values = oscillationFor();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", bowlRadiusMetres: state.bowlRadius, sphereRadiusMetres: state.sphereRadius, centrePathRadiusMetres: Number(values.pathRadius.toFixed(6)), releaseAmplitudeDegrees: state.amplitude, smallAngularFrequencyRadiansPerSecond: Number(values.angularFrequency.toFixed(6)), shmPeriodSeconds: Number(values.shmPeriod.toFixed(6)), exactPeriodSeconds: Number(values.exactPeriod.toFixed(6)), exactPeriodIncreasePercent: Number((values.correction * 100).toFixed(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell osc6-shell p61-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive oscillations</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread osc6-spread p61-spread"><article class="book-page p61-problem-page"><div class="problem-number">Problem 6.1</div><h1 class="book-title osc6-title p61-title">Oscillating sphere</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">A small sphere slides without friction inside a spherical bowl of radius 1.20 m. The sphere’s radius is 0.20 m.</p><p class="problem-copy">Find its small-oscillation angular frequency and period. Then compare that approximation with the exact period when it is released from rest at 80° from the downward vertical.</p><section class="p61-model-card"><strong>What moves?</strong><p>The contact point lies on the bowl, but the sphere’s centre follows a circle of radius R−a. The sphere slides; it does not roll.</p></section><section class="p61-angle-card"><strong>Amplitude boundary</strong><p>The controls stop at 85°, just inside the hemispherical bowl’s rim. Angles in the linearisation must be measured in radians.</p></section></article><section class="book-page book-stage osc6-stage p61-stage">${stageControls()}<div class="p61-visual-card"><div data-p61-svg-slot>${bowlSvg()}</div>${stageCaption()}</div>${controlsMarkup()}<div data-p61-metrics-slot>${metricsMarkup()}</div></section><aside class="book-page book-coach p61-coach"><div class="coach-kicker">Compare the two clocks</div><p class="coach-question">For R=1.20 m and a=0.20 m, give the SHM period and the exact period at A=80°.</p><form class="p61-answer-form" data-p61-answer-form novalidate><label for="p61-shm-answer">Small-amplitude period T₀</label><div><input id="p61-shm-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.shmAnswer)}" placeholder="e.g. 2.00" autocomplete="off"/><span>s</span></div><label for="p61-exact-answer">Exact period at 80°</label><div><input id="p61-exact-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.exactAnswer)}" placeholder="e.g. 2.25" autocomplete="off"/><span>s</span></div><button class="primary-button" type="submit">Check both periods</button></form>${feedbackMarkup()}<div class="button-row p61-help-row"><button class="secondary-button" type="button" data-problem-action="p61-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p61-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="osc6-debug">${debugPanel("Development state", stateSnapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p61-shell");
    if (!root) return;
    const svgSlot = root.querySelector("[data-p61-svg-slot]");
    const metricsSlot = root.querySelector("[data-p61-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = bowlSvg();
    if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = { amplitude: `${format(state.amplitude, 0)}°`, bowl: `${format(state.bowlRadius, 2)} m`, sphere: `${format(state.sphereRadius, 2)} m` };
    Object.entries(outputs).forEach(([key, value]) => { const node = root.querySelector(`[data-p61-output="${key}"]`); if (node) node.textContent = value; });
    const values = oscillationFor();
    root.querySelector("#p61-amplitude")?.setAttribute("aria-valuetext", `${format(state.amplitude, 0)} degree amplitude; exact period ${format(values.correction * 100, 2)} percent longer than SHM`);
    root.querySelector("#p61-bowl")?.setAttribute("aria-valuetext", `${format(state.bowlRadius, 2)} metre bowl radius; centre path radius ${format(values.pathRadius, 2)} metres`);
    root.querySelector("#p61-sphere")?.setAttribute("aria-valuetext", `${format(state.sphereRadius, 2)} metre sphere radius; centre path radius ${format(values.pathRadius, 2)} metres`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p61-reset") { state = initialState(); renderAndFocus(renderApp, "#p61-amplitude"); return; }
      if (action === "p61-stage") { state.stage = clamp(Number(control.dataset.p61Stage), 0, 2); renderAndFocus(renderApp, `[data-p61-stage="${state.stage}"]`); return; }
      if (action === "p61-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p61-stage="${state.stage}"]`); return; }
      if (action === "p61-challenge") { state.bowlRadius = CHALLENGE.bowlRadius; state.sphereRadius = CHALLENGE.sphereRadius; state.amplitude = CHALLENGE.amplitude; renderAndFocus(renderApp, "#p61-amplitude"); return; }
      if (action === "p61-amplitude") { state.amplitude = clamp(Number(control.dataset.p61Amplitude), 1, 85); renderAndFocus(renderApp, "#p61-amplitude"); return; }
      if (action === "p61-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p61-reveal") { state.revealed = true; state.stage = 2; state.bowlRadius = CHALLENGE.bowlRadius; state.sphereRadius = CHALLENGE.sphereRadius; state.amplitude = CHALLENGE.amplitude; }
      renderApp();
      if (action === "p61-reveal") window.requestAnimationFrame(() => document.querySelector("#p61-solution-heading")?.focus());
    }));

    [{ selector: "#p61-amplitude", key: "amplitude", min: 1, max: 85 }, { selector: "#p61-bowl", key: "bowlRadius", min: 0.5, max: 3 }, { selector: "#p61-sphere", key: "sphereRadius", min: 0.05, max: 0.45 }].forEach(({ selector, key, min, max }) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), min, max); updateDynamicDom(); }));

    const shmInput = document.querySelector("#p61-shm-answer");
    const exactInput = document.querySelector("#p61-exact-answer");
    shmInput?.addEventListener("input", (event) => { state.shmAnswer = sanitizeNumber(event.target.value); });
    exactInput?.addEventListener("input", (event) => { state.exactAnswer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p61-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.shmAnswer = sanitizeNumber(shmInput?.value).trim();
      state.exactAnswer = sanitizeNumber(exactInput?.value).trim();
      const shm = Number(state.shmAnswer), exact = Number(state.exactAnswer);
      state.feedbackTone = "warn"; state.committed = false;
      if (!state.shmAnswer || !state.exactAnswer || !Number.isFinite(shm) || !Number.isFinite(exact)) state.feedback = "Enter both periods in seconds.";
      else if (Math.abs(shm - CHALLENGE_RESULT.shmPeriod) > 0.006) state.feedback = "Use the centre-path radius ℓ=R−a=1.00 m, not the bowl radius R, in T₀=2π√(ℓ/g).";
      else if (Math.abs(exact - CHALLENGE_RESULT.exactPeriod) > 0.006) state.feedback = "The 80° result needs the finite-amplitude elliptic-integral correction; SHM underestimates this period.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.bowlRadius = CHALLENGE.bowlRadius; state.sphereRadius = CHALLENGE.sphereRadius; state.amplitude = CHALLENGE.amplitude; state.feedback = `Correct: T₀=${format(CHALLENGE_RESULT.shmPeriod, 6)} s and T(80°)=${format(CHALLENGE_RESULT.exactPeriod, 6)} s, ${format(CHALLENGE_RESULT.correction * 100, 3)}% longer.`; }
      renderAndFocus(renderApp, "#p61-shm-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
