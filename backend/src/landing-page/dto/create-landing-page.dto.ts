import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Hero Section DTO
export class HeroFeatureItemDto {
  @IsString()
  icon: string;

  @IsString()
  label: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class HeroSectionDto {
  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  subheadline?: string;

  @IsString()
  @IsOptional()
  primaryButtonText?: string;

  @IsString()
  @IsOptional()
  secondaryButtonText?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeroFeatureItemDto)
  @IsOptional()
  heroFeatures?: HeroFeatureItemDto[];
}

// Feature Item DTO
export class FeatureItemDto {
  @IsString()
  icon: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

// Features Section DTO
export class FeaturesSectionDto {
  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureItemDto)
  @IsOptional()
  features?: FeatureItemDto[];
}

// Stat Item DTO
export class StatItemDto {
  @IsString()
  icon: string;

  @IsString()
  value: string;

  @IsString()
  label: string;
}

// Stats Section DTO
export class StatsSectionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatItemDto)
  @IsOptional()
  stats?: StatItemDto[];
}

// How It Works Step DTO
export class HowItWorksStepDto {
  @IsString()
  number: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsNumber()
  @IsOptional()
  order?: number;
}

// How It Works Section DTO
export class HowItWorksSectionDto {
  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HowItWorksStepDto)
  @IsOptional()
  steps?: HowItWorksStepDto[];
}

// Testimonial Item DTO
export class TestimonialItemDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsString()
  avatar: string;

  @IsString()
  content: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  order?: number;
}

// Testimonials Section DTO
export class TestimonialsSectionDto {
  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestimonialItemDto)
  @IsOptional()
  testimonials?: TestimonialItemDto[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

// Pricing Plan DTO
export class PricingPlanDto {
  @IsString()
  name: string;

  @IsString()
  badge: string;

  @IsString()
  description: string;

  @IsString()
  monthlyPrice: string;

  @IsString()
  yearlyPrice: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsString()
  @IsOptional()
  cta?: string;

  @IsBoolean()
  @IsOptional()
  highlighted?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}

// Pricing Section DTO
export class PricingSectionDto {
  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingPlanDto)
  @IsOptional()
  plans?: PricingPlanDto[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  showYearlyToggle?: boolean;
}

// CTA Section DTO
export class CTASectionDto {
  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  primaryButtonText?: string;

  @IsString()
  @IsOptional()
  secondaryButtonText?: string;

  @IsString()
  @IsOptional()
  disclaimer?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

// Footer Link DTO
export class FooterLinkDto {
  @IsString()
  label: string;

  @IsString()
  href: string;
}

// Footer Section DTO
export class FooterSectionDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  copyright?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  @IsOptional()
  socialMediaLinks?: FooterLinkDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  @IsOptional()
  supportLinks?: FooterLinkDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  @IsOptional()
  corporateLinks?: FooterLinkDto[];

  @IsBoolean()
  @IsOptional()
  showSocialLinks?: boolean;
}

// Main Create DTO
export class CreateLandingPageDto {
  @ValidateNested()
  @Type(() => HeroSectionDto)
  @IsOptional()
  heroSection?: HeroSectionDto;

  @ValidateNested()
  @Type(() => FeaturesSectionDto)
  @IsOptional()
  featuresSection?: FeaturesSectionDto;

  @ValidateNested()
  @Type(() => StatsSectionDto)
  @IsOptional()
  statsSection?: StatsSectionDto;

  @ValidateNested()
  @Type(() => HowItWorksSectionDto)
  @IsOptional()
  howItWorksSection?: HowItWorksSectionDto;

  @ValidateNested()
  @Type(() => TestimonialsSectionDto)
  @IsOptional()
  testimonialsSection?: TestimonialsSectionDto;

  @ValidateNested()
  @Type(() => PricingSectionDto)
  @IsOptional()
  pricingSection?: PricingSectionDto;

  @ValidateNested()
  @Type(() => CTASectionDto)
  @IsOptional()
  ctaSection?: CTASectionDto;

  @ValidateNested()
  @Type(() => FooterSectionDto)
  @IsOptional()
  footerSection?: FooterSectionDto;
}
