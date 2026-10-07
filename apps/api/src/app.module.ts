import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AccessGuard } from './auth/access.guard';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.controller';
import { DbExceptionFilter } from './common/db-exception.filter';
import { CoursesModule } from './courses/courses.controller';
import { DashboardModule } from './dashboard/dashboard.controller';
import { DatabaseModule } from './db/database.module';
import { DonationsModule } from './donations/donations.controller';
import { HealthModule } from './health/health.controller';
import { ParticipantsModule } from './participants/participants.controller';
import { ServicesModule } from './services/services.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
        redact: ['req.headers.cookie', 'req.headers.authorization'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: Number(process.env.RATE_LIMIT ?? 300) }]),
    DatabaseModule,
    AuthModule,
    HealthModule,
    ParticipantsModule,
    DonationsModule,
    CoursesModule,
    ServicesModule,
    CalendarModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_FILTER, useClass: DbExceptionFilter },
  ],
})
export class AppModule {}
