import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote, QuoteSchema } from './entities/quote.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UserModule } from '../user/user.module';
import { UserprofileModule } from '../userprofile/userprofile.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quote.name, schema: QuoteSchema },
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
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
    UserModule,  // Import UserModule first to ensure User model is available
    UserprofileModule,  // Import to access EmailNotificationService
    NotificationsModule,
    CommonModule,  // Import to access PlanLimitService
  ],
  controllers: [QuotesController],
  providers: [QuotesService, JwtAuthGuard],
  exports: [QuotesService],
})
export class QuotesModule {}
