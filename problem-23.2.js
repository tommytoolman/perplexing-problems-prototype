(function registerMatrixGatePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "23.2";
  const MATRIX = Object.freeze([[2, 1], [-1, 1]]);
  const CHALLENGE = Object.freeze({ x: 3, y: -2 });
  const SOURCE = Object.freeze({ minimum: -4, maximum: 4, originX: 175, originY: 196, scale: 28 });
  const IMAGE = Object.freeze({ minimumX: -12, maximumX: 12, minimumY: -8, maximumY: 8, originX: 585, originY: 196, scale: 10.5 });
  const LOGO_OFFSETS = Object.freeze([[0, 0], [0, .9], [.85, .65], [0, .42]]);
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Act", title: "Let the matrix act on a geometric vector", copy: "The source and image axes stay fixed while A sends each point to a new point. That is an active transformation, not merely a new description of the same unchanged vector." }),
    Object.freeze({ short: "Build", title: "Read the columns as transformed basis vectors", copy: "A sends e₁ to (2,−1) and e₂ to (1,1). Since P=xe₁+ye₂, linearity forces AP=xAe₁+yAe₂." }),
    Object.freeze({ short: "Map all", title: "Transform every vertex of the logo", copy: "The same rule acts on the whole labelled logo, vertex by vertex. Straight edges remain straight because A preserves vector addition and scalar multiplication." }),
  ]);
  const hints = Object.freeze([
    "Treat P as a column vector and multiply each matrix row by it.",
    "The first output coordinate is 2(3)+1(−2).",
    "The second output coordinate is −1(3)+1(−2).",
    "Equivalently, use the columns: 3(2,−1)−2(1,1).",
    "That gives (6,−3)+(−2,−2)=(4,−5).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p232-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function snapQuarter(value) { return Math.round(Number(value) * 4) / 4; }
  function gcd(first, second) { let a = Math.abs(first), b = Math.abs(second); while (b) [a, b] = [b, a % b]; return a || 1; }
  function exact(value) {
    const quarters = Math.round(Number(value) * 4), divisor = gcd(quarters, 4), numerator = quarters / divisor, denominator = 4 / divisor;
    if (denominator === 1) return String(numerator).replace("-", "−");
    return `${numerator < 0 ? "−" : ""}${Math.abs(numerator)}/${denominator}`;
  }
  function decimal(value, digits = 2) { const rounded = Number(Number(value).toFixed(digits)); return Object.is(rounded, -0) ? "0" : String(rounded); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }
  function mapVector(vector) { return { x: MATRIX[0][0] * vector.x + MATRIX[0][1] * vector.y, y: MATRIX[1][0] * vector.x + MATRIX[1][1] * vector.y }; }
  function addVectors(first, second) { return { x: first.x + second.x, y: first.y + second.y }; }
  function scaleVector(scale, vector) { return { x: scale * vector.x, y: scale * vector.y }; }
  function sourceX(x) { return SOURCE.originX + x * SOURCE.scale; }
  function sourceY(y) { return SOURCE.originY - y * SOURCE.scale; }
  function imageX(x) { return IMAGE.originX + x * IMAGE.scale; }
  function imageY(y) { return IMAGE.originY - y * IMAGE.scale; }
  function coordinatePair(vector) { return `(${exact(vector.x)}, ${exact(vector.y)})`; }
  function logoVertices(anchor) { return LOGO_OFFSETS.map(([x, y]) => ({ x: anchor.x + x, y: anchor.y + y })); }
  function polygonPoints(vertices, mapX, mapY) { return vertices.map((vertex) => `${decimal(mapX(vertex.x), 3)},${decimal(mapY(vertex.y), 3)}`).join(" "); }

  const BASIS_ONE = Object.freeze({ x: 1, y: 0 });
  const BASIS_TWO = Object.freeze({ x: 0, y: 1 });
  const IMAGE_BASIS_ONE = Object.freeze(mapVector(BASIS_ONE));
  const IMAGE_BASIS_TWO = Object.freeze(mapVector(BASIS_TWO));
  const CHALLENGE_IMAGE = Object.freeze(mapVector(CHALLENGE));

  function initialState() {
    return {
      x: CHALLENGE.x,
      y: CHALLENGE.y,
      stage: 0,
      xAnswer: "",
      yAnswer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Challenge loaded: drag P on the source grid, or use the coordinate sliders. The image point follows A immediately.",
    };
  }
  let state = initialState();
  let activePointerId = null;

  function currentVector() { return { x: state.x, y: state.y }; }
  function currentImage() { return mapVector(currentVector()); }
  function setVector(x, y, message) {
    state.x = clamp(snapQuarter(x), SOURCE.minimum, SOURCE.maximum);
    state.y = clamp(snapQuarter(y), SOURCE.minimum, SOURCE.maximum);
    const image = currentImage();
    state.boardMessage = message || `P=${coordinatePair(currentVector())} maps to AP=${coordinatePair(image)}. Each output coordinate is exact on the quarter-unit grid.`;
  }
  function restoreChallenge(message) { setVector(CHALLENGE.x, CHALLENGE.y, message || "Restored P=(3, −2), whose image is AP=(4, −5)."); }

  function stageControlsMarkup() {
    return `<div class="p232-stage-controls" role="group" aria-label="Matrix transformation stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p232-stage" data-p232-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p232-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p232-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Whole logo mapped" : "Next stage"}</button></div>`;
  }

  function sourceGridMarkup() {
    let markup = "";
    for (let value = SOURCE.minimum; value <= SOURCE.maximum; value += 1) {
      markup += `<line x1="${sourceX(value)}" y1="${sourceY(SOURCE.maximum)}" x2="${sourceX(value)}" y2="${sourceY(SOURCE.minimum)}"/><line x1="${sourceX(SOURCE.minimum)}" y1="${sourceY(value)}" x2="${sourceX(SOURCE.maximum)}" y2="${sourceY(value)}"/>`;
      if (value !== 0) markup += `<text x="${sourceX(value)}" y="${sourceY(0) + 13}" text-anchor="middle">${value}</text><text x="${sourceX(0) - 8}" y="${sourceY(value) + 3}" text-anchor="end">${value}</text>`;
    }
    return markup;
  }
  function imageGridMarkup() {
    let markup = "";
    for (let value = IMAGE.minimumX; value <= IMAGE.maximumX; value += 2) {
      markup += `<line x1="${imageX(value)}" y1="${imageY(IMAGE.maximumY)}" x2="${imageX(value)}" y2="${imageY(IMAGE.minimumY)}"/>`;
      if (value !== 0 && value % 4 === 0) markup += `<text x="${imageX(value)}" y="${imageY(0) + 13}" text-anchor="middle">${value}</text>`;
    }
    for (let value = IMAGE.minimumY; value <= IMAGE.maximumY; value += 2) {
      markup += `<line x1="${imageX(IMAGE.minimumX)}" y1="${imageY(value)}" x2="${imageX(IMAGE.maximumX)}" y2="${imageY(value)}"/>`;
      if (value !== 0 && value % 4 === 0) markup += `<text x="${imageX(0) - 8}" y="${imageY(value) + 3}" text-anchor="end">${value}</text>`;
    }
    return markup;
  }

  function matrixSvg() {
    const vector = currentVector(), image = currentImage();
    const sourceLogo = logoVertices(vector), imageLogo = sourceLogo.map(mapVector);
    const xColumn = scaleVector(vector.x, IMAGE_BASIS_ONE), yColumn = scaleVector(vector.y, IMAGE_BASIS_TWO);
    const showBasis = state.stage >= 1 || state.revealed, showLogo = state.stage >= 2 || state.revealed;
    const description = `On the fixed source grid, P is ${coordinatePair(vector)}. The matrix with rows 2, 1 and minus 1, 1 actively maps it to AP=${coordinatePair(image)} on the fixed image grid. The first basis vector maps to (2, minus 1), and the second maps to (1, 1). The decomposition is ${exact(vector.x)} times (2, minus 1) plus ${exact(vector.y)} times (1, 1). A small pennant-shaped logo anchored at P is transformed vertex by vertex.`;
    return `<svg class="p232-gate p232-stage-${state.stage}" viewBox="0 0 760 420" role="img" aria-labelledby="p232-svg-title p232-svg-desc"><title id="p232-svg-title">Linked source and image coordinate grids under a two by two matrix</title><desc id="p232-svg-desc">${description}</desc><defs><linearGradient id="p232-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3a"/><stop offset="1" stop-color="#30283e"/></linearGradient><marker id="p232-arrow-main" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p232-arrow-one" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p232-arrow-two" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><clipPath id="p232-source-clip"><rect x="55" y="76" width="240" height="240" rx="8"/></clipPath><clipPath id="p232-image-clip"><rect x="451" y="101" width="268" height="190" rx="8"/></clipPath></defs><rect class="p232-board" x="1" y="1" width="758" height="418" rx="20"/><text class="p232-board-kicker" x="22" y="27">ACTIVE VECTOR MAP · FIXED AXES · DRAG THE SOURCE POINT</text><g class="p232-source-panel"><rect x="20" y="43" width="310" height="358" rx="15"/><text class="p232-panel-title" x="38" y="67">SOURCE SPACE</text><g class="p232-grid">${sourceGridMarkup()}</g><line class="p232-axis" x1="${sourceX(SOURCE.minimum)}" y1="${sourceY(0)}" x2="${sourceX(SOURCE.maximum)}" y2="${sourceY(0)}"/><line class="p232-axis" x1="${sourceX(0)}" y1="${sourceY(SOURCE.minimum)}" x2="${sourceX(0)}" y2="${sourceY(SOURCE.maximum)}"/><g class="p232-basis ${showBasis ? "is-visible" : ""}"><line class="is-one" x1="${sourceX(0)}" y1="${sourceY(0)}" x2="${sourceX(1)}" y2="${sourceY(0)}" marker-end="url(#p232-arrow-one)"/><text class="is-one" x="${sourceX(1) + 8}" y="${sourceY(0) + 4}">e₁</text><line class="is-two" x1="${sourceX(0)}" y1="${sourceY(0)}" x2="${sourceX(0)}" y2="${sourceY(1)}" marker-end="url(#p232-arrow-two)"/><text class="is-two" x="${sourceX(0) + 7}" y="${sourceY(1) - 6}">e₂</text><line class="p232-component is-one" x1="${sourceX(0)}" y1="${sourceY(0)}" x2="${sourceX(vector.x)}" y2="${sourceY(0)}" marker-end="url(#p232-arrow-one)"/><line class="p232-component is-two" x1="${sourceX(vector.x)}" y1="${sourceY(0)}" x2="${sourceX(vector.x)}" y2="${sourceY(vector.y)}" marker-end="url(#p232-arrow-two)"/></g><g clip-path="url(#p232-source-clip)"><line class="p232-vector" x1="${sourceX(0)}" y1="${sourceY(0)}" x2="${sourceX(vector.x)}" y2="${sourceY(vector.y)}" marker-end="url(#p232-arrow-main)"/><polygon class="p232-logo-source ${showLogo ? "is-full" : ""}" points="${polygonPoints(sourceLogo, sourceX, sourceY)}" data-p232-drag/><circle class="p232-source-point" cx="${sourceX(vector.x)}" cy="${sourceY(vector.y)}" r="6"/><circle class="p232-drag-hit" cx="${sourceX(vector.x)}" cy="${sourceY(vector.y)}" r="18" data-p232-drag/></g><text class="p232-point-label" x="${clamp(sourceX(vector.x) + 12, 68, 272)}" y="${clamp(sourceY(vector.y) - 12, 92, 298)}">P=${coordinatePair(vector)}</text><text class="p232-logo-label" x="${clamp(sourceX(vector.x) + 8, 68, 282)}" y="${clamp(sourceY(vector.y) - 31, 91, 296)}">logo</text><text class="p232-decomposition ${showBasis ? "is-visible" : ""}" x="38" y="350">P=${exact(vector.x)}e₁ ${vector.y >= 0 ? "+" : "−"} ${exact(Math.abs(vector.y))}e₂</text><text class="p232-panel-note" x="38" y="379">drag P · sliders below give keyboard control</text></g><g class="p232-gate-symbol"><path d="M345 152h67M394 141l18 11-18 11"/><text x="378" y="128" text-anchor="middle">A</text><rect x="342" y="180" width="72" height="79" rx="12"/><text class="p232-matrix-row" x="378" y="207" text-anchor="middle">2   1</text><text class="p232-matrix-row" x="378" y="231" text-anchor="middle">−1  1</text><text class="p232-matrix-label" x="378" y="278" text-anchor="middle">active map</text></g><g class="p232-image-panel"><rect x="430" y="43" width="310" height="358" rx="15"/><text class="p232-panel-title" x="448" y="67">IMAGE SPACE</text><g class="p232-grid">${imageGridMarkup()}</g><line class="p232-axis" x1="${imageX(IMAGE.minimumX)}" y1="${imageY(0)}" x2="${imageX(IMAGE.maximumX)}" y2="${imageY(0)}"/><line class="p232-axis" x1="${imageX(0)}" y1="${imageY(IMAGE.minimumY)}" x2="${imageX(0)}" y2="${imageY(IMAGE.maximumY)}"/><g class="p232-basis p232-image-basis ${showBasis ? "is-visible" : ""}"><line class="is-one" x1="${imageX(0)}" y1="${imageY(0)}" x2="${imageX(IMAGE_BASIS_ONE.x)}" y2="${imageY(IMAGE_BASIS_ONE.y)}" marker-end="url(#p232-arrow-one)"/><text class="is-one" x="${imageX(IMAGE_BASIS_ONE.x) + 7}" y="${imageY(IMAGE_BASIS_ONE.y) + 3}">Ae₁=(2,−1)</text><line class="is-two" x1="${imageX(0)}" y1="${imageY(0)}" x2="${imageX(IMAGE_BASIS_TWO.x)}" y2="${imageY(IMAGE_BASIS_TWO.y)}" marker-end="url(#p232-arrow-two)"/><text class="is-two" x="${imageX(IMAGE_BASIS_TWO.x) + 7}" y="${imageY(IMAGE_BASIS_TWO.y) - 6}">Ae₂=(1,1)</text><line class="p232-component is-one" x1="${imageX(0)}" y1="${imageY(0)}" x2="${imageX(xColumn.x)}" y2="${imageY(xColumn.y)}" marker-end="url(#p232-arrow-one)"/><line class="p232-component is-two" x1="${imageX(xColumn.x)}" y1="${imageY(xColumn.y)}" x2="${imageX(image.x)}" y2="${imageY(image.y)}" marker-end="url(#p232-arrow-two)"/></g><g clip-path="url(#p232-image-clip)"><line class="p232-vector" x1="${imageX(0)}" y1="${imageY(0)}" x2="${imageX(image.x)}" y2="${imageY(image.y)}" marker-end="url(#p232-arrow-main)"/><polygon class="p232-logo-image ${showLogo ? "is-full" : ""}" points="${polygonPoints(imageLogo, imageX, imageY)}"/><circle class="p232-image-point" cx="${imageX(image.x)}" cy="${imageY(image.y)}" r="6"/></g><text class="p232-point-label" x="${clamp(imageX(image.x) + 12, 456, 686)}" y="${clamp(imageY(image.y) - 12, 111, 278)}">AP=${coordinatePair(image)}</text><g class="p232-exact-ledger"><text x="448" y="320">AP=${exact(vector.x)}(2,−1) ${vector.y >= 0 ? "+" : "−"} ${exact(Math.abs(vector.y))}(1,1)</text><text class="p232-exact-sum" x="448" y="343">=(${exact(2 * vector.x)}, ${exact(-vector.x)}) + (${exact(vector.y)}, ${exact(vector.y)})</text><text class="p232-exact-result" x="448" y="371">=${coordinatePair(image)}</text></g><text class="p232-panel-note" x="448" y="390">all source-grid points remain inside these image bounds</text></g></svg>`;
  }

  function controlsMarkup() {
    const vector = currentVector(), image = currentImage();
    return `<section class="p232-controls" aria-label="Source vector coordinates"><div class="p232-slider-grid"><label for="p232-x"><span>Source x <output>${exact(vector.x)}</output></span><input id="p232-x" type="range" min="-4" max="4" step="0.25" value="${vector.x}" aria-valuetext="Source x ${decimal(vector.x)}; image point ${decimal(image.x)}, ${decimal(image.y)}"/></label><label for="p232-y"><span>Source y <output>${exact(vector.y)}</output></span><input id="p232-y" type="range" min="-4" max="4" step="0.25" value="${vector.y}" aria-valuetext="Source y ${decimal(vector.y)}; image point ${decimal(image.x)}, ${decimal(image.y)}"/></label></div><div class="p232-control-actions"><button class="primary-button" type="button" data-problem-action="p232-preset" data-p232-x="3" data-p232-y="-2">Challenge P=(3,−2)</button><button class="secondary-button" type="button" data-problem-action="p232-preset" data-p232-x="1" data-p232-y="0">Basis e₁</button><button class="secondary-button" type="button" data-problem-action="p232-preset" data-p232-x="0" data-p232-y="1">Basis e₂</button></div><p data-p232-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const vector = currentVector(), image = currentImage();
    return `<section class="p232-metrics" aria-live="polite"><article><span>Source vector P</span><strong>${coordinatePair(vector)}</strong><small>coefficients of e₁,e₂</small></article><article><span>Image vector AP</span><strong>${coordinatePair(image)}</strong><small>(2x+y, −x+y)</small></article><article><span>Area scale det A</span><strong>3</strong><small>orientation preserved; map invertible</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p232-distinction"><strong>This is an active map, not a passive coordinate relabelling.</strong><span>The axes in each panel stay fixed while the point and logo move to new geometric locations. In a passive change of basis, the geometric vector stays put and only its coordinate description changes.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p232-dynamic">${matrixSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p232-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p232-solution" aria-labelledby="p232-solution-heading"><h3 id="p232-solution-heading" tabindex="-1">The columns tell you where the basis vectors go</h3><p>The two columns of A are the images of the standard basis:</p><div class="p232-equation">Ae₁=(2,−1), &nbsp; Ae₂=(1,1).</div><p>Since P=(3,−2)=3e₁−2e₂, linearity gives</p><div class="p232-equation">AP=3Ae₁−2Ae₂<br>=3(2,−1)−2(1,1)<br>=(6,−3)+(−2,−2).</div><div class="p232-equation is-answer"><strong>AP=(4,−5).</strong></div><p>Row multiplication says the same thing: (2·3+1·(−2), −1·3+1·(−2))=(4,−5). Mapping every logo vertex by this same rule transforms the whole logo. Because the axes remain fixed and the geometry moves, this is the active-map interpretation of A.</p></section>`;
  }

  function snapshot() {
    const vector = currentVector(), image = currentImage();
    const corners = [
      { x: SOURCE.minimum, y: SOURCE.minimum },
      { x: SOURCE.minimum, y: SOURCE.maximum },
      { x: SOURCE.maximum, y: SOURCE.minimum },
      { x: SOURCE.maximum, y: SOURCE.maximum },
    ].map((corner) => ({ source: corner, image: mapVector(corner) }));
    const u = { x: 1, y: -2 }, v = { x: 2, y: 1 };
    const mappedSum = mapVector(addVectors(u, v)), sumMapped = addVectors(mapVector(u), mapVector(v));
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      matrix: MATRIX,
      determinant: 3,
      interpretation: "active vector map on fixed source and image axes; not a passive coordinate relabelling",
      basisImages: { e1: IMAGE_BASIS_ONE, e2: IMAGE_BASIS_TWO },
      current: {
        source: vector,
        image,
        rowFormula: { first: 2 * vector.x + vector.y, second: -vector.x + vector.y },
        columnCombination: {
          xTimesAe1: scaleVector(vector.x, IMAGE_BASIS_ONE),
          yTimesAe2: scaleVector(vector.y, IMAGE_BASIS_TWO),
          sum: addVectors(scaleVector(vector.x, IMAGE_BASIS_ONE), scaleVector(vector.y, IMAGE_BASIS_TWO)),
        },
        sourceLogoVertices: logoVertices(vector),
        imageLogoVertices: logoVertices(vector).map(mapVector),
      },
      challenge: { source: CHALLENGE, image: CHALLENGE_IMAGE },
      linearityAudit: {
        u,
        v,
        mappedSum,
        sumMapped,
        residual: { x: mappedSum.x - sumMapped.x, y: mappedSum.y - sumMapped.y },
      },
      gridBounds: {
        source: { x: [SOURCE.minimum, SOURCE.maximum], y: [SOURCE.minimum, SOURCE.maximum] },
        image: { x: [IMAGE.minimumX, IMAGE.maximumX], y: [IMAGE.minimumY, IMAGE.maximumY] },
        transformedSourceCorners: corners,
        everyTransformedCornerInside: corners.every(({ image: corner }) => corner.x >= IMAGE.minimumX && corner.x <= IMAGE.maximumX && corner.y >= IMAGE.minimumY && corner.y <= IMAGE.maximumY),
      },
      stage: state.stage + 1,
      answers: { x: state.xAnswer || null, y: state.yAnswer || null },
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p232-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Linear Algebra and Transformations</strong><span class="eyebrow">Chapter 23 · linear maps</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p232-spread"><article class="book-page p232-problem-page"><div class="problem-number">Problem 23.2</div><h1 class="book-title p232-title">The Logo Through the Matrix Gate</h1><div class="difficulty" aria-label="Two star difficulty">★★</div><p class="p232-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">The matrix</p><div class="p232-given-matrix" aria-label="Matrix A with first row 2, 1 and second row minus 1, 1"><span>A=</span><div><span>2</span><span>1</span><span>−1</span><span>1</span></div></div><p class="problem-copy">acts on the column vector P=(3,−2). <strong>Find AP.</strong></p><section class="p232-question-card"><strong>A gate that moves geometry</strong><p>Read the matrix as a rule that sends vectors—and every vertex of a small logo—to new positions.</p></section></article><section class="book-page book-stage p232-stage" aria-labelledby="p232-stage-heading">${stageControlsMarkup()}<div class="p232-stage-heading"><div><span class="eyebrow">Matrix-gate laboratory</span><h2 id="p232-stage-heading">Move one point; watch its image follow</h2></div><p>Drag in source space or use the sliders, then decompose the same motion through the transformed basis vectors.</p></div><div class="p232-visual-card">${dynamicMarkup()}${stageCaptionMarkup()}</div></section><aside class="book-page book-coach p232-coach"><div class="coach-kicker">Send P through A</div><p class="coach-question">Enter both exact coordinates of AP for the fixed challenge P=(3,−2).</p><form class="p232-answer-form" data-p232-answer-form novalidate><label for="p232-answer-x">First coordinate<input id="p232-answer-x" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.xAnswer)}" placeholder="x-coordinate"/></label><label for="p232-answer-y">Second coordinate<input id="p232-answer-y" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.yAnswer)}" placeholder="y-coordinate"/></label><small>Integers, decimals and fractions are accepted.</small><button class="primary-button" type="submit">Check image</button></form>${feedbackMarkup()}<div class="button-row p232-help-row"><button class="secondary-button" type="button" data-problem-action="p232-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p232-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p232-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function focusSelector(active) {
    if (!active) return "";
    if (active.id) return `#${active.id}`;
    if (active.dataset?.problemAction) {
      const coordinates = active.dataset.p232X !== undefined ? `[data-p232-x="${active.dataset.p232X}"][data-p232-y="${active.dataset.p232Y}"]` : "";
      return `[data-problem-action="${active.dataset.problemAction}"]${coordinates}`;
    }
    return "";
  }
  function updateDynamicDom() {
    const root = document.querySelector(".p232-shell");
    if (!root) return;
    const dynamic = root.querySelector(".p232-dynamic");
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
  function pointerInSvg(event, svg) {
    if (typeof svg.createSVGPoint === "function" && svg.getScreenCTM()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse());
    }
    const bounds = svg.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / bounds.width * 760, y: (event.clientY - bounds.top) / bounds.height * 420 };
  }
  function setFromPointer(event, root) {
    const svg = root.querySelector(".p232-gate");
    if (!svg) return;
    const point = pointerInSvg(event, svg);
    setVector((point.x - SOURCE.originX) / SOURCE.scale, (SOURCE.originY - point.y) / SOURCE.scale);
    updateDynamicDom();
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p232-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p232-reset") { state = initialState(); renderAndFocus(renderApp, "#p232-x"); return; }
      if (action === "p232-stage") { state.stage = clamp(Math.round(Number(control.dataset.p232Stage)), 0, 2); renderAndFocus(renderApp, `[data-p232-stage="${state.stage}"]`); return; }
      if (action === "p232-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p232-stage="${state.stage}"]`); return; }
      if (action === "p232-preset") { setVector(Number(control.dataset.p232X), Number(control.dataset.p232Y)); updateDynamicDom(); return; }
      if (action === "p232-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p232-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp();
      if (action === "p232-reveal") window.requestAnimationFrame(() => document.querySelector("#p232-solution-heading")?.focus());
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p232-x")) { setVector(Number(event.target.value), state.y); updateDynamicDom(); return; }
      if (event.target.matches("#p232-y")) { setVector(state.x, Number(event.target.value)); updateDynamicDom(); return; }
      if (event.target.matches("#p232-answer-x")) { state.xAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
      if (event.target.matches("#p232-answer-y")) { state.yAnswer = event.target.value.slice(0, 20); state.feedback = ""; state.committed = false; }
    });
    root.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("[data-p232-drag]")) return;
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activePointerId = event.pointerId;
      root.setPointerCapture?.(event.pointerId);
      setFromPointer(event, root);
    });
    root.addEventListener("pointermove", (event) => {
      if (activePointerId !== event.pointerId) return;
      setFromPointer(event, root);
    });
    const finishPointer = (event) => {
      if (activePointerId !== event.pointerId) return;
      setFromPointer(event, root);
      if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId);
      activePointerId = null;
      root.querySelector("#p232-x")?.focus();
    };
    root.addEventListener("pointerup", finishPointer);
    root.addEventListener("pointercancel", (event) => {
      if (activePointerId !== event.pointerId) return;
      if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId);
      activePointerId = null;
      root.querySelector("#p232-x")?.focus();
    });
    root.querySelector("[data-p232-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const xRaw = event.currentTarget.querySelector("#p232-answer-x")?.value || "";
      const yRaw = event.currentTarget.querySelector("#p232-answer-y")?.value || "";
      const x = parseNumber(xRaw), y = parseNumber(yRaw);
      state.xAnswer = xRaw.trim();
      state.yAnswer = yRaw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(x) || !Number.isFinite(y)) state.feedback = "Enter both numerical coordinates of AP.";
      else if (Math.abs(x - CHALLENGE_IMAGE.y) <= .001 && Math.abs(y - CHALLENGE_IMAGE.x) <= .001) state.feedback = "Those are the right numbers in the wrong coordinate order.";
      else if (Math.abs(x - 8) <= .001 && Math.abs(y - 1) <= .001) state.feedback = "That treats P as a row vector multiplied on the left. Here P is a column vector, so use matrix rows dotted with P.";
      else if (Math.abs(x - CHALLENGE_IMAGE.x) > .001 || Math.abs(y - CHALLENGE_IMAGE.y) > .001) state.feedback = "Use 3 times the first column plus −2 times the second column, or take the two row dot products.";
      else {
        state.feedbackTone = "success";
        state.feedback = "Correct: A(3,−2)=(4,−5). The same map sends every logo vertex to its displayed image.";
        state.committed = true;
        state.stage = 2;
        restoreChallenge();
      }
      renderAndFocus(renderApp, "#p232-answer-x");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
