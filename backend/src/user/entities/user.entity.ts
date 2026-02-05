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

  @Prop({ default: false })
  isSuperAdmin: boolean; // Super admin flag - only one super admin

  // Google OAuth tokens for Gmail API
  // These are ONLY set when user grants Gmail permission (gmail.send scope)
  // refresh_token is stored ONLY on first consent or re-consent
  @Prop({ required: false })
  googleAccessToken: string; // Short-lived access token (expires in 1 hour)

  @Prop({ required: false })
  googleRefreshToken: string; // Long-lived token for refreshing access (CRITICAL - never overwrite with null)

  @Prop({ required: false })
  googleTokenExpiry: Date; // When the access token expires
}

export const UserSchema = SchemaFactory.createForClass(User);
