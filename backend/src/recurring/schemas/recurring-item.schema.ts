import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class RecurringItem {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  rate: number;

  @Prop({ required: true })
  amount: number;
}
