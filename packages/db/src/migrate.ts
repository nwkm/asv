import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import { createDb } from './client';

// Bun only auto-loads .env from the cwd; when run from packages/db, fall back to the repo-root .env.
async function rootEnvUrl() {
  const file = Bun.file(fileURLToPath(new URL('../../../.env', import.meta.url)));
  if (!(await file.exists())) return undefined;
  return /^DATABASE_URL=(.+)$/m.exec(await file.text())?.[1]?.trim();
}

const url = process.env.DATABASE_URL ?? (await rootEnvUrl());
if (!url) throw new Error('DATABASE_URL is required (set it or add it to the repo-root .env)');

const { db, client } = createDb(url, { max: 1 });
const folder = process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL('../drizzle', import.meta.url));
await migrate(db, { migrationsFolder: folder });
await client.end();
console.log('migrations applied');
