import { Type, Transform, plainToInstance } from 'class-transformer';
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
  nextBillingDate: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return plainToInstance(RecurringItemDto, JSON.parse(value));
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringItemDto)
  @IsOptional()
  items?: RecurringItemDto[];

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  subtotal?: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  total: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  logo?: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.1)
  @IsOptional()
  logoScale?: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  showPaymentTerms?: boolean;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return plainToInstance(CompanyFooterDto, JSON.parse(value));
    }
    return value;
  })
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

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  showBankDetails?: boolean;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return plainToInstance(BankAccountDto, JSON.parse(value));
    }
    return value;
  })
  @ValidateNested()
  @Type(() => BankAccountDto)
  @IsOptional()
  bankDetails?: BankAccountDto;
}
