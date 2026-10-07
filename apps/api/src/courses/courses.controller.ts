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
import {
  assignmentInput,
  courseInput,
  recurrenceInput,
  sessionInput,
  type CourseInput,
  type RecurrenceInput,
  type SessionInput,
} from '@asv/shared';
import { z } from 'zod';
import { RequirePermission } from '../auth/access';
import { ParseUuid, ZodPipe } from '../common/zod.pipe';
import { CoursesService } from './courses.service';

const enrollBody = assignmentInput.pick({ participantId: true });

@Controller('courses')
export class CoursesController {
  constructor(@Inject(CoursesService) private readonly svc: CoursesService) {}

  @Get()
  @RequirePermission('course', 'read')
  list() {
    return this.svc.list();
  }

  @Get(':id')
  @RequirePermission('course', 'read')
  get(@Param('id', ParseUuid) id: string) {
    return this.svc.get(id);
  }

  @Post()
  @RequirePermission('course', 'create')
  create(@Body(new ZodPipe(courseInput)) body: CourseInput) {
    return this.svc.create(body);
  }

  @Patch(':id')
  @RequirePermission('course', 'update')
  update(@Param('id', ParseUuid) id: string, @Body(new ZodPipe(courseInput)) body: CourseInput) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('course', 'delete')
  remove(@Param('id', ParseUuid) id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/sessions')
  @RequirePermission('course', 'update')
  addSession(@Param('id', ParseUuid) id: string, @Body(new ZodPipe(sessionInput)) b: SessionInput) {
    return this.svc.addSession(id, b);
  }

  @Post(':id/sessions/recurring')
  @RequirePermission('course', 'update')
  addRecurring(
    @Param('id', ParseUuid) id: string,
    @Body(new ZodPipe(recurrenceInput)) b: RecurrenceInput,
  ) {
    return this.svc.addRecurring(id, b);
  }

  @Delete(':id/sessions/:sessionId')
  @HttpCode(204)
  @RequirePermission('course', 'update')
  removeSession(@Param('id', ParseUuid) id: string, @Param('sessionId', ParseUuid) sid: string) {
    return this.svc.removeSession(id, sid);
  }

  @Get(':id/participants')
  @RequirePermission('course', 'read')
  participants(@Param('id', ParseUuid) id: string) {
    return this.svc.participantsOf(id);
  }

  @Post(':id/participants')
  @RequirePermission('course', 'update')
  enroll(
    @Param('id', ParseUuid) id: string,
    @Body(new ZodPipe(enrollBody)) b: z.infer<typeof enrollBody>,
  ) {
    return this.svc.enroll(id, b.participantId);
  }

  @Delete(':id/participants/:participantId')
  @HttpCode(204)
  @RequirePermission('course', 'update')
  unenroll(@Param('id', ParseUuid) id: string, @Param('participantId', ParseUuid) pid: string) {
    return this.svc.unenroll(id, pid);
  }
}

@Module({ controllers: [CoursesController], providers: [CoursesService] })
export class CoursesModule {}
