import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SenderProvider = 'brevo' | 'gmail';
export type SenderStatus = 'active' | 'inactive';
export type SenderPriority = 1 | 2; // 1=Primary, 2=Secondary

@Schema({ timestamps: true })
export class UserSender extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ type: String, enum: ['brevo', 'gmail'], default: 'brevo' })
  provider: SenderProvider;

  @Prop({ required: false })
  replyToEmail?: string;

  @Prop({ required: false })
  replyToName?: string;

  @Prop({ default: false })
  verified: boolean; // For brevo: domain verified; for gmail: token exists

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  status: SenderStatus;

  // Priority: 1=Primary, 2=Secondary, null=normal extra sender
  @Prop({ type: Number, required: false, sparse: true })
  priority: SenderPriority | null;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSenderSchema = SchemaFactory.createForClass(UserSender);

// Indexes
UserSenderSchema.index({ userId: 1, email: 1 }, { unique: true });
UserSenderSchema.index({ userId: 1, status: 1 });
UserSenderSchema.index({ userId: 1, priority: 1 });
