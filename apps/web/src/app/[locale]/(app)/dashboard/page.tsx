import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DonationsChart } from '@/components/donations-chart';
import { Badge, Card, Empty, PageHeader } from '@/components/ui/ui';
import { Link } from '@/i18n/navigation';
import { TYPE_COLORS } from '@/lib/constants';
import { CURRENCY, fmtDateTime, formatCents, isoToDdMmYyyy, localeTag } from '@/lib/format';
import { api } from '@/lib/server-api';

type Summary = {
  kpis: {
    participants: number;
    donationsMonthCents: number;
    donationsYearCents: number;
    donationsYearCount: number;
    upcomingEvents: number;
  };
  monthly: { month: string; course: number; service: number; other: number }[];
  recentDonations: {
    id: string;
    firstName: string;
    lastName: string;
    amountCents: number;
    type: 'course' | 'service' | 'other';
    donatedOn: string;
  }[];
  upcomingEvents: {
    id: string;
    kind: 'course' | 'service';
    refId: string;
    title: string;
    start: string;
    color: string;
  }[];
};

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tt, data] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('donationType'),
    api<Summary>('/dashboard', locale),
  ]);
  const tag = localeTag(locale);
  const money = (c: number) => formatCents(c, tag, CURRENCY);
  const k = data.kpis;
  const tiles = [
    { label: t('participants'), value: String(k.participants), tone: 'bg-forest-700 text-white' },
    { label: t('month'), value: money(k.donationsMonthCents), tone: 'bg-card' },
    {
      label: t('year'),
      value: money(k.donationsYearCents),
      hint: t('yearCount', { count: k.donationsYearCount }),
      tone: 'bg-card',
    },
    { label: t('upcoming'), value: String(k.upcomingEvents), tone: 'bg-clay-500 text-white' },
  ];

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('welcome')} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile, i) => (
          <div
            key={tile.label}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`rise rounded-2xl border border-line p-5 ${tile.tone}`}
          >
            <p className="text-xs font-semibold tracking-wide uppercase opacity-70">{tile.label}</p>
            <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{tile.value}</p>
            {tile.hint && <p className="mt-1 text-sm text-muted">{tile.hint}</p>}
          </div>
        ))}
      </section>

      <Card className="rise mt-6" style={{ animationDelay: '300ms' }}>
        <h2 className="mb-4 text-xl font-semibold">{t('monthly')}</h2>
        <DonationsChart
          data={data.monthly}
          locale={tag}
          currency={CURRENCY}
          labels={{ course: tt('course'), service: tt('service'), other: tt('other') }}
        />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-xl font-semibold">{t('recent')}</h2>
          {data.recentDonations.length === 0 ? (
            <Empty>—</Empty>
          ) : (
            <ul className="divide-y divide-line/70">
              {data.recentDonations.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {d.firstName} {d.lastName}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted">
                      {isoToDdMmYyyy(d.donatedOn)}
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: TYPE_COLORS[d.type] }}
                        />
                        {tt(d.type)}
                      </span>
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{money(d.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 text-xl font-semibold">{t('nextEvents')}</h2>
          {data.upcomingEvents.length === 0 ? (
            <Empty>{t('noEvents')}</Empty>
          ) : (
            <ul className="divide-y divide-line/70">
              {data.upcomingEvents.map((e) => (
                <li key={`${e.kind}-${e.id}`} className="flex items-center gap-3 py-3 text-sm">
                  <span className="h-9 w-1.5 rounded-full" style={{ background: e.color }} />
                  <div className="flex-1">
                    <Link
                      href={e.kind === 'course' ? `/courses/${e.refId}` : `/services/${e.refId}`}
                      className="font-medium hover:underline"
                    >
                      {e.title}
                    </Link>
                    <p className="text-xs text-muted">{fmtDateTime(e.start)}</p>
                  </div>
                  <Badge tone={e.kind === 'course' ? 'forest' : 'slate'}>{tt(e.kind)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
