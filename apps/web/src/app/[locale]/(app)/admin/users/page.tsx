import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/ui';
import { getSessionUser } from '@/lib/server-api';
import { UsersManager } from './users-manager';

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (user?.role !== 'admin') redirect(`/${locale}/dashboard`);
  const t = await getTranslations('users');
  return (
    <>
      <PageHeader title={t('title')} />
      <UsersManager currentUserId={user.id} />
    </>
  );
}
