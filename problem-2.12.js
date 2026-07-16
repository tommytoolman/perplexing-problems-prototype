(function registerCardGamePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "2.12";
  const INITIAL_SEED = 21232026;
  const SIMULATION_ROUNDS = 600;
  const hints = Object.freeze([
    "With r red and b black cards remaining, the next card is red with probability r/(r+b). The probability is not fixed at 3/5.",
    "Work backwards. If V(r,b) is the best final score, compare stopping at 1−r+b with [rV(r−1,b)+bV(r,b−1)]/(r+b).",
    "Stop strictly only when no red cards remain. At (1,2), stopping and continuing are tied at 2. Continue at every other nonterminal state containing a red card.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p212-reset">Reset</button>';

  function gcd(first, second) {
    let a = Math.abs(first);
    let b = Math.abs(second);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function fraction(numerator, denominator = 1) {
    if (denominator < 0) return fraction(-numerator, -denominator);
    const divisor = gcd(numerator, denominator);
    return { numerator: numerator / divisor, denominator: denominator / divisor };
  }

  function add(first, second) {
    return fraction(
      first.numerator * second.denominator + second.numerator * first.denominator,
      first.denominator * second.denominator,
    );
  }

  function scale(value, numerator, denominator = 1) {
    return fraction(value.numerator * numerator, value.denominator * denominator);
  }

  function compare(first, second) {
    return first.numerator * second.denominator - second.numerator * first.denominator;
  }

  function fractionText(value) {
    return value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
  }

  function fractionDecimal(value) {
    return value.numerator / value.denominator;
  }

  function stateKey(red, black) {
    return `${red},${black}`;
  }

  function currentScore(red, black) {
    return 1 - red + black;
  }

  function reachablePolicyStates() {
    const states = [];
    for (let cards = 5; cards >= 1; cards -= 1) {
      for (let red = 0; red <= 3; red += 1) {
        const black = cards - red;
        if (black >= 0 && black <= 2) states.push(Object.freeze({ red, black }));
      }
    }
    return Object.freeze(states);
  }

  const policyStates = reachablePolicyStates();

  function continuationValue(red, black, valueAt) {
    const total = red + black;
    let value = fraction(0);
    if (red) value = add(value, scale(valueAt(red - 1, black), red, total));
    if (black) value = add(value, scale(valueAt(red, black - 1), black, total));
    return value;
  }

  function computeOptimal(red, black, memo) {
    const key = stateKey(red, black);
    if (memo.has(key)) return memo.get(key);
    if (red + black === 0) {
      const terminal = { value: fraction(currentScore(red, black)), stop: fraction(currentScore(red, black)), continuation: null, action: "terminal" };
      memo.set(key, terminal);
      return terminal;
    }
    const stop = fraction(currentScore(red, black));
    const continuation = continuationValue(red, black, (nextRed, nextBlack) => computeOptimal(nextRed, nextBlack, memo).value);
    const comparison = compare(continuation, stop);
    const result = {
      value: comparison >= 0 ? continuation : stop,
      stop,
      continuation,
      action: comparison > 0 ? "continue" : comparison < 0 ? "stop" : "tie",
    };
    memo.set(key, result);
    return result;
  }

  const optimalMemo = new Map();

  function optimalInfo(red, black) {
    return computeOptimal(red, black, optimalMemo);
  }

  function blankPolicy() {
    return policyStates.reduce((policy, position) => {
      policy[stateKey(position.red, position.black)] = "";
      return policy;
    }, {});
  }

  function policyComplete(policy) {
    return policyStates.every(({ red, black }) => ["stop", "continue"].includes(policy[stateKey(red, black)]));
  }

  function evaluatePolicy(policy) {
    if (!policyComplete(policy)) return null;
    const memo = new Map();
    const valueAt = (red, black) => {
      const key = stateKey(red, black);
      if (memo.has(key)) return memo.get(key);
      if (red + black === 0) {
        const terminal = fraction(currentScore(red, black));
        memo.set(key, terminal);
        return terminal;
      }
      const action = policy[key];
      const value = action === "stop"
        ? fraction(currentScore(red, black))
        : continuationValue(red, black, valueAt);
      memo.set(key, value);
      return value;
    };
    return valueAt(3, 2);
  }

  function policyIsOptimal(policy) {
    if (!policyComplete(policy)) return false;
    return policyStates.every(({ red, black }) => {
      const required = optimalInfo(red, black).action;
      return required === "tie" || policy[stateKey(red, black)] === required;
    });
  }

  function oneOptimalPolicy() {
    return policyStates.reduce((policy, { red, black }) => {
      const optimal = optimalInfo(red, black).action;
      policy[stateKey(red, black)] = optimal === "tie" ? "stop" : optimal;
      return policy;
    }, {});
  }

  function nextRandom(seed) {
    const nextSeed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return { seed: nextSeed, value: nextSeed / 4294967296 };
  }

  function makeRound(seed) {
    const deck = ["R", "R", "R", "B", "B"];
    let workingSeed = seed >>> 0;
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const random = nextRandom(workingSeed);
      workingSeed = random.seed;
      const swapIndex = Math.floor(random.value * (index + 1));
      [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
    return { seed: seed >>> 0, nextSeed: workingSeed, deck };
  }

  function initialState() {
    const round = makeRound(INITIAL_SEED);
    return {
      round,
      nextSeed: round.nextSeed,
      roundNumber: 1,
      drawIndex: 0,
      score: 0,
      finished: false,
      finishReason: "",
      policy: blankPolicy(),
      estimate: "",
      policyFeedback: "",
      policyTone: "neutral",
      simulation: null,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeEstimate(value) {
    return String(value).replace(/[^0-9./\s-]/g, "").slice(0, 32);
  }

  function parseNumber(value) {
    const trimmed = String(value).trim();
    if (!trimmed) return NaN;
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (match) {
      const denominator = Number(match[2]);
      return denominator ? Number(match[1]) / denominator : NaN;
    }
    return Number(trimmed);
  }

  function remainingCounts() {
    const remaining = state.round.deck.slice(state.drawIndex);
    return {
      red: remaining.filter((card) => card === "R").length,
      black: remaining.filter((card) => card === "B").length,
    };
  }

  function simulatePolicy(policy, seed, rounds = SIMULATION_ROUNDS) {
    let workingSeed = seed >>> 0;
    let totalScore = 0;
    const scoreCounts = {};

    for (let count = 0; count < rounds; count += 1) {
      const round = makeRound(workingSeed);
      workingSeed = round.nextSeed;
      let red = 3;
      let black = 2;
      let score = 0;
      let index = 0;
      while (red + black > 0 && policy[stateKey(red, black)] === "continue") {
        const card = round.deck[index];
        index += 1;
        if (card === "R") {
          red -= 1;
          score += 1;
        } else {
          black -= 1;
          score -= 1;
        }
      }
      totalScore += score;
      scoreCounts[score] = (scoreCounts[score] || 0) + 1;
    }

    return { seed: seed >>> 0, rounds, mean: totalScore / rounds, totalScore, scoreCounts };
  }

  function reconstructionNote() {
    return `
      <p class="math2-reconstruction-note p212-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function guardrailsMarkup() {
    return `
      <section class="p212-guardrails" aria-labelledby="p212-guardrails-title">
        <div class="eyebrow" id="p212-guardrails-title">Rules that fix the probability model</div>
        <ul>
          <li>The deck is uniformly shuffled; its ten colour orders are equally likely.</li>
          <li>Cards are drawn without replacement, and revealed colours update the remaining counts.</li>
          <li>You may stop before the first draw or after any draw. A completed deck ends automatically.</li>
          <li>Scores may be negative. Exact recursion—not simulation—determines the answer.</li>
        </ul>
      </section>`;
  }

  function deckMarkup() {
    return `
      <div class="p212-deck" aria-label="Five-card deck">
        ${state.round.deck.map((card, index) => {
          const visible = index < state.drawIndex || state.finished;
          const colourName = card === "R" ? "Red" : "Black";
          const label = visible ? `${colourName} card in position ${index + 1}` : `Unrevealed card in position ${index + 1}`;
          return `
            <div class="p212-card ${visible ? `is-${colourName.toLowerCase()}` : "is-hidden"}" role="img" aria-label="${label}">
              <span>${visible ? card : "?"}</span>
              <small>${visible ? colourName : "Hidden"}</small>
            </div>`;
        }).join("")}
      </div>`;
  }

  function playControls() {
    if (state.finished) {
      const explanation = state.finishReason === "stopped"
        ? `You stopped after ${state.drawIndex} card${state.drawIndex === 1 ? "" : "s"}.`
        : "All five cards were revealed.";
      return `
        <div class="p212-play-result" aria-live="polite">
          <div><span>Final score</span><strong>${state.score > 0 ? "+" : ""}${state.score}</strong><p>${explanation}</p></div>
          <button class="secondary-button" type="button" data-problem-action="p212-new-round">New shuffle</button>
        </div>`;
    }
    return `
      <div class="button-row p212-play-actions">
        <button class="primary-button" type="button" data-problem-action="p212-draw">Draw next card</button>
        <button class="secondary-button" type="button" data-problem-action="p212-stop">Stop at ${state.score > 0 ? "+" : ""}${state.score}</button>
      </div>`;
  }

  function playCard() {
    const remaining = remainingCounts();
    return `
      <section class="math2-stage-card p212-play-card" aria-labelledby="p212-play-title">
        <div class="math2-stage-heading">
          <div><div class="eyebrow">Play one seeded deck</div><h2 id="p212-play-title">Draw or stop</h2></div>
          <p>Red adds one point; black subtracts one. Reset reproduces the same shuffle.</p>
        </div>
        <div class="p212-scoreboard" aria-live="polite">
          <div><span>Current score</span><strong>${state.score > 0 ? "+" : ""}${state.score}</strong></div>
          <div><span>Red remaining</span><strong>${remaining.red}</strong></div>
          <div><span>Black remaining</span><strong>${remaining.black}</strong></div>
        </div>
        ${deckMarkup()}
        ${playControls()}
      </section>`;
  }

  function policyMap() {
    const current = remainingCounts();
    return `
      <div class="p212-policy-grid" role="group" aria-label="Stop or continue decision for every reachable nonterminal state">
        ${policyStates.map(({ red, black }) => {
          const key = stateKey(red, black);
          const chosen = state.policy[key];
          const isCurrent = !state.finished && red === current.red && black === current.black;
          return `
            <div class="p212-policy-state ${isCurrent ? "is-current" : ""}" ${isCurrent ? 'aria-current="step"' : ""}>
              <div class="p212-state-label"><span>${red + black} card${red + black === 1 ? "" : "s"} left</span><strong>R${red} · B${black}</strong><small>score ${currentScore(red, black) > 0 ? "+" : ""}${currentScore(red, black)}</small></div>
              <div class="p212-policy-toggle">
                <button type="button" data-problem-action="p212-policy" data-p212-state="${key}" data-p212-decision="stop" aria-pressed="${chosen === "stop"}">Stop</button>
                <button type="button" data-problem-action="p212-policy" data-p212-state="${key}" data-p212-decision="continue" aria-pressed="${chosen === "continue"}">Continue</button>
              </div>
            </div>`;
        }).join("")}
      </div>`;
  }

  function exactEvaluator(value) {
    const chosen = Object.values(state.policy).filter(Boolean).length;
    if (!value) {
      return `
        <div class="p212-exact-evaluator is-incomplete">
          <span>Exact value of this policy</span><strong>${chosen} / ${policyStates.length} states chosen</strong>
        </div>`;
    }
    return `
      <div class="p212-exact-evaluator">
        <span>Exact value from the initial state</span>
        <strong>V(3,2) = ${fractionText(value)} = ${fractionDecimal(value).toFixed(3)}</strong>
        <small>Calculated by backward recursion through the submitted map.</small>
      </div>`;
  }

  function policyFeedbackMarkup() {
    if (!state.policyFeedback) return "";
    return `<div class="math2-feedback is-${state.policyTone}" role="status">${state.policyFeedback}</div>`;
  }

  function simulationMarkup(value) {
    if (!value) return "";
    const outcomeText = state.simulation
      ? Object.entries(state.simulation.scoreCounts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([score, count]) => `${score}: ${count}`).join(" · ")
      : "";
    return `
      <section class="p212-simulation" aria-label="Optional seeded simulation">
        <div class="p212-simulation-heading"><div><span>Seeded check</span><strong>${SIMULATION_ROUNDS} games</strong></div><button class="ghost-button" type="button" data-problem-action="p212-simulate">Run simulation</button></div>
        ${state.simulation ? `<div class="p212-simulation-result"><strong>${state.simulation.mean.toFixed(3)}</strong><span>sample mean · exact ${fractionText(value)}</span></div><p>Final-score counts · ${outcomeText}</p>` : ""}
        <p class="p212-simulation-note">The sample illustrates the policy. The exact recursive value above is authoritative.</p>
      </section>`;
  }

  function policyCard() {
    const value = evaluatePolicy(state.policy);
    return `
      <section class="p212-policy-card" aria-labelledby="p212-policy-title">
        <div class="p212-policy-heading"><div><div class="eyebrow">Policy map</div><h2 id="p212-policy-title">Choose at every state</h2></div><span>${policyStates.length} states</span></div>
        <p class="p212-policy-intro">R and B are cards remaining. The score follows automatically: <strong>score = 1 − R + B</strong>.</p>
        ${policyMap()}
        ${exactEvaluator(value)}
        <form class="p212-answer-form" data-p212-answer-form novalidate>
          <label for="p212-estimate">Maximum expected score from R3 · B2</label>
          <div class="p212-answer-row"><input id="p212-estimate" type="text" inputmode="decimal" value="${escapeAttribute(state.estimate)}" placeholder="decimal or fraction" autocomplete="off" /><button class="primary-button" type="submit">Check policy</button></div>
        </form>
        ${policyFeedbackMarkup()}
        ${simulationMarkup(value)}
      </section>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p212-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionTable() {
    return `
      <div class="p212-solution-grid" aria-label="Optimal dynamic-programming values">
        ${policyStates.map(({ red, black }) => {
          const info = optimalInfo(red, black);
          return `<div><span>R${red} B${black}</span><strong>${fractionText(info.value)}</strong><em>${info.action}</em></div>`;
        }).join("")}
      </div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p212-solution" aria-labelledby="p212-solution-heading">
        <h3 id="p212-solution-heading" tabindex="-1">Work backwards</h3>
        <p>At state (r,b), stopping pays 1−r+b. Continuing is the probability-weighted value of the two possible next states.</p>
        <div class="math2-equation">V(r,b) = max(1−r+b, [rV(r−1,b)+bV(r,b−1)]/(r+b))</div>
        ${solutionTable()}
        <p>Stop strictly when r=0. At (1,2), both actions are worth 2. Continue at every other state containing a red card.</p>
        <div class="math2-equation">V(3,2) = [3(5/3)+2(5/4)]/5 = 3/2</div>
        <button class="secondary-button p212-load-policy" type="button" data-problem-action="p212-load-policy">Load one optimal policy</button>
      </section>`;
  }

  function stateSnapshot() {
    const current = remainingCounts();
    const value = evaluatePolicy(state.policy);
    return JSON.stringify({
      problem: PROBLEM,
      deterministicSeed: state.round.seed,
      roundNumber: state.roundNumber,
      deck: state.round.deck,
      cardsDrawn: state.drawIndex,
      score: state.score,
      remaining: current,
      finished: state.finished,
      policyStatesChosen: Object.values(state.policy).filter(Boolean).length,
      policyValue: value ? fractionText(value) : null,
      policyOptimal: policyIsOptimal(state.policy),
      estimate: state.estimate || null,
      simulation: state.simulation,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell math2-shell p212-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread math2-spread p212-spread">
          <article class="book-page p212-problem-page">
            <div class="problem-number">Problem 2.12</div>
            <h1 class="book-title math2-title p212-title">A card game</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">A uniformly shuffled deck contains three red cards and two black cards. Your score starts at 0. Each red adds 1 point; each black subtracts 1.</p>
            <p class="problem-copy">Before the first draw and after every revealed card, you may stop and keep the current score. What strategy maximises your expected score, and what is that maximum?</p>
            ${guardrailsMarkup()}
          </article>

          <section class="book-page book-stage math2-stage p212-stage">
            ${playCard()}
            ${policyCard()}
          </section>

          <aside class="book-page book-coach p212-coach">
            <div class="coach-kicker">Think backwards</div>
            <p class="coach-question">Is a positive score enough reason to stop?</p>
            <p class="p212-coach-copy">The decision depends on both the score and the mix of cards remaining. The policy map makes that changing state explicit.</p>
            <div class="button-row p212-help-row">
              <button class="secondary-button" type="button" data-problem-action="p212-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p212-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="math2-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function startNextRound() {
    const round = makeRound(state.nextSeed);
    state.round = round;
    state.nextSeed = round.nextSeed;
    state.roundNumber += 1;
    state.drawIndex = 0;
    state.score = 0;
    state.finished = false;
    state.finishReason = "";
  }

  function clearPolicyResponse() {
    state.policyFeedback = "";
    state.policyTone = "neutral";
    state.simulation = null;
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p212-reset") {
          state = initialState();
          renderApp();
          return;
        }
        if (action === "p212-draw" && !state.finished) {
          const card = state.round.deck[state.drawIndex];
          state.drawIndex += 1;
          state.score += card === "R" ? 1 : -1;
          if (state.drawIndex === state.round.deck.length) {
            state.finished = true;
            state.finishReason = "complete";
          }
          focusSelector = state.finished ? '[data-problem-action="p212-new-round"]' : '[data-problem-action="p212-draw"]';
        }
        if (action === "p212-stop" && !state.finished) {
          state.finished = true;
          state.finishReason = "stopped";
          focusSelector = '[data-problem-action="p212-new-round"]';
        }
        if (action === "p212-new-round") {
          startNextRound();
          focusSelector = '[data-problem-action="p212-draw"]';
        }
        if (action === "p212-policy") {
          const policyState = control.dataset.p212State;
          const decision = control.dataset.p212Decision;
          state.policy[policyState] = decision;
          clearPolicyResponse();
          focusSelector = `[data-problem-action="p212-policy"][data-p212-state="${policyState}"][data-p212-decision="${decision}"]`;
        }
        if (action === "p212-simulate" && policyComplete(state.policy)) {
          state.simulation = simulatePolicy(state.policy, INITIAL_SEED ^ 0x6a09e667);
        }
        if (action === "p212-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p212-reveal") state.revealed = true;
        if (action === "p212-load-policy") {
          state.policy = oneOptimalPolicy();
          state.simulation = null;
          state.policyFeedback = "Optimal policy loaded. Stop was chosen at the tie state; Continue would be equally valid there.";
          state.policyTone = "success";
        }
        renderApp();
        if (action === "p212-reveal") {
          focusAfterRender("#p212-solution-heading");
        } else if (focusSelector) {
          focusAfterRender(focusSelector);
        }
      });
    });

    const estimateInput = document.querySelector("#p212-estimate");
    estimateInput?.addEventListener("input", (event) => {
      state.estimate = sanitizeEstimate(event.target.value);
      state.policyFeedback = "";
      state.policyTone = "neutral";
    });

    const answerForm = document.querySelector("[data-p212-answer-form]");
    answerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.estimate = sanitizeEstimate(estimateInput?.value).trim();
      state.policyTone = "warn";
      const value = evaluatePolicy(state.policy);
      const estimate = parseNumber(state.estimate);
      if (!value) {
        state.policyFeedback = "Choose Stop or Continue for all eleven nonterminal states first.";
      } else if (!Number.isFinite(estimate)) {
        state.policyFeedback = "Enter the maximum expected score as a decimal or fraction, such as 1.5 or 3/2.";
      } else if (!policyIsOptimal(state.policy)) {
        state.policyFeedback = `This submitted policy is worth exactly ${fractionText(value)} from the start. At least one strict state uses the lower-value action.`;
      } else if (Math.abs(estimate - 1.5) > 0.005) {
        state.policyFeedback = "The policy is optimal, but its exact initial value is not the number entered. Evaluate V(3,2) once more.";
      } else {
        state.policyTone = "success";
        state.policyFeedback = "Correct: this is an optimal map, and V(3,2) = 3/2. Either action at R1 · B2 is accepted.";
      }
      renderApp();
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
