(function registerFallingRaindropPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const BOARD_ORIGIN = 30;
  const BOARD_SIZE = 540;
  const CENTRE = 300;
  const TIE_EPSILON = 1e-6;
  const EXACT_PROBABILITY = (4 * Math.SQRT2 - 5) / 3;
  const WEDGE_LIMIT = (Math.SQRT2 - 1) / 2;
  const hints = Object.freeze([
    "Use the square's eight symmetries. In the lower-right wedge, write the displacement from the centre as (u,v), with 0 ≤ v ≤ u ≤ 1/2.",
    "In that wedge the right edge is nearest, so its distance is 1/2−u. The centre is √(u²+v²) away.",
    "Square the positive distances: √(u²+v²) < 1/2−u becomes u < 1/4−v².",
    "The curve meets u=v at α=(√2−1)/2. Integrate from u=v to u=1/4−v² for 0≤v≤α, then multiply by 8.",
  ]);
  const stages = Object.freeze([
    { label: "1. Explore", title: "Compare two distances", copy: "Move the drop. Its nearest edge can change, but its centre distance is always radial." },
    { label: "2. Exact region", title: "Reveal every successful landing", copy: "The blue curved region contains exactly the points nearer the centre than any edge." },
    { label: "3. Symmetry wedge", title: "One eighth contains the calculation", copy: "Eight congruent wedges reduce the boundary to one parabola and one integral." },
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p27-reset">Reset</button>';

  const initialState = () => ({
    x: 0.68,
    y: 0.62,
    stage: 0,
    sampleSize: 0,
    sampleHits: 0,
    sampleTies: 0,
    sampleDots: [],
    estimate: "",
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
    return Number(value.toFixed(digits)).toString();
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function centreDistance(x = state.x, y = state.y) {
    return Math.hypot(x - 0.5, y - 0.5);
  }

  function nearestEdgeDistance(x = state.x, y = state.y) {
    return Math.min(x, 1 - x, y, 1 - y);
  }

  function classification(x = state.x, y = state.y, epsilon = TIE_EPSILON) {
    const difference = centreDistance(x, y) - nearestEdgeDistance(x, y);
    if (Math.abs(difference) <= epsilon) return "tie";
    return difference < 0 ? "centre" : "edge";
  }

  function classificationCopy(kind = classification()) {
    if (kind === "centre") return "Closer to the centre";
    if (kind === "edge") return "Closer to the nearest edge";
    return "Exactly on the boundary";
  }

  function nearestEdgePoint(x = state.x, y = state.y) {
    const distances = [x, 1 - x, y, 1 - y];
    const edge = distances.indexOf(Math.min(...distances));
    if (edge === 0) return { x: 0, y, label: "left" };
    if (edge === 1) return { x: 1, y, label: "right" };
    if (edge === 2) return { x, y: 0, label: "bottom" };
    return { x, y: 1, label: "top" };
  }

  function boardPoint(x, y) {
    return { x: BOARD_ORIGIN + x * BOARD_SIZE, y: BOARD_ORIGIN + (1 - y) * BOARD_SIZE };
  }

  function regionPath() {
    const points = Array.from({ length: 241 }, (_, index) => {
      const angle = (index / 240) * Math.PI * 2;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const radius = (BOARD_SIZE / 2) / (1 + Math.max(Math.abs(cosine), Math.abs(sine)));
      return `${(CENTRE + radius * cosine).toFixed(2)},${(CENTRE + radius * sine).toFixed(2)}`;
    });
    return `M${points.join(" L")} Z`;
  }

  function wedgeRegionPath() {
    const origin = boardPoint(0.5, 0.5);
    const curve = Array.from({ length: 41 }, (_, index) => {
      const v = (index / 40) * WEDGE_LIMIT;
      const u = 0.25 - v * v;
      return boardPoint(0.5 + u, 0.5 + v);
    });
    return `M${origin.x},${origin.y} L${curve.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" L")} Z`;
  }

  function symmetryLines() {
    const directions = [
      [300, 30], [570, 30], [570, 300], [570, 570],
      [300, 570], [30, 570], [30, 300], [30, 30],
    ];
    return directions.map(([x, y]) => `<line x1="${CENTRE}" y1="${CENTRE}" x2="${x}" y2="${y}" />`).join("");
  }

  function simulationDots() {
    return state.sampleDots.map((point) => {
      const position = boardPoint(point.x, point.y);
      return `<circle class="p27-sample-dot is-${point.kind}" cx="${position.x.toFixed(2)}" cy="${position.y.toFixed(2)}" r="${state.sampleSize === 1 ? 7 : 2.2}" />`;
    }).join("");
  }

  function boardSvg() {
    const drop = boardPoint(state.x, state.y);
    const edge = nearestEdgePoint();
    const edgePoint = boardPoint(edge.x, edge.y);
    const kind = classification();
    const stage = stages[state.stage];
    return `
      <svg class="p27-board-svg" data-p27-board viewBox="0 0 600 600" role="group" aria-labelledby="p27-board-title p27-board-desc">
        <title id="p27-board-title">A movable raindrop on a unit square</title>
        <desc id="p27-board-desc">The drop is at x ${format(state.x, 3)}, y ${format(state.y, 3)}. Its centre distance is ${format(centreDistance(), 4)} and nearest-edge distance is ${format(nearestEdgeDistance(), 4)}. ${classificationCopy(kind)}. Stage ${state.stage + 1}: ${stage.title}.</desc>
        <defs>
          <pattern id="p27-grid" width="54" height="54" patternUnits="userSpaceOnUse">
            <path d="M54 0H0V54" fill="none" stroke="rgba(38,58,156,.12)" stroke-width="1" />
          </pattern>
          <radialGradient id="p27-success-fill" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stop-color="#94e3dd" stop-opacity=".68" />
            <stop offset="100%" stop-color="#3f5bd8" stop-opacity=".27" />
          </radialGradient>
        </defs>
        <rect class="p27-board-paper" x="${BOARD_ORIGIN}" y="${BOARD_ORIGIN}" width="${BOARD_SIZE}" height="${BOARD_SIZE}" rx="8" />
        <rect class="p27-board-grid" x="${BOARD_ORIGIN}" y="${BOARD_ORIGIN}" width="${BOARD_SIZE}" height="${BOARD_SIZE}" rx="8" />
        ${state.stage >= 1 ? `<path class="p27-exact-region" d="${regionPath()}" />` : ""}
        ${state.stage === 2 ? `<g class="p27-symmetry-lines">${symmetryLines()}</g><path class="p27-wedge-region" d="${wedgeRegionPath()}" /><text class="p27-wedge-label" x="455" y="397">one of 8</text>` : ""}
        <g class="p27-samples" aria-hidden="true">${simulationDots()}</g>
        <g class="p27-centre-mark" aria-hidden="true"><circle cx="${CENTRE}" cy="${CENTRE}" r="7" /><line x1="286" y1="300" x2="314" y2="300" /><line x1="300" y1="286" x2="300" y2="314" /><text x="316" y="283">centre</text></g>
        <line class="p27-distance-line is-centre" data-p27-centre-line x1="${drop.x.toFixed(2)}" y1="${drop.y.toFixed(2)}" x2="${CENTRE}" y2="${CENTRE}" />
        <line class="p27-distance-line is-edge" data-p27-edge-line x1="${drop.x.toFixed(2)}" y1="${drop.y.toFixed(2)}" x2="${edgePoint.x.toFixed(2)}" y2="${edgePoint.y.toFixed(2)}" />
        <circle class="p27-edge-point" data-p27-edge-point cx="${edgePoint.x.toFixed(2)}" cy="${edgePoint.y.toFixed(2)}" r="5" />
        <circle class="p27-drop is-${kind}" data-p27-drop-handle cx="${drop.x.toFixed(2)}" cy="${drop.y.toFixed(2)}" r="13" tabindex="0" focusable="true" aria-label="Raindrop at x ${format(state.x, 3)}, y ${format(state.y, 3)}; ${classificationCopy(kind)}. Use arrow keys to move it." />
        <rect class="p27-hit-zone" data-p27-hit-zone x="${BOARD_ORIGIN}" y="${BOARD_ORIGIN}" width="${BOARD_SIZE}" height="${BOARD_SIZE}" rx="8" aria-hidden="true" />
        <g class="p27-axis-labels" aria-hidden="true"><text x="30" y="590">0</text><text x="296" y="590">½</text><text x="564" y="590">1</text><text x="8" y="34">1</text><text x="8" y="304">½</text><text x="8" y="574">0</text></g>
      </svg>`;
  }

  function stageTabs() {
    return `<div class="p27-stage-tabs" role="group" aria-label="Geometry stages">${stages.map((stage, index) => `<button class="chip-button math2-chip ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p27-stage" data-p27-stage="${index}" aria-pressed="${state.stage === index}">${stage.label}</button>`).join("")}</div>`;
  }

  function simulationMarkup() {
    const plotted = state.sampleDots.length;
    const percentage = state.sampleSize ? (state.sampleHits / state.sampleSize) * 100 : 0;
    return `
      <section class="p27-simulation" aria-labelledby="p27-simulation-title">
        <div><span class="math2-control-label" id="p27-simulation-title">Seeded rain experiment</span><p>${state.sampleSize ? `${state.sampleHits.toLocaleString()} of ${state.sampleSize.toLocaleString()} drops landed in the centre-nearer region${state.sampleSize > plotted ? `; ${plotted.toLocaleString()} representative drops are plotted` : ""}.` : "Choose a sample size. The same seed makes every run reproducible."}</p></div>
        <div class="p27-simulation-buttons">
          ${[1, 100, 10000].map((size) => `<button class="chip-button math2-chip ${state.sampleSize === size ? "active" : ""}" type="button" data-problem-action="p27-simulate" data-p27-size="${size}" aria-pressed="${state.sampleSize === size}">${size === 10000 ? "10,000" : size} ${size === 1 ? "drop" : "drops"}</button>`).join("")}
        </div>
        <div class="p27-simulation-result" aria-live="polite"><span>Observed probability</span><strong>${state.sampleSize ? `${format(percentage, 2)}%` : "—"}</strong><small>${state.sampleTies ? `${state.sampleTies} boundary ties` : "boundary ties have probability zero"}</small></div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p27-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="math2-solution p27-solution" aria-labelledby="p27-solution-title">
        <h3 id="p27-solution-title" tabindex="-1">Integrate one symmetry wedge</h3>
        <p>Measure displacement from the centre. In the highlighted wedge, (0≤v≤u≤1/2), and the right edge is nearest.</p>
        <div class="math2-equation">√(u²+v²) &lt; ½−u &nbsp;⇔&nbsp; u &lt; ¼−v²</div>
        <p>The curve meets the diagonal (u=v) where (v²+v−¼=0), so</p>
        <div class="math2-equation">α = (√2−1)/2.</div>
        <p>The successful area in one wedge is the horizontal width between (u=v) and (u=¼−v²):</p>
        <div class="math2-equation p27-integral">A<sub>w</sub> = ∫₀<sup>α</sup>(¼−v²−v)dv = [v/4−v³/3−v²/2]₀<sup>α</sup>.</div>
        <p>There are eight congruent wedges and the square has unit area. Therefore</p>
        <div class="math2-equation p27-final-equation">P = 8A<sub>w</sub> = (4√2−5)/3 ≈ ${format(EXACT_PROBABILITY, 6)} ≈ ${format(EXACT_PROBABILITY * 100, 3)}%.</div>
        <p>Points exactly on the curved boundary are ties, but a curve has zero area, so including or excluding it does not change the probability.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: "2.7",
      provenance: "independently reconstructed from title and difficulty only",
      drop: { x: state.x, y: state.y },
      centreDistance: centreDistance(),
      nearestEdgeDistance: nearestEdgeDistance(),
      classification: classification(),
      stage: state.stage + 1,
      simulation: state.sampleSize ? { seed: 271828, drops: state.sampleSize, hits: state.sampleHits, ties: state.sampleTies } : null,
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
      exactProbability: EXACT_PROBABILITY,
    }, null, 2);
  }

  function render() {
    const kind = classification();
    const stage = stages[state.stage];
    return `
      <main class="book-shell math2-shell p27-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress("2.7")}</div>
          ${problemHeaderActions("2.7", resetMarkup)}
        </header>
        <div class="book-spread math2-spread p27-spread">
          <article class="book-page p27-problem-page">
            <div class="problem-number">Problem 2.7</div>
            <h1 class="book-title math2-title p27-title">A falling raindrop</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">A point-like raindrop lands uniformly at random on a square courtyard. What is the probability that it lands closer to the centre than to its nearest edge?</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — the available source gives only the title and difficulty. This activity is not Povey’s original wording.</p>
            <section class="prediction-box"><div class="eyebrow">Before calculating</div><p>Is the successful region itself a square, a circle, or something curved between the two?</p></section>
            <div class="p27-boundary-note"><strong>Boundary convention</strong><span>An exact tie belongs to neither side here. Ties form a zero-area curve, so the probability is unchanged.</span></div>
          </article>

          <section class="book-page book-stage math2-stage p27-stage" aria-labelledby="p27-stage-heading">
            <div class="math2-stage-card p27-stage-card">
              ${stageTabs()}
              <div class="math2-stage-heading"><div><span class="eyebrow">${stage.label}</span><h2 id="p27-stage-heading">${stage.title}</h2></div><p>${stage.copy}</p></div>
              <div class="p27-board-wrap">${boardSvg()}</div>
              <div class="p27-live-metrics" aria-live="polite">
                <div><span>to centre</span><strong data-p27-live="centre-distance">${format(centreDistance(), 4)}</strong></div>
                <div><span>to nearest edge</span><strong data-p27-live="edge-distance">${format(nearestEdgeDistance(), 4)}</strong></div>
                <div class="is-${kind}" data-p27-status-card><span>landing</span><strong data-p27-live="status">${classificationCopy(kind)}</strong></div>
              </div>
              ${simulationMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p27-coach">
            <div class="coach-kicker">Area becomes probability</div>
            <p class="coach-question">What fraction of the square is nearer the centre?</p>
            <form class="estimate-form p27-answer-form" data-p27-answer-form novalidate>
              <label for="p27-answer">Probability · decimal or percentage</label>
              <div class="estimate-field"><input class="estimate-input" id="p27-answer" inputmode="decimal" type="text" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 0.22 or 22%" /><span>P</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p27-help-row"><button class="secondary-button" type="button" data-problem-action="p27-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p27-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("2.7")}
      </main>`;
  }

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

  function runSimulation(size) {
    const random = mulberry32(271828);
    const stride = Math.max(1, Math.ceil(size / 700));
    const dots = [];
    let hits = 0;
    let ties = 0;
    let first = null;
    for (let index = 0; index < size; index += 1) {
      const x = random();
      const y = random();
      if (!first) first = { x, y };
      const kind = classification(x, y, 1e-12);
      if (kind === "centre") hits += 1;
      if (kind === "tie") ties += 1;
      if (index % stride === 0) dots.push({ x, y, kind });
    }
    state.sampleSize = size;
    state.sampleHits = hits;
    state.sampleTies = ties;
    state.sampleDots = dots;
    if (size === 1 && first) {
      state.x = first.x;
      state.y = first.y;
    }
  }

  function setDrop(x, y, root) {
    state.x = clamp(x, 0, 1);
    state.y = clamp(y, 0, 1);
    updateDropDom(root);
  }

  function setDropFromPointer(event, svg, root) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const viewX = ((event.clientX - rect.left) / rect.width) * 600;
    const viewY = ((event.clientY - rect.top) / rect.height) * 600;
    setDrop((viewX - BOARD_ORIGIN) / BOARD_SIZE, 1 - ((viewY - BOARD_ORIGIN) / BOARD_SIZE), root);
  }

  function updateDropDom(root) {
    const drop = boardPoint(state.x, state.y);
    const edge = nearestEdgePoint();
    const edgePoint = boardPoint(edge.x, edge.y);
    const kind = classification();
    const values = {
      "centre-distance": format(centreDistance(), 4),
      "edge-distance": format(nearestEdgeDistance(), 4),
      status: classificationCopy(kind),
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p27-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const handle = root.querySelector("[data-p27-drop-handle]");
    if (handle) {
      handle.setAttribute("cx", drop.x.toFixed(2));
      handle.setAttribute("cy", drop.y.toFixed(2));
      handle.setAttribute("aria-label", `Raindrop at x ${format(state.x, 3)}, y ${format(state.y, 3)}; ${classificationCopy(kind)}. Use arrow keys to move it.`);
      handle.setAttribute("class", `p27-drop is-${kind}`);
    }
    const centreLine = root.querySelector("[data-p27-centre-line]");
    if (centreLine) {
      centreLine.setAttribute("x1", drop.x.toFixed(2));
      centreLine.setAttribute("y1", drop.y.toFixed(2));
    }
    const edgeLine = root.querySelector("[data-p27-edge-line]");
    if (edgeLine) {
      edgeLine.setAttribute("x1", drop.x.toFixed(2));
      edgeLine.setAttribute("y1", drop.y.toFixed(2));
      edgeLine.setAttribute("x2", edgePoint.x.toFixed(2));
      edgeLine.setAttribute("y2", edgePoint.y.toFixed(2));
    }
    const edgeDot = root.querySelector("[data-p27-edge-point]");
    if (edgeDot) {
      edgeDot.setAttribute("cx", edgePoint.x.toFixed(2));
      edgeDot.setAttribute("cy", edgePoint.y.toFixed(2));
    }
    const statusCard = root.querySelector("[data-p27-status-card]");
    if (statusCard) statusCard.className = `is-${kind}`;
    const description = root.querySelector("#p27-board-desc");
    if (description) description.textContent = `The drop is at x ${format(state.x, 3)}, y ${format(state.y, 3)}. Its centre distance is ${format(centreDistance(), 4)} and nearest-edge distance is ${format(nearestEdgeDistance(), 4)}. ${classificationCopy(kind)}.`;
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseProbability(raw) {
    const normalized = String(raw).trim().replaceAll(",", "");
    const percentage = normalized.endsWith("%");
    const numeric = Number(percentage ? normalized.slice(0, -1).trim() : normalized);
    if (!Number.isFinite(numeric)) return NaN;
    if (percentage || numeric > 1) return numeric / 100;
    return numeric;
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p27-shell");
    if (!root) return;

    root.querySelector("#p27-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "is-neutral";
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p27-reset") state = initialState();
        if (action === "p27-stage") {
          state.stage = Math.round(clamp(control.dataset.p27Stage, 0, 2));
          focusSelector = `[data-problem-action="p27-stage"][data-p27-stage="${state.stage}"]`;
        }
        if (action === "p27-simulate") {
          runSimulation(Number(control.dataset.p27Size));
          focusSelector = `[data-problem-action="p27-simulate"][data-p27-size="${state.sampleSize}"]`;
        }
        if (action === "p27-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          if (state.hintsUsed >= 1) state.stage = Math.max(state.stage, 2);
          focusSelector = '[data-problem-action="p27-hint"]';
        }
        if (action === "p27-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        rerender();
        if (action === "p27-reveal") focusAfterRender("#p27-solution-title");
        else if (focusSelector) focusAfterRender(focusSelector);
      });
    });

    const svg = root.querySelector("[data-p27-board]");
    const handle = root.querySelector("[data-p27-drop-handle]");
    if (svg && handle) {
      svg.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        handle.focus();
        svg.setPointerCapture(event.pointerId);
        setDropFromPointer(event, svg, root);
      });
      svg.addEventListener("pointermove", (event) => {
        if (svg.hasPointerCapture(event.pointerId)) setDropFromPointer(event, svg, root);
      });
      svg.addEventListener("pointerup", (event) => {
        setDropFromPointer(event, svg, root);
        if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      });
      svg.addEventListener("pointercancel", (event) => {
        if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      });
      handle.addEventListener("keydown", (event) => {
        const step = event.shiftKey ? 0.05 : 0.01;
        let { x, y } = state;
        if (event.key === "ArrowLeft") x -= step;
        else if (event.key === "ArrowRight") x += step;
        else if (event.key === "ArrowUp") y += step;
        else if (event.key === "ArrowDown") y -= step;
        else if (event.key === "Home") ({ x, y } = { x: 0.5, y: 0.5 });
        else return;
        event.preventDefault();
        setDrop(x, y, root);
      });
    }

    root.querySelector("[data-p27-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p27-answer")?.value || "";
      const estimate = parseProbability(raw);
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "is-neutral";
      if (!Number.isFinite(estimate) || estimate < 0 || estimate > 1) {
        state.feedback = "Enter a probability from 0 to 1, or a percentage from 0% to 100%.";
        state.feedbackTone = "is-warn";
      } else {
        state.committed = true;
        const difference = estimate - EXACT_PROBABILITY;
        if (Math.abs(difference) <= 0.005) {
          state.feedback = `Good estimate. The exact probability is about ${format(EXACT_PROBABILITY * 100, 3)}%. Now account for the curved boundary.`;
          state.feedbackTone = "is-success";
          state.stage = Math.max(state.stage, 1);
        } else {
          state.feedback = `That is ${difference < 0 ? "below" : "above"} the exact area. Use the eightfold symmetry and locate the curved boundary.`;
        }
      }
      rerender();
      focusAfterRender("#p27-answer");
    });
  }

  window.poveyProblemPages["2.7"] = { render, bind };
}());
