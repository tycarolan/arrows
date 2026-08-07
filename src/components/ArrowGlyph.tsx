import type { Direction } from "@/lib/board";

/**
 * The arrow drawn inside a piece.
 *
 * A piece is a run of cells, so its glyph is a shaft that runs the whole length
 * with the head at the tip — not a single-cell icon repeated or centred. That
 * is the point of the shape: length is the information, and the player reads it
 * off the line without counting tiles.
 *
 * ## One geometry, four orientations
 *
 * The path is built in *along/across* coordinates — `along` runs from the tail
 * to the tip, `across` runs the width of the piece — and then projected into
 * `x`/`y` per direction. Writing the arrow once in the axis that actually means
 * something, rather than four times or as a rotation of a square icon, is what
 * keeps a length-3 arrow pointing left identical to one pointing up.
 */

/** Viewbox units per cell. Arbitrary; only ratios matter. */
const UNIT = 24;
/** How far the shaft stops short of each end of the piece. */
const INSET = 4.5;
/** How far back from the tip the barbs meet the shaft. */
const BARB_BACK = 6;
/** How far the barbs spread either side of the shaft. */
const BARB_SPREAD = 5.5;

/** `[x, y]` for a point on the piece's own axes. */
function project(
  along: number,
  across: number,
  dir: Direction,
  span: number,
): [number, number] {
  switch (dir) {
    case 0:
      return [across, span - along];
    case 1:
      return [along, across];
    case 2:
      return [across, along];
    case 3:
      return [span - along, across];
  }
}

export interface ArrowGlyphProps {
  readonly dir: Direction;
  /** Cells the piece occupies. */
  readonly length: number;
}

/** The arrow for one piece, sized to that piece's box. */
export function ArrowGlyph({ dir, length }: ArrowGlyphProps) {
  const span = UNIT * length;
  const vertical = dir === 0 || dir === 2;
  const centre = UNIT / 2;

  const point = (along: number, across: number) => {
    const [x, y] = project(along, across, dir, span);
    return `${x} ${y}`;
  };

  const tail = point(INSET, centre);
  const tip = point(span - INSET, centre);
  const barbLeft = point(span - INSET - BARB_BACK, centre - BARB_SPREAD);
  const barbRight = point(span - INSET - BARB_BACK, centre + BARB_SPREAD);

  return (
    <svg
      viewBox={vertical ? `0 0 ${UNIT} ${span}` : `0 0 ${span} ${UNIT}`}
      className="h-[86%] w-[86%]"
      aria-hidden="true"
    >
      <path
        d={`M${tail} L${tip} M${barbLeft} L${tip} L${barbRight}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
