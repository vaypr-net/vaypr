import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { TwoFAService } from './twofa.service';
import { TwoFAController } from './twofa.controller';
import { UserModule } from '../user/user.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailModule } from '../email/email.module';
import { SuperadminSettingsModule } from '../superadmin-settings/superadmin-settings.module';
import { BrevoModule } from '../brevo/brevo.module';

@Module({
  imports: [
    UserModule,
    EmailModule,
    SuperadminSettingsModule,
    BrevoModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
  controllers: [LoginController, TwoFAController],
  providers: [LoginService, GoogleStrategy, TwoFAService],
})
export class LoginModule {}
