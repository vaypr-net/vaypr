import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SocialLinkDocument = SocialLink & Document;

@Schema({ timestamps: true })
export class SocialLink {
  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, default: 'Globe' })
  icon: string;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SocialLinkSchema = SchemaFactory.createForClass(SocialLink);
