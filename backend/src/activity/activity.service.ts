import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activity, ActivityDocument } from './entities/activity.entity';

@Injectable()
export class ActivityService {
  constructor(@InjectModel(Activity.name) private activityModel: Model<ActivityDocument>) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const createdActivity = new this.activityModel(createActivityDto);
    return createdActivity.save();
  }

  async getActivities(limit: number = 10, skip: number = 0): Promise<{ data: Activity[]; total: number; unreadCount: number }> {
    const data = await this.activityModel.find().sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
    const total = await this.activityModel.countDocuments();
    const unreadCount = await this.activityModel.countDocuments({ isRead: false });
    return { data, total, unreadCount };
  }

  async markAsRead(id: string): Promise<Activity | null> {
    return this.activityModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    ).exec();
  }

  async markAllAsRead(): Promise<any> {
    return this.activityModel.updateMany({ isRead: false }, { isRead: true });
  }

  async getUnreadCount(): Promise<number> {
    return this.activityModel.countDocuments({ isRead: false });
  }
}
