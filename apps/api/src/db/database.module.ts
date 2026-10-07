import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { createDb, type Database } from '@asv/db';
import { config } from '../config';

export const DB = Symbol('DB');
export const DB_CLIENT = Symbol('DB_CLIENT');

@Injectable()
class DbShutdown implements OnApplicationShutdown {
  constructor(@Inject(DB_CLIENT) private readonly client: { end: () => Promise<void> }) {}
  async onApplicationShutdown() {
    await this.client.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DB_CLIENT,
      useFactory: () => createDb(config.databaseUrl()),
    },
    { provide: DB, useFactory: (c: ReturnType<typeof createDb>) => c.db, inject: [DB_CLIENT] },
    {
      provide: DbShutdown,
      useFactory: (c: ReturnType<typeof createDb>) => new DbShutdown(c.client),
      inject: [DB_CLIENT],
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}

export type { Database };
