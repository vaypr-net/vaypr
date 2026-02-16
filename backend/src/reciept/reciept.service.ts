import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReceiptDto } from './dto/create-reciept.dto';
import { UpdateReceiptDto } from './dto/update-reciept.dto';
import { Receipt } from './entities/reciept.entity';
import { Client } from '../clients/entities/client.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { PlanLimitService } from '../common/services/plan-limit.service';

@Injectable()
export class RecieptService {
  constructor(
    @InjectModel(Receipt.name) private receiptModel: Model<Receipt>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    private planLimitService: PlanLimitService,
  ) {}

  async create(
    createReceiptDto: CreateReceiptDto,
    userId: string,
  ): Promise<Receipt> {
    // Check plan limit before creating receipt
    await this.planLimitService.enforceLimit(
      userId,
      'receipts',
      this.receiptModel,
    );

    if (createReceiptDto.clientId) {
      const client = await this.clientModel.findById(
        createReceiptDto.clientId,
      );

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${createReceiptDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    if (createReceiptDto.invoiceId) {
      const invoice = await this.invoiceModel.findById(
        createReceiptDto.invoiceId,
      );

      if (!invoice) {
        throw new NotFoundException(
          `Invoice with ID ${createReceiptDto.invoiceId} not found`,
        );
      }

      if (invoice.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this invoice',
        );
      }
    }

    const receipt = new this.receiptModel({
      ...createReceiptDto,
      userId: new Types.ObjectId(userId),
      clientId: createReceiptDto.clientId
        ? new Types.ObjectId(createReceiptDto.clientId)
        : undefined,
      invoiceId: createReceiptDto.invoiceId
        ? new Types.ObjectId(createReceiptDto.invoiceId)
        : undefined,
    });

    return receipt.save();
  }

  async findAll(userId: string): Promise<Receipt[]> {
    return this.receiptModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .populate('invoiceId', 'invoiceNumber total status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Receipt> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid receipt ID: ${id}`);
    }

    const receipt = await this.receiptModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .populate('invoiceId', 'invoiceNumber total status')
      .exec();

    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }

    if (receipt.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this receipt',
      );
    }

    return receipt;
  }

  async update(
    id: string,
    updateReceiptDto: UpdateReceiptDto,
    userId: string,
  ): Promise<Receipt> {
    const existingReceipt = await this.findOne(id, userId);

    if (
      updateReceiptDto.clientId &&
      updateReceiptDto.clientId !== existingReceipt.clientId?.toString()
    ) {
      const client = await this.clientModel.findById(
        updateReceiptDto.clientId,
      );

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${updateReceiptDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    if (
      updateReceiptDto.invoiceId &&
      updateReceiptDto.invoiceId !== existingReceipt.invoiceId?.toString()
    ) {
      const invoice = await this.invoiceModel.findById(
        updateReceiptDto.invoiceId,
      );

      if (!invoice) {
        throw new NotFoundException(
          `Invoice with ID ${updateReceiptDto.invoiceId} not found`,
        );
      }

      if (invoice.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this invoice',
        );
      }
    }

    const updatedReceipt = await this.receiptModel
      .findByIdAndUpdate(
        id,
        {
          ...updateReceiptDto,
          clientId: updateReceiptDto.clientId
            ? new Types.ObjectId(updateReceiptDto.clientId)
            : existingReceipt.clientId,
          invoiceId: updateReceiptDto.invoiceId
            ? new Types.ObjectId(updateReceiptDto.invoiceId)
            : existingReceipt.invoiceId,
        },
        { new: true },
      )
      .populate('clientId', 'name email phone clientType')
      .populate('invoiceId', 'invoiceNumber total status')
      .exec();

    if (!updatedReceipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }

    return updatedReceipt;
  }

  async remove(id: string, userId: string): Promise<Receipt> {
    await this.findOne(id, userId);

    const deletedReceipt = await this.receiptModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();

    if (!deletedReceipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }

    return deletedReceipt;
  }

  async findByClient(clientId: string, userId: string): Promise<Receipt[]> {
    const client = await this.clientModel.findById(clientId);

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this client',
      );
    }

    return this.receiptModel
      .find({
        clientId: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByInvoice(invoiceId: string, userId: string): Promise<Receipt[]> {
    const invoice = await this.invoiceModel.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this invoice',
      );
    }

    return this.receiptModel
      .find({
        invoiceId: new Types.ObjectId(invoiceId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(status: string, userId: string): Promise<Receipt[]> {
    return this.receiptModel
      .find({
        userId: new Types.ObjectId(userId),
        status,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .populate('invoiceId', 'invoiceNumber total status')
      .sort({ createdAt: -1 })
      .exec();
  }
}
