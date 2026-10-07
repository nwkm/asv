import { setRequestLocale } from 'next-intl/server';
import { can } from '@asv/shared';
import { PageHeader } from '@/components/ui/ui';
import { api, getSessionUser } from '@/lib/server-api';
import { CourseDetail, type CourseData } from './course-detail';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [user, course] = await Promise.all([
    getSessionUser(),
    api<CourseData>(`/courses/${id}`, locale),
  ]);
  return (
    <>
      <PageHeader
        title={course.title}
        subtitle={[course.location, course.description].filter(Boolean).join(' · ')}
      />
      <CourseDetail
        course={course}
        canEdit={can(user?.role, 'course', 'update')}
        canDelete={can(user?.role, 'course', 'delete')}
      />
    </>
  );
}
