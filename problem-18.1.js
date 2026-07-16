(function registerTunnelClapPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "18.1";
  const CHALLENGE = Object.freeze({ echoDelaySeconds: 0.8, soundSpeedMetresPerSecond: 343 });
  const stages = Object.freeze([
    Object.freeze({ short: "Outbound", title: "Follow the clap to the wall", copy: "During the first half of the measured delay, the pressure pulse travels the one-way tunnel distance d." }),
    Object.freeze({ short: "Return", title: "The echo must travel back again", copy: "Reflection does not end the timing experiment. The returning pulse covers a second distance d before the listener hears the echo." }),
    Object.freeze({ short: "Distance", title: "Divide the round-trip path by two", copy: "Speed times the full echo delay gives 2d, not d. Therefore the wall distance is d=vt/2." }),
  ]);
  const hints = Object.freeze([
    "The stopwatch starts at the clap and stops when the reflected sound returns to the listener.",
    "If the wall is distance d away, the pulse travels d outward and d back: total path 2d.",
    "Use distance=speed×time for the complete trip: 2d=vt.",
    "Substitute v=343 m/s and t=0.80 s, then divide by two.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p181-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, progress: 0, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 24); }

  function echoData(
    echoDelaySeconds = state.echoDelaySeconds,
    soundSpeedMetresPerSecond = state.soundSpeedMetresPerSecond,
    progress = state.progress,
  ) {
    const reflectionTimeSeconds = echoDelaySeconds / 2;
    const roundTripDistanceMetres = soundSpeedMetresPerSecond * echoDelaySeconds;
    const oneWayDistanceMetres = roundTripDistanceMetres / 2;
    const elapsedSeconds = echoDelaySeconds * progress;
    const travelledDistanceMetres = soundSpeedMetresPerSecond * elapsedSeconds;
    const normalizedPosition = progress <= .5 ? progress * 2 : (1 - progress) * 2;
    const phase = progress === 0 ? "clap" : progress < .5 ? "outbound" : progress === .5 ? "reflection" : progress < 1 ? "returning" : "echo";
    return { reflectionTimeSeconds, roundTripDistanceMetres, oneWayDistanceMetres, elapsedSeconds, travelledDistanceMetres, normalizedPosition, phase, roundTripIdentityResidualMetres: roundTripDistanceMetres - 2 * oneWayDistanceMetres };
  }

  const challengeValues = echoData(CHALLENGE.echoDelaySeconds, CHALLENGE.soundSpeedMetresPerSecond, 1);

  function originalExtensionNote() {
    return `<p class="p181-extension-note"><strong>Original extension.</strong> This chapter and activity were created for this project and do not appear in Professor Povey’s <em>Perplexing Problems</em>.</p>`;
  }

  function stageControls() {
    return `<div class="p181-stage-controls" role="group" aria-label="Echo-distance reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p181-stage" data-p181-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p181-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p181-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Distance resolved" : "Next stage"}</button></div>`;
  }

  function tunnelSvg() {
    const values = echoData();
    const listenerX = 92, wallX = 444;
    const pulseX = listenerX + (wallX - listenerX) * values.normalizedPosition;
    const timelineX = 80, timelineWidth = 565;
    const timelinePulseX = timelineX + timelineWidth * state.progress;
    const pulseLabel = values.phase === "clap" ? "CLAP" : values.phase === "reflection" ? "REFLECT" : values.phase === "echo" ? "ECHO HEARD" : values.phase.toUpperCase();
    return `<svg class="p181-tunnel p181-stage-${state.stage}" viewBox="0 0 720 445" role="img" aria-labelledby="p181-tunnel-title p181-tunnel-desc"><title id="p181-tunnel-title">Sound pulse travelling out and back through a tunnel</title><desc id="p181-tunnel-desc">The listener is ${format(values.oneWayDistanceMetres, 4)} metres from the wall. Sound speed is ${format(state.soundSpeedMetresPerSecond, 3)} metres per second and full echo delay is ${format(state.echoDelaySeconds, 3)} seconds. At scrubbed time ${format(values.elapsedSeconds, 4)} seconds, the pulse is ${values.phase}. It has travelled ${format(values.travelledDistanceMetres, 4)} metres of a ${format(values.roundTripDistanceMetres, 4)} metre round trip. Reflection occurs at ${format(values.reflectionTimeSeconds, 4)} seconds.</desc><defs><linearGradient id="p181-tunnel-depth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#243b49"/><stop offset=".7" stop-color="#53636a"/><stop offset="1" stop-color="#1b2d36"/></linearGradient><radialGradient id="p181-pulse"><stop offset="0" stop-color="#fff9c5" stop-opacity="1"/><stop offset=".3" stop-color="#f0bd4e" stop-opacity=".75"/><stop offset="1" stop-color="#f0bd4e" stop-opacity="0"/></radialGradient><marker id="p181-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p181-board" x="1" y="1" width="718" height="443" rx="18"/><path class="p181-tunnel-roof" d="M18 76Q235 5 466 76V303Q235 371 18 303Z"/><path class="p181-tunnel-floor" d="M18 303Q235 371 466 303L466 348H18Z"/><line class="p181-wall" x1="${wallX}" y1="84" x2="${wallX}" y2="299"/><g class="p181-listener" aria-hidden="true"><circle cx="${listenerX}" cy="210" r="15"/><path d="M${listenerX} 225v52m0-31-25 19m25-19 22 20m-22 11-19 29m19-29 20 29"/></g><text class="p181-scene-label" x="${listenerX}" y="326" text-anchor="middle">listener</text><text class="p181-scene-label" x="${wallX}" y="326" text-anchor="middle">reflecting wall</text><g class="p181-path-layer"><line class="p181-out-path" x1="${listenerX + 22}" y1="170" x2="${wallX - 12}" y2="170" marker-end="url(#p181-arrow)"/><text class="p181-path-label" x="${(listenerX + wallX) / 2}" y="158" text-anchor="middle">outward path d</text><line class="p181-return-path" x1="${wallX - 12}" y1="250" x2="${listenerX + 22}" y2="250" marker-end="url(#p181-arrow)"/><text class="p181-path-label" x="${(listenerX + wallX) / 2}" y="274" text-anchor="middle">return path d</text></g><g class="p181-pulse" transform="translate(${format(pulseX, 3)} 210)"><circle r="36"/><circle class="p181-pulse-core" r="7"/><path d="M-15-21Q5 0-15 21M-27-31Q3 0-27 31"/><text x="0" y="-45" text-anchor="middle">${pulseLabel}</text></g><g class="p181-ledger" transform="translate(490 45)"><rect width="205" height="260" rx="14"/><text class="p181-ledger-title" x="16" y="25">ECHO PATH LEDGER</text><text class="p181-ledger-kicker" x="16" y="61">MEASURED</text><text class="p181-ledger-label" x="16" y="84">full delay t</text><text class="p181-ledger-value" x="189" y="84" text-anchor="end">${format(state.echoDelaySeconds, 3)} s</text><text class="p181-ledger-label" x="16" y="108">sound speed v</text><text class="p181-ledger-value" x="189" y="108" text-anchor="end">${format(state.soundSpeedMetresPerSecond, 1)} m/s</text><text class="p181-ledger-kicker" x="16" y="145">PATH</text><text class="p181-ledger-label" x="16" y="169">out + back</text><text class="p181-ledger-value" x="189" y="169" text-anchor="end">d+d=2d</text><text class="p181-ledger-label" x="16" y="193">total vt</text><text class="p181-ledger-value" x="189" y="193" text-anchor="end">${state.stage >= 1 || state.revealed ? `${format(values.roundTripDistanceMetres, 3)} m` : "stage 2"}</text><line class="p181-ledger-rule" x1="16" y1="210" x2="189" y2="210"/><text class="p181-ledger-answer" x="102" y="239" text-anchor="middle">d=${state.stage >= 2 || state.revealed ? `${format(values.oneWayDistanceMetres, 3)} m` : "vt/2"}</text></g><g class="p181-timeline"><text class="p181-timeline-title" x="${timelineX}" y="374">CLAP–ECHO TIMELINE</text><line x1="${timelineX}" y1="401" x2="${timelineX + timelineWidth}" y2="401"/><line class="p181-reflection-tick" x1="${timelineX + timelineWidth / 2}" y1="386" x2="${timelineX + timelineWidth / 2}" y2="416"/><circle class="p181-timeline-pulse" cx="${format(timelinePulseX, 3)}" cy="401" r="8"/><text x="${timelineX}" y="430" text-anchor="middle">0 s · clap</text><text x="${timelineX + timelineWidth / 2}" y="430" text-anchor="middle">${format(values.reflectionTimeSeconds, 3)} s · wall</text><text x="${timelineX + timelineWidth}" y="430" text-anchor="middle">${format(state.echoDelaySeconds, 3)} s · echo</text></g></svg>`;
  }

  function timingControlsMarkup() {
    const values = echoData();
    return `<section class="p181-timing-controls"><div class="p181-scrub-readout" aria-live="polite"><span>Elapsed time</span><strong>${format(values.elapsedSeconds, 4)} s</strong><small>${values.phase} · ${format(values.travelledDistanceMetres, 3)} m travelled</small></div><label for="p181-progress"><span>Scrub the pulse<output data-p181-output="progress">${format(state.progress * 100, 0)}%</output></span><input id="p181-progress" type="range" min="0" max="1" step="0.005" value="${state.progress}"/></label><div><button class="chip-button" type="button" data-problem-action="p181-moment" data-p181-progress="0">Clap</button><button class="chip-button" type="button" data-problem-action="p181-moment" data-p181-progress="0.5">At wall</button><button class="chip-button" type="button" data-problem-action="p181-moment" data-p181-progress="1">Echo returns</button></div></section>`;
  }

  function metricsMarkup() {
    const values = echoData();
    return `<section class="p181-metrics" aria-live="polite"><div><span>Reflection time t/2</span><strong>${format(values.reflectionTimeSeconds, 4)} s</strong></div><div><span>Round-trip path vt</span><strong>${state.stage >= 1 || state.revealed ? `${format(values.roundTripDistanceMetres, 4)} m` : "stage 2"}</strong></div><div><span>One-way distance vt/2</span><strong>${state.stage >= 2 || state.revealed ? `${format(values.oneWayDistanceMetres, 4)} m` : "stage 3"}</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p181-dynamic"><div class="p181-tunnel-wrap">${tunnelSvg()}${timingControlsMarkup()}</div>${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p181-controls" aria-label="Echo model controls"><div class="p181-control-grid"><label for="p181-delay"><span>Full echo delay t<output data-p181-output="delay">${format(state.echoDelaySeconds, 2)} s</output></span><input id="p181-delay" type="range" min="0.1" max="3" step="0.01" value="${state.echoDelaySeconds}"/></label><label for="p181-speed"><span>Sound speed v<output data-p181-output="speed">${format(state.soundSpeedMetresPerSecond, 0)} m/s</output></span><input id="p181-speed" type="range" min="300" max="370" step="1" value="${state.soundSpeedMetresPerSecond}"/></label></div><p>Delay is the complete clap-to-echo time. The model assumes one stationary listener, one perpendicular reflecting wall, constant sound speed and no processing delay.</p><button class="chip-button" type="button" data-problem-action="p181-challenge">Restore 0.80 s at 343 m/s</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p181-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p181-solution" aria-labelledby="p181-solution-heading"><h3 id="p181-solution-heading" tabindex="-1">The stopwatch measures two equal tunnel lengths</h3><p>If the wall is distance d away, the clap covers d before reflection and another d while returning. The measured 0.80 s therefore belongs to total path 2d:</p><div class="p181-solution-equation">vt=2d<br>d=vt/2.</div><p>Substituting the stated values with seconds and metres per second gives</p><div class="p181-solution-equation is-answer">d=(343 m/s)(0.80 s)/2<br>=274.4 m/2<br>=137.2 m.</div><p>The 274.4 m value is the total distance travelled by the sound pulse, not the listener-to-wall distance. Reflection occurs halfway through the delay, at 0.40 s.</p></section>`;
  }

  function snapshot() {
    const values = echoData();
    return JSON.stringify({ problem: PROBLEM, provenance: "original extension created for this project; not in Professor Povey's Perplexing Problems", model: "stationary source/listener and one reflecting wall; constant sound speed; echo delay is full round trip", fullEchoDelaySeconds: state.echoDelaySeconds, soundSpeedMetresPerSecond: state.soundSpeedMetresPerSecond, reflectionTimeSeconds: Number(values.reflectionTimeSeconds.toFixed(12)), roundTripDistanceMetres: Number(values.roundTripDistanceMetres.toFixed(12)), oneWayWallDistanceMetres: Number(values.oneWayDistanceMetres.toFixed(12)), scrubProgress: state.progress, elapsedSeconds: Number(values.elapsedSeconds.toFixed(12)), travelledDistanceMetres: Number(values.travelledDistanceMetres.toFixed(12)), pulsePhase: values.phase, roundTripIdentityResidualMetres: Number(values.roundTripIdentityResidualMetres.toExponential(6)), stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.echoDelaySeconds = CHALLENGE.echoDelaySeconds; state.soundSpeedMetresPerSecond = CHALLENGE.soundSpeedMetresPerSecond; state.progress = 0; }
  function render() {
    return `<main class="book-shell p181-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · sound and waves</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p181-spread"><article class="book-page p181-problem-page"><div class="problem-number">Problem 18.1</div><h1 class="book-title p181-title">The Tunnel Clap</h1><div class="difficulty" aria-label="One star difficulty">★</div>${originalExtensionNote()}<p class="problem-copy">A listener claps in a straight tunnel and hears one clear echo 0.80 s later. Take the speed of sound as 343 m/s.</p><p class="problem-copy"><strong>How far away is the reflecting wall?</strong></p><section class="p181-observation-card"><strong>The echo clock runs out and back</strong><p>Multiplying speed by the measured delay gives the entire sound path. The wall is only halfway along that path.</p></section><section class="p181-model-card"><div class="eyebrow">Ideal echo model</div><p>The listener is stationary, the wall is perpendicular to the tunnel and the stated sound speed is constant.</p></section></article><section class="book-page book-stage p181-stage">${stageControls()}<div class="p181-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p181-coach"><div class="coach-kicker">Halve the sound path</div><p class="coach-question">For the fixed 0.80 s delay and 343 m/s sound speed, enter the one-way wall distance.</p><form class="p181-answer-form" data-p181-answer-form novalidate><label for="p181-answer">Distance to reflecting wall</label><div><input id="p181-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="distance" autocomplete="off"/><span>m</span></div><button class="primary-button" type="submit">Check distance</button></form>${feedbackMarkup()}<div class="button-row p181-help-row"><button class="secondary-button" type="button" data-problem-action="p181-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p181-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p181-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p181-shell"); if (!root) return;
    const dynamic = root.querySelector(".p181-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { delay: `${format(state.echoDelaySeconds, 2)} s`, speed: `${format(state.soundSpeedMetresPerSecond, 0)} m/s` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p181-output="${key}"]`); if (output) output.textContent = value; });
    const values = echoData();
    root.querySelector("#p181-delay")?.setAttribute("aria-valuetext", `Full echo delay ${format(state.echoDelaySeconds, 2)} seconds; one-way wall distance ${format(values.oneWayDistanceMetres, 2)} metres`);
    root.querySelector("#p181-speed")?.setAttribute("aria-valuetext", `Sound speed ${format(state.soundSpeedMetresPerSecond, 0)} metres per second; round-trip path ${format(values.roundTripDistanceMetres, 2)} metres`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p181-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p181-reset") { state = initialState(); renderAndFocus(renderApp, "#p181-progress"); return; }
      if (action === "p181-stage") { state.stage = clamp(Number(control.dataset.p181Stage), 0, 2); renderAndFocus(renderApp, `[data-p181-stage="${state.stage}"]`); return; }
      if (action === "p181-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p181-stage="${state.stage}"]`); return; }
      if (action === "p181-moment") state.progress = clamp(Number(control.dataset.p181Progress), 0, 1);
      if (action === "p181-challenge") restoreChallenge();
      if (action === "p181-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p181-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); state.progress = 1; }
      renderApp(); if (action === "p181-reveal") window.requestAnimationFrame(() => document.querySelector("#p181-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p181-progress")) state.progress = clamp(Number(event.target.value), 0, 1);
      else if (event.target.matches("#p181-delay")) state.echoDelaySeconds = clamp(Number(event.target.value), .1, 3);
      else if (event.target.matches("#p181-speed")) state.soundSpeedMetresPerSecond = clamp(Number(event.target.value), 300, 370);
      else return;
      updateDynamicDom();
    });
    const input = document.querySelector("#p181-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p181-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter the one-way wall distance in metres.";
      else if (Math.abs(answer - challengeValues.roundTripDistanceMetres) < .05) state.feedback = "That is the full out-and-back sound path. Divide it by two.";
      else if (Math.abs(answer - challengeValues.oneWayDistanceMetres) > .05) state.feedback = "Use 2d=vt because the measured delay includes both the outward and return journeys.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.progress = 1; state.feedback = "Correct: d=(343×0.80)/2=137.2 m."; }
      renderAndFocus(renderApp, "#p181-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
