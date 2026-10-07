import { Controller, Get, Inject, Injectable, Module } from '@nestjs/common';
import { count, desc, donations, participants, sql, sum } from '@asv/db';
import { RequirePermission } from '../auth/access';
import { CalendarModule, CalendarService } from '../calendar/calendar.controller';
import { DB, type Database } from '../db/database.module';
import { DONATION_TYPES } from '@asv/shared';

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(CalendarService) private readonly calendar: CalendarService,
  ) {}

  async summary() {
    const now = new Date();
    const monthStart = `${monthKey(now)}-01`;
    const yearStart = `${now.getFullYear()}-01-01`;
    const first = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const firstKey = `${monthKey(first)}-01`;

    const [[people], [agg], byMonthRows, recent, upcoming] = await Promise.all([
      this.db.select({ n: count() }).from(participants),
      this.db
        .select({
          month: sql<string>`coalesce(sum(${donations.amountCents}) filter (where ${donations.donatedOn} >= ${monthStart}), 0)`,
          year: sql<string>`coalesce(sum(${donations.amountCents}) filter (where ${donations.donatedOn} >= ${yearStart}), 0)`,
          yearCount: sql<number>`count(*) filter (where ${donations.donatedOn} >= ${yearStart})::int`,
        })
        .from(donations),
      this.db
        .select({
          month: sql<string>`to_char(${donations.donatedOn}, 'YYYY-MM')`,
          type: donations.type,
          total: sum(donations.amountCents),
        })
        .from(donations)
        .where(sql`${donations.donatedOn} >= ${firstKey}`)
        .groupBy(sql`1`, donations.type),
      this.db
        .select({
          id: donations.id,
          firstName: donations.firstName,
          lastName: donations.lastName,
          amountCents: donations.amountCents,
          type: donations.type,
          donatedOn: donations.donatedOn,
        })
        .from(donations)
        .orderBy(desc(donations.donatedOn), desc(donations.createdAt))
        .limit(6),
      this.calendar.events(now.toISOString(), new Date(Date.now() + 30 * 864e5).toISOString()),
    ]);

    const months = Array.from({ length: 12 }, (_, i) =>
      monthKey(new Date(first.getFullYear(), first.getMonth() + i, 1)),
    );
    const monthly = months.map((m) => {
      const row: Record<string, number | string> = { month: m, course: 0, service: 0, other: 0 };
      for (const t of DONATION_TYPES) {
        const hit = byMonthRows.find((r) => r.month === m && r.type === t);
        row[t] = Number(hit?.total ?? 0);
      }
      return row;
    });

    return {
      kpis: {
        participants: people?.n ?? 0,
        donationsMonthCents: Number(agg?.month ?? 0),
        donationsYearCents: Number(agg?.year ?? 0),
        donationsYearCount: agg?.yearCount ?? 0,
        upcomingEvents: upcoming.length,
      },
      monthly,
      recentDonations: recent,
      upcomingEvents: upcoming.slice(0, 6),
    };
  }
}

@Controller('dashboard')
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly svc: DashboardService) {}

  @Get()
  @RequirePermission('dashboard', 'read')
  summary() {
    return this.svc.summary();
  }
}

@Module({
  imports: [CalendarModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
