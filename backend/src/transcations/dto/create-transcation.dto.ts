import {
  IsString,
  IsNumber,
  IsEnum,
  IsEmail,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateTranscationDto {
  @IsString()
  transactionId: string;

  @IsString()
  subscriberId: string;

  @IsString()
  subscriberName: string;

  @IsEmail()
  subscriberEmail: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(['subscription', 'refund', 'chargeback'])
  type: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsEnum(['succeeded', 'failed', 'refunded', 'pending'])
  @IsOptional()
  status?: string;

  @IsDateString()
  transactionDate: string;

  @IsString()
  plan: string;
}
