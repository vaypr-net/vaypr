import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { Recurring } from './entities/recurring.entity';
import { Client } from '../clients/entities/client.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { InvoiceStatus } from '../invoice/enums/invoice-status.enum';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';
import { PlanLimitService } from '../common/services/plan-limit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RecurringService {
  constructor(
    @InjectModel(Recurring.name) private recurringModel: Model<Recurring>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
    private planLimitService: PlanLimitService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    createRecurringDto: CreateRecurringDto,
    userId: string,
  ): Promise<Recurring> {
    // Check plan limit before creating recurring invoice
    await this.planLimitService.enforceLimit(
      userId,
      'recurringInvoices',
      this.recurringModel,
    );

    const client = await this.clientModel.findById(createRecurringDto.clientId);

    if (!client) {
      throw new NotFoundException(
        `Client with ID ${createRecurringDto.clientId} not found`,
      );
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to use this client',
      );
    }

    const recurring = new this.recurringModel({
      ...createRecurringDto,
      userId: new Types.ObjectId(userId),
      clientId: new Types.ObjectId(createRecurringDto.clientId),
    });

    const savedRecurring = await recurring.save();

    // Create notification for recurring billing creation
    try {
      await this.notificationsService.create({
        userId: userId,
        title: 'Recurring Billing Created',
        message: `New ${createRecurringDto.frequency} recurring billing created for ${client.name}.`,
        relatedId: savedRecurring._id?.toString(),
      });
    } catch (err) {
      console.error('[Recurring] Failed to create notification:', err);
    }

    return savedRecurring;
  }

  async findAll(userId: string): Promise<Recurring[]> {
    return this.recurringModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Recurring> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid recurring ID: ${id}`);
    }

    const recurring = await this.recurringModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!recurring) {
      throw new NotFoundException(`Recurring with ID ${id} not found`);
    }

    if (recurring.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this recurring billing',
      );
    }

    return recurring;
  }

  async update(
    id: string,
    updateRecurringDto: UpdateRecurringDto,
    userId: string,
  ): Promise<Recurring> {
    const existingRecurring = await this.findOne(id, userId);

    if (
      updateRecurringDto.clientId &&
      updateRecurringDto.clientId !== existingRecurring.clientId?.toString()
    ) {
      const client = await this.clientModel.findById(
        updateRecurringDto.clientId,
      );

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${updateRecurringDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    const updatedRecurring = await this.recurringModel
      .findByIdAndUpdate(
        id,
        {
          ...updateRecurringDto,
          clientId: updateRecurringDto.clientId
            ? new Types.ObjectId(updateRecurringDto.clientId)
            : existingRecurring.clientId,
        },
        { new: true },
      )
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!updatedRecurring) {
      throw new NotFoundException(`Recurring with ID ${id} not found`);
    }

    // Create notification for recurring billing update with change details
    try {
      const clientName = typeof updatedRecurring.clientId === 'object' && updatedRecurring.clientId
        ? (updatedRecurring.clientId as any).name
        : 'client';
      
      // Detect what changed
      const changes: string[] = [];
      
      if (updateRecurringDto.frequency && updateRecurringDto.frequency !== existingRecurring.frequency) {
        changes.push(`frequency to ${updateRecurringDto.frequency}`);
      }
      if (updateRecurringDto.total !== undefined && updateRecurringDto.total !== existingRecurring.total) {
        changes.push(`total amount to ${updateRecurringDto.total}`);
      }
      if (updateRecurringDto.billTo) {
        const oldBillTo = existingRecurring.billTo || {};
        const newBillTo = updateRecurringDto.billTo;
        
        if (newBillTo.name && newBillTo.name !== oldBillTo.name) changes.push('bill to name');
        if (newBillTo.phone !== oldBillTo.phone) changes.push('phone number');
        if (newBillTo.area !== oldBillTo.area) changes.push('area');
        if (newBillTo.block !== oldBillTo.block) changes.push('block');
        if (newBillTo.street !== oldBillTo.street) changes.push('street');
        if (newBillTo.house !== oldBillTo.house) changes.push('house');
        if (newBillTo.other !== oldBillTo.other) changes.push('address details');
      }
      if (updateRecurringDto.nextBillingDate && updateRecurringDto.nextBillingDate !== existingRecurring.nextBillingDate?.toISOString().split('T')[0]) {
        changes.push('next billing date');
      }
      if (updateRecurringDto.paymentType && updateRecurringDto.paymentType !== existingRecurring.paymentType) {
        changes.push('payment method');
      }
      if (updateRecurringDto.paymentTerms !== undefined && updateRecurringDto.paymentTerms !== existingRecurring.paymentTerms) {
        changes.push('payment terms');
      }
      
      const changesText = changes.length > 0 
        ? ` Changed: ${changes.join(', ')}.`
        : '';
      
      await this.notificationsService.create({
        userId: userId,
        title: 'Recurring Billing Updated',
        message: `Recurring billing for ${clientName} has been updated.${changesText}`,
        relatedId: updatedRecurring._id?.toString(),
      });
    } catch (err) {
      console.error('[Recurring] Failed to create notification:', err);
    }

    return updatedRecurring;
  }

  async remove(id: string, userId: string): Promise<Recurring> {
    const existing = await this.findOne(id, userId);

    const deletedRecurring = await this.recurringModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();

    if (!deletedRecurring) {
      throw new NotFoundException(`Recurring with ID ${id} not found`);
    }

    // Create notification for recurring billing deletion
    try {
      const clientName = typeof existing.clientId === 'object' && existing.clientId
        ? (existing.clientId as any).name
        : 'client';
      await this.notificationsService.create({
        userId: userId,
        title: 'Recurring Billing Deleted',
        message: `Recurring billing for ${clientName} has been deleted.`,
        relatedId: deletedRecurring._id?.toString(),
      });
    } catch (err) {
      console.error('[Recurring] Failed to create notification:', err);
    }

    return deletedRecurring;
  }

  async toggleActive(id: string, userId: string): Promise<Recurring> {
    const recurring = await this.findOne(id, userId);

    const updatedRecurring = await this.recurringModel
      .findByIdAndUpdate(
        id,
        { isActive: !recurring.isActive },
        { new: true },
      )
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!updatedRecurring) {
      throw new NotFoundException(`Recurring with ID ${id} not found`);
    }

    // Create notification for recurring billing toggle
    try {
      const clientName = typeof updatedRecurring.clientId === 'object' && updatedRecurring.clientId
        ? (updatedRecurring.clientId as any).name
        : 'client';
      const statusText = updatedRecurring.isActive ? 'activated' : 'paused';
      await this.notificationsService.create({
        userId: userId,
        title: `Recurring Billing ${updatedRecurring.isActive ? 'Activated' : 'Paused'}`,
        message: `Recurring billing for ${clientName} has been ${statusText}.`,
        relatedId: updatedRecurring._id?.toString(),
      });
    } catch (err) {
      console.error('[Recurring] Failed to create notification:', err);
    }

    return updatedRecurring;
  }

  async generateInvoice(id: string, userId: string): Promise<Invoice> {
    const recurring = await this.recurringModel
      .findById(id)
      .populate('clientId')
      .exec();

    if (!recurring) {
      throw new NotFoundException(`Recurring billing with ID ${id} not found`);
    }

    if (recurring.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this recurring billing',
      );
    }

    if (!recurring.isActive) {
      throw new ForbiddenException(
        'Cannot generate invoice from inactive recurring billing',
      );
    }

    // Get client details
    const client = recurring.clientId as any;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Calculate next billing date based on frequency
    const currentDate = new Date(recurring.nextBillingDate);
    let nextDate: Date;

    switch (recurring.frequency) {
      case 'weekly':
        nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate = new Date(currentDate);
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate = new Date(currentDate);
        nextDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate = new Date(currentDate);
        nextDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        nextDate = new Date(currentDate);
        nextDate.setMonth(currentDate.getMonth() + 1);
    }

    // Map recurring items to invoice items (rate -> unitPrice)
    const invoiceItems = recurring.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.rate, // Map rate to unitPrice
      amount: item.amount,
    }));

    // Create invoice from recurring template
    const invoice = new this.invoiceModel({
      userId: recurring.userId,
      clientId: recurring.clientId,
      recurringId: recurring._id,
      invoiceNumber,
      status: InvoiceStatus.SENT,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: invoiceItems,
      currency: recurring.currency,
      currencySymbol: recurring.currency,
      subtotal: recurring.subtotal,
      tax: recurring.tax,
      total: recurring.total,
      logo: recurring.logo,
      logoScale: recurring.logoScale,
      showPaymentTerms: recurring.showPaymentTerms,
      paymentTerms: recurring.paymentTerms,
      companyFooter: recurring.companyFooter,
      tableHeaderColor: recurring.itemHeaderColor,
      showPaymentMethod: !!recurring.paymentType,
      paymentMethodType: recurring.paymentType,
      showBankAccount: recurring.showBankDetails,
      bankAccount: recurring.bankDetails,
      // Keep recurring-generated invoices aligned with standard invoice preview/export columns.
      hideQuantity: false,
      hideUnitPrice: false,
      hideTotalCost: false,
      hideSubTotal: false,
      useManualGrandTotal: false,
      manualGrandTotal: 0,
      // Use billTo from recurring if exists, otherwise use client name only
      billTo: recurring.billTo || {
        name: client?.name || 'N/A',
        phone: '',
        area: '',
        block: '',
        street: '',
        house: '',
        other: '',
      },
    });

    const savedInvoice = await invoice.save();

    // Update recurring billing
    await this.recurringModel.findByIdAndUpdate(id, {
      nextBillingDate: nextDate,
      lastGeneratedAt: new Date(),
    });

    // Create notification for invoice generation from recurring
    try {
      await this.notificationsService.create({
        userId: userId,
        title: 'Invoice Generated',
        message: `Invoice ${invoiceNumber} generated from recurring billing for ${client?.name || 'client'}.`,
        relatedId: savedInvoice._id?.toString(),
      });
    } catch (err) {
      console.error('[Recurring] Failed to create notification:', err);
    }

    return savedInvoice.populate('clientId', 'name email phone clientType');
  }

  async findByClient(clientId: string, userId: string): Promise<Recurring[]> {
    const client = await this.clientModel.findById(clientId);

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this client',
      );
    }

    return this.recurringModel
      .find({
        clientId: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActive(userId: string): Promise<Recurring[]> {
    return this.recurringModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .sort({ nextBillingDate: 1 })
      .exec();
  }

  /**
   * Send "Upcoming Renewal" notification email
   * CHECKS: upcomingRenewal preference before sending
   */
  async sendUpcomingRenewalNotification(
    userId: string,
    recurringData: { recurringId: string; amount: number; renewalDate: Date }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'upcomingRenewal');
      if (!isEnabled) {
        console.log(`[Billing] Skipping "upcoming renewal" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Billing] Would send "upcoming renewal" email for recurring ${recurringData.recurringId}`);
      return true;
    } catch (error) {
      console.error(`[Billing] Error checking notification preference for upcomingRenewal:`, error);
      return true;
    }
  }

  /**
   * Send "Renewal Successful" notification email
   * CHECKS: renewalSuccessful preference before sending
   */
  async sendRenewalSuccessfulNotification(
    userId: string,
    recurringData: { recurringId: string; amount: number; renewalDate: Date; invoiceId: string }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'renewalSuccessful');
      if (!isEnabled) {
        console.log(`[Billing] Skipping "renewal successful" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Billing] Would send "renewal successful" email for recurring ${recurringData.recurringId}`);
      return true;
    } catch (error) {
      console.error(`[Billing] Error checking notification preference for renewalSuccessful:`, error);
      return true;
    }
  }

  /**
   * Send "Renewal Payment Failed" notification email
   * CHECKS: renewalPaymentFailed preference before sending
   */
  async sendRenewalPaymentFailedNotification(
    userId: string,
    recurringData: { recurringId: string; amount: number; reason: string }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'renewalPaymentFailed');
      if (!isEnabled) {
        console.log(`[Billing] Skipping "renewal payment failed" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Billing] Would send "renewal payment failed" email for recurring ${recurringData.recurringId}`);
      return true;
    } catch (error) {
      console.error(`[Billing] Error checking notification preference for renewalPaymentFailed:`, error);
      return true;
    }
  }

  /**
   * Send "Subscription Changed" notification email
   * CHECKS: subscriptionChanged preference before sending
   */
  async sendSubscriptionChangedNotification(
    userId: string,
    recurringData: { recurringId: string; changeType: string; details: string }
  ): Promise<boolean> {
    try {
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'subscriptionChanged');
      if (!isEnabled) {
        console.log(`[Billing] Skipping "subscription changed" email for user ${userId} - preference disabled`);
        return false;
      }
      console.log(`[Billing] Would send "subscription changed" email for recurring ${recurringData.recurringId}`);
      return true;
    } catch (error) {
      console.error(`[Billing] Error checking notification preference for subscriptionChanged:`, error);
      return true;
    }
  }
}
