import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { LoginModule } from './login/login.module';
import { UserprofileModule } from './userprofile/userprofile.module';
import { SuperadminSettingsModule } from './superadmin-settings/superadmin-settings.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ClientsModule } from './clients/clients.module';
import { InvoiceModule } from './invoice/invoice.module';
import { QuotesModule } from './quotes/quotes.module';
import { RecieptModule } from './reciept/reciept.module';
import { RecurringModule } from './recurring/recurring.module';
import { ExpenseModule } from './expense/expense.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GmailModule } from './gmail/gmail.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { TicketsModule } from './tickets/tickets.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { BillingPlanModule } from './billing-plan/billing-plan.module';
import { TranscationsModule } from './transcations/transcations.module';
import { BrevoModule } from './brevo/brevo.module';
import { EmailModule } from './email/email.module';

import { SocialLinksModule } from './social-links/social-links.module';
import { FaqsModule } from './faqs/faqs.module';
import { LandingPageModule } from './landing-page/landing-page.module';
import { SupportPagesModule } from './support-pages/support-pages.module';
import { CorporatePagesModule } from './corporate-pages/corporate-pages.module';
import { ActivityModule } from './activity/activity.module';
import { BillingModule } from './billing/billing.module';
import { SuperAdminOverviewModule } from './super-admin-overview/super-admin-overview.module';
import { SuperAdminReportsModule } from './super-admin-reports/super-admin-reports.module';
import { SuperAdminAuditModule } from './super-admin-audit/super-admin-audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/vaypr'),
    CloudinaryModule,
    UserModule,
    LoginModule,
    UserprofileModule,
    SuperadminSettingsModule,
    ClientsModule,
    InvoiceModule,
    QuotesModule,
    RecieptModule,
    RecurringModule,
    ExpenseModule,
    DashboardModule,
    GmailModule,
    AffiliateModule,
    TicketsModule,
    SubscribersModule,
    BillingPlanModule,
    TranscationsModule,
    BrevoModule,
    EmailModule,
   
    SocialLinksModule,
   
    FaqsModule,
   
    LandingPageModule,
   
    SupportPagesModule,
   
    CorporatePagesModule,
   
    ActivityModule,
    BillingModule,
    SuperAdminOverviewModule,
    SuperAdminReportsModule,
    SuperAdminAuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
