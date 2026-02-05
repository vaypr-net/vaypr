import { IsString, IsEnum, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsEnum(['percentage', 'fixed'])
  discountType: string;

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @Type(() => Date)
  @IsDate()
  validFrom: Date;

  @Type(() => Date)
  @IsDate()
  validUntil: Date;

  @IsOptional()
  @IsString()
  linkedAffiliate?: string;
}
