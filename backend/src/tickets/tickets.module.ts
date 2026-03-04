import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { UserTicketsController } from './user-tickets.controller';
import { Ticket, TicketSchema } from './entities/ticket.entity';
import { UserprofileModule } from '../userprofile/userprofile.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { ActivityModule } from '../activity/activity.module';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  SuperAdminSettings,
  SuperAdminSettingsSchema,
} from '../superadmin-settings/entities/superadmin-settings.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
      { name: SuperAdminSettings.name, schema: SuperAdminSettingsSchema },
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
    UserprofileModule,  // Import to access NotificationPreferencesHelper
    NotificationsModule,
    EmailModule,
    ActivityModule,
  ],
  controllers: [TicketsController, UserTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
