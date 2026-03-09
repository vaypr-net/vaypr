import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailRouterService } from './email-router.service';
import { EmailController } from './email.controller';
import { GmailModule } from '../gmail/gmail.module';
import { BrevoModule } from '../brevo/brevo.module';
import { UserModule } from '../user/user.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SenderModule } from '../sender/sender.module';
import { EmailSettingsModule } from '../email-settings/email-settings.module';
import { BrevoDomain, BrevoSchema } from '../brevo/entities/brevo.entity';

@Module({
  imports: [
    GmailModule,
    BrevoModule,
    UserModule,
    CloudinaryModule,
    SenderModule,
    EmailSettingsModule,
    MongooseModule.forFeature([{ name: BrevoDomain.name, schema: BrevoSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d') as any,
        },
      }),
    }),
  ],
  providers: [EmailRouterService],
  controllers: [EmailController],
  exports: [EmailRouterService],
})
export class EmailModule {}
