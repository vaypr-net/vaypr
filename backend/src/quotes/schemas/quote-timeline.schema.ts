import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class QuoteTimelineEvent {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  message: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}
