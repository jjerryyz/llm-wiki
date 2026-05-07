## /ingest <path>

Process new source material into the wiki.

### Steps

1. **Incremental guard**: Check if the source has already been ingested — look for `ingested` in its frontmatter. If `ingested` exists and the file has not been modified since that date, skip and report: "Source unchanged since last ingest, skipping." If modified, proceed (this is a re-ingest).
2. Read `wiki-purpose.md`, `wiki-schema.md`, and `wiki-agent.md` (if present) to understand the wiki's scope, page types, naming conventions, structure rules, and ingest criteria (MUST / MAY / NEVER categories). If `wiki-agent.md` is absent, use the default criteria from `CLAUDE.md` / `AGENTS.md`.
3. **Ingest filter**: Evaluate the source against the MUST / MAY / NEVER criteria. Drop inputs that match NEVER (casual chat, credentials, duplicates, emoji-only); proceed for MUST; use judgment for MAY. Skip silently when the input is filtered out — no log entry needed.
4. Read the source material provided by the user.
5. Decide whether this ingest needs discussion before editing wiki pages:
   - If the wiki already has a clear structure and the change is only a small addition or minor refinement that fits the existing framework, proceed directly.
   - If the ingest would change structure, naming, scope, page boundaries, or linking strategy in a non-obvious way, discuss the plan with the user first.
   - When discussion is needed, summarize the proposed new pages, updated pages, naming, and link strategy before editing.
6. If the wiki is still empty, do not start writing pages immediately:
   - First discuss and agree on the wiki's organization rules with the user.
   - Cover at least directory structure, whether to use subdirectories, wiki language, and filename format.
   - After agreement, write those rules into `wiki-schema.md` before ingesting content.
7. Copy the raw source into `sources/` using date-based storage rules:
   - A single file goes to `sources/YYYY-MM-DD/<original-filename>`
   - A directory goes to `sources/YYYY-MM-DD/<original-directory>/`
   - Preserve the original file or directory name whenever possible.
   - If a name already exists inside that date folder, rename with a version suffix.
   - **Split large sources by topic or date** — do not store one monolithic file. For example, split chat logs by day (`chat-2026-04-17.md`, `chat-2026-04-18.md`) or by topic (`browser-timeout-discussion.md`). This enables granular incremental re-ingestion.
8. Run `llm-wiki search` or scan `wiki/` to see existing wiki pages.
9. Analyze the source content and decide:
   - Which new wiki pages to create
   - Which existing pages to update with new information
   - What cross-references to add using `[[wikilinks]]`
   - A single source may touch 5–15 wiki pages.
10. Write/update markdown files in `wiki/` with proper frontmatter:
   ```yaml
   ---
   title: Page Title
   description: One-line summary
   aliases: [alternate names, abbreviations, translations]
   tags: [domain-specific tags from wiki-schema.md]
   sources: [YYYY-MM-DD/source-filename.md]
   status: open | resolved | wontfix  # required for issue/bug pages
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   ---
   ```
   - The `sources` field is **required**. List paths relative to `sources/`, without the `sources/` prefix.
   - The `aliases` field should include common abbreviations, translations, and alternate names that people might use to refer to this topic (e.g., `Strategy` → `aliases: [Strategy, 认证策略]`). This improves search and wikilink matching.
   - The `status` field is **required for issue/bug pages** (`open`, `resolved`, `wontfix`). Do not only write status in prose — put it in frontmatter for machine-readable queries.
   - When updating an existing page, **merge** new information. Do not overwrite unless contradicted by a more authoritative or recent source. If contradicted, note the conflict with both sources cited.
   - Use `[[wikilinks]]` generously — every entity mention that has (or should have) its own page gets a link.
   - Keep pages focused on a single topic. If a section grows too large, split into its own page.
   - Add a `## Related` section at the bottom: `- [[page-name]] — one-line relationship description`
11. Add frontmatter to the source document:
    ```yaml
    ---
    ingested: YYYY-MM-DD
    wiki_pages: [list of wiki pages created/updated]
    ---
    ```
12. Append an entry to `wiki-log.md`:
    ```
    ## [YYYY-MM-DD] ingest | Source Title
    - created `page-name` — reason
    - updated `page-name` — what changed
    ```
13. Run `llm-wiki sync` to update the search index.

### Ingest Guidelines

- Each page should focus on a single topic.
- Write in clear, concise prose. Summarize, don't copy.
- Always add cross-references between related pages.
- If you reference an entity that doesn't have a wiki page yet, still use `[[wikilink]]` — it creates a discoverable "wanted page."
- Ingestion should be collaborative when structure, naming, or scope is uncertain, but straightforward additions within an established framework can be applied directly.
- Use descriptive slugs following `wiki-schema.md` conventions.
- The `sources` field in frontmatter is mandatory — every claim must be traceable.