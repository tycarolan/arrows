/**
 * What survives a reload.
 *
 * Everything here is local to the browser. Arrows has no account and talks to
 * no server, so `localStorage` is the whole of persistence and anything that
 * fails to parse is discarded rather than repaired — a player losing a
 * half-finished board is a far smaller harm than the game refusing to start.
 * Every read is total: it returns a usable state or the default, never throws.
 */

import type { Direction, Piece } from "./board";
import type { Mode } from "./generate";

/**
 * Storage key.
 *
 * `v3` because the board model changed: a saved board used to be a flat array
 * of one direction per cell, and is now a list of pieces with lengths. The old
 * shape cannot be read as the new one, so the key moves rather than trying.
 * {@link migrateFromV2} carries across the part that is still meaningful.
 */
const KEY = "arrows:v3";
const LEGACY_KEY = "arrows:v2";

/** How a board ended: cleared at all, or cleared without a single collision. */
export type Record_ = "cleared" | "clean";

/** A board in progress, saved so a reload resumes it rather than restarting. */
export interface Progress {
  /** Which board this is — `L12` or `D7`. Guards against restoring the wrong one. */
  readonly key: string;
  readonly pieces: Piece[];
  readonly lives: number;
  readonly collisions: number;
  /** Whether the board has been reset, which forfeits a clean record. */
  readonly restarted: boolean;
}

/** Everything Arrows remembers. */
export interface Saved {
  readonly level: number;
  readonly records: Record<string, Record_>;
  readonly progress: Partial<Record<Mode, Progress>>;
}

export const EMPTY: Saved = { level: 1, records: {}, progress: {} };

function isDirection(value: unknown): value is Direction {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function isPiece(value: unknown): value is Piece {
  if (typeof value !== "object" || value === null) return false;
  const piece = value as Record<string, unknown>;
  return (
    typeof piece.id === "number" &&
    Number.isFinite(piece.id) &&
    isDirection(piece.dir) &&
    typeof piece.head === "number" &&
    Number.isInteger(piece.head) &&
    piece.head >= 0 &&
    typeof piece.length === "number" &&
    Number.isInteger(piece.length) &&
    piece.length >= 1
  );
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readLevel(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : 1;
}

function readRecords(value: unknown): Record<string, Record_> {
  const records: Record<string, Record_> = {};
  if (typeof value !== "object" || value === null) return records;
  for (const [key, entry] of Object.entries(value)) {
    if (entry === "cleared" || entry === "clean") records[key] = entry;
  }
  return records;
}

function readProgress(value: unknown): Progress | null {
  if (typeof value !== "object" || value === null) return null;
  const saved = value as Record<string, unknown>;
  if (typeof saved.key !== "string") return null;
  if (!Array.isArray(saved.pieces) || !saved.pieces.every(isPiece)) return null;
  return {
    key: saved.key,
    pieces: saved.pieces as Piece[],
    lives: readNumber(saved.lives, 3),
    collisions: readNumber(saved.collisions, 0),
    restarted: saved.restarted === true,
  };
}

/**
 * Carry a v2 save forward.
 *
 * The in-progress board is dropped — it was built on the old one-arrow-per-cell
 * model and has no meaning under the new one. What is kept is which level the
 * player had reached and which boards they had cleared, because those are the
 * things they would actually notice losing. The records were earned against
 * easier boards, and keeping them is the deliberate choice: telling a returning
 * player their history was wiped is worse than a slightly generous ledger.
 */
function migrateFromV2(raw: string): Saved | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const old = parsed as Record<string, unknown>;
    return {
      level: readLevel(old.level),
      records: readRecords(old.records),
      progress: {},
    };
  } catch {
    return null;
  }
}

/** Read the saved state, falling back to {@link EMPTY} on anything unexpected. */
export function load(): Saved {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      return legacy ? (migrateFromV2(legacy) ?? EMPTY) : EMPTY;
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY;
    const saved = parsed as Record<string, unknown>;

    const progress: Partial<Record<Mode, Progress>> = {};
    const modes: Mode[] = ["levels", "daily"];
    const savedProgress = saved.progress as Record<string, unknown> | undefined;
    for (const mode of modes) {
      const entry = readProgress(savedProgress?.[mode]);
      if (entry) progress[mode] = entry;
    }

    return {
      level: readLevel(saved.level),
      records: readRecords(saved.records),
      progress,
    };
  } catch {
    return EMPTY;
  }
}

/** Write the saved state. Silently gives up if storage is unavailable or full. */
export function save(state: Saved): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private browsing, a full quota, or storage disabled outright. The game is
    // still entirely playable without persistence, so there is nothing to do.
  }
}
