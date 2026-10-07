import { z } from 'zod';
import { DONATION_TYPES, GENDERS, PARTICIPANT_ROLES } from './enums';

const optionalText = z
  .string()
  .trim()
  .max(200)
  .transform((v) => (v === '' ? null : v))
  .nullish()
  .transform((v) => v ?? null);

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.union([z.literal(''), z.email()]))
  .transform((v) => (v === '' ? null : v))
  .nullish()
  .transform((v) => v ?? null);

const name = z.string().trim().min(1).max(100);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const isoDateTime = z.string().datetime({ offset: true });

export const participantInput = z.object({
  firstName: name,
  lastName: name,
  familyName: optionalText,
  email: optionalEmail,
  phone: optionalText,
  gender: z.enum(GENDERS).default('undisclosed'),
  role: z.enum(PARTICIPANT_ROLES).default('other'),
});
export type ParticipantInput = z.infer<typeof participantInput>;

export const donationInput = z
  .object({
    participantId: z.uuid().nullish(),
    firstName: name.optional(),
    lastName: name.optional(),
    familyName: optionalText,
    email: optionalEmail,
    phone: optionalText,
    saveAsParticipant: z.boolean().default(true),
    amountCents: z.number().int().positive().max(100_000_000),
    type: z.enum(DONATION_TYPES),
    donatedOn: isoDate,
    receivedById: z.uuid(),
    notes: optionalText,
  })
  .refine((v) => v.participantId || (v.firstName && v.lastName), {
    message: 'Either an existing participant or first and last name is required',
    path: ['firstName'],
  });
export type DonationInput = z.infer<typeof donationInput>;

export const courseInput = z.object({
  title: name,
  description: optionalText,
  location: optionalText,
  instructorId: z
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#2563eb'),
});
export type CourseInput = z.infer<typeof courseInput>;

const timeRange = z
  .object({ startsAt: isoDateTime, endsAt: isoDateTime })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: 'End must be after start',
    path: ['endsAt'],
  });

export const sessionInput = timeRange;
export type SessionInput = z.infer<typeof sessionInput>;

/** Weekly recurrence generator for course sessions. */
export const recurrenceInput = z.object({
  weekday: z.number().int().min(0).max(6), // 0 = Sunday
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  from: isoDate,
  until: isoDate,
});
export type RecurrenceInput = z.infer<typeof recurrenceInput>;

export const serviceInput = z
  .object({
    title: name,
    description: optionalText,
    location: optionalText,
    startsAt: isoDateTime,
    endsAt: isoDateTime,
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: 'End must be after start',
    path: ['endsAt'],
  });
export type ServiceInput = z.infer<typeof serviceInput>;

export const assignmentInput = z.object({
  participantId: z.uuid(),
  task: optionalText,
});

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().trim().optional(),
});

export const participantListQuery = listQuery.extend({
  role: z.enum(PARTICIPANT_ROLES).optional(),
  gender: z.enum(GENDERS).optional(),
});

export const donationListQuery = listQuery.extend({
  type: z.enum(DONATION_TYPES).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const calendarQuery = z.object({ from: isoDateTime, to: isoDateTime });
