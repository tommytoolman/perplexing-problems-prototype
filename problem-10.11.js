(function registerExpandingMoonPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "10.11";
  const GRAVITATIONAL_CONSTANT = 6.6743e-11;
  const QUESTION = Object.freeze({ mass: 7.5e22, initialRadiusKm: 1750, finalRadiusKm: 3500 });
  const presets = Object.freeze([
    Object.freeze({ label: "Question · double radius", mass: 7.5e22, initialRadiusKm: 1750, finalRadiusKm: 3500 }),
    Object.freeze({ label: "No size change", mass: 7.5e22, initialRadiusKm: 1750, finalRadiusKm: 1750 }),
    Object.freeze({ label: "Gentle expansion", mass: 7.5e22, initialRadiusKm: 1750, finalRadiusKm: 2250 }),
    Object.freeze({ label: "Quasistatic contraction", mass: 7.5e22, initialRadiusKm: 3500, finalRadiusKm: 1750 }),
    Object.freeze({ label: "Low-mass moon", mass: 2e22, initialRadiusKm: 1000, finalRadiusKm: 3000 }),
  ]);
  const hints = Object.freeze([
    "For a uniform sphere, the gravitational binding energy is U=−3GM²/(5R). Use radii in metres.",
    "A quasistatic change begins and ends with no bulk kinetic energy, so ideal external work is Wext=Uf−Ui.",
    "Doubling R halves the magnitude of U: Uf=Ui/2. Both energies remain negative.",
    "The required work is positive because the final sphere is less tightly bound: Wext=(3GM²/5)(1/Ri−1/Rf).",
    "Substitute M=7.50×10²² kg, Ri=1.75×10⁶ m and Rf=3.50×10⁶ m.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p1011-reset">Reset</button>';

  const initialState = () => ({
    mass: QUESTION.mass,
    initialRadiusKm: QUESTION.initialRadiusKm,
    finalRadiusKm: QUESTION.finalRadiusKm,
    progressPercent: 0,
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

  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value.toFixed(digits));
    return Object.is(rounded, -0) ? "0" : String(rounded);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sphereValues(mass = state.mass, radiusKm = state.initialRadiusKm) {
    const safeMass = Math.max(Number(mass), 0);
    const radiusMetres = Math.max(Number(radiusKm) * 1000, 1e-12);
    const volume = 4 * Math.PI * radiusMetres ** 3 / 3;
    return {
      mass: safeMass,
      radiusKm: radiusMetres / 1000,
      radiusMetres,
      volume,
      density: safeMass / volume,
      surfaceGravity: GRAVITATIONAL_CONSTANT * safeMass / radiusMetres ** 2,
      escapeSpeed: Math.sqrt(2 * GRAVITATIONAL_CONSTANT * safeMass / radiusMetres),
      bindingEnergy: -3 * GRAVITATIONAL_CONSTANT * safeMass ** 2 / (5 * radiusMetres),
    };
  }

  function expansionValues() {
    const progress = clamp(state.progressPercent, 0, 100) / 100;
    const currentRadiusKm = state.initialRadiusKm + (state.finalRadiusKm - state.initialRadiusKm) * progress;
    const initial = sphereValues(state.mass, state.initialRadiusKm);
    const current = sphereValues(state.mass, currentRadiusKm);
    const final = sphereValues(state.mass, state.finalRadiusKm);
    const totalWork = final.bindingEnergy - initial.bindingEnergy;
    const suppliedWork = current.bindingEnergy - initial.bindingEnergy;
    return {
      progress,
      direction: state.finalRadiusKm > state.initialRadiusKm ? "expansion" : state.finalRadiusKm < state.initialRadiusKm ? "contraction" : "unchanged",
      currentRadiusKm,
      initial,
      current,
      final,
      totalWork,
      suppliedWork,
      remainingWork: totalWork - suppliedWork,
      radiusRatio: state.finalRadiusKm / state.initialRadiusKm,
    };
  }

  function questionValues() {
    const initial = sphereValues(QUESTION.mass, QUESTION.initialRadiusKm);
    const final = sphereValues(QUESTION.mass, QUESTION.finalRadiusKm);
    return { initial, final, work: final.bindingEnergy - initial.bindingEnergy };
  }

  const challenge = questionValues();

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.mass - state.mass) < 1e8
      && Math.abs(preset.initialRadiusKm - state.initialRadiusKm) < 1e-9
      && Math.abs(preset.finalRadiusKm - state.finalRadiusKm) < 1e-9
    ));
  }

  function directionCopy(values = expansionValues()) {
    if (values.direction === "expansion") return `Expansion · positive external work makes U less negative`;
    if (values.direction === "contraction") return `Contraction · gravity releases ${format(Math.abs(values.totalWork) / 1e28, 4)}×10²⁸ J`;
    return "No radius change · every state and energy is identical";
  }

  function sphereDots(centre, visualRadius, className) {
    const dots = [];
    const count = 34;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let index = 0; index < count; index += 1) {
      const radial = 0.82 * Math.sqrt((index + 0.5) / count) * visualRadius;
      const angle = index * goldenAngle;
      dots.push(`<circle class="p1011-mass-dot ${className}" cx="${format(centre.x + radial * Math.cos(angle), 2)}" cy="${format(centre.y + radial * Math.sin(angle), 2)}" r="2.4" />`);
    }
    return dots.join("");
  }

  function visualGeometry() {
    const values = expansionValues();
    const largestRadius = Math.max(state.initialRadiusKm, state.finalRadiusKm, values.currentRadiusKm, 1e-9);
    const visualRadius = (radiusKm) => Math.max(17, 94 * radiusKm / largestRadius);
    const initialCentre = { x: 132, y: 215 };
    const currentCentre = { x: 354, y: 215 };
    const initialVisualRadius = visualRadius(state.initialRadiusKm);
    const currentVisualRadius = visualRadius(values.currentRadiusKm);
    const finalVisualRadius = visualRadius(state.finalRadiusKm);
    const xStart = 503;
    const xEnd = 706;
    const yTop = 66;
    const yBottom = 335;
    let domainMinimum = Math.min(state.initialRadiusKm, state.finalRadiusKm);
    let domainMaximum = Math.max(state.initialRadiusKm, state.finalRadiusKm);
    if (Math.abs(domainMaximum - domainMinimum) < 1e-9) {
      domainMinimum = state.initialRadiusKm * 0.7;
      domainMaximum = state.initialRadiusKm * 1.3;
    }
    const energyAtMinimum = Math.abs(sphereValues(state.mass, domainMinimum).bindingEnergy) || 1;
    const xForRadius = (radiusKm) => xStart + (xEnd - xStart) * (radiusKm - domainMinimum) / (domainMaximum - domainMinimum);
    const yForEnergy = (energy) => yTop + (yBottom - yTop) * Math.abs(energy) / energyAtMinimum;
    const curvePoints = [];
    for (let index = 0; index <= 180; index += 1) {
      const radiusKm = domainMinimum + (domainMaximum - domainMinimum) * index / 180;
      curvePoints.push({ x: xForRadius(radiusKm), y: yForEnergy(sphereValues(state.mass, radiusKm).bindingEnergy) });
    }
    const curvePath = `M${curvePoints.map((point) => `${format(point.x, 2)},${format(point.y, 2)}`).join(" L")}`;
    return {
      values,
      largestRadius,
      initialCentre,
      currentCentre,
      initialVisualRadius,
      currentVisualRadius,
      finalVisualRadius,
      xStart,
      xEnd,
      yTop,
      yBottom,
      domainMinimum,
      domainMaximum,
      curvePath,
      initialPoint: { x: xForRadius(state.initialRadiusKm), y: yForEnergy(values.initial.bindingEnergy) },
      currentPoint: { x: xForRadius(values.currentRadiusKm), y: yForEnergy(values.current.bindingEnergy) },
      finalPoint: { x: xForRadius(state.finalRadiusKm), y: yForEnergy(values.final.bindingEnergy) },
    };
  }

  function apparatusMarkup() {
    const shape = visualGeometry();
    const values = shape.values;
    const arrowStart = values.direction === "contraction" ? 292 : 194;
    const arrowEnd = values.direction === "contraction" ? 194 : 292;
    return `
      <div class="p1011-apparatus-wrap">
        <svg class="p1011-apparatus is-${values.direction}" viewBox="0 0 740 420" role="img" aria-labelledby="p1011-apparatus-title p1011-apparatus-desc">
          <title id="p1011-apparatus-title">Fixed-mass uniform moon expanding or contracting quasistatically</title>
          <desc id="p1011-apparatus-desc">A uniform spherical moon of mass ${state.mass.toExponential(3)} kilograms changes from radius ${format(state.initialRadiusKm, 1)} kilometres to ${format(state.finalRadiusKm, 1)} kilometres. At ${format(state.progressPercent, 0)} percent progress its radius is ${format(values.currentRadiusKm, 1)} kilometres, density is ${format(values.current.density, 3)} kilograms per cubic metre, surface gravity is ${format(values.current.surfaceGravity, 5)} metres per second squared, escape speed is ${format(values.current.escapeSpeed / 1000, 5)} kilometres per second, and binding energy is ${values.current.bindingEnergy.toExponential(5)} joules.</desc>
          <defs>
            <radialGradient id="p1011-initial-gradient" cx="35%" cy="28%" r="75%"><stop offset="0" stop-color="#bfdae1" /><stop offset="0.58" stop-color="#6d8e9a" /><stop offset="1" stop-color="#3a5561" /></radialGradient>
            <radialGradient id="p1011-current-gradient" cx="35%" cy="28%" r="75%"><stop offset="0" stop-color="#d7cfb6" /><stop offset="0.58" stop-color="#9a855f" /><stop offset="1" stop-color="#5b4930" /></radialGradient>
            <marker id="p1011-arrow-change" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p1011-arrow-gravity" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p1011-arrow-escape" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <line class="p1011-divider" x1="473" y1="28" x2="473" y2="390" />
          <text class="p1011-panel-title" x="24" y="31">FIXED MASS · HOMOLOGOUS REDISTRIBUTION</text>
          <circle class="p1011-initial-sphere" cx="${shape.initialCentre.x}" cy="${shape.initialCentre.y}" r="${format(shape.initialVisualRadius, 2)}" />
          ${sphereDots(shape.initialCentre, shape.initialVisualRadius, "is-initial")}
          <circle class="p1011-current-sphere" cx="${shape.currentCentre.x}" cy="${shape.currentCentre.y}" r="${format(shape.currentVisualRadius, 2)}" />
          ${sphereDots(shape.currentCentre, shape.currentVisualRadius, "is-current")}
          <circle class="p1011-final-ring" cx="${shape.currentCentre.x}" cy="${shape.currentCentre.y}" r="${format(shape.finalVisualRadius, 2)}" />
          ${values.direction === "unchanged" ? "" : `<line class="p1011-change-arrow" x1="${arrowStart}" y1="76" x2="${arrowEnd}" y2="76" marker-end="url(#p1011-arrow-change)" />`}
          <text class="p1011-sphere-label" x="${shape.initialCentre.x}" y="350" text-anchor="middle">initial Rᵢ=${format(state.initialRadiusKm, 1)} km</text>
          <text class="p1011-sphere-label is-current" x="${shape.currentCentre.x}" y="350" text-anchor="middle">current R=${format(values.currentRadiusKm, 1)} km</text>
          <text class="p1011-sphere-label is-final" x="${shape.currentCentre.x}" y="369" text-anchor="middle">target Rf=${format(state.finalRadiusKm, 1)} km</text>
          <line class="p1011-gravity-arrow" x1="${format(shape.currentCentre.x - shape.currentVisualRadius - 57, 2)}" y1="${shape.currentCentre.y}" x2="${format(shape.currentCentre.x - shape.currentVisualRadius - 12, 2)}" y2="${shape.currentCentre.y}" marker-end="url(#p1011-arrow-gravity)" />
          <text class="p1011-force-label is-gravity" x="${format(shape.currentCentre.x - shape.currentVisualRadius - 34, 2)}" y="${shape.currentCentre.y - 11}" text-anchor="middle">g=${format(values.current.surfaceGravity, 3)} m/s²</text>
          <line class="p1011-escape-arrow" x1="${shape.currentCentre.x}" y1="${format(shape.currentCentre.y - shape.currentVisualRadius - 8, 2)}" x2="${shape.currentCentre.x}" y2="${format(shape.currentCentre.y - shape.currentVisualRadius - 54, 2)}" marker-end="url(#p1011-arrow-escape)" />
          <text class="p1011-force-label is-escape" x="${shape.currentCentre.x + 10}" y="${format(shape.currentCentre.y - shape.currentVisualRadius - 31, 2)}">vesc=${format(values.current.escapeSpeed / 1000, 3)} km/s</text>
          <text class="p1011-mass-label" x="24" y="395">same ${state.mass.toExponential(3)} kg shown by the same 34 mass markers</text>

          <g class="p1011-energy-graph">
            <text class="p1011-panel-title" x="495" y="31">BINDING ENERGY U(R)</text>
            <line class="p1011-zero-axis" x1="${shape.xStart}" y1="${shape.yTop}" x2="${shape.xEnd}" y2="${shape.yTop}" />
            <line class="p1011-radius-axis" x1="${shape.xStart}" y1="${shape.yBottom}" x2="${shape.xEnd}" y2="${shape.yBottom}" />
            <path class="p1011-energy-curve" d="${shape.curvePath}" />
            <circle class="p1011-energy-point is-initial" cx="${format(shape.initialPoint.x, 2)}" cy="${format(shape.initialPoint.y, 2)}" r="6" />
            <circle class="p1011-energy-point is-final" cx="${format(shape.finalPoint.x, 2)}" cy="${format(shape.finalPoint.y, 2)}" r="6" />
            <circle class="p1011-energy-point is-current" cx="${format(shape.currentPoint.x, 2)}" cy="${format(shape.currentPoint.y, 2)}" r="7" />
            <text class="p1011-axis-label" x="${shape.xStart}" y="52">0 J</text>
            <text class="p1011-axis-label is-lower" x="493" y="210" transform="rotate(-90 493 210)" text-anchor="middle">MORE NEGATIVE ↓</text>
            <text class="p1011-radius-tick" x="${shape.xStart}" y="357">${format(shape.domainMinimum, 0)} km</text><text class="p1011-radius-tick" x="${shape.xEnd}" y="357" text-anchor="end">${format(shape.domainMaximum, 0)} km</text>
            ${values.direction === "unchanged" ? `<text class="p1011-energy-label is-final" x="${format(shape.finalPoint.x + 8, 2)}" y="${format(shape.finalPoint.y - 10, 2)}">Ui=Uf ${values.final.bindingEnergy.toExponential(3)} J</text>` : `<text class="p1011-energy-label is-initial" x="${format(shape.initialPoint.x + 8, 2)}" y="${format(shape.initialPoint.y - 10, 2)}">Ui ${values.initial.bindingEnergy.toExponential(3)} J</text><text class="p1011-energy-label is-final" x="${format(shape.finalPoint.x + 8, 2)}" y="${format(shape.finalPoint.y + 18, 2)}">Uf ${values.final.bindingEnergy.toExponential(3)} J</text>`}
            <text class="p1011-work-label" x="606" y="392" text-anchor="middle">Wext=ΔU=${values.totalWork.toExponential(4)} J</text>
          </g>
        </svg>
        <div class="p1011-status-strip is-${values.direction}"><strong>${directionCopy(values)}</strong><span>Progress ${format(state.progressPercent, 0)}% · accumulated work ${values.suppliedWork.toExponential(4)} J</span></div>
      </div>`;
  }

  function metricsMarkup() {
    const values = expansionValues();
    return `
      <div class="p1011-metrics" aria-live="polite">
        <div><span>Current density</span><strong>${format(values.current.density, 3)} kg/m³</strong><small>M/(4πR³/3)</small></div>
        <div><span>Surface gravity</span><strong>${format(values.current.surfaceGravity, 6)} m/s²</strong><small>GM/R²</small></div>
        <div><span>Escape speed</span><strong>${format(values.current.escapeSpeed / 1000, 6)} km/s</strong><small>√(2GM/R)</small></div>
        <div><span>Binding energy</span><strong>${values.current.bindingEnergy.toExponential(5)} J</strong><small>−3GM²/(5R)</small></div>
      </div>`;
  }

  function auditMarkup() {
    const values = expansionValues();
    const ratio = values.radiusRatio;
    return `
      <div class="p1011-audit">
        <div><span>Radius ratio k</span><strong>${format(ratio, 5)}</strong><small>Rf/Ri</small></div>
        <div><span>Final density ratio</span><strong>${format(ratio ** -3, 6)}</strong><small>ρf/ρi=k⁻³</small></div>
        <div><span>Final gravity ratio</span><strong>${format(ratio ** -2, 6)}</strong><small>gf/gi=k⁻²</small></div>
        <div><span>Final escape-speed ratio</span><strong>${format(ratio ** -0.5, 6)}</strong><small>vesc,f/vesc,i=k⁻¹ᐟ²</small></div>
        <div><span>Total external work</span><strong>${values.totalWork.toExponential(5)} J</strong><small>Uf−Ui</small></div>
      </div>`;
  }

  function dynamicMarkup() {
    return `<div class="p1011-dynamic">${apparatusMarkup()}${metricsMarkup()}${auditMarkup()}</div>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <section class="p1011-controls" aria-label="Expanding moon controls">
        <div class="p1011-control-grid">
          <label for="p1011-mass"><span>Fixed moon mass M<output data-p1011-live="mass">${format(state.mass / 1e22, 2)}×10²² kg</output></span><input id="p1011-mass" data-p1011-slider="mass" type="range" min="10000000000000000000000" max="100000000000000000000000" step="1000000000000000000000" value="${state.mass}" /></label>
          <label for="p1011-initial-radius"><span>Initial radius Ri<output data-p1011-live="initial-radius">${format(state.initialRadiusKm, 0)} km</output></span><input id="p1011-initial-radius" data-p1011-slider="initial-radius" type="range" min="500" max="4000" step="50" value="${state.initialRadiusKm}" /></label>
          <label for="p1011-final-radius"><span>Final radius Rf<output data-p1011-live="final-radius">${format(state.finalRadiusKm, 0)} km</output></span><input id="p1011-final-radius" data-p1011-slider="final-radius" type="range" min="500" max="8000" step="50" value="${state.finalRadiusKm}" /></label>
          <label for="p1011-progress"><span>Quasistatic progress<output data-p1011-live="progress">${format(state.progressPercent, 0)}%</output></span><input id="p1011-progress" data-p1011-slider="progress" type="range" min="0" max="100" step="1" value="${state.progressPercent}" /></label>
        </div>
        <div class="p1011-presets" role="group" aria-label="Expansion presets">${presets.map((preset, index) => `<button class="chip-button ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p1011-preset" data-p1011-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p1011-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p1011-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p1011-solution" aria-labelledby="p1011-solution-heading">
        <h3 id="p1011-solution-heading" tabindex="-1">Expansion makes the binding energy less negative</h3>
        <p>For a uniform sphere assembled quasistatically from infinity,</p>
        <div class="p1011-equation">U(R)=−3GM²/(5R)</div>
        <p>The mass is fixed, so ideal external work equals the change in gravitational binding energy:</p>
        <div class="p1011-equation">W<sub>ext</sub>=Uf−Ui=(3GM²/5)(1/Ri−1/Rf)</div>
        <p>Convert both radii to metres and substitute:</p>
        <div class="p1011-equation is-answer">W<sub>ext</sub>=(3×6.6743×10⁻¹¹×(7.50×10²²)²/5)<br>×[1/(1.75×10⁶)−1/(3.50×10⁶)]<br>= ${challenge.work.toExponential(7)} J ≈ 6.44×10²⁸ J</div>
        <p>Because R doubles, |Uf|=|Ui|/2. The required work is positive: it supplies exactly the lost binding magnitude in this ideal quasistatic model.</p>
        <p class="p1011-limits"><strong>Checks and idealisation.</strong> The moon remains spherical and uniformly dense at every stage; total mass is fixed; expansion is quasistatic with no bulk kinetic energy; rotation, pressure work, material strength, heating, radiation and mass loss are omitted. Thus Wext=ΔU only. At fixed M, ρ∝R⁻³, gsurface∝R⁻², vescape∝R⁻¹ᐟ² and U∝−R⁻¹. As R→∞ all four tend to zero. If Rf=Ri, work is zero. Contraction makes Wext negative, meaning gravity releases energy. G in SI and R in metres give energy in joules.</p>
      </section>`;
  }

  function parseJoules(raw) {
    let normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    const units = [
      ["yj", 1e24], ["zj", 1e21], ["ej", 1e18], ["pj", 1e15], ["tj", 1e12],
      ["gj", 1e9], ["mj", 1e6], ["kj", 1e3], ["joules", 1], ["joule", 1], ["j", 1],
    ];
    let factor = 1;
    for (const [unit, multiplier] of units) {
      if (normalized.endsWith(unit)) {
        factor = multiplier;
        normalized = normalized.slice(0, -unit.length).trim();
        break;
      }
    }
    return Number(normalized) * factor;
  }

  function snapshot() {
    const values = expansionValues();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      idealisation: "fixed-mass uniform sphere at every stage; quasistatic radius change; gravitational energy only",
      gravitationalConstantCubicMetresPerKilogramSecondSquared: GRAVITATIONAL_CONSTANT,
      fixedMassKilograms: state.mass,
      initialRadiusKilometres: state.initialRadiusKm,
      finalRadiusKilometres: state.finalRadiusKm,
      progressPercent: state.progressPercent,
      currentRadiusKilometres: Number(values.currentRadiusKm.toFixed(9)),
      currentDensityKilogramsPerCubicMetre: Number(values.current.density.toFixed(9)),
      currentSurfaceGravityMetresPerSecondSquared: Number(values.current.surfaceGravity.toFixed(9)),
      currentEscapeSpeedMetresPerSecond: Number(values.current.escapeSpeed.toFixed(9)),
      initialBindingEnergyJoules: Number(values.initial.bindingEnergy.toPrecision(12)),
      currentBindingEnergyJoules: Number(values.current.bindingEnergy.toPrecision(12)),
      finalBindingEnergyJoules: Number(values.final.bindingEnergy.toPrecision(12)),
      suppliedExternalWorkJoules: Number(values.suppliedWork.toPrecision(12)),
      remainingExternalWorkJoules: Number(values.remainingWork.toPrecision(12)),
      totalExternalWorkJoules: Number(values.totalWork.toPrecision(12)),
      energyAuditResidualJoules: Number((values.suppliedWork + values.remainingWork - values.totalWork).toPrecision(6)),
      radiusRatio: Number(values.radiusRatio.toFixed(9)),
      questionAnswerJoules: Number(challenge.work.toPrecision(12)),
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p1011-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive gravitational binding</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p1011-spread">
          <article class="book-page p1011-problem-page">
            <div class="problem-number">Problem 10.11</div>
            <h1 class="book-title p1011-title">Mr Megalopolis’ expanding Moon</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="p1011-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written uniform-sphere expansion problem is not the book’s wording or solution.</p>
            <p class="problem-copy">Mr Megalopolis keeps a uniform spherical moon’s mass fixed at 7.50×10²² kg while slowly expanding its radius from 1,750 km to 3,500 km.</p>
            <p class="problem-copy">What minimum external work is required in an ideal quasistatic expansion?</p>
            <section class="p1011-model-card"><strong>Uniform-sphere sequence</strong><p>Every intermediate state is spherical and uniformly dense, with the same total mass. The expansion starts and ends at rest; only gravitational binding energy is included.</p></section>
            <section class="prediction-box"><div class="eyebrow">Follow the negative sign</div><p>A larger moon is less tightly bound: U remains negative but moves upwards towards zero. That change requires positive external work.</p></section>
          </article>

          <section class="book-page book-stage p1011-stage" aria-labelledby="p1011-stage-title">
            <div class="p1011-stage-heading"><div><span class="eyebrow">Uniform-moon laboratory</span><h2 id="p1011-stage-title">Spread the same mass thinner</h2></div><p>Vary mass and both endpoint radii, then scrub the quasistatic path while density, surface gravity, escape speed and binding energy update.</p></div>
            ${dynamicMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p1011-coach">
            <div class="coach-kicker">Audit the expansion work</div>
            <p class="coach-question">For the stated fixed mass and radius doubling, what ideal external work is required?</p>
            <form class="p1011-answer-form" data-p1011-answer-form novalidate>
              <label for="p1011-answer">Minimum external work</label>
              <div><input id="p1011-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="scientific notation" /><span>J</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p1011-help-row"><button class="secondary-button" type="button" data-problem-action="p1011-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p1011-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p1011-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p1011-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = {
      mass: `${format(state.mass / 1e22, 2)}×10²² kg`,
      "initial-radius": `${format(state.initialRadiusKm, 0)} km`,
      "final-radius": `${format(state.finalRadiusKm, 0)} km`,
      progress: `${format(state.progressPercent, 0)}%`,
    };
    Object.entries(outputs).forEach(([key, value]) => root.querySelectorAll(`[data-p1011-live="${key}"]`).forEach((node) => { node.textContent = value; }));
    const values = expansionValues();
    root.querySelector("#p1011-mass")?.setAttribute("aria-valuetext", `Fixed mass ${state.mass.toExponential(3)} kilograms; total external work ${values.totalWork.toExponential(3)} joules`);
    root.querySelector("#p1011-initial-radius")?.setAttribute("aria-valuetext", `Initial radius ${format(state.initialRadiusKm, 0)} kilometres; initial binding energy ${values.initial.bindingEnergy.toExponential(3)} joules`);
    root.querySelector("#p1011-final-radius")?.setAttribute("aria-valuetext", `Final radius ${format(state.finalRadiusKm, 0)} kilometres; ${directionCopy(values)}`);
    root.querySelector("#p1011-progress")?.setAttribute("aria-valuetext", `Quasistatic progress ${format(state.progressPercent, 0)} percent; accumulated external work ${values.suppliedWork.toExponential(3)} joules`);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p1011-preset"]').forEach((button) => {
      const active = Number(button.dataset.p1011Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderAndFocus(rerender, selector) {
    rerender();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p1011-shell");
    if (!root) return;

    root.querySelectorAll("[data-p1011-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const kind = event.target.dataset.p1011Slider;
        if (kind === "mass") state.mass = clamp(event.target.value, 1e22, 1e23);
        if (kind === "initial-radius") state.initialRadiusKm = clamp(event.target.value, 500, 4000);
        if (kind === "final-radius") state.finalRadiusKm = clamp(event.target.value, 500, 8000);
        if (kind === "progress") state.progressPercent = clamp(event.target.value, 0, 100);
        state.feedback = "";
        state.committed = false;
        updateDynamicDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p1011-reset") {
          state = initialState();
          renderAndFocus(rerender, "#p1011-mass");
          return;
        }
        if (action === "p1011-preset") {
          const preset = presets[Number(control.dataset.p1011Preset)];
          if (preset) {
            state.mass = preset.mass;
            state.initialRadiusKm = preset.initialRadiusKm;
            state.finalRadiusKm = preset.finalRadiusKm;
            state.progressPercent = 0;
            state.feedback = "";
            state.committed = false;
          }
          renderAndFocus(rerender, "#p1011-progress");
          return;
        }
        if (action === "p1011-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p1011-reveal") state.revealed = true;
        rerender();
        if (action === "p1011-reveal") window.requestAnimationFrame(() => document.querySelector("#p1011-solution-heading")?.focus());
      });
    });

    root.querySelector("#p1011-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelector("[data-p1011-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p1011-answer")?.value || "";
      const answer = parseJoules(raw);
      const exact = challenge.work;
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(answer)) {
        state.feedback = "Enter the external work in joules; scientific notation and SI-prefixed joules are accepted.";
        state.feedbackTone = "warn";
      } else if (Math.abs(answer - exact) <= Math.abs(exact) * 0.002) {
        state.feedback = `Correct. Doubling the radius halves the binding magnitude, requiring ${exact.toExponential(5)} J of positive work.`;
        state.feedbackTone = "success";
        state.committed = true;
        state = { ...state, mass: QUESTION.mass, initialRadiusKm: QUESTION.initialRadiusKm, finalRadiusKm: QUESTION.finalRadiusKm, progressPercent: 100 };
      } else if (Math.abs(answer + exact) <= Math.abs(exact) * 0.002) {
        state.feedback = "That has the correct magnitude but the wrong sign. Expansion raises U towards zero, so the external agent supplies positive work.";
      } else if (Math.abs(answer - Math.abs(challenge.initial.bindingEnergy)) <= Math.abs(challenge.initial.bindingEnergy) * 0.002) {
        state.feedback = "That is the initial binding-energy magnitude. Subtract the still-negative final binding energy; doubling radius removes only half the magnitude.";
      } else if (Math.abs(answer) < Math.abs(exact) * 1e-4) {
        state.feedback = "The radii must be converted from kilometres to metres before using SI G. Check the missing factor of 1000.";
      } else {
        state.feedback = "Use Wext=Uf−Ui with U=−3GM²/(5R). Keep both binding energies negative and both radii in metres.";
      }
      renderAndFocus(rerender, "#p1011-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
