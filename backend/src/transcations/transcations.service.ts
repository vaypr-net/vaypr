import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTranscationDto } from './dto/create-transcation.dto';
import { UpdateTranscationDto } from './dto/update-transcation.dto';
import { Transaction, TransactionDocument } from './entities/transcation.entity';
import { CurrencyService } from '../common/services/currency.service';

@Injectable()
export class TranscationsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private currencyService: CurrencyService,
  ) {}

  private toDisplayAmount(amount: number, currency?: string): number {
    const source = (currency || '').toUpperCase();
    const display = this.currencyService.getDisplayCurrency();
    if (!source || source === display) {
      return Math.round((Number(amount) || 0) * 100) / 100;
    }
    return this.currencyService.convert(Number(amount) || 0, source, display);
  }

  private mapTransactionForDisplay(tx: any) {
    const doc = tx?.toObject ? tx.toObject() : tx;
    const originalAmount = Number(doc?.amount || 0);
    const originalCurrency = (doc?.currency || '').toUpperCase();
    return {
      ...doc,
      originalAmount,
      originalCurrency,
      amount: this.toDisplayAmount(originalAmount, originalCurrency),
      currency: this.currencyService.getDisplayCurrency(),
    };
  }

  async create(createTranscationDto: CreateTranscationDto) {
    const tx = new this.transactionModel({
      ...createTranscationDto,
      transactionDate: new Date(createTranscationDto.transactionDate),
    });
    return tx.save();
  }

  async findAll(
    search?: string,
    status?: string,
    type?: string,
    limit = 50,
    offset = 0,
  ) {
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    if (search) {
      const q = search.trim();
      filter.$or = [
        { transactionId: { $regex: q, $options: 'i' } },
        { subscriberName: { $regex: q, $options: 'i' } },
        { subscriberEmail: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ transactionDate: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      this.transactionModel.countDocuments(filter),
    ]);

    return {
      items: items.map((tx) => this.mapTransactionForDisplay(tx)),
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findOne(id: string) {
    if (Types.ObjectId.isValid(id)) {
      const doc = await this.transactionModel.findById(id).lean();
      if (doc) return this.mapTransactionForDisplay(doc);
    }
    // fallback to transactionId
    const doc = await this.transactionModel.findOne({ transactionId: id }).lean();
    if (!doc) throw new BadRequestException('Transaction not found');
    return this.mapTransactionForDisplay(doc);
  }

  async update(id: string, updateTranscationDto: UpdateTranscationDto) {
    const update: any = { ...updateTranscationDto };
    if (update.transactionDate) update.transactionDate = new Date(update.transactionDate as any);
    const updated = await this.transactionModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) throw new BadRequestException('Transaction not found');
    return this.mapTransactionForDisplay(updated);
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      // try by transactionId
      const res = await this.transactionModel.findOneAndDelete({ transactionId: id });
      if (!res) throw new BadRequestException('Transaction not found');
      return { success: true };
    }
    const res = await this.transactionModel.findByIdAndDelete(id);
    if (!res) throw new BadRequestException('Transaction not found');
    return { success: true };
  }

  async getStats() {
    // Stats are converted to display currency for UI consistency.
    const [successfulSubscriptions, successfulCountAgg, failedCountAgg, refundedTransactions] = await Promise.all([
      this.transactionModel
        .find({ status: 'succeeded', type: 'subscription' })
        .select('amount currency')
        .lean(),
      this.transactionModel.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      this.transactionModel.aggregate([
        { $match: { status: 'failed' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      this.transactionModel
        .find({ type: 'refund', status: 'refunded' })
        .select('amount currency')
        .lean(),
    ]);

    const totalRevenue = successfulSubscriptions.reduce(
      (sum, tx: any) => sum + this.toDisplayAmount(tx.amount || 0, tx.currency),
      0,
    );
    const refundsTotal = refundedTransactions.reduce(
      (sum, tx: any) => sum + this.toDisplayAmount(tx.amount || 0, tx.currency),
      0,
    );

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      successfulCount: successfulCountAgg[0]?.count || 0,
      failedCount: failedCountAgg[0]?.count || 0,
      refundsTotal: Math.round(refundsTotal * 100) / 100,
    };
  }
}
