import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true })
  subscriberId: string;

  @Prop({ required: true })
  subscriberName: string;

  @Prop({ required: true })
  subscriberEmail: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'KWD' })
  currency: string;

  @Prop({
    required: true,
    enum: ['subscription', 'refund', 'chargeback'],
  })
  type: string;

  @Prop({ required: true, default: 'Stripe' })
  provider: string;

  @Prop({
    required: true,
    enum: ['succeeded', 'failed', 'refunded', 'pending'],
    default: 'pending',
  })
  status: string;

  @Prop({ required: true })
  transactionDate: Date;

  @Prop({ required: true })
  plan: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
