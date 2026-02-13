import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Ticket extends Document {
  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop()
  customerPhone?: string;

  @Prop({ enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  priority: string;

  @Prop({ enum: ['open', 'pending', 'in_progress', 'resolved', 'closed'], default: 'open' })
  status: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'Support Team' })
  assignedTo: string;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop({ type: [{ message: String, author: String, timestamp: Date }], default: [] })
  messages: Array<{ message: string; author: string; timestamp: Date }>;

  @Prop({ type: [{ note: String, author: String, timestamp: Date }], default: [] })
  internalNotes: Array<{ note: string; author: string; timestamp: Date }>;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

