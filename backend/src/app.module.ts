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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/vaypr'),
    CloudinaryModule,
    UserModule,
    LoginModule,
    UserprofileModule,
    SuperadminSettingsModule,
    ClientsModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
