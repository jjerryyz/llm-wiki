# Weekly Report Daily

Use this skill for `/weekly-report daily [date]`: compile or improve a daily worklog from sources and existing wiki pages.

## Preconditions

1. Read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
2. Determine the target date. If omitted, use today's date.
3. Run `llm-wiki search "<date> worklog"` and search for the day's main projects or meetings.

## Worklog Frontmatter

Use the vault's conventions first. If absent, use:

```yaml
---
title: Worklog YYYY-MM-DD
description: Daily work summary
tags: [worklog]
date: YYYY-MM-DD
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []
---
```

## Worklog Body

```markdown
## Summary

## Work Completed

## Decisions

## Blockers

## Time Estimate

## Links
```

## Workflow

1. Read relevant source files, existing worklog pages, goal pages, and project pages.
2. Build or update the target date's worklog page.
3. Group facts into completed work, decisions, blockers, and time estimate.
4. Link each meaningful project, goal, person, or recurring topic with `[[wikilinks]]`.
5. If evidence is weak, add `Missing Evidence` instead of inventing details.
6. Append a `weekly-report daily` entry to `wiki-log.md`.
7. Run `llm-wiki sync`.

## Output Rules

- Keep the worklog concise and factual.
- Do not turn the daily log into a polished weekly report.
- Preserve uncertainty when source evidence is incomplete.
