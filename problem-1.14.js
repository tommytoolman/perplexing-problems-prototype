(function registerCaptainFistfullsTreasureThreePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const LANDMARKS = Object.freeze({
    A: Object.freeze({ x: 0, y: 0, squaredRadius: 25, radiusLabel: "5" }),
    B: Object.freeze({ x: 8, y: 0, squaredRadius: 41, radiusLabel: "√41" }),
    C: Object.freeze({ x: 2, y: 6, squaredRadius: 5, radiusLabel: "√5" }),
  });
  const SOLUTION = Object.freeze({ x: 3, y: 4 });
  const VIEW = Object.freeze({
    width: 720,
    height: 530,
    originX: 202,
    originY: 290,
    scale: 30,
    minX: -6,
    maxX: 15,
    minY: -7,
    maxY: 9,
  });
  const TOLERANCE = 0.14;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p114-reset">Reset</button>';

  const stages = Object.freeze([
    Object.freeze({
      label: "Landmarks",
      title: "Measure from three fixed stars",
      copy: "Move T around the chart. Each readout compares your candidate with one independently specified distance.",
      equation: "A=(0,0) · B=(8,0) · C=(2,6)",
    }),
    Object.freeze({
      label: "Two circles",
      title: "Two clues still leave a reflection",
      copy: "The A and B circles cross twice, at (3,4) and (3,-4). With only those clues, both candidates are valid.",
      equation: "AT²=25 · BT²=41",
    }),
    Object.freeze({
      label: "Third circle",
      title: "The third distance breaks the tie",
      copy: "Only (3,4) also lies √5 units from C. The reflected point is much too far from the third landmark.",
      equation: "CT²=5",
    }),
    Object.freeze({
      label: "Radical axes",
      title: "Subtract before you solve",
      copy: "Subtracting squared-circle equations removes x²+y². Two independent radical axes meet once; the third confirms the same point.",
      equation: "x=3 · x+3y=15 · y=x+1",
    }),
  ]);

  const hints = Object.freeze([
    "Write one squared-distance equation for each landmark. For A, start with x²+y²=25.",
    "Subtract the A equation from the B equation. The y² terms cancel, and so do the x² terms after expansion.",
    "The first subtraction gives x=3. The A and B circles therefore leave the reflected candidates (3,4) and (3,-4).",
    "Now subtract the A equation from the C equation. Simplifying gives x+3y=15; combine that with x=3.",
  ]);

  const initialState = () => ({
    x: 4.8,
    y: 1.8,
    stage: 0,
    estimateX: "",
    estimateY: "",
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
    const rounded = Math.round(Number(value) * 10) / 10;
    return Math.abs(rounded) < 0.05 ? 0 : rounded;
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

  function format(value, digits = 2) {
    const safe = Math.abs(Number(value)) < 0.5 * (10 ** -digits) ? 0 : Number(value);
    return safe.toFixed(digits);
  }

  function formatCoordinate(value) {
    return format(value, 1);
  }

  function measurementFor(name, x = state.x, y = state.y) {
    const landmark = LANDMARKS[name];
    const squaredDistance = ((x - landmark.x) ** 2) + ((y - landmark.y) ** 2);
    const distance = Math.sqrt(squaredDistance);
    const target = Math.sqrt(landmark.squaredRadius);
    return {
      squaredDistance,
      distance,
      target,
      error: distance - target,
      met: Math.abs(distance - target) <= TOLERANCE,
    };
  }

  function measurements(x = state.x, y = state.y) {
    return {
      A: measurementFor("A", x, y),
      B: measurementFor("B", x, y),
      C: measurementFor("C", x, y),
    };
  }

  function metCount(current = measurements()) {
    return [current.A, current.B, current.C].filter((item) => item.met).length;
  }

  function locatorStatus(current = measurements()) {
    const count = metCount(current);
    if (count === 3) {
      return { tone: "success", text: "Located: T satisfies all three distance clues." };
    }
    if (current.A.met && current.B.met && !current.C.met) {
      return { tone: "ambiguous", text: "A two-circle candidate: A and B fit, but C rejects this point." };
    }
    if (count === 2) {
      return { tone: "near", text: "Two clues fit. The remaining distance decides whether this is the treasure." };
    }
    if (count === 1) {
      return { tone: "near", text: "One circle fits. Follow its circumference until the other readings improve." };
    }
    return { tone: "searching", text: "Searching: move T until its three distance errors approach zero." };
  }

  function gridMarkup() {
    const lines = [];
    for (let x = VIEW.minX; x <= VIEW.maxX; x += 1) {
      const point = mapToSvg({ x, y: 0 });
      lines.push(`<line x1="${point.x}" y1="20" x2="${point.x}" y2="510" />`);
    }
    for (let y = VIEW.minY; y <= VIEW.maxY; y += 1) {
      const point = mapToSvg({ x: 0, y });
      lines.push(`<line x1="22" y1="${point.y}" x2="698" y2="${point.y}" />`);
    }
    return lines.join("");
  }

  function circlesMarkup() {
    if (state.stage < 1) return "";
    const names = state.stage >= 2 ? ["A", "B", "C"] : ["A", "B"];
    return names.map((name) => {
      const landmark = LANDMARKS[name];
      const centre = mapToSvg(landmark);
      const radius = Math.sqrt(landmark.squaredRadius) * VIEW.scale;
      const labelPoint = name === "A"
        ? { x: centre.x - 104, y: centre.y - 116 }
        : name === "B"
          ? { x: centre.x + 66, y: centre.y - 146 }
          : { x: centre.x + 31, y: centre.y - 52 };
      return `
        <circle class="p114-clue-circle p114-circle-${name.toLowerCase()}" cx="${centre.x}" cy="${centre.y}" r="${format(radius, 3)}" />
        <text class="p114-circle-label p114-circle-label-${name.toLowerCase()}" x="${labelPoint.x}" y="${labelPoint.y}">${landmark.radiusLabel} from ${name}</text>`;
    }).join("");
  }

  function ambiguityMarkup() {
    if (state.stage < 1) return "";
    const north = mapToSvg({ x: 3, y: 4 });
    const south = mapToSvg({ x: 3, y: -4 });
    const thirdClueVisible = state.stage >= 2;
    return `
      <g class="p114-ambiguity" aria-hidden="true">
        <circle class="p114-fixed-candidate ${thirdClueVisible ? "p114-fixed-valid" : ""}" cx="${north.x}" cy="${north.y}" r="10" />
        <text x="${north.x + 16}" y="${north.y - 12}">(3, 4)${thirdClueVisible ? " · fits C ✓" : ""}</text>
        <circle class="p114-fixed-candidate ${thirdClueVisible ? "p114-fixed-rejected" : ""}" cx="${south.x}" cy="${south.y}" r="10" />
        ${thirdClueVisible ? `<path class="p114-reject-mark" d="M${south.x - 8} ${south.y - 8} L${south.x + 8} ${south.y + 8} M${south.x + 8} ${south.y - 8} L${south.x - 8} ${south.y + 8}" />` : ""}
        <text x="${south.x + 16}" y="${south.y + 24}">(3, -4)${thirdClueVisible ? " · fails C ✕" : ""}</text>
      </g>`;
  }

  function radicalAxesMarkup() {
    if (state.stage < 3) return "";
    const abTop = mapToSvg({ x: 3, y: VIEW.maxY });
    const abBottom = mapToSvg({ x: 3, y: VIEW.minY });
    const acLeft = mapToSvg({ x: VIEW.minX, y: 7 });
    const acRight = mapToSvg({ x: VIEW.maxX, y: 0 });
    const bcLeft = mapToSvg({ x: VIEW.minX, y: -5 });
    const bcRight = mapToSvg({ x: 8, y: VIEW.maxY });
    return `
      <g class="p114-radical-axes" aria-hidden="true">
        <line class="p114-axis-ab" x1="${abTop.x}" y1="${abTop.y}" x2="${abBottom.x}" y2="${abBottom.y}" />
        <text class="p114-axis-label p114-axis-label-ab" x="${abTop.x + 8}" y="42">AB axis: x = 3</text>
        <line class="p114-axis-ac" x1="${acLeft.x}" y1="${acLeft.y}" x2="${acRight.x}" y2="${acRight.y}" />
        <text class="p114-axis-label p114-axis-label-ac" x="32" y="72">AC axis: x + 3y = 15</text>
        <line class="p114-axis-bc" x1="${bcLeft.x}" y1="${bcLeft.y}" x2="${bcRight.x}" y2="${bcRight.y}" />
        <text class="p114-axis-label p114-axis-label-bc" x="464" y="54">BC check: y = x + 1</text>
      </g>`;
  }

  function mapDescription() {
    const current = measurements();
    return `Trilateration chart at construction stage ${state.stage + 1} of 4, ${stages[state.stage].label}. Candidate T is at (${formatCoordinate(state.x)}, ${formatCoordinate(state.y)}). Distances are ${format(current.A.distance)} from A, ${format(current.B.distance)} from B, and ${format(current.C.distance)} from C. ${locatorStatus(current).text}`;
  }

  function treasureAccessibleLabel() {
    const current = measurements();
    return `Movable candidate T at x ${formatCoordinate(state.x)}, y ${formatCoordinate(state.y)}. Distance to A ${format(current.A.distance)}, to B ${format(current.B.distance)}, to C ${format(current.C.distance)}. Use arrow keys to move.`;
  }

  function mapSvg() {
    const point = mapToSvg(state);
    const labelX = clamp(point.x + 17, 28, VIEW.width - 102);
    const labelY = clamp(point.y - 16, 28, VIEW.height - 24);
    const landmarks = Object.entries(LANDMARKS).map(([name, landmark]) => {
      const centre = mapToSvg(landmark);
      const labelXOffset = name === "B" ? 15 : -9;
      const textAnchor = name === "B" ? "start" : "end";
      return `
        <circle cx="${centre.x}" cy="${centre.y}" r="7" />
        <text x="${centre.x + labelXOffset}" y="${centre.y - 13}" text-anchor="${textAnchor}">${name} (${landmark.x}, ${landmark.y})</text>`;
    }).join("");
    const liveRadii = Object.entries(LANDMARKS).map(([name, landmark]) => {
      const centre = mapToSvg(landmark);
      return `<line data-p114-radius-line="${name}" x1="${centre.x}" y1="${centre.y}" x2="${point.x}" y2="${point.y}" />`;
    }).join("");

    return `
      <svg class="route-svg p114-map" data-p114-map viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="group" aria-labelledby="p114-map-title" aria-describedby="p114-map-desc p114-map-help">
        <title id="p114-map-title">Interactive three-landmark treasure chart</title>
        <desc id="p114-map-desc" data-p114-map-desc>${mapDescription()}</desc>
        <rect class="p114-map-paper" x="9" y="9" width="702" height="512" rx="18" />
        <g class="p114-grid" aria-hidden="true">${gridMarkup()}</g>
        <g class="p114-coordinate-axes" aria-hidden="true">
          <line x1="22" y1="${VIEW.originY}" x2="698" y2="${VIEW.originY}" />
          <line x1="${VIEW.originX}" y1="20" x2="${VIEW.originX}" y2="510" />
          <text x="684" y="${VIEW.originY - 9}">x</text><text x="${VIEW.originX + 9}" y="34">y</text>
        </g>
        ${circlesMarkup()}
        ${ambiguityMarkup()}
        ${radicalAxesMarkup()}
        <g class="p114-live-radii" aria-hidden="true">${liveRadii}</g>
        <g class="p114-landmarks" aria-hidden="true">${landmarks}</g>
        <g class="p114-treasure" aria-hidden="true">
          <path data-p114-treasure-mark d="M${point.x} ${point.y - 11} L${point.x + 11} ${point.y} L${point.x} ${point.y + 11} L${point.x - 11} ${point.y} Z" />
          <text data-p114-treasure-label x="${labelX}" y="${labelY}">T (${formatCoordinate(state.x)}, ${formatCoordinate(state.y)})</text>
        </g>
        <circle class="p114-treasure-handle" data-p114-treasure-handle cx="${point.x}" cy="${point.y}" r="29" role="group" tabindex="0" focusable="true" aria-label="${treasureAccessibleLabel()}" />
      </svg>`;
  }

  function stageControls() {
    return `
      <div class="p114-stage-controls" role="group" aria-label="Trilateration construction stage">
        ${stages.map((stage, index) => `
          <button class="chip-button p114-stage-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p114-stage" data-p114-stage="${index}" ${state.stage === index ? 'aria-current="step"' : ""}>
            <span>${index + 1}</span>${stage.label}
          </button>`).join("")}
      </div>`;
  }

  function distanceCard(name, measurement) {
    const landmark = LANDMARKS[name];
    const error = Math.abs(measurement.error) < 0.005 ? "0.00" : `${measurement.error > 0 ? "+" : ""}${format(measurement.error)}`;
    return `
      <div class="p114-distance-card ${measurement.met ? "p114-distance-met" : ""}" data-p114-distance-card="${name}">
        <small>Distance to ${name}</small>
        <strong><span data-p114-live="distance-${name}">${format(measurement.distance)}</span> / ${landmark.radiusLabel}</strong>
        <span>error <b data-p114-live="error-${name}">${error}</b></span>
      </div>`;
  }

  function liveReadout() {
    const current = measurements();
    const status = locatorStatus(current);
    return `
      <div class="p114-readout">
        <div class="p114-coordinate-card">
          <small>Candidate T</small>
          <strong>(<span data-p114-live="x">${formatCoordinate(state.x)}</span>, <span data-p114-live="y">${formatCoordinate(state.y)}</span>)</strong>
          <span>drag, tap, or use keys</span>
        </div>
        ${distanceCard("A", current.A)}
        ${distanceCard("B", current.B)}
        ${distanceCard("C", current.C)}
      </div>
      <div class="p114-locator-status p114-status-${status.tone}" data-p114-locator-status role="status" aria-live="polite">${status.text}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p114-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p114-hint-stack">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p114-solution" aria-labelledby="p114-solution-heading">
        <h2 id="p114-solution-heading" tabindex="-1">Three circles, one common point</h2>
        <p>For T=(x,y), square the three given distances:</p>
        <div class="equation">x²+y²=25</div>
        <div class="equation">(x-8)²+y²=41</div>
        <div class="equation">(x-2)²+(y-6)²=5</div>
        <p>Subtract A's equation from B's. The quadratic terms cancel:</p>
        <div class="equation">-16x+64=16 &nbsp;⇒&nbsp; x=3.</div>
        <p>This is the A-B radical axis. With the first circle it leaves (3,4) and (3,-4). Now subtract A's equation from C's:</p>
        <div class="equation">-4x-12y+40=-20 &nbsp;⇒&nbsp; x+3y=15.</div>
        <p>Putting x=3 into the second radical axis gives y=4. The B-C subtraction also gives y=x+1, passing through the same point.</p>
        <div class="equation p114-answer">T = (3, 4)</div>
        <div class="p114-verification">
          <strong>Direct check</strong>
          <span>TA²=3²+4²=25</span>
          <span>TB²=(-5)²+4²=41</span>
          <span>TC²=1²+(-2)²=5</span>
        </div>
        <p class="p114-unique-note"><strong>Why unique?</strong> The independent lines x=3 and x+3y=15 have determinant 3, so they meet at exactly one point. That point satisfies all three original circle equations.</p>
      </section>`;
  }

  function stateSnapshot() {
    const current = measurements();
    return JSON.stringify({
      problem: "1.14",
      provenance: "reconstructed activity; source body unavailable",
      candidate: [state.x, state.y],
      constructionStage: state.stage + 1,
      squaredDistances: {
        A: Number(current.A.squaredDistance.toFixed(6)),
        B: Number(current.B.squaredDistance.toFixed(6)),
        C: Number(current.C.squaredDistance.toFixed(6)),
      },
      targetSquaredDistances: { A: 25, B: 41, C: 5 },
      cluesMet: metCount(current),
      radicalAxesAtCandidate: {
        xEquals3Residual: Number((state.x - 3).toFixed(6)),
        xPlus3yEquals15Residual: Number((state.x + (3 * state.y) - 15).toFixed(6)),
        yEqualsXPlus1Residual: Number((state.y - state.x - 1).toFixed(6)),
      },
      estimate: state.estimateX === "" || state.estimateY === "" ? null : [Number(state.estimateX), Number(state.estimateY)],
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const stage = stages[state.stage];
    return `
      <main class="book-shell p114-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p114-progress"><span></span></div></div>
          ${problemHeaderActions("1.14", resetMarkup)}
        </header>

        <div class="book-spread p114-spread">
          <article class="book-page p114-problem-page">
            <div class="problem-number">Problem 1.14</div>
            <h1 class="book-title p114-book-title">Captain Fistfulls' treasure III</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <div class="p114-reconstruction-label">Reconstructed activity</div>
            <p class="problem-copy">A treasure chart uses three landmarks: A=(0,0), B=(8,0), and C=(2,6). The treasure is 5 units from A, √41 units from B, and √5 units from C.</p>
            <p class="p114-question"><strong>Locate the unique treasure point.</strong> Explain why two clues are ambiguous and how the third distance resolves them.</p>
            <aside class="p114-source-note" aria-label="Reconstruction note">
              <strong>Source note</strong>
              <p>The available sample ends after Problem 1.10. This independently written trilateration activity uses the listed 1.14 title and three-star rating only; its wording, numbers, diagram, and solution are not transcribed from the book.</p>
            </aside>
            <section class="prediction-box p114-prediction">
              <div class="eyebrow">Before expanding</div>
              <p>Why might subtracting two squared-distance equations be easier than solving either circle directly?</p>
            </section>
          </article>

          <section class="book-page book-stage p114-stage">
            ${stageControls()}
            ${mapSvg()}
            <div class="book-stage-caption" aria-live="polite">
              <div><div class="eyebrow">Construction ${state.stage + 1} of 4</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
              <div class="p114-stage-equation">${stage.equation}</div>
            </div>
            <p class="p114-map-help" id="p114-map-help"><strong>Move T:</strong> tap or drag anywhere on the chart. Focus the diamond and use Arrow keys for 0.1 units, Shift+Arrow for 0.5, or Page Up/Down for 1 unit vertically.</p>
            ${liveReadout()}
          </section>

          <aside class="book-page book-coach p114-coach">
            <div class="coach-kicker">Commit a coordinate</div>
            <p class="coach-question">Where do you think all three distance circles meet?</p>
            <form class="estimate-form p114-estimate-form" data-p114-estimate-form novalidate>
              <div class="p114-coordinate-inputs">
                <label for="p114-estimate-x">x coordinate<input id="p114-estimate-x" class="estimate-input" data-p114-estimate-x inputmode="decimal" type="number" min="${VIEW.minX}" max="${VIEW.maxX}" step="0.1" value="${escapeAttribute(state.estimateX)}" placeholder="x" /></label>
                <label for="p114-estimate-y">y coordinate<input id="p114-estimate-y" class="estimate-input" data-p114-estimate-y inputmode="decimal" type="number" min="${VIEW.minY}" max="${VIEW.maxY}" step="0.1" value="${escapeAttribute(state.estimateY)}" placeholder="y" /></label>
              </div>
              <button class="primary-button" type="submit">Commit coordinate</button>
            </form>
            <div class="button-row p114-help-row">
              <button class="secondary-button" type="button" data-problem-action="p114-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p114-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Problem 1.14 development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.14")}
      </main>`;
  }

  function updateLiveMap() {
    const root = document.querySelector(".p114-book-shell");
    if (!root) return;
    const point = mapToSvg(state);
    const current = measurements();
    const status = locatorStatus(current);
    const labelX = clamp(point.x + 17, 28, VIEW.width - 102);
    const labelY = clamp(point.y - 16, 28, VIEW.height - 24);
    const setAttributes = (selector, attributes) => {
      root.querySelectorAll(selector).forEach((node) => {
        Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
      });
    };
    const setText = (selector, value) => {
      root.querySelectorAll(selector).forEach((node) => { node.textContent = String(value); });
    };

    Object.entries(LANDMARKS).forEach(([name]) => {
      setAttributes(`[data-p114-radius-line="${name}"]`, { x2: point.x, y2: point.y });
    });
    setAttributes("[data-p114-treasure-mark]", {
      d: `M${point.x} ${point.y - 11} L${point.x + 11} ${point.y} L${point.x} ${point.y + 11} L${point.x - 11} ${point.y} Z`,
    });
    setAttributes("[data-p114-treasure-label]", { x: labelX, y: labelY });
    setAttributes("[data-p114-treasure-handle]", { cx: point.x, cy: point.y, "aria-label": treasureAccessibleLabel() });
    setText("[data-p114-treasure-label]", `T (${formatCoordinate(state.x)}, ${formatCoordinate(state.y)})`);
    setText("[data-p114-map-desc]", mapDescription());
    setText('[data-p114-live="x"]', formatCoordinate(state.x));
    setText('[data-p114-live="y"]', formatCoordinate(state.y));

    Object.entries(current).forEach(([name, measurement]) => {
      const error = Math.abs(measurement.error) < 0.005 ? "0.00" : `${measurement.error > 0 ? "+" : ""}${format(measurement.error)}`;
      setText(`[data-p114-live="distance-${name}"]`, format(measurement.distance));
      setText(`[data-p114-live="error-${name}"]`, error);
      root.querySelector(`[data-p114-distance-card="${name}"]`)?.classList.toggle("p114-distance-met", measurement.met);
    });

    const statusNode = root.querySelector("[data-p114-locator-status]");
    if (statusNode) {
      statusNode.className = `p114-locator-status p114-status-${status.tone}`;
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

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p114-book-shell");
    if (!root) return;

    root.querySelectorAll('[data-problem-action^="p114-"]').forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p114-reset") state = initialState();
        if (action === "p114-stage") {
          state.stage = clamp(Number(control.dataset.p114Stage), 0, stages.length - 1);
        }
        if (action === "p114-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          state.stage = Math.max(state.stage, Math.min(3, state.hintsUsed - 1));
        }
        if (action === "p114-reveal") {
          state.revealed = true;
          state.stage = 3;
          setPoint(SOLUTION.x, SOLUTION.y);
        }
        renderApp();
        if (action === "p114-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p114-solution-heading")?.focus());
        } else if (action === "p114-stage") {
          window.requestAnimationFrame(() => document.querySelector(`[data-problem-action="p114-stage"][data-p114-stage="${state.stage}"]`)?.focus());
        }
      });
    });

    const form = root.querySelector("[data-p114-estimate-form]");
    const inputX = root.querySelector("[data-p114-estimate-x]");
    const inputY = root.querySelector("[data-p114-estimate-y]");
    [inputX, inputY].forEach((input) => {
      input?.addEventListener("input", () => {
        state.estimateX = inputX?.value ?? "";
        state.estimateY = inputY?.value ?? "";
        state.committed = false;
        state.feedback = "";
        state.feedbackTone = "";
      });
    });
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const rawX = inputX?.value.trim() ?? "";
      const rawY = inputY?.value.trim() ?? "";
      const x = Number(rawX);
      const y = Number(rawY);
      state.estimateX = rawX;
      state.estimateY = rawY;
      state.feedbackTone = "";
      if (!rawX || !rawY || !Number.isFinite(x) || !Number.isFinite(y) || x < VIEW.minX || x > VIEW.maxX || y < VIEW.minY || y > VIEW.maxY) {
        state.committed = false;
        state.feedback = `Enter both coordinates within the chart: x from ${VIEW.minX} to ${VIEW.maxX}, y from ${VIEW.minY} to ${VIEW.maxY}.`;
      } else {
        state.committed = true;
        const estimateMeasurements = measurements(x, y);
        if (Math.abs(x - SOLUTION.x) <= 0.25 && Math.abs(y - SOLUTION.y) <= 0.25) {
          state.feedbackTone = "success";
          state.feedback = "Strong estimate: your coordinate is within a quarter unit of the unique common point.";
          state.stage = Math.max(state.stage, 2);
        } else if (Math.abs(x - 3) <= 0.25 && Math.abs(y + 4) <= 0.25) {
          state.feedback = "That is the reflected A-B intersection. It satisfies the first two circles, but its distance from C is √101, not √5.";
          state.stage = Math.max(state.stage, 2);
        } else if (estimateMeasurements.A.met && estimateMeasurements.B.met) {
          state.feedback = "You have fitted the first two distances. Test the third distance from C before committing to this candidate.";
          state.stage = Math.max(state.stage, 2);
        } else if (Math.abs(x - 3) > 0.25) {
          state.feedback = "Start by subtracting the A and B squared-distance equations; their radical axis fixes x exactly.";
        } else {
          state.feedback = "Your x coordinate is on the A-B radical axis. Use x+3y=15 to determine y.";
        }
      }
      renderAndFocus(renderApp, "[data-p114-estimate-x]");
    });

    const map = root.querySelector("[data-p114-map]");
    const handle = root.querySelector("[data-p114-treasure-handle]");
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
      else if (event.key === "Home") { nextX = SOLUTION.x; nextY = SOLUTION.y; }
      else return;
      event.preventDefault();
      setPoint(nextX, nextY);
      updateLiveMap();
    });
  }

  window.poveyProblemPages["1.14"] = { render, bind };
}());
