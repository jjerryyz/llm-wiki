import type { WikiConfig } from './config.js';
import { createDB9Client } from './db9.js';
import { createSQLiteClient } from './sqlite.js';

export type VectorStoreClient =
  | ReturnType<typeof createDB9Client>
  | ReturnType<typeof createSQLiteClient>;

export function createVectorClient(config: WikiConfig, vaultRoot: string) {
  const db9 = createDB9Client(config);
  if (db9) return db9;
  return createSQLiteClient(config, vaultRoot);
}

export function vectorBackendName(client: NonNullable<VectorStoreClient>): string {
  return client.backend === 'sqlite' ? 'SQLite' : 'DB9';
}
