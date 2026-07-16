(function registerStandingStillPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "20.6";
  const LIGHT_SPEED_METRES_PER_SECOND = 299792458;
  const CHALLENGE_MASS_KILOGRAMS = 1000;
  const CHALLENGE_BETA = .8;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Budget", title: "Separate rest energy from kinetic energy", copy: "The moving craft has total energy E=γmc². Its rest energy mc² remains when the same craft is stationary, so the removable part is their difference K=(γ−1)mc²." }),
    Object.freeze({ short: "Invariant", title: "Energy and momentum transform together", copy: "The craft's energy and momentum are frame-dependent, but E²−(pc)²=(mc²)² in every inertial frame. The hyperbola connects the moving and rest descriptions." }),
    Object.freeze({ short: "Stopping", title: "Transfer energy and momentum to an environment", copy: "Stopping is an interaction, not a frame transformation. A brake, exhaust or radiation field must receive the craft's kinetic energy and momentum while its rest energy remains with the craft." }),
  ]);
  const hints = Object.freeze([
    "Use γ=1/√(1−β²) with β=0.80.",
    "At 0.80c, γ=1/√(1−0.80²)=5/3.",
    "The craft's total energy is E=γmc²; after it is brought to rest without changing its mass, its energy is mc².",
    "Therefore the energy that must leave the craft's translational motion is K=E−mc²=(γ−1)mc².",
    "Substitute m=1,000 kg and c=299,792,458 m/s: K=(2/3)(1,000)c²≈5.9917×10¹⁹ J.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p206-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function scientific(value, digits = 4) { if (!Number.isFinite(value)) return "—"; if (value === 0) return "0"; const exponent = Math.floor(Math.log10(Math.abs(value))); const coefficient = value / 10 ** exponent; const superscripts = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }; const exponentText = String(exponent).split("").map((character) => superscripts[character]).join(""); return `${format(coefficient, digits)}×10${exponentText}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseEnergy(raw) { const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("×10^", "e").replaceAll("x10^", "e").replaceAll("×10", "e").replaceAll("x10", "e").replace(/[jJ]$/, ""); return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN; }

  function energyData(massKilograms = CHALLENGE_MASS_KILOGRAMS, beta = CHALLENGE_BETA) {
    const gamma = 1 / Math.sqrt(1 - beta ** 2);
    const gammaMinusOne = gamma ** 2 * beta ** 2 / (gamma + 1);
    const restEnergyJoules = massKilograms * LIGHT_SPEED_METRES_PER_SECOND ** 2;
    const totalEnergyJoules = gamma * restEnergyJoules;
    const kineticEnergyJoules = gammaMinusOne * restEnergyJoules;
    const speedMetresPerSecond = beta * LIGHT_SPEED_METRES_PER_SECOND;
    const momentumKilogramMetresPerSecond = gamma * massKilograms * speedMetresPerSecond;
    const normalizedMomentum = gamma * beta;
    const classicalKineticEnergyJoules = .5 * massKilograms * speedMetresPerSecond ** 2;
    const lowSpeedRatio = classicalKineticEnergyJoules === 0 ? 1 : kineticEnergyJoules / classicalKineticEnergyJoules;
    return {
      massKilograms,
      beta,
      gamma,
      gammaMinusOne,
      speedMetresPerSecond,
      restEnergyJoules,
      totalEnergyJoules,
      kineticEnergyJoules,
      momentumKilogramMetresPerSecond,
      momentumTimesCJoules: momentumKilogramMetresPerSecond * LIGHT_SPEED_METRES_PER_SECOND,
      normalizedTotalEnergy: gamma,
      normalizedMomentum,
      classicalKineticEnergyJoules,
      lowSpeedRatio,
      invariantNormalized: gamma ** 2 - normalizedMomentum ** 2,
      invariantResidual: gamma ** 2 - normalizedMomentum ** 2 - 1,
      energyBalanceResidualJoules: totalEnergyJoules - restEnergyJoules - kineticEnergyJoules,
      stoppingMomentumResidual: momentumKilogramMetresPerSecond - momentumKilogramMetresPerSecond,
    };
  }

  const challenge = Object.freeze(energyData());
  function initialState() { return { massKilograms: CHALLENGE_MASS_KILOGRAMS, beta: CHALLENGE_BETA, energyRoute: "recover", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();
  function currentData() { return energyData(state.massKilograms, state.beta); }

  function stageControlsMarkup() { return `<div class="p206-stage-controls" role="group" aria-label="Relativistic stopping-energy reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p206-stage" data-p206-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaptionMarkup() { const stage = stages[state.stage]; return `<div class="p206-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p206-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Balance complete" : "Next stage"}</button></div>`; }

  function invariantCurvePath(mapQ, mapEnergy) {
    return Array.from({ length: 72 }, (_, index) => { const q = index / 10; return `${index ? "L" : "M"}${format(mapQ(q), 3)} ${format(mapEnergy(Math.sqrt(1 + q ** 2)), 3)}`; }).join("");
  }

  function laboratorySvg() {
    const data = currentData();
    const barX = 56, barWidth = 434;
    const restWidth = barWidth / data.gamma;
    const kineticWidth = Math.max(0, barWidth - restWidth);
    const qMaximum = 7.2, energyMaximum = Math.sqrt(1 + qMaximum ** 2);
    const mapQ = (q) => 66 + q / qMaximum * 350;
    const mapEnergy = (energy) => 421 - (energy - 1) / (energyMaximum - 1) * 166;
    const pointX = mapQ(data.normalizedMomentum), pointY = mapEnergy(data.normalizedTotalEnergy);
    const showInvariant = state.stage >= 1 || state.revealed;
    const showStop = state.stage >= 2 || state.revealed;
    const routeLabel = state.energyRoute === "recover" ? "captured by regenerative braking" : "dispersed as heat and radiation";
    const description = `A ${format(data.massKilograms, 0)} kilogram craft travels at ${format(data.beta, 2)} c. Gamma is ${format(data.gamma, 6)}. Rest energy is ${scientific(data.restEnergyJoules)} joules, kinetic energy is ${scientific(data.kineticEnergyJoules)} joules, total energy is ${scientific(data.totalEnergyJoules)} joules and momentum is ${scientific(data.momentumKilogramMetresPerSecond)} kilogram metres per second. The normalized energy-momentum point is ${format(data.normalizedMomentum, 4)}, ${format(data.normalizedTotalEnergy, 4)} and lies on E squared minus p c squared equals m c squared squared. Stopping leaves the rest energy with the craft while kinetic energy is ${routeLabel}.`;
    return `<svg class="p206-lab p206-stage-${state.stage}" viewBox="0 0 760 465" role="img" aria-labelledby="p206-lab-title p206-lab-desc"><title id="p206-lab-title">Relativistic energy budget and energy-momentum invariant</title><desc id="p206-lab-desc">${description}</desc><defs><linearGradient id="p206-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172b3a"/><stop offset="1" stop-color="#32283f"/></linearGradient><linearGradient id="p206-kinetic-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d97861"/><stop offset="1" stop-color="#e7b85a"/></linearGradient><marker id="p206-transfer-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p206-board" x="1" y="1" width="758" height="463" rx="20"/><text class="p206-board-kicker" x="23" y="28">ONE CRAFT · ONE CHOSEN FRAME · ENERGY AND MOMENTUM MUST BOTH BALANCE</text><g class="p206-budget-panel"><rect x="20" y="44" width="720" height="154" rx="14"/><text class="p206-panel-title" x="37" y="68">ENERGY LEDGER BEFORE AND AFTER BRAKING</text><text class="p206-row-label" x="56" y="95">MOVING · E=γmc²</text><rect class="p206-rest-bar" x="${barX}" y="104" width="${format(restWidth, 3)}" height="31" rx="6"/><rect class="p206-kinetic-bar" x="${format(barX + restWidth, 3)}" y="104" width="${format(kineticWidth, 3)}" height="31" rx="${kineticWidth > 8 ? 6 : 0}"/><text class="p206-bar-label is-rest" x="${format(barX + restWidth / 2, 3)}" y="124" text-anchor="middle">rest mc²</text>${kineticWidth > 38 ? `<text class="p206-bar-label is-kinetic" x="${format(barX + restWidth + kineticWidth / 2, 3)}" y="124" text-anchor="middle">K</text>` : ""}<text class="p206-row-label" x="56" y="154">STILL · E=mc²</text><rect class="p206-rest-bar" x="${barX}" y="162" width="${format(restWidth, 3)}" height="20" rx="5"/><line class="p206-transfer-line" x1="${format(barX + restWidth + kineticWidth / 2, 3)}" y1="144" x2="${format(barX + restWidth + kineticWidth / 2, 3)}" y2="177" marker-end="url(#p206-transfer-arrow)"/><text class="p206-transfer-label" x="${format(barX + restWidth + kineticWidth / 2, 3)}" y="193" text-anchor="middle">${showStop ? `K leaves craft · ${state.energyRoute === "recover" ? "recover" : "dissipate"}` : "resolve at stage 3"}</text><g class="p206-budget-ledger" transform="translate(515 82)"><text x="0" y="0">γ</text><text x="205" y="0" text-anchor="end">${format(data.gamma, 6)}</text><text x="0" y="25">mc²</text><text x="205" y="25" text-anchor="end">${scientific(data.restEnergyJoules)} J</text><text x="0" y="50">K</text><text class="is-kinetic" x="205" y="50" text-anchor="end">${scientific(data.kineticEnergyJoules)} J</text><text x="0" y="75">E</text><text x="205" y="75" text-anchor="end">${scientific(data.totalEnergyJoules)} J</text></g></g><g class="p206-invariant-panel"><rect x="20" y="215" width="454" height="230" rx="14"/><text class="p206-panel-title" x="37" y="239">ENERGY–MOMENTUM MASS SHELL</text><g class="p206-grid">${[0,1,2,3,4,5,6,7].map((q) => `<line x1="${format(mapQ(q), 3)}" y1="253" x2="${format(mapQ(q), 3)}" y2="421"/>`).join("")}${[1,2,3,4,5,6,7].map((energy) => `<line x1="66" y1="${format(mapEnergy(energy), 3)}" x2="423" y2="${format(mapEnergy(energy), 3)}"/>`).join("")}</g><line class="p206-axis" x1="66" y1="421" x2="425" y2="421"/><line class="p206-axis" x1="66" y1="425" x2="66" y2="252"/><text class="p206-axis-label" x="420" y="438" text-anchor="end">pc / mc²</text><text class="p206-axis-label" x="75" y="264">E / mc²</text><path class="p206-mass-shell" d="${invariantCurvePath(mapQ, mapEnergy)}"/><circle class="p206-rest-point" cx="${format(mapQ(0), 3)}" cy="${format(mapEnergy(1), 3)}" r="6"/><text class="p206-point-label is-rest" x="76" y="414">rest · (0,1)</text><line class="p206-stop-path" x1="${format(pointX, 3)}" y1="${format(pointY, 3)}" x2="${format(mapQ(0), 3)}" y2="${format(mapEnergy(1), 3)}" marker-end="url(#p206-transfer-arrow)"/><circle class="p206-moving-point" cx="${format(pointX, 3)}" cy="${format(pointY, 3)}" r="7"/><text class="p206-point-label is-moving" x="${format(Math.min(404, pointX + 9), 3)}" y="${format(Math.max(270, pointY - 9), 3)}">moving · (${format(data.normalizedMomentum, 3)}, ${format(data.gamma, 3)})</text><text class="p206-invariant-equation" x="245" y="282" text-anchor="middle">${showInvariant ? "(E/mc²)² − (pc/mc²)² = 1" : "invariant revealed at stage 2"}</text></g><g class="p206-stop-panel"><rect x="490" y="215" width="250" height="230" rx="14"/><text class="p206-panel-title" x="507" y="239">STOPPING AUDIT</text><text class="p206-stop-kicker" x="507" y="271">CRAFT BEFORE</text><text class="p206-stop-label" x="507" y="294">momentum</text><text class="p206-stop-value" x="723" y="294" text-anchor="end">${scientific(data.momentumKilogramMetresPerSecond)}</text><text class="p206-stop-label" x="507" y="316">total energy</text><text class="p206-stop-value" x="723" y="316" text-anchor="end">${scientific(data.totalEnergyJoules)}</text><line class="p206-stop-rule" x1="507" y1="334" x2="723" y2="334"/><text class="p206-stop-kicker" x="507" y="360">CRAFT AFTER</text><text class="p206-stop-label" x="507" y="383">momentum</text><text class="p206-stop-value is-zero" x="723" y="383" text-anchor="end">0</text><text class="p206-stop-label" x="507" y="405">energy retained</text><text class="p206-stop-value" x="723" y="405" text-anchor="end">${scientific(data.restEnergyJoules)}</text><text class="p206-stop-note" x="507" y="430">${showStop ? `environment: ${routeLabel}` : "environment ledger at stage 3"}</text></g></svg>`;
  }

  function routeMarkup() {
    const data = currentData();
    const routeCopy = state.energyRoute === "recover" ? "Ideal regenerative braking stores K in another system. Real capture is never perfectly efficient, but the energy transferred is still the craft’s kinetic energy." : "Dissipative braking spreads K into heat, radiation or exhaust. It becomes less useful, not destroyed: the wider system still conserves energy and momentum.";
    return `<section class="p206-route" aria-label="Kinetic-energy transfer route"><div role="group" aria-label="Choose an idealized braking outcome"><button class="secondary-button ${state.energyRoute === "recover" ? "active" : ""}" type="button" data-problem-action="p206-route" data-p206-route="recover" aria-pressed="${state.energyRoute === "recover"}"><strong>Recover K</strong><span>store useful energy</span></button><button class="secondary-button ${state.energyRoute === "dissipate" ? "active" : ""}" type="button" data-problem-action="p206-route" data-p206-route="dissipate" aria-pressed="${state.energyRoute === "dissipate"}"><strong>Dissipate K</strong><span>heat, light or exhaust</span></button></div><p>${routeCopy}</p><div><strong>${scientific(data.kineticEnergyJoules)} J leaves translational motion</strong><span>${scientific(data.restEnergyJoules)} J remains as rest energy</span></div></section>`;
  }

  function metricsMarkup() { const data = currentData(); return `<section class="p206-metrics" aria-live="polite"><article><span>Kinetic energy K</span><strong>${scientific(data.kineticEnergyJoules)} J</strong><small>(γ−1)mc²</small></article><article><span>Total energy E</span><strong>${scientific(data.totalEnergyJoules)} J</strong><small>γmc²</small></article><article><span>Momentum p</span><strong>${scientific(data.momentumKilogramMetresPerSecond)}</strong><small>kg·m/s · γmv</small></article></section>`; }
  function dynamicMarkup() { return `<div class="p206-dynamic">${laboratorySvg()}${metricsMarkup()}${routeMarkup()}</div>`; }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p206-controls" aria-label="Craft mass and speed controls"><div class="p206-presets" role="group" aria-label="Mass and speed presets"><button class="secondary-button" type="button" data-problem-action="p206-preset" data-p206-preset="slow">Low-speed check</button><button class="secondary-button" type="button" data-problem-action="p206-preset" data-p206-preset="challenge">0.80c challenge</button><button class="secondary-button" type="button" data-problem-action="p206-preset" data-p206-preset="fast">0.95c comparison</button></div><div class="p206-slider-grid"><label for="p206-speed"><span>Craft speed v/c <output data-p206-output="speed">${format(state.beta, 2)}c</output></span><input id="p206-speed" data-p206-slider="speed" type="range" min="0" max=".99" step=".01" value="${state.beta}" aria-valuetext="${format(state.beta, 2)} times light speed; gamma ${format(data.gamma, 5)}"/></label><label for="p206-mass"><span>Rest mass <output data-p206-output="mass">${format(state.massKilograms, 0)} kg</output></span><input id="p206-mass" data-p206-slider="mass" type="range" min="100" max="2000" step="50" value="${state.massKilograms}" aria-valuetext="rest mass ${format(state.massKilograms, 0)} kilograms"/></label></div><p data-p206-limit-note>At β=${format(state.beta, 2)}, K is ${format(data.lowSpeedRatio, 5)} times the classical ½mv² value. As β→0 this ratio tends to 1.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p206-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p206-solution" aria-labelledby="p206-solution-heading"><h3 id="p206-solution-heading" tabindex="-1">Standing still removes kinetic energy, not rest energy</h3><p>In the chosen frame, β=0.80 and</p><div class="p206-solution-equation">γ=1/√(1−β²)=1/√(1−0.80²)=5/3.</div><p>The craft’s initial total energy and rest energy are</p><div class="p206-solution-equation">E=γmc²=(5/3)(1,000)(299,792,458)²<br>≈<strong>1.4979×10²⁰ J,</strong><br>mc²≈8.9876×10¹⁹ J.</div><p>The energy that must be removed from the craft’s translational motion is their difference:</p><div class="p206-solution-equation is-answer">K=(γ−1)mc²=(2/3)(1,000)(299,792,458)²<br>≈<strong>5.9917×10¹⁹ J.</strong></div><p>The initial momentum is p=γmv=(5/3)(1,000)(0.80c)≈<strong>3.9972×10¹¹ kg·m/s.</strong> Energy and momentum satisfy</p><div class="p206-solution-equation">E²−(pc)²=(mc²)²,<br>or γ²−(γβ)²=1.</div><p>A physical braking system must take both K and momentum. K may be captured in a useful store or dissipated into heat, radiation and exhaust; it is not destroyed. If the craft remains the same 1,000 kg object, its rest energy stays with it. At low speed, expanding γ gives γ−1≈½β², so K≈½mv².</p></section>`;
  }

  function snapshot() {
    const data = currentData();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, chosenFrame: "frame in which the craft initially moves at beta and is finally at rest", constants: { lightSpeedMetresPerSecond: LIGHT_SPEED_METRES_PER_SECOND }, craft: { restMassKilograms: data.massKilograms, speedFractionOfC: data.beta, speedMetresPerSecond: data.speedMetresPerSecond, lorentzFactor: data.gamma }, beforeStopping: { totalEnergyJoules: data.totalEnergyJoules, kineticEnergyJoules: data.kineticEnergyJoules, restEnergyJoules: data.restEnergyJoules, momentumKilogramMetresPerSecond: data.momentumKilogramMetresPerSecond }, afterStopping: { craftEnergyJoules: data.restEnergyJoules, craftMomentumKilogramMetresPerSecond: 0, energyTransferredJoules: data.kineticEnergyJoules, momentumTransferredKilogramMetresPerSecond: data.momentumKilogramMetresPerSecond, idealizedEnergyRoute: state.energyRoute }, invariant: { equation: "E^2-(pc)^2=(mc^2)^2", normalizedTotalEnergy: data.normalizedTotalEnergy, normalizedMomentum: data.normalizedMomentum, normalizedValue: data.invariantNormalized, residual: data.invariantResidual }, lowSpeedCheck: { classicalKineticEnergyJoules: data.classicalKineticEnergyJoules, relativisticToClassicalRatio: data.lowSpeedRatio }, balances: { energyResidualJoules: data.energyBalanceResidualJoules, stoppingMomentumResidual: data.stoppingMomentumResidual }, challenge: { restMassKilograms: CHALLENGE_MASS_KILOGRAMS, speedFractionOfC: CHALLENGE_BETA, gamma: challenge.gamma, kineticEnergyJoules: challenge.kineticEnergyJoules, totalEnergyJoules: challenge.totalEnergyJoules, momentumKilogramMetresPerSecond: challenge.momentumKilogramMetresPerSecond }, stage: state.stage + 1, answerJoules: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.massKilograms = CHALLENGE_MASS_KILOGRAMS; state.beta = CHALLENGE_BETA; }
  function render() {
    return `<main class="book-shell p206-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · relativistic dynamics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p206-spread"><article class="book-page p206-problem-page"><div class="problem-number">Problem 20.6</div><h1 class="book-title p206-title">The Price of Standing Still</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p206-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A 1,000 kg craft travels at 0.80c in a chosen inertial frame. It is brought to rest in that same frame without changing its rest mass.</p><p class="problem-copy"><strong>How much relativistic kinetic energy must leave the craft’s translational motion?</strong></p><section class="p206-question-card"><strong>“Stop” needs an environment</strong><p>A frame change merely redescribes the craft. Physical braking transfers energy and momentum to something else.</p></section><section class="p206-given-grid" aria-label="Challenge data"><span>rest mass <strong>1,000 kg</strong></span><span>speed <strong>0.80c</strong></span><span>Lorentz factor <strong>5/3</strong></span><span>find <strong>K</strong></span></section></article><section class="book-page book-stage p206-stage" aria-labelledby="p206-stage-heading">${stageControlsMarkup()}<div class="p206-stage-heading"><div><span class="eyebrow">Energy–momentum laboratory</span><h2 id="p206-stage-heading">Audit what leaves—and what remains</h2></div><p>Vary mass and speed, then compare useful recovery with dissipation. Both routes remove the same kinetic energy.</p></div>${dynamicMarkup()}${controlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p206-coach"><div class="coach-kicker">Pay the stopping cost</div><p class="coach-question">For the fixed 1,000 kg, 0.80c challenge, enter K in joules.</p><form class="p206-answer-form" data-p206-answer-form novalidate><label for="p206-answer">Relativistic kinetic energy</label><div><input id="p206-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="e.g. 5.99e19"/><span>J</span></div><small>Scientific notation is welcome.</small><button class="primary-button" type="submit">Check energy</button></form>${feedbackMarkup()}<div class="button-row p206-help-row"><button class="secondary-button" type="button" data-problem-action="p206-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p206-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p206-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p206-shell"); if (!root) return;
    const dynamic = root.querySelector(".p206-dynamic");
    const active = document.activeElement;
    let focusSelector = "";
    if (dynamic?.contains(active) && active.dataset?.problemAction === "p206-route") focusSelector = `[data-problem-action="p206-route"][data-p206-route="${active.dataset.p206Route}"]`;
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const data = currentData();
    const speedOutput = root.querySelector('[data-p206-output="speed"]'); if (speedOutput) speedOutput.textContent = `${format(state.beta, 2)}c`;
    const massOutput = root.querySelector('[data-p206-output="mass"]'); if (massOutput) massOutput.textContent = `${format(state.massKilograms, 0)} kg`;
    root.querySelector("#p206-speed")?.setAttribute("aria-valuetext", `${format(state.beta, 2)} times light speed; gamma ${format(data.gamma, 5)}`);
    root.querySelector("#p206-mass")?.setAttribute("aria-valuetext", `rest mass ${format(state.massKilograms, 0)} kilograms`);
    const note = root.querySelector("[data-p206-limit-note]"); if (note) note.textContent = `At β=${format(state.beta, 2)}, K is ${format(data.lowSpeedRatio, 5)} times the classical ½mv² value. As β→0 this ratio tends to 1.`;
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (focusSelector) { const replacement = root.querySelector(focusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p206-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p206-reset") { state = initialState(); renderAndFocus(renderApp, "#p206-speed"); return; }
      if (action === "p206-stage") { state.stage = clamp(Number(control.dataset.p206Stage), 0, 2); renderAndFocus(renderApp, `[data-p206-stage="${state.stage}"]`); return; }
      if (action === "p206-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p206-stage="${state.stage}"]`); return; }
      if (action === "p206-route") { state.energyRoute = control.dataset.p206Route === "dissipate" ? "dissipate" : "recover"; updateDynamicDom(); return; }
      if (action === "p206-preset") {
        if (control.dataset.p206Preset === "slow") { state.massKilograms = 1000; state.beta = .05; }
        else if (control.dataset.p206Preset === "fast") { state.massKilograms = 1000; state.beta = .95; }
        else restoreChallenge();
      }
      if (action === "p206-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p206-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p206-reveal") window.requestAnimationFrame(() => document.querySelector("#p206-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p206-speed")) state.beta = clamp(Number(event.target.value), 0, .99);
      else if (event.target.matches("#p206-mass")) state.massKilograms = clamp(Number(event.target.value), 100, 2000);
      else return;
      updateDynamicDom();
    });
    const input = document.querySelector("#p206-answer"); input?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 28); });
    document.querySelector("[data-p206-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = String(input?.value || "").trim(); const answer = parseEnergy(state.answer); state.feedbackTone = "warn"; state.committed = false;
      const relativeError = Number.isFinite(answer) ? Math.abs(answer - challenge.kineticEnergyJoules) / challenge.kineticEnergyJoules : Infinity;
      if (!state.answer || !Number.isFinite(answer) || answer < 0) state.feedback = "Enter one non-negative energy in joules, such as 5.99e19.";
      else if (Math.abs(answer - challenge.totalEnergyJoules) / challenge.totalEnergyJoules < .01) state.feedback = "That is the total energy γmc². Subtract the rest energy mc² to find the kinetic part that leaves translational motion.";
      else if (Math.abs(answer - challenge.restEnergyJoules) / challenge.restEnergyJoules < .01) state.feedback = "That is the rest energy mc². It remains with the unchanged craft after stopping.";
      else if (relativeError > .01) state.feedback = "Use K=(γ−1)mc² with γ=5/3, m=1,000 kg and c=299,792,458 m/s.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: K≈5.9917×10¹⁹ J must leave the craft’s translational motion."; }
      renderAndFocus(renderApp, "#p206-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
