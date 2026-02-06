import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CorporatePageDocument = CorporatePage & Document;

export enum CorporatePageType {
  ABOUT = 'about',
  B2B = 'b2b',
  GUIDES = 'guides',
  CUSTOM = 'custom',
}

// Content Section Schema
class ContentSection {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 0 })
  order: number;
}

// Team Member Schema
class TeamMember {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  position: string;

  @Prop()
  bio: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: 0 })
  order: number;
}

// Feature/Service Item Schema
class ServiceFeature {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ default: 0 })
  order: number;
}

// CTA (Call to Action) Section Schema
class CTASection {
  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: 'Get in Touch' })
  title: string;

  @Prop({ required: true, default: 'Ready to take your business to the next level? Contact us today.' })
  description: string;

  @Prop({ required: true, default: 'Contact Us' })
  buttonText: string;

  @Prop({ required: true, default: '/contact' })
  buttonLink: string;
}

@Schema({ timestamps: true })
export class CorporatePage {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: CorporatePageType })
  type: CorporatePageType;

  @Prop({ required: true })
  metaDescription: string;

  @Prop({ required: true })
  icon: string;

  @Prop()
  heroTitle: string;

  @Prop()
  heroSubtitle: string;

  @Prop()
  heroImageUrl: string;

  @Prop({ type: [ContentSection], default: [] })
  sections: ContentSection[];

  @Prop({ type: [TeamMember], default: [] })
  teamMembers: TeamMember[];

  @Prop({ type: [ServiceFeature], default: [] })
  features: ServiceFeature[];

  @Prop({ type: CTASection })
  ctaSection: CTASection;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: true })
  showInFooter: boolean;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CorporatePageSchema = SchemaFactory.createForClass(CorporatePage);

// Separate Guide Schema (for file uploads)
export type GuideDocument = Guide & Document;

export enum FileType {
  PDF = 'pdf',
  IMAGE = 'image',
}

@Schema({ timestamps: true })
export class Guide {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: FileType })
  fileType: FileType;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true, default: true })
  published: boolean;

  @Prop({ default: 0 })
  downloads: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GuideSchema = SchemaFactory.createForClass(Guide);
