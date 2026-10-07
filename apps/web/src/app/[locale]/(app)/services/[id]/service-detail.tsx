'use client';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ParticipantSearch } from '@/components/ui/participant-search';
import { Button, Card, Empty, Input, tableCls } from '@/components/ui/ui';
import { call } from '@/lib/client-api';
import { useAction } from '@/lib/use-action';
import { DeleteButton } from '../../participants/participant-dialog';

export type ServiceData = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    task: string | null;
  }[];
};

export function ServiceDetail({
  service,
  canEdit,
  canDelete,
}: {
  service: ServiceData;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations();
  const { run } = useAction();
  const [task, setTask] = useState('');
  return (
    <Card>
      {service.description && <p className="mb-4 text-muted">{service.description}</p>}
      <h2 className="mb-3 text-xl font-semibold">
        {t('services.participants')} ({service.participants.length})
      </h2>
      {canEdit && (
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
          <ParticipantSearch
            placeholder={t('courses.addParticipant')}
            clearOnPick
            exclude={service.participants.map((p) => p.id)}
            onPick={(p) =>
              run(() =>
                call('POST', `/services/${service.id}/participants`, { participantId: p.id, task }),
              )
            }
          />
          <Input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder={t('services.task')}
          />
        </div>
      )}
      {service.participants.length === 0 ? (
        <Empty>{t('common.noResults')}</Empty>
      ) : (
        <div className={tableCls.wrap}>
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                {[
                  t('participants.name'),
                  t('fields.email'),
                  t('fields.phone'),
                  t('services.task'),
                  '',
                ].map((h, i) => (
                  <th key={i} className={tableCls.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={tableCls.tbody}>
              {service.participants.map((p) => (
                <tr key={p.id} className={tableCls.tr}>
                  <td data-label={t('participants.name')} className={tableCls.td}>
                    {p.firstName} {p.lastName}
                  </td>
                  <td data-label={t('fields.email')} className={tableCls.td}>
                    {p.email ?? t('common.none')}
                  </td>
                  <td data-label={t('fields.phone')} className={tableCls.td}>
                    {p.phone ?? t('common.none')}
                  </td>
                  <td data-label={t('services.task')} className={tableCls.td}>
                    {p.task ?? t('common.none')}
                  </td>
                  <td className={`${tableCls.td} text-right max-md:justify-end`}>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        className="size-8 px-0"
                        aria-label={t('common.remove')}
                        onClick={() =>
                          run(() => call('DELETE', `/services/${service.id}/participants/${p.id}`))
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
      {canDelete && (
        <div className="mt-4 flex justify-end">
          <DeleteButton path={`/services/${service.id}`} redirectTo="/services" />
        </div>
      )}
    </Card>
  );
}
