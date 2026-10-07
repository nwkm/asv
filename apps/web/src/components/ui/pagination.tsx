import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function Pagination({
  page,
  pageSize,
  total,
  pathname,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  pathname: string;
  params: Record<string, string | undefined>;
}) {
  const t = await getTranslations('common');
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => ({
    pathname,
    query: { ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: p },
  });
  const cls = 'rounded-lg border border-line bg-card px-3 py-1.5 text-sm hover:border-forest-600';
  return (
    <nav
      className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <span>
        {t('results', { count: total })} · {t('page', { page, pages })}
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Link className={cls} href={href(page - 1)}>
            {t('previous')}
          </Link>
        )}
        {page < pages && (
          <Link className={cls} href={href(page + 1)}>
            {t('next')}
          </Link>
        )}
      </span>
    </nav>
  );
}
