import { Global, Module } from '@nestjs/common';
import { type Database, DB } from '../db/database.module';
import { createAuth } from './auth';

export const AUTH = Symbol('AUTH');

@Global()
@Module({
  providers: [{ provide: AUTH, useFactory: (db: Database) => createAuth(db), inject: [DB] }],
  exports: [AUTH],
})
export class AuthModule {}
