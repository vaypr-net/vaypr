import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { Recurring, RecurringSchema } from './entities/recurring.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recurring.name, schema: RecurringSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
    CloudinaryModule,
  ],
  controllers: [RecurringController],
  providers: [RecurringService],
  exports: [RecurringService],
})
export class RecurringModule {}
