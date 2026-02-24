import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  IsEmail,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageType } from '../entities/support-page.entity';
import { ContactFormSettingsDto, ContentSectionDto } from './create-support-page.dto';

export class UpdateSupportPageDto {
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

  @IsEnum(PageType)
  @IsOptional()
  @ApiPropertyOptional({ enum: PageType })
  type?: PageType;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  metaDescription?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  icon?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentSectionDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [ContentSectionDto] })
  sections?: ContentSectionDto[];

  @ValidateNested()
  @Type(() => ContactFormSettingsDto)
  @IsOptional()
  @ApiPropertyOptional({ type: ContactFormSettingsDto })
  contactFormSettings?: ContactFormSettingsDto;

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
