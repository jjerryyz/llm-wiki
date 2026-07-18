import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import matter from 'gray-matter';

export interface WikiPage {
  path: string;
  relativePath: string;
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  sources: string[];
  created?: string;
  updated?: string;
  aliases: string[];
  content: string;
  wikilinks: string[];
  mtime: number;
}

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

function normalizeScalar(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number'
    || typeof value === 'bigint'
    || typeof value === 'boolean'
  ) {
    return String(value);
  }
  return undefined;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => normalizeScalar(item))
    .filter((item): item is string => item !== undefined);
}

export function toWikiPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function extractWikilinks(content: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_RE.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}

export function listMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const fullPath = join(entry.parentPath ?? entry.path, entry.name);
        files.push(fullPath);
      }
    }
  } catch {
    // directory doesn't exist
  }
  return files;
}

export function parseWikiPage(filePath: string, wikiDir: string): WikiPage {
  const raw = readFileSync(filePath, 'utf-8');
  const hasFrontmatter = /^---[ \t]*(?:\r?\n|$)/.test(raw);
  if (hasFrontmatter) {
    const openingLineEnd = raw.indexOf('\n');
    const afterOpening = openingLineEnd === -1 ? '' : raw.slice(openingLineEnd + 1);
    if (!/^---[ \t]*\r?$/m.test(afterOpening)) {
      throw new Error(`Failed to parse frontmatter in "${filePath}": missing closing delimiter`);
    }
  }

  let parsed: ReturnType<typeof matter>;
  try {
    parsed = matter(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse frontmatter in "${filePath}": ${detail}`, {
      cause: error,
    });
  }
  const { data, content } = parsed;
  if (hasFrontmatter && normalizeScalar(data.title) === undefined) {
    throw new Error(`Invalid frontmatter in "${filePath}": missing required "title" field`);
  }
  const stat = statSync(filePath);
  const rel = toWikiPath(relative(wikiDir, filePath));
  const slug = rel.replace(/\.md$/, '');
  const title = normalizeScalar(data.title) ?? basename(filePath, '.md');

  return {
    path: filePath,
    relativePath: rel,
    slug,
    title,
    description: normalizeScalar(data.description),
    tags: normalizeStringArray(data.tags),
    sources: normalizeStringArray(data.sources),
    created: normalizeScalar(data.created),
    updated: normalizeScalar(data.updated),
    aliases: normalizeStringArray(data.aliases),
    content,
    wikilinks: extractWikilinks(content),
    mtime: stat.mtimeMs,
  };
}

export function loadWikiPages(wikiDir: string): WikiPage[] {
  return listMarkdownFiles(wikiDir).map(f => parseWikiPage(f, wikiDir));
}
