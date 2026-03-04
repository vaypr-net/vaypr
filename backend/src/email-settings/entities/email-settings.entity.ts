import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EmailSettings extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId; // userId/tenantId

  @Prop({ required: true, lowercase: true })
  supportInboxEmail: string; // Where contact form messages delivered

  @Prop({ required: false })
  supportInboxName?: string; // Display name for support inbox

  @Prop({ type: Types.ObjectId, ref: 'UserSender', required: false, default: null })
  defaultSenderId?: Types.ObjectId | null; // Which sender to use by default; null = use primary->secondary

  @Prop({ type: String, required: false, default: null, sparse: true, lowercase: true })
  defaultReplyToEmail?: string | null; // Default reply-to if sender doesn't have one

  @Prop({ type: String, required: false, default: null, sparse: true })
  defaultReplyToName?: string | null; // Display name for default reply-to

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EmailSettingsSchema = SchemaFactory.createForClass(EmailSettings);

// Indexes
EmailSettingsSchema.index({ ownerId: 1 }, { unique: true }); // One settings row per user
