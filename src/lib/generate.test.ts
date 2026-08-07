import { describe, expect, it } from "vitest";
import {
  type Board,
  canLeave,
  cellsOf,
  isCleared,
  occupancyOf,
  removePiece,
} from "./board";
import { boardFor, dailyShape, generate, levelShape } from "./generate";

/** Levels spanning the whole difficulty ramp, plus a few past the end of it. */
const LEVELS = [1, 2, 5, 9, 10, 18, 19, 27, 30, 45, 46, 60, 120];
const DAYS = [1, 2, 3, 7, 30, 100, 365];

/**
 * Play a solution through and fail on the first illegal move.
 *
 * This is the test that matters. Everything else about generation is taste;
 * this is the one property that, if it broke, would hand a player a board that
 * cannot be finished — and they would have no way to tell that from a board
 * they merely have not solved yet.
 */
function playOut(board: Board, solution: number[]): void {
  let current = board;
  for (const id of solution) {
    const piece = current.pieces.find((p) => p.id === id);
    expect(piece, `piece ${id} missing when the solution called for it`).toBeDefined();
    expect(
      canLeave(current, piece!, occupancyOf(current)),
      `piece ${id} was blocked when the solution called for it`,
    ).toBe(true);
    current = removePiece(current, id);
  }
  expect(isCleared(current)).toBe(true);
}

describe("generated boards are well formed", () => {
  it.each(LEVELS)("level %i", (level) => {
    const { board } = boardFor("levels", level);
    const { size } = board;
    const seen = new Set<number>();

    expect(board.pieces.length).toBeGreaterThan(0);
    for (const piece of board.pieces) {
      const cells = cellsOf(piece, size);
      // A body shorter than its length means it ran off the board.
      expect(cells).toHaveLength(piece.length);
      for (const cell of cells) {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThan(size * size);
        expect(seen.has(cell), `cell ${cell} occupied twice`).toBe(false);
        seen.add(cell);
      }
    }
  });
});

describe("every board can be cleared", () => {
  it.each(LEVELS)("level %i", (level) => {
    const { board, solution } = boardFor("levels", level);
    playOut(board, solution);
  });

  it.each(DAYS)("daily %i", (day) => {
    const { board, solution } = boardFor("daily", day);
    playOut(board, solution);
  });
});

describe("boards are deterministic", () => {
  it("regenerates a level identically", () => {
    expect(boardFor("levels", 12).board).toEqual(boardFor("levels", 12).board);
  });

  it("regenerates a past daily identically", () => {
    expect(boardFor("daily", 42).board).toEqual(boardFor("daily", 42).board);
  });

  it("gives different levels different boards", () => {
    expect(boardFor("levels", 12).board).not.toEqual(boardFor("levels", 13).board);
  });
});

describe("pieces are longer than one cell", () => {
  it("places multi-cell pieces across the level range", () => {
    // The point of the whole model. If this fails the game has quietly
    // regressed to one arrow per tile.
    for (const level of LEVELS) {
      const { board } = boardFor("levels", level);
      const longest = Math.max(...board.pieces.map((p) => p.length));
      expect(longest, `level ${level} had only single-cell pieces`).toBeGreaterThan(1);
    }
  });

  it("never exceeds the shape's maximum length", () => {
    for (const level of LEVELS) {
      const shape = levelShape(level);
      const { board } = boardFor("levels", level);
      for (const piece of board.pieces) {
        expect(piece.length).toBeLessThanOrEqual(shape.maxLength);
      }
    }
  });
});

describe("shaping", () => {
  it("grows the grid and tightens the opening as levels climb", () => {
    expect(levelShape(1).size).toBe(5);
    expect(levelShape(46).size).toBe(8);
    expect(levelShape(1).targetFree).toBeGreaterThan(levelShape(46).targetFree);
  });

  it("holds at the hardest shape past the end of the ramp", () => {
    expect(levelShape(46)).toEqual(levelShape(500));
  });

  it("keeps the daily within its intended sizes", () => {
    for (const day of DAYS) {
      const shape = dailyShape(day);
      expect(shape.size).toBeGreaterThanOrEqual(6);
      expect(shape.size).toBeLessThanOrEqual(7);
    }
  });

  it("respects a shape it cannot fully satisfy", () => {
    // A deliberately impossible ask: no board can leave zero pieces free, since
    // the last piece placed always has a clear run. Generation must still
    // return a usable board rather than looping or throwing.
    const { board, solution } = generate(
      { size: 5, targetFree: 0, fillTarget: 10, maxFill: 19, maxLength: 3 },
      "impossible",
    );
    expect(board.pieces.length).toBeGreaterThan(0);
    playOut(board, solution);
  });
});
