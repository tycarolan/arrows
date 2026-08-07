/**
 * The day number, and the boundary it turns over on.
 *
 * The daily board is generated from this number, so it decides which puzzle a
 * player sees. It has to be stable forever and it has to agree with the day the
 * player believes they are on.
 *
 * The boundary is the player's **local midnight**, reached by reading the local
 * calendar date and re-keying it through `Date.UTC` — an indirection that turns
 * a year-month-day into a plain integer and so makes the result depend on which
 * date the player is on rather than on their offset from UTC. That is what
 * keeps it stable across daylight saving and correct either side of the
 * meridian. A UTC boundary would hand players east of it tomorrow's board
 * before dinner, which is the one thing a daily cannot get wrong.
 *
 * The epoch is this app's own. There is no workshop-wide origin date — Scuttle
 * and Chroma count from different ones, and the hub's ledger is keyed per app
 * and never compares them.
 *
 * Neither the boundary nor the epoch may move again. Shifting either rewrites
 * which days a player did and did not play, retroactively and irreversibly.
 */

/** Milliseconds in a day. */
const DAY_MS = 86_400_000;

/** Day 1 — the day Arrows was built. Fixed forever. */
const EPOCH_UTC_MS = Date.UTC(2026, 7, 5);

const EPOCH_DAY = Math.floor(EPOCH_UTC_MS / DAY_MS);

/**
 * The day number for an instant. Day 1 is the epoch.
 *
 * Takes the instant rather than reading the clock, so every caller is explicit
 * about when "now" is and this stays pure and testable.
 */
export function dayNumber(now: Date): number {
  const localDate = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(localDate / DAY_MS) - EPOCH_DAY + 1;
}
