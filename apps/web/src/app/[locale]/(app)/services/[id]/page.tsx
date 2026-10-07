import { setRequestLocale } from 'next-intl/server';
import { can } from '@asv/shared';
import { PageHeader } from '@/components/ui/ui';
import { fmtDateTime } from '@/lib/format';
import { api, getSessionUser } from '@/lib/server-api';
import { ServiceDetail, type ServiceData } from './service-detail';

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [user, s] = await Promise.all([
    getSessionUser(),
    api<ServiceData>(`/services/${id}`, locale),
  ]);
  return (
    <>
      <PageHeader
        title={s.title}
        subtitle={[fmtDateTime(s.startsAt), fmtDateTime(s.endsAt).slice(11), s.location]
          .filter(Boolean)
          .join(' · ')}
      />
      <ServiceDetail
        service={s}
        canEdit={can(user?.role, 'service', 'update')}
        canDelete={can(user?.role, 'service', 'delete')}
      />
    </>
  );
}
