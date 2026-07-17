(function registerInsideOutCarpetPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "23.3";
  const CHALLENGE_MATRIX = Object.freeze([Object.freeze([1, 3]), Object.freeze([2, 1])]);
  const SOURCE_TRIANGLE = Object.freeze([
    Object.freeze({ name: "O", x: 0, y: 0 }),
    Object.freeze({ name: "P", x: 3, y: 0 }),
    Object.freeze({ name: "Q", x: 0, y: 4 }),
  ]);
  const SINGULAR_INTERPOLATION = 1 / Math.sqrt(6);
  const GRID_MINIMUM = -8;
  const GRID_MAXIMUM = 8;
  const SOURCE_VIEW = Object.freeze({ originX: 155, originY: 218, scale: 11.5 });
  const IMAGE_VIEW = Object.freeze({ originX: 550, originY: 218, scale: 11.5 });
  const ORIGINAL_AREA = 6;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Orient", title: "Give the source triangle an orientation", copy: "The labelled order O→P→Q runs counter-clockwise and gives signed area +6. Ordinary area forgets the sign, but the sign lets us track whether the transformation turns the carpet inside out." }),
    Object.freeze({ short: "Warp", title: "Interpolate from the identity to the challenge matrix", copy: "As t moves from 0 to 1, A(t)=[[1,3t],[2t,1]]. At t=1/√6 its determinant is zero: the warped grid and triangle flatten onto one line." }),
    Object.freeze({ short: "Read det", title: "Separate area factor from orientation", copy: "Signed area is multiplied by det A. Ordinary area is multiplied by |det A|. A negative determinant therefore reverses orientation without making ordinary area negative." }),
  ]);
  const hints = Object.freeze([
    "For a 2×2 matrix [[a,b],[c,d]], compute det A=ad−bc.",
    "Here det A=1·1−3·2.",
    "The determinant is −5, so its magnitude is 5.",
    "Ordinary area is scaled by |det A|: 6×5.",
    "The negative sign records an orientation reversal; it does not make the ordinary area negative.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p233-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(Number(value)) < 1e-10 ? 0 : Number(value); }
  function format(value, digits = 3) {
    if (!Number.isFinite(Number(value))) return "—";
    const rounded = cleanZero(Number(Number(value).toFixed(digits)));
    return String(rounded);
  }
  function signed(value, digits = 3) { return `${Number(value) >= 0 ? "+" : ""}${format(value, digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function matrixAt(interpolation) {
    const t = clamp(interpolation, 0, 1);
    return [[1, 3 * t], [2 * t, 1]];
  }
  function determinant(matrix) { return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]; }
  function mapPoint(matrix, point) {
    return { name: point.name, x: matrix[0][0] * point.x + matrix[0][1] * point.y, y: matrix[1][0] * point.x + matrix[1][1] * point.y };
  }
  function signedTriangleArea(vertices) {
    const [first, second, third] = vertices;
    return .5 * ((second.x - first.x) * (third.y - first.y) - (second.y - first.y) * (third.x - first.x));
  }
  function orientationOf(signedArea) {
    if (Math.abs(signedArea) < 1e-8) return "flattened";
    return signedArea > 0 ? "counter-clockwise" : "clockwise";
  }
  function transformData(interpolation) {
    const t = clamp(interpolation, 0, 1);
    const matrix = matrixAt(t);
    const det = cleanZero(determinant(matrix));
    const transformedVertices = SOURCE_TRIANGLE.map((point) => mapPoint(matrix, point));
    const signedArea = cleanZero(signedTriangleArea(transformedVertices));
    const area = Math.abs(signedArea);
    return {
      interpolation: t,
      matrix,
      determinant: det,
      determinantFormula: cleanZero(1 - 6 * t * t),
      transformedVertices,
      signedArea,
      area,
      areaFactor: Math.abs(det),
      orientation: orientationOf(signedArea),
      orientationReversed: det < 0,
      singular: Math.abs(det) < 1e-8,
      signedAreaLawResidual: cleanZero(signedArea - ORIGINAL_AREA * det),
      ordinaryAreaLawResidual: cleanZero(area - ORIGINAL_AREA * Math.abs(det)),
    };
  }

  const challenge = Object.freeze(transformData(1));

  function initialState() {
    return {
      interpolation: 1,
      stage: 0,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Challenge loaded: follow O→P→Q through A. The determinant meter tracks the signed area scaling.",
    };
  }
  let state = initialState();
  function currentData() { return transformData(state.interpolation); }
  function interpolationLabel(value) {
    return Math.abs(value - SINGULAR_INTERPOLATION) < 1e-10 ? "1/√6 ≈ 0.4082" : format(value, 3);
  }
  function setInterpolation(value, message) {
    state.interpolation = clamp(value, 0, 1);
    const data = currentData();
    state.boardMessage = message || `A(t) has determinant ${signed(data.determinant, 4)}; area is ${format(data.area, 4)} and orientation is ${data.orientation}.`;
  }
  function restoreChallenge(message) {
    setInterpolation(1, message || "Restored the fixed challenge A=[[1,3],[2,1]]: determinant −5, area 30, clockwise orientation.");
  }

  function stageControlsMarkup() {
    return `<div class="p233-stage-controls" role="group" aria-label="Determinant reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p233-stage" data-p233-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p233-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p233-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Determinant decoded" : "Next stage"}</button></div>`;
  }

  function sourceX(x) { return SOURCE_VIEW.originX + x * SOURCE_VIEW.scale; }
  function sourceY(y) { return SOURCE_VIEW.originY - y * SOURCE_VIEW.scale; }
  function imageX(x) { return IMAGE_VIEW.originX + x * IMAGE_VIEW.scale; }
  function imageY(y) { return IMAGE_VIEW.originY - y * IMAGE_VIEW.scale; }
  function polygonPoints(vertices, mapX, mapY) { return vertices.map((point) => `${format(mapX(point.x), 3)},${format(mapY(point.y), 3)}`).join(" "); }
  function determinantMeterY(det) { return 215 + (1 - clamp(det, -5, 1)) * 80 / 6; }

  function sourceGridMarkup() {
    let markup = "";
    for (let value = GRID_MINIMUM; value <= GRID_MAXIMUM; value += 1) {
      const axisClass = value === 0 ? " is-axis" : "";
      markup += `<line class="${axisClass}" x1="${sourceX(value)}" y1="${sourceY(GRID_MAXIMUM)}" x2="${sourceX(value)}" y2="${sourceY(GRID_MINIMUM)}"/><line class="${axisClass}" x1="${sourceX(GRID_MINIMUM)}" y1="${sourceY(value)}" x2="${sourceX(GRID_MAXIMUM)}" y2="${sourceY(value)}"/>`;
      if (value && value % 4 === 0) markup += `<text x="${sourceX(value)}" y="${sourceY(0) + 13}" text-anchor="middle">${value}</text><text x="${sourceX(0) - 7}" y="${sourceY(value) + 3}" text-anchor="end">${value}</text>`;
    }
    return markup;
  }
  function transformedGridMarkup(matrix) {
    let markup = "";
    for (let value = GRID_MINIMUM; value <= GRID_MAXIMUM; value += 1) {
      const verticalStart = mapPoint(matrix, { x: value, y: GRID_MINIMUM });
      const verticalEnd = mapPoint(matrix, { x: value, y: GRID_MAXIMUM });
      const horizontalStart = mapPoint(matrix, { x: GRID_MINIMUM, y: value });
      const horizontalEnd = mapPoint(matrix, { x: GRID_MAXIMUM, y: value });
      const axisClass = value === 0 ? " is-axis" : "";
      markup += `<line class="p233-grid-one${axisClass}" x1="${format(imageX(verticalStart.x), 3)}" y1="${format(imageY(verticalStart.y), 3)}" x2="${format(imageX(verticalEnd.x), 3)}" y2="${format(imageY(verticalEnd.y), 3)}"/><line class="p233-grid-two${axisClass}" x1="${format(imageX(horizontalStart.x), 3)}" y1="${format(imageY(horizontalStart.y), 3)}" x2="${format(imageX(horizontalEnd.x), 3)}" y2="${format(imageY(horizontalEnd.y), 3)}"/>`;
    }
    return markup;
  }
  function vertexLabels(vertices, mapX, mapY, className) {
    return vertices.map((point, index) => `<circle class="${className}-vertex" cx="${format(mapX(point.x), 3)}" cy="${format(mapY(point.y), 3)}" r="4"/><text class="p233-vertex-label" x="${format(mapX(point.x) + (index === 0 ? -8 : 7), 3)}" y="${format(mapY(point.y) + (index === 2 ? -7 : 13), 3)}" text-anchor="${index === 0 ? "end" : "start"}">${point.name}</text>`).join("");
  }

  function carpetSvg() {
    const data = currentData();
    const showWarp = state.stage >= 1 || state.revealed;
    const showRule = state.stage >= 2 || state.revealed;
    const sourcePoints = polygonPoints(SOURCE_TRIANGLE, sourceX, sourceY);
    const imagePoints = polygonPoints(data.transformedVertices, imageX, imageY);
    const sourceFirstEdgeEnd = SOURCE_TRIANGLE[1];
    const imageFirstEdgeEnd = data.transformedVertices[1];
    const indicatorY = determinantMeterY(data.determinant);
    const orientationSymbol = data.singular ? "—" : data.orientationReversed ? "↻" : "↺";
    const orientationLabel = data.singular ? "FLAT" : data.orientationReversed ? "CLOCKWISE" : "COUNTER-CLOCKWISE";
    const description = `The source triangle O, P, Q has counter-clockwise signed area plus 6. At interpolation ${format(data.interpolation, 5)}, the matrix has rows 1, ${format(data.matrix[0][1], 5)} and ${format(data.matrix[1][0], 5)}, 1. Its determinant is ${format(data.determinant, 7)}. The image triangle has signed area ${format(data.signedArea, 7)}, ordinary area ${format(data.area, 7)}, and is ${data.orientation}. ${data.singular ? "The transformed grid and triangle are flattened because the determinant is zero." : data.orientationReversed ? "The negative determinant reverses orientation." : "The positive determinant preserves orientation."}`;
    return `<svg class="p233-carpet p233-stage-${state.stage} ${data.singular ? "is-singular" : data.orientationReversed ? "is-reversed" : "is-preserved"}" viewBox="0 0 760 410" role="img" aria-labelledby="p233-svg-title p233-svg-desc">
      <title id="p233-svg-title">Linked source and transformed grids showing determinant, area and orientation</title>
      <desc id="p233-svg-desc">${description}</desc>
      <defs>
        <linearGradient id="p233-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#31283f"/></linearGradient>
        <marker id="p233-source-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker>
        <marker id="p233-image-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker>
        <clipPath id="p233-source-clip"><rect x="36" y="75" width="278" height="260" rx="9"/></clipPath>
        <clipPath id="p233-image-clip"><rect x="436" y="75" width="298" height="260" rx="9"/></clipPath>
      </defs>
      <rect class="p233-board" x="1" y="1" width="758" height="408" rx="20"/>
      <text class="p233-board-kicker" x="22" y="27">SAME UNIT SCALE · FOLLOW O→P→Q · SIGNED AREA REMEMBERS ORIENTATION</text>
      <g class="p233-source-panel">
        <rect x="20" y="43" width="310" height="348" rx="15"/>
        <text class="p233-panel-title" x="38" y="66">SOURCE CARPET · AREA 6</text>
        <g class="p233-source-grid" clip-path="url(#p233-source-clip)">${sourceGridMarkup()}</g>
        <g clip-path="url(#p233-source-clip)"><polygon class="p233-source-triangle" points="${sourcePoints}"/><line class="p233-source-direction" x1="${sourceX(.45)}" y1="${sourceY(0)}" x2="${sourceX(sourceFirstEdgeEnd.x - .35)}" y2="${sourceY(sourceFirstEdgeEnd.y)}" marker-end="url(#p233-source-arrow)"/></g>
        ${vertexLabels(SOURCE_TRIANGLE, sourceX, sourceY, "p233-source")}
        <text class="p233-orientation-status is-source" x="38" y="362">↺ COUNTER-CLOCKWISE · SIGNED AREA +6</text>
        <text class="p233-panel-note" x="38" y="380">vertex order O→P→Q is carried through the map</text>
      </g>
      <g class="p233-map-gate">
        <path d="M340 104h80M401 94l19 10-19 10"/>
        <text class="p233-gate-label" x="380" y="88" text-anchor="middle">A(t)</text>
        <path class="p233-matrix-bracket" d="M352 130h-6v52h6M408 130h6v52h-6"/>
        <text class="p233-matrix-entry" x="365" y="151">1</text><text class="p233-matrix-entry" x="395" y="151">${format(data.matrix[0][1], 3)}</text>
        <text class="p233-matrix-entry" x="365" y="174">${format(data.matrix[1][0], 3)}</text><text class="p233-matrix-entry" x="395" y="174">1</text>
        <text class="p233-meter-title" x="380" y="201" text-anchor="middle">SIGNED det</text>
        <line class="p233-meter-track" x1="380" y1="215" x2="380" y2="295"/>
        <line class="p233-meter-zero" x1="365" y1="${determinantMeterY(0)}" x2="395" y2="${determinantMeterY(0)}"/>
        <text class="p233-meter-tick" x="358" y="219" text-anchor="end">+1</text><text class="p233-meter-tick" x="358" y="${determinantMeterY(0) + 3}" text-anchor="end">0</text><text class="p233-meter-tick" x="358" y="299" text-anchor="end">−5</text>
        <circle class="p233-meter-indicator" cx="380" cy="${format(indicatorY, 3)}" r="7"/>
        <text class="p233-meter-value" x="380" y="318" text-anchor="middle">det=${signed(data.determinant, 4)}</text>
        <text class="p233-meter-area" x="380" y="333" text-anchor="middle">signed area=${signed(data.signedArea, 4)}</text>
        <text class="p233-meter-orientation" x="380" y="355" text-anchor="middle">${orientationSymbol}</text>
        <text class="p233-meter-status" x="380" y="373" text-anchor="middle">${orientationLabel}</text>
      </g>
      <g class="p233-image-panel">
        <rect x="430" y="43" width="310" height="348" rx="15"/>
        <text class="p233-panel-title" x="448" y="66">TRANSFORMED CARPET · AREA ${format(data.area, 4)}</text>
        <g class="p233-fixed-reference" clip-path="url(#p233-image-clip)"><line x1="436" y1="${imageY(0)}" x2="734" y2="${imageY(0)}"/><line x1="${imageX(0)}" y1="75" x2="${imageX(0)}" y2="335"/></g>
        <g class="p233-warp-grid ${showWarp ? "is-visible" : ""}" clip-path="url(#p233-image-clip)">${transformedGridMarkup(data.matrix)}</g>
        <g clip-path="url(#p233-image-clip)"><polygon class="p233-image-triangle" points="${imagePoints}"/><line class="p233-image-direction" x1="${format(imageX(imageFirstEdgeEnd.x * .15), 3)}" y1="${format(imageY(imageFirstEdgeEnd.y * .15), 3)}" x2="${format(imageX(imageFirstEdgeEnd.x * .85), 3)}" y2="${format(imageY(imageFirstEdgeEnd.y * .85), 3)}" marker-end="url(#p233-image-arrow)"/></g>
        ${vertexLabels(data.transformedVertices, imageX, imageY, "p233-image")}
        <g class="p233-determinant-rule ${showRule ? "is-visible" : ""}"><text x="448" y="352">signed area = 6·det = ${signed(data.signedArea, 4)}</text><text class="p233-ordinary-area" x="448" y="375">ordinary area = 6·|det| = ${format(data.area, 4)}</text></g>
      </g>
    </svg>`;
  }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p233-controls" aria-label="Transformation interpolation control"><label for="p233-interpolation"><span>Interpolate I → A <output data-p233-output="interpolation">t=${interpolationLabel(state.interpolation)}</output></span><input id="p233-interpolation" data-p233-interpolation type="range" min="0" max="1" step="0.001" value="${state.interpolation}" aria-valuetext="interpolation ${format(state.interpolation, 5)}; determinant ${format(data.determinant, 6)}; image area ${format(data.area, 6)}; orientation ${data.orientation}"/></label><div class="p233-presets"><button class="secondary-button" type="button" data-problem-action="p233-preset" data-p233-t="0">Identity · det +1</button><button class="secondary-button" type="button" data-problem-action="p233-singular">Flatten · det 0</button><button class="primary-button" type="button" data-problem-action="p233-preset" data-p233-t="1">Challenge A · det −5</button></div><p data-p233-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const data = currentData();
    return `<section class="p233-metrics" aria-live="polite"><article><span>Signed determinant</span><strong>${signed(data.determinant, 5)}</strong><small>${data.singular ? "singular: dimension collapses" : data.determinant < 0 ? "negative: orientation reverses" : "positive: orientation preserved"}</small></article><article><span>Ordinary area factor</span><strong>|det|=${format(data.areaFactor, 5)}</strong><small>area ${ORIGINAL_AREA} → ${format(data.area, 5)}</small></article><article><span>Image orientation</span><strong>${data.singular ? "flattened" : data.orientation}</strong><small>${data.singular ? "no two-dimensional orientation" : `O→P→Q has signed area ${signed(data.signedArea, 5)}`}</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p233-distinction"><strong>Magnitude and sign answer different questions.</strong><span>|det A| is the area multiplier. The sign of det A records orientation: positive preserves it, negative reverses it, and zero flattens every two-dimensional area to a line.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p233-dynamic">${carpetSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p233-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p233-solution" aria-labelledby="p233-solution-heading"><h3 id="p233-solution-heading">The determinant has a magnitude and a sign</h3><p>For the fixed challenge,</p><div class="p233-equation">det A=1·1−3·2=−5.</div><p>The magnitude gives the ordinary area factor:</p><div class="p233-equation is-answer">image area=|det A|·6<br>=5·6=<strong>30.</strong></div><p>The negative sign has not produced “negative area”. Instead it says the labelled order O→P→Q has changed from counter-clockwise to clockwise: the carpet has turned inside out. In signed-area language the image has signed area −30; its ordinary area is 30.</p><p>At det A=0, the multiplier is zero and the triangle flattens to a line. Such a singular map is not invertible because two-dimensional information has been lost.</p></section>`;
  }

  function snapshot() {
    const data = currentData();
    const singular = transformData(SINGULAR_INTERPOLATION);
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      sourceTriangle: { vertices: SOURCE_TRIANGLE, signedArea: signedTriangleArea(SOURCE_TRIANGLE), ordinaryArea: ORIGINAL_AREA, orientation: orientationOf(ORIGINAL_AREA) },
      interpolation: { t: state.interpolation, path: "A(t)=I+t(A-I)=[[1,3t],[2t,1]]", matrix: data.matrix },
      current: { determinant: data.determinant, determinantFormula: data.determinantFormula, transformedVertices: data.transformedVertices, signedArea: data.signedArea, ordinaryArea: data.area, ordinaryAreaFactor: data.areaFactor, orientation: data.orientation, orientationReversed: data.orientationReversed, singular: data.singular, signedAreaLawResidual: data.signedAreaLawResidual, ordinaryAreaLawResidual: data.ordinaryAreaLawResidual },
      singularCheckpoint: { interpolation: SINGULAR_INTERPOLATION, matrix: singular.matrix, determinant: singular.determinant, transformedVertices: singular.transformedVertices, signedArea: singular.signedArea, ordinaryArea: singular.area, orientation: singular.orientation },
      challenge: { matrix: CHALLENGE_MATRIX, determinant: challenge.determinant, transformedVertices: challenge.transformedVertices, signedArea: challenge.signedArea, ordinaryArea: challenge.area, areaFactor: challenge.areaFactor, orientation: challenge.orientation, orientationReversed: challenge.orientationReversed },
      teachingDistinction: { magnitude: "absolute determinant is the ordinary-area factor", sign: "determinant sign records orientation", zero: "singular map flattens two-dimensional area" },
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p233-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Linear Algebra and Transformations</strong><span class="eyebrow">Chapter 23 · determinants</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p233-spread"><article class="book-page p233-problem-page"><div class="problem-number">Problem 23.3</div><h1 class="book-title p233-title">The Carpet That Turns Inside Out</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p233-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">The matrix</p><div class="p233-problem-matrix" aria-label="matrix A equals first row 1, 3 and second row 2, 1"><span>A=</span><div><span>1</span><span>3</span><span>2</span><span>1</span></div></div><p class="problem-copy">maps a triangle of area 6. <strong>What is the area of its image?</strong></p><section class="p233-question-card"><strong>Area is non-negative; orientation is signed</strong><p>Use |det A| for ordinary area. Keep the sign of det A separately to decide whether the labelled triangle turns over.</p></section></article><section class="book-page book-stage p233-stage" aria-labelledby="p233-stage-heading">${stageControlsMarkup()}<div class="p233-stage-heading"><div><span class="eyebrow">Determinant laboratory</span><h2 id="p233-stage-heading">Warp one carpet through the singular boundary</h2></div><p>The two grids use the same unit scale. Interpolate from the identity to A and watch area and orientation change together.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p233-coach"><div class="coach-kicker">Scale the fixed triangle</div><p class="coach-question">Enter the ordinary image area for A=[[1,3],[2,1]].</p><form class="p233-answer-form" data-p233-answer-form novalidate><label for="p233-answer">Image area</label><input id="p233-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="area"/><button class="primary-button" type="submit">Check area</button></form>${feedbackMarkup()}<div class="button-row p233-help-row"><button class="secondary-button" type="button" data-problem-action="p233-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p233-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p233-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) return `[data-problem-action="${active.dataset.problemAction}"]`;
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p233-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p233-dynamic");
    const selector = dynamic?.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (selector) {
      const replacement = root.querySelector(selector);
      if (replacement) {
        try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); }
      }
    }
  }
  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p233-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p233-reset") { state = initialState(); renderAndFocus(renderApp, "#p233-interpolation"); return; }
      if (action === "p233-stage") { state.stage = clamp(Math.round(Number(control.dataset.p233Stage)), 0, 2); renderAndFocus(renderApp, `[data-p233-stage="${state.stage}"]`); return; }
      if (action === "p233-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p233-stage="${state.stage}"]`); return; }
      if (action === "p233-preset") { setInterpolation(Number(control.dataset.p233T)); updateDynamicDom(); return; }
      if (action === "p233-singular") { setInterpolation(SINGULAR_INTERPOLATION, "Singular checkpoint: det A(t)=0, so the carpet and transformed grid flatten onto one line."); updateDynamicDom(); return; }
      if (action === "p233-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p233-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p233-interpolation")) { setInterpolation(Number(event.target.value)); updateDynamicDom(); return; }
      if (event.target.matches("#p233-answer")) { state.answer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
    });
    root.querySelector("[data-p233-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p233-answer")?.value || "";
      const answer = parseNumber(raw);
      state.answer = raw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a numerical area.";
      else if (Math.abs(answer + 30) <= .001) state.feedback = "−30 is the signed image area. Ordinary area is its non-negative magnitude.";
      else if (Math.abs(answer + 5) <= .001) state.feedback = "−5 is the determinant. Use its magnitude as the area factor, then multiply the original area 6.";
      else if (Math.abs(answer - 5) <= .001) state.feedback = "5 is the area factor |det A|. Apply that factor to the original area 6.";
      else if (Math.abs(answer - 6) <= .001) state.feedback = "The area is unchanged only when |det A|=1. Here |det A|=5.";
      else if (Math.abs(answer - 30) > .001) state.feedback = "Compute det A=ad−bc, take its magnitude, and multiply the original area by that factor.";
      else { state.feedbackTone = "success"; state.feedback = "Correct: det A=−5, so the ordinary area is 6|−5|=30 and orientation reverses."; state.committed = true; state.revealed = true; state.stage = 2; restoreChallenge("Correct answer committed; restored A with determinant −5, image area 30 and reversed orientation."); }
      renderAndFocus(renderApp, "#p233-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
