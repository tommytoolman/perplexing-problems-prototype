window.poveyProblemPages = window.poveyProblemPages || {};

(function registerCubeWithinSphere() {
  const FIT_RATIO = 1 / Math.sqrt(3);
  const EXACT_VOLUME = 2 / (Math.PI * Math.sqrt(3));
  const SIDE_MIN = 0.3;
  const SIDE_MAX = 0.66;
  const SIDE_STEP = 0.005;
  const hints = [
    "Look at two opposite vertices of the cube. What straight line joins them through the cube's centre?",
    "A face diagonal is √2 L. Combine it with the remaining perpendicular edge L.",
    "At the largest fit, √3 L = D. For the sphere, 1 = πD³ / 6.",
  ];

  const initialState = () => ({
    view: "fit",
    sideOverDiameter: 0.45,
    estimate: "",
    hintsUsed: 0,
    committed: false,
    revealed: false,
    feedback: "",
  });

  let state = initialState();

  function clampSide(value) {
    const clamped = Math.max(SIDE_MIN, Math.min(SIDE_MAX, Number(value)));
    return Math.abs(clamped - FIT_RATIO) < 0.003 ? FIT_RATIO : clamped;
  }

  function diagonalRatio() {
    return Math.sqrt(3) * state.sideOverDiameter;
  }

  function fitStatus() {
    if (Math.abs(state.sideOverDiameter - FIT_RATIO) < 0.000001) return "exact";
    return diagonalRatio() < 1 ? "room" : "too-large";
  }

  function fitStatusCopy(status = fitStatus()) {
    return {
      room: "room to grow",
      exact: "exact fit",
      "too-large": "too large for the sphere",
    }[status];
  }

  function setSide(value) {
    state.sideOverDiameter = clampSide(value);
    state.committed = false;
    state.feedback = "";
  }

  function sliderProgress() {
    return ((state.sideOverDiameter - SIDE_MIN) / (SIDE_MAX - SIDE_MIN)) * 100;
  }

  function cubeTransform() {
    const scale = state.sideOverDiameter / FIT_RATIO;
    return `translate(320 200) scale(${scale}) translate(-320 -200)`;
  }

  function snapshot() {
    return JSON.stringify(
      {
        problem: "1.6",
        view: state.view,
        sphereVolume: 1,
        sideOverDiameter: Number(state.sideOverDiameter.toFixed(6)),
        bodyDiagonalOverDiameter: Number(diagonalRatio().toFixed(6)),
        fitStatus: fitStatusCopy(),
        estimateCubicUnits: state.estimate === "" ? null : Number(state.estimate),
        hintsUsed: state.hintsUsed,
        committed: state.committed,
        solutionRevealed: state.revealed,
        exactCubeVolume: state.revealed ? Number(EXACT_VOLUME.toFixed(9)) : null,
      },
      null,
      2,
    );
  }

  function fitSvg() {
    const status = fitStatus();
    const statusText = fitStatusCopy(status);
    return `
      <svg class="route-svg cube16-svg cube16-fit-svg is-${status}" data-cube16-fit-svg viewBox="0 0 640 410" role="img" aria-labelledby="cube16-fit-title cube16-fit-desc">
        <title id="cube16-fit-title">A resizable cube projected inside a sphere</title>
        <desc id="cube16-fit-desc" data-cube16-fit-desc>The cube side is ${state.sideOverDiameter.toFixed(3)} times the sphere diameter. Its body diagonal is ${diagonalRatio().toFixed(3)} times the diameter, so there is ${statusText}. This is a two-dimensional projection of the three-dimensional fit.</desc>
        <defs>
          <radialGradient id="cube16-sphere-fill" cx="37%" cy="31%" r="72%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96" />
            <stop offset="64%" stop-color="#d9eee7" stop-opacity="0.68" />
            <stop offset="100%" stop-color="#7bbfa9" stop-opacity="0.38" />
          </radialGradient>
        </defs>
        <circle class="cube16-sphere-disc" cx="320" cy="200" r="172.1" />
        <ellipse class="cube16-sphere-grid" cx="320" cy="200" rx="172.1" ry="55" />
        <ellipse class="cube16-sphere-grid" cx="320" cy="200" rx="66" ry="172.1" />
        <line class="cube16-diameter-guide" x1="179.9" y1="300.1" x2="460.1" y2="99.9" />
        <text class="cube16-svg-note" x="450" y="78">sphere diameter D</text>
        <g class="cube16-cube-group" data-cube16-cube-group transform="${cubeTransform()}">
          <g class="cube16-hidden-edges">
            <line x1="180" y1="300" x2="273.3" y2="233.3" />
            <line x1="273.3" y1="233.3" x2="285" y2="52.3" />
            <line x1="273.3" y1="233.3" x2="448.4" y2="281" />
          </g>
          <g class="cube16-visible-edges">
            <line x1="180" y1="300" x2="191.6" y2="119" />
            <line x1="180" y1="300" x2="355" y2="347.7" />
            <line x1="191.6" y1="119" x2="285" y2="52.3" />
            <line x1="191.6" y1="119" x2="366.7" y2="166.7" />
            <line x1="285" y1="52.3" x2="460" y2="100" />
            <line x1="355" y1="347.7" x2="448.4" y2="281" />
            <line x1="355" y1="347.7" x2="366.7" y2="166.7" />
            <line x1="448.4" y1="281" x2="460" y2="100" />
            <line x1="366.7" y1="166.7" x2="460" y2="100" />
          </g>
          <line class="cube16-body-diagonal" x1="180" y1="300" x2="460" y2="100" />
          <g class="cube16-vertices" aria-hidden="true">
            <circle cx="180" cy="300" r="5" /><circle cx="273.3" cy="233.3" r="5" />
            <circle cx="191.6" cy="119" r="5" /><circle cx="285" cy="52.3" r="5" />
            <circle cx="355" cy="347.7" r="5" /><circle cx="448.4" cy="281" r="5" />
            <circle cx="366.7" cy="166.7" r="5" /><circle cx="460" cy="100" r="5" />
          </g>
          <g class="cube16-overshoot-caps" aria-hidden="true">
            <circle cx="180" cy="300" r="12" /><circle cx="460" cy="100" r="12" />
          </g>
          <text class="cube16-vertex-label" x="158" y="320">a</text>
          <text class="cube16-vertex-label" x="470" y="91">b</text>
          <text class="cube16-diagonal-label" x="326" y="182">body diagonal</text>
        </g>
        <g class="cube16-centre-mark" aria-hidden="true"><circle cx="320" cy="200" r="4" /><line x1="308" y1="200" x2="332" y2="200" /><line x1="320" y1="188" x2="320" y2="212" /></g>
        <g class="cube16-touch-note" aria-hidden="true">
          <rect x="174" y="374" width="292" height="27" rx="13.5" />
          <text x="320" y="392" text-anchor="middle">all 8 vertices touch the spherical surface in 3D</text>
        </g>
      </svg>`;
  }

  function diagonalSvg() {
    const faceKnown = state.hintsUsed >= 2 || state.revealed;
    return `
      <svg class="route-svg cube16-svg cube16-diagonal-svg ${state.revealed ? "is-revealed" : ""}" viewBox="0 0 640 410" role="img" aria-labelledby="cube16-diagonal-title cube16-diagonal-desc">
        <title id="cube16-diagonal-title">The two right-triangle steps through a cube</title>
        <desc id="cube16-diagonal-desc">A square face first gives a diagonal of ${faceKnown ? "square root of two L" : "unknown length"}. That diagonal and one perpendicular edge form the cube body diagonal${state.revealed ? " of square root of three L, equal to the sphere diameter" : ""}.</desc>
        <g class="cube16-face-step">
          <text class="cube16-step-label" x="130" y="70" text-anchor="middle">1 · cross one face</text>
          <rect x="55" y="115" width="150" height="150" />
          <line class="cube16-construction-line" x1="55" y1="265" x2="205" y2="115" />
          <path class="cube16-right-angle" d="M55 247h18v18" />
          <text class="cube16-length-label" x="119" y="283">L</text>
          <text class="cube16-length-label" x="31" y="194">L</text>
          <text class="cube16-diagonal-step-label" x="112" y="177" transform="rotate(-45 112 177)">${faceKnown ? "√2 L" : "?"}</text>
        </g>
        <path class="cube16-step-arrow" d="M228 190h48m-15-14 15 14-15 14" />
        <g class="cube16-body-step">
          <text class="cube16-step-label" x="433" y="70" text-anchor="middle">2 · cross the cube</text>
          <path class="cube16-body-triangle-fill" d="M300 315H560V95Z" />
          <line class="cube16-triangle-edge" x1="300" y1="315" x2="560" y2="315" />
          <line class="cube16-triangle-edge" x1="560" y1="315" x2="560" y2="95" />
          <line class="cube16-construction-line cube16-body-hypotenuse" x1="300" y1="315" x2="560" y2="95" />
          <path class="cube16-right-angle" d="M542 315v-18h18" />
          <circle class="cube16-triangle-point" cx="300" cy="315" r="5" /><circle class="cube16-triangle-point" cx="560" cy="95" r="5" />
          <text class="cube16-vertex-label" x="278" y="338">a</text><text class="cube16-vertex-label" x="570" y="89">b</text>
          <text class="cube16-length-label" x="414" y="338">${faceKnown ? "√2 L" : "face diagonal"}</text>
          <text class="cube16-length-label" x="574" y="211">L</text>
          <text class="cube16-body-result" x="405" y="188" transform="rotate(-40 405 188)">${state.revealed ? "√3 L = D" : "body diagonal ?"}</text>
        </g>
        ${state.revealed ? '<g class="cube16-diagonal-equation"><rect x="126" y="363" width="388" height="36" rx="18" /><text x="320" y="386" text-anchor="middle">d² = (√2 L)² + L² = 3L²</text></g>' : ""}
      </svg>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function feedback() {
    if (!state.feedback) return "";
    const close = state.committed && Math.abs(Number(state.estimate) - EXACT_VOLUME) <= 0.015;
    return `<div class="feedback cube16-feedback ${close ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solution() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card cube16-solution" aria-label="Worked solution">
        <strong id="cube16-solution-heading" tabindex="-1">The body diagonal sets the limit</strong>
        <p>Opposite vertices are √3 L apart, so a containing sphere needs D ≥ √3 L. The largest cube uses equality. Centring it makes all eight vertices the same distance D/2 from the sphere's centre, so all eight touch.</p>
        <div class="equation">face diagonal = √2 L</div>
        <div class="equation">body diagonal = √3 L = D</div>
        <div class="equation">1 = πD³ / 6 ⇒ D³ = 6 / π</div>
        <div class="equation">V<sub>cube</sub> = D³ / (3√3)</div>
        <div class="equation">= 2 / (π√3) = 0.367552… ≈ 0.368</div>
        <p>So the largest cube occupies about <strong>36.8%</strong> of the sphere's unit volume.</p>
      </section>`;
  }

  function render() {
    const status = fitStatus();
    const statusText = fitStatusCopy(status);
    return `
      <main class="book-shell cube16-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar cube16-progress"><span></span></div></div>
          <div class="book-actions button-row"><button class="ghost-button" data-problem-action="cube16-reset">Reset</button></div>
        </header>
        <div class="book-spread cube16-spread">
          <article class="book-page">
            <div class="problem-number">Problem 1.6</div>
            <h1 class="book-title cube16-title">Cube within sphere</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="problem-copy">What is the volume of the largest cube that fits entirely within a sphere of unity volume?</p>
            <div class="cube16-unity-note"><strong>Unity volume means V<sub>sphere</sub> = 1.</strong><span>The radius is not 1.</span></div>
            <section class="prediction-box">
              <div class="eyebrow">First instinct</div>
              <p>Will the cube occupy less than half, about half, or more than half of the sphere's volume?</p>
              <div class="scale-choices cube16-scale" aria-hidden="true"><span>less</span><span>half</span><span>more</span></div>
            </section>
          </article>
          <section class="book-page book-stage cube16-stage">
            <div class="cube16-view-tabs" role="group" aria-label="Geometry view">
              <button class="chip-button ${state.view === "fit" ? "active" : ""}" data-problem-action="cube16-view-fit" aria-pressed="${state.view === "fit"}">Fit view</button>
              <button class="chip-button ${state.view === "diagonal" ? "active" : ""}" data-problem-action="cube16-view-diagonal" aria-pressed="${state.view === "diagonal"}">Diagonal view</button>
            </div>
            ${state.view === "fit" ? fitSvg() : diagonalSvg()}
            <div class="book-stage-caption cube16-caption">
              <p>${state.view === "fit" ? "This is a 2D projection of a 3D fit. Some surface vertices correctly appear inside the sphere's circular silhouette." : "The face diagonal and one perpendicular edge form a second right triangle: the cube's body diagonal."}</p>
              <div class="cube16-fit-readout is-${status}" data-cube16-fit-readout>
                <small>Current fit</small><strong data-cube16-live="status">${statusText}</strong>
              </div>
            </div>
            <div class="slider-wrap cube16-size-control">
              <label id="cube16-size-label"><span>Cube side / sphere diameter, L/D</span><span data-cube16-live="sideRatio">${state.sideOverDiameter.toFixed(3)}</span></label>
              <div class="drag-slider cube16-slider" data-cube16-size-slider role="slider" tabindex="0" aria-labelledby="cube16-size-label" aria-valuemin="${SIDE_MIN}" aria-valuemax="${SIDE_MAX}" aria-valuenow="${state.sideOverDiameter.toFixed(6)}" aria-valuetext="L over D ${state.sideOverDiameter.toFixed(3)}; ${statusText}" style="--slider-progress:${sliderProgress()}%">
                <span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span>
              </div>
              <div class="slider-labels"><span>0.30</span><span>fit ≈ 0.577</span><span>0.66</span></div>
              <div class="cube16-presets" aria-label="Cube size presets">
                <button class="chip-button ${Math.abs(state.sideOverDiameter - 0.4) < 0.001 ? "active" : ""}" data-problem-action="cube16-size" data-side="0.4">Small</button>
                <button class="chip-button ${Math.abs(state.sideOverDiameter - 0.55) < 0.001 ? "active" : ""}" data-problem-action="cube16-size" data-side="0.55">Near fit</button>
                <button class="chip-button ${status === "exact" ? "active" : ""}" data-problem-action="cube16-fit-exactly" data-side="${FIT_RATIO}">Fit exactly</button>
              </div>
            </div>
            <div class="cube16-ratio-meter" aria-live="polite">
              <span>body diagonal / diameter</span><strong data-cube16-live="diagonalRatio">${diagonalRatio().toFixed(3)}</strong>
              <div class="cube16-ratio-track"><span data-cube16-ratio-fill style="width:${Math.min(100, diagonalRatio() * 100)}%"></span><i></i></div>
            </div>
          </section>
          <aside class="book-page book-coach cube16-coach">
            <div class="coach-kicker">Spatial estimate</div>
            <p class="coach-question">Which length of the cube becomes the sphere's diameter?</p>
            <div class="book-metrics cube16-metrics">
              <div class="book-metric"><small>Sphere volume</small><strong>1</strong></div>
              <div class="book-metric"><small>Cube volume</small><strong>${state.revealed ? EXACT_VOLUME.toFixed(3) : "?"}</strong></div>
            </div>
            <form class="estimate-form" data-cube16-estimate-form novalidate>
              <label for="cube16-estimate">Your cube-volume estimate</label>
              <div class="estimate-field"><input id="cube16-estimate" class="estimate-input" inputmode="decimal" type="number" min="0" max="1" step="0.001" value="${state.estimate}" placeholder="e.g. 0.5" /><span>cubic units</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row cube16-help-row">
              <button class="secondary-button" data-problem-action="cube16-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" data-problem-action="cube16-reveal">Reveal</button>
            </div>
            ${feedback()}
            ${hintStack()}
            ${solution()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("1.6")}
      </main>`;
  }

  function updateLiveGeometry() {
    const root = document.querySelector(".cube16-book-shell");
    if (!root) return;
    const status = fitStatus();
    const statusText = fitStatusCopy(status);
    const sideText = state.sideOverDiameter.toFixed(3);
    const diagonalText = diagonalRatio().toFixed(3);

    root.querySelectorAll('[data-cube16-live="sideRatio"]').forEach((node) => { node.textContent = sideText; });
    root.querySelectorAll('[data-cube16-live="diagonalRatio"]').forEach((node) => { node.textContent = diagonalText; });
    root.querySelectorAll('[data-cube16-live="status"]').forEach((node) => { node.textContent = statusText; });

    const slider = root.querySelector("[data-cube16-size-slider]");
    if (slider) {
      slider.style.setProperty("--slider-progress", `${sliderProgress()}%`);
      slider.setAttribute("aria-valuenow", state.sideOverDiameter.toFixed(6));
      slider.setAttribute("aria-valuetext", `L over D ${sideText}; ${statusText}`);
    }

    const svg = root.querySelector("[data-cube16-fit-svg]");
    if (svg) {
      svg.classList.remove("is-room", "is-exact", "is-too-large");
      svg.classList.add(`is-${status}`);
      const desc = svg.querySelector("[data-cube16-fit-desc]");
      if (desc) desc.textContent = `The cube side is ${sideText} times the sphere diameter. Its body diagonal is ${diagonalText} times the diameter, so there is ${statusText}. This is a two-dimensional projection of the three-dimensional fit.`;
    }

    const cube = root.querySelector("[data-cube16-cube-group]");
    if (cube) cube.setAttribute("transform", cubeTransform());

    const readout = root.querySelector("[data-cube16-fit-readout]");
    if (readout) {
      readout.classList.remove("is-room", "is-exact", "is-too-large");
      readout.classList.add(`is-${status}`);
    }

    const fill = root.querySelector("[data-cube16-ratio-fill]");
    if (fill) fill.style.width = `${Math.min(100, diagonalRatio() * 100)}%`;

    const existingFeedback = root.querySelector(".cube16-feedback");
    if (existingFeedback) existingFeedback.hidden = true;
  }

  function setSideFromPointer(event, slider) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setSide(SIDE_MIN + progress * (SIDE_MAX - SIDE_MIN));
    updateLiveGeometry();
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "cube16-reset") state = initialState();
        if (action === "cube16-view-fit") state.view = "fit";
        if (action === "cube16-view-diagonal") state.view = "diagonal";
        if (action === "cube16-size") setSide(Number(control.dataset.side));
        if (action === "cube16-fit-exactly") setSide(FIT_RATIO);
        if (action === "cube16-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "cube16-reveal") {
          state.revealed = true;
          state.view = "diagonal";
        }
        renderApp();
        if (action === "cube16-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#cube16-solution-heading")?.focus());
        }
      });
    });

    const form = document.querySelector("[data-cube16-estimate-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("#cube16-estimate");
      const raw = input.value.trim();
      const estimate = Number(raw);
      if (!raw || !Number.isFinite(estimate) || estimate < 0 || estimate > 1) {
        state.estimate = Number.isFinite(estimate) && raw ? String(estimate) : "";
        state.feedback = "Enter a volume from 0 to 1 cubic unit.";
        state.committed = false;
      } else {
        state.estimate = String(estimate);
        state.committed = true;
        if (Math.abs(estimate - EXACT_VOLUME) <= 0.015) {
          state.feedback = "Very close - your estimate is within 0.015 cubic units.";
        } else if (estimate >= 0.5) {
          state.feedback = "The cube leaves substantial curved regions outside its flat faces. Try using the body diagonal as the limiting length.";
        } else if (estimate < 0.25) {
          state.feedback = "That cube would fit, but it is not yet the largest. Grow it until opposite vertices reach the sphere.";
        } else {
          state.feedback = "Plausible. Now connect the cube's body diagonal to the sphere's diameter.";
        }
      }
      renderApp();
    });

    const slider = document.querySelector("[data-cube16-size-slider]");
    if (!slider) return;

    slider.addEventListener("pointerdown", (event) => {
      slider.setPointerCapture(event.pointerId);
      setSideFromPointer(event, slider);
    });
    slider.addEventListener("pointermove", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) setSideFromPointer(event, slider);
    });
    slider.addEventListener("pointerup", (event) => {
      setSideFromPointer(event, slider);
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-cube16-size-slider]");
    });
    slider.addEventListener("pointercancel", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-cube16-size-slider]");
    });
    slider.addEventListener("keydown", (event) => {
      let next = state.sideOverDiameter;
      if (["ArrowLeft", "ArrowDown"].includes(event.key)) next -= SIDE_STEP;
      else if (["ArrowRight", "ArrowUp"].includes(event.key)) next += SIDE_STEP;
      else if (event.key === "PageDown") next -= SIDE_STEP * 5;
      else if (event.key === "PageUp") next += SIDE_STEP * 5;
      else if (event.key === "Home") next = SIDE_MIN;
      else if (event.key === "End") next = SIDE_MAX;
      else return;
      event.preventDefault();
      setSide(next);
      renderAndFocus(renderApp, "[data-cube16-size-slider]");
    });
  }

  window.poveyProblemPages["1.6"] = { render, bind };
}());
