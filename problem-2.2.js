(function registerFuddlethumbsReportsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const hints = [
    "A mean hides a total. Recover the reported total before changing the copied reading.",
    "For n readings with reported mean m, the reported total is n × m.",
    "Replace the old reading with the corrected one, then divide the new total by n.",
  ];

  const presets = {
    original: { label: "Original report", n: 5, mean: 14, oldValue: 18, newValue: 13 },
    larger: { label: "Larger group", n: 10, mean: 32, oldValue: 45, newValue: 35 },
    upward: { label: "Upward correction", n: 4, mean: 21, oldValue: 13, newValue: 25 },
  };

  const initialState = () => ({
    n: 5,
    mean: 14,
    oldValue: 18,
    newValue: 13,
    stage: 0,
    estimate: "",
    explanation: "",
    committed: false,
    feedback: "",
    feedbackTone: "is-neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value.toFixed(digits));
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }

  function parseNumber(value) {
    const trimmed = String(value).trim().replaceAll(",", "");
    const fraction = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      return denominator === 0 ? NaN : Number(fraction[1]) / denominator;
    }
    return Number(trimmed);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function reportedTotal() {
    return state.n * state.mean;
  }

  function correction() {
    return state.newValue - state.oldValue;
  }

  function correctedTotal() {
    return reportedTotal() + correction();
  }

  function correctedMean() {
    return correctedTotal() / state.n;
  }

  function fuddlethumbsMean() {
    return state.mean + correction();
  }

  function presetKey() {
    return Object.entries(presets).find(([, preset]) =>
      preset.n === state.n
      && preset.mean === state.mean
      && preset.oldValue === state.oldValue
      && preset.newValue === state.newValue)?.[0] || "";
  }

  function stateSnapshot() {
    return JSON.stringify({
      problem: "2.2",
      contentStatus: "independently reconstructed activity; not source wording",
      readings: state.n,
      reportedMean: state.mean,
      copiedValue: state.oldValue,
      correctedValue: state.newValue,
      reportedTotal: reportedTotal(),
      correction: correction(),
      correctedMean: correctedMean(),
      estimate: state.estimate || null,
      explanation: state.explanation || null,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function stepper(parameter, label, value, minimum, maximum) {
    return `
      <div class="p22-stepper">
        <span>${label}</span>
        <div>
          <button type="button" data-p22-action="adjust" data-p22-param="${parameter}" data-p22-delta="-1" aria-label="Decrease ${label}" ${value <= minimum ? "disabled" : ""}>−</button>
          <strong>${format(value)}</strong>
          <button type="button" data-p22-action="adjust" data-p22-param="${parameter}" data-p22-delta="1" aria-label="Increase ${label}" ${value >= maximum ? "disabled" : ""}>+</button>
        </div>
      </div>`;
  }

  function totalBlocks() {
    const perBlockChange = correction() / state.n;
    return Array.from({ length: state.n }, (_, index) => `
      <div class="p22-mean-block" style="--p22-delay:${index * 35}ms">
        <span>${format(state.mean)}</span>
        ${state.stage >= 2 ? `<small>${perBlockChange >= 0 ? "+" : ""}${format(perBlockChange)}</small>` : ""}
        ${state.stage >= 2 ? `<strong>${format(correctedMean())}</strong>` : ""}
      </div>`).join("");
  }

  function ledgerMarkup() {
    return `
      <div class="p22-ledger" data-p22-stage="${state.stage}">
        <div class="p22-ledger-line is-reported">
          <span>Reported total</span>
          <strong>${state.n} × ${format(state.mean)} = ${format(reportedTotal())}</strong>
        </div>
        <div class="p22-ledger-line ${state.stage >= 1 ? "is-active" : ""}">
          <span>Replace the copied reading</span>
          <strong><s>${format(state.oldValue)}</s> → ${format(state.newValue)} <em>${correction() >= 0 ? "+" : ""}${format(correction())}</em></strong>
        </div>
        <div class="p22-ledger-line ${state.stage >= 1 ? "is-active" : ""}">
          <span>Corrected total</span>
          <strong>${format(reportedTotal())} ${correction() >= 0 ? "+" : "−"} ${format(Math.abs(correction()))} = ${format(correctedTotal())}</strong>
        </div>
      </div>
      <div class="p22-distribution ${state.stage >= 2 ? "is-active" : ""}" aria-label="The correction distributed across ${state.n} readings">
        ${totalBlocks()}
      </div>`;
  }

  function stageControls() {
    const labels = ["1. Recover total", "2. Correct total", "3. Redistribute"];
    return `<div class="p22-stages" aria-label="Calculation stages">${labels.map((label, index) => `
      <button class="chip-button math2-chip ${state.stage === index ? "active" : ""}" type="button" data-p22-action="stage" data-p22-stage="${index}" aria-pressed="${state.stage === index}">${label}</button>`).join("")}</div>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintMarkup() {
    return hints.slice(0, state.hintsUsed).map((hint, index) => `
      <div class="hint-card"><strong>Hint ${index + 1}</strong><p>${hint}</p></div>`).join("");
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p22-solution">
        <h3>Change the total, not the mean</h3>
        <p>The reported mean represents a total of ${state.n} × ${format(state.mean)} = ${format(reportedTotal())}. Replacing ${format(state.oldValue)} with ${format(state.newValue)} changes that total by ${format(correction())}, giving ${format(correctedTotal())}.</p>
        <div class="math2-equation">m′ = m + (x<sub>new</sub> − x<sub>old</sub>)/n = ${format(state.mean)} + (${format(correction())})/${state.n} = ${format(correctedMean())}</div>
        <p>Professor Fuddlethumbs changed the mean by the whole correction. That correction belongs to the total, so its effect on the mean must be shared across all ${state.n} readings.</p>
      </section>`;
  }

  function render() {
    const activePreset = presetKey();
    const debug = new URLSearchParams(window.location.search).get("debug") === "1";
    const resetMarkup = '<button class="ghost-button" type="button" data-p22-action="reset">Reset</button>';
    return `
      <main class="book-shell math2-shell p22-shell">
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Reconstructed mathematics</span></div>
          <div class="book-progress">${problemProgress("2.2")}</div>
          ${problemHeaderActions("2.2", resetMarkup)}
        </header>

        <div class="book-spread math2-spread p22-spread">
          <article class="book-page">
            <div class="problem-number">Problem 2.2</div>
            <h1 class="book-title math2-title">Professor Fuddlethumbs' reports</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="problem-copy">Professor Fuddlethumbs reports that the mean of five measurements is 14. He then discovers that one measurement was copied as 18 when it should have been 13. “The reading fell by 5,” he says, “so the corrected mean is 9.” What is the corrected mean, and what mistake has he made?</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem's title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book's wording or solution.</p>
            <section class="prediction-box">
              <div class="eyebrow">Before calculating</div>
              <p>Should changing one reading by 5 change the mean by 5—or only by some fraction of 5?</p>
            </section>
            <div class="p22-presets" aria-label="Report presets">${Object.entries(presets).map(([key, preset]) => `
              <button class="chip-button math2-chip ${activePreset === key ? "active" : ""}" type="button" data-p22-action="preset" data-p22-preset="${key}" aria-pressed="${activePreset === key}">${preset.label}</button>`).join("")}</div>
          </article>

          <section class="book-page book-stage math2-stage p22-stage">
            <div class="math2-stage-card">
              <div class="math2-stage-heading">
                <div><div class="eyebrow">Mean repair lab</div><h2>Follow the hidden total</h2></div>
                <p>The tiles begin as equal shares of the reported total. The correction is applied to the total, then redistributed.</p>
              </div>
              ${stageControls()}
              ${ledgerMarkup()}
              <div class="p22-config" aria-label="Change the report">
                ${stepper("n", "Readings", state.n, 2, 12)}
                ${stepper("mean", "Reported mean", state.mean, 0, 100)}
                ${stepper("oldValue", "Copied value", state.oldValue, 0, 100)}
                ${stepper("newValue", "Correct value", state.newValue, 0, 100)}
              </div>
            </div>
          </section>

          <aside class="book-page book-coach p22-coach">
            <div class="coach-kicker">Your turn</div>
            <p class="coach-question">Repair the report without repeating the professor's mistake.</p>
            <div class="p22-comparison">
              <span>Fuddlethumbs says</span><strong>${format(fuddlethumbsMean())}</strong>
              <small>He changes the mean by the full correction.</small>
            </div>
            <form data-p22-answer-form>
              <label class="math2-control-label" for="p22-answer">Corrected mean</label>
              <div class="p22-answer-row">
                <input id="p22-answer" class="estimate-input" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="13 or 65/5" />
                <button class="primary-button" type="submit">Check</button>
              </div>
            </form>
            <fieldset class="p22-explanation">
              <legend>What went wrong?</legend>
              ${[
                ["share", `The ${format(Math.abs(correction()))}-point correction must be divided across ${state.n} readings.`],
                ["subtract", "He should have subtracted the old reading twice."],
                ["round", "He rounded the reported mean too early."],
              ].map(([value, label]) => `<button class="p22-explanation-option ${state.explanation === value ? "active" : ""}" type="button" data-p22-action="explanation" data-p22-explanation="${value}" aria-pressed="${state.explanation === value}">${label}</button>`).join("")}
            </fieldset>
            ${feedbackMarkup()}
            <div class="button-row">
              <button class="secondary-button" type="button" data-p22-action="hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-p22-action="reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintMarkup()}
            ${solutionMarkup()}
            ${debug ? `<pre class="state-surface math2-debug">${stateSnapshot()}</pre>` : ""}
          </aside>
        </div>
        ${problemNav("2.2")}
      </main>`;
  }

  function bind({ render: rerender }) {
    document.querySelector("#p22-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
    });

    document.querySelectorAll("[data-p22-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.p22Action;
        if (action === "reset") state = initialState();
        if (action === "preset") {
          const preset = presets[control.dataset.p22Preset];
          state = { ...initialState(), ...preset };
        }
        if (action === "stage") state.stage = Number(control.dataset.p22Stage);
        if (action === "explanation") {
          state.explanation = control.dataset.p22Explanation;
          state.feedback = "";
        }
        if (action === "hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          state.stage = Math.max(state.stage, Math.min(2, state.hintsUsed - 1));
        }
        if (action === "reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        if (action === "adjust") {
          const parameter = control.dataset.p22Param;
          const limits = { n: [2, 12], mean: [0, 100], oldValue: [0, 100], newValue: [0, 100] };
          const [minimum, maximum] = limits[parameter];
          state[parameter] = clamp(state[parameter] + Number(control.dataset.p22Delta), minimum, maximum);
          state.estimate = "";
          state.committed = false;
          state.feedback = "";
          state.revealed = false;
          state.stage = 0;
        }
        rerender();
      });
    });

    document.querySelector("[data-p22-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.currentTarget.querySelector("input");
      state.estimate = input?.value.trim() || "";
      const estimate = parseNumber(state.estimate);
      if (!state.estimate || !Number.isFinite(estimate)) {
        state.feedback = "Enter a number or a fraction such as 65/5.";
        state.feedbackTone = "is-warn";
      } else {
        state.committed = true;
        const correctNumber = Math.abs(estimate - correctedMean()) <= 1e-6;
        const correctReason = state.explanation === "share";
        if (correctNumber && correctReason) {
          state.feedback = `Exactly. The corrected mean is ${format(correctedMean())}, because the total correction is shared across ${state.n} readings.`;
          state.feedbackTone = "is-success";
          state.stage = 2;
        } else if (correctNumber) {
          state.feedback = "Your corrected mean is right. Now choose the explanation that says what the professor did to the hidden total.";
          state.feedbackTone = "is-neutral";
        } else if (correctReason) {
          state.feedback = estimate > correctedMean() ? "Your reasoning is right, but the numerical answer is too high." : "Your reasoning is right, but the numerical answer is too low.";
          state.feedbackTone = "is-neutral";
        } else if (Math.abs(estimate - fuddlethumbsMean()) <= 1e-6) {
          state.feedback = "That repeats Fuddlethumbs' calculation: the full correction changes the total, not each reading's share.";
          state.feedbackTone = "is-warn";
        } else {
          state.feedback = estimate > correctedMean() ? "That is above the corrected mean. Recover the total first." : "That is below the corrected mean. Recover the total first.";
          state.feedbackTone = "is-neutral";
        }
      }
      rerender();
    });
  }

  window.poveyProblemPages["2.2"] = { render, bind };
})();
