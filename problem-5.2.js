(function registerSuperbikeBankingPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "5.2";
  const MASS = 250;
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ radius: 50, angle: 20, friction: 0.25 });
  const stages = Object.freeze([
    Object.freeze({ short: "Bank", title: "Let the normal lean inward", copy: "At one special speed, the horizontal component of the normal force supplies exactly the required centripetal force. No sideways tyre friction is needed." }),
    Object.freeze({ short: "Grip", title: "Read the required friction sign", copy: "Above the design speed friction must act down the bank and inward. Below it friction acts up the bank and outward." }),
    Object.freeze({ short: "Limit", title: "Stop when |f| reaches μN", copy: "The safe-speed band ends when the required friction magnitude equals the tyre’s available grip." }),
  ]);
  const hints = Object.freeze([
    "Resolve forces vertically and horizontally inward. Take f positive down the bank, which is both inward and downward.",
    "The component equations are N cosθ−f sinθ=mg and N sinθ+f cosθ=mv²/r.",
    "Solving gives N=m(g cosθ+v² sinθ/r) and f=m(v² cosθ/r−g sinθ). At the design speed f=0, so v₀²=rg tanθ.",
    "At the maximum speed the required friction is positive and at its limit: f=μN. This is down-bank friction resisting an impending up-bank skid.",
    "Writing x=v²/(rg), the high-speed limit is x=(sinθ+μ cosθ)/(cosθ−μ sinθ). Convert the final speed from m/s to km/h.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p52-reset">Reset</button>';

  function radians(degrees) {
    return Number(degrees) * Math.PI / 180;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "∞";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18);
  }

  function speedLimits(radius, angle, friction) {
    const theta = radians(angle);
    const sine = Math.sin(theta);
    const cosine = Math.cos(theta);
    const design = Math.sqrt(Math.max(0, radius * GRAVITY * Math.tan(theta)));
    const lowRatio = (sine - friction * cosine) / (cosine + friction * sine);
    const highDenominator = cosine - friction * sine;
    const highRatio = highDenominator > 1e-10
      ? (sine + friction * cosine) / highDenominator
      : Infinity;
    const minimum = Math.sqrt(Math.max(0, radius * GRAVITY * lowRatio));
    const maximum = Number.isFinite(highRatio)
      ? Math.sqrt(Math.max(0, radius * GRAVITY * highRatio))
      : Infinity;
    return {
      minimumMetresPerSecond: minimum,
      designMetresPerSecond: design,
      maximumMetresPerSecond: maximum,
      minimumKmh: minimum * 3.6,
      designKmh: design * 3.6,
      maximumKmh: maximum * 3.6,
    };
  }

  const CHALLENGE_LIMITS = speedLimits(CHALLENGE.radius, CHALLENGE.angle, CHALLENGE.friction);

  const initialState = () => ({
    speed: Number(CHALLENGE_LIMITS.designKmh.toFixed(1)),
    radius: CHALLENGE.radius,
    angle: CHALLENGE.angle,
    friction: CHALLENGE.friction,
    stage: 0,
    answer: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function cornerFor(speedKmh = state.speed, radius = state.radius, angle = state.angle, friction = state.friction) {
    const theta = radians(angle);
    const sine = Math.sin(theta);
    const cosine = Math.cos(theta);
    const speed = speedKmh / 3.6;
    const radialAcceleration = speed ** 2 / radius;
    const normal = MASS * (GRAVITY * cosine + radialAcceleration * sine);
    const requiredFriction = MASS * (radialAcceleration * cosine - GRAVITY * sine);
    const gripLimit = friction * normal;
    const utilization = gripLimit <= 1e-10
      ? (Math.abs(requiredFriction) <= 0.5 ? 0 : Infinity)
      : Math.abs(requiredFriction) / gripLimit;
    const limits = speedLimits(radius, angle, friction);
    return { theta, sine, cosine, speed, radialAcceleration, normal, requiredFriction, gripLimit, utilization, limits };
  }

  function frictionDirection(values = cornerFor()) {
    if (Math.abs(values.requiredFriction) <= 0.5) return "none";
    return values.requiredFriction > 0 ? "down" : "up";
  }

  function regime(values = cornerFor()) {
    const tolerance = 0.5;
    if (Math.abs(values.requiredFriction) <= tolerance) return "design";
    if (values.requiredFriction > values.gripLimit + tolerance) return "skid-up";
    if (values.requiredFriction < -values.gripLimit - tolerance) return "skid-down";
    return values.requiredFriction > 0 ? "safe-high" : "safe-low";
  }

  function regimeLabel(values = cornerFor()) {
    const current = regime(values);
    if (current === "design") return "Design speed · no sideways friction";
    if (current === "safe-high") return "Safe · friction acts down the bank";
    if (current === "safe-low") return "Safe · friction acts up the bank";
    if (current === "skid-up") return "Too fast · impending skid up the bank";
    return "Too slow · impending slide down the bank";
  }

  function reconstructionNote() {
    return `
      <p class="circ5-reconstruction-note p52-reconstruction-note">
        <strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. The scenario, values, interaction and solution below are newly written; they do not reproduce the book’s wording or solution.
      </p>`;
  }

  function stageControls() {
    return `
      <div class="p52-stage-controls" role="group" aria-label="Banked-corner analysis stages">
        ${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p52-stage" data-p52-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `
      <div class="p52-stage-caption">
        <div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
        <button class="ghost-button" type="button" data-problem-action="p52-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Grip resolved" : "Next stage"}</button>
      </div>`;
  }

  function arrow(origin, direction, length) {
    return { x1: origin.x, y1: origin.y, x2: origin.x + direction.x * length, y2: origin.y + direction.y * length };
  }

  function forceMarkup(line, className, marker, label, anchor = "middle") {
    return `
      <g class="p52-force ${className}">
        <line x1="${format(line.x1)}" y1="${format(line.y1)}" x2="${format(line.x2)}" y2="${format(line.y2)}" marker-end="url(#${marker})"/>
        <text x="${format(line.x2)}" y="${format(line.y2 - 10)}" text-anchor="${anchor}">${label}</text>
      </g>`;
  }

  function forceLength(ratio, minimum = 36, maximum = 102) {
    return clamp(36 + Math.abs(ratio) * 44, minimum, maximum);
  }

  function bankedCornerSvg() {
    const values = cornerFor();
    const theta = values.theta;
    const centre = { x: 350, y: 260 };
    const halfRoad = 255;
    const alongUp = { x: Math.cos(theta), y: -Math.sin(theta) };
    const downBank = { x: -Math.cos(theta), y: Math.sin(theta) };
    const upBank = { x: Math.cos(theta), y: -Math.sin(theta) };
    const normalDirection = { x: -Math.sin(theta), y: -Math.cos(theta) };
    const leftRoad = { x: centre.x - halfRoad * alongUp.x, y: centre.y - halfRoad * alongUp.y };
    const rightRoad = { x: centre.x + halfRoad * alongUp.x, y: centre.y + halfRoad * alongUp.y };
    const forceOrigin = { x: centre.x - 52 * Math.sin(theta), y: centre.y - 52 * Math.cos(theta) };
    const weightLine = arrow(forceOrigin, { x: 0, y: 1 }, 72);
    const normalLine = arrow(forceOrigin, normalDirection, forceLength(values.normal / (MASS * GRAVITY)));
    const frictionSign = Math.sign(values.requiredFriction);
    const frictionLine = arrow(
      { x: forceOrigin.x, y: forceOrigin.y + 5 },
      frictionSign >= 0 ? downBank : upBank,
      forceLength(values.requiredFriction / (MASS * GRAVITY), 30, 78),
    );
    const radialLine = arrow({ x: forceOrigin.x, y: forceOrigin.y - 29 }, { x: -1, y: 0 }, forceLength(values.radialAcceleration / GRAVITY, 34, 92));
    const scale = { left: 78, right: 642, y: 431, maximum: 160 };
    const speedX = scale.left + clamp(state.speed / scale.maximum, 0, 1) * (scale.right - scale.left);
    const lowX = scale.left + clamp(values.limits.minimumKmh / scale.maximum, 0, 1) * (scale.right - scale.left);
    const designX = scale.left + clamp(values.limits.designKmh / scale.maximum, 0, 1) * (scale.right - scale.left);
    const highX = scale.left + clamp(values.limits.maximumKmh / scale.maximum, 0, 1) * (scale.right - scale.left);
    const frictionText = frictionDirection(values) === "none"
      ? "f = 0"
      : `f ${format(Math.abs(values.requiredFriction) / 1000, 2)} kN`;
    return `
      <svg class="p52-svg p52-stage-${state.stage} is-${regime(values)}" viewBox="0 0 720 470" role="img" aria-labelledby="p52-svg-title p52-svg-desc">
        <title id="p52-svg-title">Superbike on a banked circular corner</title>
        <desc id="p52-svg-desc">The corner radius is ${format(state.radius, 0)} metres and bank angle ${format(state.angle, 0)} degrees. The motorcycle travels at ${format(state.speed, 1)} kilometres per hour. ${regimeLabel(values)}. The no-friction design speed is ${format(values.limits.designKmh, 1)} kilometres per hour and the safe interval is ${format(values.limits.minimumKmh, 1)} to ${format(values.limits.maximumKmh, 1)} kilometres per hour.</desc>
        <defs>
          <marker id="p52-arrow-weight" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p52-arrow-normal" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p52-arrow-friction" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p52-arrow-radial" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <linearGradient id="p52-track-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#59666c"/><stop offset="1" stop-color="#343d42"/></linearGradient>
        </defs>

        <path class="p52-sky" d="M0 0H720V470H0Z"/>
        <path class="p52-ground" d="M0 ${format(leftRoad.y + 22)} L${format(leftRoad.x)} ${format(leftRoad.y)} L${format(rightRoad.x)} ${format(rightRoad.y)} L720 ${format(rightRoad.y - 20)} V390 H0Z"/>
        <line class="p52-road" x1="${format(leftRoad.x)}" y1="${format(leftRoad.y)}" x2="${format(rightRoad.x)}" y2="${format(rightRoad.y)}"/>
        <text class="p52-place-label" x="${format(leftRoad.x + 4)}" y="${format(leftRoad.y + 22)}">inner edge · centre of turn</text>
        <text class="p52-place-label" x="${format(rightRoad.x - 4)}" y="${format(rightRoad.y - 24)}" text-anchor="end">outer edge</text>

        <g class="p52-bike" transform="translate(${centre.x} ${centre.y}) rotate(${-state.angle})" aria-hidden="true">
          <circle cx="-34" cy="-13" r="14"/><circle cx="34" cy="-13" r="14"/>
          <path class="p52-bike-frame" d="M-34-13 L-8-45 L20-17 L-18-17 Z M20-17 L35-44 M10-44 H42"/>
          <path class="p52-bike-fairing" d="M-7-46 Q22-58 38-39 L22-20 H-13Z"/>
          <circle class="p52-rider-head" cx="8" cy="-72" r="12"/>
          <path class="p52-rider" d="M4-60 L-5-42 L18-31 M-3-50 L30-48"/>
        </g>

        <g class="p52-angle" aria-hidden="true"><line x1="${format(leftRoad.x)}" y1="${format(leftRoad.y)}" x2="${format(leftRoad.x + 76)}" y2="${format(leftRoad.y)}"/><path d="M${format(leftRoad.x + 62)} ${format(leftRoad.y)} A62 62 0 0 0 ${format(leftRoad.x + 62 * Math.cos(theta))} ${format(leftRoad.y - 62 * Math.sin(theta))}"/><text x="${format(leftRoad.x + 82)}" y="${format(leftRoad.y - 7)}">θ=${format(state.angle, 0)}°</text></g>

        <g class="p52-basic-force-layer">
          ${forceMarkup(weightLine, "is-weight", "p52-arrow-weight", `mg ${format(MASS * GRAVITY / 1000, 2)} kN`, "start")}
          ${forceMarkup(normalLine, "is-normal", "p52-arrow-normal", `N ${format(values.normal / 1000, 2)} kN`, "end")}
          ${forceMarkup(radialLine, "is-radial", "p52-arrow-radial", `v²/r ${format(values.radialAcceleration, 2)} m/s²`, "end")}
        </g>

        <g class="p52-friction-layer">
          ${Math.abs(values.requiredFriction) > 0.5 ? forceMarkup(frictionLine, "is-friction", "p52-arrow-friction", frictionText, values.requiredFriction > 0 ? "end" : "start") : '<text class="p52-zero-friction" x="458" y="177">f = 0 at design speed</text>'}
        </g>

        <g class="p52-status" transform="translate(480 40)">
          <rect width="202" height="54" rx="13"/><text class="p52-status-kicker" x="101" y="20" text-anchor="middle">CURRENT GRIP STATE</text><text class="p52-status-value" x="101" y="40" text-anchor="middle">${regimeLabel(values)}</text>
        </g>

        <g class="p52-band-layer">
          <text class="p52-band-title" x="78" y="407">Safe speed band · km/h</text>
          <line class="p52-band-base" x1="${scale.left}" y1="${scale.y}" x2="${scale.right}" y2="${scale.y}"/>
          <line class="p52-band-safe" x1="${format(lowX)}" y1="${scale.y}" x2="${format(highX)}" y2="${scale.y}"/>
          <line class="p52-design-tick" x1="${format(designX)}" y1="416" x2="${format(designX)}" y2="444"/>
          <path class="p52-speed-pointer" d="M${format(speedX - 7)} 410 L${format(speedX + 7)} 410 L${format(speedX)} 424 Z"/>
          <text x="${scale.left}" y="456">0</text><text x="${format(lowX)}" y="456" text-anchor="middle">${format(values.limits.minimumKmh, 1)}</text><text class="p52-design-label" x="${format(designX)}" y="400" text-anchor="middle">design ${format(values.limits.designKmh, 1)}</text><text x="${format(highX)}" y="456" text-anchor="middle">${format(values.limits.maximumKmh, 1)}</text><text x="${scale.right}" y="456" text-anchor="end">160</text>
        </g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = cornerFor();
    const gripPercent = Number.isFinite(values.utilization) ? `${format(values.utilization * 100, 0)}%` : "∞";
    const direction = frictionDirection(values) === "none"
      ? "none required"
      : frictionDirection(values) === "down"
        ? "down-bank · inward"
        : "up-bank · outward";
    return `
      <section class="p52-metrics is-${regime(values)}" aria-live="polite">
        <div><span>No-friction design speed</span><strong>${format(values.limits.designKmh, 1)} km/h</strong></div>
        <div><span>Required friction</span><strong>${state.stage >= 1 || state.revealed ? direction : "stage 2"}</strong><small>${state.stage >= 1 || state.revealed ? `${format(Math.abs(values.requiredFriction) / 1000, 2)} kN` : "resolve its sign"}</small></div>
        <div><span>Available grip used</span><strong>${state.stage >= 2 || state.revealed ? gripPercent : "stage 3"}</strong><small>${state.stage >= 2 || state.revealed ? `safe ${format(values.limits.minimumKmh, 1)}–${format(values.limits.maximumKmh, 1)} km/h` : "compare |f| with μN"}</small></div>
        <p><strong>${regimeLabel(values)}.</strong> Positive f is defined down the bank; negative f points up the bank.</p>
      </section>`;
  }

  function controlsMarkup() {
    return `
      <section class="p52-controls" aria-label="Banked corner controls">
        <label for="p52-speed"><span>Speed v<strong data-p52-output="speed">${format(state.speed, 1)} km/h</strong></span><input id="p52-speed" type="range" min="0" max="160" step="0.1" value="${state.speed}"/></label>
        <label for="p52-angle"><span>Bank angle θ<strong data-p52-output="angle">${format(state.angle, 0)}°</strong></span><input id="p52-angle" type="range" min="0" max="35" step="1" value="${state.angle}"/></label>
        <label for="p52-radius"><span>Corner radius r<strong data-p52-output="radius">${format(state.radius, 0)} m</strong></span><input id="p52-radius" type="range" min="20" max="120" step="1" value="${state.radius}"/></label>
        <label for="p52-friction"><span>Tyre friction μ<strong data-p52-output="friction">${format(state.friction, 2)}</strong></span><input id="p52-friction" type="range" min="0" max="0.8" step="0.01" value="${state.friction}"/></label>
        <div class="p52-presets" role="group" aria-label="Corner presets">
          <button class="chip-button" type="button" data-problem-action="p52-challenge">Challenge setup</button>
          <button class="chip-button" type="button" data-problem-action="p52-design">At design speed</button>
          <button class="chip-button" type="button" data-problem-action="p52-below">Below the band</button>
          <button class="chip-button" type="button" data-problem-action="p52-above">Above the band</button>
        </div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p52-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p52-solution" aria-labelledby="p52-solution-heading">
        <h3 id="p52-solution-heading" tabindex="-1">Use down-bank friction at the high limit</h3>
        <p>Let inward horizontal be positive and let f be positive down the bank. The force equations are</p>
        <div class="p52-equation">N cosθ−f sinθ=mg<br>N sinθ+f cosθ=mv²/r</div>
        <p>Solving them gives</p>
        <div class="p52-equation">N=m(g cosθ+v² sinθ/r)<br>f=m(v² cosθ/r−g sinθ)</div>
        <p>At f=0, the bank’s no-friction design speed is</p>
        <div class="p52-equation">v₀=√(rg tanθ)=${format(CHALLENGE_LIMITS.designMetresPerSecond, 4)} m/s=${format(CHALLENGE_LIMITS.designKmh, 2)} km/h</div>
        <p>At higher speed, f is positive: it acts down the bank and inward. At the greatest safe speed set f=μN. With x=v²/(rg):</p>
        <div class="p52-equation">xmax=(sinθ+μ cosθ)/(cosθ−μ sinθ)</div>
        <div class="p52-equation p52-answer-equation">vmax=√(rg xmax)=${format(CHALLENGE_LIMITS.maximumMetresPerSecond, 5)} m/s=${format(CHALLENGE_LIMITS.maximumKmh, 3)} km/h</div>
        <p>So the requested maximum is <strong>${format(CHALLENGE_LIMITS.maximumKmh, 1)} km/h</strong>. The lower grip limit is ${format(CHALLENGE_LIMITS.minimumKmh, 1)} km/h; below the design speed the required friction reverses and acts up the bank.</p>
        <p class="p52-insight"><strong>Checks.</strong> With μ=0 both limits collapse to v₀. With θ=0, vmax=√(μrg), the ordinary flat-road result. The motorcycle mass cancels. Since rg has units m²/s², its square root has units m/s; multiply by 3.6 for km/h.</p>
      </section>`;
  }

  function stateSnapshot() {
    const values = cornerFor();
    return JSON.stringify({
      problem: PROBLEM,
      reconstruction: "title and difficulty only",
      combinedMassKg: MASS,
      speedKmh: state.speed,
      radiusMetres: state.radius,
      bankAngleDegrees: state.angle,
      tyreFrictionCoefficient: state.friction,
      normalForceNewtons: Number(values.normal.toFixed(6)),
      requiredFrictionNewtons: Number(values.requiredFriction.toFixed(6)),
      frictionDirection: frictionDirection(values),
      gripUtilization: Number.isFinite(values.utilization) ? Number(values.utilization.toFixed(6)) : null,
      safeSpeedBandKmh: [Number(values.limits.minimumKmh.toFixed(6)), Number(values.limits.maximumKmh.toFixed(6))],
      motionRegime: regime(values),
      stage: state.stage + 1,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell circ5-shell p52-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circular motion</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread circ5-spread p52-spread">
          <article class="book-page p52-problem-page">
            <div class="problem-number">Problem 5.2</div>
            <h1 class="book-title circ5-title p52-title">Pole position at the superbike races</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            ${reconstructionNote()}
            <p class="problem-copy">A motorcycle and rider of combined mass 250 kg round a banked circular corner. The radius is 50 m, the bank angle is 20°, and the coefficient of sideways tyre friction is 0.25.</p>
            <p class="problem-copy"><strong>What is the maximum speed, in km/h, before the tyres must skid up the bank?</strong></p>
            <section class="p52-continuation-card">
              <strong>Circular-motion continuation</strong>
              <p>The inward acceleration is still v²/r. Banking changes how the normal force and tyre friction combine to supply it.</p>
            </section>
            <section class="p52-sign-card">
              <strong>Sign convention</strong>
              <p>Inward is horizontal towards the corner centre. Friction f is positive down the bank—both inward and downward. A negative f acts up the bank.</p>
            </section>
          </article>

          <section class="book-page book-stage circ5-stage p52-stage">
            ${stageControls()}
            <div class="p52-visual-card"><div data-p52-svg-slot>${bankedCornerSvg()}</div>${stageCaption()}</div>
            ${controlsMarkup()}
            <div data-p52-metrics-slot>${metricsMarkup()}</div>
          </section>

          <aside class="book-page book-coach p52-coach">
            <div class="coach-kicker">Find pole position</div>
            <p class="coach-question">For the stated 50 m, 20°, μ=0.25 corner, what is the high-speed grip limit?</p>
            <form class="p52-answer-form" data-p52-answer-form novalidate>
              <label for="p52-answer">Maximum speed</label>
              <div><input id="p52-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 70" autocomplete="off"/><span>km/h</span></div>
              <button class="primary-button" type="submit">Check maximum speed</button>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p52-help-row">
              <button class="secondary-button" type="button" data-problem-action="p52-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p52-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="circ5-debug">${debugPanel("Development state", stateSnapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p52-shell");
    if (!root) return;
    const svgSlot = root.querySelector("[data-p52-svg-slot]");
    const metricsSlot = root.querySelector("[data-p52-metrics-slot]");
    if (svgSlot) svgSlot.innerHTML = bankedCornerSvg();
    if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = {
      speed: `${format(state.speed, 1)} km/h`,
      angle: `${format(state.angle, 0)}°`,
      radius: `${format(state.radius, 0)} m`,
      friction: format(state.friction, 2),
    };
    Object.entries(outputs).forEach(([key, value]) => {
      const output = root.querySelector(`[data-p52-output="${key}"]`);
      if (output) output.textContent = value;
    });
    const values = cornerFor();
    root.querySelector("#p52-speed")?.setAttribute("aria-valuetext", `${format(state.speed, 1)} kilometres per hour; ${regimeLabel(values)}`);
    root.querySelector("#p52-angle")?.setAttribute("aria-valuetext", `${format(state.angle, 0)} degree bank; design speed ${format(values.limits.designKmh, 1)} kilometres per hour`);
    root.querySelector("#p52-radius")?.setAttribute("aria-valuetext", `${format(state.radius, 0)} metre radius; design speed ${format(values.limits.designKmh, 1)} kilometres per hour`);
    root.querySelector("#p52-friction")?.setAttribute("aria-valuetext", `friction coefficient ${format(state.friction, 2)}; ${regimeLabel(values)}`);
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function restoreChallenge(speed = CHALLENGE_LIMITS.designKmh) {
    state.radius = CHALLENGE.radius;
    state.angle = CHALLENGE.angle;
    state.friction = CHALLENGE.friction;
    state.speed = clamp(speed, 0, 160);
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p52-reset") {
          state = initialState();
          renderAndFocus(renderApp, "#p52-speed");
          return;
        }
        if (action === "p52-stage") {
          state.stage = clamp(Number(control.dataset.p52Stage), 0, 2);
          renderAndFocus(renderApp, `[data-p52-stage="${state.stage}"]`);
          return;
        }
        if (action === "p52-next-stage") {
          state.stage = Math.min(2, state.stage + 1);
          renderAndFocus(renderApp, `[data-p52-stage="${state.stage}"]`);
          return;
        }
        if (action === "p52-challenge") {
          restoreChallenge();
          renderAndFocus(renderApp, "#p52-speed");
          return;
        }
        if (action === "p52-design") {
          state.speed = clamp(speedLimits(state.radius, state.angle, state.friction).designKmh, 0, 160);
          renderAndFocus(renderApp, "#p52-speed");
          return;
        }
        if (action === "p52-below") {
          state.speed = clamp(speedLimits(state.radius, state.angle, state.friction).minimumKmh - 8, 0, 160);
          renderAndFocus(renderApp, "#p52-speed");
          return;
        }
        if (action === "p52-above") {
          state.speed = clamp(speedLimits(state.radius, state.angle, state.friction).maximumKmh + 8, 0, 160);
          renderAndFocus(renderApp, "#p52-speed");
          return;
        }
        if (action === "p52-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p52-reveal") {
          state.revealed = true;
          state.stage = 2;
          restoreChallenge(CHALLENGE_LIMITS.maximumKmh);
        }
        renderApp();
        if (action === "p52-reveal") window.requestAnimationFrame(() => document.querySelector("#p52-solution-heading")?.focus());
      });
    });

    [
      { selector: "#p52-speed", key: "speed", minimum: 0, maximum: 160 },
      { selector: "#p52-angle", key: "angle", minimum: 0, maximum: 35 },
      { selector: "#p52-radius", key: "radius", minimum: 20, maximum: 120 },
      { selector: "#p52-friction", key: "friction", minimum: 0, maximum: 0.8 },
    ].forEach(({ selector, key, minimum, maximum }) => {
      document.querySelector(selector)?.addEventListener("input", (event) => {
        state[key] = clamp(Number(event.target.value), minimum, maximum);
        updateDynamicDom();
      });
    });

    const answerInput = document.querySelector("#p52-answer");
    answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p52-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.answer = sanitizeNumber(answerInput?.value).trim();
      const answer = Number(state.answer);
      const target = CHALLENGE_LIMITS.maximumKmh;
      state.feedbackTone = "warn";
      state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) {
        state.feedback = "Enter one maximum speed in kilometres per hour.";
      } else if (Math.abs(answer - target) <= 0.2) {
        state.feedbackTone = "success";
        state.committed = true;
        state.stage = 2;
        restoreChallenge(target);
        state.feedback = `Correct: the high-speed grip limit is ${format(target, 3)} km/h, about ${format(target, 1)} km/h.`;
      } else if (Math.abs(answer - CHALLENGE_LIMITS.maximumMetresPerSecond) <= 0.2) {
        state.feedback = "That is the correct limiting speed in m/s. Multiply by 3.6 because the requested unit is km/h.";
      } else if (Math.abs(answer - CHALLENGE_LIMITS.designKmh) <= 0.3) {
        state.feedback = "That is the no-friction design speed. The tyres can supply down-bank friction above it, so the maximum is higher.";
      } else {
        state.feedback = "At the maximum speed, friction acts down the bank and has magnitude μN. Use f=+μN, not f=−μN.";
      }
      renderAndFocus(renderApp, "#p52-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
