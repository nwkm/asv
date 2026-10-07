import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

type PgError = { code?: string; constraint_name?: string; cause?: unknown };

function findPgError(e: unknown): PgError | null {
  let cur = e as PgError | undefined;
  for (let i = 0; cur && i < 4; i++) {
    if (typeof cur.code === 'string' && /^\d{5}$/.test(cur.code)) return cur;
    cur = cur.cause as PgError | undefined;
  }
  return null;
}

/** Maps Postgres constraint violations to meaningful HTTP errors. Also passes HttpExceptions through. */
@Catch()
export class DbExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return res
        .status(exception.getStatus())
        .json(
          typeof body === 'string' ? { statusCode: exception.getStatus(), message: body } : body,
        );
    }
    const pg = findPgError(exception);
    const map: Record<string, [number, string]> = {
      '23505': [HttpStatus.CONFLICT, 'A record with the same unique value already exists'],
      '23503': [HttpStatus.CONFLICT, 'Record is referenced by, or references, another record'],
      '23514': [HttpStatus.BAD_REQUEST, 'A value violates a constraint'],
    };
    const hit = pg?.code ? map[pg.code] : undefined;
    if (hit) return res.status(hit[0]).json({ statusCode: hit[0], message: hit[1] });
    console.error(exception);
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ statusCode: 500, message: 'Internal server error' });
  }
}
