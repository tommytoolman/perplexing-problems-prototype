(function registerMuonBeachPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "20.2";
  const SPEED_OF_LIGHT_METRES_PER_SECOND = 3.00e8;
  const PROPER_MEAN_LIFETIME_SECONDS = 2.20e-6;
  const CHALLENGE_BETA = 0.998;
  const CHALLENGE_ALTITUDE_KILOMETRES = 10.0;
  const ANSWER_TOLERANCE_PERCENTAGE_POINTS = 0.3;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Decay", title: "Treat lifetime as an exponential mean", copy: "The proper mean lifetime τ₀ is not a timer that forces every muon to disappear at 2.20 μs. Survival after proper time t is e⁻ᵗ⁄τ⁰." }),
    Object.freeze({ short: "Dilate", title: "Dilate the mean lifetime in the laboratory", copy: "At speed βc, the laboratory mean is γτ₀ and the mean distance is λ=γβcτ₀. The survival law is e⁻ᴴ⁄λ." }),
    Object.freeze({ short: "Contract", title: "Check the same event in the muon frame", copy: "The muon retains its proper lifetime τ₀, but the 10 km atmosphere contracts to H/γ. Both frames give the same decay exponent and survival probability." }),
  ]);
  const hints = Object.freeze([
    "Compute γ=1/√(1−β²) for β=0.998.",
    "The laboratory mean lifetime is γτ₀, so the laboratory mean distance is λ=γβcτ₀.",
    "For an exponential decay distribution, survival through distance H is P=exp(−H/λ).",
    "Here λ≈10.42 km, so P=exp(−10.0/10.42). Convert the result to a percentage.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p202-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function scientific(value, digits = 3) { if (!Number.isFinite(value) || value === 0) return value === 0 ? "0" : "—"; const [mantissa, exponent] = value.toExponential(digits).split("e"); return `${mantissa}×10^${Number(exponent)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function relativityData(beta, altitudeKilometres) {
    const speedFraction = clamp(beta, 0.01, 0.999999), altitude = clamp(altitudeKilometres, 0, 100);
    const gamma = 1 / Math.sqrt(1 - speedFraction ** 2), laboratoryMeanLifetimeSeconds = gamma * PROPER_MEAN_LIFETIME_SECONDS;
    const speedMetresPerSecond = speedFraction * SPEED_OF_LIGHT_METRES_PER_SECOND, meanDistanceWithoutDilationKilometres = speedMetresPerSecond * PROPER_MEAN_LIFETIME_SECONDS / 1000;
    const laboratoryMeanDistanceKilometres = gamma * meanDistanceWithoutDilationKilometres, laboratoryTransitTimeSeconds = altitude * 1000 / speedMetresPerSecond;
    const contractedAltitudeKilometres = altitude / gamma, muonFrameTransitTimeSeconds = laboratoryTransitTimeSeconds / gamma;
    const decayExponent = altitude / laboratoryMeanDistanceKilometres, survivalProbability = Math.exp(-decayExponent), survivalWithoutDilation = Math.exp(-altitude / meanDistanceWithoutDilationKilometres);
    return { beta: speedFraction, altitudeKilometres: altitude, gamma, speedMetresPerSecond, properMeanLifetimeSeconds: PROPER_MEAN_LIFETIME_SECONDS, laboratoryMeanLifetimeSeconds, meanDistanceWithoutDilationKilometres, laboratoryMeanDistanceKilometres, laboratoryTransitTimeSeconds, contractedAltitudeKilometres, muonFrameTransitTimeSeconds, decayExponent, survivalProbability, survivalPercentage: 100 * survivalProbability, survivalWithoutDilation };
  }

  const CHALLENGE_DATA = relativityData(CHALLENGE_BETA, CHALLENGE_ALTITUDE_KILOMETRES);
  function parseSurvivalPercentage(raw) {
    const normalized = String(raw).trim().replaceAll(",", "."); if (!normalized) return NaN;
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? 100 * Number(fraction[1]) / denominator : NaN; }
    const match = normalized.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/); if (!match) return NaN;
    const value = Number(match[0]); return normalized.includes("%") || Math.abs(value) > 1 ? value : 100 * value;
  }

  function initialState() { return { beta: CHALLENGE_BETA, altitudeKilometres: CHALLENGE_ALTITUDE_KILOMETRES, boardMessage: "At 0.998c, relativistic dilation stretches the mean laboratory path to about 10.42 km; survival from 10.0 km is an exponential probability, not a guarantee.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function currentData() { return relativityData(state.beta, state.altitudeKilometres); }
  function setBeta(value) { state.beta = clamp(value, .9, .999); const data = currentData(); state.boardMessage = `Speed changed to ${format(state.beta, 3)}c: γ=${format(data.gamma, 3)}, mean path ${format(data.laboratoryMeanDistanceKilometres, 3)} km and survival ${format(data.survivalPercentage, 2)}%.`; }
  function setAltitude(value) { state.altitudeKilometres = clamp(value, .5, 20); const data = currentData(); state.boardMessage = `Production altitude ${format(state.altitudeKilometres, 1)} km: expected survival at the beach is ${format(data.survivalPercentage, 2)}%. Individual muons still decay randomly.`; }
  function restoreChallenge() { state.beta = CHALLENGE_BETA; state.altitudeKilometres = CHALLENGE_ALTITUDE_KILOMETRES; state.boardMessage = "Challenge restored: H=10.0 km and β=0.998 give γ≈15.82 and survival ≈38.3%."; }

  function stageControls() {
    return `<div class="p202-stage-controls" role="group" aria-label="Muon survival reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p202-stage" data-p202-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p202-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p202-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Frame agreement exposed" : "Next stage"}</button></div>`;
  }

  function ensembleMarkup(probability) {
    const expectedWhole = Math.round(100 * probability);
    return Array.from({ length: 100 }, (_, index) => { const x = 252 + (index % 10) * 17, y = 79 + Math.floor(index / 10) * 15; return `<g class="p202-ensemble-dot ${index < expectedWhole ? "is-survivor" : "is-decayed"}"><circle cx="${x}" cy="${y}" r="5"/><text x="${x}" y="${y + 2}" text-anchor="middle">${index < expectedWhole ? "μ" : "×"}</text></g>`; }).join("");
  }

  function survivalCurvePath(data) {
    return Array.from({ length: 101 }, (_, index) => { const altitude = 20 * index / 100, probability = Math.exp(-altitude / data.laboratoryMeanDistanceKilometres), x = 50 + 660 * index / 100, y = 390 - 88 * probability; return `${index ? "L" : "M"}${format(x, 3)} ${format(y, 3)}`; }).join("");
  }

  function muonSvg() {
    const data = currentData(), expectedWhole = Math.round(data.survivalPercentage), meanRatio = data.altitudeKilometres ? data.laboratoryMeanDistanceKilometres / data.altitudeKilometres : 1, naiveRatio = data.altitudeKilometres ? data.meanDistanceWithoutDilationKilometres / data.altitudeKilometres : 1;
    const meanEndY = 57 + 190 * Math.min(meanRatio, 1), naiveEndY = 57 + 190 * Math.min(naiveRatio, 1), pointX = 50 + 660 * data.altitudeKilometres / 20, pointY = 390 - 88 * data.survivalProbability, pointLabelY = pointY < 326 ? pointY + 21 : pointY - 12;
    const yTicks = [0, 25, 50, 75, 100].map((percentage) => { const y = 390 - .88 * percentage; return `<g class="p202-tick"><line x1="50" y1="${format(y, 3)}" x2="710" y2="${format(y, 3)}"/><text x="42" y="${format(y + 3, 3)}" text-anchor="end">${percentage}</text></g>`; }).join("");
    const xTicks = [0, 5, 10, 15, 20].map((altitude) => { const x = 50 + 33 * altitude; return `<g class="p202-tick"><line x1="${x}" y1="390" x2="${x}" y2="395"/><text x="${x}" y="408" text-anchor="middle">${altitude}</text></g>`; }).join("");
    return `<svg class="p202-muon p202-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p202-svg-title p202-svg-desc"><title id="p202-svg-title">Interactive atmospheric-muon survival model</title><desc id="p202-svg-desc">A muon produced ${format(data.altitudeKilometres, 2)} kilometres above the beach travels at ${format(data.beta, 4)} times light speed. Gamma is ${format(data.gamma, 5)}. Its proper mean lifetime is 2.20 microseconds, laboratory mean lifetime ${format(data.laboratoryMeanLifetimeSeconds * 1e6, 4)} microseconds and laboratory mean distance ${format(data.laboratoryMeanDistanceKilometres, 5)} kilometres. Exponential survival to the beach is ${format(data.survivalPercentage, 4)} percent. A grid depicts approximately ${expectedWhole} expected survivors per one hundred, not predetermined individual outcomes.</desc><defs><marker id="p202-flight-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><linearGradient id="p202-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcecf2"/><stop offset="1" stop-color="#f5eddb"/></linearGradient></defs><rect class="p202-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p202-board-kicker" x="23" y="28">EXPONENTIAL SURVIVAL · MEAN LIFETIME ≠ GUARANTEED EXPIRY</text><g class="p202-atmosphere"><rect x="24" y="43" width="204" height="221" rx="14"/><path class="p202-cloud" d="M57 65c8-22 34-18 39-3 13-14 36-2 30 14H49c-8-7-2-16 8-11z"/><rect class="p202-beach" x="38" y="239" width="176" height="13" rx="5"/><path class="p202-water" d="M38 235q18-11 36 0t36 0t36 0t36 0t36 0"/><line class="p202-height" x1="54" y1="57" x2="54" y2="247"/><line class="p202-height-cap" x1="47" y1="57" x2="61" y2="57"/><line class="p202-height-cap" x1="47" y1="247" x2="61" y2="247"/><text class="p202-height-label" x="47" y="154" text-anchor="middle" transform="rotate(-90 47 154)">H=${format(data.altitudeKilometres, 1)} km</text><circle class="p202-muon-particle" cx="96" cy="63" r="11"/><text class="p202-muon-symbol" x="96" y="67" text-anchor="middle">μ</text><line class="p202-flight" x1="96" y1="78" x2="96" y2="229" marker-end="url(#p202-flight-arrow)"/><text class="p202-flight-label" x="108" y="156">β=${format(data.beta, 3)}</text><g class="p202-mean-path"><line x1="141" y1="57" x2="141" y2="${format(meanEndY, 3)}"/><text x="149" y="${format(Math.min(meanEndY + 8, 230), 3)}">λ=${format(data.laboratoryMeanDistanceKilometres, 2)} km mean</text></g><g class="p202-naive-path"><line x1="177" y1="57" x2="177" y2="${format(naiveEndY, 3)}"/><text x="185" y="${format(Math.max(naiveEndY + 9, 84), 3)}">${format(data.meanDistanceWithoutDilationKilometres, 2)} km without γ</text></g></g><g class="p202-ensemble"><text class="p202-ensemble-title" x="252" y="56">EXPECTED BEACH ARRIVALS IN A LARGE ENSEMBLE</text>${ensembleMarkup(data.survivalProbability)}<text class="p202-ensemble-value" x="328" y="240" text-anchor="middle">≈${expectedWhole} of 100 · exact ${format(data.survivalPercentage, 2)}%</text><text class="p202-ensemble-note" x="328" y="257" text-anchor="middle">dots show an expectation—not fixed fates or expiry times</text></g><g class="p202-ledger" transform="translate(438 44)"><rect class="p202-ledger-bg" width="298" height="220" rx="15"/><text class="p202-ledger-title" x="16" y="28">RELATIVITY + DECAY AUDIT</text><text class="p202-ledger-label" x="16" y="63">Lorentz factor γ</text><text class="p202-ledger-value" x="280" y="63" text-anchor="end">${format(data.gamma, 3)}</text><text class="p202-ledger-label" x="16" y="91">lab mean lifetime γτ₀</text><text class="p202-ledger-value" x="280" y="91" text-anchor="end">${format(data.laboratoryMeanLifetimeSeconds * 1e6, 2)} μs</text><text class="p202-ledger-label" x="16" y="119">lab mean distance γβcτ₀</text><text class="p202-ledger-value" x="280" y="119" text-anchor="end">${format(data.laboratoryMeanDistanceKilometres, 3)} km</text><text class="p202-ledger-label" x="16" y="147">decay exponent H/λ</text><text class="p202-ledger-value" x="280" y="147" text-anchor="end">${format(data.decayExponent, 4)}</text><rect class="p202-result-box" x="13" y="167" width="272" height="40" rx="9"/><text class="p202-result-label" x="25" y="185">SURVIVAL e⁻ᴴ⁄λ</text><text class="p202-result-value" x="273" y="198" text-anchor="end">${format(data.survivalPercentage, 2)}%</text></g><g class="p202-curve-group"><text class="p202-curve-title" x="50" y="285">SURVIVAL TO THE BEACH (%) VERSUS PRODUCTION ALTITUDE (km) AT β=${format(data.beta, 3)}</text>${yTicks}<path class="p202-survival-curve" d="${survivalCurvePath(data)}"/>${xTicks}<line class="p202-selected-guide" x1="${format(pointX, 3)}" y1="${format(pointY, 3)}" x2="${format(pointX, 3)}" y2="390"/><circle class="p202-selected-point" cx="${format(pointX, 3)}" cy="${format(pointY, 3)}" r="7"/><text class="p202-selected-label" x="${format(clamp(pointX, 95, 665), 3)}" y="${format(pointLabelY, 3)}" text-anchor="middle">${format(data.altitudeKilometres, 1)} km → ${format(data.survivalPercentage, 2)}%</text><text class="p202-axis-label" x="710" y="423" text-anchor="end">production altitude H (km)</text></g></svg>`;
  }

  function muonControls() {
    const data = currentData();
    return `<section class="p202-controls" aria-label="Muon speed and production-altitude controls"><div class="p202-slider-grid"><label for="p202-beta"><span>Speed β=v/c <output data-p202-output="beta">${format(state.beta, 3)}c</output></span><input id="p202-beta" type="range" min="0.900" max="0.999" step="0.001" value="${state.beta}" aria-valuetext="Speed ${format(state.beta, 3)} times light speed; gamma ${format(data.gamma, 3)}; survival ${format(data.survivalPercentage, 2)} percent"/></label><label for="p202-altitude"><span>Production altitude H <output data-p202-output="altitude">${format(state.altitudeKilometres, 1)} km</output></span><input id="p202-altitude" type="range" min="0.5" max="20" step="0.1" value="${state.altitudeKilometres}" aria-valuetext="Production altitude ${format(state.altitudeKilometres, 1)} kilometres; survival ${format(data.survivalPercentage, 2)} percent"/></label></div><p data-p202-control-message role="status">${state.boardMessage}</p><p class="p202-mean-note"><strong>Statistical reading:</strong> τ₀ and γτ₀ are means of exponential distributions. After one mean lifetime, e⁻¹≈36.8% of an ensemble remains; no muon receives a guaranteed expiry time.</p></section>`;
  }

  function frameComparisonMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const data = currentData(), labExponent = data.laboratoryTransitTimeSeconds / data.laboratoryMeanLifetimeSeconds, muonExponent = data.muonFrameTransitTimeSeconds / PROPER_MEAN_LIFETIME_SECONDS;
    return `<section class="p202-frame-comparison" aria-labelledby="p202-frame-heading"><div><span class="eyebrow">One arrival event · two frames</span><h3 id="p202-frame-heading">Time dilation and length contraction tell the same story</h3></div><article><span>laboratory frame</span><strong>atmosphere: ${format(data.altitudeKilometres, 3)} km</strong><b>transit ${format(data.laboratoryTransitTimeSeconds * 1e6, 3)} μs</b><small>mean lifetime γτ₀=${format(data.laboratoryMeanLifetimeSeconds * 1e6, 3)} μs · exponent ${format(labExponent, 5)}</small></article><article><span>muon frame</span><strong>contracted atmosphere: ${format(data.contractedAltitudeKilometres, 3)} km</strong><b>transit ${format(data.muonFrameTransitTimeSeconds * 1e6, 3)} μs</b><small>proper mean τ₀=${format(PROPER_MEAN_LIFETIME_SECONDS * 1e6, 2)} μs · exponent ${format(muonExponent, 5)}</small></article><p>t_lab/(γτ₀)=t_muon/τ₀=H/(γβcτ₀), so both frames predict P=${format(data.survivalPercentage, 2)}%.</p></section>`;
  }

  function metricsMarkup() {
    const data = currentData();
    return `<section class="p202-metrics" aria-live="polite"><div><span>Lorentz factor</span><strong>γ=${format(data.gamma, 3)}</strong></div><div><span>Mean lab distance</span><strong>${format(data.laboratoryMeanDistanceKilometres, 3)} km</strong></div><div><span>Survival to beach</span><strong>${format(data.survivalPercentage, 2)}%</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p202-dynamic"><div class="p202-muon-wrap">${muonSvg()}${muonControls()}</div>${frameComparisonMarkup()}${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p202-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p202-solution" aria-labelledby="p202-solution-heading"><h3 id="p202-solution-heading" tabindex="-1">Use the dilated mean inside the exponential survival law</h3><div class="p202-equation">γ=1/√(1−0.998²)=15.8193≈15.82</div><p>The proper mean lifetime becomes, in the laboratory,</p><div class="p202-equation">τlab=γτ₀=(15.8193)(2.20 μs)=34.802 μs≈34.8 μs.</div><p>The associated mean laboratory travel distance is</p><div class="p202-equation">λ=βcτlab=γβcτ₀<br>=(15.8193)(0.998)(3.00×10⁸)(2.20×10⁻⁶)<br>=1.04199×10⁴ m≈10.42 km.</div><p>Without time dilation, the corresponding mean distance would be only βcτ₀=0.65868 km≈0.659 km. A mean is not a hard range: exponential decay gives a nonzero probability on either side of it.</p><div class="p202-equation is-answer">P(survive)=e⁻ᴴ⁄λ<br>=exp(−10.0/10.4199)<br>=0.383005≈38.3%.</div><p>Equivalently, the muon sees the 10.0 km atmosphere contracted to H/γ=0.632 km and crosses it in 2.11 μs of proper time. That gives the same exponent relative to τ₀=2.20 μs.</p></section>`;
  }

  function snapshot() {
    const data = currentData(), laboratoryExponent = data.laboratoryTransitTimeSeconds / data.laboratoryMeanLifetimeSeconds, muonExponent = data.muonFrameTransitTimeSeconds / PROPER_MEAN_LIFETIME_SECONDS, distanceExponent = data.altitudeKilometres / data.laboratoryMeanDistanceKilometres;
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "special-relativistic constant-speed travel plus exponential decay; flat spacetime; c=3.00e8 m/s", beta: data.beta, speedMetresPerSecond: data.speedMetresPerSecond, productionAltitudeKilometres: data.altitudeKilometres, properMeanLifetimeMicroseconds: PROPER_MEAN_LIFETIME_SECONDS * 1e6, lorentzFactor: Number(data.gamma.toFixed(12)), laboratoryMeanLifetimeMicroseconds: Number((data.laboratoryMeanLifetimeSeconds * 1e6).toFixed(12)), meanDistanceWithoutDilationKilometres: Number(data.meanDistanceWithoutDilationKilometres.toFixed(12)), laboratoryMeanDistanceKilometres: Number(data.laboratoryMeanDistanceKilometres.toFixed(12)), laboratoryTransitTimeMicroseconds: Number((data.laboratoryTransitTimeSeconds * 1e6).toFixed(12)), contractedAltitudeKilometres: Number(data.contractedAltitudeKilometres.toFixed(12)), muonFrameTransitTimeMicroseconds: Number((data.muonFrameTransitTimeSeconds * 1e6).toFixed(12)), decayExponent: Number(data.decayExponent.toFixed(12)), survivalProbability: Number(data.survivalProbability.toFixed(12)), survivalPercentage: Number(data.survivalPercentage.toFixed(12)), survivalWithoutDilation: Number(data.survivalWithoutDilation.toExponential(10)), ensembleInterpretation: { expectedSurvivorsPer100: data.survivalPercentage, displayedWholeDots: Math.round(data.survivalPercentage), deterministicIndividualFates: false }, invariants: { gammaDefinitionResidual: Number((data.gamma - 1 / Math.sqrt(1 - data.beta ** 2)).toExponential(6)), dilatedLifetimeResidualSeconds: Number((data.laboratoryMeanLifetimeSeconds - data.gamma * PROPER_MEAN_LIFETIME_SECONDS).toExponential(6)), meanDistanceResidualKilometres: Number((data.laboratoryMeanDistanceKilometres - data.gamma * data.beta * SPEED_OF_LIGHT_METRES_PER_SECOND * PROPER_MEAN_LIFETIME_SECONDS / 1000).toExponential(6)), laboratoryVsDistanceExponentResidual: Number((laboratoryExponent - distanceExponent).toExponential(6)), laboratoryVsMuonFrameExponentResidual: Number((laboratoryExponent - muonExponent).toExponential(6)), contractedTransitResidualSeconds: Number((data.muonFrameTransitTimeSeconds - data.contractedAltitudeKilometres * 1000 / data.speedMetresPerSecond).toExponential(6)) }, challenge: { beta: CHALLENGE_BETA, altitudeKilometres: CHALLENGE_ALTITUDE_KILOMETRES, gamma: Number(CHALLENGE_DATA.gamma.toFixed(12)), laboratoryMeanLifetimeMicroseconds: Number((CHALLENGE_DATA.laboratoryMeanLifetimeSeconds * 1e6).toFixed(12)), laboratoryMeanDistanceKilometres: Number(CHALLENGE_DATA.laboratoryMeanDistanceKilometres.toFixed(12)), noDilationMeanDistanceKilometres: Number(CHALLENGE_DATA.meanDistanceWithoutDilationKilometres.toFixed(12)), exactSurvivalProbability: Number(CHALLENGE_DATA.survivalProbability.toFixed(12)), exactSurvivalPercentage: Number(CHALLENGE_DATA.survivalPercentage.toFixed(12)), acceptedTolerancePercentagePoints: ANSWER_TOLERANCE_PERCENTAGE_POINTS }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p202-shell"><div class="p202-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Relativity and particle decay</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p202-spread"><article class="book-page p202-problem-page"><div class="problem-number">Problem 20.2</div><h1 class="book-title p202-title">The Muon That Reaches the Beach</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="problem-copy">Atmospheric muons have proper mean lifetime τ₀=2.20 μs. A muon is created 10.0 km above the beach and travels downward at 0.998c.</p><p class="problem-copy"><strong>What percentage of such muons is expected to survive to the beach?</strong></p><section class="p202-observation-card"><strong>Decay is statistical</strong><p>The mean lifetime sets the scale of an exponential distribution. It is neither a guaranteed lifespan nor a maximum journey.</p></section><section class="p202-model-card"><div class="eyebrow">Ideal relativistic model</div><p>Use c=3.00×10⁸ m/s, constant speed and a straight 10.0 km path. Energy loss, atmospheric curvature and interactions are ignored.</p></section></article><section class="book-page book-stage p202-stage">${stageControls()}<div class="p202-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p202-coach"><div class="coach-kicker">Estimate the surviving ensemble</div><p class="coach-question">Enter a percentage. Both 38.3 and 38.3% are accepted; a decimal probability such as 0.383 is also understood.</p><form class="p202-answer-form" data-p202-answer-form novalidate><label for="p202-answer">Survival percentage</label><div><input id="p202-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 38.3" autocomplete="off"/><span>%</span></div><small>Acceptance tolerance: ±${format(ANSWER_TOLERANCE_PERCENTAGE_POINTS, 1)} percentage points.</small><button class="primary-button" type="submit">Check survival</button></form>${feedbackMarkup()}<div class="button-row p202-help-row"><button class="secondary-button" type="button" data-problem-action="p202-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p202-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p202-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom(root) {
    const muon = root.querySelector(".p202-muon"); if (muon) muon.outerHTML = muonSvg();
    const comparison = root.querySelector(".p202-frame-comparison"); if (comparison) comparison.outerHTML = frameComparisonMarkup();
    const metrics = root.querySelector(".p202-metrics"); if (metrics) metrics.outerHTML = metricsMarkup();
    const data = currentData(), betaOutput = root.querySelector('[data-p202-output="beta"]'), altitudeOutput = root.querySelector('[data-p202-output="altitude"]'), message = root.querySelector("[data-p202-control-message]");
    if (betaOutput) betaOutput.textContent = `${format(state.beta, 3)}c`; if (altitudeOutput) altitudeOutput.textContent = `${format(state.altitudeKilometres, 1)} km`; if (message) message.textContent = state.boardMessage;
    const betaSlider = root.querySelector("#p202-beta"); if (betaSlider) { betaSlider.value = String(state.beta); betaSlider.setAttribute("aria-valuetext", `Speed ${format(state.beta, 3)} times light speed; gamma ${format(data.gamma, 3)}; survival ${format(data.survivalPercentage, 2)} percent`); }
    const altitudeSlider = root.querySelector("#p202-altitude"); if (altitudeSlider) { altitudeSlider.value = String(state.altitudeKilometres); altitudeSlider.setAttribute("aria-valuetext", `Production altitude ${format(state.altitudeKilometres, 1)} kilometres; survival ${format(data.survivalPercentage, 2)} percent`); }
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p202-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]"); if (!actionControl) return;
      const action = actionControl.dataset.problemAction;
      if (action === "p202-reset") { resetChallenge(); renderAndFocus(renderApp, "#p202-beta"); return; }
      if (action === "p202-stage") { state.stage = clamp(Number(actionControl.dataset.p202Stage), 0, 2); renderAndFocus(renderApp, `[data-p202-stage="${state.stage}"]`); return; }
      if (action === "p202-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p202-stage="${state.stage}"]`); return; }
      if (action === "p202-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p202-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p202-reveal") window.requestAnimationFrame(() => document.querySelector("#p202-solution-heading")?.focus());
    });
    root?.querySelector("#p202-beta")?.addEventListener("input", (event) => { setBeta(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p202-altitude")?.addEventListener("input", (event) => { setAltitude(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p202-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p202-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p202-answer")?.value || "", answer = parseSurvivalPercentage(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a survival percentage or decimal probability.";
      else if (Math.abs(answer - 100 * CHALLENGE_DATA.survivalWithoutDilation) <= .01) state.feedback = "That is the prediction if time dilation is omitted. Use the dilated mean γτ₀.";
      else if (Math.abs(answer - CHALLENGE_DATA.laboratoryMeanDistanceKilometres) <= .1) state.feedback = "About 10.42 km is the mean laboratory travel distance, not the requested percentage. Put 10.0 km into the exponential survival law.";
      else if (Math.abs(answer - CHALLENGE_DATA.laboratoryMeanLifetimeSeconds * 1e6) <= .2) state.feedback = "About 34.8 μs is the mean laboratory lifetime, not a survival percentage.";
      else if (Math.abs(answer - CHALLENGE_DATA.survivalPercentage) > ANSWER_TOLERANCE_PERCENTAGE_POINTS) state.feedback = `Use P=exp[−H/(γβcτ₀)] and report 100P. Answers within ±${format(ANSWER_TOLERANCE_PERCENTAGE_POINTS, 1)} percentage points are accepted.`;
      else { state.feedbackTone = "success"; state.feedback = `Correct: P≈${format(CHALLENGE_DATA.survivalProbability, 4)}, so about ${format(CHALLENGE_DATA.survivalPercentage, 1)}% survive.`; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p202-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
