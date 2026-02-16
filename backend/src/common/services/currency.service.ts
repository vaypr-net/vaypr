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
    // Kuwait-based: Using AED as payment currency, KWD as display currency
    // Exact rate: 1 KWD = 11.97 AED, so 1 AED = 0.0835 KWD
    const aedToKwd = this.configService.get<number>('AED_TO_KWD_RATE', 0.0835);
    
    this.conversionRates = {
      'AED_TO_KWD': aedToKwd,
      'KWD_TO_AED': 1 / aedToKwd, // Inverse rate (11.97)
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
    return this.configService.get<string>('DISPLAY_CURRENCY', 'KWD');
  }

  /**
   * Get default payment currency
   */
  getDefaultCurrency(): string {
    return this.configService.get<string>('DEFAULT_CURRENCY', 'AED');
  }

  /**
   * Convert AED amount to display currency (KWD)
   */
  convertToDisplayCurrency(aedAmount: number): number {
    const displayCurrency = this.getDisplayCurrency();
    return this.convert(aedAmount, 'AED', displayCurrency);
  }

  /**
   * Format price in display currency (AED to KWD)
   */
  formatPrice(aedAmount: number): string {
    const displayCurrency = this.getDisplayCurrency();
    const convertedAmount = this.convertToDisplayCurrency(aedAmount);
    return `${displayCurrency} ${convertedAmount.toFixed(2)}`;
  }
}
