'use client';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { APP_ROLES } from '@asv/shared';
import { Badge, Button, Dialog, Field, Input, Select, tableCls } from '@/components/ui/ui';
import { authClient } from '@/lib/auth-client';

type U = { id: string; name: string; email: string; role?: string | null; banned?: boolean | null };

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations();
  const [users, setUsers] = useState<U[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await authClient.admin.listUsers({
      query: { limit: 100, sortBy: 'createdAt' },
    });
    setUsers((data?.users ?? []) as U[]);
  }, []);
  useEffect(() => {
    let live = true;
    authClient.admin.listUsers({ query: { limit: 100, sortBy: 'createdAt' } }).then(({ data }) => {
      if (live) setUsers((data?.users ?? []) as U[]);
    });
    return () => {
      live = false;
    };
  }, []);

  const guard = async (
    fn: () => Promise<{ error?: { message?: string } | null }>,
    ok = t('common.saved'),
  ) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) return (toast.error(error.message ?? t('common.error')), false);
    toast.success(ok);
    await load();
    return true;
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> {t('users.new')}
        </Button>
      </div>
      <div className={tableCls.wrap}>
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              {[t('users.name'), t('fields.email'), t('users.role'), ''].map((h, i) => (
                <th key={i} className={tableCls.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableCls.tbody}>
            {users.map((u) => (
              <tr key={u.id} className={tableCls.tr}>
                <td data-label={t('users.name')} className={tableCls.td}>
                  {u.name} {u.banned && <Badge tone="clay">{t('users.banned')}</Badge>}
                </td>
                <td data-label={t('fields.email')} className={tableCls.td}>
                  {u.email}
                </td>
                <td data-label={t('users.role')} className={tableCls.td}>
                  <Select
                    value={u.role ?? 'viewer'}
                    disabled={busy || u.id === currentUserId}
                    onChange={(e) =>
                      guard(() =>
                        authClient.admin.setRole({
                          userId: u.id,
                          role: e.target.value as 'admin' | 'staff' | 'viewer',
                        }),
                      )
                    }
                    className="w-40"
                  >
                    {APP_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`appRole.${r}`)}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className={`${tableCls.td} text-right max-md:justify-end`}>
                  {u.id !== currentUserId && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        guard(() =>
                          u.banned
                            ? authClient.admin.unbanUser({ userId: u.id })
                            : authClient.admin.banUser({ userId: u.id }),
                        )
                      }
                    >
                      {u.banned ? t('users.unban') : t('users.ban')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('users.new')}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const ok = await guard(
              () =>
                authClient.admin.createUser({
                  name: String(f.get('name')),
                  email: String(f.get('email')),
                  password: String(f.get('password')),
                  role: String(f.get('role')) as 'admin' | 'staff' | 'viewer',
                }),
              t('users.created'),
            );
            if (ok) setOpen(false);
          }}
        >
          <Field label={t('users.name')}>
            <Input name="name" required autoFocus />
          </Field>
          <Field label={t('fields.email')}>
            <Input name="email" type="email" required />
          </Field>
          <Field label={`${t('users.password')} — ${t('users.passwordHint')}`}>
            <Input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </Field>
          <Field label={t('users.role')}>
            <Select name="role" defaultValue="viewer">
              {APP_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`appRole.${r}`)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={busy}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
