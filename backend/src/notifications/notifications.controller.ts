import { Controller, Get, UseGuards, Req, Post, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    return this.notificationsService.findForUser(userId);
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
