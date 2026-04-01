import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BillingPlan extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number; // 0 = Free, -1 = Custom/Enterprise

  @Prop({ default: 'KWD' })
  currency: string;

  @Prop({ enum: ['monthly', 'yearly'], required: true })
  interval: string;

  @Prop({ enum: ['active', 'hidden', 'archived'], default: 'active' })
  status: string;

  @Prop({ type: [String], required: true })
  features: string[];

  // Limits - usage restrictions for each plan
  @Prop({ type: Object, required: true })
  limits: {
    invoices: number; // -1 = unlimited
    quotes: number; // -1 = unlimited
    clients: number; // -1 = unlimited
    teamMembers: number; // -1 = unlimited
    storage: string; // "100MB", "10GB", "Unlimited"
    receipts: number; // -1 = unlimited
    recurringInvoices: number; // -1 = unlimited
    expenseTracking: boolean;
    invoiceTemplates: string; // "Basic", "All", "Custom"
    domains: number; // -1 = unlimited, 0 = not allowed, 1-N = limit
    customEmailDomain: boolean; // Can use custom domain for sending emails
  };

  @Prop({ default: '' })
  description: string; // Plan description shown on pricing page

  @Prop({ default: '' })
  ctaText: string; // CTA button text (e.g., "Get Started", "Book a Call")

  @Prop({ default: '' })
  ctaLink: string; // CTA button link (e.g., "/signup", "/contact")

  @Prop({ default: false })
  isPopular: boolean;

  @Prop({ default: 0 })
  subscriberCount: number;

  // ==================== STRIPE INTEGRATION ====================
  // NEW: Store Stripe price IDs by currency and billing cycle
  // Example: { 'USD-monthly': 'price_xxx', 'USD-yearly': 'price_yyy', 'AED-monthly': 'price_zzz', ... }
  @Prop({ type: Object, default: {} })
  stripePrices: Record<string, string>;

  // DEPRECATED: Keeping for backward compatibility, migrate to stripePrices
  @Prop({ required: false })
  stripeMonthlyPriceId: string; // Stripe price ID for monthly billing

  @Prop({ required: false })
  stripeYearlyPriceId: string; // Stripe price ID for yearly billing

  @Prop({ required: false })
  stripeProductId: string; // Stripe product ID for this billing plan

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const BillingPlanSchema = SchemaFactory.createForClass(BillingPlan);

