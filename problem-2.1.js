(function registerHumanCalculatorPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const CENTER_MIN = 10;
  const CENTER_MAX = 250;
  const OFFSET_MAX = 25;
  const presets = Object.freeze([
    { center: 50, offset: 2, label: "48 × 52" },
    { center: 100, offset: 3, label: "97 × 103" },
    { center: 80, offset: 6, label: "74 × 86" },
    { center: 200, offset: 2, label: "198 × 202" },
  ]);
  const hints = Object.freeze([
    "The two factors are equally far from the central number. Write them as c−d and c+d.",
    "Pairs of the form (c−d)(c+d) are a difference of two squares.",
    "Use (c−d)(c+d)=c²−d². For 48×52, calculate 50²−2².",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p21-reset">Reset</button>';

  const initialState = () => ({
    center: 50,
    offset: 2,
    answer: "",
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

  function maximumOffset(center = state.center) {
    return Math.min(OFFSET_MAX, center - 1);
  }

  function factors() {
    return [state.center - state.offset, state.center + state.offset];
  }

  function product() {
    const [left, right] = factors();
    return left * right;
  }

  function centerSquare() {
    return state.center * state.center;
  }

  function offsetSquare() {
    return state.offset * state.offset;
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function clearAttempt() {
    state.answer = "";
    state.committed = false;
    state.feedback = "";
    state.feedbackTone = "";
  }

  function setChallenge(center, offset) {
    state.center = Math.round(clamp(center, CENTER_MIN, CENTER_MAX));
    state.offset = Math.round(clamp(offset, 0, maximumOffset(state.center)));
    clearAttempt();
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => preset.center === state.center && preset.offset === state.offset);
  }

  function sliderProgress(kind) {
    if (kind === "center") return ((state.center - CENTER_MIN) / (CENTER_MAX - CENTER_MIN)) * 100;
    const maximum = maximumOffset();
    return maximum ? (state.offset / maximum) * 100 : 0;
  }

  function sliderValueText(kind) {
    if (kind === "center") return `Central number ${state.center}`;
    const [left, right] = factors();
    return `Equal offset ${state.offset}; factors ${left} and ${right}`;
  }

  function dragSliderMarkup(kind, labelId) {
    const isCenter = kind === "center";
    const minimum = isCenter ? CENTER_MIN : 0;
    const maximum = isCenter ? CENTER_MAX : maximumOffset();
    const value = isCenter ? state.center : state.offset;
    return `
      <div
        class="drag-slider p21-drag-slider"
        data-p21-slider="${kind}"
        role="slider"
        tabindex="0"
        aria-labelledby="${labelId}"
        aria-valuemin="${minimum}"
        aria-valuemax="${maximum}"
        aria-valuenow="${value}"
        aria-valuetext="${sliderValueText(kind)}"
        style="--slider-progress:${sliderProgress(kind).toFixed(3)}%"
      >
        <span class="drag-slider-track"></span>
        <span class="drag-slider-fill"></span>
        <span class="drag-slider-handle"></span>
      </div>`;
  }

  function factorVisual() {
    const [left, right] = factors();
    const spread = state.offset === 0 ? 0 : 34;
    return `
      <div class="p21-factor-visual" role="img" aria-label="${left} and ${right} are each ${state.offset} from ${state.center}">
        <div class="p21-number-line" aria-hidden="true">
          <span class="p21-number-line-rule"></span>
          <span class="p21-number-node p21-number-left" style="--p21-x:${50 - spread}%">
            <small>c − d</small><strong data-p21-live="left">${left}</strong>
          </span>
          <span class="p21-number-node p21-number-centre" style="--p21-x:50%">
            <small>centre</small><strong data-p21-live="center">${state.center}</strong>
          </span>
          <span class="p21-number-node p21-number-right" style="--p21-x:${50 + spread}%">
            <small>c + d</small><strong data-p21-live="right">${right}</strong>
          </span>
          <span class="p21-distance p21-distance-left" style="--p21-width:${spread}%"><i></i><b data-p21-live="offset-label">${state.offset}</b></span>
          <span class="p21-distance p21-distance-right" style="--p21-width:${spread}%"><i></i><b data-p21-live="offset-label">${state.offset}</b></span>
        </div>
        <div class="p21-product-readout" aria-live="polite" aria-atomic="true">
          <span data-p21-live="left">${left}</span><i>×</i><span data-p21-live="right">${right}</span>
        </div>
      </div>`;
  }

  function controlMarkup() {
    return `
      <div class="math2-controls p21-controls">
        <div class="p21-range-row">
          <div class="p21-slider-label" id="p21-center-label"><strong>Central number</strong><output data-p21-live="center">${state.center}</output></div>
          ${dragSliderMarkup("center", "p21-center-label")}
          <div class="slider-labels" aria-hidden="true"><span>${CENTER_MIN}</span><span>centre c</span><span>${CENTER_MAX}</span></div>
        </div>
        <div class="p21-range-row">
          <div class="p21-slider-label" id="p21-offset-label"><strong>Equal offset</strong><output data-p21-live="offset">${state.offset}</output></div>
          ${dragSliderMarkup("offset", "p21-offset-label")}
          <div class="slider-labels" aria-hidden="true"><span>0</span><span>distance d</span><span data-p21-live="offset-max">${maximumOffset()}</span></div>
        </div>
        <div class="p21-presets" aria-label="Mental multiplication challenges">
          ${presets.map((preset, index) => `<button class="chip-button math2-chip ${activePresetIndex() === index ? "active" : ""}" type="button" data-problem-action="p21-preset" data-p21-preset="${index}" aria-pressed="${activePresetIndex() === index}">${preset.label}</button>`).join("")}
        </div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    const tone = state.feedbackTone === "success" ? "is-success" : "is-warn";
    return `<div class="math2-feedback ${tone}" role="status">${state.feedback}</div>`;
  }

  function hintMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p21-hints" aria-live="polite">${hints
      .slice(0, state.hintsUsed)
      .map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`)
      .join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    const [left, right] = factors();
    return `
      <section class="math2-solution p21-solution" aria-labelledby="p21-solution-heading">
        <h3 id="p21-solution-heading" tabindex="-1">Trade multiplication for two squares</h3>
        <p>The factors sit the same distance, <em>d</em>, on either side of the centre, <em>c</em>.</p>
        <div class="math2-equation">(c−d)(c+d) = c²−d²</div>
        <div class="p21-worked-equation" aria-live="polite">
          <span><b data-p21-live="left">${left}</b> × <b data-p21-live="right">${right}</b></span>
          <span>= <b data-p21-live="center">${state.center}</b>² − <b data-p21-live="offset">${state.offset}</b>²</span>
          <span>= <b data-p21-live="center-square">${centerSquare()}</b> − <b data-p21-live="offset-square">${offsetSquare()}</b></span>
          <strong>= <span data-p21-live="product">${product()}</span></strong>
        </div>
        <p>This is the difference-of-squares identity, so the same shortcut works for every symmetric pair.</p>
      </section>`;
  }

  function snapshot() {
    const [left, right] = factors();
    return JSON.stringify({
      problem: "2.1",
      provenance: "independently reconstructed from title and difficulty only",
      center: state.center,
      offset: state.offset,
      factors: [left, right],
      centerSquare: centerSquare(),
      offsetSquare: offsetSquare(),
      product: product(),
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    const [left, right] = factors();
    return `
      <main class="book-shell math2-shell p21-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive mathematics</span></div>
          <div class="book-progress">${problemProgress("2.1")}</div>
          ${problemHeaderActions("2.1", resetMarkup)}
        </header>
        <div class="book-spread math2-spread p21-spread">
          <article class="book-page p21-problem-page">
            <div class="problem-number">Problem 2.1</div>
            <h1 class="book-title math2-title p21-title">Human calculator</h1>
            <div class="difficulty" aria-label="One star difficulty">★</div>
            <p class="problem-copy">Without using long multiplication or a calculator, find <strong>48 × 52</strong>. Explain a method that works whenever two factors are equally far from a convenient central number.</p>
            <p class="math2-reconstruction-note"><strong>Reconstructed activity</strong> — the available source gives only the title and difficulty. This activity is not Povey’s original wording.</p>
            <section class="prediction-box">
              <div class="eyebrow">Mental move</div>
              <p>Rather than multiply ${left} by ${right} directly, look at how the pair is arranged around ${state.center}.</p>
            </section>
          </article>

          <section class="book-page book-stage math2-stage p21-stage" aria-labelledby="p21-stage-title">
            <div class="math2-stage-card p21-stage-card">
              <div class="math2-stage-heading">
                <div><span class="eyebrow">Symmetric factors</span><h2 id="p21-stage-title">Same distance from the centre</h2></div>
                <p>Move the centre and offset. The factors always stay balanced around the middle.</p>
              </div>
              ${factorVisual()}
              ${controlMarkup()}
              <div class="math2-metrics p21-metrics" aria-live="polite">
                <div class="math2-metric"><span>central square</span><strong><b data-p21-live="center">${state.center}</b>² = <b data-p21-live="center-square">${centerSquare()}</b></strong></div>
                <div class="math2-metric"><span>small square</span><strong><b data-p21-live="offset">${state.offset}</b>² = <b data-p21-live="offset-square">${offsetSquare()}</b></strong></div>
              </div>
            </div>
          </section>

          <aside class="book-page book-coach p21-coach">
            <div class="coach-kicker">Your turn</div>
            <p class="coach-question">What is <strong data-p21-live="left">${left}</strong> × <strong data-p21-live="right">${right}</strong>?</p>
            <form class="estimate-form p21-answer-form" data-p21-answer-form novalidate>
              <label for="p21-answer">Product</label>
              <div class="estimate-field"><input class="estimate-input" id="p21-answer" type="text" inputmode="numeric" pattern="[0-9, ]*" value="${escapeAttribute(state.answer)}" placeholder="Your answer" autocomplete="off" /><span>exact</span></div>
              <button class="primary-button" type="submit">Commit answer</button>
            </form>
            <div class="button-row p21-help-row">
              <button class="secondary-button" type="button" data-problem-action="p21-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p21-reveal">Reveal</button>
            </div>
            ${feedbackMarkup()}
            ${hintMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav("2.1")}
      </main>`;
  }

  function updateExplorationDom(root) {
    const [left, right] = factors();
    const spread = state.offset === 0 ? 0 : 34;
    const values = {
      center: state.center,
      offset: state.offset,
      left,
      right,
      "offset-label": state.offset,
      "center-square": centerSquare(),
      "offset-square": offsetSquare(),
      "offset-max": maximumOffset(),
      product: product(),
    };

    Object.entries(values).forEach(([key, value]) => {
      root.querySelectorAll(`[data-p21-live="${key}"]`).forEach((node) => { node.textContent = String(value); });
    });

    root.querySelectorAll("[data-p21-slider]").forEach((slider) => {
      const kind = slider.dataset.p21Slider;
      const isCenter = kind === "center";
      const maximum = isCenter ? CENTER_MAX : maximumOffset();
      const value = isCenter ? state.center : state.offset;
      slider.style.setProperty("--slider-progress", `${sliderProgress(kind).toFixed(3)}%`);
      slider.setAttribute("aria-valuemax", String(maximum));
      slider.setAttribute("aria-valuenow", String(value));
      slider.setAttribute("aria-valuetext", sliderValueText(kind));
    });

    const visual = root.querySelector(".p21-factor-visual");
    if (visual) visual.setAttribute("aria-label", `${left} and ${right} are each ${state.offset} from ${state.center}`);
    const leftNode = root.querySelector(".p21-number-left");
    const rightNode = root.querySelector(".p21-number-right");
    if (leftNode) leftNode.style.setProperty("--p21-x", `${50 - spread}%`);
    if (rightNode) rightNode.style.setProperty("--p21-x", `${50 + spread}%`);
    root.querySelectorAll(".p21-distance").forEach((node) => node.style.setProperty("--p21-width", `${spread}%`));

    root.querySelectorAll('[data-problem-action="p21-preset"]').forEach((button) => {
      const active = Number(button.dataset.p21Preset) === activePresetIndex();
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function setSliderValue(kind, value, root) {
    if (kind === "center") {
      state.center = Math.round(clamp(value, CENTER_MIN, CENTER_MAX));
      state.offset = Math.min(state.offset, maximumOffset());
    } else {
      state.offset = Math.round(clamp(value, 0, maximumOffset()));
    }
    clearAttempt();
    const answer = root.querySelector("#p21-answer");
    if (answer) answer.value = "";
    root.querySelectorAll(".math2-feedback").forEach((node) => node.remove());
    updateExplorationDom(root);
  }

  function setSliderFromPointer(event, slider, root) {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return;
    const progress = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const kind = slider.dataset.p21Slider;
    const minimum = kind === "center" ? CENTER_MIN : 0;
    const maximum = kind === "center" ? CENTER_MAX : maximumOffset();
    setSliderValue(kind, minimum + progress * (maximum - minimum), root);
  }

  function parseAnswer(raw) {
    const normalized = raw.trim().replaceAll(",", "").replaceAll(" ", "");
    if (!/^\d+$/.test(normalized)) return null;
    const value = Number(normalized);
    return Number.isSafeInteger(value) ? value : null;
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p21-shell");
    if (!root) return;

    root.querySelector("#p21-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "";
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        let focusSelector = "";

        if (action === "p21-reset") state = initialState();
        if (action === "p21-preset") {
          const index = Number(control.dataset.p21Preset);
          const preset = presets[index];
          if (preset) setChallenge(preset.center, preset.offset);
          focusSelector = `[data-problem-action="p21-preset"][data-p21-preset="${index}"]`;
        }
        if (action === "p21-hint") {
          state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
          focusSelector = '[data-problem-action="p21-hint"]';
        }
        if (action === "p21-reveal") state.revealed = true;

        renderApp();
        if (action === "p21-reveal") focusAfterRender("#p21-solution-heading");
        else if (focusSelector) focusAfterRender(focusSelector);
      });
    });

    root.querySelectorAll("[data-p21-slider]").forEach((slider) => {
      slider.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        slider.focus();
        slider.setPointerCapture(event.pointerId);
        setSliderFromPointer(event, slider, root);
      });
      slider.addEventListener("pointermove", (event) => {
        if (slider.hasPointerCapture(event.pointerId)) setSliderFromPointer(event, slider, root);
      });
      slider.addEventListener("pointerup", (event) => {
        setSliderFromPointer(event, slider, root);
        if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      });
      slider.addEventListener("pointercancel", (event) => {
        if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      });
      slider.addEventListener("keydown", (event) => {
        const kind = slider.dataset.p21Slider;
        const value = kind === "center" ? state.center : state.offset;
        const minimum = kind === "center" ? CENTER_MIN : 0;
        const maximum = kind === "center" ? CENTER_MAX : maximumOffset();
        let next = value;
        if (["ArrowLeft", "ArrowDown"].includes(event.key)) next -= 1;
        else if (["ArrowRight", "ArrowUp"].includes(event.key)) next += 1;
        else if (event.key === "PageDown") next -= kind === "center" ? 10 : 5;
        else if (event.key === "PageUp") next += kind === "center" ? 10 : 5;
        else if (event.key === "Home") next = minimum;
        else if (event.key === "End") next = maximum;
        else return;
        event.preventDefault();
        setSliderValue(kind, next, root);
      });
    });

    const form = root.querySelector("[data-p21-answer-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = form.querySelector("#p21-answer")?.value || "";
      const answer = parseAnswer(raw);
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "";

      if (answer === null) {
        state.feedback = "Enter one positive whole-number product.";
      } else {
        state.committed = true;
        if (answer === product()) {
          state.feedbackTone = "success";
          state.feedback = `Exactly. ${state.center}² − ${state.offset}² = ${product()}.`;
        } else if (answer === centerSquare()) {
          state.feedback = `You found the central square, ${centerSquare()}. The factors sit ${state.offset} either side, so one small square still has to come off.`;
        } else if (answer === centerSquare() - state.offset) {
          state.feedback = `Very close to the right shortcut, but subtract d², not d. Here d² = ${offsetSquare()}.`;
        } else {
          state.feedback = `Your answer is ${answer < product() ? "below" : "above"} the product. Look for a square near ${left} × ${right}.`;
        }
      }
      renderApp();
      focusAfterRender("#p21-answer");
    });
  }

  window.poveyProblemPages["2.1"] = { render, bind };
}());
