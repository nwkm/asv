import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createDb, participants, sql } from '@asv/db';
import { createApp } from '../src/create-app';
import { createAuth } from '../src/auth/auth';

const PASSWORD = 'Test-password-123';
let app: NestExpressApplication;
let server: ReturnType<NestExpressApplication['getHttpServer']>;
const cookies: Record<string, string[]> = {};
let treasurerId: string;

async function login(role: string) {
  const res = await request(server)
    .post('/api/auth/sign-in/email')
    .set('Origin', 'http://localhost:3000')
    .send({ email: `${role}@test.local`, password: PASSWORD });
  expect(res.status).toBe(200);
  cookies[role] = res.get('set-cookie') ?? [];
}
const as = (role: string) => ({ Cookie: cookies[role]!.map((c) => c.split(';')[0]).join('; ') });

beforeAll(async () => {
  const { db, client } = createDb(process.env.DATABASE_URL!, { max: 2 });
  await db.execute(
    sql`truncate table donations, participants, "session", account, "user" restart identity cascade`,
  );
  const auth = createAuth(db);
  for (const role of ['admin', 'staff', 'viewer'] as const) {
    await auth.api.createUser({
      body: { email: `${role}@test.local`, password: PASSWORD, name: role, role },
    });
  }
  const [t] = await db
    .insert(participants)
    .values({ firstName: 'Tina', lastName: 'Treasurer', role: 'treasurer' })
    .returning();
  treasurerId = t!.id;
  await client.end();

  app = await createApp();
  await app.init();
  server = app.getHttpServer();
  for (const role of ['admin', 'staff', 'viewer']) await login(role);
});

afterAll(async () => {
  await app.close();
});

describe('auth & RBAC', () => {
  test('rejects unauthenticated requests', async () => {
    expect((await request(server).get('/api/participants')).status).toBe(401);
  });
  test('health is public', async () => {
    expect((await request(server).get('/api/health')).body).toEqual({ status: 'ok' });
  });
  test('viewer can read but not write', async () => {
    expect((await request(server).get('/api/participants').set(as('viewer'))).status).toBe(200);
    const res = await request(server)
      .post('/api/participants')
      .set(as('viewer'))
      .send({ firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(403);
  });
  test('public sign-up is disabled', async () => {
    const res = await request(server)
      .post('/api/auth/sign-up/email')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'x@test.local', password: PASSWORD, name: 'x' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('participants', () => {
  test('staff creates, validates and deduplicates email', async () => {
    const ok = await request(server).post('/api/participants').set(as('staff')).send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'Ada@Example.org',
      role: 'secretary',
    });
    expect(ok.status).toBe(201);
    expect(ok.body.email).toBe('ada@example.org');
    const dup = await request(server)
      .post('/api/participants')
      .set(as('staff'))
      .send({ firstName: 'Ada', lastName: 'Two', email: 'ada@example.org' });
    expect(dup.status).toBe(409);
    const bad = await request(server)
      .post('/api/participants')
      .set(as('staff'))
      .send({ firstName: '', lastName: 'x' });
    expect(bad.status).toBe(400);
  });
  test('search and receivers', async () => {
    const found = await request(server).get('/api/participants?search=lovel').set(as('viewer'));
    expect(found.body.total).toBe(1);
    const rec = await request(server).get('/api/participants/receivers').set(as('viewer'));
    expect(rec.body.map((r: { firstName: string }) => r.firstName)).toContain('Tina');
  });
});

describe('donations', () => {
  const base = () => ({
    amountCents: 2500,
    type: 'course',
    donatedOn: '2026-10-07',
    receivedById: treasurerId,
  });

  test('new donor is saved as a participant in the same transaction', async () => {
    const res = await request(server)
      .post('/api/donations')
      .set(as('staff'))
      .send({ ...base(), firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.org' });
    expect(res.status).toBe(201);
    expect(res.body.participantId).toBeTruthy();
    expect(res.body.receivedByFirstName).toBe('Tina');
    const list = await request(server).get('/api/participants?search=hopper').set(as('viewer'));
    expect(list.body.total).toBe(1);
  });
  test('existing participant is linked and snapshotted', async () => {
    const { body } = await request(server)
      .get('/api/participants?search=lovelace')
      .set(as('viewer'));
    const res = await request(server)
      .post('/api/donations')
      .set(as('staff'))
      .send({ ...base(), participantId: body.items[0].id, type: 'other' });
    expect(res.status).toBe(201);
    expect(res.body.lastName).toBe('Lovelace');
  });
  test('requires donor identity and a positive amount', async () => {
    const noDonor = await request(server).post('/api/donations').set(as('staff')).send(base());
    expect(noDonor.status).toBe(400);
    const neg = await request(server)
      .post('/api/donations')
      .set(as('staff'))
      .send({ ...base(), firstName: 'A', lastName: 'B', amountCents: -5 });
    expect(neg.status).toBe(400);
  });
  test('viewer cannot create; list reports totals; csv exports', async () => {
    const forbidden = await request(server)
      .post('/api/donations')
      .set(as('viewer'))
      .send({ ...base(), firstName: 'A', lastName: 'B' });
    expect(forbidden.status).toBe(403);
    const list = await request(server).get('/api/donations').set(as('viewer'));
    expect(list.body.total).toBe(2);
    expect(list.body.totalAmountCents).toBe(5000);
    const csv = await request(server).get('/api/donations/export.csv').set(as('viewer'));
    expect(csv.status).toBe(200);
    expect(csv.text.split('\n')).toHaveLength(3);
    expect(csv.text).toContain('07/10/2026');
  });
});

describe('courses, services, calendar, dashboard', () => {
  test('course enrollment and recurring sessions feed the calendar', async () => {
    const course = await request(server)
      .post('/api/courses')
      .set(as('staff'))
      .send({ title: 'Yoga', color: '#16a34a' });
    expect(course.status).toBe(201);
    const rec = await request(server)
      .post(`/api/courses/${course.body.id}/sessions/recurring`)
      .set(as('staff'))
      .send({
        weekday: 2,
        startTime: '18:00',
        endTime: '19:30',
        from: '2026-10-01',
        until: '2026-10-31',
      });
    expect(rec.body).toHaveLength(4);
    const enrolled = await request(server)
      .post(`/api/courses/${course.body.id}/participants`)
      .set(as('staff'))
      .send({ participantId: treasurerId });
    expect(enrolled.body).toHaveLength(1);
    const cal = await request(server)
      .get('/api/calendar?from=2026-10-01T00:00:00Z&to=2026-10-31T23:59:59Z')
      .set(as('viewer'));
    expect(cal.body.filter((e: { kind: string }) => e.kind === 'course')).toHaveLength(4);
  });
  test('service assignment', async () => {
    const svc = await request(server).post('/api/services').set(as('staff')).send({
      title: 'Garden day',
      startsAt: '2026-10-10T09:00:00Z',
      endsAt: '2026-10-10T16:00:00Z',
    });
    expect(svc.status).toBe(201);
    const res = await request(server)
      .post(`/api/services/${svc.body.id}/participants`)
      .set(as('staff'))
      .send({ participantId: treasurerId, task: 'Kitchen' });
    expect(res.body[0].task).toBe('Kitchen');
    const bad = await request(server).post('/api/services').set(as('staff')).send({
      title: 'x',
      startsAt: '2026-10-10T09:00:00Z',
      endsAt: '2026-10-10T08:00:00Z',
    });
    expect(bad.status).toBe(400);
  });
  test('dashboard aggregates', async () => {
    const res = await request(server).get('/api/dashboard').set(as('viewer'));
    expect(res.status).toBe(200);
    expect(res.body.kpis.participants).toBe(3);
    expect(res.body.monthly).toHaveLength(12);
  });
});
