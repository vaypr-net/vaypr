import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BrevoService } from './brevo.service';
import { BrevoController } from './brevo.controller';
import { BrevoDomain, BrevoSchema } from './entities/brevo.entity';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: BrevoDomain.name, schema: BrevoSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        };
      },
    }),
  ],
  controllers: [BrevoController],
  providers: [BrevoService, SuperAdminGuard],
  exports: [BrevoService],
})
export class BrevoModule {}
