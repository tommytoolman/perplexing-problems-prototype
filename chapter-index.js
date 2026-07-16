(function registerChapterIndex() {
  "use strict";

  const chapterOneProblems = [
    {
      number: "1.1",
      title: "Shortest walk",
      stars: "★",
      difficulty: "One star difficulty",
      teaser: "Flatten a cube to turn a bent surface route into one straight line.",
      motif: "route",
      source: "adapted",
    },
    {
      number: "1.2",
      title: "Intercontinental telephone cable",
      stars: "★",
      difficulty: "One star difficulty",
      teaser: "Lift a cable ten metres above a planet—and meet a startling cancellation.",
      motif: "orbit",
      source: "adapted",
    },
    {
      number: "1.3",
      title: "Chessboard and hoop",
      stars: "★★",
      difficulty: "Two star difficulty",
      teaser: "Move and resize a hoop to map the safe region inside a tiled floor.",
      motif: "tile",
      source: "adapted",
    },
    {
      number: "1.4",
      title: "Hexagonal tiles and hoop",
      stars: "★★",
      difficulty: "Two star difficulty",
      teaser: "Repeat the hoop experiment on a honeycomb and uncover a piecewise probability.",
      motif: "hex",
      source: "adapted",
    },
    {
      number: "1.5",
      title: "Intersecting circles",
      stars: "★★",
      difficulty: "Two star difficulty",
      teaser: "Build the overlapping lens from sectors and triangles.",
      motif: "lens",
      source: "adapted",
    },
    {
      number: "1.6",
      title: "Cube within sphere",
      stars: "★",
      difficulty: "One star difficulty",
      teaser: "Fit a cube inside a sphere by following its space diagonal.",
      motif: "cube",
      source: "adapted",
    },
    {
      number: "1.7",
      title: "Polygon inscribed within circle",
      stars: "★",
      difficulty: "One star difficulty",
      teaser: "Grow an inscribed polygon and watch its area close in on πr².",
      motif: "polygon",
      source: "adapted",
    },
    {
      number: "1.8",
      title: "Circle inscribed within polygon",
      stars: "★★★",
      difficulty: "Three star difficulty",
      teaser: "Find how many sides make a polygon almost indistinguishable from its circle.",
      motif: "polygon-outer",
      source: "adapted",
    },
    {
      number: "1.9",
      title: "Triangle inscribed within semicircle",
      stars: "★",
      difficulty: "One star difficulty",
      teaser: "Slide an apex along a semicircle and find the right angle that never changes.",
      motif: "semicircle",
      source: "adapted",
    },
    {
      number: "1.10",
      title: "Big and small tree trunks",
      stars: "★★",
      difficulty: "Two star difficulty, with a four star extension",
      extra: "extension ★★★★",
      teaser: "Stack circular trunks and hunt for every integer configuration.",
      motif: "logs",
      source: "adapted",
    },
    {
      number: "1.11",
      title: "Professor Fuddlethumbs' stamp",
      stars: "★★",
      difficulty: "Two star difficulty",
      teaser: "Rotate a rectangular stamp inside a circular boundary and search for maximum area.",
      motif: "stamp",
      source: "reconstructed",
    },
    {
      number: "1.12",
      title: "Captain Fistfulls' treasure",
      stars: "★",
      difficulty: "One star difficulty",
      teaser: "Turn two distance clues into circles and use direction to choose the treasure.",
      motif: "treasure-one",
      source: "reconstructed",
    },
    {
      number: "1.13",
      title: "Captain Fistfulls' treasure II",
      stars: "★★",
      difficulty: "Two star difficulty",
      teaser: "Change two radii to see when treasure sites vanish, touch, or split in two.",
      motif: "treasure-two",
      source: "reconstructed",
    },
    {
      number: "1.14",
      title: "Captain Fistfulls' treasure III",
      stars: "★★★",
      difficulty: "Three star difficulty",
      teaser: "Use a third distance clue—and radical axes—to force one location.",
      motif: "treasure-three",
      source: "reconstructed",
    },
    {
      number: "1.15",
      title: "The geometry of Koch Island",
      stars: "★★★★",
      difficulty: "Four star difficulty",
      teaser: "Build a coastline that diverges while the land inside it settles to a limit.",
      motif: "koch",
      source: "reconstructed",
    },
    {
      number: "1.16",
      title: "An easyish fencing problem",
      stars: "★",
      difficulty: "One star difficulty",
      teaser: "Allocate a fixed fence beside a river and find the most productive rectangle.",
      motif: "fence",
      source: "reconstructed",
    },
    {
      number: "1.17",
      title: "A hardish fencing problem",
      stars: "★★★",
      difficulty: "Three star difficulty",
      teaser: "Add a diagonal to the fence budget and prove the best shape globally.",
      motif: "fence-hard",
      source: "reconstructed",
    },
  ];

  const chapterTwoProblems = [
    { number: "2.1", title: "Human calculator", stars: "★", difficulty: "One star difficulty", teaser: "Turn an awkward product into one familiar square and a tiny subtraction.", motif: "calculator", source: "reconstructed" },
    { number: "2.2", title: "Professor Fuddlethumbs' reports", stars: "★", difficulty: "One star difficulty", teaser: "One bad observation spoils a mean—but not by the amount the professor thinks.", motif: "report", source: "reconstructed" },
    { number: "2.3", title: "More of Professor Fuddlethumbs' reports", stars: "★", difficulty: "One star difficulty", teaser: "Two averages meet. The larger class carries more weight.", motif: "weighted", source: "reconstructed" },
    { number: "2.4", title: "Ant on a cube I", stars: "★★", difficulty: "Two star difficulty", teaser: "Three coordinate changes create six shortest walks across a cube graph.", motif: "cube-paths", source: "reconstructed" },
    { number: "2.5", title: "Ant on a cube II", stars: "★★★", difficulty: "Three star difficulty", teaser: "The shortest walk takes 3 edges. Random choices raise the expected journey to 10.", motif: "cube-random", source: "reconstructed" },
    { number: "2.6", title: "Ant on a cube III", stars: "★★★★", difficulty: "Four star difficulty", teaser: "A closed tour of all 12 edges must pay a four-edge parity toll.", motif: "cube-tour", source: "reconstructed" },
    { number: "2.7", title: "A falling raindrop", stars: "★★", difficulty: "Two star difficulty", teaser: "A random drop chooses between the centre and the nearest boundary.", motif: "raindrop", source: "reconstructed" },
    { number: "2.8", title: "The Three Door Problem", stars: "★★", difficulty: "Two star difficulty", teaser: "Two doors remain—but the histories behind them are not equally likely.", motif: "doors", source: "reconstructed" },
    { number: "2.9", title: "Dr Bletchley's PIN", stars: "★★★", difficulty: "Three star difficulty", teaser: "Four intercepted attempts. Four exact reports. Only one PIN survives.", motif: "pin", source: "reconstructed" },
    { number: "2.10", title: "Mr Smith's coins", stars: "★★★", difficulty: "Three star difficulty", teaser: "Nine suspects and eighteen possible crimes encoded by three balance readings.", motif: "coins", source: "reconstructed" },
    { number: "2.11", title: "The three envelope problem", stars: "★", difficulty: "One star difficulty", teaser: "Open one envelope. The best decision depends on what you see.", motif: "envelopes", source: "reconstructed" },
    { number: "2.12", title: "A card game", stars: "★★", difficulty: "Two star difficulty", teaser: "Red earns one, black costs one. Work backwards to know when to stop.", motif: "cards", source: "reconstructed" },
  ];

  const problems = [...chapterOneProblems, ...chapterTwoProblems];

  const bookChapters = [
    { number: "1", title: "Geometry", count: 17, page: 19, live: true, summary: "Constructions, loci and optimisation" },
    { number: "2", title: "Mathematics", count: 12, page: 60, live: true, summary: "Algebra, graphs and probability" },
    { number: "3", title: "Statics", count: 9, page: 82 },
    { number: "4", title: "Dynamics and collisions", count: 7, page: 119 },
    { number: "5", title: "Circular motion", count: 7, page: 150 },
    { number: "6", title: "Simple harmonic motion", count: 5, page: 176 },
    { number: "7", title: "Mad inventions and perpetual motion", count: 6, page: 196 },
    { number: "8", title: "Kinematics", count: 3, page: 219 },
    { number: "9", title: "Electricity", count: 7, page: 228 },
    { number: "10", title: "Gravity", count: 12, page: 242 },
    { number: "11", title: "Optics", count: 5, page: 285 },
    { number: "12", title: "Heat", count: 5, page: 305 },
    { number: "13", title: "Buoyancy and hydrostatics", count: 8, page: 322 },
    { number: "14", title: "Estimation", count: 6, page: 351 },
  ];

  const chapterDetails = {
    "1": {
      title: "Geometry",
      count: 17,
      status: "10 source-backed · 7 reconstructed",
      introduction: "Flatten, slide, resize and optimise. This chapter turns geometric arguments into things you can manipulate before you formalise them.",
      heroClass: "",
    },
    "2": {
      title: "Mathematics",
      count: 12,
      status: "12 reconstructed activities",
      introduction: "Calculate, simulate and reason backwards through a collection spanning arithmetic, probability, graphs and discrete mathematics.",
      heroClass: "is-mathematics",
    },
  };

  function problemHref(number) {
    return `?variant=A&amp;problem=${number}`;
  }

  function motifMarkup(type) {
    const drawings = {
      route: '<path d="M20 70h44V24h76"/><path class="index-accent" d="M20 70 64 43 140 24"/><circle class="index-dot" cx="64" cy="43" r="5"/>',
      orbit: '<circle cx="80" cy="49" r="27"/><circle class="index-accent" cx="80" cy="49" r="37"/><path d="M80 12v13M44 49h13M103 49h13M80 73v13"/>',
      tile: '<path d="M27 17v62M66 17v62M105 17v62M144 17v62M8 33h145M8 64h145"/><circle class="index-accent" cx="85" cy="49" r="25"/><circle class="index-dot" cx="85" cy="49" r="4"/>',
      hex: '<path d="m25 48 16-27h32l16 27-16 27H41zM89 48l16-27h32l16 27-16 27h-32z"/><circle class="index-accent" cx="83" cy="48" r="28"/>',
      lens: '<circle cx="65" cy="48" r="35"/><circle cx="95" cy="48" r="35"/><path class="index-accent index-fill" d="M80 17a35 35 0 0 1 0 62 35 35 0 0 1 0-62Z"/>',
      cube: '<circle class="index-accent" cx="80" cy="48" r="40"/><path d="m51 29 39-10 22 24-9 37-39 8-22-23zM51 29l13 59M90 19l13 61M42 65l70-22"/>',
      polygon: '<circle cx="80" cy="48" r="40"/><path class="index-accent" d="m80 8 38 28-15 44H57L42 36z"/>',
      'polygon-outer': '<path d="m80 7 42 17 18 41-32 26H52L20 65l18-41z"/><circle class="index-accent" cx="80" cy="49" r="34"/>',
      semicircle: '<path d="M20 72a60 60 0 0 1 120 0M20 72h120"/><path class="index-accent" d="M20 72 91 13l49 59Z"/><path d="m83 65 9-8 8 9"/>',
      logs: '<circle cx="50" cy="60" r="29"/><circle cx="110" cy="60" r="29"/><circle class="index-accent" cx="80" cy="29" r="19"/><path d="M50 89h60"/>',
      stamp: '<circle cx="80" cy="48" r="42"/><path class="index-accent index-fill" d="m47 29 50-13 16 51-50 14z"/>',
      'treasure-one': '<circle cx="57" cy="53" r="35"/><circle cx="103" cy="53" r="35"/><path class="index-accent" d="m73 20 14 14m0-14L73 34"/><path d="M80 17V8m-5 5 5-5 5 5"/>',
      'treasure-two': '<circle cx="54" cy="49" r="32"/><circle cx="106" cy="49" r="25"/><circle class="index-dot" cx="80" cy="30" r="5"/><circle class="index-dot" cx="80" cy="68" r="5"/>',
      'treasure-three': '<circle cx="54" cy="53" r="34"/><circle cx="106" cy="53" r="37"/><circle cx="74" cy="25" r="22"/><path class="index-accent" d="m76 35 13 13m0-13L76 48"/>',
      koch: '<path d="M15 70h31l17-29 17 29 17-29 17 29h31"/><path class="index-accent" d="M32 70 80 11l48 59Z"/>',
      fence: '<path d="M21 24h118M34 25v52h92V25"/><path class="index-accent" d="M34 77h92"/><path d="m17 16 8 8-8 8m126-16-8 8 8 8"/>',
      'fence-hard': '<path d="M25 18h110v60H25z"/><path class="index-accent" d="m25 78 110-60"/><path d="M17 86h126"/>',
      calculator: '<path d="M22 49h116M80 12v72"/><circle class="index-dot" cx="52" cy="49" r="5"/><circle class="index-dot" cx="108" cy="49" r="5"/><path class="index-accent" d="m39 25 13-13 13 13m30 0 13-13 13 13"/>',
      report: '<path d="M39 10h82v76H39zM53 28h54M53 42h54M53 56h31"/><path class="index-accent" d="m88 68 9 9 20-25"/>',
      weighted: '<path d="M20 69h34V45H20zM63 69h77V20H63z"/><path class="index-accent" d="M18 78h124"/><circle class="index-dot" cx="54" cy="69" r="5"/>',
      'cube-paths': '<path d="m37 33 58-14 31 25-9 39-58 8-31-25zM37 33l22 58M95 19l22 64M28 66l98-22"/><path class="index-accent" d="M28 66 95 19l22 64"/>',
      'cube-random': '<path d="m37 33 58-14 31 25-9 39-58 8-31-25zM37 33l22 58M95 19l22 64M28 66l98-22"/><path class="index-accent" d="M28 66 59 91 117 83M28 66 95 19"/><circle class="index-dot" cx="95" cy="19" r="5"/>',
      'cube-tour': '<path d="m37 33 58-14 31 25-9 39-58 8-31-25zM37 33l22 58M95 19l22 64M28 66l98-22"/><path class="index-accent" d="m37 33 58-14 31 25-9 39-58 8-31-25z"/>',
      raindrop: '<path d="M25 12h110v72H25z"/><path class="index-accent index-fill" d="M80 22c14 18 22 29 22 40a22 22 0 0 1-44 0c0-11 8-22 22-40z"/><path d="M80 48V12M80 48h55"/>',
      doors: '<path d="M18 18h34v66H18zM63 18h34v66H63zM108 18h34v66h-34z"/><circle cx="45" cy="54" r="2"/><circle cx="90" cy="54" r="2"/><circle cx="135" cy="54" r="2"/><path class="index-accent" d="m70 42 10 10 18-24"/>',
      pin: '<rect x="25" y="25" width="24" height="42" rx="5"/><rect x="54" y="25" width="24" height="42" rx="5"/><rect x="83" y="25" width="24" height="42" rx="5"/><rect x="112" y="25" width="24" height="42" rx="5"/><path class="index-accent" d="m44 77 10 10 20-22"/>',
      coins: '<circle cx="45" cy="48" r="24"/><circle cx="80" cy="48" r="24"/><circle cx="115" cy="48" r="24"/><path class="index-accent" d="M28 82h104M42 82l16-16m60 16-16-16"/>',
      envelopes: '<path d="M20 24h120v58H20zM20 24l60 39 60-39M20 82l42-34m78 34L98 48"/><path class="index-accent" d="m72 31 8 8 8-8"/>',
      cards: '<rect x="42" y="15" width="52" height="70" rx="6" transform="rotate(-8 68 50)"/><rect class="index-accent index-fill" x="68" y="12" width="52" height="70" rx="6" transform="rotate(9 94 47)"/><path class="index-accent" d="m91 30 8 10-8 10-8-10z"/>',
    };
    return `<svg class="index-motif-svg" viewBox="0 0 160 96" aria-hidden="true">${drawings[type]}</svg>`;
  }

  function problemCard(problem) {
    const chapterTwo = problem.number.startsWith("2.");
    return `
      <a class="chapter-index-card ${problem.source === "reconstructed" ? "is-reconstructed" : ""} ${chapterTwo ? "is-chapter-two" : ""}" href="${problemHref(problem.number)}">
        <div class="chapter-index-card-top">
          <span class="chapter-index-number">${problem.number}</span>
          <span class="chapter-index-stars" aria-label="${problem.difficulty}">${problem.stars}${problem.extra ? `<small>${problem.extra}</small>` : ""}</span>
        </div>
        <div class="chapter-index-motif">${motifMarkup(problem.motif)}</div>
        <div class="chapter-index-card-copy">
          <h3>${problem.title}</h3>
          <p>${problem.teaser}</p>
        </div>
        <div class="chapter-index-card-footer">
          <span>${problem.source === "reconstructed" ? "Reconstructed activity" : "Source-backed adaptation"}</span>
          <strong>Open <span aria-hidden="true">→</span></strong>
        </div>
      </a>`;
  }

  function sectionMarkup({ chapter, source, eyebrow, title, copy, id }) {
    const matching = problems.filter((problem) => problem.number.startsWith(`${chapter}.`) && problem.source === source);
    const mathematics = chapter === "2";
    return `
      <section class="chapter-index-section ${source === "reconstructed" ? "chapter-index-reconstructed" : ""} ${mathematics ? "chapter-index-mathematics" : ""}" aria-labelledby="${id}">
        <header class="chapter-index-section-header">
          <div>
            <div class="eyebrow">${eyebrow}</div>
            <h2 id="${id}">${title}</h2>
          </div>
          <p>${copy}</p>
        </header>
        <div class="chapter-index-grid">${matching.map(problemCard).join("")}</div>
      </section>`;
  }

  function siteHeader(chapter) {
    const action = chapter
      ? '<a class="problem-nav-link chapter-index-start" href="./"><span aria-hidden="true">←</span> All chapters</a>'
      : '<a class="problem-nav-link chapter-index-start" href="?view=chapter&amp;chapter=1">Open Geometry <span aria-hidden="true">→</span></a>';
    return `
      <header class="chapter-index-header">
        <a class="chapter-index-brand" href="./"><strong>Perplexing Problems</strong><span>Interactive edition</span></a>
        <span class="chapter-index-complete"><i></i> Two chapters live</span>
        ${action}
      </header>`;
  }

  function heroFigure(label) {
    return `
      <div class="chapter-index-hero-figure" aria-hidden="true">
        <svg viewBox="0 0 520 420">
          <circle class="hero-orbit hero-orbit-one" cx="274" cy="202" r="146"/>
          <circle class="hero-orbit hero-orbit-two" cx="274" cy="202" r="105"/>
          <path class="hero-polygon" d="m274 56 139 101-53 164H188l-53-164z"/>
          <path class="hero-route" d="M74 348 227 191 448 77"/>
          <circle class="hero-node" cx="227" cy="191" r="10"/>
          <text x="315" y="375">${label}</text>
        </svg>
      </div>`;
  }

  function masterChapterCard(chapter) {
    const number = chapter.number.padStart(2, "0");
    const body = `
      <div class="master-chapter-card-top">
        <span class="master-chapter-number">${number}</span>
        <span class="master-chapter-status">${chapter.live ? "Interactive now" : "To be built"}</span>
      </div>
      <h2>${chapter.title}</h2>
      ${chapter.summary ? `<p>${chapter.summary}</p>` : '<p>Mapped from the full book contents.</p>'}
      <div class="master-chapter-card-footer">
        <span>${chapter.count} problems</span>
        <span>Book p. ${chapter.page}</span>
        <strong>${chapter.live ? "Open chapter →" : "Source outline only"}</strong>
      </div>`;
    return chapter.live
      ? `<a class="master-chapter-card is-live ${chapter.number === "2" ? "is-mathematics" : ""}" href="?view=chapter&amp;chapter=${chapter.number}">${body}</a>`
      : `<article class="master-chapter-card is-future" aria-label="Chapter ${chapter.number}, ${chapter.title}, not yet interactive">${body}</article>`;
  }

  function renderMaster() {
    return `
      <main class="chapter-index-shell master-index-shell">
        ${siteHeader(null)}
        <section class="chapter-index-hero master-index-hero">
          <div class="chapter-index-hero-copy">
            <div class="eyebrow">The complete book map</div>
            <h1>Fourteen chapters.<br><em>Two are alive.</em></h1>
            <p>This is the front door to the whole project: every chapter in the source book, the two interactive chapters available now, and a clear view of what comes next.</p>
            <div class="chapter-index-hero-actions">
              <a class="primary-button chapter-index-primary" href="#chapters">Explore all chapters</a>
              <a href="?view=chapter&amp;chapter=1">Open Geometry →</a>
            </div>
          </div>
          ${heroFigure("01 → 14")}
          <dl class="chapter-index-stats">
            <div><dt>14</dt><dd>chapters in the book</dd></div>
            <div><dt>109</dt><dd>problems in the source index</dd></div>
            <div><dt>29</dt><dd>interactive now</dd></div>
          </dl>
        </section>

        <section class="master-chapters" id="chapters" aria-labelledby="master-chapters-title">
          <header class="master-chapters-heading">
            <div><div class="eyebrow">Complete contents</div><h2 id="master-chapters-title">Choose a chapter</h2></div>
            <p>Chapters 1 and 2 open into interactive contents pages. The remaining chapters are shown as the roadmap and will become active as their content is built.</p>
          </header>
          <div class="master-chapter-grid">${bookChapters.map(masterChapterCard).join("")}</div>
        </section>

        <aside class="master-epilogue">
          <div><span>After the chapters · Book p. 367</span><strong>The Deadly Game of Puzzle Points</strong></div>
          <p>The book closes with its puzzle-points game and endnote. They are mapped here, but are not yet interactive.</p>
        </aside>

        <footer class="chapter-index-footer">
          <p><strong>An unofficial educational prototype.</strong> Original book rights remain with their respective holder.</p>
          <div><a href="?view=chapter&amp;chapter=1">Geometry contents →</a><a href="?view=chapter&amp;chapter=2">Mathematics contents →</a></div>
        </footer>
      </main>`;
  }

  function renderChapter(chapter) {
    const details = chapterDetails[chapter];
    if (!details) return renderMaster();
    const firstProblem = `${chapter}.1`;
    const sections = chapter === "1"
      ? `${sectionMarkup({ chapter: "1", source: "adapted", eyebrow: "Problems 1.1–1.10", title: "From the available chapter", copy: "Interactive adaptations of the problem statements and solutions available in the supplied source sample.", id: "index-chapter-one-adapted" })}
         ${sectionMarkup({ chapter: "1", source: "reconstructed", eyebrow: "Problems 1.11–1.17", title: "The reconstructed continuation", copy: "The sample ends at 1.10. These independently written activities follow only the listed titles and difficulty ratings—not Povey's original wording.", id: "index-chapter-one-reconstructed" })}`
      : sectionMarkup({ chapter: "2", source: "reconstructed", eyebrow: "Problems 2.1–2.12", title: "An original mathematics lab", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 2. Every activity here is independently written and explicitly labelled—not Povey's original wording or solution.", id: "index-chapter-two-reconstructed" });
    const sourceCount = chapter === "1" ? "10" : "12";
    const sourceLabel = chapter === "1" ? "source-backed adaptations" : "reconstructed activities";
    const thirdCount = chapter === "1" ? "7" : "1";
    const thirdLabel = chapter === "1" ? "labelled reconstructions" : "complete chapter";
    return `
      <main class="chapter-index-shell chapter-contents-shell ${details.heroClass}">
        ${siteHeader(chapter)}
        <section class="chapter-index-hero chapter-landing-hero ${details.heroClass}">
          <div class="chapter-index-hero-copy">
            <div class="eyebrow">Chapter ${chapter} · Interactive contents</div>
            <h1>${details.title}.<br><em>${details.count} problems.</em></h1>
            <p>${details.introduction}</p>
            <div class="chapter-index-hero-actions">
              <a class="primary-button chapter-index-primary" href="${problemHref(firstProblem)}">Start ${firstProblem}</a>
              <a href="#problems">Choose a problem ↓</a>
            </div>
          </div>
          ${heroFigure(`${chapter}.1 → ${chapter}.${details.count}`)}
          <dl class="chapter-index-stats">
            <div><dt>${details.count}</dt><dd>interactive problems</dd></div>
            <div><dt>${sourceCount}</dt><dd>${sourceLabel}</dd></div>
            <div><dt>${thirdCount}</dt><dd>${thirdLabel}</dd></div>
          </dl>
        </section>

        <header class="chapter-contents-heading ${details.heroClass}" id="problems">
          <div><span>Chapter ${chapter}</span><h2>Contents</h2></div>
          <p>${details.status}. Choose any problem, or work from the beginning.</p>
        </header>
        ${sections}

        <footer class="chapter-index-footer">
          <p><strong>An unofficial educational prototype.</strong> Original book rights remain with their respective holder.</p>
          <div><a href="./">← All chapters</a><a href="${problemHref(firstProblem)}">Start ${details.title} →</a></div>
        </footer>
      </main>`;
  }

  function render({ chapter = null } = {}) {
    return chapter ? renderChapter(chapter) : renderMaster();
  }

  window.poveyChapterIndex = { render };
})();
