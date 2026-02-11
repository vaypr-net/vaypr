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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
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
  providers: [SuperAdminReportsService],
})
export class SuperAdminReportsModule {}
