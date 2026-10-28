import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { BillingPlan } from '../../billing-plan/entities/billing-plan.entity';

export interface SubscriberActor {
  userId: string;
  email?: string;
}
export type SubscriberAction =
  'archive' | 'restore' | 'end_paid_access' | 'undo_scheduled_end';

/** One entitlement rule for API limits, billing display and domain features. */
export function needsFreePlan(user: any, now = new Date()): boolean {
  return (
    ['free', 'canceled', 'incomplete'].includes(user.subscriptionStatus) ||
    (!!user.paidAccessEndsAt && new Date(user.paidAccessEndsAt) <= now) ||
    (user.paymentProvider === 'hesabe' &&
      !!user.currentPeriodEnd &&
      new Date(user.currentPeriodEnd) <= now)
  );
}

@Injectable()
export class SubscriberLifecycleService
  implements OnModuleInit, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(SubscriberLifecycleService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(BillingPlan.name) private readonly plans: Model<BillingPlan>,
  ) {}

  onModuleInit() {
    void this.expireDueAccess().catch(() =>
      this.logger.error('Scheduled access expiry will retry'),
    );
    this.timer = setInterval(
      () =>
        void this.expireDueAccess().catch(() =>
          this.logger.error('Scheduled access expiry will retry'),
        ),
      60000,
    );
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async freePlan() {
    const plan = await this.plans
      .findOne({ price: 0, status: 'active' })
      .sort({ createdAt: 1 });
    if (!plan) throw new BadRequestException('An active Free plan is required');
    return plan;
  }

  async effectivePlan(user: any) {
    return needsFreePlan(user) ? this.freePlan() : user.planId;
  }

  private snapshot(user: any) {
    return {
      name: user.fullName,
      email: user.email,
      planId: String(user.planId?._id || user.planId || ''),
      status: user.subscriptionStatus,
      archived: !!user.subscriberArchivedAt,
      paidAccessEndsAt: user.paidAccessEndsAt
        ? new Date(user.paidAccessEndsAt).toISOString()
        : null,
    };
  }

  private async target(id: string, actor?: SubscriberActor) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid subscriber');
    // Compare stored values, before population or hydration can replace a missing
    // plan reference with null or apply defaults absent from legacy records.
    const user = await this.users.findById(id).lean();
    if (!user) throw new NotFoundException('Subscriber not found');
    if (user.isSuperAdmin || actor?.userId === id)
      throw new ForbiddenException(
        'Super-admin accounts cannot be managed as subscribers',
      );
    return user;
  }

  async updateWithHistory(
    user: any,
    changes: Record<string, any>,
    action: string,
    actor: SubscriberActor,
    reason: string,
  ) {
    const after = { ...(user.toObject ? user.toObject() : user), ...changes };
    const result = await this.users.findOneAndUpdate(
      {
        _id: user._id,
        isSuperAdmin: { $ne: true },
        updatedAt: user.updatedAt,
        planId: user.planId?._id || user.planId || null,
        subscriptionStatus: user.subscriptionStatus ?? null,
        currentPeriodEnd: user.currentPeriodEnd || null,
        paidAccessEndsAt: user.paidAccessEndsAt || null,
        subscriberArchivedAt: user.subscriberArchivedAt || null,
      },
      {
        $set: changes,
        $push: {
          subscriberManagementHistory: {
            action,
            at: new Date(),
            actorId: actor.userId,
            actorEmail: actor.email || 'System',
            reason,
            before: this.snapshot(user),
            after: this.snapshot(after),
          },
        },
      },
      { new: true, runValidators: true },
    );
    if (!result)
      throw new ConflictException('Subscriber changed. Refresh and try again.');
    return result;
  }

  async manage(
    id: string,
    actor: SubscriberActor,
    action: SubscriberAction,
    reason: string,
    mode?: 'immediately' | 'period_end',
    expectedUpdatedAt?: string,
  ) {
    if (
      !['archive', 'restore', 'end_paid_access', 'undo_scheduled_end'].includes(
        action,
      )
    )
      throw new BadRequestException('Invalid subscriber action');
    // Complete an elapsed schedule before allowing undo or any other change.
    await this.expireDueAccess(id);
    const user = await this.target(id, actor);
    if (
      expectedUpdatedAt &&
      new Date(expectedUpdatedAt).getTime() !==
        new Date(user.updatedAt).getTime()
    ) {
      throw new ConflictException(
        'Subscriber changed since confirmation opened. Close it and try again.',
      );
    }
    const now = new Date();
    if (action === 'archive' || action === 'restore') {
      if (!!user.subscriberArchivedAt === (action === 'archive')) return user;
      return this.updateWithHistory(
        user,
        {
          subscriberArchivedAt: action === 'archive' ? now : null,
          subscriberArchivedBy: action === 'archive' ? actor.userId : '',
          subscriberArchiveReason: action === 'archive' ? reason : '',
        },
        action,
        actor,
        reason,
      );
    }
    if (action === 'undo_scheduled_end') {
      if (
        !user.paidAccessEndsAt ||
        new Date(user.paidAccessEndsAt) <= now ||
        needsFreePlan(user)
      ) {
        throw new BadRequestException(
          'There is no future paid access change to undo',
        );
      }
      return this.updateWithHistory(
        user,
        { paidAccessEndsAt: null, paidAccessEndReason: '' },
        action,
        actor,
        reason,
      );
    }
    const plan: any = user.planId
      ? await this.plans.findById(user.planId?._id || user.planId)
      : null;
    if (!plan || plan.price === 0 || needsFreePlan(user))
      throw new BadRequestException(
        'This subscriber has no current paid access to end',
      );
    if (mode === 'period_end') {
      if (!user.currentPeriodEnd || new Date(user.currentPeriodEnd) <= now)
        throw new BadRequestException(
          'A future paid-period end date is required',
        );
      if (user.paidAccessEndsAt)
        throw new BadRequestException(
          'Paid access is already scheduled to end',
        );
      return this.updateWithHistory(
        user,
        {
          paidAccessEndsAt: user.currentPeriodEnd,
          paidAccessEndReason: reason,
        },
        'schedule_paid_access_end',
        actor,
        reason,
      );
    }
    if (mode !== 'immediately')
      throw new BadRequestException('Choose when paid access should end');
    const free = await this.freePlan();
    return this.updateWithHistory(
      user,
      {
        planId: free._id,
        subscriptionStatus: 'canceled',
        subscriptionAmount: 0,
        subscriptionCanceledAt: now,
        paidAccessEndedAt: now,
        paidAccessEndsAt: null,
        paidAccessEndReason: reason,
      },
      action,
      actor,
      reason,
    );
  }

  async expireDueAccess(id?: string) {
    if (!id && this.running) return;
    if (id && !Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid subscriber');
    if (!id) this.running = true;
    try {
      const due = await this.users
        .find({
          ...(id ? { _id: id } : {}),
          isSuperAdmin: { $ne: true },
          paidAccessEndsAt: { $lte: new Date(), $ne: null },
        })
        .lean();
      if (!due.length) return;
      const free = await this.freePlan();
      for (const user of due) {
        try {
          await this.updateWithHistory(
            user,
            {
              planId: free._id,
              subscriptionStatus: 'canceled',
              subscriptionAmount: 0,
              subscriptionCanceledAt: user.paidAccessEndsAt,
              paidAccessEndedAt: user.paidAccessEndsAt,
              paidAccessEndsAt: null,
            },
            'paid_access_ended',
            { userId: 'system', email: 'System' },
            user.paidAccessEndReason || 'Scheduled paid access ended',
          );
        } catch (error) {
          if (!(error instanceof ConflictException)) throw error;
          // Another worker or administrator changed this subscriber; the next pass rechecks it.
        }
      }
    } finally {
      if (!id) this.running = false;
    }
  }
}
