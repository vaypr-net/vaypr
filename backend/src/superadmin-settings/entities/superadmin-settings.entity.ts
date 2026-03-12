import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';

@Schema({ timestamps: true })
export class SuperAdminSettings extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: 'support@vaypr.net' })
  supportEmail: string;

  @Prop({ default: true })
  notifyNewSubscribers: boolean;

  @Prop({ default: true })
  notifyPaymentAlerts: boolean;

  @Prop({ default: true })
  notifySupportTickets: boolean;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ default: '' })
  openaiApiKey: string;

  @Prop({ default: 'You are a financial analyst assistant. Analyze subscription metrics, revenue trends, churn, and subscriber growth. Provide actionable insights and flag concerning trends.' })
  systemPrompt: string;
}

export const SuperAdminSettingsSchema = SchemaFactory.createForClass(SuperAdminSettings);
