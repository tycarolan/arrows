import { describe, expect, it } from "vitest";
import {
  type Board,
  type Piece,
  canLeave,
  cellsOf,
  freePieces,
  isCleared,
  occupancyOf,
  pathAhead,
  removePiece,
} from "./board";

/** A 5×5 board, which is the smallest size the game actually ships. */
const SIZE = 5;

function piece(
  id: number,
  dir: Piece["dir"],
  head: number,
  length = 1,
): Piece {
  return { id, dir, head, length };
}

function boardOf(...pieces: Piece[]): Board {
  return { size: SIZE, pieces };
}

describe("cellsOf", () => {
  it("puts a length-1 body on the head alone", () => {
    expect(cellsOf(piece(1, 0, 12), SIZE)).toEqual([12]);
  });

  it("extends downwards from a head pointing up", () => {
    // Head at row 1, so the body trails into rows 2 and 3 of the same column.
    expect(cellsOf(piece(1, 0, 7, 3), SIZE)).toEqual([7, 12, 17]);
  });

  it("extends leftwards from a head pointing right", () => {
    expect(cellsOf(piece(1, 1, 12, 3), SIZE)).toEqual([12, 11, 10]);
  });

  it("extends upwards from a head pointing down", () => {
    expect(cellsOf(piece(1, 2, 17, 3), SIZE)).toEqual([17, 12, 7]);
  });

  it("extends rightwards from a head pointing left", () => {
    expect(cellsOf(piece(1, 3, 10, 3), SIZE)).toEqual([10, 11, 12]);
  });
});

describe("occupancyOf", () => {
  it("marks every cell of a multi-cell piece", () => {
    const occupancy = occupancyOf(boardOf(piece(4, 1, 12, 3)));
    expect(occupancy[10]).toBe(4);
    expect(occupancy[11]).toBe(4);
    expect(occupancy[12]).toBe(4);
    expect(occupancy[13]).toBeNull();
  });
});

describe("pathAhead", () => {
  it("runs clear off the board when nothing is in the way", () => {
    const board = boardOf(piece(1, 0, 12));
    const { crossed, blockedBy } = pathAhead(board, board.pieces[0], occupancyOf(board));
    expect(blockedBy).toBeNull();
    expect(crossed).toEqual([7, 2]);
  });

  it("stops at another piece and names it", () => {
    const board = boardOf(piece(1, 0, 12), piece(2, 1, 2));
    const { crossed, blockedBy } = pathAhead(board, board.pieces[0], occupancyOf(board));
    expect(blockedBy).toBe(2);
    expect(crossed).toEqual([7]);
  });

  it("ignores the piece's own body", () => {
    // Pointing up with a body trailing below it — the body must not count as
    // an obstacle, or no long piece could ever move.
    const board = boardOf(piece(1, 0, 7, 3));
    const { blockedBy } = pathAhead(board, board.pieces[0], occupancyOf(board));
    expect(blockedBy).toBeNull();
  });

  it("is blocked by any cell of a long piece, not just its head", () => {
    // The blocker's head is at 13; cell 12 is its body. A piece aiming at 12
    // must still be stopped.
    const board = boardOf(piece(1, 0, 22), piece(2, 1, 13, 3));
    const { blockedBy } = pathAhead(board, board.pieces[0], occupancyOf(board));
    expect(blockedBy).toBe(2);
  });
});

describe("canLeave and freePieces", () => {
  it("reports only the unblocked pieces", () => {
    const board = boardOf(piece(1, 0, 12), piece(2, 1, 2), piece(3, 3, 20));
    const free = freePieces(board).map((p) => p.id);
    // 1 is blocked by 2 above it; 2 and 3 both have clear runs to an edge.
    expect(free).toEqual([2, 3]);
  });

  it("frees a piece once its blocker is gone", () => {
    const before = boardOf(piece(1, 0, 12), piece(2, 1, 2));
    expect(canLeave(before, before.pieces[0], occupancyOf(before))).toBe(false);

    const after = removePiece(before, 2);
    expect(canLeave(after, after.pieces[0], occupancyOf(after))).toBe(true);
  });
});

describe("isCleared", () => {
  it("is true only once the last piece has left", () => {
    const board = boardOf(piece(1, 0, 12));
    expect(isCleared(board)).toBe(false);
    expect(isCleared(removePiece(board, 1))).toBe(true);
  });
});
