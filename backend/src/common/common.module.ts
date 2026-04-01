import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CurrencyService } from './services/currency.service';
import { PlanLimitService } from './services/plan-limit.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { User, UserSchema } from '../user/entities/user.entity';
import { BillingPlan, BillingPlanSchema } from '../billing-plan/entities/billing-plan.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
    ]),
  ],
  providers: [CurrencyService, PlanLimitService, PdfGeneratorService],
  exports: [CurrencyService, PlanLimitService, PdfGeneratorService],
})
export class CommonModule {}
