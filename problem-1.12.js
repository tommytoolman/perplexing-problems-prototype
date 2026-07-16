(function registerCaptainFistfullsTreasurePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const A = Object.freeze({ x: 0, y: 0 });
  const B = Object.freeze({ x: 6, y: 0 });
  const RADIUS = 5;
  const TOLERANCE = 0.12;
  const VIEW = Object.freeze({
    width: 640,
    height: 480,
    originX: 206,
    originY: 240,
    scale: 38,
    minX: -5,
    maxX: 11,
    minY: -5.8,
    maxY: 5.8,
  });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p112-reset">Reset</button>';

  const stages = [
    {
      label: "Landmarks",
      title: "Start from the two fixed places",
      copy: "A and B are 6 map units apart. Move the treasure marker and watch both measured distances.",
    },
    {
      label: "Circle from A",
      title: "Turn the first clue into a locus",
      copy: "Every point exactly 5 units from A lies on the red circle centred at A.",
    },
    {
      label: "Both circles",
      title: "Intersect the two distance clues",
      copy: "The second 5-unit circle leaves two reflected possibilities. The word north decides between them.",
    },
  ];

  const hints = [
    "A point equally far from A and B must lie on the perpendicular bisector of AB. Where is the midpoint of a 6-unit segment?",
    "Draw the 5-unit radii to the treasure. The perpendicular bisector splits the 6-unit base into two 3-unit halves.",
    "One half is a right triangle with hypotenuse 5, horizontal leg 3, and height h: h² + 3² = 5².",
    "The equation gives h = 4 in either vertical direction. Which sign is allowed by the word north?",
  ];

  const initialState = () => ({
    x: 2.1,
    y: 2.2,
    stage: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();
  let activePointerId = null;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function roundPoint(value) {
    const rounded = Math.round(Number(value) * 100) / 100;
    return Math.abs(rounded) < 0.005 ? 0 : rounded;
  }

  function setPoint(x, y) {
    state.x = roundPoint(clamp(x, VIEW.minX, VIEW.maxX));
    state.y = roundPoint(clamp(y, VIEW.minY, VIEW.maxY));
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function mapToSvg(point) {
    return {
      x: VIEW.originX + point.x * VIEW.scale,
      y: VIEW.originY - point.y * VIEW.scale,
    };
  }

  function distances(x = state.x, y = state.y) {
    const fromA = Math.hypot(x - A.x, y - A.y);
    const fromB = Math.hypot(x - B.x, y - B.y);
    return {
      fromA,
      fromB,
      errorA: fromA - RADIUS,
      errorB: fromB - RADIUS,
      meetsA: Math.abs(fromA - RADIUS) <= TOLERANCE,
      meetsB: Math.abs(fromB - RADIUS) <= TOLERANCE,
      north: y > 0,
    };
  }

  function format(value, digits = 2) {
    const safe = Math.abs(value) < 0.5 * (10 ** -digits) ? 0 : Number(value);
    return safe.toFixed(digits);
  }

  function formatCoordinate(value) {
    return format(value, 2);
  }

  function formatError(value) {
    if (Math.abs(value) < 0.005) return "0.00";
    return `${value > 0 ? "+" : ""}${format(value, 2)}`;
  }

  function locatorStatus(measurement = distances()) {
    if (measurement.meetsA && measurement.meetsB && measurement.north) {
      return { tone: "success", text: "Located: both 5-unit clues and the north condition are satisfied." };
    }
    if (measurement.meetsA && measurement.meetsB) {
      return { tone: "caution", text: "Both distances fit, but this reflected candidate is south of AB." };
    }
    if (measurement.meetsA || measurement.meetsB) {
      return { tone: "near", text: `One radius clue fits. Adjust the marker to make the other distance ${RADIUS.toFixed(0)} too.` };
    }
    return { tone: "searching", text: "Searching: neither 5-unit radius clue is exact yet." };
  }

  function mapDescription() {
    const measurement = distances();
    return `Coordinate map at clue stage ${state.stage + 1} of 3, ${stages[state.stage].label}. The movable treasure is at (${formatCoordinate(state.x)}, ${formatCoordinate(state.y)}). Its distance from A is ${format(measurement.fromA)} and from B is ${format(measurement.fromB)} map units. The treasure is ${measurement.north ? "north" : state.y === 0 ? "on" : "south"} of line AB.`;
  }

  function treasureAccessibleLabel() {
    const measurement = distances();
    return `Movable treasure at x ${formatCoordinate(state.x)}, y ${formatCoordinate(state.y)}. Distance to A ${format(measurement.fromA)}; distance to B ${format(measurement.fromB)}. ${measurement.north ? "North" : state.y === 0 ? "On the line" : "South"} of AB. Use arrow keys to move.`;
  }

  function gridMarkup() {
    const lines = [];
    for (let x = -5; x <= 11; x += 1) {
      const point = mapToSvg({ x, y: 0 });
      lines.push(`<line x1="${point.x}" y1="20" x2="${point.x}" y2="460" />`);
    }
    for (let y = -5; y <= 5; y += 1) {
      const point = mapToSvg({ x: 0, y });
      lines.push(`<line x1="12" y1="${point.y}" x2="628" y2="${point.y}" />`);
    }
    return lines.join("");
  }

  function clueCirclesMarkup() {
    const centreA = mapToSvg(A);
    const centreB = mapToSvg(B);
    const radius = RADIUS * VIEW.scale;
    const circleA = state.stage >= 1
      ? `<circle class="p112-clue-circle p112-clue-circle-a" cx="${centreA.x}" cy="${centreA.y}" r="${radius}" /><text class="p112-circle-label p112-circle-label-a" x="50" y="82">5 from A</text>`
      : "";
    const circleB = state.stage >= 2
      ? `<circle class="p112-clue-circle p112-clue-circle-b" cx="${centreB.x}" cy="${centreB.y}" r="${radius}" /><text class="p112-circle-label p112-circle-label-b" x="500" y="82">5 from B</text>`
      : "";
    return circleA + circleB;
  }

  function revealCandidatesMarkup() {
    if (!state.revealed) return "";
    const north = mapToSvg({ x: 3, y: 4 });
    const south = mapToSvg({ x: 3, y: -4 });
    return `
      <g class="p112-candidates" aria-hidden="true">
        <circle class="p112-candidate p112-candidate-north" cx="${north.x}" cy="${north.y}" r="11" />
        <text x="${north.x + 18}" y="${north.y - 12}">(3, 4) north</text>
        <circle class="p112-candidate p112-candidate-south" cx="${south.x}" cy="${south.y}" r="11" />
        <line class="p112-south-strike" x1="${south.x - 9}" y1="${south.y - 9}" x2="${south.x + 9}" y2="${south.y + 9}" />
        <line class="p112-south-strike" x1="${south.x + 9}" y1="${south.y - 9}" x2="${south.x - 9}" y2="${south.y + 9}" />
        <text x="${south.x + 18}" y="${south.y + 24}">(3, -4) south</text>
      </g>`;
  }

  function mapSvg() {
    const point = mapToSvg(state);
    const pointA = mapToSvg(A);
    const pointB = mapToSvg(B);
    const labelX = clamp(point.x + 18, 34, VIEW.width - 92);
    const labelY = clamp(point.y - 17, 30, VIEW.height - 22);
    return `
      <svg class="route-svg p112-map" data-p112-map viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="group" aria-labelledby="p112-map-title" aria-describedby="p112-map-desc">
        <title id="p112-map-title">Interactive coordinate treasure map</title>
        <desc id="p112-map-desc" data-p112-map-desc>${mapDescription()}</desc>
        <defs>
          <marker id="p112-north-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 Z" />
          </marker>
        </defs>
        <rect class="p112-map-paper" x="8" y="8" width="624" height="464" rx="18" />
        <g class="p112-grid" aria-hidden="true">${gridMarkup()}</g>
        <g class="p112-direction" aria-hidden="true">
          <line x1="585" y1="114" x2="585" y2="45" marker-end="url(#p112-north-arrow)" />
          <text x="575" y="134">N</text>
        </g>
        ${clueCirclesMarkup()}
        <g class="p112-baseline" aria-hidden="true">
          <line x1="${pointA.x}" y1="${pointA.y}" x2="${pointB.x}" y2="${pointB.y}" />
          <line class="p112-dimension" x1="${pointA.x}" y1="${pointA.y + 34}" x2="${pointB.x}" y2="${pointB.y + 34}" />
          <line class="p112-dimension-tick" x1="${pointA.x}" y1="${pointA.y + 25}" x2="${pointA.x}" y2="${pointA.y + 43}" />
          <line class="p112-dimension-tick" x1="${pointB.x}" y1="${pointB.y + 25}" x2="${pointB.x}" y2="${pointB.y + 43}" />
          <text class="p112-dimension-label" x="${(pointA.x + pointB.x) / 2}" y="${pointA.y + 56}">6 map units</text>
        </g>
        ${revealCandidatesMarkup()}
        <g class="p112-live-radii" aria-hidden="true">
          <line data-p112-line-a x1="${pointA.x}" y1="${pointA.y}" x2="${point.x}" y2="${point.y}" />
          <line data-p112-line-b x1="${pointB.x}" y1="${pointB.y}" x2="${point.x}" y2="${point.y}" />
        </g>
        <g class="p112-landmarks" aria-hidden="true">
          <circle cx="${pointA.x}" cy="${pointA.y}" r="8" />
          <circle cx="${pointB.x}" cy="${pointB.y}" r="8" />
          <text x="${pointA.x - 39}" y="${pointA.y - 14}">A (0, 0)</text>
          <text x="${pointB.x + 14}" y="${pointB.y - 14}">B (6, 0)</text>
        </g>
        <g class="p112-treasure" aria-hidden="true">
          <path data-p112-treasure-mark d="M ${point.x} ${point.y - 11} L ${point.x + 11} ${point.y} L ${point.x} ${point.y + 11} L ${point.x - 11} ${point.y} Z" />
          <text data-p112-treasure-label x="${labelX}" y="${labelY}">T (${formatCoordinate(state.x)}, ${formatCoordinate(state.y)})</text>
        </g>
        <circle
          class="p112-treasure-handle"
          data-p112-treasure-handle
          cx="${point.x}"
          cy="${point.y}"
          r="30"
          role="group"
          tabindex="0"
          focusable="true"
          aria-describedby="p112-map-help"
          aria-label="${treasureAccessibleLabel()}"
        />
      </svg>`;
  }

  function stageControls() {
    return `
      <div class="p112-stage-controls" aria-label="Optional clue-circle construction stages">
        ${stages.map((stage, index) => `
          <button class="chip-button p112-stage-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p112-stage" data-p112-stage="${index}" ${state.stage === index ? 'aria-current="step"' : ""}>
            <span>${index + 1}</span>${stage.label}
          </button>`).join("")}
      </div>`;
  }

  function liveReadout() {
    const measurement = distances();
    const status = locatorStatus(measurement);
    return `
      <div class="p112-readout">
        <div class="p112-coordinate-card">
          <small>Treasure coordinate</small>
          <strong>(<span data-p112-live="x">${formatCoordinate(state.x)}</span>, <span data-p112-live="y">${formatCoordinate(state.y)}</span>)</strong>
        </div>
        <div class="p112-distance-card ${measurement.meetsA ? "p112-distance-met" : ""}" data-p112-card-a>
          <small>Distance to A</small>
          <strong><span data-p112-live="distance-a">${format(measurement.fromA)}</span> units</strong>
          <span>error <b data-p112-live="error-a">${formatError(measurement.errorA)}</b></span>
        </div>
        <div class="p112-distance-card ${measurement.meetsB ? "p112-distance-met" : ""}" data-p112-card-b>
          <small>Distance to B</small>
          <strong><span data-p112-live="distance-b">${format(measurement.fromB)}</span> units</strong>
          <span>error <b data-p112-live="error-b">${formatError(measurement.errorB)}</b></span>
        </div>
        <div class="p112-north-card ${measurement.north ? "p112-north-met" : ""}" data-p112-north-card>
          <small>Direction clue</small>
          <strong data-p112-live="north">${measurement.north ? "North ✓" : state.y === 0 ? "On AB" : "South ✕"}</strong>
          <span>requires y &gt; 0</span>
        </div>
      </div>
      <div class="p112-locator-status p112-status-${status.tone}" data-p112-locator-status role="status" aria-live="polite">${status.text}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p112-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p112-hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p112-solution" aria-labelledby="p112-solution-heading">
        <h2 id="p112-solution-heading" tabindex="-1">The north clue selects one of two intersections</h2>
        <p>Equal distances from A and B put the treasure on the perpendicular bisector of AB. Since AB is 6 units long, that gives <strong>x = 3</strong>.</p>
        <p>Bisect the isosceles triangle. One half has horizontal leg 3, hypotenuse 5, and height h.</p>
        <div class="equation">h² + 3² = 5²</div>
        <div class="equation">h² = 25 - 9 = 16 &nbsp;⇒&nbsp; h = 4</div>
        <p>The complete circles meet at <strong>(3, 4)</strong> and <strong>(3, -4)</strong>. Both satisfy the two distance clues, but only the first is north of AB.</p>
        <div class="equation p112-answer">T = (3, 4)</div>
        <p class="p112-solution-note"><strong>Why the direction matters:</strong> without the north clue, the reflected southern point would be a second valid answer.</p>
      </section>`;
  }

  function stateSnapshot() {
    const measurement = distances();
    return JSON.stringify(
      {
        problem: "1.12",
        provenance: "reconstructed activity; source body unavailable",
        treasure: [state.x, state.y],
        constructionStage: state.stage + 1,
        distanceToA: Number(measurement.fromA.toFixed(6)),
        distanceToB: Number(measurement.fromB.toFixed(6)),
        radiusErrorA: Number(measurement.errorA.toFixed(6)),
        radiusErrorB: Number(measurement.errorB.toFixed(6)),
        northOfAB: measurement.north,
        estimateHeight: state.estimate === "" ? null : Number(state.estimate),
        committed: state.committed,
        hintsUsed: state.hintsUsed,
        solutionRevealed: state.revealed,
      },
      null,
      2,
    );
  }

  function render() {
    const stage = stages[state.stage];
    return `
      <main class="book-shell p112-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p112-progress"><span></span></div></div>
          ${problemHeaderActions("1.12", resetMarkup)}
        </header>

        <div class="book-spread p112-spread">
          <article class="book-page p112-problem-page">
            <div class="problem-number">Problem 1.12</div>
            <h1 class="book-title p112-book-title">Captain Fistfulls' treasure</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <div class="p112-reconstruction-label">Reconstructed activity</div>
            <p class="problem-copy">On a coordinate map, landmarks A and B are 6 units apart. The treasure is exactly 5 units from A and exactly 5 units from B. It lies north of line AB.</p>
            <p class="p112-question"><strong>Where is the treasure?</strong> Find its unique coordinate and explain why the direction clue is needed.</p>
            <aside class="p112-source-note" aria-label="Reconstruction note">
              <strong>Source note</strong>
              <p>The supplied and publicly available sample stops after Problem 1.10. This 6-5-5 map puzzle is an independently written reconstruction based on the listed title and one-star rating; it is not transcribed from the book.</p>
            </aside>
            <section class="prediction-box p112-prediction">
              <div class="eyebrow">Map-reading idea</div>
              <p>A fixed distance from one landmark traces a circle. Try positioning the marker first, then add either or both clue circles.</p>
            </section>
          </article>

          <section class="book-page book-stage p112-stage">
            ${stageControls()}
            ${mapSvg()}
            <div class="book-stage-caption p112-stage-caption" aria-live="polite">
              <div><div class="eyebrow">Clue view ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
              <div class="p112-stage-equation">AT = 5 &nbsp;·&nbsp; BT = 5<br>and y &gt; 0</div>
            </div>
            <p class="p112-map-help" id="p112-map-help"><strong>Move T:</strong> tap or drag on the map. With the marker focused, use Arrow keys for 0.1 units, Shift+Arrow for 0.5, or Page Up/Down for 1 unit north/south.</p>
            ${liveReadout()}
          </section>

          <aside class="book-page book-coach p112-coach">
            <div class="coach-kicker">Estimate first</div>
            <p class="coach-question">How high above AB do you expect the northern treasure point to be?</p>
            <form class="estimate-form p112-estimate-form" data-p112-estimate-form novalidate>
              <label for="p112-estimate">Estimated height above AB</label>
              <div class="estimate-field"><input id="p112-estimate" class="estimate-input p112-estimate-input" data-p112-estimate-input inputmode="decimal" type="number" min="0" max="6" step="0.1" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 4.2" /><span>units</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row p112-help-row">
              <button class="secondary-button" type="button" data-problem-action="p112-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p112-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Problem 1.12 development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.12")}
      </main>`;
  }

  function updateLiveMap() {
    const root = document.querySelector(".p112-book-shell");
    if (!root) return;
    const point = mapToSvg(state);
    const measurement = distances();
    const status = locatorStatus(measurement);
    const labelX = clamp(point.x + 18, 34, VIEW.width - 92);
    const labelY = clamp(point.y - 17, 30, VIEW.height - 22);
    const setAttributes = (selector, attributes) => {
      root.querySelectorAll(selector).forEach((node) => {
        Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
      });
    };
    const setText = (selector, value) => {
      root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
    };

    setAttributes("[data-p112-line-a]", { x2: point.x, y2: point.y });
    setAttributes("[data-p112-line-b]", { x2: point.x, y2: point.y });
    setAttributes("[data-p112-treasure-mark]", {
      d: `M ${point.x} ${point.y - 11} L ${point.x + 11} ${point.y} L ${point.x} ${point.y + 11} L ${point.x - 11} ${point.y} Z`,
    });
    setAttributes("[data-p112-treasure-label]", { x: labelX, y: labelY });
    setAttributes("[data-p112-treasure-handle]", {
      cx: point.x,
      cy: point.y,
      "aria-label": treasureAccessibleLabel(),
    });
    setText("[data-p112-treasure-label]", `T (${formatCoordinate(state.x)}, ${formatCoordinate(state.y)})`);
    setText("[data-p112-map-desc]", mapDescription());
    setText('[data-p112-live="x"]', formatCoordinate(state.x));
    setText('[data-p112-live="y"]', formatCoordinate(state.y));
    setText('[data-p112-live="distance-a"]', format(measurement.fromA));
    setText('[data-p112-live="distance-b"]', format(measurement.fromB));
    setText('[data-p112-live="error-a"]', formatError(measurement.errorA));
    setText('[data-p112-live="error-b"]', formatError(measurement.errorB));
    setText('[data-p112-live="north"]', measurement.north ? "North ✓" : state.y === 0 ? "On AB" : "South ✕");

    const cardA = root.querySelector("[data-p112-card-a]");
    const cardB = root.querySelector("[data-p112-card-b]");
    const northCard = root.querySelector("[data-p112-north-card]");
    cardA?.classList.toggle("p112-distance-met", measurement.meetsA);
    cardB?.classList.toggle("p112-distance-met", measurement.meetsB);
    northCard?.classList.toggle("p112-north-met", measurement.north);
    const statusNode = root.querySelector("[data-p112-locator-status]");
    if (statusNode) {
      statusNode.className = `p112-locator-status p112-status-${status.tone}`;
      statusNode.textContent = status.text;
    }
  }

  function pointerInSvg(event, svg) {
    if (typeof svg.createSVGPoint === "function" && svg.getScreenCTM()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse());
    }
    const bounds = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * VIEW.width,
      y: ((event.clientY - bounds.top) / bounds.height) * VIEW.height,
    };
  }

  function setPointFromPointer(event, svg) {
    const point = pointerInSvg(event, svg);
    setPoint((point.x - VIEW.originX) / VIEW.scale, (VIEW.originY - point.y) / VIEW.scale);
    updateLiveMap();
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p112-book-shell");
    if (!root) return;

    root.querySelectorAll('[data-problem-action^="p112-"]').forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p112-reset") state = initialState();
        if (action === "p112-stage") state.stage = clamp(Number(control.dataset.p112Stage), 0, stages.length - 1);
        if (action === "p112-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p112-reveal") {
          state.revealed = true;
          state.stage = 2;
          setPoint(3, 4);
        }
        renderApp();
        if (action === "p112-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p112-solution-heading")?.focus());
        }
      });
    });

    const estimateForm = root.querySelector("[data-p112-estimate-form]");
    const estimateInput = root.querySelector("[data-p112-estimate-input]");
    estimateInput?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.committed = false;
      state.feedback = "";
      state.feedbackTone = "";
    });
    estimateForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = estimateInput?.value.trim() ?? "";
      const estimate = Number(raw);
      state.estimate = raw;
      state.feedbackTone = "";
      if (!raw || !Number.isFinite(estimate) || estimate < 0 || estimate > 6) {
        state.committed = false;
        state.feedback = "Enter a height from 0 to 6 map units first.";
      } else {
        state.committed = true;
        if (Math.abs(estimate - 4) <= 0.25) {
          state.feedbackTone = "success";
          state.feedback = "Strong estimate - you are within a quarter unit of the exact height.";
        } else if (estimate < 4) {
          state.feedback = "Your estimate is low. Use half of AB as one leg of a right triangle and 5 as its hypotenuse.";
        } else {
          state.feedback = "Your estimate is high. A 5-unit radius must cover both the vertical height and a 3-unit horizontal leg.";
        }
      }
      renderApp();
    });

    const map = root.querySelector("[data-p112-map]");
    const handle = root.querySelector("[data-p112-treasure-handle]");
    if (!map || !handle) return;

    map.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activePointerId = event.pointerId;
      map.setPointerCapture(event.pointerId);
      setPointFromPointer(event, map);
    });
    map.addEventListener("pointermove", (event) => {
      if (activePointerId === event.pointerId && map.hasPointerCapture(event.pointerId)) {
        setPointFromPointer(event, map);
      }
    });
    map.addEventListener("pointerup", (event) => {
      if (activePointerId !== event.pointerId) return;
      setPointFromPointer(event, map);
      if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
      activePointerId = null;
      handle.focus();
    });
    map.addEventListener("pointercancel", (event) => {
      if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
      activePointerId = null;
      handle.focus();
    });
    handle.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 0.5 : 0.1;
      let nextX = state.x;
      let nextY = state.y;
      if (event.key === "ArrowLeft") nextX -= step;
      else if (event.key === "ArrowRight") nextX += step;
      else if (event.key === "ArrowUp") nextY += step;
      else if (event.key === "ArrowDown") nextY -= step;
      else if (event.key === "PageUp") nextY += 1;
      else if (event.key === "PageDown") nextY -= 1;
      else return;
      event.preventDefault();
      setPoint(nextX, nextY);
      updateLiveMap();
    });
  }

  window.poveyProblemPages["1.12"] = { render, bind };
}());
