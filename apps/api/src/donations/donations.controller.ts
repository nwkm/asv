import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Inject,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { z } from 'zod';
import { donationInput, donationListQuery } from '@asv/shared';
import type { DonationInput } from '@asv/shared';
import { RequirePermission } from '../auth/access';
import { CurrentUser } from '../common/current-user';
import { ParseUuid, ZodPipe } from '../common/zod.pipe';
import { DonationsService } from './donations.service';

type ListQuery = z.infer<typeof donationListQuery>;

@Controller('donations')
export class DonationsController {
  constructor(@Inject(DonationsService) private readonly svc: DonationsService) {}

  @Get()
  @RequirePermission('donation', 'read')
  list(@Query(new ZodPipe(donationListQuery)) q: ListQuery) {
    return this.svc.list(q);
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="donations.csv"')
  @RequirePermission('donation', 'read')
  export(@Query(new ZodPipe(donationListQuery)) q: ListQuery) {
    return this.svc.exportCsv(q);
  }

  @Get(':id')
  @RequirePermission('donation', 'read')
  get(@Param('id', ParseUuid) id: string) {
    return this.svc.get(id);
  }

  @Post()
  @RequirePermission('donation', 'create')
  create(
    @Body(new ZodPipe(donationInput)) body: DonationInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.create(body, user.id);
  }

  @Patch(':id')
  @RequirePermission('donation', 'update')
  update(
    @Param('id', ParseUuid) id: string,
    @Body(new ZodPipe(donationInput)) body: DonationInput,
  ) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('donation', 'delete')
  remove(@Param('id', ParseUuid) id: string) {
    return this.svc.remove(id);
  }
}

@Module({ controllers: [DonationsController], providers: [DonationsService] })
export class DonationsModule {}
