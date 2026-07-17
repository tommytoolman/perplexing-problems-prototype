(function registerTurningFieldPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "26.4";
  const TWO_PI = 2 * Math.PI;
  const CHALLENGE_RADIUS = 2;
  const CHALLENGE_CIRCULATION = 8 * Math.PI;
  const PLOT = Object.freeze({ centreX: 250, centreY: 226, scale: 50.5, minimum: -3.2, maximum: 3.2 });
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Local turn", title: "Read local rotation from the field", copy: "For F=(P,Q)=(−y,x), the scalar curl is Qₓ−Pᵧ=1−(−1)=2. It is positive everywhere: the field has the same counterclockwise local turning tendency at every point." }),
    Object.freeze({ short: "Tangent work", title: "Compare the field with the oriented tangent", copy: "On a radius-r circle, the field is tangent. Counterclockwise travel aligns dr with F and gives F·dr=r²dt; clockwise travel opposes F and gives −r²dt." }),
    Object.freeze({ short: "Circulation", title: "Accumulate one globally oriented circuit", copy: "Integrating through 2π radians gives ±2πr². Green’s theorem agrees: curl 2 times oriented area ±πr². Orientation changes the sign, not the field’s curl." }),
  ]);
  const hints = Object.freeze([
    "Parametrise the counterclockwise radius-2 circle by r(t)=(2cos t,2sin t), for 0≤t≤2π.",
    "Then dr=(−2sin t,2cos t)dt.",
    "On the circle, F(r(t))=(−2sin t,2cos t), exactly the same vector as dr/dt.",
    "Therefore F·dr=4(sin²t+cos²t)dt=4dt.",
    "Integrate 4 from 0 to 2π. Reversing the direction reverses dr and hence the sign of the integral.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p264-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function cleanZero(value) { return Math.abs(Number(value)) < 1e-11 ? 0 : Number(value); }
  function format(value, digits = 3) {
    if (!Number.isFinite(Number(value))) return "—";
    return String(cleanZero(Number(Number(value).toFixed(digits))));
  }
  function signed(value, digits = 3) {
    const number = cleanZero(value);
    return number > 0 ? `+${format(number, digits)}` : format(number, digits);
  }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function parseNumber(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(" ", "").replaceAll(",", ".").replaceAll("−", "-");
    const piMultiple = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\*?(?:pi|π)$/);
    if (piMultiple) return Number(piMultiple[1]) * Math.PI;
    const fraction = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
    if (fraction) { const denominator = Number(fraction[2]); return denominator ? Number(fraction[1]) / denominator : NaN; }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) ? Number(normalized) : NaN;
  }

  function field(x, y) { return { x: -Number(y), y: Number(x) }; }
  function curl() { return 2; }
  function loopPoint(radius, direction, angle) { return { x: Number(radius) * Math.cos(Number(angle)), y: Number(direction) * Number(radius) * Math.sin(Number(angle)) }; }
  function loopTangent(radius, direction, angle) { return { x: -Number(radius) * Math.sin(Number(angle)), y: Number(direction) * Number(radius) * Math.cos(Number(angle)) }; }
  function dot(left, right) { return Number(left.x) * Number(right.x) + Number(left.y) * Number(right.y); }
  function localWorkPerRadian(radius, direction, angle) {
    const point = loopPoint(radius, direction, angle);
    return dot(field(point.x, point.y), loopTangent(radius, direction, angle));
  }
  function accumulatedWork(radius, direction, angle) { return Number(direction) * Number(radius) ** 2 * Number(angle); }
  function circulation(radius, direction) { return Number(direction) * TWO_PI * Number(radius) ** 2; }
  function greenCirculation(radius, direction) { return curl() * Number(direction) * Math.PI * Number(radius) ** 2; }

  function initialState() {
    return {
      radius: CHALLENGE_RADIUS,
      direction: 1,
      angle: Math.PI / 2,
      stage: 0,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
      boardMessage: "Radius 2 and counterclockwise orientation loaded. Scrub the tangent probe through one circuit.",
    };
  }
  let state = initialState();
  function directionName(direction = state.direction) { return Number(direction) === 1 ? "counterclockwise" : "clockwise"; }
  function currentData() {
    const point = loopPoint(state.radius, state.direction, state.angle);
    const tangent = loopTangent(state.radius, state.direction, state.angle);
    const vector = field(point.x, point.y);
    return {
      radius: state.radius,
      direction: state.direction,
      directionName: directionName(),
      angle: state.angle,
      fractionOfCircuit: state.angle / TWO_PI,
      point,
      tangent,
      field: vector,
      localDotProduct: dot(vector, tangent),
      expectedLocalDotProduct: state.direction * state.radius ** 2,
      accumulatedWork: accumulatedWork(state.radius, state.direction, state.angle),
      totalCirculation: circulation(state.radius, state.direction),
      greenTheoremCirculation: greenCirculation(state.radius, state.direction),
      curl: curl(),
      areaMagnitude: Math.PI * state.radius ** 2,
    };
  }
  function setRadius(radius, message) {
    state.radius = clamp(radius, .6, 2.8);
    const data = currentData();
    state.boardMessage = message || `Radius ${format(state.radius, 2)} gives local work ${signed(data.localDotProduct, 3)} per radian and full ${data.directionName} circulation ${signed(data.totalCirculation, 5)}.`;
  }
  function setDirection(direction, message) {
    state.direction = Number(direction) >= 0 ? 1 : -1;
    const data = currentData();
    state.boardMessage = message || `${directionName()} orientation selected. Curl remains +2, while tangent work and circulation are now ${data.direction > 0 ? "positive" : "negative"}.`;
  }
  function setAngle(angle, message) {
    state.angle = clamp(angle, 0, TWO_PI);
    const data = currentData();
    state.boardMessage = message || `After ${format(state.angle, 2)} radians, accumulated oriented work is ${signed(data.accumulatedWork, 5)}. Local work remains ${signed(data.localDotProduct, 3)} per radian.`;
  }
  function stepAngle(delta) {
    let next = state.angle + Number(delta);
    if (next > TWO_PI + 1e-9) next %= TWO_PI;
    if (next < 0) next = ((next % TWO_PI) + TWO_PI) % TWO_PI;
    setAngle(next);
  }
  function restoreChallenge(message) {
    state.radius = CHALLENGE_RADIUS;
    state.direction = 1;
    state.angle = TWO_PI;
    state.stage = 2;
    state.boardMessage = message || "Restored the fixed radius-2 counterclockwise circuit: total circulation 8π.";
  }

  function mapX(x) { return PLOT.centreX + PLOT.scale * Number(x); }
  function mapY(y) { return PLOT.centreY - PLOT.scale * Number(y); }
  function loopPath(radius) {
    return Array.from({ length: 121 }, (_, index) => {
      const angle = TWO_PI * index / 120;
      return `${index ? "L" : "M"}${format(mapX(radius * Math.cos(angle)), 3)} ${format(mapY(radius * Math.sin(angle)), 3)}`;
    }).join(" ");
  }
  function accumulatedArcPath(radius, direction, angle) {
    if (angle <= 1e-9) return "";
    const count = Math.max(2, Math.ceil(80 * angle / TWO_PI));
    return Array.from({ length: count + 1 }, (_, index) => {
      const t = angle * index / count;
      const point = loopPoint(radius, direction, t);
      return `${index ? "L" : "M"}${format(mapX(point.x), 3)} ${format(mapY(point.y), 3)}`;
    }).join(" ");
  }
  function vectorFieldMarkup() {
    const coordinates = [-2.7, -1.8, -.9, 0, .9, 1.8, 2.7];
    return coordinates.flatMap((y) => coordinates.map((x) => {
      const vector = field(x, y);
      const norm = Math.hypot(vector.x, vector.y);
      if (norm < 1e-8) return "";
      const half = 7;
      const ux = vector.x / norm;
      const uy = vector.y / norm;
      return `<line x1="${format(mapX(x) - half * ux, 2)}" y1="${format(mapY(y) + half * uy, 2)}" x2="${format(mapX(x) + half * ux, 2)}" y2="${format(mapY(y) - half * uy, 2)}"/>`;
    })).join("");
  }

  function stageControlsMarkup() {
    return `<div class="p264-stage-controls" role="group" aria-label="Circulation reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p264-stage" data-p264-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }
  function stageCaptionMarkup() {
    const stage = stages[state.stage];
    return `<div class="p264-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p264-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Circulation assembled" : "Next stage"}</button></div>`;
  }

  function turningFieldSvg() {
    const data = currentData();
    const currentX = mapX(data.point.x);
    const currentY = mapY(data.point.y);
    const fieldNorm = Math.hypot(data.field.x, data.field.y) || 1;
    const tangentNorm = Math.hypot(data.tangent.x, data.tangent.y) || 1;
    const fieldTip = { x: currentX + 43 * data.field.x / fieldNorm, y: currentY - 43 * data.field.y / fieldNorm };
    const tangentTip = { x: currentX + 30 * data.tangent.x / tangentNorm, y: currentY - 30 * data.tangent.y / tangentNorm };
    const showDot = state.stage >= 1 || state.revealed;
    const showTotal = state.stage >= 2 || state.revealed;
    const arc = accumulatedArcPath(state.radius, state.direction, state.angle);
    const description = `Rotational vector field F equals minus y comma x with scalar curl 2. A circular loop of radius ${format(state.radius, 4)} is oriented ${data.directionName}. The tangent probe is at parameter ${format(state.angle, 5)} radians and point ${format(data.point.x, 5)}, ${format(data.point.y, 5)}. The field vector there is ${format(data.field.x, 5)}, ${format(data.field.y, 5)} and the oriented tangent is ${format(data.tangent.x, 5)}, ${format(data.tangent.y, 5)}. Their dot product is ${format(data.localDotProduct, 6)} per radian. Accumulated work is ${format(data.accumulatedWork, 6)} and full circulation is ${format(data.totalCirculation, 6)}.`;
    return `<svg class="p264-field p264-stage-${state.stage}" viewBox="0 0 760 430" role="img" aria-labelledby="p264-svg-title p264-svg-desc">
      <title id="p264-svg-title">Rotational vector field and oriented circular line integral</title><desc id="p264-svg-desc">${description}</desc>
      <defs><linearGradient id="p264-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#132f39"/><stop offset="1" stop-color="#332b49"/></linearGradient><clipPath id="p264-plot-clip"><rect x="34" y="52" width="442" height="352" rx="10"/></clipPath><marker id="p264-field-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z"/></marker><marker id="p264-tangent-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z"/></marker><marker id="p264-tangent-negative-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z"/></marker></defs>
      <rect class="p264-board" x="1" y="1" width="758" height="428" rx="20"/><text class="p264-board-kicker" x="22" y="27">LOCAL CURL +2 · ORIENTED TANGENT WORK · GLOBAL CIRCULATION</text>
      <g class="p264-plot-panel"><rect x="20" y="43" width="470" height="367" rx="15"/><text class="p264-panel-title" x="38" y="66">TURNING FIELD F=(−y,x)</text><g clip-path="url(#p264-plot-clip)"><g class="p264-grid">${[-3,-2,-1,0,1,2,3].map((value) => `<line x1="${mapX(value)}" y1="64" x2="${mapX(value)}" y2="390"/><line x1="70" y1="${mapY(value)}" x2="430" y2="${mapY(value)}"/>`).join("")}</g><line class="p264-axis" x1="70" y1="${mapY(0)}" x2="430" y2="${mapY(0)}"/><line class="p264-axis" x1="${mapX(0)}" y1="64" x2="${mapX(0)}" y2="390"/><circle class="p264-oriented-area ${showTotal ? "is-visible" : ""}" cx="${PLOT.centreX}" cy="${PLOT.centreY}" r="${format(PLOT.scale * state.radius, 3)}"/><g class="p264-vector-field">${vectorFieldMarkup()}</g><path class="p264-loop" d="${loopPath(state.radius)}"/>${arc ? `<path class="p264-accumulated-arc ${state.direction > 0 ? "is-positive" : "is-negative"}" d="${arc}"/>` : ""}<circle class="p264-start-point" cx="${mapX(state.radius)}" cy="${mapY(0)}" r="4"/><line class="p264-probe-field" x1="${format(currentX, 3)}" y1="${format(currentY, 3)}" x2="${format(fieldTip.x, 3)}" y2="${format(fieldTip.y, 3)}"/><line class="p264-probe-tangent ${state.direction > 0 ? "is-positive" : "is-negative"}" x1="${format(currentX, 3)}" y1="${format(currentY, 3)}" x2="${format(tangentTip.x, 3)}" y2="${format(tangentTip.y, 3)}"/><circle class="p264-current-point" cx="${format(currentX, 3)}" cy="${format(currentY, 3)}" r="6"/></g>
        ${[-3,-2,-1,0,1,2,3].map((value) => `<text class="p264-tick" x="${mapX(value)}" y="405" text-anchor="middle">${value}</text><text class="p264-tick" x="61" y="${mapY(value) + 3}" text-anchor="end">${value}</text>`).join("")}<text class="p264-axis-label" x="430" y="405" text-anchor="end">x</text><text class="p264-axis-label" x="61" y="70">y</text><text class="p264-orientation-label" x="38" y="91">${data.directionName.toUpperCase()} · ${data.direction > 0 ? "WITH" : "AGAINST"} THE FIELD</text><text class="p264-probe-label is-field" x="${format(fieldTip.x + 6, 3)}" y="${format(fieldTip.y - 5, 3)}">F</text><text class="p264-probe-label is-tangent" x="${format(tangentTip.x + 6, 3)}" y="${format(tangentTip.y + 10, 3)}">dr/dt</text>
      </g>
      <g class="p264-ledger-panel"><rect x="500" y="43" width="240" height="367" rx="15"/><text class="p264-panel-title" x="518" y="66">ORIENTED WORK LEDGER</text><text class="p264-ledger-label" x="518" y="98">loop radius</text><text class="p264-ledger-value" x="722" y="98" text-anchor="end">r=${format(state.radius, 2)}</text><text class="p264-ledger-label" x="518" y="127">orientation</text><text class="p264-ledger-value" x="722" y="127" text-anchor="end">${data.direction > 0 ? "+ CCW" : "− CW"}</text><text class="p264-ledger-label" x="518" y="156">local curl</text><text class="p264-curl-value" x="722" y="156" text-anchor="end">Qₓ−Pᵧ=2</text><line class="p264-ledger-rule" x1="518" y1="178" x2="722" y2="178"/><g class="p264-dot-ledger ${showDot ? "is-visible" : ""}"><text class="p264-ledger-kicker" x="518" y="202">LOCAL WORK PER RADIAN</text><text class="p264-ledger-big" x="722" y="232" text-anchor="end">${signed(data.localDotProduct, 4)}</text><text class="p264-ledger-note" x="518" y="251">F·(dr/dt)=${data.direction > 0 ? "+" : "−"}r² at every t</text></g><line class="p264-ledger-rule" x1="518" y1="271" x2="722" y2="271"/><text class="p264-ledger-kicker" x="518" y="295">WORK ACCUMULATED TO t</text><text class="p264-accumulated-value ${data.direction > 0 ? "is-positive" : "is-negative"}" x="722" y="324" text-anchor="end">${signed(data.accumulatedWork, 5)}</text><g class="p264-total-ledger ${showTotal ? "is-visible" : ""}"><text class="p264-ledger-kicker" x="518" y="349">FULL CIRCULATION</text><text class="p264-total-value" x="722" y="377" text-anchor="end">${signed(data.totalCirculation, 5)}</text><text class="p264-ledger-note" x="518" y="398">curl × oriented area = ${signed(data.greenTheoremCirculation, 5)}</text></g></g>
    </svg>`;
  }

  function controlsMarkup() {
    const data = currentData();
    return `<section class="p264-controls" aria-label="Loop radius orientation and tangent probe controls"><label for="p264-radius"><span>Loop radius r <output>${format(state.radius, 2)}</output></span><input id="p264-radius" type="range" min=".6" max="2.8" step=".05" value="${state.radius}" aria-valuetext="loop radius ${format(state.radius, 2)}; circulation magnitude ${format(Math.abs(data.totalCirculation), 5)}"/></label><div class="p264-radius-presets"><button class="secondary-button" type="button" data-problem-action="p264-radius" data-p264-radius="1">r=1</button><button class="primary-button" type="button" data-problem-action="p264-radius" data-p264-radius="2">Challenge r=2</button><button class="secondary-button" type="button" data-problem-action="p264-radius" data-p264-radius="2.5">r=2.5</button></div><div class="p264-direction-controls" role="group" aria-label="Loop orientation"><button class="chip-button ${state.direction > 0 ? "active" : ""}" type="button" data-problem-action="p264-direction" data-p264-direction="1" aria-pressed="${state.direction > 0}">Counterclockwise +</button><button class="chip-button ${state.direction < 0 ? "active" : ""}" type="button" data-problem-action="p264-direction" data-p264-direction="-1" aria-pressed="${state.direction < 0}">Clockwise −</button></div><label class="p264-angle-control" for="p264-angle"><span>Move tangent probe <output>t=${format(state.angle, 2)} rad · ${format(100 * data.fractionOfCircuit, 0)}%</output></span><input id="p264-angle" type="range" min="0" max="${TWO_PI}" step=".01" value="${state.angle}" aria-valuetext="parameter ${format(state.angle, 3)} radians; accumulated oriented work ${signed(data.accumulatedWork, 5)}"/></label><div class="p264-step-row"><button class="secondary-button" type="button" data-problem-action="p264-step-back">−π/12</button><button class="secondary-button" type="button" data-problem-action="p264-step-forward">+π/12</button><button class="ghost-button" type="button" data-problem-action="p264-start">Start</button><button class="ghost-button" type="button" data-problem-action="p264-full">Full circuit</button><span>live work ${signed(data.accumulatedWork, 5)}</span></div><p data-p264-message role="status">${state.boardMessage}</p></section>`;
  }
  function metricsMarkup() {
    const data = currentData();
    return `<section class="p264-metrics" aria-live="polite"><article><span>Local field rotation</span><strong>curl F = +2</strong><small>unchanged by loop orientation</small></article><article><span>Local tangent work</span><strong>${signed(data.localDotProduct, 4)} per radian</strong><small>${data.direction > 0 ? "aligned" : "opposed"} · magnitude r²=${format(state.radius ** 2, 4)}</small></article><article><span>Accumulated so far</span><strong>${signed(data.accumulatedWork, 5)}</strong><small>${format(data.fractionOfCircuit, 3)} of one ${data.directionName} circuit</small></article></section>`;
  }
  function distinctionMarkup() {
    return `<section class="p264-distinction"><strong>Curl is local; circulation is global and oriented.</strong><span>The field keeps curl +2 whichever way the loop is travelled. Reversing the loop reverses dr, so every local dot product—and therefore the complete circulation—changes sign.</span></section>`;
  }
  function dynamicMarkup() { return `<div class="p264-dynamic">${turningFieldSvg()}${controlsMarkup()}${metricsMarkup()}${distinctionMarkup()}</div>`; }
  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p264-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p264-solution" aria-labelledby="p264-solution-heading" aria-live="polite"><h3 id="p264-solution-heading">The field is the counterclockwise tangent</h3><p>Parametrise the radius-2 counterclockwise circle by</p><div class="p264-equation">r(t)=(2cos t,2sin t),<br>dr=(−2sin t,2cos t)dt.</div><p>Evaluating the field on the loop gives F(r(t))=(−2sin t,2cos t). Thus</p><div class="p264-equation">F·dr=4(sin²t+cos²t)dt=4dt.</div><div class="p264-equation is-answer"><strong>∮<sub>C</sub>F·dr=∫₀²π4dt=8π≈${format(CHALLENGE_CIRCULATION, 7)}.</strong></div><p>The r² scaling is general: a radius-r counterclockwise loop has circulation 2πr². Reversing orientation gives −2πr². Meanwhile curl F=∂x/∂x−∂(−y)/∂y=2 remains positive; Green’s theorem recovers the same result as 2 times the oriented area.</p></section>`;
  }

  function snapshot() {
    const data = currentData();
    const sampleAngles = [0, Math.PI / 6, Math.PI / 2, Math.PI, 3 * Math.PI / 2, TWO_PI];
    const dotAudit = sampleAngles.map((angle) => ({ angle, counterclockwise: localWorkPerRadian(state.radius, 1, angle), clockwise: localWorkPerRadian(state.radius, -1, angle) }));
    return JSON.stringify({
      problem: PROBLEM,
      provenance: EXTENSION_DISCLOSURE,
      field: "F(x,y)=(-y,x)",
      scalarCurl: { expression: "dQ/dx-dP/dy=1-(-1)", value: curl(), interpretation: "positive local counterclockwise rotation; independent of loop orientation" },
      loop: { radius: state.radius, orientation: data.directionName, orientationSign: state.direction, parameterRange: [0, TWO_PI], parametrisation: state.direction > 0 ? "(r cos t,r sin t)" : "(r cos t,-r sin t)" },
      probe: { parameter: state.angle, point: data.point, fieldVector: data.field, tangentVector: data.tangent, dotProduct: data.localDotProduct, expectedDotProduct: data.expectedLocalDotProduct, residual: cleanZero(data.localDotProduct - data.expectedLocalDotProduct), accumulatedWork: data.accumulatedWork },
      fullCirculation: { lineIntegral: data.totalCirculation, formula: "orientationSign*2*pi*r^2", greenTheorem: data.greenTheoremCirculation, greenResidual: cleanZero(data.totalCirculation - data.greenTheoremCirculation), radiusSquaredScalingRatio: data.totalCirculation / (state.direction * state.radius ** 2) },
      dotProductAudit: dotAudit,
      fixedChallenge: { radius: CHALLENGE_RADIUS, orientation: "counterclockwise", exact: "8*pi", numeric: CHALLENGE_CIRCULATION, clockwiseWouldBe: -CHALLENGE_CIRCULATION },
      distinction: "curl is a local property of the field; circulation is a global oriented line integral and reverses sign with the loop",
      stage: state.stage + 1,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p264-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Multivariable Calculus and Fields</strong><span class="eyebrow">Chapter 26 · line integrals and circulation</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p264-spread"><article class="book-page p264-problem-page"><div class="problem-number">Problem 26.4</div><h1 class="book-title p264-title">The Turning Field</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="p264-extension-note">${EXTENSION_DISCLOSURE}</p><p class="problem-copy">Let</p><div class="p264-field-card" aria-label="F of x comma y equals minus y comma x">F(x,y)=(−y,x).</div><p class="problem-copy">For the circle of radius 2, traversed <strong>counterclockwise</strong>, calculate</p><div class="p264-integral-card" aria-label="closed line integral over C of F dot d r">∮<sub>C</sub> F·dr.</div><section class="p264-question-card"><strong>One field, two orientations</strong><p>First watch the field’s local turning, then compare its direction with the loop tangent and accumulate a complete circuit.</p></section></article><section class="book-page book-stage p264-stage" aria-labelledby="p264-stage-heading">${stageControlsMarkup()}<div class="p264-stage-heading"><div><span class="eyebrow">Circulation laboratory</span><h2 id="p264-stage-heading">Move a tangent probe around the turning field</h2></div><p>Change radius or orientation, scrub one circuit, and watch local work accumulate into global circulation.</p></div>${dynamicMarkup()}${stageCaptionMarkup()}</section><aside class="book-page book-coach p264-coach"><div class="coach-kicker">Fixed radius-2 counterclockwise loop</div><p class="coach-question">Enter the circulation as a decimal or a multiple of π.</p><form class="p264-answer-form" data-p264-answer-form novalidate><label for="p264-answer">Circulation ∮<sub>C</sub>F·dr</label><input id="p264-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="e.g. 25.13 or 8π"/><button class="primary-button" type="submit">Check circulation</button></form>${feedbackMarkup()}<div class="button-row p264-help-row"><button class="secondary-button" type="button" data-problem-action="p264-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p264-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p264-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function refreshDynamicDom() {
    const root = document.querySelector(".p264-shell");
    if (!root) return;
    const svg = root.querySelector(".p264-field");
    if (svg) svg.outerHTML = turningFieldSvg();
    const metrics = root.querySelector(".p264-metrics");
    if (metrics) metrics.outerHTML = metricsMarkup();
    const data = currentData();
    const radiusInput = root.querySelector("#p264-radius");
    const angleInput = root.querySelector("#p264-angle");
    if (radiusInput) { radiusInput.value = state.radius; radiusInput.setAttribute("aria-valuetext", `loop radius ${format(state.radius, 2)}; circulation magnitude ${format(Math.abs(data.totalCirculation), 5)}`); radiusInput.closest("label")?.querySelector("output")?.replaceChildren(format(state.radius, 2)); }
    if (angleInput) { angleInput.value = state.angle; angleInput.setAttribute("aria-valuetext", `parameter ${format(state.angle, 3)} radians; accumulated oriented work ${signed(data.accumulatedWork, 5)}`); angleInput.closest("label")?.querySelector("output")?.replaceChildren(`t=${format(state.angle, 2)} rad · ${format(100 * data.fractionOfCircuit, 0)}%`); }
    root.querySelectorAll("[data-p264-direction]").forEach((button) => { const active = Number(button.dataset.p264Direction) === state.direction; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    const live = root.querySelector(".p264-step-row span");
    if (live) live.textContent = `live work ${signed(data.accumulatedWork, 5)}`;
    const message = root.querySelector("[data-p264-message]");
    if (message) message.textContent = state.boardMessage;
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p264-shell");
    if (!root) return;
    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p264-reset") { state = initialState(); renderAndFocus(renderApp, "#p264-radius"); return; }
      if (action === "p264-stage") { state.stage = clamp(Math.round(Number(control.dataset.p264Stage)), 0, 2); renderAndFocus(renderApp, `[data-p264-stage="${state.stage}"]`); return; }
      if (action === "p264-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p264-stage="${state.stage}"]`); return; }
      if (action === "p264-radius") { setRadius(Number(control.dataset.p264Radius)); refreshDynamicDom(); return; }
      if (action === "p264-direction") { setDirection(Number(control.dataset.p264Direction)); refreshDynamicDom(); return; }
      if (action === "p264-step-back") { stepAngle(-Math.PI / 12); refreshDynamicDom(); return; }
      if (action === "p264-step-forward") { stepAngle(Math.PI / 12); refreshDynamicDom(); return; }
      if (action === "p264-start") { setAngle(0, "Returned the probe to t=0. No oriented work has yet accumulated."); refreshDynamicDom(); return; }
      if (action === "p264-full") { setAngle(TWO_PI, `Completed one ${directionName()} circuit. Total oriented work is ${signed(currentData().totalCirculation, 6)}.`); refreshDynamicDom(); return; }
      if (action === "p264-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p264-reveal") { state.revealed = true; restoreChallenge(); }
      renderApp();
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("#p264-radius")) { setRadius(Number(event.target.value)); refreshDynamicDom(); return; }
      if (event.target.matches("#p264-angle")) { setAngle(Number(event.target.value)); refreshDynamicDom(); return; }
      if (event.target.matches("#p264-answer")) { state.answer = event.target.value.slice(0, 24); state.feedback = ""; state.committed = false; }
    });
    root.querySelector("[data-p264-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p264-answer")?.value || "";
      const answer = parseNumber(raw);
      state.answer = raw.trim();
      state.feedbackTone = "warn";
      state.committed = false;
      if (!Number.isFinite(answer)) state.feedback = "Enter a numerical circulation or a multiple such as 8π.";
      else if (Math.abs(answer + CHALLENGE_CIRCULATION) <= .002) state.feedback = "That is the clockwise value. The stated loop is counterclockwise, aligned with the field.";
      else if (Math.abs(answer - 4) <= .002) state.feedback = "4 is the constant local work per radian. Integrate it over 0≤t≤2π.";
      else if (Math.abs(answer - 4 * Math.PI) <= .002) state.feedback = "4π is the circle’s area. Green’s theorem multiplies this by curl F=2.";
      else if (Math.abs(answer - 8) <= .002) state.feedback = "The integrand is 4, but the parameter interval has length 2π rather than 2.";
      else if (Math.abs(answer - CHALLENGE_CIRCULATION) > .002) state.feedback = "Parametrise the circle, compute F·(dr/dt), then integrate through 2π radians.";
      else { state.feedbackTone = "success"; state.feedback = `Correct: the counterclockwise circulation is 8π≈${format(CHALLENGE_CIRCULATION, 7)}.`; state.committed = true; state.revealed = true; restoreChallenge("Correct answer committed; restored the complete radius-2 counterclockwise circuit."); }
      renderAndFocus(renderApp, "#p264-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
