import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseWikiPage } from '../src/lib/wiki.js';

describe('wiki parsing', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  });

  it('normalizes date-like frontmatter and scalar arrays to strings', () => {
    const wikiDir = mkdtempSync(join(tmpdir(), 'llm-wiki-parse-'));
    tempDirs.push(wikiDir);

    const filePath = join(wikiDir, 'distributed-consensus.md');
    writeFileSync(filePath, `---
title: Distributed Consensus
description: 42
tags:
  - distributed-systems
  - 7
sources:
  - source-a.md
  - 123
created: 2026-04-21
updated: 2026-04-22
aliases:
  - consensus
  - true
---

See [[raft]] and [[paxos]].
`);

    const page = parseWikiPage(filePath, wikiDir);

    expect(page.title).toBe('Distributed Consensus');
    expect(page.description).toBe('42');
    expect(page.tags).toEqual(['distributed-systems', '7']);
    expect(page.sources).toEqual(['source-a.md', '123']);
    expect(page.created).toBe('2026-04-21');
    expect(page.updated).toBe('2026-04-22');
    expect(page.aliases).toEqual(['consensus', 'true']);
    expect(page.wikilinks).toEqual(['raft', 'paxos']);
  });
});
import { describe, it, expect } from 'vitest';
import { extractWikilinks, toWikiPath } from '../src/lib/wiki.js';

describe('extractWikilinks', () => {
  it('should extract simple wikilinks', () => {
    const links = extractWikilinks('See [[raft]] and [[paxos]] for details.');
    expect(links).toEqual(['raft', 'paxos']);
  });

  it('should extract wikilinks with display text', () => {
    const links = extractWikilinks('See [[raft|Raft Algorithm]] for details.');
    expect(links).toEqual(['raft']);
  });

  it('should extract wikilinks with paths', () => {
    const links = extractWikilinks('See [[papers/raft-2014|Raft Paper]].');
    expect(links).toEqual(['papers/raft-2014']);
  });

  it('should deduplicate wikilinks', () => {
    const links = extractWikilinks('[[raft]] is great. See [[raft]] again.');
    expect(links).toEqual(['raft']);
  });

  it('should handle no wikilinks', () => {
    const links = extractWikilinks('No links here.');
    expect(links).toEqual([]);
  });

  it('should handle wikilinks with spaces', () => {
    const links = extractWikilinks('See [[ distributed consensus ]].');
    expect(links).toEqual(['distributed consensus']);
  });

  it('should not extract markdown links', () => {
    const links = extractWikilinks('See [raft](https://raft.github.io).');
    expect(links).toEqual([]);
  });
});

describe('toWikiPath', () => {
  it('should normalize Windows separators to forward slashes', () => {
    expect(toWikiPath('foo\\bar\\baz.md')).toBe('foo/bar/baz.md');
  });

  it('should keep forward slashes unchanged', () => {
    expect(toWikiPath('foo/bar/baz.md')).toBe('foo/bar/baz.md');
  });
});
