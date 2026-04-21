import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { SQLiteClient } from '../src/lib/sqlite.js';
import type { WikiPage } from '../src/lib/wiki.js';

function makePage(slug: string, title: string, content: string): WikiPage {
  return {
    path: `wiki/${slug}.md`,
    relativePath: `${slug}.md`,
    slug,
    title,
    description: `About ${title}`,
    content,
    tags: ['test'],
    sources: ['2026-04-21/test-source.md'],
    aliases: [],
    wikilinks: [],
    mtime: Date.now(),
    updated: '2026-04-21',
  };
}

function fakeEmbedder(texts: string[]): Promise<number[][]> {
  const embeddings = texts.map(text => {
    const normalized = text.toLowerCase();
    if (
      normalized.includes('consensus')
      || normalized.includes('distributed')
      || normalized.includes('raft')
      || normalized.includes('paxos')
    ) {
      return [1, 0, 0];
    }
    if (
      normalized.includes('cooking')
      || normalized.includes('pasta')
      || normalized.includes('carbonara')
    ) {
      return [0, 1, 0];
    }
    return [0, 0, 1];
  });
  return Promise.resolve(embeddings);
}

describe('SQLite integration', () => {
  let dbPath: string;
  let client: SQLiteClient;

  beforeEach(async () => {
    dbPath = join(tmpdir(), `llm-wiki-sqlite-${Date.now()}.sqlite`);
    client = new SQLiteClient({ path: dbPath }, tmpdir(), fakeEmbedder);
    await client.ensureSchema();
  });

  afterEach(async () => {
    await client.close();
    rmSync(dbPath, { force: true });
    rmSync(`${dbPath}-shm`, { force: true });
    rmSync(`${dbPath}-wal`, { force: true });
  });

  it('should upsert and retrieve a page hash', async () => {
    await client.upsertPage(
      makePage('test-page', 'Test Page', 'This is a test page about distributed systems.'),
      'abc123'
    );

    const hash = await client.getContentHash('test-page');
    expect(hash).toBe('abc123');
  });

  it('should update a page on upsert', async () => {
    await client.upsertPage(makePage('test-page', 'Test Page Updated', 'Updated content.'), 'def456');

    const hash = await client.getContentHash('test-page');
    expect(hash).toBe('def456');
  });

  it('should vector search', async () => {
    await client.upsertPage(
      makePage('consensus', 'Consensus', 'Distributed consensus algorithms like Raft and Paxos.'),
      'hash1'
    );
    await client.upsertPage(
      makePage('cooking', 'Cooking', 'How to make pasta carbonara with eggs and bacon.'),
      'hash2'
    );

    const results = await client.vectorSearch('distributed systems agreement protocol', 5);
    expect(results.length).toBeGreaterThan(0);

    const consensusIdx = results.findIndex(result => result.slug === 'consensus');
    const cookingIdx = results.findIndex(result => result.slug === 'cooking');
    expect(consensusIdx).toBeGreaterThanOrEqual(0);
    expect(cookingIdx).toBeGreaterThanOrEqual(0);
    expect(consensusIdx).toBeLessThan(cookingIdx);
  });

  it('should return no results for an uninitialized database', async () => {
    const emptyDbPath = join(tmpdir(), `llm-wiki-sqlite-empty-${Date.now()}.sqlite`);
    const emptyClient = new SQLiteClient(
      { path: emptyDbPath },
      tmpdir(),
      async () => {
        throw new Error('embedder should not be called for an empty index');
      }
    );

    try {
      const results = await emptyClient.vectorSearch('distributed systems agreement protocol', 5);
      expect(results).toEqual([]);
    } finally {
      await emptyClient.close();
      rmSync(emptyDbPath, { force: true });
      rmSync(`${emptyDbPath}-shm`, { force: true });
      rmSync(`${emptyDbPath}-wal`, { force: true });
    }
  });

  it('should get all hashes', async () => {
    await client.upsertPage(makePage('consensus', 'Consensus', 'Consensus notes.'), 'hash1');
    const hashes = await client.getAllHashes();
    expect(hashes.get('consensus')).toBe('hash1');
  });

  it('should track page-source mappings', async () => {
    await client.upsertPage(makePage('consensus', 'Consensus', 'Consensus notes.'), 'hash1');
    const pages = await client.pagesBySource('2026-04-21/test-source.md');
    expect(pages).toContain('consensus');
  });

  it('should delete a page', async () => {
    await client.upsertPage(makePage('cooking', 'Cooking', 'Cooking notes.'), 'hash2');
    await client.deletePage('cooking');
    const hash = await client.getContentHash('cooking');
    expect(hash).toBeNull();
  });
});
