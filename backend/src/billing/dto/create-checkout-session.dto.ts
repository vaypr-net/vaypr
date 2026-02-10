import { IsString, IsIn } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  planId: string;

  @IsIn(['monthly', 'yearly'])
  billingCycle: 'monthly' | 'yearly';
}
