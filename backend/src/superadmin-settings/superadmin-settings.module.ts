import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperadminSettingsService } from './superadmin-settings.service';
import { SuperadminSettingsController } from './superadmin-settings.controller';
import { SuperAdminSettings, SuperAdminSettingsSchema } from './entities/superadmin-settings.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SuperAdminSettings.name, schema: SuperAdminSettingsSchema }]),
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
      }),
    }),
  ],
  controllers: [SuperadminSettingsController],
  providers: [SuperadminSettingsService],
})
export class SuperadminSettingsModule {}
