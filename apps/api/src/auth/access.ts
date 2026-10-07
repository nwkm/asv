import { SetMetadata } from '@nestjs/common';
import type { Action, Resource } from '@asv/shared';

export const PUBLIC_KEY = 'isPublic';
export const PERMISSION_KEY = 'permission';

export const Public = () => SetMetadata(PUBLIC_KEY, true);
export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action });
