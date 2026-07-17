(function registerSquareWaveFourierPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "24.6";
  const CHALLENGE_TERMS = 3;
  const MAX_TERMS = 25;
  const CHALLENGE_X = Math.PI / 2;
  const GIBBS_LIMIT_VALUE = 1.1789797444721673;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Assemble", title: "Stack odd sine harmonics with shrinking coefficients", copy: "Only frequencies 1,3,5,… appear. Their sine coefficients are 4/[π(2k+1)], so the spectrum gets shorter while the waveform gains finer structure." }),
    Object.freeze({ short: "Converge", title: "Approach the square wave away from its jumps", copy: "At continuity points the partial sums approach ±1. At a jump they converge to the midpoint of the one-sided limits: (−1+1)/2=0." }),
    Object.freeze({ short: "Zoom", title: "Watch the Gibbs lobe narrow without vanishing", copy: "The first overshoot moves toward the jump like π/(2N), but its height approaches about 1.17898. More terms squeeze the ripple; they do not remove its limiting relative overshoot." }),
  ]);
  const hints = Object.freeze([
    "For three odd harmonics, use frequencies 1, 3 and 5.",
    "At x=π/2, sin(π/2)=1, sin(3π/2)=−1 and sin(5π/2)=1.",
    "So the bracketed sum is 1−1/3+1/5.",
    "Combine the fractions: 1−1/3+1/5=13/15.",
    "Multiply by 4/π to obtain 52/(15π)≈1.103474272.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p246-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function clean(value, digits = 8) { const rounded = Number(Number(value).toFixed(digits)); return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }
  function normalizeTerms(value) { return clamp(Math.round(Number(value)), 1, MAX_TERMS); }
  function coefficient(index) { const harmonic = 2 * index + 1; return { index, harmonic, coefficient: 4 / (Math.PI * harmonic) }; }
  function partialSum(x, termsInput) {
    const terms = normalizeTerms(termsInput);
    let total = 0;
    for (let index = 0; index < terms; index += 1) {
      const harmonic = 2 * index + 1;
      total += Math.sin(harmonic * x) / harmonic;
    }
    return 4 / Math.PI * total;
  }
  function squareWave(x) {
    const sine = Math.sin(x);
    if (Math.abs(sine) < 1e-12) return 0;
    return sine > 0 ? 1 : -1;
  }
  function piHalfBracketSum(termsInput) {
    const terms = normalizeTerms(termsInput);
    let sum = 0;
    for (let index = 0; index < terms; index += 1) sum += (index % 2 ? -1 : 1) / (2 * index + 1);
    return sum;
  }
  function overshootData(termsInput) {
    const terms = normalizeTerms(termsInput), peakLocation = Math.PI / (2 * terms), peakValue = partialSum(peakLocation, terms);
    return { terms, peakLocation, peakValue, excessAboveOne: peakValue - 1, nextPeakLocation: Math.PI / (2 * Math.min(MAX_TERMS, terms + 1)), narrowsWhenAnotherTermAdded: terms === MAX_TERMS ? null : Math.PI / (2 * (terms + 1)) < peakLocation, persistsAboveOne: peakValue > 1 };
  }
  function piHalfSeriesText(termsInput) {
    const terms = normalizeTerms(termsInput);
    if (terms <= 5) return Array.from({ length: terms }, (_, index) => {
      if (!index) return "1";
      return `${index % 2 ? "−" : "+"}1/${2 * index + 1}`;
    }).join("");
    return `1−1/3+1/5−…${(terms - 1) % 2 ? "−" : "+"}1/${2 * terms - 1}`;
  }

  const CHALLENGE = Object.freeze({
    terms: CHALLENGE_TERMS,
    x: CHALLENGE_X,
    bracketSum: piHalfBracketSum(CHALLENGE_TERMS),
    exact: "52/(15π)",
    value: partialSum(CHALLENGE_X, CHALLENGE_TERMS),
  });
  function initialState() {
    return {
      terms: CHALLENGE_TERMS,
      zoomHalfWidth: .8,
      stage: 0,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Three terms loaded: harmonics 1, 3 and 5. The coefficient spectrum and S₃ waveform use exactly the same active harmonics.",
    };
  }
  let state = initialState();

  function restoreChallenge(message = "Challenge restored: N=3 at x=π/2, with contributions +1, −1/3 and +1/5 inside the 4/π factor.") {
    state.terms = CHALLENGE_TERMS;
    state.zoomHalfWidth = .8;
    state.boardMessage = message;
  }
  function stageControlsMarkup() {
    return `<div class="p246-stage-controls" role="group" aria-label="Fourier square-wave stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p246-stage" data-p246-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p246-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p246-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Gibbs behavior exposed" : "Next stage"}</button></div>`;
  }
  function sampledPath(fn, minimum, maximum, samples, mapX, mapY) {
    return Array.from({ length: samples }, (_, index) => {
      const x = minimum + index / (samples - 1) * (maximum - minimum);
      return `${index ? "L" : "M"}${clean(mapX(x), 3)} ${clean(mapY(fn(x)), 3)}`;
    }).join("");
  }

  function spectrumMarkup() {
    const terms = normalizeTerms(state.terms), left = 540, width = 175, baseline = 186, maximumHeight = 82, slot = width / terms, barWidth = clamp(slot * .58, 2, 9);
    return Array.from({ length: terms }, (_, index) => {
      const data = coefficient(index), height = maximumHeight / data.harmonic, x = left + index * slot + (slot - barWidth) / 2;
      return `<g class="p246-spectrum-bar"><rect x="${clean(x, 3)}" y="${clean(baseline - height, 3)}" width="${clean(barWidth, 3)}" height="${clean(height, 3)}"/><title>Odd harmonic ${data.harmonic}; sine coefficient ${data.coefficient}</title></g>`;
    }).join("");
  }

  function fourierSvg() {
    const terms = normalizeTerms(state.terms), valueAtHalfPi = partialSum(CHALLENGE_X, terms), peak = overshootData(terms);
    const mapMainX = (x) => 52 + (x + Math.PI) / (2 * Math.PI) * 431;
    const mapMainY = (y) => 199 - y / 1.35 * 105;
    const mainPath = sampledPath((x) => partialSum(x, terms), -Math.PI, Math.PI, 1001, mapMainX, mapMainY);
    const zoom = state.zoomHalfWidth, mapZoomX = (x) => 539 + (x + zoom) / (2 * zoom) * 178, mapZoomY = (y) => 304 - y / 1.3 * 50;
    const zoomPath = sampledPath((x) => partialSum(x, terms), -zoom, zoom, 501, mapZoomX, mapZoomY);
    const showTarget = state.stage >= 1 || state.revealed, showZoom = state.stage >= 2 || state.revealed, peakVisible = peak.peakLocation <= zoom + 1e-12;
    const targetMainPath = `M${mapMainX(-Math.PI)} ${mapMainY(0)}V${mapMainY(-1)}H${mapMainX(0)}V${mapMainY(1)}H${mapMainX(Math.PI)}V${mapMainY(0)}`;
    const targetZoomPath = `M${mapZoomX(-zoom)} ${mapZoomY(-1)}H${mapZoomX(0)}V${mapZoomY(1)}H${mapZoomX(zoom)}`;
    const description = `The partial sum uses ${terms} odd sine harmonics through frequency ${2 * terms - 1}. At x pi over 2 its value is ${clean(valueAtHalfPi, 10)}. At the jump x zero every sine term vanishes, so the sum is zero, the midpoint between minus one and plus one. The first positive Gibbs peak is at x ${clean(peak.peakLocation, 8)} with value ${clean(peak.peakValue, 9)}, excess ${clean(peak.excessAboveOne * 100, 5)} percent of the unit plateau. The spectrum contains coefficients 4 over pi times odd harmonic. The jump zoom half-width is ${clean(zoom, 2)} radians.`;
    return `<svg class="p246-fourier p246-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p246-svg-title p246-svg-desc"><title id="p246-svg-title">Odd-harmonic Fourier partial sum, coefficient spectrum and jump zoom</title><desc id="p246-svg-desc">${description}</desc><defs><linearGradient id="p246-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#30283e"/></linearGradient></defs><rect class="p246-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p246-board-kicker" x="22" y="27">ODD SINE HARMONICS · MIDPOINT AT JUMPS · NARROWING GIBBS LOBE</text><g class="p246-wave-panel"><rect x="20" y="43" width="480" height="358" rx="15"/><text class="p246-panel-title" x="38" y="67">FULL PERIOD · −π≤x≤π</text><g class="p246-grid">${[-Math.PI,-Math.PI/2,0,Math.PI/2,Math.PI].map((x, index) => `<line x1="${mapMainX(x)}" y1="83" x2="${mapMainX(x)}" y2="315"/><text x="${mapMainX(x)}" y="332" text-anchor="middle">${["−π","−π/2","0","π/2","π"][index]}</text>`).join("")}${[-1,0,1].map((y) => `<line x1="52" y1="${mapMainY(y)}" x2="483" y2="${mapMainY(y)}"/><text x="45" y="${mapMainY(y) + 3}" text-anchor="end">${y}</text>`).join("")}</g><g class="p246-target-group ${showTarget ? "is-visible" : ""}"><path class="p246-target-wave" d="${targetMainPath}"/><text class="p246-target-label" x="61" y="111">unit square wave</text></g><path class="p246-sum-wave" d="${mainPath}"/><line class="p246-halfpi-guide" x1="${mapMainX(CHALLENGE_X)}" y1="83" x2="${mapMainX(CHALLENGE_X)}" y2="315"/><circle class="p246-halfpi-point" cx="${mapMainX(CHALLENGE_X)}" cy="${mapMainY(valueAtHalfPi)}" r="6"/><text class="p246-halfpi-label" x="${mapMainX(CHALLENGE_X)}" y="${clamp(mapMainY(valueAtHalfPi) - 13, 86, 300)}" text-anchor="middle">S${terms}(π/2)=${clean(valueAtHalfPi, 6)}</text><circle class="p246-midpoint" cx="${mapMainX(0)}" cy="${mapMainY(0)}" r="5"/><text class="p246-midpoint-label ${showTarget ? "is-visible" : ""}" x="${mapMainX(0) + 8}" y="${mapMainY(0) + 15}">jump midpoint 0</text><line class="p246-formula-rule" x1="38" y1="349" x2="482" y2="349"/><text class="p246-formula" x="38" y="371">S${terms}(π/2)=4/π(${piHalfSeriesText(terms)})</text><text class="p246-formula-result" x="482" y="389" text-anchor="end">bracket=${clean(piHalfBracketSum(terms), 8)}</text></g><g class="p246-spectrum-panel"><rect x="515" y="43" width="225" height="166" rx="15"/><text class="p246-panel-title" x="533" y="67">ODD SINE COEFFICIENTS</text><text class="p246-spectrum-note" x="533" y="83">bₙ=4/(πn) · even n absent</text><line class="p246-spectrum-axis" x1="540" y1="186" x2="715" y2="186"/>${spectrumMarkup()}<text class="p246-spectrum-tick" x="540" y="199">n=1</text><text class="p246-spectrum-tick" x="715" y="199" text-anchor="end">n=${2 * terms - 1}</text></g><g class="p246-zoom-panel ${showZoom ? "is-visible" : ""}"><rect x="515" y="218" width="225" height="183" rx="15"/><text class="p246-panel-title" x="533" y="242">JUMP ZOOM · x=0</text><text class="p246-zoom-note" x="533" y="257">window ±${clean(zoom, 2)} rad</text><g class="p246-zoom-grid"><line x1="539" y1="${mapZoomY(1)}" x2="717" y2="${mapZoomY(1)}"/><line x1="539" y1="${mapZoomY(0)}" x2="717" y2="${mapZoomY(0)}"/><line x1="539" y1="${mapZoomY(-1)}" x2="717" y2="${mapZoomY(-1)}"/><line x1="${mapZoomX(0)}" y1="250" x2="${mapZoomX(0)}" y2="356"/></g><path class="p246-target-wave" d="${targetZoomPath}"/><path class="p246-sum-wave is-zoom" d="${zoomPath}"/><circle class="p246-midpoint" cx="${mapZoomX(0)}" cy="${mapZoomY(0)}" r="4"/><text class="p246-zoom-midpoint" x="${mapZoomX(0) + 6}" y="${mapZoomY(0) + 12}">Sₙ(0)=0</text>${peakVisible ? `<line class="p246-peak-guide" x1="${mapZoomX(peak.peakLocation)}" y1="${mapZoomY(peak.peakValue)}" x2="${mapZoomX(peak.peakLocation)}" y2="${mapZoomY(1)}"/><circle class="p246-peak-point" cx="${mapZoomX(peak.peakLocation)}" cy="${mapZoomY(peak.peakValue)}" r="5"/><text class="p246-peak-label" x="${clamp(mapZoomX(peak.peakLocation), 574, 689)}" y="${mapZoomY(peak.peakValue) - 8}" text-anchor="middle">${clean(peak.peakValue, 5)}</text>` : `<text class="p246-peak-label" x="533" y="277">first peak outside zoom</text>`}<text class="p246-gibbs-ledger" x="533" y="378">peak x=π/(2N)=${clean(peak.peakLocation, 4)}</text><text class="p246-gibbs-ledger" x="533" y="392">excess=${clean(peak.excessAboveOne * 100, 4)}% · limiting ≈17.898%</text></g></svg>`;
  }

  function controlsMarkup() {
    const terms = normalizeTerms(state.terms), peak = overshootData(terms);
    return `<section class="p246-controls" aria-label="Fourier harmonic count and jump zoom"><div class="p246-slider-grid"><label for="p246-terms"><span>Odd harmonic terms N <output>${terms}</output></span><input id="p246-terms" type="range" min="1" max="25" step="1" value="${terms}" aria-valuetext="${terms} odd sine terms, through harmonic ${2 * terms - 1}; value at pi over 2 ${clean(partialSum(CHALLENGE_X, terms), 9)}; first Gibbs peak ${clean(peak.peakValue, 8)} at x ${clean(peak.peakLocation, 6)}"/></label><label for="p246-zoom"><span>Jump zoom half-width <output>±${clean(state.zoomHalfWidth, 2)}</output></span><input id="p246-zoom" type="range" min="0.2" max="1.6" step="0.1" value="${state.zoomHalfWidth}" aria-valuetext="Jump zoom from minus ${clean(state.zoomHalfWidth, 2)} to plus ${clean(state.zoomHalfWidth, 2)} radians; first positive peak at ${clean(peak.peakLocation, 6)} radians"/></label></div><p data-p246-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const terms = normalizeTerms(state.terms), peak = overshootData(terms);
    return `<section class="p246-metrics" aria-live="polite"><article><span>Value at π/2</span><strong>${clean(partialSum(CHALLENGE_X, terms), 9)}</strong><small>alternating odd reciprocals</small></article><article><span>At every jump</span><strong>S${terms}(0)=0</strong><small>midpoint of −1 and +1</small></article><article><span>First Gibbs peak</span><strong>${clean(peak.peakValue, 7)}</strong><small>x=${clean(peak.peakLocation, 5)}; excess ${clean(peak.excessAboveOne * 100, 3)}%</small></article></section>`;
  }
  function convergenceMarkup() {
    return `<section class="p246-convergence"><strong>More harmonics improve resolution, not uniform convergence at jumps.</strong><span>Away from a discontinuity, Sₙ approaches the square wave. At the jump it equals the midpoint 0. Nearby, the Gibbs lobe becomes narrower while its limiting peak remains about 1.17898 rather than settling to 1.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p246-dynamic">${fourierSvg()}${controlsMarkup()}${metricsMarkup()}${convergenceMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p246-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p246-solution" aria-labelledby="p246-solution-heading"><h3 id="p246-solution-heading" tabindex="-1">At π/2 the odd harmonics alternate in sign</h3><p>For N=3, the active harmonics are 1, 3 and 5. Their sine values at x=π/2 are</p><div class="p246-equation">sin(π/2)=1,<br>sin(3π/2)=−1,<br>sin(5π/2)=1.</div><p>Therefore</p><div class="p246-equation">S₃(π/2)=4/π(1−1/3+1/5)<br>=4/π·13/15</div><div class="p246-equation is-answer"><strong>S₃(π/2)=52/(15π)≈1.103474272.</strong></div><p>At a jump such as x=0, every sine term is zero, so every partial sum is exactly 0—the midpoint of the one-sided values −1 and +1. Immediately to the right, the first maximum occurs at x=π/(2N). That location tends to 0 as N grows, but the peak tends to approximately 1.178979744. Thus the Gibbs overshoot narrows around the discontinuity without disappearing.</p></section>`;
  }

  function snapshot() {
    const terms = normalizeTerms(state.terms), peak = overshootData(terms), coefficients = Array.from({ length: terms }, (_, index) => coefficient(index));
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      target: "2π-periodic odd unit square wave: +1 on (0,π), -1 on (-π,0), midpoint 0 at jumps",
      active: {
        terms,
        highestHarmonic: 2 * terms - 1,
        formula: "S_N(x)=4/pi sum_(k=0)^(N-1) sin((2k+1)x)/(2k+1)",
        coefficients,
        valueAtPiOverTwo: partialSum(CHALLENGE_X, terms),
        alternatingBracketAtPiOverTwo: piHalfBracketSum(terms),
        jumpValues: { atZero: partialSum(0, terms), atPi: partialSum(Math.PI, terms), midpointTarget: 0 },
      },
      challenge: CHALLENGE,
      gibbs: {
        firstPositivePeakLocation: peak.peakLocation,
        exactPeakLocation: "pi/(2N)",
        firstPositivePeakValue: peak.peakValue,
        excessAboveUnitPlateau: peak.excessAboveOne,
        nextCountPeakLocation: peak.nextPeakLocation,
        narrowsWhenAnotherTermAdded: peak.narrowsWhenAnotherTermAdded,
        persistsAboveOne: peak.persistsAboveOne,
        limitingPeakApproximation: GIBBS_LIMIT_VALUE,
        limitingExcessApproximation: GIBBS_LIMIT_VALUE - 1,
        claim: "peak location tends to jump while peak excess tends to a nonzero constant",
      },
      zoomHalfWidthRadians: state.zoomHalfWidth,
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p246-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Calculus and Optimisation</strong><span class="eyebrow">Chapter 24 · Fourier series</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p246-spread"><article class="book-page p246-problem-page"><div class="problem-number">Problem 24.6</div><h1 class="book-title p246-title">The Square Wave Built from Sines</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p246-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">The N-term odd square-wave partial sum is</p><div class="p246-given-formula">Sₙ(x)=4/π Σ<sub>k=0</sub><sup>N−1</sup> sin((2k+1)x)/(2k+1).</div><p class="problem-copy">Using the first three odd harmonics, <strong>find S₃(π/2).</strong></p><section class="p246-question-card"><strong>A discontinuous target from smooth ingredients</strong><p>Finite sums remain smooth. Their high-frequency ripples encode increasingly sharp transitions without becoming uniformly accurate at the jumps.</p></section></article><section class="book-page book-stage p246-stage" aria-labelledby="p246-stage-heading">${stageControlsMarkup()}<div class="p246-stage-heading"><div><span class="eyebrow">Fourier laboratory</span><h2 id="p246-stage-heading">Build the jump one odd harmonic at a time</h2></div><p>Change N, inspect the matching spectrum, and zoom toward x=0 to separate midpoint convergence from Gibbs overshoot.</p></div><div class="p246-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p246-coach"><div class="coach-kicker">Evaluate three harmonics</div><p class="coach-question">Enter the numerical value of S₃(π/2). Six correct decimal places are sufficient.</p><form class="p246-answer-form" data-p246-answer-form novalidate><label for="p246-answer">Three-term partial sum</label><input id="p246-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="decimal value"/><small>The exact form 52/(15π) is shown on reveal; enter its decimal value here.</small><button class="primary-button" type="submit">Check sum</button></form>${feedbackMarkup()}<div class="button-row p246-help-row"><button class="secondary-button" type="button" data-problem-action="p246-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p246-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p246-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p246-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p246-dynamic");
    const selector = dynamic?.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) {
      const replacement = root.querySelector(selector);
      if (replacement) {
        try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); }
      }
    }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p246-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p246-reset") { state = initialState(); renderAndFocus(renderApp, "#p246-terms"); return; }
      if (action === "p246-stage") { state.stage = clamp(Math.round(Number(control.dataset.p246Stage)), 0, 2); renderAndFocus(renderApp, `[data-p246-stage="${state.stage}"]`); return; }
      if (action === "p246-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p246-stage="${state.stage}"]`); return; }
      if (action === "p246-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p246-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p246-reveal") window.requestAnimationFrame(() => document.querySelector("#p246-solution-heading")?.focus());
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p246-terms")) {
        state.terms = normalizeTerms(event.target.value);
        const peak = overshootData(state.terms);
        state.boardMessage = `N=${state.terms} uses odd harmonics through ${2 * state.terms - 1}. The first Gibbs peak is ${clean(peak.peakValue, 7)} at x=${clean(peak.peakLocation, 5)}.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p246-zoom")) {
        state.zoomHalfWidth = clamp(Math.round(Number(event.target.value) * 10) / 10, .2, 1.6);
        const peak = overshootData(state.terms);
        state.boardMessage = `Jump window set to ±${clean(state.zoomHalfWidth, 2)} rad. The first positive peak at x=${clean(peak.peakLocation, 5)} is ${peak.peakLocation <= state.zoomHalfWidth ? "inside" : "outside"} the zoom.`;
        updateDynamicDom();
        return;
      }
      if (event.target.matches("#p246-answer")) { state.answer = event.target.value.slice(0, 30); state.feedback = ""; state.committed = false; }
    });
    root.querySelector("[data-p246-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p246-answer")?.value || "", answer = parseNumber(raw);
      state.answer = raw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a numerical decimal value for the three-term partial sum.";
      else if (Math.abs(answer - 13 / 15) <= 1e-6) state.feedback = "13/15 is the bracketed alternating sum. Multiply it by the outside factor 4/π.";
      else if (Math.abs(answer - 1) <= 1e-6) state.feedback = "The target square wave equals 1 at π/2, but the question asks for the finite three-term Fourier sum.";
      else if (Math.abs(answer - 4 / Math.PI * (1 + 1 / 3 + 1 / 5)) <= 1e-6) state.feedback = "The 3rd-harmonic contribution is negative because sin(3π/2)=−1.";
      else if (Math.abs(answer - CHALLENGE.value) > 1e-6) state.feedback = "Evaluate the three sine factors at π/2, combine 1−1/3+1/5, then multiply by 4/π.";
      else {
        state.feedbackTone = "success";
        state.feedback = "Correct: S₃(π/2)=52/(15π)≈1.103474272.";
        state.committed = true;
        state.stage = 2;
        restoreChallenge();
      }
      renderAndFocus(renderApp, "#p246-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
