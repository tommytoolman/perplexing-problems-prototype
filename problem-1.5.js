(function registerIntersectingCirclesPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const ALPHA = Math.acos((5 * Math.SQRT2) / 8);
  const BETA = Math.acos((11 * Math.SQRT2) / 16);
  const COEFFICIENT = ALPHA + 4 * BETA - Math.sqrt(7) / 2;

  const hints = [
    "The centres are at opposite corners of a square of side 2l. What is the length of its diagonal AB?",
    "The line joining two circle centres is the perpendicular bisector of their common chord. Draw AB and CD.",
    "Call the angles between AB and the radii AD and BD α and β. Each full sector angle is twice the labelled angle.",
    "The lens is the two sectors minus quadrilateral BCAD. Use the cosine rule in triangle ADB to find α and β.",
  ];

  const stages = [
    {
      short: "The lens",
      title: "Start with the fixed geometry",
      copy: "The centres sit at opposite corners of a square of side 2l. The overlap is the red lens, and its area must be a constant times l².",
      equation: "A = k l²",
      description: "Two circles centred at opposite corners of a square overlap in a narrow shaded lens.",
    },
    {
      short: "Add radii",
      title: "Use the line of centres",
      copy: "AB cuts the common chord CD in half at right angles. The labelled α and β are half the two sector angles.",
      equation: "AB ⟂ CD   ·   AC = AD = l   ·   BC = BD = 2l",
      description: "Radii join the centres to both circle intersections. The diagonal AB bisects chord CD at a right angle, and half-angles alpha and beta are marked.",
    },
    {
      short: "Decompose",
      title: "Add two sectors, then subtract",
      copy: "The mint and gold sectors contain the lens plus quadrilateral BCAD. The hatched quadrilateral is the part counted outside the lens.",
      equation: "A_lens = l²α + 4l²β − |AB||CD|/2",
      description: "The small sector is mint, the large sector is gold, and quadrilateral BCAD is hatched to show the area to subtract.",
    },
    {
      short: "Calculate",
      title: "Reduce everything to triangle ADB",
      copy: "The square gives AB. The cosine rule gives α and β, and the perpendicular half-chord gives CD. Inverse-cosine values must be used in radians.",
      equation: "AB = 2√2l   ·   cos α = 5√2/8   ·   cos β = 11√2/16",
      description: "The complete construction is labelled with the three quantities needed for the exact overlap calculation.",
    },
  ];

  const initialState = () => ({
    step: 0,
    estimate: "",
    committed: false,
    feedback: "",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function stateSnapshot() {
    return JSON.stringify(
      {
        problem: "1.5",
        constructionStage: state.step + 1,
        estimateForCoefficient: state.estimate === "" ? null : Number(state.estimate),
        committed: state.committed,
        hintsUsed: state.hintsUsed,
        solutionRevealed: state.revealed,
        calculatedCoefficient: state.revealed ? Number(COEFFICIENT.toFixed(9)) : null,
      },
      null,
      2,
    );
  }

  function constructionSvg() {
    const stage = stages[state.step];
    const decomposition = state.step >= 2
      ? `
        <g class="p15-area-layers" aria-hidden="true">
          <path class="p15-sector p15-small-sector" d="M160 70 L303.358 114.142 A150 150 0 0 1 204.142 213.358 Z" />
          <path class="p15-sector p15-large-sector" d="M460 370 L204.142 213.358 A300 300 0 0 1 303.358 114.142 Z" />
          <path class="p15-kite" d="M460 370 L204.142 213.358 L160 70 L303.358 114.142 Z" />
          <text class="p15-area-label p15-small-label" x="177" y="128">small sector</text>
          <text class="p15-area-label p15-large-label" x="350" y="275">large sector</text>
          <text class="p15-area-label p15-minus-label" x="287" y="231">subtract BCAD</text>
        </g>`
      : "";

    const construction = state.step >= 1
      ? `
        <g class="p15-construction" aria-hidden="true">
          <line class="p15-line-centres" x1="160" y1="70" x2="460" y2="370" />
          <line class="p15-common-chord" x1="204.142" y1="213.358" x2="303.358" y2="114.142" />
          <line class="p15-radius p15-radius-small" x1="160" y1="70" x2="204.142" y2="213.358" />
          <line class="p15-radius p15-radius-small" x1="160" y1="70" x2="303.358" y2="114.142" />
          <line class="p15-radius p15-radius-large" x1="460" y1="370" x2="204.142" y2="213.358" />
          <line class="p15-radius p15-radius-large" x1="460" y1="370" x2="303.358" y2="114.142" />
          <path class="p15-angle-arc" d="M203 83.2 A45 45 0 0 1 191.82 101.82" />
          <path class="p15-angle-arc" d="M421.11 331.11 A55 55 0 0 1 431.29 323.08" />
          <path class="p15-right-angle" d="M0 -9 L9 -9 L9 0" transform="translate(253.75 163.75) rotate(45)" />
          <circle class="p15-point" cx="204.142" cy="213.358" r="5" />
          <circle class="p15-point" cx="303.358" cy="114.142" r="5" />
          <circle class="p15-midpoint" cx="253.75" cy="163.75" r="4" />
          <text class="p15-point-label" x="186" y="230">C</text>
          <text class="p15-point-label" x="310" y="107">D</text>
          <text class="p15-point-label p15-midpoint-label" x="260" y="181">M</text>
          <text class="p15-angle-label" x="202" y="91">α</text>
          <text class="p15-angle-label" x="411" y="315">β</text>
          <text class="p15-radius-label" x="177" y="162">l</text>
          <text class="p15-radius-label" x="360" y="200">2l</text>
        </g>`
      : "";

    const calculation = state.step >= 3
      ? `
        <g class="p15-calculation-labels" aria-hidden="true">
          <text x="490" y="126">AB = 2√2l</text>
          <text x="490" y="151">CD/2 = l√14/8</text>
          <text x="490" y="176">sector angles</text>
          <text x="490" y="197">are 2α and 2β</text>
        </g>`
      : "";

    return `
      <svg class="route-svg p15-svg p15-stage-${state.step}" viewBox="0 0 640 440" role="img" aria-labelledby="p15-svg-title p15-svg-desc">
        <title id="p15-svg-title">Intersecting circles construction, stage ${state.step + 1}: ${stage.short}</title>
        <desc id="p15-svg-desc">${stage.description}</desc>
        <defs>
          <clipPath id="p15-square-clip"><rect x="160" y="70" width="300" height="300" /></clipPath>
          <pattern id="p15-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="rgba(255,253,245,.62)" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#b51f38" stroke-width="3" />
          </pattern>
          <marker id="p15-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
            <path d="M0 0 L7 3.5 L0 7" fill="none" stroke="currentColor" stroke-width="1.4" />
          </marker>
        </defs>

        <rect class="p15-square" x="160" y="70" width="300" height="300" />
        ${decomposition}
        <g clip-path="url(#p15-square-clip)" aria-hidden="true">
          <circle class="p15-circle p15-circle-small" cx="160" cy="70" r="150" />
          <circle class="p15-circle p15-circle-large" cx="460" cy="370" r="300" />
        </g>
        <path class="p15-lens" d="M204.142 213.358 A300 300 0 0 1 303.358 114.142 A150 150 0 0 1 204.142 213.358 Z" />

        <g class="p15-dimensions" aria-hidden="true">
          <line x1="168" y1="45" x2="452" y2="45" marker-start="url(#p15-arrow)" marker-end="url(#p15-arrow)" />
          <text x="310" y="35" text-anchor="middle">2l</text>
          <line x1="488" y1="78" x2="488" y2="362" marker-start="url(#p15-arrow)" marker-end="url(#p15-arrow)" />
          <text x="504" y="224">2l</text>
        </g>

        ${construction}
        ${calculation}

        <g class="p15-centres" aria-hidden="true">
          <circle cx="160" cy="70" r="6" />
          <circle cx="460" cy="370" r="6" />
          <text x="142" y="65">A</text>
          <text x="468" y="389">B</text>
          <text class="p15-circle-name" x="182" y="92">radius l</text>
          <text class="p15-circle-name" x="352" y="344">radius 2l</text>
        </g>
        <text class="p15-lens-label" x="266" y="158" text-anchor="middle">shaded area</text>
      </svg>`;
  }

  function stageControls() {
    return `
      <div class="p15-stage-controls" aria-label="Construction stages">
        ${stages.map((stage, index) => `
          <button
            class="chip-button p15-step-button ${state.step === index ? "active" : ""}"
            type="button"
            data-problem-action="stage"
            data-step="${index}"
            ${state.step === index ? 'aria-current="step"' : ""}
          ><span>${index + 1}</span>${stage.short}</button>`).join("")}
      </div>`;
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
    const success = state.committed && Math.abs(Number(state.estimate) - COEFFICIENT) <= 0.01;
    return `<div class="feedback ${success ? "success" : ""}" role="status">${state.feedback}</div>`;
  }

  function solution() {
    if (!state.revealed) return "";
    return `
      <section class="solution-card p15-solution" aria-label="Worked solution">
        <strong>Two sectors, minus what they share</strong>
        <p>The square gives <span class="p15-inline-equation">AB = 2√2l</span>. Applying the cosine rule to triangle ADB gives</p>
        <div class="equation">cos α = 5√2/8</div>
        <div class="equation">cos β = 11√2/16</div>
        <p>Because α and β are half the central angles, the sector areas are <span class="p15-inline-equation">l²α</span> and <span class="p15-inline-equation">4l²β</span>. Also, <span class="p15-inline-equation">CD/2 = l√14/8</span>, so the quadrilateral has area <span class="p15-inline-equation">(√7/2)l²</span>.</p>
        <div class="equation p15-exact-equation">A = l²[acos(5√2/8) + 4acos(11√2/16) − √7/2]</div>
        <div class="equation p15-answer-equation">A = 0.107976…l² ≈ 0.108l²</div>
        <p class="p15-radian-note">The inverse-cosine values are in radians, as sector-area formulas require.</p>
      </section>`;
  }

  function render() {
    const stage = stages[state.step];
    return `
      <main class="book-shell p15-book-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Content build</span></div>
          <div class="book-progress">Chapter 1 · Geometry<div class="book-progress-bar p15-progress"><span></span></div></div>
          ${problemHeaderActions("1.5", '<button class="ghost-button" type="button" data-problem-action="reset">Reset</button>')}
        </header>

        <div class="book-spread p15-spread">
          <article class="book-page">
            <div class="problem-number">Problem 1.5</div>
            <h1 class="book-title p15-book-title">Intersecting circles</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="p15-source-intro">A deceptively simple-looking puzzle: the compact route is to find areas we can add and subtract.</p>
            <p class="problem-copy">Two circles of radius <em>l</em> and <em>2l</em> are centred at opposite corners of a square of side <em>2l</em>, and intersect as shown. What is the area of the shaded region?</p>
            <section class="prediction-box">
              <div class="eyebrow">Before calculating</div>
              <p>Rescaling every length by <em>l</em> multiplies every area by <em>l²</em>. So the answer has the form <em>A = kl²</em>. How small do you expect <em>k</em> to be?</p>
              <div class="p15-scale" aria-hidden="true"><span>0</span><span>0.5</span><span>1</span></div>
            </section>
          </article>

          <section class="book-page book-stage p15-stage">
            ${stageControls()}
            ${constructionSvg()}
            <div class="p15-stage-caption" aria-live="polite">
              <div><div class="eyebrow">Stage ${state.step + 1} of 4</div><strong>${stage.title}</strong><p>${stage.copy}</p></div>
              <div class="p15-stage-equation">${stage.equation}</div>
            </div>
            ${state.step >= 3 ? `
              <div class="p15-values" aria-label="Construction values">
                <div><small>Half-angle α</small><strong>${ALPHA.toFixed(6)} rad</strong></div>
                <div><small>Half-angle β</small><strong>${BETA.toFixed(6)} rad</strong></div>
                <div><small>Half chord</small><strong>l√14 / 8</strong></div>
              </div>` : ""}
          </section>

          <aside class="book-page book-coach p15-coach">
            <div class="coach-kicker">Make a prediction</div>
            <p class="coach-question">Write the shaded area as <em>A = kl²</em>. What is <em>k</em>?</p>
            <form class="estimate-form" data-p15-estimate-form>
              <label for="p15-estimate">Your estimate for k</label>
              <div class="estimate-field"><input id="p15-estimate" class="estimate-input" data-p15-estimate inputmode="decimal" type="number" min="0" max="1" step="0.001" value="${state.estimate}" placeholder="e.g. 0.1" /><span>× l²</span></div>
              <button class="primary-button" type="submit">Commit estimate</button>
            </form>
            <div class="button-row">
              <button class="secondary-button" type="button" data-problem-action="hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="reveal">Reveal</button>
            </div>
            ${feedback()}
            ${hintStack()}
            ${solution()}
            ${debugPanel("Development state", stateSnapshot())}
          </aside>
        </div>
        ${problemNav("1.5")}
      </main>`;
  }

  function bind({ render: renderApp }) {
    document.querySelectorAll("[data-problem-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.problemAction;
        if (action === "reset") state = initialState();
        if (action === "stage") state.step = Math.max(0, Math.min(3, Number(button.dataset.step)));
        if (action === "hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "reveal") {
          state.revealed = true;
          state.step = 3;
        }
        renderApp();
      });
    });

    document.querySelectorAll("[data-p15-estimate]").forEach((input) => {
      input.addEventListener("input", (event) => {
        state.estimate = event.target.value;
        state.feedback = "";
        state.committed = false;
      });
    });

    document.querySelectorAll("[data-p15-estimate-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("[data-p15-estimate]");
        state.estimate = input?.value ?? "";
        const estimate = Number(state.estimate);

        if (state.estimate === "" || !Number.isFinite(estimate)) {
          state.feedback = "Enter a coefficient between 0 and 1 first.";
          state.committed = false;
        } else if (estimate < 0 || estimate > 1) {
          state.feedback = "The coefficient k should be between 0 and 1 for this lens inside an l by l reference area.";
          state.committed = false;
        } else {
          state.committed = true;
          const difference = estimate - COEFFICIENT;
          if (Math.abs(difference) <= 0.01) {
            state.feedback = "Strong estimate. You are within 0.01 of the geometric result.";
          } else if (difference < 0) {
            state.feedback = "Your estimate is low. The lens is narrow, but both circular segments contribute to it.";
          } else {
            state.feedback = "Your estimate is high. The circles are close to external tangency, so their overlap is only a small fraction of l².";
          }
        }
        renderApp();
      });
    });
  }

  window.poveyProblemPages["1.5"] = { render, bind };
})();
