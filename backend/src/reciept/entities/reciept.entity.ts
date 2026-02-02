import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';
import { ReceiptStatus } from '../enums/receipt-status.enum';

@Schema({ timestamps: true })
export class Receipt extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  invoiceId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  receiptNumber: string;

  @Prop({ type: String, enum: ReceiptStatus, default: ReceiptStatus.DRAFT })
  status: ReceiptStatus;

  @Prop({ required: true })
  receiptDate: Date;

  @Prop({ required: true })
  receivedFrom: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  currencySymbol: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop()
  reason: string;

  @Prop()
  receivedBy: string;

  @Prop()
  companyName: string;

  @Prop()
  companyAddress: string;

  @Prop()
  companyPhone: string;

  @Prop()
  logo: string;

  @Prop({ default: 1 })
  logoScale: number;

  @Prop({ default: '#000000' })
  titleColor: string;

  @Prop({ default: '#000000' })
  amountColor: string;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);
