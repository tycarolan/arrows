# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# AGENTS.md

Orientation map for agents working in this repo.

## Project Overview

Arrows is a phone-first browser puzzle at `arrows.taiotech.com`. A grid holds
arrows of one to three cells; tapping one slides it off if its lane is clear,
and the puzzle is the order. Dark-only. No backend, no account, no network —
`localStorage` is the whole of persistence.

See [README.md](README.md) for the rules and the note on how this repository was
reconstructed from a deployed bundle after the original source was lost.

## Commands

```bash
npm install        # First, and after any dependency change
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build — the real compile gate
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest run
```

All four of typecheck, lint, test, and build must pass before anything is
claimed done. CI runs exactly these.

Node 24 (`.nvmrc`) is what CI and the Vercel build run.

## Architecture

The rules are in pure modules under `src/lib/`; the components under
`src/components/` hold none. That split is the reason the generator and the
movement rule are tested without a DOM, and it is worth preserving.

1. `src/lib/board.ts` — the model. A piece is `{ id, dir, head, length }`: a run
   of cells along its own axis with the **tip** as the anchor. Anchoring on the
   tip is what keeps the movement rule to one walk forward from the anchor.
   Occupancy is always derived from the piece list, never stored beside it.
2. `src/lib/generate.ts` — boards are built **backwards** from empty, each piece
   placed only where it already has a clear run to the edge. That is the whole
   solvability argument: placement never clears a cell, so removing pieces in
   reverse placement order always faces a board where the next piece can move.
   Do not "optimise" that invariant away.
3. `src/lib/rng.ts` — seeded RNG and a string hash. **Frozen.** Changing either
   function silently rewrites every level and every past daily.
4. `src/lib/day.ts` — the daily's day number, on a local-midnight boundary.
   The boundary and the epoch (2026-08-05) must never move; either would
   retroactively rewrite which days a player did and did not play.
5. `src/lib/storage.ts` — `localStorage` at key `arrows:v3`, migrating what it
   can from the deployed game's `arrows:v2`. Every read is total: it returns a
   usable state or the default, and never throws.
6. `src/components/Game.tsx` — the only stateful component. Lives, records, and
   what the player is told. Decides consequences, not legality.
7. `src/components/BoardGrid.tsx` — one CSS grid with empty cells and pieces both
   placed explicitly by line number, so multi-cell pieces span tracks without
   auto-placement shifting the board.
8. `src/components/ArrowGlyph.tsx` — the arrow, written once in along/across
   coordinates and projected per direction.

## Conventions

- Two-space indentation, never tabs. LF endings, final newline.
- Self-documenting names over comments. Comments earn their place by explaining
  a non-obvious *why*.
- TSDoc on exported types and functions.
- Commit messages: `type(scope): summary`, lowercase, imperative. Types in use:
  `feat`, `fix`, `docs`, `refactor`, `style`, `chore`, `spec`.

## Definition of Done

- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` all pass.
- A change with a visible surface has been looked at in a browser, not just
  compiled.
- `CHANGELOG.md` has an entry under `[Unreleased]`.

## Pointers

- [README.md](README.md) — the rules, and this repo's history
- [CHANGELOG.md](CHANGELOG.md) — what has shipped
- [docs/SPEC_DRIVEN_DEVELOPMENT.md](docs/SPEC_DRIVEN_DEVELOPMENT.md) — when a
  spec is required
