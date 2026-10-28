import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ClientSession, Connection, Types } from 'mongoose';
import { createHash } from 'crypto';
import {
  SubscriberActor,
  needsFreePlan,
} from '../common/services/subscriber-lifecycle.service';
import { DeleteSubscriberDto } from './dto/delete-subscriber.dto';

// An explicit allowlist prevents a schema change from accidentally erasing a
// payment collection. Native filters include old string-valued ownership IDs.
export const DELETED_SUBSCRIBER_DATA = [
  { model: 'UserProfile', field: 'userId', label: 'Profiles' },
  { model: 'Session', field: 'user', label: 'Sessions' },
  { model: 'Client', field: 'userId', label: 'Clients' },
  { model: 'Invoice', field: 'userId', label: 'Invoices' },
  { model: 'Quote', field: 'userId', label: 'Quotes' },
  { model: 'Receipt', field: 'userId', label: 'Receipts' },
  { model: 'Recurring', field: 'userId', label: 'Recurring invoices' },
  { model: 'Expense', field: 'userId', label: 'Expenses' },
  { model: 'UserSender', field: 'userId', label: 'Email senders' },
  { model: 'EmailSettings', field: 'ownerId', label: 'Email settings' },
  {
    model: 'BrevoDomain',
    field: 'userId',
    label: 'Local email domain settings',
  },
  { model: 'Notification', field: 'userId', label: 'Notifications' },
  { model: 'Ticket', field: 'customerId', label: 'Support tickets' },
] as const;

export const RETAINED_SUBSCRIBER_DATA = [
  { model: 'Transaction', label: 'Payment transactions' },
  { model: 'HesabeSandboxTransaction', label: 'Hesabe sandbox transactions' },
  { model: 'HesabeOrder', label: 'Hesabe orders' },
  { model: 'Referral', label: 'Referral and commission records' },
] as const;

@Injectable()
export class SubscriberDeletionService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly jwt: JwtService,
  ) {}

  private collection(name: string) {
    return this.db.model(name).collection;
  }
  private owner(field: string, id: string) {
    return { [field]: { $in: [new Types.ObjectId(id), id] } };
  }
  private financialOwner(id: string) {
    return { $or: [this.owner('userId', id), this.owner('subscriberId', id)] };
  }
  private retainedFilter(model: string, id: string) {
    return model === 'HesabeOrder'
      ? this.owner('userId', id)
      : this.financialOwner(id);
  }

  private async inspect(
    id: string,
    actor: SubscriberActor,
    session?: ClientSession,
  ) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(actor.userId))
      throw new BadRequestException('Invalid subscriber');
    const options = session ? { session } : {};
    const admin = await this.collection('User').findOne(
      { _id: new Types.ObjectId(actor.userId), isSuperAdmin: true },
      options,
    );
    if (!admin)
      throw new ForbiddenException('Current super-admin access required');
    const user = await this.collection('User').findOne(
      { _id: new Types.ObjectId(id) },
      options,
    );
    if (!user) throw new NotFoundException('Subscriber not found');
    if (user.isSuperAdmin || id === actor.userId)
      throw new ForbiddenException('Super-admin accounts cannot be deleted');
    const blockers: string[] = [];
    if (!user.subscriberArchivedAt)
      blockers.push('Archive the subscriber first.');
    if (!user.updatedAt)
      blockers.push(
        'This legacy account must be refreshed by an administrator before deletion.',
      );
    if (
      ['active', 'trialing', 'past_due'].includes(user.subscriptionStatus) &&
      !needsFreePlan(user)
    ) {
      const plan =
        user.planId && Types.ObjectId.isValid(String(user.planId))
          ? await this.collection('BillingPlan').findOne(
              { _id: new Types.ObjectId(String(user.planId)) },
              options,
            )
          : null;
      if (!plan || plan.price !== 0)
        blockers.push(
          'End paid access or confirm a Free plan before deleting this account.',
        );
    }
    // Provider cancellation is never performed by account deletion. A Stripe
    // reference may still auto-renew even after an app-only access override.
    if (user.stripeSubscriptionId)
      blockers.push(
        'A legacy Stripe subscription reference remains. Reconcile it separately before deletion.',
      );
    if (['pending', 'processing'].includes(user.refundStatus))
      blockers.push('Resolve the pending refund before deletion.');
    const pendingOrders = await this.collection('HesabeOrder').countDocuments(
      {
        ...this.owner('userId', id),
        $or: [
          { activeCheckout: true },
          { state: { $in: ['creating', 'pending'] } },
        ],
      },
      options,
    );
    if (pendingOrders)
      blockers.push('Resolve open Hesabe checkouts before deletion.');
    for (const model of ['Transaction', 'HesabeSandboxTransaction']) {
      const pending = await this.collection(model).countDocuments(
        { ...this.financialOwner(id), status: 'pending' },
        options,
      );
      if (pending)
        blockers.push('Resolve pending payment transactions before deletion.');
    }
    const deletedCounts: Record<string, number> = { Account: 1 };
    const retainedCounts: Record<string, number> = {};
    // MongoDB does not support parallel operations within one transaction.
    for (const entry of DELETED_SUBSCRIBER_DATA) {
      deletedCounts[entry.label] = await this.collection(
        entry.model,
      ).countDocuments(this.owner(entry.field, id), options);
    }
    for (const entry of RETAINED_SUBSCRIBER_DATA) {
      retainedCounts[entry.label] = await this.collection(
        entry.model,
      ).countDocuments(this.retainedFilter(entry.model, id), options);
    }
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          id,
          version: user.updatedAt,
          email: user.email,
          archivedAt: user.subscriberArchivedAt,
          status: user.subscriptionStatus,
          planId: user.planId,
          periodEnd: user.currentPeriodEnd,
          paidAccessEndsAt: user.paidAccessEndsAt,
          blockers,
          deletedCounts,
          retainedCounts,
        }),
      )
      .digest('hex');
    return {
      user,
      admin,
      blockers,
      deletedCounts,
      retainedCounts,
      fingerprint,
    };
  }

  async preview(id: string, actor: SubscriberActor) {
    const result = await this.inspect(id, actor);
    return {
      subscriberId: id,
      name: result.user.fullName,
      email: result.user.email,
      canDelete: result.blockers.length === 0,
      blockers: result.blockers,
      deletedCounts: result.deletedCounts,
      retainedCounts: result.retainedCounts,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      previewToken: result.blockers.length
        ? null
        : this.jwt.sign(
            {
              type: 'subscriber_deletion_preview',
              sub: id,
              actorId: actor.userId,
              fingerprint: result.fingerprint,
            },
            { expiresIn: '10m' },
          ),
    };
  }

  async delete(id: string, body: DeleteSubscriberDto, actor: SubscriberActor) {
    let claims: any;
    try {
      claims = await this.jwt.verifyAsync(body.previewToken);
    } catch {
      throw new ConflictException(
        'Deletion preview expired. Close the dialog and review it again.',
      );
    }
    if (
      claims.type !== 'subscriber_deletion_preview' ||
      claims.sub !== id ||
      claims.actorId !== actor.userId
    ) {
      throw new ForbiddenException(
        'Deletion confirmation does not match this account and administrator',
      );
    }
    if (
      body.confirmation !== 'DELETE' ||
      body.acknowledgeIrreversible !== true ||
      body.acknowledgeRetention !== true ||
      body.reason?.trim().length < 3
    ) {
      throw new BadRequestException('Complete every deletion confirmation');
    }
    const session = await this.db.startSession();
    try {
      return await session.withTransaction(async () => {
        const result = await this.inspect(id, actor, session);
        if (result.blockers.length)
          throw new ConflictException(result.blockers.join(' '));
        if (result.fingerprint !== claims.fingerprint)
          throw new ConflictException(
            'Account or record counts changed. Close the dialog and review deletion again.',
          );
        if (
          body.confirmEmail?.trim().toLowerCase() !==
          result.user.email.toLowerCase()
        )
          throw new BadRequestException(
            'Type the subscriber email to confirm deletion',
          );
        const deletedAt = new Date();
        const receipt = {
          subscriberId: id,
          subscriberName: result.user.fullName,
          subscriberEmail: result.user.email,
          deletedAt,
          actorId: actor.userId,
          actorEmail: result.admin.email,
          reason: body.reason.trim(),
          deletedCounts: result.deletedCounts,
          retainedCounts: result.retainedCounts,
          managementHistory: result.user.subscriberManagementHistory || [],
        };
        await this.db
          .model('SubscriberDeletion')
          .create([receipt], { session });
        for (const entry of RETAINED_SUBSCRIBER_DATA) {
          // Only account-lifecycle metadata changes. Amounts, identity snapshots,
          // original IDs and provider references are never removed or rewritten.
          await this.collection(entry.model).updateMany(
            this.retainedFilter(entry.model, id),
            {
              $set: {
                subscriberDeletedAt: deletedAt,
                ...(entry.model === 'HesabeOrder'
                  ? {
                      deletedSubscriberName: result.user.fullName,
                      deletedSubscriberEmail: result.user.email,
                    }
                  : {}),
              },
            },
            { session },
          );
        }
        for (const entry of DELETED_SUBSCRIBER_DATA) {
          const removed = await this.collection(entry.model).deleteMany(
            this.owner(entry.field, id),
            { session },
          );
          if (removed.deletedCount !== result.deletedCounts[entry.label])
            throw new ConflictException(
              'Subscriber data changed during deletion. Review again.',
            );
        }
        const removed = await this.collection('User').deleteOne(
          {
            _id: result.user._id,
            isSuperAdmin: { $ne: true },
            updatedAt: result.user.updatedAt,
            subscriberArchivedAt: result.user.subscriberArchivedAt,
          },
          { session },
        );
        if (removed.deletedCount !== 1)
          throw new ConflictException(
            'Subscriber changed during deletion. Review again.',
          );
        return {
          subscriberId: id,
          deletedAt,
          deletedCounts: result.deletedCounts,
          retainedCounts: result.retainedCounts,
        };
      });
    } finally {
      await session.endSession();
    }
  }

  async history() {
    return this.db
      .model('SubscriberDeletion')
      .find()
      .sort({ deletedAt: -1 })
      .limit(100)
      .lean();
  }

  async retainedPayments(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid subscriber');
    const receipt = await this.db
      .model('SubscriberDeletion')
      .findOne({ subscriberId: id })
      .lean();
    if (!receipt) throw new NotFoundException('Deletion audit not found');
    const transactions: any[] = [];
    for (const model of ['Transaction', 'HesabeSandboxTransaction']) {
      const items = await this.collection(model)
        .find(this.financialOwner(id), {
          projection: {
            transactionId: 1,
            amount: 1,
            currency: 1,
            status: 1,
            type: 1,
            provider: 1,
            transactionDate: 1,
            isSandbox: 1,
            hesabeOrderReference: 1,
            subscriberDeletedAt: 1,
            needsManualReconciliation: 1,
          },
        })
        .sort({ transactionDate: -1 })
        .limit(100)
        .toArray();
      transactions.push(...items);
    }
    const orders = await this.collection('HesabeOrder')
      .find(this.owner('userId', id), {
        projection: {
          reference: 1,
          amountFils: 1,
          currency: 1,
          state: 1,
          environment: 1,
          paidOn: 1,
          createdAt: 1,
          needsManualReconciliation: 1,
        },
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return { transactions, orders };
  }
}
