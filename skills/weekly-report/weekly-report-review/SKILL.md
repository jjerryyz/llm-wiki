# Weekly Report Review

Use this skill for `/weekly-report review [week]`: review an existing weekly report draft for missing evidence, weak claims, goal gaps, blockers, and next-week planning.

## Preconditions

1. Read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
2. Locate the target weekly report draft. If the week is omitted, use the current week.
3. Read supporting worklogs, goals, project pages, and sources before reviewing.

## Review Checklist

- Goal progress is represented for active goals.
- Key work is specific and evidence-backed.
- Time allocation is either sourced, estimated with caveats, or omitted.
- Risks and blockers are not hidden.
- Next week plan follows naturally from unfinished work and goals.
- Claims link to `[[wikilinks]]` or source-backed pages.
- Missing evidence is called out rather than filled in.

## Workflow

1. Run `llm-wiki search "<week> weekly report worklog goal blocker"`.
2. Read the weekly report draft and supporting pages.
3. Present findings first, ordered by severity:
   - Critical: unsupported or misleading claims
   - Warning: missing goal progress, blockers, or next steps
   - Info: wording, structure, or clarity improvements
4. If the user asks for fixes, edit the draft with evidence-backed changes.
5. Add an `Open Questions` section when user input is needed.
6. Append a `weekly-report review` entry to `wiki-log.md` if files changed.
7. Run `llm-wiki sync` if files changed.

## Output Format

```markdown
## Findings

## Suggested Edits

## Missing Evidence

## Open Questions
```

## Output Rules

- Review before rewriting.
- Do not make the report sound more certain than the evidence supports.
- Keep user-authored content when it is accurate and specific.
