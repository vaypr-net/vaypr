import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';
import { RecurringFrequency } from '../enums/recurring-frequency.enum';
import { PaymentMethodType } from '../../invoice/enums/payment-method.enum';
import { RecurringItem } from '../schemas/recurring-item.schema';
import { CompanyFooter } from '../../invoice/schemas/company-footer.schema';
import { BankAccount } from '../../invoice/schemas/bank-account.schema';

@Schema({ timestamps: true })
export class Recurring extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({
    type: String,
    enum: RecurringFrequency,
    required: true,
  })
  frequency: RecurringFrequency;

  @Prop({ required: true })
  nextBillingDate: Date;

  @Prop({ type: [RecurringItem], default: [] })
  items: RecurringItem[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  lastGeneratedAt: Date;

  @Prop()
  logo: string;

  @Prop({ default: 1 })
  logoScale: number;

  @Prop({ default: false })
  showPaymentTerms: boolean;

  @Prop()
  paymentTerms: string;

  @Prop({ type: CompanyFooter })
  companyFooter: CompanyFooter;

  @Prop({ default: '#6366f1' })
  itemHeaderColor: string;

  @Prop({ type: String, enum: PaymentMethodType })
  paymentType: PaymentMethodType;

  @Prop({ default: false })
  showBankDetails: boolean;

  @Prop({ type: BankAccount })
  bankDetails: BankAccount;

  @Prop({ default: false })
  autoSendReminder: boolean;

  @Prop()
  autoEmailMessage: string;
}

export const RecurringSchema = SchemaFactory.createForClass(Recurring);
