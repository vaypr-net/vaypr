import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  IsUrl,
  ValidateNested,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CorporatePageType } from '../entities/corporate-page.entity';

// Content Section DTO
export class ContentSectionDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

// Team Member DTO
export class TeamMemberDto {
  @IsString()
  name: string;

  @IsString()
  position: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

// Service Feature DTO
export class ServiceFeatureDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  icon: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

// CTA Section DTO
export class CTASectionDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  buttonText?: string;

  @IsString()
  @IsOptional()
  buttonLink?: string;
}

export class CreateCorporatePageDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsEnum(CorporatePageType)
  type: CorporatePageType;

  @IsString()
  metaDescription: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  heroTitle?: string;

  @IsString()
  @IsOptional()
  heroSubtitle?: string;

  @IsUrl()
  @IsOptional()
  heroImageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentSectionDto)
  @IsOptional()
  sections?: ContentSectionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  @IsOptional()
  teamMembers?: TeamMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFeatureDto)
  @IsOptional()
  features?: ServiceFeatureDto[];

  @ValidateNested()
  @Type(() => CTASectionDto)
  @IsOptional()
  ctaSection?: CTASectionDto;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  showInFooter?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}
