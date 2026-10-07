export const GENDERS = ['male', 'female', 'other', 'undisclosed'] as const;
export type Gender = (typeof GENDERS)[number];

export const PARTICIPANT_ROLES = [
  'president',
  'vice_president',
  'secretary',
  'treasurer',
  'vice_treasurer',
  'board_member',
  'other',
] as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export const DONATION_TYPES = ['course', 'service', 'other'] as const;
export type DonationType = (typeof DONATION_TYPES)[number];

export const APP_ROLES = ['admin', 'staff', 'viewer'] as const;
export type AppRole = (typeof APP_ROLES)[number];
