(function registerDrBletchleyPinPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "2.9";
  const ANSWER = "5072";
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p29-reset">Reset</button>';
  const clues = Object.freeze([
    Object.freeze({ guess: "1234", exact: 0, misplaced: 1 }),
    Object.freeze({ guess: "5678", exact: 2, misplaced: 0 }),
    Object.freeze({ guess: "9012", exact: 2, misplaced: 0 }),
    Object.freeze({ guess: "3507", exact: 0, misplaced: 3 }),
  ]);
  const hints = Object.freeze([
    "The attempts 5678 and 9012 each put two digits in exactly the right place. Because their digits differ in every column, no position can be correct in both attempts.",
    "Those two reports therefore account for all four PIN positions. The 1234 report says exactly one of 1-at-position-3 and 2-at-position-4 was selected from 9012.",
    "The first three reports leave 9618, 9672, 5018 and 5072. Test those four against 3507; it must contribute three digits, all in the wrong places.",
  ]);
  const expectedCandidateCounts = Object.freeze([5040, 1440, 72, 4, 1]);

  function score(pin, guess) {
    let exact = 0;
    const remainingPin = [];
    const remainingGuess = [];

    for (let index = 0; index < 4; index += 1) {
      if (pin[index] === guess[index]) exact += 1;
      else {
        remainingPin.push(pin[index]);
        remainingGuess.push(guess[index]);
      }
    }

    const available = new Map();
    remainingPin.forEach((digit) => available.set(digit, (available.get(digit) || 0) + 1));
    let misplaced = 0;
    remainingGuess.forEach((digit) => {
      const count = available.get(digit) || 0;
      if (!count) return;
      misplaced += 1;
      available.set(digit, count - 1);
    });
    return { exact, misplaced };
  }

  function allLegalPins() {
    const pins = [];
    for (let first = 0; first <= 9; first += 1) {
      for (let second = 0; second <= 9; second += 1) {
        if (second === first) continue;
        for (let third = 0; third <= 9; third += 1) {
          if (third === first || third === second) continue;
          for (let fourth = 0; fourth <= 9; fourth += 1) {
            if (fourth === first || fourth === second || fourth === third) continue;
            pins.push(`${first}${second}${third}${fourth}`);
          }
        }
      }
    }
    return pins;
  }

  function matchesClue(pin, clue) {
    const result = score(pin, clue.guess);
    return result.exact === clue.exact && result.misplaced === clue.misplaced;
  }

  function buildCandidateStages() {
    const stages = [allLegalPins()];
    clues.forEach((clue) => stages.push(stages.at(-1).filter((pin) => matchesClue(pin, clue))));
    return stages;
  }

  const candidateStages = buildCandidateStages();
  const candidateCountsVerified = candidateStages.every(
    (candidates, index) => candidates.length === expectedCandidateCounts[index],
  );

  const initialState = () => ({
    digits: ["", "", "", ""],
    activeIndex: 0,
    filterStage: 0,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
    committed: false,
  });

  let state = initialState();

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function pinValue() {
    return state.digits.join("");
  }

  function clearResponse() {
    state.feedback = "";
    state.feedbackTone = "neutral";
    state.committed = false;
  }

  function setDigit(index, digit) {
    if (!/^[0-9]$/.test(digit)) return;
    state.digits[index] = digit;
    state.activeIndex = Math.min(3, index + 1);
    clearResponse();
  }

  function deleteDigit(index = state.activeIndex) {
    let target = Math.max(0, Math.min(3, index));
    if (!state.digits[target] && target > 0) target -= 1;
    state.digits[target] = "";
    state.activeIndex = target;
    clearResponse();
  }

  function reconstructionNote() {
    return `
      <p class="math2-reconstruction-note p29-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function clueTable() {
    return `
      <div class="math2-table-wrap p29-clue-wrap">
        <table class="math2-table p29-clue-table">
          <caption>Four intercepted attempts and their exact scanner reports</caption>
          <thead><tr><th scope="col">Attempt</th><th scope="col">Right place</th><th scope="col">Wrong place</th></tr></thead>
          <tbody>
            ${clues.map((clue, index) => `
              <tr class="${state.filterStage > index ? "is-applied" : ""}">
                <th scope="row"><span class="p29-attempt">${clue.guess}</span></th>
                <td><strong>${clue.exact}</strong></td>
                <td><strong>${clue.misplaced}</strong></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function pinSlots() {
    return `
      <form class="p29-pin-form" data-p29-pin-form novalidate>
        <fieldset class="p29-pin-fieldset">
          <legend>Enter Dr Bletchley’s four-digit PIN</legend>
          <div class="p29-pin-slots" role="group" aria-describedby="p29-pin-help">
            ${state.digits.map((digit, index) => `
              <input
                class="p29-pin-slot"
                data-p29-slot="${index}"
                aria-label="PIN digit ${index + 1} of 4"
                autocomplete="off"
                inputmode="numeric"
                maxlength="1"
                pattern="[0-9]"
                type="text"
                value="${escapeHtml(digit)}"
              />`).join("")}
          </div>
          <p id="p29-pin-help" class="p29-pin-help">Leading zero allowed · digits may not repeat</p>
        </fieldset>
        <div class="p29-keypad" role="group" aria-label="PIN keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `<button type="button" data-problem-action="p29-digit" data-p29-digit="${digit}" aria-label="Enter ${digit}">${digit}</button>`).join("")}
          <button class="p29-keypad-command" type="button" data-problem-action="p29-clear">Clear</button>
          <button type="button" data-problem-action="p29-digit" data-p29-digit="0" aria-label="Enter 0">0</button>
          <button class="p29-keypad-command" type="button" data-problem-action="p29-backspace" aria-label="Delete previous digit">⌫</button>
        </div>
        <button class="primary-button p29-submit" type="submit">Test this PIN</button>
      </form>`;
  }

  function filterLab() {
    const count = candidateStages[state.filterStage].length;
    const nextClue = clues[state.filterStage];
    const stageLabel = state.filterStage === 0
      ? "All four-place PINs with distinct digits"
      : `After applying attempt ${clues[state.filterStage - 1].guess}`;
    return `
      <section class="p29-filter-card" aria-labelledby="p29-filter-title" aria-live="polite">
        <div class="p29-filter-heading">
            <div><div class="eyebrow">Candidate filter</div><h2 id="p29-filter-title">${count.toLocaleString("en-GB")} remain</h2></div>
          <span class="p29-stage-badge">${state.filterStage} / 4 clues</span>
        </div>
        <p class="p29-filter-label">${stageLabel}</p>
        <ol class="p29-count-track" aria-label="Candidate count after each applied clue">
          ${candidateStages.map((candidates, index) => `
            <li class="${index === state.filterStage ? "is-current" : ""} ${index < state.filterStage ? "is-complete" : ""}">
              <span>${candidates.length.toLocaleString("en-GB")}</span>
              <small>${index ? `clue ${index}` : "start"}</small>
            </li>`).join("")}
        </ol>
        <div class="p29-filter-actions button-row">
          <button class="secondary-button" type="button" data-problem-action="p29-filter-next" ${nextClue ? "" : "disabled"}>
            ${nextClue ? `Apply ${nextClue.guess}` : "Unique candidate"}
          </button>
          <button class="ghost-button" type="button" data-problem-action="p29-filter-reset" ${state.filterStage ? "" : "disabled"}>Restart filter</button>
        </div>
        <p class="p29-filter-note" aria-live="polite">${state.filterStage === 4 ? "All four exact reports leave one—and only one—legal PIN." : "The count is computed from the exact reports; no candidate identities are shown."}</p>
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${escapeHtml(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `
      <div class="hint-stack p29-hints">
        ${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}
      </div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p29-solution" aria-labelledby="p29-solution-heading">
        <h3 id="p29-solution-heading" tabindex="-1">The unique PIN is 5072</h3>
        <p><strong>5678</strong> and <strong>9012</strong> each have two correct positions. Their digits differ in every column, so those four correct positions are disjoint and fill the PIN.</p>
        <p>The <strong>1234</strong> report says exactly one of 1 at position 3 and 2 at position 4 is present. Combining the choices leaves four candidates:</p>
        <div class="p29-candidate-list" aria-label="The four candidates after the first three reports">
          <span>9618</span><span>9672</span><span>5018</span><strong>5072</strong>
        </div>
        <p>Against <strong>3507</strong>, those candidates contain 0, 1, 2 and 3 of its digits respectively. Only <strong>5072</strong> contains three—and 5, 0 and 7 are all in different positions.</p>
        <div class="math2-equation">5072 → 0 right place + 3 wrong place</div>
      </section>`;
  }

  function stateSnapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      enteredPin: pinValue() || null,
      filterStage: state.filterStage,
      candidateCount: candidateStages[state.filterStage].length,
      candidateCountsVerified,
      candidateCounts: candidateStages.map((stage) => stage.length),
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell math2-shell p29-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread math2-spread p29-spread">
          <article class="book-page p29-problem-page">
            <div class="problem-number">Problem 2.9</div>
            <h1 class="book-title math2-title p29-title">Dr Bletchley’s PIN</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">The PIN has four digits. A leading zero is allowed, but no digit is repeated. Each scanner report is exact, and every digit is counted at most once.</p>
            ${clueTable()}
            <section class="prediction-box p29-rule-note">
              <div class="eyebrow">Two kinds of match</div>
              <p><strong>Right place</strong> means the digit and its position both match. <strong>Wrong place</strong> means the digit occurs elsewhere in the PIN.</p>
            </section>
          </article>

          <section class="book-page book-stage math2-stage p29-stage">
            <div class="math2-stage-card p29-stage-card">
              <div class="math2-stage-heading">
                <div><div class="eyebrow">Cryptanalysis desk</div><h2>Try a candidate</h2></div>
                <p>Type into the four slots or use the keypad. The PIN is checked against all four intercepted reports.</p>
              </div>
              ${pinSlots()}
              ${feedbackMarkup()}
            </div>
            ${filterLab()}
          </section>

          <aside class="book-page book-coach p29-coach">
            <div class="coach-kicker">Reason it out</div>
            <p class="coach-question">Which two reports can account for all four positions between them?</p>
            <p class="p29-coach-copy">The counter can confirm how strongly each exact clue narrows the search, without showing the surviving PINs.</p>
            <div class="button-row p29-help-row">
              <button class="secondary-button" type="button" data-problem-action="p29-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p29-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="math2-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function focusSlot(index) {
    window.requestAnimationFrame(() => {
      const slot = document.querySelector(`[data-p29-slot="${Math.max(0, Math.min(3, index))}"]`);
      slot?.focus();
      slot?.select();
    });
  }

  function renderAndFocus(renderApp, index = state.activeIndex) {
    renderApp();
    focusSlot(index);
  }

  function submitPin(renderApp) {
    const pin = pinValue();
    state.committed = false;
    state.feedbackTone = "warn";

    if (pin.length !== 4) {
      state.feedback = "Enter all four PIN digits first.";
    } else if (new Set(pin).size !== 4) {
      state.feedback = "The intercepted PIN has no repeated digits. Try four distinct digits.";
    } else if (pin === ANSWER) {
      state.committed = true;
      state.feedbackTone = "success";
      state.feedback = "Access granted. 5072 satisfies every scanner report and is the unique legal PIN.";
    } else {
      const failedIndex = clues.findIndex((clue) => !matchesClue(pin, clue));
      const failed = clues[failedIndex];
      const result = score(pin, failed.guess);
      state.committed = true;
      state.feedback = `${pin} fails the ${failed.guess} report: it gives ${result.exact} right-place and ${result.misplaced} wrong-place matches, not ${failed.exact} and ${failed.misplaced}.`;
    }
    renderApp();
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p29-reset") {
          state = initialState();
          renderAndFocus(renderApp, 0);
          return;
        }
        if (action === "p29-digit") {
          setDigit(state.activeIndex, control.dataset.p29Digit || "");
          renderAndFocus(renderApp);
          return;
        }
        if (action === "p29-backspace") {
          deleteDigit();
          renderAndFocus(renderApp);
          return;
        }
        if (action === "p29-clear") {
          state.digits = ["", "", "", ""];
          state.activeIndex = 0;
          clearResponse();
          renderAndFocus(renderApp, 0);
          return;
        }
        if (action === "p29-filter-next") state.filterStage = Math.min(4, state.filterStage + 1);
        if (action === "p29-filter-reset") state.filterStage = 0;
        if (action === "p29-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p29-reveal") state.revealed = true;
        renderApp();
        if (action === "p29-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p29-solution-heading")?.focus());
        } else if (action === "p29-filter-next") {
          const selector = state.filterStage === 4 ? '[data-problem-action="p29-filter-reset"]' : '[data-problem-action="p29-filter-next"]';
          window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
        } else if (action === "p29-filter-reset") {
          window.requestAnimationFrame(() => document.querySelector('[data-problem-action="p29-filter-next"]')?.focus());
        }
      });
    });

    const form = document.querySelector("[data-p29-pin-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      submitPin(renderApp);
    });

    document.querySelectorAll("[data-p29-slot]").forEach((slot) => {
      const index = Number(slot.dataset.p29Slot);
      slot.addEventListener("focus", () => { state.activeIndex = index; });
      slot.addEventListener("click", () => { state.activeIndex = index; });
      slot.addEventListener("input", (event) => {
        const digit = String(event.target.value).replace(/\D/g, "").slice(-1);
        if (digit) setDigit(index, digit);
        else {
          state.digits[index] = "";
          state.activeIndex = index;
          clearResponse();
        }
        renderAndFocus(renderApp, digit ? Math.min(3, index + 1) : index);
      });
      slot.addEventListener("keydown", (event) => {
        if (event.key === "Backspace") {
          event.preventDefault();
          deleteDigit(index);
          renderAndFocus(renderApp);
        } else if (event.key === "Delete") {
          event.preventDefault();
          state.digits[index] = "";
          state.activeIndex = index;
          clearResponse();
          renderAndFocus(renderApp, index);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          state.activeIndex = Math.max(0, index - 1);
          focusSlot(state.activeIndex);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          state.activeIndex = Math.min(3, index + 1);
          focusSlot(state.activeIndex);
        }
      });
      slot.addEventListener("paste", (event) => {
        const pasted = event.clipboardData?.getData("text").replace(/\D/g, "").slice(0, 4) || "";
        if (!pasted) return;
        event.preventDefault();
        state.digits = ["", "", "", ""];
        pasted.split("").forEach((digit, pastedIndex) => { state.digits[pastedIndex] = digit; });
        state.activeIndex = Math.min(3, pasted.length);
        clearResponse();
        renderAndFocus(renderApp);
      });
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
