# Perplexing Problems — interactive problem library

A browser-native prototype exploring how a printed mathematics and physics problem book can become an active reading experience. The first two chapters contain 29 interactive problems with manipulable models, estimates, progressive hints, and staged solutions.

## Live prototype

[Open the master chapter index](https://tommytoolman.github.io/perplexing-problems-prototype/)

The prototype now has three navigation levels: the complete 14-chapter book map, a contents page for each interactive chapter, and the individual problem pages.

- [Chapter 1 · Geometry contents](https://tommytoolman.github.io/perplexing-problems-prototype/?view=chapter&chapter=1)
- [Chapter 2 · Mathematics contents](https://tommytoolman.github.io/perplexing-problems-prototype/?view=chapter&chapter=2)

Review individual problems:

### Chapter 1 · Geometry

- [1.1 Shortest walk](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A)
- [1.2 Intercontinental telephone cable](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.2)
- [1.3 Chessboard and hoop](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.3)
- [1.4 Hexagonal tiles and hoop](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.4)
- [1.5 Intersecting circles](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.5)
- [1.6 Cube within sphere](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.6)
- [1.7 Polygon inscribed within circle](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.7)
- [1.8 Circle inscribed within polygon](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.8)
- [1.9 Triangle inscribed within semicircle](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.9)
- [1.10 Big and small tree trunks](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.10)
- [1.11 Professor Fuddlethumbs' stamp](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.11)
- [1.12 Captain Fistfulls' treasure](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.12)
- [1.13 Captain Fistfulls' treasure II](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.13)
- [1.14 Captain Fistfulls' treasure III](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.14)
- [1.15 The geometry of Koch Island](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.15)
- [1.16 An easyish fencing problem](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.16)
- [1.17 A hardish fencing problem](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=1.17)

### Chapter 2 · Mathematics

- [2.1 Human calculator](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.1)
- [2.2 Professor Fuddlethumbs' reports](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.2)
- [2.3 More of Professor Fuddlethumbs' reports](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.3)
- [2.4 Ant on a cube I](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.4)
- [2.5 Ant on a cube II](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.5)
- [2.6 Ant on a cube III](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.6)
- [2.7 A falling raindrop](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.7)
- [2.8 The Three Door Problem](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.8)
- [2.9 Dr Bletchley's PIN](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.9)
- [2.10 Mr Smith's coins](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.10)
- [2.11 The three envelope problem](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.11)
- [2.12 A card game](https://tommytoolman.github.io/perplexing-problems-prototype/?variant=A&problem=2.12)

## Run locally

```sh
./run.sh
```

Then open <http://127.0.0.1:4173/?variant=A>.

Everything is static HTML, CSS, JavaScript, and SVG. No build step or server-side application is required.

## Source boundary

Problems 1.1–1.10 are interactive adaptations of the material available in the supplied chapter sample of *Professor Povey's Perplexing Problems* by Thomas Povey. The available source stops after 1.10. Problems 1.11–1.17 are new reconstructed activities inspired by the index titles and difficulty ratings.

For Chapter 2, the available PDF, attached OCR, public mirrors, and exact-title searches expose only the twelve titles and difficulty ratings. Problems 2.1–2.12 are therefore independently written reconstructions. Every reconstructed page is explicitly labelled and is not presented as Povey's original wording or solution.

This is an unofficial educational prototype, not a facsimile or an official edition. Rights in the original book remain with their respective holder.
