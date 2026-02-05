import { PartialType } from '@nestjs/swagger';
import { CreateBillingPlanDto } from './create-billing-plan.dto';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateBillingPlanDto extends PartialType(CreateBillingPlanDto) {
  @IsOptional()
  @IsNumber()
  subscriberCount?: number;
}

