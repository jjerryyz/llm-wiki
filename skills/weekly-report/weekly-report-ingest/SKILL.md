# Weekly Report Ingest

Use this skill for `/weekly-report ingest <path>`: import work context into an `llm-wiki` vault for later daily logs, goal progress, time estimates, and weekly reports.

## Preconditions

1. Confirm the vault is initialized. If not, ask the user to run `llm-wiki init`.
2. Read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` if present.
3. Preserve the raw input. Do not summarize directly from memory without saving source evidence.

## Workflow

1. Read the source file or directory named by the user.
2. Copy raw input into `sources/YYYY-MM-DD/`, preserving the original name when possible.
3. Split large sources by topic or date before ingesting.
4. Identify projects, goals, people, blockers, decisions, dates, and measurable work.
5. Run `llm-wiki search "<main project or goal>"` for the main entities mentioned.
6. Create or update relevant pages under the vault's existing structure, usually:
   - `wiki/goals/`
   - `wiki/projects/`
   - `wiki/worklogs/`
7. Add `sources` frontmatter entries to every updated page.
8. Use `[[wikilinks]]` for every durable entity that exists or should exist as a page.
9. Append an entry to `wiki-log.md`:
   ```markdown
   ## [YYYY-MM-DD] weekly-report ingest | Source Title
   - created `page-name` — reason
   - updated `page-name` — what changed
   ```
10. Run `llm-wiki sync`.

## Output Rules

- Summarize raw work context; do not copy long chat or meeting text into wiki pages.
- If the input is not work-report relevant, say so and skip durable writes.
- Mark uncertain claims as questions instead of facts.
