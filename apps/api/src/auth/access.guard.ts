import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { can, type Action, type Resource } from '@asv/shared';
import type { Request } from 'express';
import { AUTH } from './auth.module';
import type { Auth } from './auth';
import { PERMISSION_KEY, PUBLIC_KEY } from './access';

export type AuthedRequest = Request & {
  user: { id: string; email: string; name: string; role?: string | null };
};

/** Authenticates via better-auth session, then enforces @RequirePermission via shared RBAC. */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets)) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedException();
    req.user = session.user;

    const perm = this.reflector.getAllAndOverride<{ resource: Resource; action: Action }>(
      PERMISSION_KEY,
      targets,
    );
    if (perm && !can(session.user.role, perm.resource, perm.action)) throw new ForbiddenException();
    return true;
  }
}
