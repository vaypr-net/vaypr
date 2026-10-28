import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createCipheriv } from 'crypto';
import { encryptHesabe, decryptHesabe, HesabeGateway } from './hesabe.gateway';
import { addBillingPeriod, HesabeService, kwdFils, planAmountFils } from './hesabe.service';
import { HesabeOrderSchema } from './entities/hesabe-order.entity';

const key = 'a'.repeat(32);
const iv = 'b'.repeat(16);
const token = '12345678901234567890';
const reference = 'HSB' + 'a'.repeat(32);
const settings = { PAYMENT_PROVIDER: 'hesabe', HESABE_ENVIRONMENT: 'sandbox',
  FRONTEND_URL: 'https://staging.vaypr.net', HESABE_CALLBACK_BASE_URL: 'https://api-staging.vaypr.net',
  HESABE_MERCHANT_CODE: 'test', HESABE_ACCESS_CODE: 'unit-test', HESABE_SECRET_KEY: key, HESABE_IV_KEY: iv };

describe('Hesabe protocol and monetary invariants', () => {
  it('casts persisted foreign keys as ObjectIds rather than Mixed fields', () => {
    expect(HesabeOrderSchema.path('userId').instance).toBe('ObjectId');
    expect(HesabeOrderSchema.path('planId').instance).toBe('ObjectId');
  });
  afterEach(() => jest.restoreAllMocks());
  it('interoperates with AES-CBC hex and preserves Arabic UTF8', () => {
    const value = { message: 'دفع تجريبي', amount: '20.000' };
    expect(decryptHesabe(encryptHesabe(value, key, iv), key, iv)).toEqual(value);
  });
  it('accepts the official PHP kit 32-byte padding', () => {
    const json = Buffer.from(JSON.stringify({ amount: '20.000' }));
    const pad = 32 - json.length % 32;
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv));
    cipher.setAutoPadding(false);
    const raw = Buffer.concat([cipher.update(Buffer.concat([json, Buffer.alloc(pad, pad)])), cipher.final()]).toString('hex');
    expect(decryptHesabe(raw, key, iv)).toEqual({ amount: '20.000' });
  });
  it.each(['xyz', '', '00', 'a'.repeat(32)])('rejects malformed or undecodable ciphertext %s', value => {
    expect(() => decryptHesabe(value, key, iv)).toThrow();
  });
  it('uses integer fils and the published 15 percent yearly discount', () => {
    expect(kwdFils('20.001')).toBe(20001);
    expect(planAmountFils(20, 'monthly')).toBe(20000);
    expect(planAmountFils(20, 'yearly')).toBe(204000);
    expect(planAmountFils(20.123, 'yearly')).toBe(205255);
  });
  it.each(['20.0001', '-1', 'NaN', '1e3', 'Infinity'])('rejects invalid amounts %s', value => {
    expect(() => kwdFils(value)).toThrow();
  });
  it('clamps end-of-month and leap-year term boundaries', () => {
    expect(addBillingPeriod(new Date('2026-01-31T12:00:00Z'), 'monthly').toISOString()).toBe('2026-02-28T12:00:00.000Z');
    expect(addBillingPeriod(new Date('2028-02-29T12:00:00Z'), 'yearly').toISOString()).toBe('2029-02-28T12:00:00.000Z');
  });
  it('refuses live-domain sandbox use without an explicit opt-in', () => {
    const gateway = new HesabeGateway(new ConfigService({ ...settings, FRONTEND_URL: 'https://vaypr.net' }));
    expect(() => gateway.settings()).toThrow('not configured for this site');
  });
  it('permits the live domain only with matching callback and explicit opt-in', () => {
    const gateway = new HesabeGateway(new ConfigService({ ...settings, FRONTEND_URL: 'https://vaypr.net',
      HESABE_CALLBACK_BASE_URL: 'https://api.vaypr.net', HESABE_SANDBOX_ON_LIVE_SITE: 'true' }));
    expect(gateway.settings().database).toBe('vaypr');
    expect(gateway.baseUrl).toBe('https://sandbox.hesabe.com');
  });
  it('rejects a staging callback on an opted-in live site', () => {
    const gateway = new HesabeGateway(new ConfigService({ ...settings, FRONTEND_URL: 'https://vaypr.net', HESABE_SANDBOX_ON_LIVE_SITE: 'true' }));
    expect(() => gateway.settings()).toThrow('not configured for this site');
  });
  it('sends encrypted form data with a backend-only access header', async () => {
    const redirectData = 'ab'.repeat(128);
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: encryptHesabe({ status: true, token, response: { data: redirectData } }, key, iv) });
    const gateway = new HesabeGateway(new ConfigService(settings));
    expect(await gateway.checkout({ amount: '20.000', currency: 'KWD' })).toEqual({ paymentToken: token, redirectData });
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('https://sandbox.hesabe.com/checkout');
    expect(decryptHesabe(new URLSearchParams(String(body)).get('data')!, key, iv)).toMatchObject({ amount: '20.000', currency: 'KWD' });
    expect(config?.headers?.accessCode).toBe('unit-test');
  });
});

describe('Hesabe fulfilment', () => {
  function harness(payment: any = {}) {
    const order: any = { _id: 'order', reference, userId: 'user', planId: 'plan', planName: 'Business',
      state: 'pending', paymentToken: token, amountFils: 20000, currency: 'KWD', billingCycle: 'monthly' };
    const user: any = { _id: 'user', fullName: 'Sandbox QA', email: 'qa@example.invalid', subscriptionStatus: 'free' };
    const gateway: any = { settings: jest.fn(() => ({ database: 'vaypr_staging' })), enquire: jest.fn(async () => ({ status: true,
      data: { token, reference_number: reference, amount: '20.000', status: 'SUCCESSFUL', ...payment } })) };
    const query = (value: any) => ({ session: jest.fn(async () => value) });
    const session = { withTransaction: jest.fn(async fn => fn()), endSession: jest.fn() };
    const orders: any = { db: { name: 'vaypr_staging', startSession: jest.fn(async () => session) }, findById: jest.fn(() => query(order)),
      updateOne: jest.fn(async (_filter, update) => Object.assign(order, update.$set)) };
    const users: any = { findById: jest.fn(() => query(user)), updateOne: jest.fn() };
    const transactions: any = { updateOne: jest.fn() };
    const service = new HesabeService(gateway, new ConfigService(settings), orders, users, {} as any, transactions, {} as any);
    return { service, order, gateway, orders, users, transactions, session };
  }
  it.each([{ amount: '0.200' }, { reference_number: 'another-order' }, { token: 'wrong-token' }, { currency: 'AED' }])(
    'never grants access when an authoritative field is wrong: %j', async payment => {
      const h = harness(payment);
      await expect(h.service.reconcile(h.order)).rejects.toThrow('did not match');
      expect(h.users.updateOne).not.toHaveBeenCalled();
      expect(h.orders.db.startSession).not.toHaveBeenCalled();
    });
  it('does not grant access for a pending or authorization-only transaction', async () => {
    for (const status of ['PENDING', 'AUTHORIZED', 'FAILED']) {
      const h = harness({ status });
      await h.service.reconcile(h.order);
      expect(h.users.updateOne).not.toHaveBeenCalled();
    }
  });
  it('grants access and creates one sandbox ledger entry atomically', async () => {
    const h = harness();
    await h.service.reconcile(h.order);
    await h.service.reconcile(h.order);
    expect(h.order.state).toBe('paid');
    expect(h.transactions.updateOne).toHaveBeenCalledTimes(1);
    expect(h.users.updateOne).toHaveBeenCalledTimes(1);
    expect(h.users.updateOne.mock.calls[0][1].$set).toMatchObject({ paymentProvider: 'hesabe', paymentEnvironment: 'sandbox', subscriptionAmount: 20 });
    expect(h.session.withTransaction).toHaveBeenCalledTimes(1);
    expect(h.session.endSession).toHaveBeenCalled();
  });
  it('a new authoritative payment clears old access-end markers without restoring archived visibility or deleting history', async () => {
    const h = harness();
    await h.service.reconcile(h.order);
    const update = h.users.updateOne.mock.calls[0][1];
    expect(update.$unset).toMatchObject({ paidAccessEndsAt: '', paidAccessEndedAt: '', paidAccessEndReason: '' });
    expect(update.$unset).not.toHaveProperty('subscriberArchivedAt');
    expect(update.$unset).not.toHaveProperty('subscriberManagementHistory');
    expect(update.$set).not.toHaveProperty('subscriberArchivedAt');
    expect(h.transactions.updateOne.mock.calls[0][1]).toHaveProperty('$setOnInsert');
  });
  it('checks ownership before querying the provider', async () => {
    const h = harness();
    h.orders.findOne = jest.fn(async () => null);
    await expect(h.service.verifyCheckoutSession(reference, 'other-user')).rejects.toThrow('Payment not found');
    expect(h.gateway.enquire).not.toHaveBeenCalled();
  });
  it('retains a late verified payment after deletion without recreating or activating an account', async () => {
    const h = harness();
    Object.assign(h.order, { state: 'expired', subscriberDeletedAt: new Date(), deletedSubscriberName: 'Deleted QA', deletedSubscriberEmail: 'deleted.qa@example.invalid' });
    h.users.findById.mockReturnValue({ session: jest.fn(async () => null) });
    await h.service.reconcile(h.order);
    await h.service.reconcile(h.order);
    expect(h.users.updateOne).not.toHaveBeenCalled();
    expect(h.transactions.updateOne).toHaveBeenCalledTimes(1);
    expect(h.transactions.updateOne.mock.calls[0][1].$setOnInsert).toMatchObject({
      amount: 20, currency: 'KWD', subscriberEmail: 'deleted.qa@example.invalid', needsManualReconciliation: true,
    });
    expect(h.order).toMatchObject({ state: 'paid', activeCheckout: false, needsManualReconciliation: true });
  });
  it('does not trust a forged webhook status or an unknown token', async () => {
    const h = harness();
    h.orders.findOne = jest.fn(async () => null);
    expect(await h.service.webhook({ token: 'forged', reference_number: reference, status: 'SUCCESSFUL' })).toEqual({ received: true });
    expect(h.gateway.enquire).not.toHaveBeenCalled();
    expect(h.users.updateOne).not.toHaveBeenCalled();
  });
  it('rejects unsupported currencies before creating an order', async () => {
    const h = harness();
    await expect(h.service.createCheckoutSession('user', 'a'.repeat(24), 'monthly', 'AED')).rejects.toThrow('Select KWD');
    expect(h.users.updateOne).not.toHaveBeenCalled();
  });
});
