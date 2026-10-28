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
import { CommonModule } from '../common/common.module';
import { SubscriberDeletionService } from './subscriber-deletion.service';
import { SubscriberDeletion, SubscriberDeletionSchema } from './entities/subscriber-deletion.entity';
import { UserProfile, UserProfileSchema } from '../userprofile/entities/userprofile.entity';
import { Session, SessionSchema } from '../user/entities/session.entity';
import { Expense, ExpenseSchema } from '../expense/entities/expense.entity';
import { UserSender, UserSenderSchema } from '../sender/entities/user-sender.entity';
import { EmailSettings, EmailSettingsSchema } from '../email-settings/entities/email-settings.entity';
import { BrevoDomain, BrevoSchema } from '../brevo/entities/brevo.entity';
import { Notification, NotificationSchema } from '../notifications/notification.schema';
import { Ticket, TicketSchema } from '../tickets/entities/ticket.entity';
import { HesabeOrder, HesabeOrderSchema } from '../billing/entities/hesabe-order.entity';
import { Referral, ReferralSchema } from '../affiliate/entities/referral.entity';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Recurring.name, schema: RecurringSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: 'HesabeSandboxTransaction', schema: TransactionSchema, collection: 'hesabe_sandbox_transactions' },
      { name: SubscriberDeletion.name, schema: SubscriberDeletionSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: UserSender.name, schema: UserSenderSchema },
      { name: EmailSettings.name, schema: EmailSettingsSchema },
      { name: BrevoDomain.name, schema: BrevoSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: HesabeOrder.name, schema: HesabeOrderSchema },
      { name: Referral.name, schema: ReferralSchema },
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
  providers: [SubscribersService, CurrencyService, SubscriberDeletionService],
  exports: [SubscribersService],
})
export class SubscribersModule {}
