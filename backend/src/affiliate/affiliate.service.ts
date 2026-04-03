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
import { SendAffiliateEmailDto } from './dto/send-affiliate-email.dto';
import { Affiliate } from './entities/affiliate.entity';
import { CommissionPlan } from './entities/commission-plan.entity';
import { Coupon } from './entities/coupon.entity';
import { Referral } from './entities/referral.entity';
import { CurrencyService } from '../common/services/currency.service';
import { SuperAdminSettings } from '../superadmin-settings/entities/superadmin-settings.entity';
import { UserService } from '../user/user.service';
import { BrevoService } from '../brevo/brevo.service';
import { GmailService } from '../gmail/gmail.service';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectModel(Affiliate.name) private affiliateModel: Model<Affiliate>,
    @InjectModel(CommissionPlan.name) private commissionPlanModel: Model<CommissionPlan>,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(SuperAdminSettings.name)
    private superAdminSettingsModel: Model<SuperAdminSettings>,
    private currencyService: CurrencyService,
    private userService: UserService,
    private brevoService: BrevoService,
    private gmailService: GmailService,
  ) {}

  private toDisplayCurrency(amount: number, sourceCurrency = 'AED'): number {
    const paymentCurrency = (sourceCurrency || 'AED').toUpperCase();
    const displayCurrency = this.currencyService.getDisplayCurrency();
    if (paymentCurrency === displayCurrency) {
      return Math.round((Number(amount) || 0) * 100) / 100;
    }
    return this.currencyService.convert(Number(amount) || 0, paymentCurrency, displayCurrency);
  }

  // ==================== AFFILIATE CRUD ====================

  async createAffiliate(createAffiliateDto: CreateAffiliateDto): Promise<Affiliate> {
    try {
      const now = new Date();
      const affiliate = new this.affiliateModel({
        ...createAffiliateDto,
        joinDate: now,
        createdAt: now,
        updatedAt: now,
      });
      const saved = await affiliate.save();
      
      const doc = saved.toObject ? saved.toObject() : saved;
      return {
        ...doc,
        earnings: this.toDisplayCurrency(doc.earnings || 0, 'AED'),
        pending: this.toDisplayCurrency(doc.pending || 0, 'AED'),
        joinDate: doc.joinDate || doc.createdAt,
      } as any;
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
    try {
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
        .populate({
          path: 'commissionPlanId',
          strictPopulate: false,
        })
        .sort({ earnings: -1 })
        .limit(limit)
        .skip(offset)
        .lean()
        .exec();

      const convertedItems = items.map((affiliate: any) => {
        return {
          ...affiliate,
          // Affiliate balances are generated from Stripe referral commission values (AED).
          earnings: this.toDisplayCurrency(affiliate.earnings || 0, 'AED'),
          pending: this.toDisplayCurrency(affiliate.pending || 0, 'AED'),
          // Use createdAt as fallback for joinDate if not set
          joinDate: affiliate.joinDate || affiliate.createdAt,
        };
      });

      return {
        items: convertedItems as any,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('Error in getAllAffiliates:', error);
      throw new BadRequestException('Failed to fetch affiliates: ' + error.message);
    }
  }

  async getAffiliateById(id: string): Promise<Affiliate> {
    try {
      const affiliate = await this.affiliateModel
        .findById(id)
        .populate({
          path: 'commissionPlanId',
          strictPopulate: false,
        })
        .lean()
        .exec();
        
      if (!affiliate) {
        throw new NotFoundException('Affiliate not found');
      }
      
      return {
        ...affiliate,
        earnings: this.toDisplayCurrency(affiliate.earnings || 0, 'AED'),
        pending: this.toDisplayCurrency(affiliate.pending || 0, 'AED'),
        // Use createdAt as fallback for joinDate if not set
        joinDate: affiliate.joinDate || affiliate.createdAt,
      } as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in getAffiliateById:', error);
      throw new BadRequestException('Failed to fetch affiliate: ' + error.message);
    }
  }

  async updateAffiliate(id: string, updateAffiliateDto: UpdateAffiliateDto): Promise<Affiliate> {
    try {
      const affiliate = await this.affiliateModel.findByIdAndUpdate(
        id,
        { ...updateAffiliateDto, updatedAt: new Date() },
        { new: true }
      )
      .populate({
        path: 'commissionPlanId',
        strictPopulate: false,
      })
      .lean()
      .exec();
      
      if (!affiliate) {
        throw new NotFoundException('Affiliate not found');
      }
      
      return {
        ...affiliate,
        earnings: this.toDisplayCurrency(affiliate.earnings || 0, 'AED'),
        pending: this.toDisplayCurrency(affiliate.pending || 0, 'AED'),
        // Use createdAt as fallback for joinDate if not set
        joinDate: affiliate.joinDate || affiliate.createdAt,
      } as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in updateAffiliate:', error);
      throw new BadRequestException('Failed to update affiliate: ' + error.message);
    }
  }

  async deleteAffiliate(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const affiliate = await this.affiliateModel.findByIdAndDelete(id);
      if (!affiliate) {
        throw new NotFoundException('Affiliate not found');
      }
      return { success: true, message: 'Affiliate deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in deleteAffiliate:', error);
      throw new BadRequestException('Failed to delete affiliate: ' + error.message);
    }
  }

  async updateAffiliateStatus(id: string, status: 'active' | 'inactive'): Promise<Affiliate> {
    try {
      const affiliate = await this.affiliateModel.findByIdAndUpdate(
        id, 
        { status, updatedAt: new Date() }, 
        { new: true }
      )
      .populate({
        path: 'commissionPlanId',
        strictPopulate: false,
      })
      .lean()
      .exec();
      
      if (!affiliate) {
        throw new NotFoundException('Affiliate not found');
      }
      
      return {
        ...affiliate,
        earnings: this.toDisplayCurrency(affiliate.earnings || 0, 'AED'),
        pending: this.toDisplayCurrency(affiliate.pending || 0, 'AED'),
        // Use createdAt as fallback for joinDate if not set
        joinDate: affiliate.joinDate || affiliate.createdAt,
      } as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in updateAffiliateStatus:', error);
      throw new BadRequestException('Failed to update affiliate status: ' + error.message);
    }
  }

  async getAffiliateStats(): Promise<{
    totalAffiliates: number;
    totalReferrals: number;
    totalCommissions: number;
    pendingPayouts: number;
  }> {
    try {
      const [totalAffiliates, totalReferrals, commissionAgg, pendingAgg] = await Promise.all([
        this.affiliateModel.countDocuments(),
        this.referralModel.countDocuments(),
        this.referralModel.aggregate([
          { $group: { _id: null, total: { $sum: '$commission' } } },
        ]),
        this.affiliateModel.aggregate([
          { $group: { _id: null, total: { $sum: '$pending' } } },
        ]),
      ]);

      return {
        totalAffiliates,
        totalReferrals,
        totalCommissions: this.toDisplayCurrency(commissionAgg[0]?.total || 0),
        pendingPayouts: this.toDisplayCurrency(pendingAgg[0]?.total || 0),
      };
    } catch (error) {
      console.error('Error in getAffiliateStats:', error);
      throw new BadRequestException('Failed to fetch affiliate stats: ' + error.message);
    }
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
    try {
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
        .skip(offset)
        .lean()
        .exec();

      return {
        items,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('Error in getAllCoupons:', error);
      throw new BadRequestException('Failed to fetch coupons: ' + error.message);
    }
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
    try {
      // Auto-calculate commission from the affiliate's linked commission plan
      let commission = createReferralDto.commission ?? 0;

      const affiliate = await this.affiliateModel
        .findById(createReferralDto.affiliateId)
        .populate({
          path: 'commissionPlanId',
          strictPopulate: false,
        })
        .lean()
        .exec();

      if (affiliate && affiliate.commissionPlanId) {
        const plan = affiliate.commissionPlanId as any;
        if (plan.commissionType === 'percentage') {
          commission = (createReferralDto.amount * plan.commissionValue) / 100;
        } else {
          // fixed amount
          commission = plan.commissionValue;
        }
      }

      const referral = new this.referralModel({
        ...createReferralDto,
        commission,
        conversionDate: new Date(),
      });
      return await referral.save();
    } catch (error) {
      console.error('Error in createReferral:', error);
      throw new BadRequestException('Failed to create referral: ' + error.message);
    }
  }

  async getAllReferrals(
    affiliateId?: string,
    status?: string,
    limit = 10,
    offset = 0,
  ): Promise<{ items: Referral[]; total: number; hasMore: boolean; totalCommission: number }> {
    try {
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
        .skip(offset)
        .lean()
        .exec();

      // Calculate total commission
      const commissionData = await this.referralModel.aggregate([
        { $match: query },
        { $group: { _id: null, totalCommission: { $sum: '$commission' } } },
      ]);

      const totalCommission = commissionData[0]?.totalCommission || 0;

      const convertedItems = items.map((referral: any) => {
        return {
          ...referral,
          amount: this.toDisplayCurrency(referral.amount || 0, referral.amountCurrency || 'AED'),
          commission: this.toDisplayCurrency(referral.commission || 0, referral.commissionCurrency || 'AED'),
        };
      });

      return {
        items: convertedItems as any,
        total,
        hasMore: offset + limit < total,
        totalCommission: this.toDisplayCurrency(totalCommission, 'AED'),
      };
    } catch (error) {
      console.error('Error in getAllReferrals:', error);
      throw new BadRequestException('Failed to fetch referrals: ' + error.message);
    }
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

      // Update affiliate: move from pending to earnings and update last payment date
      await this.affiliateModel.findByIdAndUpdate(
        referral.affiliateId,
        {
          $inc: {
            pending: -referral.commission,
            earnings: referral.commission,
          },
          lastPaymentDate: new Date(),
        },
      );
    }

    return {
      success: true,
      payoutsProcessed: referrals.length,
      totalAmount,
    };
  }

  async sendAffiliateEmail(
    userId: string,
    dto: SendAffiliateEmailDto,
  ): Promise<{ success: boolean; sentVia: 'brevo' | 'gmail'; to: string; from: string; message: string }> {
    const subject = (dto.subject || '').trim();
    const message = (dto.message || '').trim();
    if (!subject || !message) {
      throw new BadRequestException('Subject and message are required');
    }

    let affiliateId = dto.affiliateId;
    if (!affiliateId && dto.referralId) {
      const referral = await this.referralModel.findById(dto.referralId);
      if (!referral) {
        throw new NotFoundException('Referral not found');
      }
      affiliateId = String(referral.affiliateId);
    }

    if (!affiliateId) {
      throw new BadRequestException('affiliateId or referralId is required');
    }

    const affiliate = await this.affiliateModel.findById(affiliateId);
    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }
    if (!affiliate.email) {
      throw new BadRequestException('Affiliate email is missing');
    }

    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const settings = await this.superAdminSettingsModel.findOne({ userId: user._id });
    const supportEmail = (settings?.supportEmail || '').trim();
    const fromEmail = supportEmail || user.email;

    const senderName = [settings?.firstName, settings?.lastName].filter(Boolean).join(' ') || user.fullName || user.email;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <p>${message.replace(/\n/g, '<br/>')}</p>
      </div>
    `;

    try {
      await this.brevoService.sendEmail(
        fromEmail,
        affiliate.email,
        subject,
        htmlBody,
        undefined,
        undefined,
        { replyTo: supportEmail || undefined, senderName },
      );
      return {
        success: true,
        sentVia: 'brevo',
        to: affiliate.email,
        from: fromEmail,
        message: 'Affiliate email sent successfully',
      };
    } catch (brevoError) {
      try {
        const gmailResult = await this.gmailService.sendEmailFromUser(
          userId,
          affiliate.email,
          subject,
          htmlBody,
          undefined,
          undefined,
          supportEmail || undefined,
        );

        return {
          success: gmailResult.success,
          sentVia: 'gmail',
          to: affiliate.email,
          from: supportEmail || user.email,
          message: gmailResult.message,
        };
      } catch (gmailError: any) {
        throw new BadRequestException(
          gmailError?.message || 'Failed to send affiliate email. Please verify support email/domain settings.',
        );
      }
    }
  }

  // ==================== HELPER METHODS ====================

  async getAffiliateByCode(code: string): Promise<Affiliate> {
    const affiliate = await this.affiliateModel.findOne({ code });
    if (!affiliate) {
      throw new NotFoundException('Affiliate code not found');
    }
    
    const doc = affiliate.toObject ? affiliate.toObject() : affiliate;
    return {
      ...doc,
      earnings: this.toDisplayCurrency(doc.earnings || 0, 'AED'),
      pending: this.toDisplayCurrency(doc.pending || 0, 'AED'),
      // Use createdAt as fallback for joinDate if not set
      joinDate: doc.joinDate || doc.createdAt,
    } as any;
  }
}
