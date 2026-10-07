'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { GENDERS, PARTICIPANT_ROLES, participantInput } from '@asv/shared';
import { Button, Dialog, Field, Input, Select } from '@/components/ui/ui';
import { useRouter } from '@/i18n/navigation';
import { call } from '@/lib/client-api';
import { useAction } from '@/lib/use-action';

type In = z.input<typeof participantInput>;
type Out = z.output<typeof participantInput>;
export type ParticipantRow = {
  id: string;
  firstName: string;
  lastName: string;
  familyName: string | null;
  email: string | null;
  phone: string | null;
  gender: In['gender'];
  role: In['role'];
};

export function ParticipantDialog({ participant }: { participant?: ParticipantRow }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { run, busy } = useAction();
  const { register, handleSubmit, reset, formState } = useForm<In, unknown, Out>({
    resolver: zodResolver(participantInput),
    defaultValues: participant ?? { gender: 'undisclosed', role: 'other' },
  });
  const err = (k: keyof In) =>
    formState.errors[k] ? String(formState.errors[k]?.message) : undefined;

  const onSubmit = handleSubmit(async (values) => {
    const ok = await run(() =>
      participant
        ? call('PATCH', `/participants/${participant.id}`, values)
        : call('POST', '/participants', values),
    );
    if (ok !== undefined) {
      setOpen(false);
      if (!participant) reset({ gender: 'undisclosed', role: 'other' });
    }
  });

  return (
    <>
      {participant ? (
        <Button
          variant="ghost"
          className="size-9 px-0"
          aria-label={t('common.edit')}
          onClick={() => setOpen(true)}
        >
          <Pencil size={16} />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> {t('participants.new')}
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={participant ? t('participants.edit') : t('participants.new')}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4" noValidate>
          <Field label={t('fields.firstName')} error={err('firstName')}>
            <Input {...register('firstName')} autoFocus />
          </Field>
          <Field label={t('fields.lastName')} error={err('lastName')}>
            <Input {...register('lastName')} />
          </Field>
          <Field label={t('fields.familyName')} className="col-span-2">
            <Input {...register('familyName')} />
          </Field>
          <Field label={t('fields.email')} error={err('email')}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label={t('fields.phone')}>
            <Input type="tel" {...register('phone')} />
          </Field>
          <Field label={t('fields.gender')}>
            <Select {...register('gender')}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {t(`gender.${g}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('fields.role')}>
            <Select {...register('role')}>
              {PARTICIPANT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`participantRole.${r}`)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={busy}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function DeleteButton({ path, redirectTo }: { path: string; redirectTo?: string }) {
  const t = useTranslations('common');
  const { run, busy } = useAction();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className="size-9 px-0 text-danger"
      aria-label={t('delete')}
      disabled={busy}
      onClick={async () => {
        if (!confirm(t('confirmDelete'))) return;
        const r = await run(() => call('DELETE', path), t('deleted'));
        if (r && redirectTo) router.push(redirectTo);
      }}
    >
      <Trash2 size={16} />
    </Button>
  );
}
