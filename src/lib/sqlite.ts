import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import type { WikiConfig } from './config.js';
import type { WikiPage } from './wiki.js';

async function loadBetterSqlite3() {
  try {
    const mod = await import('better-sqlite3');
    return mod.default;
  } catch  (error) {
    throw new Error(
      `better-sqlite3 is required for SQLite integration. Install it with: npm install better-sqlite3: ${error}`
    ) as Error;
  }
}

export interface SQLiteConfig {
  path: string;
  embeddingModel?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  chunkStrategy?: 'page' | 'section' | 'paragraph';
}

export interface SQLiteSearchResult {
  slug: string;
  title: string;
  similarity: number;
}

export type Embedder = (texts: string[], config: SQLiteConfig) => Promise<number[][]>;

function resolveDbPath(dbPath: string, vaultRoot: string): string {
  return isAbsolute(dbPath) ? dbPath : join(vaultRoot, dbPath);
}

function nowIso(): string {
  return new Date().toISOString();
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function float32ToBuffer(values: number[]): Buffer {
  const array = Float32Array.from(values);
  return Buffer.from(array.buffer);
}

function bufferToFloat32(buffer: Buffer): Float32Array {
  return new Float32Array(buffer.buffer, buffer.byteOffset, Math.floor(buffer.byteLength / 4));
}

function chunkByParagraph(text: string, maxTokens: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    const approxTokens = candidate.split(/\s+/).filter(Boolean).length;
    if (approxTokens > maxTokens && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export function chunkText(
  text: string,
  strategy: SQLiteConfig['chunkStrategy'] = 'section'
): string[] {
  if (!text.trim()) return [];

  if (strategy === 'page') {
    return [text.trim()];
  }

  if (strategy === 'section') {
    const sections = text
      .split(/(?=^##\s)/m)
      .map(section => section.trim())
      .filter(Boolean);

    if (sections.length === 0) {
      return [text.trim()];
    }

    const chunks: string[] = [];
    for (const section of sections) {
      if (section.length > 2000) {
        chunks.push(...chunkByParagraph(section, 500));
      } else {
        chunks.push(section);
      }
    }
    return chunks;
  }

  return chunkByParagraph(text, 500);
}

export async function openAIEmbed(texts: string[], config: SQLiteConfig): Promise<number[][]> {
  const apiKey = config.openaiApiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set. Set it in environment or in the [sqlite] config.');
  }

  const model = config.embeddingModel ?? 'text-embedding-3-small';
  const baseUrl = (config.openaiBaseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${body}`);
  }

  const result = await response.json() as { data: Array<{ index: number; embedding: number[] }> };
  return result.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}

/**
 * SQLite-backed vector index that mirrors the embed.py pattern:
 * chunks are embedded client-side and stored as float32 blobs.
 */
export class SQLiteClient {
  readonly backend = 'sqlite' as const;
  private db: any;

  constructor(
    private readonly config: SQLiteConfig,
    private readonly vaultRoot: string,
    private readonly embedder: Embedder = openAIEmbed
  ) {}

  private async getDb() {
    if (!this.db) {
      const Database = await loadBetterSqlite3();
      const dbPath = resolveDbPath(this.config.path, this.vaultRoot);
      mkdirSync(dirname(dbPath), { recursive: true });
      this.db = new Database(dbPath);
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
  }

  async ensureSchema(): Promise<void> {
    const db = await this.getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS wiki_index (
        slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        sources_json TEXT NOT NULL DEFAULT '[]',
        content_hash TEXT NOT NULL,
        updated TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        embedded_at TEXT
      );

      CREATE TABLE IF NOT EXISTS wiki_page_sources (
        slug TEXT NOT NULL REFERENCES wiki_index(slug) ON DELETE CASCADE,
        source_path TEXT NOT NULL,
        PRIMARY KEY (slug, source_path)
      );

      CREATE TABLE IF NOT EXISTS wiki_embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL REFERENCES wiki_index(slug) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding BLOB NOT NULL,
        model TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_wiki_embeddings_slug
      ON wiki_embeddings(slug);
    `);
  }

  private buildEmbeddingText(page: WikiPage): string {
    return [`# ${page.title}`, page.description ?? '', page.content]
      .filter(Boolean)
      .join('\n\n');
  }

  private async embedChunks(chunks: string[]): Promise<number[][]> {
    const batchSize = 100;
    const embeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const result = await this.embedder(batch, this.config);
      embeddings.push(...result);
    }

    return embeddings;
  }

  async upsertPage(page: WikiPage, contentHash: string): Promise<void> {
    const db = await this.getDb();
    const fullText = this.buildEmbeddingText(page);
    const chunks = chunkText(fullText, this.config.chunkStrategy ?? 'section');
    const embeddings = chunks.length > 0 ? await this.embedChunks(chunks) : [];

    db.prepare(`
      INSERT INTO wiki_index (slug, title, description, content, tags_json, sources_json, content_hash, updated, embedded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (slug) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        content = excluded.content,
        tags_json = excluded.tags_json,
        sources_json = excluded.sources_json,
        content_hash = excluded.content_hash,
        updated = excluded.updated,
        embedded_at = excluded.embedded_at
    `).run(
      page.slug,
      page.title,
      page.description ?? '',
      page.content,
      JSON.stringify(page.tags),
      JSON.stringify(page.sources),
      contentHash,
      page.updated ?? '',
      nowIso()
    );

    db.prepare(`DELETE FROM wiki_page_sources WHERE slug = ?`).run(page.slug);
    const insertSource = db.prepare(`
      INSERT INTO wiki_page_sources (slug, source_path)
      VALUES (?, ?)
      ON CONFLICT DO NOTHING
    `);
    for (const source of page.sources) {
      insertSource.run(page.slug, source);
    }

    db.prepare(`DELETE FROM wiki_embeddings WHERE slug = ?`).run(page.slug);
    if (chunks.length === 0) {
      return;
    }

    const insertEmbedding = db.prepare(`
      INSERT INTO wiki_embeddings (slug, chunk_index, chunk_text, embedding, model)
      VALUES (?, ?, ?, ?, ?)
    `);
    const model = this.config.embeddingModel ?? 'text-embedding-3-small';
    for (let i = 0; i < chunks.length; i++) {
      insertEmbedding.run(page.slug, i, chunks[i], float32ToBuffer(embeddings[i]), model);
    }
  }

  async deletePage(slug: string): Promise<void> {
    const db = await this.getDb();
    db.prepare(`DELETE FROM wiki_index WHERE slug = ?`).run(slug);
  }

  async vectorSearch(query: string, limit: number = 10): Promise<SQLiteSearchResult[]> {
    await this.ensureSchema();
    const db = await this.getDb();
    const hasEmbeddings = db.prepare(`
      SELECT 1
      FROM wiki_embeddings
      LIMIT 1
    `).get() as { 1: number } | undefined;
    if (!hasEmbeddings) return [];

    const [queryEmbedding] = await this.embedder([query], this.config);
    if (!queryEmbedding) return [];

    const rows = db.prepare(`
      SELECT e.slug, w.title, e.chunk_text, e.embedding
      FROM wiki_embeddings e
      JOIN wiki_index w ON w.slug = e.slug
    `).all() as Array<{ slug: string; title: string; chunk_text: string; embedding: Buffer }>;

    const queryVector = Float32Array.from(queryEmbedding);
    const bestBySlug = new Map<string, SQLiteSearchResult>();

    for (const row of rows) {
      const similarity = cosineSimilarity(queryVector, bufferToFloat32(row.embedding));
      const existing = bestBySlug.get(row.slug);
      if (!existing || similarity > existing.similarity) {
        bestBySlug.set(row.slug, {
          slug: row.slug,
          title: row.title,
          similarity,
        });
      }
    }

    return [...bestBySlug.values()]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async getContentHash(slug: string): Promise<string | null> {
    const db = await this.getDb();
    const row = db.prepare(`SELECT content_hash FROM wiki_index WHERE slug = ?`).get(slug) as
      | { content_hash: string }
      | undefined;
    return row?.content_hash ?? null;
  }

  async getAllHashes(): Promise<Map<string, string>> {
    const db = await this.getDb();
    const rows = db.prepare(`SELECT slug, content_hash FROM wiki_index`).all() as Array<{
      slug: string;
      content_hash: string;
    }>;
    return new Map(rows.map(row => [row.slug, row.content_hash]));
  }

  async pagesBySource(sourcePath: string): Promise<string[]> {
    const db = await this.getDb();
    const rows = db.prepare(`
      SELECT slug FROM wiki_page_sources WHERE source_path = ?
    `).all(sourcePath) as Array<{ slug: string }>;
    return rows.map(row => row.slug);
  }
}

export function createSQLiteClient(config: WikiConfig, vaultRoot: string): SQLiteClient | null {
  if (!config.sqlite?.path) return null;
  return new SQLiteClient(config.sqlite, vaultRoot);
}
