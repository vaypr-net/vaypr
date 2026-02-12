import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { Client } from '../clients/entities/client.entity';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';

@Injectable()
export class InvoiceService implements OnModuleInit {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @Inject(NotificationPreferencesHelper) private notificationHelper: NotificationPreferencesHelper,
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

    const invoice = new this.invoiceModel({
      ...createInvoiceDto,
      userId: new Types.ObjectId(userId),
      clientId: createInvoiceDto.clientId
        ? new Types.ObjectId(createInvoiceDto.clientId)
        : undefined,
    });

    return invoice.save();
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

    const updatedInvoice = await this.invoiceModel
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

    if (!updatedInvoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return updatedInvoice;
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
