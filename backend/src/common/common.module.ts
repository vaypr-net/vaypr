import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CurrencyService } from './services/currency.service';

@Module({
  imports: [ConfigModule],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CommonModule {}
