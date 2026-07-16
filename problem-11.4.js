(function registerMartianCavemanPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "11.4";
  const ARC_MINUTE_RADIANS = Math.PI / (180 * 60);
  const TRACKS = Object.freeze({
    one: Object.freeze({ label: "★ Angular size", short: "One-star track" }),
    four: Object.freeze({ label: "★★★★ Diffraction", short: "Four-star track" }),
  });
  const STAGES = Object.freeze({
    one: Object.freeze([
      Object.freeze({ short: "Geometry", title: "Place the caveman and the distant person", copy: "Angular height depends on physical height and line-of-sight distance, not on either quantity alone." }),
      Object.freeze({ short: "Angle", title: "Convert the ray opening into an angle", copy: "For a centred feature, θ=2 arctan(H/2L). The small-angle estimate H/L is excellent here but remains an approximation." }),
      Object.freeze({ short: "Visibility", title: "Compare with a stated eye threshold", copy: "This introductory track uses 1 arcminute as a simplified visibility threshold; contrast, lighting and recognition are deliberately omitted." }),
    ]),
    four: Object.freeze([
      Object.freeze({ short: "Geometry", title: "Find the separation angle of two Martian lights", copy: "Two sources separated by s at range L subtend θ=2 arctan(s/2L)." }),
      Object.freeze({ short: "Airy pattern", title: "Account for diffraction at a circular aperture", copy: "The Rayleigh angular scale is θR=1.22λ/D. A larger aperture or shorter wavelength narrows the diffraction pattern." }),
      Object.freeze({ short: "Resolve", title: "Compare geometry with diffraction", copy: "The ideal Rayleigh test resolves the pair when θ≥θR. Equality sets the minimum aperture for the challenge." }),
    ]),
  });
  const HINTS = Object.freeze({
    one: Object.freeze([
      "Use distance L=10,000 m and person height H=1.80 m in θ=2 arctan(H/2L).",
      "The angle is approximately 1.80/10,000=1.8×10⁻⁴ radians.",
      "Convert radians to arcminutes by multiplying by (180/π)×60.",
    ]),
    four: Object.freeze([
      "The two lights subtend θ=2 arctan[s/(2L)] with s=1.00 m and L=100,000 m.",
      "At the resolution boundary set θ=θR=1.22λ/D.",
      "Rearrange to Dmin=1.22λ/θ and use λ=550×10⁻⁹ m.",
      "Convert the final aperture from metres to millimetres.",
    ]),
  });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p114-reset">Reset</button>';

  const trackState = (values) => ({ ...values, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  const initialState = () => ({
    track: "one",
    one: trackState({ distanceKm: 10, featureM: 1.8 }),
    four: trackState({ distanceKm: 100, featureM: 1, wavelengthNm: 550, apertureMm: 7 }),
  });
  let state = initialState();

  function active() { return state[state.track]; }
  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function opticsData(track = state.track, values = active()) {
    const distance = values.distanceKm * 1000;
    const feature = values.featureM;
    const angularSize = 2 * Math.atan(feature / (2 * distance));
    const smallAngle = feature / distance;
    const angularArcminutes = angularSize * 180 * 60 / Math.PI;
    if (track === "one") {
      const thresholdDistance = feature / (2 * Math.tan(ARC_MINUTE_RADIANS / 2));
      return { distance, feature, angularSize, smallAngle, angularArcminutes, threshold: ARC_MINUTE_RADIANS, thresholdArcminutes: 1, thresholdDistance, ratio: angularSize / ARC_MINUTE_RADIANS, visible: angularSize >= ARC_MINUTE_RADIANS, approximationResidual: smallAngle - angularSize };
    }
    const wavelength = values.wavelengthNm * 1e-9;
    const aperture = values.apertureMm * 1e-3;
    const rayleighAngle = 1.22 * wavelength / aperture;
    const minimumAperture = 1.22 * wavelength / angularSize;
    return { distance, feature, angularSize, smallAngle, angularArcminutes, wavelength, aperture, rayleighAngle, minimumAperture, ratio: angularSize / rayleighAngle, visible: angularSize >= rayleighAngle, approximationResidual: smallAngle - angularSize };
  }

  const oneChallenge = opticsData("one", { distanceKm: 10, featureM: 1.8 });
  const fourChallenge = opticsData("four", { distanceKm: 100, featureM: 1, wavelengthNm: 550, apertureMm: 7 });

  function reconstructionNote() {
    return `<p class="p114-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and unusual one-star-or-four-star rating. Both selectable optics tracks below are newly written and do not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function trackPicker() {
    return `<div class="p114-track-picker" role="group" aria-label="Choose problem difficulty track">${Object.entries(TRACKS).map(([key, track]) => `<button class="chip-button ${state.track === key ? "active" : ""}" type="button" data-problem-action="p114-track" data-p114-track="${key}" aria-pressed="${state.track === key}">${track.label}</button>`).join("")}</div>`;
  }

  function stageControls() {
    const current = active();
    return `<div class="p114-stage-controls" role="group" aria-label="${TRACKS[state.track].short} reasoning stages">${STAGES[state.track].map((stage, index) => `<button class="secondary-button ${current.stage === index ? "active" : ""}" type="button" data-problem-action="p114-stage" data-p114-stage="${index}" aria-pressed="${current.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const current = active();
    const stage = STAGES[state.track][current.stage];
    return `<div class="p114-stage-caption"><div><div class="eyebrow">${TRACKS[state.track].short} · stage ${current.stage + 1}</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p114-next-stage" ${current.stage >= 2 ? "disabled" : ""}>${current.stage >= 2 ? "Optics compared" : "Next stage"}</button></div>`;
  }

  function geometrySvg() {
    const current = active();
    const values = opticsData();
    const angleVisible = current.stage >= 1 || current.revealed;
    const resultVisible = current.stage >= 2 || current.revealed;
    const viewerX = 60, viewerY = 218, targetX = 395;
    const visualHalf = state.track === "one" ? 62 : 47;
    const topY = viewerY - visualHalf, bottomY = viewerY + visualHalf;
    const airySeparation = state.track === "four" ? Math.min(112, 38 * values.ratio) : 0;
    const statusValue = current.stage === 0 ? `L=${format(current.distanceKm, 1)} km` : current.stage === 1 ? state.track === "one" ? `θ=${format(values.angularArcminutes, 5)}′` : `θ=${format(values.angularSize * 1e6, 5)} μrad` : values.visible ? state.track === "one" ? "ABOVE 1′ THRESHOLD" : "RAYLEIGH RESOLVED" : state.track === "one" ? "BELOW 1′ THRESHOLD" : "DIFFRACTION BLENDED";
    const resultDescription = resultVisible ? state.track === "one" ? ` The angular height is ${format(values.angularArcminutes, 5)} arcminutes and is ${values.visible ? "above" : "below"} the stated one arcminute threshold.` : ` The Rayleigh angle is ${format(values.rayleighAngle * 1e6, 5)} microradians and the pair is ${values.visible ? "resolved" : "not resolved"}.` : "";
    return `<svg class="p114-svg p114-stage-${current.stage} is-${state.track} ${values.visible ? "is-resolved" : "is-unresolved"}" viewBox="0 0 720 445" role="img" aria-labelledby="p114-svg-title p114-svg-desc"><title id="p114-svg-title">Angular geometry and ${state.track === "one" ? "human visibility threshold" : "diffraction resolution"}</title><desc id="p114-svg-desc">A ${format(values.feature, 2)} metre ${state.track === "one" ? "person" : "light separation"} is viewed from ${format(current.distanceKm, 1)} kilometres away.${angleVisible ? ` Exact angular size is ${format(values.angularSize * 1e6, 6)} microradians.` : ""}${resultDescription}</desc><defs><radialGradient id="p114-airy-a"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".18" stop-color="#ffe88a" stop-opacity=".94"/><stop offset=".48" stop-color="#d99c32" stop-opacity=".35"/><stop offset="1" stop-color="#7650a2" stop-opacity="0"/></radialGradient><radialGradient id="p114-airy-b"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".18" stop-color="#b9e4ff" stop-opacity=".94"/><stop offset=".48" stop-color="#468ab0" stop-opacity=".35"/><stop offset="1" stop-color="#7650a2" stop-opacity="0"/></radialGradient></defs><rect class="p114-board" x="1" y="1" width="718" height="443" rx="20"/><g class="p114-geometry" aria-hidden="true"><line class="p114-axis" x1="${viewerX}" y1="${viewerY}" x2="${targetX + 25}" y2="${viewerY}"/><line class="p114-ray" x1="${viewerX}" y1="${viewerY}" x2="${targetX}" y2="${topY}"/><line class="p114-ray" x1="${viewerX}" y1="${viewerY}" x2="${targetX}" y2="${bottomY}"/><path class="p114-angle-arc" d="M104 ${viewerY - 8}Q112 ${viewerY} 104 ${viewerY + 8}"/><g class="p114-viewer" transform="translate(${viewerX} ${viewerY})"><circle r="16"/><circle class="p114-pupil" r="5"/><text y="36" text-anchor="middle">${state.track === "one" ? "caveman eye" : `${format(current.apertureMm, 1)} mm aperture`}</text></g>${state.track === "one" ? `<g class="p114-person" transform="translate(${targetX} ${viewerY})"><circle cy="-48" r="12"/><path d="M0-36V20M-22-12H22M0 20L-20 58M0 20L20 58"/><line class="p114-size-bracket" x1="35" y1="${-visualHalf}" x2="35" y2="${visualHalf}"/><text x="45" y="4">H=${format(values.feature, 2)} m</text></g>` : `<g class="p114-lights"><circle cx="${targetX}" cy="${topY}" r="9"/><circle cx="${targetX}" cy="${bottomY}" r="9"/><line class="p114-size-bracket" x1="${targetX + 27}" y1="${topY}" x2="${targetX + 27}" y2="${bottomY}"/><text x="${targetX + 36}" y="${viewerY + 4}">s=${format(values.feature, 2)} m</text></g>`}<text class="p114-distance-label" x="${(viewerX + targetX) / 2}" y="${viewerY + 92}" text-anchor="middle">L=${format(current.distanceKm, 1)} km · schematic, not to scale</text><text class="p114-angle-label" x="118" y="${viewerY - 13}">${angleVisible ? state.track === "one" ? `${format(values.angularArcminutes, 5)}′` : `${format(values.angularSize * 1e6, 5)} μrad` : "θ"}</text>${state.track === "four" ? `<g class="p114-airy" transform="translate(250 357)"><rect x="-132" y="-50" width="264" height="88" rx="13"/><text class="p114-airy-title" x="0" y="-31" text-anchor="middle">IDEAL AIRY IMAGES · separation / Rayleigh = ${format(values.ratio, 3)}</text><circle cx="${format(-airySeparation / 2, 2)}" cy="1" r="38" fill="url(#p114-airy-a)"/><circle cx="${format(airySeparation / 2, 2)}" cy="1" r="38" fill="url(#p114-airy-b)"/></g>` : `<g class="p114-threshold-ruler" transform="translate(172 346)"><rect width="242" height="56" rx="12"/><text x="16" y="23">TEACHING EYE THRESHOLD</text><text x="16" y="43">1 arcminute · current ratio ${format(values.ratio, 3)}</text></g>`}</g><g class="p114-status" aria-hidden="true" transform="translate(470 24)"><rect width="230" height="79" rx="14"/><text class="p114-status-kicker" x="16" y="22">${TRACKS[state.track].short.toUpperCase()}</text><text class="p114-status-value" x="16" y="50">${statusValue}</text><text class="p114-status-note" x="16" y="68">feature ${format(values.feature, 2)} m at ${format(current.distanceKm, 1)} km</text></g><g class="p114-angle-panel" aria-hidden="true" transform="translate(470 124)"><rect width="230" height="132" rx="14"/><text class="p114-panel-kicker" x="16" y="24">ANGULAR GEOMETRY</text><text class="p114-equation" x="115" y="53" text-anchor="middle">θ=2 atan(feature/2L)</text><text class="p114-panel-label" x="16" y="82">exact θ</text><text class="p114-panel-number" x="214" y="82" text-anchor="end">${angleVisible ? `${format(values.angularSize * 1e6, 6)} μrad` : "stage 2"}</text><text class="p114-panel-label" x="16" y="107">small-angle feature/L</text><text class="p114-panel-number" x="214" y="107" text-anchor="end">${angleVisible ? `${format(values.smallAngle * 1e6, 6)} μrad` : "stage 2"}</text></g><g class="p114-result-panel" aria-hidden="true" transform="translate(470 278)"><rect width="230" height="138" rx="14"/><text class="p114-panel-kicker" x="16" y="24">${state.track === "one" ? "SIMPLIFIED VISIBILITY" : "RAYLEIGH RESOLUTION"}</text>${state.track === "one" ? `<text class="p114-panel-label" x="16" y="54">threshold</text><text class="p114-panel-number" x="214" y="54" text-anchor="end">1.000 arcmin</text><text class="p114-result-value" x="115" y="91" text-anchor="middle">${resultVisible ? values.visible ? "visible-sized" : "too small" : "stage 3"}</text><text class="p114-result-note" x="115" y="116" text-anchor="middle">threshold range ${format(values.thresholdDistance / 1000, 3)} km</text>` : `<text class="p114-panel-label" x="16" y="54">θR=1.22λ/D</text><text class="p114-panel-number" x="214" y="54" text-anchor="end">${format(values.rayleighAngle * 1e6, 5)} μrad</text><text class="p114-result-value" x="115" y="88" text-anchor="middle">${resultVisible ? values.visible ? "resolved" : "blended" : "stage 3"}</text><text class="p114-result-note" x="115" y="113" text-anchor="middle">minimum D ${format(values.minimumAperture * 1000, 4)} mm</text>`}</g></svg>`;
  }

  function metricsMarkup() {
    const current = active(), values = opticsData();
    const angleVisible = current.stage >= 1 || current.revealed;
    const resultVisible = current.stage >= 2 || current.revealed;
    const comparison = state.track === "one" ? `${format(values.ratio, 4)} × 1′ threshold` : `${format(values.ratio, 4)} × Rayleigh angle`;
    const result = state.track === "one" ? values.visible ? "Above size threshold" : "Below size threshold" : values.visible ? "Rayleigh resolved" : "Diffraction blended";
    return `<section class="p114-metrics" aria-live="polite"><div><span>Exact angular size</span><strong>${angleVisible ? `${format(values.angularSize * 1e6, 6)} μrad` : "stage 2"}</strong></div><div><span>Angular size in arcminutes</span><strong>${angleVisible ? `${format(values.angularArcminutes, 6)}′` : "stage 2"}</strong></div><div><span>${state.track === "one" ? "Threshold ratio" : "Resolution ratio θ/θR"}</span><strong>${resultVisible ? comparison : "stage 3"}</strong></div><div><span>Idealized result</span><strong>${resultVisible ? result : "stage 3"}</strong></div>${resultVisible ? `<p>The small-angle residual feature/L−θ is ${values.approximationResidual.toExponential(2)} rad. ${state.track === "one" ? "The 1′ rule is a stated teaching convention, not a complete model of detection or recognition." : "Rayleigh’s 1.22 factor assumes monochromatic incoherent point sources and an unobstructed circular aperture."}</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p114-dynamic">${geometrySvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const current = active(), values = opticsData();
    if (state.track === "one") return `<section class="p114-controls" aria-label="One-star angular size controls"><div class="p114-control-grid"><label for="p114-distance"><span>Viewing distance L<output data-p114-output="distance">${format(current.distanceKm, 1)} km</output></span><input id="p114-distance" type="range" min="1" max="50" step="0.5" value="${current.distanceKm}"/></label><label for="p114-feature"><span>Person / object height H<output data-p114-output="feature">${format(current.featureM, 2)} m</output></span><input id="p114-feature" type="range" min="0.2" max="5" step="0.1" value="${current.featureM}"/></label></div><p>The 1 arcminute threshold is held fixed. It represents angular-size visibility only—not contrast, colour, atmospheric haze or recognition.</p><div class="p114-presets"><button class="chip-button" type="button" data-problem-action="p114-preset" data-p114-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p114-preset" data-p114-preset="threshold">Exactly 1′</button><button class="chip-button" type="button" data-problem-action="p114-preset" data-p114-preset="near">Nearby person</button></div></section>`;
    return `<section class="p114-controls" aria-label="Four-star diffraction controls"><div class="p114-control-grid"><label for="p114-distance"><span>Viewing distance L<output data-p114-output="distance">${format(current.distanceKm, 1)} km</output></span><input id="p114-distance" type="range" min="10" max="500" step="5" value="${current.distanceKm}"/></label><label for="p114-feature"><span>Two-light separation s<output data-p114-output="feature">${format(current.featureM, 2)} m</output></span><input id="p114-feature" type="range" min="0.1" max="5" step="0.1" value="${current.featureM}"/></label><label for="p114-wavelength"><span>Wavelength λ<output data-p114-output="wavelength">${format(current.wavelengthNm, 0)} nm</output></span><input id="p114-wavelength" type="range" min="380" max="700" step="5" value="${current.wavelengthNm}"/></label><label for="p114-aperture"><span>Pupil / aperture D<output data-p114-output="aperture">${format(current.apertureMm, 2)} mm · θ/θR=${format(values.ratio, 3)}</output></span><input id="p114-aperture" type="range" min="1" max="200" step="1" value="${current.apertureMm}"/></label></div><p>Changing aperture changes diffraction, not the geometric separation angle. The Airy picture is normalized to its own diffraction radius rather than drawn at the encounter’s physical scale.</p><div class="p114-presets"><button class="chip-button" type="button" data-problem-action="p114-preset" data-p114-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p114-preset" data-p114-preset="rayleigh">At Rayleigh limit</button><button class="chip-button" type="button" data-problem-action="p114-preset" data-p114-preset="telescope">Large telescope</button><button class="chip-button" type="button" data-problem-action="p114-preset" data-p114-preset="red">Red light</button></div></section>`;
  }

  function problemCopy() {
    if (state.track === "one") return `<p class="problem-copy">A caveman tries to see the angular height of a 1.80 m person standing 10.0 km away across an ideal clear plain.</p><p class="problem-copy"><strong>Find the person’s angular height in arcminutes</strong>, then compare it with the stated 1 arcminute teaching threshold.</p>`;
    return `<p class="problem-copy">A Martian telescope views two monochromatic 550 nm lights separated by 1.00 m at a range of 100 km.</p><p class="problem-copy"><strong>Find the minimum circular-aperture diameter in millimetres</strong> that resolves them by the Rayleigh criterion.</p>`;
  }

  function feedbackMarkup() { const current = active(); return current.feedback ? `<div class="math2-feedback is-${current.feedbackTone}" role="status">${current.feedback}</div>` : ""; }
  function hintsMarkup() { const current = active(); return current.hintsUsed ? `<div class="hint-stack p114-hints" aria-live="polite">${HINTS[state.track].slice(0, current.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    const current = active(); if (!current.revealed) return "";
    if (state.track === "one") return `<section class="p114-solution" aria-labelledby="p114-solution-heading"><h3 id="p114-solution-heading" tabindex="-1">Convert the opening angle, not the height</h3><div class="p114-equation">θ=2 arctan[1.80/(2×10,000)]<br>=${format(oneChallenge.angularSize, 12)} rad</div><div class="p114-equation">θ=${format(oneChallenge.angularArcminutes, 9)} arcmin</div><p>This is below the stipulated 1 arcminute size threshold. The same 1.80 m height reaches exactly 1′ at ${format(oneChallenge.thresholdDistance / 1000, 6)} km in this geometric model.</p><p class="p114-checks"><strong>Checks and idealisations.</strong> H/L=1.8×10⁻⁴ rad agrees to the shown precision; radians are dimensionless and multiplying by 180×60/π produces arcminutes. Angular size halves when distance doubles and doubles when height doubles. The threshold is not a claim that the person is absolutely invisible: visual detection depends on contrast, illumination, orientation, atmospheric seeing and the distinction between detecting and recognizing an object.</p></section>`;
    return `<section class="p114-solution" aria-labelledby="p114-solution-heading"><h3 id="p114-solution-heading" tabindex="-1">Set the geometric separation equal to the Airy scale</h3><div class="p114-equation">θ=2 arctan[1/(2×100,000)]<br>=${format(fourChallenge.angularSize, 14)} rad</div><p>At the Rayleigh boundary, θ=1.22λ/D. Therefore</p><div class="p114-equation">Dmin=1.22λ/θ<br>=1.22(550×10⁻⁹)/${format(fourChallenge.angularSize, 14)}<br>=${format(fourChallenge.minimumAperture, 12)} m<br>=${format(fourChallenge.minimumAperture * 1000, 9)} mm</div><p>A 7 mm pupil has θ/θR=${format(fourChallenge.ratio, 6)}, so its ideal diffraction patterns are strongly blended.</p><p class="p114-checks"><strong>Checks and idealisations.</strong> Dmin grows linearly with wavelength and distance and inversely with source separation. Since λ/θ has units metres, the aperture units are correct. Rayleigh’s factor 1.22 assumes an unobstructed circular aperture, monochromatic mutually incoherent point sources, perfect focus, no aberration, adequate contrast and noiseless detection. Atmospheric seeing, finite source size, detector sampling and human neural processing are omitted; Rayleigh is a convention, not an absolute information boundary.</p></section>`;
  }

  function snapshot() {
    const current = active(), values = opticsData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and unusual rating only", selectedTrack: state.track, displayedDifficulty: TRACKS[state.track].label, distanceKilometres: current.distanceKm, physicalFeatureMetres: current.featureM, exactAngularSizeRadians: Number(values.angularSize.toPrecision(12)), exactAngularSizeArcminutes: Number(values.angularArcminutes.toFixed(9)), smallAngleRadians: Number(values.smallAngle.toPrecision(12)), approximationResidualRadians: values.approximationResidual, wavelengthNanometres: state.track === "four" ? current.wavelengthNm : null, apertureMillimetres: state.track === "four" ? current.apertureMm : null, rayleighAngleRadians: state.track === "four" ? Number(values.rayleighAngle.toPrecision(12)) : null, minimumRayleighApertureMillimetres: state.track === "four" ? Number((values.minimumAperture * 1000).toFixed(9)) : null, thresholdRatio: Number(values.ratio.toFixed(9)), idealizedResolvedOrVisible: values.visible, stage: current.stage + 1, committed: current.committed, hintsUsed: current.hintsUsed, solutionRevealed: current.revealed }, null, 2);
  }

  function render() {
    const current = active();
    const answerMeta = state.track === "one" ? { kicker: "Measure the angular person", question: "For the fixed 1.80 m at 10.0 km challenge, enter the angular height.", label: "Angular height", unit: "arcmin", placeholder: "angle in arcminutes" } : { kicker: "Open the Martian aperture", question: "For the fixed 550 nm two-light challenge, enter the minimum Rayleigh aperture.", label: "Minimum aperture", unit: "mm", placeholder: "aperture in millimetres" };
    return `<main class="book-shell p114-shell is-${state.track}">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive angular optics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p114-spread"><article class="book-page p114-problem-page"><div class="problem-number">Problem 11.4</div><h1 class="book-title p114-title">The Martian and the caveman</h1><div class="difficulty" aria-label="Selectable one-star or four-star difficulty">★ or ★★★★</div>${reconstructionNote()}${trackPicker()}${problemCopy()}<section class="p114-model-card"><div class="eyebrow">Current model</div><p>${state.track === "one" ? "Pure angular geometry plus an explicitly stipulated 1 arcminute comparison threshold." : "Scalar far-field diffraction at a perfect unobstructed circular aperture, using the Rayleigh convention."}</p></section></article><section class="book-page book-stage p114-stage">${stageControls()}<div class="p114-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p114-coach"><div class="coach-kicker">${answerMeta.kicker}</div><p class="coach-question">${answerMeta.question}</p><form class="p114-answer-form" data-p114-answer-form novalidate><label for="p114-answer">${answerMeta.label}</label><div><input id="p114-answer" type="text" inputmode="decimal" value="${escapeAttribute(current.answer)}" placeholder="${answerMeta.placeholder}" autocomplete="off"/><span>${answerMeta.unit}</span></div><button class="primary-button" type="submit">Check ${state.track === "one" ? "angle" : "aperture"}</button></form>${feedbackMarkup()}<div class="button-row p114-help-row"><button class="secondary-button" type="button" data-problem-action="p114-hint" ${current.hintsUsed >= HINTS[state.track].length ? "disabled" : ""}>${current.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p114-reveal" ${current.revealed ? "disabled" : ""}>${current.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p114-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p114-shell"); if (!root) return;
    const dynamic = root.querySelector(".p114-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const current = active(), values = opticsData();
    const outputs = { distance: `${format(current.distanceKm, 1)} km`, feature: `${format(current.featureM, 2)} m`, wavelength: state.track === "four" ? `${format(current.wavelengthNm, 0)} nm` : "", aperture: state.track === "four" ? `${format(current.apertureMm, 2)} mm · θ/θR=${format(values.ratio, 3)}` : "" };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p114-output="${key}"]`); if (output) output.textContent = value; });
    root.querySelector("#p114-distance")?.setAttribute("aria-valuetext", `Distance ${format(current.distanceKm, 1)} kilometres; angular size ${format(values.angularArcminutes, 5)} arcminutes`);
    root.querySelector("#p114-feature")?.setAttribute("aria-valuetext", `Physical ${state.track === "one" ? "height" : "separation"} ${format(current.featureM, 2)} metres; angular size ${format(values.angularSize * 1e6, 5)} microradians`);
    root.querySelector("#p114-wavelength")?.setAttribute("aria-valuetext", `Wavelength ${format(current.wavelengthNm, 0)} nanometres; Rayleigh angle ${format(values.rayleighAngle * 1e6, 5)} microradians`);
    root.querySelector("#p114-aperture")?.setAttribute("aria-valuetext", `Aperture ${format(current.apertureMm, 2)} millimetres; resolution ratio ${format(values.ratio, 3)}; ${values.visible ? "resolved" : "blended"}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p114-reset") { state = initialState(); renderAndFocus(renderApp, "[data-p114-track=\"one\"]"); return; }
      if (action === "p114-track") { state.track = control.dataset.p114Track; renderAndFocus(renderApp, `[data-p114-track="${state.track}"]`); return; }
      const current = active();
      if (action === "p114-stage") { current.stage = clamp(Number(control.dataset.p114Stage), 0, 2); renderAndFocus(renderApp, `[data-p114-stage="${current.stage}"]`); return; }
      if (action === "p114-next-stage") { current.stage = Math.min(2, current.stage + 1); renderAndFocus(renderApp, `[data-p114-stage="${current.stage}"]`); return; }
      if (action === "p114-preset") {
        const preset = control.dataset.p114Preset;
        if (state.track === "one") {
          if (preset === "challenge") { current.distanceKm = 10; current.featureM = 1.8; }
          if (preset === "threshold") current.distanceKm = opticsData().thresholdDistance / 1000;
          if (preset === "near") { current.distanceKm = 2; current.featureM = 1.8; }
        } else {
          if (preset === "challenge") { current.distanceKm = 100; current.featureM = 1; current.wavelengthNm = 550; current.apertureMm = 7; }
          if (preset === "rayleigh") current.apertureMm = opticsData().minimumAperture * 1000;
          if (preset === "telescope") current.apertureMm = 150;
          if (preset === "red") current.wavelengthNm = 650;
        }
        renderAndFocus(renderApp, "#p114-distance"); return;
      }
      if (action === "p114-hint") current.hintsUsed = Math.min(HINTS[state.track].length, current.hintsUsed + 1);
      if (action === "p114-reveal") { current.revealed = true; current.stage = 2; }
      renderApp(); if (action === "p114-reveal") window.requestAnimationFrame(() => document.querySelector("#p114-solution-heading")?.focus());
    }));
    const current = active();
    [["#p114-distance", "distanceKm", state.track === "one" ? 1 : 10, state.track === "one" ? 50 : 500], ["#p114-feature", "featureM", .1, 5], ["#p114-wavelength", "wavelengthNm", 380, 700], ["#p114-aperture", "apertureMm", 1, 200]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { current[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const input = document.querySelector("#p114-answer"); input?.addEventListener("input", (event) => { current.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p114-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); current.answer = sanitizeNumber(input?.value).trim(); const answer = Number(current.answer); current.feedbackTone = "warn"; current.committed = false;
      if (!current.answer || !Number.isFinite(answer)) current.feedback = `Enter one ${state.track === "one" ? "angle in arcminutes" : "aperture in millimetres"}.`;
      else if (state.track === "one") {
        if (Math.abs(answer - oneChallenge.angularSize) < .00001) current.feedback = "That is the angle in radians. Convert it to arcminutes.";
        else if (Math.abs(answer - oneChallenge.angularSize * 180 / Math.PI) < .0001) current.feedback = "That is the angle in degrees. Multiply degrees by 60 for arcminutes.";
        else if (Math.abs(answer - oneChallenge.angularArcminutes) > .002) current.feedback = "Use θ=2 arctan[H/(2L)] and convert radians to arcminutes.";
        else { current.feedbackTone = "success"; current.committed = true; current.stage = 2; current.feedback = `Correct: θ=${format(oneChallenge.angularArcminutes, 7)} arcmin, below the stipulated 1′ threshold.`; }
      } else {
        const target = fourChallenge.minimumAperture * 1000;
        if (Math.abs(answer - fourChallenge.minimumAperture) < .002) current.feedback = "That is the aperture in metres. Convert it to millimetres.";
        else if (Math.abs(answer - target) > .1) current.feedback = "Find the separation angle, set it equal to 1.22λ/D, then solve for D.";
        else { current.feedbackTone = "success"; current.committed = true; current.stage = 2; current.feedback = `Correct: the minimum ideal Rayleigh aperture is ${format(target, 6)} mm.`; }
      }
      renderAndFocus(renderApp, "#p114-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
