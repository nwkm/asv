import { getTranslations, setRequestLocale } from 'next-intl/server';
import { can } from '@asv/shared';
import { Card, Empty, PageHeader } from '@/components/ui/ui';
import { Link } from '@/i18n/navigation';
import { fmtDateTime } from '@/lib/format';
import { api, getSessionUser } from '@/lib/server-api';
import { CourseDialog } from './course-dialog';

type Course = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  color: string;
  enrolled: number;
  nextSession: string | null;
};

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, user, courses] = await Promise.all([
    getTranslations(),
    getSessionUser(),
    api<Course[]>('/courses', locale),
  ]);
  return (
    <>
      <PageHeader
        title={t('courses.title')}
        actions={can(user?.role, 'course', 'create') && <CourseDialog />}
      />
      {courses.length === 0 && <Empty>{t('common.noResults')}</Empty>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c, i) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}`}
            className="rise group"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Card className="relative h-full overflow-hidden pl-7 transition group-hover:-translate-y-0.5 group-hover:border-forest-600">
              <span className="absolute inset-y-0 left-0 w-2" style={{ background: c.color }} />
              <h2 className="text-2xl font-semibold text-forest-900">{c.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description ?? c.location}</p>
              <dl className="mt-4 flex justify-between text-sm">
                <div>
                  <dt className="text-xs text-muted uppercase">{t('courses.enrolled')}</dt>
                  <dd className="font-display text-2xl">{c.enrolled}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-xs text-muted uppercase">{t('courses.nextSession')}</dt>
                  <dd>{c.nextSession ? fmtDateTime(c.nextSession) : t('common.none')}</dd>
                </div>
              </dl>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
