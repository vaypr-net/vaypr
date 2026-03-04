import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactController } from './contact.controller';
import { SuperAdminSettings, SuperAdminSettingsSchema } from '../superadmin-settings/entities/superadmin-settings.entity';
import { EmailSettingsModule } from '../email-settings/email-settings.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: SuperAdminSettings.name, schema: SuperAdminSettingsSchema },
    ]),
    EmailSettingsModule,
    EmailModule,
    UserModule,
  ],
  controllers: [ContactController],
})
export class ContactModule {}
