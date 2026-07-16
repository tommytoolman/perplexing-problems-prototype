(function registerFloatingPigsPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "11.3";
  const QUESTION = Object.freeze({ focalLength: 12, objectDistance: 18, objectHeight: 4 });
  const presets = Object.freeze([
    Object.freeze({ label: "Question · magnified real", focalLength: 12, objectDistance: 18, objectHeight: 4 }),
    Object.freeze({ label: "At 2f · same size", focalLength: 12, objectDistance: 24, objectHeight: 4 }),
    Object.freeze({ label: "Beyond 2f · reduced", focalLength: 12, objectDistance: 36, objectHeight: 4 }),
    Object.freeze({ label: "At focus · infinity", focalLength: 12, objectDistance: 12, objectHeight: 4 }),
    Object.freeze({ label: "Inside focus · virtual", focalLength: 12, objectDistance: 8, objectHeight: 4 }),
  ]);
  const hints = Object.freeze([
    "Use the real-is-positive mirror convention: a concave mirror has f>0 and the hidden real object has do>0.",
    "The paraxial mirror equation is 1/f=1/do+1/di.",
    "Rearrange before substituting: di=fdo/(do−f).",
    "With f=12 cm and do=18 cm, di=(12×18)/(18−12) cm.",
    "Magnification is m=−di/do. Its negative sign means the real image is inverted relative to the hidden object.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p113-reset">Reset</button>';

  const initialState = () => ({
    focalLength: QUESTION.focalLength,
    objectDistance: QUESTION.objectDistance,
    objectHeight: QUESTION.objectHeight,
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
    if (!Number.isFinite(value)) return "∞";
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

  function mirrorAnalysis(
    focalLength = state.focalLength,
    objectDistance = state.objectDistance,
    objectHeight = state.objectHeight,
  ) {
    const focal = Math.max(Number(focalLength), 1e-12);
    const object = Math.max(Number(objectDistance), 1e-12);
    const denominator = object - focal;
    const atFocus = Math.abs(denominator) < 1e-9;
    const imageDistance = atFocus ? Infinity : focal * object / denominator;
    const magnification = atFocus ? -Infinity : -imageDistance / object;
    const imageHeight = atFocus ? Infinity : magnification * Number(objectHeight);
    return {
      focalLength: focal,
      objectDistance: object,
      objectHeight: Number(objectHeight),
      imageDistance,
      magnification,
      imageHeight,
      reciprocalResidual: atFocus ? 0 : 1 / focal - 1 / object - 1 / imageDistance,
      kind: atFocus ? "infinite" : imageDistance > 0 ? "real" : "virtual",
      orientation: atFocus ? "none" : magnification < 0 ? "inverted" : "upright",
    };
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.focalLength - state.focalLength) < 1e-9
      && Math.abs(preset.objectDistance - state.objectDistance) < 1e-9
      && Math.abs(preset.objectHeight - state.objectHeight) < 1e-9
    ));
  }

  function stateCopy(analysis = mirrorAnalysis()) {
    if (analysis.kind === "real") return `Real ${analysis.orientation} image · rays actually converge in front of the mirror`;
    if (analysis.kind === "virtual") return `Virtual upright image · only backward ray extensions meet behind the mirror`;
    return "Object at the focal point · reflected rays are parallel and the image is at infinity";
  }

  function yOnLine(first, second, x) {
    if (Math.abs(second.x - first.x) < 1e-12) return first.y;
    return first.y + (second.y - first.y) * (x - first.x) / (second.x - first.x);
  }

  function pigMarkup(x, baselineY, signedHeight, className) {
    const direction = signedHeight >= 0 ? -1 : 1;
    const centreY = baselineY + direction * Math.max(13, Math.abs(signedHeight) * 0.56);
    const scale = Math.min(1, Math.max(0.42, Math.abs(signedHeight) / 42));
    const rotation = signedHeight >= 0 ? 0 : 180;
    return `<g class="p113-pig ${className}" transform="translate(${format(x, 2)} ${format(centreY, 2)}) rotate(${rotation}) scale(${format(scale, 3)})"><ellipse cx="0" cy="0" rx="21" ry="12" /><circle cx="18" cy="-3" r="9" /><path d="M12-10l3-9 6 8M22-10l7-7 1 10M-13 8v11M4 9v10" /><circle class="p113-pig-eye" cx="21" cy="-5" r="1.5" /></g>`;
  }

  function diagramGeometry() {
    const analysis = mirrorAnalysis();
    const mirrorX = 550;
    const axisY = 220;
    const leftX = 40;
    const rightX = 718;
    const finiteImage = Number.isFinite(analysis.imageDistance);
    const maximumPositive = Math.max(analysis.objectDistance, analysis.focalLength * 2, finiteImage && analysis.imageDistance > 0 ? analysis.imageDistance : 0, 1);
    const maximumNegative = finiteImage && analysis.imageDistance < 0 ? Math.abs(analysis.imageDistance) : 0;
    const scale = Math.min(430 / maximumPositive, maximumNegative > 0 ? 148 / maximumNegative : Infinity);
    const objectX = mirrorX - analysis.objectDistance * scale;
    const focusX = mirrorX - analysis.focalLength * scale;
    const centreX = mirrorX - 2 * analysis.focalLength * scale;
    const imageX = finiteImage ? mirrorX - analysis.imageDistance * scale : null;
    const maximumHeightCm = finiteImage ? Math.max(Math.abs(analysis.objectHeight), Math.abs(analysis.imageHeight), 1e-9) : Math.abs(analysis.objectHeight);
    const heightScale = Math.min(7, 80 / maximumHeightCm);
    const objectHeightPixels = analysis.objectHeight * heightScale;
    const imageHeightPixels = finiteImage ? analysis.imageHeight * heightScale : null;
    const objectTip = { x: objectX, y: axisY - objectHeightPixels };
    const parallelHit = { x: mirrorX, y: objectTip.y };
    const vertex = { x: mirrorX, y: axisY };
    const focus = { x: focusX, y: axisY };
    const ray1End = { x: leftX, y: yOnLine(parallelHit, focus, leftX) };
    const incidentSlope = (axisY - objectTip.y) / (mirrorX - objectX);
    const reflectedSlope = -incidentSlope;
    const ray2End = { x: leftX, y: axisY + reflectedSlope * (leftX - mirrorX) };
    const virtualRay1End = finiteImage && analysis.kind === "virtual" ? { x: imageX, y: yOnLine(parallelHit, focus, imageX) } : null;
    const virtualRay2End = finiteImage && analysis.kind === "virtual" ? { x: imageX, y: axisY + reflectedSlope * (imageX - mirrorX) } : null;
    return {
      analysis,
      mirrorX,
      axisY,
      leftX,
      rightX,
      scale,
      objectX,
      focusX,
      centreX,
      imageX,
      objectHeightPixels,
      imageHeightPixels,
      objectTip,
      parallelHit,
      vertex,
      focus,
      ray1End,
      ray2End,
      virtualRay1End,
      virtualRay2End,
    };
  }

  function apparatusMarkup() {
    const shape = diagramGeometry();
    const analysis = shape.analysis;
    const realImage = analysis.kind === "real";
    const virtualImage = analysis.kind === "virtual";
    return `
      <div class="p113-apparatus-wrap">
        <svg class="p113-apparatus is-${analysis.kind}" viewBox="0 0 740 420" role="img" aria-labelledby="p113-apparatus-title p113-apparatus-desc">
          <title id="p113-apparatus-title">Concave-mirror ray diagram producing a floating real image of a hidden toy pig</title>
          <desc id="p113-apparatus-desc">The ideal concave mirror has focal length ${format(analysis.focalLength, 2)} centimetres. A hidden toy at object distance ${format(analysis.objectDistance, 2)} centimetres produces ${analysis.kind === "infinite" ? "parallel reflected rays and an image at infinity" : `a ${analysis.kind} ${analysis.orientation} image at signed distance ${format(analysis.imageDistance, 3)} centimetres with magnification ${format(analysis.magnification, 3)}`}. Principal paraxial rays and virtual backward extensions are shown.</desc>
          <defs>
            <marker id="p113-arrow-ray" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" /></marker>
            <marker id="p113-arrow-object" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" /></marker>
          </defs>
          <line class="p113-axis" x1="20" y1="${shape.axisY}" x2="720" y2="${shape.axisY}" />
          <path class="p113-mirror" d="M520 105 Q${shape.mirrorX} ${shape.axisY} 520 335" />
          <line class="p113-mirror-back" x1="524" y1="112" x2="548" y2="132" /><line class="p113-mirror-back" x1="527" y1="158" x2="552" y2="178" /><line class="p113-mirror-back" x1="528" y1="263" x2="552" y2="283" /><line class="p113-mirror-back" x1="524" y1="309" x2="548" y2="329" />
          <circle class="p113-focus-mark" cx="${format(shape.focusX, 2)}" cy="${shape.axisY}" r="5" /><text class="p113-axis-mark" x="${format(shape.focusX, 2)}" y="242" text-anchor="middle">F</text>
          <circle class="p113-centre-mark" cx="${format(shape.centreX, 2)}" cy="${shape.axisY}" r="4" /><text class="p113-axis-mark" x="${format(shape.centreX, 2)}" y="242" text-anchor="middle">C=2F</text>
          <text class="p113-panel-title" x="24" y="31">PRINCIPAL-RAY VIEW · DISTANCES FROM MIRROR VERTEX</text>
          <rect class="p113-hidden-housing" x="${format(shape.objectX - 34, 2)}" y="${format(shape.axisY - shape.objectHeightPixels - 25, 2)}" width="68" height="${format(shape.objectHeightPixels + 48, 2)}" rx="10" />
          <text class="p113-hidden-label" x="${format(shape.objectX, 2)}" y="${format(shape.axisY + 42, 2)}" text-anchor="middle">hidden toy</text>

          <path class="p113-ray is-parallel-in" d="M${format(shape.objectTip.x, 2)},${format(shape.objectTip.y, 2)} L${shape.mirrorX},${format(shape.parallelHit.y, 2)}" marker-end="url(#p113-arrow-ray)" />
          <path class="p113-ray is-parallel-out" d="M${shape.mirrorX},${format(shape.parallelHit.y, 2)} L${format(shape.ray1End.x, 2)},${format(shape.ray1End.y, 2)}" marker-end="url(#p113-arrow-ray)" />
          <path class="p113-ray is-vertex-in" d="M${format(shape.objectTip.x, 2)},${format(shape.objectTip.y, 2)} L${shape.mirrorX},${shape.axisY}" marker-end="url(#p113-arrow-ray)" />
          <path class="p113-ray is-vertex-out" d="M${shape.mirrorX},${shape.axisY} L${format(shape.ray2End.x, 2)},${format(shape.ray2End.y, 2)}" marker-end="url(#p113-arrow-ray)" />
          ${virtualImage ? `<path class="p113-virtual-extension" d="M${shape.mirrorX},${format(shape.parallelHit.y, 2)} L${format(shape.virtualRay1End.x, 2)},${format(shape.virtualRay1End.y, 2)}" /><path class="p113-virtual-extension" d="M${shape.mirrorX},${shape.axisY} L${format(shape.virtualRay2End.x, 2)},${format(shape.virtualRay2End.y, 2)}" />` : ""}

          <line class="p113-object-arrow" x1="${format(shape.objectX, 2)}" y1="${shape.axisY}" x2="${format(shape.objectTip.x, 2)}" y2="${format(shape.objectTip.y, 2)}" marker-end="url(#p113-arrow-object)" />
          ${pigMarkup(shape.objectX, shape.axisY, shape.objectHeightPixels, "is-object")}
          ${Number.isFinite(analysis.imageDistance) ? `<line class="p113-image-arrow ${realImage ? "is-real" : "is-virtual"}" x1="${format(shape.imageX, 2)}" y1="${shape.axisY}" x2="${format(shape.imageX, 2)}" y2="${format(shape.axisY - shape.imageHeightPixels, 2)}" marker-end="url(#p113-arrow-object)" />${pigMarkup(shape.imageX, shape.axisY, shape.imageHeightPixels, realImage ? "is-real-image" : "is-virtual-image")}<text class="p113-image-label ${realImage ? "is-real" : "is-virtual"}" x="${format(shape.imageX, 2)}" y="${format(shape.axisY - shape.imageHeightPixels + (shape.imageHeightPixels >= 0 ? -18 : 24), 2)}" text-anchor="middle">${realImage ? "floating real image" : "virtual image"}</text>` : `<text class="p113-infinity-label" x="310" y="80">reflected rays parallel · image at infinity</text>`}
          ${realImage ? `<ellipse class="p113-float-glow" cx="${format(shape.imageX, 2)}" cy="${format(shape.axisY - shape.imageHeightPixels / 2, 2)}" rx="37" ry="${format(Math.max(25, Math.abs(shape.imageHeightPixels) * .65), 2)}" />` : ""}
          <g class="p113-eye" transform="translate(30 205)"><path d="M0 15Q15 0 30 15Q15 30 0 15Z" /><circle cx="15" cy="15" r="5" /></g>
          <text class="p113-mirror-label" x="596" y="205">concave</text><text class="p113-mirror-label" x="596" y="221">mirror</text>
        </svg>
        <div class="p113-status-strip is-${analysis.kind}"><strong>${stateCopy(analysis)}</strong><span>1/f = 1/do + 1/di</span></div>
      </div>`;
  }

  function metricsMarkup() {
    const analysis = mirrorAnalysis();
    return `
      <div class="p113-metrics" aria-live="polite">
        <div><span>Focal length</span><strong>+${format(analysis.focalLength, 3)} cm</strong><small>concave mirror</small></div>
        <div><span>Object distance</span><strong>+${format(analysis.objectDistance, 3)} cm</strong><small>real object</small></div>
        <div><span>Image distance</span><strong>${Number.isFinite(analysis.imageDistance) && analysis.imageDistance > 0 ? "+" : ""}${format(analysis.imageDistance, 4)} cm</strong><small>${analysis.kind}</small></div>
        <div><span>Magnification</span><strong>${format(analysis.magnification, 4)}</strong><small>${analysis.orientation}</small></div>
        <div><span>Image height</span><strong>${Number.isFinite(analysis.imageHeight) && analysis.imageHeight > 0 ? "+" : ""}${format(analysis.imageHeight, 4)} cm</strong><small>m·ho</small></div>
      </div>`;
  }

  function dynamicMarkup() {
    return `<div class="p113-dynamic">${apparatusMarkup()}${metricsMarkup()}</div>`;
  }

  function controlsMarkup() {
    const activePreset = activePresetIndex();
    return `
      <section class="p113-controls" aria-label="Concave mirror controls">
        <div class="p113-control-grid">
          <label for="p113-focal"><span>Focal length f<output data-p113-live="focal">${format(state.focalLength, 1)} cm</output></span><input id="p113-focal" data-p113-slider="focal" type="range" min="5" max="20" step="0.5" value="${state.focalLength}" /></label>
          <label for="p113-object-distance"><span>Object distance do<output data-p113-live="object-distance">${format(state.objectDistance, 1)} cm</output></span><input id="p113-object-distance" data-p113-slider="object-distance" type="range" min="5" max="50" step="0.5" value="${state.objectDistance}" /></label>
          <label for="p113-object-height"><span>Toy height ho<output data-p113-live="object-height">${format(state.objectHeight, 1)} cm</output></span><input id="p113-object-height" data-p113-slider="object-height" type="range" min="1" max="8" step="0.5" value="${state.objectHeight}" /></label>
        </div>
        <div class="p113-presets" role="group" aria-label="Mirror configurations">${presets.map((preset, index) => `<button class="chip-button ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p113-preset" data-p113-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}</div>
      </section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p113-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p113-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p113-solution" aria-labelledby="p113-solution-heading">
        <h3 id="p113-solution-heading" tabindex="-1">The reflected rays really cross 36 cm in front</h3>
        <p>Use the real-is-positive mirror convention: f=+12 cm and do=+18 cm. Then</p>
        <div class="p113-equation">1/di = 1/f − 1/do = 1/12 − 1/18 = 1/36 cm⁻¹</div>
        <div class="p113-equation is-answer">di = +36 cm</div>
        <p>The positive image distance identifies a real image in front of the mirror. Its magnification is</p>
        <div class="p113-equation">m = −di/do = −36/18 = −2</div>
        <p>Thus the image is inverted and twice the toy’s height. A display can mount the hidden pig upside-down if the floating image should appear upright.</p>
        <p class="p113-limits"><strong>Checks and idealisation.</strong> The mirror is spherical, concave and ideal; rays are paraxial and the aperture is small; distances are measured from the mirror vertex; diffraction, aberration, finite aperture, reflectivity and obscuration are omitted. A viewer must receive rays after they cross, and the image location must remain unobstructed. For do&gt;f, di&gt;0 and a real image can float in space. At do=f, di→∞. For do&lt;f, di&lt;0: the image is virtual and cannot be projected into open space. At do=2f, di=2f and m=−1. The hidden housing is assumed not to block rays reaching the mirror.</p>
      </section>`;
  }

  function parseCentimetres(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".");
    if (!normalized) return NaN;
    if (/mm$/.test(normalized)) return Number(normalized.replace(/\s*mm$/, "")) / 10;
    if (/cm$/.test(normalized)) return Number(normalized.replace(/\s*cm$/, ""));
    if (/m$/.test(normalized)) return Number(normalized.replace(/\s*m$/, "")) * 100;
    return Number(normalized);
  }

  function snapshot() {
    const analysis = mirrorAnalysis();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      idealisation: "ideal spherical concave mirror; paraxial rays; real-is-positive sign convention",
      focalLengthCentimetres: state.focalLength,
      objectDistanceCentimetres: state.objectDistance,
      objectHeightCentimetres: state.objectHeight,
      imageKind: analysis.kind,
      imageDistanceCentimetres: Number.isFinite(analysis.imageDistance) ? Number(analysis.imageDistance.toFixed(9)) : null,
      magnification: Number.isFinite(analysis.magnification) ? Number(analysis.magnification.toFixed(9)) : null,
      imageHeightCentimetres: Number.isFinite(analysis.imageHeight) ? Number(analysis.imageHeight.toFixed(9)) : null,
      orientation: analysis.orientation,
      mirrorEquationResidualInverseCentimetres: Number(analysis.reciprocalResidual.toFixed(12)),
      questionAnswerCentimetres: 36,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p113-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive geometrical optics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>
        <div class="book-spread p113-spread">
          <article class="book-page p113-problem-page">
            <div class="problem-number">Problem 11.3</div>
            <h1 class="book-title p113-title">Floating pigs</h1>
            <div class="difficulty" aria-label="Three star difficulty">★★★</div>
            <p class="p113-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This independently written concave-mirror illusion is not the book’s wording or solution.</p>
            <p class="problem-copy">A toy pig is hidden 18 cm in front of an ideal concave mirror whose focal length is 12 cm. The mirror redirects light into a real image that can appear to float in open space.</p>
            <p class="problem-copy">What signed image distance does the mirror produce?</p>
            <section class="p113-sign-card"><strong>Real-is-positive convention</strong><p>For this concave mirror f&gt;0. The hidden object has do&gt;0. A real image in front of the mirror has di&gt;0; a virtual image behind it has di&lt;0.</p></section>
            <section class="prediction-box"><div class="eyebrow">A real image is not on the mirror</div><p>When reflected rays physically cross, an eye beyond the crossing receives diverging rays as though a luminous object occupied that empty location.</p></section>
          </article>

          <section class="book-page book-stage p113-stage" aria-labelledby="p113-stage-title">
            <div class="p113-stage-heading"><div><span class="eyebrow">Floating-image laboratory</span><h2 id="p113-stage-title">Make the rays meet in mid-air</h2></div><p>Vary focal length and hidden-object position. Solid rays show physical light; dashed extensions appear only for a virtual image.</p></div>
            ${dynamicMarkup()}
            ${controlsMarkup()}
          </section>

          <aside class="book-page book-coach p113-coach">
            <div class="coach-kicker">Locate the floating pig</div>
            <p class="coach-question">For f=+12 cm and do=+18 cm, what is the signed image distance?</p>
            <form class="p113-answer-form" data-p113-answer-form novalidate>
              <label for="p113-answer">Image distance di</label>
              <div><input id="p113-answer" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="signed distance" /><span>cm</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p113-help-row"><button class="secondary-button" type="button" data-problem-action="p113-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p113-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            <div class="p113-debug">${debugPanel("Development state", snapshot())}</div>
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateDynamicDom(root) {
    const dynamic = root.querySelector(".p113-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    const outputs = { focal:`${format(state.focalLength,1)} cm`,"object-distance":`${format(state.objectDistance,1)} cm`,"object-height":`${format(state.objectHeight,1)} cm` };
    Object.entries(outputs).forEach(([key,value])=>root.querySelectorAll(`[data-p113-live="${key}"]`).forEach((node)=>{node.textContent=value;}));
    const analysis=mirrorAnalysis();
    root.querySelector("#p113-focal")?.setAttribute("aria-valuetext",`Focal length ${format(state.focalLength,1)} centimetres; ${stateCopy(analysis)}`);
    root.querySelector("#p113-object-distance")?.setAttribute("aria-valuetext",`Object distance ${format(state.objectDistance,1)} centimetres; image distance ${format(analysis.imageDistance,3)} centimetres`);
    root.querySelector("#p113-object-height")?.setAttribute("aria-valuetext",`Toy height ${format(state.objectHeight,1)} centimetres; magnification ${format(analysis.magnification,3)}`);
    root.querySelectorAll(".state-surface").forEach((surface)=>{surface.textContent=snapshot();});
    const activePreset=activePresetIndex();root.querySelectorAll('[data-problem-action="p113-preset"]').forEach((button)=>{const active=Number(button.dataset.p113Preset)===activePreset;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
  }

  function renderAndFocus(rerender,selector){rerender();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}

  function bind({render:rerender}) {
    const root=document.querySelector(".p113-shell");if(!root)return;
    root.querySelectorAll("[data-p113-slider]").forEach((slider)=>slider.addEventListener("input",(event)=>{const kind=event.target.dataset.p113Slider;if(kind==="focal")state.focalLength=clamp(event.target.value,5,20);if(kind==="object-distance")state.objectDistance=clamp(event.target.value,5,50);if(kind==="object-height")state.objectHeight=clamp(event.target.value,1,8);state.feedback="";state.committed=false;updateDynamicDom(root);}));
    root.querySelectorAll("[data-problem-action]").forEach((control)=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p113-reset"){state=initialState();renderAndFocus(rerender,"#p113-focal");return;}if(action==="p113-preset"){const preset=presets[Number(control.dataset.p113Preset)];if(preset){state.focalLength=preset.focalLength;state.objectDistance=preset.objectDistance;state.objectHeight=preset.objectHeight;state.feedback="";state.committed=false;}renderAndFocus(rerender,"#p113-object-distance");return;}if(action==="p113-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p113-reveal")state.revealed=true;rerender();if(action==="p113-reveal")window.requestAnimationFrame(()=>document.querySelector("#p113-solution-heading")?.focus());}));
    root.querySelector("#p113-answer")?.addEventListener("input",(event)=>{state.answer=event.target.value;state.feedback="";state.feedbackTone="neutral";});
    root.querySelector("[data-p113-answer-form]")?.addEventListener("submit",(event)=>{event.preventDefault();const raw=event.currentTarget.querySelector("#p113-answer")?.value||"";const answer=parseCentimetres(raw);state.answer=raw.trim();state.committed=false;state.feedbackTone="neutral";if(!Number.isFinite(answer)){state.feedback="Enter a signed image distance in cm; metres and millimetres are also accepted.";state.feedbackTone="warn";}else if(Math.abs(answer-36)<=.05){state.feedback="Correct. The positive 36 cm distance identifies a real image in front of the mirror; m=−2.";state.feedbackTone="success";state.committed=true;state={...state,focalLength:QUESTION.focalLength,objectDistance:QUESTION.objectDistance,objectHeight:QUESTION.objectHeight};}else if(Math.abs(answer+36)<=.05){state.feedback="The magnitude is right, but the sign is not. This image is real and therefore has di>0 in the stated convention.";}else if(Math.abs(answer-7.2)<=.05){state.feedback="Recheck the reciprocal algebra. Solve 1/di=1/f−1/do before inverting.";}else{state.feedback="Use 1/f=1/do+1/di with f and do positive, then identify the sign of the resulting image distance.";}renderAndFocus(rerender,"#p113-answer");});
  }

  window.poveyProblemPages[PROBLEM]={render,bind};
})();
