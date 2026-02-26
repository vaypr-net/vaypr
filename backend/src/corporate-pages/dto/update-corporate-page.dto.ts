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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CorporatePageType } from '../entities/corporate-page.entity';
import { ContentSectionDto, TeamMemberDto, ServiceFeatureDto, CTASectionDto } from './create-corporate-page.dto';

export class UpdateCorporatePageDto {
  // NOTE: slug is intentionally NOT updated - it cannot be changed after creation
  // to preserve the page route. But we accept it from frontend and ignore it.
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  slug?: string; // Ignored in update - for compatibility with frontend

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  title?: string;

  @IsEnum(CorporatePageType)
  @IsOptional()
  @ApiPropertyOptional({ enum: CorporatePageType })
  type?: CorporatePageType;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  metaDescription?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  icon?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  heroTitle?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  heroSubtitle?: string;

  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'url' })
  heroImageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentSectionDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [ContentSectionDto] })
  sections?: ContentSectionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [TeamMemberDto] })
  teamMembers?: TeamMemberDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFeatureDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [ServiceFeatureDto] })
  features?: ServiceFeatureDto[];

  @ValidateNested()
  @Type(() => CTASectionDto)
  @IsOptional()
  @ApiPropertyOptional({ type: CTASectionDto })
  ctaSection?: CTASectionDto;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ type: Object })
  content?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  showInFooter?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  order?: number;
}
