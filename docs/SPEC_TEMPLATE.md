<!--
BEFORE YOU START: check `docs/SPEC_DRIVEN_DEVELOPMENT.md` → "When to Write
a Spec" — confirm this change actually warrants a spec (mini or full)
rather than a direct edit.

Behaviour belongs in this spec. File names, component internals, and
struct/type shapes belong in the plan.

LENGTH: size the spec to its scope. Every acceptance criterion should be
testable and every gotcha actionable; nothing else earns space. A section
with nothing to say gets one line saying so ("No open questions") rather
than a paragraph explaining its own emptiness.
-->

# {Feature Name}

> **Status**: Draft | In Review | Approved | In Progress | Complete
> **Dependencies**: {list any prerequisite work, or "None"}
> **Date**: YYYY-MM-DD

## Summary

2-3 sentence overview of what this feature provides and why.

---

## Scope

### In Scope

- What this spec covers (be specific)
- Rationale for each scope decision where non-obvious

### Out of Scope

- What is explicitly excluded and why

---

## Acceptance Criteria

Numbered, testable requirements. Each should be independently verifiable.

1. {Criterion} — {brief rationale if non-obvious}
2. {Criterion}
3. {Criterion}

---

## Implementation Steps

Organized by area (page/route, data model, components, config, etc.).
Describe behavior and patterns in prose — no code blocks.

### {Area 1: e.g., Page / Route}

- {What it does and how it fits the existing page structure}

### {Area 2: e.g., Data Model}

- {Additions to a shared type or stored shape, described behaviorally}

### {Area 3: e.g., Components}

- {New or changed component, its responsibility}

---

## File Summary

### New Files

| Path | Purpose |
|------|---------|
| `{path}` | {purpose} |

### Modified Files

| Path | Changes |
|------|---------|
| `{path}` | {what changes} |

### Docs

| Path | Changes |
|------|---------|
| `AGENTS.md` | {what to update — only if orientation content changes} |
| `CHANGELOG.md` | {entry under `## [Unreleased]` or the next version section, Keep a Changelog format} |

---

## Gotchas

Non-obvious things discovered during planning. Each should be
specific and actionable.

- {Gotcha} — {why it matters and how to handle it}

---

## Done Checklist

Checkboxes matching acceptance criteria. All must pass before
marking the spec Complete.

- [ ] {Matches AC #1}
- [ ] {Matches AC #2}
- [ ] {Matches AC #3}
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] `CHANGELOG.md` entry added under `## [Unreleased]` (or under the new version header if this ships under a tag) — Keep a Changelog format
- [ ] `AGENTS.md` updated only if orientation content changed — otherwise leave it alone

---

## Open Questions

| # | Question | Context | Decision |
|---|----------|---------|----------|
| 1 | {Question} | {Why it matters} | Pending |

---

<!--
MINI SPEC: for a new page/route, a data-model change, or anything touching
more than ~3 files, only Summary, Scope, and Acceptance Criteria are
required — the rest of this template can be omitted.
-->
