import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';

export interface SubscriberResponse {
  _id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  subscriptionType: 'monthly' | 'yearly';
  subscriptionDate: string;
  status: 'active' | 'inactive' | 'free' | 'canceled';
  lifetimeSpend: number;
  lastPaymentDate: string;
  createdAt: string;
}

export interface SubscriberStats {
  total: number;
  active: number;
  free: number;
  canceled: number;
  inactive: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async findAll(
    search?: string,
    status?: string,
    subscriptionType?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    items: SubscriberResponse[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    const query: any = {
      isSuperAdmin: { $ne: true }, // ⬅️ Exclude super admin from subscribers
    };

    // Search by name or email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // NOTE: Status and subscriptionType filtering will work once you add
    // subscription fields to the User model. For now, all users show as "free" and "monthly"
    // So filters won't change results until subscription data is added to users

    const total = await this.userModel.countDocuments(query);
    const users = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('-password -googleAccessToken -googleRefreshToken');

    // Transform users to subscriber format
    let subscribers: SubscriberResponse[] = users.map((user) => {
      // Determine subscription status and plan
      // TODO: Replace this with actual subscription data from User model
      const hasGoogleAuth = !!user.googleId;

      return {
        _id: user._id.toString(),
        name: user.fullName,
        email: user.email,
        company: user.email.split('@')[1] || 'N/A', // Extract domain as company for now
        plan: 'Free', // TODO: Get from subscription field
        subscriptionType: 'monthly', // TODO: Get from subscription field
        subscriptionDate: user.createdAt?.toISOString() || new Date().toISOString(),
        status: 'free', // TODO: Calculate from subscription
        lifetimeSpend: 0, // TODO: Calculate from payments/transactions
        lastPaymentDate: '-', // TODO: Get from last payment record
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      };
    });

    // ⬅️ CLIENT-SIDE FILTERING (until subscription data is added to User model)
    // Filter by status
    if (status) {
      subscribers = subscribers.filter(sub => sub.status === status);
    }

    // Filter by subscription type
    if (subscriptionType) {
      subscribers = subscribers.filter(sub => sub.subscriptionType === subscriptionType);
    }

    // Recalculate total after filtering
    const filteredTotal = subscribers.length;

    return {
      items: subscribers,
      total: filteredTotal,
      limit,
      offset,
      hasMore: offset + limit < filteredTotal,
    };
  }

  async findOne(id: string): Promise<SubscriberResponse> {
    const user = await this.userModel
      .findById(id)
      .select('-password -googleAccessToken -googleRefreshToken');

    if (!user) {
      throw new Error('Subscriber not found');
    }

    const isSuperAdmin = user.isSuperAdmin;

    return {
      _id: user._id.toString(),
      name: user.fullName,
      email: user.email,
      company: user.email.split('@')[1] || 'N/A',
      plan: isSuperAdmin ? 'Admin' : 'Free',
      subscriptionType: 'monthly',
      subscriptionDate: user.createdAt?.toISOString() || new Date().toISOString(),
      status: isSuperAdmin ? 'active' : 'free',
      lifetimeSpend: 0,
      lastPaymentDate: '-',
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async update(id: string, updateSubscriberDto: UpdateSubscriberDto): Promise<SubscriberResponse> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { 
        fullName: updateSubscriberDto.name,
        email: updateSubscriberDto.email,
      },
      { new: true },
    );

    if (!user) {
      throw new Error('Subscriber not found');
    }

    return this.findOne(id);
  }

  async getStats(): Promise<SubscriberStats> {
    // Exclude super admin from counts
    const total = await this.userModel.countDocuments({ isSuperAdmin: { $ne: true } });
    
    // TODO: Calculate actual stats from subscription data
    return {
      total,
      active: 0, // TODO: Count users with active paid subscriptions
      free: total, // TODO: Count users on free plan (currently all are free)
      canceled: 0, // TODO: Count canceled subscriptions
      inactive: 0, // TODO: Count inactive subscriptions
      totalRevenue: 0, // TODO: Sum all payments
      monthlyRevenue: 0, // TODO: Sum payments this month
    };
  }
}
