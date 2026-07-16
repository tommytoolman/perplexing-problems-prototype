# Povey interaction prototype

> **THROWAWAY PROTOTYPE.** This code exists to answer a presentation question. Do not publish or promote it directly to production.

## Prototype question

Which presentation model best turns a Povey problem into active reading?

Three structurally different variants use the same interaction for problem 1.1, **Shortest walk**:

- `?variant=A` - editorial interactive-book spread;
- `?variant=B` - experiment-first visual laboratory;
- `?variant=C` - conversation-first guided tutor.

The bottom switcher and left/right arrow keys move between variants. The user can drag the route joint, commit a proposed minimum, request progressive hints, and reveal the geometric solution. State is deliberately kept in memory; developer telemetry is available only with `debug=1` in the URL.

## Live prototype

[Open the GitHub Pages prototype](https://tommytoolman.github.io/perplexing-problems-prototype/)

## Run locally

From the workspace root:

```sh
./povey-prototype/run.sh
```

Then open <http://127.0.0.1:4173/?variant=A>.

Reviewable content pages:

- [1.1 Shortest walk](http://127.0.0.1:4173/?variant=A)
- [1.2 Intercontinental telephone cable](http://127.0.0.1:4173/?variant=A&problem=1.2)
- [1.3 Chessboard and hoop](http://127.0.0.1:4173/?variant=A&problem=1.3)
- [1.4 Hexagonal tiles and hoop](http://127.0.0.1:4173/?variant=A&problem=1.4)
- [1.5 Intersecting circles](http://127.0.0.1:4173/?variant=A&problem=1.5)
- [1.6 Cube within sphere](http://127.0.0.1:4173/?variant=A&problem=1.6)

## Source note

The problem is adapted privately for evaluation from *Professor Povey's Perplexing Problems*, Thomas Povey, 2015. The source states copyright and all rights reserved. This prototype is not cleared for publication.
