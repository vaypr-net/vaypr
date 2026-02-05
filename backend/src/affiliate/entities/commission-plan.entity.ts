import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class CommissionPlan extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  subscriptionPlan: string;

  @Prop({ enum: ['percentage', 'fixed'], required: true })
  commissionType: string;

  @Prop({ required: true })
  commissionValue: number;

  @Prop()
  couponCode?: string;

  @Prop()
  couponDiscount?: number;

  @Prop({ default: 30 })
  cookieWindow: number;

  @Prop({ default: 0 })
  minPayout: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CommissionPlanSchema = SchemaFactory.createForClass(CommissionPlan);
