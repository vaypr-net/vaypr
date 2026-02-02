import {
  ForbiddenException,
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

@Injectable()
export class RecurringService {
  constructor(
    @InjectModel(Recurring.name) private recurringModel: Model<Recurring>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
  ) {}

  async create(
    createRecurringDto: CreateRecurringDto,
    userId: string,
  ): Promise<Recurring> {
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

    return recurring.save();
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

    return updatedRecurring;
  }

  async remove(id: string, userId: string): Promise<Recurring> {
    await this.findOne(id, userId);

    const deletedRecurring = await this.recurringModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();

    if (!deletedRecurring) {
      throw new NotFoundException(`Recurring with ID ${id} not found`);
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

    return updatedRecurring;
  }

  async generateInvoice(id: string, userId: string): Promise<Invoice> {
    const recurring = await this.findOne(id, userId);

    if (!recurring.isActive) {
      throw new ForbiddenException(
        'Cannot generate invoice from inactive recurring billing',
      );
    }

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

    // Create invoice from recurring template
    const invoice = new this.invoiceModel({
      userId: recurring.userId,
      clientId: recurring.clientId,
      recurringId: recurring._id,
      invoiceNumber,
      status: InvoiceStatus.SENT,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: recurring.items,
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
      // Hide item columns, show only total (as per frontend)
      hideQuantity: true,
      hideUnitPrice: true,
      hideTotalCost: true,
      hideSubTotal: true,
      useManualGrandTotal: true,
      manualGrandTotal: recurring.total,
      billTo: {
        name: '', // Will be populated from client if needed
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
}
