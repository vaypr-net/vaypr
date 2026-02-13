import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class UpdatePlanLimitsDto {
  @IsOptional()
  @IsNumber()
  invoices?: number;

  @IsOptional()
  @IsNumber()
  quotes?: number;

  @IsOptional()
  @IsNumber()
  clients?: number;

  @IsOptional()
  @IsNumber()
  teamMembers?: number;

  @IsOptional()
  @IsString()
  storage?: string;

  @IsOptional()
  @IsNumber()
  receipts?: number;

  @IsOptional()
  @IsNumber()
  recurringInvoices?: number;

  @IsOptional()
  @IsBoolean()
  expenseTracking?: boolean;

  @IsOptional()
  @IsString()
  invoiceTemplates?: string;

  @IsOptional()
  @IsNumber()
  domains?: number;

  @IsOptional()
  @IsBoolean()
  customEmailDomain?: boolean;
}

export class UpdateBillingPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(['monthly', 'yearly'])
  interval?: string;

  @IsOptional()
  @IsEnum(['active', 'hidden', 'archived'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdatePlanLimitsDto)
  limits?: UpdatePlanLimitsDto;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsNumber()
  subscriberCount?: number;

  @IsOptional()
  @IsObject()
  stripePrices?: Record<string, string>;
}
