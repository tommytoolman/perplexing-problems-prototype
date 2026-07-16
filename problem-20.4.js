(function registerClosingSpeedTrapPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "20.4";
  const CHALLENGE_A_BETA = .80;
  const CHALLENGE_B_SPEED = .80;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "One frame", title: "Start with signed Earth-frame velocities", copy: "Earth assigns ship A velocity +0.80c and ship B velocity −0.80c. Both numbers belong to one coordinate system, so signs show which way each ship moves." }),
    Object.freeze({ short: "Separation", title: "Differentiate one Earth-frame separation", copy: "With S=xB−xA, dS/dtE=vB−vA. The separation therefore shrinks at −dS/dtE=vA−vB=1.60c. This rate belongs to two worldlines, not to one measured object velocity." }),
    Object.freeze({ short: "Transform", title: "Move into one ship’s inertial frame", copy: "To ask how fast B is measured by A, transform B’s velocity into A’s frame. Relativistic velocity addition keeps the resulting material-object speed below c." }),
  ]);
  const hints = Object.freeze([
    "Keep the Earth-frame velocities signed: βA=+0.80 and βB=−0.80.",
    "The Earth-coordinate separation is S=xB−xA, so dS/dtE=(βB−βA)c=−1.60c. Its positive closing rate is 1.60c.",
    "A closing rate is the derivative of the distance between two positions defined simultaneously in one frame. It is not the velocity of B measured by A.",
    "Transform B’s velocity into A’s frame: βB|A=(βB−βA)/(1−βAβB).",
    "Substitute the signs: βB|A=(−0.8−0.8)/(1−(0.8)(−0.8))=−1.6/1.64=−40/41. The requested speed is its magnitude, 40/41 c≈0.9756098c.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p204-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }
  function format(value, digits = 4) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  function velocityTransform(objectBeta, frameBeta) {
    return cleanZero((objectBeta - frameBeta) / (1 - objectBeta * frameBeta));
  }

  function motionData(aBeta = CHALLENGE_A_BETA, bSpeed = CHALLENGE_B_SPEED) {
    const bBeta = -bSpeed;
    const separationDerivative = bBeta - aBeta;
    const closingRate = -separationDerivative;
    const bInA = velocityTransform(bBeta, aBeta);
    const aInB = velocityTransform(aBeta, bBeta);
    const measuredRelativeSpeed = Math.abs(bInA);
    return {
      aBeta,
      bSpeed,
      bBeta,
      separationDerivative,
      closingRate,
      denominator: 1 - aBeta * bBeta,
      bInA,
      aInB,
      measuredRelativeSpeed,
      reciprocalSignResidual: cleanZero(aInB + bInA),
      subluminalMargin: cleanZero(1 - measuredRelativeSpeed),
      speedIdentityResidual: cleanZero(1 - measuredRelativeSpeed ** 2 - ((1 - aBeta ** 2) * (1 - bBeta ** 2)) / (1 - aBeta * bBeta) ** 2),
    };
  }

  const challenge = Object.freeze(motionData());

  function initialState() {
    return {
      aBeta: CHALLENGE_A_BETA,
      bSpeed: CHALLENGE_B_SPEED,
      shipObserver: "A",
      stage: 0,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();
  function currentData() { return motionData(state.aBeta, state.bSpeed); }

  function parseSpeed(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replace(/[cC]$/, "");
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
  }

  function stageControlsMarkup() {
    return `<div class="p204-stage-controls" role="group" aria-label="Relative-speed reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p204-stage" data-p204-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p204-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p204-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Frames separated" : "Next stage"}</button></div>`;
  }

  function arrowLine(x, y, signedBeta, className, markerId) {
    const length = Math.abs(signedBeta) * 105;
    const endX = x + Math.sign(signedBeta) * length;
    return Math.abs(signedBeta) < 1e-12
      ? `<circle class="${className} is-zero" cx="${x}" cy="${y}" r="5"/>`
      : `<line class="${className}" x1="${x}" y1="${y}" x2="${format(endX, 3)}" y2="${y}" marker-end="url(#${markerId})"/>`;
  }

  function framesSvg() {
    const data = currentData();
    const observerIsA = state.shipObserver === "A";
    const transformedBeta = observerIsA ? data.bInA : data.aInB;
    const observerName = observerIsA ? "SHIP A" : "SHIP B";
    const movingName = observerIsA ? "B" : "A";
    const restX = observerIsA ? 172 : 588;
    const movingX = observerIsA ? 588 : 172;
    const movingDirection = Math.sign(transformedBeta);
    const transformedArrowStart = movingX;
    const transformedLabelX = movingDirection < 0 ? movingX - 110 : movingX + 110;
    const showClosing = state.stage >= 1 || state.revealed;
    const showTransform = state.stage >= 2 || state.revealed;
    const description = `Earth frame: ship A moves right at ${format(data.aBeta, 3)} c and ship B moves left at ${format(data.bSpeed, 3)} c. Their Earth-coordinate closing rate is ${format(data.closingRate, 5)} c. In ship ${state.shipObserver}'s frame, ship ${movingName} has signed velocity ${format(transformedBeta, 7)} c and measured speed ${format(Math.abs(transformedBeta), 7)} c. Closing rate and measured relative speed are different quantities.`;
    return `<svg class="p204-frames p204-stage-${state.stage}" viewBox="0 0 760 410" role="img" aria-labelledby="p204-frames-title p204-frames-desc"><title id="p204-frames-title">Earth and ship-frame descriptions of two approaching ships</title><desc id="p204-frames-desc">${description}</desc><defs><marker id="p204-a-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p204-b-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p204-relative-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="p204-board" x="1" y="1" width="758" height="408" rx="20"/><text class="p204-board-kicker" x="22" y="28">SAME ENCOUNTER · DIFFERENT QUESTIONS ABOUT RATE AND VELOCITY</text><g class="p204-earth-panel"><rect x="20" y="44" width="720" height="154" rx="14"/><text class="p204-panel-title" x="37" y="68">EARTH FRAME · ONE COORDINATE SYSTEM</text><line class="p204-track" x1="48" y1="137" x2="712" y2="137"/><g class="p204-ship is-a" transform="translate(210 137)"><path d="M-35 0L-21-17H24L38 0L24 17H-21Z"/><text x="0" y="4" text-anchor="middle">A</text></g><g class="p204-ship is-b" transform="translate(550 137) scale(-1 1)"><path d="M-35 0L-21-17H24L38 0L24 17H-21Z"/><text transform="scale(-1 1)" x="0" y="4" text-anchor="middle">B</text></g>${arrowLine(210, 99, data.aBeta, "p204-earth-arrow is-a", "p204-a-arrow")}${arrowLine(550, 99, data.bBeta, "p204-earth-arrow is-b", "p204-b-arrow")}<text class="p204-velocity-label is-a" x="210" y="88" text-anchor="middle">βA=+${format(data.aBeta, 2)}</text><text class="p204-velocity-label is-b" x="550" y="88" text-anchor="middle">βB=−${format(data.bSpeed, 2)}</text><line class="p204-separation" x1="248" y1="171" x2="512" y2="171"/><path class="p204-separation-tick" d="M248 164V178M512 164V178"/><text class="p204-separation-label" x="380" y="188" text-anchor="middle">S=xB−xA · ${showClosing ? `−dS/dtE=${format(data.closingRate, 3)}c` : "differentiate at stage 2"}</text></g><g class="p204-ship-panel"><rect x="20" y="215" width="720" height="174" rx="14"/><text class="p204-panel-title" x="37" y="239">${observerName} FRAME · ONE SHIP AT REST</text><line class="p204-track" x1="48" y1="310" x2="712" y2="310"/><g class="p204-ship ${observerIsA ? "is-a" : "is-b"}" transform="translate(${restX} 310) ${observerIsA ? "" : "scale(-1 1)"}"><path d="M-35 0L-21-17H24L38 0L24 17H-21Z"/><text ${observerIsA ? "" : 'transform="scale(-1 1)"'} x="0" y="4" text-anchor="middle">${state.shipObserver}</text></g><text class="p204-rest-label" x="${restX}" y="347" text-anchor="middle">observer · β′=0</text><g class="p204-ship ${observerIsA ? "is-b" : "is-a"}" transform="translate(${movingX} 310) ${observerIsA ? "scale(-1 1)" : ""}"><path d="M-35 0L-21-17H24L38 0L24 17H-21Z"/><text ${observerIsA ? 'transform="scale(-1 1)"' : ""} x="0" y="4" text-anchor="middle">${movingName}</text></g>${showTransform ? arrowLine(transformedArrowStart, 272, transformedBeta, "p204-relative-arrow", "p204-relative-arrow") : ""}<text class="p204-relative-label" x="${format(transformedLabelX, 3)}" y="258" text-anchor="middle">${showTransform ? `β${movingName}|${state.shipObserver}=${transformedBeta < 0 ? "−" : "+"}${format(Math.abs(transformedBeta), 5)}` : "transform at stage 3"}</text><g class="p204-transform-ledger"><rect x="274" y="332" width="212" height="42" rx="8"/><text x="380" y="349" text-anchor="middle">${showTransform ? `(${format(observerIsA ? data.bBeta : data.aBeta, 2)}−${format(observerIsA ? data.aBeta : data.bBeta, 2)}) / (1−βobjectβframe)` : "Lorentz velocity transform"}</text><text class="p204-transform-result" x="380" y="366" text-anchor="middle">${showTransform ? `measured speed = ${format(data.measuredRelativeSpeed, 7)}c` : "revealed at stage 3"}</text></g></g></svg>`;
  }

  function distinctionMarkup() {
    const data = currentData();
    const showTransform = state.stage >= 2 || state.revealed;
    return `<section class="p204-distinction" aria-label="Closing rate and relative speed comparison" aria-live="polite"><article><span>Earth closing rate</span><strong>${format(data.closingRate, 4)}c</strong><small>−d(xB−xA)/dtE · may exceed c</small></article><div aria-hidden="true">≠</div><article><span>Ship-frame measured speed</span><strong>${showTransform ? `${format(data.measuredRelativeSpeed, 7)}c` : "stage 3"}</strong><small>${showTransform ? "|βB|A|=|βA|B| · always below c" : "transform into one ship’s frame"}</small></article></section>`;
  }

  function transformMarkup() {
    if (state.stage < 2 && !state.revealed) return "";
    const data = currentData();
    const observerIsA = state.shipObserver === "A";
    const objectName = observerIsA ? "B" : "A";
    const observerName = observerIsA ? "A" : "B";
    const objectBeta = observerIsA ? data.bBeta : data.aBeta;
    const observerBeta = observerIsA ? data.aBeta : data.bBeta;
    const transformedBeta = observerIsA ? data.bInA : data.aInB;
    return `<section class="p204-transform-card" aria-labelledby="p204-transform-heading"><div><span class="eyebrow">Velocity transformation</span><h3 id="p204-transform-heading">Subtract velocities, then correct the denominator</h3></div><div class="p204-live-equation">β${objectName}|${observerName}=(β${objectName}−β${observerName})/(1−β${objectName}β${observerName})<br>=(${format(objectBeta, 2)}−${format(observerBeta, 2)})/(1−(${format(objectBeta, 2)})(${format(observerBeta, 2)}))=<strong>${format(transformedBeta, 7)}</strong></div><p>The ${transformedBeta < 0 ? "minus" : "plus"} sign says ${objectName} moves ${transformedBeta < 0 ? "left" : "right"} in ${observerName}’s frame. The measured <em>speed</em> is the magnitude: ${format(data.measuredRelativeSpeed, 7)}c.</p></section>`;
  }

  function controlsMarkup() {
    const data = currentData();
    const limitNote = state.stage >= 2 || state.revealed ? `Current denominator ${format(data.denominator, 4)} keeps the transformed speed ${format(data.subluminalMargin, 7)}c below light speed.` : "Advance to stage 3 to audit the transformed speed against the light-speed limit.";
    return `<section class="p204-controls" aria-label="Ship velocity controls"><div class="p204-presets" role="group" aria-label="Velocity presets"><button class="secondary-button" type="button" data-problem-action="p204-preset" data-p204-preset="slow">Low speed</button><button class="secondary-button" type="button" data-problem-action="p204-preset" data-p204-preset="challenge">0.80c challenge</button><button class="secondary-button" type="button" data-problem-action="p204-preset" data-p204-preset="limit">Near light speed</button></div><div class="p204-slider-grid"><label for="p204-a-speed"><span>Ship A rightward speed <output data-p204-output="a">+${format(state.aBeta, 2)}c</output></span><input id="p204-a-speed" data-p204-slider="a" type="range" min="0" max=".99" step=".01" value="${state.aBeta}" aria-valuetext="ship A velocity plus ${format(state.aBeta, 2)} c in Earth frame"/></label><label for="p204-b-speed"><span>Ship B leftward speed <output data-p204-output="b">−${format(state.bSpeed, 2)}c</output></span><input id="p204-b-speed" data-p204-slider="b" type="range" min="0" max=".99" step=".01" value="${state.bSpeed}" aria-valuetext="ship B velocity minus ${format(state.bSpeed, 2)} c in Earth frame"/></label></div><div class="p204-observer-row"><span>Ship-frame observer</span><div role="group" aria-label="Choose stationary ship-frame observer"><button class="chip-button ${state.shipObserver === "A" ? "active" : ""}" type="button" data-problem-action="p204-observer" data-p204-observer="A" aria-pressed="${state.shipObserver === "A"}">A at rest</button><button class="chip-button ${state.shipObserver === "B" ? "active" : ""}" type="button" data-problem-action="p204-observer" data-p204-observer="B" aria-pressed="${state.shipObserver === "B"}">B at rest</button></div></div><p class="p204-limit-note">${limitNote}</p></section>`;
  }

  function dynamicMarkup() { return `<div class="p204-dynamic">${framesSvg()}${distinctionMarkup()}${transformMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p204-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p204-solution" aria-labelledby="p204-solution-heading"><h3 id="p204-solution-heading">The 1.60c rate and the ship-frame speed answer different questions</h3><p>Earth uses simultaneous Earth-coordinate positions to define S=xB−xA. Therefore</p><div class="p204-solution-equation">dS/dtE=vB−vA=(−0.80c)−(+0.80c)=−1.60c,<br>so the Earth closing rate is <strong>−dS/dtE=1.60c.</strong></div><p>No single ship moves at 1.60c in Earth’s frame. To measure B’s velocity in A’s inertial frame, use the Lorentz velocity transformation with the signed velocities:</p><div class="p204-solution-equation">βB|A=(βB−βA)/(1−βAβB)<br>=(−0.80−0.80)/(1−(0.80)(−0.80))<br>=−1.60/1.64=−40/41.</div><div class="p204-solution-equation is-answer">The sign gives B’s direction in A’s frame.<br><strong>Ship-frame speed = |βB|A|c=40c/41≈0.9756098c.</strong></div><p>Equivalently, B measures A at +40c/41. In the low-speed limit the denominator approaches 1 and the result approaches the Galilean difference. As either head-on speed approaches c, the measured relative speed approaches—but never exceeds—c.</p></section>`;
  }

  function snapshot() {
    const data = currentData();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, earthFrame: { shipABeta: data.aBeta, shipBBeta: data.bBeta, separationDefinition: "S=xB-xA at equal Earth coordinate time", separationDerivativeInC: data.separationDerivative, closingRateInC: data.closingRate }, selectedShipObserver: state.shipObserver, transformedVelocities: { shipBInShipAFrameBeta: data.bInA, shipAInShipBFrameBeta: data.aInB, measuredRelativeSpeedInC: data.measuredRelativeSpeed, denominator: data.denominator }, checks: { reciprocalSignResidual: data.reciprocalSignResidual, velocityIdentityResidual: data.speedIdentityResidual, subluminalMarginInC: data.subluminalMargin }, distinction: "closing rate is a same-frame derivative of separation; measured relative speed is one object's velocity in another inertial frame", stage: state.stage, hintsUsed: state.hintsUsed, answer: state.answer, committed: state.committed, revealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.aBeta = CHALLENGE_A_BETA; state.bSpeed = CHALLENGE_B_SPEED; state.shipObserver = "A"; }

  function render() {
    return `<main class="book-shell p204-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · relativity and spacetime</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p204-spread"><article class="book-page p204-problem-page"><div class="problem-number">Problem 20.4</div><h1 class="book-title p204-title">The Closing-Speed Trap</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p204-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">In Earth’s frame, ship A moves at +0.80c and ship B approaches head-on at −0.80c.</p><p class="problem-copy">Earth says their separation shrinks at 1.60c. <strong>What speed does an observer aboard either ship measure for the other ship?</strong></p><section class="p204-question-card"><strong>Do not mix the questions</strong><p>A closing rate differentiates the separation between two Earth-frame positions. A relative speed is one object’s velocity measured in a single chosen inertial frame.</p></section><section class="p204-given-grid" aria-label="Challenge velocities"><span>Earth βA <strong>+0.80</strong></span><span>Earth βB <strong>−0.80</strong></span><span>closing rate <strong>1.60c</strong></span><span>ship speed <strong>?</strong></span></section></article><section class="book-page book-stage p204-stage" aria-labelledby="p204-stage-heading">${stageControlsMarkup()}<div class="p204-stage-heading"><div><span class="eyebrow">Reference-frame laboratory</span><h2 id="p204-stage-heading">Keep every velocity attached to a frame</h2></div><p>Change both Earth-frame speeds and choose which ship carries the transformed coordinate system.</p></div>${dynamicMarkup()}${controlsMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p204-coach"><div class="coach-kicker">Transform the velocity</div><p class="coach-question">For the fixed ±0.80c encounter, enter the other ship’s measured speed as a fraction of c.</p><form class="p204-answer-form" data-p204-answer-form novalidate><label for="p204-answer">Ship-frame speed</label><div><input id="p204-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="fraction of c"/><span>c</span></div><button class="primary-button" type="submit">Check speed</button></form>${feedbackMarkup()}<div class="button-row p204-help-row"><button class="secondary-button" type="button" data-problem-action="p204-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p204-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p204-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const dynamic = root.querySelector(".p204-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const data = currentData();
    const outputA = root.querySelector('[data-p204-output="a"]'); if (outputA) outputA.textContent = `+${format(state.aBeta, 2)}c`;
    const outputB = root.querySelector('[data-p204-output="b"]'); if (outputB) outputB.textContent = `−${format(state.bSpeed, 2)}c`;
    root.querySelector("#p204-a-speed")?.setAttribute("aria-valuetext", `ship A velocity plus ${format(state.aBeta, 2)} c in Earth frame; ship-frame relative speed ${format(data.measuredRelativeSpeed, 5)} c`);
    root.querySelector("#p204-b-speed")?.setAttribute("aria-valuetext", `ship B velocity minus ${format(state.bSpeed, 2)} c in Earth frame; ship-frame relative speed ${format(data.measuredRelativeSpeed, 5)} c`);
    const limit = root.querySelector(".p204-limit-note"); if (limit) limit.textContent = state.stage >= 2 || state.revealed ? `Current denominator ${format(data.denominator, 4)} keeps the transformed speed ${format(data.subluminalMargin, 7)}c below light speed.` : "Advance to stage 3 to audit the transformed speed against the light-speed limit.";
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p204-shell");
    if (!root) return;
    root.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-p204-slider]");
      if (!slider) return;
      if (slider.dataset.p204Slider === "a") state.aBeta = clamp(slider.value, 0, .99);
      if (slider.dataset.p204Slider === "b") state.bSpeed = clamp(slider.value, 0, .99);
      state.feedback = ""; state.committed = false;
      updateLiveDom(root);
    });
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p204-reset") { state = initialState(); renderAndFocus(renderApp, "#p204-a-speed"); return; }
      if (action === "p204-preset") {
        const preset = control.dataset.p204Preset;
        const speed = preset === "slow" ? .10 : preset === "limit" ? .99 : .80;
        state.aBeta = speed; state.bSpeed = speed;
        renderAndFocus(renderApp, `[data-p204-preset="${preset}"]`);
        return;
      }
      if (action === "p204-observer") { state.shipObserver = control.dataset.p204Observer === "B" ? "B" : "A"; renderAndFocus(renderApp, `[data-p204-observer="${state.shipObserver}"]`); return; }
      if (action === "p204-stage") { state.stage = clamp(Math.round(control.dataset.p204Stage), 0, 2); renderAndFocus(renderApp, `[data-p204-stage="${state.stage}"]`); return; }
      if (action === "p204-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p204-stage="${state.stage}"]`); return; }
      if (action === "p204-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p204-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
    });
    root.querySelector("#p204-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; });
    root.querySelector("[data-p204-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = event.currentTarget.querySelector("#p204-answer")?.value.trim() || "";
      const answer = parseSpeed(state.answer);
      state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter one numerical speed as a fraction of c, for example 0.95c.";
      else if (Math.abs(answer + challenge.measuredRelativeSpeed) <= .0006) state.feedback = "That minus sign is B’s direction in A’s frame. The question asks for speed, so enter its positive magnitude.";
      else if (Math.abs(answer - challenge.closingRate) <= .01) state.feedback = "1.60c is the Earth-frame closing rate −dS/dtE, not either ship’s speed measured in the other ship’s frame.";
      else if (Math.abs(answer - 97.56098) <= .02) state.feedback = "That is the percentage of c. Divide by 100 and enter the speed as a fraction of c.";
      else if (answer >= 1) state.feedback = "A closing rate can exceed c, but a material ship measured in any inertial frame remains below c.";
      else if (Math.abs(answer - challenge.measuredRelativeSpeed) > .0006) state.feedback = "Use the signed Lorentz transform (βB−βA)/(1−βAβB), then take the magnitude.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: B moves at −40c/41 in A’s frame, so the measured speed is 40c/41≈0.9756098c."; state.committed = true; state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p204-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
