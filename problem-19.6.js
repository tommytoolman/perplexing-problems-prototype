(function registerBottleEscapeConePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "19.6";
  const DEFAULT_B_MIN_TESLA = .50;
  const DEFAULT_B_MAX_TESLA = 2.00;
  const DEFAULT_MIRROR_RATIO = DEFAULT_B_MAX_TESLA / DEFAULT_B_MIN_TESLA;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Invariant", title: "Perpendicular motion owns a magnetic moment", copy: "For slow field variation, μmag=mv⊥²/(2B) stays constant. Entering stronger B therefore transfers kinetic energy from parallel motion into perpendicular motion." }),
    Object.freeze({ short: "Mirror", title: "A particle turns when parallel speed reaches zero", copy: "At the mirror point all kinetic energy is perpendicular. A larger launch pitch angle reaches that condition at a weaker field, sooner inside the bottle." }),
    Object.freeze({ short: "Cone", title: "The mirror field sets one sharp angular boundary", copy: "If the required mirror field exceeds Bmax, the particle escapes. Equality is marginal; a lower required field produces reflection before the throat." }),
  ]);
  const hints = Object.freeze([
    "Write the launch speeds as v⊥=v sin α and v∥=v cos α at Bmin.",
    "At a mirror point v∥=0, so the total speed is entirely perpendicular while μmag remains conserved.",
    "Conservation gives Bmirror=Bmin/sin²α. The critical particle mirrors exactly at Bmax.",
    "Set Bmax=Bmin/sin²αc, so sin²αc=Bmin/Bmax=0.50/2.00=1/4.",
    "Since 0°≤αc≤90°, sin αc=1/2 gives αc=30°. Below it particles escape; above it they mirror; equality is marginal.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p196-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "∞"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function parseAngle(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replace(/°$/, "");
    return /^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
  }

  function bottleData(pitchAngleDegrees, bMinTesla = DEFAULT_B_MIN_TESLA, bMaxTesla = DEFAULT_B_MAX_TESLA) {
    const ratio = bMaxTesla / bMinTesla;
    const criticalRadians = Math.asin(Math.sqrt(bMinTesla / bMaxTesla));
    const criticalDegrees = criticalRadians * 180 / Math.PI;
    const pitchRadians = pitchAngleDegrees * Math.PI / 180;
    const sinSquaredPitch = Math.sin(pitchRadians) ** 2;
    const requiredMirrorFieldTesla = sinSquaredPitch > 0 ? bMinTesla / sinSquaredPitch : Infinity;
    const thresholdResidual = sinSquaredPitch - bMinTesla / bMaxTesla;
    const tolerance = 1e-10;
    const fate = thresholdResidual < -tolerance ? "escape" : thresholdResidual > tolerance ? "mirror" : "marginal";
    const mirrorLocationNormalized = fate === "escape" ? 1 : Math.sqrt(clamp((requiredMirrorFieldTesla - bMinTesla) / (bMaxTesla - bMinTesla), 0, 1));
    const parallelFractionAtMaximumSquared = cleanZero(1 - ratio * sinSquaredPitch);
    return {
      bMinTesla,
      bMaxTesla,
      ratio,
      criticalRadians,
      criticalDegrees,
      pitchRadians,
      sinSquaredPitch,
      requiredMirrorFieldTesla,
      thresholdResidual: cleanZero(thresholdResidual),
      fate,
      mirrorLocationNormalized,
      parallelFractionAtMaximumSquared,
      escapingParallelSpeedFractionAtMaximum: fate === "escape" ? Math.sqrt(parallelFractionAtMaximumSquared) : 0,
      magneticMomentNormalized: sinSquaredPitch / bMinTesla,
      criticalIdentityResidual: cleanZero(Math.sin(criticalRadians) ** 2 - bMinTesla / bMaxTesla),
    };
  }

  const challenge = Object.freeze(bottleData(30));

  function initialState() {
    return {
      pitchAngleDegrees: 20,
      bMinTesla: DEFAULT_B_MIN_TESLA,
      mirrorRatio: DEFAULT_MIRROR_RATIO,
      flightPhasePercent: 36,
      stage: 0,
      boardMessage: "At 20°, the particle lies inside the loss cone and escapes through the right mirror throat.",
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();

  function bMaxTesla() { return state.bMinTesla * state.mirrorRatio; }
  function currentBottleData() { return bottleData(state.pitchAngleDegrees, state.bMinTesla, bMaxTesla()); }
  function fieldAtNormalizedPosition(normalized, bMin = state.bMinTesla, bMax = bMaxTesla()) { return bMin + (bMax - bMin) * normalized ** 2; }

  function particleState(phasePercent = state.flightPhasePercent, data = currentBottleData()) {
    const equatorX = 265, throatX = 465, centreY = 165, phase = clamp(phasePercent, 0, 100) / 100;
    let normalizedPosition, direction;
    if (data.fate === "mirror") {
      const turnPhase = .55;
      if (phase <= turnPhase) { normalizedPosition = data.mirrorLocationNormalized * phase / turnPhase; direction = "toward mirror"; }
      else { normalizedPosition = data.mirrorLocationNormalized * (1 - (phase - turnPhase) / (1 - turnPhase)); direction = "returning to equator"; }
    } else {
      normalizedPosition = phase;
      direction = data.fate === "marginal" && phase >= 1 ? "stopped at boundary" : "toward right throat";
    }
    normalizedPosition = clamp(normalizedPosition, 0, 1);
    const localFieldTesla = fieldAtNormalizedPosition(normalizedPosition, data.bMinTesla, data.bMaxTesla);
    const perpendicularSpeedFractionSquared = clamp(localFieldTesla * data.sinSquaredPitch / data.bMinTesla, 0, 1);
    const parallelSpeedFractionMagnitude = Math.sqrt(clamp(cleanZero(1 - perpendicularSpeedFractionSquared), 0, 1));
    const directionSign = direction === "returning to equator" ? -1 : direction === "stopped at boundary" ? 0 : 1;
    const x = equatorX + (throatX - equatorX) * normalizedPosition;
    const gyrationAmplitude = 7 + 23 * Math.sin(data.pitchRadians);
    const y = centreY - gyrationAmplitude * Math.sin(phase * Math.PI * 12);
    return {
      phase,
      normalizedPosition,
      x,
      y,
      direction,
      localFieldTesla,
      perpendicularSpeedFraction: Math.sqrt(perpendicularSpeedFractionSquared),
      parallelSpeedFraction: directionSign * parallelSpeedFractionMagnitude,
      speedIdentityResidual: cleanZero(perpendicularSpeedFractionSquared + parallelSpeedFractionMagnitude ** 2 - 1),
    };
  }

  function stageControlsMarkup() {
    return `<div class="p196-stage-controls" role="group" aria-label="Magnetic mirror reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p196-stage" data-p196-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p196-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p196-next-stage" ${state.stage >= stages.length - 1 ? "disabled" : ""}>${state.stage >= stages.length - 1 ? "Cone resolved" : "Next stage"}</button></div>`;
  }

  function fieldLinesMarkup() {
    const centreX = 265, centreY = 165, halfWidth = 200;
    return [-72, -48, -24, 0, 24, 48, 72].map((offset) => {
      const points = Array.from({ length: 81 }, (_, index) => {
        const normalizedX = -1 + 2 * index / 80;
        const b = fieldAtNormalizedPosition(Math.abs(normalizedX));
        const widthScale = Math.sqrt(state.bMinTesla / b);
        const x = centreX + halfWidth * normalizedX;
        const y = centreY + offset * widthScale;
        return `${index ? "L" : "M"}${format(x, 3)} ${format(y, 3)}`;
      }).join(" ");
      return `<path d="${points}"/>`;
    }).join("");
  }

  function profilePath() {
    return Array.from({ length: 101 }, (_, index) => {
      const normalized = -1 + 2 * index / 100;
      const fraction = (fieldAtNormalizedPosition(Math.abs(normalized)) - state.bMinTesla) / (bMaxTesla() - state.bMinTesla);
      const x = 65 + 400 * index / 100;
      const y = 365 - 43 * fraction;
      return `${index ? "L" : "M"}${format(x, 3)} ${format(y, 3)}`;
    }).join(" ");
  }

  function trajectoryPath(data = currentBottleData()) {
    const phaseLimit = state.flightPhasePercent / 100;
    return Array.from({ length: 81 }, (_, index) => {
      const phase = phaseLimit * index / 80;
      const point = particleState(phase * 100, data);
      return `${index ? "L" : "M"}${format(point.x, 3)} ${format(point.y, 3)}`;
    }).join(" ");
  }

  function coneMarkup(data) {
    const originX = 602, originY = 127, rayLength = 106;
    const critical = data.criticalRadians;
    const pitch = data.pitchRadians;
    const upperCriticalX = originX + rayLength * Math.cos(critical), upperCriticalY = originY - rayLength * Math.sin(critical);
    const lowerCriticalX = originX + rayLength * Math.cos(critical), lowerCriticalY = originY + rayLength * Math.sin(critical);
    const velocityX = originX + 98 * Math.cos(pitch), velocityY = originY - 98 * Math.sin(pitch);
    const showCritical = state.stage >= 2 || state.revealed;
    return `<g class="p196-cone"><path class="p196-cone-fill" d="M${originX} ${originY}L${format(upperCriticalX, 3)} ${format(upperCriticalY, 3)}A${rayLength} ${rayLength} 0 0 1 ${format(lowerCriticalX, 3)} ${format(lowerCriticalY, 3)}Z"/><line class="p196-cone-axis" x1="${originX - 13}" y1="${originY}" x2="${originX + 120}" y2="${originY}" marker-end="url(#p196-axis-arrow)"/><line class="p196-cone-boundary" x1="${originX}" y1="${originY}" x2="${format(upperCriticalX, 3)}" y2="${format(upperCriticalY, 3)}"/><line class="p196-cone-boundary" x1="${originX}" y1="${originY}" x2="${format(lowerCriticalX, 3)}" y2="${format(lowerCriticalY, 3)}"/><line class="p196-velocity-arrow is-${data.fate}" x1="${originX}" y1="${originY}" x2="${format(velocityX, 3)}" y2="${format(velocityY, 3)}" marker-end="url(#p196-velocity-arrow)"/><text class="p196-cone-title" x="${originX}" y="39" text-anchor="middle">VELOCITY-SPACE LOSS CONE</text><text class="p196-cone-label" x="${originX + 58}" y="${originY + 13}">field axis</text><text class="p196-cone-angle" x="${originX + 28}" y="${originY - 10}">α=${format(state.pitchAngleDegrees, 1)}°</text><text class="p196-cone-critical" x="${originX + 70}" y="${originY - 51}">${showCritical ? `αc=${format(data.criticalDegrees, 2)}°` : "critical boundary"}</text></g>`;
  }

  function bottleSvg() {
    const data = currentBottleData(), particle = particleState(), mirrorX = 265 + 200 * data.mirrorLocationNormalized;
    const showMirror = data.fate !== "escape";
    const showFormula = state.stage >= 2 || state.revealed;
    const description = `Symmetric magnetic bottle with equatorial field ${format(state.bMinTesla, 4)} tesla and mirror field ${format(bMaxTesla(), 4)} tesla, ratio ${format(data.ratio, 4)}. A particle launches from the equator at pitch angle ${format(state.pitchAngleDegrees, 4)} degrees. Critical half-angle is ${format(data.criticalDegrees, 6)} degrees. Its required mirror field is ${format(data.requiredMirrorFieldTesla, 6)} tesla, so its fate is ${data.fate}. At flight phase ${format(state.flightPhasePercent, 2)} percent it is ${particle.direction}, at local field ${format(particle.localFieldTesla, 5)} tesla, with parallel speed fraction ${format(particle.parallelSpeedFraction, 5)} and perpendicular speed fraction ${format(particle.perpendicularSpeedFraction, 5)}.`;
    return `<svg class="p196-bottle p196-stage-${state.stage} is-${data.fate}" viewBox="0 0 760 410" role="img" aria-labelledby="p196-bottle-title p196-bottle-desc"><title id="p196-bottle-title">Interactive magnetic bottle, particle trajectory and velocity-space escape cone</title><desc id="p196-bottle-desc">${description}</desc><defs><marker id="p196-axis-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker><marker id="p196-velocity-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker><marker id="p196-travel-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker></defs><rect class="p196-bottle-bg" x="1" y="1" width="758" height="408" rx="20"/><text class="p196-bottle-kicker" x="21" y="27">MAGNETIC BOTTLE · μmag AND TOTAL ENERGY CONSERVED</text><g class="p196-coils"><g transform="translate(65 165)"><ellipse rx="16" ry="78"/><ellipse rx="24" ry="86"/><ellipse rx="32" ry="94"/></g><g transform="translate(465 165)"><ellipse rx="16" ry="78"/><ellipse rx="24" ry="86"/><ellipse rx="32" ry="94"/></g></g><g class="p196-field-lines">${fieldLinesMarkup()}</g><line class="p196-field-axis" x1="42" y1="165" x2="492" y2="165" marker-end="url(#p196-axis-arrow)"/><text class="p196-equator-label" x="265" y="284" text-anchor="middle">EQUATOR · Bmin=${format(state.bMinTesla, 2)} T</text><text class="p196-mirror-label" x="465" y="284" text-anchor="middle">MIRROR · Bmax=${format(bMaxTesla(), 2)} T</text>${showMirror ? `<line class="p196-mirror-point" x1="${format(mirrorX, 3)}" y1="74" x2="${format(mirrorX, 3)}" y2="258"/><text class="p196-mirror-point-label" x="${format(mirrorX, 3)}" y="67" text-anchor="middle">${data.fate === "marginal" ? "MARGINAL AT THROAT" : `MIRROR AT ${format(data.requiredMirrorFieldTesla, 2)} T`}</text>` : ""}<path class="p196-trajectory is-${data.fate}" d="${trajectoryPath(data)}" marker-end="url(#p196-travel-arrow)"/><circle class="p196-particle is-${data.fate}" cx="${format(particle.x, 3)}" cy="${format(particle.y, 3)}" r="7"/><text class="p196-particle-status" x="265" y="309" text-anchor="middle">${data.fate.toUpperCase()} · ${particle.direction.toUpperCase()}</text><g class="p196-profile"><line x1="65" y1="365" x2="465" y2="365"/><path d="${profilePath()}"/><text x="65" y="388">Bmax</text><text x="253" y="388">Bmin</text><text x="439" y="388">Bmax</text></g>${coneMarkup(data)}<g class="p196-ledger" transform="translate(535 216)"><rect width="200" height="166" rx="13"/><text class="p196-ledger-title" x="14" y="23">PARTICLE FATE</text><text class="p196-ledger-label" x="14" y="52">pitch angle α</text><text class="p196-ledger-value" x="185" y="52" text-anchor="end">${format(state.pitchAngleDegrees, 2)}°</text><text class="p196-ledger-label" x="14" y="79">required Bmirror</text><text class="p196-ledger-value" x="185" y="79" text-anchor="end">${format(data.requiredMirrorFieldTesla, 3)} T</text><text class="p196-ledger-label" x="14" y="106">boundary αc</text><text class="p196-ledger-value" x="185" y="106" text-anchor="end">${showFormula ? `${format(data.criticalDegrees, 2)}°` : "stage 3"}</text><rect class="p196-fate-box is-${data.fate}" x="10" y="119" width="180" height="34" rx="8"/><text x="100" y="141" text-anchor="middle">${data.fate.toUpperCase()}</text></g></svg>`;
  }

  function readingsMarkup() {
    const data = currentBottleData(), particle = particleState();
    return `<section class="p196-readings" aria-label="Magnetic bottle particle values" aria-live="polite"><article><span>Pitch / critical</span><strong>${format(state.pitchAngleDegrees, 1)}° / ${format(data.criticalDegrees, 1)}°</strong><small>${data.thresholdResidual < 0 ? "inside" : data.thresholdResidual > 0 ? "outside" : "on"} escape-cone boundary</small></article><article class="is-fate"><span>Particle fate</span><strong>${data.fate}</strong><small>needs B=${format(data.requiredMirrorFieldTesla, 3)} T</small></article><article><span>Current velocity split</span><strong>|v∥| ${format(Math.abs(particle.parallelSpeedFraction), 3)}</strong><small>v⊥ ${format(particle.perpendicularSpeedFraction, 3)} · normalized total speed 1</small></article></section>`;
  }

  function coneLessonMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const data = currentBottleData();
    return `<section class="p196-cone-lesson" aria-labelledby="p196-cone-lesson-heading"><div><span class="eyebrow">Escape-cone boundary</span><h3 id="p196-cone-lesson-heading">Ask whether the required mirror field exists</h3></div><div class="p196-cone-equation">Bmirror=Bmin/sin²α &nbsp; and &nbsp; sin²αc=Bmin/Bmax=1/R<br>Current profile: αc=sin⁻¹(1/√${format(data.ratio, 3)})=<strong>${format(data.criticalDegrees, 3)}°</strong></div><div class="p196-fate-rules"><span>α&lt;αc <strong>escape</strong></span><span>α=αc <strong>marginal</strong></span><span>α&gt;αc <strong>mirror</strong></span></div></section>`;
  }

  function dynamicMarkup() {
    const data = currentBottleData();
    return `<div class="p196-dynamic"><div class="p196-bottle-wrap">${bottleSvg()}${readingsMarkup()}</div>${coneLessonMarkup()}<div class="p196-board-message is-${data.fate}" role="status">Pitch ${format(state.pitchAngleDegrees, 1)}° is ${data.fate === "escape" ? "inside the loss cone: the particle escapes" : data.fate === "mirror" ? "outside the loss cone: the particle mirrors" : "exactly on the loss-cone boundary: marginal"}.</div></div>`;
  }

  function controlsMarkup() {
    const data = currentBottleData();
    return `<section class="p196-controls" aria-label="Magnetic bottle controls"><div class="p196-pitch-presets" role="group" aria-label="Pitch-angle fate presets"><button class="secondary-button" type="button" data-problem-action="p196-preset" data-p196-preset="escape">Inside cone · escape</button><button class="secondary-button" type="button" data-problem-action="p196-preset" data-p196-preset="marginal">Boundary · marginal</button><button class="secondary-button" type="button" data-problem-action="p196-preset" data-p196-preset="mirror">Outside cone · mirror</button></div><div class="p196-slider-grid"><label for="p196-pitch"><span>Launch pitch α <output data-p196-output="pitch">${format(state.pitchAngleDegrees, 1)}°</output></span><input id="p196-pitch" data-p196-slider="pitch" type="range" min="0" max="90" step=".1" value="${state.pitchAngleDegrees}"/></label><label for="p196-flight"><span>Flight phase <output data-p196-output="flight">${format(state.flightPhasePercent, 0)}%</output></span><input id="p196-flight" data-p196-slider="flight" type="range" min="0" max="100" step="1" value="${state.flightPhasePercent}"/></label><label for="p196-bmin"><span>Equatorial Bmin <output data-p196-output="bmin">${format(state.bMinTesla, 2)} T</output></span><input id="p196-bmin" data-p196-slider="bmin" type="range" min=".2" max="1" step=".05" value="${state.bMinTesla}"/></label><label for="p196-ratio"><span>Mirror ratio R <output data-p196-output="ratio">${format(state.mirrorRatio, 2)} · Bmax ${format(bMaxTesla(), 2)} T</output></span><input id="p196-ratio" data-p196-slider="ratio" type="range" min="1.2" max="8" step=".1" value="${state.mirrorRatio}"/></label></div><div class="p196-control-summary">Current boundary ${format(data.criticalDegrees, 2)}° · selected particle ${data.fate}.</div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="p196-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }

  function hintsMarkup() {
    return state.hintsUsed ? `<div class="hint-stack p196-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : "";
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p196-solution" aria-labelledby="p196-solution-heading" aria-live="polite"><h3 id="p196-solution-heading">The marginal particle spends all its parallel energy at Bmax</h3><p>At the equator, v⊥=v sin α. Conservation of μmag=mv⊥²/(2B) and total kinetic energy implies that at a mirror point, where v∥=0,</p><div class="p196-equation">Bmirror=Bmin/sin²α.</div><p>The critical trajectory mirrors exactly at the strongest available field:</p><div class="p196-equation is-answer">sin²αc=Bmin/Bmax=0.50/2.00=1/4<br>sin αc=1/2<br><strong>escape-cone half-angle αc=30°</strong></div><p>For α&lt;30°, the required mirror field exceeds 2.00 T, so the particle escapes. For α&gt;30°, it mirrors before the throat. At α=30° it reaches Bmax with v∥=0 and is marginal. An identical loss cone exists around the opposite field direction at the other end.</p></section>`;
  }

  function snapshot() {
    const data = currentBottleData(), particle = particleState();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      model: "adiabatic guiding-centre magnetic mirror with conserved first magnetic moment and constant total kinetic energy",
      equatorialFieldTesla: state.bMinTesla,
      maximumMirrorFieldTesla: bMaxTesla(),
      mirrorRatio: data.ratio,
      pitchAngleDegrees: state.pitchAngleDegrees,
      sinSquaredPitch: data.sinSquaredPitch,
      criticalHalfAngleDegrees: data.criticalDegrees,
      criticalIdentityResidual: data.criticalIdentityResidual,
      requiredMirrorFieldTesla: Number.isFinite(data.requiredMirrorFieldTesla) ? data.requiredMirrorFieldTesla : null,
      fate: data.fate,
      mirrorLocationNormalized: data.mirrorLocationNormalized,
      magneticMomentNormalized: data.magneticMomentNormalized,
      flightPhasePercent: state.flightPhasePercent,
      particle: { direction: particle.direction, normalizedPosition: particle.normalizedPosition, localFieldTesla: particle.localFieldTesla, parallelSpeedFraction: particle.parallelSpeedFraction, perpendicularSpeedFraction: particle.perpendicularSpeedFraction, speedIdentityResidual: particle.speedIdentityResidual },
      challenge: { bMinTesla: DEFAULT_B_MIN_TESLA, bMaxTesla: DEFAULT_B_MAX_TESLA, ratio: DEFAULT_MIRROR_RATIO, criticalHalfAngleDegrees: challenge.criticalDegrees, classification: { below: "escape", equal: "marginal", above: "mirror" } },
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function restoreChallenge() {
    state.bMinTesla = DEFAULT_B_MIN_TESLA;
    state.mirrorRatio = DEFAULT_MIRROR_RATIO;
    state.pitchAngleDegrees = 30;
    state.flightPhasePercent = 100;
  }

  function render() {
    return `<main class="book-shell p196-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · magnetic mirrors</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p196-spread"><article class="book-page p196-problem-page"><div class="problem-number">Problem 19.6</div><h1 class="book-title p196-title">The Bottle’s Escape Cone</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p196-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A magnetic bottle has equatorial field Bmin=0.50 T and maximum mirror field Bmax=2.00 T. A particle launches at pitch angle α to the field at the equator.</p><p class="problem-copy"><strong>What is the loss-cone critical half-angle αc?</strong></p><section class="p196-given-grid" aria-label="Magnetic bottle values"><span>Bmin <strong>0.50 T</strong></span><span>Bmax <strong>2.00 T</strong></span><span>ratio R <strong>4</strong></span><span>invariants <strong>μmag, energy</strong></span></section><section class="p196-rule-card"><strong>Pitch angle</strong><p>α=0° is motion entirely along the field; α=90° is entirely perpendicular. The loss cone surrounds each parallel direction.</p></section></article><section class="book-page book-stage p196-stage" aria-labelledby="p196-stage-title">${stageControlsMarkup()}<div class="p196-stage-heading"><div><span class="eyebrow">Magnetic-bottle laboratory</span><h2 id="p196-stage-title">Find the angle that just reaches the throat</h2></div><p>Vary pitch angle and mirror ratio, then scrub the flight to see escape, marginal arrival or reflection.</p></div>${dynamicMarkup()}${controlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p196-coach"><div class="coach-kicker">Calculate the cone</div><p class="coach-question">Enter the fixed bottle’s critical half-angle in degrees.</p><form class="p196-answer-form" data-p196-answer-form novalidate><label for="p196-answer">Critical half-angle αc</label><div><input id="p196-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="angle"/><span>°</span></div><button class="primary-button" type="submit">Check half-angle</button></form>${feedbackMarkup()}<div class="button-row p196-help-row"><button class="secondary-button" type="button" data-problem-action="p196-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p196-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p196-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const data = currentBottleData();
    const dynamic = root.querySelector(".p196-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = {
      pitch: `${format(state.pitchAngleDegrees, 1)}°`,
      flight: `${format(state.flightPhasePercent, 0)}%`,
      bmin: `${format(state.bMinTesla, 2)} T`,
      ratio: `${format(state.mirrorRatio, 2)} · Bmax ${format(bMaxTesla(), 2)} T`,
    };
    Object.entries(outputs).forEach(([key, value]) => {
      const output = root.querySelector(`[data-p196-output="${key}"]`);
      if (output) output.textContent = value;
      const slider = root.querySelector(`[data-p196-slider="${key}"]`);
      if (slider) slider.value = String(key === "pitch" ? state.pitchAngleDegrees : key === "flight" ? state.flightPhasePercent : key === "bmin" ? state.bMinTesla : state.mirrorRatio);
    });
    const summary = root.querySelector(".p196-control-summary");
    if (summary) summary.textContent = `Current boundary ${format(data.criticalDegrees, 2)}° · selected particle ${data.fate}.`;
    root.querySelector('[data-p196-slider="pitch"]')?.setAttribute("aria-valuetext", `${format(state.pitchAngleDegrees, 1)} degrees; particle ${data.fate}`);
    root.querySelector('[data-p196-slider="flight"]')?.setAttribute("aria-valuetext", `${format(state.flightPhasePercent, 0)} percent; particle ${particleState().direction}`);
    root.querySelector('[data-p196-slider="bmin"]')?.setAttribute("aria-valuetext", `${format(state.bMinTesla, 2)} tesla; critical angle ${format(data.criticalDegrees, 2)} degrees`);
    root.querySelector('[data-p196-slider="ratio"]')?.setAttribute("aria-valuetext", `mirror ratio ${format(state.mirrorRatio, 2)}; maximum field ${format(bMaxTesla(), 2)} tesla; critical angle ${format(data.criticalDegrees, 2)} degrees`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p196-shell");
    if (!root) return;

    root.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-p196-slider]");
      if (!slider) return;
      const key = slider.dataset.p196Slider;
      if (key === "pitch") state.pitchAngleDegrees = clamp(Number(slider.value), 0, 90);
      if (key === "flight") state.flightPhasePercent = clamp(Math.round(Number(slider.value)), 0, 100);
      if (key === "bmin") state.bMinTesla = clamp(Number(slider.value), .2, 1);
      if (key === "ratio") state.mirrorRatio = clamp(Number(slider.value), 1.2, 8);
      const data = currentBottleData();
      state.boardMessage = `α=${format(state.pitchAngleDegrees, 1)}°, αc=${format(data.criticalDegrees, 2)}°: particle ${data.fate}.`;
      updateLiveDom(root);
    });

    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p196-reset") { state = initialState(); renderAndFocus(renderApp, "#p196-pitch"); return; }
      if (action === "p196-preset") {
        const critical = currentBottleData().criticalDegrees;
        const preset = control.dataset.p196Preset;
        state.pitchAngleDegrees = preset === "escape" ? Math.max(0, critical * .65) : preset === "mirror" ? Math.min(90, critical * 1.4) : critical;
        state.flightPhasePercent = preset === "marginal" ? 100 : 55;
        renderAndFocus(renderApp, "#p196-pitch");
        return;
      }
      if (action === "p196-stage") { state.stage = clamp(Math.round(Number(control.dataset.p196Stage)), 0, stages.length - 1); renderAndFocus(renderApp, `[data-p196-stage="${state.stage}"]`); return; }
      if (action === "p196-next-stage") { state.stage = Math.min(stages.length - 1, state.stage + 1); renderAndFocus(renderApp, `[data-p196-stage="${state.stage}"]`); return; }
      if (action === "p196-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p196-reveal") { state.revealed = true; state.stage = stages.length - 1; restoreChallenge(); }
      renderApp();
    });

    root.querySelector("#p196-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value.slice(0, 24);
      state.feedback = "";
      state.committed = false;
    });

    root.querySelector("[data-p196-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p196-answer")?.value || "";
      const answer = parseAngle(raw);
      state.answer = raw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(answer) || answer < 0 || answer > 90) state.feedback = "Enter one half-angle between 0° and 90°.";
      else if (Math.abs(answer - challenge.criticalDegrees) <= .05) {
        state.feedbackTone = "success";
        state.feedback = "Correct: αc=30°. Below it particles escape, above it they mirror, and equality is marginal.";
        state.committed = true;
        state.stage = stages.length - 1;
        restoreChallenge();
      } else if (Math.abs(answer - 60) <= .1) state.feedback = "Sixty degrees is the complementary angle. Here sin αc=1/2, so the loss-cone half-angle from the field axis is 30°.";
      else state.feedback = "Set the required mirror field equal to Bmax: sin²αc=Bmin/Bmax=1/4.";
      renderAndFocus(renderApp, "#p196-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
