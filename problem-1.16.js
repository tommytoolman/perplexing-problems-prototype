(function registerEasyishFencingPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const BUDGETS = Object.freeze([60, 80, 100, 120]);
  const STEP = 0.5;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p116-reset">Reset</button>';

  const hints = [
    "Only three sides need fence. If each perpendicular side has depth x and the remaining side has length y, then 2x + y = P.",
    "Rearrange the fence equation to y = P - 2x. The area is therefore A(x) = x(P - 2x).",
    "The graph is a downward-opening parabola. Try depths equally far below and above P/4; they enclose the same area.",
    "Complete the square: A(x) = P²/8 - 2(x - P/4)². The subtracted square is smallest when x = P/4.",
  ];

  const initialState = () => ({
    fence: 100,
    depth: 20,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();
  let activeSliderPointer = null;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function roundToStep(value) {
    return Math.round(Number(value) / STEP) * STEP;
  }

  function setDepth(value) {
    state.depth = roundToStep(clamp(value, 0, state.fence / 2));
  }

  function dimensions(depth = state.depth, fence = state.fence) {
    const x = clamp(depth, 0, fence / 2);
    const y = fence - 2 * x;
    const area = x * y;
    return { x, y, area };
  }

  function optimum(fence = state.fence) {
    return { x: fence / 4, y: fence / 2, area: (fence ** 2) / 8 };
  }

  function mirrorDepth(depth = state.depth, fence = state.fence) {
    return fence / 2 - depth;
  }

  function format(value) {
    const rounded = Math.round(Number(value) * 10) / 10;
    return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function enclosureGeometry(depth = state.depth, fence = state.fence) {
    const values = dimensions(depth, fence);
    const scale = Math.min(390 / fence, 165 / (fence / 2));
    const width = values.y * scale;
    const height = values.x * scale;
    return {
      ...values,
      left: 260 - width / 2,
      right: 260 + width / 2,
      top: 76,
      bottom: 76 + height,
    };
  }

  function enclosureDescription() {
    const values = dimensions();
    return `A rectangle beside a straight river. Its two fenced depths are ${format(values.x)} metres each, its fenced river-parallel length is ${format(values.y)} metres, the fence used is ${format(2 * values.x + values.y)} metres, and its area is ${format(values.area)} square metres.`;
  }

  function enclosureSvg() {
    const box = enclosureGeometry();
    return `
      <svg class="route-svg p116-enclosure" data-p116-enclosure viewBox="0 0 520 275" role="img" aria-labelledby="p116-enclosure-title" aria-describedby="p116-enclosure-desc">
        <title id="p116-enclosure-title">Three-sided riverside enclosure</title>
        <desc id="p116-enclosure-desc" data-p116-enclosure-desc>${enclosureDescription()}</desc>
        <defs>
          <pattern id="p116-field-pattern" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <rect width="14" height="14" fill="#f4e7b5" />
            <line x1="0" y1="0" x2="0" y2="14" stroke="#decc83" stroke-width="3" opacity="0.55" />
          </pattern>
        </defs>
        <path class="p116-river" d="M16 53 C60 28 102 73 146 48 S232 68 276 47 S362 70 407 45 S475 63 504 43" />
        <text class="p116-river-label" x="28" y="26">straight river - no fence here</text>
        <rect class="p116-field" data-p116-field x="${box.left}" y="${box.top}" width="${box.right - box.left}" height="${box.bottom - box.top}" />
        <path class="p116-fence" data-p116-fence d="M${box.left} ${box.top} V${box.bottom} H${box.right} V${box.top}" />
        <g class="p116-dimension p116-depth-dimension" data-p116-depth-dimension transform="translate(${box.left - 18} ${box.top})">
          <line x1="0" y1="0" x2="0" y2="${box.bottom - box.top}" />
          <text data-p116-svg-live="depth-label" x="-7" y="${(box.bottom - box.top) / 2}">x = ${format(box.x)} m</text>
        </g>
        <g class="p116-dimension p116-length-dimension" data-p116-length-dimension transform="translate(${box.left} ${box.bottom + 18})">
          <line x1="0" y1="0" x2="${box.right - box.left}" y2="0" />
          <text data-p116-svg-live="length-label" x="${(box.right - box.left) / 2}" y="19">y = ${format(box.y)} m</text>
        </g>
        <g class="p116-area-badge" data-p116-area-badge transform="translate(260 ${Math.min(245, Math.max(116, box.top + (box.bottom - box.top) / 2))})">
          <rect x="-71" y="-24" width="142" height="48" rx="13" />
          <text data-p116-svg-live="area" x="0" y="-2">${format(box.area)} m²</text>
          <text x="0" y="14">enclosed area</text>
        </g>
      </svg>`;
  }

  function graphGeometry(depth = state.depth, fence = state.fence) {
    const plot = { left: 55, right: 493, top: 24, bottom: 218 };
    const best = optimum(fence);
    const xFor = (x) => plot.left + (x / (fence / 2)) * (plot.right - plot.left);
    const yFor = (area) => plot.bottom - (area / best.area) * (plot.bottom - plot.top);
    const values = dimensions(depth, fence);
    const mirror = mirrorDepth(depth, fence);
    return {
      ...plot,
      currentX: xFor(values.x),
      currentY: yFor(values.area),
      mirrorX: xFor(mirror),
      mirrorY: yFor(values.area),
      bestX: xFor(best.x),
      bestY: yFor(best.area),
    };
  }

  function graphPath(fence = state.fence) {
    const graph = graphGeometry(0, fence);
    return Array.from({ length: 41 }, (_, index) => {
      const depth = (fence / 2) * (index / 40);
      const area = dimensions(depth, fence).area;
      const x = graph.left + (depth / (fence / 2)) * (graph.right - graph.left);
      const y = graph.bottom - (area / optimum(fence).area) * (graph.bottom - graph.top);
      return `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
  }

  function graphDescription() {
    const values = dimensions();
    const best = optimum();
    const mirror = mirrorDepth();
    return `A downward-opening area graph from depth 0 to ${format(state.fence / 2)} metres. The current depth ${format(values.x)} gives area ${format(values.area)} square metres. Its reflected depth ${format(mirror)} gives the same area. The maximum is ${format(best.area)} square metres at depth ${format(best.x)}.`;
  }

  function graphSvg() {
    const graph = graphGeometry();
    const best = optimum();
    return `
      <svg class="route-svg p116-graph" viewBox="0 0 520 255" role="img" aria-labelledby="p116-graph-title" aria-describedby="p116-graph-desc">
        <title id="p116-graph-title">Area against enclosure depth</title>
        <desc id="p116-graph-desc" data-p116-graph-desc>${graphDescription()}</desc>
        <g class="p116-grid" aria-hidden="true">
          <line x1="55" y1="218" x2="493" y2="218" />
          <line x1="55" y1="121" x2="493" y2="121" />
          <line x1="55" y1="24" x2="493" y2="24" />
          <line x1="55" y1="24" x2="55" y2="218" />
          <line x1="274" y1="24" x2="274" y2="218" />
          <line x1="493" y1="24" x2="493" y2="218" />
        </g>
        <g class="p116-axes" aria-hidden="true">
          <line x1="55" y1="218" x2="501" y2="218" />
          <line x1="55" y1="226" x2="55" y2="17" />
          <text x="274" y="249">depth x (m)</text>
          <text transform="translate(17 130) rotate(-90)">area A (m²)</text>
          <text x="55" y="238">0</text>
          <text data-p116-graph-label="optimal-depth" x="274" y="238">${format(best.x)}</text>
          <text data-p116-graph-label="max-depth" x="493" y="238">${format(state.fence / 2)}</text>
          <text x="46" y="222">0</text>
          <text data-p116-graph-label="max-area" x="46" y="29">${format(best.area)}</text>
        </g>
        <path class="p116-parabola" data-p116-parabola d="${graphPath()}" />
        <line class="p116-symmetry-axis" data-p116-symmetry-axis x1="${graph.bestX}" y1="${graph.top}" x2="${graph.bestX}" y2="${graph.bottom}" />
        <circle class="p116-optimum-point" data-p116-optimum-point cx="${graph.bestX}" cy="${graph.bestY}" r="6" />
        <line class="p116-comparison-line" data-p116-comparison-line x1="${graph.currentX}" y1="${graph.currentY}" x2="${graph.mirrorX}" y2="${graph.mirrorY}" />
        <circle class="p116-mirror-point" data-p116-mirror-point cx="${graph.mirrorX}" cy="${graph.mirrorY}" r="6" />
        <circle class="p116-current-point" data-p116-current-point cx="${graph.currentX}" cy="${graph.currentY}" r="8" />
      </svg>`;
  }

  function budgetControls() {
    return `
      <div class="p116-budget-controls" aria-label="Fence budget presets">
        <span>Total fence P</span>
        <div>${BUDGETS.map((budget) => `<button class="chip-button p116-budget-button ${state.fence === budget ? "active" : ""}" type="button" data-problem-action="p116-budget" data-p116-budget="${budget}" aria-pressed="${state.fence === budget}">${budget} m</button>`).join("")}</div>
      </div>`;
  }

  function depthPresets() {
    const fractions = [
      { label: "0", value: 0 },
      { label: "P/8", value: state.fence / 8 },
      { label: "P/4", value: state.fence / 4 },
      { label: "3P/8", value: (3 * state.fence) / 8 },
      { label: "P/2", value: state.fence / 2 },
    ];
    return `<div class="p116-presets" aria-label="Depth presets">${fractions.map((preset) => `<button class="chip-button p116-depth-preset ${Math.abs(state.depth - preset.value) < 0.01 ? "active" : ""}" type="button" data-problem-action="p116-depth" data-p116-depth="${preset.value}" aria-pressed="${Math.abs(state.depth - preset.value) < 0.01}"><span>${preset.label}</span><small>${format(preset.value)} m</small></button>`).join("")}</div>`;
  }

  function depthControl() {
    const progress = (state.depth / (state.fence / 2)) * 100;
    return `
      <section class="p116-depth-control" aria-labelledby="p116-slider-heading">
        <div class="p116-control-heading"><label id="p116-slider-heading">Choose perpendicular depth x</label><strong data-p116-live="depth-control">${format(state.depth)} m</strong></div>
        <div
          class="p116-slider"
          data-p116-slider
          role="slider"
          tabindex="0"
          aria-labelledby="p116-slider-heading"
          aria-valuemin="0"
          aria-valuemax="${state.fence / 2}"
          aria-valuenow="${state.depth}"
          aria-valuetext="Depth ${format(state.depth)} metres"
          aria-describedby="p116-slider-help"
          style="--p116-progress: ${progress}%"
        >
          <div class="p116-slider-track" aria-hidden="true"></div>
          <div class="p116-slider-fill" aria-hidden="true"></div>
          <div class="p116-slider-ticks" aria-hidden="true">${[0, 25, 50, 75, 100].map((position) => `<i style="left:${position}%"></i>`).join("")}</div>
          <div class="p116-slider-thumb" aria-hidden="true"><span>${format(state.depth)}</span></div>
        </div>
        <div class="p116-slider-labels"><span>0 m</span><span data-p116-live="slider-mid">P/4 = ${format(state.fence / 4)} m</span><span data-p116-live="slider-max">P/2 = ${format(state.fence / 2)} m</span></div>
        ${depthPresets()}
        <p id="p116-slider-help" class="p116-control-help">Drag or tap the scale. With it focused, use Arrow keys for 0.5 m, Page Up/Down for 5 m, Home, or End.</p>
      </section>`;
  }

  function fixedFenceAccounting() {
    const values = dimensions();
    return `
      <section class="p116-accounting" aria-label="Fixed fence accounting" aria-live="polite">
        <div><small>Two depths</small><strong><span data-p116-live="two-depths">2 × ${format(values.x)}</span> m</strong></div>
        <span aria-hidden="true">+</span>
        <div><small>One length</small><strong><span data-p116-live="length">${format(values.y)}</span> m</strong></div>
        <span aria-hidden="true">=</span>
        <div><small>Fence used</small><strong><span data-p116-live="fence-used">${format(2 * values.x + values.y)}</span> m</strong></div>
        <div class="p116-area-readout"><small>Area x · y</small><strong><span data-p116-live="area">${format(values.area)}</span> m²</strong></div>
      </section>`;
  }

  function comparisonMarkup() {
    const values = dimensions();
    const mirror = mirrorDepth();
    const best = optimum();
    return `
      <div class="p116-comparison" aria-live="polite">
        <div><small>Your depth</small><strong data-p116-live="compare-depth">${format(values.x)} m</strong></div>
        <div><small>Reflected depth</small><strong data-p116-live="mirror-depth">${format(mirror)} m</strong></div>
        <div><small>Both areas</small><strong><span data-p116-live="compare-area">${format(values.area)}</span> m²</strong></div>
        <p data-p116-live="gap">${Math.abs(values.x - best.x) < 0.01 ? "At the symmetry line: this is the maximum." : `Both depths sit ${format(Math.abs(values.x - best.x))} m from P/4.`}</p>
      </div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p116-hints">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const best = optimum();
    return `
      <section class="solution-card p116-solution" aria-labelledby="p116-solution-heading">
        <h2 id="p116-solution-heading" tabindex="-1">Make the square do the work</h2>
        <p>Only three sides are fenced, so <strong>2x + y = P</strong> and <strong>y = P - 2x</strong>. Hence</p>
        <div class="equation">A = xy = x(P - 2x).</div>
        <p>Completing the square exposes the greatest possible value:</p>
        <div class="equation">A = P²/8 - 2(x - P/4)².</div>
        <p>The square cannot be negative, so area is greatest when it is zero. Thus <strong>x = P/4</strong>, <strong>y = P/2</strong>, and <strong>Amax = P²/8</strong>.</p>
        <div class="p116-answer"><strong>For P = ${format(state.fence)} m</strong><span>x = ${format(best.x)} m, y = ${format(best.y)} m, maximum area = ${format(best.area)} m².</span></div>
        ${state.fence === 100 ? '<p class="p116-default-check">Default check: 2(25) + 50 = 100 and 25 × 50 = 1,250.</p>' : ""}
      </section>`;
  }

  function stateSnapshot() {
    const values = dimensions();
    const best = optimum();
    return JSON.stringify({
      problem: "1.16",
      reconstruction: true,
      fenceBudget: state.fence,
      depthX: values.x,
      lengthY: values.y,
      fenceUsed: 2 * values.x + values.y,
      area: values.area,
      reflectedDepth: mirrorDepth(),
      optimum: best,
      estimate: state.estimate === "" ? null : Number(state.estimate),
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p116-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p116-progress"><span></span></div></div>
          ${problemHeaderActions("1.16", resetMarkup)}
        </header>

        <div class="book-spread p116-spread">
          <article class="book-page p116-problem-page">
            <div class="problem-number">Problem 1.16</div>
            <h1 class="book-title p116-book-title">An easyish fencing problem</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <div class="p116-reconstruction-label">Reconstructed activity</div>
            <p class="problem-copy">You have <strong>P metres of fence</strong> and a straight river beside a field. Make a rectangular enclosure with one side along the river, so the river side needs no fence.</p>
            <p class="p116-question"><strong>Which depth and river-parallel length enclose the greatest area?</strong> Explain why your choice is the maximum, not just a good trial.</p>
            <aside class="p116-source-note" aria-label="Reconstruction note">
              <strong>Source note</strong>
              <p>The available sample stops after Problem 1.10. This independently written three-sided fencing investigation uses only the listed 1.16 title and one-star rating; its wording, values, diagram, and solution are not transcribed from the book.</p>
            </aside>
            <section class="prediction-box p116-prediction">
              <div class="eyebrow">Before calculating</div>
              <p>For the default P = 100 m, should the best rectangle be long and shallow, short and deep, or somewhere between?</p>
            </section>
          </article>

          <section class="book-page book-stage p116-stage">
            ${budgetControls()}
            <div class="p116-visual-tabs" aria-label="Linked enclosure and area graph">
              <div>${enclosureSvg()}<strong>Live enclosure</strong></div>
              <div>${graphSvg()}<strong>Area graph and reflected trial</strong></div>
            </div>
            ${fixedFenceAccounting()}
            ${depthControl()}
            ${comparisonMarkup()}
          </section>

          <aside class="book-page book-coach p116-coach">
            <div class="coach-kicker">Commit your optimum</div>
            <p class="coach-question">With P = <span data-p116-live="coach-budget">${format(state.fence)}</span> m, what depth x gives the largest area?</p>
            <form class="estimate-form p116-estimate-form" data-p116-estimate-form novalidate>
              <label for="p116-estimate">Your best depth x</label>
              <div class="estimate-field"><input id="p116-estimate" class="estimate-input" data-p116-estimate-input inputmode="decimal" type="number" min="0" max="${state.fence / 2}" step="0.5" value="${escapeAttribute(state.estimate)}" placeholder="e.g. ${format(state.fence / 5)}" /><span>m</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row p116-help-row">
              <button class="secondary-button" type="button" data-problem-action="p116-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p116-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Problem 1.16 development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.16")}
      </main>`;
  }

  function setText(root, selector, value) {
    root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  }

  function updateExperimentDom() {
    const root = document.querySelector(".p116-book-shell");
    if (!root) return;
    const values = dimensions();
    const best = optimum();
    const mirror = mirrorDepth();
    const box = enclosureGeometry();
    const graph = graphGeometry();
    const scale = Math.min(390 / state.fence, 165 / (state.fence / 2));

    setText(root, "[data-p116-enclosure-desc]", enclosureDescription());
    setText(root, '[data-p116-svg-live="depth-label"]', `x = ${format(values.x)} m`);
    setText(root, '[data-p116-svg-live="length-label"]', `y = ${format(values.y)} m`);
    setText(root, '[data-p116-svg-live="area"]', `${format(values.area)} m²`);
    setText(root, "[data-p116-graph-desc]", graphDescription());
    setText(root, '[data-p116-live="depth-control"]', `${format(values.x)} m`);
    setText(root, '[data-p116-live="two-depths"]', `2 × ${format(values.x)}`);
    setText(root, '[data-p116-live="length"]', format(values.y));
    setText(root, '[data-p116-live="fence-used"]', format(2 * values.x + values.y));
    setText(root, '[data-p116-live="area"]', format(values.area));
    setText(root, '[data-p116-live="compare-depth"]', `${format(values.x)} m`);
    setText(root, '[data-p116-live="mirror-depth"]', `${format(mirror)} m`);
    setText(root, '[data-p116-live="compare-area"]', format(values.area));
    setText(root, '[data-p116-live="gap"]', Math.abs(values.x - best.x) < 0.01 ? "At the symmetry line: this is the maximum." : `Both depths sit ${format(Math.abs(values.x - best.x))} m from P/4.`);

    const field = root.querySelector("[data-p116-field]");
    field?.setAttribute("x", String(box.left));
    field?.setAttribute("y", String(box.top));
    field?.setAttribute("width", String(values.y * scale));
    field?.setAttribute("height", String(values.x * scale));
    root.querySelector("[data-p116-fence]")?.setAttribute("d", `M${box.left} ${box.top} V${box.bottom} H${box.right} V${box.top}`);
    root.querySelector("[data-p116-depth-dimension]")?.setAttribute("transform", `translate(${box.left - 18} ${box.top})`);
    const depthLine = root.querySelector("[data-p116-depth-dimension] line");
    depthLine?.setAttribute("y2", String(box.bottom - box.top));
    const depthText = root.querySelector("[data-p116-depth-dimension] text");
    depthText?.setAttribute("y", String((box.bottom - box.top) / 2));
    root.querySelector("[data-p116-length-dimension]")?.setAttribute("transform", `translate(${box.left} ${box.bottom + 18})`);
    const lengthLine = root.querySelector("[data-p116-length-dimension] line");
    lengthLine?.setAttribute("x2", String(box.right - box.left));
    const lengthText = root.querySelector("[data-p116-length-dimension] text");
    lengthText?.setAttribute("x", String((box.right - box.left) / 2));
    root.querySelector("[data-p116-area-badge]")?.setAttribute("transform", `translate(260 ${Math.min(245, Math.max(116, box.top + (box.bottom - box.top) / 2))})`);

    const slider = root.querySelector("[data-p116-slider]");
    slider?.style.setProperty("--p116-progress", `${(state.depth / (state.fence / 2)) * 100}%`);
    slider?.setAttribute("aria-valuenow", String(state.depth));
    slider?.setAttribute("aria-valuetext", `Depth ${format(state.depth)} metres`);
    setText(root, ".p116-slider-thumb span", format(state.depth));

    root.querySelectorAll("[data-p116-depth]").forEach((button) => {
      const active = Math.abs(Number(button.dataset.p116Depth) - state.depth) < 0.01;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const currentPoint = root.querySelector("[data-p116-current-point]");
    currentPoint?.setAttribute("cx", String(graph.currentX));
    currentPoint?.setAttribute("cy", String(graph.currentY));
    const mirrorPoint = root.querySelector("[data-p116-mirror-point]");
    mirrorPoint?.setAttribute("cx", String(graph.mirrorX));
    mirrorPoint?.setAttribute("cy", String(graph.mirrorY));
    const comparisonLine = root.querySelector("[data-p116-comparison-line]");
    comparisonLine?.setAttribute("x1", String(graph.currentX));
    comparisonLine?.setAttribute("y1", String(graph.currentY));
    comparisonLine?.setAttribute("x2", String(graph.mirrorX));
    comparisonLine?.setAttribute("y2", String(graph.mirrorY));
  }

  function setDepthFromPointer(event, slider) {
    const bounds = slider.getBoundingClientRect();
    const ratio = bounds.width ? (event.clientX - bounds.left) / bounds.width : 0;
    setDepth(ratio * (state.fence / 2));
    updateExperimentDom();
  }

  function setFence(value) {
    const oldFence = state.fence;
    const nextFence = Number(value);
    if (!BUDGETS.includes(nextFence)) return;
    state.fence = nextFence;
    setDepth((state.depth / oldFence) * nextFence);
    state.estimate = "";
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "";
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p116-book-shell");
    if (!root) return;

    root.querySelectorAll('[data-problem-action^="p116-"]').forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p116-reset") state = initialState();
        if (action === "p116-budget") setFence(control.dataset.p116Budget);
        if (action === "p116-depth") setDepth(control.dataset.p116Depth);
        if (action === "p116-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p116-reveal") {
          state.revealed = true;
          setDepth(optimum().x);
        }
        renderApp();
        if (action === "p116-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p116-solution-heading")?.focus());
        }
      });
    });

    const estimateForm = root.querySelector("[data-p116-estimate-form]");
    const estimateInput = root.querySelector("[data-p116-estimate-input]");
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
      const best = optimum();
      state.estimate = raw;
      state.feedbackTone = "";
      if (!raw || !Number.isFinite(estimate) || estimate < 0 || estimate > state.fence / 2) {
        state.committed = false;
        state.feedback = `Enter a depth from 0 to ${format(state.fence / 2)} metres first.`;
      } else {
        state.committed = true;
        setDepth(estimate);
        if (Math.abs(estimate - best.x) <= 0.5) {
          state.feedbackTone = "success";
          state.feedback = `Yes - the exact best depth is P/4 = ${format(best.x)} m, giving ${format(best.area)} m².`;
        } else if (estimate < best.x) {
          state.feedback = "That trial is too shallow. Move toward P/4 and watch the area rise.";
        } else {
          state.feedback = "That trial is too deep. The two depth fences leave too little river-parallel length; move back toward P/4.";
        }
      }
      renderApp();
    });

    const slider = root.querySelector("[data-p116-slider]");
    if (!slider) return;
    slider.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activeSliderPointer = event.pointerId;
      slider.setPointerCapture(event.pointerId);
      setDepthFromPointer(event, slider);
    });
    slider.addEventListener("pointermove", (event) => {
      if (activeSliderPointer === event.pointerId && slider.hasPointerCapture(event.pointerId)) setDepthFromPointer(event, slider);
    });
    slider.addEventListener("pointerup", (event) => {
      if (activeSliderPointer !== event.pointerId) return;
      setDepthFromPointer(event, slider);
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      activeSliderPointer = null;
      slider.focus();
    });
    slider.addEventListener("pointercancel", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      activeSliderPointer = null;
      slider.focus();
    });
    slider.addEventListener("keydown", (event) => {
      let next = state.depth;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next += STEP;
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next -= STEP;
      else if (event.key === "PageUp") next += 5;
      else if (event.key === "PageDown") next -= 5;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = state.fence / 2;
      else return;
      event.preventDefault();
      setDepth(next);
      updateExperimentDom();
    });
  }

  window.poveyProblemPages["1.16"] = { render, bind };
}());
