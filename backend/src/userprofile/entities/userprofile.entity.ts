import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';

@Schema({ timestamps: true })
export class UserProfile extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: '' })
  fullName: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  phoneNumber: string;

  @Prop({ default: '' })
  companyName: string;

  @Prop({ default: '' })
  businessAddress: string;

  @Prop({ required: true, default: 'UTC' })
  timeZone: string;

  @Prop()
  profileImage: string;

  // Notification Preferences
  @Prop({ type: Boolean, default: true })
  invoiceDueSoon: boolean;

  @Prop({ type: Boolean, default: true })
  invoiceOverdue: boolean;

  @Prop({ type: Boolean, default: true })
  quoteViewed: boolean;

  @Prop({ type: Boolean, default: true })
  quoteAccepted: boolean;

  @Prop({ type: Boolean, default: true })
  quoteRejected: boolean;

  @Prop({ type: Boolean, default: true })
  quoteExpired: boolean;

  @Prop({ type: Boolean, default: true })
  upcomingRenewal: boolean;

  @Prop({ type: Boolean, default: true })
  renewalSuccessful: boolean;

  @Prop({ type: Boolean, default: true })
  renewalPaymentFailed: boolean;

  @Prop({ type: Boolean, default: true })
  subscriptionChanged: boolean;

  @Prop({ type: Boolean, default: true })
  supportAgentReplied: boolean;

  @Prop({ type: Boolean, default: true })
  ticketResolved: boolean;

  @Prop({ type: Boolean, default: true })
  pushNotifications: boolean;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
