import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { can } from '@asv/shared';
import { PageHeader } from '@/components/ui/ui';
import { api, getSessionUser } from '@/lib/server-api';
import { DonationForm, type Receiver } from './donation-form';

export default async function NewDonationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!can(user?.role, 'donation', 'create')) redirect(`/${locale}/donations`);
  const [t, receivers] = await Promise.all([
    getTranslations('donations'),
    api<Receiver[]>('/participants/receivers', locale),
  ]);
  return (
    <>
      <PageHeader title={t('new')} />
      <DonationForm receivers={receivers} />
    </>
  );
}
