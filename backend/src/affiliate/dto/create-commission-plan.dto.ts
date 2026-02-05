import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateCommissionPlanDto {
  @IsString()
  name: string;

  @IsString()
  subscriptionPlan: string;

  @IsEnum(['percentage', 'fixed'])
  commissionType: string;

  @IsNumber()
  commissionValue: number;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  couponDiscount?: number;

  @IsOptional()
  @IsNumber()
  cookieWindow?: number;

  @IsOptional()
  @IsNumber()
  minPayout?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
