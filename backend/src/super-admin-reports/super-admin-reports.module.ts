import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdminReportsController } from './super-admin-reports.controller';
import { SuperAdminReportsService } from './super-admin-reports.service';
import { User, UserSchema } from '../user/entities/user.entity';
import { Transaction, TransactionSchema } from '../transcations/entities/transcation.entity';
import { Referral, ReferralSchema } from '../affiliate/entities/referral.entity';
import { BillingPlan, BillingPlanSchema } from '../billing-plan/entities/billing-plan.entity';
import { Ticket, TicketSchema } from '../tickets/entities/ticket.entity';
import { Affiliate, AffiliateSchema } from '../affiliate/entities/affiliate.entity';
import { Coupon, CouponSchema } from '../affiliate/entities/coupon.entity';
import { CommissionPlan, CommissionPlanSchema } from '../affiliate/entities/commission-plan.entity';
import { CurrencyService } from '../common/services/currency.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Affiliate.name, schema: AffiliateSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: CommissionPlan.name, schema: CommissionPlanSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d') as any,
        },
      }),
    }),
  ],
  controllers: [SuperAdminReportsController],
  providers: [SuperAdminReportsService, CurrencyService],
})
export class SuperAdminReportsModule {}
