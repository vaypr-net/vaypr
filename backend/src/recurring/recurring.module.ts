import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { Recurring, RecurringSchema } from './entities/recurring.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserprofileModule } from '../userprofile/userprofile.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recurring.name, schema: RecurringSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    CloudinaryModule,
    UserprofileModule,
    CommonModule,  // Import to access PlanLimitService
  ],
  controllers: [RecurringController],
  providers: [RecurringService, JwtAuthGuard],
  exports: [RecurringService],
})
export class RecurringModule {}
