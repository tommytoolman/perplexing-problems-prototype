(function registerTwoNotesOneThrobPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "18.2";
  const CHALLENGE = Object.freeze({ frequency1Hertz: 440, frequency2Hertz: 446 });
  const DISPLAY_SECONDS = 0.5;
  const stages = Object.freeze([
    Object.freeze({ short: "Two notes", title: "Start with two nearby frequencies", copy: "The 440 Hz and 446 Hz waves oscillate hundreds of times each second. Their relative phase changes slowly because one gains only six cycles per second on the other." }),
    Object.freeze({ short: "Add waves", title: "Superposition creates a fast carrier", copy: "At every instant the two displacements add. The rapidly alternating trace has carrier frequency 443 Hz, the mean of the two notes; that is not the beat frequency." }),
    Object.freeze({ short: "Count throbs", title: "Loudness follows the envelope maxima", copy: "The absolute envelope reaches a maximum whenever the notes return to the same relative phase. Successive loudness maxima are 1/6 s apart, so there are six beats per second." }),
  ]);
  const hints = Object.freeze([
    "A beat is one loudness maximum, not one oscillation of either sound wave.",
    "The faster note gains phase on the slower note at the difference of their frequencies.",
    "After the 446 Hz note has gained one complete cycle, the waves are back in phase and the next loudness maximum occurs.",
    "Use fbeat=|f₂−f₁| with f₁=440 Hz and f₂=446 Hz.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p182-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, scrubSeconds: 0, stage: 0, playing: false, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false, previewsPlayed: 0, audioStatus: "Sound preview is optional; the diagram contains the full argument." });
  let state = initialState();
  let animationFrame = null;
  let playbackStartedAt = null;
  let activeAudio = null;
  let audioTimer = null;

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function svgNumber(value, digits = 3) { return Number(value.toFixed(digits)); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 24); }

  function beatData(
    frequency1Hertz = state.frequency1Hertz,
    frequency2Hertz = state.frequency2Hertz,
    timeSeconds = state.scrubSeconds,
  ) {
    const differenceHertz = Math.abs(frequency2Hertz - frequency1Hertz);
    const carrierHertz = (frequency1Hertz + frequency2Hertz) / 2;
    const beatPeriodSeconds = differenceHertz ? 1 / differenceHertz : null;
    const signedEnvelope = Math.cos(Math.PI * (frequency2Hertz - frequency1Hertz) * timeSeconds);
    const audibleEnvelope = Math.abs(signedEnvelope);
    const component1 = Math.sin(2 * Math.PI * frequency1Hertz * timeSeconds);
    const component2 = Math.sin(2 * Math.PI * frequency2Hertz * timeSeconds);
    const superposition = component1 + component2;
    const beatPhase = differenceHertz ? ((timeSeconds * differenceHertz) % 1 + 1) % 1 : 0;
    const distanceToMaximumCycles = differenceHertz ? Math.min(beatPhase, 1 - beatPhase) : 0;
    const relativePhaseCycles = ((timeSeconds * (frequency2Hertz - frequency1Hertz)) % 1 + 1) % 1;
    return { differenceHertz, carrierHertz, beatPeriodSeconds, signedEnvelope, audibleEnvelope, component1, component2, superposition, beatPhase, distanceToMaximumCycles, relativePhaseCycles, identityResidual: superposition - 2 * Math.sin(2 * Math.PI * carrierHertz * timeSeconds) * signedEnvelope };
  }

  const challengeValues = beatData(CHALLENGE.frequency1Hertz, CHALLENGE.frequency2Hertz, 0);

  function originalExtensionNote() {
    return '<p class="p182-extension-note">Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.</p>';
  }

  function stageControls() {
    return `<div class="p182-stage-controls" role="group" aria-label="Beat-frequency reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p182-stage" data-p182-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p182-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p182-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Throb resolved" : "Next stage"}</button></div>`;
  }

  function wavePath(fn, startSeconds, durationSeconds, x, centreY, width, amplitude, samples) {
    const points = [];
    for (let index = 0; index <= samples; index += 1) {
      const proportion = index / samples;
      const time = startSeconds + durationSeconds * proportion;
      points.push(`${index ? "L" : "M"}${svgNumber(x + width * proportion)} ${svgNumber(centreY - amplitude * fn(time))}`);
    }
    return points.join("");
  }

  function envelopeAreaPath(differenceHertz, x, centreY, width, amplitude, samples) {
    const points = [];
    for (let index = 0; index <= samples; index += 1) {
      const proportion = index / samples;
      const envelope = Math.abs(Math.cos(Math.PI * differenceHertz * DISPLAY_SECONDS * proportion));
      points.push(`${index ? "L" : "M"}${svgNumber(x + width * proportion)} ${svgNumber(centreY - amplitude * envelope)}`);
    }
    for (let index = samples; index >= 0; index -= 1) {
      const proportion = index / samples;
      const envelope = Math.abs(Math.cos(Math.PI * differenceHertz * DISPLAY_SECONDS * proportion));
      points.push(`L${svgNumber(x + width * proportion)} ${svgNumber(centreY + amplitude * envelope)}`);
    }
    return `${points.join("")}Z`;
  }

  function beatMaximumTimes(differenceHertz) {
    if (!differenceHertz) return [0];
    const times = [];
    for (let index = 0; index <= Math.ceil(DISPLAY_SECONDS * differenceHertz); index += 1) {
      const time = index / differenceHertz;
      if (time <= DISPLAY_SECONDS + 1e-9) times.push(time);
    }
    return times;
  }

  function waveSvg() {
    const values = beatData();
    const detailDuration = 0.025;
    const detailX = 30, detailWidth = 442;
    const sumX = 30, sumWidth = 442, sumCentreY = 305, sumAmplitude = 34;
    const sumPath = wavePath((time) => (Math.sin(2 * Math.PI * state.frequency1Hertz * time) + Math.sin(2 * Math.PI * state.frequency2Hertz * time)) / 2, 0, DISPLAY_SECONDS, sumX, sumCentreY, sumWidth, sumAmplitude, 1500);
    const upperEnvelope = wavePath((time) => Math.abs(Math.cos(Math.PI * (state.frequency2Hertz - state.frequency1Hertz) * time)), 0, DISPLAY_SECONDS, sumX, sumCentreY, sumWidth, sumAmplitude, 280);
    const lowerEnvelope = wavePath((time) => -Math.abs(Math.cos(Math.PI * (state.frequency2Hertz - state.frequency1Hertz) * time)), 0, DISPLAY_SECONDS, sumX, sumCentreY, sumWidth, sumAmplitude, 280);
    const envelopeArea = envelopeAreaPath(values.differenceHertz, sumX, sumCentreY, sumWidth, sumAmplitude, 280);
    const maxima = beatMaximumTimes(values.differenceHertz);
    const playheadX = sumX + sumWidth * state.scrubSeconds / DISPLAY_SECONDS;
    const pulseHeight = 64 * values.audibleEnvelope;
    const maximumMarkup = maxima.map((time, index) => {
      const x = sumX + sumWidth * time / DISPLAY_SECONDS;
      return `<g class="p182-beat-maximum"><line x1="${svgNumber(x)}" y1="260" x2="${svgNumber(x)}" y2="356"/><circle cx="${svgNumber(x)}" cy="252" r="4"/><text x="${svgNumber(x)}" y="374" text-anchor="middle">${index === 0 ? "max" : `${format(time, 3)} s`}</text></g>`;
    }).join("");
    const periodText = values.beatPeriodSeconds === null ? "no repeating beats" : `${format(values.beatPeriodSeconds, 4)} s`;
    const relationText = values.differenceHertz ? `${format(values.differenceHertz, 2)} gains/s` : "locked together";
    return `<svg class="p182-waves p182-stage-${state.stage}" viewBox="0 0 720 470" role="img" aria-labelledby="p182-wave-title p182-wave-desc"><title id="p182-wave-title">Two component sound waves and their beat envelope</title><desc id="p182-wave-desc">The component frequencies are ${format(state.frequency1Hertz, 2)} and ${format(state.frequency2Hertz, 2)} hertz. Their superposition has carrier frequency ${format(values.carrierHertz, 2)} hertz and loudness maxima at ${format(values.differenceHertz, 2)} hertz. The lower scope spans half a second and marks every beat maximum. The playhead is at ${format(state.scrubSeconds, 4)} seconds, where relative amplitude is ${format(values.audibleEnvelope * 100, 1)} percent.</desc><defs><linearGradient id="p182-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#142c38"/><stop offset="1" stop-color="#1c1c32"/></linearGradient><linearGradient id="p182-meter-gradient" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#42a6b8"/><stop offset="1" stop-color="#f2bf55"/></linearGradient></defs><rect class="p182-board" x="1" y="1" width="718" height="468" rx="18"/><g class="p182-grid" aria-hidden="true">${Array.from({ length: 12 }, (_, index) => `<line x1="${30 + index * 40.18}" y1="42" x2="${30 + index * 40.18}" y2="402"/>`).join("")}${[76,151,259,305,351,402].map((y) => `<line x1="30" y1="${y}" x2="472" y2="${y}"/>`).join("")}</g><text class="p182-board-kicker" x="30" y="27">OSCILLOSCOPE · CYCLES AND LOUDNESS LIVE ON DIFFERENT CLOCKS</text><g class="p182-components"><text class="p182-scope-label" x="30" y="56">NOTE 1 · ${format(state.frequency1Hertz, 1)} Hz</text><path class="p182-wave-one" d="${wavePath((time) => Math.sin(2 * Math.PI * state.frequency1Hertz * time), 0, detailDuration, detailX, 94, detailWidth, 24, 180)}"/><text class="p182-scope-label" x="30" y="132">NOTE 2 · ${format(state.frequency2Hertz, 1)} Hz</text><path class="p182-wave-two" d="${wavePath((time) => Math.sin(2 * Math.PI * state.frequency2Hertz * time), 0, detailDuration, detailX, 169, detailWidth, 24, 180)}"/><text class="p182-detail-note" x="472" y="214" text-anchor="end">25 ms detail · about ${format(values.carrierHertz * detailDuration, 1)} carrier cycles</text></g><g class="p182-sum-scope"><text class="p182-scope-label" x="30" y="239">SUM · FAST ${format(values.carrierHertz, 1)} Hz CARRIER INSIDE SLOW ENVELOPE</text><path class="p182-envelope-fill" d="${envelopeArea}"/><path class="p182-envelope" d="${upperEnvelope}"/><path class="p182-envelope" d="${lowerEnvelope}"/><path class="p182-sum-wave" d="${sumPath}"/>${maximumMarkup}<g class="p182-playhead" data-p182-playhead><line x1="${svgNumber(playheadX)}" y1="249" x2="${svgNumber(playheadX)}" y2="398"/><circle cx="${svgNumber(playheadX)}" cy="305" r="7"/></g><text class="p182-timeline-label" x="30" y="419">0 s</text><text class="p182-timeline-label" x="251" y="419" text-anchor="middle">0.25 s</text><text class="p182-timeline-label" x="472" y="419" text-anchor="end">0.50 s</text></g><g class="p182-ledger" transform="translate(500 28)"><rect width="193" height="414" rx="14"/><text class="p182-ledger-title" x="15" y="25">BEAT LAB</text><text class="p182-ledger-kicker" x="15" y="59">COMPONENT CLOCKS</text><text class="p182-ledger-label" x="15" y="84">note 1</text><text class="p182-ledger-value" x="178" y="84" text-anchor="end">${format(state.frequency1Hertz, 1)} Hz</text><text class="p182-ledger-label" x="15" y="108">note 2</text><text class="p182-ledger-value" x="178" y="108" text-anchor="end">${format(state.frequency2Hertz, 1)} Hz</text><text class="p182-ledger-label" x="15" y="132">carrier (mean)</text><text class="p182-ledger-value is-carrier" x="178" y="132" text-anchor="end">${state.stage >= 1 || state.revealed ? `${format(values.carrierHertz, 1)} Hz` : "stage 2"}</text><line class="p182-ledger-rule" x1="15" y1="151" x2="178" y2="151"/><text class="p182-ledger-kicker" x="15" y="181">RELATIVE-PHASE CLOCK</text><text class="p182-ledger-label" x="15" y="206">faster note gains</text><text class="p182-ledger-value" x="178" y="206" text-anchor="end">${state.stage >= 1 || state.revealed ? relationText : "stage 2"}</text><text class="p182-ledger-label" x="15" y="230">max-to-max time</text><text class="p182-ledger-value" x="178" y="230" text-anchor="end">${state.stage >= 2 || state.revealed ? periodText : "stage 3"}</text><text class="p182-ledger-label" x="15" y="254">beat frequency</text><text class="p182-ledger-value is-beat" x="178" y="254" text-anchor="end">${state.stage >= 2 || state.revealed ? `${format(values.differenceHertz, 2)} Hz` : "stage 3"}</text><rect class="p182-meter-frame" x="18" y="284" width="46" height="94" rx="8"/><rect class="p182-meter-fill" data-p182-meter x="23" y="${svgNumber(373 - pulseHeight)}" width="36" height="${svgNumber(pulseHeight)}" rx="4"/><text class="p182-meter-label" x="86" y="306">AUDIBLE</text><text class="p182-meter-label" x="86" y="323">AMPLITUDE</text><text class="p182-meter-value" data-p182-meter-value x="86" y="354">${format(values.audibleEnvelope * 100, 0)}%</text><text class="p182-meter-note" data-p182-relative-phase x="86" y="374">phase gap ${format(values.relativePhaseCycles, 3)} cycles</text><text class="p182-time-readout" data-p182-svg-time x="96" y="403" text-anchor="middle">t=${format(state.scrubSeconds, 4)} s</text></g></svg>`;
  }

  function transportMarkup() {
    const values = beatData();
    return `<section class="p182-transport" aria-label="Beat timeline controls"><div class="p182-scrub-readout"><span>Timeline position</span><strong data-p182-time-readout>${format(state.scrubSeconds, 4)} s</strong><small data-p182-throb-readout>${values.differenceHertz ? `${format(values.audibleEnvelope * 100, 0)}% envelope · ${format(values.distanceToMaximumCycles, 3)} beat-cycles from a maximum` : "steady envelope · no beats"}</small></div><label for="p182-scrub"><span>Scrub 0.50 s<output data-p182-output="scrub">${format(state.scrubSeconds, 3)} s</output></span><input id="p182-scrub" type="range" min="0" max="${DISPLAY_SECONDS}" step="0.0005" value="${state.scrubSeconds}" aria-valuetext="${format(state.scrubSeconds, 4)} seconds; envelope ${format(values.audibleEnvelope * 100, 0)} percent"/></label><div class="p182-transport-actions"><button class="primary-button" type="button" data-problem-action="p182-play" aria-pressed="${state.playing}">${state.playing ? "Pause" : state.scrubSeconds >= DISPLAY_SECONDS ? "Replay 0.5 s" : "Play 0.5 s"}</button><button class="secondary-button" type="button" data-problem-action="p182-listen">Hear 2 s</button></div><p class="p182-audio-status" data-p182-audio-status role="status">${state.audioStatus}</p></section>`;
  }

  function metricsMarkup() {
    const values = beatData();
    return `<section class="p182-metrics" aria-live="polite"><div><span>Carrier oscillations</span><strong>${format(values.carrierHertz, 2)} Hz</strong><small>fast trace</small></div><div><span>Beat maxima</span><strong>${format(values.differenceHertz, 2)} Hz</strong><small>loudness throbs</small></div><div><span>Max-to-max interval</span><strong>${values.beatPeriodSeconds === null ? "none" : `${format(values.beatPeriodSeconds, 4)} s`}</strong><small>${values.differenceHertz ? `1/${format(values.differenceHertz, 2)}` : "notes coincide"}</small></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p182-dynamic"><div class="p182-wave-wrap">${waveSvg()}${transportMarkup()}</div>${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    const values = beatData();
    return `<section class="p182-controls" aria-label="Frequency exploration controls"><div class="p182-control-grid"><label for="p182-f1"><span>Frequency f₁<output data-p182-output="f1">${format(state.frequency1Hertz, 0)} Hz</output></span><input id="p182-f1" type="range" min="430" max="450" step="1" value="${state.frequency1Hertz}" aria-valuetext="Note one ${format(state.frequency1Hertz, 0)} hertz"/></label><label for="p182-f2"><span>Frequency f₂<output data-p182-output="f2">${format(state.frequency2Hertz, 0)} Hz</output></span><input id="p182-f2" type="range" min="440" max="460" step="1" value="${state.frequency2Hertz}" aria-valuetext="Note two ${format(state.frequency2Hertz, 0)} hertz"/></label></div><p data-p182-control-note>Explore nearby notes: the carrier is their mean (${format(values.carrierHertz, 1)} Hz), while loudness maxima arrive at their absolute difference (${format(values.differenceHertz, 1)} Hz).</p><button class="chip-button" type="button" data-problem-action="p182-challenge">Restore fixed 440 Hz + 446 Hz challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p182-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p182-solution" aria-labelledby="p182-solution-heading"><h3 id="p182-solution-heading" tabindex="-1">One full relative-phase cycle makes one beat</h3><p>Using the sum-to-product identity, the combined displacement is</p><div class="p182-solution-equation">sin(2πf₁t)+sin(2πf₂t)<br>=2 sin(2π·(f₁+f₂)t/2) cos(π(f₂−f₁)t).</div><p>The sine factor oscillates at the mean frequency, (440+446)/2=443 Hz. Those rapid carrier cycles make the pitch; they are not six separate loudness events.</p><p>The magnitude of the cosine envelope controls loudness. Its successive maxima occur whenever the relative phase advances by one full cycle, so</p><div class="p182-solution-equation is-answer">f<sub>beat</sub>=|f₂−f₁|<br>=|446−440| Hz<br>=6 Hz.</div><p>Equivalently, maxima are 1/6 s apart. In the half-second scope they occur at 0, 1/6, 2/6 and 3/6 s: three max-to-max intervals, confirming six throbs per second.</p></section>`;
  }

  function snapshot() {
    const values = beatData();
    return JSON.stringify({ problem: PROBLEM, provenance: "original extension created for this project; not in Professor Povey's Perplexing Problems", model: "linear superposition of two equal-amplitude pure sine waves; loudness proxy is absolute envelope", frequency1Hertz: state.frequency1Hertz, frequency2Hertz: state.frequency2Hertz, frequencyDifferenceHertz: values.differenceHertz, exactBeatFrequencyHertz: values.differenceHertz, carrierFrequencyHertz: values.carrierHertz, beatPeriodSeconds: values.beatPeriodSeconds === null ? null : Number(values.beatPeriodSeconds.toFixed(12)), displayWindowSeconds: DISPLAY_SECONDS, beatMaximumTimesSeconds: beatMaximumTimes(values.differenceHertz).map((time) => Number(time.toFixed(12))), scrubSeconds: Number(state.scrubSeconds.toFixed(12)), component1Displacement: Number(values.component1.toFixed(12)), component2Displacement: Number(values.component2.toFixed(12)), superpositionDisplacement: Number(values.superposition.toFixed(12)), signedEnvelope: Number(values.signedEnvelope.toFixed(12)), audibleEnvelopeMagnitude: Number(values.audibleEnvelope.toFixed(12)), relativePhaseCycles: Number(values.relativePhaseCycles.toFixed(12)), sumToProductIdentityResidual: Number(values.identityResidual.toExponential(6)), playing: state.playing, previewsPlayed: state.previewsPlayed, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.frequency1Hertz = CHALLENGE.frequency1Hertz; state.frequency2Hertz = CHALLENGE.frequency2Hertz; state.scrubSeconds = 0; }
  function render() {
    return `<main class="book-shell p182-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · sound and waves</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p182-spread"><article class="book-page p182-problem-page"><div class="problem-number">Problem 18.2</div><h1 class="book-title p182-title">Two Notes, One Throb</h1><div class="difficulty" aria-label="One star difficulty">★</div>${originalExtensionNote()}<p class="problem-copy">Two pure notes, one at 440 Hz and the other at 446 Hz, are sounded together at equal amplitude. Their combined loudness rises and falls in a regular beat.</p><p class="problem-copy"><strong>How many loudness throbs occur each second?</strong></p><section class="p182-observation-card"><strong>Do not count the carrier cycles</strong><p>The trace wiggles about 443 times per second, but its loudness envelope swells far more slowly. Beat maxima—not waveform peaks—answer the question.</p></section><section class="p182-model-card"><div class="eyebrow">Ideal two-tone model</div><p>Both notes are steady pure sine waves of equal amplitude. The diagram uses envelope magnitude as a visible proxy for perceived loudness.</p></section></article><section class="book-page book-stage p182-stage">${stageControls()}<div class="p182-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p182-coach"><div class="coach-kicker">Follow relative phase</div><p class="coach-question">For the fixed 440 Hz and 446 Hz notes, enter the exact beat frequency.</p><form class="p182-answer-form" data-p182-answer-form novalidate><label for="p182-answer">Loudness throbs per second</label><div><input id="p182-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="frequency" autocomplete="off"/><span>Hz</span></div><button class="primary-button" type="submit">Check beat frequency</button></form>${feedbackMarkup()}<div class="button-row p182-help-row"><button class="secondary-button" type="button" data-problem-action="p182-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p182-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p182-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function stopPlayback() {
    state.playing = false;
    playbackStartedAt = null;
    if (animationFrame !== null && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  function updatePlayheadDom() {
    const root = document.querySelector(".p182-shell"); if (!root) { stopPlayback(); return; }
    const values = beatData();
    const x = 30 + 442 * state.scrubSeconds / DISPLAY_SECONDS;
    const playhead = root.querySelector("[data-p182-playhead]");
    playhead?.querySelector("line")?.setAttribute("x1", svgNumber(x)); playhead?.querySelector("line")?.setAttribute("x2", svgNumber(x));
    playhead?.querySelector("circle")?.setAttribute("cx", svgNumber(x));
    const pulseHeight = 64 * values.audibleEnvelope;
    const meter = root.querySelector("[data-p182-meter]"); meter?.setAttribute("y", svgNumber(373 - pulseHeight)); meter?.setAttribute("height", svgNumber(pulseHeight));
    const texts = { "[data-p182-time-readout]": `${format(state.scrubSeconds, 4)} s`, "[data-p182-throb-readout]": values.differenceHertz ? `${format(values.audibleEnvelope * 100, 0)}% envelope · ${format(values.distanceToMaximumCycles, 3)} beat-cycles from a maximum` : "steady envelope · no beats", "[data-p182-meter-value]": `${format(values.audibleEnvelope * 100, 0)}%`, "[data-p182-relative-phase]": `phase gap ${format(values.relativePhaseCycles, 3)} cycles`, "[data-p182-svg-time]": `t=${format(state.scrubSeconds, 4)} s`, '[data-p182-output="scrub"]': `${format(state.scrubSeconds, 3)} s` };
    Object.entries(texts).forEach(([selector, value]) => { const node = root.querySelector(selector); if (node) node.textContent = value; });
    const scrub = root.querySelector("#p182-scrub"); if (scrub) { scrub.value = state.scrubSeconds; scrub.setAttribute("aria-valuetext", `${format(state.scrubSeconds, 4)} seconds; envelope ${format(values.audibleEnvelope * 100, 0)} percent`); }
    const play = root.querySelector('[data-problem-action="p182-play"]'); if (play) { play.textContent = state.playing ? "Pause" : state.scrubSeconds >= DISPLAY_SECONDS ? "Replay 0.5 s" : "Play 0.5 s"; play.setAttribute("aria-pressed", state.playing); }
  }

  function startPlayback() {
    if (state.scrubSeconds >= DISPLAY_SECONDS) state.scrubSeconds = 0;
    state.playing = true;
    playbackStartedAt = null;
    const tick = (timestamp) => {
      if (!state.playing) return;
      if (playbackStartedAt === null) playbackStartedAt = timestamp - state.scrubSeconds * 1000;
      state.scrubSeconds = clamp((timestamp - playbackStartedAt) / 1000, 0, DISPLAY_SECONDS);
      if (state.scrubSeconds >= DISPLAY_SECONDS) stopPlayback();
      updatePlayheadDom();
      if (state.playing) animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);
    updatePlayheadDom();
  }

  function stopAudioPreview() {
    if (audioTimer !== null) window.clearTimeout(audioTimer);
    audioTimer = null;
    if (activeAudio) {
      activeAudio.oscillators.forEach((oscillator) => { try { oscillator.stop(); } catch (_error) { /* already stopped */ } });
      try { activeAudio.context.close(); } catch (_error) { /* context already closed */ }
    }
    activeAudio = null;
  }

  function setAudioStatus(message) {
    state.audioStatus = message;
    const status = document.querySelector("[data-p182-audio-status]"); if (status) status.textContent = message;
  }

  function playAudioPreview() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) { setAudioStatus("This browser does not expose Web Audio; use the visual envelope instead."); return; }
    stopAudioPreview();
    const context = new AudioContext();
    if (context.state === "suspended") context.resume().catch(() => { /* visual model remains available */ });
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
    gain.gain.setValueAtTime(0.035, now + 1.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
    gain.connect(context.destination);
    const oscillators = [state.frequency1Hertz, state.frequency2Hertz].map((frequency) => { const oscillator = context.createOscillator(); oscillator.type = "sine"; oscillator.frequency.setValueAtTime(frequency, now); oscillator.connect(gain); oscillator.start(now); oscillator.stop(now + 2.01); return oscillator; });
    activeAudio = { context, oscillators };
    state.previewsPlayed += 1;
    setAudioStatus(`Playing a quiet two-second preview at ${format(state.frequency1Hertz, 0)} Hz + ${format(state.frequency2Hertz, 0)} Hz.`);
    audioTimer = window.setTimeout(() => { if (activeAudio?.context === context) { try { context.close(); } catch (_error) { /* context already closed */ } activeAudio = null; } audioTimer = null; setAudioStatus("Preview finished. The spacing between loudness maxima is the beat period."); }, 2100);
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p182-shell"); if (!root) return;
    const dynamic = root.querySelector(".p182-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = beatData();
    const outputs = { f1: `${format(state.frequency1Hertz, 0)} Hz`, f2: `${format(state.frequency2Hertz, 0)} Hz` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p182-output="${key}"]`); if (output) output.textContent = value; });
    const note = root.querySelector("[data-p182-control-note]"); if (note) note.textContent = `Explore nearby notes: the carrier is their mean (${format(values.carrierHertz, 1)} Hz), while loudness maxima arrive at their absolute difference (${format(values.differenceHertz, 1)} Hz).`;
    root.querySelector("#p182-f1")?.setAttribute("aria-valuetext", `Note one ${format(state.frequency1Hertz, 0)} hertz; beat frequency ${format(values.differenceHertz, 0)} hertz`);
    root.querySelector("#p182-f2")?.setAttribute("aria-valuetext", `Note two ${format(state.frequency2Hertz, 0)} hertz; beat frequency ${format(values.differenceHertz, 0)} hertz`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p182-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p182-play") { if (state.playing) { stopPlayback(); updatePlayheadDom(); } else startPlayback(); return; }
      if (action === "p182-listen") { playAudioPreview(); return; }
      stopPlayback();
      if (action === "p182-reset") { stopAudioPreview(); state = initialState(); renderAndFocus(renderApp, "#p182-scrub"); return; }
      if (action === "p182-stage") { state.stage = clamp(Number(control.dataset.p182Stage), 0, 2); renderAndFocus(renderApp, `[data-p182-stage="${state.stage}"]`); return; }
      if (action === "p182-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p182-stage="${state.stage}"]`); return; }
      if (action === "p182-challenge") { stopAudioPreview(); restoreChallenge(); state.audioStatus = "Fixed 440 Hz + 446 Hz challenge restored. Press Hear 2 s to listen."; }
      if (action === "p182-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p182-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); state.scrubSeconds = 1 / challengeValues.differenceHertz; }
      renderApp(); if (action === "p182-reveal") window.requestAnimationFrame(() => document.querySelector("#p182-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p182-scrub")) { stopPlayback(); state.scrubSeconds = clamp(Number(event.target.value), 0, DISPLAY_SECONDS); updatePlayheadDom(); return; }
      if (!event.target.matches("#p182-f1, #p182-f2")) return;
      stopPlayback(); stopAudioPreview();
      if (event.target.matches("#p182-f1")) state.frequency1Hertz = clamp(Number(event.target.value), 430, 450);
      if (event.target.matches("#p182-f2")) state.frequency2Hertz = clamp(Number(event.target.value), 440, 460);
      state.scrubSeconds = 0; state.audioStatus = "Frequencies changed. Press Hear 2 s to listen to the new pair."; updateDynamicDom();
    });
    const input = document.querySelector("#p182-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p182-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); stopPlayback(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one numerical frequency in hertz.";
      else if (Math.abs(answer - challengeValues.carrierHertz) <= .05) state.feedback = "443 Hz is the fast carrier frequency. Count the much slower spacing between loudness-envelope maxima.";
      else if (Math.abs(answer - challengeValues.differenceHertz) > .05) state.feedback = "Track how many cycles per second the 446 Hz note gains on the 440 Hz note.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.scrubSeconds = 1 / challengeValues.differenceHertz; state.feedback = "Correct: |446−440|=6 Hz, so loudness reaches six beat maxima each second."; }
      renderAndFocus(renderApp, "#p182-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
