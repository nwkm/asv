import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Bun only auto-loads .env from the cwd (apps/api); also read the repo-root .env without overriding real env vars.
const rootEnv = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(rootEnv)) {
  for (const line of readFileSync(rootEnv, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]!] === undefined)
      process.env[m[1]!] = m[2]!.replace(/^(['"])(.*)\1$/, '$2');
  }
}

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
};

export const config = {
  databaseUrl: () => required('DATABASE_URL'),
  authSecret: () => required('BETTER_AUTH_SECRET'),
  authUrl: () => required('BETTER_AUTH_URL', 'http://localhost:3000'),
  webOrigin: () => required('WEB_ORIGIN', 'http://localhost:3000'),
  port: () => Number(process.env.API_PORT ?? 4000),
  isProd: () => process.env.NODE_ENV === 'production',
};
