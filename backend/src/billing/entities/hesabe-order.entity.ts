import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, SchemaTypes } from 'mongoose';

export type HesabeOrderDocument = HydratedDocument<HesabeOrder>;

@Schema({ timestamps: true, collection: 'hesabe_sandbox_orders' })
export class HesabeOrder {
  @Prop({ required: true, unique: true }) reference: string;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'BillingPlan', required: true }) planId: Types.ObjectId;
  @Prop({ required: true }) planName: string;
  @Prop({ required: true }) amountFils: number;
  @Prop({ default: 'KWD' }) currency: string;
  @Prop({ required: true, enum: ['monthly', 'yearly'] }) billingCycle: string;
  @Prop({ required: true, enum: ['creating', 'pending', 'paid', 'failed', 'expired'], default: 'creating' }) state: string;
  @Prop({ default: true }) activeCheckout: boolean;
  @Prop({ default: 'sandbox' }) environment: string;
  @Prop() paymentToken?: string;
  @Prop() redirectData?: string;
  @Prop() paidOn?: Date;
  @Prop() periodEnd?: Date;
  @Prop() referralCode?: string;
  @Prop() createdAt: Date;
  @Prop() subscriberDeletedAt?: Date;
  @Prop() deletedSubscriberName?: string;
  @Prop() deletedSubscriberEmail?: string;
  @Prop({ default: false }) needsManualReconciliation?: boolean;
}
export const HesabeOrderSchema = SchemaFactory.createForClass(HesabeOrder);
HesabeOrderSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { activeCheckout: true } });
HesabeOrderSchema.index({ paymentToken: 1 }, { unique: true, sparse: true });
