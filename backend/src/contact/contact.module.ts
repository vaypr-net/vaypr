import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactController } from './contact.controller';
import { SuperAdminSettings, SuperAdminSettingsSchema } from '../superadmin-settings/entities/superadmin-settings.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: SuperAdminSettings.name, schema: SuperAdminSettingsSchema },
    ]),
  ],
  controllers: [ContactController],
})
export class ContactModule {}
