import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class BillTo {
  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop()
  area: string;

  @Prop()
  block: string;

  @Prop()
  street: string;

  @Prop()
  house: string;

  @Prop()
  other: string;
}
