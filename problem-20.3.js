(function registerTrainSnapshotPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "20.3";
  const LIGHT_SPEED_METRES_PER_SECOND = 3e8;
  const PROPER_LENGTH_METRES = 300;
  const CHALLENGE_BETA = 0.6;
  const EXTENSION_DISCLOSURE = "Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.";
  const stages = Object.freeze([
    Object.freeze({ short: "Snapshot", title: "Choose both endpoints at one platform time", copy: "A platform length measurement is a pair of corrected endpoint coordinates recorded simultaneously in the platform frame. Their separation is the moving length L." }),
    Object.freeze({ short: "Transform", title: "Transform the endpoint events, not just the number", copy: "The same two events have Δt=0 and Δx=L on the platform. Lorentz transformation gives Δx′=L₀ but Δt′≠0, so they are not a train-frame length snapshot." }),
    Object.freeze({ short: "Slices", title: "Each frame owns a different simultaneity slice", copy: "A t′=constant line is tilted on the platform spacetime diagram and selects a different front-end event. That event pair measures the proper length 300 m in the train frame." }),
  ]);
  const hints = Object.freeze([
    "The proper length L₀=300 m is measured in the train rest frame using simultaneous train-frame endpoint events.",
    "For a train moving at speed v, the platform-frame simultaneous length is contracted: L=L₀/γ.",
    "At 0.60c, γ=1/√(1−0.60²)=1.25.",
    "Divide the 300 m proper length by 1.25.",
    "As a simultaneity check, transform the platform endpoint pair: Δt′=γ(Δt−vΔx/c²) with Δt=0 and Δx=240 m.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p203-reset">Reset</button>';

  function initialState() { return { beta: CHALLENGE_BETA, snapshotTimeMicroseconds: 0, selectedSlice: "platform", stage: 0, answer: "", feedback: "", feedbackTone: "neutral", committed: false, hintsUsed: 0, revealed: false }; }
  let state = initialState();

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value))); }
  function format(value, digits = 3) { if (!Number.isFinite(value)) return "—"; const rounded = Number(value.toFixed(digits)); return Object.is(rounded, -0) ? "0" : rounded.toLocaleString("en-GB", { maximumFractionDigits: digits }); }
  function signed(value, digits = 3) { if (!Number.isFinite(value)) return "—"; if (Math.abs(value) < 10 ** (-digits) / 2) return format(0, digits); return `${value > 0 ? "+" : "−"}${format(Math.abs(value), digits)}`; }
  function svgNumber(value, digits = 3) { return Number(value.toFixed(digits)); }
  function escapeAttribute(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  function sanitizeNumber(value) { return String(value).replaceAll("−", "-").replace(/[^0-9.,eE+\-\s]/g, "").replace(",", ".").slice(0, 24); }

  function relativityData(beta = state.beta, snapshotTimeMicroseconds = state.snapshotTimeMicroseconds) {
    const gamma = 1 / Math.sqrt(1 - beta ** 2);
    const contractedLengthMetres = PROPER_LENGTH_METRES / gamma;
    const platformPair = {
      deltaTimeSeconds: 0,
      deltaTimeMicroseconds: 0,
      deltaPositionMetres: contractedLengthMetres,
      trainDeltaTimeSeconds: -gamma * beta * contractedLengthMetres / LIGHT_SPEED_METRES_PER_SECOND,
      trainDeltaTimeMicroseconds: -gamma * beta * contractedLengthMetres / LIGHT_SPEED_METRES_PER_SECOND * 1e6,
      trainDeltaPositionMetres: gamma * contractedLengthMetres,
    };
    const trainPair = {
      trainDeltaTimeSeconds: 0,
      trainDeltaTimeMicroseconds: 0,
      trainDeltaPositionMetres: PROPER_LENGTH_METRES,
      platformDeltaTimeSeconds: gamma * beta * PROPER_LENGTH_METRES / LIGHT_SPEED_METRES_PER_SECOND,
      platformDeltaTimeMicroseconds: gamma * beta * PROPER_LENGTH_METRES / LIGHT_SPEED_METRES_PER_SECOND * 1e6,
      platformDeltaPositionMetres: gamma * PROPER_LENGTH_METRES,
    };
    const snapshotTimeSeconds = snapshotTimeMicroseconds * 1e-6;
    const rearPositionMetres = beta * LIGHT_SPEED_METRES_PER_SECOND * snapshotTimeSeconds;
    const frontPositionMetres = rearPositionMetres + contractedLengthMetres;
    return {
      beta,
      gamma,
      properLengthMetres: PROPER_LENGTH_METRES,
      contractedLengthMetres,
      contractionMetres: PROPER_LENGTH_METRES - contractedLengthMetres,
      snapshotTimeMicroseconds,
      snapshotTimeSeconds,
      rearPositionMetres,
      frontPositionMetres,
      platformPair,
      trainPair,
      lengthIdentityResidualMetres: platformPair.trainDeltaPositionMetres - PROPER_LENGTH_METRES,
      platformTransformTimeResidualSeconds: platformPair.trainDeltaTimeSeconds + gamma * beta * contractedLengthMetres / LIGHT_SPEED_METRES_PER_SECOND,
      inverseTransformTimeResidualSeconds: trainPair.platformDeltaTimeSeconds - gamma * beta * PROPER_LENGTH_METRES / LIGHT_SPEED_METRES_PER_SECOND,
      intervalResidualSquareMetres: contractedLengthMetres ** 2 - (LIGHT_SPEED_METRES_PER_SECOND * platformPair.deltaTimeSeconds) ** 2 - (platformPair.trainDeltaPositionMetres ** 2 - (LIGHT_SPEED_METRES_PER_SECOND * platformPair.trainDeltaTimeSeconds) ** 2),
    };
  }

  const challenge = Object.freeze(relativityData(CHALLENGE_BETA, 0));
  function currentData() { return relativityData(); }
  function originalExtensionNote() { return `<p class="p203-extension-note">${EXTENSION_DISCLOSURE}</p>`; }
  function stageControls() { return `<div class="p203-stage-controls" role="group" aria-label="Length-contraction reasoning stages">${stages.map((stage, index) => `<button class="secondary-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p203-stage" data-p203-stage="${index}" aria-pressed="${state.stage === index}"><span>${index + 1}</span>${stage.short}</button>`).join("")}</div>`; }
  function stageCaption() { const stage = stages[state.stage]; return `<div class="p203-stage-caption"><div><div class="eyebrow">Stage ${state.stage + 1} of 3</div><strong>${stage.title}</strong><p>${stage.copy}</p></div><button class="ghost-button" type="button" data-problem-action="p203-next-stage" ${state.stage >= 2 ? "disabled" : ""}>${state.stage >= 2 ? "Slices resolved" : "Next stage"}</button></div>`; }

  function snapshotSvg() {
    const values = currentData();
    const sceneScale = .65;
    const sceneOriginX = 220;
    const sceneRearX = sceneOriginX + values.rearPositionMetres * sceneScale;
    const sceneFrontX = sceneOriginX + values.frontPositionMetres * sceneScale;
    const sceneWidth = values.contractedLengthMetres * sceneScale;
    const originX = 104, originY = 447, xScale = .72, ctScale = .72;
    const mapX = (metres) => originX + xScale * metres;
    const mapCt = (metres) => originY - ctScale * metres;
    const platformB = { x: values.contractedLengthMetres, ct: 0 };
    const trainC = { x: values.trainPair.platformDeltaPositionMetres, ct: LIGHT_SPEED_METRES_PER_SECOND * values.trainPair.platformDeltaTimeSeconds };
    const worldCtMin = -70, worldCtMax = 310;
    const rearWorld = `M${svgNumber(mapX(values.beta * worldCtMin))} ${svgNumber(mapCt(worldCtMin))}L${svgNumber(mapX(values.beta * worldCtMax))} ${svgNumber(mapCt(worldCtMax))}`;
    const frontWorld = `M${svgNumber(mapX(values.beta * worldCtMin + values.contractedLengthMetres))} ${svgNumber(mapCt(worldCtMin))}L${svgNumber(mapX(values.beta * worldCtMax + values.contractedLengthMetres))} ${svgNumber(mapCt(worldCtMax))}`;
    const platformSlice = `M${svgNumber(mapX(-80))} ${originY}L${svgNumber(mapX(470))} ${originY}`;
    const trainSlice = `M${svgNumber(mapX(-80))} ${svgNumber(mapCt(-80 * values.beta))}L${svgNumber(mapX(470))} ${svgNumber(mapCt(470 * values.beta))}`;
    const selectedEvent = state.selectedSlice === "platform" ? platformB : trainC;
    const selectedPairLabel = state.selectedSlice === "platform" ? `platform pair: Δt=0, Δx=${format(values.contractedLengthMetres, 1)} m` : `train pair: Δt′=0, Δx′=${format(PROPER_LENGTH_METRES, 1)} m`;
    const description = `A train of proper length ${format(PROPER_LENGTH_METRES, 1)} metres moves at ${format(values.beta, 2)} c with Lorentz factor ${format(values.gamma, 5)}. At platform time ${signed(values.snapshotTimeMicroseconds, 2)} microseconds, its corrected simultaneous endpoint positions are ${format(values.rearPositionMetres, 3)} and ${format(values.frontPositionMetres, 3)} metres, separated by ${format(values.contractedLengthMetres, 3)} metres. The platform-simultaneous endpoint events transform to train time difference ${signed(values.platformPair.trainDeltaTimeMicroseconds, 5)} microseconds. The train-simultaneous slice instead selects a front event ${format(values.trainPair.platformDeltaTimeMicroseconds, 5)} microseconds later on the platform and gives train separation ${format(PROPER_LENGTH_METRES, 1)} metres. Selected slice is ${state.selectedSlice}.`;
    return `<svg class="p203-snapshot p203-stage-${state.stage} is-${state.selectedSlice}" viewBox="0 0 760 505" role="img" aria-labelledby="p203-snapshot-title p203-snapshot-desc"><title id="p203-snapshot-title">Corrected moving-train snapshot and simultaneity slices</title><desc id="p203-snapshot-desc">${description}</desc><defs><linearGradient id="p203-board-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#172c3b"/><stop offset="1" stop-color="#292642"/></linearGradient><linearGradient id="p203-train-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a78a1"/><stop offset="1" stop-color="#9b7ca6"/></linearGradient><marker id="p203-motion-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z"/></marker><clipPath id="p203-spacetime-clip"><rect x="24" y="218" width="494" height="268" rx="14"/></clipPath></defs><rect class="p203-board" x="1" y="1" width="758" height="503" rx="19"/><text class="p203-board-kicker" x="24" y="27">CORRECTED ENDPOINT EVENTS · SAME PLATFORM TIME · NOT A RAW CAMERA EXPOSURE</text><g class="p203-scene"><rect x="18" y="42" width="724" height="150" rx="15"/><text class="p203-panel-kicker" x="33" y="66">PLATFORM COORDINATE SNAPSHOT · t=${signed(values.snapshotTimeMicroseconds, 2)} μs</text><line class="p203-track" x1="34" y1="157" x2="724" y2="157"/><g class="p203-train" transform="translate(${svgNumber(sceneRearX)} 0)"><rect x="0" y="91" width="${svgNumber(sceneWidth)}" height="56" rx="12"/><path d="M${svgNumber(sceneWidth)} 91h18l20 28v28h-38Z"/><circle cx="31" cy="151" r="9"/><circle cx="${svgNumber(Math.max(54, sceneWidth - 27))}" cy="151" r="9"/><text x="${svgNumber(sceneWidth / 2)}" y="123" text-anchor="middle">moving train · ${format(values.beta, 2)}c</text></g><g class="p203-endpoint-gates"><line x1="${svgNumber(sceneRearX)}" y1="78" x2="${svgNumber(sceneRearX)}" y2="166"/><line x1="${svgNumber(sceneFrontX)}" y1="78" x2="${svgNumber(sceneFrontX)}" y2="166"/><circle cx="${svgNumber(sceneRearX)}" cy="84" r="6"/><circle cx="${svgNumber(sceneFrontX)}" cy="84" r="6"/><text x="${svgNumber(sceneRearX)}" y="75" text-anchor="middle">rear event</text><text x="${svgNumber(sceneFrontX)}" y="75" text-anchor="middle">front event</text></g><line class="p203-length-bracket" x1="${svgNumber(sceneRearX)}" y1="176" x2="${svgNumber(sceneFrontX)}" y2="176"/><text class="p203-length-label" x="${svgNumber((sceneRearX + sceneFrontX) / 2)}" y="187" text-anchor="middle">same-t separation L=${format(values.contractedLengthMetres, 1)} m</text><line class="p203-motion-line" x1="44" y1="111" x2="112" y2="111" marker-end="url(#p203-motion-arrow)"/><text class="p203-motion-label" x="78" y="101" text-anchor="middle">v</text></g><g class="p203-spacetime-panel"><rect x="18" y="207" width="506" height="282" rx="15"/><text class="p203-panel-kicker" x="33" y="231">LOCAL SPACETIME DIAGRAM · ORIGIN A IS THE REAR-END EVENT</text><g clip-path="url(#p203-spacetime-clip)"><g class="p203-grid">${[-50,0,50,100,150,200,250,300,350,400,450].map((x) => `<line x1="${svgNumber(mapX(x))}" y1="218" x2="${svgNumber(mapX(x))}" y2="486"/>`).join("")}${[-50,0,50,100,150,200,250,300].map((ct) => `<line x1="24" y1="${svgNumber(mapCt(ct))}" x2="518" y2="${svgNumber(mapCt(ct))}"/>`).join("")}</g><path class="p203-worldline is-rear" d="${rearWorld}"/><path class="p203-worldline is-front" d="${frontWorld}"/><path class="p203-slice is-platform" d="${platformSlice}"/><path class="p203-slice is-train" d="${trainSlice}"/></g><line class="p203-axis" x1="33" y1="${originY}" x2="510" y2="${originY}"/><line class="p203-axis" x1="${originX}" y1="479" x2="${originX}" y2="224"/><text class="p203-axis-label" x="508" y="468" text-anchor="end">Δx (m)</text><text class="p203-axis-label" x="86" y="231">cΔt (m)</text><text class="p203-worldline-label" x="${svgNumber(mapX(values.beta * 270) - 8)}" y="${svgNumber(mapCt(270) - 8)}" text-anchor="end">rear worldline</text><text class="p203-worldline-label" x="${svgNumber(mapX(values.beta * 210 + values.contractedLengthMetres) + 7)}" y="${svgNumber(mapCt(210) - 7)}">front worldline</text><g class="p203-event is-a"><circle cx="${originX}" cy="${originY}" r="7"/><text x="${originX - 9}" y="${originY + 18}" text-anchor="end">A · rear</text></g><g class="p203-event is-b"><circle cx="${svgNumber(mapX(platformB.x))}" cy="${svgNumber(mapCt(platformB.ct))}" r="7"/><text x="${svgNumber(mapX(platformB.x))}" y="${originY + 20}" text-anchor="middle">B · platform-simultaneous front</text></g><g class="p203-event is-c"><circle cx="${svgNumber(mapX(trainC.x))}" cy="${svgNumber(mapCt(trainC.ct))}" r="7"/><text x="${svgNumber(mapX(trainC.x) + 8)}" y="${svgNumber(mapCt(trainC.ct) - 7)}">C · train-simultaneous front</text></g><text class="p203-slice-label is-platform" x="34" y="${originY - 9}">platform slice · Δt=0</text><text class="p203-slice-label is-train" x="${svgNumber(mapX(290))}" y="${svgNumber(mapCt(290 * values.beta) - 9)}">train slice · Δt′=0</text><g class="p203-selected-pair"><line x1="${originX}" y1="${originY}" x2="${svgNumber(mapX(selectedEvent.x))}" y2="${svgNumber(mapCt(selectedEvent.ct))}"/><text x="271" y="247" text-anchor="middle">${selectedPairLabel}</text></g></g><g class="p203-ledger" transform="translate(537 207)"><rect width="205" height="282" rx="15"/><text class="p203-ledger-title" x="14" y="26">SIMULTANEITY AUDIT</text><text class="p203-ledger-kicker" x="14" y="60">PLATFORM PAIR A→B</text><text class="p203-ledger-label" x="14" y="84">Δt</text><text class="p203-ledger-value" x="190" y="84" text-anchor="end">0 μs</text><text class="p203-ledger-label" x="14" y="108">Δx=L</text><text class="p203-ledger-value is-length" x="190" y="108" text-anchor="end">${format(values.contractedLengthMetres, 1)} m</text><text class="p203-ledger-label" x="14" y="132">transformed Δx′</text><text class="p203-ledger-value" x="190" y="132" text-anchor="end">${state.stage >= 1 || state.revealed ? `${format(values.platformPair.trainDeltaPositionMetres, 1)} m` : "stage 2"}</text><text class="p203-ledger-label" x="14" y="156">transformed Δt′</text><text class="p203-ledger-value is-time" x="190" y="156" text-anchor="end">${state.stage >= 1 || state.revealed ? `${signed(values.platformPair.trainDeltaTimeMicroseconds, 3)} μs` : "stage 2"}</text><line class="p203-ledger-rule" x1="14" y1="177" x2="190" y2="177"/><text class="p203-ledger-kicker" x="14" y="207">TRAIN PAIR A→C</text><text class="p203-ledger-label" x="14" y="231">Δt′</text><text class="p203-ledger-value" x="190" y="231" text-anchor="end">${state.stage >= 2 || state.revealed ? "0 μs" : "stage 3"}</text><text class="p203-ledger-label" x="14" y="255">Δx′=L₀</text><text class="p203-ledger-value is-proper" x="190" y="255" text-anchor="end">${state.stage >= 2 || state.revealed ? `${format(PROPER_LENGTH_METRES, 1)} m` : "stage 3"}</text><text class="p203-ledger-note" x="14" y="274">different endpoint event pair</text></g></svg>`;
  }

  function sliceControlsMarkup() {
    const values = currentData();
    return `<section class="p203-slice-controls" aria-label="Snapshot time and simultaneity slice controls"><div class="p203-slice-buttons" role="group" aria-label="Choose simultaneity slice"><button class="secondary-button ${state.selectedSlice === "platform" ? "active" : ""}" type="button" data-problem-action="p203-slice" data-p203-slice="platform" aria-pressed="${state.selectedSlice === "platform"}"><strong>Platform slice</strong><span>Δt=0 · measures ${format(values.contractedLengthMetres, 1)} m</span></button><button class="secondary-button ${state.selectedSlice === "train" ? "active" : ""}" type="button" data-problem-action="p203-slice" data-p203-slice="train" aria-pressed="${state.selectedSlice === "train"}"><strong>Train slice</strong><span>Δt′=0 · measures ${format(PROPER_LENGTH_METRES, 1)} m</span></button></div><label for="p203-snapshot-time"><span>Move corrected platform snapshot time<output>${signed(state.snapshotTimeMicroseconds, 2)} μs</output></span><input id="p203-snapshot-time" type="range" min="-0.8" max="0.8" step="0.05" value="${state.snapshotTimeMicroseconds}" aria-valuetext="Platform snapshot time ${signed(state.snapshotTimeMicroseconds, 2)} microseconds; rear position ${format(values.rearPositionMetres, 1)} metres; front position ${format(values.frontPositionMetres, 1)} metres; separation remains ${format(values.contractedLengthMetres, 1)} metres"/></label><div class="p203-time-presets"><button class="chip-button" type="button" data-problem-action="p203-time" data-p203-time="-0.5">−0.50 μs</button><button class="chip-button" type="button" data-problem-action="p203-time" data-p203-time="0">t=0</button><button class="chip-button" type="button" data-problem-action="p203-time" data-p203-time="0.5">+0.50 μs</button></div></section>`;
  }

  function metricsMarkup() {
    const values = currentData();
    return `<section class="p203-metrics" aria-live="polite"><div><span>Proper length · train</span><strong>${format(PROPER_LENGTH_METRES, 1)} m</strong><small>requires Δt′=0</small></div><div><span>Moving length · platform</span><strong>${format(values.contractedLengthMetres, 1)} m</strong><small>requires Δt=0</small></div><div><span>Platform pair in train time</span><strong>${signed(values.platformPair.trainDeltaTimeMicroseconds, 3)} μs</strong><small>front event occurs earlier</small></div></section>`;
  }

  function cameraNoteMarkup() { return `<section class="p203-camera-note"><strong>Corrected measurement, not an unprocessed photograph.</strong> A camera collects photons arriving together, which generally left the near and far ends at different times. Recover endpoint positions at one platform time by correcting those light-travel delays—or use synchronized platform detectors. The snapshot above shows those corrected coordinates.</section>`; }
  function dynamicMarkup() { return `<div class="p203-dynamic"><div class="p203-snapshot-wrap">${snapshotSvg()}${sliceControlsMarkup()}</div>${metricsMarkup()}${cameraNoteMarkup()}</div>`; }

  function speedControlsMarkup() {
    const values = currentData();
    return `<section class="p203-controls" aria-label="Train speed control"><label for="p203-speed"><span>Train speed v/c<output data-p203-output="speed">${format(state.beta, 2)}c</output></span><input id="p203-speed" type="range" min="0" max="0.8" step="0.01" value="${state.beta}" aria-valuetext="${format(state.beta, 2)} times light speed; gamma ${format(values.gamma, 4)}; platform length ${format(values.contractedLengthMetres, 1)} metres"/></label><p data-p203-control-note>At ${format(state.beta, 2)}c, γ=${format(values.gamma, 4)} and a same-platform-time endpoint pair gives L=L₀/γ=${format(values.contractedLengthMetres, 1)} m. The train-frame time gap for that pair is ${signed(values.platformPair.trainDeltaTimeMicroseconds, 3)} μs.</p><button class="chip-button" type="button" data-problem-action="p203-challenge">Restore 0.60c challenge</button></section>`;
  }

  function feedbackMarkup() { return state.feedback ? `<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : ""; }
  function hintsMarkup() { return state.hintsUsed ? `<div class="hint-stack p203-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : ""; }
  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p203-solution" aria-labelledby="p203-solution-heading"><h3 id="p203-solution-heading" tabindex="-1">A platform snapshot selects a shorter simultaneous separation</h3><p>The train’s proper length L₀=300 m is the endpoint separation measured with the endpoints simultaneous in the train frame. At v=0.60c,</p><div class="p203-solution-equation">γ=1/√(1−v²/c²)=1/√(1−0.60²)=1.25.</div><p>A platform length measurement must record the rear and front at the same platform time. Length contraction gives</p><div class="p203-solution-equation is-answer">L=L₀/γ=300 m/1.25=<strong>240 m.</strong></div><p>To audit simultaneity, label the platform endpoint events A and B with Δt=0 and Δx=240 m. Transform their separation:</p><div class="p203-solution-equation">Δx′=γ(Δx−vΔt)=1.25(240 m)=300 m<br>Δt′=γ(Δt−vΔx/c²)<br>=−γ(0.60)(240 m)/c<br>=<strong>−0.600 μs.</strong></div><p>So B, the front event, occurs 0.600 μs earlier than A in the train frame. It is therefore not paired with A for a train-frame length measurement. The tilted t′=constant slice selects a different front event C and yields the 300 m proper length. An ordinary photograph also requires light-travel-time correction before it can supply the simultaneous platform coordinates used here.</p></section>`;
  }

  function snapshot() {
    const values = currentData();
    return JSON.stringify({ problem: PROBLEM, provenance: EXTENSION_DISCLOSURE, model: "one-dimensional inertial train; endpoint coordinates are corrected for photon travel time; train moves in +x", lightSpeedMetresPerSecond: LIGHT_SPEED_METRES_PER_SECOND, trainSpeedFractionOfC: values.beta, trainSpeedMetresPerSecond: values.beta * LIGHT_SPEED_METRES_PER_SECOND, lorentzFactor: values.gamma, properLengthMetres: values.properLengthMetres, platformContractedLengthMetres: values.contractedLengthMetres, contractionMetres: values.contractionMetres, correctedPlatformSnapshot: { timeMicroseconds: values.snapshotTimeMicroseconds, rearPositionMetres: values.rearPositionMetres, frontPositionMetres: values.frontPositionMetres, simultaneousInPlatform: true }, platformSimultaneousPair: { deltaTimeMicroseconds: values.platformPair.deltaTimeMicroseconds, deltaPositionMetres: values.platformPair.deltaPositionMetres, transformedTrainDeltaTimeMicroseconds: values.platformPair.trainDeltaTimeMicroseconds, transformedTrainDeltaPositionMetres: values.platformPair.trainDeltaPositionMetres }, trainSimultaneousPair: { deltaTrainTimeMicroseconds: values.trainPair.trainDeltaTimeMicroseconds, deltaTrainPositionMetres: values.trainPair.trainDeltaPositionMetres, transformedPlatformDeltaTimeMicroseconds: values.trainPair.platformDeltaTimeMicroseconds, transformedPlatformDeltaPositionMetres: values.trainPair.platformDeltaPositionMetres }, selectedSlice: state.selectedSlice, invariants: { lengthIdentityResidualMetres: Number(values.lengthIdentityResidualMetres.toExponential(6)), platformTransformTimeResidualSeconds: Number(values.platformTransformTimeResidualSeconds.toExponential(6)), inverseTransformTimeResidualSeconds: Number(values.inverseTransformTimeResidualSeconds.toExponential(6)), intervalResidualSquareMetres: Number(values.intervalResidualSquareMetres.toExponential(6)) }, challenge: { speedFractionOfC: CHALLENGE_BETA, gamma: challenge.gamma, properLengthMetres: PROPER_LENGTH_METRES, platformLengthMetres: challenge.contractedLengthMetres, platformPairTrainTimeGapMicroseconds: challenge.platformPair.trainDeltaTimeMicroseconds }, stage: state.stage + 1, answerMetres: state.answer || null, committed: state.committed, hintsUsed: state.hintsUsed, solutionRevealed: state.revealed }, null, 2);
  }

  function restoreChallenge() { state.beta = CHALLENGE_BETA; state.snapshotTimeMicroseconds = 0; state.selectedSlice = "platform"; }
  function render() {
    return `<main class="book-shell p203-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · special relativity</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p203-spread"><article class="book-page p203-problem-page"><div class="problem-number">Problem 20.3</div><h1 class="book-title p203-title">The Train Inside a Snapshot</h1><div class="difficulty" aria-label="Two star difficulty">★★</div>${originalExtensionNote()}<p class="problem-copy">A train has proper length L₀=300 m and passes a platform at 0.60c. Platform observers correct for light-travel delay and record the positions of both ends at the same platform time.</p><p class="problem-copy"><strong>What platform-frame length do they measure?</strong></p><section class="p203-observation-card"><strong>Length is a simultaneous coordinate difference</strong><p>“Where is the rear?” and “Where is the front?” must be answered at the same time in the measuring frame.</p></section><section class="p203-model-card"><div class="eyebrow">Measurement protocol</div><p>Synchronized platform detectors—or a light-delay-corrected photograph—supply the endpoint events. A raw photograph alone does not.</p></section></article><section class="book-page book-stage p203-stage">${stageControls()}<div class="p203-visual-card">${dynamicMarkup()}${stageCaption()}</div>${speedControlsMarkup()}</section><aside class="book-page book-coach p203-coach"><div class="coach-kicker">Measure one moving train</div><p class="coach-question">For L₀=300 m and v=0.60c, enter the simultaneous platform endpoint separation.</p><form class="p203-answer-form" data-p203-answer-form novalidate><label for="p203-answer">Platform-frame train length</label><div><input id="p203-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="length" autocomplete="off"/><span>m</span></div><button class="primary-button" type="submit">Check length</button></form>${feedbackMarkup()}<div class="button-row p203-help-row"><button class="secondary-button" type="button" data-problem-action="p203-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p203-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p203-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateDynamicDom() {
    const root = document.querySelector(".p203-shell"); if (!root) return;
    const dynamic = root.querySelector(".p203-dynamic");
    const active = document.activeElement;
    let restoreFocusSelector = "";
    if (dynamic?.contains(active)) {
      if (active.id === "p203-snapshot-time") restoreFocusSelector = "#p203-snapshot-time";
      else if (active.dataset?.problemAction === "p203-slice") restoreFocusSelector = `[data-problem-action="p203-slice"][data-p203-slice="${active.dataset.p203Slice}"]`;
      else if (active.dataset?.problemAction === "p203-time") restoreFocusSelector = `[data-problem-action="p203-time"][data-p203-time="${active.dataset.p203Time}"]`;
    }
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const values = currentData();
    const output = root.querySelector('[data-p203-output="speed"]'); if (output) output.textContent = `${format(state.beta, 2)}c`;
    const note = root.querySelector("[data-p203-control-note]"); if (note) note.textContent = `At ${format(state.beta, 2)}c, γ=${format(values.gamma, 4)} and a same-platform-time endpoint pair gives L=L₀/γ=${format(values.contractedLengthMetres, 1)} m. The train-frame time gap for that pair is ${signed(values.platformPair.trainDeltaTimeMicroseconds, 3)} μs.`;
    root.querySelector("#p203-speed")?.setAttribute("aria-valuetext", `${format(state.beta, 2)} times light speed; gamma ${format(values.gamma, 4)}; platform length ${format(values.contractedLengthMetres, 1)} metres`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    if (restoreFocusSelector) { const replacement = root.querySelector(restoreFocusSelector); if (replacement) { try { replacement.focus({ preventScroll: true }); } catch (_error) { replacement.focus(); } } }
  }

  function renderAndFocus(renderApp, selector) { renderApp(); window.requestAnimationFrame(() => document.querySelector(selector)?.focus()); }
  function bind({ render: renderApp }) {
    const root = document.querySelector(".p203-shell");
    root?.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]"); if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p203-reset") { state = initialState(); renderAndFocus(renderApp, "#p203-snapshot-time"); return; }
      if (action === "p203-stage") { state.stage = clamp(Number(control.dataset.p203Stage), 0, 2); renderAndFocus(renderApp, `[data-p203-stage="${state.stage}"]`); return; }
      if (action === "p203-next-stage") { state.stage = Math.min(2, state.stage + 1); renderAndFocus(renderApp, `[data-p203-stage="${state.stage}"]`); return; }
      if (action === "p203-slice") { state.selectedSlice = control.dataset.p203Slice === "train" ? "train" : "platform"; updateDynamicDom(); return; }
      if (action === "p203-time") { state.snapshotTimeMicroseconds = clamp(Number(control.dataset.p203Time), -.8, .8); updateDynamicDom(); return; }
      if (action === "p203-challenge") restoreChallenge();
      if (action === "p203-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p203-reveal") { state.revealed = true; state.stage = 2; restoreChallenge(); }
      renderApp(); if (action === "p203-reveal") window.requestAnimationFrame(() => document.querySelector("#p203-solution-heading")?.focus());
    });
    root?.addEventListener("input", (event) => {
      if (event.target.matches("#p203-snapshot-time")) { state.snapshotTimeMicroseconds = clamp(Number(event.target.value), -.8, .8); updateDynamicDom(); return; }
      if (!event.target.matches("#p203-speed")) return;
      state.beta = clamp(Number(event.target.value), 0, .8); updateDynamicDom();
    });
    const input = document.querySelector("#p203-answer"); input?.addEventListener("input", (event) => { state.answer = sanitizeNumber(event.target.value); });
    document.querySelector("[data-p203-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault(); state.answer = sanitizeNumber(input?.value).trim(); const answer = Number(state.answer); state.feedbackTone = "warn"; state.committed = false;
      if (!state.answer || !Number.isFinite(answer)) state.feedback = "Enter one numerical length in metres.";
      else if (Math.abs(answer - PROPER_LENGTH_METRES) <= .5) state.feedback = "300 m is the proper length measured with train-frame simultaneous endpoints. The platform pair must be simultaneous on the platform.";
      else if (Math.abs(answer - challenge.contractedLengthMetres) > .5) state.feedback = "Use L=L₀/γ with γ=1/√(1−0.60²)=1.25.";
      else { state.feedbackTone = "success"; state.committed = true; state.stage = 2; restoreChallenge(); state.feedback = "Correct: a simultaneous platform snapshot measures L=300/1.25=240 m."; }
      renderAndFocus(renderApp, "#p203-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
