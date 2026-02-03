import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecieptService } from './reciept.service';
import { RecieptController } from './reciept.controller';
import { Receipt, ReceiptSchema } from './entities/reciept.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Invoice.name, schema: InvoiceSchema },
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
    CloudinaryModule,
  ],
  controllers: [RecieptController],
  providers: [RecieptService, JwtAuthGuard],
  exports: [RecieptService],
})
export class RecieptModule {}
