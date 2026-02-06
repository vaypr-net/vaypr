import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupportPagesService } from './support-pages.service';
import { SupportPagesController } from './support-pages.controller';
import { SupportPage, SupportPageSchema } from './entities/support-page.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportPage.name, schema: SupportPageSchema },
    ]),
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
  controllers: [SupportPagesController],
  providers: [SupportPagesService],
  exports: [SupportPagesService],
})
export class SupportPagesModule {}
