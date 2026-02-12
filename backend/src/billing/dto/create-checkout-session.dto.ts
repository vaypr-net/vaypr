import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  planId: string;

  @IsIn(['monthly', 'yearly'])
  billingCycle: 'monthly' | 'yearly';

  @IsOptional()
  @IsString()
  @IsIn(['USD', 'AED', 'QAR', 'EGP', 'SAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP'])
  currency?: string; // Currency code, defaults to USD if not provided
}
