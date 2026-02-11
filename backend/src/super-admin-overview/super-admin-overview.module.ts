import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdminOverviewController } from './super-admin-overview.controller';
import { SuperAdminOverviewService } from './super-admin-overview.service';
import { User, UserSchema } from '../user/entities/user.entity';
import { Ticket, TicketSchema } from '../tickets/entities/ticket.entity';
import { Transaction, TransactionSchema } from '../transcations/entities/transcation.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Transaction.name, schema: TransactionSchema },
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
  controllers: [SuperAdminOverviewController],
  providers: [SuperAdminOverviewService],
})
export class SuperAdminOverviewModule {}
