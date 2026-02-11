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

  @Prop({ default: true })
  notifyNewSubscribers: boolean;

  @Prop({ default: true })
  notifyPaymentAlerts: boolean;

  @Prop({ default: true })
  notifySupportTickets: boolean;

  @Prop({ default: false })
  twoFactorEnabled: boolean;
}

export const SuperAdminSettingsSchema = SchemaFactory.createForClass(SuperAdminSettings);
