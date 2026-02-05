import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Referral extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Affiliate', required: true })
  affiliateId: Types.ObjectId;

  @Prop({ required: true })
  affiliateName: string;

  @Prop({ required: true })
  subscriberId: string;

  @Prop({ required: true })
  subscriberName: string;

  @Prop({ required: true })
  plan: string;

  @Prop({ required: true })
  conversionDate: Date;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  commission: number;

  @Prop({ enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending' })
  status: string;

  @Prop()
  approvalDate?: Date;

  @Prop()
  payoutDate?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);
