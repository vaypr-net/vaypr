import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote, QuoteSchema } from './entities/quote.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserprofileModule } from '../userprofile/userprofile.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quote.name, schema: QuoteSchema },
      { name: Client.name, schema: ClientSchema },
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
    CloudinaryModule,
    UserprofileModule,  // Import to access NotificationPreferencesHelper
  ],
  controllers: [QuotesController],
  providers: [QuotesService, JwtAuthGuard],
  exports: [QuotesService],
})
export class QuotesModule {}
