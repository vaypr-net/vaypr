import { Controller, Get, Post, Body, Query, Param, Patch } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activityService.create(createActivityDto);
  }

  @Get()
  getActivities(@Query('limit') limit: string = '10', @Query('skip') skip: string = '0') {
    return this.activityService.getActivities(parseInt(limit), parseInt(skip));
  }

  @Get('unread/count')
  getUnreadCount() {
    return this.activityService.getUnreadCount();
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.activityService.markAsRead(id);
  }

  @Patch('all/read')
  markAllAsRead() {
    return this.activityService.markAllAsRead();
  }
}
