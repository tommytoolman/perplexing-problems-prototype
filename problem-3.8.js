(function registerObeliskRazerPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const LENGTH = 12;
  const WEIGHT = 60;
  const REAR_SETBACK = 6;
  const TOWER_HEIGHT = 8;
  const ANCHOR_MIN = 1;
  const ANCHOR_MAX = 9;
  const ANGLE_MIN = 0;
  const ANGLE_MAX = 90;
  const hints = Object.freeze([
    "Take moments about the foot. Gravity supplies W(L/2)cosθ. Each rope contributes its tension multiplied by the perpendicular distance from the foot to its line of action.",
    "The rear-rope moment arm is hᵣ=aLsinθ/dᵣ. The front-rope arm is hᶠ=L(Hcosθ−bsinθ)/dᶠ, so the front rope stops helping at θc=tan⁻¹(H/b).",
    "At an angle where both moment arms are positive, minimising the larger rope tension makes the two tensions equal: Tᵣ=Tᶠ=Mᵍ/(hᵣ+hᶠ).",
    "Across the full path, the competing peaks occur at horizontal—front rope alone—and at the handoff angle—rear rope alone. Move b until those two peak values match.",
    "Solve T₀(b)=Tc(b) numerically. For this geometry the root is about 4.248 m, giving a minimised peak of about 41.774 kN.",
  ]);
  const stages = Object.freeze([
    { label: "1. Geometry", title: "Lower through ninety degrees", copy: "The original rear guy remains. A second rope runs to an 8 m front tower whose setback b can be chosen." },
    { label: "2. Control", title: "Share the resisting moment", copy: "At each angle, the rigger minimises the larger of the two rope tensions while maintaining moment balance." },
    { label: "3. Minimax", title: "Optimise the worst point", copy: "A safe design minimises the maximum tension encountered anywhere from vertical to horizontal." },
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p38-reset">Reset</button>';

  function radians(degrees) {
    return degrees * Math.PI / 180;
  }

  function degrees(angle) {
    return angle * 180 / Math.PI;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function rearDistance(theta) {
    return Math.sqrt(LENGTH ** 2 + REAR_SETBACK ** 2 + 2 * REAR_SETBACK * LENGTH * Math.cos(theta));
  }

  function frontDistance(theta, anchor) {
    return Math.hypot(anchor - LENGTH * Math.cos(theta), TOWER_HEIGHT - LENGTH * Math.sin(theta));
  }

  function rearMomentArm(theta) {
    return REAR_SETBACK * LENGTH * Math.sin(theta) / rearDistance(theta);
  }

  function frontMomentArm(theta, anchor) {
    return LENGTH * (TOWER_HEIGHT * Math.cos(theta) - anchor * Math.sin(theta)) / frontDistance(theta, anchor);
  }

  function gravityMoment(theta) {
    return WEIGHT * LENGTH / 2 * Math.cos(theta);
  }

  function controlAt(angleDegrees, anchor) {
    const theta = radians(angleDegrees);
    const moment = Math.max(0, gravityMoment(theta));
    const rearArm = rearMomentArm(theta);
    const signedFrontArm = frontMomentArm(theta, anchor);
    if (moment < 1e-9) return { angle: angleDegrees, moment, rearArm, frontArm: signedFrontArm, rearTension: 0, frontTension: 0, maximumTension: 0, mode: "vertical" };
    if (signedFrontArm > 1e-9) {
      if (rearArm < 1e-9) {
        const frontTension = moment / signedFrontArm;
        return { angle: angleDegrees, moment, rearArm, frontArm: signedFrontArm, rearTension: 0, frontTension, maximumTension: frontTension, mode: "front only" };
      }
      const sharedTension = moment / (rearArm + signedFrontArm);
      return { angle: angleDegrees, moment, rearArm, frontArm: signedFrontArm, rearTension: sharedTension, frontTension: sharedTension, maximumTension: sharedTension, mode: "equal-tension share" };
    }
    const rearTension = moment / rearArm;
    return { angle: angleDegrees, moment, rearArm, frontArm: signedFrontArm, rearTension, frontTension: 0, maximumTension: rearTension, mode: "rear only" };
  }

  function handoffAngle(anchor) {
    return degrees(Math.atan2(TOWER_HEIGHT, anchor));
  }

  function horizontalBottleneck(anchor) {
    return WEIGHT * Math.hypot(LENGTH - anchor, TOWER_HEIGHT) / (2 * TOWER_HEIGHT);
  }

  function handoffBottleneck(anchor) {
    const theta = Math.atan2(TOWER_HEIGHT, anchor);
    return WEIGHT * rearDistance(theta) * Math.cos(theta) / (2 * REAR_SETBACK * Math.sin(theta));
  }

  function findOptimalAnchor() {
    let lower = ANCHOR_MIN;
    let upper = ANCHOR_MAX;
    for (let iteration = 0; iteration < 80; iteration += 1) {
      const middle = (lower + upper) / 2;
      if (horizontalBottleneck(middle) > handoffBottleneck(middle)) lower = middle;
      else upper = middle;
    }
    return (lower + upper) / 2;
  }

  const OPTIMAL_ANCHOR = findOptimalAnchor();
  const OPTIMAL_PEAK = horizontalBottleneck(OPTIMAL_ANCHOR);

  function profile(anchor, samples = 180) {
    const points = Array.from({ length: samples + 1 }, (_, index) => controlAt(index * 90 / samples, anchor));
    points.push(controlAt(handoffAngle(anchor), anchor));
    points.sort((first, second) => first.angle - second.angle);
    return points;
  }

  function peakForAnchor(anchor) {
    const samples = profile(anchor, 720);
    return samples.reduce((peak, point) => point.maximumTension > peak.maximumTension ? point : peak, samples[0]);
  }

  const initialState = () => ({
    angle: 60,
    anchor: 3,
    stage: 0,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "is-neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function currentControl() {
    return controlAt(state.angle, state.anchor);
  }

  function selectedPeak() {
    return peakForAnchor(state.anchor);
  }

  function loweringSvg() {
    const theta = radians(state.angle);
    const base = { x: 230, y: 312 };
    const scale = 18;
    const top = { x: base.x + LENGTH * scale * Math.cos(theta), y: base.y - LENGTH * scale * Math.sin(theta) };
    const midpoint = { x: (base.x + top.x) / 2, y: (base.y + top.y) / 2 };
    const rear = { x: base.x - REAR_SETBACK * scale, y: base.y };
    const front = { x: base.x + state.anchor * scale, y: base.y - TOWER_HEIGHT * scale };
    const control = currentControl();
    return `
      <svg class="p38-lowering-svg" viewBox="0 0 640 380" role="img" aria-labelledby="p38-svg-title p38-svg-desc">
        <title id="p38-svg-title">An obelisk lowered by rear and front control ropes</title>
        <desc id="p38-svg-desc">The obelisk is ${format(state.angle, 1)} degrees above horizontal. The front tower is ${format(state.anchor)} metres ahead. Rear tension is ${format(control.rearTension)} kilonewtons and front tension is ${format(control.frontTension)} kilonewtons in ${control.mode} control.</desc>
        <defs><marker id="p38-weight-arrow" markerWidth="8" markerHeight="8" refX="4" refY="5" orient="auto"><path d="M0 0 8 0 4 8Z"/></marker><pattern id="p38-stone" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M0 9 13 4M2 13 7 0"/></pattern></defs>
        <line class="p38-ground" x1="26" y1="${base.y}" x2="614" y2="${base.y}"/>
        <path class="p38-tower" d="M${front.x} ${base.y}V${front.y}m-24 0h48M${front.x - 16} ${base.y}l16-56 16 56"/>
        <line class="p38-rope is-rear" x1="${rear.x}" y1="${rear.y}" x2="${top.x}" y2="${top.y}"/>
        <line class="p38-rope is-front ${control.frontArm <= 0 ? "is-inactive" : ""}" x1="${front.x}" y1="${front.y}" x2="${top.x}" y2="${top.y}"/>
        <line class="p38-obelisk" x1="${base.x}" y1="${base.y}" x2="${top.x}" y2="${top.y}"/>
        <circle class="p38-pivot" cx="${base.x}" cy="${base.y}" r="9"/><circle class="p38-top" cx="${top.x}" cy="${top.y}" r="7"/>
        <line class="p38-weight" x1="${midpoint.x}" y1="${midpoint.y - 55}" x2="${midpoint.x}" y2="${midpoint.y + 4}" marker-end="url(#p38-weight-arrow)"/><text class="p38-weight-label" x="${midpoint.x + 9}" y="${midpoint.y - 39}">W = ${WEIGHT} kN</text>
        <text class="p38-anchor-label" x="${rear.x}" y="${rear.y + 23}" text-anchor="middle">rear anchor · a = ${REAR_SETBACK} m</text><text class="p38-anchor-label" x="${front.x}" y="${front.y - 12}" text-anchor="middle">front tower · H = ${TOWER_HEIGHT} m</text>
        <line class="p38-dimension" x1="${base.x}" y1="352" x2="${front.x}" y2="352"/><text class="p38-dimension-label" x="${(base.x + front.x) / 2}" y="346" text-anchor="middle">b = ${format(state.anchor)} m</text>
        <path class="p38-angle" d="M${base.x + 50} ${base.y} A50 50 0 0 0 ${base.x + 50 * Math.cos(theta)} ${base.y - 50 * Math.sin(theta)}"/><text class="p38-angle-label" x="${base.x + 61}" y="${base.y - 15}">θ = ${format(state.angle, 0)}°</text>
        ${state.stage >= 1 ? `<g class="p38-tension-labels"><text x="${(rear.x + top.x) / 2 - 5}" y="${(rear.y + top.y) / 2 - 8}" text-anchor="end">Tᵣ = ${format(control.rearTension)} kN</text><text class="${control.frontArm <= 0 ? "is-inactive" : ""}" x="${(front.x + top.x) / 2 + 5}" y="${(front.y + top.y) / 2 - 8}">Tᶠ = ${format(control.frontTension)} kN</text></g>` : ""}
      </svg>`;
  }

  function tensionChart() {
    const samples = profile(state.anchor, 120);
    const peak = selectedPeak();
    const maximumY = Math.max(50, peak.maximumTension * 1.22);
    const chart = { left: 48, right: 576, top: 20, bottom: 184 };
    const point = (angle, tension) => ({ x: chart.left + angle / 90 * (chart.right - chart.left), y: chart.bottom - tension / maximumY * (chart.bottom - chart.top) });
    const path = samples.map((sample, index) => {
      const p = point(sample.angle, sample.maximumTension);
      return `${index ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }).join(" ");
    const current = point(state.angle, currentControl().maximumTension);
    const horizontal = point(0, horizontalBottleneck(state.anchor));
    const handoff = point(handoffAngle(state.anchor), handoffBottleneck(state.anchor));
    return `
      <svg class="p38-chart" viewBox="0 0 610 220" role="img" aria-label="Maximum rope tension over the full lowering path. Current anchor peak ${format(peak.maximumTension)} kilonewtons near ${format(peak.angle, 1)} degrees.">
        <g class="p38-chart-grid"><line x1="${chart.left}" y1="${chart.bottom}" x2="${chart.right}" y2="${chart.bottom}"/><line x1="${chart.left}" y1="${chart.top}" x2="${chart.left}" y2="${chart.bottom}"/><line x1="${chart.left}" y1="${(chart.top + chart.bottom) / 2}" x2="${chart.right}" y2="${(chart.top + chart.bottom) / 2}"/></g>
        <path class="p38-profile" d="${path}"/><line class="p38-handoff-line" x1="${handoff.x}" y1="${chart.top}" x2="${handoff.x}" y2="${chart.bottom}"/>
        <circle class="p38-bottleneck is-horizontal" cx="${horizontal.x}" cy="${horizontal.y}" r="5"/><circle class="p38-bottleneck is-handoff" cx="${handoff.x}" cy="${handoff.y}" r="5"/><circle class="p38-current-point" cx="${current.x}" cy="${current.y}" r="6"/>
        <g class="p38-chart-labels"><text x="${chart.left}" y="205">horizontal · 0°</text><text x="${chart.right}" y="205" text-anchor="end">vertical · 90°</text><text x="${chart.left - 8}" y="${chart.top + 4}" text-anchor="end">${format(maximumY, 0)}</text><text x="${chart.left - 8}" y="${chart.bottom + 4}" text-anchor="end">0</text><text x="${handoff.x + 5}" y="${chart.top + 12}">handoff ${format(handoffAngle(state.anchor), 1)}°</text><text x="${horizontal.x + 7}" y="${horizontal.y - 8}">T₀</text><text x="${handoff.x + 7}" y="${handoff.y - 8}">Tc</text></g>
      </svg>`;
  }

  function sliderProgress(kind) {
    if (kind === "angle") return state.angle / 90 * 100;
    return (state.anchor - ANCHOR_MIN) / (ANCHOR_MAX - ANCHOR_MIN) * 100;
  }

  function dragSlider(kind, labelId) {
    const angle = kind === "angle";
    const minimum = angle ? ANGLE_MIN : ANCHOR_MIN;
    const maximum = angle ? ANGLE_MAX : ANCHOR_MAX;
    const value = angle ? state.angle : state.anchor;
    const valueText = angle ? `Obelisk ${format(value, 0)} degrees above horizontal` : `Front tower ${format(value)} metres ahead of the foot; peak tension ${format(selectedPeak().maximumTension)} kilonewtons`;
    return `<div class="drag-slider p38-drag-slider" data-p38-slider="${kind}" role="slider" tabindex="0" aria-labelledby="${labelId}" aria-valuemin="${minimum}" aria-valuemax="${maximum}" aria-valuenow="${format(value)}" aria-valuetext="${valueText}" style="--slider-progress:${sliderProgress(kind).toFixed(3)}%"><span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span></div>`;
  }

  function sliderControls() {
    return `<div class="p38-sliders"><div class="p38-slider-block"><div class="p38-slider-label" id="p38-angle-label"><span>Obelisk angle</span><output data-p38-live="angle">${format(state.angle, 0)}°</output></div>${dragSlider("angle", "p38-angle-label")}<div class="slider-labels"><span>horizontal · 0°</span><span>vertical · 90°</span></div><div class="p38-presets"><button class="chip-button math2-chip" type="button" data-problem-action="p38-angle" data-p38-angle="0">Horizontal</button><button class="chip-button math2-chip" type="button" data-problem-action="p38-angle" data-p38-angle="${handoffAngle(state.anchor)}">Handoff</button><button class="chip-button math2-chip" type="button" data-problem-action="p38-angle" data-p38-angle="90">Vertical</button></div></div><div class="p38-slider-block"><div class="p38-slider-label" id="p38-anchor-label"><span>Front tower setback b</span><output data-p38-live="anchor">${format(state.anchor)} m</output></div>${dragSlider("anchor", "p38-anchor-label")}<div class="slider-labels"><span>${ANCHOR_MIN} m</span><span>choose b</span><span>${ANCHOR_MAX} m</span></div><div class="p38-presets"><button class="chip-button math2-chip" type="button" data-problem-action="p38-anchor" data-p38-anchor="2">Near · 2 m</button><button class="chip-button math2-chip" type="button" data-problem-action="p38-anchor" data-p38-anchor="4">Middle · 4 m</button>${state.revealed ? `<button class="chip-button math2-chip" type="button" data-problem-action="p38-anchor" data-p38-anchor="${OPTIMAL_ANCHOR}">Optimum</button>` : ""}<button class="chip-button math2-chip" type="button" data-problem-action="p38-anchor" data-p38-anchor="7">Far · 7 m</button></div></div></div>`;
  }

  function currentMetrics() {
    const control = currentControl();
    const peak = selectedPeak();
    return `<div class="p38-metrics" aria-live="polite"><div><span>Rear rope</span><strong>${state.stage ? `${format(control.rearTension)} kN` : "hidden"}</strong></div><div class="${control.frontArm <= 0 ? "is-inactive" : ""}"><span>Front rope</span><strong>${state.stage ? `${format(control.frontTension)} kN` : "hidden"}</strong></div><div><span>Control mode</span><strong>${state.stage ? control.mode : "explore geometry"}</strong></div><div class="is-peak"><span>Worst tension for this b</span><strong>${state.stage >= 2 ? `${format(peak.maximumTension)} kN` : "hidden"}</strong></div></div>`;
  }

  function stageTabs() {
    return `<div class="p38-stage-tabs" role="group" aria-label="Lowering analysis stages">${stages.map((stage, index) => `<button class="chip-button math2-chip ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p38-stage" data-p38-stage="${index}" aria-pressed="${state.stage === index}">${stage.label}</button>`).join("")}</div>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p38-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="math2-solution p38-solution" aria-labelledby="p38-solution-title"><h3 id="p38-solution-title" tabindex="-1">Equalise the two unavoidable peaks</h3><p>With the top at ((Lcosθ,Lsinθ)), the rope moment arms about the foot are</p><div class="math2-equation p38-wide-equation">hᵣ = aLsinθ/dᵣ, &nbsp; dᵣ²=L²+a²+2aLcosθ</div><div class="math2-equation p38-wide-equation">hᶠ = L(Hcosθ−bsinθ)/dᶠ, &nbsp; dᶠ²=(b−Lcosθ)²+(H−Lsinθ)².</div><p>The required resisting moment is (Mᵍ=W(L/2)cosθ). Where both arms are positive, minimising the larger tension uses both ropes equally:</p><div class="math2-equation">Tᵣ=Tᶠ=Mᵍ/(hᵣ+hᶠ).</div><p>The front rope becomes unhelpful at (θc=tan⁻¹(H/b)). Numerical inspection of the complete path shows two governing bottlenecks:</p><div class="math2-equation p38-wide-equation">T₀(b)=W√((L−b)²+H²)/(2H)</div><div class="math2-equation p38-wide-equation">Tc(b)=W dᵣ(θc)cosθc/(2a sinθc).</div><p>Moving the tower forward lowers (T₀) but raises (Tc). The minimax position equalises them. Bisection gives</p><div class="math2-equation p38-final-equation">b* = ${format(OPTIMAL_ANCHOR, 4)} m, &nbsp; max T = ${format(OPTIMAL_PEAK, 4)} kN, &nbsp; θc = ${format(handoffAngle(OPTIMAL_ANCHOR), 3)}°.</div><p>A dense sweep of the full 0°–90° path confirms no intermediate angle exceeds these equal bottlenecks. Tension limits, tower strength and frictional details would still require engineering safety factors.</p></section>`;
  }

  function snapshot() {
    const control = currentControl();
    const peak = selectedPeak();
    return JSON.stringify({ problem: "3.8", provenance: "independently reconstructed continuation; not source wording", geometry: { lengthMetres: LENGTH, weightKilonewtons: WEIGHT, rearSetbackMetres: REAR_SETBACK, towerHeightMetres: TOWER_HEIGHT, frontSetbackMetres: state.anchor }, current: { angleDegrees: state.angle, rearTensionKilonewtons: control.rearTension, frontTensionKilonewtons: control.frontTension, mode: control.mode }, chosenAnchorPeak: { tensionKilonewtons: peak.maximumTension, angleDegrees: peak.angle }, optimum: { anchorMetres: OPTIMAL_ANCHOR, peakKilonewtons: OPTIMAL_PEAK }, estimate: state.estimate || null, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function render() {
    const stage = stages[state.stage];
    return `<main class="book-shell math2-shell p38-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div><div class="book-progress">${problemProgress("3.8")}</div>${problemHeaderActions("3.8", resetMarkup)}</header><div class="book-spread math2-spread p38-spread"><article class="book-page p38-problem-page"><div class="problem-number">Problem 3.8</div><h1 class="book-title math2-title p38-title">Obelisk razer</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="problem-copy">The 12 m, 60 kN obelisk from the raising problem must now be lowered slowly from vertical to horizontal. Its original top rope runs to a ground anchor 6 m behind the foot. A second top rope runs to an 8 m tower b metres in front. At every angle the riggers share the load to minimise the larger rope tension. Where should the tower stand to make the greatest tension over the entire descent as small as possible?</p><p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — the recovered source provides only this title and difficulty. This two-rope lowering optimisation is an independently written continuation, not Povey’s wording or solution.</p><section class="p38-rules"><strong>Control rules</strong><ul><li>The obelisk is uniform and pivots frictionlessly at its foot.</li><li>Ropes can pull but cannot push; a negative moment arm makes that rope inactive.</li><li>Lowering is quasistatic, so moments balance at every angle.</li><li>The objective is minimax: reduce the largest tension in either rope anywhere on the path.</li></ul></section></article><section class="book-page book-stage math2-stage p38-stage" aria-labelledby="p38-stage-title"><div class="math2-stage-card p38-stage-card">${stageTabs()}<div class="math2-stage-heading"><div><span class="eyebrow">${stage.label}</span><h2 id="p38-stage-title">${stage.title}</h2></div><p>${stage.copy}</p></div><div class="p38-model-wrap">${loweringSvg()}</div>${sliderControls()}<div class="p38-metrics-wrap">${currentMetrics()}</div>${state.stage >= 2 ? `<div class="p38-chart-wrap">${tensionChart()}</div>` : ""}</div></section><aside class="book-page book-coach p38-coach"><div class="coach-kicker">Choose the tower position</div><p class="coach-question">What setback b minimises the maximum single-rope tension over the whole lowering path?</p><form class="estimate-form p38-answer-form" data-p38-answer-form novalidate><label for="p38-answer">Optimal front setback</label><div class="estimate-field"><input class="estimate-input" id="p38-answer" inputmode="decimal" type="text" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 4.3"/><span>m</span></div><button class="primary-button" type="submit">Check design</button></form>${feedbackMarkup()}<div class="button-row p38-help-row"><button class="secondary-button" type="button" data-problem-action="p38-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p38-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}${debugPanel("Development state", snapshot())}</aside></div>${problemNav("3.8")}</main>`;
  }

  function updateModelDom(root) {
    const model = root.querySelector(".p38-model-wrap");
    if (model) model.innerHTML = loweringSvg();
    const metrics = root.querySelector(".p38-metrics-wrap");
    if (metrics) metrics.innerHTML = currentMetrics();
    const chart = root.querySelector(".p38-chart-wrap");
    if (chart) chart.innerHTML = tensionChart();
    root.querySelectorAll('[data-p38-live="angle"]').forEach((node) => { node.textContent = `${format(state.angle, 0)}°`; });
    root.querySelectorAll('[data-p38-live="anchor"]').forEach((node) => { node.textContent = `${format(state.anchor)} m`; });
    root.querySelectorAll("[data-p38-slider]").forEach((slider) => {
      const kind = slider.dataset.p38Slider;
      const value = kind === "angle" ? state.angle : state.anchor;
      slider.style.setProperty("--slider-progress", `${sliderProgress(kind).toFixed(3)}%`);
      slider.setAttribute("aria-valuenow", format(value));
      slider.setAttribute("aria-valuetext", kind === "angle" ? `Obelisk ${format(value, 0)} degrees above horizontal` : `Front tower ${format(value)} metres ahead; peak tension ${format(selectedPeak().maximumTension)} kilonewtons`);
    });
    const handoffButton = root.querySelector('[data-problem-action="p38-angle"]:nth-of-type(2)');
    if (handoffButton) handoffButton.dataset.p38Angle = String(handoffAngle(state.anchor));
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function setSliderValue(kind, value, root) {
    if (kind === "angle") state.angle = Math.round(clamp(value, ANGLE_MIN, ANGLE_MAX));
    else {
      state.anchor = Math.round(clamp(value, ANCHOR_MIN, ANCHOR_MAX) * 100) / 100;
      state.committed = false;
      state.feedback = "";
      root.querySelectorAll(".math2-feedback").forEach((node) => node.remove());
    }
    updateModelDom(root);
  }

  function setFromPointer(event, slider, root) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const fraction = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const kind = slider.dataset.p38Slider;
    const minimum = kind === "angle" ? ANGLE_MIN : ANCHOR_MIN;
    const maximum = kind === "angle" ? ANGLE_MAX : ANCHOR_MAX;
    setSliderValue(kind, minimum + fraction * (maximum - minimum), root);
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p38-shell");
    if (!root) return;
    root.querySelector("#p38-answer")?.addEventListener("input", (event) => { state.estimate = event.target.value; });
    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p38-reset") state = initialState();
        if (action === "p38-stage") { state.stage = Math.round(clamp(control.dataset.p38Stage, 0, 2)); focusSelector = `[data-problem-action="p38-stage"][data-p38-stage="${state.stage}"]`; }
        if (action === "p38-angle") { state.angle = Math.round(clamp(control.dataset.p38Angle, 0, 90)); focusSelector = `[data-problem-action="p38-angle"][data-p38-angle="${control.dataset.p38Angle}"]`; }
        if (action === "p38-anchor") { state.anchor = Math.round(clamp(control.dataset.p38Anchor, ANCHOR_MIN, ANCHOR_MAX) * 100) / 100; focusSelector = `[data-problem-action="p38-anchor"][data-p38-anchor="${control.dataset.p38Anchor}"]`; }
        if (action === "p38-hint") { state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1); state.stage = Math.max(state.stage, Math.min(2, state.hintsUsed)); focusSelector = '[data-problem-action="p38-hint"]'; }
        if (action === "p38-reveal") { state.revealed = true; state.stage = 2; state.anchor = OPTIMAL_ANCHOR; state.angle = handoffAngle(OPTIMAL_ANCHOR); }
        rerender();
        if (action === "p38-reveal") focusAfterRender("#p38-solution-title");
        else if (focusSelector) focusAfterRender(focusSelector);
      });
    });
    root.querySelectorAll("[data-p38-slider]").forEach((slider) => {
      slider.addEventListener("pointerdown", (event) => { event.preventDefault(); slider.focus(); slider.setPointerCapture(event.pointerId); setFromPointer(event, slider, root); });
      slider.addEventListener("pointermove", (event) => { if (slider.hasPointerCapture(event.pointerId)) setFromPointer(event, slider, root); });
      slider.addEventListener("pointerup", (event) => { setFromPointer(event, slider, root); if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId); });
      slider.addEventListener("pointercancel", (event) => { if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId); });
      slider.addEventListener("keydown", (event) => {
        const kind = slider.dataset.p38Slider;
        const step = kind === "angle" ? (event.shiftKey ? 5 : 1) : (event.shiftKey ? 0.25 : 0.05);
        let value = kind === "angle" ? state.angle : state.anchor;
        if (["ArrowLeft", "ArrowDown"].includes(event.key)) value -= step;
        else if (["ArrowRight", "ArrowUp"].includes(event.key)) value += step;
        else if (event.key === "Home") value = kind === "angle" ? ANGLE_MIN : ANCHOR_MIN;
        else if (event.key === "End") value = kind === "angle" ? ANGLE_MAX : ANCHOR_MAX;
        else return;
        event.preventDefault();
        setSliderValue(kind, value, root);
      });
    });
    root.querySelector("[data-p38-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p38-answer")?.value || "";
      const estimate = Number(raw.trim().replaceAll(",", ""));
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "is-neutral";
      if (!state.estimate || !Number.isFinite(estimate) || estimate < ANCHOR_MIN || estimate > ANCHOR_MAX) {
        state.feedback = `Enter a tower setback from ${ANCHOR_MIN} to ${ANCHOR_MAX} metres.`;
        state.feedbackTone = "is-warn";
      } else {
        state.committed = true;
        state.anchor = estimate;
        state.stage = 2;
        const difference = estimate - OPTIMAL_ANCHOR;
        if (Math.abs(difference) <= 0.08) {
          state.feedback = `Excellent. Near b = ${format(OPTIMAL_ANCHOR, 3)} m, the horizontal and handoff peaks meet at ${format(OPTIMAL_PEAK, 3)} kN.`;
          state.feedbackTone = "is-success";
        } else if (difference < 0) {
          state.feedback = `That tower is too near the foot: the horizontal position remains the larger bottleneck at ${format(horizontalBottleneck(estimate), 2)} kN.`;
        } else {
          state.feedback = `That tower is too far forward: the rear rope's handoff load grows to ${format(handoffBottleneck(estimate), 2)} kN.`;
        }
      }
      rerender();
      focusAfterRender("#p38-answer");
    });
  }

  window.poveyProblemPages["3.8"] = { render, bind };
}());
