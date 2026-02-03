import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote } from './entities/quote.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class QuotesService implements OnModuleInit {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
  ) {}

  async onModuleInit() {
    try {
      // Drop the old unique index if it exists
      await this.quoteModel.collection.dropIndex('quoteNumber_1');
      console.log('Dropped old quoteNumber unique index');
    } catch (error) {
      // Index might not exist, that's fine
      console.log('Old quoteNumber index not found or already dropped');
    }
    
    // Ensure indexes are created (including the new partial unique index)
    await this.quoteModel.syncIndexes();
    console.log('Quote indexes synchronized');
  }

  async create(createQuoteDto: CreateQuoteDto, userId: string): Promise<Quote> {
    if (createQuoteDto.clientId) {
      const client = await this.clientModel.findById(createQuoteDto.clientId);

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${createQuoteDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    const quote = new this.quoteModel({
      ...createQuoteDto,
      userId: new Types.ObjectId(userId),
      clientId: createQuoteDto.clientId
        ? new Types.ObjectId(createQuoteDto.clientId)
        : undefined,
    });

    return quote.save();
  }

  async findAll(userId: string): Promise<Quote[]> {
    return this.quoteModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Quote> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quote ID: ${id}`);
    }

    const quote = await this.quoteModel
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    if (quote.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this quote',
      );
    }

    return quote;
  }

  async update(
    id: string,
    updateQuoteDto: UpdateQuoteDto,
    userId: string,
  ): Promise<Quote> {
    const existingQuote = await this.findOne(id, userId);

    if (
      updateQuoteDto.clientId &&
      updateQuoteDto.clientId !== existingQuote.clientId?.toString()
    ) {
      const client = await this.clientModel.findById(updateQuoteDto.clientId);

      if (!client) {
        throw new NotFoundException(
          `Client with ID ${updateQuoteDto.clientId} not found`,
        );
      }

      if (client.userId.toString() !== userId) {
        throw new ForbiddenException(
          'You do not have permission to use this client',
        );
      }
    }

    const updatedQuote = await this.quoteModel
      .findByIdAndUpdate(
        id,
        {
          ...updateQuoteDto,
          clientId: updateQuoteDto.clientId
            ? new Types.ObjectId(updateQuoteDto.clientId)
            : existingQuote.clientId,
        },
        { new: true },
      )
      .populate('clientId', 'name email phone clientType')
      .exec();

    if (!updatedQuote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return updatedQuote;
  }

  async remove(id: string, userId: string): Promise<Quote> {
    await this.findOne(id, userId);

    const deletedQuote = await this.quoteModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();

    if (!deletedQuote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return deletedQuote;
  }

  async findByClient(clientId: string, userId: string): Promise<Quote[]> {
    const client = await this.clientModel.findById(clientId);

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this client',
      );
    }

    return this.quoteModel
      .find({
        clientId: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(status: string, userId: string): Promise<Quote[]> {
    return this.quoteModel
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
