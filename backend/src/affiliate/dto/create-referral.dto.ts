import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateReferralDto {
  @IsString()
  affiliateId: string;

  @IsString()
  subscriberId: string;

  @IsString()
  subscriberName: string;

  @IsString()
  plan: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  commission: number;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'paid', 'rejected'])
  status?: string;
}
