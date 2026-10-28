import { BillingService } from './billing.service';

describe('Billing display after administrative access changes', () => {
  function harness(overrides: any) {
    const free = {
      name: 'Free',
      price: 0,
      currency: 'KWD',
      limits: { invoices: 2 },
    };
    const user = {
      subscriptionStatus: 'active',
      paymentProvider: 'hesabe',
      paymentEnvironment: 'sandbox',
      currentPeriodEnd: new Date('2099-11-28T12:00:00Z'),
      ...overrides,
    };
    const stripe: any = { getSubscriptionInfo: jest.fn() };
    const hesabe: any = { getSubscriptionInfo: jest.fn() };
    const lifecycle: any = {
      expireDueAccess: jest.fn(),
      effectivePlan: jest.fn(async () => free),
    };
    const users: any = { findById: () => ({ populate: async () => user }) };
    const config: any = { get: () => 'hesabe' };
    return {
      user,
      free,
      stripe,
      hesabe,
      lifecycle,
      service: new BillingService(config, stripe, hesabe, users, lifecycle),
    };
  }
  it('shows ended access locally without invoking any provider lifecycle', async () => {
    const h = harness({
      paidAccessEndedAt: new Date(),
      subscriptionStatus: 'canceled',
    });
    expect(await h.service.getSubscriptionInfo('user')).toMatchObject({
      status: 'canceled',
      plan: { name: 'Free', priceInDisplayCurrency: 0 },
      autoRenew: false,
      accessUntilDate: null,
    });
    expect(h.stripe.getSubscriptionInfo).not.toHaveBeenCalled();
    expect(h.hesabe.getSubscriptionInfo).not.toHaveBeenCalled();
  });
  it('exposes a future scheduled end without replacing it with a payment cancellation', async () => {
    const end = new Date('2099-11-28T12:00:00Z');
    const h = harness({ paidAccessEndsAt: end });
    h.lifecycle.effectivePlan.mockResolvedValue({
      name: 'Business',
      price: 20,
      currency: 'KWD',
    });
    expect(await h.service.getSubscriptionInfo('user')).toMatchObject({
      status: 'active',
      plan: { name: 'Business' },
      accessUntilDate: end,
      currentPeriodEnd: end,
    });
  });
});
