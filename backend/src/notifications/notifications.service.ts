import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const created = new this.notificationModel(dto);
    return created.save();
  }

  async findForUser(userId: string) {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
  }

  async markAsRead(id: string) {
    const result = await this.notificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true }).lean().exec();
    if (!result) throw new NotFoundException('Notification not found');
    return result;
  }
}
