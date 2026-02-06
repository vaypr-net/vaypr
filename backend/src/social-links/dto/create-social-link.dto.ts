import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateSocialLinkDto {
  @IsString()
  platform: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;
}
