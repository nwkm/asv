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
  Query,
} from '@nestjs/common';
import { participantInput, participantListQuery } from '@asv/shared';
import type { ParticipantInput } from '@asv/shared';
import type { z } from 'zod';
import { RequirePermission } from '../auth/access';
import { ParseUuid, ZodPipe } from '../common/zod.pipe';
import { ParticipantsService } from './participants.service';

@Controller('participants')
export class ParticipantsController {
  constructor(@Inject(ParticipantsService) private readonly svc: ParticipantsService) {}

  @Get()
  @RequirePermission('participant', 'read')
  list(@Query(new ZodPipe(participantListQuery)) q: z.infer<typeof participantListQuery>) {
    return this.svc.list(q);
  }

  @Get('receivers')
  @RequirePermission('participant', 'read')
  receivers() {
    return this.svc.receivers();
  }

  @Get(':id')
  @RequirePermission('participant', 'read')
  get(@Param('id', ParseUuid) id: string) {
    return this.svc.get(id);
  }

  @Post()
  @RequirePermission('participant', 'create')
  create(@Body(new ZodPipe(participantInput)) body: ParticipantInput) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @RequirePermission('participant', 'update')
  update(
    @Param('id', ParseUuid) id: string,
    @Body(new ZodPipe(participantInput)) body: ParticipantInput,
  ) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('participant', 'delete')
  remove(@Param('id', ParseUuid) id: string) {
    return this.svc.remove(id);
  }
}

@Module({
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
