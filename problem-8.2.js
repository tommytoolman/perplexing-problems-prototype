(function registerUnflinchingAviatorPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "8.2";
  const CHALLENGE = Object.freeze({ airspeed: 200, windEast: 60, targetEast: 0, targetNorth: 120 });
  const CHALLENGE_HEADING_WEST = Math.asin(CHALLENGE.windEast / CHALLENGE.airspeed) * 180 / Math.PI;
  const CHALLENGE_GROUND_SPEED = Math.sqrt(CHALLENGE.airspeed ** 2 - CHALLENGE.windEast ** 2);
  const CHALLENGE_TIME_HOURS = CHALLENGE.targetNorth / CHALLENGE_GROUND_SPEED;
  const stages = Object.freeze([
    Object.freeze({ short: "Track", title: "Aim the ground track at the target", copy: "The target displacement fixes the direction of ground velocity, but not its magnitude." }),
    Object.freeze({ short: "Vectors", title: "Close the velocity triangle", copy: "Aircraft velocity through the air plus wind velocity must equal the required ground velocity." }),
    Object.freeze({ short: "Arrival", title: "Use ground speed for the clock", copy: "Once the velocity triangle closes, divide straight-line target distance by ground-speed magnitude." }),
  ]);
  const hints = Object.freeze([
    "Take east as +x and north as +y. Let heading β be positive east of north, so the air-velocity components are (Va sinβ, Va cosβ).",
    "For the challenge the required ground track is due north, so its east component must be zero: Va sinβ+W=0.",
    "Therefore sinβ=−W/Va=−60/200. The negative sign means west of north.",
    "The heading magnitude is arcsin(0.3). The northward ground speed is √(Va²−W²).",
    "β=−17.4576° in the signed convention: the requested heading is 17.4576° west of north.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p82-reset">Reset</button>';

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 2) { if (!Number.isFinite(value)) return "—"; if (Math.abs(value) < 0.5 * 10 ** -digits) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.+\-\s]/g, "").slice(0, 18); }

  const initialState = () => ({ airspeed: CHALLENGE.airspeed, windEast: CHALLENGE.windEast, targetEast: CHALLENGE.targetEast, targetNorth: CHALLENGE.targetNorth, stage: 0, answer: "", committed: false, feedback: "", feedbackTone: "neutral", hintsUsed: 0, revealed: false });
  let state = initialState();

  function interceptFor(airspeed = state.airspeed, windEast = state.windEast, targetEast = state.targetEast, targetNorth = state.targetNorth) {
    const distance = Math.hypot(targetEast, targetNorth);
    const ux = targetEast / distance, uy = targetNorth / distance;
    const windAlongTrack = windEast * ux;
    const perpendicularWind = windEast * uy;
    const discriminant = airspeed ** 2 - perpendicularWind ** 2;
    if (discriminant < -1e-9) return { feasible: false, distance, ux, uy, windAlongTrack, perpendicularWind, discriminant };
    const groundSpeed = windAlongTrack + Math.sqrt(Math.max(0, discriminant));
    if (groundSpeed <= 1e-9) return { feasible: false, distance, ux, uy, windAlongTrack, perpendicularWind, discriminant, groundSpeed };
    const airEast = groundSpeed * ux - windEast;
    const airNorth = groundSpeed * uy;
    const headingDegrees = Math.atan2(airEast, airNorth) * 180 / Math.PI;
    const groundEast = groundSpeed * ux, groundNorth = groundSpeed * uy;
    const timeHours = distance / groundSpeed;
    return { feasible: true, distance, ux, uy, windAlongTrack, perpendicularWind, discriminant, groundSpeed, airEast, airNorth, headingDegrees, groundEast, groundNorth, timeHours };
  }

  function headingLabel(values = interceptFor()) {
    if (!values.feasible) return "No constant heading reaches this target";
    if (Math.abs(values.headingDegrees) < 0.05) return "due north";
    return `${format(Math.abs(values.headingDegrees), 2)}° ${values.headingDegrees > 0 ? "east" : "west"} of north`;
  }

  function reconstructionNote() {
    return `<p class="kin8-reconstruction-note p82-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and one-star difficulty. This aircraft-and-wind exercise is newly written and does not reproduce the book’s wording, scenario or solution.</p>`;
  }

  function stageControls() { return `<div class="p82-stage-controls" role="group" aria-label="Relative-motion stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p82-stage" data-p82-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaption() { const stage = stages[state.stage]; return `<div class="p82-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p82-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Arrival resolved" : "Next stage"}</button></div>`; }

  function vectorLine(start, vector, scale, className, marker, label, anchor = "middle") {
    const end = { x: start.x + vector.x * scale, y: start.y - vector.y * scale };
    return { end, markup: `<g class="p82-vector ${className}"><line x1="${format(start.x)}" y1="${format(start.y)}" x2="${format(end.x)}" y2="${format(end.y)}" marker-end="url(#${marker})"/><text x="${format((start.x + end.x) / 2)}" y="${format((start.y + end.y) / 2 - 9)}" text-anchor="${anchor}">${label}</text></g>` };
  }

  function flightSvg() {
    const values = interceptFor();
    const start = { x: 260, y: 337 };
    const magnitudeCeiling = values.feasible ? Math.max(300, state.airspeed + Math.abs(state.windEast), values.groundSpeed) : Math.max(300, state.airspeed + Math.abs(state.windEast));
    const scale = 225 / magnitudeCeiling;
    const desiredLength = 225;
    const target = { x: start.x + values.ux * desiredLength, y: start.y - values.uy * desiredLength };
    const groundVector = values.feasible ? { x: values.groundEast, y: values.groundNorth } : { x: values.ux * state.airspeed, y: values.uy * state.airspeed };
    const airVector = values.feasible ? { x: values.airEast, y: values.airNorth } : { x: 0, y: state.airspeed };
    const ground = vectorLine(start, groundVector, scale, "is-ground", "p82-arrow-ground", values.feasible ? `ground ${format(values.groundSpeed, 1)} km/h` : "desired track");
    const air = vectorLine(start, airVector, scale, "is-air", "p82-arrow-air", `air ${format(state.airspeed, 0)} km/h`);
    const wind = vectorLine(air.end, { x: state.windEast, y: 0 }, scale, "is-wind", "p82-arrow-wind", `wind ${signed(state.windEast, 0)} east`);
    return `
      <svg class="p82-svg p82-stage-${state.stage} ${values.feasible ? "is-feasible" : "is-impossible"}" viewBox="0 0 720 445" role="img" aria-labelledby="p82-svg-title p82-svg-desc">
        <title id="p82-svg-title">Aircraft, wind and ground-velocity vector triangle</title>
        <desc id="p82-svg-desc">Aircraft airspeed ${format(state.airspeed, 0)} kilometres per hour, east wind ${signed(state.windEast, 0)} kilometres per hour, target ${signed(state.targetEast, 0)} kilometres east and ${format(state.targetNorth, 0)} kilometres north. ${values.feasible ? `Required heading ${headingLabel(values)}, ground speed ${format(values.groundSpeed, 2)} kilometres per hour and time ${format(values.timeHours * 60, 2)} minutes.` : "No steady heading at this airspeed can reach the target against the perpendicular wind."}</desc>
        <defs><marker id="p82-arrow-track" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker><marker id="p82-arrow-ground" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker><marker id="p82-arrow-air" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker><marker id="p82-arrow-wind" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker></defs>
        <path class="p82-map" d="M20 20H700V425H20Z"/><g class="p82-grid"><path d="M80 70H650M80 140H650M80 210H650M80 280H650M80 350H650M120 40V400M220 40V400M320 40V400M420 40V400M520 40V400M620 40V400"/></g>
        <g class="p82-compass" transform="translate(86 88)"><line x1="0" y1="30" x2="0" y2="-24" marker-end="url(#p82-arrow-track)"/><line x1="-30" y1="0" x2="30" y2="0" marker-end="url(#p82-arrow-track)"/><text x="0" y="-33" text-anchor="middle">N</text><text x="39" y="4">E</text></g>
        <line class="p82-target-track" x1="${start.x}" y1="${start.y}" x2="${format(target.x)}" y2="${format(target.y)}" marker-end="url(#p82-arrow-track)"/>
        <circle class="p82-start" cx="${start.x}" cy="${start.y}" r="7"/><circle class="p82-target" cx="${format(target.x)}" cy="${format(target.y)}" r="10"/>
        <text class="p82-place-label" x="${start.x}" y="${start.y + 24}" text-anchor="middle">start</text><text class="p82-place-label" x="${format(target.x)}" y="${format(target.y - 17)}" text-anchor="middle">target · ${signed(state.targetEast, 0)} km E, ${format(state.targetNorth, 0)} km N</text>
        <g class="p82-vector-layer">${air.markup}${wind.markup}${values.feasible ? ground.markup : ""}</g>
        ${values.feasible ? `<path class="p82-plane" transform="translate(${format(air.end.x)} ${format(air.end.y)}) rotate(${format(values.headingDegrees)})" d="M0-17 L8 13 L0 8 L-8 13Z"/>` : ""}
        <g class="p82-status" transform="translate(470 52)"><rect width="210" height="70" rx="13"/><text class="p82-status-kicker" x="105" y="20" text-anchor="middle">FLIGHT SOLUTION</text><text class="p82-status-value" x="105" y="42" text-anchor="middle">${values.feasible ? headingLabel(values) : "target unreachable"}</text><text class="p82-status-detail" x="105" y="58" text-anchor="middle">${values.feasible ? `${format(values.timeHours * 60, 2)} min to target` : `|crosswind| exceeds airspeed`}</text></g>
        <g class="p82-arrival-layer"><rect x="124" y="382" width="472" height="37" rx="11"/><text x="360" y="405" text-anchor="middle">${values.feasible ? `distance ${format(values.distance, 1)} km ÷ ground speed ${format(values.groundSpeed, 1)} km/h = ${format(values.timeHours * 60, 2)} min` : "No positive ground-speed solution along the required track"}</text></g>
      </svg>`;
  }

  function metricsMarkup() {
    const values = interceptFor();
    return `<section class="p82-metrics ${values.feasible ? "is-feasible" : "is-impossible"}" aria-live="polite"><div><span>Required heading</span><strong>${state.stage >= 1 || state.revealed ? headingLabel(values) : "stage 2"}</strong></div><div><span>Ground speed</span><strong>${values.feasible && (state.stage >= 1 || state.revealed) ? `${format(values.groundSpeed, 2)} km/h` : values.feasible ? "stage 2" : "no solution"}</strong></div><div><span>Flight time</span><strong>${values.feasible && (state.stage >= 2 || state.revealed) ? `${format(values.timeHours * 60, 2)} min` : values.feasible ? "stage 3" : "—"}</strong></div><p><strong>${values.feasible ? "Velocity triangle closes." : "The perpendicular wind is too strong."}</strong> East-positive heading angle: ${values.feasible ? `${signed(values.headingDegrees, 2)}°` : "undefined"}.</p></section>`;
  }

  function controlsMarkup() {
    return `<section class="p82-controls" aria-label="Aircraft relative-motion controls"><label for="p82-air"><span>Airspeed Va<strong data-p82-output="air">${format(state.airspeed, 0)} km/h</strong></span><input id="p82-air" type="range" min="100" max="350" step="5" value="${state.airspeed}"/></label><label for="p82-wind"><span>Wind east component W<strong data-p82-output="wind">${signed(state.windEast, 0)} km/h</strong></span><input id="p82-wind" type="range" min="-250" max="250" step="5" value="${state.windEast}"/></label><label for="p82-east"><span>Target east displacement<strong data-p82-output="east">${signed(state.targetEast, 0)} km</strong></span><input id="p82-east" type="range" min="-100" max="100" step="5" value="${state.targetEast}"/></label><label for="p82-north"><span>Target north displacement<strong data-p82-output="north">${format(state.targetNorth, 0)} km</strong></span><input id="p82-north" type="range" min="50" max="250" step="5" value="${state.targetNorth}"/></label><div class="p82-presets" role="group" aria-label="Flight presets"><button class="chip-button" type="button" data-problem-action="p82-challenge">Challenge setup</button><button class="chip-button" type="button" data-problem-action="p82-zero-wind">Zero wind</button><button class="chip-button" type="button" data-problem-action="p82-strong-wind">Unreachable crosswind</button><button class="chip-button" type="button" data-problem-action="p82-offset">Offset target</button></div><p>Signs: east is positive. A positive wind blows east; a negative heading is west of north.</p></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p82-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p82-solution" aria-labelledby="p82-solution-heading"><h3 id="p82-solution-heading" tabindex="-1">Cancel the wind before starting the clock</h3><p>Take east and north as the x and y directions. If β is positive east of north:</p><div class="p82-equation">vair=(Va sinβ, Va cosβ), &nbsp; vwind=(W,0)</div><p>The required challenge track is due north, so its east component is zero:</p><div class="p82-equation">Va sinβ+W=0 &nbsp;⇒&nbsp; sinβ=−60/200=−0.3</div><div class="p82-equation p82-answer-equation">β=−17.457603° &nbsp;⇒&nbsp; heading ${format(CHALLENGE_HEADING_WEST, 6)}° west of north</div><p>The northward ground speed and time are</p><div class="p82-equation">vg=√(Va²−W²)=${format(CHALLENGE_GROUND_SPEED, 6)} km/h<br>t=120/vg=${format(CHALLENGE_TIME_HOURS, 6)} h=${format(CHALLENGE_TIME_HOURS * 60, 4)} min</div><p>For an offset target with unit direction u, the interactive generalisation solves |qu−w|=Va:</p><div class="p82-equation">q=w·u+√[Va²−|w⊥|²]</div><p class="p82-insight"><strong>Checks.</strong> With zero wind, the heading points directly at the target and ground speed equals airspeed. For a due-north target, |W|=Va makes northward ground speed zero; stronger crosswind makes the track impossible. Adding velocity components in km/h and dividing a distance in km by the result gives time in hours.</p></section>`;
  }

  function stateSnapshot() { const values = interceptFor(); return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", airspeedKmh: state.airspeed, windEastKmh: state.windEast, targetEastKm: state.targetEast, targetNorthKm: state.targetNorth, feasible: values.feasible, headingDegreesEastOfNorth: values.feasible ? Number(values.headingDegrees.toFixed(6)) : null, groundSpeedKmh: values.feasible ? Number(values.groundSpeed.toFixed(6)) : null, flightTimeMinutes: values.feasible ? Number((values.timeHours * 60).toFixed(6)) : null, perpendicularWindKmh: Number(values.perpendicularWind.toFixed(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2); }

  function render() {
    return `<main class="book-shell kin8-shell p82-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive kinematics</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread kin8-spread p82-spread"><article class="book-page p82-problem-page"><div class="problem-number">Problem 8.2</div><h1 class="book-title kin8-title p82-title">The Unflinching Aviator</h1><div class="difficulty" aria-label="One star difficulty">★</div>${reconstructionNote()}<p class="problem-copy">An aircraft must reach a point 120 km due north. Its speed through the air is 200 km/h and a steady wind blows east at 60 km/h.</p><p class="problem-copy"><strong>How many degrees west of north must the pilot head to maintain a due-north ground track?</strong></p><section class="p82-sign-card"><strong>Signed directions</strong><p>East and north are positive. Heading β is measured east of north, so a westward correction has negative β. The answer box requests the positive magnitude west of north.</p></section><section class="p82-model-card"><strong>Steady-vector model</strong><p>Airspeed and wind are constant, Earth curvature is ignored, and the pilot chooses one constant heading directly to the target.</p></section></article><section class="book-page book-stage kin8-stage p82-stage">${stageControls()}<div class="p82-visual-card"><div data-p82-svg-slot>${flightSvg()}</div>${stageCaption()}</div>${controlsMarkup()}<div data-p82-metrics-slot>${metricsMarkup()}</div></section><aside class="book-page book-coach p82-coach"><div class="coach-kicker">Hold the ground track</div><p class="coach-question">For the fixed due-north challenge, give the heading correction as a positive number of degrees west of north.</p><form class="p82-answer-form" data-p82-answer-form novalidate><label for="p82-answer">Heading west of north</label><div><input id="p82-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="e.g. 18" autocomplete="off"/><span>° west</span></div><button class="primary-button" type="submit">Check the heading</button></form>${feedbackMarkup()}<div class="button-row p82-help-row"><button class="secondary-button" type="button" data-problem-action="p82-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p82-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="kin8-debug">${debugPanel("Development state", stateSnapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p82-shell"); if (!root) return;
    const svgSlot = root.querySelector("[data-p82-svg-slot]"), metricsSlot = root.querySelector("[data-p82-metrics-slot]"); if (svgSlot) svgSlot.innerHTML = flightSvg(); if (metricsSlot) metricsSlot.innerHTML = metricsMarkup();
    const outputs = { air: `${format(state.airspeed, 0)} km/h`, wind: `${signed(state.windEast, 0)} km/h`, east: `${signed(state.targetEast, 0)} km`, north: `${format(state.targetNorth, 0)} km` };
    Object.entries(outputs).forEach(([key, value]) => { const node = root.querySelector(`[data-p82-output="${key}"]`); if (node) node.textContent = value; });
    const values = interceptFor();
    root.querySelector("#p82-air")?.setAttribute("aria-valuetext", `${format(state.airspeed, 0)} kilometres per hour airspeed; ${values.feasible ? headingLabel(values) : "target unreachable"}`);
    root.querySelector("#p82-wind")?.setAttribute("aria-valuetext", `${signed(state.windEast, 0)} kilometres per hour east wind; ${values.feasible ? headingLabel(values) : "target unreachable"}`);
    root.querySelector("#p82-east")?.setAttribute("aria-valuetext", `${signed(state.targetEast, 0)} kilometre east target displacement; ${values.feasible ? headingLabel(values) : "target unreachable"}`);
    root.querySelector("#p82-north")?.setAttribute("aria-valuetext", `${format(state.targetNorth, 0)} kilometre north target displacement; ${values.feasible ? `${format(values.timeHours * 60, 2)} minutes` : "target unreachable"}`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function restoreChallenge() { state.airspeed = CHALLENGE.airspeed; state.windEast = CHALLENGE.windEast; state.targetEast = CHALLENGE.targetEast; state.targetNorth = CHALLENGE.targetNorth; }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p82-reset") { state = initialState(); renderAndFocus(renderApp, "#p82-air"); return; }
      if (action === "p82-stage") { state.stage = clamp(Number(control.dataset.p82Stage), 0, 2); renderAndFocus(renderApp, `[data-p82-stage="${state.stage}"]`); return; }
      if (action === "p82-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p82-stage="${state.stage}"]`); return; }
      if (action === "p82-challenge") { restoreChallenge(); renderAndFocus(renderApp, "#p82-air"); return; }
      if (action === "p82-zero-wind") { state.windEast = 0; renderAndFocus(renderApp, "#p82-wind"); return; }
      if (action === "p82-strong-wind") { state.airspeed = 180; state.windEast = 240; state.targetEast = 0; state.targetNorth = 120; renderAndFocus(renderApp, "#p82-wind"); return; }
      if (action === "p82-offset") { state.targetEast = 70; state.targetNorth = 120; renderAndFocus(renderApp, "#p82-east"); return; }
      if (action === "p82-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p82-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p82-reveal") window.requestAnimationFrame(() => document.querySelector("#p82-solution-heading")?.focus());
    }));
    [{ selector: "#p82-air", key: "airspeed", min: 100, max: 350 }, { selector: "#p82-wind", key: "windEast", min: -250, max: 250 }, { selector: "#p82-east", key: "targetEast", min: -100, max: 100 }, { selector: "#p82-north", key: "targetNorth", min: 50, max: 250 }].forEach(({ selector, key, min, max }) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), min, max); updateDynamicDom(); }));
    const answerInput = document.querySelector("#p82-answer"); answerInput?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p82-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(answerInput?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one heading magnitude in degrees west of north.";
      else if (Math.abs(answer - CHALLENGE_HEADING_WEST) <= 0.06) { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: ${format(CHALLENGE_HEADING_WEST, 6)}° west of north. Ground speed is ${format(CHALLENGE_GROUND_SPEED, 3)} km/h and flight time ${format(CHALLENGE_TIME_HOURS * 60, 3)} min.`; }
      else if (Math.abs(answer + CHALLENGE_HEADING_WEST) <= 0.06) state.feedback = "That is the correct signed angle β, but the answer box asks for the positive magnitude in degrees west of north.";
      else state.feedback = "Cancel the east wind component: 200 sinβ+60=0. The signed β is negative because the pilot points west.";
      renderAndFocus(renderApp, "#p82-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
