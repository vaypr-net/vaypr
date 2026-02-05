import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { CreateCommissionPlanDto } from './dto/create-commission-plan.dto';
import { UpdateCommissionPlanDto } from './dto/update-commission-plan.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { Affiliate } from './entities/affiliate.entity';
import { CommissionPlan } from './entities/commission-plan.entity';
import { Coupon } from './entities/coupon.entity';
import { Referral } from './entities/referral.entity';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectModel(Affiliate.name) private affiliateModel: Model<Affiliate>,
    @InjectModel(CommissionPlan.name) private commissionPlanModel: Model<CommissionPlan>,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
  ) {}

  // ==================== AFFILIATE CRUD ====================

  async createAffiliate(createAffiliateDto: CreateAffiliateDto): Promise<Affiliate> {
    try {
      const affiliate = new this.affiliateModel(createAffiliateDto);
      return await affiliate.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Email or code already exists');
      }
      throw error;
    }
  }

  async getAllAffiliates(
    search?: string,
    status?: string,
    tier?: string,
    limit = 10,
    offset = 0,
  ): Promise<{ items: Affiliate[]; total: number; hasMore: boolean }> {
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (tier) {
      query.tier = tier;
    }

    const total = await this.affiliateModel.countDocuments(query);
    const items = await this.affiliateModel
      .find(query)
      .sort({ earnings: -1 })
      .limit(limit)
      .skip(offset);

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getAffiliateById(id: string): Promise<Affiliate> {
    const affiliate = await this.affiliateModel.findById(id);
    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }
    return affiliate;
  }

  async updateAffiliate(id: string, updateAffiliateDto: UpdateAffiliateDto): Promise<Affiliate> {
    const affiliate = await this.affiliateModel.findByIdAndUpdate(id, updateAffiliateDto, {
      new: true,
    });
    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }
    return affiliate;
  }

  async deleteAffiliate(id: string): Promise<{ success: boolean; message: string }> {
    const affiliate = await this.affiliateModel.findByIdAndDelete(id);
    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }
    return { success: true, message: 'Affiliate deleted successfully' };
  }

  async updateAffiliateStatus(id: string, status: 'active' | 'inactive'): Promise<Affiliate> {
    const affiliate = await this.affiliateModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }
    return affiliate;
  }

  // ==================== COMMISSION PLAN CRUD ====================

  async createCommissionPlan(createPlanDto: CreateCommissionPlanDto): Promise<CommissionPlan> {
    const plan = new this.commissionPlanModel(createPlanDto);
    return await plan.save();
  }

  async getAllCommissionPlans(): Promise<{
    items: CommissionPlan[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    const items = await this.commissionPlanModel.find().sort({ createdAt: -1 });
    const total = await this.commissionPlanModel.countDocuments();
    
    return {
      items,
      total,
      limit: total,
      offset: 0,
      hasMore: false,
    };
  }

  async getCommissionPlanById(id: string): Promise<CommissionPlan> {
    const plan = await this.commissionPlanModel.findById(id);
    if (!plan) {
      throw new NotFoundException('Commission plan not found');
    }
    return plan;
  }

  async updateCommissionPlan(
    id: string,
    updatePlanDto: UpdateCommissionPlanDto,
  ): Promise<CommissionPlan> {
    const plan = await this.commissionPlanModel.findByIdAndUpdate(id, updatePlanDto, {
      new: true,
    });
    if (!plan) {
      throw new NotFoundException('Commission plan not found');
    }
    return plan;
  }

  async deleteCommissionPlan(id: string): Promise<{ success: boolean; message: string }> {
    const plan = await this.commissionPlanModel.findByIdAndDelete(id);
    if (!plan) {
      throw new NotFoundException('Commission plan not found');
    }
    return { success: true, message: 'Commission plan deleted successfully' };
  }

  // ==================== COUPON CRUD ====================

  async createCoupon(createCouponDto: CreateCouponDto): Promise<Coupon> {
    try {
      const coupon = new this.couponModel(createCouponDto);
      return await coupon.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Coupon code already exists');
      }
      throw error;
    }
  }

  async getAllCoupons(
    search?: string,
    status?: string,
    linkedAffiliate?: string,
    limit = 10,
    offset = 0,
  ): Promise<{ items: Coupon[]; total: number; hasMore: boolean }> {
    const query: any = {};

    if (search) {
      query.code = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (linkedAffiliate) {
      query.linkedAffiliate = linkedAffiliate;
    }

    const total = await this.couponModel.countDocuments(query);
    const items = await this.couponModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getCouponById(id: string): Promise<Coupon> {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async updateCoupon(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponModel.findByIdAndUpdate(id, updateCouponDto, {
      new: true,
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async deleteCoupon(id: string): Promise<{ success: boolean; message: string }> {
    const coupon = await this.couponModel.findByIdAndDelete(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return { success: true, message: 'Coupon deleted successfully' };
  }

  // ==================== REFERRAL TRACKING ====================

  async createReferral(createReferralDto: CreateReferralDto): Promise<Referral> {
    const referral = new this.referralModel({
      ...createReferralDto,
      conversionDate: new Date(),
    });
    return await referral.save();
  }

  async getAllReferrals(
    affiliateId?: string,
    status?: string,
    limit = 10,
    offset = 0,
  ): Promise<{ items: Referral[]; total: number; hasMore: boolean; totalCommission: number }> {
    const query: any = {};

    if (affiliateId) {
      query.affiliateId = affiliateId;
    }

    if (status) {
      query.status = status;
    }

    const total = await this.referralModel.countDocuments(query);
    const items = await this.referralModel
      .find(query)
      .sort({ conversionDate: -1 })
      .limit(limit)
      .skip(offset);

    // Calculate total commission
    const commissionData = await this.referralModel.aggregate([
      { $match: query },
      { $group: { _id: null, totalCommission: { $sum: '$commission' } } },
    ]);

    const totalCommission = commissionData[0]?.totalCommission || 0;

    return {
      items,
      total,
      hasMore: offset + limit < total,
      totalCommission,
    };
  }

  async getReferralById(id: string): Promise<Referral> {
    const referral = await this.referralModel.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }
    return referral;
  }

  async approveReferral(id: string): Promise<Referral> {
    const referral = await this.referralModel.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvalDate: new Date(),
      },
      { new: true },
    );

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    // Update affiliate pending earnings
    await this.affiliateModel.findByIdAndUpdate(
      referral.affiliateId,
      {
        $inc: {
          pending: referral.commission,
        },
      },
    );

    return referral;
  }

  async processReferralPayouts(
    affiliateId?: string,
  ): Promise<{ success: boolean; payoutsProcessed: number; totalAmount: number }> {
    const query: any = { status: 'approved' };

    if (affiliateId) {
      query.affiliateId = affiliateId;
    }

    const referrals = await this.referralModel.find(query);

    if (referrals.length === 0) {
      return { success: true, payoutsProcessed: 0, totalAmount: 0 };
    }

    let totalAmount = 0;

    // Process each referral
    for (const referral of referrals) {
      totalAmount += referral.commission;

      await this.referralModel.findByIdAndUpdate(referral._id, {
        status: 'paid',
        payoutDate: new Date(),
      });

      // Update affiliate: move from pending to earnings
      await this.affiliateModel.findByIdAndUpdate(
        referral.affiliateId,
        {
          $inc: {
            pending: -referral.commission,
            earnings: referral.commission,
          },
        },
      );
    }

    return {
      success: true,
      payoutsProcessed: referrals.length,
      totalAmount,
    };
  }

  // ==================== HELPER METHODS ====================

  async getAffiliateByCode(code: string): Promise<Affiliate> {
    const affiliate = await this.affiliateModel.findOne({ code });
    if (!affiliate) {
      throw new NotFoundException('Affiliate code not found');
    }
    return affiliate;
  }
}
