import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateAffiliateDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  commissionPlanId?: string;

  @IsOptional()
  @IsString()
  tier?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}
