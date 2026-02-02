import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
  ) {}

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
}
