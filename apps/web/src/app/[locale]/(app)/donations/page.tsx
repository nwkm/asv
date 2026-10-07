import { Download, Plus } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { can, DONATION_TYPES } from '@asv/shared';
import { FilterBar, ParamDate, ParamSelect, SearchBox } from '@/components/ui/filters';
import { Pagination } from '@/components/ui/pagination';
import { Badge, Empty, PageHeader, tableCls } from '@/components/ui/ui';
import { Link } from '@/i18n/navigation';
import { CURRENCY, formatCents, isoToDdMmYyyy, localeTag } from '@/lib/format';
import { api, getSessionUser, qs } from '@/lib/server-api';
import { DeleteButton } from '../participants/participant-dialog';

type Page = {
  items: {
    id: string;
    firstName: string;
    lastName: string;
    familyName: string | null;
    amountCents: number;
    type: 'course' | 'service' | 'other';
    donatedOn: string;
    receivedByFirstName: string;
    participantId: string | null;
  }[];
  total: number;
  totalAmountCents: number;
  page: number;
  pageSize: number;
};
const tone = { course: 'forest', service: 'clay', other: 'ochre' } as const;

export default async function DonationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filters = { search: sp.search, type: sp.type, from: sp.from, to: sp.to };
  const [t, user, data] = await Promise.all([
    getTranslations(),
    getSessionUser(),
    api<Page>(`/donations${qs({ page: sp.page, ...filters })}`, locale),
  ]);
  const tag = localeTag(locale);

  return (
    <>
      <PageHeader
        title={t('donations.title')}
        subtitle={`${t('donations.total')}: ${formatCents(data.totalAmountCents, tag, CURRENCY)}`}
        actions={
          <>
            <a
              href={`/api/donations/export.csv${qs(filters)}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-medium hover:border-forest-600"
            >
              <Download size={16} /> {t('common.export')}
            </a>
            {can(user?.role, 'donation', 'create') && (
              <Link
                href="/donations/new"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest-700 px-4 text-sm font-medium text-white hover:bg-forest-900"
              >
                <Plus size={16} /> {t('donations.new')}
              </Link>
            )}
          </>
        }
      />
      <FilterBar>
        <SearchBox placeholder={t('common.search')} />
        <ParamSelect
          name="type"
          allLabel={t('donations.type')}
          options={DONATION_TYPES.map((d) => ({ value: d, label: t(`donationType.${d}`) }))}
        />
        <ParamDate name="from" label={t('common.from')} />
        <ParamDate name="to" label={t('common.to')} />
      </FilterBar>
      <div className={tableCls.wrap}>
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              {[
                t('common.date'),
                t('donations.donor'),
                t('donations.amount'),
                t('donations.type'),
                t('donations.receivedBy'),
                '',
              ].map((h, i) => (
                <th key={i} className={`${tableCls.th} ${i === 2 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableCls.tbody}>
            {data.items.map((d) => (
              <tr key={d.id} className={tableCls.tr}>
                <td data-label={t('common.date')} className={`${tableCls.td} tabular-nums`}>
                  {isoToDdMmYyyy(d.donatedOn)}
                </td>
                <td data-label={t('donations.donor')} className={tableCls.td}>
                  {d.participantId ? (
                    <Link
                      href={`/participants/${d.participantId}`}
                      className="font-medium hover:underline"
                    >
                      {d.firstName} {d.lastName}
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {d.firstName} {d.lastName}
                    </span>
                  )}
                </td>
                <td
                  data-label={t('donations.amount')}
                  className={`${tableCls.td} text-right font-semibold tabular-nums`}
                >
                  {formatCents(d.amountCents, tag, CURRENCY)}
                </td>
                <td data-label={t('donations.type')} className={tableCls.td}>
                  <Badge tone={tone[d.type]}>{t(`donationType.${d.type}`)}</Badge>
                </td>
                <td data-label={t('donations.receivedBy')} className={tableCls.td}>
                  {d.receivedByFirstName}
                </td>
                <td className={`${tableCls.td} text-right max-md:justify-end`}>
                  {can(user?.role, 'donation', 'delete') && (
                    <DeleteButton path={`/donations/${d.id}`} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.items.length === 0 && <Empty>{t('common.noResults')}</Empty>}
      </div>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        pathname="/donations"
        params={sp}
      />
    </>
  );
}
