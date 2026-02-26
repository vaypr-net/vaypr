import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { UserTicketsController } from './user-tickets.controller';
import { Ticket, TicketSchema } from './entities/ticket.entity';
import { UserprofileModule } from '../userprofile/userprofile.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
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
  ],
  controllers: [TicketsController, UserTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
