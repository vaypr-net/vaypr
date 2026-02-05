import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { Affiliate, AffiliateSchema } from './entities/affiliate.entity';
import { CommissionPlan, CommissionPlanSchema } from './entities/commission-plan.entity';
import { Coupon, CouponSchema } from './entities/coupon.entity';
import { Referral, ReferralSchema } from './entities/referral.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Affiliate.name, schema: AffiliateSchema },
      { name: CommissionPlan.name, schema: CommissionPlanSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Referral.name, schema: ReferralSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AffiliateController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
