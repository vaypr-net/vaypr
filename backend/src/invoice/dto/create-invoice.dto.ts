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
  ValidateIf,
} from 'class-validator';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { PaymentMethodType } from '../enums/payment-method.enum';
import { InvoiceItemDto } from './invoice-item.dto';
import { BillToDto } from './bill-to.dto';
import { CompanyFooterDto } from './company-footer.dto';
import { BankAccountDto } from './bank-account.dto';

export class CreateInvoiceDto {
  @IsMongoId()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsDateString()
  @IsNotEmpty()
  issueDate: Date;

  @IsDateString()
  @IsNotEmpty()
  dueDate: Date;

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
          ? parsed.map(item => plainToInstance(InvoiceItemDto, item))
          : parsed;
      } catch {
        return value;
      }
    }
    return Array.isArray(value) 
      ? value.map(item => plainToInstance(InvoiceItemDto, item))
      : value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  @IsOptional()
  items?: InvoiceItemDto[];

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
  tax?: number;

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
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  showPaymentMethod?: boolean;

  @IsEnum(PaymentMethodType)
  @ValidateIf((o) => o.showPaymentMethod === true)
  @IsNotEmpty()
  paymentMethodType?: PaymentMethodType;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
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
  @ValidateIf((o) => o.showBankAccount === true)
  @IsNotEmpty()
  bankAccount?: BankAccountDto;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  showPaymentTerms?: boolean;

  @IsString()
  @ValidateIf((o) => o.showPaymentTerms === true)
  @IsNotEmpty()
  paymentTerms?: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  hideQuantity?: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  hideUnitPrice?: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  hideTotalCost?: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  hideSubTotal?: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
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

  @IsDateString()
  @IsOptional()
  paidAt?: Date;

  @IsMongoId()
  @IsOptional()
  recurringId?: string;
}
