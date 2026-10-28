import { Types } from 'mongoose';
import { ConflictException } from '@nestjs/common';
import {
  needsFreePlan,
  SubscriberLifecycleService,
} from './subscriber-lifecycle.service';
import { PlanLimitService } from './plan-limit.service';

const id = 'a'.repeat(24);
const actor = { userId: 'b'.repeat(24), email: 'admin@example.invalid' };
const now = new Date('2026-10-28T12:00:00Z');
const end = new Date('2026-11-28T12:00:00Z');

function harness(overrides: any = {}) {
  const free = {
    _id: new Types.ObjectId(),
    name: 'Free',
    price: 0,
    limits: { invoices: 2, domains: 0, expenseTracking: false },
  };
  const paid = {
    _id: new Types.ObjectId(),
    name: 'Business',
    price: 20,
    limits: { invoices: -1, expenseTracking: true },
  };
  const user: any = {
    _id: new Types.ObjectId(id),
    fullName: 'Test Subscriber',
    email: 'qa@example.invalid',
    isSuperAdmin: false,
    planId: paid,
    subscriptionStatus: 'active',
    subscriptionAmount: 20,
    paymentProvider: 'hesabe',
    paymentEnvironment: 'sandbox',
    hesabeOrderReference: 'unchanged-order',
    currentPeriodEnd: end,
    updatedAt: now,
    subscriberManagementHistory: [],
    ...overrides,
  };
  const users: any = {
    findById: jest.fn(() => ({
      lean: jest.fn(async () => user),
      populate: jest.fn(async () => user),
    })),
    find: jest.fn(() => ({
      lean: jest.fn(async () =>
        user.paidAccessEndsAt && new Date(user.paidAccessEndsAt) <= new Date()
          ? [user]
          : [],
      ),
    })),
    findOneAndUpdate: jest.fn(async (_filter, update) => {
      Object.assign(user, update.$set);
      user.subscriberManagementHistory.push(
        update.$push.subscriberManagementHistory,
      );
      return user;
    }),
  };
  const plans: any = {
    findOne: jest.fn(() => ({ sort: jest.fn(async () => free) })),
    findById: jest.fn(async () => paid),
  };
  return {
    user,
    free,
    paid,
    users,
    plans,
    service: new SubscriberLifecycleService(users, plans),
  };
}

describe('Subscriber visibility and paid-access lifecycle', () => {
  it.each([
    { hasPlan: true, status: 'free' },
    { hasPlan: true, status: undefined },
    { hasPlan: false, status: 'free' },
    { hasPlan: false, status: undefined },
  ])(
    'archives and restores legacy records with stored plan=$hasPlan and status=$status',
    async ({ hasPlan, status }) => {
      const storedPlanId = hasPlan ? new Types.ObjectId() : undefined;
      const h = harness({ planId: storedPlanId, subscriptionStatus: status });
      // A populated read would turn this stored reference into null, making the
      // atomic update miss the unchanged record. Hydration would default status.
      h.plans.findById.mockResolvedValue(null);
      h.users.findOneAndUpdate.mockImplementation(async (filter, update) => {
        if (
          String(filter.planId ?? '') !== String(storedPlanId ?? '') ||
          filter.subscriptionStatus !== (status ?? null)
        )
          return null;
        Object.assign(h.user, update.$set);
        h.user.subscriberManagementHistory.push(
          update.$push.subscriberManagementHistory,
        );
        return h.user;
      });
      await h.service.manage(
        id,
        actor,
        'archive',
        'Archive legacy record',
        undefined,
        now.toISOString(),
      );
      expect(h.user.subscriberArchivedAt).toEqual(now);
      await h.service.manage(
        id,
        actor,
        'restore',
        'Restore legacy record',
        undefined,
        now.toISOString(),
      );
      expect(h.user.subscriberArchivedAt).toBeNull();
      expect(h.user.planId).toEqual(storedPlanId);
      expect(h.user.subscriptionStatus).toBe(status);
      expect(h.plans.findById).not.toHaveBeenCalled();
      expect(h.user.subscriberManagementHistory).toHaveLength(2);
      expect(h.users.findById.mock.results[0].value.lean).toHaveBeenCalled();
      expect(
        h.users.findById.mock.results[0].value.populate,
      ).not.toHaveBeenCalled();
    },
  );
  it('rejects a stale confirmation after a subscriber or paid term changes', async () => {
    const h = harness();
    await expect(
      h.service.manage(
        id,
        actor,
        'end_paid_access',
        'Stale confirmation',
        'immediately',
        '2026-10-27T12:00:00.000Z',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(h.users.findOneAndUpdate).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });
  afterEach(() => jest.useRealTimers());
  it('archives and restores without changing entitlements, term or payment references', async () => {
    const h = harness();
    await h.service.manage(id, actor, 'archive', 'Duplicate test account');
    expect(h.user.subscriberArchivedAt).toEqual(now);
    expect(h.user.planId).toBe(h.paid);
    expect(h.user.subscriptionStatus).toBe('active');
    expect(h.user.currentPeriodEnd).toEqual(end);
    expect(h.user.hesabeOrderReference).toBe('unchanged-order');
    await h.service.manage(id, actor, 'restore', 'Return to active records');
    expect(h.user.subscriberArchivedAt).toBeNull();
    expect(h.user.planId).toBe(h.paid);
    expect(h.user.subscriberManagementHistory).toHaveLength(2);
    expect(h.user.subscriberManagementHistory[0]).toMatchObject({
      actorEmail: actor.email,
      before: { archived: false },
      after: { archived: true },
      reason: 'Duplicate test account',
    });
    expect(
      Object.keys(h.users.findOneAndUpdate.mock.calls[0][1].$set).sort(),
    ).toEqual([
      'subscriberArchiveReason',
      'subscriberArchivedAt',
      'subscriberArchivedBy',
    ]);
  });
  it('restoring an expired term never reactivates or extends paid access', async () => {
    const h = harness({
      subscriberArchivedAt: now,
      currentPeriodEnd: new Date('2026-10-27T12:00:00Z'),
    });
    await h.service.manage(id, actor, 'restore', 'Return expired account');
    expect(await h.service.effectivePlan(h.user)).toBe(h.free);
    expect(h.user.currentPeriodEnd.toISOString()).toBe(
      '2026-10-27T12:00:00.000Z',
    );
  });
  it('ends access immediately while preserving paid-period and payment metadata', async () => {
    const h = harness();
    await h.service.manage(
      id,
      actor,
      'end_paid_access',
      'Approved access change',
      'immediately',
    );
    expect(h.user).toMatchObject({
      planId: h.free._id,
      subscriptionStatus: 'canceled',
      subscriptionAmount: 0,
      paidAccessEndedAt: now,
      paidAccessEndsAt: null,
      currentPeriodEnd: end,
      hesabeOrderReference: 'unchanged-order',
    });
    expect(await h.service.effectivePlan(h.user)).toBe(h.free);
  });
  it('keeps premium until the exact scheduled time and enforces Free before the worker runs', async () => {
    const h = harness();
    await h.service.manage(
      id,
      actor,
      'end_paid_access',
      'Finish current term',
      'period_end',
    );
    expect(h.user.subscriptionStatus).toBe('active');
    expect(h.user.planId).toBe(h.paid);
    jest.setSystemTime(new Date(end.getTime() - 1));
    expect(await h.service.effectivePlan(h.user)).toBe(h.paid);
    jest.setSystemTime(end);
    expect(await h.service.effectivePlan(h.user)).toBe(h.free);
    await h.service.expireDueAccess();
    await h.service.expireDueAccess();
    expect(h.user.subscriptionStatus).toBe('canceled');
    expect(h.user.planId).toEqual(h.free._id);
    expect(
      h.user.subscriberManagementHistory.map((event: any) => event.action),
    ).toEqual(['schedule_paid_access_end', 'paid_access_ended']);
  });
  it('undoes a future schedule without extending the original term', async () => {
    const h = harness({ paidAccessEndsAt: end });
    await h.service.manage(
      id,
      actor,
      'undo_scheduled_end',
      'Keep original paid term',
    );
    expect(h.user.paidAccessEndsAt).toBeNull();
    expect(h.user.currentPeriodEnd).toEqual(end);
    expect(h.user.planId).toBe(h.paid);
  });
  it('cannot undo an elapsed schedule or resurrect ended access', async () => {
    const h = harness({ paidAccessEndsAt: now });
    await expect(
      h.service.manage(id, actor, 'undo_scheduled_end', 'Too late to undo'),
    ).rejects.toThrow('no future');
    expect(h.user.subscriptionStatus).toBe('canceled');
    expect(h.user.planId).toEqual(h.free._id);
  });
  it.each([
    'archive',
    'restore',
    'end_paid_access',
    'undo_scheduled_end',
  ] as const)('protects super-admin accounts from %s', async (action) => {
    const h = harness({ isSuperAdmin: true });
    await expect(
      h.service.manage(id, actor, action, 'Not permitted', 'immediately'),
    ).rejects.toThrow('Super-admin');
    expect(h.users.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('rejects a concurrent change instead of overwriting a new paid term', async () => {
    const h = harness();
    h.users.findOneAndUpdate.mockResolvedValueOnce(null);
    await expect(
      h.service.manage(
        id,
        actor,
        'end_paid_access',
        'Concurrent test',
        'immediately',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(h.user.subscriptionStatus).toBe('active');
  });
  it('requires a valid paid term and rejects invalid operations', async () => {
    const h = harness({ currentPeriodEnd: undefined });
    await expect(
      h.service.manage(
        id,
        actor,
        'end_paid_access',
        'No end date',
        'period_end',
      ),
    ).rejects.toThrow('future paid-period');
    await expect(
      h.service.manage(id, actor, 'invalid' as any, 'Invalid action'),
    ).rejects.toThrow('Invalid subscriber action');
    await expect(
      h.service.manage('bad-id', actor, 'archive', 'Invalid target'),
    ).rejects.toThrow('Invalid subscriber');
  });
  it('never grants paid limits to canceled subscribers with an old paid plan reference', async () => {
    const h = harness({ subscriptionStatus: 'canceled' });
    const resources = { countDocuments: jest.fn(async () => 2) };
    const limits = new PlanLimitService(h.users, h.plans, h.service);
    await expect(
      limits.enforceLimit(id, 'invoices', resources),
    ).rejects.toThrow('limit (2)');
    await expect(limits.enforceFeature(id, 'expenseTracking')).rejects.toThrow(
      'Free',
    );
  });
  it('archiving alone does not remove premium entitlements', () => {
    expect(needsFreePlan(harness({ subscriberArchivedAt: now }).user)).toBe(
      false,
    );
  });
});
