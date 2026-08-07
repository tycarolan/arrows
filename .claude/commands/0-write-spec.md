Write a feature specification — the permanent record of WHAT to build.

review @AGENTS.md
review @docs/SPEC_DRIVEN_DEVELOPMENT.md
review @docs/SPEC_TEMPLATE.md

Work at the scope asked — no unrelated scope creep. State in one sentence what
you're about to do before the first tool call; give an update only when you find
something that changes direction. This is a small repo — research it directly,
don't delegate to a subagent. The spec is the deliverable: write it to disk,
don't leave the substance only in chat.

## Task

Write a spec for: $ARGUMENTS

If `$ARGUMENTS` is empty, ask what to spec and wait.

## Step 1: Is a spec even warranted?

Check the request against the thresholds in `docs/SPEC_DRIVEN_DEVELOPMENT.md`.
Most changes don't clear the bar — a copy change, a style tweak, a single-file
edit. If this one doesn't, say so and stop instead of writing a spec for a
trivial change.

## Step 2: Research

Read the code the feature touches before drafting. Pick an approach and commit
to it; revisit only if research contradicts it.

Resolve during research, since each changes what the spec must say:

- Does it change a shared type or data shape, or just add data conforming to
  one?
- Server or client component? Server by default — flag it if the feature
  genuinely needs `"use client"`, and why.
- Does the rule being added belong in a pure module under `src/lib/`? That is
  where this repo's testable logic lives, and putting rules in a component is
  how the test suite quietly stops covering them.
- Does it need new `Metadata`/`Viewport` or a new route segment?
- Any new dependency, and is it justified?
- **Does it change what this app writes to the hub's ledger?** Collectible names
  are permanent once shipped. See `docs/PROFILE_INTEGRATION.md` in
  `TaioTech/taiotech`.
- Accessibility and responsive-behavior implications.

## Step 3: Write the spec

Follow `docs/SPEC_TEMPLATE.md`. Describe behavior in prose and reference existing
files by path rather than reproducing their code. Length: enough to make every
acceptance criterion testable — a one-component change earns a short spec. No
filler sections; a section with nothing to say gets one line ("No new
dependencies").

Save to `specs/<name>.md`.

When scope is ambiguous, make a defensible assumption and record it in the spec's
Open Questions table rather than stopping to ask. Present those open questions to
the user before treating the spec as final.

## Report back

The spec path, a one-line summary of what it covers, and any Open Questions rows
left pending.
