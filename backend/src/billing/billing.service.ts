import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { StripeService } from './stripe.service';
import { HesabeService } from './hesabe.service';
import { CancellationMethod, RefundStrategy, CancellationReason } from './dto/cancel-subscription.dto';
import { SubscriberLifecycleService } from '../common/services/subscriber-lifecycle.service';

@Injectable()
export class BillingService {
  constructor(private config: ConfigService, private stripe: StripeService, private hesabe: HesabeService,
    @InjectModel(User.name) private users: Model<User>, private lifecycle: SubscriberLifecycleService) {}

  configuration() {
    return this.config.get('PAYMENT_PROVIDER') === 'hesabe'
      ? { provider: 'hesabe', environment: 'sandbox', currency: 'KWD', autoRenew: false, referralsEnabled: false }
      : { provider: 'stripe', environment: 'live', autoRenew: true, referralsEnabled: true };
  }

  async createCheckoutSession(userId: string, planId: string, cycle: 'monthly' | 'yearly', currency?: string, referralCode?: string) {
    if (this.config.get('PAYMENT_PROVIDER') === 'hesabe') return this.hesabe.createCheckoutSession(userId, planId, cycle, currency || 'KWD', referralCode);
    return this.stripe.createCheckoutSession(userId, planId, cycle, currency || 'USD', referralCode);
  }
  async verifyCheckoutSession(reference: string, userId: string) {
    if (/^HSB[a-f0-9]{32}$/.test(reference)) return this.hesabe.verifyCheckoutSession(reference, userId);
    return this.stripe.verifyCheckoutSession(reference, userId);
  }
  async getSubscriptionInfo(userId: string) {
    await this.lifecycle.expireDueAccess(userId);
    const user = await this.users.findById(userId).populate('planId');
    // Administrative app-access changes are authoritative locally, not payment cancellations.
    if (user && (user.paidAccessEndsAt || user.paidAccessEndedAt)) {
      const plan: any = await this.lifecycle.effectivePlan(user);
      const object = plan?.toObject?.() || plan;
      return { plan: object ? { ...object, priceInDisplayCurrency: object.price, displayCurrency: object.currency || 'KWD' } : null,
        status: user.subscriptionStatus, billingCycle: user.billingCycle, currentPeriodEnd: user.currentPeriodEnd,
        subscriptionStartedAt: user.subscriptionStartedAt, cancellationDate: user.paidAccessEndedAt || null,
        accessUntilDate: user.paidAccessEndsAt || null, provider: user.paymentProvider || this.configuration().provider,
        environment: user.paymentEnvironment, autoRenew: user.paymentProvider === 'hesabe' ? false : undefined };
    }
    return user?.paymentProvider === 'hesabe' ? this.hesabe.getSubscriptionInfo(userId) : this.stripe.getSubscriptionInfo(userId);
  }
  async getBillingHistory(userId: string) {
    const existing = await this.stripe.getBillingHistory(userId);
    if (this.config.get('PAYMENT_PROVIDER') !== 'hesabe') return existing;
    const sandbox = await this.hesabe.getBillingHistory(userId);
    return [...sandbox, ...existing].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).slice(0, 50);
  }
  private async requireRecurring(userId: string) {
    const user = await this.users.findById(userId).select('paymentProvider');
    if (user?.paymentProvider === 'hesabe') throw new BadRequestException('This sandbox term expires automatically. There are no recurring charges to cancel.');
  }
  async createBillingPortalSession(userId: string) {
    await this.requireRecurring(userId);
    return this.stripe.createBillingPortalSession(userId);
  }
  async getCancellationPreview(userId: string, method: 'immediate' | 'at_period_end') {
    await this.requireRecurring(userId);
    return this.stripe.getCancellationPreview(userId, method);
  }
  async cancelSubscription(userId: string, method: CancellationMethod, refund: RefundStrategy, reason?: CancellationReason, feedback?: string) {
    await this.requireRecurring(userId);
    return this.stripe.cancelSubscription(userId, method, refund, reason, feedback);
  }
}
