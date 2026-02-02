import { IsOptional, IsString } from 'class-validator';

export class BankAccountDto {
  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  iban?: string;
}
