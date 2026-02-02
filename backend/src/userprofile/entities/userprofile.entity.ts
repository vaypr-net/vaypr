import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseEntity } from '../../common/entities/base.entity';

@Schema({ timestamps: true })
export class UserProfile extends BaseEntity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true })
  businessAddress: string;

  @Prop({ required: true, default: 'UTC' })
  timeZone: string;

  @Prop()
  profileImage: string;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
