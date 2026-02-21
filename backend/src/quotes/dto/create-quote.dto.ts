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
import { QuoteStatus } from '../enums/quote-status.enum';
import { PaymentMethodType } from '../../invoice/enums/payment-method.enum';
import { QuoteItemDto } from './quote-item.dto';
import { BillToDto } from '../../invoice/dto/bill-to.dto';
import { CompanyFooterDto } from '../../invoice/dto/company-footer.dto';
import { BankAccountDto } from '../../invoice/dto/bank-account.dto';

const parseBooleanField = ({ value, obj, key }: { value: any; obj?: Record<string, any>; key?: string }) => {
  const raw = key && obj ? obj[key] : value;

  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;

  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  }

  return !!raw;
};

export class CreateQuoteDto {
  @IsMongoId()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsNotEmpty()
  quoteNumber: string;

  @IsEnum(QuoteStatus)
  @IsOptional()
  status?: QuoteStatus;

  @IsDateString()
  @IsNotEmpty()
  quoteDate: string;

  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(BillToDto, parsed);
      } catch {
        return value;
      }
    }
    return plainToInstance(BillToDto, value);
  })
  @ValidateNested()
  @Type(() => BillToDto)
  @IsNotEmpty()
  billTo: BillToDto;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) 
          ? parsed.map(item => plainToInstance(QuoteItemDto, item))
          : parsed;
      } catch {
        return value;
      }
    }
    return Array.isArray(value) 
      ? value.map(item => plainToInstance(QuoteItemDto, item))
      : value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  @IsOptional()
  items?: QuoteItemDto[];

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  currencySymbol?: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsNotEmpty()
  total: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(CompanyFooterDto, parsed);
      } catch {
        return value;
      }
    }
    return plainToInstance(CompanyFooterDto, value);
  })
  @ValidateNested()
  @Type(() => CompanyFooterDto)
  @IsOptional()
  companyFooter?: CompanyFooterDto;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsNumber()
  @Min(0.1)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  logoScale?: number;

  @IsString()
  @IsOptional()
  tableHeaderColor?: string;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  showPaymentMethod?: boolean;

  @IsEnum(PaymentMethodType)
  @IsOptional()
  paymentMethodType?: PaymentMethodType;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  showBankAccount?: boolean;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(BankAccountDto, parsed);
      } catch {
        return value;
      }
    }
    return plainToInstance(BankAccountDto, value);
  })
  @ValidateNested()
  @Type(() => BankAccountDto)
  @IsOptional()
  bankAccount?: BankAccountDto;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  showPaymentTerms?: boolean;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  hideQuantity?: boolean;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  hideUnitPrice?: boolean;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  hideTotalCost?: boolean;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  hideSubTotal?: boolean;

  @IsBoolean()
  @Transform(parseBooleanField)
  @IsOptional()
  useManualGrandTotal?: boolean;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  manualGrandTotal?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paymentDetails?: string;

  @IsString()
  @IsOptional()
  shareToken?: string;
}
