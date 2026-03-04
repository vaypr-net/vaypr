import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailSettings, EmailSettingsSchema } from './entities/email-settings.entity';
import { EmailSettingsService } from './email-settings.service';
import { EmailSettingsController } from './email-settings.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserSender, UserSenderSchema } from '../sender/entities/user-sender.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailSettings.name, schema: EmailSettingsSchema },
      { name: User.name, schema: UserSchema },
      { name: UserSender.name, schema: UserSenderSchema },
    ]),
  ],
  providers: [EmailSettingsService],
  controllers: [EmailSettingsController],
  exports: [EmailSettingsService],
})
export class EmailSettingsModule {}
