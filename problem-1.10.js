(function registerTreeTrunksPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const MIN_X = 1;
  const MAX_X = 8;
  const SQUARE_FREE_CHOICES = Object.freeze([1, 2, 3, 5, 6]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p110-reset">Reset</button>';

  const stages = Object.freeze([
    {
      short: "Touch",
      title: "Touching fixes the centre distance",
      copy: "Both centres sit one radius above the same ground. External tangency makes the line joining them exactly m+n long.",
      equation: "CₘCₙ = m + n",
    },
    {
      short: "Pythagoras",
      title: "The centres make a right triangle",
      copy: "The vertical leg is |n-m| and the horizontal leg is x. A difference of squares collapses the geometry to one condition.",
      equation: "(m+n)² = x² + (n-m)²  ⇒  x² = 4mn",
    },
    {
      short: "Integers",
      title: "Build every integer-aligned family",
      copy: "Give both radii the same square-free part b. The remaining factors are squares, so the horizontal separation is automatically integral.",
      equation: "m = a²b,  n = c²b  ⇒  x = 2abc",
    },
  ]);

  const hints = Object.freeze([
    "Join the two centres. Because the trunks touch, that line has length m+n. What is the vertical difference between the centres?",
    "The centre line, horizontal separation x, and vertical separation n-m form a right triangle. Apply Pythagoras and use a difference of squares.",
    "For m=1, x²=4n. An integer x must be even, so write x=2k.",
    "In the general case, mn must be a square. Match the odd prime-exponent parities by writing both radii with the same square-free part b.",
  ]);

  const initialState = () => ({
    stage: 0,
    searchX: 4,
    a: 1,
    b: 2,
    c: 2,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function decimal(value, digits = 3) {
    if (Number.isInteger(value)) return String(value);
    return Number(value).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  }

  function searchN(x = state.searchX) {
    return (x * x) / 4;
  }

  function searchNText(x = state.searchX) {
    const numerator = x * x;
    return numerator % 4 === 0 ? String(numerator / 4) : `${numerator}/4`;
  }

  function searchIsValid(x = state.searchX) {
    return Number.isInteger(searchN(x));
  }

  function activePair() {
    if (state.stage < 2) {
      return {
        m: 1,
        n: searchN(),
        x: state.searchX,
        valid: searchIsValid(),
        source: "m=1 search",
      };
    }
    const m = state.a * state.a * state.b;
    const n = state.c * state.c * state.b;
    return {
      m,
      n,
      x: 2 * state.a * state.b * state.c,
      valid: true,
      source: "general family",
    };
  }

  function setSearchX(value) {
    state.searchX = Math.round(clamp(value, MIN_X, MAX_X));
  }

  function setStage(value) {
    state.stage = Math.round(clamp(value, 0, stages.length - 1));
  }

  function setParameter(parameter, value) {
    if (!["a", "c"].includes(parameter)) return;
    state[parameter] = Math.round(clamp(value, 1, 3));
  }

  function setSquareFree(value) {
    const candidate = Number(value);
    if (SQUARE_FREE_CHOICES.includes(candidate)) state.b = candidate;
  }

  function pairStatus(pair = activePair()) {
    return pair.valid
      ? `integer aligned: x = ${decimal(pair.x)}`
      : `not admissible: n = ${searchNText()} is not an integer`;
  }

  function geometry(pair = activePair()) {
    const maximumRadius = Math.max(pair.m, pair.n);
    const scale = Math.min(130 / maximumRadius, 500 / (pair.m + pair.x + pair.n));
    const groundY = 330;
    const leftCentre = {
      x: 55 + pair.m * scale,
      y: groundY - pair.m * scale,
    };
    const rightCentre = {
      x: 55 + (pair.m + pair.x) * scale,
      y: groundY - pair.n * scale,
    };
    const corner = { x: rightCentre.x, y: leftCentre.y };
    const tangentFraction = pair.m / (pair.m + pair.n);
    const tangent = {
      x: leftCentre.x + (rightCentre.x - leftCentre.x) * tangentFraction,
      y: leftCentre.y + (rightCentre.y - leftCentre.y) * tangentFraction,
    };
    const verticalDirection = Math.sign(rightCentre.y - leftCentre.y);
    const lineLabel = {
      x: (leftCentre.x + rightCentre.x) / 2 - 4,
      y: (leftCentre.y + rightCentre.y) / 2 - 13,
    };
    return {
      pair,
      scale,
      groundY,
      leftCentre,
      rightCentre,
      corner,
      tangent,
      verticalDirection,
      lineLabel,
      leftRadius: pair.m * scale,
      rightRadius: pair.n * scale,
    };
  }

  function rightTriangleMarkup(shape) {
    if (state.stage < 1) return "";
    const { leftCentre, rightCentre, corner, verticalDirection } = shape;
    const rightAngle = verticalDirection === 0
      ? ""
      : `<path class="p110-right-angle" d="M${decimal(corner.x - 13)} ${decimal(corner.y)} L${decimal(corner.x - 13)} ${decimal(corner.y + verticalDirection * 13)} L${decimal(corner.x)} ${decimal(corner.y + verticalDirection * 13)}" />`;
    const horizontalLabelY = verticalDirection < 0 ? leftCentre.y + 22 : leftCentre.y - 12;
    return `
      <g class="p110-triangle" aria-hidden="true">
        <line class="p110-centre-line" x1="${decimal(leftCentre.x)}" y1="${decimal(leftCentre.y)}" x2="${decimal(rightCentre.x)}" y2="${decimal(rightCentre.y)}" />
        <line class="p110-leg p110-horizontal-leg" x1="${decimal(leftCentre.x)}" y1="${decimal(leftCentre.y)}" x2="${decimal(corner.x)}" y2="${decimal(corner.y)}" />
        <line class="p110-leg p110-vertical-leg" x1="${decimal(corner.x)}" y1="${decimal(corner.y)}" x2="${decimal(rightCentre.x)}" y2="${decimal(rightCentre.y)}" />
        ${rightAngle}
        <text class="p110-length-label" x="${decimal((leftCentre.x + corner.x) / 2)}" y="${decimal(horizontalLabelY)}" text-anchor="middle">x = ${decimal(shape.pair.x)}</text>
        <text class="p110-length-label" x="${decimal(corner.x + 15)}" y="${decimal((corner.y + rightCentre.y) / 2 + 4)}">|n-m|</text>
      </g>`;
  }

  function treeSvg() {
    const shape = geometry();
    const pair = shape.pair;
    const stage = stages[state.stage];
    const invalidClass = pair.valid ? "" : " p110-invalid-pair";
    return `
      <svg class="route-svg p110-svg p110-stage-${state.stage}${invalidClass}" viewBox="0 0 640 390" role="img" aria-labelledby="p110-svg-title p110-svg-desc">
        <title id="p110-svg-title">Two circular tree trunks touching each other and the ground</title>
        <desc id="p110-svg-desc">Stage ${state.stage + 1}, ${stage.short}. Candidate radii m equals ${decimal(pair.m)} and n equals ${decimal(pair.n)}. Their horizontal centre separation x equals ${decimal(pair.x)}. ${pairStatus(pair)}.</desc>
        <defs>
          <pattern id="p110-bark-m" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
            <rect width="8" height="8" fill="#f7e2b6" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#b47a24" stroke-width="1.5" />
          </pattern>
          <pattern id="p110-bark-n" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
            <rect width="9" height="9" fill="#d8eee4" />
            <line x1="0" y1="0" x2="0" y2="9" stroke="#44856d" stroke-width="1.5" />
          </pattern>
        </defs>
        <line class="p110-ground" x1="28" y1="${shape.groundY}" x2="608" y2="${shape.groundY}" />
        <text class="p110-ground-label" x="566" y="316">y = 0</text>
        <circle class="p110-trunk p110-trunk-m" cx="${decimal(shape.leftCentre.x)}" cy="${decimal(shape.leftCentre.y)}" r="${decimal(shape.leftRadius)}" />
        <circle class="p110-trunk p110-trunk-n" cx="${decimal(shape.rightCentre.x)}" cy="${decimal(shape.rightCentre.y)}" r="${decimal(shape.rightRadius)}" />
        <line class="p110-centre-line p110-centre-line-base" x1="${decimal(shape.leftCentre.x)}" y1="${decimal(shape.leftCentre.y)}" x2="${decimal(shape.rightCentre.x)}" y2="${decimal(shape.rightCentre.y)}" />
        <text class="p110-length-label p110-hypotenuse-label" x="${decimal(shape.lineLabel.x)}" y="${decimal(shape.lineLabel.y)}" text-anchor="middle">m + n</text>
        ${rightTriangleMarkup(shape)}
        <g class="p110-contact" aria-hidden="true">
          <circle cx="${decimal(shape.tangent.x)}" cy="${decimal(shape.tangent.y)}" r="5" />
          <circle cx="${decimal(shape.leftCentre.x)}" cy="${shape.groundY}" r="4" />
          <circle cx="${decimal(shape.rightCentre.x)}" cy="${shape.groundY}" r="4" />
        </g>
        <g class="p110-centres" aria-hidden="true">
          <circle cx="${decimal(shape.leftCentre.x)}" cy="${decimal(shape.leftCentre.y)}" r="4.5" />
          <circle cx="${decimal(shape.rightCentre.x)}" cy="${decimal(shape.rightCentre.y)}" r="4.5" />
          <text x="${decimal(shape.leftCentre.x - 7)}" y="${decimal(shape.leftCentre.y - 14)}" text-anchor="end">Cₘ = (0, m)</text>
          <text x="${decimal(shape.rightCentre.x + 8)}" y="${decimal(shape.rightCentre.y - 14)}">Cₙ = (x, n)</text>
        </g>
        <g class="p110-axis-labels" aria-hidden="true">
          <line x1="${decimal(shape.leftCentre.x)}" y1="${shape.groundY}" x2="${decimal(shape.leftCentre.x)}" y2="344" />
          <line x1="${decimal(shape.rightCentre.x)}" y1="${shape.groundY}" x2="${decimal(shape.rightCentre.x)}" y2="344" />
          <text x="${decimal(shape.leftCentre.x)}" y="363" text-anchor="middle">0</text>
          <text x="${decimal(shape.rightCentre.x)}" y="363" text-anchor="middle">x = ${decimal(pair.x)}</text>
        </g>
      </svg>`;
  }

  function searchAriaText() {
    return `x equals ${state.searchX}; candidate n equals ${decimal(searchN())}; ${searchIsValid() ? "positive integer solution" : "not an integer radius"}`;
  }

  function sliderProgress() {
    return ((state.searchX - MIN_X) / (MAX_X - MIN_X)) * 100;
  }

  function searchResultMarkup() {
    return `
      <span>n = x²/4 = <strong>${searchNText()}</strong></span>
      <span class="p110-result-status ${searchIsValid() ? "p110-valid" : "p110-not-valid"}">${searchIsValid() ? "Valid positive-integer radius" : "Not an integer radius"}</span>`;
  }

  function searchControls() {
    return `
      <section class="p110-explorer p110-search" aria-labelledby="p110-search-title">
        <div class="p110-explorer-heading">
          <div><span class="eyebrow">Part 2 · set m = 1</span><strong id="p110-search-title">Search horizontal integer x</strong></div>
          <span class="p110-current-x">x = <strong data-p110-live="searchX">${state.searchX}</strong></span>
        </div>
        <div class="drag-slider p110-x-slider" data-p110-x-slider role="slider" tabindex="0" aria-label="Horizontal centre separation x" aria-valuemin="${MIN_X}" aria-valuemax="${MAX_X}" aria-valuenow="${state.searchX}" aria-valuetext="${searchAriaText()}" style="--slider-progress:${sliderProgress()}%">
          <span class="drag-slider-track"></span><span class="drag-slider-fill"></span><span class="drag-slider-handle"></span>
        </div>
        <div class="slider-labels"><span>1</span><span>whole-number x</span><span>8</span></div>
        <div class="p110-x-presets" aria-label="Horizontal separation presets">
          ${Array.from({ length: MAX_X }, (_, index) => index + 1).map((value) => `<button class="chip-button ${state.searchX === value ? "active" : ""}" type="button" data-problem-action="p110-search-x" data-p110-x="${value}" aria-pressed="${state.searchX === value}">${value}</button>`).join("")}
        </div>
        <div class="p110-search-result" data-p110-search-result role="status" aria-live="polite">${searchResultMarkup()}</div>
      </section>`;
  }

  function parameterStepper(parameter, label) {
    const value = state[parameter];
    return `
      <div class="p110-parameter-row">
        <span>${label}</span>
        <div class="p110-stepper">
          <button class="chip-button" type="button" data-problem-action="p110-adjust" data-p110-param="${parameter}" data-p110-delta="-1" aria-label="Decrease ${label}" ${value <= 1 ? "disabled" : ""}>−</button>
          <strong data-p110-param-value="${parameter}" tabindex="-1">${value}</strong>
          <button class="chip-button" type="button" data-problem-action="p110-adjust" data-p110-param="${parameter}" data-p110-delta="1" aria-label="Increase ${label}" ${value >= 3 ? "disabled" : ""}>+</button>
        </div>
      </div>`;
  }

  function familyControls() {
    const pair = activePair();
    return `
      <section class="p110-explorer p110-family" aria-labelledby="p110-family-title">
        <div class="p110-explorer-heading">
          <div><span class="eyebrow">Part 3 · all solutions</span><strong id="p110-family-title">Build a shared square-free part</strong></div>
          <span class="p110-family-proof">x = 2abc</span>
        </div>
        <div class="p110-parameter-grid">
          ${parameterStepper("a", "square factor a")}
          ${parameterStepper("c", "square factor c")}
          <div class="p110-b-row">
            <span>square-free b <small>(1 included)</small></span>
            <div class="p110-b-presets" aria-label="Square-free b presets">
              ${SQUARE_FREE_CHOICES.map((value) => `<button class="chip-button ${state.b === value ? "active" : ""}" type="button" data-problem-action="p110-set-b" data-p110-b="${value}" aria-pressed="${state.b === value}">${value}</button>`).join("")}
            </div>
          </div>
        </div>
        <div class="p110-family-result" role="status" aria-live="polite">
          <span>m = ${state.a}²·${state.b} = <strong>${pair.m}</strong></span>
          <span>n = ${state.c}²·${state.b} = <strong>${pair.n}</strong></span>
          <span>x = 2·${state.a}·${state.b}·${state.c} = <strong>${pair.x}</strong> · integer</span>
        </div>
      </section>`;
  }

  function hintStack() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p110-hint-stack">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="feedback p110-feedback ${state.feedbackTone === "success" ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p110-solution" aria-label="Worked solution">
        <strong id="p110-solution-heading" tabindex="-1">One right triangle reveals every integer family</strong>
        <p>The centre distance is <em>m+n</em>, the vertical difference is <em>n-m</em>, and the horizontal difference is <em>x</em>. Hence</p>
        <div class="equation">(m+n)² = x² + (n-m)²</div>
        <div class="equation">x² = (m+n)² − (n-m)² = 4mn.</div>
        <p>For <em>m=1</em>, write the necessarily even integer <em>x=2k</em>:</p>
        <div class="equation">4n = x² = 4k² &nbsp;⇒&nbsp; n = k².</div>
        <div class="equation">k = 1, 2, 3 &nbsp;⇒&nbsp; n = 1, 4, 9.</div>
        <p>In general, <em>mn</em> must be a square. Equivalently, the two radii have the same square-free part:</p>
        <div class="equation">m = a²b, &nbsp; n = c²b, &nbsp; x = 2abc,</div>
        <p>where <em>a,c</em> are positive integers and <em>b</em> is positive and square-free, including <em>b=1</em>.</p>
        <div class="p110-source-note"><strong>Source correction.</strong> The printed split into a unity case and a “non-square b” case misses valid all-square pairs. Taking b=1 includes every pair of square radii, such as m=4, n=9, x=12.</div>
      </section>`;
  }

  function snapshot() {
    const pair = activePair();
    return JSON.stringify({
      problem: "1.10",
      stage: state.stage + 1,
      search: {
        m: 1,
        x: state.searchX,
        n: searchN(),
        nAsFraction: searchNText(),
        positiveIntegerRadius: searchIsValid(),
      },
      generalParameters: { a: state.a, b: state.b, c: state.c },
      displayedPair: pair,
      pythagoreanCheck: Number((((pair.m + pair.n) ** 2) - ((pair.n - pair.m) ** 2) - (pair.x ** 2)).toFixed(12)),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const stage = stages[state.stage];
    const pair = activePair();
    return `
      <main class="book-shell p110-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p110-progress"><span></span></div></div>
          ${problemHeaderActions("1.10", resetMarkup)}
        </header>
        <div class="book-spread p110-spread">
          <article class="book-page p110-problem-page">
            <div class="problem-number">Problem 1.10</div>
            <h1 class="book-title p110-title">Big and small tree trunks</h1>
            <div class="difficulty p110-difficulty" aria-label="Two star difficulty, with a four star extension">★★ <span>extension ★★★★</span></div>
            <p class="problem-copy">Circular trunks of positive-integer radii <em>m</em> and <em>n</em> rest on <em>y=0</em>, touch each other, and have axes parallel to <em>z</em>.</p>
            <ol class="p110-parts">
              <li>Find the condition for both centre x-coordinates to be integers.</li>
              <li>Find the three smallest n when m=1.</li>
              <li><strong>Extension:</strong> characterize every pair m,n.</li>
            </ol>
            <div class="p110-clarification"><strong>Source clarification</strong><span>Mutual tangency is implied by the printed drawing. Put the first centre at x=0 without loss of generality.</span></div>
            <section class="prediction-box p110-prediction">
              <div class="eyebrow">Before calculating</div>
              <p>Will integer alignment depend on each radius separately, on m+n, or on the product mn?</p>
            </section>
          </article>
          <section class="book-page book-stage p110-stage">
            <div class="p110-stage-tabs" role="group" aria-label="Construction stage">
              ${stages.map((item, index) => `<button class="chip-button ${state.stage === index ? "active" : ""}" type="button" data-problem-action="p110-stage" data-p110-stage="${index}" aria-current="${state.stage === index ? "step" : "false"}">${index + 1}. ${item.short}</button>`).join("")}
            </div>
            <div class="p110-figure-wrap" data-p110-figure-wrap>${treeSvg()}</div>
            <div class="book-stage-caption p110-caption" aria-live="polite">
              <div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
              <div class="p110-alignment ${pair.valid ? "p110-aligned" : "p110-misaligned"}">
                <small>Current pair m, n</small>
                <strong data-p110-live="pair">${decimal(pair.m)}, ${decimal(pair.n)}</strong>
                <span data-p110-live="alignment">${pairStatus(pair)}</span>
              </div>
            </div>
            <div class="p110-stage-equation" data-p110-stage-equation>${stage.equation}</div>
            ${state.stage < 2 ? searchControls() : familyControls()}
          </section>
          <aside class="book-page book-coach p110-coach">
            <div class="coach-kicker">Part 2 · commit</div>
            <p class="coach-question">For m=1, what are the first three positive-integer values of n?</p>
            <div class="book-metrics p110-metrics">
              <div class="book-metric"><small>Condition</small><strong>x² = 4mn</strong></div>
              <div class="book-metric"><small>First three n</small><strong>${state.revealed ? "1, 4, 9" : "?, ?, ?"}</strong></div>
            </div>
            <form class="estimate-form p110-estimate-form" data-p110-estimate-form novalidate>
              <label for="p110-estimate">Three values, in ascending order</label>
              <div class="estimate-field"><input id="p110-estimate" class="estimate-input" inputmode="numeric" type="text" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 1, 4, 9" autocomplete="off" /><span>n</span></div>
              <button class="primary-button" type="submit">Commit answer</button>
            </form>
            <div class="button-row p110-help-row">
              <button class="secondary-button" type="button" data-problem-action="p110-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p110-reveal">Reveal</button>
            </div>
            ${feedbackMarkup()}
            ${hintStack()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("1.10")}
      </main>`;
  }

  function updateSearchDom() {
    const root = document.querySelector(".p110-book-shell");
    if (!root) return;
    const pair = activePair();
    const figure = root.querySelector("[data-p110-figure-wrap]");
    if (figure) figure.innerHTML = treeSvg();
    root.querySelectorAll('[data-p110-live="searchX"]').forEach((node) => { node.textContent = String(state.searchX); });
    root.querySelectorAll('[data-p110-live="pair"]').forEach((node) => { node.textContent = `${decimal(pair.m)}, ${decimal(pair.n)}`; });
    root.querySelectorAll('[data-p110-live="alignment"]').forEach((node) => { node.textContent = pairStatus(pair); });
    const result = root.querySelector("[data-p110-search-result]");
    if (result) result.innerHTML = searchResultMarkup();
    const alignment = root.querySelector(".p110-alignment");
    if (alignment) {
      alignment.classList.toggle("p110-aligned", pair.valid);
      alignment.classList.toggle("p110-misaligned", !pair.valid);
    }
    const slider = root.querySelector("[data-p110-x-slider]");
    if (slider) {
      slider.style.setProperty("--slider-progress", `${sliderProgress()}%`);
      slider.setAttribute("aria-valuenow", String(state.searchX));
      slider.setAttribute("aria-valuetext", searchAriaText());
    }
    root.querySelectorAll('[data-problem-action="p110-search-x"]').forEach((button) => {
      const active = Number(button.dataset.p110X) === state.searchX;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setSearchFromPointer(event, slider) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const progress = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setSearchX(MIN_X + progress * (MAX_X - MIN_X));
    updateSearchDom();
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function parseEstimate(raw) {
    const tokens = raw.trim().split(/[\s,;]+/).filter(Boolean);
    if (tokens.length !== 3 || tokens.some((token) => !/^\d+$/.test(token))) return null;
    const values = tokens.map(Number);
    return values.every((value) => Number.isSafeInteger(value) && value > 0) ? values : null;
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p110-book-shell");
    if (!root) return;

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";
        if (action === "p110-reset") state = initialState();
        if (action === "p110-stage") {
          setStage(control.dataset.p110Stage);
          focusSelector = `[data-problem-action="p110-stage"][data-p110-stage="${state.stage}"]`;
        }
        if (action === "p110-search-x") {
          setSearchX(control.dataset.p110X);
          focusSelector = `[data-problem-action="p110-search-x"][data-p110-x="${state.searchX}"]`;
        }
        if (action === "p110-adjust") {
          const parameter = control.dataset.p110Param;
          setParameter(parameter, state[parameter] + Number(control.dataset.p110Delta));
          focusSelector = `[data-p110-param-value="${parameter}"]`;
        }
        if (action === "p110-set-b") {
          setSquareFree(control.dataset.p110B);
          focusSelector = `[data-problem-action="p110-set-b"][data-p110-b="${state.b}"]`;
        }
        if (action === "p110-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          if (state.hintsUsed >= 2) state.stage = Math.max(state.stage, 1);
          if (state.hintsUsed >= 4) state.stage = 2;
        }
        if (action === "p110-reveal") {
          state.revealed = true;
          state.stage = 2;
        }
        renderApp();
        if (action === "p110-reveal") {
          window.requestAnimationFrame(() => document.querySelector("#p110-solution-heading")?.focus());
        } else if (focusSelector) {
          window.requestAnimationFrame(() => document.querySelector(focusSelector)?.focus());
        }
      });
    });

    const form = root.querySelector("[data-p110-estimate-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("#p110-estimate");
      const raw = input.value.trim();
      const values = parseEstimate(raw);
      state.estimate = raw;
      state.committed = false;
      state.feedbackTone = "";
      if (!values) {
        state.feedback = "Enter exactly three positive whole numbers, separated by commas or spaces.";
      } else {
        state.committed = true;
        if (values.every((value, index) => value === [1, 4, 9][index])) {
          state.feedbackTone = "success";
          state.feedback = "Exactly: x = 2, 4, 6 gives n = 1, 4, 9. Now explain the square pattern.";
          state.stage = Math.max(state.stage, 1);
        } else if (values.every((value, index) => value === [4, 9, 16][index])) {
          state.feedback = "Those are the next three. The title does not require unequal radii: m=n=1 is allowed, so the list starts at 1.";
        } else if (values.every((value) => Number.isInteger(Math.sqrt(value)))) {
          state.feedback = "You have found square numbers, but the ascending list must start with the three smallest positive squares.";
        } else {
          state.feedback = "Use x²=4n. Which integer x values make x² divisible by 4?";
        }
      }
      renderApp();
    });

    const slider = root.querySelector("[data-p110-x-slider]");
    if (!slider) return;
    slider.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      slider.focus();
      slider.setPointerCapture(event.pointerId);
      setSearchFromPointer(event, slider);
    });
    slider.addEventListener("pointermove", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) setSearchFromPointer(event, slider);
    });
    slider.addEventListener("pointerup", (event) => {
      setSearchFromPointer(event, slider);
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-p110-x-slider]");
    });
    slider.addEventListener("pointercancel", (event) => {
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      renderAndFocus(renderApp, "[data-p110-x-slider]");
    });
    slider.addEventListener("keydown", (event) => {
      let next = state.searchX;
      if (["ArrowLeft", "ArrowDown"].includes(event.key)) next -= 1;
      else if (["ArrowRight", "ArrowUp"].includes(event.key)) next += 1;
      else if (event.key === "PageDown") next -= 2;
      else if (event.key === "PageUp") next += 2;
      else if (event.key === "Home") next = MIN_X;
      else if (event.key === "End") next = MAX_X;
      else return;
      event.preventDefault();
      setSearchX(next);
      renderAndFocus(renderApp, "[data-p110-x-slider]");
    });
  }

  window.poveyProblemPages["1.10"] = { render, bind };
}());
