import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class Activity {
  @Prop({ required: true, enum: ['new_subscriber', 'payment', 'payment_failed', 'invoice_sent', 'domain_verified', 'ticket', 'ticket_resolved', 'affiliate', 'referral', 'upgrade', 'canceled'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: false })
  relatedEntityId?: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index({ createdAt: -1 });
