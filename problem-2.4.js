(function registerAntCubeOnePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const vertices = {
    "000": { x: 120, y: 300 },
    "100": { x: 315, y: 300 },
    "010": { x: 120, y: 115 },
    "110": { x: 315, y: 115 },
    "001": { x: 225, y: 245 },
    "101": { x: 420, y: 245 },
    "011": { x: 225, y: 60 },
    "111": { x: 420, y: 60 },
  };

  const edges = Object.keys(vertices).flatMap((vertex) => [0, 1, 2]
    .filter((bit) => vertex[bit] === "0")
    .map((bit) => {
      const neighbour = vertex.slice(0, bit) + "1" + vertex.slice(bit + 1);
      return [vertex, neighbour];
    }));

  const directions = ["x", "y", "z"];
  const shortestSignatures = ["xyz", "xzy", "yxz", "yzx", "zxy", "zyx"];
  const hints = [
    "The start 000 and target 111 differ in three coordinates. Each edge changes exactly one coordinate.",
    "A shortest route must change x, y and z once each, with no backward step.",
    "Count the possible orders of three distinct moves: 3! = 3 × 2 × 1.",
  ];

  const initialState = () => ({
    path: ["000"],
    discovered: [],
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "is-neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function currentVertex() {
    return state.path[state.path.length - 1];
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function adjacent(a, b) {
    return [...a].filter((digit, index) => digit !== b[index]).length === 1;
  }

  function directionBetween(a, b) {
    const index = [...a].findIndex((digit, position) => digit !== b[position]);
    return directions[index];
  }

  function routeSignature(path = state.path) {
    return path.slice(1).map((vertex, index) => directionBetween(path[index], vertex)).join("");
  }

  function routeStatus() {
    if (currentVertex() !== "111") return "walking";
    return state.path.length === 4 ? "shortest" : "longer";
  }

  function snapshot() {
    return JSON.stringify({
      problem: "2.4",
      contentStatus: "independently reconstructed activity; not source wording",
      currentVertex: currentVertex(),
      path: state.path,
      edgeCount: state.path.length - 1,
      signature: routeSignature(),
      shortestRoutesDiscovered: state.discovered,
      answer: state.estimate || null,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function edgeMarkup() {
    return edges.map(([a, b]) => {
      const traversedIndex = state.path.slice(1).findIndex((vertex, index) =>
        (state.path[index] === a && vertex === b) || (state.path[index] === b && vertex === a));
      return `<line class="p24-edge ${traversedIndex >= 0 ? "is-traversed" : ""}" x1="${vertices[a].x}" y1="${vertices[a].y}" x2="${vertices[b].x}" y2="${vertices[b].y}" />`;
    }).join("");
  }

  function routeMarkup() {
    if (state.path.length < 2) return "";
    const points = state.path.map((vertex) => `${vertices[vertex].x},${vertices[vertex].y}`).join(" ");
    return `<polyline class="p24-route" points="${points}" />`;
  }

  function vertexMarkup() {
    const current = currentVertex();
    return Object.entries(vertices).map(([label, point]) => {
      const canMove = current !== "111" && adjacent(current, label);
      const classes = [
        "p24-vertex",
        label === "000" ? "is-start" : "",
        label === "111" ? "is-target" : "",
        label === current ? "is-current" : "",
        canMove ? "can-move" : "",
      ].filter(Boolean).join(" ");
      return `
        <g class="${classes}" transform="translate(${point.x} ${point.y})">
          <circle r="${label === current ? 13 : 9}" />
          <text x="0" y="${label === "111" ? -19 : 27}" text-anchor="middle">${label}</text>
          ${canMove ? `<circle class="p24-hit" r="22" data-p24-vertex="${label}" role="button" tabindex="0" aria-label="Move ant to vertex ${label}" />` : ""}
        </g>`;
    }).join("");
  }

  function cubeMarkup() {
    return `
      <div class="p24-cube-wrap">
        <svg class="p24-cube" viewBox="0 0 540 360" role="img" aria-label="Cube graph. Ant at ${currentVertex()}, target at 111.">
          ${edgeMarkup()}
          ${routeMarkup()}
          ${vertexMarkup()}
        </svg>
        <div class="p24-cube-legend"><span><i class="is-ant"></i>ant</span><span><i class="is-target"></i>target</span></div>
      </div>`;
  }

  function routeStrip() {
    const moves = state.path.slice(1).map((vertex, index) => ({
      from: state.path[index],
      to: vertex,
      direction: directionBetween(state.path[index], vertex),
    }));
    return `
      <div class="p24-route-strip" aria-live="polite">
        <span class="p24-route-start">000</span>
        ${moves.map((move) => `<span class="p24-route-move"><i>${move.direction}</i><b>→ ${move.to}</b></span>`).join("")}
      </div>`;
  }

  function statusMarkup() {
    const status = routeStatus();
    if (status === "shortest") return `<div class="math2-feedback is-success">Shortest route found in 3 moves: <strong>${routeSignature()}</strong>. ${state.discovered.length}/6 orders discovered.</div>`;
    if (status === "longer") return `<div class="math2-feedback is-warn">You reached 111 in ${state.path.length - 1} moves. A shortest route uses exactly 3.</div>`;
    return `<div class="math2-feedback is-neutral">Choose any highlighted neighbouring vertex. Each edge flips one bit.</div>`;
  }

  function discoveredMarkup() {
    return `<div class="p24-discovered" aria-label="Six possible shortest move orders">${shortestSignatures.map((signature) => `
      <span class="${state.discovered.includes(signature) || state.revealed ? "is-found" : ""}">${state.discovered.includes(signature) || state.revealed ? signature : "? ? ?"}</span>`).join("")}</div>`;
  }

  function hintsMarkup() {
    return hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint-card"><strong>Hint ${index + 1}</strong><p>${hint}</p></div>`).join("");
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution">
        <h3>Three moves, six orders</h3>
        <p>Every cube edge changes one of the three binary coordinates. Going from 000 to 111 requires changing x, y and z. A shortest route changes each exactly once.</p>
        <div class="math2-equation">number of shortest routes = 3! = 3 × 2 × 1 = 6</div>
        <p>The six routes are the six possible move orders: xyz, xzy, yxz, yzx, zxy and zyx.</p>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function render() {
    const debug = new URLSearchParams(window.location.search).get("debug") === "1";
    const resetMarkup = '<button class="ghost-button" type="button" data-p24-action="reset-all">Reset</button>';
    return `
      <main class="book-shell math2-shell p24-shell">
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Reconstructed mathematics</span></div>
          <div class="book-progress">${problemProgress("2.4")}</div>
          ${problemHeaderActions("2.4", resetMarkup)}
        </header>
        <div class="book-spread math2-spread p24-spread">
          <article class="book-page">
            <div class="problem-number">Problem 2.4</div>
            <h1 class="book-title math2-title">Ant on a cube I</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">An ant starts at vertex 000 of a cube and may walk only along its edges. It wants to reach the opposite vertex 111 using the fewest possible edges. How many distinct shortest routes can it take?</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem's title and difficulty only. This graph-theory trilogy is original; it is not the book's wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Count before listing</div><p>How many coordinates must change—and how many different orders can those changes occur in?</p></section>
            <div class="p24-bit-key"><span><b>0 → 1</b> along x</span><span><b>0 → 1</b> along y</span><span><b>0 → 1</b> along z</span></div>
          </article>
          <section class="book-page book-stage math2-stage p24-stage">
            <div class="math2-stage-card">
              <div class="math2-stage-heading"><div><div class="eyebrow">Cube graph</div><h2>Walk the edges</h2></div><p>Try a route. Restart the ant to find a different order without losing the routes already discovered.</p></div>
              ${cubeMarkup()}
              ${routeStrip()}
              ${statusMarkup()}
              <div class="math2-control-row is-split">
                <button class="secondary-button" type="button" data-p24-action="restart">Restart this walk</button>
                <span class="p24-step-count"><strong>${state.path.length - 1}</strong> edge${state.path.length === 2 ? "" : "s"}</span>
              </div>
            </div>
          </section>
          <aside class="book-page book-coach p24-coach">
            <div class="coach-kicker">Route counter</div>
            <p class="coach-question">How many distinct shortest routes lead from 000 to 111?</p>
            ${discoveredMarkup()}
            <form data-p24-answer-form>
              <label class="math2-control-label" for="p24-answer">Number of routes</label>
              <div class="p24-answer-row"><input id="p24-answer" class="estimate-input" inputmode="numeric" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="Your count" /><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row">
              <button class="secondary-button" type="button" data-p24-action="hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-p24-action="reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debug ? `<pre class="state-surface math2-debug">${snapshot()}</pre>` : ""}
          </aside>
        </div>
        ${problemNav("2.4")}
      </main>`;
  }

  function finishRouteIfNeeded() {
    if (currentVertex() !== "111" || state.path.length !== 4) return;
    const signature = routeSignature();
    if (!state.discovered.includes(signature)) state.discovered = [...state.discovered, signature];
  }

  function bind({ render: rerender }) {
    document.querySelector("#p24-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
    });

    document.querySelectorAll("[data-p24-vertex]").forEach((control) => {
      const move = () => {
        const target = control.dataset.p24Vertex;
        if (currentVertex() === "111" || !adjacent(currentVertex(), target)) return;
        state.path = [...state.path, target];
        finishRouteIfNeeded();
        state.feedback = "";
        rerender();
      };
      control.addEventListener("click", move);
      control.addEventListener("keydown", (event) => {
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        move();
      });
    });

    document.querySelectorAll("[data-p24-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.p24Action;
        if (action === "reset-all") state = initialState();
        if (action === "restart") {
          state.path = ["000"];
          state.feedback = "";
        }
        if (action === "hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "reveal") state.revealed = true;
        rerender();
      });
    });

    document.querySelector("[data-p24-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.estimate = event.currentTarget.querySelector("input")?.value.trim() || "";
      const answer = Number(state.estimate);
      state.committed = true;
      if (!/^\d+$/.test(state.estimate)) {
        state.feedback = "Enter a whole-number count.";
        state.feedbackTone = "is-warn";
      } else if (answer === 6) {
        state.feedback = "Exactly. Three distinct coordinate changes can be ordered in 3! = 6 ways.";
        state.feedbackTone = "is-success";
      } else if (answer < 6) {
        state.feedback = "There are more. List every order of x, y and z without repeating a direction.";
        state.feedbackTone = "is-neutral";
      } else {
        state.feedback = "That count includes longer or repeated routes. A shortest route changes each coordinate exactly once.";
        state.feedbackTone = "is-neutral";
      }
      rerender();
    });
  }

  window.poveyProblemPages["2.4"] = { render, bind };
})();
