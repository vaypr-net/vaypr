import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { LoginModule } from './login/login.module';
import { TwofaModule } from './twofa/twofa.module';
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
import { ContactModule } from './contact/contact.module';
import { SenderModule } from './sender/sender.module';
import { EmailSettingsModule } from './email-settings/email-settings.module';

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
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'backend/.env'),
        path.resolve(process.cwd(), '../.env'),
        path.resolve(process.cwd(), '../backend/.env'),
      ],
    }),
    // Register JwtModule globally so all modules share the same JWT config
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: { expiresIn: '7d' },
      }),
      global: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Temporary hardcoded URI — direct shard connection (bypasses DNS/SRV timeout)
        const HARDCODED_URI = 'mongodb://softwareforgeteam2_db_user:M8Gbq5CssbupvyZq@ac-wiz7uaj-shard-00-00.bi0zshe.mongodb.net:27017,ac-wiz7uaj-shard-00-01.bi0zshe.mongodb.net:27017,ac-wiz7uaj-shard-00-02.bi0zshe.mongodb.net:27017/test?ssl=true&replicaSet=atlas-126bpv-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
        const raw = HARDCODED_URI || configService.get<string>('MONGODB_URI');
        const defaultDb = configService.get<string>('MONGODB_DB') || 'test';

        if (!raw) {
          throw new Error(
            'MONGODB_URI environment variable is required! ' +
            'Local: Add MONGODB_URI=mongodb+srv://... to backend/.env ' +
            'Railway: Set MONGODB_URI in Railway dashboard Variables section'
          );
        }

        let uri = raw;

        // If MONGODB_URI doesn't include a database name, append the default DB
        try {
          const afterProto = raw.replace(/^mongodb(\+srv)?:\/\//i, '');
          const hostPart = afterProto.split('/')[0];
          const rest = afterProto.substring(hostPart.length); // starts with '/' or ''
          const hasDb = rest && rest.length > 1 && !rest.startsWith('/?');
          if (!hasDb) {
            if (raw.includes('?')) {
              uri = raw.replace('?', `/${defaultDb}?`);
            } else {
              uri = raw.endsWith('/') ? raw + defaultDb : raw + '/' + defaultDb;
            }
          }
        } catch (e) {
          // if parsing fails, use raw URI as-is
          uri = raw;
        }

        // Mask credentials for logs
        const masked = uri.replace(/(:\/\/)([^:]+):([^@]+)@/, '$1$2:*****@');
        console.log('🔗 MongoDB connected to:', masked);

        return {
          uri,
          serverSelectionTimeoutMS: 30000,
          connectTimeoutMS: 30000,
          family: 4,
        };
      },
    }),
    CloudinaryModule,
    UserModule,
    LoginModule,
    TwofaModule,
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
    ContactModule,
    SenderModule,
    EmailSettingsModule,
   
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
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
