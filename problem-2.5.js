(function registerAntCubeRandomWalkPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "2.5";
  const START = "000";
  const TARGET = "111";
  const RESET_SEED = 0x2f6e2b1;
  const MAX_WALK_STEPS = 1_000_000;
  const resetMarkup = '<button class="ghost-button" type="button" data-p25-action="reset">Reset</button>';
  const vertices = Object.freeze([
    Object.freeze({ id: "000", x: 88, y: 274 }),
    Object.freeze({ id: "100", x: 258, y: 274 }),
    Object.freeze({ id: "010", x: 160, y: 220 }),
    Object.freeze({ id: "110", x: 330, y: 220 }),
    Object.freeze({ id: "001", x: 88, y: 104 }),
    Object.freeze({ id: "101", x: 258, y: 104 }),
    Object.freeze({ id: "011", x: 160, y: 50 }),
    Object.freeze({ id: "111", x: 330, y: 50 }),
  ]);
  const vertexMap = Object.freeze(Object.fromEntries(vertices.map((vertex) => [vertex.id, vertex])));
  const edges = Object.freeze(vertices.flatMap((vertex) => [0, 1, 2]
    .filter((bit) => vertex.id[bit] === "0")
    .map((bit) => {
      const other = vertex.id.split("");
      other[bit] = "1";
      return Object.freeze([vertex.id, other.join("")]);
    })));
  const layerPositions = Object.freeze({
    "000": Object.freeze({ x: 62, y: 144 }),
    "100": Object.freeze({ x: 205, y: 68 }),
    "010": Object.freeze({ x: 205, y: 144 }),
    "001": Object.freeze({ x: 205, y: 220 }),
    "110": Object.freeze({ x: 365, y: 68 }),
    "101": Object.freeze({ x: 365, y: 144 }),
    "011": Object.freeze({ x: 365, y: 220 }),
    "111": Object.freeze({ x: 510, y: 144 }),
  });
  const histogramBins = Object.freeze([
    Object.freeze({ label: "3–4", minimum: 3, maximum: 4 }),
    Object.freeze({ label: "5–6", minimum: 5, maximum: 6 }),
    Object.freeze({ label: "7–8", minimum: 7, maximum: 8 }),
    Object.freeze({ label: "9–10", minimum: 9, maximum: 10 }),
    Object.freeze({ label: "11–16", minimum: 11, maximum: 16 }),
    Object.freeze({ label: "17–30", minimum: 17, maximum: 30 }),
    Object.freeze({ label: "31+", minimum: 31, maximum: Infinity }),
  ]);
  const hints = Object.freeze([
    "The names of the eight vertices do not matter. Group them only by their edge-distance from the destination.",
    "From distance k, exactly k of the three edges move closer to the destination; the other 3−k move farther away.",
    "Let Eₖ be the expected remaining moves from distance k. Start with E₀=0 and write each Eₖ as 1 plus the weighted average after the next move.",
  ]);

  const initialState = () => ({
    seed: RESET_SEED,
    currentVertex: START,
    currentSteps: 0,
    currentTrail: [START],
    trials: 0,
    totalSteps: 0,
    lastWalk: null,
    histogram: histogramBins.map(() => 0),
    view: "cube",
    answer: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    simulationNotice: "The seeded ant is ready at 000.",
    guardTriggered: false,
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function distanceToTarget(vertex) {
    return [...vertex].filter((digit, index) => digit !== TARGET[index]).length;
  }

  function neighbours(vertex) {
    return [0, 1, 2].map((bit) => {
      const next = vertex.split("");
      next[bit] = next[bit] === "0" ? "1" : "0";
      return next.join("");
    });
  }

  function nextRandom() {
    state.seed = (state.seed + 0x6d2b79f5) >>> 0;
    let value = state.seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function randomNeighbour(vertex) {
    const options = neighbours(vertex);
    return options[Math.floor(nextRandom() * options.length)];
  }

  function edgeKey(first, second) {
    return [first, second].sort().join("-");
  }

  function recentEdges() {
    const used = new Set();
    for (let index = 1; index < state.currentTrail.length; index += 1) {
      used.add(edgeKey(state.currentTrail[index - 1], state.currentTrail[index]));
    }
    return used;
  }

  function histogramIndex(steps) {
    return histogramBins.findIndex((bin) => steps >= bin.minimum && steps <= bin.maximum);
  }

  function recordWalk(steps) {
    const bin = histogramIndex(steps);
    state.trials += 1;
    state.totalSteps += steps;
    state.lastWalk = steps;
    if (bin >= 0) state.histogram[bin] += 1;
  }

  function runningMean() {
    return state.trials ? state.totalSteps / state.trials : null;
  }

  function beginFreshWalk() {
    state.currentVertex = START;
    state.currentSteps = 0;
    state.currentTrail = [START];
  }

  function advanceCurrentWalk() {
    if (state.currentVertex === TARGET) return false;
    state.currentVertex = randomNeighbour(state.currentVertex);
    state.currentSteps += 1;
    state.currentTrail.push(state.currentVertex);
    if (state.currentTrail.length > 28) state.currentTrail.shift();
    return true;
  }

  function setGuardNotice(context) {
    state.guardTriggered = true;
    state.simulationNotice = `Safety stop: ${context} exceeded ${MAX_WALK_STEPS.toLocaleString("en-GB")} steps without reaching 111. The incomplete walk was not counted.`;
  }

  function stepCurrentWalk() {
    state.guardTriggered = false;
    if (state.currentVertex === TARGET) {
      beginFreshWalk();
      state.simulationNotice = "A fresh seeded walk is ready at 000.";
      return;
    }
    if (state.currentSteps >= MAX_WALK_STEPS) {
      setGuardNotice("The visible walk");
      return;
    }
    advanceCurrentWalk();
    if (state.currentVertex === TARGET) {
      recordWalk(state.currentSteps);
      state.simulationNotice = `Target reached in ${state.currentSteps.toLocaleString("en-GB")} steps. This completed walk has been added to the results.`;
    } else {
      state.simulationNotice = `Step ${state.currentSteps.toLocaleString("en-GB")}: the ant is at ${state.currentVertex}, distance ${distanceToTarget(state.currentVertex)} from the target.`;
    }
  }

  function runCurrentWalk() {
    state.guardTriggered = false;
    if (state.currentVertex === TARGET) beginFreshWalk();
    while (state.currentVertex !== TARGET && state.currentSteps < MAX_WALK_STEPS) advanceCurrentWalk();
    if (state.currentVertex !== TARGET) {
      setGuardNotice("The visible walk");
      return;
    }
    recordWalk(state.currentSteps);
    state.simulationNotice = `Target reached in ${state.currentSteps.toLocaleString("en-GB")} steps. Every random move was computed.`;
  }

  function simulateFreshWalk() {
    let vertex = START;
    let steps = 0;
    while (vertex !== TARGET && steps < MAX_WALK_STEPS) {
      vertex = randomNeighbour(vertex);
      steps += 1;
    }
    return vertex === TARGET ? steps : null;
  }

  function runBatch(size) {
    state.guardTriggered = false;
    let completed = 0;
    for (let trial = 0; trial < size; trial += 1) {
      const steps = simulateFreshWalk();
      if (steps === null) {
        setGuardNotice(`Batch walk ${trial + 1}`);
        break;
      }
      recordWalk(steps);
      completed += 1;
    }
    if (!state.guardTriggered) {
      state.simulationNotice = `${completed.toLocaleString("en-GB")} seeded walks completed. Running mean: ${runningMean().toFixed(3)} steps.`;
    }
  }

  function graphNode(vertex, position) {
    const classes = [
      "p25-node",
      vertex === START ? "is-start" : "",
      vertex === TARGET ? "is-target" : "",
      vertex === state.currentVertex ? "is-current" : "",
    ].filter(Boolean).join(" ");
    const labelY = position.y < 80 ? position.y - 21 : position.y + 31;
    return `
      <g class="${classes}" aria-label="Vertex ${vertex}${vertex === state.currentVertex ? ", current ant position" : ""}">
        <circle cx="${position.x}" cy="${position.y}" r="12" />
        ${vertex === state.currentVertex ? `<circle class="p25-ant-ring" cx="${position.x}" cy="${position.y}" r="19" />` : ""}
        <text x="${position.x}" y="${labelY}" text-anchor="middle">${vertex}</text>
      </g>`;
  }

  function cubeGraph() {
    const usedEdges = recentEdges();
    return `
      <div class="p25-graph-wrap">
        <svg class="p25-graph" viewBox="0 0 420 330" role="img" aria-labelledby="p25-cube-title p25-cube-desc">
          <title id="p25-cube-title">The cube as a graph</title>
          <desc id="p25-cube-desc">Eight binary-labelled vertices joined by twelve edges. The ant is at ${state.currentVertex}, ${distanceToTarget(state.currentVertex)} edges from target 111.</desc>
          <g class="p25-edges">
            ${edges.map(([first, second]) => {
              const a = vertexMap[first];
              const b = vertexMap[second];
              const active = usedEdges.has(edgeKey(first, second)) ? "is-recent" : "";
              return `<line class="${active}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
            }).join("")}
          </g>
          ${vertices.map((vertex) => graphNode(vertex.id, vertex)).join("")}
          <text class="p25-graph-key" x="88" y="315" text-anchor="middle">start</text>
          <text class="p25-graph-key" x="330" y="23" text-anchor="middle">target</text>
        </svg>
      </div>`;
  }

  function layerGraph() {
    return `
      <div class="p25-layer-wrap">
        <svg class="p25-graph p25-layer-graph" viewBox="0 0 575 285" role="img" aria-labelledby="p25-layer-title p25-layer-desc">
          <title id="p25-layer-title">Cube vertices grouped by distance from the target</title>
          <desc id="p25-layer-desc">One vertex lies at distance three, three at distance two, three at distance one, and target 111 at distance zero.</desc>
          <g class="p25-edges">
            ${edges.map(([first, second]) => {
              const a = layerPositions[first];
              const b = layerPositions[second];
              return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
            }).join("")}
          </g>
          ${vertices.map((vertex) => graphNode(vertex.id, layerPositions[vertex.id])).join("")}
          ${[3, 2, 1, 0].map((distance, index) => `<text class="p25-layer-label" x="${[62, 205, 365, 510][index]}" y="270" text-anchor="middle">distance ${distance}</text>`).join("")}
        </svg>
        <div class="p25-layer-rules" aria-label="Possible moves from each distance">
          <span><b>3</b><small>3 closer</small></span>
          <span><b>2</b><small>2 closer · 1 farther</small></span>
          <span><b>1</b><small>1 closer · 2 farther</small></span>
          <span><b>0</b><small>stop</small></span>
        </div>
      </div>`;
  }

  function histogramMarkup() {
    const maximum = Math.max(1, ...state.histogram);
    return `
      <section class="p25-histogram" aria-labelledby="p25-histogram-title">
        <div class="p25-histogram-heading">
          <div><span class="eyebrow">Hitting-time distribution</span><h3 id="p25-histogram-title">Completed walks</h3></div>
          <span>${state.trials.toLocaleString("en-GB")} total</span>
        </div>
        <div class="p25-bars">
          ${histogramBins.map((bin, index) => {
            const count = state.histogram[index];
            const width = count ? Math.max(3, (count / maximum) * 100) : 0;
            return `
              <div class="p25-bar" aria-label="${bin.label} steps: ${count.toLocaleString("en-GB")} walks">
                <span>${bin.label}</span>
                <i><b style="--p25-bar:${width.toFixed(2)}%"></b></i>
                <strong>${count.toLocaleString("en-GB")}</strong>
              </div>`;
          }).join("")}
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${escapeHtml(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `
      <div class="hint-stack p25-hints" aria-live="polite">
        ${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}
      </div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p25-solution" aria-labelledby="p25-solution-heading">
        <h3 id="p25-solution-heading" tabindex="-1">Ten edges on average</h3>
        <p>Let <em>Eₖ</em> be the expected moves still required when the ant is <em>k</em> edges from 111. A first-step analysis gives:</p>
        <div class="p25-equation-stack" aria-label="Expected hitting time equations">
          <span>E₀ = 0</span>
          <span>E₁ = 1 + ⅔E₂</span>
          <span>E₂ = 1 + ⅔E₁ + ⅓E₃</span>
          <span>E₃ = 1 + E₂</span>
        </div>
        <p>Substituting the first, second and fourth equations into the third gives</p>
        <div class="math2-equation">E₂ = 2 + ⁷⁄₉E₂, so E₂ = 9</div>
        <p>Therefore <strong>E₁=7</strong> and <strong>E₃=1+E₂=10</strong>. The start is at distance 3, so the expected walk is <strong>10 edges</strong>.</p>
        <p>A walk can wander for arbitrarily long, but on this finite connected graph it eventually reaches the target with probability 1.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      randomSeed: state.seed,
      currentVertex: state.currentVertex,
      distanceToTarget: distanceToTarget(state.currentVertex),
      currentWalkSteps: state.currentSteps,
      completedWalks: state.trials,
      totalSteps: state.totalSteps,
      runningMean: runningMean() === null ? null : Number(runningMean().toFixed(5)),
      lastWalkSteps: state.lastWalk,
      histogram: Object.fromEntries(histogramBins.map((bin, index) => [bin.label, state.histogram[index]])),
      safetyGuardSteps: MAX_WALK_STEPS,
      safetyGuardTriggered: state.guardTriggered,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const mean = runningMean();
    return `
      <main class="book-shell math2-shell p25-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread math2-spread p25-spread">
          <article class="book-page p25-problem-page">
            <div class="problem-number">Problem 2.5</div>
            <h1 class="book-title math2-title p25-title">Ant on a cube II</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="problem-copy">An ant begins at one vertex of a cube. At every move it chooses one of the three edges meeting its current vertex, each with probability ⅓, and walks to the other end. It stops the first time it reaches the diagonally opposite vertex.</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — the available source gives only the title and difficulty. This activity is not Povey’s original wording.</p>
            <section class="prediction-box">
              <div class="eyebrow">Before simulating</div>
              <p>The shortest path uses three edges. Random choices allow the ant to backtrack, so what should “average journey” mean?</p>
            </section>
          </article>

          <section class="book-page book-stage math2-stage p25-stage" aria-labelledby="p25-stage-title">
            <div class="math2-stage-card p25-stage-card">
              <div class="math2-stage-heading p25-stage-heading">
                <div><div class="eyebrow">Seeded random walk</div><h2 id="p25-stage-title">From 000 to 111</h2></div>
                <div class="p25-view-tabs" role="group" aria-label="Graph view">
                  <button class="chip-button math2-chip ${state.view === "cube" ? "active" : ""}" type="button" data-p25-action="view" data-p25-view="cube" aria-pressed="${state.view === "cube"}">Cube</button>
                  <button class="chip-button math2-chip ${state.view === "layers" ? "active" : ""}" type="button" data-p25-action="view" data-p25-view="layers" aria-pressed="${state.view === "layers"}">Distance layers</button>
                </div>
              </div>
              <div class="p25-visual">${state.view === "cube" ? cubeGraph() : layerGraph()}</div>
              <div class="p25-current-strip" aria-live="polite">
                <span>Current vertex <strong>${state.currentVertex}</strong></span>
                <span>distance <strong>${distanceToTarget(state.currentVertex)}</strong></span>
                <span>walk steps <strong>${state.currentSteps.toLocaleString("en-GB")}</strong></span>
              </div>
              <div class="p25-simulation-controls" aria-label="Random walk controls">
                <button class="secondary-button" type="button" data-p25-action="step">${state.currentVertex === TARGET ? "New walk" : "One step"}</button>
                <button class="primary-button" type="button" data-p25-action="run">Run walk</button>
                <button class="chip-button math2-chip" type="button" data-p25-action="batch" data-p25-size="100">Run 100</button>
                <button class="chip-button math2-chip" type="button" data-p25-action="batch" data-p25-size="10000">Run 10,000</button>
                <button class="ghost-button" type="button" data-p25-action="reset">Reset</button>
              </div>
              <p class="p25-simulation-notice ${state.guardTriggered ? "is-alert" : ""}" role="${state.guardTriggered ? "alert" : "status"}">${escapeHtml(state.simulationNotice)}</p>
              <div class="math2-metrics p25-metrics" aria-label="Simulation summary">
                <div class="math2-metric"><span>completed</span><strong>${state.trials.toLocaleString("en-GB")}</strong></div>
                <div class="math2-metric"><span>running mean</span><strong>${mean === null ? "—" : mean.toFixed(3)}</strong></div>
                <div class="math2-metric"><span>last walk</span><strong>${state.lastWalk === null ? "—" : state.lastWalk.toLocaleString("en-GB")}</strong></div>
                <div class="math2-metric"><span>shortest possible</span><strong>3</strong></div>
              </div>
              ${histogramMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p25-coach">
            <div class="coach-kicker">Make an estimate</div>
            <p class="coach-question">How many edges does the ant traverse on average?</p>
            <form class="p25-answer-form" data-p25-answer-form>
              <label class="math2-control-label" for="p25-answer">Expected number of edges</label>
              <div class="p25-answer-row">
                <input id="p25-answer" class="estimate-input" inputmode="decimal" autocomplete="off" value="${escapeHtml(state.answer)}" placeholder="e.g. 8" />
                <button class="primary-button" type="submit">Check</button>
              </div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p25-help-row">
              <button class="secondary-button" type="button" data-p25-action="hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-p25-action="reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="math2-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function bind({ render: rerender }) {
    document.querySelectorAll("[data-p25-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.p25Action;
        if (action === "reset") state = initialState();
        if (action === "view") state.view = control.dataset.p25View === "layers" ? "layers" : "cube";
        if (action === "step") stepCurrentWalk();
        if (action === "run") runCurrentWalk();
        if (action === "batch") runBatch(Number(control.dataset.p25Size));
        if (action === "hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "reveal") state.revealed = true;
        rerender();
        if (action === "reveal") window.requestAnimationFrame(() => document.querySelector("#p25-solution-heading")?.focus());
      });
    });

    const answerInput = document.querySelector("#p25-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = event.currentTarget.value; });

    document.querySelector("[data-p25-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = event.currentTarget.querySelector("input")?.value.trim() || "";
      const answer = Number(state.answer.replaceAll(",", ""));
      if (!state.answer || !Number.isFinite(answer)) {
        state.feedback = "Enter a numerical expectation in edges.";
        state.feedbackTone = "warn";
        state.committed = false;
      } else if (Math.abs(answer - 10) <= 0.01) {
        state.feedback = "Exactly. The expected walk is 10 edges, even though the shortest route uses only 3.";
        state.feedbackTone = "success";
        state.committed = true;
      } else if (Math.abs(answer - 3) <= 0.01) {
        state.feedback = "Three is the shortest possible route. The expectation must also include walks that backtrack and revisit vertices.";
        state.feedbackTone = "warn";
        state.committed = true;
      } else {
        state.feedback = answer < 10
          ? "That is below the exact expectation. Account for returns to the distance-2 and distance-3 layers."
          : "That is above the exact expectation. Use one equation for each distance layer rather than extrapolating from a small batch.";
        state.feedbackTone = "neutral";
        state.committed = true;
      }
      rerender();
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
