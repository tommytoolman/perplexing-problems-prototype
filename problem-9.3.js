(function registerResistorSquarePage() {
  "use strict";

  window.poveyProblemPages = window.poveyProblemPages || {};

  const PROBLEM = "9.3";
  const NODE_NAMES = ["A", "B", "C", "D", "O"];
  const TERMINALS = Object.freeze({
    adjacent: Object.freeze({ source: 0, sink: 1, label: "Adjacent corners A–B" }),
    opposite: Object.freeze({ source: 0, sink: 2, label: "Opposite corners A–C" }),
    centre: Object.freeze({ source: 0, sink: 4, label: "Corner to centre A–O" }),
  });
  const CHALLENGE = Object.freeze({ edgeResistance: 120, spokeRatio: 1, terminal: "adjacent" });
  const stages = Object.freeze([
    Object.freeze({ short: "Symmetry", title: "Choose terminals before claiming symmetry", copy: "Changing the source and sink changes which reflections preserve the boundary conditions. Equipotential nodes depend on that choice." }),
    Object.freeze({ short: "Nodal solve", title: "Let every internal node satisfy KCL", copy: "Set the source to 1 V and sink to 0 V. Solve the remaining node potentials from the conductance matrix." }),
    Object.freeze({ short: "Equivalent R", title: "Sum the source current", copy: "With a 1 V test source, Req=1/Isource. A power audit independently checks the current and nodal solution." }),
  ]);
  const hints = Object.freeze([
    "For the challenge set VA=1 and VB=0. The adjacent-terminal antisymmetry gives VO=1/2 and VD=1−VC.",
    "At node C, the three equal branches lead to B, D and O: 3VC=VB+VD+VO.",
    "Substitute VB=0, VD=1−VC and VO=1/2. This gives VC=3/8 and VD=5/8.",
    "The source current is I=(VA−VB)/R+(VA−VD)/R+(VA−VO)/R=(15/8)/R.",
    "Therefore Req=1/I=8R/15. Use R=120 Ω.",
  ]);
  const resetMarkup = '<button class="ghost-button" type="button" data-problem-action="p93-reset">Reset</button>';

  const initialState = () => ({
    edgeResistance: CHALLENGE.edgeResistance,
    spokeRatio: CHALLENGE.spokeRatio,
    spokeMode: "finite",
    terminal: CHALLENGE.terminal,
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
    if (value === Infinity) return "∞";
    if (!Number.isFinite(value)) return "—";
    const rounded = Number(value).toFixed(digits);
    return Object.is(Number(rounded), -0) ? Number(0).toFixed(digits) : rounded;
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

  function physicalEdges(edgeResistance = state.edgeResistance, spokeRatio = state.spokeRatio, spokeMode = state.spokeMode) {
    const edges = [
      { a: 0, b: 1, resistance: edgeResistance, type: "edge", key: "AB" },
      { a: 1, b: 2, resistance: edgeResistance, type: "edge", key: "BC" },
      { a: 2, b: 3, resistance: edgeResistance, type: "edge", key: "CD" },
      { a: 3, b: 0, resistance: edgeResistance, type: "edge", key: "DA" },
    ];
    if (spokeMode === "finite") {
      [0,1,2,3].forEach((corner) => edges.push({ a: corner, b: 4, resistance: spokeRatio * edgeResistance, type: "spoke", key: `${NODE_NAMES[corner]}O` }));
    }
    return edges;
  }

  function componentFrom(start, edges) {
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const node = queue.shift();
      edges.forEach((edge) => {
        if (edge.a !== node && edge.b !== node) return;
        const other = edge.a === node ? edge.b : edge.a;
        if (!visited.has(other)) { visited.add(other); queue.push(other); }
      });
    }
    return visited;
  }

  function gaussianSolve(matrix, vector) {
    const size = vector.length;
    const a = matrix.map((row, index) => [...row, vector[index]]);
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
      [a[column], a[pivot]] = [a[pivot], a[column]];
      const scale = a[column][column];
      if (Math.abs(scale) < 1e-14) throw new Error("Singular conductance system");
      for (let j = column; j <= size; j += 1) a[column][j] /= scale;
      for (let row = 0; row < size; row += 1) {
        if (row === column) continue;
        const factor = a[row][column];
        for (let j = column; j <= size; j += 1) a[row][j] -= factor * a[column][j];
      }
    }
    return a.map((row) => row[size]);
  }

  function solveNetwork() {
    const terminal = TERMINALS[state.terminal];
    if (state.spokeMode === "short") {
      return { equivalentResistance: 0, sourceCurrent: Infinity, potentials: [null,null,null,null,null], currents: [], power: Infinity, powerResidual: null, kclResidual: null, connected: true, shorted: true };
    }
    const edges = physicalEdges();
    const sourceComponent = componentFrom(terminal.source, edges);
    const connected = sourceComponent.has(terminal.sink);
    if (!connected) {
      const potentials = NODE_NAMES.map((_, node) => sourceComponent.has(node) ? 1 : node === terminal.sink ? 0 : 0.5);
      return { equivalentResistance: Infinity, sourceCurrent: 0, potentials, currents: edges.map((edge) => ({ ...edge, current: 0 })), power: 0, powerResidual: 0, kclResidual: 0, connected: false, shorted: false };
    }
    const potentials = Array(5).fill(0.5);
    potentials[terminal.source] = 1;
    potentials[terminal.sink] = 0;
    const unknownNodes = [...sourceComponent].filter((node) => node !== terminal.source && node !== terminal.sink);
    if (unknownNodes.length) {
      const matrix = Array.from({ length: unknownNodes.length }, () => Array(unknownNodes.length).fill(0));
      const vector = Array(unknownNodes.length).fill(0);
      unknownNodes.forEach((node, row) => {
        edges.forEach((edge) => {
          if (edge.a !== node && edge.b !== node) return;
          const other = edge.a === node ? edge.b : edge.a;
          const conductance = 1 / edge.resistance;
          matrix[row][row] += conductance;
          const column = unknownNodes.indexOf(other);
          if (column >= 0) matrix[row][column] -= conductance;
          else vector[row] += conductance * potentials[other];
        });
      });
      const solution = gaussianSolve(matrix, vector);
      unknownNodes.forEach((node, index) => { potentials[node] = solution[index]; });
    }
    const currents = edges.map((edge) => ({ ...edge, current: (potentials[edge.a] - potentials[edge.b]) / edge.resistance }));
    const sourceCurrent = currents.reduce((sum, edge) => {
      if (edge.a === terminal.source) return sum + edge.current;
      if (edge.b === terminal.source) return sum - edge.current;
      return sum;
    }, 0);
    const equivalentResistance = 1 / sourceCurrent;
    const power = currents.reduce((sum, edge) => sum + edge.current ** 2 * edge.resistance, 0);
    let kclResidual = 0;
    unknownNodes.forEach((node) => {
      const residual = currents.reduce((sum, edge) => edge.a === node ? sum + edge.current : edge.b === node ? sum - edge.current : sum, 0);
      kclResidual = Math.max(kclResidual, Math.abs(residual));
    });
    return { equivalentResistance, sourceCurrent, potentials, currents, power, powerResidual: power - sourceCurrent, kclResidual, connected, shorted: false };
  }

  function modeLabel() {
    if (state.spokeMode === "open") return "open centre spokes";
    if (state.spokeMode === "short") return "shorted centre spokes";
    return `spokes = ${clean(state.spokeRatio,2)}R`;
  }

  function reconstructionNote() {
    return `<p class="p93-reconstruction-note"><strong>Reconstructed activity.</strong> The available source preserves this problem’s title and difficulty only. The activity below is an original exercise inspired by that title; it is not the book’s wording or solution.</p>`;
  }

  function stageControls() {
    return `<div class="p93-stage-controls" role="group" aria-label="Resistor network solution stages">${stages.map((stage,index)=>`<button class="secondary-button ${state.stage===index?"active":""}" type="button" data-problem-action="p93-stage" data-p93-stage="${index}" aria-pressed="${state.stage===index}"><span>${index+1}</span>${stage.short}</button>`).join("")}</div>`;
  }

  function stageHeading() {
    const stage=stages[state.stage];
    return `<div class="p93-stage-heading"><div><div class="eyebrow">Stage ${state.stage+1} of 3</div><h2>${stage.title}</h2></div><p>${stage.copy}</p><button class="ghost-button" type="button" data-problem-action="p93-next-stage" ${state.stage>=2?"disabled":""}>${state.stage>=2?"Network solved":"Next stage"}</button></div>`;
  }

  const NODE_POSITIONS = Object.freeze([
    Object.freeze({ x: 145, y: 78 }), Object.freeze({ x: 455, y: 78 }), Object.freeze({ x: 455, y: 324 }), Object.freeze({ x: 145, y: 324 }), Object.freeze({ x: 300, y: 201 }),
  ]);

  function resistorPath(a, b) {
    const start=NODE_POSITIONS[a],end=NODE_POSITIONS[b],dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,px=-uy,py=ux,lead=27;
    const points=[`M${clean(start.x,2)} ${clean(start.y,2)}`,`L${clean(start.x+ux*lead,2)} ${clean(start.y+uy*lead,2)}`];
    for(let index=1;index<10;index+=1){const distance=lead+(length-2*lead)*index/10,offset=index%2?7:-7;points.push(`L${clean(start.x+ux*distance+px*offset,2)} ${clean(start.y+uy*distance+py*offset,2)}`);}
    points.push(`L${clean(end.x-ux*lead,2)} ${clean(end.y-uy*lead,2)}`,`L${clean(end.x,2)} ${clean(end.y,2)}`);return points.join(" ");
  }

  function potentialColour(value) {
    if (value === null) return "#777777";
    const low=[40,111,143],high=[180,77,53],v=clamp(value,0,1);
    return `rgb(${low.map((channel,index)=>Math.round(channel+(high[index]-channel)*v)).join(",")})`;
  }

  function edgeMarkup(edge, solution, displayMode = state.spokeMode) {
    const start=NODE_POSITIONS[edge.a],end=NODE_POSITIONS[edge.b],dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,px=-uy,py=ux;
    const currentRecord=solution.currents.find((candidate)=>candidate.key===edge.key);
    const current=currentRecord?.current||0;
    const direction=current>=0?1:-1;
    const arrowStart={x:start.x+dx*.42,y:start.y+dy*.42},arrowEnd={x:start.x+dx*.58,y:start.y+dy*.58};
    if(direction<0)[arrowStart.x,arrowEnd.x]=[arrowEnd.x,arrowStart.x],[arrowStart.y,arrowEnd.y]=[arrowEnd.y,arrowStart.y];
    const label=edge.type==="edge"?`${clean(state.edgeResistance,0)} Ω`:displayMode==="open"?"open":displayMode==="short"?"short":`${clean(state.spokeRatio*state.edgeResistance,1)} Ω`;
    return `<g class="p93-branch is-${edge.type} is-${displayMode}"><path d="${resistorPath(edge.a,edge.b)}"/><text x="${clean((start.x+end.x)/2+px*15,2)}" y="${clean((start.y+end.y)/2+py*15,2)}" text-anchor="middle">${label}</text>${!solution.shorted&&displayMode!=="open"&&Math.abs(current)>1e-10?`<line class="p93-current-arrow" x1="${clean(arrowStart.x,2)}" y1="${clean(arrowStart.y,2)}" x2="${clean(arrowEnd.x,2)}" y2="${clean(arrowEnd.y,2)}" marker-end="url(#p93-arrow)"/><text class="p93-current-label" x="${clean((arrowStart.x+arrowEnd.x)/2+px*28,2)}" y="${clean((arrowStart.y+arrowEnd.y)/2+py*28,2)}">${clean(Math.abs(current)*1000,2)} mA</text>`:""}</g>`;
  }

  function networkSvg() {
    const solution=solveNetwork(),terminal=TERMINALS[state.terminal];
    const squareEdges=physicalEdges(state.edgeResistance,state.spokeRatio,"open");
    const spokeResistance=state.spokeMode==="finite"?state.spokeRatio*state.edgeResistance:state.spokeMode==="open"?Infinity:0;
    const displaySpokes=[0,1,2,3].map(corner=>({a:corner,b:4,resistance:spokeResistance,type:"spoke",key:`${NODE_NAMES[corner]}O`}));
    const resultText=solution.equivalentResistance===Infinity?"∞ Ω":`${clean(solution.equivalentResistance,3)} Ω`;
    return `<svg class="p93-svg p93-stage-${state.stage} is-${state.spokeMode}" viewBox="0 0 720 430" role="img" aria-labelledby="p93-svg-title p93-svg-desc"><title id="p93-svg-title">Square resistor network with four centre spokes</title><desc id="p93-svg-desc">Four ${clean(state.edgeResistance,1)} ohm edge resistors form a square. ${modeLabel()}. Test terminals are ${TERMINALS[state.terminal].label}. Equivalent resistance is ${resultText}.</desc><defs><marker id="p93-arrow" markerWidth="8" markerHeight="8" refX="6.8" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L8 4 L0 8 Z"/></marker><linearGradient id="p93-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5edf0"/><stop offset="1" stop-color="#f6efdd"/></linearGradient></defs><rect width="720" height="430" fill="url(#p93-bg)"/><g class="p93-network" aria-hidden="true">${squareEdges.map(edge=>edgeMarkup(edge,solution,"finite")).join("")}${displaySpokes.map(edge=>edgeMarkup(edge,solution,state.spokeMode)).join("")}${NODE_POSITIONS.map((position,node)=>`<g class="p93-node ${node===terminal.source?"is-source":""} ${node===terminal.sink?"is-sink":""}" transform="translate(${position.x} ${position.y})"><circle r="24" fill="${potentialColour(solution.potentials[node])}"/><text class="p93-node-name" y="-2">${NODE_NAMES[node]}</text><text class="p93-potential" y="13">${solution.potentials[node]===null?"—":`${clean(solution.potentials[node],3)} V`}</text></g>`).join("")}</g>
      <g class="p93-test-source" aria-hidden="true"><path d="M88 111V287"/><circle cx="88" cy="175" r="17"/><text x="88" y="179" text-anchor="middle">1 V</text><text x="53" y="309">${terminal.label}</text></g>
      <g class="p93-result" transform="translate(511 61)"><rect width="181" height="112" rx="15"/><text class="p93-result-kicker" x="15" y="24">EQUIVALENT RESISTANCE</text><text class="p93-result-value" x="15" y="55">${resultText}</text><text class="p93-result-note" x="15" y="78">Isource ${solution.sourceCurrent===Infinity?"∞":`${clean(solution.sourceCurrent*1000,3)} mA`}</text><text class="p93-result-note" x="15" y="97">${modeLabel()}</text></g>
      <g class="p93-symmetry-layer" aria-hidden="true"><rect x="510" y="195" width="182" height="109" rx="14"/><text class="p93-panel-kicker" x="526" y="219">TERMINAL-DEPENDENT SYMMETRY</text><text class="p93-panel-value" x="526" y="245">${state.terminal==="opposite"?"VB=VD=VO=½ V":state.terminal==="adjacent"?"VO=½ V · VD=1−VC":"VB=VD by reflection"}</text><text class="p93-panel-note" x="526" y="272">Choose terminals first.</text><text class="p93-panel-note" x="526" y="289">Then merge only proven equipotentials.</text></g>
      <g class="p93-nodal-layer" aria-hidden="true"><rect x="510" y="195" width="182" height="109" rx="14"/><text class="p93-panel-kicker" x="526" y="219">NODAL AUDIT</text><text class="p93-panel-value" x="526" y="245">max KCL residual</text><text class="p93-panel-value" x="526" y="265">${solution.kclResidual===null?"undefined":`${solution.kclResidual.toExponential(1)} A`}</text><text class="p93-panel-note" x="526" y="289">1 V source · sink at 0 V</text></g>
      <g class="p93-power-layer" aria-hidden="true"><rect x="510" y="195" width="182" height="109" rx="14"/><text class="p93-panel-kicker" x="526" y="219">INDEPENDENT POWER CHECK</text><text class="p93-panel-value" x="526" y="245">VI = Σ I²R</text><text class="p93-panel-value" x="526" y="265">residual ${solution.powerResidual===null?"—":`${solution.powerResidual.toExponential(1)} W`}</text><text class="p93-panel-note" x="526" y="289">Req=V²/P with V=1 V</text></g>
    </svg>`;
  }

  function metricsMarkup(){const s=solveNetwork();return `<section class="p93-metrics" aria-label="Resistor network calculations"><div><span>Terminal choice</span><strong>${TERMINALS[state.terminal].label}</strong></div><div><span>Equivalent resistance</span><strong>${clean(s.equivalentResistance,4)} Ω</strong></div><div><span>1 V source current</span><strong>${s.sourceCurrent===Infinity?"∞ A":`${clean(s.sourceCurrent*1000,4)} mA`}</strong></div><div><span>Maximum KCL residual</span><strong>${s.kclResidual===null?"—":`${s.kclResidual.toExponential(1)} A`}</strong></div><div><span>Power dissipated</span><strong>${s.power===Infinity?"∞ W":`${clean(s.power,6)} W`}</strong></div><div><span>Power-audit residual</span><strong>${s.powerResidual===null?"—":`${s.powerResidual.toExponential(1)} W`}</strong></div><p>${s.shorted?"Ideal shorted spokes force Req=0; individual zero-resistance branch currents are indeterminate.":s.connected?"Nodal solution, source-current calculation and dissipated-power calculation agree.":"The selected terminals lie in disconnected components, so Req is infinite."}</p></section>`;}
  function dynamicMarkup(){return `<div class="p93-dynamic">${networkSvg()}${metricsMarkup()}</div>`;}
  function controlsMarkup(){return `<section class="p93-controls" aria-label="Resistor network controls"><label for="p93-edge"><span>Square edge resistance R<output data-p93-live="edge">${clean(state.edgeResistance,0)} Ω</output></span><input id="p93-edge" type="range" min="20" max="300" step="5" value="${state.edgeResistance}"/></label><label for="p93-ratio"><span>Finite spoke ratio q=Rspoke/R<output data-p93-live="ratio">${state.spokeMode==="finite"?clean(state.spokeRatio,2):state.spokeMode==="open"?"open · ∞":"short · 0"}</output></span><input id="p93-ratio" type="range" min="0.05" max="8" step="0.05" value="${state.spokeRatio}"/></label><div class="p93-terminal-picker" role="group" aria-label="Test terminal choice">${Object.entries(TERMINALS).map(([key,value])=>`<button class="chip-button ${state.terminal===key?"active":""}" type="button" data-problem-action="p93-terminal" data-p93-terminal="${key}" aria-pressed="${state.terminal===key}">${value.label}</button>`).join("")}</div><div class="p93-mode-picker" role="group" aria-label="Centre spoke limit"><button class="chip-button ${state.spokeMode==="finite"?"active":""}" type="button" data-problem-action="p93-mode" data-p93-mode="finite">Finite q</button><button class="chip-button ${state.spokeMode==="open"?"active":""}" type="button" data-problem-action="p93-mode" data-p93-mode="open">Open spokes</button><button class="chip-button ${state.spokeMode==="short"?"active":""}" type="button" data-problem-action="p93-mode" data-p93-mode="short">Short spokes</button></div></section>`;}

  function feedbackMarkup(){return state.feedback?`<div class="math2-feedback is-${state.feedbackTone}" role="status">${state.feedback}</div>`:"";}
  function hintsMarkup(){return state.hintsUsed?`<div class="hint-stack p93-hints">${hints.slice(0,state.hintsUsed).map((hint,index)=>`<div class="hint"><strong>Hint ${index+1}.</strong> ${hint}</div>`).join("")}</div>`:"";}
  function solutionMarkup(){if(!state.revealed)return"";return `<section class="p93-solution" aria-labelledby="p93-solution-heading"><h3 id="p93-solution-heading" tabindex="-1">Adjacent terminals break the obvious square symmetry</h3><p>Apply a 1 V test source with VA=1 and VB=0. With every edge and spoke equal to R, the adjacent-terminal antisymmetry gives</p><div class="p93-equation">VO=½, &nbsp; VD=1−VC</div><p>KCL at C is</p><div class="p93-equation">3VC=VB+VD+VO=0+(1−VC)+½</div><p>Hence VC=3/8 and VD=5/8. The source current is the sum through AB, AD and AO:</p><div class="p93-equation">I=(1/R)[(1−0)+(1−5/8)+(1−1/2)]<br>I=15/(8R)</div><p>Therefore</p><div class="p93-equation">Req=1/I=8R/15=8(120)/15=64 Ω</div><p class="p93-limits"><strong>Checks.</strong> With q=1, the same nodal solver gives 2R/3=80 Ω between opposite corners and 7R/15=56 Ω from a corner to the centre. As q→∞ the spokes open: adjacent corners give 3R/4, opposite corners give R, and the centre is disconnected. As q→0 all corners are shorted through O and every terminal pair has Req→0. Conductance has units siemens, nodal currents amperes and V/I ohms. For every finite connected case, ΣI²R equals VI and internal KCL residuals vanish.</p></section>`;}
  function snapshot(){const s=solveNetwork();return JSON.stringify({problem:PROBLEM,reconstruction:true,edgeResistanceOhms:state.edgeResistance,spokeMode:state.spokeMode,finiteSpokeRatio:state.spokeRatio,terminalChoice:state.terminal,equivalentResistanceOhms:Number.isFinite(s.equivalentResistance)?Number(s.equivalentResistance.toFixed(8)):null,sourceCurrentAmperes:Number.isFinite(s.sourceCurrent)?Number(s.sourceCurrent.toFixed(10)):null,nodePotentialsVolts:s.potentials.map(value=>value===null?null:Number(value.toFixed(8))),branchCurrentsAmperes:s.currents.map(edge=>({branch:edge.key,current:Number(edge.current.toFixed(10))})),maximumKclResidualAmperes:s.kclResidual,powerWatts:Number.isFinite(s.power)?Number(s.power.toFixed(10)):null,powerResidualWatts:s.powerResidual,connected:s.connected,idealShort:s.shorted,stage:state.stage+1,committed:state.committed,hintsUsed:state.hintsUsed,solutionRevealed:state.revealed},null,2);}

  function render(){return `<main class="book-shell p93-shell">${warning()}<header class="book-header"><div class="book-brand"><strong>Perplexing Problems</strong><span class="eyebrow">Interactive circuit networks</span></div><div class="book-progress">${problemProgress(PROBLEM)}</div>${problemHeaderActions(PROBLEM,resetMarkup)}</header><div class="book-spread p93-spread"><article class="book-page p93-problem-page"><div class="problem-number">Problem 9.3</div><h1 class="book-title p93-title">Resistor square</h1><div class="difficulty" aria-label="Four star difficulty">★★★★</div>${reconstructionNote()}<p class="problem-copy">Four 120 Ω resistors form the edges AB, BC, CD and DA of a square. A centre node O is joined to every corner by another 120 Ω resistor.</p><p class="problem-copy">Find the equivalent resistance between adjacent corners A and B. Then explore why choosing opposite or centre terminals changes the useful symmetry.</p><section class="p93-test-card"><strong>Test-source method</strong><p>Apply 1 V between the selected terminals, solve internal node potentials by KCL, sum the source current, then use Req=1 V/I.</p></section><section class="p93-warning-card"><div class="eyebrow">Symmetry warning</div><p>Geometric symmetry alone is insufficient. A transformation is useful only if it also preserves which nodes are fixed at source and sink potentials.</p></section></article><section class="book-page book-stage p93-stage">${stageControls()}${stageHeading()}${dynamicMarkup()}${controlsMarkup()}</section><aside class="book-page book-coach p93-coach"><div class="coach-kicker">Solve the adjacent case</div><p class="coach-question">When all eight resistors are 120 Ω, what is the equivalent resistance between A and B?</p><form class="p93-answer-form" data-p93-answer-form novalidate><label for="p93-answer">Equivalent resistance</label><div><input id="p93-answer" type="text" inputmode="decimal" value="${escapeAttribute(state.answer)}" placeholder="resistance" autocomplete="off"/><span>Ω</span></div><button class="primary-button" type="submit">Check network</button></form>${feedbackMarkup()}<div class="button-row p93-help-row"><button class="secondary-button" type="button" data-problem-action="p93-hint" ${state.hintsUsed>=hints.length?"disabled":""}>${state.hintsUsed?"Another hint":"Give me a hint"}</button><button class="ghost-button" type="button" data-problem-action="p93-reveal" ${state.revealed?"disabled":""}>${state.revealed?"Solution revealed":"Reveal solution"}</button></div>${hintsMarkup()}${solutionMarkup()}<div class="p93-debug">${debugPanel("Development state",snapshot())}</div></aside></div>${problemNav(PROBLEM)}</main>`;}

  function updateDynamicDom(){const root=document.querySelector(".p93-shell");if(!root)return;const dynamic=root.querySelector(".p93-dynamic");if(dynamic)dynamic.outerHTML=dynamicMarkup();root.querySelectorAll('[data-p93-live="edge"]').forEach(node=>{node.textContent=`${clean(state.edgeResistance,0)} Ω`;});root.querySelectorAll('[data-p93-live="ratio"]').forEach(node=>{node.textContent=state.spokeMode==="finite"?clean(state.spokeRatio,2):state.spokeMode==="open"?"open · ∞":"short · 0";});root.querySelector("#p93-edge")?.setAttribute("aria-valuetext",`Edge resistance ${clean(state.edgeResistance,0)} ohms; equivalent ${clean(solveNetwork().equivalentResistance,2)} ohms`);root.querySelector("#p93-ratio")?.setAttribute("aria-valuetext",`Spoke ratio ${state.spokeMode==="finite"?clean(state.spokeRatio,2):state.spokeMode}`);root.querySelectorAll("[data-p93-mode]").forEach(button=>{button.classList.toggle("active",button.dataset.p93Mode===state.spokeMode);button.setAttribute("aria-pressed",String(button.dataset.p93Mode===state.spokeMode));});}
  function renderAndFocus(renderApp,selector){renderApp();window.requestAnimationFrame(()=>document.querySelector(selector)?.focus());}
  function bind({render:renderApp}){document.querySelectorAll("[data-problem-action]").forEach(control=>control.addEventListener("click",()=>{const action=control.dataset.problemAction;if(action==="p93-reset"){state=initialState();renderAndFocus(renderApp,"#p93-edge");return;}if(action==="p93-stage"){state.stage=clamp(Number(control.dataset.p93Stage),0,2);renderAndFocus(renderApp,`[data-p93-stage="${state.stage}"]`);return;}if(action==="p93-next-stage"){state.stage=Math.min(2,state.stage+1);renderAndFocus(renderApp,`[data-p93-stage="${state.stage}"]`);return;}if(action==="p93-terminal"){state.terminal=control.dataset.p93Terminal;renderAndFocus(renderApp,`[data-p93-terminal="${state.terminal}"]`);return;}if(action==="p93-mode"){state.spokeMode=control.dataset.p93Mode;renderAndFocus(renderApp,`[data-p93-mode="${state.spokeMode}"]`);return;}if(action==="p93-hint")state.hintsUsed=Math.min(hints.length,state.hintsUsed+1);if(action==="p93-reveal"){state.revealed=true;state.stage=2;}renderApp();if(action==="p93-reveal")window.requestAnimationFrame(()=>document.querySelector("#p93-solution-heading")?.focus());}));document.querySelector("#p93-edge")?.addEventListener("input",event=>{state.edgeResistance=clamp(Number(event.target.value),20,300);updateDynamicDom();});document.querySelector("#p93-ratio")?.addEventListener("input",event=>{state.spokeRatio=clamp(Number(event.target.value),.05,8);state.spokeMode="finite";updateDynamicDom();});const input=document.querySelector("#p93-answer");input?.addEventListener("input",event=>{state.answer=sanitizeNumber(event.target.value);});document.querySelector("[data-p93-answer-form]")?.addEventListener("submit",event=>{event.preventDefault();state.answer=sanitizeNumber(input?.value).trim();const answer=Number(state.answer);state.feedbackTone="warn";state.committed=false;if(!state.answer||!Number.isFinite(answer))state.feedback="Enter one resistance in ohms.";else if(Math.abs(answer-80)<.05)state.feedback="That is the opposite-corner result. Adjacent A–B terminals preserve a different symmetry and give different internal potentials.";else if(Math.abs(answer-64)>.03)state.feedback="Apply 1 V from A to B, solve C, D and O by KCL, then invert the total current leaving A.";else{state.feedbackTone="success";state.committed=true;state.stage=2;state.feedback="Correct: Req=8R/15=64 Ω. The 1 V test source supplies 15.625 mA.";}renderAndFocus(renderApp,"#p93-answer");});}
  window.poveyProblemPages[PROBLEM]={render,bind};
}());
