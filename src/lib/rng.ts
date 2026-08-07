/**
 * Deterministic randomness.
 *
 * Every board in this game is generated, never stored. A level's board and a
 * given day's board have to come out identical on every device and every
 * reload, so nothing here may touch `Math.random`. A seed goes in, the same
 * sequence comes out, forever.
 *
 * That permanence is the constraint worth naming: changing either function
 * below silently rewrites every level and every past daily. Treat both as
 * fixed.
 */

/**
 * A seeded pseudo-random source returning values in `[0, 1)`.
 *
 * Mulberry32 — small, fast, and good enough for shuffling placement candidates.
 * It is not cryptographic and does not need to be.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A 32-bit seed derived from any set of parts.
 *
 * FNV-1a over the parts joined by `:`. Used to turn a human-meaningful key —
 * `("arrows", "levels", 12)` — into a seed, so the caller never has to invent
 * seed numbers or worry about two different boards colliding on one.
 */
export function seedFrom(...parts: (string | number)[]): number {
  let hash = 0x811c9dc5;
  const key = parts.join(":");
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
