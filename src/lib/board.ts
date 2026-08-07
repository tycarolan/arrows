/**
 * The board, the pieces on it, and the one rule that governs them.
 *
 * The rule: tap a piece and it slides off in the direction it points. It only
 * goes if every cell between its tip and the edge is empty. If something is in
 * the way, it refuses and stays put.
 *
 * ## A piece is longer than one cell
 *
 * The thing that makes this a puzzle rather than a sequence of independent taps
 * is that a piece occupies a *run* of cells along its own axis — a length-3
 * arrow pointing right is three cells wide with the tip on the right. So a
 * piece is both a mover and an obstacle with real extent, and clearing one can
 * open a lane for several others at once.
 *
 * Length 1 is the degenerate case and behaves exactly like a lone arrow, which
 * is why the shorter pieces still feel like the original game.
 *
 * ## Why the head is the anchor
 *
 * A piece is stored as its tip plus a length, and the body is derived by walking
 * *backwards* from the tip. Anchoring on the tip is what keeps the movement rule
 * a one-liner — the path to check always starts at the anchor — and it means a
 * piece's identity does not shift when its length changes during generation.
 */

/** Up, right, down, left — in the order a 90° rotation steps through them. */
export type Direction = 0 | 1 | 2 | 3;

/** Every direction, for enumerating placements. */
export const DIRECTIONS: readonly Direction[] = [0, 1, 2, 3];

/** Human-readable direction names, indexed by {@link Direction}. Used for labels. */
export const DIRECTION_NAMES: readonly string[] = ["up", "right", "down", "left"];

/** Column and row deltas for one step in each direction. */
const DELTA: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** One arrow: a run of `length` cells along `dir`, with its tip at `head`. */
export interface Piece {
  /** Stable across a board's lifetime; used for React keys and blocker lookup. */
  readonly id: number;
  readonly dir: Direction;
  /** Cell index of the tip — the leading edge in `dir`. */
  readonly head: number;
  /** Cells occupied, including the head. Always at least 1. */
  readonly length: number;
}

/** A board: a square grid and the pieces sitting on it. */
export interface Board {
  readonly size: number;
  readonly pieces: readonly Piece[];
}

/** Column and row of a cell index. */
export function toColRow(index: number, size: number): [number, number] {
  return [index % size, Math.floor(index / size)];
}

/** Cell index for a column and row, or `null` if either is off the board. */
export function toIndex(col: number, row: number, size: number): number | null {
  if (col < 0 || row < 0 || col >= size || row >= size) return null;
  return row * size + col;
}

/**
 * The cells a piece occupies, tip first.
 *
 * Walks backwards from the head against `dir`. Returns only in-bounds cells;
 * a well-formed piece never has any out-of-bounds body, and generation is what
 * guarantees that.
 */
export function cellsOf(piece: Piece, size: number): number[] {
  const [dc, dr] = DELTA[piece.dir];
  const [headCol, headRow] = toColRow(piece.head, size);
  const cells: number[] = [];
  for (let step = 0; step < piece.length; step++) {
    const index = toIndex(headCol - dc * step, headRow - dr * step, size);
    if (index === null) break;
    cells.push(index);
  }
  return cells;
}

/**
 * Cell index to the id of the piece occupying it, or `null`.
 *
 * Rebuilt from the piece list rather than stored alongside it, so the two can
 * never disagree — every rule below reads occupancy through this.
 */
export function occupancyOf(board: Board): (number | null)[] {
  const occupancy: (number | null)[] = Array(board.size * board.size).fill(null);
  for (const piece of board.pieces) {
    for (const cell of cellsOf(piece, board.size)) occupancy[cell] = piece.id;
  }
  return occupancy;
}

/** What lies ahead of a piece's tip. */
export interface Path {
  /** Empty cells between the tip and whatever stops it. Tip-first order. */
  readonly crossed: number[];
  /** The piece in the way, or `null` when the path runs clear off the board. */
  readonly blockedBy: number | null;
}

/**
 * Walk forward from a piece's tip until the board edge or another piece.
 *
 * Takes a prebuilt occupancy map because generation calls this in a tight loop
 * over every candidate placement, and rebuilding the map each time is what
 * turns a fast generator into a slow one.
 */
export function pathAhead(
  board: Board,
  piece: Piece,
  occupancy: (number | null)[],
): Path {
  const [dc, dr] = DELTA[piece.dir];
  let [col, row] = toColRow(piece.head, board.size);
  const crossed: number[] = [];
  for (;;) {
    col += dc;
    row += dr;
    const index = toIndex(col, row, board.size);
    if (index === null) return { crossed, blockedBy: null };
    const occupant = occupancy[index];
    if (occupant !== null && occupant !== piece.id) {
      return { crossed, blockedBy: occupant };
    }
    crossed.push(index);
  }
}

/** Whether a piece can slide off the board right now. */
export function canLeave(
  board: Board,
  piece: Piece,
  occupancy: (number | null)[],
): boolean {
  return pathAhead(board, piece, occupancy).blockedBy === null;
}

/** The pieces that can be tapped away this turn. */
export function freePieces(board: Board): Piece[] {
  const occupancy = occupancyOf(board);
  return board.pieces.filter((piece) => canLeave(board, piece, occupancy));
}

/** Remove a piece by id. Does not check whether the move was legal. */
export function removePiece(board: Board, id: number): Board {
  return { ...board, pieces: board.pieces.filter((piece) => piece.id !== id) };
}

/** Whether every piece has left. */
export function isCleared(board: Board): boolean {
  return board.pieces.length === 0;
}
