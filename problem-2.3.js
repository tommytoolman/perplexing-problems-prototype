(function registerMoreFuddlethumbsReportsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const hints = Object.freeze([
    "A class mean hides a total. Class B's mean represents three times as many students as Class A's mean.",
    "Recover each total: multiply each class mean by that class's number of students.",
    "Add the two totals and divide by the total number of students: (nₐmₐ+nᵦmᵦ)/(nₐ+nᵦ).",
  ]);
  const presets = Object.freeze({
    original: { label: "10 vs 30", nA: 10, meanA: 60, nB: 30, meanB: 80 },
    equalSizes: { label: "Equal classes", nA: 20, meanA: 60, nB: 20, meanB: 80 },
    equalMeans: { label: "Equal means", nA: 10, meanA: 70, nB: 30, meanB: 70 },
    smallHigh: { label: "Small high group", nA: 35, meanA: 50, nB: 5, meanB: 90 },
  });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p23-reset">Reset</button>';

  const initialState = () => ({
    nA: 10,
    meanA: 60,
    nB: 30,
    meanB: 80,
    estimate: "",
    explanation: "",
    committed: false,
    feedback: "",
    feedbackTone: "is-neutral",
    hintsUsed: 0,
    revealed: false,
    success: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(",", "");
    const fraction = normalized.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      return denominator === 0 ? NaN : Number(fraction[1]) / denominator;
    }
    return normalized === "" ? NaN : Number(normalized);
  }

  function totalA() {
    return state.nA * state.meanA;
  }

  function totalB() {
    return state.nB * state.meanB;
  }

  function totalStudents() {
    return state.nA + state.nB;
  }

  function combinedMean() {
    return (totalA() + totalB()) / totalStudents();
  }

  function fuddleMean() {
    return (state.meanA + state.meanB) / 2;
  }

  function methodsCoincide() {
    return state.nA === state.nB || state.meanA === state.meanB;
  }

  function coincidenceReason() {
    if (state.nA === state.nB && state.meanA === state.meanB) return "the classes are equal in size and have equal means";
    if (state.nA === state.nB) return "the classes are the same size";
    if (state.meanA === state.meanB) return "both class means are already equal";
    return "";
  }

  function activePresetKey() {
    return Object.entries(presets).find(([, preset]) => (
      preset.nA === state.nA
      && preset.meanA === state.meanA
      && preset.nB === state.nB
      && preset.meanB === state.meanB
    ))?.[0] || "";
  }

  function clearAttempt() {
    state.estimate = "";
    state.explanation = "";
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "is-neutral";
    state.revealed = false;
    state.success = false;
  }

  function stepper(group, parameter, label, value, minimum, maximum, step) {
    const key = `${parameter}${group}`;
    return `
      <div class="p23-stepper">
        <span>${label}</span>
        <div>
          <button type="button" data-problem-action="p23-adjust" data-p23-key="${key}" data-p23-delta="-${step}" aria-label="Decrease ${group === "A" ? "Class A" : "Class B"} ${label}" ${value <= minimum ? "disabled" : ""}>−</button>
          <strong aria-live="polite">${format(value)}</strong>
          <button type="button" data-problem-action="p23-adjust" data-p23-key="${key}" data-p23-delta="${step}" aria-label="Increase ${group === "A" ? "Class A" : "Class B"} ${label}" ${value >= maximum ? "disabled" : ""}>+</button>
        </div>
      </div>`;
  }

  function classroomPanel(group) {
    const isA = group === "A";
    const n = isA ? state.nA : state.nB;
    const mean = isA ? state.meanA : state.meanB;
    const total = isA ? totalA() : totalB();
    const revealTotal = state.hintsUsed >= 2 || state.revealed || state.success;
    return `
      <article class="p23-class-card p23-class-${group.toLowerCase()}" aria-labelledby="p23-class-${group.toLowerCase()}-title">
        <header><span class="p23-class-badge">${group}</span><div><small>Class ${group}</small><h3 id="p23-class-${group.toLowerCase()}-title">${n} students · mean ${format(mean)}</h3></div></header>
        <div class="p23-class-controls">
          ${stepper(group, "n", "Students", n, 1, 40, 1)}
          ${stepper(group, "mean", "Mean mark", mean, 0, 100, 5)}
        </div>
        <div class="p23-hidden-total ${revealTotal ? "is-revealed" : ""}">
          <span>Class total</span>
          <strong>${revealTotal ? `${n} × ${format(mean)} = ${format(total)}` : "n × mean = ?"}</strong>
        </div>
      </article>`;
  }

  function populationVisual() {
    const total = totalStudents();
    const shareA = (state.nA / total) * 100;
    const shareB = 100 - shareA;
    return `
      <section class="p23-population" aria-labelledby="p23-population-title">
        <div class="p23-section-heading"><span id="p23-population-title">Combined population</span><strong>${total} students</strong></div>
        <div class="p23-population-track" role="img" aria-label="Class A has ${state.nA} of ${total} students; Class B has ${state.nB} of ${total} students">
          <span class="p23-population-a" style="width:${shareA.toFixed(3)}%"></span>
          <span class="p23-population-b" style="width:${shareB.toFixed(3)}%"></span>
        </div>
        <div class="p23-population-legend">
          <span><i class="is-a"></i>Class A · ${state.nA} · ${format(shareA, 1)}%</span>
          <span><i class="is-b"></i>Class B · ${state.nB} · ${format(shareB, 1)}%</span>
        </div>
      </section>`;
  }

  function meanComparison() {
    const showExact = state.revealed || state.success;
    return `
      <section class="p23-mean-comparison" aria-labelledby="p23-comparison-title">
        <div class="p23-section-heading"><span id="p23-comparison-title">Combined-mean scale</span><strong>${showExact ? "Compare the methods" : "Professor's report"}</strong></div>
        <div class="p23-scale" role="img" aria-label="Fuddlethumbs' simple average is ${format(fuddleMean())}${showExact ? `; the weighted mean is ${format(combinedMean())}` : "; weighted mean hidden until solved"}">
          <span class="p23-scale-rule"></span>
          <span class="p23-scale-tick is-zero">0</span><span class="p23-scale-tick is-half">50</span><span class="p23-scale-tick is-full">100</span>
          <span class="p23-marker is-fuddle" style="--p23-position:${fuddleMean()}%"><b>Fuddlethumbs</b><strong>${format(fuddleMean())}</strong></span>
          ${showExact ? `<span class="p23-marker is-exact" style="--p23-position:${combinedMean()}%"><b>Weighted</b><strong>${format(combinedMean())}</strong></span>` : ""}
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p23-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p23-solution" aria-labelledby="p23-solution-title">
        <h3 id="p23-solution-title" tabindex="-1">Weight every mean by its headcount</h3>
        <p>Turn each class mean back into the total number of marks it represents.</p>
        <ol class="math2-step-list">
          <li>Class A contributes ${state.nA} × ${format(state.meanA)} = ${format(totalA())} marks.</li>
          <li>Class B contributes ${state.nB} × ${format(state.meanB)} = ${format(totalB())} marks.</li>
          <li>Share ${format(totalA() + totalB())} marks among ${totalStudents()} students.</li>
        </ol>
        <div class="math2-equation">m = (${state.nA}·${format(state.meanA)} + ${state.nB}·${format(state.meanB)}) / (${state.nA}+${state.nB}) = ${format(combinedMean())}</div>
        <p>${methodsCoincide() ? `Fuddlethumbs happens to obtain the same number because ${coincidenceReason()}, but weighting is still the reliable method.` : `Fuddlethumbs gives each class equal weight, even though Class A represents ${state.nA} students and Class B represents ${state.nB}.`}</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: "2.3",
      provenance: "independently reconstructed from title and difficulty only",
      classA: { students: state.nA, mean: state.meanA, total: totalA() },
      classB: { students: state.nB, mean: state.meanB, total: totalB() },
      fuddlethumbsSimpleAverage: fuddleMean(),
      weightedMean: combinedMean(),
      methodsCoincide: methodsCoincide(),
      estimate: state.estimate || null,
      explanation: state.explanation || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const activePreset = activePresetKey();
    return `
      <main class="book-shell math2-shell p23-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress("2.3")}</div>
          ${problemHeaderActions("2.3", resetMarkup)}
        </header>
        <div class="book-spread math2-spread p23-spread">
          <article class="book-page p23-problem-page">
            <div class="problem-number">Problem 2.3</div>
            <h1 class="book-title math2-title p23-title">More of Professor Fuddlethumbs' reports</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="problem-copy">Class A has 10 students and a mean mark of 60. Class B has 30 students and a mean mark of 80. Professor Fuddlethumbs reports that their combined mean is (60 + 80) ÷ 2 = 70. Is he right? If not, calculate the combined mean and explain why his method fails.</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — the available source gives only the title and difficulty. This activity is not Povey’s original wording.</p>
            <section class="prediction-box"><div class="eyebrow">Before calculating</div><p>Should a mean representing 30 students influence the result as much as one representing 10?</p></section>
            <div class="p23-presets" aria-label="Classroom presets">
              ${Object.entries(presets).map(([key, preset]) => `<button class="chip-button math2-chip ${activePreset === key ? "active" : ""}" type="button" data-problem-action="p23-preset" data-p23-preset="${key}" aria-pressed="${activePreset === key}">${preset.label}</button>`).join("")}
            </div>
          </article>

          <section class="book-page book-stage math2-stage p23-stage" aria-labelledby="p23-stage-title">
            <div class="math2-stage-card p23-stage-card">
              <div class="math2-stage-heading"><div><span class="eyebrow">Weighted-mean lab</span><h2 id="p23-stage-title">How many students does each mean represent?</h2></div><p>Adjust either classroom. The population bar shows why two class means need not carry equal weight.</p></div>
              <div class="p23-classrooms">${classroomPanel("A")}${classroomPanel("B")}</div>
              ${populationVisual()}
              ${meanComparison()}
            </div>
          </section>

          <aside class="book-page book-coach p23-coach">
            <div class="coach-kicker">Audit the report</div>
            <p class="coach-question">What is the combined mean for these ${totalStudents()} students?</p>
            <div class="p23-fuddle-report"><span>Fuddlethumbs says</span><strong>(${format(state.meanA)} + ${format(state.meanB)}) ÷ 2 = ${format(fuddleMean())}</strong><small>He gives the two classes equal weight.</small></div>
            <form class="p23-answer-form" data-p23-answer-form novalidate>
              <label class="math2-control-label" for="p23-answer">Combined mean</label>
              <div class="p23-answer-row"><input class="estimate-input" id="p23-answer" inputmode="decimal" type="text" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 75" /><button class="primary-button" type="submit">Check</button></div>
            </form>
            <fieldset class="p23-explanations">
              <legend>Which method is valid?</legend>
              <button class="p23-explanation ${state.explanation === "weight" ? "active" : ""}" type="button" data-problem-action="p23-explanation" data-p23-explanation="weight" aria-pressed="${state.explanation === "weight"}">Multiply each mean by its class size, add the totals, then divide by all students.</button>
              <button class="p23-explanation ${state.explanation === "simple" ? "active" : ""}" type="button" data-problem-action="p23-explanation" data-p23-explanation="simple" aria-pressed="${state.explanation === "simple"}">Average the two class means directly because there are two classes.</button>
              <button class="p23-explanation ${state.explanation === "larger" ? "active" : ""}" type="button" data-problem-action="p23-explanation" data-p23-explanation="larger" aria-pressed="${state.explanation === "larger"}">Use only the larger class because it contains most of the students.</button>
            </fieldset>
            ${feedbackMarkup()}
            <div class="button-row p23-help-row"><button class="secondary-button" type="button" data-problem-action="p23-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p23-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("2.3")}
      </main>`;
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p23-shell");
    if (!root) return;

    root.querySelector("#p23-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p23-reset") state = initialState();
        if (action === "p23-preset") {
          const preset = presets[control.dataset.p23Preset];
          if (preset) state = { ...initialState(), ...preset };
          focusSelector = `[data-problem-action="p23-preset"][data-p23-preset="${control.dataset.p23Preset}"]`;
        }
        if (action === "p23-adjust") {
          const key = control.dataset.p23Key;
          const limits = key.endsWith("n") ? [1, 40] : [0, 100];
          state[key] = clamp(state[key] + Number(control.dataset.p23Delta), limits[0], limits[1]);
          clearAttempt();
          focusSelector = `[data-problem-action="p23-adjust"][data-p23-key="${key}"][data-p23-delta="${control.dataset.p23Delta}"]`;
        }
        if (action === "p23-explanation") {
          state.explanation = control.dataset.p23Explanation;
          state.feedback = "";
          focusSelector = `[data-problem-action="p23-explanation"][data-p23-explanation="${state.explanation}"]`;
        }
        if (action === "p23-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          focusSelector = '[data-problem-action="p23-hint"]';
        }
        if (action === "p23-reveal") state.revealed = true;
        rerender();
        if (action === "p23-reveal") focusAfterRender("#p23-solution-title");
        else if (focusSelector) focusAfterRender(focusSelector);
      });
    });

    root.querySelector("[data-p23-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p23-answer")?.value || "";
      const estimate = parseNumber(raw);
      state.estimate = raw.trim();
      state.committed = false;
      state.success = false;
      state.feedbackTone = "is-neutral";

      if (!Number.isFinite(estimate)) {
        state.feedback = "Enter a numerical mean, either as a decimal or a fraction.";
        state.feedbackTone = "is-warn";
      } else {
        state.committed = true;
        const correctNumber = Math.abs(estimate - combinedMean()) <= 1e-6;
        const correctReason = state.explanation === "weight";
        if (correctNumber && correctReason) {
          state.success = true;
          state.feedbackTone = "is-success";
          state.feedback = methodsCoincide()
            ? `Correct. The combined mean is ${format(combinedMean())}. Fuddlethumbs happens to match it because ${coincidenceReason()}, but your weighted method is the dependable one.`
            : `Correct. ${format(totalA() + totalB())} total marks shared by ${totalStudents()} students gives ${format(combinedMean())}.`;
        } else if (correctNumber && methodsCoincide() && state.explanation === "simple") {
          state.feedbackTone = "is-warn";
          state.feedback = `The number ${format(combinedMean())} is right here because ${coincidenceReason()}. The direct average is not a safe general method; select the weighted explanation.`;
        } else if (correctNumber) {
          state.feedback = "Your number is right. Now choose the explanation that respects both class sizes.";
        } else if (correctReason) {
          state.feedback = `Your method is right, but your numerical answer is ${estimate < combinedMean() ? "too low" : "too high"}. Check the two class totals.`;
        } else if (!methodsCoincide() && Math.abs(estimate - fuddleMean()) <= 1e-6) {
          state.feedbackTone = "is-warn";
          state.feedback = `That repeats Fuddlethumbs' ${format(fuddleMean())}. Class A represents ${state.nA} students and Class B represents ${state.nB}, so the means cannot receive equal weight.`;
        } else {
          state.feedback = `That is ${estimate < combinedMean() ? "below" : "above"} the combined mean. Recover each class total first.`;
        }
      }
      rerender();
      focusAfterRender("#p23-answer");
    });
  }

  window.poveyProblemPages["2.3"] = { render, bind };
}());
