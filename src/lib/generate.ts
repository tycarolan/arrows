/**
 * Board generation.
 *
 * ## Why boards are built backwards
 *
 * A board is only worth playing if it can actually be cleared, and checking
 * that after the fact means searching a space that grows factorially. So no
 * board is ever built and then tested — it is built in reverse, from an empty
 * grid, one piece at a time, and each piece is placed only where it has a clear
 * run to the edge *at that moment*.
 *
 * That single constraint is what makes the result solvable, and the argument is
 * short enough to keep in your head. Placing a piece never clears a cell, so
 * when the player removes pieces in the reverse of the placement order, the
 * board they face at each step is exactly the board that existed when that
 * piece was placed. It had a clear path then, so it has one now. Placement
 * order reversed *is* a solution, and {@link generate} hands it back so a test
 * can walk it.
 *
 * ## Shaping the difficulty
 *
 * Solvable is the floor, not the goal. A board where everything is immediately
 * tappable is solvable and dull. The lever is `targetFree` — how many pieces
 * may be free at the start — and the generator steers toward it by preferring
 * placements that land on top of another piece's escape route, which converts
 * a free piece into a blocked one. When it already has few enough free pieces
 * it does the opposite and prefers placements that block nothing.
 */

import {
  type Board,
  type Direction,
  DIRECTIONS,
  type Piece,
  canLeave,
  cellsOf,
  occupancyOf,
  pathAhead,
} from "./board";
import { mulberry32, seedFrom } from "./rng";

/** The dials that describe one board's difficulty, before any of it is built. */
export interface Shape {
  readonly size: number;
  /** How many pieces should be tappable at the start. Lower is harder. */
  readonly targetFree: number;
  /** Cells to fill before the generator may stop. */
  readonly fillTarget: number;
  /** Hard cap on filled cells, so generation always terminates. */
  readonly maxFill: number;
  /** Longest piece to place. */
  readonly maxLength: number;
}

/** A finished board, plus what generation knows about it. */
export interface Generated {
  readonly board: Board;
  /** Pieces tappable at the start — the difficulty the player actually feels. */
  readonly openingMoves: number;
  /** Piece ids in an order that clears the board. Reverse of placement. */
  readonly solution: number[];
}

/** How often each length is drawn, indexed by `length - 1`. */
const LENGTH_WEIGHTS: readonly number[] = [3, 4, 3];

/**
 * Draw a piece length, favouring 2.
 *
 * Lengths are drawn *before* placements are scored rather than being folded
 * into the candidate set. If length were just another axis of the candidate
 * search, the scoring would pick the longest option nearly every time — a long
 * piece covers more cells and so blocks more — and every board would come out
 * uniformly long. Drawing first keeps the mix varied.
 */
function pickLength(maxLength: number, rand: () => number): number {
  const weights = LENGTH_WEIGHTS.slice(0, maxLength);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i + 1;
  }
  return weights.length;
}

/** A placement the generator is considering. */
interface Candidate {
  readonly head: number;
  readonly dir: Direction;
  readonly length: number;
  /** How much of other pieces' escape routes this would sit on. */
  readonly score: number;
  /** Cells between this piece's tip and the edge. Longer reads as more open. */
  readonly reach: number;
}

/**
 * For each cell, how many currently-placed pieces would be blocked by something
 * landing there.
 *
 * Only pieces that are currently free contribute — a piece that is already
 * blocked cannot be blocked harder, and counting it would make the generator
 * pile pieces onto lanes that are shut anyway.
 */
function coverageMap(board: Board, occupancy: (number | null)[]): number[] {
  const coverage: number[] = Array(board.size * board.size).fill(0);
  for (const piece of board.pieces) {
    const { crossed, blockedBy } = pathAhead(board, piece, occupancy);
    if (blockedBy !== null) continue;
    for (const cell of crossed) coverage[cell]++;
  }
  return coverage;
}

/**
 * Every legal placement of a piece of exactly `length`.
 *
 * Legal means: the body fits on the board, every body cell is empty, and the
 * run from the tip to the edge is clear. That last condition is the invariant
 * this whole module rests on.
 */
function candidatesFor(
  board: Board,
  occupancy: (number | null)[],
  coverage: number[],
  length: number,
): Candidate[] {
  const { size } = board;
  const candidates: Candidate[] = [];

  for (let head = 0; head < size * size; head++) {
    if (occupancy[head] !== null) continue;
    for (const dir of DIRECTIONS) {
      const probe: Piece = { id: -1, dir, head, length };
      const body = cellsOf(probe, size);
      if (body.length !== length) continue;
      if (body.some((cell) => occupancy[cell] !== null)) continue;

      const { crossed, blockedBy } = pathAhead(board, probe, occupancy);
      if (blockedBy !== null) continue;

      const score = body.reduce((sum, cell) => sum + coverage[cell], 0);
      candidates.push({ head, dir, length, score, reach: crossed.length });
    }
  }
  return candidates;
}

/**
 * Pick one placement.
 *
 * When there are too many free pieces the generator wants to shut lanes, so it
 * takes the highest-scoring placement. Otherwise it wants to leave the count
 * alone, so it restricts to placements that block nothing at all and picks the
 * one with the longest run — which spreads pieces out instead of clumping them
 * against the edges.
 */
function choose(
  candidates: Candidate[],
  tighten: boolean,
  rand: () => number,
): Candidate {
  if (tighten) {
    const best = Math.max(...candidates.map((c) => c.score));
    const bestReach = Math.max(
      ...candidates.filter((c) => c.score === best).map((c) => c.reach),
    );
    const tied = candidates.filter(
      (c) => c.score === best && c.reach === bestReach,
    );
    return tied[Math.floor(rand() * tied.length)];
  }

  const harmless = candidates.filter((c) => c.score === 0);
  const pool = harmless.length > 0 ? harmless : candidates;
  const bestReach = Math.max(...pool.map((c) => c.reach));
  const tied = pool.filter((c) => c.reach === bestReach);
  return tied[Math.floor(rand() * tied.length)];
}

/** Build one board from one seed. */
function build(shape: Shape, seed: number): Generated {
  const rand = mulberry32(seed);
  const { size } = shape;

  const pieces: Piece[] = [];
  let occupancy: (number | null)[] = Array(size * size).fill(null);
  let filled = 0;
  let nextId = 1;

  while (filled < shape.maxFill) {
    const board: Board = { size, pieces };
    const free = pieces.filter((piece) =>
      canLeave(board, piece, occupancy),
    ).length;
    if (filled >= shape.fillTarget && free <= shape.targetFree) break;

    const coverage = coverageMap(board, occupancy);
    const wanted = pickLength(shape.maxLength, rand);

    let candidates: Candidate[] = [];
    for (let length = wanted; length >= 1 && candidates.length === 0; length--) {
      if (filled + length > shape.maxFill) continue;
      candidates = candidatesFor(board, occupancy, coverage, length);
    }
    if (candidates.length === 0) break;

    const chosen = choose(candidates, free > shape.targetFree, rand);
    const piece: Piece = {
      id: nextId++,
      dir: chosen.dir,
      head: chosen.head,
      length: chosen.length,
    };
    pieces.push(piece);
    for (const cell of cellsOf(piece, size)) occupancy[cell] = piece.id;
    filled += chosen.length;
  }

  const board: Board = { size, pieces };
  occupancy = occupancyOf(board);
  const openingMoves = pieces.filter((piece) =>
    canLeave(board, piece, occupancy),
  ).length;

  return {
    board,
    openingMoves,
    solution: pieces.map((piece) => piece.id).reverse(),
  };
}

/** How many boards to try before settling for the closest near-miss. */
const ATTEMPTS = 40;

/**
 * Generate a board for a shape and a key.
 *
 * Builds repeatedly until one comes in at or under `targetFree`, because the
 * placement heuristic steers toward that number rather than guaranteeing it.
 * If nothing hits the target the closest attempt is returned — a board that is
 * slightly too easy is a far better outcome than no board at all.
 */
export function generate(shape: Shape, key: string): Generated {
  let best: Generated | null = null;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const candidate = build(shape, seedFrom(key, attempt));
    if (candidate.openingMoves <= shape.targetFree) return candidate;
    if (best === null || candidate.openingMoves < best.openingMoves) {
      best = candidate;
    }
  }
  return best as Generated;
}

/** The two ways to get a board. */
export type Mode = "levels" | "daily";

/**
 * The shape of a numbered level.
 *
 * Difficulty ramps over the first 46 levels and then holds: the grid grows a
 * row every nine levels up to 8×8, the board packs tighter, and the number of
 * opening moves falls from 8 to 2. Past that the levels keep generating and
 * stay at the hardest shape rather than running out.
 */
export function levelShape(level: number): Shape {
  const t = Math.min(1, Math.max(0, (level - 1) / 45));
  const size = Math.min(8, 5 + Math.floor((level - 1) / 9));
  const total = size * size;
  return {
    size,
    targetFree: Math.round(8 - 6 * t),
    fillTarget: Math.round(total * (0.4 + 0.18 * t)),
    maxFill: Math.round(total * 0.78),
    maxLength: Math.min(3, size - 1),
  };
}

/**
 * The shape of a given day's board.
 *
 * Everything is drawn from the day number, so every player gets the same board
 * and it can be regenerated for any past day. The daily deliberately varies its
 * size and density rather than following the level ramp — it is one board, not
 * a rung on a ladder, and it should not feel like a level you have already
 * played.
 */
export function dailyShape(day: number): Shape {
  const rand = mulberry32(seedFrom("arrows:daily:shape", day));
  const size = 6 + Math.floor(rand() * 2);
  const total = size * size;
  return {
    size,
    targetFree: 3 + Math.floor(rand() * 3),
    fillTarget: Math.round(total * (0.45 + 0.1 * rand())),
    maxFill: Math.round(total * 0.78),
    maxLength: 3,
  };
}

/** The board for a mode and number, and the key it is stored under. */
export function boardFor(mode: Mode, n: number): Generated {
  const shape = mode === "levels" ? levelShape(n) : dailyShape(n);
  return generate(shape, `arrows:${mode}:${n}`);
}

/** The short difficulty word shown under the title. */
export function difficultyLabel(openingMoves: number): string {
  if (openingMoves >= 7) return "Easy";
  if (openingMoves >= 5) return "Steady";
  if (openingMoves >= 3) return "Tricky";
  return "Tight";
}
