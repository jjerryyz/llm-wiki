# Weekly Report Generate

Use this skill for `/weekly-report generate [week]`: generate a personal weekly report draft from worklogs, goals, projects, and source evidence in an `llm-wiki` vault.

## Preconditions

1. Read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
2. Determine `week_start` and `week_end`. If omitted, use the current week.
3. Run `llm-wiki search` for the week's goals, worklogs, projects, blockers, and decisions.

## Weekly Report Frontmatter

Use the vault's conventions first. If absent, use:

```yaml
---
title: Weekly Report YYYY-WW
description: Weekly work report
tags: [weekly-report]
week_start: YYYY-MM-DD
week_end: YYYY-MM-DD
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []
---
```

## Report Body

```markdown
## Overview

## Goal Progress

## Key Work

## Time Allocation

## Risks and Blockers

## Next Week Plan

## Evidence
```

## Workflow

1. Read relevant worklogs, goal pages, project pages, and source summaries.
2. Generate a concise weekly report using the report body structure.
3. Ground every important accomplishment in `[[wikilinks]]` or source-backed pages.
4. Include goal progress and blockers even when progress is partial.
5. Write the draft under `reports/weekly/`.
6. If useful for long-term navigation, also create or update `wiki/weekly-reports/`.
7. Append a `weekly-report generate` entry to `wiki-log.md`.
8. Run `llm-wiki sync`.

## Output Rules

- Produce a draft the user can edit, not an overconfident final truth.
- Do not invent work that is not in sources, worklogs, or user input.
- Include `Missing Evidence` when the week has sparse records.
