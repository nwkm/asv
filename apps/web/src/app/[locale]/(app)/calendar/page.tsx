import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/ui';
import { CalendarView } from './calendar-view';

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('calendar');
  return (
    <>
      <PageHeader title={t('title')} />
      <CalendarView locale={locale} />
    </>
  );
}
