import { count, createDb, participants } from '@asv/db';
import { seedDomain } from '@asv/db/seed';
import { createAuth } from './auth/auth';
import { config } from './config';

const { db, client } = createDb(config.databaseUrl(), { max: 2 });
const auth = createAuth(db);
const password = process.env.SEED_PASSWORD ?? 'ChangeMe123!';

const users = [
  { email: 'admin@asv.local', name: 'Admin', role: 'admin' },
  { email: 'staff@asv.local', name: 'Staff', role: 'staff' },
  { email: 'viewer@asv.local', name: 'Viewer', role: 'viewer' },
] as const;

const reset = process.argv.includes('--reset');
const [existing] = await db.select({ n: count() }).from(participants);
if (!reset && (existing?.n ?? 0) > 0) {
  console.log('Database already has data; skipping seed (pass --reset to wipe and reseed).');
  await client.end();
  process.exit(0);
}

const ctx = await auth.$context;
let adminId: string | undefined;
for (const u of users) {
  const existing = await ctx.internalAdapter.findUserByEmail(u.email);
  if (existing) {
    if (u.role === 'admin') adminId = existing.user.id;
    continue;
  }
  const res = await auth.api.createUser({ body: { ...u, password } });
  if (u.role === 'admin') adminId = res.user.id;
}

const stats = await seedDomain(db, { createdByUserId: adminId });
console.log('seeded', stats, '\nusers:', users.map((u) => u.email).join(', '));
await client.end();
