import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CorporatePagesService } from './corporate-pages.service';
import { CorporatePagesController } from './corporate-pages.controller';
import { 
  CorporatePage, 
  CorporatePageSchema,
  Guide,
  GuideSchema
} from './entities/corporate-page.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CorporatePage.name, schema: CorporatePageSchema },
      { name: Guide.name, schema: GuideSchema },
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
  controllers: [CorporatePagesController],
  providers: [CorporatePagesService],
  exports: [CorporatePagesService],
})
export class CorporatePagesModule {}
