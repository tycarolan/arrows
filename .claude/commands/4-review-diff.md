Review the working diff or current branch against master.

review @AGENTS.md

Work at the scope asked — review only, don't fix what you find. State in one
sentence what you're about to do before the first tool call. Report as markdown
in chat; no report file gets written.

## Task

Review: $ARGUMENTS

With no target given: review the working diff (`git diff`, plus staged changes)
if the tree is dirty, otherwise the current branch against `master`
(`git diff master...HEAD`).

## Scope

Out of scope: running the quality gates as a precondition — the author is
responsible for typecheck, lint, test, and build passing before review. Do flag
anything in the diff that looks like it would break one.

## Two checks

**Check A — rule contradictions.** Does a hunk contradict a documented rule in
`AGENTS.md`? Judgment-based, not a linter — read the rule, read the change,
decide. Findings are advisory (Should Fix / Nitpick) unless the rule exists
specifically to prevent a known bug, in which case it's a Blocker.

**Check B — missed doc update.** Does the diff introduce a durable fact or
convention — a new dependency, a changed data shape, a new build step, a new env
var — without a matching update to `AGENTS.md` or `CHANGELOG.md`? Should Fix by
default; judgment call, not every change needs a doc touch.

## Web-specific review dimensions

- **Accessibility** — semantic elements over div soup, `focus-visible` states on
  anything interactive, adequate contrast, alt text on images and icons.
- **Responsive behavior** — Tailwind breakpoints consistent with the rest of the
  app; no fixed widths or heights that break on mobile.
- **Next.js App Router correctness** — server vs. client component boundary
  (`"use client"` only where state/effects/browser APIs actually require it),
  `Metadata`/`Viewport` exports used correctly, `next/image` and `next/font`
  used over raw `<img>`/`<link>` tags where applicable.

## Key checks

- **The rules/rendering split** — new logic with rules in it belongs in a pure
  module under `src/lib/` with a test, not inside a component. This is the one
  convention that silently degrades the test suite when broken.
- **YAGNI** — no unused exports, speculative props, or dead code
- **Type safety** — no unnecessary `any`
- **Conventions** — matches existing Tailwind class style, 2-space indentation,
  no new dependency without justification

## Ledger integration (arcade apps only)

If the diff touches submission to the hub, check it against the five rules in
`docs/PROFILE_INTEGRATION.md` in `TaioTech/taiotech` — most of all
`credentials: "include"`, whose absence mints a fresh anonymous player on every
submission and errors nowhere. Also: is a collectible being renamed? That does
not migrate stored rows.

## Output format

1. **Summary** — overall assessment in one to two sentences
2. **Areas touched**
3. **Blockers** — must fix: bugs, broken builds, accessibility failures
4. **Should Fix** — quality, edge cases, missed doc updates
5. **Nitpicks** — style, naming
6. **Good stuff** — what's done well, briefly

Explain why something matters, not just what it is, and suggest a concrete fix
where you have one.

## Report back

A one-line severity rollup (counts per tier). The writeup above is the reply — no
file is written.
