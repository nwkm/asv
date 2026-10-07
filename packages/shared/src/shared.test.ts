import { describe, expect, test } from 'bun:test';
import {
  can,
  ddMmYyyyToIso,
  donationInput,
  formatDdMmYyyy,
  isoToDdMmYyyy,
  parseAmountToCents,
  parseDdMmYyyy,
} from './index';

describe('dates', () => {
  test('parses valid and rejects invalid DD/MM/YYYY', () => {
    expect(parseDdMmYyyy('07/10/2026')).toBeInstanceOf(Date);
    expect(parseDdMmYyyy('31/02/2026')).toBeNull();
    expect(parseDdMmYyyy('2026-10-07')).toBeNull();
  });
  test('round-trips', () => {
    expect(ddMmYyyyToIso('07/10/2026')).toBe('2026-10-07');
    expect(isoToDdMmYyyy('2026-10-07')).toBe('07/10/2026');
    expect(formatDdMmYyyy(new Date(2026, 9, 7))).toBe('07/10/2026');
  });
});

describe('money', () => {
  test('parses amounts', () => {
    expect(parseAmountToCents('12,50')).toBe(1250);
    expect(parseAmountToCents('12.5')).toBe(1250);
    expect(parseAmountToCents('0')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
  });
});

describe('donationInput', () => {
  const base = {
    amountCents: 1000,
    type: 'other',
    donatedOn: '2026-10-07',
    receivedById: '0b0f1c3e-3c1a-4b8e-9d6e-1f3a2a1b4c5d',
  };
  test('requires donor identity', () => {
    expect(donationInput.safeParse(base).success).toBe(false);
    expect(donationInput.safeParse({ ...base, firstName: 'A', lastName: 'B' }).success).toBe(true);
  });
});

describe('permissions', () => {
  test('viewer is read-only, staff can write, admin manages users', () => {
    expect(can('viewer', 'donation', 'read')).toBe(true);
    expect(can('viewer', 'donation', 'create')).toBe(false);
    expect(can('staff', 'donation', 'create')).toBe(true);
    expect(can('admin', 'donation', 'delete')).toBe(true);
  });
});
