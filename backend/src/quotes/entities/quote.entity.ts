import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';
import { QuoteStatus } from '../enums/quote-status.enum';
import { PaymentMethodType } from '../../invoice/enums/payment-method.enum';
import { QuoteItem } from '../schemas/quote-item.schema';
import { BillTo } from '../../invoice/schemas/bill-to.schema';
import { CompanyFooter } from '../../invoice/schemas/company-footer.schema';
import { BankAccount } from '../../invoice/schemas/bank-account.schema';
import { QuoteTimelineEvent } from '../schemas/quote-timeline.schema';
import { ClientResponse } from '../schemas/client-response.schema';

@Schema({ timestamps: true })
export class Quote extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  quoteNumber: string;

  @Prop({ type: String, enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Prop({ required: true })
  quoteDate: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ type: BillTo, required: true })
  billTo: BillTo;

  @Prop({ type: [QuoteItem], default: [] })
  items: QuoteItem[];

  @Prop({ required: true })
  currency: string;

  @Prop()
  currencySymbol: string;

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  deliveryFee: number;

  @Prop({ required: true })
  total: number;

  @Prop({ type: CompanyFooter })
  companyFooter: CompanyFooter;

  @Prop()
  logo: string;

  @Prop({ default: 1 })
  logoScale: number;

  @Prop({ default: '#000000' })
  tableHeaderColor: string;

  @Prop({ default: false })
  showPaymentMethod: boolean;

  @Prop({ type: String, enum: PaymentMethodType })
  paymentMethodType: PaymentMethodType;

  @Prop({ default: false })
  showBankAccount: boolean;

  @Prop({ type: BankAccount })
  bankAccount: BankAccount;

  @Prop({ default: false })
  showPaymentTerms: boolean;

  @Prop()
  paymentTerms: string;

  @Prop({ default: false })
  hideQuantity: boolean;

  @Prop({ default: false })
  hideUnitPrice: boolean;

  @Prop({ default: false })
  hideTotalCost: boolean;

  @Prop({ default: false })
  hideSubTotal: boolean;

  @Prop({ default: false })
  useManualGrandTotal: boolean;

  @Prop({ default: 0 })
  manualGrandTotal: number;

  @Prop()
  notes: string;

  @Prop()
  paymentDetails: string;

  @Prop({ unique: true, sparse: true })
  shareToken: string;

  @Prop()
  viewedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  convertedToInvoiceId: Types.ObjectId;

  @Prop({ type: [QuoteTimelineEvent], default: [] })
  timeline: QuoteTimelineEvent[];

  @Prop({ type: ClientResponse })
  clientResponse: ClientResponse;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

// Create a partial unique index on quoteNumber where isDeleted is false
// This allows duplicate quote numbers for deleted quotes
QuoteSchema.index(
  { quoteNumber: 1 },
  { 
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
);
