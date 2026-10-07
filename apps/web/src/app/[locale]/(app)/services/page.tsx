import { getTranslations, setRequestLocale } from 'next-intl/server';
import { can } from '@asv/shared';
import { Badge, Empty, PageHeader, tableCls } from '@/components/ui/ui';
import { Link } from '@/i18n/navigation';
import { fmtDateTime } from '@/lib/format';
import { api, getSessionUser } from '@/lib/server-api';
import { ServiceDialog } from './service-dialog';

type Service = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  assigned: number;
};

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, user, list] = await Promise.all([
    getTranslations(),
    getSessionUser(),
    api<Service[]>('/services', locale),
  ]);
  return (
    <>
      <PageHeader
        title={t('services.title')}
        subtitle={t('services.subtitle')}
        actions={can(user?.role, 'service', 'create') && <ServiceDialog />}
      />
      <div className={tableCls.wrap}>
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              {[
                t('common.title'),
                t('common.start'),
                t('common.end'),
                t('common.location'),
                t('services.assigned'),
              ].map((h) => (
                <th key={h} className={tableCls.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableCls.tbody}>
            {list.map((s) => (
              <tr key={s.id} className={tableCls.tr}>
                <td data-label={t('common.title')} className={tableCls.td}>
                  <Link
                    href={`/services/${s.id}`}
                    className="font-medium text-forest-700 hover:underline"
                  >
                    {s.title}
                  </Link>
                </td>
                <td data-label={t('common.start')} className={`${tableCls.td} tabular-nums`}>
                  {fmtDateTime(s.startsAt)}
                </td>
                <td data-label={t('common.end')} className={`${tableCls.td} tabular-nums`}>
                  {fmtDateTime(s.endsAt)}
                </td>
                <td data-label={t('common.location')} className={tableCls.td}>
                  {s.location ?? t('common.none')}
                </td>
                <td data-label={t('services.assigned')} className={tableCls.td}>
                  <Badge>{s.assigned}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty>{t('common.noResults')}</Empty>}
      </div>
    </>
  );
}
