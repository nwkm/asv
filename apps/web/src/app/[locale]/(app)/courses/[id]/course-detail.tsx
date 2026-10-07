'use client';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ParticipantSearch } from '@/components/ui/participant-search';
import { Button, Card, DateField, Empty, Field, Input, Select, tableCls } from '@/components/ui/ui';
import { call } from '@/lib/client-api';
import { fmtDateTime } from '@/lib/format';
import { useAction } from '@/lib/use-action';
import { ddMmYyyyToIso } from '@asv/shared';
import { DeleteButton } from '../../participants/participant-dialog';

export type CourseData = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  sessions: { id: string; startsAt: string; endsAt: string }[];
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  }[];
};

export function CourseDetail({
  course,
  canEdit,
  canDelete,
}: {
  course: CourseData;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations();
  const { run, busy } = useAction();
  const [rec, setRec] = useState({
    weekday: '1',
    startTime: '18:00',
    endTime: '19:30',
    from: '',
    until: '',
  });
  const [single, setSingle] = useState({ start: '', end: '' });
  const [now] = useState(() => Date.now());
  const upcoming = course.sessions.filter((s) => new Date(s.endsAt).getTime() >= now);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-xl font-semibold">
          {t('courses.participants')} ({course.participants.length})
        </h2>
        {canEdit && (
          <div className="mb-4">
            <ParticipantSearch
              placeholder={t('courses.addParticipant')}
              clearOnPick
              exclude={course.participants.map((p) => p.id)}
              onPick={(p) =>
                run(() =>
                  call('POST', `/courses/${course.id}/participants`, { participantId: p.id }),
                )
              }
            />
          </div>
        )}
        {course.participants.length === 0 ? (
          <Empty>{t('common.noResults')}</Empty>
        ) : (
          <div className={tableCls.wrap}>
            <table className={tableCls.table}>
              <tbody className={tableCls.tbody}>
                {course.participants.map((p) => (
                  <tr key={p.id} className={tableCls.tr}>
                    <td className={tableCls.td}>
                      {p.firstName} {p.lastName}
                      <span className="block text-xs text-muted">
                        {[p.email, p.phone].filter(Boolean).join(' · ')}
                      </span>
                    </td>
                    <td className={`${tableCls.td} text-right max-md:justify-end`}>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          className="size-8 px-0"
                          aria-label={t('common.remove')}
                          onClick={() =>
                            run(() => call('DELETE', `/courses/${course.id}/participants/${p.id}`))
                          }
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 text-xl font-semibold">{t('courses.sessions')}</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">{t('courses.noSessions')}</p>
          ) : (
            <ul className="max-h-64 divide-y divide-line/60 overflow-auto text-sm">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span className="tabular-nums">
                    {fmtDateTime(s.startsAt)} → {fmtDateTime(s.endsAt).slice(11)}
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      className="size-8 px-0"
                      aria-label={t('common.remove')}
                      onClick={() =>
                        run(() => call('DELETE', `/courses/${course.id}/sessions/${s.id}`))
                      }
                    >
                      <X size={14} />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canEdit && (
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold">{t('courses.weekly')}</h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('courses.weekday')}>
                <Select
                  value={rec.weekday}
                  onChange={(e) => setRec({ ...rec, weekday: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <option key={d} value={d}>
                      {t(`weekday.${d}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('courses.startTime')}>
                <Input
                  type="time"
                  value={rec.startTime}
                  onChange={(e) => setRec({ ...rec, startTime: e.target.value })}
                />
              </Field>
              <Field label={t('courses.endTime')}>
                <Input
                  type="time"
                  value={rec.endTime}
                  onChange={(e) => setRec({ ...rec, endTime: e.target.value })}
                />
              </Field>
              <Field label={t('common.from')}>
                <DateField value={rec.from} onChange={(v) => setRec({ ...rec, from: v })} />
              </Field>
              <Field label={t('courses.until')}>
                <DateField value={rec.until} onChange={(v) => setRec({ ...rec, until: v })} />
              </Field>
              <div className="flex items-end">
                <Button
                  disabled={busy || !ddMmYyyyToIso(rec.from) || !ddMmYyyyToIso(rec.until)}
                  onClick={() =>
                    run(() =>
                      call('POST', `/courses/${course.id}/sessions/recurring`, {
                        weekday: Number(rec.weekday),
                        startTime: rec.startTime,
                        endTime: rec.endTime,
                        from: ddMmYyyyToIso(rec.from),
                        until: ddMmYyyyToIso(rec.until),
                      }),
                    )
                  }
                >
                  {t('courses.generate')}
                </Button>
              </div>
            </div>
            <h3 className="pt-2 text-lg font-semibold">{t('courses.addSession')}</h3>
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              <Field label={t('common.start')}>
                <Input
                  type="datetime-local"
                  value={single.start}
                  onChange={(e) => setSingle({ ...single, start: e.target.value })}
                />
              </Field>
              <Field label={t('common.end')}>
                <Input
                  type="datetime-local"
                  value={single.end}
                  onChange={(e) => setSingle({ ...single, end: e.target.value })}
                />
              </Field>
              <Button
                disabled={busy || !single.start || !single.end}
                onClick={() =>
                  run(() =>
                    call('POST', `/courses/${course.id}/sessions`, {
                      startsAt: new Date(single.start).toISOString(),
                      endsAt: new Date(single.end).toISOString(),
                    }),
                  )
                }
              >
                {t('common.add')}
              </Button>
            </div>
          </Card>
        )}
        {canDelete && (
          <div className="flex justify-end">
            <DeleteButton path={`/courses/${course.id}`} redirectTo="/courses" />
          </div>
        )}
      </div>
    </div>
  );
}
