(function registerWheelWarsOnePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const hints = Object.freeze([
    "Torque is force multiplied by perpendicular distance: τ = Fr. The same torque does not imply the same rim force on differently sized wheels.",
    "Rearrange the moment equation. Each motor's tangential drive-equivalent at the contact is F = τ/r.",
    "The left motor tries to move the contact upward; the right motor tries to move it downward. Compare τₗ/rₗ with τᵣ/rᵣ.",
    "Subtract the opposing drives. Positive means left/up, negative means right/down, and zero is exact balance.",
  ]);
  const stages = Object.freeze([
    { label: "1. Duel", title: "Two counterclockwise motors", copy: "At the shared contact, the left rim tends upward while the right rim tends downward." },
    { label: "2. Translate", title: "Turn torque into tangential drive", copy: "Divide each applied torque by its radius. Radius is the lever arm." },
    { label: "3. Resolve", title: "Subtract the opposing drives", copy: "The sign of Fₗ−Fᵣ determines the no-slip acceleration direction." },
  ]);
  const presets = Object.freeze({
    opening: { label: "Opening duel", leftRadius: 1, leftTorque: 120, rightRadius: 2, rightTorque: 180 },
    equalTorque: { label: "Equal torques", leftRadius: 1, leftTorque: 120, rightRadius: 2, rightTorque: 120 },
    balance: { label: "Exact balance", leftRadius: 1.5, leftTorque: 120, rightRadius: 2.25, rightTorque: 180 },
    rightWins: { label: "Right comeback", leftRadius: 2, leftTorque: 140, rightRadius: 1, rightTorque: 100 },
  });
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p35-reset">Reset</button>';

  const initialState = () => ({
    leftRadius: 1,
    leftTorque: 120,
    rightRadius: 2,
    rightTorque: 180,
    stage: 0,
    prediction: "",
    committed: false,
    feedback: "",
    feedbackTone: "is-neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits });
  }

  function leftDrive() {
    return state.leftTorque / state.leftRadius;
  }

  function rightDrive() {
    return state.rightTorque / state.rightRadius;
  }

  function netDrive() {
    return leftDrive() - rightDrive();
  }

  function outcome() {
    if (Math.abs(netDrive()) < 0.05) return "balance";
    return netDrive() > 0 ? "left" : "right";
  }

  function outcomeCopy(result = outcome()) {
    if (result === "left") return "Left wins · contact accelerates upward";
    if (result === "right") return "Right wins · contact accelerates downward";
    return "Balanced · no angular acceleration from rest";
  }

  function activePreset() {
    return Object.entries(presets).find(([, preset]) => (
      preset.leftRadius === state.leftRadius
      && preset.leftTorque === state.leftTorque
      && preset.rightRadius === state.rightRadius
      && preset.rightTorque === state.rightTorque
    ))?.[0] || "";
  }

  function clearPrediction() {
    state.prediction = "";
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "is-neutral";
    state.revealed = false;
    state.stage = 0;
  }

  function visualRadius(radius) {
    return 62 + ((radius - 0.5) / 2.5) * 56;
  }

  function torqueArc(cx, cy, radius, side) {
    const arcRadius = radius + 18;
    const startX = cx + arcRadius * 0.72;
    const startY = cy + arcRadius * 0.69;
    const endX = cx - arcRadius * 0.72;
    const endY = cy + arcRadius * 0.69;
    return `<path class="p35-torque-arc is-${side}" d="M${startX.toFixed(2)} ${startY.toFixed(2)} A${arcRadius.toFixed(2)} ${arcRadius.toFixed(2)} 0 1 0 ${endX.toFixed(2)} ${endY.toFixed(2)}" marker-end="url(#p35-torque-arrow)" />`;
  }

  function wheelSvg() {
    const leftVisual = visualRadius(state.leftRadius);
    const rightVisual = visualRadius(state.rightRadius);
    const contactX = 330;
    const centreY = 205;
    const leftX = contactX - leftVisual;
    const rightX = contactX + rightVisual;
    const result = outcome();
    const showDrives = state.stage >= 1;
    const showNet = state.stage >= 2;
    return `
      <svg class="p35-wheel-svg is-${result}" viewBox="0 0 660 410" role="img" aria-labelledby="p35-svg-title p35-svg-desc">
        <title id="p35-svg-title">Two motor-driven wheels touching at their rims</title>
        <desc id="p35-svg-desc">The left wheel has radius ${format(state.leftRadius)} metres and torque ${format(state.leftTorque, 0)} newton metres, giving ${format(leftDrive(), 1)} newtons of upward drive-equivalent. The right gives ${format(rightDrive(), 1)} newtons downward. ${outcomeCopy(result)}.</desc>
        <defs>
          <radialGradient id="p35-left-wheel" cx="38%" cy="32%" r="68%"><stop offset="0" stop-color="#a9e3cf"/><stop offset="1" stop-color="#2f7d65"/></radialGradient>
          <radialGradient id="p35-right-wheel" cx="38%" cy="32%" r="68%"><stop offset="0" stop-color="#f3d596"/><stop offset="1" stop-color="#c77b25"/></radialGradient>
          <marker id="p35-torque-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z"/></marker>
          <marker id="p35-drive-up" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 8 4 0 8 8Z"/></marker>
          <marker id="p35-drive-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 4 8 8 0Z"/></marker>
        </defs>
        <line class="p35-ground" x1="30" y1="350" x2="630" y2="350" />
        <g class="p35-wheel is-left"><circle cx="${leftX}" cy="${centreY}" r="${leftVisual}"/><circle class="p35-hub" cx="${leftX}" cy="${centreY}" r="15"/><line x1="${leftX}" y1="${centreY}" x2="${contactX}" y2="${centreY}"/><text x="${leftX}" y="${centreY + 5}" text-anchor="middle">L</text><text class="p35-radius-label" x="${(leftX + contactX) / 2}" y="${centreY - 11}" text-anchor="middle">rₗ = ${format(state.leftRadius)} m</text></g>
        <g class="p35-wheel is-right"><circle cx="${rightX}" cy="${centreY}" r="${rightVisual}"/><circle class="p35-hub" cx="${rightX}" cy="${centreY}" r="15"/><line x1="${contactX}" y1="${centreY}" x2="${rightX}" y2="${centreY}"/><text x="${rightX}" y="${centreY + 5}" text-anchor="middle">R</text><text class="p35-radius-label" x="${(rightX + contactX) / 2}" y="${centreY - 11}" text-anchor="middle">rᵣ = ${format(state.rightRadius)} m</text></g>
        ${torqueArc(leftX, centreY, leftVisual, "left")}${torqueArc(rightX, centreY, rightVisual, "right")}
        <text class="p35-torque-label is-left" x="${leftX}" y="${Math.max(25, centreY - leftVisual - 35)}" text-anchor="middle">τₗ = ${format(state.leftTorque, 0)} N·m · CCW</text>
        <text class="p35-torque-label is-right" x="${rightX}" y="${Math.max(25, centreY - rightVisual - 35)}" text-anchor="middle">τᵣ = ${format(state.rightTorque, 0)} N·m · CCW</text>
        <circle class="p35-contact" cx="${contactX}" cy="${centreY}" r="8"/><text class="p35-contact-label" x="${contactX}" y="${centreY + 31}" text-anchor="middle">no-slip contact</text>
        ${showDrives ? `<g class="p35-drive-arrows" aria-hidden="true"><line class="is-left" x1="${contactX - 13}" y1="${centreY + 70}" x2="${contactX - 13}" y2="${centreY - 70}" marker-end="url(#p35-drive-up)"/><text x="${contactX - 24}" y="${centreY - 76}" text-anchor="end">Fₗ = ${format(leftDrive(), 1)} N</text><line class="is-right" x1="${contactX + 13}" y1="${centreY - 70}" x2="${contactX + 13}" y2="${centreY + 70}" marker-end="url(#p35-drive-down)"/><text x="${contactX + 24}" y="${centreY + 88}">Fᵣ = ${format(rightDrive(), 1)} N</text></g>` : ""}
        ${showNet ? `<g class="p35-net-drive is-${result}" aria-hidden="true">${result === "balance" ? `<line x1="${contactX - 32}" y1="${centreY + 118}" x2="${contactX + 32}" y2="${centreY + 118}"/><text x="${contactX}" y="${centreY + 143}" text-anchor="middle">balanced</text>` : `<line x1="${contactX}" y1="${result === "left" ? centreY + 145 : centreY + 95}" x2="${contactX}" y2="${result === "left" ? centreY + 95 : centreY + 145}" marker-end="url(#p35-drive-${result === "left" ? "up" : "down"})"/><text x="${contactX + 15}" y="${centreY + 128}">net ${format(Math.abs(netDrive()), 1)} N ${result === "left" ? "up" : "down"}</text>`}</g>` : ""}
      </svg>`;
  }

  function stageTabs() {
    return `<div class="p35-stage-tabs" role="group" aria-label="Wheel duel stages">${stages.map((stage, index) => `<button class="chip-button math2-chip ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p35-stage" data-p35-stage="${index}" aria-pressed="${state.stage === index}">${stage.label}</button>`).join("")}</div>`;
  }

  function stepper(key, label, minimum, maximum, step, unit) {
    const value = state[key];
    return `<div class="p35-stepper"><span>${label}</span><div><button type="button" data-problem-action="p35-adjust" data-p35-key="${key}" data-p35-delta="-${step}" aria-label="Decrease ${label}" ${value <= minimum ? "disabled" : ""}>−</button><strong>${format(value, key.includes("Torque") ? 0 : 2)} ${unit}</strong><button type="button" data-problem-action="p35-adjust" data-p35-key="${key}" data-p35-delta="${step}" aria-label="Increase ${label}" ${value >= maximum ? "disabled" : ""}>+</button></div></div>`;
  }

  function wheelControls(side) {
    const left = side === "left";
    return `<section class="p35-wheel-control is-${side}" aria-labelledby="p35-${side}-control-title"><header><span>${left ? "L" : "R"}</span><div><small>${left ? "Left motor" : "Right motor"}</small><h3 id="p35-${side}-control-title">tries contact ${left ? "up" : "down"}</h3></div></header>${stepper(`${side}Radius`, "Radius", 0.5, 3, 0.25, "m")}${stepper(`${side}Torque`, "Applied torque", 20, 240, 10, "N·m")}</section>`;
  }

  function comparisonMarkup() {
    const visible = state.stage >= 1;
    const maximum = Math.max(leftDrive(), rightDrive(), 1);
    return `<div class="p35-comparison ${visible ? "is-visible" : ""}" aria-live="polite"><div class="p35-drive-row is-left"><span>Left · τₗ/rₗ</span><div><i style="width:${visible ? (leftDrive() / maximum) * 100 : 0}%"></i></div><strong>${visible ? `${format(leftDrive(), 1)} N` : "?"}</strong></div><div class="p35-drive-row is-right"><span>Right · τᵣ/rᵣ</span><div><i style="width:${visible ? (rightDrive() / maximum) * 100 : 0}%"></i></div><strong>${visible ? `${format(rightDrive(), 1)} N` : "?"}</strong></div>${state.stage >= 2 ? `<div class="p35-result is-${outcome()}"><span>Fₗ − Fᵣ = ${format(netDrive(), 1)} N</span><strong>${outcomeCopy()}</strong></div>` : ""}</div>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="math2-feedback ${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p35-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="math2-solution p35-solution" aria-labelledby="p35-solution-title"><h3 id="p35-solution-title" tabindex="-1">Radius converts torque into rim drive</h3><p>For a tangential force at a wheel rim, (τ=Fr), so the torque-equivalent tangential drive is</p><div class="math2-equation">F = τ/r.</div><p>Take upward contact displacement as positive. A small compatible no-slip displacement (ds) rotates the left wheel counterclockwise by (ds/rₗ) and the right clockwise by (ds/rᵣ). The motors therefore do net work</p><div class="math2-equation">dW = (τₗ/rₗ − τᵣ/rᵣ)ds.</div><div class="math2-equation p35-final-equation">F<sub>net</sub> = ${format(state.leftTorque, 0)}/${format(state.leftRadius)} − ${format(state.rightTorque, 0)}/${format(state.rightRadius)} = ${format(netDrive(), 1)} N.</div><p>${outcomeCopy()}.</p><p>More formally, ((Iₗ/rₗ²+Iᵣ/rᵣ²)a=F_{net}). Positive inertias affect the acceleration magnitude, not its direction. This model assumes enough static friction to maintain no slip; otherwise the rims slide and a friction limit must be added.</p></section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: "3.5",
      provenance: "independently reconstructed from title and difficulty only",
      assumptions: { frictionlessBearings: true, noSlipContact: true, opposingContactTendencies: true },
      left: { radiusMetres: state.leftRadius, torqueNewtonMetres: state.leftTorque, driveEquivalentNewtons: leftDrive() },
      right: { radiusMetres: state.rightRadius, torqueNewtonMetres: state.rightTorque, driveEquivalentNewtons: rightDrive() },
      netUpwardDriveNewtons: netDrive(),
      outcome: outcome(),
      prediction: state.prediction || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const stage = stages[state.stage];
    const selectedPreset = activePreset();
    return `<main class="book-shell math2-shell p35-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div><div class="book-progress">${problemProgress("3.5")}</div>${problemHeaderActions("3.5", resetMarkup)}</header><div class="book-spread math2-spread p35-spread"><article class="book-page p35-problem-page"><div class="problem-number">Problem 3.5</div><h1 class="book-title math2-title p35-title">The Wheel Wars I</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div><p class="problem-copy">Two wheels touch without slipping and turn on frictionless bearings. Both motors apply counterclockwise torque, so the left rim tries to drive their contact upward while the right rim tries to drive it downward. Which motor wins?</p><p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — the recovered source provides only this title and difficulty. This wheel duel, its wording and its solution are independently written, not Povey’s text.</p><section class="p35-assumptions"><strong>Duel rules</strong><ul><li>The axles hold both wheel centres fixed.</li><li>Static friction is sufficient to prevent slip.</li><li>The wheel bearings add no resisting torque.</li><li>Both wheels begin at rest; “wins” means the initial acceleration direction.</li></ul></section><div class="p35-presets" aria-label="Wheel duel presets">${Object.entries(presets).map(([key, preset]) => `<button class="chip-button math2-chip ${selectedPreset === key ? "active" : ""}" type="button" data-problem-action="p35-preset" data-p35-preset="${key}" aria-pressed="${selectedPreset === key}">${preset.label}</button>`).join("")}</div></article><section class="book-page book-stage math2-stage p35-stage" aria-labelledby="p35-stage-title"><div class="math2-stage-card p35-stage-card">${stageTabs()}<div class="math2-stage-heading"><div><span class="eyebrow">${stage.label}</span><h2 id="p35-stage-title">${stage.title}</h2></div><p>${stage.copy}</p></div><div class="p35-svg-wrap">${wheelSvg()}</div><div class="p35-control-grid">${wheelControls("left")}${wheelControls("right")}</div>${comparisonMarkup()}</div></section><aside class="book-page book-coach p35-coach"><div class="coach-kicker">Call the duel</div><p class="coach-question">With these radii and torques, which way does the common contact accelerate?</p><div class="p35-predictions" role="group" aria-label="Prediction"><button class="p35-prediction ${state.prediction === "left" ? "active" : ""}" type="button" data-problem-action="p35-predict" data-p35-prediction="left" aria-pressed="${state.prediction === "left"}"><strong>Left wins</strong><span>contact moves up</span></button><button class="p35-prediction ${state.prediction === "balance" ? "active" : ""}" type="button" data-problem-action="p35-predict" data-p35-prediction="balance" aria-pressed="${state.prediction === "balance"}"><strong>Balanced</strong><span>no acceleration</span></button><button class="p35-prediction ${state.prediction === "right" ? "active" : ""}" type="button" data-problem-action="p35-predict" data-p35-prediction="right" aria-pressed="${state.prediction === "right"}"><strong>Right wins</strong><span>contact moves down</span></button></div><button class="primary-button p35-commit" type="button" data-problem-action="p35-commit">Commit prediction</button>${feedbackMarkup()}<div class="button-row p35-help-row"><button class="secondary-button" type="button" data-problem-action="p35-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p35-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}${debugPanel("Development state", snapshot())}</aside></div>${problemNav("3.5")}</main>`;
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p35-shell");
    if (!root) return;
    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p35-reset") state = initialState();
        if (action === "p35-stage") {
          state.stage = Math.round(clamp(control.dataset.p35Stage, 0, 2));
          focusSelector = `[data-problem-action="p35-stage"][data-p35-stage="${state.stage}"]`;
        }
        if (action === "p35-preset") {
          const preset = presets[control.dataset.p35Preset];
          if (preset) state = { ...initialState(), ...preset };
          focusSelector = `[data-problem-action="p35-preset"][data-p35-preset="${control.dataset.p35Preset}"]`;
        }
        if (action === "p35-adjust") {
          const key = control.dataset.p35Key;
          const radius = key.includes("Radius");
          const limits = radius ? [0.5, 3] : [20, 240];
          state[key] = radius
            ? Math.round(clamp(state[key] + Number(control.dataset.p35Delta), ...limits) * 4) / 4
            : Math.round(clamp(state[key] + Number(control.dataset.p35Delta), ...limits) / 10) * 10;
          clearPrediction();
          focusSelector = `[data-problem-action="p35-adjust"][data-p35-key="${key}"][data-p35-delta="${control.dataset.p35Delta}"]`;
        }
        if (action === "p35-predict") {
          state.prediction = control.dataset.p35Prediction;
          state.feedback = "";
          focusSelector = `[data-problem-action="p35-predict"][data-p35-prediction="${state.prediction}"]`;
        }
        if (action === "p35-commit") {
          state.committed = false;
          if (!state.prediction) {
            state.feedback = "Choose left, balance or right before committing.";
            state.feedbackTone = "is-warn";
          } else {
            state.committed = true;
            state.stage = Math.max(state.stage, 1);
            if (state.prediction === outcome()) {
              state.feedback = `Correct. ${format(leftDrive(), 1)} N opposes ${format(rightDrive(), 1)} N, so ${outcomeCopy().toLowerCase()}.`;
              state.feedbackTone = "is-success";
              state.stage = 2;
            } else {
              const rawTorqueWinner = Math.abs(state.leftTorque - state.rightTorque) < 0.001 ? "balance" : state.leftTorque > state.rightTorque ? "left" : "right";
              state.feedback = state.prediction === rawTorqueWinner
                ? "That compares torque alone. Divide each torque by its wheel radius before deciding."
                : "Not this time. Translate both torques into tangential drive-equivalents τ/r and compare them.";
              state.feedbackTone = "is-neutral";
            }
          }
          focusSelector = '[data-problem-action="p35-commit"]';
        }
        if (action === "p35-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          state.stage = Math.max(state.stage, Math.min(2, state.hintsUsed));
          focusSelector = '[data-problem-action="p35-hint"]';
        }
        if (action === "p35-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        rerender();
        if (action === "p35-reveal") focusAfterRender("#p35-solution-title");
        else if (focusSelector) focusAfterRender(focusSelector);
      });
    });
  }

  window.poveyProblemPages["3.5"] = { render, bind };
}());
