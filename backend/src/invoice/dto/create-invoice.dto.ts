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

  @ValidateNested()
  @Type(() => BillToDto)
  @IsNotEmpty()
  billTo: BillToDto;

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
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

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

  @IsDateString()
  @IsOptional()
  paidAt?: Date;

  @IsMongoId()
  @IsOptional()
  recurringId?: string;
}
