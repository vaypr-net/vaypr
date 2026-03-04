import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SenderService } from './sender.service';
import { SenderController } from './sender.controller';
import { UserSender, UserSenderSchema } from './entities/user-sender.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { BrevoDomain, BrevoSchema } from '../brevo/entities/brevo.entity';
import { EmailSettings, EmailSettingsSchema } from '../email-settings/entities/email-settings.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSender.name, schema: UserSenderSchema },
      { name: User.name, schema: UserSchema },
      { name: BrevoDomain.name, schema: BrevoSchema },
      { name: EmailSettings.name, schema: EmailSettingsSchema },
    ]),
  ],
  providers: [SenderService],
  controllers: [SenderController],
  exports: [SenderService],
})
export class SenderModule {}
