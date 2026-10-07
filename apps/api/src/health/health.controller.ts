import { Controller, Get, Inject, Module, ServiceUnavailableException } from '@nestjs/common';
import { sql } from '@asv/db';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/access';
import { DB, type Database } from '../db/database.module';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get()
  @Public()
  async check() {
    try {
      await this.db.execute(sql`select 1`);
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('database unavailable');
    }
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
