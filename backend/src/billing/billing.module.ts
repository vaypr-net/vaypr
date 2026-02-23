import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StripeService } from './stripe.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { BillingPlan, BillingPlanSchema } from '../billing-plan/entities/billing-plan.entity';
import { Transaction, TransactionSchema } from '../transcations/entities/transcation.entity';
import { ActivityModule } from '../activity/activity.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CommonModule } from '../common/common.module';
import { CurrencyService } from '../common/services/currency.service';
import { BillingPlanModule } from '../billing-plan/billing-plan.module';
import { UserprofileModule } from '../userprofile/userprofile.module';

/**
 * BillingModule - Stripe Checkout subscriptions
 * 
 * Features:
 * - Create checkout sessions for plan upgrades
 * - Manage subscriptions via Stripe Billing Portal
 * - Handle webhook events for subscription lifecycle
 * 
 * Configuration:
 * Required env vars:
 * - STRIPE_SECRET_KEY (from Stripe dashboard)
 * - STRIPE_WEBHOOK_SECRET (from Webhook settings or Stripe CLI)
 * - APP_URL (application URL, for redirect URLs)
 * 
 * Webhook Setup (Local):
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Run: stripe listen --forward-to localhost:8081/billing/webhook
 * 3. Copy signing secret to STRIPE_WEBHOOK_SECRET in .env
 * 
 * Webhook Setup (Production):
 * 1. In Stripe dashboard, go to Webhooks
 * 2. Add endpoint: https://yourdomain.com/billing/webhook
 * 3. Select events:
 *    - checkout.session.completed
 *    - customer.subscription.updated
 *    - customer.subscription.deleted
 *    - invoice.payment_failed
 * 4. Copy signing secret to STRIPE_WEBHOOK_SECRET in env variables
 */
@Module({
  imports: [
    ConfigModule,
    CommonModule,
    BillingPlanModule,
    UserprofileModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    ActivityModule,
  ],
  controllers: [BillingController, BillingWebhookController],
  providers: [StripeService, JwtAuthGuard, CurrencyService],
  exports: [StripeService],
})
export class BillingModule {}
