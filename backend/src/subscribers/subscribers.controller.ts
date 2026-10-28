import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { ManageSubscriberDto } from './dto/manage-subscriber.dto';
import { DeleteSubscriberDto } from './dto/delete-subscriber.dto';
import { SubscriberDeletionService } from './subscriber-deletion.service';

@Controller('super-admin/subscribers')
@UseGuards(SuperAdminGuard)
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService, private readonly deletion: SubscriberDeletionService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('subscriptionType') subscriptionType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('visibility') visibility?: string,
  ) {
    return this.subscribersService.findAll(
      search,
      status,
      subscriptionType,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
      visibility,
    );
  }

  @Get('stats')
  getStats() {
    return this.subscribersService.getStats();
  }

  @Get('deletion-history')
  deletionHistory() { return this.deletion.history(); }

  @Get('deletion-history/:id/payments')
  retainedPayments(@Param('id') id: string) { return this.deletion.retainedPayments(id); }

  @Get(':id/deletion-preview')
  deletionPreview(@Param('id') id: string, @Request() req: any) { return this.deletion.preview(id, req.user); }

  @Delete(':id')
  permanentlyDelete(@Param('id') id: string, @Body() body: DeleteSubscriberDto, @Request() req: any) {
    return this.deletion.delete(id, body, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscribersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriberDto: UpdateSubscriberDto, @Request() req: any) {
    return this.subscribersService.update(id, updateSubscriberDto, req.user);
  }

  @Patch(':id/management')
  manage(@Param('id') id: string, @Body() body: ManageSubscriberDto, @Request() req: any) {
    return this.subscribersService.manage(id, body, req.user);
  }
}
