import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CurrencyService } from './services/currency.service';
import { PlanLimitService } from './services/plan-limit.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [CurrencyService, PlanLimitService, PdfGeneratorService],
  exports: [CurrencyService, PlanLimitService, PdfGeneratorService],
})
export class CommonModule {}
