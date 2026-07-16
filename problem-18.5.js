(function registerViolinDecibelPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "18.5";
  const SINGLE_LEVEL_DECIBELS = 72;
  const CHALLENGE_SOURCE_COUNT = 10;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Intensity", title: "Add the independent intensities", copy: "Comparable independent violins do not keep a fixed phase relationship. Their average intensities add, so n sources give n times one source’s intensity." }),
    Object.freeze({ short: "Ratio", title: "Put the intensity ratio inside the logarithm", copy: "The total-to-reference intensity ratio is n times larger. A decibel level is the logarithm of that ratio, not an amount of intensity to add directly." }),
    Object.freeze({ short: "Level", title: "Convert the multiplier into a decibel gain", copy: "Use 10 log₁₀(n). Ten independent sources add 10 dB, taking one violin’s 72 dB to 82 dB." }),
  ]);
  const hints = Object.freeze([
    "Decibels are logarithmic labels for intensity ratios. Do not add ten copies of the number 72.",
    "For independent comparable sources, intensities add: I₁₀=10I₁.",
    "L₁₀−L₁=10 log₁₀(I₁₀/I₁)=10 log₁₀(10).",
    "Since log₁₀(10)=1, the increase is 10 dB. Add that increase to 72 dB.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p185-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function independentGainDecibels(sourceCount) { return 10 * Math.log10(clamp(sourceCount, 1, 100)); }
  function independentLevelDecibels(sourceCount) { return SINGLE_LEVEL_DECIBELS + independentGainDecibels(sourceCount); }
  function coherentGainDecibels(sourceCount) { return 20 * Math.log10(clamp(sourceCount, 1, 100)); }
  function coherentLevelDecibels(sourceCount) { return SINGLE_LEVEL_DECIBELS + coherentGainDecibels(sourceCount); }
  function parseDecibels(raw) { const normalized = String(raw).trim().replaceAll(",", "."); const match = normalized.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/); return match ? Number(match[0]) : NaN; }

  function initialState() { return { sourceCount: CHALLENGE_SOURCE_COUNT, boardMessage: "Ten independent comparable violins multiply intensity by 10, which adds 10 dB—not 648 dB and not ten copies of 72 dB.", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function restoreChallenge() { state.sourceCount = CHALLENGE_SOURCE_COUNT; state.boardMessage = "Challenge restored: 10 independent violins give 10I₁ and 72+10log₁₀(10)=82 dB."; }
  function setSourceCount(value) { state.sourceCount = clamp(Math.round(value), 1, 100); state.boardMessage = `${state.sourceCount} independent comparable ${state.sourceCount === 1 ? "violin gives" : "violins give"} ${state.sourceCount}I₁ and ${format(independentLevelDecibels(state.sourceCount), 2)} dB in total.`; }

  function stageControls() {
    return `<div class="p185-stage-controls" role="group" aria-label="Decibel reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p185-stage" data-p185-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p185-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p185-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Logarithm exposed" : "Next stage"}</button></div>`;
  }

  function sourceGridMarkup() {
    return Array.from({ length: 100 }, (_, index) => { const column = index % 10, row = Math.floor(index / 10), x = 43 + column * 22, y = 65 + row * 15, active = index < state.sourceCount; return `<g class="p185-source ${active ? "is-active" : ""}"><circle cx="${x}" cy="${y}" r="5"/><path d="M${x - 2} ${y - 6}q2-5 4 0M${x - 4} ${y + 6}l8-12"/></g>`; }).join("");
  }

  function levelCurvePath() {
    return Array.from({ length: 100 }, (_, index) => { const count = index + 1, x = 50 + 660 * index / 99, y = 386 - 5 * (independentLevelDecibels(count) - 72); return `${index ? "L" : "M"}${format(x, 3)} ${format(y, 3)}`; }).join("");
  }

  function soundSvg() {
    const gain = independentGainDecibels(state.sourceCount), total = independentLevelDecibels(state.sourceCount), pointX = 50 + 660 * (state.sourceCount - 1) / 99, pointY = 386 - 5 * (total - 72), pointLabelY = pointY < 305 ? pointY + 21 : pointY - 13, intensityWidth = 390 * state.sourceCount / 100, levelWidth = 390 * gain / 20;
    const yTicks = [72, 77, 82, 87, 92].map((level) => { const y = 386 - 5 * (level - 72); return `<g class="p185-tick"><line x1="50" y1="${y}" x2="710" y2="${y}"/><text x="42" y="${y + 3}" text-anchor="end">${level}</text></g>`; }).join("");
    const xTicks = [1, 10, 25, 50, 100].map((count) => { const x = 50 + 660 * (count - 1) / 99; return `<g class="p185-tick"><line x1="${format(x, 3)}" y1="386" x2="${format(x, 3)}" y2="391"/><text x="${format(x, 3)}" y="406" text-anchor="middle">${count}</text></g>`; }).join("");
    return `<svg class="p185-sound p185-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p185-svg-title p185-svg-desc"><title id="p185-svg-title">Independent violin intensity and decibel-level model</title><desc id="p185-svg-desc">There are ${state.sourceCount} independent comparable violins. Their intensities add to ${state.sourceCount} times one violin’s intensity. Relative to one 72 decibel violin, the level gain is ${format(gain, 5)} decibels and total level is ${format(total, 5)} decibels. The lower graph plots the logarithmic total level from one to one hundred independent sources.</desc><rect class="p185-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p185-board-kicker" x="25" y="29">INDEPENDENT SOURCES · INTENSITY ADDS · LEVEL IS LOGARITHMIC</text><g class="p185-source-field"><rect x="24" y="45" width="237" height="192" rx="14"/><text class="p185-field-label" x="40" y="221">${state.sourceCount} SOURCE${state.sourceCount === 1 ? "" : "S"} SELECTED</text>${sourceGridMarkup()}</g><g class="p185-audit" transform="translate(286 47)"><text class="p185-audit-title" x="0" y="13">LINEAR INTENSITY</text><text class="p185-audit-value" x="422" y="13" text-anchor="end">Iₜₒₜ=${state.sourceCount}I₁</text><rect class="p185-meter-track" x="0" y="29" width="390" height="24" rx="7"/><rect class="p185-intensity-fill" x="0" y="29" width="${format(intensityWidth, 3)}" height="24" rx="7"/><text class="p185-meter-limit" x="422" y="46" text-anchor="end">scale to 100I₁</text><g class="p185-log-group"><text class="p185-audit-title" x="0" y="90">LOGARITHMIC LEVEL GAIN</text><text class="p185-audit-value" x="422" y="90" text-anchor="end">+${format(gain, 2)} dB</text><rect class="p185-meter-track" x="0" y="106" width="390" height="24" rx="7"/><rect class="p185-level-fill" x="0" y="106" width="${format(levelWidth, 3)}" height="24" rx="7"/><text class="p185-meter-limit" x="422" y="123" text-anchor="end">0 to +20 dB</text><rect class="p185-formula-box" x="0" y="151" width="422" height="73" rx="11"/><text class="p185-formula-kicker" x="15" y="172">TOTAL SOUND LEVEL</text><text class="p185-formula" x="15" y="201">72 + 10 log₁₀(${state.sourceCount})</text><text class="p185-total" x="405" y="207" text-anchor="end">${format(total, 2)} dB</text></g></g><g class="p185-curve-group"><text class="p185-curve-title" x="50" y="266">TOTAL LEVEL (dB) AS INDEPENDENT SOURCE COUNT INCREASES</text>${yTicks}<path class="p185-level-curve" d="${levelCurvePath()}"/>${xTicks}<line class="p185-selected-guide" x1="${format(pointX, 3)}" y1="${format(pointY, 3)}" x2="${format(pointX, 3)}" y2="386"/><circle class="p185-selected-point" cx="${format(pointX, 3)}" cy="${format(pointY, 3)}" r="7"/><text class="p185-point-label" x="${format(clamp(pointX, 95, 665), 3)}" y="${format(pointLabelY, 3)}" text-anchor="middle">${state.sourceCount} → ${format(total, 2)} dB</text><text class="p185-axis-label" x="710" y="422" text-anchor="end">number of independent violins</text></g></svg>`;
  }

  function sourceControls() {
    const presets = [1, 2, 5, 10, 20, 50, 100];
    return `<section class="p185-controls" aria-label="Independent source count controls"><label for="p185-source-count"><span>Independent comparable violins <output data-p185-output="count">${state.sourceCount}</output></span><input id="p185-source-count" type="range" min="1" max="100" step="1" value="${state.sourceCount}" aria-valuetext="${state.sourceCount} independent violins; total ${format(independentLevelDecibels(state.sourceCount), 2)} decibels"/></label><div class="p185-presets" role="group" aria-label="Source count presets">${presets.map((count) => `<button class="chip-button ${state.sourceCount === count ? "active" : ""}" type="button" data-p185-count="${count}" aria-pressed="${state.sourceCount === count}">${count}</button>`).join("")}</div><p data-p185-control-message role="status">${state.boardMessage}</p></section>`;
  }

  function comparisonMarkup() {
    const independent = independentLevelDecibels(state.sourceCount), coherent = coherentLevelDecibels(state.sourceCount);
    return `<section class="p185-comparison" aria-labelledby="p185-comparison-heading"><div><span class="eyebrow">Do not mix the models</span><h3 id="p185-comparison-heading">Independent intensity addition is the stated case</h3></div><article><span>independent · random relative phase</span><strong>Iₜₒₜ=${state.sourceCount}I₁</strong><b>72+10log₁₀(${state.sourceCount})=${format(independent, 2)} dB</b></article><article class="is-coherent"><span>ideal coherent · phase-locked at one point</span><strong>amplitudes add ⇒ Iₜₒₜ=${state.sourceCount}²I₁</strong><b>72+20log₁₀(${state.sourceCount})=${format(coherent, 2)} dB</b></article><p>The coherent row is a distinct idealisation, not the orchestra model used in the question.</p></section>`;
  }

  function metricsMarkup() {
    const gain = independentGainDecibels(state.sourceCount);
    return `<section class="p185-metrics" aria-live="polite"><div><span>Intensity multiplier</span><strong>${state.sourceCount} × I₁</strong></div><div><span>Decibel gain</span><strong>+${format(gain, 2)} dB</strong></div><div><span>Total independent level</span><strong>${format(independentLevelDecibels(state.sourceCount), 2)} dB</strong></div></section>`;
  }

  function dynamicMarkup() { return `<div class="p185-dynamic"><div class="p185-sound-wrap">${soundSvg()}${sourceControls()}</div>${comparisonMarkup()}${metricsMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p185-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p185-solution" aria-labelledby="p185-solution-heading"><h3 id="p185-solution-heading" tabindex="-1">Add intensity first, then take its logarithm</h3><p>For ten comparable independent sources, the time-averaged intensities add:</p><div class="p185-equation">I₁₀=10I₁</div><p>Use the definition L=10log₁₀(I/I₀), and separate the product inside the logarithm:</p><div class="p185-equation">L₁₀=10log₁₀(10I₁/I₀)<br>=10log₁₀(10)+10log₁₀(I₁/I₀)<br>=10 dB+72 dB</div><div class="p185-equation is-answer">L₁₀=82 dB</div><p>It is not 720 dB: decibel levels are logarithms of intensity ratios, not intensities themselves.</p><p>If ten equal-amplitude sources were instead perfectly phase-locked at the same observation point, pressure amplitudes could add and intensity there could scale as 10². That separate ideal coherent case would give 72+20log₁₀(10)=92 dB. Ordinary independent violins are modelled by intensity addition and give 82 dB.</p></section>`;
  }

  function snapshot() {
    const count = state.sourceCount, independentGain = independentGainDecibels(count), coherentGain = coherentGainDecibels(count);
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "independent comparable sources with uncorrelated relative phases; time-averaged intensities add", singleSourceLevelDecibels: SINGLE_LEVEL_DECIBELS, selectedSourceCount: count, independentIntensityMultiplier: count, independentGainDecibels: Number(independentGain.toFixed(12)), independentTotalLevelDecibels: Number((SINGLE_LEVEL_DECIBELS + independentGain).toFixed(12)), logarithmIdentityResidual: Number((independentGain - 10 * Math.log10(count)).toExponential(6)), comparisonOnly: { model: "ideal equal-amplitude sources phase-locked at one observation point", coherentIntensityMultiplier: count ** 2, coherentGainDecibels: Number(coherentGain.toFixed(12)), coherentTotalLevelDecibels: Number((SINGLE_LEVEL_DECIBELS + coherentGain).toFixed(12)), appliesToChallenge: false }, challenge: { sourceCount: CHALLENGE_SOURCE_COUNT, expectedIndependentIntensityMultiplier: 10, expectedGainDecibels: 10, exactTotalLevelDecibels: 82, invalidLinearSumDecibels: 720 }, stage: state.stage + 1, answer: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    return `<main class="book-shell p185-shell"><div class="p185-extension-banner">${EXTENSION_DISCLOSURE}</div><header class="book-header"><div class="book-brand"><strong>Sound intensity and decibels</strong><span class="eyebrow">Original interactive extension</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p185-spread"><article class="book-page p185-problem-page"><div class="problem-number">Problem 18.5</div><h1 class="book-title p185-title">Why Ten Violins Aren’t Ten Times Louder</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="problem-copy">One violin produces a sound level of 72 dB at a listener. Ten comparable violins play independently at the same distance, so their time-averaged intensities add.</p><p class="problem-copy"><strong>What total sound level does the listener receive?</strong></p><section class="p185-observation-card"><strong>Levels are not intensities</strong><p>Ten times the intensity is a 10 dB increase. Multiplying the written decibel number by ten would confuse a logarithmic level with a physical intensity.</p></section><section class="p185-model-card"><div class="eyebrow">Stated source model</div><p>The violins are comparable independent sources with uncorrelated relative phases at the listener. Reflections, distance differences and masking are ignored.</p></section></article><section class="book-page book-stage p185-stage">${stageControls()}<div class="p185-visual-card">${dynamicMarkup()}${stageCaption()}</div></section><aside class="book-page book-coach p185-coach"><div class="coach-kicker">Find the ten-violin level</div><p class="coach-question">Enter the fixed challenge answer in decibels.</p><form class="p185-answer-form" data-p185-answer-form novalidate><label for="p185-answer">Total sound level</label><div><input id="p185-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 82" autocomplete="off"/><span>dB</span></div><button class="primary-button" type="submit">Check level</button></form>${feedbackMarkup()}<div class="button-row p185-help-row"><button class="secondary-button" type="button" data-problem-action="p185-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p185-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p185-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom(root) {
    const sound = root.querySelector(".p185-sound"); if (sound) sound.outerHTML = soundSvg();
    const comparison = root.querySelector(".p185-comparison"); if (comparison) comparison.outerHTML = comparisonMarkup();
    const metrics = root.querySelector(".p185-metrics"); if (metrics) metrics.outerHTML = metricsMarkup();
    const output = root.querySelector('[data-p185-output="count"]'); if (output) output.textContent = String(state.sourceCount);
    const message = root.querySelector("[data-p185-control-message]"); if (message) message.textContent = state.boardMessage;
    const slider = root.querySelector("#p185-source-count"); if (slider) { slider.value = String(state.sourceCount); slider.setAttribute("aria-valuetext", `${state.sourceCount} independent violins; total ${format(independentLevelDecibels(state.sourceCount), 2)} decibels`); }
    root.querySelectorAll("[data-p185-count]").forEach((button) => { const active = Number(button.dataset.p185Count) === state.sourceCount; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function resetChallenge() { state = initialState(); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p185-shell");
    root?.addEventListener("click", (event) => {
      const actionControl = event.target.closest("[data-problem-action]");
      if (actionControl) {
        const action = actionControl.dataset.problemAction;
        if (action === "p185-reset") { resetChallenge(); renderAndFocus(renderApp, "#p185-source-count"); return; }
        if (action === "p185-stage") { state.stage = clamp(Number(actionControl.dataset.p185Stage), 0, 2); renderAndFocus(renderApp, `[data-p185-stage="${state.stage}"]`); return; }
        if (action === "p185-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p185-stage="${state.stage}"]`); return; }
        if (action === "p185-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p185-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
        renderApp(); if (action === "p185-reveal") window.requestAnimationFrame(() => document.querySelector("#p185-solution-heading")?.focus()); return;
      }
      const preset = event.target.closest("[data-p185-count]");
      if (preset) { setSourceCount(Number(preset.dataset.p185Count)); updateDynamicDom(root); preset.focus(); }
    });
    root?.querySelector("#p185-source-count")?.addEventListener("input", (event) => { setSourceCount(Number(event.target.value)); updateDynamicDom(root); });
    root?.querySelector("#p185-answer")?.addEventListener("input", (event) => { state.answer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; });
    root?.querySelector("[data-p185-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); const raw = event.currentTarget.querySelector("#p185-answer")?.value || "", answer = parseDecibels(raw); state.answer = raw.trim(); state.feedbackTone = "warn"; state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a sound level in decibels.";
      else if (Math.abs(answer - 720) <= .05) state.feedback = "That multiplies decibel labels. Add the ten intensities, then take the logarithm.";
      else if (Math.abs(answer - 10) <= .05) state.feedback = "10 dB is the gain produced by ten times the intensity. Add it to the original 72 dB.";
      else if (Math.abs(answer - 92) <= .05) state.feedback = "92 dB belongs to an ideal coherent, phase-locked ten-source model. These violins are independent.";
      else if (Math.abs(answer - 82) > .05) state.feedback = "Use Lₜₒₜ=72+10log₁₀(10).";
      else { state.feedbackTone = "success"; state.feedback = "Correct: ten times the intensity adds 10 dB, so the total is 82 dB."; state.committed = true; state.stage = 2; restoreChallenge(); }
      renderAndFocus(renderApp, "#p185-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
