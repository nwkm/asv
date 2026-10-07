import { getTranslations, setRequestLocale } from 'next-intl/server';
import { can, PARTICIPANT_ROLES, GENDERS } from '@asv/shared';
import { FilterBar, ParamSelect, SearchBox } from '@/components/ui/filters';
import { Pagination } from '@/components/ui/pagination';
import { Badge, Empty, PageHeader, tableCls } from '@/components/ui/ui';
import { Link } from '@/i18n/navigation';
import { api, getSessionUser, qs } from '@/lib/server-api';
import { DeleteButton, ParticipantDialog, type ParticipantRow } from './participant-dialog';

type Page = { items: ParticipantRow[]; total: number; page: number; pageSize: number };

export default async function ParticipantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const [t, user, data] = await Promise.all([
    getTranslations(),
    getSessionUser(),
    api<Page>(
      `/participants${qs({ page: sp.page, search: sp.search, role: sp.role, gender: sp.gender })}`,
      locale,
    ),
  ]);
  const canWrite = can(user?.role, 'participant', 'update');
  const canCreate = can(user?.role, 'participant', 'create');
  const canDelete = can(user?.role, 'participant', 'delete');

  return (
    <>
      <PageHeader title={t('participants.title')} actions={canCreate && <ParticipantDialog />} />
      <FilterBar>
        <SearchBox placeholder={t('common.search')} />
        <ParamSelect
          name="role"
          allLabel={t('fields.role')}
          options={PARTICIPANT_ROLES.map((r) => ({ value: r, label: t(`participantRole.${r}`) }))}
        />
        <ParamSelect
          name="gender"
          allLabel={t('fields.gender')}
          options={GENDERS.map((g) => ({ value: g, label: t(`gender.${g}`) }))}
        />
      </FilterBar>
      <div className={tableCls.wrap}>
        <table className={tableCls.table}>
          <thead className={tableCls.thead}>
            <tr>
              {[
                t('participants.name'),
                t('fields.email'),
                t('fields.phone'),
                t('fields.gender'),
                t('fields.role'),
                '',
              ].map((h, i) => (
                <th key={i} className={tableCls.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={tableCls.tbody}>
            {data.items.map((p) => (
              <tr key={p.id} className={tableCls.tr}>
                <td data-label={t('participants.name')} className={tableCls.td}>
                  <Link
                    href={`/participants/${p.id}`}
                    className="font-medium text-forest-700 hover:underline"
                  >
                    {p.firstName} {p.lastName}
                  </Link>
                  {p.familyName && (
                    <span className="ml-2 text-xs text-muted">({p.familyName})</span>
                  )}
                </td>
                <td data-label={t('fields.email')} className={tableCls.td}>
                  {p.email ?? t('common.none')}
                </td>
                <td data-label={t('fields.phone')} className={tableCls.td}>
                  {p.phone ?? t('common.none')}
                </td>
                <td data-label={t('fields.gender')} className={tableCls.td}>
                  {t(`gender.${p.gender}`)}
                </td>
                <td data-label={t('fields.role')} className={tableCls.td}>
                  <Badge tone={p.role === 'other' ? 'slate' : 'clay'}>
                    {t(`participantRole.${p.role}`)}
                  </Badge>
                </td>
                <td className={`${tableCls.td} text-right whitespace-nowrap max-md:justify-end`}>
                  {canWrite && <ParticipantDialog participant={p} />}
                  {canDelete && <DeleteButton path={`/participants/${p.id}`} />}
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
        pathname="/participants"
        params={sp}
      />
    </>
  );
}
