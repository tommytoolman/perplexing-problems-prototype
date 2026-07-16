(function registerMovingMirrorPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "20.5";
  const CHALLENGE_SENT_FREQUENCY_MHZ = 600;
  const CHALLENGE_BETA = 0.20;
  const ANSWER_TOLERANCE_MHZ = 0.5;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Outbound", title: "Transform the outbound photon into the mirror frame", copy: "For a mirror moving in the same direction as the outbound wave, f′=γ(1−β)f. This is the one-way frequency received by the mirror." }),
    Object.freeze({ short: "Reflect", title: "Reverse direction without changing mirror-frame frequency", copy: "A perfect stationary mirror in its own frame reverses the photon momentum. The reflected frequency remains f′ in that frame." }),
    Object.freeze({ short: "Return", title: "Transform the reflected photon back to Earth", copy: "The return photon points opposite to the mirror velocity, but the inverse transform supplies the same factor γ(1−β). The two-way ratio is its square." }),
  ]);
  const hints = Object.freeze([
    "Use γ=1/√(1−β²) and transform the outbound frequency to the receding mirror: f′=γ(1−β)f.",
    "Reflection from a perfect mirror does not change frequency in the mirror’s own frame; it only reverses direction.",
    "Transform the returning photon back to Earth. The second factor is again γ(1−β).",
    "[γ(1−β)]²=(1−β)/(1+β). At β=0.20 this ratio is 0.80/1.20=2/3.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p205-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function mirrorEchoData(sentFrequencyMegahertz, beta) {
    const sent = clamp(sentFrequencyMegahertz, 0, 1e9), speedFraction = clamp(beta, -0.999999, 0.999999), gamma = 1 / Math.sqrt(1 - speedFraction ** 2);
    const oneWayFactor = gamma * (1 - speedFraction), equivalentOneWayFactor = Math.sqrt((1 - speedFraction) / (1 + speedFraction));
    const mirrorIncidentFrequencyMegahertz = sent * oneWayFactor, mirrorReflectedFrequencyMegahertz = mirrorIncidentFrequencyMegahertz;
    const echoRatio = (1 - speedFraction) / (1 + speedFraction), echoFrequencyMegahertz = sent * echoRatio;
    return { sentFrequencyMegahertz: sent, beta: speedFraction, gamma, oneWayFactor, equivalentOneWayFactor, mirrorIncidentFrequencyMegahertz, mirrorReflectedFrequencyMegahertz, echoFrequencyMegahertz, echoRatio, shift: speedFraction > 0 ? "redshift from a receding mirror" : speedFraction < 0 ? "blueshift from an approaching mirror" : "no shift from a stationary mirror", mirrorMotion: speedFraction > 0 ? "receding" : speedFraction < 0 ? "approaching" : "stationary" };
  }

  const CHALLENGE_DATA = mirrorEchoData(CHALLENGE_SENT_FREQUENCY_MHZ, CHALLENGE_BETA);
  function parseFrequencyMegahertz(raw) { const normalized = String(raw).trim().toLowerCase().replaceAll(",", "."); const match = normalized.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/); if (!match) return NaN; const value = Number(match[0]); if (normalized.includes("ghz")) return 1000 * value; if (normalized.includes("khz")) return value / 1000; if (/(^|[^mkg])hz/.test(normalized)) return value / 1e6; return value; }
  function initialState() { return { sentFrequencyMegahertz: CHALLENGE_SENT_FREQUENCY_MHZ, beta: CHALLENGE_BETA, wavePhasePercent: 18, boardMessage: "A receding mirror receives a one-way 489.9 MHz signal in its frame, reflects it unchanged there, and Earth receives the twice-shifted 400 MHz echo.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function currentData() { return mirrorEchoData(state.sentFrequencyMegahertz, state.beta); }
  function setSentFrequency(value) { state.sentFrequencyMegahertz = clamp(value, 200, 1000); const data = currentData(); state.boardMessage = `Sent frequency ${format(state.sentFrequencyMegahertz, 0)} MHz: the two-way echo is ${format(data.echoFrequencyMegahertz, 2)} MHz at the current mirror speed.`; }
  function setBeta(value) { state.beta = clamp(value, -.5, .8); const data = currentData(); state.boardMessage = `Mirror ${data.mirrorMotion} at β=${format(state.beta, 2)}: one-way factor ${format(data.oneWayFactor, 4)}, two-way ratio ${format(data.echoRatio, 4)}, ${data.shift}.`; }
  function setWavePhase(value) { state.wavePhasePercent = clamp(Math.round(value), 0, 100); state.boardMessage = `Wavefront phase moved to ${state.wavePhasePercent}%. Spacing still encodes Earth-frame frequency: the echo spacing is ${format(1 / currentData().echoRatio, 3)} times the sent-wave spacing.`; }
  function restoreChallenge() { state.sentFrequencyMegahertz = CHALLENGE_SENT_FREQUENCY_MHZ; state.beta = CHALLENGE_BETA; state.wavePhasePercent = 18; state.boardMessage = "Challenge restored: 600 MHz, receding β=0.20, one-way factor √(2/3), two-way ratio 2/3, echo 400 MHz."; }

  function stageControls() {
    return `<div class="p205-stage-controls" role="group" aria-label="Moving-mirror transformation stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p205-stage" data-p205-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p205-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p205-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Earth echo exposed" : "Next stage"}</button></div>`;
  }

  function wavefrontMarkup(startX, endX, spacing, phasePercent, className) {
    const phase = spacing * phasePercent / 100, lines = [];
    for (let x = startX - spacing + phase; x <= endX + spacing; x += spacing) if (x >= startX && x <= endX) lines.push(`<line x1="${format(x, 3)}" y1="0" x2="${format(x, 3)}" y2="44"/>`);
    return `<g class="${className}">${lines.join("")}</g>`;
  }

  function echoSvg() {
    const data = currentData(), sentSpacing = clamp(31 * 600 / data.sentFrequencyMegahertz, 19, 75), echoSpacing = clamp(sentSpacing / data.echoRatio, 12, 110), motionStart = data.beta >= 0 ? 626 : 708, motionEnd = data.beta >= 0 ? 708 : 626;
    return `<svg class="p205-echo p205-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p205-svg-title p205-svg-desc"><title id="p205-svg-title">Two-frame relativistic Doppler shift from a moving mirror</title><desc id="p205-svg-desc">Earth sends ${format(data.sentFrequencyMegahertz, 3)} megahertz toward a mirror ${data.mirrorMotion} at beta ${format(data.beta, 4)}. The one-way Earth-to-mirror factor is ${format(data.oneWayFactor, 7)}, so the mirror receives ${format(data.mirrorIncidentFrequencyMegahertz, 5)} megahertz. Reflection reverses photon direction at unchanged mirror-frame frequency. Transforming back gives Earth echo frequency ${format(data.echoFrequencyMegahertz, 5)} megahertz and two-way ratio ${format(data.echoRatio, 7)}. ${data.shift}.</desc><defs><marker id="p205-outbound-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><marker id="p205-return-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker><marker id="p205-motion-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs><rect class="p205-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p205-board-kicker" x="22" y="27">EARTH FRAME WAVEFRONTS · SPACING SHOWS RELATIVE WAVELENGTH</text><g class="p205-earth"><path d="M51 87q35 18 0 36M51 75v60M42 135h32M58 135v17"/><circle cx="51" cy="96" r="6"/><text x="38" y="170">EARTH</text></g><g class="p205-mirror"><rect x="670" y="61" width="18" height="137" rx="5"/><path d="M676 69l7 8-7 8 7 8-7 8 7 8-7 8 7 8-7 8 7 8-7 8 7 8-7 8"/><text x="679" y="216" text-anchor="middle">PERFECT MIRROR</text><line x1="${motionStart}" y1="47" x2="${motionEnd}" y2="47" marker-end="url(#p205-motion-arrow)"/><text x="667" y="37" text-anchor="middle">${data.mirrorMotion.toUpperCase()} · β=${format(data.beta, 2)}</text></g><g class="p205-outbound-lane"><rect x="91" y="58" width="550" height="67" rx="12"/><g transform="translate(0 70)">${wavefrontMarkup(108, 625, sentSpacing, state.wavePhasePercent, "p205-outbound-fronts")}</g><line x1="108" y1="115" x2="625" y2="115" marker-end="url(#p205-outbound-arrow)"/><text x="108" y="52">OUTBOUND · EARTH f=${format(data.sentFrequencyMegahertz, 1)} MHz</text></g><g class="p205-return-lane"><rect x="91" y="143" width="550" height="67" rx="12"/><g transform="translate(0 155)">${wavefrontMarkup(108, 625, echoSpacing, 100 - state.wavePhasePercent, "p205-return-fronts")}</g><line x1="625" y1="200" x2="108" y2="200" marker-end="url(#p205-return-arrow)"/><text x="108" y="223">RETURN ECHO · EARTH f=${format(data.echoFrequencyMegahertz, 1)} MHz · ${data.shift.toUpperCase()}</text></g><g class="p205-transform-chain"><g class="p205-transform-card p205-card-one"><rect x="24" y="245" width="213" height="93" rx="13"/><text class="p205-card-kicker" x="40" y="266">1 · EARTH → MIRROR</text><text class="p205-card-formula" x="40" y="292">f′=γ(1−β)f = Df</text><text class="p205-card-value" x="220" y="319" text-anchor="end">${format(data.mirrorIncidentFrequencyMegahertz, 2)} MHz</text></g><path class="p205-chain-arrow" d="M242 291h22"/><g class="p205-transform-card p205-card-two"><rect x="270" y="245" width="220" height="93" rx="13"/><text class="p205-card-kicker" x="286" y="266">2 · REFLECT IN MIRROR FRAME</text><text class="p205-card-formula" x="286" y="292">+x → −x · frequency unchanged</text><text class="p205-card-value" x="473" y="319" text-anchor="end">f′=${format(data.mirrorReflectedFrequencyMegahertz, 2)} MHz</text></g><path class="p205-chain-arrow" d="M495 291h22"/><g class="p205-transform-card p205-card-three"><rect x="523" y="245" width="213" height="93" rx="13"/><text class="p205-card-kicker" x="539" y="266">3 · MIRROR → EARTH</text><text class="p205-card-formula" x="539" y="292">fₑ=Df′=D²f</text><text class="p205-card-value is-echo" x="719" y="319" text-anchor="end">${format(data.echoFrequencyMegahertz, 2)} MHz</text></g></g><g class="p205-comparison-strip"><rect x="24" y="357" width="712" height="51" rx="12"/><text class="p205-comparison-label" x="42" y="377">ONE-WAY RECEIVER AT MIRROR</text><text class="p205-comparison-value" x="42" y="397">Df = ${format(data.mirrorIncidentFrequencyMegahertz, 2)} MHz</text><line x1="273" y1="368" x2="273" y2="399"/><text class="p205-comparison-label" x="293" y="377">TWO-WAY REFLECTED ECHO AT EARTH</text><text class="p205-comparison-value is-echo" x="293" y="397">D²f = [(1−β)/(1+β)]f = ${format(data.echoFrequencyMegahertz, 2)} MHz</text><text class="p205-ratio" x="716" y="388" text-anchor="end">ratio ${format(data.echoRatio, 4)}</text></g></svg>`;
  }

  function echoControls() {
    const data = currentData();
    return `<section class="p205-controls" aria-label="Moving-mirror speed, sent-frequency and wavefront controls"><div class="p205-slider-grid"><label for="p205-beta"><span>Mirror velocity β <output data-p205-output="beta">${state.beta >= 0 ? "+" : ""}${format(state.beta, 2)}</output></span><input id="p205-beta" type="range" min="-0.50" max="0.80" step="0.01" value="${state.beta}" aria-valuetext="Mirror ${data.mirrorMotion} at beta ${format(state.beta, 2)}; two-way ratio ${format(data.echoRatio, 4)}; echo ${format(data.echoFrequencyMegahertz, 2)} megahertz"/></label><label for="p205-sent"><span>Earth sent frequency <output data-p205-output="sent">${format(state.sentFrequencyMegahertz, 0)} MHz</output></span><input id="p205-sent" type="range" min="200" max="1000" step="10" value="${state.sentFrequencyMegahertz}" aria-valuetext="Sent frequency ${format(state.sentFrequencyMegahertz, 0)} megahertz; echo ${format(data.echoFrequencyMegahertz, 2)} megahertz"/></label></div><label class="p205-phase-control" for="p205-phase"><span>Wavefront phase <output data-p205-output="phase">${state.wavePhasePercent}%</output></span><input id="p205-phase" type="range" min="0" max="100" step="1" value="${state.wavePhasePercent}" aria-valuetext="Wavefront phase ${state.wavePhasePercent} percent; outbound fronts travel right and echo fronts travel left"/></label><p data-p205-control-message role="status">${state.boardMessage}</p></section>`;
  }

  function metricsMarkup() {
    const data = currentData();
    return `<section class="p205-metrics" aria-live="polite"><div><span>One-way factor D</span><strong>${format(data.oneWayFactor, 5)}</strong></div><div><span>Mirror-frame frequency</span><strong>${format(data.mirrorIncidentFrequencyMegahertz, 2)} MHz</strong></div><div><span>Earth echo frequency</span><strong>${format(data.echoFrequencyMegahertz, 2)} MHz</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p205-dynamic"><div class="p205-echo-wrap">${echoSvg()}${echoControls()}</div>${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p205-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p205-solution" aria-labelledby="p205-solution-heading"><h3 id="p205-solution-heading" tabindex="-1">Apply one Doppler factor on each leg</h3><p>For β=0.20,</p><div class="p205-equation">γ=1/√(1−0.20²)=1.02062<br>D=γ(1−β)=1.02062(0.80)=0.816497=√(2/3).</div><p>Transform the 600 MHz outbound wave into the mirror frame:</p><div class="p205-equation">f′incident=Df=(0.816497)(600 MHz)=489.898 MHz.</div><p>The perfect mirror is stationary in that frame. Reflection reverses the photon’s direction but leaves its frequency unchanged:</p><div class="p205-equation">f′reflected=f′incident=489.898 MHz.</div><p>Transform the returning photon to Earth. The same factor appears again:</p><div class="p205-equation is-answer">fecho=Df′=D²f<br>=[(1−β)/(1+β)]f<br>=(0.80/1.20)(600 MHz)<br>=400 MHz.</div><p>489.898 MHz is the one-way frequency received by the moving mirror. It is not the Earth echo: reflection adds a second relativistic shift.</p></section>`;
  }

  function snapshot() {
    const data = currentData(), transformedOutbound = data.gamma * (data.sentFrequencyMegahertz - data.beta * data.sentFrequencyMegahertz), inverseReflected = data.gamma * (data.mirrorReflectedFrequencyMegahertz + data.beta * (-data.mirrorReflectedFrequencyMegahertz));
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "one-dimensional special-relativistic photon reflection from a perfect mirror; +x points Earth to mirror", sentFrequencyMegahertz: data.sentFrequencyMegahertz, mirrorVelocityBeta: data.beta, mirrorMotion: data.mirrorMotion, lorentzFactor: Number(data.gamma.toFixed(12)), outboundPhotonDirectionEarthFrame: "+x", oneWayEarthToMirrorFactor: Number(data.oneWayFactor.toFixed(12)), mirrorIncidentFrequencyMegahertz: Number(data.mirrorIncidentFrequencyMegahertz.toFixed(12)), mirrorReflectedPhotonDirection: "−x", mirrorReflectedFrequencyMegahertz: Number(data.mirrorReflectedFrequencyMegahertz.toFixed(12)), reflectedFrequencyChangeInMirrorFrameMegahertz: Number((data.mirrorReflectedFrequencyMegahertz - data.mirrorIncidentFrequencyMegahertz).toFixed(12)), returnPhotonDirectionEarthFrame: "−x", echoFrequencyMegahertz: Number(data.echoFrequencyMegahertz.toFixed(12)), twoWayEchoRatio: Number(data.echoRatio.toFixed(12)), shift: data.shift, wavefrontPhasePercent: state.wavePhasePercent, invariants: { dopplerFactorFormResidual: Number((data.oneWayFactor - data.equivalentOneWayFactor).toExponential(6)), outboundLorentzTransformResidualMegahertz: Number((data.mirrorIncidentFrequencyMegahertz - transformedOutbound).toExponential(6)), returnInverseTransformResidualMegahertz: Number((data.echoFrequencyMegahertz - inverseReflected).toExponential(6)), squaredFactorVsRatioResidual: Number((data.oneWayFactor ** 2 - data.echoRatio).toExponential(6)), echoIdentityResidualMegahertz: Number((data.echoFrequencyMegahertz - data.echoRatio * data.sentFrequencyMegahertz).toExponential(6)) }, limits: { betaZeroEchoRatio: mirrorEchoData(1, 0).echoRatio, betaNearPositiveOneEchoRatio: mirrorEchoData(1, .999999).echoRatio, betaNearNegativeOneEchoRatio: mirrorEchoData(1, -.999999).echoRatio }, challenge: { sentFrequencyMegahertz: CHALLENGE_SENT_FREQUENCY_MHZ, recedingBeta: CHALLENGE_BETA, gamma: Number(CHALLENGE_DATA.gamma.toFixed(12)), oneWayFactor: Number(CHALLENGE_DATA.oneWayFactor.toFixed(12)), oneWayMirrorFrequencyMegahertz: Number(CHALLENGE_DATA.mirrorIncidentFrequencyMegahertz.toFixed(12)), exactEchoRatio: Number(CHALLENGE_DATA.echoRatio.toFixed(12)), exactEchoFrequencyMegahertz: Number(CHALLENGE_DATA.echoFrequencyMegahertz.toFixed(12)), acceptedToleranceMegahertz: ANSWER_TOLERANCE_MHZ }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p205-shell"><div class="p205-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Relativistic Doppler echoes</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p205-spread"><article class="book-page p205-problem-page"><div class="problem-number">Problem 20.5</div><h1 class="book-title p205-title">The Red Echo</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="problem-copy">Earth transmits a 600 MHz signal directly toward a perfect mirror receding at 0.20c. Treat the reflection in the mirror’s instantaneous inertial frame.</p><p class="problem-copy"><strong>At what frequency does the reflected echo return to Earth?</strong></p><section class="p205-observation-card"><strong>Reflection makes it a two-leg problem</strong><p>The moving mirror first receives a Doppler-shifted signal. After reversing the wave in its own frame, a second transformation is needed to return to Earth.</p></section><section class="p205-model-card"><div class="eyebrow">Ideal mirror model</div><p>The motion is collinear, the mirror is perfect and recoil is ignored. Positive β means the mirror recedes along the outbound wave.</p></section></article><section class="book-page book-stage p205-stage">${stageControls()}<div class="p205-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p205-coach"><div class="coach-kicker">Find the Earth echo</div><p class="coach-question">Enter the fixed challenge frequency in megahertz.</p><form class="p205-answer-form" data-p205-answer-form novalidate><label for="p205-answer">Echo frequency</label><div><input id="p205-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 400" autocomplete="off"/><span>MHz</span></div><small>Acceptance tolerance: ±${format(ANSWER_TOLERANCE_MHZ, 1)} MHz.</small><button class="primary-button" type="submit">Check echo</button></form>${feedbackMarkup()}<div class="button-row p205-help-row"><button class="secondary-button" type="button" data-problem-action="p205-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p205-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p205-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom(root) {
    const echo = root.querySelector(".p205-echo"); if (echo) echo.outerHTML = echoSvg();
    const metrics = root.querySelector(".p205-metrics"); if (metrics) metrics.outerHTML = metricsMarkup();
    const data = currentData(), betaOutput = root.querySelector('[data-p205-output="beta"]'), sentOutput = root.querySelector('[data-p205-output="sent"]'), phaseOutput = root.querySelector('[data-p205-output="phase"]'), message = root.querySelector("[data-p205-control-message]");
    if (betaOutput) betaOutput.textContent = `${state.beta >= 0 ? "+" : ""}${format(state.beta, 2)}`; if (sentOutput) sentOutput.textContent = `${format(state.sentFrequencyMegahertz, 0)} MHz`; if (phaseOutput) phaseOutput.textContent = `${state.wavePhasePercent}%`; if (message) message.textContent = state.boardMessage;
    const betaSlider = root.querySelector("#p205-beta"); if (betaSlider) { betaSlider.value = String(state.beta); betaSlider.setAttribute("aria-valuetext", `Mirror ${data.mirrorMotion} at beta ${format(state.beta, 2)}; two-way ratio ${format(data.echoRatio, 4)}; echo ${format(data.echoFrequencyMegahertz, 2)} megahertz`); }
    const sentSlider = root.querySelector("#p205-sent"); if (sentSlider) { sentSlider.value = String(state.sentFrequencyMegahertz); sentSlider.setAttribute("aria-valuetext", `Sent frequency ${format(state.sentFrequencyMegahertz, 0)} megahertz; echo ${format(data.echoFrequencyMegahertz, 2)} megahertz`); }
    const phaseSlider = root.querySelector("#p205-phase"); if (phaseSlider) { phaseSlider.value = String(state.wavePhasePercent); phaseSlider.setAttribute("aria-valuetext", `Wavefront phase ${state.wavePhasePercent} percent; outbound fronts travel right and echo fronts travel left`); }
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p205-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p205-reset") { resetChallenge(); renderAndFocus(renderApp, "#p205-beta"); return; }
      if (action === "p205-stage") { state.stage = clamp(Number(control.dataset.p205Stage), 0, 2); renderAndFocus(renderApp, `[data-p205-stage="${state.stage}"]`); return; }
      if (action === "p205-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p205-stage="${state.stage}"]`); return; }
      if (action === "p205-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p205-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p205-reveal") window.requestAnimationFrame(() => document.querySelector("#p205-solution-heading")?.focus());
    });
    root?.querySelector("#p205-beta")?.addEventListener("input", (event) => { setBeta(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p205-sent")?.addEventListener("input", (event) => { setSentFrequency(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p205-phase")?.addEventListener("input", (event) => { setWavePhase(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p205-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p205-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p205-answer")?.value || "", answer = parseFrequencyMegahertz(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter an echo frequency in megahertz.";
      else if (Math.abs(answer - CHALLENGE_DATA.mirrorIncidentFrequencyMegahertz) <= 1) state.feedback = "About 489.9 MHz is the one-way frequency received by the mirror. Apply the return transformation for the Earth echo.";
      else if (Math.abs(answer - CHALLENGE_DATA.echoRatio) <= .01) state.feedback = "Two thirds is the frequency ratio. Multiply it by the sent 600 MHz.";
      else if (Math.abs(answer - CHALLENGE_DATA.echoFrequencyMegahertz) > ANSWER_TOLERANCE_MHZ) state.feedback = `Use fecho/f=(1−β)/(1+β). Answers within ±${format(ANSWER_TOLERANCE_MHZ, 1)} MHz are accepted.`;
      else { state.feedbackTone = "success"; state.feedback = "Correct: the two transformations give (2/3)(600 MHz)=400 MHz."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p205-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
