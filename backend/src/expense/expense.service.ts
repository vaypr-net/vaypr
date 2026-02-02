import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, ExpenseDocument } from './entities/expense.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense.name)
    private expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: string,
    receiptUrl?: string,
  ): Promise<Expense> {
    const expense = new this.expenseModel({
      ...createExpenseDto,
      userId: new Types.ObjectId(userId),
      receipt: receiptUrl,
      currency: createExpenseDto.currency || 'KWD',
    });

    return expense.save();
  }

  async findAll(
    userId: string,
    category?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Expense[]> {
    const query: any = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    };

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    return this.expenseModel
      .find(query)
      .sort({ date: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Expense> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid expense ID');
    }

    const expense = await this.expenseModel
      .findOne({
        _id: new Types.ObjectId(id),
        isDeleted: false,
      })
      .exec();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this expense');
    }

    return expense;
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
    receiptUrl?: string,
  ): Promise<Expense> {
    const expense = await this.findOne(id, userId);

    const updateData: any = { ...updateExpenseDto };
    if (receiptUrl) {
      updateData.receipt = receiptUrl;
    }

    Object.assign(expense, updateData);
    return expense.save();
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const expense = await this.findOne(id, userId);

    expense.isDeleted = true;
    await expense.save();

    return { message: 'Expense deleted successfully' };
  }

  async getStats(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalExpenses: number;
    totalAmount: number;
    byCategory: { category: string; amount: number; count: number }[];
  }> {
    const query: any = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const expenses = await this.expenseModel.find(query).exec();

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Group by category
    const categoryMap = new Map<string, { amount: number; count: number }>();
    expenses.forEach((exp) => {
      const existing = categoryMap.get(exp.category) || { amount: 0, count: 0 };
      categoryMap.set(exp.category, {
        amount: existing.amount + exp.amount,
        count: existing.count + 1,
      });
    });

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
      }),
    );

    return {
      totalExpenses,
      totalAmount,
      byCategory,
    };
  }
}
