(function registerThreeDoorProblemPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const DOORS = Object.freeze([0, 1, 2]);
  const SIMULATION_SEED = 280828;
  const hints = Object.freeze([
    "Before any door opens, your chosen door has probability 1/3 of hiding the prize.",
    "The host knows where the prize is and is forbidden to reveal it. His goat reveal does not give your first choice any new probability.",
    "Your first choice is wrong with probability 2/3. Whenever it is wrong, the host's rules force the remaining closed door to hide the prize.",
    "Partition all games by the first choice: stay wins the 1/3 in which it was right; switch wins the other 2/3.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p28-reset">Reset</button>';

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededGame(number) {
    const random = mulberry32(0x280828 + number * 7919);
    return { prizeDoor: Math.floor(random() * 3), hostCoin: random() };
  }

  const initialState = () => {
    const game = seededGame(1);
    return {
      gameNumber: 1,
      prizeDoor: game.prizeDoor,
      hostCoin: game.hostCoin,
      initialDoor: null,
      openedDoor: null,
      finalDoor: null,
      decision: "",
      phase: "choose",
      won: null,
      simulationSize: 0,
      stayWins: 0,
      switchWins: 0,
      prediction: "",
      estimate: "",
      committed: false,
      feedback: "",
      feedbackTone: "is-neutral",
      hintsUsed: 0,
      revealed: false,
    };
  };

  let state = initialState();

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function format(value, digits = 1) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toString();
  }

  function hostDoorFor(choice, prize = state.prizeDoor, coin = state.hostCoin) {
    const candidates = DOORS.filter((door) => door !== choice && door !== prize);
    if (candidates.length === 1) return candidates[0];
    return candidates[coin < 0.5 ? 0 : 1];
  }

  function switchDoor() {
    return DOORS.find((door) => door !== state.initialDoor && door !== state.openedDoor);
  }

  function chooseDoor(door) {
    if (state.phase !== "choose" || !DOORS.includes(door)) return;
    state.initialDoor = door;
    state.openedDoor = hostDoorFor(door);
    state.phase = "decide";
  }

  function commitStrategy(strategy) {
    if (state.phase !== "decide" || !["stay", "switch"].includes(strategy)) return;
    state.decision = strategy;
    state.finalDoor = strategy === "stay" ? state.initialDoor : switchDoor();
    state.won = state.finalDoor === state.prizeDoor;
    state.phase = "result";
  }

  function nextGame() {
    const gameNumber = state.gameNumber + 1;
    const game = seededGame(gameNumber);
    state.gameNumber = gameNumber;
    state.prizeDoor = game.prizeDoor;
    state.hostCoin = game.hostCoin;
    state.initialDoor = null;
    state.openedDoor = null;
    state.finalDoor = null;
    state.decision = "";
    state.phase = "choose";
    state.won = null;
  }

  function doorContents(door) {
    if (state.phase === "result") return door === state.prizeDoor ? "★ Prize" : "Goat";
    if (door === state.openedDoor) return "Goat";
    return "?";
  }

  function doorMarkup(door) {
    const chosen = door === state.initialDoor;
    const opened = door === state.openedDoor;
    const final = door === state.finalDoor;
    const prize = state.phase === "result" && door === state.prizeDoor;
    const classes = [chosen ? "is-chosen" : "", opened ? "is-opened" : "", final ? "is-final" : "", prize ? "is-prize" : ""].filter(Boolean).join(" ");
    const selectable = state.phase === "choose";
    const labelParts = [`Door ${door + 1}`];
    if (chosen) labelParts.push("your initial choice");
    if (opened) labelParts.push("opened by host, goat");
    if (final) labelParts.push("your final choice");
    if (state.phase === "result") labelParts.push(door === state.prizeDoor ? "prize" : "goat");
    return `
      <button class="p28-door ${classes}" type="button" data-problem-action="p28-choose" data-p28-door="${door}" ${selectable ? "" : "disabled"} aria-label="${labelParts.join(", ")}">
        <span class="p28-door-number">${door + 1}</span>
        <span class="p28-door-panel"><i></i><b>${doorContents(door)}</b></span>
        <small>${opened ? "Host opened" : final ? "Final choice" : chosen ? "First choice" : "Closed"}</small>
      </button>`;
  }

  function phaseMessage() {
    if (state.phase === "choose") return `<strong>Choose a door.</strong><span>The prize was placed before you arrived.</span>`;
    if (state.phase === "decide") return `<strong>The host opens Door ${state.openedDoor + 1}: a goat.</strong><span>Keep Door ${state.initialDoor + 1}, or switch to Door ${switchDoor() + 1}?</span>`;
    return `<strong>${state.won ? "You found the prize!" : "The prize was elsewhere."}</strong><span>You chose Door ${state.initialDoor + 1}, ${state.decision === "switch" ? `switched to Door ${state.finalDoor + 1}` : "stayed"}, and ${state.won ? "won" : "lost"}.</span>`;
  }

  function playControls() {
    if (state.phase === "decide") {
      return `<div class="p28-decision-controls" aria-label="Stay or switch"><button class="secondary-button" type="button" data-problem-action="p28-strategy" data-p28-strategy="stay">Stay with Door ${state.initialDoor + 1}</button><button class="primary-button" type="button" data-problem-action="p28-strategy" data-p28-strategy="switch">Switch to Door ${switchDoor() + 1}</button></div>`;
    }
    if (state.phase === "result") {
      return `<div class="p28-decision-controls"><button class="primary-button" type="button" data-problem-action="p28-next">Play another seeded game</button></div>`;
    }
    return "";
  }

  function runStrategySimulation(size) {
    const random = mulberry32(SIMULATION_SEED);
    let stayWins = 0;
    let switchWins = 0;
    for (let index = 0; index < size; index += 1) {
      const prize = Math.floor(random() * 3);
      const choice = Math.floor(random() * 3);
      const host = hostDoorFor(choice, prize, random());
      const switched = DOORS.find((door) => door !== choice && door !== host);
      if (choice === prize) stayWins += 1;
      if (switched === prize) switchWins += 1;
    }
    state.simulationSize = size;
    state.stayWins = stayWins;
    state.switchWins = switchWins;
  }

  function strategyRate(strategy) {
    if (!state.simulationSize) return null;
    return ((strategy === "stay" ? state.stayWins : state.switchWins) / state.simulationSize) * 100;
  }

  function strategyBar(strategy) {
    const observed = strategyRate(strategy);
    const exact = strategy === "stay" ? 100 / 3 : 200 / 3;
    const width = observed ?? (state.revealed ? exact : 0);
    const wins = strategy === "stay" ? state.stayWins : state.switchWins;
    return `
      <div class="p28-strategy-bar is-${strategy}">
        <div class="p28-strategy-label"><span>${strategy === "stay" ? "Always stay" : "Always switch"}</span><strong>${observed == null ? (state.revealed ? `${format(exact, 1)}% exact` : "Run a simulation") : `${wins.toLocaleString()} / ${state.simulationSize.toLocaleString()} · ${format(observed, 1)}%`}</strong></div>
        <div class="p28-bar-track" role="img" aria-label="${strategy} strategy ${observed == null ? "not yet simulated" : `won ${format(observed, 1)} percent`}${state.revealed ? `; exact probability ${format(exact, 1)} percent` : ""}"><span style="width:${width.toFixed(3)}%"></span>${state.revealed ? `<i style="left:${exact.toFixed(3)}%" aria-hidden="true"></i>` : ""}</div>
      </div>`;
  }

  function simulationMarkup() {
    return `
      <section class="p28-simulation" aria-labelledby="p28-simulation-title">
        <div class="p28-simulation-heading"><div><span class="eyebrow">Strategy experiment</span><h3 id="p28-simulation-title">Replay the same seeded games</h3></div><p>Both strategies face identical prize placements and first choices.</p></div>
        <div class="p28-simulation-buttons" aria-label="Simulation sizes">${[1, 100, 10000].map((size) => `<button class="chip-button math2-chip ${state.simulationSize === size ? "active" : ""}" type="button" data-problem-action="p28-simulate" data-p28-size="${size}" aria-pressed="${state.simulationSize === size}">${size === 10000 ? "10,000" : size} ${size === 1 ? "game" : "games"}</button>`).join("")}</div>
        <div class="p28-bars" aria-live="polite">${strategyBar("stay")}${strategyBar("switch")}</div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p28-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p28-solution" aria-labelledby="p28-solution-title">
        <h3 id="p28-solution-title" tabindex="-1">Switching inherits the other two doors</h3>
        <div class="p28-proof-cases">
          <div><strong>Initial choice right · 1/3</strong><span>The host reveals a goat. Staying wins; switching loses.</span></div>
          <div><strong>Initial choice wrong · 2/3</strong><span>The host is forced to reveal the other goat. Switching wins.</span></div>
        </div>
        <div class="math2-equation">P(stay wins) = 1/3 &nbsp;&nbsp; P(switch wins) = 2/3.</div>
        <p>The host's action does not create a fresh 50–50 choice. It concentrates the original probability of the two unchosen doors onto the only one he is allowed to leave closed.</p>
        <aside class="p28-careless-host"><strong>Different game: a careless host</strong><span>If a host chooses an unselected door randomly and only happens to expose a goat, conditioning on that event makes the two remaining doors 1/2 each. That is not the protocol used above.</span></aside>
      </section>`;
  }

  function parseProbability(raw) {
    const normalized = String(raw).trim().replaceAll(",", "");
    const fraction = normalized.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      return denominator ? Number(fraction[1]) / denominator : NaN;
    }
    const percent = normalized.endsWith("%");
    const numeric = Number(percent ? normalized.slice(0, -1).trim() : normalized);
    if (!Number.isFinite(numeric)) return NaN;
    return percent || numeric > 1 ? numeric / 100 : numeric;
  }

  function snapshot() {
    return JSON.stringify({
      problem: "2.8",
      provenance: "classic problem; interaction and wording independently reconstructed",
      hostRules: { knowsPrize: true, alwaysOpensUnchosenGoat: true, alwaysOffersSwitch: true },
      game: {
        number: state.gameNumber,
        phase: state.phase,
        prizeDoor: state.prizeDoor + 1,
        initialDoor: state.initialDoor == null ? null : state.initialDoor + 1,
        openedDoor: state.openedDoor == null ? null : state.openedDoor + 1,
        finalDoor: state.finalDoor == null ? null : state.finalDoor + 1,
        decision: state.decision || null,
        won: state.won,
      },
      simulation: state.simulationSize ? { seed: SIMULATION_SEED, games: state.simulationSize, stayWins: state.stayWins, switchWins: state.switchWins } : null,
      prediction: state.prediction || null,
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell math2-shell p28-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress("2.8")}</div>
          ${problemHeaderActions("2.8", resetMarkup)}
        </header>
        <div class="book-spread math2-spread p28-spread">
          <article class="book-page p28-problem-page">
            <div class="problem-number">Problem 2.8</div>
            <h1 class="book-title math2-title p28-title">The Three Door Problem</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">A prize is hidden behind one of three doors. You choose a door. The host then opens a different door to reveal a goat and offers you the chance to switch. Should you stay or switch?</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — this title names a classic problem, but the available source gives only the title and difficulty. This wording and interaction are original, not Povey’s text.</p>
            <section class="p28-host-rules" aria-labelledby="p28-rules-title"><h2 id="p28-rules-title">The host's binding rules</h2><ol><li>The prize is placed uniformly before you choose.</li><li>The host knows its location.</li><li>He always opens an unchosen goat door—never the prize.</li><li>He always offers the switch. If two goat doors are available, he chooses between them at random.</li></ol></section>
          </article>

          <section class="book-page book-stage math2-stage p28-stage" aria-labelledby="p28-stage-title">
            <div class="math2-stage-card p28-stage-card">
              <div class="math2-stage-heading"><div><span class="eyebrow">Seeded game ${state.gameNumber}</span><h2 id="p28-stage-title">Choose, reveal, decide</h2></div><p>The prize and the host's tie-break were fixed before your click.</p></div>
              <div class="p28-doors" aria-label="Three game doors">${DOORS.map(doorMarkup).join("")}</div>
              <div class="p28-host-message" role="status" aria-live="polite">${phaseMessage()}</div>
              ${playControls()}
              ${simulationMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p28-coach">
            <div class="coach-kicker">Commit before revealing</div>
            <p class="coach-question">Which fixed strategy wins more often, and with what probability?</p>
            <fieldset class="p28-predictions"><legend>Your prediction</legend><button class="p28-prediction ${state.prediction === "stay" ? "active" : ""}" type="button" data-problem-action="p28-predict" data-p28-prediction="stay" aria-pressed="${state.prediction === "stay"}">Stay is better</button><button class="p28-prediction ${state.prediction === "switch" ? "active" : ""}" type="button" data-problem-action="p28-predict" data-p28-prediction="switch" aria-pressed="${state.prediction === "switch"}">Switch is better</button><button class="p28-prediction ${state.prediction === "same" ? "active" : ""}" type="button" data-problem-action="p28-predict" data-p28-prediction="same" aria-pressed="${state.prediction === "same"}">Both are 50–50</button></fieldset>
            <form class="estimate-form p28-answer-form" data-p28-answer-form novalidate><label for="p28-answer">Switching win probability</label><div class="estimate-field"><input class="estimate-input" id="p28-answer" inputmode="decimal" type="text" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="fraction, decimal or %" /><span>P</span></div><button class="primary-button" type="submit">Check prediction</button></form>
            ${feedbackMarkup()}
            <div class="button-row p28-help-row"><button class="secondary-button" type="button" data-problem-action="p28-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p28-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("2.8")}
      </main>`;
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p28-shell");
    if (!root) return;
    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p28-reset") state = initialState();
        if (action === "p28-choose") {
          chooseDoor(Number(control.dataset.p28Door));
          focusSelector = '[data-problem-action="p28-strategy"][data-p28-strategy="switch"]';
        }
        if (action === "p28-strategy") {
          commitStrategy(control.dataset.p28Strategy);
          focusSelector = '[data-problem-action="p28-next"]';
        }
        if (action === "p28-next") {
          nextGame();
          focusSelector = '[data-problem-action="p28-choose"][data-p28-door="0"]';
        }
        if (action === "p28-simulate") {
          runStrategySimulation(Number(control.dataset.p28Size));
          focusSelector = `[data-problem-action="p28-simulate"][data-p28-size="${state.simulationSize}"]`;
        }
        if (action === "p28-predict") {
          state.prediction = control.dataset.p28Prediction;
          state.feedback = "";
          focusSelector = `[data-problem-action="p28-predict"][data-p28-prediction="${state.prediction}"]`;
        }
        if (action === "p28-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          focusSelector = '[data-problem-action="p28-hint"]';
        }
        if (action === "p28-reveal") state.revealed = true;
        rerender();
        if (action === "p28-reveal") focusAfterRender("#p28-solution-title");
        else if (focusSelector) focusAfterRender(focusSelector);
      });
    });

    root.querySelector("#p28-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
    });

    root.querySelector("[data-p28-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p28-answer")?.value || "";
      const estimate = parseProbability(raw);
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "is-neutral";
      if (!Number.isFinite(estimate) || estimate < 0 || estimate > 1) {
        state.feedback = "Enter a probability from 0 to 1, a fraction such as 2/3, or a percentage.";
        state.feedbackTone = "is-warn";
      } else {
        state.committed = true;
        const correctNumber = Math.abs(estimate - 2 / 3) <= 0.01;
        const correctPrediction = state.prediction === "switch";
        if (correctNumber && correctPrediction) {
          state.feedback = "Exactly. Switching wins whenever the first choice was wrong, which happens in two games out of three.";
          state.feedbackTone = "is-success";
        } else if (correctNumber) {
          state.feedback = "Your switching probability is right. Now select the strategy that this makes better.";
        } else if (correctPrediction) {
          state.feedback = `Your strategy is right, but ${format(estimate * 100, 1)}% is not its exact win rate. Track whether the first choice was right.`;
        } else if (Math.abs(estimate - 1 / 2) <= 0.01) {
          state.feedback = "The two closed doors look symmetric, but the host's informed, forced reveal carries information. This is not a fresh 50–50 choice.";
          state.feedbackTone = "is-warn";
        } else if (Math.abs(estimate - 1 / 3) <= 0.01) {
          state.feedback = "One third is the chance that the first choice was right—and therefore the chance that staying wins.";
        } else {
          state.feedback = `That is ${estimate < 2 / 3 ? "below" : "above"} the switching win probability. Partition games by whether the first choice was right.`;
        }
      }
      rerender();
      focusAfterRender("#p28-answer");
    });
  }

  window.poveyProblemPages["2.8"] = { render, bind };
}());
