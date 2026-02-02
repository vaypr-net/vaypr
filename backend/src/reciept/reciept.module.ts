import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { RecieptService } from './reciept.service';
import { RecieptController } from './reciept.controller';
import { Receipt, ReceiptSchema } from './entities/reciept.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
    CloudinaryModule,
  ],
  controllers: [RecieptController],
  providers: [RecieptService],
  exports: [RecieptService],
})
export class RecieptModule {}
