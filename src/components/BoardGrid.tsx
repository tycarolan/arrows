import {
  type Board,
  DIRECTION_NAMES,
  type Piece,
  cellsOf,
  toColRow,
} from "@/lib/board";
import { ArrowGlyph } from "./ArrowGlyph";

/**
 * The grid and the pieces on it.
 *
 * ## Two layers, one grid
 *
 * The empty cells and the pieces are siblings in a single CSS grid, both placed
 * explicitly by line number. That is deliberate: a piece spans several tracks,
 * and auto-placement would flow the empty cells around it and shift the board.
 * Explicit placement also lets the two layers overlap by design — the empty
 * cells tile the whole grid, and the pieces sit on top of the ones they cover.
 *
 * Holding no rules, this component takes the board and reports taps. Whether a
 * tap was legal is decided in `src/lib/board.ts`.
 */

/** How a piece should look right now. */
export type PieceTone = "idle" | "refused" | "blocking";

const TONES: Record<PieceTone, string> = {
  idle: "border-line bg-white/[0.04] text-foreground",
  refused: "border-refuse bg-refuse/15 text-refuse",
  blocking: "border-accent bg-accent/10 text-accent",
};

/** The two pieces involved in the most recent refused tap. */
export interface Flash {
  readonly tapped: number;
  readonly blocker: number;
}

export interface BoardGridProps {
  readonly board: Board;
  readonly flash: Flash | null;
  readonly onTap: (id: number) => void;
  /** Cleared boards stop responding, so the win state cannot be tapped away. */
  readonly locked: boolean;
}

function toneFor(piece: Piece, flash: Flash | null): PieceTone {
  if (flash?.tapped === piece.id) return "refused";
  if (flash?.blocker === piece.id) return "blocking";
  return "idle";
}

/** Grid placement for a piece, as `[column, row]` shorthand values. */
function placement(piece: Piece, size: number): [string, string] {
  const cells = cellsOf(piece, size);
  const cols = cells.map((cell) => toColRow(cell, size)[0]);
  const rows = cells.map((cell) => toColRow(cell, size)[1]);
  const minCol = Math.min(...cols);
  const minRow = Math.min(...rows);
  const width = Math.max(...cols) - minCol + 1;
  const height = Math.max(...rows) - minRow + 1;
  return [`${minCol + 1} / span ${width}`, `${minRow + 1} / span ${height}`];
}

export function BoardGrid({ board, flash, onTap, locked }: BoardGridProps) {
  const { size } = board;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          aspectRatio: "1 / 1",
          maxWidth: "min(92vw, 30rem)",
          maxHeight: "100%",
        }}
      >
        {Array.from({ length: size * size }, (_, cell) => {
          const [col, row] = toColRow(cell, size);
          return (
            <div
              key={`cell-${cell}`}
              className="rounded-md border border-line/30"
              style={{ gridColumn: col + 1, gridRow: row + 1 }}
            />
          );
        })}

        {board.pieces.map((piece) => {
          const [gridColumn, gridRow] = placement(piece, size);
          return (
            <button
              key={piece.id}
              type="button"
              disabled={locked}
              onClick={() => onTap(piece.id)}
              aria-label={`${piece.length}-cell arrow pointing ${DIRECTION_NAMES[piece.dir]}`}
              className={`flex items-center justify-center rounded-md border transition-colors ${TONES[toneFor(piece, flash)]}`}
              style={{ gridColumn, gridRow }}
            >
              <ArrowGlyph dir={piece.dir} length={piece.length} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
