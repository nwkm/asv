'use client';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  DONATION_TYPES,
  ddMmYyyyToIso,
  formatDdMmYyyy,
  parseAmountToCents,
  type DonationType,
} from '@asv/shared';
import { ParticipantSearch, type ParticipantHit } from '@/components/ui/participant-search';
import {
  Button,
  Card,
  DateField,
  Field,
  Input,
  Select,
  Textarea,
  ToggleGroup,
} from '@/components/ui/ui';
import { useRouter } from '@/i18n/navigation';
import { ApiError, call } from '@/lib/client-api';
import { CURRENCY } from '@/lib/format';

export type Receiver = { id: string; firstName: string; lastName: string };
type Errors = Partial<Record<'name' | 'amount' | 'date' | 'receiver' | 'email', string>>;
const blank = { firstName: '', lastName: '', familyName: '', email: '', phone: '' };

export function DonationForm({ receivers }: { receivers: Receiver[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [linked, setLinked] = useState<ParticipantHit | null>(null);
  const [donor, setDonor] = useState(blank);
  const [save, setSave] = useState(true);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<DonationType>('other');
  const [date, setDate] = useState(() => formatDdMmYyyy(new Date()));
  const [receivedById, setReceivedById] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  // Show first name only; disambiguate duplicates with the last-name initial.
  const labelled = useMemo(
    () =>
      receivers.map((r) => ({
        id: r.id,
        label:
          receivers.filter((o) => o.firstName === r.firstName).length > 1
            ? `${r.firstName} ${r.lastName.charAt(0)}.`
            : r.firstName,
      })),
    [receivers],
  );

  const view = linked ?? donor;
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDonor((d) => ({ ...d, [k]: e.target.value }));

  function pick(p: ParticipantHit) {
    setLinked(p);
    setErrors((e) => ({ ...e, name: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cents = parseAmountToCents(amount);
    const iso = ddMmYyyyToIso(date);
    const next: Errors = {};
    if (!linked && (!donor.firstName.trim() || !donor.lastName.trim()))
      next.name = t('donations.needDonor');
    if (!cents) next.amount = t('donations.invalidAmount');
    if (!iso) next.date = t('donations.invalidDate');
    if (!receivedById) next.receiver = t('donations.pickReceiver');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await call('POST', '/donations', {
        ...(linked ? { participantId: linked.id } : { ...donor, saveAsParticipant: save }),
        amountCents: cents,
        type,
        donatedOn: iso,
        receivedById,
        notes,
      });
      toast.success(t('donations.created'));
      router.push('/donations');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.issues?.some((i) => i.path === 'email'))
        setErrors({ email: err.message });
      toast.error(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rise grid max-w-4xl gap-6 lg:grid-cols-2" noValidate>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">{t('donations.personal')}</h2>
        {linked ? (
          <div className="flex items-center justify-between rounded-xl bg-forest-50 px-4 py-3 text-sm">
            <span>
              <span className="block text-xs text-forest-600">{t('donations.linked')}</span>
              <strong>
                {linked.firstName} {linked.lastName}
              </strong>
            </span>
            <Button variant="secondary" onClick={() => setLinked(null)}>
              {t('donations.unlink')}
            </Button>
          </div>
        ) : (
          <ParticipantSearch placeholder={t('donations.searchParticipant')} onPick={pick} />
        )}
        <p className="text-xs text-muted">{t('donations.orEnter')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('fields.firstName')}>
            <Input
              value={view.firstName}
              onChange={set('firstName')}
              disabled={!!linked}
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field label={t('fields.lastName')}>
            <Input
              value={view.lastName}
              onChange={set('lastName')}
              disabled={!!linked}
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field label={t('fields.familyName')} className="col-span-2">
            <Input value={view.familyName ?? ''} onChange={set('familyName')} disabled={!!linked} />
          </Field>
          <Field label={t('fields.email')} className="col-span-2" error={errors.email}>
            <Input
              type="email"
              value={view.email ?? ''}
              onChange={set('email')}
              disabled={!!linked}
            />
          </Field>
          <Field label={t('fields.phone')} className="col-span-2">
            <Input
              type="tel"
              value={view.phone ?? ''}
              onChange={set('phone')}
              disabled={!!linked}
            />
          </Field>
        </div>
        {errors.name && (
          <p role="alert" className="text-xs text-danger">
            {errors.name}
          </p>
        )}
        {!linked && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
              className="size-4 accent-forest-700"
            />
            {t('donations.saveAsParticipant')}
          </label>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">{t('donations.details')}</h2>
        <Field label={`${t('donations.amount')} (${CURRENCY})`} error={errors.amount}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            aria-invalid={!!errors.amount}
          />
        </Field>
        <div className="space-y-1.5">
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">
            {t('donations.type')}
          </span>
          <div>
            <ToggleGroup
              label={t('donations.type')}
              value={type}
              onChange={setType}
              options={DONATION_TYPES.map((d) => ({ value: d, label: t(`donationType.${d}`) }))}
            />
          </div>
        </div>
        <Field label={t('common.date')} error={errors.date}>
          <DateField value={date} onChange={setDate} invalid={!!errors.date} />
        </Field>
        <Field label={t('donations.receivedBy')} error={errors.receiver}>
          <Select
            value={receivedById}
            onChange={(e) => setReceivedById(e.target.value)}
            aria-invalid={!!errors.receiver}
          >
            <option value="">{t('donations.choose')}</option>
            {labelled.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('fields.notes')}>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </Card>

      <div className="flex justify-end gap-2 lg:col-span-2">
        <Button variant="secondary" onClick={() => router.push('/donations')}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={busy}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
