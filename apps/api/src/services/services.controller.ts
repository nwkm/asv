import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Module,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { assignmentInput, serviceInput, type ServiceInput } from '@asv/shared';
import type { z } from 'zod';
import { RequirePermission } from '../auth/access';
import { ParseUuid, ZodPipe } from '../common/zod.pipe';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(@Inject(ServicesService) private readonly svc: ServicesService) {}

  @Get()
  @RequirePermission('service', 'read')
  list() {
    return this.svc.list();
  }

  @Get(':id')
  @RequirePermission('service', 'read')
  get(@Param('id', ParseUuid) id: string) {
    return this.svc.get(id);
  }

  @Post()
  @RequirePermission('service', 'create')
  create(@Body(new ZodPipe(serviceInput)) body: ServiceInput) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @RequirePermission('service', 'update')
  update(@Param('id', ParseUuid) id: string, @Body(new ZodPipe(serviceInput)) body: ServiceInput) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('service', 'delete')
  remove(@Param('id', ParseUuid) id: string) {
    return this.svc.remove(id);
  }

  @Get(':id/participants')
  @RequirePermission('service', 'read')
  participants(@Param('id', ParseUuid) id: string) {
    return this.svc.participantsOf(id);
  }

  @Post(':id/participants')
  @RequirePermission('service', 'update')
  assign(
    @Param('id', ParseUuid) id: string,
    @Body(new ZodPipe(assignmentInput)) b: z.infer<typeof assignmentInput>,
  ) {
    return this.svc.assign(id, b.participantId, b.task);
  }

  @Delete(':id/participants/:participantId')
  @HttpCode(204)
  @RequirePermission('service', 'update')
  unassign(@Param('id', ParseUuid) id: string, @Param('participantId', ParseUuid) pid: string) {
    return this.svc.unassign(id, pid);
  }
}

@Module({ controllers: [ServicesController], providers: [ServicesService] })
export class ServicesModule {}
