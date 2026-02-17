import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { User } from './user.entity';

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId | User;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  sessionToken: string;

  @Prop({ default: false })
  revoked: boolean;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
