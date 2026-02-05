import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Coupon extends Document {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ enum: ['percentage', 'fixed'], required: true })
  discountType: string;

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 100 })
  usageLimit: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ type: Types.ObjectId, ref: 'Affiliate' })
  linkedAffiliate?: Types.ObjectId;

  @Prop({ enum: ['active', 'inactive', 'expired'], default: 'active' })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
