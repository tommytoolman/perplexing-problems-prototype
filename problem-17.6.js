(function registerElevenCrateBottleneckPage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "17.6";
  const EDGES = Object.freeze([
    Object.freeze({ id: "sa", from: "S", to: "A", capacity: 7, label: "S → A" }),
    Object.freeze({ id: "sb", from: "S", to: "B", capacity: 5, label: "S → B" }),
    Object.freeze({ id: "ab", from: "A", to: "B", capacity: 3, label: "A → B" }),
    Object.freeze({ id: "at", from: "A", to: "T", capacity: 4, label: "A → T" }),
    Object.freeze({ id: "bt", from: "B", to: "T", capacity: 7, label: "B → T" }),
  ]);
  const ROUTES = Object.freeze([
    Object.freeze({ id: "sat", label: "S → A → T", edgeIds: Object.freeze(["sa", "at"]) }),
    Object.freeze({ id: "sbt", label: "S → B → T", edgeIds: Object.freeze(["sb", "bt"]) }),
    Object.freeze({ id: "sabt", label: "S → A → B → T", edgeIds: Object.freeze(["sa", "ab", "bt"]) }),
  ]);
  const MIN_CUT_SIDE = Object.freeze(["S", "A", "B"]);
  const hints = Object.freeze([
    "Keep every flow at or below its arrow capacity. At A and B, inflow must equal outflow.",
    "Try sending four crates along S→A→T and five along S→B→T. That gives a feasible flow of nine.",
    "The cross-link A→B can carry two more crates from S→A into the spare capacity on B→T.",
    "A feasible flow of 11 proves the maximum is at least 11. To prove it cannot be 12, separate T from S, A and B.",
    "Only A→T and B→T cross that cut. Their capacities total 4+7=11, so every flow is at most 11.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p176-reset">Reset</button>';

  function blankFlows() { return Object.fromEntries(EDGES.map((edge) => [edge.id, 0])); }

  function initialState() {
    return {
      flows: blankFlows(),
      flowMessage: "Zero flow is feasible. Add crates along complete S-to-T routes.",
      flowTone: "neutral",
      tested: false,
      foundMaximum: false,
      certificateRevealed: false,
      answer: "",
      feedback: "",
      feedbackTone: "neutral",
      committed: false,
      hintsUsed: 0,
      revealed: false,
    };
  }

  let state = initialState();

  function escapeAttribute(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function parseInteger(raw) {
    const normalized = String(raw).trim().replace(/[\s,_]/g, "");
    return /^[-+]?\d+(?:\.0+)?$/.test(normalized) ? Number(normalized) : NaN;
  }

  function edgeById(id) { return EDGES.find((edge) => edge.id === id); }

  function flowAudit(flows = state.flows) {
    const capacityViolations = EDGES.filter((edge) => !Number.isInteger(flows[edge.id]) || flows[edge.id] < 0 || flows[edge.id] > edge.capacity);
    const sourceOut = flows.sa + flows.sb;
    const sinkIn = flows.at + flows.bt;
    const aIn = flows.sa;
    const aOut = flows.ab + flows.at;
    const bIn = flows.sb + flows.ab;
    const bOut = flows.bt;
    const aBalance = aIn - aOut;
    const bBalance = bIn - bOut;
    const conserved = aBalance === 0 && bBalance === 0 && sourceOut === sinkIn;
    const feasible = capacityViolations.length === 0 && conserved;
    return { capacityViolations, sourceOut, sinkIn, aIn, aOut, bIn, bOut, aBalance, bBalance, conserved, feasible, value: feasible ? sinkIn : null };
  }

  function cutCapacity(sourceSide, edges = EDGES) {
    const side = new Set(sourceSide);
    return edges.filter((edge) => side.has(edge.from) && !side.has(edge.to)).reduce((sum, edge) => sum + edge.capacity, 0);
  }

  function enumerateCuts() {
    const intermediates = ["A", "B"];
    const cuts = [];
    for (let mask = 0; mask < 4; mask += 1) {
      const side = ["S", ...intermediates.filter((node, index) => mask & (1 << index))];
      cuts.push({ sourceSide: side, capacity: cutCapacity(side) });
    }
    return cuts.sort((left, right) => left.capacity - right.capacity || left.sourceSide.length - right.sourceSide.length);
  }

  function enumerateFeasibleFlows() {
    let maximum = -1;
    let witness = null;
    let feasibleCount = 0;
    for (let sa = 0; sa <= 7; sa += 1) {
      for (let sb = 0; sb <= 5; sb += 1) {
        for (let ab = 0; ab <= 3; ab += 1) {
          for (let at = 0; at <= 4; at += 1) {
            for (let bt = 0; bt <= 7; bt += 1) {
              const flows = { sa, sb, ab, at, bt };
              const audit = flowAudit(flows);
              if (!audit.feasible) continue;
              feasibleCount += 1;
              if (audit.value > maximum) { maximum = audit.value; witness = flows; }
            }
          }
        }
      }
    }
    return { maximum, witness, feasibleCount };
  }

  const flowSearch = Object.freeze(enumerateFeasibleFlows());
  const cutSearch = Object.freeze(enumerateCuts());
  const challenge = Object.freeze({ maximum: flowSearch.maximum, minimumCut: cutSearch[0].capacity, witness: Object.freeze({ ...flowSearch.witness }) });

  function routeRoom(route) {
    return Math.min(...route.edgeIds.map((edgeId) => edgeById(edgeId).capacity - state.flows[edgeId]));
  }

  function routeLoad(route) {
    return Math.min(...route.edgeIds.map((edgeId) => state.flows[edgeId]));
  }

  function changeRoute(routeId, amount) {
    const route = ROUTES.find((candidate) => candidate.id === routeId);
    if (!route) return;
    if (amount > 0 && routeRoom(route) < amount) {
      state.flowMessage = `${route.label} has no room for another complete crate route.`;
      state.flowTone = "warn";
      return;
    }
    if (amount < 0 && routeLoad(route) < Math.abs(amount)) {
      state.flowMessage = `${route.label} does not currently carry a whole crate to remove.`;
      state.flowTone = "warn";
      return;
    }
    route.edgeIds.forEach((edgeId) => { state.flows[edgeId] += amount; });
    const audit = flowAudit();
    state.flowMessage = `${amount > 0 ? "Added" : "Removed"} one crate on ${route.label}. ${audit.sinkIn} now reach T.`;
    state.flowTone = audit.feasible ? "neutral" : "warn";
    state.tested = false;
  }

  function loadMaximumFlow() {
    state.flows = { ...challenge.witness };
    state.foundMaximum = true;
    state.flowTone = "success";
    state.flowMessage = "Feasible 11-crate flow loaded: every junction balances and no capacity is exceeded.";
  }

  function testCurrentFlow() {
    const audit = flowAudit();
    state.tested = true;
    if (audit.capacityViolations.length) {
      state.flowTone = "warn";
      state.flowMessage = "At least one arrow exceeds its capacity. Bring every flow back within its stated limit.";
      return;
    }
    if (!audit.conserved) {
      const issues = [];
      if (audit.aBalance !== 0) issues.push(`A has ${audit.aIn} in and ${audit.aOut} out`);
      if (audit.bBalance !== 0) issues.push(`B has ${audit.bIn} in and ${audit.bOut} out`);
      state.flowTone = "warn";
      state.flowMessage = `Not yet feasible: ${issues.join("; ")}. Junction inflow must equal outflow.`;
      return;
    }
    if (audit.value === challenge.maximum) {
      state.foundMaximum = true;
      state.flowTone = "success";
      state.flowMessage = "Eleven crates reach T in a feasible flow. Now reveal the cut to certify that 12 is impossible.";
      return;
    }
    state.flowTone = "neutral";
    state.flowMessage = `Valid flow: ${audit.value} crate${audit.value === 1 ? "" : "s"}. There is still an augmenting route to explore.`;
  }

  function edgePath(edgeId) {
    return {
      sa: "M 94 169 L 260 90",
      sb: "M 94 191 L 260 270",
      ab: "M 286 118 L 286 242",
      at: "M 312 90 L 478 169",
      bt: "M 312 270 L 478 191",
    }[edgeId];
  }

  function edgeLabelPoint(edgeId) {
    return {
      sa: { x: 166, y: 112 },
      sb: { x: 166, y: 258 },
      ab: { x: 320, y: 183 },
      at: { x: 408, y: 112 },
      bt: { x: 408, y: 258 },
    }[edgeId];
  }

  function networkSvg() {
    const audit = flowAudit();
    const cutVisible = state.certificateRevealed || state.revealed;
    const edgeMarkup = EDGES.map((edge) => {
      const flow = state.flows[edge.id];
      const ratio = flow / edge.capacity;
      const point = edgeLabelPoint(edge.id);
      const cutEdge = cutVisible && ["at", "bt"].includes(edge.id);
      return `<g class="p176-edge ${flow === edge.capacity ? "is-full" : ""} ${cutEdge ? "is-cut-edge" : ""}"><path class="p176-edge-capacity" d="${edgePath(edge.id)}" pathLength="100" marker-end="url(#p176-arrow)"/><path class="p176-edge-flow" d="${edgePath(edge.id)}" pathLength="100" stroke-dasharray="${ratio * 100} 100"/><g class="p176-edge-label" transform="translate(${point.x} ${point.y})"><rect x="-27" y="-13" width="54" height="25" rx="9"/><text text-anchor="middle" y="4">${flow} / ${edge.capacity}</text></g></g>`;
    }).join("");
    const nodeMarkup = [
      { id: "S", x: 66, y: 180, label: "SOURCE", detail: `${audit.sourceOut} out`, balanced: true },
      { id: "A", x: 286, y: 78, label: "JUNCTION A", detail: `${audit.aIn} in · ${audit.aOut} out`, balanced: audit.aBalance === 0 },
      { id: "B", x: 286, y: 282, label: "JUNCTION B", detail: `${audit.bIn} in · ${audit.bOut} out`, balanced: audit.bBalance === 0 },
      { id: "T", x: 506, y: 180, label: "TERMINAL", detail: `${audit.sinkIn} in`, balanced: true },
    ].map((node) => `<g class="p176-node ${node.balanced ? "is-balanced" : "is-unbalanced"}" transform="translate(${node.x} ${node.y})"><circle r="29"/><text class="p176-node-name" text-anchor="middle" y="4">${node.id}</text><text class="p176-node-label" text-anchor="middle" y="47">${node.label}</text><text class="p176-node-detail" text-anchor="middle" y="61">${node.detail}</text></g>`).join("");
    const description = `Directed crate network. Flows over capacities are ${EDGES.map((edge) => `${edge.label}: ${state.flows[edge.id]} of ${edge.capacity}`).join("; ")}. Junction A has ${audit.aIn} in and ${audit.aOut} out. Junction B has ${audit.bIn} in and ${audit.bOut} out. ${audit.feasible ? `The flow is feasible and delivers ${audit.value}.` : "The current flow is not conserved."}${cutVisible ? " The displayed cut separates S, A and B from T and has capacity eleven." : ""}`;
    return `<svg class="p176-network ${cutVisible ? "shows-cut" : ""}" viewBox="0 0 570 360" role="img" aria-labelledby="p176-network-title p176-network-desc"><title id="p176-network-title">Interactive crate-flow network</title><desc id="p176-network-desc">${description}</desc><defs><marker id="p176-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z"/></marker></defs><rect class="p176-network-bg" x="1" y="1" width="568" height="358" rx="18"/><text class="p176-network-kicker" x="20" y="27">CRATES PER HOUR · FLOW / CAPACITY</text>${cutVisible ? '<g class="p176-cut"><path d="M 442 42 L 442 318"/><text x="433" y="39" text-anchor="end">CUT · 4 + 7 = 11</text><text x="424" y="338" text-anchor="end">{S,A,B}</text><text x="462" y="338">{T}</text></g>' : ""}<g class="p176-edges">${edgeMarkup}</g><g class="p176-nodes">${nodeMarkup}</g><g class="p176-network-status" transform="translate(20 310)"><rect width="215" height="31" rx="10"/><text x="13" y="20">${audit.feasible ? `FEASIBLE FLOW · ${audit.value} TO T` : "BALANCE THE TWO JUNCTIONS"}</text></g></svg>`;
  }

  function balanceMarkup() {
    const audit = flowAudit();
    const balanceRow = (node, incoming, outgoing, balance) => `<div class="p176-balance-row ${balance === 0 ? "is-balanced" : "is-unbalanced"}"><strong>${node}</strong><span>in ${incoming}</span><span>out ${outgoing}</span><b>${balance === 0 ? "balanced" : `${Math.abs(balance)} ${balance > 0 ? "waiting" : "missing"}`}</b></div>`;
    return `<section class="p176-balance" aria-label="Flow conservation audit" aria-live="polite"><div class="p176-balance-heading"><span>CONSERVATION AUDIT</span><strong>${audit.feasible ? "Feasible" : "Needs balancing"}</strong></div>${balanceRow("A", audit.aIn, audit.aOut, audit.aBalance)}${balanceRow("B", audit.bIn, audit.bOut, audit.bBalance)}<div class="p176-terminal-row"><span>S dispatches <strong>${audit.sourceOut}</strong></span><span>T receives <strong>${audit.sinkIn}</strong></span></div></section>`;
  }

  function certificateMarkup() {
    if (!state.certificateRevealed && !state.revealed) return "";
    return `<section class="p176-certificate" aria-labelledby="p176-certificate-heading" aria-live="polite"><div><span class="eyebrow">Optimality certificate</span><h3 id="p176-certificate-heading">Eleven below, eleven above</h3></div><div class="p176-certificate-logic"><p><strong>Lower bound.</strong> The displayed balanced flow delivers 11 crates, so the maximum is at least 11.</p><p><strong>Upper bound.</strong> The cut {S,A,B} | {T} crosses only A→T and B→T, whose capacities total 4+7=11.</p></div><div class="p176-certificate-equation">11 ≤ maximum flow ≤ cut capacity 11 &nbsp;⇒&nbsp; maximum flow = 11</div></section>`;
  }

  function dynamicMarkup() {
    return `<div class="p176-dynamic"><div class="p176-network-layout">${networkSvg()}${balanceMarkup()}</div><div class="p176-flow-message is-${state.flowTone}" role="status">${state.flowMessage}</div>${certificateMarkup()}</div>`;
  }

  function edgeControlsMarkup() {
    return `<section class="p176-edge-controls" aria-labelledby="p176-edge-controls-heading"><div class="p176-controls-heading"><div><span class="eyebrow">Direct edge controls</span><h3 id="p176-edge-controls-heading">Set each flow</h3></div><p>Capacity is enforced by each slider’s maximum. Match inflow and outflow at A and B.</p></div><div class="p176-edge-grid">${EDGES.map((edge) => `<label for="p176-${edge.id}"><span><strong>${edge.label}</strong><output data-p176-flow-output="${edge.id}">${state.flows[edge.id]} / ${edge.capacity}</output></span><input id="p176-${edge.id}" data-p176-flow="${edge.id}" type="range" min="0" max="${edge.capacity}" step="1" value="${state.flows[edge.id]}" aria-label="Flow on ${edge.label}, capacity ${edge.capacity}"/></label>`).join("")}</div></section>`;
  }

  function routeControlsMarkup() {
    return `<section class="p176-route-controls" aria-labelledby="p176-route-controls-heading"><div class="p176-controls-heading"><div><span class="eyebrow">Conservation-safe controls</span><h3 id="p176-route-controls-heading">Move one crate along a complete route</h3></div><button class="ghost-button" type="button" data-problem-action="p176-clear">Clear all flows</button></div><div class="p176-route-list">${ROUTES.map((route) => `<div class="p176-route-row"><strong>${route.label}</strong><span><button class="secondary-button" type="button" data-problem-action="p176-route" data-p176-route="${route.id}" data-p176-amount="-1" ${routeLoad(route) < 1 ? "disabled" : ""} aria-label="Remove one crate along ${route.label}">−1</button><output data-p176-route-room="${route.id}">${routeRoom(route)} more fit</output><button class="secondary-button" type="button" data-problem-action="p176-route" data-p176-route="${route.id}" data-p176-amount="1" ${routeRoom(route) < 1 ? "disabled" : ""} aria-label="Add one crate along ${route.label}">+1</button></span></div>`).join("")}</div><div class="p176-test-actions"><button class="primary-button" type="button" data-problem-action="p176-test">Test this flow</button><button class="secondary-button" type="button" data-problem-action="p176-certificate" ${state.foundMaximum || state.committed || state.revealed ? "" : "disabled"}>Reveal capacity-11 cut</button></div></section>`;
  }

  function feedbackMarkup() {
    return state.feedback ? `<div class="p176-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>` : "";
  }

  function hintsMarkup() {
    return state.hintsUsed ? `<div class="hint-stack p176-hints" aria-live="polite">${hints.slice(0, state.hintsUsed).map((hint, index) => `<div class="hint"><strong>Hint ${index + 1}.</strong> ${hint}</div>`).join("")}</div>` : "";
  }

  function solutionMarkup() {
    if (!state.revealed) return "";
    return `<section class="p176-solution" aria-labelledby="p176-solution-heading" aria-live="polite"><h3 id="p176-solution-heading">A feasible flow meets an equally small cut</h3><p>One 11-crate loading is S→A=6, S→B=5, A→B=2, A→T=4 and B→T=7. Junction A balances because 6=2+4; junction B balances because 5+2=7.</p><div class="p176-solution-equation">delivered to T = 4+7 = 11 crates per hour</div><p>Now place S, A and B on one side of a cut and T on the other. Only A→T and B→T point across it, so every possible flow is bounded above by 4+7=11.</p><div class="p176-solution-equation is-answer">feasible 11-flow + capacity-11 cut ⇒ exact maximum 11</div><p>The 12 units of capacity leaving S are not all usable: the two final arrows into T provide the smaller bottleneck.</p></section>`;
  }

  function snapshot() {
    const audit = flowAudit();
    return JSON.stringify({
      problem: PROBLEM,
      provenance: "Original extension created for this project; not present in Professor Povey's Perplexing Problems",
      model: "directed integer-capacity flow network",
      capacities: Object.fromEntries(EDGES.map((edge) => [edge.label, edge.capacity])),
      flows: Object.fromEntries(EDGES.map((edge) => [edge.label, state.flows[edge.id]])),
      conservation: { A: { in: audit.aIn, out: audit.aOut, residual: audit.aBalance }, B: { in: audit.bIn, out: audit.bOut, residual: audit.bBalance } },
      sourceOut: audit.sourceOut,
      sinkIn: audit.sinkIn,
      feasible: audit.feasible,
      flowValue: audit.value,
      capacityViolations: audit.capacityViolations.map((edge) => edge.label),
      verifiedMaximum: challenge.maximum,
      verifiedMinimumCut: challenge.minimumCut,
      minimumCutSourceSide: MIN_CUT_SIDE,
      exhaustiveFeasibleFlowCount: flowSearch.feasibleCount,
      foundMaximum: state.foundMaximum,
      certificateRevealed: state.certificateRevealed,
      answer: state.answer || null,
      committed: state.committed,
      hintsUsed: state.hintsUsed,
      solutionRevealed: state.revealed,
    }, null, 2);
  }

  function render() {
    return `<main class="book-shell p176-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Original extension · network flow</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM, resetMarkup)}</header><div class="book-spread p176-spread"><article class="book-page p176-problem-page"><div class="problem-number">Problem 17.6</div><h1 class="book-title p176-title">The Eleven-Crate Bottleneck</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div><p class="p176-extension-note">Original extension. This chapter and activity were created for this project and do not appear in Professor Povey’s Perplexing Problems.</p><p class="problem-copy">Crates travel from warehouse S to terminal T through junctions A and B. Each arrow’s capacity is the greatest whole number of crates it can carry per hour.</p><p class="problem-copy"><strong>What is the greatest flow from S to T?</strong></p><section class="p176-capacity-list" aria-label="Network capacities"><span>S→A <strong>7</strong></span><span>S→B <strong>5</strong></span><span>A→B <strong>3</strong></span><span>A→T <strong>4</strong></span><span>B→T <strong>7</strong></span></section><section class="p176-rule-card"><strong>Two rules</strong><p>Never exceed an arrow’s capacity. At each intermediate junction, total flow in must equal total flow out.</p></section></article><section class="book-page book-stage p176-stage" aria-labelledby="p176-stage-title"><div class="p176-stage-heading"><div><span class="eyebrow">Max-flow laboratory</span><h2 id="p176-stage-title">Route crates; expose the bottleneck</h2></div><p>Use complete routes to preserve conservation, or set individual edges and repair the balances yourself.</p></div>${dynamicMarkup()}${edgeControlsMarkup()}${routeControlsMarkup()}</section><aside class="book-page book-coach p176-coach"><div class="coach-kicker">Name the maximum</div><p class="coach-question">What is the exact greatest number of crates per hour that can reach T?</p><form class="p176-answer-form" data-p176-answer-form novalidate><label for="p176-answer">Maximum flow</label><div><input id="p176-answer" type="text" inputmode="numeric" autocomplete="off" value="${escapeAttribute(state.answer)}" placeholder="whole number"/><span>crates/hour</span></div><button class="primary-button" type="submit">Check maximum</button></form>${feedbackMarkup()}<div class="button-row p176-help-row"><button class="secondary-button" type="button" data-problem-action="p176-hint" ${state.hintsUsed >= hints.length ? "disabled" : ""}>${state.hintsUsed ? "Another hint" : "Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p176-reveal" ${state.revealed ? "disabled" : ""}>${state.revealed ? "Solution revealed" : "Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p176-debug">${debugPanel("Development state", snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;
  }

  function updateLiveDom(root) {
    const dynamic = root.querySelector(".p176-dynamic");
    if (dynamic) dynamic.outerHTML = dynamicMarkup();
    EDGES.forEach((edge) => {
      const output = root.querySelector(`[data-p176-flow-output="${edge.id}"]`);
      if (output) output.textContent = `${state.flows[edge.id]} / ${edge.capacity}`;
      const slider = root.querySelector(`[data-p176-flow="${edge.id}"]`);
      if (slider) {
        slider.value = String(state.flows[edge.id]);
        slider.setAttribute("aria-valuetext", `${state.flows[edge.id]} crates on ${edge.label}; capacity ${edge.capacity}`);
      }
    });
    ROUTES.forEach((route) => {
      const room = root.querySelector(`[data-p176-route-room="${route.id}"]`);
      if (room) room.textContent = `${routeRoom(route)} more fit`;
      const subtract = root.querySelector(`[data-p176-route="${route.id}"][data-p176-amount="-1"]`);
      const add = root.querySelector(`[data-p176-route="${route.id}"][data-p176-amount="1"]`);
      if (subtract) subtract.disabled = routeLoad(route) < 1;
      if (add) add.disabled = routeRoom(route) < 1;
    });
    const certificate = root.querySelector('[data-problem-action="p176-certificate"]');
    if (certificate) certificate.disabled = !(state.foundMaximum || state.committed || state.revealed);
    root.querySelectorAll(".state-surface").forEach((surface) => { surface.textContent = snapshot(); });
  }

  function renderAndFocus(renderApp, selector) {
    renderApp();
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function bind({ render: renderApp }) {
    const root = document.querySelector(".p176-shell");
    if (!root) return;

    root.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-p176-flow]");
      if (!slider) return;
      const edge = edgeById(slider.dataset.p176Flow);
      state.flows[edge.id] = Math.max(0, Math.min(edge.capacity, Math.round(Number(slider.value))));
      state.tested = false;
      state.flowTone = "neutral";
      state.flowMessage = `Adjusted ${edge.label}. Check the A and B conservation rows.`;
      updateLiveDom(root);
    });

    root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-problem-action]");
      if (!control) return;
      const action = control.dataset.problemAction;
      if (action === "p176-reset") { state = initialState(); renderAndFocus(renderApp, "#p176-sa"); return; }
      if (action === "p176-route") { changeRoute(control.dataset.p176Route, Number(control.dataset.p176Amount)); updateLiveDom(root); return; }
      if (action === "p176-clear") { state.flows = blankFlows(); state.flowMessage = "All flows cleared. Zero flow is feasible."; state.flowTone = "neutral"; state.tested = false; updateLiveDom(root); return; }
      if (action === "p176-test") { testCurrentFlow(); updateLiveDom(root); return; }
      if (action === "p176-certificate") { state.certificateRevealed = true; loadMaximumFlow(); updateLiveDom(root); return; }
      if (action === "p176-hint") state.hintsUsed = Math.min(hints.length, state.hintsUsed + 1);
      if (action === "p176-reveal") { state.revealed = true; state.certificateRevealed = true; loadMaximumFlow(); }
      renderApp();
    });

    root.querySelector("#p176-answer")?.addEventListener("input", (event) => {
      state.answer = event.target.value;
      state.feedback = "";
      state.feedbackTone = "neutral";
    });

    root.querySelector("[data-p176-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const raw = event.currentTarget.querySelector("#p176-answer")?.value || "";
      const answer = parseInteger(raw);
      state.answer = raw.trim();
      state.committed = false;
      state.feedbackTone = "warn";
      if (!Number.isFinite(answer) || answer < 0) state.feedback = "Enter one non-negative whole number of crates per hour.";
      else if (answer === challenge.maximum) {
        state.feedbackTone = "success";
        state.feedback = "Correct: 11 is achievable. Reveal the capacity-11 cut to certify that no larger flow is possible.";
        state.committed = true;
        state.foundMaximum = true;
      } else if (answer === 12) state.feedback = "Twelve can leave S, but only 4+7=11 units of capacity enter T.";
      else if (answer < challenge.maximum) state.feedback = "That flow can be improved. Use A→B to reach spare capacity on B→T.";
      else state.feedback = "Look for a cut that separates T from the other three nodes; its crossing capacity is an upper bound.";
      renderAndFocus(renderApp, "#p176-answer");
    });
  }

  window.poveyProblemPages[PROBLEM] = { render, bind };
}());
