import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Affiliate extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' })
  tier: string;

  @Prop({ default: 0 })
  referrals: number;

  @Prop({ default: 0 })
  earnings: number;

  @Prop({ default: 0 })
  pending: number;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ default: Date.now })
  joinDate: Date;

  @Prop()
  lastPaymentDate?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AffiliateSchema = SchemaFactory.createForClass(Affiliate);
