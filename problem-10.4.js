(function registerJumpIntoSpacePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.4";
  const CHALLENGE = Object.freeze({ radiusKm: 1000, surfaceGravity: 4, launchSpeedKmS: 2 });
  const CHALLENGE_HEIGHT_KM = 1000;
  const stages = Object.freeze([
    Object.freeze({ short: "Energy", title: "Write the launch energy", copy: "Surface gravity fixes μ=gR². Add launch kinetic energy to the negative surface potential −μ/R." }),
    Object.freeze({ short: "Threshold", title: "Compare the result with zero", copy: "Negative specific energy has a finite turning point. Zero is marginal escape; positive energy leaves speed at infinity." }),
    Object.freeze({ short: "Outcome", title: "Find the turning radius or escape speed", copy: "For a bound radial launch, set the speed to zero at the top and solve ε=−μ/rmax." }),
  ]);
  const hints = Object.freeze([
    "The surface condition g=μ/R² gives μ=gR². Convert R and launch speed to metres and seconds first.",
    "Specific mechanical energy is ε=v₀²/2−μ/R=v₀²/2−gR.",
    "For R=1.00×10⁶ m, g=4.00 m/s² and v₀=2000 m/s, ε=2.00×10⁶−4.00×10⁶=−2.00×10⁶ J/kg, so the jump is bound.",
    "At the highest point v=0, so ε=−μ/rmax. Here μ=4.00×10¹² m³/s².",
    "Solve rmax=2.00×10⁶ m, then subtract the world radius to obtain height above the surface.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p104-reset">Reset</button>';

  const initialState = () => ({ radiusKm: CHALLENGE.radiusKm, surfaceGravity: CHALLENGE.surfaceGravity, launchSpeedKmS: CHALLENGE.launchSpeedKmS, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function launchData(radiusKm = state.radiusKm, surfaceGravity = state.surfaceGravity, launchSpeedKmS = state.launchSpeedKmS) {
    const radius = radiusKm * 1000;
    const launchSpeed = launchSpeedKmS * 1000;
    const gravitationalParameter = surfaceGravity * radius ** 2;
    const bindingEnergy = gravitationalParameter / radius;
    const kineticEnergy = launchSpeed ** 2 / 2;
    const specificEnergy = kineticEnergy - bindingEnergy;
    const escapeSpeed = Math.sqrt(2 * gravitationalParameter / radius);
    const tolerance = 1e-10 * Math.max(bindingEnergy, 1);
    const regime = specificEnergy < -tolerance ? "suborbital" : Math.abs(specificEnergy) <= tolerance ? "marginal" : "escape";
    const turningRadius = regime === "suborbital" ? -gravitationalParameter / specificEnergy : Infinity;
    const height = regime === "suborbital" ? turningRadius - radius : Infinity;
    const infinitySpeed = regime === "escape" ? Math.sqrt(2 * specificEnergy) : regime === "marginal" ? 0 : null;
    const speedRatio = launchSpeed / escapeSpeed;
    return { radius, launchSpeed, gravitationalParameter, bindingEnergy, kineticEnergy, specificEnergy, escapeSpeed, regime, turningRadius, height, infinitySpeed, speedRatio };
  }

  function regimeLabel(values = launchData()) {
    if (values.regime === "suborbital") return "Finite ballistic jump";
    if (values.regime === "marginal") return "Marginal escape";
    return "Unbound escape";
  }

  function outcomeValue(values = launchData()) {
    if (values.regime === "suborbital") return `hmax=${format(values.height / 1000, 2)} km`;
    if (values.regime === "marginal") return "rmax→∞ · v∞=0";
    return `v∞=${format(values.infinitySpeed / 1000, 3)} km/s`;
  }

  function reconstructionNote() {
    return `<p class="p104-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and three-star difficulty. This radial-launch problem is newly written and does not reproduce the book’s wording, numbers, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p104-stage-controls" role="group" aria-label="Radial launch energy stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p104-stage" data-p104-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p104-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p104-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Outcome resolved" : "Next stage"}</button></div>`;
  }

  function trajectoryGeometry(values) {
    const world = { x: 178, y: 352, radius: 76 };
    const surfaceY = world.y - world.radius;
    if (values.regime !== "suborbital") return { world, surfaceY, endY: 54, displayHeight: Infinity };
    const heightRatio = Math.max(0, values.height / values.radius);
    const normalized = Math.sqrt(Math.min(heightRatio, 10) / 10);
    const displayHeight = Math.min(198, 188 * normalized);
    return { world, surfaceY, endY: surfaceY - displayHeight, displayHeight };
  }

  function energyGeometry(values) {
    const startX = 390, zeroX = 535, endX = 688;
    const ratio = values.specificEnergy / values.bindingEnergy;
    const markerX = ratio < 0 ? zeroX + Math.max(-1, ratio) * (zeroX - startX) : zeroX + Math.min(1.5, ratio) / 1.5 * (endX - zeroX);
    return { startX, zeroX, endX, markerX, ratio };
  }

  function launchSvg() {
    const values = launchData();
    const trajectory = trajectoryGeometry(values);
    const energy = energyGeometry(values);
    const markerClass = values.regime === "suborbital" ? "is-bound" : values.regime === "marginal" ? "is-marginal" : "is-escape";
    const topLabel = values.regime === "suborbital" ? `turning point · r=${format(values.turningRadius / 1000, 2)} km` : values.regime === "marginal" ? "reaches infinity with zero remaining speed" : `escapes · v∞=${format(values.infinitySpeed / 1000, 3)} km/s`;
    const statusValue = state.stage === 0 ? `ε=${format(values.specificEnergy / 1e6, 4)} MJ/kg` : state.stage === 1 ? `v₀/vesc=${format(values.speedRatio, 4)}` : outcomeValue(values);
    return `<svg class="p104-svg p104-stage-${state.stage} ${markerClass}" viewBox="0 0 720 445" role="img" aria-labelledby="p104-svg-title p104-svg-desc">
      <title id="p104-svg-title">Radial launch height and specific-energy escape threshold</title>
      <desc id="p104-svg-desc">A radial launch from a world of radius ${format(state.radiusKm, 0)} kilometres and surface gravity ${format(state.surfaceGravity, 2)} metres per second squared begins at ${format(state.launchSpeedKmS, 3)} kilometres per second. Escape speed is ${format(values.escapeSpeed / 1000, 4)} kilometres per second and specific energy is ${format(values.specificEnergy / 1e6, 5)} megajoules per kilogram. ${regimeLabel(values)}. ${values.regime === "suborbital" ? `Maximum height is ${format(values.height / 1000, 3)} kilometres above the surface.` : values.regime === "marginal" ? "The object approaches infinity with zero speed." : `Asymptotic speed is ${format(values.infinitySpeed / 1000, 4)} kilometres per second.`}</desc>
      <defs><radialGradient id="p104-world-gradient" cx="35%" cy="28%"><stop offset="0" stop-color="#d6b16a"/><stop offset=".56" stop-color="#9b563b"/><stop offset="1" stop-color="#633122"/></radialGradient><marker id="p104-launch-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p104-energy-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p104-board" x="1" y="1" width="718" height="443" rx="20"/>
      <g class="p104-status" transform="translate(20 20)"><rect width="282" height="67" rx="13"/><text class="p104-status-kicker" x="15" y="21">${regimeLabel(values).toUpperCase()}</text><text class="p104-status-value" x="15" y="44">${statusValue}</text><text class="p104-status-note" x="15" y="59">${values.regime === "suborbital" ? "negative energy · bound" : values.regime === "marginal" ? "zero energy · escape boundary" : "positive energy · unbound"}</text></g>
      <g class="p104-world-layer"><circle class="p104-world" cx="${trajectory.world.x}" cy="${trajectory.world.y}" r="${trajectory.world.radius}"/><path class="p104-contour" d="M111 361Q178 320 245 361M123 387Q178 359 233 387"/><text class="p104-world-label" x="${trajectory.world.x}" y="${trajectory.world.y + 8}" text-anchor="middle">R=${format(state.radiusKm, 0)} km</text><circle class="p104-launcher" cx="${trajectory.world.x}" cy="${trajectory.surfaceY}" r="7"/></g>
      <g class="p104-outcome-layer"><line class="p104-trajectory" x1="${trajectory.world.x}" y1="${trajectory.surfaceY - 4}" x2="${trajectory.world.x}" y2="${format(trajectory.endY, 2)}" marker-end="url(#p104-launch-arrow)"/><circle class="p104-top-marker" cx="${trajectory.world.x}" cy="${format(trajectory.endY, 2)}" r="7"/><text class="p104-top-label" x="${trajectory.world.x + 14}" y="${format(Math.max(trajectory.endY - 10, 25), 2)}">${topLabel}</text>${values.regime === "suborbital" ? `<line class="p104-height-bracket" x1="240" y1="${trajectory.surfaceY}" x2="240" y2="${format(trajectory.endY, 2)}"/><text class="p104-height-label" x="251" y="${format((trajectory.surfaceY + trajectory.endY) / 2, 2)}">h=${format(values.height / 1000, 2)} km</text>` : ""}</g>
      <g class="p104-launch-label"><text x="${trajectory.world.x + 13}" y="${trajectory.surfaceY + 5}">v₀=${format(state.launchSpeedKmS, 3)} km/s upward</text></g>
      <g class="p104-energy-panel"><text class="p104-panel-title" x="390" y="111">SPECIFIC-ENERGY LEDGER</text><rect class="p104-bound-zone" x="${energy.startX}" y="145" width="${energy.zeroX - energy.startX}" height="62"/><rect class="p104-escape-zone" x="${energy.zeroX}" y="145" width="${energy.endX - energy.zeroX}" height="62"/><line class="p104-energy-axis" x1="${energy.startX}" y1="176" x2="${energy.endX}" y2="176"/><line class="p104-zero-line" x1="${energy.zeroX}" y1="132" x2="${energy.zeroX}" y2="221"/><text class="p104-zone-label" x="${(energy.startX + energy.zeroX) / 2}" y="199" text-anchor="middle">BOUND ε&lt;0</text><text class="p104-zone-label" x="${(energy.zeroX + energy.endX) / 2}" y="199" text-anchor="middle">ESCAPE ε≥0</text><text class="p104-energy-tick" x="${energy.startX}" y="137">−gR</text><text class="p104-energy-tick" x="${energy.zeroX}" y="124" text-anchor="middle">ε=0</text><line class="p104-kinetic-add" x1="${energy.startX}" y1="176" x2="${format(energy.markerX, 2)}" y2="176" marker-end="url(#p104-energy-arrow)"/><circle class="p104-energy-marker" cx="${format(energy.markerX, 2)}" cy="176" r="7"/><text class="p104-marker-label" x="${format(energy.markerX, 2)}" y="235" text-anchor="middle">ε=${format(values.specificEnergy / 1e6, 3)} MJ/kg</text></g>
      <g class="p104-threshold-layer" transform="translate(390 265)"><rect width="298" height="88" rx="14"/><text class="p104-threshold-kicker" x="16" y="22">ESCAPE TEST</text><text class="p104-threshold-value" x="16" y="47">v₀ ${values.speedRatio < 1 - 1e-10 ? "&lt;" : values.speedRatio > 1 + 1e-10 ? "&gt;" : "="} vesc</text><text class="p104-threshold-note" x="16" y="68">${format(state.launchSpeedKmS, 4)} ${values.speedRatio < 1 - 1e-10 ? "&lt;" : values.speedRatio > 1 + 1e-10 ? "&gt;" : "="} ${format(values.escapeSpeed / 1000, 4)} km/s</text><text class="p104-threshold-note" x="16" y="82">vesc=√(2gR)</text></g>
      <text class="p104-model-note" x="688" y="419" text-anchor="end">radial motion · no atmosphere · no rotation</text>
    </svg>`;
  }

  function metricsMarkup() {
    const values = launchData();
    return `<section class="p104-metrics" aria-live="polite"><div><span>Specific energy</span><strong>${format(values.specificEnergy / 1e6, 4)} MJ/kg</strong></div><div><span>Escape speed</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.escapeSpeed / 1000, 4)} km/s` : "stage 2"}</strong></div><div><span>Outcome</span><strong>${state.stage >= 2 || state.revealed ? outcomeValue(values) : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p104-dynamic">${launchSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = launchData();
    return `<section class="p104-controls" aria-label="Radial launch controls"><div class="p104-control-grid"><label for="p104-radius"><span>World radius R<output data-p104-output="radius">${format(state.radiusKm, 0)} km</output></span><input id="p104-radius" type="range" min="500" max="10000" step="50" value="${state.radiusKm}"/></label><label for="p104-gravity"><span>Surface gravity g<output data-p104-output="gravity">${format(state.surfaceGravity, 2)} m/s²</output></span><input id="p104-gravity" type="range" min="0.5" max="20" step="0.1" value="${state.surfaceGravity}"/></label><label class="p104-speed-control" for="p104-speed"><span>Radial launch speed v₀<output data-p104-output="speed">${format(state.launchSpeedKmS, 3)} km/s</output></span><input id="p104-speed" type="range" min="0" max="25" step="0.05" value="${state.launchSpeedKmS}"/></label></div><div class="p104-threshold-action"><button class="chip-button" type="button" data-problem-action="p104-threshold">Set v₀ exactly to vesc (${format(values.escapeSpeed / 1000, 3)} km/s)</button><span>At equality the turning point moves to infinity.</span></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p104-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p104-solution" aria-labelledby="p104-solution-heading"><h3 id="p104-solution-heading" tabindex="-1">Keep gravity variable through the climb</h3><p>From surface gravity, μ=gR²=4.00×(1.00×10⁶)²=4.00×10¹² m³/s². The launch specific energy is</p><div class="p104-equation">ε=v₀²/2−μ/R<br>ε=(2000)²/2−4.00×10¹²/(1.00×10⁶)<br>ε=−2.00×10⁶ J/kg</div><p>The negative sign confirms a finite turning point. There the radial speed is zero:</p><div class="p104-equation">−2.00×10⁶=−μ/rmax<br>rmax=2.00×10⁶ m</div><div class="p104-equation p104-answer-equation">hmax=rmax−R=1.00×10⁶ m=1000 km</div><p>The escape speed is √(2gR)=2.828427 km/s, safely above the launch speed. A constant-g calculation would incorrectly predict only 500 km because gravity weakens substantially over this climb.</p><p class="p104-checks"><strong>Checks.</strong> At v₀=0, rmax=R and h=0. As v₀→vesc from below, ε→0⁻ and rmax→∞. At equality the object approaches infinity with zero speed; above it, v∞=√(v₀²−vesc²). Specific energy has units J/kg=m²/s², μ/r has the same units, and every calculated radius is measured from the world’s centre.</p></section>`;
  }

  function snapshot() {
    const values = launchData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", worldRadiusKilometres: state.radiusKm, surfaceGravityMetresPerSecondSquared: state.surfaceGravity, launchSpeedKilometresPerSecond: state.launchSpeedKmS, gravitationalParameterSI: Number(values.gravitationalParameter.toPrecision(10)), bindingEnergyMegajoulesPerKilogram: Number((values.bindingEnergy / 1e6).toFixed(9)), kineticEnergyMegajoulesPerKilogram: Number((values.kineticEnergy / 1e6).toFixed(9)), specificEnergyMegajoulesPerKilogram: Number((values.specificEnergy / 1e6).toFixed(9)), escapeSpeedKilometresPerSecond: Number((values.escapeSpeed / 1000).toFixed(9)), speedToEscapeRatio: Number(values.speedRatio.toFixed(9)), regime: values.regime, turningRadiusKilometres: Number.isFinite(values.turningRadius) ? Number((values.turningRadius / 1000).toFixed(9)) : null, maximumHeightKilometres: Number.isFinite(values.height) ? Number((values.height / 1000).toFixed(9)) : null, infinitySpeedKilometresPerSecond: values.infinitySpeed === null ? null : Number((values.infinitySpeed / 1000).toFixed(9)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.radiusKm = CHALLENGE.radiusKm; state.surfaceGravity = CHALLENGE.surfaceGravity; state.launchSpeedKmS = CHALLENGE.launchSpeedKmS; }
  function render() {
    return `<main class="book-shell p104-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive gravitation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p104-spread"><article class="book-page p104-problem-page"><div class="problem-number">Problem 10.4</div><h1 class="book-title p104-title">Jump into space</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${reconstructionNote()}<p class="problem-copy">A spherical airless world has radius 1000 km and surface gravity 4.00 m/s². A vehicle launches vertically from its surface at 2.00 km/s; ignore rotation.</p><p class="problem-copy"><strong>How high above the surface does it climb before momentarily stopping?</strong></p><section class="p104-observation-card"><strong>Why constant g fails</strong><p>The climb is comparable with the world’s radius, so gravitational acceleration changes strongly. Conserve specific mechanical energy using −μ/r.</p></section><section class="p104-model-card"><div class="eyebrow">Ideal model</div><p>Radial point-mass motion outside a spherical world, Newtonian gravity, no atmosphere, no propulsion after launch and no rotational velocity.</p></section></article><section class="book-page book-stage p104-stage">${stageControls()}<div class="p104-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p104-coach"><div class="coach-kicker">Find the turning point</div><p class="coach-question">For the stated world and 2.00 km/s launch, give the maximum altitude above the surface.</p><form class="p104-answer-form" data-p104-answer-form novalidate><label for="p104-answer">Maximum altitude</label><div><input id="p104-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="altitude above surface" autocomplete="off"/><span>km</span></div><button class="primary-button" type="submit">Check altitude</button></form>${feedbackMarkup()}<div class="button-row p104-help-row"><button class="secondary-button" type="button" data-problem-action="p104-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p104-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p104-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p104-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p104-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = launchData();
    const outputs = { radius: `${format(state.radiusKm, 0)} km`, gravity: `${format(state.surfaceGravity, 2)} m/s²`, speed: `${format(state.launchSpeedKmS, 3)} km/s` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p104-output="${key}"]`); if (output) output.textContent = value; });
    const thresholdButton = root.querySelector('[data-problem-action="p104-threshold"]');
    if (thresholdButton) thresholdButton.textContent = `Set v₀ exactly to vesc (${format(values.escapeSpeed / 1000, 3)} km/s)`;
    root.querySelector("#p104-radius")?.setAttribute("aria-valuetext", `World radius ${format(state.radiusKm, 0)} kilometres; escape speed ${format(values.escapeSpeed / 1000, 4)} kilometres per second`);
    root.querySelector("#p104-gravity")?.setAttribute("aria-valuetext", `Surface gravity ${format(state.surfaceGravity, 2)} metres per second squared; escape speed ${format(values.escapeSpeed / 1000, 4)} kilometres per second`);
    root.querySelector("#p104-speed")?.setAttribute("aria-valuetext", `Launch speed ${format(state.launchSpeedKmS, 3)} kilometres per second; ${regimeLabel(values)}; ${outcomeValue(values)}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p104-reset") { state = initialState(); renderAndFocus(renderApp, "#p104-speed"); return; }
      if (action === "p104-stage") { state.stage = clamp(Number(control.dataset.p104Stage), 0, 2); renderAndFocus(renderApp, `[data-p104-stage="${state.stage}"]`); return; }
      if (action === "p104-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p104-stage="${state.stage}"]`); return; }
      if (action === "p104-threshold") { state.launchSpeedKmS = launchData().escapeSpeed / 1000; state.stage = Math.max(state.stage, 1); renderAndFocus(renderApp, "#p104-speed"); return; }
      if (action === "p104-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p104-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p104-reveal") window.requestAnimationFrame(() => document.querySelector("#p104-solution-heading")?.focus());
    }));
    [["#p104-radius", "radiusKm", 500, 10000], ["#p104-gravity", "surfaceGravity", 0.5, 20], ["#p104-speed", "launchSpeedKmS", 0, 25]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p104-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p104-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one altitude above the surface in kilometres.";
      else if (Math.abs(answer - 2000) <= 0.5) state.feedback = "That is the turning radius measured from the centre. Subtract the world’s 1000 km radius to obtain altitude.";
      else if (Math.abs(answer - CHALLENGE_HEIGHT_KM) > 0.5) state.feedback = "Use ε=v₀²/2−gR, then set ε=−μ/rmax at the turning point. Remember μ=gR² and h=rmax−R.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: the turning radius is 2000 km from the centre, so the maximum altitude is 1000 km above the surface."; }
      renderAndFocus(renderApp, "#p104-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
