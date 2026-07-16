/*
 * THROWAWAY PROTOTYPE - do not promote directly to production.
 *
 * Question: Which presentation model best turns a Povey problem into active reading?
 * Three variants are available on this single route via ?variant=A|B|C.
 */

const variantMeta = {
  A: { name: "Interactive book", short: "Editorial spread" },
  B: { name: "Visual laboratory", short: "Experiment first" },
  C: { name: "Guided tutor", short: "Conversation first" },
};

const chapterCatalog = {
  "1": {
    number: "1",
    title: "Geometry",
    problems: Array.from({ length: 17 }, (_, index) => `1.${index + 1}`),
  },
  "2": {
    number: "2",
    title: "Mathematics",
    problems: Array.from({ length: 12 }, (_, index) => `2.${index + 1}`),
  },
  "3": {
    number: "3",
    title: "Statics",
    problems: Array.from({ length: 9 }, (_, index) => `3.${index + 1}`),
  },
  "4": {
    number: "4",
    title: "Dynamics and collisions",
    problems: Array.from({ length: 7 }, (_, index) => `4.${index + 1}`),
  },
};

const chapterProblems = Object.values(chapterCatalog).flatMap((chapter) => chapter.problems);

const hints = [
  "A route across the surface becomes easier to compare if two neighbouring faces are laid flat.",
  "In the unfolded view, try making the two red segments behave like one straight line.",
  "The flat shape is a 2 × 1 rectangle. Its diagonal can be found with Pythagoras.",
];

const cableHints = [
  "Call the Earth's radius R. Write the old and raised circumferences using the same R.",
  "Subtract the two circumference expressions before putting in any value for the Earth's radius.",
  "The two terms containing R cancel. Only the 10 metre increase in radius remains.",
];

const hoopHints = [
  "Track the centre of the hoop. Its angular orientation does not matter.",
  "It is easier to find where the hoop stays inside one tile, then subtract that probability from 1.",
  "The safe landing region for the centre is a square of side L - d inside a tile of side L.",
];

const initialState = () => ({
  crossing: 0.22,
  bestLength: routeLength(0.22),
  attempts: 0,
  hintsUsed: 0,
  committed: false,
  revealed: false,
  view: "unfold",
  feedback: "",
});

let state = initialState();
let activeRouteDrag = false;
let activePoleDrag = false;

const initialCableState = () => ({
  poleHeight: 10,
  worldRadius: 6371,
  estimate: "",
  hintsUsed: 0,
  committed: false,
  revealed: false,
  feedback: "",
});

let cableState = initialCableState();

const initialHoopState = () => ({
  diameterRatio: 0.5,
  centreX: 0.5,
  centreY: 0.5,
  estimate: "",
  hintsUsed: 0,
  committed: false,
  revealed: false,
  feedback: "",
  trials: 0,
  crossings: 0,
  points: [],
});

let hoopState = initialHoopState();
let activeHoopSizeDrag = false;
let activeHoopPositionDrag = false;

function routeLength(t) {
  return Math.hypot(1, t) + Math.hypot(1, 1 - t);
}

function currentVariant() {
  const candidate = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
  return variantMeta[candidate] ? candidate : "A";
}

function currentProblem() {
  const problem = new URLSearchParams(window.location.search).get("problem");
  return chapterProblems.includes(problem) ? problem : "1.1";
}

function chapterForProblem(problem) {
  return Object.values(chapterCatalog).find((chapter) => chapter.problems.includes(problem)) || chapterCatalog["1"];
}

function shouldRenderChapterIndex() {
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "index" || params.get("view") === "chapter" || params.size === 0;
}

function requestedChapterIndex() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") !== "chapter") return null;
  const chapter = params.get("chapter");
  return chapterCatalog[chapter] ? chapter : null;
}

function fmt(value, digits = 3) {
  return Number(value).toFixed(digits);
}

function stateSnapshot(variant) {
  return JSON.stringify(
    {
      variant,
      seamCrossing: fmt(state.crossing, 2),
      routeLength: fmt(routeLength(state.crossing)),
      bestSeen: fmt(state.bestLength),
      attempts: state.attempts,
      hintsUsed: state.hintsUsed,
      committed: state.committed,
      solutionRevealed: state.revealed,
    },
    null,
    2,
  );
}

function cableStateSnapshot() {
  return JSON.stringify(
    {
      problem: "1.2",
      poleHeightMetres: cableState.poleHeight,
      worldRadiusKm: cableState.worldRadius,
      estimateMetres: cableState.estimate || null,
      hintsUsed: cableState.hintsUsed,
      committed: cableState.committed,
      solutionRevealed: cableState.revealed,
      calculatedExtraMetres: cableState.revealed ? Number((2 * Math.PI * cableState.poleHeight).toFixed(3)) : null,
    },
    null,
    2,
  );
}

function hoopProbability(ratio = hoopState.diameterRatio) {
  return ratio >= 1 ? 1 : 1 - (1 - ratio) ** 2;
}

function hoopCrossesBoundary(x = hoopState.centreX, y = hoopState.centreY, ratio = hoopState.diameterRatio) {
  if (ratio >= 1) return true;
  const radius = ratio / 2;
  return x <= radius || x >= 1 - radius || y <= radius || y >= 1 - radius;
}

function hoopStateSnapshot() {
  return JSON.stringify(
    {
      problem: "1.3",
      diameterOverTileSide: Number(hoopState.diameterRatio.toFixed(3)),
      centre: [Number(hoopState.centreX.toFixed(3)), Number(hoopState.centreY.toFixed(3))],
      currentHoopCrossesBoundary: hoopCrossesBoundary(),
      estimatePercent: hoopState.estimate || null,
      simulatedThrows: hoopState.trials,
      simulatedCrossingPercent: hoopState.trials ? Number(((hoopState.crossings / hoopState.trials) * 100).toFixed(1)) : null,
      exactCrossingPercent: hoopState.revealed ? Number((hoopProbability() * 100).toFixed(1)) : null,
      hintsUsed: hoopState.hintsUsed,
      solutionRevealed: hoopState.revealed,
    },
    null,
    2,
  );
}

function debugEnabled() {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function debugPanel(label, snapshot) {
  if (!debugEnabled()) return "";
  return `<section class="debug-panel"><p class="eyebrow">${label}</p><pre class="state-surface">${snapshot}</pre></section>`;
}

function warning() {
  return '<div class="prototype-warning">Unofficial educational prototype · adapted and independently reconstructed activities</div>';
}

function slider() {
  return `
    <div class="slider-wrap">
      <label for="crossing-slider">
        <span>Crossing point</span>
        <span data-live="crossingPercent">${Math.round(state.crossing * 100)}%</span>
      </label>
      <input
        class="crossing-slider"
        id="crossing-slider"
        type="range"
        min="0"
        max="1"
        step="0.005"
        value="${state.crossing}"
        aria-label="Position where the route crosses the shared edge"
      />
      <div class="slider-labels"><span>top</span><span>midpoint</span><span>bottom</span></div>
    </div>`;
}

function hintStack() {
  if (!state.hintsUsed) return "";
  return `<div class="hint-stack">${hints
    .slice(0, state.hintsUsed)
    .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
    .join("")}</div>`;
}

function feedback() {
  if (!state.feedback) return "";
  const success = Math.abs(state.crossing - 0.5) < 0.04;
  return `<div class="feedback ${success ? "success" : ""}" role="status">${state.feedback}</div>`;
}

function solutionCard(className = "solution-card") {
  if (!state.revealed) return "";
  return `
    <section class="${className}" aria-label="Worked solution">
      <strong>The surfaces tell the story</strong>
      <p>Unfold either pair of connecting faces. The shortest surface route becomes the diagonal of a 2 by 1 rectangle.</p>
      <div class="equation">d = √(2² + 1²) = √5 ≈ 2.236</div>
      <p>Cube symmetry gives six routes of this same minimum length.</p>
    </section>`;
}

function routeSvg(extraClass = "") {
  const y = 50 + state.crossing * 240;
  const direct = state.revealed ? "revealed" : "";
  return `
    <svg
      class="route-svg ${direct} ${extraClass}"
      data-route-svg
      viewBox="0 0 640 350"
      role="img"
      aria-labelledby="route-title route-desc"
    >
      <title id="route-title">Two unfolded faces of a cube</title>
      <desc id="route-desc">A red route runs from A to B through a draggable point on the shared edge.</desc>
      <rect class="face" x="80" y="50" width="240" height="240" rx="4" />
      <rect class="face" x="320" y="50" width="240" height="240" rx="4" />
      <line class="seam" x1="320" y1="50" x2="320" y2="290" />
      <text class="svg-note" x="188" y="326">face one</text>
      <text class="svg-note" x="428" y="326">face two</text>
      <line class="straight-guide" x1="80" y1="50" x2="560" y2="290" />
      <polyline class="candidate" data-route-line points="80,50 320,${y} 560,290" />
      <circle class="point" cx="80" cy="50" r="7" />
      <circle class="point" cx="560" cy="290" r="7" />
      <circle
        class="route-handle"
        data-drag-handle
        cx="320"
        cy="${y}"
        r="14"
        tabindex="0"
        role="slider"
        aria-label="Route crossing point"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${Math.round(state.crossing * 100)}"
      />
      <text class="svg-label" x="58" y="38">A</text>
      <text class="svg-label" x="574" y="313">B</text>
      <text class="svg-note" data-drag-note x="336" y="${Math.max(37, Math.min(322, y - 18))}">drag me</text>
    </svg>`;
}

function cubeSvg() {
  return `
    <svg class="route-svg" viewBox="0 0 640 350" role="img" aria-label="Cube with a surface route from A to B">
      <polygon class="face" points="180,90 320,24 460,94 320,165" />
      <polygon class="face" points="180,90 320,165 320,310 180,235" />
      <polygon class="face" points="320,165 460,94 460,238 320,310" />
      <polyline class="candidate" points="180,90 320,165 460,238" />
      <circle class="point" cx="180" cy="90" r="7" />
      <circle class="point" cx="460" cy="238" r="7" />
      <text class="svg-label" x="150" y="78">A</text>
      <text class="svg-label" x="477" y="255">B</text>
      <text class="svg-note" x="225" y="336">The bend only appears because the faces meet in 3D.</text>
    </svg>`;
}

function controls() {
  return `
    <div class="button-row">
      <button class="primary-button" data-action="commit">Commit route</button>
      <button class="secondary-button" data-action="hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>
        ${state.hintsUsed ? "Another hint" : "Give me a hint"}
      </button>
      <button class="ghost-button" data-action="reveal">Reveal</button>
    </div>`;
}

function problemHref(problem) {
  return problem === "1.1" ? "?variant=A" : `?variant=A&problem=${problem}`;
}

function problemHeaderActions(current, resetControl) {
  const chapter = chapterForProblem(current);
  const index = chapter.problems.indexOf(current);
  const next = chapter.problems[index + 1];
  const contentsHref = `?view=chapter&amp;chapter=${chapter.number}`;
  const nextLink = next
    ? `<a class="problem-nav-link header-next" href="${problemHref(next).replaceAll("&", "&amp;")}">Next · ${next} →</a>`
    : "";
  return `<div class="book-actions button-row"><a class="problem-nav-link header-contents" href="${contentsHref}" aria-label="Chapter ${chapter.number} contents">Contents</a>${nextLink}${resetControl}</div>`;
}

function problemProgress(current) {
  const chapter = chapterForProblem(current);
  const index = chapter.problems.indexOf(current);
  const progress = ((index + 1) / chapter.problems.length) * 100;
  return `Chapter ${chapter.number} · ${chapter.title}<div class="book-progress-bar"><span style="width: ${progress.toFixed(3)}%"></span></div>`;
}

function problemNav(current) {
  const chapter = chapterForProblem(current);
  const index = chapter.problems.indexOf(current);
  const toLink = (problem, direction) => problem
    ? {
        label: direction === "previous" ? `← ${problem}` : `${problem} →`,
        href: problemHref(problem),
      }
    : null;
  const previous = toLink(chapter.problems[index - 1], "previous");
  const next = toLink(chapter.problems[index + 1], "next");
  const position = index + 1;
  return `
    <nav class="problem-nav" aria-label="Problem navigation">
      ${previous ? `<a class="problem-nav-link" href="${previous.href.replaceAll("&", "&amp;")}">${previous.label}</a>` : '<span class="problem-nav-spacer"></span>'}
      <span class="problem-nav-position">${position} of ${chapter.problems.length} · ${chapter.title}</span>
      ${next ? `<a class="problem-nav-link" href="${next.href.replaceAll("&", "&amp;")}">${next.label}</a>` : '<span class="problem-nav-spacer"></span>'}
    </nav>`;
}

function cablePoleLines(radius, outerRadius, count = 16) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const x1 = 320 + Math.cos(angle) * radius;
    const y1 = 174 + Math.sin(angle) * radius;
    const x2 = 320 + Math.cos(angle) * outerRadius;
    const y2 = 174 + Math.sin(angle) * outerRadius;
    return `<line class="cable-pole" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join("");
}

function cableSvg() {
  const earthRadius = 112;
  const visualGap = 13 + (cableState.poleHeight / 100) * 29;
  const cableRadius = earthRadius + visualGap;
  return `
    <svg class="route-svg cable-svg" viewBox="0 0 640 370" role="img" aria-labelledby="cable-title cable-desc">
      <title id="cable-title">A cable raised above a spherical Earth</title>
      <desc id="cable-desc">Telephone poles of equal height support a circular red cable around the Earth. The gap is exaggerated so it can be seen.</desc>
      <defs>
        <radialGradient id="earth-fill" cx="36%" cy="28%" r="74%">
          <stop offset="0%" stop-color="#d7efe5" />
          <stop offset="68%" stop-color="#81c9ae" />
          <stop offset="100%" stop-color="#3c9276" />
        </radialGradient>
      </defs>
      <circle class="cable-orbit" data-cable-orbit cx="320" cy="174" r="${cableRadius}" />
      <g data-pole-lines>${cablePoleLines(earthRadius, cableRadius)}</g>
      <circle class="earth-disc" cx="320" cy="174" r="${earthRadius}" />
      <ellipse class="earth-grid" cx="320" cy="174" rx="${earthRadius}" ry="39" />
      <ellipse class="earth-grid" cx="320" cy="174" rx="45" ry="${earthRadius}" />
      <path class="earth-land" d="M250 113c15-21 45-29 66-18l9 17-19 12-8 21-22 5-19-13zm94 65 26-19 33 10 13 25-21 17-8 37-27 13-11-28-20-22zM263 204l27 7 10 36-20 19-20-12-10-31z" />
      <text class="svg-label" x="320" y="179" text-anchor="middle">Earth</text>
      <text class="svg-note" x="320" y="337" text-anchor="middle">Radial gap exaggerated so that ${cableState.poleHeight} m can be seen</text>
      <g class="cable-measure">
        <line x1="320" y1="62" x2="320" y2="${174 - cableRadius}" />
        <text class="svg-note" x="332" y="49">${cableState.poleHeight} m poles</text>
      </g>
    </svg>`;
}

function cableHintStack() {
  if (!cableState.hintsUsed) return "";
  return `<div class="hint-stack">${cableHints
    .slice(0, cableState.hintsUsed)
    .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
    .join("")}</div>`;
}

function cableFeedback() {
  if (!cableState.feedback) return "";
  const correct = Math.abs(Number(cableState.estimate) - 2 * Math.PI * cableState.poleHeight) <= 5;
  return `<div class="feedback ${correct ? "success" : ""}" role="status">${cableState.feedback}</div>`;
}

function cableSolution() {
  if (!cableState.revealed) return "";
  const added = 2 * Math.PI * cableState.poleHeight;
  return `
    <section class="solution-card cable-solution" aria-label="Worked solution">
      <strong>The planet disappears</strong>
      <div class="equation">C = 2πR</div>
      <div class="equation">C′ = 2π(R + ${cableState.poleHeight})</div>
      <div class="equation">C′ − C = ${2 * cableState.poleHeight}π ≈ ${fmt(added, 1)} m</div>
      <p>The value of R cancels. The extra cable depends only on the height of the poles, not on the size of the Earth.</p>
    </section>`;
}

function renderCableBook() {
  const added = 2 * Math.PI * cableState.poleHeight;
  return `
    <main class="book-shell cable-book-shell">
      ${warning()}
      <header class="book-header">
        <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
        <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar cable-progress"><span></span></div></div>
        ${problemHeaderActions("1.2", '<button class="ghost-button" data-action="cable-reset">Reset</button>')}
      </header>
      <div class="book-spread cable-spread">
        <article class="book-page">
          <div class="problem-number">Problem 1.2</div>
          <h1 class="book-title cable-book-title">Intercontinental telephone cable</h1>
          <div class="difficulty" aria-label="One star difficulty">★</div>
          <p class="problem-copy">A telephone company has run a cable all the way around the middle of the Earth. Assuming the Earth is a sphere, estimate mentally how much additional cable is needed to raise it to the top of 10 metre telephone poles.</p>
          <section class="prediction-box">
            <div class="eyebrow">First instinct</div>
            <p>Do you expect the answer to be measured in metres, kilometres, or thousands of kilometres?</p>
            <div class="scale-choices" aria-hidden="true"><span>metres</span><span>kilometres</span><span>vast</span></div>
          </section>
        </article>
        <section class="book-page book-stage cable-stage">
          ${cableSvg()}
          <div class="book-stage-caption cable-caption">
            <p>The drawing magnifies the gap. In reality, <span data-cable-live="heightWords">${cableState.poleHeight} metre</span> poles are invisible beside a planet whose radius is thousands of kilometres.</p>
            <div><div class="eyebrow">World radius</div><div class="metric-number cable-radius"><span data-cable-live="radiusNumber">${cableState.worldRadius.toLocaleString()}</span> <small>km</small></div></div>
          </div>
          <div class="slider-wrap">
            <label id="pole-height-label"><span>Pole height</span><span data-cable-live="height">${cableState.poleHeight} m</span></label>
            <div
              class="drag-slider"
              data-pole-slider
              role="slider"
              tabindex="0"
              aria-labelledby="pole-height-label"
              aria-valuemin="1"
              aria-valuemax="100"
              aria-valuenow="${cableState.poleHeight}"
              aria-valuetext="${cableState.poleHeight} metres"
              style="--slider-progress:${((cableState.poleHeight - 1) / 99) * 100}%"
            >
              <span class="drag-slider-track"></span>
              <span class="drag-slider-fill"></span>
              <span class="drag-slider-handle"></span>
            </div>
            <div class="slider-labels"><span>1 m</span><span>50 m</span><span>100 m</span></div>
            <div class="pole-presets" aria-label="Pole height presets">
              ${[1, 10, 25, 100].map((height) => `<button class="chip-button ${cableState.poleHeight === height ? "active" : ""}" data-action="pole-height" data-height="${height}">${height} m</button>`).join("")}
            </div>
          </div>
          ${cableState.revealed ? `
            <div class="generalise-panel">
              <div><div class="eyebrow">Now change the world</div><p>Does the required extra cable change?</p></div>
              <div class="world-selector">
                <div class="world-selector-label"><span>World radius</span><strong data-cable-live="radiusLabel">${cableState.worldRadius.toLocaleString()} km</strong></div>
                <div class="world-options">
                  <button class="chip-button ${cableState.worldRadius === 1000 ? "active" : ""}" data-action="world-radius" data-radius="1000">Small</button>
                  <button class="chip-button ${cableState.worldRadius === 6371 ? "active" : ""}" data-action="world-radius" data-radius="6371">Earth</button>
                  <button class="chip-button ${cableState.worldRadius === 70000 ? "active" : ""}" data-action="world-radius" data-radius="70000">Giant</button>
                </div>
              </div>
              <div class="constant-readout"><small>Extra cable remains</small><strong data-cable-live="added">${fmt(added, 1)} m</strong></div>
            </div>` : ""}
        </section>
        <aside class="book-page book-coach cable-coach">
          <div class="coach-kicker">Mental estimate</div>
          <p class="coach-question">The Earth feels enormous. Is its size actually relevant?</p>
          <form class="estimate-form" data-cable-form>
            <label for="cable-estimate">Your estimate</label>
            <div class="estimate-field"><input id="cable-estimate" class="estimate-input" inputmode="decimal" type="number" min="0" step="0.1" value="${cableState.estimate}" placeholder="e.g. 500" /><span>metres</span></div>
            <button class="primary-button" type="submit">Commit estimate</button>
          </form>
          <div class="button-row cable-help-row">
            <button class="secondary-button" type="button" data-action="cable-hint" ${cableState.hintsUsed >= cableHints.length ? "disabled" : ""}>${cableState.hintsUsed ? "Another hint" : "Give me a hint"}</button>
            <button class="ghost-button" type="button" data-action="cable-reveal">Reveal</button>
          </div>
          ${cableFeedback()}
          ${cableHintStack()}
          ${cableSolution()}
          ${cableState.revealed ? '<div class="history-note"><div class="eyebrow">Historical thread</div><p>The source follows this puzzle with the story of nineteenth-century submarine telegraph cables and the eventual transatlantic connection.</p></div>' : ""}
          ${debugPanel("Development state", cableStateSnapshot())}
        </aside>
      </div>
      ${problemNav("1.2")}
    </main>`;
}

function chessboardCells() {
  const cells = [];
  const tile = 80;
  const originX = 80;
  const originY = 26;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      cells.push(`<rect class="board-cell ${(row + column) % 2 ? "dark" : "light"}" x="${originX + column * tile}" y="${originY + row * tile}" width="${tile}" height="${tile}" />`);
    }
  }
  return cells.join("");
}

function hoopTrialDots() {
  const tileX = 240;
  const tileY = 106;
  const tile = 80;
  return hoopState.points
    .map((point) => `<circle class="trial-dot ${point.crosses ? "crosses" : "safe"}" cx="${tileX + point.x * tile}" cy="${tileY + point.y * tile}" r="2.2" />`)
    .join("");
}

function hoopSvg() {
  const tileX = 240;
  const tileY = 106;
  const tile = 80;
  const ratio = hoopState.diameterRatio;
  const radius = (ratio * tile) / 2;
  const centreX = tileX + hoopState.centreX * tile;
  const centreY = tileY + hoopState.centreY * tile;
  const safeSize = ratio < 1 ? tile * (1 - ratio) : 0;
  const safeOffset = radius;
  const crosses = hoopCrossesBoundary();
  return `
    <svg class="route-svg hoop-svg" data-hoop-svg viewBox="0 0 640 380" role="img" aria-labelledby="hoop-title hoop-desc">
      <title id="hoop-title">A movable hoop on a chessboard</title>
      <desc id="hoop-desc">The hoop's centre can be dragged within one representative tile of the infinite repeating chessboard. The hoop may extend beyond the tile, and its colour indicates whether it crosses a boundary.</desc>
      <g class="chessboard">${chessboardCells()}</g>
      <rect class="focus-tile" x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" />
      ${hoopState.revealed ? `<rect class="safe-locus" data-safe-locus x="${tileX + safeOffset}" y="${tileY + safeOffset}" width="${safeSize}" height="${safeSize}" />` : ""}
      <g class="trial-points" data-trial-points>${hoopTrialDots()}</g>
      <circle class="hoop-ring ${crosses ? "crosses" : "safe"}" data-hoop-ring cx="${centreX}" cy="${centreY}" r="${radius}" />
      <circle class="hoop-centre" data-hoop-centre cx="${centreX}" cy="${centreY}" r="4.5" />
      <line class="diameter-line" data-diameter-line x1="${centreX - radius}" y1="${centreY}" x2="${centreX + radius}" y2="${centreY}" />
      <text class="diameter-label" data-diameter-label x="${centreX}" y="${centreY - 8}" text-anchor="middle">d</text>
      <rect class="hoop-drag-zone" data-hoop-drag-zone x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" />
      <g class="tile-measure">
        <line x1="${tileX}" y1="${tileY + tile + 18}" x2="${tileX + tile}" y2="${tileY + tile + 18}" />
        <text x="${tileX + tile / 2}" y="${tileY + tile + 36}" text-anchor="middle">tile side L</text>
      </g>
      <g class="hoop-status ${crosses ? "crosses" : "safe"}">
        <circle cx="320" cy="354" r="6" />
        <text data-hoop-status x="334" y="359">${crosses ? "crosses a colour boundary" : "stays inside one colour"}</text>
      </g>
    </svg>`;
}

function hoopHintStack() {
  if (!hoopState.hintsUsed) return "";
  return `<div class="hint-stack">${hoopHints
    .slice(0, hoopState.hintsUsed)
    .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
    .join("")}</div>`;
}

function hoopFeedback() {
  if (!hoopState.feedback) return "";
  const correct = Math.abs(Number(hoopState.estimate) - hoopProbability() * 100) <= 5;
  return `<div class="feedback ${correct ? "success" : ""}" role="status">${hoopState.feedback}</div>`;
}

function hoopSolution() {
  if (!hoopState.revealed) return "";
  const ratio = hoopState.diameterRatio;
  const probability = hoopProbability(ratio);
  const safe = ratio < 1 ? (1 - ratio) ** 2 : 0;
  return `
    <section class="solution-card hoop-solution" aria-label="Worked solution">
      <strong>Measure possible centre positions</strong>
      ${ratio < 1 ? `
        <div class="equation">P(one colour) = (L - d)² / L²</div>
        <div class="equation">= (1 - ${fmt(ratio, 2)})² = ${fmt(safe, 3)}</div>
        <div class="equation">P(two colours) = 1 - ${fmt(safe, 3)} = ${fmt(probability, 3)}</div>` : `
        <div class="equation">d ≥ L ⇒ P(two colours) = 1</div>`}
      <p>The landing position is represented by the hoop's centre. The green square is the complete safe region; everywhere outside it crosses at least one boundary.</p>
      <p class="source-erratum"><strong>Source correction:</strong> the supplied PDF swaps P(A) and P(Ā) in its sentence for d = L. The limiting argument and final formula give P(two colours) = 1.</p>
    </section>`;
}

function hoopTrialSummary() {
  if (!hoopState.trials) return "";
  const simulated = (hoopState.crossings / hoopState.trials) * 100;
  return `
    <div class="trial-summary" role="status">
      <div><small>Simulated</small><strong>${fmt(simulated, 1)}%</strong></div>
      <div><small>Exact ${hoopState.revealed ? "" : "after reveal"}</small><strong>${hoopState.revealed ? `${fmt(hoopProbability() * 100, 1)}%` : "?"}</strong></div>
    </div>`;
}

function renderHoopBook() {
  const ratio = hoopState.diameterRatio;
  const probability = hoopProbability(ratio);
  const status = hoopCrossesBoundary();
  return `
    <main class="book-shell hoop-book-shell">
      ${warning()}
      <header class="book-header">
        <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
        <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar hoop-progress"><span></span></div></div>
        ${problemHeaderActions("1.3", '<button class="ghost-button" data-action="hoop-reset">Reset</button>')}
      </header>
      <div class="book-spread hoop-spread">
        <article class="book-page">
          <div class="problem-number">Problem 1.3</div>
          <h1 class="book-title hoop-book-title">Chessboard and hoop</h1>
          <div class="difficulty" aria-label="Two star difficulty">★★</div>
          <p class="problem-copy">A thin hoop of diameter <em>d</em> is thrown onto an infinitely large chessboard whose squares have side <em>L</em>. What is the probability that the hoop encloses two colours?</p>
          <section class="prediction-box">
            <div class="eyebrow">Start with d = L/2</div>
            <p>Before calculating, would you expect fewer or more than half of all landings to cross a colour boundary?</p>
            <div class="scale-choices probability-scale" aria-hidden="true"><span>unlikely</span><span>half</span><span>likely</span></div>
          </section>
        </article>
        <section class="book-page book-stage hoop-stage">
          ${hoopSvg()}
          <div class="book-stage-caption hoop-caption">
            <div class="hoop-caption-copy">
              <p>Drag the centre around the highlighted tile. Red means the hoop crosses a boundary; green means it stays within one colour.</p>
              <p class="representative-note"><strong>Why the centre stays inside:</strong> the chessboard repeats forever, so every possible landing has one equivalent centre position in this representative square. The hoop itself may extend beyond it.</p>
            </div>
            <div><div class="eyebrow">Current landing</div><div class="landing-status ${status ? "crosses" : "safe"}" data-landing-status>${status ? "two colours" : "one colour"}</div></div>
          </div>
          <div class="slider-wrap">
            <label id="hoop-size-label"><span>Diameter ratio d/L</span><span data-hoop-live="ratio">${fmt(ratio, 2)}</span></label>
            <div
              class="drag-slider"
              data-hoop-size-slider
              role="slider"
              tabindex="0"
              aria-labelledby="hoop-size-label"
              aria-valuemin="0.05"
              aria-valuemax="1.25"
              aria-valuenow="${fmt(ratio, 2)}"
              aria-valuetext="diameter ${fmt(ratio, 2)} times the tile side"
              style="--slider-progress:${((ratio - 0.05) / 1.2) * 100}%"
            >
              <span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span>
            </div>
            <div class="slider-labels"><span>0.05</span><span>d = L</span><span>1.25</span></div>
            <div class="hoop-presets" aria-label="Hoop diameter presets">
              ${[0.25, 0.5, 0.75, 1].map((value) => `<button class="chip-button ${Math.abs(ratio - value) < 0.001 ? "active" : ""}" data-action="hoop-size" data-ratio="${value}">${value === 1 ? "d = L" : `${value}L`}</button>`).join("")}
            </div>
          </div>
          <div class="simulation-row">
            <button class="secondary-button" data-action="hoop-simulate">Throw 200 hoops</button>
            ${hoopTrialSummary()}
          </div>
          ${hoopState.revealed ? `<div class="exact-readout"><small>Exact probability at d/L = ${fmt(ratio, 2)}</small><strong data-hoop-live="probability">${fmt(probability * 100, 1)}%</strong></div>` : ""}
        </section>
        <aside class="book-page book-coach hoop-coach">
          <div class="coach-kicker">Make a prediction</div>
          <p class="coach-question">What fraction of possible centre positions cross a boundary?</p>
          <form class="estimate-form" data-hoop-form>
            <label for="hoop-estimate">Your estimate for this diameter</label>
            <div class="estimate-field"><input id="hoop-estimate" class="estimate-input hoop-estimate-input" inputmode="decimal" type="number" min="0" max="100" step="0.1" value="${hoopState.estimate}" placeholder="e.g. 50" /><span>%</span></div>
            <button class="primary-button" type="submit">Commit estimate</button>
          </form>
          <div class="button-row">
            <button class="secondary-button" data-action="hoop-hint" ${hoopState.hintsUsed >= hoopHints.length ? "disabled" : ""}>${hoopState.hintsUsed ? "Another hint" : "Give me a hint"}</button>
            <button class="ghost-button" data-action="hoop-reveal">Reveal</button>
          </div>
          ${hoopFeedback()}
          ${hoopHintStack()}
          ${hoopSolution()}
          ${debugPanel("Development state", hoopStateSnapshot())}
        </aside>
      </div>
      ${problemNav("1.3")}
    </main>`;
}

function renderBook() {
  const length = routeLength(state.crossing);
  return `
    <main class="book-shell">
      ${warning()}
      <header class="book-header">
        <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Prototype</span></div>
        <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar"><span></span></div></div>
        ${problemHeaderActions("1.1", '<button class="ghost-button" data-action="reset">Reset</button>')}
      </header>
      <div class="book-spread">
        <article class="book-page">
          <div class="problem-number">Problem 1.1</div>
          <h1 class="book-title">Shortest walk</h1>
          <div class="difficulty" aria-label="One star difficulty">★</div>
          <p class="problem-copy">An ant starts at one vertex of a solid cube whose side length is one. What is the shortest route across the surface to the furthest vertex?</p>
          <section class="prediction-box">
            <div class="eyebrow">Before calculating</div>
            <p>Would you expect the route to cross the shared edge near an end, or near its midpoint?</p>
            <div class="button-row">
              <button class="chip-button" data-action="preset" data-value="0.08">Near an end</button>
              <button class="chip-button" data-action="preset" data-value="0.50">Near the middle</button>
            </div>
          </section>
        </article>
        <section class="book-page book-stage">
          <div class="view-tabs">
            <button class="chip-button ${state.view === "cube" ? "active" : ""}" data-action="set-view" data-view="cube">Cube</button>
            <button class="chip-button ${state.view === "unfold" ? "active" : ""}" data-action="set-view" data-view="unfold">Unfolded</button>
          </div>
          ${state.view === "cube" ? cubeSvg() : routeSvg()}
          <div class="book-stage-caption">
            <p>${state.view === "cube" ? "A route that bends on the drawing can become straight when the two faces are unfolded." : "Drag the red joint along the shared edge. The two red segments are the ant’s route across adjacent faces."}</p>
          <div><div class="eyebrow">Current length</div><div class="metric-number"><span data-live="routeLength">${fmt(length)}</span> <small>units</small></div></div>
          </div>
          ${state.view === "unfold" ? slider() : ""}
        </section>
        <aside class="book-page book-coach">
          <div class="coach-kicker">Tutor margin</div>
          <p class="coach-question">Can you make the route behave like a single straight line?</p>
          <div class="book-metrics">
            <div class="book-metric"><small>Best seen</small><strong data-live="bestLength">${fmt(state.bestLength)}</strong></div>
            <div class="book-metric"><small>The target</small><strong>?</strong></div>
          </div>
          ${controls()}
          ${feedback()}
          ${hintStack()}
          ${solutionCard()}
          ${debugPanel("Development state", stateSnapshot("A"))}
        </aside>
      </div>
      ${problemNav("1.1")}
    </main>`;
}

function renderLab() {
  const length = routeLength(state.crossing);
  const seg1 = Math.hypot(1, state.crossing);
  const seg2 = Math.hypot(1, 1 - state.crossing);
  return `
    <main class="lab-shell">
      ${warning()}
      <header class="lab-header">
        <div class="lab-title"><span class="chapter-index">1.1</span><div><h1>Shortest walk</h1><p>Surface geometry experiment · one-star challenge</p></div></div>
        <div class="button-row"><button class="ghost-button" data-action="reset">Reset experiment</button></div>
      </header>
      <div class="lab-grid">
        <nav class="chapter-rail" aria-label="Prototype chapter rail">
          <button class="active" aria-label="Problem 1.1">1</button><button aria-label="Unavailable problem 1.2">2</button><button aria-label="Unavailable problem 1.3">3</button><button aria-label="Unavailable problem 1.4">4</button>
        </nav>
        <section class="lab-canvas">
          ${routeSvg()}
          <div class="lab-meter"><div><div class="eyebrow" style="color:#b8ead6">Route length</div><div class="metric-number" data-live="routeLength">${fmt(length)}</div></div><span class="best-badge">best seen <span data-live="bestLength">${fmt(state.bestLength)}</span></span></div>
          <div class="lab-equation-strip"><span class="segment-equation">segment A = <strong data-live="segment1">${fmt(seg1)}</strong></span><span>+</span><span class="segment-equation">segment B = <strong data-live="segment2">${fmt(seg2)}</strong></span><span>=</span><span class="segment-equation"><strong data-live="routeLength">${fmt(length)}</strong></span></div>
        </section>
        <aside class="lab-panel">
          <div class="eyebrow" style="color:#ef7182">Experiment 01</div>
          <h2>Find the shortest surface path.</h2>
          <p>The cube has been opened into two connected faces. Move the joint, observe both segment lengths, and commit when the total appears minimal.</p>
          ${slider()}
          ${controls()}
          ${feedback()}
          ${hintStack()}
          ${solutionCard()}
          ${debugPanel("Development state", stateSnapshot("B"))}
        </aside>
      </div>
    </main>`;
}

function renderTutor() {
  const length = routeLength(state.crossing);
  const learnerMessage = state.committed
    ? `<div class="message-row learner"><div class="message">My route crosses ${Math.round(state.crossing * 100)}% down the edge and has length ${fmt(length)}.</div></div>`
    : "";
  return `
    <main class="tutor-shell">
      ${warning()}
      <header class="tutor-topbar">
        <div class="tutor-brand"><span></span> Perplexing Problems</div>
        <div class="tutor-progress" aria-label="Lesson progress"><i class="done"></i><i class="${state.attempts ? "done" : ""}"></i><i class="${state.committed ? "done" : ""}"></i><i class="${state.revealed ? "done" : ""}"></i></div>
        <button class="ghost-button" data-action="reset">Start over</button>
      </header>
      <div class="tutor-column">
        <section class="lesson-heading"><div class="eyebrow">Geometry · Problem 1.1 · ★</div><h1>Shortest walk</h1><p>A five-minute guided investigation</p></section>
        <div class="message-row"><div class="tutor-avatar">P</div><div class="message">Imagine an ant at one corner of a unit cube. It wants the furthest corner, but must stay on the surface. Where should its route cross the edge between two faces?</div></div>
        <div class="message-row"><div class="tutor-avatar">P</div><div class="message">I’ve unfolded those faces for you. Drag the red joint and look for the shortest total route. Make a prediction before you calculate.</div></div>
        <section class="activity-card">
          <header class="activity-card-header"><strong>Try it yourself</strong><span class="live-badge">Live model</span></header>
          <div class="activity-visual">${routeSvg()}</div>
          <div class="activity-controls">${slider()}<div><div class="eyebrow">Length</div><div class="metric-number" data-live="routeLength">${fmt(length)}</div></div></div>
        </section>
        <div class="tutor-response">
          <div>
            ${controls()}
            ${feedback()}
            ${hintStack()}
          </div>
          ${debugPanel("Development state", stateSnapshot("C"))}
        </div>
        ${learnerMessage}
        ${state.committed ? `<div class="message-row"><div class="tutor-avatar">P</div><div class="message">${Math.abs(state.crossing - 0.5) < 0.04 ? "Exactly. Notice how the two segments now line up. What shape do they make together?" : "Good experiment. The route can still shrink: move the joint until the apparent bend disappears."}</div></div>` : ""}
        ${solutionCard("tutor-solution")}
      </div>
    </main>`;
}

function renderSwitcher(variant) {
  const localPrototype = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!localPrototype) return "";
  return `
    <aside class="prototype-switcher" aria-label="Prototype variant switcher">
      <button data-switch="previous" aria-label="Previous variant">←</button>
      <div class="prototype-switcher-label"><strong>${variant} — ${variantMeta[variant].name}</strong><small>${variantMeta[variant].short} · use ← → keys</small></div>
      <button data-switch="next" aria-label="Next variant">→</button>
    </aside>`;
}

function render() {
  if (shouldRenderChapterIndex()) {
    const chapter = requestedChapterIndex();
    document.title = chapter
      ? `Chapter ${chapter} · ${chapterCatalog[chapter].title} — Perplexing Problems`
      : "All chapters — Perplexing Problems";
    document.getElementById("app").innerHTML = window.poveyChapterIndex.render({ chapter });
    document.getElementById("prototype-switcher").innerHTML = "";
    return;
  }
  const variant = currentVariant();
  const renderVariant = { A: renderBook, B: renderLab, C: renderTutor }[variant];
  const problem = currentProblem();
  const registeredPage = window.poveyProblemPages?.[problem];
  const renderedPage = { "1.1": renderVariant, "1.2": renderCableBook, "1.3": renderHoopBook }[problem] || registeredPage?.render || renderVariant;
  document.getElementById("app").innerHTML = renderedPage();
  document.getElementById("prototype-switcher").innerHTML = problem === "1.1" ? renderSwitcher(variant) : "";
  bindInteractions();
  registeredPage?.bind?.({ render });
}

function setCrossing(value, countAttempt = true) {
  state.crossing = Math.max(0, Math.min(1, Number(value)));
  const length = routeLength(state.crossing);
  state.bestLength = Math.min(state.bestLength, length);
  if (countAttempt) state.attempts += 1;
  state.feedback = "";
  updateLiveDom();
}

function updateLiveDom() {
  const y = 50 + state.crossing * 240;
  const length = routeLength(state.crossing);
  const values = {
    crossingPercent: `${Math.round(state.crossing * 100)}%`,
    routeLength: fmt(length),
    bestLength: fmt(state.bestLength),
    segment1: fmt(Math.hypot(1, state.crossing)),
    segment2: fmt(Math.hypot(1, 1 - state.crossing)),
  };

  Object.entries(values).forEach(([key, value]) => {
    document.querySelectorAll(`[data-live="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  });
  document.querySelectorAll(".crossing-slider").forEach((input) => {
    input.value = state.crossing;
  });
  document.querySelectorAll("[data-route-line]").forEach((line) => {
    line.setAttribute("points", `80,50 320,${y} 560,290`);
  });
  document.querySelectorAll("[data-drag-handle]").forEach((handle) => {
    handle.setAttribute("cy", y);
    handle.setAttribute("aria-valuenow", Math.round(state.crossing * 100));
  });
  document.querySelectorAll("[data-drag-note]").forEach((note) => {
    note.setAttribute("y", Math.max(37, Math.min(322, y - 18)));
  });
  document.querySelectorAll(".state-surface").forEach((surface) => {
    surface.textContent = stateSnapshot(currentVariant());
  });
  document.querySelectorAll(".feedback").forEach((node) => {
    node.hidden = !state.feedback;
  });
}

function bindInteractions() {
  document.querySelectorAll(".crossing-slider").forEach((input) => {
    input.addEventListener("input", (event) => setCrossing(event.target.value));
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "reset") state = initialState();
      if (action === "cable-reset") cableState = initialCableState();
      if (action === "hoop-reset") hoopState = initialHoopState();
      if (action === "preset") setCrossing(button.dataset.value);
      if (action === "set-view") state.view = button.dataset.view;
      if (action === "hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "cable-hint") cableState.hintsUsed = Math.min(cableHints.length, cableState.hintsUsed + 1);
      if (action === "cable-reveal") cableState.revealed = true;
      if (action === "world-radius") cableState.worldRadius = Number(button.dataset.radius);
      if (action === "pole-height") {
        cableState.poleHeight = Number(button.dataset.height);
        cableState.feedback = "";
      }
      if (action === "hoop-size") setHoopRatio(Number(button.dataset.ratio));
      if (action === "hoop-simulate") runHoopSimulation();
      if (action === "hoop-hint") hoopState.hintsUsed = Math.min(hoopHints.length, hoopState.hintsUsed + 1);
      if (action === "hoop-reveal") hoopState.revealed = true;
      if (action === "reveal") {
        state.revealed = true;
        state.view = "unfold";
      }
      if (action === "commit") {
        state.committed = true;
        const close = Math.abs(state.crossing - 0.5) < 0.04;
        state.feedback = close
          ? "You found the minimum: the apparent bend has disappeared and the route is a straight line."
          : "That is a valid route, but not yet the shortest. Try moving the joint toward the point where both segments align.";
      }
      if (action !== "preset") render();
    });
  });

  document.querySelectorAll("[data-pole-slider]").forEach((slider) => {
    slider.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      activePoleDrag = true;
      updateCablePoleFromPointer(event);
    });
    slider.addEventListener("keydown", (event) => {
      const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
      if (delta == null && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") setCablePoleHeight(1, true);
      else if (event.key === "End") setCablePoleHeight(100, true);
      else setCablePoleHeight(cableState.poleHeight + delta, true);
    });
  });

  document.querySelectorAll("[data-hoop-size-slider]").forEach((slider) => {
    slider.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      activeHoopSizeDrag = true;
      updateHoopSizeFromPointer(event);
    });
    slider.addEventListener("keydown", (event) => {
      const delta = { ArrowLeft: -0.01, ArrowDown: -0.01, ArrowRight: 0.01, ArrowUp: 0.01 }[event.key];
      if (delta == null && !["Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") setHoopRatio(0.05, true);
      else if (event.key === "End") setHoopRatio(1.25, true);
      else setHoopRatio(hoopState.diameterRatio + delta, true);
    });
  });

  document.querySelectorAll("[data-hoop-drag-zone]").forEach((zone) => {
    zone.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      activeHoopPositionDrag = true;
      updateHoopPositionFromPointer(event);
    });
  });

  document.querySelectorAll(".cable-coach .estimate-input").forEach((input) => {
    input.addEventListener("input", (event) => {
      cableState.estimate = event.target.value;
    });
  });

  document.querySelectorAll("[data-cable-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = form.querySelector(".estimate-input")?.value ?? "";
      cableState.estimate = raw;
      if (raw === "") {
        cableState.feedback = "Enter a rough estimate first. Precision is not the point.";
        render();
        return;
      }
      cableState.committed = true;
      const estimate = Number(raw);
      const target = 2 * Math.PI * cableState.poleHeight;
      if (Math.abs(estimate - target) <= 5) {
        cableState.feedback = "Excellent estimate. The extra cable is only about 63 metres - surprisingly independent of the Earth's size.";
      } else if (estimate > target * 20) {
        cableState.feedback = "The size of the Earth may be pulling your estimate upward. Try subtracting the two circumference expressions before using its radius.";
      } else if (estimate < target * 0.4) {
        cableState.feedback = "The answer is still modest, but a little larger. What circumference increase comes from adding 10 metres to a radius?";
      } else {
        cableState.feedback = "You are in the right scale. A quick circumference subtraction will sharpen the estimate.";
      }
      render();
    });
  });

  document.querySelectorAll("[data-hoop-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = form.querySelector(".hoop-estimate-input")?.value ?? "";
      hoopState.estimate = raw;
      if (raw === "") {
        hoopState.feedback = "Enter a percentage estimate first.";
        render();
        return;
      }
      hoopState.committed = true;
      const difference = Math.abs(Number(raw) - hoopProbability() * 100);
      if (difference <= 5) {
        hoopState.feedback = "Strong estimate. Your prediction is within five percentage points of the geometric result.";
      } else if (Number(raw) < hoopProbability() * 100) {
        hoopState.feedback = "The boundary-crossing region is larger than your estimate. Try finding the smaller safe region first.";
      } else {
        hoopState.feedback = "The boundary-crossing region is smaller than your estimate. Track where the centre can land without the hoop touching an edge.";
      }
      render();
    });
  });

  document.querySelectorAll("[data-route-svg]").forEach((svg) => {
    svg.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("[data-drag-handle]")) return;
      event.preventDefault();
      activeRouteDrag = true;
      updateCrossingFromPointer(event);
    });
  });

  document.querySelectorAll("[data-drag-handle]").forEach((handle) => {
    handle.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      setCrossing(state.crossing + (event.key === "ArrowDown" ? 0.02 : -0.02));
    });
  });

  document.querySelectorAll("[data-switch]").forEach((button) => {
    button.addEventListener("click", () => cycleVariant(button.dataset.switch === "next" ? 1 : -1));
  });
}

function setCablePoleHeight(value, shouldRender = false) {
  cableState.poleHeight = Math.max(1, Math.min(100, Math.round(Number(value))));
  cableState.feedback = "";
  if (shouldRender) render();
  else updateCableLiveDom();
}

function setHoopRatio(value, shouldRender = false) {
  hoopState.diameterRatio = Math.max(0.05, Math.min(1.25, Math.round(Number(value) * 100) / 100));
  hoopState.feedback = "";
  hoopState.estimate = "";
  hoopState.committed = false;
  hoopState.trials = 0;
  hoopState.crossings = 0;
  hoopState.points = [];
  if (shouldRender) render();
  else updateHoopLiveDom();
}

function setHoopCentre(x, y, shouldRender = false) {
  hoopState.centreX = Math.max(0, Math.min(1, Number(x)));
  hoopState.centreY = Math.max(0, Math.min(1, Number(y)));
  if (shouldRender) render();
  else updateHoopLiveDom();
}

function runHoopSimulation(count = 200) {
  let seed = 137 + Math.round(hoopState.diameterRatio * 10000);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  hoopState.points = Array.from({ length: count }, () => {
    const x = random();
    const y = random();
    return { x, y, crosses: hoopCrossesBoundary(x, y) };
  });
  hoopState.trials = count;
  hoopState.crossings = hoopState.points.filter((point) => point.crosses).length;
}

function updateHoopLiveDom() {
  const tileX = 240;
  const tileY = 106;
  const tile = 80;
  const ratio = hoopState.diameterRatio;
  const radius = (ratio * tile) / 2;
  const centreX = tileX + hoopState.centreX * tile;
  const centreY = tileY + hoopState.centreY * tile;
  const crosses = hoopCrossesBoundary();
  const progress = ((ratio - 0.05) / 1.2) * 100;

  document.querySelectorAll('[data-hoop-live="ratio"]').forEach((node) => {
    node.textContent = fmt(ratio, 2);
  });
  document.querySelectorAll('[data-hoop-live="probability"]').forEach((node) => {
    node.textContent = `${fmt(hoopProbability() * 100, 1)}%`;
  });
  document.querySelectorAll("[data-hoop-size-slider]").forEach((slider) => {
    slider.style.setProperty("--slider-progress", `${progress}%`);
    slider.setAttribute("aria-valuenow", fmt(ratio, 2));
    slider.setAttribute("aria-valuetext", `diameter ${fmt(ratio, 2)} times the tile side`);
  });
  document.querySelectorAll("[data-hoop-ring]").forEach((ring) => {
    ring.setAttribute("cx", centreX);
    ring.setAttribute("cy", centreY);
    ring.setAttribute("r", radius);
    ring.setAttribute("class", `hoop-ring ${crosses ? "crosses" : "safe"}`);
  });
  document.querySelectorAll("[data-hoop-centre]").forEach((centre) => {
    centre.setAttribute("cx", centreX);
    centre.setAttribute("cy", centreY);
  });
  document.querySelectorAll("[data-diameter-line]").forEach((line) => {
    line.setAttribute("x1", centreX - radius);
    line.setAttribute("y1", centreY);
    line.setAttribute("x2", centreX + radius);
    line.setAttribute("y2", centreY);
  });
  document.querySelectorAll("[data-diameter-label]").forEach((label) => {
    label.setAttribute("x", centreX);
    label.setAttribute("y", centreY - 8);
  });
  document.querySelectorAll("[data-hoop-status]").forEach((label) => {
    label.textContent = crosses ? "crosses a colour boundary" : "stays inside one colour";
    label.parentElement?.setAttribute("class", `hoop-status ${crosses ? "crosses" : "safe"}`);
  });
  document.querySelectorAll("[data-landing-status]").forEach((label) => {
    label.textContent = crosses ? "two colours" : "one colour";
    label.setAttribute("class", `landing-status ${crosses ? "crosses" : "safe"}`);
  });
  const safeLocus = document.querySelector("[data-safe-locus]");
  if (safeLocus) {
    const safeSize = ratio < 1 ? tile * (1 - ratio) : 0;
    safeLocus.setAttribute("x", tileX + radius);
    safeLocus.setAttribute("y", tileY + radius);
    safeLocus.setAttribute("width", safeSize);
    safeLocus.setAttribute("height", safeSize);
  }
  const trialPoints = document.querySelector("[data-trial-points]");
  if (trialPoints) trialPoints.innerHTML = hoopTrialDots();
  document.querySelectorAll(".trial-summary").forEach((summary) => {
    summary.hidden = !hoopState.trials;
  });
  document.querySelectorAll(".state-surface").forEach((surface) => {
    surface.textContent = hoopStateSnapshot();
  });
}

function updateCableLiveDom() {
  const added = 2 * Math.PI * cableState.poleHeight;
  const earthRadius = 112;
  const cableRadius = earthRadius + 13 + (cableState.poleHeight / 100) * 29;
  const values = {
    height: `${cableState.poleHeight} m`,
    heightWords: `${cableState.poleHeight} metre`,
    radiusNumber: cableState.worldRadius.toLocaleString(),
    radiusLabel: `${cableState.worldRadius.toLocaleString()} km`,
    added: `${fmt(added, 1)} m`,
  };
  Object.entries(values).forEach(([key, value]) => {
    document.querySelectorAll(`[data-cable-live="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  });
  document.querySelector("[data-cable-orbit]")?.setAttribute("r", cableRadius);
  const poleGroup = document.querySelector("[data-pole-lines]");
  if (poleGroup) poleGroup.innerHTML = cablePoleLines(earthRadius, cableRadius);
  const progress = ((cableState.poleHeight - 1) / 99) * 100;
  document.querySelectorAll("[data-pole-slider]").forEach((slider) => {
    slider.style.setProperty("--slider-progress", `${progress}%`);
    slider.setAttribute("aria-valuenow", cableState.poleHeight);
    slider.setAttribute("aria-valuetext", `${cableState.poleHeight} metres`);
  });
  document.querySelectorAll(".state-surface").forEach((surface) => {
    surface.textContent = cableStateSnapshot();
  });
  document.querySelectorAll(".feedback").forEach((node) => {
    node.hidden = !cableState.feedback;
  });
}

function cycleVariant(direction) {
  const keys = Object.keys(variantMeta);
  const nextIndex = (keys.indexOf(currentVariant()) + direction + keys.length) % keys.length;
  const url = new URL(window.location.href);
  url.searchParams.set("variant", keys[nextIndex]);
  window.history.replaceState({}, "", url);
  render();
  window.scrollTo(0, 0);
}

window.addEventListener("keydown", (event) => {
  if (shouldRenderChapterIndex()) return;
  if (currentProblem() !== "1.1") return;
  const target = event.target;
  if (target.matches("input, textarea, [contenteditable='true']")) return;
  if (event.key === "ArrowLeft") cycleVariant(-1);
  if (event.key === "ArrowRight") cycleVariant(1);
});

function updateCrossingFromPointer(event) {
  const svg = document.querySelector("[data-route-svg]");
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const viewY = ((event.clientY - rect.top) / rect.height) * 350;
  setCrossing((viewY - 50) / 240);
}

function updateCablePoleFromPointer(event) {
  const slider = document.querySelector("[data-pole-slider]");
  if (!slider) return;
  const rect = slider.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  setCablePoleHeight(Math.round(1 + ratio * 99));
}

function updateHoopSizeFromPointer(event) {
  const slider = document.querySelector("[data-hoop-size-slider]");
  if (!slider) return;
  const rect = slider.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  setHoopRatio(0.05 + progress * 1.2);
}

function updateHoopPositionFromPointer(event) {
  const zone = document.querySelector("[data-hoop-drag-zone]");
  if (!zone) return;
  const rect = zone.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  setHoopCentre(x, y);
}

window.addEventListener("pointermove", (event) => {
  if (activeRouteDrag) updateCrossingFromPointer(event);
  if (activePoleDrag) updateCablePoleFromPointer(event);
  if (activeHoopSizeDrag) updateHoopSizeFromPointer(event);
  if (activeHoopPositionDrag) updateHoopPositionFromPointer(event);
});
window.addEventListener("pointerup", () => {
  activeRouteDrag = false;
  let shouldRender = false;
  if (activePoleDrag) {
    activePoleDrag = false;
    shouldRender = true;
  }
  if (activeHoopSizeDrag) {
    activeHoopSizeDrag = false;
    shouldRender = true;
  }
  if (activeHoopPositionDrag) {
    activeHoopPositionDrag = false;
    shouldRender = true;
  }
  if (shouldRender) render();
});

window.addEventListener("popstate", render);
render();
