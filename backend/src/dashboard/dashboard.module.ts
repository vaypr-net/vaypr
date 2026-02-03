import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { Quote, QuoteSchema } from '../quotes/entities/quote.entity';
import { Recurring, RecurringSchema } from '../recurring/entities/recurring.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { Expense, ExpenseSchema } from '../expense/entities/expense.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Recurring.name, schema: RecurringSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Expense.name, schema: ExpenseSchema },
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
  controllers: [DashboardController],
  providers: [DashboardService, JwtAuthGuard],
})
export class DashboardModule {}
