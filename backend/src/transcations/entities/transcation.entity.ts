import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId: Types.ObjectId; // Reference to User for subscriptions

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

  // ==================== STRIPE INTEGRATION ====================
  @Prop({ required: false, sparse: true })
  stripeEventId: string; // Stripe event ID for idempotency

  @Prop({ required: false })
  stripeCheckoutSessionId: string; // Stripe checkout session ID

  @Prop({ required: false })
  stripeSubscriptionId: string; // Stripe subscription ID

  @Prop({ required: false })
  stripePaymentIntentId: string; // Stripe payment intent ID

  @Prop({ required: false })
  stripeInvoiceId: string; // Stripe invoice ID for subscription charge

  @Prop({ required: false })
  billingCycle: string; // 'monthly' or 'yearly'

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
// Indexes for Stripe operations
TransactionSchema.index({ stripeEventId: 1 }, { sparse: true });
TransactionSchema.index({ stripeSubscriptionId: 1 });
TransactionSchema.index({ userId: 1 });
