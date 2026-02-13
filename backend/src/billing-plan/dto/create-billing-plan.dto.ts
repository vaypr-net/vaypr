import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PlanLimitsDto {
  @IsNumber()
  invoices: number;

  @IsNumber()
  quotes: number;

  @IsNumber()
  clients: number;

  @IsNumber()
  teamMembers: number;

  @IsString()
  storage: string;

  @IsNumber()
  receipts: number;

  @IsNumber()
  recurringInvoices: number;

  @IsBoolean()
  expenseTracking: boolean;

  @IsString()
  invoiceTemplates: string;

  @IsOptional()
  @IsNumber()
  domains?: number;

  @IsOptional()
  @IsBoolean()
  customEmailDomain?: boolean;
}

export class CreateBillingPlanDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(['monthly', 'yearly'])
  interval: string;

  @IsOptional()
  @IsEnum(['active', 'hidden', 'archived'])
  status?: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => PlanLimitsDto)
  limits: PlanLimitsDto;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsObject()
  stripePrices?: Record<string, string>;
}

