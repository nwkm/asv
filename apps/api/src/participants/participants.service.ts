import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import {
  and,
  asc,
  count,
  courseEnrollments,
  courses,
  desc,
  donations,
  eq,
  ilike,
  or,
  participants,
  serviceAssignments,
  services,
  sql,
  type SQL,
} from '@asv/db';
import type { ParticipantInput, participantListQuery } from '@asv/shared';
import { DB, type Database } from '../db/database.module';
import { like, offset, type Page } from '../common/pagination';

type ListQuery = z.infer<typeof participantListQuery>;

@Injectable()
export class ParticipantsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(q: ListQuery): Promise<Page<typeof participants.$inferSelect>> {
    const conds: (SQL | undefined)[] = [];
    if (q.role) conds.push(eq(participants.role, q.role));
    if (q.gender) conds.push(eq(participants.gender, q.gender));
    if (q.search) {
      const t = like(q.search);
      conds.push(
        or(
          ilike(participants.firstName, t),
          ilike(participants.lastName, t),
          ilike(participants.familyName, t),
          ilike(participants.email, t),
          ilike(participants.phone, t),
          ilike(sql`${participants.firstName} || ' ' || ${participants.lastName}`, t),
        ),
      );
    }
    const where = and(...conds);
    const [items, [total]] = await Promise.all([
      this.db
        .select()
        .from(participants)
        .where(where)
        .orderBy(asc(participants.lastName), asc(participants.firstName))
        .limit(q.pageSize)
        .offset(offset(q)),
      this.db.select({ n: count() }).from(participants).where(where),
    ]);
    return { items, total: total?.n ?? 0, page: q.page, pageSize: q.pageSize };
  }

  /** Board members who can receive donations. */
  receivers() {
    return this.db
      .select({
        id: participants.id,
        firstName: participants.firstName,
        lastName: participants.lastName,
        role: participants.role,
      })
      .from(participants)
      .where(sql`${participants.role} <> 'other'`)
      .orderBy(asc(participants.firstName), asc(participants.lastName));
  }

  async get(id: string) {
    const [p] = await this.db.select().from(participants).where(eq(participants.id, id));
    if (!p) throw new NotFoundException('Participant not found');
    const [donationRows, courseRows, serviceRows] = await Promise.all([
      this.db
        .select()
        .from(donations)
        .where(eq(donations.participantId, id))
        .orderBy(desc(donations.donatedOn)),
      this.db
        .select({ id: courses.id, title: courses.title, color: courses.color })
        .from(courseEnrollments)
        .innerJoin(courses, eq(courses.id, courseEnrollments.courseId))
        .where(eq(courseEnrollments.participantId, id)),
      this.db
        .select({
          id: services.id,
          title: services.title,
          startsAt: services.startsAt,
          task: serviceAssignments.task,
        })
        .from(serviceAssignments)
        .innerJoin(services, eq(services.id, serviceAssignments.serviceId))
        .where(eq(serviceAssignments.participantId, id))
        .orderBy(desc(services.startsAt)),
    ]);
    return { ...p, donations: donationRows, courses: courseRows, services: serviceRows };
  }

  async create(input: ParticipantInput) {
    const [row] = await this.db.insert(participants).values(input).returning();
    return row!;
  }

  async update(id: string, input: ParticipantInput) {
    const [row] = await this.db
      .update(participants)
      .set(input)
      .where(eq(participants.id, id))
      .returning();
    if (!row) throw new NotFoundException('Participant not found');
    return row;
  }

  async remove(id: string) {
    const [row] = await this.db.delete(participants).where(eq(participants.id, id)).returning();
    if (!row) throw new NotFoundException('Participant not found');
  }
}
