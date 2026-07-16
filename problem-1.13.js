(function registerCaptainFistfullsTreasureTwoPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const LANDMARK_DISTANCE = 6;
  const MIN_RADIUS = 0.5;
  const MAX_RADIUS = 8;
  const RADIUS_STEP = 0.25;
  const EPSILON = 1e-8;
  const VIEW = Object.freeze({
    width: 720,
    height: 510,
    originX: 254,
    originY: 255,
    scale: 29,
    minX: -8.5,
    maxX: 14.5,
    minY: -8.3,
    maxY: 8.3,
  });
  const LANDMARKS = Object.freeze({
    a: Object.freeze({ x: 0, y: 0, label: "A" }),
    b: Object.freeze({ x: LANDMARK_DISTANCE, y: 0, label: "B" }),
  });
  const HANDLE_ANGLES = Object.freeze({ a: 135, b: 45 });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p113-reset">Reset</button>';

  const presets = Object.freeze([
    Object.freeze({ key: "default", label: "5 &amp; 4", detail: "two sites", rA: 5, rB: 4 }),
    Object.freeze({ key: "separate", label: "2 &amp; 2", detail: "separate", rA: 2, rB: 2 }),
    Object.freeze({ key: "external", label: "3 &amp; 3", detail: "touch outside", rA: 3, rB: 3 }),
    Object.freeze({ key: "contained", label: "7 &amp; 0.5", detail: "one inside", rA: 7, rB: 0.5 }),
    Object.freeze({ key: "internal", label: "7 &amp; 1", detail: "touch inside", rA: 7, rB: 1 }),
  ]);

  const hints = Object.freeze([
    "Each distance clue describes a whole circle, not a single point. Possible treasure sites must lie on both circles.",
    "Compare d = 6 with the sum rA + rB and the difference |rA - rB|. Intersections exist only when |rA - rB| ≤ d ≤ rA + rB.",
    "Subtract (x - 6)² + y² = rB² from x² + y² = rA². The y² terms cancel.",
    "The subtraction gives x = (6² + rA² - rB²) / 12. For 5 and 4, x = 45/12 = 3.75.",
    "Then y² = rA² - x². In the default case this is 25 - 3.75² = 175/16, so y = ±√175/4.",
  ]);

  const initialState = () => ({
    rA: 5,
    rB: 4,
    selectedCandidate: "upper",
    estimateX: "",
    estimateY: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();
  let activeRadius = null;
  let activePointerId = null;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function roundRadius(value) {
    const stepped = Math.round(Number(value) / RADIUS_STEP) * RADIUS_STEP;
    return clamp(stepped, MIN_RADIUS, MAX_RADIUS);
  }

  function nearlyEqual(a, b) {
    return Math.abs(a - b) <= EPSILON;
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    const safe = Math.abs(value) < 0.5 * (10 ** -digits) ? 0 : value;
    return safe.toFixed(digits).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function formatFixed(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    const safe = Math.abs(value) < 0.5 * (10 ** -digits) ? 0 : value;
    return safe.toFixed(digits);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function intersectionData(rA = state.rA, rB = state.rB) {
    const sum = rA + rB;
    const difference = Math.abs(rA - rB);
    let count;
    let relation;
    let explanation;

    if (LANDMARK_DISTANCE > sum + EPSILON) {
      count = 0;
      relation = "separate";
      explanation = `The radii total ${format(sum)}, short of the 6-unit gap.`;
    } else if (LANDMARK_DISTANCE < difference - EPSILON) {
      count = 0;
      relation = "contained";
      explanation = `The radius difference ${format(difference)} exceeds the 6-unit gap, so one circle sits inside the other.`;
    } else if (nearlyEqual(LANDMARK_DISTANCE, sum)) {
      count = 1;
      relation = "external-tangent";
      explanation = "The radius sum equals 6, so the circles touch externally.";
    } else if (nearlyEqual(LANDMARK_DISTANCE, difference)) {
      count = 1;
      relation = "internal-tangent";
      explanation = "The radius difference equals 6, so the circles touch internally.";
    } else {
      count = 2;
      relation = "crossing";
      explanation = "The 6-unit gap lies strictly between the radius difference and radius sum.";
    }

    const x = ((LANDMARK_DISTANCE ** 2) + (rA ** 2) - (rB ** 2)) / (2 * LANDMARK_DISTANCE);
    const heightSquared = (rA ** 2) - (x ** 2);
    const height = count === 0 ? null : Math.sqrt(Math.max(0, heightSquared));
    const candidates = count === 0
      ? []
      : count === 1
        ? [{ key: "tangent", x, y: 0 }]
        : [
            { key: "upper", x, y: height },
            { key: "lower", x, y: -height },
          ];

    return {
      count,
      relation,
      explanation,
      sum,
      difference,
      x,
      heightSquared,
      height,
      candidates,
    };
  }

  function relationLabel(data) {
    if (data.count === 2) return "Two intersections";
    if (data.relation === "external-tangent") return "One external tangency";
    if (data.relation === "internal-tangent") return "One internal tangency";
    if (data.relation === "contained") return "No intersections · contained";
    return "No intersections · separate";
  }

  function selectedCandidate(data = intersectionData()) {
    if (!data.candidates.length) return null;
    if (data.candidates.length === 1) return data.candidates[0];
    return data.candidates.find((candidate) => candidate.key === state.selectedCandidate) || data.candidates[0];
  }

  function ensureCandidateSelection(data = intersectionData()) {
    if (data.count === 2 && !["upper", "lower"].includes(state.selectedCandidate)) {
      state.selectedCandidate = "upper";
    }
    if (data.count === 1) state.selectedCandidate = "tangent";
    if (data.count === 0) state.selectedCandidate = null;
  }

  function clearEstimateResult() {
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "";
  }

  function setRadius(which, value) {
    const key = which === "a" ? "rA" : "rB";
    const next = roundRadius(value);
    if (nearlyEqual(state[key], next)) return false;
    state[key] = next;
    clearEstimateResult();
    ensureCandidateSelection(intersectionData());
    return true;
  }

  function mapToSvg(point) {
    return {
      x: VIEW.originX + point.x * VIEW.scale,
      y: VIEW.originY - point.y * VIEW.scale,
    };
  }

  function radiusHandle(which) {
    const centre = LANDMARKS[which];
    const radius = which === "a" ? state.rA : state.rB;
    const angle = HANDLE_ANGLES[which] * Math.PI / 180;
    return mapToSvg({
      x: centre.x + radius * Math.cos(angle),
      y: centre.y + radius * Math.sin(angle),
    });
  }

  function gridMarkup() {
    const lines = [];
    for (let x = -8; x <= 14; x += 2) {
      const point = mapToSvg({ x, y: 0 });
      lines.push(`<line x1="${point.x}" y1="14" x2="${point.x}" y2="496" />`);
    }
    for (let y = -8; y <= 8; y += 2) {
      const point = mapToSvg({ x: 0, y });
      lines.push(`<line x1="10" y1="${point.y}" x2="710" y2="${point.y}" />`);
    }
    return lines.join("");
  }

  function candidatePointsMarkup(data = intersectionData()) {
    if (!data.candidates.length) return '<text class="p113-no-point" x="360" y="474">No shared point</text>';
    return data.candidates.map((candidate) => {
      const point = mapToSvg(candidate);
      const selected = candidate.key === state.selectedCandidate || data.count === 1;
      const label = state.revealed
        ? `<text class="p113-candidate-label" x="${point.x + 16}" y="${point.y + (candidate.y >= 0 ? -13 : 25)}">(${formatFixed(candidate.x, 3)}, ${formatFixed(candidate.y, 3)})</text>`
        : "";
      return `
        <g class="p113-candidate ${selected ? "p113-candidate-selected" : ""}">
          <circle cx="${point.x}" cy="${point.y}" r="10" />
          <line x1="${point.x - 14}" y1="${point.y}" x2="${point.x + 14}" y2="${point.y}" />
          <line x1="${point.x}" y1="${point.y - 14}" x2="${point.x}" y2="${point.y + 14}" />
          ${label}
        </g>`;
    }).join("");
  }

  function circleMarkup(which) {
    const centre = mapToSvg(LANDMARKS[which]);
    const radius = (which === "a" ? state.rA : state.rB) * VIEW.scale;
    const handle = radiusHandle(which);
    const title = which === "a" ? "Radius from A" : "Radius from B";
    const value = which === "a" ? state.rA : state.rB;
    return `
      <g class="p113-circle-group p113-circle-${which}">
        <circle data-p113-circle="${which}" cx="${centre.x}" cy="${centre.y}" r="${radius}" />
        <line data-p113-radius-line="${which}" x1="${centre.x}" y1="${centre.y}" x2="${handle.x}" y2="${handle.y}" />
        <circle
          class="p113-radius-handle"
          data-p113-radius-handle="${which}"
          cx="${handle.x}"
          cy="${handle.y}"
          r="18"
          role="slider"
          tabindex="0"
          focusable="true"
          aria-label="${title}"
          aria-describedby="p113-map-help"
          aria-valuemin="${MIN_RADIUS}"
          aria-valuemax="${MAX_RADIUS}"
          aria-valuenow="${value}"
          aria-valuetext="${format(value)} units"
        />
      </g>`;
  }

  function mapDescription(data = intersectionData()) {
    return `Two circles centred at A and B, 6 units apart. Radius A is ${format(state.rA)} and radius B is ${format(state.rB)}. ${relationLabel(data)}. ${data.explanation}`;
  }

  function mapSvg(data = intersectionData()) {
    const pointA = mapToSvg(LANDMARKS.a);
    const pointB = mapToSvg(LANDMARKS.b);
    return `
      <svg class="route-svg p113-map" data-p113-map viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="img" aria-labelledby="p113-map-title p113-map-desc">
        <title id="p113-map-title">Adjustable two-circle treasure map</title>
        <desc id="p113-map-desc" data-p113-map-desc>${mapDescription(data)}</desc>
        <rect class="p113-map-paper" x="8" y="8" width="704" height="494" rx="18" />
        <g class="p113-grid" aria-hidden="true">${gridMarkup()}</g>
        <g class="p113-axis" aria-hidden="true">
          <line x1="14" y1="${pointA.y}" x2="706" y2="${pointA.y}" />
        </g>
        ${circleMarkup("a")}
        ${circleMarkup("b")}
        <g class="p113-candidate-layer" data-p113-candidate-layer aria-hidden="true">${candidatePointsMarkup(data)}</g>
        <g class="p113-landmarks" aria-hidden="true">
          <circle cx="${pointA.x}" cy="${pointA.y}" r="8" />
          <circle cx="${pointB.x}" cy="${pointB.y}" r="8" />
          <text x="${pointA.x - 45}" y="${pointA.y + 28}">A (0, 0)</text>
          <text x="${pointB.x + 14}" y="${pointB.y + 28}">B (6, 0)</text>
          <line class="p113-dimension" x1="${pointA.x}" y1="${pointA.y + 49}" x2="${pointB.x}" y2="${pointB.y + 49}" />
          <text class="p113-dimension-label" x="${(pointA.x + pointB.x) / 2}" y="${pointA.y + 70}">d = 6</text>
        </g>
      </svg>`;
  }

  function presetControls() {
    return `
      <div class="p113-presets" aria-label="Radius examples">
        ${presets.map((preset) => {
          const active = nearlyEqual(state.rA, preset.rA) && nearlyEqual(state.rB, preset.rB);
          return `
            <button class="chip-button p113-preset ${active ? "active" : ""}" type="button" data-problem-action="p113-preset" data-p113-preset="${preset.key}" ${active ? 'aria-current="true"' : ""}>
              <strong>${preset.label}</strong><span>${preset.detail}</span>
            </button>`;
        }).join("")}
      </div>`;
  }

  function radiusControl(which) {
    const radius = which === "a" ? state.rA : state.rB;
    const landmark = which.toUpperCase();
    return `
      <div class="p113-radius-control p113-radius-control-${which}">
        <div><small>Circle ${landmark}</small><strong>r<sub>${landmark}</sub> = <span data-p113-radius-value="${which}">${format(radius)}</span></strong></div>
        <div class="p113-step-buttons" aria-label="Adjust radius from ${landmark}">
          <button type="button" data-problem-action="p113-adjust-radius" data-p113-radius="${which}" data-p113-delta="-${RADIUS_STEP}" aria-label="Decrease radius from ${landmark}">−</button>
          <button type="button" data-problem-action="p113-adjust-radius" data-p113-radius="${which}" data-p113-delta="${RADIUS_STEP}" aria-label="Increase radius from ${landmark}">+</button>
        </div>
      </div>`;
  }

  function boundaryMarkup(data = intersectionData()) {
    const lowerMet = LANDMARK_DISTANCE + EPSILON >= data.difference;
    const upperMet = LANDMARK_DISTANCE <= data.sum + EPSILON;
    const strictLower = LANDMARK_DISTANCE > data.difference + EPSILON;
    const strictUpper = LANDMARK_DISTANCE < data.sum - EPSILON;
    return `
      <section class="p113-boundary" aria-labelledby="p113-boundary-heading">
        <div class="p113-boundary-heading">
          <div><span class="eyebrow">Triangle-inequality test</span><h2 id="p113-boundary-heading">difference ≤ 6 ≤ sum</h2></div>
          <strong class="p113-count-badge p113-count-${data.count}" data-p113-count-badge>${data.count} ${data.count === 1 ? "intersection" : "intersections"}</strong>
        </div>
        <div class="p113-boundary-rows">
          <div class="${lowerMet ? "p113-boundary-met" : "p113-boundary-failed"}" data-p113-boundary-row="difference"><span>|rA − rB|</span><strong data-p113-live="difference">${format(data.difference)}</strong><b>${strictLower ? "<" : nearlyEqual(data.difference, LANDMARK_DISTANCE) ? "=" : ">"} 6</b></div>
          <div class="${upperMet ? "p113-boundary-met" : "p113-boundary-failed"}" data-p113-boundary-row="sum"><span>rA + rB</span><strong data-p113-live="sum">${format(data.sum)}</strong><b>${strictUpper ? ">" : nearlyEqual(data.sum, LANDMARK_DISTANCE) ? "=" : "<"} 6</b></div>
        </div>
        <p data-p113-live="explanation">${data.explanation}</p>
        <div class="p113-boundary-key"><span><i class="p113-key-two"></i>strict both: 2</span><span><i class="p113-key-one"></i>one equality: 1</span><span><i class="p113-key-zero"></i>failed inequality: 0</span></div>
      </section>`;
  }

  function candidateControls(data = intersectionData()) {
    if (data.count === 0) {
      return '<div class="p113-candidate-empty" role="status">No candidate can satisfy both radius clues. Try a tangency preset or widen one circle.</div>';
    }
    if (data.count === 1) {
      return '<div class="p113-candidate-single"><span>Selected candidate</span><strong>Tangent point on line AB</strong></div>';
    }
    return `
      <div class="p113-candidate-controls" aria-label="Choose an intersection to estimate">
        <span>Estimate which candidate?</span>
        <div>
          <button class="chip-button ${state.selectedCandidate === "upper" ? "active" : ""}" type="button" data-problem-action="p113-select-candidate" data-p113-candidate="upper" ${state.selectedCandidate === "upper" ? 'aria-pressed="true"' : 'aria-pressed="false"'}>Upper (+y)</button>
          <button class="chip-button ${state.selectedCandidate === "lower" ? "active" : ""}" type="button" data-problem-action="p113-select-candidate" data-p113-candidate="lower" ${state.selectedCandidate === "lower" ? 'aria-pressed="true"' : 'aria-pressed="false"'}>Lower (−y)</button>
        </div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p113-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p113-hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function currentCaseSolution(data) {
    if (data.count === 0) {
      return `<p><strong>Current radii ${format(state.rA)} and ${format(state.rB)}:</strong> ${data.explanation} There is no real value of y and therefore no treasure site satisfying both clues.</p>`;
    }
    if (data.count === 1) {
      return `<p><strong>Current radii ${format(state.rA)} and ${format(state.rB)}:</strong> the equality boundary makes y = 0, so the single tangent point is <strong>(${formatFixed(data.x, 3)}, 0)</strong>.</p>`;
    }
    return `<p><strong>Current radii ${format(state.rA)} and ${format(state.rB)}:</strong> the two sites are <strong>(${formatFixed(data.x, 3)}, ${formatFixed(data.height, 3)})</strong> and <strong>(${formatFixed(data.x, 3)}, −${formatFixed(data.height, 3)})</strong>.</p>`;
  }

  function solutionMarkup(data = intersectionData()) {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p113-solution" aria-labelledby="p113-solution-heading">
        <h2 id="p113-solution-heading" tabindex="-1">Subtract first, then test the height</h2>
        <p>For T = (x, y), the two circle equations are x² + y² = rA² and (x − 6)² + y² = rB². Subtracting eliminates y.</p>
        <div class="equation">x = (6² + rA² − rB²) / (2 · 6)</div>
        <div class="equation">y = ±√(rA² − x²)</div>
        <p>With the original radii 5 and 4:</p>
        <div class="equation">x = (36 + 25 − 16) / 12 = 15/4</div>
        <div class="equation">y = ±√(25 − 225/16) = ±√175/4</div>
        <div class="equation p113-answer">T = (3.75, ±3.307…)</div>
        <div data-p113-current-case>${currentCaseSolution(data)}</div>
        <p class="p113-solution-note"><strong>Boundary rule:</strong> |rA − rB| &lt; 6 &lt; rA + rB gives two sites. Equality on either side gives tangency and one site. Failing either inequality gives none.</p>
      </section>`;
  }

  function stateSnapshot() {
    const data = intersectionData();
    const candidate = selectedCandidate(data);
    return JSON.stringify(
      {
        problem: "1.13",
        provenance: "reconstructed activity; source body unavailable",
        landmarkDistance: LANDMARK_DISTANCE,
        radiusA: state.rA,
        radiusB: state.rB,
        radiusSum: data.sum,
        radiusDifference: data.difference,
        relation: data.relation,
        intersectionCount: data.count,
        derivedX: Number(data.x.toFixed(9)),
        derivedHeightSquared: Number(data.heightSquared.toFixed(9)),
        selectedCandidate: candidate ? [Number(candidate.x.toFixed(9)), Number(candidate.y.toFixed(9))] : null,
        estimate: state.estimateX === "" || state.estimateY === "" ? null : [Number(state.estimateX), Number(state.estimateY)],
        committed: state.committed,
        hintsUsed: state.hintsUsed,
        solutionRevealed: state.revealed,
      },
      null,
      2,
    );
  }

  function render() {
    const data = intersectionData();
    ensureCandidateSelection(data);
    const hasCandidate = data.count > 0;
    return `
      <main class="book-shell p113-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p113-progress"><span></span></div></div>
          ${problemHeaderActions("1.13", resetMarkup)}
        </header>

        <div class="book-spread p113-spread">
          <article class="book-page p113-problem-page">
            <div class="problem-number">Problem 1.13</div>
            <h1 class="book-title p113-book-title">Captain Fistfulls' treasure II</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <div class="p113-reconstruction-label">Reconstructed activity</div>
            <p class="problem-copy">Landmarks A and B are still 6 map units apart. A second treasure is exactly 5 units from A and exactly 4 units from B.</p>
            <p class="p113-question"><strong>Find every possible treasure site.</strong> Then change the two distance clues: when do they give two sites, one site, or no site at all?</p>
            <aside class="p113-source-note" aria-label="Reconstruction note">
              <strong>Source note</strong>
              <p>The available chapter sample stops after Problem 1.10. This circle-intersection investigation was independently written from the listed title and two-star rating. Its wording, values, and solution are not a transcription from the book.</p>
            </aside>
            <section class="prediction-box p113-prediction">
              <div class="eyebrow">Before calculating</div>
              <p>Picture a circle of radius 5 around A and one of radius 4 around B. How many crossing points do you expect? Why might there be a reflected pair?</p>
            </section>
            <div class="p113-mini-rule">
              <span>Possible triangle sides</span>
              <strong>|rA − rB| ≤ 6 ≤ rA + rB</strong>
              <p>The two radii and the landmark gap must be able to form a triangle. A flat triangle is exactly the tangency boundary.</p>
            </div>
          </article>

          <section class="book-page book-stage p113-stage">
            ${presetControls()}
            <div class="p113-radius-controls">${radiusControl("a")}${radiusControl("b")}</div>
            ${mapSvg(data)}
            <p class="p113-map-help" id="p113-map-help"><strong>Change a radius:</strong> drag either coloured handle. Focus a handle and use Arrow keys for 0.25 units, Shift+Arrow or Page Up/Down for 1, and Home/End for the limits.</p>
            <div class="p113-relation-card p113-relation-${data.count}" data-p113-relation-card role="status" aria-live="polite">
              <div><span class="eyebrow">Current geometry</span><strong data-p113-live="relation">${relationLabel(data)}</strong></div>
              <p data-p113-live="relation-detail">${data.explanation}</p>
            </div>
            <div data-p113-candidate-controls>${candidateControls(data)}</div>
            ${boundaryMarkup(data)}
          </section>

          <aside class="book-page book-coach p113-coach">
            <div class="coach-kicker">Estimate a site</div>
            <p class="coach-question" data-p113-coach-question>${hasCandidate ? `Estimate the coordinate of the ${data.count === 1 ? "tangent" : state.selectedCandidate} candidate.` : "These circles do not meet. Adjust a radius or choose another preset."}</p>
            <form class="estimate-form p113-estimate-form" data-p113-estimate-form novalidate>
              <div class="p113-coordinate-fields">
                <label for="p113-estimate-x">x coordinate<input id="p113-estimate-x" class="estimate-input" data-p113-estimate-x inputmode="decimal" type="number" step="0.01" value="${escapeAttribute(state.estimateX)}" placeholder="x" ${hasCandidate ? "" : "disabled"} /></label>
                <label for="p113-estimate-y">y coordinate<input id="p113-estimate-y" class="estimate-input" data-p113-estimate-y inputmode="decimal" type="number" step="0.01" value="${escapeAttribute(state.estimateY)}" placeholder="y" ${hasCandidate ? "" : "disabled"} /></label>
              </div>
              <button class="primary-button" type="submit" ${hasCandidate ? "" : "disabled"}>Commit estimate</button>
            </form>
            <div class="button-row p113-help-row">
              <button class="secondary-button" type="button" data-problem-action="p113-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p113-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal"}</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup(data)}
            ${debugPanel("Problem 1.13 development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.13")}
      </main>`;
  }

  function updateExplorer() {
    const root = document.querySelector(".p113-book-shell");
    if (!root) return;
    const data = intersectionData();
    ensureCandidateSelection(data);

    ["a", "b"].forEach((which) => {
      const radius = which === "a" ? state.rA : state.rB;
      const handle = radiusHandle(which);
      const circle = root.querySelector(`[data-p113-circle="${which}"]`);
      const line = root.querySelector(`[data-p113-radius-line="${which}"]`);
      const handleNode = root.querySelector(`[data-p113-radius-handle="${which}"]`);
      const value = root.querySelector(`[data-p113-radius-value="${which}"]`);
      circle?.setAttribute("r", String(radius * VIEW.scale));
      line?.setAttribute("x2", String(handle.x));
      line?.setAttribute("y2", String(handle.y));
      handleNode?.setAttribute("cx", String(handle.x));
      handleNode?.setAttribute("cy", String(handle.y));
      handleNode?.setAttribute("aria-valuenow", String(radius));
      handleNode?.setAttribute("aria-valuetext", `${format(radius)} units`);
      if (value) value.textContent = format(radius);
    });

    const layer = root.querySelector("[data-p113-candidate-layer]");
    if (layer) layer.innerHTML = candidatePointsMarkup(data);
    const controls = root.querySelector("[data-p113-candidate-controls]");
    if (controls) controls.innerHTML = candidateControls(data);
    const currentCase = root.querySelector("[data-p113-current-case]");
    if (currentCase) currentCase.innerHTML = currentCaseSolution(data);

    const setText = (selector, text) => {
      root.querySelectorAll(selector).forEach((node) => { node.textContent = text; });
    };
    setText('[data-p113-live="difference"]', format(data.difference));
    setText('[data-p113-live="sum"]', format(data.sum));
    setText('[data-p113-live="explanation"]', data.explanation);
    setText('[data-p113-live="relation"]', relationLabel(data));
    setText('[data-p113-live="relation-detail"]', data.explanation);
    setText("[data-p113-map-desc]", mapDescription(data));

    const differenceRow = root.querySelector('[data-p113-boundary-row="difference"]');
    const sumRow = root.querySelector('[data-p113-boundary-row="sum"]');
    const differenceMet = LANDMARK_DISTANCE + EPSILON >= data.difference;
    const sumMet = LANDMARK_DISTANCE <= data.sum + EPSILON;
    if (differenceRow) {
      differenceRow.className = differenceMet ? "p113-boundary-met" : "p113-boundary-failed";
      const sign = differenceRow.querySelector("b");
      if (sign) sign.textContent = `${LANDMARK_DISTANCE > data.difference + EPSILON ? "<" : nearlyEqual(data.difference, LANDMARK_DISTANCE) ? "=" : ">"} 6`;
    }
    if (sumRow) {
      sumRow.className = sumMet ? "p113-boundary-met" : "p113-boundary-failed";
      const sign = sumRow.querySelector("b");
      if (sign) sign.textContent = `${LANDMARK_DISTANCE < data.sum - EPSILON ? ">" : nearlyEqual(data.sum, LANDMARK_DISTANCE) ? "=" : "<"} 6`;
    }

    const badge = root.querySelector("[data-p113-count-badge]");
    if (badge) {
      badge.className = `p113-count-badge p113-count-${data.count}`;
      badge.textContent = `${data.count} ${data.count === 1 ? "intersection" : "intersections"}`;
    }
    const relationCard = root.querySelector("[data-p113-relation-card]");
    if (relationCard) relationCard.className = `p113-relation-card p113-relation-${data.count}`;
    const question = root.querySelector("[data-p113-coach-question]");
    if (question) question.textContent = data.count
      ? `Estimate the coordinate of the ${data.count === 1 ? "tangent" : state.selectedCandidate} candidate.`
      : "These circles do not meet. Adjust a radius or choose another preset.";

    root.querySelectorAll(".p113-preset").forEach((button) => {
      const preset = presets.find((item) => item.key === button.dataset.p113Preset);
      const active = preset && nearlyEqual(state.rA, preset.rA) && nearlyEqual(state.rB, preset.rB);
      button.classList.toggle("active", Boolean(active));
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });

    const estimateX = root.querySelector("[data-p113-estimate-x]");
    const estimateY = root.querySelector("[data-p113-estimate-y]");
    const submit = root.querySelector("[data-p113-estimate-form] button[type=submit]");
    if (estimateX) estimateX.disabled = data.count === 0;
    if (estimateY) estimateY.disabled = data.count === 0;
    if (submit) submit.disabled = data.count === 0;
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

  function radiusFromPointer(event, svg, which) {
    const point = pointerInSvg(event, svg);
    const mapPoint = {
      x: (point.x - VIEW.originX) / VIEW.scale,
      y: (VIEW.originY - point.y) / VIEW.scale,
    };
    const centre = LANDMARKS[which];
    return Math.hypot(mapPoint.x - centre.x, mapPoint.y - centre.y);
  }

  function bindRadiusHandles(root, renderApp) {
    const map = root.querySelector("[data-p113-map]");
    if (!map) return;
    root.querySelectorAll("[data-p113-radius-handle]").forEach((handle) => {
      handle.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        activeRadius = handle.dataset.p113RadiusHandle;
        activePointerId = event.pointerId;
        handle.setPointerCapture(event.pointerId);
        setRadius(activeRadius, radiusFromPointer(event, map, activeRadius));
        updateExplorer();
      });
      handle.addEventListener("pointermove", (event) => {
        if (activePointerId !== event.pointerId || activeRadius !== handle.dataset.p113RadiusHandle) return;
        setRadius(activeRadius, radiusFromPointer(event, map, activeRadius));
        updateExplorer();
      });
      handle.addEventListener("pointerup", (event) => {
        if (activePointerId !== event.pointerId) return;
        setRadius(activeRadius, radiusFromPointer(event, map, activeRadius));
        updateExplorer();
        if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        activePointerId = null;
        activeRadius = null;
        renderApp();
        window.requestAnimationFrame(() => document.querySelector(`[data-p113-radius-handle="${handle.dataset.p113RadiusHandle}"]`)?.focus());
      });
      handle.addEventListener("pointercancel", (event) => {
        if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        activePointerId = null;
        activeRadius = null;
        renderApp();
      });
      handle.addEventListener("keydown", (event) => {
        const which = handle.dataset.p113RadiusHandle;
        const current = which === "a" ? state.rA : state.rB;
        const step = event.shiftKey ? 1 : RADIUS_STEP;
        let next;
        if (["ArrowLeft", "ArrowDown"].includes(event.key)) next = current - step;
        else if (["ArrowRight", "ArrowUp"].includes(event.key)) next = current + step;
        else if (event.key === "PageDown") next = current - 1;
        else if (event.key === "PageUp") next = current + 1;
        else if (event.key === "Home") next = MIN_RADIUS;
        else if (event.key === "End") next = MAX_RADIUS;
        else return;
        event.preventDefault();
        setRadius(which, next);
        updateExplorer();
      });
    });
  }

  function evaluateEstimate() {
    const data = intersectionData();
    const candidate = selectedCandidate(data);
    const rawX = state.estimateX.trim();
    const rawY = state.estimateY.trim();
    const x = Number(rawX);
    const y = Number(rawY);
    state.feedbackTone = "";
    if (!candidate) {
      state.committed = false;
      state.feedback = "There is no shared point for the current radii. Use the inequality panel to explain why.";
      return;
    }
    if (!rawX || !rawY || !Number.isFinite(x) || !Number.isFinite(y)) {
      state.committed = false;
      state.feedback = "Enter both coordinates before committing your estimate.";
      return;
    }

    state.committed = true;
    const errorX = x - candidate.x;
    const errorY = y - candidate.y;
    if (Math.hypot(errorX, errorY) <= 0.16) {
      state.feedbackTone = "success";
      state.feedback = "Excellent estimate — your point is within 0.16 map units of the selected intersection.";
    } else if (Math.abs(errorX) <= 0.18 && Math.sign(y) !== Math.sign(candidate.y) && Math.abs(candidate.y) > EPSILON) {
      state.feedback = `Your x-value is close, but the sign of y points to the ${candidate.key === "upper" ? "lower" : "upper"} intersection.`;
    } else if (Math.abs(errorX) > Math.abs(errorY)) {
      state.feedback = "Focus on x first: subtract the two circle equations so the y² terms cancel.";
    } else {
      state.feedback = "Your x-value is the better part. Substitute it into x² + y² = rA² and choose the sign for the selected candidate.";
    }
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p113-book-shell");
    if (!root) return;

    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control || !root.contains(control)) return;
      const action = control.dataset.problemAction;
      let rerender = true;

      if (action === "p113-reset") state = initialState();
      else if (action === "p113-preset") {
        const preset = presets.find((item) => item.key === control.dataset.p113Preset);
        if (preset) {
          state.rA = preset.rA;
          state.rB = preset.rB;
          state.selectedCandidate = "upper";
          clearEstimateResult();
          ensureCandidateSelection(intersectionData());
        }
      } else if (action === "p113-adjust-radius") {
        const which = control.dataset.p113Radius;
        const current = which === "a" ? state.rA : state.rB;
        setRadius(which, current + Number(control.dataset.p113Delta));
      } else if (action === "p113-select-candidate") {
        state.selectedCandidate = control.dataset.p113Candidate;
        clearEstimateResult();
      } else if (action === "p113-hint") {
        state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      } else if (action === "p113-reveal") {
        state.revealed = true;
      } else {
        rerender = false;
      }

      if (rerender) {
        renderApp();
        if (action === "p113-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p113-solution-heading")?.focus());
        }
      }
    });

    const estimateForm = root.querySelector("[data-p113-estimate-form]");
    const estimateX = root.querySelector("[data-p113-estimate-x]");
    const estimateY = root.querySelector("[data-p113-estimate-y]");
    estimateX?.addEventListener("input", (event) => {
      state.estimateX = event.target.value;
      state.committed = false;
      state.feedback = "";
      state.feedbackTone = "";
    });
    estimateY?.addEventListener("input", (event) => {
      state.estimateY = event.target.value;
      state.committed = false;
      state.feedback = "";
      state.feedbackTone = "";
    });
    estimateForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.estimateX = estimateX?.value ?? "";
      state.estimateY = estimateY?.value ?? "";
      evaluateEstimate();
      renderApp();
    });

    bindRadiusHandles(root, renderApp);
  }

  window.poveyProblemPages["1.13"] = { render, bind };
}());
