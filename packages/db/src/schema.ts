import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { DONATION_TYPES, GENDERS, PARTICIPANT_ROLES } from '@asv/shared';

export const genderEnum = pgEnum('gender', GENDERS);
export const participantRoleEnum = pgEnum('participant_role', PARTICIPANT_ROLES);
export const donationTypeEnum = pgEnum('donation_type', DONATION_TYPES);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------- better-auth (with admin plugin) ----------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  role: text('role').default('viewer'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------- domain ----------
export const participants = pgTable(
  'participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    familyName: text('family_name'),
    email: text('email'),
    phone: text('phone'),
    gender: genderEnum('gender').notNull().default('undisclosed'),
    role: participantRoleEnum('role').notNull().default('other'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('participants_email_unique').on(sql`lower(${t.email})`),
    index('participants_name_idx').on(t.lastName, t.firstName),
    index('participants_role_idx').on(t.role),
  ],
);

export const donations = pgTable(
  'donations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    participantId: uuid('participant_id').references(() => participants.id, {
      onDelete: 'set null',
    }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    familyName: text('family_name'),
    email: text('email'),
    phone: text('phone'),
    amountCents: integer('amount_cents').notNull(),
    type: donationTypeEnum('type').notNull(),
    donatedOn: date('donated_on', { mode: 'string' }).notNull(),
    receivedById: uuid('received_by_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'restrict' }),
    notes: text('notes'),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (t) => [
    check('donations_amount_positive', sql`${t.amountCents} > 0`),
    index('donations_donated_on_idx').on(t.donatedOn),
    index('donations_type_idx').on(t.type),
    index('donations_participant_idx').on(t.participantId),
  ],
);

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  instructorId: uuid('instructor_id').references(() => participants.id, { onDelete: 'set null' }),
  color: text('color').notNull().default('#2563eb'),
  ...timestamps,
});

export const courseSessions = pgTable(
  'course_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    check('course_sessions_range', sql`${t.endsAt} > ${t.startsAt}`),
    index('course_sessions_starts_idx').on(t.startsAt),
    index('course_sessions_course_idx').on(t.courseId),
  ],
);

export const courseEnrollments = pgTable(
  'course_enrollments',
  {
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.participantId] })],
);

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    location: text('location'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [
    check('services_range', sql`${t.endsAt} > ${t.startsAt}`),
    index('services_starts_idx').on(t.startsAt),
  ],
);

export const serviceAssignments = pgTable(
  'service_assignments',
  {
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    task: text('task'),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.participantId] })],
);
