import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client, ClientSchema } from './entities/client.entity';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { Quote, QuoteSchema } from '../quotes/entities/quote.entity';
import { Recurring, RecurringSchema } from '../recurring/entities/recurring.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Recurring.name, schema: RecurringSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
      }),
    }),
    CommonModule,  // Import to access PlanLimitService
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
