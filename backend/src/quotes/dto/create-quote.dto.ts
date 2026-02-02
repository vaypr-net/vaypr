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
import { QuoteStatus } from '../enums/quote-status.enum';
import { PaymentMethodType } from '../../invoice/enums/payment-method.enum';
import { QuoteItemDto } from './quote-item.dto';
import { BillToDto } from '../../invoice/dto/bill-to.dto';
import { CompanyFooterDto } from '../../invoice/dto/company-footer.dto';
import { BankAccountDto } from '../../invoice/dto/bank-account.dto';

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
  quoteDate: Date;

  @IsDateString()
  @IsNotEmpty()
  validUntil: Date;

  @ValidateNested()
  @Type(() => BillToDto)
  @IsNotEmpty()
  billTo: BillToDto;

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
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  total: number;

  @ValidateNested()
  @Type(() => CompanyFooterDto)
  @IsOptional()
  companyFooter?: CompanyFooterDto;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsNumber()
  @Min(0.1)
  @IsOptional()
  logoScale?: number;

  @IsString()
  @IsOptional()
  tableHeaderColor?: string;

  @IsBoolean()
  @IsOptional()
  showPaymentMethod?: boolean;

  @IsEnum(PaymentMethodType)
  @IsOptional()
  paymentMethodType?: PaymentMethodType;

  @IsBoolean()
  @IsOptional()
  showBankAccount?: boolean;

  @ValidateNested()
  @Type(() => BankAccountDto)
  @IsOptional()
  bankAccount?: BankAccountDto;

  @IsBoolean()
  @IsOptional()
  showPaymentTerms?: boolean;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsBoolean()
  @IsOptional()
  hideQuantity?: boolean;

  @IsBoolean()
  @IsOptional()
  hideUnitPrice?: boolean;

  @IsBoolean()
  @IsOptional()
  hideTotalCost?: boolean;

  @IsBoolean()
  @IsOptional()
  hideSubTotal?: boolean;

  @IsBoolean()
  @IsOptional()
  useManualGrandTotal?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  manualGrandTotal?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paymentDetails?: string;
}

