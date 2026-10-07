import { Controller, Get, Inject, Injectable, Module, Query } from '@nestjs/common';
import type { z } from 'zod';
import { and, courseSessions, courses, gte, lte, services, sql } from '@asv/db';
import { calendarQuery } from '@asv/shared';
import { RequirePermission } from '../auth/access';
import { DB, type Database } from '../db/database.module';
import { ZodPipe } from '../common/zod.pipe';

export type CalendarEvent = {
  id: string;
  kind: 'course' | 'service';
  refId: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  location: string | null;
};

@Injectable()
export class CalendarService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async events(from: string, to: string): Promise<CalendarEvent[]> {
    const f = new Date(from);
    const t = new Date(to);
    const [sessions, works] = await Promise.all([
      this.db
        .select({
          id: courseSessions.id,
          refId: courses.id,
          title: courses.title,
          color: courses.color,
          location: courses.location,
          start: courseSessions.startsAt,
          end: courseSessions.endsAt,
        })
        .from(courseSessions)
        .innerJoin(courses, sql`${courses.id} = ${courseSessions.courseId}`)
        .where(and(lte(courseSessions.startsAt, t), gte(courseSessions.endsAt, f))),
      this.db
        .select()
        .from(services)
        .where(and(lte(services.startsAt, t), gte(services.endsAt, f))),
    ]);
    return [
      ...sessions.map((s) => ({ ...s, kind: 'course' as const })),
      ...works.map((w) => ({
        id: w.id,
        kind: 'service' as const,
        refId: w.id,
        title: w.title,
        color: '#475569',
        location: w.location,
        start: w.startsAt,
        end: w.endsAt,
      })),
    ].sort((a, b) => a.start.getTime() - b.start.getTime());
  }
}

@Controller('calendar')
export class CalendarController {
  constructor(@Inject(CalendarService) private readonly svc: CalendarService) {}

  @Get()
  @RequirePermission('course', 'read')
  events(@Query(new ZodPipe(calendarQuery)) q: z.infer<typeof calendarQuery>) {
    return this.svc.events(q.from, q.to);
  }
}

@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
