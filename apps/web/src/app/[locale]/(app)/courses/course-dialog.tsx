'use client';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Dialog, Field, Input, Textarea } from '@/components/ui/ui';
import { call } from '@/lib/client-api';
import { useAction } from '@/lib/use-action';

export function CourseDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { run, busy } = useAction();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> {t('courses.new')}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('courses.new')}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const r = await run(() =>
              call('POST', '/courses', {
                title: f.get('title'),
                description: f.get('description'),
                location: f.get('location'),
                color: f.get('color'),
              }),
            );
            if (r) setOpen(false);
          }}
        >
          <Field label={t('common.title')}>
            <Input name="title" required autoFocus />
          </Field>
          <Field label={t('common.description')}>
            <Textarea name="description" rows={2} />
          </Field>
          <div className="grid grid-cols-[1fr_6rem] gap-4">
            <Field label={t('common.location')}>
              <Input name="location" />
            </Field>
            <Field label={t('common.color')}>
              <Input name="color" type="color" defaultValue="#2f6b4b" className="p-1" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
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
