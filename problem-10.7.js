(function registerTerreLunePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.7";
  const G = 6.6743e-11;
  const LUNAR_MASS_KG = 7.342e22;
  const CHALLENGE = Object.freeze({ massRatio: 81, separationKm: 384400, launchPositionRatio: 0.1, launchSpeedKmS: 4 });
  const CHALLENGE_DISTANCE_FROM_MOON_KM = 38440;
  const stages = Object.freeze([
    Object.freeze({ short: "Forces", title: "Compare the two inverse-square pulls", copy: "Along the line, Earth pulls left and the Moon pulls right. Their equality marks one unstable balance point." }),
    Object.freeze({ short: "Potential", title: "Recognise the potential barrier", copy: "The combined potential Φ=−GME/x−GMM/(D−x) reaches its maximum where the two pulls balance." }),
    Object.freeze({ short: "Transfer", title: "Test the launch energy", copy: "A Moonward launch crosses the barrier only if v₀²/2+Φ(x₀) reaches the potential maximum." }),
  ]);
  const hints = Object.freeze([
    "Let y be the balance point’s distance from the Moon. Its distance from Earth is then D−y.",
    "Equate the field magnitudes: GME/(D−y)²=GMM/y². The constant G cancels.",
    "Take the positive square root and rearrange: y=D/[1+√(ME/MM)].",
    "Here ME/MM=81, so √(ME/MM)=9 and y=D/10=38,440 km.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p107-reset">Reset</button>';

  const initialState = () => ({ massRatio: CHALLENGE.massRatio, separationKm: CHALLENGE.separationKm, launchPositionRatio: CHALLENGE.launchPositionRatio, launchSpeedKmS: CHALLENGE.launchSpeedKmS, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 3) { if (Math.abs(value) < 0.5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function potentialAt(position, earthMass, moonMass, separation) {
    return -G * earthMass / position - G * moonMass / (separation - position);
  }

  function systemData(massRatio = state.massRatio, separationKm = state.separationKm, launchPositionRatio = state.launchPositionRatio, launchSpeedKmS = state.launchSpeedKmS) {
    const moonMass = LUNAR_MASS_KG;
    const earthMass = massRatio * moonMass;
    const separation = separationKm * 1000;
    const launchPosition = launchPositionRatio * separation;
    const launchSpeed = launchSpeedKmS * 1000;
    const rootEarth = Math.sqrt(earthMass), rootMoon = Math.sqrt(moonMass);
    const balanceFromEarth = separation * rootEarth / (rootEarth + rootMoon);
    const balanceFromMoon = separation - balanceFromEarth;
    const earthPull = G * earthMass / launchPosition ** 2;
    const moonPull = G * moonMass / (separation - launchPosition) ** 2;
    const netAcceleration = moonPull - earthPull;
    const launchPotential = potentialAt(launchPosition, earthMass, moonMass, separation);
    const barrierPotential = potentialAt(balanceFromEarth, earthMass, moonMass, separation);
    const specificEnergy = launchPotential + launchSpeed ** 2 / 2;
    const positionTolerance = 1e-10 * separation;
    const energyTolerance = 1e-10 * Math.max(Math.abs(barrierPotential), 1);
    let requiredSpeed = 0;
    let regime;
    let turningPosition = null;
    let speedAtBarrier = null;
    if (launchPosition < balanceFromEarth - positionTolerance) {
      requiredSpeed = Math.sqrt(Math.max(0, 2 * (barrierPotential - launchPotential)));
      if (specificEnergy < barrierPotential - energyTolerance) {
        regime = "turnback";
        let lower = launchPosition, upper = balanceFromEarth;
        for (let iteration = 0; iteration < 100; iteration += 1) {
          const middle = (lower + upper) / 2;
          if (potentialAt(middle, earthMass, moonMass, separation) > specificEnergy) upper = middle;
          else lower = middle;
        }
        turningPosition = (lower + upper) / 2;
      } else if (Math.abs(specificEnergy - barrierPotential) <= energyTolerance) {
        regime = "threshold";
        turningPosition = balanceFromEarth;
        speedAtBarrier = 0;
      } else {
        regime = "crosses";
        speedAtBarrier = Math.sqrt(2 * (specificEnergy - barrierPotential));
      }
    } else if (Math.abs(launchPosition - balanceFromEarth) <= positionTolerance && launchSpeed <= 1e-9) {
      regime = "balanced";
      turningPosition = balanceFromEarth;
    } else if (launchPosition <= balanceFromEarth + positionTolerance) {
      regime = "crosses";
      speedAtBarrier = launchSpeed;
    } else {
      regime = "past-barrier";
    }
    return { moonMass, earthMass, separation, launchPosition, launchSpeed, balanceFromEarth, balanceFromMoon, earthPull, moonPull, netAcceleration, launchPotential, barrierPotential, specificEnergy, requiredSpeed, regime, turningPosition, speedAtBarrier };
  }

  function regimeLabel(values = systemData()) {
    if (values.regime === "turnback") return "Turns back before the barrier";
    if (values.regime === "threshold") return "Just reaches the balance point";
    if (values.regime === "crosses") return "Crosses the potential barrier";
    if (values.regime === "balanced") return "Stationary at unstable balance";
    return "Already on the Moon side";
  }

  function reconstructionNote() {
    return `<p class="p107-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This fixed-body line-transfer model is newly written and does not reproduce the book’s wording, numbers, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p107-stage-controls" role="group" aria-label="Earth Moon line-transfer stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p107-stage" data-p107-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p107-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p107-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Transfer tested" : "Next stage"}</button></div>`;
  }

  function graphGeometry(values) {
    const xMap = (ratio) => 70 + 580 * ratio;
    const samples = Array.from({ length: 221 }, (_, index) => {
      const ratio = 0.015 + 0.97 * index / 220;
      const potential = potentialAt(ratio * values.separation, values.earthMass, values.moonMass, values.separation);
      return { ratio, potential };
    });
    const scale = Math.max(Math.abs(values.barrierPotential), 1);
    const depthFor = (potential) => Math.log1p(Math.max(0, (values.barrierPotential - potential) / scale));
    const maximumDepth = Math.max(...samples.map((sample) => depthFor(sample.potential)), 1e-9);
    const yForPotential = (potential) => {
      if (potential <= values.barrierPotential) return 233 + Math.min(1.08, depthFor(potential) / maximumDepth) * 158;
      return 233 - Math.min(29, (potential - values.barrierPotential) / scale * 22);
    };
    const path = samples.map((sample, index) => `${index ? "L" : "M"}${format(xMap(sample.ratio), 2)} ${format(yForPotential(sample.potential), 2)}`).join(" ");
    return { xMap, yForPotential, path, balanceX: xMap(values.balanceFromEarth / values.separation), launchX: xMap(values.launchPosition / values.separation), energyY: yForPotential(values.specificEnergy), barrierY: yForPotential(values.barrierPotential), turningX: values.turningPosition === null ? null : xMap(values.turningPosition / values.separation) };
  }

  function transferSvg() {
    const values = systemData();
    const graph = graphGeometry(values);
    const maximumPull = Math.max(values.earthPull, values.moonPull, 1e-12);
    const earthArrowLength = 18 + 55 * values.earthPull / maximumPull;
    const moonArrowLength = 18 + 55 * values.moonPull / maximumPull;
    const netDirection = values.netAcceleration > 1e-10 ? "Moonward" : values.netAcceleration < -1e-10 ? "Earthward" : "balanced";
    const statusValue = state.stage === 0 ? `anet=${signed(values.netAcceleration, 5)} m/s² · ${netDirection}` : state.stage === 1 ? `${format(values.balanceFromMoon / 1000, 1)} km from Moon` : regimeLabel(values);
    return `<svg class="p107-svg p107-stage-${state.stage} is-${values.regime}" viewBox="0 0 720 445" role="img" aria-labelledby="p107-svg-title p107-svg-desc">
      <title id="p107-svg-title">Earth Moon force balance and one-dimensional transfer potential</title>
      <desc id="p107-svg-desc">The Earth-side mass is ${format(state.massRatio, 1)} lunar masses, the Moon is one lunar mass and their fixed separation is ${format(state.separationKm, 0)} kilometres. The balance point is ${format(values.balanceFromMoon / 1000, 3)} kilometres from the Moon. A probe starts ${format(values.launchPosition / 1000, 3)} kilometres from Earth at ${format(state.launchSpeedKmS, 3)} kilometres per second toward the Moon. ${regimeLabel(values)}. The minimum barrier speed from that point is ${format(values.requiredSpeed / 1000, 4)} kilometres per second.</desc>
      <defs><radialGradient id="p107-earth-gradient" cx="35%" cy="30%"><stop offset="0" stop-color="#b7d9dc"/><stop offset=".58" stop-color="#4f8796"/><stop offset="1" stop-color="#285365"/></radialGradient><radialGradient id="p107-moon-gradient" cx="35%" cy="30%"><stop offset="0" stop-color="#e4d6b5"/><stop offset="1" stop-color="#8c806d"/></radialGradient><marker id="p107-force-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p107-launch-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p107-board" x="1" y="1" width="718" height="443" rx="20"/>
      <g class="p107-force-layer"><line class="p107-body-line" x1="70" y1="98" x2="650" y2="98"/><circle class="p107-earth" cx="70" cy="98" r="30"/><circle class="p107-moon" cx="650" cy="98" r="18"/><text class="p107-body-label" x="70" y="103" text-anchor="middle">Earth</text><text class="p107-body-label is-moon" x="650" y="102" text-anchor="middle">Moon</text><line class="p107-neutral-line" x1="${format(graph.balanceX, 2)}" y1="53" x2="${format(graph.balanceX, 2)}" y2="132"/><circle class="p107-neutral-point" cx="${format(graph.balanceX, 2)}" cy="98" r="6"/><text class="p107-neutral-label" x="${format(graph.balanceX, 2)}" y="145" text-anchor="middle">balance · ${format(values.balanceFromMoon / 1000, 0)} km from Moon</text><circle class="p107-probe" cx="${format(graph.launchX, 2)}" cy="70" r="8"/><line class="p107-earth-pull" x1="${format(graph.launchX - 3, 2)}" y1="70" x2="${format(graph.launchX - earthArrowLength, 2)}" y2="70" marker-end="url(#p107-force-arrow)"/><line class="p107-moon-pull" x1="${format(graph.launchX + 3, 2)}" y1="70" x2="${format(graph.launchX + moonArrowLength, 2)}" y2="70" marker-end="url(#p107-force-arrow)"/><text class="p107-force-label" x="${format(graph.launchX - earthArrowLength / 2, 2)}" y="56" text-anchor="middle">gE ${format(values.earthPull, 4)}</text><text class="p107-force-label" x="${format(graph.launchX + moonArrowLength / 2, 2)}" y="56" text-anchor="middle">gM ${format(values.moonPull, 4)}</text></g>
      <g class="p107-status" transform="translate(20 159)"><rect width="333" height="53" rx="12"/><text class="p107-status-kicker" x="15" y="20">${state.stage === 0 ? "LOCAL FORCE COMPARISON" : state.stage === 1 ? "POTENTIAL MAXIMUM" : "MOONWARD LAUNCH"}</text><text class="p107-status-value" x="15" y="41">${statusValue}</text></g>
      <g class="p107-potential-panel"><text class="p107-panel-title" x="383" y="181">COMBINED SPECIFIC POTENTIAL Φ(x)</text><line class="p107-barrier-level" x1="70" y1="${format(graph.barrierY, 2)}" x2="650" y2="${format(graph.barrierY, 2)}"/><path class="p107-potential-curve" d="${graph.path}"/><line class="p107-graph-neutral" x1="${format(graph.balanceX, 2)}" y1="218" x2="${format(graph.balanceX, 2)}" y2="402"/><circle class="p107-barrier-point" cx="${format(graph.balanceX, 2)}" cy="${format(graph.barrierY, 2)}" r="7"/><text class="p107-barrier-label" x="${format(graph.balanceX - 9, 2)}" y="${format(graph.barrierY - 12, 2)}" text-anchor="end">maximum Φ=${format(values.barrierPotential / 1e6, 3)} MJ/kg</text><text class="p107-well-label" x="73" y="421">Earth well</text><text class="p107-well-label" x="647" y="421" text-anchor="end">Moon well</text></g>
      <g class="p107-transfer-layer"><line class="p107-launch-vector" x1="${format(graph.launchX, 2)}" y1="43" x2="${format(Math.min(graph.launchX + 58, 640), 2)}" y2="43" marker-end="url(#p107-launch-arrow)"/><text class="p107-launch-label" x="${format(graph.launchX, 2)}" y="31">v₀=${format(state.launchSpeedKmS, 3)} km/s Moonward</text><line class="p107-energy-line" x1="70" y1="${format(graph.energyY, 2)}" x2="650" y2="${format(graph.energyY, 2)}"/><circle class="p107-energy-launch" cx="${format(graph.launchX, 2)}" cy="${format(graph.energyY, 2)}" r="6"/><text class="p107-energy-label" x="79" y="${format(graph.energyY - 8, 2)}">ε=${format(values.specificEnergy / 1e6, 3)} MJ/kg</text>${graph.turningX === null ? "" : `<circle class="p107-turning-point" cx="${format(graph.turningX, 2)}" cy="${format(graph.energyY, 2)}" r="7"/><text class="p107-turning-label" x="${format(graph.turningX, 2)}" y="${format(graph.energyY + 20, 2)}" text-anchor="middle">${values.regime === "threshold" || values.regime === "balanced" ? "arrives with v=0" : `turns · x=${format(values.turningPosition / 1000, 0)} km`}</text>`}${values.speedAtBarrier !== null && values.regime === "crosses" ? `<text class="p107-cross-label" x="${format(graph.balanceX, 2)}" y="${format(graph.barrierY + 21, 2)}" text-anchor="middle">crossing speed ${format(values.speedAtBarrier / 1000, 3)} km/s</text>` : ""}</g>
      <text class="p107-model-note" x="688" y="427" text-anchor="end">fixed point masses · inertial 1-D line · no rotation or atmosphere</text>
    </svg>`;
  }

  function barrierSummary(values = systemData()) {
    if (values.regime === "turnback") return `${format(values.requiredSpeed / 1000, 3)} km/s needed · turns back`;
    if (values.regime === "threshold") return `${format(values.requiredSpeed / 1000, 3)} km/s · just sufficient`;
    if (values.regime === "crosses") return `${format(values.requiredSpeed / 1000, 3)} km/s needed · crosses`;
    if (values.regime === "balanced") return "0 km/s · unstable balance";
    return "0 km/s needed · Moon side";
  }

  function metricsMarkup() {
    const values = systemData();
    return `<section class="p107-metrics" aria-live="polite"><div><span>Net line acceleration</span><strong>${signed(values.netAcceleration, 5)} m/s²</strong></div><div><span>Balance point from Moon</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.balanceFromMoon / 1000, 2)} km` : "stage 2"}</strong></div><div><span>Barrier test</span><strong>${state.stage >= 2 || state.revealed ? barrierSummary(values) : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p107-dynamic">${transferSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = systemData();
    return `<section class="p107-controls" aria-label="Earth Moon transfer controls"><div class="p107-control-grid"><label for="p107-ratio"><span>Mass ratio ME/MM<output data-p107-output="ratio">${format(state.massRatio, 0)} : 1</output></span><input id="p107-ratio" type="range" min="10" max="150" step="1" value="${state.massRatio}"/></label><label for="p107-separation"><span>Fixed separation D<output data-p107-output="separation">${format(state.separationKm, 0)} km</output></span><input id="p107-separation" type="range" min="100000" max="600000" step="100" value="${state.separationKm}"/></label><label for="p107-position"><span>Launch position x₀ from Earth<output data-p107-output="position">${format(values.launchPosition / 1000, 0)} km · ${format(100 * state.launchPositionRatio, 1)}% D</output></span><input id="p107-position" type="range" min="0.02" max="0.98" step="0.005" value="${state.launchPositionRatio}"/></label><label for="p107-speed"><span>Moonward launch speed v₀<output data-p107-output="speed">${format(state.launchSpeedKmS, 3)} km/s</output></span><input id="p107-speed" type="range" min="0" max="40" step="0.1" value="${state.launchSpeedKmS}"/></label></div><div class="p107-threshold-action"><button class="chip-button" type="button" data-problem-action="p107-threshold">Set the exact barrier speed (${format(values.requiredSpeed / 1000, 3)} km/s)</button><span>The Moon’s mass is held at one lunar mass; changing the ratio changes the Earth-side mass.</span></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p107-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p107-solution" aria-labelledby="p107-solution-heading"><h3 id="p107-solution-heading" tabindex="-1">Balance inverse-square fields, not masses</h3><p>Let y be the distance from the Moon to the neutral point. The Earth distance is D−y. Equality of the two gravitational field magnitudes gives</p><div class="p107-equation">GME/(D−y)² = GMM/y²</div><p>Cancel G, take the positive square root and solve:</p><div class="p107-equation">y√ME=(D−y)√MM<br>y=D√MM/(√ME+√MM)<br>y=D/[1+√(ME/MM)]</div><div class="p107-equation p107-answer-equation">y=384,400 km/(1+√81)=38,440 km from the Moon</div><p>In the transfer model, Φ(x)=−GME/x−GMM/(D−x). Its derivative vanishes at the same point, and its second derivative is negative there, so the neutral point is a potential maximum. From a launch point x₀ on the Earth side, the minimum Moonward speed is</p><div class="p107-equation">vmin=√{2[Φ(xneutral)−Φ(x₀)]}</div><p class="p107-checks"><strong>Checks and boundary.</strong> If ME=MM, the point is halfway. If ME/MM→∞, its Moon distance tends to zero. All distances scale linearly with D, while G cancels from the balance location. Potential is J/kg=m²/s², so the barrier formula returns m/s. This is not the rotating Earth–Moon L1 point: both bodies are artificially fixed, treated as point masses, and the probe is constrained to one inertial line with no orbital, atmospheric or rotational effects.</p></section>`;
  }

  function snapshot() {
    const values = systemData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", gravitationalConstantSI: G, moonMassKilograms: LUNAR_MASS_KG, earthToMoonMassRatio: state.massRatio, earthMassKilograms: Number(values.earthMass.toPrecision(10)), fixedSeparationKilometres: state.separationKm, balanceDistanceFromEarthKilometres: Number((values.balanceFromEarth / 1000).toFixed(6)), balanceDistanceFromMoonKilometres: Number((values.balanceFromMoon / 1000).toFixed(6)), launchPositionFromEarthKilometres: Number((values.launchPosition / 1000).toFixed(6)), launchSpeedKilometresPerSecond: state.launchSpeedKmS, earthPullMetresPerSecondSquared: Number(values.earthPull.toFixed(9)), moonPullMetresPerSecondSquared: Number(values.moonPull.toFixed(9)), netAccelerationMetresPerSecondSquared: Number(values.netAcceleration.toFixed(9)), launchPotentialMegajoulesPerKilogram: Number((values.launchPotential / 1e6).toFixed(9)), barrierPotentialMegajoulesPerKilogram: Number((values.barrierPotential / 1e6).toFixed(9)), specificEnergyMegajoulesPerKilogram: Number((values.specificEnergy / 1e6).toFixed(9)), requiredBarrierSpeedKilometresPerSecond: Number((values.requiredSpeed / 1000).toFixed(9)), regime: values.regime, turningPositionFromEarthKilometres: values.turningPosition === null ? null : Number((values.turningPosition / 1000).toFixed(9)), speedAtBarrierKilometresPerSecond: values.speedAtBarrier === null ? null : Number((values.speedAtBarrier / 1000).toFixed(9)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.massRatio = CHALLENGE.massRatio; state.separationKm = CHALLENGE.separationKm; state.launchPositionRatio = CHALLENGE.launchPositionRatio; state.launchSpeedKmS = CHALLENGE.launchSpeedKmS; }
  function render() {
    return `<main class="book-shell p107-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive gravitation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p107-spread"><article class="book-page p107-problem-page"><div class="problem-number">Problem 10.7</div><h1 class="book-title p107-title">De la Terre a la Lune</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">Two fixed spherical bodies are 384,400 km apart and have masses in the ratio 81:1. Consider points on the line joining their centres.</p><p class="problem-copy"><strong>How far from the smaller body is the point where their gravitational pulls have equal magnitude?</strong></p><section class="p107-observation-card"><strong>A useful but ideal barrier</strong><p>With the bodies fixed, the zero-force point is also the top of the one-dimensional combined potential. It separates launches that turn back from those that can cross Moonward.</p></section><section class="p107-model-card"><div class="eyebrow">Model boundary</div><p>Fixed point masses in an inertial frame, motion constrained to their line, and no atmosphere or rotation. This is deliberately not the rotating three-body L1 calculation.</p></section></article><section class="book-page book-stage p107-stage">${stageControls()}<div class="p107-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p107-coach"><div class="coach-kicker">Locate the neutral point</div><p class="coach-question">For mass ratio 81:1 and separation 384,400 km, give the balance point’s distance from the smaller body.</p><form class="p107-answer-form" data-p107-answer-form novalidate><label for="p107-answer">Distance from smaller body</label><div><input id="p107-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="distance" autocomplete="off"/><span>km</span></div><button class="primary-button" type="submit">Check distance</button></form>${feedbackMarkup()}<div class="button-row p107-help-row"><button class="secondary-button" type="button" data-problem-action="p107-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p107-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p107-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p107-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p107-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = systemData();
    const outputs = { ratio: `${format(state.massRatio, 0)} : 1`, separation: `${format(state.separationKm, 0)} km`, position: `${format(values.launchPosition / 1000, 0)} km · ${format(100 * state.launchPositionRatio, 1)}% D`, speed: `${format(state.launchSpeedKmS, 3)} km/s` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p107-output="${key}"]`); if (output) output.textContent = value; });
    const thresholdButton = root.querySelector('[data-problem-action="p107-threshold"]');
    if (thresholdButton) thresholdButton.textContent = `Set the exact barrier speed (${format(values.requiredSpeed / 1000, 3)} km/s)`;
    root.querySelector("#p107-ratio")?.setAttribute("aria-valuetext", `Earth to Moon mass ratio ${format(state.massRatio, 0)} to 1; balance point ${format(values.balanceFromMoon / 1000, 1)} kilometres from Moon`);
    root.querySelector("#p107-separation")?.setAttribute("aria-valuetext", `Fixed separation ${format(state.separationKm, 0)} kilometres; balance point ${format(values.balanceFromMoon / 1000, 1)} kilometres from Moon`);
    root.querySelector("#p107-position")?.setAttribute("aria-valuetext", `Launch position ${format(values.launchPosition / 1000, 0)} kilometres from Earth; required barrier speed ${format(values.requiredSpeed / 1000, 3)} kilometres per second`);
    root.querySelector("#p107-speed")?.setAttribute("aria-valuetext", `Moonward launch speed ${format(state.launchSpeedKmS, 3)} kilometres per second; ${regimeLabel(values)}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p107-reset") { state = initialState(); renderAndFocus(renderApp, "#p107-position"); return; }
      if (action === "p107-stage") { state.stage = clamp(Number(control.dataset.p107Stage), 0, 2); renderAndFocus(renderApp, `[data-p107-stage="${state.stage}"]`); return; }
      if (action === "p107-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p107-stage="${state.stage}"]`); return; }
      if (action === "p107-threshold") { state.launchSpeedKmS = systemData().requiredSpeed / 1000; state.stage = Math.max(state.stage, 2); renderAndFocus(renderApp, "#p107-speed"); return; }
      if (action === "p107-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p107-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p107-reveal") window.requestAnimationFrame(() => document.querySelector("#p107-solution-heading")?.focus());
    }));
    [["#p107-ratio", "massRatio", 10, 150], ["#p107-separation", "separationKm", 100000, 600000], ["#p107-position", "launchPositionRatio", 0.02, 0.98], ["#p107-speed", "launchSpeedKmS", 0, 40]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p107-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p107-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one distance from the smaller body in kilometres.";
      else if (Math.abs(answer - (CHALLENGE.separationKm - CHALLENGE_DISTANCE_FROM_MOON_KM)) <= 1) state.feedback = "That is the neutral point’s distance from the larger body. The question asks for the remaining distance to the smaller body.";
      else if (Math.abs(answer - CHALLENGE_DISTANCE_FROM_MOON_KM) > 1) state.feedback = "Equate the inverse-square pulls, take the positive square root of the mass ratio, and solve using the distance measured from the smaller body.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: the square-root mass ratio is 9, so the neutral point lies one tenth of the separation—38,440 km—from the smaller body."; }
      renderAndFocus(renderApp, "#p107-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
