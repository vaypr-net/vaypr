import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('super-admin/subscribers')
@UseGuards(SuperAdminGuard)
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('subscriptionType') subscriptionType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.subscribersService.findAll(
      search,
      status,
      subscriptionType,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('stats')
  getStats() {
    return this.subscribersService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscribersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriberDto: UpdateSubscriberDto) {
    return this.subscribersService.update(id, updateSubscriberDto);
  }
}
