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

  const problems = [...chapterOneProblems, ...chapterTwoProblems, ...chapterThreeProblems, ...chapterFourProblems, ...chapterFiveProblems, ...chapterSixProblems, ...chapterSevenProblems, ...chapterEightProblems, ...chapterNineProblems, ...chapterTenProblems, ...chapterElevenProblems, ...chapterTwelveProblems, ...chapterThirteenProblems, ...chapterFourteenProblems];

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
    return `
      <a class="chapter-index-card ${problem.source === "reconstructed" ? "is-reconstructed" : ""} ${chapterTwo ? "is-chapter-two" : ""} ${chapterThree ? "is-chapter-three" : ""} ${chapterFour ? "is-chapter-four" : ""} ${chapterFive ? "is-chapter-five" : ""} ${chapterSix ? "is-chapter-six" : ""} ${chapterSeven ? "is-chapter-seven" : ""} ${chapterEight ? "is-chapter-eight" : ""} ${chapterNine ? "is-chapter-nine" : ""} ${chapterTen ? "is-chapter-ten" : ""} ${chapterEleven ? "is-chapter-eleven" : ""} ${chapterTwelve ? "is-chapter-twelve" : ""} ${chapterThirteen ? "is-chapter-thirteen" : ""} ${chapterFourteen ? "is-chapter-fourteen" : ""}" href="${problemHref(problem.number)}">
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
    return `
      <section class="chapter-index-section ${source === "reconstructed" ? "chapter-index-reconstructed" : ""} ${mathematics ? "chapter-index-mathematics" : ""} ${statics ? "chapter-index-statics" : ""} ${dynamics ? "chapter-index-dynamics" : ""} ${circular ? "chapter-index-circular" : ""} ${oscillation ? "chapter-index-oscillation" : ""} ${inventions ? "chapter-index-inventions" : ""} ${kinematics ? "chapter-index-kinematics" : ""} ${electricity ? "chapter-index-electricity" : ""} ${gravity ? "chapter-index-gravity" : ""} ${optics ? "chapter-index-optics" : ""} ${heat ? "chapter-index-heat" : ""} ${buoyancy ? "chapter-index-buoyancy" : ""} ${estimation ? "chapter-index-estimation" : ""}" aria-labelledby="${id}">
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
      : '<a class="problem-nav-link chapter-index-start" href="?view=chapter&amp;chapter=14">Open Estimation <span aria-hidden="true">→</span></a>';
    return `
      <header class="chapter-index-header">
        <a class="chapter-index-brand" href="./"><strong>Perplexing Problems</strong><span>Interactive edition</span></a>
        <span class="chapter-index-complete"><i></i> All fourteen chapters live</span>
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
      ? `<a class="master-chapter-card is-live ${chapter.number === "2" ? "is-mathematics" : ""} ${chapter.number === "3" ? "is-statics" : ""} ${chapter.number === "4" ? "is-dynamics" : ""} ${chapter.number === "5" ? "is-circular" : ""} ${chapter.number === "6" ? "is-oscillation" : ""} ${chapter.number === "7" ? "is-inventions" : ""} ${chapter.number === "8" ? "is-kinematics" : ""} ${chapter.number === "9" ? "is-electricity" : ""} ${chapter.number === "10" ? "is-gravity" : ""} ${chapter.number === "11" ? "is-optics" : ""} ${chapter.number === "12" ? "is-heat" : ""} ${chapter.number === "13" ? "is-buoyancy" : ""} ${chapter.number === "14" ? "is-estimation" : ""}" href="?view=chapter&amp;chapter=${chapter.number}">${body}</a>`
      : `<article class="master-chapter-card is-future" aria-label="Chapter ${chapter.number}, ${chapter.title}, not yet interactive">${body}</article>`;
  }

  function renderMaster() {
    return `
      <main class="chapter-index-shell master-index-shell">
        ${siteHeader(null)}
        <section class="chapter-index-hero master-index-hero">
          <div class="chapter-index-hero-copy">
            <div class="eyebrow">The complete book map</div>
            <h1>Fourteen chapters.<br><em>All are alive.</em></h1>
            <p>This is the front door to the whole project: every indexed problem in all fourteen source chapters now has an interactive route.</p>
            <div class="chapter-index-hero-actions">
              <a class="primary-button chapter-index-primary" href="#chapters">Explore all chapters</a>
              <a href="?view=chapter&amp;chapter=14">Open Estimation →</a>
            </div>
          </div>
          ${heroFigure("01 → 14")}
          <dl class="chapter-index-stats">
            <div><dt>14</dt><dd>chapters in the book</dd></div>
            <div><dt>109</dt><dd>problems in the source index</dd></div>
            <div><dt>109</dt><dd>interactive now</dd></div>
          </dl>
        </section>

        <section class="master-chapters" id="chapters" aria-labelledby="master-chapters-title">
          <header class="master-chapters-heading">
            <div><div class="eyebrow">Complete contents</div><h2 id="master-chapters-title">Choose a chapter</h2></div>
            <p>Every chapter opens into an interactive contents page. Problems 1.1–1.10 adapt the available sample; all remaining routes are clearly labelled independent reconstructions.</p>
          </header>
          <div class="master-chapter-grid">${bookChapters.map(masterChapterCard).join("")}</div>
        </section>

        <aside class="master-epilogue">
          <div><span>After the chapters · Book p. 367</span><strong>The Deadly Game of Puzzle Points</strong></div>
          <p>The book closes with its puzzle-points game and endnote. They are mapped here, but are not yet interactive.</p>
        </aside>

        <footer class="chapter-index-footer">
          <p><strong>An unofficial educational prototype.</strong> Original book rights remain with their respective holder.</p>
          <div><a href="?view=chapter&amp;chapter=1">Geometry →</a><a href="?view=chapter&amp;chapter=2">Mathematics →</a><a href="?view=chapter&amp;chapter=3">Statics →</a><a href="?view=chapter&amp;chapter=4">Dynamics →</a><a href="?view=chapter&amp;chapter=5">Circular motion →</a><a href="?view=chapter&amp;chapter=6">SHM →</a><a href="?view=chapter&amp;chapter=7">Inventions →</a><a href="?view=chapter&amp;chapter=8">Kinematics →</a><a href="?view=chapter&amp;chapter=9">Electricity →</a><a href="?view=chapter&amp;chapter=10">Gravity →</a><a href="?view=chapter&amp;chapter=11">Optics →</a><a href="?view=chapter&amp;chapter=12">Heat →</a><a href="?view=chapter&amp;chapter=13">Buoyancy →</a><a href="?view=chapter&amp;chapter=14">Estimation →</a></div>
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
                              : sectionMarkup({ chapter: "14", source: "reconstructed", eyebrow: "Problems 14.1–14.6", title: "An original estimation laboratory", copy: "Only the published titles and difficulty ratings were recoverable for Chapter 14. Every scenario, assumption ladder, sensitivity test and solution here is independently written and explicitly labelled.", id: "index-chapter-fourteen-reconstructed" });
    const sourceCount = chapter === "1" ? "10" : details.count;
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
