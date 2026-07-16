(function registerPulseRunsAwayPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "18.6";
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ wavelengthMetres: 10, timeSeconds: 20 });
  const DISPLAY_TIME_SECONDS = 20;
  const PLAYBACK_MILLISECONDS = 6000;
  const DOMAIN = Object.freeze({ minimumMetres: -25, maximumMetres: 120 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Phase", title: "Follow one constant-phase crest", copy: "A marked carrier crest keeps kx−ωt constant. It therefore advances at the phase speed cₚ=ω/k, even after its visible amplitude has faded outside the packet." }),
    Object.freeze({ short: "Group", title: "Follow the packet envelope", copy: "A narrow cluster of neighbouring wavelengths reinforces only inside the envelope. Its centre—the pulse and energy marker—moves at the group speed cᵍ=dω/dk." }),
    Object.freeze({ short: "Dispersion", title: "The bent dispersion curve splits the speeds", copy: "For deep-water gravity waves ω=√(gk). The tangent slope dω/dk is half the origin-to-point secant slope ω/k, so cᵍ=cₚ/2." }),
  ]);
  const hints = Object.freeze([
    "Convert wavelength to wavenumber with k=2π/λ.",
    "For deep-water gravity waves, ω²=gk. Hence cₚ=ω/k=√(g/k)=√(gλ/2π).",
    "The envelope moves at the slope of the dispersion curve: cᵍ=dω/dk.",
    "Differentiate ω=(gk)¹ᐟ² to obtain cᵍ=(1/2)√(g/k)=cₚ/2.",
    "Multiply each speed by 20 s. Keep the marked phase crest separate from the packet centre.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p186-reset">Reset</button>';

  function initialState() {
    return { ...CHALLENGE, timeSeconds: 0, stage: 0, playing: false, answers: { phase: "", group: "" }, feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false };
  }

  let state = initialState();
  let animationFrame = null;
  let playbackStartedAt = null;
  let lastAnimationPaint = 0;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function svgNumber(value, digits = 3) { return Number(value.toFixed(digits)); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.,eE+\-\s]/g, "").replace(",", ".").slice(0, 24); }

  function waveData(wavelengthMetres = state.wavelengthMetres, timeSeconds = state.timeSeconds) {
    const wavenumberPerMetre = 2 * Math.PI / wavelengthMetres;
    const angularFrequencyPerSecond = Math.sqrt(GRAVITY * wavenumberPerMetre);
    const phaseSpeedMetresPerSecond = angularFrequencyPerSecond / wavenumberPerMetre;
    const groupSpeedMetresPerSecond = GRAVITY / (2 * angularFrequencyPerSecond);
    const phaseDistanceMetres = phaseSpeedMetresPerSecond * timeSeconds;
    const groupDistanceMetres = groupSpeedMetresPerSecond * timeSeconds;
    const phaseGroupSeparationMetres = phaseDistanceMetres - groupDistanceMetres;
    const packetSigmaMetres = 1.4 * wavelengthMetres;
    const trackedCrestEnvelopeFraction = Math.exp(-.5 * (phaseGroupSeparationMetres / packetSigmaMetres) ** 2);
    const periodSeconds = 2 * Math.PI / angularFrequencyPerSecond;
    const frequencyHertz = 1 / periodSeconds;
    return {
      wavenumberPerMetre,
      angularFrequencyPerSecond,
      phaseSpeedMetresPerSecond,
      groupSpeedMetresPerSecond,
      phaseDistanceMetres,
      groupDistanceMetres,
      phaseGroupSeparationMetres,
      packetSigmaMetres,
      trackedCrestEnvelopeFraction,
      periodSeconds,
      frequencyHertz,
      phaseCyclesAdvanced: phaseDistanceMetres / wavelengthMetres,
      dispersionIdentityResidual: angularFrequencyPerSecond ** 2 - GRAVITY * wavenumberPerMetre,
      phaseIdentityResidual: phaseSpeedMetresPerSecond - Math.sqrt(GRAVITY * wavelengthMetres / (2 * Math.PI)),
      groupIdentityResidual: groupSpeedMetresPerSecond - phaseSpeedMetresPerSecond / 2,
      distanceIdentityResidual: phaseDistanceMetres - 2 * groupDistanceMetres,
    };
  }

  const challenge = Object.freeze(waveData(CHALLENGE.wavelengthMetres, CHALLENGE.timeSeconds));

  function originalExtensionNote() { return `<p class="p186-extension-note">${EXTENSION_DISCLOSURE}</p>`; }

  function stageControls() {
    return `<div class="p186-stage-controls" role="group" aria-label="Phase and group velocity reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p186-stage" data-p186-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p186-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p186-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Speeds separated" : "Next stage"}</button></div>`;
  }

  function mapDistance(distanceMetres, plotX = 34, plotWidth = 516) {
    return plotX + plotWidth * (distanceMetres - DOMAIN.minimumMetres) / (DOMAIN.maximumMetres - DOMAIN.minimumMetres);
  }

  function surfacePath(values, plotX, plotWidth, centreY, amplitude, samples = 600) {
    const points = [];
    for (let index = 0; index <= samples; index += 1) {
      const proportion = index / samples;
      const xMetres = DOMAIN.minimumMetres + proportion * (DOMAIN.maximumMetres - DOMAIN.minimumMetres);
      const envelope = Math.exp(-.5 * ((xMetres - values.groupDistanceMetres) / values.packetSigmaMetres) ** 2);
      const phase = Math.cos(values.wavenumberPerMetre * (xMetres - values.phaseDistanceMetres));
      points.push(`${index ? "L" : "M"}${svgNumber(plotX + plotWidth * proportion)} ${svgNumber(centreY - amplitude * envelope * phase)}`);
    }
    return points.join("");
  }

  function envelopePath(values, sign, plotX, plotWidth, centreY, amplitude, samples = 180) {
    const points = [];
    for (let index = 0; index <= samples; index += 1) {
      const proportion = index / samples;
      const xMetres = DOMAIN.minimumMetres + proportion * (DOMAIN.maximumMetres - DOMAIN.minimumMetres);
      const envelope = Math.exp(-.5 * ((xMetres - values.groupDistanceMetres) / values.packetSigmaMetres) ** 2);
      points.push(`${index ? "L" : "M"}${svgNumber(plotX + plotWidth * proportion)} ${svgNumber(centreY - sign * amplitude * envelope)}`);
    }
    return points.join("");
  }

  function envelopeAreaPath(values, plotX, plotWidth, centreY, amplitude, samples = 180) {
    const points = [];
    for (let index = 0; index <= samples; index += 1) {
      const proportion = index / samples;
      const xMetres = DOMAIN.minimumMetres + proportion * (DOMAIN.maximumMetres - DOMAIN.minimumMetres);
      const envelope = Math.exp(-.5 * ((xMetres - values.groupDistanceMetres) / values.packetSigmaMetres) ** 2);
      points.push(`${index ? "L" : "M"}${svgNumber(plotX + plotWidth * proportion)} ${svgNumber(centreY - amplitude * envelope)}`);
    }
    for (let index = samples; index >= 0; index -= 1) {
      const proportion = index / samples;
      const xMetres = DOMAIN.minimumMetres + proportion * (DOMAIN.maximumMetres - DOMAIN.minimumMetres);
      const envelope = Math.exp(-.5 * ((xMetres - values.groupDistanceMetres) / values.packetSigmaMetres) ** 2);
      points.push(`L${svgNumber(plotX + plotWidth * proportion)} ${svgNumber(centreY + amplitude * envelope)}`);
    }
    return `${points.join("")}Z`;
  }

  function packetSvg() {
    const values = waveData();
    const plotX = 34, plotWidth = 516, centreY = 176, amplitude = 45;
    const startX = mapDistance(0, plotX, plotWidth);
    const phaseX = mapDistance(values.phaseDistanceMetres, plotX, plotWidth);
    const groupX = mapDistance(values.groupDistanceMetres, plotX, plotWidth);
    const trackedCrestY = centreY - amplitude * values.trackedCrestEnvelopeFraction;
    const surface = surfacePath(values, plotX, plotWidth, centreY, amplitude);
    const upperEnvelope = envelopePath(values, 1, plotX, plotWidth, centreY, amplitude);
    const lowerEnvelope = envelopePath(values, -1, plotX, plotWidth, centreY, amplitude);
    const envelopeArea = envelopeAreaPath(values, plotX, plotWidth, centreY, amplitude);
    const ticks = [-20, 0, 20, 40, 60, 80, 100, 120];
    const markerOpacity = values.trackedCrestEnvelopeFraction;
    const phaseLabelAnchor = values.phaseDistanceMetres > 95 ? "end" : "start";
    const phaseLabelOffset = values.phaseDistanceMetres > 95 ? -7 : 7;
    const description = `A narrow-band deep-water wave packet has central wavelength ${format(state.wavelengthMetres, 2)} metres. At ${format(state.timeSeconds, 2)} seconds, its constant-phase marker has travelled ${format(values.phaseDistanceMetres, 3)} metres at ${format(values.phaseSpeedMetresPerSecond, 3)} metres per second. The envelope centre has travelled ${format(values.groupDistanceMetres, 3)} metres at ${format(values.groupSpeedMetresPerSecond, 3)} metres per second. The phase marker is ${format(values.phaseGroupSeparationMetres, 3)} metres ahead and its local envelope amplitude has fallen to ${format(markerOpacity * 100, 2)} percent.`;
    return `<svg class="p186-packet p186-stage-${state.stage}" viewBox="0 0 760 455" role="img" aria-labelledby="p186-packet-title p186-packet-desc"><title id="p186-packet-title">A carrier crest moving through and ahead of a slower wave-packet envelope</title><desc id="p186-packet-desc">${description}</desc><defs><linearGradient id="p186-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff2f0"/><stop offset="1" stop-color="#f5ead4"/></linearGradient><linearGradient id="p186-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9caa"/><stop offset="1" stop-color="#163f58"/></linearGradient><marker id="p186-phase-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p186-group-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><clipPath id="p186-plot-clip"><rect x="34" y="72" width="516" height="180" rx="12"/></clipPath></defs><rect class="p186-board" x="1" y="1" width="758" height="453" rx="19"/><rect class="p186-sky" x="18" y="42" width="548" height="225" rx="15"/><g class="p186-grid" aria-hidden="true">${ticks.map((tick) => `<line x1="${svgNumber(mapDistance(tick, plotX, plotWidth))}" y1="72" x2="${svgNumber(mapDistance(tick, plotX, plotWidth))}" y2="417"/>`).join("")}</g><text class="p186-board-kicker" x="24" y="27">DEEP-WATER PACKET · ONE CONSTANT-PHASE MARKER · TWO VELOCITIES</text><g clip-path="url(#p186-plot-clip)"><path class="p186-envelope-area" d="${envelopeArea}"/><path class="p186-sea-fill" d="${surface}L${plotX + plotWidth} 251L${plotX} 251Z"/><path class="p186-envelope" d="${upperEnvelope}"/><path class="p186-envelope" d="${lowerEnvelope}"/><path class="p186-surface" d="${surface}"/></g><line class="p186-start-line" x1="${svgNumber(startX)}" y1="67" x2="${svgNumber(startX)}" y2="421"/><text class="p186-start-label" x="${svgNumber(startX)}" y="62" text-anchor="middle">shared start · 0 m</text><g class="p186-group-marker"><line x1="${svgNumber(groupX)}" y1="84" x2="${svgNumber(groupX)}" y2="252"/><circle cx="${svgNumber(groupX)}" cy="176" r="7"/><text x="${svgNumber(groupX - 7)}" y="80" text-anchor="end">PACKET CENTRE</text></g><g class="p186-phase-marker ${markerOpacity < .08 ? "is-faded" : ""}"><line x1="${svgNumber(phaseX)}" y1="84" x2="${svgNumber(phaseX)}" y2="252"/><circle cx="${svgNumber(phaseX)}" cy="${svgNumber(trackedCrestY)}" r="7"/><text x="${svgNumber(phaseX + phaseLabelOffset)}" y="95" text-anchor="${phaseLabelAnchor}">MARKED PHASE CREST</text></g><text class="p186-envelope-label" x="${svgNumber(groupX)}" y="235" text-anchor="middle">envelope A(x−cᵍt)</text><g class="p186-axis">${ticks.map((tick) => `<text x="${svgNumber(mapDistance(tick, plotX, plotWidth))}" y="277" text-anchor="middle">${tick} m</text>`).join("")}</g><g class="p186-race"><text class="p186-race-title" x="34" y="301">DISTANCE FROM THE SHARED START</text><g class="p186-phase-lane"><text x="34" y="326">PHASE CREST · cₚ</text><line x1="${svgNumber(startX)}" y1="342" x2="${svgNumber(phaseX)}" y2="342" marker-end="url(#p186-phase-arrow)"/><text x="${svgNumber(phaseX + phaseLabelOffset)}" y="360" text-anchor="${phaseLabelAnchor}">${format(values.phaseDistanceMetres, 2)} m</text></g><g class="p186-group-lane"><text x="34" y="381">PACKET · cᵍ</text><line x1="${svgNumber(startX)}" y1="397" x2="${svgNumber(groupX)}" y2="397" marker-end="url(#p186-group-arrow)"/><text x="${svgNumber(groupX + 7)}" y="415">${format(values.groupDistanceMetres, 2)} m</text></g></g><g class="p186-ledger" transform="translate(580 29)"><rect width="157" height="393" rx="14"/><text class="p186-ledger-title" x="14" y="25">PACKET LEDGER</text><text class="p186-ledger-kicker" x="14" y="58">WAVE SCALE</text><text class="p186-ledger-label" x="14" y="83">λ</text><text class="p186-ledger-value" x="143" y="83" text-anchor="end">${format(state.wavelengthMetres, 1)} m</text><text class="p186-ledger-label" x="14" y="107">k=2π/λ</text><text class="p186-ledger-value" x="143" y="107" text-anchor="end">${format(values.wavenumberPerMetre, 4)} m⁻¹</text><text class="p186-ledger-label" x="14" y="131">ω=√(gk)</text><text class="p186-ledger-value" x="143" y="131" text-anchor="end">${format(values.angularFrequencyPerSecond, 4)} s⁻¹</text><line class="p186-ledger-rule" x1="14" y1="151" x2="143" y2="151"/><text class="p186-ledger-kicker" x="14" y="181">THE TWO CLOCKS</text><text class="p186-ledger-label" x="14" y="205">phase cₚ=ω/k</text><text class="p186-ledger-value is-phase" x="143" y="205" text-anchor="end">${format(values.phaseSpeedMetresPerSecond, 3)} m/s</text><text class="p186-ledger-label" x="14" y="231">group cᵍ=dω/dk</text><text class="p186-ledger-value is-group" x="143" y="231" text-anchor="end">${state.stage >= 1 || state.revealed ? `${format(values.groupSpeedMetresPerSecond, 3)} m/s` : "stage 2"}</text><text class="p186-ledger-label" x="14" y="257">ratio cᵍ/cₚ</text><text class="p186-ledger-value" x="143" y="257" text-anchor="end">${state.stage >= 2 || state.revealed ? "1/2" : "stage 3"}</text><line class="p186-ledger-rule" x1="14" y1="277" x2="143" y2="277"/><text class="p186-ledger-kicker" x="14" y="306">AT t=${format(state.timeSeconds, 1)} s</text><text class="p186-ledger-label" x="14" y="330">crest position</text><text class="p186-ledger-value is-phase" x="143" y="330" text-anchor="end">${format(values.phaseDistanceMetres, 2)} m</text><text class="p186-ledger-label" x="14" y="354">packet position</text><text class="p186-ledger-value is-group" x="143" y="354" text-anchor="end">${state.stage >= 1 || state.revealed ? `${format(values.groupDistanceMetres, 2)} m` : "stage 2"}</text><text class="p186-ledger-label" x="14" y="378">crest amplitude here</text><text class="p186-ledger-value" x="143" y="378" text-anchor="end">${format(markerOpacity * 100, 1)}%</text></g></svg>`;
  }

  function transportMarkup() {
    const values = waveData();
    return `<section class="p186-transport" aria-label="Wave-packet time controls"><div class="p186-time-readout"><span>Model time</span><strong>${format(state.timeSeconds, 2)} s</strong><small>crest leads packet by ${format(values.phaseGroupSeparationMetres, 2)} m</small></div><label for="p186-time"><span>Scrub from 0 to 20 s<output>${format(state.timeSeconds, 1)} s</output></span><input id="p186-time" type="range" min="0" max="${DISPLAY_TIME_SECONDS}" step="0.1" value="${state.timeSeconds}" aria-valuetext="${format(state.timeSeconds, 1)} seconds; phase crest ${format(values.phaseDistanceMetres, 2)} metres; packet centre ${format(values.groupDistanceMetres, 2)} metres"/></label><div class="p186-transport-actions"><button class="primary-button" type="button" data-problem-action="p186-play" aria-pressed="${state.playing}">${state.playing ? "Pause" : state.timeSeconds >= DISPLAY_TIME_SECONDS ? "Replay 20 s" : "Play to 20 s"}</button><button class="chip-button" type="button" data-problem-action="p186-moment" data-p186-time="0">0 s</button><button class="chip-button" type="button" data-problem-action="p186-moment" data-p186-time="10">10 s</button><button class="chip-button" type="button" data-problem-action="p186-moment" data-p186-time="20">20 s</button></div></section>`;
  }

  function dispersionCard() {
    if (state.stage < 2 && !state.revealed) return "";
    const curve = Array.from({ length: 81 }, (_, index) => { const q = 2 * index / 80; const x = 44 + 118 * q; const y = 130 - 67 * Math.sqrt(q); return `${index ? "L" : "M"}${svgNumber(x)} ${svgNumber(y)}`; }).join("");
    const tangentStartQ = .25, tangentEndQ = 1.78;
    const tangentStart = { x: 44 + 118 * tangentStartQ, y: 130 - 67 * (.5 + .5 * tangentStartQ) };
    const tangentEnd = { x: 44 + 118 * tangentEndQ, y: 130 - 67 * (.5 + .5 * tangentEndQ) };
    return `<section class="p186-dispersion-card" aria-labelledby="p186-dispersion-heading"><div><span class="eyebrow">Why the pulse lags</span><h3 id="p186-dispersion-heading">A dispersive medium has two geometrical slopes</h3><p>On the deep-water curve ω=√(gk), phase speed is the secant slope ω/k from the origin. Group speed is the local tangent slope dω/dk. The square-root curve bends downward, making the tangent exactly half as steep at every k.</p><div class="p186-dispersion-equation">cₚ=ω/k=√(g/k)<br>cᵍ=dω/dk=½√(g/k)=cₚ/2</div></div><svg viewBox="0 0 320 160" role="img" aria-labelledby="p186-dispersion-graph-title p186-dispersion-graph-desc"><title id="p186-dispersion-graph-title">Deep-water dispersion curve with secant and tangent slopes</title><desc id="p186-dispersion-graph-desc">The square-root angular-frequency curve bends down. At the selected wavenumber, the origin secant representing phase speed has twice the slope of the tangent representing group speed.</desc><line class="p186-graph-axis" x1="44" y1="130" x2="294" y2="130"/><line class="p186-graph-axis" x1="44" y1="138" x2="44" y2="20"/><path class="p186-dispersion-curve" d="${curve}"/><line class="p186-phase-secant" x1="44" y1="130" x2="162" y2="63"/><line class="p186-group-tangent" x1="${svgNumber(tangentStart.x)}" y1="${svgNumber(tangentStart.y)}" x2="${svgNumber(tangentEnd.x)}" y2="${svgNumber(tangentEnd.y)}"/><circle class="p186-graph-point" cx="162" cy="63" r="5"/><text class="p186-graph-label" x="292" y="147">k</text><text class="p186-graph-label" x="32" y="22">ω</text><text class="p186-graph-label is-curve" x="249" y="32">ω=√(gk)</text><text class="p186-graph-label is-phase" x="87" y="113">secant · cₚ</text><text class="p186-graph-label is-group" x="189" y="96">tangent · cᵍ</text><text class="p186-graph-label" x="162" y="148" text-anchor="middle">selected k</text></svg></section>`;
  }

  function metricsMarkup() {
    const values = waveData();
    return `<section class="p186-metrics" aria-live="polite"><div><span>Phase speed · crests</span><strong>${format(values.phaseSpeedMetresPerSecond, 3)} m/s</strong><small>ω/k</small></div><div><span>Group speed · packet</span><strong>${format(values.groupSpeedMetresPerSecond, 3)} m/s</strong><small>dω/dk=cₚ/2</small></div><div><span>Separation now</span><strong>${format(values.phaseGroupSeparationMetres, 2)} m</strong><small>phase marker ahead</small></div></section>`;
  }

  function statusMarkup() {
    const values = waveData();
    const faded = values.trackedCrestEnvelopeFraction < .08;
    return `<div class="p186-status" role="status"><strong>${faded ? "The marked crest has escaped the visible packet." : "The marked crest is moving through the packet."}</strong> A phase marker is a location of equal phase, not a permanent parcel of water or energy. New crests appear at the packet’s rear as old ones fade at its front.</div>`;
  }

  function dynamicMarkup() { return `<div class="p186-dynamic"><div class="p186-packet-wrap">${packetSvg()}${transportMarkup()}</div>${metricsMarkup()}${dispersionCard()}${statusMarkup()}</div>`; }

  function controlsMarkup() {
    const values = waveData();
    return `<section class="p186-controls" aria-label="Wavelength exploration control"><label for="p186-wavelength"><span>Central wavelength λ<output data-p186-output="wavelength">${format(state.wavelengthMetres, 1)} m</output></span><input id="p186-wavelength" type="range" min="4" max="20" step="0.5" value="${state.wavelengthMetres}" aria-valuetext="Wavelength ${format(state.wavelengthMetres, 1)} metres; phase speed ${format(values.phaseSpeedMetresPerSecond, 3)} metres per second; group speed ${format(values.groupSpeedMetresPerSecond, 3)} metres per second"/></label><p data-p186-control-note>Longer deep-water waves move faster because cₚ∝√λ, but the group-to-phase ratio remains 1:2. The packet picture is a first-order narrow-band model; real dispersive packets also broaden over longer times.</p><button class="chip-button" type="button" data-problem-action="p186-challenge">Restore fixed λ=10 m challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p186-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p186-solution" aria-labelledby="p186-solution-heading"><h3 id="p186-solution-heading" tabindex="-1">The phase crest travels exactly twice as far as the packet</h3><p>For λ=10 m, the wavenumber is k=2π/λ=2π/10 m⁻¹. Deep-water gravity waves obey ω²=gk, so</p><div class="p186-solution-equation">cₚ=ω/k=√(g/k)=√(gλ/2π)<br>=√((9.81 m/s²)(10 m)/(2π))<br>=3.9513415… m/s.</div><p>The packet envelope moves at the group speed—the derivative of the dispersion relation:</p><div class="p186-solution-equation">cᵍ=d(√(gk))/dk=½√(g/k)=cₚ/2<br>=1.9756708… m/s.</div><p>Multiplying each speed by 20 s gives the two requested positions measured from their shared start:</p><div class="p186-solution-equation is-answer">phase crest: xₚ=cₚt=79.0268… m ≈ <strong>79.0 m</strong><br>packet centre: xᵍ=cᵍt=39.5134… m ≈ <strong>39.5 m</strong>.</div><p>The marked constant-phase location is therefore 39.5134… m ahead of the packet centre. Its amplitude has almost vanished because crests are not carried permanently with the pulse. The envelope is the relevant marker for the packet’s energy and information in this narrow-band approximation.</p></section>`;
  }

  function snapshot() {
    const values = waveData();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "first-order narrow-band Gaussian deep-water gravity-wave packet; envelope centre uses group velocity; packet broadening omitted", gravityMetresPerSecondSquared: GRAVITY, centralWavelengthMetres: state.wavelengthMetres, wavenumberPerMetre: values.wavenumberPerMetre, angularFrequencyPerSecond: values.angularFrequencyPerSecond, frequencyHertz: values.frequencyHertz, periodSeconds: values.periodSeconds, phaseSpeedMetresPerSecond: values.phaseSpeedMetresPerSecond, groupSpeedMetresPerSecond: values.groupSpeedMetresPerSecond, groupToPhaseSpeedRatio: values.groupSpeedMetresPerSecond / values.phaseSpeedMetresPerSecond, timeSeconds: state.timeSeconds, phaseCrestDistanceMetres: values.phaseDistanceMetres, packetEnvelopeDistanceMetres: values.groupDistanceMetres, phaseGroupSeparationMetres: values.phaseGroupSeparationMetres, packetSigmaMetres: values.packetSigmaMetres, trackedCrestEnvelopeFraction: values.trackedCrestEnvelopeFraction, phaseCyclesAdvanced: values.phaseCyclesAdvanced, dispersionIdentityResidual: Number(values.dispersionIdentityResidual.toExponential(6)), phaseIdentityResidual: Number(values.phaseIdentityResidual.toExponential(6)), groupIdentityResidual: Number(values.groupIdentityResidual.toExponential(6)), distanceIdentityResidual: Number(values.distanceIdentityResidual.toExponential(6)), challenge: { wavelengthMetres: CHALLENGE.wavelengthMetres, timeSeconds: CHALLENGE.timeSeconds, phaseSpeedMetresPerSecond: challenge.phaseSpeedMetresPerSecond, groupSpeedMetresPerSecond: challenge.groupSpeedMetresPerSecond, phaseCrestDistanceMetres: challenge.phaseDistanceMetres, packetEnvelopeDistanceMetres: challenge.groupDistanceMetres }, playing: state.playing, stage: state.stage + 1, answers: state.answers, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.wavelengthMetres = CHALLENGE.wavelengthMetres; state.timeSeconds = 0; }
  function render() {
    return `<main class="book-shell p186-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · dispersive waves</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p186-spread"><article class="book-page p186-problem-page"><div class="problem-number">Problem 18.6</div><h1 class="book-title p186-title">The Pulse That Runs Away from Its Ripples</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div>${originalExtensionNote()}<p class="problem-copy">A narrow packet of deep-water gravity waves has central wavelength 10 m. At t=0, mark the carrier crest at the packet’s centre. Take g=9.81 m/s².</p><p class="problem-copy"><strong>After 20 s, how far has the marked constant-phase crest travelled, and how far has the packet envelope travelled?</strong></p><section class="p186-observation-card"><strong>A crest is not the pulse</strong><p>Dispersion lets individual phase crests move through an envelope. The packet’s energy follows the group speed, not the faster phase speed.</p></section><section class="p186-model-card"><div class="eyebrow">Deep-water limit</div><p>Use ω²=gk with k=2π/λ. The packet is narrow-band, so its envelope centre moves at dω/dk.</p></section></article><section class="book-page book-stage p186-stage">${stageControls()}<div class="p186-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p186-coach"><div class="coach-kicker">Keep two speeds separate</div><p class="coach-question">For the fixed λ=10 m packet at t=20 s, enter both distances from the shared start.</p><form class="p186-answer-form" data-p186-answer-form novalidate><label for="p186-phase-answer">Marked phase crest</label><div><input id="p186-phase-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answers.phase)}" placeholder="phase distance" autocomplete="off"/><span>m</span></div><label for="p186-group-answer">Packet envelope centre</label><div><input id="p186-group-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answers.group)}" placeholder="group distance" autocomplete="off"/><span>m</span></div><button class="primary-button" type="submit">Check both distances</button></form>${feedbackMarkup()}<div class="button-row p186-help-row"><button class="secondary-button" type="button" data-problem-action="p186-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p186-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p186-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function stopPlayback() {
    state.playing = false; playbackStartedAt = null; lastAnimationPaint = 0;
    if (animationFrame !== null && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p186-shell"); if (!root) { stopPlayback(); return; }
    const dynamic = root.querySelector(".p186-dynamic");
    const active = document.activeElement;
    let restoreFocusSelector = "";
    if (dynamic?.contains(active)) {
      if (active.id === "p186-time") restoreFocusSelector = "#p186-time";
      else if (active.dataset?.problemAction === "p186-play") restoreFocusSelector = '[data-problem-action="p186-play"]';
      else if (active.dataset?.problemAction === "p186-moment") restoreFocusSelector = `[data-problem-action="p186-moment"][data-p186-time="${active.dataset.p186Time}"]`;
    }
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = waveData();
    const output = root.querySelector('[data-p186-output="wavelength"]'); if (output) output.textContent = `${format(state.wavelengthMetres, 1)} m`;
    root.querySelector("#p186-wavelength")?.setAttribute("aria-valuetext", `Wavelength ${format(state.wavelengthMetres, 1)} metres; phase speed ${format(values.phaseSpeedMetresPerSecond, 3)} metres per second; group speed ${format(values.groupSpeedMetresPerSecond, 3)} metres per second`);
    if (restoreFocusSelector) { const replacement = root.querySelector(restoreFocusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }

  function startPlayback() {
    if (state.timeSeconds >= DISPLAY_TIME_SECONDS) state.timeSeconds = 0;
    state.playing = true; playbackStartedAt = null; lastAnimationPaint = 0;
    const tick = (timestamp) => {
      if (!state.playing) return;
      if (!document.querySelector(".p186-shell")) { stopPlayback(); return; }
      if (playbackStartedAt === null) playbackStartedAt = timestamp - state.timeSeconds / DISPLAY_TIME_SECONDS * PLAYBACK_MILLISECONDS;
      state.timeSeconds = clamp((timestamp - playbackStartedAt) / PLAYBACK_MILLISECONDS * DISPLAY_TIME_SECONDS, 0, DISPLAY_TIME_SECONDS);
      const finished = state.timeSeconds >= DISPLAY_TIME_SECONDS;
      if (finished) stopPlayback();
      if (finished || timestamp - lastAnimationPaint >= 45) { updateDynamicDom(); lastAnimationPaint = timestamp; }
      if (state.playing) animationFrame = window.requestAnimationFrame(tick);
    };
    updateDynamicDom(); animationFrame = window.requestAnimationFrame(tick);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p186-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p186-play") { if (state.playing) { stopPlayback(); updateDynamicDom(); } else startPlayback(); return; }
      stopPlayback();
      if (action === "p186-reset") { state = initialState(); renderAndFocus(renderApp, "#p186-time"); return; }
      if (action === "p186-stage") { state.stage = clamp(Number(control.dataset.p186Stage), 0, 2); renderAndFocus(renderApp, `[data-p186-stage="${state.stage}"]`); return; }
      if (action === "p186-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p186-stage="${state.stage}"]`); return; }
      if (action === "p186-moment") { state.timeSeconds = clamp(Number(control.dataset.p186Time), 0, DISPLAY_TIME_SECONDS); updateDynamicDom(); return; }
      if (action === "p186-challenge") restoreChallenge();
      if (action === "p186-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p186-reveal") { state.revealed = true; state.stage = 2; state.wavelengthMetres = CHALLENGE.wavelengthMetres; state.timeSeconds = CHALLENGE.timeSeconds; }
      renderApp(); if (action === "p186-reveal") window.requestAnimationFrame(() => document.querySelector("#p186-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p186-time")) { stopPlayback(); state.timeSeconds = clamp(Number(event.target.value), 0, DISPLAY_TIME_SECONDS); updateDynamicDom(); return; }
      if (!event.target.matches("#p186-wavelength")) return;
      stopPlayback(); state.wavelengthMetres = clamp(Number(event.target.value), 4, 20); updateDynamicDom();
    });
    const phaseInput = document.querySelector("#p186-phase-answer");
    const groupInput = document.querySelector("#p186-group-answer");
    phaseInput?.addEventListener("input", (event) => { state.answers.phase = sanitizeNumber(event.target.value); });
    groupInput?.addEventListener("input", (event) => { state.answers.group = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p186-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); stopPlayback();
      state.answers.phase = sanitizeNumber(phaseInput?.value).trim(); state.answers.group = sanitizeNumber(groupInput?.value).trim();
      const phaseAnswer = Number(state.answers.phase), groupAnswer = Number(state.answers.group);
      const phaseCorrect = Number.isFinite(phaseAnswer) && Math.abs(phaseAnswer - challenge.phaseDistanceMetres) <= .15;
      const groupCorrect = Number.isFinite(groupAnswer) && Math.abs(groupAnswer - challenge.groupDistanceMetres) <= .15;
      state.feedbackTone = "warn"; state.committed = false;
      if (!state.answers.phase || !state.answers.group || !Number.isFinite(phaseAnswer) || !Number.isFinite(groupAnswer)) state.feedback = "Enter two numerical distances: first the phase crest, then the packet centre.";
      else if (Math.abs(phaseAnswer - challenge.groupDistanceMetres) <= .15 && Math.abs(groupAnswer - challenge.phaseDistanceMetres) <= .15) state.feedback = "Those values are reversed. The faster phase crest travels about 79.0 m; the envelope travels about 39.5 m.";
      else if (phaseCorrect && !groupCorrect) state.feedback = "The phase distance is right. Differentiate ω=√(gk): the packet moves at half that speed and covers half that distance.";
      else if (!phaseCorrect && groupCorrect) state.feedback = "The packet distance is right. The constant-phase crest moves at cₚ=2cᵍ and covers twice as much ground.";
      else if (!phaseCorrect || !groupCorrect) state.feedback = "Use cₚ=√(gλ/2π), cᵍ=cₚ/2, then multiply each by 20 s.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.wavelengthMetres = CHALLENGE.wavelengthMetres; state.timeSeconds = CHALLENGE.timeSeconds; state.feedback = "Correct: the phase crest travels 79.0 m while the packet centre travels 39.5 m."; }
      renderAndFocus(renderApp, "#p186-phase-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
