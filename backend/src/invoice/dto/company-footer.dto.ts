import { IsOptional, IsString } from 'class-validator';

export class CompanyFooterDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  officePhone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  websiteEmail?: string;
}
