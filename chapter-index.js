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

  const chapterThreeProblems = [
    { number: "3.1", title: "Sewage worker’s conundrum", stars: "★", difficulty: "One star difficulty", teaser: "Walk along an overhanging plank and watch the support reactions trade places at the tipping point.", motif: "sewer-plank", source: "reconstructed" },
    { number: "3.2", title: "Sewage worker’s escape", stars: "★★", difficulty: "Two star difficulty", teaser: "Choose where to push a heavy hinged cover so your moment is just large enough to open it.", motif: "sewer-cover", source: "reconstructed" },
    { number: "3.3", title: "Sewage worker’s resolution", stars: "★★★", difficulty: "Three star difficulty", teaser: "Raise the same cover with a winch and find the last safe angle before the cable fails.", motif: "sewer-winch", source: "reconstructed" },
    { number: "3.4", title: "Aztec stone movers", stars: "★★", difficulty: "Two star difficulty", teaser: "Move the fulcrum and lengthen a lever until four movers can lift a 24 kN stone.", motif: "stone-rollers", source: "reconstructed" },
    { number: "3.5", title: "The Wheel Wars I", stars: "★★★", difficulty: "Three star difficulty", teaser: "Pit two wheels against one another and decide which torque wins at their point of contact.", motif: "wheel-torque", source: "reconstructed" },
    { number: "3.6", title: "The Wheel Wars II", stars: "★★", difficulty: "Two star difficulty", teaser: "Add grip limits to the wheel duel and find when a promised torque only produces slip.", motif: "wheel-grip", source: "reconstructed" },
    { number: "3.7", title: "Obelisk raiser", stars: "★★", difficulty: "Two star difficulty", teaser: "Haul a uniform obelisk upright while its weight and cable fight about the pivot.", motif: "obelisk-rise", source: "reconstructed" },
    { number: "3.8", title: "Obelisk razer", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Reverse the operation and design a controlled lowering that never overloads the rope.", motif: "obelisk-fall", source: "reconstructed" },
    { number: "3.9", title: "The Ravine of (Not Quite) Certain Death", stars: "★★★", difficulty: "Three star difficulty", teaser: "Cross a loaded beam over a ravine without losing either support—or your equilibrium.", motif: "ravine", source: "reconstructed" },
  ];

  const chapterFourProblems = [
    { number: "4.1", title: "Pulleys", stars: "★", difficulty: "One star difficulty", teaser: "Change two masses and watch an ideal Atwood machine reveal its acceleration and rope tension.", motif: "pulley", source: "reconstructed" },
    { number: "4.2", title: "Dr Lightspeed’s elastotennis match", stars: "★★", difficulty: "Two star difficulty", teaser: "Ride with the centre of mass to reverse an elastic collision and fire the ball back across court.", motif: "elastotennis", source: "reconstructed" },
    { number: "4.3", title: "Accelerating matchbox", stars: "★★★", difficulty: "Three star difficulty", teaser: "Accelerate a box beneath a small load and map the thresholds between rest, slip and lost contact.", motif: "matchbox", source: "reconstructed" },
    { number: "4.4", title: "The last flight of Monsieur Canard", stars: "★★", difficulty: "Two star difficulty", teaser: "Follow a final flight into impact and use impulse to separate speed from stopping force.", motif: "flight-impact", source: "reconstructed" },
    { number: "4.5", title: "Water-powered funicular", stars: "★", difficulty: "One star difficulty", teaser: "Add water to one car until gravity overcomes the slope resistance and moves the pair.", motif: "funicular", source: "reconstructed" },
    { number: "4.6", title: "Sherlock Holmes and the Bella Fiore emerald", stars: "★★★", difficulty: "Three star difficulty", teaser: "Reconstruct a collision from its aftermath and let momentum expose the only possible story.", motif: "emerald", source: "reconstructed" },
    { number: "4.7", title: "Equivalent statements for linear collisions", stars: "★★★", difficulty: "Three star difficulty", teaser: "Move between restitution, relative velocity and centre-of-mass statements of the same collision.", motif: "collision-equivalence", source: "reconstructed" },
  ];

  const chapterFiveProblems = [
    { number: "5.1", title: "Friction at the superbike races", stars: "★", difficulty: "One star difficulty", teaser: "Compare required centripetal force with available tyre friction on a flat corner.", motif: "superbike-flat", source: "reconstructed" },
    { number: "5.2", title: "Pole position at the superbike races", stars: "★★", difficulty: "Two star difficulty", teaser: "Bank the corner, find its design speed and track which way friction must act away from it.", motif: "superbike-bank", source: "reconstructed" },
    { number: "5.3", title: "Roller coaster", stars: "★★★", difficulty: "Three star difficulty", teaser: "Combine energy with radial force balance to keep a coaster in contact around a vertical loop.", motif: "coaster-loop", source: "reconstructed" },
    { number: "5.4", title: "Derailed roller coaster", stars: "★★", difficulty: "Two star difficulty", teaser: "Leave the rail on a tangent, become a projectile and predict where the flight meets the world.", motif: "coaster-flight", source: "reconstructed" },
    { number: "5.5", title: "The last ride of Professor Lazy", stars: "★★", difficulty: "Two star difficulty", teaser: "Spin a circular ride until its support geometry and centripetal demand reach a critical limit.", motif: "lazy-ride", source: "reconstructed" },
    { number: "5.6", title: "Wall of Death: car", stars: "★★★", difficulty: "Three star difficulty", teaser: "Drive around a vertical cylinder and make wall friction hold the car against gravity.", motif: "wall-car", source: "reconstructed" },
    { number: "5.7", title: "Wall of Death: motorcycle", stars: "★★ or ★★★★", difficulty: "Two star problem with a four star extension", teaser: "Add the motorcycle’s lean and torque balance to the wall-of-death force diagram.", motif: "wall-bike", source: "reconstructed" },
  ];

  const chapterSixProblems = [
    { number: "6.1", title: "Oscillating sphere", stars: "★★", difficulty: "Two star difficulty", teaser: "Slide a sphere inside a smooth bowl and compare exact finite-amplitude motion with its SHM limit.", motif: "sphere-bowl", source: "reconstructed" },
    { number: "6.2", title: "Professor Stopclock’s time-manipulator", stars: "★★★", difficulty: "Three star difficulty", teaser: "Switch an oscillator’s stiffness mid-cycle and rebuild its amplitude, phase, energy and next peak.", motif: "stopclock", source: "reconstructed" },
    { number: "6.3", title: "Dr Springlove’s Oscillator", stars: "★", difficulty: "Introductory difficulty marker", teaser: "Track position, velocity, acceleration and energy around one complete mass–spring cycle.", motif: "spring-single", source: "reconstructed" },
    { number: "6.4", title: "Dr Springlove’s Infernal Oscillator", stars: "★★", difficulty: "Two star difficulty", teaser: "Couple two oscillators and separate their motion into symmetric and antisymmetric normal modes.", motif: "spring-coupled", source: "reconstructed" },
    { number: "6.5", title: "Dr Springlove’s Improved Infernal Oscillator", stars: "★★★", difficulty: "Three star difficulty", teaser: "Tune an added absorber so modal superposition suppresses the motion where it matters most.", motif: "spring-absorber", source: "reconstructed" },
  ];

  const chapterSevenProblems = [
    { number: "7.1", title: "Stevin’s clootcrans", stars: "★", difficulty: "One star difficulty", teaser: "Count beads on two unequal slopes and discover why a common height makes their pulls exactly balance.", motif: "clootcrans", source: "reconstructed" },
    { number: "7.2", title: "Power-producing speed humps", stars: "★★", difficulty: "Two star difficulty", teaser: "Audit mechanical input, electrical output and traffic power to expose the real energy source.", motif: "speed-hump", source: "reconstructed" },
    { number: "7.3", title: "The overbalanced wheel", stars: "★★", difficulty: "Two star difficulty", teaser: "Sum every gravitational moment and the hidden reset work around one complete wheel revolution.", motif: "overbalanced-wheel", source: "reconstructed" },
    { number: "7.4", title: "Professor Sinclair’s syphon", stars: "★★", difficulty: "Two star difficulty", teaser: "Spend outlet head on flow speed, then track crest pressure down to the vapour limit.", motif: "syphon", source: "reconstructed" },
    { number: "7.5", title: "Boyle’s perpetual vase", stars: "★", difficulty: "One star difficulty", teaser: "Follow hydrostatic pressure through a self-refilling-vase claim and locate the missing lift work.", motif: "vase", source: "reconstructed" },
    { number: "7.6", title: "The curious wheel", stars: "★★★", difficulty: "Three star difficulty", teaser: "Audit centre-of-mass height, torque and reset work in a wheel that claims to accelerate itself.", motif: "curious-wheel", source: "reconstructed" },
  ];

  const chapterEightProblems = [
    { number: "8.1", title: "Professor Lazy", stars: "★★", difficulty: "Two star difficulty", teaser: "Delay, accelerate, cruise and solve the correct branch of a piecewise pursuit before the deadline.", motif: "lazy-pursuit", source: "reconstructed" },
    { number: "8.2", title: "The Unflinching Aviator", stars: "★", difficulty: "One star difficulty", teaser: "Aim an aircraft through crosswind by building the velocity triangle that reaches the target.", motif: "aviator", source: "reconstructed" },
    { number: "8.3", title: "Target shooting", stars: "★", difficulty: "One star difficulty", teaser: "Intercept a moving target and choose between the low, high or impossible projectile paths.", motif: "target", source: "reconstructed" },
  ];

  const chapterNineProblems = [
    { number: "9.1", title: "Resistor pyramid", stars: "★★", difficulty: "Two star difficulty", teaser: "Choose pyramid terminals, reveal equipotential nodes and reduce the network to its equivalent resistance.", motif: "resistor-pyramid", source: "reconstructed" },
    { number: "9.2", title: "Resistor tetrahedron", stars: "★", difficulty: "One star difficulty", teaser: "Use tetrahedral symmetry to silence one branch and collapse six equal resistors into a simple answer.", motif: "resistor-tetrahedron", source: "reconstructed" },
    { number: "9.3", title: "Resistor square", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Solve a spoke-and-square network whose symmetry and limiting behaviour change with the terminals.", motif: "resistor-square", source: "reconstructed" },
    { number: "9.4", title: "Resistor cube", stars: "★★★", difficulty: "Three star difficulty", teaser: "Select adjacent, face-diagonal or body-diagonal cube vertices and watch node symmetry reorganise the current.", motif: "resistor-cube", source: "reconstructed" },
    { number: "9.5", title: "Power transmission", stars: "★", difficulty: "One star difficulty", teaser: "Raise receiving voltage and watch fixed-power current and I²R line loss collapse.", motif: "transmission", source: "reconstructed" },
    { number: "9.6", title: "RMS power", stars: "★", difficulty: "One star difficulty", teaser: "Average a sinusoidal power wave and connect peaks, RMS values and phase to real power.", motif: "rms", source: "reconstructed" },
    { number: "9.7", title: "Boiling time", stars: "★", difficulty: "One star difficulty", teaser: "Turn electrical power into sensible heat and predict when a kettle reaches boiling point.", motif: "kettle", source: "reconstructed" },
  ];

  const chapterTenProblems = [
    { number: "10.1", title: "The hollow moon", stars: "★", difficulty: "One star difficulty", teaser: "Travel through a spherical shell and discover where the field vanishes, grows and returns to inverse-square form.", motif: "hollow-moon", source: "reconstructed" },
    { number: "10.2", title: "Lowest-energy circular orbit", stars: "★★", difficulty: "Two star difficulty", teaser: "Choose an orbital radius and connect circular speed, kinetic energy and gravitational binding energy.", motif: "low-orbit", source: "reconstructed" },
    { number: "10.3", title: "Weightless in space", stars: "★★", difficulty: "Two star difficulty", teaser: "Separate gravity from apparent weight by comparing supported motion with free fall at the same altitude.", motif: "weightless", source: "reconstructed" },
    { number: "10.4", title: "Jump into space", stars: "★★★", difficulty: "Three star difficulty", teaser: "Spend launch energy on gravitational height and identify the exact boundary between return and escape.", motif: "space-jump", source: "reconstructed" },
    { number: "10.5", title: "Space graveyard", stars: "★★★", difficulty: "Three star difficulty", teaser: "Plan a disposal-orbit transfer and audit the energy and angular momentum needed to keep debris safely aloft.", motif: "graveyard-orbit", source: "reconstructed" },
    { number: "10.6", title: "Newton’s cannonball", stars: "★★", difficulty: "Two star difficulty", teaser: "Fire horizontally from a mountain and watch falling ground curve into a circular orbit.", motif: "cannonball", source: "reconstructed" },
    { number: "10.7", title: "De la Terre a la Lune", stars: "★★", difficulty: "Two star difficulty", teaser: "Launch along the Earth–Moon line and map the competing gravitational pulls and the transfer barrier.", motif: "earth-moon", source: "reconstructed" },
    { number: "10.8", title: "Professor Plumb’s Astrolabe-Plumb", stars: "★★★", difficulty: "Three star difficulty", teaser: "Use a deflected plumb line to infer the sideways gravitational pull of a nearby astronomical mass.", motif: "plumb", source: "reconstructed" },
    { number: "10.9", title: "Jet aircraft diet", stars: "★★", difficulty: "Two star difficulty", teaser: "Track how altitude and latitude change apparent weight without changing the passenger’s mass.", motif: "jet-diet", source: "reconstructed" },
    { number: "10.10", title: "Escape velocity from the Solar System", stars: "★★★", difficulty: "Three star difficulty", teaser: "Combine Earth’s orbital motion with the Sun’s escape requirement and choose the cheapest departure direction.", motif: "solar-escape", source: "reconstructed" },
    { number: "10.11", title: "Mr Megalopolis’ expanding Moon", stars: "★★★", difficulty: "Three star difficulty", teaser: "Expand a moon at fixed mass and follow surface gravity, binding energy and escape speed as its radius changes.", motif: "expanding-moon", source: "reconstructed" },
    { number: "10.12", title: "Asteroid games", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Redirect an asteroid with a carefully timed impulse, then judge miss distance, energy cost and planetary risk.", motif: "asteroid", source: "reconstructed" },
  ];

  const chapterElevenProblems = [
    { number: "11.1", title: "Mote in a sphere", stars: "★", difficulty: "One star difficulty", teaser: "Trace rays from a tiny inclusion through a curved surface and locate the virtual image an observer sees.", motif: "mote-sphere", source: "reconstructed" },
    { number: "11.2", title: "Diminishing rings of light", stars: "★★★", difficulty: "Three star difficulty", teaser: "Turn thin-film path difference into concentric ring radii, then explain why the pattern fades.", motif: "light-rings", source: "reconstructed" },
    { number: "11.3", title: "Floating pigs", stars: "★★★", difficulty: "Three star difficulty", teaser: "Hide a toy below a concave mirror and ray-trace the real image that seems to float in space.", motif: "floating-image", source: "reconstructed" },
    { number: "11.4", title: "The Martian and the caveman", stars: "★ or ★★★★", difficulty: "One or four star difficulty", teaser: "Start with angular size, then unlock a diffraction test for whether distant details can actually be resolved.", motif: "martian-caveman", source: "reconstructed" },
    { number: "11.5", title: "Strange fish", stars: "★★★ or ★★★★", difficulty: "Three or four star difficulty", teaser: "Follow rays across water, glass and air to reconcile apparent depth, viewing angle and total internal reflection.", motif: "strange-fish", source: "reconstructed" },
  ];

  const chapterTwelveProblems = [
    { number: "12.1", title: "The heated plate", stars: "★", difficulty: "One star difficulty", teaser: "Turn heater power into a linear temperature rise with a transparent energy and time ledger.", motif: "heated-plate", source: "reconstructed" },
    { number: "12.2", title: "The heated cube", stars: "★", difficulty: "One star difficulty", teaser: "Scale a solid cube and watch volume, mass, stored heat and heating time grow with the third power.", motif: "heated-cube", source: "reconstructed" },
    { number: "12.3", title: "Fridge in a room", stars: "★★", difficulty: "Two star difficulty", teaser: "Put both sides of a refrigerator inside one room and audit every joule of heat and electrical work.", motif: "fridge-room", source: "reconstructed" },
    { number: "12.4", title: "Ice in the desert", stars: "★★★", difficulty: "Three star difficulty", teaser: "Spend net solar power on warming ice, latent melting and then warming the resulting water.", motif: "desert-ice", source: "reconstructed" },
    { number: "12.5", title: "The cold end of the Earth", stars: "★★", difficulty: "Two star difficulty", teaser: "Balance absorbed sunlight, transported heat and infrared emission in a deliberately local polar model.", motif: "cold-earth", source: "reconstructed" },
  ];

  const chapterThirteenProblems = [
    { number: "13.1", title: "Archimedes’ crown and Galileo’s balance", stars: "★", difficulty: "One star difficulty", teaser: "Weigh a crown in air and water, then turn lost weight into volume, density and an alloy verdict.", motif: "crown-balance", source: "reconstructed" },
    { number: "13.2", title: "Another Galileo’s balance puzzle", stars: "★★", difficulty: "Two star difficulty", teaser: "Submerge unequal volumes on a two-arm balance and restore equilibrium with buoyancy-aware torques.", motif: "galileo-balance", source: "reconstructed" },
    { number: "13.3", title: "Balanced scales", stars: "★", difficulty: "One star difficulty", teaser: "Move a submerged object across the scale boundary and track exactly where the buoyant reaction is recorded.", motif: "balanced-scales", source: "reconstructed" },
    { number: "13.4", title: "The floating ball and the sinking ball", stars: "★★", difficulty: "Two star difficulty", teaser: "Compare displaced volume, tether force and scale reading for balls that would naturally float or sink.", motif: "two-balls", source: "reconstructed" },
    { number: "13.5", title: "Floating cylinders", stars: "★★★", difficulty: "Three star difficulty", teaser: "Couple cylindrical buoyancy to stability and discover when a floating column rights itself or topples.", motif: "floating-cylinders", source: "reconstructed" },
    { number: "13.6", title: "The hydrostatic paradox", stars: "★★", difficulty: "Two star difficulty", teaser: "Give differently shaped vessels the same base and depth, then reconcile equal bottom force with unequal water weight.", motif: "hydrostatic-paradox", source: "reconstructed" },
    { number: "13.7", title: "A quantitative piston puzzle", stars: "★", difficulty: "One star difficulty", teaser: "Transmit pressure between pistons and separate force multiplication from conservation of work and displaced volume.", motif: "pistons", source: "reconstructed" },
    { number: "13.8", title: "The floating bar", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Solve a partially submerged bar whose buoyant force, weight and support geometry determine both depth and angle.", motif: "floating-bar", source: "reconstructed" },
  ];

  const chapterFourteenProblems = [
    { number: "14.1", title: "Mile-high tower", stars: "★", difficulty: "One star difficulty", teaser: "Estimate self-weight stress in an untapered tower and compare a mile of material with its factored strength.", motif: "mile-tower", source: "reconstructed" },
    { number: "14.2", title: "How long do we have left?", stars: "★★", difficulty: "Two star difficulty", teaser: "Turn a finite stock and a growing consumption rate into two transparent—not predictive—lifetime estimates.", motif: "time-left", source: "reconstructed" },
    { number: "14.3", title: "Midas’ storeroom", stars: "★", difficulty: "One star difficulty", teaser: "Fill a room with gold, then translate volume into mass, floor pressure, bars and truckloads.", motif: "midas-room", source: "reconstructed" },
    { number: "14.4", title: "Napoleon Bonaparte and the Great Pyramid", stars: "★", difficulty: "One star difficulty", teaser: "Estimate a pyramid’s stone volume, mass and block count from only a few defensible assumptions.", motif: "great-pyramid", source: "reconstructed" },
    { number: "14.5", title: "Lawnchair Larry", stars: "★★", difficulty: "Two star difficulty", teaser: "Estimate how many helium balloons are needed once payload, envelope mass and a safety margin are counted.", motif: "lawnchair", source: "reconstructed" },
    { number: "14.6", title: "Do we get lighter by breathing?", stars: "★★", difficulty: "Two star difficulty", teaser: "Track inhaled and exhaled gas mass, oxygen uptake and carbon dioxide release across one breath and a whole day.", motif: "breathing", source: "reconstructed" },
  ];

  const chapterFifteenProblems = [
    { number: "15.1", title: "The Crowded Cloakroom", stars: "★", difficulty: "One star difficulty", teaser: "Compare seeded arrivals with the exact complement product for the first repeated cloakroom label.", motif: "cloakroom-collision", source: "extension" },
    { number: "15.2", title: "The Meteor Siren Lies Politely", stars: "★★", difficulty: "Two star difficulty", teaser: "Turn prior odds, sensitivity and false alarms into the probability that an alarm really means meteor.", motif: "meteor-bayes", source: "extension" },
    { number: "15.3", title: "The Last Red Tile", stars: "★★", difficulty: "Two star difficulty", teaser: "Shuffle marked tiles and connect the last red position to an exact discrete order statistic.", motif: "last-red", source: "extension" },
    { number: "15.4", title: "Firefly Between Two Fountains", stars: "★★★", difficulty: "Three star difficulty", teaser: "Animate an absorbing random walk and solve its hitting probability and expected duration recurrences.", motif: "firefly-walk", source: "extension" },
    { number: "15.5", title: "The Missing Constellation", stars: "★★★", difficulty: "Three star difficulty", teaser: "Collect randomized star types and watch the coupon-collector harmonic expectation emerge.", motif: "constellation-coupons", source: "extension" },
    { number: "15.6", title: "The Chord Factory", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Switch between three equally plausible random-chord factories and expose three different answers.", motif: "chord-factory", source: "extension" },
  ];

  const chapterSixteenProblems = [
    { number: "16.1", title: "Odd Bricks, Square Wall", stars: "★", difficulty: "One star difficulty", teaser: "Build a square from successive odd L-shaped layers and watch an induction proof grow with it.", motif: "odd-bricks", source: "extension" },
    { number: "16.2", title: "The Lantern Keeper’s Even Night", stars: "★", difficulty: "One star difficulty", teaser: "Toggle lanterns only in pairs and use parity to rule out an apparently simple target state.", motif: "lantern-parity", source: "extension" },
    { number: "16.3", title: "The Moon Archivist’s Rings", stars: "★★", difficulty: "Two star difficulty", teaser: "Play the legal ring-moving puzzle, unfold its recursion and prove the optimal move count.", motif: "archivist-rings", source: "extension" },
    { number: "16.4", title: "Euclid’s Shrinking Rectangle", stars: "★★", difficulty: "Two star difficulty", teaser: "Tile rectangles with maximal squares while gcd survives and the positive remainder strictly shrinks.", motif: "euclid-rectangle", source: "extension" },
    { number: "16.5", title: "The Village of Odd Doorways", stars: "★★★", difficulty: "Three star difficulty", teaser: "Build a village graph and watch odd-degree buildings appear and disappear only in pairs.", motif: "odd-doorways", source: "extension" },
    { number: "16.6", title: "The Bellhop’s Impossible Suitcase", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Slide a 4×4 puzzle legally and expose the parity invariant behind an unreachable suitcase order.", motif: "bellhop-puzzle", source: "extension" },
  ];

  const chapterSeventeenProblems = [
    { number: "17.1", title: "Twelve Lamps, Eighteen Wires", stars: "★", difficulty: "One star difficulty", teaser: "Wire an undirected lamp network and make the handshaking ledger count every endpoint twice.", motif: "lamp-network", source: "extension" },
    { number: "17.2", title: "Dominoes at the Long Table", stars: "★", difficulty: "One star difficulty", teaser: "Tile a 2×n table and split every possibility into the two first-column recurrence cases.", motif: "domino-table", source: "extension" },
    { number: "17.3", title: "The Spy Who Wouldn’t Sit Next Door", stars: "★★", difficulty: "Two star difficulty", teaser: "Count circular seatings, then subtract the arrangements where two spies form one adjacent block.", motif: "spy-table", source: "extension" },
    { number: "17.4", title: "The Midnight Radio Wheel", stars: "★★★", difficulty: "Three star difficulty", teaser: "Colour a wheel network and discover why odd rims demand one more radio channel.", motif: "radio-wheel", source: "extension" },
    { number: "17.5", title: "The Two-Route Lifeboat Network", stars: "★★★", difficulty: "Three star difficulty", teaser: "Enumerate every link state in a diamond network and turn surviving paths into system reliability.", motif: "lifeboat-reliability", source: "extension" },
    { number: "17.6", title: "The Eleven-Crate Bottleneck", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Push flow through a capacitated network until a highlighted cut proves no more can pass.", motif: "crate-flow", source: "extension" },
  ];

  const chapterEighteenProblems = [
    { number: "18.1", title: "The Tunnel Clap", stars: "★", difficulty: "One star difficulty", teaser: "Scrub a reflected sound pulse and turn the measured echo delay into a one-way tunnel distance.", motif: "tunnel-echo", source: "extension" },
    { number: "18.2", title: "Two Notes, One Throb", stars: "★", difficulty: "One star difficulty", teaser: "Superpose two close frequencies and watch their difference become the audible beat rate.", motif: "beat-envelope", source: "extension" },
    { number: "18.3", title: "The Pipe That Changed Its Mind", stars: "★★", difficulty: "Two star difficulty", teaser: "Switch one end from closed to open and see the allowed standing-wave family reorganise.", motif: "changing-pipe", source: "extension" },
    { number: "18.4", title: "The Siren’s Split Personality", stars: "★★★", difficulty: "Three star difficulty", teaser: "Move a siren past a listener and connect compressed wavefronts to the two Doppler readings.", motif: "doppler-siren", source: "extension" },
    { number: "18.5", title: "Why Ten Violins Aren’t Ten Times Louder", stars: "★★★", difficulty: "Three star difficulty", teaser: "Add independent sound sources on an intensity scale before returning to logarithmic decibels.", motif: "violin-decibel", source: "extension" },
    { number: "18.6", title: "The Pulse That Runs Away from Its Ripples", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Separate phase speed from group speed and watch a deep-water packet outrun—or lag—its carrier ripples.", motif: "pulse-dispersion", source: "extension" },
  ];

  const chapterNineteenProblems = [
    { number: "19.1", title: "The Current That Turns North", stars: "★", difficulty: "One star difficulty", teaser: "Move a compass around a straight current and make the right-hand rule predict its direction everywhere.", motif: "current-compass", source: "extension" },
    { number: "19.2", title: "The Loop That Won’t Sit Still", stars: "★★", difficulty: "Two star difficulty", teaser: "Rotate a current loop in a field and connect its magnetic moment to torque and stable alignment.", motif: "loop-torque", source: "extension" },
    { number: "19.3", title: "The Rail That Brakes Itself", stars: "★★", difficulty: "Two star difficulty", teaser: "Slide a conducting bar through a field and watch Lenz’s law turn kinetic energy into heat.", motif: "rail-brake", source: "extension" },
    { number: "19.4", title: "The Isotope Gate", stars: "★★★", difficulty: "Three star difficulty", teaser: "Send two ion masses through semicircular paths and translate radius into detector separation.", motif: "isotope-gate", source: "extension" },
    { number: "19.5", title: "Corkscrew in a Blue Field", stars: "★★★", difficulty: "Three star difficulty", teaser: "Resolve a charged particle’s velocity into circular and axial motion to build its helical path.", motif: "field-corkscrew", source: "extension" },
    { number: "19.6", title: "The Bottle’s Escape Cone", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Use magnetic-moment conservation to decide which pitch angles mirror and which escape.", motif: "escape-cone", source: "extension" },
  ];

  const chapterTwentyProblems = [
    { number: "20.1", title: "A Sideways Tick", stars: "★", difficulty: "One star difficulty", teaser: "Follow one light-clock photon in two frames and let its diagonal path expose time dilation.", motif: "sideways-tick", source: "extension" },
    { number: "20.2", title: "The Muon That Reaches the Beach", stars: "★★", difficulty: "Two star difficulty", teaser: "Turn a proper lifetime into an atmospheric survival curve and reconcile both inertial frames.", motif: "muon-beach", source: "extension" },
    { number: "20.3", title: "The Train Inside a Snapshot", stars: "★★", difficulty: "Two star difficulty", teaser: "Measure both ends simultaneously and watch a 300-metre train contract to 240 metres.", motif: "train-snapshot", source: "extension" },
    { number: "20.4", title: "The Closing-Speed Trap", stars: "★★★", difficulty: "Three star difficulty", teaser: "Separate an Earth-frame closing rate from the subluminal speed one ship assigns the other.", motif: "closing-speed", source: "extension" },
    { number: "20.5", title: "The Red Echo", stars: "★★★", difficulty: "Three star difficulty", teaser: "Bounce a signal from a receding mirror and compose the two Doppler shifts into one red echo.", motif: "red-echo", source: "extension" },
    { number: "20.6", title: "The Price of Standing Still", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Use four-momentum and relativistic kinetic energy to price the act of bringing a fast craft to rest.", motif: "standing-still", source: "extension" },
  ];

  const chapterTwentyOneProblems = [
    { number: "21.1", title: "The Silent Switchboard", stars: "★", difficulty: "One star difficulty", teaser: "Use a silent interval to test the memoryless waiting-time law of a Poisson process.", motif: "silent-switchboard", source: "extension" },
    { number: "21.2", title: "Tomorrow’s Weather, One Step at a Time", stars: "★★", difficulty: "Two star difficulty", teaser: "Move sunny and rainy probability through a two-state Markov chain without confusing a distribution with one forecast.", motif: "weather-chain", source: "extension" },
    { number: "21.3", title: "The Three-Room Shuffle", stars: "★★", difficulty: "Two star difficulty", teaser: "Watch a three-state chain mix toward stationarity and measure the remaining total-variation distance.", motif: "room-mixing", source: "extension" },
    { number: "21.4", title: "Traffic in Both Directions", stars: "★★★", difficulty: "Three star difficulty", teaser: "Turn edge weights into a reversible random walk and balance probability flux in both directions.", motif: "reversible-traffic", source: "extension" },
    { number: "21.5", title: "A Fair Game with a Wild Path", stars: "★★★", difficulty: "Three star difficulty", teaser: "Expand a changing-stake coin tree and see why a martingale can wander while its conditional mean stays put.", motif: "fair-game", source: "extension" },
    { number: "21.6", title: "Stop While You’re Ahead?", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Simulate a stopped random walk, verify its hitting odds and discover why optional stopping needs conditions.", motif: "stopping-time", source: "extension" },
  ];

  const chapterTwentyTwoProblems = [
    { number: "22.1", title: "The Shape Hidden in the Averages", stars: "★", difficulty: "One star difficulty", teaser: "Run repeated samples and watch their means form a narrower distribution governed by standard error.", motif: "sampling-means", source: "extension" },
    { number: "22.2", title: "Ninety-Five Nets", stars: "★★", difficulty: "Two star difficulty", teaser: "Cast repeated confidence intervals and separate long-run procedure coverage from belief about one fixed mean.", motif: "confidence-nets", source: "extension" },
    { number: "22.3", title: "The Coin’s Best-Fitting Bias", stars: "★★", difficulty: "Two star difficulty", teaser: "Drag a coin-bias parameter along its likelihood curve and find the value that best fits seven heads in ten tosses.", motif: "coin-likelihood", source: "extension" },
    { number: "22.4", title: "A Result at the Edge", stars: "★★★", difficulty: "Three star difficulty", teaser: "Place a sample mean in both tails of a null distribution and interpret the resulting two-sided p-value carefully.", motif: "edge-result", source: "extension" },
    { number: "22.5", title: "Belief After Ten Tosses", stars: "★★★", difficulty: "Three star difficulty", teaser: "Update a beta prior with observed coin tosses and turn the posterior into a predictive probability.", motif: "bayes-tosses", source: "extension" },
    { number: "22.6", title: "The Line That Pays for Its Misses", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Move a regression line while its vertical residual squares expose the least-squares optimum.", motif: "regression-misses", source: "extension" },
  ];

  const chapterTwentyThreeProblems = [
    { number: "23.1", title: "The Three-Lantern Switchboard", stars: "★", difficulty: "One star difficulty", teaser: "Use legal row operations to expose the one setting shared by three linear constraints.", motif: "lantern-system", source: "extension" },
    { number: "23.2", title: "The Logo Through the Matrix Gate", stars: "★★", difficulty: "Two star difficulty", teaser: "Send points, basis vectors and a whole logo through a matrix map on linked coordinate grids.", motif: "matrix-logo", source: "extension" },
    { number: "23.3", title: "The Carpet That Turns Inside Out", stars: "★★", difficulty: "Two star difficulty", teaser: "Warp an oriented triangle and let the determinant track area scaling and reversal.", motif: "determinant-carpet", source: "extension" },
    { number: "23.4", title: "The Directions the Machine Cannot Turn", stars: "★★★", difficulty: "Three star difficulty", teaser: "Rotate an input vector until its matrix image preserves direction and reveals an eigenvalue.", motif: "eigen-directions", source: "extension" },
    { number: "23.5", title: "The Two-Colour Migration Engine", stars: "★★★", difficulty: "Three star difficulty", teaser: "Iterate a two-state population map and separate its stationary and decaying eigenmodes.", motif: "migration-engine", source: "extension" },
    { number: "23.6", title: "The Crooked Calibration Line", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Fit an inconsistent system by projecting its data vector onto the model’s column space.", motif: "calibration-projection", source: "extension" },
  ];

  const chapterTwentyFourProblems = [
    { number: "24.1", title: "The Camera Car at One Instant", stars: "★", difficulty: "One star difficulty", teaser: "Shrink a secant interval until its average velocity reveals one instantaneous derivative.", motif: "camera-tangent", source: "extension" },
    { number: "24.2", title: "The River Pen with One Missing Side", stars: "★★", difficulty: "Two star difficulty", teaser: "Resize a constrained three-sided enclosure while its area curve certifies the global maximum.", motif: "river-pen", source: "extension" },
    { number: "24.3", title: "The Reservoir’s Uneven Inflow", stars: "★★", difficulty: "Two star difficulty", teaser: "Accumulate positive and negative flow separately to distinguish net change from total throughput.", motif: "reservoir-flow", source: "extension" },
    { number: "24.4", title: "The Infinitely Long Paint Strip", stars: "★★★", difficulty: "Three star difficulty", teaser: "Move a finite cutoff along an infinite strip and watch its remaining area shrink to a finite tail.", motif: "paint-tail", source: "extension" },
    { number: "24.5", title: "The Pocket Calculator’s Cosine", stars: "★★★", difficulty: "Three star difficulty", teaser: "Add Taylor terms to a cosine approximation and compare its actual error with a certified remainder bound.", motif: "cosine-taylor", source: "extension" },
    { number: "24.6", title: "The Square Wave Built from Sines", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Assemble a square wave from odd harmonics and inspect the stubborn overshoot beside a jump.", motif: "fourier-square", source: "extension" },
  ];

  const chapterTwentyFiveProblems = [
    { number: "25.1", title: "The Vanishing Tracer", stars: "★", difficulty: "One star difficulty", teaser: "Calibrate an exponential decay from two measurements and read its half-life on ordinary and semilog plots.", motif: "vanishing-tracer", source: "extension" },
    { number: "25.2", title: "Chasing a Moving Temperature", stars: "★★", difficulty: "Two star difficulty", teaser: "Separate a moving forced response from its dying transient in a first-order temperature model.", motif: "moving-temperature", source: "extension" },
    { number: "25.3", title: "The Two Safe Levels", stars: "★★", difficulty: "Two star difficulty", teaser: "Place nearby initial conditions on a phase line to distinguish equilibrium from stability.", motif: "safe-levels", source: "extension" },
    { number: "25.4", title: "Two Modes in One Motion", stars: "★★★", difficulty: "Three star difficulty", teaser: "Decompose a coupled system into one growing and one decaying eigenmode on its phase plane.", motif: "two-modes", source: "extension" },
    { number: "25.5", title: "The Predator–Prey Carousel", stars: "★★★", difficulty: "Three star difficulty", teaser: "Trace nullclines and closed population paths before linearising their small oscillations.", motif: "predator-prey", source: "extension" },
    { number: "25.6", title: "The Step That Explodes", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Change an Euler step until a rapidly decaying stiff mode either settles or explodes numerically.", motif: "euler-explosion", source: "extension" },
  ];

  const chapterTwentySixProblems = [
    { number: "26.1", title: "The Steepest Step", stars: "★", difficulty: "One star difficulty", teaser: "Turn a direction arrow on a contour map until its directional derivative reaches the gradient’s full length.", motif: "steepest-step", source: "extension" },
    { number: "26.2", title: "The Largest Rectangle on an Ellipse", stars: "★★", difficulty: "Two star difficulty", teaser: "Move a feasible rectangle until its objective contour becomes tangent to an ellipse constraint.", motif: "ellipse-rectangle", source: "extension" },
    { number: "26.3", title: "Counting What Escapes", stars: "★★", difficulty: "Two star difficulty", teaser: "Audit outward flux edge by edge and compare the boundary total with accumulated divergence inside.", motif: "escaping-flux", source: "extension" },
    { number: "26.4", title: "The Turning Field", stars: "★★★", difficulty: "Three star difficulty", teaser: "Carry a tangent probe around a rotational field and accumulate oriented circulation along the loop.", motif: "turning-field", source: "extension" },
    { number: "26.5", title: "Three Roads, One Work Bill", stars: "★★★", difficulty: "Three star difficulty", teaser: "Compare three paths through a conservative field and let a potential function settle every work bill.", motif: "three-roads", source: "extension" },
    { number: "26.6", title: "Green’s Ledger", stars: "★★★★", difficulty: "Four star difficulty", teaser: "Reconcile a circulation ledger around a rectangle with a curl ledger spread across its area.", motif: "greens-ledger", source: "extension" },
  ];

  const problems = [...chapterOneProblems, ...chapterTwoProblems, ...chapterThreeProblems, ...chapterFourProblems, ...chapterFiveProblems, ...chapterSixProblems, ...chapterSevenProblems, ...chapterEightProblems, ...chapterNineProblems, ...chapterTenProblems, ...chapterElevenProblems, ...chapterTwelveProblems, ...chapterThirteenProblems, ...chapterFourteenProblems, ...chapterFifteenProblems, ...chapterSixteenProblems, ...chapterSeventeenProblems, ...chapterEighteenProblems, ...chapterNineteenProblems, ...chapterTwentyProblems, ...chapterTwentyOneProblems, ...chapterTwentyTwoProblems, ...chapterTwentyThreeProblems, ...chapterTwentyFourProblems, ...chapterTwentyFiveProblems, ...chapterTwentySixProblems];

  const bookChapters = [
    { number: "1", title: "Geometry", count: 17, page: 19, live: true, summary: "Constructions, loci and optimisation" },
    { number: "2", title: "Mathematics", count: 12, page: 60, live: true, summary: "Algebra, graphs and probability" },
    { number: "3", title: "Statics", count: 9, page: 82, live: true, summary: "Equilibrium, moments and simple machines" },
    { number: "4", title: "Dynamics and collisions", count: 7, page: 119, live: true, summary: "Acceleration, momentum, impulse and restitution" },
    { number: "5", title: "Circular motion", count: 7, page: 150, live: true, summary: "Centripetal force, banking, loops and rotating walls" },
    { number: "6", title: "Simple harmonic motion", count: 5, page: 176, live: true, summary: "Oscillators, phase, energy and normal modes" },
    { number: "7", title: "Mad inventions and perpetual motion", count: 6, page: 196, live: true, summary: "Energy audits, paradoxes and impossible machines" },
    { number: "8", title: "Kinematics", count: 3, page: 219, live: true, summary: "Pursuit, relative velocity and projectile interception" },
    { number: "9", title: "Electricity", count: 7, page: 228, live: true, summary: "Networks, transmission, AC power and heating" },
    { number: "10", title: "Gravity", count: 12, page: 242, live: true, summary: "Fields, orbits, apparent weight and escape" },
    { number: "11", title: "Optics", count: 5, page: 285, live: true, summary: "Refraction, interference, imaging and resolution" },
    { number: "12", title: "Heat", count: 5, page: 305, live: true, summary: "Thermal energy, scaling, refrigeration and phase change" },
    { number: "13", title: "Buoyancy and hydrostatics", count: 8, page: 322, live: true, summary: "Buoyant force, pressure, stability and hydraulic work" },
    { number: "14", title: "Estimation", count: 6, page: 351, live: true, summary: "Scaling, bounds, sensitivity and Fermi reasoning" },
    { number: "15", title: "Probability and randomness", count: 6, live: true, extension: true, summary: "Exact chance, simulation, Bayesian evidence and random processes" },
    { number: "16", title: "Proof, induction and invariants", count: 6, live: true, extension: true, summary: "Induction, recursion, descent and preserved structure" },
    { number: "17", title: "Combinatorics and networks", count: 6, live: true, extension: true, summary: "Counting, colouring, reliability and network flow" },
    { number: "18", title: "Waves and sound", count: 6, live: true, extension: true, summary: "Echoes, beats, modes, Doppler shifts, decibels and dispersion" },
    { number: "19", title: "Magnetism and fields", count: 6, live: true, extension: true, summary: "Currents, torque, induction, particle paths and magnetic mirrors" },
    { number: "20", title: "Relativity and spacetime", count: 6, live: true, extension: true, summary: "Time, simultaneity, velocity, Doppler shift and four-momentum" },
    { number: "21", title: "Stochastic processes", count: 6, live: true, extension: true, summary: "Poisson arrivals, Markov chains, stationarity, martingales and stopping times" },
    { number: "22", title: "Statistics and inference", count: 6, live: true, extension: true, summary: "Sampling, intervals, likelihood, testing, Bayesian updating and regression" },
    { number: "23", title: "Linear algebra and transformations", count: 6, live: true, extension: true, summary: "Systems, matrices, determinants, eigenvectors, iteration and least squares" },
    { number: "24", title: "Calculus, sequences and series", count: 6, live: true, extension: true, summary: "Derivatives, optimisation, integration, convergence, Taylor and Fourier series" },
    { number: "25", title: "Differential equations and dynamical systems", count: 6, live: true, extension: true, summary: "Decay, forcing, stability, modes, phase portraits and numerical stiffness" },
    { number: "26", title: "Multivariable calculus and fields", count: 6, live: true, extension: true, summary: "Gradients, constraints, flux, circulation, conservative fields and Green’s theorem" },
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
    "3": {
      title: "Statics",
      count: 9,
      status: "9 reconstructed activities",
      introduction: "Balance forces, take moments and test the limits of ropes, wheels, beams and pivots. Every diagram responds before the equations arrive.",
      heroClass: "is-statics",
    },
    "4": {
      title: "Dynamics and collisions",
      count: 7,
      status: "7 reconstructed activities",
      introduction: "Set masses moving, change frames and audit what survives a collision. These activities make acceleration, momentum and restitution visible.",
      heroClass: "is-dynamics",
    },
    "5": {
      title: "Circular motion",
      count: 7,
      status: "7 reconstructed activities",
      introduction: "Turn speed into inward acceleration, then ask which real force supplies it. Corners, loops and rotating walls expose every limit.",
      heroClass: "is-circular",
    },
    "6": {
      title: "Simple harmonic motion",
      count: 5,
      status: "5 reconstructed activities",
      introduction: "Follow phase as energy trades between motion and restoring force. Then couple, switch and tune oscillators until the modes become visible.",
      heroClass: "is-oscillation",
    },
    "7": {
      title: "Mad inventions and perpetual motion",
      count: 6,
      status: "6 reconstructed activities",
      introduction: "Interrogate ingenious machines one energy transfer at a time. Every apparent surplus eventually reveals a matching cost, loss or limit.",
      heroClass: "is-inventions",
    },
    "8": {
      title: "Kinematics",
      count: 3,
      status: "3 reconstructed activities",
      introduction: "Draw motion as geometry in time. Piecewise pursuit, crosswind vectors and moving-target projectiles all become solvable paths.",
      heroClass: "is-kinematics",
    },
    "9": {
      title: "Electricity",
      count: 7,
      status: "7 reconstructed activities",
      introduction: "Follow potential through symmetric networks, then scale up to transmission, AC power and electrical heating. Every current has an accounting trail.",
      heroClass: "is-electricity",
    },
    "10": {
      title: "Gravity",
      count: 12,
      status: "12 reconstructed activities",
      introduction: "Move from shells and surface weight to orbits, transfers and escape. Every activity follows energy, acceleration or angular momentum across the gravitational landscape.",
      heroClass: "is-gravity",
    },
    "11": {
      title: "Optics",
      count: 5,
      status: "5 reconstructed activities",
      introduction: "Bend and recombine rays until apparent positions, floating images, interference rings and the limits of resolution become visible rather than mysterious.",
      heroClass: "is-optics",
    },
    "12": {
      title: "Heat",
      count: 5,
      status: "5 reconstructed activities",
      introduction: "Follow energy into temperature, phase and radiation. These activities make every heat transfer declare its source, destination and timescale.",
      heroClass: "is-heat",
    },
    "13": {
      title: "Buoyancy and hydrostatics",
      count: 8,
      status: "8 reconstructed activities",
      introduction: "Draw the system boundary, measure displaced fluid and follow pressure through every surface. Floating, sinking and hydraulic force all reduce to careful accounting.",
      heroClass: "is-buoyancy",
    },
    "14": {
      title: "Estimation",
      count: 6,
      status: "6 reconstructed activities",
      introduction: "Choose assumptions you can defend, expose the powers of ten and test sensitivity. A good estimate is an argument whose uncertainty stays visible.",
      heroClass: "is-estimation",
    },
    "15": {
      title: "Probability and randomness",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Run repeatable trials, then separate what the simulation suggests from what the exact probability measure proves.",
      heroClass: "is-probability",
      extension: true,
    },
    "16": {
      title: "Proof, induction and invariants",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Make the preserved structure visible, then turn it into a proof: build, recurse, descend and rule out the impossible.",
      heroClass: "is-proof",
      extension: true,
    },
    "17": {
      title: "Combinatorics and networks",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Count by structure, then move from arrangements to graphs, reliability and the cuts that limit a network.",
      heroClass: "is-combinatorics",
      extension: true,
    },
    "18": {
      title: "Waves and sound",
      count: 6,
      status: "6 original-extension activities",
      introduction: "See a disturbance travel, reflect and interfere before the equation arrives. These activities distinguish the motion of a wave from the motion hidden inside it.",
      heroClass: "is-waves",
      extension: true,
    },
    "19": {
      title: "Magnetism and fields",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Trace the direction first, then calculate the magnitude. Currents, moving charges and magnetic moments make every field line earn its place.",
      heroClass: "is-magnetism",
      extension: true,
    },
    "20": {
      title: "Relativity and spacetime",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Change frames without changing the physics. Light clocks, particle lifetimes and four-vectors make the geometry of spacetime measurable.",
      heroClass: "is-relativity",
      extension: true,
    },
    "21": {
      title: "Stochastic processes",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Follow probability through time. Arrivals, state changes and fair games reveal what randomness preserves, forgets and approaches.",
      heroClass: "is-stochastic",
      extension: true,
    },
    "22": {
      title: "Statistics and inference",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Ask what the data support—and what they do not. Sampling, likelihood, intervals and posterior belief become distinct visual objects before they become formulas.",
      heroClass: "is-statistics",
      extension: true,
    },
    "23": {
      title: "Linear algebra and transformations",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Treat matrices as actions, not arrays. Row operations, area, invariant directions and projections turn linear algebra into visible geometry.",
      heroClass: "is-linear-algebra",
      extension: true,
    },
    "24": {
      title: "Calculus, sequences and series",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Move between the local and the infinite. Slopes, accumulated areas and polynomial or harmonic approximations show how limits organise calculus.",
      heroClass: "is-calculus",
      extension: true,
    },
    "25": {
      title: "Differential equations and dynamical systems",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Follow whole solution paths, not isolated values. Decay, forcing, stability, coupled modes and numerical failure reveal how systems change through time.",
      heroClass: "is-differential-equations",
      extension: true,
    },
    "26": {
      title: "Multivariable calculus and fields",
      count: 6,
      status: "6 original-extension activities",
      introduction: "Move from slopes along one line to change across a field. Gradients, flux, circulation and Green’s theorem connect local structure to global ledgers.",
      heroClass: "is-multivariable",
      extension: true,
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
      'sewer-plank': '<path d="M16 68h128M42 68l-12 18h24zm76 0-12 18h24z"/><path class="index-accent" d="M18 55h126"/><circle class="index-dot" cx="126" cy="45" r="8"/><path d="M126 53v15"/>',
      'sewer-cover': '<path d="M20 78h120M32 78l84-48"/><circle cx="32" cy="78" r="5"/><path class="index-accent" d="M92 44 76 18"/><path d="m72 26 4-8 9 1"/>',
      'sewer-winch': '<path d="M22 82h116M32 82l77-55M32 82 32 12"/><circle cx="32" cy="82" r="5"/><path class="index-accent" d="M64 12 109 27"/><circle class="index-dot" cx="64" cy="12" r="5"/>',
      'stone-rollers': '<path d="M20 29h120v27H20z"/><circle cx="48" cy="70" r="14"/><circle cx="80" cy="70" r="14"/><circle cx="112" cy="70" r="14"/><path class="index-accent" d="M17 17h87m-9-8 9 8-9 8"/>',
      'wheel-torque': '<circle cx="52" cy="51" r="34"/><circle cx="114" cy="51" r="24"/><path class="index-accent" d="M52 17v68M18 51h68M114 27v48M90 51h48"/><circle class="index-dot" cx="83" cy="51" r="5"/>',
      'wheel-grip': '<circle cx="50" cy="49" r="34"/><circle cx="116" cy="49" r="31"/><path d="M50 15v68M16 49h68M116 18v62M85 49h62"/><path class="index-accent" d="m69 24 12 8-12 8m22 34-12-8 12-8"/>',
      'obelisk-rise': '<path d="M24 80h120M42 80l62-57 12 13-68 44z"/><circle cx="42" cy="80" r="5"/><path class="index-accent" d="M104 23 143 9"/><path d="m133 7 10 2-4 9"/>',
      'obelisk-fall': '<path d="M18 82h124M43 82l73-54 9 14-76 40z"/><circle cx="43" cy="82" r="5"/><path class="index-accent" d="M116 28 78 9"/><path d="m84 18-6-9 10-2"/>',
      ravine: '<path d="M12 74h36M112 74h36M48 74 112 37"/><path d="M43 68v18m74-18v18"/><circle class="index-dot" cx="83" cy="54" r="7"/><path class="index-accent" d="M83 61v20"/>',
      pulley: '<circle cx="80" cy="28" r="18"/><path d="M62 28v43M98 28v43M49 71h26v17H49zm36 0h26v17H85z"/><path class="index-accent" d="M80 10v-7M49 62v-15m62 15v-27"/>',
      elastotennis: '<circle class="index-dot" cx="54" cy="49" r="8"/><path d="M100 18c18 16 18 46 0 62M92 25c12 12 12 36 0 48"/><path class="index-accent" d="M17 49h58m-10-9 10 9-10 9"/>',
      matchbox: '<rect x="30" y="33" width="100" height="48" rx="3"/><rect class="index-accent index-fill" x="66" y="16" width="29" height="17" rx="2"/><path d="M18 88h124"/><path class="index-accent" d="M22 22h30m-9-8 9 8-9 8"/>',
      'flight-impact': '<path d="M20 66c36-52 76-52 120 0"/><circle class="index-dot" cx="85" cy="27" r="6"/><path class="index-accent" d="m85 33 24 42m-10-4 10 4 3-10"/><path d="M17 77h126"/>',
      funicular: '<path d="m17 79 126-54"/><rect x="42" y="48" width="31" height="22" transform="rotate(-23 57 59)"/><rect x="99" y="24" width="31" height="22" transform="rotate(-23 114 35)"/><path class="index-accent" d="M57 46 115 21"/><circle cx="80" cy="13" r="7"/>',
      emerald: '<path d="M23 69h114"/><circle cx="50" cy="53" r="16"/><circle cx="107" cy="58" r="11"/><path class="index-accent" d="M12 34h54m-10-9 10 9-10 9"/><path d="m98 15 10 12-10 12-10-12z"/>',
      'collision-equivalence': '<circle cx="41" cy="48" r="16"/><circle cx="119" cy="48" r="16"/><path class="index-accent" d="M58 48h43m-8-8 8 8-8 8"/><path d="M41 19v-9m78 9v-9M41 86v-9m78 9v-9"/>',
      'superbike-flat': '<circle cx="80" cy="49" r="39"/><path d="M41 49h78M80 10v78"/><path class="index-accent" d="M119 49c0 21-17 39-39 39"/><circle class="index-dot" cx="113" cy="72" r="6"/>',
      'superbike-bank': '<path d="M19 74 141 38M30 82 150 47"/><circle cx="102" cy="46" r="10"/><path class="index-accent" d="M102 46 73 26m7-2-7 2 2 7"/><path d="M18 85h134"/>',
      'coaster-loop': '<circle cx="80" cy="50" r="39"/><path d="M13 89h134"/><circle class="index-dot" cx="80" cy="11" r="7"/><path class="index-accent" d="M80 18v28m-7-9 7 9 7-9"/>',
      'coaster-flight': '<path d="M13 77c28 0 38-49 67-49"/><path class="index-accent" d="M80 28c24 0 43 16 62 48"/><circle class="index-dot" cx="80" cy="28" r="6"/><path d="M12 86h136"/>',
      'lazy-ride': '<ellipse cx="80" cy="51" rx="57" ry="26"/><path d="M80 8v70M23 51h114"/><circle class="index-dot" cx="129" cy="38" r="7"/><path class="index-accent" d="M129 38 82 50m11-8-11 8 12 3"/>',
      'wall-car': '<path d="M31 12v73M129 12v73M31 22c0 12 98 12 98 0M31 75c0-12 98-12 98 0"/><rect class="index-accent index-fill" x="103" y="39" width="22" height="17" rx="3"/><path d="M114 39V19"/>',
      'wall-bike': '<path d="M28 12v73M132 12v73M28 23c0 12 104 12 104 0M28 75c0-12 104-12 104 0"/><circle cx="111" cy="57" r="8"/><circle cx="128" cy="57" r="8"/><path class="index-accent" d="M111 57 121 31 130 49M121 31l-8-9"/>',
      'sphere-bowl': '<path d="M24 28c0 74 112 74 112 0"/><circle class="index-dot" cx="52" cy="62" r="12"/><path class="index-accent" d="M52 50c14-25 39-28 58-12"/>',
      stopclock: '<circle cx="80" cy="48" r="37"/><path d="M80 11V3M65 3h30M80 48l20-16"/><path class="index-accent" d="M80 48 57 68"/><circle class="index-dot" cx="80" cy="48" r="5"/>',
      'spring-single': '<path d="M12 48h18l7-12 12 24 12-24 12 24 12-24 7 12h18"/><rect class="index-accent index-fill" x="110" y="30" width="34" height="36" rx="3"/><path d="M8 22v52"/>',
      'spring-coupled': '<path d="M8 48h15l6-11 10 22 10-22 6 11"/><rect x="55" y="31" width="27" height="34"/><path d="M82 48h9l5-10 10 20 10-20 5 10"/><rect class="index-accent index-fill" x="121" y="31" width="27" height="34"/>',
      'spring-absorber': '<path d="M8 49h16l6-10 9 20 9-20 7 10"/><rect x="55" y="31" width="28" height="36"/><path class="index-accent" d="M69 31V18h15l5-9 8 18 8-18 6 9h14"/><rect class="index-accent index-fill" x="125" y="6" width="25" height="24"/>',
      clootcrans: '<path d="M18 76 59 23 91 76 133 39"/><path class="index-accent" d="M18 76c17 12 55 13 73 0 18 13 38 3 42-37"/><circle class="index-dot" cx="43" cy="43" r="4"/><circle class="index-dot" cx="111" cy="58" r="4"/>',
      'speed-hump': '<path d="M12 76h136M43 76c8-27 23-27 31 0"/><circle cx="53" cy="49" r="8"/><circle cx="81" cy="49" r="8"/><path d="M43 49h49l14 18"/><path class="index-accent" d="M67 76v-26m-7 8 7-8 7 8"/>',
      'overbalanced-wheel': '<circle cx="80" cy="49" r="39"/><path d="M80 10v78M41 49h78M53 22l54 54M107 22 53 76"/><circle class="index-dot" cx="113" cy="29" r="7"/><circle cx="53" cy="69" r="4"/><path class="index-accent" d="M129 49c0 27-22 49-49 49"/>',
      syphon: '<path d="M17 66h47v20H17zm79 0h47v20H96z"/><path class="index-accent" d="M49 66V23c0-17 62-17 62 0v59"/><path d="m104 73 7 9 7-9"/>',
      vase: '<path d="M37 18h86l-9 66H46z"/><path d="M47 55h67"/><path class="index-accent" d="M71 55V26h47v-9M91 55v24"/><path d="m84 70 7 9 7-9"/>',
      'curious-wheel': '<circle cx="80" cy="49" r="39"/><path d="M80 10v78M41 49h78"/><path class="index-accent" d="M80 49 112 27M80 49 56 76"/><circle class="index-dot" cx="112" cy="27" r="8"/><circle cx="56" cy="76" r="5"/>',
      'lazy-pursuit': '<path d="M14 78h132M27 69 72 52 132 20"/><path class="index-accent" d="M27 69h27c19 0 22-31 42-31h36"/><circle class="index-dot" cx="96" cy="38" r="5"/>',
      aviator: '<path d="m80 12 13 33 35 4-28 20 9 18-29-13-29 13 9-18-28-20 35-4z"/><path class="index-accent" d="M21 79 80 36m-9 2 9-2-3 9"/>',
      target: '<circle cx="124" cy="28" r="20"/><circle cx="124" cy="28" r="11"/><circle class="index-dot" cx="124" cy="28" r="4"/><path class="index-accent" d="M18 78c32-60 71-67 106-50"/><path d="M14 87h134"/>',
      'resistor-pyramid': '<path d="M80 10 28 73h104zM28 73 80 49l52 24M80 10v39"/><path class="index-accent" d="M80 10 132 73"/><circle class="index-dot" cx="80" cy="10" r="4"/><circle class="index-dot" cx="28" cy="73" r="4"/>',
      'resistor-tetrahedron': '<path d="M80 10 25 75h110zM80 10 80 57M25 75l55-18 55 18"/><path class="index-accent" d="M80 10 25 75"/><circle class="index-dot" cx="80" cy="10" r="4"/><circle class="index-dot" cx="135" cy="75" r="4"/>',
      'resistor-square': '<rect x="34" y="13" width="92" height="70"/><path d="M34 13 80 48l46-35M34 83l46-35 46 35"/><circle cx="80" cy="48" r="5"/><path class="index-accent" d="M34 13h92"/><circle class="index-dot" cx="34" cy="13" r="4"/><circle class="index-dot" cx="126" cy="13" r="4"/>',
      'resistor-cube': '<path d="m35 27 67-14 28 22-8 47-67 6-27-23zM35 27l20 61M102 13l20 69M28 65l102-30M55 88l67-53"/><path class="index-accent" d="M35 27 122 82"/><circle class="index-dot" cx="35" cy="27" r="4"/><circle class="index-dot" cx="122" cy="82" r="4"/>',
      transmission: '<path d="M15 65h25m80 0h25M40 65c12-29 28-29 40 0s28 29 40 0"/><path class="index-accent" d="M24 29h112m-10-9 10 9-10 9"/><path d="M15 75h130"/>',
      rms: '<path d="M12 49h136M80 10v78"/><path class="index-accent" d="M12 49c17-48 35-48 52 0s35 48 52 0 21-18 32-20"/><path d="M15 27h130"/>',
      kettle: '<path d="M44 31h66l-7 54H51zM110 43c27 0 27 31-3 31"/><path d="M38 85h80"/><path class="index-accent" d="M58 22c-8-10 6-11 0-20m18 20c-8-10 6-11 0-20m18 20c-8-10 6-11 0-20"/>',
      'hollow-moon': '<circle cx="80" cy="48" r="38"/><circle cx="80" cy="48" r="20"/><path d="M12 48h136"/><path class="index-accent" d="M42 48h76"/><circle class="index-dot" cx="80" cy="48" r="4"/>',
      'low-orbit': '<circle cx="80" cy="49" r="21"/><ellipse class="index-accent" cx="80" cy="49" rx="61" ry="34"/><circle class="index-dot" cx="138" cy="40" r="5"/><path d="m126 27 12 13-15 7"/>',
      weightless: '<circle cx="80" cy="49" r="20"/><circle class="index-accent" cx="80" cy="49" r="38"/><circle class="index-dot" cx="107" cy="22" r="6"/><path d="M107 28v16m-8-8 8 8 8-8"/>',
      'space-jump': '<path d="M18 82h124M48 82c0-45 20-69 32-69s32 24 32 69"/><path class="index-accent" d="M80 76V19m-8 10 8-10 8 10"/><circle class="index-dot" cx="80" cy="13" r="5"/>',
      'graveyard-orbit': '<circle cx="80" cy="49" r="17"/><circle cx="80" cy="49" r="28"/><circle class="index-accent" cx="80" cy="49" r="42"/><path class="index-accent" d="M111 21c14 10 18 22 11 37"/><circle class="index-dot" cx="122" cy="58" r="5"/>',
      cannonball: '<path d="M14 82h132M22 82l22-28h23"/><circle cx="68" cy="52" r="6"/><path class="index-accent" d="M68 52c35-38 64-21 75 16"/><path d="m132 64 11 4-5 10"/>',
      'earth-moon': '<circle cx="42" cy="49" r="22"/><circle cx="127" cy="49" r="9"/><path d="M64 49h54"/><path class="index-accent" d="M61 39c19-20 39-20 59 0"/><circle class="index-dot" cx="91" cy="27" r="4"/>',
      plumb: '<path d="M80 8v54M68 8h24"/><path class="index-accent" d="M80 23 98 62"/><circle cx="80" cy="69" r="8"/><circle class="index-dot" cx="101" cy="69" r="5"/><path d="M25 85h110"/>',
      'jet-diet': '<path d="m18 47 44-6 20-26 9 2-7 22 45-5 14 8-58 14-19 26-8 1 8-23-43 2z"/><path class="index-accent" d="M20 79h120"/>',
      'solar-escape': '<circle cx="48" cy="49" r="18"/><circle cx="48" cy="49" r="34"/><path class="index-accent" d="M82 49c24 0 29-26 59-31"/><path class="index-accent" d="m131 13 10 5-7 9"/><circle class="index-dot" cx="81" cy="49" r="5"/>',
      'expanding-moon': '<circle cx="55" cy="49" r="17"/><circle class="index-accent" cx="107" cy="49" r="34"/><path d="M76 49h-7m46-40v12m0 56v12M75 9v12M75 77v12"/>',
      asteroid: '<circle cx="32" cy="68" r="16"/><path d="m101 18 18 4 10 17-8 21-21 8-18-13-2-22z"/><path class="index-accent" d="M111 43 51 62m12-11-12 11 15 4"/><circle class="index-dot" cx="111" cy="43" r="4"/>',
      'mote-sphere': '<circle cx="80" cy="48" r="39"/><circle class="index-dot" cx="61" cy="48" r="5"/><path d="M61 48 119 28M61 48l58 20"/><path class="index-accent" d="M119 28 148 36M119 68l29-8"/>',
      'light-rings': '<circle cx="80" cy="48" r="38"/><circle cx="80" cy="48" r="27"/><circle cx="80" cy="48" r="17"/><circle class="index-accent" cx="80" cy="48" r="8"/><path d="M18 88h124"/>',
      'floating-image': '<path d="M22 78c19-48 97-48 116 0"/><path d="M41 78c15-30 63-30 78 0"/><path class="index-accent" d="M54 63 80 25l26 38M80 25v52"/><circle class="index-dot" cx="80" cy="25" r="5"/>',
      'martian-caveman': '<circle cx="32" cy="48" r="14"/><circle cx="128" cy="48" r="14"/><path d="M46 48h68"/><path class="index-accent" d="M47 42 112 31M47 54l65 11"/><circle class="index-dot" cx="112" cy="31" r="4"/><circle class="index-dot" cx="112" cy="65" r="4"/>',
      'strange-fish': '<path d="M12 45h136M26 66c17-16 39-16 56 0-17 16-39 16-56 0zm56 0 14-12v24z"/><path class="index-accent" d="M63 61 99 45l31-23M63 71l36-26"/><circle class="index-dot" cx="51" cy="66" r="3"/>',
      'heated-plate': '<rect x="25" y="51" width="110" height="21" rx="3"/><path class="index-accent" d="M43 43c-8-11 6-13 0-28m25 28c-8-11 6-13 0-28m25 28c-8-11 6-13 0-28m25 28c-8-11 6-13 0-28"/><path d="M18 80h124"/>',
      'heated-cube': '<path d="m47 31 55-13 29 23-8 39-56 8-29-23zM47 31l20 57M102 18l21 62M38 65l93-24"/><path class="index-accent" d="M70 8v16m-7-8 7 8 7-8M92 88v-16m-7 8 7-8 7 8"/>',
      'fridge-room': '<rect x="45" y="12" width="70" height="72" rx="3"/><path d="M45 43h70M103 25v8M103 56v10"/><path class="index-accent" d="M28 48h17m-9-8 9 8-9 8M115 48h17m-8-8 8 8-8 8"/>',
      'desert-ice': '<path d="M12 79h136M22 79l23-24 21 24m22 0 24-31 27 31"/><rect x="67" y="58" width="25" height="21"/><circle cx="124" cy="21" r="13"/><path class="index-accent" d="M124 2v7m0 24v7M105 21h7m24 0h7"/>',
      'cold-earth': '<circle cx="80" cy="49" r="38"/><path d="M42 49h76M80 11v76"/><path class="index-accent" d="M48 29c16-11 48-11 64 0M48 69c16 11 48 11 64 0"/><circle class="index-dot" cx="80" cy="11" r="5"/>',
      'crown-balance': '<path d="M18 29h124M80 16v62M40 29 24 62h32zM120 29l-16 33h32z"/><path class="index-accent" d="m27 60 7-20 7 20m73 0 6-20 7 20"/><circle class="index-dot" cx="80" cy="29" r="4"/>',
      'galileo-balance': '<path d="M18 28h124M80 16v66M38 28 24 69h28zM122 28l-14 41h28z"/><path class="index-accent" d="M15 70h45M100 70h45M28 49h20m64 8h20"/>',
      'balanced-scales': '<path d="M18 25h124M80 14v67M40 25 25 61h30zM120 25l-15 36h30z"/><path class="index-accent" d="M20 62h40v19H20zm80 0h40v19h-40z"/><circle class="index-dot" cx="120" cy="52" r="6"/>',
      'two-balls': '<path d="M12 48h136M18 82h124"/><circle cx="48" cy="40" r="16"/><circle cx="112" cy="67" r="13"/><path class="index-accent" d="M48 24V8M112 54V29"/><path d="m41 15 7-7 7 7m57 22 7-8"/>',
      'floating-cylinders': '<path d="M12 55h136M18 84h124"/><rect x="35" y="23" width="28" height="56" rx="3"/><rect x="96" y="37" width="28" height="42" rx="3" transform="rotate(12 110 58)"/><path class="index-accent" d="M35 55h28M96 55h30"/>',
      'hydrostatic-paradox': '<path d="M18 18 36 80h34V18M90 18v62h34l18-62"/><path class="index-accent" d="M28 51h42M90 51h42"/><path d="M36 80h88"/>',
      pistons: '<path d="M20 31h42v49H20zm78 0h42v49H98zM62 68h36"/><path d="M14 31h54M90 31h56"/><path class="index-accent" d="M41 13v30m-8-9 8 9 8-9M119 49v-30m-8 9 8-9 8 9"/>',
      'floating-bar': '<path d="M12 58h136M18 84h124"/><rect x="43" y="36" width="81" height="18" rx="3" transform="rotate(20 83 45)"/><path class="index-accent" d="M78 52v28m-8-8 8 8 8-8"/><circle class="index-dot" cx="78" cy="52" r="4"/>',
      'mile-tower': '<path d="M62 86 72 10h16l10 76zM45 86h70"/><path d="M66 60h28M69 39h22"/><path class="index-accent" d="M112 82V16m-8 9 8-9 8 9"/>',
      'time-left': '<circle cx="80" cy="48" r="37"/><path d="M80 11V4M65 4h30M80 48l19-16"/><path class="index-accent" d="M80 48 58 70"/><path d="M127 23v50"/><circle class="index-dot" cx="80" cy="48" r="4"/>',
      'midas-room': '<path d="M23 20h114v64H23zM23 20l20 14h74l20-14M43 34v50M117 34v50"/><path class="index-accent" d="M48 71h64M48 57h64M57 43v41M80 43v41M103 43v41"/>',
      'great-pyramid': '<path d="M15 82 80 10l65 72zM80 10v72M15 82h130"/><path class="index-accent" d="M32 63h96M48 45h64M64 27h32"/><circle class="index-dot" cx="80" cy="10" r="4"/>',
      lawnchair: '<path d="M58 63h44v20H58zM65 83v9m30-9v9M80 63V42"/><circle cx="49" cy="23" r="18"/><circle cx="80" cy="18" r="18"/><circle cx="111" cy="23" r="18"/><path class="index-accent" d="M49 41 80 63M80 36v27M111 41 80 63"/>',
      breathing: '<path d="M80 12v34M80 31 57 44M80 31l23 13"/><path d="M57 44c-24 3-30 35-8 41 17 5 27-12 31-39M103 44c24 3 30 35 8 41-17 5-27-12-31-39"/><path class="index-accent" d="M19 20h31m-9-9 9 9-9 9M110 20h31m-22-9-9 9 9 9"/>',
      'cloakroom-collision': '<path d="M18 20h124M30 20v62m25-62v62m25-62v62m25-62v62m25-62v62"/><path class="index-accent" d="M55 42h25M55 61h25"/><circle class="index-dot" cx="67" cy="42" r="4"/><circle class="index-dot" cx="67" cy="61" r="4"/>',
      'meteor-bayes': '<path d="M18 48h33M51 48 91 23M51 48l40 25M91 23h50M91 73h50"/><path class="index-accent" d="M91 23h50"/><circle class="index-dot" cx="51" cy="48" r="4"/><path d="m115 10 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/>',
      'last-red': '<rect x="16" y="33" width="16" height="30"/><rect x="36" y="33" width="16" height="30"/><rect x="56" y="33" width="16" height="30"/><rect x="76" y="33" width="16" height="30"/><rect x="96" y="33" width="16" height="30"/><rect x="116" y="33" width="16" height="30"/><path class="index-accent" d="M16 33h16v30H16zm40 0h16v30H56zm60 0h16v30h-16z"/><path d="M124 22v-9m-6 5 6-5 6 5"/>',
      'firefly-walk': '<path d="M15 72h130M28 65V79m26-14V79m26-14V79m26-14V79m26-14V79"/><path class="index-accent" d="m28 50 26-18 26 20 26-31 26 29"/><circle class="index-dot" cx="80" cy="52" r="6"/>',
      'constellation-coupons': '<path d="m25 18 5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1zm55 17 5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1zm50-23 5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1"/><path class="index-accent" d="M25 75h105"/><circle class="index-dot" cx="105" cy="75" r="5"/>',
      'chord-factory': '<circle cx="80" cy="48" r="39"/><path d="M43 37 116 66M80 9v78M42 48h76"/><path class="index-accent" d="M43 37 116 66"/><circle class="index-dot" cx="80" cy="48" r="4"/>',
      'odd-bricks': '<path d="M29 77h82V15H49v42h42V35H69"/><path class="index-accent" d="M29 77h102V5M49 57h62M69 35h42"/><circle class="index-dot" cx="29" cy="77" r="4"/>',
      'lantern-parity': '<circle cx="80" cy="48" r="34"/><circle cx="80" cy="14" r="5"/><circle cx="104" cy="24" r="5"/><circle cx="114" cy="48" r="5"/><circle cx="104" cy="72" r="5"/><circle cx="80" cy="82" r="5"/><circle cx="56" cy="72" r="5"/><circle cx="46" cy="48" r="5"/><circle cx="56" cy="24" r="5"/><path class="index-accent" d="M80 14 104 24"/>',
      'archivist-rings': '<path d="M30 82h100M52 82V17M108 82V17M80 82V17"/><path d="M40 76h80M48 68h64M57 60h46M65 52h30"/><path class="index-accent" d="M52 42c12-21 44-21 56 0m-9-4 9 4-4-9"/>',
      'euclid-rectangle': '<rect x="17" y="19" width="126" height="62"/><path d="M79 19v62M17 50h62M48 19v31M79 50h31v31M110 50v31"/><path class="index-accent" d="M17 19h62v62H17z"/>',
      'odd-doorways': '<circle cx="30" cy="24" r="7"/><circle cx="80" cy="13" r="7"/><circle cx="130" cy="28" r="7"/><circle cx="42" cy="75" r="7"/><circle cx="98" cy="77" r="7"/><path d="M36 28 74 17M86 17l38 8M33 31l6 37M48 73l43 3M105 72l21-38M37 29l56 43"/><path class="index-accent" d="M80 13 98 77"/>',
      'bellhop-puzzle': '<rect x="35" y="5" width="90" height="86"/><path d="M57.5 5v86M80 5v86M102.5 5v86M35 26.5h90M35 48h90M35 69.5h90"/><path class="index-accent" d="M80 69.5h22.5V91H80z"/><circle class="index-dot" cx="91" cy="80" r="4"/>',
      'lamp-network': '<circle cx="25" cy="48" r="6"/><circle cx="54" cy="18" r="6"/><circle cx="96" cy="18" r="6"/><circle cx="135" cy="48" r="6"/><circle cx="96" cy="78" r="6"/><circle cx="54" cy="78" r="6"/><path d="M30 44 49 23M60 18h30M102 22l28 22M130 53l-28 21M90 78H60M49 74 30 53M54 24l42 48M96 24 54 72"/><path class="index-accent" d="M25 48h110"/>',
      'domino-table': '<rect x="14" y="22" width="132" height="52"/><path d="M14 48h132M36 22v52M58 22v52M80 22v52M102 22v52M124 22v52"/><path class="index-accent" d="M14 22h44v26H14zM58 48h22v26H58z"/>',
      'spy-table': '<circle cx="80" cy="48" r="29"/><circle cx="80" cy="11" r="6"/><circle cx="106" cy="22" r="6"/><circle cx="117" cy="48" r="6"/><circle cx="106" cy="74" r="6"/><circle cx="80" cy="85" r="6"/><circle cx="54" cy="74" r="6"/><circle cx="43" cy="48" r="6"/><circle cx="54" cy="22" r="6"/><path class="index-accent" d="M80 11 106 22"/>',
      'radio-wheel': '<circle cx="80" cy="48" r="35"/><path d="m80 13 33 24-13 39H60L47 37zM80 48 80 13M80 48l33-11M80 48l20 28M80 48 60 76M80 48 47 37"/><circle class="index-dot" cx="80" cy="48" r="6"/><path class="index-accent" d="m80 13 33 24-13 39H60L47 37z"/>',
      'lifeboat-reliability': '<circle cx="20" cy="48" r="6"/><circle cx="80" cy="20" r="6"/><circle cx="80" cy="76" r="6"/><circle cx="140" cy="48" r="6"/><path d="M25 45 74 23M25 51l49 22M86 23l49 22M86 73l49-22"/><path class="index-accent" d="M25 45 74 23M86 23l49 22"/>',
      'crate-flow': '<circle cx="18" cy="48" r="6"/><circle cx="61" cy="20" r="6"/><circle cx="61" cy="76" r="6"/><circle cx="105" cy="20" r="6"/><circle cx="105" cy="76" r="6"/><circle cx="144" cy="48" r="6"/><path d="M24 44 55 24M24 52l31 20M67 20h32M67 74h32M61 26v44M111 24l27 20M111 72l27-20"/><path class="index-accent" d="M83 8v80"/>',
      'tunnel-echo': '<path d="M14 82V22h132v60M14 82h132"/><path d="M30 66c18-24 18-24 36 0s18 24 36 0 18-24 36 0"/><path class="index-accent" d="M28 38h100m-10-9 10 9-10 9"/><circle class="index-dot" cx="28" cy="38" r="5"/>',
      'beat-envelope': '<path d="M10 48h140M14 48c8-36 16-36 24 0s16 36 24 0 16-36 24 0 16 36 24 0 16-36 36-8"/><path class="index-accent" d="M14 48c18-25 36-25 54 0s36 25 54 0 18-18 24-8M14 48c18 25 36 25 54 0s36-25 54 0 18 18 24 8"/>',
      'changing-pipe': '<path d="M18 24v48h124M18 24h124"/><path d="M18 48c18-31 36-31 54 0s36 31 54 0"/><path class="index-accent" d="M142 20v56M134 24h16M134 72h16"/><circle class="index-dot" cx="18" cy="48" r="5"/>',
      'doppler-siren': '<circle cx="80" cy="48" r="8"/><path d="M80 40V28M72 45l-12-7M72 53l-12 7"/><path d="M104 31c13 8 13 26 0 34M116 21c24 14 24 40 0 54M52 33c-10 8-10 22 0 30M42 24c-20 14-20 34 0 48"/><path class="index-accent" d="M62 14h43m-9-8 9 8-9 8"/>',
      'violin-decibel': '<path d="M26 15c18 10 18 56 0 66M50 15c18 10 18 56 0 66M74 15c18 10 18 56 0 66M98 15c18 10 18 56 0 66M122 15c18 10 18 56 0 66"/><path d="M20 15h112M20 81h112"/><path class="index-accent" d="M15 48h130"/><circle class="index-dot" cx="128" cy="48" r="6"/>',
      'pulse-dispersion': '<path d="M8 49h144M12 49c12-2 18-8 24-18 7-11 13-12 20 2 7 15 13 29 20 9 7-22 13-43 20-12 7 29 13 34 20 10 7-21 13-12 20-2 5 7 9 10 16 11"/><path class="index-accent" d="M23 72c24-20 48-20 72 0s39 11 54-1"/><path class="index-accent" d="M96 16h42m-9-8 9 8-9 8"/>',
      'current-compass': '<circle cx="80" cy="48" r="34"/><circle cx="80" cy="48" r="7"/><path d="M80 5v20M80 71v20M37 48h20M103 48h20"/><path d="M105 25c12 12 12 34 0 46M55 71c-12-12-12-34 0-46"/><path class="index-accent" d="M116 48h27m-10-9 10 9-10 9"/><circle class="index-dot" cx="116" cy="48" r="5"/>',
      'loop-torque': '<path d="m48 27 64-12v54L48 81zM48 27l64 42M112 15 48 81"/><path d="M14 48h34M112 48h34"/><path class="index-accent" d="M80 48 99 22m-2 10 2-10-10 3"/><path class="index-accent" d="M31 35v26M21 48h20"/>',
      'rail-brake': '<path d="M15 20h130M15 76h130M92 20v56"/><path d="M31 34v28m-7-7 7 7 7-7"/><path class="index-accent" d="M92 48h39m-9-9 9 9-9 9"/><circle cx="48" cy="48" r="3"/><circle cx="63" cy="34" r="3"/><circle cx="63" cy="62" r="3"/><circle cx="78" cy="48" r="3"/>',
      'isotope-gate': '<path d="M16 48h34"/><path d="M50 48c0-43 49-43 49 0s-49 43-49 0M50 48c0-31 37-31 37 0s-37 31-37 0"/><path class="index-accent" d="M87 48h57M99 35v26M116 31v34"/><circle class="index-dot" cx="99" cy="48" r="4"/><circle class="index-dot" cx="116" cy="48" r="4"/>',
      'field-corkscrew': '<path d="M14 48h132"/><path d="M25 48c9-35 18-35 27 0s18 35 27 0 18-35 27 0 18 35 27 0"/><path class="index-accent" d="M18 18h124m-10-9 10 9-10 9"/><circle class="index-dot" cx="79" cy="48" r="5"/>',
      'escape-cone': '<path d="M18 18c28 15 28 45 0 60M142 18c-28 15-28 45 0 60M18 18h124M18 78h124"/><path d="M80 48 35 29M80 48 35 67M80 48l45-19M80 48l45 19"/><path class="index-accent" d="M80 48 125 48"/><circle class="index-dot" cx="80" cy="48" r="5"/>',
      'sideways-tick': '<path d="M44 14v68M116 14v68M37 14h86M37 82h86"/><path d="M44 82 116 14M44 14l72 68"/><path class="index-accent" d="M18 84 142 12"/><circle class="index-dot" cx="80" cy="48" r="5"/>',
      'muon-beach': '<path d="M18 82h124M31 82V16M31 16h50"/><path d="M80 16c24 12 36 34 40 66"/><path class="index-accent" d="M80 16 113 70m-3-12 3 12-12-3"/><circle class="index-dot" cx="80" cy="16" r="5"/><circle cx="113" cy="70" r="5"/>',
      'train-snapshot': '<path d="M15 71h130M34 55h82l17 16H24zM48 55V37h51v18"/><circle cx="48" cy="73" r="9"/><circle cx="112" cy="73" r="9"/><path class="index-accent" d="M25 22h108m-10-9 10 9-10 9"/><path d="M48 34v-18M99 34v-18"/>',
      'closing-speed': '<path d="M14 48h132"/><path d="M26 33h31v30H26zM103 33h31v30h-31z"/><path class="index-accent" d="M57 48h29m-9-9 9 9-9 9M103 48H74m9-9-9 9 9 9"/>',
      'red-echo': '<path d="M23 16v64M137 16v64"/><path d="M23 48 137 25M137 25 23 71"/><path class="index-accent" d="M24 48 137 25"/><path d="M119 13h22m-9-8 9 8-9 8"/><circle class="index-dot" cx="137" cy="25" r="5"/>',
      'standing-still': '<path d="M17 72h126M28 72l34-42h43l27 42"/><path d="M62 30 84 12l21 18"/><path class="index-accent" d="M25 17h74m-10-9 10 9-10 9"/><path class="index-accent" d="M99 47H65m10-9-10 9 10 9"/><circle class="index-dot" cx="84" cy="12" r="5"/>',
      'silent-switchboard': '<path d="M18 70h124M30 70V28h100v42"/><circle cx="48" cy="48" r="8"/><circle cx="80" cy="48" r="8"/><circle cx="112" cy="48" r="8"/><path class="index-accent" d="M22 18h76m-10-9 10 9-10 9"/><circle class="index-dot" cx="124" cy="18" r="5"/>',
      'weather-chain': '<circle cx="45" cy="48" r="25"/><circle cx="115" cy="48" r="25"/><path d="M69 38h22m-8-8 8 8-8 8M91 58H69m8-8-8 8 8 8"/><path class="index-accent" d="M31 48a14 14 0 0 1 28 0M101 56c8-20 20-20 28 0"/><circle class="index-dot" cx="45" cy="48" r="4"/>',
      'room-mixing': '<rect x="12" y="24" width="38" height="48"/><rect x="61" y="24" width="38" height="48"/><rect x="110" y="24" width="38" height="48"/><path d="M50 48h11M99 48h11"/><path class="index-accent" d="M23 64h16M68 64h24M119 64h18"/><circle class="index-dot" cx="80" cy="40" r="5"/>',
      'reversible-traffic': '<circle cx="80" cy="15" r="7"/><circle cx="30" cy="76" r="7"/><circle cx="130" cy="76" r="7"/><path d="M75 21 35 70M85 21l40 49M38 76h84"/><path class="index-accent" d="M50 48h29m-8-8 8 8-8 8M110 48H81m8-8-8 8 8 8"/>',
      'fair-game': '<path d="M18 48 55 24M18 48l37 24M55 24l38-13M55 24l38 25M55 72l38-24M55 72l38 13M93 11l45 8M93 49h45M93 85l45-8"/><path class="index-accent" d="M18 48 55 24l38 25 45-30"/><circle class="index-dot" cx="18" cy="48" r="5"/>',
      'stopping-time': '<path d="M14 48h132M32 15v66M128 15v66"/><path d="m32 48 16-17 16 17 16-17 16 17 16-17 16 17"/><path class="index-accent" d="M32 48 48 31l16 17 16-17 16 17 16-17 16 17"/><circle class="index-dot" cx="128" cy="48" r="5"/>',
      'sampling-means': '<path d="M12 76h136M23 76c12-3 14-32 28-32s17 32 29 32M70 76c15-2 18-59 34-59s20 57 34 59"/><path class="index-accent" d="M70 76c15-2 18-59 34-59s20 57 34 59"/><circle class="index-dot" cx="104" cy="17" r="5"/>',
      'confidence-nets': '<path d="M23 14v68M23 22h76M23 36h104M23 50h69M23 64h116M23 78h88"/><path d="M99 17v10M127 31v10M92 45v10M139 59v10M111 73v10"/><path class="index-accent" d="M80 9v78"/><circle class="index-dot" cx="80" cy="50" r="5"/>',
      'coin-likelihood': '<path d="M13 78h134M25 78C47 78 55 66 68 44s26-31 43-17 20 42 24 51"/><path class="index-accent" d="M108 19v59"/><circle class="index-dot" cx="108" cy="22" r="6"/>',
      'edge-result': '<path d="M12 76h136M20 76c15 0 20-58 60-58s45 58 60 58"/><path class="index-accent" d="M20 76c7 0 11-10 15-23M140 76c-7 0-11-10-15-23"/><circle class="index-dot" cx="125" cy="53" r="5"/>',
      'bayes-tosses': '<path d="M12 76h136M20 76c14-2 20-48 42-48s28 46 38 48M41 76c12-1 16-59 39-59s29 58 39 59"/><path class="index-accent" d="M41 76c12-1 16-59 39-59s29 58 39 59"/><circle class="index-dot" cx="80" cy="17" r="5"/>',
      'regression-misses': '<path d="M14 78h132M23 78V14M31 69 132 22"/><path d="M43 59v9M64 51v8M86 36v13M111 31v3"/><circle cx="43" cy="59" r="4"/><circle cx="64" cy="51" r="4"/><circle cx="86" cy="36" r="4"/><circle cx="111" cy="31" r="4"/><path class="index-accent" d="M31 69 132 22"/>',
      'lantern-system': '<path d="M17 22h126M17 48h126M17 74h126M45 13v70M80 13v70M115 13v70"/><path class="index-accent" d="M25 22h82M51 48h78M36 74h92"/><circle class="index-dot" cx="80" cy="48" r="5"/>',
      'matrix-logo': '<path d="M12 82h64M44 10v76M84 82h64M116 10v76"/><path d="m27 63 18-32 17 32z"/><path class="index-accent" d="m99 70 25-46 14 28z"/><circle class="index-dot" cx="124" cy="24" r="5"/>',
      'determinant-carpet': '<path d="M13 78h61M26 16v68M86 78h61M99 16v68"/><path d="m29 67 32-9-19-31z"/><path class="index-accent index-fill" d="m94 67 43-38-22-8z"/>',
      'eigen-directions': '<circle cx="80" cy="48" r="35"/><path d="M80 9v78M41 48h78"/><path class="index-accent" d="M54 74 106 22M54 22l52 52"/><circle class="index-dot" cx="106" cy="22" r="5"/>',
      'migration-engine': '<rect x="15" y="25" width="48" height="47" rx="8"/><rect x="97" y="25" width="48" height="47" rx="8"/><path d="M63 38h34m-9-8 9 8-9 8M97 59H63m9-8-9 8 9 8"/><path class="index-accent" d="M25 62h27M108 62h26"/><circle class="index-dot" cx="80" cy="38" r="5"/>',
      'calibration-projection': '<path d="M16 80h128M28 80V13"/><path d="M38 67 126 23"/><circle cx="42" cy="61" r="4"/><circle cx="66" cy="57" r="4"/><circle cx="92" cy="34" r="4"/><circle cx="119" cy="31" r="4"/><path class="index-accent" d="M42 61v3M66 57v-5M92 34v7M119 31v-4"/>',
      'camera-tangent': '<path d="M14 78h132M24 78V13M31 72c18 0 30-55 49-55s26 48 54 55"/><path d="M54 54 103 28"/><path class="index-accent" d="M45 66 113 21"/><circle class="index-dot" cx="79" cy="43" r="5"/>',
      'river-pen': '<path d="M12 19h136M35 31v43h90V31"/><path d="M35 74h90"/><path class="index-accent" d="M35 31v43h90V31"/><circle class="index-dot" cx="80" cy="74" r="5"/>',
      'reservoir-flow': '<path d="M12 48h136M22 17v62"/><path d="M22 29c24-31 42 50 64 19s31-30 53 12"/><path class="index-accent" d="M22 29c24-31 42 50 64 19s31-30 53 12"/><circle class="index-dot" cx="86" cy="48" r="5"/>',
      'paint-tail': '<path d="M12 78h136M22 78V15M23 22c18 18 35 31 55 39s39 12 66 15"/><path class="index-accent index-fill" d="M23 22c18 18 35 31 55 39v17H23z"/><path class="index-accent" d="M78 61v17"/>',
      'cosine-taylor': '<path d="M12 48h136M22 16v64M22 48c18-34 36-34 54 0s36 34 62 0"/><path class="index-accent" d="M22 48c17-32 36-35 54 0s36 31 62 1"/><circle class="index-dot" cx="104" cy="70" r="5"/>',
      'fourier-square': '<path d="M12 48h136M20 69V27h31v42h31V27h31v42h29"/><path class="index-accent" d="M20 69c7 0 8-50 16-45s6 50 15 45 7-50 16-45 6 50 15 45 7-50 16-45 6 50 15 45 7-50 29-42"/>',
      'vanishing-tracer': '<path d="M12 78h136M22 78V14M23 22c17 18 31 31 47 40s36 13 70 15"/><path class="index-accent" d="M23 22c17 18 31 31 47 40s36 13 70 15"/><circle class="index-dot" cx="70" cy="62" r="5"/>',
      'moving-temperature': '<path d="M12 78h136M22 78V14M24 63 139 24"/><path d="M24 26c22 0 30 37 52 32s38-27 63-34"/><path class="index-accent" d="M24 26c22 0 30 37 52 32s38-27 63-34"/><circle class="index-dot" cx="76" cy="58" r="5"/>',
      'safe-levels': '<path d="M14 48h132M48 18v60M112 18v60"/><path d="M25 38h20m-8-8 8 8-8 8M69 58H51m8-8-8 8 8 8M72 38h37m-8-8 8 8-8 8M134 58h-19m8-8-8 8 8 8"/><circle class="index-dot" cx="112" cy="48" r="6"/>',
      'two-modes': '<path d="M12 78h136M22 78V14M27 72 132 18M30 20l98 54"/><path class="index-accent" d="M27 72 132 18"/><circle class="index-dot" cx="80" cy="48" r="5"/>',
      'predator-prey': '<path d="M12 78h136M22 78V14"/><ellipse cx="82" cy="47" rx="43" ry="25"/><ellipse cx="82" cy="47" rx="27" ry="15"/><path class="index-accent" d="M39 47c0-14 19-25 43-25s43 11 43 25"/><circle class="index-dot" cx="125" cy="47" r="5"/>',
      'euler-explosion': '<path d="M12 48h136M22 17v62"/><path d="M22 22c20 22 39 36 58 44s39 10 60 11"/><path class="index-accent" d="M22 22 38 72 54 17 70 78 86 13 102 82 118 9 140 87"/>',
      'steepest-step': '<ellipse cx="80" cy="48" rx="58" ry="34"/><ellipse cx="80" cy="48" rx="38" ry="22"/><ellipse cx="80" cy="48" rx="19" ry="11"/><path class="index-accent" d="M80 48 125 22m-4 12 4-12-12 4"/><circle class="index-dot" cx="80" cy="48" r="5"/>',
      'ellipse-rectangle': '<ellipse cx="80" cy="48" rx="61" ry="34"/><path d="M80 48 122 72M80 48 122 24M80 48 38 72M80 48 38 24"/><rect class="index-accent index-fill" x="38" y="24" width="84" height="48"/><circle class="index-dot" cx="122" cy="24" r="5"/>',
      'escaping-flux': '<rect x="33" y="20" width="94" height="56"/><path d="M48 48h22m-8-8 8 8-8 8M92 48h22m-8-8 8 8-8 8"/><path class="index-accent" d="M127 36h20m-8-8 8 8-8 8M74 20V7m-8 8 8-8 8 8"/>',
      'turning-field': '<circle cx="80" cy="48" r="34"/><path d="M80 14c22 0 34 12 34 34s-12 34-34 34"/><path class="index-accent" d="M107 28c10 9 10 31 0 40m-1-10 1 10 9-5"/><circle class="index-dot" cx="114" cy="48" r="5"/>',
      'three-roads': '<circle cx="22" cy="48" r="6"/><circle cx="138" cy="48" r="6"/><path d="M28 48h104M27 44c31-41 74-41 106 0M27 52c31 41 74 41 106 0"/><path class="index-accent" d="M28 48h104"/>',
      'greens-ledger': '<rect x="29" y="18" width="102" height="60"/><path d="M46 35h68M46 48h68M46 61h68M55 28v40M80 28v40M105 28v40"/><path class="index-accent" d="M29 18h102v60H29z"/><circle class="index-dot" cx="131" cy="18" r="5"/>',
    };
    return `<svg class="index-motif-svg" viewBox="0 0 160 96" aria-hidden="true">${drawings[type]}</svg>`;
  }

  function problemCard(problem) {
    const chapterTwo = problem.number.startsWith("2.");
    const chapterThree = problem.number.startsWith("3.");
    const chapterFour = problem.number.startsWith("4.");
    const chapterFive = problem.number.startsWith("5.");
    const chapterSix = problem.number.startsWith("6.");
    const chapterSeven = problem.number.startsWith("7.");
    const chapterEight = problem.number.startsWith("8.");
    const chapterNine = problem.number.startsWith("9.");
    const chapterTen = problem.number.startsWith("10.");
    const chapterEleven = problem.number.startsWith("11.");
    const chapterTwelve = problem.number.startsWith("12.");
    const chapterThirteen = problem.number.startsWith("13.");
    const chapterFourteen = problem.number.startsWith("14.");
    const chapterFifteen = problem.number.startsWith("15.");
    const chapterSixteen = problem.number.startsWith("16.");
    const chapterSeventeen = problem.number.startsWith("17.");
    const chapterEighteen = problem.number.startsWith("18.");
    const chapterNineteen = problem.number.startsWith("19.");
    const chapterTwenty = problem.number.startsWith("20.");
    const chapterTwentyOne = problem.number.startsWith("21.");
    const chapterTwentyTwo = problem.number.startsWith("22.");
    const chapterTwentyThree = problem.number.startsWith("23.");
    const chapterTwentyFour = problem.number.startsWith("24.");
    const chapterTwentyFive = problem.number.startsWith("25.");
    const chapterTwentySix = problem.number.startsWith("26.");
    return `
      <a class="chapter-index-card ${problem.source === "reconstructed" ? "is-reconstructed" : ""} ${problem.source === "extension" ? "is-extension" : ""} ${chapterTwo ? "is-chapter-two" : ""} ${chapterThree ? "is-chapter-three" : ""} ${chapterFour ? "is-chapter-four" : ""} ${chapterFive ? "is-chapter-five" : ""} ${chapterSix ? "is-chapter-six" : ""} ${chapterSeven ? "is-chapter-seven" : ""} ${chapterEight ? "is-chapter-eight" : ""} ${chapterNine ? "is-chapter-nine" : ""} ${chapterTen ? "is-chapter-ten" : ""} ${chapterEleven ? "is-chapter-eleven" : ""} ${chapterTwelve ? "is-chapter-twelve" : ""} ${chapterThirteen ? "is-chapter-thirteen" : ""} ${chapterFourteen ? "is-chapter-fourteen" : ""} ${chapterFifteen ? "is-chapter-fifteen" : ""} ${chapterSixteen ? "is-chapter-sixteen" : ""} ${chapterSeventeen ? "is-chapter-seventeen" : ""} ${chapterEighteen ? "is-chapter-eighteen" : ""} ${chapterNineteen ? "is-chapter-nineteen" : ""} ${chapterTwenty ? "is-chapter-twenty" : ""} ${chapterTwentyOne ? "is-chapter-twenty-one" : ""} ${chapterTwentyTwo ? "is-chapter-twenty-two" : ""} ${chapterTwentyThree ? "is-chapter-twenty-three" : ""} ${chapterTwentyFour ? "is-chapter-twenty-four" : ""} ${chapterTwentyFive ? "is-chapter-twenty-five" : ""} ${chapterTwentySix ? "is-chapter-twenty-six" : ""}" href="${problemHref(problem.number)}">
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
          <span>${problem.source === "extension" ? "Original extension · not in the book" : problem.source === "reconstructed" ? "Reconstructed activity" : "Source-backed adaptation"}</span>
          <strong>Open <span aria-hidden="true">→</span></strong>
        </div>
      </a>`;
  }

  function sectionMarkup({ chapter, source, eyebrow, title, copy, id }) {
    const matching = problems.filter((problem) => problem.number.startsWith(`${chapter}.`) && problem.source === source);
    const mathematics = chapter === "2";
    const statics = chapter === "3";
    const dynamics = chapter === "4";
    const circular = chapter === "5";
    const oscillation = chapter === "6";
    const inventions = chapter === "7";
    const kinematics = chapter === "8";
    const electricity = chapter === "9";
    const gravity = chapter === "10";
    const optics = chapter === "11";
    const heat = chapter === "12";
    const buoyancy = chapter === "13";
    const estimation = chapter === "14";
    const probability = chapter === "15";
    const proof = chapter === "16";
    const combinatorics = chapter === "17";
    const waves = chapter === "18";
    const magnetism = chapter === "19";
    const relativity = chapter === "20";
    const stochastic = chapter === "21";
    const statistics = chapter === "22";
    const linearAlgebra = chapter === "23";
    const calculus = chapter === "24";
    const differentialEquations = chapter === "25";
    const multivariable = chapter === "26";
    return `
      <section class="chapter-index-section ${source === "reconstructed" ? "chapter-index-reconstructed" : ""} ${source === "extension" ? "chapter-index-original-extension" : ""} ${mathematics ? "chapter-index-mathematics" : ""} ${statics ? "chapter-index-statics" : ""} ${dynamics ? "chapter-index-dynamics" : ""} ${circular ? "chapter-index-circular" : ""} ${oscillation ? "chapter-index-oscillation" : ""} ${inventions ? "chapter-index-inventions" : ""} ${kinematics ? "chapter-index-kinematics" : ""} ${electricity ? "chapter-index-electricity" : ""} ${gravity ? "chapter-index-gravity" : ""} ${optics ? "chapter-index-optics" : ""} ${heat ? "chapter-index-heat" : ""} ${buoyancy ? "chapter-index-buoyancy" : ""} ${estimation ? "chapter-index-estimation" : ""} ${probability ? "chapter-index-probability" : ""} ${proof ? "chapter-index-proof" : ""} ${combinatorics ? "chapter-index-combinatorics" : ""} ${waves ? "chapter-index-waves" : ""} ${magnetism ? "chapter-index-magnetism" : ""} ${relativity ? "chapter-index-relativity" : ""} ${stochastic ? "chapter-index-stochastic" : ""} ${statistics ? "chapter-index-statistics" : ""} ${linearAlgebra ? "chapter-index-linear-algebra" : ""} ${calculus ? "chapter-index-calculus" : ""} ${differentialEquations ? "chapter-index-differential-equations" : ""} ${multivariable ? "chapter-index-multivariable" : ""}" aria-labelledby="${id}">
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
      : '<a class="problem-nav-link chapter-index-start" href="?view=chapter&amp;chapter=26">Open Multivariable Calculus <span aria-hidden="true">→</span></a>';
    return `
      <header class="chapter-index-header">
        <a class="chapter-index-brand" href="./"><strong>Perplexing Problems</strong><span>Interactive edition</span></a>
        <span class="chapter-index-complete"><i></i> 14 source chapters complete · 12 extension chapters live</span>
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
        <span class="master-chapter-status">${chapter.extension ? chapter.live ? "Original extension" : "Planned extension" : "Interactive now"}</span>
      </div>
      <h2>${chapter.title}</h2>
      ${chapter.summary ? `<p>${chapter.summary}</p>` : '<p>Mapped from the full book contents.</p>'}
      <div class="master-chapter-card-footer">
        <span>${chapter.count} problems</span>
        <span>${chapter.extension ? "Not in the source book" : `Book p. ${chapter.page}`}</span>
        <strong>${chapter.live ? "Open chapter →" : chapter.extension ? "Original chapter planned" : "Source outline only"}</strong>
      </div>`;
    return chapter.live
      ? `<a class="master-chapter-card is-live ${chapter.extension ? "is-original-extension" : ""} ${chapter.number === "2" ? "is-mathematics" : ""} ${chapter.number === "3" ? "is-statics" : ""} ${chapter.number === "4" ? "is-dynamics" : ""} ${chapter.number === "5" ? "is-circular" : ""} ${chapter.number === "6" ? "is-oscillation" : ""} ${chapter.number === "7" ? "is-inventions" : ""} ${chapter.number === "8" ? "is-kinematics" : ""} ${chapter.number === "9" ? "is-electricity" : ""} ${chapter.number === "10" ? "is-gravity" : ""} ${chapter.number === "11" ? "is-optics" : ""} ${chapter.number === "12" ? "is-heat" : ""} ${chapter.number === "13" ? "is-buoyancy" : ""} ${chapter.number === "14" ? "is-estimation" : ""} ${chapter.number === "15" ? "is-probability" : ""} ${chapter.number === "16" ? "is-proof" : ""} ${chapter.number === "17" ? "is-combinatorics" : ""} ${chapter.number === "18" ? "is-waves" : ""} ${chapter.number === "19" ? "is-magnetism" : ""} ${chapter.number === "20" ? "is-relativity" : ""} ${chapter.number === "21" ? "is-stochastic" : ""} ${chapter.number === "22" ? "is-statistics" : ""} ${chapter.number === "23" ? "is-linear-algebra" : ""} ${chapter.number === "24" ? "is-calculus" : ""} ${chapter.number === "25" ? "is-differential-equations" : ""} ${chapter.number === "26" ? "is-multivariable" : ""}" href="?view=chapter&amp;chapter=${chapter.number}">${body}</a>`
      : `<article class="master-chapter-card is-future ${chapter.extension ? "is-original-extension" : ""}" aria-label="Chapter ${chapter.number}, ${chapter.title}, not yet interactive">${body}</article>`;
  }

  function renderMaster() {
    const sourceChapters = bookChapters.filter((chapter) => !chapter.extension);
    const extensionChapters = bookChapters.filter((chapter) => chapter.extension);
    return `
      <main class="chapter-index-shell master-index-shell">
        ${siteHeader(null)}
        <section class="chapter-index-hero master-index-hero">
          <div class="chapter-index-hero-copy">
            <div class="eyebrow">The complete book · plus an original extension</div>
            <h1>The book is complete.<br><em>The expanded extension is complete.</em></h1>
            <p>All 109 indexed source-book problems remain together and complete. Twelve chapters of a visibly separate original curriculum are now live; none of Chapters 15–26 comes from the original book.</p>
            <div class="chapter-index-hero-actions">
              <a class="primary-button chapter-index-primary" href="#chapters">Explore all chapters</a>
              <a href="?view=chapter&amp;chapter=26">Open Multivariable Calculus →</a>
            </div>
          </div>
          ${heroFigure("01 → 26")}
          <dl class="chapter-index-stats">
            <div><dt>14</dt><dd>source-book chapters complete</dd></div>
            <div><dt>109</dt><dd>source-book problems interactive</dd></div>
            <div><dt>181</dt><dd>total interactive routes</dd></div>
          </dl>
        </section>

        <section class="master-chapters" id="chapters" aria-labelledby="master-chapters-title">
          <header class="master-chapters-heading">
            <div><div class="eyebrow">The complete source book</div><h2 id="master-chapters-title">Chapters 1–14</h2></div>
            <p>Every chapter opens into an interactive contents page. Problems 1.1–1.10 adapt the available sample; all remaining routes are clearly labelled independent reconstructions.</p>
          </header>
          <div class="master-chapter-grid">${sourceChapters.map(masterChapterCard).join("")}</div>
        </section>

        <aside class="master-epilogue">
          <div><span>After the chapters · Book p. 367</span><strong>The Deadly Game of Puzzle Points</strong></div>
          <p>The book closes with its puzzle-points game and endnote. They are mapped here, but are not yet interactive.</p>
        </aside>

        <section class="master-chapters master-original-extension" id="original-extension" aria-labelledby="original-extension-title">
          <header class="master-chapters-heading">
            <div><div class="eyebrow">Beyond the source book</div><h2 id="original-extension-title">Original extension</h2></div>
            <p><strong>Chapters 15–26 do not appear in <em>Professor Povey's Perplexing Problems</em>.</strong> Their chapter names, problem titles, scenarios, diagrams and solutions are original work created for this project. All twelve original-extension chapters are now live.</p>
          </header>
          <div class="original-extension-boundary"><strong>Not from the original book</strong><span>A twelve-chapter curriculum from probability and proof to stochastic processes, analysis, algebra, dynamical systems and vector fields.</span></div>
          <div class="master-chapter-grid">${extensionChapters.map(masterChapterCard).join("")}</div>
        </section>

        <footer class="chapter-index-footer">
          <p><strong>An unofficial educational prototype.</strong> Chapters 15–26 are original extensions and are not part of the source book.</p>
          <div><a href="?view=chapter&amp;chapter=1">Source book →</a><a href="?view=chapter&amp;chapter=15">Probability →</a><a href="?view=chapter&amp;chapter=16">Proof →</a><a href="?view=chapter&amp;chapter=17">Networks →</a><a href="?view=chapter&amp;chapter=18">Waves →</a><a href="?view=chapter&amp;chapter=19">Magnetism →</a><a href="?view=chapter&amp;chapter=20">Relativity →</a><a href="?view=chapter&amp;chapter=21">Stochastic →</a><a href="?view=chapter&amp;chapter=22">Statistics →</a><a href="?view=chapter&amp;chapter=23">Linear algebra →</a><a href="?view=chapter&amp;chapter=24">Calculus →</a><a href="?view=chapter&amp;chapter=25">Differential equations →</a><a href="?view=chapter&amp;chapter=26">Multivariable calculus →</a></div>
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
      : chapter === "2"
        ? sectionMarkup({ chapter: "2", source: "reconstructed", eyebrow: "Problems 2.1–2.12", title: "An original mathematics lab", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 2. Every activity here is independently written and explicitly labelled—not Povey's original wording or solution.", id: "index-chapter-two-reconstructed" })
        : chapter === "3"
          ? sectionMarkup({ chapter: "3", source: "reconstructed", eyebrow: "Problems 3.1–3.9", title: "An original statics workshop", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 3. Every force, scenario and solution here is independently written and explicitly labelled.", id: "index-chapter-three-reconstructed" })
          : chapter === "4"
            ? sectionMarkup({ chapter: "4", source: "reconstructed", eyebrow: "Problems 4.1–4.7", title: "An original dynamics laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 4. Every moving system, collision and solution here is independently written and explicitly labelled.", id: "index-chapter-four-reconstructed" })
            : chapter === "5"
              ? sectionMarkup({ chapter: "5", source: "reconstructed", eyebrow: "Problems 5.1–5.7", title: "An original circular-motion laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 5. Every corner, loop, rotating wall and solution here is independently written and explicitly labelled.", id: "index-chapter-five-reconstructed" })
              : chapter === "6"
                ? sectionMarkup({ chapter: "6", source: "reconstructed", eyebrow: "Problems 6.1–6.5", title: "An original oscillation laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 6. Every oscillator, intervention, coupled mode and solution here is independently written and explicitly labelled.", id: "index-chapter-six-reconstructed" })
                : chapter === "7"
                  ? sectionMarkup({ chapter: "7", source: "reconstructed", eyebrow: "Problems 7.1–7.6", title: "An original impossible-machines workshop", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 7. Every invention, energy audit and solution here is independently written and explicitly labelled.", id: "index-chapter-seven-reconstructed" })
                  : chapter === "8"
                    ? sectionMarkup({ chapter: "8", source: "reconstructed", eyebrow: "Problems 8.1–8.3", title: "An original kinematics laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 8. Every pursuit, flight path, intercept and solution here is independently written and explicitly labelled.", id: "index-chapter-eight-reconstructed" })
                    : chapter === "9"
                      ? sectionMarkup({ chapter: "9", source: "reconstructed", eyebrow: "Problems 9.1–9.7", title: "An original electricity laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 9. Every network, power audit, heating model and solution here is independently written and explicitly labelled.", id: "index-chapter-nine-reconstructed" })
                      : chapter === "10"
                        ? sectionMarkup({ chapter: "10", source: "reconstructed", eyebrow: "Problems 10.1–10.12", title: "An original gravity laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 10. Every world, orbit, transfer and solution here is independently written and explicitly labelled.", id: "index-chapter-ten-reconstructed" })
                        : chapter === "11"
                          ? sectionMarkup({ chapter: "11", source: "reconstructed", eyebrow: "Problems 11.1–11.5", title: "An original optics laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 11. Every ray diagram, optical system and solution here is independently written and explicitly labelled.", id: "index-chapter-eleven-reconstructed" })
                          : chapter === "12"
                            ? sectionMarkup({ chapter: "12", source: "reconstructed", eyebrow: "Problems 12.1–12.5", title: "An original heat laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 12. Every thermal system, energy audit and solution here is independently written and explicitly labelled.", id: "index-chapter-twelve-reconstructed" })
                            : chapter === "13"
                              ? sectionMarkup({ chapter: "13", source: "reconstructed", eyebrow: "Problems 13.1–13.8", title: "An original buoyancy laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 13. Every vessel, immersed body, pressure field and solution here is independently written and explicitly labelled.", id: "index-chapter-thirteen-reconstructed" })
                              : chapter === "14"
                                ? sectionMarkup({ chapter: "14", source: "reconstructed", eyebrow: "Problems 14.1–14.6", title: "An original estimation laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 14. Every scenario, assumption ladder, sensitivity test and solution here is independently written and explicitly labelled.", id: "index-chapter-fourteen-reconstructed" })
                                : chapter === "15"
                                  ? sectionMarkup({ chapter: "15", source: "extension", eyebrow: "Original extension · Problems 15.1–15.6", title: "Probability beyond the source book", copy: "Chapter 15 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and are not reconstructions of missing book material.", id: "index-chapter-fifteen-extension" })
                                  : chapter === "16"
                                    ? sectionMarkup({ chapter: "16", source: "extension", eyebrow: "Original extension · Problems 16.1–16.6", title: "Proof beyond the source book", copy: "Chapter 16 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-sixteen-extension" })
                                    : chapter === "17"
                                      ? sectionMarkup({ chapter: "17", source: "extension", eyebrow: "Original extension · Problems 17.1–17.6", title: "Networks beyond the source book", copy: "Chapter 17 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-seventeen-extension" })
                                      : chapter === "18"
                                        ? sectionMarkup({ chapter: "18", source: "extension", eyebrow: "Original extension · Problems 18.1–18.6", title: "Waves beyond the source book", copy: "Chapter 18 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-eighteen-extension" })
                                        : chapter === "19"
                                          ? sectionMarkup({ chapter: "19", source: "extension", eyebrow: "Original extension · Problems 19.1–19.6", title: "Magnetism beyond the source book", copy: "Chapter 19 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-nineteen-extension" })
                                          : chapter === "20"
                                            ? sectionMarkup({ chapter: "20", source: "extension", eyebrow: "Original extension · Problems 20.1–20.6", title: "Relativity beyond the source book", copy: "Chapter 20 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-twenty-extension" })
                                            : chapter === "21"
                                              ? sectionMarkup({ chapter: "21", source: "extension", eyebrow: "Original extension · Problems 21.1–21.6", title: "Stochastic processes beyond the source book", copy: "Chapter 21 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-twenty-one-extension" })
                                              : chapter === "22"
                                                ? sectionMarkup({ chapter: "22", source: "extension", eyebrow: "Original extension · Problems 22.1–22.6", title: "Statistics beyond the source book", copy: "Chapter 22 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-twenty-two-extension" })
                                                : chapter === "23"
                                                  ? sectionMarkup({ chapter: "23", source: "extension", eyebrow: "Original extension · Problems 23.1–23.6", title: "Linear algebra beyond the source book", copy: "Chapter 23 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-twenty-three-extension" })
                                                  : chapter === "24"
                                                    ? sectionMarkup({ chapter: "24", source: "extension", eyebrow: "Original extension · Problems 24.1–24.6", title: "Calculus beyond the source book", copy: "Chapter 24 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-twenty-four-extension" })
                                                    : chapter === "25"
                                                      ? sectionMarkup({ chapter: "25", source: "extension", eyebrow: "Original extension · Problems 25.1–25.6", title: "Differential equations beyond the source book", copy: "Chapter 25 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-twenty-five-extension" })
                                                      : sectionMarkup({ chapter: "26", source: "extension", eyebrow: "Original extension · Problems 26.1–26.6", title: "Multivariable calculus beyond the source book", copy: "Chapter 26 and all six activities were created for this project. They do not appear in Professor Povey's Perplexing Problems and make no claim to reconstruct missing book content.", id: "index-chapter-twenty-six-extension" });
    const sourceCount = details.extension ? details.count : chapter === "1" ? "10" : details.count;
    const sourceLabel = details.extension ? "original-extension activities" : chapter === "1" ? "source-backed adaptations" : "reconstructed activities";
    const thirdCount = details.extension ? "0" : chapter === "1" ? "7" : "1";
    const thirdLabel = details.extension ? "source-book problems" : chapter === "1" ? "labelled reconstructions" : "complete chapter";
    const chapterEyebrow = details.extension ? `Original extension · Chapter ${chapter} · Not in the book` : `Chapter ${chapter} · Interactive contents`;
    const footerBoundary = details.extension
      ? "This chapter was created for this project and is not part of the source book."
      : "Original book rights remain with their respective holder.";
    return `
      <main class="chapter-index-shell chapter-contents-shell ${details.heroClass}">
        ${siteHeader(chapter)}
        <section class="chapter-index-hero chapter-landing-hero ${details.heroClass}">
          <div class="chapter-index-hero-copy">
            <div class="eyebrow">${chapterEyebrow}</div>
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
          <p><strong>${details.extension ? "Not from the original book." : "An unofficial educational prototype."}</strong> ${footerBoundary}</p>
          <div><a href="./">← All chapters</a><a href="${problemHref(firstProblem)}">Start ${details.title} →</a></div>
        </footer>
      </main>`;
  }

  function render({ chapter = null } = {}) {
    return chapter ? renderChapter(chapter) : renderMaster();
  }

  window.poveyChapterIndex = { render };
})();
