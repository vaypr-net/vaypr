import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { BillingPlan, BillingPlanSchema } from '../billing-plan/entities/billing-plan.entity';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { Quote, QuoteSchema } from '../quotes/entities/quote.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { Receipt, ReceiptSchema } from '../reciept/entities/reciept.entity';
import { Recurring, RecurringSchema } from '../recurring/entities/recurring.entity';
import { Transaction, TransactionSchema } from '../transcations/entities/transcation.entity';
import { CurrencyService } from '../common/services/currency.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Recurring.name, schema: RecurringSchema },
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
  controllers: [SubscribersController],
  providers: [SubscribersService, CurrencyService],
  exports: [SubscribersService],
})
export class SubscribersModule {}
