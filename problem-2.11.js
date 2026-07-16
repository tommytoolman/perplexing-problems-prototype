(function registerThreeEnvelopePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "2.11";
  const AMOUNTS = Object.freeze([20, 50, 100]);
  const TOTAL = AMOUNTS.reduce((sum, amount) => sum + amount, 0);
  const INITIAL_SEED = 2112050;
  const SIMULATION_ROUNDS = 600;
  const optimalPolicy = Object.freeze({ 20: "switch", 50: "switch", 100: "keep" });
  const hints = Object.freeze([
    "Condition on the amount you actually see. Once one envelope is open, only two known amounts can be behind a switch.",
    "If the opened amount is x, the two unopened envelopes contain £(170 − x) between them. A random switch is therefore worth £(170 − x)/2 on average.",
    "Compare: £20 with £75, £50 with £60, and £100 with £35. Choose the larger value in each row, then average the three chosen returns.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p211-reset">Reset</button>';

  function nextRandom(seed) {
    const nextSeed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return { seed: nextSeed, value: nextSeed / 4294967296 };
  }

  function makeRound(seed) {
    const envelopes = [...AMOUNTS];
    let workingSeed = seed >>> 0;
    for (let index = envelopes.length - 1; index > 0; index -= 1) {
      const random = nextRandom(workingSeed);
      workingSeed = random.seed;
      const swapIndex = Math.floor(random.value * (index + 1));
      [envelopes[index], envelopes[swapIndex]] = [envelopes[swapIndex], envelopes[index]];
    }
    const switchRandom = nextRandom(workingSeed);
    return {
      seed: seed >>> 0,
      envelopes,
      switchBit: Math.floor(switchRandom.value * 2),
      nextSeed: switchRandom.seed,
    };
  }

  const initialState = () => {
    const round = makeRound(INITIAL_SEED);
    return {
      round,
      nextSeed: round.nextSeed,
      roundNumber: 1,
      openedIndex: null,
      receivedIndex: null,
      playDecision: "",
      policy: { 20: "", 50: "", 100: "" },
      estimate: "",
      policyFeedback: "",
      policyTone: "neutral",
      simulation: null,
      hintsUsed: 0,
      revealed: false,
    };
  };

  let state = initialState();

  function gcd(first, second) {
    let a = Math.abs(first);
    let b = Math.abs(second);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeEstimate(value) {
    return String(value).replace(/[^0-9./£\s-]/g, "").slice(0, 32);
  }

  function policyComplete(policy = state.policy) {
    return AMOUNTS.every((amount) => policy[amount] === "keep" || policy[amount] === "switch");
  }

  function returnFor(amount, decision) {
    return decision === "keep" ? amount : (TOTAL - amount) / 2;
  }

  function policyValue(policy = state.policy) {
    if (!policyComplete(policy)) return null;
    const twiceReturns = AMOUNTS.map((amount) => (
      policy[amount] === "keep" ? 2 * amount : TOTAL - amount
    ));
    const rawNumerator = twiceReturns.reduce((sum, value) => sum + value, 0);
    const rawDenominator = 2 * AMOUNTS.length;
    const divisor = gcd(rawNumerator, rawDenominator);
    return {
      numerator: rawNumerator / divisor,
      denominator: rawDenominator / divisor,
      decimal: rawNumerator / rawDenominator,
      conditionalReturns: AMOUNTS.map((amount) => returnFor(amount, policy[amount])),
    };
  }

  function isOptimalPolicy(policy = state.policy) {
    return AMOUNTS.every((amount) => policy[amount] === optimalPolicy[amount]);
  }

  function parseNumber(value) {
    const trimmed = String(value).trim().replace(/^£\s*/, "");
    if (!trimmed) return NaN;
    const fraction = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      return denominator ? Number(fraction[1]) / denominator : NaN;
    }
    return Number(trimmed);
  }

  function simulatePolicy(policy, seed, rounds = SIMULATION_ROUNDS) {
    let workingSeed = seed >>> 0;
    let totalReturn = 0;
    const outcomes = { 20: 0, 50: 0, 100: 0 };

    for (let count = 0; count < rounds; count += 1) {
      const round = makeRound(workingSeed);
      workingSeed = round.nextSeed;
      const openedIndex = 0;
      const openedAmount = round.envelopes[openedIndex];
      let receivedIndex = openedIndex;
      if (policy[openedAmount] === "switch") {
        const alternatives = [1, 2];
        receivedIndex = alternatives[round.switchBit];
      }
      const receivedAmount = round.envelopes[receivedIndex];
      totalReturn += receivedAmount;
      outcomes[receivedAmount] += 1;
    }

    return {
      seed: seed >>> 0,
      rounds,
      mean: totalReturn / rounds,
      totalReturn,
      outcomes,
    };
  }

  function reconstructionNote() {
    return `
      <p class="math2-reconstruction-note p211-reconstruction-note">
        <strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.
      </p>`;
  }

  function envelopeMarkup() {
    const finished = Boolean(state.playDecision);
    return `
      <div class="p211-envelopes" aria-label="Three shuffled envelopes">
        ${state.round.envelopes.map((amount, index) => {
          const opened = state.openedIndex === index;
          const showAmount = opened || finished;
          const received = finished && state.receivedIndex === index;
          const statusClass = `${opened ? " is-opened" : ""}${received ? " is-received" : ""}${showAmount ? " is-revealed" : ""}`;
          const label = showAmount
            ? `Envelope ${index + 1} contains £${amount}${received ? "; this is your final envelope" : ""}`
            : `Open sealed envelope ${index + 1}`;
          return `
            <button class="p211-envelope${statusClass}" type="button" data-problem-action="p211-open" data-p211-index="${index}" aria-label="${label}" ${state.openedIndex === null ? "" : "disabled"}>
              <span class="p211-envelope-flap" aria-hidden="true"></span>
              <span class="p211-envelope-number">Envelope ${index + 1}</span>
              <strong>${showAmount ? `£${amount}` : "?"}</strong>
              <small>${received ? "You receive this" : opened ? "Opened" : showAmount ? "Not chosen" : "Tap to open"}</small>
            </button>`;
        }).join("")}
      </div>`;
  }

  function playDecisionMarkup() {
    if (state.openedIndex === null) {
      return `<p class="p211-play-prompt" aria-live="polite">Choose one envelope to reveal its amount.</p>`;
    }
    const openedAmount = state.round.envelopes[state.openedIndex];
    if (!state.playDecision) {
      return `
        <div class="p211-play-decision" aria-live="polite">
          <p>You opened <strong>£${openedAmount}</strong>. Keep it, or switch to one of the two unopened envelopes chosen uniformly by the computer?</p>
          <div class="button-row">
            <button class="primary-button" type="button" data-problem-action="p211-keep">Keep £${openedAmount}</button>
            <button class="secondary-button" type="button" data-problem-action="p211-switch">Switch randomly</button>
          </div>
        </div>`;
    }
    const receivedAmount = state.round.envelopes[state.receivedIndex];
    const summary = state.playDecision === "keep"
      ? `You kept £${receivedAmount}.`
      : `You switched from £${openedAmount} to £${receivedAmount}.`;
    return `
      <div class="p211-play-result" aria-live="polite">
        <div><span>Round ${state.roundNumber}</span><strong>${summary}</strong></div>
        <button class="secondary-button" type="button" data-problem-action="p211-next-round">Shuffle again</button>
      </div>`;
  }

  function playCard() {
    return `
      <section class="math2-stage-card p211-play-card" aria-labelledby="p211-play-title">
        <div class="math2-stage-heading">
          <div><div class="eyebrow">Try one round</div><h2 id="p211-play-title">Open, then decide</h2></div>
          <p>Reset always returns to the same seeded sequence, so a round can be reproduced exactly.</p>
        </div>
        ${envelopeMarkup()}
        ${playDecisionMarkup()}
      </section>`;
  }

  function policyRows() {
    return `
      <div class="p211-policy-rows" role="group" aria-label="Policy for each observed amount">
        ${AMOUNTS.map((amount) => {
          const decision = state.policy[amount];
          return `
            <div class="p211-policy-row">
              <div><span>If you reveal</span><strong>£${amount}</strong></div>
              <div class="p211-policy-toggle">
                <button type="button" data-problem-action="p211-policy" data-p211-amount="${amount}" data-p211-decision="keep" aria-pressed="${decision === "keep"}">Keep</button>
                <button type="button" data-problem-action="p211-policy" data-p211-amount="${amount}" data-p211-decision="switch" aria-pressed="${decision === "switch"}">Switch</button>
              </div>
              <span class="p211-policy-return">${decision ? `Conditional return £${returnFor(amount, decision).toFixed(2)}` : "Choose an action"}</span>
            </div>`;
        }).join("")}
      </div>`;
  }

  function exactEvaluator(value) {
    if (!value) {
      return `
        <div class="p211-exact-evaluator is-incomplete">
          <span>Exact policy expectation</span><strong>Choose all three actions</strong>
        </div>`;
    }
    return `
      <div class="p211-exact-evaluator">
        <span>Exact policy expectation</span>
        <strong>E = ${value.numerator}/${value.denominator} = £${value.decimal.toFixed(2)}…</strong>
        <small>Average of £${value.conditionalReturns.map((amount) => amount.toFixed(2)).join(", £")}</small>
      </div>`;
  }

  function policyFeedbackMarkup() {
    if (!state.policyFeedback) return "";
    return `<div class="math2-feedback is-${state.policyTone}" role="status">${state.policyFeedback}</div>`;
  }

  function simulationMarkup(value) {
    if (!value) return "";
    return `
      <section class="p211-simulation" aria-label="Optional seeded simulation">
        <div class="p211-simulation-heading"><div><span>Seeded check</span><strong>${SIMULATION_ROUNDS} rounds</strong></div><button class="ghost-button" type="button" data-problem-action="p211-simulate" ${policyComplete() ? "" : "disabled"}>Run simulation</button></div>
        ${state.simulation ? `
          <div class="p211-simulation-result"><strong>£${state.simulation.mean.toFixed(2)}</strong><span>sample mean · exact value £${value.decimal.toFixed(2)}…</span></div>
          <p>Outcomes: £20 × ${state.simulation.outcomes[20]}, £50 × ${state.simulation.outcomes[50]}, £100 × ${state.simulation.outcomes[100]}.</p>` : ""}
        <p class="p211-simulation-note">Simulation is evidence about the calculation, not its proof. The exact value above is the validator.</p>
      </section>`;
  }

  function policyCard() {
    const value = policyValue();
    return `
      <section class="p211-policy-card" aria-labelledby="p211-policy-title">
        <div class="p211-policy-heading"><div><div class="eyebrow">Policy builder</div><h2 id="p211-policy-title">Decide before the shuffle</h2></div><span>3 observations</span></div>
        ${policyRows()}
        ${exactEvaluator(value)}
        <form class="p211-policy-form" data-p211-policy-form novalidate>
          <label for="p211-estimate">Maximum expected return</label>
          <div class="p211-estimate-row"><span>£</span><input id="p211-estimate" type="text" inputmode="decimal" value="${escapeAttribute(state.estimate)}" placeholder="decimal or fraction" autocomplete="off" /><button class="primary-button" type="submit">Check policy</button></div>
        </form>
        ${policyFeedbackMarkup()}
        ${simulationMarkup(value)}
      </section>`;
  }

  function guardrailsMarkup() {
    return `
      <section class="p211-guardrails" aria-labelledby="p211-guardrails-title">
        <div class="eyebrow" id="p211-guardrails-title">Assumptions that matter</div>
        <ul>
          <li>The fixed amounts £20, £50 and £100 are known before play.</li>
          <li>The three envelopes are uniformly shuffled.</li>
          <li>A switch target is chosen uniformly from the two unopened envelopes.</li>
          <li>No host removes an envelope or adds information.</li>
        </ul>
      </section>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p211-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p211-solution" aria-labelledby="p211-solution-heading">
        <h3 id="p211-solution-heading" tabindex="-1">Condition on what you see</h3>
        <p>If the opened amount is x, the two unopened envelopes contain £(170 − x), so switching is worth £(170 − x)/2 on average.</p>
        <div class="p211-solution-table">
          <div><span>See £20</span><strong>£20 vs £75</strong><em>Switch</em></div>
          <div><span>See £50</span><strong>£50 vs £60</strong><em>Switch</em></div>
          <div><span>See £100</span><strong>£100 vs £35</strong><em>Keep</em></div>
        </div>
        <div class="math2-equation">E(best) = (75 + 60 + 100) / 3 = 235 / 3 = £78.33…</div>
        <button class="secondary-button p211-load-policy" type="button" data-problem-action="p211-load-policy">Load the optimal policy</button>
        <p>Always keeping and always switching both average £170/3. The advantage comes from making the action depend on the revealed amount.</p>
      </section>`;
  }

  function stateSnapshot() {
    const value = policyValue();
    return JSON.stringify({
      problem: PROBLEM,
      deterministicSeed: state.round.seed,
      roundNumber: state.roundNumber,
      envelopeAmounts: state.round.envelopes,
      openedIndex: state.openedIndex,
      playDecision: state.playDecision || null,
      receivedIndex: state.receivedIndex,
      policy: state.policy,
      exactPolicyValue: value ? `${value.numerator}/${value.denominator}` : null,
      estimate: state.estimate || null,
      simulation: state.simulation,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell math2-shell p211-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread math2-spread p211-spread">
          <article class="book-page p211-problem-page">
            <div class="problem-number">Problem 2.11</div>
            <h1 class="book-title math2-title p211-title">The three envelope problem</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            ${reconstructionNote()}
            <p class="problem-copy">Three indistinguishable envelopes contain exactly <strong>£20</strong>, <strong>£50</strong> and <strong>£100</strong>, one amount in each. They are uniformly shuffled.</p>
            <p class="problem-copy">Open one. You may keep it or exchange it for one of the two unopened envelopes, chosen uniformly by the computer. What should you do after each possible reveal, and what is the best policy worth?</p>
            ${guardrailsMarkup()}
          </article>

          <section class="book-page book-stage math2-stage p211-stage">
            ${playCard()}
            ${policyCard()}
          </section>

          <aside class="book-page book-coach p211-coach">
            <div class="coach-kicker">Use the information</div>
            <p class="coach-question">What changes after the first envelope is opened?</p>
            <p class="p211-coach-copy">Switching blindly changes nothing on average. A policy can do better only because it conditions its decision on the observed amount.</p>
            <div class="button-row p211-help-row">
              <button class="secondary-button" type="button" data-problem-action="p211-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p211-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
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
    state.openedIndex = null;
    state.receivedIndex = null;
    state.playDecision = "";
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
        if (action === "p211-reset") {
          state = initialState();
          renderApp();
          return;
        }
        if (action === "p211-open" && state.openedIndex === null) {
          state.openedIndex = Number(control.dataset.p211Index);
          focusSelector = '[data-problem-action="p211-keep"]';
        }
        if (action === "p211-keep" && state.openedIndex !== null) {
          state.playDecision = "keep";
          state.receivedIndex = state.openedIndex;
          focusSelector = '[data-problem-action="p211-next-round"]';
        }
        if (action === "p211-switch" && state.openedIndex !== null) {
          const alternatives = [0, 1, 2].filter((index) => index !== state.openedIndex);
          state.playDecision = "switch";
          state.receivedIndex = alternatives[state.round.switchBit];
          focusSelector = '[data-problem-action="p211-next-round"]';
        }
        if (action === "p211-next-round") {
          startNextRound();
          focusSelector = '[data-problem-action="p211-open"]';
        }
        if (action === "p211-policy") {
          const amount = Number(control.dataset.p211Amount);
          state.policy[amount] = control.dataset.p211Decision;
          clearPolicyResponse();
          focusSelector = `[data-problem-action="p211-policy"][data-p211-amount="${amount}"][data-p211-decision="${control.dataset.p211Decision}"]`;
        }
        if (action === "p211-simulate" && policyComplete()) {
          state.simulation = simulatePolicy(state.policy, INITIAL_SEED ^ 0x5f3759df);
        }
        if (action === "p211-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p211-reveal") state.revealed = true;
        if (action === "p211-load-policy") {
          state.policy = { ...optimalPolicy };
          state.simulation = null;
          state.policyFeedback = "Optimal policy loaded. Its exact expectation is £235/3.";
          state.policyTone = "success";
        }
        renderApp();
        if (action === "p211-reveal") {
          focusAfterRender("#p211-solution-heading");
        } else if (focusSelector) {
          focusAfterRender(focusSelector);
        }
      });
    });

    const estimateInput = document.querySelector("#p211-estimate");
    estimateInput?.addEventListener("input", (event) => {
      state.estimate = sanitizeEstimate(event.target.value);
      state.policyFeedback = "";
      state.policyTone = "neutral";
    });

    const policyForm = document.querySelector("[data-p211-policy-form]");
    policyForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.estimate = sanitizeEstimate(estimateInput?.value).trim();
      state.policyTone = "warn";
      const value = policyValue();
      const estimate = parseNumber(state.estimate);
      if (!value) {
        state.policyFeedback = "Choose Keep or Switch for all three possible observations first.";
      } else if (!Number.isFinite(estimate) || estimate < 0) {
        state.policyFeedback = "Enter the expected return as a decimal or fraction, such as 78.33 or 235/3.";
      } else if (!isOptimalPolicy()) {
        state.policyFeedback = `This policy is worth exactly £${value.numerator}/${value.denominator} (£${value.decimal.toFixed(2)}…). At least one observation has a more valuable action.`;
      } else if (Math.abs(estimate - 235 / 3) > 0.01) {
        state.policyFeedback = "The actions are optimal, but average their three conditional returns again. The exact result is not a whole number.";
      } else {
        state.policyTone = "success";
        state.policyFeedback = "Correct: switch after £20 or £50, keep £100, for an exact expectation of £235/3.";
      }
      renderApp();
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
