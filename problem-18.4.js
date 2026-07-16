(function registerSirenSplitPersonalityPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "18.4";
  const EMITTED_FREQUENCY_HZ = 700;
  const SOURCE_SPEED_MPS = 30;
  const SOUND_SPEED_MPS = 343;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Motion", title: "Each crest remembers where it was emitted", copy: "The sound expands through still air at 343 m/s, while the siren moves 30 m/s between emissions. Older circles therefore have centres farther behind the present source." }),
    Object.freeze({ short: "Spacing", title: "Motion compresses the front and stretches the rear", copy: "Ahead of the source, consecutive crests are separated by (v−vₛ)/f. Behind it they are separated by (v+vₛ)/f." }),
    Object.freeze({ short: "Sign", title: "A moving source changes the denominator", copy: "The observer is stationary, so crests still pass at speed v. Source motion changed their wavelength; that is why v∓vₛ appears below the fraction bar." }),
  ]);
  const hints = Object.freeze([
    "The observer is stationary. Start with f′=wave speed divided by the wavelength that reaches the observer.",
    "During one emitted period 1/f, a crest travels v/f but the source also advances vₛ/f.",
    "Ahead of the source the spacing is λfront=(v−vₛ)/f, so f′=v/λfront=fv/(v−vₛ).",
    "Behind the source the spacing is λrear=(v+vₛ)/f, so f′=fv/(v+vₛ).",
    "Use f=700 Hz, v=343 m/s and vₛ=30 m/s: the denominators are 313 and 373 m/s.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p184-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 2) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function parseFrequency(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".");
    return /^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
  }

  function dopplerData(frequency = EMITTED_FREQUENCY_HZ, waveSpeed = SOUND_SPEED_MPS, sourceSpeed = SOURCE_SPEED_MPS) {
    const emittedPeriodSeconds = 1 / frequency;
    const emittedWavelengthMetres = waveSpeed / frequency;
    const approachingWavelengthMetres = (waveSpeed - sourceSpeed) / frequency;
    const recedingWavelengthMetres = (waveSpeed + sourceSpeed) / frequency;
    const approachingFrequencyHertz = frequency * waveSpeed / (waveSpeed - sourceSpeed);
    const recedingFrequencyHertz = frequency * waveSpeed / (waveSpeed + sourceSpeed);
    return {
      emittedPeriodSeconds,
      emittedWavelengthMetres,
      approachingWavelengthMetres,
      recedingWavelengthMetres,
      approachingFrequencyHertz,
      recedingFrequencyHertz,
      approachingDenominator: waveSpeed - sourceSpeed,
      recedingDenominator: waveSpeed + sourceSpeed,
      approachingIdentityResidual: approachingFrequencyHertz - waveSpeed / approachingWavelengthMetres,
      recedingIdentityResidual: recedingFrequencyHertz - waveSpeed / recedingWavelengthMetres,
    };
  }

  const challenge = Object.freeze(dopplerData());

  function initialState() {
    return {
      scene: "approaching",
      frame: 50,
      stage: 0,
      boardMessage: "Before passing: the source moves toward the stationary observer, who samples the compressed wavefronts.",
      answers: { approaching: "", receding: "" },
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();

  function sourceX(scene = state.scene, frame = state.frame) {
    return scene === "approaching" ? 180 + .9 * frame : 455 + .9 * frame;
  }

  function sceneReading(scene = state.scene) {
    const approaching = scene === "approaching";
    return {
      approaching,
      temporalLabel: approaching ? "before passing" : "after passing",
      directionLabel: approaching ? "approaching" : "receding",
      sign: approaching ? "−" : "+",
      denominator: approaching ? challenge.approachingDenominator : challenge.recedingDenominator,
      wavelength: approaching ? challenge.approachingWavelengthMetres : challenge.recedingWavelengthMetres,
      frequency: approaching ? challenge.approachingFrequencyHertz : challenge.recedingFrequencyHertz,
    };
  }

  function setScene(scene) {
    state.scene = scene === "receding" ? "receding" : "approaching";
    const reading = sceneReading();
    state.boardMessage = `${reading.temporalLabel[0].toUpperCase() + reading.temporalLabel.slice(1)}: the siren is ${reading.directionLabel}, so the stationary observer hears ${format(reading.frequency, 2)} Hz.`;
  }

  function stageControlsMarkup() {
    return `<div class="p184-stage-controls" role="group" aria-label="Doppler reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p184-stage" data-p184-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p184-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p184-next-stage" ${state.stage >= stages.length - 1 ? "disabled" : ""}>${state.stage >= stages.length - 1 ? "Sign resolved" : "Next stage"}</button></div>`;
  }

  function wavefrontMarkup() {
    const currentX = sourceX();
    const soundPixelsPerStep = 48;
    const sourcePixelsPerStep = soundPixelsPerStep * SOURCE_SPEED_MPS / SOUND_SPEED_MPS;
    const ages = [.72, 1.44, 2.16, 2.88, 3.6];
    return ages.map((age, index) => {
      const centreX = currentX - sourcePixelsPerStep * age;
      const radius = soundPixelsPerStep * age;
      return `<circle class="p184-wavefront wave-${index + 1}" cx="${format(centreX, 3)}" cy="190" r="${format(radius, 3)}"/>`;
    }).join("");
  }

  function sirenSvg() {
    const reading = sceneReading();
    const currentX = sourceX();
    const observerX = 370;
    const activeSideX = reading.approaching ? currentX + 104 : currentX - 104;
    const stageSpacing = state.stage >= 1 || state.revealed;
    const stageFormula = state.stage >= 2 || state.revealed;
    const description = `A 700 hertz siren moves right at 30 metres per second through still air where sound speed is 343 metres per second. The observer is stationary at the centre. The selected ${reading.temporalLabel} scene is ${reading.directionLabel}. Wavefront spacing at the observer is ${format(reading.wavelength, 6)} metres and the observed frequency is ${format(reading.frequency, 6)} hertz. Ahead wavefronts are compressed and rear wavefronts are stretched.`;
    return `<svg class="p184-siren-scene p184-stage-${state.stage} is-${state.scene}" viewBox="0 0 760 390" role="img" aria-labelledby="p184-scene-title p184-scene-desc"><title id="p184-scene-title">Moving siren and Doppler wavefront spacing</title><desc id="p184-scene-desc">${description}</desc><defs><clipPath id="p184-wave-clip"><rect x="10" y="40" width="740" height="286" rx="16"/></clipPath><marker id="p184-motion-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z"/></marker></defs><rect class="p184-scene-bg" x="1" y="1" width="758" height="388" rx="20"/><text class="p184-scene-kicker" x="21" y="27">MOVING SOURCE · STATIONARY OBSERVER · STILL AIR</text><g class="p184-wavefronts" clip-path="url(#p184-wave-clip)">${wavefrontMarkup()}</g><line class="p184-road" x1="28" y1="242" x2="732" y2="242"/><g class="p184-observer" transform="translate(${observerX} 190)"><circle class="p184-observer-halo" r="34"/><circle class="p184-observer-head" cy="-11" r="10"/><path class="p184-observer-body" d="M0 1v34M-18 18h36M0 35l-15 24M0 35l15 24"/><text text-anchor="middle" y="91">STATIONARY OBSERVER</text></g><g class="p184-siren" transform="translate(${format(currentX, 3)} 218)"><rect class="p184-van" x="-39" y="-25" width="78" height="36" rx="9"/><path class="p184-cab" d="M15-25h17l18 21v15H15z"/><circle class="p184-wheel" cx="-22" cy="13" r="9"/><circle class="p184-wheel" cx="31" cy="13" r="9"/><path class="p184-siren-light" d="M-10-25q10-22 20 0z"/><text text-anchor="middle" y="-40">700 Hz</text></g><line class="p184-motion-line" x1="${format(currentX - 42, 3)}" y1="285" x2="${format(currentX + 64, 3)}" y2="285" marker-end="url(#p184-motion-arrow)"/><text class="p184-motion-label" x="${format(currentX + 10, 3)}" y="303" text-anchor="middle">vₛ = 30 m/s</text>${stageSpacing ? `<g class="p184-spacing"><line x1="${format(activeSideX - 17, 3)}" y1="116" x2="${format(activeSideX + 17, 3)}" y2="116"/><line x1="${format(activeSideX - 17, 3)}" y1="110" x2="${format(activeSideX - 17, 3)}" y2="122"/><line x1="${format(activeSideX + 17, 3)}" y1="110" x2="${format(activeSideX + 17, 3)}" y2="122"/><text x="${format(activeSideX, 3)}" y="103" text-anchor="middle">λ${reading.approaching ? "front" : "rear"} = ${format(reading.wavelength, 3)} m</text></g>` : ""}<g class="p184-reading" transform="translate(548 52)"><rect width="186" height="112" rx="13"/><text class="p184-reading-kicker" x="14" y="23">${reading.temporalLabel.toUpperCase()}</text><text class="p184-reading-direction" x="14" y="49">${reading.directionLabel.toUpperCase()}</text><text class="p184-reading-value" x="172" y="78" text-anchor="end">${format(reading.frequency, 2)} Hz</text><text class="p184-reading-sign" x="14" y="99">denominator v ${reading.sign} vₛ = ${reading.denominator}</text></g>${stageFormula ? `<g class="p184-formula-strip" transform="translate(25 334)"><rect width="710" height="37" rx="10"/><text x="18" y="24">f′ = fv / (v ${reading.sign} vₛ) = 700 × 343 / ${reading.denominator} = ${format(reading.frequency, 2)} Hz</text></g>` : ""}</svg>`;
  }

  function readingsMarkup() {
    return `<section class="p184-readings" aria-label="Before and after frequency readings" aria-live="polite"><article class="${state.scene === "approaching" ? "is-active" : ""}"><span>Before passing · approaching</span><strong>${format(challenge.approachingFrequencyHertz, 2)} Hz</strong><small>compressed λ=${format(challenge.approachingWavelengthMetres, 3)} m · denominator 343−30</small></article><article class="${state.scene === "receding" ? "is-active" : ""}"><span>After passing · receding</span><strong>${format(challenge.recedingFrequencyHertz, 2)} Hz</strong><small>stretched λ=${format(challenge.recedingWavelengthMetres, 3)} m · denominator 343+30</small></article></section>`;
  }

  function signLessonMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const reading = sceneReading();
    return `<section class="p184-sign-lesson" aria-labelledby="p184-sign-heading"><div><span class="eyebrow">Source versus observer</span><h3 id="p184-sign-heading">Ask what moved before choosing the sign</h3></div><div class="p184-sign-cases"><article class="is-current"><strong>Source moves; observer fixed</strong><p>The source changes crest spacing. Put source speed in the <b>denominator</b>.</p><div>f′ = f × v/(v ∓ vₛ)</div></article><article><strong>Observer moves; source fixed</strong><p>The wavelength stays v/f. Observer motion changes the crest-meeting rate, so speed enters the <b>numerator</b>.</p><div>f′ = f × (v ± vₒ)/v</div></article></div><p class="p184-current-sign">Here the source is ${reading.directionLabel}: choose <strong>${reading.sign}vₛ</strong> in the denominator, giving ${reading.denominator} m/s.</p></section>`;
  }

  function dynamicMarkup() {
    return `<div class="p184-dynamic"><div class="p184-scene-wrap">${sirenSvg()}${readingsMarkup()}</div>${signLessonMarkup()}<div class="p184-board-message" role="status">${state.boardMessage}</div></div>`;
  }

  function motionControlsMarkup() {
    return `<section class="p184-motion-controls" aria-label="Siren motion and reading controls"><div class="p184-scene-buttons" role="group" aria-label="Choose before or after the siren passes"><button class="secondary-button ${state.scene === "approaching" ? "active" : ""}" type="button" data-problem-action="p184-scene" data-p184-scene="approaching" aria-pressed="${state.scene === "approaching"}"><strong>Before passing</strong><span>approaching · ${format(challenge.approachingFrequencyHertz, 2)} Hz</span></button><button class="secondary-button ${state.scene === "receding" ? "active" : ""}" type="button" data-problem-action="p184-scene" data-p184-scene="receding" aria-pressed="${state.scene === "receding"}"><strong>After passing</strong><span>receding · ${format(challenge.recedingFrequencyHertz, 2)} Hz</span></button></div><label for="p184-frame"><span>Move the siren within this snapshot <output data-p184-frame-output>${state.frame}%</output></span><input id="p184-frame" data-p184-frame type="range" min="0" max="100" step="1" value="${state.frame}" aria-label="Siren motion frame within the selected scene"/></label></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="p184-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }

  function hintsMarkup() {
    return state.hintsUsed ? `<div class="hint-stack p184-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : "";
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p184-solution" aria-labelledby="p184-solution-heading" aria-live="polite"><h3 id="p184-solution-heading">The same siren creates two different wavelengths</h3><p>During one emitted period T=1/700 s, a crest travels vT while the source moves vₛT. In front, source motion subtracts from the spacing:</p><div class="p184-equation">λfront=(v−vₛ)/f=(343−30)/700=313/700 m<br>f′approach=v/λfront=700×343/313=<strong>767.09 Hz</strong></div><p>Behind, the source has moved away from the previous crest, so the spacing gains that same distance:</p><div class="p184-equation is-answer">λrear=(v+vₛ)/f=(343+30)/700=373/700 m<br>f′recede=v/λrear=700×343/373=<strong>643.70 Hz</strong></div><p><strong>Sign discipline:</strong> source motion changes wavelength, so v∓vₛ belongs in the denominator. Minus means the source moves toward the observer; plus means it moves away. A moving observer would instead alter the numerator.</p></section>`;
  }

  function snapshot() {
    const reading = sceneReading();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      model: "classical Doppler effect in still air; moving source and stationary point observer",
      emittedFrequencyHertz: EMITTED_FREQUENCY_HZ,
      sourceSpeedMetresPerSecond: SOURCE_SPEED_MPS,
      soundSpeedMetresPerSecond: SOUND_SPEED_MPS,
      emittedPeriodSeconds: challenge.emittedPeriodSeconds,
      emittedWavelengthMetres: challenge.emittedWavelengthMetres,
      approaching: { denominatorMetresPerSecond: challenge.approachingDenominator, wavelengthMetres: challenge.approachingWavelengthMetres, observedFrequencyHertz: challenge.approachingFrequencyHertz, identityResidual: challenge.approachingIdentityResidual },
      receding: { denominatorMetresPerSecond: challenge.recedingDenominator, wavelengthMetres: challenge.recedingWavelengthMetres, observedFrequencyHertz: challenge.recedingFrequencyHertz, identityResidual: challenge.recedingIdentityResidual },
      selectedScene: state.scene,
      selectedSign: reading.sign,
      sourceVisualPositionX: sourceX(),
      motionFramePercent: state.frame,
      stage: state.stage + 1,
      answers: state.answers,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p184-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · sound in motion</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p184-spread"><article class="book-page p184-problem-page"><div class="problem-number">Problem 18.4</div><h1 class="book-title p184-title">The Siren’s Split Personality</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p184-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">A siren emits 700 Hz while moving at 30 m/s through still air. Take the speed of sound as 343 m/s. A stationary observer hears it first approaching and then receding.</p><p class="problem-copy"><strong>What frequencies are heard before and after the siren passes?</strong></p><section class="p184-given-list" aria-label="Doppler problem values"><span>emitted f <strong>700 Hz</strong></span><span>source vₛ <strong>30 m/s</strong></span><span>sound v <strong>343 m/s</strong></span><span>observer vₒ <strong>0 m/s</strong></span></section><section class="p184-rule-card"><strong>The medium owns the wave speed</strong><p>The source changes the separation between crests. Once emitted, every crest travels through the air at 343 m/s.</p></section></article><section class="book-page book-stage p184-stage" aria-labelledby="p184-stage-title">${stageControlsMarkup()}<div class="p184-stage-heading"><div><span class="eyebrow">Doppler laboratory</span><h2 id="p184-stage-title">Watch spacing become pitch</h2></div><p>Switch sides of the passing event, move the source, and track which wavelength reaches the fixed observer.</p></div>${dynamicMarkup()}${motionControlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p184-coach"><div class="coach-kicker">Name both readings</div><p class="coach-question">Enter the approaching and receding frequencies to two decimal places.</p><form class="p184-answer-form" data-p184-answer-form novalidate><label for="p184-answer-approaching">Before · approaching</label><div><input id="p184-answer-approaching" data-p184-answer="approaching" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answers.approaching)}" placeholder="frequency"/><span>Hz</span></div><label for="p184-answer-receding">After · receding</label><div><input id="p184-answer-receding" data-p184-answer="receding" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answers.receding)}" placeholder="frequency"/><span>Hz</span></div><button class="primary-button" type="submit">Check both readings</button></form>${feedbackMarkup()}<div class="button-row p184-help-row"><button class="secondary-button" type="button" data-problem-action="p184-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p184-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p184-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const dynamic = root.querySelector(".p184-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const output = root.querySelector("[data-p184-frame-output]");
    if (output) output.textContent = `${state.frame}%`;
    const slider = root.querySelector("[data-p184-frame]");
    if (slider) {
      slider.value = String(state.frame);
      slider.setAttribute("aria-valuetext", `${state.frame} percent through the ${sceneReading().temporalLabel} motion snapshot`);
    }
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p184-shell");
    if (!root) return;

    root.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-p184-frame]");
      if (!slider) return;
      state.frame = clamp(Math.round(Number(slider.value)), 0, 100);
      state.boardMessage = `Motion frame ${state.frame}%: the source advances, while earlier wavefronts continue expanding from their emission points.`;
      updateLiveDom(root);
    });

    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p184-reset") { state = initialState(); renderAndFocus(renderApp, '[data-p184-scene="approaching"]'); return; }
      if (action === "p184-scene") { setScene(control.dataset.p184Scene); renderAndFocus(renderApp, `[data-p184-scene="${state.scene}"]`); return; }
      if (action === "p184-stage") { state.stage = clamp(Math.round(Number(control.dataset.p184Stage)), 0, stages.length - 1); renderAndFocus(renderApp, `[data-p184-stage="${state.stage}"]`); return; }
      if (action === "p184-next-stage") { state.stage = Math.min(stages.length - 1, state.stage + 1); renderAndFocus(renderApp, `[data-p184-stage="${state.stage}"]`); return; }
      if (action === "p184-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p184-reveal") { state.revealed = true; state.stage = stages.length - 1; }
      renderApp();
    });

    root.querySelectorAll("[data-p184-answer]").forEach((input) => input.addEventListener("input", (event) => {
      state.answers[event.target.dataset.p184Answer] = event.target.value.slice(0, 20);
      state.feedback = "";
      state.committed = false;
    }));

    root.querySelector("[data-p184-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const approachingRaw = event.currentTarget.querySelector('[data-p184-answer="approaching"]')?.value || "";
      const recedingRaw = event.currentTarget.querySelector('[data-p184-answer="receding"]')?.value || "";
      const approaching = parseFrequency(approachingRaw);
      const receding = parseFrequency(recedingRaw);
      state.answers = { approaching: approachingRaw.trim(), receding: recedingRaw.trim() };
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(approaching) || !Number.isFinite(receding)) state.feedback = "Enter both frequencies as non-negative numbers in hertz.";
      else if (Math.abs(approaching - challenge.recedingFrequencyHertz) <= .02 && Math.abs(receding - challenge.approachingFrequencyHertz) <= .02) state.feedback = "Those readings are reversed. Compressed fronts give the higher approaching pitch.";
      else {
        const approachingCorrect = Math.abs(approaching - challenge.approachingFrequencyHertz) <= .02;
        const recedingCorrect = Math.abs(receding - challenge.recedingFrequencyHertz) <= .02;
        if (approachingCorrect && recedingCorrect) {
          state.feedbackTone = "success";
          state.feedback = "Correct: 767.09 Hz before passing and 643.70 Hz after passing.";
          state.committed = true;
          state.stage = stages.length - 1;
        } else state.feedback = `${Number(approachingCorrect) + Number(recedingCorrect)} of 2 correct. For a moving source, use v−vₛ when approaching and v+vₛ when receding.`;
      }
      renderAndFocus(renderApp, "#p184-answer-approaching");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
