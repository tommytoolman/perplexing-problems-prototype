(function registerLawnchairLarryPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "14.5";
  const GRAVITY = 9.81;
  const CHALLENGE = Object.freeze({ payloadKg: 90, diameterM: 1.5, airDensityKgM3: 1.225, heliumDensityKgM3: 0.169, hardwareKgPerBalloon: 0.25, marginPercent: 20 });
  const stages = Object.freeze([
    Object.freeze({ short: "Volume", title: "Turn diameter into gas volume", copy: "Treat each inflated balloon as a sphere. Its volume is V=πd³/6, so diameter has a cubic—not linear—effect." }),
    Object.freeze({ short: "Net lift", title: "Subtract everything carried by one balloon", copy: "Displaced air provides gross lift. Helium, envelope and allocated rigging mass consume it, leaving a net mass capacity per balloon." }),
    Object.freeze({ short: "Count", title: "Apply the margin, divide and round up", copy: "This activity increases the stated payload by its calculation margin, divides by net capacity and rounds up to a whole balloon." }),
  ]);
  const hints = Object.freeze([
    "For a spherical balloon of diameter d, V=(4/3)π(d/2)³=πd³/6.",
    "The gas-only lift expressed as an equivalent mass is (ρair−ρhelium)V. Keep densities in kg/m³ and volume in m³.",
    "Subtract the 0.250 kg envelope-and-rigging allocation from each balloon’s gas-only lift.",
    "Increase 90 kg by 20%, divide by the net capacity per balloon, then round upward because a fraction of a balloon is unavailable.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p145-reset">Reset</button>';

  const initialState = () => ({ ...CHALLENGE, stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false });
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeInteger(value) { return String(value).replace(/[^0-9\s]/g, "").slice(0, 9); }

  function liftData(
    payloadKg = state.payloadKg,
    diameterM = state.diameterM,
    airDensityKgM3 = state.airDensityKgM3,
    heliumDensityKgM3 = state.heliumDensityKgM3,
    hardwareKgPerBalloon = state.hardwareKgPerBalloon,
    marginPercent = state.marginPercent,
  ) {
    const radiusM = diameterM / 2;
    const balloonVolumeM3 = Math.PI * diameterM ** 3 / 6;
    const displacedAirKg = airDensityKgM3 * balloonVolumeM3;
    const heliumKg = heliumDensityKgM3 * balloonVolumeM3;
    const gasOnlyLiftKg = displacedAirKg - heliumKg;
    const netLiftKgPerBalloon = gasOnlyLiftKg - hardwareKgPerBalloon;
    const netLiftNPerBalloon = netLiftKgPerBalloon * GRAVITY;
    const marginFraction = marginPercent / 100;
    const marginAdjustedPayloadKg = payloadKg * (1 + marginFraction);
    const hasPositiveNetLift = netLiftKgPerBalloon > 0;
    const balloonsRequired = hasPositiveNetLift ? Math.ceil(marginAdjustedPayloadKg / netLiftKgPerBalloon) : null;
    const fleetNetCapacityKg = balloonsRequired === null ? null : balloonsRequired * netLiftKgPerBalloon;
    const fleetDesignHeadroomKg = fleetNetCapacityKg === null ? null : fleetNetCapacityKg - marginAdjustedPayloadKg;
    const displayedReserveAbovePayloadKg = fleetNetCapacityKg === null ? null : fleetNetCapacityKg - payloadKg;
    const breakEvenDiameterM = Math.cbrt(6 * hardwareKgPerBalloon / (Math.PI * (airDensityKgM3 - heliumDensityKgM3)));
    const oneBalloonDiameterM = Math.cbrt(6 * (marginAdjustedPayloadKg + hardwareKgPerBalloon) / (Math.PI * (airDensityKgM3 - heliumDensityKgM3)));
    const massIdentityResidualKg = displacedAirKg - heliumKg - hardwareKgPerBalloon - netLiftKgPerBalloon;
    return { radiusM, balloonVolumeM3, displacedAirKg, heliumKg, gasOnlyLiftKg, netLiftKgPerBalloon, netLiftNPerBalloon, marginFraction, marginAdjustedPayloadKg, hasPositiveNetLift, balloonsRequired, fleetNetCapacityKg, fleetDesignHeadroomKg, displayedReserveAbovePayloadKg, breakEvenDiameterM, oneBalloonDiameterM, massIdentityResidualKg };
  }

  const challengeValues = liftData(CHALLENGE.payloadKg, CHALLENGE.diameterM, CHALLENGE.airDensityKgM3, CHALLENGE.heliumDensityKgM3, CHALLENGE.hardwareKgPerBalloon, CHALLENGE.marginPercent);

  function reconstructionNote() {
    return `<p class="p145-reconstruction-note"><strong>Independently reconstructed activity.</strong> The available source preserves only this problem’s title and two-star difficulty. This numerical scenario, diagram and solution are newly written rather than recovered book content.</p>`;
  }

  function stageControls() {
    return `<div class="p145-stage-controls" role="group" aria-label="Buoyant-lift estimate stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p145-stage" data-p145-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageCaption() {
    const stage = stages[state.stage];
    return `<div class="p145-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p145-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Estimate complete" : "Next stage"}</button></div>`;
  }

  function sensitivityData() {
    return [0.75, 1, 1.5, 2, 2.5, 3].map((diameterM) => ({ diameterM, ...liftData(state.payloadKg, diameterM, state.airDensityKgM3, state.heliumDensityKgM3, state.hardwareKgPerBalloon, state.marginPercent) }));
  }

  function sensitivityRows() {
    const rows = sensitivityData();
    const maximumLog = Math.max(...rows.filter((row) => row.balloonsRequired !== null).map((row) => Math.log10(row.balloonsRequired + 1)), 1);
    return rows.map((row, index) => {
      const width = row.balloonsRequired === null ? 0 : 112 * Math.log10(row.balloonsRequired + 1) / maximumLog;
      const label = row.balloonsRequired === null ? "no net lift" : `${row.balloonsRequired}`;
      return `<g transform="translate(498 ${294 + index * 19})"><text class="p145-sensitivity-diameter" x="0" y="10">${format(row.diameterM, 2)} m</text><rect class="p145-sensitivity-track" x="42" y="1" width="112" height="11" rx="5.5"/><rect class="p145-sensitivity-bar" x="42" y="1" width="${format(width, 2)}" height="11" rx="5.5"/><text class="p145-sensitivity-value" x="162" y="10">${label}</text></g>`;
    }).join("");
  }

  function balloonSvg() {
    const values = liftData();
    const netVisible = state.stage >= 1 || state.revealed;
    const countVisible = state.stage >= 2 || state.revealed;
    const balloonRadius = 24 + 13 * (state.diameterM - .6) / 2.4;
    const positions = [[90,83],[143,65],[195,84],[248,64],[302,84],[117,117],[170,108],[222,116],[275,108]];
    const clusterCount = values.balloonsRequired === null ? 9 : Math.min(9, values.balloonsRequired);
    const balloonMarkup = positions.slice(0, clusterCount).map(([x, y], index) => `<g class="p145-balloon"><ellipse cx="${x}" cy="${y}" rx="${format(balloonRadius * .78, 2)}" ry="${format(balloonRadius, 2)}"/><path d="M${x - 4} ${format(y + balloonRadius - 1, 2)}L${x} ${format(y + balloonRadius + 7, 2)}L${x + 4} ${format(y + balloonRadius - 1, 2)}Z"/><line x1="${x}" y1="${format(y + balloonRadius + 7, 2)}" x2="200" y2="268"/><text x="${x}" y="${format(y + 3, 2)}" text-anchor="middle">${index === 0 ? `d=${format(state.diameterM, 2)} m` : "He"}</text></g>`).join("");
    const countText = values.balloonsRequired === null ? "NO POSITIVE NET LIFT" : `${values.balloonsRequired} BALLOONS`;
    const statusClass = values.hasPositiveNetLift ? "is-positive" : "is-nonpositive";
    return `<svg class="p145-svg p145-stage-${state.stage} ${statusClass}" viewBox="0 0 740 430" role="img" aria-labelledby="p145-svg-title p145-svg-desc">
      <title id="p145-svg-title">Spherical helium balloon buoyant-lift estimate</title>
      <desc id="p145-svg-desc">A schematic cluster of spherical helium balloons supports a ${format(state.payloadKg, 2)} kilogram passenger-and-chair payload. Each ${format(state.diameterM, 3)} metre balloon has volume ${format(values.balloonVolumeM3, 6)} cubic metres, displaces ${format(values.displacedAirKg, 6)} kilograms of air, contains ${format(values.heliumKg, 6)} kilograms of helium and has ${format(state.hardwareKgPerBalloon, 3)} kilograms allocated to envelope and rigging. Net mass capacity per balloon is ${format(values.netLiftKgPerBalloon, 6)} kilograms. With a ${format(state.marginPercent, 0)} percent calculation margin the estimate requires ${values.balloonsRequired === null ? "no finite number because net lift is non-positive" : `${values.balloonsRequired} balloons`}. This is an ideal sea-level classroom estimate, not flight advice.</desc>
      <defs><linearGradient id="p145-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e8e5"/><stop offset="1" stop-color="#f2eee1"/></linearGradient><linearGradient id="p145-balloon-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e5a079"/><stop offset="1" stop-color="#a9513d"/></linearGradient><marker id="p145-arrow-up" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="p145-arrow-down" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>
      <rect class="p145-sky" x="1" y="1" width="398" height="428" rx="20"/><rect class="p145-audit-bg" x="400" y="1" width="339" height="428" rx="20"/><path class="p145-cloud" d="M28 188q17-26 41-5q30-9 40 19H19q-3-10 9-14Zm257-43q14-21 34-3q24-7 31 17h-73q-2-8 8-14Z"/>
      <text class="p145-scene-kicker" x="22" y="28">IDEAL SPHERES · SEA-LEVEL DENSITIES</text>${balloonMarkup}<rect class="p145-chair" x="169" y="268" width="62" height="53" rx="8"/><circle class="p145-person-head" cx="200" cy="246" r="13"/><path class="p145-person" d="M200 259v35m0-20l-20 17m20-17l20 17m-20 3l-17 24m17-24l17 24"/><line class="p145-up-arrow" x1="77" y1="248" x2="77" y2="180" marker-end="url(#p145-arrow-up)"/><text class="p145-force-label" x="88" y="199">air displaced</text><line class="p145-down-arrow" x1="322" y1="186" x2="322" y2="254" marker-end="url(#p145-arrow-down)"/><text class="p145-force-label" x="309" y="225" text-anchor="end">carried mass</text><rect class="p145-payload-box" x="78" y="345" width="244" height="56" rx="12"/><text class="p145-payload-kicker" x="94" y="366">PASSENGER + CHAIR PAYLOAD</text><text class="p145-payload-value" x="94" y="389">${format(state.payloadKg, 1)} kg</text><text class="p145-cluster-label" x="200" y="334" text-anchor="middle">${countVisible ? countText : "COUNT AT STAGE 3"}</text>
      <text class="p145-audit-title" x="424" y="28">BUOYANCY MASS LEDGER</text><text class="p145-audit-note" x="424" y="47">screening arithmetic · not operational guidance</text><g class="p145-volume-layer"><rect class="p145-panel" x="424" y="65" width="290" height="61" rx="12"/><text class="p145-panel-kicker" x="439" y="86">1 · SPHERICAL GAS VOLUME</text><text class="p145-equation" x="439" y="109">V=πd³/6=${format(values.balloonVolumeM3, 6)} m³</text></g>
      <g class="p145-net-layer"><rect class="p145-panel" x="424" y="140" width="290" height="104" rx="12"/><text class="p145-panel-kicker" x="439" y="161">2 · PER-BALLOON MASS CAPACITY</text><text class="p145-ledger-label" x="439" y="183">displaced air</text><text class="p145-ledger-value" x="697" y="183" text-anchor="end">+${format(values.displacedAirKg, 5)} kg</text><text class="p145-ledger-label" x="439" y="201">helium</text><text class="p145-ledger-value" x="697" y="201" text-anchor="end">−${format(values.heliumKg, 5)} kg</text><text class="p145-ledger-label" x="439" y="219">envelope + rigging allocation</text><text class="p145-ledger-value" x="697" y="219" text-anchor="end">−${format(state.hardwareKgPerBalloon, 3)} kg</text><line class="p145-ledger-rule" x1="439" y1="227" x2="697" y2="227"/><text class="p145-ledger-total" x="439" y="240">net ${format(values.netLiftKgPerBalloon, 6)} kg · ${format(values.netLiftNPerBalloon, 5)} N</text></g>
      <g class="p145-count-layer"><rect class="p145-count-box" x="424" y="258" width="290" height="149" rx="12"/><text class="p145-panel-kicker" x="439" y="279">3 · DIAMETER SENSITIVITY · REQUIRED COUNT</text>${sensitivityRows()}<text class="p145-log-note" x="697" y="400" text-anchor="end">bar length uses log₁₀(count+1)</text></g><rect class="p145-status-box" x="78" y="405" width="244" height="16" rx="8"/><rect class="p145-status-fill" x="78" y="405" width="${values.hasPositiveNetLift ? 244 : 0}" height="16" rx="8"/></svg>`;
  }

  function metricsMarkup() {
    const values = liftData();
    const netVisible = state.stage >= 1 || state.revealed;
    const countVisible = state.stage >= 2 || state.revealed;
    return `<section class="p145-metrics" aria-live="polite"><div><span>Balloon volume</span><strong>${format(values.balloonVolumeM3, 5)} m³</strong></div><div><span>Net capacity per balloon</span><strong>${netVisible ? `${format(values.netLiftKgPerBalloon, 5)} kg · ${format(values.netLiftNPerBalloon, 3)} N` : "stage 2"}</strong></div><div><span>Margin-adjusted payload</span><strong>${countVisible ? `${format(values.marginAdjustedPayloadKg, 3)} kg` : "stage 3"}</strong></div><div><span>Whole balloons required</span><strong>${countVisible ? values.balloonsRequired === null ? "no finite count" : format(values.balloonsRequired, 0) : "stage 3"}</strong></div>${countVisible ? `<p><strong>${values.hasPositiveNetLift ? "Positive ideal net lift." : "No positive ideal net lift."}</strong> Break-even diameter for the selected per-balloon hardware mass is ${format(values.breakEvenDiameterM, 4)} m. ${values.balloonsRequired === null ? "Increase displaced-air volume or reduce carried mass before a count can be defined." : `The rounded fleet provides ${format(values.fleetNetCapacityKg, 4)} kg net capacity, ${format(values.fleetDesignHeadroomKg, 4)} kg above this activity’s margin-adjusted target.`}</p>` : ""}</section>`;
  }

  function dynamicMarkup() { return `<div class="p145-dynamic">${balloonSvg()}${metricsMarkup()}</div>`; }

  function controlsMarkup() {
    return `<section class="p145-controls" aria-label="Ideal balloon lift estimate controls"><div class="p145-control-grid"><label for="p145-payload"><span>Total payload<output data-p145-output="payload">${format(state.payloadKg, 0)} kg</output></span><input id="p145-payload" type="range" min="40" max="180" step="1" value="${state.payloadKg}"/></label><label for="p145-diameter"><span>Balloon diameter d<output data-p145-output="diameter">${format(state.diameterM, 2)} m</output></span><input id="p145-diameter" type="range" min="0.6" max="3" step="0.05" value="${state.diameterM}"/></label><label for="p145-air-density"><span>Air density ρair<output data-p145-output="air">${format(state.airDensityKgM3, 3)} kg/m³</output></span><input id="p145-air-density" type="range" min="1" max="1.35" step="0.005" value="${state.airDensityKgM3}"/></label><label for="p145-helium-density"><span>Helium density ρHe<output data-p145-output="helium">${format(state.heliumDensityKgM3, 3)} kg/m³</output></span><input id="p145-helium-density" type="range" min="0.12" max="0.22" step="0.001" value="${state.heliumDensityKgM3}"/></label><label for="p145-hardware"><span>Envelope + rigging per balloon<output data-p145-output="hardware">${format(state.hardwareKgPerBalloon, 3)} kg</output></span><input id="p145-hardware" type="range" min="0.05" max="0.8" step="0.01" value="${state.hardwareKgPerBalloon}"/></label><label for="p145-margin"><span>Calculation margin<output data-p145-output="margin">${format(state.marginPercent, 0)}%</output></span><input id="p145-margin" type="range" min="0" max="50" step="5" value="${state.marginPercent}"/></label></div><p>Payload means passenger plus chair and shared equipment. Envelope-and-rigging mass is an allocation for every balloon. The margin multiplies payload by 1+margin before division; it is a classroom sensitivity input, not a safety certification.</p><div class="p145-presets"><button class="chip-button" type="button" data-problem-action="p145-preset" data-p145-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p145-preset" data-p145-preset="small">Small balloons</button><button class="chip-button" type="button" data-problem-action="p145-preset" data-p145-preset="large">Double diameter</button><button class="chip-button" type="button" data-problem-action="p145-preset" data-p145-preset="heavy">Heavy envelopes</button></div></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p145-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p145-solution" aria-labelledby="p145-solution-heading"><h3 id="p145-solution-heading" tabindex="-1">Each balloon must lift its own material first</h3><p>The 1.50 m diameter is used in metres, so one ideal spherical balloon contains</p><div class="p145-equation">V=πd³/6=π(1.50 m)³/6<br>=${format(challengeValues.balloonVolumeM3, 9)} m³</div><p>Expressing buoyancy as an equivalent supported mass makes g cancel:</p><div class="p145-equation">mgross=(ρair−ρHe)V<br>=(1.225−0.169) kg/m³×${format(challengeValues.balloonVolumeM3, 9)} m³<br>=${format(challengeValues.gasOnlyLiftKg, 9)} kg</div><p>After the 0.250 kg envelope-and-rigging allocation, each balloon’s ideal net capacity is ${format(challengeValues.netLiftKgPerBalloon, 9)} kg, equivalent to ${format(challengeValues.netLiftNPerBalloon, 9)} N. The activity’s margin-adjusted payload is 90×1.20=108 kg, so</p><div class="p145-equation is-answer">N=ceil(108/${format(challengeValues.netLiftKgPerBalloon, 9)})<br>=ceil(${format(challengeValues.marginAdjustedPayloadKg / challengeValues.netLiftKgPerBalloon, 9)})=${challengeValues.balloonsRequired} balloons</div><p>At that rounded count, ideal net capacity is ${format(challengeValues.fleetNetCapacityKg, 9)} kg. Doubling diameter multiplies spherical volume and gas-only lift by eight; per-balloon hardware prevents the net result from following that inverse-cube rule exactly.</p><p class="p145-limits"><strong>Model and safety boundary.</strong> This is an order-of-magnitude classroom calculation, not operational flight advice. It assumes identical fully inflated spherical balloons, quiescent sea-level air, uniform stated air and helium densities consistent with an ideal-gas snapshot, constant g=9.81 m/s², no leakage, and the entered per-balloon envelope/rigging allocation. It ignores altitude-dependent density and expansion, weather, wind and drag, temperature and solar heating, balloon stretch or bursting, clustering and wake effects, dynamic loads, line geometry, control, launch/landing, redundancy, regulations and all real safety engineering. The calculation margin is illustrative only. kg is mass; N is force; m³ is volume; density is kg/m³.</p></section>`;
  }

  function snapshot() {
    const values = liftData();
    return JSON.stringify({ problem: PROBLEM, reconstruction: "title and difficulty only", modelBoundary: "ideal identical spherical helium balloons at a sea-level density snapshot; classroom estimate, not operational flight advice", gravityMetresPerSecondSquared: GRAVITY, totalPassengerChairPayloadKilograms: state.payloadKg, balloonDiameterMetres: state.diameterM, balloonVolumeCubicMetres: Number(values.balloonVolumeM3.toFixed(9)), airDensityKilogramsPerCubicMetre: state.airDensityKgM3, heliumDensityKilogramsPerCubicMetre: state.heliumDensityKgM3, displacedAirMassPerBalloonKilograms: Number(values.displacedAirKg.toFixed(9)), heliumMassPerBalloonKilograms: Number(values.heliumKg.toFixed(9)), envelopeAndRiggingMassPerBalloonKilograms: state.hardwareKgPerBalloon, netLiftMassCapacityPerBalloonKilograms: Number(values.netLiftKgPerBalloon.toFixed(9)), netLiftForcePerBalloonNewtons: Number(values.netLiftNPerBalloon.toFixed(9)), calculationMarginPercent: state.marginPercent, marginAdjustedPayloadKilograms: Number(values.marginAdjustedPayloadKg.toFixed(9)), balloonsRequired: values.balloonsRequired, breakEvenDiameterMetres: Number(values.breakEvenDiameterM.toFixed(9)), oneBalloonDiameterMetres: Number(values.oneBalloonDiameterM.toFixed(9)), massIdentityResidualKilograms: Number(values.massIdentityResidualKg.toExponential(6)), stage: state.stage + 1, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { Object.assign(state, CHALLENGE); }
  function render() {
    return `<main class="book-shell p145-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive buoyancy estimate</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p145-spread"><article class="book-page p145-problem-page"><div class="problem-number">Problem 14.5</div><h1 class="book-title p145-title">Lawnchair Larry</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${reconstructionNote()}<p class="problem-copy">A passenger, chair and shared equipment have total mass 90.0 kg. Identical spherical helium balloons are 1.50 m in diameter. Use ρair=1.225 kg/m³, ρHe=0.169 kg/m³ and 0.250 kg of envelope and rigging per balloon.</p><p class="problem-copy"><strong>How many whole balloons give ideal net capacity equal to the payload plus a 20% calculation margin?</strong></p><section class="p145-observation-card"><strong>Diameter is the sensitive input</strong><p>Sphere volume scales with d³. But every balloon must also carry its own helium, envelope and allocated rigging.</p></section><section class="p145-model-card"><div class="eyebrow">Classroom estimate only</div><p>This is a static sea-level comparison, not operational flight guidance. The margin is a mathematical input, not a real safety factor.</p></section></article><section class="book-page book-stage p145-stage">${stageControls()}<div class="p145-visual-card">${dynamicMarkup()}${stageCaption()}</div>${controlsMarkup()}</section><aside class="book-page book-coach p145-coach"><div class="coach-kicker">Round the count upward</div><p class="coach-question">For the fixed challenge, how many whole balloons does this ideal model require?</p><form class="p145-answer-form" data-p145-answer-form novalidate><label for="p145-answer">Required balloon count</label><div><input id="p145-answer" type="text" inputmode="numeric" value="${escapeAttribute(state.answer)}" placeholder="whole number" autocomplete="off"/><span>balloons</span></div><button class="primary-button" type="submit">Check count</button></form>${feedbackMarkup()}<div class="button-row p145-help-row"><button class="secondary-button" type="button" data-problem-action="p145-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p145-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p145-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p145-shell"); if (!root) return;
    const dynamic = root.querySelector(".p145-dynamic"); if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { payload: `${format(state.payloadKg, 0)} kg`, diameter: `${format(state.diameterM, 2)} m`, air: `${format(state.airDensityKgM3, 3)} kg/m³`, helium: `${format(state.heliumDensityKgM3, 3)} kg/m³`, hardware: `${format(state.hardwareKgPerBalloon, 3)} kg`, margin: `${format(state.marginPercent, 0)}%` };
    Object.entries(outputs).forEach(([key, value]) => { const output = root.querySelector(`[data-p145-output="${key}"]`); if (output) output.textContent = value; });
    const values = liftData();
    root.querySelector("#p145-payload")?.setAttribute("aria-valuetext", `Payload ${format(state.payloadKg, 0)} kilograms; margin-adjusted target ${format(values.marginAdjustedPayloadKg, 1)} kilograms`);
    root.querySelector("#p145-diameter")?.setAttribute("aria-valuetext", `Balloon diameter ${format(state.diameterM, 2)} metres; volume ${format(values.balloonVolumeM3, 4)} cubic metres; ${values.balloonsRequired === null ? "no positive net lift" : `${values.balloonsRequired} required`}`);
    root.querySelector("#p145-air-density")?.setAttribute("aria-valuetext", `Air density ${format(state.airDensityKgM3, 3)} kilograms per cubic metre`);
    root.querySelector("#p145-helium-density")?.setAttribute("aria-valuetext", `Helium density ${format(state.heliumDensityKgM3, 3)} kilograms per cubic metre`);
    root.querySelector("#p145-hardware")?.setAttribute("aria-valuetext", `Envelope and rigging allocation ${format(state.hardwareKgPerBalloon, 3)} kilograms per balloon; net capacity ${format(values.netLiftKgPerBalloon, 4)} kilograms`);
    root.querySelector("#p145-margin")?.setAttribute("aria-valuetext", `Calculation margin ${format(state.marginPercent, 0)} percent; target ${format(values.marginAdjustedPayloadKg, 1)} kilograms`);
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => control.addEventListener("click", () => {
      const action = control.dataset.problemAction;
      if (action === "p145-reset") { state = initialState(); renderAndFocus(renderApp, "#p145-payload"); return; }
      if (action === "p145-stage") { state.stage = clamp(Number(control.dataset.p145Stage), 0, 2); renderAndFocus(renderApp, `[data-p145-stage="${state.stage}"]`); return; }
      if (action === "p145-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p145-stage="${state.stage}"]`); return; }
      if (action === "p145-preset") { const preset = control.dataset.p145Preset; restoreChallenge(); if (preset === "small") state.diameterM = .75; if (preset === "large") state.diameterM = 3; if (preset === "heavy") state.hardwareKgPerBalloon = .8; renderAndFocus(renderApp, "#p145-diameter"); return; }
      if (action === "p145-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p145-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p145-reveal") window.requestAnimationFrame(() => document.querySelector("#p145-solution-heading")?.focus());
    }));
    [["#p145-payload", "payloadKg", 40, 180], ["#p145-diameter", "diameterM", .6, 3], ["#p145-air-density", "airDensityKgM3", 1, 1.35], ["#p145-helium-density", "heliumDensityKgM3", .12, .22], ["#p145-hardware", "hardwareKgPerBalloon", .05, .8], ["#p145-margin", "marginPercent", 0, 50]].forEach(([selector, key, minimum, maximum]) => document.querySelector(selector)?.addEventListener("input", (event) => { state[key] = clamp(Number(event.target.value), minimum, maximum); updateDynamicDom(); }));
    const input = document.querySelector("#p145-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeInteger(event.target.value); });
    document.querySelector("[data-p145-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeInteger(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isInteger(answer)) state.feedback = "Enter one whole-number balloon count.";
      else if (answer === 56) state.feedback = "That is close to omitting the 20% calculation margin. Apply the margin before dividing.";
      else if (answer === 66) state.feedback = "The quotient is not itself a whole balloon. Round upward, not to the nearest integer.";
      else if (answer !== challengeValues.balloonsRequired) state.feedback = "Find V=πd³/6, subtract helium and envelope/rigging mass from displaced-air mass, then divide 108 kg by the net capacity.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = `Correct: the quotient is ${format(challengeValues.marginAdjustedPayloadKg / challengeValues.netLiftKgPerBalloon, 7)}, so the ideal estimate rounds up to ${challengeValues.balloonsRequired} balloons.`; }
      renderAndFocus(renderApp, "#p145-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
