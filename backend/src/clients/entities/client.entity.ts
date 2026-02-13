import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';
import { ClientType } from '../enums/client-type.enum';

@Schema({ timestamps: true })
export class Client extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: String, enum: ClientType, required: true })
  clientType: ClientType;

  @Prop()
  company?: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  notes?: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Create unique compound index on userId + email
ClientSchema.index({ userId: 1, email: 1 }, { unique: true, sparse: true });
