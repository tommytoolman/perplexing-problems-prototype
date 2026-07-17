(function registerUnevenInflowPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "24.3";
  const DOMAIN = Object.freeze({ minimum: 0, maximum: 4 });
  const ROOTS = Object.freeze([1, 3]);
  const PLOT = Object.freeze({ left: 50, right: 535, top: 74, bottom: 326, axisY: 260, rateScale: 58 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Read rate", title: "Read inflow and outflow from the sign of the rate", copy: "Where r(t)>0, the reservoir gains water. Between the zeros t=1 and t=3, r(t)<0 and water leaves. The value r(4)=3 L/min is a rate at one instant, not an accumulated volume." }),
    Object.freeze({ short: "Accumulate", title: "Let signed area update the volume ledger", copy: "The accumulated net change is the signed integral. Positive area adds litres; negative area subtracts litres. The current net ledger is F(t)−F(0), where F(t)=t³/3−2t²+3t." }),
    Object.freeze({ short: "Uncancel", title: "Count total activity without cancellation", copy: "Total throughput integrates |r(t)|, so both inflow and outflow count positively. Net change can be small even when a large amount of water has moved." }),
  ]);
  const hints = Object.freeze([
    "Factor the rate: r(t)=(t−1)(t−3), so its zeros are t=1 and t=3.",
    "An antiderivative is F(t)=t³/3−2t²+3t.",
    "The three signed lobe areas on [0,1], [1,3] and [3,4] are +4/3, −4/3 and +4/3 litres.",
    "For net change, keep the signs: 4/3−4/3+4/3.",
    "For throughput, add magnitudes: 4/3+4/3+4/3.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p243-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(Number(value)) < 1e-10 ? 0 : Number(value); }
  function format(value, digits = 3) {
    if (!Number.isFinite(Number(value))) return "—";
    return String(cleanZero(Number(Number(value).toFixed(digits))));
  }
  function signed(value, digits = 3) {
    const cleaned = cleanZero(value);
    return cleaned > 0 ? `+${format(cleaned, digits)}` : format(cleaned, digits);
  }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function rate(time) { const t = Number(time); return t * t - 4 * t + 3; }
  function antiderivative(time) { const t = Number(time); return t ** 3 / 3 - 2 * t * t + 3 * t; }
  function phaseAt(time) {
    const t = Number(time);
    if (Math.abs(t - 1) < 1e-8 || Math.abs(t - 3) < 1e-8) return "zero crossing";
    return rate(t) > 0 ? "inflow" : "outflow";
  }
  function accumulatedAt(time) {
    const t = clamp(time, DOMAIN.minimum, DOMAIN.maximum);
    const net = cleanZero(antiderivative(t) - antiderivative(0));
    let positiveArea = 0;
    let negativeSignedArea = 0;
    if (t <= 1) positiveArea = net;
    else if (t <= 3) {
      positiveArea = 4 / 3;
      negativeSignedArea = cleanZero(net - positiveArea);
    } else {
      positiveArea = cleanZero(4 / 3 + antiderivative(t));
      negativeSignedArea = -4 / 3;
    }
    const throughput = cleanZero(positiveArea + Math.abs(negativeSignedArea));
    return {
      time: t,
      rate: cleanZero(rate(t)),
      phase: phaseAt(t),
      positiveArea,
      negativeSignedArea,
      negativeMagnitude: Math.abs(negativeSignedArea),
      net,
      throughput,
      netLedgerResidual: cleanZero(net - positiveArea - negativeSignedArea),
      throughputLedgerResidual: cleanZero(throughput - positiveArea + negativeSignedArea),
    };
  }

  const finalLedger = Object.freeze(accumulatedAt(4));

  function initialState() {
    return {
      time: 4,
      stage: 0,
      netAnswer: "",
      throughputAnswer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "End of interval loaded. Scrub backward to watch each signed lobe enter the volume ledger.",
    };
  }
  let state = initialState();
  function currentLedger() { return accumulatedAt(state.time); }
  function setTime(value, message) {
    state.time = clamp(value, DOMAIN.minimum, DOMAIN.maximum);
    const ledger = currentLedger();
    state.boardMessage = message || `At t=${format(ledger.time, 2)}, r(t)=${signed(ledger.rate, 3)} L/min; net change is ${signed(ledger.net, 4)} L and throughput is ${format(ledger.throughput, 4)} L.`;
  }
  function restoreEnd(message) { setTime(4, message || "Restored t=4: net change 4/3 L, total throughput 4 L, final rate 3 L/min."); }

  function stageControlsMarkup() {
    return `<div class="p243-stage-controls" role="group" aria-label="Accumulation reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p243-stage" data-p243-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p243-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p243-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Both ledgers separated" : "Next stage"}</button></div>`;
  }

  function xScale(time) { return PLOT.left + (Number(time) - DOMAIN.minimum) * (PLOT.right - PLOT.left) / (DOMAIN.maximum - DOMAIN.minimum); }
  function yScale(value) { return PLOT.axisY - Number(value) * PLOT.rateScale; }
  function curvePath(from = 0, to = 4, points = 161) {
    return Array.from({ length: points }, (_, index) => {
      const t = from + (to - from) * index / (points - 1);
      return `${index ? "L" : "M"}${format(xScale(t), 3)} ${format(yScale(rate(t)), 3)}`;
    }).join(" ");
  }
  function areaPath(from, to) {
    if (to <= from) return "";
    const curve = curvePath(from, to, 49);
    return `M${format(xScale(from), 3)} ${PLOT.axisY} ${curve.replace(/^M/, "L")} L${format(xScale(to), 3)} ${PLOT.axisY} Z`;
  }

  function accumulationSvg() {
    const ledger = currentLedger();
    const firstPositiveEnd = Math.min(ledger.time, 1);
    const negativeEnd = clamp(ledger.time, 1, 3);
    const secondPositiveEnd = clamp(ledger.time, 3, 4);
    const firstPositivePath = areaPath(0, firstPositiveEnd);
    const negativePath = ledger.time > 1 ? areaPath(1, negativeEnd) : "";
    const secondPositivePath = ledger.time > 3 ? areaPath(3, secondPositiveEnd) : "";
    const currentX = xScale(ledger.time);
    const currentY = yScale(ledger.rate);
    const showRoots = state.stage >= 1 || state.revealed;
    const showThroughput = state.stage >= 2 || state.revealed;
    const description = `The rate curve is r of t equals t squared minus 4t plus 3 litres per minute from time 0 to 4 minutes. The scrubber is at time ${format(ledger.time, 4)}. The current rate is ${format(ledger.rate, 5)} litres per minute. Accumulated positive area is ${format(ledger.positiveArea, 6)} litres and accumulated negative signed area is ${format(ledger.negativeSignedArea, 6)} litres. Net volume change is ${format(ledger.net, 6)} litres. Total unsigned throughput is ${format(ledger.throughput, 6)} litres. The rate roots are 1 and 3 minutes.`;
    return `<svg class="p243-accumulation p243-stage-${state.stage}" viewBox="0 0 760 410" role="img" aria-labelledby="p243-svg-title p243-svg-desc">
      <title id="p243-svg-title">Rate curve with accumulated signed areas and volume ledgers</title>
      <desc id="p243-svg-desc">${description}</desc>
      <defs>
        <linearGradient id="p243-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#2e2940"/></linearGradient>
        <pattern id="p243-positive-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8"/><line x1="0" y1="0" x2="0" y2="8"/></pattern>
        <pattern id="p243-negative-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="8" height="8"/><line x1="0" y1="0" x2="0" y2="8"/></pattern>
        <clipPath id="p243-plot-clip"><rect x="34" y="52" width="516" height="300" rx="10"/></clipPath>
      </defs>
      <rect class="p243-board" x="1" y="1" width="758" height="408" rx="20"/>
      <text class="p243-board-kicker" x="22" y="27">RATE HAS UNITS L/MIN · AREA HAS UNITS L · NEGATIVE AREA IS OUTFLOW</text>
      <g class="p243-plot-panel">
        <rect x="20" y="43" width="530" height="348" rx="15"/>
        <text class="p243-panel-title" x="38" y="66">RATE r(t)=t²−4t+3 L/MIN</text>
        <g class="p243-grid">${[-1,0,1,2,3].map((value) => `<line x1="${PLOT.left}" y1="${yScale(value)}" x2="${PLOT.right}" y2="${yScale(value)}"/><text x="${PLOT.left - 8}" y="${yScale(value) + 3}" text-anchor="end">${value}</text>`).join("")}${[0,1,2,3,4].map((value) => `<line x1="${xScale(value)}" y1="${PLOT.top}" x2="${xScale(value)}" y2="${PLOT.bottom}"/><text x="${xScale(value)}" y="${PLOT.axisY + 17}" text-anchor="middle">${value}</text>`).join("")}</g>
        <g clip-path="url(#p243-plot-clip)">${firstPositivePath ? `<path class="p243-positive-area" d="${firstPositivePath}"/>` : ""}${negativePath ? `<path class="p243-negative-area" d="${negativePath}"/>` : ""}${secondPositivePath ? `<path class="p243-positive-area" d="${secondPositivePath}"/>` : ""}<line class="p243-axis" x1="${PLOT.left}" y1="${PLOT.axisY}" x2="${PLOT.right}" y2="${PLOT.axisY}"/><path class="p243-rate-curve" d="${curvePath()}"/><line class="p243-current-guide" x1="${format(currentX, 3)}" y1="${PLOT.top}" x2="${format(currentX, 3)}" y2="${PLOT.bottom}"/><circle class="p243-current-point" cx="${format(currentX, 3)}" cy="${format(currentY, 3)}" r="6"/></g>
        <text class="p243-current-label" x="${format(clamp(currentX + 10, 68, 472), 3)}" y="${format(clamp(currentY - 11, 83, 315), 3)}">t=${format(ledger.time, 2)} · r=${signed(ledger.rate, 3)} L/min</text>
        <g class="p243-roots ${showRoots ? "is-visible" : ""}">${ROOTS.map((root) => `<circle cx="${xScale(root)}" cy="${PLOT.axisY}" r="4"/><text x="${xScale(root)}" y="${PLOT.axisY - 10}" text-anchor="middle">zero t=${root}</text>`).join("")}</g>
        ${ledger.time > .45 ? `<text class="p243-area-label is-positive" x="${xScale(.48)}" y="${yScale(1.05)}" text-anchor="middle">INFLOW +</text>` : ""}
        ${ledger.time > 1.8 ? `<text class="p243-area-label is-negative" x="${xScale(2)}" y="${yScale(-.55)}" text-anchor="middle">OUTFLOW −</text>` : ""}
        ${ledger.time > 3.42 ? `<text class="p243-area-label is-positive" x="${xScale(3.55)}" y="${yScale(.75)}" text-anchor="middle">INFLOW +</text>` : ""}
        <text class="p243-axis-label" x="${PLOT.right}" y="${PLOT.axisY + 34}" text-anchor="end">time t (min)</text><text class="p243-axis-label" x="${PLOT.left}" y="${PLOT.top - 7}">rate (L/min)</text>
      </g>
      <g class="p243-ledger-panel">
        <rect x="560" y="43" width="180" height="348" rx="15"/>
        <text class="p243-panel-title" x="575" y="66">VOLUME LEDGER TO t=${format(ledger.time, 2)}</text>
        <text class="p243-ledger-label" x="575" y="101">positive inflow area</text><text class="p243-ledger-value is-positive" x="724" y="101" text-anchor="end">+${format(ledger.positiveArea, 4)} L</text>
        <text class="p243-ledger-label" x="575" y="130">negative signed area</text><text class="p243-ledger-value is-negative" x="724" y="130" text-anchor="end">${signed(ledger.negativeSignedArea, 4)} L</text>
        <line class="p243-ledger-rule" x1="575" y1="151" x2="724" y2="151"/>
        <text class="p243-ledger-kicker" x="575" y="176">NET SIGNED CHANGE</text><text class="p243-ledger-big" x="724" y="205" text-anchor="end">${signed(ledger.net, 5)} L</text>
        <g class="p243-throughput-ledger ${showThroughput ? "is-visible" : ""}"><text class="p243-ledger-kicker" x="575" y="235">TOTAL THROUGHPUT</text><text class="p243-throughput-value" x="724" y="264" text-anchor="end">${format(ledger.throughput, 5)} L</text><text class="p243-ledger-note" x="575" y="282">adds both area magnitudes</text></g>
        <line class="p243-ledger-rule" x1="575" y1="298" x2="724" y2="298"/>
        <text class="p243-ledger-kicker" x="575" y="321">INSTANTANEOUS RATE</text><text class="p243-rate-value" x="724" y="346" text-anchor="end">${signed(ledger.rate, 4)} L/min</text>
        <text class="p243-phase-status" x="575" y="371">${ledger.time === 4 ? "FINAL RATE · NOT A VOLUME" : `${ledger.phase.toUpperCase()} NOW · NOT A VOLUME`}</text>
      </g>
    </svg>`;
  }

  function controlsMarkup() {
    const ledger = currentLedger();
    return `<section class="p243-controls" aria-label="Accumulation time control"><label for="p243-time"><span>Accumulate from 0 to time t <output>t=${format(state.time, 2)} min</output></span><input id="p243-time" type="range" min="0" max="4" step="0.01" value="${state.time}" aria-valuetext="time ${format(state.time, 3)} minutes; rate ${format(ledger.rate, 4)} litres per minute; net change ${format(ledger.net, 5)} litres; throughput ${format(ledger.throughput, 5)} litres"/></label><div class="p243-presets"><button class="secondary-button" type="button" data-problem-action="p243-time" data-p243-time="0">Start t=0</button><button class="secondary-button" type="button" data-problem-action="p243-time" data-p243-time="1">First zero t=1</button><button class="secondary-button" type="button" data-problem-action="p243-time" data-p243-time="3">Second zero t=3</button><button class="primary-button" type="button" data-problem-action="p243-time" data-p243-time="4">End t=4</button></div><p data-p243-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const ledger = currentLedger();
    return `<section class="p243-metrics" aria-live="polite"><article><span>Net signed change</span><strong>${signed(ledger.net, 5)} L</strong><small>positive area + negative signed area</small></article><article><span>Total throughput</span><strong>${format(ledger.throughput, 5)} L</strong><small>sum of both area magnitudes</small></article><article><span>${ledger.time === 4 ? "Final" : "Current"} rate</span><strong>${signed(ledger.rate, 5)} L/min</strong><small>instantaneous; not accumulated volume</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p243-distinction"><strong>Three numbers, two kinds of units.</strong><span>Net change and throughput are areas measured in litres. The final value r(4)=3 is a rate measured in litres per minute. Throughput does not cancel outflow; net change does.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p243-dynamic">${accumulationSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p243-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p243-solution" aria-labelledby="p243-solution-heading"><h3 id="p243-solution-heading">Signed area can cancel; throughput cannot</h3><p>Factor the rate to locate its sign changes:</p><div class="p243-equation">r(t)=t²−4t+3=(t−1)(t−3),<br>so r(t)=0 at t=1 and t=3.</div><p>With F(t)=t³/3−2t²+3t, the three lobe integrals are</p><div class="p243-equation">∫₀¹r(t)dt=4/3,<br>∫₁³r(t)dt=−4/3,<br>∫₃⁴r(t)dt=4/3.</div><div class="p243-equation is-answer"><strong>Net change = 4/3 L.</strong><br><strong>Total throughput = 4 L.</strong></div><p>The net calculation keeps the middle minus sign: 4/3−4/3+4/3=4/3. Throughput integrates |r| and adds all three magnitudes: 4/3+4/3+4/3=4. Finally, r(4)=3 L/min is the rate at the endpoint, not either accumulated volume.</p></section>`;
  }

  function snapshot() {
    const ledger = currentLedger();
    const intervalPieces = [
      { interval: [0, 1], sign: "positive", signedIntegral: antiderivative(1) - antiderivative(0), absoluteIntegral: 4 / 3 },
      { interval: [1, 3], sign: "negative", signedIntegral: antiderivative(3) - antiderivative(1), absoluteIntegral: 4 / 3 },
      { interval: [3, 4], sign: "positive", signedIntegral: antiderivative(4) - antiderivative(3), absoluteIntegral: 4 / 3 },
    ];
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      rateFunction: "r(t)=t^2-4t+3 litres per minute",
      factoredRate: "(t-1)(t-3)",
      domain: [DOMAIN.minimum, DOMAIN.maximum],
      roots: ROOTS,
      antiderivative: "F(t)=t^3/3-2t^2+3t",
      antiderivativeCheckpoints: { F0: antiderivative(0), F1: antiderivative(1), F3: antiderivative(3), F4: antiderivative(4) },
      intervalPieces,
      current: ledger,
      final: { netChangeLitres: finalLedger.net, totalThroughputLitres: finalLedger.throughput, positiveAreaLitres: finalLedger.positiveArea, negativeSignedAreaLitres: finalLedger.negativeSignedArea, finalRateLitresPerMinute: finalLedger.rate, netLedgerResidual: finalLedger.netLedgerResidual, throughputLedgerResidual: finalLedger.throughputLedgerResidual },
      distinction: { netChange: "signed accumulation; outflow cancels inflow", throughput: "unsigned accumulation; all movement counts", finalRate: "instantaneous endpoint rate, in litres per minute" },
      stage: state.stage + 1,
      answers: { netChange: state.netAnswer || null, throughput: state.throughputAnswer || null },
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p243-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Calculus and Optimisation</strong><span class="eyebrow">Chapter 24 · accumulation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p243-spread"><article class="book-page p243-problem-page"><div class="problem-number">Problem 24.3</div><h1 class="book-title p243-title">The Reservoir’s Uneven Inflow</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p243-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Water enters a reservoir at the signed rate</p><div class="p243-rate-card" aria-label="r of t equals t squared minus 4 t plus 3 litres per minute">r(t)=t²−4t+3 L/min,<br><span>0≤t≤4 minutes.</span></div><p class="problem-copy"><strong>Find the net volume change and the total throughput.</strong></p><section class="p243-question-card"><strong>Outflow counts differently in the two answers</strong><p>Negative rate reduces net volume, but its magnitude still contributes to the total amount of water moved.</p></section></article><section class="book-page book-stage p243-stage" aria-labelledby="p243-stage-heading">${stageControlsMarkup()}<div class="p243-stage-heading"><div><span class="eyebrow">Accumulation laboratory</span><h2 id="p243-stage-heading">Scrub the rate curve and audit every litre</h2></div><p>Move the endpoint through both zero crossings. The signed and unsigned ledgers update from the same shaded lobes.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p243-coach"><div class="coach-kicker">Report both accumulated volumes</div><p class="coach-question">For the fixed interval 0≤t≤4, enter the net change and total throughput.</p><form class="p243-answer-form" data-p243-answer-form novalidate><label for="p243-answer-net">Net change (L)<input id="p243-answer-net" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.netAnswer)}" placeholder="e.g. 4/3"/></label><label for="p243-answer-throughput">Total throughput (L)<input id="p243-answer-throughput" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.throughputAnswer)}" placeholder="litres moved"/></label><button class="primary-button" type="submit">Check both volumes</button></form>${feedbackMarkup()}<div class="button-row p243-help-row"><button class="secondary-button" type="button" data-problem-action="p243-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p243-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p243-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p243-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p243-dynamic");
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
    const root = document.querySelector(".p243-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p243-reset") { state = initialState(); renderAndFocus(renderApp, "#p243-time"); return; }
      if (action === "p243-stage") { state.stage = clamp(Math.round(Number(control.dataset.p243Stage)), 0, 2); renderAndFocus(renderApp, `[data-p243-stage="${state.stage}"]`); return; }
      if (action === "p243-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p243-stage="${state.stage}"]`); return; }
      if (action === "p243-time") { setTime(Number(control.dataset.p243Time)); updateDynamicDom(); return; }
      if (action === "p243-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p243-reveal") { state.revealed = true; state.stage = 2; restoreEnd(); }
      renderApp();
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p243-time")) { setTime(Number(event.target.value)); updateDynamicDom(); return; }
      if (event.target.matches("#p243-answer-net")) { state.netAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p243-answer-throughput")) { state.throughputAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
    });
    root.querySelector("[data-p243-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const netRaw = event.currentTarget.querySelector("#p243-answer-net")?.value || "";
      const throughputRaw = event.currentTarget.querySelector("#p243-answer-throughput")?.value || "";
      const net = parseNumber(netRaw);
      const throughput = parseNumber(throughputRaw);
      state.netAnswer = netRaw.trim();
      state.throughputAnswer = throughputRaw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(net) || !Number.isFinite(throughput)) state.feedback = "Enter both accumulated volumes as numbers or fractions.";
      else if (Math.abs(net - 4) <= .001 && Math.abs(throughput - 4 / 3) <= .001) state.feedback = "Those are reversed: net change keeps signs, while throughput adds all magnitudes.";
      else if (Math.abs(net - 3) <= .001) state.feedback = "3 is the final rate r(4), measured in L/min. Net change is an area measured in litres.";
      else if (Math.abs(throughput - 4 / 3) <= .001) state.feedback = "You have used the signed net value for throughput too. Outflow still counts positively toward total activity.";
      else if (Math.abs(net - 4 / 3) <= .001 && Math.abs(throughput - 3) <= .001) state.feedback = "The net change is right, but 3 is the endpoint rate in L/min, not total throughput in litres.";
      else if (throughput < 0) state.feedback = "Total throughput cannot be negative because it integrates |r(t)|.";
      else if (Math.abs(net - 4 / 3) > .001 || Math.abs(throughput - 4) > .001) state.feedback = "Split at t=1 and t=3. Keep signs for net change; add magnitudes for throughput.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: net change is 4/3 L, total throughput is 4 L, and the final rate 3 L/min is a different quantity."; state.committed = true; state.revealed = true; state.stage = 2; restoreEnd("Correct answers committed; restored the full interval and both final volume ledgers."); }
      renderAndFocus(renderApp, "#p243-answer-net");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
