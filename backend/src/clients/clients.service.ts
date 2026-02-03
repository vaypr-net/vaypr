import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { Recurring } from '../recurring/entities/recurring.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectModel(Recurring.name) private recurringModel: Model<Recurring>,
  ) {}

  async create(userId: string, createClientDto: CreateClientDto): Promise<Client> {
    const client = new this.clientModel({
      ...createClientDto,
      userId: new Types.ObjectId(userId),
    });
    return client.save();
  }

  async findAll(userId: string): Promise<Client[]> {
    return this.clientModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findAllWithStats(userId: string): Promise<any[]> {
    const clients = await this.clientModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();

    // Get all related data in parallel
    const clientIds = clients.map((c) => c._id);
    const userIdObj = new Types.ObjectId(userId);

    const [invoices, quotes, recurring] = await Promise.all([
      this.invoiceModel
        .find({
          userId: userIdObj,
          clientId: { $in: clientIds },
        })
        .select('clientId status total')
        .exec(),
      this.quoteModel
        .find({
          userId: userIdObj,
          clientId: { $in: clientIds },
        })
        .select('clientId status total')
        .exec(),
      this.recurringModel
        .find({
          userId: userIdObj,
          clientId: { $in: clientIds },
        })
        .select('clientId isActive total')
        .exec(),
    ]);

    // Map stats to each client
    return clients.map((client) => {
      const clientInvoices = invoices.filter(
        (inv) => inv.clientId.toString() === client._id.toString(),
      );
      const clientQuotes = quotes.filter(
        (q) => q.clientId.toString() === client._id.toString(),
      );
      const clientRecurring = recurring.filter(
        (r) => r.clientId.toString() === client._id.toString(),
      );

      // Calculate invoice stats
      const paidInvoices = clientInvoices.filter((i) => i.status === 'paid').length;
      const sentInvoices = clientInvoices.filter((i) => i.status === 'sent').length;
      const overdueInvoices = clientInvoices.filter((i) => i.status === 'overdue').length;

      // Calculate quote stats
      const acceptedQuotes = clientQuotes.filter((q) => q.status === 'accepted').length;
      const sentQuotes = clientQuotes.filter((q) => q.status === 'sent').length;
      const viewedQuotes = clientQuotes.filter((q) => q.status === 'viewed').length;
      const convertedQuotes = clientQuotes.filter((q) => q.status === 'converted').length;
      const rejectedQuotes = clientQuotes.filter((q) => q.status === 'rejected').length;

      // Calculate recurring stats
      const activeRecurring = clientRecurring.filter((r) => r.isActive).length;

      // Calculate revenue
      const totalRevenue = clientInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.total, 0);

      const pendingAmount = clientInvoices
        .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
        .reduce((sum, i) => sum + i.total, 0);

      return {
        ...client.toObject(),
        stats: {
          invoices: {
            total: clientInvoices.length,
            paid: paidInvoices,
            sent: sentInvoices,
            overdue: overdueInvoices,
          },
          quotes: {
            total: clientQuotes.length,
            accepted: acceptedQuotes,
            sent: sentQuotes,
            viewed: viewedQuotes,
            converted: convertedQuotes,
            rejected: rejectedQuotes,
          },
          recurring: {
            total: clientRecurring.length,
            active: activeRecurring,
          },
          revenue: {
            total: totalRevenue,
            pending: pendingAmount,
          },
        },
      };
    });
  }

  async findOne(userId: string, id: string): Promise<Client> {
    const client = await this.clientModel.findById(id).exec();
    
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this client');
    }

    return client;
  }

  async update(userId: string, id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(userId, id);

    Object.assign(client, updateClientDto);
    return client.save();
  }

  async remove(userId: string, id: string): Promise<void> {
    const client = await this.findOne(userId, id);
    await client.deleteOne();
  }
}
