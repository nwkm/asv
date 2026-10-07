import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

const crud = ['create', 'read', 'update', 'delete'] as const;

export const statement = {
  ...defaultStatements,
  participant: crud,
  donation: crud,
  course: crud,
  service: crud,
  dashboard: ['read'],
} as const;

export const ac = createAccessControl(statement);

const domainAll = {
  participant: [...crud],
  donation: [...crud],
  course: [...crud],
  service: [...crud],
  dashboard: ['read' as const],
};

export const roles = {
  admin: ac.newRole({ ...adminAc.statements, ...domainAll }),
  staff: ac.newRole(domainAll),
  viewer: ac.newRole({
    participant: ['read'],
    donation: ['read'],
    course: ['read'],
    service: ['read'],
    dashboard: ['read'],
  }),
};

type Resource = 'participant' | 'donation' | 'course' | 'service' | 'dashboard';
type Action = 'create' | 'read' | 'update' | 'delete';

/** Pure check usable on both API and web without a round trip. */
export function can(role: string | null | undefined, resource: Resource, action: Action): boolean {
  const r = roles[(role ?? 'viewer') as keyof typeof roles];
  if (!r) return false;
  const allowed = (r.statements as Record<string, readonly string[] | undefined>)[resource];
  return !!allowed?.includes(action);
}
export type { Resource, Action };
