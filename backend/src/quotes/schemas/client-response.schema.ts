import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ClientResponse {
  @Prop({ required: true })
  respondedAt: Date;

  @Prop({ required: true })
  action: string;

  @Prop()
  message: string;
}
