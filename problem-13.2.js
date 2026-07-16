(function registerGalileoBalancePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "13.2";
  const G = 9.81;
  const CHALLENGE = Object.freeze({ leftMassKg: 2, rightMassKg: 2, leftVolumeCm3: 800, rightVolumeCm3: 200, leftArmM: .4, rightArmM: .4, fluidDensity: 1000, fluidName: "Water", submersion: "both" });
  const FLUIDS = Object.freeze({ oil: Object.freeze({ name: "Oil", density: 800 }), water: Object.freeze({ name: "Water", density: 1000 }), seawater: Object.freeze({ name: "Seawater", density: 1025 }), glycerin: Object.freeze({ name: "Glycerin", density: 1260 }) });
  const stages = Object.freeze([
    Object.freeze({ short: "Air", title: "Balance ordinary weights first", copy: "In air, each hanger transmits approximately mg. Equal masses at equal arms balance even when the objects have different volumes and densities." }),
    Object.freeze({ short: "Buoyancy", title: "Subtract displaced-fluid weight", copy: "A fully submerged object receives upward buoyancy FB=ρfluidgV, reducing its downward hanger load to Fapp=mg−FB." }),
    Object.freeze({ short: "Torque", title: "Rebalance the changed apparent loads", copy: "The beam balances when Fleft rleft=Fright rright. A shift changes leverage; an added air counterweight changes load." }),
  ]);
  const hints = Object.freeze([
    "In water, the 800 cm³ left object displaces 0.800 kg of water; the 200 cm³ right object displaces 0.200 kg.",
    "Their apparent downward loads are g(2.00−0.800) and g(2.00−0.200), respectively.",
    "Keep the right arm at 0.400 m and solve Fleft rleft=Fright(0.400 m).",
    "The factor g cancels: rleft=[(1.8)/(1.2)](0.400 m).",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p132-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; return Number(value.toFixed(digits)).toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.eE+\-\s]/g, "").slice(0, 20); }

  function balanceData(
    leftMassKg = state.leftMassKg,
    rightMassKg = state.rightMassKg,
    leftVolumeCm3 = state.leftVolumeCm3,
    rightVolumeCm3 = state.rightVolumeCm3,
    leftArmM = state.leftArmM,
    rightArmM = state.rightArmM,
    fluidDensity = state.fluidDensity,
    submersion = state.submersion,
  ) {
    const leftVolume = leftVolumeCm3 * 1e-6;
    const rightVolume = rightVolumeCm3 * 1e-6;
    const leftSubmerged = submersion === "left" || submersion === "both";
    const rightSubmerged = submersion === "right" || submersion === "both";
    const leftWeight = leftMassKg * G;
    const rightWeight = rightMassKg * G;
    const leftBuoyancy = leftSubmerged ? fluidDensity * G * leftVolume : 0;
    const rightBuoyancy = rightSubmerged ? fluidDensity * G * rightVolume : 0;
    const leftLoad = leftWeight - leftBuoyancy;
    const rightLoad = rightWeight - rightBuoyancy;
    const leftTorque = leftLoad * leftArmM;
    const rightTorque = rightLoad * rightArmM;
    const torqueResidual = rightTorque - leftTorque;
    const requiredLeftArm = leftLoad > 0 ? rightTorque / leftLoad : Infinity;
    const requiredRightArm = rightLoad > 0 ? leftTorque / rightLoad : Infinity;
    const leftShift = requiredLeftArm - leftArmM;
    const rightShift = requiredRightArm - rightArmM;
    const counterweightSide = torqueResidual >= 0 ? "left" : "right";
    const counterweightArm = torqueResidual >= 0 ? leftArmM : rightArmM;
    const counterweightMass = Math.abs(torqueResidual) / (G * counterweightArm);
    return {
      leftVolume,
      rightVolume,
      leftSubmerged,
      rightSubmerged,
      leftWeight,
      rightWeight,
      leftBuoyancy,
      rightBuoyancy,
      leftLoad,
      rightLoad,
      leftTorque,
      rightTorque,
      torqueResidual,
      requiredLeftArm,
      requiredRightArm,
      leftShift,
      rightShift,
      counterweightSide,
      counterweightMass,
      leftObjectDensity: leftMassKg / leftVolume,
      rightObjectDensity: rightMassKg / rightVolume,
      balanced: Math.abs(torqueResidual) < 1e-8,
      leftForceResidual: leftLoad - leftWeight + leftBuoyancy,
      rightForceResidual: rightLoad - rightWeight + rightBuoyancy,
    };
  }

  const challengeValues = balanceData(CHALLENGE.leftMassKg, CHALLENGE.rightMassKg, CHALLENGE.leftVolumeCm3, CHALLENGE.rightVolumeCm3, CHALLENGE.leftArmM, CHALLENGE.rightArmM, CHALLENGE.fluidDensity, CHALLENGE.submersion);

  function reconstructionNote() {
    return `<p class="p132-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This buoyant-balance investigation is newly written and does not reproduce the book’s wording, diagram or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p132-stage-controls" role="group" aria-label="Balance puzzle reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p132-stage" data-p132-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p132-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p132-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Balance solved" : "Next stage"}</button></div>`;
  }

  function submersionLabel() {
    if (state.submersion === "none") return "Neither submerged";
    if (state.submersion === "left") return "Left submerged";
    if (state.submersion === "right") return "Right submerged";
    return "Both submerged";
  }

  function balanceSvg() {
    const values = balanceData();
    const buoyancyVisible = state.stage >= 1 || state.revealed;
    const torqueVisible = state.stage >= 2 || state.revealed;
    const pivotX = 360, pivotY = 143;
    const hangLeftX = pivotX - 238 * state.leftArmM;
    const hangRightX = pivotX + 238 * state.rightArmM;
    const airTorqueResidual = values.rightWeight * state.rightArmM - values.leftWeight * state.leftArmM;
    const displayedTorqueResidual = state.stage === 0 && !state.revealed ? airTorqueResidual : values.torqueResidual;
    const tilt = clamp(displayedTorqueResidual / 4, -1, 1) * 16;
    const beamY = (x) => pivotY + tilt * (x - pivotX) / 238;
    const leftY = beamY(hangLeftX), rightY = beamY(hangRightX);
    const leftSize = 24 + 24 * state.leftVolumeCm3 / 900;
    const rightSize = 24 + 24 * state.rightVolumeCm3 / 900;
    const statusValue = state.stage === 0 ? `air masses ${format(state.leftMassKg, 2)} / ${format(state.rightMassKg, 2)} kg` : state.stage === 1 ? `loads ${format(values.leftLoad, 3)} / ${format(values.rightLoad, 3)} N` : values.balanced ? "TORQUES BALANCED" : `${values.torqueResidual > 0 ? "RIGHT" : "LEFT"} SIDE DESCENDS`;
    const descriptionDetail = `${buoyancyVisible ? ` Apparent downward loads are ${format(values.leftLoad, 4)} newtons left and ${format(values.rightLoad, 4)} newtons right.` : ""}${torqueVisible ? ` Right minus left torque is ${format(values.torqueResidual, 5)} newton metres and the required left arm is ${format(values.requiredLeftArm, 5)} metres.` : ""}`;
    return `<svg class="p132-svg p132-stage-${state.stage} ${values.balanced ? "is-balanced" : values.torqueResidual > 0 ? "is-right-heavy" : "is-left-heavy"}" viewBox="0 0 720 445" role="img" aria-labelledby="p132-svg-title p132-svg-desc"><title id="p132-svg-title">Two-arm balance with optional fluid buoyancy</title><desc id="p132-svg-desc">The left object is ${format(state.leftMassKg, 2)} kilograms and ${format(state.leftVolumeCm3, 0)} cubic centimetres at arm ${format(state.leftArmM, 3)} metres. The right is ${format(state.rightMassKg, 2)} kilograms and ${format(state.rightVolumeCm3, 0)} cubic centimetres at arm ${format(state.rightArmM, 3)} metres. ${submersionLabel()} in ${state.fluidName.toLowerCase()}.${descriptionDetail}</desc><defs><linearGradient id="p132-fluid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#84cce0" stop-opacity=".55"/><stop offset="1" stop-color="#2b82a3" stop-opacity=".72"/></linearGradient><marker id="p132-up-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><marker id="p132-down-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker></defs><rect class="p132-board" x="1" y="1" width="718" height="443" rx="20"/><g class="p132-balance" aria-hidden="true"><path class="p132-stand" d="M360 151L318 282H402Z"/><line class="p132-beam" x1="75" y1="${format(beamY(75), 2)}" x2="645" y2="${format(beamY(645), 2)}"/><circle class="p132-pivot" cx="${pivotX}" cy="${pivotY}" r="11"/><line class="p132-left-string" x1="${format(hangLeftX, 2)}" y1="${format(leftY, 2)}" x2="${format(hangLeftX, 2)}" y2="${format(leftY + 99, 2)}"/><line class="p132-right-string" x1="${format(hangRightX, 2)}" y1="${format(rightY, 2)}" x2="${format(hangRightX, 2)}" y2="${format(rightY + 99, 2)}"/><text class="p132-arm-label" x="${format((pivotX + hangLeftX) / 2, 2)}" y="${format(beamY((pivotX + hangLeftX) / 2) - 12, 2)}" text-anchor="middle">${format(state.leftArmM, 2)} m</text><text class="p132-arm-label" x="${format((pivotX + hangRightX) / 2, 2)}" y="${format(beamY((pivotX + hangRightX) / 2) - 12, 2)}" text-anchor="middle">${format(state.rightArmM, 2)} m</text>${values.leftSubmerged ? `<g class="p132-tank"><path d="M${format(hangLeftX - 68, 2)} ${format(leftY + 55, 2)}V${format(leftY + 179, 2)}H${format(hangLeftX + 68, 2)}V${format(leftY + 55, 2)}"/><rect x="${format(hangLeftX - 65, 2)}" y="${format(leftY + 65, 2)}" width="130" height="110" fill="url(#p132-fluid)"/></g>` : ""}${values.rightSubmerged ? `<g class="p132-tank"><path d="M${format(hangRightX - 68, 2)} ${format(rightY + 55, 2)}V${format(rightY + 179, 2)}H${format(hangRightX + 68, 2)}V${format(rightY + 55, 2)}"/><rect x="${format(hangRightX - 65, 2)}" y="${format(rightY + 65, 2)}" width="130" height="110" fill="url(#p132-fluid)"/></g>` : ""}<rect class="p132-left-object" x="${format(hangLeftX - leftSize / 2, 2)}" y="${format(leftY + 91, 2)}" width="${format(leftSize, 2)}" height="${format(leftSize, 2)}" rx="5"/><rect class="p132-right-object" x="${format(hangRightX - rightSize / 2, 2)}" y="${format(rightY + 91, 2)}" width="${format(rightSize, 2)}" height="${format(rightSize, 2)}" rx="5"/><text class="p132-object-label" x="${format(hangLeftX, 2)}" y="${format(leftY + 204, 2)}" text-anchor="middle">L ${format(state.leftMassKg, 1)} kg · ${format(state.leftVolumeCm3, 0)} cm³</text><text class="p132-object-label" x="${format(hangRightX, 2)}" y="${format(rightY + 204, 2)}" text-anchor="middle">R ${format(state.rightMassKg, 1)} kg · ${format(state.rightVolumeCm3, 0)} cm³</text><line class="p132-left-weight" x1="${format(hangLeftX - 17, 2)}" y1="${format(leftY + 99, 2)}" x2="${format(hangLeftX - 17, 2)}" y2="${format(leftY + 145, 2)}" marker-end="url(#p132-down-arrow)"/><line class="p132-right-weight" x1="${format(hangRightX + 17, 2)}" y1="${format(rightY + 99, 2)}" x2="${format(hangRightX + 17, 2)}" y2="${format(rightY + 145, 2)}" marker-end="url(#p132-down-arrow)"/>${values.leftSubmerged ? `<line class="p132-left-buoyancy" x1="${format(hangLeftX + 17, 2)}" y1="${format(leftY + 145, 2)}" x2="${format(hangLeftX + 17, 2)}" y2="${format(leftY + 107, 2)}" marker-end="url(#p132-up-arrow)"/>` : ""}${values.rightSubmerged ? `<line class="p132-right-buoyancy" x1="${format(hangRightX - 17, 2)}" y1="${format(rightY + 145, 2)}" x2="${format(hangRightX - 17, 2)}" y2="${format(rightY + 107, 2)}" marker-end="url(#p132-up-arrow)"/>` : ""}</g><g class="p132-status" aria-hidden="true" transform="translate(20 20)"><rect width="270" height="70" rx="13"/><text class="p132-status-kicker" x="15" y="21">${submersionLabel().toUpperCase()} · ${state.fluidName.toUpperCase()}</text><text class="p132-status-value" x="15" y="46">${statusValue}</text><text class="p132-status-note" x="15" y="62">fluid density ${format(state.fluidDensity, 0)} kg/m³</text></g><g class="p132-load-card" aria-hidden="true" transform="translate(20 342)"><rect width="213" height="77" rx="13"/><text class="p132-card-kicker" x="15" y="22">APPARENT DOWNWARD LOADS</text><text class="p132-card-value" x="15" y="48">L ${buoyancyVisible ? format(values.leftLoad, 3) : "stage 2"} N</text><text class="p132-card-value" x="198" y="48" text-anchor="end">R ${buoyancyVisible ? format(values.rightLoad, 3) : "stage 2"} N</text><text class="p132-card-note" x="15" y="66">Fapp=mg−ρfluidgV when submerged</text></g><g class="p132-torque-card" aria-hidden="true" transform="translate(253 342)"><rect width="213" height="77" rx="13"/><text class="p132-card-kicker" x="15" y="22">TORQUES ABOUT PIVOT</text><text class="p132-card-value" x="15" y="48">L ${torqueVisible ? format(values.leftTorque, 3) : "stage 3"}</text><text class="p132-card-value" x="198" y="48" text-anchor="end">R ${torqueVisible ? format(values.rightTorque, 3) : "stage 3"} N·m</text><text class="p132-card-note" x="15" y="66">right−left ${torqueVisible ? format(values.torqueResidual, 4) : "—"} N·m</text></g><g class="p132-solve-card" aria-hidden="true" transform="translate(486 342)"><rect width="214" height="77" rx="13"/><text class="p132-card-kicker" x="15" y="22">TWO WAYS TO REBALANCE</text><text class="p132-solve-value" x="15" y="45">left arm ${torqueVisible ? `${format(values.requiredLeftArm, 4)} m` : "stage 3"}</text><text class="p132-card-note" x="15" y="65">or add ${torqueVisible ? `${format(values.counterweightMass, 4)} kg on ${values.counterweightSide}` : "an air counterweight"}</text></g></svg>`;
  }

  function metricsMarkup() {
    const values = balanceData();
    const buoyancyVisible = state.stage >= 1 || state.revealed;
    const torqueVisible = state.stage >= 2 || state.revealed;
    return `<section class="p132-metrics" aria-live="polite"><div><span>Left object density</span><strong>${format(values.leftObjectDensity, 0)} kg/m³</strong></div><div><span>Right object density</span><strong>${format(values.rightObjectDensity, 0)} kg/m³</strong></div><div><span>Left buoyancy</span><strong>${buoyancyVisible ? `${format(values.leftBuoyancy, 3)} N` : "stage 2"}</strong></div><div><span>Right buoyancy</span><strong>${buoyancyVisible ? `${format(values.rightBuoyancy, 3)} N` : "stage 2"}</strong></div><div><span>Right−left torque</span><strong>${torqueVisible ? `${format(values.torqueResidual, 5)} N·m` : "stage 3"}</strong></div><div><span>Required left arm</span><strong>${torqueVisible ? `${format(values.requiredLeftArm, 5)} m` : "stage 3"}</strong></div>${torqueVisible ? `<p>${values.balanced ? "The current torques balance." : `The ${values.torqueResidual > 0 ? "right" : "left"} side descends. Move the left hanger by ${format(Math.abs(values.leftShift), 4)} m ${values.leftShift >= 0 ? "outward" : "inward"}, or add ${format(values.counterweightMass, 4)} kg in air to the ${values.counterweightSide} at its current arm.`} Force residuals: L ${values.leftForceResidual.toExponential(1)} N, R ${values.rightForceResidual.toExponential(1)} N.</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p132-dynamic">${balanceSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p132-controls" aria-label="Buoyant balance controls"><div class="p132-submersion-picker" role="group" aria-label="Choose submerged objects">${[["none","Neither"],["left","Left only"],["right","Right only"],["both","Both"]].map(([key,label])=>`<button class="chip-button ${state.submersion===key?"active":""}" type="button" data-problem-action="p132-submersion" data-p132-submersion="${key}" aria-pressed="${state.submersion===key}">${label}</button>`).join("")}</div><div class="p132-fluid-picker" role="group" aria-label="Choose fluid">${Object.entries(FLUIDS).map(([key,fluid])=>`<button class="chip-button ${state.fluidName===fluid.name?"active":""}" type="button" data-problem-action="p132-fluid" data-p132-fluid="${key}" aria-pressed="${state.fluidName===fluid.name}">${fluid.name}</button>`).join("")}</div><div class="p132-control-grid"><label for="p132-left-mass"><span>Left mass<output data-p132-output="left-mass">${format(state.leftMassKg, 2)} kg</output></span><input id="p132-left-mass" type="range" min="1.2" max="5" step="0.1" value="${state.leftMassKg}"/></label><label for="p132-right-mass"><span>Right mass<output data-p132-output="right-mass">${format(state.rightMassKg, 2)} kg</output></span><input id="p132-right-mass" type="range" min="1.2" max="5" step="0.1" value="${state.rightMassKg}"/></label><label for="p132-left-volume"><span>Left volume<output data-p132-output="left-volume">${format(state.leftVolumeCm3, 0)} cm³</output></span><input id="p132-left-volume" type="range" min="50" max="900" step="50" value="${state.leftVolumeCm3}"/></label><label for="p132-right-volume"><span>Right volume<output data-p132-output="right-volume">${format(state.rightVolumeCm3, 0)} cm³</output></span><input id="p132-right-volume" type="range" min="50" max="900" step="50" value="${state.rightVolumeCm3}"/></label><label for="p132-left-arm"><span>Left arm<output data-p132-output="left-arm">${format(state.leftArmM, 2)} m</output></span><input id="p132-left-arm" type="range" min="0.1" max="1" step="0.05" value="${state.leftArmM}"/></label><label for="p132-right-arm"><span>Right arm<output data-p132-output="right-arm">${format(state.rightArmM, 2)} m</output></span><input id="p132-right-arm" type="range" min="0.1" max="1" step="0.05" value="${state.rightArmM}"/></label><label class="p132-density-control" for="p132-density"><span>Fluid density<output data-p132-output="density">${state.fluidName} · ${format(state.fluidDensity, 0)} kg/m³</output></span><input id="p132-density" type="range" min="600" max="1300" step="10" value="${state.fluidDensity}"/></label></div><p>Changing the density slider creates a custom ideal fluid. The containers are supported separately from the balance, so only each object’s hanger force acts on the beam.</p><div class="p132-presets"><button class="chip-button" type="button" data-problem-action="p132-preset" data-p132-preset="challenge">Water challenge</button><button class="chip-button" type="button" data-problem-action="p132-preset" data-p132-preset="air">Balanced in air</button><button class="chip-button" type="button" data-problem-action="p132-preset" data-p132-preset="left">Left submerged</button><button class="chip-button" type="button" data-problem-action="p132-preset" data-p132-preset="rebalance">Rebalanced shift</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p132-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p132-solution" aria-labelledby="p132-solution-heading"><h3 id="p132-solution-heading" tabindex="-1">Equal true weights do not mean equal submerged loads</h3><p>In water, the displaced-fluid masses are 1000(800×10⁻⁶)=0.800 kg on the left and 0.200 kg on the right. Thus</p><div class="p132-solution-equation">Fleft=g(2.00−0.800)=1.20g=${format(challengeValues.leftLoad, 3)} N<br>Fright=g(2.00−0.200)=1.80g=${format(challengeValues.rightLoad, 3)} N</div><p>Keep the right hanger at 0.400 m and impose torque balance:</p><div class="p132-solution-equation">Fleft rleft=Fright(0.400)<br>rleft=(1.80/1.20)(0.400)<br>rleft=${format(challengeValues.requiredLeftArm, 6)} m</div><p>The left object moves outward by 0.200 m. At the original 0.400 m left arm, an alternative is an additional air counterweight of ${format(challengeValues.counterweightMass, 6)} kg.</p><p class="p132-checks"><strong>Checks and assumptions.</strong> With neither object submerged, equal 2.00 kg masses at equal arms balance and object volume is irrelevant. If equal-volume, equal-mass objects are both submerged in the same fluid, buoyancy is equal and balance remains. Setting fluid density to zero recovers the air result. Units: ρgV is kg/m³·m/s²·m³=N, and force times arm is N·m; g cancels from the arm ratio. The beam, pivot and hangers are ideal and massless; air buoyancy is neglected; objects are rigid, fully submerged, not touching containers, and remain denser than the selectable fluids; fluid density and g are uniform; surface tension and displaced-fluid dynamics are omitted. Fluid vessels are externally supported and transmit no direct torque to the beam.</p></section>`;
  }

  function snapshot() {
    const values = balanceData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", gravitationalAccelerationMetresPerSecondSquared: G, submersion: state.submersion, fluid: state.fluidName, fluidDensityKilogramsPerCubicMetre: state.fluidDensity, left: { massKilograms: state.leftMassKg, volumeCubicCentimetres: state.leftVolumeCm3, armMetres: state.leftArmM, densityKilogramsPerCubicMetre: Number(values.leftObjectDensity.toFixed(6)), buoyancyNewtons: Number(values.leftBuoyancy.toFixed(8)), apparentDownwardLoadNewtons: Number(values.leftLoad.toFixed(8)), torqueNewtonMetres: Number(values.leftTorque.toFixed(8)) }, right: { massKilograms: state.rightMassKg, volumeCubicCentimetres: state.rightVolumeCm3, armMetres: state.rightArmM, densityKilogramsPerCubicMetre: Number(values.rightObjectDensity.toFixed(6)), buoyancyNewtons: Number(values.rightBuoyancy.toFixed(8)), apparentDownwardLoadNewtons: Number(values.rightLoad.toFixed(8)), torqueNewtonMetres: Number(values.rightTorque.toFixed(8)) }, rightMinusLeftTorqueNewtonMetres: Number(values.torqueResidual.toFixed(8)), requiredLeftArmMetres: Number(values.requiredLeftArm.toFixed(8)), leftShiftMetres: Number(values.leftShift.toFixed(8)), alternativeAirCounterweightSide: values.counterweightSide, alternativeAirCounterweightKilograms: Number(values.counterweightMass.toFixed(8)), balanced: values.balanced, stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p132-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive fluids and moments</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p132-spread"><article class="book-page p132-problem-page"><div class="problem-number">Problem 13.2</div><h1 class="book-title p132-title">Another Galileo’s balance puzzle</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">Two 2.00 kg objects balance at equal 0.400 m arms in air. Their volumes are 800 cm³ on the left and 200 cm³ on the right. Both are then fully submerged in water while their vessels remain independently supported.</p><p class="problem-copy"><strong>Keeping the right arm fixed, what new left-arm distance restores balance?</strong></p><section class="p132-principle-card"><strong>Archimedes changes the hanger load</strong><p>Each object still has the same mass, but the larger object displaces more fluid and receives more buoyancy.</p></section><section class="p132-model-card"><div class="eyebrow">Ideal balance</div><p>A massless beam and frictionless pivot respond only to the two signed hanger torques.</p></section></article><section class="book-page book-stage p132-stage">${stageControls()}<div class="p132-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p132-coach"><div class="coach-kicker">Restore equal moments</div><p class="coach-question">For the fixed water challenge, enter the new distance of the left hanger from the pivot.</p><form class="p132-answer-form" data-p132-answer-form novalidate><label for="p132-answer">Required left arm</label><div><input id="p132-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="distance in metres" autocomplete="off"/><span>m</span></div><button class="primary-button" type="submit">Check arm distance</button></form>${feedbackMarkup()}<div class="button-row p132-help-row"><button class="secondary-button" type="button" data-problem-action="p132-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p132-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p132-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p132-shell"); if (!root) return;
    const dynamic = root.querySelector(".p132-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { "left-mass": `${format(state.leftMassKg, 2)} kg`, "right-mass": `${format(state.rightMassKg, 2)} kg`, "left-volume": `${format(state.leftVolumeCm3, 0)} cm³`, "right-volume": `${format(state.rightVolumeCm3, 0)} cm³`, "left-arm": `${format(state.leftArmM, 2)} m`, "right-arm": `${format(state.rightArmM, 2)} m`, density: `${state.fluidName} · ${format(state.fluidDensity, 0)} kg/m³` };
    Object.entries(outputs).forEach(([key,value]) => { const output = root.querySelector(`[data-p132-output="${key}"]`); if (output) output.textContent = value; });
    const values = balanceData();
    root.querySelector("#p132-left-mass")?.setAttribute("aria-valuetext", `Left mass ${format(state.leftMassKg, 2)} kilograms; apparent load ${format(values.leftLoad, 3)} newtons`);
    root.querySelector("#p132-right-mass")?.setAttribute("aria-valuetext", `Right mass ${format(state.rightMassKg, 2)} kilograms; apparent load ${format(values.rightLoad, 3)} newtons`);
    root.querySelector("#p132-left-volume")?.setAttribute("aria-valuetext", `Left volume ${format(state.leftVolumeCm3, 0)} cubic centimetres; buoyancy ${format(values.leftBuoyancy, 3)} newtons`);
    root.querySelector("#p132-right-volume")?.setAttribute("aria-valuetext", `Right volume ${format(state.rightVolumeCm3, 0)} cubic centimetres; buoyancy ${format(values.rightBuoyancy, 3)} newtons`);
    root.querySelector("#p132-left-arm")?.setAttribute("aria-valuetext", `Left arm ${format(state.leftArmM, 2)} metres; torque ${format(values.leftTorque, 3)} newton metres`);
    root.querySelector("#p132-right-arm")?.setAttribute("aria-valuetext", `Right arm ${format(state.rightArmM, 2)} metres; torque ${format(values.rightTorque, 3)} newton metres`);
    root.querySelector("#p132-density")?.setAttribute("aria-valuetext", `Fluid density ${format(state.fluidDensity, 0)} kilograms per cubic metre; required left arm ${format(values.requiredLeftArm, 4)} metres`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p132-reset") { state = initialState(); renderAndFocus(renderApp, "#p132-left-mass"); return; }
      if (action === "p132-stage") { state.stage = clamp(Number(control.dataset.p132Stage), 0, 2); renderAndFocus(renderApp, `[data-p132-stage="${state.stage}"]`); return; }
      if (action === "p132-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p132-stage="${state.stage}"]`); return; }
      if (action === "p132-submersion") { state.submersion = control.dataset.p132Submersion; renderAndFocus(renderApp, `[data-p132-submersion="${state.submersion}"]`); return; }
      if (action === "p132-fluid") { const fluid = FLUIDS[control.dataset.p132Fluid]; state.fluidName = fluid.name; state.fluidDensity = fluid.density; renderAndFocus(renderApp, `[data-p132-fluid="${control.dataset.p132Fluid}"]`); return; }
      if (action === "p132-preset") {
        const preset = control.dataset.p132Preset;
        if (preset === "challenge") restoreChallenge();
        if (preset === "air") { restoreChallenge(); state.submersion = "none"; }
        if (preset === "left") { restoreChallenge(); state.submersion = "left"; }
        if (preset === "rebalance") { restoreChallenge(); state.leftArmM = challengeValues.requiredLeftArm; }
        renderAndFocus(renderApp, "#p132-left-mass"); return;
      }
      if (action === "p132-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p132-reveal") { state.revealed = true; state.stage = 2; }
      renderApp(); if (action === "p132-reveal") window.requestAnimationFrame(() => document.querySelector("#p132-solution-heading")?.focus());
    }));
    [["#p132-left-mass", "leftMassKg", 1.2, 5], ["#p132-right-mass", "rightMassKg", 1.2, 5], ["#p132-left-volume", "leftVolumeCm3", 50, 900], ["#p132-right-volume", "rightVolumeCm3", 50, 900], ["#p132-left-arm", "leftArmM", .1, 1], ["#p132-right-arm", "rightArmM", .1, 1]].forEach(([selector,key,minimum,maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    document.querySelector("#p132-density")?.addEventListener("input", (event) => { state.fluidDensity = clamp(Number(event.target.value), 600, 1300); state.fluidName = "Custom fluid"; updateDynamicDom(); });
    const input = document.querySelector("#p132-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p132-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); const target = challengeValues.requiredLeftArm; state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one arm distance in metres.";
      else if (Math.abs(answer - challengeValues.leftShift) < .01) state.feedback = "That is the outward shift. The question asks for the new total distance from the pivot: original arm plus shift.";
      else if (Math.abs(answer - target) > .003) state.feedback = "Subtract buoyancy from each weight, then impose Fleft rleft=Fright rright.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; state.feedback = `Correct: the left hanger must move to ${format(target, 4)} m, an outward shift of ${format(challengeValues.leftShift, 4)} m.`; }
      renderAndFocus(renderApp, "#p132-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
