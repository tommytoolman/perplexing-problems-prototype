(function registerSewageWorkersEscapePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "3.2";
  const COVER_LENGTH = 1.2;
  const COVER_WEIGHT = 600;
  const FORCE_LIMIT = 500;
  const ORIGINAL_ANGLE = 60;
  const RESISTING_MOMENT = COVER_WEIGHT * COVER_LENGTH / 2;
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p32-reset">Reset</button>';
  const hints = Object.freeze([
    "Take moments about the hinge. The unknown hinge forces then contribute no moment.",
    "The uniform cover’s 600 N weight acts at its midpoint, 0.6 m from the hinge, giving a closing moment of 360 N·m.",
    "Only the component perpendicular to the cover turns it. At 60°, the worker’s opening moment is 500x sin 60°. Set this equal to 360 N·m.",
  ]);
  const presets = Object.freeze([
    Object.freeze({ label: "Near hinge", contact: 0.45, angle: 60 }),
    Object.freeze({ label: "Just enough", contact: (0.48 * Math.sqrt(3)), angle: 60 }),
    Object.freeze({ label: "Far edge", contact: 1.2, angle: 60 }),
    Object.freeze({ label: "Straight up", contact: 0.72, angle: 90 }),
  ]);

  const initialState = () => ({
    contact: 0.75,
    angle: ORIGINAL_ANGLE,
    estimate: "",
    committed: false,
    feedback: "",
    feedbackTone: "neutral",
    hintsUsed: 0,
    revealed: false,
  });

  let state = initialState();

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value)));
  }

  function radians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(digits)).toString();
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function perpendicularForce(angle = state.angle) {
    return FORCE_LIMIT * Math.sin(radians(angle));
  }

  function openingMoment(contact = state.contact, angle = state.angle) {
    return perpendicularForce(angle) * contact;
  }

  function requiredForce(contact = state.contact, angle = state.angle) {
    const leverage = contact * Math.sin(radians(angle));
    return leverage > 0 ? RESISTING_MOMENT / leverage : Infinity;
  }

  function minimumContact(angle = state.angle) {
    return RESISTING_MOMENT / perpendicularForce(angle);
  }

  function canLift(contact = state.contact, angle = state.angle) {
    return openingMoment(contact, angle) >= RESISTING_MOMENT - 1e-8;
  }

  function activePresetIndex() {
    return presets.findIndex((preset) => (
      Math.abs(preset.contact - state.contact) < 0.001
      && Math.abs(preset.angle - state.angle) < 0.001
    ));
  }

  function geometry() {
    const hingeX = 100;
    const hatchY = 190;
    const hatchPixels = 440;
    const contactX = hingeX + (state.contact / COVER_LENGTH) * hatchPixels;
    const poleLength = 150;
    const angle = radians(state.angle);
    const baseX = contactX - Math.cos(angle) * poleLength;
    const baseY = hatchY + Math.sin(angle) * poleLength;
    const arrowStartX = contactX - Math.cos(angle) * 82;
    const arrowStartY = hatchY + Math.sin(angle) * 82;
    return { hingeX, hatchY, hatchPixels, contactX, baseX, baseY, arrowStartX, arrowStartY };
  }

  function apparatusMarkup() {
    const shape = geometry();
    const lift = canLift();
    return `
      <div class="p32-apparatus-wrap">
        <svg class="p32-apparatus" viewBox="0 0 640 360" role="img" aria-labelledby="p32-apparatus-title p32-apparatus-desc">
          <title id="p32-apparatus-title">Worker pushing a hinged manhole cover with a pole</title>
          <desc id="p32-apparatus-desc">The pole contacts the cover ${format(state.contact, 2)} metres from the hinge at ${format(state.angle, 0)} degrees. The opening moment is ${format(openingMoment(), 1)} newton metres against a closing moment of 360 newton metres. The cover ${lift ? "can begin to lift" : "remains closed"}.</desc>
          <defs>
            <marker id="p32-arrow-red" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
            <marker id="p32-arrow-gold" markerWidth="8" markerHeight="8" refX="6.2" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" /></marker>
          </defs>
          <path class="p32-shaft" d="M62 190v148M578 190v148M62 338h516" />
          <line class="p32-cover" x1="${shape.hingeX}" y1="${shape.hatchY}" x2="${shape.hingeX + shape.hatchPixels}" y2="${shape.hatchY}" />
          <g class="p32-hinge" transform="translate(${shape.hingeX} ${shape.hatchY})"><circle r="12" /><path d="M-18 15h36M-13 15l-8 10M0 15l-8 10M13 15l-8 10" /></g>
          <line class="p32-weight-arrow" x1="320" y1="118" x2="320" y2="178" marker-end="url(#p32-arrow-gold)" />
          <text class="p32-force-label is-weight" x="334" y="137">600 N</text>
          <text class="p32-dimension-label" x="320" y="176" text-anchor="middle">0.6 m</text>
          <line class="p32-pole" data-p32-pole x1="${shape.baseX.toFixed(2)}" y1="${shape.baseY.toFixed(2)}" x2="${shape.contactX.toFixed(2)}" y2="${shape.hatchY}" />
          <line class="p32-push-arrow" data-p32-push-arrow x1="${shape.arrowStartX.toFixed(2)}" y1="${shape.arrowStartY.toFixed(2)}" x2="${shape.contactX.toFixed(2)}" y2="${shape.hatchY}" marker-end="url(#p32-arrow-red)" />
          <text class="p32-force-label" data-p32-force-label x="${(shape.arrowStartX - 7).toFixed(2)}" y="${(shape.arrowStartY - 7).toFixed(2)}">500 N</text>
          <circle class="p32-contact ${lift ? "is-lifting" : ""}" data-p32-contact cx="${shape.contactX.toFixed(2)}" cy="${shape.hatchY}" r="11" />
          <line class="p32-contact-guide" data-p32-contact-guide x1="${shape.hingeX}" y1="218" x2="${shape.contactX.toFixed(2)}" y2="218" />
          <text class="p32-contact-label" data-p32-contact-label x="${((shape.hingeX + shape.contactX) / 2).toFixed(2)}" y="238" text-anchor="middle">x = ${format(state.contact, 2)} m</text>
          <path class="p32-angle-arc" data-p32-angle-arc d="M${(shape.contactX - 52).toFixed(2)} ${shape.hatchY} A52 52 0 0 0 ${(shape.contactX - 52 * Math.cos(radians(state.angle))).toFixed(2)} ${(shape.hatchY + 52 * Math.sin(radians(state.angle))).toFixed(2)}" />
          <text class="p32-angle-label" data-p32-angle-label x="${(shape.contactX - 68).toFixed(2)}" y="${shape.hatchY + 45}">${format(state.angle, 0)}°</text>
          <g class="p32-worker" data-p32-worker transform="translate(${shape.baseX.toFixed(2)} ${Math.min(315, shape.baseY + 6).toFixed(2)})" aria-hidden="true"><circle cy="-24" r="10" /><path d="M0-14v28m0-17-16 14m16-14 17 10M0 14l-13 20m13-20 14 20" /></g>
          <text class="p32-hinge-label" x="78" y="164">hinge</text>
          <text class="p32-cover-label" x="500" y="164">1.2 m cover</text>
        </svg>
        <div class="p32-moment-balance ${lift ? "is-lifting" : ""}" data-p32-moment-balance>
          <div><span>Opening moment</span><strong data-p32-live="opening-moment">${format(openingMoment(), 1)} N·m</strong></div>
          <div class="p32-balance-track" role="img" data-p32-balance-track aria-label="Opening moment ${format(openingMoment(), 1)} newton metres out of the required 360"><i style="--p32-progress:${Math.min(100, (openingMoment() / RESISTING_MOMENT) * 100).toFixed(2)}%"></i><b></b></div>
          <div><span>Closing moment</span><strong>${RESISTING_MOMENT} N·m</strong></div>
        </div>
      </div>`;
  }

  function controlMarkup() {
    const activePreset = activePresetIndex();
    return `
      <div class="p32-controls">
        <label class="p32-range-row" for="p32-contact-slider">
          <span><strong>Contact distance</strong><output data-p32-live="contact">${format(state.contact, 2)} m</output></span>
          <input id="p32-contact-slider" data-p32-slider="contact" type="range" min="0.2" max="1.2" step="0.01" value="${state.contact}" />
          <small><span>0.2 m</span><span>from hinge</span><span>1.2 m</span></small>
        </label>
        <label class="p32-range-row" for="p32-angle-slider">
          <span><strong>Pole angle</strong><output data-p32-live="angle">${format(state.angle, 0)}°</output></span>
          <input id="p32-angle-slider" data-p32-slider="angle" type="range" min="20" max="90" step="1" value="${state.angle}" />
          <small><span>20°</span><span>to cover</span><span>90°</span></small>
        </label>
        <div class="p32-presets" aria-label="Pole placement presets">
          ${presets.map((preset, index) => `<button class="chip-button p32-chip ${activePreset === index ? "active" : ""}" type="button" data-problem-action="p32-preset" data-p32-preset="${index}" aria-pressed="${activePreset === index}">${preset.label}</button>`).join("")}
        </div>
      </div>`;
  }

  function liveMetrics() {
    const lift = canLift();
    return `
      <div class="p32-metrics" aria-live="polite">
        <div><span>Perpendicular push</span><strong data-p32-live="perpendicular-force">${format(perpendicularForce(), 1)} N</strong></div>
        <div><span>Force required here</span><strong data-p32-live="required-force">${format(requiredForce(), 1)} N</strong></div>
        <div class="${lift ? "is-success" : "is-blocked"}" data-p32-status-card><span>At 500 N</span><strong data-p32-live="status">${lift ? "Cover lifts" : "Still closed"}</strong></div>
      </div>`;
  }

  function feedbackMarkup() {
    if (!state.feedback) return "";
    return `<div class="p32-feedback is-${state.feedbackTone}" role="status">${escapeAttribute(state.feedback)}</div>`;
  }

  function hintsMarkup() {
    if (!state.hintsUsed) return "";
    return `<div class="hint-stack p32-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>`;
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `
      <section class="p32-solution" aria-labelledby="p32-solution-heading">
        <h3 id="p32-solution-heading" tabindex="-1">Balance moments at the instant of lifting</h3>
        <p>Take moments about the hinge. The hinge reaction disappears from the equation, and the uniform cover’s weight acts at its midpoint.</p>
        <div class="p32-equation">closing moment = 600 × 0.6 = 360 N·m</div>
        <p>A 500 N push at distance <em>x</em> and angle 60° has perpendicular component <em>500 sin 60°</em>, so its opening moment is <em>500x sin 60°</em>.</p>
        <div class="p32-equation">500x sin 60° = 360</div>
        <div class="p32-equation is-answer">x = 360 / (500 sin 60°) = 0.48√3 ≈ 0.831 m</div>
        <p>At exactly this distance the cover is in limiting equilibrium. Any farther from the hinge gives a larger opening moment and begins to raise it.</p>
      </section>`;
  }

  function snapshot() {
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "independently reconstructed from title and difficulty only",
      coverLengthMetres: COVER_LENGTH,
      coverWeightNewtons: COVER_WEIGHT,
      workerForceLimitNewtons: FORCE_LIMIT,
      contactDistanceMetres: Number(state.contact.toFixed(4)),
      poleAngleDegrees: state.angle,
      perpendicularForceNewtons: Number(perpendicularForce().toFixed(3)),
      openingMomentNewtonMetres: Number(openingMoment().toFixed(3)),
      closingMomentNewtonMetres: RESISTING_MOMENT,
      requiredForceNewtons: Number(requiredForce().toFixed(3)),
      coverCanLift: canLift(),
      originalMinimumDistanceMetres: Number(minimumContact(ORIGINAL_ANGLE).toFixed(6)),
      estimate: state.estimate || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `
      <main class="book-shell p32-shell">
        ${warning()}
        <header class="book-header">
          <div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive statics</span></div>
          <div class="book-progress">${problemProgress(PROBLEM)}</div>
          ${problemHeaderActions(PROBLEM, resetMarkup)}
        </header>

        <div class="book-spread p32-spread">
          <article class="book-page p32-problem-page">
            <div class="problem-number">Problem 3.2</div>
            <h1 class="book-title p32-title">Sewage worker’s escape</h1>
            <div class="difficulty" aria-label="Two star difficulty">★★</div>
            <p class="problem-copy">A worker is trapped beneath a horizontal, uniform manhole cover. The cover is 1.2 m long, weighs 600 N and turns freely about a hinge at one edge.</p>
            <p class="problem-copy">The worker can push with at most 500 N through a pole held at 60° to the cover. How far from the hinge must the pole touch the cover, at minimum, for it to begin lifting?</p>
            <p class="p32-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. This is an independently written statics scenario; it is not the book’s wording or solution.</p>
            <section class="prediction-box"><div class="eyebrow">Before calculating</div><p>Moving the pole outward helps—but its full 500 N is not perpendicular to the cover. Which part of the force produces the turning effect?</p></section>
          </article>

          <section class="book-page book-stage p32-stage" aria-labelledby="p32-stage-title">
            <div class="p32-stage-card">
              <div class="p32-stage-heading"><div><span class="eyebrow">Moment laboratory</span><h2 id="p32-stage-title">Can the worker turn the cover?</h2></div><p>Move the contact point or change the pole angle. The cover lifts only when the opening moment reaches 360 N·m.</p></div>
              ${apparatusMarkup()}
              ${controlMarkup()}
              ${liveMetrics()}
            </div>
          </section>

          <aside class="book-page book-coach p32-coach">
            <div class="coach-kicker">Find the threshold</div>
            <p class="coach-question">At 60°, what is the minimum contact distance?</p>
            <form class="p32-answer-form" data-p32-answer-form novalidate>
              <label for="p32-answer">Distance from hinge</label>
              <div><input id="p32-answer" class="estimate-input" type="text" inputmode="decimal" autocomplete="off" value="${escapeAttribute(state.estimate)}" placeholder="e.g. 0.85" /><span>m</span><button class="primary-button" type="submit">Check</button></div>
            </form>
            ${feedbackMarkup()}
            <div class="button-row p32-help-row">
              <button class="secondary-button" type="button" data-problem-action="p32-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button>
              <button class="ghost-button" type="button" data-problem-action="p32-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button>
            </div>
            ${hintsMarkup()}
            ${solutionMarkup()}
            ${debugPanel("Development state", snapshot())}
          </aside>
        </div>
        ${problemNav(PROBLEM)}
      </main>`;
  }

  function updateLiveDom(root) {
    const shape = geometry();
    const lift = canLift();
    const values = {
      contact: `${format(state.contact, 2)} m`,
      angle: `${format(state.angle, 0)}°`,
      "perpendicular-force": `${format(perpendicularForce(), 1)} N`,
      "required-force": `${format(requiredForce(), 1)} N`,
      "opening-moment": `${format(openingMoment(), 1)} N·m`,
      status: lift ? "Cover lifts" : "Still closed",
    };
    Object.entries(values).forEach(([key, value]) => root.querySelectorAll(`[data-p32-live="${key}"]`).forEach((node) => { node.textContent = value; }));

    const setLine = (selector, attributes) => {
      const line = root.querySelector(selector);
      if (!line) return;
      Object.entries(attributes).forEach(([name, value]) => line.setAttribute(name, Number(value).toFixed(2)));
    };
    setLine("[data-p32-pole]", { x1: shape.baseX, y1: shape.baseY, x2: shape.contactX, y2: shape.hatchY });
    setLine("[data-p32-push-arrow]", { x1: shape.arrowStartX, y1: shape.arrowStartY, x2: shape.contactX, y2: shape.hatchY });
    setLine("[data-p32-contact-guide]", { x2: shape.contactX });

    const contact = root.querySelector("[data-p32-contact]");
    if (contact) {
      contact.setAttribute("cx", shape.contactX.toFixed(2));
      contact.setAttribute("class", `p32-contact ${lift ? "is-lifting" : ""}`);
    }
    const contactLabel = root.querySelector("[data-p32-contact-label]");
    if (contactLabel) {
      contactLabel.setAttribute("x", ((shape.hingeX + shape.contactX) / 2).toFixed(2));
      contactLabel.textContent = `x = ${format(state.contact, 2)} m`;
    }
    const forceLabel = root.querySelector("[data-p32-force-label]");
    if (forceLabel) {
      forceLabel.setAttribute("x", (shape.arrowStartX - 7).toFixed(2));
      forceLabel.setAttribute("y", (shape.arrowStartY - 7).toFixed(2));
    }
    const angleArc = root.querySelector("[data-p32-angle-arc]");
    if (angleArc) angleArc.setAttribute("d", `M${(shape.contactX - 52).toFixed(2)} ${shape.hatchY} A52 52 0 0 0 ${(shape.contactX - 52 * Math.cos(radians(state.angle))).toFixed(2)} ${(shape.hatchY + 52 * Math.sin(radians(state.angle))).toFixed(2)}`);
    const angleLabel = root.querySelector("[data-p32-angle-label]");
    if (angleLabel) {
      angleLabel.setAttribute("x", (shape.contactX - 68).toFixed(2));
      angleLabel.textContent = `${format(state.angle, 0)}°`;
    }
    const worker = root.querySelector("[data-p32-worker]");
    if (worker) worker.setAttribute("transform", `translate(${shape.baseX.toFixed(2)} ${Math.min(315, shape.baseY + 6).toFixed(2)})`);
    const description = root.querySelector("#p32-apparatus-desc");
    if (description) description.textContent = `The pole contacts the cover ${format(state.contact, 2)} metres from the hinge at ${format(state.angle, 0)} degrees. The opening moment is ${format(openingMoment(), 1)} newton metres against a closing moment of 360 newton metres. The cover ${lift ? "can begin to lift" : "remains closed"}.`;
    const balance = root.querySelector("[data-p32-moment-balance]");
    if (balance) balance.classList.toggle("is-lifting", lift);
    const balanceTrack = root.querySelector("[data-p32-balance-track]");
    if (balanceTrack) {
      balanceTrack.setAttribute("aria-label", `Opening moment ${format(openingMoment(), 1)} newton metres out of the required 360`);
      balanceTrack.querySelector("i")?.style.setProperty("--p32-progress", `${Math.min(100, (openingMoment() / RESISTING_MOMENT) * 100).toFixed(2)}%`);
    }
    const statusCard = root.querySelector("[data-p32-status-card]");
    if (statusCard) statusCard.className = lift ? "is-success" : "is-blocked";
    const activePreset = activePresetIndex();
    root.querySelectorAll('[data-problem-action="p32-preset"]').forEach((button) => {
      const active = Number(button.dataset.p32Preset) === activePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.querySelector(".p32-feedback")?.remove();
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function parseDistance(raw) {
    const normalized = String(raw).trim().toLowerCase().replaceAll(",", ".").replace(/\s*m$/, "");
    return normalized ? Number(normalized) : NaN;
  }

  function bind({ render: rerender }) {
    const root = document.querySelector(".p32-shell");
    if (!root) return;

    root.querySelector("#p32-answer")?.addEventListener("input", (event) => {
      state.estimate = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelectorAll("[data-p32-slider]").forEach((slider) => {
      slider.addEventListener("input", (event) => {
        const key = event.target.dataset.p32Slider;
        if (key === "contact") state.contact = clamp(event.target.value, 0.2, COVER_LENGTH);
        if (key === "angle") state.angle = clamp(event.target.value, 20, 90);
        state.feedback = "";
        state.committed = false;
        updateLiveDom(root);
      });
    });

    root.querySelectorAll("[data-problem-action]").forEach((control) => {
      control.addEventListener("click", () => {
        const action = control.dataset.problemAction;
        if (action === "p32-reset") state = initialState();
        if (action === "p32-preset") {
          const preset = presets[Number(control.dataset.p32Preset)];
          if (preset) {
            state.contact = preset.contact;
            state.angle = preset.angle;
            state.feedback = "";
            state.committed = false;
          }
        }
        if (action === "p32-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
        if (action === "p32-reveal") state.revealed = true;
        rerender();
        if (action === "p32-reveal") window.requestAnimationFrame(() => document.querySelector("#p32-solution-heading")?.focus());
      });
    });

    root.querySelector("[data-p32-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p32-answer")?.value || "";
      const estimate = parseDistance(raw);
      const exact = minimumContact(ORIGINAL_ANGLE);
      state.estimate = raw.trim();
      state.committed = false;
      state.feedbackTone = "neutral";
      if (!Number.isFinite(estimate) || estimate <= 0) {
        state.feedback = "Enter a positive distance in metres.";
        state.feedbackTone = "warn";
      } else if (estimate > COVER_LENGTH) {
        state.feedback = "That point lies beyond the 1.2 m cover.";
        state.feedbackTone = "warn";
      } else {
        state.committed = true;
        if (Math.abs(estimate - exact) <= 0.015) {
          state.feedback = "Exactly. About 0.831 m is the limiting position; any farther out produces enough moment to lift.";
          state.feedbackTone = "success";
          state.contact = exact;
          state.angle = ORIGINAL_ANGLE;
        } else if (Math.abs(estimate - 0.72) <= 0.015) {
          state.feedback = "That would be the threshold for a vertical 90° push. At 60°, only 500 sin 60° acts perpendicular to the cover.";
          state.feedbackTone = "warn";
        } else if (estimate > exact) {
          state.feedback = "That placement would lift the cover, but it is not the nearest possible point to the hinge.";
        } else {
          state.feedback = "That is too close to the hinge: 500x sin 60° is still below the cover’s 360 N·m closing moment.";
        }
      }
      rerender();
      window.requestAnimationFrame(() => document.querySelector("#p32-answer")?.focus());
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
})();
