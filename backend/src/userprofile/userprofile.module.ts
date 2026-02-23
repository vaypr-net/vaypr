import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserprofileService } from './userprofile.service';
import { UserprofileController } from './userprofile.controller';
import { UserProfile, UserProfileSchema } from './entities/userprofile.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { NotificationPreferencesHelper } from './notification-preferences.helper';
import { EmailNotificationService } from './email-notification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CloudinaryModule,
    UserModule, // Import UserModule to access UserService
    EmailModule, // Import EmailModule to access EmailRouterService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
      }),
    }),
  ],
  controllers: [UserprofileController],
  providers: [UserprofileService, NotificationPreferencesHelper, EmailNotificationService],
  exports: [NotificationPreferencesHelper, EmailNotificationService], // Export to use in other modules
})
export class UserprofileModule {}
