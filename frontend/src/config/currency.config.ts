/**
 * Currency Configuration for Frontend
 * Defines the default display currency and conversion rates
 */

export const CURRENCY_CONFIG = {
  // Display currency for pricing pages and dashboards
  displayCurrency: 'KWD',
  
  // Default payment currency (what Stripe charges)
  defaultPaymentCurrency: 'USD',
  
  // Conversion rate: 1 USD = X KWD
  // Update this to match backend USD_TO_KWD_RATE
  conversionRate: 0.31,
  
  // Supported currencies for payment selection
  supportedCurrencies: ['USD', 'AED', 'QAR', 'EGP', 'SAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP'],
};

/**
 * Convert USD amount to display currency (KWD)
 */
export function convertToDisplayCurrency(usdAmount: number): number {
  return Math.round(usdAmount * CURRENCY_CONFIG.conversionRate * 100) / 100;
}

/**
 * Format price in display currency
 */
export function formatPriceInDisplayCurrency(usdAmount: number): string {
  const converted = convertToDisplayCurrency(usdAmount);
  return `${CURRENCY_CONFIG.displayCurrency} ${converted.toFixed(2)}`;
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    AED: 'د.إ',
    QAR: 'ر.ق',
    EGP: '£',
    SAR: 'ر.س',
    KWD: 'د.ك',
    BHD: 'ب.د',
    OMR: 'ر.ع.',
    JOD: 'د.ا',
    LBP: 'ل.ل',
  };
  return symbols[currency] || currency;
}
