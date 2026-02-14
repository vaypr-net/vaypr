import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupportPageDocument = SupportPage & Document;

export enum PageType {
  CONTACT = 'contact',
  PRIVACY = 'privacy',
  REFUND = 'refund',
  TERMS = 'terms',
  ABOUT = 'about',
  B2B = 'b2b',
  CUSTOM = 'custom',
}

// Contact Form Settings Schema
class ContactFormSettings {
  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: 'support@vaypr.com' })
  recipientEmail: string;

  @Prop({ type: [String], default: ['General Inquiry', 'Technical Support', 'Billing Question', 'Partnership'] })
  subjectOptions: string[];

  @Prop({ required: true, default: 'We typically respond within 24 hours.' })
  responseMessage: string;
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

@Schema({ timestamps: true })
export class SupportPage {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: PageType })
  type: PageType;

  @Prop({ required: true })
  metaDescription: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ type: [ContentSection], default: [] })
  sections: ContentSection[];

  @Prop({ type: ContactFormSettings })
  contactFormSettings?: ContactFormSettings;

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

export const SupportPageSchema = SchemaFactory.createForClass(SupportPage);
