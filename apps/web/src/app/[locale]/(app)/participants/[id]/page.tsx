import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge, Card, PageHeader } from '@/components/ui/ui';
import { Link } from '@/i18n/navigation';
import { CURRENCY, fmtDateTime, formatCents, isoToDdMmYyyy, localeTag } from '@/lib/format';
import { api } from '@/lib/server-api';

type Detail = {
  id: string;
  firstName: string;
  lastName: string;
  familyName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  donations: { id: string; amountCents: number; type: string; donatedOn: string }[];
  courses: { id: string; title: string; color: string }[];
  services: { id: string; title: string; startsAt: string; task: string | null }[];
};

export default async function ParticipantDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [t, p] = await Promise.all([getTranslations(), api<Detail>(`/participants/${id}`, locale)]);
  const tag = localeTag(locale);
  return (
    <>
      <PageHeader
        title={`${p.firstName} ${p.lastName}`}
        subtitle={[p.email, p.phone].filter(Boolean).join(' · ')}
        actions={<Badge tone="clay">{t(`participantRole.${p.role}`)}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-xl font-semibold">{t('participants.donations')}</h2>
          <ul className="space-y-2 text-sm">
            {p.donations.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>
                  {isoToDdMmYyyy(d.donatedOn)} · {t(`donationType.${d.type}`)}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatCents(d.amountCents, tag, CURRENCY)}
                </span>
              </li>
            ))}
            {p.donations.length === 0 && <li className="text-muted">{t('common.noResults')}</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl font-semibold">{t('participants.courses')}</h2>
          <ul className="space-y-2 text-sm">
            {p.courses.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                <Link href={`/courses/${c.id}`} className="hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
            {p.courses.length === 0 && <li className="text-muted">{t('common.noResults')}</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl font-semibold">{t('participants.services')}</h2>
          <ul className="space-y-2 text-sm">
            {p.services.map((s) => (
              <li key={s.id}>
                <Link href={`/services/${s.id}`} className="hover:underline">
                  {s.title}
                </Link>
                <span className="block text-xs text-muted">
                  {fmtDateTime(s.startsAt)}
                  {s.task ? ` · ${s.task}` : ''}
                </span>
              </li>
            ))}
            {p.services.length === 0 && <li className="text-muted">{t('common.noResults')}</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
