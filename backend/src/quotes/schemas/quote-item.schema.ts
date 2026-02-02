import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class QuoteItem {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  amount: number;
}
