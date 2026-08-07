# Arrows

A grid of arrows, each one blocking some of the others. Tap an arrow and it
slides off the board in the direction it points — but only if nothing is in the
way. Working out the order that frees everything is the whole game.

Live at **[arrows.taiotech.com](https://arrows.taiotech.com)**. Part of the
workshop at [taiotech.com](https://taiotech.com).

## Playing

Arrows come in runs of one to three cells, with the head at the tip. A piece
leaves only when every cell between its tip and the edge of the board is empty.
Tap a blocked piece and it refuses: it flashes red, whatever stopped it flashes
orange, and you lose a life. Three collisions resets the board rather than
ending the run — the content of the puzzle is the order, so a dead end you
cannot retry would be a strange thing to punish.

**Levels** run from 1 upward and never stop. The grid grows from 5×5 to 8×8 over
the first 46 levels, the board packs tighter, and the number of pieces you can
tap on the first move falls from eight to two. **Daily** is one board a day,
identical for everyone, rolling over at your local midnight.

Progress is kept in `localStorage` and nowhere else. There is no account, no
server, and nothing leaves the device.

## Running it

```bash
npm install
npm run dev
```

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server on http://localhost:3000   |
| `npm run build`     | Production build — the real gate      |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run lint`      | `eslint`                              |
| `npm test`          | `vitest run`                          |

Node 24 (`.nvmrc`) is what CI and Vercel run.

## How it is put together

The rules live in pure modules under `src/lib/` and the components hold none of
them, which is what makes the interesting parts testable without a DOM.

- **`src/lib/board.ts`** — the model. A piece is a run of cells with its tip as
  the anchor, and the one rule is whether the run from that tip to the edge is
  clear.
- **`src/lib/generate.ts`** — boards are built **backwards**, placing each piece
  only where it already has a clear run out. That single constraint is what
  makes every board solvable, and the reverse of the placement order is a
  solution the tests actually play through.
- **`src/lib/rng.ts`** — seeded randomness. Boards are generated, never stored,
  so the same level or day must come out identical forever.
- **`src/lib/day.ts`** — the day number behind the daily, on a local-midnight
  boundary.
- **`src/lib/storage.ts`** — `localStorage`, with every read total.

## A note on this repository's history

The deployed game predates this repo. It was shipped straight from a working
directory with `vercel deploy` and no git remote anywhere, so for a while
`arrows.taiotech.com` was live with no source behind it that could rebuild it.

This repository was reconstructed from the deployed JavaScript bundle. The game
logic, the level shaping, the daily seeding and the palette are all recovered
from what was actually running; the multi-cell pieces are new. The reconstruction
is faithful in behaviour but the code is not literally the code that was lost —
it has been rewritten to be readable and tested rather than de-minified.

The lesson worth keeping: create the repo first. `docs/WORKSHOP.md` in the hub
says so, and this is what it costs when that step gets skipped.
