import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BillingPlanService } from './billing-plan.service';
import { BillingPlanController } from './billing-plan.controller';
import { BillingPlanPublicController } from './billing-plan-public.controller';
import { BillingPlan, BillingPlanSchema } from './entities/billing-plan.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BillingPlan.name, schema: BillingPlanSchema }]),
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
  controllers: [BillingPlanController, BillingPlanPublicController],
  providers: [BillingPlanService],
  exports: [BillingPlanService],
})
export class BillingPlanModule {}
