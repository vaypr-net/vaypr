import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TwofaService } from './twofa.service';
import { TwofaController } from './twofa.controller';
import { UserModule } from '../user/user.module';
import { TwoFAPendingGuard } from './guards/twofa-pending.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
      }),
    }),
    UserModule,
  ],
  providers: [TwofaService, TwoFAPendingGuard],
  controllers: [TwofaController],
  exports: [TwofaService],
})
export class TwofaModule {}
