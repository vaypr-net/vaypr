import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTranscationDto } from './dto/create-transcation.dto';
import { UpdateTranscationDto } from './dto/update-transcation.dto';
import { Transaction, TransactionDocument } from './entities/transcation.entity';

@Injectable()
export class TranscationsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

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
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findOne(id: string) {
    if (Types.ObjectId.isValid(id)) {
      const doc = await this.transactionModel.findById(id).lean();
      if (doc) return doc;
    }
    // fallback to transactionId
    const doc = await this.transactionModel.findOne({ transactionId: id }).lean();
    if (!doc) throw new BadRequestException('Transaction not found');
    return doc;
  }

  async update(id: string, updateTranscationDto: UpdateTranscationDto) {
    const update: any = { ...updateTranscationDto };
    if (update.transactionDate) update.transactionDate = new Date(update.transactionDate as any);
    const updated = await this.transactionModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) throw new BadRequestException('Transaction not found');
    return updated;
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
    // Basic stats: totalRevenue (succeeded subscriptions), successfulCount, failedCount, refundsTotal
    const results = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { status: 'succeeded', type: 'subscription' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.transactionModel.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      this.transactionModel.aggregate([
        { $match: { status: 'failed' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      this.transactionModel.aggregate([
        { $match: { type: 'refund', status: 'refunded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      totalRevenue: results[0][0]?.total || 0,
      successfulCount: results[1][0]?.count || 0,
      failedCount: results[2][0]?.count || 0,
      refundsTotal: results[3][0]?.total || 0,
    };
  }
}
