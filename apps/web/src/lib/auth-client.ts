import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { ac, roles } from '@asv/shared';

export const authClient = createAuthClient({ plugins: [adminClient({ ac, roles })] });
