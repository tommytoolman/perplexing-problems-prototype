(function registerImprovedInfernalOscillatorPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "6.5";
  const PRIMARY_MASS = 2;
  const PRIMARY_STIFFNESS = 18;
  const FORCE_AMPLITUDE = 1;
  const FREE_AMPLITUDE = 0.45;
  const CHALLENGE = Object.freeze({ absorberMass: 0.5, couplingStiffness: 8, driveOmega: 4 });
  const stages = Object.freeze([
    Object.freeze({ short: "Eigenmodes", title: "Split the original resonance", copy: "The absorber adds a second degree of freedom. The two mass-weighted eigenvectors oscillate at distinct natural frequencies." }),
    Object.freeze({ short: "Beating", title: "Superpose both free modes", copy: "Releasing only the primary mass excites both modes. Their changing relative phase transfers energy between primary and absorber." }),
    Object.freeze({ short: "Antiresonance", title: "Tune cancellation at the drive frequency", copy: "Between the two resonances, one exact absorber stiffness makes the primary’s harmonic-response numerator vanish." }),
  ]);
  const hints = Object.freeze([
    "For harmonic responses x=X cosΩt and y=Y cosΩt, write the two dynamic-stiffness equations before trying to optimise anything.",
    "They are (K+κ−MΩ²)X−κY=F₀ and −κX+(κ−mΩ²)Y=0.",
    "Perfect suppression means X=0 while Y is allowed to move. The second equation then needs a nonzero Y.",
    "Therefore κ−mΩ²=0. Check the first equation: it gives Y=−F₀/κ, so the solution is finite rather than resonant.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p65-reset">Reset</button>';

  const initialState = () => ({
    absorberMass: CHALLENGE.absorberMass,
    couplingStiffness: CHALLENGE.couplingStiffness,
    driveOmega: CHALLENGE.driveOmega,
    time: 0,
    stage: 0,
    answer: "",
    feedback: "",
    feedbackTone: "neutral",
    committed: false,
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function clean(value, digits = 3) {
    if (!Number.isFinite(value)) return "∞";
    const rounded = Number(value).toFixed(digits);
    return Object.is(Number(rounded), -0) ? Number(0).toFixed(digits) : rounded;
  }

  function signed(value, digits = 3) {
    if (!Number.isFinite(value)) return value < 0 ? "−∞" : "+∞";
    if (Math.abs(value) < 0.5 * 10 ** -digits) return Number(0).toFixed(digits);
    return `${value > 0 ? "+" : "−"}${clean(Math.abs(value), digits)}`;
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeNumber(value) {
    return String(value).replaceAll("−", "-").replace(/[^0-9.\s+-]/g, "").slice(0, 16);
  }

  function modes(absorberMass = state.absorberMass, couplingStiffness = state.couplingStiffness) {
    const a = PRIMARY_MASS * absorberMass;
    const b = (PRIMARY_STIFFNESS + couplingStiffness) * absorberMass + PRIMARY_MASS * couplingStiffness;
    const c = PRIMARY_STIFFNESS * couplingStiffness;
    const discriminant = Math.max(0, b ** 2 - 4 * a * c);
    const lambdaLow = (b - Math.sqrt(discriminant)) / (2 * a);
    const lambdaHigh = (b + Math.sqrt(discriminant)) / (2 * a);

    function eigenvector(lambda, lowMode) {
      if (couplingStiffness <= 1e-10) {
        return lowMode
          ? { primary: 0, absorber: 1 / Math.sqrt(absorberMass) }
          : { primary: 1 / Math.sqrt(PRIMARY_MASS), absorber: 0 };
      }
      let primary = couplingStiffness - absorberMass * lambda;
      let absorber = couplingStiffness;
      const norm = Math.sqrt(PRIMARY_MASS * primary ** 2 + absorberMass * absorber ** 2);
      primary /= norm;
      absorber /= norm;
      if (primary < 0) { primary *= -1; absorber *= -1; }
      return { primary, absorber };
    }

    const lowVector = eigenvector(lambdaLow, true);
    const highVector = eigenvector(lambdaHigh, false);
    return {
      lambdaLow,
      lambdaHigh,
      omegaLow: Math.sqrt(Math.max(0, lambdaLow)),
      omegaHigh: Math.sqrt(Math.max(0, lambdaHigh)),
      lowVector,
      highVector,
      beatPeriod: Math.abs(lambdaHigh - lambdaLow) <= 1e-12 ? Infinity : 2 * Math.PI / (Math.sqrt(lambdaHigh) - Math.sqrt(lambdaLow)),
    };
  }

  function freeMotion(time = state.time) {
    const eigen = modes();
    const initial = { primary: FREE_AMPLITUDE, absorber: 0 };
    const coefficientLow = eigen.lowVector.primary * PRIMARY_MASS * initial.primary;
    const coefficientHigh = eigen.highVector.primary * PRIMARY_MASS * initial.primary;
    const lowCos = Math.cos(eigen.omegaLow * time);
    const highCos = Math.cos(eigen.omegaHigh * time);
    const lowSin = Math.sin(eigen.omegaLow * time);
    const highSin = Math.sin(eigen.omegaHigh * time);
    const primaryLow = eigen.lowVector.primary * coefficientLow * lowCos;
    const primaryHigh = eigen.highVector.primary * coefficientHigh * highCos;
    const absorberLow = eigen.lowVector.absorber * coefficientLow * lowCos;
    const absorberHigh = eigen.highVector.absorber * coefficientHigh * highCos;
    return {
      primary: primaryLow + primaryHigh,
      absorber: absorberLow + absorberHigh,
      primaryVelocity: -eigen.lowVector.primary * coefficientLow * eigen.omegaLow * lowSin - eigen.highVector.primary * coefficientHigh * eigen.omegaHigh * highSin,
      absorberVelocity: -eigen.lowVector.absorber * coefficientLow * eigen.omegaLow * lowSin - eigen.highVector.absorber * coefficientHigh * eigen.omegaHigh * highSin,
      primaryLow,
      primaryHigh,
      absorberLow,
      absorberHigh,
      coefficientLow,
      coefficientHigh,
      eigen,
    };
  }

  function freeEnergy(time = state.time) {
    const motion = freeMotion(time);
    const kinetic = 0.5 * PRIMARY_MASS * motion.primaryVelocity ** 2 + 0.5 * state.absorberMass * motion.absorberVelocity ** 2;
    const primaryPotential = 0.5 * PRIMARY_STIFFNESS * motion.primary ** 2;
    const couplingPotential = 0.5 * state.couplingStiffness * (motion.absorber - motion.primary) ** 2;
    return { kinetic, primaryPotential, couplingPotential, total: kinetic + primaryPotential + couplingPotential };
  }

  function forcedResponse(
    absorberMass = state.absorberMass,
    couplingStiffness = state.couplingStiffness,
    driveOmega = state.driveOmega,
  ) {
    const primaryDynamic = PRIMARY_STIFFNESS + couplingStiffness - PRIMARY_MASS * driveOmega ** 2;
    const absorberDynamic = couplingStiffness - absorberMass * driveOmega ** 2;
    const determinant = primaryDynamic * absorberDynamic - couplingStiffness ** 2;
    const tuningStiffness = absorberMass * driveOmega ** 2;
    const tuningError = couplingStiffness - tuningStiffness;
    if (Math.abs(determinant) <= 1e-7) {
      const sign = determinant < 0 ? -1 : 1;
      return { primaryAmplitude: sign * Infinity, absorberAmplitude: sign * Infinity, determinant, tuningStiffness, tuningError, atPole: true };
    }
    return {
      primaryAmplitude: FORCE_AMPLITUDE * absorberDynamic / determinant,
      absorberAmplitude: FORCE_AMPLITUDE * couplingStiffness / determinant,
      determinant,
      tuningStiffness,
      tuningError,
      atPole: false,
    };
  }

  const challengeResponse = forcedResponse(CHALLENGE.absorberMass, CHALLENGE.couplingStiffness, CHALLENGE.driveOmega);
  const challengeModes = modes(CHALLENGE.absorberMass, CHALLENGE.couplingStiffness);

  function springPath(startX, endX, y, turns = 8, amplitude = 9) {
    const lead = Math.min(13, Math.max(4, Math.abs(endX - startX) * 0.12));
    const direction = Math.sign(endX - startX || 1);
    const innerStart = startX + direction * lead;
    const innerEnd = endX - direction * lead;
    const points = [`M${clean(startX, 2)},${y}`, `L${clean(innerStart, 2)},${y}`];
    for (let index = 1; index < turns * 2; index += 1) {
      const fraction = index / (turns * 2);
      const x = innerStart + (innerEnd - innerStart) * fraction;
      points.push(`L${clean(x, 2)},${clean(y + (index % 2 ? -amplitude : amplitude), 2)}`);
    }
    points.push(`L${clean(innerEnd, 2)},${y}`, `L${clean(endX, 2)},${y}`);
    return points.join(" ");
  }

  function plotPath(fn, colourKey) {
    const points = [];
    for (let index = 0; index <= 180; index += 1) {
      const time = 12 * index / 180;
      const value = fn(time);
      points.push({ x: 50 + time / 12 * 620, y: 330 - value / 0.7 * 78 });
    }
    return `<path class="p65-trace is-${colourKey}" d="${points.map((point, index) => `${index ? "L" : "M"}${clean(point.x, 2)} ${clean(point.y, 2)}`).join(" ")}" />`;
  }

  function oscillatorSvg() {
    const motion = freeMotion();
    const forced = forcedResponse();
    const primaryX = 285 + motion.primary * 95;
    const absorberX = 500 + motion.absorber * 95;
    const forcedPrimaryLength = Number.isFinite(forced.primaryAmplitude) ? Math.min(95, Math.abs(forced.primaryAmplitude) * 650) : 95;
    const forcedAbsorberLength = Number.isFinite(forced.absorberAmplitude) ? Math.min(95, Math.abs(forced.absorberAmplitude) * 350) : 95;
    const tuning = Math.abs(forced.tuningError) <= 0.005;
    return `
      <svg class="p65-svg p65-stage-${state.stage} ${tuning ? "is-tuned" : ""} ${forced.atPole ? "is-pole" : ""}" viewBox="0 0 720 430" role="img" aria-labelledby="p65-svg-title p65-svg-desc">
        <title id="p65-svg-title">Primary oscillator coupled to a tuned vibration absorber</title>
        <desc id="p65-svg-desc">The primary mass is ${PRIMARY_MASS} kilograms and absorber mass ${clean(state.absorberMass, 2)} kilograms. Coupling stiffness is ${clean(state.couplingStiffness, 2)} newtons per metre. Natural angular frequencies are ${clean(motion.eigen.omegaLow, 3)} and ${clean(motion.eigen.omegaHigh, 3)} radians per second. At drive frequency ${clean(state.driveOmega, 2)}, the signed primary response is ${signed(forced.primaryAmplitude, 4)} metres. ${tuning ? "The absorber is tuned to anti-resonance." : "The absorber is not exactly tuned."}</desc>
        <defs><marker id="p65-force-arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L9 4.5 L0 9 Z" /></marker><linearGradient id="p65-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e1ecef"/><stop offset="1" stop-color="#f6efdc"/></linearGradient></defs>
        <rect width="720" height="430" fill="url(#p65-bg)" />
        <g class="p65-apparatus" aria-hidden="true">
          <path class="p65-wall" d="M48 55V210 M29 63H48 M29 84H48 M29 105H48 M29 126H48 M29 147H48 M29 168H48 M29 189H48" />
          <line class="p65-rail" x1="48" y1="178" x2="670" y2="178" />
          <line class="p65-equilibrium" x1="285" y1="67" x2="285" y2="203"/><line class="p65-equilibrium" x1="500" y1="67" x2="500" y2="203"/>
          <path class="p65-spring is-primary" d="${springPath(48, primaryX - 38, 131)}" />
          <path class="p65-spring is-absorber" d="${springPath(primaryX + 38, absorberX - 31, 131, 7, 8)}" />
          <g class="p65-mass is-primary" transform="translate(${clean(primaryX, 2)} 131)"><rect x="-38" y="-36" width="76" height="72" rx="10"/><text y="5">M</text></g>
          <g class="p65-mass is-absorber" transform="translate(${clean(absorberX, 2)} 131)"><rect x="-31" y="-29" width="62" height="58" rx="9"/><text y="5">m</text></g>
          <text class="p65-spring-label" x="125" y="112">K=${PRIMARY_STIFFNESS} N/m</text><text class="p65-spring-label" x="405" y="112">κ=${clean(state.couplingStiffness, 1)} N/m</text>
          <text class="p65-motion-label" x="285" y="215">x=${signed(motion.primary, 3)} m</text><text class="p65-motion-label" x="500" y="215">y=${signed(motion.absorber, 3)} m</text>
        </g>
        <g class="p65-drive-layer" aria-hidden="true">
          <line class="p65-drive-force" x1="${clean(primaryX - 5)}" y1="70" x2="${clean(primaryX + 72)}" y2="70" marker-end="url(#p65-force-arrow)"/><text x="${clean(primaryX + 34)}" y="58">F₀ cosΩt</text>
          <g class="p65-response-bar" transform="translate(548 48)"><rect width="140" height="118" rx="13"/><text class="p65-bar-title" x="12" y="21">STEADY RESPONSE</text><text x="12" y="42">primary X ${signed(forced.primaryAmplitude, 4)} m</text><line class="p65-primary-bar" x1="14" y1="59" x2="${clean(14 + forcedPrimaryLength)}" y2="59"/><text x="12" y="82">absorber Y ${signed(forced.absorberAmplitude, 4)} m</text><line class="p65-absorber-bar" x1="14" y1="99" x2="${clean(14 + forcedAbsorberLength)}" y2="99"/></g>
        </g>
        <g class="p65-plot" aria-hidden="true">
          <rect x="35" y="239" width="650" height="166" rx="14"/><line class="p65-axis" x1="50" y1="330" x2="670" y2="330"/><text x="49" y="257">FREE RELEASE · modal superposition</text><text x="670" y="392" text-anchor="end">12 s</text>
          ${plotPath((time) => freeMotion(time).primaryLow, "low")}
          ${plotPath((time) => freeMotion(time).primaryHigh, "high")}
          ${plotPath((time) => freeMotion(time).primary, "primary")}
          ${plotPath((time) => freeMotion(time).absorber, "absorber")}
          <line class="p65-time-marker" x1="${clean(50 + state.time / 12 * 620)}" y1="254" x2="${clean(50 + state.time / 12 * 620)}" y2="391"/>
        </g>
      </svg>`;
  }

  function stageCardMarkup() {
    const eigen = modes();
    const forced = forcedResponse();
    if (state.stage === 0) return `<section class="p65-stage-card"><div class="eyebrow">Mass-weighted eigenstructure</div><strong>ω−=${clean(eigen.omegaLow, 4)} rad/s · mode [${clean(eigen.lowVector.primary, 3)}, ${clean(eigen.lowVector.absorber, 3)}]</strong><strong>ω+=${clean(eigen.omegaHigh, 4)} rad/s · mode [${clean(eigen.highVector.primary, 3)}, ${clean(eigen.highVector.absorber, 3)}]</strong><p>The vectors are normalised so φᵀMφ=1 and are mass-orthogonal.</p></section>`;
    if (state.stage === 1) return `<section class="p65-stage-card"><div class="eyebrow">Free modal mix</div><strong>x(t)=c−φ−,x cosω−t+c+φ+,x cosω+t</strong><p>The 0.45 m primary-only release has zero initial velocity and excites both modes. Beat period 2π/(ω+−ω−)=${clean(eigen.beatPeriod, 3)} s.</p></section>`;
    return `<section class="p65-stage-card ${Math.abs(forced.tuningError)<=.005 ? "is-tuned" : ""}"><div class="eyebrow">Forced anti-resonance</div><strong>κ*=mΩ²=${clean(forced.tuningStiffness, 3)} N/m · tuning error ${signed(forced.tuningError, 3)} N/m</strong><p>${forced.atPole ? "The ideal undamped response is at a resonance pole; a finite steady amplitude does not exist." : `Signed primary response X=${signed(forced.primaryAmplitude, 5)} m. Exact tuning makes X=0 while Y remains finite.`}</p></section>`;
  }

  function metricsMarkup() {
    const eigen=modes(),energy=freeEnergy(),energy0=freeEnergy(0),forced=forcedResponse();
    return `<section class="p65-metrics" aria-label="Tuned absorber calculations"><div><span>Lower natural frequency</span><strong>${clean(eigen.omegaLow,3)} rad/s</strong></div><div><span>Upper natural frequency</span><strong>${clean(eigen.omegaHigh,3)} rad/s</strong></div><div><span>Beat period</span><strong>${clean(eigen.beatPeriod,3)} s</strong></div><div><span>Free total energy</span><strong>${clean(energy.total,5)} J</strong></div><div><span>Energy drift</span><strong>${(energy.total-energy0.total).toExponential(1)} J</strong></div><div><span>Primary forced amplitude</span><strong>${signed(forced.primaryAmplitude,5)} m</strong></div></section>`;
  }

  function dynamicMarkup(){return `<div class="p65-dynamic">${oscillatorSvg()}${stageCardMarkup()}${metricsMarkup()}</div>`;}

  function controlsMarkup(){return `<section class="p65-controls" aria-label="Tuned absorber controls"><div class="p65-control-grid"><label for="p65-kappa"><span>Absorber stiffness κ<output data-p65-live="kappa">${clean(state.couplingStiffness,1)} N/m</output></span><input id="p65-kappa" type="range" min="0" max="25" step="0.1" value="${state.couplingStiffness}"/></label><label for="p65-mass"><span>Absorber mass m<output data-p65-live="mass">${clean(state.absorberMass,2)} kg</output></span><input id="p65-mass" type="range" min="0.2" max="1" step="0.01" value="${state.absorberMass}"/></label><label for="p65-drive"><span>Drive frequency Ω<output data-p65-live="drive">${clean(state.driveOmega,2)} rad/s</output></span><input id="p65-drive" type="range" min="2" max="5" step="0.01" value="${state.driveOmega}"/></label><label for="p65-time"><span>Free-motion time<output data-p65-live="time">${clean(state.time,2)} s</output></span><input id="p65-time" type="range" min="0" max="12" step="0.02" value="${state.time}"/></label></div><div class="p65-presets" role="group" aria-label="Absorber configurations"><button class="chip-button" type="button" data-problem-action="p65-preset" data-p65-preset="challenge">Challenge</button><button class="chip-button" type="button" data-problem-action="p65-preset" data-p65-preset="tune">Tune κ=mΩ²</button><button class="chip-button" type="button" data-problem-action="p65-preset" data-p65-preset="untuned">Under-tuned</button><button class="chip-button" type="button" data-problem-action="p65-preset" data-p65-preset="resonance">Drive lower mode</button><button class="chip-button" type="button" data-problem-action="p65-preset" data-p65-preset="uncoupled">κ=0</button></div></section>`;}

  function feedbackMarkup(){return state.feedback?`<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p65-hints">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function reconstructionNote(){return `<p class="p65-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>`;}

  function solutionMarkup(){if(!state.revealed)return"";return `<section class="p65-solution" aria-labelledby="p65-solution-heading"><h3 id="p65-solution-heading" tabindex="-1">Tune the absorber’s own frequency to the drive</h3><p>For free motion, the eigenvalues λ=ω² satisfy</p><div class="p65-equation">Mmλ²−[(K+κ)m+Mκ]λ+Kκ=0</div><p>At the challenge tuning this gives <strong>ω−=${clean(challengeModes.omegaLow,6)} rad/s</strong> and <strong>ω+=${clean(challengeModes.omegaHigh,6)} rad/s</strong>. The forcing frequency lies between them.</p><p>For the harmonic particular solution,</p><div class="p65-equation">(K+κ−MΩ²)X−κY=F₀<br>−κX+(κ−mΩ²)Y=0</div><p>Demanding zero primary response X=0 while retaining a nonzero absorber response requires</p><div class="p65-equation">κ*=mΩ²</div><p>With m=0.500 kg and Ω=4.00 rad/s, <strong>κ*=8.000 N/m</strong>. The first equation then gives Y=−F₀/κ=−0.125 m for F₀=1 N, while <strong>X=0</strong>.</p><p class="p65-limits"><strong>Checks.</strong> κ/m has units s⁻², so mΩ² has units kg·s⁻²=N/m. At κ=0 the absorber is a free zero-frequency mode and the primary returns to √(K/M)=3 rad/s. The free-motion energy ½Mẋ²+½mẏ²+½Kx²+½κ(y−x)² is conserved. At either undamped eigenfrequency the forced formula has a pole; real damping would make the resonance finite and the anti-resonance imperfect. As m→0 at fixed Ω, the required tuning stiffness tends to zero.</p></section>`;}

  function snapshot(){const eigen=modes(),motion=freeMotion(),energy=freeEnergy(),forced=forcedResponse();return JSON.stringify({problem:PROBLEM,reconstruction:true,primaryMassKg:PRIMARY_MASS,primaryStiffnessNewtonsPerMetre:PRIMARY_STIFFNESS,absorberMassKg:state.absorberMass,absorberStiffnessNewtonsPerMetre:state.couplingStiffness,driveAngularFrequencyRadiansPerSecond:state.driveOmega,naturalAngularFrequenciesRadiansPerSecond:[Number(eigen.omegaLow.toFixed(6)),Number(eigen.omegaHigh.toFixed(6))],beatPeriodSeconds:Number.isFinite(eigen.beatPeriod)?Number(eigen.beatPeriod.toFixed(6)):null,freeDisplacementsMetres:[Number(motion.primary.toFixed(6)),Number(motion.absorber.toFixed(6))],freeTotalEnergyJoules:Number(energy.total.toFixed(9)),forcedPrimaryAmplitudeMetres:Number.isFinite(forced.primaryAmplitude)?Number(forced.primaryAmplitude.toFixed(8)):null,forcedAbsorberAmplitudeMetres:Number.isFinite(forced.absorberAmplitude)?Number(forced.absorberAmplitude.toFixed(8)):null,tunedStiffnessNewtonsPerMetre:Number(forced.tuningStiffness.toFixed(6)),tuningErrorNewtonsPerMetre:Number(forced.tuningError.toFixed(6)),atUndampedPole:forced.atPole,stage:state.stage+1,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p65-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive coupled oscillations</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p65-spread"><article class="book-page p65-problem-page"><div class="problem-number">Problem 6.5</div><h1 class="book-title p65-title">Dr Springlove’s Improved Infernal Oscillator</h1><div class="difficulty" aria-label="Three star difficulty">★★★</div>${reconstructionNote()}<p class="problem-copy">A 2.00 kg primary mass is attached to a wall by an 18.0 N/m spring. Dr Springlove adds a 0.500 kg absorber mass connected to the primary by a spring κ. A force F₀cosΩt drives only the primary at Ω=4.00 rad/s.</p><p class="problem-copy">Choose κ so that the undamped steady-state displacement amplitude of the primary mass is exactly zero. Explain how this anti-resonance sits between the system’s two natural frequencies.</p><section class="p65-design-card"><strong>Exact design target</strong><p>Suppress the primary response X, not all motion. At the optimum the absorber moves out of phase and carries the response.</p></section><section class="p65-assumption-card"><div class="eyebrow">Model</div><p>Small horizontal motion, linear massless springs, no damping. Forced amplitudes are signed real coefficients relative to cosΩt; a negative coefficient is 180° out of phase.</p></section></article><section class="book-page book-stage p65-stage"><div class="p65-stage-controls" role="group" aria-label="Improved oscillator stages">${stages.map((stage,index)=>`<button class="secondary-button ${state.stage===index?"active":""}" type="button" data-problem-action="p65-stage" data-p65-stage="${index}" aria-pressed="${state.stage===index}"><span>${index+1}</span>${stage.short}</button>`).join("")}</div><div class="p65-stage-heading"><div><div class="eyebrow">Stage ${state.stage+1} of 3</div><h2>${stages[state.stage].title}</h2></div><p>${stages[state.stage].copy}</p><button class="ghost-button" type="button" data-problem-action="p65-next-stage" ${state.stage>=2?"disabled":""}>${state.stage>=2?"Design resolved":"Next stage"}</button></div>${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p65-coach"><div class="coach-kicker">Tune the infernal machine</div><p class="coach-question">What absorber stiffness makes the primary response vanish at Ω=4.00 rad/s?</p><form class="p65-answer-form" data-p65-answer-form novalidate><label for="p65-answer">Exact absorber stiffness κ</label><div><input id="p65-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="stiffness" autocomplete="off"/><span>N/m</span></div><button class="primary-button" type="submit">Check anti-resonance</button></form>${feedbackMarkup()}<div class="button-row p65-help-row"><button class="secondary-button" type="button" data-problem-action="p65-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p65-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p65-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(){const root=document.querySelector(".p65-shell");if(!root)return;const dynamic=root.querySelector(".p65-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();const values={kappa:`${clean(state.couplingStiffness,1)} N/m`,mass:`${clean(state.absorberMass,2)} kg`,drive:`${clean(state.driveOmega,2)} rad/s`,time:`${clean(state.time,2)} s`};Object.entries(values).forEach(([key,value])=>root.querySelectorAll(`[data-p65-live="${key}"]`).forEach(node=>{node.textContent=value;}));const eigen=modes(),forced=forcedResponse();root.querySelector("#p65-kappa")?.setAttribute("aria-valuetext",`Absorber stiffness ${clean(state.couplingStiffness,1)} newtons per metre; tuning error ${signed(forced.tuningError,2)}`);root.querySelector("#p65-mass")?.setAttribute("aria-valuetext",`Absorber mass ${clean(state.absorberMass,2)} kilograms; tuned stiffness ${clean(forced.tuningStiffness,2)} newtons per metre`);root.querySelector("#p65-drive")?.setAttribute("aria-valuetext",`Drive angular frequency ${clean(state.driveOmega,2)} radians per second; modes ${clean(eigen.omegaLow,2)} and ${clean(eigen.omegaHigh,2)}`);root.querySelector("#p65-time")?.setAttribute("aria-valuetext",`Free motion time ${clean(state.time,2)} seconds`);}
  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}){document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p65-reset"){state=initialState();renderAndFocus(renderApp,"#p65-kappa");return;}if(action==="p65-stage"){state.stage=clamp(Number(control.dataset.p65Stage),0,2);renderAndFocus(renderApp,`[data-p65-stage="${state.stage}"]`);return;}if(action==="p65-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p65-stage="${state.stage}"]`);return;}if(action==="p65-preset"){const preset=control.dataset.p65Preset;if(preset==="challenge"){state.absorberMass=.5;state.couplingStiffness=8;state.driveOmega=4;}if(preset==="tune")state.couplingStiffness=Number((state.absorberMass*state.driveOmega**2).toFixed(3));if(preset==="untuned")state.couplingStiffness=4;if(preset==="resonance")state.driveOmega=clamp(modes().omegaLow,2,5);if(preset==="uncoupled")state.couplingStiffness=0;renderAndFocus(renderApp,"#p65-kappa");return;}if(action==="p65-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p65-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p65-reveal")window.requestAnimationFrame(()=>document.querySelector("#p65-solution-heading")?.focus());}));[["#p65-kappa","couplingStiffness",0,25],["#p65-mass","absorberMass",.2,1],["#p65-drive","driveOmega",2,5],["#p65-time","time",0,12]].forEach(([selector,key,min,max])=>document.querySelector(selector)?.addEventListener("input",event=>{state[key]=clamp(Number(event.target.value),min,max);updateDynamicDom();}));const input=document.querySelector("#p65-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p65-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer);state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one stiffness in newtons per metre.";else if(Math.abs(answer-8)>.02)state.feedback="Set X=0 in the absorber’s harmonic equation. A nonzero Y then requires κ−mΩ²=0.";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback=`Correct: κ=mΩ²=0.500×4.00²=${clean(8,3)} N/m. Then X=0 and Y=${signed(challengeResponse.absorberAmplitude,3)} m for F₀=1 N.`;}renderAndFocus(renderApp,"#p65-answer");});}
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
