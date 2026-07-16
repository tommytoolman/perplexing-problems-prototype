(function registerSidewaysTickPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "20.1";
  const LIGHT_SPEED_METRES_PER_SECOND = 3e8;
  const PROPER_TICK_SECONDS = 1e-6;
  const CHALLENGE_BETA = 0.6;
  const PLAYBACK_MILLISECONDS = 4000;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Proper tick", title: "The clock measures its own proper time", copy: "In the train frame the clock is at rest. A complete tick goes from the lower mirror to the upper mirror and back to the same lower mirror, so the two tick events occur at one train-frame position." }),
    Object.freeze({ short: "Diagonal", title: "The platform sees the whole clock move sideways", copy: "Light still travels at c, but the mirrors move while it is in flight. Each vertical leg in the train frame becomes a longer diagonal leg in the platform frame." }),
    Object.freeze({ short: "Gamma", title: "Unfold the reflection into one right triangle", copy: "The full lab light path cΔt is the hypotenuse, the proper-frame light path cΔτ is vertical and the train displacement vΔt is horizontal. Pythagoras gives Δt=γΔτ." }),
  ]);
  const hints = Object.freeze([
    "The 1.00 μs interval is proper time because the complete tick starts and ends at the same lower mirror in the train frame.",
    "In the platform frame, light still moves at c. Its total path is cΔt while the train moves horizontally by vΔt.",
    "Unfold the upward and downward photon legs into one straight diagonal: (cΔt)²=(cΔτ)²+(vΔt)².",
    "Rearrange to Δt=Δτ/√(1−v²/c²)=γΔτ.",
    "At v=0.60c, γ=1/√(1−0.60²)=1/0.80=1.25.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p201-reset">Reset</button>';

  function initialState() { return { beta: CHALLENGE_BETA, photonProgress: 0, stage: 0, playing: false, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();
  let animationFrame = null;
  let playbackStartedAt = null;
  let lastAnimationPaint = 0;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function svgNumber(value, digits = 3) { return Number(value.toFixed(digits)); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.,eE+\-\s]/g, "").replace(",", ".").slice(0, 24); }

  function clockData(beta = state.beta, photonProgress = state.photonProgress) {
    const gamma = 1 / Math.sqrt(1 - beta ** 2);
    const coordinateTickSeconds = gamma * PROPER_TICK_SECONDS;
    const properLightPathMetres = LIGHT_SPEED_METRES_PER_SECOND * PROPER_TICK_SECONDS;
    const mirrorSeparationMetres = properLightPathMetres / 2;
    const trainDisplacementMetres = beta * LIGHT_SPEED_METRES_PER_SECOND * coordinateTickSeconds;
    const labLightPathMetres = LIGHT_SPEED_METRES_PER_SECOND * coordinateTickSeconds;
    const halfLabLightPathMetres = labLightPathMetres / 2;
    const currentTrainDisplacementMetres = trainDisplacementMetres * photonProgress;
    const currentPhotonHeightMetres = photonProgress <= .5 ? 2 * photonProgress * mirrorSeparationMetres : 2 * (1 - photonProgress) * mirrorSeparationMetres;
    const phase = photonProgress === 0 ? "emission at lower mirror" : photonProgress < .5 ? "upward leg" : photonProgress === .5 ? "reflection at upper mirror" : photonProgress < 1 ? "return leg" : "return to lower mirror";
    return {
      beta,
      gamma,
      coordinateTickSeconds,
      coordinateTickMicroseconds: coordinateTickSeconds * 1e6,
      properTickSeconds: PROPER_TICK_SECONDS,
      properTickMicroseconds: PROPER_TICK_SECONDS * 1e6,
      properLightPathMetres,
      mirrorSeparationMetres,
      trainDisplacementMetres,
      labLightPathMetres,
      halfLabLightPathMetres,
      currentTrainDisplacementMetres,
      currentPhotonHeightMetres,
      phase,
      triangleResidualSquareMetres: labLightPathMetres ** 2 - properLightPathMetres ** 2 - trainDisplacementMetres ** 2,
      intervalResidualSquareMetres: (LIGHT_SPEED_METRES_PER_SECOND * coordinateTickSeconds) ** 2 - trainDisplacementMetres ** 2 - (LIGHT_SPEED_METRES_PER_SECOND * PROPER_TICK_SECONDS) ** 2,
      gammaIdentityResidual: gamma * Math.sqrt(1 - beta ** 2) - 1,
    };
  }

  const challenge = Object.freeze(clockData(CHALLENGE_BETA, 1));

  function originalExtensionNote() { return `<p class="p201-extension-note">${EXTENSION_DISCLOSURE}</p>`; }
  function stageControls() { return `<div class="p201-stage-controls" role="group" aria-label="Time-dilation reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p201-stage" data-p201-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaption() { const stage = stages[state.stage]; return `<div class="p201-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p201-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Tick transformed" : "Next stage"}</button></div>`; }

  function photonHeightY(progress, bottomY, topY) { return progress <= .5 ? bottomY + (topY - bottomY) * 2 * progress : topY + (bottomY - topY) * 2 * (progress - .5); }

  function clockSvg() {
    const values = clockData();
    const scale = .8;
    const trainX = 133, platformStartX = 320;
    const bottomY = 397, topY = bottomY - values.mirrorSeparationMetres * scale, unfoldedY = bottomY - values.properLightPathMetres * scale;
    const basePixels = values.trainDisplacementMetres * scale;
    const platformEndX = platformStartX + basePixels;
    const platformMidX = platformStartX + basePixels / 2;
    const currentPlatformX = platformStartX + basePixels * state.photonProgress;
    const photonY = photonHeightY(state.photonProgress, bottomY, topY);
    const trainPath = `M${trainX} ${bottomY}L${trainX} ${svgNumber(topY)}L${trainX} ${bottomY}`;
    const platformPath = `M${platformStartX} ${bottomY}L${svgNumber(platformMidX)} ${svgNumber(topY)}L${svgNumber(platformEndX)} ${bottomY}`;
    const traceDash = `${svgNumber(state.photonProgress, 4)} 1`;
    const progressLabel = state.photonProgress === 0 ? "emit" : state.photonProgress === .5 ? "reflect" : state.photonProgress === 1 ? "tick" : `${format(state.photonProgress * 100, 0)}%`;
    const description = `A complete light-clock tick lasts ${format(values.properTickMicroseconds, 2)} microseconds in the train frame. The mirrors are ${format(values.mirrorSeparationMetres, 1)} metres apart and the up-and-back proper light path is ${format(values.properLightPathMetres, 1)} metres. At train speed ${format(values.beta, 2)} c, gamma is ${format(values.gamma, 5)} and the platform tick interval is ${format(values.coordinateTickMicroseconds, 5)} microseconds. The train moves ${format(values.trainDisplacementMetres, 3)} metres during the tick and the two platform-frame diagonal photon legs total ${format(values.labLightPathMetres, 3)} metres. Photon progress is ${progressLabel}, during the ${values.phase}.`;
    return `<svg class="p201-clock p201-stage-${state.stage}" viewBox="0 0 760 450" role="img" aria-labelledby="p201-clock-title p201-clock-desc"><title id="p201-clock-title">A light-clock tick in the train and platform frames</title><desc id="p201-clock-desc">${description}</desc><defs><linearGradient id="p201-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172b3a"/><stop offset="1" stop-color="#292642"/></linearGradient><radialGradient id="p201-photon-glow"><stop offset="0" stop-color="#fffbd0"/><stop offset=".35" stop-color="#f0c55d" stop-opacity=".9"/><stop offset="1" stop-color="#f0c55d" stop-opacity="0"/></radialGradient><marker id="p201-dimension-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p201-board" x="1" y="1" width="758" height="448" rx="19"/><text class="p201-board-kicker" x="24" y="27">ONE CLOCK · ONE PAIR OF TICK EVENTS · TWO REFERENCE-FRAME DESCRIPTIONS</text><g class="p201-train-panel"><rect x="20" y="43" width="225" height="384" rx="15"/><text class="p201-panel-kicker" x="35" y="67">TRAIN FRAME · CLOCK AT REST</text><text class="p201-panel-time" x="230" y="92" text-anchor="end">Δτ=${format(values.properTickMicroseconds, 2)} μs</text><g class="p201-rest-clock"><rect class="p201-clock-column" x="${trainX - 27}" y="${svgNumber(topY - 18)}" width="54" height="${svgNumber(bottomY - topY + 36)}" rx="18"/><rect class="p201-mirror" x="${trainX - 38}" y="${svgNumber(bottomY - 5)}" width="76" height="10" rx="4"/><rect class="p201-mirror" x="${trainX - 38}" y="${svgNumber(topY - 5)}" width="76" height="10" rx="4"/><text class="p201-mirror-label" x="${trainX + 46}" y="${svgNumber(topY + 3)}">upper</text><text class="p201-mirror-label" x="${trainX + 46}" y="${bottomY + 3}">lower</text><path class="p201-train-path-ghost" d="${trainPath}"/><path class="p201-train-path-trace" d="${trainPath}" pathLength="1" stroke-dasharray="${traceDash}"/><g class="p201-photon" transform="translate(${trainX} ${svgNumber(photonY)})"><circle r="18"/><circle class="p201-photon-core" r="5"/></g></g><g class="p201-proper-ledger"><text x="35" y="118">mirror gap</text><text x="230" y="118" text-anchor="end">${format(values.mirrorSeparationMetres, 0)} m</text><text x="35" y="138">full light path cΔτ</text><text x="230" y="138" text-anchor="end">${format(values.properLightPathMetres, 0)} m</text></g><text class="p201-proper-note" x="132" y="418" text-anchor="middle">emit and return at the same lower mirror</text></g><g class="p201-platform-panel"><rect x="258" y="43" width="482" height="384" rx="15"/><text class="p201-panel-kicker" x="273" y="67">PLATFORM FRAME · CLOCK MOVES SIDEWAYS</text><text class="p201-panel-time" x="725" y="92" text-anchor="end">Δt=${format(values.coordinateTickMicroseconds, 3)} μs</text><g class="p201-platform-scene"><line class="p201-platform-ground" x1="280" y1="414" x2="722" y2="414"/><g class="p201-moving-car" transform="translate(${svgNumber(currentPlatformX)} 0)"><rect x="-31" y="${svgNumber(topY - 24)}" width="62" height="${svgNumber(bottomY - topY + 48)}" rx="18"/><rect class="p201-mirror" x="-38" y="${svgNumber(bottomY - 5)}" width="76" height="10" rx="4"/><rect class="p201-mirror" x="-38" y="${svgNumber(topY - 5)}" width="76" height="10" rx="4"/></g><path class="p201-platform-path-ghost" d="${platformPath}"/><path class="p201-platform-path-trace" d="${platformPath}" pathLength="1" stroke-dasharray="${traceDash}"/><g class="p201-photon" transform="translate(${svgNumber(currentPlatformX)} ${svgNumber(photonY)})"><circle r="18"/><circle class="p201-photon-core" r="5"/></g><text class="p201-path-label" x="${svgNumber(platformMidX)}" y="${svgNumber(topY - 13)}" text-anchor="middle">reflection</text></g><g class="p201-unfolded"><path class="p201-unfolded-hypotenuse" d="M${platformStartX} ${bottomY}L${svgNumber(platformEndX)} ${svgNumber(unfoldedY)}"/><line class="p201-unfolded-base" x1="${platformStartX}" y1="${bottomY}" x2="${svgNumber(platformEndX)}" y2="${bottomY}"/><line class="p201-unfolded-height" x1="${svgNumber(platformEndX)}" y1="${bottomY}" x2="${svgNumber(platformEndX)}" y2="${svgNumber(unfoldedY)}"/><path class="p201-right-angle" d="M${svgNumber(platformEndX - 12)} ${bottomY}V${bottomY - 12}H${svgNumber(platformEndX)}"/><text class="p201-triangle-label is-base" x="${svgNumber((platformStartX + platformEndX) / 2)}" y="${bottomY + 18}" text-anchor="middle">vΔt=${format(values.trainDisplacementMetres, 1)} m</text><text class="p201-triangle-label is-height" x="${svgNumber(platformEndX + 8)}" y="${svgNumber((bottomY + unfoldedY) / 2)}">cΔτ=${format(values.properLightPathMetres, 0)} m</text><text class="p201-triangle-label is-hypotenuse" x="${svgNumber((platformStartX + platformEndX) / 2 - 10)}" y="${svgNumber((bottomY + unfoldedY) / 2 - 7)}" text-anchor="middle">cΔt=${format(values.labLightPathMetres, 1)} m</text><text class="p201-unfold-note" x="273" y="116">reflection unfolded for the full-tick triangle</text></g><g class="p201-platform-ledger"><rect x="273" y="128" width="153" height="90" rx="10"/><text class="p201-ledger-kicker" x="286" y="148">PLATFORM AUDIT</text><text class="p201-ledger-label" x="286" y="173">speed</text><text class="p201-ledger-value" x="413" y="173" text-anchor="end">${format(values.beta, 2)}c</text><text class="p201-ledger-label" x="286" y="195">γ</text><text class="p201-ledger-value" x="413" y="195" text-anchor="end">${state.stage >= 2 || state.revealed ? format(values.gamma, 4) : "stage 3"}</text><text class="p201-ledger-label" x="286" y="211">tick</text><text class="p201-ledger-value is-time" x="413" y="211" text-anchor="end">${state.stage >= 2 || state.revealed ? `${format(values.coordinateTickMicroseconds, 3)} μs` : "stage 3"}</text></g></g></svg>`;
  }

  function transportMarkup() {
    const values = clockData();
    const label = state.photonProgress === 0 ? "Emission" : state.photonProgress === .5 ? "Reflection" : state.photonProgress === 1 ? "Tick complete" : values.phase;
    return `<section class="p201-transport" aria-label="Photon path controls"><div><span>Photon event</span><strong>${label}</strong><small>${format(state.photonProgress * 100, 0)}% of the complete tick</small></div><label for="p201-photon-progress"><span>Scrub photon path<output>${format(state.photonProgress * 100, 0)}%</output></span><input id="p201-photon-progress" type="range" min="0" max="1" step="0.01" value="${state.photonProgress}" aria-valuetext="${label}; train displacement so far ${format(values.currentTrainDisplacementMetres, 2)} metres"/></label><div><button class="primary-button" type="button" data-problem-action="p201-play" aria-pressed="${state.playing}">${state.playing ? "Pause" : state.photonProgress >= 1 ? "Replay tick" : "Play tick"}</button><button class="chip-button" type="button" data-problem-action="p201-moment" data-p201-progress="0">Emit</button><button class="chip-button" type="button" data-problem-action="p201-moment" data-p201-progress="0.5">Reflect</button><button class="chip-button" type="button" data-problem-action="p201-moment" data-p201-progress="1">Return</button></div></section>`;
  }

  function metricsMarkup() {
    const values = clockData();
    return `<section class="p201-metrics" aria-live="polite"><div><span>Proper tick · train</span><strong>${format(values.properTickMicroseconds, 2)} μs</strong><small>same lower-mirror position</small></div><div><span>Coordinate tick · platform</span><strong>${format(values.coordinateTickMicroseconds, 3)} μs</strong><small>events ${format(values.trainDisplacementMetres, 1)} m apart</small></div><div><span>Lorentz factor</span><strong>γ=${format(values.gamma, 4)}</strong><small>Δt=γΔτ</small></div></section>`;
  }

  function noMalfunctionMarkup() {
    const values = clockData();
    return `<div class="p201-clock-note" role="status"><strong>The clock does not malfunction.</strong> The train observer records the usual ${format(values.properTickMicroseconds, 2)} μs local tick. The platform observer assigns ${format(values.coordinateTickMicroseconds, 3)} μs between the same emission-and-return events because those events occur at different platform positions.</div>`;
  }

  function dynamicMarkup() { return `<div class="p201-dynamic"><div class="p201-clock-wrap">${clockSvg()}${transportMarkup()}</div>${metricsMarkup()}${noMalfunctionMarkup()}</div>`; }

  function speedControlsMarkup() {
    const values = clockData();
    return `<section class="p201-controls" aria-label="Train speed control"><label for="p201-speed"><span>Train speed v/c<output data-p201-output="speed">${format(state.beta, 2)}c</output></span><input id="p201-speed" type="range" min="0" max="0.8" step="0.01" value="${state.beta}" aria-valuetext="${format(state.beta, 2)} times light speed; gamma ${format(values.gamma, 4)}; platform tick ${format(values.coordinateTickMicroseconds, 3)} microseconds"/></label><p data-p201-control-note>The proper tick remains 1.00 μs at every speed. Increasing v changes the platform geometry: γ=${format(values.gamma, 4)}, horizontal displacement ${format(values.trainDisplacementMetres, 1)} m and total lab light path ${format(values.labLightPathMetres, 1)} m.</p><button class="chip-button" type="button" data-problem-action="p201-challenge">Restore 0.60c challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p201-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p201-solution" aria-labelledby="p201-solution-heading"><h3 id="p201-solution-heading" tabindex="-1">The longer diagonal path requires more platform time</h3><p>A complete train-frame tick begins when the photon leaves the lower mirror and ends when it returns there. The train clock is at rest and both events occur at the same train position, so Δτ=1.00 μs is the proper interval. During that tick the photon travels</p><div class="p201-solution-equation">cΔτ=(3.00×10⁸ m/s)(1.00×10⁻⁶ s)=300 m.</div><p>Unfold the two platform-frame diagonal legs into one right triangle. Light still moves at c, while the train moves at v:</p><div class="p201-solution-equation">(cΔt)²=(cΔτ)²+(vΔt)²<br>Δt²(c²−v²)=c²Δτ²<br>Δt=Δτ/√(1−v²/c²)=γΔτ.</div><p>For v=0.60c,</p><div class="p201-solution-equation is-answer">γ=1/√(1−0.60²)=1/0.80=1.25<br>Δt=(1.25)(1.00 μs)=<strong>1.25 μs.</strong></div><p>The full-tick triangle checks the result: the train moves vΔt=(0.60c)(1.25 μs)=225 m, while light travels cΔt=375 m, and 300²+225²=375². Nothing has gone wrong with the clock; proper and coordinate time are different frame assignments to the same two tick events.</p></section>`;
  }

  function snapshot() {
    const values = clockData();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "ideal transverse light clock; complete tick is lower mirror to upper mirror and back; reflection unfolded only for triangle construction", lightSpeedMetresPerSecond: LIGHT_SPEED_METRES_PER_SECOND, trainSpeedFractionOfC: values.beta, trainSpeedMetresPerSecond: values.beta * LIGHT_SPEED_METRES_PER_SECOND, lorentzFactor: values.gamma, properTickSeconds: values.properTickSeconds, properTickMicroseconds: values.properTickMicroseconds, coordinateTickSeconds: values.coordinateTickSeconds, coordinateTickMicroseconds: values.coordinateTickMicroseconds, mirrorSeparationMetres: values.mirrorSeparationMetres, properFrameFullLightPathMetres: values.properLightPathMetres, platformFrameFullLightPathMetres: values.labLightPathMetres, platformTrainDisplacementMetres: values.trainDisplacementMetres, photonProgress: state.photonProgress, photonPhase: values.phase, currentPlatformTrainDisplacementMetres: values.currentTrainDisplacementMetres, currentPhotonHeightMetres: values.currentPhotonHeightMetres, tickEventMeaning: { start: "photon emitted at lower mirror", end: "photon returns to same lower mirror", trainFrame: "events co-located; interval is proper time", platformFrame: "events spatially separated; interval is coordinate time" }, triangleResidualSquareMetres: Number(values.triangleResidualSquareMetres.toExponential(6)), intervalResidualSquareMetres: Number(values.intervalResidualSquareMetres.toExponential(6)), gammaIdentityResidual: Number(values.gammaIdentityResidual.toExponential(6)), challenge: { speedFractionOfC: CHALLENGE_BETA, gamma: challenge.gamma, properTickMicroseconds: challenge.properTickMicroseconds, platformTickMicroseconds: challenge.coordinateTickMicroseconds, properLightPathMetres: challenge.properLightPathMetres, trainDisplacementMetres: challenge.trainDisplacementMetres, platformLightPathMetres: challenge.labLightPathMetres }, playing: state.playing, stage: state.stage + 1, answerMicroseconds: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function stopPlayback() { state.playing = false; playbackStartedAt = null; lastAnimationPaint = 0; if (animationFrame !== null && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(animationFrame); animationFrame = null; }
  function restoreChallenge() { state.beta = CHALLENGE_BETA; state.photonProgress = 0; }
  function render() {
    return `<main class="book-shell p201-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · special relativity</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p201-spread"><article class="book-page p201-problem-page"><div class="problem-number">Problem 20.1</div><h1 class="book-title p201-title">A Sideways Tick</h1><div class="difficulty" aria-label="One star difficulty">★</div>${originalExtensionNote()}<p class="problem-copy">A transverse light clock has proper tick interval Δτ=1.00 μs aboard a train moving at 0.60c relative to a platform.</p><p class="problem-copy"><strong>What tick interval Δt does an observer on the platform assign to the clock?</strong></p><section class="p201-observation-card"><strong>One complete tick returns home</strong><p>The photon travels from the lower mirror to the upper mirror and back. Its emission and return occur at the same train-frame location, making Δτ proper time.</p></section><section class="p201-model-card"><div class="eyebrow">Ideal clock</div><p>Light travels at c in both frames. The mirrors remain 150 m apart transversely; the platform sees the clock translate sideways during the tick.</p></section></article><section class="book-page book-stage p201-stage">${stageControls()}<div class="p201-visual-card">${dynamicMarkup()}${stageCaption()}</div>${speedControlsMarkup()}</section><aside class="book-page book-coach p201-coach"><div class="coach-kicker">Transform one tick</div><p class="coach-question">For Δτ=1.00 μs and v=0.60c, enter the platform-frame tick interval.</p><form class="p201-answer-form" data-p201-answer-form novalidate><label for="p201-answer">Platform tick interval Δt</label><div><input id="p201-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="time interval" autocomplete="off"/><span>μs</span></div><button class="primary-button" type="submit">Check interval</button></form>${feedbackMarkup()}<div class="button-row p201-help-row"><button class="secondary-button" type="button" data-problem-action="p201-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p201-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p201-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p201-shell"); if (!root) { stopPlayback(); return; }
    const dynamic = root.querySelector(".p201-dynamic");
    const active = document.activeElement;
    let restoreFocusSelector = "";
    if (dynamic?.contains(active)) {
      if (active.id === "p201-photon-progress") restoreFocusSelector = "#p201-photon-progress";
      else if (active.dataset?.problemAction === "p201-play") restoreFocusSelector = '[data-problem-action="p201-play"]';
      else if (active.dataset?.problemAction === "p201-moment") restoreFocusSelector = `[data-problem-action="p201-moment"][data-p201-progress="${active.dataset.p201Progress}"]`;
    }
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = clockData();
    const output = root.querySelector('[data-p201-output="speed"]'); if (output) output.textContent = `${format(state.beta, 2)}c`;
    const note = root.querySelector("[data-p201-control-note]"); if (note) note.textContent = `The proper tick remains 1.00 μs at every speed. Increasing v changes the platform geometry: γ=${format(values.gamma, 4)}, horizontal displacement ${format(values.trainDisplacementMetres, 1)} m and total lab light path ${format(values.labLightPathMetres, 1)} m.`;
    root.querySelector("#p201-speed")?.setAttribute("aria-valuetext", `${format(state.beta, 2)} times light speed; gamma ${format(values.gamma, 4)}; platform tick ${format(values.coordinateTickMicroseconds, 3)} microseconds`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (restoreFocusSelector) { const replacement = root.querySelector(restoreFocusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }

  function startPlayback() {
    if (state.photonProgress >= 1) state.photonProgress = 0;
    state.playing = true; playbackStartedAt = null; lastAnimationPaint = 0;
    const tick = (timestamp) => {
      if (!state.playing) return;
      if (!document.querySelector(".p201-shell")) { stopPlayback(); return; }
      if (playbackStartedAt === null) playbackStartedAt = timestamp - state.photonProgress * PLAYBACK_MILLISECONDS;
      state.photonProgress = clamp((timestamp - playbackStartedAt) / PLAYBACK_MILLISECONDS, 0, 1);
      const finished = state.photonProgress >= 1;
      if (finished) stopPlayback();
      if (finished || timestamp - lastAnimationPaint >= 45) { updateDynamicDom(); lastAnimationPaint = timestamp; }
      if (state.playing) animationFrame = window.requestAnimationFrame(tick);
    };
    updateDynamicDom(); animationFrame = window.requestAnimationFrame(tick);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p201-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p201-play") { if (state.playing) { stopPlayback(); updateDynamicDom(); } else startPlayback(); return; }
      stopPlayback();
      if (action === "p201-reset") { state = initialState(); renderAndFocus(renderApp, "#p201-photon-progress"); return; }
      if (action === "p201-stage") { state.stage = clamp(Number(control.dataset.p201Stage), 0, 2); renderAndFocus(renderApp, `[data-p201-stage="${state.stage}"]`); return; }
      if (action === "p201-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p201-stage="${state.stage}"]`); return; }
      if (action === "p201-moment") { state.photonProgress = clamp(Number(control.dataset.p201Progress), 0, 1); updateDynamicDom(); return; }
      if (action === "p201-challenge") restoreChallenge();
      if (action === "p201-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p201-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); state.photonProgress = 1; }
      renderApp(); if (action === "p201-reveal") window.requestAnimationFrame(() => document.querySelector("#p201-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p201-photon-progress")) { stopPlayback(); state.photonProgress = clamp(Number(event.target.value), 0, 1); updateDynamicDom(); return; }
      if (!event.target.matches("#p201-speed")) return;
      stopPlayback(); state.beta = clamp(Number(event.target.value), 0, .8); updateDynamicDom();
    });
    const input = document.querySelector("#p201-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p201-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); stopPlayback(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one numerical time interval in microseconds.";
      else if (Math.abs(answer - challenge.coordinateTickSeconds) <= 1e-7) state.feedback = "That is the interval in seconds. Enter the equivalent number of microseconds.";
      else if (Math.abs(answer - 1) <= .01) state.feedback = "1.00 μs is the clock’s proper interval in the train frame. The platform interval is γ times larger.";
      else if (Math.abs(answer - challenge.coordinateTickMicroseconds) > .015) state.feedback = "Compute γ=1/√(1−0.60²), then multiply the 1.00 μs proper tick by γ.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.photonProgress = 1; state.feedback = "Correct: γ=1.25, so the platform assigns Δt=1.25 μs to each tick."; }
      renderAndFocus(renderApp, "#p201-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
