# Weekly Report Ops

Use this skill as the entry point for personal weekly-report work inside an `llm-wiki` vault. Do not create a separate repository or standalone app. Use the existing `llm-wiki` CLI and current vault files.

## Route to Specific Skills

- Use `weekly-report-ingest` for importing work context from chat logs, meeting notes, task exports, and daily notes.
- Use `weekly-report-daily` for compiling or improving a daily worklog.
- Use `weekly-report-goal` for creating, updating, or reviewing goals.
- Use `weekly-report-hours` for estimating or reviewing time spent.
- Use `weekly-report-generate` for generating a weekly report draft.
- Use `weekly-report-review` for reviewing an existing weekly report draft.

## Shared Invariants

1. Work inside an initialized `llm-wiki` vault. If missing, ask the user to run `llm-wiki init`.
2. Before writing, read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
3. Use `llm-wiki search "<query>"` before creating new pages.
4. Keep raw evidence under `sources/YYYY-MM-DD/`.
5. Write durable knowledge into `wiki/` with `[[wikilinks]]`.
6. Write generated report files under `reports/` when useful.
7. After any write, append to `wiki-log.md` and run `llm-wiki sync`.

## Suggested Vault Structure

Follow `wiki-schema.md` first. If the vault has no convention, use:

```text
wiki/
  goals/
  projects/
  worklogs/
  weekly-reports/
sources/
reports/
  daily/
  weekly/
```

## Output Rules

- Preserve raw evidence in `sources/`; summarize in `wiki/`.
- Cite wiki pages with `[[wikilinks]]`.
- Never fabricate tasks, decisions, hours, or outcomes.
- When evidence is incomplete, write `Open Questions` or `Missing Evidence`.
# Weekly Report

Use this skill to maintain a personal AI-assisted weekly report workflow inside an `llm-wiki` vault. Do not create a separate repository or standalone weekly-report app. Use the existing `llm-wiki` CLI and the current vault files.

## Commands

- `/weekly-report ingest <path>` — ingest work context such as chat logs, meeting notes, task exports, or daily notes.
- `/weekly-report daily [date]` — compile or improve a daily work log.
- `/weekly-report goal` — create, update, or review work goals.
- `/weekly-report hours` — estimate or review time spent from work records.
- `/weekly-report generate [week]` — generate a weekly report draft.
- `/weekly-report review [week]` — review an existing weekly report for gaps, weak evidence, and next-week planning.

## Invariants

1. Work inside an initialized `llm-wiki` vault. If the vault is not initialized, ask the user to run `llm-wiki init` first.
2. Before making changes, read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
3. Use `llm-wiki search "<query>"` before creating new pages, so goals, projects, people, and recurring work are linked to existing pages.
4. Store raw source material under `sources/YYYY-MM-DD/` following the base ingest skill's source rules.
5. Write durable knowledge into `wiki/` pages using `[[wikilinks]]`; write generated report drafts under `reports/` if that directory exists, otherwise create it.
6. After any write, append an entry to `wiki-log.md` and run `llm-wiki sync`.

## Suggested Vault Structure

Use these pages/directories when the vault does not already define a different convention:

```text
wiki/
  goals/
  projects/
  worklogs/
  weekly-reports/
sources/
reports/
  daily/
  weekly/
```

Prefer the vault's existing naming rules from `wiki-schema.md`. If no rules exist, use lowercase kebab-case filenames.

## Page Types

### Goal Pages

Goal pages track durable outcomes.

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

Include:

- Current objective
- Success criteria
- Related projects and people
- Progress log
- Risks or blockers

### Worklog Pages

Worklog pages summarize a day or focused work session.

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

Use this structure:

```markdown
## Summary

## Work Completed

## Decisions

## Blockers

## Time Estimate

## Links
```

### Weekly Report Pages

Weekly report pages are polished deliverables generated from worklogs, goals, and sources.

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

Use this structure:

```markdown
## Overview

## Goal Progress

## Key Work

## Time Allocation

## Risks and Blockers

## Next Week Plan

## Evidence
```

## Workflows

### `/weekly-report ingest <path>`

1. Read the source file or directory.
2. Copy raw input into `sources/YYYY-MM-DD/`.
3. Run `llm-wiki search` for the main projects, goals, and entities mentioned.
4. Create or update relevant `wiki/goals/`, `wiki/projects/`, and `wiki/worklogs/` pages.
5. Add `sources` frontmatter entries to every updated wiki page.
6. Append a `weekly-report ingest` entry to `wiki-log.md`.
7. Run `llm-wiki sync`.

### `/weekly-report daily [date]`

1. Search for sources and pages related to the date.
2. Build or update the date's worklog page.
3. Group content into completed work, decisions, blockers, and time estimate.
4. Link each meaningful project, goal, person, or recurring topic with `[[wikilinks]]`.
5. If evidence is weak, mark it as a gap instead of inventing details.
6. Append to `wiki-log.md` and run `llm-wiki sync`.

### `/weekly-report goal`

1. Search existing goals with `llm-wiki search "goal objective status"`.
2. Create or update goal pages from user input and recent worklogs.
3. Keep status values simple: `active`, `paused`, `done`, `archived`.
4. Add a dated progress log entry instead of overwriting history.
5. Link related worklogs, projects, and weekly reports.
6. Append to `wiki-log.md` and run `llm-wiki sync`.

### `/weekly-report hours`

1. Read relevant worklogs and source evidence.
2. Estimate time by task or category.
3. Provide confidence and reasoning.
4. Keep estimates editable; never present them as exact measurements.
5. Write accepted estimates into the related worklog or weekly report.
6. Append to `wiki-log.md` and run `llm-wiki sync` if files changed.

### `/weekly-report generate [week]`

1. Determine `week_start` and `week_end` from the user's request. If omitted, use the current week.
2. Run `llm-wiki search` for the week's goals, worklogs, projects, blockers, and decisions.
3. Read all relevant pages and source summaries.
4. Generate a weekly report using the Weekly Report Pages structure.
5. Include evidence links to `[[worklog-pages]]`, `[[goal-pages]]`, and source-backed project pages.
6. Write the draft under `reports/weekly/` and, if useful for long-term navigation, also create or update `wiki/weekly-reports/`.
7. Append to `wiki-log.md` and run `llm-wiki sync`.

### `/weekly-report review [week]`

1. Read the weekly report draft and supporting worklogs.
2. Check for missing goal progress, vague claims, unsupported accomplishments, absent blockers, and weak next-week plans.
3. Report findings first.
4. If the user asks to fix the draft, edit it with specific evidence-backed improvements.
5. Append to `wiki-log.md` and run `llm-wiki sync` if files changed.

## Output Rules

- Prefer concise Markdown.
- Preserve raw evidence in `sources/`; summarize in `wiki/`.
- Cite wiki pages with `[[wikilinks]]`.
- Never fabricate tasks, decisions, hours, or outcomes.
- When evidence is incomplete, write a clear `Open Questions` or `Missing Evidence` section.
