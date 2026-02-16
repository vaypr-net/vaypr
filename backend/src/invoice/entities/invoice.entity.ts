import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { PaymentMethodType } from '../enums/payment-method.enum';
import { InvoiceItem } from '../schemas/invoice-item.schema';
import { BillTo } from '../schemas/bill-to.schema';
import { CompanyFooter } from '../schemas/company-footer.schema';
import { BankAccount } from '../schemas/bank-account.schema';

@Schema({ timestamps: true })
export class Invoice extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ type: String, enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Prop({ required: true })
  issueDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: BillTo, required: true })
  billTo: BillTo;

  @Prop({ type: [InvoiceItem], default: [] })
  items: InvoiceItem[];

  @Prop({ required: true })
  currency: string;

  @Prop()
  currencySymbol: string;

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

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
  paidAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Recurring' })
  recurringId: Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Create a partial unique index on (userId, invoiceNumber) where isDeleted is false
// This allows duplicate invoice numbers across different users or for deleted invoices
InvoiceSchema.index(
  { userId: 1, invoiceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
