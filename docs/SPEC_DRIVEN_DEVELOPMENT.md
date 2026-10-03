# Spec-Driven Development Guide

## Overview

This guide covers the handful of changes that warrant writing something down
before writing code. The bar is deliberately high: these are small apps, and
process that outweighs the codebase is process that gets abandoned. Most work
here needs no spec at all — that is the expected case, not the exception.

## Why Spec-Driven Development

1. **Clarity before code** — for anything bigger than a copy edit, think through
   scope and acceptance criteria before touching files.
2. **Session continuity** — Claude Code sessions start fresh; a spec or plan
   carries context across sessions.
3. **Quality gates** — acceptance criteria give a concrete definition of done
   before a change is called finished.

## Development Workflow

The workflow is 3 steps, not a full pipeline:

```
/0-write-spec  →  /2-plan-spec  →  implement  →  /4-review-diff
```

| Step | Command | Purpose |
|------|---------|---------|
| 0 | `/0-write-spec` | Write the spec (WHAT to build) |
| 2 | `/2-plan-spec` | Create the implementation plan (HOW to build it) — saves to `spec-implementation-plans/` |
| — | implement | Execute the plan, checking off tasks as they land |
| 4 | `/4-review-diff` | Review the diff before merge |

The numbering has gaps because it used to be six steps. There is no
review-spec step and no separate implement-spec command: for apps this size a
second review pass on the spec itself and a dedicated implementation command are
overhead the scope doesn't justify. Skipping straight from plan to
implementation is fine. `tycarolan/cornerman-vision` still runs the older
six-command pipeline — that is history, not a second standard.

### Spec vs Plan

- **Spec** = permanent record of WHAT to build (behavior, requirements,
  acceptance criteria). Lives in `specs/`.
- **Plan** = temporary record of HOW to build it (files, phases, task
  checklists, progress). Lives in `spec-implementation-plans/` and is deleted
  after the implementation is merged.

### When to Write a Spec

**No Spec Required**

- Copy edits
- Dependency bumps
- Styling tweaks
- Single-file changes

**Requires Mini Spec** (Summary + Scope + Acceptance Criteria only)

- A new page or route
- A change to a shared data model
- Anything touching more than ~3 files

**Requires Full Spec** (`docs/SPEC_TEMPLATE.md`, all sections)

- A new user-facing surface with its own state or data source
- Anything that adds a backend or API route
- Anything that adds a third-party integration
- Anything that changes how the app is deployed
- **Anything that changes what this app writes to the hub's ledger** — the
  collectible names are permanent once shipped, and renaming one does not
  migrate the rows already stored under the old name

## Feature Implementation Workflow

**Step 1** — Write the spec:
```
/0-write-spec a daily streak counter
```

**Step 2** — Generate the plan:
```
/2-plan-spec @specs/daily-streak-counter.md
```

**Step 3** — Implement:
```
/clear
implement phase 1 of @spec-implementation-plans/daily-streak-counter.md
```

**Step 4** — Review the diff:
```
commit these changes
/clear
/4-review-diff review the diff for @specs/daily-streak-counter.md
```

**Key points:**
- The plan file is the checkpoint — resume from it across sessions.
- `/clear` between steps gives Claude fresh context and avoids bias.
- Delete the plan from `spec-implementation-plans/` once the work is merged; the
  spec stays.

## Documentation Structure

```
<app>/
├── AGENTS.md                        # Orientation for Claude Code sessions
├── CLAUDE.md                        # A pointer that imports AGENTS.md
├── docs/
│   ├── SPEC_TEMPLATE.md             # Template for new specs
│   ├── PLAN_TEMPLATE.md             # Template for implementation plans
│   └── SPEC_DRIVEN_DEVELOPMENT.md   # This guide
├── CHANGELOG.md                     # Shipped-version history
├── specs/                           # Feature specifications (permanent)
└── spec-implementation-plans/       # Implementation plans (temporary)
```

## Writing Effective Specifications

### Core Principle: Focus on WHAT, not HOW

Specs define behavior and requirements. Implementation details belong in the
plan.

**Bad**: "Add a `useStreak` hook that reads `localStorage` and renders in
`Header.tsx`"

**Good**: "The app shows the player's current streak, which survives a browser
restart and resets when a day is missed."

### Spec Guidelines

1. **No code blocks** — describe behavior in prose. Code blocks become stale;
   prose stays accurate.
2. **Check the current source** before drafting; don't assume shape that isn't
   there.
3. **Define acceptance criteria** — numbered, testable, independently
   verifiable.
4. **Document gotchas** — non-obvious rendering quirks, deploy edge cases,
   anything a future session would otherwise rediscover.
5. **Include a done checklist** — checkboxes matching acceptance criteria plus
   the four quality gates.

### Recognize Common Implementation Creep

Specs often start behavior-focused and accumulate implementation details over
revisions. Watch for these:

**Component internals named in the spec body**

- BAD: "Add a `featured` boolean and branch `Card.tsx` on it to render a
  highlighted border"
- GOOD: "Featured items render visually distinct from the rest."

**Exact file or function names**

- BAD: "Add `getStreak()` to `src/lib/streak.ts`, call it from `page.tsx`"
- GOOD: "The starting surface shows the current streak."

**"Follows the X pattern" references**

- BAD: "Follows the same optional-`href` pattern as the existing card"
- GOOD: "An unavailable item renders as a non-interactive tile rather than a
  dead link."

**Why this matters**: specs that prescribe structure lock the implementer into a
design even after a better one becomes obvious. Specs that describe behavior
remain valid across refactors.

### Quick Self-Check

1. Does this describe **what** the app must do, or **how** it must be coded?
   Rewrite any "how".
2. Can every requirement be turned into a check against the running app? If not,
   tighten it.
3. If a future refactor renames a component or file, does the spec still read
   correctly? If not, strip the names.

## References

- [Spec Template](./SPEC_TEMPLATE.md) — starting point for new specs
- [Plan Template](./PLAN_TEMPLATE.md) — starting point for implementation plans
