import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';

@Schema({ timestamps: true })
export class User extends BaseEntity {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: false }) // Not required for Google OAuth users
  password: string;

  @Prop({ required: false })
  googleId: string; // Google OAuth user ID

  @Prop({ required: false })
  profilePicture: string; // Google profile picture URL

  @Prop({ default: 'manual' }) // 'manual' or 'google'
  authProvider: string;

  @Prop({ default: false })
  emailVerified: boolean; // Auto-verified for Google OAuth

  @Prop({ default: false })
  isSuperAdmin: boolean; // Super admin flag - only one super admin

  // Google OAuth tokens for Gmail API
  // These are ONLY set when user grants Gmail permission (gmail.send scope)
  // refresh_token is stored ONLY on first consent or re-consent
  @Prop({ required: false })
  googleAccessToken: string; // Short-lived access token (expires in 1 hour)

  @Prop({ required: false })
  googleRefreshToken: string; // Long-lived token for refreshing access (CRITICAL - never overwrite with null)

  @Prop({ required: false })
  googleTokenExpiry: Date; // When the access token expires

  // Brevo Domain for email sending
  @Prop({ required: false })
  brandingDomain: string; // Verified Brevo domain (e.g., "example.com") - used as sender for invoices, receipts, quotes

  // ==================== STRIPE SUBSCRIPTION FIELDS ====================
  @Prop({ required: false, sparse: true })
  stripeCustomerId: string; // Stripe customer ID

  @Prop({ required: false })
  stripeSubscriptionId: string; // Current active subscription ID

  @Prop({ 
    enum: ['free', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'],
    default: 'free'
  })
  subscriptionStatus: string; // Current subscription status

  @Prop({ type: Types.ObjectId, ref: 'BillingPlan', required: false })
  planId: Types.ObjectId; // Current plan reference

  @Prop({ enum: ['monthly', 'yearly'], required: false })
  billingCycle: string; // Monthly or yearly billing

  @Prop({ required: false })
  currentPeriodEnd: Date; // When current billing period ends

  @Prop({ required: false })
  subscriptionStartedAt: Date; // When subscription was started

  @Prop({ required: false })
  subscriptionCanceledAt: Date; // When subscription was canceled
}

export const UserSchema = SchemaFactory.createForClass(User);
// Indexes for Stripe operations
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });
UserSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });
