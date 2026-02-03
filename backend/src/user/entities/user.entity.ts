import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '../../common/entities/base.entity';

@Schema({ timestamps: true })
export class User extends BaseEntity {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: false }) // Not required for Google OAuth users
  password: string;

  @Prop({ required: false })
  googleId: string; // Google OAuth user ID

  @Prop({ required: false })
  profilePicture: string; // Google profile picture URL

  @Prop({ default: 'manual' }) // 'manual' or 'google'
  authProvider: string;

  @Prop({ default: false })
  emailVerified: boolean; // Auto-verified for Google OAuth
}

export const UserSchema = SchemaFactory.createForClass(User);
