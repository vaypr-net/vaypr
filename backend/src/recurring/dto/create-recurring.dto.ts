import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { RecurringFrequency } from '../enums/recurring-frequency.enum';
import { PaymentMethodType } from '../../invoice/enums/payment-method.enum';
import { RecurringItemDto } from './recurring-item.dto';
import { CompanyFooterDto } from '../../invoice/dto/company-footer.dto';
import { BankAccountDto } from '../../invoice/dto/bank-account.dto';

export class CreateRecurringDto {
  @IsMongoId()
  @IsNotEmpty()
  clientId: string;

  @IsEnum(RecurringFrequency)
  @IsNotEmpty()
  frequency: RecurringFrequency;

  @IsDateString()
  @IsNotEmpty()
  nextBillingDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringItemDto)
  @IsOptional()
  items?: RecurringItemDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  total: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsNumber()
  @Min(0.1)
  @IsOptional()
  logoScale?: number;

  @IsBoolean()
  @IsOptional()
  showPaymentTerms?: boolean;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ValidateNested()
  @Type(() => CompanyFooterDto)
  @IsOptional()
  companyFooter?: CompanyFooterDto;

  @IsString()
  @IsOptional()
  itemHeaderColor?: string;

  @IsEnum(PaymentMethodType)
  @IsOptional()
  paymentType?: PaymentMethodType;

  @IsBoolean()
  @IsOptional()
  showBankDetails?: boolean;

  @ValidateNested()
  @Type(() => BankAccountDto)
  @IsOptional()
  bankDetails?: BankAccountDto;
}

