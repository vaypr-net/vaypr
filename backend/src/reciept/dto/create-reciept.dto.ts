import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ReceiptStatus } from '../enums/receipt-status.enum';

export class CreateReceiptDto {
  @IsMongoId()
  @IsOptional()
  clientId?: string;

  @IsMongoId()
  @IsOptional()
  invoiceId?: string;

  @IsString()
  @IsNotEmpty()
  receiptNumber: string;

  @IsEnum(ReceiptStatus)
  @IsOptional()
  status?: ReceiptStatus;

  @IsDateString()
  @IsNotEmpty()
  receiptDate: Date;

  @IsString()
  @IsNotEmpty()
  receivedFrom: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  currencySymbol?: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  receivedBy?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  companyAddress?: string;

  @IsString()
  @IsOptional()
  companyPhone?: string;

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
  titleColor?: string;

  @IsString()
  @IsOptional()
  amountColor?: string;
}

