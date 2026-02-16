/**
 * Currency Configuration for Frontend
 * Defines the default display currency and conversion rates
 */

export const CURRENCY_CONFIG = {
  // Display currency for pricing pages and dashboards
  displayCurrency: 'KWD',
  
  // Default payment currency (what Stripe charges)
  defaultPaymentCurrency: 'AED', // We charge in AED via Stripe
  
  // Conversion rate: 1 KWD = 11.97 AED (exact rate)
  // Therefore: 1 AED = 0.0835 KWD (for AED to KWD conversion)
  // 99 AED = 8.27 KWD
  conversionRate: 0.0835,
  
  // Supported currencies for payment selection (Arab countries only)
  supportedCurrencies: ['AED', 'QAR', 'EGP', 'SAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP'],
};

/**
 * Convert AED amount to display currency (KWD)
 */
export function convertToDisplayCurrency(aedAmount: number): number {
  if (typeof aedAmount !== 'number' || isNaN(aedAmount)) {
    return 0;
  }
  return Math.round(aedAmount * CURRENCY_CONFIG.conversionRate * 100) / 100;
}

/**
 * Format price in display currency
 */
export function formatPriceInDisplayCurrency(aedAmount: number): string {
  const converted = convertToDisplayCurrency(aedAmount);
  return `${CURRENCY_CONFIG.displayCurrency} ${(converted || 0).toFixed(2)}`;
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
