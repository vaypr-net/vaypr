// Currency formatting utility for VAYPR Admin
// Using Kuwaiti Dinar (KD) as the default currency

export function formatCurrency(value: number, options?: { decimals?: number }): string {
  const { decimals = 0 } = options || {};
  
  // Format the number with proper thousand separators
  const formatted = new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
  
  return `${formatted} KD`;
}

export const CURRENCY_CODE = "KWD";
export const CURRENCY_SYMBOL = "KD";
