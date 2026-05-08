# Weekly Report Hours

Use this skill for `/weekly-report hours`: estimate or review time spent from worklogs and source evidence.

## Preconditions

1. Read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
2. Identify the target date, week, worklog, project, or goal.
3. Read relevant worklogs and source evidence before estimating.

## Workflow

1. Run `llm-wiki search "<target> time estimate hours worklog"`.
2. Read relevant worklog, goal, project, meeting, and source pages.
3. Break work into task or category rows.
4. Estimate hours for each row using evidence from the source material.
5. Provide confidence and reasoning for each estimate.
6. Ask for user confirmation before writing estimates into a worklog or weekly report.
7. If estimates are accepted, update the target page and append to `wiki-log.md`.
8. Run `llm-wiki sync` if files changed.

## Estimate Format

```markdown
| Work Item | Estimate | Confidence | Evidence |
| --- | ---: | --- | --- |
| Item | 1.5h | medium | [[worklog-page]] |
```

Also include:

```markdown
## Assumptions

## Uncertain Items
```

## Output Rules

- Treat hours as estimates, never exact measurements.
- Do not infer productivity or performance ratings.
- Prefer ranges when evidence is weak.
- Keep manually provided hours authoritative over AI estimates.
