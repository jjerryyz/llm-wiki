import { Command } from 'commander';
import { contentHash } from '../lib/sync.js';
import { loadWikiPages } from '../lib/wiki.js';
import { loadConfig, requireVaultRoot, vaultPaths } from '../lib/config.js';
import { createSQLiteClient } from '../lib/sqlite.js';

export const embedCommand = new Command('embed')
  .description('Embed wiki pages into the local SQLite index')
  .argument('[slug]', 'wiki page slug to embed')
  .option('--all', 'embed all wiki pages')
  .option('--stale', 'embed pages missing from SQLite or whose hash changed')
  .action(async (slug: string | undefined, opts: { all?: boolean; stale?: boolean }) => {
    const root = requireVaultRoot();
    const paths = vaultPaths(root);
    const config = loadConfig(root);
    const sqlite = createSQLiteClient(config, root);

    if (!sqlite) {
      console.error('SQLite is not configured. Add a [sqlite] section to .llm-wiki/config.toml first.');
      process.exit(1);
    }

    const pages = loadWikiPages(paths.wiki);
    await sqlite.ensureSchema();

    try {
      if (opts.all) {
        console.log(`Embedding ${pages.length} pages into SQLite...`);
        let done = 0;

        for (const page of pages) {
          await sqlite.upsertPage(page, contentHash(page.path));
          done += 1;
          if (done % 50 === 0) {
            console.log(`  ${done}/${pages.length} pages embedded`);
          }
        }

        console.log(`Done. ${done} pages embedded.`);
        return;
      }

      if (opts.stale) {
        const hashes = await sqlite.getAllHashes();
        const stalePages = pages.filter(page => hashes.get(page.slug) !== contentHash(page.path));

        if (stalePages.length === 0) {
          console.log('All SQLite embeddings are up to date.');
          return;
        }

        console.log(`Found ${stalePages.length} stale pages. Embedding...`);
        for (const page of stalePages) {
          await sqlite.upsertPage(page, contentHash(page.path));
        }
        console.log(`Done. ${stalePages.length} pages embedded.`);
        return;
      }

      if (!slug) {
        console.error('Usage: llm-wiki embed <slug>|--all|--stale');
        process.exit(1);
      }

      const page = pages.find(item => item.slug === slug);
      if (!page) {
        console.error(`Page not found: ${slug}`);
        process.exit(1);
      }

      await sqlite.upsertPage(page, contentHash(page.path));
      console.log(`Embedded ${slug} into SQLite`);
    } finally {
      await sqlite.close();
    }
  });
