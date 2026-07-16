(function registerObeliskRaiserPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "3.7";
  const LENGTH = 12;
  const WEIGHT = 60;
  const QUESTION_ANGLE = 60;
  const QUESTION_ANCHOR = 6;
  const SCALE = 16;
  const PIVOT = Object.freeze({ x: 300, y: 340 });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p37-reset">Reset</button>';
  const hints = Object.freeze([
    "Take moments about the foot pivot. The unknown pivot reaction then contributes no moment.",
    "At 60°, the weight’s moment is 60 × (12/2) × cos 60° = 180 kN·m.",
    "Let h be the perpendicular distance from the foot to the rope. The triangle has area ½(12)(6)sin 60° = ½Dh, where D is the rope length.",
    "Here D=6√7 m and h=6√(3/7) m. At limiting equilibrium, Th=180 kN·m.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Question setup", angle: 60, anchor: 6, tension: 40 }),
    Object.freeze({ label: "Just balanced", angle: 60, anchor: 6, tension: 10 * Math.sqrt(21) }),
    Object.freeze({ label: "Low angle", angle: 25, anchor: 6, tension: 120 }),
    Object.freeze({ label: "Far anchor", angle: 60, anchor: 14, tension: 40 }),
  ]);

  const initialState = () => ({
    angle: QUESTION_ANGLE,
    anchor: QUESTION_ANCHOR,
    tension: 40,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function radians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function format(value, digits = 2) {
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

  function ropeLength(angle = state.angle, anchor = state.anchor) {
    return Math.sqrt(
      LENGTH ** 2
      + anchor ** 2
      + 2 * LENGTH * anchor * Math.cos(radians(angle)),
    );
  }

  function ropeMomentArm(angle = state.angle, anchor = state.anchor) {
    return (LENGTH * anchor * Math.sin(radians(angle))) / ropeLength(angle, anchor);
  }

  function weightMoment(angle = state.angle) {
    return WEIGHT * (LENGTH / 2) * Math.cos(radians(angle));
  }

  function ropeMoment(tension = state.tension, angle = state.angle, anchor = state.anchor) {
    return tension * ropeMomentArm(angle, anchor);
  }

  function requiredTension(angle = state.angle, anchor = state.anchor) {
    const arm = ropeMomentArm(angle, anchor);
    return arm > 0 ? weightMoment(angle) / arm : Infinity;
  }

  function momentDifference() {
    return ropeMoment() - weightMoment();
  }

  function motionState() {
    const difference = momentDifference();
    if (Math.abs(difference) <= 1) return "balanced";
    return difference > 0 ? "raising" : "lowering";
  }

  function questionAnswer() {
    return requiredTension(QUESTION_ANGLE, QUESTION_ANCHOR);
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.angle - state.angle) < 0.001
      && Math.abs(preset.anchor - state.anchor) < 0.001
      && Math.abs(preset.tension - state.tension) < 0.01
    ));
  }

  function geometry() {
    const angle = radians(state.angle);
    const top = {
      x: PIVOT.x + LENGTH * SCALE * Math.cos(angle),
      y: PIVOT.y - LENGTH * SCALE * Math.sin(angle),
    };
    const anchor = { x: PIVOT.x - state.anchor * SCALE, y: PIVOT.y };
    const ropeVector = { x: anchor.x - top.x, y: anchor.y - top.y };
    const ropePixels = Math.hypot(ropeVector.x, ropeVector.y);
    const ropeUnit = { x: ropeVector.x / ropePixels, y: ropeVector.y / ropePixels };
    const forceEnd = { x: top.x + ropeUnit.x * 74, y: top.y + ropeUnit.y * 74 };
    const midpoint = { x: (PIVOT.x + top.x) / 2, y: (PIVOT.y + top.y) / 2 };

    const line = { x: top.x - anchor.x, y: top.y - anchor.y };
    const denominator = line.x ** 2 + line.y ** 2;
    const projection = ((PIVOT.x - anchor.x) * line.x + (PIVOT.y - anchor.y) * line.y) / denominator;
    const foot = { x: anchor.x + projection * line.x, y: anchor.y + projection * line.y };

    const perpendicular = { x: Math.sin(angle), y: Math.cos(angle) };
    const baseHalf = 16;
    const topHalf = 7;
    const points = [
      { x: PIVOT.x + perpendicular.x * baseHalf, y: PIVOT.y + perpendicular.y * baseHalf },
      { x: top.x + perpendicular.x * topHalf, y: top.y + perpendicular.y * topHalf },
      { x: top.x - perpendicular.x * topHalf, y: top.y - perpendicular.y * topHalf },
      { x: PIVOT.x - perpendicular.x * baseHalf, y: PIVOT.y - perpendicular.y * baseHalf },
    ];
    const obeliskPath = `M${points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" L")} Z`;
    const arcRadius = 47;
    const arcEnd = {
      x: PIVOT.x + arcRadius * Math.cos(angle),
      y: PIVOT.y - arcRadius * Math.sin(angle),
    };
    const angleArc = `M${PIVOT.x + arcRadius},${PIVOT.y} A${arcRadius},${arcRadius} 0 0 0 ${arcEnd.x.toFixed(2)},${arcEnd.y.toFixed(2)}`;
    return { top, anchor, forceEnd, midpoint, foot, obeliskPath, angleArc };
  }

  function stateCopy() {
    const stateName = motionState();
    if (stateName === "balanced") return "Limiting equilibrium";
    if (stateName === "raising") return "Rope raises obelisk";
    return "Weight lowers obelisk";
  }

  function apparatusMarkup() {
    const shape = geometry();
    const stateName = motionState();
    const largerMoment = Math.max(weightMoment(), ropeMoment(), 1);
    return `
      <div class="p37-apparatus-wrap">
        <svg class="p37-apparatus" viewBox="0 0 700 430" role="img" aria-labelledby="p37-apparatus-title p37-apparatus-desc">
          <title id="p37-apparatus-title">Uniform obelisk raised by a guy rope</title>
          <desc id="p37-apparatus-desc">A 12 metre obelisk is ${format(state.angle, 0)} degrees above horizontal. Its top is joined to a ground anchor ${format(state.anchor, 1)} metres behind the foot. Rope tension ${format(state.tension, 1)} kilonewtons produces ${format(ropeMoment(), 1)} kilonewton metres against the weight moment ${format(weightMoment(), 1)}. ${stateCopy()}.</desc>
          <defs>
            <marker id="p37-arrow-weight" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p37-arrow-rope" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <line class="p37-ground" x1="30" y1="${PIVOT.y}" x2="670" y2="${PIVOT.y}" />
          <path class="p37-obelisk is-${stateName}" data-p37-obelisk d="${shape.obeliskPath}" />
          <path class="p37-obelisk-detail" data-p37-obelisk-detail d="M${PIVOT.x},${PIVOT.y} L${shape.top.x.toFixed(2)},${shape.top.y.toFixed(2)}" />
          <line class="p37-rope" data-p37-rope x1="${shape.top.x.toFixed(2)}" y1="${shape.top.y.toFixed(2)}" x2="${shape.anchor.x.toFixed(2)}" y2="${shape.anchor.y}" />
          <line class="p37-tension-arrow" data-p37-tension-arrow x1="${shape.top.x.toFixed(2)}" y1="${shape.top.y.toFixed(2)}" x2="${shape.forceEnd.x.toFixed(2)}" y2="${shape.forceEnd.y.toFixed(2)}" marker-end="url(#p37-arrow-rope)" />
          <text class="p37-force-label is-rope" data-p37-tension-label x="${(shape.forceEnd.x + 8).toFixed(2)}" y="${(shape.forceEnd.y - 8).toFixed(2)}">T = ${format(state.tension, 1)} kN</text>
          <line class="p37-weight-arrow" data-p37-weight-arrow x1="${shape.midpoint.x.toFixed(2)}" y1="${(shape.midpoint.y - 24).toFixed(2)}" x2="${shape.midpoint.x.toFixed(2)}" y2="${(shape.midpoint.y + 60).toFixed(2)}" marker-end="url(#p37-arrow-weight)" />
          <text class="p37-force-label is-weight" data-p37-weight-label x="${(shape.midpoint.x + 12).toFixed(2)}" y="${(shape.midpoint.y + 4).toFixed(2)}">60 kN</text>
          <line class="p37-moment-arm" data-p37-moment-arm x1="${PIVOT.x}" y1="${PIVOT.y}" x2="${shape.foot.x.toFixed(2)}" y2="${shape.foot.y.toFixed(2)}" />
          <circle class="p37-right-angle" data-p37-right-angle cx="${shape.foot.x.toFixed(2)}" cy="${shape.foot.y.toFixed(2)}" r="5" />
          <text class="p37-arm-label" data-p37-arm-label x="${((PIVOT.x + shape.foot.x) / 2 + 8).toFixed(2)}" y="${((PIVOT.y + shape.foot.y) / 2 - 8).toFixed(2)}">h = ${format(ropeMomentArm(), 2)} m</text>
          <g class="p37-pivot" transform="translate(${PIVOT.x} ${PIVOT.y})"><circle r="12" /><path d="M-22 16h44M-15 16l-8 11M0 16l-8 11M15 16l-8 11" /></g>
          <g class="p37-anchor" data-p37-anchor transform="translate(${shape.anchor.x.toFixed(2)} ${shape.anchor.y})"><path d="m0 0-14 25h28Z" /><circle cy="-1" r="7" /></g>
          <g class="p37-winch" data-p37-winch transform="translate(${(shape.anchor.x - 28).toFixed(2)} ${shape.anchor.y - 13})"><circle r="13" /><circle r="4" /><path d="M13 0h22m-4-7v14" /></g>
          <path class="p37-angle-arc" data-p37-angle-arc d="${shape.angleArc}" />
          <text class="p37-angle-label" data-p37-angle-label x="${PIVOT.x + 56}" y="${PIVOT.y - 18}">${format(state.angle, 0)}°</text>
          <text class="p37-anchor-label" data-p37-anchor-label x="${shape.anchor.x.toFixed(2)}" y="${shape.anchor.y + 46}" text-anchor="middle">anchor · ${format(state.anchor, 1)} m</text>
          <text class="p37-length-label" data-p37-length-label x="${(shape.midpoint.x + 24).toFixed(2)}" y="${(shape.midpoint.y - 18).toFixed(2)}">12 m uniform</text>
        </svg>
        <div class="p37-moment-panel is-${stateName}" data-p37-moment-panel>
          <div><span>Weight moment</span><strong data-p37-live="weight-moment">${format(weightMoment(), 1)} kN·m</strong><i style="--p37-size:${((weightMoment() / largerMoment) * 100).toFixed(2)}%"></i></div>
          <div class="p37-state"><span>At the foot pivot</span><strong data-p37-live="state">${stateCopy()}</strong></div>
          <div><span>Rope moment</span><strong data-p37-live="rope-moment">${format(ropeMoment(), 1)} kN·m</strong><i style="--p37-size:${((ropeMoment() / largerMoment) * 100).toFixed(2)}%"></i></div>
        </div>
      </div>`;
  }

  function sliderMarkup(kind, label, minimum, maximum, step, value, unit) {
    return `
      <label class="p37-range-row" for="p37-${kind}-slider">
        <span><strong>${label}</strong><output data-p37-live="${kind}">${format(value, unit === "°" ? 0 : 1)}${unit}</output></span>
        <input id="p37-${kind}-slider" data-p37-slider="${kind}" type="range" min="${minimum}" max="${maximum}" step="${step}" value="${value}" />
        <small><span>${minimum}${unit}</span><span>${kind === "anchor" ? "behind foot" : kind === "angle" ? "above horizontal" : "guy force"}</span><span>${maximum}${unit}</span></small>
      </label>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p37-controls">
        ${sliderMarkup("angle", "Opening angle", 10, 85, 1, state.angle, "°")}
        ${sliderMarkup("anchor", "Anchor distance", 2, 16, 0.5, state.anchor, " m")}
        ${sliderMarkup("tension", "Rope tension", 0, 150, 0.5, state.tension, " kN")}
        <div class="p37-presets" aria-label="Raising presets">${presets.map((preset, index) => `<button class="chip-button p37-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p37-preset" data-p37-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </div>`;
  }

  function metricsMarkup() {
    return `
      <div class="p37-metrics" aria-live="polite">
        <div><span>Rope length · D</span><strong data-p37-live="rope-length">${format(ropeLength(), 2)} m</strong></div>
        <div><span>Rope moment arm · h</span><strong data-p37-live="rope-arm">${format(ropeMomentArm(), 2)} m</strong></div>
        <div><span>Tension to balance</span><strong data-p37-live="required-tension">${format(requiredTension(), 2)} kN</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p37-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p37-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p37-solution" aria-labelledby="p37-solution-heading">
        <h3 id="p37-solution-heading" tabindex="-1">Use the rope’s perpendicular moment arm</h3>
        <p>At 60°, the uniform obelisk’s weight acts 6 m from the foot along the beam:</p>
        <div class="p37-equation">M<sub>W</sub> = 60 × 6 × cos 60° = 180 kN·m</div>
        <p>The rope length follows from the triangle made by the obelisk, ground and guy rope:</p>
        <div class="p37-equation">D² = 12² + 6² + 2(12)(6)cos 60° = 252, so D = 6√7 m</div>
        <p>Equate two expressions for that triangle’s area to find the perpendicular distance <em>h</em> from the foot to the rope:</p>
        <div class="p37-equation">½Dh = ½(12)(6)sin 60°, so h = 6√(3/7) m</div>
        <div class="p37-equation">Th = 180</div>
        <div class="p37-equation is-answer">T = 180 / [6√(3/7)] = 10√21 ≈ 45.83 kN</div>
        <p>The general limiting tension is <em>T = WD cos θ / (2d sin θ)</em>. It diverges as θ approaches 0°, because the rope then passes almost through the pivot, and tends to zero as the obelisk approaches vertical.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      obeliskLengthMetres: LENGTH,
      obeliskWeightKilonewtons: WEIGHT,
      angleDegrees: state.angle,
      anchorDistanceMetres: state.anchor,
      ropeTensionKilonewtons: state.tension,
      ropeLengthMetres: Number(ropeLength().toFixed(4)),
      ropeMomentArmMetres: Number(ropeMomentArm().toFixed(4)),
      weightMomentKilonewtonMetres: Number(weightMoment().toFixed(4)),
      ropeMomentKilonewtonMetres: Number(ropeMoment().toFixed(4)),
      requiredTensionKilonewtons: Number(requiredTension().toFixed(4)),
      motion: motionState(),
      questionAnswerKilonewtons: Number(questionAnswer().toFixed(6)),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p37-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p37-spread">
          <article class="book-page p37-problem-page">
            <div class="problem-number">Problem 3.7</div>
            <h1 class="book-title p37-title">Obelisk raiser</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">A uniform 12 m obelisk weighs 60 kN and turns about a frictionless foot pivot. A guy rope runs from its top to a ground anchor 6 m behind the pivot.</p>
            <p class="problem-copy">When the obelisk is 60° above horizontal, what rope tension holds it in limiting equilibrium?</p>
            <p class="p37-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written guy-rope model is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Geometry matters</div><p>Tension does not act perpendicular to the obelisk. Its turning effect is tension multiplied by the shortest distance from the foot pivot to the rope’s line.</p></section>
          </article>

          <section class="book-page book-stage p37-stage" aria-labelledby="p37-stage-title">
            <div class="p37-stage-card">
              <div class="p37-stage-heading"><div><span class="eyebrow">Guy-rope laboratory</span><h2 id="p37-stage-title">Balance the turning effects</h2></div><p>Change the opening angle, move the anchor or tune the tension. The dashed segment is the rope’s true moment arm.</p></div>
              ${apparatusMarkup()}
              ${controlsMarkup()}
              ${metricsMarkup()}
            </div>
          </section>

          <aside class="book-page book-coach p37-coach">
            <div class="coach-kicker">Find the limiting pull</div>
            <p class="coach-question">At 60° with the anchor 6 m behind the foot, what tension is required?</p>
            <form class="p37-answer-form" data-p37-answer-form novalidate>
              <label for="p37-answer">Rope tension</label>
              <div><input id="p37-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 50" /><span>kN</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p37-help-row"><button class="secondary-button" type="button" data-problem-action="p37-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p37-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateLiveDom(root) {
    const shape = geometry();
    const stateName = motionState();
    const largerMoment = Math.max(weightMoment(), ropeMoment(), 1);
    const values = {
      angle: `${format(state.angle, 0)}°`,
      anchor: `${format(state.anchor, 1)} m`,
      tension: `${format(state.tension, 1)} kN`,
      "weight-moment": `${format(weightMoment(), 1)} kN·m`,
      "rope-moment": `${format(ropeMoment(), 1)} kN·m`,
      state: stateCopy(),
      "rope-length": `${format(ropeLength(), 2)} m`,
      "rope-arm": `${format(ropeMomentArm(), 2)} m`,
      "required-tension": `${format(requiredTension(), 2)} kN`,
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p37-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const obelisk = root.querySelector("[data-p37-obelisk]");
    if (obelisk) {
      obelisk.setAttribute("d", shape.obeliskPath);
      obelisk.setAttribute("class", `p37-obelisk is-${stateName}`);
    }
    const detail = root.querySelector("[data-p37-obelisk-detail]");
    if (detail) detail.setAttribute("d", `M${PIVOT.x},${PIVOT.y} L${shape.top.x.toFixed(2)},${shape.top.y.toFixed(2)}`);
    const setLine = (selector, attributes) => {
      const line = root.querySelector(selector);
      if (!line) return;
      Object.entries(attributes).forEach(([name, value]) => line.setAttribute(name, Number(value).toFixed(2)));
    };
    setLine("[data-p37-rope]", { x1: shape.top.x, y1: shape.top.y, x2: shape.anchor.x, y2: shape.anchor.y });
    setLine("[data-p37-tension-arrow]", { x1: shape.top.x, y1: shape.top.y, x2: shape.forceEnd.x, y2: shape.forceEnd.y });
    setLine("[data-p37-weight-arrow]", { x1: shape.midpoint.x, y1: shape.midpoint.y - 24, x2: shape.midpoint.x, y2: shape.midpoint.y + 60 });
    setLine("[data-p37-moment-arm]", { x2: shape.foot.x, y2: shape.foot.y });

    const tensionLabel = root.querySelector("[data-p37-tension-label]");
    if (tensionLabel) {
      tensionLabel.setAttribute("x", (shape.forceEnd.x + 8).toFixed(2));
      tensionLabel.setAttribute("y", (shape.forceEnd.y - 8).toFixed(2));
      tensionLabel.textContent = `T = ${format(state.tension, 1)} kN`;
    }
    const weightLabel = root.querySelector("[data-p37-weight-label]");
    if (weightLabel) {
      weightLabel.setAttribute("x", (shape.midpoint.x + 12).toFixed(2));
      weightLabel.setAttribute("y", (shape.midpoint.y + 4).toFixed(2));
    }
    const rightAngle = root.querySelector("[data-p37-right-angle]");
    if (rightAngle) {
      rightAngle.setAttribute("cx", shape.foot.x.toFixed(2));
      rightAngle.setAttribute("cy", shape.foot.y.toFixed(2));
    }
    const armLabel = root.querySelector("[data-p37-arm-label]");
    if (armLabel) {
      armLabel.setAttribute("x", ((PIVOT.x + shape.foot.x) / 2 + 8).toFixed(2));
      armLabel.setAttribute("y", ((PIVOT.y + shape.foot.y) / 2 - 8).toFixed(2));
      armLabel.textContent = `h = ${format(ropeMomentArm(), 2)} m`;
    }
    const anchor = root.querySelector("[data-p37-anchor]");
    if (anchor) anchor.setAttribute("transform", `translate(${shape.anchor.x.toFixed(2)} ${shape.anchor.y})`);
    const winch = root.querySelector("[data-p37-winch]");
    if (winch) winch.setAttribute("transform", `translate(${(shape.anchor.x - 28).toFixed(2)} ${shape.anchor.y - 13})`);
    const angleArc = root.querySelector("[data-p37-angle-arc]");
    if (angleArc) angleArc.setAttribute("d", shape.angleArc);
    const angleLabel = root.querySelector("[data-p37-angle-label]");
    if (angleLabel) angleLabel.textContent = `${format(state.angle, 0)}°`;
    const anchorLabel = root.querySelector("[data-p37-anchor-label]");
    if (anchorLabel) {
      anchorLabel.setAttribute("x", shape.anchor.x.toFixed(2));
      anchorLabel.textContent = `anchor · ${format(state.anchor, 1)} m`;
    }
    const lengthLabel = root.querySelector("[data-p37-length-label]");
    if (lengthLabel) {
      lengthLabel.setAttribute("x", (shape.midpoint.x + 24).toFixed(2));
      lengthLabel.setAttribute("y", (shape.midpoint.y - 18).toFixed(2));
    }
    const panel = root.querySelector("[data-p37-moment-panel]");
    if (panel) {
      panel.setAttribute("class", `p37-moment-panel is-${stateName}`);
      const bars = panel.querySelectorAll("i");
      bars[0]?.style.setProperty("--p37-size", `${((weightMoment() / largerMoment) * 100).toFixed(2)}%`);
      bars[1]?.style.setProperty("--p37-size", `${((ropeMoment() / largerMoment) * 100).toFixed(2)}%`);
    }
    const description = root.querySelector("#p37-apparatus-desc");
    if (description) description.textContent = `A 12 metre obelisk is ${format(state.angle, 0)} degrees above horizontal. Its top is joined to a ground anchor ${format(state.anchor, 1)} metres behind the foot. Rope tension ${format(state.tension, 1)} kilonewtons produces ${format(ropeMoment(), 1)} kilonewton metres against the weight moment ${format(weightMoment(), 1)}. ${stateCopy()}.`;
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p37-preset"]').forEach((button) => {
      const active = Number(button.dataset.p37Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelector(".p37-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseTension(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".").replace(/\s*kn$/, "");
    return normalized ? Number(normalized) : NaN;
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p37-shell");
    if (!root) return;

    root.querySelector("#p37-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p37-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p37Slider;
        if (kind === "angle") state.angle = clamp(event.target.value, 10, 85);
        if (kind === "anchor") state.anchor = clamp(event.target.value, 2, 16);
        if (kind === "tension") state.tension = clamp(event.target.value, 0, 150);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p37-reset") state = initialState();
        if (action === "p37-preset") {
          const preset = presets[Number(control.dataset.p37Preset)];
          if (preset) {
            state.angle = preset.angle;
            state.anchor = preset.anchor;
            state.tension = preset.tension;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p37-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p37-reveal") state.revealed = true;
        rerender();
        if (action === "p37-reveal") window.requestAnimationFrame(() => document.querySelector("#p37-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p37-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p37-answer")?.value || "";
      const estimate = parseTension(raw);
      const exact = questionAnswer();
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive rope tension in kilonewtons.";
        state.feedbackTone = "warn";
      } else if (estimate > 500) {
        state.feedback = "That looks like newtons rather than kilonewtons. Enter the value in kN.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.5) {
          state.feedback = "Exactly. About 45.83 kN gives a rope moment of 180 kN·m, matching the weight moment.";
          state.feedbackTone = "success";
          state.angle = QUESTION_ANGLE;
          state.anchor = QUESTION_ANCHOR;
          state.tension = exact;
        } else if (estimate > exact) {
          state.feedback = "That tension would raise the obelisk, but it is above the limiting equilibrium value.";
        } else {
          state.feedback = "That is too small: the rope moment remains below the 180 kN·m weight moment.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p37-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
