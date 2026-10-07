import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import * as schema from '@asv/db';
import type { Database } from '@asv/db';
import { ac, roles } from '@asv/shared';
import { config } from '../config';

export function createAuth(db: Database) {
  return betterAuth({
    baseURL: config.authUrl(),
    secret: config.authSecret(),
    trustedOrigins: [config.webOrigin()],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    advanced: { useSecureCookies: config.isProd() && config.authUrl().startsWith('https') },
    plugins: [admin({ ac, roles, defaultRole: 'viewer', adminRoles: ['admin'] })],
  });
}
export type Auth = ReturnType<typeof createAuth>;
