import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from '../activity/entities/activity.entity';

@Injectable()
export class SuperAdminAuditService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
  ) {}

  async getAuditLogs(limit: number = 50, offset: number = 0) {
    const [items, total] = await Promise.all([
      this.activityModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean(),
      this.activityModel.countDocuments(),
    ]);

    const logs = items.map((activity: any) => ({
      id: activity._id.toString(),
      userName: 'System',
      action: this.mapAction(activity.type),
      details: activity.description || activity.title || 'Activity recorded',
      timestamp: activity.createdAt,
      ipAddress: 'N/A',
    }));

    return {
      items: logs,
      total,
      limit,
      offset,
      hasMore: offset + logs.length < total,
    };
  }

  private mapAction(type: string): string {
    const actionMap: Record<string, string> = {
      new_subscriber: 'Subscriber Created',
      payment: 'Payment Processed',
      payment_failed: 'Payment Failed',
      invoice_sent: 'Invoice Sent',
      domain_verified: 'Domain Verified',
      ticket: 'Ticket Created',
      ticket_resolved: 'Ticket Resolved',
      affiliate: 'Affiliate Updated',
      referral: 'Referral Created',
      upgrade: 'Plan Upgraded',
      canceled: 'Subscription Canceled',
    };

    return actionMap[type] || 'System Activity';
  }
}
