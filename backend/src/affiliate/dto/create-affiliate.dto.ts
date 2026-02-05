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
  @IsEnum(['Bronze', 'Silver', 'Gold', 'Platinum'])
  tier?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}
