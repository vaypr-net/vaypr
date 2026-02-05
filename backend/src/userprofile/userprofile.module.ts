import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserprofileService } from './userprofile.service';
import { UserprofileController } from './userprofile.controller';
import { UserProfile, UserProfileSchema } from './entities/userprofile.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserProfile.name, schema: UserProfileSchema }]),
    CloudinaryModule,
    UserModule, // Import UserModule to access UserService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
      }),
    }),
  ],
  controllers: [UserprofileController],
  providers: [UserprofileService],
})
export class UserprofileModule {}
