import { faker } from '@faker-js/faker/locale/fr';
import { sql } from 'drizzle-orm';
import type { Database } from './client';
import * as s from './schema';

const BOARD = [
  'president',
  'vice_president',
  'secretary',
  'treasurer',
  'vice_treasurer',
  'board_member',
  'board_member',
] as const;
const COURSES = [
  ['Yoga', '#16a34a'],
  ['Cooking', '#ea580c'],
  ['French for beginners', '#2563eb'],
  ['Computer basics', '#7c3aed'],
  ['Sewing', '#db2777'],
  ['Gardening', '#65a30d'],
  ['Choir', '#0891b2'],
  ['Painting', '#ca8a04'],
] as const;
const TASKS = ['Setup', 'Cleaning', 'Kitchen', 'Reception', 'Logistics', 'Cleanup'];

const at = (d: Date, h: number, m = 0) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
};
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Deterministic mock data. Truncates domain tables first. */
export async function seedDomain(db: Database, opts: { createdByUserId?: string } = {}) {
  faker.seed(20261007);
  await db.execute(
    sql`truncate table service_assignments, services, course_enrollments, course_sessions, courses, donations, participants restart identity cascade`,
  );

  const mk = (role: (typeof s.participants.$inferInsert)['role'], i: number) => {
    const sex = faker.person.sexType();
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName();
    return {
      firstName,
      lastName,
      familyName: sex === 'female' && faker.datatype.boolean(0.3) ? faker.person.lastName() : null,
      email: `${firstName}.${lastName}${i}@example.org`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z0-9.@]/g, ''),
      phone: faker.helpers.fromRegExp(/0[67][0-9]{8}/),
      gender: sex === 'female' ? ('female' as const) : ('male' as const),
      role,
    };
  };
  const rows = [
    ...BOARD.map((r, i) => mk(r, i)),
    ...Array.from({ length: 53 }, (_, i) => mk('other', i + 100)),
  ];
  const people = await db.insert(s.participants).values(rows).returning();
  const board = people.filter((p) => p.role !== 'other');

  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 2);
  const end = new Date(now);
  end.setMonth(end.getMonth() + 3);

  const courses = await db
    .insert(s.courses)
    .values(
      COURSES.map(([title, color]) => ({
        title,
        color,
        description: faker.lorem.sentence(),
        location: faker.helpers.arrayElement(['Main hall', 'Room 2', 'Garden', 'Kitchen']),
        instructorId: faker.helpers.arrayElement(people).id,
      })),
    )
    .returning();

  const sessions: (typeof s.courseSessions.$inferInsert)[] = [];
  courses.forEach((c, idx) => {
    const weekday = (idx % 6) + 1;
    const hour = 9 + (idx % 4) * 2;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === weekday)
        sessions.push({ courseId: c.id, startsAt: at(d, hour), endsAt: at(d, hour + 1, 30) });
    }
  });
  await db.insert(s.courseSessions).values(sessions);

  const enrollments = courses.flatMap((c) =>
    faker.helpers
      .arrayElements(people, { min: 6, max: 18 })
      .map((p) => ({ courseId: c.id, participantId: p.id })),
  );
  await db.insert(s.courseEnrollments).values(enrollments);

  const services = await db
    .insert(s.services)
    .values(
      Array.from({ length: 6 }, (_, i) => {
        const day = new Date(now);
        day.setDate(day.getDate() + (i - 2) * 14 + 5);
        return {
          title: [
            'Spring cleaning',
            'Garden day',
            'Hall painting',
            'Fundraiser setup',
            'Move-in day',
            'Harvest',
          ][i]!,
          description: faker.lorem.sentence(),
          location: 'Association premises',
          startsAt: at(day, 9),
          endsAt: at(day, 16),
        };
      }),
    )
    .returning();
  await db.insert(s.serviceAssignments).values(
    services.flatMap((sv) =>
      faker.helpers.arrayElements(people, { min: 4, max: 12 }).map((p) => ({
        serviceId: sv.id,
        participantId: p.id,
        task: faker.helpers.arrayElement(TASKS),
      })),
    ),
  );

  const donations = Array.from({ length: 250 }, () => {
    const known = faker.datatype.boolean(0.7);
    const donor = known ? faker.helpers.arrayElement(people) : null;
    const date = faker.date.between({
      from: new Date(now.getFullYear() - 1, now.getMonth(), 1),
      to: now,
    });
    return {
      participantId: donor?.id ?? null,
      firstName: donor?.firstName ?? faker.person.firstName(),
      lastName: donor?.lastName ?? faker.person.lastName(),
      familyName: donor?.familyName ?? null,
      email: donor?.email ?? null,
      phone: donor?.phone ?? null,
      amountCents: faker.helpers.arrayElement([500, 1000, 1500, 2000, 2500, 5000, 10000, 20000]),
      type: faker.helpers.weightedArrayElement([
        { weight: 5, value: 'course' as const },
        { weight: 3, value: 'service' as const },
        { weight: 2, value: 'other' as const },
      ]),
      donatedOn: isoDay(date),
      receivedById: faker.helpers.arrayElement(board).id,
      createdByUserId: opts.createdByUserId ?? null,
    };
  });
  await db.insert(s.donations).values(donations);

  return {
    participants: people.length,
    courses: courses.length,
    services: services.length,
    donations: donations.length,
  };
}
