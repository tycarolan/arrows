"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type Board,
  type Piece,
  canLeave,
  occupancyOf,
  pathAhead,
  removePiece,
} from "@/lib/board";
import { dayNumber } from "@/lib/day";
import { type Mode, boardFor, difficultyLabel } from "@/lib/generate";
import { BoardGrid, type Flash } from "./BoardGrid";
import { type Progress, type Saved, load, save } from "@/lib/storage";

/**
 * The game.
 *
 * Holds all the state and none of the rules — whether a tap is legal is
 * `src/lib/board.ts`, what a board looks like is `src/lib/generate.ts`. This
 * file decides only what happens as a consequence: lives, records, and what
 * the player is told.
 *
 * ## Lives
 *
 * Tapping a blocked piece costs a life and flashes both the piece and whatever
 * stopped it, which is the game teaching you to read a lane. Three collisions
 * resets the board rather than ending the run — a dead end you cannot retry
 * would be a strange punishment in a puzzle whose whole content is working out
 * the order.
 */

/** Never resubscribes; the value it reports cannot change after mount. */
const subscribe = () => () => {};

/**
 * Whether we are past the first client render.
 *
 * Boards come from `localStorage` and the daily depends on the local clock, so
 * the first paint cannot match what the server rendered. Gating on this and
 * showing a placeholder is what keeps that from being a hydration mismatch.
 */
function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** One board being played. */
interface Session {
  readonly key: string;
  readonly board: Board;
  readonly lives: number;
  readonly collisions: number;
  readonly restarted: boolean;
}

const LIVES = 3;

export function Game() {
  const mounted = useMounted();
  const [saved] = useState<Saved>(load);
  const [today] = useState(() => dayNumber(new Date()));

  const [mode, setMode] = useState<Mode>("levels");
  const [level, setLevel] = useState(saved.level);
  const [records, setRecords] = useState(saved.records);

  const [session, setSession] = useState<Session | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState("");

  const persisted = useRef<Saved>(saved);
  const key = mode === "levels" ? `L${level}` : `D${today}`;

  const { board: initial, openingMoves } = useMemo(
    () => boardFor(mode, mode === "levels" ? level : today),
    [mode, level, today],
  );

  // Start the board, or resume the saved one if it is the same board.
  useEffect(() => {
    if (!mounted || session?.key === key) return;
    const resumable = persisted.current.progress[mode];
    const resume = resumable && resumable.key === key ? resumable : null;

    setSession({
      key,
      board: resume ? { size: initial.size, pieces: resume.pieces } : initial,
      lives: resume ? resume.lives : LIVES,
      collisions: resume ? resume.collisions : 0,
      restarted: resume ? resume.restarted : false,
    });
    setFlash(null);
    setNotice(null);
  }, [mounted, key, session?.key, initial, mode]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 600);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!mounted || !session) return;
    const progress: Progress = {
      key: session.key,
      pieces: session.board.pieces as Piece[],
      lives: session.lives,
      collisions: session.collisions,
      restarted: session.restarted,
    };
    const next: Saved = {
      level,
      records,
      progress: { ...persisted.current.progress, [mode]: progress },
    };
    persisted.current = next;
    save(next);
  }, [mounted, session, level, records, mode]);

  const cleared = session !== null && session.board.pieces.length === 0;
  const clean = session !== null && session.collisions === 0 && !session.restarted;

  const tap = useCallback(
    (id: number) => {
      if (!session || cleared) return;
      const piece = session.board.pieces.find((p) => p.id === id);
      if (!piece) return;

      const occupancy = occupancyOf(session.board);
      if (!canLeave(session.board, piece, occupancy)) {
        const { blockedBy } = pathAhead(session.board, piece, occupancy);
        setFlash({ tapped: id, blocker: blockedBy as number });

        const lives = session.lives - 1;
        if (lives > 0) {
          setSession({ ...session, lives, collisions: session.collisions + 1 });
          return;
        }
        setSession({
          key: session.key,
          board: initial,
          lives: LIVES,
          collisions: session.collisions + 1,
          restarted: true,
        });
        setNotice("Three collisions — board reset.");
        return;
      }

      const board = removePiece(session.board, id);
      setSession({ ...session, board });
      setFlash(null);

      if (board.pieces.length > 0) return;

      const wasClean = session.collisions === 0 && !session.restarted;
      setRecords((current) => {
        const existing = current[session.key];
        if (existing === "clean") return current;
        if (existing === "cleared" && !wasClean) return current;
        return { ...current, [session.key]: wasClean ? "clean" : "cleared" };
      });
    },
    [session, cleared, initial],
  );

  const restart = useCallback(() => {
    if (!session) return;
    setSession({
      key: session.key,
      board: initial,
      lives: LIVES,
      collisions: session.collisions,
      restarted: true,
    });
    setFlash(null);
    setNotice(null);
  }, [session, initial]);

  const goToLevel = useCallback((next: number) => {
    setLevel(Math.max(1, Math.floor(next)));
    setJumpOpen(false);
  }, []);

  if (!mounted || !session) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-muted">Building a board…</p>
      </div>
    );
  }

  const record = records[key];
  const remaining = session.board.pieces.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            {mode === "levels" ? (
              <>
                <button
                  type="button"
                  disabled={level <= 1}
                  onClick={() => goToLevel(level - 1)}
                  aria-label="Go back a level"
                  className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJumpValue(String(level));
                    setJumpOpen((open) => !open);
                  }}
                  aria-expanded={jumpOpen}
                  className="text-lg font-semibold tracking-tight underline decoration-line decoration-2 underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  Level {level}
                </button>
                <button
                  type="button"
                  onClick={() => goToLevel(level + 1)}
                  aria-label="Go forward a level"
                  className="text-muted transition-colors hover:text-foreground"
                >
                  ›
                </button>
              </>
            ) : (
              <span className="text-lg font-semibold tracking-tight">
                Daily {today}
              </span>
            )}
          </div>
          <p className="truncate text-xs uppercase tracking-widest text-muted">
            {difficultyLabel(openingMoves)} · {initial.pieces.length} arrows
            {record ? ` · ${record}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex rounded-full border border-line text-xs">
            {(["levels", "daily"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={`rounded-full px-3 py-1 capitalize transition-colors ${
                  mode === option
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </header>

      {jumpOpen && mode === "levels" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = Number.parseInt(jumpValue, 10);
            if (Number.isFinite(parsed)) goToLevel(parsed);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={jumpValue}
            onChange={(event) => setJumpValue(event.target.value)}
            aria-label="Jump to level"
            className="w-24 rounded-md border border-line bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground"
          />
          <button
            type="submit"
            className="rounded-md border border-line px-3 py-1 text-sm transition-colors hover:border-foreground"
          >
            Go
          </button>
        </form>
      ) : null}

      <BoardGrid
        board={session.board}
        flash={flash}
        onTap={tap}
        locked={cleared}
      />

      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1"
            aria-label={`${session.lives} of ${LIVES} lives left`}
          >
            {Array.from({ length: LIVES }, (_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  index < session.lives ? "bg-foreground" : "bg-line"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={restart}
            className="rounded-full border border-line px-3 py-1 transition-colors hover:border-foreground"
          >
            Restart
          </button>
        </div>
        <p className="text-muted" aria-live="polite">
          {cleared
            ? clean
              ? "Cleared — clean"
              : "Cleared"
            : `${remaining} left`}
        </p>
      </div>

      {cleared ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-white/[0.03] px-3 py-2 text-sm">
          <span>
            {clean
              ? "Cleared with no collisions."
              : `Cleared — ${session.collisions} collision${
                  session.collisions === 1 ? "" : "s"
                }.`}
          </span>
          {mode === "levels" ? (
            <button
              type="button"
              onClick={() => goToLevel(level + 1)}
              className="rounded-full bg-foreground px-3 py-1 text-xs text-background"
            >
              Next level
            </button>
          ) : null}
        </div>
      ) : notice ? (
        <div className="rounded-md border border-refuse/50 bg-refuse/10 px-3 py-2 text-sm text-muted">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
