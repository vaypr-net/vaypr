import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { InvoiceStatus } from './enums/invoice-status.enum';
import { Client } from '../clients/entities/client.entity';
import { User } from '../user/entities/user.entity';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';
import { EmailNotificationService } from '../userprofile/email-notification.service';
import { PlanLimitService } from '../common/services/plan-limit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvoiceService implements OnModuleInit {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
    @Inject(EmailNotificationService) private emailNotificationService: EmailNotificationService,
    private planLimitService: PlanLimitService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    try {
      // Drop the old unique index if it exists
      await this.invoiceModel.collection.dropIndex('invoiceNumber_1');
      console.log('Dropped old invoiceNumber unique index');
    } catch (error) {
      // Index might not exist, that's fine
      console.log('Old invoiceNumber index not found or already dropped');
    }
    
    // Ensure indexes are created (including the new partial unique index)
    await this.invoiceModel.syncIndexes();
    console.log('Invoice indexes synchronized');
  }

  async create(
    createInvoiceDto: CreateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    // Check plan limit before creating invoice
    await this.planLimitService.enforceLimit(
      userId,
      'invoices',
      this.invoiceModel,
      { isDeleted: { $ne: true } },
    );

    // Validate client ownership if clientId is provided
    if (createInvoiceDto.clientId) {
      const client = await this.clientModel.findById(
        createInvoiceDto.clientId,
      );

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${createInvoiceDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    this.normalizeManualGrandTotalOnCreate(createInvoiceDto);

    const invoice = new this.invoiceModel({
      ...createInvoiceDto,
      userId: new Types.ObjectId(userId),
      clientId: createInvoiceDto.clientId
        ? new Types.ObjectId(createInvoiceDto.clientId)
        : undefined,
    });

    try {
      const saved = await invoice.save();
      const dueDate = saved.dueDate ? new Date(saved.dueDate) : null;
      const now = new Date();
      if (
        saved.status === 'sent' &&
        dueDate &&
        !Number.isNaN(dueDate.getTime())
      ) {
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
          await this.sendInvoiceDueSoonNotification(userId, {
            invoiceNumber: saved.invoiceNumber,
            clientEmail: saved.billTo?.name || 'Client',
            amount: saved.total || 0,
            dueDate: dueDate.toDateString(),
          });
        }
      }
      return saved;
    } catch (error: any) {
      if (this.isDuplicateInvoiceNumberError(error)) {
        throw new ConflictException(
          `Invoice number "${createInvoiceDto.invoiceNumber}" already exists. Please use a different invoice number.`,
        );
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<Invoice[]> {
    return this.invoiceModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Invoice> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid invoice ID: ${id}`);
    }

    const invoice = await this.invoiceModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (invoice.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this invoice',
      );
    }

    return invoice;
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    // First check if invoice exists and belongs to user
    const existingInvoice = await this.findOne(id, userId);
    this.normalizeManualGrandTotalOnUpdate(updateInvoiceDto, existingInvoice);

    // Validate client ownership if clientId is being updated
    if (
      updateInvoiceDto.clientId &&
      updateInvoiceDto.clientId !== existingInvoice.clientId?.toString()
    ) {
      const client = await this.clientModel.findById(
        updateInvoiceDto.clientId,
      );

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${updateInvoiceDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    let updatedInvoice: Invoice | null = null;
    try {
      updatedInvoice = await this.invoiceModel
        .findByIdAndUpdate(
          id,
          {
            ...updateInvoiceDto,
            clientId: updateInvoiceDto.clientId
              ? new Types.ObjectId(updateInvoiceDto.clientId)
              : existingInvoice.clientId,
          },
          { new: true },
        )
        .populate('clientId', 'name email phone clientType')
        .exec();
    } catch (error: any) {
      if (this.isDuplicateInvoiceNumberError(error)) {
        const duplicateNumber =
          updateInvoiceDto.invoiceNumber || existingInvoice.invoiceNumber;
        throw new ConflictException(
          `Invoice number "${duplicateNumber}" already exists. Please use a different invoice number.`,
        );
      }
      throw error;
    }

    if (!updatedInvoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existingInvoice.status !== updatedInvoice.status) {
      try {
        const statusLabel =
          String(updatedInvoice.status).charAt(0).toUpperCase() +
          String(updatedInvoice.status).slice(1);
        await this.notificationsService.create({
          userId: userId,
          title: `Invoice ${updatedInvoice.invoiceNumber} ${statusLabel}`,
          message: `${updatedInvoice.billTo?.name || 'Client'} invoice status changed to ${statusLabel}.`,
          relatedId: updatedInvoice._id?.toString(),
        });
      } catch (err) {
        console.error('[Invoice] Failed to create in-app notification:', err);
      }

      if (updatedInvoice.status === 'overdue') {
        await this.sendInvoiceOverdueNotification(userId, {
          invoiceNumber: updatedInvoice.invoiceNumber,
          clientEmail: updatedInvoice.billTo?.name || 'Client',
          amount: updatedInvoice.total || 0,
          daysOverdue: 1,
        });
      }
    }

    return updatedInvoice;
  }

  private normalizeManualGrandTotalOnCreate(dto: CreateInvoiceDto): void {
    const hasQuantifiableItems = (dto.items ?? []).some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );
    const manualGrandTotal = Number(dto.manualGrandTotal ?? 0);
    const useManualGrandTotal = dto.useManualGrandTotal === true;

    if (hasQuantifiableItems && useManualGrandTotal && manualGrandTotal <= 0) {
      dto.useManualGrandTotal = false;
      dto.manualGrandTotal = 0;
    }
  }

  private normalizeManualGrandTotalOnUpdate(
    dto: UpdateInvoiceDto,
    existingInvoice: Invoice,
  ): void {
    const nextItems = dto.items ?? existingInvoice.items ?? [];
    const nextUseManualGrandTotal =
      dto.useManualGrandTotal ?? existingInvoice.useManualGrandTotal;
    const nextManualGrandTotal = Number(
      dto.manualGrandTotal ?? existingInvoice.manualGrandTotal ?? 0,
    );
    const hasQuantifiableItems = nextItems.some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );

    if (hasQuantifiableItems && nextUseManualGrandTotal === true && nextManualGrandTotal <= 0) {
      dto.useManualGrandTotal = false;
      dto.manualGrandTotal = 0;
    }
  }

  private isDuplicateInvoiceNumberError(error: any): boolean {
    return (
      !!error &&
      error.code === 11000 &&
      (error.keyPattern?.invoiceNumber === 1 ||
        Object.prototype.hasOwnProperty.call(error.keyValue || {}, 'invoiceNumber'))
    );
  }

  async remove(id: string, userId: string): Promise<Invoice> {
    // Check if invoice exists and belongs to user
    await this.findOne(id, userId);

    const deletedInvoice = await this.invoiceModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();

    if (!deletedInvoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return deletedInvoice;
  }

  async findByClient(clientId: string, userId: string): Promise<Invoice[]> {
    // Validate client ownership
    const client = await this.clientModel.findById(clientId);

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this client',
      );
    }

    return this.invoiceModel
      .find({
        clientId: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(
    status: string,
    userId: string,
  ): Promise<Invoice[]> {
    return this.invoiceModel
      .find({
        userId: new Types.ObjectId(userId),
        status: status as InvoiceStatus,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Send "Invoice Due Soon" notification email
   * 
   * CHECKS: invoiceDueSoon preference before sending
   * - Only sends if user has NOT disabled this notification
   * - If preference check fails, returns false (notification not sent)
   * 
   * @param userId - User ID to check preferences
   * @param invoiceData - Invoice and recipient details
   * @returns true if notification was sent, false if it was skipped due to preferences
   */
  async sendInvoiceDueSoonNotification(
    userId: string,
    invoiceData: { invoiceNumber: string; clientEmail: string; amount: number; dueDate: string }
  ): Promise<boolean> {
    try {
      const user = await this.userModel.findById(userId).select('email').exec();
      if (!user?.email) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'invoiceDueSoon',
        userId,
        recipientEmail: user.email,
        data: {
          invoiceNumber: invoiceData.invoiceNumber,
          clientName: invoiceData.clientEmail || 'Client',
          amount: invoiceData.amount,
          dueDate: invoiceData.dueDate,
          currencySymbol: 'KD',
        },
      });
    } catch (error) {
      console.error(`[Invoice] Error sending invoiceDueSoon email:`, error);
      return false;
    }
  }

  /**
   * Send "Invoice Overdue" notification email
   * 
   * CHECKS: invoiceOverdue preference before sending
   * - Only sends if user has NOT disabled this notification
   * - If preference check fails, returns false (notification not sent)
   * 
   * @param userId - User ID to check preferences
   * @param invoiceData - Invoice and recipient details
   * @returns true if notification was sent, false if it was skipped due to preferences
   */
  async sendInvoiceOverdueNotification(
    userId: string,
    invoiceData: { invoiceNumber: string; clientEmail: string; amount: number; daysOverdue: number }
  ): Promise<boolean> {
    try {
      const user = await this.userModel.findById(userId).select('email').exec();
      if (!user?.email) return false;

      return await this.emailNotificationService.sendNotification({
        type: 'invoiceOverdue',
        userId,
        recipientEmail: user.email,
        data: {
          invoiceNumber: invoiceData.invoiceNumber,
          clientName: invoiceData.clientEmail || 'Client',
          amount: invoiceData.amount,
          dueDate: new Date().toDateString(),
          daysOverdue: invoiceData.daysOverdue || 1,
          currencySymbol: 'KD',
        },
      });
    } catch (error) {
      console.error(`[Invoice] Error sending invoiceOverdue email:`, error);
      return false;
    }
  }
}
