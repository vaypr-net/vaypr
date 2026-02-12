import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile } from './entities/userprofile.entity';

export type NotificationType =
  | 'invoiceDueSoon'
  | 'invoiceOverdue'
  | 'quoteViewed'
  | 'quoteAccepted'
  | 'quoteRejected'
  | 'quoteExpired'
  | 'upcomingRenewal'
  | 'renewalSuccessful'
  | 'renewalPaymentFailed'
  | 'subscriptionChanged'
  | 'supportAgentReplied'
  | 'ticketResolved'
  | 'pushNotifications';

@Injectable()
export class NotificationPreferencesHelper {
  constructor(
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
  ) {}

  /**
   * Check if user has enabled a specific notification type
   * @param userId - User ID
   * @param notificationType - Type of notification to check
   * @returns true if notification is enabled (or profile not found, default to true), false if disabled
   */
  async isNotificationEnabled(userId: string, notificationType: NotificationType): Promise<boolean> {
    try {
      const profile = await this.userProfileModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .select(notificationType)
        .exec();

      // If profile not found, default to true (send notification)
      if (!profile) {
        return true;
      }

      const value = (profile as any)[notificationType];
      
      // If value is undefined/null, default to true
      return value !== false;
    } catch (error) {
      console.error(`Error checking notification preference for ${notificationType}:`, error);
      // On error, default to true (send notification)
      return true;
    }
  }

  /**
   * Get all notification preferences for a user
   * @param userId - User ID
   * @returns Object with all notification preferences
   */
  async getAllPreferences(
    userId: string,
  ): Promise<Record<NotificationType, boolean>> {
    try {
      const profile = await this.userProfileModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();

      if (!profile) {
        return this.getDefaultPreferences();
      }

      const preferences = {} as Record<NotificationType, boolean>;
      const notificationTypes: NotificationType[] = [
        'invoiceDueSoon',
        'invoiceOverdue',
        'quoteViewed',
        'quoteAccepted',
        'quoteRejected',
        'quoteExpired',
        'upcomingRenewal',
        'renewalSuccessful',
        'renewalPaymentFailed',
        'subscriptionChanged',
        'supportAgentReplied',
        'ticketResolved',
        'pushNotifications',
      ];

      for (const type of notificationTypes) {
        preferences[type] = (profile as any)[type] !== false;
      }

      return preferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default notification preferences (all enabled)
   */
  private getDefaultPreferences(): Record<NotificationType, boolean> {
    return {
      invoiceDueSoon: true,
      invoiceOverdue: true,
      quoteViewed: true,
      quoteAccepted: true,
      quoteRejected: true,
      quoteExpired: true,
      upcomingRenewal: true,
      renewalSuccessful: true,
      renewalPaymentFailed: true,
      subscriptionChanged: true,
      supportAgentReplied: true,
      ticketResolved: true,
      pushNotifications: true,
    };
  }
}
