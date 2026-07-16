(function registerIsotopeGatePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "19.4";
  const ATOMIC_MASS_UNIT_KG = 1.66054e-27;
  const ELEMENTARY_CHARGE_C = 1.60218e-19;
  const CHALLENGE = Object.freeze({ massNumber1: 20, massNumber2: 22, magneticFieldTesla: 0.5, speedMetresPerSecond: 2e5 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Circle", title: "Magnetic force bends but does not speed up the ions", copy: "With velocity perpendicular to B, qvB is always sideways. It supplies the centripetal force mv²/r, producing a circular path at constant speed." }),
    Object.freeze({ short: "Mass", title: "The heavier isotope takes the wider path", copy: "Both ions have charge +e and the velocity selector gives the same v. At fixed B, r=mv/(qB), so radius is directly proportional to isotope mass." }),
    Object.freeze({ short: "Detector", title: "A semicircle lands one diameter from the entrance", copy: "The ion begins and ends on the detector line at opposite ends of its circle. Each impact offset is 2r, so isotope separation is 2r₂−2r₁=2(r₂−r₁)." }),
  ]);
  const hints = Object.freeze([
    "Set magnetic force equal to centripetal force: qvB=mv²/r.",
    "Cancel one factor of v and rearrange to r=mv/(qB).",
    "Use m=Au for each isotope, with q=e because the neon ions are singly ionised.",
    "The detector line contains both the entry point and the opposite end of each circular orbit. The impact offset is a diameter, 2r.",
    "Calculate 2(r₂₂−r₂₀), then convert metres to centimetres.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p194-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function svgNumber(value, digits = 3) { return Number(value.toFixed(digits)); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.,eE+\-\s]/g, "").replace(",", ".").slice(0, 24); }

  function ionData(massNumber, magneticFieldTesla, speedMetresPerSecond) {
    const massKilograms = massNumber * ATOMIC_MASS_UNIT_KG;
    const radiusMetres = massKilograms * speedMetresPerSecond / (ELEMENTARY_CHARGE_C * magneticFieldTesla);
    const impactOffsetMetres = 2 * radiusMetres;
    const semicircleTimeSeconds = Math.PI * radiusMetres / speedMetresPerSecond;
    return {
      massNumber,
      massKilograms,
      radiusMetres,
      radiusCentimetres: radiusMetres * 100,
      impactOffsetMetres,
      impactOffsetCentimetres: impactOffsetMetres * 100,
      semicircleTimeSeconds,
      forceBalanceResidualNewtons: ELEMENTARY_CHARGE_C * speedMetresPerSecond * magneticFieldTesla - massKilograms * speedMetresPerSecond ** 2 / radiusMetres,
      diameterIdentityResidualMetres: impactOffsetMetres - 2 * radiusMetres,
    };
  }

  function spectrometerData(
    massNumber1 = state.massNumber1,
    massNumber2 = state.massNumber2,
    magneticFieldTesla = state.magneticFieldTesla,
    speedMetresPerSecond = state.speedMetresPerSecond,
  ) {
    const ion1 = ionData(massNumber1, magneticFieldTesla, speedMetresPerSecond);
    const ion2 = ionData(massNumber2, magneticFieldTesla, speedMetresPerSecond);
    const signedSeparationMetres = ion2.impactOffsetMetres - ion1.impactOffsetMetres;
    return {
      ion1,
      ion2,
      signedSeparationMetres,
      separationMetres: Math.abs(signedSeparationMetres),
      separationCentimetres: Math.abs(signedSeparationMetres) * 100,
      radiusDifferenceMetres: Math.abs(ion2.radiusMetres - ion1.radiusMetres),
      heavierMassNumber: massNumber1 === massNumber2 ? null : Math.max(massNumber1, massNumber2),
      separationIdentityResidualMetres: Math.abs(signedSeparationMetres) - 2 * Math.abs(ion2.radiusMetres - ion1.radiusMetres),
    };
  }

  const challenge = Object.freeze(spectrometerData(CHALLENGE.massNumber1, CHALLENGE.massNumber2, CHALLENGE.magneticFieldTesla, CHALLENGE.speedMetresPerSecond));

  function initialState() {
    return { ...CHALLENGE, traceProgress: 0, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false };
  }

  let state = initialState();

  function currentData() { return spectrometerData(); }
  function originalExtensionNote() { return `<p class="p194-extension-note">${EXTENSION_DISCLOSURE}</p>`; }

  function stageControls() {
    return `<div class="p194-stage-controls" role="group" aria-label="Mass-spectrometer reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p194-stage" data-p194-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p194-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p194-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Gate resolved" : "Next stage"}</button></div>`;
  }

  function orbitGeometry(ion, progress = state.traceProgress) {
    const pixelsPerCentimetre = 12;
    const entryX = 98, entryY = 438;
    const radiusPixels = ion.radiusCentimetres * pixelsPerCentimetre;
    const centreY = entryY - radiusPixels;
    const impactY = entryY - 2 * radiusPixels;
    const angle = Math.PI * progress;
    const particleX = entryX + radiusPixels * Math.sin(angle);
    const particleY = centreY + radiusPixels * Math.cos(angle);
    return { pixelsPerCentimetre, entryX, entryY, radiusPixels, centreY, impactY, particleX, particleY, path: `M${entryX} ${entryY}A${svgNumber(radiusPixels)} ${svgNumber(radiusPixels)} 0 0 0 ${entryX} ${svgNumber(impactY)}` };
  }

  function ionPathMarkup(ion, key, label) {
    const geometry = orbitGeometry(ion);
    const progress = clamp(state.traceProgress, 0, 1);
    return `<g class="p194-ion p194-ion-${key}"><path class="p194-orbit-ghost" d="${geometry.path}"/><path class="p194-orbit-trace" d="${geometry.path}" pathLength="1" stroke-dasharray="${svgNumber(progress, 4)} 1"/><g class="p194-radius-guide"><circle cx="${geometry.entryX}" cy="${svgNumber(geometry.centreY)}" r="3"/><line x1="${geometry.entryX}" y1="${svgNumber(geometry.centreY)}" x2="${svgNumber(geometry.entryX + geometry.radiusPixels)}" y2="${svgNumber(geometry.centreY)}"/><text x="${svgNumber(geometry.entryX + geometry.radiusPixels / 2)}" y="${svgNumber(geometry.centreY - 7)}" text-anchor="middle">r${ion.massNumber}=${format(ion.radiusCentimetres, 2)} cm</text></g><circle class="p194-impact" cx="${geometry.entryX}" cy="${svgNumber(geometry.impactY)}" r="6"/><line class="p194-impact-tick" x1="79" y1="${svgNumber(geometry.impactY)}" x2="111" y2="${svgNumber(geometry.impactY)}"/><text class="p194-impact-label" x="73" y="${svgNumber(geometry.impactY + (key === "one" ? 4 : -5))}" text-anchor="end">${label}</text><g class="p194-particle" transform="translate(${svgNumber(geometry.particleX)} ${svgNumber(geometry.particleY)})"><circle r="10"/><text text-anchor="middle" y="3">${ion.massNumber}</text></g></g>`;
  }

  function spectrometerSvg() {
    const values = currentData();
    const geometry1 = orbitGeometry(values.ion1);
    const geometry2 = orbitGeometry(values.ion2);
    const upperImpactY = Math.min(geometry1.impactY, geometry2.impactY);
    const lowerImpactY = Math.max(geometry1.impactY, geometry2.impactY);
    const mainGapPixels = lowerImpactY - upperImpactY;
    const insetScale = values.separationCentimetres ? Math.min(8, 64 / values.separationCentimetres) : 0;
    const insetGapPixels = values.separationCentimetres * insetScale;
    const insetMiddleY = 338;
    const insetY1 = insetMiddleY + (values.ion1.impactOffsetMetres < values.ion2.impactOffsetMetres ? insetGapPixels / 2 : -insetGapPixels / 2);
    const insetY2 = insetMiddleY + (values.ion2.impactOffsetMetres < values.ion1.impactOffsetMetres ? insetGapPixels / 2 : -insetGapPixels / 2);
    const separationLabel = values.separationCentimetres ? `${format(values.separationCentimetres, 3)} cm` : "same impact";
    const progressLabel = state.traceProgress === 0 ? "entry" : state.traceProgress === .5 ? "widest point" : state.traceProgress === 1 ? "detector impact" : `${format(state.traceProgress * 100, 0)}% of each semicircle`;
    const description = `A velocity-selected beam of singly positive ions enters rightward at ${format(state.speedMetresPerSecond, 0)} metres per second through a magnetic field of ${format(state.magneticFieldTesla, 2)} tesla directed into the page. Neon-${state.massNumber1} has radius ${format(values.ion1.radiusCentimetres, 4)} centimetres and detector offset ${format(values.ion1.impactOffsetCentimetres, 4)} centimetres. Neon-${state.massNumber2} has radius ${format(values.ion2.radiusCentimetres, 4)} centimetres and detector offset ${format(values.ion2.impactOffsetCentimetres, 4)} centimetres. Detector separation is ${format(values.separationCentimetres, 4)} centimetres. The path tracer is at ${progressLabel}; it compares equal geometric fractions, not simultaneous times.`;
    return `<svg class="p194-spectrometer p194-stage-${state.stage}" viewBox="0 0 760 480" role="img" aria-labelledby="p194-spectrometer-title p194-spectrometer-desc"><title id="p194-spectrometer-title">Interactive semicircular isotope paths and detector impacts</title><desc id="p194-spectrometer-desc">${description}</desc><defs><linearGradient id="p194-chamber-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172e3c"/><stop offset="1" stop-color="#26334b"/></linearGradient><marker id="p194-beam-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p194-radius-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z"/></marker><clipPath id="p194-chamber-clip"><rect x="20" y="18" width="518" height="442" rx="16"/></clipPath></defs><rect class="p194-board" x="1" y="1" width="758" height="478" rx="19"/><rect class="p194-chamber" x="18" y="17" width="522" height="444" rx="17"/><text class="p194-board-kicker" x="31" y="39">VELOCITY SELECTED · q=+e · B INTO PAGE · v PERPENDICULAR TO B</text><g class="p194-field-crosses" clip-path="url(#p194-chamber-clip)" aria-hidden="true">${Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, column) => `<g transform="translate(${150 + column * 57} ${77 + row * 66})"><circle r="8"/><path d="M-4-4L4 4M4-4L-4 4"/></g>`).join("")).join("")}</g><line class="p194-detector-line" x1="98" y1="52" x2="98" y2="451"/><text class="p194-detector-title" x="83" y="65" text-anchor="end">DETECTOR</text><g class="p194-entry"><line x1="29" y1="438" x2="88" y2="438" marker-end="url(#p194-beam-arrow)"/><rect x="90" y="425" width="16" height="26" rx="3"/><text x="31" y="424">selected beam</text><text x="31" y="453">v=${format(state.speedMetresPerSecond / 1e5, 2)}×10⁵ m/s</text></g><g clip-path="url(#p194-chamber-clip)">${ionPathMarkup(values.ion2, "two", `Ne-${values.ion2.massNumber}⁺`)}${ionPathMarkup(values.ion1, "one", `Ne-${values.ion1.massNumber}⁺`)}</g><g class="p194-main-separation"><line x1="122" y1="${svgNumber(upperImpactY)}" x2="122" y2="${svgNumber(lowerImpactY)}"/><line x1="115" y1="${svgNumber(upperImpactY)}" x2="129" y2="${svgNumber(upperImpactY)}"/><line x1="115" y1="${svgNumber(lowerImpactY)}" x2="129" y2="${svgNumber(lowerImpactY)}"/><text x="134" y="${svgNumber((upperImpactY + lowerImpactY) / 2 + 4)}">${mainGapPixels < 8 ? "overlap" : separationLabel}</text></g><g class="p194-force-card" transform="translate(337 58)"><rect width="182" height="116" rx="12"/><text class="p194-card-kicker" x="13" y="22">WHY A CIRCLE?</text><text class="p194-card-line" x="13" y="51">qvB = mv²/r</text><text class="p194-card-line is-answer" x="13" y="80">r = mv/(qB)</text><text class="p194-card-note" x="13" y="103">force stays perpendicular to v</text></g><g class="p194-detector-inset" transform="translate(337 270)"><rect width="182" height="164" rx="12"/><text class="p194-card-kicker" x="13" y="22">AUTO-ZOOM DETECTOR DETAIL</text><line class="p194-inset-detector" x1="37" y1="43" x2="37" y2="124"/><line class="p194-inset-one" x1="27" y1="${svgNumber(insetY1 - 270)}" x2="86" y2="${svgNumber(insetY1 - 270)}"/><line class="p194-inset-two" x1="27" y1="${svgNumber(insetY2 - 270)}" x2="86" y2="${svgNumber(insetY2 - 270)}"/><text class="p194-inset-label is-one" x="94" y="${svgNumber(insetY1 - 266)}">Ne-${values.ion1.massNumber}⁺</text><text class="p194-inset-label is-two" x="94" y="${svgNumber(insetY2 - 266)}">Ne-${values.ion2.massNumber}⁺</text><line class="p194-inset-bracket" x1="75" y1="${svgNumber(Math.min(insetY1, insetY2) - 270)}" x2="75" y2="${svgNumber(Math.max(insetY1, insetY2) - 270)}"/><text class="p194-inset-answer" x="91" y="145" text-anchor="middle">Δ=${separationLabel}</text></g><g class="p194-ledger" transform="translate(555 24)"><rect width="181" height="427" rx="14"/><text class="p194-ledger-title" x="14" y="25">ISOTOPE GATE</text><text class="p194-ledger-kicker" x="14" y="58">SHARED SETTINGS</text><text class="p194-ledger-label" x="14" y="83">charge q</text><text class="p194-ledger-value" x="166" y="83" text-anchor="end">+e</text><text class="p194-ledger-label" x="14" y="107">field B</text><text class="p194-ledger-value" x="166" y="107" text-anchor="end">${format(state.magneticFieldTesla, 2)} T</text><text class="p194-ledger-label" x="14" y="131">selected speed v</text><text class="p194-ledger-value" x="166" y="131" text-anchor="end">${format(state.speedMetresPerSecond / 1e5, 2)}×10⁵ m/s</text><line class="p194-ledger-rule" x1="14" y1="151" x2="166" y2="151"/><text class="p194-ledger-kicker" x="14" y="181">RADII · r=mv/(qB)</text><text class="p194-ledger-label" x="14" y="206">Ne-${values.ion1.massNumber}⁺</text><text class="p194-ledger-value is-one" x="166" y="206" text-anchor="end">${format(values.ion1.radiusCentimetres, 3)} cm</text><text class="p194-ledger-label" x="14" y="232">Ne-${values.ion2.massNumber}⁺</text><text class="p194-ledger-value is-two" x="166" y="232" text-anchor="end">${format(values.ion2.radiusCentimetres, 3)} cm</text><line class="p194-ledger-rule" x1="14" y1="252" x2="166" y2="252"/><text class="p194-ledger-kicker" x="14" y="282">DETECTOR OFFSETS · 2r</text><text class="p194-ledger-label" x="14" y="307">Ne-${values.ion1.massNumber}⁺</text><text class="p194-ledger-value is-one" x="166" y="307" text-anchor="end">${state.stage >= 2 || state.revealed ? `${format(values.ion1.impactOffsetCentimetres, 3)} cm` : "stage 3"}</text><text class="p194-ledger-label" x="14" y="333">Ne-${values.ion2.massNumber}⁺</text><text class="p194-ledger-value is-two" x="166" y="333" text-anchor="end">${state.stage >= 2 || state.revealed ? `${format(values.ion2.impactOffsetCentimetres, 3)} cm` : "stage 3"}</text><text class="p194-ledger-label" x="14" y="365">impact separation</text><text class="p194-ledger-answer" x="166" y="389" text-anchor="end">${state.stage >= 2 || state.revealed ? separationLabel : "stage 3"}</text><text class="p194-ledger-note" x="14" y="414">Δ=2|r₂−r₁|</text></g></svg>`;
  }

  function traceControlsMarkup() {
    const values = currentData();
    const label = state.traceProgress === 0 ? "At entry" : state.traceProgress === .5 ? "At widest point" : state.traceProgress === 1 ? "At detector" : `${format(state.traceProgress * 100, 0)}% traced`;
    return `<section class="p194-trace-controls" aria-label="Geometric orbit trace control"><div><span>Path tracer</span><strong>${label}</strong><small>Equal path fraction, not equal elapsed time</small></div><label for="p194-trace"><span>Trace each semicircle<output>${format(state.traceProgress * 100, 0)}%</output></span><input id="p194-trace" type="range" min="0" max="1" step="0.01" value="${state.traceProgress}" aria-valuetext="${label}; neon-${state.massNumber1} radius ${format(values.ion1.radiusCentimetres, 2)} centimetres; neon-${state.massNumber2} radius ${format(values.ion2.radiusCentimetres, 2)} centimetres"/></label><div><button class="chip-button" type="button" data-problem-action="p194-trace-moment" data-p194-progress="0">Entry</button><button class="chip-button" type="button" data-problem-action="p194-trace-moment" data-p194-progress="0.5">Widest point</button><button class="chip-button" type="button" data-problem-action="p194-trace-moment" data-p194-progress="1">Detector</button></div></section>`;
  }

  function metricsMarkup() {
    const values = currentData();
    return `<section class="p194-metrics" aria-live="polite"><div><span>Ne-${values.ion1.massNumber} radius</span><strong>${format(values.ion1.radiusCentimetres, 3)} cm</strong><small>impact at 2r=${format(values.ion1.impactOffsetCentimetres, 3)} cm</small></div><div><span>Ne-${values.ion2.massNumber} radius</span><strong>${format(values.ion2.radiusCentimetres, 3)} cm</strong><small>impact at 2r=${format(values.ion2.impactOffsetCentimetres, 3)} cm</small></div><div><span>Detector separation</span><strong>${format(values.separationCentimetres, 3)} cm</strong><small>2|r₂−r₁|</small></div></section>`;
  }

  function factorTwoMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const values = currentData();
    return `<section class="p194-factor-card" aria-labelledby="p194-factor-heading"><div><span class="eyebrow">The factor-two checkpoint</span><h3 id="p194-factor-heading">A semicircle joins opposite ends of a diameter</h3><p>The entry slit and impact point lie on the same detector line, with the circle centre halfway between them. Therefore each detector offset is 2r—not r.</p></div><div class="p194-factor-equation">Δ=|2r₂−2r₁|<br>=2|r₂−r₁|<br>=<strong>${format(values.separationCentimetres, 4)} cm</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p194-dynamic"><div class="p194-spectrometer-wrap">${spectrometerSvg()}${traceControlsMarkup()}</div>${metricsMarkup()}${factorTwoMarkup()}</div>`; }

  function parameterControlsMarkup() {
    const values = currentData();
    const heavier = values.heavierMassNumber === null ? "Equal masses follow the same path." : `Ne-${values.heavierMassNumber} is heavier and follows the wider path.`;
    return `<section class="p194-controls" aria-label="Isotope mass, magnetic field and beam speed controls"><div class="p194-control-grid"><label for="p194-mass-one"><span>First isotope A₁<output data-p194-output="mass-one">Ne-${state.massNumber1}</output></span><input id="p194-mass-one" type="range" min="16" max="28" step="1" value="${state.massNumber1}"/></label><label for="p194-mass-two"><span>Second isotope A₂<output data-p194-output="mass-two">Ne-${state.massNumber2}</output></span><input id="p194-mass-two" type="range" min="16" max="28" step="1" value="${state.massNumber2}"/></label><label for="p194-field"><span>Magnetic field B<output data-p194-output="field">${format(state.magneticFieldTesla, 2)} T</output></span><input id="p194-field" type="range" min="0.4" max="0.8" step="0.05" value="${state.magneticFieldTesla}"/></label><label for="p194-speed"><span>Selected speed v<output data-p194-output="speed">${format(state.speedMetresPerSecond / 1e5, 2)}×10⁵ m/s</output></span><input id="p194-speed" type="range" min="160000" max="240000" step="10000" value="${state.speedMetresPerSecond}"/></label></div><p data-p194-control-note>${heavier} Radius grows with m and v, but shrinks as B increases: r∝mv/B.</p><button class="chip-button" type="button" data-problem-action="p194-challenge">Restore Ne-20 / Ne-22 challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p194-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p194-solution" aria-labelledby="p194-solution-heading"><h3 id="p194-solution-heading" tabindex="-1">The detector reads diameters, not radii</h3><p>Because v is perpendicular to B, magnetic force supplies the centripetal force:</p><div class="p194-solution-equation">qvB=mv²/r &nbsp;⇒&nbsp; r=mv/(qB).</div><p>For singly ionised neon, q=e and m=Au. Using v=2.00×10⁵ m/s and B=0.50 T:</p><div class="p194-solution-equation">r₂₀=(20)(1.66054×10⁻²⁷)(2.00×10⁵)/((1.60218×10⁻¹⁹)(0.50))<br>=0.0829140… m=<strong>8.29140… cm</strong><br><br>r₂₂=(22)(1.66054×10⁻²⁷)(2.00×10⁵)/((1.60218×10⁻¹⁹)(0.50))<br>=0.0912054… m=<strong>9.12054… cm</strong>.</div><p>Each ion completes a semicircle. Its entry and impact points are opposite ends of a diameter, so the two detector coordinates are 2r₂₀ and 2r₂₂. Hence</p><div class="p194-solution-equation is-answer">Δ=2(r₂₂−r₂₀)<br>=2(0.0912054…−0.0829140…) m<br>=0.0165828… m<br>=<strong>1.65828… cm ≈ 1.66 cm.</strong></div><p>Using only r₂₂−r₂₀ would give 0.829 cm and miss the factor of two created by the semicircular geometry.</p></section>`;
  }

  function snapshot() {
    const values = currentData();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "non-relativistic singly charged ions; uniform magnetic field perpendicular to selected beam velocity; edge effects ignored", constants: { atomicMassUnitKilograms: ATOMIC_MASS_UNIT_KG, elementaryChargeCoulombs: ELEMENTARY_CHARGE_C }, sharedBeam: { chargeCoulombs: ELEMENTARY_CHARGE_C, magneticFieldTesla: state.magneticFieldTesla, speedMetresPerSecond: state.speedMetresPerSecond }, isotope1: { massNumber: values.ion1.massNumber, massKilograms: values.ion1.massKilograms, radiusMetres: values.ion1.radiusMetres, radiusCentimetres: values.ion1.radiusCentimetres, detectorOffsetMetres: values.ion1.impactOffsetMetres, detectorOffsetCentimetres: values.ion1.impactOffsetCentimetres, semicircleTimeSeconds: values.ion1.semicircleTimeSeconds, forceBalanceResidualNewtons: Number(values.ion1.forceBalanceResidualNewtons.toExponential(6)), diameterIdentityResidualMetres: Number(values.ion1.diameterIdentityResidualMetres.toExponential(6)) }, isotope2: { massNumber: values.ion2.massNumber, massKilograms: values.ion2.massKilograms, radiusMetres: values.ion2.radiusMetres, radiusCentimetres: values.ion2.radiusCentimetres, detectorOffsetMetres: values.ion2.impactOffsetMetres, detectorOffsetCentimetres: values.ion2.impactOffsetCentimetres, semicircleTimeSeconds: values.ion2.semicircleTimeSeconds, forceBalanceResidualNewtons: Number(values.ion2.forceBalanceResidualNewtons.toExponential(6)), diameterIdentityResidualMetres: Number(values.ion2.diameterIdentityResidualMetres.toExponential(6)) }, detectorSeparationMetres: values.separationMetres, detectorSeparationCentimetres: values.separationCentimetres, radiusDifferenceMetres: values.radiusDifferenceMetres, separationIdentityResidualMetres: Number(values.separationIdentityResidualMetres.toExponential(6)), pathTraceFraction: state.traceProgress, pathTraceMeaning: "equal geometric fraction of each semicircle; not equal elapsed time", challenge: { massNumbers: [20, 22], magneticFieldTesla: .5, speedMetresPerSecond: 2e5, radius20Centimetres: challenge.ion1.radiusCentimetres, radius22Centimetres: challenge.ion2.radiusCentimetres, detectorSeparationCentimetres: challenge.separationCentimetres }, stage: state.stage + 1, answerCentimetres: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.massNumber1 = CHALLENGE.massNumber1; state.massNumber2 = CHALLENGE.massNumber2; state.magneticFieldTesla = CHALLENGE.magneticFieldTesla; state.speedMetresPerSecond = CHALLENGE.speedMetresPerSecond; state.traceProgress = 0; }
  function render() {
    return `<main class="book-shell p194-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · charged particles</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p194-spread"><article class="book-page p194-problem-page"><div class="problem-number">Problem 19.4</div><h1 class="book-title p194-title">The Isotope Gate</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${originalExtensionNote()}<p class="problem-copy">A velocity-selected beam of singly ionised neon-20 and neon-22 enters a uniform 0.50 T magnetic field at 2.00×10⁵ m/s, perpendicular to the field. Each ion follows a semicircle back to a detector line.</p><p class="problem-copy"><strong>How far apart are the two detector impacts?</strong></p><section class="p194-given-card"><strong>Use these constants</strong><p>Atomic mass unit u=1.66054×10⁻²⁷ kg; elementary charge e=1.60218×10⁻¹⁹ C.</p></section><section class="p194-model-card"><div class="eyebrow">Ideal spectrometer</div><p>Both isotopes are singly positive, non-relativistic and enter with the same selected speed. The field is uniform and perpendicular to v.</p></section></article><section class="book-page book-stage p194-stage">${stageControls()}<div class="p194-visual-card">${dynamicMarkup()}${stageCaption()}</div>${parameterControlsMarkup()}</section><aside class="book-page book-coach p194-coach"><div class="coach-kicker">Read the detector line</div><p class="coach-question">For the fixed neon-20/neon-22 beam, enter the impact separation in centimetres.</p><form class="p194-answer-form" data-p194-answer-form novalidate><label for="p194-answer">Detector separation</label><div><input id="p194-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="separation" autocomplete="off"/><span>cm</span></div><button class="primary-button" type="submit">Check separation</button></form>${feedbackMarkup()}<div class="button-row p194-help-row"><button class="secondary-button" type="button" data-problem-action="p194-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p194-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p194-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p194-shell"); if (!root) return;
    const dynamic = root.querySelector(".p194-dynamic");
    const active = document.activeElement;
    let restoreFocusSelector = "";
    if (dynamic?.contains(active)) {
      if (active.id === "p194-trace") restoreFocusSelector = "#p194-trace";
      else if (active.dataset?.problemAction === "p194-trace-moment") restoreFocusSelector = `[data-problem-action="p194-trace-moment"][data-p194-progress="${active.dataset.p194Progress}"]`;
    }
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = currentData();
    const outputs = { "mass-one": `Ne-${state.massNumber1}`, "mass-two": `Ne-${state.massNumber2}`, field: `${format(state.magneticFieldTesla, 2)} T`, speed: `${format(state.speedMetresPerSecond / 1e5, 2)}×10⁵ m/s` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p194-output="${key}"]`); if (output) output.textContent = value; });
    const heavier = values.heavierMassNumber === null ? "Equal masses follow the same path." : `Ne-${values.heavierMassNumber} is heavier and follows the wider path.`;
    const note = root.querySelector("[data-p194-control-note]"); if (note) note.textContent = `${heavier} Radius grows with m and v, but shrinks as B increases: r∝mv/B.`;
    root.querySelector("#p194-mass-one")?.setAttribute("aria-valuetext", `Neon-${state.massNumber1}; radius ${format(values.ion1.radiusCentimetres, 3)} centimetres`);
    root.querySelector("#p194-mass-two")?.setAttribute("aria-valuetext", `Neon-${state.massNumber2}; radius ${format(values.ion2.radiusCentimetres, 3)} centimetres`);
    root.querySelector("#p194-field")?.setAttribute("aria-valuetext", `${format(state.magneticFieldTesla, 2)} tesla; detector separation ${format(values.separationCentimetres, 3)} centimetres`);
    root.querySelector("#p194-speed")?.setAttribute("aria-valuetext", `${format(state.speedMetresPerSecond, 0)} metres per second; detector separation ${format(values.separationCentimetres, 3)} centimetres`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (restoreFocusSelector) { const replacement = root.querySelector(restoreFocusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p194-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p194-reset") { state = initialState(); renderAndFocus(renderApp, "#p194-trace"); return; }
      if (action === "p194-stage") { state.stage = clamp(Number(control.dataset.p194Stage), 0, 2); renderAndFocus(renderApp, `[data-p194-stage="${state.stage}"]`); return; }
      if (action === "p194-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p194-stage="${state.stage}"]`); return; }
      if (action === "p194-trace-moment") { state.traceProgress = clamp(Number(control.dataset.p194Progress), 0, 1); updateDynamicDom(); return; }
      if (action === "p194-challenge") restoreChallenge();
      if (action === "p194-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p194-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); state.traceProgress = 1; }
      renderApp(); if (action === "p194-reveal") window.requestAnimationFrame(() => document.querySelector("#p194-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p194-trace")) state.traceProgress = clamp(Number(event.target.value), 0, 1);
      else if (event.target.matches("#p194-mass-one")) state.massNumber1 = clamp(Math.round(Number(event.target.value)), 16, 28);
      else if (event.target.matches("#p194-mass-two")) state.massNumber2 = clamp(Math.round(Number(event.target.value)), 16, 28);
      else if (event.target.matches("#p194-field")) state.magneticFieldTesla = clamp(Number(event.target.value), .4, .8);
      else if (event.target.matches("#p194-speed")) state.speedMetresPerSecond = clamp(Number(event.target.value), 160000, 240000);
      else return;
      updateDynamicDom();
    });
    const input = document.querySelector("#p194-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p194-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one numerical separation in centimetres.";
      else if (Math.abs(answer - challenge.separationMetres) <= .002) state.feedback = "That is the separation in metres. Convert to centimetres by multiplying by 100.";
      else if (Math.abs(answer - challenge.radiusDifferenceMetres * 100) <= .02) state.feedback = "That is r₂₂−r₂₀. Each semicircle reaches the detector one diameter, 2r, from the entry point—include the factor of two.";
      else if (Math.abs(answer - challenge.ion1.impactOffsetCentimetres) <= .03 || Math.abs(answer - challenge.ion2.impactOffsetCentimetres) <= .03) state.feedback = "That is one isotope’s detector offset from the entry slit, not the gap between the two impacts.";
      else if (Math.abs(answer - challenge.separationCentimetres) > .025) state.feedback = "Find both radii with r=mv/(qB), then subtract their detector coordinates 2r₂₂−2r₂₀.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.traceProgress = 1; state.feedback = "Correct: 2(r₂₂−r₂₀)=1.658… cm, so the impacts are about 1.66 cm apart."; }
      renderAndFocus(renderApp, "#p194-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
