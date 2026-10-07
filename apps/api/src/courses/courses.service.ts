import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  asc,
  courseEnrollments,
  courseSessions,
  courses,
  eq,
  and,
  participants,
  sql,
} from '@asv/db';
import type { CourseInput, RecurrenceInput, SessionInput } from '@asv/shared';
import { DB, type Database } from '../db/database.module';

@Injectable()
export class CoursesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list() {
    return this.db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        location: courses.location,
        color: courses.color,
        instructorId: courses.instructorId,
        enrolled: sql<number>`(select count(*)::int from course_enrollments e where e.course_id = ${courses.id})`,
        nextSession: sql<
          string | null
        >`(select min(s.starts_at) from course_sessions s where s.course_id = ${courses.id} and s.starts_at >= now())`,
      })
      .from(courses)
      .orderBy(asc(courses.title));
  }

  async get(id: string) {
    const [course] = await this.db.select().from(courses).where(eq(courses.id, id));
    if (!course) throw new NotFoundException('Course not found');
    const [sessions, people] = await Promise.all([
      this.db
        .select()
        .from(courseSessions)
        .where(eq(courseSessions.courseId, id))
        .orderBy(asc(courseSessions.startsAt)),
      this.participantsOf(id),
    ]);
    return { ...course, sessions, participants: people };
  }

  participantsOf(courseId: string) {
    return this.db
      .select({
        id: participants.id,
        firstName: participants.firstName,
        lastName: participants.lastName,
        email: participants.email,
        phone: participants.phone,
        enrolledAt: courseEnrollments.enrolledAt,
      })
      .from(courseEnrollments)
      .innerJoin(participants, eq(participants.id, courseEnrollments.participantId))
      .where(eq(courseEnrollments.courseId, courseId))
      .orderBy(asc(participants.lastName), asc(participants.firstName));
  }

  async create(input: CourseInput) {
    const [row] = await this.db.insert(courses).values(input).returning();
    return row!;
  }

  async update(id: string, input: CourseInput) {
    const [row] = await this.db.update(courses).set(input).where(eq(courses.id, id)).returning();
    if (!row) throw new NotFoundException('Course not found');
    return row;
  }

  async remove(id: string) {
    const [row] = await this.db.delete(courses).where(eq(courses.id, id)).returning();
    if (!row) throw new NotFoundException('Course not found');
  }

  async addSession(courseId: string, input: SessionInput) {
    await this.get(courseId);
    const [row] = await this.db
      .insert(courseSessions)
      .values({ courseId, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt) })
      .returning();
    return row!;
  }

  /** Generates weekly sessions between from..until (inclusive) in server local time. */
  async addRecurring(courseId: string, input: RecurrenceInput) {
    await this.get(courseId);
    const [sh, sm] = input.startTime.split(':').map(Number) as [number, number];
    const [eh, em] = input.endTime.split(':').map(Number) as [number, number];
    if (eh * 60 + em <= sh * 60 + sm) throw new ConflictException('End time must be after start');
    const rows: (typeof courseSessions.$inferInsert)[] = [];
    const last = new Date(`${input.until}T23:59:59`);
    for (let d = new Date(`${input.from}T00:00:00`); d <= last; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== input.weekday) continue;
      const startsAt = new Date(d);
      startsAt.setHours(sh, sm, 0, 0);
      const endsAt = new Date(d);
      endsAt.setHours(eh, em, 0, 0);
      rows.push({ courseId, startsAt, endsAt });
      if (rows.length > 400) throw new ConflictException('Too many sessions (max 400)');
    }
    if (!rows.length) return [];
    return this.db.insert(courseSessions).values(rows).returning();
  }

  async removeSession(courseId: string, sessionId: string) {
    const [row] = await this.db
      .delete(courseSessions)
      .where(and(eq(courseSessions.id, sessionId), eq(courseSessions.courseId, courseId)))
      .returning();
    if (!row) throw new NotFoundException('Session not found');
  }

  async enroll(courseId: string, participantId: string) {
    await this.db
      .insert(courseEnrollments)
      .values({ courseId, participantId })
      .onConflictDoNothing();
    return this.participantsOf(courseId);
  }

  async unenroll(courseId: string, participantId: string) {
    await this.db
      .delete(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.participantId, participantId),
        ),
      );
  }
}
