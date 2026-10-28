import { SubscriberLifecycleService } from '../common/services/subscriber-lifecycle.service';
import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { HesabeGateway } from './hesabe.gateway';
import { HesabeOrder, HesabeOrderDocument } from './entities/hesabe-order.entity';
import { User } from '../user/entities/user.entity';
import { BillingPlan } from '../billing-plan/entities/billing-plan.entity';
import { Transaction } from '../transcations/entities/transcation.entity';
import { ConfigService } from '@nestjs/config';

export function kwdFils(value: unknown): number {
  const text = String(value);
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) throw new BadRequestException('Invalid KWD amount');
  const [whole, fraction = ''] = text.split('.');
  const fils = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
  if (!Number.isSafeInteger(fils)) throw new BadRequestException('Invalid KWD amount');
  return fils;
}

export function planAmountFils(price: number, cycle: string): number {
  const monthly = kwdFils(price);
  // Match the pricing page: 15% off 12 months. Calculate in integer fils.
  const amount = cycle === 'yearly' ? Math.round(monthly * 12 * 85 / 100) : monthly;
  if (amount < 200 || amount > 100000000) throw new BadRequestException('Plan is not available for online payment');
  return amount;
}

export function addBillingPeriod(start: Date, cycle: string): Date {
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + (cycle === 'yearly' ? 12 : 1));
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, last));
  return result;
}

@Injectable()
export class HesabeService implements OnModuleInit, OnModuleDestroy {
  private expiryTimer?: ReturnType<typeof setInterval>;
  constructor(
    private readonly gateway: HesabeGateway,
    private readonly config: ConfigService,
    @InjectModel(HesabeOrder.name) private readonly orders: Model<HesabeOrder>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(BillingPlan.name) private readonly plans: Model<BillingPlan>,
    @InjectModel('HesabeSandboxTransaction') private readonly transactions: Model<Transaction>,
    private readonly lifecycle: SubscriberLifecycleService,
  ) {}

  onModuleInit() {
    if (this.config.get('PAYMENT_PROVIDER') !== 'hesabe') return;
    this.gateway.settings();
    const expire = () => this.expireTerms().catch(() => console.error('Hesabe sandbox term expiry will retry'));
    void expire();
    this.expiryTimer = setInterval(expire, 60000);
    this.expiryTimer.unref();
  }
  onModuleDestroy() { if (this.expiryTimer) clearInterval(this.expiryTimer); }

  private assertSandboxDatabase() {
    const { database } = this.gateway.settings();
    if (this.orders.db.name !== database) throw new BadRequestException('Hesabe sandbox database does not match this deployment');
  }

  async expireTerms() {
    this.assertSandboxDatabase();
    const free = await this.plans.findOne({ price: 0, status: 'active' });
    if (!free) throw new BadRequestException('Free plan is missing');
    await this.users.updateMany({ paymentProvider: 'hesabe', paymentEnvironment: 'sandbox',
      subscriptionStatus: 'active', currentPeriodEnd: { $lte: new Date() } },
      { $set: { planId: free._id, subscriptionStatus: 'canceled' } });
  }

  async createCheckoutSession(userId: string, planId: string, cycle: 'monthly' | 'yearly', currency = 'KWD', referralCode?: string) {
    const settings = this.gateway.settings();
    this.assertSandboxDatabase();
    if (!Types.ObjectId.isValid(planId) || !['monthly', 'yearly'].includes(cycle)) throw new BadRequestException('Invalid plan or billing cycle');
    if (currency !== 'KWD') throw new BadRequestException('Hesabe sandbox checkout charges in KWD. Select KWD to continue.');
    const [plan, user] = await Promise.all([this.plans.findById(planId), this.users.findById(userId)]);
    if (!plan || plan.status !== 'active' || plan.currency !== 'KWD' || plan.price <= 0) throw new BadRequestException('Plan is not available for online payment');
    if (!user) throw new NotFoundException('User not found');
    if (user.stripeSubscriptionId || ['active', 'trialing', 'past_due', 'incomplete'].includes(user.subscriptionStatus)) {
      throw new BadRequestException('An existing subscription must finish before starting a new Hesabe term.');
    }
    const amountFils = planAmountFils(plan.price, cycle);
    // Do not silently drop affiliate attribution or create sandbox commissions.
    if (referralCode?.trim()) throw new BadRequestException('Referral codes are not enabled for sandbox payments. Continue without a code.');
    await this.orders.updateMany({ userId, activeCheckout: true, createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } },
      { $set: { activeCheckout: false, state: 'expired' } });
    const existing = await this.orders.findOne({ userId, activeCheckout: true });
    if (existing) {
      if (existing.redirectData && existing.amountFils === amountFils && existing.billingCycle === cycle && String(existing.planId) === planId) {
        return { url: `${this.gateway.baseUrl}/payment?data=${encodeURIComponent(existing.redirectData)}`, provider: 'hesabe', environment: 'sandbox' };
      }
      throw new BadRequestException('A checkout is already open. Finish or cancel it before starting another.');
    }
    let order: HesabeOrderDocument | undefined;
    const reservation = await this.orders.db.startSession();
    try {
      await reservation.withTransaction(async () => {
        const account = await this.users.findById(userId).session(reservation);
        if (!account) throw new NotFoundException('User not found');
        if (account.stripeSubscriptionId || ['active', 'trialing', 'past_due', 'incomplete'].includes(account.subscriptionStatus))
          throw new BadRequestException('An existing subscription must finish before starting a new Hesabe term.');
        // Share a document write with deletion so an order cannot slip between
        // its pending-checkout check and the account removal transaction.
        const locked = await this.users.updateOne({ _id: account._id }, { $inc: { __v: 1 } }, { session: reservation });
        if (!locked.matchedCount) throw new NotFoundException('User not found');
        [order] = await this.orders.create([{ reference: `HSB${randomUUID().replace(/-/g, '')}`, userId, planId,
          planName: plan.name, amountFils, currency: 'KWD', billingCycle: cycle, activeCheckout: true, state: 'creating' }], { session: reservation });
      });
    } catch (error) {
      if (error.code === 11000) throw new BadRequestException('A checkout is already being created. Please try again.');
      throw error;
    } finally { await reservation.endSession(); }
    if (!order) throw new BadRequestException('Checkout could not be reserved. Please try again.');
    try {
      const reference = order.reference;
      const checkout = await this.gateway.checkout({ amount: (amountFils / 1000).toFixed(3), currency: 'KWD',
        paymentType: 0, version: '2.0', orderReferenceNumber: reference,
        responseUrl: `${settings.api}/billing/hesabe/return/${reference}`,
        failureUrl: `${settings.api}/billing/hesabe/cancel/${reference}`,
        webhookUrl: `${settings.api}/billing/hesabe/webhook`,
        // No personal information is needed for shared public sandbox credentials.
      });
      order.paymentToken = checkout.paymentToken;
      order.redirectData = checkout.redirectData;
      order.state = 'pending';
      await order.save();
      return { url: `${this.gateway.baseUrl}/payment?data=${encodeURIComponent(checkout.redirectData)}`, provider: 'hesabe', environment: 'sandbox' };
    } catch (error) {
      await this.orders.updateOne({ _id: order._id, state: 'creating' }, { $set: { state: 'failed', activeCheckout: false } });
      throw error;
    }
  }

  async verifyCheckoutSession(reference: string, userId: string) {
    const order = await this.orders.findOne({ reference, userId, environment: 'sandbox' });
    if (!order) throw new NotFoundException('Payment not found');
    await this.reconcile(order);
    const updated = await this.orders.findById(order._id);
    if (updated?.state !== 'paid') throw new BadRequestException('Payment has not been confirmed. No paid access has been granted.');
    return { success: true, sessionId: reference, subscriptionId: reference, status: 'active',
      planName: order.planName, environment: 'sandbox', provider: 'hesabe',
      message: 'Sandbox payment verified. Your test plan is active. No real money was charged. This term does not renew automatically.' };
  }

  async reconcile(order: HesabeOrderDocument) {
    this.assertSandboxDatabase();
    if (order.state === 'paid' || !order.paymentToken) return;
    const enquiry = await this.gateway.enquire(order.paymentToken);
    const payment = enquiry?.data;
    if (enquiry?.status !== true || !payment) return;
    // Webhook/return status is never sufficient. Bind the authoritative enquiry to
    // the exact stored token, order reference, amount and requested currency.
    if (String(payment.token) !== order.paymentToken || payment.reference_number !== order.reference ||
        kwdFils(payment.amount) !== order.amountFils ||
        (payment.currency && payment.currency !== order.currency)) {
      throw new BadRequestException('Payment verification did not match this order');
    }
    if (payment.status !== 'SUCCESSFUL') {
      if (['FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED'].includes(payment.status)) {
        await this.orders.updateOne({ _id: order._id, state: { $ne: 'paid' } }, { $set: { state: 'failed', activeCheckout: false } });
      }
      return;
    }
    const session = await this.orders.db.startSession();
    try {
      // Atomic transaction makes browser refresh, repeated webhooks and concurrent
      // verification safe. A crash cannot grant access without a payment record.
      await session.withTransaction(async () => {
        const current = await this.orders.findById(order._id).session(session);
        if (!current || current.state === 'paid') return;
        const user = await this.users.findById(order.userId).session(session);
        if (!user && current.subscriberDeletedAt) {
          const now = new Date();
          // A late successful payment on an old terminal order remains visible
          // for manual reconciliation; it must never recreate the account.
          await this.transactions.updateOne({ transactionId: order.reference }, { $setOnInsert: {
            transactionId: order.reference, userId: order.userId, subscriberId: String(order.userId),
            subscriberName: current.deletedSubscriberName || 'Deleted subscriber',
            subscriberEmail: current.deletedSubscriberEmail || 'deleted@example.invalid',
            amount: order.amountFils / 1000, currency: 'KWD', type: 'subscription', provider: 'Hesabe Sandbox',
            status: 'succeeded', transactionDate: now, plan: order.planName, billingCycle: order.billingCycle,
            isSandbox: true, hesabeOrderReference: order.reference, subscriberDeletedAt: current.subscriberDeletedAt,
            needsManualReconciliation: true,
          } }, { upsert: true, session });
          await this.orders.updateOne({ _id: current._id }, { $set: {
            state: 'paid', paidOn: now, activeCheckout: false, needsManualReconciliation: true,
          } }, { session });
          return;
        }
        if (!user || user.stripeSubscriptionId) throw new BadRequestException('This payment needs manual subscription reconciliation');
        const now = new Date();
        const base = user.paymentProvider === 'hesabe' && user.subscriptionStatus === 'active' && user.currentPeriodEnd > now
          ? user.currentPeriodEnd : now;
        const periodEnd = addBillingPeriod(base, order.billingCycle);
        await this.users.updateOne({ _id: user._id }, { $set: { paymentProvider: 'hesabe', paymentEnvironment: 'sandbox',
          hesabeOrderReference: order.reference, planId: order.planId, subscriptionStatus: 'active', billingCycle: order.billingCycle,
          subscriptionAmount: order.amountFils / 1000, subscriptionStartedAt: now, currentPeriodEnd: periodEnd },
          $unset: { paidAccessEndsAt: '', paidAccessEndedAt: '', paidAccessEndReason: '', subscriptionCanceledAt: '', cancellationMethod: '', cancellationScheduledFor: '', cancellationReason: '', cancellationFeedback: '' } }, { session });
        await this.transactions.updateOne({ transactionId: order.reference }, { $setOnInsert: {
          transactionId: order.reference, userId: user._id, subscriberId: String(user._id), subscriberName: user.fullName,
          subscriberEmail: user.email, amount: order.amountFils / 1000, currency: 'KWD', type: 'subscription',
          provider: 'Hesabe Sandbox', status: 'succeeded', transactionDate: now, plan: order.planName, billingCycle: order.billingCycle,
          isSandbox: true, hesabeOrderReference: order.reference,
        } }, { upsert: true, session });
        await this.orders.updateOne({ _id: current._id }, { $set: { state: 'paid', paidOn: now, periodEnd, activeCheckout: false } }, { session });
      });
    } finally { await session.endSession(); }
  }

  async callback(reference: string, cancelled: boolean) {
    const { frontend } = this.gateway.settings();
    const order = await this.orders.findOne({ reference, environment: 'sandbox' });
    if (!order) return `${frontend}/payment/cancel`;
    try { await this.reconcile(order); } catch { /* User can retry authenticated verification. */ }
    const current = await this.orders.findById(order._id);
    if (cancelled && current?.state !== 'paid') return `${frontend}/payment/cancel?provider=hesabe`;
    return `${frontend}/payment/success?session_id=${encodeURIComponent(reference)}`;
  }

  async webhook(body: any) {
    this.gateway.settings();
    if (typeof body?.token !== 'string' || typeof body?.reference_number !== 'string') throw new BadRequestException('Invalid notification');
    const order = await this.orders.findOne({ reference: body.reference_number, paymentToken: body.token, environment: 'sandbox' });
    if (order) await this.reconcile(order);
    return { received: true };
  }

  async getSubscriptionInfo(userId: string) {
    await this.lifecycle.expireDueAccess(userId);
    await this.expireTerms();
    const user = await this.users.findById(userId).populate('planId');
    if (!user) throw new NotFoundException('User not found');
    const plan: any = await this.lifecycle.effectivePlan(user);
    return { plan: plan ? { ...plan.toObject(), price: user.subscriptionStatus === 'active' ? user.subscriptionAmount : 0,
        priceInDisplayCurrency: user.subscriptionStatus === 'active' ? user.subscriptionAmount : 0, displayCurrency: 'KWD' } : null,
      status: user.subscriptionStatus, billingCycle: user.billingCycle, currentPeriodEnd: user.currentPeriodEnd,
      subscriptionStartedAt: user.subscriptionStartedAt, provider: 'hesabe', environment: 'sandbox', autoRenew: false,
      cancellationDate: user.subscriptionCanceledAt || null, accessUntilDate: user.paidAccessEndsAt || user.cancellationScheduledFor || null };
  }

  async getBillingHistory(userId: string) {
    const items = await this.transactions.find({ userId: new Types.ObjectId(userId) }).sort({ transactionDate: -1 }).limit(50).lean();
    return items.map(tx => ({ ...tx, id: String(tx._id), environment: 'sandbox' }));
  }
}
