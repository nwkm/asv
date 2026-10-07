'use client';
import clsx from 'clsx';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { enGB, fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/ui';
import { Link } from '@/i18n/navigation';
import { call } from '@/lib/client-api';

type Event = {
  id: string;
  kind: 'course' | 'service';
  refId: string;
  title: string;
  start: string;
  end: string;
  color: string;
};
const MAX_PER_DAY = 3;

export function CalendarView({ locale }: { locale: string }) {
  const t = useTranslations('calendar');
  const dfLocale = locale === 'fr' ? fr : enGB;
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [today] = useState(() => new Date());
  const [loaded, setLoaded] = useState<{ key: string; events: Event[] } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(cursor, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      }),
    [cursor],
  );

  const from = days[0]!.toISOString();
  const to = new Date(days.at(-1)!.getTime() + 864e5 - 1).toISOString();
  const range = `${from}|${to}`;
  const loading = loaded?.key !== range;
  const events = useMemo(() => loaded?.events ?? [], [loaded]);

  useEffect(() => {
    let live = true;
    call<Event[]>('GET', `/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((e) => live && setLoaded({ key: `${from}|${to}`, events: e }))
      .catch(() => live && setLoaded({ key: `${from}|${to}`, events: [] }));
    return () => {
      live = false;
    };
  }, [from, to]);

  const byDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const key = format(new Date(e.start), 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [events]);

  const weekdays = days.slice(0, 7).map((d) => format(d, 'EEE', { locale: dfLocale }));

  return (
    <div className="rise">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-3xl font-semibold capitalize text-forest-900">
          {format(cursor, 'LLLL yyyy', { locale: dfLocale })}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="size-10 px-0"
            aria-label="Previous month"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button variant="secondary" onClick={() => setCursor(startOfMonth(today))}>
            {t('today')}
          </Button>
          <Button
            variant="secondary"
            className="size-10 px-0"
            aria-label="Next month"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      <div
        className={clsx(
          'overflow-hidden rounded-2xl border border-line bg-card transition-opacity',
          loading && 'opacity-60',
        )}
      >
        <div className="grid grid-cols-7 border-b border-line bg-forest-50/60">
          {weekdays.map((w) => (
            <div
              key={w}
              className="px-2 py-2 text-center text-xs font-semibold tracking-wide text-muted uppercase"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd');
            const list = byDay.get(key) ?? [];
            const shown = expanded === key ? list : list.slice(0, MAX_PER_DAY);
            return (
              <div
                key={key}
                className={clsx(
                  'min-h-28 border-r border-b border-line/60 p-1.5 [&:nth-child(7n)]:border-r-0',
                  !isSameMonth(d, cursor) && 'bg-paper/60 text-muted',
                )}
              >
                <span
                  className={clsx(
                    'mb-1 inline-grid size-6 place-items-center rounded-full text-xs tabular-nums',
                    isSameDay(d, today) && 'bg-clay-500 font-semibold text-white',
                  )}
                >
                  {format(d, 'd')}
                </span>
                <ul className="space-y-0.5">
                  {shown.map((e) => (
                    <li key={`${e.kind}-${e.id}`}>
                      <Link
                        href={e.kind === 'course' ? `/courses/${e.refId}` : `/services/${e.refId}`}
                        title={`${format(new Date(e.start), 'HH:mm')} ${e.title}`}
                        className="flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] leading-tight text-ink hover:brightness-95"
                        style={{ background: `${e.color}26`, borderLeft: `3px solid ${e.color}` }}
                      >
                        <span className="tabular-nums opacity-70">
                          {format(new Date(e.start), 'HH:mm')}
                        </span>
                        <span className="truncate font-medium">{e.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {list.length > MAX_PER_DAY && expanded !== key && (
                  <button
                    type="button"
                    className="mt-0.5 px-1 text-[11px] text-forest-700 hover:underline"
                    onClick={() => setExpanded(key)}
                  >
                    {t('more', { count: list.length - MAX_PER_DAY })}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 flex gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-forest-600" />
          {t('course')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#475569]" />
          {t('service')}
        </span>
      </p>
    </div>
  );
}
