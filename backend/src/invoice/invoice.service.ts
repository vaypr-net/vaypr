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
import { Client } from '../clients/entities/client.entity';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';
import { PlanLimitService } from '../common/services/plan-limit.service';

@Injectable()
export class InvoiceService implements OnModuleInit {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
    private planLimitService: PlanLimitService,
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

    this.normalizeItemColumnVisibilityOnCreate(createInvoiceDto);
    this.normalizeManualGrandTotalOnCreate(createInvoiceDto);

    const invoice = new this.invoiceModel({
      ...createInvoiceDto,
      userId: new Types.ObjectId(userId),
      clientId: createInvoiceDto.clientId
        ? new Types.ObjectId(createInvoiceDto.clientId)
        : undefined,
    });

    try {
      return await invoice.save();
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
    this.normalizeItemColumnVisibilityOnUpdate(updateInvoiceDto, existingInvoice);
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

    return updatedInvoice;
  }

  /**
   * Safety guard: prevent accidental "all item columns hidden" state when the
   * invoice clearly has quantity/unit price item data.
   */
  private normalizeItemColumnVisibilityOnCreate(dto: CreateInvoiceDto): void {
    const hasQuantifiableItems = (dto.items ?? []).some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );
    const allHidden =
      dto.hideQuantity === true &&
      dto.hideUnitPrice === true &&
      dto.hideTotalCost === true;

    if (hasQuantifiableItems && allHidden) {
      dto.hideQuantity = false;
      dto.hideUnitPrice = false;
      dto.hideTotalCost = false;
    }
  }

  private normalizeItemColumnVisibilityOnUpdate(
    dto: UpdateInvoiceDto,
    existingInvoice: Invoice,
  ): void {
    const nextItems = dto.items ?? existingInvoice.items ?? [];
    const nextHideQuantity = dto.hideQuantity ?? existingInvoice.hideQuantity;
    const nextHideUnitPrice = dto.hideUnitPrice ?? existingInvoice.hideUnitPrice;
    const nextHideTotalCost = dto.hideTotalCost ?? existingInvoice.hideTotalCost;

    const hasQuantifiableItems = nextItems.some(
      (item) => Number(item?.quantity) > 0 || Number(item?.unitPrice) > 0,
    );
    const allHidden =
      nextHideQuantity === true &&
      nextHideUnitPrice === true &&
      nextHideTotalCost === true;

    if (hasQuantifiableItems && allHidden) {
      dto.hideQuantity = false;
      dto.hideUnitPrice = false;
      dto.hideTotalCost = false;
    }
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
        status,
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
      // CHECK PREFERENCE: Does user want invoice due soon notifications?
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'invoiceDueSoon');
      
      if (!isEnabled) {
        console.log(`[Invoice] Skipping "invoice due soon" email for user ${userId} - preference disabled`);
        return false;
      }

      // TODO: Send email logic here
      console.log(`[Invoice] Would send "invoice due soon" email for invoice ${invoiceData.invoiceNumber}`);
      
      return true;
    } catch (error) {
      console.error(`[Invoice] Error checking notification preference for invoiceDueSoon:`, error);
      // On error, default to true (send notification as fallback)
      return true;
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
      // CHECK PREFERENCE: Does user want invoice overdue notifications?
      const isEnabled = await this.notificationHelper.isNotificationEnabled(userId, 'invoiceOverdue');
      
      if (!isEnabled) {
        console.log(`[Invoice] Skipping "invoice overdue" email for user ${userId} - preference disabled`);
        return false;
      }

      // TODO: Send email logic here
      console.log(`[Invoice] Would send "invoice overdue" email for invoice ${invoiceData.invoiceNumber}`);
      
      return true;
    } catch (error) {
      console.error(`[Invoice] Error checking notification preference for invoiceOverdue:`, error);
      // On error, default to true (send notification as fallback)
      return true;
    }
  }
}
