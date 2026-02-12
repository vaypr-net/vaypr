import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CurrencyService {
  private conversionRates: Record<string, number> = {};

  constructor(private configService: ConfigService) {
    this.initializeRates();
  }

  private initializeRates() {
    // Load conversion rates from environment
    const usdToKwd = this.configService.get<number>('USD_TO_KWD_RATE', 0.31);
    
    this.conversionRates = {
      'USD_TO_KWD': usdToKwd,
      'KWD_TO_USD': 1 / usdToKwd, // Inverse rate
    };
  }

  /**
   * Convert price from one currency to another
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency (e.g., 'USD')
   * @param toCurrency - Target currency (e.g., 'KWD')
   */
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rateKey = `${fromCurrency}_TO_${toCurrency}`;
    const rate = this.conversionRates[rateKey];

    if (!rate) {
      console.warn(`Conversion rate not found for ${rateKey}, returning original amount`);
      return amount;
    }

    return Math.round(amount * rate * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get display currency from config
   */
  getDisplayCurrency(): string {
    return this.configService.get<string>('DISPLAY_CURRENCY', 'USD');
  }

  /**
   * Get default payment currency
   */
  getDefaultCurrency(): string {
    return this.configService.get<string>('DEFAULT_CURRENCY', 'USD');
  }

  /**
   * Convert USD amount to display currency (KWD)
   */
  convertToDisplayCurrency(usdAmount: number): number {
    const displayCurrency = this.getDisplayCurrency();
    return this.convert(usdAmount, 'USD', displayCurrency);
  }

  /**
   * Format price in display currency
   */
  formatPrice(usdAmount: number): string {
    const displayCurrency = this.getDisplayCurrency();
    const convertedAmount = this.convertToDisplayCurrency(usdAmount);
    return `${displayCurrency} ${convertedAmount.toFixed(2)}`;
  }
}
