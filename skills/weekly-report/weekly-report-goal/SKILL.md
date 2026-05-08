# Weekly Report Goal

Use this skill for `/weekly-report goal`: create, update, or review work goals used by daily logs and weekly reports.

## Preconditions

1. Read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
2. Run `llm-wiki search "goal objective status"` and search for the user's specific goal terms.
3. Prefer updating an existing goal page over creating a duplicate.

## Goal Frontmatter

Use the vault's conventions first. If absent, use:

```yaml
---
title: Goal Title
description: One-line target outcome
tags: [goal]
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []
---
```

Allowed status values:

- `active`
- `paused`
- `done`
- `archived`

## Goal Body

```markdown
## Objective

## Success Criteria

## Related Work

## Progress Log

## Risks and Blockers

## Next Steps
```

## Workflow

1. Extract the target outcome, success criteria, deadline, and related work from user input and recent worklogs.
2. Create or update the goal page.
3. Add dated progress log entries; do not overwrite prior progress history.
4. Link related `[[worklogs]]`, `[[projects]]`, people, and weekly reports.
5. If the goal is vague, propose a sharper title and measurable success criteria before writing.
6. Append a `weekly-report goal` entry to `wiki-log.md`.
7. Run `llm-wiki sync`.

## Output Rules

- Keep goals outcome-focused, not task lists.
- Separate confirmed progress from inferred progress.
- Do not mark a goal done unless the user or source evidence clearly supports it.
