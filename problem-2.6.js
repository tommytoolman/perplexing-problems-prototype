(function registerAntCubePostmanPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "2.6";
  const START = "000";
  const vertices = Object.freeze({
    "000": Object.freeze({ x: 120, y: 300 }),
    "100": Object.freeze({ x: 315, y: 300 }),
    "010": Object.freeze({ x: 120, y: 115 }),
    "110": Object.freeze({ x: 315, y: 115 }),
    "001": Object.freeze({ x: 225, y: 245 }),
    "101": Object.freeze({ x: 420, y: 245 }),
    "011": Object.freeze({ x: 225, y: 60 }),
    "111": Object.freeze({ x: 420, y: 60 }),
  });
  const edges = Object.freeze(Object.keys(vertices).flatMap((vertex) => [0, 1, 2]
    .filter((bit) => vertex[bit] === "0")
    .map((bit) => {
      const neighbour = vertex.slice(0, bit) + "1" + vertex.slice(bit + 1);
      return Object.freeze([vertex, neighbour]);
    })));
  const edgeKey = (first, second) => [first, second].sort().join("-");
  const edgeKeys = Object.freeze(edges.map(([first, second]) => edgeKey(first, second)));
  const edgeKeySet = new Set(edgeKeys);
  const edgeByKey = Object.freeze(Object.fromEntries(edges.map((edge) => [edgeKey(...edge), edge])));
  const EXAMPLE_MATCHING = Object.freeze([
    "000-100",
    "010-110",
    "001-101",
    "011-111",
  ]);
  const EXAMPLE_ROUTE = Object.freeze([
    "000", "100", "110", "010", "000", "001", "101", "111", "011",
    "010", "110", "111", "011", "001", "101", "100", "000",
  ]);
  const hints = Object.freeze([
    "In a closed walk, every arrival at a vertex is paired with a departure. The traversal count at every vertex must therefore be even.",
    "If each cube edge were used exactly once, all eight vertices would have degree 3—odd—so a 12-step closed tour cannot exist.",
    "One repeated edge changes the parity at two endpoints. At least four repeats are needed; try choosing four disjoint edges that touch every vertex once.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-p26-action="reset-all">Reset</button>';

  const initialState = () => ({
    mode: "walk",
    walk: [START],
    duplicateEdges: [],
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
    isPlaying: false,
  });

  let state = initialState();
  let animationToken = 0;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function adjacent(first, second) {
    return [...first].filter((digit, index) => digit !== second[index]).length === 1;
  }

  function currentVertex() {
    return state.walk.at(-1);
  }

  function walkEdgeCounts(path = state.walk) {
    const counts = Object.fromEntries(edgeKeys.map((key) => [key, 0]));
    for (let index = 1; index < path.length; index += 1) {
      const key = edgeKey(path[index - 1], path[index]);
      if (key in counts) counts[key] += 1;
    }
    return counts;
  }

  function walkSummary(path = state.walk) {
    const counts = walkEdgeCounts(path);
    const transitionsValid = path.every((vertex, index) => index === 0 || adjacent(path[index - 1], vertex));
    const covered = edgeKeys.filter((key) => counts[key] > 0).length;
    const steps = Math.max(0, path.length - 1);
    const repeats = Math.max(0, steps - covered);
    const closed = steps > 0 && path[0] === path.at(-1);
    const complete = transitionsValid && covered === edges.length && closed;
    return {
      counts,
      transitionsValid,
      covered,
      steps,
      repeats,
      closed,
      complete,
      optimal: complete && steps === 16,
    };
  }

  function selectedIncidentCount(vertex) {
    return state.duplicateEdges.filter((key) => edgeByKey[key].includes(vertex)).length;
  }

  function vertexIsEven(vertex) {
    return (3 + selectedIncidentCount(vertex)) % 2 === 0;
  }

  function evenVertexCount() {
    return Object.keys(vertices).filter(vertexIsEven).length;
  }

  function validPerfectMatching() {
    return state.duplicateEdges.length === 4 && evenVertexCount() === 8;
  }

  function buildEulerCircuit(duplicates = state.duplicateEdges) {
    const multiedges = [
      ...edges.map(([first, second]) => [first, second]),
      ...duplicates.map((key) => [...edgeByKey[key]]),
    ];
    const adjacency = Object.fromEntries(Object.keys(vertices).map((vertex) => [vertex, []]));
    multiedges.forEach(([first, second], index) => {
      adjacency[first].push({ vertex: second, index });
      adjacency[second].push({ vertex: first, index });
    });

    const used = multiedges.map(() => false);
    const stack = [START];
    const circuit = [];
    while (stack.length) {
      const vertex = stack.at(-1);
      const next = adjacency[vertex].find((candidate) => !used[candidate.index]);
      if (next) {
        used[next.index] = true;
        stack.push(next.vertex);
      } else {
        circuit.push(stack.pop());
      }
    }
    return circuit.reverse();
  }

  function exampleRouteVerified() {
    const summary = walkSummary(EXAMPLE_ROUTE);
    const repeated = edgeKeys.filter((key) => summary.counts[key] === 2).sort();
    return summary.optimal
      && summary.transitionsValid
      && repeated.length === 4
      && repeated.every((key, index) => key === [...EXAMPLE_MATCHING].sort()[index]);
  }

  function cancelAnimation() {
    animationToken += 1;
    state.isPlaying = false;
  }

  function playExampleRoute(rerender) {
    cancelAnimation();
    const token = animationToken;
    state.mode = "walk";
    state.walk = [EXAMPLE_ROUTE[0]];
    state.isPlaying = true;
    rerender();

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      state.walk = [...EXAMPLE_ROUTE];
      state.isPlaying = false;
      rerender();
      return;
    }

    let index = 1;
    const tick = () => {
      if (token !== animationToken) return;
      state.walk = [...state.walk, EXAMPLE_ROUTE[index]];
      index += 1;
      if (index >= EXAMPLE_ROUTE.length) {
        state.isPlaying = false;
        rerender();
        return;
      }
      rerender();
      window.setTimeout(tick, 150);
    };
    window.setTimeout(tick, 150);
  }

  function moveAnt(target, rerender) {
    if (state.isPlaying || !adjacent(currentVertex(), target)) return;
    cancelAnimation();
    state.walk = [...state.walk, target];
    rerender();
  }

  function walkStatus() {
    const summary = walkSummary();
    if (summary.optimal) {
      return `<div class="math2-feedback is-success p26-activity-status"><strong>Optimal inspection complete.</strong> All 12 edges, back at 000, in exactly 16 moves.</div>`;
    }
    if (summary.complete) {
      return `<div class="math2-feedback is-neutral p26-activity-status"><strong>Valid closed inspection:</strong> ${summary.steps} moves. It can be shortened by ${summary.steps - 16}.</div>`;
    }
    if (summary.covered === edges.length && !summary.closed) {
      return `<div class="math2-feedback is-warn p26-activity-status">Every edge has been inspected, but the ant must still return to 000.</div>`;
    }
    if (!summary.steps) {
      return `<div class="math2-feedback is-neutral p26-activity-status">Tap a highlighted neighbouring vertex. Teal means inspected; gold means repeated.</div>`;
    }
    return `<div class="math2-feedback is-neutral p26-activity-status">${summary.covered} of 12 edges inspected. The ant is at ${currentVertex()}.</div>`;
  }

  function parityStatus() {
    const selected = state.duplicateEdges.length;
    const even = evenVertexCount();
    if (validPerfectMatching()) {
      return `<div class="math2-feedback is-success p26-activity-status"><strong>Perfect matching found.</strong> Four repeats repair all eight odd vertices, so a 16-step Euler circuit exists.</div>`;
    }
    if (even === 8) {
      return `<div class="math2-feedback is-neutral p26-activity-status">All vertices are even, but ${selected} repeated edges give a ${12 + selected}-step tour. Four repeats are enough.</div>`;
    }
    if (selected === 4) {
      return `<div class="math2-feedback is-warn p26-activity-status">Four edges are selected, but they do not touch every vertex exactly once. ${8 - even} vertices remain odd.</div>`;
    }
    return `<div class="math2-feedback is-neutral p26-activity-status">${selected} repeated edge${selected === 1 ? "" : "s"} selected · ${even}/8 vertices even.</div>`;
  }

  function walkCube() {
    const summary = walkSummary();
    const current = currentVertex();
    return `
      <div class="p26-cube-wrap">
        <svg class="p26-cube" viewBox="0 0 540 360" role="img" aria-labelledby="p26-walk-title p26-walk-desc">
          <title id="p26-walk-title">Cube edge inspection walk</title>
          <desc id="p26-walk-desc">The ant is at ${current}. ${summary.covered} of 12 edges have been inspected in ${summary.steps} moves.</desc>
          <g class="p26-edges">
            ${edges.map(([first, second]) => {
              const key = edgeKey(first, second);
              const count = summary.counts[key];
              const classes = count > 1 ? "is-repeated" : count === 1 ? "is-covered" : "";
              return `<line class="p26-edge ${classes}" x1="${vertices[first].x}" y1="${vertices[first].y}" x2="${vertices[second].x}" y2="${vertices[second].y}" />`;
            }).join("")}
          </g>
          ${Object.entries(vertices).map(([vertex, point]) => {
            const canMove = !state.isPlaying && adjacent(current, vertex);
            const classes = [
              "p26-vertex",
              vertex === START ? "is-start" : "",
              vertex === current ? "is-current" : "",
              canMove ? "can-move" : "",
            ].filter(Boolean).join(" ");
            return `
              <g class="${classes}" transform="translate(${point.x} ${point.y})">
                <circle r="${vertex === current ? 13 : 9}" />
                <text x="0" y="${point.y < 90 ? -19 : 27}" text-anchor="middle">${vertex}</text>
                ${canMove ? `<circle class="p26-node-hit" r="23" tabindex="0" role="button" data-p26-move="${vertex}" aria-label="Walk to adjacent vertex ${vertex}" />` : ""}
              </g>`;
          }).join("")}
        </svg>
        <div class="p26-cube-legend" aria-hidden="true"><span><i class="is-covered"></i>inspected</span><span><i class="is-repeated"></i>repeated</span><span><i class="is-ant"></i>ant</span></div>
      </div>`;
  }

  function parityCube() {
    return `
      <div class="p26-cube-wrap p26-parity-wrap">
        <svg class="p26-cube" viewBox="0 0 540 360" role="img" aria-labelledby="p26-parity-title p26-parity-desc">
          <title id="p26-parity-title">Parity planner for repeated cube edges</title>
          <desc id="p26-parity-desc">${state.duplicateEdges.length} edges selected to repeat. ${evenVertexCount()} of eight vertices now have even traversal degree.</desc>
          <g class="p26-edges">
            ${edges.map(([first, second]) => {
              const key = edgeKey(first, second);
              const selected = state.duplicateEdges.includes(key) ? "is-selected" : "";
              return `<line class="p26-edge ${selected}" x1="${vertices[first].x}" y1="${vertices[first].y}" x2="${vertices[second].x}" y2="${vertices[second].y}" />`;
            }).join("")}
          </g>
          <g class="p26-edge-hits">
            ${edges.map(([first, second]) => {
              const key = edgeKey(first, second);
              const selected = state.duplicateEdges.includes(key);
              return `<line x1="${vertices[first].x}" y1="${vertices[first].y}" x2="${vertices[second].x}" y2="${vertices[second].y}" tabindex="0" role="button" data-p26-duplicate="${key}" aria-label="${selected ? "Remove" : "Duplicate"} edge ${first} to ${second}" aria-pressed="${selected}" />`;
            }).join("")}
          </g>
          ${Object.entries(vertices).map(([vertex, point]) => {
            const even = vertexIsEven(vertex);
            const badgeY = point.y < 90 ? 22 : -24;
            return `
              <g class="p26-vertex ${vertex === START ? "is-start" : ""}" transform="translate(${point.x} ${point.y})">
                <circle r="10" />
                <text x="0" y="${point.y < 90 ? -18 : 28}" text-anchor="middle">${vertex}</text>
                <g class="p26-parity-badge ${even ? "is-even" : "is-odd"}" transform="translate(19 ${badgeY})">
                  <rect x="-17" y="-9" width="34" height="18" rx="9" />
                  <text x="0" y="3" text-anchor="middle">${even ? "even" : "odd"}</text>
                </g>
              </g>`;
          }).join("")}
        </svg>
        <div class="p26-parity-instruction">Tap an edge to add or remove one extra traversal.</div>
      </div>`;
  }

  function walkPanel() {
    const summary = walkSummary();
    return `
      ${walkCube()}
      <div class="math2-metrics p26-metrics" aria-label="Inspection progress">
        <div class="math2-metric"><span>edges inspected</span><strong>${summary.covered} / 12</strong></div>
        <div class="math2-metric"><span>moves</span><strong>${summary.steps}</strong></div>
        <div class="math2-metric"><span>repeats</span><strong>${summary.repeats}</strong></div>
        <div class="math2-metric"><span>current vertex</span><strong>${currentVertex()}</strong></div>
      </div>
      ${walkStatus()}
      <div class="p26-stage-actions">
        <button class="secondary-button" type="button" data-p26-action="undo" ${state.walk.length <= 1 || state.isPlaying ? "disabled" : ""}>Undo move</button>
        <button class="ghost-button" type="button" data-p26-action="reset-walk" ${state.isPlaying ? "disabled" : ""}>Reset walk</button>
        <button class="primary-button" type="button" data-p26-action="play-optimal" ${state.isPlaying ? "disabled" : ""}>${state.isPlaying ? "Playing…" : "Play optimal tour"}</button>
      </div>`;
  }

  function parityPanel() {
    const valid = validPerfectMatching();
    return `
      ${parityCube()}
      <div class="math2-metrics p26-metrics" aria-label="Parity plan summary">
        <div class="math2-metric"><span>extra traversals</span><strong>${state.duplicateEdges.length}</strong></div>
        <div class="math2-metric"><span>projected length</span><strong>${12 + state.duplicateEdges.length}</strong></div>
        <div class="math2-metric"><span>even vertices</span><strong>${evenVertexCount()} / 8</strong></div>
        <div class="math2-metric"><span>odd vertices</span><strong>${8 - evenVertexCount()}</strong></div>
      </div>
      ${parityStatus()}
      <div class="p26-stage-actions">
        <button class="secondary-button" type="button" data-p26-action="example-matching">Show one matching</button>
        <button class="ghost-button" type="button" data-p26-action="clear-duplicates" ${state.duplicateEdges.length ? "" : "disabled"}>Clear selection</button>
        <button class="primary-button" type="button" data-p26-action="build-circuit" ${valid ? "" : "disabled"}>Build 16-step circuit</button>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="math2-feedback is-${state.feedbackTone}" role="status">${escapeHtml(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p26-hints">${hints.slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p26-solution" aria-labelledby="p26-solution-heading">
        <h3 id="p26-solution-heading" tabindex="-1">Parity adds four unavoidable steps</h3>
        <p>Using every edge once leaves all eight cube vertices with odd degree 3. A closed traversal needs even degree at every vertex.</p>
        <p>Each repeated edge changes the parity of its two endpoints. Repairing eight odd vertices therefore needs at least 8 ÷ 2 = 4 extra traversals.</p>
        <div class="math2-equation">12 original edges + 4 repeats = 16</div>
        <p>Four disjoint edges form a perfect matching and touch every vertex once, making every degree 4. The connected augmented graph is therefore Eulerian.</p>
        <div class="p26-matching-list" aria-label="An example perfect matching"><span>000–100</span><span>010–110</span><span>001–101</span><span>011–111</span></div>
        <p class="p26-route-proof"><strong>One optimal circuit:</strong><br />${EXAMPLE_ROUTE.join(" → ")}</p>
      </section>`;
  }

  function snapshot() {
    const summary = walkSummary();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed graph-theory trilogy; not source wording",
      mode: state.mode,
      walk: state.walk,
      walkSteps: summary.steps,
      coveredEdges: summary.covered,
      repeatedTraversals: summary.repeats,
      walkClosed: summary.closed,
      walkComplete: summary.complete,
      walkOptimal: summary.optimal,
      selectedDuplicateEdges: state.duplicateEdges,
      evenVertices: evenVertexCount(),
      validPerfectMatching: validPerfectMatching(),
      exampleRouteVerified: exampleRouteVerified(),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function debugMarkup() {
    const panel = debugPanel("Development state", snapshot());
    return panel ? `<div class="math2-debug">${panel}</div>` : "";
  }

  function render() {
    return `
      <main class="book-shell math2-shell p26-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread math2-spread p26-spread">
          <article class="book-page p26-problem-page">
            <div class="problem-number">Problem 2.6</div>
            <h1 class="book-title math2-title p26-title">Ant on a cube III</h1>
            <div class="difficulty" aria-label="Four star difficulty">★★★★</div>
            <p class="problem-copy">A maintenance ant starts at vertex 000 of a unit cube. It must inspect every one of the cube’s 12 edges by walking along it at least once, and it must finish back at 000. Edges may be repeated.</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem's title and difficulty only. This graph-theory trilogy is original; it is not the book's wording or solution.</p>
            <section class="prediction-box">
              <div class="eyebrow">The route-inspection question</div>
              <p>Twelve edges suggests twelve moves—but can a closed walk use each edge exactly once when every vertex has degree 3?</p>
            </section>
          </article>

          <section class="book-page book-stage math2-stage p26-stage" aria-labelledby="p26-stage-title">
            <div class="math2-stage-card p26-stage-card">
              <div class="math2-stage-heading p26-stage-heading">
                <div><div class="eyebrow">Cube postman laboratory</div><h2 id="p26-stage-title">Cover every edge and close the tour</h2></div>
                <div class="p26-mode-tabs" role="group" aria-label="Activity mode">
                  <button class="chip-button math2-chip ${state.mode === "walk" ? "active" : ""}" type="button" data-p26-action="mode" data-p26-mode="walk" aria-pressed="${state.mode === "walk"}">Walk</button>
                  <button class="chip-button math2-chip ${state.mode === "parity" ? "active" : ""}" type="button" data-p26-action="mode" data-p26-mode="parity" aria-pressed="${state.mode === "parity"}">Parity planner</button>
                </div>
              </div>
              ${state.mode === "walk" ? walkPanel() : parityPanel()}
            </div>
          </section>

          <aside class="book-page book-coach p26-coach">
            <div class="coach-kicker">Prove the minimum</div>
            <p class="coach-question">What is the least possible number of edge traversals?</p>
            <form class="p26-answer-form" data-p26-answer-form>
              <label class="math2-control-label" for="p26-answer">Minimum tour length</label>
              <div class="p26-answer-row">
                <input id="p26-answer" class="estimate-input" inputmode="numeric" autocomplete="off" value="${escapeHtml(state.estimate)}" placeholder="e.g. 14" />
                <button class="primary-button" type="submit">Check</button>
              </div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p26-help-row">
              <button class="secondary-button" type="button" data-p26-action="hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-p26-action="reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugMarkup()}
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function toggleDuplicate(key) {
    if (!edgeKeySet.has(key)) return;
    state.duplicateEdges = state.duplicateEdges.includes(key)
      ? state.duplicateEdges.filter((candidate) => candidate !== key)
      : [...state.duplicateEdges, key];
  }

  function bindActivation(control, callback) {
    control.addEventListener("click", callback);
    control.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      callback();
    });
  }

  function bind({ render: rerender }) {
    document.querySelectorAll("[data-p26-move]").forEach((control) => {
      bindActivation(control, () => moveAnt(control.dataset.p26Move, rerender));
    });

    document.querySelectorAll("[data-p26-duplicate]").forEach((control) => {
      bindActivation(control, () => {
        cancelAnimation();
        toggleDuplicate(control.dataset.p26Duplicate);
        rerender();
      });
    });

    document.querySelectorAll("[data-p26-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.p26Action;
        if (action === "play-optimal") {
          playExampleRoute(rerender);
          return;
        }
        cancelAnimation();
        if (action === "reset-all") state = initialState();
        if (action === "mode") state.mode = control.dataset.p26Mode === "parity" ? "parity" : "walk";
        if (action === "undo" && state.walk.length > 1) state.walk = state.walk.slice(0, -1);
        if (action === "reset-walk") state.walk = [START];
        if (action === "clear-duplicates") state.duplicateEdges = [];
        if (action === "example-matching") state.duplicateEdges = [...EXAMPLE_MATCHING];
        if (action === "build-circuit" && validPerfectMatching()) {
          state.walk = buildEulerCircuit();
          state.mode = "walk";
        }
        if (action === "hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "reveal") state.revealed = true;
        rerender();
        if (action === "reveal") window.requestAnimationFrame(() => document.querySelector("#p26-solution-heading")?.focus());
      });
    });

    const answerInput = document.querySelector("#p26-answer");
    answerInput?.addEventListener("input", (event) => { state.estimate = event.currentTarget.value; });

    document.querySelector("[data-p26-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.estimate = event.currentTarget.querySelector("input")?.value.trim() || "";
      const answer = Number(state.estimate.replaceAll(",", ""));
      if (!state.estimate || !Number.isFinite(answer)) {
        state.feedback = "Enter a whole number of edge traversals.";
        state.feedbackTone = "warn";
        state.committed = false;
      } else if (Math.abs(answer - 16) <= 0.001) {
        state.feedback = "Exactly. Four unavoidable repeats turn the 12-edge cube into a 16-step Euler circuit.";
        state.feedbackTone = "success";
        state.committed = true;
      } else if (Math.abs(answer - 12) <= 0.001) {
        state.feedback = "Twelve uses every edge once, but all eight degree-3 vertices are odd, so that walk cannot close.";
        state.feedbackTone = "warn";
        state.committed = true;
      } else if (answer < 16) {
        state.feedback = "That is too short. A closed traversal must repair the parity of all eight odd vertices.";
        state.feedbackTone = "neutral";
        state.committed = true;
      } else {
        state.feedback = "That length can describe a valid tour, but four carefully chosen repeats achieve a shorter one.";
        state.feedbackTone = "neutral";
        state.committed = true;
      }
      rerender();
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
