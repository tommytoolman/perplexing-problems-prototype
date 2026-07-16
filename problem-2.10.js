(function registerMrSmithCoinsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "2.10";
  const COINS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
  const PLACEMENT_LABELS = Object.freeze({
    "-1": Object.freeze({ short: "L", name: "Left" }),
    0: Object.freeze({ short: "—", name: "Off" }),
    1: Object.freeze({ short: "R", name: "Right" }),
  });
  const RESULT_LABELS = Object.freeze({
    "-1": "Left heavier",
    0: "Balance",
    1: "Right heavier",
  });
  const validPreset = Object.freeze([
    Object.freeze([0, 0, 0, -1, 1, -1, -1, 1, 1]),
    Object.freeze([0, -1, -1, 1, -1, 1, 0, 0, 1]),
    Object.freeze([-1, 1, 0, 1, 0, -1, 1, 0, -1]),
  ]);
  const hints = Object.freeze([
    "Each weighing has three possible results. Record a coin’s three placements as a ternary word made from Left, Off and Right.",
    "If a coin is heavy, the result word follows its placement word. If it is light, every Left/Right result reverses. Heavy and light therefore produce opposite codes.",
    "Every coin needs a nonzero code, and no two coin codes may be equal or exact opposites. Also keep equal numbers of coins on the two pans in every row.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p210-reset">Reset</button>';

  function blankSchedule() {
    return Array.from({ length: 3 }, () => Array(9).fill(0));
  }

  function cloneSchedule(schedule) {
    return schedule.map((row) => [...row]);
  }

  const initialState = () => ({
    schedule: blankSchedule(),
    activeCell: null,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
    mystery: null,
    guessCoin: "",
    guessKind: "",
    mysteryFeedback: "",
    mysteryTone: "neutral",
  });

  let state = initialState();

  function coinCode(schedule, coinIndex) {
    return schedule.map((row) => row[coinIndex]);
  }

  function signature(code, kind) {
    const factor = kind === "heavy" ? 1 : -1;
    return code.map((value) => value * factor);
  }

  function signatureKey(values) {
    return values.join(",");
  }

  function vectorsEqual(first, second, factor = 1) {
    return first.every((value, index) => value === factor * second[index]);
  }

  function scheduleDiagnostics(schedule = state.schedule) {
    const rowBalances = schedule.map((row, index) => {
      const left = row.filter((value) => value === -1).length;
      const right = row.filter((value) => value === 1).length;
      return { weighing: index + 1, left, right, balanced: left === right };
    });
    const codes = COINS.map((_, coinIndex) => coinCode(schedule, coinIndex));
    const nonzeroCoins = codes
      .map((code, coinIndex) => ({ code, coinIndex }))
      .filter(({ code }) => code.some((value) => value !== 0));
    const collisions = [];

    for (let first = 0; first < codes.length; first += 1) {
      for (let second = first + 1; second < codes.length; second += 1) {
        if (vectorsEqual(codes[first], codes[second])) {
          collisions.push({ first, second, relation: "equal" });
        } else if (vectorsEqual(codes[first], codes[second], -1)) {
          collisions.push({ first, second, relation: "opposite" });
        }
      }
    }

    const signatureMap = new Map();
    COINS.forEach((coin, coinIndex) => {
      ["heavy", "light"].forEach((kind) => {
        const values = signature(codes[coinIndex], kind);
        const key = signatureKey(values);
        const states = signatureMap.get(key) || [];
        states.push(`${coin} ${kind}`);
        signatureMap.set(key, states);
      });
    });
    const signatureCollisions = [...signatureMap.entries()]
      .filter(([, cases]) => cases.length > 1)
      .map(([key, cases]) => ({ key, cases }));
    const valid = rowBalances.every((row) => row.balanced)
      && nonzeroCoins.length === COINS.length
      && collisions.length === 0
      && signatureMap.size === 18
      && signatureCollisions.length === 0;

    return {
      rowBalances,
      codes,
      nonzeroCoins,
      collisions,
      signatureCount: signatureMap.size,
      signatureCollisions,
      valid,
    };
  }

  function placement(value) {
    return PLACEMENT_LABELS[String(value)];
  }

  function codeText(code) {
    return code.map((value) => placement(value).short).join(" ");
  }

  function resultText(result) {
    return result.map((value) => RESULT_LABELS[String(value)]).join(" · ");
  }

  function clearValidation() {
    state.feedback = "";
    state.feedbackTone = "neutral";
    state.mystery = null;
    state.guessCoin = "";
    state.guessKind = "";
    state.mysteryFeedback = "";
    state.mysteryTone = "neutral";
  }

  function reconstructionNote() {
    return `
      <p class="math2-reconstruction-note p210-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function scheduleGrid() {
    return `
      <div class="p210-schedule-scroll" tabindex="0" role="region" aria-label="Three by nine weighing schedule; scroll horizontally on narrow screens">
        <table class="p210-schedule-table">
          <caption>Activate a cell to cycle Off → Left → Right. With focus on a cell, L, O and R also set it directly.</caption>
          <thead><tr><th scope="col">Weighing</th>${COINS.map((coin) => `<th scope="col">${coin}</th>`).join("")}</tr></thead>
          <tbody>
            ${state.schedule.map((row, rowIndex) => `
              <tr>
                <th scope="row"><span>W${rowIndex + 1}</span></th>
                ${row.map((value, coinIndex) => {
                  const current = placement(value);
                  return `
                    <td>
                      <button
                        class="p210-placement is-${current.name.toLowerCase()}"
                        type="button"
                        data-problem-action="p210-cycle"
                        data-p210-row="${rowIndex}"
                        data-p210-coin="${coinIndex}"
                        aria-label="Coin ${COINS[coinIndex]}, weighing ${rowIndex + 1}: ${current.name}. Activate to change."
                        title="${current.name}; press L, O or R to set directly"
                      >${current.short}</button>
                    </td>`;
                }).join("")}
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function panSummaries(diagnostics) {
    return `
      <div class="p210-pan-summaries" aria-label="Coins placed on each pan">
        ${state.schedule.map((row, rowIndex) => {
          const onSide = (side) => COINS.filter((_, coinIndex) => row[coinIndex] === side).join(" ") || "none";
          const balanced = diagnostics.rowBalances[rowIndex].balanced;
          return `
            <div class="p210-pan-summary ${balanced ? "is-balanced" : ""}">
              <strong>W${rowIndex + 1}</strong>
              <span>L: ${onSide(-1)}</span>
              <span>R: ${onSide(1)}</span>
            </div>`;
        }).join("")}
      </div>`;
  }

  function validatorFeedback(diagnostics) {
    if (diagnostics.valid) {
      return {
        tone: "success",
        text: "Valid fixed schedule: every weighing starts balanced, and all 18 possible coin-and-weight states produce different three-result signatures.",
      };
    }
    const unbalanced = diagnostics.rowBalances.find((row) => !row.balanced);
    if (unbalanced) {
      return {
        tone: "warn",
        text: `Weighing ${unbalanced.weighing} has ${unbalanced.left} coin${unbalanced.left === 1 ? "" : "s"} left and ${unbalanced.right} right. Equal genuine weights must balance before the counterfeit changes the result.`,
      };
    }
    if (diagnostics.nonzeroCoins.length < COINS.length) {
      const offCoins = COINS.filter((_, coinIndex) => diagnostics.codes[coinIndex].every((value) => value === 0));
      return {
        tone: "warn",
        text: `Coin${offCoins.length === 1 ? "" : "s"} ${offCoins.join(", ")} never enter${offCoins.length === 1 ? "s" : ""} a weighing, so light and heavy would both look like three balances.`,
      };
    }
    if (diagnostics.collisions.length) {
      const collision = diagnostics.collisions[0];
      const relationship = collision.relation === "equal"
        ? "the same code, so their heavy cases collide"
        : "opposite codes, so one coin’s heavy case collides with the other’s light case";
      return {
        tone: "warn",
        text: `Coins ${COINS[collision.first]} and ${COINS[collision.second]} have ${relationship}.`,
      };
    }
    return {
      tone: "warn",
      text: `This scheme distinguishes only ${diagnostics.signatureCount} of the 18 possible states. Change at least one placement.`,
    };
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`;
  }

  function validatorCard(diagnostics) {
    const balancedRows = diagnostics.rowBalances.filter((row) => row.balanced).length;
    return `
      <section class="p210-validator" aria-labelledby="p210-validator-title">
        <div class="p210-validator-heading">
          <div><div class="eyebrow">Exact validator</div><h2 id="p210-validator-title">${diagnostics.valid ? "A complete code" : "Test the code"}</h2></div>
          <span class="p210-validity ${diagnostics.valid ? "is-valid" : ""}">${diagnostics.valid ? "18 / 18" : `${diagnostics.signatureCount} / 18`}</span>
        </div>
        <div class="math2-metrics p210-metrics">
          <div class="math2-metric"><span>Balanced rows</span><strong>${balancedRows}/3</strong></div>
          <div class="math2-metric"><span>Nonzero codes</span><strong>${diagnostics.nonzeroCoins.length}/9</strong></div>
          <div class="math2-metric"><span>Distinct cases</span><strong>${diagnostics.signatureCount}/18</strong></div>
        </div>
        <div class="button-row p210-validator-actions">
          <button class="primary-button" type="button" data-problem-action="p210-check">Check my schedule</button>
          <button class="ghost-button" type="button" data-problem-action="p210-clear">Clear grid</button>
        </div>
        ${feedbackMarkup()}
      </section>`;
  }

  function resultCards(result) {
    return `
      <div class="p210-result-cards" aria-label="Mystery weighing results">
        ${result.map((value, index) => `
          <div class="p210-result is-result-${value === -1 ? "left" : value === 1 ? "right" : "balance"}">
            <span>W${index + 1}</span><strong>${RESULT_LABELS[String(value)]}</strong>
          </div>`).join("")}
      </div>`;
  }

  function mysteryFeedbackMarkup() {
    if (!state.mysteryFeedback) return "";
    return `<div class="math2-feedback is-${state.mysteryTone}" role="status">${state.mysteryFeedback}</div>`;
  }

  function mysteryCard(diagnostics) {
    if (!state.mystery) {
      return `
        <section class="p210-mystery" aria-labelledby="p210-mystery-title" aria-live="polite">
          <div class="p210-mystery-heading"><div><div class="eyebrow">Decoder</div><h2 id="p210-mystery-title">Run a mystery coin</h2></div></div>
          <p>The app will hide one of the 18 possible counterfeit states and perform your fixed schedule.</p>
          <button class="secondary-button" type="button" data-problem-action="p210-run" ${diagnostics.valid ? "" : "disabled"}>Hide a counterfeit and run</button>
          <p class="p210-lock-note">${diagnostics.valid ? "Your schedule is ready." : "A valid 18/18 schedule unlocks the decoder."}</p>
        </section>`;
    }
    return `
      <section class="p210-mystery" aria-labelledby="p210-mystery-title" aria-live="polite">
        <div class="p210-mystery-heading">
          <div><div class="eyebrow">Decoder</div><h2 id="p210-mystery-title" tabindex="-1">Read the three results</h2></div>
          <button class="ghost-button" type="button" data-problem-action="p210-run">New mystery</button>
        </div>
        ${resultCards(state.mystery.result)}
        <form class="p210-diagnosis-form" data-p210-diagnosis-form novalidate>
          <label>Coin<select id="p210-guess-coin" aria-label="Counterfeit coin"><option value="">Choose…</option>${COINS.map((coin) => `<option value="${coin}" ${state.guessCoin === coin ? "selected" : ""}>${coin}</option>`).join("")}</select></label>
          <label>Difference<select id="p210-guess-kind" aria-label="Whether the counterfeit is heavy or light"><option value="">Choose…</option><option value="heavy" ${state.guessKind === "heavy" ? "selected" : ""}>Heavy · 11 g</option><option value="light" ${state.guessKind === "light" ? "selected" : ""}>Light · 9 g</option></select></label>
          <button class="primary-button" type="submit">Submit diagnosis</button>
        </form>
        ${mysteryFeedbackMarkup()}
      </section>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p210-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function presetCodeList() {
    return `
      <div class="p210-code-list" aria-label="One valid code for coins A through I">
        ${COINS.map((coin, coinIndex) => `<div><strong>${coin}</strong><span>${codeText(coinCode(validPreset, coinIndex))}</span></div>`).join("")}
      </div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p210-solution" aria-labelledby="p210-solution-heading">
        <h3 id="p210-solution-heading" tabindex="-1">Encode the weighings</h3>
        <p>Write Left as −1, Off as 0 and Right as +1. A heavy coin produces its placement code; a light coin produces the negative code.</p>
        <p>Thus every column must be nonzero, and no pair of columns may be equal or opposites. Equal numbers on both pans keep every weighing unbiased.</p>
        ${presetCodeList()}
        <button class="secondary-button p210-load-preset" type="button" data-problem-action="p210-load-preset">Load this valid preset</button>
        <p>For example, the result Left heavier · Balance · Right heavier is coin G’s code, so G is heavy. Reversing left and right means G is light.</p>
      </section>`;
  }

  function stateSnapshot(diagnostics) {
    return JSON.stringify({
      problem: PROBLEM,
      schedule: diagnostics.codes.reduce((record, code, coinIndex) => {
        record[COINS[coinIndex]] = codeText(code);
        return record;
      }, {}),
      balancedRows: diagnostics.rowBalances.map((row) => row.balanced),
      nonzeroCodes: diagnostics.nonzeroCoins.length,
      distinctSignatures: diagnostics.signatureCount,
      collisionPairs: diagnostics.collisions.map((collision) => `${COINS[collision.first]}/${COINS[collision.second]} ${collision.relation}`),
      valid: diagnostics.valid,
      mysterySecret: state.mystery ? `${COINS[state.mystery.coinIndex]} ${state.mystery.kind}` : null,
      mysteryResult: state.mystery ? resultText(state.mystery.result) : null,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const diagnostics = scheduleDiagnostics();
    return `
      <main class="book-shell math2-shell p210-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread math2-spread p210-spread">
          <article class="book-page p210-problem-page">
            <div class="problem-number">Problem 2.10</div>
            <h1 class="book-title math2-title p210-title">Mr Smith’s coins</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">Nine outwardly identical coins are labelled A–I. Genuine coins weigh exactly 10 g. Exactly one is counterfeit: either 9 g or 11 g.</p>
            <p class="problem-copy">Design <strong>three weighings in advance</strong> on a balance scale. The three results must always identify both the coin and whether it is light or heavy.</p>
            <section class="prediction-box p210-rules">
              <div class="eyebrow">The scale reports</div>
              <div class="p210-result-legend"><span><i>L</i> Left heavier</span><span><i>—</i> Balance</span><span><i>R</i> Right heavier</span></div>
              <p>Later weighings may not depend on earlier results. Every row of the schedule is fixed before weighing begins.</p>
            </section>
          </article>

          <section class="book-page book-stage math2-stage p210-stage">
            <div class="math2-stage-card p210-stage-card">
              <div class="math2-stage-heading">
                <div><div class="eyebrow">Schedule designer</div><h2>Place every coin</h2></div>
                <p>Activate each cell to choose Left, Off or Right. On a keyboard, focus a cell and press L, O or R.</p>
              </div>
              ${scheduleGrid()}
              ${panSummaries(diagnostics)}
            </div>
            ${validatorCard(diagnostics)}
            ${mysteryCard(diagnostics)}
          </section>

          <aside class="book-page book-coach p210-coach">
            <div class="coach-kicker">Code the outcomes</div>
            <p class="coach-question">How can three balance readings encode eighteen possible counterfeit states?</p>
            <p class="p210-coach-copy">There are nine possible coins and two possible weight errors. A valid schedule must separate all eighteen.</p>
            <div class="button-row p210-help-row">
              <button class="secondary-button" type="button" data-problem-action="p210-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p210-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="math2-debug">${debugPanel("Development state", stateSnapshot(diagnostics))}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function focusCell(rowIndex, coinIndex) {
    window.requestAnimationFrame(() => {
      document.querySelector(`[data-p210-row="${rowIndex}"][data-p210-coin="${coinIndex}"]`)?.focus();
    });
  }

  function renderAndFocusCell(renderApp, rowIndex, coinIndex) {
    renderApp();
    focusCell(rowIndex, coinIndex);
  }

  function setCell(rowIndex, coinIndex, value) {
    state.schedule[rowIndex][coinIndex] = value;
    state.activeCell = { rowIndex, coinIndex };
    clearValidation();
  }

  function cycleCell(rowIndex, coinIndex) {
    const cycle = [0, -1, 1];
    const currentIndex = cycle.indexOf(state.schedule[rowIndex][coinIndex]);
    setCell(rowIndex, coinIndex, cycle[(currentIndex + 1) % cycle.length]);
  }

  function runMystery() {
    const caseIndex = Math.floor(Math.random() * 18);
    const coinIndex = caseIndex % 9;
    const kind = caseIndex < 9 ? "heavy" : "light";
    state.mystery = {
      coinIndex,
      kind,
      result: signature(coinCode(state.schedule, coinIndex), kind),
    };
    state.guessCoin = "";
    state.guessKind = "";
    state.mysteryFeedback = "";
    state.mysteryTone = "neutral";
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p210-reset") {
          state = initialState();
          renderApp();
          return;
        }
        if (action === "p210-cycle") {
          const rowIndex = Number(control.dataset.p210Row);
          const coinIndex = Number(control.dataset.p210Coin);
          cycleCell(rowIndex, coinIndex);
          renderAndFocusCell(renderApp, rowIndex, coinIndex);
          return;
        }
        if (action === "p210-clear") {
          state.schedule = blankSchedule();
          state.activeCell = null;
          clearValidation();
        }
        if (action === "p210-check") {
          const result = validatorFeedback(scheduleDiagnostics());
          state.feedbackTone = result.tone;
          state.feedback = result.text;
        }
        if (action === "p210-run") runMystery();
        if (action === "p210-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p210-reveal") state.revealed = true;
        if (action === "p210-load-preset") {
          state.schedule = cloneSchedule(validPreset);
          clearValidation();
          state.feedbackTone = "success";
          state.feedback = "Valid preset loaded: three balanced rows and 18 distinct counterfeit signatures.";
        }
        renderApp();
        if (action === "p210-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p210-solution-heading")?.focus());
        } else if (action === "p210-run") {
          window.requestAnimationFrame(() => document.querySelector("#p210-mystery-title")?.focus());
        }
      });
    });

    document.querySelectorAll("[data-problem-action='p210-cycle']").forEach((control) => {
      control.addEventListener("keydown", (event) => {
        const directValues = { l: -1, o: 0, r: 1, "0": 0 };
        const key = event.key.toLowerCase();
        if (!Object.hasOwn(directValues, key)) return;
        event.preventDefault();
        const rowIndex = Number(control.dataset.p210Row);
        const coinIndex = Number(control.dataset.p210Coin);
        setCell(rowIndex, coinIndex, directValues[key]);
        renderAndFocusCell(renderApp, rowIndex, coinIndex);
      });
    });

    const diagnosisForm = document.querySelector("[data-p210-diagnosis-form]");
    const coinSelect = document.querySelector("#p210-guess-coin");
    const kindSelect = document.querySelector("#p210-guess-kind");
    coinSelect?.addEventListener("change", (event) => { state.guessCoin = event.target.value; });
    kindSelect?.addEventListener("change", (event) => { state.guessKind = event.target.value; });
    diagnosisForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.guessCoin = coinSelect?.value || "";
      state.guessKind = kindSelect?.value || "";
      state.mysteryTone = "warn";
      if (!state.guessCoin || !state.guessKind) {
        state.mysteryFeedback = "Choose both a coin and whether it is heavy or light.";
      } else {
        const guessedCoinIndex = COINS.indexOf(state.guessCoin);
        const correct = guessedCoinIndex === state.mystery?.coinIndex && state.guessKind === state.mystery?.kind;
        if (correct) {
          state.mysteryTone = "success";
          state.mysteryFeedback = `Decoded: coin ${state.guessCoin} is ${state.guessKind}. This schedule identifies the case uniquely.`;
        } else {
          const predicted = signature(coinCode(state.schedule, guessedCoinIndex), state.guessKind);
          state.mysteryFeedback = `${state.guessCoin} ${state.guessKind} would predict ${resultText(predicted)}. Compare that code with the observed results.`;
        }
      }
      renderApp();
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
