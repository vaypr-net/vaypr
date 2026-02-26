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
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PageType } from '../entities/support-page.entity';

// Contact Form Settings DTO
export class ContactFormSettingsDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsEmail()
  @IsOptional()
  recipientEmail?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjectOptions?: string[];

  @IsString()
  @IsOptional()
  responseMessage?: string;
}

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

export class CreateSupportPageDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsEnum(PageType)
  type: PageType;

  @IsString()
  metaDescription: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentSectionDto)
  @IsOptional()
  sections?: ContentSectionDto[];

  @ValidateNested()
  @Type(() => ContactFormSettingsDto)
  @IsOptional()
  contactFormSettings?: ContactFormSettingsDto;

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
