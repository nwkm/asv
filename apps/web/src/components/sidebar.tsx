'use client';
import clsx from 'clsx';
import {
  CalendarDays,
  GraduationCap,
  HandCoins,
  Hammer,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import type { SessionUser } from '@/lib/server-api';

const items = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/participants', key: 'participants', icon: Users },
  { href: '/donations', key: 'donations', icon: HandCoins },
  { href: '/calendar', key: 'calendar', icon: CalendarDays },
  { href: '/courses', key: 'courses', icon: GraduationCap },
  { href: '/services', key: 'services', icon: Hammer },
] as const;

export function Sidebar({ user, locale }: { user: SessionUser; locale: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const all =
    user.role === 'admin'
      ? [...items, { href: '/admin/users', key: 'users', icon: ShieldCheck } as const]
      : items;

  return (
    <aside className="flex flex-col gap-6 bg-forest-900 p-5 text-forest-50 lg:sticky lg:top-0 lg:h-dvh">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-3xl font-semibold tracking-wide">ASV</span>
        <div className="flex gap-1 text-xs" aria-label={t('common.language')}>
          {(['fr', 'en'] as const).map((l) => (
            <Link
              key={l}
              href={pathname}
              locale={l}
              className={clsx(
                'rounded px-1.5 py-0.5 uppercase',
                l === locale ? 'bg-ochre-500 text-forest-900' : 'opacity-70 hover:opacity-100',
              )}
            >
              {l}
            </Link>
          ))}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto lg:flex-1 lg:flex-col" aria-label="Main">
        {all.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition',
                active ? 'bg-forest-50 font-semibold text-forest-900' : 'hover:bg-white/10',
              )}
            >
              <Icon size={18} />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-4 text-sm lg:block">
        <div className="min-w-0">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-xs opacity-70 max-lg:hidden">
            {user.email} · {t(`appRole.${user.role ?? 'viewer'}`)}
          </p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center lg:mt-3 gap-2 text-xs opacity-80 hover:opacity-100"
          onClick={async () => {
            await authClient.signOut();
            router.replace('/login');
            router.refresh();
          }}
        >
          <LogOut size={14} /> {t('nav.signOut')}
        </button>
      </div>
    </aside>
  );
}
