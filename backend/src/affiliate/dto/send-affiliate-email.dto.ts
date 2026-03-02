import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendAffiliateEmailDto {
  @IsString()
  @IsOptional()
  affiliateId?: string;

  @IsString()
  @IsOptional()
  referralId?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
