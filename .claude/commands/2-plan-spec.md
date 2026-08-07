Create an implementation plan from an existing spec — the operational record of
HOW to build it.

review @AGENTS.md
review @docs/SPEC_DRIVEN_DEVELOPMENT.md
review @docs/PLAN_TEMPLATE.md

Work at the scope asked. State in one sentence what you're about to do before the
first tool call. This is a small repo — research it directly, don't delegate to a
subagent. The plan is the deliverable: write it to disk; the user reviews it
there, not in chat, so don't gate on approval before writing it.

## Task

Plan the spec: $ARGUMENTS

If `$ARGUMENTS` is empty, list the specs in `specs/` and ask which one. Produce a
plan — do not implement it.

## Ground rules

- The spec is the contract. Plan what's specified, not what you think should also
  be there.
- The plan is operational (HOW); the spec is behavioral (WHAT). Don't re-specify
  behavior the spec already covers.

## Step 1: Research

1. Read the target spec.
2. Read the code it touches.
3. Read the closest existing pattern for style, and match it.

## Step 2: Design

Choose an approach and commit to it; revisit only if research contradicts it.
Produce a short plan summary covering:

- Files to create or modify — paths and purpose only
- Implementation order and why
- Any new shared type or data shape
- Open decisions research couldn't settle

The design has to satisfy these constraints as part of designing it, not as a
pass afterward:

- **Existing conventions** — server components by default, rules in pure modules
  under `src/lib/`, Tailwind utility classes matching current style, no new
  dependency without justification
- **YAGNI** — no speculative props, unused exports, or premature abstraction
- **Spec alignment** — only what's specified

## Step 3: Write the plan

Write to `spec-implementation-plans/<name>.md` using `docs/PLAN_TEMPLATE.md`.
Structure it so implementation can proceed from the plan alone:

- Every task is a checkbox item under its phase
- Each phase's Gate names a real command: `npm run typecheck`, `npm run lint`,
  `npm run test`, or `npm run build`
- A Progress table shows status at a glance

Length: file tables, phase task lists, and the shapes later phases depend on.
Don't restate the spec's behavior or list every prop of every component.

## Report back

- The plan file path
- A short summary: phases, key decisions, risk areas
- Any open decisions research couldn't resolve

**Next step**: once the plan is approved, implement from it directly.
