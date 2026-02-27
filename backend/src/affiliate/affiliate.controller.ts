import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
import { CreateCommissionPlanDto } from './dto/create-commission-plan.dto';
import { UpdateCommissionPlanDto } from './dto/update-commission-plan.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

/**
 * Affiliate Management Controller
 *
 * BASE: /super-admin/affiliates
 * PROTECTED: SuperAdmin only
 */
@Controller('super-admin/affiliates')
@UseGuards(SuperAdminGuard)
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  // ======================================================
  // AFFILIATE COLLECTION
  // ======================================================

  @Post()
  createAffiliate(@Body() createAffiliateDto: CreateAffiliateDto) {
    return this.affiliateService.createAffiliate(createAffiliateDto);
  }

  @Get()
  getAllAffiliates(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.affiliateService.getAllAffiliates(
      search,
      status,
      tier,
      limit,
      offset,
    );
  }

  @Get('stats')
  getAffiliateStats() {
    return this.affiliateService.getAffiliateStats();
  }

  // ======================================================
  // COMMISSION PLANS (STATIC ROUTES FIRST)
  // ======================================================

  @Post('commission-plans')
  createCommissionPlan(@Body() createPlanDto: CreateCommissionPlanDto) {
    return this.affiliateService.createCommissionPlan(createPlanDto);
  }

  @Get('commission-plans')
  getAllCommissionPlans() {
    return this.affiliateService.getAllCommissionPlans();
  }

  @Get('commission-plans/:id')
  getCommissionPlanById(@Param('id') id: string) {
    return this.affiliateService.getCommissionPlanById(id);
  }

  @Patch('commission-plans/:id')
  updateCommissionPlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdateCommissionPlanDto,
  ) {
    return this.affiliateService.updateCommissionPlan(id, updatePlanDto);
  }

  @Delete('commission-plans/:id')
  deleteCommissionPlan(@Param('id') id: string) {
    return this.affiliateService.deleteCommissionPlan(id);
  }

  // ======================================================
  // COUPONS (STATIC ROUTES FIRST)
  // ======================================================

  @Post('coupons')
  createCoupon(@Body() createCouponDto: CreateCouponDto) {
    return this.affiliateService.createCoupon(createCouponDto);
  }

  @Get('coupons')
  getAllCoupons(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('linkedAffiliate') linkedAffiliate?: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.affiliateService.getAllCoupons(
      search,
      status,
      linkedAffiliate,
      limit,
      offset,
    );
  }

  @Get('coupons/:id')
  getCouponById(@Param('id') id: string) {
    return this.affiliateService.getCouponById(id);
  }

  @Patch('coupons/:id')
  updateCoupon(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.affiliateService.updateCoupon(id, updateCouponDto);
  }

  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.affiliateService.deleteCoupon(id);
  }

  // ======================================================
  // REFERRALS (STATIC ROUTES FIRST)
  // ======================================================

  @Get('referrals')
  getAllReferrals(
    @Query('affiliateId') affiliateId?: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.affiliateService.getAllReferrals(
      affiliateId,
      status,
      limit,
      offset,
    );
  }

  @Post('referrals')
  createReferral(@Body() createReferralDto: CreateReferralDto) {
    return this.affiliateService.createReferral(createReferralDto);
  }

  @Get('referrals/:id')
  getReferralById(@Param('id') id: string) {
    return this.affiliateService.getReferralById(id);
  }

  @Post('referrals/:id/approve')
  approveReferral(@Param('id') id: string) {
    return this.affiliateService.approveReferral(id);
  }

  @Post('referrals/payout')
  processPayouts(@Query('affiliateId') affiliateId?: string) {
    return this.affiliateService.processReferralPayouts(affiliateId);
  }

  // ======================================================
  // AFFILIATE SINGLE RESOURCE (KEEP LAST)
  // ======================================================

  @Get(':id')
  getAffiliateById(@Param('id') id: string) {
    return this.affiliateService.getAffiliateById(id);
  }

  @Patch(':id')
  updateAffiliate(
    @Param('id') id: string,
    @Body() updateAffiliateDto: UpdateAffiliateDto,
  ) {
    return this.affiliateService.updateAffiliate(id, updateAffiliateDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() { status }: { status: 'active' | 'inactive' },
  ) {
    return this.affiliateService.updateAffiliateStatus(id, status);
  }

  @Delete(':id')
  deleteAffiliate(@Param('id') id: string) {
    return this.affiliateService.deleteAffiliate(id);
  }
}
