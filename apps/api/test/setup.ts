import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { fileURLToPath } from 'node:url';

const base = process.env.TEST_ADMIN_DATABASE_URL ?? 'postgres://asv:asv@localhost:5432/postgres';
const testUrl = process.env.TEST_DATABASE_URL ?? 'postgres://asv:asv@localhost:5432/asv_test';

const admin = postgres(base, { max: 1 });
const [exists] = await admin`select 1 from pg_database where datname = 'asv_test'`;
if (!exists) await admin.unsafe('create database asv_test');
await admin.end();

const client = postgres(testUrl, { max: 1 });
await migrate(drizzle(client), {
  migrationsFolder: fileURLToPath(new URL('../../../packages/db/drizzle', import.meta.url)),
});
await client.end();

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testUrl;
process.env.BETTER_AUTH_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.WEB_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT = '100000';
