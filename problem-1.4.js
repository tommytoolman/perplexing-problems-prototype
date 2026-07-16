window.poveyProblemPages = window.poveyProblemPages || {};

(function registerHexagonalHoopPage() {
  "use strict";

  const ROOT_THREE = Math.sqrt(3);
  const MIN_RATIO = 0.05;
  const MAX_RATIO = 1.9;
  const TILE_SIDE = 72;
  const TILE_CENTRE_X = 320;
  const TILE_CENTRE_Y = 148;
  const EPSILON = 1e-7;

  const hints = [
    "Track the centre of the hoop. Because the floor repeats, one representative hexagonal tile contains every possible type of landing.",
    "Find the opposite event first: where can the centre land while the entire hoop stays inside one tile?",
    "Move each of the six tile edges inward by the hoop radius d/2. The remaining safe region is a smaller, similar hexagon.",
    "The large hexagon has apothem √3L/2. After the inward shift, the safe hexagon has side L - d/√3; compare the squares of the two side lengths.",
  ];

  const initialState = () => ({
    diameterRatio: 1,
    centreX: 0,
    centreY: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
    trials: 0,
    crossings: 0,
    points: [],
  });

  let state = initialState();

  function format(value, digits = 2) {
    return Number(value).toFixed(digits);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function crossingProbability(ratio = state.diameterRatio) {
    if (ratio >= ROOT_THREE) return 1;
    return 1 - (1 - ratio / ROOT_THREE) ** 2;
  }

  function insidePointyHexagon(x, y, side = 1, epsilon = EPSILON) {
    if (side < 0) return false;
    const absoluteX = Math.abs(x);
    const absoluteY = Math.abs(y);
    return (
      absoluteX <= (ROOT_THREE * side) / 2 + epsilon
      && absoluteX + ROOT_THREE * absoluteY <= ROOT_THREE * side + epsilon
    );
  }

  function centreIsSafe(x = state.centreX, y = state.centreY, ratio = state.diameterRatio) {
    if (ratio > ROOT_THREE + EPSILON) return false;
    const safeSide = 1 - ratio / ROOT_THREE;
    if (safeSide <= EPSILON) return Math.abs(x) <= EPSILON && Math.abs(y) <= EPSILON;
    return insidePointyHexagon(x, y, safeSide);
  }

  function isThresholdTangent() {
    return (
      Math.abs(state.diameterRatio - ROOT_THREE) <= EPSILON
      && Math.abs(state.centreX) <= EPSILON
      && Math.abs(state.centreY) <= EPSILON
    );
  }

  function landingLabel() {
    if (isThresholdTangent()) return "one colour - tangent";
    return centreIsSafe() ? "one colour" : "more than one colour";
  }

  function clampToRepresentativeHexagon(x, y) {
    const absoluteX = Math.abs(x);
    const absoluteY = Math.abs(y);
    let scale = 1;
    if (absoluteX > EPSILON) scale = Math.min(scale, (ROOT_THREE / 2) / absoluteX);
    const slopingConstraint = absoluteX + ROOT_THREE * absoluteY;
    if (slopingConstraint > EPSILON) scale = Math.min(scale, ROOT_THREE / slopingConstraint);
    return { x: x * scale, y: y * scale };
  }

  function hexagonPoints(cx, cy, side) {
    return [
      [cx, cy - side],
      [cx + (ROOT_THREE * side) / 2, cy - side / 2],
      [cx + (ROOT_THREE * side) / 2, cy + side / 2],
      [cx, cy + side],
      [cx - (ROOT_THREE * side) / 2, cy + side / 2],
      [cx - (ROOT_THREE * side) / 2, cy - side / 2],
    ].map(([x, y]) => `${format(x, 3)},${format(y, 3)}`).join(" ");
  }

  function honeycombCells() {
    const cells = [];
    for (let axialV = -3; axialV <= 3; axialV += 1) {
      for (let axialU = -4; axialU <= 4; axialU += 1) {
        const cx = TILE_CENTRE_X + ROOT_THREE * TILE_SIDE * (axialU + axialV / 2);
        const cy = TILE_CENTRE_Y + 1.5 * TILE_SIDE * axialV;
        if (cx < -80 || cx > 720 || cy < -90 || cy > 370) continue;
        const colour = ((axialU - axialV) % 3 + 3) % 3;
        cells.push(`<polygon class="hex-cell colour-${colour}" points="${hexagonPoints(cx, cy, TILE_SIDE)}" />`);
      }
    }
    return cells.join("");
  }

  function trialDots() {
    return state.points.map((point) => {
      const x = TILE_CENTRE_X + point.x * TILE_SIDE;
      const y = TILE_CENTRE_Y + point.y * TILE_SIDE;
      return `<circle class="hex-trial-dot ${point.crosses ? "crosses" : "safe"}" cx="${format(x, 3)}" cy="${format(y, 3)}" r="2.15" />`;
    }).join("");
  }

  function safeLocusMarkup() {
    if (!state.revealed) return "";
    const safeSide = Math.max(0, TILE_SIDE * (1 - state.diameterRatio / ROOT_THREE));
    const hidden = state.diameterRatio > ROOT_THREE + EPSILON ? " hidden" : "";
    return `
      <polygon class="hex-safe-locus" data-hex-safe-locus points="${hexagonPoints(TILE_CENTRE_X, TILE_CENTRE_Y, safeSide)}"${hidden} />
      <circle class="hex-safe-point" data-hex-safe-point cx="${TILE_CENTRE_X}" cy="${TILE_CENTRE_Y}" r="4"${Math.abs(state.diameterRatio - ROOT_THREE) <= EPSILON ? "" : " hidden"} />`;
  }

  function hexagonSvg() {
    const ratio = state.diameterRatio;
    const hoopRadius = (ratio * TILE_SIDE) / 2;
    const centreX = TILE_CENTRE_X + state.centreX * TILE_SIDE;
    const centreY = TILE_CENTRE_Y + state.centreY * TILE_SIDE;
    const safe = centreIsSafe();
    const focusPoints = hexagonPoints(TILE_CENTRE_X, TILE_CENTRE_Y, TILE_SIDE);
    return `
      <svg class="route-svg hex-floor-svg" data-hex-svg viewBox="0 0 640 370" role="img" aria-labelledby="hex-title hex-desc">
        <title id="hex-title">A movable hoop on a floor of hexagonal tiles</title>
        <desc id="hex-desc">The centre of a circular hoop can be dragged within one highlighted representative hexagonal tile. The ring turns red when it crosses a tile edge.</desc>
        <defs>
          <clipPath id="hex-floor-clip"><rect x="18" y="10" width="604" height="282" rx="18" /></clipPath>
        </defs>
        <g class="hex-floor" clip-path="url(#hex-floor-clip)">${honeycombCells()}</g>
        <g clip-path="url(#hex-floor-clip)">
          <polygon class="hex-focus-tile" points="${focusPoints}" />
          ${safeLocusMarkup()}
          <g class="hex-trial-points" data-hex-trial-points>${trialDots()}</g>
          <circle class="hex-hoop-ring ${safe ? "safe" : "crosses"}" data-hex-ring cx="${format(centreX, 3)}" cy="${format(centreY, 3)}" r="${format(hoopRadius, 3)}" />
          <line class="hex-diameter-line" data-hex-diameter x1="${format(centreX - hoopRadius, 3)}" y1="${format(centreY, 3)}" x2="${format(centreX + hoopRadius, 3)}" y2="${format(centreY, 3)}" />
          <text class="hex-diameter-label" data-hex-diameter-label x="${format(centreX, 3)}" y="${format(centreY - 9, 3)}" text-anchor="middle">d</text>
          <circle class="hex-hoop-centre" data-hex-centre cx="${format(centreX, 3)}" cy="${format(centreY, 3)}" r="4.5" />
          <polygon
            class="hex-drag-zone"
            data-hex-drag-zone
            points="${focusPoints}"
            tabindex="0"
            aria-label="Hoop centre. Drag, tap, or use arrow keys to move within the representative hexagon. Press Home to return to the centre."
            aria-describedby="hex-centre-instructions"
          />
        </g>
        <g class="hex-side-measure" aria-hidden="true">
          <line x1="${format(TILE_CENTRE_X + ROOT_THREE * TILE_SIDE / 2 + 18, 3)}" y1="${format(TILE_CENTRE_Y - TILE_SIDE / 2, 3)}" x2="${format(TILE_CENTRE_X + ROOT_THREE * TILE_SIDE / 2 + 18, 3)}" y2="${format(TILE_CENTRE_Y + TILE_SIDE / 2, 3)}" />
          <text x="${format(TILE_CENTRE_X + ROOT_THREE * TILE_SIDE / 2 + 29, 3)}" y="${format(TILE_CENTRE_Y + 5, 3)}">L</text>
        </g>
        <g class="hex-svg-status ${safe ? "safe" : "crosses"}" aria-hidden="true">
          <circle cx="320" cy="337" r="6" />
          <text data-hex-svg-status x="334" y="342">${landingLabel()}</text>
        </g>
      </svg>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const ratio = state.diameterRatio;
    const probability = crossingProbability(ratio);
    if (ratio > ROOT_THREE + EPSILON) {
      return `
        <section class="solution-card hex-solution" aria-label="Worked solution">
          <strong>Shrink every edge inward</strong>
          <div class="equation">d &gt; √3L ⇒ P(more than one colour) = 1</div>
          <p>The distance between opposite sides is √3L. This hoop is wider than that, so it cannot fit inside one tile at any centre position.</p>
        </section>`;
    }
    const safeScale = Math.max(0, 1 - ratio / ROOT_THREE);
    const thresholdNote = Math.abs(ratio - ROOT_THREE) <= EPSILON
      ? "<p><strong>At the threshold:</strong> one perfectly centred tangent placement exists, but a single point has zero area among all possible centre positions. The crossing probability is still 1.</p>"
      : "";
    return `
      <section class="solution-card hex-solution" aria-label="Worked solution">
        <strong>Shrink every edge inward</strong>
        <p>The centre must remain d/2 from all six edges. Those inward offsets form a similar hexagon of side L - d/√3.</p>
        <div class="equation">P(one colour) = (1 - d/(√3L))²</div>
        <div class="equation">= (1 - ${format(ratio, 3)}/√3)² = ${format(safeScale ** 2, 3)}</div>
        <div class="equation">P(more than one) = 1 - ${format(safeScale ** 2, 3)} = ${format(probability, 3)}</div>
        ${thresholdNote}
      </section>`;
  }

  function trialSummary() {
    if (!state.trials) return "";
    const simulated = (state.crossings / state.trials) * 100;
    return `
      <div class="hex-trial-summary" data-hex-trial-summary role="status">
        <div><small>Simulated</small><strong>${format(simulated, 1)}%</strong></div>
        <div><small>Exact ${state.revealed ? "" : "after reveal"}</small><strong>${state.revealed ? `${format(crossingProbability() * 100, 1)}%` : "?"}</strong></div>
      </div>`;
  }

  function stateSnapshot() {
    return JSON.stringify({
      problem: "1.4",
      diameterOverTileSide: Number(state.diameterRatio.toFixed(4)),
      centreInTileSideUnits: [Number(state.centreX.toFixed(3)), Number(state.centreY.toFixed(3))],
      currentHoopCrossesBoundary: !centreIsSafe(),
      estimatePercent: state.estimate || null,
      simulatedThrows: state.trials,
      simulatedCrossingPercent: state.trials ? Number(((state.crossings / state.trials) * 100).toFixed(1)) : null,
      exactCrossingPercent: state.revealed ? Number((crossingProbability() * 100).toFixed(1)) : null,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const ratio = state.diameterRatio;
    const probability = crossingProbability(ratio);
    const safe = centreIsSafe();
    const sliderProgress = ((ratio - MIN_RATIO) / (MAX_RATIO - MIN_RATIO)) * 100;
    return `
      <main class="book-shell hex-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar hex-progress"><span></span></div></div>
          ${problemHeaderActions("1.4", '<button class="ghost-button" type="button" data-problem-action="hex-reset">Reset</button>')}
        </header>
        <div class="book-spread hex-spread">
          <article class="book-page">
            <div class="problem-number">Problem 1.4</div>
            <h1 class="book-title hex-book-title">Hexagonal tiles and hoop</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">An infinitely large floor is tiled with regular hexagonal tiles of side <em>L</em>. Different colours of tiles are used so that no two tiles of the same colour touch. A hoop of diameter <em>d</em> is thrown onto the tiles. What is the chance of the hoop enclosing more than one colour?</p>
            <section class="prediction-box">
              <div class="eyebrow">Start with d = L</div>
              <p>A hoop as wide as a tile side can still fit inside a hexagon. Is crossing another colour unlikely, roughly even, or very likely?</p>
              <div class="scale-choices probability-scale" aria-hidden="true"><span>unlikely</span><span>even</span><span>very likely</span></div>
            </section>
          </article>
          <section class="book-page book-stage hex-stage">
            ${hexagonSvg()}
            <span class="hex-sr-only" id="hex-centre-instructions">Use arrow keys to move the hoop centre. Hold Shift for larger steps. Press Home to return to the tile centre.</span>
            <div class="book-stage-caption hex-caption">
              <div class="hex-caption-copy">
                <p>Drag the centre around the highlighted tile. Red means the hoop crosses an edge into another colour; green means it remains inside one tile.</p>
                <p class="hex-representative-note"><strong>Why the centre stays inside:</strong> the hexagonal pattern repeats forever, so every possible landing has one equivalent centre position in this representative tile. The hoop itself may extend beyond it.</p>
              </div>
              <div><div class="eyebrow">Current landing</div><div class="hex-landing-status ${safe ? "safe" : "crosses"}" data-hex-landing-status role="status" aria-live="polite">${landingLabel()}</div></div>
            </div>
            <div class="slider-wrap">
              <label id="hex-size-label"><span>Diameter ratio d/L</span><span data-hex-live="ratio">${format(ratio, 3)}</span></label>
              <div
                class="drag-slider"
                data-hex-size-slider
                role="slider"
                tabindex="0"
                aria-labelledby="hex-size-label"
                aria-valuemin="${MIN_RATIO}"
                aria-valuemax="${MAX_RATIO}"
                aria-valuenow="${format(ratio, 3)}"
                aria-valuetext="diameter ${format(ratio, 3)} times the tile side"
                style="--slider-progress:${sliderProgress}%"
              >
                <span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span>
              </div>
              <div class="slider-labels"><span>0.05</span><span>√3 ≈ 1.732</span><span>1.90</span></div>
              <div class="hex-presets" aria-label="Hoop diameter presets">
                ${[
                  [0.5, "0.5L"],
                  [1, "L"],
                  [1.5, "1.5L"],
                  [ROOT_THREE, "√3L"],
                ].map(([value, label]) => `<button class="chip-button ${Math.abs(ratio - value) <= EPSILON ? "active" : ""}" type="button" data-problem-action="hex-size" data-ratio="${value}">${label}</button>`).join("")}
              </div>
            </div>
            <div class="hex-simulation-row">
              <button class="secondary-button" type="button" data-problem-action="hex-simulate">Throw 200 hoops</button>
              ${trialSummary()}
            </div>
            ${state.revealed ? `<div class="exact-readout hex-exact-readout"><small>Exact probability at d/L = <span data-hex-live="ratio">${format(ratio, 3)}</span></small><strong data-hex-live="probability">${format(probability * 100, 1)}%</strong></div>` : ""}
          </section>
          <aside class="book-page book-coach hex-coach">
            <div class="coach-kicker">Make a prediction</div>
            <p class="coach-question">What fraction of possible centre positions cross at least one edge?</p>
            <form class="estimate-form" data-hex-estimate-form>
              <label for="hex-estimate">Your estimate for this diameter</label>
              <div class="estimate-field"><input id="hex-estimate" class="estimate-input" inputmode="decimal" type="number" min="0" max="100" step="0.1" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 80" /><span>%</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row">
              <button class="secondary-button" type="button" data-problem-action="hex-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="hex-reveal">Reveal</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.4")}
      </main>`;
  }

  function setRatio(value) {
    const numeric = Number(value);
    const exactThreshold = Math.abs(numeric - ROOT_THREE) < 0.0005;
    state.diameterRatio = exactThreshold
      ? ROOT_THREE
      : Math.max(MIN_RATIO, Math.min(MAX_RATIO, Math.round(numeric * 100) / 100));
    state.estimate = "";
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "";
    state.trials = 0;
    state.crossings = 0;
    state.points = [];
  }

  function setCentre(x, y) {
    const clamped = clampToRepresentativeHexagon(Number(x), Number(y));
    state.centreX = clamped.x;
    state.centreY = clamped.y;
  }

  function runSimulation(count = 200) {
    let seed = 149 + Math.round(state.diameterRatio * 100000);
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const points = [];
    while (points.length < count) {
      const x = (random() * 2 - 1) * ROOT_THREE / 2;
      const y = random() * 2 - 1;
      if (!insidePointyHexagon(x, y, 1)) continue;
      points.push({ x, y, crosses: !centreIsSafe(x, y) });
    }
    state.points = points;
    state.trials = count;
    state.crossings = points.filter((point) => point.crosses).length;
  }

  function updateLiveDom() {
    const ratio = state.diameterRatio;
    const safe = centreIsSafe();
    const centreX = TILE_CENTRE_X + state.centreX * TILE_SIDE;
    const centreY = TILE_CENTRE_Y + state.centreY * TILE_SIDE;
    const radius = ratio * TILE_SIDE / 2;
    const progress = ((ratio - MIN_RATIO) / (MAX_RATIO - MIN_RATIO)) * 100;

    document.querySelectorAll('[data-hex-live="ratio"]').forEach((node) => { node.textContent = format(ratio, 3); });
    document.querySelectorAll('[data-hex-live="probability"]').forEach((node) => { node.textContent = `${format(crossingProbability() * 100, 1)}%`; });
    document.querySelectorAll("[data-hex-size-slider]").forEach((slider) => {
      slider.style.setProperty("--slider-progress", `${progress}%`);
      slider.setAttribute("aria-valuenow", format(ratio, 3));
      slider.setAttribute("aria-valuetext", `diameter ${format(ratio, 3)} times the tile side`);
    });
    document.querySelectorAll("[data-hex-ring]").forEach((ring) => {
      ring.setAttribute("cx", centreX);
      ring.setAttribute("cy", centreY);
      ring.setAttribute("r", radius);
      ring.setAttribute("class", `hex-hoop-ring ${safe ? "safe" : "crosses"}`);
    });
    document.querySelectorAll("[data-hex-centre]").forEach((centre) => {
      centre.setAttribute("cx", centreX);
      centre.setAttribute("cy", centreY);
    });
    document.querySelectorAll("[data-hex-diameter]").forEach((line) => {
      line.setAttribute("x1", centreX - radius);
      line.setAttribute("y1", centreY);
      line.setAttribute("x2", centreX + radius);
      line.setAttribute("y2", centreY);
    });
    document.querySelectorAll("[data-hex-diameter-label]").forEach((label) => {
      label.setAttribute("x", centreX);
      label.setAttribute("y", centreY - 9);
    });
    document.querySelectorAll("[data-hex-landing-status]").forEach((status) => {
      status.textContent = landingLabel();
      status.setAttribute("class", `hex-landing-status ${safe ? "safe" : "crosses"}`);
    });
    document.querySelectorAll("[data-hex-svg-status]").forEach((status) => {
      status.textContent = landingLabel();
      status.parentElement?.setAttribute("class", `hex-svg-status ${safe ? "safe" : "crosses"}`);
    });
    const safeSide = Math.max(0, TILE_SIDE * (1 - ratio / ROOT_THREE));
    document.querySelectorAll("[data-hex-safe-locus]").forEach((locus) => {
      locus.setAttribute("points", hexagonPoints(TILE_CENTRE_X, TILE_CENTRE_Y, safeSide));
      locus.hidden = ratio > ROOT_THREE + EPSILON;
    });
    document.querySelectorAll("[data-hex-safe-point]").forEach((point) => {
      point.hidden = Math.abs(ratio - ROOT_THREE) > EPSILON;
    });
    if (!state.trials) {
      document.querySelectorAll("[data-hex-trial-points]").forEach((group) => { group.innerHTML = ""; });
      document.querySelectorAll("[data-hex-trial-summary]").forEach((summary) => { summary.hidden = true; });
    }
  }

  function pointerToNormalisedTile(event, target) {
    const svg = target.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: state.centreX, y: state.centreY };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return {
      x: (local.x - TILE_CENTRE_X) / TILE_SIDE,
      y: (local.y - TILE_CENTRE_Y) / TILE_SIDE,
    };
  }

  function bind({ render: renderRoot }) {
    document.querySelectorAll("[data-problem-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.problemAction;
        if (action === "hex-reset") state = initialState();
        if (action === "hex-size") setRatio(Number(button.dataset.ratio));
        if (action === "hex-simulate") runSimulation();
        if (action === "hex-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "hex-reveal") state.revealed = true;
        renderRoot();
      });
    });

    document.querySelectorAll("[data-hex-estimate-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const raw = form.querySelector(".estimate-input")?.value ?? "";
        state.estimate = raw;
        const estimate = Number(raw);
        if (raw === "" || !Number.isFinite(estimate)) {
          state.feedback = "Enter a percentage estimate first.";
          state.feedbackTone = "";
        } else if (estimate < 0 || estimate > 100) {
          state.feedback = "A probability must be between 0% and 100%.";
          state.feedbackTone = "";
        } else {
          state.committed = true;
          const target = crossingProbability() * 100;
          const difference = Math.abs(estimate - target);
          if (difference <= 5) {
            state.feedback = "Strong estimate. Your prediction is within five percentage points of the geometric result.";
            state.feedbackTone = "success";
          } else if (estimate < target) {
            state.feedback = "The crossing region is larger than your estimate. Try finding the smaller safe hexagon first.";
            state.feedbackTone = "";
          } else {
            state.feedback = "The crossing region is smaller than your estimate. Compare the safe hexagon's area with the whole tile.";
            state.feedbackTone = "";
          }
        }
        renderRoot();
      });
    });

    document.querySelectorAll("[data-hex-size-slider]").forEach((slider) => {
      const updateFromPointer = (event) => {
        const rect = slider.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        setRatio(MIN_RATIO + progress * (MAX_RATIO - MIN_RATIO));
        updateLiveDom();
      };
      slider.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        slider.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      });
      slider.addEventListener("pointermove", (event) => {
        if (!slider.hasPointerCapture(event.pointerId)) return;
        updateFromPointer(event);
      });
      slider.addEventListener("pointerup", (event) => {
        if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
        renderRoot();
      });
      slider.addEventListener("pointercancel", () => renderRoot());
      slider.addEventListener("keydown", (event) => {
        const smallDelta = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01 }[event.key];
        const pageDelta = { PageDown: -0.1, PageUp: 0.1 }[event.key];
        if (smallDelta == null && pageDelta == null && !["Home", "End"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "Home") setRatio(MIN_RATIO);
        else if (event.key === "End") setRatio(MAX_RATIO);
        else setRatio(state.diameterRatio + (smallDelta ?? pageDelta));
        updateLiveDom();
      });
    });

    document.querySelectorAll("[data-hex-drag-zone]").forEach((zone) => {
      const updateFromPointer = (event) => {
        const point = pointerToNormalisedTile(event, zone);
        setCentre(point.x, point.y);
        updateLiveDom();
      };
      zone.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        zone.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      });
      zone.addEventListener("pointermove", (event) => {
        if (!zone.hasPointerCapture(event.pointerId)) return;
        updateFromPointer(event);
      });
      zone.addEventListener("pointerup", (event) => {
        if (zone.hasPointerCapture(event.pointerId)) zone.releasePointerCapture(event.pointerId);
        renderRoot();
      });
      zone.addEventListener("pointercancel", () => renderRoot());
      zone.addEventListener("keydown", (event) => {
        if (event.key === "Home") {
          event.preventDefault();
          setCentre(0, 0);
          updateLiveDom();
          return;
        }
        const step = event.shiftKey ? 0.12 : 0.04;
        const movement = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
        }[event.key];
        if (!movement) return;
        event.preventDefault();
        setCentre(state.centreX + movement[0], state.centreY + movement[1]);
        updateLiveDom();
      });
    });
  }

  window.poveyProblemPages["1.4"] = { render, bind };
}());
